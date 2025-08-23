/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 */
define(['N/search'],
/**
 * @param {search} search
 */
function(search) {
   
    /**
     * Function called upon sending a GET request to the RESTlet.
     *
     * @param {Object} requestParams - Parameters from HTTP request URL; parameters will be passed into function as an Object (for all supported content types)
     * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
     * @since 2015.1
     */
    function doGet(requestParams) {
		return "Hello From ss_table"
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
    	var pageArr = [];
    	var mySearch = search.create({
    		"type" : requestBody["type"],
    		"columns" : []
    	});

		if (requestBody.filters) {
			var lFilters = requestBody.filters;
			for (var i = 0; i < lFilters.length; i++) {
				mySearch.filters.push(search.createFilter(lFilters[i]));
			}
		}
		
		if (requestBody.columns){
			var lColumns = requestBody.columns;
			for (var i = 0; i < lColumns.length; i++) {
				mySearch.columns.push(search.createColumn(lColumns[i]));
			}
		}
    	var myPagedData = mySearch.runPaged({
    	    pageSize: 500
    	});
    	
        myPagedData.pageRanges.forEach(function(pageRange){
            var myPage = myPagedData.fetch({index: pageRange.index});
            pageArr.push(myPage);
            
            for (var ix = 0; ix < myPage.data.length; ix++) {
				retArr.push(myPage.data[ix]);
			}
        });    	

        return {"rows" : retArr}

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
        'get': doGet,
        //put: doPut,
        post: doPost
        //'delete': doDelete
    };
    
});
