##### RESTLET TableSearch

TABLE SEARCH
```http request
https://5441881-sb1.restlets.api.netsuite.com/app/site/hosting/restlet.nl?script=610&deploy=1
```

POST JSON :
```json
{
  "type" : "vendor",
  "columns" : [
    {"name" : "entityid"},
    {"name" : "custentity_pib"},
    {"name" : "custentity_matbrpred"}
  ],
  "filters" : [
    {"name":"custentity_pib","operator" : "contains","values":["100563059"]}
  ]
}
```

###### Neplacene fakture  - Dugovanja po Customer-u
```json
{
  "type": "invoice",
  "filters":
  [
    {"name":"type","operator":"anyof","values":["CustInvc"]},
    {"name":"mainline","operator":"is","values":["T"]},
    {"name":"amountremainingisabovezero","operator":"is","values":["T"]},
    {"name":"subsidiary","operator":"is","values":["8"]}
  ],
  "columns":
  [
    {
      "name": "entityid",
      "join" : "customer",
      "summary": "GROUP",
      "label": "ID"
    },
    {
      "name": "companyname",
      "join" : "customer",
      "summary": "GROUP",
      "label": "Name"
    },

    {
      "name": "amount",
      "summary": "SUM",
      "label": "Amount"
    },
    {
      "name": "amountremaining",
      "summary": "SUM",
      "label": "Amount Remaining"
    },
    {
      "name": "custentity_pib",
      "join": "customer",
      "summary": "GROUP",
      "label": "PIB"
    }
  ]
}
```