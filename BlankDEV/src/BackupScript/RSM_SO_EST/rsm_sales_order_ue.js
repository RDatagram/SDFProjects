/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(["N/ui/serverWidget"],

  function (serverWidget) {

    function beforeLoad(context) {
      if (context.type === context.UserEventType.VIEW) {

        var form = context.form;
        var objRecord = context.newRecord;

        var arrSublists = objRecord.getSublists();
        log.debug('arrSublists', JSON.stringify(arrSublists));

        form.clientScriptModulePath = './rsm_sales_order_cs.js';

        //            form.addButton({
        //              id: 'custpage_new_so_estimate',
        //              label: 'New Estimate',
        //              functionName: 'call_new_so_estimate_su()'
        //            });

        var sublist = form.getSublist({
          //                id : 'customsublist54' // InfoStud
            id: 'customsublist36' //Blank OW
          //      id: 'customsublist18' //RSM produkcija
        });

        form.addButton({
          id: "custpage_create_estimates,",
          label: "Kreiraj rate",
          functionName: 'call_new_so_estimate_su()'
        });

        // Create pdf button
        form.addButton({
          id: 'custpage_so_create_pdf',
          label: "Kreiraj PDF fakturu",
          functionName: 'createSalesOrderPdf'
        });
        form.addButton({
          id: 'custpage_so_email',
          label: "Posalji PDF fakturu",
          functionName: 'emailSalesOrderPdf'
        });
      }
    }

    return {
      beforeLoad: beforeLoad
    };

  });
