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

            // create recordVE for newRecord
            const recordVE = scriptContext.newRecord;

            let vendorArray = [];

            let vendorObj = creednz_api_lib.buildAnalyzeVendorDtoFromRecord(recordVE);
            vendorArray.push(vendorObj);

            let dataObj = {};
            dataObj.analyzeVendorDtos = vendorArray;

            let creedNzTransactionsParse = creednz_api_lib.postCreednzAnalyzeVendor(dataObj);

            if (creedNzTransactionsParse.length > 0) {

                let creednzExternalId = creedNzTransactionsParse[0].vendorExternalId;

                recordVE.setValue({
                    fieldId: 'custentity_vendor_external_id',
                    value: creednzExternalId
                });

                recordVE.setValue({
                    fieldId: 'custentity_creednz_updated_on',
                    value: new Date()
                });

                const fields = [
                    'custentity_creednz_risk_status',
                    'custentity_creednz_bankacc_risk',
                    'custentity_creednz_operation_risk',
                    'custentity_creednz_sanction_risk',
                    'custentity_creednz_cyber_risk',
                    'custentity_creednz_bankacc_status'
                ];
                const value = 'Pending';

                fields.forEach(field => {
                    recordVE.setValue({
                        fieldId: field,
                        value: value
                    });
                });

            }
        }

        return {onAction};
    });
