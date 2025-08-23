/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/ui/message', 'N/url', 'N/https', 'N/currentRecord', 'N/ui/dialog'], function (message, url, https, currentRecord, dialog) {

    function pageInit(scriptContext) {
        var urlString = window.location.href;
        var url = new URL(urlString);
        var errorMessage = url.searchParams.get("errorMessage");
        if (errorMessage) {
            messageError(errorMessage);
        }
    }

    function restart() {
        window.location.href = window.location.href.replace("&errorMessage=No+journal+entries+found%21", "");
        return response;
    }
    function messageError(e) {
        var error = message.create({
            title: 'Error!',
            message: e,
            type: message.Type.ERROR
        });
        error.show({
            duration: 5000
        });
    }

    return {
        pageInit: pageInit,
        restart: restart
    };

});
