/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * 
 * Knjiga Evidencije Prometa (KEP Knjiga)
 * When submitting or editing data on specific records also forward that data to other custom documents/records that need to store it. 
 */
define(['N/log', 'N/ui/serverWidget', 'N/ui/message', 'N/record', 'N/search'], function (log, serverWidget, message, record, search) {

    function afterSubmit(context) {
        try {

            if (context.type === context.UserEventType.CREATE || context.type === context.UserEventType.EDIT) {
                var currentRecord = context.newRecord;

                // For some reason the date format the UserEvent script gets with .getValue is returned as "2019-04-01T07:00:00.000Z" for example
                function fixDateFormat(date) {
                    var day = new Date(date).getDate().toString();
                    var month = (new Date(date).getMonth() + 1).toString();
                    var year = new Date(date).getFullYear().toString();
                    return (day.length === 1 ? "0" + day : day) + "." + (month.length === 1 ? "0" + month : month) + "." + year;
                }

                // If there are multiple inventory items in the record Items sublist then add all the required values up and execute further specialized logic for that record
                function inventoryItemsFromSublistSumAndSave(sumUpField, outputField, outputRecord) {
                    var sum = 0;

                    var numberOfItems = currentRecord.getLineCount({
                        sublistId: 'item'
                    });
                    for (var i = 0; i < numberOfItems; i++) {
                        sum += currentRecord.getSublistValue({
                            sublistId: 'item',
                            fieldId: sumUpField,
                            line: i
                        });
                    }

                    // Only save if the value is different from 0
                    if (sum) {
                        outputRecord.setValue({
                            fieldId: outputField,
                            value: sum
                        });
                        // Set the other value as zero instead Null
                        outputRecord.setValue({
                            fieldId: outputField === 'custrecord_rsm_kep_dl_credit' ? 'custrecord_rsm_kep_dl_debit' : 'custrecord_rsm_kep_dl_credit',
                            value: 0.00
                        });
                        outputRecord.save();
                    }
                }

                // Create a line inside the KEP document
                function createKepDocumentLine(result) {

                    var kepDocumentLine = record.create({
                        type: 'customrecord_rsm_kep_document_line',
                        isDynamic: true
                    });

                    kepDocumentLine.setValue({
                        fieldId: 'custrecord_rsm_kep_dl_parent',
                        value: result.id
                    });

                    kepDocumentLine.setValue({
                        fieldId: 'custrecord_rsm_kep_dl_transactionid',
                        value: currentRecord.id
                    });

                    kepDocumentLine.setValue({
                        fieldId: 'custrecord_rsm_kep_dl_date',
                        value: currentRecord.getValue({ fieldId: 'trandate' })
                    });

                    var oznakaRekorda = currentRecord.getValue({ fieldId: 'tranid' }) != "" ? currentRecord.getValue({ fieldId: 'tranid' }) : currentRecord.getValue({ fieldId: 'transactionnumber' });

                    var customerName = "";
                    if (currentRecord.type === "vendorcredit" || currentRecord.type === 'itemreceipt') { // vendorcredit === Bill Credit
                        var entity = search.lookupFields({
                            type: 'entity',
                            id: currentRecord.getValue({ fieldId: 'entity' }),
                            columns: ['entityid']
                        });
                        customerName = entity.entityid;
                    } else if (currentRecord.type === "invoice" || currentRecord.type === 'creditmemo') {
                        var entity = search.lookupFields({
                            type: 'entity',
                            id: currentRecord.getValue({ fieldId: 'entity' }),
                            columns: ['altname']
                        });
                        customerName = entity.altname;
                    }

                    kepDocumentLine.setValue({
                        fieldId: 'custrecord_rsm_kep_dl_description',
                        value: oznakaRekorda + " " + dateInRecord + " " + customerName
                    });

                    // Get additional required values from the current record depending on its type and execute specialized logic
                    if (currentRecord.type === "invoice") {
                        inventoryItemsFromSublistSumAndSave("grossamt", "custrecord_rsm_kep_dl_credit", kepDocumentLine);
                    } else if (currentRecord.type === "itemreceipt") {
                        inventoryItemsFromSublistSumAndSave("custcol_rsm_itr_sale_gross_amount", "custrecord_rsm_kep_dl_debit", kepDocumentLine);
                    } else {
                        kepDocumentLine.setValue({ fieldId: 'custrecord_rsm_kep_dl_credit', value: 0.00 });
                        kepDocumentLine.setValue({ fieldId: 'custrecord_rsm_kep_dl_debit', value: 0.00 });
                        kepDocumentLine.save();
                    }

                }

                // Execute a saved search to get all the required KEP documents and then add or update the KEP document line
                function getAndUpdateKepDocuments() {

                    // Get all the required KEP Documents
                    var kepDocumentSearchResults = search.create({
                        type: "customrecord_rsm_kep_document",
                        columns: ["custrecord_rsm_kep_document_subsidiary", "custrecord_rsm_kep_document_date_from", "custrecord_rsm_kep_document_date_to"],
                        filters: [
                            ["custrecord_rsm_kep_document_date_from", search.Operator.ONORBEFORE, dateInRecord],
                            "AND",
                            ["custrecord_rsm_kep_document_date_to", search.Operator.ONORAFTER, dateInRecord],
                            "AND",
                            ["custrecord_rsm_kep_document_subsidiary", "is", subsidiaryInRecord],
                            "AND",
                            ["custrecord_rsm_kep_document_location", "is", locationInRecord]
                        ]
                    }).run();
                    // log.debug("Search Data: ", JSON.stringify(kepDocumentSearchResults.getRange(0, 100)));

                    // If no KEP documents exist create one for that year, location, and subsidiary and then add the required record as its KEP document line
                    if (!kepDocumentSearchResults.getRange(0, 1).length) {

                        var kepDocument = record.create({
                            type: 'customrecord_rsm_kep_document',
                            isDynamic: true
                        });

                        kepDocument.setValue({
                            fieldId: 'name',
                            value: "Knjiga Evidencije Prometa " + currentRecord.getValue({ fieldId: 'trandate' }).getFullYear().toString()
                        });

                        kepDocument.setValue({
                            fieldId: 'custrecord_rsm_kep_document_subsidiary',
                            value: subsidiaryInRecord
                        });

                        kepDocument.setValue({
                            fieldId: 'custrecord_rsm_kep_document_location',
                            value: locationInRecord
                        });

                        kepDocument.setValue({
                            fieldId: 'custrecord_rsm_kep_document_date_from',
                            value: new Date(currentRecord.getValue({ fieldId: 'trandate' }).getFullYear().toString() + "-01-01T08:00:00.000Z")
                        });

                        kepDocument.setValue({
                            fieldId: 'custrecord_rsm_kep_document_date_to',
                            value: new Date(currentRecord.getValue({ fieldId: 'trandate' }).getFullYear().toString() + "-12-31T08:00:00.000Z")
                        });

                        kepDocument.save();

                        getAndUpdateKepDocuments();

                    } else {

                        // If the KEP document line already exists in any KEP documents, delete it everywhere before creating a new line wherever required
                        var linesWithCurrentId = search.create({
                            type: "customrecord_rsm_kep_document_line",
                            columns: ['custrecord_rsm_kep_dl_transactionid'],
                            filters: [
                                ["custrecord_rsm_kep_dl_transactionid", "is", currentRecord.id]
                            ]
                        }).run();
                        linesWithCurrentId.each(function (line) {
                            record.delete({
                                type: 'customrecord_rsm_kep_document_line',
                                id: line.id,
                            });
                            return true
                        });

                        // Loop through all KEP documents that need to be updated and add or update the required KEP document line
                        kepDocumentSearchResults.each(function (result) {

                            createKepDocumentLine(result);

                            return true
                        });

                    }

                }

                // Get date and subsidiary field of the submitted record data
                var dateInRecord = fixDateFormat(currentRecord.getValue({
                    fieldId: 'trandate',
                }));
                var subsidiaryInRecord = currentRecord.getValue({
                    fieldId: 'subsidiary',
                });
                var locationInRecord = currentRecord.getValue({
                    fieldId: 'location',
                });

                // Initialization of the script
                getAndUpdateKepDocuments();

            }

        } catch (e) {
            log.error("Try/Catch Error", e);
        }
    }

    return {
        afterSubmit: afterSubmit
    };

});