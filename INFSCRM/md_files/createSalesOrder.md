###### RESTLET createSalesOrder

URL :
```http request
https://2286462.restlets.api.netsuite.com/app/site/hosting/restlet.nl?script=592&deploy=1
```
---                                 
JSON STRUCTURE

requestBody

| Parametar                         | Description                                           | Required | Type                     |
|-----------------------------------|-------------------------------------------------------|----------|--------------------------|
| customer                          | Customer internal ID                                  | YES      | number                   |  
| subsidiary                        | internal ID                                           | YES      | number                   |           
| department                        | internal ID                                           | n        | number                   |             
| location                          | internal ID                                           | n        | number                   |             
| class                             | internal ID                                           | n        | number                   |             
| custbody_rsm_infs_fakturista      | internal ID                                           | n        | number                   |             
| custbody_rsm_infs_representative  | internal ID                                           | n        | number                   |             
| startdate                         | Start date for Service                                | n        | string                   |  
| enddate                           | End date for Service                                  | n        | string                   |     
| trandate                          | Sales order date                                      | YES      | string                   |      
| memo                              | Memo for customer                                     | n        | string                   |        
| itemArray                         | Array of items                                        | YES      | Array                    |        
| parcelArray                       | Array of Courier parcel                               | n        | Array                    | 
| custbody_rsm_crm_ordernum         | External ordernum IPG                                 | n        | string                   |
| custbody_rsm_crm_ordernum_parent  | External ordernum IPG - parent                        | n        | string                   |
| custbody_rsm_internal_memo        | Internal memo - not for customer                      | n        | string                   |
| custbody_rsm_so_type              | Sales order type - from list                          | YES      | string                   |
| custbody_rsm_so_duration          | Service duration (start-end date)                     | n        | number                   |
| custbody_rsm_so_brojrata          | Broj rata za SalesOrder estimates                     | n        | number                   |
| custbody_rsm_additional_cc_email  | Additional cc email                                   | n        | string                   |
| custbody_rsm_additional_bcc_email | Additional bcc email                                  | n        | string                   |
| custbody_rsm_broj_dana_uplata     | Broj dana za uplatu                                   | n        | integer                  |
| custbody_poziv_na_broj            | Reference number                                      | n        | string                   |
| custbody_rsm_sales_delvtype       | Delivery type                                         | n        | string - Lista vrednosti |
| custbody_rsm_sales_payment_type   | Payment type                                          | n        | string - Lista vrednosti |
| terms                             | Terms - Invoice                                       | n        | string - Lista vrednosti |
| custbody_rsm_napomena_za_print    | Memo for printout                                     | n        | string                   |
| email_status                      | Scheduled action for eMail-a (SKIP, MANUAL, SCHEDULE) | n        | string - Lista vrednosti | 
| custbody_rsm_so_duedate           | Due date on Proforma invoice                          | n        | string                   |


requestBody.itemArray

| Parametar                      | Description                                  | Required | Type     | 
|--------------------------------|----------------------------------------------|----------|----------|
| item                           | InternalID of item                           | y        | number   |
| quantity                       | Quantity                                     | y        | number   |
| rate                           | Rate (final price)                           | y        | number   |
| amount                         | Amount without TAX (quantity*rate)           | n        | number   |
| custcol_rsm_package_quantity   | Quantity in package                          | n        | number   |
| custcol_rsm_item_rate_full     | Full rate without discount                   | n (1)    | number   |
| custcol_rsm_item_rate_discount | Discount (%)                                 | n (1)    | number   |
| taxcode                        | TaxCode                                      | n        | number   |
| createpo                       | Create Purchase Order for Item               | n (2)    | boolean  |
| povendor                       | Vendor ID for Purchase Order                 | n (2)    | number   |
| porate                         | Vendor price for Purchase Order              | n (2)    | number   |
| (1)                            | Required when discount exists in the item line |          | komentar |
| (2)                            | Required for SpecialOrder (IPG)              |          | komentar |


requestBody.parcelArray    

| Parameter      | Description       | Type    |   
|----------------|-------------------|---------|
| parcel_service | Courier Service   | string  |   
| parcel_id      | Delivery id       | string  |
| parcel_dc      | Delivery costJSON | number  |

---
JSON

```json

{
  "subsidiary" : 17,
  "customer" : 1375,
  "trandate" : "15.03.2021",
  "department" : 14,
  "location" : 2,
  "class" : 3,
  "memo" : "Test Service SO",
  "custbody_rsm_crm_ordernum" : "NEMA",
  "custbody_rsm_so_type" : "NONE",
  "startdate" : "15.03.2021",
  "enddate" : "17.03.2021",
  "custbody_rsm_infs_representative" : 691,
  "custbody_rsm_infs_fakturista" : 691,
  "custbody_rsm_auth_payment_code" : "Auth code 12345",
  "itemArray" : [
    {
      "item" : 8723,
      "quantity" : 1,
      "rate" : 5000.00,
      "amount" : 5000.00,
      "custcol_rsm_item_rate_discount" : 0,
      "custcol_rsm_item_rate_full" : 5000.00,
      "taxcode" : 8,
      "createpo" : false,
      "povendor" : 37977
    }  ]
}

```
JSON IPG
```json
{
    "subsidiary" : 9,
    "customer" : 1375,
    "trandate" : "20.11.2020",
    "department" : 3,
    "location" : 20,
    "class" : 9,
    "memo" : "Test Full SO",
    "custbody_rsm_crm_ordernum" : "IPG 1234",
    "parcelArray" : [
        {
            "parcel_id" : "PID1",
            "parcel_service" : "BEX",
            "parcel_dc" : 1200.00
        }
    ],
    "itemArray" : [
        {
            "item" : 11336,
            "quantity" : 1,
            "rate" : 5000.00,
            "custcol_rsm_item_rate_discount" : 0,
            "custcol_rsm_item_rate_full" : 5000.00,
            "taxcode" : 8,
            "createpo" : true,
            "povendor" : 37977
        },
        {
            "item" : 11336,
            "quantity" : 1,
            "rate" : 5000.00,
            "custcol_rsm_item_rate_discount" : 0,
            "custcol_rsm_item_rate_full" : 5000.00,
            "taxcode" : 8,
            "createpo" : false
        },
        {
            "item" : 11336,
            "quantity" : 1,
            "custcol_rsm_item_rate_discount" : 10,
            "custcol_rsm_item_rate_full" : 4000.00,
            "rate" : 3600.00,
            "taxcode" : 8,
            "createpo" : true,
            "povendor" : 37166
        }    ]
}

```

GET REST

```http request
https://2286462.restlets.api.netsuite.com/app/site/hosting/restlet.nl?script=592&deploy=1&orderid=18781
```


DELETE REST
```http request
https://2286462.restlets.api.netsuite.com/app/site/hosting/restlet.nl?script=592&deploy=1&orderid=18781
```

TABLE SEARCH
```http request
https://2286462.restlets.api.netsuite.com/app/site/hosting/restlet.nl?script=366&deploy=1
```





### SuiteScript

[View Source](src/FileCabinet/SuiteScripts/INFS/CRM2ERP/rsm_rl_new_salesorder_v1.js)
