/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */

define(['N/search', 'N/render', 'N/file', 'N/log', 'N/record', 'N/runtime', 'N/email'],
    function(search, render, file, log, record, runtime, email) {

        /**
         * Get Input Data - Retrieve customer invoices based on parameters
         */
        function getInputData() {
            log.debug('getInputData', 'Starting invoice search with parameters');

            try {
                const script = runtime.getCurrentScript();

                // Get parameters from Suitelet
                const fromDate = script.getParameter('custscript_from_date');
                const toDate = script.getParameter('custscript_to_date');
                const customerId = script.getParameter('custscript_customer_id');

                log.debug('Parameters', {
                    fromDate: fromDate,
                    toDate: toDate,
                    customerId: customerId
                });

                // Build search filters
                let filters = [
                    ['type', 'anyof', 'CustInvc'], // Customer Invoice
                    'AND',
                    ['mainline', 'is', 'T'] // Main line only to avoid duplicates
                ];

                // Add date range filters
                if (fromDate) {
                    filters.push('AND');
                    filters.push(['trandate', 'onorafter', fromDate]);
                }

                if (toDate) {
                    filters.push('AND');
                    filters.push(['trandate', 'onorbefore', toDate]);
                }

                // Add customer filter
                if (customerId) {
                    filters.push('AND');
                    filters.push(['entity', 'anyof', customerId]);
                }

                // Create search
                const invoiceSearch = search.create({
                    type: search.Type.INVOICE,
                    filters: filters,
                    columns: [
                        'internalid',
                        'tranid',
                        'entity',
                        'trandate',
                        'status',
                        'total'
                    ]
                });

                log.debug('getInputData', 'Invoice search created successfully with ' + filters.join('\n') + ' filters');
                return invoiceSearch;

            } catch (e) {
                log.error('getInputData Error', e.toString());
                throw e;
            }
        }

        /**
         * Map Stage - Process each invoice
         */
        function map(context) {
            try {
                var searchResult = JSON.parse(context.value);
                var invoiceId = searchResult.values.internalid.value;
                var tranId = searchResult.values.tranid;
                var customerName = searchResult.values.entity.text;
                var tranDate = searchResult.values.trandate;
                var status = searchResult.values.status.text;
                var total = searchResult.values.total;

                log.debug('map', 'Processing Invoice: ' + tranId + ' (ID: ' + invoiceId + ')');

                // Pass data to reduce stage
                context.write({
                    key: invoiceId,
                    value: {
                        invoiceId: invoiceId,
                        tranId: tranId,
                        customerName: customerName,
                        tranDate: tranDate,
                        status: status,
                        total: total
                    }
                });

            } catch (e) {
                log.error('map Error', 'Invoice ID: ' + context.key + ', Error: ' + e.toString());
            }
        }

        /**
         * Reduce Stage - Generate PDF for each invoice
         */
        function reduce(context) {
            try {
                var script = runtime.getCurrentScript();
                var invoiceData = JSON.parse(context.values[0]);
                var invoiceId = invoiceData.invoiceId;
                var tranId = invoiceData.tranId;
                var customerName = invoiceData.customerName;
                var tranDate = invoiceData.tranDate;

                log.debug('reduce', 'Generating PDF for Invoice: ' + tranId);

                // Get parameters
                var folderId = "933";
                var namingConvention = script.getParameter('custscript_naming_convention') || 'standard';

                // Load the invoice record
                var invoiceRecord = record.load({
                    type: record.Type.INVOICE,
                    id: parseInt(invoiceId)
                });

                // Render the invoice as PDF
                var pdfRenderer = render.transaction({
                    entityId: parseInt(invoiceId),
                    printMode: render.PrintMode.PDF,
                    formId: null, // Use default form, or specify custom form ID
                    inCustLocale: true
                });

                // Generate filename based on naming convention
                var filename = generateFilename(namingConvention, tranId, customerName, tranDate);

                // Create file object
                var pdfFile = file.create({
                    name: filename,
                    fileType: file.Type.PDF,
                    contents: pdfRenderer.getContents(),
                    description: 'Generated PDF for Invoice ' + tranId,
                    folder: parseInt(folderId),
                    isOnline: true
                });

                // Save the file
                var fileId = pdfFile.save();

                log.audit('reduce', 'PDF created successfully for Invoice ' + tranId + ' - File ID: ' + fileId);

                // Write summary for final stage
                context.write(invoiceId, {
                    success: true,
                    tranId: tranId,
                    fileId: fileId,
                    filename: filename,
                    customerName: customerName,
                    total: invoiceData.total
                });

            } catch (e) {
                log.error('reduce Error', 'Invoice ID: ' + context.key + ', Error: ' + e.toString());

                // Write error summary
                context.write(context.key, {
                    success: false,
                    error: e.toString(),
                    tranId: invoiceData ? invoiceData.tranId : 'Unknown'
                });
            }
        }

        /**
         * Summarize Stage - Log results and send notification
         */
        function summarize(context) {
            log.audit('summarize', 'Invoice PDF generation process completed');

            var script = runtime.getCurrentScript();
            var notifyEmail = script.getParameter('custscript_notify_email');

            var successCount = 0;
            var errorCount = 0;
            var errors = [];
            var successList = [];
            var totalAmount = 0;

            // Process map stage errors
            context.mapSummary.errors.iterator().each(function(key, error) {
                log.error('Map Error', 'Key: ' + key + ', Error: ' + error);
                errorCount++;
                errors.push('Map - Key: ' + key + ', Error: ' + error);
                return true;
            });

            // Process reduce stage errors
            context.reduceSummary.errors.iterator().each(function(key, error) {
                log.error('Reduce Error', 'Key: ' + key + ', Error: ' + error);
                errorCount++;
                errors.push('Reduce - Key: ' + key + ', Error: ' + error);
                return true;
            });

            // Process successful outputs
            context.output.iterator().each(function(key, value) {
                var result = JSON.parse(value);
                if (result.success) {
                    successCount++;
                    successList.push({
                        tranId: result.tranId,
                        filename: result.filename,
                        customer: result.customerName,
                        total: result.total || 0
                    });
                    totalAmount += parseFloat(result.total || 0);
                    log.audit('Success', 'Invoice: ' + result.tranId + ' - File: ' + result.filename);
                } else {
                    errorCount++;
                    errors.push('Invoice ' + result.tranId + ': ' + result.error);
                }
                return true;
            });

            // Final summary
            var summaryData = {
                'Total Successful': successCount,
                'Total Errors': errorCount,
                'Total Invoice Amount': totalAmount,
                'Input Summary': context.inputSummary,
                'Map Summary': context.mapSummary,
                'Reduce Summary': context.reduceSummary
            };

            log.audit('Final Summary', summaryData);

            if (errors.length > 0) {
                log.error('Error Details', errors);
            }

            // Send email notification if email is provided
            if (notifyEmail) {
                sendNotificationEmail(notifyEmail, successCount, errorCount, successList, errors, totalAmount);
            }
        }

        /**
         * Generate filename based on naming convention
         */
        function generateFilename(namingConvention, tranId, customerName, tranDate) {
            // Clean strings for filename
            var cleanCustomerName = customerName.replace(/[^a-zA-Z0-9]/g, '_');
            var cleanTranId = tranId.replace(/[^a-zA-Z0-9]/g, '_');
            var dateStr = tranDate.replace(/\//g, '-');

            switch (namingConvention) {
                case 'simple':
                    return 'Invoice_' + cleanTranId + '.pdf';
                case 'detailed':
                    return dateStr + '_Invoice_' + cleanTranId + '_' + cleanCustomerName + '.pdf';
                case 'standard':
                default:
                    return 'Invoice_' + cleanTranId + '_' + cleanCustomerName + '_' + dateStr + '.pdf';
            }
        }

        /**
         * Send notification email
         */
        function sendNotificationEmail(emailAddress, successCount, errorCount, successList, errors, totalAmount) {
            try {
                var subject = 'Invoice PDF Export Complete - ' + successCount + ' Success, ' + errorCount + ' Errors';

                var body = '<h2>Invoice PDF Export Results</h2>';
                body += '<p><strong>Summary:</strong></p>';
                body += '<ul>';
                body += '<li>Successful exports: ' + successCount + '</li>';
                body += '<li>Failed exports: ' + errorCount + '</li>';
                body += '<li>Total invoice amount: $' + totalAmount.toFixed(2) + '</li>';
                body += '</ul>';

                if (successList.length > 0) {
                    body += '<h3>Successfully Exported Invoices:</h3>';
                    body += '<table border="1" cellpadding="5" cellspacing="0">';
                    body += '<tr><th>Invoice #</th><th>Customer</th><th>Amount</th><th>Filename</th></tr>';

                    successList.forEach(function(item) {
                        body += '<tr>';
                        body += '<td>' + item.tranId + '</td>';
                        body += '<td>' + item.customer + '</td>';
                        body += '<td>$' + parseFloat(item.total || 0).toFixed(2) + '</td>';
                        body += '<td>' + item.filename + '</td>';
                        body += '</tr>';
                    });
                    body += '</table>';
                }

                if (errors.length > 0) {
                    body += '<h3>Errors:</h3>';
                    body += '<ul>';
                    errors.forEach(function(error) {
                        body += '<li>' + error + '</li>';
                    });
                    body += '</ul>';
                }

                email.send({
                    author: -5, // System user
                    recipients: emailAddress,
                    subject: subject,
                    body: body
                });

                log.audit('Email Sent', 'Notification sent to: ' + emailAddress);

            } catch (e) {
                log.error('Email Error', e.toString());
            }
        }

        return {
            getInputData: getInputData,
            map: map,
            reduce: reduce,
            summarize: summarize
        };
    });

/*
 * SCRIPT PARAMETERS TO ADD:
 *
 * 1. custscript_folder_id (Free Text) - Target folder ID
 * 2. custscript_naming_convention (List/Record) - File naming convention
 * 3. custscript_from_date (Date) - Start date filter
 * 4. custscript_to_date (Date) - End date filter
 * 5. custscript_customer_id (Free Text) - Specific customer ID
 * 6. custscript_invoice_status (Free Text) - Invoice status filter
 * 7. custscript_notify_email (Free Text) - Notification email address
 */