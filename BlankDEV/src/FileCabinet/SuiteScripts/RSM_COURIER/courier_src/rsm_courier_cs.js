/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/currentRecord', 'N/ui/message', 'N/url', 'N/https'],

  function (record, message, url, https) {

    function pageInit(scriptContext) {
      console.log('pageInit');
    }

    function callRestlet(data) {
      var restletUrl = url.resolveScript({
        scriptId: 'customscript_rsm_courier_rl',
        deploymentId: 'customdeploy_rsm_courier_rl'
      });

      // generate request headers
      var headers = new Array();
      headers['Content-type'] = 'application/json';

      // https POST cal
      var response = https.post({
        url: restletUrl,
        headers: headers,
        body: data
      });
      return JSON.parse(response.body);
    }

    function _submit_parser() {
      var currentRecord = record.get();
      console.log('ID CURRENT RECORDA:  ' + currentRecord.id);
      var data = {
        idHeader : currentRecord.id,
        action: "parser"
      }
      var jsonResponse = callRestlet(data);

      var myMsg = message.create({
        title: "Result",
        message: "Pokrenuta procedura PARSIRANJA",
        type: message.Type.CONFIRMATION
      });
      // will disappear after 5s
      myMsg.show({
        duration: 5000
      });

      window.location.reload(true);

    }

    function _submit_payments() {
      var currentRecord = record.get();
      var data = {
        idHeader : currentRecord.id,
        action: "payments"
      }

      var jsonResponse = callRestlet(data);

      var myMsg = message.create({
        title: "Result",
        message: "Pokrenuta procedura generisanja Payments",
        type: message.Type.CONFIRMATION
      });
      // will disappear after 5s
      myMsg.show({
        duration: 5000
      });

      window.location.reload(true);

    }

    function _submit_lookup() {
      var currentRecord = record.get();
      var data = {
        idHeader : currentRecord.id,
        action: "lookup"
      }

      var jsonResponse = callRestlet(data);

      var myMsg = message.create({
        title: "Result",
        message: "Pokrenuta procedura POVEZIVANJA",
        type: message.Type.CONFIRMATION
      });
      // will disappear after 5s
      myMsg.show({
        duration: 5000
      });

      window.location.reload(true);

    }

    function _submit_rollback() {
      var currentRecord = record.get();
      var data = {
        idHeader : currentRecord.id,
        action: "rollback"
      }

      var jsonResponse = callRestlet(data);

      var myMsg = message.create({
        title: "Result",
        message: "Pokrenuta procedura PONISTAVANJA",
        type: message.Type.CONFIRMATION
      });
      // will disappear after 5s
      myMsg.show({
        duration: 5000
      });

      window.location.reload(true);

    }

    function _submit_refresh() {
      window.location.reload(true);
    }

    return {
      pageInit: pageInit,
      submit_parser: _submit_parser,
      submit_payments: _submit_payments,
      submit_lookup: _submit_lookup,
      submit_refresh: _submit_refresh,
      submit_rollback: _submit_rollback
    };

  });
