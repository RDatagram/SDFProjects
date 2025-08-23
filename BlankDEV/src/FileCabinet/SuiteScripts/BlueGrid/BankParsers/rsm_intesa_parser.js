/**
 * @NApiVersion 2.0
 * @NScriptType bankStatementParserPlugin
 */
define([ "N/xml", "N/log", "N/runtime", "N/email", "N/query" ], function(xml, log, runtime, email, query) {

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

	return {
		parseBankStatement : function(context) {

			var xmlString = context.input.file.getContents();

			try {
				var xmlDocument = xml.Parser.fromString({
					text : xmlString
				});

				var companyName = getValueFromNodeByTagName(xmlDocument, "companyname");

				var currencies = getNodesByTagName(xmlDocument, "curdef");
				var mainCurrency = currencies.splice(0, 1)[0].textContent;
				var acctids = getNodesByTagName(xmlDocument, "acctid");
				var accMappingKey = acctids.splice(0, 1)[0].textContent;

				var dtAsOf = getValueFromNodeByTagName(xmlDocument, "dtasof");
				dtAsOf = dtAsOf.split('T')[0];

				var brojNaloga = getValueFromNodeByTagName(xmlDocument, "stmtnumber");

				var trnlist = getNodesByTagName(xmlDocument, "trnlist")[0];
				var trnlistCount = parseInt(trnlist.getAttributeNode("count").value);

				var benefits = getNodesByTagName(xmlDocument, "benefit");
				var vendors = getNodesByTagName(xmlDocument, "name");
				var fitids = getNodesByTagName(xmlDocument, "fitid");

				var dtPosted = getValueFromNodeByTagName(xmlDocument, "dtposted");
				dtPosted = dtPosted.split('T')[0];

				var trnAmounts = getNodesByTagName(xmlDocument, "trnamt");
				var purposes = getNodesByTagName(xmlDocument, "purpose");
				var purposeCodes = getNodesByTagName(xmlDocument, "purposecode");

				var model_1 = getNodesByTagName(xmlDocument, "payeerefmodel");
				var poziviNaBroj1 = getNodesByTagName(xmlDocument, "payeerefnumber");
				var model_2 = getNodesByTagName(xmlDocument, "refmodel");
				var poziviNaBroj2 = getNodesByTagName(xmlDocument, "refnumber");

				var trnTypes = getNodesByTagName(xmlDocument, "trntype");

				var accountStatement = context.output.createNewAccountStatement();
				accountStatement.accountMappingKey = accMappingKey;

				log.debug({
					title : "Adding a new account statement",
					details : accountStatement
				});
				var accountStatementId = context.output.addAccountStatement({
					parsedAccountStatement : accountStatement
				});
				log.debug({
					title : "New account statement ID",
					details : accountStatementId
				});

				for (var i = 0; i < trnlistCount; i++) {
					var transaction = context.output.createNewTransaction();

					transaction.accountStatementId = accountStatementId;
					transaction.amount = trnAmounts[i].textContent;
					transaction.date = dtAsOf;
					transaction.transactionMappingKey = getValueFromNode(benefits[i]);

					if (transaction.transactionMappingKey === 'credit') {
						transaction.payee = vendors[i].textContent;
						transaction.customerName = companyName;
					} else {
						transaction.payee = vendors[i].textContent;
						transaction.customerName = companyName;
						/*
						transaction.payee = companyName;
						transaction.customerName = vendors[i].textContent;
						 */
					}

					transaction.currency = currencies[i].textContent;
					transaction.memo = poziviNaBroj1[i].textContent;
					//transaction.memo = purposes[i].textContent;
					/*
					if (fitids[i].textContent) {
						var sql_type = " select tranid as v_tranid, type as v_type from transaction where custbody_rsm_bdp_bankref = ? ";
						var results_type = query.runSuiteQL({
							query : sql_type,
							params : [ fitids[i].textContent ]
						});
						var objdata = results_type.asMappedResults();

						if (objdata.length > 0) {
							//transaction.transactionNumber = objdata[0]["v_tranid"];
							
							if (objdata[0]["v_type"] == "CustDep") {
								transaction.transactionNumber = objdata[0]["v_tranid"];
							}
							if (objdata[0]["v_type"] == "CustPymt") {
								transaction.transactionNumber = "# " + objdata[0]["v_tranid"];
							}

						}
						// transaction.customerRawId = 90;
					}
					// transaction.invoices = partsOfCSVLine[8].split(",");
					*/
					log.debug({
						title : "Adding a new transaction",
						details : transaction
					});

					context.output.addTransaction({
						parsedTransaction : transaction
					});
				}
			} catch (e) {
				var userEmail = runtime.getCurrentUser().email;
				email.send({
					author : -5,
					recipients : userEmail,
					subject : "Greska prilikom upload-a dnevnog izvoda banke",
					body : "Doslo je do greske prilikom parsiranja dnevnog izvoda banke. Proverite encoding fajla (mora biti UTF-8).\n" + "Takodje, proverite da li se broj racuna vase firme u sistemu podudara sa brojem racuna u fajlu.\n\n"
							+ "Error message:" + e.toString()

				});
			}
		},
		getStandardTransactionCodes : function(context) {
			try {
				// var tranTypes = [
				// "ACH",
				// "CHECK",
				// "CREDIT",
				// "DEBIT",
				// "DEPOSIT",
				// "FEE",
				// "INTEREST",
				// "PAYMENT",
				// "TRANSFER",
				// "OTHER"
				// ];
				// for (var i = 0; i < tranTypes.length; ++i) {
				// var standardTransactionCode =
				// context.output.createNewStandardTransactionCode();
				// standardTransactionCode.tranCode = tranTypes[i];
				// standardTransactionCode.tranType = tranTypes[i];
				// standardTransactionCode.creditDebitType = tranTypes[i];
				// context.output.addStandardTransactionCode({
				// standardTransactionCode: standardTransactionCode
				// });

				// log.debug({
				// title: "Adding a new standard transaction code",
				// details: standardTransactionCode
				// });
				// }

				var tranCodes = {
					"credit" : "CREDIT",
					"debit" : "DEBIT"
				}

				for ( var key in tranCodes) {
					var standardTransactionCode = context.output.createNewStandardTransactionCode();
					standardTransactionCode.tranCode = key;
					standardTransactionCode.tranType = tranCodes[key];
					standardTransactionCode.creditDebitType = tranCodes[key];
					context.output.addStandardTransactionCode({
						standardTransactionCode : standardTransactionCode
					});

					// log.debug({
					// title: "Adding a new standard transaction code",
					// details: standardTransactionCode
					// });
				}
			} catch (e) {
				log.debug({
					title : "Error in getStandardTransactionCodes",
					details : e.toString()
				});
			}
		}
	};
});
