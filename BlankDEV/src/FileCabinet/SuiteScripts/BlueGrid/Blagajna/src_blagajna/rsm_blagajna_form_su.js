/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 * 
 * Blagajna
 * For a given subsidiary and date send it to be exported into PDF
 */
define(['N/ui/serverWidget', 'N/search', 'N/file', 'N/render', 'N/url', 'N/log', 'N/ui/message', 'N/http', "N/runtime", "N/config", "N/record"], function (serverWidget, search, file, render, url, log, message, http, runtime, config, record) {

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

  // Suitelet entry point function
  function onRequest(context) {

    var subsidiaryFeatureCheck = runtime.isFeatureInEffect({
      feature: 'SUBSIDIARIES'
    });

    // var companyInfo = config.load({
    //   type: config.Type.COMPANY_INFORMATION
    // });
    // log.debug("companyInfo", companyInfo);

    if (context.request.method === "GET") {

      var form = serverWidget.createForm({
        title: "Blagajna"
      });
      form.clientScriptModulePath = './rsm_blagajna_form_cs.js';

      // Blagajna export type select field
      var exportTypeField = form.addField({
        id: 'export_type_field',
        label: 'Tip:',
        type: serverWidget.FieldType.SELECT
      });
      exportTypeField.addSelectOption({
        value: 'uplatnica',
        text: 'Uplatnica'
      });
      exportTypeField.addSelectOption({
        value: 'isplatnica',
        text: 'Isplatnica'
      });
      exportTypeField.addSelectOption({
        value: 'glavna',
        text: 'Glavna Blagajna'
      });
      exportTypeField.isMandatory = true;
      exportTypeField.updateLayoutType({
        layoutType: serverWidget.FieldLayoutType.OUTSIDEBELOW
      });
      exportTypeField.updateBreakType({
        breakType: serverWidget.FieldBreakType.STARTROW
      });

      // Subsidiary select field (if the environment has the subsidiary feature)
      if (subsidiaryFeatureCheck) {
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
      }

      // Date field
      var onDate = form.addField({
        id: 'ondate_field',
        label: "Na datum:",
        type: serverWidget.FieldType.DATE
      }).updateDisplaySize({
        height: 60,
        width: 150
      });
      onDate.isMandatory = true;
      onDate.updateLayoutType({
        layoutType: serverWidget.FieldLayoutType.OUTSIDEBELOW
      });
      onDate.updateBreakType({
        breakType: serverWidget.FieldBreakType.STARTROW
      });

      // Buttons
      form.addSubmitButton({
        label: "Export PDF"
      });
      form.addButton({
        id: 'restart',
        label: "Restart",
        functionName: 'restart'
      });

      context.response.writePage(form);
    } else {

      var parameters = {
        exportType: context.request.parameters.export_type_field,
        onDate: context.request.parameters.ondate_field,
        subsidiaryId: 0
      }
      if (subsidiaryFeatureCheck) {
        parameters.subsidiaryId = context.request.parameters.subsidiary_field;
      } else {
        // var companyInfo = config.load({
        //   type: config.Type.COMPANY_INFORMATION
        // });
        // parameters.subsidiaryId = "";

        // parameters.legalname = companyInfo.getValue({
        //   fieldId: 'legalname'
        // });
        // parameters.address = companyInfo.getValue({
        //   fieldId: 'mainaddress_text'
        // });
        // parameters.pib = companyInfo.getValue({
        //   fieldId: 'employerid'
        // });
      }

      context.response.sendRedirect({
        type: http.RedirectType.SUITELET,
        identifier: "customscript_rsm_blagajna_export_su",
        id: "customdeploy_rsm_blagajna_export_su",
        parameters: parameters
      });
    }
  }

  return {
    onRequest: onRequest,
  };

});