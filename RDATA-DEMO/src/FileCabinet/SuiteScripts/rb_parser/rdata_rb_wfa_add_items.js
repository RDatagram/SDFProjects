/**
 * @NApiVersion 2.1
 * @NScriptType WorkflowActionScript
 * @description Workflow action to load original XML and add bank statement items
 */
define(['N/record', 'N/log', './rdata_rb_parser_lib','N/file','N/xml'], (record, log, parserLib,nFile,xml) => {

    /**
     * Workflow action entry point
     * @param {Object} context
     * @param {Record} context.newRecord - Current record
     * @param {Record} context.oldRecord - Old record
     * @returns {Object} Result object
     */
    function onAction(context) {

        log.debug({
            title: 'Workflow Action Started',
            details: 'Processing Statement ID: '
        });

        try {

            const statementRec = context.newRecord;
            log.debug({
                title: 'isDynamic',
                details: statementRec.isDynamic
            });
            const recordId = statementRec.id;

            log.audit('Workflow Action Started', 'Processing Statement ID: ' + recordId);

            const originalXml = nFile.load({
                id: statementRec.getValue({ fieldId: 'custrecord_xml_file' })
            }).getContents();


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

            const xmlDoc = xml.Parser.fromString({ text: originalXml });

            const headerData = parserLib.parseHeader(xmlDoc);

            statementRec.setValue({ fieldId: 'custrecord_srb_vrsta_izvoda', value: headerData.vrstaIzvoda });
            statementRec.setValue({ fieldId: 'custrecord_srb_izvod_id', value: headerData.izvodId });
            statementRec.setValue({ fieldId: 'custrecord_srb_broj_izvoda', value: parseInt(headerData.brojIzvoda) || 0 });
            statementRec.setValue({ fieldId: 'custrecord_srb_datum_izvoda', value: parserLib.parseSerbianDate(headerData.datumIzvoda) });
            statementRec.setValue({ fieldId: 'custrecord_srb_maticni_broj', value: headerData.maticniBroj });
            statementRec.setValue({ fieldId: 'custrecord_srb_komitent_naziv', value: headerData.komitentNaziv });
            statementRec.setValue({ fieldId: 'custrecord_srb_komitent_adresa', value: headerData.komitentAdresa });
            statementRec.setValue({ fieldId: 'custrecord_srb_komitent_mesto', value: headerData.komitentMesto });
            statementRec.setValue({ fieldId: 'custrecord_srb_partija', value: headerData.partija });
            statementRec.setValue({ fieldId: 'custrecord_srb_tip_racuna', value: headerData.tipRacuna });
            statementRec.setValue({ fieldId: 'custrecord_srb_prethodno_stanje', value: parseFloat(headerData.prethodnoStanje) || 0 });
            statementRec.setValue({ fieldId: 'custrecord_srb_dugovni_promet', value: parseFloat(headerData.dugovniPromet) || 0 });
            statementRec.setValue({ fieldId: 'custrecord_srb_potrazni_promet', value: parseFloat(headerData.potrazniPromet) || 0 });
            statementRec.setValue({ fieldId: 'custrecord_srb_novo_stanje', value: parseFloat(headerData.novoStanje) || 0 });
            statementRec.setValue({ fieldId: 'custrecord_srb_stanje_provizije', value: parseFloat(headerData.stanjeProvizije) || 0 });
            statementRec.setValue({ fieldId: 'custrecord_srb_dozvoljeni_minus', value: parseFloat(headerData.dozvoljeniMinus) || 0 });

            const lineItemsData = parserLib.parseLineItems(xmlDoc);

            if (!lineItemsData || lineItemsData.length === 0) {
                log.audit('No Line Items', 'No line items found in XML for record ID: ' + recordId);
                return {
                    success: true,
                    message: 'No line items to add',
                    itemsAdded: 0
                };
            }

            // Load the record in dynamic mode to add line items
            /*
            const statementRecLoaded = record.load({
                type: 'customrecord_srb_statement',
                id: recordId,
                isDynamic: true
            });
*/
            const statementRecLoaded = statementRec;

            // Get current line count
            const sublistId = 'recmachcustrecord_srb_line_parent_statement';
            const currentLineCount = statementRecLoaded.getLineCount({ sublistId: sublistId });

            log.audit('Current Lines', 'Existing line items: ' + currentLineCount);


            for (let i = currentLineCount - 1; i >= 0; i--) {
                statementRec.removeLine({ sublistId: sublistId, line: i });
            }
            log.audit('Cleared Lines', 'Removed ' + currentLineCount + ' existing lines');


            // Add new line items to sublist
            let itemsAdded = 0;
            for (let i = 0; i < lineItemsData.length; i++) {
                const item = lineItemsData[i];

                // Select new line
                //statementRec.selectNewLine({ sublistId: sublistId });

                // Set line item fields
                statementRec.setSublistValue({ sublistId: sublistId, fieldId: 'custrecord_srb_nalog_korisnik', value: item.nalogKorisnik || '',line:i });
                statementRec.setSublistValue({ sublistId: sublistId, fieldId: 'custrecord_srb_mesto', value: item.mesto || '',line:i });
                statementRec.setSublistValue({ sublistId: sublistId, fieldId: 'custrecord_srb_vas_broj_naloga', value: item.vasBrojNaloga || '',line:i });
                statementRec.setSublistValue({ sublistId: sublistId, fieldId: 'custrecord_srb_broj_racuna_primaoca', value: item.brojRacunaPrimaoca || '',line:i });
                statementRec.setSublistValue({ sublistId: sublistId, fieldId: 'custrecord_srb_opis', value: item.opis || '',line:i });
                statementRec.setSublistValue({ sublistId: sublistId, fieldId: 'custrecord_srb_sifra_placanja', value: item.sifraPlacanja || '',line:i });
                statementRec.setSublistValue({ sublistId: sublistId, fieldId: 'custrecord_srb_sifra_placanja_opis', value: item.sifraPlacanjaOpis || '',line:i });
                statementRec.setSublistValue({ sublistId: sublistId, fieldId: 'custrecord_srb_duguje', value: parseFloat(item.duguje) || 0,line:i });
                statementRec.setSublistValue({ sublistId: sublistId, fieldId: 'custrecord_srb_potrazuje', value: parseFloat(item.potrazuje) || 0,line:i });
                statementRec.setSublistValue({ sublistId: sublistId, fieldId: 'custrecord_srb_model_zaduzenja', value: item.modelZaduzenja || '',line:i });
                statementRec.setSublistValue({ sublistId: sublistId, fieldId: 'custrecord_srb_poziv_broj_zaduzenja', value: item.pozivBrojZaduzenja || '',line:i });
                statementRec.setSublistValue({ sublistId: sublistId, fieldId: 'custrecord_srb_model_korisnika', value: item.modelKorisnika || '' ,line:i});
                statementRec.setSublistValue({ sublistId: sublistId, fieldId: 'custrecord_srb_poziv_broj_korisnika', value: item.pozivBrojKorisnika || '',line:i });
                statementRec.setSublistValue({ sublistId: sublistId, fieldId: 'custrecord_srb_broj_reklamaciju', value: item.brojReklamaciju || '',line:i });
                statementRec.setSublistValue({ sublistId: sublistId, fieldId: 'custrecord_srb_referenca', value: item.referenca || '' ,line:i});
                statementRec.setSublistValue({ sublistId: sublistId, fieldId: 'custrecord_srb_objasnjenje', value: item.objasnjenje || '',line:i });

                if (item.datumValute) {
                    statementRec.setSublistValue({
                        sublistId: sublistId,
                        fieldId: 'custrecord_srb_datum_valute',
                        value: parserLib.parseSerbianDate(item.datumValute),
                        line:i
                    });
                }

                // Commit the line
                //statementRec.commitLine({ sublistId: sublistId });
                itemsAdded++;
            }

            // Save the record
            //const savedRecordId = statementRecLoaded.save();

            log.audit({title:'Workflow Action Completed', details:{
                itemsAdded: itemsAdded,
                totalItems: currentLineCount + itemsAdded}
            });

            return {
                success: true,
                itemsAdded: itemsAdded,
                previousItemCount: currentLineCount,
                totalItemCount: currentLineCount + itemsAdded,
                message: `Successfully added ${itemsAdded} items to statement`
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