/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 */

define(["N/ui/serverWidget", "N/ui/message", "N/http", "N/file", "N/log", "N/search", "N/record"], function (serverWidget, message, http, file, log, search, record) {

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

    var configFile = file.load({
      id: './fam_config.json'
    });
    var folderId = configFile.folder;
    var config = JSON.parse(configFile.getContents());

    var form = serverWidget.createForm({
      title: "RSM Fam Konfiguracija"
    });

    // INITIAL GET REQUEST
    if (context.request.method === "GET") {

      var oaGroup = form.addFieldGroup({
        id: 'oa_field_group',
        label: 'OA konfiguracija'
      });
      oaGroup.isSingleColumn = true;

      // Subsidiary select field
      var subsidiaryField = form.addField({
        id: 'subsidiary_field',
        label: 'Subsidiary:',
        type: serverWidget.FieldType.SELECT,
        container: 'oa_field_group'
      });
      var subsidiaries = getSubsidiaries();
      for (var i in subsidiaries) {
        subsidiaryField.addSelectOption({
          value: subsidiaries[i].internalid,
          text: subsidiaries[i].internalid + '/' + subsidiaries[i].name
        });
      }
      subsidiaryField.isMandatory = true;

      // Submit button
      form.addSubmitButton({
        label: "Konfigurisi"
      });

      context.response.writePage(form);
    } else {

      // SUBSIDIARY IS SELECTED AND RECEIVED LOGIC
      if (typeof context.request.parameters.subsidiary_field != "undefined") {

        var serverMessage = context.request.parameters.message;
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

        var subsidiaryId = context.request.parameters.subsidiary_field;
        var subsidiaryName = "";

        var subsidiaryRecord = record.load({
          type: "subsidiary",
          id: subsidiaryId
        });
        subsidiaryName = subsidiaryRecord.getText("name");

        var oaGroup = form.addFieldGroup({
          id: 'oa_field_group',
          label: 'OA konfiguracija'
        });
        oaGroup.isSingleColumn = true;

        // Subsidiary select field, READONLY
        var subsidiaryField = form.addField({
          id: 'subsidiary_field_readonly',
          label: 'Subsidiary:',
          type: serverWidget.FieldType.SELECT,
          container: 'oa_field_group'
        });
        subsidiaryField.addSelectOption({
          value: subsidiaryId,
          text: subsidiaryId + '/' + subsidiaryName
        });
        subsidiaryField.updateDisplayType({
          displayType: serverWidget.FieldDisplayType.DISABLED
        });

        var group2nbv = form.addField({
          id: 'nbv_group_2',
          label: "II grupa (krajnji saldo za 2018)",
          type: serverWidget.FieldType.TEXT,
          container: 'oa_field_group'
        });

        var group3nbv = form.addField({
          id: 'nbv_group_3',
          label: "III grupa (krajnji saldo za 2018)",
          type: serverWidget.FieldType.TEXT,
          container: 'oa_field_group'
        });

        var group4nbv = form.addField({
          id: 'nbv_group_4',
          label: "IV grupa (krajnji saldo za 2018)",
          type: serverWidget.FieldType.TEXT,
          container: 'oa_field_group'
        });

        var group5nbv = form.addField({
          id: 'nbv_group_5',
          label: "V grupa (krajnji saldo za 2018)",
          type: serverWidget.FieldType.TEXT,
          container: 'oa_field_group'
        });

        if (config.oa.fixedParam2[subsidiaryId]) {
          group2nbv.defaultValue = config.oa.fixedParam2[subsidiaryId]['2 grupa'];
          group3nbv.defaultValue = config.oa.fixedParam2[subsidiaryId]['3 grupa'];
          group4nbv.defaultValue = config.oa.fixedParam2[subsidiaryId]['4 grupa'];
          group5nbv.defaultValue = config.oa.fixedParam2[subsidiaryId]['5 grupa'];
        }

        // Submit button
        form.addSubmitButton({
          label: "Konfigurisi"
        });

        context.response.writePage(form);
        // DATA IS SENT FOR PROCESSING LOGIC
      } else if (typeof context.request.parameters.subsidiary_field_readonly != "undefined") {

        var subsidiaryId = context.request.parameters.subsidiary_field_readonly;

        config.oa.fixedParam2[subsidiaryId] = {};
        config.oa.fixedParam2[subsidiaryId]['2 grupa'] = context.request.parameters.nbv_group_2;
        config.oa.fixedParam2[subsidiaryId]['3 grupa'] = context.request.parameters.nbv_group_3;
        config.oa.fixedParam2[subsidiaryId]['4 grupa'] = context.request.parameters.nbv_group_4;
        config.oa.fixedParam2[subsidiaryId]['5 grupa'] = context.request.parameters.nbv_group_5;

        configFile = file.create({
          name: 'fam_config.json',
          fileType: file.Type.JSON,
          contents: JSON.stringify(config)
        });
        configFile.folder = folderId;
        configFile.save();

        // Redirect to the same page and send message param
        context.response.sendRedirect({
          type: http.RedirectType.SUITELET,
          identifier: 'customscript_fam_config_su',
          id: 'customdeploy_fam_config_su',
          parameters: {
            message: JSON.stringify({
              "type": "Confirmation",
              "title": "Uspesno!",
              "content": "Uspesno azuriranje konfiguracionog fajla"
            }),
          }
        });

      }

    }
  }

  return {
    onRequest: onRequest
  };
});
