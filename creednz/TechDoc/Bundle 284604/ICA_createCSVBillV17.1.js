/**
 * 
 * @param objAcctMapping
 * @returns
 */
function createCSV(objAcctMapping) {
	try {
		dLog('createCSV', '>>> START <<<');

		var fileDist = nlapiGetContext().getSetting('SCRIPT', 'custscript_v171_jp_file_dist');
		var customerId = nlapiGetContext().getSetting('SCRIPT', 'custscript_v171_jp_customer_id');
		var currDate = Date.create();
		var arrTempBillIds = [];
		var arrBillIds = [];
		var arrBillCRIds = [];
		var arrBillAmt = [];
		var arrBillAmtOrig = [];
		var arrBillDiscAmt = [];

		for (x in arrBillsProcessed) {

			var billId = arrBillsProcessed[x].id;
			var billPaymentId = arrBillsProcessed[x].payment;

			dLog('createCSV', 'Bill Id : ' + billId + ' | Bill Payment Id : ' + billPaymentId);

			// check if payment id exist, only generate xml bills with payment
			// id, skip processed bill credit
			if (!isEmpty(billPaymentId) && billPaymentId != 'XXXNONEXXX' && billPaymentId != 'CREDIT') {

				if (billPaymentId != 'CREDIT')
					arrTempBillIds.push(billId);

				arrBillAmtOrig[billId] = arrBillsProcessed[x].origamt;
				// arrBillAmt[billId] = arrBillsProcessed[x].pay;
				arrBillAmt[billId] = arrBillsProcessed[x].payamt;
				arrBillDiscAmt[billId] = arrBillsProcessed[x].discamt;
			}

			if (billPaymentId == 'CREDIT')
				arrBillCRIds.push(billId);
		}

		var arrBillIds = [];

		for (vx in arrTempBillIds) {

			var isBC = false;

			for ( var x in arrBillCRIds) {

				if (arrTempBillIds[vx] == arrBillCRIds[x]) {
					isBC = true;
					break;
				}
			}

			if (!isBC)
				arrBillIds.push(arrTempBillIds[vx]);
		}

		dLog('createCSV', 'arrBillIds = ' + arrBillIds);

		if (arrBillIds.length < 1) {
			dLog('createCSV', 'No bill id to generate csv. exit csv creation.');
			return null;
		}

		var arrBillCredits = getBillCredit(arrBillIds);
		var objBillsData = getBillData(arrBillIds);
		var arrBillPO = getPOMap(arrBillIds);
		var arrVendorBills = getPayeeBills(arrBillIds);
		var arrVendorBillsCurr = getPayeeBillsCurrency(arrBillIds); // TODO can
		// be remove
		// if using
		// customer
		// currency
		var nsAcctSub = (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('subsidiary', 'CUSTRECORD_ACCT_MAP_NETSUITE_ACCOUNT'))) ? objAcctMapping[0].getValue(
				'subsidiary', 'CUSTRECORD_ACCT_MAP_NETSUITE_ACCOUNT') : '';
		var objVDCRecResults = getVendorDAC_CCRPaymentRec(nsAcctSub);
		var arrCurrMap = getCurrecnyISOCode();
		var pmtCtr = '';
		var pmtTotalAmt = 0;
		var arrPayeeIds = [];

		// get Total Bill amount
		for (x in arrVendorBills) {

			var arrBillIds = arrVendorBills[x];
			// dLog('creatXMLDoc', 'Vendor Id = ' + x);
			var payeeId = x.split('X@X')[0];
			arrPayeeIds.push(payeeId);

			for (vbill in arrBillIds) {
				pmtTotalAmt += getFloatVal(arrBillAmt[arrBillIds[vbill]]);
			}
		}

		arrPayeeIds = removeDuplicates(arrPayeeIds);
		var arrVendors = getEntityData(arrPayeeIds);
		var arrPayeeInterBillsMemo = getPayeeBillsMemo(arrPayeeIds);
		dLog('createCSV', 'pmtTotalAmt = ' + pmtTotalAmt);

		var csvData = [];
		csvData.push('FILHDR');
		csvData.push(CSV_FILE_DESTINATION);
		csvData.push(CSV_CUSTOMER_ID);
		csvData.push(currDate.format('{MM}/{dd}/{yyyy}'));
		csvData.push(currDate.format('{hh}{mm}'));

		var fileLines = [csvData.join(",")];

		// dLog('createCSV', 'init : data = ' + JSON.stringify(data));

		var lineCtr = 1;

		for (v in arrVendorBills) {

			pmtCtr++;
			csvData = [];
			var arrPayeeCurr = v.split('X@X');
			var payeeId = arrPayeeCurr[0];
			var currId = arrPayeeCurr[1];
			// dLog('createCSV', 'payeeId = ' + payeeId);

			var objVendor = arrVendors[payeeId];
			// dLog('createCSV', 'objVendor = ' + JSON.stringify(objVendor));

			if (isEmpty(objVendor))
				continue;

			var pmtMethod = objVendor.paymentmethod;
			var arrBills = arrVendorBills[payeeId + 'X@X' + currId];
			var pmtRecCurAmt = getHDRTotal(arrBills, arrBillAmt, arrBillCredits, arrBillAmtOrig, arrBillDiscAmt);

			// for (bill in arrBills) {
			// pmtRecCurAmt += getFloatVal(arrBillAmt[arrBills[bill]]);
			// }

			var zipCode = '';
			var payeeCountry = '';
			if (pmtMethod == 'CCR') {
				if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_comppostcode')))
					zipCode = objVDCRecResults[0].getValue('custrecord_comppostcode');

			} else {
				if (!isEmpty(objVendor.vendorpostal))
					zipCode = objVendor.vendorpostal;
			}

			if (!isEmpty(objVendor.vendorcountrycode)) {
				payeeCountry = countryCodeMapping[objVendor.vendorcountrycode];
			}

			csvData.push('PMTHDR');
			csvData.push((!isEmpty(objVDCRecResults) && !isEmpty(objVendor.deliverycode)) ? escapeCSV(objVendor.deliverycode) : '');
			csvData.push((!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_check_template_id'))) ? escapeCSV(objAcctMapping[0]
					.getValue('custrecord_acct_map_check_template_id')) : '');
			csvData.push(currDate.format('{MM}/{dd}/{yyyy}'));
			csvData.push(pmtRecCurAmt.toFixed(2));
			csvData.push((!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_origin_acc'))) ? objAcctMapping[0]
					.getValue('custrecord_acct_map_ext_bank_origin_acc') : '');
			csvData.push(arrBillChkMap[payeeId]);
			fileLines.push(csvData.join(","));

			csvData = [];
			csvData.push('PAYENM');
			csvData.push((!isEmpty(objVendor.vendorname)) ? escapeCSV(objVendor.vendorname) : '');
			csvData.push('');
			csvData.push(escapeCSV(payeeId));
			fileLines.push(csvData.join(","));

			csvData = [];
			csvData.push('PYEADD');
			csvData.push((!isEmpty(objVendor.vendoraddrs1)) ? escapeCSV(objVendor.vendoraddrs1) : '');
			csvData.push('');
			csvData.push((!isEmpty(objVendor.vendorphone)) ? objVendor.vendorphone : '');
			fileLines.push(csvData.join(","));

			csvData = [];
			csvData.push('ADDPYE');
			csvData.push((!isEmpty(objVendor.vendoraddrs2)) ? escapeCSV(objVendor.vendoraddrs2) : '');
			fileLines.push(csvData.join(","));

			csvData = [];
			csvData.push('PYEPOS');
			csvData.push((!isEmpty(objVendor.vendorcity)) ? nlapiEscapeXML(objVendor.vendorcity) : '');
			csvData.push((!isEmpty(objVendor.vendorstateprovince)) ? nlapiEscapeXML(objVendor.vendorstateprovince) : '');
			csvData.push(zipCode);
			csvData.push(payeeCountry);
			fileLines.push(csvData.join(","));

			lineCtr += 5;

			for (y in arrBills) {

				var billId = arrBills[y];
				// dLog('createCSV', 'billId = ' + billId);

				var amt = getFloatVal(arrBillAmtOrig[billId]);
				var discAmt = ((!isEmpty(arrBillDiscAmt[billId])) ? getFloatVal(arrBillDiscAmt[billId]) : 0);
				var desc = '';
				if (!isEmpty(objBillsData[billId].memo)) {

					desc = (isEmpty(objBillsData[billId]) ? '' : setValue(objBillsData[billId].memo));
				}

				var invNumber = '';

				if (USE_BILL_REFERENCE_NUMBER == 'T') {
					invNumber = (isEmpty(objBillsData[billId]) ? '' : setValue(objBillsData[billId].num));
				} else {
					invNumber = (isEmpty(objBillsData[billId]) ? '' : setValue(objBillsData[billId].trnxnumber));
				}

				csvData = [];
				csvData.push('RMTDTL');
				csvData.push(escapeCSV(invNumber));
				csvData.push(escapeCSV(desc));
				csvData.push(nlapiStringToDate(objBillsData[billId].dte).format('{MM}/{dd}/{yyyy}'));
				csvData.push((amt - discAmt).toFixed(2));
				csvData.push(amt.toFixed(2));
				csvData.push(discAmt.toFixed(2));
				fileLines.push(csvData.join(","));

				lineCtr++;

				if (!isEmpty(arrBillCredits[billId])) {

					var arrBC = arrBillCredits[billId];

					for (bc in arrBC) {

						var billCreditAmtP = getFloatVal(arrBC[bc].bcamt);
						var billCreditAmt = (billCreditAmtP * -1);

						// pmtTotalAmt = (pmtTotalAmt - billCreditAmtP);
						// pmtRecCurAmt = (pmtRecCurAmt - billCreditAmtP);

						var desc = '';
						if (!isEmpty(arrBC[bc].bcmemo)) {

							desc = (isEmpty(arrBC[bc].bcmemo) ? '' : setValue(arrBC[bc].bcmemo));
						}

						invNumber = '';

						if (USE_BILL_REFERENCE_NUMBER == 'T') {
							invNumber = (isEmpty(arrBC[bc])) ? '' : setValue(arrBC[bc].bcnum);
						} else {
							invNumber = (isEmpty(arrBC[bc])) ? '' : setValue(arrBC[bc].bctrnxnum);
						}

						csvData = [];
						csvData.push('RMTDTL');
						csvData.push(escapeCSV(invNumber));
						csvData.push(escapeCSV(desc));
						csvData.push(nlapiStringToDate(arrBC[bc].bcdate).format('{MM}/{dd}/{yyyy}'));
						csvData.push(billCreditAmt.toFixed(2));
						csvData.push(billCreditAmt.toFixed(2));
						csvData.push(((!isEmpty(arrBillDiscAmt[billId])) ? getFloatVal(arrBillDiscAmt[billId]) : 0).toFixed(2));
						fileLines.push(csvData.join(","));

						lineCtr++;
					}
				}
			}
		}

		csvData = [];
		csvData.push('FILTRL');
		csvData.push(lineCtr + 1);
		fileLines.push(csvData.join(","));
		return fileLines.join('\r\n');

	} catch (e) {
		var stErrMsg = '';
		if (e.getDetails != undefined) {
			stErrMsg = 'Script Error: ' + e.getCode() + '<br>' + e.getDetails() + '<br>' + e.getStackTrace();
		} else {
			stErrMsg = 'Script Error: ' + e.toString();
		}

		dLog('createCSV | Script Error', stErrMsg);
	}
}

function getHDRTotal(arrBills, arrBillAmt, arrBillCredits, arrBillAmtOrig, arrBillDiscAmt) {

	var pmtRecCurAmt = 0;

	for (y in arrBills) {

		var billId = arrBills[y];
		// dLog('createCSV', 'billId = ' + billId);
		var discAmt = ((!isEmpty(arrBillDiscAmt[billId])) ? getFloatVal(arrBillDiscAmt[billId]) : 0);
		pmtRecCurAmt += getFloatVal(arrBillAmtOrig[billId]);

		if (!isEmpty(arrBillCredits[billId])) {

			var arrBC = arrBillCredits[billId];

			for (bc in arrBC) {

				var billCreditAmtP = getFloatVal(arrBC[bc].bcamt);
				var billCreditAmt = (billCreditAmtP * -1);

				dLog('getHDRTotal', 'Current Bill header total ' + pmtRecCurAmt);
				dLog('getHDRTotal', 'Bill Credit ' + bc + ' amt : ' + billCreditAmt);

				// pmtTotalAmt = (pmtTotalAmt - billCreditAmtP);
				pmtRecCurAmt = (pmtRecCurAmt - billCreditAmtP);
			}
		}

		if (discAmt > 0)
			pmtRecCurAmt = pmtRecCurAmt - discAmt;
	}

	return pmtRecCurAmt;
}

function escapeCSV(val) {
	if (!val)
		return '';
	if (!(/[",\s]/).test(val))
		return val;
	val = val.replace(/"/g, '""');
	return '"' + val + '"';
}

function iskep(val) {
	if (!val)
		return '';

	if (!(/[",\s]/).test(val))
		return nlapiEscapeXML(val);

	var nwstr = val.replace(/[&\/\\#+()$~%":*?<>{}]/g, '');
	return '"' + nwstr + '"';
}