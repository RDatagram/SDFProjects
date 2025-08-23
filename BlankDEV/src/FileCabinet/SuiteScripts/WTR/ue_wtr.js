/**
 * @NApiVersion 2.0
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */
define([ 'N/file', 'N/ui/serverWidget' ],

function(file, serverWidget) {

	/**
	 * Function definition to be triggered before record is loaded.
	 * 
	 * @param {Object}
	 *            scriptContext
	 * @param {Record}
	 *            scriptContext.newRecord - New record
	 * @param {string}
	 *            scriptContext.type - Trigger type
	 * @param {Form}
	 *            scriptContext.form - Current form
	 * @Since 2015.2
	 */
	function beforeLoad(scriptContext) {
		var form = scriptContext.form;
		var tmpFile = file.load({
			id : './cs_wtr.js'
		})
		form.clientScriptFileId = tmpFile.id; // BURGIJA!!

		if (scriptContext.type == scriptContext.UserEventType.VIEW) {
			form.addButton({
				id : 'custpage_btn_invadj',
				label : 'Book this',
				functionName : 'csInvAdj()'
			});
		}

		var _sublist = form.getSublist({
			id : 'recmachcustrecord_snt_wtr_line_header_id'
		});

		if (_sublist.lineCount != -1) {
			try {
				var _field = _sublist.getField({
					id : 'custrecord_snt_wtr_line_tax_rate'
				});
				_field.updateDisplayType({displayType : 'disabled'});
			} catch (e) {
				log.debug('Error', e.message);
			}
		}
		;
		
		var _sublist = scriptContext.newRecord.getSublists();
		/*
		var _sublist = form.getSublist({
			id : 'custrecord_snt_wtr_header_iaw'
		});*/
		
		log.debug('TestList',_sublist);
		
	}

	/**
	 * Function definition to be triggered before record is loaded.
	 * 
	 * @param {Object}
	 *            scriptContext
	 * @param {Record}
	 *            scriptContext.newRecord - New record
	 * @param {Record}
	 *            scriptContext.oldRecord - Old record
	 * @param {string}
	 *            scriptContext.type - Trigger type
	 * @Since 2015.2
	 */
	function beforeSubmit(scriptContext) {

	}

	/**
	 * Function definition to be triggered before record is loaded.
	 * 
	 * @param {Object}
	 *            scriptContext
	 * @param {Record}
	 *            scriptContext.newRecord - New record
	 * @param {Record}
	 *            scriptContext.oldRecord - Old record
	 * @param {string}
	 *            scriptContext.type - Trigger type
	 * @Since 2015.2
	 */
	function afterSubmit(scriptContext) {

	}

	return {
		beforeLoad : beforeLoad
	// beforeSubmit: beforeSubmit,
	// afterSubmit: afterSubmit
	};

});
