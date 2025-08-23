/**
 * @NApiVersion 2.0
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */

/* CHANGES :
- check if transaction.currency <> statement.currency
=> equal, do transform (applying)
=> diff, create payment for customer without applying to transaction, use currency from statment
 */

define([ 'N/search', 'N/record', 'N/runtime', 'N/query', 'N/format' ],

    function(search, record, runtime, query, format) {

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


            var scriptObj = runtime.getCurrentScript();
            var masterId = scriptObj.getParameter({name:'custscript_rsm_ccard_payment_mr_id'});
            log.debug({title:"masterId",details:masterId});

            var sql_from = "select crdl.custrecord_rsm_crdl_customer as v_customer "
                 + ", crdl.custrecord_rsm_crdl_bruto as v_amount "
                 + ", NVL2(crdl.custrecord_rsm_crdl_broj_kartice,crdl.custrecord_rsm_crdl_broj_kartice,'') as v_memo "
                 + ", crdh.custrecord_rsm_crdh_subsidiary as v_subsidiary "
                 + ", crdh.custrecord_rsm_crdh_bank_account as v_coabank "
                 + ", crdh.custrecord_rsm_crdh_currency as v_currency "
                 + ", crdh.custrecord_rsm_crdh_date as v_trandate "
                 + ", crdl.id as v_crdlid "
                 + ", BUILTIN.DF(custrecord_rsm_crdl_action) as v_action "
                 + ", jcust.receivablesaccount as v_aracct "
                 + ", (NVL2(crdl.custrecord_rsm_crdl_transaction_recog, crdl.custrecord_rsm_crdl_transaction_recog, -1)) as v_tran_recog "
                 + " from customrecord_rsm_crdl crdl join customrecord_rsm_crdh crdh on crdl.custrecord_rsm_crdl_crdh = crdh.id "
                 + " join customer jcust on jcust.id = crdl.custrecord_rsm_crdl_customer "
                 + " where (NVL2(custrecord_rsm_crdl_transaction,'T','F') = 'F' ) AND (crdh.id = ?)";

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

            //log.debug('Array', retArr.length);

            return retArr;
        }

        /**
         * Executes when the map entry point is triggered and applies to each
         * key/value pair.
         *
         * @param {MapSummary}  context - Data collection containing the key/value pairs to
         * @param {string} context.value
         *
         * @since 2015.1
         */
        function map(context) {

            log.debug({title : "Step >", details : context.value})

            var userObj = runtime.getCurrentUser();
            var vSystemAR = userObj.getPreference({
                name : 'ARACCOUNT'
            });
            var subcheck = runtime.isFeatureInEffect({
                feature : 'SUBSIDIARIES'
            });
            var hasTranRecog;

            /***
             *
             * @type {any}
             * @property v_action
             * @property v_aracct
             * @property v_customer
             * @property v_currency
             * @property v_coabank
             * @property v_memo
             * @property v_amount
             * @property v_trandate
             * @property v_tran_recog
             *
             */
            var result = JSON.parse(context.value);

            /**
             * create customer payments
             */
            var idCpRec;
            if (result.v_action === 'PAYMENT') {

                try {
                    hasTranRecog = (result.v_tran_recog != -1);

                    var toTransform = false;
                    if (hasTranRecog) {


                        var sql_type = " select type, currency from transaction where id = ? ";
                        var results_type = query.runSuiteQL({
                            query : sql_type,
                            params : [ result.v_tran_recog ]
                        });
                        var objdata = results_type.asMappedResults();
                        for (var vo = 0; vo < objdata.length; vo++) {
                            if ((objdata[vo]["type"] === 'CustInvc') && (objdata[vo]["currency"] === result.v_currency)) {
                                toTransform = true;
                            }
                        }
                    }

                    var cpRec;

                    if (toTransform) {
                        log.debug({title:'step', details:'ToTransform'});
                        cpRec = record.transform({
                            fromType : 'invoice',
                            fromId : result.v_tran_recog,
                            toType : 'customerpayment',
                            isDynamic : true
                        });

                        cpRec.setValue('undepfunds', 'F');
                        cpRec.setValue('account', result.v_coabank);

                    } else {
                        log.debug({title : 'step', details : 'Create'});
                        cpRec = record.create({
                            type : 'customerpayment',
                            isDynamic : true
                        });

                        log.debug({title:"customer",details:result.v_customer});
                        cpRec.setValue('customer', result.v_customer);

                        if (result.v_aracct == -10) {
                            log.debug({title: "vSystemAR", details: vSystemAR});
                            cpRec.setValue('arracct', vSystemAR); // Use system
                        } else {
                            log.debug({title: "v_arract", details: result.v_aracct});
                            cpRec.setValue('aracct', result.v_aracct); // A/R
                        }

                        if (subcheck) {
                            log.debug({title:"subsidiary",details: result.v_subsidiary});
                            cpRec.setValue('subsidiary', result.v_subsidiary);
                        }

                        cpRec.setValue('currency', result.v_currency);
                        cpRec.setValue('undepfunds', 'F');
                        cpRec.setValue('account', result.v_coabank);

                        cpRec.setValue('autoapply', false);
                    }

                    cpRec.setValue('trandate', format.parse({
                        value : result.v_trandate,
                        type : format.Type.DATE,
                        timezone : format.Timezone.EUROPE_BUDAPEST
                    }));

                    cpRec.setValue('payment', result.v_amount);
                    cpRec.setValue('memo', result.v_memo);

                    if (toTransform) {

                        var lAmount = cpRec.getCurrentSublistValue({
                            sublistId : 'apply',
                            fieldId : 'amount'
                        });

                        var lPayment = cpRec.getValue({
                            fieldId : 'payment'
                        });

                        if (lAmount > lPayment) {
                            cpRec.setCurrentSublistValue({
                                sublistId : 'apply',
                                fieldId : 'amount',
                                value : lPayment
                            })
                        }
                    }

                    idCpRec = cpRec.save();

                    record.submitFields({
                        type : 'customerpayment',
                        id : idCpRec,
                        values : {
                            'checknum' : "# " + cpRec.getValue('tranid')
                        }
                    })
                    var id = record.submitFields({
                        type : 'customrecord_rsm_crdl',
                        id : result.v_crdlid,
                        values : {
                            'custrecord_rsm_crdl_transaction' : idCpRec
                        },
                        options : {
                            enableSourcing : false,
                            ignoreMandatoryFields : true
                        }
                    });
                } catch (e) {
                    log.error({title:"Error" + result.v_customer, details : e.message});
                }
                log.debug({title : 'cpRec id', details : idCpRec});
            }

            if (result.v_action === 'DEPOSIT') {
                var scriptObj = runtime.getCurrentScript();
                var taxCodeId = scriptObj.getParameter({name:'custscript_rsm_ccard_deposit_tax'});

                try {

                    hasTranRecog = (result.v_tran_recog != -1);

                    var cpRec = record.create({
                        type : 'customerdeposit',
                        isDynamic : true
                    });

                    cpRec.setValue('customer', result.v_customer);

                    if (subcheck) {
                        cpRec.setValue('subsidiary', result.v_subsidiary);
                    }

                    cpRec.setValue('currency', result.v_currency);
                    cpRec.setValue('trandate', format.parse({
                        value : result.v_trandate,
                        type : format.Type.DATE,
                        timezone : format.Timezone.EUROPE_BUDAPEST
                    }));

                    cpRec.setValue('account', result.v_coabank);
                    cpRec.setValue('payment', result.v_amount);
                    cpRec.setValue('memo', result.v_memo);
                    cpRec.setValue('custbody_poreski_kod_cust_dep_rsm', taxCodeId); // PARAMETAR!!!

                    // cpRec.setValue('salesorder', result.v_salesorder);

                    if (hasTranRecog) {
                        var soField = cpRec.getField({
                            "fieldId" : "salesorder"
                        });
                        var soArray = soField.getSelectOptions();

                        for (var sio = 0; sio < soArray.length; sio++) {
                            if (soArray[sio].value === result.v_tran_recog) {
                                cpRec.setValue('salesorder', result.v_tran_recog);
                                break;
                            }
                        }
                    }

                    idCpRec = cpRec.save();

                    var id = record.submitFields({
                        type : 'customrecord_rsm_bank_data_parsed',
                        id : result.v_crdlid,
                        values : {
                            'custrecord_rsm_bdp_transaction' : idCpRec
                        },
                        options : {
                            enableSourcing : false,
                            ignoreMandatoryFields : true
                        }
                    });

                } catch (e) {
                    log.error({title : "Error " + result.v_customer, details : e.message});
                }
                log.debug({title : 'cpRec id', details : idCpRec});
            }


        }

        /**
         * Executes when the reduce entry point is triggered and applies to each
         * group.
         *
         * @param {ReduceSummary} context - Data collection containing the groups to process
         *            through the reduce stage
         * @since 2015.1
         */
        function reduce(context) {

        }

        /**
         * Executes when the summarize entry point is triggered and applies to the
         * result set.
         *
         * @param {Summary} summary - Holds statistics regarding the execution of a
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
