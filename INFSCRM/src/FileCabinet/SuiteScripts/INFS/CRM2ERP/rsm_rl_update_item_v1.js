/**
 * @NApiVersion 2.0
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 */

define(['N/record', './rsm_crm2erp_util'],

    function (recordModule, crm2erp_util) {

        /**
         * @param requestBody
         * @param requestBody.itemtype
         * @param requestBody.internalid
         * @param requestBody.submethod
         * @param requestBody.vendors
         *
         */
        function doPost(requestBody) {

            var _id, _itemType, _sub;

            var _arrbody = requestBody || [];

            for (var _i = 0; _i < _arrbody.length; _i++) {

                var _item = _arrbody[_i];

                _sub = _item.submethod;
                _itemType = _item.itemtype;
                _id = _item.internalid;

                var vRecordType;
                switch (_itemType) {
                    case 'inventoryitem' : {
                        vRecordType = recordModule.Type.INVENTORY_ITEM;
                        break;
                    }
                    case 'serviceitem' : {
                        vRecordType = recordModule.Type.SERVICE_ITEM;
                        break
                    }
                    default : {
                        vRecordType = null;
                    }
                }

                var itemRecord = recordModule.load({
                    type: vRecordType,
                    id: _id,
                    isDynamic: true
                });

                if (_sub === 'ADDVENDOR') {
                    var vArrayVendors = _item.vendors || [];
                    crm2erp_util.AddVendorsToItem(vArrayVendors, itemRecord);
                    itemRecord.save();
                }
            }

            return {
                "result": "ok"
            }

        }

        return {
            post: doPost
        }
    }
)