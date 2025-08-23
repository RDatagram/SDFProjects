/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/currentRecord', 'N/ui/message', 'N/url', 'N/https'], function(record, message, url, https) {

    function pageInit(scriptContext) {
        
    }

    function callRestlet(myAction) {
        
        var currentRecord = record.get();

        var scriptId = 'customscript_rl_bu_report';
        var deploymentId = 'customdeploy_rl_bu_report';

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
                idBUReport: currentRecord.id,
                action: myAction
            }
        });

        var response = JSON.parse(restletRequest.body);
        return response;
    }

    function init_bs_lines() {

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

    function calculate_bs_lines() {
        var restletResponse = callRestlet("calc_lines");

        var myMsg = message.create({
            title: "Result",
            message: "Calculation done",
            type: message.Type.CONFIRMATION
        });
        
        myMsg.show({
            duration: 5000
        });
        window.location.reload(true);
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

    return {
        pageInit: pageInit,
        init_bs_lines: init_bs_lines,
        getXmlFile: getXmlFile,
        getPdfFile: getPdfFile,
        calculate_bs_lines: calculate_bs_lines,
        recalculate_xml_lines: recalculate_xml_lines,
        delete_pdf: delete_pdf,
        delete_xml: delete_xml
    }
})