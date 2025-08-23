/**
 * @NApiVersion 2.0
 * @NScriptType bankStatementParserPlugin
 */
define(["N/runtime", "N/email", "N/log"], function (runtime, email, log) {

    function parseDate(date) {
        return date.substr(0, 4) + "-" + date.substr(4, 2) + "-" + date.substr(6, 2);
    }

    // Util object with tag patterns and functions to get tags and content from lines
    var util = {
        tags: {
            tag_61: {
                pattern: /^.*(C|D)(\d*,\d?\d?)[A-Z]([A-Z]{3})(\d{8}).+/
            },
            tag_86_3: {
                pattern: /ACC-(\d+-\d+-\d+).+SIF-(\d+)/
            }
        },
        getTag: function(line) {
            var grps = line.match(/:(\d\d[a-zA-Z]?):/);
            return (grps) ? grps[1] : null;
        },
        getTagContent: function(line) {
            var tag = this.getTag(line);
            return (tag) ? line.match(/:\d\d[a-zA-Z]?:(.*)/)[1] : line.trim();
        }
    }

    return {
        parseBankStatement: function (context) {

            var statementFile = context.input.file;

            var tagsAndLines = [];
            var lastTag = null, tag86Counter = 0;
            var statementLineIterator = statementFile.lines.iterator();

            // Goes through the file lines and creates list of objects with tag as a key and content as a value
            statementLineIterator.each(function (line) {
                var tag = util.getTag(line.value);
                var key = (tag) ? tag : (lastTag === "86") ? lastTag + "_" + tag86Counter++ :"N/A";
                var tempObj = {};
                tempObj[key] = util.getTagContent(line.value);
                tagsAndLines.push(tempObj);
                if (tag) {
                    lastTag = tag;
                    tag86Counter = 0;
                }
                return true;
            });

            var lastTag = null, currTag = null, lastLineTag = false;
            var globalInfo = {};
            var transactions = [];
            var tranIndex = -1;
            
            // Goes through the list of objects (tag-content) and creates transactions objects
            for (var i = 0; i < tagsAndLines.length; i++) {
                var obj = tagsAndLines[i];
                currTag = Object.keys(obj)[0];

                // If current tag is 20 get the account owner value
                if (currTag === "20") {
                    if (!globalInfo.hasOwnProperty("account_owner")){
                        globalInfo["account_owner"] = obj[currTag];   
                    }
                }
                // If current tag is 25 get the account mapping key
                if (currTag === "25") {
                    if (!globalInfo.hasOwnProperty("account_mapping_key")){
                        // var brojRacuna = obj[currTag];
                        // var duzinaUzetogRacuna = brojRacuna.length;
                        // for (var i = 0; i < 13 - duzinaUzetogRacuna; i++) {
                        //     brojRacuna = "0" + brojRacuna;
                        // }
                        // // var kontrolniBroj = 98 - (parseInt("170" + brojRacuna) * 100 % 97); // Javascript pravi problem prilikom odredjivanja ostatka velikog broja (18 cifara)
                        // // globalInfo["account_mapping_key"] = "170-" + brojRacuna + "-" + kontrolniBroj;
                        // globalInfo["account_mapping_key"] = "170-" + brojRacuna + "-61";
                        globalInfo["account_mapping_key"] = obj[currTag];
                    }
                }
                // If current tag is 61, create new transaction object and push it into the list
                if (currTag === "61") {
                    tranIndex++;
                    var groups = obj[currTag].match(util["tags"]["tag_" + currTag].pattern);
                    var temp = {
                        "credit_debit": groups[1],
                        "tran_amount": parseFloat(groups[2].replace(",",".")),
                        "tran_type": groups[3], 
                        "tran_date": parseDate(groups[4])
                    };
                    transactions.push(temp);
                }
                // If current tag is 86 and last line was tag, remove last created transaction (case when transaction is sum of transactions)
                if (currTag === "86" && lastLineTag) {
                    transactions.pop();
                    tranIndex--;
                }
                // If current tag is N/A and last tag is 61, get the account id from transaction
                if (currTag === "N/A" && lastTag === "61") {
                    transactions[tranIndex]["acctid"] = obj[currTag].replace("//", ""); // Mozda treba promeniti acctid da cita iz 86_3 taga
                }
                if (currTag === "86_1") {
                    transactions[tranIndex]["payee"] = obj[currTag].trim();
                }
                if (currTag === "86_2") {
                    transactions[tranIndex]["purpose"] = obj[currTag].trim();
                }
                if (currTag === "86_3") {
                    var grps = obj[currTag].match(util["tags"]["tag_" + currTag].pattern);
                    transactions[tranIndex]["acc"] = grps[1];
                    transactions[tranIndex]["purpose_code"] = grps[2];
                }
                // If current tag is not N/A, set lastTag variable to current tag and lastLineTag variable to true
                if (currTag !== "N/A") {
                    lastTag = currTag;
                    lastLineTag = true;
                } else {
                    lastLineTag = false;
                }
            }

            // Creating account statement
            var accountStatement = context.output.createNewAccountStatement();
            accountStatement.accountMappingKey = globalInfo["account_mapping_key"];
            log.debug({
                title: "Adding a new account statement",
                details: accountStatement
            });
            var accountStatementId = context.output.addAccountStatement({
                parsedAccountStatement: accountStatement
            });
            log.debug({
                title: "New account statement ID",
                details: accountStatementId
            });

            // Creating and adding transactions - Going through the transactions list
            for (var i = 0; i < transactions.length; i++) {
                var tran = transactions[i];
                var transaction = context.output.createNewTransaction();
                transaction.accountStatementId = accountStatementId;
                transaction.amount = tran["tran_amount"];
                transaction.date = tran["tran_date"];
                transaction.transactionMappingKey = (tran["credit_debit"] === "C") ? "credit" : "debit";

                // Hack NetSuite to show vendor name in MatchBankData
                if (transaction.transactionMappingKey === "credit") {
                    transaction.payee = tran["payee"];
                    transaction.customerName = globalInfo["account_owner"];
                } else {
                    transaction.payee = tran["payee"];
                    transaction.customerName = globalInfo["account_owner"];
/*
                    transaction.payee = globalInfo["account_owner"];
                    transaction.customerName = tran["payee"];
*/
                }

                transaction.memo = tran["purpose"];
                // transaction.currency = 
                // transaction.transactionNumber = ;
                // transaction.customerRawId = ;
                // transaction.invoices = ;

                log.debug({
                    title: "Adding a new transaction",
                    details: transaction
                });

                context.output.addTransaction({ parsedTransaction: transaction });
            }
        },
        getStandardTransactionCodes: function (context) {
            try{
                var tranCodes = {
                    "credit": "CREDIT",
                    "debit": "DEBIT"
                }

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
