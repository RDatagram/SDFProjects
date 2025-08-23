/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * 
 * Knjiga Evidencije Prometa (KEP Knjiga)
 * Get all transactions that fit certain criteria, process their data and then input them in the required KEP Document
 */
define(['N/record', 'N/search', 'N/file', 'N/runtime', 'N/util', 'N/log', "N/format"], function (record, search, file, runtime, util, log, format) {

    function getInputData(inputContext) {

        // For some reason the date format the UserEvent script gets with .getValue is returned as "2019-04-01T07:00:00.000Z" for example
        function fixDateFormat(date) {
            var day = new Date(date).getDate();
            var month = new Date(date).getMonth() + 1;
            var year = new Date(date).getFullYear();
            return day + "." + month + "." + year;
        }

        // Obtain an object that represents the current script and get dynamic parameters
        var script = runtime.getCurrentScript();
        var dynamicParams = {
            kepDocumentInternalId: script.getParameter({
                name: 'custscript_kep_internal_id'
            }),
            dateStart: fixDateFormat(script.getParameter({
                name: 'custscript_kep_date_start'
            })),
            dateEnd: fixDateFormat(script.getParameter({
                name: 'custscript_kep_date_end'
            })),
            subsidiary: script.getParameter({
                name: 'custscript_kep_subsidiary'
            }),
            location: script.getParameter({
                name: 'custscript_kep_location'
            })
        }
        log.debug("dynamicParams", dynamicParams);

        var mainSavedSearch = search.create({
            type: "transaction",
            columns: [
                search.createColumn({ name: "internalid", summary: "GROUP" }),
                search.createColumn({ name: "tranid", summary: "GROUP" }),
                search.createColumn({ name: "trandate", summary: "GROUP" }),
                search.createColumn({ name: "type", summary: "GROUP" }),
                search.createColumn({ name: "entity", summary: "GROUP" }),
                search.createColumn({ name: "subsidiary", summary: "GROUP" }),
                search.createColumn({ name: "location", summary: "GROUP" }),
                search.createColumn({ name: "transactionnumber", summary: "GROUP" }),
                search.createColumn({ name: "grossamount", summary: "SUM" }),
                search.createColumn({ name: "amount", summary: "SUM" }),
                search.createColumn({ name: "taxamount", summary: "SUM" }),
                search.createColumn({ name: "debitamount", summary: "SUM" }),
                search.createColumn({ name: "total", summary: "SUM" }),
                search.createColumn({ name: "custcol_rsm_itr_sale_gross_amount", summary: "SUM" }),
                search.createColumn({ name: "custcol_rsm_prodajna_cena", summary: "SUM" }),
                search.createColumn({ name: "quantity", summary: "SUM" })
            ],
            filters:
                [
                    ["mainline", "is", "T"],
                    "AND",
                    ["type", "anyof", "CustCred", "VendCred", "CustInvc"],
                    "AND",
                    ["subsidiary", "is", dynamicParams.subsidiary],
                    "AND",
                    ["location", "is", dynamicParams.location],
                    "AND",
                    ["trandate", "onorafter", dynamicParams.dateStart],
                    "AND",
                    ["trandate", "onorbefore", dynamicParams.dateEnd]
                ]
        });

        var mainlineFSavedSearch = search.create({
            type: "transaction",
            columns: [
                search.createColumn({ name: "internalid", summary: "GROUP" }),
                search.createColumn({ name: "tranid", summary: "GROUP" }),
                search.createColumn({ name: "trandate", summary: "GROUP" }),
                search.createColumn({ name: "type", summary: "GROUP" }),
                search.createColumn({ name: "entity", summary: "GROUP" }),
                search.createColumn({ name: "subsidiary", summary: "GROUP" }),
                search.createColumn({ name: "location", summary: "GROUP" }),
                search.createColumn({ name: "transactionnumber", summary: "GROUP" }),
                search.createColumn({ name: "grossamount", summary: "SUM" }),
                search.createColumn({ name: "amount", summary: "SUM" }),
                search.createColumn({ name: "taxamount", summary: "SUM" }),
                search.createColumn({ name: "debitamount", summary: "SUM" }),
                search.createColumn({ name: "total", summary: "SUM" }),
                search.createColumn({ name: "custcol_rsm_itr_sale_gross_amount", summary: "SUM" }),
                search.createColumn({ name: "custcol_rsm_prodajna_cena", summary: "SUM" }),
                search.createColumn({ name: "quantity", summary: "SUM" })
            ],
            filters:
                [
                    ["mainline", "is", "F"],
                    "AND",
                    ["type", "anyof", "InvWksht", "InvAdjst", "ItemRcpt"],
                    "AND",
                    ["subsidiary", "is", dynamicParams.subsidiary],
                    "AND",
                    ["location", "is", dynamicParams.location],
                    "AND",
                    ["trandate", "onorafter", dynamicParams.dateStart],
                    "AND",
                    ["trandate", "onorbefore", dynamicParams.dateEnd]
                ]
        });

        // This fixes the Results.each() limit of 4000 results
        function getAllSavedSearchResultsAsArray(savedSearch) {
            var start = 0;
            var end = 1000;
            var tempArr = [];
            while (true) {
                // getRange returns an array of Result objects
                var tempList = savedSearch.run().getRange({
                    start: start,
                    end: end
                });

                if (tempList.length === 0) {
                    break;
                }

                // Push tempList results into newResults array
                Array.prototype.push.apply(tempArr, tempList);
                start += 1000;
                end += 1000;
            }
            return tempArr;
        }

        var mainSavedSearchResults = getAllSavedSearchResultsAsArray(mainSavedSearch);
        var mainlineFSavedSearchResults = getAllSavedSearchResultsAsArray(mainlineFSavedSearch);
        var finalResults = mainSavedSearchResults.concat(mainlineFSavedSearchResults);
        log.debug("finalResults", finalResults);

        // Get KEP document lines from current KEP document which no longer have a Transaction ID (because those records got deleted) and delete those lines before continuing
        var documentLinesWithoutTranId = search.create({
            type: "customrecord_rsm_kep_document_line",
            columns: ['custrecord_rsm_kep_dl_transactionid', 'custrecord_rsm_kep_dl_parent'],
            filters: [
                ["custrecord_rsm_kep_dl_parent", "is", dynamicParams.kepDocumentInternalId],
                "AND",
                ["custrecord_rsm_kep_dl_transactionid", "is", "empty"]
            ]
        });
        var documentLinesWithoutTranIdResults = getAllSavedSearchResultsAsArray(documentLinesWithoutTranId);
        for (var i = 0; i < documentLinesWithoutTranIdResults.length; i++) {
            record.delete({
                type: 'customrecord_rsm_kep_document_line',
                id: documentLinesWithoutTranIdResults[i].id
            });
        }

        return finalResults;
    }

    // Update or create new KEP Document Lines as required
    function map(context) {
        try {

            // Initialize current record values from the saved search
            var result = JSON.parse(context.value);
            var currentRecord = {
                type: result.values["GROUP(type)"][0].value,
                parentId: runtime.getCurrentScript().getParameter({
                    name: 'custscript_kep_internal_id'
                }),
                tranId: result.values["GROUP(internalid)"][0].value,
                tranDate: result.values["GROUP(trandate)"],
                tranDateParsed: format.parse({
                    value: result.values["GROUP(trandate)"],
                    type: format.Type.DATE
                }),
                description: "",
                credit: 0,
                debit: 0
            };
            // log.debug('currentRecord', currentRecord);

            // Execute further specialized logic for specific record types
            if (['VendCred', 'InvAdjst', 'CustCred'].indexOf(currentRecord.type) != -1) { // [Bill Credit, Inventory Adjustment, Credit Memo]

                // Calculate price for columns "Zaduzenje" and "Razduzenje" in the KEP Document using the required quantity and price columns for each line inside each records with multiple items 
                function sublistQuantityPriceCalculation(recordType, recordId, sublistId, quantityField) {

                    var recordToUse = record.load({
                        type: recordType,
                        id: recordId
                    });

                    var numberOfItems = recordToUse.getLineCount({
                        sublistId: sublistId
                    });

                    var sum = 0;
                    for (var i = 0; i < numberOfItems; i++) {
                        var quantity = recordToUse.getSublistValue({
                            sublistId: sublistId,
                            fieldId: quantityField,
                            line: i
                        });
                        var price = recordToUse.getSublistValue({
                            sublistId: sublistId,
                            fieldId: 'custcol_rsm_prodajna_cena',
                            line: i
                        });
                        sum += quantity * price;
                    }

                    return sum;
                }

                if (currentRecord.type === 'CustCred') { // Credit Memo
                    currentRecord.credit = -1 * sublistQuantityPriceCalculation(record.Type.CREDIT_MEMO, currentRecord.tranId, 'item', 'quantity');
                } else if (currentRecord.type === 'VendCred') { // Bill Credit
                    currentRecord.debit = -1 * sublistQuantityPriceCalculation(record.Type.VENDOR_CREDIT, currentRecord.tranId, 'item', 'quantity');
                } else if (currentRecord.type === 'InvAdjst') { // Inventory Adjustment
                    currentRecord.debit = sublistQuantityPriceCalculation('inventoryadjustment', currentRecord.tranId, 'inventory', 'adjustqtyby');
                }

            }

            // Get other special fields as required for each record type
            var oznakaRekorda = result.values["GROUP(tranid)"];
            if (currentRecord.type === "CustInvc") { // Invoice

                var val = result.values["SUM(total)"];
                currentRecord.credit = val != "" ? val : 0;

            } else if (currentRecord.type === "ItemRcpt") { // Item Receipt

                var val = result.values["SUM(custcol_rsm_itr_sale_gross_amount)"];
                currentRecord.debit = val != "" ? val : 0;

            } else if (['VendCred', 'InvWksht', 'InvAdjst'].indexOf(currentRecord.type) != -1) { // Bill Credit || Inventory Worksheet || Inventory Adjustment

                oznakaRekorda = result.values["GROUP(transactionnumber)"];

            }

            var customerName = "";
            if (currentRecord.type === "VendCred" || currentRecord.type === 'ItemRcpt') { // Bill Credit || Item Receipt
                var entity = search.lookupFields({
                    type: 'entity',
                    id: result.values["GROUP(entity)"][0].value,
                    columns: ['entityid']
                });
                customerName = entity.entityid;
            } else if (currentRecord.type === "CustInvc" || currentRecord.type === 'CustCred') { // Invoice || Credit Memo
                var entity = search.lookupFields({
                    type: 'entity',
                    id: result.values["GROUP(entity)"][0].value,
                    columns: ['altname']
                });
                customerName = entity.altname;
            } else if (currentRecord.type === "InvAdjst") { // Inventory Adjustment
                var customer = record.load({
                    type: search.Type.INVENTORY_ADJUSTMENT,
                    id: currentRecord.tranId
                });
                customerName = customer.getText('customer');
            }

            currentRecord.description = oznakaRekorda + " " + currentRecord.tranDate + " " + customerName;

            function createLine(lineData) {
                log.debug('currentRecord', currentRecord);

                var creditValue = currentRecord.credit;
                var debitValue = currentRecord.debit;

                // Check if custom manually entered data currently written in the line we need to use again was passed, if not then just create a new line
                if (lineData) {
                    log.debug('lineData', lineData);

                    record.delete({
                        type: 'customrecord_rsm_kep_document_line',
                        id: lineData.id,
                    });

                    creditValue = lineData.getValue('custrecord_rsm_kep_dl_credit');
                    debitValue = lineData.getValue('custrecord_rsm_kep_dl_debit');

                }

                var kepDocumentLine = record.create({
                    type: 'customrecord_rsm_kep_document_line'
                });

                kepDocumentLine.setValue({
                    fieldId: 'custrecord_rsm_kep_dl_parent',
                    value: currentRecord.parentId
                });

                kepDocumentLine.setValue({
                    fieldId: 'custrecord_rsm_kep_dl_transactionid',
                    value: currentRecord.tranId
                });

                kepDocumentLine.setValue({
                    fieldId: 'custrecord_rsm_kep_dl_date',
                    value: currentRecord.tranDateParsed
                });

                kepDocumentLine.setValue({
                    fieldId: 'custrecord_rsm_kep_dl_description',
                    value: currentRecord.description
                });

                kepDocumentLine.setValue({
                    fieldId: 'custrecord_rsm_kep_dl_credit',
                    value: creditValue
                });

                kepDocumentLine.setValue({
                    fieldId: 'custrecord_rsm_kep_dl_debit',
                    value: debitValue
                });

                kepDocumentLine.save();

            }

            // Check if current record from the saved search already exist as a line
            var existingLine = search.create({
                type: "customrecord_rsm_kep_document_line",
                columns: ['custrecord_rsm_kep_dl_date', 'custrecord_rsm_kep_dl_description', 'custrecord_rsm_kep_dl_debit', 'custrecord_rsm_kep_dl_credit'],
                filters: [
                    ["custrecord_rsm_kep_dl_parent", "is", currentRecord.parentId],
                    "AND",
                    ['custrecord_rsm_kep_dl_transactionid', 'is', currentRecord.tranId]
                ]
            }).run();

            if (existingLine.getRange(0, 10).length) {

                existingLine.each(function (line) {
                    // log.debug('line', line);

                    // If "Datum evidencije" and "Opis" are changed then update the record regardless of record type
                    if (line.getValue('custrecord_rsm_kep_dl_date') !== currentRecord.tranDate ||
                        line.getValue('custrecord_rsm_kep_dl_description') !== currentRecord.description) {
                        createLine(line);
                    } else {

                        // If the above is the same but "Zaduzenje" and "Razduzenje" are changed then check for type first, for any other type than the ones below you should ignore these two fields
                        if (currentRecord.type === 'CustInvc' || // Invoice
                            currentRecord.type === 'ItemRcpt') { // Item Receipt

                            if (format.parse({ value: line.getValue('custrecord_rsm_kep_dl_credit'), type: format.Type.CURRENCY }) !== currentRecord.credit ||
                                format.parse({ value: line.getValue('custrecord_rsm_kep_dl_debit'), type: format.Type.CURRENCY }) !== currentRecord.debit) {
                                record.delete({
                                    type: 'customrecord_rsm_kep_document_line',
                                    id: line.id,
                                });
                                createLine();
                            }

                        }

                    }

                    return true
                });

            } else {

                createLine();

            }

        } catch (e) {
            log.error("MAP ERROR", e);
        }
    }

    function summarize(summary) {
        log.audit('Usage', summary.usage);
        log.audit('Seconds', summary.seconds);
        log.audit('Yields', summary.yields);
    }

    return {
        getInputData: getInputData,
        map: map,
        summarize: summarize
    };

});