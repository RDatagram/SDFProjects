/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/ui/message', 'N/url', 'N/https', 'N/currentRecord'], function (message, url, https, currentRecord) {

  function pageInit(scriptContext) {
    var resetButton = document.getElementById('resetlocalstorage');
    if (resetButton != null) {
      resetButton.setAttribute("style", "background-color:red !important;color:white !important");
    }

    var response = callRestlet({
      "action": "getallhtml"
    });
    var inlinehtmlfield = document.getElementById('inlinehtmlfield');
    inlinehtmlfield.innerHTML = response.htmlstring;

  }

  /**
   * Refreshes the page
   */
  function refreshPage() {
    window.location.reload();
  }

  /**
   * Gets data values from input and other form fields
   * @returns {object} object with form fields values
   */
  function getFormData() {
    var record = currentRecord.get();
    var customerSelect = record.getValue({
      fieldId: 'customerselect'
    });
    return customerSelect;
  }

  function getDataForMR() {
    var record = currentRecord.get();
    var subsidiarySelect = record.getValue({
      fieldId: 'subsidiaryselect'
    });
    var subsidiaryName = record.getText({
      fieldId: 'subsidiaryselect'
    });
    var customerName
    var dateFrom = document.getElementById('datefrom').value;
    var dateTo = document.getElementById('dateto').value;
    var data = {
      subsidiary: subsidiarySelect,
      subsidiaryname: subsidiaryName,
      datefrom: dateFrom,
      dateto: dateTo
    };
    return data;
  }

  /** 
   * Sends post request on restlet script
   * @param {object} data object that contains post data
   * @returns {object} response data
   */
  function callRestlet(data) {
    var restletUrl = url.resolveScript({
      scriptId: 'customscript_rsm_pregled_predracuna_rl',
      deploymentId: 'customdeploy_rsm_pregled_predracuna_rl'
    });

    // Generate request headers
    var headers = new Array();
    headers['Content-type'] = 'application/json';

    // https POST call
    var response = https.post({
      url: restletUrl,
      headers: headers,
      body: data
    });
    return JSON.parse(response.body);
  }

  /**
   * Calls restlet which then creates task which will run MapReduce script
   */
  function runMrScript() {
    var canRunScript = false;

    var taskId = 'predracunitaskid'
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
    var mrFormData = getDataForMR();

    if (!mrFormData.subsidiary || !mrFormData.subsidiaryname || !mrFormData.datefrom || !mrFormData.dateto) {
      alert('Morate da popunite sva polja za generisanje podataka!');
      return;
    }
    if (canRunScript) {

      var response = callRestlet({
        "action": "runscript",
        "subsidiary": mrFormData.subsidiary,
        "subsidiaryname": mrFormData.subsidiaryname,
        "datefrom": mrFormData.datefrom,
        "dateto": mrFormData.dateto
      });

      localStorage.setItem(taskId, response.mrtaskid);

      message.create({
        type: message.Type.CONFIRMATION,
        title: 'Success',
        message: "Map/Reduce script started! Task id: " + response.mrtaskid
      }).show(5000);
    }
  }

  /**
   * Calls restlet which checks current status of MapReduce script with provided task id
   */
  function checkTaskStatus() {
    var taskId = 'predracunitaskid';
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
    if (localStorage.getItem('predracunitaskid') !== null) {
      localStorage.removeItem('predracunitaskid');
    }

    message.create({
      type: message.Type.CONFIRMATION,
      title: 'Success',
      message: "Reset successfully finished."
    }).show(5000);
  }

  function confirmSelectChange() {
    var customer = getFormData();
    if (customer) {
      var response = callRestlet({
        "action": "gethtml",
        "customer": customer
      });
    } else {
      var response = callRestlet({
        "action" : "getallhtml"
      });
    }
    
    var inlinehtmlfield = document.getElementById('inlinehtmlfield');

    if (response.htmlstring === '') {
      inlinehtmlfield.innerHTML = '<h2>Ne postoje transakcije za ovog customera!</h2>'
    } else {
      inlinehtmlfield.innerHTML = response.htmlstring;
    }
  }

  return {
    pageInit: pageInit,
    runMrScript: runMrScript,
    checkTaskStatus: checkTaskStatus,
    refreshPage: refreshPage,
    resetLocalStorage: resetLocalStorage,
    confirmSelectChange: confirmSelectChange
  };

});
