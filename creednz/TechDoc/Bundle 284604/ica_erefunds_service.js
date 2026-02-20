/**
 *@NApiVersion 2.x
 *@NScriptType Suitelet
 */
define(["N/search", "N/record", "N/runtime", "N/task", "N/file", "./ica_erefunds_moment.js"], function (search, record, runtime, task, file, moment) {
	function ConvertToCSV(objArray) {
		var array = typeof objArray != "object" ? JSON.parse(objArray) : objArray;
		var str = "";

		for (var i = 0; i < array.length; i++) {
			var line = "";
			for (var index in array[i]) {
				if (line != "") line += ",";

				line += array[i][index].replace(',', ' ');
			}
			str += line + "\r\n";
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
					if (join) prop += "_" + join;
					if (strLabel != "null") prop = strLabel;

					line[prop] = {
						value: value || "",
						text: text || "",
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
			value === "" || // check for empty string
			(Array.isArray(value) && value.length === 0) || // check for empty array
			(typeof value === "object" && Object.keys(value).length === 0) // check for empty object
		);
	}

	function returnProperDateFormat(d) {
		if (d == "D-Mon-YYYY") return "D-MMM-YYYY";
		else if (d == "D-Mon-YYYY") return "D-MMM-YYYY";
		else if (d == "DD-Mon-YYYY") return "DD-MMM-YYYY";
		else if (d == "D-MONTH-YYYY") return "D-MMMM-YYYY";
		else if (d == "DD-MONTH-YYYY") return "DD-MMMM-YYYY";
		else if (d == "D MONTH, YYYY") return "D MMMM, YYYY";
		else if (d == "DD MONTH, YYYY") return "DD MMMM, YYYY";
		else return d;
	}

	function getResultsJSON(filters) {
    var is_multicurrency = runtime.isFeatureInEffect({
      feature: 'MULTICURRENCY'
    });

		var arrJSON = [];
		try {
			log.audit("filters", filters);
			var f = JSON.parse(filters);
			var sid = f.searchid;
			log.audit("f", JSON.stringify(f));
			if (sid == undefined) {
				return [];
			}

			var res = search.load({
				id: sid,
			});

			var defaultFilters = res.filters;

			var dpf = runtime.getCurrentUser().getPreference({
				name: "DATEFORMAT",
			});
			if (dpf == "DD-Mon-YYYY") dpf = "DD-MMM-YYYY";
			else if (dpf == "D-MONTH-YYYY") dpf = "D-MMM-YYYY";

			if (!isEmpty(f.startdate) && !isEmpty(f.enddate)) {
				log.audit("adding within");
				defaultFilters.push(
					search.createFilter({
						name: "trandate",
						operator: search.Operator.WITHIN,
						values: [f.startdate, f.enddate],
					})
				);
			} else if (!isEmpty(f.startdate) && isEmpty(f.enddate)) {
				log.audit("adding ONORAFTER");
				defaultFilters.push(
					search.createFilter({
						name: "trandate",
						operator: search.Operator.ONORAFTER,
						values: [f.startdate],
					})
				);
			} else if (isEmpty(f.startdate) && !isEmpty(f.enddate)) {
				log.audit("adding ONORBEFORE");
				defaultFilters.push(
					search.createFilter({
						name: "trandate",
						operator: search.Operator.ONORBEFORE,
						values: [f.enddate],
					})
				);
			}

			if (f.bankaccountFilter) {
				defaultFilters.push(
					search.createFilter({
						name: "accountmain",
						operator: search.Operator.ANYOF,
						values: f.bankaccountFilter,
					})
				);
			}

			// if (f.categoryFilter) {
			// 	defaultFilters.push(
			// 		search.createFilter({
			// 			name: "custtype",
			// 			operator: search.Operator.ANYOF,
			// 			values: f.categoryFilter,
			// 		})
			// 	);
			// }

			if (f.paymentmethodFilter) {
				defaultFilters.push(
					search.createFilter({
						name: "custentity_paymentmethod",
						join: "customer",
						operator: search.Operator.ANYOF,
						values: f.paymentmethodFilter,
					})
				);
			}
      if (is_multicurrency) {
        if (f.currencyFilter) {
          defaultFilters.push(
            search.createFilter({
              name: "currency",
              operator: search.Operator.ANYOF,
              values: f.currencyFilter
            })
          );
        }  
      }

			if (f.locationFilter) {
				defaultFilters.push(
					search.createFilter({
						name: "location",
						operator: search.Operator.ANYOF,
						values: f.locationFilter,
					})
				);
			}

			if (f.internalids) {
				if (f.internalids.length > 0) {
					defaultFilters.push(
						search.createFilter({
							name: "internalid",
							operator: search.Operator.ANYOF,
							values: f.internalids,
						})
					);
				}
			}

			res.filters = defaultFilters;
			// log.audit("last defaultFilters", JSON.stringify(defaultFilters));

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
							id: result.getValue({
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
						var output = "/app/accounting/transactions/transaction.nl?id=" + result.id;
						var entityurl = "/app/common/entity/entity.nl?id=" + result.getValue({ name: "entity" });
						obj.entity = result.getValue({ name: "entity" });
						obj.txnurl = output;
						obj.entityurl = entityurl;
					} catch (e) {
						log.error("Something happened", e.message);
					}
					arrJSON.push(obj);
				});
			});
		} catch (e) {
			log.error("Error retrieving results", e.message);
		}

		return arrJSON;
	}

	function onRequest(context) {
		var params = context.request.parameters;
		log.audit("params", JSON.stringify(params));
    var is_multicurrency = runtime.isFeatureInEffect({
      feature: 'MULTICURRENCY'
    });


		var res = [];
		switch (params.action) {
			case "downloadcsv": {
				var txns = getResultsJSON(params.filters);

				log.audit("txns.length", txns.length);
				log.audit("txns", JSON.stringify(txns));
				var data = txns;

				var csv = [];

				for (var i = 0; i < data.length; i++) {
					var res = data[i];
          var currencyText = '';
          if (is_multicurrency) {
            currencyText = res["Currency"].text;
          } else {
            currencyText = 'USD';
          }
					if (res != undefined) {
						csv.push({
							date: res.Date.id || " ",
							type: res.Type.text || " ",
							paymentmethod: res["Payment Method"].text || " ",
							customername: (res["Customer Name"].text || " ").replace(/,/g, ' '),
							referencenumber: (res["Transaction ID"].id || " ").replace(/,/g, ' '),
							memo: (res["Memo (Main)"].id || " ").replace(/,/g, ' '),
							currency: currencyText,
							amountdue: res["Amount"].id || " ",
						});
					}
				}

				var fileContents = csv;
				var contents = "Date, Type, Payment Method, Customer Name, Reference Number, Memo, Currency, Amount Due \r\n";
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
				log.audit("filters", JSON.stringify(params.filters));
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
					scriptParameters: scriptParameters,
				};

        if (paymentIds) {
          mrTask.scriptId = "customscript_ica_erefunds_mr";
          mrTask.deploymentId = "customdeploy_ica_erefunds_mr";
          mrTask.params = {
            custscript_ica_er_pids: paymentIds,
            custscript_ica_er_script_params: JSON.stringify(params),
          };
          var mrTaskId = mrTask.submit();  
        } else {
          log.error('Did not deploy M/R, no Payment Ids were found. Please contact Administrator', '');
        }


				// var filters = JSON.parse(params.filters);

				break;
			}
			case "getResultsJSON": {
				// log.audit('params', JSON.stringify(params));
				// if (params.searchid == "") break;
				// context.response.write(getResultsJSON(params.searchid));
				res = getResultsJSON(params.filters);
				log.audit("res", JSON.stringify(res));
				break;
			}
			case "getaraccounts": {
				var accountSearchObj = search.create({
					type: "account",
					filters: [["type", "anyof", "AcctRec"]],
					columns: [
						search.createColumn({
							name: "name",
							sort: search.Sort.ASC,
						}),
						"displayname",
						"type",
						"description",
						"balance",
					],
				});
				var arJSON = [];
				accountSearchObj.run().each(function (result) {
					arJSON.push({
						id: result.id,
						name: result.getValue({ name: "name" }),
					});
					return true;
				});

				res = arJSON;
				// context.response.write(JSON.stringify(arJSON));
				break;
			}
			case "getpaymentmethods": {
				var es = search.create({
					type: "customlist_payment_method",
					filters: ["isinactive", "is", "F"],
					columns: [
						search.createColumn({
							name: "name",
							sort: search.Sort.ASC,
						}),
					],
				});

				var pms = [];
				es.run().each(function (result) {
					pms.push({
						id: result.id,
						name: result.getValue({ name: "name" }),
					});

					return true;
				});
				res = pms;

				break;
			}

			case "getaccountmappings": {
				var customrecord_ia_vendor_account_mappingSearchObj = search.create({
					type: "customrecord_ia_vendor_account_mapping",
					filters: [["isinactive", "is", "F"], "AND", ["custrecord_acct_map_netsuite_account.type", "anyof", "Bank", "CredCard"]],
					columns: [
						search.createColumn({ name: "custrecord_acct_map_sub", label: "Acct Mapping Subsidiary" }),
						search.createColumn({
							name: "name",
							sort: search.Sort.ASC,
							label: "Name",
						}),
						search.createColumn({
							name: "custrecord_acct_map_netsuite_account",
							sort: search.Sort.ASC,
							label: "Acct Mapping NetSuite Account",
						}),
						// search.createColumn({
						// 	name: "balance",
						// 	join: "CUSTRECORD_ACCT_MAP_NETSUITE_ACCOUNT",
						// 	label: "Balance",
						// }),
						search.createColumn({ name: "custrecord_acct_map_last_cn", label: "Acct Mapping Last Cheque Number" }),
						search.createColumn({ name: "custrecord_acct_map_init_cheque_number", label: "Acct Mapping Initial Cheque Number" }),
						search.createColumn({
							name: "subsidiary",
							join: "CUSTRECORD_ACCT_MAP_NETSUITE_ACCOUNT",
							label: "Subsidiary",
						}),
						search.createColumn({
							name: "subsidiarynohierarchy",
							join: "CUSTRECORD_ACCT_MAP_NETSUITE_ACCOUNT",
							label: "Subsidiary (no hierarchy)",
						}),
					],
				});
				var am = [];
				customrecord_ia_vendor_account_mappingSearchObj.run().each(function (result) {
					am.push({
						id: result.id,
						name: result.getValue({ name: "name" }) + " - " + result.getText({ name: "custrecord_acct_map_netsuite_account" }),
						subsidiary: {
							id: result.getValue({ name: "subsidiarynohierarchy", join: "CUSTRECORD_ACCT_MAP_NETSUITE_ACCOUNT" }),
							name: result.getText({ name: "subsidiarynohierarchy", join: "CUSTRECORD_ACCT_MAP_NETSUITE_ACCOUNT" }),
						},
						bankaccount: {
							id: result.getValue({ name: "custrecord_acct_map_netsuite_account" }),
							name:
								result.getValue({ name: "name" }) +
								" (" +
								result.getText({ name: "custrecord_acct_map_netsuite_account" }) +
								")",
							balance: '', //result.getValue({ name: "balance", join: "CUSTRECORD_ACCT_MAP_NETSUITE_ACCOUNT" }),
							subsidiary: result.getValue({ name: "subsidiarynohierarchy", join: "CUSTRECORD_ACCT_MAP_NETSUITE_ACCOUNT" }),
							subsidiaryname: result.getText({ name: "subsidiarynohierarchy", join: "CUSTRECORD_ACCT_MAP_NETSUITE_ACCOUNT" }),
						},
						bankbalance: '', //result.getValue({ name: "balance", join: "CUSTRECORD_ACCT_MAP_NETSUITE_ACCOUNT" }),
						initchequenum: result.getValue({ name: "custrecord_acct_map_init_cheque_number" }),
						lastchequenum: result.getValue({ name: "custrecord_acct_map_last_cn" }),
					});
					return true;
				});

				log.audit("am", JSON.stringify(am));

				res = am;
				break;
			}

			// case "getentityprofiles": {

                        //         var filters = JSON.parse(params.filters);

                        //         log.audit("filters", JSON.stringify(filters))
			// 	var res = search.create({
			// 		type: "customrecord_ica_entity_profile",
			// 		filters: [["custrecord_ica_ep_preferred", "is", "T"], "AND", ["custrecord_ica_ep_parent_entity", "anyof", filters.entityIds]],
			// 		columns: [
			// 			"custrecord_ica_ep_parent_entity",
			// 			"custrecord_ica_ep_preferred",
			// 			"custrecord_ica_ep_entity_name",
			// 			"custrecord_ica_ep_payment_method",
			// 			"custrecord_ica_ep_rec_bank_primary_id",
			// 			"custrecord_ica_ep_bank_addr_1",
			// 			"custrecord_ica_ep_bank_city",
			// 			"custrecord_ica_ep_bank_country_code",
			// 			"custrecord_ica_ep_bank_name",
			// 			"custrecord_ica_ep_bank_post_code",
			// 			"custrecord_ica_ep_bank_state",
			// 			"custrecord_ica_ep_sort_code",
			// 			"custrecord_ica_ep_payee_email",
			// 			"custrecord_ica_ep_check_insert_type",
			// 			"custrecord_ica_ep_check_insert_value",
			// 			"custrecord_ica_ep_check_style",
			// 			"custrecord_ica_ep_courier_account",
			// 			"custrecord_ica_ep_courier_name",
			// 			"created",
			// 			"custrecord_ica_ep_delivery_code",
			// 			"custrecord_ica_ep_entity_addr_line_1",
			// 			"custrecord_ica_ep_entity_addr_line_2",
			// 			"custrecord_ica_ep_city",
			// 			"custrecord_ica_ep_entity_country",
			// 			"custrecord_ica_ep_entity_name_2",
			// 			"custrecord_ica_ep_phone_number",
			// 			"custrecord_ica_ep_postal_code",
			// 			"custrecord_ica_ep_entity_state",
			// 			"externalid",
			// 			"custrecord_ica_ep_fas",
			// 			"custrecord_ica_ep_forex_ref_id",
			// 			"custrecord_ica_ep_forex_ref_type",
			// 			"custrecord_ica_ep_intm_bank_addr_1",
			// 			"custrecord_ica_ep_intm_bank_city",
			// 			"custrecord_ica_ep_intm_bank_country",
			// 			"custrecord_ica_ep_intm_bank_id",
			// 			"custrecord_ica_ep_bank_id_type",
			// 			"custrecord_ica_ep_intm_bank_name",
			// 			"custrecord_ica_ep_intm_bank_postal_code",
			// 			"custrecord_ica_ep_intm_bank_state",
			// 			"custrecord_ica_ep_intl_payment_format",
			// 			"custrecord_ica_ep_merchant_id",
			// 			"custrecord_ica_ep_pmp_biller_id",
			// 			"custrecord_ica_ep_pmp_del_contact_name",
			// 			"custrecord_ica_ep_pmp_del_email_addr",
			// 			"custrecord_ica_ep_payment_format",
			// 			"custrecord_ica_ep_receiving_bank_id_type",
			// 			"custrecord_ica_ep_rec_party_account",
			// 			"custrecord_ica_ep_rec_party_account_type",
			// 			"custrecord_ica_ep_use_iban",
			// 		],
			// 	});
                        //         var am = resultToJSON(res);
                        //         res = am;
                        //         break;
                        // }
		}

		context.response.write(JSON.stringify(res));
	}
	return {
		onRequest: onRequest,
	};
});
