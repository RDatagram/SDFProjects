/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
define(
		[ 'N/query', 'N/record', './rsm_util' ],
		/**
		 * @param {query}
		 *            query
		 * @param {record}
		 *            record
		 */
		function(query, record, rsm_util) {

			/**
			 * Marks the beginning of the Map/Reduce process and generates input
			 * data.
			 * 
			 * @typedef {Object} ObjectRef
			 * @property {number} id - Internal ID of the record instance
			 * @property {string} type - Record type id
			 * 
			 * @return {Array|Object|Search|RecordRef} inputSummary
			 * @since 2015.1
			 */
			function getInputData() {
		
				return rsm_util.createVendorListQuery();
			}

			/**
			 * Executes when the map entry point is triggered and applies to
			 * each key/value pair.
			 * 
			 * @param {MapSummary}
			 *            context - Data collection containing the key/value
			 *            pairs to process through the map stage
			 * @since 2015.1
			 */

			function map(context) {
				var result = JSON.parse(context.value);
				// log.debug("Result JSON", context.value);

				var newRec = record.create({
					type : "vendorsubsidiaryrelationship"
				});

				// log.debug("Entity", result.vid);
				// log.debug("Subsidiary", result.sid);

				newRec.setValue("subsidiary", result.sid);
				newRec.setValue("entity", result.vid);

				try {
					newRec.save();
				} catch (e) {
					log.error("Error" + result.vid, e.message);
				}

			}

			/**
			 * Executes when the reduce entry point is triggered and applies to
			 * each group.
			 * 
			 * @param {ReduceSummary}
			 *            context - Data collection containing the groups to
			 *            process through the reduce stage
			 * @since 2015.1
			 */
			function reduce(context) {

			}

			/**
			 * Executes when the summarize entry point is triggered and applies
			 * to the result set.
			 * 
			 * @param {Summary}
			 *            summary - Holds statistics regarding the execution of
			 *            a map/reduce script
			 * @since 2015.1
			 */
			function summarize(summary) {
				
			}
			
			return {
				getInputData : getInputData,
				map : map,
				reduce : reduce,
				summarize : summarize
			};

		});
