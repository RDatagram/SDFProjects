/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/currentRecord', 'N/ui/message','N/url', 'N/https'],
/**
 * @param {message} message
 */
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
    	console.log("PageInit-PL Report");
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

	function cs_pdf_file() {
		var rec = record.get();
		console.log(rec.id);

		var varsuiteletURL = url.resolveScript({
			scriptId : 'customscript_sl_pl_report_pdf',
			deploymentId : 'customdeploy_sl_pl_report_pdf',
			returnExternalUrl : false
		});
		varsuiteletURL = varsuiteletURL + '&rplId=' + rec.id;
		window.open(varsuiteletURL, "_blank");
		// alert(rec.id);
	}
	
    function cs_do_restlet(myAction){
		var cRec = record.get();
		
		var restUrl = url.resolveScript({
			scriptId : 'customscript_snt_rl_pl_report', // RESTlet scriptId
			deploymentId : 'customdeploy_snt_rl_pl_report' // RESTlet deploymentId
		});

		// Generate request headers
		var headers = new Array();
		headers['Content-type'] = 'application/json';

		// Perform HTTP POST call
		var restReq = https.post({
			url : restUrl,
			headers : headers,
			body : {
				idPLR : cRec.id,
				action : myAction
				}
		});
		
		var jsRes = JSON.parse(restReq.body);
		return jsRes;
    }

 
    function cs_init_pl_lines(){
    	
    	var rlResponse = cs_do_restlet("init_lines");
    	
		var myMsg = message.create({
			title : "Result",
			message : "INTI done",
			type : message.Type.CONFIRMATION
		});
		// will disappear after 5s
		myMsg.show({
			duration : 5000
		});
    	window.location.reload(true);
    }

    function cs_xml_file(){
    	
    	var rlResponse = cs_do_restlet("xml_file");
    	
		var myMsg = message.create({
			title : "Result",
			message : "XML created",
			type : message.Type.CONFIRMATION
		});
		// will disappear after 5s
		myMsg.show({
			duration : 5000
		});
    	window.location.reload(true);
    }
    
    function cs_calc_pl_lines(){
    	
    	var rlResponse = cs_do_restlet("calc_lines");
    	
		var myMsg = message.create({
			title : "Result",
			message : "CALC done",
			type : message.Type.CONFIRMATION
		});
		// will disappear after 5s
		myMsg.show({
			duration : 5000
		});
    	window.location.reload(true);
    }
    
    return {
        pageInit: pageInit,
        cs_init_pl_lines : cs_init_pl_lines,
        cs_calc_pl_lines : cs_calc_pl_lines,
        cs_xml_file : cs_xml_file,
        cs_pdf_file : cs_pdf_file
        //fieldChanged: fieldChanged,
        //postSourcing: postSourcing,
        //sublistChanged: sublistChanged,
        //lineInit: lineInit,
        //validateField: validateField,
        //validateLine: validateLine,
        //validateInsert: validateInsert,
        //validateDelete: validateDelete,
        //saveRecord: saveRecord
    };
    
});
