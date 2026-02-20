###### RESTLET createCustomer

URL
```http request
https://2286462.restlets.api.netsuite.com/app/site/hosting/restlet.nl?script=367&deploy=3
```

requestBody

| Parametar                | Description | Required |Type |
|--------------------------|---|---|---|
|companyname               | Ime kompanije - fizičkog lica      | y | string |
|subsidiary                | Primarni subsidiary - id           | y | integer |
|isindividual              | Da li je fizičko lice              | y | true/false |
|custentity_matbrpred      | Matični broj u APR / JMBG za FL    | n | string |
|custentity_pib            | PIB                                | n | string |
|custentity_cus_inokupac   | INO kupac/lice                     | y | true/false |
|email                     | eMail adresa (jedna)               | n | string |
|url                       | website                            | n | string |
|address                   | LISTA ADRESA                       | n | Array |
|currency                  | Primarna valuta - obavezna za ino  | n,y | ISO code |
|mobilephone               | Mobilni - samo za FL               | n | string |
|phone                     | Telefonski broj                    | n | string |
|fax                       | Fax                                | n | string |
|altphone                  | Dodatni telefon                    | n | string |
|receivableaccount         | Konto kupca                        | n | string (konto) |
           

POST JSON :
```json
{
    "companyname" : "SprintNT",
    "subsidiary" : 9,
    "custentity_matbrpred" : "200200200",
    "custentity_pib" : "100100100",
    "custentity_cus_inokupac" : false,
    "isindividual" : false,
    "email" : "prodaja@dummy.com",
    "url" : "http://www.sprintnt.com",
    "phone" : "021-555-555",
    "altphone" : "063-555-5555",
    "receivableaccount": "20400",
    "currency": "RSD",
    "address" : [
        {
            "label" : "Kancelarija",
            "country" : "RS",
            "city" : "Novi Sad",
            "zip" : "21000",
            "addr1" : "Bulevar cara Lazara 42",
            "addr2" : "Lokal u prizmemlju"
        },
        {
            "label" : "Radionica",
            "country" : "RS",
            "city" : "Novi Sad",
            "addr1" : "Dr. Ivana Ribara 1"
        }
    ]
}
```

GET REST
```http request
https://2286462.restlets.api.netsuite.com/app/site/hosting/restlet.nl?script=367&deploy=3&customerid=43190
```

DELETE REST
```http request
https://2286462.restlets.api.netsuite.com/app/site/hosting/restlet.nl?script=367&deploy=3&customerid=43190
```


### SuiteScript

[View Source](src/FileCabinet/SuiteScripts/INFS/CRM2ERP/snt_rl_new_customer.js)