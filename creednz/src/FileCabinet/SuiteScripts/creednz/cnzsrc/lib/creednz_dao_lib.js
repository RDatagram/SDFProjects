/**
 * @NApiVersion 2.1
 */
define(['N/query', 'N/file'],
    /**
     * @param query
     * @param file
     */
    (query, file) => {

        const genQuery = (tableName, lookupField, lookpValue, returnField) => {
            let retObj = {
                found: false,
                idRecord: -1
            };

            let qSql = 'select ' + returnField + ' as recid from ' + tableName + ' where ' + lookupField + ' = ? ';

            const qResultSet = query.runSuiteQL(
                {
                    query: qSql,
                    params: [lookpValue]
                }
            );
            /**
             *
             * @type {Array<Object>}
             * @property recid
             */
            const mapResult = qResultSet.asMappedResults();

            log.debug({
                title: 'genQuery.mapResult',
                details: mapResult
            });
            if (mapResult.length > 0) {
                retObj["found"] = true;
                retObj["idRecord"] = mapResult[0].recid;
            }

            return retObj;
        }

        /**
         *
         * @param code3 Country code 3-letters
         * @return {*|string} Country code 2-letters
         */
        const mapCountry3Code2 = (code3) => {
            const jsonFile = file.load({
                'id': './country_code_map.json'
            });
            const mapTable = JSON.parse(jsonFile.getContents());
            return mapTable[code3] || '';
        }

        const mapAddressFromCreednz = (jsonData) => {
            /*
Billing
{
    country: 'CA', -> normalizedBillingCountry(3 letters) -> 2 letters
    addr1: '2528 Nicklaus Court',  -> billingAddress
    city: 'Burlington',    -> billingCity
    state: 'ON',    -> normalizedBillingRegion (2 letters)
    zip: 'L7M4V1',   -> billingZip
    addressee: 'John Doe',  -> accountingContact
    defaultBilling : true,
    defaultShipping : false
}

----------------------

Business
{
    country: 'CA', -> normalizedBusinessCountry(3 letters) -> 2 letters
    addr1: '2528 Nicklaus Court',  -> businessAddress
    city: 'Burlington',   -> businessCity
    state: 'ON',    -> normalizedBusinessRegion (2 letters)
    zip: 'L7M4V1',   -> businessZip
    addressee: 'John Doe',  -> purchaseContact
    defaultBilling : false,
    defaultShipping : true
}
             */
            const addressBill = {
                country: mapCountry3Code2(jsonData.normalizedBillingCountry),
                addr1: jsonData.billingAddress,
                city: jsonData.billingCity,
                state: jsonData.normalizedBillingRegion,
                zip: jsonData.billingZip,
                addressee: jsonData.accountingContact,
                defaultBilling: true,
                defaultShipping: false
            }

            const addressShip = {
                country: mapCountry3Code2(jsonData.normalizedBusinessCountry),
                addr1: jsonData.businessAddress,
                city: jsonData.businessCity,
                state: jsonData.normalizedBusinessRegion,
                zip: jsonData.businessZip,
                addressee: jsonData.purchaseContact,
                defaultBilling: false,
                defaultShipping: true
            }

            const address = {
                billingAddress: addressBill,
                shippingAddress: addressShip
            }
            return address;
        }


        const addVendorAddress = (vendor,label,addressBilling) => {
            const addressSubrecord = vendor.selectNewLine({
                sublistId: 'addressbook'
            });
            vendor.setCurrentSublistValue({
                sublistId: 'addressbook',
                fieldId: 'label',
                value: label
            });

            vendor.setCurrentSublistValue({
                sublistId: 'addressbook',
                fieldId: 'defaultbilling',
                value: addressBilling.defaultBilling || false
            });

            vendor.setCurrentSublistValue({
                sublistId: 'addressbook',
                fieldId: 'defaultshipping',
                value: addressBilling.defaultShipping || false
            });

            // Create the subrecord
            const addressRecord = addressSubrecord.getCurrentSublistSubrecord({
                sublistId: 'addressbook',
                fieldId: 'addressbookaddress'
            });

            addressRecord.setValue({
                fieldId: 'country',
                value: addressBilling.country
            });

            // Set the address fields
            addressRecord.setValue({
                fieldId: 'addr1',
                value: addressBilling.addr1
            });

            addressRecord.setValue({
                fieldId: 'city',
                value: addressBilling.city
            });

            addressRecord.setValue({
                fieldId: 'state',
                value: addressBilling.state
            });

            addressRecord.setValue({
                fieldId: 'zip',
                value: addressBilling.zip
            });

            addressRecord.setValue({
                fieldId: 'addressee',
                value: addressBilling.addressee
            });

            // Commit the new line to the record
            vendor.commitLine({
                sublistId: 'addressbook'
            });

        }

        return {
            genQuery,
            mapCountry3Code2,
            mapAddressFromCreednz,
            addVendorAddress
        }

    });
