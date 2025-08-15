/**
 * @NApiVersion 2.1
 */
define(['N/https','N/search'],
    /**
 * @param https
     * @param search
 */
    (https,search) => {

        const getConfig = (options) => {
            let retConfig = {
                "companyName" : "",
                "bankAccount" : "",
                "paymentCode" : "",
                "folder" : 0
            }

            // create search for options.name in customrecord_nbs_qr_config
            const configSearch = search.create({
                type: 'customrecord_nbs_qr_config',
                filters: [
                    search.createFilter({
                        name: 'name',
                        operator: search.Operator.IS,
                        values: options.name
                    })
                ],
                columns: [
                    'custrecord_nbs_qr_folder',
                    'custrecord_nbs_qr_company_name',
                    'custrecord_nbs_qr_bank_account',
                    'custrecord_nbs_qr_payment_code'
                ]
            });

            const searchResults = configSearch.run().getRange({ start: 0, end: 1 });
            if (searchResults.length > 0) {
                retConfig.companyName = searchResults[0].getValue('custrecord_nbs_qr_company_name');
                retConfig.bankAccount = searchResults[0].getValue('custrecord_nbs_qr_bank_account');
                retConfig.paymentCode = searchResults[0].getValue('custrecord_nbs_qr_payment_code');
                retConfig.folder = searchResults[0].getValue('custrecord_nbs_qr_folder');
            }

            return retConfig;

        }


        const generateQR = (invoice,configQr) => {

            const amount = invoice.getValue('total');
            const tranid = invoice.getValue('tranid');

            let payload = {
                "K": "PR",
                "V": "01",
                "C": "1",
                "R": configQr.bankAccount,
                "N": configQr.companyName,
                "I": "RSD"+ amount.toLocaleString('sr-SR').replace('.',''),
                "SF": configQr.paymentCode,
                "S": "UPLATA PO RAČUNU: " + tranid
            }
            const header = {
                'Content-Type': 'application/json'
            };

            const response = https.post({
                url: 'https://nbs.rs/QRcode/api/qr/v1/gen',
                headers: header,
                body: JSON.stringify(payload)
            });

            log.debug({
                title: 'NBS Response',
                details: response
            });

            return response.body;
        }

        return {
            generateQR: generateQR,
            getConfig:getConfig
        }

    });
