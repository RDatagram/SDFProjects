/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 * 
 * Email Scheduler
 * Take parameters send from the suitelet page content script and call the required deployment of the Email Scheduler Map/Reduce script
 */
define(['N/task'], function (task) {

    function post(requestBody) {

        if (requestBody.action === 'runscript') {

            var deploymentId = '';
            if (requestBody.transactionType == "Invoice") {
                deploymentId = "customdeploy_rsm_email_schedule_invoice";
            } else if (requestBody.transactionType == "Customer Deposit") {
                deploymentId = "customdeploy_rsm_email_schedule_cd";
            } else if (requestBody.transactionType == "Credit Memo") {
                deploymentId = "customdeploy_rsm_email_schedule_cm";
            } else if (requestBody.transactionType == "Sales Order") {
                deploymentId = "customdeploy_rsm_email_schedule_so";
            } else if (requestBody.transactionType == "Sales Order Estimate") {
                deploymentId = "customdeploy_rsm_email_schedule_soe";
            }
            var script = {
                scriptId: 'customscript_rsm_email_schedule_mr',
                deploymentId: deploymentId
            }

            var mrTask = task.create({
                taskType: task.TaskType.MAP_REDUCE
            });
            mrTask.scriptId = script.scriptId;
            mrTask.deploymentId = script.deploymentId;
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
            };

        }
    }

    return {
        post: post
    };

});
