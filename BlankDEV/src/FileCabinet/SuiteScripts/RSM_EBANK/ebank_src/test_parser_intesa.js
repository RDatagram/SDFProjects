/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
define(
		[ 'N/file', 'N/xml', 'N/search', 'N/record', 'N/runtime' ],

		function(file, xml, search, record, runtime) {

			/**
			 * Marks the beginning of the Map/Reduce process and generates input
			 * data.
			 * 
			 * @typedef {Object} ObjectRef
			 * @property {number} id - Internal ID of the record instance
			 * @property {string} type - Record type id
			 * 
			 * @return {Array|Object|Search|RecordRef} inputSummary
			 * @since 2015.1
			 */

			// Returns value from first node found by tag name
			function getValueFromNodeByTagName(xmlDocument, tagName) {
				var elements = xml.XPath.select({
					node : xmlDocument,
					xpath : "//" + tagName
				});

				return elements[0].textContent;
			}

			// Returns array of nodes found by tag name
			function getNodesByTagName(xmlDocument, tagName) {
				var elements = xml.XPath.select({
					node : xmlDocument,
					xpath : "//" + tagName
				});

				return elements;
			}

			// Returns value of a node
			function getValueFromNode(node) {
				return node.textContent;
			}

			function getInputData() {

				
				var recMaster = record.load({
					type : "customrecord_snt_bank_statement",
					id : 1,
					isDynamic : false
				});
				
				var myXmlTmpl = file.load({
					id : recMaster.getValue('custrecord_rsm_bstmt_file')
				});

				var xmlString = myXmlTmpl.getContents();
				var outputArray = [];

				try {
					var xmlDocument = xml.Parser.fromString({
						text : xmlString
					});

					var companyName = getValueFromNodeByTagName(xmlDocument,
							"companyname");

					var currencies = getNodesByTagName(xmlDocument, "curdef");
					var mainCurrency = currencies.splice(0, 1)[0].textContent;
					var acctids = getNodesByTagName(xmlDocument, "acctid");
					var accMappingKey = acctids.splice(0, 1)[0].textContent;

					var dtAsOf = getValueFromNodeByTagName(xmlDocument,
							"dtasof");
					dtAsOf = dtAsOf.split('T')[0];

					var brojNaloga = getValueFromNodeByTagName(xmlDocument,
							"stmtnumber");

					var trnlist = getNodesByTagName(xmlDocument, "trnlist")[0];
					var trnlistCount = parseInt(trnlist.getAttributeNode("count").value);

					var benefits = getNodesByTagName(xmlDocument, "benefit");
					var vendors = getNodesByTagName(xmlDocument, "name");

					var trnAmounts = getNodesByTagName(xmlDocument, "trnamt");
					var purposes = getNodesByTagName(xmlDocument, "purpose");
					var purposeCodes = getNodesByTagName(xmlDocument,
							"purposecode");
					var poziviNaBroj1 = getNodesByTagName(xmlDocument,
							"payeerefnumber");
					var poziviNaBroj2 = getNodesByTagName(xmlDocument,
							"refnumber");
					var trnTypes = getNodesByTagName(xmlDocument, "trntype");

					var accountStatement = {};
					accountStatement.accountMappingKey = accMappingKey;

					var accountStatementId = "21-XML";

					for (var i = 0; i < trnlistCount; i++) {
						var transaction = {};
						transaction.index = i;
						transaction.accountStatementId = accountStatementId;
						transaction.amount = trnAmounts[i].textContent;
						transaction.date = dtAsOf;
						transaction.transactionMappingKey = getValueFromNode(benefits[i]);

						if (transaction.transactionMappingKey === 'credit') {
							transaction.payee = vendors[i].textContent;
							transaction.customerName = companyName;
						} else {
							transaction.payee = companyName;
							transaction.customerName = vendors[i].textContent;
						}

						transaction.bankAccountId = acctids[i].textContent;

						transaction.currency = currencies[i].textContent;
						transaction.memo = purposeCodes[i].textContent + ":"
								+ purposes[i].textContent;
						// transaction.transactionNumber = ;
						// transaction.customerRawId = ;
						// transaction.invoices = partsOfCSVLine[8].split(",");

						outputArray.push(transaction);

					}

				} catch (e) {
					log.error("Error", e.toString());
				}

				log.debug("Step : ", "getInputData finished");

				return outputArray;
			}

			/**
			 * Executes when the map entry point is triggered and applies to
			 * each key/value pair.
			 * 
			 * @param {MapSummary}
			 *            context - Data collection containing the key/value
			 *            pairs to process through the map stage
			 * @since 2015.1
			 */
			function map(context) {
				var result = JSON.parse(context.value);

				if (result.transactionMappingKey == 'credit') {

					var data = {
						index : result.index,
						'custrecord_rsm_bdp_bank_acct_p' : result.bankAccountId,
						'custrecord_rsm_bdp_payee_p' : result.payee,
						'custrecord_rsm_bdp_amount_p' : result.amount,
						'custrecord_rsm_bdp_memo_p' : result.memo
					}
					context.write({
						key : result.index,
						value : data
					});

					log.debug("Step : ", "map triggered : " + context.value);
				}

			}

			/**
			 * Executes when the reduce entry point is triggered and applies to
			 * each group.
			 * 
			 * @param {ReduceSummary}
			 *            context - Data collection containing the groups to
			 *            process through the reduce stage
			 * @since 2015.1
			 */
			function reduce(context) {
				log.debug("Step : ", "reduce entry");
				context.write({
					key : context.key,
					value : JSON.parse(context.values[0])
				});
			}

			/**
			 * Executes when the summarize entry point is triggered and applies
			 * to the result set.
			 * 
			 * @param {Summary}
			 *            summary - Holds statistics regarding the execution of
			 *            a map/reduce script
			 * @since 2015.1
			 */
			function summarize(summary) {

				log.debug("Step : ", "summarize entry");

				var recMaster = record.load({
					type : "customrecord_snt_bank_statement",
					id : 1,
					isDynamic : true
				});

				summary.output.iterator().each(function(key, value) {
					log.debug("Step : ", "summary iterator");

					var transaction = JSON.parse(value);

					recMaster.selectNewLine({
						sublistId : 'recmachcustrecord_rsm_bdp_parent'
					});

					recMaster.setCurrentSublistValue({
						sublistId : 'recmachcustrecord_rsm_bdp_parent',
						fieldId : 'custrecord_rsm_bdp_bank_acct_p',
						value : transaction.custrecord_rsm_bdp_bank_acct_p
					});

					// custrecord_rsm_bdp_payee_p
					recMaster.setCurrentSublistValue({
						sublistId : 'recmachcustrecord_rsm_bdp_parent',
						fieldId : 'custrecord_rsm_bdp_payee_p',
						value : transaction.custrecord_rsm_bdp_payee_p
					});

					recMaster.setCurrentSublistValue({
						sublistId : 'recmachcustrecord_rsm_bdp_parent',
						fieldId : 'custrecord_rsm_bdp_amount_p',
						value : transaction.custrecord_rsm_bdp_amount_p
					});

					// custrecord_rsm_bdp_memo_p
					recMaster.setCurrentSublistValue({
						sublistId : 'recmachcustrecord_rsm_bdp_parent',
						fieldId : 'custrecord_rsm_bdp_memo_p',
						value : transaction.custrecord_rsm_bdp_memo_p
					});

					recMaster.commitLine({
						sublistId : 'recmachcustrecord_rsm_bdp_parent'
					});

				});
				recMaster.save();

				log.audit('inputSummary:Usage', summary.inputSummary.usage);
				log.audit('mapSummary:Usage', summary.mapSummary.usage);
				log.audit('reduceSummary:Usage', summary.reduceSummary.usage);
				log.audit('Usage', summary.usage);

			}

			return {
				getInputData : getInputData,
				map : map,
				reduce : reduce,
				summarize : summarize
			};

		});
