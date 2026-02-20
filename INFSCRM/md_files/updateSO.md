##### RESTLET Update Sales Order

```http request
https://5441881-sb1.restlets.api.netsuite.com/app/site/hosting/restlet.nl?script=836&deploy=1

script=836
deploy=1
```

JSON

| field              | description                                          | values                     |
|--------------------|------------------------------------------------------|----------------------------|
| internalid | Interni ID Sales Order u NetSuite | integer |
| startdate | Start DATE | string (dd.mm.yyyy) |
| enddate | End DATE | string (dd.mm.yyyy) |


POST JSON
```json
{
    "internalid" : 39824,
    "startdate" : "01.05.2021",
    "enddate" : "15.05.2021"
}


```
### SuiteScript

[View Source](src/FileCabinet/SuiteScripts/INFS/CRM2ERP/rsm_rl_update_so.js)