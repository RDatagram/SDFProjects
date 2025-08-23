/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * 
 * OAN Asset amortization form suitelet
 * 
 * This Suitelet script generates form with a single select field with year values on GET request. Default value is current year.
 * 
 * On POST request year value is submited and page redirects to 'customscript_oan_su' suitelet
 * 
 */

define(["N/ui/serverWidget", "N/ui/message", "N/http", "N/log", "N/search"], function (serverWidget, message, http, log, search) {

  // Helper function to show message in the form page
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

  function onRequest(context) {

    var form = serverWidget.createForm({
      title: "Amortizacija OA-N"
    });

    if (context.request.method === "GET") {
      // If there is server message among request parameters, show that message
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

      // Year field
      var year = form.addField({
        id: "godina_obracuna",
        type: serverWidget.FieldType.SELECT,
        label: "Obracun za godinu:"
      });

      // Populating field with options and setting the current year as selected year
      var thisYear = new Date().getFullYear();
      var start = 2019;
      var end = thisYear;

      for (var i = start; i <= end; i++) {
        var isSelected = false;
        if (i === thisYear) isSelected = true;
        year.addSelectOption({
          value: i,
          text: i,
          isSelected: isSelected
        });
      }

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
      subsidiaryField.isMandatory = true;
      subsidiaryField.updateLayoutType({
        layoutType: serverWidget.FieldLayoutType.OUTSIDEBELOW
      });
      subsidiaryField.updateBreakType({
        breakType: serverWidget.FieldBreakType.STARTROW
      });

      // Submit button
      form.addSubmitButton({
        label: "Export OA-N"
      });

      context.response.writePage(form);

    } else {
      // Redirection
      context.response.sendRedirect({
        type: http.RedirectType.SUITELET,
        identifier: "customscript_oan_su",
        id: "customdeploy_oan_su",
        parameters: {
          year: context.request.parameters.godina_obracuna,
          selectedSubsidiary: context.request.parameters.subsidiary_field
        }
      });
    }
  }

  return {
    onRequest: onRequest
  };
});
