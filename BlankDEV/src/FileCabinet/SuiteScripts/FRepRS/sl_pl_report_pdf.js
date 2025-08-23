/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/file', 'N/record', 'N/render','./fi_helper.js'],
/**
 * @param {file} file
 * @param {record} record
 * @param {render} render
 */
function(file, record, render, fi_helper) {
   
    /**
     * Definition of the Suitelet script trigger point.
     *
     * @param {Object} context
     * @param {ServerRequest} context.request - Encapsulation of the incoming request
     * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
     * @Since 2015.2
     */
    function onRequest(context) {
    	var req = context.request;
    	var cId = req.parameters.rplId;
    	// load pl_report_pdf.xml
    	var templateFile = file.load({
            id: "./pl_report_pdf.xml"
        });

        var renderer = render.create();

        renderer.templateContent = templateFile.getContents();

        // add record data source
        var objRecord = record.load({
            type: 'customrecord_snt_pl_report',
            id : cId
        });
        

		
        pdfJSON = fi_helper.prepareJSONforPDF(objRecord);
        
        renderer.addRecord({
            templateName: 'record',
            record: objRecord
        });

        renderer.addCustomDataSource({
            alias: "JSON",
            format: render.DataSource.JSON,
            data: JSON.stringify(pdfJSON)
        });       
        
        var plReportPDF = renderer.renderAsPdf();
        plReportPDF.folder = templateFile.folder;
        var idPDF = plReportPDF.save();
        var fo = file.load({id : idPDF})
        
        context.response.setHeader({
    		name : 'Content-Type',
    		value : 'application/pdf'
    	});
        context.response.write(fo.getContents());
    }

    return {
        onRequest: onRequest
    };
    
});
