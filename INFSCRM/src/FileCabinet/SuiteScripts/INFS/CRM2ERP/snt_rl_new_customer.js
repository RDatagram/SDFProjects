/**
 * @NApiVersion 2.0
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 */
define([ 'N/record', './rsm_crm2erp_util' ],

function(record, rsm_crm2erp) {

	/**
	 *
	 * @param requestParams
	 * @param requestParams.customerid
	 *
	 * @returns {{result: string, errorName, message}|{result: string, record: Record}}
	 */
	function doGet(requestParams) {
		try {
			var custRec = record.load({
				type : 'customer',
				id : requestParams.customerid
			});
			return {
				"result" : "ok",
				"record" : custRec 
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
	 *
	 * @param requestBody
	 * @param requestBody.companyname
	 * @param requestBody.subsidiary
	 * @param requestBody.externalid
	 * @param requestBody.isindividual
	 * @param requestBody.custentity_matbrpred
	 * @param requestBody.custentity_pib
	 * @param requestBody.custentity_cus_inokupac
	 * @param requestBody.email
	 * @param requestBody.url
	 * @param requestBody.address
	 * @param requestBody.currency
	 * @param requestBody.mobilephone
	 * @param requestBody.phone
	 * @param requestBody.fax
	 * @param requestBody.altphone
	 * @param requestBody.receivableaccount
	 *
	 * @returns {{result: string, internalid: (*|number), errInfo: *[]}|{result: string, errorName, message}}
	 */
	function doPost(requestBody) {

		var vCustName = requestBody.companyname;
		var vSubsidiary = requestBody.subsidiary;
		var vExtId = requestBody.externalid;
		var vIsIndividual = requestBody.isindividual;
		var vCustEntity_matbrpred = requestBody.custentity_matbrpred || '';
		var vCustEntity_pib = requestBody.custentity_pib || '';
		var vCustEntity_cus_inokupac = requestBody.custentity_cus_inokupac || false;
		
		var vEmail = requestBody.email || '';
		var vWeb = requestBody.url || ''; // allowed only for company
		
		var vReceivableAccount = requestBody.receivableaccount || '20400';
		log.debug({title:"vReceivableAccount",details:vReceivableAccount});
		var vReceivableAccountID = rsm_crm2erp.GetChartOfAccountId(vReceivableAccount);
		log.debug({title:"vReceivableAccountID",details:vReceivableAccountID});

		var vAddress = requestBody.address;

		const vCurrency = requestBody.currency;

		var vCurrencyID;
		if (vCurrency){
			// poslata valuta
			vCurrencyID = rsm_crm2erp.getCurrencyId(vCurrency);
		} else {
			// nije poslata valuta
			if (vCustEntity_cus_inokupac) {
				return {
					"result" : "error",
					"message" : 'Za ino kupce VALUTA obavezna',
					"errorName" : 'Required value'
				}
			} else {
				vCurrencyID = rsm_crm2erp.getCurrencyId('RSD');
			}
		}

		if (vIsIndividual){
			//proveri JMBG
			if (vCustEntity_matbrpred.length === 13) {
				// JMBG duzine 13 mora biti da bi isli u proveru
				if (rsm_crm2erp.CheckMatBrExisting(vCustEntity_matbrpred)) {
					return {
						"result": "error",
						"message": 'Postoji fizicko lice sa poslatim JMBG',
						"errorName": 'Duplicate JMBG'
					}
				}
			}
		} else {
			//proveri PIB
			if (vCustEntity_pib.length === 9) {
				// PIB duzine 9 mora biti da bi isli u proveru
				if (rsm_crm2erp.CheckPibExisting(vCustEntity_pib)) {
					return {
						"result": "error",
						"message": 'Postoji customer sa poslatim PIB-om',
						"errorName": 'Duplicate PIB'
					}
				}
			}
		}
		var errInfo = [];

		/**
		 * HELPER FUNCTION
		 * Avoid rejecting create customer for "nebitna" fields with NetSuite validation like: weburl, email, 
		 */
		function trySetValue(recObj, fieldId, value){
			
			// Privremeno izbacen try..catch .. ako se na kraju opredelimo da ipak bude..
			recObj.setValue(fieldId, value);
			
		}
		
		try {
			var newCust = record.create({
				type : record.Type.CUSTOMER,
				isDynamic : true
			});

			newCust.setValue('isperson', vIsIndividual ? "T" : "F");
			
			if (vIsIndividual){
				// Individual
				newCust.setValue('firstname', vCustName);	
				newCust.setValue('mobilephone', requestBody.mobilephone || '');
				
			} else {
				// Company
				newCust.setValue('companyname', vCustName);		
				trySetValue(newCust,'url',vWeb);
			}

			newCust.setValue('subsidiary', vSubsidiary);

			if (vExtId) {
				newCust.setValue('externalid', vExtId);
			}

			newCust.setValue('custentity_matbrpred', vCustEntity_matbrpred);
			newCust.setValue('custentity_pib', vCustEntity_pib);
			newCust.setValue('custentity_cus_inokupac', vCustEntity_cus_inokupac);

			trySetValue(newCust, 'phone',requestBody.phone || '');
			trySetValue(newCust, 'altphone',requestBody.altphone || '');
			trySetValue(newCust, 'fax',requestBody.fax || '');

			trySetValue(newCust, 'currency', vCurrencyID);

			newCust.setValue('receivablesaccount', vReceivableAccountID);
	
			trySetValue(newCust,'email', vEmail);
			
			/**
			 * Address
			 */
			if (vAddress) {
				for (var ix = 0; ix < vAddress.length; ix++) {
					
					newCust.selectNewLine({
						sublistId : 'addressbook'
					});
					
					newCust.setCurrentSublistValue({
						sublistId : 'addressbook',
						fieldId : 'label',
						value : vAddress[ix].label
					});

					var subrec = newCust.getCurrentSublistSubrecord({
						sublistId : 'addressbook',
						fieldId : 'addressbookaddress'
					});

					subrec.setValue({
						fieldId : 'country',
						value : vAddress[ix].country
					});

					subrec.setValue({
						fieldId : 'city',
						value : vAddress[ix].city || ''
					});
					subrec.setValue({
						fieldId : 'zip',
						value : vAddress[ix].zip || ''
					});
					subrec.setValue({
						fieldId : 'addr1',
						value : vAddress[ix].addr1 || ''
					});
					subrec.setValue({
						fieldId : 'addr2',
						value : vAddress[ix].addr2 || ''
					});
					newCust.commitLine({
						sublistId : 'addressbook'
					});
				}

			}
			
			var nId = newCust.save({
				enableSourcing : true,
				ignoreMandatoryFields : true
			});
						

			
			return {
				"result" : 'ok',
				"internalid" : nId,
				"errInfo" : errInfo
			}
			
		} catch (e) {
			log.error('Error', JSON.stringify(e));
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
	 * @param requestParams
	 *
	 * @returns {string | Object} HTTP response body; return string when request
	 *          Content-Type is 'text/plain'; return Object when request
	 *          Content-Type is 'application/json'
	 * @since 2015.2
	 */
	function doDelete(requestParams) {
			try {
				record["delete"]({
					type : 'customer',
					id : requestParams.customerid
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
		'get': doGet,
		post : doPost,
	   'delete': doDelete
	};

});
