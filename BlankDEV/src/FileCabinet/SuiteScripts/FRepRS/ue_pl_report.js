/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/file'],

function(file) {
   
    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {string} scriptContext.type - Trigger type
     * @param {Form} scriptContext.form - Current form
     * @Since 2015.2
     */
    function beforeLoad(scriptContext) {
    	var form = scriptContext.form;
    	var tmpFile = file.load({"id":"./cs_pl_report.js"});
    	form.clientScriptFileId = tmpFile.id;
    	form.addButton({id : 'custpage_btn_init_lines', label : 'Init lines', functionName : 'cs_init_pl_lines()'});
    	form.addButton({id : 'custpage_btn_calc_lines', label : 'Calculate', functionName : 'cs_calc_pl_lines()'});
    	form.addButton({id : 'custpage_btn_xml', label : 'XML', functionName : 'cs_xml_file()'});
    	form.addButton({id : 'custpage_btn_pdf', label : 'PDF', functionName : 'cs_pdf_file()'});
    }

    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {Record} scriptContext.oldRecord - Old record
     * @param {string} scriptContext.type - Trigger type
     * @Since 2015.2
     */
    function beforeSubmit(scriptContext) {
    	
    }

    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {Record} scriptContext.oldRecord - Old record
     * @param {string} scriptContext.type - Trigger type
     * @Since 2015.2
     */
    function afterSubmit(scriptContext) {

    }

    return {
        beforeLoad: beforeLoad
        //beforeSubmit: beforeSubmit,
        //afterSubmit: afterSubmit
    };
    
});
