/**
 *
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope public
 * @author UCGP
 * Script brief description: Creednz vendor validation
 */
var PAGE_SIZE = 500;
var searchId = 'customsearch_ss_vendor_evaluation_table';
define(["N/ui/serverWidget", "N/log", "N/record", "N/url", "N/search", "N/task", "N/redirect", "N/runtime", "N/encode", "N/file", "N/https", "./ssearches/searchlib"],
    (ui, log, record, url, search, task, redirect, runtime, encode, file, https, searchlib) => {
        function onRequest(context) {
            // get method
            if (context.request.method === 'GET') {
                var scriptStatusFlag = 0;
                try {
                    log.debug("run schedules script");
                    //check if scheduled script is runnig or not
                    var scheduledscriptinstanceSearchObj = search.create({
                        type: "scheduledscriptinstance",
                        filters:
                            [
                                ["script.scriptid", "is", "customscript_ss_get_externalid_in_script"],
                                "AND",
                                ["startdate", "on", "today"]
                            ],
                        columns:
                            [
                                search.createColumn({
                                    name: "internalid",
                                    join: "script",
                                    label: "Internal ID"
                                }),
                                search.createColumn({name: "startdate", label: "Start Date"}),

                                search.createColumn({name: "status", label: "Status"}),
                                search.createColumn({name: "startdate", label: "Start Date"}),
                                search.createColumn({
                                    name: "scriptid",
                                    join: "script",
                                    label: "Script ID"
                                })
                            ]
                    });
                    var searchResultCount = scheduledscriptinstanceSearchObj.runPaged().count;
                    log.debug("scheduledscriptinstanceSearchObj result count", searchResultCount);
                    scheduledscriptinstanceSearchObj.run().each(function (result) {
                        // .run().each has a limit of 4,000 results
                        var scriptStatus = result.getValue({
                            name: "status"
                        });
                        log.debug("scriptStatus", scriptStatus);
                        if (scriptStatus != "Complete" && scriptStatus != "Failed") {
                            //set flag
                            scriptStatusFlag = 1;
                            log.debug("scriptStatusFlag", scriptStatusFlag);
                            return false;
                        } else {
                            return true;
                        }
                    });

                    if (scriptStatusFlag) {
                        // execute schedule script to update the external id

                        var scriptTask = task.create({
                            taskType: task.TaskType.SCHEDULED_SCRIPT,
                            scriptId: "customscript_ss_get_externalid_in_script",
                            deploymentId: "customdeploy_ss_get_externalid_in_script"
                        });
                        var scriptTaskId = scriptTask.submit();
                        log.debug("scriptTaskId", scriptTaskId);

                    }

                    var form = ui.createForm({
                        id: 'vendor_evaluation',
                        title: 'Vendor Evaluation'
                    });

                    var fieldgroup = form.addFieldGroup({
                        id: 'filterfieldsgroup',
                        label: 'Filter Group'
                    });
                    var totalCountField = form.addField({
                        id: 'custpage_total_count',
                        type: ui.FieldType.TEXT,
                        label: 'Total Count'
                    }).updateDisplayType({
                        displayType: ui.FieldDisplayType.HIDDEN
                    });
                    var nsAccountId = runtime.accountId;

                    if (nsAccountId == "TSTDRV1255519") {
                        form.clientScriptModulePath = 'SuiteScripts/cs_creednz_vendor_evaluation.js';

                    } else {
                        //form.clientScriptModulePath = 'SuiteBundles/Bundle 537712/cs_creednz_vendor_evaluation.js';
                        form.clientScriptModulePath = './cs_creednz_vendor_evaluation.js';

                    }
                    //form.clientScriptModulePath = 'SuiteScripts/cs_creednz_vendor_evaluation.js';


                    var pageId = parseInt(context.request.parameters.page);
                    var scriptId = context.request.parameters.scriptId;
                    var deploymentId = context.request.parameters.deploymentId;


                    var creedNzSublist = form.addSublist({
                        id: "custpage_vendor_evaluation_sublist",
                        type: ui.SublistType.LIST,
                        label: "Vendor Evaluation",
                    });
                    form.addButton({
                        id: 'creednz_evaluation',
                        label: 'New',
                        functionName: 'openSuiteletPopup()'
                    });

                    form.addButton({
                        id: 'creednz_evaluation_analyze',
                        label: 'Synk Status',
                        functionName: 'updateVendorAnalyze()'
                    });
                    form.addButton({
                        id: 'creednz_evaluation_refresh',
                        label: 'Refresh',
                        functionName: 'refresh()'
                    });


                    creedNzSublist.addField({
                        id: "custpage_vendor_name",
                        label: "Vendor name",
                        type: ui.FieldType.TEXT
                    });
                    creedNzSublist.addField({
                        id: "custpage_vendor_id",
                        label: "Vendor ID",
                        type: ui.FieldType.TEXT
                    }).updateDisplayType({
                        displayType: ui.FieldDisplayType.HIDDEN
                    });
                    creedNzSublist.addField({
                        id: "custpage_vendor_risk_status",
                        label: "Vendor Risk Flag",
                        type: ui.FieldType.TEXT
                    }).updateDisplayType({
                        displayType: ui.FieldDisplayType.HIDDEN
                    });
                    creedNzSublist.addField({
                        id: "custpage_creednz_evaluation_id",
                        label: "Creednz Evaluation Id ",
                        type: ui.FieldType.TEXT
                    }).updateDisplayType({
                        displayType: ui.FieldDisplayType.HIDDEN
                    });
                    creedNzSublist.addField({
                        id: "custpage_primary_contact",
                        label: "Primary contact",
                        type: ui.FieldType.TEXT
                    });
                    creedNzSublist.addField({
                        id: "custpage_vendor_email",
                        label: "Email",
                        type: ui.FieldType.TEXT,
                    });
                    creedNzSublist.addField({
                        id: "custpage_creednz_risk_status",
                        label: "Risk Status",
                        type: ui.FieldType.TEXT
                    });
                    // inventory specific fields
                    creedNzSublist.addField({
                        id: "custpage_assessment_status",
                        label: "Assessment status ",
                        type: ui.FieldType.TEXT
                    });

                    creedNzSublist.addField({
                        id: "custpage_creednz_external_id",
                        label: "Creednz External Id ",
                        type: ui.FieldType.TEXT
                    });
                    creedNzSublist.addField({
                        id: "custpage_creednz_info_view",
                        label: " ",
                        type: ui.FieldType.TEXT
                    });
                    creedNzSublist.addField({
                        id: "custpage_creednz_create_or_send",
                        label: " ",
                        type: ui.FieldType.TEXT
                    });


                    // creedNzSublist.addMarkAllButtons();
                    var retrieveSearch = runSearch(searchId, PAGE_SIZE);
                    log.debug("retrieveSearch", retrieveSearch.count);
                    totalCountField.defaultValue = retrieveSearch.count;

                    // log.debug('retrieveSearch', retrieveSearch);
                    //log.debug("retrieveSearch count", retrieveSearch.count);
                    var pageCount = Math.ceil(retrieveSearch.count / PAGE_SIZE);
                    log.debug('pageCount', pageCount);
                    // Set pageId to correct value if out of index
                    if (!pageId || pageId == '' || pageId < 0) {
                        pageId = 0;
                        log.debug('pageId', pageId);
                    } else if (pageId >= pageCount) pageId = pageCount - 1;
                    // Add buttons to simulate Next & Previous

                    if (retrieveSearch.count > 0) {
                        if (pageId != 0) {
                            form.addButton({
                                id: 'custpage_previous',
                                label: 'Previous',
                                functionName: 'getSuiteletPage(' + scriptId + ', ' + deploymentId + ', ' + (pageId - 1) + ')'
                            });
                        }
                        if (pageId != pageCount - 1) {
                            form.addButton({
                                id: 'custpage_next',
                                label: 'Next',
                                functionName: 'getSuiteletPage(' + scriptId + ', ' + deploymentId + ', ' + (pageId + 1) + ')'
                            });
                        }
                    }
                    // Add drop-down and options to navigate to specific page
                    var selectOptions = form.addField({
                        id: 'custpage_pageid',
                        label: 'Page Index',
                        type: ui.FieldType.SELECT
                    });
                    /* selectOptions.updateLayoutType({
                        layoutType: ui.FieldLayoutType.NORMAL
                     });*/
                    for (i = 0; i < pageCount; i++) {
                        if (i == pageId) {
                            selectOptions.addSelectOption({
                                value: 'pageid_' + i,
                                text: ((i * PAGE_SIZE) + 1) + ' – ' + ((i + 1) * PAGE_SIZE),
                                isSelected: true
                            });
                        } else {
                            selectOptions.addSelectOption({
                                value: 'pageid_' + i,
                                text: ((i * PAGE_SIZE) + 1) + ' – ' + ((i + 1) * PAGE_SIZE)
                            });
                        }
                    }
                    if (retrieveSearch.count > 0) {
                        var addResults = fetchSearchResult(retrieveSearch, pageId);
                        var j = 0;
                        // set sublist values
                        log.debug("addResults", addResults);

                        addResults.forEach(function (result) {
                            // log.debug("addResults",result);
                            //check the count of items
                            // log.debug("result.vendorExternalId",result.vendorExternalId);
                            var paramArray = [];
                            var paramObj = {};
                            if (result.vendorId) {
                                var vendorRecId = result.vendorId;
                                creedNzSublist.setSublistValue({
                                    id: 'custpage_vendor_id',
                                    line: j,
                                    value: result.vendorId
                                });
                                // log.debug("add vendorid");

                                paramArray.push(vendorRecId);

                            }
                            if (result.vendorName) {
                                // log.debug("add vendorName ",result.vendorName);

                                creedNzSublist.setSublistValue({
                                    id: 'custpage_vendor_account',
                                    line: j,
                                    value: result.vendorName
                                });
                                // log.debug("add vendorname");

                            }
                            if (result.vendorName) {
                                creedNzSublist.setSublistValue({
                                    id: 'custpage_vendor_name',
                                    line: j,
                                    value: result.vendorName
                                });
                                //  log.debug("add vendorname name");

                            }

                            if (result.vendorPrimaryContact) {
                                creedNzSublist.setSublistValue({
                                    id: 'custpage_primary_contact',
                                    line: j,
                                    value: result.vendorPrimaryContact
                                });
                                // log.debug("add vendorphone");

                            }

                            if (result.vendorEmail) {
                                creedNzSublist.setSublistValue({
                                    id: 'custpage_vendor_email',
                                    line: j,
                                    value: result.vendorEmail
                                });
                                // log.debug("add vendorprimary");

                            }
                            if (result.vendorEmail) {
                                creedNzSublist.setSublistValue({
                                    id: 'custpage_vendor_email',
                                    line: j,
                                    value: result.vendorEmail
                                });

                            }
                            if (result.vendorRiskStatus) {
                                creedNzSublist.setSublistValue({
                                    id: 'custpage_creednz_risk_status',
                                    line: j,
                                    value: result.vendorRiskStatus
                                });

                            }
                            if (result.vendorAssessmentStatus) {
                                var assessmentStatus = result.vendorAssessmentStatus;
                                creedNzSublist.setSublistValue({
                                    id: 'custpage_assessment_status',
                                    line: j,
                                    value: assessmentStatus
                                });
                                //log.debug("add vendorCreatedDate");
                            }
                            if (result.creednzEvaluationId) {
                                var vendorEvaluationId = result.creednzEvaluationId;
                                creedNzSublist.setSublistValue({
                                    id: 'custpage_creednz_evaluation_id',
                                    line: j,
                                    value: vendorEvaluationId
                                });
                                paramArray.push(vendorEvaluationId);
                            }
                            if (result.creednzExternalId) {
                                var vendorExternalID = result.creednzExternalId;
                                creedNzSublist.setSublistValue({
                                    id: 'custpage_creednz_external_id',
                                    line: j,
                                    value: vendorExternalID
                                });
                            }
                            if (result.creednzVendorRiskStatus) {
                                var riskStatus = result.creednzVendorRiskStatus;
                                creedNzSublist.setSublistValue({
                                    id: 'custpage_vendor_risk_status',
                                    line: j,
                                    value: riskStatus
                                });
                            }

                            /* creedNzSublist.setSublistValue({
                                id: 'custpage_link',
                                line: j,
                                value: 'showAlert()'
                            });*/
                            // paramArray.push(paramObj);
                            if (assessmentStatus == "Completed") {


                                var suiteletUrl = url.resolveScript({
                                    scriptId: 'customscript_sl_vendor_page_creednz_info',
                                    deploymentId: 'customdeploy_sl_vendor_page_creednz_info',
                                    returnExternalUrl: false
                                });

                                var viewUrlFull = suiteletUrl.split("compid=")[0];
                                //var viewInfoUrl = viewUrlFull + "externalId=" + result.vendorExternalId;
                                var viewInfoUrl = viewUrlFull + "externalId=" + vendorExternalID + "&vendorId=" + vendorRecId;

                                // var popupLink = '<a href="#" onclick="window.open("http://www.yahoo.com", "_blank")">View Details</a>';
                                var popupLink = '<html><a href="#" style="color: blue; text-decoration : none;" onclick="window.open(\'' + viewInfoUrl + '\', \'popup\', \'width=900,height=600\')">View</a></html>';
                                creedNzSublist.setSublistValue({
                                    id: 'custpage_creednz_info_view',
                                    line: j,
                                    value: popupLink
                                });
                            } //

                            if (assessmentStatus == "Completed") {
                                log.debug("riskStatus in view", riskStatus);
                                if (riskStatus == "0" || riskStatus == 0) {
                                    var popupLink = '<a href="#" style="color: blue; text-decoration : none;" onclick="createVendor(\'' + vendorEvaluationId + '\')">Create Vendor</a>';

                                    creedNzSublist.setSublistValue({
                                        id: 'custpage_creednz_create_or_send',
                                        line: j,
                                        value: popupLink
                                    });
                                }

                                if (riskStatus == "1" || riskStatus == 1) {

                                    log.debug("paramArray", paramArray);
                                    // var popupLink = '<a href="#" onclick="myFunction(\'Hello, NetSuite!\')">Click me</a>';
                                    // var popupLink = '<a href="#" style="color: blue; text-decoration : none;" onclick="sendResultToVendors(\'Parameter ' + vendorEvaluationId + `,` + vendorRecId + '\')">Send Result To Vendor</a>';
                                    //var popupLink = '<a href="#" style="color: blue; text-decoration : none;" onclick="sendResultToVendors(\'Parameter ' + paramArray + '\')">Send Result To Vendor</a>';
                                    var popupLink = '<a href="#" style="color: blue; text-decoration : none;" onclick="sendResultToVendors(\'' + paramArray + '\')">Send Result To Vendor</a>';

                                    creedNzSublist.setSublistValue({
                                        id: 'custpage_creednz_create_or_send',
                                        line: j,
                                        value: popupLink
                                    });
                                }

                            }


                            j++
                        });
                    }
                    context.response.writePage(form);
                } catch (err) {
                    log.debug("error", err);
                }
            } else {
                //post
                log.debug("in post method");
            }
        } //end execute


        function runSearch(searchId, searchPageSize) {
            try {
                //check sorting method
                /*var searchObj = search.load({
                   id: searchId
                });*/
                var searchObj = searchlib.customsearch_ss_vendor_evaluation_table();
                return searchObj.runPaged({
                    pageSize: searchPageSize
                });
            } catch (er) {
                log.debug('Error on runSearch', JSON.stringify(er));
            }
        } //end runsearch
        function fetchSearchResult(pagedData, pageIndex) {
            try {
                var searchPage = pagedData.fetch({
                    index: pageIndex
                });
                // log.debug('searchPage', searchPage);
                var results = new Array();
                searchPage.data.forEach(function (result) {
                    //recordId = result.id;
                    log.debug("result", result);
                    var vendorName = result.getValue({
                        name: "custrecord_vendor_name",
                        label: "Vendor Name"
                    });
                    var vendorEmail = result.getValue({
                        name: "custrecord_vendor_email",
                        label: "Vendor Email"
                    });
                    var vendorPrimaryContact = result.getValue({
                        name: "custrecord_primary_contact",
                        label: "Primary Contact"
                    });
                    var vendorRiskStatus = result.getValue({
                        name: "custrecord_risk_status",
                        label: "Risk Status"
                    });
                    var vendorAssessmentStatus = result.getValue({
                        name: "custrecord_assessment_status",
                        label: "Assessment status"
                    });
                    var vendorId = result.getValue({
                        name: "internalid",
                        label: "Internal ID"
                    });
                    var creednzEvaluationId = result.getValue({
                        name: "custrecord_creednz_evaluation_id",
                        label: "Creednz Evaluation ID"
                    });
                    var creednzExternalId = result.getValue({
                        name: "custrecord_vendor_externalid",
                        label: "Creednz Evaluation ID"
                    });
                    var creednzVendorRiskStatus = result.getValue({
                        name: "custrecord_vendor_risk_status",
                        label: "Creednz Evaluation ID"
                    });
                    log.debug("details", vendorId + "," + vendorName + "," + vendorEmail + "," + vendorPrimaryContact + "," + vendorRiskStatus + "," + vendorAssessmentStatus + "," + creednzExternalId);

                    results.push({
                        'vendorId': vendorId,
                        'vendorName': vendorName,
                        'vendorPrimaryContact': vendorPrimaryContact,
                        'vendorEmail': vendorEmail,
                        'vendorRiskStatus': vendorRiskStatus,
                        'vendorAssessmentStatus': vendorAssessmentStatus,
                        'creednzEvaluationId': creednzEvaluationId,
                        'creednzExternalId': creednzExternalId,
                        'creednzVendorRiskStatus': creednzVendorRiskStatus


                    });
                });
                return results;
            } catch (er) {
                log.debug('Error on fetchSearchResult', JSON.stringify(er));
            }
        } //end fetch search
        return {
            onRequest: onRequest
        };
    });