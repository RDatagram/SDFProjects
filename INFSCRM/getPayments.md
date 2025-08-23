##### RESTLET Get Payments

URL :
```http request
https://2286462.restlets.api.netsuite.com/app/site/hosting/restlet.nl?script=829&deploy=1

script : 829
deploy : 1
```
POST JSON :
```json
{
    "subsidiaryId" : 17,
    "startDate" : "01.01.2020",
    "endDate" : "30.03.2021"
}
```

RESPONSE JSON :
```json
{
  "paymentdata": [
    {
      "recordType": "customerdeposit",
      "lastmodifieddate": "02.12.2020 15:39",
      "trandate": "12.10.2020",
      "customer": "23953",
      "line": "0",
      "tranid": "8153",
      "amount": "108000.00",
      "salesorder": "4101",
      "appliedtotransaction": "Sales Order #38"
    },
    {
      "recordType": "customerdeposit",
      "lastmodifieddate": "02.12.2020 15:39",
      "trandate": "12.10.2020",
      "customer": "59",
      "line": "0",
      "tranid": "8154",
      "amount": "107100.00",
      "salesorder": "4102",
      "appliedtotransaction": "Sales Order #39"
    },
    {
      "recordType": "customerpayment",
      "lastmodifieddate": "02.12.2020 15:39",
      "trandate": "12.10.2020",
      "customer": "16656",
      "line": "1",
      "tranid": "8155",
      "amount": "72000.00",
      "salesorder": "4104",
      "appliedtotransaction": "Invoice #63"
    },
    {
      "recordType": "customerpayment",
      "lastmodifieddate": "02.12.2020 15:40",
      "trandate": "12.10.2020",
      "customer": "29308",
      "line": "1",
      "tranid": "8156",
      "amount": "41580.00",
      "salesorder": "4105",
      "appliedtotransaction": "Invoice #62"
    }
  ]
}
```

### SuiteScript

[View Source](src/FileCabinet/SuiteScripts/INFS/CRM2ERP/rsm_get_payments.js)
