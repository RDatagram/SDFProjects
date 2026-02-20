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

            // get the record
            const recordVE = scriptContext.newRecord;

            // get email and store in emailParam

            let emailParam = recordVE.getValue({
                fieldId: 'custrecord_vendor_email'
            });

            // get primaryContact and store in primaryContactParam
            let primaryContactParam = recordVE.getValue({
                fieldId: 'custrecord_primary_contact'
            });

            // get vendorName and store in vendorNameParam
            let vendorNameParam = recordVE.getValue({
                fieldId: 'custrecord_vendor_name'
            });


            const dataObj = {
                "email": emailParam,
                "primaryContact": primaryContactParam,
                "vendorName": vendorNameParam
            };

            let creedNzTransactions = creednz_api_lib.postCreednzInviteVendor(dataObj);

            let creednzEvaluationId = creedNzTransactions.id;


            if (creednzEvaluationId) {
                recordVE.setValue({
                    fieldId: 'custrecord_creednz_evaluation_id',
                    value: creednzEvaluationId
                });
                //set risk assessment status as invite sent as default
                recordVE.setValue({
                    fieldId: 'custrecord_assessment_status',
                    value: 'Invite Sent'
                });

                return creednzEvaluationId;
            } else {
                throw new Error('Failed to post Creednz invite vendor');
            }

        }

        return {onAction};
    });
