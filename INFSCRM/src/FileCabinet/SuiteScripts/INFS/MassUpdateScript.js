/**
 * @NApiVersion 2.x
 * @NScriptType MassUpdateScript
 * @NModuleScope SameAccount
 */
define(['N/record'],

function(record) {
    
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

    	record.submitFields({
    		type : params.type,
    		id : params.id,
    		values : {'startdate' : '01.01.2020'}
    	});
    	
    }

    return {
        each: each
    };
    
});
