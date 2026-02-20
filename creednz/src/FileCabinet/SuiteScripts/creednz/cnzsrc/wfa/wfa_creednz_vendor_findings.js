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
            const vendorExternalId = recordVE.getValue({fieldId: 'custentity_vendor_external_id'});

            // get getCreednzVendorFindings result
            const creedNzTransactionsParse = creednz_api_lib.getCreednzVendorFindings(vendorExternalId);

            const creedNzTransactionsLength = creedNzTransactionsParse.length;
            log.debug({
                title: 'creedNzTransactionsParse',
                details: creedNzTransactionsParse,
            });

            const RISK_STATUS_TO_FIELD = {
                "bankRiskStatus": "custentity_creednz_bankacc_risk",
                "operationRiskStatus": "custentity_creednz_operation_risk",
                "sanctionRiskStatus": "custentity_creednz_sanction_risk",
                "cyberRiskStatus": "custentity_creednz_cyber_risk"
            };
            let riskObject = {
                bankRiskStatus: "No Risk",
                operationRiskStatus: "No Risk",
                sanctionRiskStatus: "No Risk",
                cyberRiskStatus: "No Risk"
            }
            if (creedNzTransactionsLength > 0) {
                riskObject = creednz_api_lib.checkRiskFromFindings(creedNzTransactionsParse);
                log.debug({
                    title: 'RiskObject',
                    details: riskObject
                })

            }
            Object.keys(riskObject).forEach(function (key) {
                log.debug( key + ' into Field : ' + RISK_STATUS_TO_FIELD[key] + ' with Value' + riskObject[key]);

                if (riskObject[key] && RISK_STATUS_TO_FIELD[key]) {
                    recordVE.setValue({
                        fieldId: RISK_STATUS_TO_FIELD[key],
                        value: riskObject[key]
                    });
                }

            });
            return creedNzTransactionsLength;
        }

        return {onAction};
    });
