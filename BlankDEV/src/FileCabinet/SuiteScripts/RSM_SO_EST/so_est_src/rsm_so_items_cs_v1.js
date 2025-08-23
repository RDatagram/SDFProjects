/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/ui/dialog'],

function(dialog) {
    
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
    	
    	var sctx = scriptContext;


    	function calcNetSuiteRate(_vRateFull,_vRateDiscount){
    		debugger;
    			
    		if (_vRateDiscount && _vRateFull){
    			var vNetSuiteRate = _vRateFull * (1-_vRateDiscount/100.0); 
    			sctx.currentRecord.setCurrentSublistValue({
    				sublistId : "item",
    				fieldId : "rate",
    				value : vNetSuiteRate.toFixed(2)
    			})
    		} else if(_vRateFull){
    			sctx.currentRecord.setCurrentSublistValue({
    				sublistId : "item",
    				fieldId : "rate",
    				value : _vRateFull
    			})
    		}    		
    	}
    	
    	if (sctx.sublistId == 'item') {
			
    		var vPriceLevel = sctx.currentRecord.getCurrentSublistValue({
				"sublistId" : "item",
				"fieldId" : "price"
			});
			
			if ((sctx.fieldId == 'custcol_rsm_item_rate_full') || (sctx.fieldId == 'custcol_rsm_item_rate_discount')) {
				var vRateFull = sctx.currentRecord.getCurrentSublistValue({
					sublistId : "item",
					fieldId : "custcol_rsm_item_rate_full"
				});
				var vRateDiscount = sctx.currentRecord.getCurrentSublistValue({
					sublistId : "item",
					fieldId : "custcol_rsm_item_rate_discount"
				});
				calcNetSuiteRate(vRateFull, vRateDiscount);
				return;
			}
			
			if ((sctx.fieldId == 'quantity') && (vPriceLevel != -1)) {
				sctx.currentRecord.setCurrentSublistValue({
					sublistId : "item",
					fieldId : "custcol_rsm_item_rate_full",
					value : sctx.currentRecord.getCurrentSublistValue({
						sublistId : "item",
						fieldId : "rate"
					})
				});
				return;
			}
		}
    	
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
    	
    	var sctx = scriptContext;
    	//console.log(sctx.sublistId);
    	//console.log(sctx.fieldId);
    	
    	if (sctx.sublistId == 'item' && sctx.fieldId == 'item') {
    		sctx.currentRecord.setCurrentSublistValue({
    			sublistId : "item",
    			fieldId : "custcol_rsm_item_rate_full",
    			value : sctx.currentRecord.getCurrentSublistValue({
        			sublistId : "item",
        			fieldId : "rate"})
    		})
    	}
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

    	var sctx = scriptContext;
    	//console.log(sctx.sublistId);
    	//console.log(sctx.fieldId);
    	
    	if (sctx.sublistId == 'item') {
    		var vRate = sctx.currentRecord.getCurrentSublistValue({
    			sublistId : "item",
    			fieldId : "rate"});
    		
			var vRateFull = sctx.currentRecord.getCurrentSublistValue({
				sublistId : "item",
				fieldId : "custcol_rsm_item_rate_full"
			});
			var vRateDiscount = sctx.currentRecord.getCurrentSublistValue({
				sublistId : "item",
				fieldId : "custcol_rsm_item_rate_discount"
			});	
    		
    		if ((vRateFull) || (vRateDiscount)) {
				var vDifference = Math.abs((vRateFull * (1 - vRateDiscount / 100.0)) - vRate);
				if (vDifference > 0.01) {
					dialog.confirm({
						"title" : "Razlika u cenama",
						"message" : "Postoji greska u obracunu cene i popusta za : " + vDifference
					}).then(function(result) {
						console.log("You press" + result);
					});
					return false;
				}
			}    		
    	}
    	
    	return true;
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

    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged,
        postSourcing: postSourcing,
//        sublistChanged: sublistChanged,
//        lineInit: lineInit,
//        validateField: validateField,
        validateLine: validateLine
//        validateInsert: validateInsert,
//        validateDelete: validateDelete,
//        saveRecord: saveRecord
    };
    
});
