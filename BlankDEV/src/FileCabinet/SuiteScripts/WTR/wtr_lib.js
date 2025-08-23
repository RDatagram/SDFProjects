define([ 'N/record', 'N/search' ],
/**
 * @param {record}
 *            record
 * @param {search}
 *            search
 * 
 */
function(record, search) {

	function _getTaxRate(idTaxCode) {

		var vReturn;
		var srch = search.create({
			"type" : 'salestaxitem',
			columns : [ 'rate' ],
			filters : [ search.createFilter({
				name : 'internalid',
				operator : search.Operator.IS,
				values : idTaxCode
			}) ]
		});

		vReturn = 0;

		srch.run().each(function(rowData) {
			var ad = rowData.getAllValues();
			vReturn = parseFloat(ad['rate']);
			return false;
		});

		return vReturn;
	}
	/**
	 * Delete Inventory Adjustments
	 * 
	 * @param {string}
	 *            eId
	 */
	function _deleteOldIA(eId) {

		/** @type {search} s1 */
		var s1;

		var s1 = search.load({
			id : 'customsearch_snt_ia_wtr'
		});

		s1.filters.push(search.createFilter({
			name : 'externalid',
			operator : search.Operator.IS,
			values : eId
		}));

		var result = s1.run().getRange({
			start : 0,
			end : 1
		});

		if (result.length == 1) {
			record['delete']({
				type : record.Type.INVENTORY_ADJUSTMENT,
				id : result[0].id
			});
		}
	}

	function _deleteOldJE(eId) {

		var s2 = search.create({
			"type" : record.Type.JOURNAL_ENTRY,
			"columns" : [ 'externalid' ],
			filters : [ 'externalid', 'anyof', eId ]
		});

		var result = s2.run().getRange({
			start : 0,
			end : 1
		});
		if (result.length == 1) {
			record['delete']({
				type : record.Type.JOURNAL_ENTRY,
				id : result[0].id
			});
		}
	}

	function _deleteRetailInventoryTrans(wtrId) {
		var srch = search.create({
			type : 'customrecord_snt_retail_inv_trans',
			columns : [ search.createColumn({
				name : "custrecord_snt_rti_wtr_id",
				label : "HeaderID"
			}) ]
		});

		srch.filters.push(search.createFilter({
			name : 'custrecord_snt_rti_wtr_id',
			operator : search.Operator.IS,
			values : wtrId
		}));

		srch.run().each(function(rowData) {
			record['delete']({
				type : 'customrecord_snt_retail_inv_trans',
				id : rowData.id
			});
			return true;
		});
	}

	function _addRetailInventoryTransaction(vSlog) {
		var newRecord = record.create({
			type : 'customrecord_snt_retail_inv_trans'
		});

		newRecord.setValue('custrecord_snt_rit_location',
				vSlog['custrecord_snt_rit_location']);
		newRecord.setValue('custrecord_snt_rti_item',
				vSlog['custrecord_snt_rti_item']);
		newRecord.setValue('custrecord_snt_rti_wtr_id',
				vSlog['custrecord_snt_rti_wtr_id']);
		newRecord.setValue('custrecord_snt_rti_qty_in',
				vSlog['custrecord_snt_rti_qty_in']);
		newRecord.setValue('custrecord_snt_rti_qty_out',
				vSlog['custrecord_snt_rti_qty_out']);
		newRecord.save();
	}

	function _wtrOptions(rWtr, wtrId) {

		var options = {
			'wtrId' : wtrId,
			'subsidiary' : rWtr.getValue('custrecord_wtr_header_subsidiary'),
			'idAccPrelazni' : 1343,
			'idAccRuc' : 1331,
			'idAccPDV' : 1330,
			'idAccMPV' : 1328,
			'IAWexternalId' : 'IAW-' + rWtr.getValue('name'),
			'IARexternalId' : 'IAR-' + rWtr.getValue('name'),
			'JEexternalId' : 'JE-' + rWtr.getValue('name'),
			'trandate' : rWtr
					.getValue('custrecord_snt_wtr_header_date_of_trans'),
			'fromLocation' : rWtr
					.getValue('custrecord_snt_wtr_header_from_loc'),
			'toLocation' : rWtr.getValue('custrecord_snt_wtr_header_to_loc')
		}

		return options;
	}

	/**
	 * Kreiranje dokumenata - Inventory Adjustment iz veleprodaje - Retail
	 * Transactions za maloprodaju
	 */

	function _createIAW(rWtr, options) {

		var iaRec = record.create({
			type : record.Type.INVENTORY_ADJUSTMENT,
			isDynamic : true
		});
		iaRec.setValue('subsidiary', options.subsidiary);
		iaRec.setValue('account', options.idAccPrelazni);
		iaRec.setValue('externalid', options.IAWexternalId);
		iaRec.setValue('trandate', options.trandate);

		var counter = rWtr.getLineCount({
			sublistId : 'recmachcustrecord_snt_wtr_line_header_id'
		});

		for (var i = 0; i < counter; i++) {
			var vItem = rWtr.getSublistValue({
				sublistId : 'recmachcustrecord_snt_wtr_line_header_id',
				fieldId : 'custrecord_snt_wtr_line_item',
				line : i
			});
			var vQty = rWtr.getSublistValue({
				sublistId : 'recmachcustrecord_snt_wtr_line_header_id',
				fieldId : 'custrecord_snt_wtr_line_quantuty',
				line : i
			});
			// log.debug('vItem', vItem);
			iaRec.selectNewLine({
				sublistId : 'inventory'
			});
			iaRec.setCurrentSublistValue({
				sublistId : 'inventory',
				fieldId : 'item',
				value : vItem
			});
			iaRec.setCurrentSublistValue({
				sublistId : 'inventory',
				fieldId : 'location',
				value : options.fromLocation
			});
			iaRec.setCurrentSublistValue({
				sublistId : 'inventory',
				fieldId : 'adjustqtyby',
				value : -vQty
			});
			iaRec.commitLine({
				sublistId : 'inventory'
			});

			var vSlog = {
				'custrecord_snt_rit_location' : options.toLocation,
				'custrecord_snt_rti_item' : vItem,
				'custrecord_snt_rti_wtr_id' : options.wtrId,
				'custrecord_snt_rti_qty_in' : vQty,
				'custrecord_snt_rti_qty_out' : 0
			}

			// wtrLib.addRetailInventoryTransaction(vSlog);
			_addRetailInventoryTransaction(vSlog);
		}
		return iaRec.save();
	}

	/**
	 * Kreiranje Journal Entry
	 */

	function _createJE(rWtr, options, accValues) {

		var iaRec = record.create({
			type : record.Type.JOURNAL_ENTRY,
			isDynamic : true
		});
		iaRec.setValue('externalid', options.JEexternalId);
		iaRec.setValue('trandate', options.trandate);
		iaRec.setValue('custbody_popdv_datum', options.trandate);
		iaRec.setValue('subsidiary', options.subsidiary);

		// Zaduzenje maloprodaje
		iaRec.selectNewLine({
			sublistId : 'line'
		});
		iaRec.setCurrentSublistValue({
			sublistId : 'line',
			fieldId : 'account',
			value : options.idAccMPV
		});
		iaRec.setCurrentSublistValue({
			sublistId : 'line',
			fieldId : 'debit',
			value : accValues.accMPV
		});
		iaRec.commitLine({
			sublistId : 'line'
		});

		// Ukalkulisani RUC
		iaRec.selectNewLine({
			sublistId : 'line'
		});
		iaRec.setCurrentSublistValue({
			sublistId : 'line',
			fieldId : 'account',
			value : options.idAccRuc
		});
		iaRec.setCurrentSublistValue({
			sublistId : 'line',
			fieldId : 'credit',
			value : accValues.accRUC
		});
		iaRec.commitLine({
			sublistId : 'line'
		});

		// Ukalkulisani PDV
		iaRec.selectNewLine({
			sublistId : 'line'
		});
		iaRec.setCurrentSublistValue({
			sublistId : 'line',
			fieldId : 'account',
			value : options.idAccPDV
		});
		iaRec.setCurrentSublistValue({
			sublistId : 'line',
			fieldId : 'credit',
			value : accValues.accPDV
		});
		iaRec.commitLine({
			sublistId : 'line'
		});

		// Prelazni
		iaRec.selectNewLine({
			sublistId : 'line'
		});
		iaRec.setCurrentSublistValue({
			sublistId : 'line',
			fieldId : 'account',
			value : options.idAccPrelazni
		});
		iaRec.setCurrentSublistValue({
			sublistId : 'line',
			fieldId : 'credit',
			value : accValues.accPrelazni
		});
		iaRec.commitLine({
			sublistId : 'line'
		});

		return iaRec.save();

	}

	function _calcAccValues(rWtr, wtrId, options) {

		var iarRetail = 0.00;
		var vRuc = 0.00;
		var iarTax = 0.00;
		var iawValue = 0.00;

		var srch = search.create({
			type : 'customrecord_snt_wtr_line',
			columns : [ search.createColumn({
				name : "custrecord_snt_wtr_line_header_id",
				summary : "GROUP",
				label : "HeaderID"
			}), search.createColumn({
				name : "custrecord_snt_wtr_line_ws_value",
				summary : "SUM",
				label : "SumWS"
			}), search.createColumn({
				name : "custrecord_snt_wtr_line_tax_amount",
				summary : "SUM",
				label : "SumTax"
			}), search.createColumn({
				name : "custrecord_snt_wtr_line_retail_value",
				summary : "SUM",
				label : "SumRetail"
			})

			]
		});

		srch.filters.push(search.createFilter({
			name : 'custrecord_snt_wtr_line_header_id',
			operator : search.Operator.IS,
			values : wtrId
		}));

		var result = srch.run().each(function(rowData) {
			var ad = rowData.getAllValues();
			iarValue = ad['SUM(custrecord_snt_wtr_line_ws_value)']
			iarTax = ad['SUM(custrecord_snt_wtr_line_tax_amount)']
			iarRetail = ad['SUM(custrecord_snt_wtr_line_retail_value)']
		});

		var s1 = search.load({
			id : 'customsearch_snt_ia_wtr'
		});
		s1.filters.push(search.createFilter({
			name : 'externalid',
			operator : search.Operator.IS,
			values : options.IAWexternalId
		}));

		var result = s1.run().getRange({
			start : 0,
			end : 1
		});
		var iawValue = result[0].getValue('amount');
		if (iawValue < 0) {
			iawValue = -iawValue
		}
		;

		var vRuc = (iarValue - iawValue);

		var accValues = {
			'accMPV' : iarRetail,
			'accRUC' : vRuc,
			'accPDV' : iarTax,
			'accPrelazni' : iawValue
		}

		return accValues;
	}

	return {
		deleteOldIA : _deleteOldIA,
		deleteOldJE : _deleteOldJE,
		deleteRetailInventoryTrans : _deleteRetailInventoryTrans,
		addRetailInventoryTransaction : _addRetailInventoryTransaction,
		getTaxRate : _getTaxRate,
		wtrOptions : _wtrOptions,
		createIAW : _createIAW,
		createJE : _createJE,
		calcAccValues : _calcAccValues
	};

});
