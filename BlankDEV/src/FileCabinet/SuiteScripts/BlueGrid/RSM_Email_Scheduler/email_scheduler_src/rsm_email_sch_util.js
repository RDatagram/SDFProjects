define(['N/query', 'N/search'], function (query, search) {

    function getEmailStatusId(name) {
        var emailStatusQuery = query.runSuiteQL({
            query: 'SELECT id, name FROM customlist_rsm_email_schedule_status',
        });
        var results = emailStatusQuery.asMappedResults();
        for (var i = 0; i < results.length; i++) {
            if (results[i]['name'] === name) {
                return results[i]['id'];
            }
        }
    }

    function mapRecordStatus(recordType) {
        var transactionBodyFieldEmailStatus = "";
        if (recordType === "customsale_rsm_so_estimate") {
            transactionBodyFieldEmailStatus = "custbody_rsm_soe_email_status";
        } else if (recordType === "creditmemo") {
            transactionBodyFieldEmailStatus = "custbody_rsm_creditmemo_email_status";
        } else if (recordType === "invoice") {
            transactionBodyFieldEmailStatus = "custbody_rsm_invoice_email_status";
        } else if (recordType === "salesorder") {
            transactionBodyFieldEmailStatus = "custbody_rsm_salesorder_email_status";
        } else if (recordType === "customerdeposit") {
            transactionBodyFieldEmailStatus = "custbody_rsm_cd_email_status";
        }
        return transactionBodyFieldEmailStatus;
    }

    function createMailList(recordType, statusField) {

        var emailStatusId = getEmailStatusId("SCHEDULE");
        var toBeSent = search.create({
            type: recordType,
            columns: ["internalid", statusField, "custbody_cust_dep_pdf_file", "tranid", "trandate", "entity"],
            filters: [
                ["mainline", "is", "T"],
                "AND",
                [statusField, "is", emailStatusId]
            ]
        }).run().getRange(0, 1000);

        return toBeSent;
    }

    return {
        createMailList: createMailList,
        getEmailStatusId: getEmailStatusId,
        mapRecordStatus: mapRecordStatus
    }

})