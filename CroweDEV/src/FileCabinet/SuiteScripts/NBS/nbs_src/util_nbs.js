define(['N/query'],

function(query) {

	function _generateXmlExchange(){
		return '<?xml version="1.0" encoding="utf-8"?>'
			+ "<soap12:Envelope "
			+ 'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" '
			+ 'xmlns:xsd="http://www.w3.org/2001/XMLSchema" '
			+ 'xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">'
			+ "<soap12:Header> "
			+ '<AuthenticationHeader xmlns="http://communicationoffice.nbs.rs"> '
			+ "<UserName>mmarkovic</UserName> "
			+ "<Password>Crowelicenca1</Password> "
			+ "<LicenceID>d1bde512-29a9-4ce8-943c-4819cca5ce06</LicenceID> "
			+ "</AuthenticationHeader> "
			+ "</soap12:Header> "
			+ "<soap12:Body> "
			+ '<GetCurrentExchangeRate xmlns="http://communicationoffice.nbs.rs"> '
			+ "<exchangeRateListTypeID>3</exchangeRateListTypeID>"
			+ "</GetCurrentExchangeRate> "
			+ "</soap12:Body> "
			+ "</soap12:Envelope> ";

	}

	function unescapeXml(string) {
		const unescapeMap = {
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
			const elements = xml.getElementsByTagName(tagName)[0];
			const nodes = elements.childNodes[0];
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
		let resultArray = new Array();

		const elements = xmlDocument.getElementsByTagName({
			tagName : '*'
		});

		for ( let i in elements) {
			resultArray.push({
				nodeName : elements[i].localName,
				type : elements[i].nodeType,
				value : elements[i].nodeValue,
				text : elements[i].textContent
			});
		}

		return resultArray;
	}



	return {
		generateXmlExchange : _generateXmlExchange,
		unescapeXml : unescapeXml,
		parseXml : parseXml,
		getValueFromNodeByTagName : getValueFromNodeByTagName,
	};

});
