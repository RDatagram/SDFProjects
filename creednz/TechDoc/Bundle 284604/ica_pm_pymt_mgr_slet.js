/**
 *@NApiVersion 2.x
 *@NScriptType Suitelet
 */
define([
	"N/record",
	"N/ui/serverWidget",
	"N/search",
	"N/file",
	"N/url",
	"N/https",
	"./ica_hb.js",
	"./ica_lodash.min.js",
	"./ica_numeral.js",
	"N/runtime",
], function (record, ui, search, file, url, https, Handlebars, _, numeral, runtime) {
	const TMPL_NAME = "_tmpl_ica_pm_pymt_mgr.html";
	const IS_NONSUBACCOUNT = false;
        const PARAMS = {
                BASE_SAVED_SEARCH : runtime.getCurrentScript().getParameter("custscript_icabpm_base_saved_search"),                    
                DELAY_RESULTS : runtime.getCurrentScript().getParameter("custscript_icabpm_delay_results"),
                SHOW_DYNAMIC_COLUMNS : runtime.getCurrentScript().getParameter("custscript_icabpm_show_dynamic_columns")
        }
    

	Handlebars.registerHelper("fc", function (value) {
		try {
			var v = numeral(value).format("0,0.00");
			return v;
		} catch (e) {
			return "0";
		}
	});

	function getTemplateId(name) {
		var fs = search.create({
			type: "file",
			filters: [["name", "startswith", name]],
			columns: [],
		});
		var id = null;
		fs.run().each(function (result) {
			id = result.id;
		});
		return id;
	}

	function getFilterData(params) {
		var p = JSON.stringify(params);
		// log.audit('p', p);

		return JSON.parse(
			https.get({
				url: url.resolveScript({
					scriptId: "customscript_ica_pm_service",
					deploymentId: "customdeploy_ica_pm_service",
					returnExternalUrl: true,
					params: {
						action: params.action,
						filters: JSON.stringify(params.filters),
					},
				}),
			}).body
		);
	}

	function buildFilters() {
		var objects = {
			apaccounts: getFilterData({ action: "getapaccounts", params: {} }),
			accounts: _.map(getFilterData({ action: "getaccountmappings", params: {} }), "bankaccount"),
			postingperiods: getFilterData({ action: "getpostingperiods", params: {} }),
			// paymentmethods :  getFilterData({"action" : "getpaymentmethods", "params" : {}}),
			// vendorcategories :  getFilterData({"action" : "getvendorcategories", "params" : {}}),
			// payees : getFilterData({"action" : "getpayees", "params" : {}}),
			// currencies : getFilterData({"action" : "get", "params" : {"recordtype" : "currency"}}),
			// locations : getFilterData({"action" : "get", "params" : {"recordtype" : "location"}}),
		};
		log.audit("objects", JSON.stringify(objects));
                log.audit("accounts", JSON.stringify(objects.accounts));

		return objects;
	}

	function buildDynamicFilters() {
		var html = "";
		var searchhtml = "";

		//Search
		var df = getFilterData({ action: "getdynamicfilters", params: {} });

		//Build HTML depending on type.
		for (var i = 0; i < df.length; i++) {
			var d = df[i];
			if (i % 4 == 0) {
				html += "<tr>";
			}
			if (i % 4 == 3) {
				html += "</tr>";
			}

			html += '<td style="width: 30%">';

			if (d.type.id == 12) {
				//List Record
				html += '<div class="ica-label">' + d.ica_payables_field_name + "</div>";
				html +=
					'<select class="selectpicker show-tick form-control form-control-sm" style="font-size: 10px !important" data-style="btn-secondary" data-size="8" id="filter_' +
					d.field_internal_id +
					'" name="filter_' +
					d.field_internal_id +
					'" onchange="reload()">';
				html += '<option value="">All</option>';
				for (var j = 0; j < d.sourcelist.length; j++) {
					html += '<option value="' + d.sourcelist[j].id + '">' + d.sourcelist[j].name + "</option>";
				}
				html += "</select></td>";
				searchhtml += "filter_" + d.field_internal_id + ":" + '$("#filter_' + d.field_internal_id + '").val(),';
			}
			if (d.type.id == 11) {
				//Checkbox
				html += '<div class="form-check">';
				html += '<input onchange="reload()" type="checkbox" class="form-check-input" id="filter_' + d.field_internal_id + '">';
				html += '<label class="form-check-label ica-label" for="filter_' + d.field_internal_id + '">' + d.ica_payables_field_name + "</label>";
				html += "</div>";
				searchhtml += "filter_" + d.field_internal_id + ":" + '$("#filter_' + d.field_internal_id + '").prop("checked"),';
			}
			if (i % 4 != 3) {
				html += '<td style="width: 5%"></td>';
			}
		}

		return {
			html: html,
			searchhtml: searchhtml,
		};
	}

	function onRequest(context) {
		try {
			var params = context.request.parameters;
			log.audit("params", JSON.stringify(params));
                        log.audit("PARAMS", JSON.stringify(PARAMS));

			var form = ui.createForm({ title: "iCloudAuthority - Payment Module" });
			var fileTemplateId = getTemplateId(TMPL_NAME);
			log.audit("fileTemplateId", JSON.stringify(fileTemplateId));

			var fileTemplate = file.load({
				id: fileTemplateId,
			});

			var fieldTable = form.addField({
				id: "tablehtml",
				type: ui.FieldType.INLINEHTML,
				label: "TABLE",
			});

			var user = runtime.getCurrentUser();
			var objects = buildFilters(); //{}; //

			//get default for apaccount, account

			var defaultapaccount = params.apaccount;
			if (defaultapaccount != undefined) {
			} else {
				defaultapaccount = objects.apaccounts[0].id;
				// log.audit('objects.apaccounts[0]', JSON.stringify(objects.apaccounts));
			}
			objects.apaccount = defaultapaccount || "";

			var defaultaccount = params.account;
			if (defaultaccount != undefined) {
			} else {
				defaultaccount = objects.accounts[0].id;
			}
			objects.account = defaultaccount || "";

			// log.audit('defaultapaccount', defaultapaccount);
			// log.audit('defaultaccount', defaultaccount);
			//search all open bills.

			// // objects.transactions = getFilterData({
			// //     "action" : "getbillsv2",
			// //     "filters" : {
			// //         filteraccount: defaultaccount,
			// //         filterapaccount: defaultapaccount
			// //     }
			// // });
			// log.audit('objects.transactions', JSON.stringify(objects.transactions));

			objects.payees = _.sortBy(_.uniqBy(_.map(objects.transactions, "entity"), "id"), "text");
			//log.audit('objects.payees', JSON.stringify(objects.payees));
			objects.vendorpaymentmethods = _.map(objects.transactions, "vendor_custentity_paymentmethod");
			objects.employeepaymentmethods = _.map(objects.transactions, "employee_custentity_paymentmethod");
			objects.paymentmethods = _.sortBy(
				_.values(_.pickBy(_.uniqBy(objects.vendorpaymentmethods.concat(objects.employeepaymentmethods), "id"), "id")),
				"text"
			);
			// log.audit('objects.paymentmethods', JSON.stringify(objects.paymentmethods));
			objects.locations = _.sortBy(_.uniqBy(_.map(objects.transactions, "locationnohierarchy"), "id"), "text");
			objects.currencies = _.sortBy(_.uniqBy(_.map(objects.transactions, "currency"), "id"), "text");
			objects.vendorcategories = _.sortBy(_.uniqBy(_.map(objects.transactions, "vendor_category"), "id"), "text");

			// Add dynamic filters.
			var f = buildDynamicFilters();
			objects.dynamicfilters = f.html;
			objects.searchdynamicfilters = f.searchhtml;
                        objects.delayresults = PARAMS.DELAY_RESULTS;                        
                        objects.basesavedsearch = PARAMS.BASE_SAVED_SEARCH;

                        log.audit('delayresults', objects.delayresults);
                        log.audit('basesavedsearch', objects.basesavedsearch);

			var template = Handlebars.compile(fileTemplate.getContents());
			var html = template(objects);

			fieldTable.defaultValue = html;
			context.response.writePage(form);
		} catch (e) {
			log.error("Error", e.message);
		}
	}
	return {
		onRequest: onRequest,
	};
});
