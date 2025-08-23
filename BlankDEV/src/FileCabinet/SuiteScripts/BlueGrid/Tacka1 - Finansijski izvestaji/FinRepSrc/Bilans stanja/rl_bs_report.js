/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 */
define(
  ['N/record', 'N/search', 'N/file', 'N/format', 'N/query', 'N/log', '../dateUtil', 'N/render', 'N/encode', 'N/util'],
  function (record, search, file, format, query, log, dateUtil, render, encode, util) {

    var dUtil = dateUtil.dateUtil;
    var bsScheme = {};
    var messageToSend = {};

    var positiveAops = ['0001', '0004', '0005', '0006', '0007', '0008', '0010', '0011', '0012', '0013', '0014', '0015', '0016',
      '0017', '0019', '0020', '0021', '0022', '0023', '0024', '0025', '0026', '0027', '0028', '0029', '0032', '0033', '0034',
      '0035', '0036', '0037', '0039', '0040', '0041', '0042', '0043', '0045', '0046', '0047', '0049', '0050', '0051', '0052',
      '0053', '0054', '0055', '0056', '0057', '0058', '0060', '0413'];

    var negativeAops = ['0402', '0403', '0404', '0405', '0409', '0417', '0418', '0419', '0421', '0422', '0423',
      '0424', '0425', '0426', '0427', '0428', '0429', '0430', '0432', '0434', '0435', '0436', '0437', '0438', '0439', '0440',
      '0441', '0443', '0444', '0445', '0446', '0447', '0448', '0450', '0451', '0452', '0453', '0454', '0457'];

    var badlyCalculatedAops = [];


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

    function deleteOldLines(recordId) {
      var linesSavedSearch = search.create({
        'type': 'customrecord_rsm_bs_report_lines',
        filters: ['custrecord_rsm_bs_report_parent', 'is', recordId]
      });
      var linesSSInstance = linesSavedSearch.run().each(function (pl_line) {
        record['delete']({
          type: 'customrecord_rsm_bs_report_lines',
          id: pl_line.id
        })
        return true;
      });

    }

    function getAopsFromBU(subsidiaryId, onDate, BSRecord) {
      var tempData = {};
      var buReportId = BSRecord.getValue('custrecord_rsm_bs_report_bu_data');

      if (!buReportId) {
        var BUReportQuery = query.runSuiteQL({
          query: "SELECT id FROM customrecord_rsm_bu_report WHERE custrecord_rsm_bu_report_subsidiary = ? AND custrecord_rsm_bu_report_period_do = ?",
          params: [subsidiaryId, onDate]
        });
        if (BUReportQuery.results.length > 0) {
          buReportId = BUReportQuery.results[0].values[0]

          var aopIdsQuery = query.runSuiteQL({
            query: "SELECT id, name FROM customrecord_rsm_aop_bu_code  WHERE name IN (1055, 1056)"
          });
          var aopId1 = aopIdsQuery.results[0].values[0];
          var aopName1 = aopIdsQuery.results[0].values[1];
          var aopId2 = aopIdsQuery.results[1].values[0];
          var aopName2 = aopIdsQuery.results[1].values[1];
          tempData[aopId1] = {};
          tempData[aopId2] = {};
          tempData[aopId1].aopName = aopName1;
          tempData[aopId2].aopName = aopName2;

          var BULinesQuery = query.runSuiteQL({
            query: "SELECT custrecord_rsm_bul_aop_code, custrecord_rsm_bul_cy_calculated, custrecord_rsm_bul_py_calculated FROM customrecord_rsm_bu_report_lines WHERE custrecord_rsm_bu_report_parent = ? AND custrecord_rsm_bul_aop_code IN (" +aopId1 + ", " + aopId2 +")",
            params: [buReportId]
          });

          var aop1 = BULinesQuery.results[0].values[0];
          var currentYearValue1 = BULinesQuery.results[0].values[1];
          var previousYearValue1 = BULinesQuery.results[0].values[2];
          var aop2 = BULinesQuery.results[1].values[0];
          var currentYearValue2 = BULinesQuery.results[1].values[1];
          var previousYearValue2 = BULinesQuery.results[1].values[2];

          tempData[aop1].calculatedValue = currentYearValue1;
          tempData[aop1].previousYearValue = previousYearValue1;
          tempData[aop2].calculatedValue= currentYearValue2;
          tempData[aop2].previousYearValue = previousYearValue2;
          log.debug('AOPI IZ BU', JSON.stringify(tempData));

          return tempData;
        } else {
          messageToSend = {
            "message": "Ne postoji izgenerisan Bilans Uspeha za izabrani Subsidiary i datum!"
          }
        }
      } else {
        var aopIdsQuery = query.runSuiteQL({
          query: "SELECT id, name FROM customrecord_rsm_aop_bu_code  WHERE name IN (1055, 1056)"
        });
        var aopId1 = aopIdsQuery.results[0].values[0];
        var aopName1 = aopIdsQuery.results[0].values[1];
        var aopId2 = aopIdsQuery.results[1].values[0];
        var aopName2 = aopIdsQuery.results[1].values[1];
        tempData[aopId1] = {};
        tempData[aopId2] = {};
        tempData[aopId1].aopName = aopName1;
        tempData[aopId2].aopName = aopName2;

        var BULinesQuery = query.runSuiteQL({
          query: "SELECT custrecord_rsm_bul_aop_code, custrecord_rsm_bul_cy_calculated, custrecord_rsm_bul_py_calculated FROM customrecord_rsm_bu_report_lines WHERE custrecord_rsm_bu_report_parent = ? AND custrecord_rsm_bul_aop_code IN (" +aopId1 + ", " + aopId2 +")",
          params: [buReportId]
        });

        var aop1 = BULinesQuery.results[0].values[0];
        var currentYearValue1 = BULinesQuery.results[0].values[1];
        var previousYearValue1 = BULinesQuery.results[0].values[2];
        var aop2 = BULinesQuery.results[1].values[0];
        var currentYearValue2 = BULinesQuery.results[1].values[1];
        var previousYearValue2 = BULinesQuery.results[1].values[2];

        tempData[aop1].calculatedValue = currentYearValue1;
        tempData[aop1].previousYearValue = previousYearValue1;
        tempData[aop2].calculatedValue= currentYearValue2;
        tempData[aop2].previousYearValue = previousYearValue2;

        log.debug('AOPI IZ BU', JSON.stringify(tempData));
        return tempData;
      }
    }

    // Reset of all the lines, deleting the ones that already exist - adding new lines with value 0
    function initialize_lines(recordId) {
      deleteOldLines(recordId);

      var recordBSReport = record.load({
        type: 'customrecord_rsm_bs_report',
        id: recordId,
        isDynamic: true
      });

      var aopCodesSavedSearch = search.create({
        'type': 'customrecord_rsm_aop_bs_code',
        columns: ['name']
      });

      var result = aopCodesSavedSearch.run().each(function (aopCodeData) {

        recordBSReport.selectNewLine({
          sublistId: 'recmachcustrecord_rsm_bs_report_parent'
        });
        recordBSReport.setCurrentSublistValue({
          sublistId: 'recmachcustrecord_rsm_bs_report_parent',
          fieldId: 'custrecord_rsm_bsl_aop_code',
          value: aopCodeData.id
        });
        var nula = 0;
        recordBSReport.setCurrentSublistValue({
          sublistId: 'recmachcustrecord_rsm_bs_report_parent',
          fieldId: 'custrecord_rsm_bsl_cy_calculated',
          value: nula
        });
        recordBSReport.setCurrentSublistValue({
          sublistId: 'recmachcustrecord_rsm_bs_report_parent',
          fieldId: 'custrecord_rsm_bsl_cy_xml',
          value: nula
        });
        recordBSReport.setCurrentSublistValue({
          sublistId: 'recmachcustrecord_rsm_bs_report_parent',
          fieldId: 'custrecord_rsm_bsl_py_end',
          value: nula
        });
        recordBSReport.setCurrentSublistValue({
          sublistId: 'recmachcustrecord_rsm_bs_report_parent',
          fieldId: 'custrecord_rsm_bsl_py_start',
          value: nula
        });
        recordBSReport.commitLine({
          sublistId: 'recmachcustrecord_rsm_bs_report_parent'
        });
        return true;
      });
      recordBSReport.save();
    }

    function calculate_lines(recordId) {

      var recordBSReport = record.load({
        type: 'customrecord_rsm_bs_report',
        id: recordId,
        isDynamic: true
      });

      var naDatum = format.format({
        value: recordBSReport.getValue("custrecord_rsm_bs_report_na_datum"),
        type: format.Type.DATE
      });

      processData(naDatum, recordBSReport);
    }

    function recalculate_lines(recordId) {

      var recordBSReport = record.load({
        type: 'customrecord_rsm_bs_report',
        id: recordId,
        isDynamic: true
      });

      var naDatum = format.format({
        value: recordBSReport.getValue("custrecord_rsm_bs_report_na_datum"),
        type: format.Type.DATE
      });

      recalculateHelperFunction(naDatum, recordBSReport);
    }

    function exportPdf(recordId) {

      var recordBSReport = record.load({
        type: 'customrecord_rsm_bs_report',
        id: recordId,
        isDynamic: true
      });

      var naDatum = format.format({
        value: recordBSReport.getValue("custrecord_rsm_bs_report_na_datum"),
        type: format.Type.DATE
      });
      var maticniBroj = recordBSReport.getText('custrecord_rsm_bs_report_maticni_broj');
      var sifraDelatnosti = recordBSReport.getText('custrecord_rsm_bs_report_sifra_del');
      var pib = recordBSReport.getText('custrecord_rsm_bs_report_pib');

      processDataForExportsOnly(recordBSReport, 'pdf');

      var datum2 = '31.07.2020'; //+ (dUtil.getYear(naDatum) - 1);
      var datum3 = '01.01.2020'; //+ (dUtil.getYear(naDatum) - 1);

      var addressAndName = getAddressAndName(recordBSReport.getValue('custrecord_rsm_bs_report_subsidiary'));

      var jsonObj = {
        datum: srbDate(naDatum),
        datumKrajnji: srbDate(datum2),
        datumPocetni: srbDate(datum3),
        maticniBroj: maticniBroj,
        sifraDelatnosti: sifraDelatnosti,
        naziv: addressAndName.name,
        sediste: addressAndName.address,
        pib: pib,
        bsScheme: bsScheme
      };

      var renderer = render.create();
      renderer.addCustomDataSource({
        format: render.DataSource.OBJECT,
        alias: "JSON",
        data: jsonObj
      });

      renderer.setTemplateByScriptId('CUSTTMPL_RSM_BALANCE_SHEET_PDF_HTML');

      var pdfFile = renderer.renderAsPdf();

      pdfFile.name = "Bilans stanja-" + srbDate(naDatum) + ".pdf";

      // Delete the old pdf file if it already exists
      var oldFileId = recordBSReport.getValue("custrecord_rsm_bs_report_pdf_file");
      if (oldFileId) {
        file.delete({
          id: oldFileId
        });
        log.audit('Success', 'Old pdf file deleted!');
      };


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

      recordBSReport.setValue({
        fieldId: 'custrecord_rsm_bs_report_pdf_file',
        value: newPdfFileId
      });
      recordBSReport.save();
    }

    function exportXls(recordId) {

      var recordBSReport = record.load({
        type: 'customrecord_rsm_bs_report',
        id: recordId,
        isDynamic: true
      });

      var naDatum = format.format({
        value: recordBSReport.getValue("custrecord_rsm_bs_report_na_datum"),
        type: format.Type.DATE
      });
      var maticniBroj = recordBSReport.getText('custrecord_rsm_bs_report_maticni_broj');
      var sifraDelatnosti = recordBSReport.getText('custrecord_rsm_bs_report_sifra_del');
      var pib = recordBSReport.getText('custrecord_rsm_bs_report_pib');

      processDataForExportsOnly(recordBSReport, 'pdf');

      var datum2 = '31.07.2020'; //+ (dUtil.getYear(naDatum) - 1);
      var datum3 = '01.01.2020'; //+ (dUtil.getYear(naDatum) - 1);

      var jsonObj = {
        datum: srbDate(naDatum),
        datumKrajnji: srbDate(datum2),
        datumPocetni: srbDate(datum3),
        maticniBroj: maticniBroj,
        sifraDelatnosti: sifraDelatnosti,
        pib: pib,
        bsScheme: bsScheme
      };
      var xmlTemplate = file.load({id: '../finansijski_templates/bs_excel_template.xml'});
      var content = xmlTemplate.getContents();


      var renderer = render.create();
      renderer.templateContent = content;

      renderer.addCustomDataSource({
        format: render.DataSource.JSON,
        alias: "JSON",
        data: JSON.stringify(jsonObj)
      });

      var xmlString = renderer.renderAsString();

      var fileName = "Bilans stanja-" + srbDate(naDatum) + ".xls";

      // Delete the old pdf file if it already exists
      var oldFileId = recordBSReport.getValue("custrecord_rsm_bs_report_xls_file");
      if (oldFileId) {
        file.delete({
          id: oldFileId
        });
        log.audit('Success', 'Old xls file deleted!');
      };


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

      recordBSReport.setValue({
        fieldId: 'custrecord_rsm_bs_report_xls_file',
        value: xlsFileId
      });
      recordBSReport.save();
    }

    function exportXml(recordId) {

      var recordBSReport = record.load({
        type: 'customrecord_rsm_bs_report',
        id: recordId,
        isDynamic: true
      });

      var naDatum = format.format({
        value: recordBSReport.getValue("custrecord_rsm_bs_report_na_datum"),
        type: format.Type.DATE
      });

      processDataForExportsOnly(recordBSReport, 'xml');

      var xmlString = createXMLString();
      var fileName = "Bilans stanja-" + srbDate(naDatum) + ".xml";
      // Delete the old xml file if it already exists
      var oldFileId = recordBSReport.getValue("custrecord_rsm_bs_report_xml_file");
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

      recordBSReport.setValue({
        fieldId: 'custrecord_rsm_bs_report_xml_file',
        value: newXmlFileId
      });
      recordBSReport.save();

    }

    function deletePdf(recordId) {
      var recordBSReport = record.load({
        type: 'customrecord_rsm_bs_report',
        id: recordId,
        isDynamic: true
      });

      var oldFileId = recordBSReport.getValue("custrecord_rsm_bs_report_pdf_file");
      if (oldFileId) {
        file.delete({
          id: oldFileId
        });
        log.audit('Success', 'Old pdf file deleted!');
      }
    }

    function deleteXls(recordId) {
      var recordBSReport = record.load({
        type: 'customrecord_rsm_bs_report',
        id: recordId,
        isDynamic: true
      });

      var oldFileId = recordBSReport.getValue("custrecord_rsm_bs_report_xls_file");
      if (oldFileId) {
        file.delete({
          id: oldFileId
        });
        log.audit('Success', 'Old xls file deleted!');
      }
    }

    function deleteXml(recordId) {
      var recordBSReport = record.load({
        type: 'customrecord_rsm_bs_report',
        id: recordId,
        isDynamic: true
      });

      var oldFileId = recordBSReport.getValue("custrecord_rsm_bs_report_xml_file");
      if (oldFileId) {
        file.delete({
          id: oldFileId
        });
        log.audit('Success', 'Old xml file deleted!');
      }
      ;
    }

    // HELPER FUNCTIONS
    // GET ALL NEEDED TRANSACTIONS
    function transactionSS(lastDate, subsidiaryId) {

      var aopSearch = search.create({
        type: "transaction",
        filters: [
          ["posting", "is", "T"],
          "AND",
          ["account.custrecord_rsm_aop_bs_code", "noneof", "@NONE@"],
          "AND",
          ["subsidiary", "anyof", subsidiaryId],
          "AND",
          ["accountingperiod.startdate", search.Operator.ONORBEFORE, lastDate]
        ],
        columns: [
          search.createColumn({
            name: "custrecord_rsm_aop_bs_code",
            join: "account",
            summary: search.Summary.GROUP,
            sort: search.Sort.ASC,
            label: "AOP"
          }),
          search.createColumn({
            name: "debitamount",
            summary: search.Summary.SUM,
            label: "SumDebit"
          }),
          search.createColumn({
            name: "creditamount",
            summary: search.Summary.SUM,
            label: "SumCredit"
          })
        ]
      }).run();

      var obj = {};
      var results = [],
        start = 0,
        end = 1000;
      while (true) {
        var tempList = aopSearch.getRange({
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
        var allValues = result.getAllValues();
        var aopCodeValue = allValues['GROUP(account.custrecord_rsm_aop_bs_code)'][0]['value'];
        var aopCodeText = allValues['GROUP(account.custrecord_rsm_aop_bs_code)'][0]['text'];
        var debitAmount = (allValues['SUM(debitamount)']) ? parseFloat(allValues['SUM(debitamount)']) : 0;
        var creditAmount = (allValues['SUM(creditamount)']) ? parseFloat(allValues['SUM(creditamount)']) : 0;
        var balance_as_of_date = Math.abs(debitAmount - creditAmount);
        balance_as_of_date = balance_as_of_date / 1000;

        if (aopCodeText === '0407') {
          if ((debitAmount - creditAmount) < 0) {
            balance_as_of_date = (debitAmount - creditAmount);
          }
        }

        if (positiveAops.indexOf(aopCodeText) !== -1) {
          if ((debitAmount - creditAmount) < 0) {
            badlyCalculatedAops.push(aopCodeText);
          }
        }
        if (negativeAops.indexOf(aopCodeText) !== -1) {
          if ((debitAmount - creditAmount) > 0) {
            badlyCalculatedAops.push(aopCodeText);
          }
        }
        obj[aopCodeText] = {
          "aopCodeValue": aopCodeValue,
          "aopCodeText": aopCodeText,
          "credit_amount": creditAmount,
          "debit_amount": debitAmount,
          "balance_as_of_date": balance_as_of_date
        };
        return true;
      });
      return obj;
    }

    // Return date in format suitable for official financial reports in Serbia
    function srbDate(date) {

      if (date === "")
        return "";
      return dUtil.getDay(date) + "." + dUtil.getMonth(date) + "." + dUtil.getYear(date) + ".";


    }

    // FUNCTION TO ROUND VALUES IN WHOLE JSON FILE1
    function roundValues() {
      for (var key in bsScheme) {
        bsScheme[key]["balance1"] = Math.round(bsScheme[key]["balance1"]);
        bsScheme[key]["balance2"] = Math.round(bsScheme[key]["balance2"]);
        bsScheme[key]["balance3"] = Math.round(bsScheme[key]["balance3"]);
      }
    }

    // format of AOP codes in JSON Scheme are '_CODE'
    function setBalancesAccounts(obj1, obj2, obj3) {

      for (var aopCodeObj1 in obj1) {
        var fixedAop = '_' + aopCodeObj1;
        bsScheme[fixedAop]["balance1"] = obj1[aopCodeObj1]["balance_as_of_date"];
      }

      for (var aopCodeObj2 in obj2) {
        var fixedAop = '_' + aopCodeObj2;
        bsScheme[fixedAop]["balance2"] = obj2[aopCodeObj2]["balance_as_of_date"];
      }

      for (var aopCodeObj3 in obj3) {
        var fixedAop = '_' + aopCodeObj3;
        bsScheme[fixedAop]["balance3"] = obj3[aopCodeObj3]["balance_as_of_date"];
      }
    }

    // Calculate balance amounts for aops
    function setBalancesAops(naDatum, subsidiaryId, bsRecord) {
      for (var key in bsScheme) {
        if (bsScheme[key].hasOwnProperty("aops")) {
          var sum = 0, sum2 = 0, sum3 = 0;
          var aops = bsScheme[key]["aops"];
          for (var i = 0; i < aops.length; i++) {
            var result = aops[i].split(/\s/);
            var sign = result[0], aop = result[1];
            if (sign === "+") {
              if (key == '_0401' || key == '_0408') {
                log.debug('BALANCE ' + key + ' PLUS ' + aop, bsScheme["_" + aop]["balance1"]);
              }
              sum += bsScheme["_" + aop]["balance1"];
              sum2 += bsScheme["_" + aop]["balance2"];
              sum3 += bsScheme["_" + aop]["balance3"];
            } else {
              if (key == '_0401' || key == '_0408') {
                log.debug('BALANCE ' + key + ' MINUS ' + aop, bsScheme["_" + aop]["balance1"]);
              }
              sum -= bsScheme["_" + aop]["balance1"];
              sum2 -= bsScheme["_" + aop]["balance2"];
              sum3 -= bsScheme["_" + aop]["balance3"];
            }

          }
          bsScheme[key]["balance1"] = (sum > 0) ? sum : 0;
          bsScheme[key]["balance2"] = (sum2 > 0) ? sum2 : 0;
          bsScheme[key]["balance3"] = (sum3 > 0) ? sum3 : 0;
        }
      }
      if (bsScheme['_0401']["balance1"] < 0) {
        bsScheme['_0401']["balance1"] = 0;
      }
      if (bsScheme['_0401']["balance2"] < 0) {
        bsScheme['_0401']["balance2"] = 0;
      }
      if (bsScheme['_0401']["balance3"] < 0) {
        bsScheme['_0401']["balance3"] = 0;
      }
      if (bsScheme['_0456']["balance1"] < 0) {
        bsScheme['_0456']["balance1"] = 0;
      }
      if (bsScheme['_0456']["balance2"] < 0) {
        bsScheme['_0456']["balance2"] = 0;
      }
      if (bsScheme['_0456']["balance3"] < 0) {
        bsScheme['_0456']["balance3"] = 0;
      }

      if (bsScheme['_0407']["balance1"] < 0) {
        bsScheme['_0406']["balance1"] += Math.abs(bsScheme['_0407']["balance1"]);
        bsScheme['_0407']["balance1"] = 0;
      }
      if (bsScheme['_0407']["balance2"] < 0) {
        bsScheme['_0406']["balance2"] += Math.abs(bsScheme['_0407']["balance2"]);
        bsScheme['_0407']["balance2"] = 0;
      }
      if (bsScheme['_0407']["balance3"] < 0) {
        bsScheme['_0406']["balance3"] += Math.abs(bsScheme['_0407']["balance3"]);
        bsScheme['_0407']["balance3"] = 0;
      }



      // _0455
      if (bsScheme['_0455']["balance1"] < 0) {
        bsScheme['_0455']["balance1"] =  bsScheme['_0407']["balance1"] + bsScheme['_0412']["balance1"] - bsScheme['_0402']["balance1"] - bsScheme['_0403']["balance1"] -
          bsScheme['_0404']["balance1"] - bsScheme['_0405']["balance1"] - bsScheme['_0406']["balance1"] - bsScheme['_0408']["balance1"] - bsScheme['_0411']["balance1"];

      }

      if (bsScheme['_0455']["balance2"] < 0) {
        bsScheme['_0455']["balance2"] =  bsScheme['_0407']["balance2"] + bsScheme['_0412']["balance2"] - bsScheme['_0402']["balance2"] - bsScheme['_0403']["balance2"] -
          bsScheme['_0404']["balance2"] - bsScheme['_0405']["balance2"] - bsScheme['_0406']["balance2"] - bsScheme['_0408']["balance2"] - bsScheme['_0411']["balance2"];

      }

      if (bsScheme['_0455']["balance3"] < 0) {
        bsScheme['_0455']["balance3"] =  bsScheme['_0407']["balance3"] + bsScheme['_0412']["balance3"] - bsScheme['_0402']["balance3"] - bsScheme['_0403']["balance3"] -
          bsScheme['_0404']["balance3"] - bsScheme['_0405']["balance3"] - bsScheme['_0406']["balance3"] - bsScheme['_0408']["balance3"] - bsScheme['_0411']["balance3"];
      }

      if (bsScheme['_0455']["balance1"] <= 0) {
        bsScheme['_0455']["balance1"] = 0;
      }
      if (bsScheme['_0455']["balance2"] <= 0) {
        bsScheme['_0455']["balance2"] = 0;
      }
      if (bsScheme['_0455']["balance3"] <= 0) {
        bsScheme['_0455']["balance3"] = 0;
      }

      var dataFromBu = getAopsFromBU(subsidiaryId, naDatum, bsRecord);
      for (var key in dataFromBu) {
        if (dataFromBu[key].aopName === '1055') {
          bsScheme['_0410']["balance1"] = dataFromBu[key].calculatedValue;
          bsScheme['_0410']["balance2"] = dataFromBu[key].previousYearValue;
        }
        if (dataFromBu[key].aopName === '1056') {
          bsScheme['_0414']["balance1"] = dataFromBu[key].calculatedValue;
          bsScheme['_0414']["balance2"] = dataFromBu[key].previousYearValue;
        }
      }
    }

    function processDataForExportsOnly(bsRecord) {
      loadScheme();

      var NUMBER_OF_LINES_IN_BS_REPORT = bsRecord.getLineCount({
        sublistId: 'recmachcustrecord_rsm_bs_report_parent'
      });

      for (var i = 0; i < NUMBER_OF_LINES_IN_BS_REPORT; i++) {

        var aopCodeAtCurrentLine = bsRecord.getSublistText({
          sublistId: 'recmachcustrecord_rsm_bs_report_parent',
          fieldId: 'custrecord_rsm_bsl_aop_code',
          line: i
        });

        var calculatedValueAtCurrentLine = bsRecord.getSublistValue({
          sublistId: 'recmachcustrecord_rsm_bs_report_parent',
          fieldId: 'custrecord_rsm_bsl_cy_calculated',
          line: i
        });

        var xmlValueAtCurrentLine = bsRecord.getSublistValue({
          sublistId: 'recmachcustrecord_rsm_bs_report_parent',
          fieldId: 'custrecord_rsm_bsl_cy_xml',
          line: i
        });

        var prevYearEndValueAtCurrentLine = bsRecord.getSublistValue({
          sublistId: 'recmachcustrecord_rsm_bs_report_parent',
          fieldId: 'custrecord_rsm_bsl_py_end',
          line: i
        });

        var prevYearStartValueAtCurrentLine = bsRecord.getSublistValue({
          sublistId: 'recmachcustrecord_rsm_bs_report_parent',
          fieldId: 'custrecord_rsm_bsl_py_start',
          line: i
        });

        var key = '_' + aopCodeAtCurrentLine;
        bsScheme[key]["balance1"] = xmlValueAtCurrentLine;
        bsScheme[key]["balance2"] = prevYearEndValueAtCurrentLine;
        bsScheme[key]["balance3"] = prevYearStartValueAtCurrentLine;
      }
    }

    function processData(naDatum, bsRecord) {
      loadScheme();

      var subsidiaryId = bsRecord.getValue({
        fieldId: 'custrecord_rsm_bs_report_subsidiary'
      });

      var naDatum1YearAgo = '31.07.2020'; //+ (dUtil.getYear(naDatum) - 1);
      var naDatum2YearsAgo = '01.01.2020'; //+ (dUtil.getYear(naDatum) - 1);

      var transactionsPrethodnaKrajne, transactionsPrethodnaPocetno, transactionsTekucaGodina;

      transactionsPrethodnaPocetno = transactionSS(naDatum2YearsAgo, subsidiaryId);
      transactionsPrethodnaKrajne = transactionSS(naDatum1YearAgo, subsidiaryId);
      transactionsTekucaGodina = transactionSS(naDatum, subsidiaryId);


      setBalancesAccounts(transactionsTekucaGodina, transactionsPrethodnaKrajne, transactionsPrethodnaPocetno);
      roundValues();

      setBalancesAops(naDatum,subsidiaryId, bsRecord);
      setBalancesAops(naDatum,subsidiaryId, bsRecord);
      setBalancesAops(naDatum,subsidiaryId, bsRecord); 
                                                       
      var NUMBER_OF_LINES_IN_BS_REPORT = bsRecord.getLineCount({
        sublistId: 'recmachcustrecord_rsm_bs_report_parent'
      });

      for (var i = 0; i < NUMBER_OF_LINES_IN_BS_REPORT; i++) {

        var aopCodeAtCurrentLine = bsRecord.getSublistText({
          sublistId: 'recmachcustrecord_rsm_bs_report_parent',
          fieldId: 'custrecord_rsm_bsl_aop_code',
          line: i
        });

        var currentSublistLine = bsRecord.selectLine({
          sublistId: 'recmachcustrecord_rsm_bs_report_parent',
          line: i
        });

        bsRecord.setCurrentSublistValue({
          sublistId: 'recmachcustrecord_rsm_bs_report_parent',
          fieldId: 'custrecord_rsm_bsl_cy_calculated',
          value: bsScheme["_" + aopCodeAtCurrentLine]["balance1"]
        });

        bsRecord.setCurrentSublistValue({
          sublistId: 'recmachcustrecord_rsm_bs_report_parent',
          fieldId: 'custrecord_rsm_bsl_cy_xml',
          value: bsScheme["_" + aopCodeAtCurrentLine]["balance1"]
        });

        bsRecord.setCurrentSublistValue({
          sublistId: 'recmachcustrecord_rsm_bs_report_parent',
          fieldId: 'custrecord_rsm_bsl_py_end',
          value: bsScheme["_" + aopCodeAtCurrentLine]["balance2"]
        });

        bsRecord.setCurrentSublistValue({
          sublistId: 'recmachcustrecord_rsm_bs_report_parent',
          fieldId: 'custrecord_rsm_bsl_py_start',
          value: bsScheme["_" + aopCodeAtCurrentLine]["balance3"]
        });

        bsRecord.commitLine({
          sublistId: 'recmachcustrecord_rsm_bs_report_parent'
        });
      }

      bsRecord.save();
    }

    function recalculateHelperFunction(naDatum, bsRecord) {
      loadScheme();

      var subsidiaryId = bsRecord.getValue({
        fieldId: 'custrecord_rsm_bs_report_subsidiary'
      });

      var NUMBER_OF_LINES_IN_BS_REPORT = bsRecord.getLineCount({
        sublistId: 'recmachcustrecord_rsm_bs_report_parent'
      });

      for (var i = 0; i < NUMBER_OF_LINES_IN_BS_REPORT; i++) {

        var aopCodeAtCurrentLine = bsRecord.getSublistText({
          sublistId: 'recmachcustrecord_rsm_bs_report_parent',
          fieldId: 'custrecord_rsm_bsl_aop_code',
          line: i
        });

        var xmlValueAtCurrentLine = bsRecord.getSublistValue({
          sublistId: 'recmachcustrecord_rsm_bs_report_parent',
          fieldId: 'custrecord_rsm_bsl_cy_xml',
          fieldId: 'custrecord_rsm_bsl_cy_xml',
          line: i
        });

        var key = '_' + aopCodeAtCurrentLine;
        bsScheme[key]["balance1"] = xmlValueAtCurrentLine;
        bsScheme[key]["balance2"] = 0;
        bsScheme[key]["balance3"] = 0;
      }
      setBalancesAops(naDatum, subsidiaryId, bsRecord);
      setBalancesAops(naDatum, subsidiaryId, bsRecord);
      setBalancesAops(naDatum, subsidiaryId, bsRecord);  

      for (var i = 0; i < NUMBER_OF_LINES_IN_BS_REPORT; i++) {

        var aopCodeAtCurrentLine = bsRecord.getSublistText({
          sublistId: 'recmachcustrecord_rsm_bs_report_parent',
          fieldId: 'custrecord_rsm_bsl_aop_code',
          line: i
        });

        var currentSublistLine = bsRecord.selectLine({
          sublistId: 'recmachcustrecord_rsm_bs_report_parent',
          line: i
        });

        bsRecord.setCurrentSublistValue({
          sublistId: 'recmachcustrecord_rsm_bs_report_parent',
          fieldId: 'custrecord_rsm_bsl_cy_xml',
          value: bsScheme["_" + aopCodeAtCurrentLine]["balance1"]
        });

        bsRecord.commitLine({
          sublistId: 'recmachcustrecord_rsm_bs_report_parent'
        });
      }
      bsRecord.save();
    }

    function loadScheme() {
      var file1 = file.load({
        id: "./bs_scheme.json"
      });
      bsScheme = JSON.parse(file1.getContents());
    }

    // Create xml string with fields and values from bsScheme
    function createXMLString() {
      var xmlStr =
        "<FiForma xmlns:i='http://www.w3.org/2001/XMLSchema-instance' xmlns='http://schemas.datacontract.org/2004/07/Domain.Model'>" +
        "<Naziv>Bilans stanja</Naziv>" +
        "<NumerickaPoljaForme xmlns:a='http://schemas.datacontract.org/2004/07/AppDef'>";

      var numerickaPoljaForme = "",
        tekstualnaPoljaForme = "";

      for (var key in bsScheme) {

        for (var i = 5; i < 8; i++) {

          var numerickoPolje = "<a:NumerickoPolje>";
          numerickoPolje += "<a:Naziv>aop-" + key.substr(1) + "-" + i + "</a:Naziv>";
          numerickoPolje += "<a:Vrednosti>" + (bsScheme[key]["balance" + (i - 4)]).toString() + "</a:Vrednosti>";
          numerickoPolje += "</a:NumerickoPolje>";

          numerickaPoljaForme += numerickoPolje;
        }

        var tekstualnoPolje = "<TekstualnoPolje>";
        tekstualnoPolje += "<Naziv>aop-" + key.substr(1) + "-4" + "</Naziv>";
        tekstualnoPolje += "<Vrednosti/>";
        tekstualnoPolje += "</TekstualnoPolje>";

        tekstualnaPoljaForme += tekstualnoPolje;
      }

      xmlStr += numerickaPoljaForme;
      xmlStr += "</NumerickaPoljaForme>";
      xmlStr += "<TekstualnaPoljaForme>";
      xmlStr += tekstualnaPoljaForme;
      xmlStr += "</TekstualnaPoljaForme>";

      xmlStr += "</FiForma>";

      return xmlStr;
    }

    function doPost(requestBody) {
      var recordIdBSReport = requestBody.idBSReport;
      var action = requestBody.action;
      var retVal = {
        "result": "Error"
      };

      if (action == "init_lines") {
        initialize_lines(recordIdBSReport);
        retVal = {
          "result": 'ok'
        }
      }
      if (action == "calc_lines") {
        calculate_lines(recordIdBSReport);
        if (messageToSend.message) {
          retVal = {
            "result": 'ok',
            "feedbackMessage": messageToSend,
            "badAops": badlyCalculatedAops
          }
        } else {
          retVal = {
            "result": 'ok'
          }
        }
      }
      if (action == "xml_file") {
        exportXml(recordIdBSReport);
        retVal = {
          "result": 'ok'
        }
      }
      if (action == "pdf_file") {
        exportPdf(recordIdBSReport);
        retVal = {
          "result": 'ok'
        }
      }
      if (action == "xls_file") {
        exportXls(recordIdBSReport);
        retVal = {
          "result": 'ok'
        }
      }
      if (action == "recalculate_lines") {
        recalculate_lines(recordIdBSReport);
        retVal = {
          "result": 'ok'
        }
      }
      if (action == "delete_pdf") {
        deletePdf(recordIdBSReport);
        retVal = {
          "result": 'ok'
        }
      }
      if (action == "delete_xml") {
        deleteXml(recordIdBSReport);
        retVal = {
          "result": 'ok'
        }
      }
      if (action == "delete_xls") {
        deleteXls(recordIdBSReport);
        retVal = {
          "result": 'ok'
        }
      }
      if (action == "delete_lines") {
        deleteOldLines(recordIdBSReport);
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