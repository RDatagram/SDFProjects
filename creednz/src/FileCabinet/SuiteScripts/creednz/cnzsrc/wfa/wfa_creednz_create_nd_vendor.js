/**
 * @NApiVersion 2.1
 * @NScriptType WorkflowActionScript
 */
define(['N/ui/serverWidget', 'N/search', '../lib/creednz_api_lib'],
    /**
     * @param{serverWidget} serverWidget
     * @param search
     * @param creednz_api_lib
     */
    (serverWidget, search,creednz_api_lib) => {
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

            let newForm = scriptContext.form;

            let commentsField = newForm.getField({
                id: 'comments'
            });

            commentsField.defaultValue = 'Create Vendor in progress';

            let newRecord = scriptContext.newRecord;

            let evalRecordId = newRecord.getValue({
                fieldId: 'custentity_creednz_created_from_eval'
            });


            let evalData = search.lookupFields({
                type: 'customrecord_vendor_evaluation_table',
                id: evalRecordId,
                columns: ['custrecord_creednz_evaluation_id']
            })

            let creednzEvalId = evalData.custrecord_creednz_evaluation_id;

            let creedNzTransactions = creednz_api_lib.getCreednzVendorEvaluation_vendor(creednzEvalId);

            log.debug({
                title: 'creedNzTransactions',
                details: creedNzTransactions
            });

            newRecord.setValue({
                fieldId: 'taxidnum',
                value: creedNzTransactions.taxpayerID
            });

            return true;
        }

        return {onAction};
    });
