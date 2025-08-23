/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search', 'N/file', 'N/runtime', 'N/log', 'N/url', 'N/query', 'N/format'], function (record, search, file, runtime, log, url, query, format) {

  var counter = 0;

  function getEmailStatusId(name) {

    var emailStatusQuery = query.runSuiteQL({
      query: 'SELECT id, name FROM customlist_rsm_email_schedule_status',
    });
    var results = emailStatusQuery.asMappedResults();
    for (var i = 0; i < results.length; i++) {
      if (results[i]['name'] === name) {
        return results[i]['id'];
      }
    }
  }

  function formatCurrency(value) {
    if (!value && value === '' && value === ' ') {
      return value;
    }
    var sign = '', decimalPart = '';
    try {
      sign = value.match(/\-/g)[0];
      value = value.replace(sign, '');
    } catch (error) {
    }
    try {
      decimalPart = value.match(/\..+/g)[0];
      value = value.replace(decimalPart, '');
    } catch (error) {
    }
    var newValue = '';
    for (var i = value.length - 1, j = 0; i >= 0; i--, j++) {
      if (j % 3 == 0) {
        newValue = newValue !== '' ? ',' + newValue : newValue;
        newValue = value[i] + newValue;
      } else {
        newValue = value[i] + newValue;
      }
    }
    return sign + newValue + decimalPart;
  }

  function sortArrays(first, second) {
    if (first.documentNumber > second.documentNumber) {
      return 1;
    }
    if (first.documentNumber < second.documentNumber) {
      return -1;
    }
    return 0;
  }

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
    var localTime = d.getTime();
    var offset = 540*60000;
    var budapestTime = localTime + offset;
    d = new Date(budapestTime);
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
      query: 'SELECT id, companyname FROM customer'
    });
    return customerQuery.results;
  }

  function getCustomersMapped(queryResults) {
    var mapped = {};
    if (queryResults.length > 0) {
      for (var i = 0; i < queryResults.length; i++) {
        mapped[queryResults[i].values[0]] = queryResults[i].values[1];
      }
    }
    return mapped;
  }

  /**
   * Creates and runs transaction saved search
   * @returns {search.Search} Netsuite search.Search object encapsulation
   */
  function createSalesOrderSearch(subsidiaryId, dateFrom, dateTo) {

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
          ["shipping", "is", "F"],
          "AND",
          ["subsidiary", "is", subsidiaryId],
          "AND",
          ["trandate", search.Operator.ONORBEFORE, dateTo],
          "AND",
          ["trandate", search.Operator.ONORAFTER, dateFrom]
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
    try {


      var script = runtime.getCurrentScript();

      var from = script.getParameter({
        name: 'custscript_pregled_predracuna_datefrom'
      });
      var to = script.getParameter({
        name: 'custscript_pregled_predracuna_dateto'
      });
      var subsidiaryId = script.getParameter({
        name: 'custscript_pregled_predracuna_subsidiary'
      });

      var salesOrderSS = createSalesOrderSearch(subsidiaryId, from, to);

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
    } catch (error) {
      log.error('ERROR', error);
    }
  }

  function map(context) {
    try {
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

      var soTranDate = SORecord.getText({
        fieldId: 'trandate'
      });

      var SOAmount = parseFloat(SORecord.getValue({
        fieldId: 'total'
      }));

      var sentEmailStatusId = getEmailStatusId('SENT');
      var currentEmailStatus = SORecord.getValue({
        fieldId: 'custbody_rsm_salesorder_email_status'
      });
      var soSent;
      if (sentEmailStatusId === parseInt(currentEmailStatus)) {
        soSent = 'Da'
      } else {
        soSent = 'Ne'
      }

      var customerName = search.lookupFields({
        type: search.Type.CUSTOMER,
        id: customer,
        columns: ['companyname']
      })

      var soStatus = SORecord.getText({
        fieldId: 'status'
      });
      var recordType = 'customsale_rsm_so_estimate'
      var soeQuery = query.runSuiteQL({
        query: 'SELECT id, tranid, memo, foreigntotal, trandate FROM transaction WHERE recordtype =? AND custbody_rsm_est_from_so =?',
        params: [recordType, recordId]
      });
      var soeResults = soeQuery.results;


      var salesOrderEstimates = [];
      for (var i = 0; i < soeResults.length; i++) {
        var soeId = soeResults[i].values[0];
        var soeRecord = record.load({
          type: 'customsale_rsm_so_estimate',
          id: soeId
        });

        var soeSentEmailStatusId = getEmailStatusId('SENT');
        var soeCurrentEmailStatus = soeRecord.getValue({
          fieldId: 'custbody_rsm_soe_email_status'
        });

        var soeSent;
        if (soeSentEmailStatusId === parseInt(soeCurrentEmailStatus)) {
          soeSent = 'Da'
        } else {
          soeSent = 'Ne'
        }

        var documentNumber = soeResults[i].values[1];
        var memo = soeResults[i].values[2];
        var soeAmount = parseFloat(soeResults[i].values[3]);
        var soeTranDate = soeResults[i].values[4];
        var urlToRecord = hostUrl + '/app/accounting/transactions/cutrsale.nl?id=' + soeId
        var soeObj = {
          id: soeId,
          documentNumber: documentNumber,
          soeSent: soeSent,
          memo: memo,
          urlToRecord: urlToRecord,
          soeAmount: soeAmount,
          soeTranDate: soeTranDate
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
          var transactionTranDate = SORecord.getSublistText({
            sublistId: 'links',
            fieldId: 'trandate',
            line: i
          })


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
            amount: amount,
            trandate: transactionTranDate
          }
          if (relatedRecordObj.transactionType === 'Invoice') {
            invoices.push(relatedRecordObj);
          } else if (relatedRecordObj.transactionType === 'Customer Deposit') {
            customerDeposits.push(relatedRecordObj);
          }
        }
      }

      try {
        salesOrderEstimates.sort(sortArrays);
        invoices.sort(sortArrays);
        customerDeposits.sort(sortArrays);
      } catch (error) {
        log.debug('ERROR', error);
      }

      var invoiceSum = 0;
      for (var i = 0; i < invoices.length; i++) {
        invoiceSum += invoices[i].amount;
      }
      var soMinusInvoices = SOAmount - invoiceSum;
      var soeMinusCustDep = []
      for (var j = 0; j < customerDeposits.length; j++) {
        if (salesOrderEstimates[j] && customerDeposits[j]) {
          var soeMinusCustomerDepositAmount = salesOrderEstimates[j].soeAmount - customerDeposits[j].amount;
          var temp = (soeMinusCustomerDepositAmount != 0) ? formatCurrency(parseFloat(soeMinusCustomerDepositAmount).toFixed(2)) : 0;
          soeMinusCustDep.push(temp);
        }
      }


      var data = {
        recordId: recordId,
        transactionId: transactionId,
        soSent: soSent,
        soTranDate: soTranDate,
        soUrlToRecord: soUrlToRecord,
        subsidiary: subsidiary,
        location: location,
        customer: customer,
        customerName: customerName.companyname,
        soStatus: soStatus,
        salesOrderEstimates: salesOrderEstimates,
        invoices: invoices,
        customerDeposits: customerDeposits,
        soMinusInvoices: (soMinusInvoices != 0) ? formatCurrency(parseFloat(soMinusInvoices).toFixed(2)) : 0,
        soeMinusCustDep: soeMinusCustDep
      }
    } catch (error) {
      log.debug("MAP ERROR", error);
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
    var currentScript = runtime.getCurrentScript();

    var subsidiaryName = currentScript.getParameter({
      name: 'custscript_pp_subsidiary_name'
    });
    var dateFrom = currentScript.getParameter({
      name: 'custscript_pregled_predracuna_datefrom'
    });
    var dateTo = currentScript.getParameter({
      name: 'custscript_pregled_predracuna_dateto'
    });
    dateFrom = format.parse({
      value: dateFrom,
      type: format.Type.DATE,
      timezone: format.Timezone.EUROPE_BUDAPEST
    });
    dateTo = format.parse({
      value: dateTo,
      type: format.Type.DATE,
      timezone: format.Timezone.EUROPE_BUDAPEST
    });
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
      sviRecord.setValue({
        fieldId: 'custrecord_so_data_subsidiary_name',
        value: subsidiaryName
      });
      sviRecord.setValue({
        fieldId: 'custrecord_so_data_date_from',
        value: dateFrom
      });
      sviRecord.setValue({
        fieldId: 'custrecord_so_data_date_to',
        value: dateTo
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
        newRecord.setValue({
          fieldId: 'custrecord_so_data_subsidiary_name',
          value: subsidiaryName
        });
        newRecord.setValue({
          fieldId: 'custrecord_so_data_date_from',
          value: dateFrom
        });
        newRecord.setValue({
          fieldId: 'custrecord_so_data_date_to',
          value: dateTo
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
      sviRecord.setValue({
        fieldId: 'custrecord_so_data_subsidiary_name',
        value: subsidiaryName
      });
      sviRecord.setValue({
        fieldId: 'custrecord_so_data_date_from',
        value: dateFrom
      });
      sviRecord.setValue({
        fieldId: 'custrecord_so_data_date_to',
        value: dateTo
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
        newRecord.setValue({
          fieldId: 'custrecord_so_data_subsidiary_name',
          value: subsidiaryName
        });
        newRecord.setValue({
          fieldId: 'custrecord_so_data_date_from',
          value: dateFrom
        });
        newRecord.setValue({
          fieldId: 'custrecord_so_data_date_to',
          value: dateTo
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