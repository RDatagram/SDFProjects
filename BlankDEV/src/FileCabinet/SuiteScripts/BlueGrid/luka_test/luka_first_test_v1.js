/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 */
define(['N/record', 'N/ui/serverWidget', 'N/query', 'N/log', 'N/ui/message'], function (record, serverWidget, query, log, message) {
    function onRequest(context) {
        if (context.request.method === 'GET') {

            var form = serverWidget.createForm({
                title: 'Luka Form Title'
            });

            form.addField({
                id: 'field_1',
                type: serverWidget.FieldType.TEXT,
                label: 'Field 1 TEXT'
            });

            form.addField({
                id: 'date_1',
                type: serverWidget.FieldType.DATE,
                label: 'Date'
            });


            form.addField({
                id: 'field_2',
                type: serverWidget.FieldType.CURRENCY,
                label: 'Field 2 CURRENCY'
            });

            // Select
            var select = form.addField({
                id: 'select_field',
                type: serverWidget.FieldType.SELECT,
                label: 'Select'
            });
            select.addSelectOption({
                value: 'option_1',
                text: 'Option 1'
            });
            select.addSelectOption({
                value: 'option_2',
                text: 'Option 2'
            });

            // Radio
            form.addField({
                id: 'radio_fields',
                type: serverWidget.FieldType.RADIO,
                label: '1',
                source: 'radio1'
            });
            form.addField({
                id: 'radio_fields',
                type: serverWidget.FieldType.RADIO,
                label: '2',
                source: 'radio2'
            });

            form.addField({
                id: 'query_1',
                type: serverWidget.FieldType.TEXTAREA,
                label: 'QUERY'
            });

            form.addSubmitButton({
                label: 'Submit Data'
            });
            form.addResetButton({
                label: 'Reset Fields'
            });
            context.response.writePage(form);
        } else {
            // Show submitted data
            var field_1 = context.request.parameters.field_1;
            var date_1 = context.request.parameters.date_1;
            var field_2 = context.request.parameters.field_2;
            var select_field = context.request.parameters.select_field;
            var radio_fields = context.request.parameters.radio_fields;
            context.response.writeLine('Entered data:\n' + field_1 + ' ' + date_1 + ' ' + field_2 + ' ' + select_field + ' ' + radio_fields);

            // Show SQL query requested data
            try {
                var queryResults = query.runSuiteQL({
                    query: context.request.parameters.query_1
                });
                context.response.writeLine("SQL Data: \n" + JSON.stringify(queryResults.results, null, 2));
            } catch (error) {
                context.response.writeLine("SQL ERORR: " + error);
            }
        }
    }

    return {
        onRequest: onRequest
    };
});