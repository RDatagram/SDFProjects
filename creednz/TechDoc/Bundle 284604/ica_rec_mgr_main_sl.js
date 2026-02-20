/**
 *@NApiVersion 2.1
 *@NScriptType Suitelet
 *@author rfranco@icloudauthority.com
 */
define(['N/search', 'N/runtime', 'N/ui/serverWidget', 'N/file', 'N/https', 'N/url', './ica_rec_mgr_hb.js', './ica_rec_mgr_lodash.js', './ica_rec_mgr_moment.js'], function (search, runtime, ui, file, https, url, Handlebars, _, moment) {
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

	function buildFilters() {
		var objects = {
			araccounts: getFilterData({ action: 'getaraccounts', params: {} }),
			accounts: getFilterData({ action: 'getaccountmappings', params: {} }), //_.map(getFilterData({ action: 'getaccountmappings', params: {} }), 'bankaccount'),
		};
		// log.audit('objects', JSON.stringify(objects));

		return objects;
	}

	function getFilterData(params) {
		var p = JSON.stringify(params);
		log.audit('p', p);

		return JSON.parse(
			https.get({
				url: url.resolveScript({
					scriptId: 'customscript_ica_rec_mgr_service',
					deploymentId: 'customdeploy_ica_rec_mgr_service',
					returnExternalUrl: true,
					params: {
						action: params.action,
						filters: JSON.stringify(params.filters),
					},
				}),
			}).body
		);
	}

	const onRequest = (context) => {
		let script_params = {
			bss: runtime.getCurrentScript().getParameter('custscript_ica_rec_mgr_bss'),
			default_bank_account: runtime.getCurrentScript().getParameter('custscript_ica_rm_def_bank_account'),
			fileNamePrefix: runtime.getCurrentScript().getParameter('custscript_v171_filename_prefix') || '', //custscript_ica_rm_fn_prefix
			folderID: runtime.getCurrentScript().getParameter('custscript_ica_rm_folder_id') || '',
			connectorFolderID: runtime.getCurrentScript().getParameter('custscript_ica_rm_cf_id') || '',
			sendSummaryEmail: runtime.getCurrentScript().getParameter('custscript_ica_rm_send_file') || '',
			WFNoAccountInformation: runtime.getCurrentScript().getParameter('custscript_ica_rm_wfnai') || '',
			wireFees: runtime.getCurrentScript().getParameter('custscript_ica_rm_wirefees') || '',
			vendorOrigMsgType: runtime.getCurrentScript().getParameter('custscript_ica_rm_vomt') || '',
			includeCheckZip: runtime.getCurrentScript().getParameter('custscript_ica_rm_incl_cz') || false,
			checkZipDeploymentID: runtime.getCurrentScript().getParameter('custscript_ica_rm_cz_did') || '',
			checkZipColumns: runtime.getCurrentScript().getParameter('custscript_ica_rm_cz_columns') || '',
			companyId: runtime.getCurrentScript().getParameter('custscript_ica_rm_company_id') || '',
		};

		let params = context.request.parameters;

		const tmpl_id = getTemplateId('tmpl_ica_rec_mgr.html');
		const form = ui.createForm({ title: 'iCA Receivables Manager' });

		const fieldTable = form.addField({
			id: 'tablehtml',
			type: ui.FieldType.INLINEHTML,
			label: 'TABLE',
		});

		let objects = buildFilters(); //{};
		// log.audit('objects', JSON.stringify(objects));
		// log.audit('script_params', JSON.stringify(script_params));
		if (script_params.bss == null) {
			context.response.write('Base Saved search is required.');
			return;
		}

		objects.transactions = getFilterData({
			action: 'getResultsJSON',
			filters: { searchid: script_params.bss },
		});
		log.audit('objects.transactions', JSON.stringify(objects.transactions));

		var uniqueSubs = _.map(_.uniqBy(_.map(objects.transactions, 'Subsidiary'), 'value'), 'value');
		log.audit('objects.uniqueSubs', JSON.stringify(uniqueSubs));
		log.audit('script_params.default_bank_account', JSON.stringify(script_params.default_bank_account));
		var accounts = objects.accounts;
		log.audit('objects.accounts', JSON.stringify(accounts));
    var defaultSubsidiary = '';
		objects.accounts = _.filter(accounts, function (a) {
      log.audit('a', JSON.stringify(a));
      if (_.includes(uniqueSubs,a.subsidiary.id)) {
        if (script_params.default_bank_account == a.id) {
          defaultSubsidiary = a.subsidiary.id;
          log.audit('Here', 'yes'), (a.selected = 'selected');
        }
        return a;
      }
		
		});

		if (script_params.default_bank_account) {
			var res = _.filter(objects.transactions, { 'Bank Account': { value: String(script_params.default_bank_account) } });
			log.audit('res', JSON.stringify(res));
			if (res.length > 0) {
				objects.transactions = res;
			}
		}
		log.audit('objects.accounts', JSON.stringify(objects.accounts));

		objects.paymentmethods = _.sortBy(_.uniqBy(_.map(objects.transactions, 'Payment Method'), 'value'), 'text');
		objects.currencies = _.sortBy(_.uniqBy(_.map(objects.transactions, 'Currency'), 'value'), 'text');
		var currencies = objects.currencies;
		log.audit('objects.currencies', JSON.stringify(currencies));
    var defaultCurrency = '';
    if (defaultSubsidiary) {
      defaultCurrency = search.lookupFields({
        type: 'subsidiary',
        id: defaultSubsidiary,
        columns: 'currency'
      }).currency[0].value;
    }
    log.audit('defaultCurrency', JSON.stringify(defaultCurrency));
		objects.currencies = _.filter(currencies, function (c) {
      log.audit('c', JSON.stringify(c));
			if (defaultCurrency == c.value) {
				log.audit('CHere', 'yes'), (c.selected = 'selected');
			}
			return c;
		});



		objects.basesavedsearch = script_params.bss;
		objects.sp = script_params;

		const dpf = runtime.getCurrentUser().getPreference({ name: 'DATEFORMAT' });
		const d = returnProperDateFormat(dpf);
		objects.datetoday = moment().format(d);
		log.audit('objects', JSON.stringify(objects));

		const fileTemplate = file.load({
			id: tmpl_id,
		});
		const template = Handlebars.compile(fileTemplate.getContents());
		const html = template(objects);

		fieldTable.defaultValue = html;
		context.response.writePage(form);
	};

	return {
		onRequest,
	};
});
