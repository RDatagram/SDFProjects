##### RESTLET NotifyList

URL :
```http request
https://2286462.restlets.api.netsuite.com/app/site/hosting/restlet.nl?script=602&deploy=1
```
POST JSON :
```json
{
"description" : "Not Required",
"email_to" : "ispravana@mail.com",
"email_cc" : "ispravancc@mail.com;drugimail@gmail.com",
"custrecord_rsm_custnp_location" : [1,2,3],
"customer" : 1375
}
```

GET REST
```http request
https://2286462.restlets.api.netsuite.com/app/site/hosting/restlet.nl?script=602&deploy=1&contactid=1
```

DELETE REST
```http request
https://2286462.restlets.api.netsuite.com/app/site/hosting/restlet.nl?script=602&deploy=1&contactid=1
```

TABLE SEARCH
```http request
https://2286462.restlets.api.netsuite.com/app/site/hosting/restlet.nl?script=366&deploy=1
```
```json
{
   "type": "customrecord_rsm_cust_notif_param",
   "filters":
   [
      {"name":"custrecord_rsm_custnp_location","operator" : "anyof","values":["7"]}, 
      {"name":"custrecord_rsm_custnp_customer","operator":"anyof","values":["35603"]}
   ],
   "columns":
   [
    {"name" : "custrecord_rsm_custnp_location"},
    {"name" : "custrecord_rsm_custnp_description"},
    {"name" : "custrecord_rsm_custnp_mailto"},
    {"name" : "custrecord_rsm_custnp_mailcc"}
   ]
}
```

### SuiteScript

[View Source](src/FileCabinet/SuiteScripts/INFS/CRM2ERP/rsm_rl_new_notifylist.js)
