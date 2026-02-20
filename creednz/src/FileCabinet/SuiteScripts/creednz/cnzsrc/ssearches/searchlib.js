/**
 * @NApiVersion 2.1
 */
define(['N/search'],
    /**
     * @param search
     */
    (search) => {

        const customsearch_mr_get_ica_payments = () => {
            return search.load({
                id: 'customsearch_crdnz_get_pymt_for_send',
            })
        }
        const customsearch_mr_payment_check = () => {
            return search.load({
                id: 'customsearch_crdnz_get_pymt_for_check',
            })
        }
        const customsearch_ss_get_payments_for_creednz = () => {
            return search.create({
                type: "vendorpayment",
                filters:
                    [
                        ["type", "anyof", "VendPymt"],
                        "AND",
                        [["mainline", "is", "T"], "OR", ["linelastmodifieddate", "on", "today"]]
                    ],
                columns:
                    [
                        "internalid",
                        "datecreated",
                        "trandate",
                        "amount",
                        "type",
                        "entity",
                        search.createColumn({
                            name: "entityid",
                            join: "vendor"
                        }),
                        search.createColumn({
                            name: "internalid",
                            join: "vendor"
                        }),
                        "custbody_creednz_external_id",
                        "custbodycreednz_last_modified_date",
                        "custbody_creednz_payment_status",
                        "custbody_payer_bank_acc_number"
                    ]
            });
        }

        const customsearch_ss_get_vendor_status_frm_cr = () => {
            return search.create({
                type: "vendor",
                filters:
                    [
                        ["custentity_vendor_external_id", "isnotempty", ""],
                        "AND",
                        ["custentity_creednz_risk_status", "isnot", "Completed"]
                    ],
                columns:
                    [
                        "internalid",
                        "entityid",
                        "datecreated",
                        "custentity_vendor_external_id",
                        "custentity_creednz_risk_status"
                    ]
            });
        }

        const customsearch_ss_vendor_creednz_informa = () => {
            return search.create({
                type: "vendor",
                filters:
                    [
                        ["custentity_vendor_external_id", "isnotempty", ""]
                    ],
                columns:
                    [
                        "entityid",
                        "email",
                        "phone",
                        "altphone",
                        "internalid",
                        "custentity_vendor_external_id",
                        "custentity_creednz_risk_status",
                        "custentity_creednz_updated_on"
                    ]
            });
        }

        const customsearch_ss_vendor_evaluation_tabl_2 = () => {
            return search.create({
                type: "customrecord_vendor_evaluation_table",
                filters:
                    [
                        ["custrecord_creednz_evaluation_id", "is", "52"]
                    ],
                columns:
                    [
                        "internalid",
                        "custrecord_creednz_evaluation_id"
                    ]
            });
        }

        const customsearch_ss_vendor_eval_table_search = () => {
            return search.create({
                type: "customrecord_vendor_evaluation_table",
                filters:
                    [
                        ["custrecord_creednz_evaluation_id", "isnotempty", ""]
                    ],
                columns:
                    [
                        "custrecord_creednz_evaluation_id",
                        "custrecord_vendor_name",
                        "custrecord_primary_contact",
                        "custrecord_vendor_email",
                        "custrecord_risk_status",
                        "custrecord_assessment_status",
                        "internalid"
                    ]
            });
        }

        /**
         * GET Vendor Evaluation records for getting data and check RISK
         * custrecord_creednz_evaluation_id NOT EMPTY => already sent
         *
         * @returns {*}
         */
        const customsearch_ss_vendor_eval_table_check = () => {
            return search.create({
                type: "customrecord_vendor_evaluation_table",
                filters:
                    [
                        ["custrecord_creednz_evaluation_id", "isnotempty", ""],
                        "AND",
                        [["custrecord_vendor_externalid", "isempty", ""], "OR", ["custrecord_assessment_status", "isnot", "Completed"]]
                    ],
                columns:
                    [
                        "custrecord_creednz_evaluation_id",
                        "custrecord_vendor_name",
                        "custrecord_primary_contact",
                        "custrecord_vendor_email",
                        "custrecord_risk_status",
                        "custrecord_assessment_status",
                        "internalid"
                    ]
            });
        }

        const customsearch_ss_vendor_evaluation_table = () => {
            return search.create({
                type: "customrecord_vendor_evaluation_table",
                filters:
                    [],
                columns:
                    [
                        "id",
                        "custrecord_vendor_name",
                        "custrecord_vendor_email",
                        "custrecord_primary_contact",
                        "custrecord_risk_status",
                        "custrecord_assessment_status",
                        "internalid",
                        "custrecord_creednz_evaluation_id",
                        "custrecord_vendor_externalid",
                        "custrecord_vendor_risk_status"
                    ]
            });
        }

        const customsearch_ss_vendor_search_for_creed = () => {
            return search.create({
                type: "vendor",
                filters:
                    [],
                columns:
                    [
                        "internalid",
                        "comments",
                        "subsidiary",
                        "datecreated",
                        "lastmodifieddate",
                        "email",
                        "phone",
                        "taxidnum",
                        "address",
                        "billcountry",
                        "billcity",
                        "billzipcode",
                        "companyname",
                        "entityid",
                        "accountnumber",
                        "contact",
                        "custentity_creednz_risk_status",
                        "custentity_creednz_updated_on",
                        "custentity_vendor_external_id",
                        "custentity_vendor_payment_method_creeedn",
                        "custentity_bank_account_name_creednz",
                        "custentity_bank_address_creednz",
                        "custentity_bank_code_creednz",
                        "custentity_bank_number_creednz",
                        "custentity_bank_details_update_creednz",
                        "custentity_eft_bank_detailsupdate_creedn",
                        "custentity_eft_bill_payment_creednz",
                        "custentity_iban_creednz",
                        "custentity_swift_creednz",
                        "custentity_registraion_code_creednz",
                        "custentity_branch_number_creednz",
                        "custentity_branch_name_creednz",
                        "custentity_routing_number_creednz",
                        "custentity_bank_account_number_creednz",
                        "custentity_paypal_account_creednz",
                        "billaddress",
                        "billaddressee"
                    ]
            });
        }

        const customsearch_ss_get_creednz_external_id = () => {
            return search.create({
                type: "vendor",
                filters:
                    [
                        ["custentity_vendor_external_id", "isempty", ""]
                    ],
                columns:
                    [
                        "internalid",
                        "entityid"
                    ]
            });

        }
        const customsearch_ss_get_creednz_resend = () => {
            return search.create({
                type: "vendor",
                filters:
                    [
                        ["custentity_vendor_external_id", "isnotempty", ""]
                    ],
                columns:
                    [
                        "internalid",
                        "entityid"
                    ]
            });

        }

        const customsearch_ss_vendor_search_creed_paym = () => {
            return search.create({
                type: "vendor",
                filters:
                    [],
                columns:
                    [
                        "internalid",
                        "accountnumber"
                    ]
            });
        }

        const customsearch_ss_get_status_from_creednz = () => {
            return search.create({
                type: "vendor",
                filters:
                    [
                        ["custentity_vendor_external_id", "isnotempty", ""],
                        "AND",
                        [["custentity_creednz_risk_status", "isnot", "Validated"], "AND", ["custentity_creednz_risk_status", "isnot", "At Risk"]]
                    ],
                columns:
                    [
                        "internalid",
                        "custentity_vendor_external_id",
                        "entityid",
                        "custentity_creednz_risk_status"
                    ]
            });
        }

        const runSearch = (searchId, searchPageSize) => {
            try {
                //check sorting method
                let searchObj = search.load({
                    id: searchId
                });
                return searchObj.runPaged({
                    pageSize: searchPageSize
                });
            } catch (er) {
                log.debug('Error on runSearch', JSON.stringify(er));
            }
        } //end runsearch

        return {
            customsearch_ss_get_payments_for_creednz,
            customsearch_ss_get_vendor_status_frm_cr,
            customsearch_ss_vendor_creednz_informa,
            customsearch_ss_vendor_evaluation_tabl_2,
            customsearch_ss_vendor_eval_table_search,
            customsearch_ss_vendor_eval_table_check,
            customsearch_ss_vendor_evaluation_table,
            customsearch_ss_vendor_search_for_creed,
            customsearch_ss_get_creednz_external_id,
            customsearch_ss_get_creednz_resend,
            customsearch_ss_vendor_search_creed_paym,
            customsearch_ss_get_status_from_creednz,
            runSearch,
            customsearch_mr_get_ica_payments,
            customsearch_mr_payment_check,
        }

    });
