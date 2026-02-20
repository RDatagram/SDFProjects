/**
 * @NApiVersion 2.1
 * @NScriptType WorkflowActionScript
 */
define(['../lib/creednz_api_lib'],

    (creednz_api_lib) => {
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
            const recordVE = scriptContext.newRecord;

            let evalID = recordVE.getValue({
                fieldId: 'custrecord_creednz_evaluation_id'
            });


            // getCreednzVendorEvaluation_status
            let creedNzTransactions = creednz_api_lib.postCreednzVendorEvaluation_send_results(evalID);

            let creednzEvaluationId = creedNzTransactions.id;

            if (creednzEvaluationId) {

                // update custrecord_creednz_evaluation_id
                recordVE.setValue({
                    fieldId: 'custrecord_creednz_evaluation_id',
                    value: creednzEvaluationId
                });
                //set risk assessment status as invite sent as default
                recordVE.setValue({
                    fieldId: 'custrecord_risk_status',
                    value: ''
                });
                recordVE.setValue({
                    fieldId: 'custrecord_assessment_status',
                    value: 'Invite Sent'
                });
                recordVE.setValue({
                    fieldId: 'custrecord_vendor_externalid',
                    value: ''
                });


                return creednzEvaluationId;
            } else {
                throw new Error('Failed to post Creednz invite vendor');
            }

        }

        return {onAction};
    });
