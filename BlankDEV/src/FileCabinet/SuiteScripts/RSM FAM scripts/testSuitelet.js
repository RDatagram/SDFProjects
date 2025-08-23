/**
 * @NApiVersion 2.0
 * @NScriptType Suitelet
 * @NModuleScope Public 
 */
define(['N/xml', 'N/log'], function (xml, log) {

  function unescapeXml(string) {
    var unescapeMap = {
      "&amp;": "&",
      "&quot;": '"',
      "&lt;": "<",
      "&gt;": ">"
    };

    return string.replace(/(&quot;|&lt;|&gt;|&amp;)/g, function (str, item) {
      return unescapeMap[item];
    });
  }

  /**
   * Parses xml.Document object and returns an array of JS objects which represent xml nodes as key-value pairs
   * @param {xml.Document} xmlDocument NetSuite xml.Document object
   * @returns {Array} an Array of objects
   */
  function parseXml(xmlDocument) {
    var resultArray = new Array();

    var elements = xmlDocument.getElementsByTagName({
      tagName: '*'
    });

    for (var i in elements) {
      resultArray.push({
        nodeName: elements[i].localName,
        type: elements[i].nodeType,
        value: elements[i].nodeValue,
        text: elements[i].textContent
      });
    }

    return resultArray;
  }

  /**
   * Returns company account dataset from xml document
   * @param {xml.Document} xmlDocument NetSuite xml.Document object
   * @returns {Array} an Array of objects
   */
  function parseXmlForCompanyAccounts(xmlDocument) {
    var resultArray = new Array();

    // Get company account nodes
    var accounts = xmlDocument.getElementsByTagName({
      tagName: 'CompanyAccount'
    });

    // Go through the company account nodes
    for (var i in accounts) {
      // get child nodes
      var nodes = accounts[i].getElementsByTagName({
        tagName: '*'
      });

      var accObj = {};
      // For each child node create key-value pair in accObj
      for (var j in nodes) {
        accObj[nodes[j].localName] = nodes[j].textContent;
      }

      resultArray.push(accObj);
    }

    return resultArray;
  }

  function onRequest(params) {

    var xmlStr = '<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema"><soap:Body><GetCompanyAccountResponse xmlns="http://communicationoffice.nbs.rs"><GetCompanyAccountResult>&lt;CompanyAccountDataSet&gt; &lt;CompanyAccount&gt; &lt;Account&gt;310-2898-55&lt;/Account&gt; &lt;BankCode&gt;310&lt;/BankCode&gt; &lt;AccountNumber&gt;2898&lt;/AccountNumber&gt; &lt;ControlNumber&gt;55&lt;/ControlNumber&gt; &lt;CompanyName&gt;SPRINT NOVE TEHN.DOO&lt;/CompanyName&gt; &lt;NationalIdentificationNumber&gt;8542309&lt;/NationalIdentificationNumber&gt; &lt;TaxIdentificationNumber&gt;100713246 &lt;/TaxIdentificationNumber&gt; &lt;Address&gt;BULEVAR CARA LAZARA 42&lt;/Address&gt; &lt;City&gt;NOVI SAD&lt;/City&gt; &lt;MunicipalityCode&gt;80284&lt;/MunicipalityCode&gt; &lt;ActivityCode&gt;6209&lt;/ActivityCode&gt; &lt;MunicipalityName&gt;Novi Sad - grad&lt;/MunicipalityName&gt; &lt;ActivityName&gt;Ostale usluge informacione tehnologije&lt;/ActivityName&gt; &lt;BankName&gt;NLB banka A.D.- Beograd&lt;/BankName&gt; &lt;CompanyAccountStatusID&gt;0&lt;/CompanyAccountStatusID&gt; &lt;CompanyAccountBlockadeStatusID&gt;0&lt;/CompanyAccountBlockadeStatusID&gt; &lt;CompanyAccountTypeID&gt;1&lt;/CompanyAccountTypeID&gt; &lt;LegalUserTypeID&gt;0&lt;/LegalUserTypeID&gt; &lt;InitializationDate&gt;2002-12-26T00:00:00+01:00&lt;/InitializationDate&gt; &lt;ChangeDate&gt;2016-07-28T00:00:00+02:00&lt;/ChangeDate&gt; &lt;UpdateDate&gt;2016-07-28T10:00:01.134+02:00&lt;/UpdateDate&gt; &lt;/CompanyAccount&gt; &lt;CompanyAccount&gt; &lt;Account&gt;310-207627-72&lt;/Account&gt; &lt;BankCode&gt;310&lt;/BankCode&gt; &lt;AccountNumber&gt;207627&lt;/AccountNumber&gt; &lt;ControlNumber&gt;72&lt;/ControlNumber&gt; &lt;CompanyName&gt;SPRINT NOVE TEHNOLOGIJE DOO&lt;/CompanyName&gt; &lt;NationalIdentificationNumber&gt;8542309&lt;/NationalIdentificationNumber&gt; &lt;TaxIdentificationNumber&gt;100713246 &lt;/TaxIdentificationNumber&gt; &lt;Address&gt;BULEVAR CARA LAZARA 42&lt;/Address&gt; &lt;City&gt;NOVI SAD&lt;/City&gt; &lt;MunicipalityCode&gt;80284&lt;/MunicipalityCode&gt; &lt;ActivityCode&gt;6209&lt;/ActivityCode&gt; &lt;MunicipalityName&gt;Novi Sad - grad&lt;/MunicipalityName&gt; &lt;ActivityName&gt;Ostale usluge informacione tehnologije&lt;/ActivityName&gt; &lt;BankName&gt;NLB banka A.D.- Beograd&lt;/BankName&gt; &lt;CompanyAccountStatusID&gt;0&lt;/CompanyAccountStatusID&gt; &lt;CompanyAccountBlockadeStatusID&gt;0&lt;/CompanyAccountBlockadeStatusID&gt; &lt;CompanyAccountTypeID&gt;1&lt;/CompanyAccountTypeID&gt; &lt;LegalUserTypeID&gt;0&lt;/LegalUserTypeID&gt; &lt;InitializationDate&gt;2012-04-03T00:00:00+02:00&lt;/InitializationDate&gt; &lt;ChangeDate&gt;2016-07-28T00:00:00+02:00&lt;/ChangeDate&gt; &lt;UpdateDate&gt;2016-07-28T10:00:01.233+02:00&lt;/UpdateDate&gt; &lt;/CompanyAccount&gt; &lt;CompanyAccount&gt; &lt;Account&gt;340-11010381-3&lt;/Account&gt; &lt;BankCode&gt;340&lt;/BankCode&gt; &lt;AccountNumber&gt;11010381&lt;/AccountNumber&gt; &lt;ControlNumber&gt;3&lt;/ControlNumber&gt; &lt;CompanyName&gt;SPRINT NT DOO&lt;/CompanyName&gt; &lt;NationalIdentificationNumber&gt;8542309&lt;/NationalIdentificationNumber&gt; &lt;TaxIdentificationNumber&gt;100713246 &lt;/TaxIdentificationNumber&gt; &lt;Address&gt;BULEVAR CARA LAZARA 42&lt;/Address&gt; &lt;City&gt;NOVI SAD&lt;/City&gt; &lt;MunicipalityCode&gt;80284&lt;/MunicipalityCode&gt; &lt;ActivityCode&gt;6209&lt;/ActivityCode&gt; &lt;MunicipalityName&gt;Novi Sad - grad&lt;/MunicipalityName&gt; &lt;ActivityName&gt;Ostale usluge informacione tehnologije&lt;/ActivityName&gt; &lt;BankName&gt;Erste Bank A.D.- Novi Sad&lt;/BankName&gt; &lt;CompanyAccountStatusID&gt;0&lt;/CompanyAccountStatusID&gt; &lt;CompanyAccountBlockadeStatusID&gt;0&lt;/CompanyAccountBlockadeStatusID&gt; &lt;CompanyAccountTypeID&gt;1&lt;/CompanyAccountTypeID&gt; &lt;LegalUserTypeID&gt;0&lt;/LegalUserTypeID&gt; &lt;InitializationDate&gt;2014-01-16T00:00:00+01:00&lt;/InitializationDate&gt; &lt;ChangeDate&gt;2016-08-03T00:00:00+02:00&lt;/ChangeDate&gt; &lt;UpdateDate&gt;2016-08-03T20:00:01.646+02:00&lt;/UpdateDate&gt; &lt;/CompanyAccount&gt; &lt;CompanyAccount&gt; &lt;Account&gt;340-13032267-46&lt;/Account&gt; &lt;BankCode&gt;340&lt;/BankCode&gt; &lt;AccountNumber&gt;13032267&lt;/AccountNumber&gt; &lt;ControlNumber&gt;46&lt;/ControlNumber&gt; &lt;CompanyName&gt;SPRINT NT DOO - COVID19&lt;/CompanyName&gt; &lt;NationalIdentificationNumber&gt;8542309&lt;/NationalIdentificationNumber&gt; &lt;TaxIdentificationNumber&gt;100713246 &lt;/TaxIdentificationNumber&gt; &lt;Address&gt;BULEVAR CARA LAZARA 42&lt;/Address&gt; &lt;City&gt;NOVI SAD&lt;/City&gt; &lt;MunicipalityCode&gt;80284&lt;/MunicipalityCode&gt; &lt;ActivityCode&gt;6209&lt;/ActivityCode&gt; &lt;MunicipalityName&gt;Novi Sad - grad&lt;/MunicipalityName&gt; &lt;ActivityName&gt;Ostale usluge informacione tehnologije&lt;/ActivityName&gt; &lt;BankName&gt;Erste Bank A.D.- Novi Sad&lt;/BankName&gt; &lt;CompanyAccountStatusID&gt;0&lt;/CompanyAccountStatusID&gt; &lt;CompanyAccountBlockadeStatusID&gt;2&lt;/CompanyAccountBlockadeStatusID&gt; &lt;CompanyAccountTypeID&gt;1&lt;/CompanyAccountTypeID&gt; &lt;InitializationDate&gt;2020-04-28T00:00:00+02:00&lt;/InitializationDate&gt; &lt;UpdateDate&gt;2020-04-28T20:00:06.046+02:00&lt;/UpdateDate&gt; &lt;/CompanyAccount&gt; &lt;/CompanyAccountDataSet&gt;</GetCompanyAccountResult></GetCompanyAccountResponse></soap:Body></soap:Envelope>';
    xmlStr = unescapeXml(xmlStr);

    var xmlDocument = xml.Parser.fromString(xmlStr);

    // TODO call a function which will return an array of objects containing xml node values
    var elements = parseXml(xmlDocument);
    var elements2 = parseXmlForCompanyAccounts(xmlDocument);

    params.response.addHeader({
      name: 'Content-Type',
      value: 'application/json'
    });
    params.response.write({
      output: JSON.stringify(elements2)
    });

  }

  return {
    onRequest: onRequest,
  };

});