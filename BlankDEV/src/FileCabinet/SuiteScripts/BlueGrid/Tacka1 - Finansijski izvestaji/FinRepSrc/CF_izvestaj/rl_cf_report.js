/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 */
define(
  ['N/record', 'N/search', 'N/file', 'N/format', 'N/query', 'N/log', '../dateUtil', 'N/render', 'N/encode', 'N/util'],
  function (record, search, file, format, query, log, dateUtil, render, encode, util) {

    var dUtil = dateUtil.dateUtil;
    var cfScheme = {};
    var allTransactions = {};

    function logger(str) {
      str.match(/.{1,3000}/g).forEach(function (smallString, idx) {
        log.debug('Part ' + idx, smallString);
      });
    }

    function getAddressAndName(subsidiaryId) {
      var subsidiaryRecord = record.load({
        type: record.Type.SUBSIDIARY,
        id: subsidiaryId,
        isDynamic: true
      });

      var legalName = subsidiaryRecord.getValue('legalname');

      var mainAddressSubrecord = subsidiaryRecord.getSubrecord('mainaddress');
      var zip = mainAddressSubrecord.getValue({
        fieldId: 'zip'
      });
      var streetAndNumber = mainAddressSubrecord.getText({
        fieldId: 'addr1'
      });
      var country = mainAddressSubrecord.getText({
        fieldId: 'country'
      });
      var city = mainAddressSubrecord.getText({
        fieldId: 'city'
      });
      var address = streetAndNumber + ' ' + city + ' ' + zip + ' ' + country;

      return {
        address: address,
        name: legalName
      };
    }

    function fixConditionalAops(cfScheme) {
      if (cfScheme['_3015']["current_year"] < 0) {
        cfScheme['_3015']["current_year"] = 0
      }
      if (cfScheme['_3015']["last_year"] < 0) {
        cfScheme['_3015']["last_year"] = 0
      }

      if (cfScheme['_3016']["current_year"] < 0) {
        cfScheme['_3016']["current_year"] = 0
      }
      if (cfScheme['_3016']["last_year"] < 0) {
        cfScheme['_3016']["last_year"] = 0
      }

      if (cfScheme['_3027']["current_year"] < 0) {
        cfScheme['_3027']["current_year"] = 0
      }
      if (cfScheme['_3027']["last_year"] < 0) {
        cfScheme['_3027']["last_year"] = 0
      }

      if (cfScheme['_3028']["current_year"] < 0) {
        cfScheme['_3028']["current_year"] = 0
      }
      if (cfScheme['_3028']["last_year"] < 0) {
        cfScheme['_3028']["last_year"] = 0
      }

      if (cfScheme['_3046']["current_year"] < 0) {
        cfScheme['_3046']["current_year"] = 0
      }
      if (cfScheme['_3046']["last_year"] < 0) {
        cfScheme['_3046']["last_year"] = 0
      }

      if (cfScheme['_3047']["current_year"] < 0) {
        cfScheme['_3047']["current_year"] = 0
      }
      if (cfScheme['_3047']["last_year"] < 0) {
        cfScheme['_3047']["last_year"] = 0
      }

      if (cfScheme['_3050']["current_year"] < 0) {
        cfScheme['_3050']["current_year"] = 0
      }
      if (cfScheme['_3050']["last_year"] < 0) {
        cfScheme['_3050']["last_year"] = 0
      }

      if (cfScheme['_3051']["current_year"] < 0) {
        cfScheme['_3051']["current_year"] = 0
      }
      if (cfScheme['_3051']["last_year"] < 0) {
        cfScheme['_3051']["last_year"] = 0
      }

      if (cfScheme['_3055']["last_year"] > 0) {
        cfScheme['_3052']["current_year"] = cfScheme['_3055']["last_year"];
      }

      return cfScheme;
    }

    function cfFirstSavedSearch(firstDate, lastDate, subsidiaryId) {
      var cfFirstStepSS = search.create({
        type: "transaction",
        filters:
          [
            ["accounttype", "anyof", "Bank"],
            "AND",
            ["accountingperiod.startdate", search.Operator.ONORBEFORE, lastDate],
            "AND",
            ["accountingperiod.startdate", search.Operator.ONORAFTER, firstDate],
            "AND",
            ["subsidiary", "anyof", subsidiaryId]
          ],
        columns:
          [
            search.createColumn({
              name: "ordertype",
              sort: search.Sort.ASC,
              label: "Order Type"
            }),
            search.createColumn({name: "amount", label: "Amount"}),
            search.createColumn({name: "creditamount", label: "Amount (Credit)"}),
            search.createColumn({name: "debitamount", label: "Amount (Debit)"}),
            search.createColumn({name: "internalid", label: "Internal ID"}),
            search.createColumn({
              name: "number",
              join: "account",
              label: "Number"
            })
          ]
      }).run();

      var transactions1CF = [];
      var arrayOfIds = [];
      var results = [],
        start = 0,
        end = 1000;

      while(true) {
        var tempList = cfFirstStepSS.getRange({
          start: start,
          end: end
        });

        if (tempList.length === 0) {
          break;
        }

        Array.prototype.push.apply(results, tempList);
        start += 1000;
        end += 1000;
      }
      util.each(results, function (result) {
        var amount = result.getValue({name: "amount"});
        var creditAmount = (result.getValue({name: "creditamount"})) ? parseFloat(result.getValue({name: "creditamount"})) : 0;
        var debitAmount = (result.getValue({name: "debitamount"})) ? parseFloat(result.getValue({name: "debitamount"})) : 0;
        var internalId = result.getValue({name: "internalid"});
        var accountNumber = result.getValue({name: "number", join: "account"});

        arrayOfIds.push('' + internalId);

        var obj = {
          amount: amount,
          creditAmount: creditAmount,
          debitAmount: debitAmount,
          internalId: internalId,
          accountNumber: accountNumber
        }
        if (!allTransactions[internalId]) {
          allTransactions[internalId] = [];
          allTransactions[internalId].push(obj);
        } else {
          allTransactions[internalId].push(obj);
        }
        transactions1CF.push(obj);
        return true;
      });
      return {
        transactions: transactions1CF,
        ids: arrayOfIds
      };
    }

    function cfSecondSavedSearch(internalIDFilter, subsidiaryId) {
      var transactions2CF = [];
      if (internalIDFilter.length !== 0) {
        internalIDFilter.unshift("anyof");
        internalIDFilter.unshift("internalid")
        log.debug('IDS', JSON.stringify(internalIDFilter));
        var cfSecondStepSS = search.create({
          type: "transaction",
          filters:
            [
              ["accounttype", "noneof", "Bank"],
              "AND",
              internalIDFilter,
              "AND",
              ["subsidiary", "anyof", subsidiaryId],
              "AND",
              [
                ["account.custrecord_rsm_aop_cf_credit_code", "noneof", "@NONE@"],
                "OR",
                ["account.custrecord_rsm_aop_cf_debit_code", "noneof", "@NONE@"]
              ]
            ],
          columns:
            [
              search.createColumn({
                name: "ordertype",
                sort: search.Sort.ASC,
                label: "Order Type"
              }),
              search.createColumn({name: "amount", label: "Amount"}),
              search.createColumn({name: "creditamount", label: "Amount (Credit)"}),
              search.createColumn({name: "debitamount", label: "Amount (Debit)"}),
              search.createColumn({name: "internalid", label: "Internal ID"}),
              search.createColumn({
                name: "custrecord_rsm_aop_cf_debit_code",
                join: "account",
                label: "AOP CF Debit"
              }),
              search.createColumn({
                name: "custrecord_rsm_aop_cf_credit_code",
                join: "account",
                label: "AOP CF Credit"
              }),
              search.createColumn({
                name: "number",
                join: "account",
                label: "Number"
              })
            ]
        }).run();

        var results = [],
          start = 0,
          end = 1000;

        while (true) {
          var tempList = cfSecondStepSS.getRange({
            start: start,
            end: end
          });

          if (tempList.length === 0) {
            break;
          }

          Array.prototype.push.apply(results, tempList);
          start += 1000;
          end += 1000;
        }

        util.each(results, function (result) {
          var amount = result.getValue({name: "amount"});
          var creditAmount = (result.getValue({name: "creditamount"})) ? parseFloat(result.getValue({name: "creditamount"})) : 0;
          var debitAmount = (result.getValue({name: "debitamount"})) ? parseFloat(result.getValue({name: "debitamount"})) : 0;
          var internalId = result.getValue({name: "internalid"});
          var accountNumber = result.getValue({name: "number", join: "account"});
          var cfDebitCode = result.getText({name: "custrecord_rsm_aop_cf_debit_code", join: "account"});
          var cfCreditCode = result.getText({name: "custrecord_rsm_aop_cf_credit_code", join: "account"});

          var obj = {
            amount: amount,
            creditAmount: creditAmount,
            debitAmount: debitAmount,
            internalId: internalId,
            accountNumber: accountNumber,
            cfDebitCode: cfDebitCode,
            cfCreditCode: cfCreditCode
          }
          /*if (cfDebitCode === '3007' || cfCreditCode === '3007') {
            log.debug('Test', JSON.stringify(obj));
          }*/
          if (!allTransactions[internalId]) {
            allTransactions[internalId] = [];
            allTransactions[internalId].push(obj);
          } else {
            allTransactions[internalId].push(obj);
          }
          transactions2CF.push(obj);
          return true;
        });
      }
      return transactions2CF;
    }

    //DONE
    function deleteOldLines(recordId) {
      var linesSavedSearch = search.create({
        'type': 'customrecord_rsm_cf_report_lines',
        filters: ['custrecord_rsm_cf_report_parent', 'is', recordId]
      });
      var linesSSInstance = linesSavedSearch.run().each(function (cfLine) {
        record['delete']({
          type: 'customrecord_rsm_cf_report_lines',
          id: cfLine.id
        })
        return true;
      });
    }

    //DONE
    // Reset of all the lines, deleting the ones that already exist - adding new lines with value 0
    function initializeLines(recordId) {
      deleteOldLines(recordId);

      var recordCFReport = record.load({
        type: 'customrecord_rsm_cf_report',
        id: recordId,
        isDynamic: true
      });

      var aopCodesSavedSearch = search.create({
        'type': 'customrecord_rsm_aop_cf_code',
        columns: ['name']
      });

      var result = aopCodesSavedSearch.run().each(function (aopCodeData) {

        recordCFReport.selectNewLine({
          sublistId: 'recmachcustrecord_rsm_cf_report_parent'
        });
        recordCFReport.setCurrentSublistValue({
          sublistId: 'recmachcustrecord_rsm_cf_report_parent',
          fieldId: 'custrecord_rsm_cfl_aop_code',
          value: aopCodeData.id
        });
        var zero = 0;
        recordCFReport.setCurrentSublistValue({
          sublistId: 'recmachcustrecord_rsm_cf_report_parent',
          fieldId: 'custrecord_rsm_cfl_cy_calculated',
          value: zero
        });
        recordCFReport.setCurrentSublistValue({
          sublistId: 'recmachcustrecord_rsm_cf_report_parent',
          fieldId: 'custrecord_rsm_cfl_cy_xml',
          value: zero
        });
        recordCFReport.setCurrentSublistValue({
          sublistId: 'recmachcustrecord_rsm_cf_report_parent',
          fieldId: 'custrecord_rsm_cfl_py_calculated',
          value: zero
        });
        recordCFReport.commitLine({
          sublistId: 'recmachcustrecord_rsm_cf_report_parent'
        });
        return true;
      });
      recordCFReport.save();
    }

    function calculateLines(recordId) {

      var recordCFReport = record.load({
        type: 'customrecord_rsm_cf_report',
        id: recordId,
        isDynamic: true
      });

      var periodOd = format.format({
        value: recordCFReport.getValue("custrecord_rsm_cf_report_period_od"),
        type: format.Type.DATE
      });
      var periodDo = format.format({
        value: recordCFReport.getValue("custrecord_rsm_cf_report_period_do"),
        type: format.Type.DATE
      });

      processData(periodOd, periodDo, recordCFReport);
    }

    function recalculateLines(recordId) {

      var recordCFReport = record.load({
        type: 'customrecord_rsm_cf_report',
        id: recordId,
        isDynamic: true
      });
      recalculateHelperFunction(recordCFReport);
    }

    function exportPdf(recordId) {

      var recordCFReport = record.load({
        type: 'customrecord_rsm_cf_report',
        id: recordId,
        isDynamic: true
      });

      var periodOd = format.format({
        value: recordCFReport.getValue("custrecord_rsm_cf_report_period_od"),
        type: format.Type.DATE
      });
      var periodDo = format.format({
        value: recordCFReport.getValue("custrecord_rsm_cf_report_period_do"),
        type: format.Type.DATE
      });
      var maticniBroj = recordCFReport.getText('custrecord_rsm_cf_report_maticni_broj');
      var sifraDelatnosti = recordCFReport.getText('custrecord_rsm_cf_report_sifra_del');
      var pib = recordCFReport.getText('custrecord_rsm_cf_report_pib');

      processDataForExportsOnly(recordCFReport);

      var renderer = render.create();
      var addressAndName = getAddressAndName(recordCFReport.getValue('custrecord_rsm_cf_report_subsidiary'));
      var jsonObj = {
        datum_od: srbDate(periodOd),
        datum_do: srbDate(periodDo),
        maticniBroj: maticniBroj,
        sifraDelatnosti: sifraDelatnosti,
        pib: pib,
        naziv: addressAndName.name,
        sediste: addressAndName.address,
        cfScheme: cfScheme
      };

      renderer.addCustomDataSource({
        format: render.DataSource.OBJECT,
        alias: "JSON",
        data: jsonObj
      });

      renderer.setTemplateByScriptId("CUSTTMPL_CASH_FLOW_HTML_PDF_TEMPLATE");
      var pdfFile = renderer.renderAsPdf();
      pdfFile.name = "Izvestaj o tokovima gotovine-" + srbDate(periodOd) + "-" + srbDate(periodDo) + ".pdf";

      // Delete the old pdf file if it already exists
      var oldFileId = recordCFReport.getValue("custrecord_rsm_cf_report_pdf_file");
      if (oldFileId) {
        file.delete({
          id: oldFileId
        });
        log.audit('Success', 'Old pdf file deleted!');
      }
      ;

      var newPdfFile = file.create({
        name: pdfFile.name,
        fileType: file.Type.PDF,
        contents: pdfFile.getContents(),
        folder: file.load({
          id: '../exports/flagfile'
        }).folder
      });
      var newPdfFileId = newPdfFile.save();
      log.audit('Success', "New pdf file created! ID:" + newPdfFileId);

      recordCFReport.setValue({
        fieldId: 'custrecord_rsm_cf_report_pdf_file',
        value: newPdfFileId
      });
      recordCFReport.save();
    }

    function exportXls(recordId) {

      var recordCFReport = record.load({
        type: 'customrecord_rsm_cf_report',
        id: recordId,
        isDynamic: true
      });

      var periodOd = format.format({
        value: recordCFReport.getValue("custrecord_rsm_cf_report_period_od"),
        type: format.Type.DATE
      });
      var periodDo = format.format({
        value: recordCFReport.getValue("custrecord_rsm_cf_report_period_do"),
        type: format.Type.DATE
      });
      var maticniBroj = recordCFReport.getText('custrecord_rsm_cf_report_maticni_broj');
      var sifraDelatnosti = recordCFReport.getText('custrecord_rsm_cf_report_sifra_del');
      var pib = recordCFReport.getText('custrecord_rsm_cf_report_pib');

      processDataForExportsOnly(recordCFReport);


      var jsonObj = {
        datum_od: srbDate(periodOd),
        datum_do: srbDate(periodDo),
        maticniBroj: maticniBroj,
        sifraDelatnosti: sifraDelatnosti,
        pib: pib,
        naziv: "",
        sediste: "",
        cfScheme: cfScheme
      };
      var xmlTemplate = file.load({id: '../finansijski_templates/cf_excel_template.xml'});
      var content = xmlTemplate.getContents();


      var renderer = render.create();
      renderer.templateContent = content;

      renderer.addCustomDataSource({
        format: render.DataSource.JSON,
        alias: "JSON",
        data: JSON.stringify(jsonObj)
      });

      var xmlString = renderer.renderAsString();

      var fileName = "Izvestaj o tokovima gotovine-" + srbDate(periodOd) + "-" + srbDate(periodDo) + ".xls";

      // Delete the old pdf file if it already exists
      var oldFileId = recordCFReport.getValue("custrecord_rsm_cf_report_xls_file");
      if (oldFileId) {
        file.delete({
          id: oldFileId
        });
        log.audit('Success', 'Old xls file deleted!');
      }
      ;


      var newXlsFile = file.create({
        name: fileName,
        fileType: file.Type.EXCEL,
        contents: encode.convert({
          string: xmlString,
          inputEncoding: encode.Encoding.UTF_8,
          outputEncoding: encode.Encoding.BASE_64
        }),
        folder: file.load({
          id: '../exports/flagfile'
        }).folder
      });
      var xlsFileId = newXlsFile.save();
      log.audit('Success', "New xls file created!");

      recordCFReport.setValue({
        fieldId: 'custrecord_rsm_cf_report_xls_file',
        value: xlsFileId
      });
      recordCFReport.save();
    }

    function exportXml(recordId) {

      var recordCFReport = record.load({
        type: 'customrecord_rsm_cf_report',
        id: recordId,
        isDynamic: true
      });

      var periodOd = format.format({
        value: recordCFReport.getValue("custrecord_rsm_cf_report_period_od"),
        type: format.Type.DATE
      });
      var periodDo = format.format({
        value: recordCFReport.getValue("custrecord_rsm_cf_report_period_do"),
        type: format.Type.DATE
      });

      processDataForExportsOnly(recordCFReport);

      var xmlString = createXMLString();
      var fileName = "Bilans uspeha-" + srbDate(periodOd) + "-" + srbDate(periodDo) + ".xml";
      // Delete the old xml file if it already exists
      var oldFileId = recordCFReport.getValue("custrecord_rsm_cf_report_xml_file");
      if (oldFileId) {
        file.delete({
          id: oldFileId
        });
        log.audit('Success', 'Old pdf file deleted!');
      }
      ;

      var newXmlFile = file.create({
        name: fileName,
        fileType: file.Type.XMLDOC,
        contents: xmlString,
        folder: file.load({
          id: '../exports/flagfile'
        }).folder
      });
      var newXmlFileId = newXmlFile.save();
      log.audit('Success', "New xml file created! ID:" + newXmlFileId);

      recordCFReport.setValue({
        fieldId: 'custrecord_rsm_cf_report_xml_file',
        value: newXmlFileId
      });
      recordCFReport.save();

    }

    function deletePdf(recordId) {
      var recordCFReport = record.load({
        type: 'customrecord_rsm_cf_report',
        id: recordId,
        isDynamic: true
      });

      var oldFileId = recordCFReport.getValue("custrecord_rsm_cf_report_pdf_file");
      if (oldFileId) {
        file.delete({
          id: oldFileId
        });
        log.audit('Success', 'Old pdf file deleted!');
      }
      ;
    }

    function deleteXml(recordId) {
      var recordCFReport = record.load({
        type: 'customrecord_rsm_cf_report',
        id: recordId,
        isDynamic: true
      });

      var oldFileId = recordCFReport.getValue("custrecord_rsm_cf_report_xml_file");
      if (oldFileId) {
        file.delete({
          id: oldFileId
        });
        log.audit('Success', 'Old xml file deleted!');
      }
      ;
    }

    function deleteXls(recordId) {
      var recordBSReport = record.load({
        type: 'customrecord_rsm_cf_report',
        id: recordId,
        isDynamic: true
      });

      var oldFileId = recordBSReport.getValue("custrecord_rsm_cf_report_xls_file");
      if (oldFileId) {
        file.delete({
          id: oldFileId
        });
        log.audit('Success', 'Old xls file deleted!');
      }
    }

    // Return date in format suitable for official financial reports in Serbia
    function srbDate(date) {
      if (date === "")
        return "";
      return dUtil.getDay(date) + "." + dUtil.getMonth(date) + "." + dUtil.getYear(date) + ".";
    }

    // FUNCTION TO ROUND VALUES IN WHOLE JSON FILE1
    function divideAndRoundValues() {
      for (var key in cfScheme) {
        cfScheme[key]["current_year"] = Math.round(cfScheme[key]["current_year"] / 1000);
        cfScheme[key]["last_year"] = Math.round(cfScheme[key]["last_year"] / 1000);
      }
    }

    // Calculate balances of fields containing accounts
    function setBalancesAccounts(obj1, obj2) {
      obj1.forEach(function (transaction) {
        var alreadyCalculated = false;
        if (transaction.cfDebitCode == 3007 && transaction.cfCreditCode == '') {
          var fixedAop = '';
          var transactionLinesArray = allTransactions[transaction.internalId];
          for (var i = 0; i < transactionLinesArray.length; i++) {
            var firstThreeDigits = ('' + transactionLinesArray[i].accountNumber).substring(0, 3);
            if (firstThreeDigits == 241) {
              fixedAop = '_3007';
              break;
            } else if (firstThreeDigits == 244) {
              fixedAop = '_3008';
              break;
            }
          }

          if (fixedAop === '') {
            fixedAop = '_3007'
          }
          cfScheme[fixedAop]["current_year"] += transaction.debitAmount;
          alreadyCalculated = true;
        }
        if (transaction.cfDebitCode === transaction.cfCreditCode) {
          try {
            var value = Math.abs(transaction.debitAmount - transaction.creditAmount);
            cfScheme['_' + transaction.cfCreditCode]["current_year"] += value;

            alreadyCalculated = true;
          } catch (error) {
            log.debug('ERROR', error);
            log.debug('POKUSAVA DA UPISE U', '_' + transaction.cfCreditCode);
            log.debug('A DEBIT CODE JE:', transaction.cfDebitCode)
          }

        }
        if (transaction.cfDebitCode && !alreadyCalculated) {
          cfScheme['_' + transaction.cfDebitCode]["current_year"] += transaction.debitAmount;
        }
        if (transaction.cfCreditCode && !alreadyCalculated) {
          cfScheme['_' + transaction.cfCreditCode]["current_year"] += transaction.creditAmount;
        }
      });

      obj2.forEach(function (transaction) {
        var alreadyCalculated = false;
        if (transaction.cfDebitCode == 3007 && transaction.cfCreditCode == '') {
          var fixedAop = '';
          var transactionLinesArray = allTransactions[transaction.internalId];
          for (var i = 0; i < transactionLinesArray.length; i++) {
            var firstThreeDigits = ('' + transactionLinesArray[i].accountNumber).substring(0, 3);
            if (firstThreeDigits == 241) {
              fixedAop = '_3007';
              break;
            } else if (firstThreeDigits == 244) {
              fixedAop = '_3008';
              break;
            }
          }
          if (fixedAop === '') {
            fixedAop = '_3007'
          }
          cfScheme[fixedAop]["last_year"] += transaction.debitAmount;
          alreadyCalculated = true;
        }

        if (transaction.cfDebitCode === transaction.cfCreditCode) {

          var value = Math.abs(transaction.debitAmount - transaction.creditAmount);
          cfScheme['_' + transaction.cfCreditCode]["last_year"] += value;
          alreadyCalculated = true;
        }

        if (transaction.cfDebitCode && !alreadyCalculated) {
          cfScheme['_' + transaction.cfDebitCode]["last_year"] += transaction.debitAmount;
        }
        if (transaction.cfCreditCode && !alreadyCalculated) {
          cfScheme['_' + transaction.cfCreditCode]["last_year"] += transaction.creditAmount;
        }
      });
      //logger(JSON.stringify(cfScheme));
    }

    // Calculate balances of fields containing aops
    function setBalancesAops() {
      for (var key in cfScheme) {
        if (cfScheme[key].hasOwnProperty("aops")) {
          var sum = 0, sum2 = 0;
          var aops = cfScheme[key]["aops"];
          for (var i = 0; i < aops.length; i++) {
            var result = aops[i].split(/\s/);
            var sign = result[0], aop = result[1];
            if (sign === "+") {
              sum += cfScheme["_" + aop]["current_year"];
              sum2 += cfScheme["_" + aop]["last_year"];
            } else {
              sum -= cfScheme["_" + aop]["current_year"];
              sum2 -= cfScheme["_" + aop]["last_year"];
            }

          }
          cfScheme[key]["current_year"] = sum;
          cfScheme[key]["last_year"] = sum2;
        }
      }
      cfScheme = fixConditionalAops(cfScheme);
    }

    function processDataForExportsOnly(record) {
      loadScheme();

      var NUMBER_OF_LINES_IN_CF_REPORT = record.getLineCount({
        sublistId: 'recmachcustrecord_rsm_cf_report_parent'
      });

      for (var i = 0; i < NUMBER_OF_LINES_IN_CF_REPORT; i++) {

        var aopCodeAtCurrentLine = record.getSublistText({
          sublistId: 'recmachcustrecord_rsm_cf_report_parent',
          fieldId: 'custrecord_rsm_cfl_aop_code',
          line: i
        });

        var xmlValueAtCurrentLine = record.getSublistValue({
          sublistId: 'recmachcustrecord_rsm_cf_report_parent',
          fieldId: 'custrecord_rsm_cfl_cy_xml',
          line: i
        });

        var prevYearValueAtCurrentLine = record.getSublistValue({
          sublistId: 'recmachcustrecord_rsm_cf_report_parent',
          fieldId: 'custrecord_rsm_cfl_py_calculated',
          line: i
        });

        key = '_' + aopCodeAtCurrentLine;
        cfScheme[key]["current_year"] = xmlValueAtCurrentLine;
        cfScheme[key]["last_year"] = prevYearValueAtCurrentLine;

      }
    }

    function processData(periodOd, periodDo, cfRecord) {
      loadScheme();

      var subsidiaryId = cfRecord.getValue({
        fieldId: 'custrecord_rsm_cf_report_subsidiary'
      })

      var periodOdLastYear = '01.01.' + (dUtil.getYear(periodOd) - 1);
      var periodDoLastYear = '31.12.' + (dUtil.getYear(periodOd) - 1);

      var transactionsPrethodnaGodina, transactionsTekucaGodina;
      var transactionsFirstStepPreviousYear, transactionsFirstStepCurrentYear;

      transactionsFirstStepCurrentYear = cfFirstSavedSearch(periodOd, periodDo, subsidiaryId)
      transactionsFirstStepPreviousYear = cfFirstSavedSearch(periodOdLastYear, periodDoLastYear, subsidiaryId);
      transactionsTekucaGodina = cfSecondSavedSearch(transactionsFirstStepCurrentYear.ids, subsidiaryId)
      transactionsPrethodnaGodina = cfSecondSavedSearch(transactionsFirstStepPreviousYear.ids, subsidiaryId);

      //logger(JSON.stringify(allTransactions));

      setBalancesAccounts(transactionsTekucaGodina, transactionsPrethodnaGodina);


      setBalancesAops();
      setBalancesAops();
      divideAndRoundValues();

      var NUMBER_OF_LINES_IN_CF_REPORT = cfRecord.getLineCount({
        sublistId: 'recmachcustrecord_rsm_cf_report_parent'
      });

      for (var i = 0; i < NUMBER_OF_LINES_IN_CF_REPORT; i++) {

        var aopTextAtCurrentLine = cfRecord.getSublistText({
          sublistId: 'recmachcustrecord_rsm_cf_report_parent',
          fieldId: 'custrecord_rsm_cfl_aop_code',
          line: i
        });

        var currentSublistLine = cfRecord.selectLine({
          sublistId: 'recmachcustrecord_rsm_cf_report_parent',
          line: i
        });
        cfRecord.setCurrentSublistValue({
          sublistId: 'recmachcustrecord_rsm_cf_report_parent',
          fieldId: 'custrecord_rsm_cfl_cy_calculated',
          value: cfScheme["_" + aopTextAtCurrentLine]["current_year"]
        });

        cfRecord.setCurrentSublistValue({
          sublistId: 'recmachcustrecord_rsm_cf_report_parent',
          fieldId: 'custrecord_rsm_cfl_cy_xml',
          value: cfScheme["_" + aopTextAtCurrentLine]["current_year"]
        });

        cfRecord.setCurrentSublistValue({
          sublistId: 'recmachcustrecord_rsm_cf_report_parent',
          fieldId: 'custrecord_rsm_cfl_py_calculated',
          value: cfScheme["_" + aopTextAtCurrentLine]["last_year"]
        });

        cfRecord.commitLine({
          sublistId: 'recmachcustrecord_rsm_cf_report_parent'
        });
      }
      cfRecord.save();
    }

    function recalculateHelperFunction(cfRecord) {
      loadScheme();

      var NUMBER_OF_LINES_IN_CF_REPORT = cfRecord.getLineCount({
        sublistId: 'recmachcustrecord_rsm_cf_report_parent'
      });

      for (var i = 0; i < NUMBER_OF_LINES_IN_CF_REPORT; i++) {

        var aopCodeAtCurrentLine = cfRecord.getSublistText({
          sublistId: 'recmachcustrecord_rsm_cf_report_parent',
          fieldId: 'custrecord_rsm_cfl_aop_code',
          line: i
        });

        var xmlValueAtCurrentLine = cfRecord.getSublistValue({
          sublistId: 'recmachcustrecord_rsm_cf_report_parent',
          fieldId: 'custrecord_rsm_cfl_cy_xml',
          line: i
        });

        cfScheme["_" + aopCodeAtCurrentLine]["current_year"] = xmlValueAtCurrentLine;
        cfScheme["_" + aopCodeAtCurrentLine]["last_year"] = 0;
      }
      setBalancesAops();
      setBalancesAops();

      for (var i = 0; i < NUMBER_OF_LINES_IN_CF_REPORT; i++) {

        var aopCodeAtCurrentLine = cfRecord.getSublistText({
          sublistId: 'recmachcustrecord_rsm_cf_report_parent',
          fieldId: 'custrecord_rsm_cfl_aop_code',
          line: i
        });

        var currentSublistLine = cfRecord.selectLine({
          sublistId: 'recmachcustrecord_rsm_cf_report_parent',
          line: i
        });

        cfRecord.setCurrentSublistValue({
          sublistId: 'recmachcustrecord_rsm_cf_report_parent',
          fieldId: 'custrecord_rsm_cfl_cy_xml',
          value: cfScheme["_" + aopCodeAtCurrentLine]["current_year"]
        });

        cfRecord.commitLine({
          sublistId: 'recmachcustrecord_rsm_cf_report_parent'
        });
      }
      cfRecord.save();
    }

    //DONE
    function loadScheme() {
      var file1 = file.load({
        id: "./cf_scheme.json"
      });
      cfScheme = JSON.parse(file1.getContents());
    }

    /// Create xml string with fields and values from cfScheme
    function createXMLString() {
      var xmlStr =
        "<Forma>" +
        "<Naziv>Bilans uspeha</Naziv>" +
        "<Atributi>" +
        "<Naziv>Bilans uspeha</Naziv>" +
        "<NumerickaPoljaForme xmlns:a='http://schemas.datacontract.org/2004/07/AppDef'>";

      var numerickaPoljaForme = "",
        tekstualnaPoljaForme = "";

      for (var key in cfScheme) {

        var numerickoPolje = "<a:NumerickoPolje>";
        numerickoPolje += "<a:Naziv>aop-" + key.substr(1) + "-5</a:Naziv>";
        numerickoPolje += "<a:Vrednosti>" + (cfScheme[key]["current_year"]).toString() + "</a:Vrednosti>";
        numerickoPolje += "</a:NumerickoPolje>";

        numerickaPoljaForme += numerickoPolje;

        numerickoPolje = "<a:NumerickoPolje>";
        numerickoPolje += "<a:Naziv>aop-" + key.substr(1) + "-6</a:Naziv>";
        numerickoPolje += "<a:Vrednosti>" + (cfScheme[key]["last_year"]).toString() + "</a:Vrednosti>";
        numerickoPolje += "</a:NumerickoPolje>";

        numerickaPoljaForme += numerickoPolje;

        var tekstualnoPolje = "<TekstualnoPolje>";
        tekstualnoPolje += "<Naziv>aop-" + key.substr(1) + "-4</Naziv>";
        tekstualnoPolje += "<Vrednosti/>";
        tekstualnoPolje += "</TekstualnoPolje>";
        tekstualnaPoljaForme += tekstualnoPolje;
      }

      xmlStr += numerickaPoljaForme;
      xmlStr += "</NumerickaPoljaForme>";
      xmlStr += "<TekstualnaPoljaForme>";
      xmlStr += tekstualnaPoljaForme;
      xmlStr += "</TekstualnaPoljaForme>";

      xmlStr += "</Atributi></Forma>";

      return xmlStr;
    }

    function doPost(requestBody) {

      var recordIdCFReport = requestBody.idCFReport;
      var action = requestBody.action;
      var retVal = {
        "result": "Error"
      };

      if (action == "init_lines") {
        initializeLines(recordIdCFReport);
        retVal = {
          "result": 'ok'
        }
      }
      if (action == "calc_lines") {
        calculateLines(recordIdCFReport);
        retVal = {
          "result": 'ok'
        }
      }
      if (action == "xml_file") {
        exportXml(recordIdCFReport);
        retVal = {
          "result": 'ok'
        }
      }
      if (action == "pdf_file") {
        exportPdf(recordIdCFReport);
        retVal = {
          "result": 'ok'
        }
      }
      if (action == "xls_file") {
        exportXls(recordIdCFReport);
        retVal = {
          "result": 'ok'
        }
      }
      if (action == "recalculate_lines") {
        recalculateLines(recordIdCFReport);
        retVal = {
          "result": 'ok'
        }
      }
      if (action == "delete_pdf") {
        deletePdf(recordIdCFReport);
        retVal = {
          "result": 'ok'
        }
      }
      if (action == "delete_xml") {
        deleteXml(recordIdCFReport);
        retVal = {
          "result": 'ok'
        }
      }
      if (action == "delete_xls") {
        deleteXls(recordIdCFReport);
        retVal = {
          "result": 'ok'
        }
      }
      if (action == "delete_lines") {
        deleteOldLines(recordIdCFReport);
        retVal = {
          "result": 'ok'
        }
      }
      return retVal;
    }

    return {
      post: doPost
    };

  });