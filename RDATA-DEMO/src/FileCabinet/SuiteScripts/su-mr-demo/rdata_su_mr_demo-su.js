/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/search', 'N/task', 'N/runtime'], function(ui, search, task, runtime) {

    function onRequest(context) {
        let form = ui.createForm({ title: 'Select Items to Process' });
        form.addSubmitButton({ label: 'Process Selected Items' });

        // Sublist
        let sublist = form.addSublist({
            id: 'item_sublist',
            label: 'Items',
            type: ui.SublistType.LIST
        });
        sublist.addMarkAllButtons();

        sublist.addField({
            id: 'select',
            label: 'Select',
            type: ui.FieldType.CHECKBOX
        });
        sublist.addField({
            id: 'itemid',
            label: 'Item ID',
            type: ui.FieldType.TEXT
        });
        sublist.addField({
            id: 'internalid',
            label: 'Internal ID',
            type: ui.FieldType.TEXT
        });

        // Load items
        const itemSearch = search.create({
            type: search.Type.INVENTORY_ITEM,
            columns: ['itemid', 'internalid']
        });

        let i = 0;
        itemSearch.run().each(function(result) {
            sublist.setSublistValue({ id: 'itemid', line: i, value: result.getValue('itemid') });
            sublist.setSublistValue({ id: 'internalid', line: i, value: result.getValue('internalid') });
            // Checkbox defaults to false
            sublist.setSublistValue({ id: 'select', line: i, value: 'F' });
            i++;
            return i < 100; // Limit rows for demo
        });

        // Handle POST
        if (context.request.method === 'POST') {
            const lineCount = context.request.getLineCount({ group: 'item_sublist' });
            let selectedIds = [];
            for (let j = 0; j < lineCount; j++) {
                let isChecked = context.request.getSublistValue({ group: 'item_sublist', name: 'select', line: j });
                if (isChecked === 'T') {
                    const itemId = context.request.getSublistValue({ group: 'item_sublist', name: 'internalid', line: j });
                    selectedIds.push(itemId);
                }
            }

            if (selectedIds.length > 0) {
                // Start Map/Reduce task, pass selectedIds as parameter
                const mrTask = task.create({
                    taskType: task.TaskType.MAP_REDUCE,
                    scriptId: 'customscript_your_mapreduce_script',      // Change to your Map/Reduce script ID
                    deploymentId: 'customdeploy_your_mapreduce_deploy', // Change to your deployment ID
                    params: {
                        custscript_selected_ids: JSON.stringify(selectedIds)
                    }
                });
                const taskId = mrTask.submit();
                form.addField({
                    id: 'custpage_taskid',
                    label: 'Map/Reduce Task Submitted',
                    type: ui.FieldType.TEXT
                }).defaultValue = taskId;
            } else {
                form.addField({
                    id: 'custpage_noselection',
                    label: 'No Items Selected',
                    type: ui.FieldType.TEXT
                }).defaultValue = 'Please select items.';
            }
        }

        context.response.writePage(form);
    }

    return { onRequest: onRequest };
});