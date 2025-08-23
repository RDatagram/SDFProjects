/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 */
define(
    ['N/record', 'N/search', 'N/file', 'N/format', 'N/query', 'N/log', '../dateUtil', 'N/render'],
    function (record, search, file, format, query, log, dateUtil, render) {

        var dUtil = dateUtil.dateUtil;
        var bsScheme = {};

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
            recalculateHelperFunction(recordBSReport);
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

            var datum2 = '31.12.' + (dUtil.getYear(naDatum) - 1);
            var datum3 = '01.01.' + (dUtil.getYear(naDatum) - 1);

            var renderer = render.create();

            var jsonObj = {
                datum: srbDate(naDatum),
                datumKrajnji: srbDate(datum2),
                datumPocetni: srbDate(datum3),
                maticniBroj: maticniBroj,
                sifraDelatnosti: sifraDelatnosti,
                pib: pib,
                bsScheme: bsScheme
            };

            renderer.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias: "JSON",
                data: jsonObj
            });

            renderer.setTemplateByScriptId("CUSTTMPL_BALANCE_SHEET_PDF_HTML");
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
            };
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
            };
        }

        // HELPER FUNCTIONS
        // GET ALL NEEDED TRANSACTIONS
        function transactionSS(lastDate) {

            var aopSearch = search.create({
                type: "transaction",
                filters: [
                    ["posting", "is", "T"],
                    "AND",
                    ["account.custrecord_rsm_aop_bs_code","noneof","@NONE@"],
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
            });

            var obj = {};
            aopSearch.run().each(function (result) {
                var allValues = result.getAllValues();
                var aopCodeValue = allValues['GROUP(account.custrecord_rsm_aop_bs_code)'][0]['value'];
                var aopCodeText = allValues['GROUP(account.custrecord_rsm_aop_bs_code)'][0]['text'];
                var debitAmount = (allValues['SUM(debitamount)']) ? parseFloat(allValues['SUM(debitamount)']) : 0;
                var creditAmount = (allValues['SUM(creditamount)']) ? parseFloat(allValues['SUM(creditamount)']) : 0;
                var balance_as_of_date = Math.abs(debitAmount - creditAmount);
                log.debug("Aop text:", aopCodeText);
                balance_as_of_date = balance_as_of_date / 1000;
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
        function setBalancesAops() {
            for (var key in bsScheme) {
                if (bsScheme[key].hasOwnProperty("aops")) {
                    var sum = 0, sum2 = 0, sum3 = 0;
                    var aops = bsScheme[key]["aops"];
                    for (var i = 0; i < aops.length; i++) {
                        var result = aops[i].split(/\s/);
                        var sign = result[0], aop = result[1];
                        if (sign === "+") {
                            sum += bsScheme["_" + aop]["balance1"];
                            sum2 += bsScheme["_" + aop]["balance2"];
                            sum3 += bsScheme["_" + aop]["balance3"];
                        } else {
                            sum -= bsScheme["_" + aop]["balance1"];
                            sum2 -= bsScheme["_" + aop]["balance2"];
                            sum3 -= bsScheme["_" + aop]["balance3"];
                        }

                    }
                    bsScheme[key]["balance1"] = sum;
                    bsScheme[key]["balance2"] = sum2;
                    bsScheme[key]["balance3"] = sum3;
                }
            }
        }

        function processDataForExportsOnly(record) {
            loadScheme();

            var NUMBER_OF_LINES_IN_BS_REPORT = record.getLineCount({
                sublistId: 'recmachcustrecord_rsm_bs_report_parent'
            });

            for (var i = 0; i < NUMBER_OF_LINES_IN_BS_REPORT; i++) {

                var aopCodeAtCurrentLine = record.getSublistText({
                    sublistId: 'recmachcustrecord_rsm_bs_report_parent',
                    fieldId: 'custrecord_rsm_bsl_aop_code',
                    line: i
                });

                var calculatedValueAtCurrentLine = record.getSublistValue({
                    sublistId: 'recmachcustrecord_rsm_bs_report_parent',
                    fieldId: 'custrecord_rsm_bsl_cy_calculated',
                    line: i
                });

                var xmlValueAtCurrentLine = record.getSublistValue({
                    sublistId: 'recmachcustrecord_rsm_bs_report_parent',
                    fieldId: 'custrecord_rsm_bsl_cy_xml',
                    line: i
                });

                var prevYearEndValueAtCurrentLine = record.getSublistValue({
                    sublistId: 'recmachcustrecord_rsm_bs_report_parent',
                    fieldId: 'custrecord_rsm_bsl_py_end',
                    line: i
                });

                var prevYearStartValueAtCurrentLine = record.getSublistValue({
                    sublistId: 'recmachcustrecord_rsm_bs_report_parent',
                    fieldId: 'custrecord_rsm_bsl_py_start',
                    line: i
                });

                key = '_' + aopCodeAtCurrentLine;
                bsScheme[key]["balance1"] = xmlValueAtCurrentLine;
                bsScheme[key]["balance2"] = prevYearEndValueAtCurrentLine;
                bsScheme[key]["balance3"] = prevYearStartValueAtCurrentLine;
            }
        }

        function processData(naDatum, record) {
            loadScheme();
            // Setting all values in JSON Scheme to 0
            for (var key in bsScheme) {
                bsScheme[key]["balance1"] = 0;
                bsScheme[key]["balance2"] = 0;
                bsScheme[key]["balance3"] = 0;
            }

            var naDatum1YearAgo = '31.12.' + (dUtil.getYear(naDatum) - 1);
            var naDatum2YearsAgo = '01.01.' + (dUtil.getYear(naDatum) - 1);

            naDatum = format.format({
                value: naDatum,
                type: format.Type.DATE
            });
            naDatum1YearAgo = format.format({
                value: naDatum1YearAgo,
                type: format.Type.DATE
            });
            naDatum2YearsAgo = format.format({
                value: naDatum2YearsAgo,
                type: format.Type.DATE
            });

            var transactionsPrethodnaKrajne, transactionsPrethodnaPocetno, transactionsTekucaGodina;
            transactionsPrethodnaPocetno = transactionSS(naDatum2YearsAgo);
            transactionsPrethodnaKrajne = transactionSS(naDatum1YearAgo);
            transactionsTekucaGodina = transactionSS(naDatum);

            setBalancesAccounts(transactionsTekucaGodina, transactionsPrethodnaKrajne, transactionsPrethodnaPocetno);
            roundValues();

            setBalancesAops();
            setBalancesAops();

            var NUMBER_OF_LINES_IN_BS_REPORT = record.getLineCount({
                sublistId: 'recmachcustrecord_rsm_bs_report_parent'
            });

            for (var i = 0; i < NUMBER_OF_LINES_IN_BS_REPORT; i++) {

                var aopCodeAtCurrentLine = record.getSublistText({
                    sublistId: 'recmachcustrecord_rsm_bs_report_parent',
                    fieldId: 'custrecord_rsm_bsl_aop_code',
                    line: i
                });
                
                var currentSublistLine = record.selectLine({
                    sublistId: 'recmachcustrecord_rsm_bs_report_parent',
                    line: i
                });

                record.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsm_bs_report_parent',
                    fieldId: 'custrecord_rsm_bsl_cy_calculated',
                    value: bsScheme["_" + aopCodeAtCurrentLine]["balance1"]
                });

                record.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsm_bs_report_parent',
                    fieldId: 'custrecord_rsm_bsl_cy_xml',
                    value: bsScheme["_" + aopCodeAtCurrentLine]["balance1"]
                });

                record.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsm_bs_report_parent',
                    fieldId: 'custrecord_rsm_bsl_py_end',
                    value: bsScheme["_" + aopCodeAtCurrentLine]["balance2"]
                });

                record.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsm_bs_report_parent',
                    fieldId: 'custrecord_rsm_bsl_py_start',
                    value: bsScheme["_" + aopCodeAtCurrentLine]["balance3"]
                });

                record.commitLine({
                    sublistId: 'recmachcustrecord_rsm_bs_report_parent'
                });
            }

            record.save();
        }

        function recalculateHelperFunction(record) {
            loadScheme();

            var NUMBER_OF_LINES_IN_BS_REPORT = record.getLineCount({
                sublistId: 'recmachcustrecord_rsm_bs_report_parent'
            });

            for (var i = 0; i < NUMBER_OF_LINES_IN_BS_REPORT; i++) {

                var aopCodeAtCurrentLine = record.getSublistText({
                    sublistId: 'recmachcustrecord_rsm_bs_report_parent',
                    fieldId: 'custrecord_rsm_bsl_aop_code',
                    line: i
                });

                var xmlValueAtCurrentLine = record.getSublistValue({
                    sublistId: 'recmachcustrecord_rsm_bs_report_parent',
                    fieldId: 'custrecord_rsm_bsl_cy_xml',
                    line: i
                });

                key = '_' + aopCodeAtCurrentLine;
                bsScheme[key]["balance1"] = xmlValueAtCurrentLine;
                bsScheme[key]["balance2"] = 0;
                bsScheme[key]["balance3"] = 0;
            }
            setBalancesAops();
            setBalancesAops();

            for (var i = 0; i < NUMBER_OF_LINES_IN_BS_REPORT; i++) {

                var aopCodeAtCurrentLine = record.getSublistText({
                    sublistId: 'recmachcustrecord_rsm_bs_report_parent',
                    fieldId: 'custrecord_rsm_bsl_aop_code',
                    line: i
                });

                var currentSublistLine = record.selectLine({
                    sublistId: 'recmachcustrecord_rsm_bs_report_parent',
                    line: i
                });

                record.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsm_bs_report_parent',
                    fieldId: 'custrecord_rsm_bsl_cy_xml',
                    value: bsScheme["_" + aopCodeAtCurrentLine]["balance1"]
                });

                record.commitLine({
                    sublistId: 'recmachcustrecord_rsm_bs_report_parent'
                });
            }
            record.save();
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
                "<Forma>" +
                "<Naziv>Bilans stanja</Naziv>" +
                "<Atributi>" +
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

            xmlStr += "</Atributi></Forma>";

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
                retVal = {
                    "result": 'ok'
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
            return retVal;
        }

        return {
            post: doPost
        };

    });