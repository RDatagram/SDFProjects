/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 * @NModuleScope Public
 * @author Rajitha K S
 * Script brief description:
   Scheduled Script is used for following tasks:
    1. update vendor status from creednz
 * Revision History:
 *
 * Date                 Issue/Case          Author          Issue Fix Summary
 * =============================================================================================
 * 2024/July/12                          Rajitha         Initial version.
 *          
 */
    define(['N/https', 'N/log', 'N/record', 'N/encode', 'N/format', 'N/search', 'N/email', 'N/runtime', 'N/task','./lib/creednz_token_lib'],
        (https, log, record, encode, format, search, email, runtime, task,creednz_token_lib) => {
       function execute(context) {
          try {
            var startTime = new Date().getTime();

            // load vendor search
            var vendorSearch = search.load({
                id: 'customsearch_ss_get_vendor_status_frm_cr'
            });
    
            vendorSearch.run().each(function(result) {
              
                var vendorId = result.getValue({
                    name: 'internalid'
                });
                var creednzVendorExternalId = result.getValue({
                    name: 'custentity_vendor_external_id'
                });

                log.debug("creednzVendorExternalId and internalid",vendorId + ","+creednzVendorExternalId );
                //check access token existing or not and expired or not
                 //get access token from custom record
                 var accessTokenLookup = search.lookupFields({
                    type: 'customrecord_creednz_details',
                    id: 1,
                    columns: ['custrecord_creednz_access_token', 'custrecord_creednz_last_updated_date', 'custrecord_creednz_client_id', 'custrecord_creednz_client_secret', 'custrecord_creednz_base_url','custrecord_auth0_get_token_api','custrecord_audience']
                  });
                  var lastSyncAccessToken = accessTokenLookup.custrecord_creednz_access_token;
                  var lastUpdatedDateTime = accessTokenLookup.custrecord_creednz_last_updated_date;
                  var creednzClientId = accessTokenLookup.custrecord_creednz_client_id;
                  var creednzClientSecret = accessTokenLookup.custrecord_creednz_client_secret;
                  var creednzBaseUrl = accessTokenLookup.custrecord_creednz_base_url;
                  var creednzAuth0 = accessTokenLookup.custrecord_auth0_get_token_api;
                  var creednzAudience = accessTokenLookup.custrecord_audience;
                 //check access token is existing or expired
                 var currentDate = new Date();
                 //log.debug("current date", currentDate);
                 // check if access token is exist or not
                 if (lastSyncAccessToken) {
                    //check if the access token is expired or not
                    log.debug("access token exist, ckeck expired or not");
                    var lastUpdatedDateTimeNow = format.format({
                        value: lastUpdatedDateTime,
                        type: format.Type.DATETIMETZ
                     });
                     var parsedDateStringAsRawDateObject = format.parse({
                        value: lastUpdatedDateTimeNow,
                        type: format.Type.DATETIMETZ
                     });
                     var accessTokenTimeDiff = (currentDate.getTime() - parsedDateStringAsRawDateObject.getTime()) / 1000;
                     log.debug("time difference in seconds", accessTokenTimeDiff);
                     // if access token expired, create new access token using refresh token
                     if (accessTokenTimeDiff > 86400) {
                        // create new access token
                        lastSyncAccessToken = getAccessToken(creednzClientId, creednzClientSecret, creednzAuth0, creednzAudience);
                        log.debug("access token created when it expired", lastSyncAccessToken);
                     }
                  } //end if(lastSyncAccessToken)
                  else {
                     log.debug("no api key exist");
                     // call function to create new access token
                     lastSyncAccessToken = getAccessToken(creednzClientId, creednzClientSecret, creednzAuth0, creednzAudience);
                     log.debug("access token created", lastSyncAccessToken);
                 }

                //get vendor status from creednz
                if (creednzVendorExternalId) {
                    //get risk status
                    var creedNzApiHeaders = {
                        'accept': 'application/json',
                        'content-type': 'application/json',
                        'authorization': 'Bearer ' + lastSyncAccessToken
                        //  'authorization': 'Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjBDQURVdzIwQUJYNnJvMm1uaU5jXyJ9.eyJpc3MiOiJodHRwczovL2NyZWVkbnotdGVzdC51cy5hdXRoMC5jb20vIiwic3ViIjoiN2Q3ZTZjZVFCeFJZTU5vYUJzVEpTUVdETDFpeWR1NkZAY2xpZW50cyIsImF1ZCI6Imh0dHBzOi8vY3JlZWRuei1keW5hbWljcy1pbnRlZ3JhdGlvbiIsImlhdCI6MTcxODE4MTY5MSwiZXhwIjoxNzE4MjY4MDkxLCJndHkiOiJjbGllbnQtY3JlZGVudGlhbHMiLCJhenAiOiI3ZDdlNmNlUUJ4UllNTm9hQnNUSlNRV0RMMWl5ZHU2RiJ9.yz2MZFO21PrhwxxuEXxIb0tvwcgRVWQMyzFU2kqMp63PZ5n7x9_H9tZtP96ui96dVGnVqRmKF3V-43eVQNUpqb3LTwzTmuFe6MYg3yHV4Q9sSRJvTOm7mPlbC14Af52MopnkK0YmqxdZnagJ7MdkXr5a_z2PWmnsDhZ811OiMKNo22As7yd9oA60D9MfSmUf6iXq_41Ms6olae4vPgvWbLJ9kedfkahnYlQ-em947kEdMR6XT-X0PiOHnjOurQnNm0USDqHuirKIrl76Z4S92yk5P3qbnl-gSzdgYc9wzGPSOsLYAKu8Fj0ls_1sDABYRz5RIKyCleV_O4oolkqzLw'
                     };
                   // var creedNzResponseUrl = "https://edge.staging.creednz.com/external/microsoft-dynamics/vendor-status/" + creednzVendorExternalId;
                 // var creedNzResponseUrl = "https://edge.staging.creednz.com/external/erp/vendor/status/" + creednzVendorExternalId;
                 var creedNzResponseUrl = creednzBaseUrl+"/external/erp/vendor/status/" + creednzVendorExternalId;

  
                  var creedNzStatusResponse = https.get({
                       url: creedNzResponseUrl,
                       headers: creedNzApiHeaders
                    });
                    log.debug("creedNzStatusResponse" + creedNzStatusResponse);
                    var creedNzStatusTransactions = creedNzStatusResponse.body;
                    log.debug("creedNzStatusTransactions Body" + creedNzStatusTransactions);
                    //get consignment id
                    var creedNzStatusTransactionsParse = JSON.parse(creedNzStatusTransactions);
                    log.debug("creedNzStatusTransactionsParse" + creedNzStatusTransactionsParse);
                    log.debug(creedNzStatusTransactionsParse.status);
                    log.debug(creedNzStatusTransactionsParse.externalId);
                    var creednzRiskStatus = creedNzStatusTransactionsParse.status;
                    var recId = record.submitFields({
                       type: record.Type.VENDOR,
                       id: vendorId,
                       values: {
                          custentity_creednz_risk_status: creednzRiskStatus,
                       },
                       options: {
                          enableSourcing: false,
                          ignoreMandatoryFields: true
                       }
                    });
                    console.log("record updated" + recId);
                 }


                 // Reschedule the task
                var endTime = new Date().getTime();
                var timeElapsed = (endTime * 0.001) - (startTime * 0.001);
                var scriptObj = runtime.getCurrentScript();
                var remainingUsage = scriptObj.getRemainingUsage();
                if (remainingUsage < 1000 || timeElapsed > 3300) // time more than 55 min
                {
                    log.debug("Usage Exceeded Resubmitting remainingUsage", remainingUsage);
        
                    var scheduledScriptTask = task.create({
                    taskType: task.TaskType.SCHEDULED_SCRIPT,
                    scriptId: runtime.getCurrentScript().id,
                    deploymentId: runtime.getCurrentScript().deploymentId
                    });
        
                    log.debug("ssTask" + scheduledScriptTask);
                    scheduledScriptTask.submit();

                }
                else{
                  return true;
                }

            });


               } catch (err) {
             log.debug("error", err);
          }
       }
       function getAccessToken(creednzClientId, creednzClientSecret, creednzAuth0, creednzAudience) {
           try {
               return creednz_token_lib.getTokenCreednz(creednzClientId, creednzClientSecret, creednzAuth0, creednzAudience);
           } catch (err) {
               log.debug("error in function getAccessToken", err);
           }
     } //end function
      
       return {
          execute: execute,
          getAccessToken: getAccessToken
       };
    });