##### RESTLET UpdateCustomer

URL :
```http request
https://5441881-sb1.restlets.api.netsuite.com/app/site/hosting/restlet.nl?script=854&deploy=1

Sandbox
scriptid=854

```
POST JSON :
```json
{
"internalid" : 430,
"companyname" : "Test Customer",
"address" : [
{
"label" : "Kancelarija",
"country" : "RS",
"city" : "Novi Sad",
"zip" : "21000",
"addr1" : "Bulevar cara Lazara 42",
"addr2" : "Lokal u prizmemlju"
}
]
}
```

### SuiteScript

[View Source](src/FileCabinet/SuiteScripts/INFS/CRM2ERP/rsm_rl_upd_customer.js)
