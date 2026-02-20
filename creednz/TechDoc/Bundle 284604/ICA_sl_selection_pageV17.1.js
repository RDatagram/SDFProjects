// switch to turn on scheduled payment creation
var ADDSCHED = true;

var EMAIL_SENDER = nlapiGetUser();

var isNonSubAcct = false;
var arrPayeeNoMap = [];

var PAYEE_COL = 3;
var AMT_ORIG_COL = 5;
var AMT_DUE_COL = 7;
var PAYMENT_TYPE_COL = 11;
var COMPNAME_COL = 13;
var VENDOR_CATEGORY_COL = 16;

var STAT_BILL_OPEN = 'Open';
var STAT_EXPENSE_REPORT_APPROVED_BY_ACCOUNTING = 'Approved by Accounting';

//RSF
var DELAY_RESULTS = nlapiGetContext().getSetting('SCRIPT', 'custscript_ica_bpm_delay_results');
var BASE_SAVED_SEARCH = nlapiGetContext().getSetting('SCRIPT', 'custscript_ica_bpm_saved_search_slet');
var TOTAL_BATCH_NUM = nlapiGetContext().getSetting('SCRIPT', 'custscript_ica_bpm_total_batch_num');

var arrBillType = [
	{
		id: 1,
		name: 'All',
	},
	{
		id: 2,
		name: 'Vendor Bills',
	},
	{
		id: 3,
		name: 'Employee Expenses',
	},
	{
		id: 4,
		name: 'Checks',
	},
	{
		id: 5,
		name: 'Customer Refunds',
	}
];

var dcSearch = nlapiSearchRecord(
	'customrecord_ica_bpm_dynamic_column',
	null,
	[],
	[
		new nlobjSearchColumn('custrecord_ica_bpm_dc_field_name'),
		new nlobjSearchColumn('custrecord_ica_bpm_dc_id'),
		new nlobjSearchColumn('custrecord_ica_bpm_dc_iac'),
		new nlobjSearchColumn('custrecord_ica_bpm_dc_gt'),
	]
);

var dfSearch = nlapiSearchRecord(
	'customrecord_ica_bpm_dynamic_filter',
	null,
	[],
	[
		new nlobjSearchColumn('custrecord_ica_bpm_df_field_name'),
		new nlobjSearchColumn('custrecord_ica_bpm_df_internal_id'),
		new nlobjSearchColumn('custrecord_ica_bpm_df_type'),
		new nlobjSearchColumn('custrecord_ica_bpm_df_source'),
		new nlobjSearchColumn('custrecord_ica_bpm_df_rid'),
	]
);
var typeText = {
	'Check Box': 'checkbox',
	Currency: 'currency',
	Date: 'date',
	'Date/Time': 'datetime',
	'List/Record': 'select',
	'Decimal Number': 'decimal',
	Document: 'document',
	'Email Address': 'email',
	'Free-Form Text': 'text',
};

var IAC = {
	Pay: 1,
	'Due Date': 2,
	Type: 3,
	ID: 4,
	'Company Name': 5,
	'Payment Method': 6,
	'Ref No.': 7,
	Currency: 8,
	'Original Amount': 9,
	'Amount Due': 10,
	'Vendor Category': 11,
	Priority: 12,
	'Disc. Date': 13,
	'Disc. Avail': 14,
	'Disc. Taken': 15,
	Payment: 16,
};

// 23	Help
// 13	Hyperlink
// 17	Image
// 40	Inline HTML
// 10	Integer Number
// 12	List/Record
// 35	Long Text
// 16	Multiple Select
// 20	Password
// 28	Percent
// 3	Phone Number
// 24	Rich Text
// 15	Text Area
// 14	Time Of Day



function toJSON(res) {
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
						if (propertyName == '' || propertyName == null)
							propertyName = columns[j].getName() + '_' + columns[j].getJoin() + '_' + columns[j].getSummary();
						jsonObj[propertyName] =
							res[i].getText(columns[j].getName(), columns[j].getJoin(), columns[j].getSummary()) ||
							res[i].getValue(columns[j].getName(), columns[j].getJoin(), columns[j].getSummary());
						propertyName = propertyName + '_id';
						jsonObj[propertyName] =
							res[i].getValue(columns[j].getName(), columns[j].getJoin(), columns[j].getSummary()) ||
							res[i].getValue(columns[j].getName(), columns[j].getJoin(), columns[j].getSummary());
					} else {
						if (propertyName == '' || propertyName == null) propertyName = columns[j].getName() + '_' + columns[j].getJoin();
						jsonObj[propertyName] =
							res[i].getText(columns[j].getName(), columns[j].getJoin()) ||
							res[i].getValue(columns[j].getName(), columns[j].getJoin());
						propertyName = propertyName + '_id';
						jsonObj[propertyName] =
							res[i].getValue(columns[j].getName(), columns[j].getJoin()) ||
							res[i].getValue(columns[j].getName(), columns[j].getJoin());
					}
				} else {
					if (columns[j].getSummary() != null) {
						if (propertyName == '' || propertyName == null) propertyName = columns[j].getName() + '_' + columns[j].getSummary();
						jsonObj[propertyName] =
							res[i].getText(columns[j].getName(), null, columns[j].getSummary()) ||
							res[i].getValue(columns[j].getName(), null, columns[j].getSummary());
						propertyName = propertyName + '_id';
						jsonObj[propertyName] =
							res[i].getValue(columns[j].getName(), null, columns[j].getSummary()) ||
							res[i].getValue(columns[j].getName(), null, columns[j].getSummary());
					} else {
						if (propertyName == '' || propertyName == null) propertyName = columns[j].getName();
						jsonObj[propertyName] = res[i].getText(columns[j].getName()) || res[i].getValue(columns[j].getName());
						propertyName = propertyName + '_id';
						jsonObj[propertyName] = res[i].getValue(columns[j].getName());
					}
				}
			}
			jsonArr.push(jsonObj);
		}
		return jsonArr;
	} catch (e) {
		log.error('nlobjSearchResults2JSON: Unexpected Error -', e.message);
		return null;
	}
}



function createCSV(request) {
	var params = request.getAllParameters();
	var standardFields = ['compid', 'h', 'script', 'deploy', 'c', 'aid'];
	var fields = {};
	// dLog('params', JSON.stringify(params));
	var dynamicParams = [];

	if (dfSearch != null) {
		for (var i = 0; i < dfSearch.length; i++) {
			var d = {
				label: dfSearch[i].getValue('custrecord_ica_bpm_df_field_name'),
				internalid: dfSearch[i].getValue('custrecord_ica_bpm_df_internal_id'),
				type: typeText[dfSearch[i].getText('custrecord_ica_bpm_df_type')] || 'text',
				source: dfSearch[i].getValue('custrecord_ica_bpm_df_source') || null,
				realinternalid: dfSearch[i].getValue('custrecord_ica_bpm_df_rid'),
				value: request.getParameter('custpage_' + dfSearch[i].getValue('custrecord_ica_bpm_df_internal_id')),
			};
			// dAudit('d.internalid', dfSearch[i].getValue('custrecord_ica_bpm_df_internal_id'));
			// dAudit('d', JSON.stringify(d));
			dynamicParams.push(d); //RSF
			// dynamicParams[d.realinternalid] = request.getParameter('custpage_' + d.internalid); //RSF
		}
	}

	dLog('dynamicParams', JSON.stringify(dynamicParams));

	for (param in params) {
		dAudit(param, params[param]);
		if (!_.includes(standardFields, param)) {
			fields[param] = params[param];
		}
	}
	dAudit('fields', JSON.stringify(fields));
	fields.subsidiary = request.getParameter('custpage_subsidiary_id');

	var objFltr = fields;
	dAudit('objFltr', JSON.stringify(fields));
	var subId = '';
	try {
		subId = nlapiLookupField('customrecord_ia_vendor_account_mapping', objFltr.account, 'custrecord_acct_map_sub');
	} catch (e) {}

	objFltr.subsidiary = subId;
	dAudit('createcsv.fields', JSON.stringify(fields));

	var filters = [];
	var accounts = [];

	if (!isEmpty(objFltr.selected)) {
		filters.push('AND');
		filters.push(['internalid', 'anyof', objFltr.selected.split(',')]);
	} else {
		if (!isEmpty(objFltr.apaccount)) {
			accounts.push(objFltr.apaccount);
			if (!isEmpty(objFltr.account)) accounts.push(objFltr.account);

			filters.push('AND');
			filters.push(['account', 'anyof', accounts]);
		} else if (!isEmpty(objFltr.selectedAPAcct)) {
			accounts.push(objFltr.selectedAPAcct);
			if (!isEmpty(objFltr.account)) accounts.push(objFltr.account);

			filters.push('AND');
			filters.push(['account', 'anyof', accounts]);
		}

		dAudit('account', JSON.stringify(accounts));

		if (!isEmpty(objFltr.subsidiary) && !isNonSubAcct) {
			filters.push('AND');
			filters.push(['subsidiary', 'anyof', objFltr.subsidiary]);
		}
		if (!isEmpty(objFltr.vendor)) {
			filters.push('AND');
			filters.push(['entity', 'anyof', objFltr.vendor]);
		}

		if (!isEmpty(objFltr.startduedate) && isEmpty(objFltr.endduedate)) {
			filters.push('AND');
			filters.push([
				[['type', 'anyof', 'VendBill'], 'AND', ['duedate', 'onorafter', objFltr.startduedate]],
				'OR',
				[
					['type', 'anyof', 'VendCred'],
					'AND',
					['trandate', 'onorafter', objFltr.startduedate],
					'AND',
					['amountremaining', 'greaterthan', '0.00'],
					'AND',
					['account', 'anyof', objFltr.selectedAPAcct || objFltr.apaccount],
					'AND',
					['subsidiary', 'anyof', objFltr.subsidiary],
				],
			]);
		} else if (!isEmpty(objFltr.startduedate) && !isEmpty(objFltr.endduedate)) {
			filters.push('AND');
			filters.push([
				[['type', 'anyof', 'VendBill'], 'AND', ['duedate', 'within', objFltr.startduedate, objFltr.endduedate]],
				'OR',
				[
					['type', 'anyof', 'VendCred'],
					'AND',
					['trandate', 'within', objFltr.startduedate, objFltr.endduedate],
					'AND',
					['amountremaining', 'greaterthan', '0.00'],
					'AND',
					['account', 'anyof', objFltr.selectedAPAcct || objFltr.apaccount],
					'AND',
					['subsidiary', 'anyof', objFltr.subsidiary],
				],
			]);
		} else if (isEmpty(objFltr.startduedate) && !isEmpty(objFltr.endduedate)) {
			filters.push('AND');
			filters.push([
				[['type', 'anyof', 'VendBill'], 'AND', ['duedate', 'onorbefore', objFltr.endduedate]],
				'OR',
				[
					['type', 'anyof', 'VendCred'],
					'AND',
					['trandate', 'onorbefore', objFltr.endduedate],
					'AND',
					['amountremaining', 'greaterthan', '0.00'],
					'AND',
					['account', 'anyof', objFltr.selectedAPAcct || objFltr.apaccount],
					'AND',
					['subsidiary', 'anyof', objFltr.subsidiary],
				],
			]);
		}

		if (!isEmpty(objFltr.paymentmethod)) {
			filters.push('AND');
			filters.push(['vendor.custentity_paymentmethod', 'is', objFltr.paymentmethod]); //revisit this
		}

		if (!isEmpty(objFltr.currency)) {
			filters.push('AND');
			filters.push(['currency', 'is', objFltr.currency]);
		}

		if (!isEmpty(objFltr.priority)) {
			if (objFltr.priority != 'F') {
				filters.push('AND');
				filters.push(['custbody_ica_priority_bill', 'is', objFltr.priority]);
			}
		}

		if (!isEmpty(objFltr.vendorcategory)) {
			filters.push('AND');
			filters.push(['vendor.category', 'is', objFltr.vendorcategory]);
		}

		if (objFltr.billtype == '2') {
			filters.push('AND');
			filters.push(['type', 'anyof', ['VendBill', 'LiabPymt']]);
		} else if (objFltr.billtype == '3') {
			filters.push('AND');
			filters.push(['type', 'anyof', ['ExpRept', 'LiabPymt']]);
		} else if (objFltr.billtype == '4') {
			//checks
			filters.push('AND');
			filters.push(['type', 'anyof', ['Check', 'check']]);
		}

		if (!isEmpty(objFltr.tobeprinted)) {
			if (objFltr.tobeprinted != 'F') {
				filters.push('AND');
				filters.push(['vendor.custentity_paymentmethod', 'anyof', '6']);
			}
		}

		//Add dynamic filters
		try {
			for (var i = 0; i < dynamicParams.length; i++) {
				if (!isEmpty(dynamicParams[i].value)) {
					if (dynamicParams[i].type == 'select') {
						filters.push('AND');
						filters.push([dynamicParams[i].realinternalid, 'anyof', dynamicParams[i].value]);
					}
					if (dynamicParams[i].type == 'checkbox') {
						filters.push('AND');
						filters.push([dynamicParams[i].realinternalid, 'is', dynamicParams[i].value]);
					}
				}
			}
		} catch (e) {
			dErr('Error adding dynamic filters', e.message);
		}
	}

	dAudit('filters', JSON.stringify(filters));

	var res = null;

	if (BASE_SAVED_SEARCH) {
		res = getAllRecords({
			rectype: 'transaction',
			searchid: BASE_SAVED_SEARCH,
			filters: filters,
		});
	} else {
		res = getAllRecords({
			rectype: 'transaction',
			searchid: BILLS_TO_PAY_SAVED_SEARCH,
			filters: filters,
		});
	}
	var resJSON = toJSON(res);

	var inputData = JSON.parse(objFltr.inputData);
	dAudit('inputData', JSON.stringify(inputData));

	var csv = [];
	for (var i = 0; i < resJSON.length; i++) {
		var res = resJSON[i];
		dAudit('res', JSON.stringify(res));

		var amtdue = res['Amount Remaining'] || ' ';
		if (res['Type'] == 'Bill Credit') amtdue = Number(amtdue) * -1;
    amtdue = Number(amtdue).toFixed(2);

		var disctaken = ' ';
		var payment = ' ';
		if (inputData.length > 0) {
			disctaken = _.filter(inputData, { id: String(res['Internal ID']) })[0].disctaken;
			payment = _.filter(inputData, { id: String(res['Internal ID']) })[0].payment;
		}

		var obj = {};
    try {
      obj.duedate = res['Due Date/Receive By'] || res['Date'] || ' ';
      addObjColumn(obj, res, 'Due Date');
      obj.type = res['Type'] || ' ';
      addObjColumn(obj, res, 'Type');
      obj.internalid = res['Internal ID'] || ' ';
      addObjColumn(obj, res, 'ID');
      obj.name = (res['Name'] || ' ').replace(/,/g, '-');
      addObjColumn(obj, res, 'Company Name');
      obj.payee = (res['Name'] || ' ').replace(/,/g, '-');
      addObjColumn(obj, res, 'Payee');
      obj.paymentmethod = res['vendor_pymt_method'] || res['employee_pymt_method'] || '';
      addObjColumn(obj, res, 'Payment Method');
  
      obj.refno = res['Document Number'].replace(/,/g, '-') || ' ';
      addObjColumn(obj, res, 'Document Number');
  
      obj.currency = res['Currency'] || ' ';
      addObjColumn(obj, res, 'Currency');
  
      obj.originalamt = res['Amount (Foreign Currency)'] || ' ';
      addObjColumn(obj, res, 'Original Amount');
      obj.amountdue = amtdue;
      addObjColumn(obj, res, 'Amount Due');
  
      obj.vendorcategory = (res.Category || '').replace(/,/g, ' ');
      addObjColumn(obj, res, 'Vendor Category');
      obj.priority = res['Priority Bill'] || ' ';
      addObjColumn(obj, res, 'Priority');
      obj['disc date'] = res['Bill Discount Date'] || ' ';
      addObjColumn(obj, res, 'Disc Date');
      obj['disc amount'] = res['Bill Discount Amount'] || ' ';
      addObjColumn(obj, res, 'Disc Amount');
      obj['disc taken'] = disctaken || ' ';
      addObjColumn(obj, res, 'Disc Taken');
      obj.payment = payment || ' ';
      addObjColumn(obj, res, 'Payment');
  
      csv.push(obj);
  
    } catch (e) {
      dErr('Error', e.message);
    }

		// csv.push({
		// 	duedate: res["Due Date/Receive By"] || res["Date"] || " ",
		// 	type: res["Type"] || " ",
		// 	internalid: res["Internal ID"] || " ",
		// 	name: (res["Name"] || " ").replace(/,/g, "-"),
		// 	payee: (res["Name"] || " ").replace(/,/g, "-"),
		// 	paymentmethod: res["vendor_pymt_method"] || res["employee_pymt_method"] || "",
		// 	refno: res["Document Number"].replace(/,/g, "-") || " ",
		// 	currency: res["Currency"] || " ",
		// 	originalamt: res["Amount (Foreign Currency)"] || " ",
		// 	amountdue: amtdue,
		// 	vendorcategory: (res.Category || "").replace(/,/g, " "),
		// 	priority: res["Priority Bill"] || " ",
		// 	"disc date": res["Bill Discount Date"] || " ",
		// 	"disc amount": res["Bill Discount Amount"] || " ",
		// 	"disc taken": disctaken || " ",
		// 	payment: payment || " ",
		// });
	}

	return csv;
}

function addObjColumn(obj, res, value) {
	var columnCheck = getValueCSVColumn(value);
	if (columnCheck) {
		obj[columnCheck] = res[columnCheck];
	}
	return obj;
}

function getValueCSVColumn(column) {
	if (dcSearch != null) {
		for (var i = 0; i < dcSearch.length; i++) {
			if (dcSearch[i].getValue('custrecord_ica_bpm_dc_iac') == IAC[column]) {
				return dcSearch[i].getValue('custrecord_ica_bpm_dc_id');
			}
		}
	}
	return null;
}

function ConvertToCSV(objArray) {
	var array = typeof objArray != 'object' ? JSON.parse(objArray) : objArray;
	var str = '';

	for (var i = 0; i < array.length; i++) {
		var line = '';
		for (var index in array[i]) {
			if (line != '') line += ',';      

      try {
        line += array[i][index].replace(/,/g, ' ');
      } catch (e) {}
			
		}
		str += line + '\r\n';
	}
	return str;
}

/**
 *
 */
function main(request, response) {
	dAudit('main', '>>> START <<<');
	try {
		var paramAPAcct = request.getParameter('custpage_ap_account');
		dAudit('main', 'paramAPAcct = ' + paramAPAcct);
		// var defaultAcctMap = getDefaultAcctMap();
		var reqMethod = request.getMethod();
		var paramSearchByPayType = nlapiGetContext().getSetting('SCRIPT', 'custscript_v16_searchby_paymenttype');
		var subsidiaryId = '';
		var subSidiary = '';

		try {
			subsidiaryId = nlapiGetContext().getSubsidiary();
			subSidiary = isEmpty(subsidiaryId) ? '' : nlapiLoadRecord('subsidiary', subsidiaryId).getFieldValue('name');

			if (isEmpty(subSidiary)) {
				subsidiaryId = '';
				isNonSubAcct = true;
			}
			if (!isEmpty(paramAPAcct)) subsidiaryId = nlapiLookupField('customrecord_ia_vendor_account_mapping', paramAPAcct, 'custrecord_acct_map_sub');
		} catch (e) {
			isNonSubAcct = true;
			subsidiaryId = nlapiGetContext().getSubsidiary();
		}

		dAudit('main', 'isNonSubAcct = ' + isNonSubAcct);

		var objAcctMapping = getAccountMapInfo(isNonSubAcct);
		dAudit('main', 'objAcctMapping ' + JSON.stringify(objAcctMapping));

		var stage = request.getParameter('custpage_stage');
		var paramSubsidiaryId = request.getParameter('custpage_subsidiary_id');
		var paramAPAcct = request.getParameter('custpage_ap_account');
		var paramBankAcct = request.getParameter('custpage_bank_account');
		var paramPostPeriod = request.getParameter('custpage_postingperiod');
		var paramDate = request.getParameter('custpage_trandate');
		var paymentType = request.getParameter('custpage_paymenttype');
		var vendorCategory = request.getParameterValues('custpage_vendor_categ'); //request.getParameter('custpage_vendor_categ');
		var billType = request.getParameter('custpage_bill_type');
		var billPayee = request.getParameterValues('custpage_payee');
		var sdateFilter = request.getParameter('custpage_sdate');
		var edateFilter = request.getParameter('custpage_edate');
		var currencyFilter = request.getParameter('custpage_currency'); //RSF
		var priorityFilter = request.getParameter('custpage_priority'); //RSF
		var createBillPaymentsPerBill = request.getParameter('custpage_singlebill'); //RSF
		var tobePrinted = request.getParameter('custpage_tobeprinted'); //RSF
		var otherChequeNum = request.getParameter('custpage_otherchequenum'); //RSF
    var processAsCheck = request.getParameter('custpage_processascheck'); //RSF
    var hasCL = request.getParameter('custpage_hascl'); //

		var dynamicParams = [];

		if (dfSearch != null) {
			for (var i = 0; i < dfSearch.length; i++) {
				var d = {
					label: dfSearch[i].getValue('custrecord_ica_bpm_df_field_name'),
					internalid: dfSearch[i].getValue('custrecord_ica_bpm_df_internal_id'),
					type: typeText[dfSearch[i].getText('custrecord_ica_bpm_df_type')] || 'text',
					source: dfSearch[i].getValue('custrecord_ica_bpm_df_source') || null,
					realinternalid: dfSearch[i].getValue('custrecord_ica_bpm_df_rid'),
					value: request.getParameter('custpage_' + dfSearch[i].getValue('custrecord_ica_bpm_df_internal_id')),
				};
				dAudit('d', JSON.stringify(d));
				dynamicParams.push(d); //RSF
				// dynamicParams[d.realinternalid] = request.getParameter('custpage_' + d.internalid); //RSF
			}
		}

		dLog('dynamicParams', JSON.stringify(dynamicParams));

		var bank_acctBalance = 0;
		var arrBillsSelected = [];
		var listCtr = request.getLineItemCount('result_list');
		var selectedAPAcct = '';

		// 7 Sep 2018 Add:
		// Store Bill Credit first
		for (var ic = 1; ic <= listCtr; ic++) {
			var isSelected = request.getLineItemValue('result_list', '_pay', ic);
			var linebillType = request.getLineItemValue('result_list', '_billtype', ic);

			if (linebillType != 'vendorcredit') continue;

			if (isSelected == 'T') {
				arrBillsSelected.push({
					id: request.getLineItemValue('result_list', '_billid', ic),
					type: linebillType,
					duedate: request.getLineItemValue('result_list', '_duedate_hdn', ic),
					origamt: request.getLineItemValue('result_list', '_orig_amt', ic),
					amtdue: request.getLineItemValue('result_list', '_amt_due', ic),
					pay: request.getLineItemValue('result_list', '_payment', ic),
					paymethod: request.getLineItemValue('result_list', '_paymethod', ic),
					discamt: request.getLineItemValue('result_list', '_disctaken', ic),
					payee: request.getLineItemValue('result_list', '_payee_id_hdn', ic),
					curr: request.getLineItemValue('result_list', '_currency_id_hdn', ic),
					billnum: request.getLineItemValue('result_list', '_trnx_num_hdn', ic),
					sub: paramSubsidiaryId,
				});
			}
		}

		// 7 Sep 2018 Add:
		for (var ix = 1; ix <= listCtr; ix++) {
			var isSelected = request.getLineItemValue('result_list', '_pay', ix);
			var linebillType = request.getLineItemValue('result_list', '_billtype', ix);

			if (linebillType == 'vendorcredit') continue;

			if (isSelected == 'T') {
				arrBillsSelected.push({
					id: request.getLineItemValue('result_list', '_billid', ix),
					type: linebillType,
					duedate: request.getLineItemValue('result_list', '_duedate_hdn', ix),
					origamt: request.getLineItemValue('result_list', '_orig_amt', ix),
					amtdue: request.getLineItemValue('result_list', '_amt_due', ix),
					pay: request.getLineItemValue('result_list', '_payment', ix),
					paymethod: request.getLineItemValue('result_list', '_paymethod_hdn', ix),
					discamt: request.getLineItemValue('result_list', '_disctaken', ix),
					payee: request.getLineItemValue('result_list', '_payee_id_hdn', ix),
					curr: request.getLineItemValue('result_list', '_currency_id_hdn', ix),
					billnum: request.getLineItemValue('result_list', '_trnx_num_hdn', ix),
					sub: paramSubsidiaryId,
				});
			}
		}

		dAudit(
			'main',
			JSON.stringify({
				listCtr: listCtr,
				stage: stage,
				paramDate: paramDate,
				paramAPAcct: paramAPAcct,
				paramBankAcct: paramBankAcct,
				paramPostPeriod: paramPostPeriod,
				arrBillsSelected: arrBillsSelected,
				subsidiaryId: subsidiaryId,
				paramSubsidiaryId: paramSubsidiaryId,
				paymentType: paymentType,
				vendorCategory: vendorCategory,
				billPayee: billPayee,
				billType: billType,
        hasCL: hasCL
			})
		);

		if ((hasCL=='T') || (arrBillsSelected.length < 1 && stage != 'C')) {
			var bpmForm = initPMForm(request);
      dLog('bpmForm', bpmForm);
			var apAccounts = nlapiSearchRecord('account', ACCOUNT_AP_SAVED_SEARCH, null, new nlobjSearchColumn('name'));
			var apAcct = bpmForm.getField('custpage_ap_account');
			var bankAcct = bpmForm.getField('custpage_bank_account');
			var defaultBankAcct = '';
			var postPeriodFld = bpmForm.getField('custpage_postingperiod');
			var arrPostingPeriod = getPostingPeriods();
      dLog('arrPostingPeriod', JSON.stringify(arrPostingPeriod));
			var postPeriodDefault = isEmpty(paramPostPeriod) ? getPostingDate() : paramPostPeriod;
			var payMethodFld = bpmForm.getField('custpage_paymenttype');
			var vendorCategFld = bpmForm.getField('custpage_vendor_categ');
			var billTypeFld = bpmForm.getField('custpage_bill_type');
			var payeeFld = bpmForm.getField('custpage_payee');
			var acctNdx = 0;

			for (k in objAcctMapping) {
				if (acctNdx == 0) defaultBankAcct = objAcctMapping[k].id;
				// bankAcct.addSelectOption(objAcctMapping[k].id, objAcctMapping[k].bank_account_name);
				bankAcct.addSelectOption(objAcctMapping[k].id, objAcctMapping[k].bank_account_name + ' - ' + objAcctMapping[k].name);
				// dAudit('Bank Accounts', JSON.stringify({
				// 	'objAcctMapping[k].id' : objAcctMapping[k].id,
				// 	'objAcctMapping[k].bank_account_name' : objAcctMapping[k].bank_account_name
				// }))
				acctNdx++;
			}

			if (!isEmpty(paramBankAcct)) {
				bankAcct.setDefaultValue(paramBankAcct);
			} else {
				// paramBankAcct = objAcctMapping[0].bank_account;
			}

			var currBankAcct = !isEmpty(paramBankAcct) ? paramBankAcct : defaultBankAcct;

			var arrPayMethod = [];
			if (!isEmpty(currBankAcct)) {
				var nsBankId = nlapiLookupField('customrecord_ia_vendor_account_mapping', currBankAcct, [
					'custrecord_acct_map_netsuite_account',
					'custrecord_acct_map_payment_methods',
				]);
				dLog('main', 'Acct Map Bank Acct id = ' + nsBankId.custrecord_acct_map_netsuite_account);

				if (nsBankId.custrecord_acct_map_payment_methods) arrPayMethod = nsBankId.custrecord_acct_map_payment_methods.split(',');

				var columns = [];
				columns.push(new nlobjSearchColumn('balance'));

				if (!isNonSubAcct) {
					columns.push(new nlobjSearchColumn('subsidiary'));
					columns.push(new nlobjSearchColumn('subsidiarynohierarchy'));
				}

				var rs = nlapiSearchRecord(
					'account',
					null,
					new nlobjSearchFilter('internalid', null, 'anyOf', nsBankId.custrecord_acct_map_netsuite_account),
					columns
				);
				if (rs != null) {
					dAudit('rs', JSON.stringify(rs[0]));

					if (!isNonSubAcct) {
						var subsidiaryTxt = rs[0].getText('subsidiarynohierarchy');

						if (!isEmpty(subsidiaryTxt)) subSidiary = subsidiaryTxt;

						if (!isEmpty(rs[0].getValue('subsidiary'))) subsidiaryId = parseInt(rs[0].getValue('subsidiary'));
					}

					bank_acctBalance = rs[0].getValue('balance');
				}
			}

			dLog('main', 'After checking Bank Sub | subsidiaryId = ' + subsidiaryId);
			dLog('main', 'After checking Bank Sub | subSidiary = ' + subSidiary);
			dLog('main', 'Bank Balance = ' + bank_acctBalance);

			if (isEmpty(subsidiaryId)) {
			}

			var defaultPosting = nlapiSearchRecord(
				'accountingperiod',
				null,
				[
					[['startdate', 'onorbefore', nlapiDateToString(new Date())], 'AND', ['enddate', 'onorafter', nlapiDateToString(new Date())]],
					'AND',
					['isquarter', 'is', 'F'],
					'AND',
					['isyear', 'is', 'F'],
					'AND',
					['closed', 'is', 'F'],
				],
				[new nlobjSearchColumn('periodname').setSort(false)]
			);
      // dLog('main', 'defaultPosting[0].getId() = ' + defaultPosting[0].getId());
      if (defaultPosting) {
        setSelectDefault(postPeriodFld, arrPostingPeriod, defaultPosting[0].getId());
      } else {
        setSelectDefault(postPeriodFld, arrPostingPeriod, postPeriodDefault);
      }
			

			var objPaymentMethods = [];
			if (arrPayMethod.length > 0) {
				objPaymentMethods = getPaymentMethod(arrPayMethod);
				// objPaymentMethods = getPaymentMethodNew();
				setSelectDefault(payMethodFld, objPaymentMethods, paymentType);
			}

			var arrVendorCateg = getVendorCategory();

			setSelectDefault(vendorCategFld, arrVendorCateg, vendorCategory);
			setSelectDefault(billTypeFld, arrBillType, billType);
			// dLog('bills', JSON.stringify(arrBillsSelected));
			// setSelectDefault(payeeFld, objPayee, billPayee);

			bpmForm.getField('custpage_payee').setDefaultValue(billPayee);
			bpmForm.getField('custpage_balance').setDefaultValue(bank_acctBalance);
			bpmForm.getField('custpage_trandate').setDefaultValue(nlapiDateToString(new Date()));
			bpmForm.getField('custpage_subsidiary').setDefaultValue(subSidiary);
			bpmForm.getField('custpage_sdate').setDefaultValue(sdateFilter);
			bpmForm.getField('custpage_edate').setDefaultValue(edateFilter);
			bpmForm.getField('custpage_subsidiary_id').setDefaultValue(subsidiaryId);
      if (IS_MULTICURRENCY) {
        bpmForm.getField('custpage_currency').setDefaultValue(currencyFilter); //RSF
      }			
			bpmForm.getField('custpage_priority').setDefaultValue(priorityFilter); //RSF
			bpmForm.getField('custpage_vendor_categ').setDefaultValue(vendorCategory); //RSF
			bpmForm.getField('custpage_tobeprinted').setDefaultValue(tobePrinted); //RSF
			bpmForm.getField('custpage_singlebill').setDefaultValue(createBillPaymentsPerBill); //RSF

			if (tobePrinted == 'T') {
				bpmForm.getField('custpage_otherchequenum').setDefaultValue(otherChequeNum); //RSF
			} else {
				bpmForm.getField('custpage_otherchequenum').setDefaultValue('F'); //RSF
			}
      bpmForm.getField('custpage_processascheck').setDefaultValue(processAsCheck); //RSF

			if (dynamicParams != null) {
				for (var i = 0; i < dynamicParams.length; i++) {
					if (!isEmpty(dynamicParams[i].value)) {
						bpmForm.getField('custpage_' + dynamicParams[i].internalid).setDefaultValue(dynamicParams[i].value); //RSF
					}
				}
			}

			for (var i = 0; apAccounts != null && i < apAccounts.length; i++) {
				if (i == 0) selectedAPAcct = apAccounts[i].getId();

				apAcct.addSelectOption(apAccounts[i].getId(), apAccounts[i].getValue('name'));
			}

			var selectedBankAccount = '';
			if (!isEmpty(paramAPAcct)) {
				selectedAPAcct = paramAPAcct;
				apAcct.setDefaultValue(paramAPAcct);
			} else {
				// TODO ask Al where to get the Default AP account in the
				// Account mapping new custom record
				try {
					// var context = nlapiGetContext();
					// var vpRec = getVendorDAC_CCRPaymentRec(context.getSubsidiary());
					// apAcct.setDefaultValue(vpRec[0].getValue('custrecord_ia_default_ap_account'));
					// bankAcct.setDefaultValue(vpRec[0].getValue('custrecord_ia_default_bank_account'));
					// // selectedAPAcct = vpRec[0].getValue('custrecord_ia_default_ap_account');
					// // selectedBankAccount = vpRec[0].getValue('custrecord_ia_default_bank_account');
					// dLog('main', 'should have assigned ap mapping = ' + vpRec[0].getValue('custrecord_ia_default_ap_account'));
					// dLog('main', 'should have assigned bank mapping = ' + vpRec[0].getValue('custrecord_ia_default_bank_account'));
				} catch (e) {
					dLog('main', 'error encountered ' + e.message);
				}
			}

			if (!isEmpty(currBankAcct)) {
				var nsBankId = nlapiLookupField('customrecord_ia_vendor_account_mapping', currBankAcct, [
					'custrecord_acct_map_netsuite_account',
					'custrecord_acct_map_payment_methods',
				]);
				selectedBankAccount = nsBankId.custrecord_acct_map_netsuite_account;
			}

			var arrPayees = [];
			var arrBillIds = [];
			var objFilter = {
				ap_acct: paramAPAcct || selectedAPAcct, //
				selectedAPAcct: selectedAPAcct,
				selectedBankAccount: selectedBankAccount,
				bankSub: subsidiaryId,
				subsidiaryId: subsidiaryId,
				sdateFilter: sdateFilter,
				edateFilter: edateFilter,
				paymentType: paymentType,
				// paymentTypeIds : arrPaymentMethodId,
				paramSearchByPayType: paramSearchByPayType,
				payee: billPayee,
				billtype: billType,
				currencyFilter: currencyFilter,
				priorityFilter: priorityFilter,
				vendorcategory: vendorCategory,
				tobeprinted: tobePrinted,
        processAsCheck: processAsCheck,
				dynamicparams: JSON.stringify(dynamicParams),
			};

			//RSF - Delay results.
			var billResults = '';
			if (DELAY_RESULTS == 'F') {
				billResults = getBills(objFilter);
			} else if (DELAY_RESULTS == 'T' && reqMethod == 'POST') {
				billResults = getBills(objFilter);
			}
			dAudit('main', 'Bill(s) found = ' + (billResults != null ? billResults.length : 0));

			var vendorsList = [];
			for (var a = 0; billResults != null && a < billResults.length; a++) {
				var arrResultsCol = billResults[a].getAllColumns();
				var payeeId = billResults[a].getValue(arrResultsCol[3].getName());
				var payeeText = billResults[a].getText(arrResultsCol[3].getName());
				if (!isEmpty(payeeId)) {
					arrPayees.push(payeeId);
					vendorsList.push({
						id: payeeId,
						name: payeeText,
					});
				}

				if (!isEmpty(billResults[a].getId())) arrBillIds.push(billResults[a].getId());
			}
			if (billResults != 0) {
				vendorsList = _.uniqBy(vendorsList, 'id');
				// dLog('vendorsList', JSON.stringify(vendorsList));
				setSelectDefault(payeeFld, vendorsList, billPayee);
			}

			var resultSubList = bpmForm.getSubList('result_list');
			var filterPaymentMethod = '';
			for (op in objPaymentMethods) {
				if (objPaymentMethods[op].id == paymentType) {
					filterPaymentMethod = objPaymentMethods[op].name;
					break;
				}
			}

			var filterVendorCategory = '';
			for (vcx in arrVendorCateg) {
				if (arrVendorCateg[vcx].id == vendorCategory) {
					filterVendorCategory = arrVendorCateg[vcx].name;
					break;
				}
			}

			dAudit('main', 'arrBillIds' + JSON.stringify(arrBillIds));

			var lnx = 1;
			for (var i = 0; billResults != null && i < billResults.length; i++) {
        // dAudit('in loop', 'billResults[' + i + ']');
				// if (billResults[i].getRecordType() == "check") dAudit("billResults", JSON.stringify(billResults[i]));

				var arrResultsCol = billResults[i].getAllColumns();        
				var payType = billResults[i].getValue(arrResultsCol[PAYMENT_TYPE_COL]);
        // dLog('payType:' + i, payType);
				var vendorCateg = billResults[i].getValue(arrResultsCol[VENDOR_CATEGORY_COL]);
				var payTypeLongName = '';
				var trnId = billResults[i].getId();
				var trnType = billResults[i].getRecordType();
				var trnTypeTxt = billResults[i].getText('type');
        // dLog('trnTypeTxt', trnTypeTxt);
				if (trnTypeTxt == 'Payroll Liability Check') trnType = 'liabpymt';

				var isValidPayType = false;
				for (acx in objPaymentMethods) {
					// dLog('payType.name', objPaymentMethods[acx].name);
					// dLog('payType.id', objPaymentMethods[acx].id);
					//RSF - pretty name

					if (payType == objPaymentMethods[acx].name) {
						//change to ID for long name

						isValidPayType = true;
						payTypeLongName = objPaymentMethods[acx].name;
						break;
					}
				}

				if (trnType == 'check') {
					payTypeLongName = 'CHK';
					payType = 'CHK';
				}

				if (!isValidPayType) continue;

				if (filterPaymentMethod && filterVendorCategory) {
					if (isEmpty(payType)) continue;
					if (isEmpty(vendorCateg)) continue;

					if (filterPaymentMethod != payType || filterVendorCategory != vendorCateg) continue;
				} else if (filterPaymentMethod && !filterVendorCategory) {
					if (isEmpty(payType)) continue;

					if (filterPaymentMethod != payType) {
						continue;
					}
				} else if (!filterPaymentMethod && filterVendorCategory) {
					if (isEmpty(vendorCateg)) continue;

					if (filterVendorCategory != vendorCateg) {
						continue;
					}
				}

				if (!payType) continue;

				var origAmt = billResults[i].getValue(arrResultsCol[AMT_ORIG_COL].getName());
				var amountDue = billResults[i].getValue(arrResultsCol[AMT_DUE_COL].getName());
				var payee = billResults[i].getValue(arrResultsCol[PAYEE_COL].getName());
        var payeeName = billResults[i].getText(arrResultsCol[PAYEE_COL].getName());
				// dLog('payeeName', payeeName);
				var payeeType = trnType != 'expensereport' ? 'vendor' : 'employee';
				var dueDate = billResults[i].getValue(arrResultsCol[0].getName()) || billResults[i].getValue('trandate');
				// var payeeLink = '<a href=' + nlapiResolveURL('RECORD', payeeType, payee) + '>' + billResults[i].getText(arrResultsCol[3].getName()) + '</a>';
				var payeeLink =
					'<a target="_blank" href="/app/common/entity/entity.nl?id=' +
					payee +
					'">' +
					billResults[i].getText(arrResultsCol[3].getName()) +
					'</a>';

				// var dueLink = '<a href=' + nlapiResolveURL('RECORD', trnType, trnId) + '>' + dueDate + '</a>';
				// var billTypeLink = '<a href=' + nlapiResolveURL('RECORD', trnType, trnId) + '>' + trnTypeTxt + '</a>';
				// var vendorCateg = billResults[i].getValue(arrResultsCol[15].getName()); //Vendor Category - see SAVED SEARCH - RSF
				var dueLink = '';
				var billTypeLink = '';
				try {
					dueLink = '<a href=' + nlapiResolveURL('RECORD', trnType, trnId) + '>' + dueDate + '</a>';
					billTypeLink = '<a href=' + nlapiResolveURL('RECORD', trnType, trnId) + '>' + trnTypeTxt + '</a>';
				} catch (e) {
					dueLink = dueDate;
					if (trnTypeTxt == 'Payroll Liability Check') {
						billTypeLink = '<a href="/app/accounting/transactions/liabpymt.nl?id=' + trnId + '">' + trnTypeTxt + '</a>';
					}
				}

				var discDate = billResults[i].getValue('custbody_bill_discount_date');
				var discAvail = billResults[i].getValue('custbody_bill_discount_amount');

				if (new Date() <= nlapiStringToDate(discDate)) resultSubList.setLineItemValue('_disctaken', lnx, discAvail);

				var origAmt = billResults[i].getValue(arrResultsCol[AMT_ORIG_COL].getName());
				if (trnType == 'liabpymt') origAmt = origAmt * -1;
				if (trnType == 'check') origAmt = origAmt * -1;

				var amtDue = getFloatVal(amountDue);
				if (trnType == 'vendorcredit') amtDue = amtDue * -1;
				if (trnType == 'liabpymt') amtDue = origAmt;
				if (trnType == 'check') amtDue = origAmt;

				resultSubList.setLineItemValue('_duedate', lnx, dueDate);
				resultSubList.setLineItemValue('_priority', lnx, billResults[i].getValue(arrResultsCol[17].getName()));
				resultSubList.setLineItemValue('_billtype_link', lnx, billTypeLink);
				resultSubList.setLineItemValue('_billid', lnx, billResults[i].getValue(arrResultsCol[2].getName()));
				//remove payee, add link to company name
				// resultSubList.setLineItemValue('_payee', lnx, payeeLink);
				// resultSubList.setLineItemValue('_comp_name', lnx, billResults[i].getValue(arrResultsCol[COMPNAME_COL]) || billResults[i].getText(arrResultsCol[3].getName()));
				resultSubList.setLineItemValue('_comp_name', lnx, payeeLink);
				resultSubList.setLineItemValue('_paymethod', lnx, payTypeLongName);
				resultSubList.setLineItemValue('_paymethod_hdn', lnx, payType);
				resultSubList.setLineItemValue('_ref_no', lnx, billResults[i].getValue(arrResultsCol[4].getName()));
        // dLog('IS_MULTICURRENCY', IS_MULTICURRENCY);
        if (IS_MULTICURRENCY) {
          resultSubList.setLineItemValue('_currency', lnx, billResults[i].getText('currency'));
        }
				
				resultSubList.setLineItemValue('_orig_amt', lnx, origAmt);
				// resultSubList.setLineItemValue('_amt_due', lnx, (trnType == 'vendorcredit') ? getFloatVal(amountDue) * -1 : amountDue);
				resultSubList.setLineItemValue('_amt_due', lnx, amtDue);
				resultSubList.setLineItemValue('_discdate', lnx, discDate);
				resultSubList.setLineItemValue('_discavail', lnx, discAvail);
				resultSubList.setLineItemValue('_vendor_categ', lnx, vendorCateg);

				if (dcSearch != null) {
					for (var z = 0; z < dcSearch.length; z++) {
						if (dcSearch[z].getValue('custrecord_ica_bpm_dc_gt') == 'T') {
							resultSubList.setLineItemValue(
								'_' + dcSearch[z].getValue('custrecord_ica_bpm_dc_id'),
								lnx,
								billResults[i].getText(dcSearch[z].getValue('custrecord_ica_bpm_dc_id'))
							);
						} else {
							resultSubList.setLineItemValue(
								'_' + dcSearch[z].getValue('custrecord_ica_bpm_dc_id'),
								lnx,
								billResults[i].getValue(dcSearch[z].getValue('custrecord_ica_bpm_dc_id'))
							);
						}
					}
				}

				// hidden field for due date
				resultSubList.setLineItemValue('_duedate_hdn', lnx, dueDate);
				// hidden field for bill type
				resultSubList.setLineItemValue('_billtype', lnx, trnType);
				// hidden field for bill number
				resultSubList.setLineItemValue('_trnx_num_hdn', lnx, billResults[i].getValue('tranid'));
				// hidden field for payee id (vendor or employee)
				resultSubList.setLineItemValue('_payee_id_hdn', lnx, payee);
        resultSubList.setLineItemValue('_payee_name', lnx, payeeName);
				// hidden field for bill currency
				resultSubList.setLineItemValue('_currency_id_hdn', lnx, billResults[i].getValue('currency'));

				// hidden field for vendor credit limit
        // dLog('audit', JSON.stringify(billResults[i].getValue('custentity_ica_bpm_credit_limit', 'vendor')));
				resultSubList.setLineItemValue('_vendor_cl', lnx, billResults[i].getValue('custentity_ica_bpm_credit_limit', 'vendor'));
				// hidden field for vendor credit card limit
        dLog('audit', JSON.stringify(billResults[i].getValue('custentity_ica_bpm_credit_card_limit', 'vendor')));
				resultSubList.setLineItemValue('_vendor_ccl', lnx, billResults[i].getValue('custentity_ica_bpm_credit_card_limit', 'vendor'));

				lnx++;
			}

			if (request.getParameter('action') == 'downloadcsv') {
				var fileContents = createCSV(request);
				var headerColumns = [];
				headerColumns.push('Due Date');
				addDynamicColumnsCSV(headerColumns, 'Due Date');
				headerColumns.push('Type');
				addDynamicColumnsCSV(headerColumns, 'Type');
				headerColumns.push('ID');
				addDynamicColumnsCSV(headerColumns, 'ID');
				headerColumns.push('Company Name');
				addDynamicColumnsCSV(headerColumns, 'Company Name');
				headerColumns.push('Payee');
				addDynamicColumnsCSV(headerColumns, 'Payee');
				headerColumns.push('Payment Method');
				addDynamicColumnsCSV(headerColumns, 'Payment Method');
				headerColumns.push('Ref No');
				addDynamicColumnsCSV(headerColumns, 'Ref No');
				headerColumns.push('Currency');
				addDynamicColumnsCSV(headerColumns, 'Currency');
				headerColumns.push('Original Amount');
				addDynamicColumnsCSV(headerColumns, 'Original Amount');
				headerColumns.push('Amount Due');
				addDynamicColumnsCSV(headerColumns, 'Amount Due');
				headerColumns.push('Vendor Category');
				addDynamicColumnsCSV(headerColumns, 'Vendor Category');
				headerColumns.push('Priority');
				addDynamicColumnsCSV(headerColumns, 'Priority');
				headerColumns.push('Disc Date');
				addDynamicColumnsCSV(headerColumns, 'Disc Date');
				headerColumns.push('Disc Amount');
				addDynamicColumnsCSV(headerColumns, 'Disc Amount');
				headerColumns.push('Disc Taken');
				addDynamicColumnsCSV(headerColumns, 'Disc Taken');
				headerColumns.push('Payment');
				addDynamicColumnsCSV(headerColumns, 'Payment');

				headerColumns = headerColumns.toString();
				headerColumns += '\r\n';
				headerColumns += ConvertToCSV(fileContents);

				// var contents = "Due Date, Type, ID, Company Name, Payee, Payment Method, Ref No, Currency, Original Amount, Amount Due, Vendor Category, Priority, Disc Date, Disc Amount, Disc Taken, Payment \r\n";
				// contents += ConvertToCSV(fileContents);

				var file = nlapiCreateFile('results.csv', 'CSV', headerColumns);
				file.setFolder('-15');

				var id = nlapiSubmitFile(file);
				var f = nlapiLoadFile(id);

				nlapiGetContext().getSetting('SCRIPT', 'custscript_v16_searchby_paymenttype');
				response.write(f.getURL());
				return;
			}

			response.writePage(bpmForm);
		} else {
			dLog('main | billsubmit', 'arrBillsSelected len = ' + arrBillsSelected.length);

			var resultsForm = nlapiCreateForm('Vendor Payment(s) created');

			var arrBillIds = [];
			// var arrBillPayAmt = [];
			for (a in arrBillsSelected) {
				arrBillIds.push(arrBillsSelected[a].id);
				// arrBillPayAmt[arrBillsSelected[a].id] =
				// arrBillsSelected[a].pay;
			}
			dAudit('main | billsubmit', 'otherChequeNum ' + otherChequeNum);
			var objParam1 = {
				custscript_v17_1_bpm_date: paramDate,
        custscript_ica_bpm_processascheck: processAsCheck,
				custscript_v17_1_bill_ids: JSON.stringify(arrBillsSelected),
				custscript_v17_1_acct: paramBankAcct,
				custscript_v17_1_apacct: paramAPAcct,
				custscript_v17_1_email_sender: EMAIL_SENDER,
				custscript_v17_1_email_sender_email: getUserEmail(),
				custscript_v17_1_sub_id: paramSubsidiaryId,
				custscript_ica_bpm_cbp_pb: createBillPaymentsPerBill,
				custscript_ica_to_be_printed: tobePrinted,
				custscript_ica_bpm_othercheque: otherChequeNum,
        
			};
			nlapiScheduleScript(VPM_SS_BPAYMENT_CREATION_SCRIPT_ID, null, objParam1);

			// var objParam1 = {
			// 	custscript_icapm_bpm_date : paramDate,
			// 	custscript_icapm_bill_ids : JSON.stringify(arrBillsSelected),
			// 	custscript_icapm_account : paramBankAcct,
			// 	custscript_icapm_apaccount : paramAPAcct,
			// 	custscript_icapm_email_sender : EMAIL_SENDER
			// };

			dAudit('main | billsubmit', 'Sched Input param = ' + JSON.stringify(objParam1));

			// nlapiScheduleScript('customscript_ica_pm_payments', null, objParam1);

			summaryPage(arrBillsSelected, response);
		}
	} catch (e) {
		var stErrMsg = '';
		if (e.getDetails != undefined) {
			stErrMsg = 'Script Error: ' + e.getCode() + '<br>' + e.getDetails() + '<br>' + e.getStackTrace();
		} else {
			stErrMsg = 'Script Error: ' + e.toString();
		}

		nlapiLogExecution('DEBUG', 'Script Error', stErrMsg);
		throw nlapiCreateError('99999', stErrMsg);
	}

	dLog('main', '>>> END <<<');
}

function addDynamicColumns(resultSubList, column) {
	if (dcSearch != null) {
		for (var i = 0; i < dcSearch.length; i++) {
			if (dcSearch[i].getValue('custrecord_ica_bpm_dc_iac') == IAC[column]) {
				return resultSubList.addField(
					'_' + dcSearch[i].getValue('custrecord_ica_bpm_dc_id'),
					'text',
					dcSearch[i].getValue('custrecord_ica_bpm_dc_field_name')
				);
				// if (dcSearch[i].getValue('custrecord_ica_bpm_dc_gt')=='T') {
				// 	return resultSubList.addField('_' + dcSearch[i].getValue('custrecord_ica_bpm_dc_id'), 'text', dcSearch[i].getText('custrecord_ica_bpm_dc_field_name') || dcSearch[i].getValue('custrecord_ica_bpm_dc_field_name'));
				// } else {

				// }
			}
		}
	}
}

function addDynamicColumnsCSV(headerColumns, column) {
	if (dcSearch != null) {
		for (var i = 0; i < dcSearch.length; i++) {
			if (dcSearch[i].getValue('custrecord_ica_bpm_dc_iac') == IAC[column]) {
				return headerColumns.push(dcSearch[i].getValue('custrecord_ica_bpm_dc_field_name'));
			}
		}
	}
}

/**
 *
 * @returns
 */
function initPMForm(request) {
	try {
		var payForm = nlapiCreateForm('iCloudAuthority - Payment Module');
		payForm.setScript(VPM_CS_SCRIPT_ID);

		// load subsidiary vendor payment
		var context = nlapiGetContext();
		// var vpRec = getVendorDAC_CCRPaymentRec(context.getSubsidiary());

		// load css and jQuery library
		var extContent = '<script src="https://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js"></script>';
		extContent += '<script src="https://ajax.googleapis.com/ajax/libs/jqueryui/1.8/jquery-ui.min.js"></script>';

		var baseFilters = payForm.addFieldGroup('custpage_grp_base', 'Filters');

		payForm.addField('custpage_jqueryloader', 'inlinehtml', '').setDefaultValue(extContent);
		payForm.addField('custpage_emp_space', 'inlinehtml', '').setDefaultValue('<br>');
		payForm.addField('custpage_ap_account', 'select', 'A/P Account', null, 'custpage_grp_base');
		payForm.addField('custpage_bank_account', 'select', 'Bank Account', null, 'custpage_grp_base');
		payForm.addField('custpage_balance', 'currency', 'Balance', null, 'custpage_grp_base').setDisplayType('disabled');
    
    var counter = payForm.addField('custpage_counter', 'text', 'Transactions Selected', null, 'custpage_grp_base');
    counter.setDisplayType('inline');

		payForm.addField('custpage_trandate', 'date', 'Date', null, 'custpage_grp_base').setMandatory(true);
		payForm.addField('custpage_postingperiod', 'select', 'Posting Period', null, 'custpage_grp_base');
		payForm.addField('custpage_amount', 'currency', 'Amount', null, 'custpage_grp_base').setDisplayType('disabled').setDefaultValue('0.00');
		payForm.addField('custpage_subsidiary', 'text', 'Subsidiary', null, 'custpage_grp_base').setBreakType('startcol').setDisplayType('inline');
		payForm
			.addField('custpage_bill_type', 'select', 'Bill Type', null, 'custpage_grp_base')
			.setHelpText('Select transaction type', true)
			.setDefaultValue(1);
		payForm.addField('custpage_paymenttype', 'select', 'Payment Method', null, 'custpage_grp_base');
		payForm.addField('custpage_vendor_categ', 'multiselect', 'Vendor Category', null, 'custpage_grp_base').setDisplaySize(280, 3);
    if (IS_MULTICURRENCY) {
      payForm.addField('custpage_currency', 'select', 'Currency', 'currency', 'custpage_grp_base'); //RSF
    }
		
		payForm.addField('custpage_priority', 'checkbox', 'Priority', null, 'custpage_grp_base'); //RSF
		payForm.addField('custpage_payee', 'multiselect', 'Vendor/Employee', null, 'custpage_grp_base').setBreakType('startcol').setDisplaySize(280, 3);
		payForm.addField('custpage_location', 'select', 'Location', 'location', 'custpage_grp_base');
		payForm.addField('custpage_sdate', 'date', 'Start Due Date', null, 'custpage_grp_base');
		payForm.addField('custpage_edate', 'date', 'End Due Date', null, 'custpage_grp_base');

		var options = payForm.addFieldGroup('custpage_grp_options', 'Options');
		var optionalFilters = payForm.addFieldGroup('custpage_grp_filters', 'Dynamic Filters');

    payForm.addField('custpage_processascheck', 'checkbox', 'Process as Check', null, 'custpage_grp_options'); //RSF
		payForm.addField('custpage_singlebill', 'checkbox', 'Create Bill Payments per Bill', null, 'custpage_grp_options'); //RSF
		payForm.addField('custpage_tobeprinted', 'checkbox', 'Create Manual Check', null, 'custpage_grp_options'); //RSF
		payForm.addField('custpage_otherchequenum', 'checkbox', 'Use Custom Check Numbering', null, 'custpage_grp_options'); //RSF
    
    //Counter
    var batchNum = payForm.addField('custpage_tbn', 'currency', 'tbn');
    batchNum.setDefaultValue(TOTAL_BATCH_NUM);
    batchNum.setDisplayType('hidden');
    

		if (dfSearch != null) {
			for (var i = 0; i < dfSearch.length; i++) {
				var d = {
					label: dfSearch[i].getValue('custrecord_ica_bpm_df_field_name'),
					internalid: dfSearch[i].getValue('custrecord_ica_bpm_df_internal_id'),
					type: typeText[dfSearch[i].getText('custrecord_ica_bpm_df_type')] || 'text',
					source: dfSearch[i].getValue('custrecord_ica_bpm_df_source') || null,
				};

        if (d.internalid)
				  payForm.addField('custpage_' + d.internalid, d.type, d.label, d.source, 'custpage_grp_filters'); //RSF
			}
		}

		var delay = payForm.addField('custpage_delay_result', 'inlinehtml', '');
		delay.setDefaultValue(DELAY_RESULTS);
		delay.setDisplayType('hidden');

		var hasCL = payForm.addField('custpage_hascl', 'text', '');
		hasCL.setDefaultValue('F');
		hasCL.setDisplayType('hidden');

		var reqMethod = request.getMethod();

		if (DELAY_RESULTS == 'T' && reqMethod == 'GET') {
			var field = payForm.addField('custpage_warning', 'inlinehtml', '');
			field.setLayoutType('outsideabove');
			field.setDefaultValue('<b style="color: red;">THIS SUITELET WILL DISPLAY RESULTS ONCE YOU SELECT FILTERS.</b>');
		}

		if (DELAY_RESULTS == 'T') {
			payForm.addButton('custombutton7', 'Display Results', 'displayresults()');
		}

		// hidden field
		payForm.addField('custpage_stage', 'text', 'Stage').setDisplayType('hidden').setDefaultValue('C');
		payForm.addField('custpage_subsidiary_id', 'text', 'Subsidiary Id').setDisplayType('hidden');



		// display sublist //custpage_
		var resultSubList = payForm.addSubList('result_list', 'list', '');
		resultSubList.addField('_pay', 'checkbox', 'Pay');
		addDynamicColumns(resultSubList, 'Pay');

		resultSubList.addField('_duedate', 'date', 'Due Date');
		addDynamicColumns(resultSubList, 'Due Date');
		resultSubList.addField('_billtype_link', 'text', 'Type');
		addDynamicColumns(resultSubList, 'Type');
		resultSubList.addField('_billid', 'text', 'ID');
		addDynamicColumns(resultSubList, 'ID');
		resultSubList.addField('_comp_name', 'text', 'Company Name');
		addDynamicColumns(resultSubList, 'Company Name');
		// resultSubList.addField('_payee', 'text', 'Payee');
		resultSubList.addField('_paymethod', 'text', 'Payment Method');
		addDynamicColumns(resultSubList, 'Payment Method');

		resultSubList.addField('_ref_no', 'text', 'Ref No.');
		addDynamicColumns(resultSubList, 'Ref No.');
    if (IS_MULTICURRENCY) {
      resultSubList.addField('_currency', 'text', 'Currency');
      addDynamicColumns(resultSubList, 'Currency');  
    }
		resultSubList.addField('_orig_amt', 'currency', 'Original Amount').setDisplayType('inline');
		addDynamicColumns(resultSubList, 'Original Amount');
		resultSubList.addField('_amt_due', 'currency', 'Amount Due').setDisplayType('inline');
		addDynamicColumns(resultSubList, 'Amount Due');
		resultSubList.addField('_vendor_categ', 'text', 'Vendor Category').setDisplayType('inline'); //RSF
		addDynamicColumns(resultSubList, 'Vendor Category');
		resultSubList.addField('_priority', 'text', 'Priority');
		addDynamicColumns(resultSubList, 'Priority');
		resultSubList.addField('_discdate', 'text', 'Disc. Date').setDisplayType('inline');
		addDynamicColumns(resultSubList, 'Disc. Date');
		resultSubList.addField('_discavail', 'currency', 'Disc. Avail').setDisplayType('inline');
		addDynamicColumns(resultSubList, 'Disc. Avail');

		resultSubList.addField('_disctaken', 'currency', 'Disc. Taken').setDisplayType('entry');
		addDynamicColumns(resultSubList, 'Disc. Taken');
		resultSubList.addField('_payment', 'currency', 'Payment').setDisplayType('entry');
		addDynamicColumns(resultSubList, 'Payment');

		// if (dcSearch!=null) {
		// 	for (var i=0; i<dcSearch.length; i++) {
		// 		if (dcSearch[i].getValue('custrecord_ica_bpm_dc_iac')==IAC['Pay']) {
		// 			resultSubList.addField('_' + dcSearch[i].getValue('custrecord_ica_bpm_dc_id'), 'text', dcSearch[i].getValue('custrecord_ica_bpm_dc_field_name'));
		// 		}
		// 	}
		// }

		// hidden fields
		resultSubList.addField('_billtype', 'text', 'Bill Type- hidden').setDisplayType('hidden');
		resultSubList.addField('_trnx_num_hdn', 'text', 'Trans No.- hidden').setDisplayType('hidden');
		resultSubList.addField('_payee_id_hdn', 'text', 'Payee Id - hidden').setDisplayType('hidden');
    resultSubList.addField('_payee_name', 'text', 'Payee Name').setDisplayType('hidden');
		resultSubList.addField('_currency_id_hdn', 'text', 'Currency Id - hidden').setDisplayType('hidden');
		resultSubList.addField('_duedate_hdn', 'text', 'Due date - hidden').setDisplayType('hidden');
    resultSubList.addField('_vendor_cl', 'text', 'Vendor Credit Limit').setDisplayType('hidden');
    resultSubList.addField('_vendor_ccl', 'text', 'Vendor Credit Card Limit').setDisplayType('hidden');

		resultSubList.addField('_paymethod_hdn', 'text', 'PM Id - hidden').setDisplayType('hidden');

		payForm.addSubmitButton('Save');
		payForm.addButton('custombutton2', 'Cancel');
		payForm.addResetButton('Reset');
		payForm.addButton('custombutton4', 'Mark All', 'toMark(true);');
		payForm.addButton('custombutton5', 'Unmark All', 'toMark(false);');
		payForm.addButton('custombutton6', 'Download CSV', 'downloadCSV()');

		return payForm;
	} catch (e) {
		var stErrMsg = '';
		if (e.getDetails != undefined) {
			stErrMsg = 'Script Error: ' + e.getCode() + '<br>' + e.getDetails() + '<br>' + e.getStackTrace();
		} else {
			stErrMsg = 'Script Error: ' + e.toString();
		}

		nlapiLogExecution('DEBUG', 'Script Error', stErrMsg);
		throw nlapiCreateError('99999', stErrMsg);
	}
}

// function getBillsREF(objFltr) {

// 	dLog('getBillsREF', 'objFltr = ' + JSON.stringify(objFltr));

// 	var filter = [];
// 	if (!isEmpty(objFltr.ap_acct)) {

// 		filter.push(new nlobjSearchFilter('account', null, 'anyOf', objFltr.ap_acct));
// 	} else if (!isEmpty(objFltr.selectedAPAcct)) {

// 		filter.push(new nlobjSearchFilter('account', null, 'anyOf', objFltr.selectedAPAcct));
// 	}

// 	if (!isEmpty(objFltr.bankSub) && !isNonSubAcct)
// 		filter.push(new nlobjSearchFilter('subsidiary', null, 'anyOf', objFltr.bankSub));

// 	if (!isEmpty(objFltr.vendor))
// 		filter.push(new nlobjSearchFilter('entity', null, 'anyOf', objFltr.vendor));

// 	if (!isEmpty(objFltr.sdateFilter) && isEmpty(objFltr.edateFilter)) {

// 		filter.push(new nlobjSearchFilter('duedate', null, 'onorafter', objFltr.sdateFilter));

// 	} else if (!isEmpty(objFltr.sdateFilter) && !isEmpty(objFltr.edateFilter)) {

// 		filter.push(new nlobjSearchFilter('duedate', null, 'within', objFltr.sdateFilter, objFltr.edateFilter));

// 	} else if (isEmpty(objFltr.sdateFilter) && !isEmpty(objFltr.edateFilter)) {

// 		filter.push(new nlobjSearchFilter('duedate', null, 'onorbefore', objFltr.edateFilter));
// 	}

// 	if (!isEmpty(objFltr.currencyFilter))
// 		filter.push(new nlobjSearchFilter('currency', null, 'is', objFltr.currencyFilter));

// 	if (!isEmpty(objFltr.priorityFilter))
// 		filter.push(new nlobjSearchFilter('custbody_ica_priority_bill', null, 'is', objFltr.priorityFilter));

// 	if (!isEmpty(objFltr.vendorcategory))
// 		filters.push(new nlobjSearchFilter('category', 'vendor', 'is', objFltr.vendorcategory));

// 	if (!isEmpty(objFltr.paymentType)) {
// 		filter.push(new nlobjSearchFilter('custentity_paymentmethod', 'vendor', 'anyOf', objFltr.paymentType));
// 	}

// 	if (objFltr.paramSearchByPayType == 'T') {

// 		var arrPayTypes = [];
// 		for (x in objPaymentMethods) {
// 			arrPayTypes.push(objPaymentMethods[x].id);
// 		}

// 		filter.push(new nlobjSearchFilter('custentity_paymentmethod', 'vendor', 'anyOf', arrPayTypes));
// 	}

// 	if (objFltr.billtype == '2') {
// 		filter.push(new nlobjSearchFilter('type', null, 'anyOf', 'VendBill'));
// 	} else if (objFltr.billtype == '3') {
// 		filter.push(new nlobjSearchFilter('type', null, 'anyOf', 'ExpRept'));
// 	}

// 	var columns = [new nlobjSearchColumn('tranid')];
// 	// return rdnsSearchRecord('transaction', BILLS_TO_PAY_SAVED_SEARCH, true, filter, columns);

// 	//RSF Add based saved search
// 	nlapiLogExecution('DEBUG', 'BASE_SAVED_SEARCH', BASE_SAVED_SEARCH);
// 	if (BASE_SAVED_SEARCH) {
// 		nlapiLogExecution('DEBUG', 'Based Saved Search Loaded', BASE_SAVED_SEARCH);
// 		return rdnsSearchRecord('transaction', BASE_SAVED_SEARCH, true, filters);
// 	} else {
// 		return rdnsSearchRecord('transaction', BILLS_TO_PAY_SAVED_SEARCH, true, filters);
// 	}

// }

function getBills(objFltr) {
	dAudit('getBills', 'objFltr = ' + JSON.stringify(objFltr));

	dAudit('getBills', 'objFltr.dynamicparams = ' + objFltr.dynamicparams);

	var filters = [];

	if (!isEmpty(objFltr.ap_acct)) {
		var account = [];
		account.push(objFltr.ap_acct);
		if (!isEmpty(objFltr.selectedBankAccount)) account.push(objFltr.selectedBankAccount);
		if (!isEmpty(objFltr.selectedAPAcct)) account.push(objFltr.selectedAPAcct);
		if (!isEmpty(objFltr.bankSub)) account.push(objFltr.bankSub);

		filters.push('AND');
		filters.push(['account', 'anyof', account]);
	}
	// else if (!isEmpty(objFltr.selectedAPAcct)) {
	// 	filters.push('AND');
	// 	filters.push(['account', 'anyof', objFltr.selectedAPAcct]);
	// }

	if (!isEmpty(objFltr.bankSub) && !isNonSubAcct) {
		filters.push('AND');
		filters.push(['subsidiary', 'anyof', objFltr.bankSub]);
	}
	if (!isEmpty(objFltr.payee)) {
		filters.push('AND');
		filters.push(['entity', 'anyof', objFltr.payee]);
	}

	if (!isEmpty(objFltr.sdateFilter) && isEmpty(objFltr.edateFilter)) {
		filters.push('AND');
    if (!isEmpty(objFltr.bankSub) && !isNonSubAcct) {
      filters.push([
        [['type', 'anyof', ['VendBill', 'LiabPymt', 'ExpRept']], 'AND', ['duedate', 'onorafter', objFltr.sdateFilter]],
        'OR',
        [['type', 'anyof', ['Check']], 'AND', ['trandate', 'onorafter', objFltr.sdateFilter]],
        'OR',
        [
          ['type', 'anyof', ['VendCred', 'LiabPymt']],
          'AND',
          ['trandate', 'onorafter', objFltr.sdateFilter],
          'AND',
          ['amountremaining', 'greaterthan', '0.00'],
          'AND',
          ['account', 'anyof', objFltr.selectedAPAcct || objFltr.ap_acct],
          'AND',
          ['subsidiary', 'anyof', objFltr.bankSub],
        ],
      ]);
    } else {
      filters.push([
        [['type', 'anyof', ['VendBill', 'LiabPymt', 'ExpRept']], 'AND', ['duedate', 'onorafter', objFltr.sdateFilter]],
        'OR',
        [['type', 'anyof', ['Check']], 'AND', ['trandate', 'onorafter', objFltr.sdateFilter]],
        'OR',
        [
          ['type', 'anyof', ['VendCred', 'LiabPymt']],
          'AND',
          ['trandate', 'onorafter', objFltr.sdateFilter],
          'AND',
          ['amountremaining', 'greaterthan', '0.00'],
          'AND',
          ['account', 'anyof', objFltr.selectedAPAcct || objFltr.ap_acct],
        ],
      ]);
  
    }
	} else if (!isEmpty(objFltr.sdateFilter) && !isEmpty(objFltr.edateFilter)) {
		filters.push('AND');
    if (!isEmpty(objFltr.bankSub) && !isNonSubAcct) {
      filters.push([
        [['type', 'anyof', ['VendBill', 'LiabPymt', 'ExpRept']], 'AND', ['duedate', 'within', objFltr.sdateFilter, objFltr.edateFilter]],
        'OR',
        [['type', 'anyof', ['Check']], 'AND', ['trandate', 'within', objFltr.sdateFilter, objFltr.edateFilter]],
        'OR',
        [
          ['type', 'anyof', ['VendCred', 'LiabPymt']],
          'AND',
          ['trandate', 'within', objFltr.sdateFilter, objFltr.edateFilter],
          'AND',
          ['amountremaining', 'greaterthan', '0.00'],
          'AND',
          ['account', 'anyof', objFltr.selectedAPAcct || objFltr.ap_acct],
          'AND',
          ['subsidiary', 'anyof', objFltr.bankSub],
        ],
      ]);  
    } else {
      filters.push([
        [['type', 'anyof', ['VendBill', 'LiabPymt', 'ExpRept']], 'AND', ['duedate', 'within', objFltr.sdateFilter, objFltr.edateFilter]],
        'OR',
        [['type', 'anyof', ['Check']], 'AND', ['trandate', 'within', objFltr.sdateFilter, objFltr.edateFilter]],
        'OR',
        [
          ['type', 'anyof', ['VendCred', 'LiabPymt']],
          'AND',
          ['trandate', 'within', objFltr.sdateFilter, objFltr.edateFilter],
          'AND',
          ['amountremaining', 'greaterthan', '0.00'],
          'AND',
          ['account', 'anyof', objFltr.selectedAPAcct || objFltr.ap_acct],
        ],
      ]);  
    }
  
	} else if (isEmpty(objFltr.sdateFilter) && !isEmpty(objFltr.edateFilter)) {
		filters.push('AND');
    if (!isEmpty(objFltr.bankSub) && !isNonSubAcct) {
      filters.push([
        [['type', 'anyof', ['VendBill', 'LiabPymt', 'ExpRept']], 'AND', ['duedate', 'onorbefore', objFltr.edateFilter]],
        'OR',
        [['type', 'anyof', ['Check']], 'AND', ['trandate', 'onorbefore', objFltr.edateFilter]],
        'OR',
        [
          ['type', 'anyof', ['VendCred', 'LiabPymt']],
          'AND',
          ['trandate', 'onorbefore', objFltr.edateFilter],
          'AND',
          ['amountremaining', 'greaterthan', '0.00'],
          'AND',
          ['account', 'anyof', objFltr.selectedAPAcct || objFltr.ap_acct],
          'AND',
          ['subsidiary', 'anyof', objFltr.bankSub],
        ],
      ]);  
    } else {
      filters.push([
        [['type', 'anyof', ['VendBill', 'LiabPymt', 'ExpRept']], 'AND', ['duedate', 'onorbefore', objFltr.edateFilter]],
        'OR',
        [['type', 'anyof', ['Check']], 'AND', ['trandate', 'onorbefore', objFltr.edateFilter]],
        'OR',
        [
          ['type', 'anyof', ['VendCred', 'LiabPymt']],
          'AND',
          ['trandate', 'onorbefore', objFltr.edateFilter],
          'AND',
          ['amountremaining', 'greaterthan', '0.00'],
          'AND',
          ['account', 'anyof', objFltr.selectedAPAcct || objFltr.ap_acct],
        ],
      ]);  
    }
	}

	if (!isEmpty(objFltr.currencyFilter)) {
		filters.push('AND');
		filters.push(['currency', 'is', objFltr.currencyFilter]);
	}

	if (!isEmpty(objFltr.vendorcategory)) {
		filters.push('AND');
		filters.push(['vendor.category', 'is', objFltr.vendorcategory]);
	}

	if (objFltr.billtype == '2') {
		filters.push('AND');
		filters.push(['type', 'anyof', ['VendBill', 'LiabPymt']]);
	} else if (objFltr.billtype == '3') {
		filters.push('AND');
		filters.push(['type', 'anyof', ['ExpRept', 'LiabPymt']]);
	} else if (objFltr.billtype == '4') {
		filters.push('AND');
		filters.push(['type', 'anyof', ['Check', 'check']]);
	}

	// if (!isEmpty(objFltr.priorityFilter)) {
	if (objFltr.priorityFilter == 'T') {
		filters.push('AND');
		filters.push(['custbody_ica_priority_bill', 'is', objFltr.priorityFilter]);
	}
	// } //else {
	// 	filters.push('AND');
	// 	filters.push(['custbody_ica_priority_bill', 'is', 'F']);
	// }

	if (!isEmpty(objFltr.tobeprinted)) {
		if (objFltr.tobeprinted != 'F') {
			filters.push('AND');
			filters.push(['vendor.custentity_paymentmethod', 'anyof', '6']);
		}
	}

	if (!isEmpty(objFltr.processAsCheck)) {
    if (objFltr.processAsCheck != 'F') {
      dLog('Added ProcessAsCheck Filters', '');
      filters.push('AND');
      filters.push(['type', 'anyof', ['VendBill', 'VendCred','ExpRept']]);      
      filters.push('AND');
      filters.push(
        [[
        //   ['type', 'anyof', ['VendBill', 'VendCred'],
        // 'AND',
        ["vendor.custentity_vendoraddline1","isnotempty",""],"AND",
        ["vendor.custentity_vendorcity","isnotempty",""],"AND",
        ["vendor.custentity_vendorstateprovince","isnotempty",""],"AND",
        ["vendor.custentity_vendorpostalcode","isnotempty",""],"AND",
        ["vendor.custentity_vendorcountrycode","noneof","@NONE@"]
        ],
        "OR",
        [
          // ["type","anyof","ExpRept"],
          // "AND",
          ["employee.custentity_vendoraddline1","isnotempty",""],"AND",
          ["employee.custentity_vendorcity","isnotempty",""],"AND",
          ["employee.custentity_vendorstateprovince","isnotempty",""],"AND",
          ["employee.custentity_vendorpostalcode","isnotempty",""],"AND",
          ["employee.custentity_vendorcountrycode","noneof","@NONE@"]
        ]			
      ]);
    }
  }

	//Add dynamic filters
	try {
		var params = JSON.parse(objFltr.dynamicparams);
		dAudit('params', JSON.stringify(params));
		for (var i = 0; i < params.length; i++) {
			if (!isEmpty(params[i].value)) {
				if (params[i].type == 'select') {
					filters.push('AND');
					filters.push([params[i].realinternalid, 'anyof', params[i].value]);
				}
				if (params[i].type == 'checkbox') {
					filters.push('AND');
					filters.push([params[i].realinternalid, 'is', params[i].value]);
				}
				if (params[i].type == 'date') {
          if (params[i].value) {
            filters.push('AND');
            filters.push([params[i].realinternalid, 'on', params[i].value]);  
          }
				}
			}
		}
	} catch (e) {
		dError('Error adding dynamic filters', e.message);
	}

	//Get Existing PLCs. Filter
	var plcRes = nlapiSearchRecord('customrecord_ica_processed_plc', null, [['isinactive', 'is', 'F']], [new nlobjSearchColumn('custrecord_ica_pplc_id')]);
	var plcIds = [];
	if (!isEmpty(plcRes)) {
		for (var z = 0; z < plcRes.length; z++) {
      if (plcRes[z].getValue('custrecord_ica_pplc_id'))
			  plcIds.push(plcRes[z].getValue('custrecord_ica_pplc_id'));
		}
		//add to filter result of saved search
    dLog('plcRes', JSON.stringify(plcIds));
    if (plcIds.length>0) {
      filters.push('AND');
      filters.push(['internalid', 'noneof', plcIds]);  
    }
	}

	// if (filters[filters.length-1]=='AND')
	// 	filters.pop();

	dLog('getBills filters', JSON.stringify(filters));

	//RSF Add based saved search
	nlapiLogExecution('DEBUG', 'BASE_SAVED_SEARCH', BASE_SAVED_SEARCH);
	if (BASE_SAVED_SEARCH) {
		nlapiLogExecution('DEBUG', 'Based Saved Search Loaded', BASE_SAVED_SEARCH);
		// return rdnsSearchRecord('transaction', BASE_SAVED_SEARCH, true, filters);
		return getAllRecords({
			rectype: 'transaction',
			searchid: BASE_SAVED_SEARCH,
			filters: filters,
		});
	} else {
		return getAllRecords({
			rectype: 'transaction',
			searchid: BILLS_TO_PAY_SAVED_SEARCH,
			filters: filters,
		});
		// return rdnsSearchRecord('transaction', BILLS_TO_PAY_SAVED_SEARCH, true, filters);
	}
}

function getAllRecords(params) {
	var ctx = nlapiGetContext();
	var allData = [];
	var search = nlapiLoadSearch(params.rectype, params.searchid);
	var newFilters = search.getFilterExpression().concat(params.filters);

	search.setFilterExpression(newFilters);
  nlapiLogExecution('DEBUG', 'dcSearch', JSON.stringify(dcSearch));
	if (dcSearch != null) {
		// var newColumns = search.getColumns(); //new Array();//search.getColumns();
		// dAudit('newColumns', newColumns.length);
		var newColumns = [];
		for (var i = 0; i < dcSearch.length; i++) {
      if (dcSearch[i].getValue('custrecord_ica_bpm_dc_id')) {
        var column = new nlobjSearchColumn(dcSearch[i].getValue('custrecord_ica_bpm_dc_id'));
        newColumns.push(column);
        dAudit('added dcSearch', column);    
      }
		}
		dAudit('newColumns', newColumns.length);
		newColumns = search.getColumns().concat(newColumns);
    if (newColumns.length > 0) 
		  search.setColumns(newColumns);
	}
  // nlapiLogExecution('DEBUG', 'searchresults.length', 'before');
	var searchresults = search.runSearch();
	// nlapiLogExecution('DEBUG', 'searchresults.length', searchresults.length);
	var resultIndex = 0;
	var resultStep = 1000;
	var resultSet;
  if (searchresults) {
    do {
      nlapiLogExecution('DEBUG', 'here', 'resultIndex');
      resultSet = searchresults.getResults(resultIndex, resultIndex + resultStep); // retrieves all possible results up to the 1000 max  returned
      resultIndex = resultIndex + resultStep; // increment the starting point for the next batch of records
      nlapiLogExecution('DEBUG', 'resultSet', JSON.stringify(resultSet));
      // nlapiLogExecution('DEBUG', 'ctx usage remaining', ctx.getRemainingUsage());
      allData = allData.concat(resultSet);
    } while (resultSet != null && resultSet.length > 0);  
  }

	dAudit('allData', JSON.stringify(allData));
	return allData;
}

function summaryPage(arrBills, response) {
	var arrBillIds = [];

	for (x in arrBills) {
		arrBillIds.push(arrBills[x].id);
	}

	var summForm = nlapiCreateForm('Summary Page');
	summForm.addField('_bill', 'multiselect', 'List of Bill(s) for Payment.', 'transaction').setDisplayType('inline').setDefaultValue(arrBillIds);
	summForm
		.addField('_email_notes', 'label', '<h3>Please check for an email notification to be sent shortly!</h3>')
		.setLayoutType('outsidebelow', 'startrow')
		.setPadding(2);

	var url = nlapiResolveURL('SUITELET', VPM_SL_SCRIPT_ID, 1);
	var linkFld = summForm
		.addField('_return_link', 'url', '')
		.setDisplayType('inline')
		.setLinkText('Click here to go back to ePayables.');
	linkFld.setLayoutType('outsidebelow', 'startrow').setPadding(3).setDefaultValue(url);

	response.writePage(summForm);
}

function getRoleSub(currRole) {
	var filter = [new nlobjSearchFilter('custrecord_rasm_role', null, 'anyOf', currRole)];
	var columns = [new nlobjSearchColumn('custrecord_rasm_subsidiary')];
	var results = nlapiSearchRecord('customrecord_role_and_sub_mapping', null, filter, columns);

	if (results != null) return results[0].getValue('custrecord_rasm_subsidiary');

	return '';
}

function getFileCtrlNum() {
	var results = nlapiSearchRecord('customrecord_headertrailerreord', null, null, new nlobjSearchColumn('custrecord_headerfilecontrolnumber', null, 'max'));
	if (results != null) return pad(getFloatVal(results[0].getValue('custrecord_headerfilecontrolnumber', null, 'max')) + 1, 10);

	return pad(1, 10);
}

function setSelectDefault(objFld, arrValues, defualtVal) {
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

function decimalTwoFormat(amtVal) {
	return Math.ceil(parseFloat(amtVal) * 100) / 100;
}

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

function getBankAccountOLD() {
	var arrAPAccts = [];
	var results = nlapiSearchRecord('account', BANK_ACCT_SAVED_SEARCH);

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
function getPaymentMethod(ids) {
	var arrPaymentMethods = [
		{
			id: '',
			name: '',
		},
	];
	var rs = nlapiSearchRecord(
		'customlist_payment_method',
		null,
		[new nlobjSearchFilter('isinactive', null, 'is', 'F'), new nlobjSearchFilter('internalid', null, 'anyOf', ids)],
		new nlobjSearchColumn('name')
	);

	for (var i = 0; rs != null && i < rs.length; i++) {
		arrPaymentMethods.push({
			id: rs[i].getId(),
			name: rs[i].getValue('name'),
		});
	}
	dLog('arrPaymentMethods', JSON.stringify(arrPaymentMethods));
	return arrPaymentMethods;
}

/**
 *
 * @returns {Array}
 */
function getPaymentMethodNew() {
	var arrPaymentMethods = [
		{
			id: '',
			name: '',
		},
	];
	var rs = nlapiSearchRecord(
		'customrecord_ica_pm_pymt_method',
		null,
		[new nlobjSearchFilter('isinactive', null, 'is', 'F')],
		[new nlobjSearchColumn('custrecord_ica_pm_pmt_name'), new nlobjSearchColumn('custrecord_ica_pm_pmt_long_name')]
	);

	for (var i = 0; rs != null && i < rs.length; i++) {
		arrPaymentMethods.push({
			id: rs[i].getValue('custrecord_ica_pm_pmt_name'),
			name: rs[i].getValue('custrecord_ica_pm_pmt_long_name'),
		});
	}
	dLog('arrPaymentMethods', JSON.stringify(arrPaymentMethods));
	return arrPaymentMethods;
}

/**
 *
 * @returns {Array}
 */
function getVendorCategory() {
	var arrVendorCateg = [
		{
			id: '',
			name: '',
		},
	];
	var rs = nlapiSearchRecord('vendorcategory', null, [new nlobjSearchFilter('isinactive', null, 'is', 'F')], new nlobjSearchColumn('name'));

	for (var i = 0; rs != null && i < rs.length; i++) {
		arrVendorCateg.push({
			id: rs[i].getId(),
			name: rs[i].getValue('name'),
		});
	}

	return arrVendorCateg;
}

/**
 *
 * @returns {Array}
 */
function getPayee(sub) {
	dLog('getPayee', 'Sub Id : ' + sub);

	var arrPayee = [
		{
			id: '',
			name: '',
		},
	];

	var rs = [];
	try {
		var filters = [new nlobjSearchFilter('isinactive', null, 'is', 'F'), new nlobjSearchFilter('type', null, 'anyof', ['Employee', 'Vendor'])];
		if (!isEmpty(sub) && !isNonSubAcct) {
			dLog('getPayee.adding subsidiary filter', isNonSubAcct);
			filters.push(new nlobjSearchFilter('subsidiary', null, 'anyOf', sub));
		}
		rs = rdnsSearchRecord('entity', null, true, filters, [new nlobjSearchColumn('entityid')]);
	} catch (e) {
		var filters = [new nlobjSearchFilter('isinactive', null, 'is', 'F'), new nlobjSearchFilter('type', null, 'anyof', ['Employee', 'Vendor'])];
		rs = rdnsSearchRecord('entity', null, true, filters, [new nlobjSearchColumn('entityid')]);
	}

	for (var i = 0; rs != null && i < rs.length; i++) {
		var entityName = rs[i].getValue('entityid');

		if (entityName.charAt(0) == '-') continue;

		arrPayee.push({
			id: rs[i].getId(),
			name: rs[i].getValue('entityid'),
		});
	}

	return arrPayee;
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

function getNumberVal(val) {
	return val == '' || val == null ? 0 : parseInt(val);
}

function getFloatVal(val) {
	return val == '' || val == null ? 0.0 : parseFloat(val);
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

function dLog(logTitle, logDetails) {
	nlapiLogExecution('DEBUG', logTitle, logDetails);
}

function pad(number, length) {
	var str = '' + number;
	while (str.length < length) {
		str = '0' + str;
	}

	return str;
}

function padWPrefix(number, length, prefx) {
	var str = '' + number;
	while (str.length < length - 1) {
		str = '0' + str;
	}

	return prefx + str;
}
