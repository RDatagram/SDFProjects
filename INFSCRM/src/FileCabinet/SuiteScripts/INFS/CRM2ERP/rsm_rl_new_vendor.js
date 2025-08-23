/**
 * @NApiVersion 2.0
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 */
define(['N/record', './rsm_crm2erp_util'],

    function (record, rsm_crm2erp) {

        function doGet(requestParams) {
            try {
                var custRec = record.load({
                    type: 'vendor',
                    id: requestParams.vendorid
                });
                return {
                    "result": "ok",
                    "record": custRec
                }
            } catch (e) {
                return {
                    "result": "error",
                    "message": e.message,
                    "errorName": e.name
                }
            }
        }

        /**
         *
         * @param {Object}  requestBody
         * @param {number}  requestBody.companyname
         * @param {number}  requestBody.subsidiary
         * @param {number}  requestBody.externalid
         * @param {string}  requestBody.custentity_matbrpred - Maticni broj
         * @param {string}  requestBody.custentity_pib - VAT number
         * @param {boolean} requestBody.custentity_cus_inokupac - INO
         * @param {string}  requestBody.email - Primary eMail vendor
         * @param {Array}  requestBody.address - Vendor address
         * @param {string}  requestBody.currency - ISO Code
         * @param {string}  requestBody.phone - Main phone
         * @param {string}  requestBody.altphone - Alternate phone
         *
         * @param {url} requestBody.url - web address
         * @param {number} requestBody.payableaccount - Payable account
         *
         * @returns {{result: string, internalid: (*|number), errInfo: []}|{result: string, errorName, message}}
         */
        function doPost(requestBody) {

            var vCustName = requestBody.companyname;
            var vSubsidiary = requestBody.subsidiary;
            var vExtId = requestBody.externalid;
            var vCustEntity_matbrpred = requestBody.custentity_matbrpred || '';
            var vCustEntity_pib = requestBody.custentity_pib || '';
            var vCustEntity_cus_inokupac = requestBody.custentity_cus_inokupac || false;

            var vEmail = requestBody.email || '';
            var vWeb = requestBody.url || ''; // allowed only for company

            var vPayableAccount = requestBody.payableaccount; // default 1630

            var vAddress = requestBody.address;
            const vCurrency = requestBody.currency;

            var vCurrencyID;
            if (vCurrency) {
                vCurrencyID = rsm_crm2erp.getCurrencyId(vCurrency);
            }

            var errInfo = [];

            /**
             * HELPER FUNCTION
             * Avoid rejecting create customer for "nebitna" fields with NetSuite validation like: weburl, email,
             */
            function trySetValue(recObj, fieldId, value) {

                // Privremeno izbacen try..catch .. ako se na kraju opredelimo da ipak bude..
                recObj.setValue(fieldId, value);

            }

            try {
                var newVend = record.create({
                    type: record.Type.CUSTOMER,
                    isDynamic: true
                });


                newVend.setValue('companyname', vCustName);
                trySetValue(newVend, 'url', vWeb);

                newVend.setValue('subsidiary', vSubsidiary);

                if (vExtId) {
                    newVend.setValue('externalid', vExtId);
                }

                newVend.setValue('custentity_matbrpred', vCustEntity_matbrpred);
                newVend.setValue('custentity_pib', vCustEntity_pib);
                newVend.setValue('custentity_cus_inokupac', vCustEntity_cus_inokupac);

                trySetValue(newVend, 'phone', requestBody.phone || '');
                trySetValue(newVend, 'altphone', requestBody.altphone || '');

                if (vCurrencyID) {
                    trySetValue(newVend, 'currency', vCurrencyID);
                }
                newVend.setValue('receivableaccount', vPayableAccount);

                trySetValue(newVend, 'email', vEmail);

                /**
                 * Address
                 * @property {string} vAddress.label
                 * @property {number} vAddress.country
                 * @property {number} vAddress.city
                 * @property {number} vAddress.addr1
                 * @property {number} vAddress.addr2
                 * @property {string} vAddress.zip
                 *
                 */
                if (vAddress) {
                    for (var ix = 0; ix < vAddress.length; ix++) {

                        newVend.selectNewLine({
                            sublistId: 'addressbook'
                        });

                        newVend.setCurrentSublistValue({
                            sublistId: 'addressbook',
                            fieldId: 'label',
                            value: vAddress[ix].label
                        });

                        var subrec = newVend.getCurrentSublistSubrecord({
                            sublistId: 'addressbook',
                            fieldId: 'addressbookaddress'
                        });

                        subrec.setValue({
                            fieldId: 'country',
                            value: vAddress[ix].country
                        });

                        subrec.setValue({
                            fieldId: 'city',
                            value: vAddress[ix].city || ''
                        });
                        subrec.setValue({
                            fieldId: 'zip',
                            value: vAddress[ix].zip || ''
                        });
                        subrec.setValue({
                            fieldId: 'addr1',
                            value: vAddress[ix].addr1 || ''
                        });
                        subrec.setValue({
                            fieldId: 'addr2',
                            value: vAddress[ix].addr2 || ''
                        });
                        newVend.commitLine({
                            sublistId: 'addressbook'
                        });
                    }

                }

                var nId = newVend.save({
                    enableSourcing: true,
                    ignoreMandatoryFields: true
                });


                return {
                    "result": 'ok',
                    "internalid": nId,
                    "errInfo": errInfo
                }

            } catch (e) {
                log.error({title:'Error', details:JSON.stringify(e)});
                return {
                    "result": "error",
                    "message": e.message,
                    "errorName": e.name
                }
            }
        }

        /**
         * Function called upon sending a DELETE request to the RESTlet.
         *
         * @param {Object} requestParams - Parameters from HTTP request URL
         * @param {number} requestParams.vendorid Vendor Internal ID

         * @returns {string | Object} HTTP response body; return string when request
         *          Content-Type is 'text/plain'; return Object when request
         *          Content-Type is 'application/json'
         */
        function doDelete(requestParams) {
            try {
                record["delete"]({
                    type: 'vendor',
                    id: requestParams.vendorid
                });
                return {
                    "result": "ok"
                }
            } catch (e) {
                return {
                    "result": "error",
                    "message": e.message,
                    "errorName": e.name
                }
            }
        }

        return {
            'get': doGet,
            'post': doPost,
            'delete': doDelete
        };

    });
