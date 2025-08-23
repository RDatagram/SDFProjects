/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * 
 * OA Asset amortization form suitelet
 * 
 * This Suitelet script generates form, with fields for necessary parameters, which then exports OA report as a xls file
 * 
 */

define(["N/ui/serverWidget", "N/ui/message", "N/http", "N/log", "N/search"], function (serverWidget, message, http, log, search) {

  /**
   * Checks if variable value is equal to an empty string
   * @param {any} variable 
   */
  function isEmpty(variable) {
    return variable === '';
  }

  /**
   * Create and add message in the form page
   * @param {serverWidget.Form} form NetSuite serverWidget.Form object
   * @param {string} type message type
   * @param {string} title message title
   * @param {string} content message content (text)
   */
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

  // Suitelet entry-point function
  function onRequest(context) {

    var form = serverWidget.createForm({
      title: "Amortizacija OA"
    });

    if (context.request.method === "GET") {
      var serverMessage = context.request.parameters.message;

      showFormMessage(
        form,
        "warning",
        "Paznja!",
        "Morate podesiti fiksne parametre za OA izvestaj ukoliko vec nisu podeseni. To mozete uraditi na konfiguracionoj stranici biranjem menija 'Konfiguracija'."
      );
      showFormMessage(
        form,
        "information",
        "Info",
        "Ukoliko upisujete iznos sa decimalnom tackom, koristite iskljucivo tacku! (Ne treba koristiti zarez)"
      );

      if (serverMessage) {
        serverMessage = JSON.parse(serverMessage);
        showFormMessage(
          form,
          serverMessage.type,
          serverMessage.title,
          serverMessage.content
        );
      }

      // Main field group
      var mainGroup = form.addFieldGroup({
        id: 'main_field_group',
        label: 'Glavno'
      });
      mainGroup.isSingleColumn = true;

      // Year field
      var year = form.addField({
        id: "godina_obracuna",
        type: serverWidget.FieldType.SELECT,
        label: "Obracun za godinu:",
        container: 'main_field_group'
      });

      var thisYear = new Date().getFullYear();
      var start = 2019;
      var end = thisYear;

      // Add select options for each year from start to end. The default option is current year
      for (var i = start; i <= end; i++) {
        var isSelected = false;
        if (i === thisYear) isSelected = true;
        year.addSelectOption({
          value: i,
          text: i,
          isSelected: isSelected
        });
      }

      // Average pay field
      var prosecnaPlata = form.addField({
        id: "prosecna_plata",
        type: serverWidget.FieldType.TEXT,
        label: "Prosecna plata za decembar izabrane godine",
        container: 'main_field_group'
      });

      // Subsidiary select field
      var subsidiaryField = form.addField({
        id: 'subsidiary_field',
        label: 'Subsidiary:',
        container: 'main_field_group',
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

      // Field group for prior year nbv
      var fieldGroup = form.addFieldGroup({
        id: 'prior_year_nbv_field_group',
        label: "Krajnje stanje za prethodnu godinu (u odnosu na izabranu) - po grupama"
      });
      fieldGroup.isSingleColumn = true;

      // Fields
      form.addField({
        id: 'nbv_group_2',
        label: "II grupa",
        type: serverWidget.FieldType.TEXT,
        container: 'prior_year_nbv_field_group'
      });

      form.addField({
        id: 'nbv_group_3',
        label: "III grupa",
        type: serverWidget.FieldType.TEXT,
        container: 'prior_year_nbv_field_group'
      });
      form.addField({
        id: 'nbv_group_4',
        label: "IV grupa",
        type: serverWidget.FieldType.TEXT,
        container: 'prior_year_nbv_field_group'
      });
      form.addField({
        id: 'nbv_group_5',
        label: "V grupa",
        type: serverWidget.FieldType.TEXT,
        container: 'prior_year_nbv_field_group'
      });

      // Submit button
      form.addSubmitButton({
        label: "Export OA"
      });

      context.response.writePage(form);
    } else {
      // POST request - get parameters from request
      var godina_obracuna = context.request.parameters.godina_obracuna,
        prosecnaPlata = context.request.parameters.prosecna_plata,
        selectedSubsidiary = context.request.parameters.subsidiary_field,
        nbvGroup2 = context.request.parameters.nbv_group_2,
        nbvGroup3 = context.request.parameters.nbv_group_3,
        nbvGroup4 = context.request.parameters.nbv_group_4,
        nbvGroup5 = context.request.parameters.nbv_group_5;

      var error = false,
        message = null;

      // Check if any param is empty. If true, set error message
      if (isEmpty(prosecnaPlata) || isEmpty(nbvGroup2) || isEmpty(nbvGroup3) || isEmpty(nbvGroup4) || isEmpty(nbvGroup5)) {
        error = true;
        message = JSON.stringify({
          "type": "Error",
          "title": "Greska!",
          "content": "Morate uneti vrednosti za sva polja"
        });
      }

      // Check if params are NaN. If true, set error message
      if (isNaN(prosecnaPlata) || isNaN(nbvGroup2) || isNaN(nbvGroup3) || isNaN(nbvGroup4) || isNaN(nbvGroup5)) {
        error = true;
        message = JSON.stringify({
          "type": "Error",
          "title": "Greska!",
          "content": "Format vrednosti u nekom od numerickih polja nije validan!"
        });
      }

      // If error then redirect to this form page again only with error message
      if (error) {
        context.response.sendRedirect({
          type: http.RedirectType.SUITELET,
          identifier: "customscript_oa_form_su",
          id: "customdeploy_oa_form_su",
          parameters: {
            message: message
          }
        });
        // If not error then redirect to the corresponding suitelet
      } else {
        context.response.sendRedirect({
          type: http.RedirectType.SUITELET,
          identifier: "customscript_oa_su",
          id: "customdeploy_oa_su",
          parameters: {
            year: godina_obracuna,
            prosecnaPlata: prosecnaPlata,
            selectedSubsidiary: selectedSubsidiary,
            nbvGroup2: nbvGroup2,
            nbvGroup3: nbvGroup3,
            nbvGroup4: nbvGroup4,
            nbvGroup5: nbvGroup5
          }
        });
      }
    }
  }

  return {
    onRequest: onRequest
  };
});
