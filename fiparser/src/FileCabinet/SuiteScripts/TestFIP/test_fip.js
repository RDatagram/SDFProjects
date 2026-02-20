/**
 * @NApiVersion 2.1
 * @NScriptType fiParserPlugin
 */
define(['N/query', 'N/url'],
    function (query, url) {
        // internal function used to load configuration for this plugin from a custom record
        function loadConfiguration(configurationId) {
/*
            const queryObj = query.create({
                type: 'customrecord_sampleconfig',
                columns: [{fieldId: 'custrecord_memoprefix'}],
                condition: {
                    fieldId: 'custrecord_configurationid',
                    operator: query.Operator.IS,
                    values: [configurationId]
                }
            });

            return queryObj.run().results[0];
            */

            return {
                "custrecord_memoprefix" : "MMPFX"
            }
        }

        function getConfigurationPageUrl(context) {
            const configurationId = context.pluginConfiguration.getConfigurationFieldValue({fieldName: "configuration_id"});
            context.configurationPageUrl = url.resolveScript({
                scriptId: 'customscript_configuration_suitelet',
                deploymentId: 'customdeploy_configuration_deployment',
                params: {
                    configurationId: configurationId
                }
            });
        }

        function parseData(context) {
            //const configurationId = context.pluginConfiguration.getConfigurationFieldValue({fieldName: "configuration_id"});
            const configurationId = -1;
            const configuration = loadConfiguration(configurationId)
            let data = JSON.parse(context.inputData.getContents());

/*
            let data = {
                    "accounts": [
                        {
                            "accountId": "ACCOUNT1",
                            "employeeId": "EMPLOYEE1",
                            "cardHolder": "Card Holder",
                            "dataAsOfDate": "2020-07-01",
                            "openingBalance": 0.0,
                            "closingBalance": 100.0,
                            "currentBalance": 100.0,
                            "dueBalance": 100.0,
                            "transactions": [
                                {
                                    "date": "2021-10-11",
                                    "amount": 145.35,
                                    "transactionTypeCode": "CHARGE",
                                    "uniqueId": "TRN001",
                                    "id": "CHK001",
                                    "payee": "A Customer",
                                    "currency": "USD",
                                    "memo": "4DK73601FH742963R",
                                    "transactionStatus": "Posted",
                                    "customerReferenceId": "CUST01",
                                    "invoiceReferenceIds": ["101", "102"],
                                    "billedTaxAmount": 10.0,
                                    "localChargeAmount": 100.0,
                                    "currencyExchangeRate": 1.0,
                                    "expenseCode": "CC"
                                }
                            ]
                        }
                    ]
                }
*/

            for (let accountIndex = 0; accountIndex < data.accounts.length; accountIndex++) {
                const account = data.accounts[accountIndex];

                let accountData = context.createAccountData({
                    accountId: account.accountId,
                    //employeeId: account.employeeId,
                    //cardHolder: account.cardHolder,
                    dataAsOfDate: account.dataAsOfDate,
                    //openingBalance: account.openingBalance,
                    //closingBalance: account.closingBalance,
                    //currentBalance: account.currentBalance,
                    //dueBalance: account.dueBalance
                });

                for (let transactionIndex = 0; transactionIndex < account.transactions.length; transactionIndex++) {
                    let transaction = account.transactions[transactionIndex];
                    accountData.createNewTransaction({
                        date: transaction.date,
                        amount: transaction.amount,
                        transactionTypeCode: transaction.transactionTypeCode,
                        uniqueId: transaction.uniqueId,
                        id: transaction.id,
                        payee: transaction.payee,
                        currency: transaction.currency,
                        memo: transaction.memo,
                        transactionStatus: transaction.transactionStatus,
                        customerReferenceId: transaction.customerReferenceId,
                        invoiceReferenceIds: transaction.invoiceReferenceIds,
                        billedTaxAmount: transaction.billedTaxAmount,
                        localChargeAmount: transaction.localChargeAmount,
                        currencyExchangeRate: transaction.currencyExchangeRate,
                        expenseCode: transaction.expenseCode
                    });
                }
            }
        }

        function getStandardTransactionCodes(context) {
            context.createNewStandardTransactionCode({
                transactionCode: 'CHARGE',
                transactionType: 'CREDIT'
            });
        }

        function getExpenseCodes(context) {
            context.createNewExpenseCode({
                code: 'CC',
                description: 'Customer Credit'
            });
        }

        return {
            getConfigurationPageUrl: getConfigurationPageUrl,
            parseData: parseData,
            getStandardTransactionCodes: getStandardTransactionCodes,
            getExpenseCodes: getExpenseCodes
        }
    });