/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/url', 'N/currentRecord'], function(url, currentRecord) {

    let autoRefreshInterval = null;

    function pageInit(context) {
        console.log('MapReduce Status Monitor loaded');

        // Add auto-refresh controls
        addAutoRefreshControls();

        // Add last updated timestamp
        addLastUpdatedTimestamp();
    }

    function addAutoRefreshControls() {
        try {
            // Create auto-refresh container
            const container = document.createElement('div');
            container.style.cssText = `
                position: fixed;
                top: 10px;
                right: 10px;
                background: #f8f9fa;
                border: 1px solid #dee2e6;
                border-radius: 4px;
                padding: 10px;
                z-index: 1000;
                font-size: 12px;
            `;

            // Auto-refresh toggle
            const refreshToggle = document.createElement('input');
            refreshToggle.type = 'checkbox';
            refreshToggle.id = 'auto_refresh_toggle';
            refreshToggle.onchange = toggleAutoRefresh;

            const refreshLabel = document.createElement('label');
            refreshLabel.htmlFor = 'auto_refresh_toggle';
            refreshLabel.textContent = ' Auto-refresh (30s)';
            refreshLabel.style.marginLeft = '5px';

            // Manual refresh button
            const manualRefreshBtn = document.createElement('button');
            manualRefreshBtn.textContent = 'Refresh Now';
            manualRefreshBtn.onclick = manualRefresh;
            manualRefreshBtn.style.cssText = `
                margin-left: 10px;
                padding: 2px 6px;
                font-size: 11px;
            `;

            // Status indicator
            const statusIndicator = document.createElement('div');
            statusIndicator.id = 'refresh_status';
            statusIndicator.style.cssText = `
                margin-top: 5px;
                font-size: 10px;
                color: #6c757d;
            `;

            container.appendChild(refreshToggle);
            container.appendChild(refreshLabel);
            container.appendChild(manualRefreshBtn);
            container.appendChild(statusIndicator);

            document.body.appendChild(container);

        } catch (e) {
            console.error('Error adding auto-refresh controls:', e);
        }
    }

    function addLastUpdatedTimestamp() {
        try {
            const timestamp = document.createElement('div');
            timestamp.id = 'last_updated';
            timestamp.style.cssText = `
                text-align: right;
                font-size: 11px;
                color: #6c757d;
                margin-bottom: 10px;
            `;
            timestamp.textContent = 'Last updated: ' + new Date().toLocaleString();

            const form = document.querySelector('form');
            if (form) {
                form.insertBefore(timestamp, form.firstChild);
            }
        } catch (e) {
            console.error('Error adding timestamp:', e);
        }
    }

    function toggleAutoRefresh() {
        const toggle = document.getElementById('auto_refresh_toggle');
        const statusDiv = document.getElementById('refresh_status');

        if (toggle.checked) {
            startAutoRefresh();
            statusDiv.textContent = 'Auto-refresh enabled';
            statusDiv.style.color = '#28a745';
        } else {
            stopAutoRefresh();
            statusDiv.textContent = 'Auto-refresh disabled';
            statusDiv.style.color = '#6c757d';
        }
    }

    function startAutoRefresh() {
        // Clear any existing interval
        if (autoRefreshInterval) {
            clearInterval(autoRefreshInterval);
        }

        // Start new interval (30 seconds)
        autoRefreshInterval = setInterval(function() {
            updateRefreshStatus('Refreshing...');
            window.location.reload();
        }, 30000);

        console.log('Auto-refresh started (30 second intervals)');
    }

    function stopAutoRefresh() {
        if (autoRefreshInterval) {
            clearInterval(autoRefreshInterval);
            autoRefreshInterval = null;
        }
        console.log('Auto-refresh stopped');
    }

    function manualRefresh() {
        updateRefreshStatus('Refreshing...');
        window.location.reload();
    }

    function updateRefreshStatus(message) {
        const statusDiv = document.getElementById('refresh_status');
        if (statusDiv) {
            statusDiv.textContent = message;
            statusDiv.style.color = '#007bff';
        }
    }

    function fieldChanged(context) {
        // Handle field changes if needed
        const fieldId = context.fieldId;
        const currentRec = context.currentRecord;

        if (fieldId === 'script_selector') {
            // Could add validation or formatting here
            console.log('Script selector changed');
        }
    }

    function sublistChanged(context) {
        // Handle sublist changes if needed
        console.log('Sublist changed:', context);
    }

    // Cleanup when leaving the page
    function saveRecord(context) {
        stopAutoRefresh();
        return true;
    }

    // Add keyboard shortcuts
    document.addEventListener('keydown', function(event) {
        // Ctrl+R or F5 for manual refresh
        if ((event.ctrlKey && event.key === 'r') || event.key === 'F5') {
            event.preventDefault();
            manualRefresh();
            return false;
        }

        // Ctrl+A for auto-refresh toggle
        if (event.ctrlKey && event.key === 'a') {
            event.preventDefault();
            const toggle = document.getElementById('auto_refresh_toggle');
            if (toggle) {
                toggle.checked = !toggle.checked;
                toggleAutoRefresh();
            }
            return false;
        }
    });

    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged,
        sublistChanged: sublistChanged,
        saveRecord: saveRecord
    };
});