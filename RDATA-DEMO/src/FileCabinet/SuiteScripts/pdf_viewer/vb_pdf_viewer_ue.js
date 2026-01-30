/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 *
 * @description User Event Script to add Hide/Show PDF button on Vendor Bill
 *              Shows PDF in a side panel overlay (does not modify form layout)
 */
define(['N/runtime', 'N/url', 'N/search', 'N/log'],
    function(runtime, url, search, log) {

        const SCRIPT_ID = 'customscript_vb_pdf_viewer_sl';
        const DEPLOY_ID = 'customdeploy_vb_pdf_viewer_sl';

        /**
         * beforeLoad - Adds Hide/Show PDF button
         * @param {Object} context
         */
        function beforeLoad(context) {
            const logTitle = 'beforeLoad';

            try {
                // Only execute on view mode
                if (context.type !== context.UserEventType.VIEW) {
                    return;
                }

                const vendorBill = context.newRecord;
                const billId = vendorBill.id;
                const form = context.form;

                if (!billId) {
                    return;
                }

                // Find attached PDF
                const pdfInfo = getAttachedPdfFile(vendorBill, billId);

                if (!pdfInfo) {
                    log.debug(logTitle, 'No PDF attached to Vendor Bill: ' + billId);
                    return;
                }

                // Build Suitelet URL
                const suiteletUrl = url.resolveScript({
                    scriptId: SCRIPT_ID,
                    deploymentId: DEPLOY_ID,
                    params: {
                        fileId: pdfInfo.fileId,
                        billId: billId
                    }
                });

                // Add the button
                form.addButton({
                    id: 'custpage_toggle_pdf',
                    label: 'Hide / Show PDF',
                    functionName: 'togglePdfPanel'
                });

                // Add inline HTML with PDF panel
                const htmlField = form.addField({
                    id: 'custpage_pdf_html',
                    type: 'INLINEHTML',
                    label: ' '
                });

                htmlField.defaultValue = buildPdfPanelHtml(suiteletUrl, pdfInfo);

                log.audit(logTitle, 'PDF button added - Bill: ' + billId + ', File: ' + pdfInfo.fileId);

            } catch (e) {
                log.error(logTitle, 'Error: ' + e.toString());
            }
        }

        /**
         * Searches for PDF file
         */
        function getAttachedPdfFile(vendorBill, billId) {
            const logTitle = 'getAttachedPdfFile';

            try {
                // Check custom field first
                const linkedPdfId = vendorBill.getValue('custbody_vb_linked_pdf');
                if (linkedPdfId) {
                    return { fileId: linkedPdfId, source: 'custom_field' };
                }

                // Search attachments
                const attachmentSearch = search.create({
                    type: search.Type.TRANSACTION,
                    filters: [
                        ['internalid', 'anyof', billId],
                        'AND',
                        ['file.filetype', 'anyof', 'PDF']
                    ],
                    columns: [
                        search.createColumn({ name: 'internalid', join: 'file' }),
                        search.createColumn({ name: 'name', join: 'file' })
                    ]
                });

                const results = attachmentSearch.run().getRange({ start: 0, end: 1 });

                if (results && results.length > 0) {
                    return {
                        fileId: results[0].getValue({ name: 'internalid', join: 'file' }),
                        fileName: results[0].getValue({ name: 'name', join: 'file' }),
                        source: 'attachment'
                    };
                }

                return null;

            } catch (e) {
                log.error(logTitle, 'Error: ' + e.toString());
                return null;
            }
        }

        /**
         * Builds HTML for PDF side panel
         */
        function buildPdfPanelHtml(suiteletUrl, pdfInfo) {
            const fileName = pdfInfo.fileName || 'PDF Document';

            return `
<style>
    #pdfSidePanel {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 50%;
        height: 100%;
        background: #525659;
        z-index: 100000;
        box-shadow: 3px 0 10px rgba(0,0,0,0.3);
        flex-direction: column;
    }
    
    #pdfSidePanel.open {
        display: flex;
    }
    
    #pdfPanelHeader {
        background: #404040;
        color: #fff;
        padding: 10px 15px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-family: Arial, sans-serif;
        font-size: 13px;
        flex-shrink: 0;
    }
    
    #pdfPanelHeader .title {
        display: flex;
        align-items: center;
        gap: 8px;
    }
    
    #pdfPanelHeader .actions a {
        color: #fff;
        text-decoration: none;
        background: #555;
        padding: 5px 10px;
        border-radius: 3px;
        margin-left: 5px;
        font-size: 12px;
    }
    
    #pdfPanelHeader .actions a:hover {
        background: #666;
    }
    
    #pdfPanelHeader .close-btn {
        background: #c0392b;
        color: #fff;
        border: none;
        padding: 5px 12px;
        border-radius: 3px;
        cursor: pointer;
        font-size: 12px;
        margin-left: 10px;
    }
    
    #pdfPanelHeader .close-btn:hover {
        background: #e74c3c;
    }
    
    #pdfPanelContent {
        flex: 1;
        overflow: hidden;
    }
    
    #pdfPanelContent iframe {
        width: 100%;
        height: 100%;
        border: none;
    }
    
    /* Push entire page content to the right when panel is open */
    body.pdfPanelActive {
        margin-left: 50% !important;
        width: 50% !important;
    }
</style>

<div id="pdfSidePanel">
    <div id="pdfPanelHeader">
        <div class="title">
            <span>📄</span>
            <span>${fileName}</span>
            <span style="background:#666;padding:2px 6px;border-radius:3px;font-size:11px;margin-left:5px;">PDF Viewer</span>
        </div>
        <div class="actions">
            <a href="${suiteletUrl}" target="_blank">🔗 New Tab</a>
            <a href="${suiteletUrl}&download=T">⬇ Download</a>
            <button class="close-btn" onclick="togglePdfPanel()">✕ Hide</button>
        </div>
    </div>
    <div id="pdfPanelContent">
        <iframe id="pdfIframe" src="about:blank"></iframe>
    </div>
</div>

<script>
var pdfPanelOpen = false;
var pdfUrl = '${suiteletUrl}';

function togglePdfPanel() {
    var panel = document.getElementById('pdfSidePanel');
    var iframe = document.getElementById('pdfIframe');
    var body = document.body;
    
    if (pdfPanelOpen) {
        // Hide panel
        panel.classList.remove('open');
        body.classList.remove('pdfPanelActive');
        iframe.src = 'about:blank';
        pdfPanelOpen = false;
    } else {
        // Show panel and push content to right
        panel.classList.add('open');
        body.classList.add('pdfPanelActive');
        iframe.src = pdfUrl;
        pdfPanelOpen = true;
    }
}
</script>
            `;
        }

        return {
            beforeLoad: beforeLoad
        };
    });