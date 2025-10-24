/**
 * @NApiVersion 2.1
 * @NScriptType Restlet
 * @description Serbian Bank Statement Parser Restlet
 * Uses the parser library to process XML uploads
 */
define(['./rdata_rb_parser_lib', 'N/log'], (parserLib, log) => {

    /**
     * Handles POST requests to parse bank statements
     * @param {Object} context - Request context
     * @param {string} context.xmlContent - XML content to parse
     * @returns {Object} Result object
     */
    function post(context) {
        try {
            if (!context || !context.xmlContent) {
                return {
                    success: false,
                    error: 'Missing xmlContent parameter'
                };
            }

            // Use the parser library to parse the statement
            const result = parserLib.parseBankStatement(context.xmlContent, {
                skipDuplicateCheck: false
            });

            return result;

        } catch (e) {
            log.error('Restlet Error', e);
            return {
                success: false,
                error: e.message,
                stack: e.stack
            };
        }
    }

    /**
     * Handles GET requests for testing
     * @returns {Object} Status message
     */
    function get() {
        return {
            status: 'Serbian Bank Statement Parser Restlet is active',
            version: '2.1',
            endpoints: {
                POST: 'Parse bank statement XML - send { xmlContent: "..." }'
            }
        };
    }

    return {
        post: post,
        get: get
    };
});