/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 */
define(['N/task','N/record'],

function(task, record) {

    	function doPost(requestBody) {
    		
    		log.debug("Step : ","RestLet Post");    		
			var cId = requestBody.idBstmt;
			var resultObj = {};
			

    		if (requestBody.action == 'parser') {
				var mrTask = task.create({
					taskType : task.TaskType.MAP_REDUCE,
					params : {"custscript_rsm_bstmt_mr_param1" : cId}
				});
				mrTask.scriptId = 'customscript_rsm_bstmt_parser_mr';
				//mrTask.deploymentId = 'customdeploy_rsm_bstmt_parser_mr';
				var mrTaskId = mrTask.submit();
				
				record.submitFields({
					type : 'customrecord_snt_bank_statement',
					id : cId,
					values : {'custrecord_rsm_bstmt_parser_mr' : mrTaskId}
				});
				
				resultObj = {
					"mrTaskId" : mrTaskId
				};
			}

    		if (requestBody.action == 'lookup') {
				var mrTask = task.create({
					taskType : task.TaskType.MAP_REDUCE,
					params : {"custscript_rsm_bstmt_mr_param2" : cId}
				});
				mrTask.scriptId = 'customscript_rsm_bstmt_lookup_mr';
				//mrTask.deploymentId = 'customdeploy_rsm_bstmt_lookup_mr';
				var mrTaskId = mrTask.submit();
				
				record.submitFields({
					type : 'customrecord_snt_bank_statement',
					id : cId,
					values : {'custrecord_rsm_bstmt_parser_mr' : mrTaskId}
				});
				
				resultObj = {
					"mrTaskId" : mrTaskId
				};
			}
    		
    		if (requestBody.action == 'payments') {
				var mrTask = task.create({
					taskType : task.TaskType.MAP_REDUCE,
					params : {"custscript_rsm_bstmt_payments_id" : cId}
				});
				mrTask.scriptId = 'customscript_rsm_bstmt_payments_mr';
				//mrTask.deploymentId = 'customdeploy_rsm_bstmt_parser_mr';
				var mrTaskId = mrTask.submit();
				
				record.submitFields({
					type : 'customrecord_snt_bank_statement',
					id : cId,
					values : {'custrecord_rsm_bstmt_payment_mr' : mrTaskId}
				});

				resultObj = {
					"mrTaskId" : mrTaskId
				};
			}
    		
    		if (requestBody.action == 'rollback') {
				var mrTask = task.create({
					taskType : task.TaskType.MAP_REDUCE,
					params : {"custscript_rsm_bstmt_rollback_id" : cId}
				});
				mrTask.scriptId = 'customscript_rsm_bstmt_rollback_mr';
				//mrTask.deploymentId = 'customdeploy_rsm_bstmt_parser_mr';
				var mrTaskId = mrTask.submit();
				
				record.submitFields({
					type : 'customrecord_snt_bank_statement',
					id : cId,
					values : {'custrecord_rsm_bstmt_payment_mr' : mrTaskId}
				});

				resultObj = {
					"mrTaskId" : mrTaskId
				};
			}    		
			return resultObj;
    		
    	}

    	return {
    		post : doPost
    	};

});
