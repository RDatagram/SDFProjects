/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/ui/message', 'N/url', 'N/https'], function (message, url, https) {

  function pageInit(scriptContext) {

  }

  function callRestlet(data) {
    var restletUrl = url.resolveScript({
      scriptId: 'customscript_fakturisanje_rl',
      deploymentId: 'customdeploy_fakturisanje_rl'
    });

    var headers = new Array();
    headers['Content-type'] = 'application/json';

    var response = https.post({
      url: restletUrl,
      headers: headers,
      body: data
    });
    return JSON.parse(response.body);
  }

  // Calls restlet which then creates task which will run MapReduce script
  function runMrScript() {
    var canRunScript = false;
    var taskId = 'testmrtask';

    var mrTaskId = localStorage.getItem(taskId);

    if (mrTaskId) {
      // Check status
      var response = callRestlet({
        "action": "checkstatus",
        "taskid": mrTaskId
      });

      if (response.status !== 'COMPLETE' && response.status !== 'FAILED') {
        message.create({
          type: message.Type.WARNING,
          title: 'Warning',
          message: "Map/Reduce script is already running!"
        }).show(5000);
      } else {
        canRunScript = true;
      }
    } else {
      canRunScript = true;
    }

    if (canRunScript) {
      var selectedSubsidiary = document.getElementsByClassName("dropdownInput textbox")[0].value.split("/")[0];
      var response = callRestlet({
        "action": "runscript",
        "subsidiary": selectedSubsidiary === "All" ? "T" : selectedSubsidiary
      });

      localStorage.setItem(taskId, response.mrtaskid);

      message.create({
        type: message.Type.CONFIRMATION,
        title: 'Success',
        message: "Map/Reduce script started! Task id: " + response.mrtaskid
      }).show(5000);
    }
  }

  // Calls restlet which checks current status of MapReduce script with provided task id
  function checkTaskStatus() {

    var taskId = 'testmrtask'
    var mrTaskId = localStorage.getItem(taskId);

    if (mrTaskId) {
      var response = callRestlet({
        "action": "checkstatus",
        "taskid": mrTaskId
      });

      var stage = (response.status === 'COMPLETE' || response.status === 'PENDING') ? '' : (", Stage: " + response.stage)
      message.create({
        type: message.Type.INFORMATION,
        title: 'Information',
        message: "Map/Reduce script status: " + response.status + stage
      }).show(5000);

    } else {
      message.create({
        type: message.Type.INFORMATION,
        title: 'Information!',
        message: "Safe to run MR task for this report!"
      }).show(5000);
    }
  }

  function resetLocalStorage() {
    var localStorage = window.localStorage;
    if (localStorage.getItem('testmrtask') !== null) {
      localStorage.removeItem('testmrtask');
    }

    message.create({
      type: message.Type.CONFIRMATION,
      title: 'Success',
      message: "Reset successfully finished."
    }).show(5000);
  }

  return {
    pageInit: pageInit,
    runMrScript: runMrScript,
    checkTaskStatus: checkTaskStatus,
    resetLocalStorage: resetLocalStorage
  };

});