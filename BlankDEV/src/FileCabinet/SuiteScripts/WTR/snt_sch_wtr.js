/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/format', './wtr_lib', 'N/runtime'],

function(record, format, wtrLib, runtime) {
   
    /**
     * Definition of the Scheduled script trigger point.
     *
     * @param {Object} scriptContext
     * @param {string} scriptContext.type - The context in which the script is executed. It is one of the values from the scriptContext.InvocationType enum.
     * @Since 2015.2
     */
    function execute(scriptContext) {
		var iawId = null;
		var iarId = null;
		var jEntryId = null;

		var schScript = runtime.getCurrentScript();
		var cId = schScript.getParameter('custscriptidwtr');
		
		//var cId = requestBody.idWtr;
		
		var rWtr = record.load({
			type : 'customrecord_snt_wtr_header',
			id : cId
		});

		var options = wtrLib.wtrOptions(rWtr, cId);

		/**
		 * 
		 * Brisanje starih dokumenata
		 */

		try {
			wtrLib.deleteOldIA(options.IAWexternalId);
			// wtrLib.deleteOldIA(options.IARexternalId);
			wtrLib.deleteOldJE(options.JEexternalId);
			wtrLib.deleteRetailInventoryTrans(options.wtrId);
		} catch (e) {
			log.error('SNT_sch_wtr_error',e.message);
			return; 
		}
		/**
		 * Formiranje Inventory adjustments
		 * 
		 */

		try {
			iawId = wtrLib.createIAW(rWtr, options);

			var accValues = wtrLib.calcAccValues(rWtr, cId, options);

			jEntryId = wtrLib.createJE(rWtr, options, accValues);

			rWtr.setValue('custrecord_snt_wtr_header_je', jEntryId);
			rWtr.setValue('custrecord_snt_wtr_header_iaw', iawId);
			rWtr.setValue('custrecord_snt_wtr_header_is_booked', true);

			rWtr.save();
		} catch (e) {
			log.error('SNT_sch_wtr_error',e.message);
			return; 
		}

		var remainingUsage = runtime.getCurrentScript().getRemainingUsage();
		log.audit('RemainingUsage', remainingUsage);


	}

    return {
        execute: execute
    };
    
});
