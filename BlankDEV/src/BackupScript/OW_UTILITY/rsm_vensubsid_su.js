/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define([ "N/ui/serverWidget", "N/query","./rsm_util" ],

function(serverWidget, query, rsm_util) {

	/**
	 * Definition of the Suitelet script trigger point.
	 * 
	 * @param {Object}
	 *            context
	 * @param {ServerRequest}
	 *            context.request - Encapsulation of the incoming request
	 * @param {ServerResponse}
	 *            context.response - Encapsulation of the Suitelet response
	 * @Since 2015.2
	 */
	
	
	function createList(){
		var list = serverWidget.createList({
			title : "Missing vendor-Subsidiary"
		});
	    list.style = serverWidget.ListStyle.LIST;		
		list.addColumn({
			id : "vid",
			type : serverWidget.FieldType.INTEGER,
			label : "Vendor ID",
			align : serverWidget.LayoutJustification.LEFT
		});		
		list.addColumn({
			id : "vname",
			type : serverWidget.FieldType.TEXT,
			label : "Vendor Name",
			align : serverWidget.LayoutJustification.LEFT
		});
		list.addColumn({
			id : "sid",
			type : serverWidget.FieldType.INTEGER,
			label : "Subsidiary ID",
			align : serverWidget.LayoutJustification.LEFT
		});		
		list.addColumn({
			id : "sname",
			type : serverWidget.FieldType.TEXT,
			label : "Subsidiary Name",
			align : serverWidget.LayoutJustification.LEFT
		});		
	
		return list;
	}
	
	function onRequest(context) {
		
		if (context.request.method === "GET") {
//			var listQuery = createListQuery();
			var listQuery = rsm_util.createVendorListQuery();

			var list = createList();
			var results = listQuery;
			list.addRows({
				rows : results
			});

		    list.clientScriptModulePath = "./rsm_vensubsid_cs.js";
		    
			list.addButton({
				id : "custpage_btn_call_mr",
				label : "Start M/R (" + results.length + ")",
				functionName : "call_vensubsid_mr()"
			});
			
			context.response.writePage(list);

		} else {
			context.response.write("404");
		}		
	}

	return {
		onRequest : onRequest
	};

});
