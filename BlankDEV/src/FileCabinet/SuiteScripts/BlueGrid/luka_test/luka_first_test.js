/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 */
define(['N/record', 'N/ui/serverWidget', 'N/query', 'N/log', 'N/ui/message', 'N/search', 'N/render', 'N/file'], function (record, serverWidget, query, log, message, search, render, file) {
    function onRequest(context) {
        if (context.request.method === 'GET') {

            var form = serverWidget.createForm({
                title: 'Luka Form Title'
            });
            form.addSubmitButton({
                label: 'Submit Data'
            });
            form.addResetButton({
                label: 'Reset Fields'
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
                label: 'SQL QUERY'
            });

            // Checkbox
            form.addField({
                id: 'checkbox_1',
                type: serverWidget.FieldType.CHECKBOX,
                label: 'Checkbox 1'
            });
            form.addField({
                id: 'checkbox_2',
                type: serverWidget.FieldType.CHECKBOX,
                label: 'Checkbox 2'
            });

            form.addField({
                id: 'longtext_1',
                type: serverWidget.FieldType.LONGTEXT,
                label: 'Longtext'
            });
            form.addField({
                id: 'phone_1',
                type: serverWidget.FieldType.PHONE,
                label: 'Phone'
            });
            form.addField({
                id: 'email_1',
                type: serverWidget.FieldType.EMAIL,
                label: 'Email'
            });
            form.addField({
                id: 'file_1',
                type: serverWidget.FieldType.FILE,
                label: 'File'
            });
            form.addField({
                id: 'help_1',
                type: serverWidget.FieldType.HELP,
                label: 'Help'
            });
            form.addField({
                id: 'timeofday_1',
                type: serverWidget.FieldType.TIMEOFDAY,
                label: 'Time of Day'
            });
            form.addField({
                id: 'url_1',
                type: serverWidget.FieldType.URL,
                label: 'URL'
            });
            form.addField({
                id: 'label_1',
                type: serverWidget.FieldType.LABEL,
                label: 'Label'
            });
            form.addField({
                id: 'image_1',
                type: serverWidget.FieldType.IMAGE,
                label: 'Image'
            });
            context.response.writePage(form);
        } else {
            // Show submitted data
            var field_1 = context.request.parameters.field_1;
            var date_1 = context.request.parameters.date_1;
            var field_2 = context.request.parameters.field_2;
            var select_field = context.request.parameters.select_field;
            var radio_fields = context.request.parameters.radio_fields;
            var checkbox_1 = context.request.parameters.checkbox_1;
            var checkbox_2 = context.request.parameters.checkbox_2;
            var file_1 = context.request.parameters.file_1;
            context.response.writeLine('Entered data:\n' + field_1 + ' ' + date_1 + ' ' + field_2 + ' ' + select_field + ' ' + radio_fields + ' ' + checkbox_1 + ' ' + checkbox_2);

            // Show SQL query requested data
            try {
                var queryResults = query.runSuiteQL({
                    query: context.request.parameters.query_1
                });
                context.response.writeLine("SQL Data: \n" + JSON.stringify(queryResults.results, null, 2));
            } catch (error) {
                context.response.writeLine("SQL ERORR: " + error);
            }

            // Search
            try {
                var searchResults = search.create({
                    type: search.Type.TRANSACTION,
                    columns: ["name"],
                    filters: []
                }).run().getRange({ start: 0, end: 100 });
                context.response.writeLine("Search Data: " + JSON.stringify(searchResults, null, 2));
            } catch (error) {
                context.response.writeLine("Search ERORR: " + error);
            }
        }
    }

    return {
        onRequest: onRequest
    };
});