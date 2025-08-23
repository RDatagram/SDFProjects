##### RESTLET Update Item

URL :
```http request
https://2286462.restlets.api.netsuite.com/app/site/hosting/restlet.nl?script=613&deploy=1

script = 613
deploy = 1
```

JSON

Requestbody je Array u kojem se ponavlja objekat sa definicijom :

| field              | description                                          | values                     |
|--------------------|------------------------------------------------------|----------------------------|
| itemtype | Definiše tip item, da li je roba ili usluga (servis) | "inventoryitem" <br/> "serviceitem" |
| internalid | Interni ID item-a u NetSuite | integer |
| submethod | Pod-metod koji izvršavamo nad Item | string |
| vendors | Dobavljači za artikal (obavezno kod special order item | _Array_ |

Vendors (submethod = 'ADDVENDOR')

| field | description | value|
|---|---|---|
| vendorid | Internal ID vendor | integer |
| subsidiary | Internal ID subsidiary | integer |
| preferred | Da li je dobavljač preporučeni | true/false |
| purhcaseprice | Očekivana cena kod nabavke | numeric |

SUBMETHOD

| value | description |
|---|---|
| ADDVENDOR | Dodaje u podlistu Vendors (kod specialorderItem)  |

---
POST JSON :
```json
[
  {"itemtype":"inventoryitem",
    "internalid":10232,
    "submethod":"ADDVENDOR",
    "vendors":[
      {"vendorid":38126,"preferred":false,"purchaseprice":1900,"subsidiary":9},
      {"vendorid":37768,"preferred":true,"purchaseprice":1000,"subsidiary":9},
      {"vendorid":38636,"preferred":false,"purchaseprice":1100,"subsidiary":9},
      {"vendorid":74419,"preferred":false,"purchaseprice":1100,"subsidiary":9}
    ]
  },
  {"itemtype":"inventoryitem",
    "internalid":12458,
    "submethod":"ADDVENDOR",
    "vendors":[
      {"vendorid":38126,"preferred":false,"purchaseprice":900,"subsidiary":9},
      {"vendorid":37768,"preferred":true,"purchaseprice":1000,"subsidiary":9},
      {"vendorid":38636,"preferred":false,"purchaseprice":2100,"subsidiary":9},
      {"vendorid":74419,"preferred":false,"purchaseprice":1100,"subsidiary":9}
    ]
  }
]
```

### SuiteScript

[View Source](src/FileCabinet/SuiteScripts/INFS/CRM2ERP/rsm_rl_update_item_v1.js)
