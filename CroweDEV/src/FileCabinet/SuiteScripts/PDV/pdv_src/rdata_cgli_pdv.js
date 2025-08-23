function customizeGlImpact(transactionRecord, standardLines, customLines, book) {

    var tranRecordType = transactionRecord.getRecordType();
    //nlapiLogExecution('debug', 'transactionType', transactionRecordType);

    // Customer Deposits & vendor prepayments
    if (tranRecordType === 'customerdeposit' || tranRecordType === 'vendorprepayment') {
        var line = standardLines.getLine(1);
        var accId = line.getAccountId();

        // get Custom Tax code
        var taxItemId = transactionRecord.getFieldValue('custbody_crw_taxcode');
        var taxAmount = transactionRecord.getFieldValue('custbody_crw_taxamount')

        if (!(taxAmount > 0)) {
            // Tax Amount equal to zero, don't create custom GL Impact Lines
            return;
        }

        var nonDeductible = nlapiLookupField('salestaxitem', taxItemId, 'custrecord_4110_non_deductible');
        if (tranRecordType === 'vendorprepayment' && nonDeductible === 'T') {
            // TODO : Sta radimo kada evidentiramo avans dobavljacu, a imamo PDV?
            nlapiLogExecution('audit', 'Info', "Non deductible tax code");
            return;
        }

        var taxSale = false;
        var taxPurchase = false;
        var salesTaxAcc = null;
        var purchaseTaxAcc = null;

        var departmentId = line.getDepartmentId(),
            locationId = line.getLocationId(),
            classId = line.getClassId(),
            entityId = line.getEntityId();
        var taxAccounts = true; // TODO: ovo ne treba tako!

        if (tranRecordType === 'customerdeposit') {
            taxSale = true;
            taxPurchase = false;
        }

        if (tranRecordType === 'vendorprepayment') {
            taxSale = false;
            taxPurchase = true;
        }

        try {
            // Get taxtype ids
            //var taxTypeId = nlapiLookupField('salestaxitem', taxItemId, 'custrecord_avansi_tax_type');
            var taxTypeId = nlapiLookupField('salestaxitem', taxItemId, 'taxtype');
            var isReverseCharge = nlapiLookupField('salestaxitem', taxItemId, 'isreversecharge');

            // Load tax type record and get sales tax and purchase accounts
            var taxType = nlapiLoadRecord('taxtype', taxTypeId);
            salesTaxAcc = parseInt(taxType.getLineItemValue('nexusestax', 'saletaxacct', 1));
            purchaseTaxAcc = parseInt(taxType.getLineItemValue('nexusestax', 'purchtaxacct', 1));
        } catch (err) {
            nlapiLogExecution('error', 'Error', "Error while getting tax accounts! " + err);
            taxAccounts = false;
        }

        if (!taxAccounts) {
            // There is an error, get out from here
            return;
        }

        try {
            if (taxAccounts) {
                if (taxPurchase) {

                    if (!purchaseTaxAcc) {
                        nlapiLogExecution('error', 'Error', "Error Purchase TAX acct not defined! ");
                        return;
                    }
                    var newLine = customLines.addNewLine();
                    newLine.setCreditAmount(taxAmount);
                    (tranRecordType === 'vendorprepayment' && isReverseCharge === 'T') ? newLine.setAccountId(salesTaxAcc) : newLine.setAccountId(accId);
                    newLine.setMemo("Purchase TAX");
                    newLine.setEntityId(entityId);

                    var newLine = customLines.addNewLine();
                    newLine.setDebitAmount(taxAmount);
                    newLine.setAccountId(purchaseTaxAcc);
                    newLine.setMemo("Purchase TAX");
                    newLine.setDepartmentId(departmentId);
                    newLine.setLocationId(locationId);
                    newLine.setClassId(classId);
                } else if (taxSale) {
                    var newLine = customLines.addNewLine();
                    newLine.setDebitAmount(taxAmount);
                    (tranRecordType === 'vendorprepayment' && isReverseCharge === 'T') ? newLine.setAccountId(purchaseTaxAcc) : newLine.setAccountId(accId);
                    newLine.setMemo("Sale TAX");
                    newLine.setEntityId(entityId);

                    var newLine = customLines.addNewLine();
                    newLine.setCreditAmount(taxAmount);
                    newLine.setAccountId(salesTaxAcc);
                    newLine.setMemo("Sale TAX");
                    newLine.setDepartmentId(departmentId);
                    newLine.setLocationId(locationId);
                    newLine.setClassId(classId);
                }
            }
        } catch (err) {
            nlapiLogExecution('error', 'Error', "Error while adding GL lines! " + err);
        }
    }
}