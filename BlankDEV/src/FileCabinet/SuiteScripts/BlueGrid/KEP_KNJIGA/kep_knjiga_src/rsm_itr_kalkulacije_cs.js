/**
 * @NApiVersion 2.0
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/ui/message', 'N/url', 'N/https', 'N/log', 'N/currentRecord', 'N/search', 'N/record'],
  function (message, url, https, log, currentRecord, search, record) {

    var msgTypes = {
      'confirmation': message.Type.CONFIRMATION,
      'information': message.Type.INFORMATION,
      'warning': message.Type.WARNING,
      'error': message.Type.ERROR
    };

    function pageInit(context) {
    }

    function fieldChanged(context) {
      var currRec = currentRecord.get();
      var sublistId = context.sublistId;
      var fieldId = context.fieldId;
      var lineChanged = context.line;

      if (sublistId === 'item' && fieldId === 'custcol_rsm_itr_tax_code') {
        var currentTaxCodeId = currRec.getSublistValue({
          sublistId: 'item',
          fieldId: 'custcol_rsm_itr_tax_code',
          line: lineChanged
        });
        if (currentTaxCodeId) {
          var taxCodeLookup = search.lookupFields({
            type: search.Type.SALES_TAX_ITEM,
            id: currentTaxCodeId,
            columns: ['rate']
          });
          currRec.selectLine({
            sublistId: 'item',
            line: lineChanged
          });
          currRec.setCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'custcol_rsm_itr_tax_rate',
            value: (parseFloat(taxCodeLookup.rate)).toFixed(1) + '%',
          });
        }
      } else if (sublistId === 'item' && (fieldId === 'quantity' || fieldId === 'custcol_rsm_itr_sale_rate')) {
        var taxRateWithPercent = currRec.getSublistValue({
          sublistId: 'item',
          fieldId: 'custcol_rsm_itr_tax_rate',
          line: lineChanged
        });
        var saleRate = currRec.getSublistValue({
          sublistId: 'item',
          fieldId: 'custcol_rsm_itr_sale_rate',
          line: lineChanged
        });
        var rate = currRec.getSublistValue({
          sublistId: 'item',
          fieldId: 'rate',
          line: lineChanged
        });
        if (taxRateWithPercent && saleRate && rate) {
          var saleAmount, grossRate, saleGrossAmount, grossProfit, taxAmount;
          var taxRate = parseFloat(taxRateWithPercent);
          var quantity = currRec.getSublistValue({
            sublistId: 'item',
            fieldId: 'quantity',
            line: lineChanged
          });
          saleAmount = quantity * saleRate;
          grossRate = saleRate + (saleRate * taxRate / 100);
          saleGrossAmount = grossRate * quantity;
          grossProfit = saleRate - rate;
          taxAmount = saleAmount * taxRate / 100;
          currRec.selectLine({
            sublistId: 'item',
            line: lineChanged
          });
          currRec.setCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'custcol_rsm_itr_sale_amount',
            value: parseFloat(saleAmount).toFixed(2)
          });
          currRec.setCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'custcol_rsm_itr_gross_rate',
            value: parseFloat(grossRate).toFixed(2)
          });
          currRec.setCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'custcol_rsm_itr_sale_gross_amount',
            value: parseFloat(saleGrossAmount).toFixed(2)
          });
          currRec.setCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'custcol_rsm_itr_tax_amount',
            value: parseFloat(taxAmount).toFixed(2)
          });
          currRec.setCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'custcol_rsm_itr_gross_profit',
            value: parseFloat(grossProfit).toFixed(2)
          });
        }
      }
    }

    function createKalkulacijePDF() {
      message.create({
        type: msgTypes['information'],
        title: "Akcija",
        message: "Kreiranje PDF dokumenta prijemnice je u toku...",
        duration: 5000
      }).show();

      // Get current record
      var currRec = currentRecord.get();

      // Prepare restlet parameters
      var data = {
        action: 'createkalkulacijapdf',
        transactionId: currRec.id,

      };

      callRestlet(data, {
        scriptId: 'customscript_rsm_itr_kalkulacije_rl',
        deploymentId: 'customdeploy_rsm_itr_kalkulacije_rl'
      }, "Greska prilikom generisanja PDF dokumenta prijemnice!");
    }

    function callRestlet(data, restletIds, errorMessageTitle) {
      // Resolve restlet url
      var restletUrl = url.resolveScript({
        scriptId: restletIds.scriptId,
        deploymentId: restletIds.deploymentId
      });

      // Generate request headers
      var headers = new Array();
      headers['Content-type'] = 'application/json';

      // https POST request - returns promise object
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

    return {
      pageInit: pageInit,
      fieldChanged: fieldChanged,
      createKalkulacijePDF: createKalkulacijePDF
    };

  });