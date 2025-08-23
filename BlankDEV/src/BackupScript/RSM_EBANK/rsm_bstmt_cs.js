/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/currentRecord', 'N/ui/message', 'N/url', 'N/https'],

function(record, message, url, https) {
    
    /**
     * Function to be executed after page is initialized.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
     *
     * @since 2015.2
     */
    function pageInit(scriptContext) {
    	console.log('pageInit');
    }

    /**
     * Function to be executed when field is changed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
     * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
     *
     * @since 2015.2
     */
    function fieldChanged(scriptContext) {

    }

    /**
     * Function to be executed when field is slaved.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     *
     * @since 2015.2
     */
    function postSourcing(scriptContext) {

    }

    /**
     * Function to be executed after sublist is inserted, removed, or edited.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @since 2015.2
     */
    function sublistChanged(scriptContext) {

    }

    /**
     * Function to be executed after line is selected.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @since 2015.2
     */
    function lineInit(scriptContext) {

    }

    /**
     * Validation function to be executed when field is changed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
     * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
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
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
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
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
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
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
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
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @returns {boolean} Return true if record is valid
     *
     * @since 2015.2
     */
    function saveRecord(scriptContext) {

    }

    function _submit_parser(){
    	var cRec = record.get();
    	
		var restUrl = url.resolveScript({
			scriptId : 'customscript_rsm_bstmt_rl',
			deploymentId : 'customdeploy_rsm_bstmt_rl'
		});

		// Generate request headers
		var headers = new Array();
		headers['Content-type'] = 'application/json';

		// Perform HTTP POST call
		var restReq = https.post({
			url : restUrl,
			headers : headers,
			body : {
				idBstmt : cRec.id,
				action : "parser"
			}
		});
		var jsRes = JSON.parse(restReq.body);

		var myMsg = message.create({
			title : "Result",
			message : "Pokrenuta procedura PARSIRANJA",
			type : message.Type.CONFIRMATION
		});
		// will disappear after 5s
		myMsg.show({
			duration : 5000
		});

		window.location.reload(true);
    	
    }
    
    function _submit_payments(){
    	var cRec = record.get();
    	
		var restUrl = url.resolveScript({
			scriptId : 'customscript_rsm_bstmt_rl',
			deploymentId : 'customdeploy_rsm_bstmt_rl'
		});

		// Generate request headers
		var headers = new Array();
		headers['Content-type'] = 'application/json';

		// Perform HTTP POST call
		var restReq = https.post({
			url : restUrl,
			headers : headers,
			body : {
				idBstmt : cRec.id,
				action : "payments"
			}
		});
		var jsRes = JSON.parse(restReq.body);

		var myMsg = message.create({
			title : "Result",
			message : "Pokrenuta procedura generisanja Payments",
			type : message.Type.CONFIRMATION
		});
		// will disappear after 5s
		myMsg.show({
			duration : 5000
		});

		window.location.reload(true);
    	
    }
        
    function _submit_lookup(){
    	var cRec = record.get();
    	
		var restUrl = url.resolveScript({
			scriptId : 'customscript_rsm_bstmt_rl',
			deploymentId : 'customdeploy_rsm_bstmt_rl'
		});

		// Generate request headers
		var headers = new Array();
		headers['Content-type'] = 'application/json';

		// Perform HTTP POST call
		var restReq = https.post({
			url : restUrl,
			headers : headers,
			body : {
				idBstmt : cRec.id,
				action : "lookup"
			}
		});
		var jsRes = JSON.parse(restReq.body);

		var myMsg = message.create({
			title : "Result",
			message : "Pokrenuta procedura POVEZIVANJA",
			type : message.Type.CONFIRMATION
		});
		// will disappear after 5s
		myMsg.show({
			duration : 5000
		});

		window.location.reload(true);
    	
    }
    function _submit_rollback(){
    	var cRec = record.get();
    	
		var restUrl = url.resolveScript({
			scriptId : 'customscript_rsm_bstmt_rl',
			deploymentId : 'customdeploy_rsm_bstmt_rl'
		});

		// Generate request headers
		var headers = new Array();
		headers['Content-type'] = 'application/json';

		// Perform HTTP POST call
		var restReq = https.post({
			url : restUrl,
			headers : headers,
			body : {
				idBstmt : cRec.id,
				action : "rollback"
			}
		});
		var jsRes = JSON.parse(restReq.body);

		var myMsg = message.create({
			title : "Result",
			message : "Pokrenuta procedura PONISTAVANJA",
			type : message.Type.CONFIRMATION
		});
		// will disappear after 5s
		myMsg.show({
			duration : 5000
		});

		window.location.reload(true);
    	
    }
    
    function _submit_refresh(){
		window.location.reload(true);
    }
    
    return {
        pageInit: pageInit,
        submit_parser : _submit_parser,
        submit_payments : _submit_payments,
        submit_lookup : _submit_lookup,
        submit_refresh : _submit_refresh,
        submit_rollback : _submit_rollback
//        fieldChanged: fieldChanged,
//        postSourcing: postSourcing,
//        sublistChanged: sublistChanged,
//        lineInit: lineInit,
//        validateField: validateField,
//        validateLine: validateLine,
//        validateInsert: validateInsert,
//        validateDelete: validateDelete,
//        saveRecord: saveRecord
    };
    
});
