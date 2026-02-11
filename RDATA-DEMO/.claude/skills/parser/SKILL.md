---
name: parser
description: Generate NetSuite SuiteScript 2.1 XML parser code for bank statements and custom record creation
---

# XML Parser Code Generator

Generate SuiteScript 2.1 parser modules following this project's established patterns.

## Architecture

Every parser consists of these components:

### 1. Library Module (core parser)

```javascript
/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 */
define(['N/xml', 'N/record', 'N/log', 'N/search'], (xml, record, log, search) => {

    const parseDocument = (xmlString, options = {}) => {
        try {
            const xmlDoc = xml.Parser.fromString({ text: xmlString });

            const headerData = parseHeader(xmlDoc);
            const lineItemsData = parseLineItems(xmlDoc);

            if (options.dryRun) {
                return { success: true, dryRun: true, headerData, lineItemsData };
            }

            if (!options.skipDuplicateCheck) {
                // Check for duplicate records via N/search
            }

            const result = createRecordWithLines(headerData, lineItemsData, xmlString);
            return { success: true, headerRecordId: result.id, lineItemsCount: lineItemsData.length };
        } catch (e) {
            log.error({ title: 'parseDocument Error', details: e });
            return { success: false, error: e.message };
        }
    };

    const parseHeader = (xmlDoc) => {
        const headerNode = xmlDoc.getElementsByTagName({ tagName: 'HeaderElement' })[0];
        return {
            // Map XML attributes to object properties
            // field: headerNode.getAttribute({ name: 'AttributeName' })
        };
    };

    const parseLineItems = (xmlDoc) => {
        const nodes = xmlDoc.getElementsByTagName({ tagName: 'LineElement' });
        const items = [];
        for (let i = 0; i < nodes.length; i++) {
            items.push({
                // Map XML attributes to object properties
            });
        }
        return items;
    };

    const createRecordWithLines = (headerData, lineItemsData, xmlString) => {
        const rec = record.create({ type: 'customrecord_xxx', isDynamic: true });

        // Set header fields
        // rec.setValue({ fieldId: 'custrecord_xxx', value: headerData.field });

        // Store original XML
        // rec.setValue({ fieldId: 'custrecord_xxx_original_xml', value: xmlString });

        // Add line items to sublist
        const sublistId = 'recmachcustrecord_xxx_parent';
        lineItemsData.forEach(item => {
            rec.selectNewLine({ sublistId });
            // rec.setCurrentSublistValue({ sublistId, fieldId: 'custrecord_xxx', value: item.field });
            rec.commitLine({ sublistId });
        });

        const id = rec.save();
        log.audit({ title: 'Record Created', details: 'ID: ' + id });
        return { id };
    };

    const validateXml = (xmlString) => {
        try {
            const xmlDoc = xml.Parser.fromString({ text: xmlString });
            const header = xmlDoc.getElementsByTagName({ tagName: 'HeaderElement' });
            if (!header || header.length === 0) {
                return { valid: false, error: 'Missing header element' };
            }
            return { valid: true };
        } catch (e) {
            return { valid: false, error: e.message };
        }
    };

    return { parseDocument, parseHeader, parseLineItems, createRecordWithLines, validateXml };
});
```

### 2. Restlet (API endpoint)

```javascript
/**
 * @NApiVersion 2.1
 * @NScriptType Restlet
 */
define(['./library_module'], (parserLib) => {

    const post = (requestBody) => {
        try {
            const { xmlContent } = requestBody;
            if (!xmlContent) return { success: false, error: 'Missing xmlContent' };
            return parserLib.parseDocument(xmlContent);
        } catch (e) {
            log.error({ title: 'Restlet POST Error', details: e });
            return { success: false, error: e.message, stack: e.stack };
        }
    };

    const get = () => {
        return { status: 'active', usage: 'POST { xmlContent: "<xml>...</xml>" }' };
    };

    return { post, get };
});
```

### 3. Workflow Action Script (record context)

```javascript
/**
 * @NApiVersion 2.1
 * @NScriptType WorkflowActionScript
 */
define(['N/record', 'N/file', 'N/log', './library_module'], (record, file, log, parserLib) => {

    const onAction = (context) => {
        try {
            const rec = context.newRecord;
            const recordId = rec.id;

            // Load original XML from file reference or field
            const xmlFileId = rec.getValue({ fieldId: 'custrecord_xxx_xml_file' });
            const xmlFile = file.load({ id: xmlFileId });
            const xmlString = xmlFile.getContents();

            const validation = parserLib.validateXml(xmlString);
            if (!validation.valid) {
                log.error({ title: 'Invalid XML', details: validation.error });
                return;
            }

            const headerData = parserLib.parseHeader(
                require('N/xml').Parser.fromString({ text: xmlString })
            );
            const lineItemsData = parserLib.parseLineItems(
                require('N/xml').Parser.fromString({ text: xmlString })
            );

            // Load record in dynamic mode for sublist operations
            const statementRec = record.load({ type: rec.type, id: recordId, isDynamic: true });

            // Clear existing lines (remove from bottom to top)
            const sublistId = 'recmachcustrecord_xxx_parent';
            while (statementRec.getLineCount({ sublistId }) > 0) {
                statementRec.removeLine({ sublistId, line: 0 });
            }

            // Add parsed line items
            lineItemsData.forEach(item => {
                statementRec.selectNewLine({ sublistId });
                // statementRec.setCurrentSublistValue({ sublistId, fieldId: 'field', value: item.field });
                statementRec.commitLine({ sublistId });
            });

            statementRec.save();
            log.audit({ title: 'Workflow Action Completed', details: { recordId, itemsAdded: lineItemsData.length } });
        } catch (e) {
            log.error({ title: 'Workflow Action Error', details: e });
        }
    };

    return { onAction };
});
```

## Key Patterns

### Date parsing (DD.MM.YYYY)
```javascript
const parseSerbianDate = (dateStr) => {
    const [day, month, year] = dateStr.split('.');
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
};
```

### Sublist clear all lines
```javascript
const sublistId = 'recmachcustrecord_xxx_parent';
while (rec.getLineCount({ sublistId }) > 0) {
    rec.removeLine({ sublistId, line: 0 });
}
```

### Standardized return objects
```javascript
// Success
{ success: true, headerRecordId: 123, lineItemsCount: 5, message: 'Parsed OK' }

// Dry run
{ success: true, dryRun: true, headerData: {}, lineItemsData: [] }

// Duplicate
{ success: false, isDuplicate: true, duplicateRecordId: 456 }

// Error
{ success: false, error: 'Error message' }
```

## Rules

- Always use `isDynamic: true` when working with sublists
- Always wrap main logic in try-catch with `log.error`
- Sublist ID for child records is `recmachcustrecord_<parent_field_scriptid>`
- Store original XML on the header record for re-parsing
- Support dry-run and duplicate-check options
- Use `N/xml` Parser for XML, never string manipulation
- Log format: `log.*({ title: 'title', details: 'details' })`