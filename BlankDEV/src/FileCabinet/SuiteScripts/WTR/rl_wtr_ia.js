/**
 * @NApiVersion 2.0
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define([ 'N/record', 'N/format', './wtr_lib', 'N/runtime' ],
		function(record, format, wtrLib, runtime) {

			function doPost(requestBody) {

				var iawId = null;
				var iarId = null;
				var jEntryId = null;

				var cId = requestBody.idWtr;

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
					return {
						result : e.message
					};
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
					return {
						result : e.message
					};
				}

				var remainingUsage = runtime.getCurrentScript()
						.getRemainingUsage();
				log.debug('RemainingUsage', remainingUsage);

				var resultObj = {
					result : 'remainUsage : ' + remainingUsage
				};
				return resultObj;
			}

			return {
				post : doPost
			};

		});
