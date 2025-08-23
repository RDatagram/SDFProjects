/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 */

define(["N/ui/serverWidget", "N/search"], function (serverWidget, search) {

  /**
   * Create and return NetSuite search.Search object
   * @param {string} dateStart 
   * @param {string} dateEnd 
   * @returns {search.Search} NetSuite search.Search object which has method run() to get search.ResultSet
   */
  function createPopdvSavedSearch(dateStart, dateEnd, subsidiaryId) {
    var dateFilter = (dateStart && dateEnd) ? ["custbody_popdv_datum", "within", dateStart, dateEnd] : ["custbody_popdv_datum", "within", "lastmonth"];

    return search.create({
      type: "transaction",
      settings: [
        {
          name: 'consolidationtype',
          value: 'NONE'
        }
      ],
      filters: [
        ["taxitem.country", "anyof", "RS"],
        "AND",
        ["taxline", "is", "F"],
        "AND",
        ["subsidiary", "anyof", subsidiaryId],
        "AND",
        ["posting", "is", "T"],
        "AND",
        dateFilter,
        'AND',
        [
          ['taxitem.custrecord_4110_import', 'is', 'F'],
          'OR',
          ['taxitem.isexport', 'is', 'F']
        ]
      ],
      columns: [
        search.createColumn({
          name: "grossamount",
          summary: "SUM"
        }),
        search.createColumn({
          name: "taxcode",
          summary: "GROUP"
        }),
        search.createColumn({
          name: "taxamount",
          summary: "SUM"
        }),
      ]
    });
  }

  /**
   * Create NetSuite serverWidget.List object and return it
   * @returns {serverWidget.List} NetSuite serverWidget.List object
   */
  function createPopdvList() {
    var list = serverWidget.createList({
      title: "POPDV List"
    });
    list.style = serverWidget.ListStyle.REPORT;
    list.clientScriptModulePath = "./popdv_list_cs.js";

    list.addButton({
      id: "exportPdf",
      label: "Export PDF",
      functionName: "exportPdf"
    });

    list.addButton({
      id: "exportXml",
      label: "Export XML",
      functionName: "exportXml"
    });
    list.addButton({
      id: 'exportXls',
      label: "Export XLS",
      functionName: "exportXls"
    });
    list.addButton({
      id: 'exportValidationXls',
      label: "Export Validation XLS",
      functionName: "exportValidation"
    });

    list.addColumn({
      id: "taxcode",
      type: serverWidget.FieldType.TEXT,
      label: "TAX ITEM",
      align: serverWidget.LayoutJustification.RIGHT
    });

    list.addColumn({
      id: "grossamount",
      type: serverWidget.FieldType.TEXT,
      label: "Amount",
      align: serverWidget.LayoutJustification.RIGHT
    });

    list.addColumn({
      id: "taxamount",
      type: serverWidget.FieldType.TEXT,
      label: "Amount (Tax)",
      align: serverWidget.LayoutJustification.RIGHT
    });

    return list;
  }

  // Suitelet entry-point function
  function onRequest(context) {
    if (context.request.method === "GET") {
      var popdvSavedSearch = createPopdvSavedSearch(
        context.request.parameters.datestart,
        context.request.parameters.dateend,
        context.request.parameters.subsidiary
      );
      var list = createPopdvList();
      var results = [];

      popdvSavedSearch.run().each(function (result) {
        var res = {};
        res["taxcode"] = result.getText({
          name: "taxcode",
          summary: search.Summary.GROUP
        });
        res["taxamount"] = result.getValue({
          name: "taxamount",
          summary: search.Summary.SUM
        });
        res["grossamount"] = result.getValue({
          name: "grossamount",
          summary: search.Summary.SUM
        });

        results.push(res);
        return true;
      });

      list.addRows({
        rows: results
      });

      context.response.writePage(list);
    } else {
      context.response.write("404");
    }
  }

  return {
    onRequest: onRequest
  };
});
