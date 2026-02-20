/**
 * @NApiVersion 2.1
 * @NScriptType WorkflowActionScript
 */
define(['N/task'],
    /**
 * @param task
 */
    (task) => {
        /**
         * Defines the WorkflowAction script trigger point.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.workflowId - Internal ID of workflow which triggered this action
         * @param {string} scriptContext.type - Event type
         * @param {Form} scriptContext.form - Current form that the script uses to interact with the record
         * @since 2016.1
         */
        const onAction = (scriptContext) => {
            let mrTask = task.create({
                taskType: task.TaskType.MAP_REDUCE,
                scriptId: 'customscript_mr_creednz_vendor_delta',
                deploymentId: 'customdeploy_mr_creednz_vendor_delta',
                params: {}
            });
            mrTask.submit();

            log.debug({
                title: 'MR Task Id',
                details: mrTask
            });

            return mrTask;
        }

        return {onAction};
    });
