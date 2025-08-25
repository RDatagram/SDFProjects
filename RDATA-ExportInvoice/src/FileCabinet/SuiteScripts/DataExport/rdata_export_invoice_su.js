/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */

define(['N/ui/serverWidget', 'N/task', 'N/log', 'N/url', 'N/redirect', 'N/runtime'],
    function(serverWidget, task, log, url, redirect, runtime) {

        /**
         * GET - Display the form
         */
        function onRequest(context) {
            try {
                if (context.request.method === 'GET') {
                    showForm(context);
                } else if (context.request.method === 'POST') {
                    processForm(context);
                }
            } catch (e) {
                log.error('onRequest Error', e.toString());
                var form = createErrorForm(e.toString());
                context.response.writePage(form);
            }
        }

        /**
         * Display the main form
         */
        function showForm(context) {
            var form = serverWidget.createForm({
                title: 'Invoice PDF Export'
            });

            // Add instructions
            var instructionsField = form.addField({
                id: 'custpage_instructions',
                type: serverWidget.FieldType.INLINEHTML,
                label: 'Instructions'
            });

            instructionsField.defaultValue =
                '<div style="background: #f0f8ff; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #007acc;">' +
                '<h3 style="margin-top: 0; color: #007acc;">Invoice PDF Export Tool</h3>' +
                '<p>This tool will generate PDF files for all invoices within your specified date range and save them to your designated folder.</p>' +
                '<ul>' +
                '<li>Leave dates blank to process all invoices</li>' +
                '<li>Processing time depends on the number of invoices</li>' +
                '<li>You will receive a completion notification</li>' +
                '</ul>' +
                '</div>';

            // Date Range Section
            var dateGroup = form.addFieldGroup({
                id: 'custpage_date_group',
                label: 'Date Range Filter'
            });

            // From Date
            var fromDateField = form.addField({
                id: 'custpage_from_date',
                type: serverWidget.FieldType.DATE,
                label: 'From Date',
                container: 'custpage_date_group'
            });
            fromDateField.setHelpText({
                help: 'Start date for invoice date range (leave blank for no start limit)'
            });

            // To Date
            var toDateField = form.addField({
                id: 'custpage_to_date',
                type: serverWidget.FieldType.DATE,
                label: 'To Date',
                container: 'custpage_date_group'
            });
            toDateField.setHelpText({
                help: 'End date for invoice date range (leave blank for no end limit)'
            });

            // Additional Filters Section
            var filterGroup = form.addFieldGroup({
                id: 'custpage_filter_group',
                label: 'Additional Filters (Optional)'
            });

            // Customer Filter
            var customerField = form.addField({
                id: 'custpage_customer',
                type: serverWidget.FieldType.SELECT,
                label: 'Specific Customer',
                source: 'customer',
                container: 'custpage_filter_group'
            });
            customerField.setHelpText({
                help: 'Leave blank to process all customers'
            });
            customerField.isMandatory = false;

            // Options Section
            var optionsGroup = form.addFieldGroup({
                id: 'custpage_options_group',
                label: 'Export Options'
            });

            // Folder Selection
            var folderField = form.addField({
                id: 'custpage_folder',
                type: serverWidget.FieldType.SELECT,
                label: 'Target Folder',
                source: 'folder',
                container: 'custpage_options_group'
            });
            folderField.isMandatory = false;
            folderField.setHelpText({
                help: 'Select the folder where PDF files will be saved'
            });
            folderField.addSelectOption({
                value: '933',
                text: 'Standard Folder'
            });
            // File Naming Convention
            var namingField = form.addField({
                id: 'custpage_naming',
                type: serverWidget.FieldType.SELECT,
                label: 'File Naming Convention',
                container: 'custpage_options_group'
            });
            namingField.addSelectOption({
                value: 'standard',
                text: 'Invoice_[Number]_[Customer]_[Date].pdf'
            });
            namingField.addSelectOption({
                value: 'simple',
                text: 'Invoice_[Number].pdf'
            });
            namingField.addSelectOption({
                value: 'detailed',
                text: '[Date]_Invoice_[Number]_[Customer].pdf'
            });
            namingField.defaultValue = 'standard';

            // Email notification
            var emailField = form.addField({
                id: 'custpage_notify_email',
                type: serverWidget.FieldType.EMAIL,
                label: 'Notification Email',
                container: 'custpage_options_group'
            });
            emailField.setHelpText({
                help: 'Optional: Email address to notify when export is complete'
            });

            // Add submit button
            form.addSubmitButton({
                label: 'Start PDF Export'
            });

            // Add reset button
            form.addResetButton({
                label: 'Reset Form'
            });

            context.response.writePage(form);
        }

        /**
         * Process the submitted form
         */
        function processForm(context) {
            try {
                let request = context.request;

                // Get form values
                let fromDate = request.parameters.custpage_from_date;
                let toDate = request.parameters.custpage_to_date;
                let customerId = request.parameters.custpage_customer;
                let folderId =  request.parameters.custpage_folder;
                let namingConvention = request.parameters.custpage_naming;
                let notifyEmail = request.parameters.custpage_notify_email;

                log.audit('Form Submission', {
                    fromDate: fromDate,
                    toDate: toDate,
                    customerId: customerId,
                    folderId: folderId,
                    namingConvention: namingConvention,
                    notifyEmail: notifyEmail
                });

                // Validate required fields
                if (!folderId) {
                    throw new Error('Target folder is required');
                }

                // Create parameters object for the Map/Reduce script
                let scriptParams = {
                    custscript_folder_id: folderId,
                    custscript_naming_convention: namingConvention
                };

                // Add optional parameters if provided
                if (fromDate) {
                    scriptParams.custscript_from_date = fromDate;
                }
                if (toDate) {
                    scriptParams.custscript_to_date = toDate;
                }
                if (customerId) {
                    scriptParams.custscript_customer_id = customerId;
                }
                if (notifyEmail) {
                    scriptParams.custscript_notify_email = notifyEmail;
                }

                // Create and submit the Map/Reduce task
                var mrTask = task.create({
                    taskType: task.TaskType.MAP_REDUCE,
                    scriptId: 'customscript_rdata_export_invoices', // Replace with your Map/Reduce script ID
                    deploymentId: null, // Replace with your deployment ID
                    params: scriptParams
                });

                const taskId = mrTask.submit();

                log.audit('Task Submitted', 'Map/Reduce Task ID: ' + taskId);

                // Show confirmation page
                showConfirmationPage(context, taskId, fromDate, toDate);

            } catch (e) {
                log.error('processForm Error', e.toString());
                const form = createErrorForm(e.toString());
                context.response.writePage(form);
            }
        }

        /**
         * Show confirmation page
         */
        function showConfirmationPage(context, taskId, fromDate, toDate) {
            const form = serverWidget.createForm({
                title: 'Export Started Successfully'
            });

            const confirmationField = form.addField({
                id: 'custpage_confirmation',
                type: serverWidget.FieldType.INLINEHTML,
                label: 'Status'
            });

            let dateRangeText = '';
            if (fromDate || toDate) {
                dateRangeText = '<p><strong>Date Range:</strong> ';
                if (fromDate) dateRangeText += 'From ' + fromDate + ' ';
                if (toDate) dateRangeText += 'To ' + toDate;
                dateRangeText += '</p>';
            }

            const taskStatus =  task.checkStatus({ taskId: taskId });
            const taskStatusText = JSON.stringify(taskStatus);

            confirmationField.defaultValue =
                '<div style="background: #d4edda; padding: 20px; margin: 10px 0; border-radius: 5px; border: 1px solid #c3e6cb;">' +
                '<h3 style="color: #155724; margin-top: 0;">✓ PDF Export Started Successfully</h3>' +
                '<p><strong>Task ID:</strong> ' + taskId + '</p>' +
                '<p><strong>Task Status:</strong> ' + taskStatusText + '</p>' +
                dateRangeText +
                '<p>The invoice PDF generation process has been started. Depending on the number of invoices, this may take several minutes to complete.</p>' +
                '<p>You can monitor the progress in Setup > Integration > Scheduled Script Status.</p>' +
                '</div>';

            // Add button to start new export
            form.addButton({
                id: 'custpage_new_export',
                label: 'Start New Export',
                functionName: 'window.location.reload()'
            });

            // Add button to view script status
            /*
            let statusUrl = url.resolveRecord({
                recordType: 'scheduledscript',
                recordId: taskId,
                isEditMode: false
            });

            form.addButton({
                id: 'custpage_view_status',
                label: 'View Task Status',
                functionName: 'window.open("' + url.format({
                    type: url.Type.RECORD,
                    recordType: 'scheduledscriptinstance',
                    recordId: taskId
                }) + '")'
            });
            */
            context.response.writePage(form);
        }

        /**
         * Create error form
         */
        function createErrorForm(errorMessage) {
            var form = serverWidget.createForm({
                title: 'Error'
            });

            var errorField = form.addField({
                id: 'custpage_error',
                type: serverWidget.FieldType.INLINEHTML,
                label: 'Error'
            });

            errorField.defaultValue =
                '<div style="background: #f8d7da; padding: 20px; margin: 10px 0; border-radius: 5px; border: 1px solid #f5c6cb;">' +
                '<h3 style="color: #721c24; margin-top: 0;">Error</h3>' +
                '<p>' + errorMessage + '</p>' +
                '</div>';

            form.addButton({
                id: 'custpage_back',
                label: 'Go Back',
                functionName: 'history.back()'
            });

            return form;
        }

        return {
            onRequest: onRequest
        };
    });

/*
 * DEPLOYMENT NOTES:
 *
 * 1. Script Parameters to add:
 *    - custscript_folder_id (Free Text)
 *    - custscript_naming_convention (List/Record: standard, simple, detailed)
 *    - custscript_from_date (Date)
 *    - custscript_to_date (Date)
 *    - custscript_customer_id (Free Text)
 *    - custscript_invoice_status (Free Text)
 *    - custscript_notify_email (Free Text)
 *
 * 2. Update the Map/Reduce script to use these parameters
 *
 * 3. Replace script IDs in processForm function:
 *    - customscript_invoice_pdf_mr (your Map/Reduce script ID)
 *    - customdeploy_invoice_pdf_mr (your Map/Reduce deployment ID)
 *
 * 4. Permissions Required:
 *    - Lists > Transactions > Full
 *    - Documents and Files > Full
 *    - Setup > Scheduled Scripts > Full
 *
 * 5. URL for Suitelet:
 *    - Available at: /app/site/hosting/scriptlet.nl?script=XXX&deploy=XXX
 */