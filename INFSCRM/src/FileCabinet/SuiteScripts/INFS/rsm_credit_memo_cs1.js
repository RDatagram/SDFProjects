/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define([ 'N/search' ],

function(search) {

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
		var sctx = scriptContext;
		debugger;
		
		try {
			if ((sctx.sublistId === 'item') /*&& sctx.fieldId == 'taxcode' */) {

				var vTaxCode = sctx.currentRecord.getCurrentSublistValue({
					sublistId : "item",
					fieldId : "taxcode"
				});

				var filters = [ [ "internalidnumber", "equalto", vTaxCode ] ];
				var salestaxitemSearchObj = search.create({
					type : "salestaxitem",
					filters : filters,
					columns : [ search.createColumn({
						name : "itemid",
						label : "Item ID"
					}), search.createColumn({
						name : "rate",
						label : "Rate"
					}), search.createColumn({
						name : "custrecord_tax_code_napom_por_oslobodj",
						label : "Label"
					}) ]
				});

				salestaxitemSearchObj.run().each(function(result) {
					debugger;
					var vTextNapomene = result.getValue('custrecord_tax_code_napom_por_oslobodj');
					sctx.currentRecord.setValue('custbody_napomenaporezoslobodjen', vTextNapomene || '');
					/*if (result.getValue('custrecord_tax_code_napom_por_oslobodj')) {
						objRecord = sctx.currentRecord;
						objRecord.setValue('custbody_napomenaporezoslobodjen',);
					}*/
					return false; // SAMO JEDAN SME DA BUDE
				});
			}
		} catch (e) {
			// alert: handle exception
			alert("ValidateLine script problem");
			console.log(e);
		}
		return true;

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
		//fieldChanged : fieldChanged
		//postSourcing : postSourcing,
		//sublistChanged : sublistChanged,
		//lineInit : lineInit,
		//validateField : validateField
		validateLine : validateLine,
		//validateInsert : validateInsert,
		//validateDelete : validateDelete,
		//saveRecord : saveRecord
	};

});
