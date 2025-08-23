/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * 
 * Knjiga Evidencije Prometa (KEP Knjiga)
 */
define(['N/record', 'N/search', 'N/task', 'N/log', 'N/format'], function (record, search, task, log, format) {

    function post(requestBody) {

        // For some reason the date format the UserEvent script gets with .getValue is returned as "2019-04-01T07:00:00.000Z" for example, turn it into dd.mm.yyyy
        function fixDateFormat(date) {
            var day = new Date(date).getDate().toString();
            var month = (new Date(date).getMonth() + 1).toString();
            var year = new Date(date).getFullYear().toString();
            return (day.length === 1 ? "0" + day : day) + "." + (month.length === 1 ? "0" + month : month) + "." + year;
        }

        if (requestBody.action === 'runscript') {

            // Call map reduce with passed params
            var dynamicParams = {
                custscript_kep_internal_id: requestBody.kepDocumentInternalId,
                custscript_kep_date_start: requestBody.date_start,
                custscript_kep_date_end: requestBody.date_end,
                custscript_kep_subsidiary: requestBody.subsidiary,
                custscript_kep_location: requestBody.location
            }

            var mrTask = task.create({
                taskType: task.TaskType.MAP_REDUCE
            });
            mrTask.scriptId = "customscript_rsm_kep_document_mr";
            mrTask.deploymentId = "customdeploy_rsm_kep_document_mr";
            mrTask.params = dynamicParams;
            var mrTaskId = mrTask.submit();

            // Response object
            return {
                "mrtaskid": mrTaskId
            };

        } else if (requestBody.action === 'checkstatus') {

            var summary = task.checkStatus({
                taskId: requestBody.taskid
            });

            // Response object
            return {
                "status": summary.status,
                "stage": summary.stage
            }

        } else if (requestBody.action === 'deleteAll') {

            // Delete all the lines inside the KEP Document
            var allLines = search.create({
                type: "customrecord_rsm_kep_document_line",
                columns: ['custrecord_rsm_kep_dl_parent'],
                filters: [
                    ["custrecord_rsm_kep_dl_parent", "is", requestBody.kepDocumentInternalId]
                ]
            }).run();
            allLines.each(function (line) {
                record.delete({
                    type: 'customrecord_rsm_kep_document_line',
                    id: line.id,
                });
                return true
            });

            // Response object
            return {
                "status": true
            }

        } else if (requestBody.action === 'import') {
            try {

                // First compare if "subsidiary" and "location" parameters are the same on both KEP documents
                var importDocument = record.load({
                    type: 'customrecord_rsm_kep_document',
                    id: requestBody.kepId
                });
                if ((importDocument.getValue('custrecord_rsm_kep_document_subsidiary') != requestBody.subsidiary) ||
                    (importDocument.getValue('custrecord_rsm_kep_document_location') != requestBody.location)) {
                    // Response object
                    return {
                        "status": false,
                        "error": 'Subsidiary i lokacija se ne podudaraju na ova dva KEP rekorda!'
                    }
                }

                // Get KEP document lines from current KEP document
                var mainKepDocumentLines = search.create({
                    type: "customrecord_rsm_kep_document_line",
                    columns: ['custrecord_rsm_kep_dl_transactionid', 'custrecord_rsm_kep_dl_parent'],
                    filters: [
                        ["custrecord_rsm_kep_dl_parent", "is", requestBody.kepDocumentInternalId]
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

                var mainKepDocumentLinesResults = getAllSavedSearchResultsAsArray(mainKepDocumentLines);
                var resultIds = [];
                for (var i = 0; i < mainKepDocumentLinesResults.length; i++) {
                    resultIds.push(mainKepDocumentLinesResults[i].getValue('custrecord_rsm_kep_dl_transactionid'));
                }

                // Import KEP document lines from given KEP internal ID that don't exist in the current one
                var kepDocumentLinesToImport = search.create({
                    type: "customrecord_rsm_kep_document_line",
                    columns: ['custrecord_rsm_kep_dl_transactionid', 'custrecord_rsm_kep_dl_date', 'custrecord_rsm_kep_dl_description', 'custrecord_rsm_kep_dl_debit', 'custrecord_rsm_kep_dl_credit'],
                    filters: [
                        ["custrecord_rsm_kep_dl_parent", "is", requestBody.kepId],
                        "AND",
                        ["custrecord_rsm_kep_dl_date", "onorafter", fixDateFormat(requestBody.date_start)],
                        "AND",
                        ["custrecord_rsm_kep_dl_date", "onorbefore", fixDateFormat(requestBody.date_end)]
                    ]
                });

                kepDocumentLinesToImportResults = getAllSavedSearchResultsAsArray(kepDocumentLinesToImport);

                if (kepDocumentLinesToImportResults.length) {
                    var counter = 0;
                    for (var i = 0; i < kepDocumentLinesToImportResults.length; i++) {
                        try {

                            var importedTranId = kepDocumentLinesToImportResults[i].getValue('custrecord_rsm_kep_dl_transactionid');
                            if ((importedTranId != '') &&
                                (resultIds.indexOf(importedTranId) == -1)) {
                                counter++;

                                // Create and import the line that doesn't exist
                                var kepDocumentLine = record.create({
                                    type: 'customrecord_rsm_kep_document_line'
                                });

                                kepDocumentLine.setValue({
                                    fieldId: 'custrecord_rsm_kep_dl_parent',
                                    value: requestBody.kepDocumentInternalId
                                });

                                kepDocumentLine.setValue({
                                    fieldId: 'custrecord_rsm_kep_dl_transactionid',
                                    value: importedTranId
                                });

                                kepDocumentLine.setValue({
                                    fieldId: 'custrecord_rsm_kep_dl_date',
                                    value: format.parse({
                                        value: kepDocumentLinesToImportResults[i].getValue('custrecord_rsm_kep_dl_date'),
                                        type: format.Type.DATE
                                    })
                                });

                                kepDocumentLine.setValue({
                                    fieldId: 'custrecord_rsm_kep_dl_description',
                                    value: kepDocumentLinesToImportResults[i].getValue('custrecord_rsm_kep_dl_description')
                                });

                                kepDocumentLine.setValue({
                                    fieldId: 'custrecord_rsm_kep_dl_credit',
                                    value: kepDocumentLinesToImportResults[i].getValue('custrecord_rsm_kep_dl_credit') != '' ? kepDocumentLinesToImportResults[i].getValue('custrecord_rsm_kep_dl_credit') : 0
                                });

                                kepDocumentLine.setValue({
                                    fieldId: 'custrecord_rsm_kep_dl_debit',
                                    value: kepDocumentLinesToImportResults[i].getValue('custrecord_rsm_kep_dl_debit') != '' ? kepDocumentLinesToImportResults[i].getValue('custrecord_rsm_kep_dl_debit') : 0
                                });

                                kepDocumentLine.save();

                            }


                        } catch (e) {
                            log.debug('Error when importing specific line: ', e);
                            log.debug('Error line data: ', kepDocumentLinesToImportResults[i]);
                        }
                    }
                    // Response object
                    return {
                        "status": true,
                        "message": 'Uspešno završeno, importovano linija: ' + counter
                    }
                } else {
                    // Response object
                    return {
                        "status": false,
                        "error": 'U navedenom KEP dokumentu nema polja za import!'
                    }
                }

            } catch (e) {
                log.debug('Error', e);
                // Response object
                return {
                    "status": false,
                    "error": 'Import error: ' + e
                }
            }
        }
    }

    return {
        post: post
    };

});