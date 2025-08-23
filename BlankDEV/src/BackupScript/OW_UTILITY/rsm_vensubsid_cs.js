/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/ui/message', 'N/url', 'N/https'],
/**
 * Imported
 */
function(message, url, https) {
    
    function pageInit(scriptContext) {
    	console.log("pageInit");
    }

    function _call_vensubsid_mr(){

		var restUrl = url.resolveScript({
			scriptId : 'customscript_rsm_vensubsid_rl', // RESTlet scriptId
			deploymentId : 'customdeploy_rsm_vensubsid_rl' // RESTlet deploymentId
		});

		// Generate request headers
		var headers = new Array();
		headers['Content-type'] = 'application/json';

		// Perform HTTP POST call
		var restReq = https.post({
			url : restUrl,
			headers : headers,
			body : {
				"action" : "call"
			}
		});
		var jsRes = JSON.parse(restReq.body);
		
    	var myMsg = message.create({
			title : "Action",
			message : "MapReduce script started...",
			type : message.Type.CONFIRMATION
		});
		// will disappear after 5s
		myMsg.show({
			duration : 5000
		});

		//window.location.reload(true);
    	
    }

    return {
        pageInit: pageInit,
        call_vensubsid_mr : _call_vensubsid_mr
    };
    
});
