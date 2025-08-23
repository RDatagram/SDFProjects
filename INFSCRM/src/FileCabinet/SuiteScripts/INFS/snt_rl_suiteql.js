/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 */
define([ 'N/query' ],

function(query) {

	/**
	 * Function called upon sending a GET request to the RESTlet.
	 * 
	 * @param {Object}
	 *            requestParams - Parameters from HTTP request URL; parameters
	 *            will be passed into function as an Object (for all supported
	 *            content types)
	 * @returns {string | Object} HTTP response body; return string when request
	 *          Content-Type is 'text/plain'; return Object when request
	 *          Content-Type is 'application/json'
	 * @since 2015.1
	 */
	function doGet(requestParams) {

	}

	/**
	 * Function called upon sending a PUT request to the RESTlet.
	 * 
	 * @param {string |
	 *            Object} requestBody - The HTTP request body; request body will
	 *            be passed into function as a string when request Content-Type
	 *            is 'text/plain' or parsed into an Object when request
	 *            Content-Type is 'application/json' (in which case the body
	 *            must be a valid JSON)
	 * @returns {string | Object} HTTP response body; return string when request
	 *          Content-Type is 'text/plain'; return Object when request
	 *          Content-Type is 'application/json'
	 * @since 2015.2
	 */
	function doPut(requestBody) {

	}

	/**
	 * Function called upon sending a POST request to the RESTlet.
	 * 
	 * @param {string |
	 *            Object} requestBody - The HTTP request body; request body will
	 *            be passed into function as a string when request Content-Type
	 *            is 'text/plain' or parsed into an Object when request
	 *            Content-Type is 'application/json' (in which case the body
	 *            must be a valid JSON)
	 * @returns {string | Object} HTTP response body; return string when request
	 *          Content-Type is 'text/plain'; return Object when request
	 *          Content-Type is 'application/json'
	 * @since 2015.2
	 */
	function doPost(requestBody) {
		var retArr = [];

		var sql = "";

		sql = requestBody.sql_from;

		if (requestBody.sql_where) {
			sql = sql + " " + requestBody.sql_where;
		}
		;

		try {
			var qOptions = {
				query : sql,
				pageSize : 999
			};
			if (requestBody.params) {
				qOptions.params = requestBody.params
			}
			var qResultSet = query.runSuiteQLPaged(qOptions);
			
			var iterator = qResultSet.iterator();
			iterator.each(function(resultPage) {

				var currentPage = resultPage.value;
				var theData = currentPage.data.asMappedResults();
				for (var a = 0; a < theData.length; a++) {
					retArr.push(theData[a]);
				}

				/*
				 * var currentPage = resultPage.value; var currentPagedData =
				 * currentPage.pagedData;
				 * //retArr.push(currentPage.data.results); for (var ix = 0; ix <
				 * currentPage.data.results.length; ix++) {
				 * retArr.push(currentPage.data.results[ix].values); }
				 */
				return true;
			});
			var retObj = {/* "resultSet" : []qResultSet, */
				"rows" : retArr
			};
			return retObj;
		} catch (e) {
			var retObj = {/* "resultSet" : []qResultSet, */
				"rows" : [],
				"error" : e
			};
			return retObj;
		}

	}

	/**
	 * Function called upon sending a DELETE request to the RESTlet.
	 * 
	 * @param {Object}
	 *            requestParams - Parameters from HTTP request URL; parameters
	 *            will be passed into function as an Object (for all supported
	 *            content types)
	 * @returns {string | Object} HTTP response body; return string when request
	 *          Content-Type is 'text/plain'; return Object when request
	 *          Content-Type is 'application/json'
	 * @since 2015.2
	 */
	function doDelete(requestParams) {

	}

	return {
		// 'get': doGet,
		// put: doPut,
		post : doPost
	// 'delete': doDelete
	};

});
