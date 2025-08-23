/**
 * @NApiVersion 2.0
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 */
define(['N/task', 'N/record'],

    function (task, record) {

        function doPost(requestBody) {

            var resultObj = {};
            var idHeader = requestBody.idHeader;
            var mrTaskId;

            if (requestBody.action === 'parser') {

                var mrTask = task.create({
                    taskType: task.TaskType.MAP_REDUCE,
                    params: {"custscript_rsm_ccard_mr_param1": idHeader}
                });
                mrTask.scriptId = 'customscript_rsm_ccard_parser_mr';

                mrTaskId = mrTask.submit();

                record.submitFields({
                    type: 'customrecord_rsm_crdh',
                    id: idHeader,
                    values: {'custrecord_rsm_crdh_parser_mr': mrTaskId}
                });

                resultObj = {
                    "mrTaskId": mrTaskId
                };
            }

            if (requestBody.action === 'lookup') {

                var mrTaskLookup = task.create({
                    taskType: task.TaskType.MAP_REDUCE,
                    params: {"custscript_rsm_crdh_lookup_mr_param": idHeader}
                });
                mrTaskLookup.scriptId = 'customscript_rsm_ccard_lookup_mr';
                //mrTask.deploymentId = 'customdeploy_rsm_bstmt_lookup_mr';
                mrTaskId = mrTaskLookup.submit();


                record.submitFields({
                    type: 'customrecord_rsm_crdh',
                    id: idHeader,
                    values: {'custrecord_rsm_crdh_parser_mr': mrTaskId}
                });


                resultObj = {
                    "mrTaskId": mrTaskId
                };
            }


            if (requestBody.action === 'payments') {

                log.debug({title: "idHeader", details: idHeader});
                var mrTaskPayment = task.create({
                    taskType: task.TaskType.MAP_REDUCE,
                    params: {"custscript_rsm_ccard_payment_mr_id": idHeader}
                });
                mrTaskPayment.scriptId = 'customscript_rsm_ccard_payment_mr';
                mrTaskId = mrTaskPayment.submit();


                record.submitFields({
                    type: 'customrecord_rsm_crdh',
                    id: idHeader,
                    values: {'custrecord_rsm_crdh_payment_mr': mrTaskId}
                });


                resultObj = {
                    "mrTaskId": mrTaskId
                };
            }

            if (requestBody.action === 'rollback') {
                var mrTaskRollback = task.create({
                    taskType: task.TaskType.MAP_REDUCE,
                    params: {"custscript_rsm_crdh_rollback_mr_param": idHeader}
                });
                mrTaskRollback.scriptId = 'customscript_rsm_ccard_rollback_mr';

                mrTaskId = mrTaskRollback.submit();

                record.submitFields({
                    type: 'customrecord_rsm_crdh',
                    id: idHeader,
                    values: {'custrecord_rsm_crdh_payment_mr': mrTaskId}
                });

                resultObj = {
                    "mrTaskId": mrTaskId
                };
            }
            return resultObj;

        }

        return {
            post: doPost
        };

    });
