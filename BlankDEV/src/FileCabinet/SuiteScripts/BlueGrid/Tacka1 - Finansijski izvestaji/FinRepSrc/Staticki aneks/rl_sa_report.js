/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 */
define(['N/record', 'N/search', 'N/file', 'N/format', 'N/query', 'N/log', '../dateUtil', 'N/render', 'N/encode', 'N/util'], function (record, search, file, format, query, log, dateUtil, render, encode, util) {

    var dUtil = dateUtil.dateUtil;
    var saScheme = {};
    var saRecord;
    var subsidiaryId = 0;
    var periodOd, periodDo;
    var periodOdLastYear, periodDoLastYear;
    var messageToSend = "";

    var positiveAops = [];
    var negativeAops = [];
    var badlyCalculatedAops = [];
    var tabela2TipAopa1 = [];
    var table2Keys = ['_9008', '_9009', '_9010', '_9011', '_9012', '_9013', '_9014', '_9015', '_9016', '_9017',
        '_9018', '_9019', '_9020', '_9021', '_9022', '_9023', '_9024', '_9025', '_9026', '_9027', '_9028', '_9029',
        '_9030', '_9031', '_9032', '_9033', '_9034', '_9035', '_9036', '_9037'];
    var table13Keys = ['_9127', '_9128', '_9129', '_9130', '_9131', '_9132', '_9133', '_9134', '_9135', '_9136'];
    // Table 3, - Bilans stanja (debit - credit) bez 9048 i 9050
    var table3Aops = ['9038', '9039', '9040', '9041', '9042', '9043'];
    //Table 4 - Bilans stanja (credit - debit)
    var table4Aops = ['9045', '9046', '9047', '9049', '9051', '9052', '9053', '9054', '9055', '9056'];
    //Table 6 - Bilans uspeha (samo debit)
    var table6Aops = ['9063', '9064', '9065', '9066', '9067', '9068', '9069', '9070', '9072'];
    //Table 7 - Bilans uspeha (samo credit, a aop 9072 samo debit)
    var table7AopsCredit = ['9073', '9074', '9075', '9076', '9077'];
    // Table 8, 9, BU: debit - credit
    var buAopsDebitMinusCredit = ['9079', '9080', '9081', '9082', '9083', '9084', '9085', '9086', '9087',
        '9088', '9089', '9090', '9091', '9092', '9093', '9094', '9095', '9096', '9097', '9099', '9100', '9101', '9102', '9103', '9104'];

    // Table 10, 11, 12 bez 9125 BU: credit - debit
    var buAopsCreditMinusDebit = ['9106', '9107', '9108', '9109', '9110', '9111', '9113', '9114', '9115',
        '9116', '9117', '9119', '9120', '9121', '9122', '9123', '9124'];
    // Table 13 - Bilans stanja (debit - credit) sa specijalnim slucajevima
    var table13Aops = ['9127', '9128', '9130', '9131', '9132', '9134', '9135', '9136'];

    function calculateNeto() {
        for (var i = 0; i < table2Keys.length; i++) {
            saScheme[table2Keys[i]]["neto"] = saScheme[table2Keys[i]]["current_year"] - saScheme[table2Keys[i]]["last_year"]
        }
        for (var i = 0; i < table13Keys.length; i++) {
            saScheme[table13Keys[i]]["neto"] = saScheme[table13Keys[i]]["current_year"] - saScheme[table13Keys[i]]["last_year"]
        }
    }

    function getTable1Values(saScheme, saRecord) {
        saScheme['_9001']["current_year"] = saRecord.getValue({
            fieldId: 'custrecord_rsm_sa_br_mes_poslovanja_cy'
        });
        saScheme['_9002']["current_year"] = saRecord.getValue({
            fieldId: 'custrecord_rsm_sa_ozn_za_vlasnistvo_cy'
        });
        saScheme['_9003']["current_year"] = saRecord.getValue({
            fieldId: 'custrecord_rsm_sa_br_stranih_lica_cy'
        });
        saScheme['_9004']["current_year"] = saRecord.getValue({
            fieldId: 'custrecord_rsm_sa_br_stranih_lica_10_cy'
        });
        saScheme['_9005']["current_year"] = saRecord.getValue({
            fieldId: 'custrecord_rsm_sa_br_zaposlenih_cy'
        });
        saScheme['_9006']["current_year"] = saRecord.getValue({
            fieldId: 'custrecord_rsm_sa_br_zap_preko_ag_cy'
        });
        saScheme['_9007']["current_year"] = saRecord.getValue({
            fieldId: 'custrecord_rsm_sa_broj_volontera_cy'
        });

        saScheme['_9001']["last_year"] = saRecord.getValue({
            fieldId: 'custrecord_rsm_sa_br_mes_poslovanja_ly'
        });
        saScheme['_9002']["last_year"] = saRecord.getValue({
            fieldId: 'custrecord_rsm_sa_ozn_za_vlasnistvo_ly'
        });
        saScheme['_9003']["last_year"] = saRecord.getValue({
            fieldId: 'custrecord_rsm_sa_br_stranih_lica_ly'
        });
        saScheme['_9004']["last_year"] = saRecord.getValue({
            fieldId: 'custrecord_rsm_sa_br_stranih_lica_10_ly'
        });
        saScheme['_9005']["last_year"] = saRecord.getValue({
            fieldId: 'custrecord_rsm_sa_br_zaposlenih_ly'
        });
        saScheme['_9006']["last_year"] = saRecord.getValue({
            fieldId: 'custrecord_rsm_sa_br_zap_preko_ag_ly'
        });
        saScheme['_9007']["last_year"] = saRecord.getValue({
            fieldId: 'custrecord_rsm_sa_broj_volontera_ly'
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

    function fixConditionalAops(saScheme) {
        return saScheme;
    }

    function deleteOldLines(recordId) {
        var allLines = search.create({
            type: "customrecord_rsm_sa_report_lines",
            columns: ['custrecord_rsm_sal_report_parent'],
            filters: [
                ["custrecord_rsm_sal_report_parent", "is", recordId]
            ]
        }).run();
        allLines.each(function (line) {
            record.delete({
                type: 'customrecord_rsm_sa_report_lines',
                id: line.id,
            });
            return true
        });
    }

    // Reset of all the lines, deleting the ones that already exist - adding new lines with value 0
    function initialize_lines(recordId) {

        deleteOldLines(recordId);

        var recordSAReport = record.load({
            type: 'customrecord_rsm_sa_report',
            id: recordId,
            isDynamic: true
        });

        var aopCodesSavedSearch = search.create({
            type: 'customrecord_rsm_aop_sa_code',
            columns: ['name', 'custrecord_rsm_aop_sa_code_description']
        });

        aopCodesSavedSearch.run().each(function (aopCodeData) {

            recordSAReport.selectNewLine({
                sublistId: 'recmachcustrecord_rsm_sal_report_parent'
            });
            recordSAReport.setCurrentSublistValue({
                sublistId: 'recmachcustrecord_rsm_sal_report_parent',
                fieldId: 'custrecord_rsm_sal_aop_code',
                value: aopCodeData.id
            });
            recordSAReport.setCurrentSublistValue({
                sublistId: 'recmachcustrecord_rsm_sal_report_parent',
                fieldId: 'custrecord_rsm_sal_pozicija',
                value: aopCodeData.getValue('custrecord_rsm_aop_sa_code_description')
            });
            recordSAReport.setCurrentSublistValue({
                sublistId: 'recmachcustrecord_rsm_sal_report_parent',
                fieldId: 'custrecord_rsm_sal_tekuca',
                value: 0
            });
            recordSAReport.setCurrentSublistValue({
                sublistId: 'recmachcustrecord_rsm_sal_report_parent',
                fieldId: 'custrecord_rsm_sal_prethodna',
                value: 0
            });
            recordSAReport.setCurrentSublistValue({
                sublistId: 'recmachcustrecord_rsm_sal_report_parent',
                fieldId: 'custrecord_rsm_sal_bruto',
                value: 0
            });
            recordSAReport.setCurrentSublistValue({
                sublistId: 'recmachcustrecord_rsm_sal_report_parent',
                fieldId: 'custrecord_rsm_sal_ispravka_vrednosti',
                value: 0
            });
            recordSAReport.setCurrentSublistValue({
                sublistId: 'recmachcustrecord_rsm_sal_report_parent',
                fieldId: 'custrecord_rsm_sal_neto',
                value: 0
            });
            recordSAReport.commitLine({
                sublistId: 'recmachcustrecord_rsm_sal_report_parent'
            });
            return true;
        });

        recordSAReport.save();
    }

    function calculate_lines(recordId) {
        saRecord = record.load({
            type: 'customrecord_rsm_sa_report',
            id: recordId,
            isDynamic: true
        });

        periodOd = format.format({
            value: saRecord.getValue("custrecord_rsm_sa_report_period_od"),
            type: format.Type.DATE
        });
        periodDo = format.format({
            value: saRecord.getValue("custrecord_rsm_sa_report_period_do"),
            type: format.Type.DATE
        });

        processData(periodOd, periodDo, saRecord);
    }

    function recalculate_lines(recordId) {
        saRecord = record.load({
            type: 'customrecord_rsm_sa_report',
            id: recordId,
            isDynamic: true
        });
        recalculateHelperFunction(saRecord);
    }

    function exportPdf(recordId) {

        var recordSAReport = record.load({
            type: 'customrecord_rsm_sa_report',
            id: recordId,
            isDynamic: true
        });

        var periodOd = format.format({
            value: recordSAReport.getValue("custrecord_rsm_sa_report_period_od"),
            type: format.Type.DATE
        });
        var periodDo = format.format({
            value: recordSAReport.getValue("custrecord_rsm_sa_report_period_do"),
            type: format.Type.DATE
        });
        var maticniBroj = recordSAReport.getText('custrecord_rsm_sa_report_maticni_broj');
        var sifraDelatnosti = recordSAReport.getText('custrecord_rsm_sa_report_sifra_del');
        var pib = recordSAReport.getText('custrecord_rsm_sa_report_pib');

        processDataForExportsOnly(recordSAReport);

        var renderer = render.create();

        var addressAndName = getAddressAndName(recordSAReport.getValue('custrecord_rsm_sa_report_subsidiary'))

        var jsonObj = {
            datum_od: srbDate(periodOd),
            datum_do: srbDate(periodDo),
            maticniBroj: maticniBroj,
            sifraDelatnosti: sifraDelatnosti,
            pib: pib,
            naziv: addressAndName.name,
            sediste: addressAndName.address,
            saScheme: saScheme
        };

        renderer.addCustomDataSource({
            format: render.DataSource.OBJECT,
            alias: "JSON",
            data: jsonObj
        });

        renderer.setTemplateByScriptId("CUSTTMPL_SA_HTML_PDF_TEMPLATE");
        var pdfFile = renderer.renderAsPdf();
        pdfFile.name = "Izvestaj o ostalom rezultatu-" + srbDate(periodOd) + "-" + srbDate(periodDo) + ".pdf";

        // Delete the old pdf file if it already exists
        var oldFileId = recordSAReport.getValue("custrecord_rsm_sa_report_pdf_file");
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

        recordSAReport.setValue({
            fieldId: 'custrecord_rsm_sa_report_pdf_file',
            value: newPdfFileId
        });
        recordSAReport.save();
    }

    function exportXls(recordId) {

        var recordSAReport = record.load({
            type: 'customrecord_rsm_sa_report',
            id: recordId,
            isDynamic: true
        });

        var periodOd = format.format({
            value: recordSAReport.getValue("custrecord_rsm_sa_report_period_od"),
            type: format.Type.DATE
        });
        var periodDo = format.format({
            value: recordSAReport.getValue("custrecord_rsm_sa_report_period_do"),
            type: format.Type.DATE
        });
        var maticniBroj = recordSAReport.getText('custrecord_rsm_sa_report_maticni_broj');
        var sifraDelatnosti = recordSAReport.getText('custrecord_rsm_sa_report_sifra_del');
        var pib = recordSAReport.getText('custrecord_rsm_sa_report_pib');

        processDataForExportsOnly(recordSAReport);

        var jsonObj = {
            datum_od: srbDate(periodOd),
            datum_do: srbDate(periodDo),
            maticniBroj: maticniBroj,
            sifraDelatnosti: sifraDelatnosti,
            pib: pib,
            naziv: "",
            sediste: "",
            saScheme: saScheme
        };
        var xmlTemplate = file.load({ id: '../finansijski_templates/sa_excel_template.xml' });
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
        var oldFileId = recordSAReport.getValue("custrecord_rsm_sa_report_xls_file");
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

        recordSAReport.setValue({
            fieldId: 'custrecord_rsm_sa_report_xls_file',
            value: xlsFileId
        });

        recordSAReport.save();
    }

    function exportXml(recordId) {

        var recordSAReport = record.load({
            type: 'customrecord_rsm_sa_report',
            id: recordId,
            isDynamic: true
        });

        var periodOd = format.format({
            value: recordSAReport.getValue("custrecord_rsm_sa_report_period_od"),
            type: format.Type.DATE
        });
        var periodDo = format.format({
            value: recordSAReport.getValue("custrecord_rsm_sa_report_period_do"),
            type: format.Type.DATE
        });

        processDataForExportsOnly(recordSAReport);

        //var xmlString = createXMLString();
        var xmlTemplate = file.load({ id: '../finansijski_templates/sa_xml_template.xml' });
        var jsonObj = {
            saScheme: saScheme
        }

        var content = xmlTemplate.getContents();

        var renderer = render.create();
        renderer.templateContent = content;

        renderer.addCustomDataSource({
            format: render.DataSource.JSON,
            alias: "JSON",
            data: JSON.stringify(jsonObj)
        });

        var xmlString = renderer.renderAsString();

        var fileName = "Statisticki aneks-" + srbDate(periodOd) + "-" + srbDate(periodDo) + ".xml";
        // Delete the old xml file if it already exists
        var oldFileId = recordSAReport.getValue("custrecord_rsm_sa_report_xml_file");
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

        recordSAReport.setValue({
            fieldId: 'custrecord_rsm_sa_report_xml_file',
            value: newXmlFileId
        });

        recordSAReport.save();
    }

    function deletePdf(recordId) {
        var recordSAReport = record.load({
            type: 'customrecord_rsm_sa_report',
            id: recordId,
            isDynamic: true
        });

        var oldFileId = recordSAReport.getValue("custrecord_rsm_sa_report_pdf_file");
        if (oldFileId) {
            file.delete({
                id: oldFileId
            });
            log.audit('Success', 'Old pdf file deleted!');
        };
    }

    function deleteXls(recordId) {
        var recordBSReport = record.load({
            type: 'customrecord_rsm_sa_report',
            id: recordId,
            isDynamic: true
        });

        var oldFileId = recordBSReport.getValue("custrecord_rsm_sa_report_xls_file");
        if (oldFileId) {
            file.delete({
                id: oldFileId
            });
            log.audit('Success', 'Old xls file deleted!');
        }
    }

    function deleteXml(recordId) {
        var recordSAReport = record.load({
            type: 'customrecord_rsm_sa_report',
            id: recordId,
            isDynamic: true
        });

        var oldFileId = recordSAReport.getValue("custrecord_rsm_sa_report_xml_file");
        if (oldFileId) {
            file.delete({
                id: oldFileId
            });
            log.audit('Success', 'Old xml file deleted!');
        };
    }

    function transactionsSSBU(firstDate, lastDate, subsidiaryId) {

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
                ["account.custrecord_rsm_aop_sa_code", "noneof", "@NONE@"]
            ],
            columns: [
                search.createColumn({
                    name: "custrecord_rsm_aop_sa_code",
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

        // log.debug('transactionsSS results', results);
        util.each(results, function (result) {

            var allValues = result.getAllValues();

            var aopCodeValue = allValues["GROUP(account.custrecord_rsm_aop_sa_code)"][0]['value'];
            var aopCodeText = allValues["GROUP(account.custrecord_rsm_aop_sa_code)"][0]['text'];
            var debitAmount = (allValues['SUM(debitamount)']) ? parseFloat(allValues['SUM(debitamount)']) : 0;
            var creditAmount = (allValues['SUM(creditamount)']) ? parseFloat(allValues['SUM(creditamount)']) : 0;
            var debitMinusCredit = (debitAmount - creditAmount) / 1000;
            var creditMinusDebit = (creditAmount - debitAmount) / 1000;

            obj[aopCodeText] = {
                "aopCodeValue": aopCodeValue,
                "aopCodeText": aopCodeText,
                "credit_amount": (creditAmount) ? creditAmount / 1000 : 0,
                "debit_amount": (debitAmount) ? debitAmount / 1000 : 0,
                "credit_minus_debit": creditMinusDebit,
                "debit_minus_credit": debitMinusCredit
            };

            return true;
        });
        return obj;
    }

    function transactionsSSBS(lastDate, subsidiaryId) {

        var aopSearch = search.create({
            type: "transaction",
            filters: [
                ["posting", "is", "T"],
                "AND",
                ["account.custrecord_rsm_aop_sa_code", "noneof", "@NONE@"],
                "AND",
                ["subsidiary", "anyof", subsidiaryId],
                "AND",
                ["accountingperiod.startdate", search.Operator.ONORBEFORE, lastDate]
            ],
            columns: [
                search.createColumn({
                    name: "custrecord_rsm_aop_sa_code",
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
            var debitMinusCredit = (debitAmount - creditAmount) / 1000;
            var creditMinusDebit = (creditAmount - debitAmount) / 1000;

            obj[aopCodeText] = {
                "aopCodeValue": aopCodeValue,
                "aopCodeText": aopCodeText,
                "credit_amount": creditAmount / 1000,
                "debit_amount": debitAmount / 1000,
                "debit_minus_credit": debitMinusCredit,
                "credit_minus_debit": creditMinusDebit
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

    // Function to round values in the scheme
    function roundValues() {
        for (var key in saScheme) {
            saScheme[key]["current_year"] = Math.round(saScheme[key]["current_year"]);
            saScheme[key]["credit_current_year"] = Math.round(saScheme[key]["credit_current_year"]);
            saScheme[key]["debit_current_year"] = Math.round(saScheme[key]["debit_current_year"]);
            saScheme[key]["last_year"] = Math.round(saScheme[key]["last_year"]);
            saScheme[key]["credit_last_year"] = Math.round(saScheme[key]["credit_last_year"]);
            saScheme[key]["debit_last_year"] = Math.round(saScheme[key]["debit_last_year"]);
            saScheme[key]["neto"] = Math.round(saScheme[key]["neto"]);
        }
    }

    // Calculate balances of fields containing accounts
    // bs1 - bs current year, bs2 - bs last year, bu1 - bu1 current year, bu2 last year
    function setBalancesAccounts(bs1, bs2, bu1, bu2) {
        for (var aopCodeObj1 in bs1) {
            var fixedAop = '_' + aopCodeObj1;
            if (table3Aops.indexOf(aopCodeObj1) != -1) {
                saScheme[fixedAop]["current_year"] = bs1[aopCodeObj1]["debit_minus_credit"];
            }
            if (table4Aops.indexOf(aopCodeObj1) != -1) {
                saScheme[fixedAop]["current_year"] = bs1[aopCodeObj1]["credit_minus_debit"];
            }
            if (table13Aops.indexOf(aopCodeObj1) != -1) {
                saScheme[fixedAop]["current_year"] = bs1[aopCodeObj1]["debit_minus_credit"]
            }

        }

        for (var aopCodeObj2 in bs2) {
            var fixedAop = '_' + aopCodeObj2;
            if (table3Aops.indexOf(aopCodeObj2) != -1) {
                saScheme[fixedAop]["last_year"] = bs2[aopCodeObj2]["debit_minus_credit"];
            }
            if (table4Aops.indexOf(aopCodeObj2) != -1) {
                saScheme[fixedAop]["last_year"] = bs2[aopCodeObj2]["credit_minus_debit"];
            }
            if (table13Aops.indexOf(aopCodeObj2) != -1) {
                saScheme[fixedAop]["last_year"] = bs2[aopCodeObj2]["debit_minus_credit"]
            }
        }

        for (var aopCodeObj3 in bu1) {
            var fixedAop = '_' + aopCodeObj3;
            if (table6Aops.indexOf(aopCodeObj3) != -1) {
                saScheme[fixedAop]["current_year"] = bu1[aopCodeObj3]["debit_amount"];
            }
            if (table7AopsCredit.indexOf(aopCodeObj3) != -1) {
                saScheme[fixedAop]["current_year"] = bu1[aopCodeObj3]["credit_amount"];
            }
            if (buAopsDebitMinusCredit.indexOf(aopCodeObj3) != -1) {
                saScheme[fixedAop]["current_year"] = bu1[aopCodeObj3]["debit_minus_credit"];
            }
            if (buAopsCreditMinusDebit.indexOf(aopCodeObj3) != -1) {
                saScheme[fixedAop]["current_year"] = bu1[aopCodeObj3]["credit_minus_debit"];
            }
        }

        for (var aopCodeObj4 in bu2) {
            var fixedAop = '_' + aopCodeObj4;
            if(table6Aops.indexOf(aopCodeObj4) != -1) {
                saScheme[fixedAop]["last_year"] = bu2[aopCodeObj4]["debit_amount"];
            }
            if (table7AopsCredit.indexOf(aopCodeObj4) != -1) {
                saScheme[fixedAop]["last_year"] = bu2[aopCodeObj4]["credit_amount"];
            }
            if (buAopsDebitMinusCredit.indexOf(aopCodeObj4) != -1) {
                saScheme[fixedAop]["last_year"] = bu2[aopCodeObj4]["debit_minus_credit"];
            }
            if (buAopsCreditMinusDebit.indexOf(aopCodeObj4) != -1) {
                saScheme[fixedAop]["last_year"] = bu2[aopCodeObj4]["credit_minus_debit"];
            }
        }
    }

    // Special logic for two AOPs that need to be extracted from an external BU report
    function getAopsFromBU(currentsaRecord) {
        var tempData = {};
        var buReportId = currentsaRecord.getValue('custrecord_rsm_sa_report_bu_data');

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
                    "message": "Ne postoji izgenerisan Bilans Uspeha za izabrani Subsidiary i datum OD i DO sa trenutnog SA Report-a!"
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
        for (var key in saScheme) {
            if (saScheme[key].hasOwnProperty("aops")) {

                var sum = 0, sum2 = 0, sum3 = 0;
                var aops = saScheme[key]["aops"];
                for (var i = 0; i < aops.length; i++) {
                    try {

                        var result = aops[i].split(/\s/);
                        var sign = result[0], aop = result[1];

                        if (sign === "+") {
                            sum += saScheme["_" + aop]["current_year"];
                            sum2 += saScheme["_" + aop]["last_year"];
                            sum3 += saScheme["_" + aop]["neto"];
                        } else {
                            sum -= saScheme["_" + aop]["current_year"];
                            sum2 -= saScheme["_" + aop]["last_year"];
                            sum3 -= saScheme["_" + aop]["neto"];
                        }

                    } catch (e) {
                        log.debug('setBalancesAops', "_" + aop + ' is required for ' + key + ' calculation but is missing from schema');
                    }
                }
                saScheme[key]['current_year'] = (sum > 0) ? sum : 0;
                saScheme[key]['last_year'] = (sum2 > 0) ? sum2 : 0;
                saScheme[key]['neto'] = (sum3 > 0) ? sum3 : 0;
            }
        }

        saScheme = fixConditionalAops(saScheme);
    }

    function processDataForExportsOnly(record) {

        loadScheme();

        var NUMBER_OF_LINES_IN_sa_REPORT = record.getLineCount({
            sublistId: 'recmachcustrecord_rsm_sal_report_parent'
        });

        for (var i = 0; i < NUMBER_OF_LINES_IN_sa_REPORT; i++) {

            var aopCodeAtCurrentLine = record.getSublistText({
                sublistId: 'recmachcustrecord_rsm_sal_report_parent',
                fieldId: 'custrecord_rsm_sal_aop_code',
                line: i
            });
            var xmlValueAtCurrentLine = record.getSublistValue({
                sublistId: 'recmachcustrecord_rsm_sal_report_parent',
                fieldId: 'custrecord_rsm_sal_tekuca',
                line: i
            });
            var prevYearValueAtCurrentLine = record.getSublistValue({
                sublistId: 'recmachcustrecord_rsm_sal_report_parent',
                fieldId: 'custrecord_rsm_sal_prethodna',
                line: i
            });
            var netoValueAtCurrentLine = record.getSublistValue({
                sublistId: 'recmachcustrecord_rsm_sal_report_parent',
                fieldId: 'custrecord_rsm_sal_neto',
                line: i
            });

            var key = '_' + aopCodeAtCurrentLine;

            saScheme[key]["current_year"] = xmlValueAtCurrentLine;
            saScheme[key]["last_year"] = prevYearValueAtCurrentLine;
            saScheme[key]["neto"] = netoValueAtCurrentLine;

        }
    }

    function processData(periodOd, periodDo, saRecord) {

        loadScheme();

        subsidiaryId = saRecord.getValue({
            fieldId: 'custrecord_rsm_sa_report_subsidiary'
        });

        periodOdLastYear = '01.01.' + (dUtil.getYear(periodOd) - 1);
        periodDoLastYear = '31.12.' + (dUtil.getYear(periodOd) - 1);

        var transactionsBSTekucaGodina = transactionsSSBS(periodDo, subsidiaryId);
        var transactionsBSPrethodnaGodina = transactionsSSBS(periodDoLastYear, subsidiaryId);

        var transactionsBUTekucaGodina = transactionsSSBU(periodOd, periodDo, subsidiaryId);
        var transactionsBUPrethodnaGodina = transactionsSSBU(periodOdLastYear, periodDoLastYear, subsidiaryId);
        getTable1Values(saScheme, saRecord)
        setBalancesAccounts(transactionsBSTekucaGodina, transactionsBSPrethodnaGodina, transactionsBUTekucaGodina, transactionsBUPrethodnaGodina);

        roundValues();

        // Some summarized AOPs are required for others, so the summarizing function is executed twice because of it
        setBalancesAops();
        setBalancesAops();

        var NUMBER_OF_LINES_IN_sa_REPORT = saRecord.getLineCount({
            sublistId: 'recmachcustrecord_rsm_sal_report_parent'
        });

        for (var i = 0; i < NUMBER_OF_LINES_IN_sa_REPORT; i++) {

            var aopTextAtCurrentLine = saRecord.getSublistText({
                sublistId: 'recmachcustrecord_rsm_sal_report_parent',
                fieldId: 'custrecord_rsm_sal_aop_code',
                line: i
            });

            var currentSublistLine = saRecord.selectLine({
                sublistId: 'recmachcustrecord_rsm_sal_report_parent',
                line: i
            });

            var currentYearFieldValue;
            var previousYearFieldValue;
            var key = '_' + aopTextAtCurrentLine;
            log.error('TEST 0', key);
            log.error('TEST 1', aopTextAtCurrentLine);
            log.error('TEST 2', JSON.stringify(saScheme[key]));
            log.error('TEST 3', JSON.stringify(saScheme));
            log.error('TEST 4', JSON.stringify(saScheme['_9016']))
            currentYearFieldValue = saScheme["_" + aopTextAtCurrentLine]["current_year"];
            previousYearFieldValue = saScheme["_" + aopTextAtCurrentLine]["last_year"];

            saRecord.setCurrentSublistValue({
                sublistId: 'recmachcustrecord_rsm_sal_report_parent',
                fieldId: 'custrecord_rsm_sal_tekuca',
                value: currentYearFieldValue
            });

            saRecord.setCurrentSublistValue({
                sublistId: 'recmachcustrecord_rsm_sal_report_parent',
                fieldId: 'custrecord_rsm_sal_prethodna',
                value: previousYearFieldValue
            });

            saRecord.commitLine({
                sublistId: 'recmachcustrecord_rsm_sal_report_parent'
            });

        }

        saRecord.save();
    }

    function recalculateHelperFunction(saRecord) {

        loadScheme();

        var NUMBER_OF_LINES_IN_sa_REPORT = saRecord.getLineCount({
            sublistId: 'recmachcustrecord_rsm_sal_report_parent'
        });

        for (var i = 0; i < NUMBER_OF_LINES_IN_sa_REPORT; i++) {

            var aopCodeAtCurrentLine = saRecord.getSublistText({
                sublistId: 'recmachcustrecord_rsm_sal_report_parent',
                fieldId: 'custrecord_rsm_sal_aop_code',
                line: i
            });
            var xmlValueAtCurrentLine = saRecord.getSublistValue({
                sublistId: 'recmachcustrecord_rsm_sal_report_parent',
                fieldId: 'custrecord_rsm_sal_tekuca',
                line: i
            });
            var prevYearValueAtCurrentLine = saRecord.getSublistValue({
                sublistId: 'recmachcustrecord_rsm_sal_report_parent',
                fieldId: 'custrecord_rsm_sal_prethodna',
                line: i
            });
            var netoValueAtCurrentLine = saRecord.getSublistValue({
                sublistId: 'recmachcustrecord_rsm_sal_report_parent',
                fieldId: 'custrecord_rsm_sal_neto',
                line: i
            });

            var key = '_' + aopCodeAtCurrentLine;

            saScheme[key]["current_year"] = xmlValueAtCurrentLine;
            saScheme[key]["last_year"] = prevYearValueAtCurrentLine;
            saScheme[key]["neto"] = netoValueAtCurrentLine;
        }

        // Some summarized AOPs are required for others, so the summarizing function is executed twice because of it
        setBalancesAops();
        setBalancesAops();

        for (var i = 0; i < NUMBER_OF_LINES_IN_sa_REPORT; i++) {

            var aopCodeAtCurrentLine = saRecord.getSublistText({
                sublistId: 'recmachcustrecord_rsm_sal_report_parent',
                fieldId: 'custrecord_rsm_sal_aop_code',
                line: i
            });
            var currentSublistLine = saRecord.selectLine({
                sublistId: 'recmachcustrecord_rsm_sal_report_parent',
                line: i
            });

            saRecord.setCurrentSublistValue({
                sublistId: 'recmachcustrecord_rsm_sal_report_parent',
                fieldId: 'custrecord_rsm_sal_tekuca',
                value: saScheme["_" + aopCodeAtCurrentLine]["current_year"]
            });
            saRecord.setCurrentSublistValue({
                sublistId: 'recmachcustrecord_rsm_sal_report_parent',
                fieldId: 'custrecord_rsm_sal_prethodna',
                value: saScheme["_" + aopCodeAtCurrentLine]["last_year"]
            });
            saRecord.setCurrentSublistValue({
                sublistId: 'recmachcustrecord_rsm_sal_report_parent',
                fieldId: 'custrecord_rsm_sal_neto',
                value: saScheme["_" + aopCodeAtCurrentLine]["neto"]
            });

            saRecord.commitLine({
                sublistId: 'recmachcustrecord_rsm_sal_report_parent'
            });

        }

        saRecord.save();
    }

    function loadScheme() {
        var file1 = file.load({
            id: "./saScheme.json"
        });
        saScheme = JSON.parse(file1.getContents());
    }

    /// Create xml string with fields and values from saScheme
    function createXMLString() {
        var xmlStr =
            "<Forma>" +
            "<Naziv>Izvestaj o ostalom rezultatu</Naziv>" +
            "<Atributi>" +
            "<Naziv>Izvestaj o ostalom rezultatu</Naziv>" +
            "<NumerickaPoljaForme xmlns:a='http://schemas.datacontract.org/2004/07/AppDef'>";

        var numerickaPoljaForme = "",
            tekstualnaPoljaForme = "";

        for (var key in saScheme) {

            var numerickoPolje = "<a:NumerickoPolje>";
            numerickoPolje += "<a:Naziv>aop-" + key.substr(1) + "-5</a:Naziv>";
            numerickoPolje += "<a:Vrednosti>" + (saScheme[key]["current_year"]).toString() + "</a:Vrednosti>";
            numerickoPolje += "</a:NumerickoPolje>";

            numerickaPoljaForme += numerickoPolje;

            numerickoPolje = "<a:NumerickoPolje>";
            numerickoPolje += "<a:Naziv>aop-" + key.substr(1) + "-6</a:Naziv>";
            numerickoPolje += "<a:Vrednosti>" + (saScheme[key]["last_year"]).toString() + "</a:Vrednosti>";
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

        var recordIdSAReport = requestBody.idSAReport;
        var action = requestBody.action;
        var retVal = {
            "result": "Error"
        };

        if (action == "init_lines") {
            initialize_lines(recordIdSAReport);
            retVal = {
                "result": 'ok'
            }
        }
        if (action == "calc_lines") {
            calculate_lines(recordIdSAReport);
            retVal = {
                "result": 'ok',
                "badAops": badlyCalculatedAops,
                "messageToSend": messageToSend
            }
        }
        if (action == "xml_file") {
            exportXml(recordIdSAReport);
            retVal = {
                "result": 'ok'
            }
        }
        if (action == "pdf_file") {
            exportPdf(recordIdSAReport);
            retVal = {
                "result": 'ok'
            }
        }
        if (action == "xls_file") {
            exportXls(recordIdSAReport);
            retVal = {
                "result": 'ok'
            }
        }
        if (action == "recalculate_lines") {
            recalculate_lines(recordIdSAReport);
            retVal = {
                "result": 'ok'
            }
        }
        if (action == "delete_pdf") {
            deletePdf(recordIdSAReport);
            retVal = {
                "result": 'ok'
            }
        }
        if (action == "delete_xml") {
            deleteXml(recordIdSAReport);
            retVal = {
                "result": 'ok'
            }
        }
        if (action == "delete_xls") {
            deleteXls(recordIdSAReport);
            retVal = {
                "result": 'ok'
            }
        }
        if (action == "delete_lines") {
            deleteOldLines(recordIdSAReport);
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