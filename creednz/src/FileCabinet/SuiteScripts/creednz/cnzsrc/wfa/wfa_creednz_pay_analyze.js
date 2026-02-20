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
            const recordPayment = scriptContext.newRecord;

            let paymentArray = [];

            let paymentObj = creednz_api_lib.buildAnalyzePaymentDtoFromTransaction(recordPayment);
            paymentArray.push(paymentObj);

            let dataObj = {};
            dataObj.analyzePaymentDtos = paymentArray;

            let creedNzTransactionsParse = creednz_api_lib.postCreednzAnalyzePayment(dataObj);

            if (creedNzTransactionsParse.length > 0) {

                let creednzExternalId = creedNzTransactionsParse[0].paymentExternalId;

                recordPayment.setValue({
                    fieldId: 'custbody_creednz_external_id',
                    value: creednzExternalId
                });

                const fields = [
                    'custbody_creednz_payment_status'
                ];

                const defaultValue = 'Pending';

                fields.forEach(field => {
                    recordPayment.setValue({
                        fieldId: field,
                        value: defaultValue
                    });
                });

            }
        }

        return {onAction};
    });
