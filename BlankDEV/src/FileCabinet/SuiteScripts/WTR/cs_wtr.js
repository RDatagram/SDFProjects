/**
 * @NApiVersion 2.0
 * @NScriptType ClientScript
 * @NModuleScope Public
 */
define(
		[ 'N/currentRecord', 'N/ui/message', 'N/url', 'N/https' ],
		/**
		 * @param {record}
		 *            record
		 * @param {url}
		 *            url
		 */
		function(record, message, url, https) {

			/**
			 * Function to be executed after page is initialized.
			 * 
			 * @param {Object}
			 *            scriptContext
			 * @param {Record}
			 *            scriptContext.currentRecord - Current form record
			 * @param {string}
			 *            scriptContext.mode - The mode in which the record is
			 *            being accessed (create, copy, or edit)
			 * 
			 * @since 2015.2
			 */
			function pageInit(scriptContext) {

			}

			/**
			 * Function to be executed when field is changed.
			 * 
			 * @param {Object}
			 *            scriptContext
			 * @param {Record}
			 *            scriptContext.currentRecord - Current form record
			 * @param {string}
			 *            scriptContext.sublistId - Sublist name
			 * @param {string}
			 *            scriptContext.fieldId - Field name
			 * @param {number}
			 *            scriptContext.lineNum - Line number. Will be undefined
			 *            if not a sublist or matrix field
			 * @param {number}
			 *            scriptContext.columnNum - Line number. Will be
			 *            undefined if not a matrix field
			 * 
			 * @since 2015.2
			 */
			function fieldChanged(scriptContext) {

			}

			/**
			 * Function to be executed when field is slaved.
			 * 
			 * @param {Object}
			 *            scriptContext
			 * @param {Record}
			 *            scriptContext.currentRecord - Current form record
			 * @param {string}
			 *            scriptContext.sublistId - Sublist name
			 * @param {string}
			 *            scriptContext.fieldId - Field name
			 * 
			 * @since 2015.2
			 */
			function postSourcing(scriptContext) {

			}

			/**
			 * Function to be executed after sublist is inserted, removed, or
			 * edited.
			 * 
			 * @param {Object}
			 *            scriptContext
			 * @param {Record}
			 *            scriptContext.currentRecord - Current form record
			 * @param {string}
			 *            scriptContext.sublistId - Sublist name
			 * 
			 * @since 2015.2
			 */
			function sublistChanged(scriptContext) {

			}

			/**
			 * Function to be executed after line is selected.
			 * 
			 * @param {Object}
			 *            scriptContext
			 * @param {Record}
			 *            scriptContext.currentRecord - Current form record
			 * @param {string}
			 *            scriptContext.sublistId - Sublist name
			 * 
			 * @since 2015.2
			 */
			function lineInit(scriptContext) {
				/*
				if (scriptContext.sublistId == "recmachcustrecord_snt_wtr_line_header_id") {
					var idx = scriptContext.currentRecord.getCurrentSublistIndex({
						sublistId : 'recmachcustrecord_snt_wtr_line_header_id'						
					});
					scriptContext.currentRecord.getSublistField({
						sublistId : 'recmachcustrecord_snt_wtr_line_header_id',
						fieldId : 'custrecord_snt_wtr_line_tax_rate',
						line : idx // sublistindex je 1.. , a ovde ide 0.. :(
					}).isDisabled = true;

				}
				*/
				return true;
			}

			/**
			 * Validation function to be executed when field is changed.
			 * 
			 * @param {Object}
			 *            scriptContext
			 * @param {Record}
			 *            scriptContext.currentRecord - Current form record
			 * @param {string}
			 *            scriptContext.sublistId - Sublist name
			 * @param {string}
			 *            scriptContext.fieldId - Field name
			 * @param {number}
			 *            scriptContext.lineNum - Line number. Will be undefined
			 *            if not a sublist or matrix field
			 * @param {number}
			 *            scriptContext.columnNum - Line number. Will be
			 *            undefined if not a matrix field
			 * 
			 * @returns {boolean} Return true if field is valid
			 * 
			 * @since 2015.2
			 */
			function validateField(scriptContext) {

				var sct = scriptContext;
				var lSubList = sct.sublistId;
				if (lSubList == "recmachcustrecord_snt_wtr_line_header_id") {

					var lField = sct.fieldId;
					var lLineNum = sct.lineNum;
					objRecord = sct.currentRecord;
					// custrecord_snt_wtr_line_ws_value =
					// custrecord_snt_wtr_line_price
					// *
					// custrecord_snt_wtr_line_quantuty
					if ((lField == 'custrecord_snt_wtr_line_quantuty')
							|| (lField == 'custrecord_snt_wtr_line_price')) {

						var vPrice = objRecord.getCurrentSublistValue({
							sublistId : lSubList,
							fieldId : 'custrecord_snt_wtr_line_price'
						});
						var vQuantity = objRecord.getCurrentSublistValue({
							sublistId : lSubList,
							fieldId : 'custrecord_snt_wtr_line_quantuty'
						});
						var vWsValue = vPrice * vQuantity;
						objRecord.setCurrentSublistValue({
							sublistId : lSubList,
							fieldId : 'custrecord_snt_wtr_line_ws_value',
							value : vWsValue,
							ignoreFieldChange : false
						});

					}
				}
				return true;
			}

			/**
			 * Validation function to be executed when sublist line is
			 * committed.
			 * 
			 * @param {Object}
			 *            scriptContext
			 * @param {Record}
			 *            scriptContext.currentRecord - Current form record
			 * @param {string}
			 *            scriptContext.sublistId - Sublist name
			 * 
			 * @returns {boolean} Return true if sublist line is valid
			 * 
			 * @since 2015.2
			 */
			function validateLine(scriptContext) {
				var sct = scriptContext;
				var lSubList = sct.sublistId;
				var lField = sct.fieldId;
				var lLineNum = sct.lineNum;
				objRecord = sct.currentRecord;

				var vPrice = objRecord.getCurrentSublistValue({
					sublistId : lSubList,
					fieldId : 'custrecord_snt_wtr_line_price'
				});
				var vQuantity = objRecord.getCurrentSublistValue({
					sublistId : lSubList,
					fieldId : 'custrecord_snt_wtr_line_quantuty'
				});
				var vTaxRate = objRecord.getCurrentSublistValue({
					sublistId : lSubList,
					fieldId : 'custrecord_snt_wtr_line_tax_rate'
				});

				var vWsValue = vQuantity * vPrice;
				var vTaxAmount = vWsValue * (vTaxRate / 100.0);
				var vRetailValue = vWsValue + vTaxAmount;

				objRecord.setCurrentSublistValue({
					sublistId : lSubList,
					fieldId : 'custrecord_snt_wtr_line_ws_value',
					value : vWsValue.toFixed(2),
					ignoreFieldChange : false
				});
				objRecord.setCurrentSublistValue({
					sublistId : lSubList,
					fieldId : 'custrecord_snt_wtr_line_tax_amount',
					value : vTaxAmount.toFixed(2),
					ignoreFieldChange : false
				});
				objRecord.setCurrentSublistValue({
					sublistId : lSubList,
					fieldId : 'custrecord_snt_wtr_line_retail_value',
					value : vRetailValue.toFixed(2),
					ignoreFieldChange : false
				});

				return true;
			}

			/**
			 * Validation function to be executed when sublist line is inserted.
			 * 
			 * @param {Object}
			 *            scriptContext
			 * @param {Record}
			 *            scriptContext.currentRecord - Current form record
			 * @param {string}
			 *            scriptContext.sublistId - Sublist name
			 * 
			 * @returns {boolean} Return true if sublist line is valid
			 * 
			 * @since 2015.2
			 */
			function validateInsert(scriptContext) {

			}

			/**
			 * Validation function to be executed when record is deleted.
			 * 
			 * @param {Object}
			 *            scriptContext
			 * @param {Record}
			 *            scriptContext.currentRecord - Current form record
			 * @param {string}
			 *            scriptContext.sublistId - Sublist name
			 * 
			 * @returns {boolean} Return true if sublist line is valid
			 * 
			 * @since 2015.2
			 */
			function validateDelete(scriptContext) {

			}

			/**
			 * Validation function to be executed when record is saved.
			 * 
			 * @param {Object}
			 *            scriptContext
			 * @param {Record}
			 *            scriptContext.currentRecord - Current form record
			 * @returns {boolean} Return true if record is valid
			 * 
			 * @since 2015.2
			 */
			function saveRecord(scriptContext) {

			}

			function csInvAdj() {

				var cRec = record.get();

				var restUrl = url.resolveScript({
					scriptId : 'customscript_snt_rl_wtr_to_ia', // RESTlet
																// scriptId
					deploymentId : 'customdeploy_snt_rl_wtr_to_ia' // RESTlet
				// deploymentId
				});

				// Generate request headers
				var headers = new Array();
				headers['Content-type'] = 'application/json';

				// Perform HTTP POST call
				var restReq = https.post({
					url : restUrl,
					headers : headers,
					body : {
						idWtr : cRec.id
					}
				});
				var jsRes = JSON.parse(restReq.body);

				var myMsg = message.create({
					title : "Result",
					message : jsRes.result,
					type : message.Type.CONFIRMATION
				});
				// will disappear after 5s
				myMsg.show({
					duration : 5000
				});

				window.location.reload(true);
			}

			return {
				pageInit : pageInit,
				csInvAdj : csInvAdj,
				// fieldChanged : fieldChanged,
				// postSourcing : postSourcing,
				// sublistChanged : sublistChanged,
				lineInit : lineInit,
				validateField : validateField,
				validateLine : validateLine,
			// validateInsert : validateInsert,
			// validateDelete : validateDelete,
			// saveRecord : saveRecord
			};

		});
