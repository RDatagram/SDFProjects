function customizeGlImpact(transactionRecord, standardLines, customLines, book) {

    var tranRecordType = transactionRecord.getRecordType();

    if (tranRecordType === 'depositapplication') {

        var line = standardLines.getLine(0); // TIP&TRICK Always first line!

        var accId = line.getAccountId(),
            depositId = parseInt(transactionRecord.getFieldValue('deposit')),
            applied = parseFloat(transactionRecord.getFieldValue('applied')),
            departmentId = line.getDepartmentId(),
            locationId = line.getLocationId(),
            classId = line.getClassId(),
            taxAmount = null,
            entityId = line.getEntityId();

        // Get TaxRate from customerDeposit
        var rate = nlapiLookupField('customerdeposit', depositId, 'custbody_crw_taxrate');
        var taxCodeId = nlapiLookupField('customerdeposit', depositId, 'custbody_crw_taxcode');

        rate = parseInt(rate.replace(/%/g, ''));

        var taxCodeRec = nlapiLoadRecord('salestaxitem', taxCodeId);

        if (rate === 0) {
            nlapiLogExecution('audit', 'Info', "Tax rate is 0 and it's not reverse charge!");
            return;
        }

        taxAmount = applied / (1 + rate / 100) * (rate / 100);

        if (!(taxAmount > 0)) {
            return;
        }

        var taxSale = false;
        var taxPurchase = false;
        if (tranRecordType === 'depositapplication') {
            taxSale = true;
            taxPurchase = false;
        }
        var taxTypeId = taxCodeRec.getFieldValue('taxtype');
        var taxType = nlapiLoadRecord('taxtype', taxTypeId);
        var salesTaxAcc = parseInt(taxType.getLineItemValue('nexusestax', 'saletaxacct', 1));
        var purchaseTaxAcc = parseInt(taxType.getLineItemValue('nexusestax', 'purchtaxacct', 1));

        // TODO: Define taxSale/TaxPurchase for customerDepositApplication and remove "else'
        if (taxSale) {
            var newLine = customLines.addNewLine();
            newLine.setCreditAmount(taxAmount.toFixed(2));
            newLine.setAccountId(accId);
            newLine.setMemo("Sales TAX DepApplication");
            newLine.setEntityId(entityId);

            newLine = customLines.addNewLine();
            newLine.setDebitAmount(taxAmount.toFixed(2));
            newLine.setAccountId(salesTaxAcc);
            newLine.setMemo("Sales TAX DepApplication");
            newLine.setDepartmentId(departmentId);
            newLine.setLocationId(locationId);
            newLine.setClassId(classId);
        } else if (taxPurchase){
            var newLine = customLines.addNewLine();
            newLine.setDebitAmount(taxAmount.toFixed(2));
            newLine.setAccountId(accId);
            newLine.setMemo("Purchase TAX");
            newLine.setEntityId(entityId);

            newLine = customLines.addNewLine();
            newLine.setCreditAmount(taxAmount.toFixed(2));
            newLine.setAccountId(purchaseTaxAcc);
            newLine.setMemo("Purchase TAX");
            newLine.setDepartmentId(departmentId);
            newLine.setLocationId(locationId);
            newLine.setClassId(classId);
        }
    }
    // 'vendorprepaymentapplication'
    if (tranRecordType === 'vendorprepaymentapplication') {

        var line = standardLines.getLine(0); // TIP&TRICK Always first line!

        var accId = line.getAccountId(),
            prepaymentId = parseInt(transactionRecord.getFieldValue('vendorprepayment')),
            applied = parseFloat(transactionRecord.getFieldValue('applied')),
            departmentId = line.getDepartmentId(),
            locationId = line.getLocationId(),
            classId = line.getClassId(),
            taxAmount = null,
            entityId = line.getEntityId();

        // Get TaxRate from customerDeposit
        var rate = nlapiLookupField('vendorprepayment', prepaymentId, 'custbody_crw_taxrate');
        var taxCodeId = nlapiLookupField('vendorprepayment', prepaymentId, 'custbody_crw_taxcode');

        rate = parseInt(rate.replace(/%/g, ''));

        var taxCodeRec = nlapiLoadRecord('salestaxitem', taxCodeId);

        if (rate === 0) {
            nlapiLogExecution('audit', 'Info', "Tax rate is 0 and it's not reverse charge!");
            return;
        }

        taxAmount = applied / (1 + rate / 100) * (rate / 100);

        if (!(taxAmount > 0)) {
            return;
        }

        var taxSale = false;
        var taxPurchase = false;
        if (tranRecordType === 'vendorprepaymentapplication') {
            taxSale = false;
            taxPurchase = true;
        }
        var taxTypeId = taxCodeRec.getFieldValue('taxtype');
        var taxType = nlapiLoadRecord('taxtype', taxTypeId);
        var salesTaxAcc = parseInt(taxType.getLineItemValue('nexusestax', 'saletaxacct', 1));
        var purchaseTaxAcc = parseInt(taxType.getLineItemValue('nexusestax', 'purchtaxacct', 1));

        // TODO: Define taxSale/TaxPurchase for customerDepositApplication and remove "else'
        if (taxSale) {
            var newLine = customLines.addNewLine();
            newLine.setCreditAmount(taxAmount.toFixed(2));
            newLine.setAccountId(accId);
            newLine.setMemo("Sales TAX DepApplication");
            newLine.setEntityId(entityId);

            newLine = customLines.addNewLine();
            newLine.setDebitAmount(taxAmount.toFixed(2));
            newLine.setAccountId(salesTaxAcc);
            newLine.setMemo("Sales TAX DepApplication");
            newLine.setDepartmentId(departmentId);
            newLine.setLocationId(locationId);
            newLine.setClassId(classId);
        } else if (taxPurchase){
            var newLine = customLines.addNewLine();
            newLine.setDebitAmount(taxAmount.toFixed(2));
            newLine.setAccountId(accId);
            newLine.setMemo("Purchase TAX PrepApplication");
            newLine.setEntityId(entityId);

            newLine = customLines.addNewLine();
            newLine.setCreditAmount(taxAmount.toFixed(2));
            newLine.setAccountId(purchaseTaxAcc);
            newLine.setMemo("Purchase TAX PrepApplication");
            newLine.setDepartmentId(departmentId);
            newLine.setLocationId(locationId);
            newLine.setClassId(classId);
        }
    }

}