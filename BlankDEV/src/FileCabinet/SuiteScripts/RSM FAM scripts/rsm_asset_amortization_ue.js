/**
 * @NApiVersion 2.0
 * @NScriptType UserEventScript
 * @NModuleScope Public 
 * 
 * 
 * This UserEventScript creates new field with 'RSM depreciation start date' label and populates it with
 * calculated value of asset depreciation start date. It works only in VIEW or EDIT event modes.
 * 
 * Calculation of this date depends directly on asset purchase date value and depreciation rule. 
 * If purchase date does not exit, field will not be created.
 * 
 * The script depends on custom dateUtil module and it needs to be stored in the same directory with it.
 * 
 * The script deployment is binded to FAM Asset record.
 * 
 */
define(["N/ui/serverWidget", 'N/log', './dateUtil'], function (serverWidget, log, dateUtil) {

  function beforeLoad(context) {

    if (context.type === context.UserEventType.VIEW || context.type === context.UserEventType.EDIT) {

      var dUtil = dateUtil.dateUtil;

      var record = context.newRecord;
      var purchaseDate = record.getText("custrecord_assetpurchasedate");
      var deprStartDate = record.getText("custrecord_assetdeprstartdate");
      var deprRule = record.getText("custrecord_assetdeprrules");

      if (!purchaseDate || !deprStartDate || !deprRule) {
        log.error(
          "Greska!", 
          "Ne postoji vrednost upisana u neka od sledecih polja: purchase date, deprecitaion start date, depreciation rule!"
        );
        return;
      }

      // Create new custom field for depr start date
      var dateField = context.form.addField({
        id: "custpage_amortization_start_date",
        type: serverWidget.FieldType.DATE,
        label: "RSM depreciation start date"
      });

      var resolvedDeprStartDate = dUtil.resolveDepreciationStartDate(deprRule, deprStartDate);

      dateField.defaultValue = resolvedDeprStartDate;

      if (context.type === context.UserEventType.EDIT) {
        dateField.updateDisplayType({
          displayType: serverWidget.FieldDisplayType.DISABLED
        });
      }

    } else {
      log.error('Not VIEW or EDIT event!');
    }
  }

  return {
    beforeLoad: beforeLoad,
  };

});