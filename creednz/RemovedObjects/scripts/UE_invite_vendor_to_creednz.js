/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope Public
 * @author Rajitha K S
  * Script brief description:
   UserEventScript Script is used for following tasks:
    1. perform Invite vendor on button click.

 * Revision History:
 *
 * Date                 Issue/Case              Author          Issue Fix Summary
 * =============================================================================================
 * 2024/July/01                                 Rajitha         Initial version.
 *          
 */
    define(['N/runtime', 'N/log', 'N/record', 'N/error', 'N/render', 'N/file','N/https','N/search','N/format','N/url'],
        (runtime, log, record, error, render, file, https, search,format,url) => {
      function beforeLoad(scriptContext) {
      try{
         let currentRec = scriptContext.newRecord;
         let currentForm = scriptContext.form;
        //get invite vendor suitelet link from script parameter
        var suiteletUrl = url.resolveScript({
          scriptId: 'customscript_sl_invite_vendor_to_creednz',
          deploymentId: 'customdeploy_sl_invite_vendor_to_creednz',
          returnExternalUrl: false
      });
      var suiteletUrlNow = suiteletUrl.split("&compid")[0];
      suiteletUrlNow = '\"' + suiteletUrlNow + '\"';
        //open suitelet as popup on button click
        currentForm.addButton({
            id: 'custpage_suiteletbutton',
            label: 'Invite Vendor',
            functionName : 'window.open(' + suiteletUrlNow + ',width=600,height=600)',
        });


      } catch (err) {
            log.debug("error in function beforeLoad", err);
         
      } //end try catch
    }//end beforeload function
        return {
           beforeLoad: beforeLoad,
        };
     });