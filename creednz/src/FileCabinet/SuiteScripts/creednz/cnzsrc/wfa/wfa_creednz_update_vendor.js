/**
 * @NApiVersion 2.1
 * @NScriptType WorkflowActionScript
 */
define(['../lib/creednz_api_lib'],

    (creednz_api_lib) => {
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

            const vendorRecord = scriptContext.newRecord;


            // custentity_creednz_bank_acc_email
            const vendorPrefferedEmail = vendorRecord.getValue('custentity_creednz_bank_acc_email') || '';
            const vendorPrefferedContact = vendorRecord.getValue('custentity_creednz_bank_acc_contact') || '';

            const vendorExternalId = vendorRecord.getValue('custentity_vendor_external_id');
            const vendorNameParam = vendorRecord.getValue('companyname');

            let emailParam = vendorRecord.getValue('email');
            let contactParam = "";

            const vendorContacts = creednz_api_lib.getVendorContacts(vendorRecord.id);

            if (vendorContacts.length > 0) {

                let accountingEmail = vendorContacts[0].email;
                let accountingContact = vendorContacts[0].name;

                if (accountingEmail) {
                    emailParam = accountingEmail;
                }
                if (accountingContact) {
                    contactParam = accountingContact;
                }
            }

            // Overwrite with preffered from Vendor record
            if (vendorPrefferedEmail) {
                emailParam = vendorPrefferedEmail
            }
            if (vendorPrefferedContact) {
                contactParam = vendorPrefferedContact
            }

            const dataObj = {
                "vendorExternalId": vendorExternalId,
                "email": emailParam,
                "primaryContact": contactParam,
                "vendorName": vendorNameParam
            };
            let creedNzTransactions = creednz_api_lib.postCreednzUpdateInviteVendor(dataObj);

            let creednzEvaluationId = creedNzTransactions.id;

            if (creednzEvaluationId) {

                //set risk assessment status as invite sent as default
                vendorRecord.setValue({
                    fieldId: 'custentity_creednz_bankacc_status',
                    value: 'Request Sent'
                });

                return creednzEvaluationId;
            } else {
                throw new Error('Failed to post Creednz invite vendor');
            }

        }

        return {onAction};
    });
