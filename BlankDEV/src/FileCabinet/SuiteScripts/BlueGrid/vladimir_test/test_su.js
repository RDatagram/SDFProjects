/**
 * @NApiVersion 2.0
 * @NScriptType Suitelet
 * @NModuleScope Public 
 */
define(['N/file', 'N/search', 'N/log', 'N/record'], function (file, search, log, record) {


  function periodsSS() {
    return search.create({
      type: "accountingperiod",
      filters: [
        ["isYear", "is", "F"],
        "AND",
        ["isQuarter", "is", "F"],
        "AND",
        ['periodname', 'startswith', 'Jan']
      ],
      columns: [
        "internalid",
        "periodname",
        "startdate",
        "enddate"
      ]
    }).run().getRange(0, 1000);
  }


  function onRequest(params) {
    var period = periodsSS();

    params.response.write({
      output: JSON.stringify(period)
    });

  }

  return {
    onRequest: onRequest,
  };

});