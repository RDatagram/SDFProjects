/**
 * @NApiVersion 2.0
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 */
define([ 'N/record' ],

    function(record) {

        /**
         *
         * @param requestParams
         * @param requestParams.customerid
         *
         * @returns {{result: string, errorName, message}|{result: string, record: Record}}
         */

        /**
         *
         * @param requestBody
         * @param requestBody.companyname
         * @param requestBody.internalid
         * @param requestBody.isindividual
         * @param requestBody.address
         *
         * @returns {{result: string, internalid: (*|number), errInfo: *[]}|{result: string, errorName, message}}
         */
        function doPost(requestBody) {

            var vCustName = requestBody.companyname || '';
            var vId = requestBody.internalid;
            var vIsIndividual = requestBody.isindividual;

            var vAddress = requestBody.address;

            var errInfo = [];

            try {
                var newCust = record.load({
                    type : record.Type.CUSTOMER,
                    id : vId,
                    isDynamic : true
                });

                if (vCustName) {
                    if (vIsIndividual) {
                        // Individual
                        newCust.setValue('firstname', vCustName);

                    } else {
                        // Company
                        newCust.setValue('companyname', vCustName);
                    }
                }


                /**
                 * Address
                 */
                if (vAddress) {

                    /*
                     * DELETE ALL OLD ADDRESS
                     */

                    while (newCust.getLineCount({sublistId : 'addressbook'}) > 0){
                        newCust.removeLine({
                            sublistId : 'addressbook',
                            line : 0
                        })
                    }

                    for (var ix = 0; ix < vAddress.length; ix++) {

                        newCust.selectNewLine({
                            sublistId : 'addressbook'
                        });

                        newCust.setCurrentSublistValue({
                            sublistId : 'addressbook',
                            fieldId : 'label',
                            value : vAddress[ix].label
                        });

                        var subrec = newCust.getCurrentSublistSubrecord({
                            sublistId : 'addressbook',
                            fieldId : 'addressbookaddress'
                        });

                        subrec.setValue({
                            fieldId : 'country',
                            value : vAddress[ix].country
                        });

                        subrec.setValue({
                            fieldId : 'city',
                            value : vAddress[ix].city || ''
                        });
                        subrec.setValue({
                            fieldId : 'zip',
                            value : vAddress[ix].zip || ''
                        });
                        subrec.setValue({
                            fieldId : 'addr1',
                            value : vAddress[ix].addr1 || ''
                        });
                        subrec.setValue({
                            fieldId : 'addr2',
                            value : vAddress[ix].addr2 || ''
                        });
                        newCust.commitLine({
                            sublistId : 'addressbook'
                        });
                    }

                }

                var nId = newCust.save({
                    enableSourcing : true,
                    ignoreMandatoryFields : true
                });

                return {
                    "result" : 'ok',
                    "internalid" : nId,
                    "errInfo" : errInfo
                }

            } catch (e) {
                log.error( {title: 'Error', details:JSON.stringify(e)} );
                return {
                    "result" : "error",
                    "message" : e.message,
                    "errorName" : e.name
                }
            }
        }

        return {
            post : doPost,
        };

    });
