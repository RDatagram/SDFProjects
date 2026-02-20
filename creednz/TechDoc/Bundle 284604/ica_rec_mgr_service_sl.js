/**
 *@NApiVersion 2.1
 *@NScriptType Suitelet
 */
define(['N/search', 'N/record', 'N/runtime', 'N/task', 'N/file', './ica_rec_mgr_moment.js'], function (search, record, runtime, task, file, moment) {
	function ConvertToCSV(objArray) {
		var array = typeof objArray != 'object' ? JSON.parse(objArray) : objArray;
		var str = '';

		for (var i = 0; i < array.length; i++) {
			var line = '';
			for (var index in array[i]) {
				if (line != '') line += ',';

				line += array[i][index].replace(',', ' ');
			}
			str += line + '\r\n';
		}
		return str;
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

	function isEmpty(value) {
		return (
			value === null || // check for null
			value === undefined || // check for undefined
			value === '' || // check for empty string
			(Array.isArray(value) && value.length === 0) || // check for empty array
			(typeof value === 'object' && Object.keys(value).length === 0) // check for empty object
		);
	}

	function returnProperDateFormat(d) {
		if (d == 'D-Mon-YYYY') return 'D-MMM-YYYY';
		else if (d == 'D-Mon-YYYY') return 'D-MMM-YYYY';
		else if (d == 'DD-Mon-YYYY') return 'DD-MMM-YYYY';
		else if (d == 'D-MONTH-YYYY') return 'D-MMMM-YYYY';
		else if (d == 'DD-MONTH-YYYY') return 'DD-MMMM-YYYY';
		else if (d == 'D MONTH, YYYY') return 'D MMMM, YYYY';
		else if (d == 'DD MONTH, YYYY') return 'DD MMMM, YYYY';
		else return d;
	}

	function getResultsJSON(filters) {
		var arrJSON = [];
		try {
			log.audit('filters', filters);
			var f = JSON.parse(filters);
			var sid = f.searchid;
			log.audit('f', JSON.stringify(f));
			if (sid == undefined) {
				return [];
			}

			var res = search.load({
				id: sid
			});

			
      log.audit('here', 'here');
			var dpf = runtime.getCurrentUser().getPreference({
				name: 'DATEFORMAT',
			});
			if (dpf == 'DD-Mon-YYYY') dpf = 'DD-MMM-YYYY';
			else if (dpf == 'D-MONTH-YYYY') dpf = 'D-MMM-YYYY';
      log.audit('dpf', dpf);

      var defaultFilters = res.filterExpression;

			if (!isEmpty(f.startdate) && !isEmpty(f.enddate)) {
				log.audit('adding within');
				// defaultFilters.push(
				// 	search.createFilter({
				// 		name: 'duedate',
				// 		operator: search.Operator.WITHIN,
				// 		values: [f.startdate, f.enddate],
        //     isor: true,
        //     leftparens: 1
				// 	})
				// );
				// defaultFilters.push(
				// 	search.createFilter({
				// 		name: 'trandate',
				// 		operator: search.Operator.WITHIN,
				// 		values: [f.startdate, f.enddate],
        //     rightparens: 1
				// 	})
				// );
        defaultFilters.push('AND');
        defaultFilters.push(
          [['duedate', 'within', f.startdate, f.enddate], 'OR', ['trandate', 'within', f.startdate, f.enddate]]
        );
        log.audit('defaultFilters after add', defaultFilters);
        // defaultFilters

			} else if (!isEmpty(f.startdate) && isEmpty(f.enddate)) {
				log.audit('adding ONORAFTER');
				// defaultFilters.push(
				// 	search.createFilter({
				// 		name: 'duedate',
				// 		operator: search.Operator.ONORAFTER,
				// 		values: [f.startdate],
				// 	})
				// );
        defaultFilters.push('AND');
        defaultFilters.push(
          [['duedate', 'onorafter', [f.startdate]], 'OR', ['trandate', 'onorafter', [f.startdate]]]
        );

			} else if (isEmpty(f.startdate) && !isEmpty(f.enddate)) {
				log.audit('adding ONORBEFORE');
				// defaultFilters.push(
				// 	search.createFilter({
				// 		name: 'duedate',
				// 		operator: search.Operator.ONORBEFORE,
				// 		values: [f.enddate],
				// 	})
				// );
        defaultFilters.push('AND');
        defaultFilters.push(
          [['duedate', 'onorbefore', [f.enddate]], 'OR', ['trandate', 'onorbefore', [f.enddate]]]
        );

			}

			// if (f.bankaccountFilter) {
			// 	defaultFilters.push(
			// 		search.createFilter({
			// 			name: 'accountmain',
			// 			operator: search.Operator.ANYOF,
			// 			values: f.bankaccountFilter,
			// 		})
			// 	);
			// }

			// if (f.categoryFilter) {
			// 	defaultFilters.push(
			// 		search.createFilter({
			// 			name: 'custtype',
			// 			operator: search.Operator.ANYOF,
			// 			values: f.categoryFilter,
			// 		})
			// 	);
			// }

			if (f.paymentmethodFilter) {
				// defaultFilters.push(
				// 	search.createFilter({
				// 		name: 'custentity_paymentmethod',
				// 		join: 'customer',
				// 		operator: search.Operator.ANYOF,
				// 		values: f.paymentmethodFilter,
				// 	})
				// );
        defaultFilters.push('AND');
        defaultFilters.push(
          ['customer.custentity_paymentmethod', 'anyof', f.paymentmethodFilter]
        );
			}
			if (f.currencyFilter) {
				// defaultFilters.push(
				// 	search.createFilter({
				// 		name: 'currency',
				// 		operator: search.Operator.ANYOF,
				// 		values: f.currencyFilter,
				// 	})
				// );
        defaultFilters.push('AND');
        defaultFilters.push(
          ['currency', 'anyof', f.currencyFilter]
        );

			}
			if (f.locationFilter) {
				// defaultFilters.push(
				// 	search.createFilter({
				// 		name: 'location',
				// 		operator: search.Operator.ANYOF,
				// 		values: f.locationFilter,
				// 	})
				// );
        defaultFilters.push('AND');
        defaultFilters.push(
          ['location', 'anyof', f.locationFilter]
        );

			}

			if (f.internalids) {
				if (f.internalids.length > 0) {
					// defaultFilters.push(
					// 	search.createFilter({
					// 		name: 'internalid',
					// 		operator: search.Operator.ANYOF,
					// 		values: f.internalids,
					// 	})
					// );
          defaultFilters.push('AND');
          defaultFilters.push(
            ['internalid', 'anyof', [f.internalids]]
          );
  
				}
			}

			res.filterExpression = defaultFilters;
			// log.audit('last defaultFilters', JSON.stringify(defaultFilters));

			var pagedData = res.runPaged({ pageSize: 1000 });
			pagedData.pageRanges.forEach(function (pageRange) {
				var page = pagedData.fetch({ index: pageRange.index });
				page.data.forEach(function (result) {
					var obj = {};
					for (var i = 0; i < result.columns.length; i++) {
						var name = result.columns[i].name;
						var join = result.columns[i].join;
						var summary = result.columns[i].summary;
						var strLabel = String(result.columns[i].label);

						obj[strLabel] = {
							value: result.getValue({
								name: name,
								join: join,
								summary: summary,
							}),
							text: result.getText({
								name: name,
								join: join,
								summary: summary,
							}),
						};
					}
					try {
						var output = '/app/accounting/transactions/transaction.nl?id=' + result.id;
						var entityurl = '/app/common/entity/entity.nl?id=' + result.getValue({ name: 'entity' });
						obj.entity = result.getValue({ name: 'entity' });
						obj.txnurl = output;
						obj.entityurl = entityurl;
					} catch (e) {
						log.error('Something happened', e.message);
					}
					arrJSON.push(obj);
				});
			});
		} catch (e) {
			log.error('Error retrieving results', e.message);
		}

		return arrJSON;
	}

	const searchUtils = {
		resultToJSON: function (res) {
			let arr = [];
			let pagedData = res.runPaged({ pageSize: 1000 });
			pagedData.pageRanges.forEach(function (pageRange) {
				let page = pagedData.fetch({ index: pageRange.index });
				page.data.forEach(function (result) {
					let line = {};
					for (let i = 0; i < result.columns.length; i++) {
						let name = result.columns[i].name;
						let join = result.columns[i].join;
						let strLabel = String(result.columns[i].label);
						let value = result.getValue(result.columns[i]);
						let text = result.getText(result.columns[i]);

						let prop = name;
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
		},
	};

	function onRequest(context) {
		var params = context.request.parameters;
		// log.audit('params', JSON.stringify(params));

		var res = [];
		switch (params.action) {
			case 'getResultsJSON': {
				res = getResultsJSON(params.filters);
				log.audit('res', JSON.stringify(res));
				break;
			}
      case "downloadcsv": {
				let txns = getResultsJSON(params.filters);

				log.audit("txns.length", txns.length);
				log.audit("txns", JSON.stringify(txns));
				let data = txns;

				let csv = [];

				for (var i = 0; i < data.length; i++) {
					let res = data[i];
					if (res != undefined) {
						csv.push({
							date: res.Date.value || " ",
							type: res.Type.text || " ",
							paymentmethod: res["Payment Method"].text || " ",
							customername: (res["Customer Name"].text || " ").replace(/,/g, ' '),
							invoicenumber: (res["Invoice Number"].value || " ").replace(/,/g, ' '),
							memo: (res["Memo"].value || " ").replace(/,/g, ' '),
							currency: res["Currency"].text || " ",
							amountdue: res["Amount"].value || " ",
              amountremaining: res["Amount Remaining"].value || " ",
						});
					}
				}

				var fileContents = csv;
				var contents = "Date, Type, Payment Method, Customer Name, Invoice Number, Memo, Currency, Amount Due, Amount Remaining \r\n";
				contents += ConvertToCSV(fileContents);

				var fileObj = file.create({
					name: "results.csv",
					fileType: file.Type.CSV,
					contents: contents,
				});
				fileObj.folder = -15;

				var id = fileObj.save();
				fileObj = file.load({
					id: id,
				});
				context.response.write(fileObj.url);

				break;
			}
			case "deploymapreduce": {
				log.audit("deploymapreduce.filters", JSON.stringify(params.filters));
				var paymentIds = JSON.parse(params.filters).paymentIds;
				var pageFilters = JSON.parse(params.pageFilters);
				var scriptParameters = JSON.parse(params.scriptParameters);

				log.audit("paymentIds", JSON.stringify(paymentIds));
				log.audit("pageFilters", JSON.stringify(pageFilters));
				log.audit("scriptParameters", JSON.stringify(scriptParameters));

				var mrTask = task.create({
					taskType: task.TaskType.MAP_REDUCE,
				});

				var params = {
					pageFilters: pageFilters,
					scriptParameters: scriptParameters
				};

				mrTask.scriptId = "customscript_ica_rm_processes_mr";
				mrTask.deploymentId = "customdeploy_ica_recmgr_mr";
				mrTask.params = {
					custscript_ica_recmgr_ids: paymentIds,
					custscript_ica_recmgr_script_params: JSON.stringify(params)
				};
				var mrTaskId = mrTask.submit();

				log.audit('mrTaskId', mrTaskId);

				break;
			}      
			case 'getaraccounts': {
				let accountSearchObj = search.create({
					type: 'account',
					filters: [['type', 'anyof', 'AcctRec']],
					columns: [
						search.createColumn({
							name: 'name',
							sort: search.Sort.ASC,
						}),
						'displayname',
						'type',
						'description',
						'balance',
					],
				});
				let arJSON = [];
				accountSearchObj.run().each(function (result) {
					arJSON.push({
						id: result.id,
						name: result.getValue({ name: 'name' }),
					});
					return true;
				});

				res = arJSON;
				break;
			}
			case 'getaccountmappings': {
        log.audit('getaccountmappings', 'here');
				let searchResult = search.create({
					type: 'customrecord_ia_vendor_account_mapping',
					filters: [['isinactive', 'is', 'F'], 'AND', ['custrecord_acct_map_netsuite_account.type', 'anyof', 'Bank', 'CredCard']],
					columns: [
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
						// search.createColumn({
						// 	name: 'balance',
						// 	join: 'CUSTRECORD_ACCT_MAP_NETSUITE_ACCOUNT',
						// 	label: 'Balance',
						// }),
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
				var am = [];
				searchResult.run().each(function (result) {
					am.push({
						id: result.id,
						name: result.getValue({ name: 'name' }) + ' - ' + result.getText({ name: 'custrecord_acct_map_netsuite_account' }),
						subsidiary: {
							id: result.getValue({ name: 'subsidiarynohierarchy', join: 'CUSTRECORD_ACCT_MAP_NETSUITE_ACCOUNT' }),
							name: result.getText({ name: 'subsidiarynohierarchy', join: 'CUSTRECORD_ACCT_MAP_NETSUITE_ACCOUNT' }),
						},
						bankaccount: {
							id: result.getValue({ name: 'custrecord_acct_map_netsuite_account' }),
							name: result.getValue({ name: 'name' }) + ' (' + result.getText({ name: 'custrecord_acct_map_netsuite_account' }) + ')',
							balance: '', //result.getValue({ name: 'balance', join: 'CUSTRECORD_ACCT_MAP_NETSUITE_ACCOUNT' }),
							subsidiary: result.getValue({ name: 'subsidiarynohierarchy', join: 'CUSTRECORD_ACCT_MAP_NETSUITE_ACCOUNT' }),
							subsidiaryname: result.getText({ name: 'subsidiarynohierarchy', join: 'CUSTRECORD_ACCT_MAP_NETSUITE_ACCOUNT' }),
						},
						bankbalance: '', //result.getValue({ name: 'balance', join: 'CUSTRECORD_ACCT_MAP_NETSUITE_ACCOUNT' }),
						initchequenum: result.getValue({ name: 'custrecord_acct_map_init_cheque_number' }),
						lastchequenum: result.getValue({ name: 'custrecord_acct_map_last_cn' }),
					});
					return true;
				});

				log.audit('am', JSON.stringify(am));

				res = am;
				break;
			}
		}

		context.response.write(JSON.stringify(res));
	}
	return {
		onRequest: onRequest,
	};
});
