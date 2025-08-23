/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * 
 * Knjiga Evidencije Prometa (KEP Knjiga)
 */
define(['N/log', 'N/ui/serverWidget', 'N/ui/message', 'N/record'], function (log, serverWidget, message, record) {

    function beforeLoad(context) {
        if (context.type === context.UserEventType.VIEW) {

            var form = context.form;
            form.clientScriptModulePath = './rsm_kep_document_cs.js';

            // Get data
            var currentRecordData = context.newRecord;

            var params = {
                kepDocumentInternalId: currentRecordData.getValue('id'),
                date_start: currentRecordData.getValue("custrecord_rsm_kep_document_date_from"),
                date_end: currentRecordData.getValue("custrecord_rsm_kep_document_date_to"),
                subsidiary: currentRecordData.getValue("custrecord_rsm_kep_document_subsidiary"),
                location: currentRecordData.getValue("custrecord_rsm_kep_document_location")
            };

            form.addButton({
                id: "custpage_azuriraj_podatke",
                label: "Ažuriraj podatke",
                functionName: 'runMrScript(' + JSON.stringify(params) + ')'
            });
            form.addButton({
                id: "custpage_proveri_status",
                label: "Proveri status ažuriranja",
                functionName: 'checkTaskStatus'
            });
            form.addButton({
                id: "custpage_osvezi_stranicu",
                label: "Osveži stranicu",
                functionName: 'reloadPage'
            });
            form.addButton({
                id: "custpage_import",
                label: "Import polja iz druge KEP",
                functionName: 'importLines(' + JSON.stringify(params) + ')'
            });
            form.addButton({
                id: 'custpage_reset_local_storage',
                label: "Reset Local Storage",
                functionName: 'resetLocalStorage'
            });
            form.addButton({
                id: "custpage_obrisi_sve_linije",
                label: "Obriši sve linije",
                functionName: 'deleteAll(' + JSON.stringify(params) + ')'
            });
        }
    }

    return {
        beforeLoad: beforeLoad,
    };

});