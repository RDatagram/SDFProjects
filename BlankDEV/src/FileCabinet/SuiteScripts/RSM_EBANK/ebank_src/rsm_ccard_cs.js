/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/currentRecord', 'N/ui/message', 'N/url', 'N/https', 'N/record'],

    function (record, message, url, https, recordModule) {

        /**
         * Function to be executed after page is initialized.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
         *
         * @since 2015.2
         */


        function pageInit(scriptContext) {
            console.log('pageInit');
        }

/*
        var headersGlobal = [];
        headersGlobal['Content-type'] = 'application/json';
*/

        function _headersGlobal(){
            return {'Content-type' : 'application/json'}
        }

        function _restUrl(){
            return url.resolveScript({
                scriptId: 'customscript_rsm_ccard_rl',
                deploymentId: 'customdeploy_rsm_ccard_rl',
                returnExternalUrl : false,
                params : {}
            });
        }

        function _submit_parser() {

            debugger;

            var cRec = record.get();

/*
            var restUrl = url.resolveScript({
                scriptId: 'customscript_rsm_ccard_rl',
                deploymentId: 'customdeploy_rsm_ccard_rl',
                returnExternalUrl : false,
                params : {}
            });
*/

            // Generate request headers
/*
            var headers = [];
            headers['Content-type'] = 'application/json';
*/

            // Perform HTTP POST call
            var restReq = https.post({
                url: _restUrl(),
                headers: _headersGlobal(),
                body: {
                    idHeader: cRec.id,
                    action: "parser"
                }
            });
            var jsRes = JSON.parse(restReq.body);
            console.log(jsRes);
            var myMsg = message.create({
                title: "Result",
                message: "Pokrenuta procedura PARSIRANJA",
                type: message.Type.CONFIRMATION,
                duration : 5000
            });
            // will disappear after 5s
            myMsg.show({
                duration: 5000
            });

            window.location.reload(true);

        }

        function _submit_lookup() {

            var cRec = record.get();

/*
            var restUrl = url.resolveScript({
                scriptId: 'customscript_rsm_ccard_rl',
                deploymentId: 'customdeploy_rsm_ccard_rl'
            });
*/

            // Generate request headers
            // var headers = [];
            // headers['Content-type'] = 'application/json';

            // Perform HTTP POST call
            var restReq = https.post({
                url: _restUrl(),
                headers: _headersGlobal(),
                body: {
                    idHeader: cRec.id,
                    action: "lookup"
                }
            });
            var jsRes = JSON.parse(restReq.body);
            console.log(jsRes);
            var myMsg = message.create({
                title: "Result",
                message: "Pokrenuta procedura POVEZIVANJA",
                type: message.Type.CONFIRMATION
            });
            // will disappear after 5s
            myMsg.show({
                duration: 5000
            });

            window.location.reload(true);

        }

        function _submit_payments() {

            debugger;

            var cRec = record.get();

/*
            var restUrl = url.resolveScript({
                scriptId : 'customscript_rsm_ccard_rl',
                deploymentId : 'customdeploy_rsm_ccard_rl'
            });

            // Generate request headers
            var headers = [];
            headers['Content-type'] = 'application/json';
*/

            // Perform HTTP POST call
            var restReq = https.post({
                url : _restUrl(),
                headers : _headersGlobal(),
                body : {
                    idHeader : cRec.id,
                    action : "payments"
                }
            });
            var jsRes = JSON.parse(restReq.body);

            var myMsg = message.create({
                title : "Result",
                message : "Pokrenuta procedura generisanja Payments",
                type : message.Type.CONFIRMATION
            });
            // will disappear after 5s
            myMsg.show({
                duration : 5000
            });

            window.location.reload(true);

        }


        function _submit_rollback() {

            debugger;

            var cRec = record.get();

/*            var restUrl = url.resolveScript({
                scriptId : 'customscript_rsm_ccard_rl',
                deploymentId : 'customdeploy_rsm_ccard_rl'
            });*/

            //var restUrl = _restUrl();
            // Generate request headers
            // var headers = [];
            // headers['Content-type'] = 'application/json';

            // Perform HTTP POST call
            var restReq = https.post({
                url : _restUrl(),
                headers : _headersGlobal(),
                body : {
                    idHeader : cRec.id,
                    action : "rollback"
                }
            });
            var jsRes = JSON.parse(restReq.body);

            var myMsg = message.create({
                title : "Result",
                message : "Pokrenuta procedura PONISTAVANJA",
                type : message.Type.CONFIRMATION
            });
            // will disappear after 5s
            myMsg.show({
                duration : 5000
            });

            window.location.reload(true);

        }

        function _submit_refresh() {
            window.location.reload(true);
        }

        function _submit_reset() {

            var cRec = record.get();
            var eRec = recordModule.load(
                {
                    type: 'customrecord_rsm_crdh',
                    id: cRec.id,
                    isDynamic: true
                }
            )

            while (eRec.getLineCount({sublistId: 'recmachcustrecord_rsm_crdl_crdh'}) > 0) {
                eRec.removeLine({
                    sublistId: 'recmachcustrecord_rsm_crdl_crdh',
                    line: 0
                })
            }
            eRec.save();

            window.location.reload(true);
        }

        return {
            pageInit: pageInit,
            submit_parser: _submit_parser,
            submit_payments: _submit_payments,
            submit_lookup: _submit_lookup,
            submit_refresh: _submit_refresh,
            submit_rollback: _submit_rollback,
            submit_reset: _submit_reset
        };

    });
