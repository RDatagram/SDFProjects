/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 */
define(
    ['N/record', 'N/search', 'N/file', 'N/format', 'N/query', 'N/log', '../dateUtil', 'N/render', 'N/encode', 'N/util'],
    function (record, search, file, format, query, log, dateUtil, render, encode, util) {

        var dUtil = dateUtil.dateUtil;
        var buScheme = {};

        var positiveAops = ['1010', '1014', '1015', '1017', '1018', '1019', '1020', '1021', '1022', '1023', '1024', '1033', '1034', '1035',
            '1036', '1040', '1042', '1051', '1054'];
        var negativeAops = ['1003', '1004', '1006', '1007', '1008', '1009', '1011', '1012', '1028', '1029', '1030', '1031', '1039', '1041'];
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

        function fixConditionalAops(buScheme) {
            if (buScheme['_1025']["current_year"] < 0) {
                buScheme['_1025']["current_year"] = 0
            }
            if (buScheme['_1025']["last_year"] < 0) {
                buScheme['_1025']["last_year"] = 0
            }

            if (buScheme['_1026']["current_year"] < 0) {
                buScheme['_1026']["current_year"] = 0
            }
            if (buScheme['_1026']["last_year"] < 0) {
                buScheme['_1026']["last_year"] = 0
            }

            if (buScheme['_1037']["current_year"] < 0) {
                buScheme['_1037']["current_year"] = 0
            }
            if (buScheme['_1037']["last_year"] < 0) {
                buScheme['_1037']["last_year"] = 0
            }

            if (buScheme['_1038']["current_year"] < 0) {
                buScheme['_1038']["current_year"] = 0
            }
            if (buScheme['_1038']["last_year"] < 0) {
                buScheme['_1038']["last_year"] = 0
            }

            if (buScheme['_1045']["current_year"] < 0) {
                buScheme['_1045']["current_year"] = 0
            }
            if (buScheme['_1045']["last_year"] < 0) {
                buScheme['_1045']["last_year"] = 0
            }

            if (buScheme['_1046']["current_year"] < 0) {
                buScheme['_1046']["current_year"] = 0
            }
            if (buScheme['_1046']["last_year"] < 0) {
                buScheme['_1046']["last_year"] = 0
            }

            if (buScheme['_1049']["current_year"] < 0) {
                buScheme['_1049']["current_year"] = 0
            }
            if (buScheme['_1049']["last_year"] < 0) {
                buScheme['_1049']["last_year"] = 0
            }

            if (buScheme['_1050']["current_year"] < 0) {
                buScheme['_1050']["current_year"] = 0
            }
            if (buScheme['_1050']["last_year"] < 0) {
                buScheme['_1050']["last_year"] = 0
            }

            if (buScheme['_1052']["current_year"] < 0) {
                buScheme['_1053']["current_year"] = (-1) * buScheme['_1052']["current_year"];
                buScheme['_1052']["current_year"] = 0;
            }
            if (buScheme['_1052']["last_year"] < 0) {
                buScheme['_1053']["last_year"] = (-1) * buScheme['_1052']["last_year"];
                buScheme['_1052']["last_year"] = 0;
            }

            if (buScheme['_1055']["current_year"] < 0) {
                buScheme['_1055']["current_year"] = 0
            }
            if (buScheme['_1055']["last_year"] < 0) {
                buScheme['_1055']["last_year"] = 0
            }

            if (buScheme['_1056']["current_year"] < 0) {
                buScheme['_1056']["current_year"] = 0
            }
            if (buScheme['_1056']["last_year"] < 0) {
                buScheme['_1056']["last_year"] = 0
            }
            return buScheme
        }

        function deleteOldLines(recordId) {
            var linesSavedSearch = search.create({
                'type': 'customrecord_rsm_bu_report_lines',
                filters: ['custrecord_rsm_bu_report_parent', 'is', recordId]
            });
            var linesSSInstance = linesSavedSearch.run().each(function (pl_line) {
                record['delete']({
                    type: 'customrecord_rsm_bu_report_lines',
                    id: pl_line.id
                })
                return true;
            });
        }

        // Reset of all the lines, deleting the ones that already exist - adding new lines with value 0
        function initialize_lines(recordId) {
            deleteOldLines(recordId);

            var recordBUReport = record.load({
                type: 'customrecord_rsm_bu_report',
                id: recordId,
                isDynamic: true
            });

            var aopCodesSavedSearch = search.create({
                'type': 'customrecord_rsm_aop_bu_code',
                columns: ['name']
            });

            var result = aopCodesSavedSearch.run().each(function (aopCodeData) {

                recordBUReport.selectNewLine({
                    sublistId: 'recmachcustrecord_rsm_bu_report_parent'
                });
                recordBUReport.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsm_bu_report_parent',
                    fieldId: 'custrecord_rsm_bul_aop_code',
                    value: aopCodeData.id
                });
                var zero = 0;
                recordBUReport.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsm_bu_report_parent',
                    fieldId: 'custrecord_rsm_bul_cy_calculated',
                    value: zero
                });
                recordBUReport.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsm_bu_report_parent',
                    fieldId: 'custrecord_rsm_bul_cy_xml',
                    value: zero
                });
                recordBUReport.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsm_bu_report_parent',
                    fieldId: 'custrecord_rsm_bul_py_calculated',
                    value: zero
                });
                recordBUReport.commitLine({
                    sublistId: 'recmachcustrecord_rsm_bu_report_parent'
                });
                return true;
            });
            recordBUReport.save();
        }

        function calculate_lines(recordId) {

            var recordBUReport = record.load({
                type: 'customrecord_rsm_bu_report',
                id: recordId,
                isDynamic: true
            });

            var periodOd = format.format({
                value: recordBUReport.getValue("custrecord_rsm_bu_report_period_od"),
                type: format.Type.DATE
            });
            var periodDo = format.format({
                value: recordBUReport.getValue("custrecord_rsm_bu_report_period_do"),
                type: format.Type.DATE
            });

            processData(periodOd, periodDo, recordBUReport);
        }

        function recalculate_lines(recordId) {

            var recordBUReport = record.load({
                type: 'customrecord_rsm_bu_report',
                id: recordId,
                isDynamic: true
            });
            recalculateHelperFunction(recordBUReport);
        }

        function exportPdf(recordId) {

            var recordBUReport = record.load({
                type: 'customrecord_rsm_bu_report',
                id: recordId,
                isDynamic: true
            });

            var periodOd = format.format({
                value: recordBUReport.getValue("custrecord_rsm_bu_report_period_od"),
                type: format.Type.DATE
            });
            var periodDo = format.format({
                value: recordBUReport.getValue("custrecord_rsm_bu_report_period_do"),
                type: format.Type.DATE
            });
            var maticniBroj = recordBUReport.getText('custrecord_rsm_bu_report_maticni_broj');
            var sifraDelatnosti = recordBUReport.getText('custrecord_rsm_bu_report_sifra_del');
            var pib = recordBUReport.getText('custrecord_rsm_bu_report_pib');

            processDataForExportsOnly(recordBUReport);

            var renderer = render.create();

            var addressAndName = getAddressAndName(recordBUReport.getValue('custrecord_rsm_bu_report_subsidiary'))

            var jsonObj = {
                datum_od: srbDate(periodOd),
                datum_do: srbDate(periodDo),
                maticniBroj: maticniBroj,
                sifraDelatnosti: sifraDelatnosti,
                pib: pib,
                naziv: addressAndName.name,
                sediste: addressAndName.address,
                buScheme: buScheme
            };

            renderer.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias: "JSON",
                data: jsonObj
            });

            renderer.setTemplateByScriptId("CUSTTMPL_RSM_BILANS_USPEHA_HTML_PDF_TEMPLATE");
            var pdfFile = renderer.renderAsPdf();
            pdfFile.name = "Bilans uspeha-" + srbDate(periodOd) + "-" + srbDate(periodDo) + ".pdf";

            // Delete the old pdf file if it already exists
            var oldFileId = recordBUReport.getValue("custrecord_rsm_bu_report_pdf_file");
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

            recordBUReport.setValue({
                fieldId: 'custrecord_rsm_bu_report_pdf_file',
                value: newPdfFileId
            });
            recordBUReport.save();
        }

        function exportXls(recordId) {

            var recordBUReport = record.load({
                type: 'customrecord_rsm_bu_report',
                id: recordId,
                isDynamic: true
            });

            var periodOd = format.format({
                value: recordBUReport.getValue("custrecord_rsm_bu_report_period_od"),
                type: format.Type.DATE
            });
            var periodDo = format.format({
                value: recordBUReport.getValue("custrecord_rsm_bu_report_period_do"),
                type: format.Type.DATE
            });
            var maticniBroj = recordBUReport.getText('custrecord_rsm_bu_report_maticni_broj');
            var sifraDelatnosti = recordBUReport.getText('custrecord_rsm_bu_report_sifra_del');
            var pib = recordBUReport.getText('custrecord_rsm_bu_report_pib');

            processDataForExportsOnly(recordBUReport);


            var jsonObj = {
                datum_od: srbDate(periodOd),
                datum_do: srbDate(periodDo),
                maticniBroj: maticniBroj,
                sifraDelatnosti: sifraDelatnosti,
                pib: pib,
                naziv: "",
                sediste: "",
                buScheme: buScheme
            };
            var xmlTemplate = file.load({id: '../finansijski_templates/bu_excel_template.xml'});
            var content = xmlTemplate.getContents();


            var renderer = render.create();
            renderer.templateContent = content;

            renderer.addCustomDataSource({
                format: render.DataSource.JSON,
                alias: "JSON",
                data: JSON.stringify(jsonObj)
            });

            var xmlString = renderer.renderAsString();

            var fileName = "Bilans uspeha-" + srbDate(periodOd) + "-" + srbDate(periodDo) + ".xls";

            // Delete the old pdf file if it already exists
            var oldFileId = recordBUReport.getValue("custrecord_rsm_bu_report_xls_file");
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

            recordBUReport.setValue({
                fieldId: 'custrecord_rsm_bu_report_xls_file',
                value: xlsFileId
            });
            recordBUReport.save();
        }

        function exportXml(recordId) {

            var recordBUReport = record.load({
                type: 'customrecord_rsm_bu_report',
                id: recordId,
                isDynamic: true
            });

            var periodOd = format.format({
                value: recordBUReport.getValue("custrecord_rsm_bu_report_period_od"),
                type: format.Type.DATE
            });
            var periodDo = format.format({
                value: recordBUReport.getValue("custrecord_rsm_bu_report_period_do"),
                type: format.Type.DATE
            });

            processDataForExportsOnly(recordBUReport);

            var xmlString = createXMLString();
            var fileName = "Bilans uspeha-" + srbDate(periodOd) + "-" + srbDate(periodDo) + ".xml";
            // Delete the old xml file if it already exists
            var oldFileId = recordBUReport.getValue("custrecord_rsm_bu_report_xml_file");
            if (oldFileId) {
                file.delete({
                    id: oldFileId
                });
                log.audit('Success', 'Old pdf file deleted!');
            };

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

            recordBUReport.setValue({
                fieldId: 'custrecord_rsm_bu_report_xml_file',
                value: newXmlFileId
            });
            recordBUReport.save();

        }

        function deletePdf(recordId) {
            var recordBUReport = record.load({
                type: 'customrecord_rsm_bu_report',
                id: recordId,
                isDynamic: true
            });

            var oldFileId = recordBUReport.getValue("custrecord_rsm_bu_report_pdf_file");
            if (oldFileId) {
                file.delete({
                    id: oldFileId
                });
                log.audit('Success', 'Old pdf file deleted!');
            };
        }

        function deleteXls(recordId) {
            var recordBSReport = record.load({
                type: 'customrecord_rsm_bu_report',
                id: recordId,
                isDynamic: true
            });

            var oldFileId = recordBSReport.getValue("custrecord_rsm_bu_report_xls_file");
            if (oldFileId) {
                file.delete({
                    id: oldFileId
                });
                log.audit('Success', 'Old xls file deleted!');
            }
        }

        function deleteXml(recordId) {
            var recordBUReport = record.load({
                type: 'customrecord_rsm_bu_report',
                id: recordId,
                isDynamic: true
            });

            var oldFileId = recordBUReport.getValue("custrecord_rsm_bu_report_xml_file");
            if (oldFileId) {
                file.delete({
                    id: oldFileId
                });
                log.audit('Success', 'Old xml file deleted!');
            };
        }
        function account59transactions(firstDate, lastDate, subsidiaryId) {
            var transactionSearchObj = search.create({
                type: "transaction",
                filters:
                  [
                      ["posting","is","T"],
                      "AND",
                      ["subsidiary","anyof", subsidiaryId],
                      "AND",
                      ["accountingperiod.startdate",search.Operator.ONORAFTER, firstDate],
                      "AND",
                      ["accountingperiod.startdate",search.Operator.ONORBEFORE, lastDate],
                      "AND",
                      ["account.number","startswith","59"]
                  ],
                columns:
                  [
                      search.createColumn({
                          name: "creditamount",
                          summary: "SUM",
                          label: "Amount (Credit)"
                      }),
                      search.createColumn({
                          name: "debitamount",
                          summary: "SUM",
                          label: "Amount (Debit)"
                      })
                  ]
            }).run();

            var obj = {};
            var results = [],
              start = 0,
              end = 1000;

            while (true) {
                var tempList = transactionSearchObj.getRange({
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
                var debitAmount = (allValues['SUM(debitamount)']) ? parseFloat(allValues['SUM(debitamount)']) : 0;
                var creditAmount = (allValues['SUM(creditamount)']) ? parseFloat(allValues['SUM(creditamount)']) : 0;
                var balance_between_periods = Math.abs(debitAmount - creditAmount);
                balance_between_periods = balance_between_periods / 1000;

                obj['59'] = {
                    "credit_amount": (creditAmount) ? creditAmount : 0,
                    "debit_amount": (debitAmount) ? debitAmount : 0,
                    "balance_between_periods": balance_between_periods
                };
                return true;
            });
            return obj['59'].balance_between_periods;
        }

        function account69transaction(firstDate, lastDate, subsidiaryId) {
            var transactionSearchObj = search.create({
                type: "transaction",
                filters:
                  [
                      ["posting","is","T"],
                      "AND",
                      ["subsidiary","anyof", subsidiaryId],
                      "AND",
                      ["accountingperiod.startdate",search.Operator.ONORAFTER, firstDate],
                      "AND",
                      ["accountingperiod.startdate",search.Operator.ONORBEFORE, lastDate],
                      "AND",
                      ["account.number","startswith","59"]
                  ],
                columns:
                  [
                      search.createColumn({
                          name: "creditamount",
                          summary: "SUM",
                          label: "Amount (Credit)"
                      }),
                      search.createColumn({
                          name: "debitamount",
                          summary: "SUM",
                          label: "Amount (Debit)"
                      })
                  ]
            }).run();

            var obj = {};
            var results = [],
              start = 0,
              end = 1000;

            while (true) {
                var tempList = transactionSearchObj.getRange({
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
                var debitAmount = (allValues['SUM(debitamount)']) ? parseFloat(allValues['SUM(debitamount)']) : 0;
                var creditAmount = (allValues['SUM(creditamount)']) ? parseFloat(allValues['SUM(creditamount)']) : 0;
                var balance_between_periods = Math.abs(debitAmount - creditAmount);
                balance_between_periods = balance_between_periods / 1000;

                obj['69'] = {
                    "credit_amount": (creditAmount) ? creditAmount : 0,
                    "debit_amount": (debitAmount) ? debitAmount : 0,
                    "balance_between_periods": balance_between_periods
                };
                return true;
            });
            return obj['69'].balance_between_periods;
        }

        function transactionsSS(firstDate, lastDate, subsidiaryId) {

            var aopSearch = search.create({
                type: "transaction",
                filters: [
                    ["posting", "is", "T"],
                    "AND",
                    ["account.custrecord_rsm_aop_bu_code", "noneof", "@NONE@"],
                    "AND",
                    ["subsidiary", "anyof", subsidiaryId],
                    "AND",
                    ["accountingperiod.startdate", search.Operator.ONORBEFORE, lastDate],
                    "AND",
                    ["accountingperiod.startdate", search.Operator.ONORAFTER, firstDate]
                ],
                columns: [
                    search.createColumn({
                        name: "custrecord_rsm_aop_bu_code",
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
                var aopCodeValue = allValues['GROUP(account.custrecord_rsm_aop_bu_code)'][0]['value'];
                var aopCodeText = allValues['GROUP(account.custrecord_rsm_aop_bu_code)'][0]['text'];
                var debitAmount = (allValues['SUM(debitamount)']) ? parseFloat(allValues['SUM(debitamount)']) : 0;
                var creditAmount = (allValues['SUM(creditamount)']) ? parseFloat(allValues['SUM(creditamount)']) : 0;
                var balance_between_periods = Math.abs(debitAmount - creditAmount);
                balance_between_periods = balance_between_periods / 1000;

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
        function roundValues() {
            for (var key in buScheme) {
                buScheme[key]["current_year"] = Math.round(buScheme[key]["current_year"]);
                buScheme[key]["last_year"] = Math.round(buScheme[key]["last_year"]);
            }
        }

        // Calculate balances of fields containing accounts
        function setBalancesAccounts(obj1, obj2) {

            for (var aopCodeObj1 in obj1) {
                var fixedAop = '_' + aopCodeObj1;
                buScheme[fixedAop]["current_year"] = obj1[aopCodeObj1]["balance_between_periods"];
            }

            for (var aopCodeObj2 in obj2) {
                var fixedAop = '_' + aopCodeObj2;
                buScheme[fixedAop]["last_year"] = obj2[aopCodeObj2]["balance_between_periods"];
            }
        }

        // Calculate balances of fields containing aops
        function setBalancesAops() {
            for (var key in buScheme) {
                if (buScheme[key].hasOwnProperty("aops")) {
                    var sum = 0, sum2 = 0;
                    var aops = buScheme[key]["aops"];
                    for (var i = 0; i < aops.length; i++) {
                        var result = aops[i].split(/\s/);
                        var sign = result[0], aop = result[1];
                        if (sign === "+") {
                            sum += buScheme["_" + aop]["current_year"];
                            sum2 += buScheme["_" + aop]["last_year"];
                        } else {
                            sum -= buScheme["_" + aop]["current_year"];
                            sum2 -= buScheme["_" + aop]["last_year"];
                        }

                    }
                    buScheme[key]["current_year"] = (sum > 0) ? sum : 0;
                    buScheme[key]["last_year"] = (sum2 > 0) ? sum2 : 0;
                }
            }
            buScheme = fixConditionalAops(buScheme);
        }

        function processDataForExportsOnly(record) {
            loadScheme();

            var NUMBER_OF_LINES_IN_BU_REPORT = record.getLineCount({
                sublistId: 'recmachcustrecord_rsm_bu_report_parent'
            });

            for (var i = 0; i < NUMBER_OF_LINES_IN_BU_REPORT; i++) {

                var aopCodeAtCurrentLine = record.getSublistText({
                    sublistId: 'recmachcustrecord_rsm_bu_report_parent',
                    fieldId: 'custrecord_rsm_bul_aop_code',
                    line: i
                });

                var xmlValueAtCurrentLine = record.getSublistValue({
                    sublistId: 'recmachcustrecord_rsm_bu_report_parent',
                    fieldId: 'custrecord_rsm_bul_cy_xml',
                    line: i
                });

                var prevYearValueAtCurrentLine = record.getSublistValue({
                    sublistId: 'recmachcustrecord_rsm_bu_report_parent',
                    fieldId: 'custrecord_rsm_bul_py_calculated',
                    line: i
                });

                key = '_' + aopCodeAtCurrentLine;
                buScheme[key]["current_year"] = xmlValueAtCurrentLine;
                buScheme[key]["last_year"] = prevYearValueAtCurrentLine;

            }
        }

        function processData(periodOd, periodDo, buRecord) {
            loadScheme();

            var subsidiaryId = buRecord.getValue({
                fieldId: 'custrecord_rsm_bu_report_subsidiary'
            })

            var periodOdLastYear = '01.01.2020' //+ (dUtil.getYear(periodOd) - 1);
            var periodDoLastYear = '31.07.2020' //+ (dUtil.getYear(periodOd) - 1);

            var transactionsPrethodnaGodina, transactionsTekucaGodina;
            transactionsTekucaGodina = transactionsSS(periodOd, periodDo, subsidiaryId);
            transactionsPrethodnaGodina = transactionsSS(periodOdLastYear, periodDoLastYear, subsidiaryId);

            var account59TekucaGodina = account59transactions(periodOd, periodDo, subsidiaryId);
            var account59PrethodnaGodina = account59transactions(periodOdLastYear, periodDoLastYear, subsidiaryId);

            var account69TekucaGodina = account69transaction(periodOd, periodDo, subsidiaryId);
            var account69PrethodnaGodina = account69transaction(periodOdLastYear, periodDoLastYear, subsidiaryId);


            if ((account69TekucaGodina - account59TekucaGodina) > 0) {
                buScheme['_1047']["current_year"] = account69TekucaGodina - account59TekucaGodina;
            } else {
                buScheme['_1048']["current_year"] = account59TekucaGodina - account69TekucaGodina;
            }

            if ((account69PrethodnaGodina - account59PrethodnaGodina) > 0) {
                buScheme['_1047']["last_year"] = account69PrethodnaGodina - account59PrethodnaGodina;
            } else {
                buScheme['_1048']["last_year"] = account59PrethodnaGodina - account69PrethodnaGodina;
            }

            setBalancesAccounts(transactionsTekucaGodina, transactionsPrethodnaGodina);
            roundValues();

            setBalancesAops();
            setBalancesAops();

            var NUMBER_OF_LINES_IN_BU_REPORT = buRecord.getLineCount({
                sublistId: 'recmachcustrecord_rsm_bu_report_parent'
            });

            for (var i = 0; i < NUMBER_OF_LINES_IN_BU_REPORT; i++) {

                var aopTextAtCurrentLine = buRecord.getSublistText({
                    sublistId: 'recmachcustrecord_rsm_bu_report_parent',
                    fieldId: 'custrecord_rsm_bul_aop_code',
                    line: i
                });

                var currentSublistLine = buRecord.selectLine({
                    sublistId: 'recmachcustrecord_rsm_bu_report_parent',
                    line: i
                });

                buRecord.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsm_bu_report_parent',
                    fieldId: 'custrecord_rsm_bul_cy_calculated',
                    value: buScheme["_" + aopTextAtCurrentLine]["current_year"]
                });

                buRecord.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsm_bu_report_parent',
                    fieldId: 'custrecord_rsm_bul_cy_xml',
                    value: buScheme["_" + aopTextAtCurrentLine]["current_year"]
                });

                buRecord.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsm_bu_report_parent',
                    fieldId: 'custrecord_rsm_bul_py_calculated',
                    value: buScheme["_" + aopTextAtCurrentLine]["last_year"]
                });

                buRecord.commitLine({
                    sublistId: 'recmachcustrecord_rsm_bu_report_parent'
                });
            }
            buRecord.save();
        }

        function recalculateHelperFunction(buRecord) {
            loadScheme();

            var NUMBER_OF_LINES_IN_BU_REPORT = buRecord.getLineCount({
                sublistId: 'recmachcustrecord_rsm_bu_report_parent'
            });

            for (var i = 0; i < NUMBER_OF_LINES_IN_BU_REPORT; i++) {

                var aopCodeAtCurrentLine = buRecord.getSublistText({
                    sublistId: 'recmachcustrecord_rsm_bu_report_parent',
                    fieldId: 'custrecord_rsm_bul_aop_code',
                    line: i
                });

                var xmlValueAtCurrentLine = buRecord.getSublistValue({
                    sublistId: 'recmachcustrecord_rsm_bu_report_parent',
                    fieldId: 'custrecord_rsm_bul_cy_xml',
                    line: i
                });

                buScheme["_" + aopCodeAtCurrentLine]["current_year"] = xmlValueAtCurrentLine;
                buScheme["_" + aopCodeAtCurrentLine]["last_year"] = 0;
            }
            setBalancesAops();
            setBalancesAops();

            for (var i = 0; i < NUMBER_OF_LINES_IN_BU_REPORT; i++) {

                var aopCodeAtCurrentLine = buRecord.getSublistText({
                    sublistId: 'recmachcustrecord_rsm_bu_report_parent',
                    fieldId: 'custrecord_rsm_bul_aop_code',
                    line: i
                });

                var currentSublistLine = buRecord.selectLine({
                    sublistId: 'recmachcustrecord_rsm_bu_report_parent',
                    line: i
                });

                buRecord.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsm_bu_report_parent',
                    fieldId: 'custrecord_rsm_bul_cy_xml',
                    value: buScheme["_" + aopCodeAtCurrentLine]["current_year"]
                });

                buRecord.commitLine({
                    sublistId: 'recmachcustrecord_rsm_bu_report_parent'
                });
            }
            buRecord.save();
        }

        function loadScheme() {
            var file1 = file.load({
                id: "./bu_scheme.json"
            });
            buScheme = JSON.parse(file1.getContents());
        }

        /// Create xml string with fields and values from buScheme
        function createXMLString() {
            var xmlStr =
              "<FiForma xmlns:i='http://www.w3.org/2001/XMLSchema-instance' xmlns='http://schemas.datacontract.org/2004/07/Domain.Model'>" +
                "<Naziv>Bilans uspeha</Naziv>" +
                "<NumerickaPoljaForme xmlns:a='http://schemas.datacontract.org/2004/07/AppDef'>";

            var numerickaPoljaForme = "",
                tekstualnaPoljaForme = "";

            for (var key in buScheme) {

                var numerickoPolje = "<a:NumerickoPolje>";
                numerickoPolje += "<a:Naziv>aop-" + key.substr(1) + "-5</a:Naziv>";
                numerickoPolje += "<a:Vrednosti>" + (buScheme[key]["current_year"]).toString() + "</a:Vrednosti>";
                numerickoPolje += "</a:NumerickoPolje>";

                numerickaPoljaForme += numerickoPolje;

                numerickoPolje = "<a:NumerickoPolje>";
                numerickoPolje += "<a:Naziv>aop-" + key.substr(1) + "-6</a:Naziv>";
                numerickoPolje += "<a:Vrednosti>" + (buScheme[key]["last_year"]).toString() + "</a:Vrednosti>";
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

            xmlStr += "</FiForma>";

            return xmlStr;
        }

        function doPost(requestBody) {

            var recordIdBUReport = requestBody.idBUReport;
            var action = requestBody.action;
            var retVal = {
                "result": "Error"
            };

            if (action == "init_lines") {
                initialize_lines(recordIdBUReport);
                retVal = {
                    "result": 'ok'
                }
            }
            if (action == "calc_lines") {
                calculate_lines(recordIdBUReport);
                if (badlyCalculatedAops.length > 0) {
                    retVal = {
                        "result": 'ok',
                        "badAops": badlyCalculatedAops
                    }
                } else {
                    retVal = {
                        "result": 'ok'
                    }
                }
            }
            if (action == "xml_file") {
                exportXml(recordIdBUReport);
                retVal = {
                    "result": 'ok'
                }
            }
            if (action == "pdf_file") {
                exportPdf(recordIdBUReport);
                retVal = {
                    "result": 'ok'
                }
            }
            if (action == "xls_file") {
                exportXls(recordIdBUReport);
                retVal = {
                    "result": 'ok'
                }
            }
            if (action == "recalculate_lines") {
                recalculate_lines(recordIdBUReport);
                retVal = {
                    "result": 'ok'
                }
            }
            if (action == "delete_pdf") {
                deletePdf(recordIdBUReport);
                retVal = {
                    "result": 'ok'
                }
            }
            if (action == "delete_xml") {
                deleteXml(recordIdBUReport);
                retVal = {
                    "result": 'ok'
                }
            }
            if (action == "delete_xls") {
                deleteXls(recordIdBUReport);
                retVal = {
                    "result": 'ok'
                }
            }
            if (action == "delete_lines") {
                deleteOldLines(recordIdBUReport);
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