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
	
	function createListQuery(){
		
		log.debug("Step : ",'createListQuery entry');
    	var myPagedResults = query.runSuiteQLPaged({
    		pageSize : 1000,
    	    query : " select customer.id  as cid, customer.companyname as cname , subsidiary.id as sid , subsidiary.name as sname " +
    	    	    " from customer cross join subsidiary " +
    	    	    " where not exists (select 1 from customersubsidiaryrelationship where entity = customer.id and subsidiary = subsidiary.id) " +
    	    	    " AND (customer.isinactive = 'F') AND (subsidiary.isinactive='F') "
    	    	    });

    	log.debug("Step : ",'QLPaged');
    	
    	var retArr = [];
    	var iterator = myPagedResults.iterator();
    	
    	var limiter = 2;
    	iterator.each(function(resultPage) {
    	    var currentPage = resultPage.value;
    	    var theData = currentPage.data.asMappedResults();
    	    for (var a=0;a<theData.length;a++){
    	    	retArr.push(theData[a]);
    	    }
    	    limiter += -1;
    	    return (limiter > 0);
    	    //return true;
    	});

    	
    	return retArr;		
	}
	
	function createList(){
		var list = serverWidget.createList({
			title : "Missing Customer-Subsidiary"
		});
	    list.style = serverWidget.ListStyle.LIST;		
		list.addColumn({
			id : "cid",
			type : serverWidget.FieldType.INTEGER,
			label : "Customer ID",
			align : serverWidget.LayoutJustification.LEFT
		});		
		list.addColumn({
			id : "cname",
			type : serverWidget.FieldType.TEXT,
			label : "Customer Name",
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
			var listQuery = rsm_util.createCustomerListQuery();
			var list = createList();
			
			var results = listQuery;
			
	    	log.debug("Step : ",'list addRows');

			list.addRows({
				rows : results
			});

		    list.clientScriptModulePath = "./rsm_custsubsid_cs.js";
		    
			list.addButton({
				id : "custpage_btn_call_mr",
				label : "Start M/R (" + results.length + ")",
				functionName : "call_custsubsid_mr()"
			});
			
	    	log.debug("Step : ",'writePage(list)');
			context.response.writePage(list);

		} else {
			context.response.write("404");
		}		
	}

	return {
		onRequest : onRequest
	};

});
