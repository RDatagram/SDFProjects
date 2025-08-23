/**
 * @NApiVersion 2.0
 */
define(['N/query'],
    /**
     * @param{query} query
     */
    function (query) {

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
                    this._sql = " select custrecord_rsm_vendor_bank_file as bank_ff " +
                        " from customrecord_rsm_account_config ";
                    this._result = {};

                    var _temp = query.runSuiteQL(({
                            query: self._sql
                    }));

                    this._result = _temp.asMappedResults()[0];
                    /**
                     * @property {Number} bank_ff
                     * @returns {Number}
                     */
                    this.getBankFF = function () {
                            return self._result.bank_ff;
                    }

            }

            return {
                    AccountConfig: AccountConfig
            }


    });