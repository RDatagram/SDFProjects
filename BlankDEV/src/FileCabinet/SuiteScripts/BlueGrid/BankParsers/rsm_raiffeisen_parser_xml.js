/**
 * @NApiVersion 2.0
 * @NScriptType bankStatementParserPlugin
 */
define(["N/file", "N/xml", "N/util", "N/log"], function (file, xml, util, log) {

    // Returns array of nodes found by tag name
    function getNodesByTagName(xmlDocument, tagName) {
        var elements = xml.XPath.select({
            node: xmlDocument,
            xpath: "//" + tagName
        });
        return elements;
    }

    // Returns attribute value of a node
    function getAttributeValueFromNode(node, attributeName) {
        return node.getAttribute({
            name : attributeName
        });
    }

    function parseDate(date) {
        return date.substr(6, 4) + "-" + date.substr(3, 2) + "-" + date.substr(0, 2);
    }

    return {
        parseBankStatement: function (context) {
            
            var xmlString = context.input.file.getContents();

            // try{
                var xmlDocument = xml.Parser.fromString({
                    text: xmlString
                });

                var zaglavlje = getNodesByTagName(xmlDocument, "Zaglavlje")[0];
                var stavke = getNodesByTagName(xmlDocument, "Stavke");

                var datum = getAttributeValueFromNode(zaglavlje, "DatumIzvoda");
                var komitent = getAttributeValueFromNode(zaglavlje, "KomitentNaziv");
                var komitentAdresa = getAttributeValueFromNode(zaglavlje, "KomitentAdresa");
                var komitentMesto = getAttributeValueFromNode(zaglavlje, "KomitentMesto");
                var accountImport = getAttributeValueFromNode(zaglavlje, "Partija");

                var accountStatement = context.output.createNewAccountStatement();
                accountStatement.accountMappingKey = accountImport.substr(0,accountImport.length-2);
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

                util.each(stavke, function(tran){

                    var nalogKorisnik = getAttributeValueFromNode(tran, "NalogKorisnik");
                    var mesto = getAttributeValueFromNode(tran, "Mesto");
                    var accId = getAttributeValueFromNode(tran, "BrojRacunaPrimaocaPosiljaoca");
                    var opis = getAttributeValueFromNode(tran, "Opis");
                    var sifraPlacanja = getAttributeValueFromNode(tran, "SifraPlacanja");
                    var duguje = getAttributeValueFromNode(tran, "Duguje");
                    var potrazuje = getAttributeValueFromNode(tran, "Potrazuje");
                    var pozivNaBroj = getAttributeValueFromNode(tran, "PozivNaBrojKorisnika");

                    var amount = null, creditDebit = null;
                    if (duguje !== "0") {
                        amount = duguje;
                        creditDebit = "debit";
                    } else {
                        amount = potrazuje;
                        creditDebit = "credit";
                    }

                    var transaction = context.output.createNewTransaction();
                    transaction.accountStatementId = accountStatementId;
                    transaction.amount = amount;
                    transaction.date = parseDate(datum);
                    transaction.transactionMappingKey = creditDebit;

                    // HACK - Show vendor name in MatchBankData
                    if (transaction.transactionMappingKey === 'credit') {
                        transaction.payee = nalogKorisnik + ", " + mesto;
                        transaction.customerName = komitent;
                    } else {
                        transaction.payee = nalogKorisnik + ", " + mesto;
                        transaction.customerName = komitent;
                        /*
                        transaction.payee = komitent;
                        transaction.customerName = nalogKorisnik + ", " + mesto;
                         */
                    }
                    transaction.memo = sifraPlacanja + ":" + opis;
                    // transaction.currency = ;
                    // transaction.transactionNumber = ;
                    // transaction.customerRawId = ;
                    // transaction.invoices = ;

                    // log.debug({
                    //     title: "Transaction",
                    //     details: tran
                    // });

                    context.output.addTransaction({ parsedTransaction: transaction });
                    return true;
                });
            // } catch(e) {
            //     var userEmail = runtime.getCurrentUser().email;
            //     email.send({
            //         author: -5,
            //         recipients: userEmail,
            //         subject: "Greska prilikom upload-a dnevnog izvoda banke",
            //         body:   "Doslo je do greske prilikom parsiranja dnevnog izvoda banke. Proverite encoding fajla (mora biti UTF-8).\n" + 
            //                 "Takodje, proverite da li se broj racuna vase firme u sistemu podudara sa brojem racuna u fajlu.\n\n" +
            //                 "Error message:" + e.toString()

            //     });
            // }
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
