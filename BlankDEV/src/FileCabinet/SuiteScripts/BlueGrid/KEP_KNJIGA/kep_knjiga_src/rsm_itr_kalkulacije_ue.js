/**
 * @NApiVersion 2.0
 * @NScriptType UserEventScript
 *
 *
 */
define(['N/record', 'N/query', 'N/log', 'N/ui/serverWidget', 'N/search', 'N/runtime'], function (record, query, log, serverWidget, search, runtime) {

  function beforeLoad(context) {
    if (context.type === context.UserEventType.CREATE) {
      var form = context.form;

      var transactionRecord = context.newRecord;

      var POCreatedFrom = transactionRecord.getValue({
        fieldId: 'createdfrom'
      });
      if (POCreatedFrom) {
        transactionRecord.setValue({
          fieldId: 'custbody_rsm_crm_ordernum',
          value: transactionRecord.getText({
            fieldId: 'createdfrom'
          })
        });
        var salesOrderLookup = search.lookupFields({
          type: search.Type.PURCHASE_ORDER,
          id: POCreatedFrom,
          columns: ['createdfrom']
        });
        if (salesOrderLookup.createdfrom[0]) {
          var salesOrderId = salesOrderLookup.createdfrom[0].value;
          var salesOrderRecord = record.load({
            type: record.Type.SALES_ORDER,
            id: salesOrderId,
            isDynamic: false
          });

          var lineCount = salesOrderRecord.getLineCount({
            sublistId: 'item'
          });
          var data = {};
          var saleRate;
          var taxCode;
          for (var i = 0; i < lineCount; i++) {
            var poCreated = salesOrderRecord.getSublistValue({
              sublistId: 'item',
              fieldId: 'createdpo',
              line: i
            });
            if (poCreated === POCreatedFrom) {
              var lineItemId = salesOrderRecord.getSublistValue({
                sublistId: 'item',
                fieldId: 'item',
                line: i
              });
              saleRate = salesOrderRecord.getSublistValue({
                sublistId: 'item',
                fieldId: 'rate',
                line: i
              });
              taxCode = salesOrderRecord.getSublistValue({
                sublistId: 'item',
                fieldId: 'taxcode',
                line: i
              });
              data[lineItemId] = {
                itemId: lineItemId,
                saleRate: saleRate,
                taxCode: taxCode
              }
            }
          }
          var itemReceiptLineCount = transactionRecord.getLineCount({
            sublistId: 'item'
          });
          for (var j = 0; j < itemReceiptLineCount; j++) {
            var itr_lineItemId = transactionRecord.getSublistValue({
              sublistId: 'item',
              fieldId: 'item',
              line: j
            });
            var taxCodeLookup = search.lookupFields({
              type: search.Type.SALES_TAX_ITEM,
              id: data[itr_lineItemId].taxCode,
              columns: ['rate']
            });
            var taxRate = parseFloat(taxCodeLookup.rate);
            transactionRecord.setSublistValue({
              sublistId: 'item',
              fieldId: 'custcol_rsm_itr_tax_code',
              line: j,
              value: data[itr_lineItemId].taxCode
            });
            transactionRecord.setSublistValue({
              sublistId: 'item',
              fieldId: 'custcol_rsm_itr_tax_rate',
              line: j,
              value: taxRate.toFixed(1) + '%'
            });
            var saleAmount, grossRate, saleGrossAmount, grossProfit, taxAmount;
            transactionRecord.setSublistValue({
              sublistId: 'item',
              fieldId: 'custcol_rsm_itr_sale_rate',
              line: j,
              value: data[itr_lineItemId].saleRate
            });
            var quantity = transactionRecord.getSublistValue({
              sublistId: 'item',
              fieldId: 'quantity',
              line: j
            });
            var rate = transactionRecord.getSublistValue({
              sublistId: 'item',
              fieldId: 'rate',
              line: j
            });
            saleAmount = quantity * data[itr_lineItemId].saleRate;
            grossRate = data[itr_lineItemId].saleRate + (data[itr_lineItemId].saleRate * taxRate / 100);
            saleGrossAmount = grossRate * quantity;
            grossProfit = data[itr_lineItemId].saleRate - rate;
            taxAmount = saleAmount * taxRate / 100;

            transactionRecord.setSublistValue({
              sublistId: 'item',
              fieldId: 'custcol_rsm_itr_sale_amount',
              value: parseFloat(saleAmount).toFixed(2),
              line: j
            });
            transactionRecord.setSublistValue({
              sublistId: 'item',
              fieldId: 'custcol_rsm_itr_gross_rate',
              value: parseFloat(grossRate).toFixed(2),
              line: j
            });
            transactionRecord.setSublistValue({
              sublistId: 'item',
              fieldId: 'custcol_rsm_itr_sale_gross_amount',
              value: parseFloat(saleGrossAmount).toFixed(2),
              line: j
            });
            transactionRecord.setSublistValue({
              sublistId: 'item',
              fieldId: 'custcol_rsm_itr_gross_profit',
              value: parseFloat(grossProfit).toFixed(2),
              line: j
            });
            transactionRecord.setSublistValue({
              sublistId: 'item',
              fieldId: 'custcol_rsm_itr_tax_amount',
              value: parseFloat(taxAmount).toFixed(2),
              line: j
            });
          }
        }
      }
    } else if (context.type === context.UserEventType.VIEW) {
      var form = context.form;

      form.clientScriptModulePath= './rsm_itr_kalkulacije_cs.js';

      var button1 = form.addButton({
        id: 'custpage_create_kalkulacije_pdf',
        label: "Kreiraj PDF dokument",
        functionName: 'createKalkulacijePDF'
      });

    }
  }

  return {
    beforeLoad: beforeLoad
  };

});