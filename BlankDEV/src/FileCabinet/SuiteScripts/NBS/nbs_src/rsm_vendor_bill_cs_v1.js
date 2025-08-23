/**
 * @NApiVersion 2.0
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define([ 'N/query' ],

    function(queryModule) {

        /**
         * Function to be executed after page is initialized.
         *
         * @param {Object}
         *            scriptContext
         * @param {Record}
         *            scriptContext.currentRecord - Current form record
         * @param {string}
         *            scriptContext.mode - The mode in which the record is being
         *            accessed (create, copy, or edit)
         *
         * @since 2015.2
         */
        function pageInit(scriptContext) {

            //alert("FORMA TRENUTNO U RECONSTRUCTION MODU!!!");
            var currentRecord = scriptContext.currentRecord;
            var entity = currentRecord.getValue('entity');
            var bpd = currentRecord.getValue('custbody_rsm_ven_bank_payment_detail');

            if((entity) && !(bpd)) {
                try {
                    console.log('get primary bank inside pageInit')
                    var l_sql = " select id from customrecord_2663_entity_bank_details where custrecord_2663_parent_vendor = ? AND (custrecord_2663_entity_bank_type = 1) ";
                    var rQuery = queryModule.runSuiteQL({
                        query: l_sql,
                        params: [entity]
                    });
                    var rMap = rQuery.asMappedResults();
                    if (rMap.length > 0) {
                        currentRecord.setValue({
                            fieldId: 'custbody_rsm_ven_bank_payment_detail',
                            value: rMap[0].id
                        })
                    }
                } catch (e) {
                    console.log(e.message);
                }
            }
        }

        /**
         * Function to be executed when field is changed.
         *
         * @param {Object}
         *            scriptContext
         * @param {Record}
         *            scriptContext.currentRecord - Current form record
         * @param {string}
         *            scriptContext.sublistId - Sublist name
         * @param {string}
         *            scriptContext.fieldId - Field name
         * @param {number}
         *            scriptContext.lineNum - Line number. Will be undefined if not
         *            a sublist or matrix field
         * @param {number}
         *            scriptContext.columnNum - Line number. Will be undefined if
         *            not a matrix field
         *
         * @since 2015.2
         */
        function fieldChanged(scriptContext) {

            var sctx = scriptContext;
            var cRec = sctx.currentRecord;
            if (sctx.fieldId === 'entity') {
                try {
                    console.log('get primary bank inside fieldChanged');
                    var l_sql = " select id from customrecord_2663_entity_bank_details where custrecord_2663_parent_vendor = ? AND (custrecord_2663_entity_bank_type = 1) ";
                    var rQuery = queryModule.runSuiteQL({
                        query: l_sql,
                        params: [cRec.getValue({fieldId: 'entity'})]
                    });
                    var rMap = rQuery.asMappedResults();
                    if (rMap.length > 0) {
                        console.log(rMap[0].id);
                        cRec.setValue({
                            fieldId: 'custbody_rsm_ven_bank_payment_detail',
                            value: rMap[0].id
                        })
                    }
                } catch (e) {
                    console.log(e.message);
                }
            }



        }

        /**
         * Function to be executed when field is slaved.
         *
         * @param {Object}
         *            scriptContext
         * @param {Record}
         *            scriptContext.currentRecord - Current form record
         * @param {string}
         *            scriptContext.sublistId - Sublist name
         * @param {string}
         *            scriptContext.fieldId - Field name
         *
         * @since 2015.2
         */
        function postSourcing(scriptContext) {

        }

        /**
         * Function to be executed after sublist is inserted, removed, or edited.
         *
         * @param {Object}
         *            scriptContext
         * @param {Record}
         *            scriptContext.currentRecord - Current form record
         * @param {string}
         *            scriptContext.sublistId - Sublist name
         *
         * @since 2015.2
         */
        function sublistChanged(scriptContext) {

        }

        /**
         * Function to be executed after line is selected.
         *
         * @param {Object}
         *            scriptContext
         * @param {Record}
         *            scriptContext.currentRecord - Current form record
         * @param {string}
         *            scriptContext.sublistId - Sublist name
         *
         * @since 2015.2
         */
        function lineInit(scriptContext) {

        }

        /**
         * Validation function to be executed when field is changed.
         *
         * @param {Object}
         *            scriptContext
         * @param {Record}
         *            scriptContext.currentRecord - Current form record
         * @param {string}
         *            scriptContext.sublistId - Sublist name
         * @param {string}
         *            scriptContext.fieldId - Field name
         * @param {number}
         *            scriptContext.lineNum - Line number. Will be undefined if not
         *            a sublist or matrix field
         * @param {number}
         *            scriptContext.columnNum - Line number. Will be undefined if
         *            not a matrix field
         *
         * @returns {boolean} Return true if field is valid
         *
         * @since 2015.2
         */
        function validateField(scriptContext) {

        }

        /**
         * Validation function to be executed when sublist line is committed.
         *
         * @param {Object}
         *            scriptContext
         * @param {Record}
         *            scriptContext.currentRecord - Current form record
         * @param {string}
         *            scriptContext.sublistId - Sublist name
         *
         * @returns {boolean} Return true if sublist line is valid
         *
         * @since 2015.2
         */
        function validateLine(scriptContext) {

        }

        /**
         * Validation function to be executed when sublist line is inserted.
         *
         * @param {Object}
         *            scriptContext
         * @param {Record}
         *            scriptContext.currentRecord - Current form record
         * @param {string}
         *            scriptContext.sublistId - Sublist name
         *
         * @returns {boolean} Return true if sublist line is valid
         *
         * @since 2015.2
         */
        function validateInsert(scriptContext) {

        }

        /**
         * Validation function to be executed when record is deleted.
         *
         * @param {Object}
         *            scriptContext
         * @param {Record}
         *            scriptContext.currentRecord - Current form record
         * @param {string}
         *            scriptContext.sublistId - Sublist name
         *
         * @returns {boolean} Return true if sublist line is valid
         *
         * @since 2015.2
         */
        function validateDelete(scriptContext) {

        }

        /**
         * Validation function to be executed when record is saved.
         *
         * @param {Object}
         *            scriptContext
         * @param {Record}
         *            scriptContext.currentRecord - Current form record
         * @returns {boolean} Return true if record is valid
         *
         * @since 2015.2
         */
        function saveRecord(scriptContext) {

        }

        return {
            pageInit : pageInit,
            fieldChanged : fieldChanged
            //postSourcing : postSourcing,
            //sublistChanged : sublistChanged,
            //lineInit : lineInit,
            //validateField : validateField
            //validateLine : validateLine,
            //validateInsert : validateInsert,
            //validateDelete : validateDelete,
            //saveRecord : saveRecord
        };

    });
