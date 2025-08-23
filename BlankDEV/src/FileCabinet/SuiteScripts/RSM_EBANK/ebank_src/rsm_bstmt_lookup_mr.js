/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
define([ 'N/record', 'N/runtime', 'N/query', 'N/format', './util_parsers' ],

function(record, runtime, query, format, util_parsers) {

	/**
	 * Marks the beginning of the Map/Reduce process and generates input data.
	 * 
	 * @typedef {Object} ObjectRef
	 * @property {number} id - Internal ID of the record instance
	 * @property {string} type - Record type id
	 * 
	 * @return {Array|Object|Search|RecordRef} inputSummary
	 * @since 2015.1
	 */
	function getInputData() {

		// custscript_rsm_bstmt_payments_id
		var scriptObj = runtime.getCurrentScript();
		var masterId = scriptObj.getParameter('custscript_rsm_bstmt_mr_param2');
		var myOptions = {};
		
		var subcheck = runtime.isFeatureInEffect({
			feature : 'SUBSIDIARIES'
		});
		
		var sql_from = "select bdp.id as v_bdpid ";
		sql_from += ", bstmt.custrecord_rsm_bstmt_subsidiary as v_subsidiary ";
		sql_from += ", bdp.custrecord_rsm_bdp_bank_acct_p as v_bankaccountid " + ", bdp.custrecord_rsm_bdp_pozivnabroj1 as v_srchbroj ";
		sql_from += " from customrecord_rsm_bank_data_parsed bdp join customrecord_snt_bank_statement bstmt on bdp.custrecord_rsm_bdp_parent = bstmt.id ";
		sql_from += " where ((NVL2(bdp.custrecord_rsm_bdp_customer,'T','F') = 'F' ) OR (NVL2(bdp.custrecord_rsm_bdp_transaction_recog,'T','F') = 'F') ) AND (bstmt.id = ?)";

		var myPagedResults = query.runSuiteQLPaged({
			pageSize : 1000,
			query : sql_from,
			params : [ masterId ]
		});

		var retArr = [];
		var iterator = myPagedResults.iterator();

		iterator.each(function(resultPage) {
			var currentPage = resultPage.value;
			var theData = currentPage.data.asMappedResults();
			for (var a = 0; a < theData.length; a++) {
				retArr.push(theData[a]);
			}
			return true;
		});

		log.debug('Array', retArr.length);

		return retArr;
	}

	/**
	 * Executes when the map entry point is triggered and applies to each
	 * key/value pair.
	 * 
	 * @param {MapSummary}
	 *            context - Data collection containing the key/value pairs to
	 *            process through the map stage
	 * @since 2015.1
	 */
	function map(context) {

		log.debug("Step > ", context.value);
		var result = JSON.parse(context.value);

		try {
			var l_found;
			l_found = 0;
			var srchBroj = result.v_srchbroj;
			var srchSub = result.v_subsidiary;
			var srchData = {};
			
			if (srchBroj) {
				srchData = util_parsers.lookupPNBO(srchBroj,srchSub);
				l_found = srchData.isFound;
				if (srchData.isFound == 1) {

					record.submitFields({
						type : 'customrecord_rsm_bank_data_parsed',
						id : result.v_bdpid,
						values : {
							custrecord_rsm_bdp_action : srchData.custrecord_rsm_bdp_action,
							custrecord_rsm_bdp_customer : srchData.custrecord_rsm_bdp_customer,
							custrecord_rsm_bdp_transaction_recog : srchData.custrecord_rsm_bdp_transaction_recog
						}
					});

				}
			}
			if (l_found == 0) {

				srchData = util_parsers.lookupBankID(result.v_bankaccountid);
				if (srchData.isFound == 1) {
					record.submitFields({
						type : 'customrecord_rsm_bank_data_parsed',
						id : result.v_bdpid,
						values : {
							custrecord_rsm_bdp_customer : srchData.custrecord_rsm_bdp_customer
						}
					});
					
				}
			}

			;

		} catch (e) {
			// handle exception
			log.error({
				title : 'Error BSTMT lookup MAP stage',
				details : e.message
			})
		}
	}

	/**
	 * Executes when the reduce entry point is triggered and applies to each
	 * group.
	 * 
	 * @param {ReduceSummary}
	 *            context - Data collection containing the groups to process
	 *            through the reduce stage
	 * @since 2015.1
	 */
	function reduce(context) {

	}

	/**
	 * Executes when the summarize entry point is triggered and applies to the
	 * result set.
	 * 
	 * @param {Summary}
	 *            summary - Holds statistics regarding the execution of a
	 *            map/reduce script
	 * @since 2015.1
	 */
	function summarize(summary) {
		log.audit('inputSummary:Usage', summary.inputSummary.usage);
		log.audit('mapSummary:Usage', summary.mapSummary.usage);
		log.audit('reduceSummary:Usage', summary.reduceSummary.usage);
		log.audit('Usage', summary.usage);
	}

	return {
		getInputData : getInputData,
		map : map,
		reduce : reduce,
		summarize : summarize
	};

});
