/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 */
define([ 'N/record', 'N/format', 'N/search' ],
/**
 * @param {record}
 *            record
 */
function(record,format,search) {

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
      
      	var gId = requestParams.entityId;
      
		var rCustomer = record.load({
          type: record.Type.CUSTOMER,
          id : gId
        });
      
      	var vCustomerName = rCustomer.getValue('companyname');
      return rCustomer;
      /**
      	return({
          "result" : "ok",
          "companyName" : vCustomerName
        })
        */
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
	/**
      	var vCustName = requestBody.companyName;
      	var vSubsidiary = requestBody.subsidiary.id;
      	var vExtId = requestBody.externalId;
      	
		var newCust = record.create({
          type: record.Type.CUSTOMER
        });
      
      	newCust.setValue('companyname',vCustName);
      	newCust.setValue('subsidiary',vSubsidiary);
      	newCust.setValue('externalid',vExtId);
      	var nId = newCust.save();
      */
		return {
			"result" : 'ok'
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
		'get': doGet,
		// put: doPut,
		post : doPost
	// 'delete': doDelete
	};


});
