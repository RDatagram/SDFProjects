/**
 * @NApiVersion 2.0
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */
define(['N/config', 'N/record', 'N/search', 'N/log'], function (config, record, search, log) {

  function beforeSubmit(context) {
    if (context.type === context.UserEventType.CREATE || context.type === context.UserEventType.EDIT) {

      var poRecord = context.newRecord;
      var referenceNumberValue = poRecord.getValue({
        fieldId: 'custbody_rsm_po_ref_no'
      });

      var pozivNaBroj = poRecord.getValue({
        fieldId: 'custbody_poziv_na_broj'
      })

      if (referenceNumberValue && !pozivNaBroj) {
        poRecord.setValue({
          fieldId: 'custbody_poziv_na_broj',
          value: referenceNumberValue
        });
      }
    }
  }

  return {
    beforeSubmit: beforeSubmit
  };

});