/**
 * @NApiVersion 2.0
 * @NScriptType ClientScript
 */

define(["N/https", "N/xml", "N/currentRecord", "N/ui/message", "./util_nbs", "./rsm_config_util", 'N/ui/dialog', 'N/record'],
    function (
        https,
        xml,
        currentRecord,
        message,
        util_nbs,
        rsm_config,
        dialog,
        recordModule) {

        var vendCurrRecord = currentRecord.get();

        var accountNumber = "";
        var nationalIdentificationNumber = "";
        var taxIdentificationNumber = "";

        function getValueFromNodeByTagName(xml, tagName) {
            var elements = xml.getElementsByTagName(tagName)[0];
            var nodes = elements.childNodes[0];
            return nodes.nodeValue;
        }

        function handleRequest() {

            var accConfig = rsm_config.AccountConfig.load();

            var vendId = vendCurrRecord.id;
            var vendRecord = recordModule.load({
                type : recordModule.Type.VENDOR,
                id : vendId
            });

            var existingAccArray = util_nbs.getBank2663Detail(vendId);

            nationalIdentificationNumber = vendRecord.getValue({
                fieldId: "custentity_matbrpred"
            });

            taxIdentificationNumber = vendRecord.getValue({
                fieldId: "custentity_pib"
            });

            var queryTag = util_nbs.generateQueryTag({
                "accountNumber": '',
                "nationalIdentificationNumber": nationalIdentificationNumber,
                "taxIdentificationNumber": taxIdentificationNumber
            });

            if (!queryTag) {
                var errorMessage = message.create({
                    title: "Error",
                    message:
                        "Molim vas unesite jedan od parametara za pretragu (PIB, matični broj, broj računa).",
                    type: message.Type.ERROR
                });

                errorMessage.show({
                    duration: 5000
                });

                return null;
            }

            // var body = '' vratiti iz util_nbs, ako zapne

            var body = util_nbs.generateXmlBody(queryTag);

            var headerObj = {
                name: "Content-Type",
                value: "application/soap+xml; charset=utf-8"
            };

            https.post.promise({
                url: "https://webservices.nbs.rs/CommunicationOfficeService1_0/CompanyAccountXmlService.asmx",
                body: body,
                headers: headerObj
            }).then(
                function (response) {

                    var xmlDocument = xml.Parser.fromString({
                        text: util_nbs.unescapeXml(response.body)
                    });

                    var dArray = util_nbs.parseXmlForCompanyAccounts(xmlDocument);
                    var noviArray = [];

                    if (dArray.length > 0) {

                        for (var ia = 0; ia < dArray.length; ia++) {

                            var fullBankAccount = util_nbs.buildFullBankAccount({
                                "BankCode": dArray[ia].BankCode,
                                "AccountNumber": dArray[ia].AccountNumber,
                                "ControlNumber": dArray[ia].ControlNumber
                            });

                            var l_novi = true;
                            var trNovi = {};
                            var l_lc = existingAccArray.length;

                            for (var lc = 0; lc < l_lc && l_novi; lc++) {
                                var l_value = existingAccArray[lc].vbankacc;
                                if (fullBankAccount === l_value) {
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
                                console.log('Newid : '+newid);
                            }
                        }
                    }

                    if (!taxIdentificationNumber) {
                        taxIdentificationNumber = getValueFromNodeByTagName(
                            xmlDocument,
                            "TaxIdentificationNumber"
                        );
                        vendRecord.setValue({
                            fieldId: "custentity_pib",
                            value: taxIdentificationNumber.trim() // nbs is adding spaces for some
                                                                  // reason
                        });
                    }
                    var confirmationMessage = message.create({
                        type: message.Type.CONFIRMATION,
                        title: "Confirmation",
                        message: "Podaci o privrednom društvu su uspešno pronađeni i popunjeni."

                    });

                    confirmationMessage.show({
                        duration: 5000
                    });
                    window.location.reload(true);
                }
            ).catch(function onRejected(reason) {
                var errorMessage = message.create({
                    title: "Error",
                    message:
                        "Nije pronađeno ni jedno privredno društvo za zadate parametre. Molim vas proverite parametre i pokušajte ponovo.",
                    type: message.Type.ERROR
                });

                errorMessage.show({
                    duration: 5000
                });
            });
        }

        function pageInit() {
            console.log("Page Init - Vendor");
        }

        return {
            pageInit: pageInit,
            nbsPretraga: handleRequest
        };
    })
;
