function customizeGlImpact(transactionRecord, standardLines, customLines, book) {

    var tranRecordType = transactionRecord.getRecordType();

    var lineTaxCodes = {}

    for (var i = 0, count = standardLines.getCount(); i < count; i++) {

        var currLine = standardLines.getLine(i);
        var taxItemId = currLine.getTaxItemId();

        var accId = currLine.getAccountId();
        var departmentId = currLine.getDepartmentId();
        var locationId = currLine.getLocationId();
        var classId= currLine.getClassId();

        // This is the case when tax code is not binded to a line in a transaction during creation process
        // It usually returns an empty object instead of a tax code id. Other checks are just in case...
        if (typeof taxItemId === 'object' || taxItemId === null ||
            taxItemId === undefined || taxItemId === -7) {
            continue;
        }

        var taxCodeName = nlapiLookupField("salestaxitem", taxItemId, "itemid");
        var rateStr = nlapiLookupField("salestaxitem", taxItemId, "rate");
        var rate = parseFloat(rateStr.replace(/%/g, ''));

        var isNonDeductable = nlapiLookupField("salestaxitem", taxItemId, "custrecord_crw_neodbitni");
        var isVat = (currLine.getMemo() === "VAT");
        var taxTypeId = nlapiLookupField('salestaxitem', taxItemId, 'taxtype');
        var taxType = nlapiLoadRecord('taxtype', taxTypeId);

        //var salesTaxAcc = parseInt(taxType.getLineItemValue('nexusestax', 'saletaxacct', 1));
        var purchaseTaxAcc = parseInt(taxType.getLineItemValue('nexusestax', 'purchtaxacct', 1));

        if (isNonDeductable === "T") {
            if (!isVat) {
                var isDebit = (parseFloat(currLine.getDebitAmount()) !== 0);
                var taxAmount = 0;
                if (isDebit) {
                    taxAmount = parseFloat(currLine.getDebitAmount()) * (rate / 100);
                } else {
                    taxAmount = parseFloat(currLine.getCreditAmount()) * (rate / 100);
                }
                if (!lineTaxCodes.hasOwnProperty(taxCodeName)) {
                    lineTaxCodes[taxCodeName] = [];
                }

                var newLine = customLines.addNewLine();
                newLine.setDebitAmount(taxAmount);
                newLine.setAccountId(accId);
                newLine.setMemo("NonDeductible PDV");
                newLine.setDepartmentId(departmentId);
                newLine.setLocationId(locationId);
                newLine.setClassId(classId);

                var newLine = customLines.addNewLine();
                newLine.setCreditAmount(taxAmount);
                newLine.setAccountId(purchaseTaxAcc);
                newLine.setMemo("NonDeductible PDV");
                newLine.setDepartmentId(departmentId);
                newLine.setLocationId(locationId);
                newLine.setClassId(classId);

            } else {
                //VAT LINIJA
            }
        }
    }

}