/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/query', 'N/runtime', 'N/record'],

  function (query, runtime, record) {

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
          fieldId: 'custrecord_rsm_config_so_est_pdf'
        });
        var transactionTemplateIno = configRecord.getValue({
          fieldId: 'custrecord_rsm_config_so_est_pdf_ino'
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
          fieldId: 'custrecord_rsm_config_so_est_pdf'
        });
        var transactionTemplateIno = configRecord.getValue({
          fieldId: 'custrecord_rsm_config_so_est_pdf_ino'
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
          fieldId: 'custrecord_rsm_config_so_est_email'
        });
        var transactionTemplateIno = configRecord.getValue({
          fieldId: 'custrecord_rsm_config_so_est_email_ino'
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
          fieldId: 'custrecord_rsm_config_so_est_email'
        });
        var transactionTemplateIno = configRecord.getValue({
          fieldId: 'custrecord_rsm_config_so_est_email_ino'
        });

        if (transactionTemplateSrb === '' && transactionTemplateIno === '') {
          emailFlag = false;
        }
        return emailFlag;
      }
    }

    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {string} scriptContext.type - Trigger type
     * @param {Form} scriptContext.form - Current form
     * @Since 2015.2
     */
    function beforeLoad(scriptContext) {
      if (scriptContext.type === scriptContext.UserEventType.VIEW) {
        var form = scriptContext.form;
        form.clientScriptModulePath = './rsm_so_estimate_cs.js';

        var soeRecord = scriptContext.newRecord;

        var pdfFlag = getPdfFlag(soeRecord);
        var emailFlag = getEmailFlag(soeRecord);

        if (pdfFlag) {
          // Create pdf button
          form.addButton({
            id: 'custpage_so_est_create_pdf',
            label: "Kreiraj PDF dokument",
            functionName: 'createSOEstPdf'
          });
        }
        if (emailFlag) {
          // Create email button
          form.addButton({
            id: 'custpage_so_est_email',
            label: "Posalji PDF dokument",
            functionName: 'emailSOEstPdf'
          });
        }
      }
    }

    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {Record} scriptContext.oldRecord - Old record
     * @param {string} scriptContext.type - Trigger type
     * @Since 2015.2
     */
    function beforeSubmit(scriptContext) {

    }

    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {Record} scriptContext.oldRecord - Old record
     * @param {string} scriptContext.type - Trigger type
     * @Since 2015.2
     */
    function afterSubmit(scriptContext) {

    }

    return {
      beforeLoad: beforeLoad
      //        beforeSubmit: beforeSubmit,
      //        afterSubmit: afterSubmit
    };

  });
