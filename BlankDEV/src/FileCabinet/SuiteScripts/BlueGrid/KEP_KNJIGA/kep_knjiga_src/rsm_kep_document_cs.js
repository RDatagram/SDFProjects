/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * 
 * Knjiga Evidencije Prometa (KEP Knjiga)
 */
define(['N/ui/message', 'N/url', 'N/https', 'N/currentRecord'], function (message, url, https, currentRecord) {

    function pageInit(scriptContext) {

    }

    function callRestlet(data) {
        var restletUrl = url.resolveScript({
            scriptId: 'customscript_rsm_kep_document_rl',
            deploymentId: 'customdeploy_rsm_kep_document_rl'
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
    function runMrScript(params) {
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

            params.action = "runscript";
            var response = callRestlet(params);

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

    function reloadPage() {
        location.reload();
    }

    function importLines(params) {
        var kepId = prompt('Unesi "INTERNAL ID" KEP rekorda sa koga želiš da importuješ linije:');
        if (kepId) {
            params.action = 'import';
            params.kepId = kepId;
            var response = callRestlet(params);
            if (response.status) {
                message.create({
                    type: message.Type.CONFIRMATION,
                    title: 'Success',
                    message: response.message
                }).show(5000);
                setTimeout(function () {
                    location.reload();
                }, 5000);
            } else {
                message.create({
                    type: message.Type.WARNING,
                    title: 'Error',
                    message: "Import failed: " + response.error
                }).show(5000);
            }
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

    function deleteAll(params) {
        if (confirm("Obriši sve linije?")) {
            params.action = 'deleteAll';
            var response = callRestlet(params);
            location.reload();
        }
    }

    return {
        pageInit: pageInit,
        runMrScript: runMrScript,
        checkTaskStatus: checkTaskStatus,
        reloadPage: reloadPage,
        importLines: importLines,
        resetLocalStorage: resetLocalStorage,
        deleteAll: deleteAll
    };

});