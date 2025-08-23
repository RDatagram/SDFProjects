/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount 
 */
define(['N/ui/serverWidget', 'N/search', 'N/file', 'N/render', 'N/url', 'N/log', 'N/query', "N/http"],

  function (serverWidget, search, file, render, url, log, query, http) {


    /**
     * Run customer query
     * @returns {Array} returns array of values array
     */
    function getCustomers() {
        var customerQuery = query.runSuiteQL({
            query: 'SELECT custrecord_customer_id, custrecord_description FROM customrecord_rsm_so_list_data WHERE custrecord_customer_id IS NOT Null'
        });
        return customerQuery.results;
    }

    function getSubsidiaries() {
      var subsidiaryQuery = query.runSuiteQL({
        query: 'SELECT id, name FROM subsidiary'
      });
      return subsidiaryQuery.results;
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

      var generisanjeGroup = form.addFieldGroup({
        id: 'generisanjegroup',
        label: 'Generisanje podataka'
      });
      var selectSubsidiary = form.addField({
        id: 'subsidiaryselect',
        label: "Subsidiary *",
        type: serverWidget.FieldType.SELECT,
        container: 'generisanjegroup'
      });
      var subsidiaryResults = getSubsidiaries();

      subsidiaryResults.forEach(function (result) {
        selectSubsidiary.addSelectOption({
          value: result.values[0],
          text: result.values[0] + '/' + result.values[1]
        });
      });
      selectSubsidiary.updateLayoutType({
        layoutType : serverWidget.FieldLayoutType.OUTSIDEBELOW
      });
      selectSubsidiary.updateBreakType({
        breakType : serverWidget.FieldBreakType.STARTROW
      });
      var dateFromField = form.addField({
        id: 'datefrom',
        label: "Datum od *:",
        type: serverWidget.FieldType.DATE,
        container: 'generisanjegroup'
      }).updateDisplaySize({
        height : 60,
        width : 150
      });
      dateFromField.updateLayoutType({
        layoutType : serverWidget.FieldLayoutType.OUTSIDEBELOW
      });
      dateFromField.updateBreakType({
        breakType : serverWidget.FieldBreakType.STARTROW
      });
      var dateToField = form.addField({
        id: 'dateto',
        label: "Datum do *:",
        type: serverWidget.FieldType.DATE,
        container: 'generisanjegroup'
      }).updateDisplaySize({
        height : 60,
        width : 150
      });
      dateToField.updateLayoutType({
        layoutType : serverWidget.FieldLayoutType.OUTSIDEBELOW
      });
      dateToField.updateBreakType({
        breakType : serverWidget.FieldBreakType.STARTROW
      });
      var filterGroup = form.addFieldGroup({
        id: 'filtergroup',
        label: 'Filtriranje podataka'
      });
      var selectCustomer = form.addField({
        id: 'customerselect',
        label: "Customer:",
        type: serverWidget.FieldType.SELECT,
        container: 'filtergroup'
      });
      selectCustomer.addSelectOption({
        value: '',
        text: 'Svi',
        isSelected: true
      });
      var queryResults = getCustomers();
      if (queryResults.length > 0) {
        queryResults.forEach(function (result) {
          selectCustomer.addSelectOption({
            value: result.values[0],
            text: result.values[1]
          });
        });
      }
      selectCustomer.updateLayoutType({
        layoutType: serverWidget.FieldLayoutType.OUTSIDEBELOW
      });
      selectCustomer.updateBreakType({
        breakType: serverWidget.FieldBreakType.STARTROW
      });
      var dataGroup = form.addFieldGroup({
        id: 'datagroup',
        label: 'Izgenerisani podaci'
      });
      // Inline HTML field
      var htmlField = form.addField({
        id: 'htmlfield',
        label: "Lista predracuna",
        type: serverWidget.FieldType.INLINEHTML,
        container: 'datagroup'
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
      // Buttons
      form.addSubmitButton({
        label: "Export report"
      });

      return form;
    }

    // Suitelet entry point function
    function onRequest(context) {
      if (context.request.method === "GET") {
        var form = createForm();
        context.response.writePage(form);
      } else {
        // POZOVI EXPORT SUITLET
        log.debug('Info', 'POZIVAM EXPORT SUITLET');
        var customer = context.request.parameters.customerselect;
        log.debug('CUSTOMER', customer);
        var customerParam = (customer) ? customer : "Svi";
        var action = (customer) ? "OneCustomer" : "AllCustomers"
        context.response.sendRedirect({
          type: http.RedirectType.SUITELET,
          identifier: "customscript_rsm_pregled_predracuna_exp",
          id: "customdeploy_rsm_pregled_predracuna_exp",
          parameters: {
            customer: customerParam,
            action: action
          }
        });
      }
    }

    return {
      onRequest: onRequest,
    };

  });