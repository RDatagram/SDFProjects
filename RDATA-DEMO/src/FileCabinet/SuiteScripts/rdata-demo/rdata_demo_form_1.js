/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/ui/serverWidget'], (serverWidget) => {
    const onRequest = (scriptContext) => {
        if (scriptContext.request.method === 'GET') {
            let form = serverWidget.createForm({
                title: 'Simple Form'
            });

            let field = form.addField({
                id: 'textfield',
                type: serverWidget.FieldType.TEXT,
                label: 'Text'
            });
            field.layoutType = serverWidget.FieldLayoutType.NORMAL;
            field.updateBreakType({
                breakType: serverWidget.FieldBreakType.STARTCOL
            });

            form.addField({
                id: 'datefield',
                type: serverWidget.FieldType.DATE,
                label: 'Date'
            });
            form.addField({
                id: 'currencyfield',
                type: serverWidget.FieldType.CURRENCY,
                label: 'Currency'
            });

            let select = form.addField({
                id: 'selectfield',
                type: serverWidget.FieldType.SELECT,
                label: 'Select'
            });
            select.addSelectOption({
                value: 'a',
                text: 'Albert'
            });
            select.addSelectOption({
                value: 'b',
                text: 'Baron'
            });

            let sublist = form.addSublist({
                id: 'custpage_sublist',
                type: serverWidget.SublistType.LIST,
                label: 'Sublist'
            });
            sublist.addField({
                id: 'sublist_date',
                type: serverWidget.FieldType.TEXT,
                label: 'Date'
            });
            sublist.addField({
                id: 'sublist2',
                type: serverWidget.FieldType.TEXT,
                label: 'Text'
            });

            sublist.setSublistValue({
                id: 'sublist_date',
                line: 0,
                value: (new Date()).toISOString(),
            });

            sublist.setSublistValue({
                id: 'sublist2',
                line: 0,
                value: 'My text'
            });

            form.addSubmitButton({
                label: 'Submit Button'
            });

            scriptContext.response.writePage(form);
        } else {
            const delimiter = /\u0001/;
            const textField = scriptContext.request.parameters.textfield;
            const dateField = scriptContext.request.parameters.datefield;
            const currencyField = scriptContext.request.parameters.currencyfield;
            const selectField = scriptContext.request.parameters.selectfield;
            let lineCount = scriptContext.request.getLineCount('custpage_sublist');
            let field1;
            let field2;
            for (let i = 0; i < lineCount; i++)
            {
                field1 = scriptContext.request.getSublistValue({
                    group : 'custpage_sublist',
                    name : 'sublist_date',
                    line : i
                }); // "F"
                field2 = scriptContext.request.getSublistValue({
                    group : 'custpage_sublist',
                    name : 'sublist2',
                    line : i
                })
            }
            scriptContext.response.write(`You have entered: ${textField} ${dateField} ${currencyField} ${selectField} ${field1} ${field2}`);
        }
    }

    return {onRequest}
}); 

        