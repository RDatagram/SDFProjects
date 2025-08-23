/**
 * @NApiVersion 2.0
 * @NScriptType bankStatementParserPlugin
 */
define(["N/file", "N/log", "N/query"], function (file, log,query) {

    var util = {
        getAccountId: function(line) {
//          return line.substr(0, 18);
        	return line.substr(0, 3)+ "-" + line.substr(3, 13)+ "-" + line.substr(16, 2);
        },
        getDebitCredit: function(line) {
//          return (line.substr(18, 2) === "10") ? "debit" : "credit";
            return (line.substr(18, 2) === "10" || line.substr(18, 2) === "40") ? "debit" : "credit";
        },
        getDate: function(line) {
            var date =  line.substr(20, 8).trim().split(".");
            return "20" + date[2] + "-" + date[1] + "-" + date[0];
        },
        getStornoPrometa: function(line) {
            return line.substr(28, 2);
        },
        getCompanyName: function(line) {
            return line.substr(30, 35).trim();
        },
        getDatUpl: function(line) {
            return (line.substr(66, 2).trim() === "") ? Date(0): "20" + line.substr(70, 2) + "-" + line.substr(68, 2) + "-" + line.substr(66, 2);
        },
        getAccountMappingKey: function(line) {
//          return line.substr(72, 18);
        	return line.substr(72, 3)+ "-" + line.substr(75, 13)+ "-" + line.substr(88, 2);
        },
        getAmmount: function(line) {
            var raw = line.substr(90, 15);
            raw =  raw.slice(0, raw.length - 2) + "." + raw.slice(raw.length - 2, raw.length);
            return (parseFloat(raw).toString().indexOf(".") != -1) ? parseFloat(raw).toFixed(2).toString() : parseFloat(raw).toString();
        },
        getPurposeCode: function(line) {
            return line.substr(106, 3);
        },
        // Model i poziv na broj zaduzenja
        getModelMod2: function(line) {
            return line.substr(111, 2).trim();
        },
        getModel2: function(line) {
            return line.substr(113, 22).trim();
        },
        // Model i poziv na broj odobrenja
        getModelMod1: function(line) {
            return line.substr(135, 2).trim();
        },
        getModel1: function(line) {
            return line.substr(137, 22).trim();
        },
        getPurpose: function(line) {
            return line.substr(159, 36).trim();
        },
        getCustomerCity: function(line) {
            return line.substr(195, 10).trim();
        },
        getCustomer: function(line) {
            return line.substr(205, 35).trim();
        },
        getBankRef: function(line) {
            return line.substr(240, 40).trim();
        }
    };

    return {
        parseBankStatement: function (context) {

            var statementFile = context.input.file;
            var accountStatement = null;
            var accountStatementId;

            var statementLineIterator = statementFile.lines.iterator();
            statementLineIterator.each(function (line) {
                // log.debug({
                //     title: "Read a line from the statement",
                //     details: line.value
                // });

                if (accountStatement === null) {
                    accountStatement = context.output.createNewAccountStatement();
                    accountStatement.accountMappingKey = util.getAccountMappingKey(line.value);
                    log.debug({
                        title: "Adding a new account statement",
                        details: accountStatement
                    });

                    accountStatementId = context.output.addAccountStatement({
                        parsedAccountStatement: accountStatement
                    });
                    log.debug({
                        title: "New account statement ID",
                        details: accountStatementId
                    });
                }

                var transaction = context.output.createNewTransaction();
                transaction.accountStatementId = accountStatementId;
                transaction.date = util.getDate(line.value);
                transaction.amount = util.getAmmount(line.value);
                transaction.transactionMappingKey = util.getDebitCredit(line.value);
                if (transaction.transactionMappingKey === 'credit') {
                    transaction.payee = util.getCustomer(line.value);
                    transaction.customerName = util.getCompanyName(line.value);
                    transaction.memo = util.getModel1(line.value);
                } else {
                    transaction.payee = util.getCustomer(line.value);
                    transaction.customerName = util.getCompanyName(line.value);
                    transaction.memo = util.getModel2(line.value);

                    /*
                    transaction.payee = util.getCompanyName(line.value);
                    transaction.customerName = util.getCustomer(line.value);
                     */
                }
                //transaction.memo = util.getModel1(line.value);
                //transaction.memo = util.getPurpose(line.value);
                // transaction.transactionNumber = ;
                /*
                if (util.getBankRef(line.value)) {
					var sql_type = " select tranid as v_tranid, type as v_type from transaction where custbody_rsm_bdp_bankref = ? ";
					var results_type = query.runSuiteQL({
						query : sql_type,
						params : [ util.getBankRef(line.value) ]
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
                
                */
                // transaction.currency = "USD";
                // transaction.customerRawId = ;
                // transaction.invoices = partsOfCSVLine[8].split(",");

                log.debug({
                    title: "Adding a new transaction",
                    details: transaction
                });

                context.output.addTransaction({ parsedTransaction: transaction });
                return true;
            });
        },
        getStandardTransactionCodes: function (context) {
            try{
                var tranCodes = {
                    "credit": "CREDIT",
                    "debit": "DEBIT"
                };
                for (var key in tranCodes) {
                    var standardTransactionCode = context.output.createNewStandardTransactionCode();
                    standardTransactionCode.tranCode = key;
                    standardTransactionCode.tranType = tranCodes[key];
                    standardTransactionCode.creditDebitType = tranCodes[key];
                    context.output.addStandardTransactionCode({
                        standardTransactionCode: standardTransactionCode
                    });
                }
            } catch(e) {
                log.debug({
                    title: "Error in getStandardTransactionCodes",
                    details: e.toString()
                });
            }
        }
    };
});
