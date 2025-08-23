/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 */
define(['N/task', 'N/log', 'N/search', 'N/record', 'N/url', 'N/render', 'N/query', 'N/file'], function (task, log, search, record, url, render, query, file) {

  function getDataRecordsCount() {
    var dataQuery = query.runSuiteQL({
      query: 'SELECT COUNT(id) FROM customrecord_rsm_so_list_data'
    });
    dataQuery.results[0].values[0];
  }

  function getSOSavedSearch() {
    var salesorderSearchObj = search.create({
      type: "salesorder",
      filters:
        [
          ["type", "anyof", "SalesOrd"],
          "AND",
          ["mainline", "is", "F"],
          "AND",
          ["taxline", "is", "F"],
          "AND",
          ["shipping", "is", "F"]
        ],
      columns:
        [
          search.createColumn({
            name: "amount",
            summary: "SUM",
            label: "Amount"
          }),
          search.createColumn({
            name: "internalid",
            summary: "GROUP",
            label: "Internal ID"
          })
        ]
    });
    return salesorderSearchObj;
  }

  function post(requestBody) {

    if (requestBody.action === 'runscript') {
      ;
      var script = { scriptId: 'customscript_rsm_pregled_predracuna_mr',
        deploymentId: 'customdeploy_rsm_pregled_predracuna_mr' }

      var dynamicParams = {
        custscript_pregled_predracuna_subsidiary: requestBody.subsidiary,
        custscript_pregled_predracuna_datefrom: requestBody.datefrom,
        custscript_pregled_predracuna_dateto: requestBody.dateto,
        custscript_pp_subsidiary_name: requestBody.subsidiaryname

      };
      var mrTask = task.create({
        taskType: task.TaskType.MAP_REDUCE
      });
      mrTask.scriptId = script.scriptId;
      mrTask.deploymentId = script.deploymentId;
      mrTask.params = dynamicParams;
      var mrTaskId = mrTask.submit();

      // Response object
      return {
        "mrtaskid": mrTaskId
      };

    } else if (requestBody.action === 'checkstatus') {
      var summary = task.checkStatus({
        taskId: requestBody.taskid
      });

      // Response object
      return {
        "status": summary.status,
        "stage": summary.stage
      }
    } else if (requestBody.action === 'gethtml') {

      var customerId = requestBody.customer;

      var dataQuery = query.runSuiteQL({
        query: 'SELECT id, custrecord_date_time_created, custrecord_so_data_date_from, custrecord_so_data_date_to, custrecord_so_data_subsidiary_name FROM customrecord_rsm_so_list_data WHERE custrecord_customer_id =?',
        params: [customerId]
      });

      if (dataQuery.results.length === 0) {
        var returnString = '';
        return {
          "htmlstring": returnString
        }
      }

      var dataRecordId = dataQuery.results[0].values[0];
      var createdAt = dataQuery.results[0].values[1];
      var dateFrom = dataQuery.results[0].values[2];
      var dateTo = dataQuery.results[0].values[3];
      var subsidiaryName = dataQuery.results[0].values[4];
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

      var htmlTemplate = file.load({ id: './predracuni_templates/pregled_predracuna_html_template.html' });

      var content = htmlTemplate.getContents();

      var templateRenderer = render.create();
      templateRenderer.templateContent = content;
      var jsonData = { "dataArray": dataArray, "createdAt": createdAt, "dateFrom": dateFrom, "dateTo": dateTo, "subsidiaryName": subsidiaryName };

      templateRenderer.addCustomDataSource({
        format: render.DataSource.JSON,
        alias: "JSON",
        data: JSON.stringify(jsonData)
      });

      var htmlString = templateRenderer.renderAsString();

      return {
        "htmlstring": htmlString
      }
    } else if (requestBody.action === 'getallhtml') {
      var dataRecordsCount = getDataRecordsCount();
      if (dataRecordsCount === 0) {
        var htmlString = '<h2>Trenutno ne postoje izgenerisani podaci!</h2>';
        return {
          "htmlstring": htmlString
        }
      } else {
        var dataFile = file.load({
          id: './output_data/predracuni_svi.json'
        });
        var dataArray = JSON.parse(dataFile.getContents());
        var htmlTemplate = file.load({ id: './predracuni_templates/pregled_predracuna_html_template.html' });
        var content = htmlTemplate.getContents();
        var templateRenderer = render.create();
        templateRenderer.templateContent = content;
        var dataQuery = query.runSuiteQL({
          query: 'SELECT custrecord_date_time_created, custrecord_so_data_date_from, custrecord_so_data_date_to, custrecord_so_data_subsidiary_name FROM customrecord_rsm_so_list_data WHERE custrecord_customer_id IS Null',
        });
        if (dataQuery.results.length > 0)
        {
          var createdAt = dataQuery.results[0].values[0];
          var dateFrom = dataQuery.results[0].values[1];
          var dateTo = dataQuery.results[0].values[2];
          var subsidiaryName = dataQuery.results[0].values[3];
        } else {
          dataArray = [];
          var dateFrom = '/';
          var dateTo = '/';
          var subsidiaryName = '/';
        }
        var jsonData = { "dataArray": dataArray, "createdAt": createdAt, "dateFrom": dateFrom, "dateTo": dateTo, "subsidiaryName": subsidiaryName };

        templateRenderer.addCustomDataSource({
          format: render.DataSource.JSON,
          alias: "JSON",
          data: JSON.stringify(jsonData)
        });
        var htmlString = templateRenderer.renderAsString();

        return {
          "htmlstring": htmlString
        }
      }
    }
  }

  return {
    post: post
  };

});
