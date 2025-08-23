/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define([ 'N/ui/serverWidget', 'N/task' ],

function(serverWidget, task) {

	function beforeLoad(scriptContext) {
		var form = scriptContext.form;

		form.clientScriptModulePath = "./rsm_courier_cs.js";

		if (scriptContext.type === scriptContext.UserEventType.VIEW) {
			
			var btnRefresh = form.addButton({
				id : "custpage_submit_refresh_button",
				label : 'Refresh',
				functionName : 'submit_refresh()'
			});
			var btnParser = form.addButton({
				id : "custpage_submit_parser_button",
				label : 'Parsiranje',
				functionName : 'submit_parser()'
			});
			var btnLookup = form.addButton({
				id : "custpage_submit_lookup_button",
				label : 'Povezivanje',
				functionName : 'submit_lookup()'
			});
			var btnPayment = form.addButton({
				id : "custpage_submit_payment_button",
				label : 'Payments',
				functionName : 'submit_payments()'
			});
			var btnRollback = form.addButton({
				id : "custpage_submit_rollback_button",
				label : 'Rollback payments',
				functionName : 'submit_rollback()'
      });
      
      var fgMR = form.addFieldGroup({
				id : 'fieldgroupmr',
				label : 'MapReduce status'
        });
        
			var fMRParser = form.addField({
				id : 'custpage_parser_mr_info',
				label : 'Status MR Parsiranje/Povezivanje',
				type : serverWidget.FieldType.TEXT,
				container : 'fieldgroupmr'
			});
			var fMRPayment = form.addField({
				id : 'custpage_payment_mr_info',
				label : 'Status MR Payments',
				type : serverWidget.FieldType.TEXT,
				container : 'fieldgroupmr'
			});

			var currentRecord = scriptContext.newRecord;
			
			var lineCount = currentRecord.getValue('custrecord_rsm_csdh_line_count');
			
			// proveriti da li uopste postoji TaskId za MReduce Parser
 			try {
				var cStatus;
				cStatus = task.checkStatus(currentRecord.getValue('custrecord_rsm_csdh_parser_mr'));
				fMRParser.defaultValue = cStatus.status;
				if ((cStatus.status === 'PENDING') || (cStatus.status === 'PROCESSING')){
					btnRefresh.isDisabled = false;
					btnParser.isDisabled = true;
					btnLookup.isDisabled = true;
					btnPayment.isDisabled = true;
					btnRollback.isDisabled = true;
				}
			} catch (e) {
				fMRParser.defaultValue = 'UNKNOWN';
			}
			/**
			 * Ako postoje stavke - zabrani dugme Parsiranje
			 * Ako ne postoje stavke - zabrani dugme Povezivanje i Payments
			 */
			if (lineCount > 0){
				btnParser.isDisabled = true;			
			} else {
				btnLookup.isDisabled = true;
				btnPayment.isDisabled = true;
				btnRollback.isDisabled = true;
			}
			
			try {
				var cStatusPay;
				cStatusPay = task.checkStatus(currentRecord.getValue('custrecord_rsm_csdh_payment_mr'));
				fMRPayment.defaultValue = cStatusPay.status;
				if ((cStatusPay.status === 'PENDING') || (cStatusPay.status === 'PROCESSING')){
					btnRefresh.isDisabled = false;
					btnParser.isDisabled = true;
					btnLookup.isDisabled = true;
					btnPayment.isDisabled = true;
					btnRollback.isDisabled = true;
				}				
			} catch (e) {
				fMRPayment.defaultValue = 'UNKNOWN';				
			}

		}

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
		beforeLoad : beforeLoad,
		beforeSubmit : beforeSubmit,
		afterSubmit : afterSubmit
	};

});
