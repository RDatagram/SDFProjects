/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount 
 */
define(['N/ui/serverWidget', 'N/search', 'N/file', 'N/render', 'N/url', 'N/log', 'N/ui/message', 'N/http'],

  function (serverWidget, search, file, render, url, log, message, http) {

    /**
     * Creates and runs a subsidiary saved search
     * @returns {object} returns custom object with keys as internalid's of subsidiaries and values as object with subsidiary props
     */
    function getSubsidiaries() {
      var results = search.create({
        type: 'subsidiary',
        filters: [],
        columns: [
          'internalid',
          'name',
          'country'
        ]
      }).run();

      var obj = {};
      results.each(function (result) {
        obj[result.getValue('internalid')] = {
          internalid: result.getValue('internalid'),
          name: result.getValue('name'),
          country: result.getValue('country')
        }
        return true;
      });

      return obj;
    }

    function isEmpty(parameter) {
      return parameter === '';
    }

    function showFormMessage(form, type, title, content) {
      var messageTypes = {
        error: message.Type.ERROR,
        warning: message.Type.WARNING,
        information: message.Type.INFORMATION,
        confirmation: message.Type.CONFIRMATION
      };
      form.addPageInitMessage({
        type: messageTypes[type.toLowerCase()],
        title: title,
        message: content
      });
    }

    /**
     * Creates a form, adds fields and buttons to it and returns it
     * @returns {serverWidget.Form} Netsuite Form encapsulation object
     */
    function createForm() {
      var form = serverWidget.createForm({
        title: "IPG REPORT"
      });
      //form.clientScriptModulePath = './rsm_kif_kuf_cs.js';

      // Subsidiary select field
      var subsidiaryField = form.addField({
        id: 'subsidiary_field',
        label: 'Subsidiary:',
        type: serverWidget.FieldType.SELECT
      });
      var subsidiaries = getSubsidiaries();
      for (var i in subsidiaries) {
        subsidiaryField.addSelectOption({
          value: subsidiaries[i].internalid,
          text: subsidiaries[i].internalid + '/' + subsidiaries[i].name
        });
      }
      subsidiaryField.updateLayoutType({
        layoutType: serverWidget.FieldLayoutType.OUTSIDEBELOW
      });
      subsidiaryField.updateBreakType({
        breakType: serverWidget.FieldBreakType.STARTROW
      });

      // POPDV date input fields
      var dateFrom = form.addField({
        id: 'reportdatefrom',
        label: "Datum od :",
        type: serverWidget.FieldType.DATE
      }).updateDisplaySize({
        height: 60,
        width: 150
      });
      dateFrom.updateLayoutType({
        layoutType: serverWidget.FieldLayoutType.OUTSIDEBELOW
      });
      dateFrom.updateBreakType({
        breakType: serverWidget.FieldBreakType.STARTROW
      });
      var dateTo = form.addField({
        id: 'reportdateto',
        label: "Datum do :",
        type: serverWidget.FieldType.DATE
      }).updateDisplaySize({
        height: 60,
        width: 150
      });
      dateTo.updateLayoutType({
        layoutType: serverWidget.FieldLayoutType.OUTSIDEBELOW
      });
      dateTo.updateBreakType({
        breakType: serverWidget.FieldBreakType.STARTROW
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
        var serverMessage = context.request.parameters.message;
        if (serverMessage) {
          serverMessage = JSON.parse(serverMessage);
          showFormMessage(
            form,
            serverMessage.type,
            serverMessage.title,
            serverMessage.content
          );
        }

        context.response.writePage(form);
      } else {
        // POKUPI PARAMETRE
        var selectedSubsidiary = context.request.parameters.subsidiary_field;
        var dateFrom = context.request.parameters.reportdatefrom;
        var dateTo = context.request.parameters.reportdateto;

        log.debug('Subsidiary:', selectedSubsidiary);
        log.debug('Date from:', dateFrom);
        log.debug('Date to:', dateTo);

        // URADI VALIDACIJU
        if (isEmpty(selectedSubsidiary) || isEmpty(dateFrom) || isEmpty(dateTo)) {
          var error = true;
          var message = JSON.stringify({
            "type": "Error",
            "title": "Greska!",
            "content": "Morate uneti vrednosti za sva polja"
          });
        }

        if (error) { // Send redirect to this suitlet with error message 
          context.response.sendRedirect({
            type: http.RedirectType.SUITELET,
            identifier: "customscript_rsm_ipg_report_su",
            id: "customdeploy_rsm_ipg_report_su",
            parameters: {
              message: message
            }
          });
        } else { // Send redirect to the corresponding suitlet
          // POZOVI EXPORT SUITLET
          log.debug('Info', 'POZIVAM EXPORT SUITLET');
          context.response.sendRedirect({
            type: http.RedirectType.SUITELET,
            identifier: "customscript_rsm_ipg_report_export_su",
            id: "customdeploy_rsm_ipg_report_export_su",
            parameters: {
              subsidiary: selectedSubsidiary,
              dateFrom: dateFrom,
              dateTo: dateTo
            }
          });
        }
      }
    }
    return {
      onRequest: onRequest,
    };

  });