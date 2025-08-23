/**
 * @NApiVersion 2.0
 * @NScriptType MassUpdateScript
 * @NModuleScope SameAccount
 */

/**
 * customersubsidiaryrelationship - link between customer and subsidiary
 * subsidiary - list of subsidiaries
 */
define(["N/search", "N/record"],

		
function(search,record) {
    
    /**
     * Definition of Mass Update trigger point.
     *
     * @param {Object} params
     * @param {string} params.type - Record type of the record being processed by the mass update
     * @param {number} params.id - ID of the record being processed by the mass update
     *
     * @since 2016.1
     */
    function each(params) {
    	
    	var subSidsrch = search.create({
    		type : "subsidiary",
    		columns : [ search.createColumn({
				name : "name",
				label : "Name"
			}) ]
    	});
    	
    	subSidsrch.run().each(function(result) {
			// .run().each has a limit of 4,000 results
    		var newRec = record.create({
    			type : "customersubsidiaryrelationship" 
    		});
    		
    		log.debug("Entity", params.id);
    		log.debug("Subsidiary", result.id);
    		
    		newRec.setValue("subsidiary",result.id);
    		newRec.setValue("entity",params.id);
    		
    		try{
    			newRec.save();
    		} catch(e) {
    			log.error("Error",params.id);
    		}
    		
			return true;
		});
    	
    	log.debug("Step 0","function_each");
    }

    return {
        each: each
    };
    
});
/*
select customer.id  as cid, subsidiary.id as sid
    	    	from customer cross join subsidiary 
    	    	where not exists (select 1 from customersubsidiaryrelationship where entity = customer.id and subsidiary = subsidiary.id) 
 */
