/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
define([ "./util_nbs", "N/record", "N/https", "N/xml", "N/query", 'N/runtime', './rsm_config_util' ],

function(util_nbs, record, https, xml, query, runtime, rsm_config_util) {

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
		var l_sql = " select custentity_pib as cpib, id as cid from vendor ";
		l_sql += " where (substr(custentity_pib,1,1)='1') ";
		l_sql += " AND (length(custentity_pib) = 9) ";
		l_sql += " AND (not exists (select id from customrecord_2663_entity_bank_details where custrecord_2663_parent_vendor = vendor.id)) ";

		var myPagedResults = query.runSuiteQL({
			query : l_sql
		});

		var retArr = myPagedResults.asMappedResults();

		log.audit({title : 'RetArr', details : retArr.length});
		return retArr;

	}

	/**
	 * Executes when the map entry point is triggered and applies to each
	 * key/value pair.
	 * 
	 * @param {MapSummary} context - Data collection containing the key/value pairs to process through the map stage
	 * @param {string} context.value
	 *
	 * @var {Object} result
	 * @property {string} result.cpib
	 * @property {number} result.cid
	 *
	 * @var {Object} dArray
	 * @property {string} dArray.CompanyName
	 * @property {string} dArray.City
 	 * @property {string} dArray.Address
	 *
	 * @since 2015.1
	 */
	function map(context) {
		var result = JSON.parse(context.value);

		var queryTag = util_nbs.generateQueryTag({
			"accountNumber" : "",
			"nationalIdentificationNumber" : "",
			"taxIdentificationNumber" : result.cpib
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

		// log.debug('dArray',dArray);
		if (dArray.length > 0) {
			var accConfig = rsm_config_util.AccountConfig.load();
			for (var ia = 0; ia < dArray.length; ia++) {
				//log.debug("Response from NBS", dArray);
				var dummy = util_nbs.buildFullBankAccount_server({
					"BankCode" : dArray[ia].BankCode,
					"AccountNumber" : dArray[ia].AccountNumber,
					"ControlNumber" : dArray[ia].ControlNumber
				});
				try {
					var rec = record.create({
						type : 'customrecord_2663_entity_bank_details'
					});
					//log.debug('ID new REC',rec);

					rec.setValue({
						fieldId : 'name',
						value : dummy + ' - ' + dArray[ia].CompanyName
					});
					
					rec.setValue({
						fieldId : 'custrecord_2663_parent_vendor',
						value : result.cid
					});

					rec.setValue({
						fieldId : 'custrecord_2663_entity_bank_type',
						value : 2
					});

					rec.setValue({
						fieldId : 'custrecord_2663_entity_acct_name',
						value : dArray[ia].CompanyName
					});

					rec.setValue({
						fieldId : 'custrecord_2663_entity_acct_no',
						value : dummy
					});

					rec.setValue({
						fieldId : 'custrecord_2663_entity_file_format',
						value : accConfig.getBankFF(),
						ignoreFieldChange : true
					});

					rec.setValue({
						fieldId : 'custrecord_2663_entity_bank_name',
						value : dArray[ia].BankName
					});

					rec.setValue({
						fieldId : 'custrecord_2663_entity_city',
						value : dArray[ia].City
					});
					rec.setValue({
						fieldId : 'custrecord_2663_entity_address1',
						value : dArray[ia].Address
					});

					rec.save();
				} catch (e) {
					log.error( {title :'Error', details: e.message});
				}

			}
		}

	}

	/**
	 * Executes when the reduce entry point is triggered and applies to each
	 * group.
	 * 
	 * @param {ReduceSummary} context
	 *
	 * @since 2015.1
	 */
	function reduce(context) {

	}

	/**
	 * Executes when the summarize entry point is triggered and applies to the
	 * result set.
	 * 
	 * @param {Summary} summary
	 *
	 * @since 2015.1
	 */
	function summarize(summary) {
		log.audit({ title : 'inputSummary:Usage', details : summary.inputSummary.usage});
		log.audit({ title : 'mapSummary:Usage', details : summary.mapSummary.usage});
		log.audit({ title : 'reduceSummary:Usage', details : summary.reduceSummary.usage});
		log.audit({ title : 'Usage', details : summary.usage});
	}

	return {
		getInputData : getInputData,
		map : map,
		reduce : reduce,
		summarize : summarize
	};

});
