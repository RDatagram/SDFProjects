/**
 * @NApiVersion 2.1
 * @NScriptType Portlet
 */
define([ 'N/ui/serverWidget'], function(serverWidget) {
    function render(params) {
        let form = params.portlet;

        form.addField({
            id: 'custpage_field1',
            type: serverWidget.FieldType.TEXT,
            label: 'Field 1'
        });

        form.addField({
            id: 'custpage_field2',
            type: serverWidget.FieldType.TEXT,
            label: 'Field 2'
        });

        form.addButton({
            id: 'custpage_field3',
            label: 'Alert',
            functionName : 'alert()'
        });

        form.setSubmitButton({
            label: 'Submit',
            url: 'https://google.com'
        });
    }

    return {
        render: render
    };
});