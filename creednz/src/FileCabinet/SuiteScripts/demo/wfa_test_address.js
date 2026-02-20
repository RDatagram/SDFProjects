/**
 * @NApiVersion 2.1
 * @NScriptType WorkflowActionScript
 */
define(['N/record', '../creednz/cnzsrc/lib/creednz_dao_lib'],
    /**
     * @param{record} record
     * @param creednz_dao_lib
     */
    (record, creednz_dao_lib) => {
        /**
         * Defines the WorkflowAction script trigger point.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.workflowId - Internal ID of workflow which triggered this action
         * @param {string} scriptContext.type - Event type
         * @param {Form} scriptContext.form - Current form that the script uses to interact with the record
         * @since 2016.1
         */
        const onAction = (scriptContext) => {

            // log,debug
            log.debug({
                title: 'Adding new address',
                details: 'Adding a new address to the vendor record'
            });
            //try {

            const addressBill = {
                country: creednz_dao_lib.mapCountry3Code2('CAN'),
                addr1: '2528 Nicklaus Court',
                city: 'Burlington',
                state: 'ON',
                zip: 'L7M4V1',
                addressee: 'John Doe',
                defaultBilling: true,
                defaultShipping: false
            }

            const addressShip = {
                country:  creednz_dao_lib.mapCountry3Code2('CAN'),
                addr1: '2528 Nicklaus Court',
                city: 'Burlington',
                state: 'ON',
                zip: 'L7M4V1',
                addressee: 'Zoran R-DATAGRAM',
                defaultBilling: false,
                defaultShipping: true
            }
            //const vendor = scriptContext.newRecord;

            const vendor = record.load({
                type: 'Vendor',
                id: scriptContext.newRecord.id,
                isDynamic: true
            });

            while (vendor.getLineCount({sublistId: 'addressbook'}) > 0) {
                vendor.removeLine({
                    sublistId: 'addressbook',
                    line: 0
                });
            }


            // BILLING ADDRESS
            // Add a new address line to the record

            const addAddress = (label,addressBilling) => {
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

            addAddress('Creednz Billing',addressBill);
            addAddress('Creednz Shipping',addressShip);

            vendor.save();

            /*} catch (e) {
                log.error({
                    title : e.name,
                    details: e.message
                })
            }*/
        }

        return {onAction};
    });
