/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 * 
 * Email Scheduler
 * Listen for user actions on the suitelet page and execute the required actions in regards to calling the restlet
 */
define(['N/ui/message', 'N/url', 'N/https'], function (message, url, https) {

    function pageInit(scriptContext) {

    }
    /**
     * Sends post request on restlet script
     * @param {object} data object that contains post data
     * @returns {object} response data
     */
    function callRestlet(data) {
        var restletUrl = url.resolveScript({
            scriptId: 'customscript_rsm_email_schedule_rl',
            deploymentId: 'customdeploy_rsm_email_schedule_rl'
        });

        var headers = [];
        headers['Content-type'] = 'application/json';

        var response = https.post({
            url: restletUrl,
            headers: headers,
            body: data
        });
        return JSON.parse(response.body);
    }

    // Calls restlet which then creates task which will run Map/Reduce script
    function runMrScript() {
        var canRunScript = false;
        var taskId = 'testemailmr';

        var mrTaskId = localStorage.getItem(taskId);

        if (mrTaskId) {

            // Check status
            var responseRun = callRestlet({
                "action": "checkstatus",
                "taskid": mrTaskId
            });

            if (responseRun.status !== 'COMPLETE' && responseRun.status !== 'FAILED') {
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
            var response = callRestlet({
                "action": "runscript",
                "transactionType": document.getElementsByClassName("dropdownInput textbox")[0].dataset.value
            });

            localStorage.setItem(taskId, response.mrtaskid);

            message.create({
                type: message.Type.CONFIRMATION,
                title: 'Success',
                message: "Map/Reduce script started! Task id: " + response.mrtaskid
            }).show(5000);
        }
    }

    // Calls restlet which checks current status of Map/Reduce script
    function checkTaskStatus() {
        var taskId = 'testemailmr';
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
        if (window.localStorage.getItem('testmrtask') !== null) {
            window.localStorage.removeItem('testmrtask');
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
