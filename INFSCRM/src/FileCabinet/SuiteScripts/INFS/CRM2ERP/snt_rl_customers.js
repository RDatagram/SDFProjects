/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 */
define(['N/query', 'N/util','N/format'],

function(query,util,format) {

    function doGet(requestParams) {

    }

    /**
     * Function called upon sending a PUT request to the RESTlet.
     *
     * @param {string | Object} requestBody - The HTTP request body; request body will be passed into function as a string when request Content-Type is 'text/plain'
     * or parsed into an Object when request Content-Type is 'application/json' (in which case the body must be a valid JSON)
     * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
     * @since 2015.2
     */
    function doPut(requestBody) {

    }


    /**
     * Function called upon sending a POST request to the RESTlet.
     *
     * @param {string | Object} requestBody - The HTTP request body; request body will be passed into function as a string when request Content-Type is 'text/plain'
     * or parsed into an Object when request Content-Type is 'application/json' (in which case the body must be a valid JSON)
     * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
     * @since 2015.2
     */
    function doPost(requestBody) {
    	var retArr = [];
    	
    	var myTime = new Date();

    	var sql = "empty sql";
    	
    	if (requestBody.sql_from){
    		sql = requestBody.sql_from; 
    	} else {
        	sql = "select id, companyname, externalid, datecreated from customer";    		
    	};

    	if (requestBody.sql_where){
    		sql = sql + " " + requestBody.sql_where;
    	};    	
    	log.debug('SQL',sql);
    	
    	var qResultSet = query.runSuiteQLPaged({
    		query : sql,
    		pageSize : 999
    	});
    	
	    retArr.push(qResultSet);
    	
    	var iterator = qResultSet.iterator();
    	iterator.each(function(resultPage) {
    	    var currentPage = resultPage.value;
    	    var currentPagedData = currentPage.pagedData;
    	    retArr.push(currentPage.data.results);
    	    return true;
    	});    	

    	var retObj = {"customers":retArr};
    	
    	return retObj;
    }

    /**
     * Function called upon sending a DELETE request to the RESTlet.
     *
     * @param {Object} requestParams - Parameters from HTTP request URL; parameters will be passed into function as an Object (for all supported content types)
     * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
     * @since 2015.2
     */
    function doDelete(requestParams) {

    }

    return {
        //'get': doGet,
        //put: doPut,
        post: doPost
        //'delete': doDelete
    };
    
});
