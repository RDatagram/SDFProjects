define(['N/query'],

function(query) {

	function _generateXmlBody(queryTag){
		return '<?xml version="1.0" encoding="utf-8"?>' + "<soap12:Envelope " + 'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ' + 'xmlns:xsd="http://www.w3.org/2001/XMLSchema" '
		+ 'xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">' + "<soap12:Header> " + '<AuthenticationHeader xmlns="http://communicationoffice.nbs.rs"> ' + "<UserName>rsm_serbia</UserName> "
		+ "<Password>rsm2020serbia</Password> " + "<LicenceID>e24a8ef8-fff1-4b78-8165-c27b8aa985fb</LicenceID> " + "</AuthenticationHeader> " + "</soap12:Header> " + "<soap12:Body> "
		+ '<GetCompanyAccount xmlns="http://communicationoffice.nbs.rs"> ' + queryTag + "</GetCompanyAccount> " + "</soap12:Body> " + "</soap12:Envelope> ";

	}
	
	function generateQueryTag(options) {
		
		var accountNumber = options.accountNumber;
		var nationalIdentificationNumber = options.nationalIdentificationNumber;
		var taxIdentificationNumber = options.taxIdentificationNumber;
		
		/*
		accountNumber = record.getValue({
			fieldId : "accountnumber"
		});
		
		nationalIdentificationNumber = record.getValue({
			fieldId : "custentity_matbrpred"
		});
		
		taxIdentificationNumber = record.getValue({
			fieldId : "custentity_pib"
		});
		*/
		
		if (!accountNumber && !nationalIdentificationNumber && !taxIdentificationNumber) {
			return null;
		}


		if (taxIdentificationNumber) {
			return ("<taxIdentificationNumber>" + taxIdentificationNumber + "</taxIdentificationNumber> ");
		}

		if (nationalIdentificationNumber) {
			return ("<nationalIdentificationNumber>" + nationalIdentificationNumber + "</nationalIdentificationNumber> ");
		}

		if (accountNumber) {
			return ("<bankCode>" + accountNumber.slice(0, 3) + "</bankCode>" + "<accountNumber>" + accountNumber.slice(4, accountNumber.length - 3) + "</accountNumber> " + "<controlNumber>"
					+ accountNumber.slice(accountNumber.length - 2, accountNumber.length) + "</controlNumber>");
		}
		
		return null;
	}

	function unescapeXml(string) {
		var unescapeMap = {
			"&amp;" : "&",
			"&quot;" : '"',
			"&lt;" : "<",
			"&gt;" : ">"
		};

		return string.replace(/(&quot;|&lt;|&gt;|&amp;)/g, function(str, item) {
			return unescapeMap[item];
		});
	}
	
	function getValueFromNodeByTagName(xml, tagName) {
		try {
			var elements = xml.getElementsByTagName(tagName)[0];
			var nodes = elements.childNodes[0];
			return nodes.nodeValue;
		} catch (e) {
			return "";
		}
	}
	/**
	 * Parses xml.Document object and returns an array of JS objects which
	 * represent xml nodes as key-value pairs
	 * 
	 * @param {xml.Document}
	 *            xmlDocument NetSuite xml.Document object
	 * @returns {Array} an Array of objects
	 */
	function parseXml(xmlDocument) {
		var resultArray = new Array();

		var elements = xmlDocument.getElementsByTagName({
			tagName : '*'
		});

		for ( var i in elements) {
			resultArray.push({
				nodeName : elements[i].localName,
				type : elements[i].nodeType,
				value : elements[i].nodeValue,
				text : elements[i].textContent
			});
		}

		return resultArray;
	}

	/**
	 * Returns company account dataset from xml document
	 * 
	 * @param {xml.Document}
	 *            xmlDocument NetSuite xml.Document object
	 * @returns {Array} an Array of objects
	 */
	function parseXmlForCompanyAccounts(xmlDocument) {
		var resultArray = new Array();

		// Get company account nodes
		var accounts = xmlDocument.getElementsByTagName({
			tagName : 'CompanyAccount'
		});

		// Go through the company account nodes
		for ( var i in accounts) {
			// get child nodes
			var nodes = accounts[i].getElementsByTagName({
				tagName : '*'
			});

			var accObj = {};
			// For each child node create key-value pair in accObj
			for ( var j in nodes) {
				accObj[nodes[j].localName] = nodes[j].textContent;
			}

			resultArray.push(accObj);
		}

		return resultArray;
	}

	function buildFullBankAccount(options){
		var retVal = "";
		var bankCode = options.BankCode;
		var accountNumber = options.AccountNumber;
		var controlNumber = options.ControlNumber;
		if (controlNumber.length < 2){
			controlNumber = "0" + controlNumber;
		}
		if (accountNumber.length < 13){
			accountNumber = "0".repeat(13-accountNumber.length) + accountNumber;
		}
		
		retVal = bankCode + "-" + accountNumber + "-" + controlNumber;
		
		return retVal;
	}
	
	function buildFullBankAccount_server(options){
		var retVal = "";
		var bankCode = options.BankCode;
		var accountNumber = options.AccountNumber;
		var controlNumber = options.ControlNumber;
		if (controlNumber.length < 2){
			controlNumber = "0" + controlNumber;
		}
		if (accountNumber.length < 13){
			for(var kk=0;accountNumber.length<13;kk++){
				accountNumber = "0" + accountNumber;
			}
		}
		
		retVal = bankCode + "-" + accountNumber + "-" + controlNumber;
		
		return retVal;
	}	

	function getBank2663Detail(_vendorId){
		var _sql = ' select custrecord_2663_entity_acct_no as vbankacc from customrecord_2663_entity_bank_details '
		_sql += ' where custrecord_2663_parent_vendor = ?';

		var _temp = query.runSuiteQL(({
			query: _sql,
			params : [_vendorId]
		}));

		var _result = _temp.asMappedResults();
		return _result || [];
	}

	return {
		generateQueryTag : generateQueryTag,
		generateXmlBody : _generateXmlBody,
		unescapeXml : unescapeXml,
		parseXml : parseXml,
		parseXmlForCompanyAccounts : parseXmlForCompanyAccounts,
		getValueFromNodeByTagName : getValueFromNodeByTagName,
		buildFullBankAccount : buildFullBankAccount,
		buildFullBankAccount_server : buildFullBankAccount_server,
		getBank2663Detail : getBank2663Detail
	};

});
