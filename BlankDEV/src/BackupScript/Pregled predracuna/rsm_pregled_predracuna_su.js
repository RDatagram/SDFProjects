/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount 
 */
define(['N/ui/serverWidget', 'N/search', 'N/file', 'N/render', 'N/url', 'N/log', 'N/query'],

  function (serverWidget, search, file, render, url, log, query) {

    /**
     * Loads html template and renders it with custom record data
     * @returns {string} Rendered html template
     */
    function createKifKufDataList() {
      // Create and run saved search of custom kif kuf data records
      var results = search.create({
        type: 'customrecord_kif_kuf_data',
        filters: [],
        columns: [
          'internalid',
          'name',
          'custrecord_report_type',
          'custrecord_popdv_date_from',
          'custrecord_popdv_date_to',
          'custrecord_created_at',
          'custrecord_file_document',
          'custrecord_kif_kuf_data_subsidiary',
          'custrecord_kif_kuf_data_user'
        ]
      }).run();

      var data = [];
      results.each(function (result) {
        var suiteletParams = {
          internalid: result.getValue('internalid'),
          type: result.getValue('custrecord_report_type'),
          fileid: result.getValue('custrecord_file_document'),
          popdvdatefrom: result.getValue('custrecord_popdv_date_from'),
          popdvdateto: result.getValue('custrecord_popdv_date_to'),
          subsidiaryid: result.getValue('custrecord_kif_kuf_data_subsidiary')
        };
        var reportSuiteletUrl = url.resolveScript({
          scriptId: 'customscript_kif_kuf_report_su',
          deploymentId: 'customdeploy_kif_kuf_report_su',
          params: suiteletParams
        });
        var exportXlsSuiteletUrl = url.resolveScript({
          scriptId: 'customscript_rsm_kifkuf_export_xls_v2',
          deploymentId: 'customdeploy_rsm_kifkuf_export_xls_v2',
          params: suiteletParams
        });
        var deleteRecordSuiteletUrl = url.resolveScript({
          scriptId: 'customscript_kif_kuf_delete_su',
          deploymentId: 'customdeploy_kif_kuf_delete_su',
          params: suiteletParams
        });

        data.push({
          internalid: result.getValue('internalid'),
          name: result.getValue('name'),
          type: result.getValue('custrecord_report_type'),
          from: result.getValue('custrecord_popdv_date_from'),
          to: result.getValue('custrecord_popdv_date_to'),
          createdat: result.getValue('custrecord_created_at'),
          file: result.getValue('custrecord_file_document'),
          user: result.getValue('custrecord_kif_kuf_data_user'),
          subsidiary: result.getText('custrecord_kif_kuf_data_subsidiary'),
          reportsuiteleturl: reportSuiteletUrl,
          exportXlsSuiteletUrl: exportXlsSuiteletUrl,
          deleteRecordSuiteletUrl: deleteRecordSuiteletUrl
        });
        return true;
      });

      var htmlTemplate = file.load({ id: './kif_kuf_templates/rsm_kif_kuf_data_html_template.html' });
      var content = htmlTemplate.getContents();

      var templateRenderer = render.create();
      templateRenderer.templateContent = content;

      templateRenderer.addCustomDataSource({
        format: render.DataSource.JSON,
        alias: "JSON",
        data: JSON.stringify({ data: data })
      });

      return templateRenderer.renderAsString();
    }

    /**
     * Run customer query
     * @returns {Array} returns array of values array
     */
    function getCustomers() {
        var customerQuery = query.runSuiteQL({
            query: 'SELECT id, companyname FROM customer'
        });
        return customerQuery.results;
    }
    /**
     * Creates a form, adds fields and buttons to it and returns it
     * @returns {serverWidget.Form} Netsuite Form encapsulation object
     */
    function createForm() {
      var form = serverWidget.createForm({
        title: "PREGLED PREDRACUNA"
      });

      form.clientScriptModulePath = './rsm_pregled_predracuna_cs.js';
      // Select field (KIF/KUF) 
      var selectCustomer = form.addField({
        id: 'customerselect',
        label: "Customer:",
        type: serverWidget.FieldType.SELECT
      });
      selectCustomer.addSelectOption({
        value: '',
        text: 'Svi',
        isSelected: true
      });
      var queryResults = getCustomers();

      queryResults.forEach(function (result) {
        selectCustomer.addSelectOption({
            value: result.values[0],
            text: result.values[1]
        });
      });
      selectCustomer.updateLayoutType({
        layoutType: serverWidget.FieldLayoutType.OUTSIDEBELOW
      });
      selectCustomer.updateBreakType({
        breakType: serverWidget.FieldBreakType.STARTROW
      });

      // Inline HTML field
      var htmlField = form.addField({
        id: 'htmlfield',
        label: "Lista predracuna",
        type: serverWidget.FieldType.INLINEHTML
      });
      htmlField.defaultValue = '<div id="inlinehtmlfield"></div>';
      htmlField.updateLayoutType({
        layoutType: serverWidget.FieldLayoutType.OUTSIDEBELOW
      });
      htmlField.updateBreakType({
        breakType: serverWidget.FieldBreakType.STARTROW
      });

      // Buttons
      form.addButton({
        id: 'changeinlinehtml',
        label: "Potvrdi izbor customera",
        functionName: 'confirmSelectChange'
      });
      form.addButton({
        id: 'runmrscript',
        label: "Generisi podatke",
        functionName: 'runMrScript'
      });
      form.addButton({
        id: 'checkstatusbtn',
        label: "Provera statusa",
        functionName: 'checkTaskStatus'
      });
      form.addButton({
        id: 'refreshpage',
        label: "Osvezi stranicu",
        functionName: 'refreshPage'
      });
      form.addButton({
        id: 'resetlocalstorage',
        label: "Reset",
        functionName: 'resetLocalStorage'
      });

      return form;
    }

    // Suitelet entry point function
    function onRequest(params) {
      var form = createForm();
      params.response.writePage(form);
    }

    return {
      onRequest: onRequest,
    };

  });