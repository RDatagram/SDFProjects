define(['N/query'],

function(query) {

	function _createVendorListQuery(){
    	var myPagedResults = query.runSuiteQLPaged({
    		pageSize : 1000,
    	    query : " select vendor.id  as vid, vendor.companyname as vname , subsidiary.id as sid , subsidiary.name as sname " +
    	    	    " from vendor cross join subsidiary " +
    	    	    " where not exists (select 1 from vendorsubsidiaryrelationship where entity = vendor.id and subsidiary = subsidiary.id) " +
    	    	    " AND (vendor.isinactive = 'F') AND (subsidiary.isinactive='F') AND (subsidiary.iselimination='F') " +
    	    	    " AND ( NVL((select istaxagency from vendorcategory where id = vendor.category),'F') ='F' ) "
    	    	    });
    	
    	
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
    	});
    	
    	return retArr;		
	}
	
	function _createCustomerListQuery(){
		
    	var myPagedResults = query.runSuiteQLPaged({
    		pageSize : 1000,
    	    query : " select customer.id  as cid, customer.companyname as cname , subsidiary.id as sid , subsidiary.name as sname " +
    	    	    " from customer cross join subsidiary " +
    	    	    " where not exists (select 1 from customersubsidiaryrelationship where entity = customer.id and subsidiary = subsidiary.id) " +
    	    	    " AND (customer.isinactive = 'F') AND (subsidiary.isinactive='F') AND (subsidiary.iselimination='F') "
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
	
    return {
    	createVendorListQuery : _createVendorListQuery,
    	createCustomerListQuery : _createCustomerListQuery
    };
    
});
