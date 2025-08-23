// Script version = 1.0
function customizeGlImpact(transactionRecord, standardLines, customLines, book) {

  var transactionRecordType = transactionRecord.getRecordType();
  // nlapiLogExecution('debug', 'transactionType', transactionRecordType);

  // Customer Deposits & vendor prepayments
  if (transactionRecordType === 'customerdeposit' || transactionRecordType === 'vendorprepayment') {

    // Always taking the second standard line for customerdeposit and vendorprepayment transaction types
    var line = standardLines.getLine(1);

    var accId = line.getAccountId(),
      taxAmount = transactionRecord.getFieldValue('custbody_cust_dep_porez_iznos'),
      isDebit = (parseFloat(line.getDebitAmount()) !== 0),
      departmentId = line.getDepartmentId(),
      locationId = line.getLocationId(),
      classId = line.getClassId(),
      salesTaxAcc = null,
      purchaseTaxAcc = null,
      taxAccounts = true,
      entityId = line.getEntityId();

    var taxItemId = transactionRecord.getFieldValue('custbody_poreski_kod_cust_dep_rsm');

    if (!(taxAmount > 0)) {
      return;
    }

    // If non-deductible, don't do anything further
    var nonDeductible = nlapiLookupField('salestaxitem', taxItemId, 'custrecord_4110_non_deductible');
    if (transactionRecordType === 'vendorprepayment' && nonDeductible === 'T') {
      nlapiLogExecution('audit', 'Info', "Non deductible tax code");
    } else {
      try {
        // Get taxtype ids
        var taxTypeId = nlapiLookupField('salestaxitem', taxItemId, 'custrecord_avansi_tax_type');
        var isReverseCharge = nlapiLookupField('salestaxitem', taxItemId, 'isreversecharge');

        // Load tax type record and get sales tax and purchase accounts 
        var taxType = nlapiLoadRecord('taxtype', taxTypeId);
        salesTaxAcc = parseInt(taxType.getLineItemValue('nexusestax', 'saletaxacct', 1));
        purchaseTaxAcc = parseInt(taxType.getLineItemValue('nexusestax', 'purchtaxacct', 1));
      } catch (err) {
        nlapiLogExecution('error', 'Error', "Error while getting tax accounts! " + err);
        taxAccounts = false;
      }

      if (taxAccounts) {
        if (isDebit) {
          var newLine = customLines.addNewLine();
          newLine.setCreditAmount(taxAmount);
          (transactionRecordType === 'vendorprepayment' && isReverseCharge === 'T') ? newLine.setAccountId(salesTaxAcc) : newLine.setAccountId(accId);
          newLine.setMemo("Custom line");
          newLine.setEntityId(entityId);

          var newLine = customLines.addNewLine();
          newLine.setDebitAmount(taxAmount);
          newLine.setAccountId(purchaseTaxAcc);
          newLine.setMemo("Custom line");
          newLine.setDepartmentId(departmentId);
          newLine.setLocationId(locationId);
          newLine.setClassId(classId);
        } else {
          var newLine = customLines.addNewLine();
          newLine.setDebitAmount(taxAmount);
          (transactionRecordType === 'vendorprepayment' && isReverseCharge === 'T') ? newLine.setAccountId(purchaseTaxAcc) : newLine.setAccountId(accId);
          newLine.setMemo("Custom line");
          newLine.setEntityId(entityId);

          var newLine = customLines.addNewLine();
          newLine.setCreditAmount(taxAmount);
          newLine.setAccountId(salesTaxAcc);
          newLine.setMemo("Custom line");
          newLine.setDepartmentId(departmentId);
          newLine.setLocationId(locationId);
          newLine.setClassId(classId);
        }
      }
    }

    // Deposit applications
  } else if (transactionRecordType === 'depositapplication') {

    // Always taking the first standard line for depositapplication transaction type
    var line = standardLines.getLine(0);

    var accId = line.getAccountId(),
      isDebit = (parseFloat(line.getDebitAmount()) !== 0),
      depositId = parseInt(transactionRecord.getFieldValue('deposit')),
      applied = parseFloat(transactionRecord.getFieldValue('applied')),
      departmentId = line.getDepartmentId(),
      locationId = line.getLocationId(),
      classId = line.getClassId(),
      taxAmount = null,
      entityId = line.getEntityId();

    var rate = nlapiLookupField('customerdeposit', depositId, 'custbody_cust_dep_poreska_stopa'),
      taxCodeId = nlapiLookupField('customerdeposit', depositId, 'custbody_poreski_kod_cust_dep_rsm'),
      currency = nlapiLookupField('customerdeposit', depositId, 'currency', 'text'),
        currencyId = nlapiLookupField('customerdeposit', depositId, 'currency'),

      exchangeRate = parseFloat(nlapiLookupField('customerdeposit', depositId, 'exchangerate'));

    var currencyISO = nlapiLookupField('currency',currencyId,'symbol');

    rate = parseInt(rate.replace(/%/g, ''));

    // If currency is EUR convert applied amount to RSD amount
    if (currencyISO !== 'RSD') {
      applied = applied * exchangeRate;
    }

    var taxCodeRec = nlapiLoadRecord('salestaxitem', taxCodeId);
    var isReverseCharge = taxCodeRec.getFieldValue('reversecharge');

    if (isReverseCharge === 'F' && rate === 0) {
      nlapiLogExecution('audit', 'Info', "Tax rate is 0 and it's not reverse charge!");
      return;
    }

    if (isReverseCharge === 'T') {
      var parentId = taxCodeRec.getFieldValue('parent');
      rate = nlapiLookupField('salestaxitem', parentId, 'rate');
      rate = parseInt(rate.replace(/%/g, ''));
      taxAmount = applied * (rate / 100);
    } else {
      taxAmount = applied / (1 + rate / 100) * (rate / 100);
    }

    if (!(taxAmount > 0)) {
      return;
    }

    var taxTypeId = taxCodeRec.getFieldValue('taxtype');
    var taxType = nlapiLoadRecord('taxtype', taxTypeId);
    var salesTaxAcc = parseInt(taxType.getLineItemValue('nexusestax', 'saletaxacct', 1));
    var purchaseTaxAcc = parseInt(taxType.getLineItemValue('nexusestax', 'purchtaxacct', 1));

    if (isDebit) {
      var newLine = customLines.addNewLine();
      newLine.setCreditAmount(taxAmount);
      newLine.setAccountId(accId);
      newLine.setMemo("Custom line");
      newLine.setEntityId(entityId);

      var newLine = customLines.addNewLine();
      newLine.setDebitAmount(taxAmount);
      newLine.setAccountId(salesTaxAcc);
      newLine.setMemo("Custom line");
      newLine.setDepartmentId(departmentId);
      newLine.setLocationId(locationId);
      newLine.setClassId(classId);
    } else {
      var newLine = customLines.addNewLine();
      newLine.setDebitAmount(taxAmount);
      newLine.setAccountId(accId);
      newLine.setMemo("Custom line");
      newLine.setEntityId(entityId);

      var newLine = customLines.addNewLine();
      newLine.setCreditAmount(taxAmount);
      newLine.setAccountId(purchaseTaxAcc);
      newLine.setMemo("Custom line");
      newLine.setDepartmentId(departmentId);
      newLine.setLocationId(locationId);
      newLine.setClassId(classId);
    }

    // Vendor prepayment application
  } else if (transactionRecordType === 'vendorprepaymentapplication') {

    // Always taking the first standard line for vendorprepaymentapplication transaction type
    var line = standardLines.getLine(0);

    var accId = line.getAccountId(),
      isDebit = (parseFloat(line.getDebitAmount()) !== 0),
      prepaymentId = parseInt(transactionRecord.getFieldValue('vendorprepayment')),
      applied = parseFloat(transactionRecord.getFieldValue('applied')),
      departmentId = line.getDepartmentId(),
      locationId = line.getLocationId(),
      classId = line.getClassId(),
      taxAmount = null,
      entityId = line.getEntityId();

    var rate = nlapiLookupField('vendorprepayment', prepaymentId, 'custbody_cust_dep_poreska_stopa'),
      taxCodeId = nlapiLookupField('vendorprepayment', prepaymentId, 'custbody_poreski_kod_cust_dep_rsm'),
      currency = nlapiLookupField('vendorprepayment', prepaymentId, 'currency', 'text'),
        currencyId = nlapiLookupField('vendorprepayment', prepaymentId, 'currency'),
      exchangeRate = parseFloat(nlapiLookupField('vendorprepayment', prepaymentId, 'exchangerate'));
    
    rate = parseInt(rate.replace(/%/g, ''));

    var currencyISO = nlapiLookupField('currency',currencyId,'symbol');

    // If currency is EUR convert applied amount to RSD amount
    if (currencyISO !== 'RSD') {
      applied = applied * exchangeRate;
    }
    
    var taxCodeRec = nlapiLoadRecord('salestaxitem', taxCodeId);
    var isReverseCharge = taxCodeRec.getFieldValue('reversecharge');
    var isNonDeductible = taxCodeRec.getFieldValue('custrecord_4110_non_deductible');

    // If non-deductible don't do anything further
    if (isNonDeductible === 'T') {
      nlapiLogExecution('audit', 'Info', "Non deductible tax code");
    } else {
      if (isReverseCharge === 'T') {
        var parentId = taxCodeRec.getFieldValue('parent');
        rate = nlapiLookupField('salestaxitem', parentId, 'rate');
        rate = parseInt(rate.replace(/%/g, ''));
        taxAmount = applied * (rate / 100);
      } else {
        taxAmount = applied / (1 + rate / 100) * (rate / 100);
      }

      if (!(taxAmount > 0)) {
        return;
      }

      var taxTypeId = taxCodeRec.getFieldValue('taxtype');
      var taxType = nlapiLoadRecord('taxtype', taxTypeId);
      var salesTaxAcc = parseInt(taxType.getLineItemValue('nexusestax', 'saletaxacct', 1));
      var purchaseTaxAcc = parseInt(taxType.getLineItemValue('nexusestax', 'purchtaxacct', 1));

      if (isDebit) {
        var newLine = customLines.addNewLine();
        newLine.setCreditAmount(taxAmount);
        (isReverseCharge === 'T') ? newLine.setAccountId(purchaseTaxAcc) : newLine.setAccountId(accId);
        newLine.setMemo("Custom line");
        newLine.setEntityId(entityId);

        var newLine = customLines.addNewLine();
        newLine.setDebitAmount(taxAmount);
        newLine.setAccountId(salesTaxAcc);
        newLine.setMemo("Custom line");
        newLine.setDepartmentId(departmentId);
        newLine.setLocationId(locationId);
        newLine.setClassId(classId);
      } else {
        var newLine = customLines.addNewLine();
        newLine.setDebitAmount(taxAmount);
        (isReverseCharge === 'T') ? newLine.setAccountId(salesTaxAcc) : newLine.setAccountId(accId);
        newLine.setMemo("Custom line");
        newLine.setEntityId(entityId);

        var newLine = customLines.addNewLine();
        newLine.setCreditAmount(taxAmount);
        newLine.setAccountId(purchaseTaxAcc);
        newLine.setMemo("Custom line");
        newLine.setDepartmentId(departmentId);
        newLine.setLocationId(locationId);
        newLine.setClassId(classId);
      }
    }

    // Other types of transactions
  } else {
    var lineTaxCodes = {},
      taxCodeAccounts = {};

    for (var i = 0, count = standardLines.getCount(); i < count; i++) {
      var currLine = standardLines.getLine(i);
      var taxItemId = currLine.getTaxItemId();

      // This is the case when tax code is not binded to a line in a transaction during creation process
      // It usually returns an empty object instead of a tax code id. Other checks are just in case...
      if (typeof taxItemId === 'object' || taxItemId === null ||
        taxItemId === undefined || taxItemId === -7) {
        continue;
      }

      var taxCodeName = nlapiLookupField("salestaxitem", taxItemId, "itemid");
      var rate = nlapiLookupField("salestaxitem", taxItemId, "rate");
      rate = parseInt(rate.substr(0, rate.indexOf("."))); // or can do: parseInt(rate.replace(/%/g, ''));
      var isNonDeductable = nlapiLookupField("salestaxitem", taxItemId, "custrecord_4110_non_deductible");
      var isVat = (currLine.getMemo() === "VAT");

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
          (lineTaxCodes[taxCodeName]).push({
            taxAmount: taxAmount,
            accId: currLine.getAccountId(),
            isDebit: isDebit,
            departmentId: currLine.getDepartmentId(),
            locationId: currLine.getLocationId(),
            classId: currLine.getClassId()
          });

        } else {
          taxCodeAccounts[taxCodeName] = currLine.getAccountId();
        }
      }
    }

    for (var key in lineTaxCodes) {
      for (var i = 0, len = lineTaxCodes[key].length; i < len; i++) {
        if (lineTaxCodes[key][i]['isDebit']) {
          var newLine = customLines.addNewLine();
          newLine.setCreditAmount(lineTaxCodes[key][i]["taxAmount"]);
          newLine.setAccountId(taxCodeAccounts[key]);
          newLine.setMemo("Custom line");
          newLine.setDepartmentId(lineTaxCodes[key][i]['departmentId']);
          newLine.setLocationId(lineTaxCodes[key][i]['locationId']);
          newLine.setClassId(lineTaxCodes[key][i]['classId']);

          var newLine = customLines.addNewLine();
          newLine.setDebitAmount(lineTaxCodes[key][i]["taxAmount"]);
          newLine.setAccountId(lineTaxCodes[key][i]["accId"]);
          newLine.setMemo("Custom line");
          newLine.setDepartmentId(lineTaxCodes[key][i]['departmentId']);
          newLine.setLocationId(lineTaxCodes[key][i]['locationId']);
          newLine.setClassId(lineTaxCodes[key][i]['classId']);
        } else {
          var newLine = customLines.addNewLine();
          newLine.setDebitAmount(lineTaxCodes[key][i]["taxAmount"]);
          newLine.setAccountId(taxCodeAccounts[key]);
          newLine.setMemo("Custom line");
          newLine.setDepartmentId(lineTaxCodes[key][i]['departmentId']);
          newLine.setLocationId(lineTaxCodes[key][i]['locationId']);
          newLine.setClassId(lineTaxCodes[key][i]['classId']);

          var newLine = customLines.addNewLine();
          newLine.setCreditAmount(lineTaxCodes[key][i]["taxAmount"]);
          newLine.setAccountId(lineTaxCodes[key][i]["accId"]);
          newLine.setMemo("Custom line");
          newLine.setDepartmentId(lineTaxCodes[key][i]['departmentId']);
          newLine.setLocationId(lineTaxCodes[key][i]['locationId']);
          newLine.setClassId(lineTaxCodes[key][i]['classId']);
        }
      }
    }
  }

}