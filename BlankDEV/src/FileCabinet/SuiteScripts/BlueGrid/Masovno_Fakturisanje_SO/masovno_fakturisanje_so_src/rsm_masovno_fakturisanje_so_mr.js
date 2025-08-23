/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 * 
 * Masovno Fakturisanje Sales Order-a
 * Get all the Sales Order and transform them into Invoices if its past their "End date"
 */
define(['./rsm_masovno_fakturisanje_util', 'N/record', 'N/search', 'N/file', 'N/runtime', 'N/util', 'N/log', 'N/https', 'N/url', 'N/query', 'N/format'], function (rsm_masovno_fakturisanje_util, record, search, file, runtime, util, log, https, url, query, format) {

  // Get all the required Sales Orders that need to be transformed into Invoices taking into account the subsidiary parameter of the M/R script
  function getInputData() {
    var subsidiary = runtime.getCurrentScript().getParameter({ name: "custscriptsubsidiary" });
    var toBeTransformed = rsm_masovno_fakturisanje_util.getCandidateList(subsidiary);
    // log.debug("toBeTransformed", toBeTransformed);
    return toBeTransformed;
  }

  function map(context) {
    try {

      // Transform from Sales Order into Invoice
      var invoiceRecord = record.transform({
        fromType: "salesorder",
        fromId: JSON.parse(context.value).id,
        toType: "invoice",
        isDynamic: true
      });

      // "trandate" za invoice je "enddate" iz SO
      invoiceRecord.setValue('trandate', format.parse({
        value: JSON.parse(context.value).values.enddate,
        type: format.Type.DATE
      }));

      invoiceRecord.save()

    } catch (e) {
      log.error('MAP ERROR', e);
    }
  }

  function summarize(summary) {
    log.audit('Usage', summary.usage);
    log.audit('Seconds', summary.seconds);
    log.audit('Yields', summary.yields);
  }

  return {
    getInputData: getInputData,
    map: map,
    summarize: summarize
  };

});