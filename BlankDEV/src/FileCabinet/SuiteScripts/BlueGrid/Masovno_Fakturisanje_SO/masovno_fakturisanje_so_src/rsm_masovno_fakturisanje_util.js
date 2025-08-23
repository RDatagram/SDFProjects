define(['N/query', 'N/search'], function (query, search) {

    // For some reason the date format the UserEvent script gets with .getValue is returned as "2019-04-01T07:00:00.000Z" for example, turn it into dd.mm.yyyy
    function fixDateFormat(date) {
        var day = new Date(date).getDate().toString();
        var month = (new Date(date).getMonth() + 1).toString();
        var year = new Date(date).getFullYear().toString();
        return (day.length === 1 ? "0" + day : day) + "." + (month.length === 1 ? "0" + month : month) + "." + year;
    }

    function getCandidateList(subsidiary) {
        var toBeTransformed = [];

        // Get all the required Sales Orders that need to be transformed into Invoices
        var salesOrders = search.create({
            type: "salesorder",
            columns: ["enddate", "status", "internalid", "trandate", "entity", "tranid", "total", "quantitybilled"],
            filters: [
                ["mainline", "is", "T"],
                "AND",
                ["enddate", search.Operator.ONORBEFORE, fixDateFormat(new Date())],
                "AND",
                ["custbody_rsm_so_type.custrecord_rsm_sot_enddate_invoice", "is", "T"],
                "AND",
                ["status", "anyof", "SalesOrd:F"], // SalesOrd:F === Pending Billing
                "AND",
                ["subsidiary", "anyof", subsidiary]
            ]
        }).run();

        if (salesOrders.getRange(0, 1).length) {

            // Get all IDs from Sales Orders for later comparison
            var salesOrderIDs = [];
            salesOrders.each(function (result) {
                salesOrderIDs.push(result.getValue('internalid'));
                return true;
            });

            // Get all Invoices that were already created from one of the Sales Orders
            var invoices = search.create({
                type: "invoice",
                columns: ["tranid", "createdfrom"],
                filters: [
                    ["mainline", "is", "T"],
                    "AND",
                    ["createdfrom", "anyof", salesOrderIDs]
                ]
            }).run();

            // Get all IDs of Sales Orders used to create existing Invoices
            var invoicesParentIDs = [];
            invoices.each(function (result) {
                invoicesParentIDs.push(result.getValue('createdfrom'));
                return true;
            });

            // Only send Sales Orders without existing Invoices to be transfomed
            salesOrders.each(function (result) {
                var soID = result.getValue('internalid');
                if (invoicesParentIDs.indexOf(soID) == -1) {
                    toBeTransformed.push(result);
                }
                return true;
            });

        }

        return toBeTransformed;
    }

    return {
        getCandidateList: getCandidateList
    }

})