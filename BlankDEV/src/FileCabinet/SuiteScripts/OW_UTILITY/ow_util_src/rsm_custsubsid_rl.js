/**
 * @NApiVersion 2.0
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 */
define([ 'N/task' ],
/**
 * @param {task}
 *            task
 */
function(task) {

	function doPost(requestBody) {
		var mrTask = task.create({
			taskType : task.TaskType.MAP_REDUCE
		});
		mrTask.scriptId = 'customscript_rsm_customer_subsid_mr';
		mrTask.deploymentId = 'customdeploy_rsm_customer_subsid_mr';
		var mrTaskId = mrTask.submit();

		var resultObj = {
			"mrTaskId" : mrTaskId
		};
		return resultObj;
	}

	return {
		post : doPost
	};

});
