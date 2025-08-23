/**
 * @NApiVersion 2.0
 * @NScriptType MassUpdateScript
 * @NModuleScope SameAccount
 */
define([ "N/record" ],

function(record) {

	/**
	 * Definition of Mass Update trigger point.
	 * 
	 * @param {Object}
	 *            params
	 * @param {string}
	 *            params.type - Record type of the record being processed by the
	 *            mass update
	 * @param {number}
	 *            params.id - ID of the record being processed by the mass
	 *            update
	 * 
	 * @since 2016.1
	 */
	function each(params) {
		record["delete"]({
			type : params.type,
			id : params.id
		})

		/* CUVAJ ZA MARJANA AKO OPET ZATREBA
		var rec = record.load({
			type : 'account',
			id : params.id,
			isDynamic : true
		});
		var nl = rec.getLineCount({
			sublistId : 'localizations'
		});
		if (nl > 0) {
			rec.removeLine({
				sublistId : 'localizations',
				line : 0
			});

			rec.save();
		}
		*/

	}

	return {
		each : each
	};

});

/*
 * TEMP SAVE -
 */
