/**
 * @NApiVersion 2.1
 * @NScriptType WorkflowActionScript
 * @description Workflow action to clear existing items and reload from original XML
 */
define(['N/record', 'N/log', './rdata_rb_parser_lib'], (record, log, parserLib) => {

    /**
     * Workflow action entry point
     * @param {Object} context
     * @param {Record} context.newRecord - Current record
     * @param {Record} context.oldRecord - Old record
     * @returns {Object} Result object
     */
    function onAction(context) {
        try {
            const statementRec = context.newRecord;
            const recordId = statementRec.id;

            log.audit('Workflow Action Started', 'Replacing items for Statement ID: ' + recordId);

            // Get the original XML from the record
            const originalXml = statementRec.getValue({ fieldId: 'custrecord_srb_original_xml' });

            if (!originalXml) {
                log.error('Missing XML', 'No original XML found on record ID: ' + recordId);
                return {
                    success: false,
                    error: 'No original XML found on this record'
                };
            }

            // Validate XML
            const validation = parserLib.validateXml(originalXml);
            if (!validation.valid) {
                log.error('Invalid XML', validation.error);
                return {
                    success: false,
                    error: 'Invalid XML: ' + validation.error
                };
            }

            // Parse XML to get line items
            const xml = require('N/xml');
            const xmlDoc = xml.Parser.fromString({ text: originalXml });
            const lineItemsData = parserLib.parseLineItems(xmlDoc);

            // Load the record in dynamic mode
            const statementRecLoaded = record.load({
                type: 'customrecord_srb_statement',
                id: recordId,
                isDynamic: true
            });

            // Get current line count
            const sublistId = 'recmachcustrecord_srb_line_parent_statement';
            const currentLineCount = statementRecLoaded.getLineCount({ sublistId: sublistId });

            log.audit('Clearing Lines', 'Removing ' + currentLineCount + ' existing lines');

            // Remove all existing lines (from bottom to top)
            for (let i = currentLineCount - 1; i >= 0; i--) {
                statementRecLoaded.removeLine({ sublistId: sublistId, line: i });
            }

            // Add new line items from XML
            let itemsAdded = 0;
            for (let i = 0; i < lineItemsData.length; i++) {
                const item = lineItemsData[i];

                // Select new line
                statementRecLoaded.selectNewLine({ sublistId: sublistId });

                // Set line item fields
                statementRecLoaded.setCurrentSublistValue({ sublistId: sublistId, fieldId: 'custrecord_srb_nalog_korisnik', value: item.nalogKorisnik || '' });
                statementRecLoaded.setCurrentSublistValue({ sublistId: sublistId, fieldId: 'custrecord_srb_mesto', value: item.mesto || '' });
                statementRecLoaded.setCurrentSublistValue({ sublistId: sublistId, fieldId: 'custrecord_srb_vas_broj_naloga', value: item.vasBrojNaloga || '' });
                statementRecLoaded.setCurrentSublistValue({ sublistId: sublistId, fieldId: 'custrecord_srb_broj_racuna_primaoca', value: item.brojRacunaPrimaoca || '' });
                statementRecLoaded.setCurrentSublistValue({ sublistId: sublistId, fieldId: 'custrecord_srb_opis', value: item.opis || '' });
                statementRecLoaded.setCurrentSublistValue({ sublistId: sublistId, fieldId: 'custrecord_srb_sifra_placanja', value: item.sifraPlacanja || '' });
                statementRecLoaded.setCurrentSublistValue({ sublistId: sublistId, fieldId: 'custrecord_srb_sifra_placanja_opis', value: item.sifraPlacanjaOpis || '' });
                statementRecLoaded.setCurrentSublistValue({ sublistId: sublistId, fieldId: 'custrecord_srb_duguje', value: parseFloat(item.duguje) || 0 });
                statementRecLoaded.setCurrentSublistValue({ sublistId: sublistId, fieldId: 'custrecord_srb_potrazuje', value: parseFloat(item.potrazuje) || 0 });
                statementRecLoaded.setCurrentSublistValue({ sublistId: sublistId, fieldId: 'custrecord_srb_model_zaduzenja', value: item.modelZaduzenja || '' });
                statementRecLoaded.setCurrentSublistValue({ sublistId: sublistId, fieldId: 'custrecord_srb_poziv_broj_zaduzenja', value: item.pozivBrojZaduzenja || '' });
                statementRecLoaded.setCurrentSublistValue({ sublistId: sublistId, fieldId: 'custrecord_srb_model_korisnika', value: item.modelKorisnika || '' });
                statementRecLoaded.setCurrentSublistValue({ sublistId: sublistId, fieldId: 'custrecord_srb_poziv_broj_korisnika', value: item.pozivBrojKorisnika || '' });
                statementRecLoaded.setCurrentSublistValue({ sublistId: sublistId, fieldId: 'custrecord_srb_broj_reklamaciju', value: item.brojReklamaciju || '' });
                statementRecLoaded.setCurrentSublistValue({ sublistId: sublistId, fieldId: 'custrecord_srb_referenca', value: item.referenca || '' });
                statementRecLoaded.setCurrentSublistValue({ sublistId: sublistId, fieldId: 'custrecord_srb_objasnjenje', value: item.objasnjenje || '' });

                if (item.datumValute) {
                    statementRecLoaded.setCurrentSublistValue({
                        sublistId: sublistId,
                        fieldId: 'custrecord_srb_datum_valute',
                        value: parserLib.parseSerbianDate(item.datumValute)
                    });
                }

                // Commit the line
                statementRecLoaded.commitLine({ sublistId: sublistId });
                itemsAdded++;
            }

            // Save the record
            const savedRecordId = statementRecLoaded.save();

            log.audit('Workflow Action Completed', {
                recordId: savedRecordId,
                itemsRemoved: currentLineCount,
                itemsAdded: itemsAdded
            });

            return {
                success: true,
                recordId: savedRecordId,
                itemsRemoved: currentLineCount,
                itemsAdded: itemsAdded,
                message: `Successfully replaced ${currentLineCount} items with ${itemsAdded} items from XML`
            };

        } catch (e) {
            log.error('Workflow Action Error', {
                error: e.message,
                stack: e.stack
            });

            return {
                success: false,
                error: e.message,
                stack: e.stack
            };
        }
    }

    return {
        onAction: onAction
    };
});