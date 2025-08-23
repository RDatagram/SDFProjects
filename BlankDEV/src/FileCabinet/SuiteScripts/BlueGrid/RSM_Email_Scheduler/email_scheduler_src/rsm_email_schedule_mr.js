/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 * 
 * Email Scheduler
 * Get all the records and their data and then send it to the specific restlets to be emailed as PDFs 
 */
define(['N/record', 'N/search', 'N/file', 'N/runtime', 'N/util', 'N/log', 'N/https', './rsm_email_sch_util'], function (record, search, file, runtime, util, log, https, rsm_email_sch_util) {

  // Get the transaction type from the parameters of the deployment script to narrow down the search and set other required variables
  var script = runtime.getCurrentScript();
  var recordType = script.getParameter({ name: 'custscript_rsm_email_schedule_ttype' });
  var transactionBodyFieldEmailStatus = rsm_email_sch_util.mapRecordStatus(recordType);

  function getInputData() {

    var toBeSent = rsm_email_sch_util.createMailList(recordType, transactionBodyFieldEmailStatus);

    return toBeSent;
  }

  function map(context) {
    try {

      function callRestlet(restletIds, data) {
        var myHeaders = [];
        myHeaders['Content-type'] = 'application/json';

        var response = https.requestRestlet({
          scriptId: restletIds.scriptId,
          deploymentId: restletIds.deploymentId,
          method: 'POST',
          headers: myHeaders,
          body: JSON.stringify(data)
        });

        // Log restlet response
        log.error('Function callRestlet log', "restletIds: " + JSON.stringify(restletIds) + " ,JSON.parse(response.body): " + JSON.stringify(response.body));
      }

      // Check if the record has a PDF file attached to it
      if (JSON.parse(context.value).values.custbody_cust_dep_pdf_file.length) {

        var currentInternalId = JSON.parse(context.value).values.internalid[0].value;

        if (recordType === "invoice") {
          callRestlet({ scriptId: 'customscript_rsm_invoice_rl', deploymentId: 'customdeploy_rsm_invoice_rl' },
            {
              action: 'emailpdf',
              invoiceId: currentInternalId
            });
        } else if (recordType === "customerdeposit") {
          callRestlet({ scriptId: 'customscript_rsm_cust_dep_rl', deploymentId: 'customdeploy_rsm_cust_dep_rl' },
            {
              action: 'emailpdf',
              custDepId: currentInternalId
            });
        } else if (recordType === "creditmemo") {
          callRestlet({ scriptId: 'customscript_rsm_credit_memo_rl', deploymentId: 'customdeploy_rsm_credit_memo_rl' },
            {
              action: 'emailpdf',
              data: {
                creditMemoId: currentInternalId
              }
            });
        } else if (recordType === "salesorder") {
          callRestlet({ scriptId: 'customscript_rsm_sales_order_rl', deploymentId: 'customdeploy_rsm_sales_order_rl' },
            {
              action: 'emailpdf',
              salesOrderId: currentInternalId
            });
        } else if (recordType === "customsale_rsm_so_estimate") {
          callRestlet({ scriptId: 'customscript_rsm_so_estimate_rl', deploymentId: 'customdeploy_rsm_so_estimate_rl' },
            {
              action: 'emailpdf',
              soEstId: currentInternalId
            });
        }

      } else {
        log.error("Erorr", "There is no PDF file attached to this record: " + JSON.parse(context.value).values.internalid[0].value + ", skipping.");
      }

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