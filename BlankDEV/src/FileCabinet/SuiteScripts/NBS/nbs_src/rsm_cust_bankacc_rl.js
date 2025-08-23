/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 */
define([ 'N/https', 'N/query', 'N/record', './util_nbs', "N/xml" ],
/**
 * @param {https}
 *            https
 * @param {query}
 *            query
 * @param {record}
 *            record
 */
function(https, query, currentRecord, util_nbs, xml) {

	function doPost(requestBody) {

		var idCust = requestBody.cId;

		var record = currentRecord.load({
			type : 'customer',
			id : idCust,
			isDynamic : true
		});

		var cpib = record.getValue('custentity_pib');

		var queryTag = util_nbs.generateQueryTag({
			"accountNumber" : "",
			"nationalIdentificationNumber" : "",
			"taxIdentificationNumber" : cpib
		});

		var body = util_nbs.generateXmlBody(queryTag);
		var headerObj = {
			name : "Content-Type",
			value : "application/soap+xml; charset=utf-8"
		};

		var response = https.post({
			url : "https://webservices.nbs.rs/CommunicationOfficeService1_0/CompanyAccountXmlService.asmx",
			body : body,
			headers : headerObj
		});
		
		var xmlDocument = xml.Parser.fromString({
			text : util_nbs.unescapeXml(response.body)
		});
		
		var dArray = util_nbs.parseXmlForCompanyAccounts(xmlDocument);
		
		if (dArray.length > 0) {
			
			for (var ia = 0; ia < dArray.length; ia++) {
				
				var dummy = util_nbs.buildFullBankAccount_server({
					"BankCode" : dArray[ia].BankCode,
					"AccountNumber" : dArray[ia].AccountNumber,
					"ControlNumber" : dArray[ia].ControlNumber
				});
				
				var l_novi = true;
				
				var l_lc = record.getLineCount({
					sublistId : 'recmachcustrecord_rsm_cust_bank_accounts_cust'
				});
				
				for (var lc = 0; lc < l_lc && l_novi; lc++) {
					var l_value = record.getSublistValue({
						sublistId : 'recmachcustrecord_rsm_cust_bank_accounts_cust',
						line : lc,
						fieldId : 'custrecord_rsm_cust_bank_accounts_tr' 
					})
					if (dummy == l_value) {
						l_novi = false;
					}
				}
				
				if (l_novi) {
					record.selectNewLine({
						sublistId : 'recmachcustrecord_rsm_cust_bank_accounts_cust'
					});
					record.setCurrentSublistValue({
						sublistId : 'recmachcustrecord_rsm_cust_bank_accounts_cust',
						fieldId : 'custrecord_rsm_cust_bank_accounts_tr',
						value : dummy,
						ignoreFieldChange : true
					});
					record.setCurrentSublistValue({
						sublistId : 'recmachcustrecord_rsm_cust_bank_accounts_cust',
						fieldId : 'custrecord_rsm_cust_bank_accounts_banka',
						value : dArray[ia].BankName,
						ignoreFieldChange : true
					});
					record.commitLine({
						sublistId : 'recmachcustrecord_rsm_cust_bank_accounts_cust'
					});
				}
			}
			record.save();
		}
		
	}

	return {
		post : doPost
	};

});
