/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 * @NModuleScope Public
 * @author Rajitha K S
 * Script brief description:
 Scheduled Script is used for following tasks:
 1. analyse all vendors to get the creednz vendor external id
 * Revision History:
 *
 * Date                 Issue/Case          Author          Issue Fix Summary
 * =============================================================================================
 * 2024/July/11                          Rajitha         Initial version.
 *
 */
var vendorArray = [];
var validatedVendors = [];
var executionCount;
var vendorIdArray = [];

define(['N/https', 'N/log', 'N/record', 'N/encode', 'N/format', 'N/search', 'N/email', 'N/runtime', 'N/task', './ssearches/searchlib', './lib/creednz_token_lib']
    , (https, log, record, encode, format, search, email, runtime, task, searchlib,creednz_token_lib) => {
        function execute(context) {
            try {
                var startTime = new Date().getTime();
                // var vendorArray = [];
                //get data from sublist

                var scriptObj = runtime.getCurrentScript();
                // get parameters
                validatedVendors = scriptObj.getParameter({
                    name: 'custscript_vendor_array'
                });
                validatedVendors = JSON.parse(validatedVendors);
                // load vendor search
                /*
               var vendorEvalTableSearch = search.load({
                  id: 'customsearch_ss_get_creednz_external_id'
               });
               */
                var vendorEvalTableSearch = searchlib.customsearch_ss_get_creednz_external_id();

                //check for vendors to be validated
                if (validatedVendors) {
                    var customFilter = search.createFilter({
                        name: 'internalid',
                        operator: search.Operator.NONEOF,
                        values: validatedVendors
                    });
                    vendorEvalTableSearch.filters.push(customFilter);
                }


                log.debug("vendorEvalTableSearch", vendorEvalTableSearch);

                vendorEvalTableSearch.run().each(function (result) {
                    log.debug('vendorEvalTableSearchResult', result);
                    var vendorObj = {};
                    var vendorId = result.getValue({
                        name: 'internalid'
                    });

                    if (vendorId) {
                        vendorObj.internalId = vendorId;
                        log.debug("vendorId", vendorId);

                    }

                    var vendorName = result.getValue({
                        name: 'entityid'
                    });
                    if (vendorName) {
                        vendorObj.name = vendorName;
                    }
                    var vendorSubsidiary = result.getValue({
                        name: 'subsidiary'
                    });
                    if (vendorSubsidiary) {
                        vendorObj.primarySubsidiary = vendorSubsidiary;
                    }
                    var vendordateCreated = result.getValue({
                        name: 'datecreated'
                    });
                    var vendordateCreatedFormat = format.format({
                        value: vendordateCreated,
                        type: format.Type.DATETIMETZ
                    });
                    var vendordateCreated1 = format.parse({
                        value: vendordateCreatedFormat,
                        type: format.Type.DATETIMETZ
                    });
                    if (vendordateCreated1) {
                        vendorObj.dateCreated = vendordateCreated1;
                    }
                    var vendorLastModified = result.getValue({
                        name: 'lastmodifieddate'
                    });
                    var lastModifiedFormat = format.format({
                        value: vendorLastModified,
                        type: format.Type.DATETIMETZ
                    });
                    var lastModified2 = format.parse({
                        value: lastModifiedFormat,
                        type: format.Type.DATETIMETZ
                    });
                    if (lastModified2) {
                        vendorObj.lastModified = lastModified2;
                    }
                    var vendorEmail = result.getValue({
                        name: 'email'
                    });
                    if (vendorEmail) {
                        vendorObj.email = vendorEmail;
                    }
                    var vendorPhone = result.getValue({
                        name: 'phone'
                    });
                    if (vendorPhone) {
                        vendorObj.phone = vendorPhone;
                    }
                    var vendorCurrency = result.getValue({
                        name: 'currency'
                    });
                    vendorCurrency = JSON.stringify(vendorCurrency);
                    if (vendorCurrency) {
                        vendorObj.currency = vendorCurrency;
                    }
                    var vendorAddress = result.getValue({
                        name: "billaddressee"
                    });
                    if (vendorAddress) {
                        vendorObj.billingAddress = vendorAddress;
                    }

                    var vendorBillCountry = result.getValue({
                        name: "billcountry"
                    });
                    if (vendorBillCountry) {
                        vendorObj.billingCountry = vendorBillCountry;
                    }
                    var vendorBillCity = result.getValue({
                        name: "billcity"
                    });
                    if (vendorBillCity) {
                        vendorObj.billingCity = vendorBillCity;
                    }

                    var vendorBillZip = result.getValue({
                        name: "billzipcode"
                    });
                    if (vendorBillZip) {
                        vendorObj.billingZip = vendorBillZip;
                    }

                    var vendorCreednzPaymentMethod = result.getValue({
                        name: "custentity_vendor_payment_method_creeedn"
                    });
                    if (vendorCreednzPaymentMethod) {
                        vendorObj.vendorPaymentMethod = vendorCreednzPaymentMethod;
                    }
                    var vendorCreednzBankAccName = result.getValue({
                        name: "custentity_bank_account_name_creednz"
                    });
                    if (vendorCreednzBankAccName) {
                        vendorObj.bankAccountName = vendorCreednzBankAccName;
                    }
                    var vendorCreednzBankAddress = result.getValue({
                        name: "custentity_bank_address_creednz"
                    });
                    if (vendorCreednzBankAddress) {
                        vendorObj.bankAddress = vendorCreednzBankAddress;
                    }
                    var vendorCreednzBankCode = result.getValue({
                        name: "custentity_bank_code_creednz"
                    });
                    if (vendorCreednzBankCode) {
                        vendorObj.bankCode = vendorCreednzBankCode;
                    }
                    var vendorCreednzBankNumber = result.getValue({
                        name: "custentity_bank_number_creednz"
                    });
                    if (vendorCreednzBankNumber) {
                        vendorObj.bankAccountNumber = vendorCreednzBankNumber;
                    }
                    var vendorCreednzBankDetailsUpdate = result.getValue({
                        name: "custentity_bank_details_update_creednz"
                    });
                    if (vendorCreednzBankDetailsUpdate) {
                        vendorObj.bankDetailsUpdate = vendorCreednzBankDetailsUpdate;
                    }
                    var vendorCreednzEftBankUpdate = result.getValue({
                        name: "custentity_eft_bank_detailsupdate_creedn"
                    });
                    if (vendorCreednzEftBankUpdate) {
                        vendorObj.eftBankDetailsUpdate = vendorCreednzEftBankUpdate;
                    }
                    var vendorCreednzEftBillPayment = result.getValue({
                        name: "custentity_eft_bill_payment_creednz"
                    });
                    if (vendorCreednzEftBillPayment) {
                        vendorObj.eftBillPayment = vendorCreednzEftBillPayment;
                    }
                    var vendorCreednzIban = result.getValue({
                        name: "custentity_iban_creednz"
                    });
                    if (vendorCreednzIban) {
                        vendorObj.iban = vendorCreednzIban;
                    }
                    var vendorCreednzSwift = result.getValue({
                        name: "custentity_swift_creednz"
                    });
                    if (vendorCreednzSwift) {
                        vendorObj.swift = vendorCreednzSwift;
                    }
                    var vendorCreednzRegCode = result.getValue({
                        name: "custentity_registraion_code_creednz"
                    });
                    if (vendorCreednzRegCode) {
                        vendorObj.registrationCode = vendorCreednzRegCode;
                    }
                    var vendorCreednzBranchNumber = result.getValue({
                        name: "custentity_branch_number_creednz"
                    });
                    if (vendorCreednzBranchNumber) {
                        vendorObj.branchNumber = vendorCreednzBranchNumber;
                    }
                    var vendorCreednzBranchName = result.getValue({
                        name: "custentity_branch_name_creednz"
                    });
                    if (vendorCreednzBranchName) {
                        vendorObj.branchName = vendorCreednzBranchName;
                    }
                    var vendorCreednzRoutingNumber = result.getValue({
                        name: "custentity_routing_number_creednz"
                    });
                    if (vendorCreednzRoutingNumber) {
                        vendorObj.routingNumber = vendorCreednzRoutingNumber;
                    }
                    var vendorCreednzPaypalAcc = result.getValue({
                        name: "custentity_paypal_account_creednz"
                    });
                    if (vendorCreednzPaypalAcc) {
                        vendorObj.paypalAccount = vendorCreednzPaypalAcc;
                    }

                    log.debug("creednzVendorEvaluationId and internalid", vendorId + "," + vendorName);
                    vendorIdArray.push(vendorId);
                    // validatedVendors.push(vendorId);
                    vendorArray.push(vendorObj);
                    // Reschedule the task
                    var endTime = new Date().getTime();
                    var timeElapsed = (endTime * 0.001) - (startTime * 0.001);
                    var scriptObj = runtime.getCurrentScript();
                    var remainingUsage = scriptObj.getRemainingUsage();

                    if (remainingUsage < 1000 || timeElapsed > 3300) // time more than 55 min
                        // if (remainingUsage < 9995 || timeElapsed > 0.50700008392333984	) // time more than 55 min
                    {
                        log.debug("Usage Exceeded Resubmitting remainingUsage", remainingUsage);
                        var scheduledScriptTask = task.create({
                            taskType: task.TaskType.SCHEDULED_SCRIPT,
                            scriptId: runtime.getCurrentScript().id,
                            deploymentId: runtime.getCurrentScript().deploymentId,
                            params: {
                                custscript_vendor_array: vendorIdArray,

                            }
                        });
                        log.debug("ssTask" + scheduledScriptTask);
                        scheduledScriptTask.submit();
                    } else {
                        return true;
                    }
                });

                // TODO : Checking the token > move to the library
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


                //analyse vendor from creednz
                //creedNzUrl = "https://edge.staging.creednz.com/external/microsoft-dynamics/analyze-vendors";
                creedNzUrl = creednzBaseUrl + "/external/erp/vendor/analyze";
                var creedNzApiHeaders = {
                    'accept': 'application/json',
                    'content-type': 'application/json',
                    'authorization': 'Bearer ' + lastSyncAccessToken
                };
                var dataObj = {};
                dataObj.analyzeVendorDtos = vendorArray;
                // get item details
                //set data to post
                log.debug("dataObj", JSON.stringify(dataObj));
                //post data to Creednz
                var creedNzResponse = https.post({
                    url: creedNzUrl,
                    headers: creedNzApiHeaders,
                    body: JSON.stringify(dataObj)
                });
                log.debug("creedNzResponse", creedNzResponse);
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
            } catch (err) {
                log.debug("error", err.message);
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