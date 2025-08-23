/**
 * @NApiVersion 2.0
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
define(
  ['N/record', 'N/runtime', 'N/query', 'N/task', 'N/format', './util_courier', 'N/search'],

  function (record, runtime, query, task, format, util_courier, searchModule) {

    function getInputData() {

      var scriptObj = runtime.getCurrentScript();
      var idHeader = scriptObj.getParameter({ "name": 'custscript_rsm_courier_mr_param1' });
      var myOptions = {};

      var look = searchModule.lookupFields({
        type: 'customrecord_rsm_csdh',
        id: idHeader,
        columns: ['custrecord_rsm_csdh_file', 'custrecord_rsm_csdh_subsidiary']
      });

      myOptions.fileId = look.custrecord_rsm_csdh_file[0].value;
      myOptions.subsidiary = look.custrecord_rsm_csdh_subsidiary[0].value;

      var outputArray = [];

      outputArray = util_courier.csv_parser(myOptions);

      return outputArray;
    }

    function map(context) {

      var resData = JSON.parse(context.value);

      var dateAndTimeDelivery = resData.deliveryDate.split(' ');
      var deliveryDate = dateAndTimeDelivery[0]; // Get only date from date and time

      var dateAndTimePayment = resData.paymentDate.split(' ');
      var paymentDate = dateAndTimePayment[0]; // Get only date from date and time

      var data = {
        index: resData.index,
        parcelId: resData.parcelId,
        deliveryDate: deliveryDate,
        paymentDate: paymentDate,
        payerName: resData.payerName,
        payerAddress: resData.payerAddress,
        amount: resData.amount,
        recipientName: resData.recipientName,
        recipientCity: resData.recipientCity,
        refClient: resData.refClient,
        refRecipient: resData.refRecipient,
        regionFrom: resData.regionFrom,
        regionTo: resData.regionTo
      }

      context.write({
        key: data.index,
        value: data
      });
    }

    function summarize(summary) {

      var scriptObj = runtime.getCurrentScript();
      var headerId = scriptObj.getParameter({ "name": 'custscript_rsm_courier_mr_param1' });

      var headerRecord = record.load({
        type: "customrecord_rsm_csdh",
        id: headerId,
        isDynamic: true
      });

      summary.output.iterator().each(function (key, value) {

        var transaction = JSON.parse(value);

        headerRecord.selectNewLine({
          sublistId: 'recmachcustrecord_rsm_csdl_csdh'
        });

        headerRecord.setCurrentSublistValue({
          sublistId: 'recmachcustrecord_rsm_csdl_csdh',
          fieldId: 'custrecord_rsm_csdl_parcel_id',
          value: transaction.parcelId
        });

        headerRecord.setCurrentSublistValue({
          sublistId: 'recmachcustrecord_rsm_csdl_csdh',
          fieldId: 'custrecord_rsm_csdl_date_del',
          value: format.parse({
            value : transaction.deliveryDate,
            type : format.Type.DATE,
            timezone : format.Timezone.EUROPE_BUDAPEST
          })
        });

        headerRecord.setCurrentSublistValue({
          sublistId: 'recmachcustrecord_rsm_csdl_csdh',
          fieldId: 'custrecord_rsm_csdl_date_pay',
          value: format.parse({
            value : transaction.paymentDate,
            type : format.Type.DATE,
            timezone : format.Timezone.EUROPE_BUDAPEST
          })
        });

        headerRecord.setCurrentSublistValue({
          sublistId: 'recmachcustrecord_rsm_csdl_csdh',
          fieldId: 'custrecord_rsm_csdl_name_pay',
          value: transaction.payerName
        });

        headerRecord.setCurrentSublistValue({
          sublistId: 'recmachcustrecord_rsm_csdl_csdh',
          fieldId: 'custrecord_rsm_csdl_address_pay',
          value: transaction.payerAddress
        });

        headerRecord.setCurrentSublistValue({
          sublistId: 'recmachcustrecord_rsm_csdl_csdh',
          fieldId: 'custrecord_rsm_csdl_amount',
          value: transaction.amount
        });

        headerRecord.setCurrentSublistValue({
          sublistId: 'recmachcustrecord_rsm_csdl_csdh',
          fieldId: 'custrecord_rsm_csdl_rec_name',
          value: transaction.recipientName
        });

        headerRecord.setCurrentSublistValue({
          sublistId: 'recmachcustrecord_rsm_csdl_csdh',
          fieldId: 'custrecord_rsm_csdl_rec_city',
          value: transaction.recipientCity
        });

        headerRecord.setCurrentSublistValue({
          sublistId: 'recmachcustrecord_rsm_csdl_csdh',
          fieldId: 'custrecord_rsm_csdl_ref_client',
          value: transaction.refClient
        });
        headerRecord.setCurrentSublistValue({
          sublistId: 'recmachcustrecord_rsm_csdl_csdh',
          fieldId: 'custrecord_rsm_csdl_ref_rec',
          value: transaction.refRecipient
        });

        headerRecord.setCurrentSublistValue({
          sublistId: 'recmachcustrecord_rsm_csdl_csdh',
          fieldId: 'custrecord_rsm_csdl_reg_from',
          value: transaction.regionFrom
        });

        headerRecord.setCurrentSublistValue({
          sublistId: 'recmachcustrecord_rsm_csdl_csdh',
          fieldId: 'custrecord_rsm_csdl_reg_to',
          value: transaction.regionTo
        });

        headerRecord.commitLine({
          sublistId: 'recmachcustrecord_rsm_csdl_csdh'
        });

        return true;

      });

      headerRecord.save();

      /* log.audit('inputSummary:Usage', summary.inputSummary.usage);
      log.audit('inputSummary:Seconds', summary.inputSummary.seconds);
      log.audit('inputSummary:Yields', summary.inputSummary.yields);
      log.error('inputSummary:Error', summary.inputSummary.error);

      log.audit('mapSummary:Usage', summary.mapSummary.usage);
      log.audit('mapSummary:Seconds', summary.mapSummary.seconds);
      log.audit('mapSummary:Yields', summary.mapSummary.yields);
      log.error('mapSummary:Errors', summary.mapSummary.errors);

      log.audit('reduceSummary:Usage', summary.reduceSummary.usage);
      log.audit('reduceSummary:Seconds', summary.reduceSummary.seconds);
      log.audit('reduceSummary:Yields', summary.reduceSummary.yields);
      log.error('reduceSummary:Errors', summary.reduceSummary.errors);

      log.audit('Usage', summary.usage);
      log.audit('Seconds', summary.seconds);
      log.audit('Yields', summary.yields); */

    }

    return {
      getInputData: getInputData,
      map: map,
      summarize: summarize
    };

  });