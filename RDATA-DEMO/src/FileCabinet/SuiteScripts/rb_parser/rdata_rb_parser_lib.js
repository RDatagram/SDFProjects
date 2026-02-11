/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 * @description Serbian Bank Statement Parser Library
 * This module provides functions to parse Serbian bank statement XML files
 * and create records in NetSuite
 */
define(['N/record', 'N/xml', 'N/log', 'N/search', 'N/query'], (record, xml, log, search, query) => {

    /**
     * Parses Serbian bank statement XML and creates records
     * @param {string} xmlString - The XML content to parse
     * @param {Object} options - Optional parameters
     * @param {boolean} options.skipDuplicateCheck - Skip checking for duplicate statements
     * @param {boolean} options.dryRun - Parse without creating records, returns parsed data
     * @returns {Object} Result object with success status and data
     */
    function parseBankStatement(xmlString, options) {
        options = options || {};

        try {
            if (!xmlString) {
                throw new Error('XML content is required');
            }

            // Parse XML
            const xmlDoc = xml.Parser.fromString({ text: xmlString });

            // Extract header data
            const headerData = parseHeader(xmlDoc);

            // Check for duplicates unless skipped
            if (!options.skipDuplicateCheck) {
                const duplicate = checkDuplicate(headerData);
                if (duplicate) {
                    return {
                        success: false,
                        isDuplicate: true,
                        duplicateRecordId: duplicate,
                        message: `Statement ${headerData.brojIzvoda} already exists (Record ID: ${duplicate})`
                    };
                }
            }

            // Extract line items data
            const lineItemsData = parseLineItems(xmlDoc);

            // If dry run, return parsed data without creating records
            if (options.dryRun) {
                return {
                    success: true,
                    dryRun: true,
                    headerData: headerData,
                    lineItemsData: lineItemsData
                };
            }

            // Create header record with line items as sublist
            const headerRecordId = createStatementWithLines(headerData, lineItemsData, xmlString);

            return {
                success: true,
                headerRecordId: headerRecordId,
                lineItemsCount: lineItemsData.length,
                message: `Imported statement ${headerData.brojIzvoda} with ${lineItemsData.length} transactions`
            };

        } catch (e) {
            log.error('parseBankStatement Error', e);
            return {
                success: false,
                error: e.message,
                stack: e.stack
            };
        }
    }

    /**
     * Parses the header (Zaglavlje) section of the XML
     * @param {Object} xmlDoc - Parsed XML document
     * @returns {Object} Header data object
     */
    function parseHeader(xmlDoc) {
        try {
            const zaglavlje = xmlDoc.getElementsByTagName({ tagName: 'Zaglavlje' })[0];

            if (!zaglavlje) {
                throw new Error('Missing Zaglavlje element in XML');
            }

            return {
                vrstaIzvoda: zaglavlje.getAttribute({ name: 'VrstaIzvoda' }) || '',
                izvodId: zaglavlje.getAttribute({ name: 'IzvodID' }) || '',
                brojIzvoda: zaglavlje.getAttribute({ name: 'BrojIzvoda' }) || '',
                datumIzvoda: zaglavlje.getAttribute({ name: 'DatumIzvoda' }) || '',
                maticniBroj: zaglavlje.getAttribute({ name: 'MaticniBroj' }) || '',
                komitentNaziv: zaglavlje.getAttribute({ name: 'KomitentNaziv' }) || '',
                komitentAdresa: zaglavlje.getAttribute({ name: 'KomitentAdresa' }) || '',
                komitentMesto: zaglavlje.getAttribute({ name: 'KomitentMesto' }) || '',
                partija: zaglavlje.getAttribute({ name: 'Partija' }) || '',
                tipRacuna: zaglavlje.getAttribute({ name: 'TipRacuna' }) || '',
                prethodnoStanje: zaglavlje.getAttribute({ name: 'PrethodnoStanje' }) || '0',
                dugovniPromet: zaglavlje.getAttribute({ name: 'DugovniPromet' }) || '0',
                potrazniPromet: zaglavlje.getAttribute({ name: 'PotrazniPromet' }) || '0',
                novoStanje: zaglavlje.getAttribute({ name: 'NovoStanje' }) || '0',
                stanjeProvizije: zaglavlje.getAttribute({ name: 'StanjeObracunateProvizije' }) || '0',
                dozvoljeniMinus: zaglavlje.getAttribute({ name: 'DozvoljeniMinus' }) || '0'
            };
        } catch (e) {
            log.error('parseHeader Error', e);
            throw e;
        }
    }

    /**
     * Parses line items (Stavke) from the XML
     * @param {Object} xmlDoc - Parsed XML document
     * @returns {Array} Array of line item data objects
     */
    function parseLineItems(xmlDoc) {
        try {
            const stavke = xmlDoc.getElementsByTagName({ tagName: 'Stavke' });
            const lineItems = [];

            for (let i = 0; i < stavke.length; i++) {
                const stavka = stavke[i];

                lineItems.push({
                    nalogKorisnik: stavka.getAttribute({ name: 'NalogKorisnik' }) || '',
                    mesto: stavka.getAttribute({ name: 'Mesto' }) || '',
                    vasBrojNaloga: stavka.getAttribute({ name: 'VasBrojNaloga' }) || '',
                    brojRacunaPrimaoca: stavka.getAttribute({ name: 'BrojRacunaPrimaocaPosiljaoca' }) || '',
                    opis: stavka.getAttribute({ name: 'Opis' }) || '',
                    sifraPlacanja: stavka.getAttribute({ name: 'SifraPlacanja' }) || '',
                    sifraPlacanjaOpis: stavka.getAttribute({ name: 'SifraPlacanjaOpis' }) || '',
                    duguje: stavka.getAttribute({ name: 'Duguje' }) || '0',
                    potrazuje: stavka.getAttribute({ name: 'Potrazuje' }) || '0',
                    modelZaduzenja: stavka.getAttribute({ name: 'ModelZaduzenjaOdobrenja' }) || '',
                    pozivBrojZaduzenja: stavka.getAttribute({ name: 'PozivNaBrojZaduzenjaOdobrenja' }) || '',
                    modelKorisnika: stavka.getAttribute({ name: 'ModelKorisnika' }) || '',
                    pozivBrojKorisnika: stavka.getAttribute({ name: 'PozivNaBrojKorisnika' }) || '',
                    brojReklamaciju: stavka.getAttribute({ name: 'BrojZaReklamaciju' }) || '',
                    referenca: stavka.getAttribute({ name: 'Referenca' }) || '',
                    objasnjenje: stavka.getAttribute({ name: 'Objasnjenje' }) || '',
                    datumValute: stavka.getAttribute({ name: 'DatumValute' }) || ''
                });
            }

            return lineItems;
        } catch (e) {
            log.error('parseLineItems Error', e);
            throw e;
        }
    }

    /**
     * Creates statement record with line items as sublist lines
     * @param {Object} headerData - Header data object
     * @param {Array} lineItemsData - Array of line item data objects
     * @param {string} xmlString - Original XML content
     * @returns {number} Created record ID
     */
    function createStatementWithLines(headerData, lineItemsData, xmlString) {
        try {
            const statementRec = record.create({
                type: 'customrecord_srb_statement',
                isDynamic: true
            });

            // Set header fields
            statementRec.setValue({ fieldId: 'custrecord_srb_vrsta_izvoda', value: headerData.vrstaIzvoda });
            statementRec.setValue({ fieldId: 'custrecord_srb_izvod_id', value: headerData.izvodId });
            statementRec.setValue({ fieldId: 'custrecord_srb_broj_izvoda', value: parseInt(headerData.brojIzvoda) || 0 });
            statementRec.setValue({ fieldId: 'custrecord_srb_datum_izvoda', value: parseSerbianDate(headerData.datumIzvoda) });
            statementRec.setValue({ fieldId: 'custrecord_srb_maticni_broj', value: headerData.maticniBroj });
            statementRec.setValue({ fieldId: 'custrecord_srb_komitent_naziv', value: headerData.komitentNaziv });
            statementRec.setValue({ fieldId: 'custrecord_srb_komitent_adresa', value: headerData.komitentAdresa });
            statementRec.setValue({ fieldId: 'custrecord_srb_komitent_mesto', value: headerData.komitentMesto });
            statementRec.setValue({ fieldId: 'custrecord_srb_partija', value: headerData.partija });
            const glAccountId = lookupGLAccount(headerData.partija);
            if (glAccountId) {
                statementRec.setValue({ fieldId: 'custrecord_srb_bank_gl_account', value: glAccountId });
            }
            statementRec.setValue({ fieldId: 'custrecord_srb_tip_racuna', value: headerData.tipRacuna });
            statementRec.setValue({ fieldId: 'custrecord_srb_prethodno_stanje', value: parseFloat(headerData.prethodnoStanje) || 0 });
            statementRec.setValue({ fieldId: 'custrecord_srb_dugovni_promet', value: parseFloat(headerData.dugovniPromet) || 0 });
            statementRec.setValue({ fieldId: 'custrecord_srb_potrazni_promet', value: parseFloat(headerData.potrazniPromet) || 0 });
            statementRec.setValue({ fieldId: 'custrecord_srb_novo_stanje', value: parseFloat(headerData.novoStanje) || 0 });
            statementRec.setValue({ fieldId: 'custrecord_srb_stanje_provizije', value: parseFloat(headerData.stanjeProvizije) || 0 });
            statementRec.setValue({ fieldId: 'custrecord_srb_dozvoljeni_minus', value: parseFloat(headerData.dozvoljeniMinus) || 0 });
            statementRec.setValue({ fieldId: 'custrecord_srb_original_xml', value: xmlString });

            // Add line items to sublist
            // Sublist ID: recmachcustrecord_ + parent field name
            const sublistId = 'recmachcustrecord_srb_line_parent_statement';

            for (let i = 0; i < lineItemsData.length; i++) {
                const item = lineItemsData[i];

                // Select new line
                statementRec.selectNewLine({ sublistId: sublistId });

                // Set line item fields
                statementRec.setCurrentSublistValue({ sublistId: sublistId, fieldId: 'custrecord_srb_nalog_korisnik', value: item.nalogKorisnik });
                statementRec.setCurrentSublistValue({ sublistId: sublistId, fieldId: 'custrecord_srb_mesto', value: item.mesto });
                statementRec.setCurrentSublistValue({ sublistId: sublistId, fieldId: 'custrecord_srb_vas_broj_naloga', value: item.vasBrojNaloga });
                statementRec.setCurrentSublistValue({ sublistId: sublistId, fieldId: 'custrecord_srb_broj_racuna_primaoca', value: item.brojRacunaPrimaoca });
                statementRec.setCurrentSublistValue({ sublistId: sublistId, fieldId: 'custrecord_srb_opis', value: item.opis });
                statementRec.setCurrentSublistValue({ sublistId: sublistId, fieldId: 'custrecord_srb_sifra_placanja', value: item.sifraPlacanja });
                statementRec.setCurrentSublistValue({ sublistId: sublistId, fieldId: 'custrecord_srb_sifra_placanja_opis', value: item.sifraPlacanjaOpis });
                statementRec.setCurrentSublistValue({ sublistId: sublistId, fieldId: 'custrecord_srb_duguje', value: parseFloat(item.duguje) || 0 });
                statementRec.setCurrentSublistValue({ sublistId: sublistId, fieldId: 'custrecord_srb_potrazuje', value: parseFloat(item.potrazuje) || 0 });
                statementRec.setCurrentSublistValue({ sublistId: sublistId, fieldId: 'custrecord_srb_model_zaduzenja', value: item.modelZaduzenja });
                statementRec.setCurrentSublistValue({ sublistId: sublistId, fieldId: 'custrecord_srb_poziv_broj_zaduzenja', value: item.pozivBrojZaduzenja });
                statementRec.setCurrentSublistValue({ sublistId: sublistId, fieldId: 'custrecord_srb_model_korisnika', value: item.modelKorisnika });
                statementRec.setCurrentSublistValue({ sublistId: sublistId, fieldId: 'custrecord_srb_poziv_broj_korisnika', value: item.pozivBrojKorisnika });
                statementRec.setCurrentSublistValue({ sublistId: sublistId, fieldId: 'custrecord_srb_broj_reklamaciju', value: item.brojReklamaciju });
                statementRec.setCurrentSublistValue({ sublistId: sublistId, fieldId: 'custrecord_srb_referenca', value: item.referenca });
                statementRec.setCurrentSublistValue({ sublistId: sublistId, fieldId: 'custrecord_srb_objasnjenje', value: item.objasnjenje });
                statementRec.setCurrentSublistValue({ sublistId: sublistId, fieldId: 'custrecord_srb_datum_valute', value: parseSerbianDate(item.datumValute) });

                // Commit the line
                statementRec.commitLine({ sublistId: sublistId });
            }

            // Save the record with all line items
            const recordId = statementRec.save();
            log.audit('Statement Record Created', 'ID: ' + recordId + ', Lines: ' + lineItemsData.length);

            return recordId;
        } catch (e) {
            log.error('createStatementWithLines Error', e);
            throw e;
        }
    }

    /**
     * Creates header record in NetSuite (deprecated - use createStatementWithLines)
     * @param {Object} headerRec - Header record object
     * @param {Object} headerData - Header data object
     * @param {string} xmlString - Original XML content
     * @returns {number} Created record ID
     * @deprecated Use createStatementWithLines instead
     */
    function updateHeaderRecord(headerRec,headerData, xmlString) {
        try {
            
            // Set all header fields
            headerRec.setValue({ fieldId: 'custrecord_srb_vrsta_izvoda', value: headerData.vrstaIzvoda });
            headerRec.setValue({ fieldId: 'custrecord_srb_izvod_id', value: headerData.izvodId });
            headerRec.setValue({ fieldId: 'custrecord_srb_broj_izvoda', value: parseInt(headerData.brojIzvoda) || 0 });
            headerRec.setValue({ fieldId: 'custrecord_srb_datum_izvoda', value: parseSerbianDate(headerData.datumIzvoda) });
            headerRec.setValue({ fieldId: 'custrecord_srb_maticni_broj', value: headerData.maticniBroj });
            headerRec.setValue({ fieldId: 'custrecord_srb_komitent_naziv', value: headerData.komitentNaziv });
            headerRec.setValue({ fieldId: 'custrecord_srb_komitent_adresa', value: headerData.komitentAdresa });
            headerRec.setValue({ fieldId: 'custrecord_srb_komitent_mesto', value: headerData.komitentMesto });
            headerRec.setValue({ fieldId: 'custrecord_srb_partija', value: headerData.partija });
            headerRec.setValue({ fieldId: 'custrecord_srb_tip_racuna', value: headerData.tipRacuna });
            headerRec.setValue({ fieldId: 'custrecord_srb_prethodno_stanje', value: parseFloat(headerData.prethodnoStanje) || 0 });
            headerRec.setValue({ fieldId: 'custrecord_srb_dugovni_promet', value: parseFloat(headerData.dugovniPromet) || 0 });
            headerRec.setValue({ fieldId: 'custrecord_srb_potrazni_promet', value: parseFloat(headerData.potrazniPromet) || 0 });
            headerRec.setValue({ fieldId: 'custrecord_srb_novo_stanje', value: parseFloat(headerData.novoStanje) || 0 });
            headerRec.setValue({ fieldId: 'custrecord_srb_stanje_provizije', value: parseFloat(headerData.stanjeProvizije) || 0 });
            headerRec.setValue({ fieldId: 'custrecord_srb_dozvoljeni_minus', value: parseFloat(headerData.dozvoljeniMinus) || 0 });
            headerRec.setValue({ fieldId: 'custrecord_srb_original_xml', value: xmlString });

            const headerRecId = headerRec.save();
            log.audit({
                title: 'Header Record Updated',
                details: `Record ID: ${headerRecId}, Statement Number: ${headerData.brojIzvoda}, Date: ${headerData.datumIzvoda}`
            });

            return headerRecId;
        } catch (e) {
            log.error('updateHeaderRecord Error', e);
            throw e;
        }
    }

    /**
     * Creates line item records in NetSuite
     * @param {Array} lineItemsData - Array of line item data objects
     * @param {number} headerRecordId - Parent header record ID
     * @returns {Array} Array of created record IDs
     */

    /**
     * Parses Serbian date format (DD.MM.YYYY) to JavaScript Date
     * @param {string} dateStr - Date string in DD.MM.YYYY format
     * @returns {Date} JavaScript Date object
     */
    function parseSerbianDate(dateStr) {
        try {
            if (!dateStr) {
                return new Date();
            }

            const parts = dateStr.split('.');
            if (parts.length !== 3) {
                log.error('Invalid date format', dateStr);
                return new Date();
            }

            // Create date object: year, month (0-indexed), day
            return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        } catch (e) {
            log.error('parseSerbianDate Error', e);
            return new Date();
        }
    }

    function lookupGLAccount(partija) {
        try {
            if (!partija) return null;

            const results = query.runSuiteQL({
                query: `SELECT custrecord_srb_bank_acc_map_to
                        FROM customrecord_srb_bank_acc_mapping
                        WHERE NAME = ?`,
                params: [partija]
            }).asMappedResults();

            if (results.length > 0 && results[0].custrecord_srb_bank_acc_map_to) {
                log.debug({title: 'GL Account Found', details: 'Partija: ' + partija + ', GL ID: ' + results[0].custrecord_srb_bank_acc_map_to});
                return results[0].custrecord_srb_bank_acc_map_to;
            }

            log.debug({title: 'GL Account Not Found', details: 'No mapping for Partija: ' + partija});
            return null;
        } catch (e) {
            log.error({title: 'lookupGLAccount Error', details: e.message});
            return null;
        }
    }

    /**
     * Validates XML structure
     * @param {string} xmlString - XML content to validate
     * @returns {Object} Validation result
     */
    function validateXml(xmlString) {
        try {
            if (!xmlString) {
                return { valid: false, error: 'XML content is empty' };
            }

            /*
            if (!xmlString.includes('<TransakcioniRacunPrivredaIzvod>')) {
                return { valid: false, error: 'Missing root element TransakcioniRacunPrivredaIzvod' };
            }

            if (!xmlString.includes('<Zaglavlje')) {
                return { valid: false, error: 'Missing Zaglavlje element' };
            }
            */
            const xmlDoc = xml.Parser.fromString({ text: xmlString });
            const zaglavlje = xmlDoc.getElementsByTagName({ tagName: 'Zaglavlje' })[0];

            if (!zaglavlje) {
                return { valid: false, error: 'Could not parse Zaglavlje element' };
            }

            return { valid: true };
        } catch (e) {
            return { valid: false, error: e.message };
        }
    }

    // Public API
    return {
        parseBankStatement: parseBankStatement,
        parseHeader: parseHeader,
        parseLineItems: parseLineItems,
        createStatementWithLines: createStatementWithLines,
        createHeaderRecord: updateHeaderRecord,
        parseSerbianDate: parseSerbianDate,
        validateXml: validateXml,
        lookupGLAccount: lookupGLAccount
    };
});