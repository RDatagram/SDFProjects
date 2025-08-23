/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(["N/ui/serverWidget", 'N/runtime', 'N/record', 'N/query'],

  function (serverWidget, runtime, record, query) {

    function getConfigRecord(subsidiaryId) {
      var configQuery = query.runSuiteQL({
        query: "SELECT id FROM customrecord_rsm_subsidiary_config WHERE custrecord_rsm_config_subsidiary = ?",
        params: [subsidiaryId]
      });

      var configId = configQuery.results[0].values[0];

      var configRecord = record.load({
        type: 'customrecord_rsm_subsidiary_config',
        id: configId,
        isDynamic: true
      });

      return configRecord;
    }

    function getConfigRecordWithoutSubsidiaryFeature() {
      var configQuery = query.runSuiteQL({
        query: 'SELECT id FROM customrecord_rsm_subsidiary_config'
      });

      var configId = configQuery.results[0].values[0];

      var configRecord = record.load({
        type: 'customrecord_rsm_subsidiary_config',
        id: configId,
        isDynamic: true
      });

      return configRecord;
    }
    function getPdfFlag(transactionRecord) {
      var subsidiaryFeatureCheck = runtime.isFeatureInEffect({
        feature: 'SUBSIDIARIES'
      });
      var pdfFlag = true;
      if (subsidiaryFeatureCheck) {
        var subsidiaryId = transactionRecord.getValue({
          fieldId: 'subsidiary'
        });
        try {
          var configRecord = getConfigRecord(subsidiaryId);
        } catch (error) {
          pdfFlag = false;
          return pdfFlag;
        }
        var transactionTemplateSrb = configRecord.getValue({
          fieldId: 'custrecord_rsm_config_so_pdf'
        });
        var transactionTemplateIno = configRecord.getValue({
          fieldId: 'custrecord_rsm_config_so_pdf_ino'
        });

        if (transactionTemplateSrb === '' && transactionTemplateIno === '') {
          pdfFlag = false;
        }
        return pdfFlag;
      } else {
        try {
          var configRecord = getConfigRecordWithoutSubsidiaryFeature();
        } catch (error) {
          pdfFlag = false;
          return pdfFlag;
        }
        var transactionTemplateSrb = configRecord.getValue({
          fieldId: 'custrecord_rsm_config_so_pdf'
        });
        var transactionTemplateIno = configRecord.getValue({
          fieldId: 'custrecord_rsm_config_so_pdf_ino'
        });

        if (transactionTemplateSrb === '' && transactionTemplateIno === '') {
          pdfFlag = false;
        }
        return pdfFlag;
      }
    }

    function getEmailFlag(transactionRecord) {
      var subsidiaryFeatureCheck = runtime.isFeatureInEffect({
        feature: 'SUBSIDIARIES'
      });
      var emailFlag = true;
      if (subsidiaryFeatureCheck) {
        var subsidiaryId = transactionRecord.getValue({
          fieldId: 'subsidiary'
        });
        try {
          var configRecord = getConfigRecord(subsidiaryId);
        } catch (error) {
          emailFlag = false;
          return emailFlag;
        }
        var transactionTemplateSrb = configRecord.getValue({
          fieldId: 'custrecord_rsm_config_so_email'
        });
        var transactionTemplateIno = configRecord.getValue({
          fieldId: 'custrecord_rsm_config_so_email_ino'
        });

        if (transactionTemplateSrb === '' && transactionTemplateIno === '') {
          emailFlag = false;
        }
        return emailFlag;
      } else {
        try {
          var configRecord = getConfigRecordWithoutSubsidiaryFeature();
        } catch (error) {
          emailFlag = false;
          return emailFlag;
        }
        var transactionTemplateSrb = configRecord.getValue({
          fieldId: 'custrecord_rsm_config_so_email'
        });
        var transactionTemplateIno = configRecord.getValue({
          fieldId: 'custrecord_rsm_config_so_email_ino'
        });

        if (transactionTemplateSrb === '' && transactionTemplateIno === '') {
          emailFlag = false;
        }
        return emailFlag;
      }
    }

    function beforeLoad(context) {
      if (context.type === context.UserEventType.VIEW) {

        var form = context.form;
        var objRecord = context.newRecord;

        var arrSublists = objRecord.getSublists();
        log.debug('arrSublists', JSON.stringify(arrSublists));

        form.clientScriptModulePath = './rsm_sales_order_cs.js';

        //            form.addButton({
        //              id: 'custpage_new_so_estimate',
        //              label: 'New Estimate',
        //              functionName: 'call_new_so_estimate_su()'
        //            });

        var sublist = form.getSublist({
          //                id : 'customsublist54' // InfoStud
            id: 'customsublist36' //Blank OW
          //      id: 'customsublist18' //RSM produkcija
        });

        form.addButton({
          id: "custpage_create_estimates,",
          label: "Kreiraj rate",
          functionName: 'call_new_so_estimate_su()'
        });

        var pdfFlag = getPdfFlag(objRecord);
        var emailFlag = getEmailFlag(objRecord);
        if (pdfFlag) {
          // Create pdf button
          form.addButton({
            id: 'custpage_so_create_pdf',
            label: "Kreiraj PDF dokument",
            functionName: 'createSalesOrderPdf'
          });
        }
        if (emailFlag) {
          form.addButton({
            id: 'custpage_so_email',
            label: "Posalji PDF dokument",
            functionName: 'emailSalesOrderPdf'
          });
        }
      }
    }

    return {
      beforeLoad: beforeLoad
    };

  });
