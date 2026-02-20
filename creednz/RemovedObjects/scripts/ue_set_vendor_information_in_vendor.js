/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope Public
 * @author Zoran@UCGP
 * Script brief description:
 UserEventScript Script is used for following tasks:
 1. set Creednz sub tab in vendor record
 */
define(['N/runtime', 'N/log', 'N/record', 'N/error', 'N/render', 'N/file', 'N/https', 'N/search', 'N/format', 'N/ui/serverWidget', './lib/creednz_api_lib'],
    (runtime, log, record, error, render, file, https, search, format, serverWidget, creednz_api_lib) => {


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
                id: 'custpage_description',
                type: serverWidget.FieldType.TEXT,
                label: 'Description'
            });
            creednzSublist.addField({
                id: 'custpage_category',
                type: serverWidget.FieldType.TEXT,
                label: 'Category'
            });

            return creednzSublist;

        }
        function beforeLoad(context) {
            try {
                let form = context.form;

                let vendorRecord = context.newRecord;
                const creednzId = vendorRecord.getValue({
                    fieldId: 'custentity_vendor_external_id'
                });

                let creednzSublist = makeFormSublist(form);

                // let creedNzTransactionsParse = JSON.parse(creedNzTransactions);
                let status = creednz_api_lib.getCreednzVendorStatus(creednzId);
                log.debug("status before finding", status || {});

                let creedNzTransactionsParse = creednz_api_lib.getCreednzVendorFindings(creednzId);
                const creedNzTransactionsLength = creedNzTransactionsParse.length;
                //set data in the sublist
                if (creedNzTransactionsLength > 0) {
                    for (let i = 0; i < creedNzTransactionsLength; i++) {

                        let vendorFindingsId = creedNzTransactionsParse[i].id;
                        log.debug("vendor findings id", vendorFindingsId);
                        let vendorFindingsType = creedNzTransactionsParse[i].type;
                        log.debug("vendor findings type", vendorFindingsType);
                        let vendorFindingsTitle = creedNzTransactionsParse[i].title;
                        log.debug("vendor findings title", vendorFindingsTitle);
                        let vendorFindingsCategory = creedNzTransactionsParse[i].category;
                        log.debug("vendorFindingsCategory", vendorFindingsCategory);
                        let vendorFindingsDescription = creedNzTransactionsParse[i].description;
                        log.debug("vendorFindingsDescription", vendorFindingsDescription);

                        creednzSublist.setSublistValue({
                            id: 'custpage_id',
                            line: i,
                            value: vendorFindingsId
                        });
                        creednzSublist.setSublistValue({
                            id: 'custpage_type',
                            line: i,
                            value: vendorFindingsType
                        });
                        creednzSublist.setSublistValue({
                            id: 'custpage_title',
                            line: i,
                            value: vendorFindingsTitle
                        });
                        creednzSublist.setSublistValue({
                            id: 'custpage_description',
                            line: i,
                            value: vendorFindingsCategory
                        });
                        creednzSublist.setSublistValue({
                            id: 'custpage_category',
                            line: i,
                            value: vendorFindingsDescription
                        });

                    }
                }//end if


            } catch (err) {
                log.error("error", err.message);
            }
        }

        return {
            beforeLoad: beforeLoad
        };
    });