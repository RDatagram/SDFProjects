define([ "N/file", 'N/xml', 'N/query', 'N/runtime' ],

function(file, xml, query, runtime) {

	function _parser_halcom(context) {

		var util = {
			getAccountId : function(line) {
				// return line.substr(0, 18);
				return line.substr(0, 3) + "-" + line.substr(3, 13) + "-" + line.substr(16, 2);
			},
			getDebitCredit : function(line) {
				// return (line.substr(18, 2) === "10") ? "debit" :
				// "credit";
				return (line.substr(18, 2) === "10" || line.substr(18, 2) === "40") ? "debit" : "credit";
			},
			getDate : function(line) {
				var date = line.substr(20, 8).trim().split(".");
				return "20" + date[2] + "-" + date[1] + "-" + date[0];
			},
			getDtPosted : function(line) {
				var dtPosted = line.substr(20, 8).trim().split(".");
				return dtPosted[0] + "." + dtPosted[1] + "." + "20" + dtPosted[2];
			},
			getStornoPrometa : function(line) {
				return line.substr(28, 2);
			},
			getCompanyName : function(line) {
				return line.substr(30, 35).trim();
			},
			getDatUpl : function(line) {
				return (line.substr(66, 2).trim() === "") ? Date(0) : "20" + line.substr(70, 2) + "-" + line.substr(68, 2) + "-" + line.substr(66, 2);
			},
			getAccountMappingKey : function(line) {
				// return line.substr(72, 18);
				return line.substr(72, 3) + "-" + line.substr(75, 13) + "-" + line.substr(88, 2);
			},
			getAmmount : function(line) {
				var raw = line.substr(90, 15);
				raw = raw.slice(0, raw.length - 2) + "." + raw.slice(raw.length - 2, raw.length);
				return (parseFloat(raw).toString().indexOf(".") != -1) ? parseFloat(raw).toFixed(2).toString() : parseFloat(raw).toString();
			},
			getPurposeCode : function(line) {
				return line.substr(106, 3);
			},
			// Model i poziv na broj zaduzenja
			getModelMod2 : function(line) {
				return line.substr(111, 2).trim();
			},
			getModel2 : function(line) {
				return line.substr(113, 22).trim();
			},
			// Model i poziv na broj odobrenja
			getModelMod1 : function(line) {
				return line.substr(135, 2).trim();
			},
			getModel1 : function(line) {
				return line.substr(137, 22).trim();
			},
			getPurpose : function(line) {
				return line.substr(159, 36).trim();
			},
			getCustomerCity : function(line) {
				return line.substr(195, 10).trim();
			},
			getCustomer : function(line) {
				return line.substr(205, 35).trim();
			},
			getBankRef : function(line) {
				return line.substr(240, 40).trim();
			}
		};

		var outputArray = [];
		var statementFile = file.load({
			id : context.fileId
		});

		var accountStatement = null;
		var accountStatementId;

		accountStatementId = "HALCOM-CSV";
		var statementLineIterator = statementFile.lines.iterator();

		var i = 0;
		statementLineIterator.each(function(line) {
			// log.debug({
			// title: "Read a line from the statement",
			// details: line.value
			// });

			// context.output.createNewTransaction();
			var transaction = {};
			transaction.index = i;
			transaction.bankAccountId = util.getAccountId(line.value);
			
			//OVO ne ide u redovne parsere
			transaction.subsidiary = context.subsidiary;
			
			transaction.accountStatementId = accountStatementId;
			transaction.date = util.getDate(line.value);
			transaction.amount = util.getAmmount(line.value);
			transaction.transactionMappingKey = util.getDebitCredit(line.value);
			if (transaction.transactionMappingKey === 'credit') {
				transaction.payee = util.getCustomer(line.value);
				transaction.customerName = util.getCompanyName(line.value);
			} else {
				transaction.payee = util.getCompanyName(line.value);
				transaction.customerName = util.getCustomer(line.value);
			}
			transaction.bankRef = util.getBankRef(line.value);
			transaction.model_1 = util.getModelMod1(line.value);
			transaction.poziviNaBroj1 = util.getModel1(line.value);
			transaction.model_2 = util.getModelMod2(line.value);
			transaction.poziviNaBroj2 = util.getModel2(line.value);
			transaction.dtPosted = util.getDtPosted(line.value);
			transaction.purpose = util.getPurpose(line.value);
			// transaction.memo = util.getPurposeCode(line.value) + ":"
			// +
			// util.getPurpose(line.value);
			transaction.memo = util.getModel1(line.value);
			// transaction.transactionNumber = ;
			transaction.currency = "RSD";
			// transaction.customerRawId = ;
			// transaction.invoices =
			// partsOfCSVLine[8].split(",");

			log.debug({
				title : "Adding a new transaction",
				details : transaction
			});

			// context.output.addTransaction({
			// parsedTransaction: transaction });
			outputArray.push(transaction);

			i = i + 1;
			return true;
		});

		return outputArray;
	}

	/**
	 * PARSIRANJE Intesa izvoda
	 */

	function _parser_intesa(context) {
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

		/**
		 * Main function _parser_intesa
		 */
		var myXmlTmpl = file.load({
			id : context.fileId
		});

		var xmlString = myXmlTmpl.getContents();
		var outputArray = [];

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
			var fitids = getNodesByTagName(xmlDocument, "fitid");
			var vendors = getNodesByTagName(xmlDocument, "name");

			var dtPosted_pom = getValueFromNodeByTagName(xmlDocument, "dtposted");
			// dtPosted = dtPosted.split('T')[0];
			dtPosted = dtPosted_pom.substr(8, 2) + "." + dtPosted_pom.substr(5, 2) + "." + dtPosted_pom.substr(0, 4);
			log.debug("dtPosted : ", dtPosted);

			var trnAmounts = getNodesByTagName(xmlDocument, "trnamt");
			var purposes = getNodesByTagName(xmlDocument, "purpose");
			var purposeCodes = getNodesByTagName(xmlDocument, "purposecode");

			var model_1 = getNodesByTagName(xmlDocument, "payeerefmodel");
			var poziviNaBroj1 = getNodesByTagName(xmlDocument, "payeerefnumber");
			var model_2 = getNodesByTagName(xmlDocument, "refmodel");
			var poziviNaBroj2 = getNodesByTagName(xmlDocument, "refnumber");

			var trnTypes = getNodesByTagName(xmlDocument, "trntype");

			var accountStatement = {};
			accountStatement.accountMappingKey = accMappingKey;

			var accountStatementId = "INTESA-XML";

			for (var i = 0; i < trnlistCount; i++) {
				var transaction = {};
				transaction.index = i;
				transaction.accountStatementId = accountStatementId;
				
				//OVO ne ide u redovne parsere
				transaction.subsidiary = context.subsidiary;
				
				transaction.amount = trnAmounts[i].textContent;
				transaction.date = dtAsOf;
				transaction.transactionMappingKey = getValueFromNode(benefits[i]);
				transaction.bankRef = fitids[i].textContent;

				if (transaction.transactionMappingKey === 'credit') {
					transaction.payee = vendors[i].textContent;
					transaction.customerName = companyName;
				} else {
					transaction.payee = companyName;
					transaction.customerName = vendors[i].textContent;
				}

				transaction.bankAccountId = acctids[i].textContent;

				transaction.currency = currencies[i].textContent;
				transaction.memo = poziviNaBroj1[i].textContent;
				// transaction.transactionNumber = ;
				// transaction.customerRawId = ;
				// transaction.invoices = partsOfCSVLine[8].split(",");

				transaction.model_1 = model_1[i].textContent;
				transaction.poziviNaBroj1 = poziviNaBroj1[i].textContent;
				transaction.model_2 = model_2[i].textContent;
				transaction.poziviNaBroj2 = poziviNaBroj2[i].textContent;
				transaction.dtPosted = dtPosted;
				transaction.purpose = purposes[i].textContent;
				
				outputArray.push(transaction);

			}

		} catch (e) {
			log.error("Error", e.toString());
		}

		return outputArray;
	}

	function _lookupBankID(bankAccountId) {
		log.debug('Try to find customer Bank account', bankAccountId);

		var data = {
			"isFound" : 0
		};
		var resultSet;

		/*
		 * resultSet = query .runSuiteQL({ query : " select id as custid from
		 * customer where
		 * (concat(concat(concat(concat(substr(trim(replace(accountnumber,'-')),1,3),'-')
		 * ,lpad(substr(trim(replace(accountnumber,'-')),4,length(trim(replace(accountnumber,'-')))-5),13,'0')
		 * ),'-'),substr(trim(replace(accountnumber,'-')),length(trim(replace(accountnumber,'-')))-1))) = ? ",
		 * params : [ bankAccountId ] });
		 */
		// select custrecord_rsm_cust_bank_accounts_cust as custid from
		// customrecord_rsm_cust_bank_accounts where
		// custrecord_rsm_cust_bank_accounts_tr =
		// 

		var l_sql = " select custrecord_rsm_cust_bank_accounts_cust as custid ";
		l_sql += " from customrecord_rsm_cust_bank_accounts join customer on (custrecord_rsm_cust_bank_accounts_cust = customer.id) ";
		l_sql += " where custrecord_rsm_cust_bank_accounts_tr = ? ";
		l_sql += " ORDER by customer.isinactive desc, customer.id desc ";
		resultSet = query.runSuiteQL({
			query : l_sql,
			params : [ bankAccountId ]
		});
		
		for (var i = 0; (i < resultSet.results.length) && (data.isFound === 0); i++) {
			data.isFound = 1;
			var mResult = resultSet.results[i].asMap();
			data.custrecord_rsm_bdp_customer = mResult.custid;
		}

		return data
	}

	function _lookupPNBO(srchBroj, srchSub) {
		log.debug('Try to find PNBO', srchBroj);

		var lPnboBdpAct = new _BdpActions();

		var data = {
			"isFound" : 0
		};
		var l_found = 0;
		var resultSet;

		log.debug('Try to find invoice...', srchBroj);
		
		var subcheck = runtime.isFeatureInEffect({
			feature : 'SUBSIDIARIES'
		});
		
		if (subcheck){
			var sqlQuery = " select transaction.id, transaction.entity from transactionline join transaction on (transactionline.transaction = transaction.id) ";
			sqlQuery += " where (transaction.type = 'CustInvc') AND ((transaction.custbody_poziv_na_broj = ?) OR (replace(transaction.custbody_poziv_na_broj,'-') = ?)) ";
			sqlQuery += " AND ( transactionline.subsidiary = ? ) "
			var parQuery = [ srchBroj, srchBroj, srchSub ];
		} else {
			var sqlQuery = " select id, entity from transaction where (type = 'CustInvc') AND (custbody_poziv_na_broj = ?) ";
			var parQuery = [ srchBroj ];			
		}
		resultSet = query.runSuiteQL({
			query : sqlQuery,
			params : parQuery 
		})

		for (var i = 0; i < resultSet.results.length; i++) {
			l_found = 1;
			var mResult = resultSet.results[i].asMap();
			data.isFound = 1;
			data.custrecord_rsm_bdp_action = lPnboBdpAct.getActionID('PAYMENT'); // PAYMENT
			data.custrecord_rsm_bdp_customer = mResult.entity;
			data.custrecord_rsm_bdp_transaction_recog = mResult.id;
		}
		

		if ((l_found === 0) && (srchBroj)) {
			log.debug('Try to find salesOrder...', srchBroj);
			
			if (subcheck){
				var sqlQuery = " select transaction.id, transaction.entity from transactionline join transaction on (transactionline.transaction = transaction.id) ";
				sqlQuery += " where (transaction.type = 'SalesOrd') AND ((transaction.custbody_poziv_na_broj = ?) OR (replace(transaction.custbody_poziv_na_broj,'-') = ?)) ";
				sqlQuery += " AND ( transactionline.subsidiary = ? ) "
				var parQuery = [ srchBroj, srchBroj, srchSub ];
			} else {
				var sqlQuery = " select id, entity from transaction where (type = 'SalesOrd') AND (custbody_poziv_na_broj = ?) ";
				var parQuery = [ srchBroj ];			
			}
			
			resultSet = query.runSuiteQL({
				query : sqlQuery,
				params : parQuery 
			})
			
			for (var i = 0; i < resultSet.results.length; i++) {
				l_found = 1;
				var mResult = resultSet.results[i].asMap();
				data.isFound = 1;
				data.custrecord_rsm_bdp_action = lPnboBdpAct.getActionID('DEPOSIT'); // DEPOSIT
				data.custrecord_rsm_bdp_customer = mResult.entity;
				data.custrecord_rsm_bdp_transaction_recog = mResult.id;
			}

		}
		
		if ((l_found == 0) && (srchBroj)) {
			log.debug('Try to find SalesOrderEstimates...', srchBroj);
			
			if (subcheck){
				var sqlQuery = " select transaction.custbody_rsm_est_from_so , transaction.entity from transactionline join transaction on (transactionline.transaction = transaction.id) ";
				sqlQuery += " where (transaction.type like 'CuTrSale%') AND ((transaction.custbody_poziv_na_broj = ?) OR (replace(transaction.custbody_poziv_na_broj,'-') = ?)) ";
				sqlQuery += " AND ( transactionline.subsidiary = ? ) "
				var parQuery = [ srchBroj, srchBroj, srchSub ];
			} else {
				var sqlQuery = " select custbody_rsm_est_from_so, entity from transaction where (type like 'CuTrSale%') AND (custbody_poziv_na_broj = ?) ";
				var parQuery = [ srchBroj ];			
			}
			
			resultSet = query.runSuiteQL({
				query : sqlQuery,
				params : parQuery 
			})
			
			for (var i = 0; i < resultSet.results.length; i++) {
				l_found = 1;
				var mResult = resultSet.results[i].asMap();
				data.isFound = 1;
				data.custrecord_rsm_bdp_action = lPnboBdpAct.getActionID('DEPOSIT'); // DEPOSIT
				data.custrecord_rsm_bdp_customer = mResult.entity;
				data.custrecord_rsm_bdp_transaction_recog = mResult.custbody_rsm_est_from_so;
			}

		}
		
		return data;
	}

	/**
	 *
	 * @type {_SalesOrderTypes}
	 *
	 */
	var BdpActions = {
		load: function(){
			return new _BdpActions();
		}
	}

	function _BdpActions() {
		var selfThis = this;
		this._sql = " select id, name from customlist_rsm_bdp_actions ";

		this._result = {};

		var _temp = query.runSuiteQL(({
			query: selfThis._sql
		}));

		this._result = _temp.asMappedResults();

		this.getActionID = function(_name){
			var retId = -1;
			log.debug({"title" : "getActionID", details : selfThis._result});

			for (var _ia = 0; _ia < selfThis._result.length; _ia++){
				if (selfThis._result[_ia]['name'] === _name){
					retId = selfThis._result[_ia]['id']
				}
			}
			return retId;
		}
	}

	return {
		parserHalcom : _parser_halcom,
		parserIntesa : _parser_intesa,
		lookupPNBO : _lookupPNBO,
		lookupBankID : _lookupBankID,
		BdpActions : BdpActions
	};

});
