/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['./wtr_lib'],

function(wtrLib) {
   
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
    	
    	
    	var newRecord = scriptContext.newRecord;
    	var vQuantity = newRecord.getValue('custrecord_snt_wtr_line_quantuty');
    	var vPrice = newRecord.getValue('custrecord_snt_wtr_line_price'); 
    	var vWholesaleValue = (vQuantity * vPrice);
   	
    	var vTaxCode = newRecord.getValue('custrecord_snt_wtr_line_tax_code');
    	var vTaxRate = wtrLib.getTaxRate(vTaxCode);    	
    	var vTaxAmount = vWholesaleValue * vTaxRate / 100.0;
    	
    	var vRetailValue = vWholesaleValue + vTaxAmount;
    	
    	newRecord.setValue('custrecord_snt_wtr_line_ws_value',vWholesaleValue.toFixed(2));
    	newRecord.setValue('custrecord_snt_wtr_line_tax_rate',vTaxRate.toFixed(2));
    	newRecord.setValue('custrecord_snt_wtr_line_tax_amount',vTaxAmount.toFixed(2));
    	newRecord.setValue('custrecord_snt_wtr_line_retail_value',vRetailValue.toFixed(2));
    	
    	log.debug('beforeSubmit vWhole', vWholesaleValue);
    	log.debug('beforeSubmit vTaxAmount', vTaxAmount);
    	log.debug('beforeSubmit vRetail', vRetailValue);
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
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    };
    
});
