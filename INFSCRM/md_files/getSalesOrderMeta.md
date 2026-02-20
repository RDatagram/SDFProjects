
##### RESTLET Get Sales Order Metadata

URL :
```http request
https://2286462.restlets.api.netsuite.com/app/site/hosting/restlet.nl?script=607&deploy=1
```
POST JSON :
```json
{
"orderId" : 22957
}

```

RESPONSE
```json
{
    "orderdata": [
        {
            "recordType": "invoice",
            "id": "20914",
            "values": {
                "custbody_cust_dep_pdf_file": [
                    {
                        "value": "7136",
                        "text": "PDF faktura - invoice:20914"
                    }
                ]
            }
        },
        {
            "recordType": "customerdeposit",
            "id": "20916",
            "values": {
                "custbody_cust_dep_pdf_file": [
                    {
                        "value": "7237",
                        "text": "PDF faktura - deposit:20916"
                    }
                ]
            }
        },
        {
            "recordType": "customsale_rsm_so_estimate",
            "id": "21249",
            "values": {
                "custbody_cust_dep_pdf_file": [
                    {
                        "value": "7359",
                        "text": "PDF faktura - sales order estimate:21249"
                    }
                ]
            }
        },
        {
            "recordType": "customsale_rsm_so_estimate",
            "id": "21250",
            "values": {
                "custbody_cust_dep_pdf_file": [
                    {
                        "value": "7360",
                        "text": "PDF faktura - sales order estimate:21250"
                    }
                ]
            }
        }
    ]
}
```
### SuiteScript

[View Source](src/FileCabinet/SuiteScripts/INFS/CRM2ERP/rsm_rl_get_so_meta.js)
