/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/ui/serverWidget', 'N/search', 'N/task', 'N/log', 'N/url', 'N/runtime'],
    function(ui, search, task, log, url, runtime) {

        function onRequest(context) {
            const request = context.request;
            const response = context.response;

            if (request.method === 'GET') {
                const action = request.parameters.action || 'list';

                switch (action) {
                    case 'refresh':
                        handleRefresh(request, response);
                        break;
                    case 'details':
                        handleDetails(request, response);
                        break;
                    case 'api':
                        handleApiRequest(request, response);
                        break;
                    default:
                        showStatusList(request, response);
                }
            } else if (request.method === 'POST') {
                handlePostRequest(request, response);
            }
        }

        function showStatusList(request, response) {
            const scriptId = request.parameters.scriptid || 'customscript_rdata_export_invoices';
            const form = createStatusForm(scriptId);

            try {
                // Get MapReduce executions
                const executions = getMapReduceExecutions(scriptId);
                addExecutionsToForm(form, executions, scriptId);

            } catch (e) {
                log.error('Error loading executions', e.message);
                form.addField({
                    id: 'error_message',
                    type: ui.FieldType.LONGTEXT,
                    label: 'Error'
                }).defaultValue = 'Error loading MapReduce executions: ' + e.message;
            }

            response.writePage(form);
        }

        function createStatusForm(scriptId) {
            const form = ui.createForm({
                title: 'MapReduce Status Monitor'
            });

            // Add script selection field
            const scriptField = form.addField({
                id: 'script_selector',
                type: ui.FieldType.TEXT,
                label: 'MapReduce Script ID'
            });
            scriptField.defaultValue = scriptId;

            // Add refresh button
            form.addSubmitButton({
                label: 'Refresh Status'
            });

            // Add client script for auto-refresh and interactions
            form.clientScriptModulePath = './rdata_export_inv_cs.js';

            return form;
        }

        function getMapReduceExecutions(scriptId) {
            const executions = [];

            try {
                // Search for scheduled script instances (executions)
                const executionSearch = search.create({
                    type: 'scheduledscriptinstance',
                    filters: [
                        ['script.scriptid', 'is', scriptId],
                        'AND',
                        ['status', 'anyof', ['COMPLETE', 'FAILED', 'PROCESSING', 'PENDING', 'RETRY']]
                    ],
                    columns: [
                        'script.scriptid',
                        //'deployment',
                        'status',
                        'startdate',
                        'enddate',
                        'mapreducestage',
                        'percentcomplete',
                        //'message'
                    ]
                });

                executionSearch.run().each(function(result) {
                    const execution = {
                        scriptId: result.getValue({ name: 'scriptid' , join: 'script'}),
                        deploymentId: result.getValue({ name: 'deployment' }),
                        status: result.getValue({ name: 'status' }),
                        startDate: result.getValue({ name: 'startdate' }),
                        endDate: result.getValue({ name: 'enddate' }),
                        stage: result.getValue({ name: 'mapreducestage' }),
                        percentComplete: result.getValue({ name: 'percentcomplete' }) || '0',
                        message: result.getValue({ name: 'message' }) || ''
                    };

                    // Try to get more detailed status using task.checkStatus if available
                    try {
                        const taskStatus = task.checkStatus({ taskId: result.id });
                        if (taskStatus) {
                            execution.detailedStatus = taskStatus;
                        }
                    } catch (e) {
                        // Task might not be available for status check
                        log.debug('Could not get detailed status for task', result.id);
                    }

                    executions.push(execution);
                    return true;
                });

            } catch (e) {
                log.error('Search error', e.message);
                throw e;
            }

            return executions;
        }

        function addExecutionsToForm(form, executions, scriptId) {
            if (executions.length === 0) {
                form.addField({
                    id: 'no_executions',
                    type: ui.FieldType.LONGTEXT,
                    label: 'Status'
                }).defaultValue = 'No recent executions found for script: ' + scriptId;
                return;
            }

            // Create sublist for executions
            const sublist = form.addSublist({
                id: 'executions',
                type: ui.SublistType.LIST,
                label: 'MapReduce Executions (' + executions.length + ' found)'
            });

            // Add columns
            sublist.addField({
                id: 'execution_id',
                type: ui.FieldType.TEXT,
                label: 'Execution ID'
            });

            sublist.addField({
                id: 'status',
                type: ui.FieldType.TEXT,
                label: 'Status'
            });

            sublist.addField({
                id: 'stage',
                type: ui.FieldType.TEXT,
                label: 'Stage'
            });

            sublist.addField({
                id: 'progress',
                type: ui.FieldType.TEXT,
                label: 'Progress %'
            });

            sublist.addField({
                id: 'start_date',
                type: ui.FieldType.TEXT,
                label: 'Start Date'
            });

            sublist.addField({
                id: 'end_date',
                type: ui.FieldType.TEXT,
                label: 'End Date'
            });

            // Populate sublist
            executions.forEach(function(execution, index) {
                sublist.setSublistValue({
                    id: 'execution_id',
                    line: index,
                    value: execution.scriptId || 'N/A'
                });

                sublist.setSublistValue({
                    id: 'status',
                    line: index,
                    value: getStatusDisplay(execution.status) || 'N/A'
                });

                sublist.setSublistValue({
                    id: 'stage',
                    line: index,
                    value: execution.stage || 'N/A'
                });

                sublist.setSublistValue({
                    id: 'progress',
                    line: index,
                    value: execution.percentComplete + '%' || 'N/A'
                });

                if (execution.startDate) {
                    sublist.setSublistValue({
                        id: 'start_date',
                        line: index,
                        value: execution.startDate || 'N/A'
                    });
                }

                if (execution.endDate) {
                    sublist.setSublistValue({
                        id: 'end_date',
                        line: index,
                        value: execution.endDate || 'N/A'
                    });

                }

            });

            // Add summary information
            const summary = createExecutionSummary(executions);
            const summaryField = form.addField({
                id: 'summary',
                type: ui.FieldType.LONGTEXT,
                label: 'Summary'
            });
            summaryField.defaultValue = summary;
            summaryField.updateDisplayType({
                displayType: ui.FieldDisplayType.READONLY
            });
        }

        function handleDetails(request, response) {
            const executionId = request.parameters.executionid;
            const scriptId = request.parameters.scriptid;

            if (!executionId) {
                response.write('Execution ID is required');
                return;
            }

            try {
                // Get detailed execution information
                const details = getExecutionDetails(executionId);
                const form = createDetailsForm(details, scriptId);
                response.writePage(form);

            } catch (e) {
                log.error('Error loading execution details', e.message);
                response.write('Error loading execution details: ' + e.message);
            }
        }

        function getExecutionDetails(executionId) {
            // Try to get task status first
            let taskStatus = null;
            try {
                taskStatus = task.checkStatus({ taskId: executionId });
            } catch (e) {
                log.debug('Could not get task status', e.message);
            }

            // Get execution record details
            const executionSearch = search.lookupFields({
                type: 'scheduledscriptinstance',
                id: executionId,
                columns: [
                    'script', 'deployment', 'status', 'startdate', 'enddate',
                    'mapreducestage', 'percentcomplete', 'message', 'notes'
                ]
            });

            return {
                id: executionId,
                taskStatus: taskStatus,
                executionRecord: executionSearch
            };
        }

        function createDetailsForm(details, scriptId) {
            const form = ui.createForm({
                title: 'MapReduce Execution Details - ' + details.id
            });

            // Basic information
            form.addField({
                id: 'execution_id',
                type: ui.FieldType.TEXT,
                label: 'Execution ID'
            }).defaultValue = details.id;

            if (details.taskStatus) {
                form.addField({
                    id: 'task_status',
                    type: ui.FieldType.TEXT,
                    label: 'Current Status'
                }).defaultValue = details.taskStatus.status;

                form.addField({
                    id: 'task_stage',
                    type: ui.FieldType.TEXT,
                    label: 'Current Stage'
                }).defaultValue = details.taskStatus.stage || 'N/A';

                form.addField({
                    id: 'task_progress',
                    type: ui.FieldType.TEXT,
                    label: 'Progress'
                }).defaultValue = (details.taskStatus.percentComplete || 0) + '%';
            }

            // Execution record information
            if (details.executionRecord) {
                const record = details.executionRecord;

                form.addField({
                    id: 'record_status',
                    type: ui.FieldType.TEXT,
                    label: 'Record Status'
                }).defaultValue = getStatusDisplay(record.status[0].text);

                if (record.startdate) {
                    form.addField({
                        id: 'start_date',
                        type: ui.FieldType.DATETIMETZ,
                        label: 'Start Date'
                    }).defaultValue = new Date(record.startdate);
                }

                if (record.enddate) {
                    form.addField({
                        id: 'end_date',
                        type: ui.FieldType.DATETIMETZ,
                        label: 'End Date'
                    }).defaultValue = new Date(record.enddate);
                }

                if (record.message) {
                    form.addField({
                        id: 'message',
                        type: ui.FieldType.LONGTEXT,
                        label: 'Message'
                    }).defaultValue = record.message;
                }
            }

            // Back to list button
            const backUrl = url.resolveScript({
                scriptId: runtime.getCurrentScript().id,
                deploymentId: runtime.getCurrentScript().deploymentId,
                params: { scriptid: scriptId }
            });

            form.addField({
                id: 'back_link',
                type: ui.FieldType.URL,
                label: 'Back to List'
            }).defaultValue = backUrl;

            return form;
        }

        function handleApiRequest(request, response) {
            const scriptId = request.parameters.scriptid;
            const executionId = request.parameters.executionid;

            response.setHeader({
                name: 'Content-Type',
                value: 'application/json'
            });

            try {
                if (executionId) {
                    // Get specific execution details
                    const details = getExecutionDetails(executionId);
                    response.write({
                        output: JSON.stringify({
                            success: true,
                            data: details
                        })
                    });
                } else if (scriptId) {
                    // Get all executions for script
                    const executions = getMapReduceExecutions(scriptId);
                    response.write({
                        output: JSON.stringify({
                            success: true,
                            data: executions,
                            summary: createExecutionSummary(executions)
                        })
                    });
                } else {
                    response.write({
                        output: JSON.stringify({
                            success: false,
                            error: 'Script ID is required'
                        })
                    });
                }
            } catch (e) {
                response.write({
                    output: JSON.stringify({
                        success: false,
                        error: e.message
                    })
                });
            }
        }

        function handlePostRequest(request, response) {
            const scriptId = request.parameters.script_selector;

            // Redirect to GET with the new script ID
            const redirectUrl = url.resolveScript({
                scriptId: runtime.getCurrentScript().id,
                deploymentId: runtime.getCurrentScript().deploymentId,
                params: { scriptid: scriptId }
            });

            response.sendRedirect({
                type: 'SUITELET',
                identifier: redirectUrl
            });
        }

        // Helper functions
        function getStatusDisplay(status) {
            const statusMap = {
                'Complete': '✅ Complete',
                'Failed': '❌ Failed',
                'Processing': '🔄 Processing',
                'Pending': '⏳ Pending',
                'Retry': '🔄 Retrying'
            };

            return statusMap[status] || status;
        }

        function calculateDuration(startDate, endDate) {
            if (!startDate || !endDate) return 'N/A';

            const start = new Date(startDate);
            const end = new Date(endDate);
            const diffMs = end - start;

            const diffMins = Math.floor(diffMs / 60000);
            const diffSecs = Math.floor((diffMs % 60000) / 1000);

            if (diffMins > 0) {
                return diffMins + 'm ' + diffSecs + 's';
            } else {
                return diffSecs + 's';
            }
        }

        function createExecutionSummary(executions) {
            const summary = {
                total: executions.length,
                complete: 0,
                failed: 0,
                processing: 0,
                pending: 0,
                retry: 0
            };

            executions.forEach(function(execution) {
                switch (execution.status) {
                    case 'Complete':
                        summary.complete++;
                        break;
                    case 'Failed':
                        summary.failed++;
                        break;
                    case 'Processing':
                        summary.processing++;
                        break;
                    case 'Pending':
                        summary.pending++;
                        break;
                    case 'Retry':
                        summary.retry++;
                        break;
                }
            });

            const summaryLines = [
                'Total Executions: ' + summary.total,
                'Complete: ' + summary.complete,
                'Failed: ' + summary.failed,
                'Processing: ' + summary.processing,
                'Pending: ' + summary.pending,
                'Retrying: ' + summary.retry
            ];

            return summaryLines.join('\n');
        }

        return {
            onRequest: onRequest
        };
    });