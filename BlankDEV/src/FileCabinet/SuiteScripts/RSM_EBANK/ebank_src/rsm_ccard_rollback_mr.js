/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/runtime', 'N/query'],

    function (record, runtime, query) {

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
            let scriptObj = runtime.getCurrentScript();
            let masterId = scriptObj.getParameter({name:'custscript_rsm_crdh_rollback_mr_param'});


            let sql_from = "select custrecord_rsm_crdl_transaction as tid, transaction.type as ttype "
                 +  " , BUILTIN.DF(custrecord_rsm_crdl_action) as v_action "
                 + " from customrecord_rsm_crdl crdl join transaction on (transaction.id = custrecord_rsm_crdl_transaction) "
                 + " where (crdl.custrecord_rsm_crdl_crdh = ?) AND (custrecord_rsm_crdl_transaction > 0) ";

            let myPagedResults = query.runSuiteQLPaged({
                pageSize: 1000,
                query: sql_from,
                params: [masterId]
            });

            let retArr = [];
            let iterator = myPagedResults.iterator();

            iterator.each(function (resultPage) {
                let currentPage = resultPage.value;
                let theData = currentPage.data.asMappedResults();
                for (let a = 0; a < theData.length; a++) {
                    retArr.push(theData[a]);
                }
                return true;
            });

            log.debug({title:"Array",details:retArr.length});

            return retArr;

        }

        /**
         * Executes when the map entry point is triggered and applies to each
         * key/value pair.
         *
         * @param {MapSummary} context - Data collection containing the key/value pairs to process through the map stage
         * @param {string} context.value
         *
         * @since 2015.1
         */
        function map(context) {
            /**
             *
             * @type {object}
             * @property {string} ttype
             * @property {number} tid
             */
            let result = JSON.parse(context.value);
            log.debug({
              title : 'Map Result',
              details : result
            });
            try {

                if (result.ttype === "CustDep") {

                    record["delete"]({
                        type: record.Type.CUSTOMER_DEPOSIT,
                        id: result.tid
                    })
                }
                //CustPymt
                if (result.ttype === "CustPymt") {

                    record["delete"]({
                        type: record.Type.CUSTOMER_PAYMENT,
                        id: result.tid
                    })
                }

            } catch (e) {
                log.error({title:"Rollback delete error",details:e});
                log.error({title:"Rollback error for ",details:result});
            }
        }

        /**
         * Executes when the reduce entry point is triggered and applies to each
         * group.
         *
         * @param {ReduceSummary} context - Data collection containing the groups to process through the reduce stage
         * @since 2015.1
         */
        function reduce(context) {

        }

        /**
         * Executes when the summarize entry point is triggered and applies to the
         * result set.
         *
         * @param {Summary} summary - Holds statistics regarding the execution of a map/reduce script
         * @param {number} summary.mapSummary.usage
         * @param {number} summary.reduceSummary.usage
         * @since 2015.1
         */
        function summarize(summary) {
            log.audit({title:"inputSummary:Usage",details:summary.inputSummary.usage});
            log.audit({title:'mapSummary:Usage', details:summary.mapSummary.usage});
            log.audit({title:'reduceSummary:Usage', details:summary.reduceSummary.usage});
            log.audit({title:'Usage', details:summary.usage});
        }

        return {
            getInputData: getInputData,
            map: map,
            reduce: reduce,
            summarize: summarize
        };

    });
