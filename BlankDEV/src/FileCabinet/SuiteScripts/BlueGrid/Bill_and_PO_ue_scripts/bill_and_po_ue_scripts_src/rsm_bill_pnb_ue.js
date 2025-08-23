/**
 * @NApiVersion 2.0
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */
define(['N/config', 'N/record', 'N/search', 'N/log'], function (config, record, search, log) {

  function afterSubmit(context) {
    if (context.type === context.UserEventType.CREATE) {

      var billRecord = record.load({
        type: record.Type.VENDOR_BILL,
        id: context.newRecord.id,
        isDynamic: true
      });

      var lineCount = billRecord.getLineCount({
        sublistId: 'purchaseorders'
      });

      if (lineCount === 1) {
        var purchaseOrderId = billRecord.getSublistValue({
          sublistId: 'purchaseorders',
          fieldId: 'id',
          line: 0
        });
        var poLookup = search.lookupFields({
          type: search.Type.PURCHASE_ORDER,
          id: purchaseOrderId,
          columns: ['custbody_rsm_po_ref_no']
        });
        var poRefNum = poLookup.custbody_rsm_po_ref_no;

        var currentTranIdValue = billRecord.getValue('tranid');

        if (poRefNum && !currentTranIdValue) {
          billRecord.setValue({
            fieldId: 'tranid',
            value: poRefNum
          });
        }
      }
      var referenceNumberValue = billRecord.getValue({
        fieldId: 'tranid'
      });
      var pozivNaBroj = billRecord.getValue({
        fieldId: 'custbody_poziv_na_broj'
      });

      if (referenceNumberValue && !pozivNaBroj) {
        billRecord.setValue({
          fieldId: 'custbody_poziv_na_broj',
          value: referenceNumberValue
        });
      }
    billRecord.save()
    } else if (context.type === context.UserEventType.EDIT) {
      var billRecord = record.load({
        type: record.Type.VENDOR_BILL,
        id: context.newRecord.id,
        isDynamic: true
      });
      var referenceNumberValue = billRecord.getValue({
        fieldId: 'tranid'
      });
      var pozivNaBroj = billRecord.getValue({
        fieldId: 'custbody_poziv_na_broj'
      });

      if (referenceNumberValue && !pozivNaBroj) {
        billRecord.setValue({
          fieldId: 'custbody_poziv_na_broj',
          value: referenceNumberValue
        });
        billRecord.save();
      }
    }
  }

  return {
    afterSubmit: afterSubmit
  };

});