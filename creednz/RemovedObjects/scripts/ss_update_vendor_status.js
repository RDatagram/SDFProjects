/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 * @NModuleScope Public
 * @author Zoran@UCGP
 * Script brief description:
 Scheduled Script is used for following tasks:
 1.Schedule script to update vendor status

 REVISION
 19.09 > using library
 */

define(['N/https', 'N/log', 'N/record', 'N/encode', 'N/format', 'N/search', 'N/email', 'N/runtime', 'N/task', './ssearches/searchlib', './lib/creednz_token_lib', './lib/creednz_api_lib']
    , (https, log, record, encode, format, search, email, runtime, task, searchlib, creednz_token_lib, creednz_api_lib) => {
        function execute(context) {

            log.audit({
                title: 'Scheduled script UPDATE VENDOR STATUS',
                details: 'Function execution started successfully.'
            })
            try {
                let startTime = new Date().getTime();
                let scriptObj = runtime.getCurrentScript();

                const vendorSearch = searchlib.customsearch_ss_get_status_from_creednz();

                vendorSearch.run().each(function (result) {
                    let vendorInternalId = result.getValue({
                        name: 'internalid'
                    });
                    let creednzExternalId = result.getValue({
                        name: 'custentity_vendor_external_id'
                    });

                    // let creedNzStatusResponse = creednz_api_lib.creed
                    let creedNzStatusTransactionsParse = creednz_api_lib.getCreednzVendorStatus(creednzExternalId);

                    log.debug("creedNzStatusResponse", creedNzStatusTransactionsParse);

                    let creednzRiskStatus = creedNzStatusTransactionsParse.status;

                    //set status in custom field in vendor record
                    const recId = record.submitFields({
                        type: record.Type.VENDOR,
                        id: vendorInternalId,
                        values: {
                            custentity_creednz_risk_status: creednzRiskStatus,
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

                    let remainingUsage = scriptObj.getRemainingUsage();
                    if (remainingUsage < 1000 || timeElapsed > 3300) // time more than 55 min
                    {
                        log.debug("Usage Exceeded Resubmitting remainingUsage", remainingUsage);

                        const scheduledScriptTask = task.create({
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