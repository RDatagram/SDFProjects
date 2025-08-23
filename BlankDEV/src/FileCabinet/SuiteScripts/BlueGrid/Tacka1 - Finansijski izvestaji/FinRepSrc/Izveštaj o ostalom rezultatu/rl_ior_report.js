/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 */
define(['N/record', 'N/search', 'N/file', 'N/format', 'N/query', 'N/log', '../dateUtil', 'N/render', 'N/encode', 'N/util'], function (record, search, file, format, query, log, dateUtil, render, encode, util) {

    var dUtil = dateUtil.dateUtil;
    var iorScheme = {};
    var iorRecord;
    var subsidiaryId = 0;
    var periodOd, periodDo;
    var periodOdLastYear, periodDoLastYear;
    var messageToSend = "";

    var positiveAops = [2004, 2006, 2008, 2010, 2012, 2014, 2016, 2018, 2020, 2022, 2024, 2026];
    var negativeAops = [2003, 2005, 2007, 2009, 2011, 2013, 2015, 2017, 2019, 2021, 2023, 2025];
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

    function fixConditionalAops(iorScheme) {
        if (iorScheme['_2019']["current_year"] < 0) {
            iorScheme['_2019']["current_year"] = 0
        }
        if (iorScheme['_2019']["last_year"] < 0) {
            iorScheme['_2019']["last_year"] = 0
        }

        if (iorScheme['_2020']["current_year"] < 0) {
            iorScheme['_2020']["current_year"] = 0
        }
        if (iorScheme['_2020']["last_year"] < 0) {
            iorScheme['_2020']["last_year"] = 0
        }

        if (iorScheme['_2023']["current_year"] < 0) {
            iorScheme['_2023']["current_year"] = 0
        }
        if (iorScheme['_2023']["last_year"] < 0) {
            iorScheme['_2023']["last_year"] = 0
        }

        if (iorScheme['_2024']["current_year"] < 0) {
            iorScheme['_2024']["current_year"] = 0
        }
        if (iorScheme['_2024']["last_year"] < 0) {
            iorScheme['_2024']["last_year"] = 0
        }

        if (iorScheme['_2025']["current_year"] < 0) {
            iorScheme['_2025']["current_year"] = 0
        }
        if (iorScheme['_2025']["last_year"] < 0) {
            iorScheme['_2025']["last_year"] = 0
        }

        if (iorScheme['_2025']["current_year"] < 0) {
            iorScheme['_2025']["current_year"] = 0
        }
        if (iorScheme['_2025']["last_year"] < 0) {
            iorScheme['_2025']["last_year"] = 0
        }

        if (iorScheme['_2026']["current_year"] < 0) {
            iorScheme['_2026']["current_year"] = 0
        }
        if (iorScheme['_2026']["last_year"] < 0) {
            iorScheme['_2026']["last_year"] = 0
        }

        if (iorScheme['_2027']["current_year"] <= 0) {
            iorScheme['_2027']["current_year"] = 0
        }
        if (iorScheme['_2027']["last_year"] <= 0) {
            iorScheme['_2027']["last_year"] = 0
        }
        return iorScheme
    }

    function deleteOldLines(recordId) {
        var allLines = search.create({
            type: "customrecord_rsm_ior_report_lines",
            columns: ['custrecord_rsm_iorl_report_parent'],
            filters: [
                ["custrecord_rsm_iorl_report_parent", "is", recordId]
            ]
        }).run();
        allLines.each(function (line) {
            record.delete({
                type: 'customrecord_rsm_ior_report_lines',
                id: line.id,
            });
            return true
        });
    }

    // Reset of all the lines, deleting the ones that already exist - adding new lines with value 0
    function initialize_lines(recordId) {

        deleteOldLines(recordId);

        var recordIORReport = record.load({
            type: 'customrecord_rsm_ior_report',
            id: recordId,
            isDynamic: true
        });

        var aopCodesSavedSearch = search.create({
            type: 'customrecord_rsm_aop_ior_code',
            columns: ['name', 'custrecord_rsm_aop_ior_code_description']
        });

        aopCodesSavedSearch.run().each(function (aopCodeData) {

            recordIORReport.selectNewLine({
                sublistId: 'recmachcustrecord_rsm_iorl_report_parent'
            });
            recordIORReport.setCurrentSublistValue({
                sublistId: 'recmachcustrecord_rsm_iorl_report_parent',
                fieldId: 'custrecord_rsm_iorl_aop_code',
                value: aopCodeData.id
            });
            recordIORReport.setCurrentSublistValue({
                sublistId: 'recmachcustrecord_rsm_iorl_report_parent',
                fieldId: 'custrecord_rsm_iorl_pozicija',
                value: aopCodeData.getValue('custrecord_rsm_aop_ior_code_description')
            });
            recordIORReport.setCurrentSublistValue({
                sublistId: 'recmachcustrecord_rsm_iorl_report_parent',
                fieldId: 'custrecord_rsm_iorl_cy_calculated',
                value: 0
            });
            recordIORReport.setCurrentSublistValue({
                sublistId: 'recmachcustrecord_rsm_iorl_report_parent',
                fieldId: 'custrecord_rsm_iorl_cy_xml',
                value: 0
            });
            recordIORReport.setCurrentSublistValue({
                sublistId: 'recmachcustrecord_rsm_iorl_report_parent',
                fieldId: 'custrecord_rsm_iorl_py_calculated',
                value: 0
            });
            recordIORReport.commitLine({
                sublistId: 'recmachcustrecord_rsm_iorl_report_parent'
            });
            return true;
        });

        recordIORReport.save();
    }

    function calculate_lines(recordId) {
        iorRecord = record.load({
            type: 'customrecord_rsm_ior_report',
            id: recordId,
            isDynamic: true
        });

        periodOd = format.format({
            value: iorRecord.getValue("custrecord_rsm_ior_report_period_od"),
            type: format.Type.DATE
        });
        periodDo = format.format({
            value: iorRecord.getValue("custrecord_rsm_ior_report_period_do"),
            type: format.Type.DATE
        });

        processData(periodOd, periodDo, iorRecord);
    }

    function recalculate_lines(recordId) {
        iorRecord = record.load({
            type: 'customrecord_rsm_ior_report',
            id: recordId,
            isDynamic: true
        });
        recalculateHelperFunction(iorRecord);
    }

    function exportPdf(recordId) {

        var recordIORReport = record.load({
            type: 'customrecord_rsm_ior_report',
            id: recordId,
            isDynamic: true
        });

        var periodOd = format.format({
            value: recordIORReport.getValue("custrecord_rsm_ior_report_period_od"),
            type: format.Type.DATE
        });
        var periodDo = format.format({
            value: recordIORReport.getValue("custrecord_rsm_ior_report_period_do"),
            type: format.Type.DATE
        });
        var maticniBroj = recordIORReport.getText('custrecord_rsm_ior_report_maticni_broj');
        var sifraDelatnosti = recordIORReport.getText('custrecord_rsm_ior_report_sifra_del');
        var pib = recordIORReport.getText('custrecord_rsm_ior_report_pib');

        processDataForExportsOnly(recordIORReport);

        var renderer = render.create();

        var addressAndName = getAddressAndName(recordIORReport.getValue('custrecord_rsm_ior_report_subsidiary'))

        var jsonObj = {
            datum_od: srbDate(periodOd),
            datum_do: srbDate(periodDo),
            maticniBroj: maticniBroj,
            sifraDelatnosti: sifraDelatnosti,
            pib: pib,
            naziv: addressAndName.name,
            sediste: addressAndName.address,
            iorScheme: iorScheme
        };

        renderer.addCustomDataSource({
            format: render.DataSource.OBJECT,
            alias: "JSON",
            data: jsonObj
        });

        renderer.setTemplateByScriptId("CUSTTMPL_IOR_HTML_PDF_TEMPLATE");
        var pdfFile = renderer.renderAsPdf();
        pdfFile.name = "Izvestaj o ostalom rezultatu-" + srbDate(periodOd) + "-" + srbDate(periodDo) + ".pdf";

        // Delete the old pdf file if it already exists
        var oldFileId = recordIORReport.getValue("custrecord_rsm_ior_report_pdf_file");
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

        recordIORReport.setValue({
            fieldId: 'custrecord_rsm_ior_report_pdf_file',
            value: newPdfFileId
        });
        recordIORReport.save();
    }

    function exportXls(recordId) {

        var recordIORReport = record.load({
            type: 'customrecord_rsm_ior_report',
            id: recordId,
            isDynamic: true
        });

        var periodOd = format.format({
            value: recordIORReport.getValue("custrecord_rsm_ior_report_period_od"),
            type: format.Type.DATE
        });
        var periodDo = format.format({
            value: recordIORReport.getValue("custrecord_rsm_ior_report_period_do"),
            type: format.Type.DATE
        });
        var maticniBroj = recordIORReport.getText('custrecord_rsm_ior_report_maticni_broj');
        var sifraDelatnosti = recordIORReport.getText('custrecord_rsm_ior_report_sifra_del');
        var pib = recordIORReport.getText('custrecord_rsm_ior_report_pib');

        processDataForExportsOnly(recordIORReport);

        var jsonObj = {
            datum_od: srbDate(periodOd),
            datum_do: srbDate(periodDo),
            maticniBroj: maticniBroj,
            sifraDelatnosti: sifraDelatnosti,
            pib: pib,
            naziv: "",
            sediste: "",
            iorScheme: iorScheme
        };
        var xmlTemplate = file.load({ id: '../finansijski_templates/ior_excel_template.xml' });
        var content = xmlTemplate.getContents();

        var renderer = render.create();
        renderer.templateContent = content;

        renderer.addCustomDataSource({
            format: render.DataSource.JSON,
            alias: "JSON",
            data: JSON.stringify(jsonObj)
        });

        var xmlString = renderer.renderAsString();

        var fileName = "Izvestaj o ostalom rezultatu-" + srbDate(periodOd) + "-" + srbDate(periodDo) + ".xls";

        // Delete the old pdf file if it already exists
        var oldFileId = recordIORReport.getValue("custrecord_rsm_ior_report_xls_file");
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

        recordIORReport.setValue({
            fieldId: 'custrecord_rsm_ior_report_xls_file',
            value: xlsFileId
        });

        recordIORReport.save();
    }

    function exportXml(recordId) {

        var recordIORReport = record.load({
            type: 'customrecord_rsm_ior_report',
            id: recordId,
            isDynamic: true
        });

        var periodOd = format.format({
            value: recordIORReport.getValue("custrecord_rsm_ior_report_period_od"),
            type: format.Type.DATE
        });
        var periodDo = format.format({
            value: recordIORReport.getValue("custrecord_rsm_ior_report_period_do"),
            type: format.Type.DATE
        });

        processDataForExportsOnly(recordIORReport);

        var xmlString = createXMLString();
        var fileName = "Izvestaj o ostalom rezultatu-" + srbDate(periodOd) + "-" + srbDate(periodDo) + ".xml";
        // Delete the old xml file if it already exists
        var oldFileId = recordIORReport.getValue("custrecord_rsm_ior_report_xml_file");
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

        recordIORReport.setValue({
            fieldId: 'custrecord_rsm_ior_report_xml_file',
            value: newXmlFileId
        });

        recordIORReport.save();
    }

    function deletePdf(recordId) {
        var recordIORReport = record.load({
            type: 'customrecord_rsm_ior_report',
            id: recordId,
            isDynamic: true
        });

        var oldFileId = recordIORReport.getValue("custrecord_rsm_ior_report_pdf_file");
        if (oldFileId) {
            file.delete({
                id: oldFileId
            });
            log.audit('Success', 'Old pdf file deleted!');
        };
    }

    function deleteXls(recordId) {
        var recordBSReport = record.load({
            type: 'customrecord_rsm_ior_report',
            id: recordId,
            isDynamic: true
        });

        var oldFileId = recordBSReport.getValue("custrecord_rsm_ior_report_xls_file");
        if (oldFileId) {
            file.delete({
                id: oldFileId
            });
            log.audit('Success', 'Old xls file deleted!');
        }
    }

    function deleteXml(recordId) {
        var recordIORReport = record.load({
            type: 'customrecord_rsm_ior_report',
            id: recordId,
            isDynamic: true
        });

        var oldFileId = recordIORReport.getValue("custrecord_rsm_ior_report_xml_file");
        if (oldFileId) {
            file.delete({
                id: oldFileId
            });
            log.audit('Success', 'Old xml file deleted!');
        };
    }

    function transactionsSS(firstDate, lastDate, subsidiaryId) {

        var aopSearch = search.create({
            type: "transaction",
            filters: [
                ["posting", "is", "T"],
                "AND",
                ["subsidiary", "anyof", subsidiaryId],
                "AND",
                ["accountingperiod.startdate", search.Operator.ONORBEFORE, lastDate],
                "AND",
                ["accountingperiod.startdate", search.Operator.ONORAFTER, firstDate],
                "AND",
                [
                    ["account.custrecord_rsm_aop_ior_code", "noneof", "@NONE@"],
                    "OR",
                    ["account.custrecord_rsm_aop_ior_code_2", "noneof", "@NONE@"]
                ]
            ],
            columns: [
                search.createColumn({
                    name: "custrecord_rsm_aop_ior_code",
                    join: "account",
                    summary: "GROUP",
                    sort: search.Sort.ASC,
                    label: "AOP"
                }),
                search.createColumn({
                    name: "custrecord_rsm_aop_ior_code_2",
                    join: "account",
                    summary: "GROUP",
                    sort: search.Sort.ASC,
                    label: "AOP2"
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

        // log.debug('transactionsSS results', results);
        util.each(results, function (result) {

            var allValues = result.getAllValues();

            function populateAop(aopIorCode) {

                var aopCodeValue = allValues[aopIorCode][0]['value'];
                var aopCodeText = allValues[aopIorCode][0]['text'];
                var debitAmount = (allValues['SUM(debitamount)']) ? parseFloat(allValues['SUM(debitamount)']) : 0;
                var creditAmount = (allValues['SUM(creditamount)']) ? parseFloat(allValues['SUM(creditamount)']) : 0;
                var balance_between_periods = Math.abs(debitAmount - creditAmount);

                debitAmount = debitAmount / 1000;
                creditAmount = creditAmount / 1000;
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
                // log.debug('transactionsSS obj[aopCodeText]', obj[aopCodeText]);
            }

            if (allValues['GROUP(account.custrecord_rsm_aop_ior_code)'][0]['value'] != 0) {
                populateAop("GROUP(account.custrecord_rsm_aop_ior_code)");
            }
            if (allValues['GROUP(account.custrecord_rsm_aop_ior_code_2)'][0]['value'] != 0) {
                populateAop("GROUP(account.custrecord_rsm_aop_ior_code_2)");
            }

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

    // Function to round values in the scheme
    function roundValues() {
        for (var key in iorScheme) {
            iorScheme[key]["current_year"] = Math.round(iorScheme[key]["current_year"]);
            iorScheme[key]["credit_current_year"] = Math.round(iorScheme[key]["credit_current_year"]);
            iorScheme[key]["debit_current_year"] = Math.round(iorScheme[key]["debit_current_year"]);
            iorScheme[key]["last_year"] = Math.round(iorScheme[key]["last_year"]);
            iorScheme[key]["credit_last_year"] = Math.round(iorScheme[key]["credit_last_year"]);
            iorScheme[key]["debit_last_year"] = Math.round(iorScheme[key]["debit_last_year"]);
        }
    }

    // Calculate balances of fields containing accounts
    function setBalancesAccounts(obj1, obj2) {
        for (var aopCodeObj1 in obj1) {
            var fixedAop = '_' + aopCodeObj1;
            iorScheme[fixedAop]["current_year"] = obj1[aopCodeObj1]["balance_between_periods"];
            iorScheme[fixedAop]["credit_current_year"] = obj1[aopCodeObj1]["credit_amount"];
            iorScheme[fixedAop]["debit_current_year"] = obj1[aopCodeObj1]["debit_amount"];
        }

        for (var aopCodeObj2 in obj2) {
            var fixedAop = '_' + aopCodeObj2;
            iorScheme[fixedAop]["last_year"] = obj2[aopCodeObj2]["balance_between_periods"];
            iorScheme[fixedAop]["credit_last_year"] = obj2[aopCodeObj2]["credit_amount"];
            iorScheme[fixedAop]["debit_last_year"] = obj2[aopCodeObj2]["debit_amount"];
        }
    }

    // Special logic for two AOPs that need to be extracted from an external BU report
    function getAopsFromBU(currentIorRecord) {
        var tempData = {};
        var buReportId = currentIorRecord.getValue('custrecord_rsm_ior_report_bu_data');

        if (!buReportId) {
            var BUReportQuery = query.runSuiteQL({
                query: "SELECT id FROM customrecord_rsm_bu_report WHERE custrecord_rsm_bu_report_subsidiary = ? AND custrecord_rsm_bu_report_period_od = ? AND custrecord_rsm_bu_report_period_do = ?",
                params: [subsidiaryId, periodOd, periodDo]
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
                    query: "SELECT custrecord_rsm_bul_aop_code, custrecord_rsm_bul_cy_calculated, custrecord_rsm_bul_py_calculated FROM customrecord_rsm_bu_report_lines WHERE custrecord_rsm_bu_report_parent = ? AND custrecord_rsm_bul_aop_code IN (" + aopId1 + ", " + aopId2 + ")",
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
                tempData[aop2].calculatedValue = currentYearValue2;
                tempData[aop2].previousYearValue = previousYearValue2;
                log.debug('AOPI IZ BU', JSON.stringify(tempData));

                return tempData;
            } else {
                messageToSend = {
                    "message": "Ne postoji izgenerisan Bilans Uspeha za izabrani Subsidiary i datum OD i DO sa trenutnog IOR Report-a!"
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
                query: "SELECT custrecord_rsm_bul_aop_code, custrecord_rsm_bul_cy_calculated, custrecord_rsm_bul_py_calculated FROM customrecord_rsm_bu_report_lines WHERE custrecord_rsm_bu_report_parent = ? AND custrecord_rsm_bul_aop_code IN (" + aopId1 + ", " + aopId2 + ")",
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
            tempData[aop2].calculatedValue = currentYearValue2;
            tempData[aop2].previousYearValue = previousYearValue2;

            log.debug('AOPI IZ BU', JSON.stringify(tempData));
            return tempData;
        }
    }

    // Calculate balances of fields containing aops
    function setBalancesAops() {
        for (var key in iorScheme) {
            var extractionAlreadyComplete = false;

            // Special logic for a given AOP codes
            if (key === "_2027") { // (2028 + 2029) = AOP 2025 ≥ 0 ili AOP 2026 > 0

                if (((iorScheme['_2028']['current_year'] + iorScheme['_2029']['current_year']) === iorScheme['_2025']['current_year']) >= 0) {
                    iorScheme[key]['current_year'] = iorScheme['_2025']['current_year'];
                } else if (iorScheme['_2026']['current_year'] > 0) {
                    iorScheme[key]['current_year'] = iorScheme['_2026']['current_year'];
                }

                if (((iorScheme['_2028']['last_year'] + iorScheme['_2029']['last_year']) === iorScheme['_2025']['last_year']) >= 0) {
                    iorScheme[key]['last_year'] = iorScheme['_2025']['last_year'];
                } else if (iorScheme['_2026']['last_year'] > 0) {
                    iorScheme[key]['last_year'] = iorScheme['_2026']['last_year'];
                }

                // Special logic for two AOPs that need to be extracted from an external BU report
            } else if ((key === "_2001" || key === "_2002") && extractionAlreadyComplete === false) {

                var dataFromBu = getAopsFromBU(iorRecord);
                for (var key in dataFromBu) {
                    if (dataFromBu[key].aopName === '1055') {
                        iorScheme['_2001']["current_year"] = dataFromBu[key].calculatedValue;
                        iorScheme['_2001']["last_year"] = dataFromBu[key].previousYearValue;
                    }
                    if (dataFromBu[key].aopName === '1056') {
                        iorScheme['_2002']["current_year"] = dataFromBu[key].calculatedValue;
                        iorScheme['_2002']["last_year"] = dataFromBu[key].previousYearValue;
                    }
                }

                extractionAlreadyComplete = true;

            } else if (iorScheme[key].hasOwnProperty("aops")) {

                var sum = 0, sum2 = 0;
                var aops = iorScheme[key]["aops"];
                for (var i = 0; i < aops.length; i++) {
                    try {

                        var result = aops[i].split(/\s/);
                        var sign = result[0], aop = result[1];

                        var currentYearFieldValue;
                        var previousYearFieldValue;
                        if (iorScheme["_" + aop]["fieldToUse"] === "credit") {
                            currentYearFieldValue = 'credit_current_year';
                            previousYearFieldValue = 'credit_last_year';
                        } else if (iorScheme["_" + aop]["fieldToUse"] === "debit") {
                            currentYearFieldValue = 'debit_current_year';
                            previousYearFieldValue = 'debit_last_year';
                        } else {
                            currentYearFieldValue = 'current_year';
                            previousYearFieldValue = 'last_year';
                        }

                        if (sign === "+") {
                            sum += iorScheme["_" + aop][currentYearFieldValue];
                            sum2 += iorScheme["_" + aop][previousYearFieldValue];
                        } else {
                            sum -= iorScheme["_" + aop][currentYearFieldValue];
                            sum2 -= iorScheme["_" + aop][previousYearFieldValue];
                        }

                    } catch (e) {
                        log.debug('setBalancesAops', "_" + aop + ' is required for ' + key + ' calculation but is missing from schema');
                    }
                }
                iorScheme[key]['current_year'] = (sum > 0) ? sum : 0;
                iorScheme[key]['last_year'] = (sum2 > 0) ? sum2 : 0;

            }
        }

        iorScheme = fixConditionalAops(iorScheme);
    }

    function processDataForExportsOnly(record) {

        loadScheme();

        var NUMBER_OF_LINES_IN_IOR_REPORT = record.getLineCount({
            sublistId: 'recmachcustrecord_rsm_iorl_report_parent'
        });

        for (var i = 0; i < NUMBER_OF_LINES_IN_IOR_REPORT; i++) {

            var aopCodeAtCurrentLine = record.getSublistText({
                sublistId: 'recmachcustrecord_rsm_iorl_report_parent',
                fieldId: 'custrecord_rsm_iorl_aop_code',
                line: i
            });
            var xmlValueAtCurrentLine = record.getSublistValue({
                sublistId: 'recmachcustrecord_rsm_iorl_report_parent',
                fieldId: 'custrecord_rsm_iorl_cy_xml',
                line: i
            });
            var prevYearValueAtCurrentLine = record.getSublistValue({
                sublistId: 'recmachcustrecord_rsm_iorl_report_parent',
                fieldId: 'custrecord_rsm_iorl_py_calculated',
                line: i
            });

            key = '_' + aopCodeAtCurrentLine;

            if (iorScheme[key]["fieldToUse"] === "credit") {

                iorScheme[key]["credit_current_year"] = xmlValueAtCurrentLine;
                iorScheme[key]["credit_last_year"] = prevYearValueAtCurrentLine;

            } else if (iorScheme[key]["fieldToUse"] === "debit") {

                iorScheme[key]["debit_current_year"] = xmlValueAtCurrentLine;
                iorScheme[key]["debit_last_year"] = prevYearValueAtCurrentLine;

            } else {
                iorScheme[key]["current_year"] = xmlValueAtCurrentLine;
                iorScheme[key]["last_year"] = prevYearValueAtCurrentLine;
            }

        }
    }

    function processData(periodOd, periodDo, iorRecord) {

        loadScheme();

        subsidiaryId = iorRecord.getValue({
            fieldId: 'custrecord_rsm_ior_report_subsidiary'
        });

        periodOdLastYear = '01.01.' + (dUtil.getYear(periodOd) - 1);
        periodDoLastYear = '31.12.' + (dUtil.getYear(periodOd) - 1);

        var transactionsTekucaGodina = transactionsSS(periodOd, periodDo, subsidiaryId);
        var transactionsPrethodnaGodina = transactionsSS(periodOdLastYear, periodDoLastYear, subsidiaryId);

        setBalancesAccounts(transactionsTekucaGodina, transactionsPrethodnaGodina);

        roundValues();

        // Some summarized AOPs are required for others, so the summarizing function is executed twice because of it
        setBalancesAops();
        setBalancesAops();

        // function logger(str) {
        //     str.match(/.{1,3000}/g).forEach(function (smallString, idx) {
        //         log.debug('Part ' + idx, smallString);
        //     });
        // }
        // logger(JSON.stringify(iorScheme));

        var NUMBER_OF_LINES_IN_IOR_REPORT = iorRecord.getLineCount({
            sublistId: 'recmachcustrecord_rsm_iorl_report_parent'
        });

        for (var i = 0; i < NUMBER_OF_LINES_IN_IOR_REPORT; i++) {

            var aopTextAtCurrentLine = iorRecord.getSublistText({
                sublistId: 'recmachcustrecord_rsm_iorl_report_parent',
                fieldId: 'custrecord_rsm_iorl_aop_code',
                line: i
            });

            var currentSublistLine = iorRecord.selectLine({
                sublistId: 'recmachcustrecord_rsm_iorl_report_parent',
                line: i
            });

            var currentYearFieldValue;
            var previousYearFieldValue;
            if (iorScheme["_" + aopTextAtCurrentLine]["fieldToUse"] === "credit") {
                currentYearFieldValue = iorScheme["_" + aopTextAtCurrentLine]["credit_current_year"];
                previousYearFieldValue = iorScheme["_" + aopTextAtCurrentLine]["credit_last_year"];
            } else if (iorScheme["_" + aopTextAtCurrentLine]["fieldToUse"] === "debit") {
                currentYearFieldValue = iorScheme["_" + aopTextAtCurrentLine]["debit_current_year"];
                previousYearFieldValue = iorScheme["_" + aopTextAtCurrentLine]["debit_last_year"];
            } else {
                currentYearFieldValue = iorScheme["_" + aopTextAtCurrentLine]["current_year"];
                previousYearFieldValue = iorScheme["_" + aopTextAtCurrentLine]["last_year"];
            }

            iorRecord.setCurrentSublistValue({
                sublistId: 'recmachcustrecord_rsm_iorl_report_parent',
                fieldId: 'custrecord_rsm_iorl_cy_calculated',
                value: currentYearFieldValue
            });

            iorRecord.setCurrentSublistValue({
                sublistId: 'recmachcustrecord_rsm_iorl_report_parent',
                fieldId: 'custrecord_rsm_iorl_cy_xml',
                value: currentYearFieldValue
            });

            iorRecord.setCurrentSublistValue({
                sublistId: 'recmachcustrecord_rsm_iorl_report_parent',
                fieldId: 'custrecord_rsm_iorl_py_calculated',
                value: previousYearFieldValue
            });

            iorRecord.commitLine({
                sublistId: 'recmachcustrecord_rsm_iorl_report_parent'
            });

        }

        iorRecord.save();
    }

    function recalculateHelperFunction(iorRecord) {

        loadScheme();

        var NUMBER_OF_LINES_IN_IOR_REPORT = iorRecord.getLineCount({
            sublistId: 'recmachcustrecord_rsm_iorl_report_parent'
        });

        for (var i = 0; i < NUMBER_OF_LINES_IN_IOR_REPORT; i++) {

            var aopCodeAtCurrentLine = iorRecord.getSublistText({
                sublistId: 'recmachcustrecord_rsm_iorl_report_parent',
                fieldId: 'custrecord_rsm_iorl_aop_code',
                line: i
            });
            var xmlValueAtCurrentLine = iorRecord.getSublistValue({
                sublistId: 'recmachcustrecord_rsm_iorl_report_parent',
                fieldId: 'custrecord_rsm_iorl_cy_xml',
                line: i
            });

            var currentYearKeyName;
            if (iorScheme["_" + aopCodeAtCurrentLine]["fieldToUse"] === "credit") {
                currentYearKeyName = "credit_current_year";
            } else if (iorScheme["_" + aopCodeAtCurrentLine]["fieldToUse"] === "debit") {
                currentYearKeyName = "debit_current_year";
            } else {
                currentYearKeyName = "current_year";
            }

            iorScheme["_" + aopCodeAtCurrentLine][currentYearKeyName] = xmlValueAtCurrentLine;

        }

        // Some summarized AOPs are required for others, so the summarizing function is executed twice because of it
        setBalancesAops();
        setBalancesAops();

        for (var i = 0; i < NUMBER_OF_LINES_IN_IOR_REPORT; i++) {

            var aopCodeAtCurrentLine = iorRecord.getSublistText({
                sublistId: 'recmachcustrecord_rsm_iorl_report_parent',
                fieldId: 'custrecord_rsm_iorl_aop_code',
                line: i
            });
            var currentSublistLine = iorRecord.selectLine({
                sublistId: 'recmachcustrecord_rsm_iorl_report_parent',
                line: i
            });

            var currentYearKeyName;
            if (iorScheme["_" + aopCodeAtCurrentLine]["fieldToUse"] === "credit") {
                currentYearKeyName = "credit_current_year";
            } else if (iorScheme["_" + aopCodeAtCurrentLine]["fieldToUse"] === "debit") {
                currentYearKeyName = "debit_current_year";
            } else {
                currentYearKeyName = "current_year";
            }
            iorRecord.setCurrentSublistValue({
                sublistId: 'recmachcustrecord_rsm_iorl_report_parent',
                fieldId: 'custrecord_rsm_iorl_cy_xml',
                value: iorScheme["_" + aopCodeAtCurrentLine][currentYearKeyName]
            });

            iorRecord.commitLine({
                sublistId: 'recmachcustrecord_rsm_iorl_report_parent'
            });

        }

        iorRecord.save();
    }

    function loadScheme() {
        var file1 = file.load({
            id: "./iorScheme.json"
        });
        iorScheme = JSON.parse(file1.getContents());
    }

    /// Create xml string with fields and values from iorScheme
    function createXMLString() {
        var xmlStr =
            "<Forma>" +
            "<Naziv>Izvestaj o ostalom rezultatu</Naziv>" +
            "<Atributi>" +
            "<Naziv>Izvestaj o ostalom rezultatu</Naziv>" +
            "<NumerickaPoljaForme xmlns:a='http://schemas.datacontract.org/2004/07/AppDef'>";

        var numerickaPoljaForme = "",
            tekstualnaPoljaForme = "";

        for (var key in iorScheme) {

            var numerickoPolje = "<a:NumerickoPolje>";
            numerickoPolje += "<a:Naziv>aop-" + key.substr(1) + "-5</a:Naziv>";
            numerickoPolje += "<a:Vrednosti>" + (iorScheme[key]["current_year"]).toString() + "</a:Vrednosti>";
            numerickoPolje += "</a:NumerickoPolje>";

            numerickaPoljaForme += numerickoPolje;

            numerickoPolje = "<a:NumerickoPolje>";
            numerickoPolje += "<a:Naziv>aop-" + key.substr(1) + "-6</a:Naziv>";
            numerickoPolje += "<a:Vrednosti>" + (iorScheme[key]["last_year"]).toString() + "</a:Vrednosti>";
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

    function post(requestBody) {

        var recordIdIORReport = requestBody.idIORReport;
        var action = requestBody.action;
        var retVal = {
            "result": "Error"
        };

        if (action == "init_lines") {
            initialize_lines(recordIdIORReport);
            retVal = {
                "result": 'ok'
            }
        }
        if (action == "calc_lines") {
            calculate_lines(recordIdIORReport);
            retVal = {
                "result": 'ok',
                "badAops": badlyCalculatedAops,
                "messageToSend": messageToSend
            }
        }
        if (action == "xml_file") {
            exportXml(recordIdIORReport);
            retVal = {
                "result": 'ok'
            }
        }
        if (action == "pdf_file") {
            exportPdf(recordIdIORReport);
            retVal = {
                "result": 'ok'
            }
        }
        if (action == "xls_file") {
            exportXls(recordIdIORReport);
            retVal = {
                "result": 'ok'
            }
        }
        if (action == "recalculate_lines") {
            recalculate_lines(recordIdIORReport);
            retVal = {
                "result": 'ok'
            }
        }
        if (action == "delete_pdf") {
            deletePdf(recordIdIORReport);
            retVal = {
                "result": 'ok'
            }
        }
        if (action == "delete_xml") {
            deleteXml(recordIdIORReport);
            retVal = {
                "result": 'ok'
            }
        }
        if (action == "delete_xls") {
            deleteXls(recordIdIORReport);
            retVal = {
                "result": 'ok'
            }
        }
        if (action == "delete_lines") {
            deleteOldLines(recordIdIORReport);
            retVal = {
                "result": 'ok'
            }
        }

        return retVal;
    }

    return {
        post: post
    };

});