/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define([],

  function () {

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

      var form = scriptContext.form;
      form.clientScriptModulePath = './rsm_so_estimate_cs.js';

      // Create pdf button
      form.addButton({
        id: 'custpage_so_est_create_pdf',
        label: "Kreiraj PDF fakturu",
        functionName: 'createSOEstPdf'
      });
      // Create email button
      form.addButton({
        id: 'custpage_so_est_email',
        label: "Posalji PDF fakturu",
        functionName: 'emailSOEstPdf'
      });
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
