/**
 * @NApiVersion 2.1
 * @NScriptType fiConnectivityPlugin
 * @NModuleScope SameAccount
 */
define(['N/search'],
    function (search) {

        // internal function used to load configuration for this plug-in from a custom record
        function loadConfiguration(configurationId) {
            const searchResults = search.create({
                type: 'customrecord_sampleconfig',
                filters: [{
                    name: 'custrecord_configurationid',
                    operator: 'is',
                    values: [configurationId]
                }]
            });
            return searchResults.run().getRange({start: 0, end: 1});
        }

        function getConfigurationIFrameUrl(context) {
            const configurationId = context.pluginConfiguration.getConfigurationFieldValue({fieldName: "configuration_id"});
            context.configurationIFrameUrl = "/app/site/hosting/scriptlet.nl?script=1&deploy=1&configurationId=" + configurationId;
        }

        function getAccounts(context) {
            //const configurationId = context.pluginConfiguration.getConfigurationFieldValue({fieldName: "configuration_id"});
            //const configuration = loadConfiguration(configurationId);
            context.addAccount({
                accountMappingKey: "ACCOUNT1",
                displayName: "Checking (XXXX11)",
                accountType: "BANK",
                currency: "USD",
                groupName: "Bank of America",
                lastUpdated: "2020-06-30T01:23:45"
            });
        }

        function getTransactionData(context) {
            //const configurationId = context.pluginConfiguration.getConfigurationFieldValue({fieldName: "configuration_id"});
            //const configuration = loadConfiguration(configurationId)
            let accountRequests = JSON.parse(context.accountRequestsJSON);
            if (accountRequests != null) {
                accountRequests.forEach(function (accountRequest) {
                    const accountId = accountRequest.accountMappingKey;
                    const fromDateTime = accountRequest.dataStartTime;
                    const toDateTime = accountRequest.dataEndTime;

                    let downloadedData =
                        {
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
                        };

                    context.addDataChunk({dataChunk: JSON.stringify(downloadedData)});
                });
            }
            context.returnAccountRequestsJSON({accountsJson: context.accountRequestsJSON});
        }

        return {
            getConfigurationIFrameUrl: getConfigurationIFrameUrl,
            getAccounts: getAccounts,
            getTransactionData: getTransactionData
        }
    });