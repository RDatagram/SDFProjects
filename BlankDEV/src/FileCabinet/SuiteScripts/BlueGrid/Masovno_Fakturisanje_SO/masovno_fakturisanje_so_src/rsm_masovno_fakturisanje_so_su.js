/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 * 
 * Masovno fakturisanje Sales Order-a
 * Custom suitelet page to manually start a MapReduce script which turns required sale orders into invoices
 */
define(['./rsm_masovno_fakturisanje_util', 'N/ui/serverWidget', 'N/record', 'N/search', 'N/file', 'N/runtime', 'N/log', 'N/https', 'N/url', 'N/query', 'N/format'], function (rsm_masovno_fakturisanje_util, serverWidget, record, search, file, runtime, log, https, url, query, format) {


    function createFrom(selectedSubsidiary) {
        var form = serverWidget.createForm({
            title: 'Masovno fakturisanje Sales Order-a'
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

        // Subsidiary field
        var subsidiaryField = form.addField({
            id: 'subsidiary',
            label: 'Subsidiary:',
            type: serverWidget.FieldType.SELECT
        });
        function getSubsidiaries() {
            var results = search.create({
                type: 'subsidiary',
                filters: [],
                columns: [
                    'internalid',
                    'name',
                    'country'
                ]
            }).run();

            var obj = {};
            results.each(function (result) {
                obj[result.getValue('internalid')] = {
                    internalid: result.getValue('internalid'),
                    name: result.getValue('name'),
                    country: result.getValue('country')
                }
                return true;
            });

            return obj;
        }
        var subsidiaries = getSubsidiaries();
        subsidiaryField.addSelectOption({
            value: 'T',
            text: "All",
            isSelected: (selectedSubsidiary === 'T')
        });
        for (var i in subsidiaries) {
            subsidiaryField.addSelectOption({
                value: subsidiaries[i].internalid,
                text: subsidiaries[i].internalid + '/' + subsidiaries[i].name,
                isSelected: (selectedSubsidiary === subsidiaries[i].internalid)
            });
        }

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
            id: "trandate",
            type: serverWidget.FieldType.DATE,
            label: "Tran Date"
        });
        list.addField({
            id: "entity",
            type: serverWidget.FieldType.TEXT,
            label: "Customer"
        });
        list.addField({
            id: "enddate",
            type: serverWidget.FieldType.DATE,
            label: "End Date"
        });
        list.addField({
            id: "total",
            type: serverWidget.FieldType.CURRENCY,
            label: "Total Amount"
        });
    }

    function onRequest(context) {

        var selectedSubsidiary = '';
        if (context.request.method === "POST") {
            selectedSubsidiary = context.request.parameters.subsidiary;
        } else {
            selectedSubsidiary = 'T'; // All
        }

        var form = createFrom(selectedSubsidiary);
        form.clientScriptModulePath = "./rsm_masovno_fakturisanje_so_cs.js";

        var sublist = form.addSublist({
            id: 'custpage_sublist',
            label: 'Lista transakcija',
            type: serverWidget.SublistType.STATICLIST
        });
        createSublist(sublist);

        // Get all the required Sales Orders
        var toBeTransformed = rsm_masovno_fakturisanje_util.getCandidateList(selectedSubsidiary);
        // log.debug("toBeTransformed", toBeTransformed);

        for (var i = 0; i < toBeTransformed.length; i++) {

            sublist.setSublistValue({
                id: 'tranid',
                line: i,
                value: toBeTransformed[i].getValue('tranid')
            });
            sublist.setSublistValue({
                id: "tranview",
                line: i,
                value: '/app/accounting/transactions/transaction.nl?id=' + toBeTransformed[i].getValue('internalid')
            });
            sublist.setSublistValue({
                id: "trandate",
                line: i,
                value: toBeTransformed[i].getValue('trandate')
            });
            sublist.setSublistValue({
                id: "entity",
                line: i,
                value: toBeTransformed[i].getText('entity')
            });
            sublist.setSublistValue({
                id: "enddate",
                line: i,
                value: toBeTransformed[i].getValue('enddate')
            });
            sublist.setSublistValue({
                id: "total",
                line: i,
                value: toBeTransformed[i].getValue('total')
            });

        }

        context.response.writePage(form);
    }

    return {
        onRequest: onRequest
    };

})