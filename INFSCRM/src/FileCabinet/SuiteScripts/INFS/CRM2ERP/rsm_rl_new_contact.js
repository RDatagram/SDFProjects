/**
 * @NApiVersion 2.0
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 */
define(['N/record'],

function(record) {

	/**
	 * Function called upon sending a GET request to the RESTlet.
	 * 
	 * @param {Object} requestParams - Parameters from HTTP request URL; parameters
	 *            will be passed into function as an Object (for all supported
	 *            content types)
	 * @param requestParams.contactid
	 * @returns {string | Object} HTTP response body; return string when request
	 *          Content-Type is 'text/plain'; return Object when request
	 *          Content-Type is 'application/json'
	 * @since 2015.1
	 */
	function doGet(requestParams) {
		try {
			var contactRec = record.load({
				type : record.Type.CONTACT,
				id : requestParams.contactid
			});
			return {
				"result" : "ok",
				"record" : contactRec 
			}
		} catch (e) {
			return{
				"result" : "error",
				"message" : e.message,
				"errorName" : e.name
			}
		}
	}



	/**
	 * Function called upon sending a POST request to the RESTlet.
	 * 
	 * @param {string | Object} requestBody - The HTTP request body; request body will
	 *            be passed into function as a string when request Content-Type
	 *            is 'text/plain' or parsed into an Object when request
	 *            Content-Type is 'application/json' (in which case the body
	 *            must be a valid JSON)
	 * @param requestBody.firstname
	 * @param requestBody.lastname
	 * @param  requestBody.subsidiary
	 * @param  requestBody.email
	 * @param  requestBody.company
	 * @param  requestBody.phone
	 * @param  requestBody.mobilephone
	 * @param  requestBody.custentity_contact_location
	 * @returns {string | Object} HTTP response body; return string when request
	 *          Content-Type is 'text/plain'; return Object when request
	 *          Content-Type is 'application/json'
	 * @since 2015.2
	 */
	function doPost(requestBody) {

		var vFirstName = requestBody.firstname;
		var vLastName = requestBody.lastname || '';
		var vSubsidiary = requestBody.subsidiary;
		var vEmail = requestBody.email;
		var vCompany = requestBody.company;
		var vPhone = requestBody.phone || '';
		var vMobilePhone = requestBody.mobilephone || '';
		var vLocations = requestBody.custentity_contact_location || [];
		
		var errInfo = [];
		
		if (!vFirstName){
			return {
				"result" : "error",
				"message" : "firstname is required",
				"errorName" : "ERR_REQUIRED"
			}			
		}
		try {

			var newContact = record.create({
				type : record.Type.CONTACT
			});
			
			newContact.setValue('firstname', vFirstName);
			newContact.setValue('lastname', vLastName);
			newContact.setValue('subsidiary',vSubsidiary)
			newContact.setValue('email', vEmail);
			newContact.setValue('company', vCompany);
			newContact.setValue('phone', vPhone);
			newContact.setValue('mobilephone', vMobilePhone);
		
			if (vLocations.length > 0)
			{
				newContact.setValue('custentity_contact_location',vLocations);
			}
			var nId = newContact.save();
			
			return {
				"result" : 'ok',
				"internalid" : nId,
				"errInfo" : errInfo
			}
		} catch (e) {
			return {
				"result" : "error",
				"message" : e.message,
				"errorName" : e.name
			}
		}

	}

	/**
	 * Function called upon sending a DELETE request to the RESTlet.
	 * 
	 * @param {Object} requestParams - Parameters from HTTP request URL; parameters
	 *            will be passed into function as an Object (for all supported
	 *            content types)
	 * @returns {string | Object} HTTP response body; return string when request
	 *          Content-Type is 'text/plain'; return Object when request
	 *          Content-Type is 'application/json'
	 * @since 2015.2
	 */
	function doDelete(requestParams) {
		try {
			record["delete"]({
				type : record.Type.CONTACT,
				id : requestParams.contactid
			});
			return {
				"result" : "ok"
			}
		} catch (e) {
			return{
				"result" : "error",
				"message" : e.message,
				"errorName" : e.name
			}
		}
	}

	return {
		'get' : doGet,
		//put : doPut,
		post : doPost,
		'delete' : doDelete
	};

});
