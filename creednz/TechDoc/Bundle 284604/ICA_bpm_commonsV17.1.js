// TODO : find a way to set this on a custom record or config file, because if this will be a separate bundle, need to setup this on the deployment
// *******
// script parameter - comp. pref
var FILE_NAME_EXT = 'xml';
var FILE_NAME_PREFIX = nlapiGetContext().getSetting('SCRIPT', 'custscript_v171_filename_prefix');
var BILL_FOLDER = nlapiGetContext().getSetting('SCRIPT', 'custscript_v171_bill_folder');
var ERREMAIL_TO = nlapiGetContext().getSetting('SCRIPT', 'custscript_v171_email_err_to');
var EMAIL_BODY = nlapiGetContext().getSetting('SCRIPT', 'custscript_v171_email_body');
var COMPANY_PREFIX = nlapiGetContext().getSetting('SCRIPT', 'custscript_v171_companyid_prefix');
var VPM_CONNECTOR_FOLDER = nlapiGetContext().getSetting('SCRIPT', 'custscript_v171_connector_folder_id');
var CURRENT_NS_DOMAIN = nlapiGetContext().getSetting('SCRIPT', 'custscript_v171_bpm_ns_domain');
var SEND_FILE_EMAIL = nlapiGetContext().getSetting('SCRIPT', 'custscript_v171_email_to');
var SEND_SUMMARY_EMAIL = nlapiGetContext().getSetting('SCRIPT', 'custscript_v171_send_summary_email');
var SEND_FILE_VIA_EMAIL = nlapiGetContext().getSetting('SCRIPT', 'custscript_v171_send_file_via_email');
var CSV_FILE_DESTINATION = nlapiGetContext().getSetting('SCRIPT', 'custscript_v17_1_csv_file_dest');
var CSV_CUSTOMER_ID = nlapiGetContext().getSetting('SCRIPT', 'custscript_v17_1_csv_customer_id');
var VENDOR_ORIG_MSG_TYPE = nlapiGetContext().getSetting('SCRIPT', 'custscript_ica_bpm_vendor_orig_msg_type');
var USE_ACCOUNT_LEVEL_FOLDERS = nlapiGetContext().getSetting('SCRIPT', 'custscript_bpm_use_account_level_folders');
var WF_NO_ACCOUNT_INFORMATION_IN_XML = nlapiGetContext().getSetting('SCRIPT', 'custscript_bpm_wf_no_acctinfo_in_xml');
var WIRE_FEES = nlapiGetContext().getSetting('SCRIPT', 'custscript_v17_1_wire_fees');
var DEFAULT_MSG_VENDOR_ID = nlapiGetContext().getSetting('SCRIPT', 'custscript_ica_default_vendor_id'); //RSF OCT142020
var CHECKZIP = nlapiGetContext().getSetting('SCRIPT', 'custscript_ica_bpm_incl_cz'); //RSF FEB192021
var INTERNAL_ID_MSG_TEXT = nlapiGetContext().getSetting('SCRIPT', 'custscript_ica_bpm_iid_msg_txt'); //RSF FEB242021
var USE_CUSTOM_ADDRESSES = nlapiGetContext().getSetting('SCRIPT', 'custscript_ica_bpm_cam');
var OVERWRITE_REFINFO = nlapiGetContext().getSetting('SCRIPT', 'custscript_ica_bpm_overwrite_refinfo');
var CUSTOM_REFINFO = nlapiGetContext().getSetting('SCRIPT', 'custscript_ica_bpm_refinfo_internalid');
var IS_FLEET_INTERNALID = nlapiGetContext().getSetting('SCRIPT', 'custscript_ica_bpm_is_fleet_internalid');
var CHECKZIP_INTERNALIDS = nlapiGetContext().getSetting('SCRIPT', 'custscript_ica_bpm_check_zip_iids');
var UNIONBANK_VENDOR_ID = nlapiGetContext().getSetting('SCRIPT', 'custscript_ica_bpm_union_bank_vendor_id');
var DEPLOY_CHECKZIP = true;
// ******

// script parameter
var BPM_DATE = nlapiGetContext().getSetting('SCRIPT', 'custscript_v17_1_bpm_date');
var EMAIL_SENDER = nlapiGetContext().getSetting('SCRIPT', 'custscript_v17_1_email_sender');
var EMAIL_SENDER_EMAIL = nlapiGetContext().getSetting('SCRIPT', 'custscript_v17_1_email_sender_email');
var SUB_ID = nlapiGetContext().getSetting('SCRIPT', 'custscript_v17_1_sub_id');
var BILLIDS = nlapiGetContext().getSetting('SCRIPT', 'custscript_v17_1_bill_ids');
var ACCOUNT = nlapiGetContext().getSetting('SCRIPT', 'custscript_v17_1_acct');
var APACCOUNT = nlapiGetContext().getSetting('SCRIPT', 'custscript_v17_1_apacct');
var SINGLEBILLPYMTS = nlapiGetContext().getSetting('SCRIPT', 'custscript_ica_bpm_cbp_pb');
var TOBEPRINTED = nlapiGetContext().getSetting('SCRIPT', 'custscript_ica_to_be_printed');
var SHOW_DYNAMIC_COLUMN_1 = nlapiGetContext().getSetting('SCRIPT', 'custscript_ica_bpm_show_dc_1');
var OTHERCHEQUE = nlapiGetContext().getSetting('SCRIPT', 'custscript_ica_bpm_othercheque');
var PROCESS_AS_CHECK = nlapiGetContext().getSetting('SCRIPT', 'custscript_ica_bpm_processascheck');
var USE_NEW_EMAIL_SUMMARY = nlapiGetContext().getSetting('SCRIPT', 'custscript_ica_bpm_use_pymt_email_smry');
var USE_CHECK_ADDR = nlapiGetContext().getSetting('SCRIPT', 'custscript_ica_bpm_use_check_addr');

//RSF
var CHECK_MEMO = nlapiGetContext().getSetting('SCRIPT', 'custscript_ica_bpm_check_memo_def');

var EMAIL_SUBJECT_XML = 'XML Vendor Payment';
var EMAIL_SUBJECT_CSV = 'CSV Vendor Payment';
var EMAIL_SUBJECT_VP = 'Batch Payment Summary';

var VPM_SS_BPAYMENT_CREATION_SCRIPT_ID = 'customscript_ica_ss_vpm_paymentv17_1';
// call v16.2, nothing has changed
var VPM_SS_BPAYMENT_UPDATE_SCRIPT_ID = 'customscript_ss_vpm_payment_updatev16_2';
var BPM_SS_PAINTNITE_PAYMENT_ACTIVITY_SCRIPT_ID = 'customscript_ica_ss_vpm_create_pay_acvty';
var VPM_SL_SCRIPT_ID = 'customscript_ica_sl_vpm_mainv17_1';
var VPM_CS_SCRIPT_ID = 'customscript_ica_cs_vpm_formv17_1';

var trPaymentCount = 0;
var trPaymentAmount = 0.0;
var subsidiaryId = '';

// SAVED SEARCH
var ACCOUNT_AP_SAVED_SEARCH = 'customsearch_ap_account_search';
var BANK_ACCT_SAVED_SEARCH = 'customsearch_bank_account_search';
var BILLS_TO_PAY_SAVED_SEARCH = 'customsearch_bills_to_pay_v1712'; //'customsearch_bills_to_pay_v16_2_2';
var POSTING_PERIOD_SAVED_SEARH = 'customsearch_bp_posting_period';
var ACCT_MAPPING_REC_SAVED_SEARCH = 'customsearch_ia_bpm_acct_mapping';
var VENDOR_PAYMENT_REC_SEARCH = 'customsearch_vpm_vendor_payment_rec';

var CSV_TEMPLATE = nlapiGetContext().getSetting('SCRIPT', 'custscript_v171_csv_template_id');
var USE_BILL_REFERENCE_NUMBER = nlapiGetContext().getSetting('SCRIPT', 'custscript_v171_use_bill_refno');

var BANK_ACCT_WELLSFARGO = '1';
var BANK_ACCT_JPMORGAN = '2';
var BANK_ACCT_SILICONVALLEYBANK = '3';
var BANK_ACCT_BANK_OF_AMERICA = '4';
var BANK_BBVA = '6';
var BANK_JP_CHASE = '7';
var BANK_HSBC_AU = '8';
var BANK_PACWEST = '9';
var BANK_HSBC_CANADA = '10';
var BANK_HSBC_USA = '11';
var BANK_BNS = '12';
var BANK_RBC = '13';
var BANK_JPM_ISO = '14';
var BANK_EWB = '15'; // to update
var BANK_BMO_ISO = '16';
var BANK_LLOYDS = '17';
var BANK_CITI_INDIA = '18';
var BANK_UBC = '19';
var BANK_HSBC_NEFT = '20';
var BANK_CAP_ISO = '21';
var BANK_HSBC_SG = '22';
var BANK_BOA_ISO = '23';
var BANK_HSBC_KOREA = '24';
var BANK_HSBC_CHINA = '25';
var BANK_HSBC_INDIA = '26';
var BANK_SVB_CHECK_ISO = '27';
var BANK_HDFC_NEFT = '28';
var BANK_SANTANDER_POLAND = '29';
var BANK_STANDARD_NEFT = '30';

var COUNTER = 1;

//Global JSON
var fleetMappingJSON = [];

// Netsuite features
var context = nlapiGetContext();
var IS_MULTICURRENCY = context.getFeature('MULTICURRENCY');

/**
 *
 * @param objFld
 * @param arrValues
 * @param defualtVal
 */
function setSelectDefault(objFld, arrValues, defualtVal) {
	// dLog('setSelectDefault', 'objFld = ' + (( typeof objFld == 'Object') ?
	// objFld.getLabel() : ''));
	// dLog('setSelectDefault', 'defualtVal = ' + defualtVal);
	// dLog('setSelectDefault', 'arrValues = ' + JSON.stringify(arrValues));

	var attrToCheck = isNaN(parseInt(defualtVal)) ? 'name' : 'id';

	for (x in arrValues) {
		if (defualtVal == arrValues[x][attrToCheck]) {
			objFld.addSelectOption(arrValues[x].id, arrValues[x].name, true);
		} else {
			objFld.addSelectOption(arrValues[x].id, arrValues[x].name);
		}
	}
}

function getPaymentMethodId(arrValues) {
	var arrIds = [];
	for (x in arrValues) {
		arrIds.push(arrValues[x].id);
	}

	return arrIds;
}

/**
 *
 * @param amtVal
 * @returns
 */
function decimalTwoFormat(amtVal) {
	return Math.ceil(parseFloat(amtVal) * 100) / 100;
}

/**
 *
 * @returns
 */
function getPostingPeriods() {
	var arrPostingPeriods = [];
	var results = nlapiSearchRecord('accountingperiod', POSTING_PERIOD_SAVED_SEARH);

	for (var i = 0; results != null && i < results.length; i++) {
		arrPostingPeriods.push({
			id: results[i].getValue('internalid', null, 'group'),
			name: results[i].getValue('periodname', null, 'group'),
		});
	}

	return arrPostingPeriods;
}

/**
 *
 * @returns
 */
function getBankAccount() {
	var arrAPAccts = [];
	var columns = [];

	if (isNonSubAcct) columns.push(new nlobjSearchColumn('subsidiary'));
	var results = nlapiSearchRecord('account', BANK_ACCT_SAVED_SEARCH, null, columns);

	for (var i = 0; results != null && i < results.length; i++) {
		var subsidiaryId = isNonSubAcct ? '' : results[i].getValue('subsidiary');

		arrAPAccts.push({
			id: results[i].getId(),
			name: results[i].getValue('name'),
			bal: results[i].getValue('balance'),
			sub: subsidiaryId,
		});
	}

	return arrAPAccts;
}

/**
 *
 * @returns {Array}
 */
function getPaymentMethod() {
	var arrPaymentMethods = [
		{
			id: '',
			name: '',
		},
	];
	var rs = nlapiSearchRecord('customlist_payment_method', null, new nlobjSearchFilter('isinactive', null, 'is', 'F'), new nlobjSearchColumn('name'));

	for (var i = 0; rs != null && i < rs.length; i++) {
		arrPaymentMethods.push({
			id: rs[i].getId(),
			name: rs[i].getValue('name'),
		});
	}

	return arrPaymentMethods;
}

/**
 *
 * @returns {Array}
 */
function getPayee(sub) {
	var arrPayee = [
		{
			id: '',
			name: '',
		},
	];

	var filters = [new nlobjSearchFilter('isinactive', null, 'is', 'F')];

	if (!isEmpty(sub)) filters.push(new nlobjSearchFilter('subsidiary', null, 'anyOf', sub));

	var rs = nlapiSearchRecord('entity', null, filters, new nlobjSearchColumn('entityid'));

	for (var i = 0; rs != null && i < rs.length; i++) {
		arrPayee.push({
			id: rs[i].getId(),
			name: rs[i].getValue('entityid'),
		});
	}

	return arrPayee;
}

function getCurrencies() {
	var resultsJSON = [];
	if (!IS_MULTICURRENCY) {
		resultsJSON.push({
			internalid: '1',
			symbol: 'USD',
		});
		return resultsJSON;
	} else {
		var rs = nlapiSearchRecord('currency', null, null, new nlobjSearchColumn('symbol'));

		for (var i = 0; i < rs.length; i++) {
			resultsJSON.push({
				internalid: rs[i].getId(),
				symbol: rs[i].getValue('symbol'),
			});
		}
	}

	return resultsJSON;
}

function getCurrecnyISOCode() {
	var arrMap = [];

	// TODO
	if (!IS_MULTICURRENCY) {
		arrMap[1] = 'USD';

		return arrMap;
	}

	var rs = nlapiSearchRecord('currency', null, null, new nlobjSearchColumn('symbol'));

	for (var i = 0; rs != null && i < rs.length; i++) {
		arrMap[rs[i].getId()] = rs[i].getValue('symbol');
	}
	return arrMap;
}

/**
 *
 * @param subId
 * @returns
 */
function getVendorDAC_CCRPaymentRec(subId) {
	dLog('getVendorDAC_CCRPaymentRec', 'Get Vendor Payment Data by sub id : ' + subId);

	if (subId) {
		var filters = [new nlobjSearchFilter('custrecord_ica_bpm_subsidiary', null, 'anyOf', subId)];

		return nlapiSearchRecord('customrecord_vendorpaymentinfo', VENDOR_PAYMENT_REC_SEARCH, filters);
	} else {
		return nlapiSearchRecord('customrecord_vendorpaymentinfo', VENDOR_PAYMENT_REC_SEARCH);
	}
}

function getAccountMapping(id) {
	dLog('getAccountMapping', 'Get Account Mapping Data..');

	return nlapiSearchRecord('customrecord_ia_vendor_account_mapping', ACCT_MAPPING_REC_SAVED_SEARCH, new nlobjSearchFilter('internalid', null, 'anyOf', id));
}

/**
 *
 */
function removeDuplicates(array) {
	if (isEmpty(array)) {
		return array;
	}

	var arrNew = new Array();
	o: for (var i = 0, n = array.length; i < n; i++) {
		for (var x = 0, y = arrNew.length; x < y; x++) {
			if (arrNew[x] == array[i]) {
				continue o;
			}
		}

		arrNew[arrNew.length] = array[i];
	}

	return arrNew;
}

function rdnsSearchRecord(stRecordType, stSavedSearchId, bGetAllResults, objFilters, objColumns, objFilterExp) {
	var usageThreshold = 40;
	var startRow = 0;
	var endRow = 1000;
	var resultCount = 0;
	var allResults = [];
	var search = stSavedSearchId ? nlapiLoadSearch(stRecordType, stSavedSearchId) : nlapiCreateSearch(stRecordType);
	if (objFilterExp) search.setFilterExpression(objFilterExp);
	if (objFilters) search.addFilters(objFilters);
	if (objColumns) search.addColumns(objColumns);
	var resultSet = search.runSearch();
	do {
		var results = resultSet.getResults(startRow, endRow);
		var remainingUsagePoints = nlapiGetContext().getRemainingUsage();
		if (remainingUsagePoints > usageThreshold && results) {
			resultCount = results.length;
			allResults = allResults.concat(results);
			startRow = endRow;
			endRow = endRow + 1000;
			if (!bGetAllResults) break;
		}
	} while (resultCount > 999);
	return allResults.length > 0 ? allResults : null;
}

function getPostingDate() {
	var arrMonth = [];
	arrMonth[0] = 'Jan';
	arrMonth[1] = 'Feb';
	arrMonth[2] = 'Mar';
	arrMonth[3] = 'Apr';
	arrMonth[4] = 'May';
	arrMonth[5] = 'Jun';
	arrMonth[6] = 'Jul';
	arrMonth[7] = 'Aug';
	arrMonth[8] = 'Sep';
	arrMonth[9] = 'Oct';
	arrMonth[10] = 'Nov';
	arrMonth[11] = 'Dec';

	var today = new Date();

	return arrMonth[today.getMonth()] + ' ' + today.getFullYear();
}


function getAccountMapInfo(isNonSub) {
	dLog('getAccountMapInfo', 'Is Non Sub account ?  =' + isNonSub);

	var results = [];
	var arrBankAccts = [];
	var filters = [['isinactive', 'is', 'F'], 'AND', ['custrecord_acct_map_netsuite_account.type', 'anyof', 'Bank', 'CredCard'], 'AND', ['custrecord_acct_map_netsuite_account.isinactive', 'is', 'F']];
	var columns = [];

	try {
		dLog('Test', JSON.stringify('test'));

		if (!isNonSub) {
			columns.push(new nlobjSearchColumn('subsidiary', 'CUSTRECORD_ACCT_MAP_NETSUITE_ACCOUNT'));
			columns.push(new nlobjSearchColumn('subsidiarynohierarchy', 'CUSTRECORD_ACCT_MAP_NETSUITE_ACCOUNT'));
		}
		columns.push(new nlobjSearchColumn('custrecord_acct_map_sub'));
		columns.push(new nlobjSearchColumn('name'));
		columns.push(new nlobjSearchColumn('custrecord_acct_map_netsuite_account'));
		// columns.push(new nlobjSearchColumn('balance', 'CUSTRECORD_ACCT_MAP_NETSUITE_ACCOUNT'));
		columns.push(new nlobjSearchColumn('custrecord_acct_map_last_cn'));
		columns.push(new nlobjSearchColumn('custrecord_acct_map_init_cheque_number'));
		columns.push(new nlobjSearchColumn('custrecord_acct_map_ext_bank_origin_acc'));

		results = nlapiSearchRecord('customrecord_ia_vendor_account_mapping', null, filters, columns);

		dLog('getAccountMapInfo', JSON.stringify('results'));

		for (var i = 0; results != null && i < results.length; i++) {
			var id = results[i].getId();

			arrBankAccts[id] = {
				id: id,
				name: results[i].getValue('name'),
				subid: !isNonSub ? results[i].getValue('subsidiary', 'CUSTRECORD_ACCT_MAP_NETSUITE_ACCOUNT') : '',
				subtxt: !isNonSub ? results[i].getText('subsidiarynohierarchy', 'CUSTRECORD_ACCT_MAP_NETSUITE_ACCOUNT') : '',
				bank_account: results[i].getValue('custrecord_acct_map_netsuite_account'),
				bank_account_name: results[i].getText('custrecord_acct_map_netsuite_account'),
				bank_balance: results[i].getValue('balance', 'CUSTRECORD_ACCT_MAP_NETSUITE_ACCOUNT'),
				last_cheque_num: results[i].getValue('custrecord_acct_map_last_cn'), //RSF
				init_cheque_num: results[i].getValue('custrecord_acct_map_init_cheque_number'),
			};
		}
	} catch (e) {
		columns.push(new nlobjSearchColumn('custrecord_acct_map_sub'));
		columns.push(new nlobjSearchColumn('name'));
		columns.push(new nlobjSearchColumn('custrecord_acct_map_netsuite_account'));
		// columns.push(new nlobjSearchColumn('balance', 'CUSTRECORD_ACCT_MAP_NETSUITE_ACCOUNT'));
		columns.push(new nlobjSearchColumn('custrecord_acct_map_last_cn'));
		columns.push(new nlobjSearchColumn('custrecord_acct_map_init_cheque_number'));
		columns.push(new nlobjSearchColumn('custrecord_acct_map_ext_bank_origin_acc'));

		results = nlapiSearchRecord('customrecord_ia_vendor_account_mapping', null, filters, columns);
		dErr('getAccountMapInfo', 'removed two columns as this is non-OW');
		for (var i = 0; results != null && i < results.length; i++) {
			var id = results[i].getId();

			arrBankAccts[id] = {
				id: id,
				name: results[i].getValue('name'),
				bank_account: results[i].getValue('custrecord_acct_map_netsuite_account'),
				bank_account_name: results[i].getText('custrecord_acct_map_netsuite_account'),
				bank_balance: results[i].getValue('balance', 'CUSTRECORD_ACCT_MAP_NETSUITE_ACCOUNT'),
				last_cheque_num: results[i].getValue('custrecord_acct_map_last_cn'), //RSF
				init_cheque_num: results[i].getValue('custrecord_acct_map_init_cheque_number'),
			};
		}
	}
  dErr('arrBankAccts', JSON.stringify(arrBankAccts));
	return arrBankAccts;
}

function getPOMap(arrIds) {
	try {
		dAudit('getPOMap:start', arrIds.length);
		arrIds.sort();
		var arr = arrIds;

		if (arr.length == 0) {
			dLog('getPOMap, arr.length is 0', 'Returning...');
			return [];
		}

		var arrMap = [];

		var arrDataTemp = [];
		while (arrIds.length > 999) {
			arr = arrIds.splice(0, arrIds.indexOf(arrIds[999]));
			var filters = [['internalid', 'anyof', arr], 'AND', ['appliedtotransaction.type', 'anyof', 'PurchOrd']];
			var rs = nlapiSearchRecord('vendorbill', null, filters, [new nlobjSearchColumn('tranid', 'appliedtotransaction', null)]);
			arrDataTemp = arrDataTemp.concat(rs);
		}

		var filters = [['internalid', 'anyof', arrIds], 'AND', ['appliedtotransaction.type', 'anyof', 'PurchOrd']];
		var rs = nlapiSearchRecord('vendorbill', null, filters, [new nlobjSearchColumn('tranid', 'appliedtotransaction', null)]);
		if (arrDataTemp.length == 0) {
			arrDataTemp = rs;
		} else {
			arrDataTemp = arrDataTemp.concat(rs);
		}

		var rs = arrDataTemp;
		// dAudit('getPOMap:rs', JSON.stringify(rs));

		for (var i = 0; rs != null && i < rs.length; i++) {
			if ([rs[i]] != null) arrMap[rs[i].getId()] = rs[i].getValue('tranid', 'appliedtotransaction');
		}

		dAudit('getPOMap:arrMap', JSON.stringify(arrMap));
		return arrMap;
	} catch (e) {
		dErr('Something happened.', e.message);
		return arrMap;
	}

	// var arrMap = [];
	// var filters = [["internalid", "anyof", arrIds], "AND", ["appliedtotransaction.type", "anyof", "PurchOrd"]];

	// var rs = nlapiSearchRecord("vendorbill", null, filters, [new nlobjSearchColumn("tranid", "appliedtotransaction", null)]);

	// for (var i = 0; rs != null && i < rs.length; i++) {
	// 	arrMap[rs[i].getId()] = rs[i].getValue('tranid', 'appliedtotransaction');
	// }

	// return arrMap;
}

/**
 *
 * @param strDate
 * @returns
 */
function bpformatDate(strDate) {
	if (isEmpty(strDate)) return '';

	return nlapiStringToDate(strDate).format('{yyyy}-{MM}-{dd}');
}

/**
 *
 * @param bills
 * @returns {Array}
 */
function getPayeeBills(bills) {
	try {
		dAudit('getPayeeBills', 'Get Bill Data for bill ids : ' + bills.length);

		if (bills.length == 0) return [];

		bills.sort();
		var arr = bills;

		var arrPayeeTrans = [];

		var arrDataTemp = [];
		while (bills.length > 999) {
			arr = bills.splice(0, bills.indexOf(bills[999]));
			var filters = [new nlobjSearchFilter('internalid', null, 'anyOf', arr), new nlobjSearchFilter('mainline', null, 'is', 'T')];
			var columns = [new nlobjSearchColumn('name')];
			if (IS_MULTICURRENCY) columns.push(new nlobjSearchColumn('currency'));
			var results = nlapiSearchRecord('transaction', null, filters, columns);

			arrDataTemp = arrDataTemp.concat(results);
		}

		var filters = [new nlobjSearchFilter('internalid', null, 'anyOf', bills), new nlobjSearchFilter('mainline', null, 'is', 'T')];
		var columns = [new nlobjSearchColumn('name')];
		if (IS_MULTICURRENCY) columns.push(new nlobjSearchColumn('currency'));
		var results = nlapiSearchRecord('transaction', null, filters, columns);

		if (arrDataTemp.length == 0) {
			arrDataTemp = results;
		} else {
			arrDataTemp = arrDataTemp.concat(results);
		}

		var results = arrDataTemp;

		for (var i = 0; results != null && i < results.length; i++) {
			var vendor = results[i].getValue('name');
			var curr = IS_MULTICURRENCY ? results[i].getValue('currency') : 1;
			if (vendor) {
				var ndx = vendor + 'X@X' + curr;
				if (arrPayeeTrans[ndx] == null) arrPayeeTrans[ndx] = [];
				arrPayeeTrans[ndx].push(results[i].getId());
			}
		}

		return arrPayeeTrans;
	} catch (e) {
		dErr('getPayeeBills | ERROR ', e.message);
	}

	// try {
	// 	dLog('getPayeeBills', 'Get Bill Data for bill ids : ' + bills);

	// 	var arrPayeeTrans = [];
	// 	var filters = [new nlobjSearchFilter('internalid', null, 'anyOf', bills), new nlobjSearchFilter('mainline', null, 'is', 'T')];
	// 	var columns = [new nlobjSearchColumn('name')];

	// 	if (IS_MULTICURRENCY)
	// 		columns.push(new nlobjSearchColumn('currency'))
	// 	var results = nlapiSearchRecord('transaction', null, filters, columns);

	// 	for (var i = 0; results != null && i < results.length; i++) {
	// 		var vendor = results[i].getValue('name');
	// 		var curr = (IS_MULTICURRENCY) ? results[i].getValue('currency') : 1;
	// 		if (vendor) {
	// 			var ndx = vendor + 'X@X' + curr;
	// 			if (arrPayeeTrans[ndx] == null)
	// 				arrPayeeTrans[ndx] = [];
	// 			arrPayeeTrans[ndx].push(results[i].getId());
	// 		}
	// 	}

	// 	return arrPayeeTrans;
	// } catch (e) {
	// 	dErr('getPayeeBills | ERROR ', e);
	// }
}

/**
 *
 * @param bills
 * @returns {Array}
 */
function getPayeeBillsByPayMethod(bills) {
	try {
		dAudit('getPayeeBillsByPayMethod', 'Get Bill Data for bill ids : ' + bills);

		bills.sort();
		var arr = bills;

		if (arr.length == 0) {
			dLog('getPayeeBillsByPayMethod, arr.length is 0', 'Returning...');
			return [];
		}

		var columns = [new nlobjSearchColumn('name')];
		if (IS_MULTICURRENCY) columns.push(new nlobjSearchColumn('currency'));
		columns.push(new nlobjSearchColumn('custentity_paymentmethod', 'vendor'));
    columns.push(new nlobjSearchColumn('custentity_paymentmethod', 'employee'));

		var arrPayeeTrans = [];
		var arrDataTemp = [];
		while (bills.length > 999) {
			arr = bills.splice(0, bills.indexOf(bills[999]));

			var filters = [new nlobjSearchFilter('internalid', null, 'anyOf', arr), new nlobjSearchFilter('mainline', null, 'is', 'T')];

			var rs = nlapiSearchRecord('transaction', null, filters, columns);
			arrDataTemp = arrDataTemp.concat(rs);
		}

		var filters = [new nlobjSearchFilter('internalid', null, 'anyOf', bills), new nlobjSearchFilter('mainline', null, 'is', 'T')];
		var rs = nlapiSearchRecord('transaction', null, filters, columns);
		if (arrDataTemp.length == 0) {
			arrDataTemp = rs;
		} else {
			arrDataTemp = arrDataTemp.concat(rs);
		}
		var rs = arrDataTemp;
    dLog('getPayeeBillsByPayMethod, rs', JSON.stringify(rs));
		for (var i = 0; rs != null && i < rs.length; i++) {
			var vendor = rs[i].getValue('name');
			var payMethod = rs[i].getText('custentity_paymentmethod', 'vendor');

			if (payMethod) {
				var ndx = payMethod + 'X@X' + vendor;
				if (arrPayeeTrans[ndx] == null) arrPayeeTrans[ndx] = [];
				arrPayeeTrans[ndx].push(rs[i].getId());
			} else {
        var vendor = rs[i].getValue('name');
        var payMethod = rs[i].getText('custentity_paymentmethod', 'employee');
        dLog('getPayeeBillsByPayMethod, vendoremp, paymethod', JSON.stringify({
          vendor: vendor,
          payMethod: payMethod
        }));
        if (payMethod) {
          var ndx = payMethod + 'X@X' + vendor;
          if (arrPayeeTrans[ndx] == null) arrPayeeTrans[ndx] = [];          
          arrPayeeTrans[ndx].push(rs[i].getId());
          dLog('arrPayeeTrans.pushed=' + rs[i].getId(), JSON.stringify(rs[i]) );
        }
      }
		}

    dLog('arrPayeeTrans', JSON.stringify(arrPayeeTrans));

		return arrPayeeTrans;
	} catch (e) {
		dErr('getPayeeBillsByPayMethod | ERROR ', e);
	}
	// try {
	// 	dLog('getPayeeBillsByPayMethod', 'Get Bill Data for bill ids : ' + bills);

	// 	var arrPayeeTrans = [];
	// 	var filters = [new nlobjSearchFilter('internalid', null, 'anyOf', bills), new nlobjSearchFilter('mainline', null, 'is', 'T')];
	// 	var columns = [new nlobjSearchColumn('name'), new nlobjSearchColumn('custentity_paymentmethod', 'vendor')];

	// 	if (IS_MULTICURRENCY)
	// 		columns.push(new nlobjSearchColumn('currency'))

	// 	var results = nlapiSearchRecord('transaction', null, filters, columns);

	// 	for (var i = 0; results != null && i < results.length; i++) {
	// 		var vendor = results[i].getValue('name');
	// 		var curr = (IS_MULTICURRENCY) ? results[i].getValue('currency') : 1;
	// 		var payMethod = results[i].getText('custentity_paymentmethod', 'vendor');

	// 		if (payMethod) {
	// 			var ndx = payMethod + 'X@X' + vendor;
	// 			if (arrPayeeTrans[ndx] == null)
	// 				arrPayeeTrans[ndx] = [];
	// 			arrPayeeTrans[ndx].push(results[i].getId());
	// 		}
	// 	}

	// 	return arrPayeeTrans;
	// } catch (e) {
	// 	dErr('getPayeeBillsByPayMethod | ERROR ', e);
	// }
}

function getExpenseReports(bills) {
	try {
		dAudit('getExpenseReports', 'Get Bill Data for bill ids : ' + bills);

		bills.sort();
		var arr = bills;

		if (arr.length == 0) {
			dLog('getExpenseReports, arr.length is 0', 'Returning...');
			return [];
		}

		var columns = [new nlobjSearchColumn('name')];
    
		if (IS_MULTICURRENCY) columns.push(new nlobjSearchColumn('currency'));
    columns.push(new nlobjSearchColumn('custentity_paymentmethod', 'employee'));
    columns.push(new nlobjSearchColumn('internalid'));

		var arrReturn = [];
		var arrDataTemp = [];
		while (bills.length > 999) {
			arr = bills.splice(0, bills.indexOf(bills[999]));
			var filters = [new nlobjSearchFilter('internalid', null, 'anyOf', arr), new nlobjSearchFilter('mainline', null, 'is', 'T')];
			var rs = nlapiSearchRecord('transaction', null, filters, columns);
			arrDataTemp = arrDataTemp.concat(rs);
		}

		var filters = [new nlobjSearchFilter('internalid', null, 'anyOf', bills), new nlobjSearchFilter('mainline', null, 'is', 'T')];
		var rs = nlapiSearchRecord('transaction', null, filters, columns);
		if (arrDataTemp.length == 0) {
			arrDataTemp = rs;
		} else {
			arrDataTemp = arrDataTemp.concat(rs);
		}
		var rs = arrDataTemp;
    dLog('getExpenseReports, rs', JSON.stringify(rs));
		for (var i = 0; i < rs.length; i++) {
			var emp = rs[i].getValue('name');
			var payMethod = rs[i].getText('custentity_paymentmethod', 'employee');
      dLog('getExpenseReports, emp, payMethod', JSON.stringify({
        emp: emp,
        payMethod: payMethod
      }));
			if (payMethod) {
				// var ndx = payMethod + 'X@X' + emp;
        // dLog('ndx', ndx);    
				// if (arrReturn[ndx] == null) {
        //   arrReturn[ndx] = [];
        //   dLog('added', ndx);    
        // } 
				// arrReturn[ndx].push(rs[i].getValue('internalid'));
        // dLog('arrReturn', JSON.stringify(arrReturn));    
        // dLog('arrReturn[ndx]', JSON.stringify(arrReturn[ndx]));    
        arrReturn.push({
          internalid: rs[i].getValue('internalid'),
          emp: emp,
          payMethod: payMethod,
        });
			}
		}

    dLog('arrReturn', JSON.stringify(arrReturn));

    // var a = [];
    // for (var i=0; i<arrReturn.length; i++) {      
    //   if (a[arrReturn[i].payMethod + 'X@X' + arrReturn[i].emp]) {
    //     a.push(arrReturn[i].internalid);
    //   } else {
    //     a[arrReturn[i].payMethod + 'X@X' + arrReturn[i].emp] = [];
    //     a[arrReturn[i].payMethod + 'X@X' + arrReturn[i].emp].push(arrReturn[i].internalid);
    //   }      
    // }
    // dLog('a', JSON.stringify(a));

		return arrReturn; //JSON.stringify(a);
	} catch (e) {
		dErr('getExpenseReports | ERROR ', e);
	}
}


function getPayeeBillsCurrency(bills) {
	try {
		dAudit('getPayeeBillsCurrency', 'Get Bill Currency for bill ids : ' + bills);

		bills.sort();
		var arr = bills;

		var columns = [new nlobjSearchColumn('name')];
		if (IS_MULTICURRENCY) columns.push(new nlobjSearchColumn('currency'));

		var arrPayeeTrans = [];
		var arrDataTemp = [];

		if (arr.length == 0) {
			dLog('getPayeeBillsCurrency, arr.length is 0', 'Returning...');
			return arrPayeeTrans;
		}

		while (bills.length > 999) {
			arr = bills.splice(0, bills.indexOf(bills[999]));

			var filters = [new nlobjSearchFilter('internalid', null, 'anyOf', arr), new nlobjSearchFilter('mainline', null, 'is', 'T')];

			var rs = nlapiSearchRecord('transaction', null, filters, columns);
			arrDataTemp = arrDataTemp.concat(rs);
		}

		var filters = [new nlobjSearchFilter('internalid', null, 'anyOf', bills), new nlobjSearchFilter('mainline', null, 'is', 'T')];
		var rs = nlapiSearchRecord('transaction', null, filters, columns);
		if (arrDataTemp.length == 0) {
			arrDataTemp = rs;
		} else {
			arrDataTemp = arrDataTemp.concat(rs);
		}
		var rs = arrDataTemp;

		for (var i = 0; rs != null && i < rs.length; i++) {
			var vendor = rs[i].getValue('name');
			var billId = rs[i].getId();

			if (vendor) {
				if (arrPayeeTrans[vendor + billId] == null) arrPayeeTrans[vendor + billId] = [];

				var currId = IS_MULTICURRENCY ? rs[i].getValue('currency') : 1;
				arrPayeeTrans[vendor + billId].push(currId);
			}
		}

		return arrPayeeTrans;
	} catch (e) {
		dErr('getPayeeBillsCurrency | ERROR ', e);
	}

	// try {
	// 	dLog('getPayeeBillsCurrency', 'Get Bill Currency for bill ids : ' + bills);

	// 	var arrPayeeTrans = [];
	// 	var filters = [new nlobjSearchFilter('internalid', null, 'anyOf', bills), new nlobjSearchFilter('mainline', null, 'is', 'T')];
	// 	var columns = [new nlobjSearchColumn('name')];

	// 	if (IS_MULTICURRENCY)
	// 		columns.push(new nlobjSearchColumn('currency'))

	// 	var rs = nlapiSearchRecord('transaction', null, filters, columns);

	// 	for (var i = 0; rs != null && i < rs.length; i++) {

	// 		var vendor = rs[i].getValue('name');
	// 		var billId = rs[i].getId();

	// 		if (vendor) {

	// 			if (arrPayeeTrans[vendor + billId] == null)
	// 				arrPayeeTrans[vendor + billId] = [];

	// 			var currId = (IS_MULTICURRENCY) ? rs[i].getValue('currency') : 1;
	// 			arrPayeeTrans[vendor + billId].push(currId);
	// 		}
	// 	}

	// 	return arrPayeeTrans;
	// } catch (e) {
	// 	dErr('getPayeeBillsCurrency | ERROR ', e);
	// }
}

function getPayeeBillsMemo(arrPayee) {
	try {
		dAudit('getPayeeBillsMemo', 'Get Bill Memo for payee ids : ' + arrPayee);

		arrPayee.sort();
		var arr = arrPayee;

		if (arr.length == 0) return '';

		var arrPayeeMemo = [];

		var arrDataTemp = [];
		while (arrPayee.length > 999) {
			arr = arrPayee.splice(0, arrPayee.indexOf(arrPayee[999]));
			var filters = [new nlobjSearchFilter('internalid', null, 'anyOf', arr)];
			var rs = nlapiSearchRecord('entity', null, filters, new nlobjSearchColumn('custentity_ica_vendor_bank_instructions'));
			arrDataTemp = arrDataTemp.concat(rs);
		}

		var filters = [new nlobjSearchFilter('internalid', null, 'anyOf', arrPayee)];
		var rs = nlapiSearchRecord('entity', null, filters, new nlobjSearchColumn('custentity_ica_vendor_bank_instructions'));
		if (arrDataTemp.length == 0) {
			arrDataTemp = rs;
		} else {
			arrDataTemp = arrDataTemp.concat(rs);
		}

		var rs = arrDataTemp;

		for (var i = 0; rs != null && i < rs.length; i++) {
			arrPayeeMemo[rs[i].getId()] = rs[i].getValue('custentity_ica_vendor_bank_instructions');
		}

		return arrPayeeMemo;
	} catch (e) {
		dErr('getPayeeBillsMemo | ERROR ', e);
	}

	// try {
	// 	dLog('getPayeeBillsMemo', 'Get Bill Memo for payee ids : ' + arrPayee);

	// 	var arrPayeeMemo = [];
	// 	var filters = [new nlobjSearchFilter('internalid', null, 'anyOf', arrPayee)];
	// 	var rs = nlapiSearchRecord('entity', null, filters, new nlobjSearchColumn('custentity_ica_vendor_bank_instructions'));

	// 	for (var i = 0; rs != null && i < rs.length; i++) {

	// 		arrPayeeMemo[rs[i].getId()] = rs[i].getValue('custentity_ica_vendor_bank_instructions');
	// 	}

	// 	return arrPayeeMemo;
	// } catch (e) {
	// 	dErr('getPayeeBillsMemo | ERROR ', e);
	// }
}

function validateVendorColumn(column) {
	try {
		dLog('validating Vendor Column', column);
		if (column == undefined || column == '') {
			log.audit('validateVendorColumn', 'No column defined, nothing will be added. Returning true');
			return true;
		}

		var col = new nlobjSearchColumn(column);
		var s = nlapiSearchRecord('vendor', null, null, col);
	} catch (e) {
		dLog('validateVendorColumn', 'Column is invalid, returning false');
		return false;
	}
	dLog('Column is valid, returning true');
	return true;
}

function validateBillColumn(column) {
	try {
		dLog('column', column);
		if (column == undefined || column == '' || column == null) {
			dLog('Column is null, returning true');
			return true;
		}

		var col = new nlobjSearchColumn(column);
		var s = nlapiSearchRecord('vendorbill', null, null, col);
	} catch (e) {
		dLog('Column is invalid, returning false');
		return false;
	}
	dLog('Column is valid, returning true');
	return true;
}

function validateBillColumns(columns) {
	try {
		dLog('columns', columns);
		var col = [];
		for (var i = 0; i < columns.length; i++) {
			col.push(new nlobjSearchColumn(columns[i]));
		}
		var s = nlapiSearchRecord('vendorbill', null, null, col);
	} catch (e) {
		dLog('One of the columns are invalid, returning false');
		return false;
	}
	dLog('All columns valid, returning true');
	return true;
}

/**
 * 14/07/2016 : Al can we make this pull the Vendor internal Id please, we can
 * then get rid of the merchant id field
 *
 * @param ids
 * @returns {Array}
 */
function getEntityData(ids) { //
	try {
		dAudit('getEntityData', 'Get Entity Data for ids : ' + ids);
		var validColumn = '';
		var validColumn2 = '';
		if (CUSTOM_REFINFO) {
			validColumn = validateVendorColumn(CUSTOM_REFINFO);
		}
		if (UNIONBANK_VENDOR_ID) {
			validColumn2 = validateVendorColumn(UNIONBANK_VENDOR_ID);
		}

		var arrEntities = [];
		var arrDataTemp = [];
		var lastId = -100;

		var columns = [];
		columns.push(new nlobjSearchColumn('internalid').setSort());
		columns.push(new nlobjSearchColumn('category'));
		columns.push(new nlobjSearchColumn('custentity_paymentmethod'));
		columns.push(new nlobjSearchColumn('custentity_currency'));
		columns.push(new nlobjSearchColumn('custentity_recpartyaccttype'));
		columns.push(new nlobjSearchColumn('custentity_recpartyaccount'));
		columns.push(new nlobjSearchColumn('custentity_recbankprimidtype'));
		columns.push(new nlobjSearchColumn('custentity_recbankprimid'));
		columns.push(new nlobjSearchColumn('custentity_vendorname'));
		columns.push(new nlobjSearchColumn('custentity_vendoraddline1'));
		columns.push(new nlobjSearchColumn('custentity_vendoraddline2'));
		columns.push(new nlobjSearchColumn('custentity_vendor_phone_num'));
		columns.push(new nlobjSearchColumn('custentity_vendorcity'));
		columns.push(new nlobjSearchColumn('custentity_vendorstateprovince'));
		columns.push(new nlobjSearchColumn('custentity_vendorpostalcode'));
		columns.push(new nlobjSearchColumn('custentity_vendorcountrycode'));
		columns.push(new nlobjSearchColumn('custentity_merchantid'));
		columns.push(new nlobjSearchColumn('email'));
		columns.push(new nlobjSearchColumn('custentity_payee_email'));
		columns.push(new nlobjSearchColumn('custentity_bankname'));
		columns.push(new nlobjSearchColumn('custentity_bankaddressline1'));
		columns.push(new nlobjSearchColumn('custentity_bankcity'));
		columns.push(new nlobjSearchColumn('custentity_bankstate'));
		columns.push(new nlobjSearchColumn('custentity_bankpostcode'));
		columns.push(new nlobjSearchColumn('custentity_bankcountrycode'));
		columns.push(new nlobjSearchColumn('custentity_paymentformat'));
		columns.push(new nlobjSearchColumn('custentity_interpayformat'));
		columns.push(new nlobjSearchColumn('custentity_vendorbranchbankircid'));
		columns.push(new nlobjSearchColumn('custentity_forex_ref_type'));
		columns.push(new nlobjSearchColumn('custentity_forex_ref_id'));
		columns.push(new nlobjSearchColumn('custentity_pmp_dac_delivery_contact_name'));
		columns.push(new nlobjSearchColumn('custentity_pmp_dac_delivery_email_addres'));
		columns.push(new nlobjSearchColumn('custentity_courier_name'));
		columns.push(new nlobjSearchColumn('custentity_courier_account'));
		columns.push(new nlobjSearchColumn('custentity_courier_deliverycode'));
		columns.push(new nlobjSearchColumn('custentity_inter_bank_id_type'));
		columns.push(new nlobjSearchColumn('custentity_inter_bank_name'));
		columns.push(new nlobjSearchColumn('custentity_inter_bank_id'));
		columns.push(new nlobjSearchColumn('custentity_inter_bank_address_1'));
		columns.push(new nlobjSearchColumn('custentity_inter_bank_city'));
		columns.push(new nlobjSearchColumn('custentity_inter_bank_state'));
		columns.push(new nlobjSearchColumn('custentity_inter_bank_postal'));
		columns.push(new nlobjSearchColumn('custentity_inter_bank_country'));
		columns.push(new nlobjSearchColumn('custentity_check_style'));
		columns.push(new nlobjSearchColumn('custentity_pmp_biller_id'));
		columns.push(new nlobjSearchColumn('custentity_fas'));
		columns.push(new nlobjSearchColumn('custentity_ica_bill_pymt_single'));
		columns.push(new nlobjSearchColumn('custentity_ica_vendor_bank_instructions'));
		columns.push(new nlobjSearchColumn('custentity_ica_entity_check_insert_type'));
		columns.push(new nlobjSearchColumn('custentity_ica_entity_check_insert_value'));
		columns.push(new nlobjSearchColumn('custentity_ica_vendor_external_id'));
		columns.push(new nlobjSearchColumn('entityid'));
		columns.push(new nlobjSearchColumn('custentity_ica_bpm_is_fleet'));
		columns.push(new nlobjSearchColumn('custentity_ica_bns_use_iban'));
		columns.push(new nlobjSearchColumn('custentity_ica_location_code'));
    columns.push(new nlobjSearchColumn('custentity_ica_vendorname2'));

    // columns.push(new nlobjSearchColumn('custentity_ica_memo_internal_id'));

		if (OVERWRITE_REFINFO == 'T' && CUSTOM_REFINFO != '') {
			if (validColumn) {
				columns.push(new nlobjSearchColumn(CUSTOM_REFINFO));
			}
		}
		if (validColumn2) {
			columns.push(new nlobjSearchColumn(UNIONBANK_VENDOR_ID));
		}

		do {
			var filters = [];
			if (ids != null && ids != '') {
				filters.push(['internalid', 'anyof', ids]);
				filters.push('AND');
			}
			filters.push(['internalidnumber', 'greaterthan', lastId]);
			filters.push('AND');
			filters.push(['isinactive', 'is', 'F']);

			var tempResults = nlapiSearchRecord('vendor', null, filters, columns);
			if (tempResults) {
				lastId = tempResults[tempResults.length - 1].getId();
				arrDataTemp = arrDataTemp.concat(tempResults);
			}
		} while (tempResults && tempResults.length == 1000);

		for (var x = 0; x < arrDataTemp.length; x++) {
			// var id = arrDataTemp[x].getValue('internalid');
			var value = {
				internalid: arrDataTemp[x].getValue('internalid'),
				paymentmethod: arrDataTemp[x].getText('custentity_paymentmethod'),
				currency: arrDataTemp[x].getValue('custentity_currency'),
				recpartyaccttype: arrDataTemp[x].getText('custentity_recpartyaccttype'),
				recpartyaccount: arrDataTemp[x].getValue('custentity_recpartyaccount'),
				recbankprimidtype: arrDataTemp[x].getText('custentity_recbankprimidtype'),
				recbankprimid: arrDataTemp[x].getValue('custentity_recbankprimid'),
				vendorname: arrDataTemp[x].getValue('custentity_vendorname'),
				vendoraddrs1: arrDataTemp[x].getValue('custentity_vendoraddline1'),
				vendoraddrs2: arrDataTemp[x].getValue('custentity_vendoraddline2'),
				vendorphone: arrDataTemp[x].getValue('custentity_vendor_phone_num'),
				vendorcity: arrDataTemp[x].getValue('custentity_vendorcity'),
				vendorstateprovince: arrDataTemp[x].getValue('custentity_vendorstateprovince'),
				vendorpostal: arrDataTemp[x].getValue('custentity_vendorpostalcode'),
				vendorcountrycode: arrDataTemp[x].getText('custentity_vendorcountrycode'),
				merchantid: arrDataTemp[x].getValue('internalid'),
				email: arrDataTemp[x].getValue('email'),
				vemailadrs: arrDataTemp[x].getValue('custentity_payee_email'),
				vbankname: arrDataTemp[x].getValue('custentity_bankname'),
				vbankaddrs1: arrDataTemp[x].getValue('custentity_bankaddressline1'),
				vbankcity: arrDataTemp[x].getValue('custentity_bankcity'),
				vbankstate: arrDataTemp[x].getValue('custentity_bankstate'),
				vbankzip: arrDataTemp[x].getValue('custentity_bankpostcode'),
				vbankcountry: arrDataTemp[x].getText('custentity_bankcountrycode'),
				payformat: arrDataTemp[x].getText('custentity_paymentformat'),
				pmformatintl: arrDataTemp[x].getValue('custentity_interpayformat'),
				bankid: arrDataTemp[x].getValue('custentity_vendorbranchbankircid'),
				fx_reftype: arrDataTemp[x].getText('custentity_forex_ref_type'),
				fx_refid: arrDataTemp[x].getValue('custentity_forex_ref_id'),
				pmp_dac_contactname: arrDataTemp[x].getValue('custentity_pmp_dac_delivery_contact_name'),
				pmp_dac_emailaddress: arrDataTemp[x].getValue('custentity_pmp_dac_delivery_email_addres'),
				couriername: arrDataTemp[x].getValue('custentity_courier_name'),
				courieraccount: arrDataTemp[x].getValue('custentity_courier_account'),
				deliverycode: arrDataTemp[x].getText('custentity_courier_deliverycode'),
				custentity_inter_bank_id_type: arrDataTemp[x].getText('custentity_inter_bank_id_type'),
				custentity_inter_bank_name: arrDataTemp[x].getValue('custentity_inter_bank_name'),
				custentity_inter_bank_id: arrDataTemp[x].getValue('custentity_inter_bank_id'),
				custentity_inter_bank_address_1: arrDataTemp[x].getValue('custentity_inter_bank_address_1'),
				custentity_inter_bank_city: arrDataTemp[x].getValue('custentity_inter_bank_city'),
				custentity_inter_bank_state: arrDataTemp[x].getValue('custentity_inter_bank_state'),
				custentity_inter_bank_postal: arrDataTemp[x].getValue('custentity_inter_bank_postal'),
				custentity_inter_bank_country: arrDataTemp[x].getText('custentity_inter_bank_country'),
				custentity_check_style: arrDataTemp[x].getText('custentity_check_style'),
				custentity_pmp_biller_id: arrDataTemp[x].getText('custentity_pmp_biller_id'),
				custentity_fas: arrDataTemp[x].getValue('custentity_fas'),
				custentity_ica_bill_pymt_single: arrDataTemp[x].getValue('custentity_ica_bill_pymt_single'),
				custentity_ica_vendor_bank_instructions: arrDataTemp[x].getValue('custentity_ica_vendor_bank_instructions'),
				custentity_ica_entity_check_insert_type: arrDataTemp[x].getValue('custentity_ica_entity_check_insert_type'),
				custentity_ica_entity_check_insert_value: arrDataTemp[x].getValue('custentity_ica_entity_check_insert_value'),
				custentity_ica_vendor_external_id: arrDataTemp[x].getValue('custentity_ica_vendor_external_id'),
				entityid: arrDataTemp[x].getValue('entityid'),
				category: arrDataTemp[x].getText('category'),
				custentity_ica_bpm_is_fleet: arrDataTemp[x].getValue('custentity_ica_bpm_is_fleet'),
				custentity_ica_bns_use_iban: arrDataTemp[x].getValue('custentity_ica_bns_use_iban'),
				custentity_ica_location_code: arrDataTemp[x].getValue('custentity_ica_location_code'),
        custentity_ica_vendorname2: arrDataTemp[x].getValue('custentity_ica_vendorname2'),
        // custentity_ica_memo_internal_id: arrDataTemp[x].getValue('custentity_ica_memo_internal_id'),
			};
			if (validColumn) {
				value[CUSTOM_REFINFO] = arrDataTemp[x].getValue(CUSTOM_REFINFO);
			}
			if (validColumn2) {
				value[UNIONBANK_VENDOR_ID] = arrDataTemp[x].getValue(UNIONBANK_VENDOR_ID);
        value[UNIONBANK_VENDOR_ID] = arrDataTemp[x].getValue(UNIONBANK_VENDOR_ID);
			}

      

			arrEntities.push(value);
		}

		// for (x in arrDataTemp) {
		//         dLog('x', x);
		//         dLog('arrDataTemp[x]', arrDataTemp[x]);
		// 	var id = arrDataTemp[x].getValue('internalid');
		//         if (!id) continue;
		// 	if (arrEntities[id] == null) arrEntities[id] = [];
		// 	arrEntities[id] = {
		// 		internalid: arrDataTemp[x].getValue('internalid'),
		// 		paymentmethod: arrDataTemp[x].getText('custentity_paymentmethod'),
		// 		currency: arrDataTemp[x].getValue('custentity_currency'),
		// 		recpartyaccttype: arrDataTemp[x].getText('custentity_recpartyaccttype'),
		// 		recpartyaccount: arrDataTemp[x].getValue('custentity_recpartyaccount'),
		// 		recbankprimidtype: arrDataTemp[x].getText('custentity_recbankprimidtype'),
		// 		recbankprimid: arrDataTemp[x].getValue('custentity_recbankprimid'),
		// 		vendorname: arrDataTemp[x].getValue('custentity_vendorname'),
		// 		vendoraddrs1: arrDataTemp[x].getValue('custentity_vendoraddline1'),
		// 		vendoraddrs2: arrDataTemp[x].getValue('custentity_vendoraddline2'),
		// 		vendorphone: arrDataTemp[x].getValue('custentity_vendor_phone_num'),
		// 		vendorcity: arrDataTemp[x].getValue('custentity_vendorcity'),
		// 		vendorstateprovince: arrDataTemp[x].getValue('custentity_vendorstateprovince'),
		// 		vendorpostal: arrDataTemp[x].getValue('custentity_vendorpostalcode'),
		// 		vendorcountrycode: arrDataTemp[x].getText('custentity_vendorcountrycode'),
		// 		merchantid: arrDataTemp[x].getValue('internalid'),
		// 		email: arrDataTemp[x].getValue('email'),
		// 		vemailadrs: arrDataTemp[x].getValue('custentity_payee_email'),
		// 		vbankname: arrDataTemp[x].getValue('custentity_bankname'),
		// 		vbankaddrs1: arrDataTemp[x].getValue('custentity_bankaddressline1'),
		// 		vbankcity: arrDataTemp[x].getValue('custentity_bankcity'),
		// 		vbankstate: arrDataTemp[x].getValue('custentity_bankstate'),
		// 		vbankzip: arrDataTemp[x].getValue('custentity_bankpostcode'),
		// 		vbankcountry: arrDataTemp[x].getText('custentity_bankcountrycode'),
		// 		payformat: arrDataTemp[x].getText('custentity_paymentformat'),
		// 		pmformatintl: arrDataTemp[x].getValue('custentity_interpayformat'),
		// 		bankid: arrDataTemp[x].getValue('custentity_vendorbranchbankircid'),
		// 		fx_reftype: arrDataTemp[x].getText('custentity_forex_ref_type'),
		// 		fx_refid: arrDataTemp[x].getValue('custentity_forex_ref_id'),
		// 		pmp_dac_contactname: arrDataTemp[x].getValue('custentity_pmp_dac_delivery_contact_name'),
		// 		pmp_dac_emailaddress: arrDataTemp[x].getValue('custentity_pmp_dac_delivery_email_addres'),
		// 		couriername: arrDataTemp[x].getValue('custentity_courier_name'),
		// 		courieraccount: arrDataTemp[x].getValue('custentity_courier_account'),
		// 		deliverycode: arrDataTemp[x].getText('custentity_courier_deliverycode'),
		// 		custentity_inter_bank_id_type: arrDataTemp[x].getText('custentity_inter_bank_id_type'),
		// 		custentity_inter_bank_name: arrDataTemp[x].getValue('custentity_inter_bank_name'),
		// 		custentity_inter_bank_id: arrDataTemp[x].getValue('custentity_inter_bank_id'),
		// 		custentity_inter_bank_address_1: arrDataTemp[x].getValue('custentity_inter_bank_address_1'),
		// 		custentity_inter_bank_city: arrDataTemp[x].getValue('custentity_inter_bank_city'),
		// 		custentity_inter_bank_state: arrDataTemp[x].getValue('custentity_inter_bank_state'),
		// 		custentity_inter_bank_postal: arrDataTemp[x].getValue('custentity_inter_bank_postal'),
		// 		custentity_inter_bank_country: arrDataTemp[x].getText('custentity_inter_bank_country'),
		// 		custentity_check_style: arrDataTemp[x].getText('custentity_check_style'),
		// 		custentity_pmp_biller_id: arrDataTemp[x].getText('custentity_pmp_biller_id'),
		// 		custentity_fas: arrDataTemp[x].getValue('custentity_fas'),
		// 		custentity_ica_bill_pymt_single: arrDataTemp[x].getValue('custentity_ica_bill_pymt_single'),
		// 		custentity_ica_vendor_bank_instructions: arrDataTemp[x].getValue('custentity_ica_vendor_bank_instructions'),
		// 		custentity_ica_entity_check_insert_type: arrDataTemp[x].getValue('custentity_ica_entity_check_insert_type'),
		// 		custentity_ica_entity_check_insert_value: arrDataTemp[x].getValue('custentity_ica_entity_check_insert_value'),
		// 		custentity_ica_vendor_external_id: arrDataTemp[x].getValue('custentity_ica_vendor_external_id'),
		// 		entityid: arrDataTemp[x].getValue('entityid'),
		// 		category: arrDataTemp[x].getText('category'),
		// 		custentity_ica_bpm_is_fleet: arrDataTemp[x].getValue('custentity_ica_bpm_is_fleet'),
		//                 custentity_ica_bns_use_iban: arrDataTemp[x].getValue('custentity_ica_bns_use_iban')
		// 	};
		// 	if (validColumn) {
		// 		arrEntities[id][CUSTOM_REFINFO] = arrDataTemp[x].getValue(CUSTOM_REFINFO);
		// 	}
		// }

		dLog('arrEntities', JSON.stringify(arrEntities));
		// arrEntities = _.compact(arrEntities);
		// dLog('arrEntities compact', JSON.stringify(arrEntities));

		return arrEntities; //_.without(arrEntities, null);
	} catch (e) {
		dErr('getEntityData | ERROR ', e);
	}
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

    var objAcctMapping = getAccountMapping(ACCOUNT);
    var sub = objAcctMapping[0].getValue('custrecord_acct_map_sub');
    
    var subSearch = nlapiSearchRecord('customrecord_ica_mpm_subsidiary',null,
    [
      // ['custrecord_ica_mpms_subsidiary','anyof',sub],
      // 'AND', 
    ['custrecord_ica_mpms_vendor','anyof',ids]
    ], 
    [
      new nlobjSearchColumn("custrecord_ica_mpms_vendor"), 
      new nlobjSearchColumn("custrecord_ica_mpms_subsidiary")
    ]);

    var subIds = [];
    if (subSearch) {
      for (var i=0; i<subSearch.length; i++) {
        subIds.push(subSearch[i].getId());
      }      
    }

		dAudit('getEntityData-new', 'Get Entity Data for ids : ' + subIds);

		var arrEntities = [];
		var arrDataTemp = [];
		var lastId = -100;

		var columns = [];
    columns.push(new nlobjSearchColumn('internalid','CUSTRECORD_ICA_MPMP_ENTITY',null).setSort());
    columns.push(new nlobjSearchColumn('entityid','CUSTRECORD_ICA_MPMP_ENTITY',null));    
    columns.push(new nlobjSearchColumn('custrecord_ica_mpmp_subsidiary'));
    columns.push(new nlobjSearchColumn('custrecord_ica_mpmp_default'));
    columns.push(new nlobjSearchColumn('custrecord_ica_mpmp_currency'));    
    columns.push(new nlobjSearchColumn('custrecord_ica_mpmp_pm'));
    columns.push(new nlobjSearchColumn('custrecord_ica_mpmp_pymt_format'));
    columns.push(new nlobjSearchColumn('custrecord_ica_mpmp_recbankprimidtype'));
    columns.push(new nlobjSearchColumn('custrecord_ica_mpmp_recbankprimid'));
    columns.push(new nlobjSearchColumn('custrecord_ica_mpmp_recpartyaccount'));
    columns.push(new nlobjSearchColumn('custrecord_ica_mpmp_vendorbranchbankirc'));
    columns.push(new nlobjSearchColumn('custrecord_ica_mpmp_interpayformat'));
    columns.push(new nlobjSearchColumn('custrecord_ica_mpmp_forex_ref_id'));
    columns.push(new nlobjSearchColumn('custrecord_ica_mpmp_forex_ref_type'));
    columns.push(new nlobjSearchColumn('custrecord_ica_mpmp_recpartyaccttype'));
    columns.push(new nlobjSearchColumn('custrecord_ica_mpmp_ica_location_code'));
    columns.push(new nlobjSearchColumn('custrecord_ica_mpmp_vendorname'));
    columns.push(new nlobjSearchColumn('custrecord_ica_mpmp_vendoraddline1'));
    columns.push(new nlobjSearchColumn('custrecord_ica_mpmp_vendoraddline2'));
    columns.push(new nlobjSearchColumn('custrecord_ica_mpmp_vendorcity'));
    columns.push(new nlobjSearchColumn('custrecord_ica_mpmp_vendorstateprovince'));
    columns.push(new nlobjSearchColumn('custrecord_ica_mpmp_vendorcountrycode'));
    columns.push(new nlobjSearchColumn('custrecord_ica_mpmp_vendorpostalcode'));
    columns.push(new nlobjSearchColumn('custrecord_ica_mpmp_pmp_dac_email_adr'));
    columns.push(new nlobjSearchColumn('custrecord_ica_mpmp_pmp_dac_contact_name'));
    columns.push(new nlobjSearchColumn('custrecord_ica_mpmp_courier_deliverycode'));
    columns.push(new nlobjSearchColumn('custrecord_ica_mpmp_vendor_bank_instruct'));
    columns.push(new nlobjSearchColumn('custrecord_ica_mpmp_bankname'));
    columns.push(new nlobjSearchColumn('custrecord_ica_mpmp_bankaddressline1'));
    columns.push(new nlobjSearchColumn('custrecord_ica_mpmp_bankcity'));
    columns.push(new nlobjSearchColumn('custrecord_ica_mpmp_bankstate'));
    columns.push(new nlobjSearchColumn('custrecord_ica_mpmp_bankcountrycode'));
    columns.push(new nlobjSearchColumn('custrecord_ica_mpmp_bankpostalcode'));
    columns.push(new nlobjSearchColumn('custrecord_ica_mpmp_payee_email'));
    columns.push(new nlobjSearchColumn('custrecord_ica_mpmp_inter_bank_id_type'));
    columns.push(new nlobjSearchColumn('custrecord_ica_mpmp_inter_bank_id'));
    columns.push(new nlobjSearchColumn('custrecord_ica_mpmp_inter_bank_name'));
    columns.push(new nlobjSearchColumn('custrecord_ica_mpmp_inter_bank_address_1'));
    columns.push(new nlobjSearchColumn('custrecord_ica_mpmp_inter_bank_city'));
    columns.push(new nlobjSearchColumn('custrecord_ica_mpmp_inter_bank_state'));
    columns.push(new nlobjSearchColumn('custrecord_ica_mpmp_inter_bank_country'));
    columns.push(new nlobjSearchColumn('custrecord_ica_mpmp_inter_bank_postal'));
		// columns.push(new nlobjSearchColumn('internalid').setSort());
		// columns.push(new nlobjSearchColumn('category'));
		// columns.push(new nlobjSearchColumn('custentity_paymentmethod'));
		// columns.push(new nlobjSearchColumn('custentity_currency'));
		// columns.push(new nlobjSearchColumn('custentity_recpartyaccttype'));
		// columns.push(new nlobjSearchColumn('custentity_recpartyaccount'));
		// columns.push(new nlobjSearchColumn('custentity_recbankprimidtype'));
		// columns.push(new nlobjSearchColumn('custentity_recbankprimid'));
		// columns.push(new nlobjSearchColumn('custentity_vendorname'));
		// columns.push(new nlobjSearchColumn('custentity_vendoraddline1'));
		// columns.push(new nlobjSearchColumn('custentity_vendoraddline2'));
		// columns.push(new nlobjSearchColumn('custentity_vendor_phone_num'));
		// columns.push(new nlobjSearchColumn('custentity_vendorcity'));
		// columns.push(new nlobjSearchColumn('custentity_vendorstateprovince'));
		// columns.push(new nlobjSearchColumn('custentity_vendorpostalcode'));
		// columns.push(new nlobjSearchColumn('custentity_vendorcountrycode'));
		// columns.push(new nlobjSearchColumn('custentity_merchantid'));
		// columns.push(new nlobjSearchColumn('email'));
		// columns.push(new nlobjSearchColumn('custentity_payee_email'));
		// columns.push(new nlobjSearchColumn('custentity_bankname'));
		// columns.push(new nlobjSearchColumn('custentity_bankaddressline1'));
		// columns.push(new nlobjSearchColumn('custentity_bankcity'));
		// columns.push(new nlobjSearchColumn('custentity_bankstate'));
		// columns.push(new nlobjSearchColumn('custentity_bankpostcode'));
		// columns.push(new nlobjSearchColumn('custentity_bankcountrycode'));
		// columns.push(new nlobjSearchColumn('custentity_paymentformat'));
		// columns.push(new nlobjSearchColumn('custentity_interpayformat'));
		// columns.push(new nlobjSearchColumn('custentity_vendorbranchbankircid'));
		// columns.push(new nlobjSearchColumn('custentity_forex_ref_type'));
		// columns.push(new nlobjSearchColumn('custentity_forex_ref_id'));
		// columns.push(new nlobjSearchColumn('custentity_pmp_dac_delivery_contact_name'));
		// columns.push(new nlobjSearchColumn('custentity_pmp_dac_delivery_email_addres'));
		// columns.push(new nlobjSearchColumn('custentity_courier_name'));
		// columns.push(new nlobjSearchColumn('custentity_courier_account'));
		// columns.push(new nlobjSearchColumn('custentity_courier_deliverycode'));
		// columns.push(new nlobjSearchColumn('custentity_inter_bank_id_type'));
		// columns.push(new nlobjSearchColumn('custentity_inter_bank_name'));
		// columns.push(new nlobjSearchColumn('custentity_inter_bank_id'));
		// columns.push(new nlobjSearchColumn('custentity_inter_bank_address_1'));
		// columns.push(new nlobjSearchColumn('custentity_inter_bank_city'));
		// columns.push(new nlobjSearchColumn('custentity_inter_bank_state'));
		// columns.push(new nlobjSearchColumn('custentity_inter_bank_postal'));
		// columns.push(new nlobjSearchColumn('custentity_inter_bank_country'));
		columns.push(new nlobjSearchColumn('custentity_check_style', 'CUSTRECORD_ICA_MPMP_ENTITY'));
		columns.push(new nlobjSearchColumn('custentity_pmp_biller_id', 'CUSTRECORD_ICA_MPMP_ENTITY'));
		columns.push(new nlobjSearchColumn('custentity_fas', 'CUSTRECORD_ICA_MPMP_ENTITY'));
		columns.push(new nlobjSearchColumn('custentity_ica_bill_pymt_single', 'CUSTRECORD_ICA_MPMP_ENTITY'));
		columns.push(new nlobjSearchColumn('custentity_ica_vendor_bank_instructions', 'CUSTRECORD_ICA_MPMP_ENTITY'));
		columns.push(new nlobjSearchColumn('custentity_ica_entity_check_insert_type', 'CUSTRECORD_ICA_MPMP_ENTITY'));
		columns.push(new nlobjSearchColumn('custentity_ica_entity_check_insert_value', 'CUSTRECORD_ICA_MPMP_ENTITY'));
		columns.push(new nlobjSearchColumn('custentity_ica_vendor_external_id', 'CUSTRECORD_ICA_MPMP_ENTITY'));
		// columns.push(new nlobjSearchColumn('entityid'));
		columns.push(new nlobjSearchColumn('custentity_ica_bpm_is_fleet', 'CUSTRECORD_ICA_MPMP_ENTITY'));
		columns.push(new nlobjSearchColumn('custentity_ica_bns_use_iban', 'CUSTRECORD_ICA_MPMP_ENTITY'));
		columns.push(new nlobjSearchColumn('custentity_ica_location_code', 'CUSTRECORD_ICA_MPMP_ENTITY'));

		do {
			var filters = [];
			// if (subIds != null && subIds != '') {
				filters.push(['custrecord_ica_mpmp_subsidiary', 'anyof', subIds]);
				filters.push('AND');        
				// filters.push(['custrecord_ica_mpmp_entity.internalid', 'anyof', ids]);
				// filters.push('AND');        
				// filters.push(['custrecord_ica_mpmp_default', 'is', 'T']);
				// filters.push('AND');
			// }
			// filters.push(['custrecord_ica_mpmp_entity.internalidnumber', 'greaterthan', lastId]);
			// filters.push('AND');
			filters.push(['isinactive', 'is', 'F']);

			var tempResults = nlapiSearchRecord('customrecord_ica_mpm_pymt_method', null, filters, columns);
			if (tempResults) {
				// lastId = tempResults[tempResults.length - 1].getId();
				arrDataTemp = arrDataTemp.concat(tempResults);
			}
		} while (tempResults && tempResults.length == 1000);



		for (var x = 0; x < arrDataTemp.length; x++) {
			// var id = arrDataTemp[x].getValue('internalid');
			var value = {
				internalid: arrDataTemp[x].getValue('internalid', 'CUSTRECORD_ICA_MPMP_ENTITY'),
				paymentmethod: arrDataTemp[x].getText('custrecord_ica_mpmp_pm'),
				currency: arrDataTemp[x].getValue('custrecord_ica_mpmp_currency'),
				recpartyaccttype: arrDataTemp[x].getText('custrecord_ica_mpmp_recpartyaccttype'),
				recpartyaccount: arrDataTemp[x].getValue('custrecord_ica_mpmp_recpartyaccount'),
				recbankprimidtype: arrDataTemp[x].getText('custrecord_ica_mpmp_recbankprimidtype'),
				recbankprimid: arrDataTemp[x].getValue('custrecord_ica_mpmp_recbankprimid'),
				vendorname: arrDataTemp[x].getValue('custrecord_ica_mpmp_vendorname'),
				vendoraddrs1: arrDataTemp[x].getValue('custrecord_ica_mpmp_vendoraddline1'),
				vendoraddrs2: arrDataTemp[x].getValue('custrecord_ica_mpmp_vendoraddline2'),
				vendorphone: arrDataTemp[x].getValue('custrecord_ica_mpmp_vendor_phone_num'),
				vendorcity: arrDataTemp[x].getValue('custrecord_ica_mpmp_vendorcity'),
				vendorstateprovince: arrDataTemp[x].getValue('custrecord_ica_mpmp_vendorstateprovince'),
				vendorpostal: arrDataTemp[x].getValue('custrecord_ica_mpmp_vendorpostalcode'),
				vendorcountrycode: arrDataTemp[x].getText('custrecord_ica_mpmp_vendorcountrycode'),
				merchantid: arrDataTemp[x].getValue('internalid'),
				email: arrDataTemp[x].getValue('email'),
				vemailadrs: arrDataTemp[x].getValue('custrecord_ica_mpmp_payee_email'),
				vbankname: arrDataTemp[x].getValue('custrecord_ica_mpmp_bankname'),
				vbankaddrs1: arrDataTemp[x].getValue('custrecord_ica_mpmp_bankaddressline1'),
				vbankcity: arrDataTemp[x].getValue('custrecord_ica_mpmp_bankcity'),
				vbankstate: arrDataTemp[x].getValue('custrecord_ica_mpmp_bankstate'),
				vbankzip: arrDataTemp[x].getValue('custrecord_ica_mpmp_bankpostcode'),
				vbankcountry: arrDataTemp[x].getText('custrecord_ica_mpmp_bankcountrycode'),
				payformat: arrDataTemp[x].getText('custrecord_ica_mpmp_pymt_format'),
				pmformatintl: arrDataTemp[x].getValue('custrecord_ica_mpmp_interpayformat'),
				bankid: arrDataTemp[x].getValue('custrecord_ica_mpmp_vendorbranchbankirc'),
				fx_reftype: arrDataTemp[x].getText('custrecord_ica_mpmp_forex_ref_type'),
				fx_refid: arrDataTemp[x].getValue('custrecord_ica_mpmp_forex_ref_id'),
				pmp_dac_contactname: arrDataTemp[x].getValue('custrecord_ica_mpmp_pmp_dac_delivery_contact_name'),
				pmp_dac_emailaddress: arrDataTemp[x].getValue('custrecord_ica_mpmp_pmp_dac_delivery_email_addres'),
				custentity_inter_bank_id_type: arrDataTemp[x].getText('custrecord_ica_mpmp_inter_bank_id_type'),
				custentity_inter_bank_name: arrDataTemp[x].getValue('custrecord_ica_mpmp_inter_bank_name'),
				custentity_inter_bank_id: arrDataTemp[x].getValue('custrecord_ica_mpmp_inter_bank_id'),
				custentity_inter_bank_address_1: arrDataTemp[x].getValue('custrecord_ica_mpmp_inter_bank_address_1'),
				custentity_inter_bank_city: arrDataTemp[x].getValue('custrecord_ica_mpmp_inter_bank_city'),
				custentity_inter_bank_state: arrDataTemp[x].getValue('custrecord_ica_mpmp_inter_bank_state'),
				custentity_inter_bank_postal: arrDataTemp[x].getValue('custrecord_ica_mpmp_inter_bank_postal'),
				custentity_inter_bank_country: arrDataTemp[x].getText('custrecord_ica_mpmp_inter_bank_country'),
				entityid: arrDataTemp[x].getValue('entityid', 'CUSTRECORD_ICA_MPMP_ENTITY'),

				custentity_check_style: arrDataTemp[x].getText('custentity_check_style', 'CUSTRECORD_ICA_MPMP_ENTITY'),
				custentity_pmp_biller_id: arrDataTemp[x].getText('custentity_pmp_biller_id', 'CUSTRECORD_ICA_MPMP_ENTITY'),
				custentity_fas: arrDataTemp[x].getValue('custentity_fas', 'CUSTRECORD_ICA_MPMP_ENTITY'),
				custentity_ica_bill_pymt_single: arrDataTemp[x].getValue('custentity_ica_bill_pymt_single', 'CUSTRECORD_ICA_MPMP_ENTITY'),
				custentity_ica_vendor_bank_instructions: arrDataTemp[x].getValue('custentity_ica_vendor_bank_instructions', 'CUSTRECORD_ICA_MPMP_ENTITY'),
				custentity_ica_entity_check_insert_type: arrDataTemp[x].getValue('custentity_ica_entity_check_insert_type', 'CUSTRECORD_ICA_MPMP_ENTITY'),
				custentity_ica_entity_check_insert_value: arrDataTemp[x].getValue('custentity_ica_entity_check_insert_value', 'CUSTRECORD_ICA_MPMP_ENTITY'),
				custentity_ica_vendor_external_id: arrDataTemp[x].getValue('custentity_ica_vendor_external_id', 'CUSTRECORD_ICA_MPMP_ENTITY'),
				entityid: arrDataTemp[x].getValue('entityid', 'CUSTRECORD_ICA_MPMP_ENTITY'),
				category: arrDataTemp[x].getText('category', 'CUSTRECORD_ICA_MPMP_ENTITY'),
				custentity_ica_bpm_is_fleet: arrDataTemp[x].getValue('custentity_ica_bpm_is_fleet', 'CUSTRECORD_ICA_MPMP_ENTITY'),
				custentity_ica_bns_use_iban: arrDataTemp[x].getValue('custentity_ica_bns_use_iban', 'CUSTRECORD_ICA_MPMP_ENTITY'),
				custentity_ica_location_code: arrDataTemp[x].getValue('custentity_ica_location_code', 'CUSTRECORD_ICA_MPMP_ENTITY'),

			};
			arrEntities.push(value);
		}

		dLog('arrEntities', JSON.stringify(arrEntities));

		return arrEntities;
	} catch (e) {
		dErr('getEntityData | ERROR ', e);
	}
}

/**
 * 14/07/2016 : Al can we make this pull the Vendor internal Id please, we can
 * then get rid of the merchant id field
 *
 * @param ids
 * @returns {Array}
 */
function getEmployeeData(ids) {
	try {
		dAudit('getEmployeeData', 'Get Employee Data for ids : ' + ids);

		var arrEntities = [];
		var arrDataTemp = [];
		var lastId = -100;

		var columns = [];
		columns.push(new nlobjSearchColumn('internalid').setSort());
		columns.push(new nlobjSearchColumn('custentity_paymentmethod'));
		columns.push(new nlobjSearchColumn('custentity_currency'));
		columns.push(new nlobjSearchColumn('custentity_recpartyaccttype'));
		columns.push(new nlobjSearchColumn('custentity_recpartyaccount'));
		columns.push(new nlobjSearchColumn('custentity_recbankprimidtype'));
		columns.push(new nlobjSearchColumn('custentity_recbankprimid'));
		columns.push(new nlobjSearchColumn('custentity_vendorname'));
		columns.push(new nlobjSearchColumn('custentity_vendoraddline1'));
		columns.push(new nlobjSearchColumn('custentity_vendoraddline2'));
		columns.push(new nlobjSearchColumn('custentity_vendor_phone_num'));
		columns.push(new nlobjSearchColumn('custentity_vendorcity'));
		columns.push(new nlobjSearchColumn('custentity_vendorstateprovince'));
		columns.push(new nlobjSearchColumn('custentity_vendorpostalcode'));
		columns.push(new nlobjSearchColumn('custentity_vendorcountrycode'));
		columns.push(new nlobjSearchColumn('custentity_merchantid'));
		columns.push(new nlobjSearchColumn('email'));
		columns.push(new nlobjSearchColumn('custentity_payee_email'));
		columns.push(new nlobjSearchColumn('custentity_bankname'));
		columns.push(new nlobjSearchColumn('custentity_bankaddressline1'));
		columns.push(new nlobjSearchColumn('custentity_bankcity'));
		columns.push(new nlobjSearchColumn('custentity_bankstate'));
		columns.push(new nlobjSearchColumn('custentity_bankpostcode'));
		columns.push(new nlobjSearchColumn('custentity_bankcountrycode'));
		columns.push(new nlobjSearchColumn('custentity_paymentformat'));
		columns.push(new nlobjSearchColumn('custentity_interpayformat'));
		columns.push(new nlobjSearchColumn('custentity_vendorbranchbankircid'));
		columns.push(new nlobjSearchColumn('custentity_forex_ref_type'));
		columns.push(new nlobjSearchColumn('custentity_forex_ref_id'));
		columns.push(new nlobjSearchColumn('custentity_pmp_dac_delivery_contact_name'));
		columns.push(new nlobjSearchColumn('custentity_pmp_dac_delivery_email_addres'));
		columns.push(new nlobjSearchColumn('custentity_courier_name'));
		columns.push(new nlobjSearchColumn('custentity_courier_account'));
		columns.push(new nlobjSearchColumn('custentity_courier_deliverycode'));
		columns.push(new nlobjSearchColumn('custentity_inter_bank_id_type'));
		columns.push(new nlobjSearchColumn('custentity_inter_bank_name'));
		columns.push(new nlobjSearchColumn('custentity_inter_bank_id'));
		columns.push(new nlobjSearchColumn('custentity_inter_bank_address_1'));
		columns.push(new nlobjSearchColumn('custentity_inter_bank_city'));
		columns.push(new nlobjSearchColumn('custentity_inter_bank_state'));
		columns.push(new nlobjSearchColumn('custentity_inter_bank_postal'));
		columns.push(new nlobjSearchColumn('custentity_inter_bank_country'));
		columns.push(new nlobjSearchColumn('custentity_check_style'));
		columns.push(new nlobjSearchColumn('custentity_pmp_biller_id'));
		columns.push(new nlobjSearchColumn('custentity_fas'));
		columns.push(new nlobjSearchColumn('custentity_ica_bill_pymt_single'));
		columns.push(new nlobjSearchColumn('custentity_ica_vendor_bank_instructions'));
		columns.push(new nlobjSearchColumn('custentity_ica_entity_check_insert_type'));
		columns.push(new nlobjSearchColumn('custentity_ica_entity_check_insert_value'));
		columns.push(new nlobjSearchColumn('custentity_ica_vendor_external_id'));
		columns.push(new nlobjSearchColumn('entityid'));
		columns.push(new nlobjSearchColumn('custentity_ica_bpm_is_fleet'));
		columns.push(new nlobjSearchColumn('custentity_ica_bns_use_iban'));
		columns.push(new nlobjSearchColumn('custentity_ica_location_code'));

		do {
			var filters = [];
			if (ids != null && ids != '') {
				filters.push(['internalid', 'anyof', ids]);
				filters.push('AND');
			}
			filters.push(['internalidnumber', 'greaterthan', lastId]);
			filters.push('AND');
			filters.push(['isinactive', 'is', 'F']);

			var tempResults = nlapiSearchRecord('entity', null, filters, columns);
			if (tempResults) {
				lastId = tempResults[tempResults.length - 1].getId();
				arrDataTemp = arrDataTemp.concat(tempResults);
			}
		} while (tempResults && tempResults.length == 1000);

		for (var x = 0; x < arrDataTemp.length; x++) {
			// var id = arrDataTemp[x].getValue('internalid');
			var value = {
				internalid: arrDataTemp[x].getValue('internalid'),
				paymentmethod: arrDataTemp[x].getText('custentity_paymentmethod'),
				currency: arrDataTemp[x].getValue('custentity_currency'),
				recpartyaccttype: arrDataTemp[x].getText('custentity_recpartyaccttype'),
				recpartyaccount: arrDataTemp[x].getValue('custentity_recpartyaccount'),
				recbankprimidtype: arrDataTemp[x].getText('custentity_recbankprimidtype'),
				recbankprimid: arrDataTemp[x].getValue('custentity_recbankprimid'),
				vendorname: arrDataTemp[x].getValue('custentity_vendorname'),
				vendoraddrs1: arrDataTemp[x].getValue('custentity_vendoraddline1'),
				vendoraddrs2: arrDataTemp[x].getValue('custentity_vendoraddline2'),
				vendorphone: arrDataTemp[x].getValue('custentity_vendor_phone_num'),
				vendorcity: arrDataTemp[x].getValue('custentity_vendorcity'),
				vendorstateprovince: arrDataTemp[x].getValue('custentity_vendorstateprovince'),
				vendorpostal: arrDataTemp[x].getValue('custentity_vendorpostalcode'),
				vendorcountrycode: arrDataTemp[x].getText('custentity_vendorcountrycode'),
				merchantid: arrDataTemp[x].getValue('internalid'),
				email: arrDataTemp[x].getValue('email'),
				vemailadrs: arrDataTemp[x].getValue('custentity_payee_email'),
				vbankname: arrDataTemp[x].getValue('custentity_bankname'),
				vbankaddrs1: arrDataTemp[x].getValue('custentity_bankaddressline1'),
				vbankcity: arrDataTemp[x].getValue('custentity_bankcity'),
				vbankstate: arrDataTemp[x].getValue('custentity_bankstate'),
				vbankzip: arrDataTemp[x].getValue('custentity_bankpostcode'),
				vbankcountry: arrDataTemp[x].getText('custentity_bankcountrycode'),
				payformat: arrDataTemp[x].getText('custentity_paymentformat'),
				pmformatintl: arrDataTemp[x].getValue('custentity_interpayformat'),
				bankid: arrDataTemp[x].getValue('custentity_vendorbranchbankircid'),
				fx_reftype: arrDataTemp[x].getText('custentity_forex_ref_type'),
				fx_refid: arrDataTemp[x].getValue('custentity_forex_ref_id'),
				pmp_dac_contactname: arrDataTemp[x].getValue('custentity_pmp_dac_delivery_contact_name'),
				pmp_dac_emailaddress: arrDataTemp[x].getValue('custentity_pmp_dac_delivery_email_addres'),
				couriername: arrDataTemp[x].getValue('custentity_courier_name'),
				courieraccount: arrDataTemp[x].getValue('custentity_courier_account'),
				deliverycode: arrDataTemp[x].getText('custentity_courier_deliverycode'),
				custentity_inter_bank_id_type: arrDataTemp[x].getText('custentity_inter_bank_id_type'),
				custentity_inter_bank_name: arrDataTemp[x].getValue('custentity_inter_bank_name'),
				custentity_inter_bank_id: arrDataTemp[x].getValue('custentity_inter_bank_id'),
				custentity_inter_bank_address_1: arrDataTemp[x].getValue('custentity_inter_bank_address_1'),
				custentity_inter_bank_city: arrDataTemp[x].getValue('custentity_inter_bank_city'),
				custentity_inter_bank_state: arrDataTemp[x].getValue('custentity_inter_bank_state'),
				custentity_inter_bank_postal: arrDataTemp[x].getValue('custentity_inter_bank_postal'),
				custentity_inter_bank_country: arrDataTemp[x].getText('custentity_inter_bank_country'),
				custentity_check_style: arrDataTemp[x].getText('custentity_check_style'),
				custentity_pmp_biller_id: arrDataTemp[x].getText('custentity_pmp_biller_id'),
				custentity_fas: arrDataTemp[x].getValue('custentity_fas'),
				custentity_ica_bill_pymt_single: arrDataTemp[x].getValue('custentity_ica_bill_pymt_single'),
				custentity_ica_vendor_bank_instructions: arrDataTemp[x].getValue('custentity_ica_vendor_bank_instructions'),
				custentity_ica_entity_check_insert_type: arrDataTemp[x].getValue('custentity_ica_entity_check_insert_type'),
				custentity_ica_entity_check_insert_value: arrDataTemp[x].getValue('custentity_ica_entity_check_insert_value'),
				custentity_ica_vendor_external_id: arrDataTemp[x].getValue('custentity_ica_vendor_external_id'),
				entityid: arrDataTemp[x].getValue('entityid'),
				custentity_ica_bpm_is_fleet: arrDataTemp[x].getValue('custentity_ica_bpm_is_fleet'),
				custentity_ica_bns_use_iban: arrDataTemp[x].getValue('custentity_ica_bns_use_iban'),
				custentity_ica_location_code: arrDataTemp[x].getValue('custentity_ica_location_code'),
			};

			arrEntities.push(value);
		}

		// for (x in arrDataTemp) {
		// 	var id = arrDataTemp[x].getValue('internalid');
		//         if (!id) continue;
		// 	if (arrEntities[id] == null) arrEntities[id] = [];
		//         dLog("arrEntities[id]", JSON.stringify(arrEntities[id]));
		// 	arrEntities[id] = {
		// 		internalid: arrDataTemp[x].getValue('internalid'),
		// 		paymentmethod: arrDataTemp[x].getText('custentity_paymentmethod'),
		// 		currency: arrDataTemp[x].getValue('custentity_currency'),
		// 		recpartyaccttype: arrDataTemp[x].getText('custentity_recpartyaccttype'),
		// 		recpartyaccount: arrDataTemp[x].getValue('custentity_recpartyaccount'),
		// 		recbankprimidtype: arrDataTemp[x].getText('custentity_recbankprimidtype'),
		// 		recbankprimid: arrDataTemp[x].getValue('custentity_recbankprimid'),
		// 		vendorname: arrDataTemp[x].getValue('custentity_vendorname'),
		// 		vendoraddrs1: arrDataTemp[x].getValue('custentity_vendoraddline1'),
		// 		vendoraddrs2: arrDataTemp[x].getValue('custentity_vendoraddline2'),
		// 		vendorphone: arrDataTemp[x].getValue('custentity_vendor_phone_num'),
		// 		vendorcity: arrDataTemp[x].getValue('custentity_vendorcity'),
		// 		vendorstateprovince: arrDataTemp[x].getValue('custentity_vendorstateprovince'),
		// 		vendorpostal: arrDataTemp[x].getValue('custentity_vendorpostalcode'),
		// 		vendorcountrycode: arrDataTemp[x].getText('custentity_vendorcountrycode'),
		// 		merchantid: arrDataTemp[x].getValue('internalid'),
		// 		email: arrDataTemp[x].getValue('email'),
		// 		vemailadrs: arrDataTemp[x].getValue('custentity_payee_email'),
		// 		vbankname: arrDataTemp[x].getValue('custentity_bankname'),
		// 		vbankaddrs1: arrDataTemp[x].getValue('custentity_bankaddressline1'),
		// 		vbankcity: arrDataTemp[x].getValue('custentity_bankcity'),
		// 		vbankstate: arrDataTemp[x].getValue('custentity_bankstate'),
		// 		vbankzip: arrDataTemp[x].getValue('custentity_bankpostcode'),
		// 		vbankcountry: arrDataTemp[x].getText('custentity_bankcountrycode'),
		// 		payformat: arrDataTemp[x].getText('custentity_paymentformat'),
		// 		pmformatintl: arrDataTemp[x].getValue('custentity_interpayformat'),
		// 		bankid: arrDataTemp[x].getValue('custentity_vendorbranchbankircid'),
		// 		fx_reftype: arrDataTemp[x].getText('custentity_forex_ref_type'),
		// 		fx_refid: arrDataTemp[x].getValue('custentity_forex_ref_id'),
		// 		pmp_dac_contactname: arrDataTemp[x].getValue('custentity_pmp_dac_delivery_contact_name'),
		// 		pmp_dac_emailaddress: arrDataTemp[x].getValue('custentity_pmp_dac_delivery_email_addres'),
		// 		couriername: arrDataTemp[x].getValue('custentity_courier_name'),
		// 		courieraccount: arrDataTemp[x].getValue('custentity_courier_account'),
		// 		deliverycode: arrDataTemp[x].getText('custentity_courier_deliverycode'),
		// 		custentity_inter_bank_id_type: arrDataTemp[x].getText('custentity_inter_bank_id_type'),
		// 		custentity_inter_bank_name: arrDataTemp[x].getValue('custentity_inter_bank_name'),
		// 		custentity_inter_bank_id: arrDataTemp[x].getValue('custentity_inter_bank_id'),
		// 		custentity_inter_bank_address_1: arrDataTemp[x].getValue('custentity_inter_bank_address_1'),
		// 		custentity_inter_bank_city: arrDataTemp[x].getValue('custentity_inter_bank_city'),
		// 		custentity_inter_bank_state: arrDataTemp[x].getValue('custentity_inter_bank_state'),
		// 		custentity_inter_bank_postal: arrDataTemp[x].getValue('custentity_inter_bank_postal'),
		// 		custentity_inter_bank_country: arrDataTemp[x].getText('custentity_inter_bank_country'),
		// 		custentity_check_style: arrDataTemp[x].getText('custentity_check_style'),
		// 		custentity_pmp_biller_id: arrDataTemp[x].getText('custentity_pmp_biller_id'),
		// 		custentity_fas: arrDataTemp[x].getValue('custentity_fas'),
		// 		custentity_ica_bill_pymt_single: arrDataTemp[x].getValue('custentity_ica_bill_pymt_single'),
		// 		custentity_ica_vendor_bank_instructions: arrDataTemp[x].getValue('custentity_ica_vendor_bank_instructions'),
		// 		custentity_ica_entity_check_insert_type: arrDataTemp[x].getValue('custentity_ica_entity_check_insert_type'),
		// 		custentity_ica_entity_check_insert_value: arrDataTemp[x].getValue('custentity_ica_entity_check_insert_value'),
		// 		custentity_ica_vendor_external_id: arrDataTemp[x].getValue('custentity_ica_vendor_external_id'),
		// 		entityid: arrDataTemp[x].getValue('entityid'),
		// 		custentity_ica_bpm_is_fleet: arrDataTemp[x].getValue('custentity_ica_bpm_is_fleet'),
		//                 custentity_ica_bns_use_iban: arrDataTemp[x].getValue('custentity_ica_bns_use_iban')
		// 	};
		// }

		dLog('arrEntities', JSON.stringify(arrEntities.length));
		// arrEntities = _.compact(arrEntities);
		// dLog('arrEntities compact', JSON.stringify(arrEntities));

		return arrEntities; //_.without(arrEntities, null);
	} catch (e) {
		dErr('getEmployeeData | ERROR ', e);
	}
}

/**
 * 14/07/2016 : Al can we make this pull the Vendor internal Id please, we can
 * then get rid of the merchant id field
 *
 * @param ids
 * @returns {Array}
 */
function getCheckEntityData(ids) {
	try {
		dAudit('getEntityData', 'Get Entity Data for ids : ' + ids);
		var validColumn = '';
		if (CUSTOM_REFINFO) {
			validColumn = validateVendorColumn(CUSTOM_REFINFO);
		}

		var arrEntities = [];
		var arrDataTemp = [];
		var lastId = -100;

		var columns = [];
		columns.push(new nlobjSearchColumn('internalid').setSort());
		columns.push(new nlobjSearchColumn('custentity_paymentmethod'));
		columns.push(new nlobjSearchColumn('custentity_currency'));
		columns.push(new nlobjSearchColumn('custentity_recpartyaccttype'));
		columns.push(new nlobjSearchColumn('custentity_recpartyaccount'));
		columns.push(new nlobjSearchColumn('custentity_recbankprimidtype'));
		columns.push(new nlobjSearchColumn('custentity_recbankprimid'));
		columns.push(new nlobjSearchColumn('custentity_vendorname'));
		columns.push(new nlobjSearchColumn('custentity_vendoraddline1'));
		columns.push(new nlobjSearchColumn('custentity_vendoraddline2'));
		columns.push(new nlobjSearchColumn('custentity_vendor_phone_num'));
		columns.push(new nlobjSearchColumn('custentity_vendorcity'));
		columns.push(new nlobjSearchColumn('custentity_vendorstateprovince'));
		columns.push(new nlobjSearchColumn('custentity_vendorpostalcode'));
		columns.push(new nlobjSearchColumn('custentity_vendorcountrycode'));
		columns.push(new nlobjSearchColumn('custentity_merchantid'));
		columns.push(new nlobjSearchColumn('email'));
		columns.push(new nlobjSearchColumn('custentity_payee_email'));
		columns.push(new nlobjSearchColumn('custentity_bankname'));
		columns.push(new nlobjSearchColumn('custentity_bankaddressline1'));
		columns.push(new nlobjSearchColumn('custentity_bankcity'));
		columns.push(new nlobjSearchColumn('custentity_bankstate'));
		columns.push(new nlobjSearchColumn('custentity_bankpostcode'));
		columns.push(new nlobjSearchColumn('custentity_bankcountrycode'));
		columns.push(new nlobjSearchColumn('custentity_paymentformat'));
		columns.push(new nlobjSearchColumn('custentity_interpayformat'));
		columns.push(new nlobjSearchColumn('custentity_vendorbranchbankircid'));
		columns.push(new nlobjSearchColumn('custentity_forex_ref_type'));
		columns.push(new nlobjSearchColumn('custentity_forex_ref_id'));
		columns.push(new nlobjSearchColumn('custentity_pmp_dac_delivery_contact_name'));
		columns.push(new nlobjSearchColumn('custentity_pmp_dac_delivery_email_addres'));
		columns.push(new nlobjSearchColumn('custentity_courier_name'));
		columns.push(new nlobjSearchColumn('custentity_courier_account'));
		columns.push(new nlobjSearchColumn('custentity_courier_deliverycode'));
		columns.push(new nlobjSearchColumn('custentity_inter_bank_id_type'));
		columns.push(new nlobjSearchColumn('custentity_inter_bank_name'));
		columns.push(new nlobjSearchColumn('custentity_inter_bank_id'));
		columns.push(new nlobjSearchColumn('custentity_inter_bank_address_1'));
		columns.push(new nlobjSearchColumn('custentity_inter_bank_city'));
		columns.push(new nlobjSearchColumn('custentity_inter_bank_state'));
		columns.push(new nlobjSearchColumn('custentity_inter_bank_postal'));
		columns.push(new nlobjSearchColumn('custentity_inter_bank_country'));
		columns.push(new nlobjSearchColumn('custentity_check_style'));
		columns.push(new nlobjSearchColumn('custentity_pmp_biller_id'));
		columns.push(new nlobjSearchColumn('custentity_fas'));
		columns.push(new nlobjSearchColumn('custentity_ica_bill_pymt_single'));
		columns.push(new nlobjSearchColumn('custentity_ica_vendor_bank_instructions'));
		columns.push(new nlobjSearchColumn('custentity_ica_entity_check_insert_type'));
		columns.push(new nlobjSearchColumn('custentity_ica_entity_check_insert_value'));
		columns.push(new nlobjSearchColumn('custentity_ica_vendor_external_id'));
		columns.push(new nlobjSearchColumn('entityid'));
		columns.push(new nlobjSearchColumn('custentity_ica_bpm_is_fleet'));

		if (OVERWRITE_REFINFO == 'T' && CUSTOM_REFINFO != '') {
			if (validColumn) {
				columns.push(new nlobjSearchColumn(CUSTOM_REFINFO));
			}
		}

		do {
			var filters = [];
			if (ids != null && ids != '') {
				filters.push(['internalid', 'anyof', ids]);
				filters.push('AND');
			}
			filters.push(['internalidnumber', 'greaterthan', lastId]);
			filters.push('AND');
			filters.push(['isinactive', 'is', 'F']);

			var tempResults = nlapiSearchRecord('entity', null, filters, columns);
			if (tempResults) {
				lastId = tempResults[tempResults.length - 1].getId();
				arrDataTemp = arrDataTemp.concat(tempResults);
			}
		} while (tempResults && tempResults.length == 1000);

		for (x in arrDataTemp) {
			var id = arrDataTemp[x].getValue('internalid');
			if (arrEntities[id] == null) arrEntities[id] = [];
			arrEntities[id] = {
				internalid: arrDataTemp[x].getValue('internalid'),
				paymentmethod: arrDataTemp[x].getText('custentity_paymentmethod'),
				currency: arrDataTemp[x].getValue('custentity_currency'),
				recpartyaccttype: arrDataTemp[x].getText('custentity_recpartyaccttype'),
				recpartyaccount: arrDataTemp[x].getValue('custentity_recpartyaccount'),
				recbankprimidtype: arrDataTemp[x].getText('custentity_recbankprimidtype'),
				recbankprimid: arrDataTemp[x].getValue('custentity_recbankprimid'),
				vendorname: arrDataTemp[x].getValue('custentity_vendorname'),
				vendoraddrs1: arrDataTemp[x].getValue('custentity_vendoraddline1'),
				vendoraddrs2: arrDataTemp[x].getValue('custentity_vendoraddline2'),
				vendorphone: arrDataTemp[x].getValue('custentity_vendor_phone_num'),
				vendorcity: arrDataTemp[x].getValue('custentity_vendorcity'),
				vendorstateprovince: arrDataTemp[x].getValue('custentity_vendorstateprovince'),
				vendorpostal: arrDataTemp[x].getValue('custentity_vendorpostalcode'),
				vendorcountrycode: arrDataTemp[x].getText('custentity_vendorcountrycode'),
				merchantid: arrDataTemp[x].getValue('internalid'),
				email: arrDataTemp[x].getValue('email'),
				vemailadrs: arrDataTemp[x].getValue('custentity_payee_email'),
				vbankname: arrDataTemp[x].getValue('custentity_bankname'),
				vbankaddrs1: arrDataTemp[x].getValue('custentity_bankaddressline1'),
				vbankcity: arrDataTemp[x].getValue('custentity_bankcity'),
				vbankstate: arrDataTemp[x].getValue('custentity_bankstate'),
				vbankzip: arrDataTemp[x].getValue('custentity_bankpostcode'),
				vbankcountry: arrDataTemp[x].getText('custentity_bankcountrycode'),
				payformat: arrDataTemp[x].getText('custentity_paymentformat'),
				pmformatintl: arrDataTemp[x].getValue('custentity_interpayformat'),
				bankid: arrDataTemp[x].getValue('custentity_vendorbranchbankircid'),
				fx_reftype: arrDataTemp[x].getText('custentity_forex_ref_type'),
				fx_refid: arrDataTemp[x].getValue('custentity_forex_ref_id'),
				pmp_dac_contactname: arrDataTemp[x].getValue('custentity_pmp_dac_delivery_contact_name'),
				pmp_dac_emailaddress: arrDataTemp[x].getValue('custentity_pmp_dac_delivery_email_addres'),
				couriername: arrDataTemp[x].getValue('custentity_courier_name'),
				courieraccount: arrDataTemp[x].getValue('custentity_courier_account'),
				deliverycode: arrDataTemp[x].getText('custentity_courier_deliverycode'),
				custentity_inter_bank_id_type: arrDataTemp[x].getText('custentity_inter_bank_id_type'),
				custentity_inter_bank_name: arrDataTemp[x].getValue('custentity_inter_bank_name'),
				custentity_inter_bank_id: arrDataTemp[x].getValue('custentity_inter_bank_id'),
				custentity_inter_bank_address_1: arrDataTemp[x].getValue('custentity_inter_bank_address_1'),
				custentity_inter_bank_city: arrDataTemp[x].getValue('custentity_inter_bank_city'),
				custentity_inter_bank_state: arrDataTemp[x].getValue('custentity_inter_bank_state'),
				custentity_inter_bank_postal: arrDataTemp[x].getValue('custentity_inter_bank_postal'),
				custentity_inter_bank_country: arrDataTemp[x].getText('custentity_inter_bank_country'),
				custentity_check_style: arrDataTemp[x].getText('custentity_check_style'),
				custentity_pmp_biller_id: arrDataTemp[x].getText('custentity_pmp_biller_id'),
				custentity_fas: arrDataTemp[x].getValue('custentity_fas'),
				custentity_ica_bill_pymt_single: arrDataTemp[x].getValue('custentity_ica_bill_pymt_single'),
				custentity_ica_vendor_bank_instructions: arrDataTemp[x].getValue('custentity_ica_vendor_bank_instructions'),
				custentity_ica_entity_check_insert_type: arrDataTemp[x].getValue('custentity_ica_entity_check_insert_type'),
				custentity_ica_entity_check_insert_value: arrDataTemp[x].getValue('custentity_ica_entity_check_insert_value'),
				custentity_ica_vendor_external_id: arrDataTemp[x].getValue('custentity_ica_vendor_external_id'),
				entityid: arrDataTemp[x].getValue('entityid'),
				custentity_ica_bpm_is_fleet: arrDataTemp[x].getValue('custentity_ica_bpm_is_fleet'),
			};
			if (validColumn) {
				arrEntities[id][CUSTOM_REFINFO] = arrDataTemp[x].getValue(CUSTOM_REFINFO);
			}
		}

		dLog('arrEntities', JSON.stringify(arrEntities.length));
		// arrEntities = _.compact(arrEntities);
		// dLog('arrEntities compact', JSON.stringify(arrEntities));

		return arrEntities; //_.without(arrEntities, null);
	} catch (e) {
		dErr('getCheckEntityData | ERROR ', e);
	}
}

/**
 *
 * @param bills
 * @returns {Array}
 */
function getBillData(billIds) {
	try {
		dAudit('getBillData', 'Get Billing Data for bill ids : ' + JSON.stringify(billIds));

		var validColumn = validateBillColumn(IS_FLEET_INTERNALID);

		billIds.sort();
		var arr = billIds;

		if (arr.length == 0) {
			dLog('getBillData, arr.length is 0', 'Returning...');
			return [];
		}
    var IS_MULTICURRENCY = nlapiGetContext().getFeature('MULTICURRENCY');

		var columns = [];
		columns.push(new nlobjSearchColumn('internalid'));
		columns.push(new nlobjSearchColumn('memomain'));
		columns.push(new nlobjSearchColumn('trandate'));
		columns.push(new nlobjSearchColumn('total')); //
		columns.push(new nlobjSearchColumn('entity')); //
		// as per AL as of 22 Dec 2015 - <NoteText>Test DAC</NoteText>
		// *** Change this field to look at the 'Test for ACH' field which
		// should be
		// the Ref No. Field in NetSuite.
		columns.push(new nlobjSearchColumn('transactionnumber'));
		columns.push(new nlobjSearchColumn('tranid'));
		columns.push(new nlobjSearchColumn('type'));
    if (IS_MULTICURRENCY) {
      columns.push(new nlobjSearchColumn('currency'));
    }

    if (USE_CHECK_ADDR=='T') {
      columns.push(new nlobjSearchColumn('custbody_ica_vendor_name'));
      columns.push(new nlobjSearchColumn('custbody_ica_vendor_add_line_1'));
      columns.push(new nlobjSearchColumn('custbody_ica_vendor_add_line_2'));
      columns.push(new nlobjSearchColumn('custbody_ica_vendor_city'));
      columns.push(new nlobjSearchColumn('custbody_ica_vendor_state'));
      columns.push(new nlobjSearchColumn('custbody_ica_country_code'));
      columns.push(new nlobjSearchColumn('custbody_ica_zip_postal_code'));
      columns.push(new nlobjSearchColumn('custbody_ica_delivery_code'));
    }

		var addCheckZip = false;
		var checkzips = [];
		if (CHECKZIP_INTERNALIDS) {
			dLog('CHECKZIP_INTERNALIDS', CHECKZIP_INTERNALIDS);
			var internalids = CHECKZIP_INTERNALIDS.split(',');
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

		dLog('IS_FLEET_INTERNALID', IS_FLEET_INTERNALID);
		if (validColumn) {
			if (IS_FLEET_INTERNALID != null) {
				columns.push(new nlobjSearchColumn(IS_FLEET_INTERNALID));
			}
		}

		// columns.push(new nlobjSearchColumn('custbody_ica_bpm_use_fleet_addr'));

		dLog('INTERNAL_ID_MSG_TEXT', INTERNAL_ID_MSG_TEXT);
		if (INTERNAL_ID_MSG_TEXT != null) {
			columns.push(new nlobjSearchColumn(INTERNAL_ID_MSG_TEXT));
		}

		var arrDataTemp = [];
		while (billIds.length > 999) {
			arr = billIds.splice(0, billIds.indexOf(billIds[999]));
			var filters = [];
			filters.push(new nlobjSearchFilter('internalid', null, 'anyOf', arr));
			filters.push(new nlobjSearchFilter('mainline', null, 'is', 'T'));
			var tempResults = nlapiSearchRecord('transaction', null, filters, columns);
			arrDataTemp = arrDataTemp.concat(tempResults);
		}

		var filters = [];
		filters.push(new nlobjSearchFilter('internalid', null, 'anyOf', billIds));
		filters.push(new nlobjSearchFilter('mainline', null, 'is', 'T'));
		var tempResults = nlapiSearchRecord('transaction', null, filters, columns);
		if (arrDataTemp.length == 0) {
			arrDataTemp = tempResults;
		} else {
			arrDataTemp = arrDataTemp.concat(tempResults);
		}

		var results = arrDataTemp;
		dAudit('results.fleet', JSON.stringify(results));

		var arrBillsData = {};
		if (results != null) {
			for (var i = 0; i < results.length; i++) {
				var id = results[i].getId();
				if (id) {
					arrBillsData[id] = {
						num: results[i].getValue('tranid'),
						trnxnumber: results[i].getValue('transactionnumber'),
						dte: results[i].getValue('trandate'),
						tot: results[i].getValue('total'),
						memo: results[i].getValue('memomain'),
						rtype: results[i].getValue('type'),
						entity: results[i].getValue('entity')
					};

          if (USE_CHECK_ADDR=='T') {
            arrBillsData[id] = {
              custbody_ica_vendor_name: results[i].getValue('custbody_ica_vendor_name'),
              custbody_ica_vendor_add_line_1: results[i].getValue('custbody_ica_vendor_add_line_1'),
              custbody_ica_vendor_add_line_2: results[i].getValue('custbody_ica_vendor_add_line_2'),
              custbody_ica_vendor_city: results[i].getValue('custbody_ica_vendor_city'),
              custbody_ica_vendor_state: results[i].getValue('custbody_ica_vendor_state'),
              custbody_ica_country_code: results[i].getValue('custbody_ica_country_code'),
              custbody_ica_zip_postal_code: results[i].getValue('custbody_ica_zip_postal_code'),              
              custbody_ica_delivery_code: results[i].getValue('custbody_ica_delivery_code')
            };
          }

					if (addCheckZip) {
						for (var z = 0; z < checkzips.length; z++) {
							arrBillsData[id][checkzips[z]] = results[i].getValue(checkzips[z]);
						}
					}

					if (INTERNAL_ID_MSG_TEXT != null) {
						dAudit('results.fleet', results[i].getValue(INTERNAL_ID_MSG_TEXT));
						arrBillsData[id].msgText = results[i].getValue(INTERNAL_ID_MSG_TEXT);
					} else {
						arrBillsData[id].msgText = '';
					}
					if (validColumn) {
						if (IS_FLEET_INTERNALID != null) {
							arrBillsData[id].fleet = results[i].getValue(IS_FLEET_INTERNALID);
						}
					} else {
						arrBillsData[id].fleet = 'F';
					}
          if (IS_MULTICURRENCY) {
            arrBillsData[id].currency = results[i].getValue('currency');
          } 
      
				}
			}
		}

		dAudit('arrBillsData', JSON.stringify(arrBillsData));

		return arrBillsData;
	} catch (e) {
		dErr('getBillData | ERROR ', e.message);
	}

	// try {
	// 	dAudit('getBillData', 'Get Billing Data for bill ids : ' + JSON.stringify(billIds));

	// var arrBillData = [];
	// var filters = [];
	// filters.push(new nlobjSearchFilter('internalid', null, 'anyOf', billIds));
	// filters.push(new nlobjSearchFilter('mainline', null, 'is', 'T'));

	// var columns = [];
	// columns.push(new nlobjSearchColumn('internalid').setSort());
	// columns.push(new nlobjSearchColumn('memomain'));
	// columns.push(new nlobjSearchColumn('trandate'));
	// columns.push(new nlobjSearchColumn('total')); //
	// // as per AL as of 22 Dec 2015 - <NoteText>Test DAC</NoteText>
	// // *** Change this field to look at the 'Test for ACH' field which
	// // should be
	// // the Ref No. Field in NetSuite.
	// columns.push(new nlobjSearchColumn('transactionnumber'));
	// columns.push(new nlobjSearchColumn('tranid'));
	// columns.push(new nlobjSearchColumn('type'));

	// var lastId = 0;
	// var arrDataTemp = [];
	// do {
	// 	var filters = [];
	// 	if ((billIds!=null)&&(billIds!='')) {
	// 		filters.push(['internalid', 'anyof', billIds]);
	// 		filters.push('AND');
	// 	}
	// 	filters.push(['internalidnumber', 'greaterthan', billIds]);
	// 	filters.push('AND');
	// 	filters.push(['mainline', 'is', 'T']);

	// 	var tempResults = nlapiSearchRecord('transaction', null, filters, columns);
	// 	if (tempResults) {
	// 		lastId = tempResults[tempResults.length - 1].getId();
	// 		arrDataTemp = arrDataTemp.concat(tempResults);
	// 	}
	// } while (tempResults && tempResults.length == 1000);

	// var results = arrDataTemp; //nlapiSearchRecord('transaction', null, filters, columns);

	// for (var i = 0; results != null && i < results.length; i++) {
	// 	var id = results[i].getId();
	// 	if (id) {
	// 		arrBillData[id] = {
	// 			num : results[i].getValue('tranid'),
	// 			trnxnumber : results[i].getValue('transactionnumber'),
	// 			dte : results[i].getValue('trandate'),
	// 			tot : results[i].getValue('total'),
	// 			memo : results[i].getValue('memomain'),
	// 			rtype : results[i].getValue('type'),
	// 		};
	// 	}
	// }

	// 	return arrBillData;

	// } catch (e) {
	// 	dErr('getBillData | ERROR ', e);
	// }
}

function getPLCs(arr) {
	try {
		var arrInternalIds = _.map(arr, 'internalid');

		var results = nlapiSearchRecord(
			'transaction',
			null,
			[
				['type', 'anyof', 'LiabPymt'],
				'AND',
				['internalid', 'anyof', arrInternalIds],
				// "AND",
				// ["line","equalto","1"]
			],
			[
				new nlobjSearchColumn('duedate').setSort(false),
				new nlobjSearchColumn('type').setSort(true),
				new nlobjSearchColumn('internalid'),
				new nlobjSearchColumn('entity').setSort(false),
				new nlobjSearchColumn('tranid'),
				new nlobjSearchColumn('fxamount'),
				new nlobjSearchColumn('grossamount'),
				new nlobjSearchColumn('fxamountremaining'),
				new nlobjSearchColumn('discountamount'),
				new nlobjSearchColumn('amountremaining'),
				new nlobjSearchColumn('currency'),
				new nlobjSearchColumn('formulatext').setFormula("case when {type}='Expense Report' then {employee.custentity_paymentmethod} else {vendor.custentity_paymentmethod} end"),
				new nlobjSearchColumn('statusref'),
				new nlobjSearchColumn('formulatext').setFormula("case when {type}='Expense Report' then {employee.entityid} else {vendor.companyname} end"),
				new nlobjSearchColumn('custbody_bill_discount_date'),
				new nlobjSearchColumn('custbody_bill_discount_amount'),
				new nlobjSearchColumn('formulatext').setFormula("case when {type}='Expense Report' then '' else {vendor.category} end"),
				new nlobjSearchColumn('formulatext').setFormula("case when {custbody_ica_priority_bill} = 'T' then '<p align=\"center\">Y</p>' else ' ' end"),
				new nlobjSearchColumn('custentity_paymentmethod', 'employee', null),
				new nlobjSearchColumn('custentity_paymentmethod', 'vendor', null),
				new nlobjSearchColumn('category', 'vendor', null),
				new nlobjSearchColumn('custbody_ica_priority_bill'),
				new nlobjSearchColumn('memomain'),
				new nlobjSearchColumn('lineuniquekey'),
				new nlobjSearchColumn('line'),
			]
		);

		var data = [];
		for (var i = 0; results != null && i < results.length; i++) {
			var id = results[i].getId();
			if (id) {
				data[id] = {
					num: results[i].getValue('tranid'),
					trnxnumber: results[i].getValue('transactionnumber'),
					dte: results[i].getValue('trandate'),
					tot: results[i].getValue('total'),
					memo: results[i].getValue('memomain'),
					rtype: results[i].getValue('type'),
				};
			}
		}

		return data;
	} catch (e) {
		// log.error('getPLCs', e.message);
	}
}

function getBillAddresses(billIds) {
  var arr = [];
	if (billIds) {
		var res = nlapiSearchRecord(
			'vendorbill',
			null,
			[['type', 'anyof', 'VendBill'], 'AND', ['mainline', 'is', 'T'], 'AND', ['internalid', 'anyof', billIds]],
			[
        new nlobjSearchColumn('shipattention'),
				new nlobjSearchColumn('billaddress'),
				new nlobjSearchColumn('billaddress1'),
				new nlobjSearchColumn('billaddress2'),
				new nlobjSearchColumn('billaddress3'),
				new nlobjSearchColumn('billaddressee'),
				new nlobjSearchColumn('billattention'),
				new nlobjSearchColumn('billcity'),
				new nlobjSearchColumn('billcountry'),
				new nlobjSearchColumn('billcountrycode'),
				new nlobjSearchColumn('billphone'),
				new nlobjSearchColumn('billstate'),
				new nlobjSearchColumn('billzip'),
        new nlobjSearchColumn('custbody_ica_grant_data'),
        new nlobjSearchColumn('custbody_ica_union_bank_vendor_id')
			]
		);

    
    for (var i=0; i<res.length; i++) {
      var billDetails = res[i];
      arr.push({
        internalid: res[i].getId(),
        attention: billDetails.getValue('billattention') || billDetails.getValue('shipattention'),
        addressee: billDetails.getValue('billaddressee'),
        addr1: billDetails.getValue('billaddress1'),
        addr2: billDetails.getValue('billaddress2'),
        city: billDetails.getValue('billcity'),
        state: billDetails.getValue('billstate'),
        zip: billDetails.getValue('billzip'),
        country: billDetails.getValue('country'),
        custbody_ica_grant_data: billDetails.getValue('custbody_ica_grant_data'),
        custbody_ica_union_bank_vendor_id: billDetails.getValue('custbody_ica_union_bank_vendor_id'),
      })
    }
	}
  return arr;
}

function getBillCreditsV2(billIds) {
	try {
		dAudit('getBillCreditsV2', 'Get Bill Credit Data for bill ids : ' + billIds);

		billIds.sort();
		var arr = billIds;

		var arrBillData = [];
		if (billIds.length < 1) return arrBillData;

		var amtRemainingFld = IS_MULTICURRENCY ? 'applyingforeignamount' : 'applyinglinkamount';
		var columns = [];
		columns.push(new nlobjSearchColumn('transactionnumber', 'applyingTransaction', 'GROUP'));
		columns.push(new nlobjSearchColumn('tranid', 'applyingTransaction', 'GROUP'));
		columns.push(new nlobjSearchColumn('trandate', 'applyingTransaction', 'GROUP'));
		columns.push(new nlobjSearchColumn(amtRemainingFld, null, 'GROUP').setSort(true));
		columns.push(new nlobjSearchColumn('type', 'applyingTransaction', 'GROUP'));
		columns.push(new nlobjSearchColumn('memo', 'applyingTransaction', 'GROUP'));

		var arrDataTemp = [];

		while (billIds.length > 999) {
			arr = billIds.splice(0, billIds.indexOf(billIds[999]));
			dAudit('arr', JSON.stringify(arr));

			var filters = [];
			filters.push(new nlobjSearchFilter('internalid', null, 'anyOf', arr));
			filters.push(new nlobjSearchFilter('mainline', null, 'is', 'T'));
			filters.push(new nlobjSearchFilter('type', 'applyingTransaction', 'anyOf', 'VendCred'));

			var results = nlapiSearchRecord('transaction', null, filters, columns);
			arrDataTemp = arrDataTemp.concat(results);
		}

		var filters = [];
		filters.push(new nlobjSearchFilter('internalid', null, 'anyOf', billIds));
		filters.push(new nlobjSearchFilter('mainline', null, 'is', 'T'));
		filters.push(new nlobjSearchFilter('type', 'applyingTransaction', 'anyOf', 'VendCred'));

		var tempResults = nlapiSearchRecord('transaction', null, filters, columns);
		if (arrDataTemp.length == 0) {
			arrDataTemp = tempResults;
		} else {
			arrDataTemp = arrDataTemp.concat(tempResults);
		}

		var results = arrDataTemp;

		for (var i = 0; results != null && i < results.length; i++) {
			var id = results[i].getId();
			var amt = results[i].getValue(amtRemainingFld, null, 'GROUP');
			dLog(
				'billcredit',
				JSON.stringify({
					id: id,
					amt: amt,
				})
			);
			if (id && amt) {
				if (arrBillData[id] == null) arrBillData[id] = [];

				arrBillData[id].push({
					bcnum: results[i].getValue('tranid', 'applyingTransaction', 'GROUP'),
					bctrnxnum: results[i].getValue('transactionnumber', 'applyingTransaction', 'GROUP'),
					bcamt: amt,
					bcmemo: results[i].getValue('memo', 'applyingTransaction', 'GROUP'),
					bcdate: results[i].getValue('trandate', 'applyingTransaction', 'GROUP'),
				});
			}
		}

		dAudit('getBillCreditsV2', JSON.stringify(arrBillData));

		return arrBillData;
	} catch (e) {
		dErr('getBillCredit | ERROR - returning []', e);
		return [];
	}
}

/**
 *
 * @param bills
 * @returns {Array}
 */
function getBillCredit(billIds) {
	try {
		dAudit('getBillCredit', 'Get Bill Credit Data for bill ids : ' + billIds);

		billIds.sort();
		var arr = billIds;

		var arrBillData = [];
		if (billIds.length < 1) return arrBillData;

		var amtRemainingFld = IS_MULTICURRENCY ? 'applyingforeignamount' : 'applyinglinkamount';
		var columns = [];
		columns.push(new nlobjSearchColumn('transactionnumber', 'applyingTransaction'));
		columns.push(new nlobjSearchColumn('tranid', 'applyingTransaction'));
		columns.push(new nlobjSearchColumn('trandate', 'applyingTransaction'));
		columns.push(new nlobjSearchColumn(amtRemainingFld).setSort(true));
		columns.push(new nlobjSearchColumn('type', 'applyingTransaction'));
		columns.push(new nlobjSearchColumn('memo', 'applyingTransaction'));

		var arrDataTemp = [];

		while (billIds.length > 999) {
			arr = billIds.splice(0, billIds.indexOf(billIds[999]));
			dAudit('arr', JSON.stringify(arr));

			var filters = [];
			filters.push(new nlobjSearchFilter('internalid', null, 'anyOf', arr));
			filters.push(new nlobjSearchFilter('mainline', null, 'is', 'T'));
			filters.push(new nlobjSearchFilter('type', 'applyingTransaction', 'anyOf', 'VendCred'));

			var results = nlapiSearchRecord('transaction', null, filters, columns);
			arrDataTemp = arrDataTemp.concat(results);
		}

		var filters = [];
		filters.push(new nlobjSearchFilter('internalid', null, 'anyOf', billIds));
		filters.push(new nlobjSearchFilter('mainline', null, 'is', 'T'));
		filters.push(new nlobjSearchFilter('type', 'applyingTransaction', 'anyOf', 'VendCred'));

		var tempResults = nlapiSearchRecord('transaction', null, filters, columns);
		if (arrDataTemp.length == 0) {
			arrDataTemp = tempResults;
		} else {
			arrDataTemp = arrDataTemp.concat(tempResults);
		}

		var results = arrDataTemp;

		for (var i = 0; results != null && i < results.length; i++) {
			var id = results[i].getId();
			var amt = results[i].getValue(amtRemainingFld);
			dLog(
				'billcredit',
				JSON.stringify({
					id: id,
					amt: amt,
				})
			);
			if (id && amt) {
				if (arrBillData[id] == null) arrBillData[id] = [];

				if (amt == 0 || amt == 0.0 || amt == '') {
					continue;
				}

				arrBillData[id].push({
					bcnum: results[i].getValue('tranid', 'applyingTransaction'),
					bctrnxnum: results[i].getValue('transactionnumber', 'applyingTransaction'),
					bcamt: amt,
					bcmemo: results[i].getValue('memo', 'applyingTransaction'),
					bcdate: results[i].getValue('trandate', 'applyingTransaction'),
				});
			}
		}

		dAudit('getBillCredit', JSON.stringify(arrBillData));

		return arrBillData;
	} catch (e) {
		dErr('getBillCredit | ERROR - returning []', e);
		return [];
	}
}

// /**
//  *
//  * @param bills
//  * @returns {Array}
//  */
// function getChecks(billIds) {
// 	try {
// 		dAudit('getChecks', 'Get Checks Data for bill ids : ' + billIds);

// 		billIds.sort();
// 		var arr = billIds;

// 		var arrBillData = [];
// 		if (billIds.length < 1) return arrBillData;

// 		var columns = [];

// 		var arrDataTemp = [];

// 		while (billIds.length>999) {
// 			arr = billIds.splice(0, billIds.indexOf(billIds[999]));

// 			var filters = [];
// 			filters.push(new nlobjSearchFilter('internalid', null, 'anyOf', arr));

// 			var results = nlapiSearchRecord('transaction', null, filters, columns);
// 			arrDataTemp = arrDataTemp.concat(results);
// 		}

// 		var filters = [];
// 		filters.push(new nlobjSearchFilter('internalid', null, 'anyOf', arr));

// 		var tempResults = nlapiSearchRecord('transaction', null, filters, columns);
// 		if (arrDataTemp.length==0) {
// 			arrDataTemp = tempResults;
// 		} else {
// 			arrDataTemp = arrDataTemp.concat(tempResults);
// 		}

// 		var results = arrDataTemp;
// 		for (var i = 0; results != null && i < results.length; i++) {
// 			var id = results[i].getId();
// 			var amt = results[i].getValue(amtRemainingFld);
// 			dLog('billcredit', JSON.stringify({
// 				id: id,
// 				amt: amt
// 			}));
// 			if (id && amt) {

// 				if (arrBillData[id] == null)
// 					arrBillData[id] = [];

// 				if (amt==0 || amt==0.00 || amt=='') {
// 					continue;
// 				}

// 				arrBillData[id].push({
// 					bcnum : results[i].getValue('tranid', 'applyingTransaction'),
// 					bctrnxnum : results[i].getValue('transactionnumber', 'applyingTransaction'),
// 					bcamt : amt,
// 					bcmemo : results[i].getValue('memo', 'applyingTransaction'),
// 					bcdate : results[i].getValue('trandate', 'applyingTransaction')
// 				});
// 			}
// 		}

// 		dAudit('getBillCredit', JSON.stringify(arrBillData));

// 		return arrBillData;
// 	} catch (e) {
// 		dErr('getBillCredit | ERROR - returning []', e);
// 		return [];
// 	}
// }

/**
 *
 * @returns
 */
function yieldIfRequired(maxTime) {
	var processStartTime = new Date();

	maxTime = maxTime || 1800000;
	var timeElapsed = new Date() - processStartTime;

	if (nlapiGetContext().getRemainingUsage() < 200 || (timeElapsed && timeElapsed >= maxTime)) {
		var tempEMAIL_SENDER = EMAIL_SENDER;
		var tempEMAIL_SENDER_EMAIL = EMAIL_SENDER_EMAIL;
		var tempSUB_ID = SUB_ID;
		var tempACCOUNT = ACCOUNT;
		var tempAPACCOUNT = APACCOUNT;
		var tempBPM_DATE = BPM_DATE;
    var tempPROCESSASCHECK = PROCESS_AS_CHECK;

		var TEMP = {
      PROCESS_AS_CHECK: PROCESS_AS_CHECK,
			IS_MULTICURRENCY: IS_MULTICURRENCY,
			EMAIL_SENDER: EMAIL_SENDER,
			EMAIL_SENDER_EMAIL: EMAIL_SENDER_EMAIL,
			SUB_ID: SUB_ID,
			BILLIDS: BILLIDS,
			ACCOUNT: ACCOUNT,
			APACCOUNT: APACCOUNT,
			BPM_DATE: BPM_DATE,
			FILE_NAME_PREFIX: FILE_NAME_PREFIX,
			BILL_FOLDER: BILL_FOLDER,
			SEND_FILE_EMAIL: SEND_FILE_EMAIL,
			ERREMAIL_TO: ERREMAIL_TO,
			VPM_CONNECTOR_FOLDER: VPM_CONNECTOR_FOLDER,
			USE_ACCOUNT_LEVEL_FOLDERS: USE_ACCOUNT_LEVEL_FOLDERS,
			WF_NO_ACCOUNT_INFORMATION_IN_XML: WF_NO_ACCOUNT_INFORMATION_IN_XML,
			WIRE_FEES: WIRE_FEES,
			SINGLEBILLPYMTS: SINGLEBILLPYMTS,
			TOBEPRINTED: TOBEPRINTED,
			OTHERCHEQUE: OTHERCHEQUE,      
		};

		nlapiLogExecution('AUDIT', 'yieldIfRequired', 'Remaining usage, time elapsed: ' + nlapiGetContext().getRemainingUsage() + ', ' + timeElapsed);
		nlapiLogExecution('AUDIT', 'yieldIfRequired', '*** Yielding ***');

		// storeSettings();

		var yieldObject = nlapiYieldScript();
		nlapiLogExecution('AUDIT', 'yieldIfRequired', 'Yield size: ', yieldObject.size);
		if (yieldObject.status !== 'RESUME') {
			nlapiLogExecution('ERROR', 'yieldIfRequired', 'Yield status: ' + yieldObject.status, yieldObject.reason);
			throw nlapiCreateError('YIELD_ERROR', yieldObject.reason);
		}
		nlapiLogExecution('AUDIT', 'yieldIfRequired', '*** Resuming from Yield ***', yieldObject ? yieldObject.size || '' : '');
		processStartTime = new Date();

		//Copy script parameters.
		IS_MULTICURRENCY = TEMP.IS_MULTICURRENCY;
		EMAIL_SENDER = TEMP.EMAIL_SENDER;
		EMAIL_SENDER_EMAIL = TEMP.EMAIL_SENDER_EMAIL;
		SUB_ID = TEMP.SUB_ID;
		BILLIDS = TEMP.BILLIDS;
		ACCOUNT = TEMP.ACCOUNT;
		APACCOUNT = TEMP.APACCOUNT;
		BPM_DATE = TEMP.BPM_DATE;
		FILE_NAME_PREFIX = TEMP.FILE_NAME_PREFIX;
		BILL_FOLDER = TEMP.BILL_FOLDER;
		SEND_FILE_EMAIL = TEMP.SEND_FILE_EMAIL;
		ERREMAIL_TO = TEMP.ERREMAIL_TO;
		VPM_CONNECTOR_FOLDER = TEMP.VPM_CONNECTOR_FOLDER;
		USE_ACCOUNT_LEVEL_FOLDERS = TEMP.USE_ACCOUNT_LEVEL_FOLDERS;
		WF_NO_ACCOUNT_INFORMATION_IN_XML = TEMP.WF_NO_ACCOUNT_INFORMATION_IN_XML;
		WIRE_FEES = TEMP.WIRE_FEES;
		SINGLEBILLPYMTS = TEMP.SINGLEBILLPYMTS;
		TOBEPRINTED = TEMP.TOBEPRINTED;
		OTHERCHEQUE = TEMP.OTHERCHEQUE;
    PROCESS_AS_CHECK = nlapiGetContext().getSessionObject('PROCESS_AS_CHECK') || TEMP.PROCESS_AS_CHECK || tempPROCESSASCHECK;

		// EMAIL_SENDER = tempEMAIL_SENDER;
		// EMAIL_SENDER_EMAIL = tempEMAIL_SENDER_EMAIL;
		// SUB_ID = tempSUB_ID;
		// ACCOUNT = tempACCOUNT;
		// APACCOUNT = tempAPACCOUNT;
		// BPM_DATE = tempBPM_DATE;

		var objLog = {
      PROCESS_AS_CHECK: PROCESS_AS_CHECK,
			IS_MULTICURRENCY: IS_MULTICURRENCY,
			EMAIL_SENDER: EMAIL_SENDER,
			EMAIL_SENDER_EMAIL: EMAIL_SENDER_EMAIL,
			SUB_ID: SUB_ID,
			BILLIDS: BILLIDS,
			ACCOUNT: ACCOUNT,
			APACCOUNT: APACCOUNT,
			BPM_DATE: BPM_DATE,
			FILE_NAME_PREFIX: FILE_NAME_PREFIX,
			BILL_FOLDER: BILL_FOLDER,
			SEND_FILE_EMAIL: SEND_FILE_EMAIL,
			ERREMAIL_TO: ERREMAIL_TO,
			VPM_CONNECTOR_FOLDER: VPM_CONNECTOR_FOLDER,
			USE_ACCOUNT_LEVEL_FOLDERS: USE_ACCOUNT_LEVEL_FOLDERS,
			WF_NO_ACCOUNT_INFORMATION_IN_XML: WF_NO_ACCOUNT_INFORMATION_IN_XML,
			WIRE_FEES: WIRE_FEES,
			SINGLEBILLPYMTS: SINGLEBILLPYMTS,
			TOBEPRINTED: TOBEPRINTED,
			OTHERCHEQUE: OTHERCHEQUE,
      
		};
		dAudit('yielded', JSON.stringify(objLog));

		return 'T';
	} else {
		return 'F';
	}
}

function storeSettings() {
	nlapiGetContext().setSetting('SESSION', 'custscript_v17_1_bpm_datex', BPM_DATE);
	nlapiGetContext().setSetting('SESSION', 'custscript_v17_1_email_senderx', EMAIL_SENDER);
	nlapiGetContext().setSetting('SESSION', 'custscript_v17_1_email_sender_emailx', EMAIL_SENDER_EMAIL);
	nlapiGetContext().setSetting('SESSION', 'custscript_v17_1_sub_idx', SUB_ID);
	nlapiGetContext().setSetting('SESSION', 'custscript_v17_1_acctx', ACCOUNT);
	nlapiGetContext().setSetting('SESSION', 'custscript_v17_1_apacctx', APACCOUNT);
}

function inArray(val, arr) {
	var bIsValueFound = false;

	for (var i = 0; i < arr.length; i++) {
		if (val == arr[i]) {
			bIsValueFound = true;
			break;
		}
	}

	return bIsValueFound;
}

function getUserEmail() {
	return !isEmpty(EMAIL_SENDER) ? nlapiLookupField('employee', EMAIL_SENDER, 'email') : '';
}

function decimalTwoFormat(amtVal) {
	return Math.floor(parseFloat(amtVal) * 100) / 100;
}

function formatDate(dateObj) {
	if (isEmpty(dateObj)) return '';
	return dateObj.getFullYear() + '-' + pad(dateObj.getMonth() + 1, 2) + '-' + pad(dateObj.getDate(), 2);
}

function formatCurr(x) {
	if (x == '') return nlapiFormatCurrency('0');

	var num = decimalTwoFormat(x);
	x = nlapiFormatCurrency(num.toString());
	return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function isEmpty(fldValue) {
	return fldValue == '' || fldValue == null || fldValue == undefined;
}

function dAudit(logTitle, logDetails) {
	nlapiLogExecution('AUDIT', logTitle, logDetails);
}

function dErr(logTitle, logDetails) {
	nlapiLogExecution('ERROR', logTitle, logDetails);
}

function dLog(logTitle, logDetails) {
	nlapiLogExecution('DEBUG', logTitle, logDetails);
}

/**
 *
 * @param number
 * @param length
 * @param prefx
 * @returns {String}
 */
function padWPrefix(number, length, prefx) {
	var str = '' + number;
	while (str.length < length - 1) {
		str = '0' + str;
	}

	return prefx + str;
}

/**
 *
 * @param number
 * @param length
 * @returns {String}
 */
function pad(number, length) {
	var str = '' + number;
	while (str.length < length) {
		str = '0' + str;
	}

	return str;
}

/**
 *
 * @param val
 * @returns
 */
function getNumberVal(val) {
	return val == '' || val == null ? 0 : parseInt(val);
}

/**
 *
 * @param val
 * @returns
 */
function getFloatVal(val) {
	return isEmpty(val) ? 0.0 : parseFloat(val);
}

/**
 *
 * @param fldValue
 * @returns
 */
function setValue(fldValue, fldVal2) {
	if (!fldValue && !fldVal2) return '';

	return fldValue ? fldValue : fldVal2;
}

/**
 *
 * @param {Object}
 *            logTitle
 * @param {Object}
 *            logDetails
 */
function dAudit(logTitle, logDetails) {
	nlapiLogExecution('AUDIT', logTitle, logDetails);
}

function getCheckDetails(checkIds, objAcctMapping) {
	dAudit('getCheckDetails', JSON.stringify(checkIds));
	dAudit('getCheckDetails:objAcctMapping', JSON.stringify(objAcctMapping));
	if (checkIds.length == 0) return [];
  if (!objAcctMapping) return [];

	//Get check mapping to get check details
	var extraColumns = [];
	try {
		var cfilters = ['custrecord_ica_pm_cd_account_mapping', 'is', objAcctMapping[0].getId()];
		var checkDefRes = nlapiSearchRecord('customrecord_ica_pm_check_def', null, cfilters);

		if (checkDefRes != null) {
			var cfilters = ['custrecord_ica_pm_cdd_parent', 'is', checkDefRes[0].getId()];
			var columns = [];
			columns.push(new nlobjSearchColumn('custrecord_ica_pm_cdd_nid'));
			columns.push(new nlobjSearchColumn('custrecord_ica_pm_cdd_xml_mapping'));
			columns.push(new nlobjSearchColumn('custrecord_ica_pm_cdd_get_text'));
			var checkDefDetailsRes = nlapiSearchRecord('customrecord_ica_pm_check_def_details', null, cfilters, columns);
			if (checkDefDetailsRes != null) {
				for (var z = 0; z < checkDefDetailsRes.length; z++) {
					extraColumns.push({
						internalid: checkDefDetailsRes[z].getValue('custrecord_ica_pm_cdd_nid'),
						xmlmapping: checkDefDetailsRes[z].getValue('custrecord_ica_pm_cdd_xml_mapping'),
						gettext: checkDefDetailsRes[z].getValue('custrecord_ica_pm_cdd_get_text'),
					});
				}
			}
		}
	} catch (e) {
		dErr('Something happened retrieving check Definition', e.message);
	}
	dLog('ExtraColumns', JSON.stringify(extraColumns));

	var columns = [
		new nlobjSearchColumn('shipaddress'),
		new nlobjSearchColumn('transactionname'),
		new nlobjSearchColumn('entity'),
		new nlobjSearchColumn('memo'),  
		new nlobjSearchColumn('address', 'customer', null),
		new nlobjSearchColumn('addressee', 'customer', null),    
		new nlobjSearchColumn('address1', 'customer', null),
		new nlobjSearchColumn('address2', 'customer', null),
		new nlobjSearchColumn('address3', 'customer', null),
		new nlobjSearchColumn('city', 'customer', null),
		new nlobjSearchColumn('state', 'customer', null),
		new nlobjSearchColumn('zipcode', 'customer', null),
		new nlobjSearchColumn('country', 'customer', null),
		new nlobjSearchColumn('countrycode', 'customer', null),
		new nlobjSearchColumn('billaddress', 'employee', null),
		new nlobjSearchColumn('addressee', 'employee', null),
		new nlobjSearchColumn('address1', 'employee', null),
		new nlobjSearchColumn('address2', 'employee', null),
		new nlobjSearchColumn('address3', 'employee', null),
		new nlobjSearchColumn('city', 'employee', null),
		new nlobjSearchColumn('state', 'employee', null),
		new nlobjSearchColumn('zipcode', 'employee', null),
		new nlobjSearchColumn('country', 'employee', null),
		new nlobjSearchColumn('countrycode', 'employee', null),
		new nlobjSearchColumn('address', 'vendor', null),
		new nlobjSearchColumn('addressee', 'vendor', null),
		new nlobjSearchColumn('address1', 'vendor', null),
		new nlobjSearchColumn('address2', 'vendor', null),
		new nlobjSearchColumn('address3', 'vendor', null),
		new nlobjSearchColumn('city', 'vendor', null),
		new nlobjSearchColumn('state', 'vendor', null),
		new nlobjSearchColumn('zipcode', 'vendor', null),
		new nlobjSearchColumn('country', 'vendor', null),
		new nlobjSearchColumn('countrycode', 'vendor', null),
	];

  if (USE_CHECK_ADDR=='T') {
    columns.push(new nlobjSearchColumn('custbody_ica_vendor_name'));
    columns.push(new nlobjSearchColumn('custbody_ica_vendor_add_line_1'));
    columns.push(new nlobjSearchColumn('custbody_ica_vendor_add_line_2'));
    columns.push(new nlobjSearchColumn('custbody_ica_vendor_city'));
    columns.push(new nlobjSearchColumn('custbody_ica_vendor_state'));
    columns.push(new nlobjSearchColumn('custbody_ica_country_code'));
    columns.push(new nlobjSearchColumn('custbody_ica_zip_postal_code'));
    columns.push(new nlobjSearchColumn('custbody_ica_delivery_code'));
  }


	if (extraColumns) {
		for (var z = 0; z < extraColumns.length; z++) {
			if (extraColumns[z].internalid != 'addressee') {
				columns.push(new nlobjSearchColumn(extraColumns[z].internalid));
			}
		}
	}

	// dLog('columns', JSON.stringify(columns));
	checkIds.sort();
	var arr = checkIds;
  dAudit('arr', JSON.stringify(arr));
  dAudit('arr.length', arr.length);

	var results = [];
	while (checkIds.length > 999) {
		arr = checkIds.splice(0, checkIds.indexOf(checkIds[999]));
		dAudit('arr', JSON.stringify(arr));

		var checkSearch = nlapiSearchRecord('check', null, [
      ['type', 'anyof', 'Check'], 'AND', 
      ['mainline', 'is', 'T'], 'AND', 
      ['internalid', 'anyof', arr], 
      'AND',
      [
        ['vendor.isdefaultshipping', 'is', 'T'], 'OR',
        ['customer.isdefaultshipping', 'is', 'T'], 'OR',
        ['employee.isdefaultshipping', 'is', 'T']
      ]          
    ], columns);

		if (checkSearch != null && checkSearch.length > 0) {
			for (var i = 0; i < checkSearch.length; i++) {
				var obj = {
					internalid: checkSearch[i].getId(),
					memo: checkSearch[i].getValue('memo'),
					address: checkSearch[i].getValue('address', 'vendor') || checkSearch[i].getValue('address', 'employee') || checkSearch[i].getValue('address', 'customer'),          
					addressee: checkSearch[i].getValue('addressee', 'vendor') || checkSearch[i].getValue('addressee', 'employee') || checkSearch[i].getValue('addressee', 'customer'),
					address1: checkSearch[i].getValue('address1', 'vendor') || checkSearch[i].getValue('address1', 'employee') || checkSearch[i].getValue('address1', 'customer'),
					address2: checkSearch[i].getValue('address2', 'vendor') || checkSearch[i].getValue('address2', 'employee') || checkSearch[i].getValue('address2', 'customer'),
					address3: checkSearch[i].getValue('address3', 'vendor') || checkSearch[i].getValue('address3', 'employee') || checkSearch[i].getValue('address3', 'customer'),
					city: checkSearch[i].getValue('city', 'vendor') || checkSearch[i].getValue('city', 'employee') || checkSearch[i].getValue('city', 'customer'),
					state: checkSearch[i].getValue('state', 'vendor') || checkSearch[i].getValue('state', 'employee') || checkSearch[i].getValue('state', 'customer'),
					zipcode: checkSearch[i].getValue('zipcode', 'vendor') || checkSearch[i].getValue('zipcode', 'employee') || checkSearch[i].getValue('zipcode', 'customer'),
					country: checkSearch[i].getValue('country', 'vendor') || checkSearch[i].getValue('country', 'employee') || checkSearch[i].getValue('country', 'customer'),
					countrycode: checkSearch[i].getValue('countrycode', 'vendor'), // || checkSearch[i].getValue('countrycode', 'employee') || checkSearch[i].getValue('countrycode', 'customer'),
					entityname: checkSearch[i].getText('entity'),
          custbody_ica_vendor_name: checkSearch[i].getValue('custbody_ica_vendor_name'),
          custbody_ica_vendor_add_line_1: checkSearch[i].getValue('custbody_ica_vendor_add_line_1'),
          custbody_ica_vendor_add_line_2: checkSearch[i].getValue('custbody_ica_vendor_add_line_2'),
          custbody_ica_vendor_city: checkSearch[i].getValue('custbody_ica_vendor_city'),
          custbody_ica_vendor_state: checkSearch[i].getValue('custbody_ica_vendor_state'),
          custbody_ica_country_code: checkSearch[i].getValue('custbody_ica_country_code'),
          custbody_ica_delivery_code: checkSearch[i].getText('custbody_ica_delivery_code')

          // if (USE_CHECK_ADDR=='T') {
          //   arrBillsData[id] = {
          //   };
          // }

				};
				if (extraColumns) {
					for (var z = 0; z < extraColumns.length; z++) {
						if (extraColumns[z].internalid == 'addressee') {
							obj[extraColumns[z].internalid] = obj.addressee;
						} else {
							if (extraColumns[z].gettext == 'T') {
								obj[extraColumns[z].internalid] = checkSearch[i].getText(extraColumns[z].internalid);
							} else {
								obj[extraColumns[z].internalid] = checkSearch[i].getValue(extraColumns[z].internalid);
							}
						}
						obj[extraColumns[z].xmlmapping] = extraColumns[z].internalid;
					}
				}
				results.push(obj);
			}
		}
	}
	dLog('checkResults before last ', JSON.stringify(results));
	dAudit('checkIds before last', JSON.stringify(checkIds));

	// var checkSearch = nlapiSearchRecord('check', null, [['type', 'anyof', 'Check'], 'AND', ['mainline', 'is', 'T'], 'AND', ['internalid', 'anyof', checkIds]], columns);
  var checkSearch = nlapiSearchRecord('check', null, [
    ['type', 'anyof', 'Check'], 'AND', 
    ['mainline', 'is', 'T'], 'AND', 
    ['internalid', 'anyof', arr], 
    'AND',
    [
      ['vendor.isdefaultshipping', 'is', 'T'], 'OR',
      ['customer.isdefaultshipping', 'is', 'T'], 'OR',
      ['employee.isdefaultshipping', 'is', 'T']
    ]          
  ], columns);

	if (checkSearch != null && checkSearch.length > 0) {
		for (var i = 0; i < checkSearch.length; i++) {
			var obj = {
				internalid: checkSearch[i].getId(),
				memo: checkSearch[i].getValue('memo'),
				address: checkSearch[i].getValue('address', 'vendor') || checkSearch[i].getValue('address', 'employee') || checkSearch[i].getValue('address', 'customer'),
				addressee: checkSearch[i].getValue('addressee', 'vendor') || checkSearch[i].getValue('addressee', 'employee') || checkSearch[i].getValue('addressee', 'customer'),
				address1: checkSearch[i].getValue('address1', 'vendor') || checkSearch[i].getValue('address1', 'employee') || checkSearch[i].getValue('address1', 'customer'),
				address2: checkSearch[i].getValue('address2', 'vendor') || checkSearch[i].getValue('address2', 'employee') || checkSearch[i].getValue('address2', 'customer'),
				address3: checkSearch[i].getValue('address3', 'vendor') || checkSearch[i].getValue('address3', 'employee') || checkSearch[i].getValue('address3', 'customer'),
				city: checkSearch[i].getValue('city', 'vendor') || checkSearch[i].getValue('city', 'employee') || checkSearch[i].getValue('city', 'customer'),
				state: checkSearch[i].getValue('state', 'vendor') || checkSearch[i].getValue('state', 'employee') || checkSearch[i].getValue('state', 'customer'),
				zipcode: checkSearch[i].getValue('zipcode', 'vendor') || checkSearch[i].getValue('zipcode', 'employee') || checkSearch[i].getValue('zipcode', 'customer'),
				country: checkSearch[i].getValue('country', 'vendor') || checkSearch[i].getValue('country', 'employee') || checkSearch[i].getValue('country', 'customer'),
				countrycode: checkSearch[i].getValue('countrycode', 'vendor') || checkSearch[i].getValue('countrycode', 'employee') || checkSearch[i].getValue('countrycode', 'customer'),
				entityname: checkSearch[i].getText('entity'),
        custbody_ica_vendor_name: checkSearch[i].getValue('custbody_ica_vendor_name'),
        custbody_ica_vendor_add_line_1: checkSearch[i].getValue('custbody_ica_vendor_add_line_1'),
        custbody_ica_vendor_add_line_2: checkSearch[i].getValue('custbody_ica_vendor_add_line_2'),
        custbody_ica_vendor_city: checkSearch[i].getValue('custbody_ica_vendor_city'),
        custbody_ica_vendor_state: checkSearch[i].getValue('custbody_ica_vendor_state'),
        custbody_ica_country_code: checkSearch[i].getValue('custbody_ica_country_code'),
        custbody_ica_delivery_code: checkSearch[i].getText('custbody_ica_delivery_code'),
        custbody_ica_zip_postal_code: checkSearch[i].getValue('custbody_ica_zip_postal_code')

			};
			if (extraColumns) {
				for (var z = 0; z < extraColumns.length; z++) {
					if (extraColumns[z].internalid == 'addressee') {
						obj[extraColumns[z].internalid] = obj.addressee;
					} else {
						if (extraColumns[z].gettext == 'T') {
							obj[extraColumns[z].internalid] = checkSearch[i].getText(extraColumns[z].internalid);
						} else {
							obj[extraColumns[z].internalid] = checkSearch[i].getValue(extraColumns[z].internalid);
						}
					}
					obj[extraColumns[z].xmlmapping] = extraColumns[z].internalid;
				}
			}
			results.push(obj);
		}
	}

	dLog('checkResults', JSON.stringify(results));

	return results;
}

function getCustomFleetMappings(ACCOUNT) {
	try {
		var fmJSON = [];
		var res = nlapiSearchRecord(
			'customrecord_ica_cust_addr_mapping',
			null,
			['custrecord_ica_bpm_fvm_ba', 'anyof', ACCOUNT],
			[
				new nlobjSearchColumn('custrecord_ica_bpm_fvm_ba'),
				new nlobjSearchColumn('custrecord_ica_bpm_fvm_vn'),
				new nlobjSearchColumn('custrecord_ica_bpm_fvm_vrn'),
				new nlobjSearchColumn('custentity_vendorname', 'CUSTRECORD_ICA_BPM_FVM_VRN', null),
				new nlobjSearchColumn('custentity_vendoraddline1', 'CUSTRECORD_ICA_BPM_FVM_VRN', null),
				new nlobjSearchColumn('custentity_vendoraddline2', 'CUSTRECORD_ICA_BPM_FVM_VRN', null),
				new nlobjSearchColumn('custentity_vendorcity', 'CUSTRECORD_ICA_BPM_FVM_VRN', null),
				new nlobjSearchColumn('custentity_vendorstateprovince', 'CUSTRECORD_ICA_BPM_FVM_VRN', null),
				new nlobjSearchColumn('custentity_vendorcountrycode', 'CUSTRECORD_ICA_BPM_FVM_VRN', null),
				new nlobjSearchColumn('custentity_vendorpostalcode', 'CUSTRECORD_ICA_BPM_FVM_VRN', null),
				new nlobjSearchColumn('custentity_vendor_phone_num', 'CUSTRECORD_ICA_BPM_FVM_VRN', null),
			]
		);

		if (res != null) {
			for (var i = 0; i < res.length; i++) {
				fmJSON.push({
					accountmappings: res[i].getValue('custrecord_ica_bpm_fvm_ba'),
					vendorname: res[i].getValue('custrecord_ica_bpm_fvm_vn'),
					vendoreplacementname: {
						id: res[i].getValue('custrecord_ica_bpm_fvm_vrn'),
						name: res[i].getText('custrecord_ica_bpm_fvm_vrn'),
						address: {
							name: res[i].getValue('custentity_vendorname', 'CUSTRECORD_ICA_BPM_FVM_VRN'),
							addrline1: res[i].getValue('custentity_vendoraddline1', 'CUSTRECORD_ICA_BPM_FVM_VRN'),
							addrline2: res[i].getValue('custentity_vendoraddline2', 'CUSTRECORD_ICA_BPM_FVM_VRN'),
							city: res[i].getValue('custentity_vendorcity', 'CUSTRECORD_ICA_BPM_FVM_VRN'),
							state: res[i].getValue('custentity_vendorstateprovince', 'CUSTRECORD_ICA_BPM_FVM_VRN'),
							countrycode: res[i].getText('custentity_vendorcountrycode', 'CUSTRECORD_ICA_BPM_FVM_VRN'),
							zip: res[i].getValue('custentity_vendorpostalcode', 'CUSTRECORD_ICA_BPM_FVM_VRN'),
							phone: res[i].getValue('custentity_vendor_phone_num', 'CUSTRECORD_ICA_BPM_FVM_VRN'),
						},
					},
				});
			}
		}
		return fmJSON;
	} catch (e) {
		dErr('getCustomFleetMappings: Error encountered', e.message);
		return null;
	}
}

function getCustomDefinitionDetails(billIds, objAcctMapping) {
	if (billIds.length == 0) return [];

	//Get check mapping to get check details
	var extraColumns = [];
	var noCustomDefinition = false;
	try {
		var cfilters = [];
		cfilters.push(['custrecord_ica_pm_cd_account_mapping', 'is', objAcctMapping[0].getId()]);
		cfilters.push('AND');
		cfilters.push(['isinactive', 'is', 'F']);
		var checkDefRes = nlapiSearchRecord('customrecord_ica_pm_check_def', null, cfilters);

		if (checkDefRes != null) {
			var cfilters = [];
			cfilters.push(['custrecord_ica_pm_cdd_parent', 'is', checkDefRes[0].getId()]);
			cfilters.push('AND');
			cfilters.push(['isinactive', 'is', 'F']);
			var columns = [];
			columns.push(new nlobjSearchColumn('custrecord_ica_pm_cdd_nid'));
			columns.push(new nlobjSearchColumn('custrecord_ica_pm_cdd_xml_mapping'));
			columns.push(new nlobjSearchColumn('custrecord_ica_pm_cdd_get_text'));
			var checkDefDetailsRes = nlapiSearchRecord('customrecord_ica_pm_check_def_details', null, cfilters, columns);
			if (checkDefDetailsRes != null) {
				for (var z = 0; z < checkDefDetailsRes.length; z++) {
					extraColumns.push({
						internalid: checkDefDetailsRes[z].getValue('custrecord_ica_pm_cdd_nid'),
						xmlmapping: checkDefDetailsRes[z].getValue('custrecord_ica_pm_cdd_xml_mapping'),
						gettext: checkDefDetailsRes[z].getValue('custrecord_ica_pm_cdd_get_text'),
					});
				}
			} else {
				noCustomDefinition = true;
			}
		} else {
			noCustomDefinition = true;
		}
	} catch (e) {
		dErr('Something happened retrieving check Definition', e.message);
	}
	dLog('ExtraColumns', JSON.stringify(extraColumns));

	var columns = [
		new nlobjSearchColumn('shipaddress'),
		new nlobjSearchColumn('transactionname'),
		new nlobjSearchColumn('entity'),
		new nlobjSearchColumn('memo'),
		new nlobjSearchColumn('address', 'customer', null),
		new nlobjSearchColumn('addressee', 'customer', null),
		new nlobjSearchColumn('address1', 'customer', null),
		new nlobjSearchColumn('address2', 'customer', null),
		new nlobjSearchColumn('address3', 'customer', null),
		new nlobjSearchColumn('city', 'customer', null),
		new nlobjSearchColumn('state', 'customer', null),
		new nlobjSearchColumn('zipcode', 'customer', null),
		new nlobjSearchColumn('country', 'customer', null),
		new nlobjSearchColumn('countrycode', 'customer', null),
		new nlobjSearchColumn('billaddress', 'employee', null),
		new nlobjSearchColumn('addressee', 'employee', null),
		new nlobjSearchColumn('address1', 'employee', null),
		new nlobjSearchColumn('address2', 'employee', null),
		new nlobjSearchColumn('address3', 'employee', null),
		new nlobjSearchColumn('city', 'employee', null),
		new nlobjSearchColumn('state', 'employee', null),
		new nlobjSearchColumn('zipcode', 'employee', null),
		new nlobjSearchColumn('country', 'employee', null),
		new nlobjSearchColumn('countrycode', 'employee', null),
		new nlobjSearchColumn('address', 'vendor', null),
		new nlobjSearchColumn('addressee', 'vendor', null),
		new nlobjSearchColumn('address1', 'vendor', null),
		new nlobjSearchColumn('address2', 'vendor', null),
		new nlobjSearchColumn('address3', 'vendor', null),
		new nlobjSearchColumn('city', 'vendor', null),
		new nlobjSearchColumn('state', 'vendor', null),
		new nlobjSearchColumn('zipcode', 'vendor', null),
		new nlobjSearchColumn('country', 'vendor', null),
		new nlobjSearchColumn('countrycode', 'vendor', null),
	];

	if (extraColumns) {
		for (var z = 0; z < extraColumns.length; z++) {
			if (extraColumns[z].internalid != 'addressee') {
				columns.push(new nlobjSearchColumn(extraColumns[z].internalid));
			}
		}
	}

	// dLog('columns', JSON.stringify(columns));
	billIds.sort();
	var arr = billIds;

	var results = [];
	while (billIds.length > 999) {
		arr = billIds.splice(0, billIds.indexOf(billIds[999]));
		dAudit('arr', JSON.stringify(arr));

		var txnSearch = nlapiSearchRecord('transaction', null, [['mainline', 'is', 'T'], 'AND', ['internalid', 'anyof', arr]], columns);

		if (txnSearch != null && txnSearch.length > 0) {
			for (var i = 0; i < txnSearch.length; i++) {
				var obj = {
					internalid: txnSearch[i].getId(),
					memo: txnSearch[i].getValue('memo'),
					address: txnSearch[i].getValue('address', 'vendor') || txnSearch[i].getValue('address', 'employee') || txnSearch[i].getValue('address', 'customer'),
					addressee: txnSearch[i].getValue('addressee', 'vendor') || txnSearch[i].getValue('addressee', 'employee') || txnSearch[i].getValue('addressee', 'customer'),
					address1: txnSearch[i].getValue('address1', 'vendor') || txnSearch[i].getValue('address1', 'employee') || txnSearch[i].getValue('address1', 'customer'),
					address2: txnSearch[i].getValue('address2', 'vendor') || txnSearch[i].getValue('address2', 'employee') || txnSearch[i].getValue('address2', 'customer'),
					address3: txnSearch[i].getValue('address3', 'vendor') || txnSearch[i].getValue('address3', 'employee') || txnSearch[i].getValue('address3', 'customer'),
					city: txnSearch[i].getValue('city', 'vendor') || txnSearch[i].getValue('city', 'employee') || txnSearch[i].getValue('city', 'customer'),
					state: txnSearch[i].getValue('state', 'vendor') || txnSearch[i].getValue('state', 'employee') || txnSearch[i].getValue('state', 'customer'),
					zipcode: txnSearch[i].getValue('zipcode', 'vendor') || txnSearch[i].getValue('zipcode', 'employee') || txnSearch[i].getValue('zipcode', 'customer'),
					country: txnSearch[i].getValue('country', 'vendor') || txnSearch[i].getValue('country', 'employee') || txnSearch[i].getValue('country', 'customer'),
					countrycode: txnSearch[i].getValue('countrycode', 'vendor') || txnSearch[i].getValue('countrycode', 'employee') || txnSearch[i].getValue('countrycode', 'customer'),
					entityname: txnSearch[i].getText('entity'),
				};
				if (extraColumns) {
					obj['ncd'] = noCustomDefinition;
					for (var z = 0; z < extraColumns.length; z++) {
						if (extraColumns[z].internalid == 'addressee') {
							obj[extraColumns[z].internalid] = obj.addressee;
						} else {
							if (extraColumns[z].gettext == 'T') {
								obj[extraColumns[z].internalid] = txnSearch[i].getText(extraColumns[z].internalid);
							} else {
								obj[extraColumns[z].internalid] = txnSearch[i].getValue(extraColumns[z].internalid);
							}
						}
						obj[extraColumns[z].xmlmapping] = extraColumns[z].internalid;
					}
				}
				results.push(obj);
			}
		}
	}

	var txnSearch = nlapiSearchRecord('transaction', null, [['mainline', 'is', 'T'], 'AND', ['internalid', 'anyof', billIds]], columns);
	if (txnSearch != null && txnSearch.length > 0) {
		for (var i = 0; i < txnSearch.length; i++) {
			var obj = {
				internalid: txnSearch[i].getId(),
				memo: txnSearch[i].getValue('memo'),
				address: txnSearch[i].getValue('address', 'vendor') || txnSearch[i].getValue('address', 'employee') || txnSearch[i].getValue('address', 'customer'),
				addressee: txnSearch[i].getValue('addressee', 'vendor') || txnSearch[i].getValue('addressee', 'employee') || txnSearch[i].getValue('addressee', 'customer'),
				address1: txnSearch[i].getValue('address1', 'vendor') || txnSearch[i].getValue('address1', 'employee') || txnSearch[i].getValue('address1', 'customer'),
				address2: txnSearch[i].getValue('address2', 'vendor') || txnSearch[i].getValue('address2', 'employee') || txnSearch[i].getValue('address2', 'customer'),
				address3: txnSearch[i].getValue('address3', 'vendor') || txnSearch[i].getValue('address3', 'employee') || txnSearch[i].getValue('address3', 'customer'),
				city: txnSearch[i].getValue('city', 'vendor') || txnSearch[i].getValue('city', 'employee') || txnSearch[i].getValue('city', 'customer'),
				state: txnSearch[i].getValue('state', 'vendor') || txnSearch[i].getValue('state', 'employee') || txnSearch[i].getValue('state', 'customer'),
				zipcode: txnSearch[i].getValue('zipcode', 'vendor') || txnSearch[i].getValue('zipcode', 'employee') || txnSearch[i].getValue('zipcode', 'customer'),
				country: txnSearch[i].getValue('country', 'vendor') || txnSearch[i].getValue('country', 'employee') || txnSearch[i].getValue('country', 'customer'),
				countrycode: txnSearch[i].getValue('countrycode', 'vendor') || txnSearch[i].getValue('countrycode', 'employee') || txnSearch[i].getValue('countrycode', 'customer'),
				entityname: txnSearch[i].getText('entity'),
			};
			if (extraColumns) {
				obj['ncd'] = noCustomDefinition;
				for (var z = 0; z < extraColumns.length; z++) {
					if (extraColumns[z].internalid == 'addressee') {
						obj[extraColumns[z].internalid] = obj.addressee;
					} else {
						if (extraColumns[z].gettext == 'T') {
							obj[extraColumns[z].internalid] = txnSearch[i].getText(extraColumns[z].internalid);
						} else {
							obj[extraColumns[z].internalid] = txnSearch[i].getValue(extraColumns[z].internalid);
						}
					}
					obj[extraColumns[z].xmlmapping] = extraColumns[z].internalid;
				}
			}
			results.push(obj);
		}
	}

	dLog('customDefinition', JSON.stringify(results));

	return results;
}
