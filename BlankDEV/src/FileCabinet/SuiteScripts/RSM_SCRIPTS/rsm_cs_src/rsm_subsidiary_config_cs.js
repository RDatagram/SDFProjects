/**
 * @NApiVersion 2.0
 * @NScriptType ClientScript
 * @NModuleScope SameAccount 
 */
define(['N/log'],
  function (log) {

    function pageInit(context) { }

    function fieldChanged(context) {
      var currentRecord = context.currentRecord;
      var fieldChangedId = context.fieldId;

      if (fieldChangedId === 'custrecord_rsm_config_email_virtual') {
        var virtualBoolean = currentRecord.getValue({
          fieldId: 'custrecord_rsm_config_email_virtual'
        });
        if (virtualBoolean) {
          currentRecord.setValue({
            fieldId: 'custrecord_rsm_config_email_location',
            value: false
          });
          currentRecord.setValue({
            fieldId: 'custrecord_rsm_config_email_login',
            value: false
          });
        }
      }

      if (fieldChangedId === 'custrecord_rsm_config_email_location') {
        var locationBoolean = currentRecord.getValue({
          fieldId: 'custrecord_rsm_config_email_location'
        });
        if (locationBoolean) {
          currentRecord.setValue({
            fieldId: 'custrecord_rsm_config_email_virtual',
            value: false
          });
          currentRecord.setValue({
            fieldId: 'custrecord_rsm_config_email_login',
            value: false
          });
        }
        
      }

      if (fieldChangedId === 'custrecord_rsm_config_email_login') {
        var loginBoolean = currentRecord.getValue({
          fieldId: 'custrecord_rsm_config_email_login'
        });
        if (loginBoolean) {
          currentRecord.setValue({
            fieldId: 'custrecord_rsm_config_email_virtual',
            value: false
          });
          currentRecord.setValue({
            fieldId: 'custrecord_rsm_config_email_location',
            value: false
          });
        }
      }

      if (fieldChangedId === 'custrecord_rsm_config_address_from_sub') {
        var subsidiaryBoolean = currentRecord.getValue({
          fieldId: 'custrecord_rsm_config_address_from_sub'
        });
        if (subsidiaryBoolean) {
          currentRecord.setValue({
            fieldId: 'custrecord_rsm_config_address_from_loc',
            value: false
          });
        }
      }
      
      if (fieldChangedId === 'custrecord_rsm_config_address_from_loc') {
        var addressLocationBoolean = currentRecord.getValue({
          fieldId: 'custrecord_rsm_config_address_from_loc'
        });
        if (addressLocationBoolean) {
          currentRecord.setValue({
            fieldId: 'custrecord_rsm_config_address_from_sub',
            value: false
          });
        }
      }
    }

    return {
      pageInit: pageInit,
      fieldChanged: fieldChanged
    };

  });