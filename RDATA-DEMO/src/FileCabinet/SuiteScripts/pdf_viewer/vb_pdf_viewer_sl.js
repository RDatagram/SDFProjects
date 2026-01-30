/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 * 
 * @description Suitelet to serve PDF files for inline viewing
 */
define(['N/file', 'N/error', 'N/log'],
    function(file, error, log) {
        
        function onRequest(context) {
            const logTitle = 'onRequest';
            
            try {
                const fileId = context.request.parameters.fileId;
                const isDownload = context.request.parameters.download === 'T';
                
                if (!fileId) {
                    throw error.create({
                        name: 'MISSING_FILE_ID',
                        message: 'File ID is required'
                    });
                }
                
                const pdfFile = file.load({ id: fileId });
                
                if (pdfFile.fileType !== file.Type.PDF) {
                    throw error.create({
                        name: 'INVALID_FILE_TYPE',
                        message: 'Not a PDF file'
                    });
                }
                
                // Use writeFile for proper binary PDF serving
                context.response.writeFile({
                    file: pdfFile,
                    isInline: !isDownload
                });
                
                log.audit(logTitle, 'PDF served: ' + pdfFile.name);
                
            } catch (e) {
                log.error(logTitle, e.toString());
                context.response.write('<html><body style="font-family:Arial;padding:40px;text-align:center;background:#525659;color:#fff;"><h2 style="color:#e74c3c;">Error</h2><p>' + e.message + '</p></body></html>');
            }
        }
        
        return { onRequest: onRequest };
    });
