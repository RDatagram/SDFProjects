/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 * 
 * Email Scheduler
 * Custom suitelet page to manually start a MapReduce script for E-Mail Scheduler
 */
define(["N/ui/serverWidget", "N/query", "./rsm_email_sch_util"], function (serverWidget, query, rsm_email_sch_util) {

    function createFrom(recordType) {
        var form = serverWidget.createForm({
            title: 'E-Mail scheduler'
        });

        form.addSubmitButton({
            label: 'Reload'
        });
        form.addButton({
            id: 'runmrscript',
            label: "Pokreni Map/Reduce",
            functionName: 'runMrScript'
        });
        form.addButton({
            id: 'checkstatusbtn',
            label: "Proveri status",
            functionName: 'checkTaskStatus'
        });
        form.addButton({
            id: 'resetlocalstorage',
            label: "Reset Local Storage",
            functionName: 'resetLocalStorage'
        });

        var recordTypeField = form.addField({
            id: "custpage_record_type",
            type: serverWidget.FieldType.SELECT,
            label: "Tip transakcije"
        });
        recordTypeField.addSelectOption({
            text: 'Invoice',
            value: 'invoice',
            isSelected: (recordType === 'invoice')
        });
        recordTypeField.addSelectOption({
            text: 'Customer Deposit',
            value: 'customerdeposit',
            isSelected: (recordType === 'customerdeposit')
        });
        recordTypeField.addSelectOption({
            text: 'Credit Memo',
            value: 'creditmemo',
            isSelected: (recordType === 'creditmemo')
        });
        recordTypeField.addSelectOption({
            text: 'Sales Order',
            value: 'salesorder',
            isSelected: (recordType === 'salesorder')
        });
        recordTypeField.addSelectOption({
            text: 'Sales Order Estimate',
            value: 'customsale_rsm_so_estimate',
            isSelected: (recordType === 'customsale_rsm_so_estimate')
        });

        return form;
    }

    function createSublist(list) {
        list.addField({
            id: "tranid",
            type: serverWidget.FieldType.TEXT,
            label: "Tran ID",
            align: serverWidget.LayoutJustification.LEFT
        });
        list.addField({
            id: "tranview",
            type: serverWidget.FieldType.URL,
            label: "View"
        });
        list.getField('tranview').linkText = 'View';

        list.addField({
            id: "entity",
            type: serverWidget.FieldType.TEXT,
            label: "Customer"
        });
        list.addField({
            id: "trandate",
            type: serverWidget.FieldType.DATE,
            label: "Tran Date"
        });
        list.addField({
            id: "custbody_cust_dep_pdf_file",
            type: serverWidget.FieldType.TEXT,
            label: "PDF"
        });
    }

    function onRequest(context) {

        if (context.request.method === "POST") {
            var recordType = context.request.parameters.custpage_record_type;
        } else {
            var recordType = 'salesorder';
        }

        var form = createFrom(recordType);
        form.clientScriptModulePath = "./rsm_email_schedule_cs.js";

        var sublist = form.addSublist({
            id: 'custpage_sublist',
            label: 'Lista transakcija',
            type: serverWidget.SublistType.STATICLIST
        });

        createSublist(sublist);

        var toBeSent = rsm_email_sch_util.createMailList(recordType, rsm_email_sch_util.mapRecordStatus(recordType));

        for (var i = 0; i < toBeSent.length; i++) {

            sublist.setSublistValue({
                id: 'tranid',
                line: i,
                value: toBeSent[i].getValue('tranid')
            });
            sublist.setSublistValue({
                id: "tranview",
                line: i,
                value: '/app/accounting/transactions/transaction.nl?id=' + toBeSent[i].getValue('internalid')
            });
            sublist.setSublistValue({
                id: "trandate",
                line: i,
                value: toBeSent[i].getValue('trandate')
            });
            sublist.setSublistValue({
                id: "entity",
                line: i,
                value: toBeSent[i].getText('entity')
            });
            sublist.setSublistValue({
                id: "custbody_cust_dep_pdf_file",
                line: i,
                value: toBeSent[i].getText('custbody_cust_dep_pdf_file') || '/'
            });

        }

        context.response.writePage(form);
    }

    return {
        onRequest: onRequest
    };

})