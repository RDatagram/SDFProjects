/**
 * @NApiVersion 2.0
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define([ 'N/record', 'N/search', 'N/runtime' ],
/**
 * @param {record}  record
 *
 * @param {search}  search
 * @param {runtime} runtime
 *
 */
function(record,
		 search,
		 runtime
) {

	/**
	 * Function definition to be triggered before record is loaded.
	 * 
	 * @param {Object}   scriptContext
	 *
	 * @param {Record}  scriptContext.newRecord - New record
	 *
	 * @param {Record}  scriptContext.oldRecord - Old record
	 *
	 * @param {string}   scriptContext.type - Trigger type
	 *
	 * @Since 2015.2
	 */
	function afterSubmit(scriptContext) {

		/**
		 * @typedef ctx.UserEventType
		 */

		var ctx = scriptContext;
		var newVen = scriptContext.newRecord;
		var subcheck = runtime.isFeatureInEffect({
			feature: 'SUBSIDIARIES'
		});
		if ((ctx.type === ctx.UserEventType.CREATE) && (subcheck)) {
			
			var subSidsrch = search.create({
				type : "subsidiary",
				columns : [ search.createColumn({
					name : "name",
					label : "Name"
				}) ]
			});

			subSidsrch.run().each(function(result) {
				// .run().each has a limit of 4,000 results
				var newRec = record.create({
					type : "vendorsubsidiaryrelationship"
				});

				log.debug({
					title : "Entity",details : newVen.id}
					);
				log.debug({
					title : "Subsidiary", details : result.id}
					);

				newRec.setValue("subsidiary", result.id);
				newRec.setValue("entity", newVen.id);

				try {
					newRec.save();
				} catch (e) {
					log.error({title : "Error", details : newVen.id});
				}

				return true;
			});

		}
	}

	return {

		afterSubmit : afterSubmit
	};

});
