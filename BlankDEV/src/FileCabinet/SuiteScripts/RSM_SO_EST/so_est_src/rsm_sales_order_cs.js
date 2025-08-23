/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/currentRecord', 'N/record', 'N/ui/message', 'N/url', 'N/https', 'N/log'],
  function (currentRecord, record, message, url, https, log) {

    var msgTypes = {
      'confirmation': message.Type.CONFIRMATION,
      'information': message.Type.INFORMATION,
      'warning': message.Type.WARNING,
      'error': message.Type.ERROR
    };

    /**
     * Helper function to call certain resltet with passed data parameter
     * @param {object} data 
     * @param {string} errorMessageTitle
     */
    function _callRestlet(data, errorMessageTitle) {
      // Call restlet here
      var restletUrl = url.resolveScript({
        scriptId: 'customscript_rsm_sales_order_rl',
        deploymentId: 'customdeploy_rsm_sales_order_rl'
      });

      // Generate request headers
      var headers = new Array();
      headers['Content-type'] = 'application/json';

      // https POST call - returns promise object
      https.post.promise({
        url: restletUrl,
        headers: headers,
        body: data
      }).then(function (response) {
        var res = JSON.parse(response.body);
        message.create({
          type: msgTypes[res.message.type],
          title: res.message.title,
          message: res.message.message,
          duration: res.message.duration || 5000
        }).show();
      }).catch(function (err) {
        log.error(errorMessageTitle, "Error message: " + err);
      });
    }

    /**
     * Function to be executed after page is initialized.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
     *
     * @since 2015.2
     */
    function pageInit(scriptContext) {
      console.log('SalesOrderCS');
    }

    function _call_new_so_estimate_su() {
      //alert("Restlet will be executed");

      var myAction = { "action": "create" };

      var cRec = currentRecord.get();

      var restUrl = url.resolveScript({
        scriptId: 'customscript_rsm_create_so_estimate_rl', // RESTlet scriptId
        deploymentId: 'customdeploy_rsm_create_so_estimate_rl' // RESTlet deploymentId
      });

      // Generate request headers
      var headers = new Array();
      headers['Content-type'] = 'application/json';

      // Perform HTTP POST call
      var restReq = https.post({
        url: restUrl,
        headers: headers,
        body: {
          idSO: cRec.id,
          action: myAction
        }
      });

      var jsRes = JSON.parse(restReq.body);
      //    	var httpUrl = url.resolveRecord({
      //    	    recordType: 'customsale_rsm_so_estimate',
      //    	    recordId: jsRes.soeId,
      //    	    isEditMode: true
      //    	});
      //		var  = "https://tstdrv2176673.app.netsuite.com/app/accounting/transactions/cutrsale.nl?e=T&customtype=120&whence=&"+"id="+jsRes.soeId;
      //		window.open(httpUrl, "_blank")
      alert("SOE created");
      window.location.reload(true);
      return true;
    }

    /**
     * Calls resltet with params to create sales order pdf invoice
     */
    function createSalesOrderPdf() {
      message.create({
        type: msgTypes['information'],
        title: "Akcija",
        message: "Kreiranje PDF fakture je u toku...",
        duration: 5000
      }).show();

      // Get current record field values as params
      var currRec = currentRecord.get();
      var loadedRecord = record.load({
        type: currRec.type,
        id: currRec.id
      });

      var data = {
        action: 'createpdf',
        salesOrderId: currRec.id,
        location: loadedRecord.getText('location')
      };

      // Call restlet here
      _callRestlet(data, "Error during sales order PDF creation");
    }

    /**
     * Calls restlet with parameters to email credit memo pdf invoice
     */
    function emailSalesOrderPdf() {
      if (confirm("Da li ste sigurni da zelite da posaljete PDF fakturu?")) {
        message.create({
          type: msgTypes['information'],
          title: "Akcija",
          message: "Slanje PDF fakture preko Email-a je u toku...",
          duration: 5000
        }).show();

        // Get current record field values as params
        var currRec = currentRecord.get();
        var loadedRecord = record.load({
          type: currRec.type,
          id: currRec.id
        });

        // Call restlet with approprate params
        data = {
          action: 'emailpdf',
          salesOrderId: currRec.id,
          location: loadedRecord.getText('location')
        };

        // Call restlet here
        _callRestlet(data, "Could not send email!");
      }
    }

    return {
      pageInit: pageInit,
      call_new_so_estimate_su: _call_new_so_estimate_su,
      createSalesOrderPdf: createSalesOrderPdf,
      emailSalesOrderPdf: emailSalesOrderPdf
    };

  });
