/**
 * @NApiVersion 2.1
 * @NScriptType WorkflowActionScript
 */
define(['N/record', '../lib/creednz_dao_lib'],
    /**
     * @param record
     * @param creednz_dao_lib
     */
    (record, creednz_dao_lib) => {


        const creednzMap = (vendorData) => {

            let retval = {
                "custentity_paymentmethod": "",
                "custentity_paymentformat": "",
                "custentity_recbankprimidtype": "",
                "custentity_recpartyaccount": "",
                "custentity_recbankprimid": "",
                "custentity_vendorbranchbankircid": ""

            }
            const paymentMethod = vendorData.vendorPaymentMethod;
            const billingCountry = vendorData.billingCountry;
            const bank_account_number = vendorData.bankAccountNumber;
            const iban = vendorData.iban;
            const routing_number = vendorData.routingNumber;
            const swift = vendorData.swift;
            const usWireInternationalData = vendorData.usWireInternationalData

            if (paymentMethod === "ACH" || paymentMethod === "Wire") {
                if (billingCountry === "United States") {
                    if ((bank_account_number != null) && (bank_account_number !== "") && (routing_number != null) && (routing_number !== "")) {
                        retval.custentity_paymentmethod = "DAC";
                        retval.custentity_paymentformat = "CTX";
                        retval.custentity_recbankprimidtype = "ABA";
                        retval.custentity_recpartyaccount = bank_account_number;
                        retval.custentity_recbankprimid = routing_number;
                    } else if ((bank_account_number != null) && (bank_account_number !== "") && (swift != null) && (swift !== "")) {
                        retval.custentity_paymentmethod = "MTS"
                        retval.custentity_recbankprimidtype = "SWT"
                        retval.custentity_recpartyaccount = bank_account_number;
                        retval.custentity_recbankprimid = swift;
                    }
                } else if (billingCountry !== "United States") {
                    retval.custentity_paymentmethod = "MTS"
                    retval.custentity_paymentformat = "Wire"
                    retval.custentity_vendorbranchbankircid = usWireInternationalData;
                    retval.custentity_recbankprimidtype = "SWT"
                    retval.custentity_recpartyaccount = bank_account_number || iban;
                    retval.custentity_recbankprimid = swift;
                }
            }

            return retval;
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

            const evalRecord = scriptContext.newRecord;

            const linkedVendor = evalRecord.getValue('custrecord_vendor_internalid');
            const vendorJSONString = evalRecord.getValue('custrecord_vendor_json');

            if (vendorJSONString) {

                const vendorData = JSON.parse(vendorJSONString);

                // DEBUG TEST VALUES
                /*
                vendorData.url = vendorData.url || 'https://www.rdata.com';
                vendorData.creditLimit = vendorData.creditLimit || 1234;
                vendorData.taxpayerID = vendorData.taxpayerID || '267-941-109';

                vendorData.vendorPaymentMethod = 'MTS';
                vendorData.bankAccountNumber = '4001608';
                vendorData.bankAccountType = "SWT";

                vendorData.usWireInternationalData = '000300752'
                vendorData.swift = vendorData.swift || 'ROYCCAT2';
                */
                // TESTED : vendorData.reportingTax109 = true;

                // DEFAULT VALUES, NOT FOR DEBUG
                vendorData.reportingTax109 = vendorData.reportingTax109 || false; // null=>false

                const vendorRecord = record.load(
                    {
                        type: record.Type.VENDOR,
                        id: linkedVendor,
                        isDynamic: true
                    }
                );

                const updateField = (jsonField, netsuiteField) => {

                    const value = vendorData[jsonField] || '';

                    if (value) {
                        vendorRecord.setValue({
                            fieldId: netsuiteField,
                            value: value
                        });
                    }
                }
                const updateListField = (idValue, netsuiteField) => {

                    if (idValue > 0) {
                        vendorRecord.setValue({
                            fieldId: netsuiteField,
                            value: idValue
                        });
                    }

                }
                const updateBooleanField = (jsonField, netsuiteField) => {

                    vendorRecord.setValue({
                        fieldId: netsuiteField,
                        value: vendorData[jsonField]
                    });

                }

                updateField('name', 'companyname');
                updateField('name', 'custentity_vendorname');
                updateField('purchaseEmail', 'email');
                updateField('url', 'url');
                updateField('paymentRemittanceEmail', 'custentity_payee_email');
                updateField('creditLimit', 'creditlimit');
                updateField('taxpayerID', 'taxidnum');
                updateBooleanField('reportingTax109', 'is1099eligible');


                if (vendorData.vendorPaymentMethod === "ACH" || vendorData.vendorPaymentMethod === "Wire")
                {

                    const findVendPymtMeth = creednz_dao_lib.genQuery('customlist_vendpymtmeth', 'name', 'iCA', 'id');
                    if (findVendPymtMeth.found) {
                        updateListField(findVendPymtMeth.idRecord, 'custentity_vendorpaymeth'); // WARNING HARD CODED - REQUESTED BY YANIV DESPITE A WARNING
                    }

                    let netsuiteFields = creednzMap(vendorData);

                    if (netsuiteFields.custentity_paymentmethod){
                        // list customlist_payment_method

                        const lookUpData = creednz_dao_lib.genQuery('customlist_payment_method', 'name', netsuiteFields.custentity_paymentmethod, 'id');
                        if (lookUpData.found) {
                            updateListField(lookUpData.idRecord, 'custentity_paymentmethod');
                        }
                    }

                    if (netsuiteFields.custentity_paymentformat){
                        // list customlist_paymentformatlist

                        const lookUpData = creednz_dao_lib.genQuery('customlist_paymentformatlist', 'name', netsuiteFields.custentity_paymentformat, 'id');
                        if (lookUpData.found) {
                            updateListField(lookUpData.idRecord, 'custentity_paymentformat');
                        }
                    }

                    if (netsuiteFields.custentity_recbankprimidtype){

                        const lookUpData = creednz_dao_lib.genQuery('customlist_recbankidtype', 'name', netsuiteFields.custentity_recbankprimidtype, 'id');
                        if (lookUpData.found) {
                            updateListField(lookUpData.idRecord, 'custentity_recbankprimidtype');
                        }
                    }
                    if (netsuiteFields.custentity_recpartyaccount){
                        vendorRecord.setValue({
                            fieldId: "custentity_recpartyaccount",
                            value: netsuiteFields.custentity_recpartyaccount
                        });
                    }
                    if (netsuiteFields.custentity_recbankprimid){
                        vendorRecord.setValue({
                            fieldId: "custentity_recbankprimid",
                            value: netsuiteFields.custentity_recbankprimid
                        });
                    }
                    if (netsuiteFields.custentity_vendorbranchbankircid){
                        vendorRecord.setValue({
                            fieldId: "custentity_vendorbranchbankircid",
                            value: netsuiteFields.custentity_vendorbranchbankircid
                        });
                    }

                } else {
                    //custentity_vendorpaymeth
                    const findVendPymtMeth = creednz_dao_lib.genQuery('customlist_vendpymtmeth', 'name', 'iCA', 'id');

                    if (findVendPymtMeth.found) {
                        updateListField(findVendPymtMeth.idRecord, 'custentity_vendorpaymeth'); // WARNING HARD CODED - REQUESTED BY YANIV DESPITE A WARNING
                    }

                    //vendorPaymentMethod => custentity_paymentmethod (customlist_payment_method)
                    if (vendorData.vendorPaymentMethod) {
                        const lookUpData = creednz_dao_lib.genQuery('customlist_payment_method', 'name', vendorData.vendorPaymentMethod, 'id');
                        if (lookUpData.found) {
                            updateListField(lookUpData.idRecord, 'custentity_paymentmethod');
                        }
                    }


                    // usWireInternationalData => custentity_vendorbranchbankircid
                    updateField('usWireInternationalData', 'custentity_vendorbranchbankircid');

                    // bankAccountType => custentity_recbankprimidtype (customlist_recbankidtype)
                    if (vendorData.bankAccountType) {
                        const lookUpData = creednz_dao_lib.genQuery('customlist_recbankidtype', 'name', vendorData.bankAccountType, 'id');
                        if (lookUpData.found) {
                            updateListField(lookUpData.idRecord, 'custentity_recbankprimidtype');
                        }
                    }

                    // bankAccountNumber => custentity_recpartyaccount
                    updateField('bankAccountNumber', 'custentity_recpartyaccount');

                    // swift => custentity_recbankprimid
                    updateField('swift', 'custentity_recbankprimid');
                }
                vendorRecord.setValue({
                    fieldId: 'comments',
                    value: 'Updated with Vendor Evaluation data'
                });

                // remove all Addresses
                while (vendorRecord.getLineCount({sublistId: 'addressbook'}) > 0) {
                    vendorRecord.removeLine({
                        sublistId: 'addressbook',
                        line: 0
                    });
                }
                const addressJSON = creednz_dao_lib.mapAddressFromCreednz(vendorData);
                creednz_dao_lib.addVendorAddress(vendorRecord,'Creednz Billing',addressJSON.billingAddress);
                creednz_dao_lib.addVendorAddress(vendorRecord,'Creednz Shipping',addressJSON.shippingAddress);
                // log.debug
                log.debug({
                    title:'addressJSON',
                    details:addressJSON
                })

                const vendorId = vendorRecord.save();
                return vendorId;

            }
        }

        return {onAction};
    });
