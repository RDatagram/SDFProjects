/**
 * @NApiVersion 2.1
 * @NScriptType WorkflowActionScript
 */
define(['../lib/creednz_payment_lib'],
    /**
     * @param creednz_payment_lib
     */
    (creednz_payment_lib) => {

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

            const paymentRecord = scriptContext.newRecord;

            let dataObj;

            try {
                dataObj = creednz_payment_lib.getDataFromXML(paymentRecord);
                if (dataObj) {
                    // Perform actions based on dataObj
                    creednz_payment_lib.updateCreednz(paymentRecord,dataObj);
                }
            } catch (error) {
                log.error({
                    title: 'Error in getDataFromXML',
                    details: error.message
                });
            }



        }

        return {onAction};
    });
