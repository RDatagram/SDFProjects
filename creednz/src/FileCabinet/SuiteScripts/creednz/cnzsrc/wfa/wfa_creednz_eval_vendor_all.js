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
            let creedNzTransactions = creednz_api_lib.getCreednzVendorEvaluation_all();

            log.debug({
                title: 'creedNzTransactions.length',
                detail: creedNzTransactions.length
            })

            let isFound = false;
            // iterate through creedNzTransactions array
            creedNzTransactions.forEach(transaction => {
                // do something with each transaction
                let evalIDArray = transaction.id;
                log.debug('Type of' + typeof evalIDArray)
                if (evalIDArray == evalID) {
                    log.debug('Found ' + evalID);
                    isFound = true;
                    recordVE.setValue({
                        fieldId:'custrecord_risk_status',
                        value: creednz_api_lib.regexRiskStatus(transaction.riskStatus)
                    });
                    recordVE.setValue({
                        fieldId:'custrecord_assessment_status',
                        value: transaction.riskAssessmentStatus
                    })
                }
            });

            return isFound;

        }

        return {onAction};
    });
