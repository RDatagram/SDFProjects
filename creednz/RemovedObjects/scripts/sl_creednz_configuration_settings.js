/**
 *
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope public
 * @author Rajitha
 * Script brief description:
     Creednz Configuration Settings
 * Revision History:
 *
 * Date                 Issue/Case         Author          Issue Fix Summary
 * =============================================================================================
 * 2024/June/11                            Rajitha         Initial version.
 */
     var PAGE_SIZE = 500;
     var customFilters = {};
    // var searchId = 'customsearch_ss_vendor_search_for_creed';
     var searchId = 'customsearch_ss_vendor_evaluation_table';
     define(["N/ui/serverWidget", "N/log", "N/record", "N/url", "N/search", "N/task", "N/redirect", "N/runtime", "N/encode", "N/file", "N/https"], (ui, log, record, url, search, task, redirect, runtime, encode, file, https, ) => {
        function onRequest(context) {
           // get method
           if (context.request.method === 'GET') {
              try {
                 var form = ui.createForm({
                    id: 'vendor_evaluation',
                    title: 'Creednz Configuration Settings'
                 });
               
                 var fieldgroup = form.addFieldGroup({
                  id: 'filterfieldsgroup',
                  label: 'Filter Group'
               });
               form.addSubmitButton({
                   label: "SAVE"
                });
                form.addButton({
                    id : 'custpage_cancel',
                    label : 'Cancel',
                    functionName: 'cancelSettings()'
                });
          // form.clientScriptModulePath = 'SuiteScripts/cs_creednz_vendor_evaluation.js';
            form.addField({
                id:'custpage_sub_title',
                type:ui.FieldType.INLINEHTML,
                label:'Sub Title',
                //container: 'filterfieldsgroup'
                }).defaultValue = '<div class="head"><h2>&nbsp; &nbsp; Customize your security and fraud prevention features</h2></div>';
           

           /* var vendorMasterSublist = form.addSublist({
                id: "custpage_vendor_master_sublist",
                type: ui.SublistType.LIST,
                label: "Vendor Master Protection",
             });
             var paymentRunSublist = form.addSublist({
                id: "custpage_payment_run_sublist",
                type: ui.SublistType.LIST,
                label: "Payment Run Protection",
             });
             var accountSettingsSublist = form.addSublist({
                id: "custpage_account_settings_sublist",
                type: ui.SublistType.LIST,
                label: "Account Settings",
             });
             var reportsSublist = form.addSublist({
                id: "custpage_reports_analytics_sublist",
                type: ui.SublistType.LIST,
                label: "Reports & Analytics",
             });


           var unifiedInterfaceField = vendorMasterSublist.addField({
            id : 'custpage_unified_interface',
            type : ui.FieldType.CHECKBOX,
            label : 'UNIFIED INTERFACE'
            });
            unifiedInterfaceField.updateLayoutType({
                layoutType: ui.FieldLayoutType.OUTSIDEBELOW
             });
            var fullTransparencyField = vendorMasterSublist.addField({
            id : 'custpage_full_transparency',
            type : ui.FieldType.CHECKBOX,
            label : 'FULL TRANSPARENCY'
            });
            fullTransparencyField.updateLayoutType({
                layoutType: ui.FieldLayoutType.OUTSIDEBELOW
             });
            var vendorTransparencyField = vendorMasterSublist.addField({
            id : 'custpage_vendor_transparency',
            type : ui.FieldType.CHECKBOX,
            label : 'VENDOR TRANSPARENCY'
            });    
            var consistantProcessField = vendorMasterSublist.addField({
                id : 'custpage_consistant_process',
                type : ui.FieldType.CHECKBOX,
                label : 'Consistent Process'
                });
              */
              
                var vendorMasterSubtab= form.addTab({
                    id : 'custpage_vendor_master_subtab',
                    label : 'Vendor Master Protection'
                });
                var paymentRunSubtab= form.addTab({
                    id : 'custpage_payment_run_subtab',
                    label : 'Payment Run Protection'
                });
                var accountSettingsSubtab= form.addTab({
                    id : 'custpage_account_settings_subtab',
                    label : 'Account Settings'
                });
                var reportsSubtab= form.addTab({
                    id : 'custpage_reports_analytics_subtab',
                    label : 'Reports & Analytics'
                });
                //add fields to subtab
                var unifiedInterfaceField = form.addField({
                    id : 'custpage_unified_interface',
                    type : ui.FieldType.CHECKBOX,
                    label : 'UNIFIED INTERFACE',
                    container:'custpage_vendor_master_subtab'
                    });
                  
                    form.addField({
                        id:'custpage_sub_title_unified_interface',
                        type:ui.FieldType.INLINEHTML,
                        label:'Sub Title',
                        container: 'custpage_vendor_master_subtab'
                        }).defaultValue = '<br><div class="head" style = "font-style: normal;font-size: 12px;color: #6f6f6f !important;">ENABLE A SINGLE INTERFACE FOR ALL VENDOR ONBOARDING AND MAINTENANCE</div><br>';
                   
                    var fullTransparencyField = form.addField({
                    id : 'custpage_full_transparency',
                    type : ui.FieldType.CHECKBOX,
                    label : 'FULL TRANSPARENCY',
                    container:'custpage_vendor_master_subtab'
                    });
                    form.addField({
                    id:'custpage_sub_title_full_transparency',
                    type:ui.FieldType.INLINEHTML,
                    label:'Sub Title',
                    container: 'custpage_vendor_master_subtab'
                    }).defaultValue = '<br><div class="head" style = "font-style: normal;font-size: 12px;color: #6f6f6f !important;">TRACK EACH VENDORS STAGE AND ENSURE TRANSPARENCY AND RESILIENCE TO STAFF TURNOVERS</div><br>';
                        
                   
                    var vendorTransparencyField = form.addField({
                    id : 'custpage_vendor_transparency',
                    type : ui.FieldType.CHECKBOX,
                    label : 'VENDOR TRANSPARENCY',
                    container:'custpage_vendor_master_subtab'
                    });    
                  
                    form.addField({
                        id:'custpage_sub_title_vendor_transparency',
                        type:ui.FieldType.INLINEHTML,
                        label:'Sub Title',
                        container: 'custpage_vendor_master_subtab'
                        }).defaultValue = '<br><div class="head" style = "font-style: normal;font-size: 12px;color: #6f6f6f !important;">NOTIFY VENDORS OF THEIR PROGRESS AND DETECTED ISSUES</div><br>';
                var consistantProcessField = form.addField({
                            id : 'custpage_consistant_process',
                            type : ui.FieldType.CHECKBOX,
                            label : 'Consistent Process',
                            container: 'custpage_vendor_master_subtab'
                            });
                           
                form.addField({
                id:'custpage_sub_title_consistant_process',
                type:ui.FieldType.INLINEHTML,
                label:'Sub Title',
                container: 'custpage_vendor_master_subtab'
                }).defaultValue = '<br><div class="head" style = "font-style: normal;font-size: 12px;color: #6f6f6f !important;">ENSURE STANDARDIZED DATA COLLECTION AND COMPLIANCE WITH MASTER DATA STANDARDS</div><br>';
         
                    var bankAccountValidationField = form.addField({
                    id : 'custpage_bank_acc_validation',
                    type : ui.FieldType.CHECKBOX,
                    label : 'Bank Account Validation',
                    container:'custpage_vendor_master_subtab'
                    });
                    bankAccountValidationField.updateBreakType({
                        breakType: ui.FieldBreakType.STARTCOL
                    });
                    form.addField({
                        id:'custpage_sub_title_bank_acc_validation',
                        type:ui.FieldType.INLINEHTML,
                        label:'Sub Title',
                        container: 'custpage_vendor_master_subtab'
                    }).defaultValue = '<br><div class="head" style = "font-style: normal;font-size: 12px;color: #6f6f6f !important;">VALIDATE BANK ACCOUNTS DIRECTLY WITH TIER 1 GLOBAL BANKS</div><br>';
                    var inteligenceField = form.addField({
                    id : 'custpage_inteligence_screening',
                    type : ui.FieldType.CHECKBOX,
                    label : 'Cybersecurity Intelligence Screening',
                    container:'custpage_vendor_master_subtab'
                    });
                    form.addField({
                        id:'custpage_sub_title_inteligence_screening',
                        type:ui.FieldType.INLINEHTML,
                        label:'Sub Title',
                        container: 'custpage_vendor_master_subtab'
                    }).defaultValue = '<br><div class="head" style = "font-style: normal;font-size: 12px;color: #6f6f6f !important;">SCREEN MASTER VENDOR RECORDS FOR ACTIVE DATA BREACHES ON THE DARK WEB</div><br>';

                    var globalSanctionField = form.addField({
                    id : 'custpage_global_sanction',
                    type : ui.FieldType.CHECKBOX,
                    label : 'Global Sanction Screening',
                    container:'custpage_vendor_master_subtab'
                    });
                    form.addField({
                        id:'custpage_sub_title_global_sanction',
                        type:ui.FieldType.INLINEHTML,
                        label:'Sub Title',
                        container: 'custpage_vendor_master_subtab'
                    }).defaultValue = '<br><div class="head" style = "font-style: normal;font-size: 12px;color: #6f6f6f !important;">SCREEN VENDORS AGAINST GLOBAL SANCTIONS LISTS</div><br>';

                    var financeEmailField = form.addField({
                    id : 'custpage_finance_email_protection',
                    type : ui.FieldType.CHECKBOX,
                    label : 'Finance Email Protection',
                    container:'custpage_vendor_master_subtab'
                    });
                    form.addField({
                        id:'custpage_sub_title_email_protection',
                        type:ui.FieldType.INLINEHTML,
                        label:'Sub Title',
                        container: 'custpage_vendor_master_subtab'
                    }).defaultValue = '<br><div class="head" style = "font-style: normal;font-size: 12px;color: #6f6f6f !important;">INSPECT FINANCE-RELATED EMAILS FOR MASTER DATA RISKS</div><br>';
                    //add fields to second subtab
                    var paymentRunInspection = form.addField({
                        id : 'custpage_payment_run_inspection',
                        type : ui.FieldType.CHECKBOX,
                        label : 'Payment Run Inspection',
                        container:'custpage_payment_run_subtab'
                        });

                        form.addField({
                            id:'custpage_sub_title_payment_run_inspection',
                            type:ui.FieldType.INLINEHTML,
                            label:'Sub Title',
                            container: 'custpage_payment_run_subtab'
                        }).defaultValue = '<br><div class="head" style = "font-style: normal;font-size: 12px;color: #6f6f6f !important;">ENSURE INTEGRITY OF PAYMENT FILES BEFORE BANK TRANSFER</div><br>';
    
                       
                        var largeScalePaymentField = form.addField({
                        id : 'custpage_large_scale_payment',
                        type : ui.FieldType.CHECKBOX,
                        label : 'Large-scale Payment Inspection',
                        container:'custpage_payment_run_subtab'
                        });
                        form.addField({
                            id:'custpage_sub_title_large_scale_payment',
                            type:ui.FieldType.INLINEHTML,
                            label:'Sub Title',
                            container: 'custpage_payment_run_subtab'
                        }).defaultValue = '<br><div class="head" style = "font-style: normal;font-size: 12px;color: #6f6f6f !important;">VALIDATE COMPLIANCE WITH COMPANY POLICIES FOR ALL PAYMENTS</div><br>';
    
                       
                        var suspiciousPaymemtField = form.addField({
                        id : 'custpage_suspicious_payment_detection',
                        type : ui.FieldType.CHECKBOX,
                        label : 'Suspicious Payment Detection',
                        container:'custpage_payment_run_subtab'
                        }); 
                        form.addField({
                            id:'custpage_sub_title_suspicious_payment',
                            type:ui.FieldType.INLINEHTML,
                            label:'Sub Title',
                            container: 'custpage_payment_run_subtab'
                        }).defaultValue = '<br><div class="head" style = "font-style: normal;font-size: 12px;color: #6f6f6f !important;">MONITOR FOR INSIDER RISK SCENARIOS AND SUSPICIOUS PAYMENTS</div><br>';

                        var operationalFinanceField = form.addField({
                        id : 'custpage_operational_finance_risk',
                        type : ui.FieldType.CHECKBOX,
                        label : 'Operational Finance Risk Detection',
                        container:'custpage_payment_run_subtab'
                        });  
                        operationalFinanceField.updateBreakType({
                            breakType: ui.FieldBreakType.STARTCOL
                        });
                        form.addField({
                            id:'custpage_sub_title_operational_finance',
                            type:ui.FieldType.INLINEHTML,
                            label:'Sub Title',
                            container: 'custpage_payment_run_subtab'
                        }).defaultValue = '<br><div class="head" style = "font-style: normal;font-size: 12px;color: #6f6f6f !important;">IDENTIFY ABNORMAL PAYMENTS AND DUPLICATE PAYMENTS</div><br>';
  
                        var criticalPaymentField = form.addField({
                        id : 'custpage_critical_payment_monitoring',
                        type : ui.FieldType.CHECKBOX,
                        label : 'Critical Payment Monitoring',
                        container:'custpage_payment_run_subtab'
                        });
                        form.addField({
                            id:'custpage_sub_title_critical_payment_monitoring',
                            type:ui.FieldType.INLINEHTML,
                            label:'Sub Title',
                            container: 'custpage_payment_run_subtab'
                        }).defaultValue = '<br><div class="head" style = "font-style: normal;font-size: 12px;color: #6f6f6f !important;">SPOT MISSING CRITICAL PAYMENTS TO AVOID FINES</div><br>';
  
                        var anomalousPatternField = form.addField({
                        id : 'custpage_anomalous_pattern_detection',
                        type : ui.FieldType.CHECKBOX,
                        label : 'Anomalous Pattern Detection',
                        container:'custpage_payment_run_subtab'
                        });
                        form.addField({
                            id:'custpage_sub_title_anomalous_pattern',
                            type:ui.FieldType.INLINEHTML,
                            label:'Sub Title',
                            container: 'custpage_payment_run_subtab'
                        }).defaultValue = '<br><div class="head" style = "font-style: normal;font-size: 12px;color: #6f6f6f !important;">DETECT FRAUD AND OPERATIONAL ERRORS WITH CUSTOM-BUILT RULES</div><br>';
  
                         //add fields to third subtab
                   /* var unifiedInterfaceFieldTwo = form.addField({
                        id : 'custpage_unified_interface_two',
                        type : ui.FieldType.CHECKBOX,
                        label : 'UNIFIED INTERFACE',
                        container:'custpage_account_settings_subtab'
                        });
                       
                        var fullTransparencyFieldTwo = form.addField({
                        id : 'custpage_full_transparency_two',
                        type : ui.FieldType.CHECKBOX,
                        label : 'FULL TRANSPARENCY',
                        container:'custpage_account_settings_subtab'
                        });
                       
                        var vendorTransparencyFieldTwo = form.addField({
                        id : 'custpage_vendor_transparency_two',
                        type : ui.FieldType.CHECKBOX,
                        label : 'VENDOR TRANSPARENCY',
                        container:'custpage_account_settings_subtab'
                        }); */

                        form.addField({
                            id:'custpage_dummy_field',
                            type:ui.FieldType.INLINEHTML,
                            label:'Sub Title',
                            container: 'custpage_account_settings_subtab'
                        }).defaultValue = '<br><div class="head" style = "font-style: normal;font-size: 12px;color: #6f6f6f !important;"> </div><br>';
  


                        //add fields to forth subtab
                        /*var unifiedInterfaceFieldThree = form.addField({
                            id : 'custpage_unified_interface_three',
                            type : ui.FieldType.CHECKBOX,
                            label : 'UNIFIED INTERFACE',
                            container:'custpage_reports_analytics_subtab'
                            });
                           
                            var fullTransparencyFieldThree= form.addField({
                            id : 'custpage_full_transparency_three',
                            type : ui.FieldType.CHECKBOX,
                            label : 'FULL TRANSPARENCY',
                            container:'custpage_reports_analytics_subtab'
        
                            });
                           
                            var vendorTransparencyFieldThree = form.addField({
                            id : 'custpage_vendor_transparency_three',
                            type : ui.FieldType.CHECKBOX,
                            label : 'VENDOR TRANSPARENCY',
                            container:'custpage_reports_analytics_subtab'
    
                            });  */
                            form.addField({
                                id:'custpage_dummy_field_reporttab',
                                type:ui.FieldType.INLINEHTML,
                                label:'Sub Title',
                                container: 'custpage_reports_analytics_subtab'
                            }).defaultValue = '<br><div class="head" style = "font-style: normal;font-size: 12px;color: #6f6f6f !important;"> </div><br>';
       
              
                 context.response.writePage(form);
              } catch (err) {
                 log.debug("error", err);
              }
           } else {
              //post
              try {
              
              } catch (err) {
                 log.debug("error in post", err);
              }
           } //end post
        } //end execute
       
      
      return {
           onRequest: onRequest
        };
     });