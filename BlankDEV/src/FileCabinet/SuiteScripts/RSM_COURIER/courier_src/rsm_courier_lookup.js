/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
define([ 'N/record', 'N/runtime', 'N/query', 'N/format', './util_courier' ],

    function(record, runtime, query, format, util_courier) {

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
            var masterId = scriptObj.getParameter('custscript_rsm_csdh_lookup_mr_param');

            var subcheck = runtime.isFeatureInEffect({
                feature : 'SUBSIDIARIES'
            });

            var sql_from = " select csdl.custrecord_rsm_csdl_ref_client as v_ref_client"
            sql_from += ",csdh.custrecord_rsm_csdh_subsidiary as v_subsidiary "
            sql_from += ", csdl.id as v_csdlid "
            sql_from += " from customrecord_rsm_csdl csdl join customrecord_rsm_csdh csdh on csdl.custrecord_rsm_csdl_csdh = csdh.id "
            sql_from += " WHERE (NVL2(csdl.custrecord_rsm_csdl_transaction_recog,'T','F') = 'F') AND (csdh.id = ?) "

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

            log.debug('Array', retArr.length);

            return retArr;
        }

        /**
         * Executes when the map entry point is triggered and applies to each
         * key/value pair.
         *
         * @param {MapSummary} context - Data collection containing
         * @since 2015.1
         */
        function map(context) {

            //log.debug("Step > ", context.value);
            var result = JSON.parse(context.value);

            try {
                var l_found;
                l_found = 0;
                var srchBroj = result.v_ref_client;
                var srchSub = result.v_subsidiary;
                var srchData = {};

                if (srchBroj) {
                    srchData = util_courier.lookupREF(srchBroj,srchSub);
                    l_found = srchData.isFound;
                    if (srchData.isFound === 1) {
                        log.debug({
                            title : 'Found',
                            details : srchBroj
                        })
                        record.submitFields({
                            type : 'customrecord_rsm_csdl',
                            id : result.v_csdlid,
                            values : {
                                custrecord_rsm_csdl_action : srchData.custrecord_rsm_csdl_action,
                                custrecord_rsm_csdl_customer : srchData.custrecord_rsm_csdl_customer,
                                custrecord_rsm_csdl_transaction_recog : srchData.custrecord_rsm_csdl_transaction_recog
                            }
                        });

                    }
                }

            } catch (e) {
                log.error({
                    title : 'Error during CSDL lookup',
                    details : JSON.stringify(e)
                })
            }
        }

        /**
         * Executes when the reduce entry point is triggered and applies to each
         * group.
         *
         * @param {ReduceSummary}
         *            context - Data collection containing the groups to process
         *            through the reduce stage
         * @since 2015.1
         */
        function reduce(context) {

        }

        /**
         * Executes when the summarize entry point is triggered and applies to the
         * result set.
         *
         * @param {Summary}
         *            summary - Holds statistics regarding the execution of a
         *            map/reduce script
         * @since 2015.1
         */
        function summarize(summary) {
            log.audit('inputSummary:Usage', summary.inputSummary.usage);
            log.audit('mapSummary:Usage', summary.mapSummary.usage);
            log.audit('reduceSummary:Usage', summary.reduceSummary.usage);
            log.audit('Usage', summary.usage);
        }

        return {
            getInputData : getInputData,
            map : map,
            reduce : reduce,
            summarize : summarize
        };

    });
