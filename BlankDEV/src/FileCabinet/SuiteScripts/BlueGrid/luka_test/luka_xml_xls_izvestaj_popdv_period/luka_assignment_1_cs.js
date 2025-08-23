/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/ui/message', 'N/url', 'N/https', 'N/ui/dialog'], function (message, url, https, dialog) {

    function pageInit() {

    }

    /* function messageSuccess() {
        var success = message.create({
            title: 'Success!',
            message: 'File download started.',
            type: message.Type.CONFIRMATION
        });
        success.show({
            duration: 5000
        });
    } */

    /* function messageError(e) {
        var error = message.create({
            title: 'Error!',
            message: 'File download failed! Message: ' + e,
            type: message.Type.ERROR
        });
        error.show({
            duration: 5000
        });
    } */

    return {
        pageInit: pageInit,
        /* messageSuccess: messageSuccess,
        messageError: messageError */
    };

});