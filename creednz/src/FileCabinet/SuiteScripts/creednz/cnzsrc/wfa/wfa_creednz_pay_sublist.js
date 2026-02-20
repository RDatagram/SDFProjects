/**
 * @NApiVersion 2.1
 * @NScriptType WorkflowActionScript
 */
define(['N/ui/serverWidget', '../lib/creednz_api_lib'],

    (serverWidget, creednz_api_lib) => {


        const makeFormSublist = (form) => {
            let creednzSubtabId = 'custpage_creednz_subtab';
            form.addTab({
                id: creednzSubtabId,
                label: 'Creednz Information'
            });
            // Create a sublist under the Creednz subtab
            let creednzSublist = form.addSublist({
                id: 'custpage_creednz_sublist',
                type: serverWidget.SublistType.LIST,
                label: 'Creednz Information',
                tab: creednzSubtabId
            });
            // Add fields to the sublist
            creednzSublist.addField({
                id: 'custpage_id',
                type: serverWidget.FieldType.TEXT,
                label: 'ID'
            });
            creednzSublist.addField({
                id: 'custpage_type',
                type: serverWidget.FieldType.TEXT,
                label: 'Type'
            });
            creednzSublist.addField({
                id: 'custpage_title',
                type: serverWidget.FieldType.TEXT,
                label: 'Title'
            });
            creednzSublist.addField({
                id: 'custpage_category',
                type: serverWidget.FieldType.TEXT,
                label: 'Category'
            });
            creednzSublist.addField({
                id: 'custpage_description',
                type: serverWidget.FieldType.TEXT,
                label: 'Description'
            });
            creednzSublist.addField({
                id: 'custpage_remediation',
                type: serverWidget.FieldType.TEXT,
                label: 'Remediation'
            });



            return creednzSublist;

        }
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
            let paymentRecord = scriptContext.newRecord;
            let form = scriptContext.form;
            let creednzSublist = makeFormSublist(form);

            // get custrecord_vendor_externalid
            const paymentExternalID = paymentRecord.getValue({fieldId: 'custbody_creednz_external_id'});

            const creedNzTransactionsParse = creednz_api_lib.getCreednzPaymentFindings(paymentExternalID);

            const creedNzTransactionsLength = creedNzTransactionsParse.length;
            log.debug({
                title: 'creedNzTransactionsParse',
                details: creedNzTransactionsParse,
            });
            if (creedNzTransactionsLength > 0) {
                for (let i = 0; i < creedNzTransactionsLength; i++) {

                    let paymentFindingsId = creedNzTransactionsParse[i].id;
                    let paymentFindingsType = creedNzTransactionsParse[i].type;
                    let paymentFindingsTitle = creedNzTransactionsParse[i].title;
                    let paymentFindingsCategory = creedNzTransactionsParse[i].category;
                    let paymentFindingsDescription = creedNzTransactionsParse[i].description;
                    let paymentFindingsRemediation = creedNzTransactionsParse[i].remediation;

                    creednzSublist.setSublistValue({
                        id: 'custpage_id',
                        line: i,
                        value: paymentFindingsId
                    });
                    creednzSublist.setSublistValue({
                        id: 'custpage_type',
                        line: i,
                        value: paymentFindingsType
                    });
                    creednzSublist.setSublistValue({
                        id: 'custpage_title',
                        line: i,
                        value: paymentFindingsTitle
                    });
                    creednzSublist.setSublistValue({
                        id: 'custpage_description',
                        line: i,
                        value: paymentFindingsDescription.substring(0,299)
                    });
                    creednzSublist.setSublistValue({
                        id: 'custpage_category',
                        line: i,
                        value: creednz_api_lib.regexCategory(paymentFindingsCategory)
                    });
                    creednzSublist.setSublistValue({
                        id: 'custpage_remediation',
                        line: i,
                        value: paymentFindingsRemediation.substring(0,200)
                    });
                }
                creednzSublist.setSublistValue({
                    id: 'custpage_id',
                    line: creedNzTransactionsLength,
                    value: 'END'
                });
            }
        }

        return {onAction};
    });
