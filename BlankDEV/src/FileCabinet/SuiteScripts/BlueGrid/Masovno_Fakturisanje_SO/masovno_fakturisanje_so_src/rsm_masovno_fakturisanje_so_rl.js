/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 */
define(['N/task', 'N/log'], function (task, log) {

  function post(requestBody) {
    if (requestBody.action === 'runscript') {
      var script = {
        scriptId: 'customscript_fakturisanje_so_mr',
        deploymentId: 'customdeploy_fakturisanje_so_mr'
      }

      var mrTask = task.create({
        taskType: task.TaskType.MAP_REDUCE
      });
      mrTask.scriptId = script.scriptId;
      mrTask.deploymentId = script.deploymentId;
      mrTask.params = { custscriptsubsidiary: requestBody.subsidiary };
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
    }
  }

  return {
    post: post
  };

});