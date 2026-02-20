/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       19 Sep 2017     charliepuyod
 *
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType 
 * 
 * @param {String} type Access mode: create, copy, edit
 * @returns {Void}
 */
function clientPageInit(type){
	var companyTimeZone = nlapiGetFieldValue('custpage_tz');
	var d = new Date();
	var myDate = nlapiDateToString(d, 'datetimetz');
	nlapiSetFieldValue('custpage_datetime', myDate, true, true);
	
	
	
}

function clientFieldChanged(type,name,linenum) {
	if (name == 'custpage_bank_account') {
		/*var accountId = nlapiGetFieldValue(name);
		var subsidiary = nlapiLookupField('account', accountId, 'subsidiary');
		var schFil = new nlobjSearchFilter('subsidiary', null, 'anyof', subsidiary);
		var columns = new Array();
		columns.push(new nlobjSearchColumn('internalid'));
		columns.push(new nlobjSearchColumn('entityid'));
		columns.push(new nlobjSearchColumn('custentity_paymentmethod'));
		columns.push(new nlobjSearchColumn('custentity_paymentformat'));
		columns.push(new nlobjSearchColumn('custentity_recpartyaccount'));
		columns.push(new nlobjSearchColumn('custentity_recpartyaccttype'));
		columns.push(new nlobjSearchColumn('custentity_recbankprimid'));
		columns.push(new nlobjSearchColumn('custentity_recbankprimidtype'));
		var sch = nlapiSearchRecord('entity', 'customsearch_ica_prenote_summary', null, columns);*/
		window.ischanged = false;
		document.forms['main_form'].submit();
	}
}

function clientSaveRecord(type) {
	nlapiSetFieldValue('custpage_process', 'T', false, true);
	return true;
}