##### RESTLET NotifyList

URL :
```http request
https://2286462.restlets.api.netsuite.com/app/site/hosting/restlet.nl?script=customscript_rsm_rl_get_inv_meta&deploy=1

script=customscript_rsm_rl_get_inv_meta (nije greska, moze ScriptID umesto internalID
deploy=1
```

POST JSON : (SandBox)
```json
{
"invoiceId" : 651
}
```

RESPONSE JSON
```json
{
    "invoicedata": [
        {
            "recordType": "invoice",
            "id": "651",
            "values": {
                "trandate": "30.03.2021",
                "custbody_cust_dep_pdf_file": [
                    {
                        "value": "17818",
                        "text": "PDF faktura - invoice:651"
                    }
                ]
            }
        },
        {
            "recordType": "depositapplication",
            "id": "652",
            "values": {
                "trandate": "30.03.2021",
                "appliedtotransaction.custbody_cust_dep_pdf_file": [
                    {
                        "value": "47146",
                        "text": "PDF faktura - deposit:650"
                    }
                ],
                "appliedtotransaction": [
                    {
                        "value": "650",
                        "text": "Customer Deposit #18"
                    }
                ]
            }
        }
    ]
}
```

### SuiteScript

[View Source](src/FileCabinet/SuiteScripts/INFS/CRM2ERP/rsm_rl_get_inv_meta.js)
