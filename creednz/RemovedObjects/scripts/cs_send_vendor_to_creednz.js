/**
 *
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope public
 * @author Rajitha
 * Script brief description:
    Send Vendor to Creednz
 * Revision History:
 *
 * Date                 Issue/Case         Author          Issue Fix Summary
 * =============================================================================================
 * 2024/June/12                            Rajitha         Initial version.
 */
    var searchId = 'customsearch_ss_vendor_search_for_creed';
    define(['N/log', 'N/record', 'N/format', 'N/search', 'N/currentRecord', 'N/url', 'N/ui/dialog', 'N/https'], (log, record, format, search, currentRecord, url, dialog, https) => {
      
      function pageInit(context)
      {
        try{
            console.log("pageinit");
            var currentRecord = context.currentRecord;
            var urlField = context.currentRecord.getField({
               fieldId: 'custpage_view_risk_info'
           });
   
           urlField.isDisabled = false; // Make the URL field clickable
   
           urlField.defaultValue = url.resolveScript({
               scriptId: 'customscript_sl_vendor_page_creednz_info', 
               deploymentId: 'customdeploy_sl_vendor_page_creednz_info' 
           });
                                   

        }catch(err)
        {
            console.log("error in pageinit :"+err);
        }
      }
    
       function fieldChanged(context) {
          try {
             window.onbeforeunload = null;
             let params = {};
             //check for filter fields
             // pageid field in vendor analysis page
             if ((context.fieldId == 'custpage_pageid_send')){
            var pageId = context.currentRecord.getValue({
                   fieldId: 'custpage_pageid_send'
                });
                pageId = parseInt(pageId.split('_')[1]);
                params.page = pageId;
                document.location = url.resolveScript({
                  scriptId: 'customscript_sl_send_vendor_to_creed_ns',
                  deploymentId: 'customdeploy_sl_send_vendor_to_creed_ns',
                  params: params
               });

             }//end if
             //check filter fields in creednz information page
             if ((context.fieldId == 'custpage_pageid')) {
                var pageId = context.currentRecord.getValue({
                   fieldId: 'custpage_pageid'
                });
                pageId = parseInt(pageId.split('_')[1]);
                params.page = pageId;
                var externalId = context.currentRecord.getValue({
                  fieldId: 'custpage_vendor_external_id'
               });
               params.externalId = externalId;

              /*  var filterBankAccRisk = context.currentRecord.getValue({
                   fieldId: 'custpage_bank_acc_risk'
                });
                if (filterBankAccRisk) {
                   params.filterBankAccRisk = filterBankAccRisk;
                   console.log(params.filterBankAccRisk);
                }
                var filterOperationRisk = context.currentRecord.getValue({
                   fieldId: 'custpage_operation_risk'
                });
                if (filterOperationRisk) {
                   params.filterOperationRisk = filterOperationRisk;
                }
                var filterSanctionRisk = context.currentRecord.getValue({
                   fieldId: 'custpage_sanction_risk'
                });
                if (filterSanctionRisk) {
                   params.filterSanctionRisk = filterSanctionRisk;
                   console.log("filterSanctionRisk"+filterSanctionRisk);
                }
                var filterCyberRisk = context.currentRecord.getValue({
                   fieldId: 'custpage_cyber_risk'
                });
                if (filterCyberRisk) {
                   params.filterCyberRisk = filterCyberRisk;
                }*/
                //alert("params"+params);
                document.location = url.resolveScript({
                   scriptId: 'customscript_sl_vendor_page_creednz_info',
                   deploymentId: 'customdeploy_sl_vendor_page_creednz_info',
                   params: params
                });
             } //end if
            
               if (context.fieldId === 'custpage_view_risk_info') {
                  var suiteletUrl = context.currentRecord.getValue({
                      fieldId: 'custpage_view_risk_info'
                  });
                  window.open(suiteletUrl, '_blank', 'width=800,height=600');
              }
           
          } catch (err) {
             console.log("error" + err);
          }
       } // end field change
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
          //  var lastSyncAccessToken = checkAccessToken();
          var creednzObj = checkAccessToken();
          var lastSyncAccessToken =  creednzObj.lastSyncAccessToken;
          var creednzBaseUrl = creednzObj.creednzBaseUrl;
            
            // creedNzUrl = "https://edge.staging.creednz.com/external/microsoft-dynamics/analyze-vendors";
            creedNzUrl = creednzBaseUrl + "/external/erp/vendor/analyze"; 
            var creedNzApiHeaders = {
                'accept': 'application/json',
                'content-type': 'application/json',
                'authorization': 'Bearer ' + lastSyncAccessToken
             };
             var vendorArray = [];
            // var vendorObj = {};
             //get data from sublist
             var vendorIdArray = [];
             var currentrecord = currentRecord.get();
             var numLines = currentrecord.getLineCount({
                sublistId: 'custpage_analyze_vendor_sublist'
             });
             for (var i = 0; i < numLines; i++) {
                var checkbox = currentrecord.getSublistValue({
                   sublistId: 'custpage_analyze_vendor_sublist',
                   fieldId: 'custpage_rec_process',
                   line: i
                });
                if (checkbox) {
                   var vendorObj = {};
                   var vendorId = currentrecord.getSublistValue({
                      sublistId: 'custpage_analyze_vendor_sublist',
                      fieldId: 'custpage_vendor_id',
                      line: i
                   });
                   if(vendorId)
                   {
                     vendorObj.internalId = vendorId;
                   }
                   var vendorName = currentrecord.getSublistValue({
                      sublistId: 'custpage_analyze_vendor_sublist',
                      fieldId: 'custpage_vendor_name',
                      line: i
                   });
                   if(vendorName)
                     {
                       vendorObj.name = vendorName;
                     }
                   var vendorHold = currentrecord.getSublistValue({
                      sublistId: 'custpage_analyze_vendor_sublist',
                      fieldId: 'custpage_vendor_hold',
                      line: i
                   });
                  
                   var vendorPhone = currentrecord.getSublistValue({
                      sublistId: 'custpage_analyze_vendor_sublist',
                      fieldId: 'custpage_phone',
                      line: i
                   });
                   if(vendorPhone)
                     {
                       vendorObj.phone = vendorPhone;
                     }
                   var vendorExtension = currentrecord.getSublistValue({
                      sublistId: 'custpage_analyze_vendor_sublist',
                      fieldId: 'custpage_extension',
                      line: i
                   });
                   var vendorPrimaryContact = currentrecord.getSublistValue({
                      sublistId: 'custpage_analyze_vendor_sublist',
                      fieldId: 'custpage_primary_contact',
                      line: i
                   });
                   
                   var vendorGroup = currentrecord.getSublistValue({
                      sublistId: 'custpage_analyze_vendor_sublist',
                      fieldId: 'custpage_group',
                      line: i
                   });
                   var vendorCurrency = currentrecord.getSublistValue({
                      sublistId: 'custpage_analyze_vendor_sublist',
                      fieldId: 'custpage_currency',
                      line: i
                   });
                   if(vendorCurrency)
                     {
                        vendorCurrency = JSON.stringify(vendorCurrency);
                       vendorObj.currency = vendorCurrency;
                     }
                   var vendorSubsidiary = currentrecord.getSublistValue({
                      sublistId: 'custpage_analyze_vendor_sublist',
                      fieldId: 'custpage_subsidiary',
                      line: i
                   });
                   if(vendorSubsidiary)
                     {
                       vendorObj.primarySubsidiary = vendorSubsidiary;
                     }
                   var vendorCreatedDate = currentrecord.getSublistValue({
                      sublistId: 'custpage_analyze_vendor_sublist',
                      fieldId: 'custpage_date_created',
                      line: i
                   });
                 

                   // format date
                   var vendordateCreatedFormat = format.format({
                     value: vendorCreatedDate,
                     type: format.Type.DATETIMETZ
                  });
                  var vendordateCreated1 = format.parse({
                     value: vendordateCreatedFormat,
                     type: format.Type.DATETIMETZ
                  });
                  //end format
                  if(vendordateCreated1)
                     {
                       vendorObj.dateCreated = vendordateCreated1;
                     }

                   var vendorLastModified = currentrecord.getSublistValue({
                      sublistId: 'custpage_analyze_vendor_sublist',
                      fieldId: 'custpage_last_modified',
                      line: i
                   });
                    // format date
                    var lastModifiedFormat = format.format({
                     value: vendorLastModified,
                     type: format.Type.DATETIMETZ
                  });
                  var lastModified2 = format.parse({
                     value: lastModifiedFormat,
                     type: format.Type.DATETIMETZ
                  });
                  //end format
                  if(lastModified2)
                     {
                       vendorObj.lastModified = lastModified2;
                     }

                   var vendorEmail = currentrecord.getSublistValue({
                      sublistId: 'custpage_analyze_vendor_sublist',
                      fieldId: 'custpage_vendor_email',
                      line: i
                   });
                   if(vendorEmail)
                     {
                       vendorObj.email = vendorEmail;
                     }


                     //get bank related fields
                     var vendorPaymentMethod = currentrecord.getSublistValue({
                        sublistId: 'custpage_analyze_vendor_sublist',
                        fieldId: 'custpage_vendor_payment_method',
                        line: i
                     });
                     if(vendorPaymentMethod)
                        {
                          vendorObj.vendorPaymentMethod = vendorPaymentMethod;
                        }
                     var vendorBankAccName = currentrecord.getSublistValue({
                        sublistId: 'custpage_analyze_vendor_sublist',
                        fieldId: 'custpage_vendor_bank_acc_name',
                        line: i
                     });
                     if(vendorBankAccName)
                        {
                          vendorObj.bankAccountName = vendorBankAccName;
                        }
                     var vendorBankAddress = currentrecord.getSublistValue({
                        sublistId: 'custpage_analyze_vendor_sublist',
                        fieldId: 'custpage_vendor_bank_address',
                        line: i
                     });
                     if(vendorBankAddress)
                        {
                          vendorObj.bankAddress = vendorBankAddress;
                        }
                     var vendorBankCode = currentrecord.getSublistValue({
                        sublistId: 'custpage_analyze_vendor_sublist',
                        fieldId: 'custpage_vendor_bank_code',
                        line: i
                     });
                     if(vendorBankCode)
                        {
                          vendorObj.bankCode = vendorBankCode;
                        }
                     var vendorBankNumber = currentrecord.getSublistValue({
                        sublistId: 'custpage_analyze_vendor_sublist',
                        fieldId: 'custpage_vendor_bank_number',
                        line: i
                     });
                     if(vendorBankNumber)
                        {
                          vendorObj.bankAccountNumber = vendorBankNumber;
                        }
                     var vendorBankDetailsUpdate = currentrecord.getSublistValue({
                        sublistId: 'custpage_analyze_vendor_sublist',
                        fieldId: 'custpage_vendor_bank_details_update',
                        line: i
                     });
                     if(vendorBankDetailsUpdate)
                        {
                          vendorObj.bankDetailsUpdate = vendorBankDetailsUpdate;
                        }
                     var vendorEftBankUpdate = currentrecord.getSublistValue({
                        sublistId: 'custpage_analyze_vendor_sublist',
                        fieldId: 'custpage_vendor_eft_bank_update',
                        line: i
                     });
                     if(vendorEftBankUpdate)
                        {
                          vendorObj.eftBankDetailsUpdate = vendorEftBankUpdate;
                        }
                     var vendorEftBillPayment = currentrecord.getSublistValue({
                        sublistId: 'custpage_analyze_vendor_sublist',
                        fieldId: 'custpage_vendor_eft_bill_payment',
                        line: i
                     });
                     if(vendorEftBillPayment)
                        {
                          vendorObj.eftBillPayment = vendorEftBillPayment;
                        }
                     var vendorIban = currentrecord.getSublistValue({
                        sublistId: 'custpage_analyze_vendor_sublist',
                        fieldId: 'custpage_vendor_iban',
                        line: i
                     });
                     if(vendorIban)
                        {
                          vendorObj.iban = vendorIban;
                        }
                     var vendorSwift = currentrecord.getSublistValue({
                        sublistId: 'custpage_analyze_vendor_sublist',
                        fieldId: 'custpage_vendor_swift',
                        line: i
                     });
                     if(vendorSwift)
                        {
                          vendorObj.swift = vendorSwift;
                        }
                     var vendorRegCode = currentrecord.getSublistValue({
                        sublistId: 'custpage_analyze_vendor_sublist',
                        fieldId: 'custpage_vendor_reg_code',
                        line: i
                     });
                     if(vendorRegCode)
                        {
                          vendorObj.registrationCode = vendorRegCode;
                        }
                     var vendorBranchNumber = currentrecord.getSublistValue({
                        sublistId: 'custpage_analyze_vendor_sublist',
                        fieldId: 'custpage_vendor_branch_number',
                        line: i
                     });
                     if(vendorBranchNumber)
                        {
                          vendorObj.branchNumber = vendorBranchNumber;
                        }
                     var vendorBranchName = currentrecord.getSublistValue({
                        sublistId: 'custpage_analyze_vendor_sublist',
                        fieldId: 'custpage_vendor_branch_name',
                        line: i
                     });
                     if(vendorBranchName)
                        {
                          vendorObj.branchName = vendorBranchName;
                        }
                     var vendorRoutingNum = currentrecord.getSublistValue({
                        sublistId: 'custpage_analyze_vendor_sublist',
                        fieldId: 'custpage_vendor_routing_number',
                        line: i
                     });
                     if(vendorRoutingNum)
                        {
                          vendorObj.routingNumber = vendorRoutingNum;
                        }
                     var vendorPaypalAcc = currentrecord.getSublistValue({
                        sublistId: 'custpage_analyze_vendor_sublist',
                        fieldId: 'custpage_vendor_paypal_acc',
                        line: i
                     });
                     if(vendorPaypalAcc)
                        {
                          vendorObj.paypalAccount = vendorPaypalAcc;
                        }
   
                      //ebd get bank related fields


                   var vendorAddress = currentrecord.getSublistValue({
                      sublistId: 'custpage_analyze_vendor_sublist',
                      fieldId: 'custpage_vendor_address',
                      line: i
                   });
                   if(vendorAddress)
                     {
                       vendorObj.billingAddress = vendorAddress;
                     }
                   var vendorBillCountry = currentrecord.getSublistValue({
                      sublistId: 'custpage_analyze_vendor_sublist',
                      fieldId: 'custpage_vendor_bill_country',
                      line: i
                   });
                   if(vendorBillCountry)
                     {
                       vendorObj.billingCountry = vendorBillCountry;
                     }
                   var vendorBillCity = currentrecord.getSublistValue({
                      sublistId: 'custpage_analyze_vendor_sublist',
                      fieldId: 'custpage_vendor_bill_city',
                      line: i
                   });
                   if(vendorBillCity)
                     {
                       vendorObj.billingCity = vendorBillCity;
                     }
                   var vendorBillZip = currentrecord.getSublistValue({
                      sublistId: 'custpage_analyze_vendor_sublist',
                      fieldId: 'custpage_vendor_bill_zip',
                      line: i
                   });
                   if(vendorBillZip)
                     {
                       vendorObj.billingZip = vendorBillZip;
                     }
                   //  console.log("data"+ vendorId + " " + vendorName + " " + vendorCurrency + " " + vendorBillCity + " " + vendorBillCountry + " " + vendorBillZip + " " + vendorCreatedDate);
                   vendorIdArray.push(vendorId);
                   vendorArray.push(vendorObj);
                }
             }
             console.log("vendorArray"+ vendorArray);
             //console.log("vendorArray"+vendorArray);
             var dataObj = {};
             dataObj.analyzeVendorDtos = vendorArray;
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
                var vendorExternalIdArray = [];
                for (var i = 0; i < creedNzTransactionsLength; i++) {
                   var vendorExternalId = creedNzTransactionsParse[i].vendorExternalId;
                   vendorExternalIdArray.push(vendorExternalId);
                } //end for loop
                // set vendor external id in vendor record
                for (var j = 0; j < vendorIdArray.length; j++) {
                   var vendorIdToUpdate = vendorIdArray[j];
                   var recId = record.submitFields({
                      type: record.Type.VENDOR,
                      id: vendorIdToUpdate,
                      values: {
                         custentity_vendor_external_id: vendorExternalIdArray[j],
                         custentity_creednz_updated_on: new Date()
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
          } catch (err) {
             log.debug("error in post", err);
          }
       } //end post*/
       function analyzeResponse(context) {
          try {
             // analyze response
           //  var lastSyncAccessToken = checkAccessToken();
           var creednzObj = checkAccessToken();
           var lastSyncAccessToken =  creednzObj.lastSyncAccessToken;
           var creednzBaseUrl = creednzObj.creednzBaseUrl;
             var creedNzApiHeaders = {
                'accept': 'application/json',
                'content-type': 'application/json',
                'authorization': 'Bearer ' + lastSyncAccessToken
             };
            
             //get data from sublist
             var currentrecord = currentRecord.get();
             var numLines = currentrecord.getLineCount({
                sublistId: 'custpage_analyze_vendor_response'
             });
             for (var i = 0; i < numLines; i++) {
                var checkbox = currentrecord.getSublistValue({
                   sublistId: 'custpage_analyze_vendor_response',
                   fieldId: 'custpage_rec_process_response',
                   line: i
                });
                if (checkbox) {
                   var vendorId = currentrecord.getSublistValue({
                      sublistId: 'custpage_analyze_vendor_response',
                      fieldId: 'custpage_vendor_id_response',
                      line: i
                   });
                   //alert("vendorId" + vendorId);
                   var vendorExternalId = currentrecord.getSublistValue({
                      sublistId: 'custpage_analyze_vendor_response',
                      fieldId: 'custpage_vendor_external_id',
                      line: i
                   });
                   if (vendorExternalId) {
                      //get risk status
                      //var creedNzResponseUrl = "https://edge.staging.creednz.com/external/microsoft-dynamics/vendor-status/" + vendorExternalId;
                      var creedNzResponseUrl = creednzBaseUrl +"/external/erp/vendor/status/" + vendorExternalId;
                      var creedNzStatusResponse = https.get({
                         url: creedNzResponseUrl,
                         headers: creedNzApiHeaders
                      });
                      console.log("creedNzStatusResponse" + creedNzStatusResponse);
                      var creedNzStatusTransactions = creedNzStatusResponse.body;
                      console.log("creedNzStatusTransactions Body" + creedNzStatusTransactions);
                      //get consignment id
                      var creedNzStatusTransactionsParse = JSON.parse(creedNzStatusTransactions);
                      console.log("creedNzStatusTransactionsParse" + creedNzStatusTransactionsParse);
                   
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
                } //end if
             } //end for
             location.reload();
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

            creednzObj.lastSyncAccessToken = lastSyncAccessToken;
            creednzObj.creednzBaseUrl = creednzBaseUrl;

            return creednzObj;
         } catch (err) {
            log.debug("error in check access token", err.message);
         }
      } //end checkAccessToken
    
      function getAccessToken(creednzClientId, creednzClientSecret, creednzAuth0, creednzAudience) {
         try {
             //create access token 
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

       function cancelWindow() {
         try {
           {
            window.close();
            window.opener.location.reload();
           }
         } catch (error) {
           console.log("error in cancel button"+error);
           
         }
         
       }
      
       return {
          pageInit: pageInit,
          fieldChanged: fieldChanged,
          getSuiteletPage: getSuiteletPage,
          creednzValidate: creednzValidate,
          analyzeResponse: analyzeResponse,
          cancelWindow: cancelWindow
          // viewVendorFindings: viewVendorFindings
       };
    });