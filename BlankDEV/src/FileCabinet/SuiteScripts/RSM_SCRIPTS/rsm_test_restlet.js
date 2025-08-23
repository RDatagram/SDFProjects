/**
 * @NApiVersion 2.0
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/ui/serverWidget', 'N/https'],

    function (serverWidget, https) {

        /**
         * Creates a form, adds fields and buttons to it and returns it
         * @returns {serverWidget.Form} Netsuite Form encapsulation object
         */
        var requestField;
        var responseField;

        function createForm() {
            var form = serverWidget.createForm({
                title: "RESTLET Tester"
            });


            // Select field (KIF/KUF)
            var selectMethod = form.addField({
                id: 'custpage_methodselect',
                label: "Method:",
                type: serverWidget.FieldType.SELECT
            });

            selectMethod.addSelectOption({
                value: 'POST',
                text: 'POST',
                isSelected: true
            });
            selectMethod.addSelectOption({
                value: 'GET',
                text: 'GET'
            });
            selectMethod.updateBreakType({
                breakType: serverWidget.FieldBreakType.STARTROW
            });
            var urlField = form.addField({
                id: 'custpage_restlet_url',
                type: serverWidget.FieldType.TEXT,
                label: 'RESTLET url'
            })
            urlField.updateBreakType({
                breakType: serverWidget.FieldBreakType.STARTROW
            });

            // Buttons
            form.addSubmitButton({
                id: 'custpage_runscript',
                label: "Run RESTLET"
            });
            requestField = form.addField(
                {
                    id: 'custpage_field_request',
                    type: serverWidget.FieldType.LONGTEXT,
                    label: 'Request'
                }
            );
            requestField.updateBreakType({
                breakType: serverWidget.FieldBreakType.STARTROW
            });
            responseField = form.addField(
                {
                    id: 'custpage_field_response',
                    type: serverWidget.FieldType.LONGTEXT,
                    label: 'Response'
                }
            );
            responseField.updateBreakType({
                breakType: serverWidget.FieldBreakType.STARTROW
            });
            return form;
        }

        /**
         *
         * @param options
         * @param {string} options.body
         * @param {string} options.scriptId
         * @param {string} options.deploymentId
         */
        function doRestlet(options) {
            var myHeaders = [];
            myHeaders['Content-type'] = 'application/json';


            var response = https.requestRestlet({
                scriptId: options.scriptId,
                deploymentId: options.deploymentId,
                method: 'POST',
                headers: myHeaders,
                body: options.body
            });

            return JSON.stringify(response);
        }

        // Suitelet entry point function
        function onRequest(params) {
            var form;
            if (params.request.method === 'GET') {
                form = createForm(params.request);
                requestField.defaultValue = '{' +
                    ' action: "createpdf",' +
                    ' salesOrderId: _data.soId,' +
                    ' location: _data.location ' +
                    '            }'
                params.response.writePage(form);
            }
            if (params.request.method === 'POST') {
                form = createForm(params.request);
                var postOptions = {
                    body : JSON.stringify(params.request.parameters.custpage_field_request),
                    scriptId: 'customscript_snt_rl_get_table',
                    deploymentId: 'customdeploy_snt_rl_get_table'
                }

                responseField.defaultValue = doRestlet(postOptions);
                params.response.writePage(form);
            }
        }

        return {
            onRequest: onRequest,
        };

    });