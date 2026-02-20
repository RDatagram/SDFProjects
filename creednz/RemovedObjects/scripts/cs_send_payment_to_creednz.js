/**
 *
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope public
 * @author Rajitha
 * Script brief description:
    Send Vendor Payment to Creednz
 * Revision History:
 *
 * Date                 Issue/Case         Author          Issue Fix Summary
 * =============================================================================================
 * 2024/June/12                            Rajitha         Initial version.
 */
    var searchId = 'customsearch_ss_get_payments_for_creednz';
    define(['N/log', 'N/record', 'N/format', 'N/search', 'N/currentRecord', 'N/url', 'N/ui/dialog', 'N/https'], (log, record, format, search, currentRecord, url, dialog, https) => {
       
      function pageInit(context)
      {
        try{
            console.log("pageinit");    
        }catch(err)
        {
            console.log("error in pageinit"+err);
        }
      }
    
      
       function getSuiteletPage(suiteletScriptId, suiteletDeploymentId, pageId) {
          document.location = url.resolveScript({
             scriptId: suiteletScriptId,
             deploymentId: suiteletDeploymentId,
             params: {
                'page': pageId
             }
          });
       }
    
       function creednzValidate(context) {
          try {
            window.onbeforeunload = null;

           // var lastSyncAccessToken = checkAccessToken();
           var creednzObj = checkAccessToken();
           var lastSyncAccessToken =  creednzObj.lastSyncAccessToken;
           var creednzBaseUrl = creednzObj.creednzBaseUrl;
            
             //creedNzUrl = "https://edge.staging.creednz.com/external/erp/payment/analyze"; 
             creedNzUrl = creednzBaseUrl +"/external/erp/payment/analyze";
             var creedNzApiHeaders = {
                'accept': 'application/json',
                'content-type': 'application/json',
                'authorization': 'Bearer ' + lastSyncAccessToken
             };
             var paymentArray = [];
             //var paymentObj = {};
             //get data from sublist
             var paymentIdArray = [];
             var currentrecord = currentRecord.get();
             var numLines = currentrecord.getLineCount({
                sublistId: 'custpage_analyze_payment_sublist'
             });
             console.log("numLines"+numLines);
             for (var i = 0; i < numLines; i++) {
                var checkbox = currentrecord.getSublistValue({
                   sublistId: 'custpage_analyze_payment_sublist',
                   fieldId: 'custpage_rec_process',
                   line: i
                });
                console.log("checkbox"+checkbox);

                if (checkbox) {
                   var paymentObj = {};
                   var paymentId = currentrecord.getSublistValue({
                      sublistId: 'custpage_analyze_payment_sublist',
                      fieldId: 'custpage_payment_id',
                      line: i
                   });
                  

                   var paymentDate = currentrecord.getSublistValue({
                      sublistId: 'custpage_analyze_payment_sublist',
                      fieldId: 'custpage_payment_date',
                      line: i
                   });

                   var paymentDateNow = new Date(paymentDate);
                   if(paymentDateNow)
                   {
                     paymentObj.paymentDate = paymentDateNow;
                   }
                   var paymentAmount = currentrecord.getSublistValue({
                     sublistId: 'custpage_analyze_payment_sublist',
                     fieldId: 'custpage_payment_amount',
                     line: i
                   });
                   if(paymentAmount)
                   {
                     paymentObj.amount = parseInt(paymentAmount);
                   }

                   var paymentCurrencyCode = currentrecord.getSublistValue({
                      sublistId: 'custpage_analyze_payment_sublist',
                      fieldId: 'custpage_currency_code',
                      line: i
                   });
                  if(paymentCurrencyCode)
                     {
                        paymentObj.currencyCode = paymentCurrencyCode;
                     } 
                  

                   var paymentRoutingNo = currentrecord.getSublistValue({
                      sublistId: 'custpage_analyze_payment_sublist',
                      fieldId: 'custpage_routing_no',
                      line: i
                   });
                   if(paymentRoutingNo)
                     {
                       paymentObj.routingNumber = paymentRoutingNo;
                     }
                   var paymentType = currentrecord.getSublistValue({
                      sublistId: 'custpage_analyze_payment_sublist',
                      fieldId: 'custpage_type',
                      line: i
                   });
                   if(paymentType)
                     {
                       paymentObj.type = paymentType;
                     }
                   var payerBanckAccNo = currentrecord.getSublistValue({
                      sublistId: 'custpage_analyze_payment_sublist',
                      fieldId: 'custpage_payer_bank_acc_no',
                      line: i
                   });
                   var payeeBankAccNo = currentrecord.getSublistValue({
                      sublistId: 'custpage_analyze_payment_sublist',
                      fieldId: 'custpage_payee_bank_acc_no',
                      line: i
                   });
                   if(payeeBankAccNo)
                     {
                       paymentObj.payeeBankAccountNumber = payeeBankAccNo;
                     }
                   var payerName = currentrecord.getSublistValue({
                      sublistId: 'custpage_analyze_payment_sublist',
                      fieldId: 'custpage_payer_name',
                      line: i
                   });
                   if(payerName)
                     {
                       paymentObj.payerName = payerName;
                     }
                   var payeeName = currentrecord.getSublistValue({
                      sublistId: 'custpage_analyze_payment_sublist',
                      fieldId: 'custpage_payee_name',
                      line: i
                   });
                   if(payeeName)
                     {
                       paymentObj.payeeName = payeeName;
                     }
                   var payentDecsription = currentrecord.getSublistValue({
                      sublistId: 'custpage_analyze_payment_sublist',
                      fieldId: 'custpage_description',
                      line: i
                   });
                   var paymentLastModified = currentrecord.getSublistValue({
                      sublistId: 'custpage_analyze_payment_sublist',
                      fieldId: 'custpage_last_modified',
                      line: i
                   });
                   var lastModified2 = new Date(paymentLastModified);
                   console.log("lastModified2" + lastModified2);
                  
                   //  console.log("data"+ vendorId + " " + vendorName + " " + vendorCurrency + " " + vendorBillCity + " " + vendorBillCountry + " " + vendorBillZip + " " + vendorCreatedDate);
                   paymentIdArray.push(paymentId);
                  
                   paymentArray.push(paymentObj);
                }
             }
             console.log("paymentArray"+ paymentArray);
             //alert("vendorArray"+vendorArray);
             var dataObj = {};
             dataObj.analyzePaymentDtos = paymentArray;
             // get item details
             //set data to post
             console.log("dataObj", JSON.stringify(dataObj));
             //post data to Creednz
             var creedNzResponse = https.post({
                url: creedNzUrl,
                headers: creedNzApiHeaders,
                body: JSON.stringify(dataObj)
             });
             console.log("creedNzResponse", creedNzResponse);
           //  alert("creedNzResponse status" + creedNzResponse.status);
             if (creedNzResponse) {
                //get response if the status is 200
                var creedNzTransactions = creedNzResponse.body;
                var creedNzTransactionsParse = JSON.parse(creedNzTransactions);
                log.debug("creedNzTransactionsParse", creedNzTransactionsParse);
                var creedNzTransactionsLength = creedNzTransactionsParse.length;
                var paymentExternalIdArray = [];
                for (var i = 0; i < creedNzTransactionsLength; i++) {
                   var paymentExternalId = creedNzTransactionsParse[i].paymentExternalId;
                   paymentExternalIdArray.push(paymentExternalId);
                } //end for loop
                // set vendor external id in vendor record
                for (var j = 0; j < paymentIdArray.length; j++) {
                   var paymentIdToUpdate = paymentIdArray[j];
                   var recId = record.submitFields({
                      type: record.Type.VENDOR_PAYMENT,
                      id: paymentIdToUpdate,
                      values: {
                        custbody_creednz_external_id: paymentExternalIdArray[j],
                        custbodycreednz_last_modified_date: new Date()
                      },
                      options: {
                         enableSourcing: false,
                         ignoreMandatoryFields: true
                      }
                   });
                   log.debug("record updated", recId);
                } // end for loop
             } //end if
             location.reload();
             window.onbeforeunload = null;

          } catch (err) {
             console.log("error in validate payment"+ err);
          }
       } //end post*/
       function analyzeResponse(context) {
          try {
             // analyze response
             window.onbeforeunload = null;

             //var lastSyncAccessToken = checkAccessToken();
             var creednzObj = checkAccessToken();
             var lastSyncAccessToken =  creednzObj.lastSyncAccessToken;
             var creednzBaseUrl = creednzObj.creednzBaseUrl;

             var creedNzApiHeaders = {
                'accept': 'application/json',
                'content-type': 'application/json',
                'authorization': 'Bearer ' + lastSyncAccessToken
             };
             var paymentArray = [];
             var paymentObj = {};
             //get data from sublist
             var paymentIdArray = [];
             var currentrecord = currentRecord.get();
             var numLines = currentrecord.getLineCount({
                sublistId: 'custpage_analyze_payment_response'
             });
             console.log('numLines' + numLines);
             for (var i = 0; i < numLines; i++) {
                var checkbox = currentrecord.getSublistValue({
                   sublistId: 'custpage_analyze_payment_response',
                   fieldId: 'custpage_rec_process_response',
                   line: i
                });
                if (checkbox) {
                   var paymentObj = {};
                   var paymentId = currentrecord.getSublistValue({
                      sublistId: 'custpage_analyze_payment_response',
                      fieldId: 'custpage_payment_id_response',
                      line: i
                   });
                   console.log("paymentId" + paymentId);
                   var paymentExternalId = currentrecord.getSublistValue({
                      sublistId: 'custpage_analyze_payment_response',
                      fieldId: 'custpage_vendor_external_id_response',
                      line: i
                   });
                   console.log("paymentExternalId" + paymentExternalId);
                   if (paymentExternalId) {
                      //get risk status
                    //  var creedNzResponseUrl = "https://edge.staging.creednz.com/external/erp/payment/status/" + paymentExternalId
                      var creedNzResponseUrl = creednzBaseUrl +"/external/erp/payment/status/" + paymentExternalId;
 
                      var creedNzStatusResponse = https.get({
                         url: creedNzResponseUrl,
                         headers: creedNzApiHeaders
                      });
                      var creedNzStatusTransactions = creedNzStatusResponse.body;
                      //get consignment id
                      var creedNzStatusTransactionsParse = JSON.parse(creedNzStatusTransactions);
                      console.log("creedNzStatusTransactionsParse" + creedNzStatusTransactionsParse);
                      var creednzRiskStatus = creedNzStatusTransactionsParse.status;
                     // console.log("creednzRiskStatus"+creednzRiskStatus);
                      var recId = record.submitFields({
                         type: record.Type.VENDOR_PAYMENT,
                         id: paymentId,
                         values: {
                            custbody_creednz_payment_status: creednzRiskStatus,
                         },
                         options: {
                            enableSourcing: false,
                            ignoreMandatoryFields: true
                         }
                      });
                      console.log("record updated" + recId);
                   }
                } //end if
             } //end for
             location.reload();
             window.onbeforeunload = null;

          } catch (err) {
             console.log("error in analyzeResponse", err);
          }
       }
       function checkAccessToken() {
         try {
            var creednzObj = {};

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
            log.debug("current date", currentDate);
            // check if access token is exist or not
            if (lastSyncAccessToken) {
               //check if the access token is expired or not
               log.debug("access token exist, ckeck expired or not");
               //lastUpdatedDateTime = new Date(lastUpdatedDateTime);
               var lastUpdatedDateTimeNow = format.format({
                  value: lastUpdatedDateTime,
                  type: format.Type.DATETIMETZ
               });
               log.debug("lastUpdatedDateTimeNow", lastUpdatedDateTimeNow);
               var parsedDateStringAsRawDateObject = format.parse({
                  value: lastUpdatedDateTimeNow,
                  type: format.Type.DATETIMETZ
               });
               log.debug("parsedDateStringAsRawDateObject", parsedDateStringAsRawDateObject);
               var accessTokenTimeDiff = (currentDate.getTime() - parsedDateStringAsRawDateObject.getTime()) / 1000;
               console.log("time difference in seconds", accessTokenTimeDiff);
               // if access token expired, create new access token using refresh token
               if (accessTokenTimeDiff > 86400) {
                  // create new access token
                  console.log('old access token is expired, create new access token');
                  lastSyncAccessToken = getAccessToken(creednzClientId, creednzClientSecret, creednzAuth0, creednzAudience);
                  console.log("access token created when it expired", lastSyncAccessToken);
               }
            } //end if(lastSyncAccessToken)
            else {
               log.debug("no api key exist");
               // call function to create new access token
               lastSyncAccessToken = getAccessToken(creednzClientId, creednzClientSecret, creednzAuth0, creednzAudience);
               log.debug("access token created", lastSyncAccessToken);
            }
            console.log("lastSyncAccessToken"+lastSyncAccessToken);

            creednzObj.lastSyncAccessToken = lastSyncAccessToken;
            creednzObj.creednzBaseUrl = creednzBaseUrl;

            return creednzObj;
                  } catch (err) {
            log.debug("error in check access token", err.message);
         }
      } //end checkAccessToken
    
      function getAccessToken(creednzClientId, creednzClientSecret, creednzAuth0, creednzAudience) {
         try {
           // var creedApiUrl = "https://creednz-test.us.auth0.com/oauth/token";
           var creedApiUrl = creednzAuth0;

            var creedNzApiHeaders = {
               'content-type': 'application/x-www-form-urlencoded'
            };
            var newAccessTokenData = {
               "client_id": creednzClientId,
               "client_secret": creednzClientSecret,
               "grant_type": "client_credentials",
             //  "audience": "https://creednz-dynamics-integration"
             "audience": creednzAudience

            };
             var creedNzTokenApiResponse = https.post({
                url: creedApiUrl,
                headers: creedNzApiHeaders,
                body: newAccessTokenData
             });
             var creedNzTokenBody = creedNzTokenApiResponse.body;
             console.log("creedNzTokenBody", creedNzTokenBody);
             
             creedNzTokenBody = JSON.parse(creedNzTokenBody);
             var accessToken = creedNzTokenBody.access_token;
             console.log("accessToken in getAccessToken", accessToken);
             var currentDate = new Date();
             log.debug('currentDate', currentDate);
             record.submitFields({
                type: 'customrecord_creednz_details',
                id: 1,
                values: {
                   'custrecord_creednz_access_token': accessToken,
                   'custrecord_creednz_last_updated_date': currentDate
                }
             });
             return accessToken;
          } catch (err) {
             log.debug("error in function getAccessToken", err);
          }
       } //end function
         function fieldChanged(context) {
         try {
            window.onbeforeunload = null;
            let params = {};
            //check for filter fields
            if ((context.fieldId == 'custpage_pageid'))
            {
               var pageId = context.currentRecord.getValue({
                  fieldId: 'custpage_pageid'
               });
               pageId = parseInt(pageId.split('_')[1]);
               params.page = pageId;
               document.location = url.resolveScript({
                  scriptId: 'customscript_sl_send_payment_to_creednz',
                  deploymentId: 'customdeploy_sl_send_payment_to_creednz',
                  params: params
               });
            }
            }catch(err)
            {
               log.debug(err);
            }
         }
       return {
          pageInit: pageInit,
          getSuiteletPage: getSuiteletPage,
          creednzValidate: creednzValidate,
          analyzeResponse: analyzeResponse,
         fieldChanged:fieldChanged
          // viewVendorFindings: viewVendorFindings
       };
    });