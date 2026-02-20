/**
 * @NApiVersion 2.1
 */

//rfranco
//modules for loading data through saved search

define(['N/search'], function (search) {
	//utilities
	var utils = {
		isEmpty: function (fldValue) {
			return fldValue == '' || fldValue == null || fldValue == undefined;
		},
		isNotEmpty: function (fldValue) {
			try {
				return !(fldValue == '' || fldValue == null || fldValue == undefined);
			} catch (e) {
				return false;
			}
		},
		pz: function (number, length) {
			var my_string = '' + number;
			while (my_string.length < length) {
				my_string = '0' + my_string;
			}
			return my_string;
		},
		getFloat: function (val) {
			return val == '' || val == null ? 0.0 : parseFloat(val);
		},
	};

	function resultToCSV(res) {
		var arr = [];
		var pagedData = res.runPaged({ pageSize: 1000 });
		pagedData.pageRanges.forEach(function (pageRange) {
			var page = pagedData.fetch({ index: pageRange.index });
			page.data.forEach(function (result) {
				var line = [];
				log.audit('result', JSON.stringify(result));
				for (var i = 0; i < result.columns.length; i++) {
					var formuladefault = result.columns[i].formula;
					var name = result.columns[i].name;
					var join = result.columns[i].join;
					var summary = result.columns[i].summary;
					var strLabel = String(result.columns[i].label);
					var value = result.getText(result.columns[i]) || result.getValue(result.columns[i]);

					if (name == 'formulatext') {
						log.audit(
							'strLabel',
							JSON.stringify({
								strLabel: strLabel,
								value: value,
							})
						);

						if (formuladefault.charAt(0) == "'") {
							value = formuladefault;
							value = value.replace(/'/g, '');
						}
					}

					if (typeof value === 'boolean') {
						if (value) {
							value = 1;
						} else {
							value = 0;
						}
					} else {
						try {
							value = value.replace(/,/g, ' '); //Remove commas - to be consistent for csv files.
							value = value.replace(/(\r\n|\n|\r)/gm, ' - '); //Remove line breaks
						} catch (e) {
							log.audit('Value filtering error', e.message);
						}
					}

					if (strLabel.toUpperCase().indexOf('DATE') != -1) {
						if (value != '') {
							var dateformat = params.csvdateformat || 'YYYY-MM-DD';
							var newValue = moment(value, df).format(dateformat);
							if (newValue != undefined && newValue != 'Invalid Date') value = newValue;
						}
					}

					if (value == '- None -') value = '';

					log.audit(
						'values',
						JSON.stringify({
							name: name,
							formuladefault: formuladefault,
							join: join,
							summary: summary,
							strLabel: strLabel,
							value: value,
						})
					);

					line.push(value);
				}
				arr.push(line);
			});
		});

		//
		return arr;
	}

	function resultToJSON(res) {
		var arr = [];
		var pagedData = res.runPaged({ pageSize: 1000 });
		pagedData.pageRanges.forEach(function (pageRange) {
			var page = pagedData.fetch({ index: pageRange.index });
			page.data.forEach(function (result) {
				var line = {};
				for (var i = 0; i < result.columns.length; i++) {
					var formuladefault = result.columns[i].formula;
					var name = result.columns[i].name;
					var join = result.columns[i].join;
					var summary = result.columns[i].summary;
					var strLabel = String(result.columns[i].label);
					var value = result.getValue(result.columns[i]);
					var text = result.getText(result.columns[i]);

					var prop = name;
					if (join) prop += '_' + join;
					if (strLabel != 'null') prop = strLabel;

					line[prop] = {
						value: value || '',
						text: text || '',
					};
				}
				arr.push(line);
			});
		});
		return arr;
	}

	function getCurrencyCodes() {
		try {
			var res = search.create({
				type: 'currency',
				filters: null,
				columns: ['symbol'],
			});
			var currencyJSON = {};
			res.run().each(function (result) {
				currencyJSON[result.id] = result.getValue({ name: 'symbol' });
				return true;
			});

			return currencyJSON;
		} catch (e) {
			log.error('icalib.get.currencycodes', e.message);
		}
	}

	function getAccountMappings() {
		var res = search.create({
			type: 'customrecord_ia_vendor_account_mapping',
			filters: [['isinactive', 'is', 'F'], 'AND', ['custrecord_acct_map_netsuite_account.type', 'anyof', 'Bank', 'CredCard']],
			columns: [
				'custrecord_acct_map_institution',
				'custrecord_acct_map_sub',
				'custrecord_acct_map_netsuite_account',
				'custrecord_acct_map_ext_bank_account_typ',
				'custrecord_acct_map_ext_bank_origin_acc',
				'custrecord_acct_map_account_currency',
				'custrecord_acct_map_payment_methods',
				'custrecord_acct_map_ext_bank_id_type',
				'custrecord_acct_map_ext_bank_ori_bank_id',
				'custrecord_acct_map_hsbc_swift_bank_id',
				'custrecord_acct_map_dom_ach_co_id',
				'custrecord_acct_map_inter_ach_co_id',
				'custrecord_acct_map_pmp_biller_id',
				'custrecord_acct_map_check_template_id',
				'custrecord_acct_map_credit_card_man',
				'custrecord_acct_map_credit_card_div_num',
				'custrecord_acct_map_ceo_company_id',
				'custrecord_acct_map_archive_folder_id',
				'custrecord_acct_map_econnector_folder_id',
				'custrecord_acct_map_filename_prefix',
				'custrecord_acct_map_comp_id_prefix',
				'custrecord_acct_map_create_pay_activity',
				'custrecord_acct_map_last_cn',
				'custrecord_acct_map_init_cheque_number',
				'custrecord_acct_map_next_day',
				'custrecord_ica_acct_map_check_inert_type',
				'custrecord_ica_acct_map_check_insert_val',
				'custrecord_acct_map_filename_ext',
				'custrecord_acct_map_last_run_date',
				'custrecord_acct_map_counter',
				search.createColumn({ name: 'custrecord_acct_map_sub', label: 'Acct Mapping Subsidiary' }),
				search.createColumn({
					name: 'name',
					sort: search.Sort.ASC,
					label: 'Name',
				}),
				search.createColumn({
					name: 'custrecord_acct_map_netsuite_account',
					sort: search.Sort.ASC,
					label: 'Acct Mapping NetSuite Account',
				}),
				search.createColumn({
					name: 'balance',
					join: 'CUSTRECORD_ACCT_MAP_NETSUITE_ACCOUNT',
					label: 'Balance',
				}),
				search.createColumn({ name: 'custrecord_acct_map_last_cn', label: 'Acct Mapping Last Cheque Number' }),
				search.createColumn({ name: 'custrecord_acct_map_init_cheque_number', label: 'Acct Mapping Initial Cheque Number' }),
				search.createColumn({
					name: 'subsidiary',
					join: 'CUSTRECORD_ACCT_MAP_NETSUITE_ACCOUNT',
					label: 'Subsidiary',
				}),
				search.createColumn({
					name: 'subsidiarynohierarchy',
					join: 'CUSTRECORD_ACCT_MAP_NETSUITE_ACCOUNT',
					label: 'Subsidiary (no hierarchy)',
				}),
			],
		});
		var am = resultToJSON(res);
		return am;
	}

	function getVendorPaymentMethods() {
		var res = search.create({
			type: 'customrecord_vendorpaymentinfo',
			filters: [],
			columns: [
				'custrecord_achcompanyid',
				'custrecord_achformatcode',
				'custrecord_achrecordid',
				'custrecord_ccr_contact',
				'custrecord_ccr_reftype',
				'custrecord_bankname',
				'custrecordachmessage',
				'custrecord_ccr_message',
				'custrecord_ccrrecid',
				'custrecord_ceocompid',
				'custrecord_cash_pro_send_id_bank_america',
				'custrecord_check_doc_no',
				'custrecord_check_insert_type',
				'custrecord_check_insert_value',
				'custrecord_checkmessage',
				'custrecord_check_bank_id',
				'custrecord_compaddname',
				'custrecord_compadd1',
				'custrecord_compadd2',
				'custrecord_compcity',
				'custrecord_compcountrycode',
				'custrecord_companycurrency',
				'custrecord_comppaycurr',
				'custrecord_compphone',
				'custrecord_comppostcode',
				'custrecord_compstateprov',
				'custrecord_companyname',
				'custrecord_ccr_phonenum',
				'custrecord_ccr_phonetype',
				'custrecord_compcountrynames',
				'custrecord_achmessage',
				'custrecord_dac_bank_id',
				'custrecord_dac_pmp_delivery_type',
				'custrecord_dac_pmp_eddbillerid',
				'custrecord_dac_pmp_file_format',
				'custrecord_dac_pmp_file_type',
				'created',
				'custrecord_ia_default_ap_account',
				'custrecord_ia_default_bank_account',
				'custrecord_division',
				'custrecord_iacmessage',
				'custrecord_iwimessage',
				'custrecord_interachcompanyid',
				'custrecord_invoicetype',
				'custrecord_man_number',
				'custrecord_mtsmessage',
				search.createColumn({
					name: 'name',
					sort: search.Sort.ASC,
				}),
				'custrecord_notetype',
				'custrecord_orginacc',
				'custrecord_originatingacctype',
				'custrecord_orgaddind',
				'custrecord_origbankid',
				'custrecord_originacctbankidtype',
				'custrecord_orig_check_account',
				'custrecord_orig_dac_account',
				'custrecord_orgpartyrecid',
				'custrecord_ica_orig_bank_city',
				'custrecord_ica_orig_bank_country_code',
				'custrecord_potype',
				'custrecord_recbankpriidtype',
				'custrecord_ica_bpm_subsidiary',
				'internalid',
			],
		});
		var am = resultToJSON(res);
		return am;
	}

	function getPaymentsData(arr, customColumns) {
		var filters = [];
		filters.push(['type', 'anyof', 'CustPymt']);
		filters.push('AND');
		// filters.push([['customer.custentity_paymentmethod', 'anyof', '6', '1', '4', '3', '5', '2', '9']]);
		// filters.push('AND');
		filters.push(['mainline', 'is', 'T']);

		if (arr.length > 0) {
			filters.push('AND');
			filters.push(['internalid', 'anyof', arr]);
		}

		var columns = [
			'trandate',
			'duedate',
			'type',
			'accountmain',
			'account',
			'amount',
			'amountremaining',
			'entity',
			search.createColumn({
				name: 'custentity_paymentmethod',
				join: 'customer',
			}),
			// search.createColumn({
			//   name: 'category',
			//   join: 'customer',
			// }),
			'currency',
			'startdate',
			'refnumber',
			'memomain',
			'memo',
			'transactionname',
			'transactionnumber',
			search.createColumn({
				name: 'formulatext',
				formula: '{tranid}',
				label: 'tranid',
			}),
			'internalid',
		];
		log.audit('customColumns', customColumns);
		if (customColumns) {
			for (var i = 0; i < customColumns.length; i++) {
				if (customColumns[i].trim() != '') columns.push(customColumns[i].trim());
			}
		}
		var res = search.create({
			type: 'customerpayment',
			filters: filters,
			columns: columns,
		});
		var am = resultToJSON(res);
		return am;
	}

	function getPaymentLinesData(arr) {
		var filters = [];
		filters.push(['type', 'anyof', 'CustPymt']);
		// filters.push('AND');
		// filters.push(['status', 'noneof', 'CustRfnd:R', 'CustRfnd:V']);
		// filters.push('AND');
		// filters.push([['customer.custentity_paymentmethod', 'anyof', '6', '1', '4', '3', '5', '2']]);
		filters.push('AND');
		filters.push([['mainline', 'is', 'F']]);
		// filters.push('AND');
		// filters.push(['amount', 'greaterthan', '0.00']);
		// filters.push('AND');
		// filters.push(['custbody_ica_erefunds_paid', 'any', '']);
		if (arr.length > 0) {
			filters.push('AND');
			filters.push(['internalid', 'anyof', arr]);
		}

		var res = search.create({
			type: 'customerpayment',
			filters: filters,
			columns: [
				'internalid',
				'entity',
				'amount',
				search.createColumn({
					name: 'internalid',
					join: 'appliedToTransaction',
				}),
				search.createColumn({
					name: 'trandate',
					join: 'appliedToTransaction',
				}),
				search.createColumn({
					name: 'amount',
					join: 'appliedToTransaction',
				}),
				search.createColumn({
					name: 'amountremaining',
					join: 'appliedToTransaction',
				}),
				search.createColumn({
					name: 'formulacurrency',
					formula: '{appliedToTransaction.amount}',
				}),
				search.createColumn({
					name: 'transactionname',
					join: 'appliedToTransaction',
				}),
				search.createColumn({
					name: 'transactionnumber',
					join: 'appliedToTransaction',
				}),
				search.createColumn({
					name: 'appliedtolinkamount',
					label: 'Paying Amount',
				}),
			],
		});
		var am = resultToJSON(res);
		return am;
	}

  function getCreditMemosFromInvoices(arr) {
		var filters = [];

		filters.push(['mainline', 'is', 'T']);
		filters.push('AND');
		if (arr.length > 0) {
			filters.push(['createdfrom', 'anyof', arr]);
		}

		var columns = [
			'amount',
			'entity',
			search.createColumn({
				name: 'custentity_paymentmethod',
				join: 'customer',
			}),
			'currency',
			'refnumber',
			'memomain',
			'memo',
      'trandate',
			search.createColumn({
				name: 'formulatext',
				formula: '{tranid}',
				label: 'tranid',
			}),
			'internalid',
		];
		var res = search.create({
			type: 'transaction',
			filters: filters,
			columns: columns,
		});
		var am = resultToJSON(res);
		return am;
  }

	function getTransactionData(arr) {
		var filters = [];

		filters.push(['mainline', 'is', 'T']);
		filters.push('AND');
		if (arr.length > 0) {
			filters.push(['internalid', 'anyof', arr]);
		}

		var columns = [
			'amount',
			'entity',
			search.createColumn({
				name: 'custentity_paymentmethod',
				join: 'customer',
			}),
			'currency',
			'refnumber',
			'memomain',
			'memo',
			search.createColumn({
				name: 'formulatext',
				formula: '{tranid}',
				label: 'tranid',
			}),
			'internalid',
		];
		var res = search.create({
			type: 'transaction',
			filters: filters,
			columns: columns,
		});
		var am = resultToJSON(res);
		return am;
	}

	function getCustomersData(arr) {
		if (arr.length == 0) {
			return [];
		}

		var filters = [];
		if (arr.length > 0) {
			filters.push(['internalid', 'anyof', arr]);
		}

		var res = search.create({
			type: 'customer',
			filters: [['isinactive', 'is', 'F'], 'AND', ['internalid', 'anyof', arr]],
			columns: [
				'internalid',
				'firstname',
				'lastname',
        'entityid',
				'currency',
				'custentity_paymentmethod',
				'custentity_vendorbranchbankircid',
				'custentity_paymentformat',
				'custentity_recbankprimidtype',
				'custentity_forex_ref_id',
				'custentity_forex_ref_type',
				'custentity_recpartyaccttype',
				'custentity_recpartyaccount',
				'custentity_recbankprimid',
				'custentity_currency',
				'custentity_interpayformat',
				'custentity_merchantid',
				'custentity_payee_email',
				'custentity_bankpostcode',
				'custentity_bankcountrycode',
				'custentity_bankcity',
				'custentity_bankaddressline1',
				'custentity_bankname',
				'custentity_bankstate',
				'custentity_vendorstateprovince',
				'custentity_vendorcity',
				'custentity_vendorname',
				'custentity_vendorcountrycode',
				'custentity_ica_vendorname2',
				'custentity_vendoraddline1',
				'custentity_vendorpostalcode',
				'custentity_vendoraddline2',
				'custentity_pmp_dac_delivery_email_addres',
				'custentity_pmp_dac_delivery_contact_name',
				'custentity_courier_deliverycode',
				'custentity_courier_name',
				'custentity_courier_account',
				'custentity_inter_bank_city',
				'custentity_inter_bank_name',
				'custentity_inter_bank_id',
				'custentity_inter_bank_state',
				'custentity_inter_bank_country',
				'custentity_inter_bank_id_type',
				'custentity_inter_bank_postal',
				'custentity_inter_bank_address_1',
				'custentity_ica_vendor_bank_instructions',
				'custentity_check_style',
				'custentity_pmp_biller_id',
				'custentity_fas',
				'custentity_vendor_phone_num',
				'custentity_ica_entity_check_insert_type',
				'custentity_ica_entity_check_insert_value',
				'custentity_ica_vendor_external_id',
				'custentity_ica_w9',
				'custentity_ica_bpm_is_fleet',
				'custentity_icacheckimage',
				'custentity_icaotherdoc1',
				'custentity_icaotherdoc2',
				'custentity_ica_bns_use_iban',
			],
		});
		var am = resultToJSON(res);
		return am;
	}
	return {
		utils: utils,
		getCurrencyCodes: getCurrencyCodes,
		getAccountMappings: getAccountMappings,
		getVendorPaymentMethods: getVendorPaymentMethods,
		getPaymentsData: getPaymentsData,
		getCustomersData: getCustomersData,
		getPaymentLinesData: getPaymentLinesData,
		getTransactionData: getTransactionData,
    getCreditMemosFromInvoices: getCreditMemosFromInvoices
	};
});
