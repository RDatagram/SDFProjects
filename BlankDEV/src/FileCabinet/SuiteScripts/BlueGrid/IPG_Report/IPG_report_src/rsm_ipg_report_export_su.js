/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount 
 */
define(['N/ui/serverWidget', 'N/search', 'N/file', 'N/render', 'N/encode', 'N/log', 'N/ui/message', 'N/http', 'N/util'],

  function (serverWidget, search, file, render, encode, log, message, http, util) {

    function ipgFinalSS(subsidiary, dateFrom, dateTo) {
      var finalSS = search.create({
        type: "transaction",
        filters:
          [
            ["createdfrom.type", "anyof", "SalesOrd"],
            "AND",
            ["taxline", "is", "F"],
            "AND",
            ["shipping", "is", "F"],
            "AND",
            ["subsidiary", "anyof", subsidiary],
            "AND",
            ["trandate", "within", dateFrom, dateTo]
          ],
        columns:
          [
            search.createColumn({
              name: "createdfrom",
              summary: "GROUP",
              label: "Created From"
            }),
            search.createColumn({
              name: "formulanumericprihod",
              summary: "SUM",
              formula: "(case when {posting} = 'T' and {accounttype} = 'Income' and {type} IN ('Cash Sale','Invoice') then {Amount} else 0 end)",
              label: "Prihod"
            }),
            search.createColumn({
              name: "formulanumericko",
              summary: "SUM",
              formula: "(case when {type} = 'Cash Sale' and {applyingtransaction.type} = 'Cash Refund' and {applyingtransaction.accounttype} = 'Income' then {Amount} else 0 end) + (case when {type} = 'Invoice' and {applyingtransaction.type} = 'Credit Memo' and {applyingtransaction.accounttype} = 'Income' then {applyingtransaction.amount} else 0 end)",
              label: "Knjizno odobrenje"
            }),
            search.createColumn({
              name: "formulanumericnvpr",
              summary: "SUM",
              formula: "case when {posting} = 'T' and {accounttype} = 'Cost of Goods Sold' and {type} IN ('Item Fulfillment') then {Amount} else 0 end",
              label: "Nabavna vrednost prodate robe"
            }),
            search.createColumn({
              name: "formulanumericpvvr",
              summary: "SUM",
              formula: "case when {type} IN ('Invoice') And {applyingtransaction.type} = 'Credit Memo' then {applyingtransaction.cogsAmount} when {type} in ('Cash Sale') And {applyingtransaction.type} = 'Cash Refund' then {applyingtransaction.cogsAmount} else 0 end",
              label: "Prosecna vrednost vracene robe"
            }),
            search.createColumn({
              name: "formulanumericrezultat",
              summary: "SUM",
              formula: "(case when {posting} = 'T' and {accounttype} = 'Income' and {type} IN ('Cash Sale','Invoice') then {Amount} else 0 end) - (case when {type} = 'Cash Sale' and {applyingtransaction.type} = 'Cash Refund' and {applyingtransaction.accounttype} = 'Income' then {Amount} else 0 end) + (case when {type} = 'Invoice' and {applyingtransaction.type} = 'Credit Memo' and {applyingtransaction.accounttype} = 'Income' then {applyingtransaction.amount} else 0 end) - (case when {posting} = 'T' and {accounttype} = 'Cost of Goods Sold' and {type} IN ('Item Fulfillment') then {Amount} else 0 end) - (case when {type} in ('Invoice') And {applyingtransaction.type} = 'Credit Memo' then {applyingtransaction.cogsAmount} when {type} in ('Cash Sale') And {applyingtransaction.type} = 'Cash Refund' then {applyingtransaction.cogsAmount} else 0 end)",
              label: "Rezultat"
            }),
            search.createColumn({
              name: "formulanumericpovrednost",
              summary: "SUM",
              formula: "case when {type} IN ('Purchase Order') and {accounttype} = 'Other Current Asset' and {applyingtransaction.type} = 'Item Receipt' then {amount} else 0 end",
              label: "PO vrednost"
            }),
            search.createColumn({
              name: "custbody_rsm_crm_ordernum",
              summary: "GROUP",
              label: "Broj narudžbenice"
            }),
            search.createColumn({
              name: "custbody_rsm_crm_ordernum_parent",
              summary: "GROUP",
              label: "Broj narudžbenice - parent"
            })
          ]
      });
      return finalSS.run();
    }

    function ipgFinalToObj(searchResults) {
      var obj = {};
      var results = [],
        start = 0,
        end = 1000;

      // This fixes the Results.each() limit of 4000 results
      while (true) {
        // getRange returns an array of Result objects
        var tempList = searchResults.getRange({
          start: start,
          end: end
        });

        if (tempList.length === 0) {
          break;
        }

        // Push tempList results into results array
        Array.prototype.push.apply(results, tempList);
        start += 1000;
        end += 1000;
      }
      util.each(results, function (result) {
        obj[result.getValue({ name: 'createdfrom', summary: 'GROUP' })] = {
          createdfrom: result.getText({ name: 'createdfrom', summary: 'GROUP' }),
          prihod: parseFloat(result.getValue({ name: 'formulanumericprihod', summary: 'SUM' })).toFixed(2),
          knjiznoodobrenje: parseFloat(result.getValue({ name: 'formulanumericko', summary: 'SUM' })).toFixed(2),
          nabavnavrednost: parseFloat(result.getValue({ name: 'formulanumericnvpr', summary: 'SUM' })).toFixed(2),
          prosecnavrednost: parseFloat(result.getValue({ name: 'formulanumericpvvr', summary: 'SUM' })).toFixed(2),
          rezultat: parseFloat(result.getValue({ name: 'formulanumericrezultat', summary: 'SUM' })).toFixed(2),
          povrednost: parseFloat(result.getValue({ name: 'formulanumericpovrednost', summary: 'SUM' })).toFixed(2),
          brojnarudzbenice: result.getValue({ name: 'custbody_rsm_crm_ordernum', summary: 'GROUP' }),
          brojnarudzbeniceparent: result.getValue({ name: 'custbody_rsm_crm_ordernum_parent', summary: 'group' })
        }
        return true;
      });
      return obj;
    }

    function ipgTroskoviIsporukeSS(subsidiary, dateFrom, dateTo) {
      var troskoviIsporukeSS = search.create({
        type: "salesorder",
        filters:
          [
            ["type", "anyof", "SalesOrd"],
            "AND",
            ["custrecord_rsm_courier_parcel_tran.custrecord_rsm_courier_parcel_service", "noneof", "@NONE@"],
            "AND",
            ["mainline", "is", "T"],
            "AND",
            ["subsidiary", "anyof", subsidiary],
            "AND",
            ["trandate", "within", dateFrom, dateTo]
          ],
        columns:
          [
            search.createColumn({ name: "entity", label: "Name" }),
            search.createColumn({
              name: "custrecord_rsm_courier_parcel_dc",
              join: "CUSTRECORD_RSM_COURIER_PARCEL_TRAN",
              label: "Delivery cost"
            }),
            search.createColumn({
              name: "custrecord_rsm_courier_parcel_id",
              join: "CUSTRECORD_RSM_COURIER_PARCEL_TRAN",
              label: "Parcel ID"
            }),
            search.createColumn({ name: "tranid", label: "Document Number" }),
            search.createColumn({
              name: "custrecord_rsm_courier_parcel_tran",
              join: "CUSTRECORD_RSM_COURIER_PARCEL_TRAN",
              label: "Transaction ID"
            })
          ]
      });
      return troskoviIsporukeSS.run();
    }

    function ipgTroskoviIsporukeToObj(searchResults) {
      var obj = {};
      var results = [],
        start = 0,
        end = 1000;

      // This fixes the Results.each() limit of 4000 results
      while (true) {
        // getRange returns an array of Result objects
        var tempList = searchResults.getRange({
          start: start,
          end: end
        });

        if (tempList.length === 0) {
          break;
        }

        // Push tempList results into results array
        Array.prototype.push.apply(results, tempList);
        start += 1000;
        end += 1000;
      }
      util.each(results, function (result) {
        obj[result.getValue({ name: 'custrecord_rsm_courier_parcel_id', join: 'CUSTRECORD_RSM_COURIER_PARCEL_TRAN' })] = {
          name: result.getValue({ name: 'entity' }),
          deliverycost: parseFloat(result.getValue({ name: 'custrecord_rsm_courier_parcel_dc', join: 'CUSTRECORD_RSM_COURIER_PARCEL_TRAN' })).toFixed(2),
          parcelid: result.getValue({ name: 'custrecord_rsm_courier_parcel_id', join: 'CUSTRECORD_RSM_COURIER_PARCEL_TRAN' }),
          documentnumber: result.getValue({ name: 'tranid' }),
          transactionid: result.getValue({ name: 'custrecord_rsm_courier_parcel_tran', join: 'CUSTRECORD_RSM_COURIER_PARCEL_TRAN' })
        }
        return true;
      });
      return obj;
    }

    function ipgVendorBillVarianceSS(subsidiary) {
      var billVarianceSS = search.create({
        type: "purchaseorder",
        filters:
          [
            ["type", "anyof", "PurchOrd"],
            "AND",
            ["subsidiary", "anyof", subsidiary]
          ],
        columns:
          [
            search.createColumn({
              name: "createdfrom",
              summary: "GROUP",
              label: "Created From"
            }),
            search.createColumn({
              name: "formulacurrencyvrnp",
              summary: "SUM",
              formula: "case when {applyingtransaction.type} = 'Item Receipt' then {applyingtransaction.amount} else 0 end",
              label: "Vrednost robe na prijemu"
            }),
            search.createColumn({
              name: "formulacurrencyvrnf",
              summary: "SUM",
              formula: "case when {applyingtransaction.type} = 'Bill' then {applyingtransaction.amount} else 0 end",
              label: "Vrednost robe na fakturi"
            }),
            search.createColumn({
              name: "formulacurrencyrazlika",
              summary: "SUM",
              formula: "case when {applyingtransaction.type} = 'Item Receipt' then {applyingtransaction.amount} else 0 end + case when {applyingtransaction.type} = 'Bill' then {applyingtransaction.amount} else 0 end",
              label: "Razlika"
            })
          ]
      });
      return billVarianceSS.run();
    }

    function ipgVendorBillVarianceToObj(searchResults) {
      var obj = {};
      var results = [],
        start = 0,
        end = 1000;

      // This fixes the Results.each() limit of 4000 results
      while (true) {
        // getRange returns an array of Result objects
        var tempList = searchResults.getRange({
          start: start,
          end: end
        });

        if (tempList.length === 0) {
          break;
        }

        // Push tempList results into results array
        Array.prototype.push.apply(results, tempList);
        start += 1000;
        end += 1000;
      }
      util.each(results, function (result) {
        var createdFrom = result.getValue({ name: 'createdfrom', summary: 'GROUP' });
        var createFromText = result.getText({ name: 'createdfrom', summary: 'GROUP'});
        var logObj = {
          createdFrom: createdFrom,
          createFromText: createFromText
        }
        if (createdFrom !== '' && createdFrom !== null) {
          obj[result.getValue({ name: 'createdfrom', summary: 'GROUP' })] = {
            createdfrom: result.getText({ name: 'createdfrom', summary: 'GROUP' }),
            vrednostrobenaprijemu: parseFloat(result.getValue({ name: 'formulacurrencyvrnp', summary: 'SUM' })).toFixed(2),
            vrednostrobenafakturi: parseFloat(result.getValue({ name: 'formulacurrencyvrnf', summary: 'SUM' })).toFixed(2),
            razlika: parseFloat(result.getValue({ name: 'formulacurrencyrazlika', summary: 'SUM' })).toFixed(2)
          }
        }
        return true;
      });
      return obj;
    }

    function mergeObjects(ipgFinal, ipgBillVariance, ipgTroskoviIsporuke) {
      var rows = [];
      var row = {};
      for (var key in ipgFinal) {
        row[key] = {};
        row[key].cenaIsporuke = 0;
        row[key].razlika = 0;
        row[key].rezultat = 0;
        row[key].salesOrderNumber = ipgFinal[key].createdfrom;
        row[key].brojNarudzbenice = ipgFinal[key].brojnarudzbenice;
        row[key].brojNarudzbeniceParent = ipgFinal[key].brojnarudzbeniceparent;
        row[key].prihod = ipgFinal[key].prihod;
        row[key].izdatoKnjiznoOdobrenje = ipgFinal[key].knjiznoodobrenje;
        row[key].nabavnaVrednost = ipgFinal[key].nabavnavrednost;
        row[key].prosecnaVrednost = ipgFinal[key].prosecnavrednost;
        row[key].poVrednost = ipgFinal[key].povrednost;
      }
      for (var key in ipgBillVariance) {
        if (row[key]) {
          row[key].razlika = ipgBillVariance[key].razlika;
        }
      }
      for (var key in ipgTroskoviIsporuke) {
        var transactionId = ipgTroskoviIsporuke[key].transactionid;
        if (row[transactionId]) {
          row[transactionId].cenaIsporuke += parseFloat(ipgTroskoviIsporuke[key].deliverycost);
        }
      }
      for (var key in row) {
        row[key].cenaIsporuke = parseFloat(row[key].cenaIsporuke).toFixed(2);
        var endResult = parseFloat(row[key].prihod) + parseFloat(row[key].izdatoKnjiznoOdobrenje) - parseFloat(row[key].nabavnaVrednost) - parseFloat(row[key].prosecnaVrednost) - parseFloat(row[key].cenaIsporuke) + parseFloat(row[key].razlika);
        row[key].rezultat = parseFloat(endResult).toFixed(2);
        rows.push(row[key]);
      }
      return rows;
    }


    // Suitelet entry point function
    function onRequest(context) {

      var subsidiary = context.request.parameters.subsidiary;
      var dateFrom = context.request.parameters.dateFrom;
      var dateTo = context.request.parameters.dateTo;
      // MAKE 3 OBJECTS WITH DATA FROM SAVED SEARCHES
      var ipgFinal = ipgFinalToObj(ipgFinalSS(subsidiary, dateFrom, dateTo));
      var ipgBillVariance = ipgVendorBillVarianceToObj(ipgVendorBillVarianceSS(subsidiary));
      var ipgTroskoviIsporuke = ipgTroskoviIsporukeToObj(ipgTroskoviIsporukeSS(subsidiary, dateFrom, dateTo));

      var fileTitle = "IPG_Report_" + dateFrom + '_' + dateTo;
      // MERGE THOSE 3 OBJECTS INTO 1
      var rows = mergeObjects(ipgFinal, ipgBillVariance, ipgTroskoviIsporuke);
      var jsonData = {
        rows: rows,
        fileTitle: fileTitle
      };
      var xmlTemplate = file.load({
        id: './ipg_report_templates/ipg_report_excel_template.xml'
      });
      var content = xmlTemplate.getContents();

      var templateRenderer = render.create();
      templateRenderer.templateContent = content;

      templateRenderer.addCustomDataSource({
        format: render.DataSource.JSON,
        alias: 'JSON',
        data: JSON.stringify(jsonData)
      });

      var xmlString = templateRenderer.renderAsString();

      var xlsFile = file.create({
        name: fileTitle + '.xls',
        fileType: file.Type.EXCEL,
        contents: encode.convert({
          string: xmlString,
          inputEncoding: encode.Encoding.UTF_8,
          outputEncoding: encode.Encoding.BASE_64
        })
      });
      context.response.writeFile(xlsFile);
    }
    return {
      onRequest: onRequest,
    };

  });