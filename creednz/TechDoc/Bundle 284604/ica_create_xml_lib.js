var MSG_TYPE = [];
MSG_TYPE["CHK"] = "custrecord_checkmessage";
MSG_TYPE["DAC"] = "custrecord_achmessage";
MSG_TYPE["MTS"] = "custrecord_mtsmessage";
MSG_TYPE["IAC"] = "custrecord_iacmessage";
MSG_TYPE["IWI"] = "custrecord_iwimessage";
MSG_TYPE["CCR"] = "custrecord_ccr_message";

var NSUtils = {};

NSUtils.toJSON = function (res) {
	if (res == null) return [];
	var jsonArr = [];
	try {
		for (var i = 0; i < res.length; i++) {
			var columns = res[i].getAllColumns();
			var jsonObj = { internalid: res[i].getId() };
			for (var j = 0; j < columns.length; j++) {
				var propertyName = columns[j].getLabel();

				if (columns[j].getJoin() != null) {
					if (columns[j].getSummary() != null) {
						if (propertyName == "" || propertyName == null)
							propertyName = columns[j].getName() + "_" + columns[j].getJoin() + "_" + columns[j].getSummary();
						jsonObj[propertyName] =
							res[i].getText(columns[j].getName(), columns[j].getJoin(), columns[j].getSummary()) ||
							res[i].getValue(columns[j].getName(), columns[j].getJoin(), columns[j].getSummary());
						propertyName = propertyName + "_id";
						jsonObj[propertyName] =
							res[i].getValue(columns[j].getName(), columns[j].getJoin(), columns[j].getSummary()) ||
							res[i].getValue(columns[j].getName(), columns[j].getJoin(), columns[j].getSummary());
					} else {
						if (propertyName == "" || propertyName == null) propertyName = columns[j].getName() + "_" + columns[j].getJoin();
						jsonObj[propertyName] =
							res[i].getText(columns[j].getName(), columns[j].getJoin()) ||
							res[i].getValue(columns[j].getName(), columns[j].getJoin());
						propertyName = propertyName + "_id";
						jsonObj[propertyName] =
							res[i].getValue(columns[j].getName(), columns[j].getJoin()) ||
							res[i].getValue(columns[j].getName(), columns[j].getJoin());
					}
				} else {
					if (columns[j].getSummary() != null) {
						if (propertyName == "" || propertyName == null) propertyName = columns[j].getName() + "_" + columns[j].getSummary();
						jsonObj[propertyName] =
							res[i].getText(columns[j].getName(), null, columns[j].getSummary()) ||
							res[i].getValue(columns[j].getName(), null, columns[j].getSummary());
						propertyName = propertyName + "_id";
						jsonObj[propertyName] =
							res[i].getValue(columns[j].getName(), null, columns[j].getSummary()) ||
							res[i].getValue(columns[j].getName(), null, columns[j].getSummary());
					} else {
						if (propertyName == "" || propertyName == null) propertyName = columns[j].getName();
						jsonObj[propertyName] = res[i].getText(columns[j].getName()) || res[i].getValue(columns[j].getName());
						propertyName = propertyName + "_id";
						jsonObj[propertyName] = res[i].getValue(columns[j].getName());
					}
				}
			}
			jsonArr.push(jsonObj);
		}
		return jsonArr;
	} catch (e) {
		log.error("nlobjSearchResults2JSON: Unexpected Error -", e.message);
		return null;
	}
};

function getVendorPaymentInfos() {
	var vpiArr = [];

	var vpiRes = nlapiSearchRecord(
		"customrecord_vendorpaymentinfo",
		null,
		[["isinactive", "is", "F"]],
		[
			new nlobjSearchColumn("internalid"),
			new nlobjSearchColumn("custrecord_ceocompid"),
			new nlobjSearchColumn("custrecord_checkmessage"),
			new nlobjSearchColumn("custrecord_check_doc_no"),
			new nlobjSearchColumn("custrecord_companyname"),
			new nlobjSearchColumn("custrecord_compadd1"),
			new nlobjSearchColumn("custrecord_compadd2"),
			new nlobjSearchColumn("custrecord_compcity"),
			new nlobjSearchColumn("custrecord_compstateprov"),
			new nlobjSearchColumn("custrecord_comppostcode"),
			new nlobjSearchColumn("custrecord_compcountrycode"),
			new nlobjSearchColumn("custrecord_invoicetype"),
			new nlobjSearchColumn("custrecord_bankname"),
			new nlobjSearchColumn("custrecord_recbankpriidtype"),
			new nlobjSearchColumn("custrecord_ica_bpm_subsidiary"),
			new nlobjSearchColumn("custrecord_orgpartyrecid"),
			new nlobjSearchColumn("custrecord_originacctbankidtype"),
			new nlobjSearchColumn("custrecord_origbankid"),
			new nlobjSearchColumn("custrecord_orgaddind"),
			new nlobjSearchColumn("custrecord_originatingacctype"),
			new nlobjSearchColumn("custrecord_orginacc"),
			new nlobjSearchColumn("custrecord_orig_check_account"),
			new nlobjSearchColumn("custrecord_compaddname"),
			new nlobjSearchColumn("custrecord_compphone"),
			new nlobjSearchColumn("custrecord_potype"),
			new nlobjSearchColumn("custrecord_mtsmessage"),
			new nlobjSearchColumn("custrecord_division"),
			new nlobjSearchColumn("custrecord_companycurrency"),
			new nlobjSearchColumn("custrecord_achmessage"),
			new nlobjSearchColumn("custrecord_checkmessage"),
			new nlobjSearchColumn("custrecord_achrecordid"),
			new nlobjSearchColumn("custrecord_achcompanyid"),
			new nlobjSearchColumn("custrecord_notetype"),
			new nlobjSearchColumn("custrecord_iacmessage"),
			new nlobjSearchColumn("custrecord_iwimessage"),
			new nlobjSearchColumn("custrecord_interachcompanyid"),
			new nlobjSearchColumn("custrecord_dac_bank_id"),
			new nlobjSearchColumn("custrecord_dac_pmp_delivery_type"),
			new nlobjSearchColumn("custrecord_dac_pmp_eddbillerid"),
			new nlobjSearchColumn("custrecord_dac_pmp_file_format"),
			new nlobjSearchColumn("custrecord_dac_pmp_file_type"),
			new nlobjSearchColumn("custrecord_bankname"),
			new nlobjSearchColumn("custrecord_ccr_contact"),
			new nlobjSearchColumn("custrecord_ccr_phonetype"),
			new nlobjSearchColumn("custrecord_ccr_phonenum"),
			new nlobjSearchColumn("custrecord_ccr_reftype"),
			new nlobjSearchColumn("custrecord_comppostcode"),
			new nlobjSearchColumn("custrecord_man_number"),
			new nlobjSearchColumn("custrecord_orig_dac_account"),
			new nlobjSearchColumn("custrecord_check_bank_id"),
			new nlobjSearchColumn("custrecord_ccrrecid"),
			new nlobjSearchColumn("custrecord_ccr_message"),
			new nlobjSearchColumn("custrecordachmessage"),
			new nlobjSearchColumn("custrecord_orig_dac_account"),
			new nlobjSearchColumn("custrecord_check_bank_id"),
			new nlobjSearchColumn("custrecord_check_insert_type"),
			new nlobjSearchColumn("custrecord_check_insert_value"),
			new nlobjSearchColumn("custrecord_companycurrency"),
			new nlobjSearchColumn("custrecord_comppaycurr"),
			new nlobjSearchColumn("custrecord_ia_default_ap_account"),
			new nlobjSearchColumn("custrecord_ia_default_bank_account"),
			new nlobjSearchColumn("custrecord_cash_pro_send_id_bank_america"),
			new nlobjSearchColumn("custrecord_compcountrynames"),
		]
	);

	return NSUtils.toJSON(vpiRes);
}

/**
 * 14/07/2016 : Al can we make this pull the Vendor internal Id please, we can
 * then get rid of the merchant id field
 *
 * @param ids
 * @returns {Array}
 */
function getEntityDataV2(ids) {
	try {
		dAudit("getEntityDataV2", "Get Entity Data for ids : " + ids);

		var arrEntities = [];
		var arrDataTemp = [];
		var lastId = 0;

		var columns = [];
		columns.push(new nlobjSearchColumn("internalid").setSort());
		columns.push(new nlobjSearchColumn("custentity_paymentmethod"));
		columns.push(new nlobjSearchColumn("custentity_currency"));
		columns.push(new nlobjSearchColumn("custentity_recpartyaccttype"));
		columns.push(new nlobjSearchColumn("custentity_recpartyaccount"));
		columns.push(new nlobjSearchColumn("custentity_recbankprimidtype"));
		columns.push(new nlobjSearchColumn("custentity_recbankprimid"));
		columns.push(new nlobjSearchColumn("custentity_vendorname"));
		columns.push(new nlobjSearchColumn("custentity_vendoraddline1"));
		columns.push(new nlobjSearchColumn("custentity_vendoraddline2"));
		columns.push(new nlobjSearchColumn("custentity_vendor_phone_num"));
		columns.push(new nlobjSearchColumn("custentity_vendorcity"));
		columns.push(new nlobjSearchColumn("custentity_vendorstateprovince"));
		columns.push(new nlobjSearchColumn("custentity_vendorpostalcode"));
		columns.push(new nlobjSearchColumn("custentity_vendorcountrycode"));
		columns.push(new nlobjSearchColumn("custentity_merchantid"));
		columns.push(new nlobjSearchColumn("email"));
		columns.push(new nlobjSearchColumn("custentity_payee_email"));
		columns.push(new nlobjSearchColumn("custentity_bankname"));
		columns.push(new nlobjSearchColumn("custentity_bankaddressline1"));
		columns.push(new nlobjSearchColumn("custentity_bankcity"));
		columns.push(new nlobjSearchColumn("custentity_bankstate"));
		columns.push(new nlobjSearchColumn("custentity_bankpostcode"));
		columns.push(new nlobjSearchColumn("custentity_bankcountrycode"));
		columns.push(new nlobjSearchColumn("custentity_paymentformat"));
		columns.push(new nlobjSearchColumn("custentity_interpayformat"));
		columns.push(new nlobjSearchColumn("custentity_vendorbranchbankircid"));
		columns.push(new nlobjSearchColumn("custentity_forex_ref_type"));
		columns.push(new nlobjSearchColumn("custentity_forex_ref_id"));
		columns.push(new nlobjSearchColumn("custentity_pmp_dac_delivery_contact_name"));
		columns.push(new nlobjSearchColumn("custentity_pmp_dac_delivery_email_addres"));
		columns.push(new nlobjSearchColumn("custentity_courier_name"));
		columns.push(new nlobjSearchColumn("custentity_courier_account"));
		columns.push(new nlobjSearchColumn("custentity_courier_deliverycode"));
		columns.push(new nlobjSearchColumn("custentity_inter_bank_id_type"));
		columns.push(new nlobjSearchColumn("custentity_inter_bank_name"));
		columns.push(new nlobjSearchColumn("custentity_inter_bank_id"));
		columns.push(new nlobjSearchColumn("custentity_inter_bank_address_1"));
		columns.push(new nlobjSearchColumn("custentity_inter_bank_city"));
		columns.push(new nlobjSearchColumn("custentity_inter_bank_state"));
		columns.push(new nlobjSearchColumn("custentity_inter_bank_postal"));
		columns.push(new nlobjSearchColumn("custentity_inter_bank_country"));
		columns.push(new nlobjSearchColumn("custentity_check_style"));
		columns.push(new nlobjSearchColumn("custentity_pmp_biller_id"));
		columns.push(new nlobjSearchColumn("custentity_fas"));
		columns.push(new nlobjSearchColumn("custentity_ica_bill_pymt_single"));
		columns.push(new nlobjSearchColumn("custentity_ica_vendor_bank_instructions"));
		columns.push(new nlobjSearchColumn("custentity_ica_entity_check_insert_type"));
		columns.push(new nlobjSearchColumn("custentity_ica_entity_check_insert_value"));
		columns.push(new nlobjSearchColumn("custentity_ica_vendor_external_id"));
		columns.push(new nlobjSearchColumn("entityid"));
		columns.push(new nlobjSearchColumn("custentity_ica_bpm_is_fleet"));
		columns.push(new nlobjSearchColumn("custentity_ica_bns_use_iban"));
                columns.push(new nlobjSearchColumn("custentity_ica_location_code"));

		do {
			var filters = [];
			if (ids != null && ids != "") {
				filters.push(["internalid", "anyof", ids]);
				filters.push("AND");
			}
			filters.push(["internalidnumber", "greaterthan", lastId]);
			filters.push("AND");
			filters.push(["custentity_paymentmethod", "noneof", "@NONE@"]);
			filters.push("AND");
			filters.push(["isinactive", "is", "F"]);

			var tempResults = nlapiSearchRecord("entity", null, filters, columns);
			if (tempResults) {
				lastId = tempResults[tempResults.length - 1].getId();
				arrDataTemp = arrDataTemp.concat(tempResults);
			}
		} while (tempResults && tempResults.length == 1000);

		for (x in arrDataTemp) {
			var id = arrDataTemp[x].getValue("internalid");
			if (arrEntities[id] == null) arrEntities[id] = [];
			arrEntities[id] = {
				internalid: arrDataTemp[x].getValue("internalid"),
				paymentmethod: arrDataTemp[x].getText("custentity_paymentmethod"),
				currency: arrDataTemp[x].getValue("custentity_currency"),
				recpartyaccttype: arrDataTemp[x].getText("custentity_recpartyaccttype"),
				recpartyaccount: arrDataTemp[x].getValue("custentity_recpartyaccount"),
				recbankprimidtype: arrDataTemp[x].getText("custentity_recbankprimidtype"),
				recbankprimid: arrDataTemp[x].getValue("custentity_recbankprimid"),
				vendorname: arrDataTemp[x].getValue("custentity_vendorname"),
				vendoraddrs1: arrDataTemp[x].getValue("custentity_vendoraddline1"),
				vendoraddrs2: arrDataTemp[x].getValue("custentity_vendoraddline2"),
				vendorphone: arrDataTemp[x].getValue("custentity_vendor_phone_num"),
				vendorcity: arrDataTemp[x].getValue("custentity_vendorcity"),
				vendorstateprovince: arrDataTemp[x].getValue("custentity_vendorstateprovince"),
				vendorpostal: arrDataTemp[x].getValue("custentity_vendorpostalcode"),
				vendorcountrycode: arrDataTemp[x].getText("custentity_vendorcountrycode"),
				merchantid: arrDataTemp[x].getValue("internalid"),
				email: arrDataTemp[x].getValue("email"),
				vemailadrs: arrDataTemp[x].getValue("custentity_payee_email"),
				vbankname: arrDataTemp[x].getValue("custentity_bankname"),
				vbankaddrs1: arrDataTemp[x].getValue("custentity_bankaddressline1"),
				vbankcity: arrDataTemp[x].getValue("custentity_bankcity"),
				vbankstate: arrDataTemp[x].getValue("custentity_bankstate"),
				vbankzip: arrDataTemp[x].getValue("custentity_bankpostcode"),
				vbankcountry: arrDataTemp[x].getText("custentity_bankcountrycode"),
				custentity_paymentformat: arrDataTemp[x].getText("custentity_paymentformat"),
				custentity_interpayformat: arrDataTemp[x].getValue("custentity_interpayformat"),
				bankid: arrDataTemp[x].getValue("custentity_vendorbranchbankircid"),
				fx_reftype: arrDataTemp[x].getText("custentity_forex_ref_type"),
				fx_refid: arrDataTemp[x].getValue("custentity_forex_ref_id"),
				pmp_dac_contactname: arrDataTemp[x].getValue("custentity_pmp_dac_delivery_contact_name"),
				pmp_dac_emailaddress: arrDataTemp[x].getValue("custentity_pmp_dac_delivery_email_addres"),
				couriername: arrDataTemp[x].getValue("custentity_courier_name"),
				courieraccount: arrDataTemp[x].getValue("custentity_courier_account"),
				deliverycode: arrDataTemp[x].getText("custentity_courier_deliverycode"),
				custentity_inter_bank_id_type: arrDataTemp[x].getText("custentity_inter_bank_id_type"),
				custentity_inter_bank_name: arrDataTemp[x].getValue("custentity_inter_bank_name"),
				custentity_inter_bank_id: arrDataTemp[x].getValue("custentity_inter_bank_id"),
				custentity_inter_bank_address_1: arrDataTemp[x].getValue("custentity_inter_bank_address_1"),
				custentity_inter_bank_city: arrDataTemp[x].getValue("custentity_inter_bank_city"),
				custentity_inter_bank_state: arrDataTemp[x].getValue("custentity_inter_bank_state"),
				custentity_inter_bank_postal: arrDataTemp[x].getValue("custentity_inter_bank_postal"),
				custentity_inter_bank_country: arrDataTemp[x].getText("custentity_inter_bank_country"),
				custentity_check_style: arrDataTemp[x].getText("custentity_check_style"),
				custentity_pmp_biller_id: arrDataTemp[x].getText("custentity_pmp_biller_id"),
				custentity_fas: arrDataTemp[x].getValue("custentity_fas"),
				custentity_ica_bill_pymt_single: arrDataTemp[x].getValue("custentity_ica_bill_pymt_single"),
				custentity_ica_vendor_bank_instructions: arrDataTemp[x].getValue("custentity_ica_vendor_bank_instructions"),
				custentity_ica_entity_check_insert_type: arrDataTemp[x].getValue("custentity_ica_entity_check_insert_type"),
				custentity_ica_entity_check_insert_value: arrDataTemp[x].getValue("custentity_ica_entity_check_insert_value"),
				custentity_ica_vendor_external_id: arrDataTemp[x].getValue("custentity_ica_vendor_external_id"),
				entityid: arrDataTemp[x].getValue("entityid"),
				custentity_ica_bpm_is_fleet: arrDataTemp[x].getValue("custentity_ica_bpm_is_fleet"),
				custentity_ica_bns_use_iban: arrDataTemp[x].getValue("custentity_ica_bns_use_iban"),
                                custentity_ica_location_code: arrDataTemp[x].getValue("custentity_ica_location_code")                                
			};
		}

		return arrEntities;
	} catch (e) {
		dErr("getEntityDataV2 | ERROR ", e.message);
	}
}

// function getTransactionData(billIds) {

//     billIds.sort();
//     var arr = billIds;

//     var billsData = [];
//     if (billIds.length < 1) return billsData;

//     var arrDataTemp = [];
//     var columns = [];
//     columns.push('internalid');

//     while (billIds.length>999) {
//         arr = billIds.splice(0, billIds.indexOf(billIds[999]));

//         var filters = [];
//         filters.push('internalid', 'anyof', billIds);
//         filters.push('AND');
//         filters.push('mainline', 'is', 'T');
//         var results = nlapiSearchRecord('transaction', null, filters, columns);

//         arrDataTemp = arrDataTemp.concat(results);
//     }

//     var filters = [];
//     filters.push('internalid', 'anyof', billIds);
//     filters.push('AND');
//     filters.push('mainline', 'is', 'T');

//     var tempResults = nlapiSearchRecord('transaction', null, filters, columns);
//     if (arrDataTemp.length==0) {
//         arrDataTemp = tempResults;
//     } else {
//         arrDataTemp = arrDataTemp.concat(tempResults);
//     }

//     var results = arrDataTemp;

//     return billsData;
// }

function getCurrencyCodes() {
  var currencyJSON = {};
  try {
    var res = nlapiSearchRecord("currency", null, null, new nlobjSearchColumn("symbol"));    
    for (var i = 0; i < res.length; i++) {
      currencyJSON[res[i].getId()] = res[i].getValue("symbol");
    }
    return currencyJSON;  
  } catch (e) {
    currencyJSON[1] = 'USD';
    return currencyJSON;  
  }
}

//function getBillTransactionData(ids) {
//     var arrData = [];

//     var filters = [];
//     filters.push(['mainline', 'is', 'T']);
//     filters.push('AND');
//     filters.push(['internalid', 'anyof', ids]);

//     var columns = [];
//     columns.push(new nlobjSearchColumn('memo'));
//     columns.push(new nlobjSearchColumn('trandate'));

//     var res = nlapiSearchRecord('transaction', null, filters, columns);

//     if ((res!=null)&&(res.length>0)) {
//         for (var i=0; i<res.length; i++) {
//             arrData.push({
//                 internalid: res[i].getId(),
//                 memo: res[i].getValue('memo'),
//                 trandate: res[i].getValue('trandate')
//             })
//         }
//     }
//     return arrData;
// }

function getBillTransactionData(billIds) {
	billIds.sort();
	var arr = billIds;

	var arrData = [];
	if (billIds.length < 1) return arrData;

	var columns = [];
	columns.push(new nlobjSearchColumn("memo"));
	columns.push(new nlobjSearchColumn("trandate"));

        var addCheckZip = false;
        var checkzips = [];
        if (CHECKZIP_INTERNALIDS) {
                dLog('CHECKZIP_INTERNALIDS', CHECKZIP_INTERNALIDS);
                var internalids = CHECKZIP_INTERNALIDS.split(",");
                var cleaned = [];
                for (var i = 0; i < internalids.length; i++) {
                        cleaned.push(internalids[i].trim());
                }
                internalids = cleaned;

                if (validateBillColumns(internalids)) {
                        dLog('Valid fields for check zip complete', internalids);
                        for (var i = 0; i < internalids.length; i++) {
                                columns.push(new nlobjSearchColumn(internalids[i]));
                        }
                        addCheckZip = true;
                        checkzips = internalids;
                }
        }


	var arrDataTemp = [];

	while (billIds.length > 999) {
		arr = billIds.splice(0, billIds.indexOf(billIds[999]));
		var filters = [];
		filters.push(["mainline", "is", "T"]);
		filters.push("AND");
		filters.push(["internalid", "anyof", arr]);

		var results = nlapiSearchRecord("transaction", null, filters, columns);
		arrDataTemp = arrDataTemp.concat(results);
	}

	var filters = [];
	filters.push(["mainline", "is", "T"]);
	filters.push("AND");
	filters.push(["internalid", "anyof", billIds]);
	var tempResults = nlapiSearchRecord("transaction", null, filters, columns);

	if (arrDataTemp.length == 0) {
		arrDataTemp = tempResults;
	} else {
		arrDataTemp = arrDataTemp.concat(tempResults);
	}

	var res = arrDataTemp;

	if (res != null && res.length > 0) {
		for (var i = 0; i < res.length; i++) {
                        var obj = {
				internalid: res[i].getId(),
				memo: res[i].getValue("memo"),
				trandate: res[i].getValue("trandate"),
			};
                        if (addCheckZip) {
                                for (var z=0; z<checkzips.length; z++) {
                                        obj[checkzips[z]] = res[i].getValue(checkzips[z]);
                                        // arrData[id][checkzips[z]] = results[i].getValue(checkzips[z]);        
                                }
                        }
			arrData.push(obj);


		}
	}
	return arrData;
}



function createXMLDocSingle(accountMapping) {
	//yield if less than 2000?

	if (nlapiGetContext().getRemainingUsage() < 2000) {
		nlapiLogExecution("AUDIT", "yieldIfRequired", "*** Yielding ***");

		var tempEMAIL_SENDER = EMAIL_SENDER;
		var tempEMAIL_SENDER_EMAIL = EMAIL_SENDER_EMAIL;
		var tempSUB_ID = SUB_ID;
		var tempACCOUNT = ACCOUNT;
		var tempAPACCOUNT = APACCOUNT;
		var tempBPM_DATE = BPM_DATE;
    var tempPROCESSASCHECK = PROCESS_AS_CHECK;

		var yieldObject = nlapiYieldScript();
		nlapiLogExecution("AUDIT", "yieldIfRequired", "Yield size: ", yieldObject.size);
		if (yieldObject.status !== "RESUME") {
			nlapiLogExecution("ERROR", "yieldIfRequired", "Yield status: " + yieldObject.status, yieldObject.reason);
			throw nlapiCreateError("YIELD_ERROR", yieldObject.reason);
		}
		nlapiLogExecution("AUDIT", "yieldIfRequired", "*** Resuming from Yield ***", yieldObject ? yieldObject.size || "" : "");

		EMAIL_SENDER = tempEMAIL_SENDER;
		EMAIL_SENDER_EMAIL = tempEMAIL_SENDER_EMAIL;
		SUB_ID = tempSUB_ID;
		ACCOUNT = tempACCOUNT;
		APACCOUNT = tempAPACCOUNT;
		BPM_DATE = tempBPM_DATE;
    PROCESS_AS_CHECK = tempPROCESSASCHECK;

		var objLog = {
			EMAIL_SENDER: EMAIL_SENDER,
			EMAIL_SENDER_EMAIL: EMAIL_SENDER_EMAIL,
			SUB_ID: SUB_ID,
			ACCOUNT: ACCOUNT,
			APACCOUNT: APACCOUNT,
			BPM_DATE: BPM_DATE,
      PROCESS_AS_CHECK: PROCESS_AS_CHECK
		};
		dAudit("yielded", JSON.stringify(objLog));
	}

	//Get all related records

	// dAudit('createXMLDocSingle:accountMapping', JSON.stringify(accountMapping));
	dAudit("createXMLDocSingle:arrBillsProcessed.length", arrBillsProcessed.length);

	//get all entity data. extract entityid from arrBillsProcessed
	//get all bill payments data. extract billpayment id from arrBillsProcessed

	var billIds = _.uniq(_.map(arrBillsProcessed, "id"));
	dAudit("createXMLDocSingle-billIds", JSON.stringify(billIds));
	var billPaymentIds = _.uniq(_.map(arrBillsProcessed, "payment"));
	var vendorIds = _.uniq(_.map(arrBillsProcessed, "payeeid"));

	var arrBillPO = getPOMap(billIds); //old function. recode once you get clarity.
	var accountData = accountMapping[0];
	var vendorsData = getEntityDataV2(vendorIds); //recode, still using the old implementation.
	var billPaymentsData = getBillTransactionData(billPaymentIds); //todo - clean this function.
	var billsData = getBillTransactionData(billIds); //to retrieve other infos from bill. this might get confusing.
	var arrBillCredits = getBillCredit(billIds);
	var vendorPaymentInfoData = getVendorPaymentInfos();
	var arrChecksData = getCheckDetails(billIds);

	dAudit("createXMLDocSingle-arrChecksData", JSON.stringify(arrChecksData));
	dAudit("createXMLDocSingle-billPaymentsData", billPaymentsData.length);
	dAudit("createXMLDocSingle-billsData", billsData.length);
	dAudit("createXMLDocSingle:nsAccountSub", JSON.stringify(arrBillCredits));

	var nsAccountSub =
		!isEmpty(accountData) && !isEmpty(accountData.getValue("subsidiary", "CUSTRECORD_ACCT_MAP_NETSUITE_ACCOUNT"))
			? accountData.getValue("subsidiary", "CUSTRECORD_ACCT_MAP_NETSUITE_ACCOUNT")
			: "";
	dAudit("createXMLDocSingle:nsAccountSub", JSON.stringify(nsAccountSub));

	var vendorPaymentInfo = _.filter(vendorPaymentInfoData, { custrecord_ica_bpm_subsidiary_id: nsAccountSub })[0];
	dAudit("createXMLDocSingle:vendorPaymentInfo", JSON.stringify(vendorPaymentInfo));

	var arrCurrencyMap = getCurrencyCodes();

	var currDate = formatDate(new Date());
	var schema = nlapiGetContext().getSetting("SCRIPT", "custscript_v16_xml_schema");
	var xmlDoc = nlapiStringToXML('<?xml version="1.0"?><File></File>');
	var fileNode = getNode(xmlDoc, "/File");

	setAttributeValue(fileNode, "CompanyID", COMPANY_PREFIX);
	setAttributeValue(fileNode, "xmlns:xsi", isEmpty(schema) ? "http://www.w3.org/2001/XMLSchema-instance" : schema);

	var pmtRecTotal = 0;
	var pmtRecTotalDue = 0;

	//Remove from arrBillsProcessed, bill credits.

	var farrBillsProcessed = [];
	try {
		farrBillsProcessed = _.reject(arrBillsProcessed, { payment: "CREDIT" });
		farrBillsProcessed = _.reject(farrBillsProcessed, { payment: "XXXNONEXXX" });
	} catch (e) {
		dErr("Filtering Error", e.message);
	}

	//Return blank xmlDoc if farrBillsProcessed is 0?
	try {
		if (farrBillsProcessed.length == 0) {
			dLog("There are no bill payments created, no xml is needed. Returning...", farrBillsProcessed);
			return "";
		}
	} catch (e) {
		dErr("Error", e.message);
	}

	for (var i = 0; i < farrBillsProcessed.length; i++) {
		var pmtRecNode = addNodeFromParentNode(xmlDoc, fileNode, "PmtRec");
		var bill = farrBillsProcessed[i];
		dAudit("processBillsSingle-bill", JSON.stringify(bill));

		var vendor = vendorsData[bill.payeeid];
		dAudit("vendor", JSON.stringify(vendor));
		pmtRecTotal += Number(bill.payamt); //previously bill.payamt
		pmtRecTotalDue += Number(bill.amtdue); //previously bill.payamt
		var billpayment = _.find(billPaymentsData, { internalid: String(bill.payment) }); //[bill.payment];
		var billdata = _.find(billsData, { internalid: String(bill.id) });

		var billcredits = arrBillCredits[bill.id];

		dAudit("billcredits", JSON.stringify(billcredits));

		//To be used for check insert
		var checkAddress = _.find(arrChecksData, { internalid: String(bill.id) });

		if (billpayment == undefined) billpayment = {};
		if (billdata == undefined) billdata = {};

		var pmtMethod = bill.paymethod;
    if (PROCESS_AS_CHECK == 'T') pmtMethod = 'CHK';
		var paymentMethod = {
			CHK: function () {
				setAttributeValue(pmtRecNode, "PmtCrDr", "C");
				setAttributeValue(pmtRecNode, "PmtMethod", pmtMethod);

				if (bill.payment == "check") {
					// setAttributeValue(pmtRecNode, 'PmtFormatIntl', 'DEP'); //ask Al where to get
					setAttributeValue(pmtRecNode, "TranHandlingCode", "U");
				} else {
					if (!isEmpty(vendor.custentity_interpayformat)) {
						setAttributeValue(pmtRecNode, "PmtFormatIntl", vendor.custentity_interpayformat);
					}
					if (!isEmpty(vendor.custentity_pmp_biller_id)) {
						setAttributeValue(pmtRecNode, "TranHandlingCode", "U");
					} else if (!isEmpty(accountData) && !isEmpty(accountData.getValue("custrecord_acct_map_pmp_biller_id"))) {
						setAttributeValue(pmtRecNode, "TranHandlingCode", "U");
					}
				}

				if (bill.payment == "check") {
					addTextNodeFromParentNode(xmlDoc, pmtRecNode, "PmtID", bill.id);
				} else {
					addTextNodeFromParentNode(xmlDoc, pmtRecNode, "PmtID", bill.refnum);
				}

				if (!isEmpty(bill.currid)) {
					var curCode = arrCurrencyMap[bill.currid];
					addTextNodeFromParentNode(xmlDoc, pmtRecNode, "CurCode", curCode);
				} else if (!isEmpty(bill.curr)) {
					var curCode = arrCurrencyMap[bill.curr];
					addTextNodeFromParentNode(xmlDoc, pmtRecNode, "CurCode", curCode);
				}

				addTextNodeFromParentNode(xmlDoc, pmtRecNode, "ValueDate", formatDate(nlapiStringToDate(BPM_DATE)));

				// if (!isEmpty(vendorPaymentInfo)) {
				//     if ((!isEmpty(vendorPaymentInfo.custrecord_check_insert_type)) ||
				//         (!isEmpty(vendorPaymentInfo.custrecord_check_insert_value))) {

				//         var iacRefInfo = addNodeFromParentNode(xmlDoc, pmtRecNode, 'RefInfo');
				//         if (!isEmpty(vendorPaymentInfo.custrecord_check_insert_type)) {
				//             setAttributeValue(iacRefInfo, 'RefType', vendorPaymentInfo.custrecord_check_insert_type);
				//         }

				//         if (!isEmpty(vendorPaymentInfo.custrecord_check_insert_value)) {
				//             addTextNodeFromParentNode(xmlDoc, iacRefInfo, 'RefID', vendorPaymentInfo.custrecord_check_insert_value);
				//         }
				//     }
				// }
				var refType = "";
				var refId = "";
				dAudit(
					"possible refType Values",
					JSON.stringify({
						vendor: vendor.custentity_ica_entity_check_insert_type,
						accountMapping: accountData.getValue("custrecord_ica_acct_map_check_inert_type"),
						vpi: vendorPaymentInfo.custrecord_check_insert_type,
					})
				);
				refType =
					vendor.custentity_ica_entity_check_insert_type ||
					accountData.getValue("custrecord_ica_acct_map_check_inert_type") ||
					vendorPaymentInfo.custrecord_check_insert_type ||
					"";

				dAudit(
					"possible refId Values",
					JSON.stringify({
						vendor: vendor.custentity_ica_entity_check_insert_value,
						accountMapping: accountData.getValue("custrecord_ica_acct_map_check_insert_val"),
						vpi: vendorPaymentInfo.custrecord_check_insert_value,
					})
				);
				refId =
					vendor.custentity_ica_entity_check_insert_value ||
					accountData.getValue("custrecord_ica_acct_map_check_insert_val") ||
					vendorPaymentInfo.custrecord_check_insert_value ||
					"";

				if (!isEmpty(refType) && !isEmpty(refId)) {
					var iacRefInfo = addNodeFromParentNode(xmlDoc, pmtRecNode, "RefInfo");
					setAttributeValue(iacRefInfo, "RefType", refType);
					addTextNodeFromParentNode(xmlDoc, iacRefInfo, "RefID", refId);

					dAudit(
						"refType and refId found!",
						JSON.stringify({
							refType: refType,
							refId: refId,
						})
					);
				}


                                ///RSF - 09-22-2021                        
                                if (CHECKZIP=='T') {
                                        //Check if the bills have documents
                                        dLog('CHECKZIP_INTERNALIDS', CHECKZIP_INTERNALIDS);
                                        if (!isEmpty(CHECKZIP_INTERNALIDS)) {
                                                var internalids = CHECKZIP_INTERNALIDS.split(",");
                                                var cleaned = [];
                                                for (var i = 0; i < internalids.length; i++) {
                                                        cleaned.push(internalids[i].trim());
                                                }
                                                internalids = cleaned;
                                                dLog('internalids', internalids);
                                                var hasAttachments = false;
        
                                                for (var z=0; z<internalids.length; z++) {
                                                        if (billdata[internalids[z]]) {
                                                                hasAttachments = true;
                                                                dLog('Found an attachment', internalids[z]);
                                                        }
                                                }                                        
                                                
                                                if (hasAttachments) {
                                                        var wcRefInfo = addNodeFromParentNode(xmlDoc, pmtRecNode, 'RefInfo');			
                                                        setAttributeValue(wcRefInfo, 'RefType', "ZZ");
                                                        addTextNodeFromParentNode(xmlDoc, wcRefInfo, 'RefID', 'EOR');                                                
                                                        DEPLOY_CHECKZIP = true;
                                                }         
                                        }
                                };
                                dLog('locationCode', vendor.custentity_ica_location_code);
                                if (!isEmpty(vendor.custentity_ica_location_code)) {                                        
                                        var wcRefInfo = addNodeFromParentNode(xmlDoc, pmtRecNode, 'RefInfo');			
                                        setAttributeValue(wcRefInfo, 'RefType', "93");
                                        addTextNodeFromParentNode(xmlDoc, wcRefInfo, 'RefID', vendor.custentity_ica_location_code);
                                }

                                

				var msgNode = addNodeFromParentNode(xmlDoc, pmtRecNode, "Message");
				setAttributeValue(msgNode, "MsgType", vendorPaymentInfo[MSG_TYPE[pmtMethod]]);

				//RSF Check Memo Field – this is writing in the internal ID of the vendor;
				//I would like this changed to be either blank or the Bill Payment Memo Field.
				//(parameter that can be set under General Preferences.
				// var msgTypeTxt = bill.payeeid;

				var msgTypeTxt = "";
				if (DEFAULT_MSG_VENDOR_ID == "T") {
					try {
						msgTypeTxt = vendor.custentity_ica_vendor_external_id;
					} catch (e) {
						dErr("DEFAULT_MSG_VENDOR_ID custom field not found. Doing nothing", DEFAULT_MSG_VENDOR_ID);
					}
				} else {
					msgTypeTxt = bill.payeeid;
				}

				if (CHECK_MEMO == "T") {
					msgTypeTxt = billpayment.memo;
				}
				addTextNodeFromParentNode(xmlDoc, msgNode, "MsgText", msgTypeTxt);

				var chkNode = addNodeFromParentNode(xmlDoc, pmtRecNode, "Check");
				addTextNodeFromParentNode(xmlDoc, chkNode, "ChkNum", bill.refnum || bill.id); //RSF

				if (bill.payment == "check") {
					if (!isEmpty(accountData) && !isEmpty(accountData.getValue("custrecord_acct_map_check_template_id"))) {
						addTextNodeFromParentNode(xmlDoc, chkNode, "ChkDocNum", accountData.getValue("custrecord_acct_map_check_template_id"));
					}

					if (!isEmpty(vendor) && !isEmpty(vendor.couriername))
						addTextNodeFromParentNode(xmlDoc, chkNode, "CourierName", vendor.couriername); //ask Al where to get

					if (!isEmpty(vendor) && !isEmpty(vendor.courieraccount))
						addTextNodeFromParentNode(xmlDoc, chkNode, "CourierAccount", vendor.courieraccount); //ask Al where to get

					if (!isEmpty(vendor) && !isEmpty(vendor.deliverycode))
						addTextNodeFromParentNode(xmlDoc, chkNode, "DeliveryCode", vendor.deliverycode); //ask Al where to get
				} else {
					if (!isEmpty(vendor.custentity_check_style)) {
						addTextNodeFromParentNode(xmlDoc, chkNode, "ChkDocNum", vendor.custentity_check_style);
					} else if (!isEmpty(accountData) && !isEmpty(accountData.getValue("custrecord_acct_map_check_template_id"))) {
						addTextNodeFromParentNode(xmlDoc, chkNode, "ChkDocNum", accountData.getValue("custrecord_acct_map_check_template_id"));
					}

					if (!isEmpty(vendor) && !isEmpty(vendor.couriername))
						addTextNodeFromParentNode(xmlDoc, chkNode, "CourierName", vendor.couriername);

					if (!isEmpty(vendor) && !isEmpty(vendor.courieraccount))
						addTextNodeFromParentNode(xmlDoc, chkNode, "CourierAccount", vendor.courieraccount);

					if (!isEmpty(vendor) && !isEmpty(vendor.deliverycode))
						addTextNodeFromParentNode(xmlDoc, chkNode, "DeliveryCode", vendor.deliverycode);
				}

				var orgnPartyNode = addNodeFromParentNode(xmlDoc, pmtRecNode, "OrgnrParty");

				if (!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_companyname)) {
					var orgpNameNode = addNodeFromParentNode(xmlDoc, orgnPartyNode, "Name");
					addTextNodeFromParentNode(xmlDoc, orgpNameNode, "Name1", vendorPaymentInfo.custrecord_companyname);
				}

				if (
					(!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_compadd1)) ||
					(!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_compadd2)) ||
					(!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_compcity)) ||
					(!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_compstateprov)) ||
					(!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_comppostcode))
				) {
					var postAddrNode = addNodeFromParentNode(xmlDoc, orgnPartyNode, "PostAddr");

					if (!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_compadd1))
						addTextNodeFromParentNode(xmlDoc, postAddrNode, "Addr1", vendorPaymentInfo.custrecord_compadd1);
					if (!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_compadd2))
						addTextNodeFromParentNode(xmlDoc, postAddrNode, "Addr2", vendorPaymentInfo.custrecord_compadd2);
					if (!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_compcity))
						addTextNodeFromParentNode(xmlDoc, postAddrNode, "City", vendorPaymentInfo.custrecord_compcity);
					if (!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_compstateprov))
						addTextNodeFromParentNode(xmlDoc, postAddrNode, "StateProv", vendorPaymentInfo.custrecord_compstateprov);
					if (!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_comppostcode))
						addTextNodeFromParentNode(xmlDoc, postAddrNode, "PostalCode", vendorPaymentInfo.custrecord_comppostcode);

					var country = !isEmpty(vendorPaymentInfo) ? vendorPaymentInfo.custrecord_compcountrycode : "";
					if (!isEmpty(country)) addTextNodeFromParentNode(xmlDoc, postAddrNode, "Country", country);

					var countryName = !isEmpty(vendorPaymentInfo) ? vendorPaymentInfo.custrecord_compcountrynames : "";
					if (!isEmpty(countryName)) addTextNodeFromParentNode(xmlDoc, postAddrNode, "CountryName", countryName);
				}

				// START: OrgnrDepAcctID
				var orgnDepAcctIDNode = addNodeFromParentNode(xmlDoc, pmtRecNode, "OrgnrDepAcctID");
				var odepacctIdNode = addNodeFromParentNode(xmlDoc, orgnDepAcctIDNode, "DepAcctID");

				if (!isEmpty(accountData) && !isEmpty(accountData.getText("custrecord_acct_map_ext_bank_account_typ")))
					setAttributeValue(odepacctIdNode, "AcctType", accountData.getText("custrecord_acct_map_ext_bank_account_typ"));

				if (!isEmpty(accountData) && !isEmpty(accountData.getValue("custrecord_acct_map_ext_bank_origin_acc")))
					setAttributeValue(odepacctIdNode, "AcctID", accountData.getValue("custrecord_acct_map_ext_bank_origin_acc"));

				if (!isEmpty(accountData) && !isEmpty(accountData.getValue("custrecord_acct_map_account_currency")))
					setAttributeValue(odepacctIdNode, "AcctCur", arrCurrencyMap[accountData.getValue("custrecord_acct_map_account_currency")]);

				var bankInfoNode = addNodeFromParentNode(xmlDoc, odepacctIdNode, "BankInfo");
				if (!isEmpty(vendorPaymentInfo)) setAttributeValue(bankInfoNode, "Name", vendorPaymentInfo.custrecord_bankname);

				if (!isEmpty(accountData) && !isEmpty(accountData.getText("custrecord_acct_map_ext_bank_id_type")))
					setAttributeValue(bankInfoNode, "BankIDType", accountData.getText("custrecord_acct_map_ext_bank_id_type"));

				if (!isEmpty(accountData) && !isEmpty(accountData.getValue("custrecord_acct_map_ext_bank_ori_bank_id")))
					addTextNodeFromParentNode(xmlDoc, bankInfoNode, "BankID", accountData.getValue("custrecord_acct_map_ext_bank_ori_bank_id"));
				// END: OrgnrDepAcctID

				// START: RcvrParty
				var rcvrPartyNode = addNodeFromParentNode(xmlDoc, pmtRecNode, "RcvrParty");

				// if ((!isEmpty(vendor) && (!isEmpty(vendor.vendorname)))) {
				// }
				if (checkAddress != undefined) {
					var rcvrPartyNameNode = addNodeFromParentNode(xmlDoc, rcvrPartyNode, "Name");
					addTextNodeFromParentNode(xmlDoc, rcvrPartyNameNode, "Name1", checkAddress.entityname); //ask Al where to get for customer/employee
				} else {
					var rcvrPartyNameNode = addNodeFromParentNode(xmlDoc, rcvrPartyNode, "Name");
					addTextNodeFromParentNode(xmlDoc, rcvrPartyNameNode, "Name1", vendor.vendorname); //ask Al where to get for customer/employee
				}

				var ccrRefType =
					!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_ccr_reftype) ? vendorPaymentInfo.custrecord_ccr_reftype : "";
				// as per Al on 4th May 2016
				// On the VPM: Vendor Profile Tab: custentity_vendorreftype,
				// (XML: RefType = VN) please default this value to 'VN' in your
				// code, I don't want to use this field anymore.
				// var refType = (pmtMethod != 'CCR') ? objVendor.vreftype :
				// ccrRefType;
				var refType = ccrRefType ? ccrRefType : "VN";
				var refInfoNode = addNodeFromParentNode(xmlDoc, rcvrPartyNode, "RefInfo");

				if (refType) {
					setAttributeValue(refInfoNode, "RefType", refType);
				}

				// addTextNodeFromParentNode(xmlDoc, refInfoNode, 'RefID', bill.payeeid);
				var refIDTxt = "";
				if (DEFAULT_MSG_VENDOR_ID == "T") {
					try {
						refIDTxt = vendor.custentity_ica_vendor_external_id;
					} catch (e) {
						dErr("DEFAULT_MSG_VENDOR_ID custom field not found. Doing nothing", DEFAULT_MSG_VENDOR_ID);
					}
				} else {
					if (!isEmpty(bill.payeeid)) addTextNodeFromParentNode(xmlDoc, refInfoNode, "RefID", bill.payeeid);
				}
				if (!isEmpty(refIDTxt)) addTextNodeFromParentNode(xmlDoc, refInfoNode, "RefID", refIDTxt);

				if (bill.payment == "check") {
					var rPPostAddrNode = "";
					if (
						!isEmpty(checkAddress.address1) ||
						!isEmpty(checkAddress.address2) ||
						!isEmpty(checkAddress.city) ||
						!isEmpty(checkAddress.state) ||
						(!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_comppostcode)) ||
						!isEmpty(checkAddress.zipcode) ||
						!isEmpty(checkAddress.countrycode)
					) {
						rPPostAddrNode = addNodeFromParentNode(xmlDoc, rcvrPartyNode, "PostAddr");
					}
					if (!isEmpty(checkAddress.address1)) addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, "Addr1", checkAddress.address1);
					if (!isEmpty(checkAddress.address2)) addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, "Addr2", checkAddress.address2);
					if (!isEmpty(checkAddress.city)) addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, "City", checkAddress.city);
					if (!isEmpty(checkAddress.state)) addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, "StateProv", checkAddress.state);
					if (!isEmpty(checkAddress.zipcode)) addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, "PostalCode", checkAddress.zipcode);
					if (!isEmpty(checkAddress.countrycode)) {
						addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, "Country", checkAddress.country); //countryCodeMapping[checkAddress.countrycode]);
						addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, "CountryName", checkAddress.countrycode);
					}
				} else {
					if (
						!isEmpty(vendor.vendoraddrs1) ||
						!isEmpty(vendor.vendoraddrs2) ||
						!isEmpty(vendor.vendorcity) ||
						!isEmpty(vendor.vendorstateprovince) ||
						(!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_comppostcode)) ||
						!isEmpty(vendor.vendorpostal) ||
						!isEmpty(vendor.vendorcountrycode)
					) {
						rPPostAddrNode = addNodeFromParentNode(xmlDoc, rcvrPartyNode, "PostAddr");
					}

					if (!isEmpty(vendor.vendoraddrs1)) addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, "Addr1", vendor.vendoraddrs1);
					if (!isEmpty(vendor.vendoraddrs2)) addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, "Addr2", vendor.vendoraddrs2);
					if (!isEmpty(vendor.vendorcity)) addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, "City", vendor.vendorcity);
					if (!isEmpty(vendor.vendorstateprovince))
						addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, "StateProv", vendor.vendorstateprovince);
					if (!isEmpty(vendor.vendorpostal)) addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, "PostalCode", vendor.vendorpostal);
					if (!isEmpty(vendor.vendorcountrycode)) {
						addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, "Country", countryCodeMapping[vendor.vendorcountrycode]);
						addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, "CountryName", vendor.vendorcountrycode);
					}
				}

				// END: RcvrParty

				// START: PmtDetail
				// if (pmtMethod == 'IAC' || pmtMethod == 'MTS' || pmtMethod == 'IWI' || pmtMethod == 'ACH' || pmtMethod == 'DAC' || pmtMethod=='PLC' || pmtMethod=='CHK'  || pmtMethod == 'CCR') {
				if (bill.trantype == undefined) {
					var pmtDetailsNode = addNodeFromParentNode(xmlDoc, pmtRecNode, "PmtDetail");
					var pmtInvoiceInfoNode = addNodeFromParentNode(xmlDoc, pmtDetailsNode, "InvoiceInfo");

					if (!isEmpty(vendorPaymentInfo)) {
						setAttributeValue(pmtInvoiceInfoNode, "InvoiceType", vendorPaymentInfo.custrecord_invoicetype);
					} else {
						setAttributeValue(pmtInvoiceInfoNode, "InvoiceType", "");
					}

					var netAmt = 0;
					if (!isEmpty(arrBillCredits[bill.id])) {
						var arrBC = arrBillCredits[bill.id];

						for (bc in arrBC) {
							var pmtInvoiceInfoNodeCR = addNodeFromParentNode(xmlDoc, pmtDetailsNode, "InvoiceInfo");
							setAttributeValue(pmtInvoiceInfoNodeCR, "InvoiceType", "CM");
							setAttributeValue(pmtInvoiceInfoNodeCR, "InvoiceNum", arrBC[bc].bcnum);

							var billCreditAmtP = getFloatVal(arrBC[bc].bcamt);
							var billCreditAmt = billCreditAmtP * -1;

							// pmtTotalAmt = (pmtTotalAmt - billCreditAmtP);
							// pmtRecCurAmt = (pmtRecCurAmt - billCreditAmtP);

							// tmpAmt = (tmpAmt - billCreditAmtP);
							// netAmt = (netAmt - billCreditAmtP);

							setAttributeValue(pmtInvoiceInfoNodeCR, "EffDt", formatDate(nlapiStringToDate(arrBC[bc].bcdate)));
							setAttributeValue(pmtInvoiceInfoNodeCR, "NetCurAmt", billCreditAmt.toFixed(2));
							setAttributeValue(pmtInvoiceInfoNodeCR, "TotalCurAmt", billCreditAmt.toFixed(2));

							// pmtRecCurAmt += billCreditAmt;
							// pmtTotalAmt += billCreditAmt;

							if (!isEmpty(arrBC[bc].bcmemo)) {
								var pmtdNoteNodeCRBC = addNodeFromParentNode(xmlDoc, pmtInvoiceInfoNodeCR, "Note");
								setAttributeValue(pmtdNoteNodeCRBC, "NoteType", "INV");
								addTextNodeFromParentNode(
									xmlDoc,
									pmtdNoteNodeCRBC,
									"NoteText",
									isEmpty(arrBC[bc].bcmemo) ? "" : setValue(arrBC[bc].bcmemo)
								);
							}
						}

						//Added
						var netCurAmt = Number(bill.payamt).toFixed(2);
						if (isNaN(netCurAmt)) {
							netCurAmt = Number(bill.amtdue).toFixed(2);
						}

						setAttributeValue(pmtInvoiceInfoNode, "InvoiceNum", bill.billnum);
						setAttributeValue(pmtInvoiceInfoNode, "TotalCurAmt", Number(bill.origamt).toFixed(2));
						setAttributeValue(pmtInvoiceInfoNode, "NetCurAmt", netCurAmt);
					} else {
						var netCurAmt = Number(bill.payamt).toFixed(2);
						if (isNaN(netCurAmt)) {
							netCurAmt = Number(bill.amtdue).toFixed(2);
						}

						dLog("bill details", JSON.stringify(bill));
						setAttributeValue(pmtInvoiceInfoNode, "InvoiceNum", bill.billnum);
						setAttributeValue(pmtInvoiceInfoNode, "TotalCurAmt", Number(bill.origamt).toFixed(2));
						setAttributeValue(pmtInvoiceInfoNode, "NetCurAmt", netCurAmt);
						setAttributeValue(pmtInvoiceInfoNodeCR, "InvoiceNum", bill.billnum);
						setAttributeValue(pmtInvoiceInfoNodeCR, "TotalCurAmt", Number(bill.origamt).toFixed(2));
						setAttributeValue(pmtInvoiceInfoNodeCR, "NetCurAmt", netCurAmt);
					}

					//Add Bill Memo
					if (!isEmpty(billdata.memo)) {
						var pmtdNoteNodeCR = addNodeFromParentNode(xmlDoc, pmtInvoiceInfoNode, "Note");
						setAttributeValue(pmtdNoteNodeCR, "NoteType", "INV");
						addTextNodeFromParentNode(xmlDoc, pmtdNoteNodeCR, "NoteText", billdata.memo);
					}

					setAttributeValue(pmtInvoiceInfoNode, "DiscountCurAmt", Number(bill.discamt || 0).toFixed(2));

					//Added

					// var invoiceDate = objBillsData[billId].dte;
					// if ((pmtMethod == 'CHK' || pmtMethod == 'CCR' || pmtMethod == 'DAC') && !isEmpty(invoiceDate))
					setAttributeValue(pmtInvoiceInfoNode, "EffDt", formatDate(nlapiStringToDate(billdata.trandate)));

					// Add PO Num -- CLEAN
					if (!isEmpty(arrBillPO[bill.id])) {
						var poInfoNode = addNodeFromParentNode(xmlDoc, pmtInvoiceInfoNode, "POInfo");
						setAttributeValue(poInfoNode, "POType", "PO");
						addTextNodeFromParentNode(xmlDoc, poInfoNode, "PONum", arrBillPO[bill.id]);
					}
					// END: PmtDetail
				}

				// START: RcvrDepAcctID
				// END: RcvrDepAcctID

				// START : IntermediaryDepAccID
				// END : IntermediaryDepAccID

				//START: PmtDetail
				//END: PmtDetail

				var netCurAmt = 0;
				if (bill.payamt == null) {
					netCurAmt = Number(bill.amtdue).toFixed(2);
				} else {
					netCurAmt = Number(bill.payamt).toFixed(2);
					if (isNaN(netCurAmt)) {
						netCurAmt = Number(bill.amtdue).toFixed(2);
					}
				}
				addTextNodeFromParentNode(xmlDoc, pmtRecNode, "CurAmt", netCurAmt); //confirm with Al.
			},
			DAC: function () {
				setAttributeValue(pmtRecNode, "PmtCrDr", "C");
				setAttributeValue(pmtRecNode, "PmtMethod", pmtMethod);

				if (WF_NO_ACCOUNT_INFORMATION_IN_XML == "T") {
					addTextNodeFromParentNode(xmlDoc, pmtRecNode, "PDPHandlingCode", "T");
				}

				if (!isEmpty(vendor.custentity_paymentformat)) {
					setAttributeValue(pmtRecNode, "PmtFormat", vendor.custentity_paymentformat);
				}

				if (!isEmpty(vendor.custentity_interpayformat)) setAttributeValue(pmtRecNode, "PmtFormatIntl", vendor.custentity_interpayformat);

				if (!isEmpty(vendor.custentity_pmp_biller_id)) {
					setAttributeValue(pmtRecNode, "TranHandlingCode", "U");
				} else if (!isEmpty(accountData) && !isEmpty(accountData.getValue("custrecord_acct_map_pmp_biller_id"))) {
					setAttributeValue(pmtRecNode, "TranHandlingCode", "U");
				}

				addTextNodeFromParentNode(xmlDoc, pmtRecNode, "PmtID", bill.refnum);

				if (!isEmpty(bill.currid)) {
					var curCode = arrCurrencyMap[bill.currid];
					addTextNodeFromParentNode(xmlDoc, pmtRecNode, "CurCode", curCode);
				}

				addTextNodeFromParentNode(xmlDoc, pmtRecNode, "ValueDate", formatDate(nlapiStringToDate(BPM_DATE)));

				var msgNode = addNodeFromParentNode(xmlDoc, pmtRecNode, "Message");
				setAttributeValue(msgNode, "MsgType", vendorPaymentInfo[MSG_TYPE[pmtMethod]]);

				if (CHECK_MEMO == "T") {
					var msgTypeTxt = billpayment.memo; //
					// var msgTypeTxt = b2pMemo;
					addTextNodeFromParentNode(xmlDoc, msgNode, "MsgText", msgTypeTxt);
				} else {
					dAudit("DEFAULT_MSG_VENDOR_ID", DEFAULT_MSG_VENDOR_ID);
					var msgTypeTxt = "";
					if (DEFAULT_MSG_VENDOR_ID == "T") {
						try {
							msgTypeTxt = vendor.custentity_ica_vendor_external_id;
						} catch (e) {
							dErr("DEFAULT_MSG_VENDOR_ID custom field not found. Doing nothing", DEFAULT_MSG_VENDOR_ID);
						}
						addTextNodeFromParentNode(xmlDoc, msgNode, "MsgText", msgTypeTxt);
					} else {
						msgTypeTxt = bill.payeeid;
						addTextNodeFromParentNode(xmlDoc, msgNode, "MsgText", msgTypeTxt);
					}
				}

				//Clean
				var msgTxt = "";
				var bMemo = vendor.custentity_ica_vendor_bank_instructions; //arrPayeeInterBillsMemo[bill.payeeid];

				if (!isEmpty(bMemo)) msgTxt += isEmpty(msgTxt) ? bMemo : " " + bMemo;

				dLog("creatXMLDoc", "Msg text = " + msgTxt);

				if (!isEmpty(msgTxt)) {
					var msgNode = addNodeFromParentNode(xmlDoc, pmtRecNode, "Message");
					setAttributeValue(msgNode, "MsgType", VENDOR_ORIG_MSG_TYPE);
					addTextNodeFromParentNode(xmlDoc, msgNode, "MsgText", msgTxt);
				}

				// START: Origin Party
				var orgnPartyNode = addNodeFromParentNode(xmlDoc, pmtRecNode, "OrgnrParty");

				if (!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_companyname)) {
					var orgpNameNode = addNodeFromParentNode(xmlDoc, orgnPartyNode, "Name");
					addTextNodeFromParentNode(xmlDoc, orgpNameNode, "Name1", vendorPaymentInfo.custrecord_companyname);
				}
				if (
					(!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_compadd1)) ||
					(!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_compadd2)) ||
					(!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_compcity)) ||
					(!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_compstateprov)) ||
					(!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_comppostcode))
				) {
					var postAddrNode = addNodeFromParentNode(xmlDoc, orgnPartyNode, "PostAddr");

					if (!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_compadd1))
						addTextNodeFromParentNode(xmlDoc, postAddrNode, "Addr1", vendorPaymentInfo.custrecord_compadd1);
					if (!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_compadd2))
						addTextNodeFromParentNode(xmlDoc, postAddrNode, "Addr2", vendorPaymentInfo.custrecord_compadd2);
					if (!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_compcity))
						addTextNodeFromParentNode(xmlDoc, postAddrNode, "City", vendorPaymentInfo.custrecord_compcity);
					if (!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_compstateprov))
						addTextNodeFromParentNode(xmlDoc, postAddrNode, "StateProv", vendorPaymentInfo.custrecord_compstateprov);
					if (!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_comppostcode))
						addTextNodeFromParentNode(xmlDoc, postAddrNode, "PostalCode", vendorPaymentInfo.custrecord_comppostcode);

					var country = !isEmpty(vendorPaymentInfo) ? vendorPaymentInfo.custrecord_compcountrycode : "";
					if (!isEmpty(country)) addTextNodeFromParentNode(xmlDoc, postAddrNode, "Country", country);

					var countryName = !isEmpty(vendorPaymentInfo) ? vendorPaymentInfo.custrecord_compcountrynames : "";
					if (!isEmpty(countryName)) addTextNodeFromParentNode(xmlDoc, postAddrNode, "CountryName", countryName);
				}
				// END: Origin Party

				// START: OrgnrDepAcctID
				var orgnDepAcctIDNode = addNodeFromParentNode(xmlDoc, pmtRecNode, "OrgnrDepAcctID");
				var odepacctIdNode = addNodeFromParentNode(xmlDoc, orgnDepAcctIDNode, "DepAcctID");

				if (!isEmpty(accountData) && !isEmpty(accountData.getText("custrecord_acct_map_ext_bank_account_typ")))
					setAttributeValue(odepacctIdNode, "AcctType", accountData.getText("custrecord_acct_map_ext_bank_account_typ"));

				if (!isEmpty(accountData) && !isEmpty(accountData.getValue("custrecord_acct_map_ext_bank_origin_acc")))
					setAttributeValue(odepacctIdNode, "AcctID", accountData.getValue("custrecord_acct_map_ext_bank_origin_acc"));

				if (!isEmpty(accountData) && !isEmpty(accountData.getValue("custrecord_acct_map_account_currency")))
					setAttributeValue(odepacctIdNode, "AcctCur", arrCurrencyMap[accountData.getValue("custrecord_acct_map_account_currency")]);

				var bankInfoNode = addNodeFromParentNode(xmlDoc, odepacctIdNode, "BankInfo");
				if (!isEmpty(vendorPaymentInfo)) setAttributeValue(bankInfoNode, "Name", vendorPaymentInfo.custrecord_bankname);

				if (!isEmpty(accountData) && !isEmpty(accountData.getText("custrecord_acct_map_ext_bank_id_type")))
					setAttributeValue(bankInfoNode, "BankIDType", accountData.getText("custrecord_acct_map_ext_bank_id_type"));

				if (!isEmpty(accountData) && !isEmpty(accountData.getValue("custrecord_acct_map_ext_bank_ori_bank_id")))
					addTextNodeFromParentNode(xmlDoc, bankInfoNode, "BankID", accountData.getValue("custrecord_acct_map_ext_bank_ori_bank_id"));

				var orgrefInfoNode = addNodeFromParentNode(xmlDoc, bankInfoNode, "RefInfo");

				if (!isEmpty(vendorPaymentInfo)) setAttributeValue(orgrefInfoNode, "RefType", vendorPaymentInfo[MSG_TYPE[pmtMethod]]);

				if (!isEmpty(accountData) && !isEmpty(accountData.getValue("custrecord_acct_map_dom_ach_co_id"))) {
					addTextNodeFromParentNode(xmlDoc, orgrefInfoNode, "RefID", accountData.getValue("custrecord_acct_map_dom_ach_co_id"));
				}

				// END: OrgnrDepAcctID

				// START: RcvrParty
				var rcvrPartyNode = addNodeFromParentNode(xmlDoc, pmtRecNode, "RcvrParty");

				if (!isEmpty(vendor.vendorname)) {
					var rcvrPartyNameNode = addNodeFromParentNode(xmlDoc, rcvrPartyNode, "Name");
					addTextNodeFromParentNode(xmlDoc, rcvrPartyNameNode, "Name1", vendor.vendorname);
				}

				var ccrRefType =
					!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_ccr_reftype) ? vendorPaymentInfo.custrecord_ccr_reftype : "";
				var refType = ccrRefType ? ccrRefType : "VN";
				var refInfoNode = addNodeFromParentNode(xmlDoc, rcvrPartyNode, "RefInfo");
				setAttributeValue(refInfoNode, "RefType", refType);

				// addTextNodeFromParentNode(xmlDoc, refInfoNode, 'RefID', bill.payeeid);
				var refIDTxt = "";
				if (DEFAULT_MSG_VENDOR_ID == "T") {
					try {
						refIDTxt = vendor.custentity_ica_vendor_external_id;
					} catch (e) {
						dErr("DEFAULT_MSG_VENDOR_ID custom field not found. Doing nothing", DEFAULT_MSG_VENDOR_ID);
					}
				} else {
					if (!isEmpty(bill.payeeid)) addTextNodeFromParentNode(xmlDoc, refInfoNode, "RefID", bill.payeeid);
				}
				if (!isEmpty(refIDTxt)) addTextNodeFromParentNode(xmlDoc, refInfoNode, "RefID", refIDTxt);

				var rPPostAddrNode = "";
				if (
					!isEmpty(vendor.vendoraddrs1) ||
					!isEmpty(vendor.vendoraddrs2) ||
					!isEmpty(vendor.vendorcity) ||
					!isEmpty(vendor.vendorstateprovince) ||
					(!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_comppostcode)) ||
					!isEmpty(vendor.vendorpostal) ||
					!isEmpty(vendor.vendorcountrycode)
				) {
					rPPostAddrNode = addNodeFromParentNode(xmlDoc, rcvrPartyNode, "PostAddr");
				}

				if (!isEmpty(vendor.vendoraddrs1)) addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, "Addr1", vendor.vendoraddrs1);
				if (!isEmpty(vendor.vendoraddrs2)) addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, "Addr2", vendor.vendoraddrs2);
				if (!isEmpty(vendor.vendorcity)) addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, "City", vendor.vendorcity);
				if (!isEmpty(vendor.vendorstateprovince)) addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, "StateProv", vendor.vendorstateprovince);
				if (!isEmpty(vendor.vendorpostal)) addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, "PostalCode", vendor.vendorpostal);
				if (!isEmpty(vendor.vendorcountrycode)) {
					addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, "Country", countryCodeMapping[vendor.vendorcountrycode]);
					addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, "CountryName", vendor.vendorcountrycode);
				}
				// END: RcvrParty

				// START: RcvrDepAcctID
				var rcvrDeptAcctID = addNodeFromParentNode(xmlDoc, pmtRecNode, "RcvrDepAcctID");
				var rdeptAcctIdNode = addNodeFromParentNode(xmlDoc, rcvrDeptAcctID, "DepAcctID");
				if (!isEmpty(vendor.recpartyaccount)) setAttributeValue(rdeptAcctIdNode, "AcctID", vendor.recpartyaccount);

				setAttributeValue(rdeptAcctIdNode, "AcctType", "D");

				if (!isEmpty(bill.currid)) {
					var curCode = arrCurrencyMap[bill.currid];
					setAttributeValue(rdeptAcctIdNode, "AcctCur", arrCurrencyMap[bill.currid]);
				}

				var rbankInfoNode = addNodeFromParentNode(xmlDoc, rdeptAcctIdNode, "BankInfo");
				if (!isEmpty(vendor.vbankname)) setAttributeValue(rbankInfoNode, "Name", vendor.vbankname);
				if (!isEmpty(vendor.recbankprimidtype)) setAttributeValue(rbankInfoNode, "BankIDType", vendor.recbankprimidtype);

				var rpostAddrNode = "";
				if (
					!isEmpty(vendor.vbankaddrs1) ||
					!isEmpty(vendor.vbankstate) ||
					!isEmpty(vendor.vbankcity) ||
					!isEmpty(vendor.vbankzip) ||
					!isEmpty(vendor.vbankcountry)
				) {
					rpostAddrNode = addNodeFromParentNode(xmlDoc, rbankInfoNode, "PostAddr");
				}

				if (!isEmpty(vendor.vbankaddrs1)) addTextNodeFromParentNode(xmlDoc, rpostAddrNode, "Addr1", vendor.vbankaddrs1);
				if (!isEmpty(vendor.vbankstate)) addTextNodeFromParentNode(xmlDoc, rpostAddrNode, "StateProv", vendor.vbankstate);

				if (!isEmpty(vendor.vbankcity)) addTextNodeFromParentNode(xmlDoc, rpostAddrNode, "City", vendor.vbankcity);

				if (!isEmpty(vendor.vbankzip)) addTextNodeFromParentNode(xmlDoc, rpostAddrNode, "PostalCode", vendor.vbankzip);

				if (!isEmpty(vendor.vbankcountry)) addTextNodeFromParentNode(xmlDoc, rpostAddrNode, "Country", countryCodeMapping[vendor.vbankcountry]);

				if (!isEmpty(vendor.recbankprimid)) addTextNodeFromParentNode(xmlDoc, rbankInfoNode, "BankID", vendor.recbankprimid);
				// END: RcvrDepAcctID

				// START: PmtDetail
				var pmtDetailsNode = addNodeFromParentNode(xmlDoc, pmtRecNode, "PmtDetail");
				var pmtInvoiceInfoNode = addNodeFromParentNode(xmlDoc, pmtDetailsNode, "InvoiceInfo");

				if (!isEmpty(vendorPaymentInfo)) {
					setAttributeValue(pmtInvoiceInfoNode, "InvoiceType", vendorPaymentInfo.custrecord_invoicetype);
				} else {
					setAttributeValue(pmtInvoiceInfoNode, "InvoiceType", "");
				}

				setAttributeValue(pmtInvoiceInfoNode, "InvoiceNum", bill.billnum);
				setAttributeValue(pmtInvoiceInfoNode, "TotalCurAmt", Number(bill.origamt).toFixed(2));
				setAttributeValue(pmtInvoiceInfoNode, "NetCurAmt", Number(bill.payamt).toFixed(2));

				if (!isEmpty(billdata.memo)) {
					var pmtdNoteNodeCR = addNodeFromParentNode(xmlDoc, pmtInvoiceInfoNode, "Note");
					setAttributeValue(pmtdNoteNodeCR, "NoteType", "INV");
					addTextNodeFromParentNode(xmlDoc, pmtdNoteNodeCR, "NoteText", billdata.memo);
				}

				setAttributeValue(pmtInvoiceInfoNode, "DiscountCurAmt", Number(bill.discamt || 0).toFixed(2));

				// if ((pmtMethod == 'CHK' || pmtMethod == 'CCR' || pmtMethod == 'DAC') && !isEmpty(invoiceDate))
				setAttributeValue(pmtInvoiceInfoNode, "EffDt", formatDate(nlapiStringToDate(billdata.trandate)));

				// Add PO Num -- CLEAN
				if (!isEmpty(arrBillPO[bill.id])) {
					var poInfoNode = addNodeFromParentNode(xmlDoc, pmtInvoiceInfoNode, "POInfo");
					setAttributeValue(poInfoNode, "POType", "PO");
					addTextNodeFromParentNode(xmlDoc, poInfoNode, "PONum", arrBillPO[bill.id]);
				}

				//check if there are bill credit/s associated to bill. append if so.
				if (!isEmpty(billcredits)) {
					for (bc in billcredits) {
						var pmtInvoiceInfoNodeCR = addNodeFromParentNode(xmlDoc, pmtDetailsNode, "InvoiceInfo");
						setAttributeValue(pmtInvoiceInfoNodeCR, "InvoiceType", "CM");
						setAttributeValue(pmtInvoiceInfoNodeCR, "InvoiceNum", billcredits[bc].bcnum);

						var billCreditAmtP = getFloatVal(billcredits[bc].bcamt);
						var billCreditAmt = billCreditAmtP * -1;

						setAttributeValue(pmtInvoiceInfoNodeCR, "EffDt", formatDate(nlapiStringToDate(billcredits[bc].bcdate)));
						setAttributeValue(pmtInvoiceInfoNodeCR, "NetCurAmt", billCreditAmt.toFixed(2));
						setAttributeValue(pmtInvoiceInfoNodeCR, "TotalCurAmt", billCreditAmt.toFixed(2));

						if (!isEmpty(billcredits[bc].bcmemo)) {
							var pmtdNoteNodeCRBC = addNodeFromParentNode(xmlDoc, pmtInvoiceInfoNodeCR, "Note");
							setAttributeValue(pmtdNoteNodeCRBC, "NoteType", "INV");
							addTextNodeFromParentNode(
								xmlDoc,
								pmtdNoteNodeCRBC,
								"NoteText",
								isEmpty(billcredits[bc].bcmemo) ? "" : setValue(billcredits[bc].bcmemo)
							);
						}
					}
				}

				// END: PmtDetail

				// START: DocDelivery
				var docDeliveryNode = addNodeFromParentNode(xmlDoc, pmtRecNode, "DocDelivery");

				if (!isEmpty(vendor.custentity_pmp_biller_id)) {
					addTextNodeFromParentNode(xmlDoc, docDeliveryNode, "EDDBillerID", vendor.custentity_pmp_biller_id);
				} else if (!isEmpty(accountData) && !isEmpty(accountData.getValue("custrecord_acct_map_pmp_biller_id"))) {
					addTextNodeFromParentNode(xmlDoc, docDeliveryNode, "EDDBillerID", accountData.getValue("custrecord_acct_map_pmp_biller_id"));
				}

				var fileOutNode = addNodeFromParentNode(xmlDoc, docDeliveryNode, "FileOut");

				if (!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_dac_pmp_file_type))
					addTextNodeFromParentNode(xmlDoc, fileOutNode, "FileType", vendorPaymentInfo.custrecord_dac_pmp_file_type);

				if (!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_dac_pmp_file_format))
					addTextNodeFromParentNode(xmlDoc, fileOutNode, "FileFormat", vendorPaymentInfo.custrecord_dac_pmp_file_format);

				var deliveryNode = addNodeFromParentNode(xmlDoc, fileOutNode, "Delivery");

				if (!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_dac_pmp_delivery_type))
					addTextNodeFromParentNode(xmlDoc, deliveryNode, "DeliveryType", vendorPaymentInfo.custrecord_dac_pmp_delivery_type);

				if (!isEmpty(vendor.pmp_dac_contactname))
					addTextNodeFromParentNode(xmlDoc, deliveryNode, "DeliveryContactName", vendor.pmp_dac_contactname);

				if (!isEmpty(vendor.pmp_dac_emailaddress))
					addTextNodeFromParentNode(xmlDoc, deliveryNode, "DeliveryEmailAddress", vendor.pmp_dac_emailaddress);

				// END: DocDelivery

				addTextNodeFromParentNode(xmlDoc, pmtRecNode, "CurAmt", Number(bill.payamt).toFixed(2)); //confirm with Al.
			},
			MTS: function () {
				setAttributeValue(pmtRecNode, "PmtCrDr", "C");
				setAttributeValue(pmtRecNode, "PmtMethod", pmtMethod);

				if (!isEmpty(vendor.custentity_interpayformat)) setAttributeValue(pmtRecNode, "PmtFormatIntl", vendor.custentity_interpayformat);

				if (!isEmpty(vendor.custentity_pmp_biller_id)) {
					setAttributeValue(pmtRecNode, "TranHandlingCode", "U");
				} else if (!isEmpty(accountData) && !isEmpty(accountData.getValue("custrecord_acct_map_pmp_biller_id"))) {
					setAttributeValue(pmtRecNode, "TranHandlingCode", "U");
				}

				addTextNodeFromParentNode(xmlDoc, pmtRecNode, "PmtID", bill.refnum);

				if (!isEmpty(bill.currid)) {
					var curCode = arrCurrencyMap[bill.currid];
					addTextNodeFromParentNode(xmlDoc, pmtRecNode, "CurCode", curCode);
				}

				addTextNodeFromParentNode(xmlDoc, pmtRecNode, "ValueDate", formatDate(nlapiStringToDate(BPM_DATE)));

				//WIRE_FEES
				var wireFees = WIRE_FEES == 1 ? "BEN" : "OUR";
				var wcRefInfo = addNodeFromParentNode(xmlDoc, pmtRecNode, "RefInfo");
				setAttributeValue(wcRefInfo, "RefType", "WC");
				addTextNodeFromParentNode(xmlDoc, wcRefInfo, "RefID", wireFees);

				var msgNode = addNodeFromParentNode(xmlDoc, pmtRecNode, "Message");
				setAttributeValue(msgNode, "MsgType", vendorPaymentInfo[MSG_TYPE[pmtMethod]]);

				if (CHECK_MEMO == "T") {
					var msgTypeTxt = billpayment.memo; //
					// var msgTypeTxt = b2pMemo;
					addTextNodeFromParentNode(xmlDoc, msgNode, "MsgText", msgTypeTxt);
				} else {
					dAudit("DEFAULT_MSG_VENDOR_ID", DEFAULT_MSG_VENDOR_ID);
					var msgTypeTxt = "";
					if (DEFAULT_MSG_VENDOR_ID == "T") {
						try {
							msgTypeTxt = vendor.custentity_ica_vendor_external_id;
						} catch (e) {
							dErr("DEFAULT_MSG_VENDOR_ID custom field not found. Doing nothing", DEFAULT_MSG_VENDOR_ID);
						}
						addTextNodeFromParentNode(xmlDoc, msgNode, "MsgText", msgTypeTxt);
					} else {
						msgTypeTxt = bill.payeeid;
						addTextNodeFromParentNode(xmlDoc, msgNode, "MsgText", msgTypeTxt);
					}
				}

				//Clean
				var msgTxt = "";
				var bMemo = vendor.custentity_ica_vendor_bank_instructions; //arrPayeeInterBillsMemo[bill.payeeid];

				if (!isEmpty(bMemo)) msgTxt += isEmpty(msgTxt) ? bMemo : " " + bMemo;

				dLog("creatXMLDoc", "Msg text = " + msgTxt);

				if (!isEmpty(msgTxt)) {
					var msgNode = addNodeFromParentNode(xmlDoc, pmtRecNode, "Message");
					setAttributeValue(msgNode, "MsgType", VENDOR_ORIG_MSG_TYPE);
					addTextNodeFromParentNode(xmlDoc, msgNode, "MsgText", msgTxt);
				}

				// START: Origin Party
				var orgnPartyNode = addNodeFromParentNode(xmlDoc, pmtRecNode, "OrgnrParty");

				if (!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_companyname)) {
					var orgpNameNode = addNodeFromParentNode(xmlDoc, orgnPartyNode, "Name");
					addTextNodeFromParentNode(xmlDoc, orgpNameNode, "Name1", vendorPaymentInfo.custrecord_companyname);
				}
				if (
					(!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_compadd1)) ||
					(!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_compadd2)) ||
					(!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_compcity)) ||
					(!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_compstateprov)) ||
					(!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_comppostcode))
				) {
					var postAddrNode = addNodeFromParentNode(xmlDoc, orgnPartyNode, "PostAddr");

					if (!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_compadd1))
						addTextNodeFromParentNode(xmlDoc, postAddrNode, "Addr1", vendorPaymentInfo.custrecord_compadd1);
					if (!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_compadd2))
						addTextNodeFromParentNode(xmlDoc, postAddrNode, "Addr2", vendorPaymentInfo.custrecord_compadd2);
					if (!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_compcity))
						addTextNodeFromParentNode(xmlDoc, postAddrNode, "City", vendorPaymentInfo.custrecord_compcity);
					if (!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_compstateprov))
						addTextNodeFromParentNode(xmlDoc, postAddrNode, "StateProv", vendorPaymentInfo.custrecord_compstateprov);
					if (!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_comppostcode))
						addTextNodeFromParentNode(xmlDoc, postAddrNode, "PostalCode", vendorPaymentInfo.custrecord_comppostcode);

					var country = !isEmpty(vendorPaymentInfo) ? vendorPaymentInfo.custrecord_compcountrycode : "";
					if (!isEmpty(country)) addTextNodeFromParentNode(xmlDoc, postAddrNode, "Country", country);

					var countryName = !isEmpty(vendorPaymentInfo) ? vendorPaymentInfo.custrecord_compcountrynames : "";
					if (!isEmpty(countryName)) addTextNodeFromParentNode(xmlDoc, postAddrNode, "CountryName", countryName);
				}
				// END: Origin Party

				// START: OrgnrDepAcctID
				var orgnDepAcctIDNode = addNodeFromParentNode(xmlDoc, pmtRecNode, "OrgnrDepAcctID");
				var odepacctIdNode = addNodeFromParentNode(xmlDoc, orgnDepAcctIDNode, "DepAcctID");

				if (!isEmpty(accountData) && !isEmpty(accountData.getText("custrecord_acct_map_ext_bank_account_typ")))
					setAttributeValue(odepacctIdNode, "AcctType", accountData.getText("custrecord_acct_map_ext_bank_account_typ"));

				if (!isEmpty(accountData) && !isEmpty(accountData.getValue("custrecord_acct_map_ext_bank_origin_acc")))
					setAttributeValue(odepacctIdNode, "AcctID", accountData.getValue("custrecord_acct_map_ext_bank_origin_acc"));

				if (!isEmpty(accountData) && !isEmpty(accountData.getValue("custrecord_acct_map_account_currency")))
					setAttributeValue(odepacctIdNode, "AcctCur", arrCurrencyMap[accountData.getValue("custrecord_acct_map_account_currency")]);

				var bankInfoNode = addNodeFromParentNode(xmlDoc, odepacctIdNode, "BankInfo");
				if (!isEmpty(vendorPaymentInfo)) setAttributeValue(bankInfoNode, "Name", vendorPaymentInfo.custrecord_bankname);

				if (!isEmpty(accountData) && !isEmpty(accountData.getText("custrecord_acct_map_ext_bank_id_type")))
					setAttributeValue(bankInfoNode, "BankIDType", accountData.getText("custrecord_acct_map_ext_bank_id_type"));

				if (!isEmpty(accountData) && !isEmpty(accountData.getValue("custrecord_acct_map_ext_bank_ori_bank_id")))
					addTextNodeFromParentNode(xmlDoc, bankInfoNode, "BankID", accountData.getValue("custrecord_acct_map_ext_bank_ori_bank_id"));

				var orgrefInfoNode = addNodeFromParentNode(xmlDoc, bankInfoNode, "RefInfo");

				if (!isEmpty(vendorPaymentInfo)) setAttributeValue(orgrefInfoNode, "RefType", vendorPaymentInfo[MSG_TYPE[pmtMethod]]);

				if (!isEmpty(accountData) && !isEmpty(accountData.getValue("custrecord_acct_map_dom_ach_co_id"))) {
					addTextNodeFromParentNode(xmlDoc, orgrefInfoNode, "RefID", accountData.getValue("custrecord_acct_map_dom_ach_co_id"));
				}

				// END: OrgnrDepAcctID

				// START: RcvrParty
				var rcvrPartyNode = addNodeFromParentNode(xmlDoc, pmtRecNode, "RcvrParty");

				if (!isEmpty(vendor.vendorname)) {
					var rcvrPartyNameNode = addNodeFromParentNode(xmlDoc, rcvrPartyNode, "Name");
					addTextNodeFromParentNode(xmlDoc, rcvrPartyNameNode, "Name1", vendor.vendorname);
				}

				var ccrRefType =
					!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_ccr_reftype) ? vendorPaymentInfo.custrecord_ccr_reftype : "";
				var refType = ccrRefType ? ccrRefType : "VN";
				var refInfoNode = addNodeFromParentNode(xmlDoc, rcvrPartyNode, "RefInfo");
				setAttributeValue(refInfoNode, "RefType", refType);

				// addTextNodeFromParentNode(xmlDoc, refInfoNode, 'RefID', bill.payeeid);
				var refIDTxt = "";
				if (DEFAULT_MSG_VENDOR_ID == "T") {
					try {
						refIDTxt = vendor.custentity_ica_vendor_external_id;
					} catch (e) {
						dErr("DEFAULT_MSG_VENDOR_ID custom field not found. Doing nothing", DEFAULT_MSG_VENDOR_ID);
					}
				} else {
					if (!isEmpty(bill.payeeid)) addTextNodeFromParentNode(xmlDoc, refInfoNode, "RefID", bill.payeeid);
				}
				if (!isEmpty(refIDTxt)) addTextNodeFromParentNode(xmlDoc, refInfoNode, "RefID", refIDTxt);

				var rPPostAddrNode = "";
				if (
					!isEmpty(vendor.vendoraddrs1) ||
					!isEmpty(vendor.vendoraddrs2) ||
					!isEmpty(vendor.vendorcity) ||
					!isEmpty(vendor.vendorstateprovince) ||
					(!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_comppostcode)) ||
					!isEmpty(vendor.vendorpostal) ||
					!isEmpty(vendor.vendorcountrycode)
				) {
					rPPostAddrNode = addNodeFromParentNode(xmlDoc, rcvrPartyNode, "PostAddr");
				}

				if (!isEmpty(vendor.vendoraddrs1)) addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, "Addr1", vendor.vendoraddrs1);
				if (!isEmpty(vendor.vendoraddrs2)) addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, "Addr2", vendor.vendoraddrs2);
				if (!isEmpty(vendor.vendorcity)) addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, "City", vendor.vendorcity);
				if (!isEmpty(vendor.vendorstateprovince)) addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, "StateProv", vendor.vendorstateprovince);
				if (!isEmpty(vendor.vendorpostal)) addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, "PostalCode", vendor.vendorpostal);
				if (!isEmpty(vendor.vendorcountrycode)) {
					addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, "Country", countryCodeMapping[vendor.vendorcountrycode]);
					addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, "CountryName", vendor.vendorcountrycode);
				}
				// END: RcvrParty

				// START: RcvrDepAcctID
				var rcvrDeptAcctID = addNodeFromParentNode(xmlDoc, pmtRecNode, "RcvrDepAcctID");
				var rdeptAcctIdNode = addNodeFromParentNode(xmlDoc, rcvrDeptAcctID, "DepAcctID");
				if (!isEmpty(vendor.recpartyaccount)) setAttributeValue(rdeptAcctIdNode, "AcctID", vendor.recpartyaccount);

				setAttributeValue(rdeptAcctIdNode, "AcctType", "D");

				if (!isEmpty(bill.currid)) {
					var curCode = arrCurrencyMap[bill.currid];
					setAttributeValue(rdeptAcctIdNode, "AcctCur", arrCurrencyMap[bill.currid]);
				}

				var rbankInfoNode = addNodeFromParentNode(xmlDoc, rdeptAcctIdNode, "BankInfo");
				if (!isEmpty(vendor.vbankname)) setAttributeValue(rbankInfoNode, "Name", vendor.vbankname);
				if (!isEmpty(vendor.recbankprimidtype)) setAttributeValue(rbankInfoNode, "BankIDType", vendor.recbankprimidtype);

				if (!isEmpty(vendor.bankid)) {
					//(pmtMethod == 'IAC' || pmtMethod == 'IWI' || pmtMethod == 'MTS') &&
					setAttributeValue(rbankInfoNode, "BranchID", vendor.bankid);
				}

				var rpostAddrNode = "";
				if (
					!isEmpty(vendor.vbankaddrs1) ||
					!isEmpty(vendor.vbankstate) ||
					!isEmpty(vendor.vbankcity) ||
					!isEmpty(vendor.vbankzip) ||
					!isEmpty(vendor.vbankcountry)
				) {
					rpostAddrNode = addNodeFromParentNode(xmlDoc, rbankInfoNode, "PostAddr");
				}

				if (!isEmpty(vendor.vbankaddrs1)) addTextNodeFromParentNode(xmlDoc, rpostAddrNode, "Addr1", vendor.vbankaddrs1);
				if (!isEmpty(vendor.vbankstate)) addTextNodeFromParentNode(xmlDoc, rpostAddrNode, "StateProv", vendor.vbankstate);

				if (!isEmpty(vendor.vbankcity)) addTextNodeFromParentNode(xmlDoc, rpostAddrNode, "City", vendor.vbankcity);

				if (!isEmpty(vendor.vbankzip)) addTextNodeFromParentNode(xmlDoc, rpostAddrNode, "PostalCode", vendor.vbankzip);

				if (!isEmpty(vendor.vbankcountry)) addTextNodeFromParentNode(xmlDoc, rpostAddrNode, "Country", countryCodeMapping[vendor.vbankcountry]);

				if (!isEmpty(vendor.recbankprimid)) addTextNodeFromParentNode(xmlDoc, rbankInfoNode, "BankID", vendor.recbankprimid);
				// END: RcvrDepAcctID

				// START : IntermediaryDepAccID
				// if (pmtMethod == 'MTS' || pmtMethod == 'IAC') {

				var intermediaryDepAccID = addNodeFromParentNode(xmlDoc, pmtRecNode, "IntermediaryDepAccID");
				var iDeptAcctIdNode = addNodeFromParentNode(xmlDoc, intermediaryDepAccID, "DepAcctID");
				var iBankInfoNode = addNodeFromParentNode(xmlDoc, iDeptAcctIdNode, "BankInfo");

				if (!isEmpty(vendor.custentity_inter_bank_id_type))
					setAttributeValue(iBankInfoNode, "BankIDType", vendor.custentity_inter_bank_id_type);

				if (!isEmpty(vendor.custentity_inter_bank_name)) setAttributeValue(iBankInfoNode, "Name", vendor.custentity_inter_bank_name);

				if (!isEmpty(vendor.custentity_inter_bank_id)) {
					// If Bank ID is ABA, enter the 9 digit ABA routing/transit
					// number.
					// If BankID Type is SWT, enter 8 or 11 character SWIFT BIC
					// code.
					// If BankIDType is CHP enter the 4 digit CHP participant
					// ID.
					addTextNodeFromParentNode(xmlDoc, iBankInfoNode, "BankID", vendor.custentity_inter_bank_id);
				}

				var iPostAddrNode = "";
				if (
					!isEmpty(vendor.custentity_inter_bank_address_1) ||
					!isEmpty(vendor.custentity_inter_bank_city) ||
					!isEmpty(vendor.custentity_inter_bank_state) ||
					!isEmpty(vendor.custentity_inter_bank_postal) ||
					!isEmpty(vendor.custentity_inter_bank_country)
				) {
					iPostAddrNode = addNodeFromParentNode(xmlDoc, iBankInfoNode, "PostAddr");
				}

				if (!isEmpty(vendor.custentity_inter_bank_address_1))
					addTextNodeFromParentNode(xmlDoc, iPostAddrNode, "Addr1", vendor.custentity_inter_bank_address_1);

				if (!isEmpty(vendor.custentity_inter_bank_city))
					addTextNodeFromParentNode(xmlDoc, iPostAddrNode, "City", vendor.custentity_inter_bank_city);

				if (!isEmpty(vendor.custentity_inter_bank_state))
					addTextNodeFromParentNode(xmlDoc, iPostAddrNode, "StateProv", vendor.custentity_inter_bank_state);

				if (!isEmpty(vendor.custentity_inter_bank_postal))
					addTextNodeFromParentNode(xmlDoc, iPostAddrNode, "PostalCode", vendor.custentity_inter_bank_postal);

				if (!isEmpty(vendor.custentity_inter_bank_country))
					addTextNodeFromParentNode(xmlDoc, iPostAddrNode, "Country", countryCodeMapping[vendor.custentity_inter_bank_country]);
				// END : IntermediaryDepAccID

				// START: PmtDetail
				var pmtDetailsNode = addNodeFromParentNode(xmlDoc, pmtRecNode, "PmtDetail");
				var pmtInvoiceInfoNode = addNodeFromParentNode(xmlDoc, pmtDetailsNode, "InvoiceInfo");

				if (!isEmpty(vendorPaymentInfo)) {
					setAttributeValue(pmtInvoiceInfoNode, "InvoiceType", vendorPaymentInfo.custrecord_invoicetype);
				} else {
					setAttributeValue(pmtInvoiceInfoNode, "InvoiceType", "");
				}

				setAttributeValue(pmtInvoiceInfoNode, "InvoiceNum", bill.billnum);
				setAttributeValue(pmtInvoiceInfoNode, "TotalCurAmt", Number(bill.origamt).toFixed(2));
				setAttributeValue(pmtInvoiceInfoNode, "NetCurAmt", Number(bill.payamt).toFixed(2));

				if (!isEmpty(billdata.memo)) {
					var pmtdNoteNodeCR = addNodeFromParentNode(xmlDoc, pmtInvoiceInfoNode, "Note");
					setAttributeValue(pmtdNoteNodeCR, "NoteType", "INV");
					addTextNodeFromParentNode(xmlDoc, pmtdNoteNodeCR, "NoteText", billdata.memo);
				}

				setAttributeValue(pmtInvoiceInfoNode, "DiscountCurAmt", Number(bill.discamt || 0).toFixed(2));

				// Add PO Num -- CLEAN
				if (!isEmpty(arrBillPO[bill.id])) {
					var poInfoNode = addNodeFromParentNode(xmlDoc, pmtInvoiceInfoNode, "POInfo");
					setAttributeValue(poInfoNode, "POType", "PO");
					addTextNodeFromParentNode(xmlDoc, poInfoNode, "PONum", arrBillPO[bill.id]);
				}
				//check if there are bill credit/s associated to bill. append if so.
				if (!isEmpty(billcredits)) {
					for (bc in billcredits) {
						var pmtInvoiceInfoNodeCR = addNodeFromParentNode(xmlDoc, pmtDetailsNode, "InvoiceInfo");
						setAttributeValue(pmtInvoiceInfoNodeCR, "InvoiceType", "CM");
						setAttributeValue(pmtInvoiceInfoNodeCR, "InvoiceNum", billcredits[bc].bcnum);

						var billCreditAmtP = getFloatVal(billcredits[bc].bcamt);
						var billCreditAmt = billCreditAmtP * -1;

						setAttributeValue(pmtInvoiceInfoNodeCR, "EffDt", formatDate(nlapiStringToDate(billcredits[bc].bcdate)));
						setAttributeValue(pmtInvoiceInfoNodeCR, "NetCurAmt", billCreditAmt.toFixed(2));
						setAttributeValue(pmtInvoiceInfoNodeCR, "TotalCurAmt", billCreditAmt.toFixed(2));

						if (!isEmpty(billcredits[bc].bcmemo)) {
							var pmtdNoteNodeCRBC = addNodeFromParentNode(xmlDoc, pmtInvoiceInfoNodeCR, "Note");
							setAttributeValue(pmtdNoteNodeCRBC, "NoteType", "INV");
							addTextNodeFromParentNode(
								xmlDoc,
								pmtdNoteNodeCRBC,
								"NoteText",
								isEmpty(billcredits[bc].bcmemo) ? "" : setValue(billcredits[bc].bcmemo)
							);
						}
					}
				}

				// END: PmtDetail

				// START: DocDelivery
				var docDeliveryNode = addNodeFromParentNode(xmlDoc, pmtRecNode, "DocDelivery");

				if (!isEmpty(vendor.custentity_pmp_biller_id)) {
					addTextNodeFromParentNode(xmlDoc, docDeliveryNode, "EDDBillerID", vendor.custentity_pmp_biller_id);
				} else if (!isEmpty(accountData) && !isEmpty(accountData.getValue("custrecord_acct_map_pmp_biller_id"))) {
					addTextNodeFromParentNode(xmlDoc, docDeliveryNode, "EDDBillerID", accountData.getValue("custrecord_acct_map_pmp_biller_id"));
				}

				var fileOutNode = addNodeFromParentNode(xmlDoc, docDeliveryNode, "FileOut");

				if (!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_dac_pmp_file_type))
					addTextNodeFromParentNode(xmlDoc, fileOutNode, "FileType", vendorPaymentInfo.custrecord_dac_pmp_file_type);

				if (!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_dac_pmp_file_format))
					addTextNodeFromParentNode(xmlDoc, fileOutNode, "FileFormat", vendorPaymentInfo.custrecord_dac_pmp_file_format);

				var deliveryNode = addNodeFromParentNode(xmlDoc, fileOutNode, "Delivery");

				if (!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_dac_pmp_delivery_type))
					addTextNodeFromParentNode(xmlDoc, deliveryNode, "DeliveryType", vendorPaymentInfo.custrecord_dac_pmp_delivery_type);

				if (!isEmpty(vendor.pmp_dac_contactname))
					addTextNodeFromParentNode(xmlDoc, deliveryNode, "DeliveryContactName", vendor.pmp_dac_contactname);

				if (!isEmpty(vendor.pmp_dac_emailaddress))
					addTextNodeFromParentNode(xmlDoc, deliveryNode, "DeliveryEmailAddress", vendor.pmp_dac_emailaddress);

				// END: DocDelivery

				addTextNodeFromParentNode(xmlDoc, pmtRecNode, "CurAmt", Number(bill.payamt).toFixed(2)); //confirm with Al.
			},
			IAC: function () {
				setAttributeValue(pmtRecNode, "PmtCrDr", "C");
				setAttributeValue(pmtRecNode, "PmtMethod", pmtMethod);

				if (!isEmpty(vendor.custentity_paymentformat)) {
					setAttributeValue(pmtRecNode, "PmtFormat", vendor.custentity_paymentformat);
				}

				if (!isEmpty(vendor.custentity_interpayformat)) setAttributeValue(pmtRecNode, "PmtFormatIntl", vendor.custentity_interpayformat);

				if (!isEmpty(vendor.custentity_pmp_biller_id)) {
					setAttributeValue(pmtRecNode, "TranHandlingCode", "U");
				} else if (!isEmpty(accountData) && !isEmpty(accountData.getValue("custrecord_acct_map_pmp_biller_id"))) {
					setAttributeValue(pmtRecNode, "TranHandlingCode", "U");
				}

				addTextNodeFromParentNode(xmlDoc, pmtRecNode, "PmtID", bill.refnum);
				if (!isEmpty(bill.currid)) {
					var curCode = arrCurrencyMap[bill.currid];
					addTextNodeFromParentNode(xmlDoc, pmtRecNode, "CurCode", curCode);
				}
				addTextNodeFromParentNode(xmlDoc, pmtRecNode, "ValueDate", formatDate(nlapiStringToDate(BPM_DATE)));

				if (!isEmpty(vendor.fx_reftype) || !isEmpty(vendor.fx_refid)) {
					var iacRefInfo = addNodeFromParentNode(xmlDoc, pmtRecNode, "RefInfo");
					if (!isEmpty(vendor.fx_reftype)) setAttributeValue(iacRefInfo, "RefType", vendor.fx_reftype);
					if (!isEmpty(vendor.fx_refid)) addTextNodeFromParentNode(xmlDoc, iacRefInfo, "RefID", vendor.fx_refid);
				}

				var msgNode = addNodeFromParentNode(xmlDoc, pmtRecNode, "Message");
				setAttributeValue(msgNode, "MsgType", vendorPaymentInfo[MSG_TYPE[pmtMethod]]);

				if (CHECK_MEMO == "T") {
					var msgTypeTxt = billpayment.memo;
					addTextNodeFromParentNode(xmlDoc, msgNode, "MsgText", msgTypeTxt);
				} else {
					// var msgTypeTxt = bill.payeeid;
					// addTextNodeFromParentNode(xmlDoc, msgNode, 'MsgText', msgTypeTxt);
					dAudit("DEFAULT_MSG_VENDOR_ID", DEFAULT_MSG_VENDOR_ID);
					var msgTypeTxt = "";
					if (DEFAULT_MSG_VENDOR_ID == "T") {
						try {
							msgTypeTxt = vendor.custentity_ica_vendor_external_id;
						} catch (e) {
							dErr("DEFAULT_MSG_VENDOR_ID custom field not found. Doing nothing", DEFAULT_MSG_VENDOR_ID);
						}
						addTextNodeFromParentNode(xmlDoc, msgNode, "MsgText", msgTypeTxt);
					} else {
						msgTypeTxt = bill.payeeid;
						addTextNodeFromParentNode(xmlDoc, msgNode, "MsgText", msgTypeTxt);
					}
				}

				//Clean
				var msgTxt = "";
				var bMemo = vendor.custentity_ica_vendor_bank_instructions; //arrPayeeInterBillsMemo[bill.payeeid];

				if (!isEmpty(bMemo)) msgTxt += isEmpty(msgTxt) ? bMemo : " " + bMemo;

				dLog("creatXMLDoc", "Msg text = " + msgTxt);

				if (!isEmpty(msgTxt)) {
					var msgNode = addNodeFromParentNode(xmlDoc, pmtRecNode, "Message");
					setAttributeValue(msgNode, "MsgType", VENDOR_ORIG_MSG_TYPE);
					addTextNodeFromParentNode(xmlDoc, msgNode, "MsgText", msgTxt);
				}

				// START: Origin Party
				var orgnPartyNode = addNodeFromParentNode(xmlDoc, pmtRecNode, "OrgnrParty");

				if (!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_companyname)) {
					var orgpNameNode = addNodeFromParentNode(xmlDoc, orgnPartyNode, "Name");
					addTextNodeFromParentNode(xmlDoc, orgpNameNode, "Name1", vendorPaymentInfo.custrecord_companyname);
				}
				if (
					(!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_compadd1)) ||
					(!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_compadd2)) ||
					(!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_compcity)) ||
					(!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_compstateprov)) ||
					(!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_comppostcode))
				) {
					var postAddrNode = addNodeFromParentNode(xmlDoc, orgnPartyNode, "PostAddr");

					if (!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_compadd1))
						addTextNodeFromParentNode(xmlDoc, postAddrNode, "Addr1", vendorPaymentInfo.custrecord_compadd1);
					if (!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_compadd2))
						addTextNodeFromParentNode(xmlDoc, postAddrNode, "Addr2", vendorPaymentInfo.custrecord_compadd2);
					if (!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_compcity))
						addTextNodeFromParentNode(xmlDoc, postAddrNode, "City", vendorPaymentInfo.custrecord_compcity);
					if (!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_compstateprov))
						addTextNodeFromParentNode(xmlDoc, postAddrNode, "StateProv", vendorPaymentInfo.custrecord_compstateprov);
					if (!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_comppostcode))
						addTextNodeFromParentNode(xmlDoc, postAddrNode, "PostalCode", vendorPaymentInfo.custrecord_comppostcode);

					var country = !isEmpty(vendorPaymentInfo) ? vendorPaymentInfo.custrecord_compcountrycode : "";
					if (!isEmpty(country)) addTextNodeFromParentNode(xmlDoc, postAddrNode, "Country", country);

					var countryName = !isEmpty(vendorPaymentInfo) ? vendorPaymentInfo.custrecord_compcountrynames : "";
					if (!isEmpty(countryName)) addTextNodeFromParentNode(xmlDoc, postAddrNode, "CountryName", countryName);
				}
				// END: Origin Party

				// START: OrgnrDepAcctID
				var orgnDepAcctIDNode = addNodeFromParentNode(xmlDoc, pmtRecNode, "OrgnrDepAcctID");
				var odepacctIdNode = addNodeFromParentNode(xmlDoc, orgnDepAcctIDNode, "DepAcctID");

				if (!isEmpty(accountData) && !isEmpty(accountData.getText("custrecord_acct_map_ext_bank_account_typ")))
					setAttributeValue(odepacctIdNode, "AcctType", accountData.getText("custrecord_acct_map_ext_bank_account_typ"));

				if (!isEmpty(accountData) && !isEmpty(accountData.getValue("custrecord_acct_map_ext_bank_origin_acc")))
					setAttributeValue(odepacctIdNode, "AcctID", accountData.getValue("custrecord_acct_map_ext_bank_origin_acc"));

				if (!isEmpty(accountData) && !isEmpty(accountData.getValue("custrecord_acct_map_account_currency")))
					setAttributeValue(odepacctIdNode, "AcctCur", arrCurrencyMap[accountData.getValue("custrecord_acct_map_account_currency")]);

				var bankInfoNode = addNodeFromParentNode(xmlDoc, odepacctIdNode, "BankInfo");
				if (!isEmpty(vendorPaymentInfo)) setAttributeValue(bankInfoNode, "Name", vendorPaymentInfo.custrecord_bankname);

				if (!isEmpty(accountData) && !isEmpty(accountData.getText("custrecord_acct_map_ext_bank_id_type")))
					setAttributeValue(bankInfoNode, "BankIDType", accountData.getText("custrecord_acct_map_ext_bank_id_type"));

				if (!isEmpty(accountData) && !isEmpty(accountData.getValue("custrecord_acct_map_ext_bank_ori_bank_id")))
					addTextNodeFromParentNode(xmlDoc, bankInfoNode, "BankID", accountData.getValue("custrecord_acct_map_ext_bank_ori_bank_id"));

				var orgrefInfoNode = addNodeFromParentNode(xmlDoc, bankInfoNode, "RefInfo");

				if (!isEmpty(vendorPaymentInfo)) setAttributeValue(orgrefInfoNode, "RefType", vendorPaymentInfo[MSG_TYPE[pmtMethod]]);

				if (!isEmpty(accountData) && !isEmpty(accountData.getValue("custrecord_acct_map_dom_ach_co_id"))) {
					addTextNodeFromParentNode(xmlDoc, orgrefInfoNode, "RefID", accountData.getValue("custrecord_acct_map_dom_ach_co_id"));
				}

				// END: OrgnrDepAcctID

				// START: RcvrParty
				var rcvrPartyNode = addNodeFromParentNode(xmlDoc, pmtRecNode, "RcvrParty");

				if (!isEmpty(vendor.vendorname)) {
					var rcvrPartyNameNode = addNodeFromParentNode(xmlDoc, rcvrPartyNode, "Name");
					addTextNodeFromParentNode(xmlDoc, rcvrPartyNameNode, "Name1", vendor.vendorname);
				}

				var ccrRefType =
					!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_ccr_reftype) ? vendorPaymentInfo.custrecord_ccr_reftype : "";
				// as per Al on 4th May 2016
				// On the VPM: Vendor Profile Tab: custentity_vendorreftype,
				// (XML: RefType = VN) please default this value to 'VN' in your
				// code, I don't want to use this field anymore.
				// var refType = (pmtMethod != 'CCR') ? objVendor.vreftype :
				// ccrRefType;
				var refType = ccrRefType ? ccrRefType : "VN";
				var refInfoNode = addNodeFromParentNode(xmlDoc, rcvrPartyNode, "RefInfo");

				if (refType) {
					setAttributeValue(refInfoNode, "RefType", refType);
				}

				// addTextNodeFromParentNode(xmlDoc, refInfoNode, 'RefID', bill.payeeid);
				var refIDTxt = "";
				if (DEFAULT_MSG_VENDOR_ID == "T") {
					try {
						refIDTxt = vendor.custentity_ica_vendor_external_id;
					} catch (e) {
						dErr("DEFAULT_MSG_VENDOR_ID custom field not found. Doing nothing", DEFAULT_MSG_VENDOR_ID);
					}
				} else {
					if (!isEmpty(bill.payeeid)) addTextNodeFromParentNode(xmlDoc, refInfoNode, "RefID", bill.payeeid);
				}
				if (!isEmpty(refIDTxt)) addTextNodeFromParentNode(xmlDoc, refInfoNode, "RefID", refIDTxt);

				var rPPostAddrNode = "";
				if (
					!isEmpty(vendor.vendoraddrs1) ||
					!isEmpty(vendor.vendoraddrs2) ||
					!isEmpty(vendor.vendorcity) ||
					!isEmpty(vendor.vendorstateprovince) ||
					(!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_comppostcode)) ||
					!isEmpty(vendor.vendorpostal) ||
					!isEmpty(vendor.vendorcountrycode)
				) {
					rPPostAddrNode = addNodeFromParentNode(xmlDoc, rcvrPartyNode, "PostAddr");
				}

				if (!isEmpty(vendor.vendoraddrs1)) addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, "Addr1", vendor.vendoraddrs1);
				if (!isEmpty(vendor.vendoraddrs2)) addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, "Addr2", vendor.vendoraddrs2);
				if (!isEmpty(vendor.vendorcity)) addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, "City", vendor.vendorcity);
				if (!isEmpty(vendor.vendorstateprovince)) addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, "StateProv", vendor.vendorstateprovince);
				if (!isEmpty(vendor.vendorpostal)) addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, "PostalCode", vendor.vendorpostal);
				if (!isEmpty(vendor.vendorcountrycode)) {
					addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, "Country", countryCodeMapping[vendor.vendorcountrycode]);
					addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, "CountryName", vendor.vendorcountrycode);
				}
				// END: RcvrParty

				// START: RcvrDepAcctID
				var rcvrDeptAcctID = addNodeFromParentNode(xmlDoc, pmtRecNode, "RcvrDepAcctID");
				var rdeptAcctIdNode = addNodeFromParentNode(xmlDoc, rcvrDeptAcctID, "DepAcctID");
				if (!isEmpty(vendor.recpartyaccount)) setAttributeValue(rdeptAcctIdNode, "AcctID", vendor.recpartyaccount);

				// As per Al on 4th May | On the VPM: Payment Profile Tab:
				// custentity_recpartyaccttype,
				// (XML: AcctType = D) please default this value to 'D' in your
				// code, I don't want to use this field anymore.
				// if (!isEmpty(objVendor.recpartyaccttype))
				setAttributeValue(rdeptAcctIdNode, "AcctType", "D");

				if (!isEmpty(bill.currid)) {
					var curCode = arrCurrencyMap[bill.currid];
					setAttributeValue(rdeptAcctIdNode, "AcctCur", arrCurrencyMap[bill.currid]);
				}

				var rbankInfoNode = addNodeFromParentNode(xmlDoc, rdeptAcctIdNode, "BankInfo");
				if (!isEmpty(vendor.vbankname)) setAttributeValue(rbankInfoNode, "Name", vendor.vbankname);
				if (!isEmpty(vendor.recbankprimidtype)) setAttributeValue(rbankInfoNode, "BankIDType", vendor.recbankprimidtype);

				if (!isEmpty(vendor.bankid)) {
					//(pmtMethod == 'IAC' || pmtMethod == 'IWI' || pmtMethod == 'MTS') &&
					setAttributeValue(rbankInfoNode, "BranchID", vendor.bankid);
				}

				var rpostAddrNode = "";
				if (
					!isEmpty(vendor.vbankaddrs1) ||
					!isEmpty(vendor.vbankstate) ||
					!isEmpty(vendor.vbankcity) ||
					!isEmpty(vendor.vbankzip) ||
					!isEmpty(vendor.vbankcountry)
				) {
					rpostAddrNode = addNodeFromParentNode(xmlDoc, rbankInfoNode, "PostAddr");
				}

				// if (!isEmpty(vendor.vbankaddrs1))
				//     addTextNodeFromParentNode(xmlDoc, rpostAddrNode, 'Addr1', vendor.vbankaddrs1);
				// if (!isEmpty(vendor.vbankstate))
				//     addTextNodeFromParentNode(xmlDoc, rpostAddrNode, 'StateProv', vendor.vbankstate);

				if (!isEmpty(vendor.vbankcity)) addTextNodeFromParentNode(xmlDoc, rpostAddrNode, "City", vendor.vbankcity);

				if (!isEmpty(vendor.vbankzip)) addTextNodeFromParentNode(xmlDoc, rpostAddrNode, "PostalCode", vendor.vbankzip);

				if (!isEmpty(vendor.vbankcountry)) addTextNodeFromParentNode(xmlDoc, rpostAddrNode, "Country", countryCodeMapping[vendor.vbankcountry]);

				if (!isEmpty(vendor.recbankprimid)) addTextNodeFromParentNode(xmlDoc, rbankInfoNode, "BankID", vendor.recbankprimid);
				// END: RcvrDepAcctID

				// START : IntermediaryDepAccID
				// if (pmtMethod == 'MTS' || pmtMethod == 'IAC') {

				var intermediaryDepAccID = addNodeFromParentNode(xmlDoc, pmtRecNode, "IntermediaryDepAccID");
				var iDeptAcctIdNode = addNodeFromParentNode(xmlDoc, intermediaryDepAccID, "DepAcctID");
				var iBankInfoNode = addNodeFromParentNode(xmlDoc, iDeptAcctIdNode, "BankInfo");

				if (!isEmpty(vendor.custentity_inter_bank_id_type))
					setAttributeValue(iBankInfoNode, "BankIDType", vendor.custentity_inter_bank_id_type);

				if (!isEmpty(vendor.custentity_inter_bank_name)) setAttributeValue(iBankInfoNode, "Name", vendor.custentity_inter_bank_name);

				if (!isEmpty(vendor.custentity_inter_bank_id)) {
					// If Bank ID is ABA, enter the 9 digit ABA routing/transit
					// number.
					// If BankID Type is SWT, enter 8 or 11 character SWIFT BIC
					// code.
					// If BankIDType is CHP enter the 4 digit CHP participant
					// ID.
					addTextNodeFromParentNode(xmlDoc, iBankInfoNode, "BankID", vendor.custentity_inter_bank_id);
				}

				var iPostAddrNode = "";
				if (
					!isEmpty(vendor.custentity_inter_bank_address_1) ||
					!isEmpty(vendor.custentity_inter_bank_city) ||
					!isEmpty(vendor.custentity_inter_bank_state) ||
					!isEmpty(vendor.custentity_inter_bank_postal) ||
					!isEmpty(vendor.custentity_inter_bank_country)
				) {
					iPostAddrNode = addNodeFromParentNode(xmlDoc, iBankInfoNode, "PostAddr");
				}

				if (!isEmpty(vendor.custentity_inter_bank_address_1))
					addTextNodeFromParentNode(xmlDoc, iPostAddrNode, "Addr1", vendor.custentity_inter_bank_address_1);

				if (!isEmpty(vendor.custentity_inter_bank_city))
					addTextNodeFromParentNode(xmlDoc, iPostAddrNode, "City", vendor.custentity_inter_bank_city);

				if (!isEmpty(vendor.custentity_inter_bank_state))
					addTextNodeFromParentNode(xmlDoc, iPostAddrNode, "StateProv", vendor.custentity_inter_bank_state);

				if (!isEmpty(vendor.custentity_inter_bank_postal))
					addTextNodeFromParentNode(xmlDoc, iPostAddrNode, "PostalCode", vendor.custentity_inter_bank_postal);

				if (!isEmpty(vendor.custentity_inter_bank_country))
					addTextNodeFromParentNode(xmlDoc, iPostAddrNode, "Country", countryCodeMapping[vendor.custentity_inter_bank_country]);
				// END : IntermediaryDepAccID

				// START: PmtDetail
				var pmtDetailsNode = addNodeFromParentNode(xmlDoc, pmtRecNode, "PmtDetail");
				var pmtInvoiceInfoNode = addNodeFromParentNode(xmlDoc, pmtDetailsNode, "InvoiceInfo");

				if (!isEmpty(vendorPaymentInfo)) {
					setAttributeValue(pmtInvoiceInfoNode, "InvoiceType", vendorPaymentInfo.custrecord_invoicetype);
				} else {
					setAttributeValue(pmtInvoiceInfoNode, "InvoiceType", "");
				}

				setAttributeValue(pmtInvoiceInfoNode, "InvoiceNum", bill.billnum);
				setAttributeValue(pmtInvoiceInfoNode, "TotalCurAmt", Number(bill.origamt).toFixed(2));
				setAttributeValue(pmtInvoiceInfoNode, "NetCurAmt", Number(bill.payamt).toFixed(2));

				if (!isEmpty(billdata.memo)) {
					var pmtdNoteNodeCR = addNodeFromParentNode(xmlDoc, pmtInvoiceInfoNode, "Note");
					setAttributeValue(pmtdNoteNodeCR, "NoteType", "INV");
					addTextNodeFromParentNode(xmlDoc, pmtdNoteNodeCR, "NoteText", billdata.memo);
				}

				setAttributeValue(pmtInvoiceInfoNode, "DiscountCurAmt", Number(bill.discamt || 0).toFixed(2));

				// Add PO Num -- CLEAN
				if (!isEmpty(arrBillPO[bill.id])) {
					var poInfoNode = addNodeFromParentNode(xmlDoc, pmtInvoiceInfoNode, "POInfo");
					setAttributeValue(poInfoNode, "POType", "PO");
					addTextNodeFromParentNode(xmlDoc, poInfoNode, "PONum", arrBillPO[bill.id]);
				}
				//check if there are bill credit/s associated to bill. append if so.
				if (!isEmpty(billcredits)) {
					for (bc in billcredits) {
						var pmtInvoiceInfoNodeCR = addNodeFromParentNode(xmlDoc, pmtDetailsNode, "InvoiceInfo");
						setAttributeValue(pmtInvoiceInfoNodeCR, "InvoiceType", "CM");
						setAttributeValue(pmtInvoiceInfoNodeCR, "InvoiceNum", billcredits[bc].bcnum);

						var billCreditAmtP = getFloatVal(billcredits[bc].bcamt);
						var billCreditAmt = billCreditAmtP * -1;

						setAttributeValue(pmtInvoiceInfoNodeCR, "EffDt", formatDate(nlapiStringToDate(billcredits[bc].bcdate)));
						setAttributeValue(pmtInvoiceInfoNodeCR, "NetCurAmt", billCreditAmt.toFixed(2));
						setAttributeValue(pmtInvoiceInfoNodeCR, "TotalCurAmt", billCreditAmt.toFixed(2));

						if (!isEmpty(billcredits[bc].bcmemo)) {
							var pmtdNoteNodeCRBC = addNodeFromParentNode(xmlDoc, pmtInvoiceInfoNodeCR, "Note");
							setAttributeValue(pmtdNoteNodeCRBC, "NoteType", "INV");
							addTextNodeFromParentNode(
								xmlDoc,
								pmtdNoteNodeCRBC,
								"NoteText",
								isEmpty(billcredits[bc].bcmemo) ? "" : setValue(billcredits[bc].bcmemo)
							);
						}
					}
				}

				// END: PmtDetail

				// START: DocDelivery
				var docDeliveryNode = addNodeFromParentNode(xmlDoc, pmtRecNode, "DocDelivery");

				if (!isEmpty(vendor.custentity_pmp_biller_id)) {
					addTextNodeFromParentNode(xmlDoc, docDeliveryNode, "EDDBillerID", vendor.custentity_pmp_biller_id);
				} else if (!isEmpty(accountData) && !isEmpty(accountData.getValue("custrecord_acct_map_pmp_biller_id"))) {
					addTextNodeFromParentNode(xmlDoc, docDeliveryNode, "EDDBillerID", accountData.getValue("custrecord_acct_map_pmp_biller_id"));
				}

				var fileOutNode = addNodeFromParentNode(xmlDoc, docDeliveryNode, "FileOut");

				if (!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_dac_pmp_file_type))
					addTextNodeFromParentNode(xmlDoc, fileOutNode, "FileType", vendorPaymentInfo.custrecord_dac_pmp_file_type);

				if (!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_dac_pmp_file_format))
					addTextNodeFromParentNode(xmlDoc, fileOutNode, "FileFormat", vendorPaymentInfo.custrecord_dac_pmp_file_format);

				var deliveryNode = addNodeFromParentNode(xmlDoc, fileOutNode, "Delivery");

				if (!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_dac_pmp_delivery_type))
					addTextNodeFromParentNode(xmlDoc, deliveryNode, "DeliveryType", vendorPaymentInfo.custrecord_dac_pmp_delivery_type);

				if (!isEmpty(vendor.pmp_dac_contactname))
					addTextNodeFromParentNode(xmlDoc, deliveryNode, "DeliveryContactName", vendor.pmp_dac_contactname);

				if (!isEmpty(vendor.pmp_dac_emailaddress))
					addTextNodeFromParentNode(xmlDoc, deliveryNode, "DeliveryEmailAddress", vendor.pmp_dac_emailaddress);

				// END: DocDelivery

				addTextNodeFromParentNode(xmlDoc, pmtRecNode, "CurAmt", Number(bill.payamt).toFixed(2)); //confirm with Al.
			},
			IWI: function () {
				setAttributeValue(pmtRecNode, "PmtCrDr", "C");
				setAttributeValue(pmtRecNode, "PmtMethod", pmtMethod);

				if (!isEmpty(vendor.custentity_paymentformat)) {
					setAttributeValue(pmtRecNode, "PmtFormat", vendor.custentity_paymentformat);
				}

				if (!isEmpty(vendor.custentity_interpayformat)) setAttributeValue(pmtRecNode, "PmtFormatIntl", vendor.custentity_interpayformat);

				if (!isEmpty(vendor.custentity_pmp_biller_id)) {
					setAttributeValue(pmtRecNode, "TranHandlingCode", "U");
				} else if (!isEmpty(accountData) && !isEmpty(accountData.getValue("custrecord_acct_map_pmp_biller_id"))) {
					setAttributeValue(pmtRecNode, "TranHandlingCode", "U");
				}

				addTextNodeFromParentNode(xmlDoc, pmtRecNode, "PmtID", bill.refnum);

				if (!isEmpty(bill.currid)) {
					var curCode = arrCurrencyMap[bill.currid];
					addTextNodeFromParentNode(xmlDoc, pmtRecNode, "CurCode", curCode);
				}

				addTextNodeFromParentNode(xmlDoc, pmtRecNode, "ValueDate", formatDate(nlapiStringToDate(BPM_DATE)));

				if (!isEmpty(vendor.fx_reftype) || !isEmpty(vendor.fx_refid)) {
					var iacRefInfo = addNodeFromParentNode(xmlDoc, pmtRecNode, "RefInfo");
					if (!isEmpty(vendor.fx_reftype)) setAttributeValue(iacRefInfo, "RefType", vendor.fx_reftype);
					if (!isEmpty(vendor.fx_refid)) addTextNodeFromParentNode(xmlDoc, iacRefInfo, "RefID", vendor.fx_refid);
				}

				//Message Node
				var msgNode = addNodeFromParentNode(xmlDoc, pmtRecNode, "Message");
				setAttributeValue(msgNode, "MsgType", vendorPaymentInfo[MSG_TYPE[pmtMethod]]);

				if (CHECK_MEMO == "T") {
					addTextNodeFromParentNode(xmlDoc, msgNode, "MsgText", billpayment.memo);
				} else {
					addTextNodeFromParentNode(xmlDoc, msgNode, "MsgText", "");
				}
				//END: Message Node

				//Clean
				var msgTxt = "";
				var bMemo = vendor.custentity_ica_vendor_bank_instructions; //arrPayeeInterBillsMemo[bill.payeeid];

				if (!isEmpty(bMemo)) msgTxt += isEmpty(msgTxt) ? bMemo : " " + bMemo;

				dLog("creatXMLDoc", "Msg text = " + msgTxt);

				if (!isEmpty(msgTxt)) {
					var msgNode = addNodeFromParentNode(xmlDoc, pmtRecNode, "Message");
					setAttributeValue(msgNode, "MsgType", VENDOR_ORIG_MSG_TYPE);
					addTextNodeFromParentNode(xmlDoc, msgNode, "MsgText", msgTxt);
				}

				// START: Origin Party
				var orgnPartyNode = addNodeFromParentNode(xmlDoc, pmtRecNode, "OrgnrParty");

				if (!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_companyname)) {
					var orgpNameNode = addNodeFromParentNode(xmlDoc, orgnPartyNode, "Name");
					addTextNodeFromParentNode(xmlDoc, orgpNameNode, "Name1", vendorPaymentInfo.custrecord_companyname);
				}

				if (
					(!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_compadd1)) ||
					(!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_compadd2)) ||
					(!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_compcity)) ||
					(!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_compstateprov)) ||
					(!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_comppostcode))
				) {
					var postAddrNode = addNodeFromParentNode(xmlDoc, orgnPartyNode, "PostAddr");

					if (!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_compadd1))
						addTextNodeFromParentNode(xmlDoc, postAddrNode, "Addr1", vendorPaymentInfo.custrecord_compadd1);
					if (!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_compadd2))
						addTextNodeFromParentNode(xmlDoc, postAddrNode, "Addr2", vendorPaymentInfo.custrecord_compadd2);
					if (!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_compcity))
						addTextNodeFromParentNode(xmlDoc, postAddrNode, "City", vendorPaymentInfo.custrecord_compcity);
					if (!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_compstateprov))
						addTextNodeFromParentNode(xmlDoc, postAddrNode, "StateProv", vendorPaymentInfo.custrecord_compstateprov);
					if (!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_comppostcode))
						addTextNodeFromParentNode(xmlDoc, postAddrNode, "PostalCode", vendorPaymentInfo.custrecord_comppostcode);

					var country = !isEmpty(vendorPaymentInfo) ? vendorPaymentInfo.custrecord_compcountrycode : "";
					if (!isEmpty(country)) addTextNodeFromParentNode(xmlDoc, postAddrNode, "Country", country);

					var countryName = !isEmpty(vendorPaymentInfo) ? vendorPaymentInfo.custrecord_compcountrynames : "";
					if (!isEmpty(countryName)) addTextNodeFromParentNode(xmlDoc, postAddrNode, "CountryName", countryName);
				}
				// END: Origin Party

				// START: OrgnrDepAcctID
				var orgnDepAcctIDNode = addNodeFromParentNode(xmlDoc, pmtRecNode, "OrgnrDepAcctID");
				var odepacctIdNode = addNodeFromParentNode(xmlDoc, orgnDepAcctIDNode, "DepAcctID");

				if (!isEmpty(accountData) && !isEmpty(accountData.getText("custrecord_acct_map_ext_bank_account_typ")))
					setAttributeValue(odepacctIdNode, "AcctType", accountData.getText("custrecord_acct_map_ext_bank_account_typ"));

				if (!isEmpty(accountData) && !isEmpty(accountData.getValue("custrecord_acct_map_ext_bank_origin_acc")))
					setAttributeValue(odepacctIdNode, "AcctID", accountData.getValue("custrecord_acct_map_ext_bank_origin_acc"));

				if (!isEmpty(accountData) && !isEmpty(accountData.getValue("custrecord_acct_map_account_currency")))
					setAttributeValue(odepacctIdNode, "AcctCur", arrCurrencyMap[accountData.getValue("custrecord_acct_map_account_currency")]);

				var bankInfoNode = addNodeFromParentNode(xmlDoc, odepacctIdNode, "BankInfo");
				if (!isEmpty(vendorPaymentInfo)) setAttributeValue(bankInfoNode, "Name", vendorPaymentInfo.custrecord_bankname);

				if (!isEmpty(accountData) && !isEmpty(accountData.getText("custrecord_acct_map_ext_bank_id_type")))
					setAttributeValue(bankInfoNode, "BankIDType", accountData.getText("custrecord_acct_map_ext_bank_id_type"));

				if (!isEmpty(accountData) && !isEmpty(accountData.getValue("custrecord_acct_map_ext_bank_ori_bank_id")))
					addTextNodeFromParentNode(xmlDoc, bankInfoNode, "BankID", accountData.getValue("custrecord_acct_map_ext_bank_ori_bank_id"));

				var orgrefInfoNode = addNodeFromParentNode(xmlDoc, bankInfoNode, "RefInfo");

				if (!isEmpty(vendorPaymentInfo)) setAttributeValue(orgrefInfoNode, "RefType", vendorPaymentInfo[MSG_TYPE[pmtMethod]]);

				// END: OrgnrDepAcctID

				// START: RcvrParty
				var rcvrPartyNode = addNodeFromParentNode(xmlDoc, pmtRecNode, "RcvrParty");

				if (!isEmpty(vendor.vendorname)) {
					var rcvrPartyNameNode = addNodeFromParentNode(xmlDoc, rcvrPartyNode, "Name");
					addTextNodeFromParentNode(xmlDoc, rcvrPartyNameNode, "Name1", vendor.vendorname);
				}

				// as per Al on 4th May 2016
				// On the VPM: Vendor Profile Tab: custentity_vendorreftype,
				// (XML: RefType = VN) please default this value to 'VN' in your
				// code, I don't want to use this field anymore.
				// var refType = (pmtMethod != 'CCR') ? objVendor.vreftype :
				// ccrRefType;
				var refInfoNode = addNodeFromParentNode(xmlDoc, rcvrPartyNode, "RefInfo");
				setAttributeValue(refInfoNode, "RefType", "VN");

				// addTextNodeFromParentNode(xmlDoc, refInfoNode, 'RefID', bill.payeeid);
				var refIDTxt = "";
				if (DEFAULT_MSG_VENDOR_ID == "T") {
					try {
						refIDTxt = vendor.custentity_ica_vendor_external_id;
					} catch (e) {
						dErr("DEFAULT_MSG_VENDOR_ID custom field not found. Doing nothing", DEFAULT_MSG_VENDOR_ID);
					}
				} else {
					if (!isEmpty(bill.payeeid)) addTextNodeFromParentNode(xmlDoc, refInfoNode, "RefID", bill.payeeid);
				}
				if (!isEmpty(refIDTxt)) addTextNodeFromParentNode(xmlDoc, refInfoNode, "RefID", refIDTxt);

				var rPPostAddrNode = "";
				if (
					!isEmpty(vendor.vendoraddrs1) ||
					!isEmpty(vendor.vendoraddrs2) ||
					!isEmpty(vendor.vendorcity) ||
					!isEmpty(vendor.vendorstateprovince) ||
					(!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_comppostcode)) ||
					!isEmpty(vendor.vendorpostal) ||
					!isEmpty(vendor.vendorcountrycode)
				) {
					rPPostAddrNode = addNodeFromParentNode(xmlDoc, rcvrPartyNode, "PostAddr");
				}

				if (!isEmpty(vendor.vendoraddrs1)) addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, "Addr1", vendor.vendoraddrs1);
				if (!isEmpty(vendor.vendoraddrs2)) addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, "Addr2", vendor.vendoraddrs2);
				if (!isEmpty(vendor.vendorcity)) addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, "City", vendor.vendorcity);
				if (!isEmpty(vendor.vendorstateprovince)) addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, "StateProv", vendor.vendorstateprovince);
				if (!isEmpty(vendor.vendorpostal)) addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, "PostalCode", vendor.vendorpostal);
				if (!isEmpty(vendor.vendorcountrycode)) {
					addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, "Country", countryCodeMapping[vendor.vendorcountrycode]);
					addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, "CountryName", vendor.vendorcountrycode);
				}
				// END: RcvrParty

				// START: RcvrDepAcctID
				var rcvrDeptAcctID = addNodeFromParentNode(xmlDoc, pmtRecNode, "RcvrDepAcctID");
				var rdeptAcctIdNode = addNodeFromParentNode(xmlDoc, rcvrDeptAcctID, "DepAcctID");
				if (!isEmpty(vendor.recpartyaccount)) setAttributeValue(rdeptAcctIdNode, "AcctID", vendor.recpartyaccount);

				setAttributeValue(rdeptAcctIdNode, "AcctType", "D");

				if (!isEmpty(bill.currid)) {
					var curCode = arrCurrencyMap[bill.currid];
					setAttributeValue(rdeptAcctIdNode, "AcctCur", arrCurrencyMap[bill.currid]);
				}

				var rbankInfoNode = addNodeFromParentNode(xmlDoc, rdeptAcctIdNode, "BankInfo");
				if (!isEmpty(vendor.vbankname)) setAttributeValue(rbankInfoNode, "Name", vendor.vbankname);
				if (!isEmpty(vendor.recbankprimidtype)) setAttributeValue(rbankInfoNode, "BankIDType", vendor.recbankprimidtype);

				if (!isEmpty(vendor.bankid))
					//(pmtMethod == 'IAC' || pmtMethod == 'IWI' || pmtMethod == 'MTS') &&
					setAttributeValue(rbankInfoNode, "BranchID", vendor.bankid);

				var rpostAddrNode = "";
				if (
					!isEmpty(vendor.vbankaddrs1) ||
					!isEmpty(vendor.vbankstate) ||
					!isEmpty(vendor.vbankcity) ||
					!isEmpty(vendor.vbankzip) ||
					!isEmpty(vendor.vbankcountry)
				) {
					rpostAddrNode = addNodeFromParentNode(xmlDoc, rbankInfoNode, "PostAddr");
				}

				if (!isEmpty(vendor.vbankaddrs1)) addTextNodeFromParentNode(xmlDoc, rpostAddrNode, "Addr1", vendor.vbankaddrs1);
				if (!isEmpty(vendor.vbankstate)) addTextNodeFromParentNode(xmlDoc, rpostAddrNode, "StateProv", vendor.vbankstate);

				if (!isEmpty(vendor.vbankcity)) addTextNodeFromParentNode(xmlDoc, rpostAddrNode, "City", vendor.vbankcity);

				if (!isEmpty(vendor.vbankzip)) addTextNodeFromParentNode(xmlDoc, rpostAddrNode, "PostalCode", vendor.vbankzip);

				if (!isEmpty(vendor.vbankcountry)) addTextNodeFromParentNode(xmlDoc, rpostAddrNode, "Country", countryCodeMapping[vendor.vbankcountry]);

				if (!isEmpty(vendor.recbankprimid)) addTextNodeFromParentNode(xmlDoc, rbankInfoNode, "BankID", vendor.recbankprimid);
				// END: RcvrDepAcctID

				// START: PmtDetail
				var pmtDetailsNode = addNodeFromParentNode(xmlDoc, pmtRecNode, "PmtDetail");
				var pmtInvoiceInfoNode = addNodeFromParentNode(xmlDoc, pmtDetailsNode, "InvoiceInfo");

				if (!isEmpty(vendorPaymentInfo)) {
					setAttributeValue(pmtInvoiceInfoNode, "InvoiceType", vendorPaymentInfo.custrecord_invoicetype);
				} else {
					setAttributeValue(pmtInvoiceInfoNode, "InvoiceType", "");
				}

				setAttributeValue(pmtInvoiceInfoNode, "InvoiceNum", bill.billnum);
				setAttributeValue(pmtInvoiceInfoNode, "TotalCurAmt", Number(bill.origamt).toFixed(2));
				setAttributeValue(pmtInvoiceInfoNode, "NetCurAmt", Number(bill.payamt).toFixed(2));

				if (!isEmpty(billdata.memo)) {
					var pmtdNoteNodeCR = addNodeFromParentNode(xmlDoc, pmtInvoiceInfoNode, "Note");
					setAttributeValue(pmtdNoteNodeCR, "NoteType", "INV");
					addTextNodeFromParentNode(xmlDoc, pmtdNoteNodeCR, "NoteText", billdata.memo);
				}

				setAttributeValue(pmtInvoiceInfoNode, "DiscountCurAmt", Number(bill.discamt || 0).toFixed(2));

				// Add PO Num -- CLEAN
				if (!isEmpty(arrBillPO[bill.id])) {
					var poInfoNode = addNodeFromParentNode(xmlDoc, pmtInvoiceInfoNode, "POInfo");
					setAttributeValue(poInfoNode, "POType", "PO");
					addTextNodeFromParentNode(xmlDoc, poInfoNode, "PONum", arrBillPO[bill.id]);
				}
				//check if there are bill credit/s associated to bill. append if so.
				if (!isEmpty(billcredits)) {
					for (bc in billcredits) {
						var pmtInvoiceInfoNodeCR = addNodeFromParentNode(xmlDoc, pmtDetailsNode, "InvoiceInfo");
						setAttributeValue(pmtInvoiceInfoNodeCR, "InvoiceType", "CM");
						setAttributeValue(pmtInvoiceInfoNodeCR, "InvoiceNum", billcredits[bc].bcnum);

						var billCreditAmtP = getFloatVal(billcredits[bc].bcamt);
						var billCreditAmt = billCreditAmtP * -1;

						setAttributeValue(pmtInvoiceInfoNodeCR, "EffDt", formatDate(nlapiStringToDate(billcredits[bc].bcdate)));
						setAttributeValue(pmtInvoiceInfoNodeCR, "NetCurAmt", billCreditAmt.toFixed(2));
						setAttributeValue(pmtInvoiceInfoNodeCR, "TotalCurAmt", billCreditAmt.toFixed(2));

						if (!isEmpty(billcredits[bc].bcmemo)) {
							var pmtdNoteNodeCRBC = addNodeFromParentNode(xmlDoc, pmtInvoiceInfoNodeCR, "Note");
							setAttributeValue(pmtdNoteNodeCRBC, "NoteType", "INV");
							addTextNodeFromParentNode(
								xmlDoc,
								pmtdNoteNodeCRBC,
								"NoteText",
								isEmpty(billcredits[bc].bcmemo) ? "" : setValue(billcredits[bc].bcmemo)
							);
						}
					}
				}

				// END: PmtDetail

				// START: DocDelivery
				var docDeliveryNode = addNodeFromParentNode(xmlDoc, pmtRecNode, "DocDelivery");

				if (!isEmpty(vendor.custentity_pmp_biller_id)) {
					addTextNodeFromParentNode(xmlDoc, docDeliveryNode, "EDDBillerID", vendor.custentity_pmp_biller_id);
				} else if (!isEmpty(accountData) && !isEmpty(accountData.getValue("custrecord_acct_map_pmp_biller_id"))) {
					addTextNodeFromParentNode(xmlDoc, docDeliveryNode, "EDDBillerID", accountData.getValue("custrecord_acct_map_pmp_biller_id"));
				}

				var fileOutNode = addNodeFromParentNode(xmlDoc, docDeliveryNode, "FileOut");

				if (!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_dac_pmp_file_type))
					addTextNodeFromParentNode(xmlDoc, fileOutNode, "FileType", vendorPaymentInfo.custrecord_dac_pmp_file_type);

				if (!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_dac_pmp_file_format))
					addTextNodeFromParentNode(xmlDoc, fileOutNode, "FileFormat", vendorPaymentInfo.custrecord_dac_pmp_file_format);

				var deliveryNode = addNodeFromParentNode(xmlDoc, fileOutNode, "Delivery");

				if (!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_dac_pmp_delivery_type))
					addTextNodeFromParentNode(xmlDoc, deliveryNode, "DeliveryType", vendorPaymentInfo.custrecord_dac_pmp_delivery_type);

				if (!isEmpty(vendor.pmp_dac_contactname))
					addTextNodeFromParentNode(xmlDoc, deliveryNode, "DeliveryContactName", vendor.pmp_dac_contactname);

				if (!isEmpty(vendor.pmp_dac_emailaddress))
					addTextNodeFromParentNode(xmlDoc, deliveryNode, "DeliveryEmailAddress", vendor.pmp_dac_emailaddress);

				// END: DocDelivery

				addTextNodeFromParentNode(xmlDoc, pmtRecNode, "CurAmt", Number(bill.payamt).toFixed(2)); //confirm with Al.
			},
			ACH: function () {
				setAttributeValue(pmtRecNode, "PmtCrDr", "C");
				setAttributeValue(pmtRecNode, "PmtMethod", pmtMethod);

				if (!isEmpty(vendor.custentity_paymentformat)) {
					setAttributeValue(pmtRecNode, "PmtFormat", vendor.custentity_paymentformat);
				}

				if (!isEmpty(vendor.custentity_interpayformat)) setAttributeValue(pmtRecNode, "PmtFormatIntl", vendor.custentity_interpayformat);

				if (!isEmpty(vendor.custentity_pmp_biller_id)) {
					setAttributeValue(pmtRecNode, "TranHandlingCode", "U");
				} else if (!isEmpty(accountData) && !isEmpty(accountData.getValue("custrecord_acct_map_pmp_biller_id"))) {
					setAttributeValue(pmtRecNode, "TranHandlingCode", "U");
				}

				addTextNodeFromParentNode(xmlDoc, pmtRecNode, "PmtID", bill.refnum);

				if (!isEmpty(bill.currid)) {
					var curCode = arrCurrencyMap[bill.currid];
					addTextNodeFromParentNode(xmlDoc, pmtRecNode, "CurCode", curCode);
				}

				addTextNodeFromParentNode(xmlDoc, pmtRecNode, "ValueDate", formatDate(nlapiStringToDate(BPM_DATE)));

				//START: Msg Node
				var msgNode = addNodeFromParentNode(xmlDoc, pmtRecNode, "Message");
				setAttributeValue(msgNode, "MsgType", vendorPaymentInfo[MSG_TYPE[pmtMethod]]);

				if (CHECK_MEMO == "T") {
					var msgTypeTxt = billpayment.memo; //
					// var msgTypeTxt = b2pMemo;
					addTextNodeFromParentNode(xmlDoc, msgNode, "MsgText", msgTypeTxt);
				} else {
					// var msgTypeTxt = bill.payeeid;
					// addTextNodeFromParentNode(xmlDoc, msgNode, 'MsgText', msgTypeTxt);
					dAudit("DEFAULT_MSG_VENDOR_ID", DEFAULT_MSG_VENDOR_ID);
					var msgTypeTxt = "";
					if (DEFAULT_MSG_VENDOR_ID == "T") {
						try {
							msgTypeTxt = vendor.custentity_ica_vendor_external_id;
						} catch (e) {
							dErr("DEFAULT_MSG_VENDOR_ID custom field not found. Doing nothing", DEFAULT_MSG_VENDOR_ID);
						}
						addTextNodeFromParentNode(xmlDoc, msgNode, "MsgText", msgTypeTxt);
					} else {
						msgTypeTxt = bill.payeeid;
						addTextNodeFromParentNode(xmlDoc, msgNode, "MsgText", msgTypeTxt);
					}
				}
				//END: Msg Node

				// START: Origin Party
				var orgnPartyNode = addNodeFromParentNode(xmlDoc, pmtRecNode, "OrgnrParty");

				if (!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_companyname)) {
					var orgpNameNode = addNodeFromParentNode(xmlDoc, orgnPartyNode, "Name");
					addTextNodeFromParentNode(xmlDoc, orgpNameNode, "Name1", vendorPaymentInfo.custrecord_companyname);
				}
				if (
					(!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_compadd1)) ||
					(!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_compadd2)) ||
					(!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_compcity)) ||
					(!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_compstateprov)) ||
					(!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_comppostcode))
				) {
					var postAddrNode = addNodeFromParentNode(xmlDoc, orgnPartyNode, "PostAddr");

					if (!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_compadd1))
						addTextNodeFromParentNode(xmlDoc, postAddrNode, "Addr1", vendorPaymentInfo.custrecord_compadd1);
					if (!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_compadd2))
						addTextNodeFromParentNode(xmlDoc, postAddrNode, "Addr2", vendorPaymentInfo.custrecord_compadd2);
					if (!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_compcity))
						addTextNodeFromParentNode(xmlDoc, postAddrNode, "City", vendorPaymentInfo.custrecord_compcity);
					if (!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_compstateprov))
						addTextNodeFromParentNode(xmlDoc, postAddrNode, "StateProv", vendorPaymentInfo.custrecord_compstateprov);
					if (!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_comppostcode))
						addTextNodeFromParentNode(xmlDoc, postAddrNode, "PostalCode", vendorPaymentInfo.custrecord_comppostcode);

					var country = !isEmpty(vendorPaymentInfo) ? vendorPaymentInfo.custrecord_compcountrycode : "";
					if (!isEmpty(country)) addTextNodeFromParentNode(xmlDoc, postAddrNode, "Country", country);

					var countryName = !isEmpty(vendorPaymentInfo) ? vendorPaymentInfo.custrecord_compcountrynames : "";
					if (!isEmpty(countryName)) addTextNodeFromParentNode(xmlDoc, postAddrNode, "CountryName", countryName);
				}
				// END: Origin Party

				// START: OrgnrDepAcctID
				var orgnDepAcctIDNode = addNodeFromParentNode(xmlDoc, pmtRecNode, "OrgnrDepAcctID");
				var odepacctIdNode = addNodeFromParentNode(xmlDoc, orgnDepAcctIDNode, "DepAcctID");

				if (!isEmpty(accountData) && !isEmpty(accountData.getText("custrecord_acct_map_ext_bank_account_typ")))
					setAttributeValue(odepacctIdNode, "AcctType", accountData.getText("custrecord_acct_map_ext_bank_account_typ"));

				if (!isEmpty(accountData) && !isEmpty(accountData.getValue("custrecord_acct_map_ext_bank_origin_acc")))
					setAttributeValue(odepacctIdNode, "AcctID", accountData.getValue("custrecord_acct_map_ext_bank_origin_acc"));

				if (!isEmpty(accountData) && !isEmpty(accountData.getValue("custrecord_acct_map_account_currency")))
					setAttributeValue(odepacctIdNode, "AcctCur", arrCurrencyMap[accountData.getValue("custrecord_acct_map_account_currency")]);

				var bankInfoNode = addNodeFromParentNode(xmlDoc, odepacctIdNode, "BankInfo");
				if (!isEmpty(vendorPaymentInfo)) setAttributeValue(bankInfoNode, "Name", vendorPaymentInfo.custrecord_bankname);

				if (!isEmpty(accountData) && !isEmpty(accountData.getText("custrecord_acct_map_ext_bank_id_type")))
					setAttributeValue(bankInfoNode, "BankIDType", accountData.getText("custrecord_acct_map_ext_bank_id_type"));

				if (!isEmpty(accountData) && !isEmpty(accountData.getValue("custrecord_acct_map_ext_bank_ori_bank_id")))
					addTextNodeFromParentNode(xmlDoc, bankInfoNode, "BankID", accountData.getValue("custrecord_acct_map_ext_bank_ori_bank_id"));

				var orgrefInfoNode = addNodeFromParentNode(xmlDoc, bankInfoNode, "RefInfo");

				if (!isEmpty(vendorPaymentInfo)) setAttributeValue(orgrefInfoNode, "RefType", vendorPaymentInfo[MSG_TYPE[pmtMethod]]);

				if (!isEmpty(accountData) && !isEmpty(accountData.getValue("custrecord_acct_map_dom_ach_co_id"))) {
					addTextNodeFromParentNode(xmlDoc, orgrefInfoNode, "RefID", accountData.getValue("custrecord_acct_map_dom_ach_co_id"));
				}

				// END: OrgnrDepAcctID

				// START: RcvrParty
				var rcvrPartyNode = addNodeFromParentNode(xmlDoc, pmtRecNode, "RcvrParty");

				if (!isEmpty(vendor.vendorname)) {
					var rcvrPartyNameNode = addNodeFromParentNode(xmlDoc, rcvrPartyNode, "Name");
					addTextNodeFromParentNode(xmlDoc, rcvrPartyNameNode, "Name1", vendor.vendorname);
				}

				// as per Al on 4th May 2016
				// On the VPM: Vendor Profile Tab: custentity_vendorreftype,
				// (XML: RefType = VN) please default this value to 'VN' in your
				// code, I don't want to use this field anymore.
				// var refType = (pmtMethod != 'CCR') ? objVendor.vreftype :
				// ccrRefType;
				setAttributeValue(refInfoNode, "RefType", "VN");

				// addTextNodeFromParentNode(xmlDoc, refInfoNode, 'RefID', bill.payeeid);
				var refIDTxt = "";
				if (DEFAULT_MSG_VENDOR_ID == "T") {
					try {
						refIDTxt = vendor.custentity_ica_vendor_external_id;
					} catch (e) {
						dErr("DEFAULT_MSG_VENDOR_ID custom field not found. Doing nothing", DEFAULT_MSG_VENDOR_ID);
					}
				} else {
					if (!isEmpty(bill.payeeid)) addTextNodeFromParentNode(xmlDoc, refInfoNode, "RefID", bill.payeeid);
				}
				if (!isEmpty(refIDTxt)) addTextNodeFromParentNode(xmlDoc, refInfoNode, "RefID", refIDTxt);

				var rPPostAddrNode = "";
				if (
					!isEmpty(vendor.vendoraddrs1) ||
					!isEmpty(vendor.vendoraddrs2) ||
					!isEmpty(vendor.vendorcity) ||
					!isEmpty(vendor.vendorstateprovince) ||
					(!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_comppostcode)) ||
					!isEmpty(vendor.vendorpostal) ||
					!isEmpty(vendor.vendorcountrycode)
				) {
					rPPostAddrNode = addNodeFromParentNode(xmlDoc, rcvrPartyNode, "PostAddr");
				}

				if (!isEmpty(vendor.vendoraddrs1)) addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, "Addr1", vendor.vendoraddrs1);
				if (!isEmpty(vendor.vendoraddrs2)) addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, "Addr2", vendor.vendoraddrs2);
				if (!isEmpty(vendor.vendorcity)) addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, "City", vendor.vendorcity);
				if (!isEmpty(vendor.vendorstateprovince)) addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, "StateProv", vendor.vendorstateprovince);
				if (!isEmpty(vendor.vendorpostal)) addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, "PostalCode", vendor.vendorpostal);
				if (!isEmpty(vendor.vendorcountrycode)) {
					addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, "Country", countryCodeMapping[vendor.vendorcountrycode]);
					addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, "CountryName", vendor.vendorcountrycode);
				}
				// END: RcvrParty

				// START: RcvrDepAcctID
				var rcvrDeptAcctID = addNodeFromParentNode(xmlDoc, pmtRecNode, "RcvrDepAcctID");
				var rdeptAcctIdNode = addNodeFromParentNode(xmlDoc, rcvrDeptAcctID, "DepAcctID");
				if (!isEmpty(vendor.recpartyaccount)) setAttributeValue(rdeptAcctIdNode, "AcctID", vendor.recpartyaccount);

				setAttributeValue(rdeptAcctIdNode, "AcctType", "D");

				if (!isEmpty(bill.currid)) {
					var curCode = arrCurrencyMap[bill.currid];
					setAttributeValue(rdeptAcctIdNode, "AcctCur", arrCurrencyMap[bill.currid]);
				}

				var rbankInfoNode = addNodeFromParentNode(xmlDoc, rdeptAcctIdNode, "BankInfo");
				if (!isEmpty(vendor.vbankname)) setAttributeValue(rbankInfoNode, "Name", vendor.vbankname);
				if (!isEmpty(vendor.recbankprimidtype)) setAttributeValue(rbankInfoNode, "BankIDType", vendor.recbankprimidtype);

				var rpostAddrNode = "";
				if (
					!isEmpty(vendor.vbankaddrs1) ||
					!isEmpty(vendor.vbankstate) ||
					!isEmpty(vendor.vbankcity) ||
					!isEmpty(vendor.vbankzip) ||
					!isEmpty(vendor.vbankcountry)
				) {
					rpostAddrNode = addNodeFromParentNode(xmlDoc, rbankInfoNode, "PostAddr");
				}

				if (!isEmpty(vendor.vbankaddrs1)) addTextNodeFromParentNode(xmlDoc, rpostAddrNode, "Addr1", vendor.vbankaddrs1);
				if (!isEmpty(vendor.vbankstate)) addTextNodeFromParentNode(xmlDoc, rpostAddrNode, "StateProv", vendor.vbankstate);

				if (!isEmpty(vendor.vbankcity)) addTextNodeFromParentNode(xmlDoc, rpostAddrNode, "City", vendor.vbankcity);

				if (!isEmpty(vendor.vbankzip)) addTextNodeFromParentNode(xmlDoc, rpostAddrNode, "PostalCode", vendor.vbankzip);

				if (!isEmpty(vendor.vbankcountry)) addTextNodeFromParentNode(xmlDoc, rpostAddrNode, "Country", countryCodeMapping[vendor.vbankcountry]);

				if (!isEmpty(vendor.recbankprimid)) addTextNodeFromParentNode(xmlDoc, rbankInfoNode, "BankID", vendor.recbankprimid);
				// END: RcvrDepAcctID

				// START: PmtDetail
				var pmtDetailsNode = addNodeFromParentNode(xmlDoc, pmtRecNode, "PmtDetail");
				var pmtInvoiceInfoNode = addNodeFromParentNode(xmlDoc, pmtDetailsNode, "InvoiceInfo");

				if (!isEmpty(vendorPaymentInfo)) {
					setAttributeValue(pmtInvoiceInfoNode, "InvoiceType", vendorPaymentInfo.custrecord_invoicetype);
				} else {
					setAttributeValue(pmtInvoiceInfoNode, "InvoiceType", "");
				}

				setAttributeValue(pmtInvoiceInfoNode, "InvoiceNum", bill.billnum);
				setAttributeValue(pmtInvoiceInfoNode, "TotalCurAmt", Number(bill.origamt).toFixed(2));
				setAttributeValue(pmtInvoiceInfoNode, "NetCurAmt", Number(bill.payamt).toFixed(2));

				if (!isEmpty(billdata.memo)) {
					var pmtdNoteNodeCR = addNodeFromParentNode(xmlDoc, pmtInvoiceInfoNode, "Note");
					setAttributeValue(pmtdNoteNodeCR, "NoteType", "INV");
					addTextNodeFromParentNode(xmlDoc, pmtdNoteNodeCR, "NoteText", billdata.memo);
				}

				setAttributeValue(pmtInvoiceInfoNode, "DiscountCurAmt", Number(bill.discamt || 0).toFixed(2));

				// Add PO Num -- CLEAN
				if (!isEmpty(arrBillPO[bill.id])) {
					var poInfoNode = addNodeFromParentNode(xmlDoc, pmtInvoiceInfoNode, "POInfo");
					setAttributeValue(poInfoNode, "POType", "PO");
					addTextNodeFromParentNode(xmlDoc, poInfoNode, "PONum", arrBillPO[bill.id]);
				}
				//check if there are bill credit/s associated to bill. append if so.
				if (!isEmpty(billcredits)) {
					for (bc in billcredits) {
						var pmtInvoiceInfoNodeCR = addNodeFromParentNode(xmlDoc, pmtDetailsNode, "InvoiceInfo");
						setAttributeValue(pmtInvoiceInfoNodeCR, "InvoiceType", "CM");
						setAttributeValue(pmtInvoiceInfoNodeCR, "InvoiceNum", billcredits[bc].bcnum);

						var billCreditAmtP = getFloatVal(billcredits[bc].bcamt);
						var billCreditAmt = billCreditAmtP * -1;

						setAttributeValue(pmtInvoiceInfoNodeCR, "EffDt", formatDate(nlapiStringToDate(billcredits[bc].bcdate)));
						setAttributeValue(pmtInvoiceInfoNodeCR, "NetCurAmt", billCreditAmt.toFixed(2));
						setAttributeValue(pmtInvoiceInfoNodeCR, "TotalCurAmt", billCreditAmt.toFixed(2));

						if (!isEmpty(billcredits[bc].bcmemo)) {
							var pmtdNoteNodeCRBC = addNodeFromParentNode(xmlDoc, pmtInvoiceInfoNodeCR, "Note");
							setAttributeValue(pmtdNoteNodeCRBC, "NoteType", "INV");
							addTextNodeFromParentNode(
								xmlDoc,
								pmtdNoteNodeCRBC,
								"NoteText",
								isEmpty(billcredits[bc].bcmemo) ? "" : setValue(billcredits[bc].bcmemo)
							);
						}
					}
				}

				// END: PmtDetail

				// START: DocDelivery
				var docDeliveryNode = addNodeFromParentNode(xmlDoc, pmtRecNode, "DocDelivery");

				if (!isEmpty(vendor.custentity_pmp_biller_id)) {
					addTextNodeFromParentNode(xmlDoc, docDeliveryNode, "EDDBillerID", vendor.custentity_pmp_biller_id);
				} else if (!isEmpty(accountData) && !isEmpty(accountData.getValue("custrecord_acct_map_pmp_biller_id"))) {
					addTextNodeFromParentNode(xmlDoc, docDeliveryNode, "EDDBillerID", accountData.getValue("custrecord_acct_map_pmp_biller_id"));
				}

				var fileOutNode = addNodeFromParentNode(xmlDoc, docDeliveryNode, "FileOut");

				if (!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_dac_pmp_file_type))
					addTextNodeFromParentNode(xmlDoc, fileOutNode, "FileType", vendorPaymentInfo.custrecord_dac_pmp_file_type);

				if (!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_dac_pmp_file_format))
					addTextNodeFromParentNode(xmlDoc, fileOutNode, "FileFormat", vendorPaymentInfo.custrecord_dac_pmp_file_format);

				var deliveryNode = addNodeFromParentNode(xmlDoc, fileOutNode, "Delivery");

				if (!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_dac_pmp_delivery_type))
					addTextNodeFromParentNode(xmlDoc, deliveryNode, "DeliveryType", vendorPaymentInfo.custrecord_dac_pmp_delivery_type);

				if (!isEmpty(vendor.pmp_dac_contactname))
					addTextNodeFromParentNode(xmlDoc, deliveryNode, "DeliveryContactName", vendor.pmp_dac_contactname);

				if (!isEmpty(vendor.pmp_dac_emailaddress))
					addTextNodeFromParentNode(xmlDoc, deliveryNode, "DeliveryEmailAddress", vendor.pmp_dac_emailaddress);

				// END: DocDelivery

				addTextNodeFromParentNode(xmlDoc, pmtRecNode, "CurAmt", Number(bill.payamt).toFixed(2)); //confirm with Al.
			},
			CCR: function () {
				setAttributeValue(pmtRecNode, "PmtCrDr", "C");
				setAttributeValue(pmtRecNode, "PmtMethod", pmtMethod);

				if (!isEmpty(vendor.custentity_paymentformat)) {
					setAttributeValue(pmtRecNode, "PmtFormat", vendor.custentity_paymentformat);
				}

				if (!isEmpty(vendor.custentity_interpayformat)) setAttributeValue(pmtRecNode, "PmtFormatIntl", vendor.custentity_interpayformat);

				if (!isEmpty(vendor.custentity_pmp_biller_id)) {
					setAttributeValue(pmtRecNode, "TranHandlingCode", "U");
				} else if (!isEmpty(accountData) && !isEmpty(accountData.getValue("custrecord_acct_map_pmp_biller_id"))) {
					setAttributeValue(pmtRecNode, "TranHandlingCode", "U");
				}

				//if (pmtMethod == 'CCR') {

				// START: IDInfo - Batch
				var idInfoNodeBatch = addNodeFromParentNode(xmlDoc, pmtRecNode, "IDInfo");
				setAttributeValue(idInfoNodeBatch, "IDType", "BatchID");
				var batchId = Date.create().format("{yy}{hh}{mm}{ss}");
				addTextNodeFromParentNode(xmlDoc, idInfoNodeBatch, "ID", pad(batchId, 10));
				// END: IDInfo - Batch

				// START: IDInfo - Customer ID
				var idInfoNodeBatch = addNodeFromParentNode(xmlDoc, pmtRecNode, "IDInfo");
				setAttributeValue(idInfoNodeBatch, "IDType", "CustomerID");

				if (!isEmpty(accountData) && !isEmpty(accountData.getValue("custrecord_acct_map_ceo_company_id")))
					addTextNodeFromParentNode(xmlDoc, idInfoNodeBatch, "ID", accountData.getValue("custrecord_acct_map_ceo_company_id"));

				// END: IDInfo - Customer ID
				//}

				addTextNodeFromParentNode(xmlDoc, pmtRecNode, "PmtID", bill.refnum);

				if (!isEmpty(bill.currid)) {
					var curCode = arrCurrencyMap[bill.currid];
					addTextNodeFromParentNode(xmlDoc, pmtRecNode, "CurCode", curCode);
				}

				addTextNodeFromParentNode(xmlDoc, pmtRecNode, "ValueDate", formatDate(nlapiStringToDate(BPM_DATE)));

				//START: Msg Node
				var msgNode = addNodeFromParentNode(xmlDoc, pmtRecNode, "Message");
				setAttributeValue(msgNode, "MsgType", vendorPaymentInfo[MSG_TYPE[pmtMethod]]);

				if (CHECK_MEMO == "T") {
					var msgTypeTxt = billpayment.memo; //
					addTextNodeFromParentNode(xmlDoc, msgNode, "MsgText", msgTypeTxt);
				} else {
					// var msgTypeTxt = bill.payeeid;
					// addTextNodeFromParentNode(xmlDoc, msgNode, 'MsgText', msgTypeTxt);
					dAudit("DEFAULT_MSG_VENDOR_ID", DEFAULT_MSG_VENDOR_ID);
					var msgTypeTxt = "";
					if (DEFAULT_MSG_VENDOR_ID == "T") {
						try {
							msgTypeTxt = vendor[String(DEFAULT_MSG_VENDOR_ID)];
						} catch (e) {
							dErr("DEFAULT_MSG_VENDOR_ID custom field not found. Doing nothing", DEFAULT_MSG_VENDOR_ID);
						}

						addTextNodeFromParentNode(xmlDoc, msgNode, "MsgText", msgTypeTxt);
					} else {
						msgTypeTxt = bill.payeeid;
						addTextNodeFromParentNode(xmlDoc, msgNode, "MsgText", msgTypeTxt);
					}
				}
				//END: Msg Node

				// START: Origin Party -- CCR
				var orgnPartyNode = addNodeFromParentNode(xmlDoc, pmtRecNode, "OrgnrParty");

				var orgpContactInfoNode = "";
				if (
					(!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_ccr_contact)) ||
					(!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_ccr_phonetype)) ||
					(!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_ccr_phonenum))
				) {
					orgpContactInfoNode = addNodeFromParentNode(xmlDoc, orgnPartyNode, "ContactInfo");
				}

				if (!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_ccr_contact))
					setAttributeValue(orgpContactInfoNode, "Name", vendorPaymentInfo.custrecord_ccr_contact);

				if (
					(!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_ccr_phonetype)) ||
					(!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_ccr_phonenum))
				) {
					var orgpPhoneNumNode = addNodeFromParentNode(xmlDoc, orgpContactInfoNode, "PhoneNum");

					if (!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_ccr_phonetype))
						setAttributeValue(orgpPhoneNumNode, "PhoneType", vendorPaymentInfo.custrecord_ccr_phonetype);

					if (!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_ccr_phonenum))
						setAttributeValue(orgpPhoneNumNode, "Phone", vendorPaymentInfo.custrecord_ccr_phonenum);
				}

				// END: Origin Party

				// START: OrgnrDepAcctID
				var orgnDepAcctIDNode = addNodeFromParentNode(xmlDoc, pmtRecNode, "OrgnrDepAcctID");
				var odepacctIdNode = addNodeFromParentNode(xmlDoc, orgnDepAcctIDNode, "DepAcctID");

				if (!isEmpty(accountData) && !isEmpty(accountData.getText("custrecord_acct_map_ext_bank_account_typ")))
					setAttributeValue(odepacctIdNode, "AcctType", accountData.getText("custrecord_acct_map_ext_bank_account_typ"));

				if (!isEmpty(accountData) && !isEmpty(accountData.getValue("custrecord_acct_map_credit_card_man")))
					setAttributeValue(odepacctIdNode, "AcctID", accountData.getValue("custrecord_acct_map_credit_card_man"));

				if (!isEmpty(accountData) && !isEmpty(accountData.getValue("custrecord_acct_map_account_currency")))
					setAttributeValue(odepacctIdNode, "AcctCur", arrCurrencyMap[accountData.getValue("custrecord_acct_map_account_currency")]);

				var bankInfoNode = addNodeFromParentNode(xmlDoc, odepacctIdNode, "BankInfo");
				if (!isEmpty(vendorPaymentInfo)) setAttributeValue(bankInfoNode, "Name", vendorPaymentInfo.custrecord_bankname);

				if (!isEmpty(accountData) && !isEmpty(accountData.getText("custrecord_acct_map_ext_bank_id_type")))
					setAttributeValue(bankInfoNode, "BankIDType", accountData.getText("custrecord_acct_map_ext_bank_id_type"));

				if (!isEmpty(accountData) && !isEmpty(accountData.getValue("custrecord_acct_map_ext_bank_ori_bank_id")))
					addTextNodeFromParentNode(xmlDoc, bankInfoNode, "BankID", accountData.getValue("custrecord_acct_map_ext_bank_ori_bank_id"));

				var orgrefInfoNode = addNodeFromParentNode(xmlDoc, bankInfoNode, "RefInfo");

				if (!isEmpty(vendorPaymentInfo)) setAttributeValue(orgrefInfoNode, "RefType", vendorPaymentInfo[MSG_TYPE[pmtMethod]]);

				// END: OrgnrDepAcctID

				// START: RcvrParty
				var rcvrPartyNode = addNodeFromParentNode(xmlDoc, pmtRecNode, "RcvrParty");

				if (!isEmpty(vendor.vendorname)) {
					var rcvrPartyNameNode = addNodeFromParentNode(xmlDoc, rcvrPartyNode, "Name");
					addTextNodeFromParentNode(xmlDoc, rcvrPartyNameNode, "Name1", vendor.vendorname);
				}

				var refInfoNode = addNodeFromParentNode(xmlDoc, rcvrPartyNode, "RefInfo");
				setAttributeValue(refInfoNode, "RefType", "VN");

				// addTextNodeFromParentNode(xmlDoc, refInfoNode, 'RefID', bill.payeeid);
				var refIDTxt = "";
				if (DEFAULT_MSG_VENDOR_ID == "T") {
					try {
						refIDTxt = vendor.custentity_ica_vendor_external_id;
					} catch (e) {
						dErr("DEFAULT_MSG_VENDOR_ID custom field not found. Doing nothing", DEFAULT_MSG_VENDOR_ID);
					}
				} else {
					if (!isEmpty(bill.payeeid)) addTextNodeFromParentNode(xmlDoc, refInfoNode, "RefID", bill.payeeid);
				}
				if (!isEmpty(refIDTxt)) addTextNodeFromParentNode(xmlDoc, refInfoNode, "RefID", refIDTxt);

				var rPPostAddrNode = "";
				if (
					!isEmpty(vendor.vendoraddrs1) ||
					!isEmpty(vendor.vendoraddrs2) ||
					!isEmpty(vendor.vendorcity) ||
					!isEmpty(vendor.vendorstateprovince) ||
					(!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_comppostcode)) ||
					!isEmpty(vendor.vendorpostal) ||
					!isEmpty(vendor.vendorcountrycode)
				) {
					rPPostAddrNode = addNodeFromParentNode(xmlDoc, rcvrPartyNode, "PostAddr");
				}

				if (!isEmpty(vendor.vendoraddrs1)) addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, "Addr1", vendor.vendoraddrs1);
				if (!isEmpty(vendor.vendoraddrs2)) addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, "Addr2", vendor.vendoraddrs2);
				if (!isEmpty(vendor.vendorcity)) addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, "City", vendor.vendorcity);
				if (!isEmpty(vendor.vendorstateprovince)) addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, "StateProv", vendor.vendorstateprovince);

				if (!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_comppostcode))
					addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, "PostalCode", vendorPaymentInfo.custrecord_comppostcode);

				var contactInfoNode = addNodeFromParentNode(xmlDoc, rcvrPartyNode, "ContactInfo");

				if (!isEmpty(vendor) && !isEmpty(vendor.vemailadrs)) addTextNodeFromParentNode(xmlDoc, contactInfoNode, "EmailAddr", vendor.vemailadrs);

				if (!isEmpty(vendor.vendorcountrycode)) {
					addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, "Country", countryCodeMapping[vendor.vendorcountrycode]);
					addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, "CountryName", vendor.vendorcountrycode);
				}
				// END: RcvrParty

				// if (pmtMethod == 'CCR') {
				// dLog('creatXMLDoc', 'Start: PmtSuppCCR');
				// START: PmtSuppCCR

				var pmtSuppCCRNode = addNodeFromParentNode(xmlDoc, pmtRecNode, "PmtSuppCCR");

				// if (!isEmpty(vendor.merchantid))
				//     addTextNodeFromParentNode(xmlDoc, pmtSuppCCRNode, 'MerchantID', vendor.merchantid);

				var merchantIDTxt = "";
				if (DEFAULT_MSG_VENDOR_ID == "T") {
					try {
						merchantIDTxt = vendor.custentity_ica_vendor_external_id;
					} catch (e) {
						dErr("DEFAULT_MSG_VENDOR_ID custom field not found. Doing nothing", DEFAULT_MSG_VENDOR_ID);
					}
				} else {
					if (!isEmpty(vendor.merchantid)) addTextNodeFromParentNode(xmlDoc, pmtSuppCCRNode, "MerchantID", vendor.merchantid);
				}
				if (!isEmpty(merchantIDTxt)) addTextNodeFromParentNode(xmlDoc, pmtSuppCCRNode, "MerchantID", merchantIDTxt);

				if (!isEmpty(accountData) && !isEmpty(accountData.getValue("custrecord_acct_map_credit_card_div_num")))
					addTextNodeFromParentNode(xmlDoc, pmtSuppCCRNode, "Division", accountData.getValue("custrecord_acct_map_credit_card_div_num"));

				// END: PmtSuppCCR
				// dLog('creatXMLDoc', 'End: PmtSuppCCR');
				// }

				// START: RcvrDepAcctID
				var rcvrDeptAcctID = addNodeFromParentNode(xmlDoc, pmtRecNode, "RcvrDepAcctID");
				var rdeptAcctIdNode = addNodeFromParentNode(xmlDoc, rcvrDeptAcctID, "DepAcctID");
				if (!isEmpty(vendor.recpartyaccount)) setAttributeValue(rdeptAcctIdNode, "AcctID", vendor.recpartyaccount);

				setAttributeValue(rdeptAcctIdNode, "AcctType", "D");

				if (!isEmpty(bill.currid)) {
					var curCode = arrCurrencyMap[bill.currid];
					setAttributeValue(rdeptAcctIdNode, "AcctCur", arrCurrencyMap[bill.currid]);
				}

				var rbankInfoNode = addNodeFromParentNode(xmlDoc, rdeptAcctIdNode, "BankInfo");
				if (!isEmpty(vendor.vbankname)) setAttributeValue(rbankInfoNode, "Name", vendor.vbankname);
				if (!isEmpty(vendor.recbankprimidtype)) setAttributeValue(rbankInfoNode, "BankIDType", vendor.recbankprimidtype);

				var rpostAddrNode = "";
				if (
					!isEmpty(vendor.vbankaddrs1) ||
					!isEmpty(vendor.vbankstate) ||
					!isEmpty(vendor.vbankcity) ||
					!isEmpty(vendor.vbankzip) ||
					!isEmpty(vendor.vbankcountry)
				) {
					rpostAddrNode = addNodeFromParentNode(xmlDoc, rbankInfoNode, "PostAddr");
				}

				if (!isEmpty(vendor.vbankaddrs1)) addTextNodeFromParentNode(xmlDoc, rpostAddrNode, "Addr1", vendor.vbankaddrs1);
				if (!isEmpty(vendor.vbankstate)) addTextNodeFromParentNode(xmlDoc, rpostAddrNode, "StateProv", vendor.vbankstate);

				if (!isEmpty(vendor.vbankcity)) addTextNodeFromParentNode(xmlDoc, rpostAddrNode, "City", vendor.vbankcity);

				if (!isEmpty(vendor.vbankzip)) addTextNodeFromParentNode(xmlDoc, rpostAddrNode, "PostalCode", vendor.vbankzip);

				if (!isEmpty(vendor.vbankcountry)) addTextNodeFromParentNode(xmlDoc, rpostAddrNode, "Country", countryCodeMapping[vendor.vbankcountry]);

				if (!isEmpty(vendor.recbankprimid)) addTextNodeFromParentNode(xmlDoc, rbankInfoNode, "BankID", vendor.recbankprimid);
				// END: RcvrDepAcctID

				// START: PmtDetail
				var pmtDetailsNode = addNodeFromParentNode(xmlDoc, pmtRecNode, "PmtDetail");
				var pmtInvoiceInfoNode = addNodeFromParentNode(xmlDoc, pmtDetailsNode, "InvoiceInfo");

				if (!isEmpty(vendorPaymentInfo)) {
					setAttributeValue(pmtInvoiceInfoNode, "InvoiceType", vendorPaymentInfo.custrecord_invoicetype);
				} else {
					setAttributeValue(pmtInvoiceInfoNode, "InvoiceType", "");
				}

				setAttributeValue(pmtInvoiceInfoNode, "InvoiceNum", bill.billnum);
				setAttributeValue(pmtInvoiceInfoNode, "TotalCurAmt", Number(bill.origamt).toFixed(2));
				setAttributeValue(pmtInvoiceInfoNode, "NetCurAmt", Number(bill.payamt).toFixed(2));

				if (!isEmpty(billdata.memo)) {
					var pmtdNoteNodeCR = addNodeFromParentNode(xmlDoc, pmtInvoiceInfoNode, "Note");
					setAttributeValue(pmtdNoteNodeCR, "NoteType", "INV");
					addTextNodeFromParentNode(xmlDoc, pmtdNoteNodeCR, "NoteText", billdata.memo);
				}

				setAttributeValue(pmtInvoiceInfoNode, "DiscountCurAmt", Number(bill.discamt || 0).toFixed(2));
				setAttributeValue(pmtInvoiceInfoNode, "EffDt", formatDate(nlapiStringToDate(billdata.trandate)));

				// Add PO Num -- CLEAN
				if (!isEmpty(arrBillPO[bill.id])) {
					var poInfoNode = addNodeFromParentNode(xmlDoc, pmtInvoiceInfoNode, "POInfo");
					setAttributeValue(poInfoNode, "POType", "PO");
					addTextNodeFromParentNode(xmlDoc, poInfoNode, "PONum", arrBillPO[bill.id]);
				}
				//check if there are bill credit/s associated to bill. append if so.
				if (!isEmpty(billcredits)) {
					for (bc in billcredits) {
						var pmtInvoiceInfoNodeCR = addNodeFromParentNode(xmlDoc, pmtDetailsNode, "InvoiceInfo");
						setAttributeValue(pmtInvoiceInfoNodeCR, "InvoiceType", "CM");
						setAttributeValue(pmtInvoiceInfoNodeCR, "InvoiceNum", billcredits[bc].bcnum);

						var billCreditAmtP = getFloatVal(billcredits[bc].bcamt);
						var billCreditAmt = billCreditAmtP * -1;

						setAttributeValue(pmtInvoiceInfoNodeCR, "EffDt", formatDate(nlapiStringToDate(billcredits[bc].bcdate)));
						setAttributeValue(pmtInvoiceInfoNodeCR, "NetCurAmt", billCreditAmt.toFixed(2));
						setAttributeValue(pmtInvoiceInfoNodeCR, "TotalCurAmt", billCreditAmt.toFixed(2));

						if (!isEmpty(billcredits[bc].bcmemo)) {
							var pmtdNoteNodeCRBC = addNodeFromParentNode(xmlDoc, pmtInvoiceInfoNodeCR, "Note");
							setAttributeValue(pmtdNoteNodeCRBC, "NoteType", "INV");
							addTextNodeFromParentNode(
								xmlDoc,
								pmtdNoteNodeCRBC,
								"NoteText",
								isEmpty(billcredits[bc].bcmemo) ? "" : setValue(billcredits[bc].bcmemo)
							);
						}
					}
				}

				// END: PmtDetail

				addTextNodeFromParentNode(xmlDoc, pmtRecNode, "CurAmt", Number(bill.payamt).toFixed(2)); //confirm with Al.
			},
			B2P: function () {
				setAttributeValue(pmtRecNode, "PmtCrDr", "C");
				setAttributeValue(pmtRecNode, "PmtMethod", pmtMethod);

				// addTextNodeFromParentNode(xmlDoc, pmtRecNode, 'PmtID', bill.refnum);

				if (!isEmpty(bill.currid)) {
					var curCode = arrCurrencyMap[bill.currid];
					addTextNodeFromParentNode(xmlDoc, pmtRecNode, "CurCode", curCode);
				}

				// addTextNodeFromParentNode(xmlDoc, pmtRecNode, 'ValueDate', formatDate(nlapiStringToDate(BPM_DATE)));

				// START: Origin Party
				var orgnPartyNode = addNodeFromParentNode(xmlDoc, pmtRecNode, "OrgnrParty");

				if (!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_companyname)) {
					var orgpNameNode = addNodeFromParentNode(xmlDoc, orgnPartyNode, "Name");
					addTextNodeFromParentNode(xmlDoc, orgpNameNode, "Name1", vendorPaymentInfo.custrecord_companyname);
				}

				// END: Origin Party

				// START: OrgnrDepAcctID
				// END: OrgnrDepAcctID

				// START: RcvrParty
				// END: RcvrParty

				// START: RcvrDepAcctID
				// END: RcvrDepAcctID

				// START: PmtDetail
				// END: PmtDetail

				// START: DocDelivery
				// END: DocDelivery

				//PmtID
				addTextNodeFromParentNode(xmlDoc, pmtRecNode, "PmtID", bill.refnum);

				//CurAmt
				// addTextNodeFromParentNode(xmlDoc, pmtRecNode, 'CurAmt', tmpAmt.toFixed(2));	//see below

				//CurCode
				// if (!isEmpty(bill.currid)) {
				// 	// var curCode = (pmtMethod == 'IAC' && !isEmpty(objAcctMapping)) ? objAcctMapping[0].getValue('symbol', 'CUSTRECORD_ACCT_MAP_ACCOUNT_CURRENCY') : arrCurrencyMap[bill.currid];
				//     var curCode = arrCurrencyMap[bill.currid];
				//     addTextNodeFromParentNode(xmlDoc, pmtRecNode, 'CurCode', curCode);
				// };

				//ValueDate
				addTextNodeFromParentNode(xmlDoc, pmtRecNode, "ValueDate", formatDate(nlapiStringToDate(BPM_DATE)));

				//ElectronicPmtInfo
				var ElecPmtNode = addNodeFromParentNode(xmlDoc, pmtRecNode, "ElectronicPmtInfo");
				if (!isEmpty(accountData) && !isEmpty(accountData.getValue("custrecord_acct_map_ext_bank_ori_bank_id")))
					addTextNodeFromParentNode(xmlDoc, ElecPmtNode, "EPBankID", accountData.getValue("custrecord_acct_map_ext_bank_ori_bank_id"));
				if (!isEmpty(accountData) && !isEmpty(accountData.getValue("custrecord_acct_map_ext_bank_origin_acc")))
					addTextNodeFromParentNode(xmlDoc, ElecPmtNode, "EPAcctID", accountData.getValue("custrecord_acct_map_ext_bank_origin_acc"));

				if (!isEmpty(vendor) && !isEmpty(vendor.pmp_dac_contactname))
					addTextNodeFromParentNode(xmlDoc, ElecPmtNode, "EPFirstName", vendor.pmp_dac_contactname);
				if (!isEmpty(vendor) && !isEmpty(vendor.pmp_dac_emailaddress))
					addTextNodeFromParentNode(xmlDoc, ElecPmtNode, "EPEmailToken", vendor.pmp_dac_emailaddress);

				if (!isEmpty(billdata)) {
					if (!isEmpty(billdata.memo)) {
						addTextNodeFromParentNode(xmlDoc, ElecPmtNode, "EPDesc", billdata.memo.substr(0, 200));
					}
				}

				addTextNodeFromParentNode(xmlDoc, pmtRecNode, "CurAmt", Number(bill.amtdue).toFixed(2)); //confirm with Al.
			},
			URG: function () {
				setAttributeValue(pmtRecNode, "PmtCrDr", "C");
				setAttributeValue(pmtRecNode, "PmtMethod", pmtMethod);

				if (!isEmpty(vendor.custentity_paymentformat)) {
					setAttributeValue(pmtRecNode, "PmtFormat", vendor.custentity_paymentformat);
				}

				if (!isEmpty(vendor.custentity_interpayformat)) setAttributeValue(pmtRecNode, "PmtFormatIntl", vendor.custentity_interpayformat);

				// if (!isEmpty(vendor.custentity_pmp_biller_id)) {
				// 	setAttributeValue(pmtRecNode, "TranHandlingCode", "U");
				// } else if (!isEmpty(accountData) && !isEmpty(accountData.getValue("custrecord_acct_map_pmp_biller_id"))) {
				// 	setAttributeValue(pmtRecNode, "TranHandlingCode", "U");
				// }

				addTextNodeFromParentNode(xmlDoc, pmtRecNode, "PmtID", bill.refnum);
				if (!isEmpty(bill.currid)) {
					var curCode = arrCurrencyMap[bill.currid];
					addTextNodeFromParentNode(xmlDoc, pmtRecNode, "CurCode", curCode);
				}
				addTextNodeFromParentNode(xmlDoc, pmtRecNode, "ValueDate", formatDate(nlapiStringToDate(BPM_DATE)));

				if (!isEmpty(vendor.fx_reftype) || !isEmpty(vendor.fx_refid)) {
					var iacRefInfo = addNodeFromParentNode(xmlDoc, pmtRecNode, "RefInfo");
					if (!isEmpty(vendor.fx_reftype)) setAttributeValue(iacRefInfo, "RefType", vendor.fx_reftype);
					if (!isEmpty(vendor.fx_refid)) addTextNodeFromParentNode(xmlDoc, iacRefInfo, "RefID", vendor.fx_refid);
				}

				var msgNode = addNodeFromParentNode(xmlDoc, pmtRecNode, "Message");
				setAttributeValue(msgNode, "MsgType", "OBI");

				if (CHECK_MEMO == "T") {
					var msgTypeTxt = billpayment.memo;
					addTextNodeFromParentNode(xmlDoc, msgNode, "MsgText", msgTypeTxt);
				} else {
					dAudit("DEFAULT_MSG_VENDOR_ID", DEFAULT_MSG_VENDOR_ID);
					var msgTypeTxt = "";
					if (DEFAULT_MSG_VENDOR_ID == "T") {
						try {
							msgTypeTxt = vendor.custentity_ica_vendor_external_id;
						} catch (e) {
							dErr("DEFAULT_MSG_VENDOR_ID custom field not found. Doing nothing", DEFAULT_MSG_VENDOR_ID);
						}
						addTextNodeFromParentNode(xmlDoc, msgNode, "MsgText", msgTypeTxt);
					} else {
						msgTypeTxt = bill.payeeid;
						addTextNodeFromParentNode(xmlDoc, msgNode, "MsgText", msgTypeTxt);
					}
				}

				//Clean
				var msgTxt = "";
				var bMemo = vendor.custentity_ica_vendor_bank_instructions; //arrPayeeInterBillsMemo[bill.payeeid];

				if (!isEmpty(bMemo)) msgTxt += isEmpty(msgTxt) ? bMemo : " " + bMemo;

				dLog("creatXMLDoc", "Msg text = " + msgTxt);

				if (!isEmpty(msgTxt)) {
					var msgNode = addNodeFromParentNode(xmlDoc, pmtRecNode, "Message");
					setAttributeValue(msgNode, "MsgType", VENDOR_ORIG_MSG_TYPE);
					addTextNodeFromParentNode(xmlDoc, msgNode, "MsgText", msgTxt);
				}

				// START: Origin Party
				var orgnPartyNode = addNodeFromParentNode(xmlDoc, pmtRecNode, "OrgnrParty");

				if (!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_companyname)) {
					var orgpNameNode = addNodeFromParentNode(xmlDoc, orgnPartyNode, "Name");
					addTextNodeFromParentNode(xmlDoc, orgpNameNode, "Name1", vendorPaymentInfo.custrecord_companyname);
				}
                                if (!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_compaddname)) {
                                        addTextNodeFromParentNode(xmlDoc, orgpNameNode, 'Name2', vendorPaymentInfo.custrecord_compaddname);
                                }
                                
				if (
					(!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_compadd1)) ||
					(!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_compadd2)) ||
					(!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_compcity)) ||
					(!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_compstateprov)) ||
					(!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_comppostcode))
				) {
					var postAddrNode = addNodeFromParentNode(xmlDoc, orgnPartyNode, "PostAddr");

					if (!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_compadd1))
						addTextNodeFromParentNode(xmlDoc, postAddrNode, "Addr1", vendorPaymentInfo.custrecord_compadd1);
					if (!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_compadd2))
						addTextNodeFromParentNode(xmlDoc, postAddrNode, "Addr2", vendorPaymentInfo.custrecord_compadd2);
					if (!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_compcity))
						addTextNodeFromParentNode(xmlDoc, postAddrNode, "City", vendorPaymentInfo.custrecord_compcity);
					if (!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_compstateprov))
						addTextNodeFromParentNode(xmlDoc, postAddrNode, "StateProv", vendorPaymentInfo.custrecord_compstateprov);
					if (!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_comppostcode))
						addTextNodeFromParentNode(xmlDoc, postAddrNode, "PostalCode", vendorPaymentInfo.custrecord_comppostcode);

					var country = !isEmpty(vendorPaymentInfo) ? vendorPaymentInfo.custrecord_compcountrycode : "";
					if (!isEmpty(country)) addTextNodeFromParentNode(xmlDoc, postAddrNode, "Country", country);

					var countryName = !isEmpty(vendorPaymentInfo) ? vendorPaymentInfo.custrecord_compcountrynames : "";
					if (!isEmpty(countryName)) addTextNodeFromParentNode(xmlDoc, postAddrNode, "CountryName", countryName);
				}
				// END: Origin Party

				// START: OrgnrDepAcctID
				var orgnDepAcctIDNode = addNodeFromParentNode(xmlDoc, pmtRecNode, "OrgnrDepAcctID");
				var odepacctIdNode = addNodeFromParentNode(xmlDoc, orgnDepAcctIDNode, "DepAcctID");

				if (!isEmpty(accountData) && !isEmpty(accountData.getText("custrecord_acct_map_ext_bank_account_typ")))
					setAttributeValue(odepacctIdNode, "AcctType", accountData.getText("custrecord_acct_map_ext_bank_account_typ"));

				if (!isEmpty(accountData) && !isEmpty(accountData.getValue("custrecord_acct_map_ext_bank_origin_acc")))
					setAttributeValue(odepacctIdNode, "AcctID", accountData.getValue("custrecord_acct_map_ext_bank_origin_acc"));

				if (!isEmpty(accountData) && !isEmpty(accountData.getValue("custrecord_acct_map_account_currency")))
					setAttributeValue(odepacctIdNode, "AcctCur", arrCurrencyMap[accountData.getValue("custrecord_acct_map_account_currency")]);

				var bankInfoNode = addNodeFromParentNode(xmlDoc, odepacctIdNode, "BankInfo");
				if (!isEmpty(vendorPaymentInfo)) setAttributeValue(bankInfoNode, "Name", vendorPaymentInfo.custrecord_bankname);

				if (!isEmpty(accountData) && !isEmpty(accountData.getText("custrecord_acct_map_ext_bank_id_type")))
					setAttributeValue(bankInfoNode, "BankIDType", accountData.getText("custrecord_acct_map_ext_bank_id_type"));

				if (!isEmpty(accountData) && !isEmpty(accountData.getValue("custrecord_acct_map_ext_bank_ori_bank_id")))
					addTextNodeFromParentNode(xmlDoc, bankInfoNode, "BankID", accountData.getValue("custrecord_acct_map_ext_bank_ori_bank_id"));

				var orgrefInfoNode = addNodeFromParentNode(xmlDoc, bankInfoNode, "RefInfo");

				if (!isEmpty(vendorPaymentInfo)) setAttributeValue(orgrefInfoNode, "RefType", "ACH");

                                if (!isEmpty(vendorPaymentInfo)) {
                                        var postAddrNode = addNodeFromParentNode(xmlDoc, bankInfoNode, 'PostAddr');
                                        addTextNodeFromParentNode(xmlDoc, postAddrNode, 'City', vendorPaymentInfo.custrecord_ica_orig_bank_city);
                                        addTextNodeFromParentNode(xmlDoc, postAddrNode, 'Country', vendorPaymentInfo.custrecord_ica_orig_bank_country_code);
                                }


				// if (!isEmpty(accountData) && !isEmpty(accountData.getValue("custrecord_acct_map_dom_ach_co_id"))) {
				// 	addTextNodeFromParentNode(xmlDoc, orgrefInfoNode, "RefID", accountData.getValue("custrecord_acct_map_dom_ach_co_id"));
				// } //Only for NRG

				// END: OrgnrDepAcctID

				// START: RcvrParty
				var rcvrPartyNode = addNodeFromParentNode(xmlDoc, pmtRecNode, "RcvrParty");

				if (!isEmpty(vendor.vendorname)) {
					var rcvrPartyNameNode = addNodeFromParentNode(xmlDoc, rcvrPartyNode, "Name");
					addTextNodeFromParentNode(xmlDoc, rcvrPartyNameNode, "Name1", vendor.vendorname);
				}

				var ccrRefType =
					!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_ccr_reftype) ? vendorPaymentInfo.custrecord_ccr_reftype : "";
				// as per Al on 4th May 2016
				// On the VPM: Vendor Profile Tab: custentity_vendorreftype,
				// (XML: RefType = VN) please default this value to 'VN' in your
				// code, I don't want to use this field anymore.
				// var refType = (pmtMethod != 'CCR') ? objVendor.vreftype :
				// ccrRefType;
				var refType = ccrRefType ? ccrRefType : "VN";
				var refInfoNode = addNodeFromParentNode(xmlDoc, rcvrPartyNode, "RefInfo");

				if (refType) {
					setAttributeValue(refInfoNode, "RefType", refType);
				}

                                addTextNodeFromParentNode(xmlDoc, refInfoNode, 'RefID', vendor.internalid);

				var rPPostAddrNode = "";
				if (
					!isEmpty(vendor.vendoraddrs1) ||
					!isEmpty(vendor.vendoraddrs2) ||
					!isEmpty(vendor.vendorcity) ||
					!isEmpty(vendor.vendorstateprovince) ||
					(!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_comppostcode)) ||
					!isEmpty(vendor.vendorpostal) ||
					!isEmpty(vendor.vendorcountrycode)
				) {
					rPPostAddrNode = addNodeFromParentNode(xmlDoc, rcvrPartyNode, "PostAddr");
				}

				if (!isEmpty(vendor.vendoraddrs1)) addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, "Addr1", vendor.vendoraddrs1);
				if (!isEmpty(vendor.vendoraddrs2)) addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, "Addr2", vendor.vendoraddrs2);
				if (!isEmpty(vendor.vendorcity)) addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, "City", vendor.vendorcity);
				if (!isEmpty(vendor.vendorstateprovince)) addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, "StateProv", vendor.vendorstateprovince);
				if (!isEmpty(vendor.vendorpostal)) addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, "PostalCode", vendor.vendorpostal);
				if (!isEmpty(vendor.vendorcountrycode)) {
					addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, "Country", countryCodeMapping[vendor.vendorcountrycode]);
					addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, "CountryName", vendor.vendorcountrycode);
				}
				// END: RcvrParty

				// START: RcvrDepAcctID
				var rcvrDeptAcctID = addNodeFromParentNode(xmlDoc, pmtRecNode, "RcvrDepAcctID");
				var rdeptAcctIdNode = addNodeFromParentNode(xmlDoc, rcvrDeptAcctID, "DepAcctID");
				if (!isEmpty(vendor.recpartyaccount)) setAttributeValue(rdeptAcctIdNode, "AcctID", vendor.recpartyaccount);

				// As per Al on 4th May | On the VPM: Payment Profile Tab:
				// custentity_recpartyaccttype,
				// (XML: AcctType = D) please default this value to 'D' in your
				// code, I don't want to use this field anymore.
				// if (!isEmpty(objVendor.recpartyaccttype))
				setAttributeValue(rdeptAcctIdNode, "AcctType", "D");

				if (!isEmpty(bill.currid)) {
					var curCode = arrCurrencyMap[bill.currid];
					setAttributeValue(rdeptAcctIdNode, "AcctCur", arrCurrencyMap[bill.currid]);
				}

				var rbankInfoNode = addNodeFromParentNode(xmlDoc, rdeptAcctIdNode, "BankInfo");
				if (!isEmpty(vendor.vbankname)) setAttributeValue(rbankInfoNode, "Name", vendor.vbankname);
				if (!isEmpty(vendor.recbankprimidtype)) setAttributeValue(rbankInfoNode, "BankIDType", vendor.recbankprimidtype);

				if (!isEmpty(vendor.bankid)) {
					//(pmtMethod == 'IAC' || pmtMethod == 'IWI' || pmtMethod == 'MTS') &&
					setAttributeValue(rbankInfoNode, "BranchID", vendor.bankid);
				}

				var rpostAddrNode = "";
				if (
					!isEmpty(vendor.vbankaddrs1) ||
					!isEmpty(vendor.vbankstate) ||
					!isEmpty(vendor.vbankcity) ||
					!isEmpty(vendor.vbankzip) ||
					!isEmpty(vendor.vbankcountry)
				) {
					rpostAddrNode = addNodeFromParentNode(xmlDoc, rbankInfoNode, "PostAddr");
				}

				// if (!isEmpty(vendor.vbankaddrs1))
				//     addTextNodeFromParentNode(xmlDoc, rpostAddrNode, 'Addr1', vendor.vbankaddrs1);
				// if (!isEmpty(vendor.vbankstate))
				//     addTextNodeFromParentNode(xmlDoc, rpostAddrNode, 'StateProv', vendor.vbankstate);

				if (!isEmpty(vendor.vbankcity)) addTextNodeFromParentNode(xmlDoc, rpostAddrNode, "City", vendor.vbankcity);

				if (!isEmpty(vendor.vbankzip)) addTextNodeFromParentNode(xmlDoc, rpostAddrNode, "PostalCode", vendor.vbankzip);

				if (!isEmpty(vendor.vbankcountry)) addTextNodeFromParentNode(xmlDoc, rpostAddrNode, "Country", countryCodeMapping[vendor.vbankcountry]);

				if (!isEmpty(vendor.recbankprimid)) addTextNodeFromParentNode(xmlDoc, rbankInfoNode, "BankID", vendor.recbankprimid);
				// END: RcvrDepAcctID

				// START : IntermediaryDepAccID
				// if (pmtMethod == 'MTS' || pmtMethod == 'IAC') {

				var intermediaryDepAccID = addNodeFromParentNode(xmlDoc, pmtRecNode, "IntermediaryDepAccID");
				var iDeptAcctIdNode = addNodeFromParentNode(xmlDoc, intermediaryDepAccID, "DepAcctID");
				var iBankInfoNode = addNodeFromParentNode(xmlDoc, iDeptAcctIdNode, "BankInfo");

				if (!isEmpty(vendor.custentity_inter_bank_id_type))
					setAttributeValue(iBankInfoNode, "BankIDType", vendor.custentity_inter_bank_id_type);

				if (!isEmpty(vendor.custentity_inter_bank_name)) setAttributeValue(iBankInfoNode, "Name", vendor.custentity_inter_bank_name);

				if (!isEmpty(vendor.custentity_inter_bank_id)) {
					// If Bank ID is ABA, enter the 9 digit ABA routing/transit
					// number.
					// If BankID Type is SWT, enter 8 or 11 character SWIFT BIC
					// code.
					// If BankIDType is CHP enter the 4 digit CHP participant
					// ID.
					addTextNodeFromParentNode(xmlDoc, iBankInfoNode, "BankID", vendor.custentity_inter_bank_id);
				}

				var iPostAddrNode = "";
				if (
					!isEmpty(vendor.custentity_inter_bank_address_1) ||
					!isEmpty(vendor.custentity_inter_bank_city) ||
					!isEmpty(vendor.custentity_inter_bank_state) ||
					!isEmpty(vendor.custentity_inter_bank_postal) ||
					!isEmpty(vendor.custentity_inter_bank_country)
				) {
					iPostAddrNode = addNodeFromParentNode(xmlDoc, iBankInfoNode, "PostAddr");
				}

				if (!isEmpty(vendor.custentity_inter_bank_address_1))
					addTextNodeFromParentNode(xmlDoc, iPostAddrNode, "Addr1", vendor.custentity_inter_bank_address_1);

				if (!isEmpty(vendor.custentity_inter_bank_city))
					addTextNodeFromParentNode(xmlDoc, iPostAddrNode, "City", vendor.custentity_inter_bank_city);

				if (!isEmpty(vendor.custentity_inter_bank_state))
					addTextNodeFromParentNode(xmlDoc, iPostAddrNode, "StateProv", vendor.custentity_inter_bank_state);

				if (!isEmpty(vendor.custentity_inter_bank_postal))
					addTextNodeFromParentNode(xmlDoc, iPostAddrNode, "PostalCode", vendor.custentity_inter_bank_postal);

				if (!isEmpty(vendor.custentity_inter_bank_country))
					addTextNodeFromParentNode(xmlDoc, iPostAddrNode, "Country", countryCodeMapping[vendor.custentity_inter_bank_country]);
				// END : IntermediaryDepAccID

				// START: PmtDetail
				var pmtDetailsNode = addNodeFromParentNode(xmlDoc, pmtRecNode, "PmtDetail");
				var pmtInvoiceInfoNode = addNodeFromParentNode(xmlDoc, pmtDetailsNode, "InvoiceInfo");

				if (!isEmpty(vendorPaymentInfo)) {
					setAttributeValue(pmtInvoiceInfoNode, "InvoiceType", vendorPaymentInfo.custrecord_invoicetype);
				} else {
					setAttributeValue(pmtInvoiceInfoNode, "InvoiceType", "");
				}

				setAttributeValue(pmtInvoiceInfoNode, "InvoiceNum", bill.billnum);
				setAttributeValue(pmtInvoiceInfoNode, "TotalCurAmt", Number(bill.origamt).toFixed(2));
				setAttributeValue(pmtInvoiceInfoNode, "NetCurAmt", Number(bill.payamt).toFixed(2));

				if (!isEmpty(billdata.memo)) {
					var pmtdNoteNodeCR = addNodeFromParentNode(xmlDoc, pmtInvoiceInfoNode, "Note");
					setAttributeValue(pmtdNoteNodeCR, "NoteType", "INV");
					addTextNodeFromParentNode(xmlDoc, pmtdNoteNodeCR, "NoteText", billdata.memo);
				}

				setAttributeValue(pmtInvoiceInfoNode, "DiscountCurAmt", Number(bill.discamt || 0).toFixed(2));

				// Add PO Num -- CLEAN
				if (!isEmpty(arrBillPO[bill.id])) {
					var poInfoNode = addNodeFromParentNode(xmlDoc, pmtInvoiceInfoNode, "POInfo");
					setAttributeValue(poInfoNode, "POType", "PO");
					addTextNodeFromParentNode(xmlDoc, poInfoNode, "PONum", arrBillPO[bill.id]);
				}
				//check if there are bill credit/s associated to bill. append if so.
				if (!isEmpty(billcredits)) {
					for (bc in billcredits) {
						var pmtInvoiceInfoNodeCR = addNodeFromParentNode(xmlDoc, pmtDetailsNode, "InvoiceInfo");
						setAttributeValue(pmtInvoiceInfoNodeCR, "InvoiceType", "CM");
						setAttributeValue(pmtInvoiceInfoNodeCR, "InvoiceNum", billcredits[bc].bcnum);

						var billCreditAmtP = getFloatVal(billcredits[bc].bcamt);
						var billCreditAmt = billCreditAmtP * -1;

						setAttributeValue(pmtInvoiceInfoNodeCR, "EffDt", formatDate(nlapiStringToDate(billcredits[bc].bcdate)));
						setAttributeValue(pmtInvoiceInfoNodeCR, "NetCurAmt", billCreditAmt.toFixed(2));
						setAttributeValue(pmtInvoiceInfoNodeCR, "TotalCurAmt", billCreditAmt.toFixed(2));

						if (!isEmpty(billcredits[bc].bcmemo)) {
							var pmtdNoteNodeCRBC = addNodeFromParentNode(xmlDoc, pmtInvoiceInfoNodeCR, "Note");
							setAttributeValue(pmtdNoteNodeCRBC, "NoteType", "INV");
							addTextNodeFromParentNode(
								xmlDoc,
								pmtdNoteNodeCRBC,
								"NoteText",
								isEmpty(billcredits[bc].bcmemo) ? "" : setValue(billcredits[bc].bcmemo)
							);
						}
					}
				}

				// END: PmtDetail

				// START: DocDelivery
				// var docDeliveryNode = addNodeFromParentNode(xmlDoc, pmtRecNode, "DocDelivery");

				// if (!isEmpty(vendor.custentity_pmp_biller_id)) {
				// 	addTextNodeFromParentNode(xmlDoc, docDeliveryNode, "EDDBillerID", vendor.custentity_pmp_biller_id);
				// } else if (!isEmpty(accountData) && !isEmpty(accountData.getValue("custrecord_acct_map_pmp_biller_id"))) {
				// 	addTextNodeFromParentNode(xmlDoc, docDeliveryNode, "EDDBillerID", accountData.getValue("custrecord_acct_map_pmp_biller_id"));
				// }

				// var fileOutNode = addNodeFromParentNode(xmlDoc, docDeliveryNode, "FileOut");

				// if (!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_dac_pmp_file_type))
				// 	addTextNodeFromParentNode(xmlDoc, fileOutNode, "FileType", vendorPaymentInfo.custrecord_dac_pmp_file_type);

				// if (!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_dac_pmp_file_format))
				// 	addTextNodeFromParentNode(xmlDoc, fileOutNode, "FileFormat", vendorPaymentInfo.custrecord_dac_pmp_file_format);

				// var deliveryNode = addNodeFromParentNode(xmlDoc, fileOutNode, "Delivery");

				// if (!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_dac_pmp_delivery_type))
				// 	addTextNodeFromParentNode(xmlDoc, deliveryNode, "DeliveryType", vendorPaymentInfo.custrecord_dac_pmp_delivery_type);

				// if (!isEmpty(vendor.pmp_dac_contactname))
				// 	addTextNodeFromParentNode(xmlDoc, deliveryNode, "DeliveryContactName", vendor.pmp_dac_contactname);

				// if (!isEmpty(vendor.pmp_dac_emailaddress))
				// 	addTextNodeFromParentNode(xmlDoc, deliveryNode, "DeliveryEmailAddress", vendor.pmp_dac_emailaddress);

				// END: DocDelivery

				addTextNodeFromParentNode(xmlDoc, pmtRecNode, "CurAmt", Number(bill.payamt).toFixed(2)); //confirm with Al.
			},
			NRG: function () {
				setAttributeValue(pmtRecNode, "PmtCrDr", "C");
				setAttributeValue(pmtRecNode, "PmtMethod", pmtMethod);

				if (!isEmpty(vendor.custentity_paymentformat)) {
					setAttributeValue(pmtRecNode, "PmtFormat", vendor.custentity_paymentformat);
				}

				if (!isEmpty(vendor.custentity_interpayformat)) setAttributeValue(pmtRecNode, "PmtFormatIntl", vendor.custentity_interpayformat);

				// if (!isEmpty(vendor.custentity_pmp_biller_id)) {
				// 	setAttributeValue(pmtRecNode, "TranHandlingCode", "U");
				// } else if (!isEmpty(accountData) && !isEmpty(accountData.getValue("custrecord_acct_map_pmp_biller_id"))) {
				// 	setAttributeValue(pmtRecNode, "TranHandlingCode", "U");
				// } Not for URG/NRG

				addTextNodeFromParentNode(xmlDoc, pmtRecNode, "PmtID", bill.refnum);
				if (!isEmpty(bill.currid)) {
					var curCode = arrCurrencyMap[bill.currid];
					addTextNodeFromParentNode(xmlDoc, pmtRecNode, "CurCode", curCode);
				}
				addTextNodeFromParentNode(xmlDoc, pmtRecNode, "ValueDate", formatDate(nlapiStringToDate(BPM_DATE)));

				if (!isEmpty(vendor.fx_reftype) || !isEmpty(vendor.fx_refid)) {
					var iacRefInfo = addNodeFromParentNode(xmlDoc, pmtRecNode, "RefInfo");
					if (!isEmpty(vendor.fx_reftype)) setAttributeValue(iacRefInfo, "RefType", vendor.fx_reftype);
					if (!isEmpty(vendor.fx_refid)) addTextNodeFromParentNode(xmlDoc, iacRefInfo, "RefID", vendor.fx_refid);
				}

				var msgNode = addNodeFromParentNode(xmlDoc, pmtRecNode, "Message");
				setAttributeValue(msgNode, "MsgType", "OBI");

				if (CHECK_MEMO == "T") {
					var msgTypeTxt = billpayment.memo;
					addTextNodeFromParentNode(xmlDoc, msgNode, "MsgText", msgTypeTxt);
				} else {
					dAudit("DEFAULT_MSG_VENDOR_ID", DEFAULT_MSG_VENDOR_ID);
					var msgTypeTxt = "";
					if (DEFAULT_MSG_VENDOR_ID == "T") {
						try {
							msgTypeTxt = vendor.custentity_ica_vendor_external_id;
						} catch (e) {
							dErr("DEFAULT_MSG_VENDOR_ID custom field not found. Doing nothing", DEFAULT_MSG_VENDOR_ID);
						}
						addTextNodeFromParentNode(xmlDoc, msgNode, "MsgText", msgTypeTxt);
					} else {
						msgTypeTxt = bill.payeeid;
						addTextNodeFromParentNode(xmlDoc, msgNode, "MsgText", msgTypeTxt);
					}
				}

				//Clean
				var msgTxt = "";
				var bMemo = vendor.custentity_ica_vendor_bank_instructions; //arrPayeeInterBillsMemo[bill.payeeid];

				if (!isEmpty(bMemo)) msgTxt += isEmpty(msgTxt) ? bMemo : " " + bMemo;

				dLog("creatXMLDoc", "Msg text = " + msgTxt);

				if (!isEmpty(msgTxt)) {
					var msgNode = addNodeFromParentNode(xmlDoc, pmtRecNode, "Message");
					setAttributeValue(msgNode, "MsgType", VENDOR_ORIG_MSG_TYPE);
					addTextNodeFromParentNode(xmlDoc, msgNode, "MsgText", msgTxt);
				}

				// START: Origin Party
				var orgnPartyNode = addNodeFromParentNode(xmlDoc, pmtRecNode, "OrgnrParty");

				if (!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_companyname)) {
					var orgpNameNode = addNodeFromParentNode(xmlDoc, orgnPartyNode, "Name");
					addTextNodeFromParentNode(xmlDoc, orgpNameNode, "Name1", vendorPaymentInfo.custrecord_companyname);
				}
                                if (!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_compaddname)) {
                                        var name2 = vendorPaymentInfo.custrecord_compaddname.substring(0,15);
                                        addTextNodeFromParentNode(xmlDoc, orgpNameNode, 'Name2', vendorPaymentInfo.custrecord_compaddname);
                                }

				if (
					(!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_compadd1)) ||
					(!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_compadd2)) ||
					(!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_compcity)) ||
					(!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_compstateprov)) ||
					(!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_comppostcode))
				) {
					var postAddrNode = addNodeFromParentNode(xmlDoc, orgnPartyNode, "PostAddr");

					if (!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_compadd1))
						addTextNodeFromParentNode(xmlDoc, postAddrNode, "Addr1", vendorPaymentInfo.custrecord_compadd1);
					if (!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_compadd2))
						addTextNodeFromParentNode(xmlDoc, postAddrNode, "Addr2", vendorPaymentInfo.custrecord_compadd2);
					if (!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_compcity))
						addTextNodeFromParentNode(xmlDoc, postAddrNode, "City", vendorPaymentInfo.custrecord_compcity);
					if (!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_compstateprov))
						addTextNodeFromParentNode(xmlDoc, postAddrNode, "StateProv", vendorPaymentInfo.custrecord_compstateprov);
					if (!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_comppostcode))
						addTextNodeFromParentNode(xmlDoc, postAddrNode, "PostalCode", vendorPaymentInfo.custrecord_comppostcode);

					var country = !isEmpty(vendorPaymentInfo) ? vendorPaymentInfo.custrecord_compcountrycode : "";
					if (!isEmpty(country)) addTextNodeFromParentNode(xmlDoc, postAddrNode, "Country", country);

					var countryName = !isEmpty(vendorPaymentInfo) ? vendorPaymentInfo.custrecord_compcountrynames : "";
					if (!isEmpty(countryName)) addTextNodeFromParentNode(xmlDoc, postAddrNode, "CountryName", countryName);
				}
				// END: Origin Party

				// START: OrgnrDepAcctID
				var orgnDepAcctIDNode = addNodeFromParentNode(xmlDoc, pmtRecNode, "OrgnrDepAcctID");
				var odepacctIdNode = addNodeFromParentNode(xmlDoc, orgnDepAcctIDNode, "DepAcctID");

				if (!isEmpty(accountData) && !isEmpty(accountData.getText("custrecord_acct_map_ext_bank_account_typ")))
					setAttributeValue(odepacctIdNode, "AcctType", accountData.getText("custrecord_acct_map_ext_bank_account_typ"));

				if (!isEmpty(accountData) && !isEmpty(accountData.getValue("custrecord_acct_map_ext_bank_origin_acc")))
					setAttributeValue(odepacctIdNode, "AcctID", accountData.getValue("custrecord_acct_map_ext_bank_origin_acc"));

				if (!isEmpty(accountData) && !isEmpty(accountData.getValue("custrecord_acct_map_account_currency")))
					setAttributeValue(odepacctIdNode, "AcctCur", arrCurrencyMap[accountData.getValue("custrecord_acct_map_account_currency")]);

				var bankInfoNode = addNodeFromParentNode(xmlDoc, odepacctIdNode, "BankInfo");
				if (!isEmpty(vendorPaymentInfo)) setAttributeValue(bankInfoNode, "Name", vendorPaymentInfo.custrecord_bankname);

				if (!isEmpty(accountData) && !isEmpty(accountData.getText("custrecord_acct_map_ext_bank_id_type")))
					setAttributeValue(bankInfoNode, "BankIDType", accountData.getText("custrecord_acct_map_ext_bank_id_type"));

				if (!isEmpty(accountData) && !isEmpty(accountData.getValue("custrecord_acct_map_ext_bank_ori_bank_id")))
					addTextNodeFromParentNode(xmlDoc, bankInfoNode, "BankID", accountData.getValue("custrecord_acct_map_ext_bank_ori_bank_id"));

				var orgrefInfoNode = addNodeFromParentNode(xmlDoc, bankInfoNode, "RefInfo");

				if (!isEmpty(vendorPaymentInfo)) setAttributeValue(orgrefInfoNode, "RefType", "ACH");

				if (!isEmpty(accountData) && !isEmpty(accountData.getValue("custrecord_acct_map_dom_ach_co_id"))) {
					addTextNodeFromParentNode(xmlDoc, orgrefInfoNode, "RefID", accountData.getValue("custrecord_acct_map_dom_ach_co_id"));
				} //Only for NRG
                                
                                if (!isEmpty(vendorPaymentInfo)) {
                                        var postAddrNode = addNodeFromParentNode(xmlDoc, bankInfoNode, 'PostAddr');
                                        addTextNodeFromParentNode(xmlDoc, postAddrNode, 'City', vendorPaymentInfo.custrecord_ica_orig_bank_city);
                                        addTextNodeFromParentNode(xmlDoc, postAddrNode, 'Country', vendorPaymentInfo.custrecord_ica_orig_bank_country_code);
                                }


				// END: OrgnrDepAcctID

				// START: RcvrParty
				var rcvrPartyNode = addNodeFromParentNode(xmlDoc, pmtRecNode, "RcvrParty");

				if (!isEmpty(vendor.vendorname)) {
					var rcvrPartyNameNode = addNodeFromParentNode(xmlDoc, rcvrPartyNode, "Name");
					addTextNodeFromParentNode(xmlDoc, rcvrPartyNameNode, "Name1", vendor.vendorname);
				}

				var ccrRefType =
					!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_ccr_reftype) ? vendorPaymentInfo.custrecord_ccr_reftype : "";
				// as per Al on 4th May 2016
				// On the VPM: Vendor Profile Tab: custentity_vendorreftype,
				// (XML: RefType = VN) please default this value to 'VN' in your
				// code, I don't want to use this field anymore.
				// var refType = (pmtMethod != 'CCR') ? objVendor.vreftype :
				// ccrRefType;
				var refType = ccrRefType ? ccrRefType : "VN";
				var refInfoNode = addNodeFromParentNode(xmlDoc, rcvrPartyNode, "RefInfo");

				if (refType) {
					setAttributeValue(refInfoNode, "RefType", refType);
				}

                                addTextNodeFromParentNode(xmlDoc, refInfoNode, 'RefID', vendor.internalid);

				var rPPostAddrNode = "";
				if (
					!isEmpty(vendor.vendoraddrs1) ||
					!isEmpty(vendor.vendoraddrs2) ||
					!isEmpty(vendor.vendorcity) ||
					!isEmpty(vendor.vendorstateprovince) ||
					(!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_comppostcode)) ||
					!isEmpty(vendor.vendorpostal) ||
					!isEmpty(vendor.vendorcountrycode)
				) {
					rPPostAddrNode = addNodeFromParentNode(xmlDoc, rcvrPartyNode, "PostAddr");
				}

				if (!isEmpty(vendor.vendoraddrs1)) addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, "Addr1", vendor.vendoraddrs1);
				if (!isEmpty(vendor.vendoraddrs2)) addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, "Addr2", vendor.vendoraddrs2);
				if (!isEmpty(vendor.vendorcity)) addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, "City", vendor.vendorcity);
				if (!isEmpty(vendor.vendorstateprovince)) addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, "StateProv", vendor.vendorstateprovince);
				if (!isEmpty(vendor.vendorpostal)) addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, "PostalCode", vendor.vendorpostal);
				if (!isEmpty(vendor.vendorcountrycode)) {
					addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, "Country", countryCodeMapping[vendor.vendorcountrycode]);
					addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, "CountryName", vendor.vendorcountrycode);
				}
				// END: RcvrParty

				// START: RcvrDepAcctID
				var rcvrDeptAcctID = addNodeFromParentNode(xmlDoc, pmtRecNode, "RcvrDepAcctID");
				var rdeptAcctIdNode = addNodeFromParentNode(xmlDoc, rcvrDeptAcctID, "DepAcctID");
				if (!isEmpty(vendor.recpartyaccount)) setAttributeValue(rdeptAcctIdNode, "AcctID", vendor.recpartyaccount);

				// As per Al on 4th May | On the VPM: Payment Profile Tab:
				// custentity_recpartyaccttype,
				// (XML: AcctType = D) please default this value to 'D' in your
				// code, I don't want to use this field anymore.
				// if (!isEmpty(objVendor.recpartyaccttype))
				setAttributeValue(rdeptAcctIdNode, "AcctType", "D");

				if (!isEmpty(bill.currid)) {
					var curCode = arrCurrencyMap[bill.currid];
					setAttributeValue(rdeptAcctIdNode, "AcctCur", arrCurrencyMap[bill.currid]);
				}

				var rbankInfoNode = addNodeFromParentNode(xmlDoc, rdeptAcctIdNode, "BankInfo");
				if (!isEmpty(vendor.vbankname)) setAttributeValue(rbankInfoNode, "Name", vendor.vbankname);
				if (!isEmpty(vendor.recbankprimidtype)) setAttributeValue(rbankInfoNode, "BankIDType", vendor.recbankprimidtype);

				if (!isEmpty(vendor.bankid)) {
					setAttributeValue(rbankInfoNode, "BranchID", vendor.bankid);
				}

				var rpostAddrNode = "";
				if (
					!isEmpty(vendor.vbankaddrs1) ||
					!isEmpty(vendor.vbankstate) ||
					!isEmpty(vendor.vbankcity) ||
					!isEmpty(vendor.vbankzip) ||
					!isEmpty(vendor.vbankcountry)
				) {
					rpostAddrNode = addNodeFromParentNode(xmlDoc, rbankInfoNode, "PostAddr");
				}

				// if (!isEmpty(vendor.vbankaddrs1))
				//     addTextNodeFromParentNode(xmlDoc, rpostAddrNode, 'Addr1', vendor.vbankaddrs1);
				// if (!isEmpty(vendor.vbankstate))
				//     addTextNodeFromParentNode(xmlDoc, rpostAddrNode, 'StateProv', vendor.vbankstate);

				if (!isEmpty(vendor.vbankcity)) addTextNodeFromParentNode(xmlDoc, rpostAddrNode, "City", vendor.vbankcity);

				if (!isEmpty(vendor.vbankzip)) addTextNodeFromParentNode(xmlDoc, rpostAddrNode, "PostalCode", vendor.vbankzip);

				if (!isEmpty(vendor.vbankcountry)) addTextNodeFromParentNode(xmlDoc, rpostAddrNode, "Country", countryCodeMapping[vendor.vbankcountry]);

				if (!isEmpty(vendor.recbankprimid)) addTextNodeFromParentNode(xmlDoc, rbankInfoNode, "BankID", vendor.recbankprimid);
				// END: RcvrDepAcctID

				// START : IntermediaryDepAccID
				// if (pmtMethod == 'MTS' || pmtMethod == 'IAC') {

				var intermediaryDepAccID = addNodeFromParentNode(xmlDoc, pmtRecNode, "IntermediaryDepAccID");
				var iDeptAcctIdNode = addNodeFromParentNode(xmlDoc, intermediaryDepAccID, "DepAcctID");
				var iBankInfoNode = addNodeFromParentNode(xmlDoc, iDeptAcctIdNode, "BankInfo");

				if (!isEmpty(vendor.custentity_inter_bank_id_type))
					setAttributeValue(iBankInfoNode, "BankIDType", vendor.custentity_inter_bank_id_type);

				if (!isEmpty(vendor.custentity_inter_bank_name)) setAttributeValue(iBankInfoNode, "Name", vendor.custentity_inter_bank_name);

				if (!isEmpty(vendor.custentity_inter_bank_id)) {
					// If Bank ID is ABA, enter the 9 digit ABA routing/transit
					// number.
					// If BankID Type is SWT, enter 8 or 11 character SWIFT BIC
					// code.
					// If BankIDType is CHP enter the 4 digit CHP participant
					// ID.
					addTextNodeFromParentNode(xmlDoc, iBankInfoNode, "BankID", vendor.custentity_inter_bank_id);
				}

				var iPostAddrNode = "";
				if (
					!isEmpty(vendor.custentity_inter_bank_address_1) ||
					!isEmpty(vendor.custentity_inter_bank_city) ||
					!isEmpty(vendor.custentity_inter_bank_state) ||
					!isEmpty(vendor.custentity_inter_bank_postal) ||
					!isEmpty(vendor.custentity_inter_bank_country)
				) {
					iPostAddrNode = addNodeFromParentNode(xmlDoc, iBankInfoNode, "PostAddr");
				}

				if (!isEmpty(vendor.custentity_inter_bank_address_1))
					addTextNodeFromParentNode(xmlDoc, iPostAddrNode, "Addr1", vendor.custentity_inter_bank_address_1);

				if (!isEmpty(vendor.custentity_inter_bank_city))
					addTextNodeFromParentNode(xmlDoc, iPostAddrNode, "City", vendor.custentity_inter_bank_city);

				if (!isEmpty(vendor.custentity_inter_bank_state))
					addTextNodeFromParentNode(xmlDoc, iPostAddrNode, "StateProv", vendor.custentity_inter_bank_state);

				if (!isEmpty(vendor.custentity_inter_bank_postal))
					addTextNodeFromParentNode(xmlDoc, iPostAddrNode, "PostalCode", vendor.custentity_inter_bank_postal);

				if (!isEmpty(vendor.custentity_inter_bank_country))
					addTextNodeFromParentNode(xmlDoc, iPostAddrNode, "Country", countryCodeMapping[vendor.custentity_inter_bank_country]);
				// END : IntermediaryDepAccID

				// START: PmtDetail
				var pmtDetailsNode = addNodeFromParentNode(xmlDoc, pmtRecNode, "PmtDetail");
				var pmtInvoiceInfoNode = addNodeFromParentNode(xmlDoc, pmtDetailsNode, "InvoiceInfo");

				if (!isEmpty(vendorPaymentInfo)) {
					setAttributeValue(pmtInvoiceInfoNode, "InvoiceType", vendorPaymentInfo.custrecord_invoicetype);
				} else {
					setAttributeValue(pmtInvoiceInfoNode, "InvoiceType", "");
				}

				setAttributeValue(pmtInvoiceInfoNode, "InvoiceNum", bill.billnum);
				setAttributeValue(pmtInvoiceInfoNode, "TotalCurAmt", Number(bill.origamt).toFixed(2));
				setAttributeValue(pmtInvoiceInfoNode, "NetCurAmt", Number(bill.payamt).toFixed(2));

				if (!isEmpty(billdata.memo)) {
					var pmtdNoteNodeCR = addNodeFromParentNode(xmlDoc, pmtInvoiceInfoNode, "Note");
					setAttributeValue(pmtdNoteNodeCR, "NoteType", "INV");
					addTextNodeFromParentNode(xmlDoc, pmtdNoteNodeCR, "NoteText", billdata.memo);
				}

				setAttributeValue(pmtInvoiceInfoNode, "DiscountCurAmt", Number(bill.discamt || 0).toFixed(2));

				// Add PO Num -- CLEAN
				if (!isEmpty(arrBillPO[bill.id])) {
					var poInfoNode = addNodeFromParentNode(xmlDoc, pmtInvoiceInfoNode, "POInfo");
					setAttributeValue(poInfoNode, "POType", "PO");
					addTextNodeFromParentNode(xmlDoc, poInfoNode, "PONum", arrBillPO[bill.id]);
				}
				//check if there are bill credit/s associated to bill. append if so.
				if (!isEmpty(billcredits)) {
					for (bc in billcredits) {
						var pmtInvoiceInfoNodeCR = addNodeFromParentNode(xmlDoc, pmtDetailsNode, "InvoiceInfo");
						setAttributeValue(pmtInvoiceInfoNodeCR, "InvoiceType", "CM");
						setAttributeValue(pmtInvoiceInfoNodeCR, "InvoiceNum", billcredits[bc].bcnum);

						var billCreditAmtP = getFloatVal(billcredits[bc].bcamt);
						var billCreditAmt = billCreditAmtP * -1;

						setAttributeValue(pmtInvoiceInfoNodeCR, "EffDt", formatDate(nlapiStringToDate(billcredits[bc].bcdate)));
						setAttributeValue(pmtInvoiceInfoNodeCR, "NetCurAmt", billCreditAmt.toFixed(2));
						setAttributeValue(pmtInvoiceInfoNodeCR, "TotalCurAmt", billCreditAmt.toFixed(2));

						if (!isEmpty(billcredits[bc].bcmemo)) {
							var pmtdNoteNodeCRBC = addNodeFromParentNode(xmlDoc, pmtInvoiceInfoNodeCR, "Note");
							setAttributeValue(pmtdNoteNodeCRBC, "NoteType", "INV");
							addTextNodeFromParentNode(
								xmlDoc,
								pmtdNoteNodeCRBC,
								"NoteText",
								isEmpty(billcredits[bc].bcmemo) ? "" : setValue(billcredits[bc].bcmemo)
							);
						}
					}
				}

				// END: PmtDetail

				// START: DocDelivery
				// var docDeliveryNode = addNodeFromParentNode(xmlDoc, pmtRecNode, "DocDelivery");

				// if (!isEmpty(vendor.custentity_pmp_biller_id)) {
				// 	addTextNodeFromParentNode(xmlDoc, docDeliveryNode, "EDDBillerID", vendor.custentity_pmp_biller_id);
				// } else if (!isEmpty(accountData) && !isEmpty(accountData.getValue("custrecord_acct_map_pmp_biller_id"))) {
				// 	addTextNodeFromParentNode(xmlDoc, docDeliveryNode, "EDDBillerID", accountData.getValue("custrecord_acct_map_pmp_biller_id"));
				// }

				// var fileOutNode = addNodeFromParentNode(xmlDoc, docDeliveryNode, "FileOut");

				// if (!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_dac_pmp_file_type))
				// 	addTextNodeFromParentNode(xmlDoc, fileOutNode, "FileType", vendorPaymentInfo.custrecord_dac_pmp_file_type);

				// if (!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_dac_pmp_file_format))
				// 	addTextNodeFromParentNode(xmlDoc, fileOutNode, "FileFormat", vendorPaymentInfo.custrecord_dac_pmp_file_format);

				// var deliveryNode = addNodeFromParentNode(xmlDoc, fileOutNode, "Delivery");

				// if (!isEmpty(vendorPaymentInfo) && !isEmpty(vendorPaymentInfo.custrecord_dac_pmp_delivery_type))
				// 	addTextNodeFromParentNode(xmlDoc, deliveryNode, "DeliveryType", vendorPaymentInfo.custrecord_dac_pmp_delivery_type);

				// if (!isEmpty(vendor.pmp_dac_contactname))
				// 	addTextNodeFromParentNode(xmlDoc, deliveryNode, "DeliveryContactName", vendor.pmp_dac_contactname);

				// if (!isEmpty(vendor.pmp_dac_emailaddress))
				// 	addTextNodeFromParentNode(xmlDoc, deliveryNode, "DeliveryEmailAddress", vendor.pmp_dac_emailaddress);

				// END: DocDelivery

				addTextNodeFromParentNode(xmlDoc, pmtRecNode, "CurAmt", Number(bill.payamt).toFixed(2)); //confirm with Al.
			},

		};

		paymentMethod[pmtMethod]();
	}

	// if (pmtMethod == 'IAC' || pmtMethod == 'MTS' || pmtMethod == 'IWI' || pmtMethod == 'ACH' || pmtMethod == 'DAC' || pmtMethod=='PLC' || pmtMethod=='CHK' || pmtMethod == 'CCR') {
	//     setAttributeValue(fileNode, 'PmtRecCount', pmtCtr);
	//     // setAttributeValue(fileNode, 'PmtRecTotal', pmtTotalAmt.toFixed(2));
	//     // var amtPmtRecTotal = (tmpTotalAmt % 1 != 0) ? tmpTotalAmt :
	//     // tmpTotalAmt.toFixed(2);
	//     dAudit('creatXMLDoc', 'tmpTotalAmt = ' + tmpTotalAmt);
	//     setAttributeValue(fileNode, 'PmtRecTotal', tmpTotalAmt.toFixed(2));
	// }
	// else {
	//     setAttributeValue(fileNode, 'PmtRecTotal', tmpTotalAmt.toFixed(2));
	//     setAttributeValue(fileNode, 'PmtRecCount', pmtCtr);
	// }

	setAttributeValue(fileNode, "PmtRecCount", farrBillsProcessed.length);

	dLog("pmtRecTotal", pmtRecTotal);
	dLog("pmtRecTotalDue", pmtRecTotalDue);

	if (isNaN(pmtRecTotal)) {
		pmtRecTotal = pmtRecTotalDue;
	}
	setAttributeValue(fileNode, "PmtRecTotal", pmtRecTotal.toFixed(2));

	var fileCtrlNumber = Date.create().format("{yy}{MM}{dd}{mm}{ss}");
	var fileInfoGrpNode = addNodeFromParentNode(xmlDoc, fileNode, "FileInfoGrp");
	setAttributeValue(fileInfoGrpNode, "FileDate", currDate);
	setAttributeValue(fileInfoGrpNode, "FileControlNumber", "FILE" + pad(fileCtrlNumber, 4));

	dAudit("createXMLDocSingle-End", xmlDoc);

	return xmlDoc;
}


