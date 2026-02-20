/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope Public
 * @author Rajitha K S
 * Script brief description:
 UserEventScript Script is used for following tasks:
 1. Add button to Creednz Details Custom record to execute one time scheduled script

 * Revision History:
 *
 * Date                 Issue/Case              Author          Issue Fix Summary
 * =============================================================================================
 * 2023/July/12                            Rajitha         Initial version.
 *
 */
define(['N/runtime', 'N/log', 'N/record', 'N/error', 'N/render', 'N/file', 'N/https', 'N/search', 'N/format'], (runtime, log, record, error, render, file, https, search, format) => {
    function beforeLoad(context) {
        try {
            var form = context.form;
            // add new button in custom record(creednz details)
            form.addButton({
                id: 'custpage_execute_scheduled_script',
                label: 'Execute Scheduled Script',
                functionName: 'executeScheduledScript()'
            });
            var nsAccountId = runtime.accountId;
            if (nsAccountId == "TSTDRV1255519") {
                form.clientScriptModulePath = 'SuiteScripts/cs_creednz_vendor_evaluation.js';

            } else {
                //form.clientScriptModulePath = 'SuiteBundles/Bundle 537712/cs_creednz_vendor_evaluation.js';
                form.clientScriptModulePath = './cs_creednz_vendor_evaluation.js';
            }

            //  form.clientScriptModulePath = 'SuiteScripts/cs_creednz_vendor_evaluation.js';


        } catch (err) {
            log.debug("error", err.message);
        }
    }

    return {
        beforeLoad: beforeLoad
    };
});