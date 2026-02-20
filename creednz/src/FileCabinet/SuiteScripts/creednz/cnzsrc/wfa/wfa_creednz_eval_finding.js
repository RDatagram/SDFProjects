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

            // create recordVE from newRecord
            const recordVE = scriptContext.newRecord;

            // get custrecord_vendor_externalid
            const vendorExternalId = recordVE.getValue({fieldId: 'custrecord_vendor_externalid'});

            // get getCreednzVendorFindings result
            const creedNzTransactionsParse = creednz_api_lib.getCreednzVendorFindings(vendorExternalId);

            const creedNzTransactionsLength = creedNzTransactionsParse.length;
            log.debug({
                title: 'creedNzTransactionsLength',
                details: creedNzTransactionsLength,
            });
            if (creedNzTransactionsLength > 0) {
                let riskObject = creednz_api_lib.checkRiskFromFindings(creedNzTransactionsParse);
                log.debug({
                    title: 'RiskObject',
                    details: riskObject
                })
                const RISK_STATUS_TO_FIELD = {
                    "riskFlag":"custrecord_vendor_risk_status",
                    "bankRiskStatus": "custrecord_creednz_bankacc_risk",
                    "operationRiskStatus": "custrecord_creednz_operation_risk",
                    "sanctionRiskStatus": "custrecord_creednz_sanction_risk",
                    "cyberRiskStatus": "custrecord_creednz_cyber_risk"
                };

                Object.keys(riskObject).forEach(function (key) {
                    log.debug( key + ' into Field : ' + RISK_STATUS_TO_FIELD[key] + ' with Value' + riskObject[key]);

                    if (riskObject[key]) {
                        recordVE.setValue({
                            fieldId: RISK_STATUS_TO_FIELD[key],
                            value: riskObject[key]
                        });
                    }

                });
            }
            return creedNzTransactionsLength;
        }

        return {onAction};
    });
