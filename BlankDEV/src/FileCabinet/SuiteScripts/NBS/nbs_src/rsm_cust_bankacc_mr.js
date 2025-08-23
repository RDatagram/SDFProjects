/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
define([ "./util_nbs", "N/record", "N/https", "N/xml", "N/query" ],

function(util_nbs, record, https, xml,query) {

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
		
/*		var myPagedResults = query.runSuiteQLPaged({
			pageSize : 1000,
			query : " select customer.id as cid, custentity_pib as cpib from customer where (not exists (select 1 from customrecord_rsm_cust_bank_accounts where custrecord_rsm_cust_bank_accounts_cust = customer.id)) AND (nvl2(custentity_pib,'T','F') = 'T') "
		});

		var retArr = [];
		var iterator = myPagedResults.iterator();

		iterator.each(function(resultPage) {
			log.debug('Step >','iterator')
			var currentPage = resultPage.value;
			var theData = currentPage.data.asMappedResults();
			for (var a = 0; a < theData.length; a++) {
				retArr.push(theData[a]);
			}
			return true;
		});

*/	
		var l_sql = " select customer.id as cid, custentity_pib as cpib from customer ";
		l_sql += " where (substr(custentity_pib,1,1) = '1') ";
		l_sql += " AND (LENGTH(custentity_pib) = 9) ";
		l_sql += " AND (not exists (select 1 from customrecord_rsm_cust_bank_accounts where custrecord_rsm_cust_bank_accounts_cust = customer.id)) ";
		//l_sql += " AND (nvl2(custentity_pib,'T','F') = 'T') "; 
		var myPagedResults = query.runSuiteQL({
			query : l_sql 
		});

		var retArr = myPagedResults.asMappedResults();
		
		log.audit('RetArr',retArr.length);
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

		var queryTag = util_nbs.generateQueryTag({
			"accountNumber" : "",
			"nationalIdentificationNumber" : "",
			"taxIdentificationNumber" : result.cpib
		});

		var body = '<?xml version="1.0" encoding="utf-8"?>' + "<soap12:Envelope " + 'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ' + 'xmlns:xsd="http://www.w3.org/2001/XMLSchema" '
				+ 'xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">' + "<soap12:Header> " + '<AuthenticationHeader xmlns="http://communicationoffice.nbs.rs"> ' + "<UserName>rsm_serbia</UserName> "
				+ "<Password>rsm2020serbia</Password> " + "<LicenceID>e24a8ef8-fff1-4b78-8165-c27b8aa985fb</LicenceID> " + "</AuthenticationHeader> " + "</soap12:Header> " + "<soap12:Body> "
				+ '<GetCompanyAccount xmlns="http://communicationoffice.nbs.rs"> ' + queryTag + "</GetCompanyAccount> " + "</soap12:Body> " + "</soap12:Envelope> ";

		var headerObj = {
			name : "Content-Type",
			value : "application/soap+xml; charset=utf-8"
		};

		var response = https.post({
			url : "https://webservices.nbs.rs/CommunicationOfficeService1_0/CompanyAccountXmlService.asmx",
			body : body,
			headers : headerObj
		});

		//log.debug('NBS Reponse',response);
		
		var xmlDocument = xml.Parser.fromString({
			text : util_nbs.unescapeXml(response.body)
		});
		var dArray = util_nbs.parseXmlForCompanyAccounts(xmlDocument);

		//log.debug('dArray',dArray);
		if (dArray.length > 0) {

			for (var ia = 0; ia < dArray.length; ia++) {
				// log.debug("Response from NBS",dArray);
				var dummy = util_nbs.buildFullBankAccount_server({
					"BankCode" : dArray[ia].BankCode,
					"AccountNumber" : dArray[ia].AccountNumber,
					"ControlNumber" : dArray[ia].ControlNumber
				});

				var rec = record.create({
					type : 'customrecord_rsm_cust_bank_accounts'
				});

				rec.setValue({
					fieldId : 'custrecord_rsm_cust_bank_accounts_cust',
					value : result.cid
				});

				rec.setValue({
					fieldId : 'custrecord_rsm_cust_bank_accounts_tr',
					value : dummy
				});

				rec.setValue({
					fieldId : 'custrecord_rsm_cust_bank_accounts_banka',
					value : dArray[ia].BankName,
					ignoreFieldChange : true
				});
				rec.save();

			}
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
/*
select count(*) from customer where (not exists (select 1 from customrecord_rsm_cust_bank_accounts where custrecord_rsm_cust_bank_accounts_cust = customer.id))
*/