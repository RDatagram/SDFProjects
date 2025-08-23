/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * 
 * POA Asset amortization form suitelet
 * 
 * This Suitelet script generates form with a single date field with on GET request.
 * 
 * On POST request date value is submited as deprToDate parameter and page redirects to 'customscript_asset_amortization_oan_su' suitelet.
 * 
 * deprToDate parameter represents date value to which Asset depreciation is calculated.
 * If the form is submited withoud chosen date, script will redirect to itself with an error message.
 * 
 */

define(["N/ui/serverWidget", "N/http", "N/ui/message", "N/log", "N/search"], function (serverWidget, http, message, log, search) {

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
      title: "Amortizacija POA"
    });

    if (context.request.method === "GET") {

      showFormMessage(
        form,
        'warning',
        'Paznja!',
        "Zbog konzistentnosti podataka u generisanom izvestaju, bitno je uraditi izvestaje za sve prethodne godine, pocevsi od 2019. godine. <br/>" +
        "Ovo je obavezno uraditi jednom (prvo koriscenje funkcionalnosti za amortizaciju), nakon sto je funkcionalnost ubacena u sistem."
      );

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
      year.updateBreakType({
        breakType: serverWidget.FieldBreakType.STARTCOL
      });

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

      var poaNBVField = form.addField({
        id: 'poa_nbv_field',
        label: 'PoA NBV:',
        type: serverWidget.FieldType.INTEGER
      });
      poaNBVField.updateLayoutType({
        layoutType: serverWidget.FieldLayoutType.OUTSIDEBELOW
      });
      poaNBVField.updateBreakType({
        breakType: serverWidget.FieldBreakType.STARTROW
      });


      // Submit button
      form.addSubmitButton({
        label: "Export POA"
      });

      context.response.writePage(form);
    } else {
      var year = context.request.parameters.godina_obracuna;
      var selectedSubsidiary = context.request.parameters.subsidiary_field;
      var poaNbvAmount = context.request.parameters.poa_nbv_field;

      // Redirection to this same form suitelet with an error message
      if (year === '') {
        context.response.sendRedirect({
          type: http.RedirectType.SUITELET,
          identifier: 'customscript_poa_form_su',
          id: 'customdeploy_poa_form_su',
          parameters: {
            message: JSON.stringify({
              "type": "Error",
              "title": "Greska!",
              "content": "Morate odabrati godinu za koju se radi izvestaj!"
            })
          }
        });

        // Redirection to next suitelet
      } else {
        context.response.sendRedirect({
          type: http.RedirectType.SUITELET,
          identifier: 'customscript_poa_su',
          id: 'customdeploy_poa_su',
          parameters: {
            year: year,
            selectedSubsidiary: selectedSubsidiary,
            poaNbvAmount: poaNbvAmount
          }
        });
      }
    }
  }

  return {
    onRequest: onRequest
  };
});
