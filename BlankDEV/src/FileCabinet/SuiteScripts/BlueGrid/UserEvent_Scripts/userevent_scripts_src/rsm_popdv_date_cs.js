/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */

define(['N/search', 'N/format', 'N/log'], function (search, format, log) {

  // Client script entry-point function
  function pageInit(context) {
    var currentRecord = context.currentRecord;
    var period = currentRecord.getValue('postingperiod');
    if (period || period !== '') {
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

      var currentPopdvDate = currentRecord.getValue('custbody_popdv_datum');
      if (!currentPopdvDate) {
        currentRecord.setValue({
          fieldId: 'custbody_popdv_datum',
          value: endDate
        });
      } else {
        var currentDate = new Date(currentPopdvDate).getTime();
        var from = new Date(startDate).getTime();
        var to = new Date(endDate).getTime();

        var withinRange = currentDate >= from && currentDate <= to;
        if (!withinRange) {
          currentRecord.setValue({
            fieldId: 'custbody_popdv_datum',
            value: endDate
          });
        }
      }
    }
  }

  // Client script entry-point function
  function fieldChanged(context) {
    var currentRecord = context.currentRecord;
    var field = context.fieldId;
    if (field === 'postingperiod') {
      var period = currentRecord.getValue('postingperiod');

      var endDate = search.lookupFields({
        type: search.Type.ACCOUNTING_PERIOD,
        id: period,
        columns: ['enddate']
      }).enddate;

      endDate = format.parse({
        value: endDate,
        type: format.Type.DATE,
        timezone: format.Timezone.EUROPE_BUDAPEST
      });

      currentRecord.setValue({
        fieldId: 'custbody_popdv_datum',
        value: endDate
      });
    }
  }

  return {
    pageInit: pageInit,
    fieldChanged: fieldChanged
  };

});
