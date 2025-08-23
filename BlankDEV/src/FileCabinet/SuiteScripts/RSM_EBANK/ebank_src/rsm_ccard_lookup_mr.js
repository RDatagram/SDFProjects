/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
define([ 'N/record', 'N/runtime', 'N/query', 'N/format', './util_ccard' ],

    function(record, runtime, query, format, util_ccard) {

        /**
         * Marks the beginning of the Map/Reduce process and generates input data.
         *
         * @typedef {Object} ObjectRef
         * @property {number} id - Internal ID of the record instance
         * @property {string} type - Record type id
         *
         * @return {Array|Object|Search|RecordRef} inputSummary
         * @since 2015.1
         */
        function getInputData() {

            // custscript_rsm_bstmt_payments_id
            var scriptObj = runtime.getCurrentScript();
            var masterId = scriptObj.getParameter({name : 'custscript_rsm_crdh_lookup_mr_param'});

            var subcheck = runtime.isFeatureInEffect({
                feature : 'SUBSIDIARIES'
            });

            if (!subcheck){
                return [];
            }

            var sql_from = " select crdl.custrecord_rsm_crdl_broj_aut as v_broj_aut"
            sql_from += ",crdh.custrecord_rsm_crdh_subsidiary as v_subsidiary "
            sql_from += ", crdl.id as v_crdlid "
            sql_from += " from customrecord_rsm_crdl crdl join customrecord_rsm_crdh crdh on crdl.custrecord_rsm_crdl_crdh = crdh.id "
            sql_from += " WHERE (NVL2(crdl.custrecord_rsm_crdl_transaction_recog,'T','F') = 'F') AND (crdh.id = ?) "

            var myPagedResults = query.runSuiteQLPaged({
                pageSize : 1000,
                query : sql_from,
                params : [ masterId ]
            });

            var retArr = [];
            var iterator = myPagedResults.iterator();

            iterator.each(function(resultPage) {
                var currentPage = resultPage.value;
                var theData = currentPage.data.asMappedResults();
                for (var a = 0; a < theData.length; a++) {
                    retArr.push(theData[a]);
                }
                return true;
            });

            log.debug({title:'Array',details:retArr.length});

            return retArr;
        }

        /**
         * Executes when the map entry point is triggered and applies to each
         * key/value pair.
         *
         * @param {MapSummary} context - Data collection containing
         * @param {string} context.value
         * @since 2015.1
         */
        function map(context) {

            //log.debug("Step > ", context.value);
            /**
             *
             * @type {any}
             * @property {string} v_broj_aut
             * @property {string} v_subsidiary
             * @property {string} v_crdlid
             *
             */
            var result = JSON.parse(context.value);

            try {

                var srchBroj = result.v_broj_aut;
                var srchSub = result.v_subsidiary;
                var srchData = {};

                if (srchBroj) {
                    srchData = util_ccard.lookupREF(srchBroj,srchSub);

                    if (srchData.isFound === 1) {
                        log.debug({
                            title : 'Found',
                            details : srchData
                        })
                        record.submitFields({
                            type : 'customrecord_rsm_crdl',
                            id : result.v_crdlid,
                            values : {
                                custrecord_rsm_crdl_action : srchData.custrecord_rsm_crdl_action,
                                custrecord_rsm_crdl_customer : srchData.custrecord_rsm_crdl_customer,
                                custrecord_rsm_crdl_transaction_recog : srchData.custrecord_rsm_crdl_transaction_recog
                            }
                        });

                    }
                }

            } catch (e) {
                log.error({
                    title : 'Error during CRDL lookup',
                    details : JSON.stringify(e)
                })
            }
        }

        /**
         * Executes when the reduce entry point is triggered and applies to each
         * group.
         *
         * @param {ReduceSummary}  context - Data collection containing the groups to process
         * @since 2015.1
         *
         */
        function reduce(context) {

        }

        /**
         * Executes when the summarize entry point is triggered and applies to the
         * result set.
         *
         * @param {Summary} summary - Holds statistics regarding the execution of a
         *
         * @since 2015.1
         */
        function summarize(summary) {
            log.audit({ title : 'inputSummary:Usage', details: summary.inputSummary.usage});
            log.audit({ title : 'mapSummary:Usage', details:summary.mapSummary.usage});
            log.audit({ title : 'reduceSummary:Usage', details:summary.reduceSummary.usage});
            log.audit({ title : 'Usage', details:summary.usage});
        }

        return {
            getInputData : getInputData,
            map : map,
            reduce : reduce,
            summarize : summarize
        };

    });
