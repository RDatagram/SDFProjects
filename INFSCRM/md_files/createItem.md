##### RESTLET createItem

URL
```http request
https://2286462.restlets.api.netsuite.com/app/site/hosting/restlet.nl?script=588&deploy=1
```

JSON

| field              | description                                          | values                     |
|--------------------|------------------------------------------------------|----------------------------|
| externalid | Jedinstveni podatak                                  | *                          |
| itemtype | Definiše tip item, da li je roba ili usluga (servis) | "inventoryitem" <br/> "serviceitem" |
| isspecialorderitem | Item koji se naručuje nakon kreiranja SO             | false, true |
| itemid | Jedinstvena oznaka u NetSuite (oznaka)               | integer |
| displayname        | Tekst koji se pojavljuje kao opis                    | string |
| unitstype          | Jedinica mere (iz liste unitstype)                   | integer |
| subsidiary         | Interni ID subsidiary koji kreira item               | integer |
| custitem_rsm_item_cai_broj | CAI oznaka | string |
| vendors | Dobavljači za artikal (obavezno kod special order item | _Array_ |

Vendors

| field | description | value|
|---|---|---|
| vendorid | Internal ID vendor | integer |
| subsidiary | Internal ID subsidiary | integer |
| preferred | Da li je dobavljač preporučeni | true/false |
| purhcaseprice | Očekivana cena kod nabavke | numeric |

POST JSON :
###### inventoryitem
```json
{
    "externalid" : "INV-12345",
    "itemtype" : "inventoryitem",
    "isspecialorderitem" : true,
    "itemid" : "12345 - Test item2",
    "displayname" : "Test item",
    "unitstype" : 1,
    "subsidiary" : 9,
    "custitem_rsm_item_cai_broj" : "123456",
    "vendors" : [
        {
          "vendorid" : 37977,
          "subsidiary" : 9,
          "preferred" : true,
          "purchaseprice" : 1000.00
        },
        {
          "vendorid" : 37166,
          "subsidiary" : 9,
          "preferred" : false,
          "purchaseprice" : 1100.00
        }
    ]
}
```
###### serviceitem
```json
{
    "externalid" : "SVC-12345",
    "itemtype" : "serviceitem",
    "isspecialorderitem" : false,
    "itemid" : "12345 - Test item",
    "displayname" : "Test item",
    "unitstype" : 1,
    "subsidiary" : 9
}
```

GET REST
```http request
https://2286462.restlets.api.netsuite.com/app/site/hosting/restlet.nl?script=588&deploy=1&cid=10736&itemtype=inventoryitem
```

DELETE REST
```http request
https://2286462.restlets.api.netsuite.com/app/site/hosting/restlet.nl?script=588&deploy=1&itemtype=inventoryitem&cid=10736
```

### SuiteScript

[View Source](src/FileCabinet/SuiteScripts/INFS/CRM2ERP/rsm_rl_new_item_v1.js)