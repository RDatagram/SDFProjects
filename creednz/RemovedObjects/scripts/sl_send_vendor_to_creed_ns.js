/**
 *
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope public
 * @author Rajitha
 * Script brief description:
     creednz vendor validation
 * Revision History:
 *
 * Date                 Issue/Case         Author          Issue Fix Summary
 * =============================================================================================
 * 2024/June/06                            Rajitha         Initial version.
 */
     var PAGE_SIZE = 500;
     var customFilters = {};
     var searchId = 'customsearch_ss_vendor_search_for_creed';
     define(["N/ui/serverWidget", "N/log", "N/record", "N/url", "N/search", "N/task", "N/redirect", "N/runtime", "N/encode", "N/file", "N/https","./ssearches/searchlib"],
         (ui, log, record, url, search, task, redirect, runtime, encode, file, https, searchlib) => {
        function onRequest(context) {
           // get method
           var nsAccountId = runtime.accountId;
           log.debug("context",runtime.accountId);
           if (context.request.method === 'GET') {
              try {
                 var form = ui.createForm({
                    id: 'vendor_analysis',
                    title: 'Creednz Vendors Analysis'
                 });
                 if(nsAccountId == "TSTDRV1255519")
                  {
                     form.clientScriptModulePath = 'SuiteScripts/cs_send_vendor_to_creednz.js';

                  }
                  else{
                   //form.clientScriptModulePath = 'SuiteBundles/Bundle 537712/cs_send_vendor_to_creednz.js';
                   form.clientScriptModulePath = './cs_send_vendor_to_creednz.js';

                 }
               // form.clientScriptModulePath = 'SuiteBundles/Bundle 531991/cs_send_vendor_to_creednz.js';
                 var pageId = parseInt(context.request.parameters.page);
                 //create sublist
                 var creedNzSublist = form.addSublist({
                    id: "custpage_analyze_vendor_sublist",
                    type: ui.SublistType.LIST,
                    label: "Analyze Vendor",
                 });
                 // add sublist fields
                 creedNzSublist.addField({
                    id: 'custpage_rec_process',
                    label: 'SELECT',
                    type: ui.FieldType.CHECKBOX
                 });
                 var editField = creedNzSublist.addField({
                    id: 'custpage_edit_vendor',
                    type: ui.FieldType.URL,
                    label: 'Edit',
                 }).linkText = 'Edit'
                 var viewField = creedNzSublist.addField({
                    id: 'custpage_view_vendor',
                    type: ui.FieldType.URL,
                    label: 'View',
                 }).linkText = 'View'
                 creedNzSublist.addField({
                    id: "custpage_vendor_account",
                    label: "Vendor Account",
                    type: ui.FieldType.TEXT
                 });
                 creedNzSublist.addField({
                    id: "custpage_vendor_id",
                    label: "Vendor ID",
                    type: ui.FieldType.TEXT
                 }).updateDisplayType({
                    displayType: ui.FieldDisplayType.HIDDEN
                 });
                 creedNzSublist.addField({
                    id: "custpage_vendor_name",
                    label: "Name",
                    type: ui.FieldType.TEXT,
                 });
                 creedNzSublist.addField({
                    id: "custpage_vendor_hold",
                    label: "Vendoe Hold",
                    type: ui.FieldType.TEXT
                 });
                 creedNzSublist.addField({
                    id: "custpage_phone",
                    label: "Phone",
                    type: ui.FieldType.TEXT,
                 })
                 creedNzSublist.addField({
                    id: "custpage_extension",
                    label: "Extension",
                    type: ui.FieldType.TEXT
                 });
                 // customer specific fields
                 creedNzSublist.addField({
                    id: "custpage_primary_contact",
                    label: "Primary Contact",
                    type: ui.FieldType.TEXT
                 });
                 creedNzSublist.addField({
                    id: "custpage_group",
                    label: "Group",
                    type: ui.FieldType.TEXT
                 });
                 creedNzSublist.addField({
                    id: "custpage_currency",
                    label: "Currency",
                    type: ui.FieldType.CURRENCY
                 }).updateDisplayType({
                  displayType: ui.FieldDisplayType.HIDDEN
               });
                 creedNzSublist.addField({
                  id: "custpage_currency_text",
                  label: "Currency",
                  type: ui.FieldType.TEXT
               });
                 creedNzSublist.addField({
                    id: "custpage_subsidiary",
                    label: "Subsidiary",
                    type: ui.FieldType.TEXT
                 }).updateDisplayType({
                    displayType: ui.FieldDisplayType.HIDDEN
                 });
                 creedNzSublist.addField({
                    id: "custpage_date_created",
                    label: "Date Created",
                    type: ui.FieldType.TEXT
                 }).updateDisplayType({
                    displayType: ui.FieldDisplayType.HIDDEN
                 });
                 creedNzSublist.addField({
                    id: "custpage_last_modified",
                    label: "Last Modified",
                    type: ui.FieldType.TEXT
                 }).updateDisplayType({
                    displayType: ui.FieldDisplayType.HIDDEN
                 });
                 creedNzSublist.addField({
                    id: "custpage_vendor_email",
                    label: "Email",
                    type: ui.FieldType.TEXT
                 }).updateDisplayType({
                    displayType: ui.FieldDisplayType.HIDDEN
                 });
                 creedNzSublist.addField({
                    id: "custpage_vendor_address",
                    label: "Address",
                    type: ui.FieldType.TEXT
                 }).updateDisplayType({
                    displayType: ui.FieldDisplayType.HIDDEN
                 });
                 creedNzSublist.addField({
                    id: "custpage_vendor_bill_country",
                    label: "Bill Country",
                    type: ui.FieldType.TEXT
                 }).updateDisplayType({
                    displayType: ui.FieldDisplayType.HIDDEN
                 });
                 creedNzSublist.addField({
                    id: "custpage_vendor_bill_city",
                    label: "Bill City",
                    type: ui.FieldType.TEXT
                 }).updateDisplayType({
                    displayType: ui.FieldDisplayType.HIDDEN
                 });
                 creedNzSublist.addField({
                    id: "custpage_vendor_bill_zip",
                    label: "Bill Zip",
                    type: ui.FieldType.TEXT
                 }).updateDisplayType({
                    displayType: ui.FieldDisplayType.HIDDEN
                 });
                  

                 //new fields
                 creedNzSublist.addField({
                  id: "custpage_vendor_payment_method",
                  label: "Vendor Payment Method",
                  type: ui.FieldType.TEXT
               }).updateDisplayType({
                  displayType: ui.FieldDisplayType.HIDDEN
               });
                 creedNzSublist.addField({
                  id: "custpage_vendor_bank_acc_name",
                  label: "Bank Account Name",
                  type: ui.FieldType.TEXT
               }).updateDisplayType({
                  displayType: ui.FieldDisplayType.HIDDEN
               });
               creedNzSublist.addField({
                  id: "custpage_vendor_bank_address",
                  label: "Bank Address",
                  type: ui.FieldType.TEXT
               }).updateDisplayType({
                  displayType: ui.FieldDisplayType.HIDDEN
               });
               creedNzSublist.addField({
                  id: "custpage_vendor_bank_code",
                  label: "Bank Code",
                  type: ui.FieldType.TEXT
               }).updateDisplayType({
                  displayType: ui.FieldDisplayType.HIDDEN
               });
               creedNzSublist.addField({
                  id: "custpage_vendor_bank_number",
                  label: "Bank Account Number",
                  type: ui.FieldType.TEXT
               }).updateDisplayType({
                  displayType: ui.FieldDisplayType.HIDDEN
               });
               creedNzSublist.addField({
                  id: "custpage_vendor_bank_details_update",
                  label: "Bank Details Update",
                  type: ui.FieldType.TEXT
               }).updateDisplayType({
                  displayType: ui.FieldDisplayType.HIDDEN
               });
               creedNzSublist.addField({
                  id: "custpage_vendor_eft_bank_update",
                  label: "EFT Bank Details Update",
                  type: ui.FieldType.TEXT
               }).updateDisplayType({
                  displayType: ui.FieldDisplayType.HIDDEN
               });
               creedNzSublist.addField({
                  id: "custpage_vendor_eft_bill_payment",
                  label: "EFT Bill Payment",
                  type: ui.FieldType.TEXT
               }).updateDisplayType({
                  displayType: ui.FieldDisplayType.HIDDEN
               });
               creedNzSublist.addField({
                  id: "custpage_vendor_iban",
                  label: "IBAN",
                  type: ui.FieldType.TEXT
               }).updateDisplayType({
                  displayType: ui.FieldDisplayType.HIDDEN
               });
               creedNzSublist.addField({
                  id: "custpage_vendor_swift",
                  label: "Swift",
                  type: ui.FieldType.TEXT
               }).updateDisplayType({
                  displayType: ui.FieldDisplayType.HIDDEN
               });
               creedNzSublist.addField({
                  id: "custpage_vendor_reg_code",
                  label: "Registration Code",
                  type: ui.FieldType.TEXT
               }).updateDisplayType({
                  displayType: ui.FieldDisplayType.HIDDEN
               });
               creedNzSublist.addField({
                  id: "custpage_vendor_branch_number",
                  label: "Branch Number",
                  type: ui.FieldType.TEXT
               }).updateDisplayType({
                  displayType: ui.FieldDisplayType.HIDDEN
               });
               creedNzSublist.addField({
                  id: "custpage_vendor_branch_name",
                  label: "Branch Name",
                  type: ui.FieldType.TEXT
               }).updateDisplayType({
                  displayType: ui.FieldDisplayType.HIDDEN
               });
               creedNzSublist.addField({
                  id: "custpage_vendor_routing_number",
                  label: "Routing Number",
                  type: ui.FieldType.TEXT
               }).updateDisplayType({
                  displayType: ui.FieldDisplayType.HIDDEN
               });
               creedNzSublist.addField({
                  id: "custpage_vendor_paypal_acc",
                  label: "Paypal Account",
                  type: ui.FieldType.TEXT
               }).updateDisplayType({
                  displayType: ui.FieldDisplayType.HIDDEN
               });
             //end adding new fields


                 creedNzSublist.addButton({
                    id: 'creednz_validate',
                    label: 'Creednz Validate',
                    functionName: 'creednzValidate()'
                 });
                 //add second sublist
                 var creedNzSublistAnalyze = form.addSublist({
                    id: "custpage_analyze_vendor_response",
                    type: ui.SublistType.LIST,
                    label: "Analyze Vendor Response",
                 });
                 // add sublist fields
                 creedNzSublistAnalyze.addField({
                    id: 'custpage_rec_process_response',
                    label: 'SELECT',
                    type: ui.FieldType.CHECKBOX
                 });
                 creedNzSublistAnalyze.addField({
                    id: "custpage_vendor_id_response",
                    label: "Vendor ID",
                    type: ui.FieldType.TEXT
                 }).updateDisplayType({
                    displayType: ui.FieldDisplayType.HIDDEN
                 });
                 creedNzSublistAnalyze.addField({
                    id: "custpage_vendor_account_response",
                    label: "Vendor Account",
                    type: ui.FieldType.TEXT
                 });
                 creedNzSublistAnalyze.addField({
                    id: "custpage_vendor_name_response",
                    label: "Name",
                    type: ui.FieldType.TEXT,
                 });
                 creedNzSublistAnalyze.addField({
                    id: "custpage_vendor_hold_response",
                    label: "Vendoe Hold",
                    type: ui.FieldType.TEXT
                 });
                 creedNzSublistAnalyze.addField({
                    id: "custpage_phone_response",
                    label: "Phone",
                    type: ui.FieldType.TEXT,
                 })
                 creedNzSublistAnalyze.addField({
                    id: "custpage_extension_response",
                    label: "Extension",
                    type: ui.FieldType.TEXT
                 });
                 creedNzSublistAnalyze.addField({
                    id: "custpage_primary_contact_response",
                    label: "Primary Contact",
                    type: ui.FieldType.TEXT
                 });
                 creedNzSublistAnalyze.addField({
                    id: "custpage_group_response",
                    label: "Group",
                    type: ui.FieldType.TEXT
                 });
                 creedNzSublistAnalyze.addField({
                    id: "custpage_currency_response",
                    label: "Currency",
                    type: ui.FieldType.CURRENCY
                 }).updateDisplayType({
                  displayType: ui.FieldDisplayType.HIDDEN
               });
                 creedNzSublistAnalyze.addField({
                  id: "custpage_currency_text_response",
                  label: "Currency",
                  type: ui.FieldType.TEXT
               });
                 creedNzSublistAnalyze.addField({
                    id: "custpage_creednz_risk_status",
                    label: "Creednz Risk Status",
                    type: ui.FieldType.TEXT
                 });
                 creedNzSublistAnalyze.addField({
                    id: "custpage_creednz_last_updated",
                    label: "Creednz Updated On",
                    type: ui.FieldType.TEXT
                 });
                 creedNzSublistAnalyze.addField({
                    id: "custpage_vendor_external_id",
                    label: "Creednz Vendor ID",
                    type: ui.FieldType.TEXT
                 });
                 creedNzSublistAnalyze.addField({
                  id: "custpage_view_risk_info",
                  label: "View",
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
                       functionName: 'getSuiteletPage("customscript_sl_send_vendor_to_creed_ns" ,   "customdeploy_sl_send_vendor_to_creed_ns", ' + (pageId - 1) + ')'
                    });
                 }
                 if (pageId != pageCount - 1) {
                    form.addButton({
                       id: 'custpage_next',
                       label: 'Next',
                       functionName: 'getSuiteletPage("customscript_sl_send_vendor_to_creed_ns" ,   "customdeploy_sl_send_vendor_to_creed_ns", ' + (pageId + 1) + ')'
                    });
                 }
               }
                 // Add drop-down and options to navigate to specific page
                 var selectOptions = form.addField({
                    id: 'custpage_pageid_send',
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
                    var j = 0;
                    // set sublist values
                    addResults.forEach(function(result) {
                       //add data to sublist creedNzSublistAnalyze                   
                       if (result.vendorExternalId) {
                          if (result.vendorId) {
                             creedNzSublistAnalyze.setSublistValue({
                                id: 'custpage_vendor_id_response',
                                line: j,
                                value: result.vendorId
                             });
                          }
                          if (result.vendorName) {
                             creedNzSublistAnalyze.setSublistValue({
                                id: 'custpage_vendor_account_response',
                                line: j,
                                value: result.vendorName
                             });
                          }
                          if (result.vendorName) {
                             creedNzSublistAnalyze.setSublistValue({
                                id: 'custpage_vendor_name_response',
                                line: j,
                                value: result.vendorName
                             });
                          }
                          if (result.vendorPhone) {
                             creedNzSublistAnalyze.setSublistValue({
                                id: 'custpage_phone_response',
                                line: j,
                                value: result.vendorPhone
                             });
                          }
                          if (result.vendorPrimaryContact) {
                             creedNzSublistAnalyze.setSublistValue({
                                id: 'custpage_primary_contact_response',
                                line: j,
                                value: result.vendorPrimaryContact
                             });
                          }
                          if (result.vendorCurrency) {
                             creedNzSublistAnalyze.setSublistValue({
                                id: 'custpage_currency_response',
                                line: j,
                                value: result.vendorCurrency
                             });
                          } 
                          if (result.vendorCurrencyText) {
                           creedNzSublistAnalyze.setSublistValue({
                              id: 'custpage_currency_text_response',
                              line: j,
                              value: result.vendorCurrencyText
                           });
                        } 
                       
                        
                          if (result.vendorExternalId) {
                          // log.debug("result.vendorExternalId",result.vendorExternalId);
                             creedNzSublistAnalyze.setSublistValue({
                                id: 'custpage_vendor_external_id',
                                line: j,
                                value: result.vendorExternalId
                             });
                          }
                          if (result.vendorCreednzRisk) {
                             creedNzSublistAnalyze.setSublistValue({
                                id: 'custpage_creednz_risk_status',
                                line: j,
                                value: result.vendorCreednzRisk
                             });
                          }
                          if (result.vendorCreednzLastUpdated) {
                             creedNzSublistAnalyze.setSublistValue({
                                id: 'custpage_creednz_last_updated',
                                line: j,
                                value: result.vendorCreednzLastUpdated
                             });
                          }
 
                          var suiteletUrl = url.resolveScript({
                            scriptId: 'customscript_sl_vendor_page_creednz_info',
                            deploymentId: 'customdeploy_sl_vendor_page_creednz_info',
                            returnExternalUrl: false
                        });
                     
                        var viewUrlFull = suiteletUrl.split("compid=")[0];
                        var viewInfoUrl = viewUrlFull + "externalId=" + result.vendorExternalId;

                       // var popupLink = '<a href="#" onclick="window.open("http://www.yahoo.com", "_blank")">View Details</a>';
                       var popupLink = '<html><a href="#" style="color: blue; text-decoration : none;" onclick="window.open(\'' + viewInfoUrl +  '\', \'popup\', \'width=900,height=600\')">View</a></html>';
                          creedNzSublistAnalyze.setSublistValue({
                            id: 'custpage_view_risk_info',
                            line: j,
                            value: popupLink
                         });
                  
                          j++
                       } //end if                       
                    });
                    //add data to sublist

                    var j = 0;
                    // set sublist values to creedNzSublist
                    addResults.forEach(function(result) {
                       if (!result.vendorExternalId) {
                          if (result.vendorId) {
                             creedNzSublist.setSublistValue({
                                id: 'custpage_vendor_id',
                                line: j,
                                value: result.vendorId
                             });
                             var domain = url.resolveDomain({
                                hostType: url.HostType.APPLICATION
                             });
                             //set edit link 
                             var editUrl = url.resolveRecord({
                                recordType: 'vendor',
                                recordId: result.vendorId,
                                isEditMode: true
                             });
                             creedNzSublist.setSublistValue({
                                id: 'custpage_edit_vendor',
                                line: j,
                                value: 'https://' + domain + editUrl
                             });
                             //set view link 
                             var viewUrl = url.resolveRecord({
                                recordType: 'vendor',
                                recordId: result.vendorId,
                                isEditMode: false
                             });
                             creedNzSublist.setSublistValue({
                                id: 'custpage_view_vendor',
                                line: j,
                                value: 'https://' + domain + viewUrl
                             });
                          }
                          if (result.vendorName) {
                            // log.debug("add vendorName ", result.vendorName);
                             creedNzSublist.setSublistValue({
                                id: 'custpage_vendor_account',
                                line: j,
                                value: result.vendorName
                             });
                             //log.debug("add vendorname");
                          }
                          if (result.vendorName) {
                             creedNzSublist.setSublistValue({
                                id: 'custpage_vendor_name',
                                line: j,
                                value: result.vendorName
                             });
                          }
                          if (result.vendorPhone) {
                             creedNzSublist.setSublistValue({
                                id: 'custpage_phone',
                                line: j,
                                value: result.vendorPhone
                             });
                            // log.debug("add vendorphone");
                          }
                          if (result.vendorPrimaryContact) {
                             creedNzSublist.setSublistValue({
                                id: 'custpage_primary_contact',
                                line: j,
                                value: result.vendorPrimaryContact
                             });
                            // log.debug("add vendorprimary");
                          }
                          if (result.vendorCurrency) {
                             creedNzSublist.setSublistValue({
                                id: 'custpage_currency',
                                line: j,
                                value: result.vendorCurrency
                             }); 
                             //log.debug("add vendorcurrency");
                          }
                          if (result.vendorCurrencyText) {
                           creedNzSublist.setSublistValue({
                              id: 'custpage_currency_text',
                              line: j,
                              value: result.vendorCurrencyText
                           });
                        }
                          if (result.vendorSubsidiary) {
                             creedNzSublist.setSublistValue({
                                id: 'custpage_subsidiary',
                                line: j,
                                value: result.vendorSubsidiary
                             });
                            // log.debug("add vendorsubsidiary");
                          }
                          if (result.vendorCreatedDate) {
                             creedNzSublist.setSublistValue({
                                id: 'custpage_date_created',
                                line: j,
                                value: result.vendorCreatedDate
                             });
                          }
                          if (result.vendorLastModified) {
                             creedNzSublist.setSublistValue({
                                id: 'custpage_last_modified',
                                line: j,
                                value: result.vendorLastModified
                             });
                          }
                          if (result.vendorEmail) {
                             creedNzSublist.setSublistValue({
                                id: 'custpage_vendor_email',
                                line: j,
                                value: result.vendorEmail
                             });
                          }
                          if (result.vendorAddress) {
                             creedNzSublist.setSublistValue({
                                id: 'custpage_vendor_address',
                                line: j,
                                value: result.vendorAddress
                             });
                          }
                          if (result.vendorBillCountry) {
                             creedNzSublist.setSublistValue({
                                id: 'custpage_vendor_bill_country',
                                line: j,
                                value: result.vendorBillCountry
                             });
                          }
                          if (result.vendorBillCity) {
                             creedNzSublist.setSublistValue({
                                id: 'custpage_vendor_bill_city',
                                line: j,
                                value: result.vendorBillCity
                             });
                          }
                          if (result.vendorBillZip) {
                             creedNzSublist.setSublistValue({
                                id: 'custpage_vendor_bill_zip',
                                line: j,
                                value: result.vendorBillZip
                             });
                          }
                           //set new fields
                           if (result.vendorCreednzPaymentMethod) {
                              creedNzSublist.setSublistValue({
                                 id: 'custpage_vendor_payment_method',
                                 line: j,
                                 value: result.vendorCreednzPaymentMethod
                              });
                           }
                           if (result.vendorCreednzBankAccName) {
                              creedNzSublist.setSublistValue({
                                 id: 'custpage_vendor_bank_acc_name',
                                 line: j,
                                 value: result.vendorCreednzBankAccName
                              });
                           }
                           if (result.vendorCreednzBankAddress) {
                              creedNzSublist.setSublistValue({
                                 id: 'custpage_vendor_bank_address',
                                 line: j,
                                 value: result.vendorCreednzBankAddress
                              });
                           }
                           if (result.vendorCreednzBankCode) {
                              creedNzSublist.setSublistValue({
                                 id: 'custpage_vendor_bank_code',
                                 line: j,
                                 value: result.vendorCreednzBankCode
                              });
                           }
                           if (result.vendorCreednzBankNumber) {
                              creedNzSublist.setSublistValue({
                                 id: 'custpage_vendor_bank_number',
                                 line: j,
                                 value: result.vendorCreednzBankNumber
                              });
                           }
                           if (result.vendorCreednzBankDetailsUpdate) {
                              creedNzSublist.setSublistValue({
                                 id: 'custpage_vendor_bank_details_update',
                                 line: j,
                                 value: result.vendorCreednzBankDetailsUpdate
                              });
                           }
                           if (result.vendorCreednzEftBankUpdate) {
                              creedNzSublist.setSublistValue({
                                 id: 'custpage_vendor_eft_bank_update',
                                 line: j,
                                 value: result.vendorCreednzEftBankUpdate
                              });
                           }
                           if (result.vendorCreednzEftBillPayment) {
                              creedNzSublist.setSublistValue({
                                 id: 'custpage_vendor_eft_bill_payment',
                                 line: j,
                                 value: result.vendorCreednzEftBillPayment
                              });
                           }if (result.vendorCreednzIban) {
                              creedNzSublist.setSublistValue({
                                 id: 'custpage_vendor_iban',
                                 line: j,
                                 value: result.vendorCreednzIban
                              });
                           }
                           if (result.vendorCreednzSwift) {
                              creedNzSublist.setSublistValue({
                                 id: 'custpage_vendor_swift',
                                 line: j,
                                 value: result.vendorCreednzSwift
                              });
                           }
                           if (result.vendorCreednzRegCode) {
                              creedNzSublist.setSublistValue({
                                 id: 'custpage_vendor_reg_code',
                                 line: j,
                                 value: result.vendorCreednzRegCode
                              });
                           }
                           if (result.vendorCreednzBranchNumber) {
                              creedNzSublist.setSublistValue({
                                 id: 'custpage_vendor_branch_number',
                                 line: j,
                                 value: result.vendorCreednzBranchNumber
                              });
                           }
                           if (result.vendorCreednzBranchName) {
                              creedNzSublist.setSublistValue({
                                 id: 'custpage_vendor_branch_name',
                                 line: j,
                                 value: result.vendorCreednzBranchName
                              });
                           }
                           if (result.vendorCreednzRoutingNumber) {
                              creedNzSublist.setSublistValue({
                                 id: 'custpage_vendor_routing_number',
                                 line: j,
                                 value: result.vendorCreednzRoutingNumber
                              });
                           }
                           if (result.vendorCreednzPaypalAcc) {
                              creedNzSublist.setSublistValue({
                                 id: 'custpage_vendor_paypal_acc',
                                 line: j,
                                 value: result.vendorCreednzPaypalAcc
                              });
                           }
 

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
               /*
              var searchObj = search.load({
                 id: searchId
              });
              */
              var searchObj = searchlib.customsearch_ss_vendor_search_for_creed();

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
                 var vendorId = result.getValue({
                    name: "internalid",
                    label: "Internal ID"
                 });
                 var vendorName = result.getValue({
                    name: "entityid",
                    label: "Name"
                 });
                 var vendorPrimaryContact = result.getValue({
                    name: "contact",
                    label: "Primary Contact"
                 });
                 var vendorCurrency = result.getValue({
                    name: "currency",
                    label: "Currency"
                 });
                 var vendorCurrencyText = result.getText({
                  name: "currency",
                  label: "Currency"
               });
                 var vendorPhone = result.getValue({
                    name: "phone",
                    label: "Phone"
                 });
                 var vendorSubsidiary = result.getValue({
                    name: "subsidiary",
                    label: "Primary Subsidiary"
                 });
                 var vendorSubsidiaryText = result.getText({
                  name: "subsidiary",
                  label: "Primary Subsidiary"
               });
                 var vendorCreatedDate = result.getValue({
                    name: "datecreated",
                    label: "Date Created"
                 });
                 var vendorLastModified = result.getValue({
                    name: "lastmodifieddate",
                    label: "Last Modified"
                 });
                 var vendorEmail = result.getValue({
                    name: "email",
                    label: "Email"
                 });
                 var vendorAddress = result.getValue({
                    name: "address",
                    label: "Address"
                 });

                 var vendorBillCountry = result.getValue({
                    name: "billcountry",
                    label: "Billing Country"
                 });
                 var vendorBillCity = result.getValue({
                    name: "billcity",
                    label: "Billing City"
                 });

                 var vendorBillZip = result.getValue({
                    name: "billzipcode",
                    label: "Billing Zip"
                 });

                 var vendorExternalId = result.getValue({
                    name: "custentity_vendor_external_id",
                    label: "Vendor External ID"
                 });
                 var vendorCreednzRisk = result.getValue({
                    name: "custentity_creednz_risk_status",
                    label: "Creednz Risk Status"
                 });
                 var vendorCreednzLastUpdated = result.getValue({
                    name: "custentity_creednz_updated_on",
                    label: "Creednz Updated On"
                 });
                 var vendorCreednzPaymentMethod = result.getValue({
                  name: "custentity_vendor_payment_method_creeedn",
                  label: "Vendor Payment Method"
               });
               var vendorCreednzBankAccName = result.getValue({
                  name: "custentity_bank_account_name_creednz",
                  label: "Bank Account Name"
               });
               var vendorCreednzBankAddress = result.getValue({
                  name: "custentity_bank_address_creednz",
                  label: "Bank Address"
               });
               var vendorCreednzBankCode = result.getValue({
                  name: "custentity_bank_code_creednz",
                  label: "Bank Code"
               });
               var vendorCreednzBankNumber = result.getValue({
                  name: "custentity_bank_number_creednz",
                  label: "Bank Number"
               });
               var vendorCreednzBankDetailsUpdate = result.getValue({
                  name: "custentity_bank_details_update_creednz",
                  label: "Bank details Update"
               });
               var vendorCreednzEftBankUpdate = result.getValue({
                  name: "custentity_eft_bank_detailsupdate_creedn",
                  label: "EFT Bank Details Update"
               });
               var vendorCreednzEftBillPayment = result.getValue({
                  name: "custentity_eft_bill_payment_creednz",
                  label: "EFT Bill Payment"
               });
               var vendorCreednzIban = result.getValue({
                  name: "custentity_iban_creednz",
                  label: "IBAN"
               });
               var vendorCreednzSwift = result.getValue({
                  name: "custentity_swift_creednz",
                  label: "Swift"
               });
               var vendorCreednzRegCode = result.getValue({
                  name: "custentity_registraion_code_creednz",
                  label: "Registration Code"
               });
               var vendorCreednzBranchNumber = result.getValue({
                  name: "custentity_branch_number_creednz",
                  label: "Branch Number"
               });
               var vendorCreednzBranchName = result.getValue({
                  name: "custentity_branch_name_creednz",
                  label: "Branch Name"
               });
               var vendorCreednzRoutingNumber = result.getValue({
                  name: "custentity_routing_number_creednz",
                  label: "Routing Number"
               });
               var vendorCreednzPaypalAcc = result.getValue({
                  name: "custentity_paypal_account_creednz",
                  label: "Paypal Account"
               });
                 results.push({
                    'vendorId': vendorId,
                    'vendorName': vendorName,
                    'vendorPrimaryContact': vendorPrimaryContact,
                    'vendorCurrency': vendorCurrency,
                    'vendorCurrencyText': vendorCurrencyText,
                    'vendorPhone': vendorPhone,
                    'vendorSubsidiary': vendorSubsidiary,
                    'vendorSubsidiaryText': vendorSubsidiaryText,
                    'vendorCreatedDate': vendorCreatedDate,
                    'vendorLastModified': vendorLastModified,
                    'vendorEmail': vendorEmail,
                    'vendorAddress': vendorAddress,
                    'vendorBillCountry': vendorBillCountry,
                    'vendorBillCity': vendorBillCity,
                    'vendorBillZip': vendorBillZip,
                    'vendorExternalId': vendorExternalId,
                    'vendorCreednzRisk': vendorCreednzRisk,
                    'vendorCreednzLastUpdated': vendorCreednzLastUpdated,
                    'vendorCreednzPaymentMethod': vendorCreednzPaymentMethod,
                    'vendorCreednzBankAccName': vendorCreednzBankAccName,
                    'vendorCreednzBankAddress': vendorCreednzBankAddress,
                    'vendorCreednzBankCode': vendorCreednzBankCode,
                    'vendorCreednzBankNumber': vendorCreednzBankNumber,
                    'vendorCreednzBankDetailsUpdate': vendorCreednzBankDetailsUpdate,
                    'vendorCreednzEftBankUpdate': vendorCreednzEftBankUpdate,
                    'vendorCreednzEftBillPayment': vendorCreednzEftBillPayment,
                    'vendorCreednzIban': vendorCreednzIban,
                    'vendorCreednzSwift': vendorCreednzSwift,
                    'vendorCreednzRegCode': vendorCreednzRegCode,
                    'vendorCreednzBranchNumber': vendorCreednzBranchNumber,
                    'vendorCreednzBranchName': vendorCreednzBranchName,
                    'vendorCreednzRoutingNumber': vendorCreednzRoutingNumber,
                    'vendorCreednzPaypalAcc': vendorCreednzPaypalAcc

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