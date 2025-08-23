/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * 
 * Prikaz izvestaja transakcija u odredjenom POPDV periodu
 * 
 */
define(['N/ui/serverWidget', 'N/log', 'N/search', 'N/render', 'N/file', 'N/encode'], function (serverWidget, log, search, render, file, encode) {
    function onRequest(context) {
        if (context.request.method === 'GET') {

            var form = serverWidget.createForm({
                title: 'Luka - Prikaz izvestaja transakcija u odredjenom POPDV periodu'
            });
            form.addSubmitButton({
                label: 'Generate EXCEL File'
            });
            form.addResetButton({
                label: 'Reset Fields'
            });
            form.clientScriptModulePath = './luka_assignment_1_cs.js';

            var field_1 = form.addField({
                id: 'date_start',
                type: serverWidget.FieldType.DATE,
                label: 'POPDV Start'
            }).updateDisplaySize({
                height: 70,
                width: 150
            });
            field_1.isMandatory = true;

            var field_2 = form.addField({
                id: 'date_end',
                type: serverWidget.FieldType.DATE,
                label: 'POPDV End'
            }).updateLayoutType({
                layoutType: serverWidget.FieldLayoutType.OUTSIDEBELOW
            }).updateDisplaySize({
                height: 70,
                width: 150
            });
            field_2.isMandatory = true;

            context.response.writePage(form);

        } else {

            var date_start = context.request.parameters.date_start;
            var date_end = context.request.parameters.date_end;

            // Search
            try {
                var searchResults = search.create({
                    type: search.Type.TRANSACTION,
                    columns: ["internalid", "tranid", "trandate", "custbody_popdv_datum", "grossamount", "taxamount", "taxcode", "taxitem.rate"],
                    filters: [
                        ["taxline", "is", "F"],
                        "AND",
                        ["custbody_popdv_datum", search.Operator.WITHIN, [date_start, date_end]],
                        "AND",
                        ["taxitem.country", "is", "RS"]
                    ]
                }).run();
                //context.response.writeLine("Search Data: " + JSON.stringify(searchResults, null, 2));

                var jsonData = [];
                searchResults.each(function (result) {
                    var resultData = {
                        internalid: result.getValue('internalid'),
                        tranid: result.getValue('tranid'),
                        trandate: result.getValue('trandate'),
                        custbody_popdv_datum: result.getValue('custbody_popdv_datum'),
                        taxcode: result.getValue('taxcode'),
                        rate: result.getValue({
                            name: "rate",
                            join: "taxitem"
                        }),
                        grossamount: result.getValue('grossamount'),
                        taxamount: result.getValue('taxamount'),
                        ukupno: result.getValue('grossamount') + result.getValue('taxamount')
                    };
                    jsonData.push(resultData);
                    return true
                });

                var xmlTemplate = file.load({ id: './luka_assignment_1_template_xls.xml' });
                var content = xmlTemplate.getContents();

                var templateRenderer = render.create();
                templateRenderer.templateContent = content;

                templateRenderer.addCustomDataSource({
                    format: render.DataSource.JSON,
                    alias: "JSON",
                    data: JSON.stringify({ "transactions": jsonData })
                });

                var xmlString = templateRenderer.renderAsString();

                // Create and return file
                var xlsFile = file.create({
                    name: "izvestaj_transakcija_popdv_period_" + date_start + '_' + date_end + ".xls",
                    fileType: file.Type.EXCEL,
                    contents: encode.convert({
                        string: xmlString,
                        inputEncoding: encode.Encoding.UTF_8,
                        outputEncoding: encode.Encoding.BASE_64
                    })
                });

                context.response.writeFile({
                    file: xlsFile
                });

            } catch (e) {
                log.debug("Erorr: " + e);
                context.response.writeLine("Erorr: " + e);
            }

        }
    }
    return {
        onRequest: onRequest
    };
});