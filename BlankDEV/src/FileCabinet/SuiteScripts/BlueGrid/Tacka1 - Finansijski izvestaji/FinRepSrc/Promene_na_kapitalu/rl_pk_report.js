/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 */
define(
  ['N/record', 'N/search', 'N/file', 'N/format', 'N/query', 'N/log', '../dateUtil', 'N/render', 'N/encode', 'N/util'],
  function (record, search, file, format, query, log, dateUtil, render, encode, util) {

    var dUtil = dateUtil.dateUtil;
    var pkScheme = {};
    var messageToSend = {};

    var badlyCalculatedAops = [];

    var mappedAops = {
      "4008": {
        bsType: '4001',
        buLastYear: '4004'
      },
      "4017": {
        bsType: '4010',
        buLastYear: '4013'
      },
      "4026": {
        bsType: '4019',
        buLastYear: '4022'
      },
      "4035": {
        bsType: '4028',
        buLastYear: '4031'
      },
      "4044": {
        bsType: '4037',
        buLastYear: '4040'
      },
      "4053": {
        bsType: '4046',
        buLastYear: '4049'
      },
      "4062": {
        bsType: '4055',
        buLastYear: '4058'
      },
      "4071": {
        bsType: '4064',
        buLastYear: '4067'
      },
      "4080": {
        bsType: '4073',
        buLastYear: '4076'
      },
      "4089": {
        bsType: '4082',
        buLastYear: '4085'
      },
    }

    function getAopsFromBU(subsidiaryId, onDate, PKRecord) {
      var tempData = {};
      var buReportId = PKRecord.getValue('custrecord_rsm_pk_report_bu_data');

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

    function getAopsFromBS(subsidiaryId, periodDo, PKRecord) {
      var tempData = {};
      var bsReportId = PKRecord.getValue('custrecord_rsm_pk_report_bs_data');

      if (!bsReportId) {
        var BSReportQuery = query.runSuiteQL({
          query: "SELECT id FROM customrecord_rsm_bs_report WHERE custrecord_rsm_bs_report_subsidiary = ? AND custrecord_rsm_bs_report_na_datum = ?",
          params: [subsidiaryId, periodDo]
        });
        if (BSReportQuery.results.length > 0) {
          bsReportId = BSReportQuery.results[0].values[0]

          var aopIdsQuery = query.runSuiteQL({
            query: "SELECT id, name FROM customrecord_rsm_aop_bs_code  WHERE name IN (0409, 0413)"
          });
          var aopId1 = aopIdsQuery.results[0].values[0];
          var aopName1 = aopIdsQuery.results[0].values[1];
          var aopId2 = aopIdsQuery.results[1].values[0];
          var aopName2 = aopIdsQuery.results[1].values[1];
          tempData[aopId1] = {};
          tempData[aopId2] = {};
          tempData[aopId1].aopName = aopName1;
          tempData[aopId2].aopName = aopName2;

          var BSLinesQuery = query.runSuiteQL({
            query: "SELECT custrecord_rsm_bsl_aop_code, custrecord_rsm_bsl_cy_calculated, custrecord_rsm_bsl_py_end FROM customrecord_rsm_bs_report_lines WHERE custrecord_rsm_bs_report_parent = ? AND custrecord_rsm_bsl_aop_code IN (" +aopId1 + ", " + aopId2 +")",
            params: [bsReportId]
          });

          var aop1 = BSLinesQuery.results[0].values[0];
          var currentYearValue1 = BSLinesQuery.results[0].values[1];
          var previousYearValue1 = BSLinesQuery.results[0].values[2];
          var aop2 = BSLinesQuery.results[1].values[0];
          var currentYearValue2 = BSLinesQuery.results[1].values[1];
          var previousYearValue2 = BSLinesQuery.results[1].values[2];

          tempData[aop1].calculatedValue = currentYearValue1;
          tempData[aop1].previousYearValue = previousYearValue1;
          tempData[aop2].calculatedValue= currentYearValue2;
          tempData[aop2].previousYearValue = previousYearValue2;
          log.debug('AOPI IZ BS', JSON.stringify(tempData));

          return tempData;
        } else {
          messageToSend = {
            "message": "Ne postoji izgenerisan Bilans Uspeha za izabrani Subsidiary i datum!"
          }
        }
      } else {
        var aopIdsQuery = query.runSuiteQL({
          query: "SELECT id, name FROM customrecord_rsm_aop_bS_code  WHERE name IN (0409, 0413)"
        });
        var aopId1 = aopIdsQuery.results[0].values[0];
        var aopName1 = aopIdsQuery.results[0].values[1];
        var aopId2 = aopIdsQuery.results[1].values[0];
        var aopName2 = aopIdsQuery.results[1].values[1];
        tempData[aopId1] = {};
        tempData[aopId2] = {};
        tempData[aopId1].aopName = aopName1;
        tempData[aopId2].aopName = aopName2;

        var BSLinesQuery = query.runSuiteQL({
          query: "SELECT custrecord_rsm_bsl_aop_code, custrecord_rsm_bsl_cy_calculated, custrecord_rsm_bsl_py_end FROM customrecord_rsm_bs_report_lines WHERE custrecord_rsm_bs_report_parent = ? AND custrecord_rsm_bsl_aop_code IN (" +aopId1 + ", " + aopId2 +")",
          params: [bsReportId]
        });

        var aop1 = BSLinesQuery.results[0].values[0];
        var currentYearValue1 = BSLinesQuery.results[0].values[1];
        var previousYearValue1 = BSLinesQuery.results[0].values[2];
        var aop2 = BSLinesQuery.results[1].values[0];
        var currentYearValue2 = BSLinesQuery.results[1].values[1];
        var previousYearValue2 = BSLinesQuery.results[1].values[2];

        tempData[aop1].calculatedValue = currentYearValue1;
        tempData[aop1].previousYearValue = previousYearValue1;
        tempData[aop2].calculatedValue= currentYearValue2;
        tempData[aop2].previousYearValue = previousYearValue2;

        return tempData;
      }
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

    function deleteOldLines(recordId) {
      var linesSavedSearch = search.create({
        'type': 'customrecord_rsm_pk_report_lines',
        filters: ['custrecord_rsm_pkl_report_parent', 'is', recordId]
      });
      var linesSSInstance = linesSavedSearch.run().each(function (pl_line) {
        record['delete']({
          type: 'customrecord_rsm_pk_report_lines',
          id: pl_line.id
        })
        return true;
      });

    }

    // Reset of all the lines, deleting the ones that already exist - adding new lines with value 0
    function initialize_lines(recordId) {
      deleteOldLines(recordId);

      var recordPKReport = record.load({
        type: 'customrecord_rsm_pk_report',
        id: recordId,
        isDynamic: true
      });

      var aopCodesSavedSearch = search.create({
        'type': 'customrecord_rsm_aop_pk_code',
        columns: ['name']
      });

      var result = aopCodesSavedSearch.run().each(function (aopCodeData) {

        recordPKReport.selectNewLine({
          sublistId: 'recmachcustrecord_rsm_pkl_report_parent'
        });
        recordPKReport.setCurrentSublistValue({
          sublistId: 'recmachcustrecord_rsm_pkl_report_parent',
          fieldId: 'custrecord_rsm_pkl_aop_code',
          value: aopCodeData.id
        });
        recordPKReport.setCurrentSublistValue({
          sublistId: 'recmachcustrecord_rsm_pkl_report_parent',
          fieldId: 'custrecord_rsm_pkl_calculated_value',
          value: 0
        });
        recordPKReport.setCurrentSublistValue({
          sublistId: 'recmachcustrecord_rsm_pkl_report_parent',
          fieldId: 'custrecord_rsm_pkl_xml_value',
          value: 0
        });
        recordPKReport.commitLine({
          sublistId: 'recmachcustrecord_rsm_pkl_report_parent'
        });
        return true;
      });
      recordPKReport.save();
    }

    function calculate_lines(recordId) {

      var recordPKReport = record.load({
        type: 'customrecord_rsm_pk_report',
        id: recordId,
        isDynamic: true
      });
      var datumOd = format.format({
        value: recordPKReport.getValue("custrecord_rsm_pk_report_period_od"),
        type: format.Type.DATE
      });
      var datumDo = format.format({
        value: recordPKReport.getValue("custrecord_rsm_pk_report_period_do"),
        type: format.Type.DATE
      });

      processData(datumOd, datumDo, recordPKReport);
    }

    function recalculate_lines(recordId) {

      var recordPKReport = record.load({
        type: 'customrecord_rsm_pk_report',
        id: recordId,
        isDynamic: true
      });
      var datumOd = format.format({
        value: recordPKReport.getValue("custrecord_rsm_pk_report_period_od"),
        type: format.Type.DATE
      });
      var datumDo = format.format({
        value: recordPKReport.getValue("custrecord_rsm_pk_report_period_do"),
        type: format.Type.DATE
      });

      recalculateHelperFunction(datumOd, datumDo, recordPKReport);
    }

    function exportPdf(recordId) {

      var recordPKReport = record.load({
        type: 'customrecord_rsm_pk_report',
        id: recordId,
        isDynamic: true
      });
      var datumOd = format.format({
        value: recordPKReport.getValue("custrecord_rsm_pk_report_period_od"),
        type: format.Type.DATE
      });
      var datumDo = format.format({
        value: recordPKReport.getValue("custrecord_rsm_pk_report_period_do"),
        type: format.Type.DATE
      });
      var maticniBroj = recordPKReport.getText('custrecord_rsm_pk_report_maticni_broj');
      var sifraDelatnosti = recordPKReport.getText('custrecord_rsm_pk_report_sifra_del');
      var pib = recordPKReport.getText('custrecord_rsm_pk_report_pib');

      processDataForExportsOnly(recordPKReport, 'pdf');

      var datumLYKrajnji = '31.12.' + (dUtil.getYear(datumDo) - 1);
      var datumLYPocetni = '01.01.' + (dUtil.getYear(datumOd) - 1);

      var tekucaGodina = dUtil.getYear(datumDo) + '.';
      var prethodnaGodina = (dUtil.getYear(datumDo) - 1) + '.';
      var addressAndName = getAddressAndName(recordPKReport.getValue('custrecord_rsm_pk_report_subsidiary'));

      var jsonObj = {
        datum1: srbDate(datumOd),
        datum2: srbDate(datumDo),
        datumLYKrajnji: srbDate(datumLYKrajnji),
        datumLYPocetni: srbDate(datumLYPocetni),
        tekucaGodina: tekucaGodina,
        prethodnaGodina: prethodnaGodina,
        maticniBroj: maticniBroj,
        sifraDelatnosti: sifraDelatnosti,
        naziv: addressAndName.name,
        sediste: addressAndName.address,
        pib: pib,
        pkScheme: pkScheme
      };

      var renderer = render.create();
      renderer.addCustomDataSource({
        format: render.DataSource.OBJECT,
        alias: "JSON",
        data: jsonObj
      });

      renderer.setTemplateByScriptId('CUSTTMPL_PROMENE_NA_KAPITALU_PDF');

      var pdfFile = renderer.renderAsPdf();

      pdfFile.name = "Promene_na_kapitalu-" + srbDate(datumOd) + "-" + srbDate(datumDo) + ".pdf";

      // Delete the old pdf file if it already exists
      var oldFileId = recordPKReport.getValue("custrecord_rsm_pk_report_pdf_file");
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

      recordPKReport.setValue({
        fieldId: 'custrecord_rsm_pk_report_pdf_file',
        value: newPdfFileId
      });
      recordPKReport.save();
    }

    function exportXls(recordId) {

      var recordPKReport = record.load({
        type: 'customrecord_rsm_pk_report',
        id: recordId,
        isDynamic: true
      });
      var datumOd = format.format({
        value: recordPKReport.getValue("custrecord_rsm_pk_report_period_od"),
        type: format.Type.DATE
      });
      var datumDo = format.format({
        value: recordPKReport.getValue("custrecord_rsm_pk_report_period_do"),
        type: format.Type.DATE
      });
      var maticniBroj = recordPKReport.getText('custrecord_rsm_pk_report_maticni_broj');
      var sifraDelatnosti = recordPKReport.getText('custrecord_rsm_pk_report_sifra_del');
      var pib = recordPKReport.getText('custrecord_rsm_pk_report_pib');

      processDataForExportsOnly(recordPKReport, 'pdf');

      var datumLYKrajnji = '31.07.2020'; //+ (dUtil.getYear(naDatum) - 1);
      var datumLYPocetni = '01.01.2020'; //+ (dUtil.getYear(naDatum) - 1);

      var jsonObj = {
        datum1: srbDate(datumOd),
        datum2: srbDate(datumDo),
        datumLYKrajnji: srbDate(datumLYKrajnji),
        datumLYPocetni: srbDate(datumLYPocetni),
        maticniBroj: maticniBroj,
        sifraDelatnosti: sifraDelatnosti,
        pib: pib,
        pkScheme: pkScheme
      };
      var xmlTemplate = file.load({id: '../finansijski_templates/pk_excel_template.xml'});
      var content = xmlTemplate.getContents();


      var renderer = render.create();
      renderer.templateContent = content;

      renderer.addCustomDataSource({
        format: render.DataSource.JSON,
        alias: "JSON",
        data: JSON.stringify(jsonObj)
      });

      var xmlString = renderer.renderAsString();

      var fileName = "Promene_na_kapitalu-" + srbDate(datumOd) + '-' + srbDate(datumDo) + ".xls";

      // Delete the old pdf file if it already exists
      var oldFileId = recordPKReport.getValue("custrecord_rsm_pk_report_xls_file");
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

      recordPKReport.setValue({
        fieldId: 'custrecord_rsm_pk_report_xls_file',
        value: xlsFileId
      });
      recordPKReport.save();
    }

    function exportXml(recordId) {

      var recordPKReport = record.load({
        type: 'customrecord_rsm_pk_report',
        id: recordId,
        isDynamic: true
      });
      var datumOd = format.format({
        value: recordPKReport.getValue("custrecord_rsm_pk_report_period_od"),
        type: format.Type.DATE
      });
      var datumDo = format.format({
        value: recordPKReport.getValue("custrecord_rsm_pk_report_period_do"),
        type: format.Type.DATE
      });

      processDataForExportsOnly(recordPKReport, 'xml');

      var xmlString = createXMLString();
      var fileName = "Promene_na_kapitalu-" + srbDate(datumOd) + '-' + srbDate(datumDo) + ".xml";
      // Delete the old xml file if it already exists
      var oldFileId = recordPKReport.getValue("custrecord_rsm_pk_report_xml_file");
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

      recordPKReport.setValue({
        fieldId: 'custrecord_rsm_pk_report_xml_file',
        value: newXmlFileId
      });
      recordPKReport.save();

    }

    function deletePdf(recordId) {
      var recordPKReport = record.load({
        type: 'customrecord_rsm_pk_report',
        id: recordId,
        isDynamic: true
      });

      var oldFileId = recordPKReport.getValue("custrecord_rsm_pk_report_pdf_file");
      if (oldFileId) {
        file.delete({
          id: oldFileId
        });
        log.audit('Success', 'Old pdf file deleted!');
      }
    }

    function deleteXls(recordId) {
      var recordPKReport = record.load({
        type: 'customrecord_rsm_pk_report',
        id: recordId,
        isDynamic: true
      });

      var oldFileId = recordPKReport.getValue("custrecord_rsm_pk_report_xls_file");
      if (oldFileId) {
        file.delete({
          id: oldFileId
        });
        log.audit('Success', 'Old xls file deleted!');
      }
    }

    function deleteXml(recordId) {
      var recordPKReport = record.load({
        type: 'customrecord_rsm_pk_report',
        id: recordId,
        isDynamic: true
      });

      var oldFileId = recordPKReport.getValue("custrecord_rsm_pk_report_xml_file");
      if (oldFileId) {
        file.delete({
          id: oldFileId
        });
        log.audit('Success', 'Old xml file deleted!');
      }
    }

    // HELPER FUNCTIONS
    // GET ALL NEEDED TRANSACTIONS
    // SAVED SEARCH FROM BS REPORT
    function transactionSSBS(lastDate, subsidiaryId) {

      var aopSearch = search.create({
        type: "transaction",
        filters: [
          ["posting", "is", "T"],
          "AND",
          ["account.custrecord_rsm_aop_pk_code", "noneof", "@NONE@"],
          "AND",
          ["subsidiary", "anyof", subsidiaryId],
          "AND",
          ["accountingperiod.startdate", search.Operator.ONORBEFORE, lastDate]
        ],
        columns: [
          search.createColumn({
            name: "custrecord_rsm_aop_pk_code",
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
        var aopCodeText = allValues['GROUP(account.custrecord_rsm_aop_pk_code)'][0]['text'];
        var fixedAopCode = mappedAops[aopCodeText].bsType;

        var debitAmount = (allValues['SUM(debitamount)']) ? parseFloat(allValues['SUM(debitamount)']) : 0;
        var creditAmount = (allValues['SUM(creditamount)']) ? parseFloat(allValues['SUM(creditamount)']) : 0;
        var balance_as_of_date = (creditAmount - debitAmount);
        balance_as_of_date = balance_as_of_date / 1000;
        obj[fixedAopCode] = {
          "aopCodeText": fixedAopCode,
          "credit_amount": creditAmount,
          "debit_amount": debitAmount,
          "balance_between_periods": balance_as_of_date
        };
        return true;
      });
      return obj;
    }

    //SAVED SEARCH FROM BU REPORT
    function transactionsSSBU(firstDate, lastDate, subsidiaryId, timeperiod) {

      var aopSearch = search.create({
        type: "transaction",
        filters: [
          ["posting", "is", "T"],
          "AND",
          ["account.custrecord_rsm_aop_pk_code", "noneof", "@NONE@"],
          "AND",
          ["subsidiary", "anyof", subsidiaryId],
          "AND",
          ["accountingperiod.startdate", search.Operator.ONORBEFORE, lastDate],
          "AND",
          ["accountingperiod.startdate", search.Operator.ONORAFTER, firstDate]
        ],
        columns: [
          search.createColumn({
            name: "custrecord_rsm_aop_pk_code",
            join: "account",
            summary: "GROUP",
            sort: search.Sort.ASC,
            label: "AOP"
          }),
          search.createColumn({
            name: "debitamount",
            summary: "SUM",
            label: "SumDebit"
          }),
          search.createColumn({
            name: "creditamount",
            summary: "SUM",
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
        var aopCodeText = allValues['GROUP(account.custrecord_rsm_aop_pk_code)'][0]['text'];
        //TODO: Moguce da potrebno podeliti ovaj deo koda za pretvaranje ss rezultata u objekat u 2 razlicite funkcije
        //TODO: jedna funkcija za Current Year druga za Last Year, i proveravati da li se aopCodeText nalazi u odgovarajucem nizu

        if (timeperiod === 'lastyear') {
          aopCodeText = mappedAops[aopCodeText].buLastYear;
        }
        var debitAmount = (allValues['SUM(debitamount)']) ? parseFloat(allValues['SUM(debitamount)']) : 0;
        var creditAmount = (allValues['SUM(creditamount)']) ? parseFloat(allValues['SUM(creditamount)']) : 0;
        var balance_between_periods = (creditAmount - debitAmount);
        balance_between_periods = balance_between_periods / 1000;

        obj[aopCodeText] = {
          "aopCodeText": aopCodeText,
          "credit_amount": (creditAmount) ? creditAmount : 0,
          "debit_amount": (debitAmount) ? debitAmount : 0,
          "balance_between_periods": balance_between_periods
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
    //TODO: promeniti ovu funkciju da odgovara potrebama PKScheme
    function roundValues() {
      for (var key in pkScheme) {
        pkScheme[key]["balance1"] = Math.round(pkScheme[key]["balance1"]);
      }
    }

    // format of AOP codes in JSON Scheme are '_CODE'
    //TODO: promeniti ovu funkciju da odgovara potrebama PKScheme
    function setBalancesAccounts(obj1, obj2, obj3) {

      for (var aopCodeObj1 in obj1) {
        var fixedAop = '_' + aopCodeObj1;
        pkScheme[fixedAop]["balance1"] = obj1[aopCodeObj1]["balance_between_periods"];
      }

      for (var aopCodeObj2 in obj2) {
        var fixedAop = '_' + aopCodeObj2;
        pkScheme[fixedAop]["balance1"] = obj2[aopCodeObj2]["balance_between_periods"];
      }

      for (var aopCodeObj3 in obj3) {
        var fixedAop = '_' + aopCodeObj3;
        pkScheme[fixedAop]["balance1"] = obj3[aopCodeObj3]["balance_between_periods"];
      }
    }

    // Calculate balance amounts for aops
    //TODO: promeniti ovu funkciju da odgovara potrebama PKScheme
    function setBalancesAops(datumOd, datumDo, subsidiaryId, pkRecord) {
      for (var key in pkScheme) {
        if (pkScheme[key].hasOwnProperty("aops")) {
          var sum = 0;
          var aops = pkScheme[key]["aops"];
          for (var i = 0; i < aops.length; i++) {
            var result = aops[i].split(/\s/);
            var sign = result[0], aop = result[1];
            if (sign === "+") {
              sum += pkScheme["_" + aop]["balance1"];
            } else {
              sum -= pkScheme["_" + aop]["balance1"];
            }

          }
          pkScheme[key]["balance1"] = (sum > 0) ? sum : 0;
        }
      }

      var dataFromBu = getAopsFromBU(subsidiaryId, datumDo, pkRecord);
      for (var key in dataFromBu) {
        if (dataFromBu[key].aopName === '1055') {
          pkScheme['_4053']["balance1"] = dataFromBu[key].calculatedValue;
          pkScheme['_4049']["balance1"] = dataFromBu[key].previousYearValue;
        }
        if (dataFromBu[key].aopName === '1056') {
          pkScheme['_4062']["balance1"] = dataFromBu[key].calculatedValue;
          pkScheme['_4058']["balance1"] = dataFromBu[key].previousYearValue;
        }
      }

      var dataFromBs = getAopsFromBS(subsidiaryId, datumDo, pkRecord);
      for (var key in dataFromBs) {
        if (dataFromBs[key].aopName === '0409') {
          pkScheme['_4046']['balance1'] = dataFromBs[key].previousYearValue;
        }
        if (dataFromBs[key].aopName === '0413') {
          pkScheme['_4055']['balance1'] = dataFromBs[key].previousYearValue;
        }
      }

      if (pkScheme['_4073']["balance1"] <= 0) {
        pkScheme['_4073']["balance1"] = 0;
      }
      if (pkScheme['_4074']["balance1"] <= 0) {
        pkScheme['_4074']["balance1"] = 0;
      }
      if (pkScheme['_4075']["balance1"] <= 0) {
        pkScheme['_4075']["balance1"] = 0;
      }
      if (pkScheme['_4076']["balance1"] <= 0) {
        pkScheme['_4076']["balance1"] = 0;
      }
      if (pkScheme['_4077']["balance1"] <= 0) {
        pkScheme['_4077']["balance1"] = 0;
      }
      if (pkScheme['_4078']["balance1"] <= 0) {
        pkScheme['_4078']["balance1"] = 0;
      }
      if (pkScheme['_4079']["balance1"] <= 0) {
        pkScheme['_4079']["balance1"] = 0;
      }
      if (pkScheme['_4080']["balance1"] <= 0) {
        pkScheme['_4080']["balance1"] = 0;
      }
      if (pkScheme['_4081']["balance1"] <= 0) {
        pkScheme['_4081']["balance1"] = 0;
      }

      if (pkScheme['_4082']["balance1"] >= 0) {
        pkScheme['_4082']["balance1"] = 0;
      }
      if (pkScheme['_4083']["balance1"] >= 0) {
        pkScheme['_4083']["balance1"] = 0;
      }
      if (pkScheme['_4084']["balance1"] >= 0) {
        pkScheme['_4084']["balance1"] = 0;
      }
      if (pkScheme['_4085']["balance1"] >= 0) {
        pkScheme['_4085']["balance1"] = 0;
      }
      if (pkScheme['_4086']["balance1"] >= 0) {
        pkScheme['_4086']["balance1"] = 0;
      }
      if (pkScheme['_4087']["balance1"] >= 0) {
        pkScheme['_4087']["balance1"] = 0;
      }
      if (pkScheme['_4088']["balance1"] >= 0) {
        pkScheme['_4088']["balance1"] = 0;
      }
      if (pkScheme['_4089']["balance1"] >= 0) {
        pkScheme['_4089']["balance1"] = 0;
      }
      if (pkScheme['_4090']["balance1"] >= 0) {
        pkScheme['_4090']["balance1"] = 0;
      }
    }

    function processDataForExportsOnly(pkRecord) {
      loadScheme();

      var NUMBER_OF_LINES_IN_pk_REPORT = pkRecord.getLineCount({
        sublistId: 'recmachcustrecord_rsm_pkl_report_parent'
      });

      for (var i = 0; i < NUMBER_OF_LINES_IN_pk_REPORT; i++) {

        var aopCodeAtCurrentLine = pkRecord.getSublistText({
          sublistId: 'recmachcustrecord_rsm_pkl_report_parent',
          fieldId: 'custrecord_rsm_pkl_aop_code',
          line: i
        });

        var calculatedValueAtCurrentLine = pkRecord.getSublistValue({
          sublistId: 'recmachcustrecord_rsm_pkl_report_parent',
          fieldId: 'custrecord_rsm_pkl_calculated_value',
          line: i
        });

        var xmlValueAtCurrentLine = pkRecord.getSublistValue({
          sublistId: 'recmachcustrecord_rsm_pkl_report_parent',
          fieldId: 'custrecord_rsm_pkl_xml_value',
          line: i
        });

        var key = '_' + aopCodeAtCurrentLine;
        pkScheme[key]["balance1"] = xmlValueAtCurrentLine;
      }
    }

    function processData(datumOd, datumDo, pkRecord) {
      loadScheme();

      var subsidiaryId = pkRecord.getValue({
        fieldId: 'custrecord_rsm_pk_report_subsidiary'
      });

      var datumOd1YearAgo = '01.01.' + (dUtil.getYear(datumOd) - 1);
      var datumDo1YearAgo = '31.12.' + (dUtil.getYear(datumOd) - 1);

      var transactionsPrethodnaKrajne, transactionsPrethodnaPocetno, transactionsNaDan;

      //TODO: Dobiti transakcije za 3 razlicita tipa
      transactionsPrethodnaPocetno = transactionsSSBU(datumOd1YearAgo, datumDo1YearAgo, subsidiaryId, 'lastyear');
      transactionsPrethodnaKrajne = transactionsSSBU(datumOd, datumDo, subsidiaryId, 'currentyear');
      transactionsNaDan = transactionSSBS(datumOd1YearAgo, subsidiaryId);

      log.debug('transactionsPrethodnaPocetno', transactionsPrethodnaPocetno);
      log.debug('transactionsPrethodnaKrajne', transactionsPrethodnaKrajne);
      log.debug('transactionsTekucaGodina', transactionsNaDan);

      setBalancesAccounts(transactionsNaDan, transactionsPrethodnaKrajne, transactionsPrethodnaPocetno);
      roundValues();

      setBalancesAops(datumOd, datumDo, subsidiaryId, pkRecord);
      //setBalancesAops(datumOd, datumDo, subsidiaryId, pkRecord);
      //setBalancesAops(datumOd, datumDo, subsidiaryId, pkRecord);

      var NUMBER_OF_LINES_IN_pk_REPORT = pkRecord.getLineCount({
        sublistId: 'recmachcustrecord_rsm_pkl_report_parent'
      });

      for (var i = 0; i < NUMBER_OF_LINES_IN_pk_REPORT; i++) {

        var aopCodeAtCurrentLine = pkRecord.getSublistText({
          sublistId: 'recmachcustrecord_rsm_pkl_report_parent',
          fieldId: 'custrecord_rsm_pkl_aop_code',
          line: i
        });

        var currentSublistLine = pkRecord.selectLine({
          sublistId: 'recmachcustrecord_rsm_pkl_report_parent',
          line: i
        });

        pkRecord.setCurrentSublistValue({
          sublistId: 'recmachcustrecord_rsm_pkl_report_parent',
          fieldId: 'custrecord_rsm_pkl_calculated_value',
          value: pkScheme["_" + aopCodeAtCurrentLine]["balance1"]
        });

        pkRecord.setCurrentSublistValue({
          sublistId: 'recmachcustrecord_rsm_pkl_report_parent',
          fieldId: 'custrecord_rsm_pkl_xml_value',
          value: pkScheme["_" + aopCodeAtCurrentLine]["balance1"]
        });

        pkRecord.commitLine({
          sublistId: 'recmachcustrecord_rsm_pkl_report_parent'
        });
      }

      pkRecord.save();
    }

    function recalculateHelperFunction(datumOd, datumDo, pkRecord) {
      loadScheme();

      var subsidiaryId = pkRecord.getValue({
        fieldId: 'custrecord_rsm_pk_report_subsidiary'
      });

      var NUMBER_OF_LINES_IN_pk_REPORT = pkRecord.getLineCount({
        sublistId: 'recmachcustrecord_rsm_pkl_report_parent'
      });

      for (var i = 0; i < NUMBER_OF_LINES_IN_pk_REPORT; i++) {

        var aopCodeAtCurrentLine = pkRecord.getSublistText({
          sublistId: 'recmachcustrecord_rsm_pkl_report_parent',
          fieldId: 'custrecord_rsm_pkl_aop_code',
          line: i
        });

        var xmlValueAtCurrentLine = pkRecord.getSublistValue({
          sublistId: 'recmachcustrecord_rsm_pkl_report_parent',
          fieldId: 'custrecord_rsm_pkl_xml_value',
          line: i
        });

        var key = '_' + aopCodeAtCurrentLine;
        pkScheme[key]["balance1"] = xmlValueAtCurrentLine;
      }
      setBalancesAops(datumOd, datumDo, subsidiaryId, pkRecord);
      setBalancesAops(datumOd, datumDo, subsidiaryId, pkRecord);
      setBalancesAops(datumOd, datumDo, subsidiaryId, pkRecord);

      for (var i = 0; i < NUMBER_OF_LINES_IN_pk_REPORT; i++) {

        var aopCodeAtCurrentLine = pkRecord.getSublistText({
          sublistId: 'recmachcustrecord_rsm_pkl_report_parent',
          fieldId: 'custrecord_rsm_pkl_aop_code',
          line: i
        });

        var currentSublistLine = pkRecord.selectLine({
          sublistId: 'recmachcustrecord_rsm_pkl_report_parent',
          line: i
        });

        pkRecord.setCurrentSublistValue({
          sublistId: 'recmachcustrecord_rsm_pkl_report_parent',
          fieldId: 'custrecord_rsm_pkl_xml_value',
          value: pkScheme["_" + aopCodeAtCurrentLine]["balance1"]
        });

        pkRecord.commitLine({
          sublistId: 'recmachcustrecord_rsm_pkl_report_parent'
        });
      }
      pkRecord.save();
    }

    function loadScheme() {
      var file1 = file.load({
        id: "./pkScheme.json"
      });
      pkScheme = JSON.parse(file1.getContents());
    }

    // Create xml string with fields and values from pkScheme
    function createXMLString() {
      var xmlStr =
        "<Forma>" +
        "<Naziv>Bilans stanja</Naziv>" +
        "<Atributi>" +
        "<Naziv>Bilans stanja</Naziv>" +
        "<NumerickaPoljaForme xmlns:a='http://schemas.datacontract.org/2004/07/AppDef'>";

      var numerickaPoljaForme = "",
        tekstualnaPoljaForme = "";

      for (var key in pkScheme) {

        for (var i = 5; i < 8; i++) {

          var numerickoPolje = "<a:NumerickoPolje>";
          numerickoPolje += "<a:Naziv>aop-" + key.substr(1) + "-" + i + "</a:Naziv>";
          numerickoPolje += "<a:Vrednosti>" + (pkScheme[key]["balance" + (i - 4)]).toString() + "</a:Vrednosti>";
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

      xmlStr += "</Atributi></Forma>";

      return xmlStr;
    }

    function doPost(requestBody) {
      var recordIdPKReport = requestBody.idPKReport;
      var action = requestBody.action;
      var retVal = {
        "result": "Error"
      };

      if (action == "init_lines") {
        initialize_lines(recordIdPKReport);
        retVal = {
          "result": 'ok'
        }
      }
      if (action == "calc_lines") {
        calculate_lines(recordIdPKReport);
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
        exportXml(recordIdPKReport);
        retVal = {
          "result": 'ok'
        }
      }
      if (action == "pdf_file") {
        exportPdf(recordIdPKReport);
        retVal = {
          "result": 'ok'
        }
      }
      if (action == "xls_file") {
        exportXls(recordIdPKReport);
        retVal = {
          "result": 'ok'
        }
      }
      if (action == "recalculate_lines") {
        recalculate_lines(recordIdPKReport);
        retVal = {
          "result": 'ok'
        }
      }
      if (action == "delete_pdf") {
        deletePdf(recordIdPKReport);
        retVal = {
          "result": 'ok'
        }
      }
      if (action == "delete_xml") {
        deleteXml(recordIdPKReport);
        retVal = {
          "result": 'ok'
        }
      }
      if (action == "delete_xls") {
        deleteXls(recordIdPKReport);
        retVal = {
          "result": 'ok'
        }
      }
      if (action == "delete_lines") {
        deleteOldLines(recordIdPKReport);
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