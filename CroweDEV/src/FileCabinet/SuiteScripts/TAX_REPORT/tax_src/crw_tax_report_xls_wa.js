/**
 * @NApiVersion 2.1
 * @NScriptType WorkflowActionScript
 */
define(['N/file', 'N/render', './crw_tax_report_util'],
    /**
     * @param{file} file
     * @param{render} render
     * @param crw_util
     */
    (file, render, crw_util) => {
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

            const taxRepRecord = scriptContext.newRecord;
            const popdvMap = crw_util.getPopdvCodes();

            const TAXBASEFIELD      = 'custrecord_crw_taxrep_popdv_taxbase';
            const TAXAMOUNTFIELD    = 'custrecord_crw_taxrep_popdv_taxamount';

            const R_TAXBASEFIELD  = 'custrecord_crw_taxrep_popdv_rtaxbase';
            const R_TAXAMOUNTFIELD    = 'custrecord_crw_taxrep_popdv_rtaxamount';

            /**
             *
             * @type {{popdvCode: string, popdvMap: {}, taxRepRecord: Record, popdvField : string}}
             *
             */
            let popdvValueOptions = {
                "taxRepRecord" : taxRepRecord,
                "popdvMap" : popdvMap,
                "popdvCode": "",
                "popdvField": ""
            }
            let popdvValue;

            const templateFile = file.load({
                id: './POPDV.xml'
            });
            const content = templateFile.getContents();

            let renderer = render.create();
            renderer.templateContent = content;


/*
            let popdvData = {
                "POPDV_1.1_OO": 0.00,

                "POPDV_3.1_OO" : 0.00,
                "POPDV_3.1_OP" : 0.00,
                "POPDV_3.1_PO" : 0.00,
                "POPDV_3.1_PP" : 0.00,

                "POPDV_3.2_OO" : 0.00,
                "POPDV_3.2_OP" : 0.00,
                "POPDV_3.2_PO" : 0.00,
                "POPDV_3.2_PP" : 0.00,

                "POPDV_3.3_OO" : 0.00,
                "POPDV_3.3_OP" : 0.00,
                "POPDV_3.3_PO" : 0.00,
                "POPDV_3.3_PP" : 0.00,

                "POPDV_3.9_OO" : 0.00,
                "POPDV_3.9_OP" : 0.00,
                "POPDV_3.9_PO" : 0.00,
                "POPDV_3.9_PP" : 0.00,

                "POPDV_3a.2_OP": 0.00,

                "POPDV_8a.2_OO" : 0.00,
                "POPDV_8a.2_OP" : 0.00,
                "POPDV_8a.2_PO" : 0.00,
                "POPDV_8a.2_PP" : 0.00,

                "POPDV_8g.1_OO" : 0.00,
                "POPDV_8g.1_OP" : 0.00,
                "POPDV_8g.1_PO" : 0.00,
                "POPDV_8g.1_PP" : 0.00,

                "POPDV_8e.2_OO" : 0.00,
                "POPDV_8e.2_OP" : 0.00,
                "POPDV_8e.2_PO" : 0.00,
                "POPDV_8e.2_PP" : 0.00,


            };
*/

            let popdvData = {};

            function popdvDataUpdate(_popdvCode,_popdvField,_excelField) {

                popdvValueOptions["popdvCode"] = _popdvCode;
                popdvValueOptions["popdvField"] = _popdvField; // _popdvField

                popdvValue = crw_util.getPopdvValue(popdvValueOptions);

                if (popdvValue.found) {
                    popdvData[_excelField] =  popdvData[_excelField] + popdvValue.value;  // add to previous sum
                }
            }

            let poPdvDef = [
                {"pdvCode" : "1.1", "pdvField" : TAXBASEFIELD,      "cell" : "POPDV_1.1_OO"},
                {"pdvCode" : "1.2", "pdvField" : TAXBASEFIELD,      "cell" : "POPDV_1.2_OO"},
                {"pdvCode" : "1.3", "pdvField" : TAXBASEFIELD,      "cell" : "POPDV_1.3_OO"},
                {"pdvCode" : "1.4", "pdvField" : TAXBASEFIELD,      "cell" : "POPDV_1.4_OO"},
                {"pdvCode" : "1.6", "pdvField" : TAXBASEFIELD,      "cell" : "POPDV_1.6_OO"},
                {"pdvCode" : "1.7", "pdvField" : TAXBASEFIELD,      "cell" : "POPDV_1.7_OO"},

                {"pdvCode" : "2.1", "pdvField" : TAXBASEFIELD,      "cell" : "POPDV_2.1_OO"},
                {"pdvCode" : "2.2", "pdvField" : TAXBASEFIELD,      "cell" : "POPDV_2.2_OO"},
                {"pdvCode" : "2.3", "pdvField" : TAXBASEFIELD,      "cell" : "POPDV_2.3_OO"},
                {"pdvCode" : "2.4", "pdvField" : TAXBASEFIELD,      "cell" : "POPDV_2.4_OO"},
                {"pdvCode" : "2.6", "pdvField" : TAXBASEFIELD,      "cell" : "POPDV_2.6_OO"},
                {"pdvCode" : "2.7", "pdvField" : TAXBASEFIELD,      "cell" : "POPDV_2.7_OO"},

                {"pdvCode" : "3.1", "pdvField" : TAXBASEFIELD,      "cell" : "POPDV_3.1_OO"},
                {"pdvCode" : "3.1", "pdvField" : TAXAMOUNTFIELD,    "cell" : "POPDV_3.1_OP"},
                {"pdvCode" : "3.1", "pdvField" : R_TAXBASEFIELD,    "cell" : "POPDV_3.1_PO"},
                {"pdvCode" : "3.1", "pdvField" : R_TAXAMOUNTFIELD,  "cell" : "POPDV_3.1_PP"},

                {"pdvCode" : "3.2", "pdvField" : TAXBASEFIELD,      "cell" : "POPDV_3.2_OO"},
                {"pdvCode" : "3.2", "pdvField" : TAXAMOUNTFIELD,    "cell" : "POPDV_3.2_OP"},
                {"pdvCode" : "3.2", "pdvField" : R_TAXBASEFIELD,    "cell" : "POPDV_3.2_PO"},
                {"pdvCode" : "3.2", "pdvField" : R_TAXAMOUNTFIELD,  "cell" : "POPDV_3.2_PP"},

                {"pdvCode" : "3.3", "pdvField" : TAXBASEFIELD,      "cell" : "POPDV_3.3_OO"},
                {"pdvCode" : "3.3", "pdvField" : R_TAXBASEFIELD,    "cell" : "POPDV_3.3_PO"},

                {"pdvCode" : "3.4", "pdvField" : TAXBASEFIELD,      "cell" : "POPDV_3.4_OO"},
                {"pdvCode" : "3.4", "pdvField" : R_TAXBASEFIELD,    "cell" : "POPDV_3.4_PO"},

                {"pdvCode" : "3.5", "pdvField" : TAXBASEFIELD,      "cell" : "POPDV_3.5_OO"},
                {"pdvCode" : "3.5", "pdvField" : TAXAMOUNTFIELD,    "cell" : "POPDV_3.5_OP"},
                {"pdvCode" : "3.5", "pdvField" : R_TAXBASEFIELD,    "cell" : "POPDV_3.5_PO"},
                {"pdvCode" : "3.5", "pdvField" : R_TAXAMOUNTFIELD,  "cell" : "POPDV_3.5_PP"},

                {"pdvCode" : "3.6", "pdvField" : TAXBASEFIELD,      "cell" : "POPDV_3.6_OO"},
                {"pdvCode" : "3.6", "pdvField" : TAXAMOUNTFIELD,    "cell" : "POPDV_3.6_OP"},
                {"pdvCode" : "3.6", "pdvField" : R_TAXBASEFIELD,    "cell" : "POPDV_3.6_PO"},
                {"pdvCode" : "3.6", "pdvField" : R_TAXAMOUNTFIELD,  "cell" : "POPDV_3.6_PP"},

                {"pdvCode" : "3.7", "pdvField" : TAXBASEFIELD,      "cell" : "POPDV_3.7_OO"},
                {"pdvCode" : "3.7", "pdvField" : TAXAMOUNTFIELD,    "cell" : "POPDV_3.7_OP"},
                {"pdvCode" : "3.7", "pdvField" : R_TAXBASEFIELD,    "cell" : "POPDV_3.7_PO"},
                {"pdvCode" : "3.7", "pdvField" : R_TAXAMOUNTFIELD,  "cell" : "POPDV_3.7_PP"},

                {"pdvCode" : "3.9", "pdvField" : TAXBASEFIELD,      "cell" : "POPDV_3.9_OO"},
                {"pdvCode" : "3.9", "pdvField" : TAXAMOUNTFIELD,    "cell" : "POPDV_3.9_OP"},
                {"pdvCode" : "3.9", "pdvField" : R_TAXBASEFIELD,    "cell" : "POPDV_3.9_PO"},
                {"pdvCode" : "3.9", "pdvField" : R_TAXAMOUNTFIELD,  "cell" : "POPDV_3.9_PP"},

                // 3a Section

                {"pdvCode" : "3a.1", "pdvField" : TAXAMOUNTFIELD,   "cell" : "POPDV_3a.1_OP"},
                {"pdvCode" : "3a.1", "pdvField" : R_TAXAMOUNTFIELD,   "cell" : "POPDV_3a.1_PP"},

                {"pdvCode" : "3a.2", "pdvField" : TAXAMOUNTFIELD,   "cell" : "POPDV_3a.2_OP"},
                {"pdvCode" : "3a.2", "pdvField" : R_TAXAMOUNTFIELD,   "cell" : "POPDV_3a.2_PP"},

                {"pdvCode" : "3a.3", "pdvField" : TAXAMOUNTFIELD,   "cell" : "POPDV_3a.3_OP"},
                {"pdvCode" : "3a.3", "pdvField" : R_TAXAMOUNTFIELD,   "cell" : "POPDV_3a.3_PP"},

                {"pdvCode" : "3a.4", "pdvField" : TAXAMOUNTFIELD,   "cell" : "POPDV_3a.4_OP"},
                {"pdvCode" : "3a.4", "pdvField" : R_TAXAMOUNTFIELD,   "cell" : "POPDV_3a.4_PP"},

                {"pdvCode" : "3a.5", "pdvField" : TAXAMOUNTFIELD,   "cell" : "POPDV_3a.5_OP"},
                {"pdvCode" : "3a.5", "pdvField" : R_TAXAMOUNTFIELD,   "cell" : "POPDV_3a.5_PP"},

                {"pdvCode" : "3a.6", "pdvField" : TAXAMOUNTFIELD,   "cell" : "POPDV_3a.6_OP"},
                {"pdvCode" : "3a.6", "pdvField" : R_TAXAMOUNTFIELD,   "cell" : "POPDV_3a.6_PP"},

                // 3a.7 Summary

                {"pdvCode" : "3a.8", "pdvField" : TAXAMOUNTFIELD,   "cell" : "POPDV_3a.8_OP"},
                {"pdvCode" : "3a.8", "pdvField" : R_TAXAMOUNTFIELD,   "cell" : "POPDV_3a.8_PP"},

                // SubTable 6

                // 6.1 section
                {"pdvCode" : "6.1", "pdvField" : TAXBASEFIELD,     "cell" : "POPDV_6.1_OO"},

                {"pdvCode" : "6.2.1", "pdvField" : TAXBASEFIELD,     "cell" : "POPDV_6.2.1_OO"},
                {"pdvCode" : "6.2.1", "pdvField" : R_TAXBASEFIELD,   "cell" : "POPDV_6.2.1_PO"},
                {"pdvCode" : "6.2.2", "pdvField" : TAXBASEFIELD,     "cell" : "POPDV_6.2.2_OO"},
                {"pdvCode" : "6.2.2", "pdvField" : R_TAXBASEFIELD,   "cell" : "POPDV_6.2.2_PO"},
                {"pdvCode" : "6.2.3", "pdvField" : TAXBASEFIELD,     "cell" : "POPDV_6.2.3_OO"},
                {"pdvCode" : "6.2.3", "pdvField" : R_TAXBASEFIELD,   "cell" : "POPDV_6.2.3_PO"},

                {"pdvCode" : "6.4", "pdvField" : TAXAMOUNTFIELD,   "cell" : "POPDV_6.4_OP"},
                {"pdvCode" : "6.4", "pdvField" : R_TAXAMOUNTFIELD, "cell" : "POPDV_6.4_PP"},

                {"pdvCode" : "8a.1", "pdvField" : TAXBASEFIELD,     "cell" : "POPDV_8a.1_OO"},
                {"pdvCode" : "8a.1", "pdvField" : TAXAMOUNTFIELD,   "cell" : "POPDV_8a.1_OP"},
                {"pdvCode" : "8a.1", "pdvField" : R_TAXBASEFIELD,   "cell" : "POPDV_8a.1_PO"},
                {"pdvCode" : "8a.1", "pdvField" : R_TAXAMOUNTFIELD, "cell" : "POPDV_8a.1_PP"},

                {"pdvCode" : "8a.2", "pdvField" : TAXBASEFIELD,     "cell" : "POPDV_8a.2_OO"},
                {"pdvCode" : "8a.2", "pdvField" : TAXAMOUNTFIELD,   "cell" : "POPDV_8a.2_OP"},
                {"pdvCode" : "8a.2", "pdvField" : R_TAXBASEFIELD,   "cell" : "POPDV_8a.2_PO"},
                {"pdvCode" : "8a.2", "pdvField" : R_TAXAMOUNTFIELD, "cell" : "POPDV_8a.2_PP"},

                {"pdvCode" : "8a.3", "pdvField" : TAXBASEFIELD,     "cell" : "POPDV_8a.3_OO"},
                {"pdvCode" : "8a.3", "pdvField" : TAXAMOUNTFIELD,   "cell" : "POPDV_8a.3_OP"},
                {"pdvCode" : "8a.3", "pdvField" : R_TAXBASEFIELD,   "cell" : "POPDV_8a.3_PO"},
                {"pdvCode" : "8a.3", "pdvField" : R_TAXAMOUNTFIELD, "cell" : "POPDV_8a.3_PP"},

                {"pdvCode" : "8a.4", "pdvField" : TAXBASEFIELD,     "cell" : "POPDV_8a.4_OO"},
                {"pdvCode" : "8a.4", "pdvField" : TAXAMOUNTFIELD,   "cell" : "POPDV_8a.4_OP"},
                {"pdvCode" : "8a.4", "pdvField" : R_TAXBASEFIELD,   "cell" : "POPDV_8a.4_PO"},
                {"pdvCode" : "8a.4", "pdvField" : R_TAXAMOUNTFIELD, "cell" : "POPDV_8a.4_PP"},

                {"pdvCode" : "8a.5", "pdvField" : TAXBASEFIELD,     "cell" : "POPDV_8a.5_OO"},
                {"pdvCode" : "8a.5", "pdvField" : TAXAMOUNTFIELD,   "cell" : "POPDV_8a.5_OP"},
                {"pdvCode" : "8a.5", "pdvField" : R_TAXBASEFIELD,   "cell" : "POPDV_8a.5_PO"},
                {"pdvCode" : "8a.5", "pdvField" : R_TAXAMOUNTFIELD, "cell" : "POPDV_8a.5_PP"},

                // 8a.6 Summary

                {"pdvCode" : "8a.7", "pdvField" : TAXBASEFIELD,     "cell" : "POPDV_8a.7_OO"},
                {"pdvCode" : "8a.7", "pdvField" : TAXAMOUNTFIELD,   "cell" : "POPDV_8a.7_OP"},
                {"pdvCode" : "8a.7", "pdvField" : R_TAXBASEFIELD,   "cell" : "POPDV_8a.7_PO"},
                {"pdvCode" : "8a.7", "pdvField" : R_TAXAMOUNTFIELD, "cell" : "POPDV_8a.7_PP"},

                // 8b Section

                {"pdvCode" : "8b.1", "pdvField" : TAXBASEFIELD,     "cell" : "POPDV_8b.1_OO"},
                {"pdvCode" : "8b.1", "pdvField" : R_TAXBASEFIELD,   "cell" : "POPDV_8b.1_PO"},
                {"pdvCode" : "8b.2", "pdvField" : TAXBASEFIELD,     "cell" : "POPDV_8b.2_OO"},
                {"pdvCode" : "8b.2", "pdvField" : R_TAXBASEFIELD,   "cell" : "POPDV_8b.2_PO"},
                {"pdvCode" : "8b.3", "pdvField" : TAXBASEFIELD,     "cell" : "POPDV_8b.3_OO"},
                {"pdvCode" : "8b.3", "pdvField" : R_TAXBASEFIELD,   "cell" : "POPDV_8b.3_PO"},
                {"pdvCode" : "8b.4", "pdvField" : TAXBASEFIELD,     "cell" : "POPDV_8b.4_OO"},
                {"pdvCode" : "8b.4", "pdvField" : R_TAXBASEFIELD,   "cell" : "POPDV_8b.4_PO"},
                {"pdvCode" : "8b.5", "pdvField" : TAXBASEFIELD,     "cell" : "POPDV_8b.5_OO"},
                {"pdvCode" : "8b.5", "pdvField" : R_TAXBASEFIELD,   "cell" : "POPDV_8b.5_PO"},
                // 8b.6 summary
                {"pdvCode" : "8b.7", "pdvField" : TAXBASEFIELD,     "cell" : "POPDV_8b.7_OO"},
                {"pdvCode" : "8b.7", "pdvField" : R_TAXBASEFIELD,   "cell" : "POPDV_8b.7_PO"},

                // 8v Section
                // standard and reduce base goes to the same cell ... sum = sum + value

                {"pdvCode" : "8v.1", "pdvField" : TAXBASEFIELD,     "cell" : "POPDV_8v.1_OO"},
                {"pdvCode" : "8v.1", "pdvField" : R_TAXBASEFIELD,   "cell" : "POPDV_8v.1_OO"},
                {"pdvCode" : "8v.2", "pdvField" : TAXBASEFIELD,     "cell" : "POPDV_8v.2_OO"},
                {"pdvCode" : "8v.2", "pdvField" : R_TAXBASEFIELD,   "cell" : "POPDV_8v.2_OO"},
                {"pdvCode" : "8v.3", "pdvField" : TAXBASEFIELD,     "cell" : "POPDV_8v.3_OO"},
                {"pdvCode" : "8v.3", "pdvField" : R_TAXBASEFIELD,   "cell" : "POPDV_8v.3_OO"},

                {"pdvCode" : "8g.1", "pdvField" : TAXBASEFIELD,     "cell" : "POPDV_8g.1_OO"},
                {"pdvCode" : "8g.1", "pdvField" : R_TAXBASEFIELD,   "cell" : "POPDV_8g.1_PO"},
                {"pdvCode" : "8g.2", "pdvField" : TAXBASEFIELD,     "cell" : "POPDV_8g.2_OO"},
                {"pdvCode" : "8g.2", "pdvField" : R_TAXBASEFIELD,   "cell" : "POPDV_8g.2_PO"},
                {"pdvCode" : "8g.3", "pdvField" : TAXBASEFIELD,     "cell" : "POPDV_8g.3_OO"},
                {"pdvCode" : "8g.3", "pdvField" : R_TAXBASEFIELD,   "cell" : "POPDV_8g.3_PO"},
                {"pdvCode" : "8g.4", "pdvField" : TAXBASEFIELD,     "cell" : "POPDV_8g.4_OO"},
                {"pdvCode" : "8g.4", "pdvField" : R_TAXBASEFIELD,   "cell" : "POPDV_8g.4_PO"},
                // 8g.5 summary
                {"pdvCode" : "8g.6", "pdvField" : TAXBASEFIELD,     "cell" : "POPDV_8g.6_OO"},
                {"pdvCode" : "8g.6", "pdvField" : R_TAXBASEFIELD,   "cell" : "POPDV_8g.6_PO"},

                // 8d section
                {"pdvCode" : "8d.1", "pdvField" : TAXBASEFIELD,     "cell" : "POPDV_8d.1_OO"},
                {"pdvCode" : "8d.1", "pdvField" : R_TAXBASEFIELD,   "cell" : "POPDV_8d.1_OO"},
                {"pdvCode" : "8d.2", "pdvField" : TAXBASEFIELD,     "cell" : "POPDV_8d.2_OO"},
                {"pdvCode" : "8d.2", "pdvField" : R_TAXBASEFIELD,   "cell" : "POPDV_8d.2_OO"},
                {"pdvCode" : "8d.3", "pdvField" : TAXBASEFIELD,     "cell" : "POPDV_8d.3_OO"},
                {"pdvCode" : "8d.3", "pdvField" : R_TAXBASEFIELD,   "cell" : "POPDV_8d.3_OO"},

                // 8e section = only TAX
                {"pdvCode" : "8e.1", "pdvField" : TAXBASEFIELD,     "cell" : "POPDV_8e.1_OO"},
                {"pdvCode" : "8e.1", "pdvField" : TAXAMOUNTFIELD,   "cell" : "POPDV_8e.1_PDV"},
                {"pdvCode" : "8e.1", "pdvField" : R_TAXBASEFIELD,   "cell" : "POPDV_8e.1_PO"},
                {"pdvCode" : "8e.1", "pdvField" : R_TAXAMOUNTFIELD, "cell" : "POPDV_8e.1_PDV"},

                {"pdvCode" : "8e.2", "pdvField" : TAXBASEFIELD,     "cell" : "POPDV_8e.2_OO"},
                {"pdvCode" : "8e.2", "pdvField" : TAXAMOUNTFIELD,   "cell" : "POPDV_8e.2_PDV"},
                {"pdvCode" : "8e.2", "pdvField" : R_TAXBASEFIELD,   "cell" : "POPDV_8e.2_PO"},
                {"pdvCode" : "8e.2", "pdvField" : R_TAXAMOUNTFIELD, "cell" : "POPDV_8e.2_PDV"} ,

                {"pdvCode" : "8e.3", "pdvField" : TAXBASEFIELD,     "cell" : "POPDV_8e.3_OO"},
                {"pdvCode" : "8e.3", "pdvField" : TAXAMOUNTFIELD,   "cell" : "POPDV_8e.3_PDV"},
                {"pdvCode" : "8e.3", "pdvField" : R_TAXBASEFIELD,   "cell" : "POPDV_8e.3_PO"},
                {"pdvCode" : "8e.3", "pdvField" : R_TAXAMOUNTFIELD, "cell" : "POPDV_8e.3_PDV"},

                {"pdvCode" : "8e.4", "pdvField" : TAXBASEFIELD,     "cell" : "POPDV_8e.4_OO"},
                {"pdvCode" : "8e.4", "pdvField" : TAXAMOUNTFIELD,   "cell" : "POPDV_8e.4_PDV"},
                {"pdvCode" : "8e.4", "pdvField" : R_TAXBASEFIELD,   "cell" : "POPDV_8e.4_PO"},
                {"pdvCode" : "8e.4", "pdvField" : R_TAXAMOUNTFIELD, "cell" : "POPDV_8e.4_PDV"}

            ]

            // Set Zero
            for (let pd = 0; pd < poPdvDef.length;pd++){
                let item = poPdvDef[pd];
                popdvData[item.cell] = 0.00;
            }

            // Let's sum
            for (let pd = 0; pd < poPdvDef.length;pd++){
                let item = poPdvDef[pd];
                popdvDataUpdate(item.pdvCode,item.pdvField,item.cell);
            }

            //popdvData["POPDV_6.4_PDV"] = popdvData["POPDV_6.4_OP"] + popdvData["POPDV_6.4_PP"];

            let jsonObj = {
                popdvObj : popdvData
            };

            renderer.addCustomDataSource({
                format: render.DataSource.JSON,
                alias: "JSON",
                data: JSON.stringify(jsonObj)
            });

            const xmlString = renderer.renderAsString();

            let xlsFile = file.create({
                name : 'POPDV_za_period.xls',
                fileType : file.Type.XMLDOC,
                contents : xmlString
            });

            xlsFile.folder = templateFile.folder;

            const idFile = xlsFile.save({

            });

            taxRepRecord.setValue({
                fieldId : 'custrecord_crw_taxrep_excel_file',
                value : idFile
            })
        }

        return {onAction};
    });
