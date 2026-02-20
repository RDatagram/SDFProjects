/**
 *@NApiVersion 2.x
 *@NScriptType Suitelet
 *@author rfranco@icloudauthority.com
 */
define([
	'N/search',
	'N/runtime',
	'N/ui/serverWidget',
	'N/file',
	'N/https',
	'N/url',
	'./ica_erefunds_hb.js',
	'./ica_erefunds_lodash.js',
	'./ica_erefunds_moment.js',
], function (search, runtime, ui, file, https, url, Handlebars, _, moment) {
	var script_params = {
		bss: runtime.getCurrentScript().getParameter('custscript_ica_erefunds_bss'),
		default_bank_account: runtime.getCurrentScript().getParameter('custscript_ica_erefunds_def_bank_account'),
		fileNamePrefix: runtime.getCurrentScript().getParameter('custscript_ica_erefunds_fn_prefix') || '',
		folderID: runtime.getCurrentScript().getParameter('custscript_ica_erefunds_folder_id') || '',
		connectorFolderID: runtime.getCurrentScript().getParameter('custscript_ica_erefunds_cf_id') || '',
		sendSummaryEmail: runtime.getCurrentScript().getParameter('custscript_ica_erefunds_send_file') || '',
		WFNoAccountInformation: runtime.getCurrentScript().getParameter('custscript_ica_erefunds_wfnai') || '',
		wireFees: runtime.getCurrentScript().getParameter('custscript_ica_erefunds_wirefees') || '',
		vendorOrigMsgType: runtime.getCurrentScript().getParameter('custscript_ica_erefunds_vomt') || '',
    includeCheckZip: runtime.getCurrentScript().getParameter('custscript_ica_erefunds_incl_cz') || false,
    checkZipDeploymentID: runtime.getCurrentScript().getParameter('custscript_ica_erefunds_cz_did') || '',
    checkZipColumns: runtime.getCurrentScript().getParameter('custscript_ica_erefunds_cz_columns') || '',
    companyId: runtime.getCurrentScript().getParameter('custscript_ica_erefunds_company_id') || ''
	};

	Handlebars.registerHelper('fc', function (value) {
		try {
			var v = numeral(value).format('0,0.00');
			return v;
		} catch (e) {
			return '0';
		}
	});

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

	function getTemplateId(name) {
		var fs = search.create({
			type: 'file',
			filters: [['name', 'startswith', name]],
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
		log.audit('p', p);

		return JSON.parse(
			https.get({
				url: url.resolveScript({
					scriptId: 'customscript_ica_erefunds_service',
					deploymentId: 'customdeploy_ica_erefunds_service',
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
			araccounts: getFilterData({ action: 'getaraccounts', params: {} }),
			accounts: _.map(getFilterData({ action: 'getaccountmappings', params: {} }), 'bankaccount'),
			// postingperiods: getFilterData({ action: "getpostingperiods", params: {} }),
			// paymentmethods :  getFilterData({"action" : "getpaymentmethods", "params" : {}}),
			// vendorcategories :  getFilterData({"action" : "getvendorcategories", "params" : {}}),
			// payees : getFilterData({"action" : "getpayees", "params" : {}}),
			// currencies : getFilterData({"action" : "get", "params" : {"recordtype" : "currency"}}),
			// locations : getFilterData({"action" : "get", "params" : {"recordtype" : "location"}}),
		};
		log.audit('objects', JSON.stringify(objects));
		// log.audit("accounts", JSON.stringify(objects.accounts));

		return objects;
	}

	// function getLink() {
	//         var link = url.resolveScript({
	//                 scriptId: "customscript_ica_erefunds_service",
	//                 deploymentId: "customdeploy_ica_erefunds_service",
	//         });

	//         return link;
	// }

	function onRequest(context) {
		var params = context.request.parameters;
		const tmpl_id = getTemplateId('tmpl_ica_erefunds.html'); //script_params.tmpl_id || 332963; // make as parameter?

		var form = ui.createForm({ title: 'iCA eRefunds' });

		var fieldTable = form.addField({
			id: 'tablehtml',
			type: ui.FieldType.INLINEHTML,
			label: 'TABLE',
		});

		var objects = buildFilters();
    log.audit('objects', JSON.stringify(objects));
		log.audit('script_params', JSON.stringify(script_params));
		if (script_params.bss == null) {
			context.response.write('Base Saved search is required.');
			return;
		}

		objects.transactions = getFilterData({
			action: 'getResultsJSON',
			filters: { searchid: script_params.bss }, //Make as parameter
		});

		//from results, get entities
		// var entityIds = _.map(objects.transactions, "entity");
		// log.audit("entityIds", JSON.stringify(entityIds));

		// var entityProfiles = getFilterData({
		// 	action: "getentityprofiles",
		// 	filters: { entityIds: entityIds }
		// });
		// log.audit("entityProfiles", JSON.stringify(entityProfiles));

		// var entityProfileIds = _.map(entityProfiles, "custrecord_ica_ep_parent_entity.value");
		// //merge entityProfiles with objects.transactions
		// log.audit("entityProfileIds", JSON.stringify(entityProfileIds));

		// var txns = objects.transactions;
		// log.audit("txns", JSON.stringify(txns));

		// var newTransactions = [];
		// for (var i=0; i<txns.length; i++) {
		//         var txn = txns[i];
		//         // log.audit("txn.entity", txn.entity);
		//         if (_.includes(entityProfileIds, String(txn.entity))) {
		//                 var obj = txn;
		//                 obj["entityprofile"] = _.find(entityProfiles, {custrecord_ica_ep_parent_entity : {value: String(txn.entity)}});
		//                 // log.audit("entityprofile", JSON.stringify(obj["entityprofile"]));
		//                 newTransactions.push(obj);
		//         }
		// }
		// log.audit("newTransactions", JSON.stringify(newTransactions));
		// log.audit("newTransactions.length", newTransactions.length);

		// objects.transactions = newTransactions;

		log.audit("objects.transactions", JSON.stringify(objects.transactions));
		// log.audit("objects.accounts", JSON.stringify(objects.accounts));

		var uniqueIds = _.map(_.uniqBy(_.map(objects.transactions, 'Account (Main)'), 'id'), 'id');
		log.audit('objects.uniqueIds', JSON.stringify(uniqueIds));
		log.audit('script_params.default_bank_account', JSON.stringify(script_params.default_bank_account));
		var accounts = objects.accounts;
		objects.accounts = _.filter(accounts, function (a) {
			if (_.includes(uniqueIds, String(a.id))) {
				if (script_params.default_bank_account == a.id) {
					log.audit('Here', 'yes'), (a.selected = 'selected');
				}
				return a;
			}
		});

		if (script_params.default_bank_account) {
      var res = _.filter(objects.transactions, { 'Account (Main)': { id: String(script_params.default_bank_account) } });
      log.audit('res', JSON.stringify(res));
      if (res.length>0) {
        objects.transactions = res;
      }			
		}

		objects.basesavedsearch = script_params.bss;
		objects.paymentmethods = _.sortBy(_.uniqBy(_.map(objects.transactions, 'Payment Method'), 'id'), 'text');
		objects.currencies = _.sortBy(_.uniqBy(_.map(objects.transactions, 'Currency'), 'id'), 'text');
		objects.locations = _.sortBy(_.uniqBy(_.map(objects.transactions, 'Location'), 'id'), 'text');
		objects.categories = _.sortBy(_.uniqBy(_.map(objects.transactions, 'Category'), 'id'), 'text');
		// objects.accounts = _.sortBy(_.uniqBy(_.map(objects.transactions, "Account (Main)"), "id"), "text");
		objects.sp = script_params;

		log.audit('objects.sp', JSON.stringify(objects.sp));

		var dpf = runtime.getCurrentUser().getPreference({ name: 'DATEFORMAT' });
		var d = returnProperDateFormat(dpf);
		objects.datetoday = moment().format(d);
		log.audit('objects', JSON.stringify(objects));

		var fileTemplate = file.load({
			id: tmpl_id,
		});
		var template = Handlebars.compile(fileTemplate.getContents());
		var html = template(objects);

		fieldTable.defaultValue = html;
		context.response.writePage(form);
	}
	return {
		onRequest: onRequest,
	};
});
