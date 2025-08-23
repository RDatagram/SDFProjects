/**
 * @NApiVersion 2.x
 * @NScriptType MassUpdateScript
 * @NModuleScope SameAccount
 */
define([ "./util_nbs", "N/record", "N/https", "N/xml" ],

function(util_nbs, record, https, xml) {

	/**
	 * Definition of Mass Update trigger point.
	 * 
	 * @param {Object}
	 *            params
	 * @param {string}
	 *            params.type - Record type of the record being processed by the
	 *            mass update
	 * @param {number}
	 *            params.id - ID of the record being processed by the mass
	 *            update
	 * 
	 * @since 2016.1
	 */
	function each(params) {

		log.debug("MassUpdate params",params);
		
		var accountNumber = "";
		var nationalIdentificationNumber = "";
		var taxIdentificationNumber = "";

		var rec = record.load({
			type : params.type,
			id : params.id,
			isDynamic : true
		});

		accountNumber = rec.getValue({
			fieldId : "accountnumber"
		});

		nationalIdentificationNumber = rec.getValue({
			fieldId : "custentity_matbrpred"
		});

		taxIdentificationNumber = rec.getValue({
			fieldId : "custentity_pib"
		});

		var queryTag = util_nbs.generateQueryTag({
			"accountNumber" : "",
			"nationalIdentificationNumber" : nationalIdentificationNumber,
			"taxIdentificationNumber" : taxIdentificationNumber
		});

		if (!queryTag) {

			return true;
		}

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

		var xmlDocument = xml.Parser.fromString({
			text : util_nbs.unescapeXml(response.body)
		});
		
		var dArray = util_nbs.parseXmlForCompanyAccounts(xmlDocument);
		
		//log.debug("NBS response",accArr);
		var isInserted = false;
		
		if (dArray.length > 0) {
			
			for (var ia = 0; ia < dArray.length; ia++) {
				//log.debug("Response from NBS",dArray);
				var dummy = util_nbs.buildFullBankAccount_server({
					"BankCode" : dArray[ia].BankCode,
					"AccountNumber" : dArray[ia].AccountNumber,
					"ControlNumber" : dArray[ia].ControlNumber
				});
				
				var l_novi = true;
				
				var l_lc = rec.getLineCount({
					sublistId : 'recmachcustrecord_rsm_cust_bank_accounts_cust'
				});
				
				log.debug('getLineCount',l_lc);
				
				for (var lc = 0; lc < l_lc && l_novi; lc++) {
					var l_value = rec.getSublistValue({
						sublistId : 'recmachcustrecord_rsm_cust_bank_accounts_cust',
						line : lc,
						fieldId : 'custrecord_rsm_cust_bank_accounts_tr' 
					})
					if (dummy == l_value) {
						l_novi = false;
					}
				}
				
				if (l_novi) {
					rec.selectNewLine({
						sublistId : 'recmachcustrecord_rsm_cust_bank_accounts_cust'
					});
					rec.setCurrentSublistValue({
						sublistId : 'recmachcustrecord_rsm_cust_bank_accounts_cust',
						fieldId : 'custrecord_rsm_cust_bank_accounts_tr',
						value : dummy,
						ignoreFieldChange : true
					});
					rec.setCurrentSublistValue({
						sublistId : 'recmachcustrecord_rsm_cust_bank_accounts_cust',
						fieldId : 'custrecord_rsm_cust_bank_accounts_banka',
						value : dArray[ia].BankName,
						ignoreFieldChange : true
					});
					rec.commitLine({
						sublistId : 'recmachcustrecord_rsm_cust_bank_accounts_cust'
					});
					isInserted = true;
					//log.debug('Step >','rec.commitLine');
				}
				
			}
		}
		
		if(isInserted){
			rec.save();
		}
		
		accountNumber = util_nbs.getValueFromNodeByTagName(xmlDocument, "Account");
		
		record.submitFields({
			type : params.type,
			id : params.id,
			values : {
				'accountnumber' : accountNumber
			},
			options : {
				enableSourcing : false,
				ignoreMandatoryFields : true
			}
		});
		
		return true;

	}

	return {
		each : each
	};

});
