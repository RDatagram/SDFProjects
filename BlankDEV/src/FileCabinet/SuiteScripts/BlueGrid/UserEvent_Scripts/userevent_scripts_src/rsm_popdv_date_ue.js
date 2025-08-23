/**
 * @NApiVersion 2.0
 * @NScriptType UserEventScript
 *
 *
 *
 */
define(['N/log', 'N/ui/serverWidget', 'N/ui/message', 'N/record', 'N/search', 'N/format'], function (log, serverWidget, message, record, search, format) {

  function beforeSubmit(context) {
    if (context.type === context.UserEventType.CREATE || context.type === context.UserEventType.EDIT) {
      var newRecord = context.newRecord;
      var period = newRecord.getValue('postingperiod');
      var postingPeriodDatesLF = search.lookupFields({
        type: search.Type.ACCOUNTING_PERIOD,
        id: period,
        columns: ['startdate','enddate']
      });
      var startDate = postingPeriodDatesLF.startdate;
      var endDate = postingPeriodDatesLF.enddate;

      startDate = format.parse({
        value: startDate,
        type: format.Type.DATE,
        timezone: format.Timezone.EUROPE_BUDAPEST
      });
      endDate = format.parse({
        value: endDate,
        type: format.Type.DATE,
        timezone: format.Timezone.EUROPE_BUDAPEST
      });

      var currentPopdvDate = newRecord.getValue('custbody_popdv_datum');
      if (!currentPopdvDate) { // IF POPDV DATE FIELD IS EMPTY
        newRecord.setValue({
          fieldId: 'custbody_popdv_datum',
          value: endDate
        });
      } else {
        var currentDate = new Date(currentPopdvDate).getTime();
        var from = new Date(startDate).getTime();
        var to = new Date(endDate).getTime();

        var withinRange = currentDate >= from && currentDate <= to;
        if (!withinRange) {
          newRecord.setValue({
            fieldId: 'custbody_popdv_datum',
            value: endDate
          });
        }
      }
    }
  }

  return {
    beforeSubmit: beforeSubmit
  };

});