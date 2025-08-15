/**
 * @NApiVersion 2.1
 * @NScriptType WorkflowActionScript
 */
define(['N/file','./rdata-nbs-lib'],
    /**
 * @param fileModule
     * @param rdata_nbs_lib
 */
    (fileModule, rdata_nbs_lib) => {
        /**
         * Defines the WorkflowAction script trigger point.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.workflowId - Internal ID of workflow which triggered this action
         * @param {string} scriptContext.type - Event type
         * @param {Form} scriptContext.form - Current form that the script uses to interact with the record
         * @since 2016.1
         */
        const onAction = (scriptContext) => {

            const invoice = scriptContext.newRecord;
            let configOptions = {
                name : "NBS"
            }
            const configQr = rdata_nbs_lib.getConfig(configOptions);

            let pngFile = rdata_nbs_lib.generateQR(invoice,configQr);

            log.debug({
                title: 'Generate QR Code',
                details: pngFile,
            });

            let myFile = fileModule.create({
                name: invoice.getValue('tranid')+'_qr.png',
                fileType: fileModule.Type.PNGIMAGE,
                contents: pngFile,
                encoding: fileModule.Encoding.BASE64,
                folder: configQr.folder
            });

            const idQRCode = myFile.save();

            invoice.setValue({
                fieldId: 'custbody_rdata_invoice_qr_code',
                value: idQRCode
            })
        }

        return {onAction};
    });
