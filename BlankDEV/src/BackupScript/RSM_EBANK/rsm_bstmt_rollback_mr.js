/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
define([ 'N/record', 'N/runtime', 'N/query' ],

function(record, runtime, query) {

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
		var scriptObj = runtime.getCurrentScript();
		var masterId = scriptObj.getParameter('custscript_rsm_bstmt_rollback_id');
		// custscript_rsm_bstmt_deposit_tax
		var myOptions = {};

		var sql_from = "select custrecord_rsm_bdp_transaction as tid, transaction.type as ttype " 
			+ " from customrecord_rsm_bank_data_parsed bdp join transaction on (transaction.id = custrecord_rsm_bdp_transaction) "
				+ " where (bdp.custrecord_rsm_bdp_parent = ?) AND (custrecord_rsm_bdp_transaction > 0) ";

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
		var result = JSON.parse(context.value);
		try {

			if (result.ttype == "CustDep") {

				record["delete"]({
					type : record.Type.CUSTOMER_DEPOSIT,
					id : result.tid
				})
			}
			//CustPymt
			if (result.ttype == "CustPymt") {

				record["delete"]({
					type : record.Type.CUSTOMER_PAYMENT,
					id : result.tid
				})
			}
		} catch (e) {
			log.error("Rollback delete error", e);
			log.error("Rollback error for : ", result);
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
