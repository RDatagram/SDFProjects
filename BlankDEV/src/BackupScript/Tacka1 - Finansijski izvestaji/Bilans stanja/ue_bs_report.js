/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define(['N/log'], function(log) {

    function beforeLoad(scriptContext) {
        var form = scriptContext.form;
        var record = scriptContext.newRecord;
        var pdfFileId = record.getValue("custrecord_rsm_bs_report_pdf_file");
        var xmlFileId = record.getValue("custrecord_rsm_bs_report_xml_file");

        form.clientScriptModulePath = './cs_bs_report.js';
        form.addButton({
            id: 'custpage_btn_init_lines',
            label: 'Init lines',
            functionName: 'init_bs_lines'
        });
        form.addButton({
            id: 'custpage_btn_calc_lines',
            label: 'Calculate',
            functionName: 'calculate_bs_lines'
        });
        form.addButton({
            id: 'custpage_btn_recalc_lines',
            label: 'Recalculate XML lines',
            functionName: 'recalculate_xml_lines'
        });

        if (xmlFileId) {
            form.addButton({
                id: 'custpage_btn_delete_xml',
                label: 'Delete XML',
                functionName: 'delete_xml'
            });
        } else {
            form.addButton({
                id: 'custpage_btn_xml',
                label: 'XML',
                functionName: 'getXmlFile'
            });
        }
        
        if (pdfFileId) {
          form.addButton({
            id: 'custpage_btn_delete_pdf',
            label: 'Delete PDF',
            functionName: 'delete_pdf'
          });  
        } else {
            form.addButton({
                id: 'custpage_btn_pdf',
                label: 'PDF',
                functionName: 'getPdfFile'
            });
        }
        
    }

    return {
        beforeLoad: beforeLoad
    }
})