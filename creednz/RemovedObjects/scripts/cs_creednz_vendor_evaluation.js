/**
 *
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope public
 * @author Rajitha
 * Script brief description:
    Send Vendor Evaluation to Creednz
 * Revision History:
 *
 * Date                 Issue/Case         Author          Issue Fix Summary
 * =============================================================================================
 * 2024/July/11                            Rajitha         Initial version.
 */
var searchId = 'customsearch_ss_vendor_search_for_creed';
define(['N/log', 'N/record', 'N/format', 'N/search', 'N/currentRecord', 'N/url', 'N/ui/dialog', 'N/https', 'N/http'], (log, record, format, search, currentRecord, url, dialog, https, http) => {
   function pageInit(context) {
      try {
         console.log("in pageinit");
      } catch (err) {
         log.debug("error in pageinit", err);
      }
   } //end pageinit
   //send result to vendor
   window.sendResultToVendors = function(param) {
      try {
         var vendorId = param.split(",")[0];
         var vendorEvaluationId = param.split(",")[1];
         //var lastSyncAccessToken = checkAccessToken();
         var creednzObj = checkAccessToken();
         var lastSyncAccessToken = creednzObj.lastSyncAccessToken;
         var creednzBaseUrl = creednzObj.creednzBaseUrl;
         var creedNzUrlVendor = creednzBaseUrl + "/external/erp/vendor-evaluation/" + vendorEvaluationId + "/send-results";
         console.log("vendorEvaluationId" + vendorEvaluationId);
         console.log("creedNzUrlVendor" + creedNzUrlVendor);
         var creedNzApiHeaders = {
            'accept': 'application/json',
            'content-type': 'application/json',
            'authorization': 'Bearer ' + lastSyncAccessToken
         };
         var creedNzResponse = https.post({
            url: creedNzUrlVendor,
            headers: creedNzApiHeaders
         });
         var creedNzTransactions = creedNzResponse.body;
         console.log("creedNzTransactions Body" + creedNzTransactions);
         //get consignment id
         var creedNzTransactionsParse = JSON.parse(creedNzTransactions);
         console.log("creedNzTransactionsParse" + creedNzTransactionsParse);
         var vendorIdResponse = creedNzTransactionsParse.id;
         console.log("vendorIdResponse" + vendorIdResponse);
         if (vendorIdResponse) {
            //delete the data in risk status and assessment status from custom record
            console.log("delete data from vendor with internal id" + vendorId)
            var custrecId = record.submitFields({
               type: 'customrecord_vendor_evaluation_table',
               id: vendorId,
               values: {
                  'custrecord_risk_status': '',
                  'custrecord_assessment_status': '',
                  'custrecord_updated_rec_or_not': 'T',
                  'custrecord_vendor_risk_status': ''
               }
            });
            location.reload();
         } // end if
      } catch (err) {
         console.log("error in send result to vendor" + err.message);
      }
   }; //end sendResultToVendors
   window.createVendor = function(vendorEvaluationId) {
      try {
         var parentSubsidiaryId;
         //get access token from custom record
         //var lastSyncAccessToken = checkAccessToken();
        
         var creednzObj = checkAccessToken();
         var lastSyncAccessToken = creednzObj.lastSyncAccessToken;
         var creednzBaseUrl = creednzObj.creednzBaseUrl;
         var creedNzUrlVendor = creednzBaseUrl + "/external/erp/vendor-evaluation/" + vendorEvaluationId + "/vendor";
         var creedNzApiHeaders = {
            'accept': 'application/json',
            'content-type': 'application/json',
            'authorization': 'Bearer ' + lastSyncAccessToken
         };
         var creedNzResponse = https.get({
            url: creedNzUrlVendor,
            headers: creedNzApiHeaders
         });
         var creedNzTransactions = creedNzResponse.body;
         /// alert("creedNzTransactions Body"+creedNzTransactions);
         console.log("creedNzTransactions Body" + creedNzTransactions);
         var creedNzTransactionsParse = JSON.parse(creedNzTransactions);
         // alert("creedNzTransactionsParse"+creedNzTransactionsParse);
         console.log("creedNzTransactionsParse" + creedNzTransactionsParse);
         var vendorNameResponse = creedNzTransactionsParse.name;
         var vendorCreatedAtResponse = creedNzTransactionsParse.createdAt;
         var vendorCreatedAtResponseNow = new Date(vendorCreatedAtResponse);
         var vendorUpdatedAtResponse = creedNzTransactionsParse.updatedAt;
         var vendorUpdatedAtResponseNow = new Date(vendorUpdatedAtResponse);
         var vendorExternalIdResponse = creedNzTransactionsParse.externalId;
         var vendorregCodeResponse = creedNzTransactionsParse.registrationCode;
         var vendorEmailResponse = creedNzTransactionsParse.email;
         var vendorPhoneResponse = creedNzTransactionsParse.phone;
         var vendorPrimaryContactResponse = creedNzTransactionsParse.primaryContact;
         var vendorAddressResponse = creedNzTransactionsParse.billingAddress;
         var vendorBillingCountryResponse = creedNzTransactionsParse.billingCountry;
         var vendorBillingCityResponse = creedNzTransactionsParse.billingCity;
         var vendorBillingZipResponse = creedNzTransactionsParse.billingZip;
         var primarySubsidiary = creedNzTransactionsParse.primarySubsidiary;
         var vendorPaymentMethod = creedNzTransactionsParse.vendorPaymentMethod;
         var vendorTaxPayerId = creedNzTransactionsParse.taxpayerID;
         var vendorcurrency = creedNzTransactionsParse.currency;
         var vendorBankAccName = creedNzTransactionsParse.bankAccountName;
         //var vendorBankNumber = creedNzTransactionsParse.bankNumber;
         var vendorBranchName = creedNzTransactionsParse.branchName;
         var vendorBranchNumber = creedNzTransactionsParse.branchNumber;
         var vendorBankCode = creedNzTransactionsParse.bankCode;
         var vendorbankAccNumber = creedNzTransactionsParse.bankAccountNumber;
         var vendorBankAddress = creedNzTransactionsParse.bankAddress;
         var vendorBankdetailsUpdate = creedNzTransactionsParse.bankDetailsUpdate;
         var vendorEftDetailsUpdate = creedNzTransactionsParse.eftBankDetailsUpdate;
         var vendorEftPayment = creedNzTransactionsParse.eftBillPayment;
         var vendorIban = creedNzTransactionsParse.iban;
         var vendorSwift = creedNzTransactionsParse.swift;
         var vendorRoutingNumber = creedNzTransactionsParse.routingNumber;
         var vendorPaypalAcc = creedNzTransactionsParse.paypalAccount;
         var vendorRecord = record.create({
            type: record.Type.VENDOR,
            isDynamic: true
         });
         var vendorName = vendorNameResponse + " " + vendorEvaluationId;
         vendorRecord.setValue({
            fieldId: 'companyname',
            value: vendorName
         });
         vendorRecord.setValue({
            fieldId: 'email',
            value: vendorEmailResponse
         });
         vendorRecord.setValue({
            fieldId: 'phone',
            value: vendorPhoneResponse
         });
         vendorRecord.setValue({
            fieldId: 'custentity_vendor_external_id',
            value: vendorExternalIdResponse
         });
         var currentDateNow = new Date();

         vendorRecord.setValue({
            fieldId: 'custentity_creednz_updated_on',
            value: currentDateNow
         });
         if (primarySubsidiary) {
            vendorRecord.setValue({
               fieldId: 'subsidiary',
               value: primarySubsidiary
            });
         } else {

               //set primary subsidiary 
               try{
         //get the parentsubsidiary of company
         var subsidiarySearchObj = search.create({
            type: "subsidiary",
            filters: [
               ["name", "is", "Parent Company"]
            ],
            columns: [
               search.createColumn({
                  name: "internalid",
                  label: "Internal ID"
               }),
               search.createColumn({
                  name: "name",
                  label: "Name"
               })
            ]
         });
         var searchResultCount = subsidiarySearchObj.runPaged().count;
         console.log("subsidiarySearchObj result count"+searchResultCount);
         if(!searchResultCount)
            {
               parentSubsidiaryId = 1;
            }
            else{

            
        // log.debug("subsidiarySearchObj result count", searchResultCount);
         subsidiarySearchObj.run().each(function(result) {
            // .run().each has a limit of 4,000 results
            parentSubsidiaryId = result.getValue({
               name: "internalid",
               label: "Internal ID"
            });
            var parentSubsidiaryName = result.getValue({
               name: "name",
               label: "Name"
            });
            return true;
         });
         }//end else
        
         vendorRecord.setValue({
            fieldId: 'subsidiary',
            value: parentSubsidiaryId
         });

               }catch(err)
               {
                  log.debug("error in subsidiary saved search");
               }
     
         }//end if
         /*vendorRecord.setValue({
            fieldId: 'billaddressee',
            value: vendorAddressResponse
         });
         vendorRecord.setValue({
            fieldId: 'billcity',
            value: vendorBillingCityResponse
         });
         vendorRecord.setValue({
            fieldId: 'billcountry',
            value: vendorBillingCountryResponse
         });
         vendorRecord.setValue({
            fieldId: 'billzip',
            value: vendorBillingZipResponse
         });*/
         if (vendorcurrency) {
            console.log("currency" + vendorcurrency);
            vendorRecord.setValue({
               fieldId: 'currency',
               value: parseInt(vendorcurrency)
            });
         }
         vendorRecord.setValue({
            fieldId: 'dateCreated',
            value: vendorCreatedAtResponseNow
         });
         vendorRecord.setValue({
            fieldId: 'custentity_vendor_payment_method_creeedn',
            value: vendorPaymentMethod
         });
         vendorRecord.setValue({
            fieldId: 'custentity_bank_account_name_creednz',
            value: vendorBankAccName
         });
         vendorRecord.setValue({
            fieldId: 'custentity_bank_address_creednz',
            value: vendorBankAddress
         });
         vendorRecord.setValue({
            fieldId: 'custentity_bank_code_creednz',
            value: vendorBankCode
         });
         vendorRecord.setValue({
            fieldId: 'custentity_bank_number_creednz',
            value: vendorbankAccNumber
         });
         vendorRecord.setValue({
            fieldId: 'custentity_bank_details_update_creednz',
            value: vendorBankdetailsUpdate
         });
         vendorRecord.setValue({
            fieldId: 'custentity_bank_address_creednz',
            value: vendorBankAddress
         });
         vendorRecord.setValue({
            fieldId: 'custentity_eft_bank_detailsupdate_creedn',
            value: vendorEftDetailsUpdate
         });
         vendorRecord.setValue({
            fieldId: 'custentity_eft_bill_payment_creednz',
            value: vendorEftPayment
         });
         vendorRecord.setValue({
            fieldId: 'custentity_iban_creednz',
            value: vendorIban
         });
         vendorRecord.setValue({
            fieldId: 'custentity_swift_creednz',
            value: vendorSwift
         });
         vendorRecord.setValue({
            fieldId: 'custentity_registraion_code_creednz',
            value: vendorregCodeResponse
         });
         vendorRecord.setValue({
            fieldId: 'custentity_branch_number_creednz',
            value: vendorBranchNumber
         });
         vendorRecord.setValue({
            fieldId: 'custentity_branch_name_creednz',
            value: vendorBranchName
         });
         vendorRecord.setValue({
            fieldId: 'custentity_routing_number_creednz',
            value: vendorRoutingNumber
         });
         vendorRecord.setValue({
            fieldId: 'custentity_paypal_account_creednz',
            value: vendorPaypalAcc
         });
         vendorRecord.setValue({
            fieldId: 'isinactive',
            value: false
         });
         vendorRecord.selectNewLine({
            sublistId: 'addressbook'
         });
         var addressSubrecord = vendorRecord.getCurrentSublistSubrecord({
            sublistId: 'addressbook',
            fieldId: 'addressbookaddress'
         });
         // Set all required values here.
         // country search to get country code
         var vendorCountryCode;
         var customrecord_country_codesSearchObj = search.create({
            type: "customrecord_country_code_creednz",
            filters: [
               ["custrecord_country_name_full", "is", vendorBillingCountryResponse]
            ],
            columns: [
               search.createColumn({
                  name: "custrecord_country_name_full",
                  label: "Country Name Full"
               }),
               search.createColumn({
                  name: "custrecord_country_code_creednz",
                  label: "Country Code"
               })
            ]
         });
         var searchResultCount = customrecord_country_codesSearchObj.runPaged().count;

         log.debug("customrecord_country_codesSearchObj result count", searchResultCount);
         console.log("customrecord_country_codesSearchObj result count"+ searchResultCount);
         customrecord_country_codesSearchObj.run().each(function(result) {
            // .run().each has a limit of 4,000 results
            vendorCountryCode = result.getValue({
               name: "custrecord_country_code_creednz",
               label: "Country Code"
            });
            return true;
         });
         //end country search
         addressSubrecord.setValue({
            fieldId: 'country',
            value: vendorCountryCode
         });
         addressSubrecord.setValue({
            fieldId: 'addressee',
            value: vendorAddressResponse
         });
         addressSubrecord.setValue({
            fieldId: 'city',
            value: vendorBillingCityResponse
         });
         addressSubrecord.setValue({
            fieldId: 'zip',
            value: vendorBillingZipResponse
         });
         vendorRecord.commitLine({
            sublistId: 'addressbook'
         });
         // End Adding address details       
         // check if the vendor is existing or not
         var vendorSearchObj = search.create({
            type: "vendor",
            filters: [
               ["entityid", "is", vendorName]
            ],
            columns: [
               search.createColumn({
                  name: "entityid",
                  label: "Name"
               }),
               search.createColumn({
                  name: "email",
                  label: "Email"
               }),
               search.createColumn({
                  name: "phone",
                  label: "Phone"
               }),
            ]
         });
         var searchResultCount = vendorSearchObj.runPaged().count;
         log.debug("vendorSearchObj result count", searchResultCount);
         console.log("vendorSearchObj result count"+ searchResultCount);

         if (!searchResultCount) {
            var vendorRecId = vendorRecord.save({
               ignoreMandatoryFields: true
           });
            console.log("vendor record saved" + vendorRecId);
            //alert("record created at netsuite" + vendorRecId);
            //delete corresponding record from vendor evaluation table
            if (vendorRecId) {
               var customrecord_vendor_evaluation_tableSearchObj = search.create({
                  type: "customrecord_vendor_evaluation_table",
                  filters: [
                     ["custrecord_creednz_evaluation_id", "is", vendorEvaluationId]
                  ],
                  columns: [
                     search.createColumn({
                        name: "id",
                        label: "ID"
                     }),
                  ]
               });
               var searchResultCount = customrecord_vendor_evaluation_tableSearchObj.runPaged().count;
               log.debug("customrecord_vendor_evaluation_tableSearchObj result count", searchResultCount);
               customrecord_vendor_evaluation_tableSearchObj.run().each(function(result) {
                  // .run().each has a limit of 4,000 results
                  var vendorevRecId = result.getValue({
                     name: "id",
                     label: "ID"
                  });
                  var vendorevaluationRecord = record.delete({
                     type: 'customrecord_vendor_evaluation_table',
                     id: vendorevRecId,
                  });
                  return true;
               });
            }
         } else {
            alert("This Vendor is already Existing");
         }
         location.reload();
      } catch (err) {
         console.log("error in create vendor" + err.message);
      }
   }; //end createVendor
   function updateVendorAnalyze(context) {
      try {
         //check for access token
         // var lastSyncAccessToken = checkAccessToken();
         var creednzObj = checkAccessToken();
         var lastSyncAccessToken = creednzObj.lastSyncAccessToken;
         var creednzBaseUrl = creednzObj.creednzBaseUrl;
         var creedNzUrl = creednzBaseUrl + "/external/erp/vendor-evaluation";
         var creedNzApiHeaders = {
            'accept': 'application/json',
            'content-type': 'application/json',
            'authorization': 'Bearer ' + lastSyncAccessToken
         };
         //post data to Creednz
         var creedNzResponse = https.get({
            url: creedNzUrl,
            headers: creedNzApiHeaders
         });
         //console.log("creedNzResponse" + creedNzResponse);
         //alert("creedNzResponse"+ creedNzResponse);
         var creedNzTransactions = creedNzResponse.body;
         // console.log("creedNzTransactions"+creedNzTransactions);
         console.log("creedNzTransactions Body" + creedNzTransactions);
         //get consignment id
         var creedNzTransactionsParse = JSON.parse(creedNzTransactions);
         // alert("creedNzTransactionsParse"+creedNzTransactionsParse);
         //  console.log("creedNzTransactionsParse", creedNzTransactionsParse);
         var creedNzTransactionsLength = creedNzTransactionsParse.length;
         //get details from response example with one data
         for (var i = 0; i < creedNzTransactionsLength; i++) {
            var emailIdFromResponse = creedNzTransactionsParse[i].email;
            var primaryContactResponse = creedNzTransactionsParse[i].primaryContact;
            var vendorNameFromResponse = creedNzTransactionsParse[i].name;
            var evaluationIdResponse = creedNzTransactionsParse[i].id;
            var riskAssessmentStatusResponse = creedNzTransactionsParse[i].riskAssessmentStatus;
            //console.log("riskAssessmentStatusResponse " + i + ": "+ riskAssessmentStatusResponse);
            var riskStatusResponse = creedNzTransactionsParse[i].riskStatus;
            //alert("riskStatusResponse"+riskStatusResponse);
            if (riskStatusResponse == 'AtRisk') {
               riskStatusResponse = "Risk Detected";
            }
            // update in custom record
            var customrecord_vendor_evaluation_tableSearchObj = search.create({
               type: "customrecord_vendor_evaluation_table",
               filters: [
                  ["custrecord_creednz_evaluation_id", "is", evaluationIdResponse]
               ],
               columns: [
                  search.createColumn({
                     name: "internalid",
                     label: "Internal ID"
                  }),
                  search.createColumn({
                     name: "custrecord_creednz_evaluation_id",
                     label: "Creednz Evaluation ID"
                  })
               ]
            });
            var searchResultCount = customrecord_vendor_evaluation_tableSearchObj.runPaged().count;
            log.debug("customrecord_vendor_evaluation_tableSearchObj result count", searchResultCount);
            customrecord_vendor_evaluation_tableSearchObj.run().each(function(result) {
               // .run().each has a limit of 4,000 results
               var vendorRecId = result.getValue({
                  name: "internalid"
               });
               var inviteVendorRecId = record.submitFields({
                  type: 'customrecord_vendor_evaluation_table',
                  id: vendorRecId,
                  values: {
                     'custrecord_risk_status': riskStatusResponse,
                     'custrecord_assessment_status': riskAssessmentStatusResponse
                  }
               });
               log.debug("value added to the record", inviteVendorRecId);
               return true;
            });
            if (!searchResultCount) {
               console.log("this vendor is not exist in vendor evaluation table");
            }
         } //end for loop
         location.reload();
      } catch (err) {
         log.debug("error in post", err);
      }
   } //end post*/
   //check for access token in custom record
   function checkAccessToken() {
      try {
         //get access token from custom record
         var creednzObj = {};
         //get access token from custom record
         var accessTokenLookup = search.lookupFields({
            type: 'customrecord_creednz_details',
            id: 1,
            columns: ['custrecord_creednz_access_token', 'custrecord_creednz_last_updated_date', 'custrecord_creednz_client_id', 'custrecord_creednz_client_secret', 'custrecord_creednz_base_url', 'custrecord_auth0_get_token_api', 'custrecord_audience']
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
         // return lastSyncAccessToken;
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
         creedNzTokenBody = JSON.parse(creedNzTokenBody);
         var accessToken = creedNzTokenBody.access_token;
         console.log("accessToken in getAccessToken", accessToken);
         //alert(accessToken)
         var currentDate = new Date();
         log.debug('currentDate', currentDate);
         record.submitFields({
            type: 'customrecord_creednz_details',
            id: 1,
            values: {
               // 'custrecord_raken_code': 'oLL0r0',
               'custrecord_creednz_access_token': accessToken,
               'custrecord_creednz_last_updated_date': currentDate
            }
         });
         return accessToken;
      } catch (err) {
         log.debug("error in function getAccessToken", err);
      }
   } //end function
   function openSuiteletPopup() {
      try {
         //  debugger;
         var suiteletUrl = url.resolveScript({
            scriptId: 'customscript_sl_invite_vendor_to_creednz',
            deploymentId: 'customdeploy_sl_invite_vendor_to_creednz'
         });
         window.open(suiteletUrl, 'Suitelet Popup', 'width=600,height=600');
         console.log("end test");
      } catch (err) {
         console.debug("error" + err);
      }
   }

   function getParameterFromURL(param) {
      var query = window.location.search.substring(1);
      console.log("query" + query);
      var vars = query.split("&");
      for (var i = 0; i < vars.length; i++) {
         var pair = vars[i].split("=");
         if (pair[0] == param) {
            return decodeURIComponent(pair[1]);
         }
      }
      return (false);
   }

   function executeScheduledScript() {
      try {
         //execute sceduled script
         console.log("execute schedule script");
         /*  var scriptTask = task.create({
              taskType: task.TaskType.SCHEDULED_SCRIPT,
              scriptId: "customscript_ss_get_vendor_externalid_cr",
              deploymentId: "customdeploy_ss_get_vendor_externalid_cr"
           });
           var scriptTaskId = scriptTask.submit();
           log.debug("scriptTaskId", scriptTaskId);*/
         var suiteletUrl = url.resolveScript({
            scriptId: 'customscript_sl_call_scheduled_script_cr',
            deploymentId: 'customdeploy_sl_call_scheduled_script_cr',
         });
         var suiteletUrlNow = suiteletUrl.split("&compid")[0];
         /*http.get({
            url: suiteletUrl
        });*/
         https.get.promise({
            url: suiteletUrl
         }).then(function(response) {
            // console.log('Suitelet executed in the background: ' + response.body);
         }).catch(function(err) {
            // Handle any errors that occurred during the request
            console.error('Error executing Suitelet: ' + err.message);
         });
      } catch (err) {
         console.log("error in executeScheduledScript function" + err.message);
      }
   } //end function
   function fieldChanged(context) {
      try {
         window.onbeforeunload = null;
         let params = {};
         //check for filter fields
         if ((context.fieldId == 'custpage_pageid')) {
            var pageId = context.currentRecord.getValue({
               fieldId: 'custpage_pageid'
            });
            pageId = parseInt(pageId.split('_')[1]);
            params.page = pageId;
            document.location = url.resolveScript({
               scriptId: 'customscript_sl_creednz_vendor_evaluatio',
               deploymentId: 'customdeploy_sl_creednz_vendor_evaluatio',
               params: params
            });
         }
      } catch (err) {
         log.debug(err);
      }
   }

   function refresh() {
      try {
         location.reload();
      } catch (err) {
         console.log("error in refresh button", err);
      }
   }
   return {
      pageInit: pageInit,
      fieldChanged: fieldChanged,
      getParameterFromURL: getParameterFromURL,
      openSuiteletPopup: openSuiteletPopup,
      updateVendorAnalyze: updateVendorAnalyze,
      refresh: refresh,
      executeScheduledScript: executeScheduledScript,
      checkAccessToken: checkAccessToken
   };
});