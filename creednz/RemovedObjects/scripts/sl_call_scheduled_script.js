/**
 *
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope public
 * @author Rajitha
 * Script brief description:
     execute scheduled script
 * Revision History:
 *
 * Date                 Issue/Case         Author          Issue Fix Summary
 * =============================================================================================
 * 2024/June/06                            Rajitha         Initial version.
 */
     
     define(["N/ui/serverWidget", "N/log", "N/record", "N/url", "N/search", "N/task", "N/redirect", "N/runtime", "N/encode", "N/file", "N/https"], (ui, log, record, url, search, task, redirect, runtime, encode, file, https, ) => {
        function onRequest(context) {
           // get method
           var nsAccountId = runtime.accountId;
           log.debug("context",runtime.accountId);
           if (context.request.method === 'GET') {
              try {
                 var form = ui.createForm({
                    id: 'vendor_validation',
                    title: 'Creednz Vendors Analysis'
                 });
                 var scriptTask = task.create({
                    taskType: task.TaskType.SCHEDULED_SCRIPT,
                    scriptId: "customscript_ss_get_vendor_externalid_cr",
                    deploymentId: "customdeploy_ss_get_vendor_externalid_cr"
                    });
                    var scriptTaskId = scriptTask.submit();
                    log.debug("scriptTaskId", scriptTaskId);
                
                 
                 context.response.writePage(form);
              } catch (err) {
                 log.debug("error", err);
              }
           } else {
              //post
              try {} catch (err) {
                 log.debug("error in post", err);
              }
           } //end post
        } //end execute
       
       
        return {
           onRequest: onRequest
        };
     });