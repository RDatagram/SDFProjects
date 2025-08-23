/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['./util_nbs', 'N/record', "N/https", "N/xml"],

    function (util_nbs, recordModule, https, xml) {

        function beforeLoad(context) {
            var form = context.form;
            form.clientScriptModulePath = './rsm_customer_form_cs.js';

            if ((context.type === context.UserEventType.CREATE) || (context.type === context.UserEventType.EDIT)) {


                form.addButton({
                    id: 'custpage_nbs_finder_button',
                    label: 'NBS pretraga',
                    functionName: 'nbsPretraga()'
                });
            }

        }

        /**
         * Function definition to be triggered before record is loaded.
         *
         * @param {Object} context
         * @param {Record} context.newRecord - New record
         * @param {Record} context.oldRecord - Old record
         * @param {string} context.type - Trigger type
         *
         * @Since 2015.2
         */
        function afterSubmit(context) {
/*
TODO : uvesti parametar u ConfigRecord da li ovo uopste radimo
TODO : proveriti PIB pre slanja i raditi ovo samo za pravna lica, ne i za PRIVATNA lica
 */
            if ((context.type === context.UserEventType.CREATE)) {
                try {
                    var newCust = context.newRecord;

                    var custId = newCust.id;

                    var cpib = newCust.getValue('custentity_pib');

                    if (cpib.length !== 9){
                        return;
                    }
                    var queryTag = util_nbs.generateQueryTag({
                        "accountNumber": "",
                        "nationalIdentificationNumber": "",
                        "taxIdentificationNumber": cpib
                    });

                    var body = util_nbs.generateXmlBody(queryTag);
                    var headerObj = {
                        name: "Content-Type",
                        value: "application/soap+xml; charset=utf-8"
                    };

                    var response = https.post({
                        url: "https://webservices.nbs.rs/CommunicationOfficeService1_0/CompanyAccountXmlService.asmx",
                        body: body,
                        headers: headerObj
                    });

                    var xmlDocument = xml.Parser.fromString({
                        text: util_nbs.unescapeXml(response.body)
                    });

                    var dArray = util_nbs.parseXmlForCompanyAccounts(xmlDocument);
                    var fullBankAccount;
                    var l_novi = true;
                    var l_lc;
                    if (dArray.length > 0) {

                        for (var ia = 0; ia < dArray.length; ia++) {

                            fullBankAccount = util_nbs.buildFullBankAccount_server({
                                "BankCode": dArray[ia].BankCode,
                                "AccountNumber": dArray[ia].AccountNumber,
                                "ControlNumber": dArray[ia].ControlNumber
                            });

                            l_novi = true;

                            l_lc = newCust.getLineCount({
                                sublistId: 'recmachcustrecord_rsm_cust_bank_accounts_cust'
                            });

                            var existingAccount;
                            for (var lc = 0; lc < l_lc && l_novi; lc++) {
                                existingAccount = newCust.getSublistValue({
                                    sublistId: 'recmachcustrecord_rsm_cust_bank_accounts_cust',
                                    line: lc,
                                    fieldId: 'custrecord_rsm_cust_bank_accounts_tr'
                                })
                                if (fullBankAccount === existingAccount) {
                                    l_novi = false;
                                }
                            }

                            if (l_novi) {
                                var newBankAccRec = recordModule.create({
                                    type: 'customrecord_rsm_cust_bank_accounts'
                                });

                                newBankAccRec.setValue({
                                    fieldId: 'custrecord_rsm_cust_bank_accounts_cust',
                                    value: custId
                                });

                                newBankAccRec.setValue({
                                    fieldId: 'custrecord_rsm_cust_bank_accounts_tr',
                                    value: fullBankAccount
                                });

                                newBankAccRec.setValue({
                                    fieldId: 'custrecord_rsm_cust_bank_accounts_banka',
                                    value: dArray[ia].BankName,
                                    ignoreFieldChange: true
                                });
                                newBankAccRec.save();

                            }
                        }
                    }
                } catch (e) {
                    log.error({title: "After Submit Customer", details: e.message});
                }
            }
        }

        return {
            beforeLoad: beforeLoad,
            afterSubmit: afterSubmit
        };

    }
);
