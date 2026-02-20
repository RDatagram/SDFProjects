/**
 * @NApiVersion 2.1
 */

/**
 * @typedef {Object} BankAccountStatusResponse
 * @property {boolean} bankAccountVerified
 * @property {string} action
 * @property {string} channel
 */

define(['N/https', 'N/record', 'N/search', './creednz_token_lib', 'N/format', 'N/config'],
    /**
     * @param{https} https
     * @param record
     * @param search
     * @param{format} format
     * @param creednz_token_lib
     * @param config
     */
    (https, record, search, creednz_token_lib, format, config) => {

        const setNonManadatoryValues = (obj, key, nonManadatoryValue) => {
            if (nonManadatoryValue) {
                obj[key] = nonManadatoryValue
            }
        }

        const getCreednzOptions = () => {
            let options = {
                skipVendorSend: false,
                icaPayable: false,
                mapset: "ANY",
                mapsubset: "ANY"
            };

            /**
             *
             * @type {Object}
             * @property custrecord_ica_payable
             * @property custrecord_skip_mr_vendor_send
             */
            let searchResult = search.lookupFields({
                type: 'customrecord_creednz_details',
                id: 1,
                columns: ['custrecord_skip_mr_vendor_send', 'custrecord_ica_payable']
            });

            options.icaPayable = searchResult.custrecord_ica_payable || false;
            options.skipVendorSend = searchResult.custrecord_skip_mr_vendor_send || false;

            return options;

        }
        const baseCreednzPost = (endPoint, dataObj, currentCreednzObject) => {

            try { // get token and baseUrl
                let creednzObj;
                if (currentCreednzObject) {
                    creednzObj = currentCreednzObject
                } else {
                    creednzObj = creednz_token_lib.checkAccessToken();
                }

                let lastSyncAccessToken = creednzObj.lastSyncAccessToken;
                let creednzBaseUrl = creednzObj.creednzBaseUrl;

                let creedNzApiPostHeaders = {
                    'accept': 'application/json',
                    'content-type': 'application/json',
                    'authorization': 'Bearer ' + lastSyncAccessToken
                };
                let creedNzUrl = creednzBaseUrl + endPoint;

                log.debug({
                    title: 'POST DataObj',
                    details: dataObj
                });

                let creedNzResponse = https.post({
                    url: creedNzUrl,
                    headers: creedNzApiPostHeaders,
                    body: JSON.stringify(dataObj)
                });

                log.debug({
                    title: 'creedNzResponse',
                    details: JSON.stringify(creedNzResponse)
                })
                // check return code
                if (creedNzResponse.code !== 201) {
                    log.error({
                        title: 'Response code from CreedNZ API',
                        details: JSON.stringify({endpoint: endPoint, responseCode: creedNzResponse.code})
                    });
                }
                return creedNzResponse;
            } catch (e) {
                log.error({
                    title: 'Error in POST',
                    details: JSON.stringify({endpoint: endPoint, responseCode: e})
                });
                return '';
            }
        }

        const baseCreednzGet = (endPoint, currentCreednzObject) => {
            let creednzObj = {};

            try {
                if (currentCreednzObject) {
                    creednzObj = currentCreednzObject
                } else {
                    creednzObj = creednz_token_lib.checkAccessToken();
                }
                // get token and baseUrl

                let lastSyncAccessToken = creednzObj.lastSyncAccessToken;
                let creednzBaseUrl = creednzObj.creednzBaseUrl;

                let creedNzApiPostHeaders = {
                    'accept': 'application/json',
                    'content-type': 'application/json',
                    'authorization': 'Bearer ' + lastSyncAccessToken
                };
                let creedNzUrl = creednzBaseUrl + endPoint;

                let creedNzResponse = https.get({
                    url: creedNzUrl,
                    headers: creedNzApiPostHeaders
                });

                log.debug({
                    title: 'creedNzResponse',
                    details: JSON.stringify(creedNzResponse)
                })
                // check return code
                if (creedNzResponse.code !== 200) {
                    log.error({
                        title: 'Response code from CreedNZ API',
                        details: JSON.stringify({endpoint: endPoint, responseCode: creedNzResponse.code})
                    });
                }

                let creedNzTransactions = creedNzResponse.body;
                let creedNzTransactionsParse = JSON.parse(creedNzTransactions);

                log.debug({
                    title: 'creedNzTransactionsParse from :' + endPoint,
                    details: JSON.stringify(creedNzTransactionsParse)
                });

                return creedNzTransactionsParse;
            } catch (e) {
                log.error({
                    title: 'Error in GET',
                    details: JSON.stringify({endpoint: endPoint, responseCode: e})
                });
                return '';
            }
        }

        /**
         * @typedef {Object} Contact
         * @property {number} id - The ID of the contact.
         * @property {string} name - The name of the contact.
         * @property {string} email - The email of the contact.
         * @property {string} phone - The phone of the contact
         */

        /**
         * Retrieves contacts for a vendor.
         * @param {number} vendorRecordId - The ID of the vendor.
         * @returns {Contact[]} An array of contact objects.
         */
        const getVendorContacts = (vendorRecordId) => {
            let contacts = [];
            let contactSearch = search.create({
                type: "contact",
                filters:
                    [
                        ["company", "is", vendorRecordId]
                    ],
                columns:
                    [
                        "internalid",
                        "entityid",
                        "email",
                        "phone"
                    ]
            });
            let searchResult = contactSearch.run().getRange({
                start: 0,
                end: 100
            });
            for (let i = 0; i < searchResult.length; i++) {
                contacts.push({
                    id: searchResult[i].id,
                    name: searchResult[i].getValue({name:'entityid'}),
                    email: searchResult[i].getValue({name: 'email'}) || '',
                    phone: searchResult[i].getValue({name: 'phone'}) || '',
                });
            }
            return contacts;
        }
        const mapVendorDTO = (jsonkey, creedNzOptions, currentRecord) => {


            let sourceField;
            let fieldtype;
            let creednzMap = {};
            let mapset = creedNzOptions.mapset;
            let mapsubset = creedNzOptions.mapsubset;
            const paymentMethod2 = currentRecord.getText('custentity_paymentmethod');

            creednzMap[mapset] = {};
            creednzMap[mapset][mapsubset] = {};

            let icaMapRoot = {};

            creednzMap["ANY"] = {};
            creednzMap["ANY"]["ANY"] = {};
            icaMapRoot["SWT"] = {};
            icaMapRoot["SWT"]["notEmpty"] = {};
            icaMapRoot["SWT"]["Empty"] = {};
            icaMapRoot["ABA"] = {};
            icaMapRoot["ABA"]["Any"] = {};
            icaMapRoot["OTHER"] = {};
            icaMapRoot["OTHER"]["Any"] = {};

            function addMapKey(object, key, sourcefield, fieldtype) {
                object[key] = {
                    sourcefield: sourcefield,
                    fieldtype: fieldtype,
                }
            }

            // paymentCategory
            // TODO: Check with Creednz
            // iCA => set paymentCategory with "iCA", else empty string
            // VENDOR_PAYMENT_METHOD (custentity_vendorpaymeth) -> paymentCategory

            addMapKey(creednzMap["ANY"]['ANY'], "paymentCategory", "", "fixed");
            addMapKey(icaMapRoot["SWT"]["notEmpty"], "paymentCategory", "custentity_vendorpaymeth", "list");
            addMapKey(icaMapRoot["SWT"]["Empty"], "paymentCategory", "custentity_vendorpaymeth", "list");
            addMapKey(icaMapRoot["ABA"]["Any"], "paymentCategory", "custentity_vendorpaymeth", "list");
            addMapKey(icaMapRoot["OTHER"]["Any"], "paymentCategory", "custentity_vendorpaymeth", "list");

            // paymentFormat
            // TODO: Check with Creednz
            // iCA => set paymentFormat with "custentity_paymentformat", else empty string
            // PAYMENT_FORMAT (custentity_paymentformat) -> paymentFormat
            if (paymentMethod2 === 'MTS') {
                addMapKey(icaMapRoot[mapset][mapsubset], "paymentFormat", "WIRE", "fixed");
            } else {
                addMapKey(creednzMap["ANY"]['ANY'], "paymentFormat", "", "fixed");
                addMapKey(icaMapRoot["SWT"]["notEmpty"], "paymentFormat", "custentity_paymentformat", "list");
                addMapKey(icaMapRoot["SWT"]["Empty"], "paymentFormat", "custentity_paymentformat", "list");
                addMapKey(icaMapRoot["ABA"]["Any"], "paymentFormat", "custentity_paymentformat", "list");
                addMapKey(icaMapRoot["OTHER"]["Any"], "paymentFormat", "custentity_paymentformat", "list");
            }

            // bankAccountName
            addMapKey(creednzMap["ANY"]['ANY'], "bankAccountName", "custentity_bank_account_name_creednz", "text");
            addMapKey(icaMapRoot["SWT"]["notEmpty"], "bankAccountName", "custentity_bank_account_name_creednz", "text");
            addMapKey(icaMapRoot["SWT"]["Empty"], "bankAccountName", "custentity_bank_account_name_creednz", "text");
            addMapKey(icaMapRoot["ABA"]["Any"], "bankAccountName", "custentity_bank_account_name_creednz", "text");
            addMapKey(icaMapRoot["OTHER"]["Any"], "bankAccountName", "custentity_bank_account_name_creednz", "text");

            // bankName
            // TODO: Check with Creednz
            addMapKey(creednzMap["ANY"]['ANY'], "bankName", "custentity_bank_account_name_creednz", "text");
            addMapKey(icaMapRoot["SWT"]["notEmpty"], "bankName", "custentity_bankname", "text");
            addMapKey(icaMapRoot["SWT"]["Empty"], "bankName", "custentity_bankname", "text");
            addMapKey(icaMapRoot["ABA"]["Any"], "bankName", "custentity_bankname", "text");
            addMapKey(icaMapRoot["OTHER"]["Any"], "bankName", "custentity_bankname", "text");

            //vendorPaymentMethod
            // TODO: Check with Creednz
            // PAYMENT_METHOD (2) (custentity_paymentmethod) -> vendorPaymentMethod
            // VENDOR_PAYMENT_METHOD (custentity_vendorpaymeth) -> vendorPaymentMethod (not iCA)
            addMapKey(creednzMap["ANY"]['ANY'], "vendorPaymentMethod", "custentity_vendor_payment_method_creeedn", "text");
            addMapKey(icaMapRoot["SWT"]["notEmpty"], "vendorPaymentMethod", "custentity_paymentmethod", "list");
            addMapKey(icaMapRoot["SWT"]["Empty"], "vendorPaymentMethod", "custentity_paymentmethod", "list");
            addMapKey(icaMapRoot["ABA"]["Any"], "vendorPaymentMethod", "custentity_paymentmethod", "list");
            addMapKey(icaMapRoot["OTHER"]["Any"], "vendorPaymentMethod", "custentity_paymentmethod", "list");
            // TODO: CHECK WITH Creednz
            //addMapKey(icaMapRoot["ABA"]["Any"],"vendorPaymentMethod","custentity_vendorpaymeth","list");

            // bankAccountType
            addMapKey(creednzMap["ANY"]['ANY'], "bankAccountType", 'Checking account', "fixed");
            addMapKey(icaMapRoot["SWT"]["notEmpty"], "bankAccountType", "custentity_recbankprimidtype", "list");
            addMapKey(icaMapRoot["SWT"]["Empty"], "bankAccountType", "custentity_recbankprimidtype", "list");
            addMapKey(icaMapRoot["ABA"]["Any"], "bankAccountType", "custentity_recbankprimidtype", "list");
            addMapKey(icaMapRoot["OTHER"]["Any"], "bankAccountType", "custentity_recbankprimidtype", "list");

            // bankCode
            // usWireInternationalData
            // TODO: Check with Creednz
            addMapKey(creednzMap["ANY"]['ANY'], "bankCode", 'custentity_bank_code_creednz', "text");
            addMapKey(icaMapRoot["SWT"]["notEmpty"], "bankCode", "", "fixed");
            addMapKey(icaMapRoot["SWT"]["Empty"], "bankCode", "", "fixed");
            addMapKey(icaMapRoot["ABA"]["Any"], "bankCode", "", "fixed");
            addMapKey(icaMapRoot["OTHER"]["Any"], "bankCode", "", "fixed");

            addMapKey(creednzMap["ANY"]['ANY'], "usWireInternationalData", "", "fixed");
            addMapKey(icaMapRoot["SWT"]["notEmpty"], "usWireInternationalData", 'custentity_vendorbranchbankircid', "text");
            addMapKey(icaMapRoot["SWT"]["Empty"], "usWireInternationalData", 'custentity_vendorbranchbankircid', "text");
            addMapKey(icaMapRoot["ABA"]["Any"], "usWireInternationalData", 'custentity_vendorbranchbankircid', "text");
            addMapKey(icaMapRoot["OTHER"]["Any"], "usWireInternationalData", "custentity_vendorbranchbankircid", "list");

            // swift
            addMapKey(creednzMap["ANY"]['ANY'], "swift", 'custentity_swift_creednz', "text");
            addMapKey(icaMapRoot["SWT"]["notEmpty"], "swift", 'custentity_recbankprimid', "text");
            addMapKey(icaMapRoot["SWT"]["Empty"], "swift", 'custentity_recbankprimid', "text");
            addMapKey(icaMapRoot["ABA"]["Any"], "swift", '', "fixed");
            addMapKey(icaMapRoot["OTHER"]["Any"], "swift", '', "fixed");

            // iban
            addMapKey(creednzMap["ANY"]['ANY'], "iban", 'custentity_iban_creednz', "text");
            addMapKey(icaMapRoot["SWT"]["notEmpty"], "iban", '', "fixed");
            addMapKey(icaMapRoot["SWT"]["Empty"], "iban", 'custentity_recpartyaccount', "text");
            addMapKey(icaMapRoot["ABA"]["Any"], "iban", '', "fixed");
            addMapKey(icaMapRoot["OTHER"]["Any"], "iban", '', "fixed");

            // bankAccountNumber
            addMapKey(creednzMap["ANY"]['ANY'], "bankAccountNumber", 'custentity_bank_account_number_creednz', "text");
            addMapKey(icaMapRoot["SWT"]["notEmpty"], "bankAccountNumber", 'custentity_recpartyaccount', "text");
            addMapKey(icaMapRoot["SWT"]["Empty"], "bankAccountNumber", '', "fixed");
            addMapKey(icaMapRoot["ABA"]["Any"], "bankAccountNumber", 'custentity_recpartyaccount', "text");
            addMapKey(icaMapRoot["OTHER"]["Any"], "bankAccountNumber", '', "fixed");

            // routingNumber
            addMapKey(creednzMap["ANY"]['ANY'], "routingNumber", 'custentity_routing_number_creednz', "text");
            addMapKey(icaMapRoot["SWT"]["notEmpty"], "routingNumber", '', "fixed");
            addMapKey(icaMapRoot["SWT"]["Empty"], "routingNumber", '', "fixed");
            addMapKey(icaMapRoot["ABA"]["Any"], "routingNumber", 'custentity_recbankprimid', "text");
            addMapKey(icaMapRoot["OTHER"]["Any"], "routingNumber", '', "fixed");

            // PAYEE_EMAIL_ADDRESS  (custentity_payee_email) -> payeeEmail
            // TODO: Check with Creednz
            addMapKey(creednzMap["ANY"]['ANY'], "payeeEmail", 'email', "text");
            addMapKey(icaMapRoot["SWT"]["notEmpty"], "payeeEmail", 'custentity_payee_email', "text");
            addMapKey(icaMapRoot["SWT"]["Empty"], "payeeEmail", 'custentity_payee_email', "text");
            addMapKey(icaMapRoot["ABA"]["Any"], "payeeEmail", 'custentity_payee_email', "text");
            addMapKey(icaMapRoot["OTHER"]["Any"], "payeeEmail", 'custentity_payee_email', "text");

            if (creedNzOptions.icaPayable) {
                sourceField = icaMapRoot[mapset][mapsubset][jsonkey].sourcefield;
                fieldtype = icaMapRoot[mapset][mapsubset][jsonkey].fieldtype;
            } else {
                sourceField = creednzMap[mapset][mapsubset][jsonkey].sourcefield;
                fieldtype = creednzMap[mapset][mapsubset][jsonkey].fieldtype;
            }


            if (fieldtype === "text") {
                return currentRecord.getValue(sourceField)
            } else if (fieldtype === "list") {
                return currentRecord.getText(sourceField)
            } else if (fieldtype === "fixed") {
                return sourceField
            }
        }

        const calculateMapset = (vendorRecord, creedNzOptions) => {
            /*

            if iCA Payable option true we need to determine mapset and mapsubset

            - custentity_vendorpaymeth == 'iCA'
                - custentity_recbankprimidtype == 'SWT'
                        => mapset = SWT
                    - custentity_vendorbranchbankircid is not empty
                        => mapsubset = notEmpty
                    - custentity_vendorbranchbankircid is empty
                        => mapsubset = Empty
                - custentity_recbankprimidtype == 'ABA'
                        => mapset = ABA
                        => mapsubset = Any
             - custentity_vendorpaymeth != 'iCA'
                        => mapset = OTHER
                        => mapsubset = Any
             */

            let custentity_vendorpaymeth = vendorRecord.getText('custentity_vendorpaymeth');
            let custentity_recbankprimidtype = vendorRecord.getText('custentity_recbankprimidtype');
            let custentity_vendorbranchbankircid = vendorRecord.getValue('custentity_vendorbranchbankircid');

            /*
            log.debug({title: 'custentity_vendorpaymeth', details: custentity_vendorpaymeth});
            log.debug({title: 'custentity_recbankprimidtype', details: custentity_recbankprimidtype});
            log.debug({title: 'custentity_vendorbranchbankircid', details: custentity_vendorbranchbankircid});
            */
            if (custentity_vendorpaymeth === 'iCA') {

                //log.debug({title: 'iCA', details: 'true'});

                if (custentity_recbankprimidtype === 'SWT') {
                    //log.debug({title: 'iCA.SWT', details: 'true'});
                    creedNzOptions.mapset = 'SWT';
                    if (custentity_vendorbranchbankircid !== '') {
                        //log.debug({title: 'iCA.SWT.notEmpty', details: 'true'});
                        creedNzOptions.mapsubset = 'notEmpty';
                    } else {
                        //log.debug({title: 'iCA.SWT.Empty', details: 'true'});
                        creedNzOptions.mapsubset = 'Empty';
                    }
                } else if (custentity_recbankprimidtype === 'ABA') {
                    //log.debug({title: 'iCA.ABA', details: 'true'});
                    creedNzOptions.mapset = 'ABA';
                    creedNzOptions.mapsubset = 'Any';
                } else {
                    creedNzOptions.mapset = 'OTHER';
                    creedNzOptions.mapsubset = 'Any';
                }
            } else {
                log.debug({title: 'iCA', details: 'false'});
                if (custentity_recbankprimidtype === 'SWT') {
                    log.debug({title: 'iCA.SWT', details: 'true'});
                    creedNzOptions.mapset = 'SWT';
                    if (custentity_vendorbranchbankircid !== '') {
                        log.debug({title: 'iCA.SWT.notEmpty', details: 'true'});
                        creedNzOptions.mapsubset = 'notEmpty';
                    } else {
                        log.debug({title: 'iCA.SWT.Empty', details: 'true'});
                        creedNzOptions.mapsubset = 'Empty';
                    }
                } else if (custentity_recbankprimidtype === 'ABA') {
                    log.debug({title: 'iCA.ABA', details: 'true'});
                    creedNzOptions.mapset = 'ABA';
                    creedNzOptions.mapsubset = 'Any';
                } else {
                    creedNzOptions.mapset = 'OTHER';
                    creedNzOptions.mapsubset = 'Any';
                }
            }
        }
        const buildAnalyzeVendorDtoFromRecord = (currentRecord) => {
            let vendorObj = {
                // code to build analyzeVendorDto from currentRecord
            };

            let creedNzOptions = getCreednzOptions();
            const isIndividual = currentRecord.getValue('isperson');
            vendorObj.isIndividual = false;
            if (isIndividual == "T") {
                vendorObj.isIndividual = true;
            }

            if (creedNzOptions.icaPayable) {
                calculateMapset(currentRecord, creedNzOptions);
            }

            log.debug({
                title: 'creednzOptions AFTER iCA testing',
                details: creedNzOptions
            })


            //"name": "string",
            let vendorName;
            if (vendorObj.isIndividual) {
                vendorName = currentRecord.getValue({
                    fieldId: "firstname"
                });
                vendorName += " ";
                vendorName += currentRecord.getValue({
                    fieldId: "lastname"
                });
            } else {
                vendorName = currentRecord.getValue({
                    fieldId: "companyname"
                });
            }

            if (vendorName) {
                vendorObj.name = vendorName;
            }
            //  "internalId": "string",
            let vendorRecId = JSON.stringify(currentRecord.id);
            if (vendorRecId) {
                vendorObj.internalId = vendorRecId;
            }

            // "registrationCode": "string",
            let vendorCreednzRegCode = currentRecord.getValue({
                fieldId: "custentity_registraion_code_creednz"
            });
            if (vendorCreednzRegCode) {
                vendorObj.registrationCode = vendorCreednzRegCode;
            }

            /* REMOVED
            //  "primarySubsidiary": "string",
            let vendorSubsidiary = currentRecord.getText({
                fieldId: "subsidiary"
            });
            if (vendorSubsidiary) {
                vendorObj.primarySubsidiary = vendorSubsidiary;
            }
            */

            // "dateCreated": "2024-09-18T10:39:46.451Z",
            let vendorCreatedDate = currentRecord.getValue({
                fieldId: "datecreated"
            });
            let vendordateCreatedFormat = format.format({
                value: vendorCreatedDate,
                type: format.Type.DATETIMETZ
            });
            let vendordateCreated1 = format.parse({
                value: vendordateCreatedFormat,
                type: format.Type.DATETIMETZ
            });
            if (vendordateCreated1) {
                vendorObj.dateCreated = vendordateCreated1;
            }

            //  "lastModified": "2024-09-18T10:39:46.451Z",
            let vendorLastModified = currentRecord.getValue({
                fieldId: "lastmodifieddate"
            });
            let lastModifiedFormat = format.format({
                value: vendorLastModified,
                type: format.Type.DATETIMETZ
            });
            let lastModified2 = format.parse({
                value: lastModifiedFormat,
                type: format.Type.DATETIMETZ
            });
            if (lastModified2) {
                vendorObj.lastModified = lastModified2;
            }
            // "email": "string",
            let vendorEmail = currentRecord.getValue({
                fieldId: "email"
            });
            if (vendorEmail) {
                vendorObj.purchaseEmail = vendorEmail;
            }
            // "phone": "string",
            let vendorPhone = currentRecord.getValue({
                fieldId: "phone"
            });
            if (vendorPhone) {
                vendorObj.phone = vendorPhone;
            }
            // TODO:
            // "primaryContact": "string",

            //"vendorPaymentMethod": "string",

            /*   let vendorCreednzPaymentMethod = currentRecord.getValue({
                   fieldId: "custentity_vendor_payment_method_creeedn"
               });
             */


            // TODO:
            // "taxpayerID": "string",
            // TODO:
            // "taxpayerIdType": "string",
            let vendorCreednztaxpayerID = currentRecord.getValue({
                fieldId: "taxidnum"
            });
            if (vendorCreednztaxpayerID) {
                vendorObj.taxpayerID = vendorCreednztaxpayerID;
                vendorObj.taxpayerIdType = 'Employer Identification Number'
            }

            // "reportingTax1099": true,

            vendorObj.reportingTax1099 = currentRecord.getValue({
                fieldId: "is1099eligible"
            });

            // "currency": "string",
            let vendorCurrency = currentRecord.getValue({
                fieldId: "currency"
            });
            if (vendorCurrency) {
                vendorObj.currency = vendorCurrency;
            }

            // TODO: Check with Creednz
            let vendorPaymentCategory = mapVendorDTO("paymentCategory", creedNzOptions, currentRecord);
            if (vendorPaymentCategory) {
                vendorObj.paymentCategory = vendorPaymentCategory;
            }

            // TODO: Check with Creednz
            let vendorPaymentFormat = mapVendorDTO("paymentFormat", creedNzOptions, currentRecord);
            if (vendorPaymentFormat) {
                vendorObj.paymentFormat = vendorPaymentFormat;
            }

            // TODO: Check with Creednz
            let vendorPayeeEmail = mapVendorDTO("payeeEmail", creedNzOptions, currentRecord);
            if (vendorPayeeEmail) {
                vendorObj.paymentRemittanceEmail = vendorPayeeEmail;
            }

            // // TODO: Check with Creednz
            let vendorBankName = mapVendorDTO("bankName", creedNzOptions, currentRecord);
            if (vendorBankName) {
                vendorObj.bankName = vendorBankName;
            }

            let vendorCreednzBankAccName = mapVendorDTO("bankAccountName", creedNzOptions, currentRecord);
            if (vendorCreednzBankAccName) {
                vendorObj.bankAccountName = vendorCreednzBankAccName;
            }

            let vendorCreednzPaymentMethod = mapVendorDTO("vendorPaymentMethod", creedNzOptions, currentRecord);
            if (vendorCreednzPaymentMethod) {
                vendorObj.vendorPaymentMethod = vendorCreednzPaymentMethod;
            } else if (vendorPaymentCategory) {
                vendorObj.vendorPaymentMethod = vendorPaymentCategory;
            }

            let vendorCreednzBankAccountType = mapVendorDTO("bankAccountType", creedNzOptions, currentRecord);
            if (vendorCreednzBankAccountType) {
                vendorObj.bankAccountType = vendorCreednzBankAccountType;
            }

            let vendorCreednzBankCode = mapVendorDTO("bankCode", creedNzOptions, currentRecord);
            if (vendorCreednzBankCode) {
                vendorObj.bankCode = vendorCreednzBankCode;
            }

            let vendorusWireInternationalData = mapVendorDTO("usWireInternationalData", creedNzOptions, currentRecord);
            if (vendorusWireInternationalData) {
                vendorObj.usWireInternationalData = vendorusWireInternationalData;
            }

            let vendorCreednzSwift = mapVendorDTO("swift", creedNzOptions, currentRecord);
            if (vendorCreednzSwift) {
                vendorObj.swift = vendorCreednzSwift;
            }

            let vendorCreednzIban = mapVendorDTO("iban", creedNzOptions, currentRecord);
            if (vendorCreednzIban) {
                vendorObj.iban = vendorCreednzIban;
            }

            let vendorCreednzBankAccNumber = mapVendorDTO("bankAccountNumber", creedNzOptions, currentRecord);
            if (vendorCreednzBankAccNumber) {
                vendorObj.bankAccountNumber = vendorCreednzBankAccNumber;
            }

            let vendorCreednzRoutingNumber = mapVendorDTO("routingNumber", creedNzOptions, currentRecord);
            if (vendorCreednzRoutingNumber) {
                vendorObj.routingNumber = vendorCreednzRoutingNumber;
            }

            let vendorCreednzBankAddress = "";
            if (creedNzOptions.icaPayable) {

                // iCA Bundle existing, get from custom field
                /*
                BANK_ADDRESS_LINE1 (custentity_bankaddressline1) + BANK_CITY (custentity_bankcity) + BANK STATE/PROVINCE (custentity_bankstate) + BANK_COUNTRY_CODE (custentity_bankcountrycode) + BANK_POSTEL_CODE (custentity_bankpostcode) -> bankAddress
                 */

                const buildAddress = (textLine) => {
                    if (textLine.length > 0) {
                        vendorCreednzBankAddress = vendorCreednzBankAddress + textLine + '\n';
                    }
                }
                buildAddress(currentRecord.getValue("custentity_bankaddressline1"));
                buildAddress(currentRecord.getValue("custentity_bankcity"));
                buildAddress(currentRecord.getValue("custentity_bankstate"));
                buildAddress(currentRecord.getText("custentity_bankcountrycode"));
                buildAddress(currentRecord.getValue("custentity_bankpostcode"));


            } else {
                // not iCA Bundle installed get from Creednz Field
                // "bankAddress": "string",
                vendorCreednzBankAddress = currentRecord.getValue({
                    fieldId: "custentity_bank_address_creednz"
                });

            }
            if (vendorCreednzBankAddress) {
                vendorObj.bankAddress = vendorCreednzBankAddress;
            }
            let vendorCreednzBankNumber = currentRecord.getValue({
                fieldId: "custentity_bank_number_creednz"
            });
            if (vendorCreednzBankNumber) {
                vendorObj.bankNumber = vendorCreednzBankNumber;
            }

            /* REMOVED
            // "branchName": "string",
            let vendorCreednzBranchName = currentRecord.getValue({
                fieldId: "custentity_branch_name_creednz"
            });
            if (vendorCreednzBranchName) {
                vendorObj.branchName = vendorCreednzBranchName;
            }

            // "branchNumber": "string",
            let vendorCreednzBranchNumber = currentRecord.getValue({
                fieldId: "custentity_branch_number_creednz"
            });
            if (vendorCreednzBranchNumber) {
                vendorObj.branchNumber = vendorCreednzBranchNumber;
            }
            */


            /* REMOVED
            // "bankDetailsUpdate": "string",
            let vendorCreednzBankDetailsUpdate = currentRecord.getValue({
                fieldId: "custentity_bank_details_update_creednz"
            });
            if (vendorCreednzBankDetailsUpdate) {
                vendorObj.bankDetailsUpdate = vendorCreednzBankDetailsUpdate;
            }
            */

            /* REMOVED
            // "eftBankDetailsUpdate": "string",
            let vendorCreednzEftBankUpdate = currentRecord.getValue({
                fieldId: "custentity_eft_bank_detailsupdate_creedn"
            });
            if (vendorCreednzEftBankUpdate) {
                vendorObj.eftBankDetailsUpdate = vendorCreednzEftBankUpdate;
            }
            */

            /* REMOVED
            // "eftBillPayment": "string",
            let vendorCreednzEftBillPayment = currentRecord.getValue({
                fieldId: "custentity_eft_bill_payment_creednz"
            });
            if (vendorCreednzEftBillPayment) {
                vendorObj.eftBillPayment = vendorCreednzEftBillPayment;
            }
            */

            /* REMOVED
            // "paypalAccount": "string",
            let vendorCreednzPaypalAcc = currentRecord.getValue({
                fieldId: "custentity_paypal_account_creednz"
            });
            if (vendorCreednzPaypalAcc) {
                vendorObj.paypalAccount = vendorCreednzPaypalAcc;
            }
            */

            // "billingAddress": "string",
            let vendorAddress = currentRecord.getValue({
                fieldId: "defaultaddress"
            });
            if (vendorAddress) {
                vendorObj.billingAddress = vendorAddress;
            }

            //"billingStreet": "string",
            let vendorStreet = currentRecord.getValue({
                fieldId: "billaddr1"
            });
            if (vendorStreet) {
                //vendorObj.billingStreet = vendorStreet;
            }
            //  "billingCountry": "string",
            let vendorBillCountry = currentRecord.getValue({
                fieldId: "billcountry"
            });
            if (vendorBillCountry) {
                vendorObj.billingCountry = vendorBillCountry;
            }

            // "billingCity": "string",
            let vendorBillCity = currentRecord.getValue({
                fieldId: "billcity"
            });
            if (vendorBillCity) {
                vendorObj.billingCity = vendorBillCity;
            }

            // "billingRegion": "string",<billstate>AZ</billstate>
            let vendorRegion = currentRecord.getValue({
                fieldId: "billstate"
            });
            if (vendorRegion) {
                vendorObj.billingRegion = vendorRegion;
            }

            // "billingZip": "string",
            let vendorBillZip = currentRecord.getValue({
                fieldId: "billzip"
            });
            if (vendorBillZip) {
                vendorObj.billingZip = vendorBillZip;
            }

            const vendorContacts = getVendorContacts(currentRecord.id);
            log.debug({
                title: 'vendorContacts in mapVendorDTO',
                details: vendorContacts
            });

            /*
            Relationships > contacts > Email (Netsuite)  ->  accountingEmail (Creednz)

            Relationships > contacts > Phone (Netsuite)  ->  phone (Creednz)

            Relationships > contacts > Name (Netsuite)  ->  accountingContact (Creednz)
             */

            if (vendorContacts.length > 0) {
                let accountingEmail = vendorContacts[0].email;
                let phoneContact = vendorContacts[0].phone;
                let accountingContact = vendorContacts[0].name;

                if (accountingEmail) {
                    vendorObj.accountingEmail = accountingEmail;
                }
                if (phoneContact) {
                    vendorObj.phone = phoneContact;
                }
                if (accountingContact) {
                    vendorObj.accountingContact = accountingContact;
                }
            }

            /* var vendorPrimaryContact = currentRecord.getValue({
                fieldId: "contact"
             });*/

            /* TODO:
            "reportingTax1099": true,
            "paymentTerms": "string",
            "createdByFpVisitorId": "string",
            "createdByFpRequestId": "string",
            "shippingAddress": "string",
            "bankAccountCheckApproval": true
             */

            /* let vendorCreednzRisk = currentRecord.getValue({
                 fieldId: "custentity_creednz_risk_status"
             });

             let vendorCreednzLastUpdated = currentRecord.getValue({
                 fieldId: "custentity_creednz_updated_on"
             });*/

            return vendorObj;
        }

        const postCreednzAnalyzeVendor = (dataObj) => {

            let creedNzResponse = baseCreednzPost("/external/erp/vendor/analyze", dataObj, null);
            let creedNzTransactions = creedNzResponse.body;

            let creedNzTransactionsParse = JSON.parse(creedNzTransactions);
            log.debug({
                title: "creedNzTransactionsParse",
                details: creedNzTransactionsParse
            });

            return creedNzTransactionsParse;
        }


        const getCreednzVendorStatus = (externalId) => {
            const creednzVendorInformation = "/external/erp/vendor/status/" + externalId;

            return baseCreednzGet(creednzVendorInformation, null);

        }

        /**
         *
         * @param externalId
         * @return {BankAccountStatusResponse}
         */
        const getCreednzVendorBankStatus = (externalId) => {
            const creednzVendorInformation = "/external/erp/vendor/bank-account/status/externalId/" + externalId;

            return baseCreednzGet(creednzVendorInformation, null);

        }

        /**
         *
         * @return {any|string}
         *
         * Return delta (not existing Vendors in Netsuite)
         */
        const getCreednzVendorDelta = () => {
            const creednzVendorInformation = "/external/erp/vendor/delta";

            return baseCreednzGet(creednzVendorInformation, null);

        }

        /**
         *
         * @return {any|string}
         *
         * Return list of vendors if data are different
         */
        const getCreednzVendorDifferentPoints = () => {
            const creednzVendorInformation = "/external/erp/vendor/with-different-data-points";

            return baseCreednzGet(creednzVendorInformation, null);

        }

        const getCreednzVendorFindings = (externalId) => {
            const creednzVendorInformation = "/external/erp/vendor/findings/externalId/" + externalId;

            return baseCreednzGet(creednzVendorInformation, null);

        }

        // /external/erp/vendor-evaluation/
        const getCreednzVendorEvaluation_vendor = (evaluationId) => {
            const creednzVendorInformation = "/external/erp/vendor-evaluation/" + evaluationId + "/vendor";

            return baseCreednzGet(creednzVendorInformation, null);

        }

        // /external/erp/vendor-evaluation/status/:vendorEvaluationId
        const getCreednzVendorEvaluation_status = (externalId) => {
            const baseGetUrl = "/external/erp/vendor-evaluation/status/" + externalId;

            return baseCreednzGet(baseGetUrl, null);

        }

        const postCreednzVendorEvaluation_send_results = (externalId) => {

            const basePostUrl = "/external/erp/vendor-evaluation/" + externalId + "/send-results";


            let creedNzResponse = baseCreednzPost(basePostUrl, null, null);
            let creedNzTransactions = creedNzResponse.body;

            let creedNzTransactionsParse = JSON.parse(creedNzTransactions);
            log.debug({
                title: "creedNzTransactionsParse",
                details: creedNzTransactionsParse
            });

            return creedNzTransactionsParse;
        }

        const getCreednzVendorEvaluation_all = () => {
            const baseGetUrl = "/external/erp/vendor-evaluation";

            return baseCreednzGet(baseGetUrl, null);

        }
        const getCreednzVendorEvaluation_one = (evalutionId) => {
            const baseGetUrl = "/external/erp/vendor-evaluation/" + evalutionId;

            return baseCreednzGet(baseGetUrl, null);

        }

        const postCreednzInviteVendor = (dataObj) => {
            let creedNzResponse = baseCreednzPost("/external/erp/vendor-evaluation/invite", dataObj, null);
            let creedNzTransactions = creedNzResponse.body;

            let creedNzTransactionsParse = JSON.parse(creedNzTransactions);
            log.debug({
                title: "creedNzTransactionsParse",
                details: creedNzTransactionsParse
            });

            return creedNzTransactionsParse;
        }
        const postCreednzUpdateInviteVendor = (dataObj) => {
            let creedNzResponse = baseCreednzPost("/external/erp/vendor-evaluation/update-and-invite", dataObj, null);
            let creedNzTransactions = creedNzResponse.body;

            let creedNzTransactionsParse = JSON.parse(creedNzTransactions);
            log.debug({
                title: "postCreednzUpdateInviteVendor",
                details: creedNzTransactionsParse
            });

            return creedNzTransactionsParse;
        }

        const checkRiskFromFindings = (findings) => {
            let riskObject = {
                riskFlag: "Validated",
                bankRiskStatus: "No Risk",
                operationRiskStatus: "No Risk",
                sanctionRiskStatus: "No Risk",
                cyberRiskStatus: "No Risk"
            }

            // iterate array findings
            const CATEGORY_TO_RISK_STATUS = {
                "BankAccount": "bankRiskStatus",
                "PaymentOperations": "operationRiskStatus",
                "Sanctions": "sanctionRiskStatus",
                "CyberRisk": "cyberRiskStatus"
            }
            const CATEGORY_TO_MODERATE_VALUE = {
                "BankAccount": "Moderate Risk",
                "PaymentOperations": "Moderate Risk",
                "Sanctions": "Moderate Risk",
                "CyberRisk": "Moderate Risk"
            }
            const CATEGORY_TO_RISK_VALUE = {
                "BankAccount": "On Risk",
                "PaymentOperations": "On Risk",
                "Sanctions": "On Risk",
                "CyberRisk": "On Risk"
            }
            for (let i = 0; i < findings.length; i++) {

                //let vendorFindingsId = findings[i].id;
                let vendorFindingsType = findings[i].type;
                //let vendorFindingsTitle = findings[i].title;
                let vendorFindingsCategory = findings[i].category;
                //let vendorFindingsDescription = findings[i].description;

                const GAP_TYPE = 'Gap';
                const ALERT_TYPE = 'Alert';

                if (vendorFindingsType === GAP_TYPE) {
                    let riskStatusProperty = CATEGORY_TO_RISK_STATUS[vendorFindingsCategory]
                    if (riskStatusProperty) {
                        riskObject[riskStatusProperty] = CATEGORY_TO_MODERATE_VALUE[vendorFindingsCategory];
                    }
                }

                if (vendorFindingsType === ALERT_TYPE) {
                    let riskStatusProperty = CATEGORY_TO_RISK_STATUS[vendorFindingsCategory]
                    if (riskStatusProperty) {
                        riskObject[riskStatusProperty] = CATEGORY_TO_RISK_VALUE[vendorFindingsCategory];
                        riskObject.riskFlag = "At Risk";
                    }
                }

            }

            return riskObject;
        }
        const regexRiskStatus = (inputValue) => {
            const mapValues = {
                "AtRisk": "At Risk"
            }

            if (mapValues[inputValue]) {
                return mapValues[inputValue]
            } else {
                return inputValue
            }

        }
        const regexCategory = (inputValue) => {
            const mapValues = {
                "BankAccount": "Bank Account",
                "PaymentOperations": "Payment Operations",
            }

            if (mapValues[inputValue]) {
                return mapValues[inputValue]
            } else {
                return inputValue
            }
        }

        const buildVendprAppURL = (vendorID) => {
            let baseLookUp = search.lookupFields({
                type: 'customrecord_creednz_details',
                id: 1,
                columns: ['custrecord_creednz_app_base_url']
            });
            let baseUrl = baseLookUp.custrecord_creednz_app_base_url;

            log.debug({
                title: "buildVendprAppURL",
                details: baseUrl
            });

            return baseUrl + "/vendors/" + vendorID;
        }


        const postCreednzAnalyzePayment = (dataObj) => {

            let creedNzResponse = baseCreednzPost("/external/erp/payment/analyze", dataObj, null);
            let creedNzTransactions = creedNzResponse.body;

            let creedNzTransactionsParse = JSON.parse(creedNzTransactions);
            log.debug({
                title: "creedNzTransactionsParse",
                details: creedNzTransactionsParse
            });

            return creedNzTransactionsParse;
        }

        const getCreednzVPaymentStatus = (externalId) => {
            const creednzEndpoint = "/external/erp/payment/status/" + externalId;

            return baseCreednzGet(creednzEndpoint, null);

        }

        /**
         *
         * @param externalId
         *
         * @returns {Object[]}
         * @property {string} id
         * @property {string} type
         * @property {string} category
         * @property {string} title
         * @property {string} description
         * @property {string} remediation
         *
         */
        const getCreednzPaymentFindings = (externalId) => {
            const creednzEndpoint = "/external/erp/payment/findings/externalId/" + externalId;

            return baseCreednzGet(creednzEndpoint, null);
        }
        const buildAnalyzePaymentDtoFromTransaction = (currentRecord) => {

            let creedNzOptions = getCreednzOptions();

            let paymentObj = {}
            paymentObj.paymentDate = currentRecord.getValue('trandate');

            paymentObj.amount = parseFloat(currentRecord.getValue('custbody_creednz_amount'));

            paymentObj.currencyCode = currentRecord.getValue('custbody_creednz_currency_code');

            paymentObj.payerName = currentRecord.getValue('custbody_creednz_payername');

            let nonManadatoryValue;
            nonManadatoryValue = currentRecord.getValue('custbody_payer_bank_acc_number');
            setNonManadatoryValues(paymentObj, "payerBankAccountNumber", nonManadatoryValue);


            paymentObj.payeeName = currentRecord.getValue('custbody_creednz_payeename');
            nonManadatoryValue = currentRecord.getValue('custbody_creednz_routing_number');
            setNonManadatoryValues(paymentObj, "routingNumber", nonManadatoryValue);

            nonManadatoryValue = currentRecord.getValue('custbody_payee_bank_acc_number');
            setNonManadatoryValues(paymentObj, "payeeBankAccountNumber", nonManadatoryValue);

            nonManadatoryValue = currentRecord.getValue('custbody_creednz_payment_swift');
            setNonManadatoryValues(paymentObj, "swift", nonManadatoryValue);
            nonManadatoryValue = currentRecord.getValue('custbody_creednz_payment_iban');
            setNonManadatoryValues(paymentObj, "iban", nonManadatoryValue);
            nonManadatoryValue = currentRecord.getValue('custbody_creednz_payment_invoiceid');
            setNonManadatoryValues(paymentObj, "invoiceId", nonManadatoryValue);

            paymentObj.description = currentRecord.getValue('memo');

            log.debug({
                title: 'buildAnalyzePaymentDtoFromTransaction',
                details: paymentObj
            });

            return paymentObj;
        }

        return {
            getCreednzOptions,
            baseCreednzPost,
            buildAnalyzeVendorDtoFromRecord,
            baseCreednzGet,
            getCreednzVendorFindings,
            postCreednzAnalyzeVendor,
            getCreednzVendorStatus,
            getCreednzVendorBankStatus,
            getCreednzVendorDelta,
            getCreednzVendorDifferentPoints,
            postCreednzInviteVendor,
            postCreednzUpdateInviteVendor,
            getCreednzVendorEvaluation_vendor,
            getCreednzVendorEvaluation_status,
            getCreednzVendorEvaluation_all,
            getCreednzVendorEvaluation_one,
            postCreednzVendorEvaluation_send_results,
            checkRiskFromFindings,
            regexRiskStatus: regexRiskStatus,
            regexCategory,
            buildVendprAppURL,
            postCreednzAnalyzePayment,
            getCreednzVPaymentStatus,
            getCreednzPaymentFindings,
            buildAnalyzePaymentDtoFromTransaction,
            getVendorContacts
        }

    });
