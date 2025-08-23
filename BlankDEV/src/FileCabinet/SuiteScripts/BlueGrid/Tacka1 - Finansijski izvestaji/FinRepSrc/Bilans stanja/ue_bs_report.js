/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define(['N/log', 'N/query'], function(log, query) {

    function getLineCount(recordId) {
        var sublistQuery = query.runSuiteQL({
            query: 'SELECT COUNT(*) FROM customrecord_rsm_bs_report_lines WHERE custrecord_rsm_bs_report_parent = ?',
            params: [recordId]
        });
        return sublistQuery.results[0].values[0];
    }

    function beforeLoad(scriptContext) {
        if (scriptContext.type === scriptContext.UserEventType.VIEW) {
            var form = scriptContext.form;
            var record = scriptContext.newRecord;
            var pdfFileId = record.getValue("custrecord_rsm_bs_report_pdf_file");
            var xmlFileId = record.getValue("custrecord_rsm_bs_report_xml_file");
            var xlsFileId = record.getValue("custrecord_rsm_bs_report_xls_file");
            var lineCount = getLineCount(record.id);


            form.clientScriptModulePath = './cs_bs_report.js';
            form.addButton({
                id: 'custpage_btn_init_lines',
                label: 'Init lines',
                functionName: 'init_bs_lines'
            });
            if (lineCount > 0) {
                form.addButton({
                    id: 'custpage_btn_delete_lines',
                    label: 'Delete lines',
                    functionName: 'delete_report_lines'
                });
            }
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

            if (xlsFileId) {
                form.addButton({
                    id: 'custpage_btn_delete_xls',
                    label: 'Delete XLS',
                    functionName: 'delete_xls'
                });
            } else {
                form.addButton({
                    id: 'custpage_btn_xls',
                    label: 'XLS',
                    functionName: 'getXlsFile'
                });
            }
        }
        
    }

    return {
        beforeLoad: beforeLoad
    }
})