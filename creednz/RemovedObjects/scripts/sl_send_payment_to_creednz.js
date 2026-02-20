/**
 *
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope public
 * @author Rajitha
 * Script brief description:
     creednz payment validation
 * Revision History:
 *
 * Date                 Issue/Case         Author          Issue Fix Summary
 * =============================================================================================
 * 2024/August/07                           Rajitha         Initial version.
 */
     var PAGE_SIZE = 500;
     var customFilters = {};
     var searchId = 'customsearch_ss_get_payments_for_creednz';
     define(["N/ui/serverWidget", "N/log", "N/record", "N/url", "N/search", "N/task", "N/redirect", "N/runtime", "N/encode", "N/file", "N/https","N/config","./ssearches/searchlib"],
         (ui, log, record, url, search, task, redirect, runtime, encode, file, https,config,searchlib ) => {
        function onRequest(context) {
           // get method
           var nsAccountId = runtime.accountId;
           log.debug("context",runtime.accountId);
           if (context.request.method === 'GET') {
              try {
                 var form = ui.createForm({
                    id: 'vendor_analysis',
                    title: 'Creednz Payment Analysis'
                 });
                 if(nsAccountId == "TSTDRV1255519")
                  {
                     form.clientScriptModulePath = 'SuiteScripts/cs_send_payment_to_creednz.js';

                  }
                  else{
                   //form.clientScriptModulePath = 'SuiteBundles/Bundle 537712/cs_send_payment_to_creednz.js';
                   form.clientScriptModulePath = './cs_send_payment_to_creednz.js';

                 }
               // form.clientScriptModulePath = 'SuiteBundles/Bundle 531991/cs_send_vendor_to_creednz.js';
                 var pageId = parseInt(context.request.parameters.page);
                 //create sublist
                 var creedNzSublist = form.addSublist({
                    id: "custpage_analyze_payment_sublist",
                    type: ui.SublistType.LIST,
                    label: "Analyze Payment",
                 });
                 // add sublist fields
                 creedNzSublist.addField({
                    id: 'custpage_rec_process',
                    label: 'SELECT',
                    type: ui.FieldType.CHECKBOX
                 });
                 creedNzSublist.addField({
                    id: "custpage_payment_date",
                    label: "Payment Date",
                    type: ui.FieldType.DATE
                 });
                 creedNzSublist.addField({
                    id: "custpage_payment_id",
                    label: "Payment ID",
                    type: ui.FieldType.TEXT
                 }).updateDisplayType({
                    displayType: ui.FieldDisplayType.HIDDEN
                 });
                 creedNzSublist.addField({
                  id: "custpage_payment_amount",
                  label: "Amount",
                  type: ui.FieldType.CURRENCY,
               });
                 creedNzSublist.addField({
                    id: "custpage_currency_code",
                    label: "Currency Code",
                    type: ui.FieldType.TEXT,
                 });
                 creedNzSublist.addField({
                    id: "custpage_routing_no",
                    label: "Routing Number",
                    type: ui.FieldType.TEXT
                 });
                 creedNzSublist.addField({
                    id: "custpage_type",
                    label: "Type",
                    type: ui.FieldType.TEXT,
                 })
                 creedNzSublist.addField({
                    id: "custpage_payer_bank_acc_no",
                    label: "Payer Bank Account Number",
                    type: ui.FieldType.TEXT
                 });
                 creedNzSublist.addField({
                    id: "custpage_payee_bank_acc_no",
                    label: "Payee Bank Account Number",
                    type: ui.FieldType.TEXT
                 });
                 creedNzSublist.addField({
                    id: "custpage_payer_name",
                    label: "Payer Name",
                    type: ui.FieldType.TEXT
                 });
                 creedNzSublist.addField({
                    id: "custpage_payee_name",
                    label: "Payee Name",
                    type: ui.FieldType.TEXT
                 });
                 creedNzSublist.addField({
                    id: "custpage_description",
                    label: "Description",
                    type: ui.FieldType.TEXT
                 });
                
                 creedNzSublist.addButton({
                    id: 'creednz_validate',
                    label: 'Creednz Validate',
                    functionName: 'creednzValidate()'
                 });
                 //add second sublist
                 var creedNzSublistAnalyze = form.addSublist({
                    id: "custpage_analyze_payment_response",
                    type: ui.SublistType.LIST,
                    label: "Analyze Payment Response",
                 });
                 // add sublist fields
                 creedNzSublistAnalyze.addField({
                    id: 'custpage_rec_process_response',
                    label: 'SELECT',
                    type: ui.FieldType.CHECKBOX
                 });
                 creedNzSublistAnalyze.addField({
                    id: "custpage_payment_id_response",
                    label: "Payment ID",
                    type: ui.FieldType.TEXT
                 }).updateDisplayType({
                    displayType: ui.FieldDisplayType.HIDDEN
                 });
                 creedNzSublistAnalyze.addField({
                    id: "custpage_payment_amount_response",
                    label: "Amount",
                    type: ui.FieldType.CURRENCY,
                 });
                 creedNzSublistAnalyze.addField({
                      id: "custpage_currency_code_response",
                      label: "Currency Code",
                      type: ui.FieldType.TEXT,
                   });
                   creedNzSublistAnalyze.addField({
                      id: "custpage_routing_no_response",
                      label: "Routing Number",
                      type: ui.FieldType.TEXT
                   });
                   creedNzSublistAnalyze.addField({
                      id: "custpage_type_response",
                      label: "Type",
                      type: ui.FieldType.TEXT,
                   })
                   creedNzSublistAnalyze.addField({
                      id: "custpage_payer_bank_acc_no_response",
                      label: "Payer Bank Account Number",
                      type: ui.FieldType.TEXT
                   });
                   // customer specific fields
                   creedNzSublistAnalyze.addField({
                      id: "custpage_payee_bank_acc_no_response",
                      label: "Payee Bank Account Number",
                      type: ui.FieldType.TEXT
                   });
                   creedNzSublistAnalyze.addField({
                      id: "custpage_payer_name_response",
                      label: "Payer Name",
                      type: ui.FieldType.TEXT
                   });
                   // inventory specific fields        
                   creedNzSublistAnalyze.addField({
                      id: "custpage_payee_name_response",
                      label: "Payee Name",
                      type: ui.FieldType.TEXT
                   });
                   creedNzSublistAnalyze.addField({
                      id: "custpage_description_response",
                      label: "Description",
                      type: ui.FieldType.TEXT
                   });


                 creedNzSublistAnalyze.addField({
                    id: "custpage_creednz_risk_status_response",
                    label: "Creednz Risk Status",
                    type: ui.FieldType.TEXT
                 });
                 creedNzSublistAnalyze.addField({
                    id: "custpage_creednz_last_updated_response",
                    label: "Creednz Updated On",
                    type: ui.FieldType.TEXT
                 });
                 creedNzSublistAnalyze.addField({
                    id: "custpage_vendor_external_id_response",
                    label: "Creednz Vendor ID",
                    type: ui.FieldType.TEXT
                 });
                 creedNzSublistAnalyze.addButton({
                    id: 'analyse_button',
                    label: 'Analyze Response',
                    functionName: 'analyzeResponse()'
                 });
                 creedNzSublist.addMarkAllButtons();
                 creedNzSublistAnalyze.addMarkAllButtons();
                 var retrieveSearch = runSearch(searchId, PAGE_SIZE);
                 var pageCount = Math.ceil(retrieveSearch.count / PAGE_SIZE);
                 // Set pageId to correct value if out of index
                 if (!pageId || pageId == '' || pageId < 0) {
                    pageId = 0;
                 } else if (pageId >= pageCount) pageId = pageCount - 1;
                if(retrieveSearch.count > 0)
                {
                 // Add buttons to simulate Next & Previous
                 if (pageId != 0) {
                    form.addButton({
                       id: 'custpage_previous',
                       label: 'Previous',
                       functionName: 'getSuiteletPage("customscript_sl_send_payment_to_creednz" ,   "customdeploy_sl_send_payment_to_creednz", ' + (pageId - 1) + ')'
                    });
                 }
                 if (pageId != pageCount - 1) {
                    form.addButton({
                       id: 'custpage_next',
                       label: 'Next',
                       functionName: 'getSuiteletPage("customscript_sl_send_payment_to_creednz" ,   "customdeploy_sl_send_payment_to_creednz", ' + (pageId + 1) + ')'

                      // functionName: 'getSuiteletPage(' + scriptId + ', ' + deploymentId + ', ' + (pageId + 1) + ')'
                    });
                 }
               }
                 // Add drop-down and options to navigate to specific page
                 var selectOptions = form.addField({
                    id: 'custpage_pageid',
                    label: 'Page Index',
                    type: ui.FieldType.SELECT
                 });
               
                 for (i = 0; i < pageCount; i++) {
                    if (i == pageId) {
                       selectOptions.addSelectOption({
                          value: 'pageid_' + i,
                          text: ((i * PAGE_SIZE) + 1) + ' – ' + ((i + 1) * PAGE_SIZE),
                          isSelected: true
                       });
                    } else {
                       selectOptions.addSelectOption({
                          value: 'pageid_' + i,
                          text: ((i * PAGE_SIZE) + 1) + ' – ' + ((i + 1) * PAGE_SIZE)
                       });
                    }
                 }
                 if (retrieveSearch.count > 0) {
                    var addResults = fetchSearchResult(retrieveSearch, pageId);
                    var companyInfo = config.load({
                     type: config.Type.COMPANY_INFORMATION
                 });
                 var compname = companyInfo.getValue({
                  fieldId: 'companyname'
              });
             
            log.debug("companyInfo",companyInfo);


                    var j = 0;
                    // set sublist values
                    addResults.forEach(function(result) {
                       //add data to sublist creedNzSublistAnalyze                   
                       if (result.paymentExternalId) {
                      //  log.debug("result.paymentExternalId",result.paymentExternalId);
                        if (result.paymentId) {
                            creedNzSublistAnalyze.setSublistValue({
                               id: 'custpage_payment_id_response',
                               line: j,
                               value: result.paymentId
                            });
                           }
            
                         if (result.paymentDate) {
                            creedNzSublistAnalyze.setSublistValue({
                               id: 'custpage_payment_date_response',
                               line: j,
                               value: result.paymentDate
                            });
                         }
                         if (result.paymentAmount) {
                            creedNzSublistAnalyze.setSublistValue({
                               id: 'custpage_payment_amount_response',
                               line: j,
                               value: result.paymentAmount
                            });
                         }
                         if (result.paymentCurrency) {
                            creedNzSublistAnalyze.setSublistValue({
                               id: 'custpage_currency_code_response',
                               line: j,
                               value: result.paymentCurrency
                            });
                         }
                        /* if (result.routingNumber) {
                            creedNzSublist.setSublistValue({
                               id: 'custpage_routing_no',
                               line: j,
                               value: result.vendorPrimaryContact
                            });
                         }*/
                         if (result.paymentType) {
                            creedNzSublistAnalyze.setSublistValue({
                               id: 'custpage_type_response',
                               line: j,
                               value: result.paymentType
                            });
                         }
                         if (result.payerBankAccNo) {
                            creedNzSublistAnalyze.setSublistValue({
                               id: 'custpage_payer_bank_acc_no_response',
                               line: j,
                               value: result.payerBankAccNo
                            });
                         }
                         if (result.payeeAccNo) {
                           creedNzSublistAnalyze.setSublistValue({
                               id: 'custpage_payee_bank_acc_no_response',
                               line: j,
                               value: result.payeeAccNo
                            });
                         }
                         if (compname) {
                            creedNzSublistAnalyze.setSublistValue({
                               id: 'custpage_payer_name_response',
                               line: j,
                               value: compname
                            });
                         }
                         if (result.payeeName) {
                            creedNzSublistAnalyze.setSublistValue({
                               id: 'custpage_payee_name_response',
                               line: j,
                               value: result.payeeName
                            });
                         }
                       /*  if (result.paymentDescription) {
                            creedNzSublist.setSublistValue({
                               id: 'custpage_description',
                               line: j,
                               value: result.paymentDescription
                            });
                         }*/
                         if (result.paymentCreednzStatus) {
                            creedNzSublistAnalyze.setSublistValue({
                               id: 'custpage_creednz_risk_status_response',
                               line: j,
                               value: result.paymentCreednzStatus
                            });
                         }
                         if (result.paymentCreednzLastUpdated) {
                            creedNzSublistAnalyze.setSublistValue({
                               id: 'custpage_creednz_last_updated_response',
                               line: j,
                               value: result.paymentCreednzLastUpdated
                            });
                         }
                         if (result.paymentExternalId) {
                            creedNzSublistAnalyze.setSublistValue({
                               id: 'custpage_vendor_external_id_response',
                               line: j,
                               value: result.paymentExternalId
                            });
                         }
                         j++
                      } //end if
                   });
                    //add data to sublist
                    var j = 0;
                    // set sublist values to creedNzSublist
                    addResults.forEach(function(result) {
                       if (!result.paymentExternalId) {
                          if (result.paymentId) {
                             creedNzSublist.setSublistValue({
                                id: 'custpage_payment_id',
                                line: j,
                                value: result.paymentId
                             });
                            }
                           /*var payeeId=result.payeeId;
                            var payeeBankAccNo;


                            var vendorFieldLookUp = search.lookupFields({
                              type: search.Type.VENDOR,
                              id: payeeId,
                              columns: ['accountnumber']
                          });
                           payeeBankAccNo = vendorFieldLookUp.accountnumber;
                         //  log.debug("payeeBankAccNo",payeeBankAccNo);
                          if(!payeeBankAccNo)
                          {
                           log.debug("no vendor bank account");
                           var employeeFieldLookUp = search.lookupFields({
                              type: search.Type.EMPLOYEE,
                              id: payeeId,
                              columns: ['accountnumber']
                          });
                          payeeBankAccNo = employeeFieldLookUp.accountnumber;
                        //  log.debug("payeeBankAccNo",payeeBankAccNo);
                          }//end if*/
                          

                       
                          /* 
                           log.debug("payeeId",payeeId);
                            var vendorSearchObj = search.create({
                              type: "vendor",
                              filters:
                              [
                                 ["internalid","anyof",payeeId]
                              ],
                              columns:
                              [
                                 search.createColumn({name: "internalid", label: "Internal ID"}),
                                 search.createColumn({name: "accountnumber", label: "Account"})
                              ]
                           });
                           var searchResultCountVendor = vendorSearchObj.runPaged().count;
                           log.debug("vendorSearchObj result count",searchResultCount);
                           if(searchResultCountVendor)
                           {
                           vendorSearchObj.run().each(function(result){
                              // .run().each has a limit of 4,000 results
                              payeeAccountNo = result.getValue({
                                  name: "accountnumber",
                                  label: "Account"
                              });
                              log.debug("payeeAccountNo",payeeAccountNo);

                              return true;
                           });
                        }//end if searchResultCountVendor
                                //employee search
                              else
                              {
               
                                var employeeSearchObj = search.create({
                                 type: "employee",
                                 filters:
                                 [
                                    ["internalid","anyof",payeeId]
                                 ],
                                 columns:
                                 [
                                    search.createColumn({name: "internalid", label: "Internal ID"}),
                                    search.createColumn({name: "accountnumber", label: "Account"})
                                 ]
                              });
                              var searchResultCount = employeeSearchObj.runPaged().count;
                              log.debug("employeeSearchObj result count",searchResultCount);
                              if(searchResultCount)
                              {
                                 employeeSearchObj.run().each(function(result){
                                    // .run().each has a limit of 4,000 results
                                    payeeAccountNo = result.getValue({
                                       name: "accountnumber",
                                       label: "Account"
                                    });
                                    log.debug("payeeAccountNo",payeeAccountNo);
                                    return true;
                                 });
                              }
                           }//end else



*/

                          if (result.paymentDate) {
                             creedNzSublist.setSublistValue({
                                id: 'custpage_payment_date',
                                line: j,
                                value: result.paymentDate
                             });
                          }
                          if (result.paymentAmount) {
                             creedNzSublist.setSublistValue({
                                id: 'custpage_payment_amount',
                                line: j,
                                value: result.paymentAmount
                             });
                          }
                         // log.debug("currency code",result.paymentCurrency);
                          if (result.paymentCurrency) {
                             creedNzSublist.setSublistValue({
                                id: 'custpage_currency_code',
                                line: j,
                                value: result.paymentCurrency
                             });
                          }
                         /* if (result.routingNumber) {
                             creedNzSublist.setSublistValue({
                                id: 'custpage_routing_no',
                                line: j,
                                value: result.vendorPrimaryContact
                             });
                          }*/
                          if (result.paymentType) {
                             creedNzSublist.setSublistValue({
                                id: 'custpage_type',
                                line: j,
                                value: result.paymentType
                             });
                          }
                          if (result.payerBankAccNo) {
                             creedNzSublist.setSublistValue({
                                id: 'custpage_payer_bank_acc_no',
                                line: j,
                                value: result.payerBankAccNo
                             });
                          }
                          if (result.payeeAccNo) {
                             creedNzSublist.setSublistValue({
                                id: 'custpage_payee_bank_acc_no',
                                line: j,
                                value: result.payeeAccNo
                             });
                          }
                          if (compname) {
                             creedNzSublist.setSublistValue({
                                id: 'custpage_payer_name',
                                line: j,
                                value: compname
                             });
                          }
                          if (result.payeeName) {
                             creedNzSublist.setSublistValue({
                                id: 'custpage_payee_name',
                                line: j,
                                value: result.payeeName
                             });
                          }
                        /*  if (result.paymentDescription) {
                             creedNzSublist.setSublistValue({
                                id: 'custpage_description',
                                line: j,
                                value: result.paymentDescription
                             });
                          }*/
                          
                          j++
                       } //end if
                    });
                 }
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
       
        function runSearch(searchId, searchPageSize) {
           try {
              //check sorting method
              /*var searchObj = search.load({
                 id: searchId
              });*/
               var searchObj = searchlib.customsearch_ss_get_payments_for_creednz();
              return searchObj.runPaged({
                 pageSize: searchPageSize
              });
           } catch (er) {
              log.debug('Error on runSearch', JSON.stringify(er));
           }
        } //end runsearch
        function fetchSearchResult(pagedData, pageIndex) {
           try {
              var searchPage = pagedData.fetch({
                 index: pageIndex
              });
              var results = new Array();
              searchPage.data.forEach(function(result) {
                 var paymentId = result.getValue({
                    name: "internalid",
                    label: "Internal ID"
                 });
                 var paymentDateCreated = result.getValue({
                    name: "datecreated",
                    label: "Date Created"
                 });
                 var paymentDate = result.getValue({
                    name: "trandate",
                    label: "Date"
                 });
                 var paymentAmount = result.getValue({
                    name: "amount",
                    label: "Amount"
                 });
                /* var paymentCurrencyCode = result.getValue({
                    name: "currency",
                    label: "Currency"
                 });
                 var currencyFieldLookUp = search.lookupFields({
                    type: search.Type.CURRENCY,
                    id: paymentCurrencyCode,
                    columns: ['symbol']
                });
                //log.debug("currencyFieldLookUp",currencyFieldLookUp);
                var paymentCurrency = currencyFieldLookUp.symbol;
                log.debug("paymentCurrency",paymentCurrency);*/

                var paymentCurrency = result.getValue({
                    name: "symbol",
                    join: "Currency",
                    label: "Symbol"
                });

                 var paymentType = result.getValue({
                    name: "type",
                    label: "Type"
                 });
                 var payeeName = result.getText({
                    name: "entity",
                    label: "Name"
                 });

                 var payeeId = result.getValue({
                  name: "entity",
                  label: "Name"
                 });

                 var payeeAccNumber;
                 try{
                 var fieldLookUp = search.lookupFields({
                  type: search.Type.VENDOR,
                  id: payeeId,
                  columns: ['accountnumber']
              });
              payeeAccNumber =  fieldLookUp.accountnumber;
            }catch(err)
            {
               log.debug("not vendor");
               try{
                  var fieldLookUp = search.lookupFields({
                     type: search.Type.EMPLOYEE,
                     id: payeeId,
                     columns: ['accountNumber']
                 });
                 payeeAccNumber =  fieldLookUp.accountnumber;

               }catch(err)
               {
                  log.debug("not vendor or employee");
               }
            }//end catch




            /*var payerBankAccNo = result.getValue({
               name: "custbody_payer_bank_acc_number", 
               label: "Payer Bank Account Number"
            });
      
            
            var payeeAccNo = result.getValue({
               name: "custentity_vendor_bank_acc_number",
               join: "vendor",
               label: "Vendor Bank Account Number"
            });*/
             
                 var paymentExternalId = result.getValue({
                    name: "custbody_creednz_external_id",
                    label: "Creednz External Id"
                 });
                 var paymentCreednzLastUpdated = result.getValue({
                    name: "custbodycreednz_last_modified_date",
                    label: "Creednz Last Modified Date"
                 });
                 var paymentCreednzStatus = result.getValue({
                    name: "custbody_creednz_payment_status",
                    label: "Creednz Payment Status"
                 });
              
                 results.push({
                    'paymentId': paymentId,
                    'paymentDateCreated': paymentDateCreated,
                    'paymentDate': paymentDate,
                    'paymentAmount': paymentAmount,
                    'paymentCurrency': paymentCurrency,
                    'paymentType': paymentType,
                    'payeeName': payeeName,
                    'paymentExternalId': paymentExternalId,
                    'paymentCreednzLastUpdated': paymentCreednzLastUpdated,
                    'paymentCreednzStatus': paymentCreednzStatus,
                    'payeeId': payeeId,
                    'payeeAccNumber': payeeAccNumber
                    //'payerBankAccNo': payerBankAccNo
                   
                 });
              });
              return results;
           } catch (er) {
              log.debug('Error on fetchSearchResult', JSON.stringify(er));
           }
        } //end fetch search
        return {
           onRequest: onRequest
        };
     });