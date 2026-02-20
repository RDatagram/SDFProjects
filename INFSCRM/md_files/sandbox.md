##### Application - Sandbox

#### NetSuite ACCOUNT SANDBOX InfoStud
| NETSUITE_ACCOUNT |
| ---- |
| 5441881_SB1 |

| Consumer Key / Client ID |
|----|
| 57de06c5bcc7481aee9a1eaab2c53a8ef0af874993daab3d84107ca27bb58ac8 |

| Consumer Secret / Client Secret |
|----|
| 3f50cb57ec1df8227217a384a5129c38bd5773225d7f7ef145903f1d72706395 |

#### Developer - SandBox

| Token Id |
|----|
| 3b3d5ad02a735143d04bd34ab4a54f4c5c7bad298dc7a1d45cf5bbe963297a2e |

| Token Secret |
|----|
| 6e71501f25e551e03beced2c552c5422366a62eaffe266feebb043ba8d101773 |

#### WebStorm 2021-10-05

| Token Id |
|----|
| c655ed06b531629b406750bef0118d2da6206e967ec95cff6d1b7a184b792fa5 |

| TOKEN SECRET |
|----|
| d973a66c299de57a9ee8568e144fab1ec4e9d5ac8788d1d2b67f7ba2acbcebe2 |

#### Integracija - Sandbox

| Token Id |
|----|
| b1709e591346529a4a365a79097f512000fc1b2d3d215179453bc216ff6072f4 |

| Token Secret |
|----|
| d3ece005dfc7a1ebb89d6f46aa2f1c56bc50c3095443856f1cbe5737a10005c4 |


---

##### Get payments
```http request
https://5441881-sb1.restlets.api.netsuite.com/app/site/hosting/restlet.nl?script=608&deploy=1
```

##### Get PDF
```http request
https://5441881-sb1.restlets.api.netsuite.com/app/site/hosting/restlet.nl?script=609&deploy=1
```

##### Get Record
```http request
https://5441881-sb1.restlets.api.netsuite.com/app/site/hosting/restlet.nl?script=610&deploy=1
```

##### Get SalesOrder Meta
```http request
https://5441881-sb1.restlets.api.netsuite.com/app/site/hosting/restlet.nl?script=611&deploy=1
```

##### Create Contact
```http request 
https://5441881-sb1.restlets.api.netsuite.com/app/site/hosting/restlet.nl?script=612&deploy=1
```

##### Integration - new item V1
```http request
https://5441881-sb1.restlets.api.netsuite.com/app/site/hosting/restlet.nl?script=613&deploy=1
```

##### Create Customer NotifyList
```http request
https://5441881-sb1.restlets.api.netsuite.com/app/site/hosting/restlet.nl?script=614&deploy=1
```

##### Create SO
```http request
 https://5441881-sb1.restlets.api.netsuite.com/app/site/hosting/restlet.nl?script=615&deploy=1
```

##### Update Item
```http request
https://5441881-sb1.restlets.api.netsuite.com/app/site/hosting/restlet.nl?script=616&deploy=1
```

##### Get Table
```http request
https://5441881-sb1.restlets.api.netsuite.com/app/site/hosting/restlet.nl?script=617&deploy=1
```

#####  Restlet SuiteQL
```http request
https://5441881-sb1.restlets.api.netsuite.com/app/site/hosting/restlet.nl?script=618&deploy=1
```

##### Restlet New Customer
```http request
https://5441881-sb1.restlets.api.netsuite.com/app/site/hosting/restlet.nl?script=620&deploy=1 
```

##### Restlet Customers search
```http request
https://5441881-sb1.restlets.api.netsuite.com/app/site/hosting/restlet.nl?script=621&deploy=1
```

##### Restlet Customers
```http request
https://5441881-sb1.restlets.api.netsuite.com/app/site/hosting/restlet.nl?script=622&deploy=1
```

##### Restlet Items search
```http request
https://5441881-sb1.restlets.api.netsuite.com/app/site/hosting/restlet.nl?script=623&deploy=1
```

##### Restlet Update Sales Order
```http request
https://5441881-sb1.restlets.api.netsuite.com/app/site/hosting/restlet.nl?script=836&deploy=1
```

---


#### LISTA

| Name | Script ID | Script JS | Internal ID |
|-----------|-----|-----|---|
| INFS : Restlet Get Payments           | customscript_rsm_get_payments             | rsm_get_payments.js         | 608 |
| INFS : Restlet Get PDF File           | customscript_rsm_rl_get_pdf               | rsm_rl_get_pdf.js           | 609 |
| INFS : Restlet Get Record             | customscript_rsm_rl_get_record            | rsm_rl_get_record.js        | 610 |
| INFS : Restlet Get SalesOrder Meta    | customscript_rsm_rl_get_so_meta           | rsm_rl_get_so_meta.js       | 611 |
| INFS : Create Contact - integracija   | customscript_rsm_rl_new_contact           | rsm_rl_new_contact.js       | 612 |
| INFS : Integration - new item V1      | customscript_rsm_rl_new_item_v1           | rsm_rl_new_item_v1.js       | 613 |
| INFS : Create Customer NotifyList     | customscript_rsm_rl_new_notifylist        | rsm_rl_new_notifylist.js    | 614 |
| INFS : Create SO RESTLET              | customscript_rsm_rl_new_salesorder_v1     | rsm_rl_new_salesorder_v1.js | 615 |
| INFS : Update Item Restlet            | customscript_rsm_rl_update_item           | rsm_rl_update_item_v1.js    | 616 |
| INFS : Restlet Get Table              | customscript_snt_rl_get_table             | snt_ss_table.js             | 617 |
| INFS : Restlet SuiteQL                | customscript_snt_rl_suiteql               | snt_rl_suiteql.js           | 618 |
| INFS : Restlet New Customer           | customscript_rl_new_customer              | snt_rl_new_customer.js      | 620 |
| INFS : Restlet Customers search       | customscript_snt_rl_cusotmers_ss          | snt_ss_customers.js         | 621 |
| INFS : Restlet Customers              | customscript_snt_rl_customers             | snt_rl_customers.js         | 622 | 
| INFS : Restlet Items search           | customscript_snt_rl_items_ss              | snt_ss_items.js             | 623 |
| INFS : Update SO Restlet              | customscript_rsm_update_so                | rsm_rl_update_so.js         | 836 |
| INFS : OLD CRM Invoice Payments       | customscript_rsm_oldcrm_payments          | rsm_rl_oldcrm_payments.js   | 837 |
| INFS : Restlet Update Customer        | customscript_rsm_rl_upd_customer          | rsm_rl_upd_customer.js      | 854 |
| INFS : Restlet Get Invoice Meta       | customscript_rsm_rl_get_inv_meta          | rsm_rl_get_inv_meta.js      | 873 |	
	
	
	
	
	
	
