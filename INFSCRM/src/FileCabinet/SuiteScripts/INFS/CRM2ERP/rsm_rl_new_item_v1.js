/**
 * @NApiVersion 2.0
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 */
define(["N/record","./rsm_crm2erp_util"],

    function (record, crm2erp_util) {

        /**
         * Function called upon sending a POST request to the RESTlet.
         *
         * @param {string | Object} requestBody
         * @param {string} requestBody.externalid
         * @param {string} requestBody.itemid
         * @param {string} requestBody.displayname
         * @param {string} requestBody.unitstype
         * @param {number} requestBody.subsidiary
         * @param {record.Type} requestBody.itemtype [inventoryitem, service]
         * @param {boolean} requestBody.isspecialorderitem
         * @param {string} requestBody.custitem_rsm_item_cai_broj
         * @param {Array} requestBody.vendors
         *
         * @returns {string | Object} HTTP response body; return string when request
         *          Content-Type is 'text/plain'; return Object when request
         *          Content-Type is 'application/json'
         * @since 2015.2
         */
        function doPost(requestBody) {

            var accConfig = crm2erp_util.AccountConfig.load();

            const vExternalId = requestBody.externalid;
            if (!vExternalId) {
                return {
                    "result": "error",
                    "message": "External ID je obavezan"
                }
            }
            var vItemId = requestBody.itemid;
            if (!vItemId) {
                return {
                    "result": "error",
                    "message": "Item ID je obavezan"
                }
            }
            var vDisplayName = requestBody.displayname;
            var vUnitsType = requestBody.unitstype;

            var vSubsidiary = requestBody.subsidiary;
            var vItemType = requestBody.itemtype;
            var vCaiBroj = requestBody.custitem_rsm_item_cai_broj || '';

            var vIsspecialorderitem = requestBody.isspecialorderitem || false;
            var vArrayVendors = requestBody.vendors || [];

            /**
             * SERVICE_ITEM = 'serviceitem';
             * INVENTORY_ITEM = 'inventoryitem';
             */
            if (!vItemType) {
                return {
                    "result": "error",
                    "message": "itemtype je obavezan : inventoryitem, serviceitem"
                }
            }
            if ((vIsspecialorderitem) && (vArrayVendors.length === 0)){
                return {
                    "result" : "error",
                    "message" : "Special Order Item zahteva Vendor listu"
                }
            }

            try {

                /** @var {record.Type} vRecordType */

                var vRecordType;
                switch (vItemType) {
                    case 'inventoryitem' : {
                        vRecordType = record.Type.INVENTORY_ITEM;
                        break;
                    }
                    case 'serviceitem' : {
                        vRecordType = record.Type.SERVICE_ITEM;
                        break
                    }
                    default : {
                        vRecordType = null;
                    }
                }
                if (!vRecordType) {
                    throw {
                        "message": "Invalid item type"
                    }
                }

                var newItem = record.create({
                    type: vRecordType,
                    isDynamic: true
                });

                newItem.setValue('externalid', vExternalId);
                newItem.setValue('itemid', vItemId);
                newItem.setValue('displayname', vDisplayName);

                newItem.setValue('unitstype', vUnitsType);
                newItem.setValue('subsidiary', vSubsidiary);

                switch (vRecordType) {
                    case record.Type.INVENTORY_ITEM : {
                        newItem.setValue('assetaccount', accConfig.getItemAssetAccount());
                        newItem.setValue('cogsaccount', accConfig.getItemCogsAccount());
                        newItem.setValue('incomeaccount', accConfig.getItemIncomeAccount());
                        break;
                    }
                    case record.Type.SERVICE_ITEM : {
                        newItem.setValue('incomeaccount', accConfig.getServiceIncomeAccount());
                        break;
                    }
                }

                newItem.setValue('taxschedule', accConfig.getItemTax());

                /**
                 * @var {Object} _OneVendor
                 * @property {number} vendorid
                 * @property {boolean} preferred
                 * @property {number} purchaseprice
                 *
                 */
                var _OneVendor;
                if (vIsspecialorderitem) {

                    for (var iv = 0; iv < vArrayVendors.length;iv++) {

                        _OneVendor = vArrayVendors[iv];

                        newItem.selectNewLine({
                            sublistId: 'itemvendor'
                        });
                        newItem.setCurrentSublistValue({
                            sublistId: 'itemvendor',
                            fieldId: 'vendor',
                            value: _OneVendor.vendorid
                        });
                        newItem.setCurrentSublistValue({
                            sublistId: 'itemvendor',
                            fieldId: 'preferredvendor',
                            value: _OneVendor.preferred
                        });
                        newItem.setCurrentSublistValue({
                            sublistId: 'itemvendor',
                            fieldId: 'purchaseprice',
                            value: _OneVendor.purchaseprice
                        });
                        newItem.setCurrentSublistValue({
                            sublistId : 'itemvendor',
                            fieldId: 'subsidiary',
                            value: _OneVendor.subsidiary
                        })
                        newItem.commitLine({
                            sublistId: 'itemvendor'
                        });

                    }
                    newItem.setValue('isspecialorderitem', true);
                    newItem.setValue('matchbilltoreceipt', true);
                }
                if (vCaiBroj) {
                    newItem.setValue('custitem_rsm_item_cai_broj', vCaiBroj);
                }

                const nId = newItem.save();

                return {
                    "result": 'ok',
                    "internalid": nId
                }
            } catch (e) {
                return {
                    "result": "error",
                    "message": e.message
                }
            }
        }

        /***
         *
         * @param requestParams
         *
         * @param {string} requestParams.itemtype - inventoryitem
         * @param {number} requestParams.cid - Internal ID
         *
         * @returns {{result: string}|{result: string, errorName, message}}
         */
        function doDelete(requestParams) {
            try {
                record.delete({
                    type: requestParams.itemtype,
                    id: requestParams.cid
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

        /***
         *
         * @param requestParams
         * @param requestParams.itemtype
         * @param requestParams.cid
         */
        function doGet(requestParams) {
            try {
                var custRec = record.load({
                    type: requestParams.itemtype,
                    id: requestParams.cid
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

        return {
            post: doPost,
            'delete': doDelete,
            get: doGet
        };

    });
