/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search', 'N/file', 'N/runtime', 'N/log', 'N/url', 'N/query'], function (record, search, file, runtime, log, url, query) {

  var counter = 0;

  function getDataRecordsCount() {
    var dataQuery = query.runSuiteQL({
      query: 'SELECT COUNT(id) FROM customrecord_rsm_so_list_data'
    });
    dataQuery.results[0].values[0];
  }

  function getDataId() {
    var dataQuery = query.runSuiteQL({
      query: 'SELECT id FROM customrecord_rsm_so_list_data'
    });
    return dataQuery.results;
  }

  /**
 * Generates readable datetime stamp at the moment of calling
 * @returns {string} Readable datetime format
 */
  function createdAt() {
    var d = new Date();

    var date = d.getDate(),
      month = d.getMonth() + 1,
      year = d.getFullYear(),
      hours = d.getHours(),
      minutes = d.getMinutes(),
      seconds = d.getSeconds();

    date = (date < 10) ? '0' + date : date;
    month = (month < 10) ? '0' + month : month;

    hours = (hours < 10) ? '0' + hours : hours;
    minutes = (minutes < 10) ? '0' + minutes : minutes;
    seconds = (seconds < 10) ? '0' + seconds : seconds;

    return date + '-' + month + '-' + year + ' ' + hours + ':' + minutes + ':' + seconds;
  }

  function getEntities() {
    var customerQuery = query.runSuiteQL({
      query: 'SELECT entityid FROM customer'
    });
    return customerQuery.results;
  }

  /**
   * Creates and runs transaction saved search
   * @returns {search.Search} Netsuite search.Search object encapsulation
   */
  function createSalesOrderSearch() {
    var salesorderSearchObj = search.create({
      type: "salesorder",
      filters:
        [
          ["type", "anyof", "SalesOrd"],
          "AND",
          ["mainline", "is", "F"],
          "AND",
          ["taxline", "is", "F"],
          "AND",
          ["shipping", "is", "F"]
        ],
      columns:
        [
          search.createColumn({
            name: "amount",
            summary: "SUM",
            label: "Amount"
          }),
          search.createColumn({
            name: "internalid",
            summary: "GROUP",
            label: "Internal ID"
          })
        ]
    });
    return salesorderSearchObj;
  }

  function getInputData() {

    var salesOrderSS = createSalesOrderSearch();

    var results = [],
      start = 0,
      end = 1000;

    while (true) {
      // getRange returns an array of Result objects
      var tempList = salesOrderSS.run().getRange({
        start: start,
        end: end
      });

      if (tempList.length === 0) {
        break;
      }

      // Push tempList results into newResults array
      Array.prototype.push.apply(results, tempList);
      start += 1000;
      end += 1000;
    }
    return results;
  }

  function map(context) {
    var hostUrl = 'https://system.netsuite.com'
    var result = JSON.parse(context.value);
    var values = result["values"];
    var recordId = values["GROUP(internalid)"][0].value;
    var soUrlToRecord = hostUrl + '/app/accounting/transactions/salesord.nl?id=' + recordId;

    var SORecord = record.load({
      type: record.Type.SALES_ORDER,
      id: recordId,
      isDynamic: true,
    });

    var transactionId = SORecord.getValue({
      fieldId: 'tranid'
    });

    var subsidiary = SORecord.getText({
      fieldId: 'subsidiary'
    });

    var location = SORecord.getText({
      fieldId: 'location'
    });

    var customer = SORecord.getValue({
      fieldId: 'entity'
    });

    var SOAmount = parseFloat(SORecord.getValue({
      fieldId: 'total'
    }));
    
    var soCommLineCount = SORecord.getLineCount({
      sublistId: 'messages'
    });

    var soSent;
    if (soCommLineCount === 0) {
      soSent = 'Ne'
    } else {
      soSent = 'Da'
    }

    var customerName = search.lookupFields({
      type: search.Type.CUSTOMER,
      id: customer,
      columns: ['companyname']
    })

    var status = SORecord.getText({
      fieldId: 'status'
    });
    var recordType = 'customsale_rsm_so_estimate'
    var soeQuery = query.runSuiteQL({
      query: 'SELECT id, tranid, memo, foreigntotal FROM transaction WHERE recordtype =? AND custbody_rsm_est_from_so =?',
      params: [recordType, recordId]
    });
    var soeResults = soeQuery.results;
    
    var salesOrderEstimates = [];
    for (var i = 0; i < soeResults.length; i++) {
      var soeId = soeResults[i].values[0];
      var documentNumber = soeResults[i].values[1];
      var memo = soeResults[i].values[2];
      var soeAmount = parseFloat(soeResults[i].values[3]);
      var urlToRecord = hostUrl + '/app/accounting/transactions/cutrsale.nl?id=' + soeId
      var soeObj = {
        id: soeId,
        documentNumber: documentNumber,
        memo: memo,
        urlToRecord: urlToRecord,
        soeAmount: soeAmount
      };
      salesOrderEstimates.push(soeObj);
    }

    var relatedRecordsLineCount = SORecord.getLineCount({
      sublistId: 'links'
    });
    var invoices = [];
    var customerDeposits = []
    for (var i = 0; i < relatedRecordsLineCount; i++) {
      var transactionType = SORecord.getSublistText({
        sublistId: 'links',
        fieldId: 'type',
        line: i
      });
      if (transactionType === 'Invoice' || transactionType === 'Customer Deposit') {
        var id = SORecord.getSublistValue({
          sublistId: 'links',
          fieldId: 'id',
          line: i
        });
        var documentNumber = SORecord.getSublistValue({
          sublistId: 'links',
          fieldId: 'tranid',
          line: i
        });
        var status = SORecord.getSublistValue({
          sublistId: 'links',
          fieldId: 'status',
          line: i
        });
        var amount = parseFloat(SORecord.getSublistValue({
          sublistId: 'links',
          fieldId: 'total',
          line: i
        }));
        

        if (transactionType === 'Invoice') {
          var urlToRecord = hostUrl + '/app/accounting/transactions/custinvc.nl?id=' + id;
        } else if (transactionType === 'Customer Deposit') {
          var urlToRecord = hostUrl + '/app/accounting/transactions/custdep.nl?id=' + id;
        }
        var relatedRecordObj = {
          id: id,
          documentNumber: documentNumber,
          status: status,
          transactionType: transactionType,
          urlToRecord: urlToRecord,
          amount: amount
        }
        if (relatedRecordObj.transactionType === 'Invoice') {
          invoices.push(relatedRecordObj);
        } else if (relatedRecordObj.transactionType === 'Customer Deposit') {
          customerDeposits.push(relatedRecordObj);
        }
      }
    }
    var invoiceSum = 0;
    for (var i = 0; i < invoices.length; i++) {
      invoiceSum += invoices[i].amount;
    }
    var soMinusInvoices = SOAmount - invoiceSum;
    soeMinusCustDep = []
    for (var j = 0; j < customerDeposits.length; j++) {
      var soeMinusCustomerDepositAmount = salesOrderEstimates[j].soeAmount - customerDeposits[j].amount;
      soeMinusCustDep.push(soeMinusCustomerDepositAmount);
    }
    var data = {
      recordId: recordId,
      transactionId: transactionId,
      soSent: soSent,
      soUrlToRecord: soUrlToRecord,
      subsidiary: subsidiary,
      location: location,
      customer: customer,
      customerName: customerName.companyname,
      status: status,
      salesOrderEstimates: salesOrderEstimates,
      invoices: invoices,
      customerDeposits: customerDeposits,
      soMinusInvoices: soMinusInvoices,
      soeMinusCustDep: soeMinusCustDep
    }

    context.write({
      key: data.recordId,
      value: data
    });
  }

  function reduce(context) {
    context.write({
      key: context.key,
      value: JSON.parse(context.values[0])
    });
  }

  function summarize(summary) {

    log.audit('inputSummary:Usage', summary.inputSummary.usage);
    log.audit('inputSummary:Seconds', summary.inputSummary.seconds);
    log.audit('inputSummary:Yields', summary.inputSummary.yields);
    log.error('inputSummary:Error', summary.inputSummary.error);

    log.audit('mapSummary:Usage', summary.mapSummary.usage);
    log.audit('mapSummary:Seconds', summary.mapSummary.seconds);
    log.audit('mapSummary:Yields', summary.mapSummary.yields);
    log.error('mapSummary:Errors', summary.mapSummary.errors);

    log.audit('Usage', summary.usage);
    log.audit('Seconds', summary.seconds);
    log.audit('Yields', summary.yields);

    // Grouping by tax item and calculating totals
    var groups = {};
    var allSO = []
    summary.output.iterator().each(function (key, value) {
      value = JSON.parse(value);
      allSO.push(value);
      if (groups[value.customer]) {
        groups[value.customer].push(value);
      } else {
        groups[value.customer] = [];
        groups[value.customer].push(value);
      }
      return true;
    });

    var createdAtStamp = createdAt();

    var recordsCount = getDataRecordsCount();

    if (recordsCount === 0) {
      //CREATING RECORD AND FILE FOR ALL SALES ORDER RECORDS
      var outputFileSvi = file.create({
        name: 'predracuni_svi.json',
        fileType: file.Type.JSON,
        contents: JSON.stringify(allSO),
        folder: file.load({
          id: './output_data/flagfile'
        }).folder
      });
      outputFileSvi.save();

      var sviFileId = file.load({
        id: './output_data/predracuni_svi.json'
      }).id;

      var sviRecord = record.create({
        type: 'customrecord_rsm_so_list_data'
      })

      sviRecord.setValue({
        fieldId: 'custrecord_description',
        value: 'Svi predracuni'
      });
      sviRecord.setValue({
        fieldId: 'custrecord_file_data',
        value: sviFileId
      });
      sviRecord.setValue({
        fieldId: 'custrecord_date_time_created',
        value: createdAtStamp
      });
      sviRecord.save();

      // CREATING RECORDS AND FILES FOR ALL SALES ORDER BY CUSTOMER
      for (var entityid in groups) {
        var outputFile = file.create({
          name: 'predracuni_' + entityid + '.json',
          fileType: file.Type.JSON,
          contents: JSON.stringify(groups[entityid]),
          folder: file.load({
            id: './output_data/flagfile'
          }).folder
        });
        outputFile.save();

        var outputFileId = file.load({
          id: './output_data/' + outputFile.name
        }).id;
        var newRecord = record.create({
          type: 'customrecord_rsm_so_list_data'
        });
        newRecord.setValue({
          fieldId: 'custrecord_description',
          value: groups[entityid][0].customerName
        });
        newRecord.setValue({
          fieldId: 'custrecord_file_data',
          value: outputFileId
        });
        newRecord.setValue({
          fieldId: 'custrecord_date_time_created',
          value: createdAtStamp
        });
        newRecord.setValue({
          fieldId: 'custrecord_customer_id',
          value: entityid
        });
        newRecord.save();
      }
    } else {  // IF THERE ARE ALREADY DATA RECORDS
      var dataRecordsArray = getDataId();
      for (var i = 0; i < dataRecordsArray.length; i++) {
        var dataRecord = record.load({
          type: 'customrecord_rsm_so_list_data',
          id: dataRecordsArray[i].values[0]
        })
        var currentDataFileId = dataRecord.getValue({
          fieldId: 'custrecord_file_data'
        });
        if (currentDataFileId) { //DELETE FILES
          file.delete({
            id: currentDataFileId
          });
        }
        var deletedId = record.delete({ // DELETE RECORDS
          type: 'customrecord_rsm_so_list_data',
          id: dataRecordsArray[i].values[0],
        });
      }
      //CREATING RECORD AND FILE FOR ALL SALES ORDER RECORDS
      var outputFileSvi = file.create({
        name: 'predracuni_svi.json',
        fileType: file.Type.JSON,
        contents: JSON.stringify(allSO),
        folder: file.load({
          id: './output_data/flagfile'
        }).folder
      });
      outputFileSvi.save();

      var sviFileId = file.load({
        id: './output_data/predracuni_svi.json'
      }).id;

      var sviRecord = record.create({
        type: 'customrecord_rsm_so_list_data'
      })

      sviRecord.setValue({
        fieldId: 'custrecord_description',
        value: 'Svi predracuni'
      });
      sviRecord.setValue({
        fieldId: 'custrecord_file_data',
        value: sviFileId
      });
      sviRecord.setValue({
        fieldId: 'custrecord_date_time_created',
        value: createdAtStamp
      });
      sviRecord.save();

      // CREATING RECORDS AND FILES FOR ALL SALES ORDER BY CUSTOMER
      for (var entityid in groups) {
        var outputFile = file.create({
          name: 'predracuni_' + entityid + '.json',
          fileType: file.Type.JSON,
          contents: JSON.stringify(groups[entityid]),
          folder: file.load({
            id: './output_data/flagfile'
          }).folder
        });
        outputFile.save();

        var outputFileId = file.load({
          id: './output_data/' + outputFile.name
        }).id;
        var newRecord = record.create({
          type: 'customrecord_rsm_so_list_data'
        });
        newRecord.setValue({
          fieldId: 'custrecord_description',
          value: groups[entityid][0].customerName
        });
        newRecord.setValue({
          fieldId: 'custrecord_file_data',
          value: outputFileId
        });
        newRecord.setValue({
          fieldId: 'custrecord_date_time_created',
          value: createdAtStamp
        });
        newRecord.setValue({
          fieldId: 'custrecord_customer_id',
          value: entityid
        });
        newRecord.save();
      }
    }
  }

  return {
    getInputData: getInputData,
    map: map,
    reduce: reduce,
    summarize: summarize
  };

});