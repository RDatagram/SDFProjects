/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 * @description Example of how to use the Serbian Bank Statement Parser Library
 */
define(['./rdata_rb_parser_lib', 'N/file', 'N/log'],
    (parserLib, file, log) => {

    /**
     * Example 1: Parse XML from a string
     */
    function example1_parseFromString() {
        const xmlContent = '<TransakcioniRacunPrivredaIzvod>...</TransakcioniRacunPrivredaIzvod>';

        const result = parserLib.parseBankStatement(xmlContent);

        if (result.success) {
            log.audit('Success', 'Statement imported: ' + result.message);
            log.audit('Header Record ID', result.headerRecordId);
            log.audit('Line Items Created', result.lineRecordIds.length);
        } else {
            log.error('Error', result.error);
        }
    }

    /**
     * Example 2: Parse XML from a file in File Cabinet
     */
    function example2_parseFromFile() {
        // Load XML file from File Cabinet
        const xmlFile = file.load({
            id: 'SuiteScripts/rb_parser/statements/izvod_67.xml'
        });

        const xmlContent = xmlFile.getContents();

        // Parse with duplicate check
        const result = parserLib.parseBankStatement(xmlContent, {
            skipDuplicateCheck: false
        });

        if (result.success) {
            log.audit('Statement Imported', result.message);
        } else if (result.isDuplicate) {
            log.audit('Duplicate Found', 'Existing Record ID: ' + result.duplicateRecordId);
        } else {
            log.error('Import Failed', result.error);
        }
    }

    /**
     * Example 3: Dry run - parse without creating records
     */
    function example3_dryRun() {
        const xmlContent = '<TransakcioniRacunPrivredaIzvod>...</TransakcioniRacunPrivredaIzvod>';

        // Dry run - only parse, don't create records
        const result = parserLib.parseBankStatement(xmlContent, {
            dryRun: true
        });

        if (result.success) {
            log.audit('Header Data', result.headerData);
            log.audit('Line Items Count', result.lineItemsData.length);

            // Inspect the data
            log.audit('Statement Number', result.headerData.brojIzvoda);
            log.audit('Statement Date', result.headerData.datumIzvoda);
            log.audit('Account', result.headerData.partija);
        }
    }

    /**
     * Example 4: Validate XML before parsing
     */
    function example4_validateFirst() {
        const xmlContent = '<TransakcioniRacunPrivredaIzvod>...</TransakcioniRacunPrivredaIzvod>';

        // First validate
        const validation = parserLib.validateXml(xmlContent);

        if (!validation.valid) {
            log.error('Invalid XML', validation.error);
            return;
        }

        // Then parse
        const result = parserLib.parseBankStatement(xmlContent);

        if (result.success) {
            log.audit('Success', result.message);
        }
    }

    /**
     * Example 5: Use individual helper functions
     */
    function example5_useHelpers() {
        const xmlContent = '<TransakcioniRacunPrivredaIzvod>...</TransakcioniRacunPrivredaIzvod>';

        // Parse XML manually
        const xml = require('N/xml');
        const xmlDoc = xml.Parser.fromString({ text: xmlContent });

        // Extract header data only
        const headerData = parserLib.parseHeader(xmlDoc);
        log.audit('Header', headerData);

        // Check if it already exists
        const duplicateId = parserLib.checkDuplicate(headerData);
        if (duplicateId) {
            log.audit('Already exists', 'Record ID: ' + duplicateId);
            return;
        }

        // Extract line items only
        const lineItems = parserLib.parseLineItems(xmlDoc);
        log.audit('Line Items', lineItems.length + ' items found');

        // Create records manually
        const headerId = parserLib.createHeaderRecord(headerData, xmlContent);
        const lineIds = parserLib.createLineItemRecords(lineItems, headerId);

        log.audit('Created', 'Header: ' + headerId + ', Lines: ' + lineIds.length);
    }

    /**
     * Example 6: Parse date utility
     */
    function example6_dateUtility() {
        const serbianDate = '25.08.2025';
        const jsDate = parserLib.parseSerbianDate(serbianDate);

        log.audit('Parsed Date', jsDate);
    }

    /**
     * Scheduled Script Execute Entry Point
     */
    function execute(context) {
        try {
            log.audit('Starting', 'Bank Statement Parser Example');

            // Run your example here
            example2_parseFromFile();

            log.audit('Completed', 'Bank Statement Parser Example');
        } catch (e) {
            log.error('Error', e);
        }
    }

    return {
        execute: execute
    };
});