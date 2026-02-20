##### RESTLET Get Payments OLDCRM Invoice

URL :
```http request
https://2286462.restlets.api.netsuite.com/app/site/hosting/restlet.nl?script=837&deploy=1

script : 837
deploy : 1
```
POST JSON :
```json
{
    "subsidiaryId" : 8,
    "startDate" : "01.01.2020",
    "endDate" : "30.03.2022"
}
```

RESPONSE JSON :
```json
{
  "paymentdata": [
    {
      "recordType": "customerpayment",
      "lastmodifieddate": "17.05.2021 13:53",
      "trandate": "26.02.2021",
      "customer": "35605",
      "line": "1",
      "tranid": "18931",
      "amount": "7402.00",
      "invoice_old_crm_id": "555-OLDCRM",
      "appliedtotransaction": "Invoice #980"
    }
  ]
}
```

### SuiteScript

[View Source](src/FileCabinet/SuiteScripts/INFS/CRM2ERP/rsm_rl_oldcrm_payments.js)
