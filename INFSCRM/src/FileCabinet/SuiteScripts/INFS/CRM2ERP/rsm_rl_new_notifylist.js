/**
 * @NApiVersion 2.0
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 */
define(['N/record'],

    function (record) {

        const rType = 'customrecord_rsm_cust_notif_param';

        function doGet(requestParams) {
            try {
                const contactRec = record.load({
                    type: rType,
                    id: requestParams.contactid
                });
                return {
                    "result": "ok",
                    "record": contactRec
                }
            } catch (e) {
                return {
                    "result": "error",
                    "message": e.message,
                    "errorName": e.name
                }
            }
        }

/*        function doPut(requestBody) {

        }*/

        function doPost(requestBody) {

            const vCustomer = requestBody.customer;
            const vEmailTo = requestBody.email_to;
            const vEmailCC = requestBody.email_cc || '';
            const vLocations = requestBody.custrecord_rsm_custnp_location || [];
            const vDescription = requestBody.description;

            var errInfo = [];

            if (!vCustomer) {
                return {
                    "result": "error",
                    "message": "customer is required",
                    "errorName": "ERR_REQUIRED"
                }
            }
            if (!vEmailTo) {
                return {
                    "result": "error",
                    "message": "email_to is required",
                    "errorName": "ERR_REQUIRED"
                }
            }
            if (vLocations.length < 1){
                return {
                    "result": "error",
                    "message": "Locations Array is required",
                    "errorName": "ERR_REQUIRED"
                }
            }
            try {

                var newNotify = record.create({
                    type: rType
                });

                newNotify.setValue('custrecord_rsm_custnp_mailto', vEmailTo);
                newNotify.setValue('custrecord_rsm_custnp_mailcc', vEmailCC);
                newNotify.setValue('custrecord_rsm_custnp_customer', vCustomer);
                newNotify.setValue('custrecord_rsm_custnp_description', vDescription);
                newNotify.setValue('custrecord_rsm_custnp_location', vLocations);

                const nId = newNotify.save();

                return {
                    "result": 'ok',
                    "internalid": nId,
                    "errInfo": errInfo
                }
            } catch (e) {
                return {
                    "result": "error",
                    "message": e.message,
                    "errorName": e.name
                }
            }

        }

        function doDelete(requestParams) {
            try {
                record["delete"]({
                    type: rType,
                    id: requestParams.contactid
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
