/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/runtime'], function(runtime) {

    function getInputData() {
        let selectedIds = runtime.getCurrentScript().getParameter({ name: 'custscript_selected_ids' });
        return JSON.parse(selectedIds || '[]');
    }

    function map(context) {
        let itemId = context.value;
        // Do your processing here
        // Example: log the item ID
        log.audit('Processing Item', itemId);
        // You can add your own logic, e.g., load record, update, etc.
    }

    return {
        getInputData: getInputData,
        map: map
        // add reduce and summarize if needed
    };
});