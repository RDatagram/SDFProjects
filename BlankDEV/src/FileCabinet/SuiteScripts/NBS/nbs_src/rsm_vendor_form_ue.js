/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['./util_nbs', 'N/record', "N/https", "N/xml", "./rsm_config_util"],

    function (util_nbs, recordModule, https, xml, rsm_config_util) {


        function beforeLoad(context) {
            //if ((context.type === context.UserEventType.CREATE) || (context.type === context.UserEventType.EDIT)) {
                if  (context.type === context.UserEventType.VIEW) {
                var form = context.form;
                form.clientScriptModulePath = './rsm_vendor_form_cs.js';

                form.addButton({
                    id: 'custpage_nbs_finder_button',
                    label: 'NBS pretraga',
                    functionName: 'nbsPretraga()'
                });
            }
        }

        /**
         * Try to add bank accounts to custrecord_2663_parent_vendor sublist
         *
         * @param context
         */
        function afterSubmit(context) {
            log.debug({
                title : 'Checkpoint',
                details : 'Enter 17:47'
            })
            if ((context.type === context.UserEventType.CREATE)||(context.type === context.UserEventType.EDIT)) {
                try {
                    var newVend = context.newRecord;

                    var vendId = newVend.id;
                    var existingAccArray = util_nbs.getBank2663Detail(vendId);

                    var cpib = newVend.getValue('custentity_pib');
                    var cmtbr = newVend.getValue('custentity_matbrpred');

                    if ((cpib.length !== 9) && (cmtbr.length == 0)){
                        //PIB nije dugacak 9, a nema ni Maticni broj - ne radi automatsku pretragu NBS
                        return;
                    }
                    var queryTag = util_nbs.generateQueryTag({
                        "accountNumber": "",
                        "nationalIdentificationNumber": cmtbr,
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

                        var accConfig = rsm_config_util.AccountConfig.load();
                        for (var ia = 0; ia < dArray.length; ia++) {

                            fullBankAccount = util_nbs.buildFullBankAccount_server({
                                "BankCode": dArray[ia].BankCode,
                                "AccountNumber": dArray[ia].AccountNumber,
                                "ControlNumber": dArray[ia].ControlNumber
                            });

                            l_novi = true;

                            l_lc = existingAccArray.length;

                            log.debug({
                                title : 'Trenutno racuna',
                                details : existingAccArray
                            });

                            var existingAccount;
                            for (var lc = 0; lc < l_lc && l_novi; lc++) {
                                existingAccount = existingAccArray[lc].vbankacc;
                                if (fullBankAccount === existingAccount) {
                                    l_novi = false;
                                }
                            }

                            if (l_novi) {
                                var rec = recordModule.create({
                                    type : 'customrecord_2663_entity_bank_details'
                                });

                                rec.setValue({
                                    fieldId : 'name',
                                    value : fullBankAccount + ' - ' + dArray[ia].CompanyName
                                });

                                rec.setValue({
                                    fieldId : 'custrecord_2663_parent_vendor',
                                    value : vendId
                                });

                                rec.setValue({
                                    fieldId : 'custrecord_2663_entity_bank_type',
                                    value : 2  //Secondary
                                });

                                rec.setValue({
                                    fieldId : 'custrecord_2663_entity_acct_name',
                                    value : dArray[ia].CompanyName
                                });

                                rec.setValue({
                                    fieldId : 'custrecord_2663_entity_acct_no',
                                    value : fullBankAccount
                                });

                                rec.setValue({
                                    fieldId : 'custrecord_2663_entity_file_format',
                                    value : accConfig.getBankFF(),
                                    ignoreFieldChange : true
                                });

                                rec.setValue({
                                    fieldId : 'custrecord_2663_entity_bank_name',
                                    value : dArray[ia].BankName
                                });

                                rec.setValue({
                                    fieldId : 'custrecord_2663_entity_city',
                                    value : dArray[ia].City
                                });
                                rec.setValue({
                                    fieldId : 'custrecord_2663_entity_address1',
                                    value : dArray[ia].Address
                                });

                                var newid = rec.save();
                                log.debug({
                                    title : 'New ID',
                                    details : newid
                                })

                            }
                        }
                    }
                } catch (e) {
                    log.error({title: "After Submit Vendor", details: e.message});
                }
            }
        }

        return {
            beforeLoad: beforeLoad,
            afterSubmit: afterSubmit
        };

    });
