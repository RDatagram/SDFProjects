/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 * @NModuleScope Public
 * @author Zoran@UCGP
 * Script brief description:
 Scheduled Script is used for following tasks:
 1. update vendor external id in custom record

 */
var executionCount;

define(['N/https', 'N/log', 'N/record', 'N/encode', 'N/format', 'N/search', 'N/email', 'N/runtime', 'N/task', './ssearches/searchlib','./lib/creednz_token_lib', './lib/creednz_api_lib'],
    (https, log, record, encode, format, search, email, runtime, task, searchlib, creednz_token_lib,creednz_api_lib) => {
        function execute(context) {

            /* TODO:
                make the same function for scheduled and non-scheduled script
                get status before retrieving data (IF Completed)
                empty response ignore to avoid JSON parser error
             */
            log.audit({
                title: 'Scheduled ss_get_vendor_external_id_on_script.js',
                details: 'Script started'
            });

            try {
                let startTime = new Date().getTime();

                let vendorEvalTableSearch = searchlib.customsearch_ss_vendor_eval_table_search();
                let currentUrlToken = creednz_token_lib.checkAccessToken();

                vendorEvalTableSearch.run().each(function (result) {

                    let creednzVendorEvaluationId = result.getValue({
                        name: 'custrecord_creednz_evaluation_id'
                    });
                    let VendorEvaluationInternalId = result.getValue({
                        name: 'internalid'
                    });

                    log.debug("creednzVendorEvaluationId and internalid", creednzVendorEvaluationId + "," + VendorEvaluationInternalId);

                    let creedNzStatusTransactionsParse = creednz_api_lib.getCreednzVendorEvaluation_vendor(creednzVendorEvaluationId);
                    log.debug("creedNzStatusTransactionsParse", creedNzStatusTransactionsParse);
                    const vendorExternalId = creedNzStatusTransactionsParse.externalId;
                    log.debug(creedNzStatusTransactionsParse.externalId);

                    //set status in custom field in vendor record
                    const recId = record.submitFields({
                        type: "customrecord_vendor_evaluation_table",
                        id: VendorEvaluationInternalId,
                        values: {
                            "custrecord_vendor_externalid": vendorExternalId,
                        },
                        options: {
                            enableSourcing: false,
                            ignoreMandatoryFields: true
                        }
                    });
                    log.debug("record updated", recId);


                    // Reschedule the task
                    let endTime = new Date().getTime();
                    let timeElapsed = (endTime * 0.001) - (startTime * 0.001);
                    let scriptObj = runtime.getCurrentScript();
                    let remainingUsage = scriptObj.getRemainingUsage();
                    if (remainingUsage < 1000 || timeElapsed > 3300) // time more than 55 min
                    {
                        log.debug("Usage Exceeded Resubmitting remainingUsage", remainingUsage);

                        let scheduledScriptTask = task.create({
                            taskType: task.TaskType.SCHEDULED_SCRIPT,
                            scriptId: runtime.getCurrentScript().id,
                            deploymentId: runtime.getCurrentScript().deploymentId
                        });

                        log.debug("ssTask" + scheduledScriptTask);
                        scheduledScriptTask.submit();

                    } else {
                        return true;
                    }

                });


            } catch (err) {
                log.debug("error", err);
            }
        }



        return {
            execute: execute
        };
    });