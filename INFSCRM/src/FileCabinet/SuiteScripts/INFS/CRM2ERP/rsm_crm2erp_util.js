/**
 * @NApiVersion 2.0
 */
define(['N/query', 'N/search', 'N/record'],
    /**
     * @param {query} query
     * @param {search} searchModule
     * @param {record} recordModule
     * @returns {Object}
     */
    function (query, searchModule, recordModule) {
        /**
         * Mapping Currency ISO code to internal ID
         * @param cIsoCode Currency ISO code (RSD, USD, EUR...)
         * @returns {number|*} getCurrencyId
         *
         * @private
         */
        function _getCurrencyId(cIsoCode) {
            var retObj;
            var qResultSet = query.runSuiteQL({
                query: "select id as cid from currency where symbol = ?",
                params: [cIsoCode]
            });

            retObj = qResultSet.asMappedResults()[0].cid;
            return retObj;
        }

        function _getChartOfAccountId(cAccount) {
            var retObj;
            var qResultSet = query.runSuiteQL({
                query: "select id as cid from account where acctnumber = ?",
                params: [cAccount]
            });

            retObj = qResultSet.asMappedResults()[0].cid;
            return retObj;
        }

        function _getTermId(cTerm) {
            var retObj = -1;
            var qResultSet = query.runSuiteQL({
                query : "select id as cid from term where name = ?",
                params: [cTerm]
            });

            var mapResult = qResultSet.asMappedResults();
            if (mapResult.length > 0) {
                retObj = mapResult[0].cid;
            }

            // TODO: da li da vratimo prvi preffered type
            return retObj;
        }

        function _getDeliveryTypeId(cDeliveryType) {
            var retObj = -1;
            var qResultSet = query.runSuiteQL({
                query : "select id as cid from customrecord_rsm_delivery_type where name = ?",
                params: [cDeliveryType]
            });

            var mapResult = qResultSet.asMappedResults();
            if (mapResult.length > 0) {
                retObj = mapResult[0].cid;
            }

            // TODO: da li da vratimo prvi preffered type
            return retObj;
        }

        function _getPayTypeId(cPayType) {
            var retObj = -1;
            var qResultSet = query.runSuiteQL({
                query : "select id as cid from customrecord_rsm_payment_type where name = ?",
                params: [cPayType]
            });

            var mapResult = qResultSet.asMappedResults();
            if (mapResult.length > 0) {
                retObj = mapResult[0].cid;
            }

            return retObj;
        }

        function _getEmailStatusId(cEmailStatus) {
            var retObj = -1;
            var qResultSet = query.runSuiteQL({
                query : "select id as cid from  customlist_rsm_email_schedule_status where name = ?",
                params: [cEmailStatus]
            });

            var mapResult = qResultSet.asMappedResults();
            if (mapResult.length > 0) {
                retObj = mapResult[0].cid;
            }

            return retObj;
        }

        function _getEmailStatusName(cEmailStatusId) {
            var retObj = '';
            var qResultSet = query.runSuiteQL({
                query : "select name as cname from customlist_rsm_email_schedule_status where id = ?",
                params: [cEmailStatusId]
            });

            var mapResult = qResultSet.asMappedResults();
            if (mapResult.length > 0) {
                retObj = mapResult[0].cname;
            }

            return retObj;
        }
        /**
         *
         * @type {_SalesOrderTypes}
         *
         */
        var SalesOrderTypes = {
            load: function(_type_name){
                return new _SalesOrderTypes(_type_name);
            }
        }

        /**
         *
         * @param _type_name
         * @private
         */
        function _SalesOrderTypes(_type_name) {

            var selfThis = this;
            this._sql = " select id, name, custrecord_rsm_sot_create_pdf " +
                " , custrecord_rsm_sot_item_receipt " +
                " , custrecord_rsm_sot_item_fullfilment " +
                " , custrecord_rsm_sot_create_estimates " +
                " , custrecord_rsm_sot_create_invoice " +
                " , custrecord_rsm_sot_create_invpdf " +
                " , custrecord_rsm_sot_invoice_schedule " +
                " , custrecord_rsm_sot_billing_sch " +
                " , custrecord_rsm_sot_email_status " +
                " from customrecord_rsm_so_types "+
                " where name = ?";

            /**
             *
             * @type {Object}
             * @property {number} id
             * @property {string} custrecord_rsm_sot_create_pdf
             * @property {string} custrecord_rsm_sot_item_fullfilment - Opcija da li pravi automatski Item Fullfilment
             * @property {string} custrecord_rsm_sot_item_receipt
             * @property {string} custrecord_rsm_sot_create_estimates
             * @property {string} custrecord_rsm_sot_create_invoice
             * @property {string} custrecord_rsm_sot_create_invpdf
             * @property {string} custrecord_rsm_sot_invoice_schedule
             * @property {number} custrecord_rsm_sot_billing_sch
             * @property {number} custrecord_rsm_sot_email_status
             *
             */
            this._result = {};

            var _temp = query.runSuiteQL(({
                query: selfThis._sql,
                params : [_type_name]
            }));
            this._result = _temp.asMappedResults()[0];

            this.getTypeId = function(){
                return selfThis._result.id;
            }

            this.getCreatePDF = function(){
                return selfThis._result.custrecord_rsm_sot_create_pdf;
            }

            this.getItemReciept = function(){
                return selfThis._result.custrecord_rsm_sot_item_receipt
            }
            this.getItemFullfilment = function(){
                return selfThis._result.custrecord_rsm_sot_item_fullfilment
            }
            this.getCreateEstimates = function(){
                return selfThis._result.custrecord_rsm_sot_create_estimates
            }
            this.getCreateInvoice = function(){
                return selfThis._result.custrecord_rsm_sot_create_invoice
            }
            this.getCreateInvoicePDF = function(){
                return selfThis._result.custrecord_rsm_sot_create_invpdf
            }
            this.getHasBillingSchedule = function(){
                return selfThis._result.custrecord_rsm_sot_invoice_schedule
            }
            this.getBillingSchedule = function(){
                return selfThis._result.custrecord_rsm_sot_billing_sch
            }
            this.getEmailStatus = function(){
                return selfThis._result.custrecord_rsm_sot_email_status
            }
        }


        var AccountConfig = {
            load: function () {
                return new _AccountConfig();
            }
        };

        /**
         * @private
         */
        function _AccountConfig() {
            self = this;
            this._sql = " select custrecord_rsm_crm2erp_item_asset as item_asset " +
                " , custrecord_rsm_crm2erp_item_cogs as item_cogs " +
                " , custrecord_rsm_crm2erp_item_income as item_income " +
                " , custrecord_rsm_crm2erp_service_income as service_income " +
                " , custrecord_rsm_crm2erp_item_tax as item_tax " +
                " , custrecord_rsm_crm2erp_soe_bs as soe_bs " +
                " from customrecord_rsm_account_config ";
            this._result = {};

            var _temp = query.runSuiteQL(({
                query: self._sql
            }));

            this._result = _temp.asMappedResults()[0];
            /**
             * @property {Number} item_asset
             * @returns {Number}
             */
            this.getItemAssetAccount = function () {
                return self._result.item_asset;
            }
            /**
             * @property {Number} item_cogs
             *
             */
            this.getItemCogsAccount = function () {
                return self._result.item_cogs;
            }
            /**
             * @property {Number} item_income
             * @returns {Number}
             */
            this.getItemIncomeAccount = function () {
                return self._result.item_income;
            }
            /**
             * @property {Number} service_income
             * @returns {*}
             */
            this.getServiceIncomeAccount = function () {
                return self._result.service_income;
            }
            /**
             * @property {Number} item_tax
             * @returns {*}
             */
            this.getItemTax = function(){
                return self._result.item_tax;
            }
            /**
             * @property {Number} soe_bs
             * @returns {*}
             */
            this.getSoeBS = function () {
                return self._result.soe_bs;
            }

        }

        /**
         *
         * @param {Array} vArrayVendors
         * @param {Record} newItem
         */
        function _addVendorsToItem(vArrayVendors, newItem){
            var _OneVendor;

            while (newItem.getLineCount({sublistId : 'itemvendor'}) > 0){
                newItem.removeLine({
                    sublistId : 'itemvendor',
                    line : 0
                })
            }

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
        }

        /**
         *
         * @param _orderId Sales Order id
         *
         * @private
         */
        function _getSalesOrderMeta(_orderId){

            var retArr = [];

            var sId = _orderId;

            var mySearchSO = searchModule.create({
                type: searchModule.Type.TRANSACTION,
                columns: [
                    {"name": "trandate"},
                    {"name": "custbody_cust_dep_pdf_file"}
                ],
                filters: [
                    {"name": "internalid", "operator": "is", "values": [sId]},
                    {"name": "mainline", "operator": "is", "values": ["T"]}
                ]
            })

            var myPagedDataSO = mySearchSO.runPaged({
                pageSize: 10
            });
            myPagedDataSO.pageRanges.forEach(function (pageRange) {
                var myPage = myPagedDataSO.fetch({
                    /**
                     * @ {number} pageRange.index
                     */
                    index: pageRange.index
                });

                for (var ix = 0; ix < myPage.data.length; ix++) {
                    retArr.push(myPage.data[ix]);
                }

            });

            var mySearch = searchModule.create({
                type: searchModule.Type.TRANSACTION,
                columns: [
                    {"name": "trandate"},
                    {"name": "custbody_cust_dep_pdf_file"}
                ],
                filters: [
                    {"name": "createdfrom", "operator": "anyof", "values": [sId]},
                    {"name": "mainline", "operator": "is", "values": ["T"]}
                ]
            })

            var myPagedData = mySearch.runPaged({
                pageSize: 10
            });
            myPagedData.pageRanges.forEach(function (pageRange) {
                var myPage = myPagedData.fetch({
                    index: pageRange.index
                });

                for (var ix = 0; ix < myPage.data.length; ix++) {
                    retArr.push(myPage.data[ix]);
                }

            });

            var mySearchSoe = searchModule.create({
                type: 'customsale_rsm_so_estimate',
                columns: [
                    {"name": "trandate"},
                    {"name": "custbody_cust_dep_pdf_file"}
                ],
                filters: [
                    {"name": "custbody_rsm_est_from_so", "operator": "anyof", "values": [sId]},
                    {"name": "mainline", "operator": "is", "values": ["T"]}
                ]
            })

            var myPagedDataSoe = mySearchSoe.runPaged({
                pageSize: 30
            });
            myPagedDataSoe.pageRanges.forEach(function (pageRange) {

                var myPage = myPagedDataSoe.fetch({
                    index: pageRange.index
                });
                for (var ix = 0; ix < myPage.data.length; ix++) {

                    retArr.push(myPage.data[ix]);
                }

            });

            return retArr

        }

        function _SalesOrderToInvoice(_orderId){
            var _inRecord;
            _inRecord = recordModule.transform({
                    fromType: 'salesorder',
                    fromId: _orderId,
                    toType: 'invoice'
                });

            return _inRecord;
        }

        /**
         *
         * @param _vPib
         * @returns {boolean}
         * @private
         */
        function _checkPibExisting(_vPib){

            var _retval = false;

            try {
                var _sql = " select id from customer where (isperson = 'F') and (custentity_pib = ?)";

                var _temp = query.runSuiteQL(({
                    query: _sql,
                    params : [_vPib]
                }));

                var arr = _temp.asMappedResults() || [];

                return arr.length > 0;

            } catch(e) {
                return _retval
            }

        }
        function _checkMatBrExisting(_vMbr){

            var _retval = false;

            try {
                var _sql = " select id from customer where (isperson = 'T') and (custentity_matbrpred = ?)";

                var _temp = query.runSuiteQL(({
                    query: _sql,
                    params : [_vMbr]
                }));

                var arr = _temp.asMappedResults() || [];

                return arr.length > 0;

            } catch(e) {
                return _retval
            }

        }
        return {
            getCurrencyId: _getCurrencyId,
            AccountConfig: AccountConfig,
            SalesOrderType: SalesOrderTypes,
            AddVendorsToItem : _addVendorsToItem,
            GetSalesOrderMeta : _getSalesOrderMeta,
            SalesOrderToInvoice : _SalesOrderToInvoice,
            GetDeliveryTypeId : _getDeliveryTypeId,
            GetPayTypeId : _getPayTypeId,
            GetTermId: _getTermId,
            GetEmailStatusId: _getEmailStatusId,
            GetEmailStatusName: _getEmailStatusName,
            GetChartOfAccountId: _getChartOfAccountId,
            CheckPibExisting : _checkPibExisting,
            CheckMatBrExisting: _checkMatBrExisting
        }


    });
