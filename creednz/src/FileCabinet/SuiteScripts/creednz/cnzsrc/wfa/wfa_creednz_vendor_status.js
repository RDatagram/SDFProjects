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


            let creednzExternalId = scriptContext.newRecord.getValue({
                fieldId: 'custentity_vendor_external_id'
            });

            // let creedNzStatusResponse = creednz_api_lib.creed
            let creedNzStatusTransactionsParse = creednz_api_lib.getCreednzVendorStatus(creednzExternalId);

            log.debug("creedNzStatusResponse", creedNzStatusTransactionsParse);

            let creednzRiskStatus = creedNzStatusTransactionsParse.status;

            if (creednzRiskStatus) {

                log.debug({
                    title:'creednzRiskStatus',
                    details: 'Updating with ' + creednzRiskStatus
                });

                scriptContext.newRecord.setValue({
                    fieldId: 'custentity_creednz_risk_status',
                    value: creednz_api_lib.regexRiskStatus(creednzRiskStatus)
                });
                scriptContext.newRecord.setValue({
                    fieldId: 'custentity_creednz_updated_on',
                    value: new Date()
                });

                let creednzBankAccountStatus = creednz_api_lib.getCreednzVendorBankStatus(creednzExternalId);

                if (creednzBankAccountStatus) {
                    log.debug({
                        title:'creednzBankAccountStatus',
                        details: 'Responsed with ' + creednzBankAccountStatus
                    });
                    //bankAccountVerified
                    const bankAccountVerified = creednzBankAccountStatus.bankAccountVerified;

                    if (bankAccountVerified) {
                        scriptContext.newRecord.setValue({
                            fieldId: 'custentity_creednz_bankacc_status',
                            value: 'Verified'
                        });
                    } else {
                        scriptContext.newRecord.setValue({
                            fieldId: 'custentity_creednz_bankacc_status',
                            value: 'Unverified'
                        });
                    }
                }

            }
        }

        return {onAction};
    });
