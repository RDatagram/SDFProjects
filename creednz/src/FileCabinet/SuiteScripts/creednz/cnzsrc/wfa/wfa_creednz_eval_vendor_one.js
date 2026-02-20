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

            log.debug('Type of' + typeof evalID)

            // getCreednzVendorEvaluation_status
            let creedNzTransactions = creednz_api_lib.getCreednzVendorEvaluation_one(evalID);

            log.debug({
                title: 'creedNzTransactions',
                details: creedNzTransactions
            });

            if (creedNzTransactions.status === 'Completed') {
                // everything is ready for setting values


                let vendorDto = creedNzTransactions.vendorDto;

                recordVE.setValue({
                    fieldId: 'custrecord_assessment_status',
                    value: 'Completed'
                });

                let riskStatus = vendorDto.atRisk ? 'At Risk' : 'Validated';

                recordVE.setValue({
                    fieldId: 'custrecord_risk_status',
                    value: riskStatus
                });
                recordVE.setValue({
                    fieldId: 'custrecord_vendor_app_id',
                    value: vendorDto.id
                });
                recordVE.setValue({
                    fieldId: 'custrecord_vendor_app_url',
                    value: creednz_api_lib.buildVendprAppURL(vendorDto.id)
                });
            }
        }

        return {onAction};
    });
