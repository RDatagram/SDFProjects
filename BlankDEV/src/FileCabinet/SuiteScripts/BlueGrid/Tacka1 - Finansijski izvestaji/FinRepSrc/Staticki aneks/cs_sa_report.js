/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/currentRecord', 'N/ui/message', 'N/url', 'N/https', 'N/record'], function (currentRecord, message, url, https, record) {

  function pageInit(scriptContext) {

  }

  function fieldChanged(scriptContext) {
    if (scriptContext.fieldId === 'custrecord_rsm_sa_report_subsidiary') {
      var reportRecord = scriptContext.currentRecord;
      var subsidiaryId = reportRecord.getValue({
        fieldId: 'custrecord_rsm_sa_report_subsidiary'
      });
      if (subsidiaryId) {
        var subsidiaryRecord = record.load({
          type: record.Type.SUBSIDIARY,
          id: subsidiaryId,
          isDynamic: true
        })
        var pib = subsidiaryRecord.getValue('federalidnumber')
        var matBroj = subsidiaryRecord.getValue('custrecord_subs_mat_broj');
        reportRecord.setValue({
          fieldId: 'custrecord_rsm_sa_report_pib',
          value: pib
        })
        reportRecord.setValue({
          fieldId: 'custrecord_rsm_sa_report_maticni_broj',
          value: matBroj
        })
      }
    }
  }

  function callRestlet(myAction) {

    var currRecord = currentRecord.get();

    var scriptId = 'customscript_rsm_sa_rl';
    var deploymentId = 'customdeploy_rsm_sa_rl';

    var restletUrl = url.resolveScript({
      scriptId: scriptId,
      deploymentId: deploymentId
    });

    //Generate request headers
    var headers = new Array();
    headers['Content-type'] = 'application/json';

    // Perform HTTP POST call
    var restletRequest = https.post({
      url: restletUrl,
      headers: headers,
      body: {
        idSAReport: currRecord.id,
        action: myAction
      }
    });

    var response = JSON.parse(restletRequest.body);
    return response;
  }

  function init_sa_lines() {

    var restletResponse = callRestlet("init_lines");

    var myMsg = message.create({
      title: "Result",
      message: "Init done",
      type: message.Type.CONFIRMATION
    });

    myMsg.show({
      duration: 5000
    });
    window.location.reload(true);
  }

  function getXmlFile() {
    var restletResponse = callRestlet("xml_file");

    var myMsg = message.create({
      title: "Result",
      message: "Xml export",
      type: message.Type.CONFIRMATION
    });

    myMsg.show({
      duration: 5000
    });
    window.location.reload(true);
  }

  function getPdfFile() {
    var restletResponse = callRestlet("pdf_file");

    var myMsg = message.create({
      title: "Result",
      message: "Pdf export",
      type: message.Type.CONFIRMATION
    });

    myMsg.show({
      duration: 5000
    });
    window.location.reload(true);
  }

  function calculate_sa_lines() {
    var restletResponse = callRestlet("calc_lines");

    if (restletResponse.badAops.length || restletResponse.messageToSend) {

      var feedbackMessage = "";

      if (restletResponse.messageToSend) {
        feedbackMessage = restletResponse.messageToSend;
      }
      if (restletResponse.badAops.length) {
        feedbackMessage += " Doslo je do greske prilikom knizenja za sledece AOP kodove: " + restletResponse.badAops.toString()
      }

      var myMsg = message.create({
        title: "Result",
        message: feedbackMessage,
        type: message.Type.WARNING
      });
      myMsg.show({
        duration: 0
      });
    } else {
      var myMsg = message.create({
        title: "Result",
        message: "Calculation done. ",
        type: message.Type.CONFIRMATION
      });
      myMsg.show({
        duration: 5000
      });
      window.setTimeout(function () {
        window.location.reload();
      }, 5000)
    }
  }

  function recalculate_xml_lines() {
    var restletResponse = callRestlet("recalculate_lines");

    var myMsg = message.create({
      title: "Result",
      message: "Recalculation done",
      type: message.Type.CONFIRMATION
    });

    myMsg.show({
      duration: 5000
    });
    window.location.reload(true);
  }

  function delete_pdf() {
    var restletResponse = callRestlet("delete_pdf");

    var myMsg = message.create({
      title: "Result",
      message: "PDF file deleted successfully",
      type: message.Type.CONFIRMATION
    });

    myMsg.show({
      duration: 5000
    });
    window.location.reload(true);
  }

  function delete_xml() {
    var restletResponse = callRestlet("delete_xml");

    var myMsg = message.create({
      title: "Result",
      message: "XML file deleted successfully",
      type: message.Type.CONFIRMATION
    });

    myMsg.show({
      duration: 5000
    });
    window.location.reload(true);
  }

  function getXlsFile() {
    var restletResponse = callRestlet("xls_file");

    var myMsg = message.create({
      title: "Result",
      message: "XLS export",
      type: message.Type.CONFIRMATION
    });

    myMsg.show({
      duration: 5000
    });
    window.location.reload(true);
  }

  function delete_xls() {
    var restletResponse = callRestlet("delete_xls");

    var myMsg = message.create({
      title: "Result",
      message: "XLS file deleted successfully",
      type: message.Type.CONFIRMATION
    });

    myMsg.show({
      duration: 5000
    });
    window.location.reload(true);
  }

  function delete_report_lines() {
    var restletResponse = callRestlet("delete_lines");

    var myMsg = message.create({
      title: "Result",
      message: "Report lines successfully deleted",
      type: message.Type.CONFIRMATION
    });

    myMsg.show({
      duration: 5000
    });
    window.location.reload(true);
  }

  return {
    pageInit: pageInit,
    fieldChanged: fieldChanged,
    init_sa_lines: init_sa_lines,
    getXmlFile: getXmlFile,
    getPdfFile: getPdfFile,
    calculate_sa_lines: calculate_sa_lines,
    recalculate_xml_lines: recalculate_xml_lines,
    delete_pdf: delete_pdf,
    delete_xml: delete_xml,
    delete_xls: delete_xls,
    getXlsFile: getXlsFile,
    delete_report_lines: delete_report_lines
  }
})