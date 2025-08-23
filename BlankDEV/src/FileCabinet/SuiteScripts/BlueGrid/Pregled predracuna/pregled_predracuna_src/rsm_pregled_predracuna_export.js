/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/file', 'N/encode', 'N/render', 'N/log', 'N/query'], function (record, file, encode, render, log, query) {

  function getDataRecordsCount() {
    var dataQuery = query.runSuiteQL({
      query: 'SELECT COUNT(id) FROM customrecord_rsm_so_list_data'
    });
    dataQuery.results[0].values[0];
  }

  /**
   * Generate xls file and return it as N/File type
   * @param {object} params Suitelet request parameters (type, from, to)
   * @param {object} data data object representing KIF/KUF transactions grouped by tax code
   * @returns {file.File} NetSuite file.File object of EXCEL type
   */
  function createXlsFile(jsonData) {

    var xmlTemplate = file.load({ id: './predracuni_templates/pregled_predracuna_excel_template.xml' });
    var content = xmlTemplate.getContents();

    var templateRenderer = render.create();
    templateRenderer.templateContent = content;

    templateRenderer.addCustomDataSource({
      format: render.DataSource.JSON,
      alias: "JSON",
      data: JSON.stringify(jsonData)
    });

    var xmlString = templateRenderer.renderAsString();

    // Create and return file
    var xlsFile = file.create({
      name: jsonData.subsidiaryName + '_' + jsonData.dateFrom + '_' + jsonData.dateTo + '_' + jsonData.customerName + ".xls",
      fileType: file.Type.EXCEL,
      contents: encode.convert({
        string: xmlString,
        inputEncoding: encode.Encoding.UTF_8,
        outputEncoding: encode.Encoding.BASE_64
      })
    });
    return xlsFile;
  }

  // Suitelet entry point function
  function onRequest(context) {
    if (context.request.method === "GET") {

      var action = context.request.parameters.action;

      if (action === 'AllCustomers') {

        var dataRecordsCount = getDataRecordsCount();
        if (dataRecordsCount === 0) {
          context.response.write('404');
        }
        var dataFile = file.load({
          id: './output_data/predracuni_svi.json'
        });
        var dataArray = JSON.parse(dataFile.getContents());

        var dataQuery = query.runSuiteQL({
          query: 'SELECT custrecord_date_time_created, custrecord_so_data_date_from, custrecord_so_data_date_to, custrecord_so_data_subsidiary_name FROM customrecord_rsm_so_list_data WHERE custrecord_customer_id IS Null',
        });

        var createdAt = dataQuery.results[0].values[0];
        var dateFrom = dataQuery.results[0].values[1];
        var dateTo = dataQuery.results[0].values[2];
        var subsidiaryName = dataQuery.results[0].values[3];
        var customerName = 'Svi'

        var jsonData = { "dataArray": dataArray, "createdAt": createdAt, "dateFrom": dateFrom, "dateTo": dateTo, "subsidiaryName": subsidiaryName, "customerName": customerName };

      } else {
        var customerId = context.request.parameters.customer;

        var dataQuery = query.runSuiteQL({
          query: 'SELECT id, custrecord_description, custrecord_date_time_created, custrecord_so_data_date_from, custrecord_so_data_date_to, custrecord_so_data_subsidiary_name FROM customrecord_rsm_so_list_data WHERE custrecord_customer_id =?',
          params: [customerId]
        });

        var dataRecordId = dataQuery.results[0].values[0];
        var customerName = dataQuery.results[0].values[1];
        var createdAt = dataQuery.results[0].values[2];
        var dateFrom = dataQuery.results[0].values[3];
        var dateTo = dataQuery.results[0].values[4];
        var subsidiaryName = dataQuery.results[0].values[5];

        var dataRecord = record.load({
          type: 'customrecord_rsm_so_list_data',
          id: dataRecordId,
          isDynamic: true
        });

        var fileId = dataRecord.getValue({
          fieldId: 'custrecord_file_data'
        });

        var dataFile = file.load({
          id: fileId
        });

        var dataArray = JSON.parse(dataFile.getContents());

        var jsonData = {"dataArray": dataArray, "createdAt": createdAt, "dateFrom": dateFrom, "dateTo": dateTo, "subsidiaryName": subsidiaryName, "customerName": customerName};
      }
      log.debug("DATA", JSON.stringify(jsonData));
      var xlsFile = createXlsFile(jsonData);
      context.response.writeFile(xlsFile);

    } else {
      context.response.write("404");
    }
  }

  return {
    onRequest: onRequest
  };

});
