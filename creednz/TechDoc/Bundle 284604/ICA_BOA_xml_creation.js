  var BOX_XML_TEMPLATE = 52890;

function pz(number, length) {
	var my_string = '' + number;
	while (my_string.length < length) {
		my_string = '0' + my_string;
	}

	return my_string;
}

function addWeekdays(date, days) {
	date = moment(date);
	while (days > 0) {
		date = date.add(1, 'days');
		if (date.isoWeekday() !== 6 && date.isoWeekday() !== 7) {
			days -= 1;
		}
	}
	return date;
}

function nodify(node, value) {
	var html = '';
	if (value != '' && value != null) {
		html = '<' + node + '>' + value + '</' + node + '>';
	}
	return html;
}

function processAndSendBOFFile(objAcctMap) {
	try {
		var timeStamp = Date.create().format('{HH}{mm}{ss}{yyyy}{MM}{dd}');
		var fileName = FILE_NAME_PREFIX + timeStamp + '.' + FILE_NAME_EXT;
		var xmlDoc = creatBOAXMLDoc(objAcctMap);

		if (!xmlDoc) return null;

		var xmlData = nlapiXMLToString(xmlDoc);
		xmlData = xmlData.replace(/ xmlns=""/, '');

		var xmlFile = nlapiCreateFile(fileName, 'XMLDOC', xmlData);
		if (BILL_FOLDER) xmlFile.setFolder(BILL_FOLDER);
		var fileId = nlapiSubmitFile(xmlFile);

		dLog('processAndSendXMLFile', 'file 1 Id = ' + fileId);

		if (!isEmpty(VPM_CONNECTOR_FOLDER)) {
			var xmlFile2 = nlapiCreateFile(fileName, 'XMLDOC', xmlData);
			xmlFile2.setFolder(VPM_CONNECTOR_FOLDER);
			var file2Id = nlapiSubmitFile(xmlFile2);

			dLog('processAndSendXMLFile', 'file 2 Id = ' + file2Id);
		}

		// If this checkbox is checked, then send the file to the person that
		// created the payment
		if (SEND_FILE_VIA_EMAIL == 'T') {
			if (!isEmpty(SEND_FILE_EMAIL)) {
				EMAIL_SENDER_EMAIL += ',' + SEND_FILE_EMAIL;
			}

			nlapiSendEmail(EMAIL_SENDER, EMAIL_SENDER_EMAIL, EMAIL_SUBJECT_XML, EMAIL_BODY, null, null, null, xmlFile, true);
		}

		return fileId;
	} catch (e) {
		dLog('processAndSendBOFFile | Script Error', e);
	}
}

function processAndCreateNACHA(objAcctMap) {
	try {
		var timeStamp = Date.create().format('{HH}{mm}{ss}{yyyy}{MM}{dd}');
		var fileName = FILE_NAME_PREFIX + timeStamp + '.' + 'txt';
		// var xmlDoc = createUSACHXMLDoc(objAcctMap);
		var textContents = createNACHADoc(objAcctMap);

		if (!textContents) return null;

		var textFile = nlapiCreateFile(fileName, 'PLAINTEXT', textContents);
		if (BILL_FOLDER) textFile.setFolder(BILL_FOLDER);
		var fileId = nlapiSubmitFile(textFile);

		dLog('processAndCreateNACHA', 'file 1 Id = ' + fileId);
		if (!isEmpty(VPM_CONNECTOR_FOLDER)) {
			var textFile2 = nlapiCreateFile(fileName, 'PLAINTEXT', textContents);
			textFile2.setFolder(VPM_CONNECTOR_FOLDER);
			var file2Id = nlapiSubmitFile(textFile2);
			dLog('processAndCreateNACHA', 'file 2 Id = ' + file2Id);
		}

		if (SEND_FILE_VIA_EMAIL == 'T') {
			if (!isEmpty(SEND_FILE_EMAIL)) {
				EMAIL_SENDER_EMAIL += ',' + SEND_FILE_EMAIL;
			}
			nlapiSendEmail(EMAIL_SENDER, EMAIL_SENDER_EMAIL, EMAIL_SUBJECT_XML, EMAIL_BODY, null, null, null, textFile, true);
		}

		return fileId;
	} catch (e) {
		dLog('processAndCreateNACHA | Script Error', e);
	}
}

function createNACHADoc(objAcctMapping) {
	//Set these variables
	var oam = objAcctMapping[0];
	var today = new Date();
	var d = nlapiStringToDate(BPM_DATE, 'datetime');

	var nsAcctSub = !isEmpty(oam) && !isEmpty(oam.getValue('subsidiary', 'CUSTRECORD_ACCT_MAP_NETSUITE_ACCOUNT')) ? oam.getValue('subsidiary', 'CUSTRECORD_ACCT_MAP_NETSUITE_ACCOUNT') : '';
	var objVDCRecResults = getVendorDAC_CCRPaymentRec(nsAcctSub);

	dLog('createNACHADoc:arrBillsProcessed', JSON.stringify(arrBillsProcessed));
	dLog('createNACHADoc:oam', JSON.stringify(oam));

	var text = '';
	var totalLines = 0;
	var tallyCount = 0;
	var sumRouting = 0;
	var totalBillPayments = 0;

	//Create File Header

	var header = '';
	header += '1';
	header += '01';
	header += ' ' + _.padStart(oam.getValue('custrecord_acct_map_ext_bank_ori_bank_id').substring(0, 9), 9, ' ');
	header += _.padStart(oam.getValue('custrecord_acct_map_ceo_company_id').substring(0, 10), 10, ' ');
	header += moment(d).format('YYMMDD') || moment(today).format('YYMMDD');
	header += moment(d).format('hhmm') || moment(today).format('hhmm');
	header += COUNTER; //TODO - assign day counter;
	header += '094';
	header += '10';
	header += '1';
	header += _.padEnd(objVDCRecResults[0].getValue('custrecord_bankname').toUpperCase(), 23, ' ');
	header += _.padEnd('', 23, ' ');
	header += _.padEnd('', 8, ' ');
	header += '\n';
	totalLines++;

	text += header;

	var arrVendors = getEntityData(_.map(arrBillsProcessed, 'payeeid'));
	dLog('arrVendors', JSON.stringify(arrVendors));
	arrVendors = arrVendors.concat(getEmployeeData(_.map(arrBillsProcessed, 'payeeid')));
	dLog('arrVendors concat', JSON.stringify(arrVendors));
	var billsProcessed = [];
	for (var i = 0; i < arrBillsProcessed.length; i++) {
		var data = arrBillsProcessed[i];
		dLog('data', JSON.stringify(data));
		try {
			data['paymentformat'] = _.find(arrVendors, { internalid: String(data.payeeid) }).payformat; //arrVendors[data.payeeid].payformat;
		} catch (e) {
			data['paymentformat'] = '';
		}

		billsProcessed.push(data);
	}

	var groupedByPaymentFormat = _.groupBy(billsProcessed, 'paymentformat');

	dLog('groupedByPaymentFormat', JSON.stringify(groupedByPaymentFormat));

	var tallyCount = 0;
	var batchNum = 0;
	var totalSumRouting = 0;
	var totalPayments = 0;
	for (x in groupedByPaymentFormat) {
		// var payments = groupedByPaymentFormat[x];
		var grouped = _.groupBy(groupedByPaymentFormat[x], 'payment');
		var paymentformat = x;
    dLog('grouped', JSON.stringify(grouped));
    dLog('paymentformat', JSON.stringify(paymentformat));

		//Create header
		var batchHeader = '';
		batchHeader += '5';
		batchHeader += '220';
		batchHeader += _.padStart(objVDCRecResults[0].getValue('custrecord_companyname').substring(0, 16), 16, ' ');
		batchHeader += _.padStart('', 20, ' ');
		batchHeader += _.padStart(oam.getValue('custrecord_acct_map_ceo_company_id').substring(0, 10), 10, ' ');
		batchHeader += _.padStart(paymentformat, 3, ' ');
		batchHeader += 'PAYMENT   '; //_.padStart(billPayment.getValue("tranid"), 10, ' '); //Ask Al
		batchHeader += _.padStart('', 6, ' '); //Suppose to be date
		batchHeader += moment(d).format('YYMMDD') || moment(today).format('YYMMDD');
		batchHeader += _.padStart('', 3, ' ');
		batchHeader += '1';
		batchHeader += _.padStart(oam.getValue('custrecord_acct_map_ext_bank_ori_bank_id').substring(0, 8), 8, ' ');
		batchHeader += _.padStart(batchNum + 1, 7, '0');
		batchHeader += '\n';
		totalLines++;
		text += batchHeader;

		var entryDetailTotal = 0;
		var sumRoutingEntries = 0; //Number(oam.getValue('custrecord_acct_map_ext_bank_ori_bank_id'));

		var paymentsCount = 0;
		for (y in grouped) {
			var paymentAmount = 0;
			var payeeid = 0;
			for (var i = 0; i < grouped[y].length; i++) {
				paymentAmount += Number(grouped[y][i].payamt);
				payeeid = grouped[y][i].payeeid;
			}
			dLog('paymentAmount', paymentAmount);
			dLog('payeeid', payeeid);

			// var objVendor = arrVendors[payeeid];
			        var objVendor = _.find(arrVendors, { internalid: String(payeeid)});
				//v.ar objVendor = _.find(arrVendors, { internalid: String(payeeId), paymentmethod: String(paymentMethod) })[0];
			dLog('objVendor', JSON.stringify(objVendor));
			//Create entry detail
			var entryDetail = '';
			entryDetail += '6';
			entryDetail += '22';
			entryDetail += _.padStart(objVendor.recbankprimid.substring(0, 8), 8, ' ');
			entryDetail += objVendor.recbankprimid.charAt(objVendor.recbankprimid.length - 1);
			entryDetail += _.padEnd(objVendor.recpartyaccount, 17, ' ');
			entryDetail += _.padStart(String(paymentAmount.toFixed(2)).replace('.', ''), 10, '0');
			entryDetail += _.padStart(objVendor.entityid.substring(0, 15), 15, ' ');
			entryDetail += _.padStart(objVendor.vendorname.substring(0, 22), 22, ' ');
			entryDetail += _.padStart('', 2, ' ');
			entryDetail += '0';
			entryDetail += _.padStart(objVendor.recbankprimid.substring(0, 8), 15, ' ');
			entryDetail += '\n';
			totalLines++;
			text += entryDetail;

			entryDetailTotal += Number(paymentAmount);
			totalPayments += Number(paymentAmount);
			sumRoutingEntries += Number(objVendor.recbankprimid.substring(0, 8));
			totalSumRouting += Number(objVendor.recbankprimid.substring(0, 8));
			tallyCount++;
			paymentsCount++;
		}

		// for (var i=0; i<payments.length; i++) {
		//         var billPayment = payments[i];
		//         var objVendor = arrVendors[payments[i].payeeid];
		//         //Create entry detail
		//         var entryDetail = "";
		//         entryDetail += "6";
		//         entryDetail += "22";
		//         entryDetail += objVendor.recbankprimid;
		//         entryDetail += objVendor.recbankprimid.charAt(objVendor.recbankprimid.length-1);
		//         entryDetail += _.padStart(objVendor.recpartyaccount, 17, ' ');
		//         entryDetail += _.padStart(billPayment.payamt.replace('.', ''), 10, ' '); //TODO: remove punctuations
		//         entryDetail += _.padStart(objVendor.entityid.substring(0, 15), 15, ' ');
		//         entryDetail += _.padStart(objVendor.vendorname.substring(0, 22), 22, ' ');
		//         entryDetail += _.padStart("", 2, ' ');
		//         entryDetail += "1";
		//         entryDetail += _.padStart(objVendor.recbankprimid.substring(0,8), 15, ' ');
		//         entryDetail += '\n';
		//         totalLines++;
		//         text += entryDetail;

		//         entryDetailTotal += Number(billPayment.payamt);
		//         totalPayments += Number(billPayment.payamt);
		//         sumRoutingEntries += Number(objVendor.recbankprimid);
		//         totalSumRouting += Number(objVendor.recbankprimid);
		//         tallyCount++;
		// }

		//Create batch control
		var batchControl = '';
		batchControl += '8';
		batchControl += '220';
		batchControl += _.padStart(paymentsCount, 6, '0'); //correct
		batchControl += _.padStart(sumRoutingEntries, 10, '0'); //just add the values of recbankprimid
		batchControl += _.padStart('', 12, '0');
		batchControl += _.padStart(String(entryDetailTotal.toFixed(2)).replace('.', ''), 12, '0'); //TODO: Get the total in amounts of all payments in the batch
		batchControl += _.padStart(oam.getValue('custrecord_acct_map_ceo_company_id').substring(0, 10), 10, ' ');
		batchControl += _.padStart('', 19, ' ');
		batchControl += _.padStart('', 6, ' ');
		batchControl += _.padStart(oam.getValue('custrecord_acct_map_ceo_company_id').substring(0, 8), 8, ' ');
		batchControl += _.padStart(batchNum + 1, 7, '0'); //REVIEW BATCH NUMBER
		batchControl += '\n';
		totalLines++;
		text += batchControl;
		batchNum++;
	}

	//Create Trailer
	var trailer = '';
	trailer += '9';
	trailer += _.padStart(batchNum, 6, '0'); //no of batches
	trailer += _.padStart(Math.ceil(totalLines / 10), 6, '0');
	trailer += _.padStart(tallyCount, 8, '0');
	trailer += _.padStart(totalSumRouting, 10, '0'); //TODO: sum of all recbankprimid
	trailer += _.padEnd('', 12, '0');
	trailer += _.padStart(String(totalPayments.toFixed(2)).replace('.', ''), 12, '0'); //TODO: total in amounts
	trailer += _.padEnd('', 39, ' ');
	trailer += '\n';
	text += trailer;

	dLog('text', text);

	return text;
}

function processAndSendRBC_DAC_XMLFile(objAcctMap) {
	try {
		var timeStamp = Date.create().format('{HH}{mm}{ss}{yyyy}{MM}{dd}');
		var fileName = FILE_NAME_PREFIX + timeStamp + '.' + FILE_NAME_EXT;
		// var xmlDoc = createUSACHXMLDoc(objAcctMap);
		var xmlDoc = createRBC_DAC_XMLDoc(objAcctMap);

		if (!xmlDoc) return null;

		var xmlFile = nlapiCreateFile(fileName, 'XMLDOC', xmlDoc);
		if (BILL_FOLDER) xmlFile.setFolder(BILL_FOLDER);
		var fileId = nlapiSubmitFile(xmlFile);

		dLog('processAndSendRBC_DAC_XMLFile', 'file 1 Id = ' + fileId);
		if (!isEmpty(VPM_CONNECTOR_FOLDER)) {
			var xmlFile2 = nlapiCreateFile(fileName, 'XMLDOC', xmlDoc);
			xmlFile2.setFolder(VPM_CONNECTOR_FOLDER);
			var file2Id = nlapiSubmitFile(xmlFile2);
			dLog('processAndSendRBC_DAC_XMLFile', 'file 2 Id = ' + file2Id);
		}

		if (SEND_FILE_VIA_EMAIL == 'T') {
			if (!isEmpty(SEND_FILE_EMAIL)) {
				EMAIL_SENDER_EMAIL += ',' + SEND_FILE_EMAIL;
			}
			nlapiSendEmail(EMAIL_SENDER, EMAIL_SENDER_EMAIL, EMAIL_SUBJECT_XML, EMAIL_BODY, null, null, null, xmlFile, true);
		}

		return fileId;
	} catch (e) {
		dLog('processAndSendRBC_DAC_XMLFile | Script Error', e);
	}
}

function processAndSendJPM_ISO_XMLFile(objAcctMap) {
	try {
		var timeStamp = Date.create().format('{HH}{mm}{ss}{yyyy}{MM}{dd}');
		var fileName = FILE_NAME_PREFIX + timeStamp + '.' + FILE_NAME_EXT;
		// var xmlDoc = createUSACHXMLDoc(objAcctMap);
		var xmlDoc = createJPM_ISO_XMLDoc(objAcctMap);

		if (!xmlDoc) return null;

		var xmlFile = nlapiCreateFile(fileName, 'XMLDOC', xmlDoc);
		if (BILL_FOLDER) xmlFile.setFolder(BILL_FOLDER);
		var fileId = nlapiSubmitFile(xmlFile);

		dLog('processAndSendJPM_ISO_XMLFile', 'file 1 Id = ' + fileId);
		if (!isEmpty(VPM_CONNECTOR_FOLDER)) {
			var xmlFile2 = nlapiCreateFile(fileName, 'XMLDOC', xmlDoc);
			xmlFile2.setFolder(VPM_CONNECTOR_FOLDER);
			var file2Id = nlapiSubmitFile(xmlFile2);
			dLog('processAndSendJPM_ISO_XMLFile', 'file 2 Id = ' + file2Id);
		}

		if (SEND_FILE_VIA_EMAIL == 'T') {
			if (!isEmpty(SEND_FILE_EMAIL)) {
				EMAIL_SENDER_EMAIL += ',' + SEND_FILE_EMAIL;
			}
			nlapiSendEmail(EMAIL_SENDER, EMAIL_SENDER_EMAIL, EMAIL_SUBJECT_XML, EMAIL_BODY, null, null, null, xmlFile, true);
		}

		return fileId;
	} catch (e) {
		dLog('processAndSendJPM_ISO_XMLFile | Script Error', e);
	}
}

function processAndSendSANTANDER_POLAND_XMLFile(objAcctMap) {
	try {
		var timeStamp = Date.create().format('{HH}{mm}{ss}{yyyy}{MM}{dd}');
		var fileName = FILE_NAME_PREFIX + timeStamp + '.' + FILE_NAME_EXT;
		// var xmlDoc = createUSACHXMLDoc(objAcctMap);
		var xmlDoc = createSANTANDER_POLAND_XMLDoc(objAcctMap);

		if (!xmlDoc) return null;

		var xmlFile = nlapiCreateFile(fileName, 'XMLDOC', xmlDoc);
		if (BILL_FOLDER) xmlFile.setFolder(BILL_FOLDER);
		var fileId = nlapiSubmitFile(xmlFile);

		dLog('processAndSendSANTANDER_POLAND_XMLFile', 'file 1 Id = ' + fileId);
		if (!isEmpty(VPM_CONNECTOR_FOLDER)) {
			var xmlFile2 = nlapiCreateFile(fileName, 'XMLDOC', xmlDoc);
			xmlFile2.setFolder(VPM_CONNECTOR_FOLDER);
			var file2Id = nlapiSubmitFile(xmlFile2);
			dLog('processAndSendSANTANDER_POLAND_XMLFile', 'file 2 Id = ' + file2Id);
		}

		if (SEND_FILE_VIA_EMAIL == 'T') {
			if (!isEmpty(SEND_FILE_EMAIL)) {
				EMAIL_SENDER_EMAIL += ',' + SEND_FILE_EMAIL;
			}
			nlapiSendEmail(EMAIL_SENDER, EMAIL_SENDER_EMAIL, EMAIL_SUBJECT_XML, EMAIL_BODY, null, null, null, xmlFile, true);
		}

		return fileId;
	} catch (e) {
		dLog('processAndSendSANTANDER_POLAND_XMLFile | Script Error', e);
	}
}


function processAndSendSVB_CHECK_ISO_XMLFile(objAcctMap) {
	try {
		var timeStamp = Date.create().format('{HH}{mm}{ss}{yyyy}{MM}{dd}');
		var fileName = FILE_NAME_PREFIX + timeStamp + '.' + FILE_NAME_EXT;
		// var xmlDoc = createUSACHXMLDoc(objAcctMap);
		var xmlDoc = createSVB_CHECK_ISO_XMLDoc(objAcctMap);

		if (!xmlDoc) return null;

		var xmlFile = nlapiCreateFile(fileName, 'XMLDOC', xmlDoc);
		if (BILL_FOLDER) xmlFile.setFolder(BILL_FOLDER);
		var fileId = nlapiSubmitFile(xmlFile);

		dLog('processAndSendSVB_CHECK_ISO_XMLFile', 'file 1 Id = ' + fileId);
		if (!isEmpty(VPM_CONNECTOR_FOLDER)) {
			var xmlFile2 = nlapiCreateFile(fileName, 'XMLDOC', xmlDoc);
			xmlFile2.setFolder(VPM_CONNECTOR_FOLDER);
			var file2Id = nlapiSubmitFile(xmlFile2);
			dLog('processAndSendSVB_CHECK_ISO_XMLFile', 'file 2 Id = ' + file2Id);
		}

		if (SEND_FILE_VIA_EMAIL == 'T') {
			if (!isEmpty(SEND_FILE_EMAIL)) {
				EMAIL_SENDER_EMAIL += ',' + SEND_FILE_EMAIL;
			}
			nlapiSendEmail(EMAIL_SENDER, EMAIL_SENDER_EMAIL, EMAIL_SUBJECT_XML, EMAIL_BODY, null, null, null, xmlFile, true);
		}

		return fileId;
	} catch (e) {
		dLog('processAndSendSVB_CHECK_ISO_XMLFile | Script Error', e);
	}
}


function processAndSendHSBCKoreaXMLFile(objAcctMap) {
  try {
		var timeStamp = Date.create().format('{HH}{mm}{ss}{yyyy}{MM}{dd}');
		var fileName = FILE_NAME_PREFIX + timeStamp + '.' + FILE_NAME_EXT;
		var xmlDoc = createHSBC_KOREA_XMLDoc(objAcctMap);
    // createHSBCKorea_XMLDoc(objAcctMap);

		if (!xmlDoc) return null;

		var xmlData = nlapiXMLToString(xmlDoc);
		xmlData = xmlData.replace(/ xmlns=""/, '');

		var xmlFile = nlapiCreateFile(fileName, 'XMLDOC', xmlData);
		if (BILL_FOLDER) xmlFile.setFolder(BILL_FOLDER);
		var fileId = nlapiSubmitFile(xmlFile);

		dLog('processAndSendHSBCKoreaXMLFile', 'file 1 Id = ' + fileId);

		if (!isEmpty(VPM_CONNECTOR_FOLDER)) {
			var xmlFile2 = nlapiCreateFile(fileName, 'XMLDOC', xmlData);
			xmlFile2.setFolder(VPM_CONNECTOR_FOLDER);
			var file2Id = nlapiSubmitFile(xmlFile2);

			dLog('processAndSendHSBCKoreaXMLFile', 'file 2 Id = ' + file2Id);
		}

		// If this checkbox is checked, then send the file to the person that
		// created the payment
		if (SEND_FILE_VIA_EMAIL == 'T') {
			if (!isEmpty(SEND_FILE_EMAIL)) {
				EMAIL_SENDER_EMAIL += ',' + SEND_FILE_EMAIL;
			}

			nlapiSendEmail(EMAIL_SENDER, EMAIL_SENDER_EMAIL, EMAIL_SUBJECT_XML, EMAIL_BODY, null, null, null, xmlFile, true);
		}

		return fileId;
	} catch (e) {
		dLog('processAndSendHSBCKoreaXMLFile | Script Error', e);
	}  
	// try {
	// 	var timeStamp = Date.create().format('{HH}{mm}{ss}{yyyy}{MM}{dd}');
	// 	var fileName = FILE_NAME_PREFIX + timeStamp + '.' + FILE_NAME_EXT;
	// 	var xmlDoc = createHSBCKorea_XMLDoc(objAcctMap);

	// 	if (!xmlDoc) return null;

	// 	var xmlFile = nlapiCreateFile(fileName, 'XMLDOC', xmlDoc);
	// 	if (BILL_FOLDER) xmlFile.setFolder(BILL_FOLDER);
	// 	var fileId = nlapiSubmitFile(xmlFile);

	// 	dLog('processAndSendHSBCKoreaXMLFile', 'file 1 Id = ' + fileId);
	// 	if (!isEmpty(VPM_CONNECTOR_FOLDER)) {
	// 		var xmlFile2 = nlapiCreateFile(fileName, 'XMLDOC', xmlDoc);
	// 		xmlFile2.setFolder(VPM_CONNECTOR_FOLDER);
	// 		var file2Id = nlapiSubmitFile(xmlFile2);
	// 		dLog('processAndSendHSBCKoreaXMLFile', 'file 2 Id = ' + file2Id);
	// 	}

	// 	if (SEND_FILE_VIA_EMAIL == 'T') {
	// 		if (!isEmpty(SEND_FILE_EMAIL)) {
	// 			EMAIL_SENDER_EMAIL += ',' + SEND_FILE_EMAIL;
	// 		}
	// 		nlapiSendEmail(EMAIL_SENDER, EMAIL_SENDER_EMAIL, EMAIL_SUBJECT_XML, EMAIL_BODY, null, null, null, xmlFile, true);
	// 	}
	// 	return fileId;
	// } catch (e) {
	// 	dLog('processAndSendHSBCKoreaXMLFile | Script Error', e);
	// }
}

function processAndSendHSBCChinaXMLFile(objAcctMap) {
	try {
		var timeStamp = Date.create().format('{HH}{mm}{ss}{yyyy}{MM}{dd}');
		var fileName = FILE_NAME_PREFIX + timeStamp + '.' + FILE_NAME_EXT;
		// var xmlDoc = createHSBCChina_XMLDoc(objAcctMap);
    var xmlDoc = createHSBC_CHINA_XMLDoc(objAcctMap);
		if (!xmlDoc) return null;

		var xmlData = nlapiXMLToString(xmlDoc);
		xmlData = xmlData.replace(/ xmlns=""/, '');

		var xmlFile = nlapiCreateFile(fileName, 'XMLDOC', xmlData);
		if (BILL_FOLDER) xmlFile.setFolder(BILL_FOLDER);
		var fileId = nlapiSubmitFile(xmlFile);

		dLog('processAndSendHSBCChinaXMLFile', 'file 1 Id = ' + fileId);

		if (!isEmpty(VPM_CONNECTOR_FOLDER)) {
			var xmlFile2 = nlapiCreateFile(fileName, 'XMLDOC', xmlData);
			xmlFile2.setFolder(VPM_CONNECTOR_FOLDER);
			var file2Id = nlapiSubmitFile(xmlFile2);

			dLog('processAndSendHSBCChinaXMLFile', 'file 2 Id = ' + file2Id);
		}

		// If this checkbox is checked, then send the file to the person that
		// created the payment
		if (SEND_FILE_VIA_EMAIL == 'T') {
			if (!isEmpty(SEND_FILE_EMAIL)) {
				EMAIL_SENDER_EMAIL += ',' + SEND_FILE_EMAIL;
			}

			nlapiSendEmail(EMAIL_SENDER, EMAIL_SENDER_EMAIL, EMAIL_SUBJECT_XML, EMAIL_BODY, null, null, null, xmlFile, true);
		}

		return fileId;
	} catch (e) {
		dLog('processAndSendHSBCChinaXMLFile | Script Error', e);
	}  
}
function processAndSendHSBCIndiaXMLFile(objAcctMap) {
	try {
		var timeStamp = Date.create().format('{HH}{mm}{ss}{yyyy}{MM}{dd}');
		var fileName = FILE_NAME_PREFIX + timeStamp + '.' + FILE_NAME_EXT;
		var xmlDoc = createHSBCIndia_XMLDoc(objAcctMap);

		if (!xmlDoc) return null;

		var xmlFile = nlapiCreateFile(fileName, 'XMLDOC', xmlDoc);
		if (BILL_FOLDER) xmlFile.setFolder(BILL_FOLDER);
		var fileId = nlapiSubmitFile(xmlFile);

		dLog('processAndSendHSBCIndiaXMLFile', 'file 1 Id = ' + fileId);
		if (!isEmpty(VPM_CONNECTOR_FOLDER)) {
			var xmlFile2 = nlapiCreateFile(fileName, 'XMLDOC', xmlDoc);
			xmlFile2.setFolder(VPM_CONNECTOR_FOLDER);
			var file2Id = nlapiSubmitFile(xmlFile2);
			dLog('processAndSendHSBCIndiaXMLFile', 'file 2 Id = ' + file2Id);
		}

		if (SEND_FILE_VIA_EMAIL == 'T') {
			if (!isEmpty(SEND_FILE_EMAIL)) {
				EMAIL_SENDER_EMAIL += ',' + SEND_FILE_EMAIL;
			}
			nlapiSendEmail(EMAIL_SENDER, EMAIL_SENDER_EMAIL, EMAIL_SUBJECT_XML, EMAIL_BODY, null, null, null, xmlFile, true);
		}
		return fileId;
	} catch (e) {
		dLog('processAndSendHSBCIndiaXMLFile | Script Error', e);
	}
}
function processAndSendHDFCNEFTJSONFile(objAcctMap) {
	try {
		var timeStamp = Date.create().format('{HH}{mm}{ss}{yyyy}{MM}{dd}');
		var fileName = FILE_NAME_PREFIX + timeStamp + '.' + 'json';
		var jsonDoc = createHDFCNEFT_JSON(objAcctMap);

		if (!jsonDoc) return null;

		var jsonFile = nlapiCreateFile(fileName, 'JSON', jsonDoc);
		if (BILL_FOLDER) jsonFile.setFolder(BILL_FOLDER);
		var fileId = nlapiSubmitFile(jsonFile);

		dLog('processAndSendHDFCNEFTJSONFile', 'file 1 Id = ' + fileId);
		if (!isEmpty(VPM_CONNECTOR_FOLDER)) {
			var jsonFile2 = nlapiCreateFile(fileName, 'JSON', jsonDoc);
			jsonFile2.setFolder(VPM_CONNECTOR_FOLDER);
			var file2Id = nlapiSubmitFile(jsonFile2);
			dLog('processAndSendHDFCNEFTJSONFile', 'file 2 Id = ' + file2Id);
		}

		if (SEND_FILE_VIA_EMAIL == 'T') {
			if (!isEmpty(SEND_FILE_EMAIL)) {
				EMAIL_SENDER_EMAIL += ',' + SEND_FILE_EMAIL;
			}
			nlapiSendEmail(EMAIL_SENDER, EMAIL_SENDER_EMAIL, EMAIL_SUBJECT_XML, EMAIL_BODY, null, null, null, jsonFile, true);
		}
		return fileId;
	} catch (e) {
		dLog('processAndSendHDFCNEFTJSONFile | Script Error', e);
	}
}

function combineBillsByPayee(arrBillsProcessed) {
  var combinedBills = {};

  for (var i = 0; i < arrBillsProcessed.length; i++) {
      var bill = arrBillsProcessed[i];
      var payeeKey = bill.payee + '-' + bill.payeeid;

      if (!combinedBills[payeeKey]) {
          combinedBills[payeeKey] = {
              payee: bill.payee,
              payeeid: bill.payeeid,
              totalAmount: 0,
              bills: [],
              payment: bill.payment
          };
      }

      combinedBills[payeeKey].bills.push({
          id: bill.id,
          origamt: bill.origamt,
          amtdue: bill.amtdue,
          pay: bill.pay,
          payamt: bill.payamt,
          paymethod: bill.paymethod,
          discamt: bill.discamt,
          curr: bill.curr,
          currid: bill.currid,
          sub: bill.sub,
          subtext: bill.subtext,
          refnum: bill.refnum,
          billnum: bill.billnum,
          payment: bill.payment,
          duedate: bill.duedate
      });

      combinedBills[payeeKey].totalAmount += parseFloat(bill.amtdue);
  }

  var combinedResults = [];
  for (var key in combinedBills) {
      combinedResults.push(combinedBills[key]);
  }

  return combinedResults;
}


function createHDFCNEFT_JSON(objAcctMapping) {
  //JSON File
  dLog('createHDFCNEFT_JSON', 'start');
  var jsonArr = [];

  //Create JSON
  dLog('arrBillsProcessed', JSON.stringify({ arrBillsProcessed: arrBillsProcessed }));

	var arrPayeeIds = [];
	for (var i = 0; i < arrBillsProcessed.length; i++) {
		if (!_.includes(arrPayeeIds, arrBillsProcessed[i].payeeid)) {
			arrPayeeIds.push(arrBillsProcessed[i].payeeid);
		}
	}
	var arrVendors = getEmployeeData(arrPayeeIds);

  var combinedBillsProcessed = combineBillsByPayee(arrBillsProcessed);
  
  for (var i = 0; i < combinedBillsProcessed.length; i++) {
    dLog('combinedBillsProcessed[i]', JSON.stringify(combinedBillsProcessed[i]));
    var objVendor = _.find(arrVendors, { internalid: String(combinedBillsProcessed[i].payeeid) });

    jsonArr.push({
      'LOGIN_ID': 'APIUSER@CBXGRP1',
      'INPUT_GCIF': objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id') || '',
      'TRANSFER_TYPE_DESC': 'NEFT',
      'BENE_BANK': objVendor.vbankname,
      'INPUT_DEBIT_AMOUNT': combinedBillsProcessed[i].totalAmount,
      'INPUT_VALUE_DATE': moment(new Date()).format('DD-MM-YYYY'),
      'TRANSACTION_TYPE': 'SINGLE',
      'INPUT_DEBIT_ORG_ACC_NO': objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_origin_acc') || '',
      'INPUT_BUSINESS_PROD': 'VENDBUS01',
      'BENE_ID': 'NETSUITEID',
      'BENE_TYPE': 'ADHOC',
      'BENE_ACC_NAME': objVendor.vendorname,
      'BENE_ACC_NO': objVendor.recpartyaccount,
      'BENE_BRANCH': objVendor.vbankname,
      'BENE_IDN_CODE': objAcctMapping[0].getValue('custrecord_acct_map_ceo_company_id'),
      'EMAIL_ADDR_VIEW': objVendor.vemailadrs,
      'PAYMENT_REF_NO': combinedBillsProcessed[i].payment     
    });
  }
  dLog('jsonArr', JSON.stringify(jsonArr));
  return JSON.stringify(jsonArr);  
}

function processAndSendBOA_ISO_XMLFile(objAcctMap) {
	try {
		var timeStamp = Date.create().format('{HH}{mm}{ss}{yyyy}{MM}{dd}');
		var fileName = FILE_NAME_PREFIX + timeStamp + '.' + FILE_NAME_EXT;
		var xmlDoc = createBOA_ISO_XMLDoc(objAcctMap);

		if (!xmlDoc) return null;

		var xmlFile = nlapiCreateFile(fileName, 'XMLDOC', xmlDoc);
		if (BILL_FOLDER) xmlFile.setFolder(BILL_FOLDER);
		var fileId = nlapiSubmitFile(xmlFile);

		dLog('processAndSendBOA_ISO_XMLFile', 'file 1 Id = ' + fileId);
		if (!isEmpty(VPM_CONNECTOR_FOLDER)) {
			var xmlFile2 = nlapiCreateFile(fileName, 'XMLDOC', xmlDoc);
			xmlFile2.setFolder(VPM_CONNECTOR_FOLDER);
			var file2Id = nlapiSubmitFile(xmlFile2);
			dLog('processAndSendBOA_ISO_XMLFile', 'file 2 Id = ' + file2Id);
		}

		if (SEND_FILE_VIA_EMAIL == 'T') {
			if (!isEmpty(SEND_FILE_EMAIL)) {
				EMAIL_SENDER_EMAIL += ',' + SEND_FILE_EMAIL;
			}
			nlapiSendEmail(EMAIL_SENDER, EMAIL_SENDER_EMAIL, EMAIL_SUBJECT_XML, EMAIL_BODY, null, null, null, xmlFile, true);
		}

		return fileId;
	} catch (e) {
		dLog('processAndSendBOA_ISO_XMLFile | Script Error', e);
	}
}

function processAndSendUBC_XMLFile(objAcctMap) {
	try {
		var timeStamp = Date.create().format('{HH}{mm}{ss}{yyyy}{MM}{dd}');
		var fileName = FILE_NAME_PREFIX + timeStamp + '.' + FILE_NAME_EXT;
		var xmlDoc = createUBC_XMLDoc(objAcctMap);

		if (!xmlDoc) return null;

		var xmlFile = nlapiCreateFile(fileName, 'XMLDOC', xmlDoc);
		if (BILL_FOLDER) xmlFile.setFolder(BILL_FOLDER);
		var fileId = nlapiSubmitFile(xmlFile);

		dLog('processAndSendUBC_XMLFile', 'file 1 Id = ' + fileId);
		if (!isEmpty(VPM_CONNECTOR_FOLDER)) {
			var xmlFile2 = nlapiCreateFile(fileName, 'XMLDOC', xmlDoc);
			xmlFile2.setFolder(VPM_CONNECTOR_FOLDER);
			var file2Id = nlapiSubmitFile(xmlFile2);
			dLog('processAndSendUBC_XMLFile', 'file 2 Id = ' + file2Id);
		}

		if (SEND_FILE_VIA_EMAIL == 'T') {
			if (!isEmpty(SEND_FILE_EMAIL)) {
				EMAIL_SENDER_EMAIL += ',' + SEND_FILE_EMAIL;
			}
			nlapiSendEmail(EMAIL_SENDER, EMAIL_SENDER_EMAIL, EMAIL_SUBJECT_XML, EMAIL_BODY, null, null, null, xmlFile, true);
		}

		return fileId;
	} catch (e) {
		dLog('processAndSendUBC_XMLFile | Script Error', e);
	}
}

function processAndSendBMO_ISO_XMLFile(objAcctMap) {
	try {
		var timeStamp = Date.create().format('{HH}{mm}{ss}{yyyy}{MM}{dd}');
		var fileName = FILE_NAME_PREFIX + timeStamp + '.' + FILE_NAME_EXT;
		// var xmlDoc = createUSACHXMLDoc(objAcctMap);
		var xmlDoc = createBMO_ISO_XMLDoc(objAcctMap);

		if (!xmlDoc) return null;

		var xmlFile = nlapiCreateFile(fileName, 'XMLDOC', xmlDoc);
		if (BILL_FOLDER) xmlFile.setFolder(BILL_FOLDER);
		var fileId = nlapiSubmitFile(xmlFile);

		dLog('processAndSendBMO_ISO_XMLFile', 'file 1 Id = ' + fileId);
		if (!isEmpty(VPM_CONNECTOR_FOLDER)) {
			var xmlFile2 = nlapiCreateFile(fileName, 'XMLDOC', xmlDoc);
			xmlFile2.setFolder(VPM_CONNECTOR_FOLDER);
			var file2Id = nlapiSubmitFile(xmlFile2);
			dLog('processAndSendBMO_ISO_XMLFile', 'file 2 Id = ' + file2Id);
		}

		if (SEND_FILE_VIA_EMAIL == 'T') {
			if (!isEmpty(SEND_FILE_EMAIL)) {
				EMAIL_SENDER_EMAIL += ',' + SEND_FILE_EMAIL;
			}
			nlapiSendEmail(EMAIL_SENDER, EMAIL_SENDER_EMAIL, EMAIL_SUBJECT_XML, EMAIL_BODY, null, null, null, xmlFile, true);
		}

		return fileId;
	} catch (e) {
		dLog('processAndSendBMO_ISO_XMLFile | Script Error', e);
	}
}

function processAndSendCA_DAC_XMLFile(objAcctMap) {
	try {
		var timeStamp = Date.create().format('{HH}{mm}{ss}{yyyy}{MM}{dd}');
		var fileName = FILE_NAME_PREFIX + timeStamp + '.' + FILE_NAME_EXT;
		// var xmlDoc = createUSACHXMLDoc(objAcctMap);
		var xmlDoc = createCA_DAC_XMLDoc(objAcctMap);

		if (!xmlDoc) return null;

		var xmlFile = nlapiCreateFile(fileName, 'XMLDOC', xmlDoc);
		if (BILL_FOLDER) xmlFile.setFolder(BILL_FOLDER);
		var fileId = nlapiSubmitFile(xmlFile);

		dLog('processAndSendCA_DAC_XMLFile', 'file 1 Id = ' + fileId);
		if (!isEmpty(VPM_CONNECTOR_FOLDER)) {
			var xmlFile2 = nlapiCreateFile(fileName, 'XMLDOC', xmlDoc);
			xmlFile2.setFolder(VPM_CONNECTOR_FOLDER);
			var file2Id = nlapiSubmitFile(xmlFile2);
			dLog('processAndSendCA_DAC_XMLFile', 'file 2 Id = ' + file2Id);
		}

		if (SEND_FILE_VIA_EMAIL == 'T') {
			if (!isEmpty(SEND_FILE_EMAIL)) {
				EMAIL_SENDER_EMAIL += ',' + SEND_FILE_EMAIL;
			}
			nlapiSendEmail(EMAIL_SENDER, EMAIL_SENDER_EMAIL, EMAIL_SUBJECT_XML, EMAIL_BODY, null, null, null, xmlFile, true);
		}

		return fileId;
	} catch (e) {
		dLog('processAndSendCA_DAC_XMLFile | Script Error', e);
	}
}

function processAndSendCA_MTS_XMLFile(objAcctMap) {
	try {
		var timeStamp = Date.create().format('{HH}{mm}{ss}{yyyy}{MM}{dd}');
		var fileName = FILE_NAME_PREFIX + timeStamp + '.' + FILE_NAME_EXT;
		// var xmlDoc = createUSACHXMLDoc(objAcctMap);
		var xmlDoc = createCA_MTS_XMLDoc(objAcctMap);

		if (!xmlDoc) return null;

		var xmlFile = nlapiCreateFile(fileName, 'XMLDOC', xmlDoc);
		if (BILL_FOLDER) xmlFile.setFolder(BILL_FOLDER);
		var fileId = nlapiSubmitFile(xmlFile);

		dLog('processAndSendCA_MTS_XMLFile', 'file 1 Id = ' + fileId);
		if (!isEmpty(VPM_CONNECTOR_FOLDER)) {
			var xmlFile2 = nlapiCreateFile(fileName, 'XMLDOC', xmlDoc);
			xmlFile2.setFolder(VPM_CONNECTOR_FOLDER);
			var file2Id = nlapiSubmitFile(xmlFile2);
			dLog('processAndSendCA_MTS_XMLFile', 'file 2 Id = ' + file2Id);
		}

		if (SEND_FILE_VIA_EMAIL == 'T') {
			if (!isEmpty(SEND_FILE_EMAIL)) {
				EMAIL_SENDER_EMAIL += ',' + SEND_FILE_EMAIL;
			}
			nlapiSendEmail(EMAIL_SENDER, EMAIL_SENDER_EMAIL, EMAIL_SUBJECT_XML, EMAIL_BODY, null, null, null, xmlFile, true);
		}

		return fileId;
	} catch (e) {
		dLog('processAndSendCA_MTS_XMLFile | Script Error', e);
	}
}

function processAndSendBNS_DAC_XMLFile(objAcctMap) {
	try {
		var timeStamp = Date.create().format('{HH}{mm}{ss}{yyyy}{MM}{dd}');
		var fileName = FILE_NAME_PREFIX + timeStamp + '.' + FILE_NAME_EXT;
		// var xmlDoc = createUSACHXMLDoc(objAcctMap);
		var xmlDoc = createBNS_DAC_XMLDoc(objAcctMap);

		if (!xmlDoc) return null;

		var xmlFile = nlapiCreateFile(fileName, 'XMLDOC', xmlDoc);
		if (BILL_FOLDER) xmlFile.setFolder(BILL_FOLDER);
		var fileId = nlapiSubmitFile(xmlFile);

		dLog('processAndSendBNS_DAC_XMLFile', 'file 1 Id = ' + fileId);
		if (!isEmpty(VPM_CONNECTOR_FOLDER)) {
			var xmlFile2 = nlapiCreateFile(fileName, 'XMLDOC', xmlDoc);
			xmlFile2.setFolder(VPM_CONNECTOR_FOLDER);
			var file2Id = nlapiSubmitFile(xmlFile2);
			dLog('processAndSendBNS_DAC_XMLFile', 'file 2 Id = ' + file2Id);
		}

		if (SEND_FILE_VIA_EMAIL == 'T') {
			if (!isEmpty(SEND_FILE_EMAIL)) {
				EMAIL_SENDER_EMAIL += ',' + SEND_FILE_EMAIL;
			}
			nlapiSendEmail(EMAIL_SENDER, EMAIL_SENDER_EMAIL, EMAIL_SUBJECT_XML, EMAIL_BODY, null, null, null, xmlFile, true);
		}

		return fileId;
	} catch (e) {
		dLog('processAndSendBNS_DAC_XMLFile | Script Error', e);
	}
}

function processAndSendBNS_MTS_XMLFile(objAcctMap) {
	try {
		var timeStamp = Date.create().format('{HH}{mm}{ss}{yyyy}{MM}{dd}');
		var fileName = FILE_NAME_PREFIX + timeStamp + '.' + FILE_NAME_EXT;
		// var xmlDoc = createUSACHXMLDoc(objAcctMap);
		var xmlDoc = createBNS_MTS_XMLDoc(objAcctMap);

		if (!xmlDoc) return null;

		var xmlFile = nlapiCreateFile(fileName, 'XMLDOC', xmlDoc);
		if (BILL_FOLDER) xmlFile.setFolder(BILL_FOLDER);
		var fileId = nlapiSubmitFile(xmlFile);

		dLog('processAndSendBNS_MTS_XMLFile', 'file 1 Id = ' + fileId);
		if (!isEmpty(VPM_CONNECTOR_FOLDER)) {
			var xmlFile2 = nlapiCreateFile(fileName, 'XMLDOC', xmlDoc);
			xmlFile2.setFolder(VPM_CONNECTOR_FOLDER);
			var file2Id = nlapiSubmitFile(xmlFile2);
			dLog('processAndSendBNS_MTS_XMLFile', 'file 2 Id = ' + file2Id);
		}

		if (SEND_FILE_VIA_EMAIL == 'T') {
			if (!isEmpty(SEND_FILE_EMAIL)) {
				EMAIL_SENDER_EMAIL += ',' + SEND_FILE_EMAIL;
			}
			nlapiSendEmail(EMAIL_SENDER, EMAIL_SENDER_EMAIL, EMAIL_SUBJECT_XML, EMAIL_BODY, null, null, null, xmlFile, true);
		}

		return fileId;
	} catch (e) {
		dLog('processAndSendCA_MTS_XMLFile | Script Error', e);
	}
}

function processAndSendBNS_IAC_XMLFile(objAcctMap) {
	try {
		var timeStamp = Date.create().format('{HH}{mm}{ss}{yyyy}{MM}{dd}');
		var fileName = FILE_NAME_PREFIX + timeStamp + '.' + FILE_NAME_EXT;
		// var xmlDoc = createUSACHXMLDoc(objAcctMap);
		var xmlDoc = createBNS_IAC_XMLDoc(objAcctMap);

		if (!xmlDoc) return null;

		var xmlFile = nlapiCreateFile(fileName, 'XMLDOC', xmlDoc);
		if (BILL_FOLDER) xmlFile.setFolder(BILL_FOLDER);
		var fileId = nlapiSubmitFile(xmlFile);

		dLog('processAndSendBNS_IAC_XMLFile', 'file 1 Id = ' + fileId);
		if (!isEmpty(VPM_CONNECTOR_FOLDER)) {
			var xmlFile2 = nlapiCreateFile(fileName, 'XMLDOC', xmlDoc);
			xmlFile2.setFolder(VPM_CONNECTOR_FOLDER);
			var file2Id = nlapiSubmitFile(xmlFile2);
			dLog('processAndSendBNS_IAC_XMLFile', 'file 2 Id = ' + file2Id);
		}

		if (SEND_FILE_VIA_EMAIL == 'T') {
			if (!isEmpty(SEND_FILE_EMAIL)) {
				EMAIL_SENDER_EMAIL += ',' + SEND_FILE_EMAIL;
			}
			nlapiSendEmail(EMAIL_SENDER, EMAIL_SENDER_EMAIL, EMAIL_SUBJECT_XML, EMAIL_BODY, null, null, null, xmlFile, true);
		}

		return fileId;
	} catch (e) {
		dLog('processAndSendBNS_IAC_XMLFile | Script Error', e);
	}
}

function processAndSendUSACHXMLFile(objAcctMap) {
	try {
		var timeStamp = Date.create().format('{HH}{mm}{ss}{yyyy}{MM}{dd}');
		var fileName = FILE_NAME_PREFIX + timeStamp + '.' + FILE_NAME_EXT;
		var xmlDoc = createUSACHXMLDoc(objAcctMap);

		if (!xmlDoc) return null;

		var xmlFile = nlapiCreateFile(fileName, 'XMLDOC', xmlDoc);
		if (BILL_FOLDER) xmlFile.setFolder(BILL_FOLDER);
		var fileId = nlapiSubmitFile(xmlFile);

		dLog('processAndSendUSACHXMLFile', 'file 1 Id = ' + fileId);
		if (!isEmpty(VPM_CONNECTOR_FOLDER)) {
			var xmlFile2 = nlapiCreateFile(fileName, 'XMLDOC', xmlDoc);
			xmlFile2.setFolder(VPM_CONNECTOR_FOLDER);
			var file2Id = nlapiSubmitFile(xmlFile2);
			dLog('processAndSendUSACHXMLFile', 'file 2 Id = ' + file2Id);
		}

		if (SEND_FILE_VIA_EMAIL == 'T') {
			if (!isEmpty(SEND_FILE_EMAIL)) {
				EMAIL_SENDER_EMAIL += ',' + SEND_FILE_EMAIL;
			}
			nlapiSendEmail(EMAIL_SENDER, EMAIL_SENDER_EMAIL, EMAIL_SUBJECT_XML, EMAIL_BODY, null, null, null, xmlFile, true);
		}

		return fileId;
	} catch (e) {
		dLog('processAndSendUSACHXMLFile | Script Error', e);
	}
}

function processAndSendUSWIREXMLFile(objAcctMap) {
	try {
		var timeStamp = Date.create().format('{HH}{mm}{ss}{yyyy}{MM}{dd}');
		var fileName = FILE_NAME_PREFIX + timeStamp + '.' + FILE_NAME_EXT;
		var xmlDoc = createUSWIREXMLDoc(objAcctMap);

		if (!xmlDoc) return null;

		var xmlFile = nlapiCreateFile(fileName, 'XMLDOC', xmlDoc);
		if (BILL_FOLDER) xmlFile.setFolder(BILL_FOLDER);
		var fileId = nlapiSubmitFile(xmlFile);

		dLog('processAndSendUSWIREXMLFile', 'file 1 Id = ' + fileId);
		if (!isEmpty(VPM_CONNECTOR_FOLDER)) {
			var xmlFile2 = nlapiCreateFile(fileName, 'XMLDOC', xmlDoc);
			xmlFile2.setFolder(VPM_CONNECTOR_FOLDER);
			var file2Id = nlapiSubmitFile(xmlFile2);
			dLog('processAndSendUSWIREXMLFile', 'file 2 Id = ' + file2Id);
		}

		if (SEND_FILE_VIA_EMAIL == 'T') {
			if (!isEmpty(SEND_FILE_EMAIL)) {
				EMAIL_SENDER_EMAIL += ',' + SEND_FILE_EMAIL;
			}
			nlapiSendEmail(EMAIL_SENDER, EMAIL_SENDER_EMAIL, EMAIL_SUBJECT_XML, EMAIL_BODY, null, null, null, xmlFile, true);
		}

		return fileId;
	} catch (e) {
		dLog('processAndSendUSWIREXMLFile | Script Error', e);
	}
}

function processAndSendPacWestFile(objAcctMap) {
	try {
		var timeStamp = Date.create().format('{HH}{mm}{ss}{yyyy}{MM}{dd}');
		var fileName = FILE_NAME_PREFIX + timeStamp + '.' + FILE_NAME_EXT;
		var xmlDoc = createPacWestXMLDoc(objAcctMap);

		if (!xmlDoc) return null;

		var xmlFile = nlapiCreateFile(fileName, 'XMLDOC', xmlDoc);
		if (BILL_FOLDER) xmlFile.setFolder(BILL_FOLDER);
		var fileId = nlapiSubmitFile(xmlFile);

		dLog('processAndSendPacWestFile', 'file 1 Id = ' + fileId);
		if (!isEmpty(VPM_CONNECTOR_FOLDER)) {
			var xmlFile2 = nlapiCreateFile(fileName, 'XMLDOC', xmlDoc);
			xmlFile2.setFolder(VPM_CONNECTOR_FOLDER);
			var file2Id = nlapiSubmitFile(xmlFile2);
			dLog('processAndSendPacWestFile', 'file 2 Id = ' + file2Id);
		}

		if (SEND_FILE_VIA_EMAIL == 'T') {
			if (!isEmpty(SEND_FILE_EMAIL)) {
				EMAIL_SENDER_EMAIL += ',' + SEND_FILE_EMAIL;
			}
			nlapiSendEmail(EMAIL_SENDER, EMAIL_SENDER_EMAIL, EMAIL_SUBJECT_XML, EMAIL_BODY, null, null, null, xmlFile, true);
		}

		return fileId;
	} catch (e) {
		dLog('processAndSendPacWestFile | Script Error', e);
	}
}

function processAndSendAUACHXMLFile(objAcctMap) {
	try {
		var timeStamp = Date.create().format('{HH}{mm}{ss}{yyyy}{MM}{dd}');
		var fileName = FILE_NAME_PREFIX + timeStamp + '.' + FILE_NAME_EXT;
		var xmlDoc = createAUACHXMLDoc(objAcctMap);

		if (!xmlDoc) return null;

		// var xmlData = nlapiXMLToString(xmlDoc);
		// xmlData = xmlData.replace(/ xmlns=""/, '')

		var xmlFile = nlapiCreateFile(fileName, 'XMLDOC', xmlDoc);
		if (BILL_FOLDER) xmlFile.setFolder(BILL_FOLDER);
		var fileId = nlapiSubmitFile(xmlFile);

		dLog('processAndSendAUACHXMLFile', 'file 1 Id = ' + fileId);
		if (!isEmpty(VPM_CONNECTOR_FOLDER)) {
			var xmlFile2 = nlapiCreateFile(fileName, 'XMLDOC', xmlDoc);
			xmlFile2.setFolder(VPM_CONNECTOR_FOLDER);
			var file2Id = nlapiSubmitFile(xmlFile2);
			dLog('processAndSendAUACHXMLFile', 'file 2 Id = ' + file2Id);
		}

		if (SEND_FILE_VIA_EMAIL == 'T') {
			if (!isEmpty(SEND_FILE_EMAIL)) {
				EMAIL_SENDER_EMAIL += ',' + SEND_FILE_EMAIL;
			}
			nlapiSendEmail(EMAIL_SENDER, EMAIL_SENDER_EMAIL, EMAIL_SUBJECT_XML, EMAIL_BODY, null, null, null, xmlFile, true);
		}

		return fileId;
	} catch (e) {
		dLog('processAndSendAUACHXMLFile | Script Error', e);
	}
}

function processAndSendAUPPXMLFile(objAcctMap) {
	try {
		var timeStamp = Date.create().format('{HH}{mm}{ss}{yyyy}{MM}{dd}');
		var fileName = FILE_NAME_PREFIX + timeStamp + '.' + FILE_NAME_EXT;
		var xmlDoc = createPPXMLDoc(objAcctMap);

		if (!xmlDoc) return null;

		// var xmlData = nlapiXMLToString(xmlDoc);
		// xmlData = xmlData.replace(/ xmlns=""/, '')

		var xmlFile = nlapiCreateFile(fileName, 'XMLDOC', xmlDoc);
		if (BILL_FOLDER) xmlFile.setFolder(BILL_FOLDER);
		var fileId = nlapiSubmitFile(xmlFile);

		dLog('processAndSendAUPPXMLFile', 'file 1 Id = ' + fileId);
		if (!isEmpty(VPM_CONNECTOR_FOLDER)) {
			var xmlFile2 = nlapiCreateFile(fileName, 'XMLDOC', xmlDoc);
			xmlFile2.setFolder(VPM_CONNECTOR_FOLDER);
			var file2Id = nlapiSubmitFile(xmlFile2);
			dLog('processAndSendAUPPXMLFile', 'file 2 Id = ' + file2Id);
		}

		if (SEND_FILE_VIA_EMAIL == 'T') {
			if (!isEmpty(SEND_FILE_EMAIL)) {
				EMAIL_SENDER_EMAIL += ',' + SEND_FILE_EMAIL;
			}
			nlapiSendEmail(EMAIL_SENDER, EMAIL_SENDER_EMAIL, EMAIL_SUBJECT_XML, EMAIL_BODY, null, null, null, xmlFile, true);
		}

		return fileId;
	} catch (e) {
		dLog('processAndSendAUPPXMLFile | Script Error', e);
	}
}

function processAndSendJPMXMLFile(objAcctMap) {
	try {
		var timeStamp = Date.create().format('{HH}{mm}{ss}{yyyy}{MM}{dd}');
		var fileName = FILE_NAME_PREFIX + timeStamp + '.' + FILE_NAME_EXT;
		var xmlDoc = createJPMXMLDoc(objAcctMap);

		if (!xmlDoc) return null;

		var xmlData = nlapiXMLToString(xmlDoc);
		xmlData = xmlData.replace(/ xmlns=""/, '');

		var xmlFile = nlapiCreateFile(fileName, 'XMLDOC', xmlData);
		if (BILL_FOLDER) xmlFile.setFolder(BILL_FOLDER);
		var fileId = nlapiSubmitFile(xmlFile);

		dLog('processAndSendXMLFile', 'file 1 Id = ' + fileId);

		if (!isEmpty(VPM_CONNECTOR_FOLDER)) {
			var xmlFile2 = nlapiCreateFile(fileName, 'XMLDOC', xmlData);
			xmlFile2.setFolder(VPM_CONNECTOR_FOLDER);
			var file2Id = nlapiSubmitFile(xmlFile2);

			dLog('processAndSendXMLFile', 'file 2 Id = ' + file2Id);
		}

		// If this checkbox is checked, then send the file to the person that
		// created the payment
		if (SEND_FILE_VIA_EMAIL == 'T') {
			if (!isEmpty(SEND_FILE_EMAIL)) {
				EMAIL_SENDER_EMAIL += ',' + SEND_FILE_EMAIL;
			}

			nlapiSendEmail(EMAIL_SENDER, EMAIL_SENDER_EMAIL, EMAIL_SUBJECT_XML, EMAIL_BODY, null, null, null, xmlFile, true);
		}

		return fileId;
	} catch (e) {
		dLog('processAndSendBOFFile | Script Error', e);
	}
}

function processAndSendEWBXMLFile(objAcctMap) {
	try {
		var timeStamp = Date.create().format('{HH}{mm}{ss}{yyyy}{MM}{dd}');
		var fileName = FILE_NAME_PREFIX + timeStamp + '.' + FILE_NAME_EXT;
		var xmlDoc = createEWBXMLDoc(objAcctMap);

		if (!xmlDoc) return null;

		var xmlData = nlapiXMLToString(xmlDoc);
		xmlData = xmlData.replace(/ xmlns=""/, '');

		var xmlFile = nlapiCreateFile(fileName, 'XMLDOC', xmlData);
		if (BILL_FOLDER) xmlFile.setFolder(BILL_FOLDER);
		var fileId = nlapiSubmitFile(xmlFile);

		dLog('processAndSendEWBXMLFile', 'file 1 Id = ' + fileId);

		if (!isEmpty(VPM_CONNECTOR_FOLDER)) {
			var xmlFile2 = nlapiCreateFile(fileName, 'XMLDOC', xmlData);
			xmlFile2.setFolder(VPM_CONNECTOR_FOLDER);
			var file2Id = nlapiSubmitFile(xmlFile2);

			dLog('processAndSendEWBXMLFile', 'file 2 Id = ' + file2Id);
		}

		// If this checkbox is checked, then send the file to the person that
		// created the payment
		if (SEND_FILE_VIA_EMAIL == 'T') {
			if (!isEmpty(SEND_FILE_EMAIL)) {
				EMAIL_SENDER_EMAIL += ',' + SEND_FILE_EMAIL;
			}

			nlapiSendEmail(EMAIL_SENDER, EMAIL_SENDER_EMAIL, EMAIL_SUBJECT_XML, EMAIL_BODY, null, null, null, xmlFile, true);
		}

		return fileId;
	} catch (e) {
		dLog('processAndSendEWBXMLFile | Script Error', e);
	}
}

function processAndSendNEFTXMLFile(objAcctMap) {
	try {
		var timeStamp = Date.create().format('{HH}{mm}{ss}{yyyy}{MM}{dd}');
		var fileName = FILE_NAME_PREFIX + timeStamp + '.' + FILE_NAME_EXT;
		var xmlDoc = createNEFTXMLDoc(objAcctMap);

		if (!xmlDoc) return null;

		var xmlData = nlapiXMLToString(xmlDoc);
		xmlData = xmlData.replace(/ xmlns=""/, '');

		var xmlFile = nlapiCreateFile(fileName, 'XMLDOC', xmlData);
		if (BILL_FOLDER) xmlFile.setFolder(BILL_FOLDER);
		var fileId = nlapiSubmitFile(xmlFile);

		dLog('processAndSendNEFTXMLFile', 'file 1 Id = ' + fileId);

		if (!isEmpty(VPM_CONNECTOR_FOLDER)) {
			var xmlFile2 = nlapiCreateFile(fileName, 'XMLDOC', xmlData);
			xmlFile2.setFolder(VPM_CONNECTOR_FOLDER);
			var file2Id = nlapiSubmitFile(xmlFile2);

			dLog('processAndSendNEFTXMLFile', 'file 2 Id = ' + file2Id);
		}

		// If this checkbox is checked, then send the file to the person that
		// created the payment
		if (SEND_FILE_VIA_EMAIL == 'T') {
			if (!isEmpty(SEND_FILE_EMAIL)) {
				EMAIL_SENDER_EMAIL += ',' + SEND_FILE_EMAIL;
			}

			nlapiSendEmail(EMAIL_SENDER, EMAIL_SENDER_EMAIL, EMAIL_SUBJECT_XML, EMAIL_BODY, null, null, null, xmlFile, true);
		}

		return fileId;
	} catch (e) {
		dLog('processAndSendNEFTXMLFile | Script Error', e);
	}
}

function processAndSendSNEFTXMLFile(objAcctMap) {
	try {
		var timeStamp = Date.create().format('{HH}{mm}{ss}{yyyy}{MM}{dd}');
		var fileName = FILE_NAME_PREFIX + timeStamp + '.' + FILE_NAME_EXT;
		var xmlDoc = createSNEFTXMLDoc(objAcctMap);

		if (!xmlDoc) return null;

		var xmlData = nlapiXMLToString(xmlDoc);
		xmlData = xmlData.replace(/ xmlns=""/, '');

		var xmlFile = nlapiCreateFile(fileName, 'XMLDOC', xmlData);
		if (BILL_FOLDER) xmlFile.setFolder(BILL_FOLDER);
		var fileId = nlapiSubmitFile(xmlFile);

		dLog('processAndSendSNEFTXMLFile', 'file 1 Id = ' + fileId);

		if (!isEmpty(VPM_CONNECTOR_FOLDER)) {
			var xmlFile2 = nlapiCreateFile(fileName, 'XMLDOC', xmlData);
			xmlFile2.setFolder(VPM_CONNECTOR_FOLDER);
			var file2Id = nlapiSubmitFile(xmlFile2);

			dLog('processAndSendSNEFTXMLFile', 'file 2 Id = ' + file2Id);
		}

		// If this checkbox is checked, then send the file to the person that
		// created the payment
		if (SEND_FILE_VIA_EMAIL == 'T') {
			if (!isEmpty(SEND_FILE_EMAIL)) {
				EMAIL_SENDER_EMAIL += ',' + SEND_FILE_EMAIL;
			}

			nlapiSendEmail(EMAIL_SENDER, EMAIL_SENDER_EMAIL, EMAIL_SUBJECT_XML, EMAIL_BODY, null, null, null, xmlFile, true);
		}

		return fileId;
	} catch (e) {
		dLog('processAndSendSNEFTXMLFile | Script Error', e);
	}
}


function processAndSendHSBCNEFTXMLFile(objAcctMap) {
	try {
		var timeStamp = Date.create().format('{HH}{mm}{ss}{yyyy}{MM}{dd}');
		var fileName = FILE_NAME_PREFIX + timeStamp + '.' + FILE_NAME_EXT;
		var xmlDoc = createHSBCNEFTXMLDoc(objAcctMap);

		if (!xmlDoc) return null;

		var xmlData = nlapiXMLToString(xmlDoc);
		xmlData = xmlData.replace(/ xmlns=""/, '');

		var xmlFile = nlapiCreateFile(fileName, 'XMLDOC', xmlData);
		if (BILL_FOLDER) xmlFile.setFolder(BILL_FOLDER);
		var fileId = nlapiSubmitFile(xmlFile);

		dLog('processAndSendHSBCNEFTXMLFile', 'file 1 Id = ' + fileId);

		if (!isEmpty(VPM_CONNECTOR_FOLDER)) {
			var xmlFile2 = nlapiCreateFile(fileName, 'XMLDOC', xmlData);
			xmlFile2.setFolder(VPM_CONNECTOR_FOLDER);
			var file2Id = nlapiSubmitFile(xmlFile2);

			dLog('processAndSendHSBCNEFTXMLFile', 'file 2 Id = ' + file2Id);
		}

		// If this checkbox is checked, then send the file to the person that
		// created the payment
		if (SEND_FILE_VIA_EMAIL == 'T') {
			if (!isEmpty(SEND_FILE_EMAIL)) {
				EMAIL_SENDER_EMAIL += ',' + SEND_FILE_EMAIL;
			}

			nlapiSendEmail(EMAIL_SENDER, EMAIL_SENDER_EMAIL, EMAIL_SUBJECT_XML, EMAIL_BODY, null, null, null, xmlFile, true);
		}

		return fileId;
	} catch (e) {
		dLog('processAndSendHSBCNEFTXMLFile | Script Error', e);
	}
}

function processAndSendHSBCSGXMLFile(objAcctMap) {
	try {
		var timeStamp = Date.create().format('{HH}{mm}{ss}{yyyy}{MM}{dd}');
		var fileName = FILE_NAME_PREFIX + timeStamp + '.' + FILE_NAME_EXT;
		var xmlDoc = createHSBCSGXMLDoc(objAcctMap);

		if (!xmlDoc) return null;

		var xmlData = nlapiXMLToString(xmlDoc);
		xmlData = xmlData.replace(/ xmlns=""/, '');

		var xmlFile = nlapiCreateFile(fileName, 'XMLDOC', xmlData);
		if (BILL_FOLDER) xmlFile.setFolder(BILL_FOLDER);
		var fileId = nlapiSubmitFile(xmlFile);

		dLog('processAndSendHSBCSGXMLFile', 'file 1 Id = ' + fileId);

		if (!isEmpty(VPM_CONNECTOR_FOLDER)) {
			var xmlFile2 = nlapiCreateFile(fileName, 'XMLDOC', xmlData);
			xmlFile2.setFolder(VPM_CONNECTOR_FOLDER);
			var file2Id = nlapiSubmitFile(xmlFile2);

			dLog('processAndSendHSBCSGXMLFile', 'file 2 Id = ' + file2Id);
		}

		// If this checkbox is checked, then send the file to the person that
		// created the payment
		if (SEND_FILE_VIA_EMAIL == 'T') {
			if (!isEmpty(SEND_FILE_EMAIL)) {
				EMAIL_SENDER_EMAIL += ',' + SEND_FILE_EMAIL;
			}

			nlapiSendEmail(EMAIL_SENDER, EMAIL_SENDER_EMAIL, EMAIL_SUBJECT_XML, EMAIL_BODY, null, null, null, xmlFile, true);
		}

		return fileId;
	} catch (e) {
		dLog('processAndSendHSBCSGXMLFile | Script Error', e);
	}
}


function processAndSendLLOYDBACSFile(objAcctMap) {
	try {
		var timeStamp = Date.create().format('{HH}{mm}{ss}{yyyy}{MM}{dd}');
		var fileName = FILE_NAME_PREFIX + timeStamp + '.' + 'csv';
		var fileNameNoExt = (FILE_NAME_PREFIX + timeStamp).substring(0, 18);
		var csvContents = createLLOYDBACSFile(objAcctMap, fileNameNoExt);

		if (!csvContents) return null;

		var csvFile = nlapiCreateFile(fileName, 'CSV', csvContents);
		if (BILL_FOLDER) csvFile.setFolder(BILL_FOLDER);
		var fileId = nlapiSubmitFile(csvFile);

		dLog('processAndSendLLOYDBACSFile', 'file 1 Id = ' + fileId);

		if (!isEmpty(VPM_CONNECTOR_FOLDER)) {
			var csvFile2 = nlapiCreateFile(fileName, 'CSV', csvContents);
			csvFile2.setFolder(VPM_CONNECTOR_FOLDER);
			var file2Id = nlapiSubmitFile(csvFile2);

			dLog('processAndSendLLOYDBACSFile', 'file 2 Id = ' + file2Id);
		}

		if (SEND_FILE_VIA_EMAIL == 'T') {
			if (!isEmpty(SEND_FILE_EMAIL)) {
				EMAIL_SENDER_EMAIL += ',' + SEND_FILE_EMAIL;
			}

			nlapiSendEmail(EMAIL_SENDER, EMAIL_SENDER_EMAIL, EMAIL_SUBJECT_CSV, EMAIL_BODY, null, null, null, csvFile, true);
		}

		return fileId;
	} catch (e) {
		dLog('processAndSendLLOYDBACSFile | Script Error', e);
	}
}

function processAndSendCAP_ISO_XMLFile(objAcctMap) {
	try {
		var timeStamp = Date.create().format('{HH}{mm}{ss}{yyyy}{MM}{dd}');
		var fileName = FILE_NAME_PREFIX + timeStamp + '.' + FILE_NAME_EXT;
		var xmlDoc = createCAP_ISO_XMLDoc(objAcctMap);

		if (!xmlDoc) return null;

		var xmlFile = nlapiCreateFile(fileName, 'XMLDOC', xmlDoc);
		if (BILL_FOLDER) xmlFile.setFolder(BILL_FOLDER);
		var fileId = nlapiSubmitFile(xmlFile);

		dLog('processAndSendCAP_ISO_XMLFile', 'file 1 Id = ' + fileId);
		if (!isEmpty(VPM_CONNECTOR_FOLDER)) {
			var xmlFile2 = nlapiCreateFile(fileName, 'XMLDOC', xmlDoc);
			xmlFile2.setFolder(VPM_CONNECTOR_FOLDER);
			var file2Id = nlapiSubmitFile(xmlFile2);
			dLog('processAndSendCAP_ISO_XMLFile', 'file 2 Id = ' + file2Id);
		}

		if (SEND_FILE_VIA_EMAIL == 'T') {
			if (!isEmpty(SEND_FILE_EMAIL)) {
				EMAIL_SENDER_EMAIL += ',' + SEND_FILE_EMAIL;
			}
			nlapiSendEmail(EMAIL_SENDER, EMAIL_SENDER_EMAIL, EMAIL_SUBJECT_XML, EMAIL_BODY, null, null, null, xmlFile, true);
		}

		return fileId;
	} catch (e) {
		dLog('processAndSendCAP_ISO_XMLFile | Script Error', e);
	}
}

function createLLOYDBACSFile(objAcctMapping, fileNameNoExt) {
	dLog('createLLOYDBACSFile', 'start');
	var csvContents = '';

	//Header 1 ROW
	var bpmdate = BPM_DATE;
	var d = nlapiStringToDate(bpmdate, 'datetime');
	var updatedDate = addWeekdays(d, 2);

	var today = moment(new Date());
	var bpmDate = moment(d);

	var diff = bpmDate.startOf('day').diff(today.startOf('day'), 'days');
	if (diff >= 2) {
		dLog('createLLOYDBACSFile', 'addWeekdays 0');
		updatedDate = addWeekdays(d, 0);
	} else if (diff == 1) {
		dLog('createLLOYDBACSFile', 'addWeekdays 1');
		updatedDate = addWeekdays(d, 1);
	} else {
		dLog('createLLOYDBACSFile', 'addWeekdays 2');
		updatedDate = addWeekdays(d, 2);
	}

	dLog(
		'createLLOYDBACSFile-difference',
		JSON.stringify({
			difference: bpmDate.diff(today, 'days'),
			bpmdate: bpmdate,
			d: d,
			updatedDate: updatedDate,
			today: today,
			bpmDate: bpmDate,
		})
	);

	dLog('arrBillsProcessed', JSON.stringify({ arrBillsProcessed: arrBillsProcessed }));

	csvContents += 'H,';
	csvContents += moment(new Date()).format('YYYYMMDD') + ',';
	csvContents += moment(new Date()).format('YYYYMMDDhhmmss');
	csvContents += '\r\n';
	//Details 1 ROW

	var debitAccountNumber = objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_origin_acc'); //'12345678';
	csvContents += 'D,';
	csvContents += updatedDate.format('YYYYMMDD') + ','; //2 business days TODO //moment
	csvContents += fileNameNoExt + ',';
	csvContents += debitAccountNumber + ',';
	csvContents += ',';
	csvContents += '\r\n';

	//Content - 1 line per bill payments
	var billPaymentDetails = {};
	var arrPayeeIds = [];
	for (var i = 0; i < arrBillsProcessed.length; i++) {
		if (!_.includes(arrPayeeIds, arrBillsProcessed[i].payeeid)) {
			arrPayeeIds.push(arrBillsProcessed[i].payeeid);
		}
	}
	var arrVendors = getEmployeeData(arrPayeeIds);
	dLog('arrPayeeIds', arrPayeeIds);
	dLog('arrVendors', JSON.stringify(arrVendors));
	for (var i = 0; i < arrBillsProcessed.length; i++) {
		//Build billpayments from bills?
		if (arrBillsProcessed[i].payment == 'CREDIT') continue;

		if (billPaymentDetails[arrBillsProcessed[i].payment]) {
			billPaymentDetails[arrBillsProcessed[i].payment].amount += Number(arrBillsProcessed[i].payamt);
		} else {
			var objVendor = _.find(arrVendors, { internalid: String(arrBillsProcessed[i].payeeid) });
			dLog('objVendor', JSON.stringify(objVendor));
			if (objVendor) {
				billPaymentDetails[arrBillsProcessed[i].payment] = {};
				billPaymentDetails[arrBillsProcessed[i].payment].amount = Number(arrBillsProcessed[i].payamt);
				billPaymentDetails[arrBillsProcessed[i].payment].vendor_name = objVendor.vendorname;
				billPaymentDetails[arrBillsProcessed[i].payment].beneficiary_account_number = objVendor.recpartyaccount;
				billPaymentDetails[arrBillsProcessed[i].payment].beneficiary_sort_code = objVendor.bankid;
				// billPaymentDetails[arrBillsProcessed[i].payment].internalid = arrBillsProcessed[i].payment; //change to tranid
				billPaymentDetails[arrBillsProcessed[i].payment].tranid = arrBillsProcessed[i].refnum; //change to tranid
			}
		}
	}
	dLog('arrBillsProcessed', JSON.stringify(arrBillsProcessed));
	dLog('billPaymentDetails', JSON.stringify(billPaymentDetails));

	//convert billpaymentDetails to arr
	billPaymentDetails = _.toArray(billPaymentDetails);

	for (var i = 0; i < billPaymentDetails.length; i++) {
		csvContents += 'C,';
		csvContents += billPaymentDetails[i].amount.toFixed(2) + ',';
		csvContents += billPaymentDetails[i].vendor_name + ',';
		csvContents += billPaymentDetails[i].beneficiary_account_number + ',';
		csvContents += billPaymentDetails[i].beneficiary_sort_code + ',';
		csvContents += billPaymentDetails[i].tranid;
		csvContents += '\r\n';
	}

	//T
	csvContents += 'T\r\n';

	dLog('createLLOYDBACSFile', 'end-' + csvContents);
	return csvContents;
}

function processAndSendLLOYDFPSFile(objAcctMap) {
	try {
		var timeStamp = Date.create().format('{HH}{mm}{ss}{yyyy}{MM}{dd}');
		var fileName = FILE_NAME_PREFIX + timeStamp + '.' + 'csv';
		var fileNameNoExt = (FILE_NAME_PREFIX + timeStamp).substring(0, 18);

		var csvContents = createLLOYDFPSFile(objAcctMap, fileNameNoExt);

		if (!csvContents) return null;

		var csvFile = nlapiCreateFile(fileName, 'CSV', csvContents);
		if (BILL_FOLDER) csvFile.setFolder(BILL_FOLDER);
		var fileId = nlapiSubmitFile(csvFile);

		dLog('processAndSendLLOYDFPSFile', 'file 1 Id = ' + fileId);

		if (!isEmpty(VPM_CONNECTOR_FOLDER)) {
			var csvFile2 = nlapiCreateFile(fileName, 'CSV', csvContents);
			csvFile2.setFolder(VPM_CONNECTOR_FOLDER);
			var file2Id = nlapiSubmitFile(csvFile2);

			dLog('processAndSendLLOYDFPSFile', 'file 2 Id = ' + file2Id);
		}

		if (SEND_FILE_VIA_EMAIL == 'T') {
			if (!isEmpty(SEND_FILE_EMAIL)) {
				EMAIL_SENDER_EMAIL += ',' + SEND_FILE_EMAIL;
			}

			nlapiSendEmail(EMAIL_SENDER, EMAIL_SENDER_EMAIL, EMAIL_SUBJECT_CSV, EMAIL_BODY, null, null, null, csvFile, true);
		}

		return fileId;
	} catch (e) {
		dLog('processAndSendLLOYDFPSFile | Script Error', e);
	}
}

function createLLOYDFPSFile(objAcctMapping, fileNameNoExt) {
	dLog('createLLOYDFPSFile', 'start');
	var csvContents = '';

	//Header 1 ROW
	var bpmdate = BPM_DATE;
	var d = nlapiStringToDate(bpmdate, 'datetime');

	csvContents += 'H,';
	csvContents += moment(d).format('YYYYMMDD') + ',';
	csvContents += moment(new Date()).format('YYYYMMDDhhmmss');
	csvContents += '\r\n';

	//Content - 1 line per bill payments
	var billPaymentDetails = {};
	var arrPayeeIds = [];
	for (var i = 0; i < arrBillsProcessed.length; i++) {
		if (!_.includes(arrPayeeIds, arrBillsProcessed[i].payeeid)) {
			arrPayeeIds.push(arrBillsProcessed[i].payeeid);
		}
	}
	var debitAccountNumber = objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_origin_acc'); //'12345678';
	var arrVendors = getEmployeeData(arrPayeeIds);

	for (var i = 0; i < arrBillsProcessed.length; i++) {
		//Build billpayments from bills?
		if (arrBillsProcessed[i].payment == 'CREDIT') continue;

		if (billPaymentDetails[arrBillsProcessed[i].payment]) {
			billPaymentDetails[arrBillsProcessed[i].payment].amount += Number(arrBillsProcessed[i].payamt);
		} else {
			var objVendor = _.find(arrVendors, { internalid: String(arrBillsProcessed[i].payeeid) });
			if (objVendor) {
				billPaymentDetails[arrBillsProcessed[i].payment] = {};
				billPaymentDetails[arrBillsProcessed[i].payment].amount = Number(arrBillsProcessed[i].payamt);
				billPaymentDetails[arrBillsProcessed[i].payment].vendor_name = objVendor.vendorname;
				billPaymentDetails[arrBillsProcessed[i].payment].beneficiary_account_number = objVendor.recpartyaccount;
				billPaymentDetails[arrBillsProcessed[i].payment].beneficiary_sort_code = objVendor.bankid;
				billPaymentDetails[arrBillsProcessed[i].payment].tranid = arrBillsProcessed[i].refnum;
			}
		}
	}
	dLog('arrBillsProcessed', JSON.stringify(arrBillsProcessed));
	dLog('billPaymentDetails', JSON.stringify(billPaymentDetails));

	//convert billpaymentDetails to arr
	billPaymentDetails = _.toArray(billPaymentDetails);

	for (var i = 0; i < billPaymentDetails.length; i++) {
		csvContents += 'FPS,';
		csvContents += moment(d).format('YYYYMMDD') + ',';
		csvContents += billPaymentDetails[i].amount.toFixed(2) + ',';
		csvContents += ','; //ignore
		csvContents += debitAccountNumber + ',';
		csvContents += billPaymentDetails[i].vendor_name + ',';
		csvContents += billPaymentDetails[i].beneficiary_account_number + ',';
		csvContents += billPaymentDetails[i].beneficiary_sort_code + ',';
		csvContents += billPaymentDetails[i].tranid;
		csvContents += '\r\n';
	}

	//T
	csvContents += 'T\r\n';

	dLog('createLLOYDFPSFile', 'end-' + csvContents);
	return csvContents;
}

/**
 *
 * @param bills
 * @param subId
 * @returns
 */
function creatBOAXMLDoc(objAcctMapping) {
	try {
		dLog('creatBOAXMLDoc', '>>> START <<<');

		var schema = nlapiGetContext().getSetting('SCRIPT', 'custscript_v16_xml_schema');

		// dLog('creatXMLDoc', 'VPM Mapping results = ' +
		// JSON.stringify(objAcctMapping));

		// start create xml line
		var xmlDoc = nlapiStringToXML('<?xml version="1.0" encoding="utf-8"?><Document></Document>');
		var DocumentNode = getNode(xmlDoc, '/Document');
		setAttributeValue(DocumentNode, 'xmlns', 'urn:iso:std:iso:20022:tech:xsd:pain.001.001.03');

		var ns1 = 'urn:iso:std:iso:20022:tech:xsd:pain.001.001.03';
		var xsi = 'http://www.w3.org/2001/XMLSchema-instance';
		DocumentNode.setAttributeNS(xsi, 'xsi:schemaLocation', 'urn:iso:std:iso:20022:tech:xsd:pain.001.001.03 file:///H:/EDI%20SERVICES%20REFERENCE%20DATA/XML/SCHEMAS/pain.001.001.03.xsd');

		var cstmrCdtTrfInitnNode = addNodeFromParentNode(xmlDoc, DocumentNode, 'CstmrCdtTrfInitn');

		var arrTempBillIds = [];
		var arrBillCRIds = [];
		var arrBillAmt = [];
		var arrBillAmtOrig = [];
		var arrBillDiscAmt = [];
		var arrBillPayInfoCtr = [];
		var arrBillPayInfoSum = [];
		var arrGrpHdrNbOfTxs = [];
		var arrPmtInfNbOfTxs = [];
		var arrBillIds = [];
		var grpHdrNbOfTxs = 0;
		var grpHdrCtrlSum = 0;

		for (x in arrBillsProcessed) {
			var billId = arrBillsProcessed[x].id;
			var billPaymentId = arrBillsProcessed[x].payment;

			dLog('creatBOAXMLDoc', 'Bill info = ' + JSON.stringify(arrBillsProcessed[x]));

			// check if payment id exist, only generate xml bills with payment
			// id, skip processed bill credit
			if (!isEmpty(billPaymentId) && billPaymentId != 'XXXNONEXXX' && billPaymentId != 'CREDIT') {
				if (billPaymentId != 'CREDIT') arrTempBillIds.push(billId);

				var payMethod = arrBillsProcessed[x].paymethod;
				var paymentId = arrBillsProcessed[x].payment;
				var payeeId = arrBillsProcessed[x].payeeid;

				arrBillAmtOrig[billId] = arrBillsProcessed[x].origamt;
				// arrBillAmt[billId] = arrBillsProcessed[x].pay;
				arrBillAmt[billId] = arrBillsProcessed[x].payamt;
				arrBillDiscAmt[billId] = arrBillsProcessed[x].discamt;

				var ndx = payMethod + '@@' + paymentId;

				if (arrBillPayInfoCtr[payMethod] == null) arrBillPayInfoCtr[payMethod] = 0;
				if (arrBillPayInfoSum[payMethod] == null) arrBillPayInfoSum[payMethod] = 0;
				if (arrPmtInfNbOfTxs[ndx] == null) arrPmtInfNbOfTxs[ndx] = 0;

				if (paymentId && arrGrpHdrNbOfTxs[paymentId] == null) grpHdrNbOfTxs++;

				arrPmtInfNbOfTxs[ndx]++;
				arrBillPayInfoCtr[payMethod]++;
				arrBillPayInfoSum[payMethod] += getFloatVal(arrBillsProcessed[x].payamt);
				arrGrpHdrNbOfTxs[paymentId] = paymentId;

				grpHdrCtrlSum += getFloatVal(arrBillsProcessed[x].payamt);
			}

			if (billPaymentId == 'CREDIT') arrBillCRIds.push(billId);
		}

		var arrBillIds2 = [];
		var arrBillIds3 = [];
		var arrBillIds4 = [];
		var arrBillIds5 = [];

		for (vx in arrTempBillIds) {
			var isBC = false;

			for (var x in arrBillCRIds) {
				if (arrTempBillIds[vx] == arrBillCRIds[x]) {
					isBC = true;
					break;
				}
			}

			if (!isBC) {
				arrBillIds.push(arrTempBillIds[vx]);
				arrBillIds2.push(arrTempBillIds[vx]);
				arrBillIds3.push(arrTempBillIds[vx]);
				arrBillIds4.push(arrTempBillIds[vx]);
				arrBillIds5.push(arrTempBillIds[vx]);
			}
		}

		dAudit(
			'creatBOAXMLDoc',
			JSON.stringify({
				'arrBillIds.length': arrBillIds.length,
				'arrBillIds2.length': arrBillIds2.length,
				'arrBillIds3.length': arrBillIds3.length,
				'arrBillIds4.length': arrBillIds4.length,
				'arrBillIds5.length': arrBillIds5.length,
			})
		);

		dLog('creatBOAXMLDoc', 'arrBillIds = ' + arrBillIds);
		dLog('creatBOAXMLDoc', 'arrBillIds.length ' + arrBillIds.length);

		if (arrBillIds.length < 1) {
			dLog('creatBOAXMLDoc', 'No bill id to generate xml. exit xml creation.');
			return null;
		}

		var arrBillCredits = getBillCredit(arrBillIds);
		var objBillsData = getBillData(arrBillIds2);
		var arrBillPO = getPOMap(arrBillIds3);
		var arrVendorBills = getPayeeBillsByPayMethod(arrBillIds4);
		var arrVendorBillsCurr = getPayeeBillsCurrency(arrBillIds5);
		var nsAcctSub = !isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('subsidiary', 'CUSTRECORD_ACCT_MAP_NETSUITE_ACCOUNT')) ? objAcctMapping[0].getValue('subsidiary', 'CUSTRECORD_ACCT_MAP_NETSUITE_ACCOUNT') : '';
		var objVDCRecResults = getVendorDAC_CCRPaymentRec(nsAcctSub);
		var arrCurrMap = getCurrecnyISOCode();
		var currDate = formatDate(new Date());
		var tmpTotalAmt = 0;
		var arrPayeeIds = [];

		dAudit(
			'creatBOAXMLDoc',
			JSON.stringify({
				'arrBillCredits.length': arrBillCredits.length,
				'objBillsData.length': objBillsData.length,
				'arrBillPO.length': arrBillPO.length,
				'arrVendorBills.length': arrVendorBills.length,
				'objVDCRecResults.length': objVDCRecResults.length,
			})
		);

		// get Total Bill amount
		for (x in arrVendorBills) {
			var arrBillIds = arrVendorBills[x];
			// dLog('creatBOAXMLDoc', 'Vendor Id = ' + x);

			var payeeId = x.split('X@X')[1];
			arrPayeeIds.push(payeeId);

			for (vbill in arrBillIds) {
				// pmtTotalAmt += getFloatVal(arrBillAmt[arrBillIds[vbill]]);
			}
		}

		arrPayeeIds = removeDuplicates(arrPayeeIds);
		var arrVendors = getEntityData(arrPayeeIds);
		// var arrPayeeInterBillsMemo = getPayeeBillsMemo(arrPayeeIds);
		// dLog('creatBOAXMLDoc', 'pmtTotalAmt = ' + pmtTotalAmt);

		var fileCtrlNumber = Date.create().format('{yy}{MM}{dd}{mm}{ss}');

		// ***START*** A. GROUP HEADER
		var grpHdr = addNodeFromParentNode(xmlDoc, cstmrCdtTrfInitnNode, 'GrpHdr');
		addTextNodeFromParentNode(xmlDoc, grpHdr, 'MsgId', 'FILE' + pad(fileCtrlNumber, 4));

		// var currDate = Date.create();
		var currDate = new Date();
		// var mm = ("0" + currDate.getMilliseconds()).slice(-2);
		// var ss = ("0" + currDate.getMilliseconds()).slice(-2);
		// var ms = ("0" + currDate.getMilliseconds()).slice(-2);
		addTextNodeFromParentNode(xmlDoc, grpHdr, 'CreDtTm', currDate.format('{yyyy}-{MM}-{dd}T{hh}:{mm}:{ss}'));
		addTextNodeFromParentNode(xmlDoc, grpHdr, 'NbOfTxs', grpHdrNbOfTxs);
		addTextNodeFromParentNode(xmlDoc, grpHdr, 'CtrlSum', grpHdrCtrlSum.toFixed(2));

		var initgPty = addNodeFromParentNode(xmlDoc, grpHdr, 'InitgPty');
		var idInitgPty = addNodeFromParentNode(xmlDoc, initgPty, 'Id');
		var orgIdIdInitgPty = addNodeFromParentNode(xmlDoc, idInitgPty, 'OrgId');
		var othrOrgIdIdInitgPty = addNodeFromParentNode(xmlDoc, orgIdIdInitgPty, 'Othr');

		if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_cash_pro_send_id_bank_america'))) addTextNodeFromParentNode(xmlDoc, othrOrgIdIdInitgPty, 'Id', objVDCRecResults[0].getValue('custrecord_cash_pro_send_id_bank_america'));

		// ***END*** A. GROUP HEADER

		var ccy = '';
		if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_account_currency'))) ccy = arrCurrMap[objAcctMapping[0].getValue('custrecord_acct_map_account_currency')];

		dAudit('arrBillPayInfoCtr', JSON.stringify(arrBillPayInfoCtr));
		dAudit('arrBillPayInfoCtr.length', JSON.stringify(arrBillPayInfoCtr.length));

		for (x in arrBillPayInfoCtr) {
			// var arrTemp = x.split('@@');
			// var payeeId = arrTemp[1];
			var paymentMethod = x;

			// ***START*** B. PAYMENT INFORMATION SECTION
			var pmtInf = addNodeFromParentNode(xmlDoc, cstmrCdtTrfInitnNode, 'PmtInf');

			if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_ceocompid'))) addTextNodeFromParentNode(xmlDoc, pmtInf, 'PmtInfId', objVDCRecResults[0].getValue('custrecord_ceocompid'));

			addTextNodeFromParentNode(xmlDoc, pmtInf, 'PmtMtd', paymentMethod == 'DAC' ? 'TRF' : paymentMethod);

			var pmtInfNbOfTxs = 0;
			for (pnb in arrPmtInfNbOfTxs) {
				var tmp = pnb.split('@@');
				var tmpPmethod = tmp[0];
				if (tmpPmethod == paymentMethod) {
					pmtInfNbOfTxs++;
				}
			}
			addTextNodeFromParentNode(xmlDoc, pmtInf, 'NbOfTxs', pmtInfNbOfTxs);

			addTextNodeFromParentNode(xmlDoc, pmtInf, 'CtrlSum', arrBillPayInfoSum[paymentMethod]);

			var pmtTpInf = addNodeFromParentNode(xmlDoc, pmtInf, 'PmtTpInf');
			var svcLvl = addNodeFromParentNode(xmlDoc, pmtTpInf, 'SvcLvl');
			addTextNodeFromParentNode(xmlDoc, svcLvl, 'Cd', 'NURG');

			var lclInstrm = addNodeFromParentNode(xmlDoc, pmtTpInf, 'LclInstrm');
			// var objVendor = arrVendors[payeeId];
			// if (!isEmpty(objVendor.payformat))
			// addTextNodeFromParentNode(xmlDoc, lclInstrm, 'Cd',
			// objVendor.payformat);
			addTextNodeFromParentNode(xmlDoc, lclInstrm, 'Cd', 'CTX');

			addTextNodeFromParentNode(xmlDoc, pmtInf, 'ReqdExctnDt', currDate.format('{yyyy}-{MM}-{dd}'));

			var dbtr = addNodeFromParentNode(xmlDoc, pmtInf, 'Dbtr');

			if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_companyname'))) addTextNodeFromParentNode(xmlDoc, dbtr, 'Nm', objVDCRecResults[0].getValue('custrecord_companyname'));

			if (
				(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_comppostcode'))) ||
				(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compcity'))) ||
				(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compstateprov'))) ||
				(!isEmpty(objVDCRecResults) && objVDCRecResults[0].getValue('custrecord_compcountrycode')) ||
				(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compadd1')))
			) {
				var pstlAdr = addNodeFromParentNode(xmlDoc, dbtr, 'PstlAdr');

				if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_comppostcode'))) addTextNodeFromParentNode(xmlDoc, pstlAdr, 'PstCd', objVDCRecResults[0].getValue('custrecord_comppostcode'));

				if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compcity'))) addTextNodeFromParentNode(xmlDoc, pstlAdr, 'TwnNm', objVDCRecResults[0].getValue('custrecord_compcity'));

				if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compstateprov'))) addTextNodeFromParentNode(xmlDoc, pstlAdr, 'CtrySubDvsn', objVDCRecResults[0].getValue('custrecord_compstateprov'));

				var country = !isEmpty(objVDCRecResults) ? objVDCRecResults[0].getValue('custrecord_compcountrycode') : '';
				addTextNodeFromParentNode(xmlDoc, pstlAdr, 'Ctry', country);

				if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compadd1'))) addTextNodeFromParentNode(xmlDoc, pstlAdr, 'AdrLine', objVDCRecResults[0].getValue('custrecord_compadd1'));
			}

			var idPmtInf = addNodeFromParentNode(xmlDoc, dbtr, 'Id');
			var orgIdIdPmtInf = addNodeFromParentNode(xmlDoc, idPmtInf, 'OrgId');
			var othrOrgIdIdPmtInf = addNodeFromParentNode(xmlDoc, orgIdIdPmtInf, 'Othr');

			if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_dom_ach_co_id'))) addTextNodeFromParentNode(xmlDoc, othrOrgIdIdPmtInf, 'Id', objAcctMapping[0].getValue('custrecord_acct_map_dom_ach_co_id'));

			var schmeNm = addNodeFromParentNode(xmlDoc, othrOrgIdIdPmtInf, 'SchmeNm');
			addTextNodeFromParentNode(xmlDoc, schmeNm, 'Cd', 'CHID');

			var dbtrAcct = addNodeFromParentNode(xmlDoc, pmtInf, 'DbtrAcct');
			var idDbtrAcct = addNodeFromParentNode(xmlDoc, dbtrAcct, 'Id');

			var otherDbtrAcct = addNodeFromParentNode(xmlDoc, idDbtrAcct, 'Othr');

			if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_origin_acc'))) addTextNodeFromParentNode(xmlDoc, otherDbtrAcct, 'Id', objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_origin_acc'));

			if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_account_currency'))) addTextNodeFromParentNode(xmlDoc, dbtrAcct, 'Ccy', arrCurrMap[objAcctMapping[0].getValue('custrecord_acct_map_account_currency')]);

			if ((!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id'))) || !isEmpty(country)) {
				var dbtrAgt = addNodeFromParentNode(xmlDoc, pmtInf, 'DbtrAgt');
				var finlstnId = addNodeFromParentNode(xmlDoc, dbtrAgt, 'FinInstnId');
				var clrSysMmbId = addNodeFromParentNode(xmlDoc, finlstnId, 'ClrSysMmbId');

				if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id'))) addTextNodeFromParentNode(xmlDoc, clrSysMmbId, 'MmbId', objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id'));

				var pstlAdr = addNodeFromParentNode(xmlDoc, finlstnId, 'PstlAdr');
				addTextNodeFromParentNode(xmlDoc, pstlAdr, 'Ctry', country);
			}

			// ***END*** B. PAYMENT INFORMATION SECTION

			// dLog('creatBOAXMLDoc', 'Bill Payment Method = ' + paymentMethod);

			dAudit('arrVendorBills', arrVendorBills);
			for (v in arrVendorBills) {
				var arrPayeeInfo = v.split('X@X');
				var payeeId = arrPayeeInfo[1];
				// var currId = arrPayeeCurr[1];

				dLog('creatBOAXMLDoc', 'vb ndex = ' + v);

				//var objVendor=arrVendors[payeeId];
				       var objVendor = _.find(arrVendors, { internalid: String(payeeId)});
				// var objVendor = _.find(arrVendors, { internalid: String(payeeId), paymentmethod: String(paymentMethod) })[0];
dAudit('objVendor-new', objVendor);				// dLog('creatBOAXMLDoc', 'objVendor = ' +
				// JSON.stringify(objVendor));

				if (isEmpty(objVendor)) continue;

				var pmtMethod = objVendor.paymentmethod;

				if (paymentMethod != pmtMethod) continue;

				dLog('creatBOAXMLDoc', 'Vendor Payment Method = ' + pmtMethod);

				// dLog('creatBOAXMLDoc', 'paymentMethod = ' + paymentMethod);
				// dLog('creatBOAXMLDoc', 'pmtMethod = ' +
				// objVendor.paymentmethod);

				var arrBills = arrVendorBills[paymentMethod + 'X@X' + payeeId];
				// var pmtRecCurAmt = 0;
				var tmpAmt = 0;

				// for (bill in arrBills) {
				// pmtRecCurAmt += getFloatVal(arrBillAmt[arrBills[bill]]);
				// }

				var numberOfBills = _.size(arrBills);
				for (by in arrBills) {
					var billId = arrBills[by];
					// if (pmtMethod == 'CHK' || pmtMethod == 'DAC' || pmtMethod
					// ==
					// 'CCR' || pmtMethod == 'IWI' || pmtMethod == 'MTS' ||
					// pmtMethod == 'IAC') {

					var netAmt = 0;
					var origAmt = getFloatVal(arrBillAmtOrig[billId]);
					var amt = getFloatVal(arrBillAmt[billId]);

					// dLog('creatXMLDoc', 'origAmt = ' + origAmt);
					// dLog('creatXMLDoc', 'amt = ' + amt);

					var discAmt = !isEmpty(arrBillDiscAmt[billId]) ? getFloatVal(arrBillDiscAmt[billId]) : 0;

					// tmpAmt += amt;
					netAmt = origAmt;
					tmpAmt += netAmt;

					if (discAmt > 0) {
						netAmt -= discAmt;
						tmpAmt -= discAmt;
					}

					if (!isEmpty(arrBillCredits[billId])) {
						var arrBC = arrBillCredits[billId];

						for (bc in arrBC) {
							var billCreditAmtP = getFloatVal(arrBC[bc].bcamt);
							var billCreditAmt = billCreditAmtP * -1;

							// pmtTotalAmt = (pmtTotalAmt - billCreditAmtP);
							// pmtRecCurAmt = (pmtRecCurAmt - billCreditAmtP);
							tmpAmt = tmpAmt - billCreditAmtP;
							netAmt = netAmt - billCreditAmtP;
						}
					}
					// }
				}

				// ***START*** C. CREDIT TRANSFER TRANSACTION INFORMATION
				// SECTION

				var cdtTrfTxInf = addNodeFromParentNode(xmlDoc, pmtInf, 'CdtTrfTxInf');
				var pmtIdCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtTrfTxInf, 'PmtId');

				addTextNodeFromParentNode(xmlDoc, pmtIdCdtTrfTxInf, 'EndToEndId', arrBillPaymentMap[payeeId]);

				var amtCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtTrfTxInf, 'Amt');
				var amtCdtTrfTxInfInstdAmt = addTextNodeFromParentNode(xmlDoc, amtCdtTrfTxInf, 'InstdAmt', tmpAmt.toFixed(2));
				setAttributeValue(amtCdtTrfTxInfInstdAmt, 'Ccy', ccy);

				var cdtrAgtCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtTrfTxInf, 'CdtrAgt');
				var finInstnIdCdtrAgtCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtrAgtCdtTrfTxInf, 'FinInstnId');
				var clrSysmmbIdFinInstnIdCdtrAgtCdtTrfTxInf = addNodeFromParentNode(xmlDoc, finInstnIdCdtrAgtCdtTrfTxInf, 'ClrSysMmbId');

				if (!isEmpty(objVendor.recbankprimid)) addTextNodeFromParentNode(xmlDoc, clrSysmmbIdFinInstnIdCdtrAgtCdtTrfTxInf, 'MmbId', objVendor.recbankprimid);

				var pstlAdrFinInstnIdCdtrAgtCdtTrfTxInf = addNodeFromParentNode(xmlDoc, finInstnIdCdtrAgtCdtTrfTxInf, 'PstlAdr');

				if (!isEmpty(objVendor.vendorcountrycode)) addTextNodeFromParentNode(xmlDoc, pstlAdrFinInstnIdCdtrAgtCdtTrfTxInf, 'Ctry', countryCodeMapping[objVendor.vendorcountrycode]);

				var cdtrCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtTrfTxInf, 'Cdtr');

				if (!isEmpty(objVendor.vendorname)) addTextNodeFromParentNode(xmlDoc, cdtrCdtTrfTxInf, 'Nm', objVendor.vendorname);

				var pstlAdrCdtrCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtrCdtTrfTxInf, 'PstlAdr');

				if (!isEmpty(objVendor.vendorpostal)) addTextNodeFromParentNode(xmlDoc, pstlAdrCdtrCdtTrfTxInf, 'PstCd', objVendor.vendorpostal);
				if (!isEmpty(objVendor.vendorcity)) addTextNodeFromParentNode(xmlDoc, pstlAdrCdtrCdtTrfTxInf, 'TwnNm', objVendor.vendorcity);
				if (!isEmpty(objVendor.vendorstateprovince)) addTextNodeFromParentNode(xmlDoc, pstlAdrCdtrCdtTrfTxInf, 'CtrySubDvsn', objVendor.vendorstateprovince);
				if (!isEmpty(objVendor.vendorcountrycode)) addTextNodeFromParentNode(xmlDoc, pstlAdrCdtrCdtTrfTxInf, 'Ctry', countryCodeMapping[objVendor.vendorcountrycode]);
				if (!isEmpty(objVendor.vendoraddrs1)) addTextNodeFromParentNode(xmlDoc, pstlAdrCdtrCdtTrfTxInf, 'AdrLine', objVendor.vendoraddrs1);

				var cdtrAcct = addNodeFromParentNode(xmlDoc, cdtTrfTxInf, 'CdtrAcct');

				if (!isEmpty(objVendor.recpartyaccount)) {
					var idCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtrAcct, 'Id');
					var othrIdCdtTrfTxInf = addNodeFromParentNode(xmlDoc, idCdtTrfTxInf, 'Othr');

					addTextNodeFromParentNode(xmlDoc, othrIdCdtTrfTxInf, 'Id', objVendor.recpartyaccount);
				}

				var tpCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtrAcct, 'Tp');
				addTextNodeFromParentNode(xmlDoc, tpCdtTrfTxInf, 'Cd', 'CACC');

				var instrForCdtAgtCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtTrfTxInf, 'InstrForCdtrAgt');
				addTextNodeFromParentNode(xmlDoc, instrForCdtAgtCdtTrfTxInf, 'InstrInf', 'CORP PMT');

				var rmtInfCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtTrfTxInf, 'RmtInf');

				tmpAmt = 0; // need to initialize back to 0

				for (y in arrBills) {
					var billId = arrBills[y];
					dLog('creatBOAXMLDoc', 'billId = ' + billId);

					// if (pmtMethod == 'CHK' || pmtMethod == 'DAC' || pmtMethod
					// ==
					// 'CCR' || pmtMethod == 'IWI' || pmtMethod == 'MTS' ||
					// pmtMethod == 'IAC') {

					var strdRmtInfCdtTrfTxInf = addNodeFromParentNode(xmlDoc, rmtInfCdtTrfTxInf, 'Strd');
					var rfrdDocInfStrdRmtInfCdtTrfTxInf = addNodeFromParentNode(xmlDoc, strdRmtInfCdtTrfTxInf, 'RfrdDocInf');
					var tpRfrdDocInfStrdRmtInfCdtTrfTxInf = addNodeFromParentNode(xmlDoc, rfrdDocInfStrdRmtInfCdtTrfTxInf, 'Tp');
					var cdOrPrtryRpRfrdDocInfStrdRmtInfCdtTrfTxInf = addNodeFromParentNode(xmlDoc, tpRfrdDocInfStrdRmtInfCdtTrfTxInf, 'CdOrPrtry');
					addTextNodeFromParentNode(xmlDoc, cdOrPrtryRpRfrdDocInfStrdRmtInfCdtTrfTxInf, 'Cd', 'CINV');

					var netAmt = 0;
					var origAmt = getFloatVal(arrBillAmtOrig[billId]);
					var amt = getFloatVal(arrBillAmt[billId]);

					// dLog('creatXMLDoc', 'origAmt = ' + origAmt);
					// dLog('creatXMLDoc', 'amt = ' + amt);

					var discAmt = !isEmpty(arrBillDiscAmt[billId]) ? getFloatVal(arrBillDiscAmt[billId]) : 0;

					// tmpAmt += amt;
					netAmt = origAmt;
					tmpAmt += netAmt;

					if (discAmt > 0) {
						netAmt -= discAmt;
						tmpAmt -= discAmt;
					}

					if (!isEmpty(arrBillCredits[billId])) {
						var arrBC = arrBillCredits[billId];

						for (bc in arrBC) {
							var bcNum = arrBC[bc].bcnum;

							dLog('creatBOAXMLDoc', 'VC number : ' + bcNum);

							if (!isEmpty(bcNum)) addTextNodeFromParentNode(xmlDoc, rfrdDocInfStrdRmtInfCdtTrfTxInf, 'Nb', bcNum);

							var billCreditAmtP = getFloatVal(arrBC[bc].bcamt);
							var billCreditAmt = billCreditAmtP * -1;

							// pmtTotalAmt = (pmtTotalAmt - billCreditAmtP);
							// pmtRecCurAmt = (pmtRecCurAmt - billCreditAmtP);

							tmpAmt = tmpAmt - billCreditAmtP;
							netAmt = netAmt - billCreditAmtP;

							addTextNodeFromParentNode(xmlDoc, rfrdDocInfStrdRmtInfCdtTrfTxInf, 'RltdDt', formatDate(nlapiStringToDate(arrBC[bc].bcdate)));

							var rfrdDocAmtStrdRmtInfCdtTrfTxInf = addNodeFromParentNode(xmlDoc, strdRmtInfCdtTrfTxInf, 'RfrdDocAmt');
							var duePyblAmtRfrdDocAmtStrdRmtInfCdtTrfTxInf = addTextNodeFromParentNode(xmlDoc, rfrdDocAmtStrdRmtInfCdtTrfTxInf, 'DuePyblAmt', billCreditAmt.toFixed(2));
							var dscntApldAmtRfrdDocAmtStrdRmtInfCdtTrfTxInf = addTextNodeFromParentNode(xmlDoc, rfrdDocAmtStrdRmtInfCdtTrfTxInf, 'DscntApldAmt', discAmt.toFixed(2));
							var rmtdAmtRfrdDocAmtStrdRmtInfCdtTrfTxInf = addTextNodeFromParentNode(xmlDoc, rfrdDocAmtStrdRmtInfCdtTrfTxInf, 'RmtdAmt', billCreditAmt.toFixed(2));

							setAttributeValue(duePyblAmtRfrdDocAmtStrdRmtInfCdtTrfTxInf, 'Ccy', ccy);
							setAttributeValue(dscntApldAmtRfrdDocAmtStrdRmtInfCdtTrfTxInf, 'Ccy', ccy);
							setAttributeValue(rmtdAmtRfrdDocAmtStrdRmtInfCdtTrfTxInf, 'Ccy', ccy);
						}
					}

					// dLog('creatBOAXMLDoc', 'objBillsData[billId] = ' +
					// JSON.stringify(objBillsData[billId]));
					// dLog('creatBOAXMLDoc', 'Num = ' + objBillsData[billId].num);
					// dLog('creatBOAXMLDoc', 'Trn = ' + objBillsData[billId].trnxnumber);

					dLog('creatBOAXMLDoc', JSON.stringify(objBillsData[billId]));

					if (!isEmpty(objBillsData[billId].num)) {
						addTextNodeFromParentNode(xmlDoc, rfrdDocInfStrdRmtInfCdtTrfTxInf, 'Nb', objBillsData[billId].num);
					} else if (!isEmpty(objBillsData[billId].trnxnumber)) {
						addTextNodeFromParentNode(xmlDoc, rfrdDocInfStrdRmtInfCdtTrfTxInf, 'Nb', objBillsData[billId].trnxnumber);
					}

					var invoiceDate = objBillsData[billId].dte;

					addTextNodeFromParentNode(xmlDoc, rfrdDocInfStrdRmtInfCdtTrfTxInf, 'RltdDt', formatDate(nlapiStringToDate(invoiceDate)));

					var rfrdDocAmtStrdRmtInfCdtTrfTxInf = addNodeFromParentNode(xmlDoc, strdRmtInfCdtTrfTxInf, 'RfrdDocAmt');
					var duePyblAmt = addTextNodeFromParentNode(xmlDoc, rfrdDocAmtStrdRmtInfCdtTrfTxInf, 'DuePyblAmt', origAmt.toFixed(2));
					var dscntApldAmt = addTextNodeFromParentNode(xmlDoc, rfrdDocAmtStrdRmtInfCdtTrfTxInf, 'DscntApldAmt', discAmt.toFixed(2));
					var rmtdAmt = addTextNodeFromParentNode(xmlDoc, rfrdDocAmtStrdRmtInfCdtTrfTxInf, 'RmtdAmt', netAmt.toFixed(2));

					setAttributeValue(duePyblAmt, 'Ccy', ccy);
					setAttributeValue(dscntApldAmt, 'Ccy', ccy);
					setAttributeValue(rmtdAmt, 'Ccy', ccy);

					// }
				}

				// ***END*** C. CREDIT TRANSFER TRANSACTION INFORMATION SECTION

				// END: PmtDetail
				tmpTotalAmt += tmpAmt;
			}
		}

		dLog('creatBOAXMLDoc', 'tmpTotalAmt = ' + tmpTotalAmt);
		dLog('creatBOAXMLDoc', '>>> END <<<');

		// dLog('creatBOAXMLDoc', 'xmlDoc = ' + nlapiXMLToString(xmlDoc));

		return xmlDoc;
	} catch (e) {
		var stErrMsg = '';
		if (e.getDetails != undefined) {
			stErrMsg = 'Script Error: ' + e.getCode() + '<br>' + e.getDetails() + '<br>' + e.getStackTrace();
		} else {
			stErrMsg = 'Script Error: ' + e.toString();
		}

		dLog('Script Error', stErrMsg);
	}
}

/**
 *
 * @param bills
 * @param subId
 * @returns
 */
function createJPMXMLDoc(objAcctMapping) {
	try {
		dLog('createJPMXMLDoc', '>>> START <<<');

		var schema = nlapiGetContext().getSetting('SCRIPT', 'custscript_v16_xml_schema');

		// dLog('creatXMLDoc', 'VPM Mapping results = ' +
		// JSON.stringify(objAcctMapping));

		// start create xml line
		var xmlDoc = nlapiStringToXML('<?xml version="1.0" encoding="utf-8"?><Document></Document>');
		var DocumentNode = getNode(xmlDoc, '/Document');
		setAttributeValue(DocumentNode, 'xmlns', 'urn:iso:std:iso:20022:tech:xsd:pain.001.001.03');

		var ns1 = 'urn:iso:std:iso:20022:tech:xsd:pain.001.001.03';
		var xsi = 'http://www.w3.org/2001/XMLSchema-instance';
		DocumentNode.setAttributeNS(xsi, 'xsi:schemaLocation', 'urn:iso:std:iso:20022:tech:xsd:pain.001.001.03 file:///H:/EDI%20SERVICES%20REFERENCE%20DATA/XML/SCHEMAS/pain.001.001.03.xsd');

		var cstmrCdtTrfInitnNode = addNodeFromParentNode(xmlDoc, DocumentNode, 'CstmrCdtTrfInitn');

		var arrTempBillIds = [];
		var arrBillCRIds = [];
		var arrBillAmt = [];
		var arrBillAmtOrig = [];
		var arrBillDiscAmt = [];
		var arrBillPayInfoCtr = [];
		var arrBillPayInfoSum = [];
		var arrGrpHdrNbOfTxs = [];
		var arrPmtInfNbOfTxs = [];
		var arrBillIds = [];
		var grpHdrNbOfTxs = 0;
		var grpHdrCtrlSum = 0;

		for (x in arrBillsProcessed) {
			var billId = arrBillsProcessed[x].id;
			var billPaymentId = arrBillsProcessed[x].payment;

			dLog('createJPMXMLDoc', 'Bill info = ' + JSON.stringify(arrBillsProcessed[x]));

			// check if payment id exist, only generate xml bills with payment
			// id, skip processed bill credit
			if (!isEmpty(billPaymentId) && billPaymentId != 'XXXNONEXXX' && billPaymentId != 'CREDIT') {
				if (billPaymentId != 'CREDIT') arrTempBillIds.push(billId);

				var payMethod = arrBillsProcessed[x].paymethod;
				var paymentId = arrBillsProcessed[x].payment;
				var payeeId = arrBillsProcessed[x].payeeid;

				arrBillAmtOrig[billId] = arrBillsProcessed[x].origamt;
				// arrBillAmt[billId] = arrBillsProcessed[x].pay;
				arrBillAmt[billId] = arrBillsProcessed[x].payamt;
				arrBillDiscAmt[billId] = arrBillsProcessed[x].discamt;

				var ndx = payMethod + '@@' + paymentId;

				if (arrBillPayInfoCtr[payMethod] == null) arrBillPayInfoCtr[payMethod] = 0;
				if (arrBillPayInfoSum[payMethod] == null) arrBillPayInfoSum[payMethod] = 0;
				if (arrPmtInfNbOfTxs[ndx] == null) arrPmtInfNbOfTxs[ndx] = 0;

				if (paymentId && arrGrpHdrNbOfTxs[paymentId] == null) grpHdrNbOfTxs++;

				arrPmtInfNbOfTxs[ndx]++;
				arrBillPayInfoCtr[payMethod]++;
				arrBillPayInfoSum[payMethod] += getFloatVal(arrBillsProcessed[x].payamt);
				arrGrpHdrNbOfTxs[paymentId] = paymentId;

				grpHdrCtrlSum += getFloatVal(arrBillsProcessed[x].payamt);
			}

			if (billPaymentId == 'CREDIT') arrBillCRIds.push(billId);
		}

		var arrBillIds2 = [];
		var arrBillIds3 = [];
		var arrBillIds4 = [];
		var arrBillIds5 = [];

		for (vx in arrTempBillIds) {
			var isBC = false;

			for (var x in arrBillCRIds) {
				if (arrTempBillIds[vx] == arrBillCRIds[x]) {
					isBC = true;
					break;
				}
			}

			if (!isBC) {
				arrBillIds.push(arrTempBillIds[vx]);
				arrBillIds2.push(arrTempBillIds[vx]);
				arrBillIds3.push(arrTempBillIds[vx]);
				arrBillIds4.push(arrTempBillIds[vx]);
				arrBillIds5.push(arrTempBillIds[vx]);
			}
		}

		dAudit(
			'createJPMXMLDoc',
			JSON.stringify({
				'arrBillIds.length': arrBillIds.length,
				'arrBillIds2.length': arrBillIds2.length,
				'arrBillIds3.length': arrBillIds3.length,
				'arrBillIds4.length': arrBillIds4.length,
				'arrBillIds5.length': arrBillIds5.length,
			})
		);

		dLog('createJPMXMLDoc', 'arrBillIds = ' + arrBillIds);
		dLog('createJPMXMLDoc', 'arrBillIds.length ' + arrBillIds.length);

		if (arrBillIds.length < 1) {
			dLog('createJPMXMLDoc', 'No bill id to generate xml. exit xml creation.');
			return null;
		}

		var arrBillCredits = getBillCredit(arrBillIds);
		var objBillsData = getBillData(arrBillIds2);
		var arrBillPO = getPOMap(arrBillIds3);
		var arrVendorBills = getPayeeBillsByPayMethod(arrBillIds4);
		var arrVendorBillsCurr = getPayeeBillsCurrency(arrBillIds5);
		var nsAcctSub = !isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('subsidiary', 'CUSTRECORD_ACCT_MAP_NETSUITE_ACCOUNT')) ? objAcctMapping[0].getValue('subsidiary', 'CUSTRECORD_ACCT_MAP_NETSUITE_ACCOUNT') : '';
		var objVDCRecResults = getVendorDAC_CCRPaymentRec(nsAcctSub);
		var arrCurrMap = getCurrecnyISOCode();
		var currDate = formatDate(new Date());
		var tmpTotalAmt = 0;
		var arrPayeeIds = [];

		dAudit(
			'createJPMXMLDoc',
			JSON.stringify({
				'arrBillCredits.length': arrBillCredits.length,
				'objBillsData.length': objBillsData.length,
				'arrBillPO.length': arrBillPO.length,
				'arrVendorBills.length': arrVendorBills.length,
				'objVDCRecResults.length': objVDCRecResults.length,
			})
		);

		// get Total Bill amount
		for (x in arrVendorBills) {
			var arrBillIds = arrVendorBills[x];
			// dLog('creatBOAXMLDoc', 'Vendor Id = ' + x);

			var payeeId = x.split('X@X')[1];
			arrPayeeIds.push(payeeId);

			for (vbill in arrBillIds) {
				// pmtTotalAmt += getFloatVal(arrBillAmt[arrBillIds[vbill]]);
			}
		}

		arrPayeeIds = removeDuplicates(arrPayeeIds);
		var arrVendors = getEntityData(arrPayeeIds);
		// var arrPayeeInterBillsMemo = getPayeeBillsMemo(arrPayeeIds);
		// dLog('creatBOAXMLDoc', 'pmtTotalAmt = ' + pmtTotalAmt);

		var fileCtrlNumber = Date.create().format('{yy}{MM}{dd}{mm}{ss}');

		// ***START*** A. GROUP HEADER
		var grpHdr = addNodeFromParentNode(xmlDoc, cstmrCdtTrfInitnNode, 'GrpHdr');
		addTextNodeFromParentNode(xmlDoc, grpHdr, 'MsgId', 'FILE' + pad(fileCtrlNumber, 4));

		// var currDate = Date.create();
		var currDate = new Date();
		// var mm = ("0" + currDate.getMilliseconds()).slice(-2);
		// var ss = ("0" + currDate.getMilliseconds()).slice(-2);
		// var ms = ("0" + currDate.getMilliseconds()).slice(-2);
		addTextNodeFromParentNode(xmlDoc, grpHdr, 'CreDtTm', currDate.format('{yyyy}-{MM}-{dd}T{hh}:{mm}:{ss}'));
		addTextNodeFromParentNode(xmlDoc, grpHdr, 'NbOfTxs', grpHdrNbOfTxs);
		addTextNodeFromParentNode(xmlDoc, grpHdr, 'CtrlSum', grpHdrCtrlSum.toFixed(2));

		var initgPty = addNodeFromParentNode(xmlDoc, grpHdr, 'InitgPty');
		var idInitgPty = addNodeFromParentNode(xmlDoc, initgPty, 'Id');
		var orgIdIdInitgPty = addNodeFromParentNode(xmlDoc, idInitgPty, 'OrgId');
		var othrOrgIdIdInitgPty = addNodeFromParentNode(xmlDoc, orgIdIdInitgPty, 'Othr');

		if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_cash_pro_send_id_bank_america'))) addTextNodeFromParentNode(xmlDoc, othrOrgIdIdInitgPty, 'Id', objVDCRecResults[0].getValue('custrecord_cash_pro_send_id_bank_america'));

		// ***END*** A. GROUP HEADER

		var ccy = '';
		if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_account_currency'))) ccy = arrCurrMap[objAcctMapping[0].getValue('custrecord_acct_map_account_currency')];

		dAudit('arrBillPayInfoCtr', JSON.stringify(arrBillPayInfoCtr));
		dAudit('arrBillPayInfoCtr.length', JSON.stringify(arrBillPayInfoCtr.length));

		for (x in arrBillPayInfoCtr) {
			var arrTemp = x.split('@@');
			var payeeId = arrTemp[1];
			var paymentMethod = x;
			dAudit('arrBillPayInfoCtr[x]', arrBillPayInfoCtr[x]);
			dAudit('arrBillPayInfoCtr.arrTemp', arrTemp);
			dAudit('arrBillPayInfoCtr.paymentMethod', paymentMethod);
			dAudit('arrBillPayInfoCtr.payeeId', payeeId);

			// ***START*** B. PAYMENT INFORMATION SECTION
			var pmtInf = addNodeFromParentNode(xmlDoc, cstmrCdtTrfInitnNode, 'PmtInf');

			if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_ceocompid'))) addTextNodeFromParentNode(xmlDoc, pmtInf, 'PmtInfId', objVDCRecResults[0].getValue('custrecord_ceocompid'));

			addTextNodeFromParentNode(xmlDoc, pmtInf, 'PmtMtd', paymentMethod == 'DAC' ? 'TRF' : paymentMethod);

			var pmtInfNbOfTxs = 0;
			for (pnb in arrPmtInfNbOfTxs) {
				var tmp = pnb.split('@@');
				var tmpPmethod = tmp[0];
				if (tmpPmethod == paymentMethod) {
					pmtInfNbOfTxs++;
				}
			}
			addTextNodeFromParentNode(xmlDoc, pmtInf, 'NbOfTxs', pmtInfNbOfTxs);

			addTextNodeFromParentNode(xmlDoc, pmtInf, 'CtrlSum', arrBillPayInfoSum[paymentMethod]);

			var pmtTpInf = addNodeFromParentNode(xmlDoc, pmtInf, 'PmtTpInf');
			var svcLvl = addNodeFromParentNode(xmlDoc, pmtTpInf, 'SvcLvl');
			addTextNodeFromParentNode(xmlDoc, svcLvl, 'Cd', 'NURG');

			var lclInstrm = addNodeFromParentNode(xmlDoc, pmtTpInf, 'LclInstrm');
			// var objVendor = arrVendors[payeeId];
			// if (!isEmpty(objVendor.payformat))
			// addTextNodeFromParentNode(xmlDoc, lclInstrm, 'Cd',
			// objVendor.payformat);
			addTextNodeFromParentNode(xmlDoc, lclInstrm, 'Cd', 'CCD');

			addTextNodeFromParentNode(xmlDoc, pmtInf, 'ReqdExctnDt', currDate.format('{yyyy}-{MM}-{dd}'));

			var dbtr = addNodeFromParentNode(xmlDoc, pmtInf, 'Dbtr');

			if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_companyname'))) addTextNodeFromParentNode(xmlDoc, dbtr, 'Nm', objVDCRecResults[0].getValue('custrecord_companyname'));

			if (
				(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_comppostcode'))) ||
				(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compcity'))) ||
				(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compstateprov'))) ||
				(!isEmpty(objVDCRecResults) && objVDCRecResults[0].getValue('custrecord_compcountrycode')) ||
				(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compadd1')))
			) {
				var pstlAdr = addNodeFromParentNode(xmlDoc, dbtr, 'PstlAdr');

				if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_comppostcode'))) addTextNodeFromParentNode(xmlDoc, pstlAdr, 'PstCd', objVDCRecResults[0].getValue('custrecord_comppostcode'));

				if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compcity'))) addTextNodeFromParentNode(xmlDoc, pstlAdr, 'TwnNm', objVDCRecResults[0].getValue('custrecord_compcity'));

				if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compstateprov'))) addTextNodeFromParentNode(xmlDoc, pstlAdr, 'CtrySubDvsn', objVDCRecResults[0].getValue('custrecord_compstateprov'));

				var country = !isEmpty(objVDCRecResults) ? objVDCRecResults[0].getValue('custrecord_compcountrycode') : '';
				addTextNodeFromParentNode(xmlDoc, pstlAdr, 'Ctry', country);

				if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compadd1'))) addTextNodeFromParentNode(xmlDoc, pstlAdr, 'AdrLine', objVDCRecResults[0].getValue('custrecord_compadd1'));
			}

			var idPmtInf = addNodeFromParentNode(xmlDoc, dbtr, 'Id');
			var orgIdIdPmtInf = addNodeFromParentNode(xmlDoc, idPmtInf, 'OrgId');
			var othrOrgIdIdPmtInf = addNodeFromParentNode(xmlDoc, orgIdIdPmtInf, 'Othr');

			if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_dom_ach_co_id'))) addTextNodeFromParentNode(xmlDoc, othrOrgIdIdPmtInf, 'Id', objAcctMapping[0].getValue('custrecord_acct_map_dom_ach_co_id'));

			var schmeNm = addNodeFromParentNode(xmlDoc, othrOrgIdIdPmtInf, 'SchmeNm');
			addTextNodeFromParentNode(xmlDoc, schmeNm, 'Prtry', 'JPMCOID');

			var dbtrAcct = addNodeFromParentNode(xmlDoc, pmtInf, 'DbtrAcct');
			var idDbtrAcct = addNodeFromParentNode(xmlDoc, dbtrAcct, 'Id');

			var otherDbtrAcct = addNodeFromParentNode(xmlDoc, idDbtrAcct, 'Othr');

			if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_origin_acc'))) addTextNodeFromParentNode(xmlDoc, otherDbtrAcct, 'Id', objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_origin_acc'));

			if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_account_currency'))) addTextNodeFromParentNode(xmlDoc, dbtrAcct, 'Ccy', arrCurrMap[objAcctMapping[0].getValue('custrecord_acct_map_account_currency')]);

			if ((!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id'))) || !isEmpty(country)) {
				var dbtrAgt = addNodeFromParentNode(xmlDoc, pmtInf, 'DbtrAgt');
				var finlstnId = addNodeFromParentNode(xmlDoc, dbtrAgt, 'FinInstnId');
				var clrSysMmbId = addNodeFromParentNode(xmlDoc, finlstnId, 'ClrSysMmbId');

				if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id'))) addTextNodeFromParentNode(xmlDoc, clrSysMmbId, 'MmbId', objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id'));

				var pstlAdr = addNodeFromParentNode(xmlDoc, finlstnId, 'PstlAdr');
				addTextNodeFromParentNode(xmlDoc, pstlAdr, 'Ctry', country);
			}

			// ***END*** B. PAYMENT INFORMATION SECTION

			// dLog('creatBOAXMLDoc', 'Bill Payment Method = ' + paymentMethod);

			dAudit('arrVendorBills', arrVendorBills);
			var payformat = '';
			for (v in arrVendorBills) {
				var arrPayeeInfo = v.split('X@X');
				var payeeId = arrPayeeInfo[1];
				// var currId = arrPayeeCurr[1];

				dLog('createJPMXMLDoc', 'vb ndex = ' + v);

				//var objVendor=arrVendors[payeeId];
        var objVendor = _.find(arrVendors, { internalid: String(payeeId)});
				//        var objVendor = _.find(arrVendors, { internalid: String(payeeId)});
				//v.ar objVendor = _.find(arrVendors, { internalid: String(payeeId), paymentmethod: String(paymentMethod) })[0];        
				// dLog('creatBOAXMLDoc', 'objVendor = ' +
				// JSON.stringify(objVendor));

				if (isEmpty(objVendor)) continue;

				if (payformat == '') payformat = objVendor.payformat;
				// addTextNodeFromParentNode(xmlDoc, lclInstrm, 'Cd', objVendor.payformat);

				var pmtMethod = objVendor.paymentmethod;

				if (paymentMethod != pmtMethod) continue;

				dLog('createJPMXMLDoc', 'Vendor Payment Method = ' + pmtMethod);

				// dLog('creatBOAXMLDoc', 'paymentMethod = ' + paymentMethod);
				// dLog('creatBOAXMLDoc', 'pmtMethod = ' +
				// objVendor.paymentmethod);

				var arrBills = arrVendorBills[paymentMethod + 'X@X' + payeeId];
				// var pmtRecCurAmt = 0;
				var tmpAmt = 0;

				// for (bill in arrBills) {
				// pmtRecCurAmt += getFloatVal(arrBillAmt[arrBills[bill]]);
				// }

				var numberOfBills = _.size(arrBills);
				for (by in arrBills) {
					var billId = arrBills[by];
					// if (pmtMethod == 'CHK' || pmtMethod == 'DAC' || pmtMethod
					// ==
					// 'CCR' || pmtMethod == 'IWI' || pmtMethod == 'MTS' ||
					// pmtMethod == 'IAC') {

					var netAmt = 0;
					var origAmt = getFloatVal(arrBillAmtOrig[billId]);
					var amt = getFloatVal(arrBillAmt[billId]);

					// dLog('creatXMLDoc', 'origAmt = ' + origAmt);
					// dLog('creatXMLDoc', 'amt = ' + amt);

					var discAmt = !isEmpty(arrBillDiscAmt[billId]) ? getFloatVal(arrBillDiscAmt[billId]) : 0;

					// tmpAmt += amt;
					netAmt = origAmt;
					tmpAmt += netAmt;

					if (discAmt > 0) {
						netAmt -= discAmt;
						tmpAmt -= discAmt;
					}

					if (!isEmpty(arrBillCredits[billId])) {
						var arrBC = arrBillCredits[billId];

						for (bc in arrBC) {
							var billCreditAmtP = getFloatVal(arrBC[bc].bcamt);
							var billCreditAmt = billCreditAmtP * -1;

							// pmtTotalAmt = (pmtTotalAmt - billCreditAmtP);
							// pmtRecCurAmt = (pmtRecCurAmt - billCreditAmtP);
							tmpAmt = tmpAmt - billCreditAmtP;
							netAmt = netAmt - billCreditAmtP;
						}
					}
					// }
				}

				// ***START*** C. CREDIT TRANSFER TRANSACTION INFORMATION
				// SECTION

				var cdtTrfTxInf = addNodeFromParentNode(xmlDoc, pmtInf, 'CdtTrfTxInf');
				var pmtIdCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtTrfTxInf, 'PmtId');

				addTextNodeFromParentNode(xmlDoc, pmtIdCdtTrfTxInf, 'EndToEndId', arrBillPaymentMap[payeeId]);

				var amtCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtTrfTxInf, 'Amt');
				var amtCdtTrfTxInfInstdAmt = addTextNodeFromParentNode(xmlDoc, amtCdtTrfTxInf, 'InstdAmt', tmpAmt.toFixed(2));
				setAttributeValue(amtCdtTrfTxInfInstdAmt, 'Ccy', ccy);

				var cdtrAgtCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtTrfTxInf, 'CdtrAgt');
				var finInstnIdCdtrAgtCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtrAgtCdtTrfTxInf, 'FinInstnId');
				var clrSysmmbIdFinInstnIdCdtrAgtCdtTrfTxInf = addNodeFromParentNode(xmlDoc, finInstnIdCdtrAgtCdtTrfTxInf, 'ClrSysMmbId');

				if (!isEmpty(objVendor.recbankprimid)) addTextNodeFromParentNode(xmlDoc, clrSysmmbIdFinInstnIdCdtrAgtCdtTrfTxInf, 'MmbId', objVendor.recbankprimid);

				var pstlAdrFinInstnIdCdtrAgtCdtTrfTxInf = addNodeFromParentNode(xmlDoc, finInstnIdCdtrAgtCdtTrfTxInf, 'PstlAdr');

				if (!isEmpty(objVendor.vendorcountrycode)) addTextNodeFromParentNode(xmlDoc, pstlAdrFinInstnIdCdtrAgtCdtTrfTxInf, 'Ctry', countryCodeMapping[objVendor.vendorcountrycode]);

				var cdtrCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtTrfTxInf, 'Cdtr');

				if (!isEmpty(objVendor.vendorname)) addTextNodeFromParentNode(xmlDoc, cdtrCdtTrfTxInf, 'Nm', objVendor.vendorname);

				var pstlAdrCdtrCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtrCdtTrfTxInf, 'PstlAdr');

				if (!isEmpty(objVendor.vendorpostal)) addTextNodeFromParentNode(xmlDoc, pstlAdrCdtrCdtTrfTxInf, 'PstCd', objVendor.vendorpostal);
				if (!isEmpty(objVendor.vendorcity)) addTextNodeFromParentNode(xmlDoc, pstlAdrCdtrCdtTrfTxInf, 'TwnNm', objVendor.vendorcity);
				if (!isEmpty(objVendor.vendorstateprovince)) addTextNodeFromParentNode(xmlDoc, pstlAdrCdtrCdtTrfTxInf, 'CtrySubDvsn', objVendor.vendorstateprovince);
				if (!isEmpty(objVendor.vendorcountrycode)) addTextNodeFromParentNode(xmlDoc, pstlAdrCdtrCdtTrfTxInf, 'Ctry', countryCodeMapping[objVendor.vendorcountrycode]);
				if (!isEmpty(objVendor.vendoraddrs1)) addTextNodeFromParentNode(xmlDoc, pstlAdrCdtrCdtTrfTxInf, 'AdrLine', objVendor.vendoraddrs1);

				var cdtrAcct = addNodeFromParentNode(xmlDoc, cdtTrfTxInf, 'CdtrAcct');

				if (!isEmpty(objVendor.recpartyaccount)) {
					var idCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtrAcct, 'Id');
					var othrIdCdtTrfTxInf = addNodeFromParentNode(xmlDoc, idCdtTrfTxInf, 'Othr');

					addTextNodeFromParentNode(xmlDoc, othrIdCdtTrfTxInf, 'Id', objVendor.recpartyaccount);
				}

				var tpCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtrAcct, 'Tp');
				addTextNodeFromParentNode(xmlDoc, tpCdtTrfTxInf, 'Cd', 'CASH');

				// var instrForCdtAgtCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtTrfTxInf, 'InstrForCdtrAgt');
				// addTextNodeFromParentNode(xmlDoc, instrForCdtAgtCdtTrfTxInf, 'InstrInf', 'CORP PMT');

				var rmtInfCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtTrfTxInf, 'RmtInf');

				tmpAmt = 0; // need to initialize back to 0

				for (y in arrBills) {
					var billId = arrBills[y];
					dLog('createJPMXMLDoc', 'billId = ' + billId);

					// if (pmtMethod == 'CHK' || pmtMethod == 'DAC' || pmtMethod
					// ==
					// 'CCR' || pmtMethod == 'IWI' || pmtMethod == 'MTS' ||
					// pmtMethod == 'IAC') {

					var strdRmtInfCdtTrfTxInf = addNodeFromParentNode(xmlDoc, rmtInfCdtTrfTxInf, 'Strd');
					var rfrdDocInfStrdRmtInfCdtTrfTxInf = addNodeFromParentNode(xmlDoc, strdRmtInfCdtTrfTxInf, 'RfrdDocInf');
					var tpRfrdDocInfStrdRmtInfCdtTrfTxInf = addNodeFromParentNode(xmlDoc, rfrdDocInfStrdRmtInfCdtTrfTxInf, 'Tp');
					var cdOrPrtryRpRfrdDocInfStrdRmtInfCdtTrfTxInf = addNodeFromParentNode(xmlDoc, tpRfrdDocInfStrdRmtInfCdtTrfTxInf, 'CdOrPrtry');
					addTextNodeFromParentNode(xmlDoc, cdOrPrtryRpRfrdDocInfStrdRmtInfCdtTrfTxInf, 'Cd', 'CINV');

					var netAmt = 0;
					var origAmt = getFloatVal(arrBillAmtOrig[billId]);
					var amt = getFloatVal(arrBillAmt[billId]);

					// dLog('creatXMLDoc', 'origAmt = ' + origAmt);
					// dLog('creatXMLDoc', 'amt = ' + amt);

					var discAmt = !isEmpty(arrBillDiscAmt[billId]) ? getFloatVal(arrBillDiscAmt[billId]) : 0;

					if (!isEmpty(arrBillCredits[billId])) {
						var arrBC = arrBillCredits[billId];
						for (bc in arrBC) {
							var billCreditAmtP = getFloatVal(arrBC[bc].bcamt);
							var billCreditAmt = billCreditAmtP * -1;

							tmpAmt = tmpAmt - billCreditAmtP;
							netAmt = netAmt - billCreditAmtP;
						}
					}

					// tmpAmt += amt;
					netAmt = origAmt;
					tmpAmt += netAmt;

					if (discAmt > 0) {
						netAmt -= discAmt;
						tmpAmt -= discAmt;
					}

					// dLog('creatBOAXMLDoc', 'objBillsData[billId] = ' +
					// JSON.stringify(objBillsData[billId]));
					// dLog('creatBOAXMLDoc', 'Num = ' + objBillsData[billId].num);
					// dLog('creatBOAXMLDoc', 'Trn = ' + objBillsData[billId].trnxnumber);

					dLog('createJPMXMLDoc', JSON.stringify(objBillsData[billId]));

					if (!isEmpty(objBillsData[billId].num)) {
						addTextNodeFromParentNode(xmlDoc, rfrdDocInfStrdRmtInfCdtTrfTxInf, 'Nb', objBillsData[billId].num);
					} else if (!isEmpty(objBillsData[billId].trnxnumber)) {
						addTextNodeFromParentNode(xmlDoc, rfrdDocInfStrdRmtInfCdtTrfTxInf, 'Nb', objBillsData[billId].trnxnumber);
					}

					var invoiceDate = objBillsData[billId].dte;

					addTextNodeFromParentNode(xmlDoc, rfrdDocInfStrdRmtInfCdtTrfTxInf, 'RltdDt', formatDate(nlapiStringToDate(invoiceDate)));

					var rfrdDocAmtStrdRmtInfCdtTrfTxInf = addNodeFromParentNode(xmlDoc, strdRmtInfCdtTrfTxInf, 'RfrdDocAmt');
					var duePyblAmt = addTextNodeFromParentNode(xmlDoc, rfrdDocAmtStrdRmtInfCdtTrfTxInf, 'DuePyblAmt', origAmt.toFixed(2));
					var dscntApldAmt = addTextNodeFromParentNode(xmlDoc, rfrdDocAmtStrdRmtInfCdtTrfTxInf, 'DscntApldAmt', discAmt.toFixed(2));
					var rmtdAmt = addTextNodeFromParentNode(xmlDoc, rfrdDocAmtStrdRmtInfCdtTrfTxInf, 'RmtdAmt', netAmt.toFixed(2));

					setAttributeValue(duePyblAmt, 'Ccy', ccy);
					setAttributeValue(dscntApldAmt, 'Ccy', ccy);
					setAttributeValue(rmtdAmt, 'Ccy', ccy);

					if (!isEmpty(arrBillCredits[billId])) {
						var arrBC = arrBillCredits[billId];

						for (bc in arrBC) {
							var billCreditAmtP = getFloatVal(arrBC[bc].bcamt);
							var billCreditAmt = billCreditAmtP;

							// pmtTotalAmt = (pmtTotalAmt - billCreditAmtP);
							// pmtRecCurAmt = (pmtRecCurAmt - billCreditAmtP);

							tmpAmt = tmpAmt - billCreditAmtP;
							netAmt = netAmt - billCreditAmtP;

							var strdRmtInfCdtTrfTxInf = addNodeFromParentNode(xmlDoc, rmtInfCdtTrfTxInf, 'Strd');
							var rfrdDocInfStrdRmtInfCdtTrfTxInf = addNodeFromParentNode(xmlDoc, strdRmtInfCdtTrfTxInf, 'RfrdDocInf');
							var tpRfrdDocInfStrdRmtInfCdtTrfTxInf = addNodeFromParentNode(xmlDoc, rfrdDocInfStrdRmtInfCdtTrfTxInf, 'Tp');
							var cdOrPrtryRpRfrdDocInfStrdRmtInfCdtTrfTxInf = addNodeFromParentNode(xmlDoc, tpRfrdDocInfStrdRmtInfCdtTrfTxInf, 'CdOrPrtry');
							addTextNodeFromParentNode(xmlDoc, cdOrPrtryRpRfrdDocInfStrdRmtInfCdtTrfTxInf, 'Cd', 'CREN');

							var bcNum = arrBC[bc].bcnum;
							dLog('createJPMXMLDoc', 'VC number : ' + bcNum);
							if (!isEmpty(bcNum)) addTextNodeFromParentNode(xmlDoc, rfrdDocInfStrdRmtInfCdtTrfTxInf, 'Nb', bcNum);
							else if (!isEmpty(arrBillCredits[billId].bcmemo)) {
								addTextNodeFromParentNode(xmlDoc, rfrdDocInfStrdRmtInfCdtTrfTxInf, 'Nb', arrBillCredits[billId].bcmemo);
							}

							addTextNodeFromParentNode(xmlDoc, rfrdDocInfStrdRmtInfCdtTrfTxInf, 'RltdDt', formatDate(nlapiStringToDate(arrBC[bc].bcdate)));

							var rfrdDocAmtStrdRmtInfCdtTrfTxInf = addNodeFromParentNode(xmlDoc, strdRmtInfCdtTrfTxInf, 'RfrdDocAmt');
							var duePyblAmtRfrdDocAmtStrdRmtInfCdtTrfTxInf = addTextNodeFromParentNode(xmlDoc, rfrdDocAmtStrdRmtInfCdtTrfTxInf, 'DuePyblAmt', billCreditAmt.toFixed(2));
							var dscntApldAmtRfrdDocAmtStrdRmtInfCdtTrfTxInf = addTextNodeFromParentNode(xmlDoc, rfrdDocAmtStrdRmtInfCdtTrfTxInf, 'DscntApldAmt', discAmt.toFixed(2));
							var rmtdAmtRfrdDocAmtStrdRmtInfCdtTrfTxInf = addTextNodeFromParentNode(xmlDoc, rfrdDocAmtStrdRmtInfCdtTrfTxInf, 'CdtNoteAmt', billCreditAmt.toFixed(2));

							setAttributeValue(duePyblAmtRfrdDocAmtStrdRmtInfCdtTrfTxInf, 'Ccy', ccy);
							setAttributeValue(dscntApldAmtRfrdDocAmtStrdRmtInfCdtTrfTxInf, 'Ccy', ccy);
							setAttributeValue(rmtdAmtRfrdDocAmtStrdRmtInfCdtTrfTxInf, 'Ccy', ccy);
						}
					}

					// }
				}

				// ***END*** C. CREDIT TRANSFER TRANSACTION INFORMATION SECTION

				// END: PmtDetail
				tmpTotalAmt += tmpAmt;
			}
			// dLog('createJPMXMLDoc.payformat', payformat);
			// if (payformat) {
			//         addTextNodeFromParentNode(xmlDoc, lclInstrm, 'Cd', payformat);
			// }
		}

		dLog('createJPMXMLDoc', 'tmpTotalAmt = ' + tmpTotalAmt);
		dLog('createJPMXMLDoc', '>>> END <<<');

		// dLog('creatBOAXMLDoc', 'xmlDoc = ' + nlapiXMLToString(xmlDoc));

		return xmlDoc;
	} catch (e) {
		var stErrMsg = '';
		if (e.getDetails != undefined) {
			stErrMsg = 'Script Error: ' + e.getCode() + '<br>' + e.getDetails() + '<br>' + e.getStackTrace();
		} else {
			stErrMsg = 'Script Error: ' + e.toString();
		}

		dLog('Script Error', stErrMsg);
	}
}

function createPPXMLDoc(objAcctMapping) {
	var arrTempBillIds = [];
	var arrBillCRIds = [];
	var arrBillAmt = [];
	var arrBillAmtOrig = [];
	var arrBillDiscAmt = [];
	var arrBillPayInfoCtr = [];
	var arrBillPayInfoSum = [];
	var arrGrpHdrNbOfTxs = [];
	var arrPmtInfNbOfTxs = [];
	var arrBillIds = [];
	var grpHdrNbOfTxs = 0;
	var grpHdrCtrlSum = 0;
	var arrPayeeIds = [];
	var arrBillIds = [];
	var arrBillIds2 = [];
	var arrBillIds3 = [];
	var arrBillIds4 = [];
	var arrBillIds5 = [];
	var _currencies = getCurrencies();

	for (x in arrBillsProcessed) {
		var billId = arrBillsProcessed[x].id;
		var billPaymentId = arrBillsProcessed[x].payment;

		dLog('createPPXMLDoc', 'Bill info = ' + JSON.stringify(arrBillsProcessed[x]));
		if (!isEmpty(billPaymentId) && billPaymentId != 'XXXNONEXXX' && billPaymentId != 'CREDIT') {
			if (billPaymentId != 'CREDIT') arrTempBillIds.push(billId);

			var payMethod = arrBillsProcessed[x].paymethod;
			var paymentId = arrBillsProcessed[x].payment;
			var payeeId = arrBillsProcessed[x].payeeid;

			arrBillAmtOrig[billId] = arrBillsProcessed[x].origamt;
			arrBillAmt[billId] = arrBillsProcessed[x].payamt;
			arrBillDiscAmt[billId] = arrBillsProcessed[x].discamt;

			var ndx = payMethod + '@@' + paymentId;

			if (arrBillPayInfoCtr[payMethod] == null) arrBillPayInfoCtr[payMethod] = 0;
			if (arrBillPayInfoSum[payMethod] == null) arrBillPayInfoSum[payMethod] = 0;
			if (arrPmtInfNbOfTxs[ndx] == null) arrPmtInfNbOfTxs[ndx] = 0;

			if (paymentId && arrGrpHdrNbOfTxs[paymentId] == null) grpHdrNbOfTxs++;

			arrPmtInfNbOfTxs[ndx]++;
			arrBillPayInfoCtr[payMethod]++;
			arrBillPayInfoSum[payMethod] += getFloatVal(arrBillsProcessed[x].payamt);
			arrGrpHdrNbOfTxs[paymentId] = paymentId;

			grpHdrCtrlSum += getFloatVal(arrBillsProcessed[x].payamt);
		}

		if (billPaymentId == 'CREDIT') arrBillCRIds.push(billId);
	}

	for (vx in arrTempBillIds) {
		var isBC = false;
		for (var x in arrBillCRIds) {
			if (arrTempBillIds[vx] == arrBillCRIds[x]) {
				isBC = true;
				break;
			}
		}

		if (!isBC) {
			arrBillIds.push(arrTempBillIds[vx]);
			arrBillIds2.push(arrTempBillIds[vx]);
			arrBillIds3.push(arrTempBillIds[vx]);
			arrBillIds4.push(arrTempBillIds[vx]);
			arrBillIds5.push(arrTempBillIds[vx]);
		}
	}

	var arrBillCredits = getBillCredit(arrBillIds);
	var objBillsData = getBillData(arrBillIds2);
	var arrBillPO = getPOMap(arrBillIds3);
	var arrVendorBills = getPayeeBillsByPayMethod(arrBillIds4);
	var arrVendorBillsCurr = getPayeeBillsCurrency(arrBillIds5);
	var nsAcctSub = !isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('subsidiary', 'CUSTRECORD_ACCT_MAP_NETSUITE_ACCOUNT')) ? objAcctMapping[0].getValue('subsidiary', 'CUSTRECORD_ACCT_MAP_NETSUITE_ACCOUNT') : '';
	var objVDCRecResults = getVendorDAC_CCRPaymentRec(nsAcctSub);

	var CHRBR = 'CRED';
	if (WIRE_FEES == 2) {
		CHRBR = 'DEBT';
	} else if (WIRE_FEES == 3) {
		CHRBR = 'SHAR';
	}

	//Gather data.
	var CdtTrfTxInf = [];

	var objects = {
		MsgId: 'TBD',
		CreDtTm: 'Test',
		Authstn: {
			Cd: '',
		},
		NbOfTxs: '2',
		CtrlSum: '2000',
		InitgPty: {
			Id: {
				OrgId: {
					Othr: {
						Id: '',
					},
				},
			},
		},
		PmtInfId: 'PmtInfId',
		PmtMtd: 'PmtMtd',
		PmtTpInf: {
			SvcLvl: {
				Cd: 'This is CD',
			},
		},
		ReqdExctnDt: 'ReqdExctnDt',
		Dbtr: {
			Nm: 'This is Nm',
			PstlAdr: {
				StrtNm: '',
				PstCd: '',
				TwnNm: '',
				Ctry: '',
			},
		},
		DbtrAcct: {
			Id: {
				Othr: {
					Id: 'DbtrAcct.Id.Othr.Id',
				},
			},
		},
		DbtrAgt: {
			FinInstnId: {
				BIC: 'BIC',
				PstlAdr: {
					Ctry: 'Ctry',
				},
			},
		},
		CdtTrfTxInf: CdtTrfTxInf,
	};

	for (x in arrVendorBills) {
		var payeeId = x.split('X@X')[1];
		arrPayeeIds.push(payeeId);
	}

	var arrVendors = getEntityData(arrPayeeIds);
	var today = new Date();
	var bpmdate = BPM_DATE;
	var d = nlapiStringToDate(bpmdate, 'datetime');

	var fileCtrlNumber = Date.create().format('{yy}{MM}{dd}{mm}{ss}');

	objects.MsgId = pad(fileCtrlNumber, 4);
	objects.CreDtTm = moment(d).format('YYYY-MM-DDThh:mm:ss') || today.format('{yyyy}-{MM}-{dd}T{hh}:{mm}:{ss}');
	objects.Authstn.Cd = 'AUTH'; //FDET
	objects.NbOfTxs = grpHdrNbOfTxs;
	objects.CtrlSum = grpHdrCtrlSum.toFixed(2);

	if (objects.CtrlSum == '0.00') {
		dLog('CtrlSum is 0.00, this should not happen. Returning empty file', objects.CtrlSum);
		return '';
	}

	if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ceo_company_id'))) {
		objects.InitgPty.Id.OrgId.Othr.Id = objAcctMapping[0].getValue('custrecord_acct_map_ceo_company_id');
	}

	for (x in arrBillPayInfoCtr) {
		objects.PmtInfId = fileCtrlNumber;

		var paymentMethod = x;
		objects.PmtMtd = 'TRF'; //hardcoded.

		objects.PmtTpInf.SvcLvl.Cd = 'URGP'; //hardcoded.

		// var bpmdate = BPM_DATE;
		// var d = nlapiStringToDate(bpmdate, 'date');
		objects.ReqdExctnDt = moment(d).format('YYYY-MM-DD') || today.format('{yyyy}-{MM}-{dd}');
		// objects.ReqdExctnDt = moment(BPM_DATE).format('YYYY-MM-DD'); //today.format('{yyyy}-{MM}-{dd}');

		if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_companyname'))) objects.Dbtr.Nm = objVDCRecResults[0].getValue('custrecord_companyname');

		//PstlAdr
		var country = !isEmpty(objVDCRecResults) ? objVDCRecResults[0].getValue('custrecord_compcountrycode') : '';
		if (
			(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_comppostcode'))) ||
			(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compcity'))) ||
			(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compstateprov'))) ||
			(!isEmpty(objVDCRecResults) && objVDCRecResults[0].getValue('custrecord_compcountrycode')) ||
			(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compadd1')))
		) {
			if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_comppostcode'))) {
				objects.Dbtr.PstlAdr.PstCd = '<PstCd>' + objVDCRecResults[0].getValue('custrecord_comppostcode') + '</PstCd>';
			}
			if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compcity'))) {
				objects.Dbtr.PstlAdr.TwnNm = '<TwnNm>' + objVDCRecResults[0].getValue('custrecord_compcity') + '</TwnNm>';
			}
			if (country) {
				objects.Dbtr.PstlAdr.Ctry = '<Ctry>' + country + '</Ctry>';
			}
			if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compadd1'))) {
				objects.Dbtr.PstlAdr.StrtNm = '<StrtNm>' + objVDCRecResults[0].getValue('custrecord_compadd1') + '</StrtNm>';
			}
			if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compadd2'))) {
				objects.Dbtr.PstlAdr.BldgNb = '<BldgNb>' + objVDCRecResults[0].getValue('custrecord_compadd2') + '</BldgNb>';
			}
		}

		//DbtrAcct
		if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_origin_acc'))) objects.DbtrAcct.Id.Othr.Id = objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_origin_acc');

		//DbtrAgt
		if ((!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id'))) || !isEmpty(country)) {
			if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id'))) {
				objects.DbtrAgt.FinInstnId.BIC = objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id');
			}
			objects.DbtrAgt.FinInstnId.PstlAdr.Ctry = country;
		}

		//CdtTrfTxInf loop starts here.

		if (SINGLEBILLPYMTS == 'T') {
			dAudit('Create Single Bill Payments here.', JSON.stringify(arrBillsProcessed));

			for (var i = 0; i < arrBillsProcessed.length; i++) {
				var billPayment = arrBillsProcessed[i];
				dAudit('billPayment', JSON.stringify(billPayment));
				if (billPayment.payment == 'CREDIT') {
					continue;
				}

				var symbol = '';

				try {
					symbol = _.find(_currencies, { internalid: String(billPayment.currid) }).symbol;
				} catch (e) {}

				// var objVendor = arrVendors[billPayment.payeeid];
				var objVendor = _.find(arrVendors, { internalid: String(billPayment.payeeid) });

				var cdtTrfTxInfObj = {};
				cdtTrfTxInfObj.PmtId = {};

				var refnum = billPayment.refnum; // This was the previous value.
				var instrId = '';
				if (refnum.length > 12) {
					instrId = pz(refnum.substring(refnum.length - 12, refnum.length), 12);
				} else {
					instrId = pz(refnum, 12);
				}
				refnum = billPayment.billnum; //Overwrite endToendID
				var endToEndId = refnum;
				if (refnum.length > 18) {
					endToEndId = refnum.substr(0, 18);
				}

				cdtTrfTxInfObj.PmtId.InstrId = instrId;
				cdtTrfTxInfObj.PmtId.EndToEndId = endToEndId;
				cdtTrfTxInfObj.Amt = {};
				cdtTrfTxInfObj.Amt.value = billPayment.payamt; //amt.toFixed(2);
				cdtTrfTxInfObj.Amt.Ccy = symbol;
				cdtTrfTxInfObj.ChrgBr = billPayment.paymethod == 'AUCR' ? 'CRED' : 'DEBT';

				cdtTrfTxInfObj.CdtrAgt = {};
				cdtTrfTxInfObj.CdtrAgt.FinInstnId = {};
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.BIC = objVendor.recbankprimid;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.ClrSysMmbId = {};
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.ClrSysMmbId.MmbId = objVendor.bankid;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.Nm = objVendor.vbankname;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr = {};
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.Ctry = countryCodeMapping[objVendor.vbankcountry];
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.AdrLine = objVendor.vbankaddrs1;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.StrtNum = objVendor.vbankaddrs1;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.PstCd = objVendor.vbankzip;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.TwnNm = objVendor.vbankcity;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.BldgNb = '';

				cdtTrfTxInfObj.Cdtr = {};
				cdtTrfTxInfObj.Cdtr.Nm = objVendor.vendorname;
				cdtTrfTxInfObj.Cdtr.PstlAdr = {};
				cdtTrfTxInfObj.Cdtr.PstlAdr.StrtNm = objVendor.vendoraddrs1;
				cdtTrfTxInfObj.Cdtr.PstlAdr.BldgNb = objVendor.vendoraddrs2 || '';
				cdtTrfTxInfObj.Cdtr.PstlAdr.PstCd = objVendor.vendorpostal;
				cdtTrfTxInfObj.Cdtr.PstlAdr.TwnNm = objVendor.vendorcity;
				cdtTrfTxInfObj.Cdtr.PstlAdr.Ctry = countryCodeMapping[objVendor.vendorcountrycode];

				cdtTrfTxInfObj.CdtrAcct = {};
				cdtTrfTxInfObj.CdtrAcct.Id = {};
				cdtTrfTxInfObj.CdtrAcct.Id.Othr = {};
				cdtTrfTxInfObj.CdtrAcct.Id.Othr.Id = objVendor.recpartyaccount;

				cdtTrfTxInfObj.RltdAmtInf = {};
				cdtTrfTxInfObj.RltdAmtInf.RmtLctnMtd = objVendor.pmp_dac_contactname || '';
				cdtTrfTxInfObj.RltdAmtInf.RmtLctnElctrncAdr = objVendor.pmp_dac_emailaddress || '';
				cdtTrfTxInfObj.RmtInf = {};
				cdtTrfTxInfObj.RmtInf.Ustrd = refnum;
				// cdtTrfTxInfObj.RmtInf.Strd = Strd;

				CdtTrfTxInf.push(cdtTrfTxInfObj);
			}
		} else {
			var symbol = '';
			var refnum = '';

			for (v in arrVendorBills) {
				var arrPayeeInfo = v.split('X@X');
				var payeeId = arrPayeeInfo[1];
				//var objVendor=arrVendors[payeeId];
				       var objVendor = _.find(arrVendors, { internalid: String(payeeId)});
				// var objVendor = _.find(arrVendors, { internalid: String(payeeId), paymentmethod: String(paymentMethod) })[0];
dAudit('objVendor-new', objVendor);
				if (isEmpty(objVendor)) continue;

				var pmtMethod = objVendor.paymentmethod;

				if (paymentMethod != pmtMethod) continue;

				var arrBills = arrVendorBills[paymentMethod + 'X@X' + payeeId];
				var tmpAmt = 0;

				var numberOfBills = _.size(arrBills);
				for (by in arrBills) {
					var billId = arrBills[by];

					// var billId = arrBills[y];
					refnum = _.find(arrBillsProcessed, { id: String(billId) }).refnum;
					currency = _.find(arrBillsProcessed, { id: String(billId) }).currid;
					subtext = _.find(arrBillsProcessed, { id: String(billId) }).subtext;
					billnum = _.find(arrBillsProcessed, { id: String(billId) }).billnum;

					try {
						symbol = _.find(_currencies, { internalid: String(currency) }).symbol;
					} catch (e) {
						dErr('Error retrieving symbol', e.message);
					}

					var netAmt = 0;
					var origAmt = getFloatVal(arrBillAmtOrig[billId]);
					var amt = getFloatVal(arrBillAmt[billId]);

					var discAmt = !isEmpty(arrBillDiscAmt[billId]) ? getFloatVal(arrBillDiscAmt[billId]) : 0;

					netAmt = origAmt;
					tmpAmt += amt; //used to be netAmt

					if (discAmt > 0) {
						netAmt -= discAmt;
						tmpAmt -= discAmt;
					}

					if (!isEmpty(arrBillCredits[billId])) {
						var arrBC = arrBillCredits[billId];

						for (bc in arrBC) {
							var billCreditAmtP = getFloatVal(arrBC[bc].bcamt);
							var billCreditAmt = billCreditAmtP * -1;

							// tmpAmt = (tmpAmt - billCreditAmtP);
							netAmt = netAmt - billCreditAmtP;
						}
					}
				}

				var cdtTrfTxInfObj = {};

				cdtTrfTxInfObj.PmtId = {};

				var refnum = arrBillPaymentMap[payeeId];
				dAudit('refnum', JSON.stringify(refnum));
				var instrId = '';
				if (refnum.length > 12) {
					instrId = pz(refnum.substring(refnum.length - 12, refnum.length), 12);
				} else {
					instrId = pz(refnum, 12);
				}
				var endToEndId = billnum.substr(0, 18);
				if (numberOfBills > 1) {
					endToEndId = subtext.substr(0, 18);
				}

				cdtTrfTxInfObj.PmtId.InstrId = instrId;
				cdtTrfTxInfObj.PmtId.EndToEndId = endToEndId;
				cdtTrfTxInfObj.Amt = {};
				cdtTrfTxInfObj.Amt.value = tmpAmt.toFixed(2);
				cdtTrfTxInfObj.Amt.Ccy = symbol; //hardcoded for now.

				tmpAmt = 0; // need to initialize back to 0

				var Strd = [];
				for (y in arrBills) {
					var billId = arrBills[y];

					var StrdObj = {};
					StrdObj.RfrdDocInf = {};
					StrdObj.RfrdDocInf.Tp = {};
					StrdObj.RfrdDocInf.Tp.CdOrPrtry = {};
					StrdObj.RfrdDocInf.Tp.CdOrPrtry.Cd = 'CINV'; //Hardcoded?

					var netAmt = 0;
					var origAmt = getFloatVal(arrBillAmtOrig[billId]);
					var amt = getFloatVal(arrBillAmt[billId]);

					var discAmt = !isEmpty(arrBillDiscAmt[billId]) ? getFloatVal(arrBillDiscAmt[billId]) : 0;

					if (!isEmpty(arrBillCredits[billId])) {
						var arrBC = arrBillCredits[billId];
						for (bc in arrBC) {
							var billCreditAmtP = getFloatVal(arrBC[bc].bcamt);
							var billCreditAmt = billCreditAmtP * -1;

							// tmpAmt = (tmpAmt - billCreditAmtP);
							netAmt = netAmt - billCreditAmtP;
						}
					}

					// tmpAmt += amt;
					netAmt = origAmt;
					tmpAmt += amt; //used to be netAmt

					if (discAmt > 0) {
						netAmt -= discAmt;
						tmpAmt -= discAmt;
					}

					if (!isEmpty(objBillsData[billId].num)) {
						StrdObj.RfrdDocInf.Nb = objBillsData[billId].num;
					} else if (!isEmpty(objBillsData[billId].trnxnumber)) {
						StrdObj.RfrdDocInf.Nb = objBillsData[billId].trnxnumber;
					}

					var invoiceDate = objBillsData[billId].dte;
					StrdObj.RfrdDocInf.RltdDt = formatDate(nlapiStringToDate(invoiceDate));
					StrdObj.RfrdDocAmt = {};
					StrdObj.RfrdDocAmt.DuePyblAmt = {};
					StrdObj.RfrdDocAmt.DscntApldAmt = {};
					StrdObj.RfrdDocAmt.RmtdAmt = {};
					StrdObj.RfrdDocAmt.DuePyblAmt.value = origAmt.toFixed(2);

					if (discAmt == 0) discAmt = '';
					else discAmt = discAmt.toFixed(2);

					StrdObj.RfrdDocAmt.DscntApldAmt.value = discAmt;
					StrdObj.RfrdDocAmt.RmtdAmt.value = netAmt.toFixed(2);

					StrdObj.RfrdDocAmt.DuePyblAmt.Ccy = symbol;
					StrdObj.RfrdDocAmt.DscntApldAmt.Ccy = symbol;
					StrdObj.RfrdDocAmt.RmtdAmt.Ccy = symbol;

					//Add CDtrRefInf
					StrdObj.CdtrRefInf = {};
					StrdObj.CdtrRefInf.Tp = {};
					StrdObj.CdtrRefInf.CdOrPrtry = {};
					StrdObj.CdtrRefInf.CdOrPrtry.Cd = 'PUOR';

					Strd.push(StrdObj);

					if (!isEmpty(arrBillCredits[billId])) {
						var arrBC = arrBillCredits[billId];

						for (bc in arrBC) {
							var billCreditAmtP = getFloatVal(arrBC[bc].bcamt);
							var billCreditAmt = billCreditAmtP;

							tmpAmt = tmpAmt - billCreditAmtP;
							netAmt = netAmt - billCreditAmtP;

							var StrdObj = {};
							StrdObj.RfrdDocInf = {};
							StrdObj.RfrdDocInf.Tp = {};
							StrdObj.RfrdDocInf.Tp.CdOrPrtry = {};
							StrdObj.RfrdDocInf.Tp.CdOrPrtry.Cd = 'CREN'; //Hardcoded?

							var bcNum = arrBC[bc].bcnum;

							if (!isEmpty(bcNum)) StrdObj.RfrdDocInf.Nb = bcNum;
							else if (!isEmpty(arrBillCredits[billId].bcmemo)) {
								StrdObj.RfrdDocInf.Nb = arrBillCredits[billId].bcmemo;
							}

							var invoiceDate = objBillsData[billId].dte;
							StrdObj.RfrdDocInf.RltdDt = formatDate(nlapiStringToDate(arrBC[bc].bcdate));

							StrdObj.RfrdDocAmt = {};
							StrdObj.RfrdDocAmt.DuePyblAmt = {};
							StrdObj.RfrdDocAmt.DscntApldAmt = {};
							StrdObj.RfrdDocAmt.CdtNoteAmt = {};

							StrdObj.RfrdDocAmt.DuePyblAmt.value = billCreditAmt.toFixed(2);
							if (discAmt == 0) discAmt = '';
							else discAmt = discAmt.toFixed(2);

							StrdObj.RfrdDocAmt.DscntApldAmt.value = discAmt;
							StrdObj.RfrdDocAmt.CdtNoteAmt.value = billCreditAmt.toFixed(2);

							StrdObj.RfrdDocAmt.DuePyblAmt.Ccy = symbol;
							StrdObj.RfrdDocAmt.DscntApldAmt.Ccy = symbol;
							StrdObj.RfrdDocAmt.CdtNoteAmt.Ccy = symbol;

							Strd.push(StrdObj);
						}
					}
				}

				cdtTrfTxInfObj.ChrgBr = CHRBR; //hardcded

				cdtTrfTxInfObj.CdtrAgt = {};
				cdtTrfTxInfObj.CdtrAgt.FinInstnId = {};
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.BIC = objVendor.recbankprimid; //recpartyaccount
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.ClrSysMmbId = {};
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.ClrSysMmbId.MmbId = objVendor.bankid; //recbankprimid;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.Nm = objVendor.vbankname;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr = {};
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.Ctry = countryCodeMapping[objVendor.vbankcountry];
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.AdrLine = objVendor.vbankaddrs1;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.StrtNum = objVendor.vbankaddrs1;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.PstCd = objVendor.vbankzip;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.TwnNm = objVendor.vbankcity;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.BldgNb = ''; //objVendor.vendoraddrs1; //'Where to map';

				cdtTrfTxInfObj.Cdtr = {};
				cdtTrfTxInfObj.Cdtr.Nm = objVendor.vendorname; //addTextNodeFromParentNode(xmlDoc, cdtrCdtTrfTxInf, 'Nm', );;
				cdtTrfTxInfObj.Cdtr.PstlAdr = {};
				cdtTrfTxInfObj.Cdtr.PstlAdr.StrtNm = objVendor.vendoraddrs1; //'What to map StrtNm';
				cdtTrfTxInfObj.Cdtr.PstlAdr.BldgNb = objVendor.vendoraddrs2 || '';
				cdtTrfTxInfObj.Cdtr.PstlAdr.PstCd = objVendor.vendorpostal;
				cdtTrfTxInfObj.Cdtr.PstlAdr.TwnNm = objVendor.vendorcity;
				cdtTrfTxInfObj.Cdtr.PstlAdr.Ctry = countryCodeMapping[objVendor.vendorcountrycode];

				cdtTrfTxInfObj.CdtrAcct = {};
				cdtTrfTxInfObj.CdtrAcct.Id = {};
				cdtTrfTxInfObj.CdtrAcct.Id.Othr = {};
				cdtTrfTxInfObj.CdtrAcct.Id.Othr.Id = objVendor.recpartyaccount;

				cdtTrfTxInfObj.RgltryRptg = {};
				cdtTrfTxInfObj.RgltryRptg.Dtls = {};
				cdtTrfTxInfObj.RgltryRptg.Dtls.Inf = objVendor.custentity_ica_vendor_bank_instructions;

				cdtTrfTxInfObj.RmtInf = {};
				cdtTrfTxInfObj.RmtInf.Ustrd = refnum;
				cdtTrfTxInfObj.RmtInf.Strd = Strd; //Array

				CdtTrfTxInf.push(cdtTrfTxInfObj);
			}
		}
	}

	objects.CdtTrfTxInf = CdtTrfTxInf;
	dLog('objects', JSON.stringify(objects));

	//fileId should always return a value. Otherwise, tmpl isn't bundled.
	var fileId = nlapiSearchRecord('file', null, [['name', 'is', '_tmpl_ica_iso_20022.xml']], []);
	if (fileId != null) {
		fileId = fileId[0].getId();
	}

	var tmplFile = nlapiLoadFile(fileId);

	//Apply data on template
	var template = Handlebars.compile(tmplFile.getValue()); //getContents;
	var xmlDoc = template(objects);

	dLog('xmlDoc', xmlDoc);

	//Handlebars.
	return xmlDoc;
}

function createAUACHXMLDoc(objAcctMapping) {
	var arrTempBillIds = [];
	var arrBillCRIds = [];
	var arrBillAmt = [];
	var arrBillAmtOrig = [];
	var arrBillDiscAmt = [];
	var arrBillPayInfoCtr = [];
	var arrBillPayInfoSum = [];
	var arrGrpHdrNbOfTxs = [];
	var arrPmtInfNbOfTxs = [];
	var arrBillIds = [];
	var grpHdrNbOfTxs = 0;
	var grpHdrCtrlSum = 0;
	var arrPayeeIds = [];
	var _currencies = getCurrencies();

	for (x in arrBillsProcessed) {
		var billId = arrBillsProcessed[x].id;
		var billPaymentId = arrBillsProcessed[x].payment;

		dLog('createAUACHXMLDoc', 'Bill info = ' + JSON.stringify(arrBillsProcessed[x]));
		if (!isEmpty(billPaymentId) && billPaymentId != 'XXXNONEXXX' && billPaymentId != 'CREDIT') {
			if (billPaymentId != 'CREDIT') arrTempBillIds.push(billId);

			var payMethod = arrBillsProcessed[x].paymethod;
			var paymentId = arrBillsProcessed[x].payment;
			var payeeId = arrBillsProcessed[x].payeeid;

			arrBillAmtOrig[billId] = arrBillsProcessed[x].origamt;
			// arrBillAmt[billId] = arrBillsProcessed[x].pay;
			arrBillAmt[billId] = arrBillsProcessed[x].payamt;
			arrBillDiscAmt[billId] = arrBillsProcessed[x].discamt;

			var ndx = payMethod + '@@' + paymentId;

			if (arrBillPayInfoCtr[payMethod] == null) arrBillPayInfoCtr[payMethod] = 0;
			if (arrBillPayInfoSum[payMethod] == null) arrBillPayInfoSum[payMethod] = 0;
			if (arrPmtInfNbOfTxs[ndx] == null) arrPmtInfNbOfTxs[ndx] = 0;

			if (paymentId && arrGrpHdrNbOfTxs[paymentId] == null) grpHdrNbOfTxs++;

			arrPmtInfNbOfTxs[ndx]++;
			arrBillPayInfoCtr[payMethod]++;
			arrBillPayInfoSum[payMethod] += getFloatVal(arrBillsProcessed[x].payamt);
			arrGrpHdrNbOfTxs[paymentId] = paymentId;

			grpHdrCtrlSum += getFloatVal(arrBillsProcessed[x].payamt);
		}

		if (billPaymentId == 'CREDIT') arrBillCRIds.push(billId);
	}

	var arrBillIds = [];
	var arrBillIds2 = [];
	var arrBillIds3 = [];
	var arrBillIds4 = [];
	var arrBillIds5 = [];

	for (vx in arrTempBillIds) {
		var isBC = false;

		for (var x in arrBillCRIds) {
			if (arrTempBillIds[vx] == arrBillCRIds[x]) {
				isBC = true;
				break;
			}
		}

		if (!isBC) {
			arrBillIds.push(arrTempBillIds[vx]);
			arrBillIds2.push(arrTempBillIds[vx]);
			arrBillIds3.push(arrTempBillIds[vx]);
			arrBillIds4.push(arrTempBillIds[vx]);
			arrBillIds5.push(arrTempBillIds[vx]);
		}
	}

	var arrBillCredits = getBillCredit(arrBillIds);
	dLog('arrBillIds', JSON.stringify(arrBillIds));
	dLog('arrBillCredits', JSON.stringify(arrBillCredits));
	var objBillsData = getBillData(arrBillIds2);
	var arrBillPO = getPOMap(arrBillIds3);
	var arrVendorBills = getPayeeBillsByPayMethod(arrBillIds4);
	var arrVendorBillsCurr = getPayeeBillsCurrency(arrBillIds5);
	var nsAcctSub = !isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('subsidiary', 'CUSTRECORD_ACCT_MAP_NETSUITE_ACCOUNT')) ? objAcctMapping[0].getValue('subsidiary', 'CUSTRECORD_ACCT_MAP_NETSUITE_ACCOUNT') : '';
	var objVDCRecResults = getVendorDAC_CCRPaymentRec(nsAcctSub);
	dLog('objVDCRecResults', JSON.stringify(objVDCRecResults));

	dLog('objAcctMapping', JSON.stringify(objAcctMapping));

	//Gather data.
	var CdtTrfTxInf = [];

	var objects = {
		MsgId: 'TBD',
		CreDtTm: 'Test',
		Authstn: {
			Cd: '',
		},
		NbOfTxs: '2',
		CtrlSum: '2000',
		InitgPty: {
			Id: {
				OrgId: {
					Othr: {
						Id: '',
					},
				},
			},
		},
		PmtInfId: 'PmtInfId',
		PmtMtd: 'PmtMtd',
		PmtTpInf: {
			SvcLvl: {
				Cd: 'This is CD',
			},
		},
		ReqdExctnDt: 'ReqdExctnDt',
		Dbtr: {
			Nm: 'This is Nm',
			PstlAdr: {},
		},
		DbtrAcct: {
			Id: {
				Othr: {
					Id: 'DbtrAcct.Id.Othr.Id',
				},
			},
		},
		DbtrAgt: {
			FinInstnId: {
				BIC: 'BIC',
				PstlAdr: {
					Ctry: 'Ctry',
				},
			},
		},
		CdtTrfTxInf: CdtTrfTxInf,
	};

	for (x in arrVendorBills) {
		var payeeId = x.split('X@X')[1];
		arrPayeeIds.push(payeeId);
	}

	var arrVendors = getEntityData(arrPayeeIds);

	var today = new Date();
	var bpmdate = BPM_DATE;
	var d = nlapiStringToDate(bpmdate, 'datetime');

	var fileCtrlNumber = Date.create().format('{yy}{MM}{dd}{mm}{ss}');
	objects.MsgId = pad(fileCtrlNumber, 4);
	objects.CreDtTm = moment(d).format('YYYY-MM-DDThh:mm:ss') || today.format('{yyyy}-{MM}-{dd}T{hh}:{mm}:{ss}');
	objects.Authstn.Cd = 'AUTH';
	objects.NbOfTxs = grpHdrNbOfTxs;
	objects.CtrlSum = grpHdrCtrlSum.toFixed(2);

	if (objects.CtrlSum == '0.00') {
		dLog('CtrlSum is 0.00, this should not happen. Returning empty file', objects.CtrlSum);
		return '';
	}

	if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ceo_company_id'))) {
		objects.InitgPty.Id.OrgId.Othr.Id = objAcctMapping[0].getValue('custrecord_acct_map_ceo_company_id');
	}

	var pmtInfID = '';
	for (x in arrBillPayInfoCtr) {
		objects.PmtInfId = fileCtrlNumber;
		var paymentMethod = x;
		objects.PmtMtd = 'TRF';

		objects.PmtTpInf.SvcLvl.Cd = paymentMethod == 'AUCR' ? 'NURG' : 'URGP';
		objects.ReqdExctnDt = moment(d).format('YYYY-MM-DD') || today.format('{yyyy}-{MM}-{dd}');

		if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_companyname'))) objects.Dbtr.Nm = objVDCRecResults[0].getValue('custrecord_companyname');

		//PstlAdr
		var country = !isEmpty(objVDCRecResults) ? objVDCRecResults[0].getValue('custrecord_compcountrycode') : '';
		if (
			(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_comppostcode'))) ||
			(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compcity'))) ||
			(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compstateprov'))) ||
			(!isEmpty(objVDCRecResults) && objVDCRecResults[0].getValue('custrecord_compcountrycode')) ||
			(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compadd1')))
		) {
			if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_comppostcode'))) {
				objects.Dbtr.PstlAdr.PstCd = '<PstCd>' + objVDCRecResults[0].getValue('custrecord_comppostcode') + '</PstCd>';
			}
			// addTextNodeFromParentNode(xmlDoc, pstlAdr, 'PstCd', objVDCRecResults[0].getValue('custrecord_comppostcode'));

			if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compcity'))) {
				objects.Dbtr.PstlAdr.TwnNm = '<TwnNm>' + objVDCRecResults[0].getValue('custrecord_compcity') + '</TwnNm>';
			}
			// addTextNodeFromParentNode(xmlDoc, pstlAdr, 'TwnNm', objVDCRecResults[0].getValue('custrecord_compcity'));

			// addTextNodeFromParentNode(xmlDoc, pstlAdr, 'Ctry', country);
			if (country) {
				objects.Dbtr.PstlAdr.Ctry = '<Ctry>' + country + '</Ctry>';
			}

			if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compadd1'))) {
				objects.Dbtr.PstlAdr.StrtNm = '<StrtNm>' + objVDCRecResults[0].getValue('custrecord_compadd1') + '</StrtNm>';
			}
			if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compadd2'))) {
				objects.Dbtr.PstlAdr.BldgNb = '<BldgNb>' + objVDCRecResults[0].getValue('custrecord_compadd2') + '</BldgNb>';
			}

			// addTextNodeFromParentNode(xmlDoc, pstlAdr, 'AdrLine', objVDCRecResults[0].getValue('custrecord_compadd1'));
			// objects.Dbtr.PstlAdr.BldgNb = '2'; not used
		}

		//DbtrAcct
		if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_origin_acc'))) objects.DbtrAcct.Id.Othr.Id = objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_origin_acc');

		//DbtrAgt
		if ((!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id'))) || !isEmpty(country)) {
			if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id'))) {
				objects.DbtrAgt.FinInstnId.BIC = objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id');
			}
			objects.DbtrAgt.FinInstnId.PstlAdr.Ctry = country;
		}

		//CdtTrfTxInf loop starts here.

		if (SINGLEBILLPYMTS == 'T') {
			dAudit('Create Single Bill Payments here.', JSON.stringify(arrBillsProcessed));

			for (var i = 0; i < arrBillsProcessed.length; i++) {
				var billPayment = arrBillsProcessed[i];
				dAudit('Create Single Bill Payments here.', JSON.stringify(arrBillsProcessed));

				if (billPayment.payment == 'CREDIT') {
					continue;
				}

				var symbol = '';

				try {
					symbol = _.find(_currencies, { internalid: String(billPayment.currid) }).symbol;
				} catch (e) {}

				var objVendor = arrVendors[billPayment.payeeid];
				if (!objVendor) objVendor = _.find(arrVendors, { internalid: String(billPayment.payeeid) });
				var cdtTrfTxInfObj = {};
				cdtTrfTxInfObj.PmtId = {};

				// var refnum = billPayment.billnum; //arrBillPaymentMap[billPayment.payeeid];
				var refnum = billPayment.refnum; //arrBillPaymentMap[billPayment.payeeid];
				pmtInfID = billPayment.refnum;
				var instrId = '';
				if (refnum.length > 12) {
					instrId = pz(refnum.substring(refnum.length - 12, refnum.length), 12);
				} else {
					instrId = pz(refnum, 12);
				}
				refnum = billPayment.billnum; //Overwrite endToendID
				var endToEndId = refnum;
				if (refnum.length > 18) {
					endToEndId = refnum.substr(0, 18);
				}

				cdtTrfTxInfObj.PmtId.InstrId = instrId;
				cdtTrfTxInfObj.PmtId.EndToEndId = endToEndId;
				cdtTrfTxInfObj.Amt = {};
				cdtTrfTxInfObj.Amt.value = billPayment.payamt; //amt.toFixed(2);
				cdtTrfTxInfObj.Amt.Ccy = symbol;
				cdtTrfTxInfObj.ChrgBr = billPayment.paymethod == 'AUCR' ? 'CRED' : 'DEBT';

				cdtTrfTxInfObj.CdtrAgt = {};
				cdtTrfTxInfObj.CdtrAgt.FinInstnId = {};
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.BIC = objVendor.recbankprimid;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.ClrSysMmbId = {};
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.ClrSysMmbId.MmbId = objVendor.bankid;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.Nm = objVendor.vbankname;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr = {};
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.Ctry = countryCodeMapping[objVendor.vbankcountry];
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.AdrLine = objVendor.vbankaddrs1;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.StrtNum = objVendor.vbankaddrs1;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.PstCd = objVendor.vbankzip;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.TwnNm = objVendor.vbankcity;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.BldgNb = '';

				cdtTrfTxInfObj.Cdtr = {};
				cdtTrfTxInfObj.Cdtr.Nm = objVendor.vendorname;
				cdtTrfTxInfObj.Cdtr.PstlAdr = {};
				cdtTrfTxInfObj.Cdtr.PstlAdr.StrtNm = objVendor.vendoraddrs1;
				cdtTrfTxInfObj.Cdtr.PstlAdr.BldgNb = objVendor.vendoraddrs2 || '';
				cdtTrfTxInfObj.Cdtr.PstlAdr.PstCd = objVendor.vendorpostal;
				cdtTrfTxInfObj.Cdtr.PstlAdr.TwnNm = objVendor.vendorcity;
				cdtTrfTxInfObj.Cdtr.PstlAdr.Ctry = countryCodeMapping[objVendor.vendorcountrycode];

				cdtTrfTxInfObj.CdtrAcct = {};
				cdtTrfTxInfObj.CdtrAcct.Id = {};
				cdtTrfTxInfObj.CdtrAcct.Id.Othr = {};
				cdtTrfTxInfObj.CdtrAcct.Id.Othr.Id = objVendor.recpartyaccount;

				cdtTrfTxInfObj.RltdAmtInf = {};
				cdtTrfTxInfObj.RltdAmtInf.RmtLctnMtd = objVendor.pmp_dac_contactname || '';
				cdtTrfTxInfObj.RltdAmtInf.RmtLctnElctrncAdr = objVendor.pmp_dac_emailaddress || '';
				cdtTrfTxInfObj.RmtInf = {};
				cdtTrfTxInfObj.RmtInf.Ustrd = refnum;
				// cdtTrfTxInfObj.RmtInf.Strd = Strd;

				CdtTrfTxInf.push(cdtTrfTxInfObj);
			}
		} else {
			dAudit('arrVendorBills', arrVendorBills);
			var refnum = '';
			var currency = '';
			var symbol = '';

			for (v in arrVendorBills) {
				var arrPayeeInfo = v.split('X@X');
				var payeeId = arrPayeeInfo[1];

				//var objVendor=arrVendors[payeeId];
				       var objVendor = _.find(arrVendors, { internalid: String(payeeId)});
				// var objVendor = _.find(arrVendors, { internalid: String(payeeId), paymentmethod: String(paymentMethod) })[0];
dAudit('objVendor-new', objVendor);
				if (isEmpty(objVendor)) continue;

				var pmtMethod = objVendor.paymentmethod;

				if (paymentMethod != pmtMethod) continue;

				var arrBills = arrVendorBills[paymentMethod + 'X@X' + payeeId];
				dLog('arrBills', JSON.stringify(arrBills));
				var tmpAmt = 0;

				var numberOfBills = _.size(arrBills);
				for (by in arrBills) {
					var billId = arrBills[by];
					refnum = _.find(arrBillsProcessed, { id: String(billId) }).refnum;
					pmtInfID = refnum;
					currency = _.find(arrBillsProcessed, { id: String(billId) }).currid;
					subtext = _.find(arrBillsProcessed, { id: String(billId) }).subtext;
					billnum = _.find(arrBillsProcessed, { id: String(billId) }).billnum;

					try {
						symbol = _.find(_currencies, { internalid: String(currency) }).symbol;
					} catch (e) {}
					dLog('createAUACHXMLDocrefnum', JSON.stringify(refnum));

					var netAmt = 0;
					var origAmt = getFloatVal(arrBillAmtOrig[billId]);
					var amt = getFloatVal(arrBillAmt[billId]);

					var discAmt = !isEmpty(arrBillDiscAmt[billId]) ? getFloatVal(arrBillDiscAmt[billId]) : 0;

					dLog(
						'amounts',
						JSON.stringify({
							netAmt: netAmt,
							origAmt: origAmt,
							amt: amt,
							discAmt: discAmt,
						})
					);

					netAmt = origAmt;
					tmpAmt += amt; //used to be netAmt

					if (discAmt > 0) {
						netAmt -= discAmt;
						tmpAmt -= discAmt;
					}

					if (!isEmpty(arrBillCredits[billId])) {
						var arrBC = arrBillCredits[billId];

						dLog('arrBC in arrBills', JSON.stringify(arrBC));

						for (bc in arrBC) {
							var billCreditAmtP = getFloatVal(arrBC[bc].bcamt);
							var billCreditAmt = billCreditAmtP * -1;

							// tmpAmt = (tmpAmt - billCreditAmtP);
							netAmt = netAmt - billCreditAmtP;
						}
					}
				}

				var cdtTrfTxInfObj = {};
				cdtTrfTxInfObj.PmtId = {};

				var refnum = arrBillPaymentMap[payeeId];
				var instrId = '';
				if (refnum.length > 12) {
					instrId = pz(refnum.substring(refnum.length - 12, refnum.length), 12);
				} else {
					instrId = pz(refnum, 12);
				}
				var endToEndId = billnum.substr(0, 18);
				if (numberOfBills > 1) {
					endToEndId = subtext.substr(0, 18);
				}
				//refnum

				cdtTrfTxInfObj.PmtId.InstrId = instrId;
				cdtTrfTxInfObj.PmtId.EndToEndId = endToEndId;
				cdtTrfTxInfObj.Amt = {};
				cdtTrfTxInfObj.Amt.value = tmpAmt.toFixed(2); //amt.toFixed(2);
				cdtTrfTxInfObj.Amt.Ccy = symbol;
				cdtTrfTxInfObj.ChrgBr = paymentMethod == 'AUCR' ? 'CRED' : 'DEBT';

				tmpAmt = 0; // need to initialize back to 0

				var Strd = [];

				for (y in arrBills) {
					var billId = arrBills[y];
					var StrdObj = {};
					StrdObj.RfrdDocInf = {};
					StrdObj.RfrdDocInf.Tp = {};
					StrdObj.RfrdDocInf.Tp.CdOrPrtry = {};
					StrdObj.RfrdDocInf.Tp.CdOrPrtry.Cd = 'CINV'; //Hardcoded?

					var netAmt = 0;
					var origAmt = getFloatVal(arrBillAmtOrig[billId]);
					var amt = getFloatVal(arrBillAmt[billId]);

					var discAmt = !isEmpty(arrBillDiscAmt[billId]) ? getFloatVal(arrBillDiscAmt[billId]) : 0;

					dLog('billId before', billId);
					dLog('arrBC in y.arrBills before', JSON.stringify(arrBillCredits));

					if (!isEmpty(arrBillCredits[billId])) {
						var arrBC = arrBillCredits[billId];

						dLog('arrBC in y.arrBills', JSON.stringify(arrBC));

						for (bc in arrBC) {
							var billCreditAmtP = getFloatVal(arrBC[bc].bcamt);
							var billCreditAmt = billCreditAmtP * -1;

							// tmpAmt = (tmpAmt - billCreditAmtP);
							netAmt = netAmt - billCreditAmtP;
						}
					}

					// tmpAmt += amt;
					netAmt = origAmt;
					tmpAmt += amt; //used to be netAmt

					if (discAmt > 0) {
						netAmt -= discAmt;
						tmpAmt -= discAmt;
					}

					dLog('createAUACHXMLDoc. objBillsData', JSON.stringify(objBillsData[billId]));

					if (!isEmpty(objBillsData[billId].num)) {
						StrdObj.RfrdDocInf.Nb = objBillsData[billId].num;
					} else if (!isEmpty(objBillsData[billId].trnxnumber)) {
						StrdObj.RfrdDocInf.Nb = objBillsData[billId].trnxnumber;
					}

					var invoiceDate = objBillsData[billId].dte;
					StrdObj.RfrdDocInf.RltdDt = formatDate(nlapiStringToDate(invoiceDate));
					StrdObj.RfrdDocAmt = {};
					StrdObj.RfrdDocAmt.DuePyblAmt = {};
					StrdObj.RfrdDocAmt.DscntApldAmt = {};
					StrdObj.RfrdDocAmt.RmtdAmt = {};
					StrdObj.RfrdDocAmt.DuePyblAmt.value = origAmt.toFixed(2);

					if (discAmt == 0) discAmt = '';
					else discAmt = discAmt.toFixed(2);

					StrdObj.RfrdDocAmt.DscntApldAmt.value = discAmt;
					StrdObj.RfrdDocAmt.RmtdAmt.value = netAmt.toFixed(2);

					StrdObj.RfrdDocAmt.DuePyblAmt.Ccy = symbol;
					StrdObj.RfrdDocAmt.DscntApldAmt.Ccy = symbol;
					StrdObj.RfrdDocAmt.RmtdAmt.Ccy = symbol;

					//Add CDtrRefInf
					StrdObj.CdtrRefInf = {};
					StrdObj.CdtrRefInf.Tp = {};
					StrdObj.CdtrRefInf.CdOrPrtry = {};
					StrdObj.CdtrRefInf.CdOrPrtry.Cd = 'PUOR';

					Strd.push(StrdObj);

					if (!isEmpty(arrBillCredits[billId])) {
						var arrBC = arrBillCredits[billId];

						for (bc in arrBC) {
							var billCreditAmtP = getFloatVal(arrBC[bc].bcamt);
							var billCreditAmt = billCreditAmtP;

							tmpAmt = tmpAmt - billCreditAmtP;
							netAmt = netAmt - billCreditAmtP;

							var StrdObj = {};
							StrdObj.RfrdDocInf = {};
							StrdObj.RfrdDocInf.Tp = {};
							StrdObj.RfrdDocInf.Tp.CdOrPrtry = {};
							StrdObj.RfrdDocInf.Tp.CdOrPrtry.Cd = 'CREN'; //Hardcoded?

							var bcNum = arrBC[bc].bcnum;
							dLog('createJPMXMLDoc', 'VC number : ' + bcNum);

							if (!isEmpty(bcNum)) StrdObj.RfrdDocInf.Nb = bcNum;
							else if (!isEmpty(arrBillCredits[billId].bcmemo)) {
								StrdObj.RfrdDocInf.Nb = arrBillCredits[billId].bcmemo;
							}

							var invoiceDate = objBillsData[billId].dte;
							StrdObj.RfrdDocInf.RltdDt = formatDate(nlapiStringToDate(arrBC[bc].bcdate));

							StrdObj.RfrdDocAmt = {};
							StrdObj.RfrdDocAmt.DuePyblAmt = {};
							StrdObj.RfrdDocAmt.DscntApldAmt = {};
							StrdObj.RfrdDocAmt.CdtNoteAmt = {};

							StrdObj.RfrdDocAmt.DuePyblAmt.value = billCreditAmt.toFixed(2);
							if (discAmt == 0) discAmt = '';
							else discAmt = discAmt.toFixed(2);

							StrdObj.RfrdDocAmt.DscntApldAmt.value = discAmt;
							StrdObj.RfrdDocAmt.CdtNoteAmt.value = billCreditAmt.toFixed(2);

							StrdObj.RfrdDocAmt.DuePyblAmt.Ccy = symbol;
							StrdObj.RfrdDocAmt.DscntApldAmt.Ccy = symbol;
							StrdObj.RfrdDocAmt.CdtNoteAmt.Ccy = symbol;

							Strd.push(StrdObj);
						}
					}
				}

				cdtTrfTxInfObj.CdtrAgt = {};
				cdtTrfTxInfObj.CdtrAgt.FinInstnId = {};
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.BIC = objVendor.recbankprimid;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.ClrSysMmbId = {};
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.ClrSysMmbId.MmbId = objVendor.bankid;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.Nm = objVendor.vbankname;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr = {};
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.Ctry = countryCodeMapping[objVendor.vbankcountry];
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.AdrLine = objVendor.vbankaddrs1;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.StrtNum = objVendor.vbankaddrs1;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.PstCd = objVendor.vbankzip;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.TwnNm = objVendor.vbankcity;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.BldgNb = '';

				cdtTrfTxInfObj.Cdtr = {};
				cdtTrfTxInfObj.Cdtr.Nm = objVendor.vendorname;
				cdtTrfTxInfObj.Cdtr.PstlAdr = {};
				cdtTrfTxInfObj.Cdtr.PstlAdr.StrtNm = objVendor.vendoraddrs1;
				cdtTrfTxInfObj.Cdtr.PstlAdr.BldgNb = objVendor.vendoraddrs2 || '';
				cdtTrfTxInfObj.Cdtr.PstlAdr.PstCd = objVendor.vendorpostal;
				cdtTrfTxInfObj.Cdtr.PstlAdr.TwnNm = objVendor.vendorcity;
				cdtTrfTxInfObj.Cdtr.PstlAdr.Ctry = countryCodeMapping[objVendor.vendorcountrycode];

				cdtTrfTxInfObj.CdtrAcct = {};
				cdtTrfTxInfObj.CdtrAcct.Id = {};
				cdtTrfTxInfObj.CdtrAcct.Id.Othr = {};
				cdtTrfTxInfObj.CdtrAcct.Id.Othr.Id = objVendor.recpartyaccount;

				cdtTrfTxInfObj.RltdAmtInf = {};
				cdtTrfTxInfObj.RltdAmtInf.RmtLctnMtd = objVendor.pmp_dac_contactname || '';
				cdtTrfTxInfObj.RltdAmtInf.RmtLctnElctrncAdr = objVendor.pmp_dac_emailaddress || '';
				cdtTrfTxInfObj.RmtInf = {};
				cdtTrfTxInfObj.RmtInf.Ustrd = refnum;
				cdtTrfTxInfObj.RmtInf.Strd = Strd;

				CdtTrfTxInf.push(cdtTrfTxInfObj);
			}
		}
	}

	objects.PmtInfId = pmtInfID;
	objects.CdtTrfTxInf = CdtTrfTxInf;

	dLog('objects', JSON.stringify(objects));

	var fileId = nlapiSearchRecord('file', null, [['name', 'is', 'ica_au_ach.xml']], []);
	if (fileId != null) {
		fileId = fileId[0].getId();
	}

	var tmplFile = nlapiLoadFile(fileId);

	var template = Handlebars.compile(tmplFile.getValue());
	var xmlDoc = template(objects);

	dLog('xmlDoc', xmlDoc);
	return xmlDoc;
}

function createUSACHXMLDoc(objAcctMapping) {
	var arrTempBillIds = [];
	var arrBillCRIds = [];
	var arrBillAmt = [];
	var arrBillAmtOrig = [];
	var arrBillDiscAmt = [];
	var arrBillPayInfoCtr = [];
	var arrBillPayInfoSum = [];
	var arrGrpHdrNbOfTxs = [];
	var arrPmtInfNbOfTxs = [];
	var arrBillIds = [];
	var grpHdrNbOfTxs = 0;
	var grpHdrCtrlSum = 0;
	var arrPayeeIds = [];
	var _currencies = getCurrencies();

	for (x in arrBillsProcessed) {
		var billId = arrBillsProcessed[x].id;
		var billPaymentId = arrBillsProcessed[x].payment;

		dLog('createUSACHXMLDoc', 'Bill info = ' + JSON.stringify(arrBillsProcessed[x]));
		if (!isEmpty(billPaymentId) && billPaymentId != 'XXXNONEXXX' && billPaymentId != 'CREDIT') {
			if (billPaymentId != 'CREDIT') arrTempBillIds.push(billId);

			var payMethod = arrBillsProcessed[x].paymethod;
			var paymentId = arrBillsProcessed[x].payment;
			var payeeId = arrBillsProcessed[x].payeeid;

			arrBillAmtOrig[billId] = arrBillsProcessed[x].origamt;
			// arrBillAmt[billId] = arrBillsProcessed[x].pay;
			arrBillAmt[billId] = arrBillsProcessed[x].payamt;
			arrBillDiscAmt[billId] = arrBillsProcessed[x].discamt;

			var ndx = payMethod + '@@' + paymentId;

			if (arrBillPayInfoCtr[payMethod] == null) arrBillPayInfoCtr[payMethod] = 0;
			if (arrBillPayInfoSum[payMethod] == null) arrBillPayInfoSum[payMethod] = 0;
			if (arrPmtInfNbOfTxs[ndx] == null) arrPmtInfNbOfTxs[ndx] = 0;

			if (paymentId && arrGrpHdrNbOfTxs[paymentId] == null) grpHdrNbOfTxs++;

			arrPmtInfNbOfTxs[ndx]++;
			arrBillPayInfoCtr[payMethod]++;
			arrBillPayInfoSum[payMethod] += getFloatVal(arrBillsProcessed[x].payamt);
			arrGrpHdrNbOfTxs[paymentId] = paymentId;

			grpHdrCtrlSum += getFloatVal(arrBillsProcessed[x].payamt);
		}

		if (billPaymentId == 'CREDIT') arrBillCRIds.push(billId);
	}

	var arrBillIds = [];
	var arrBillIds2 = [];
	var arrBillIds3 = [];
	var arrBillIds4 = [];
	var arrBillIds5 = [];

	for (vx in arrTempBillIds) {
		var isBC = false;

		for (var x in arrBillCRIds) {
			if (arrTempBillIds[vx] == arrBillCRIds[x]) {
				isBC = true;
				break;
			}
		}

		if (!isBC) {
			arrBillIds.push(arrTempBillIds[vx]);
			arrBillIds2.push(arrTempBillIds[vx]);
			arrBillIds3.push(arrTempBillIds[vx]);
			arrBillIds4.push(arrTempBillIds[vx]);
			arrBillIds5.push(arrTempBillIds[vx]);
		}
	}

	var arrBillCredits = getBillCredit(arrBillIds);
	var objBillsData = getBillData(arrBillIds2);
	var arrBillPO = getPOMap(arrBillIds3);
	var arrVendorBills = getPayeeBillsByPayMethod(arrBillIds4);
	var arrVendorBillsCurr = getPayeeBillsCurrency(arrBillIds5);
	var nsAcctSub = !isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('subsidiary', 'CUSTRECORD_ACCT_MAP_NETSUITE_ACCOUNT')) ? objAcctMapping[0].getValue('subsidiary', 'CUSTRECORD_ACCT_MAP_NETSUITE_ACCOUNT') : '';
	var objVDCRecResults = getVendorDAC_CCRPaymentRec(nsAcctSub);
	dLog('objVDCRecResults', JSON.stringify(objVDCRecResults));
	dLog('objAcctMapping', JSON.stringify(objAcctMapping));

	//Gather data.
	var CdtTrfTxInf = [];

	var objects = {
		MsgId: 'TBD',
		CreDtTm: 'Test',
		Authstn: {
			Cd: '',
		},
		NbOfTxs: '2',
		CtrlSum: '2000',
		InitgPty: {
			Id: {
				OrgId: {
					Othr: {
						Id: '',
					},
				},
			},
		},
		PmtInfId: 'PmtInfId',
		PmtMtd: 'PmtMtd',
		PmtTpInf: {
			SvcLvl: {
				Cd: 'This is CD',
			},
		},
		ReqdExctnDt: 'ReqdExctnDt',
		Dbtr: {
			Nm: 'This is Nm',
			PstlAdr: {
				StrtNm: '',
				BldgNb: '',
				PstCd: '',
				TwnNm: '',
				CtrySubDvsn: '',
				Ctry: '',
			},
			Id: {
				Othr: {
					Id: 'Dbtr.Id.Othr.Id',
				},
			},
		},
		DbtrAcct: {
			Id: {
				Othr: {
					Id: 'DbtrAcct.Id.Othr.Id',
				},
			},
			PstlAdr: {
				StrtNm: '',
				BldgNb: '',
				PstCd: '',
				TwnNm: '',
				CtrySubDvsn: '',
				Ctry: '',
			},
		},
		DbtrAgt: {
			FinInstnId: {
				BIC: 'BIC',
				PstlAdr: {
					StrtNm: '',
					BldgNb: '',
					PstCd: '',
					TwnNm: '',
					CtrySubDvsn: '',
					Ctry: '',
				},
			},
		},
		CdtTrfTxInf: CdtTrfTxInf,
	};

	for (x in arrVendorBills) {
		var payeeId = x.split('X@X')[1];
		arrPayeeIds.push(payeeId);
	}

	var arrVendors = getEntityData(arrPayeeIds);

	var today = new Date();
	var bpmdate = BPM_DATE;
	var d = nlapiStringToDate(bpmdate, 'datetime');

	var fileCtrlNumber = Date.create().format('{yy}{MM}{dd}{mm}{ss}');
	objects.MsgId = pad(fileCtrlNumber, 4);
	objects.CreDtTm = moment(d).format('YYYY-MM-DDThh:mm:ss') || today.format('{yyyy}-{MM}-{dd}T{hh}:{mm}:{ss}');
	objects.Authstn.Cd = 'FDET'; //Previously AUTH
	objects.NbOfTxs = grpHdrNbOfTxs;
	objects.CtrlSum = grpHdrCtrlSum.toFixed(2); // Do we comment this out?

	if (objects.CtrlSum == '0.00') {
		dLog('CtrlSum is 0.00, this should not happen. Returning empty file', objects.CtrlSum);
		return '';
	}

	if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ceo_company_id'))) {
		objects.InitgPty.Id.OrgId.Othr.Id = objAcctMapping[0].getValue('custrecord_acct_map_ceo_company_id'); //CEO ID
	}

	for (x in arrBillPayInfoCtr) {
		objects.PmtInfId = fileCtrlNumber;
		var paymentMethod = x;
		objects.PmtMtd = 'TRF';

		objects.PmtTpInf.SvcLvl.Cd = paymentMethod == 'DAC' ? 'NURG' : 'URGP';
		objects.ReqdExctnDt = moment(d).format('YYYY-MM-DD') || today.format('{yyyy}-{MM}-{dd}');

		if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_companyname'))) objects.Dbtr.Nm = objVDCRecResults[0].getValue('custrecord_companyname');

		//PstlAdr
		var country = !isEmpty(objVDCRecResults) ? objVDCRecResults[0].getValue('custrecord_compcountrycode') : '';

		if (
			(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_comppostcode'))) ||
			(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compcity'))) ||
			(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compstateprov'))) ||
			(!isEmpty(objVDCRecResults) && objVDCRecResults[0].getValue('custrecord_compcountrycode')) ||
			(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compadd1')))
		) {
			if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compadd1'))) {
				objects.Dbtr.PstlAdr.StrtNm = '<StrtNm>' + objVDCRecResults[0].getValue('custrecord_compadd1') + '</StrtNm>';
			}
			if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compadd2'))) {
				objects.Dbtr.PstlAdr.BldgNb = '<BldgNb>' + objVDCRecResults[0].getValue('custrecord_compadd2') + '</BldgNb>';
			}

			if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_comppostcode'))) {
				objects.Dbtr.PstlAdr.PstCd = '<PstCd>' + objVDCRecResults[0].getValue('custrecord_comppostcode') + '</PstCd>';
			}
			// addTextNodeFromParentNode(xmlDoc, pstlAdr, 'PstCd', objVDCRecResults[0].getValue('custrecord_comppostcode'));

			if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compcity'))) {
				objects.Dbtr.PstlAdr.TwnNm = '<TwnNm>' + objVDCRecResults[0].getValue('custrecord_compcity') + '</TwnNm>';
			}
			// addTextNodeFromParentNode(xmlDoc, pstlAdr, 'TwnNm', objVDCRecResults[0].getValue('custrecord_compcity'));

			//Where do we get CtrySubDvsn?
			if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compstateprov'))) {
				objects.Dbtr.PstlAdr.TwnNm = '<CtrySubDvsn>' + objVDCRecResults[0].getValue('custrecord_compstateprov') + '</CtrySubDvsn>';
			}

			// addTextNodeFromParentNode(xmlDoc, pstlAdr, 'Ctry', country);
			if (country) {
				objects.Dbtr.PstlAdr.Ctry = '<Ctry>' + country + '</Ctry>';
			}
			dLog('Added Ctry', JSON.stringify(objects));

			// addTextNodeFromParentNode(xmlDoc, pstlAdr, 'AdrLine', objVDCRecResults[0].getValue('custrecord_compadd1'));
			// objects.Dbtr.PstlAdr.BldgNb = '2'; not used
		}

		if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_dom_ach_co_id'))) {
			objects.Dbtr.Id = {};
			objects.Dbtr.Id.Othr = {};
			objects.Dbtr.Id.Othr.Id = objAcctMapping[0].getValue('custrecord_acct_map_dom_ach_co_id'); //ACH Company ID
		}

		//DbtrAcct
		if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_origin_acc'))) {
			objects.DbtrAcct = {};
			objects.DbtrAcct.Id = {};
			objects.DbtrAcct.Id.Othr = {};
			objects.DbtrAcct.Id.Othr.Id = objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_origin_acc'); // Bank Account Number
		}

		//DbtrAgt
		if ((!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id'))) || !isEmpty(country)) {
			if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id'))) {
				// objects.DbtrAgt.FinInstnId.BIC = objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id');

				objects.DbtrAgt = {};
				objects.DbtrAgt.FinInstnId = {};
				objects.DbtrAgt.FinInstnId.ClrSysMmbId = {};
				objects.DbtrAgt.FinInstnId.ClrSysMmbId.MmbId = objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id'); // Routing Number 10 Digit
			}
			objects.DbtrAgt.FinInstnId.PstlAdr = {};
			objects.DbtrAgt.FinInstnId.PstlAdr.Ctry = country;
		}

		//CdtTrfTxInf loop starts here.
		var pmtInfID = '';
		if (SINGLEBILLPYMTS == 'T') {
			dAudit('Create Single Bill Payments here.', JSON.stringify(arrBillsProcessed));

			for (var i = 0; i < arrBillsProcessed.length; i++) {
				var billPayment = arrBillsProcessed[i];

				if (billPayment.payment == 'CREDIT') {
					continue;
				}

				var symbol = '';

				try {
					symbol = _.find(_currencies, { internalid: String(billPayment.currid) }).symbol;
				} catch (e) {}

				var objVendor = arrVendors[billPayment.payeeid];
				if (!objVendor) objVendor = _.find(arrVendors, { internalid: String(billPayment.payeeid) });

				dLog('objVendor', JSON.stringify(objVendor));

				var cdtTrfTxInfObj = {};
				cdtTrfTxInfObj.PmtId = {};

				var refnum = billPayment.refnum; //arrBillPaymentMap[billPayment.payeeid];
				pmtInfID = billPayment.refnum;
				// var refnum = billPayment.billnum; //arrBillPaymentMap[billPayment.payeeid];
				var instrId = '';
				if (refnum.length > 12) {
					instrId = pz(refnum.substring(refnum.length - 12, refnum.length), 12);
				} else {
					instrId = pz(refnum, 12);
				}
				refnum = billPayment.billnum; //Overwrite endToendID
				var endToEndId = refnum;
				if (refnum.length > 18) {
					endToEndId = refnum.substr(0, 16); //previously 18
				}

				cdtTrfTxInfObj.PmtId.InstrId = instrId;
				cdtTrfTxInfObj.PmtId.EndToEndId = endToEndId;
				cdtTrfTxInfObj.Amt = {};
				cdtTrfTxInfObj.Amt.value = billPayment.payamt; //amt.toFixed(2);
				cdtTrfTxInfObj.Amt.Ccy = symbol;
				// cdtTrfTxInfObj.ChrgBr = (billPayment.paymethod == 'AUCR') ? 'CRED' : 'DEBT';

				cdtTrfTxInfObj.CdtrAgt = {};
				cdtTrfTxInfObj.CdtrAgt.FinInstnId = {};
				// cdtTrfTxInfObj.CdtrAgt.FinInstnId.BIC = objVendor.recbankprimid;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.ClrSysMmbId = {};
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.ClrSysMmbId.MmbId = objVendor.recbankprimid; //objVendor.bankid; // Receiving Bank Routing
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.Nm = objVendor.vbankname;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr = {};
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.Ctry = countryCodeMapping[objVendor.vbankcountry];
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.AdrLine = objVendor.vbankaddrs1;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.StrtNum = objVendor.vbankaddrs1;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.BldgNb = '';
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.PstCd = objVendor.vbankzip;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.TwnNm = objVendor.vbankcity;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.CtrySubDvsn = objVendor.vbankstate;

				cdtTrfTxInfObj.Cdtr = {};
				cdtTrfTxInfObj.Cdtr.Nm = objVendor.vendorname;
				cdtTrfTxInfObj.Cdtr.PstlAdr = {};
				cdtTrfTxInfObj.Cdtr.PstlAdr.StrtNm = objVendor.vendoraddrs1;
				cdtTrfTxInfObj.Cdtr.PstlAdr.BldgNb = objVendor.vendoraddrs2 || '';
				cdtTrfTxInfObj.Cdtr.PstlAdr.PstCd = objVendor.vendorpostal;
				cdtTrfTxInfObj.Cdtr.PstlAdr.TwnNm = objVendor.vendorcity;
				cdtTrfTxInfObj.Cdtr.PstlAdr.CtrySubDvsn = objVendor.vendorstateprovince;
				cdtTrfTxInfObj.Cdtr.PstlAdr.Ctry = countryCodeMapping[objVendor.vendorcountrycode];

				cdtTrfTxInfObj.CdtrAcct = {};
				cdtTrfTxInfObj.CdtrAcct.Id = {};
				cdtTrfTxInfObj.CdtrAcct.Id.Othr = {};
				cdtTrfTxInfObj.CdtrAcct.Id.Othr.Id = objVendor.recpartyaccount;

				// cdtTrfTxInfObj.RltdAmtInf = {};
				// cdtTrfTxInfObj.RltdAmtInf.RmtLctnMtd = objVendor.pmp_dac_contactname || "";
				// cdtTrfTxInfObj.RltdAmtInf.RmtLctnElctrncAdr = objVendor.pmp_dac_emailaddress || "";
				cdtTrfTxInfObj.RmtInf = {};
				cdtTrfTxInfObj.RmtInf.Ustrd = refnum;
				cdtTrfTxInfObj.RmtInf.Strd = Strd;

				CdtTrfTxInf.push(cdtTrfTxInfObj);
			}
		} else {
			dAudit('arrVendorBills', arrVendorBills);
			var refnum = '';
			var currency = '';
			var symbol = '';

			for (v in arrVendorBills) {
				var arrPayeeInfo = v.split('X@X');
				var payeeId = arrPayeeInfo[1];

				//var objVendor=arrVendors[payeeId];
				       var objVendor = _.find(arrVendors, { internalid: String(payeeId)});
				// var objVendor = _.find(arrVendors, { internalid: String(payeeId), paymentmethod: String(paymentMethod) })[0];
dAudit('objVendor-new', objVendor);				dLog('objVendor', JSON.stringify(objVendor));

				if (isEmpty(objVendor)) continue;

				var pmtMethod = objVendor.paymentmethod;

				if (paymentMethod != pmtMethod) continue;

				var arrBills = arrVendorBills[paymentMethod + 'X@X' + payeeId];
				dLog('arrBills', JSON.stringify(arrBills));
				var tmpAmt = 0;

				var numberOfBills = _.size(arrBills);
				for (by in arrBills) {
					var billId = arrBills[by];
					refnum = _.find(arrBillsProcessed, { id: String(billId) }).refnum;
					pmtInfID = refnum;
					currency = _.find(arrBillsProcessed, { id: String(billId) }).currid;
					subtext = _.find(arrBillsProcessed, { id: String(billId) }).subtext;
					billnum = _.find(arrBillsProcessed, { id: String(billId) }).billnum;

					try {
						symbol = _.find(_currencies, { internalid: String(currency) }).symbol;
					} catch (e) {}
					dLog('createAUACHXMLDocrefnum', JSON.stringify(refnum));

					var netAmt = 0;
					var origAmt = getFloatVal(arrBillAmtOrig[billId]);
					var amt = getFloatVal(arrBillAmt[billId]);

					var discAmt = !isEmpty(arrBillDiscAmt[billId]) ? getFloatVal(arrBillDiscAmt[billId]) : 0;

					dLog(
						'amounts',
						JSON.stringify({
							netAmt: netAmt,
							origAmt: origAmt,
							amt: amt,
							discAmt: discAmt,
						})
					);

					netAmt = origAmt;
					tmpAmt += amt; //used to be netAmt

					if (discAmt > 0) {
						netAmt -= discAmt;
						tmpAmt -= discAmt;
					}

					if (!isEmpty(arrBillCredits[billId])) {
						var arrBC = arrBillCredits[billId];

						dLog('arrBC in arrBills', JSON.stringify(arrBC));

						for (bc in arrBC) {
							var billCreditAmtP = getFloatVal(arrBC[bc].bcamt);
							var billCreditAmt = billCreditAmtP * -1;

							// tmpAmt = (tmpAmt - billCreditAmtP);
							netAmt = netAmt - billCreditAmtP;
						}
					}
				}

				var cdtTrfTxInfObj = {};
				cdtTrfTxInfObj.PmtId = {};

				var refnum = arrBillPaymentMap[payeeId];
				var instrId = '';
				if (refnum.length > 12) {
					instrId = pz(refnum.substring(refnum.length - 12, refnum.length), 12);
				} else {
					instrId = pz(refnum, 12);
				}
				var endToEndId = pz(billnum, 15); //previously refnum
				if (numberOfBills > 1) {
					endToEndId = pz(subtext, 15);
				}

				if (endToEndId.length > 15) {
					endToEndId = endToEndId.substr(0, 15);
				}

				//refnum

				cdtTrfTxInfObj.PmtId.InstrId = instrId;
				cdtTrfTxInfObj.PmtId.EndToEndId = endToEndId;
				cdtTrfTxInfObj.Amt = {};
				cdtTrfTxInfObj.Amt.value = tmpAmt.toFixed(2); //amt.toFixed(2);
				cdtTrfTxInfObj.Amt.Ccy = symbol;
				// cdtTrfTxInfObj.ChrgBr = (paymentMethod == 'AUCR') ? 'CRED' : 'DEBT';

				tmpAmt = 0; // need to initialize back to 0

				var Strd = [];

				for (y in arrBills) {
					var billId = arrBills[y];
					var StrdObj = {};
					StrdObj.RfrdDocInf = {};
					StrdObj.RfrdDocInf.Tp = {};
					StrdObj.RfrdDocInf.Tp.CdOrPrtry = {};
					StrdObj.RfrdDocInf.Tp.CdOrPrtry.Cd = 'CINV'; //Hardcoded?

					var netAmt = 0;
					var origAmt = getFloatVal(arrBillAmtOrig[billId]);
					var amt = getFloatVal(arrBillAmt[billId]);

					var discAmt = !isEmpty(arrBillDiscAmt[billId]) ? getFloatVal(arrBillDiscAmt[billId]) : 0;

					dLog('billId before', billId);
					dLog('arrBC in y.arrBills before', JSON.stringify(arrBillCredits));

					if (!isEmpty(arrBillCredits[billId])) {
						var arrBC = arrBillCredits[billId];

						dLog('arrBC in y.arrBills', JSON.stringify(arrBC));

						for (bc in arrBC) {
							var billCreditAmtP = getFloatVal(arrBC[bc].bcamt);
							var billCreditAmt = billCreditAmtP * -1;

							// tmpAmt = (tmpAmt - billCreditAmtP);
							netAmt = netAmt - billCreditAmtP;
						}
					}

					// tmpAmt += amt;
					netAmt = origAmt;
					tmpAmt += amt; //used to be netAmt

					if (discAmt > 0) {
						netAmt -= discAmt;
						tmpAmt -= discAmt;
					}

					dLog('createAUACHXMLDoc. objBillsData', JSON.stringify(objBillsData[billId]));

					if (!isEmpty(objBillsData[billId].num)) {
						StrdObj.RfrdDocInf.Nb = objBillsData[billId].num;
					} else if (!isEmpty(objBillsData[billId].trnxnumber)) {
						StrdObj.RfrdDocInf.Nb = objBillsData[billId].trnxnumber;
					}

					var invoiceDate = objBillsData[billId].dte;
					StrdObj.RfrdDocInf.RltdDt = formatDate(nlapiStringToDate(invoiceDate));
					StrdObj.RfrdDocAmt = {};
					StrdObj.RfrdDocAmt.DuePyblAmt = {};
					StrdObj.RfrdDocAmt.DscntApldAmt = {};
					StrdObj.RfrdDocAmt.RmtdAmt = {};
					StrdObj.RfrdDocAmt.DuePyblAmt.value = origAmt.toFixed(2);

					if (discAmt == 0) discAmt = '';
					else discAmt = discAmt.toFixed(2);

					StrdObj.RfrdDocAmt.DscntApldAmt.value = discAmt;
					StrdObj.RfrdDocAmt.RmtdAmt.value = netAmt.toFixed(2);

					StrdObj.RfrdDocAmt.DuePyblAmt.Ccy = symbol;
					StrdObj.RfrdDocAmt.DscntApldAmt.Ccy = symbol;
					StrdObj.RfrdDocAmt.RmtdAmt.Ccy = symbol;

					//Add CDtrRefInf
					StrdObj.CdtrRefInf = {};
					StrdObj.CdtrRefInf.Tp = {};
					StrdObj.CdtrRefInf.CdOrPrtry = {};
					StrdObj.CdtrRefInf.CdOrPrtry.Cd = 'PUOR';

					Strd.push(StrdObj);

					if (!isEmpty(arrBillCredits[billId])) {
						var arrBC = arrBillCredits[billId];

						for (bc in arrBC) {
							var billCreditAmtP = getFloatVal(arrBC[bc].bcamt);
							var billCreditAmt = billCreditAmtP;

							tmpAmt = tmpAmt - billCreditAmtP;
							netAmt = netAmt - billCreditAmtP;

							var StrdObj = {};
							StrdObj.RfrdDocInf = {};
							StrdObj.RfrdDocInf.Tp = {};
							StrdObj.RfrdDocInf.Tp.CdOrPrtry = {};
							StrdObj.RfrdDocInf.Tp.CdOrPrtry.Cd = 'CREN'; //Hardcoded?

							var bcNum = arrBC[bc].bcnum;
							dLog('createJPMXMLDoc', 'VC number : ' + bcNum);

							if (!isEmpty(bcNum)) StrdObj.RfrdDocInf.Nb = bcNum;
							else if (!isEmpty(arrBillCredits[billId].bcmemo)) {
								StrdObj.RfrdDocInf.Nb = arrBillCredits[billId].bcmemo;
							}

							var invoiceDate = objBillsData[billId].dte;
							StrdObj.RfrdDocInf.RltdDt = formatDate(nlapiStringToDate(arrBC[bc].bcdate));

							StrdObj.RfrdDocAmt = {};
							StrdObj.RfrdDocAmt.DuePyblAmt = {};
							StrdObj.RfrdDocAmt.DscntApldAmt = {};
							StrdObj.RfrdDocAmt.CdtNoteAmt = {};

							StrdObj.RfrdDocAmt.DuePyblAmt.value = billCreditAmt.toFixed(2);
							if (discAmt == 0) discAmt = '';
							else discAmt = discAmt.toFixed(2);

							StrdObj.RfrdDocAmt.DscntApldAmt.value = discAmt;
							StrdObj.RfrdDocAmt.CdtNoteAmt.value = billCreditAmt.toFixed(2);

							StrdObj.RfrdDocAmt.DuePyblAmt.Ccy = symbol;
							StrdObj.RfrdDocAmt.DscntApldAmt.Ccy = symbol;
							StrdObj.RfrdDocAmt.CdtNoteAmt.Ccy = symbol;

							Strd.push(StrdObj);
						}
					}
				}

				cdtTrfTxInfObj.CdtrAgt = {};
				cdtTrfTxInfObj.CdtrAgt.FinInstnId = {};
				// cdtTrfTxInfObj.CdtrAgt.FinInstnId.BIC = objVendor.recbankprimid;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.ClrSysMmbId = {};
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.ClrSysMmbId.MmbId = objVendor.recbankprimid; //objVendor.bankid; // Receiving Bank Routing
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.Nm = objVendor.vbankname;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr = {};
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.Ctry = countryCodeMapping[objVendor.vbankcountry];
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.AdrLine = objVendor.vbankaddrs1;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.StrtNum = objVendor.vbankaddrs1;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.PstCd = objVendor.vbankzip;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.TwnNm = objVendor.vbankcity;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.BldgNb = '';
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.CtrySubDvsn = objVendor.vbankstate;

				cdtTrfTxInfObj.Cdtr = {};
				cdtTrfTxInfObj.Cdtr.Nm = objVendor.vendorname;
				cdtTrfTxInfObj.Cdtr.PstlAdr = {};
				cdtTrfTxInfObj.Cdtr.PstlAdr.StrtNm = objVendor.vendoraddrs1;
				cdtTrfTxInfObj.Cdtr.PstlAdr.BldgNb = objVendor.vendoraddrs2 || '';
				cdtTrfTxInfObj.Cdtr.PstlAdr.PstCd = objVendor.vendorpostal;
				cdtTrfTxInfObj.Cdtr.PstlAdr.TwnNm = objVendor.vendorcity;
				cdtTrfTxInfObj.Cdtr.PstlAdr.CtrySubDvsn = objVendor.vendorstateprovince;
				cdtTrfTxInfObj.Cdtr.PstlAdr.Ctry = countryCodeMapping[objVendor.vendorcountrycode];

				cdtTrfTxInfObj.CdtrAcct = {};
				cdtTrfTxInfObj.CdtrAcct.Id = {};
				cdtTrfTxInfObj.CdtrAcct.Id.Othr = {};
				cdtTrfTxInfObj.CdtrAcct.Id.Othr.Id = objVendor.recpartyaccount;

				// cdtTrfTxInfObj.RltdAmtInf = {};
				// cdtTrfTxInfObj.RltdAmtInf.RmtLctnMtd = objVendor.pmp_dac_contactname || "";
				// cdtTrfTxInfObj.RltdAmtInf.RmtLctnElctrncAdr = objVendor.pmp_dac_emailaddress || "";
				cdtTrfTxInfObj.RmtInf = {};
				cdtTrfTxInfObj.RmtInf.Ustrd = refnum;
				cdtTrfTxInfObj.RmtInf.Strd = Strd;

				CdtTrfTxInf.push(cdtTrfTxInfObj);
			}
		}
	}
	// objects.PmtInfId = pmtInfID;
	// dLog('pmtInfID', pmtInfID);
	objects.CdtTrfTxInf = CdtTrfTxInf;

	dLog('objects', JSON.stringify(objects));

	var fileId = nlapiSearchRecord('file', null, [['name', 'is', 'ica_us_ach.xml']], []);
	if (fileId != null) {
		fileId = fileId[0].getId();
	}

	var tmplFile = nlapiLoadFile(fileId);

	var template = Handlebars.compile(tmplFile.getValue());
	var xmlDoc = template(objects);

	dLog('xmlDoc', xmlDoc);
	return xmlDoc;
}

function createUSWIREXMLDoc(objAcctMapping) {
	var arrTempBillIds = [];
	var arrBillCRIds = [];
	var arrBillAmt = [];
	var arrBillAmtOrig = [];
	var arrBillDiscAmt = [];
	var arrBillPayInfoCtr = [];
	var arrBillPayInfoSum = [];
	var arrGrpHdrNbOfTxs = [];
	var arrPmtInfNbOfTxs = [];
	var arrBillIds = [];
	var grpHdrNbOfTxs = 0;
	var grpHdrCtrlSum = 0;
	var arrPayeeIds = [];
	var _currencies = getCurrencies();

	for (x in arrBillsProcessed) {
		var billId = arrBillsProcessed[x].id;
		var billPaymentId = arrBillsProcessed[x].payment;

		dLog('createUSWIREXMLDoc', 'Bill info = ' + JSON.stringify(arrBillsProcessed[x]));
		if (!isEmpty(billPaymentId) && billPaymentId != 'XXXNONEXXX' && billPaymentId != 'CREDIT') {
			if (billPaymentId != 'CREDIT') arrTempBillIds.push(billId);

			var payMethod = arrBillsProcessed[x].paymethod;
			var paymentId = arrBillsProcessed[x].payment;
			var payeeId = arrBillsProcessed[x].payeeid;

			arrBillAmtOrig[billId] = arrBillsProcessed[x].origamt;
			// arrBillAmt[billId] = arrBillsProcessed[x].pay;
			arrBillAmt[billId] = arrBillsProcessed[x].payamt;
			arrBillDiscAmt[billId] = arrBillsProcessed[x].discamt;

			var ndx = payMethod + '@@' + paymentId;

			if (arrBillPayInfoCtr[payMethod] == null) arrBillPayInfoCtr[payMethod] = 0;
			if (arrBillPayInfoSum[payMethod] == null) arrBillPayInfoSum[payMethod] = 0;
			if (arrPmtInfNbOfTxs[ndx] == null) arrPmtInfNbOfTxs[ndx] = 0;

			if (paymentId && arrGrpHdrNbOfTxs[paymentId] == null) grpHdrNbOfTxs++;

			arrPmtInfNbOfTxs[ndx]++;
			arrBillPayInfoCtr[payMethod]++;
			arrBillPayInfoSum[payMethod] += getFloatVal(arrBillsProcessed[x].payamt);
			arrGrpHdrNbOfTxs[paymentId] = paymentId;

			grpHdrCtrlSum += getFloatVal(arrBillsProcessed[x].payamt);
		}

		if (billPaymentId == 'CREDIT') arrBillCRIds.push(billId);
	}

	var arrBillIds = [];
	var arrBillIds2 = [];
	var arrBillIds3 = [];
	var arrBillIds4 = [];
	var arrBillIds5 = [];

	for (vx in arrTempBillIds) {
		var isBC = false;

		for (var x in arrBillCRIds) {
			if (arrTempBillIds[vx] == arrBillCRIds[x]) {
				isBC = true;
				break;
			}
		}

		if (!isBC) {
			arrBillIds.push(arrTempBillIds[vx]);
			arrBillIds2.push(arrTempBillIds[vx]);
			arrBillIds3.push(arrTempBillIds[vx]);
			arrBillIds4.push(arrTempBillIds[vx]);
			arrBillIds5.push(arrTempBillIds[vx]);
		}
	}

	var arrBillCredits = getBillCredit(arrBillIds);
	var objBillsData = getBillData(arrBillIds2);
	var arrBillPO = getPOMap(arrBillIds3);
	var arrVendorBills = getPayeeBillsByPayMethod(arrBillIds4);
	var arrVendorBillsCurr = getPayeeBillsCurrency(arrBillIds5);
	var nsAcctSub = !isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('subsidiary', 'CUSTRECORD_ACCT_MAP_NETSUITE_ACCOUNT')) ? objAcctMapping[0].getValue('subsidiary', 'CUSTRECORD_ACCT_MAP_NETSUITE_ACCOUNT') : '';
	var objVDCRecResults = getVendorDAC_CCRPaymentRec(nsAcctSub);
	dLog('objVDCRecResults', JSON.stringify(objVDCRecResults));
	dLog('objAcctMapping', JSON.stringify(objAcctMapping));

	//Gather data.
	var CdtTrfTxInf = [];

	var objects = {
		MsgId: 'TBD',
		CreDtTm: 'Test',
		Authstn: {
			Cd: '',
		},
		NbOfTxs: '2',
		CtrlSum: '2000',
		InitgPty: {
			Id: {
				OrgId: {
					Othr: {
						Id: '',
					},
				},
			},
		},
		PmtInfId: 'PmtInfId',
		PmtMtd: 'PmtMtd',
		PmtTpInf: {
			SvcLvl: {
				Cd: 'This is CD',
			},
		},
		ReqdExctnDt: 'ReqdExctnDt',
		Dbtr: {
			Nm: 'This is Nm',
			PstlAdr: {
				StrtNm: '',
				BldgNb: '',
				PstCd: '',
				TwnNm: '',
				CtrySubDvsn: '',
				Ctry: '',
			},
			Id: {
				Othr: {
					Id: 'Dbtr.Id.Othr.Id',
				},
			},
		},
		DbtrAcct: {
			Id: {
				Othr: {
					Id: 'DbtrAcct.Id.Othr.Id',
				},
			},
			PstlAdr: {
				StrtNm: '',
				BldgNb: '',
				PstCd: '',
				TwnNm: '',
				CtrySubDvsn: '',
				Ctry: '',
			},
		},
		DbtrAgt: {
			FinInstnId: {
				BIC: 'BIC',
				PstlAdr: {
					StrtNm: '',
					BldgNb: '',
					PstCd: '',
					TwnNm: '',
					CtrySubDvsn: '',
					Ctry: '',
				},
			},
		},
		CdtTrfTxInf: CdtTrfTxInf,
	};

	for (x in arrVendorBills) {
		var payeeId = x.split('X@X')[1];
		arrPayeeIds.push(payeeId);
	}

	var arrVendors = getEntityData(arrPayeeIds);

	var today = new Date();
	var bpmdate = BPM_DATE;
	var d = nlapiStringToDate(bpmdate, 'datetime');

	var fileCtrlNumber = Date.create().format('{yy}{MM}{dd}{mm}{ss}');
	objects.MsgId = pad(fileCtrlNumber, 4);
	objects.CreDtTm = moment(d).format('YYYY-MM-DDThh:mm:ss') || today.format('{yyyy}-{MM}-{dd}T{hh}:{mm}:{ss}');
	objects.Authstn.Cd = 'FDET'; // Changed from AUTH
	objects.NbOfTxs = grpHdrNbOfTxs;
	objects.CtrlSum = grpHdrCtrlSum.toFixed(2); // Do we comment this out?

	if (objects.CtrlSum == '0.00') {
		dLog('CtrlSum is 0.00, this should not happen. Returning empty file', objects.CtrlSum);
		return '';
	}

	if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ceo_company_id'))) {
		objects.InitgPty.Id.OrgId.Othr.Id = objAcctMapping[0].getValue('custrecord_acct_map_ceo_company_id'); //CEO ID
	}

	for (x in arrBillPayInfoCtr) {
		objects.PmtInfId = fileCtrlNumber;
		var paymentMethod = x;
		objects.PmtMtd = 'TRF';

		objects.PmtTpInf.SvcLvl.Cd = paymentMethod == 'MTS' ? 'URGP' : 'NURG';
		objects.ReqdExctnDt = moment(d).format('YYYY-MM-DD') || today.format('{yyyy}-{MM}-{dd}');

		if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_companyname'))) objects.Dbtr.Nm = objVDCRecResults[0].getValue('custrecord_companyname');

		//PstlAdr
		var country = !isEmpty(objVDCRecResults) ? objVDCRecResults[0].getValue('custrecord_compcountrycode') : '';

		if (
			(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_comppostcode'))) ||
			(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compcity'))) ||
			(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compstateprov'))) ||
			(!isEmpty(objVDCRecResults) && objVDCRecResults[0].getValue('custrecord_compcountrycode')) ||
			(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compadd1')))
		) {
			if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compadd1'))) {
				objects.Dbtr.PstlAdr.StrtNm = '<StrtNm>' + objVDCRecResults[0].getValue('custrecord_compadd1') + '</StrtNm>';
			}
			if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compadd2'))) {
				objects.Dbtr.PstlAdr.BldgNb = '<BldgNb>' + objVDCRecResults[0].getValue('custrecord_compadd2') + '</BldgNb>';
			}

			if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_comppostcode'))) {
				objects.Dbtr.PstlAdr.PstCd = '<PstCd>' + objVDCRecResults[0].getValue('custrecord_comppostcode') + '</PstCd>';
			}
			// addTextNodeFromParentNode(xmlDoc, pstlAdr, 'PstCd', objVDCRecResults[0].getValue('custrecord_comppostcode'));

			if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compcity'))) {
				objects.Dbtr.PstlAdr.TwnNm = '<TwnNm>' + objVDCRecResults[0].getValue('custrecord_compcity') + '</TwnNm>';
			}
			// addTextNodeFromParentNode(xmlDoc, pstlAdr, 'TwnNm', objVDCRecResults[0].getValue('custrecord_compcity'));

			//Where do we get CtrySubDvsn?
			if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compstateprov'))) {
				objects.Dbtr.PstlAdr.CtrySubDvsn = '<CtrySubDvsn>' + objVDCRecResults[0].getValue('custrecord_compstateprov') + '</CtrySubDvsn>';
			}

			// addTextNodeFromParentNode(xmlDoc, pstlAdr, 'Ctry', country);
			if (country) {
				objects.Dbtr.PstlAdr.Ctry = '<Ctry>' + country + '</Ctry>';
			}
			dLog('Added Ctry', JSON.stringify(objects));

			// addTextNodeFromParentNode(xmlDoc, pstlAdr, 'AdrLine', objVDCRecResults[0].getValue('custrecord_compadd1'));
			// objects.Dbtr.PstlAdr.BldgNb = '2'; not used
		}

		if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_dom_ach_co_id'))) {
			objects.Dbtr.Id = {};
			objects.Dbtr.Id.Othr = {};
			objects.Dbtr.Id.Othr.Id = objAcctMapping[0].getValue('custrecord_acct_map_dom_ach_co_id'); //ACH Company ID
		}

		//DbtrAcct
		if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_origin_acc'))) {
			objects.DbtrAcct = {};
			objects.DbtrAcct.Id = {};
			objects.DbtrAcct.Id.Othr = {};
			objects.DbtrAcct.Id.Othr.Id = objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_origin_acc'); // Bank Account Number
		}

		//DbtrAgt
		if ((!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id'))) || !isEmpty(country)) {
			objects.DbtrAgt = {};
			objects.DbtrAgt.FinInstnId = {};
			if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_hsbc_swift_bank_id'))) {
				objects.DbtrAgt.FinInstnId.BIC = objAcctMapping[0].getValue('custrecord_acct_map_hsbc_swift_bank_id');
			}
			if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id'))) {
				objects.DbtrAgt.FinInstnId.ClrSysMmbId = {};
				objects.DbtrAgt.FinInstnId.ClrSysMmbId.MmbId = objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id'); // Routing Number 10 Digit
			}
			objects.DbtrAgt.FinInstnId.PstlAdr = {};
			objects.DbtrAgt.FinInstnId.PstlAdr.Ctry = country;
		}

		//CdtTrfTxInf loop starts here.

		if (SINGLEBILLPYMTS == 'T') {
			dAudit('Create Single Bill Payments here.', JSON.stringify(arrBillsProcessed));

			for (var i = 0; i < arrBillsProcessed.length; i++) {
				var billPayment = arrBillsProcessed[i];

				if (billPayment.payment == 'CREDIT') {
					continue;
				}

				var symbol = '';

				try {
					symbol = _.find(_currencies, { internalid: String(billPayment.currid) }).symbol;
				} catch (e) {}

				var objVendor = arrVendors[billPayment.payeeid];
				if (!objVendor) objVendor = _.find(arrVendors, { internalid: String(billPayment.payeeid) });

				dLog('objVendor', JSON.stringify(objVendor));

				var cdtTrfTxInfObj = {};
				cdtTrfTxInfObj.PmtId = {};

				var refnum = billPayment.refnum; //arrBillPaymentMap[billPayment.payeeid];
				// var refnum = billPayment.billnum; //arrBillPaymentMap[billPayment.payeeid];
				var instrId = '';
				if (refnum.length > 12) {
					instrId = pz(refnum.substring(refnum.length - 12, refnum.length), 12);
				} else {
					instrId = pz(refnum, 12);
				}
				refnum = billPayment.billnum; //Overwrite endToendID
				var endToEndId = refnum;
				if (refnum.length > 18) {
					endToEndId = refnum.substr(0, 18);
				}

				cdtTrfTxInfObj.PmtId.InstrId = instrId;
				cdtTrfTxInfObj.PmtId.EndToEndId = endToEndId;
				cdtTrfTxInfObj.Amt = {};
				cdtTrfTxInfObj.Amt.value = billPayment.payamt; //amt.toFixed(2);
				cdtTrfTxInfObj.Amt.Ccy = symbol;
				cdtTrfTxInfObj.ChrgBr = 'CRED';

				cdtTrfTxInfObj.CdtrAgt = {};
				cdtTrfTxInfObj.CdtrAgt.FinInstnId = {};
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.BIC = objVendor.recbankprimid;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.ClrSysMmbId = {};
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.ClrSysMmbId.MmbId = objVendor.bankid || objVendor.recbankprimid; // Receiving Bank Routing
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.Nm = objVendor.vbankname;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr = {};
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.Ctry = countryCodeMapping[objVendor.vbankcountry];
				// cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.AdrLine = objVendor.vbankaddrs1;

				if (isEmpty(objVendor.vbankaddrs1) || isEmpty(objVendor.vbankzip) || isEmpty(objVendor.vbankcity) || isEmpty(objVendor.vbankstate)) {
					cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.StrtNm = '';
					cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.BldgNb = '';
					cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.PstCd = '';
					cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.TwnNm = '';
					cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.CtrySubDvsn = '';
				} else {
					cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.StrtNm = objVendor.vbankaddrs1;
					cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.BldgNb = '';
					cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.PstCd = objVendor.vbankzip;
					cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.TwnNm = objVendor.vbankcity;
					cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.CtrySubDvsn = objVendor.vbankstate;
				}

				cdtTrfTxInfObj.Cdtr = {};
				cdtTrfTxInfObj.Cdtr.Nm = objVendor.vendorname;
				cdtTrfTxInfObj.Cdtr.PstlAdr = {};
				// if ( (isEmpty(objVendor.vendoraddrs1)) || (isEmpty(objVendor.vendorpostal)) || (isEmpty(objVendor.vendorcity)) || (isEmpty(objVendor.vendorstateprovince)) ) {
				// 	dLog('Here, should be empty', JSON.stringify(objVendor));
				// 	cdtTrfTxInfObj.Cdtr.PstlAdr.StrtNm = '';
				// 	cdtTrfTxInfObj.Cdtr.PstlAdr.BldgNb = "";
				// 	cdtTrfTxInfObj.Cdtr.PstlAdr.PstCd = '';
				// 	cdtTrfTxInfObj.Cdtr.PstlAdr.TwnNm = '';
				// 	cdtTrfTxInfObj.Cdtr.PstlAdr.CtrySubDvsn = '';
				// } else {
				// 	dLog('Here?', JSON.stringify(objVendor));
				// 	cdtTrfTxInfObj.Cdtr.PstlAdr.StrtNm = objVendor.vendoraddrs1;
				// 	cdtTrfTxInfObj.Cdtr.PstlAdr.BldgNb = objVendor.vendoraddrs2 || "";
				// 	cdtTrfTxInfObj.Cdtr.PstlAdr.PstCd = objVendor.vendorpostal;
				// 	cdtTrfTxInfObj.Cdtr.PstlAdr.TwnNm = objVendor.vendorcity;
				// 	cdtTrfTxInfObj.Cdtr.PstlAdr.CtrySubDvsn = objVendor.vendorstateprovince;
				// }

				cdtTrfTxInfObj.Cdtr.PstlAdr.StrtNm = objVendor.vendoraddrs1 || '';
				cdtTrfTxInfObj.Cdtr.PstlAdr.BldgNb = objVendor.vendoraddrs2 || '';
				cdtTrfTxInfObj.Cdtr.PstlAdr.PstCd = objVendor.vendorpostal || '';
				cdtTrfTxInfObj.Cdtr.PstlAdr.TwnNm = objVendor.vendorcity || '';
				cdtTrfTxInfObj.Cdtr.PstlAdr.CtrySubDvsn = objVendor.vendorstateprovince || '';

				cdtTrfTxInfObj.Cdtr.PstlAdr.Ctry = countryCodeMapping[objVendor.vendorcountrycode];

				cdtTrfTxInfObj.CdtrAcct = {};
				cdtTrfTxInfObj.CdtrAcct.Id = {};
				cdtTrfTxInfObj.CdtrAcct.Id.Othr = {};
				cdtTrfTxInfObj.CdtrAcct.Id.Othr.Id = objVendor.recpartyaccount;

				// cdtTrfTxInfObj.RltdAmtInf = {};
				// cdtTrfTxInfObj.RltdAmtInf.RmtLctnMtd = objVendor.pmp_dac_contactname || "";
				// cdtTrfTxInfObj.RltdAmtInf.RmtLctnElctrncAdr = objVendor.pmp_dac_emailaddress || "";
				cdtTrfTxInfObj.RmtInf = {};
				cdtTrfTxInfObj.RmtInf.Ustrd = refnum;
				cdtTrfTxInfObj.RmtInf.Strd = Strd;

				CdtTrfTxInf.push(cdtTrfTxInfObj);
			}
		} else {
			dAudit('arrVendorBills', arrVendorBills);
			var refnum = '';
			var currency = '';
			var symbol = '';

			for (v in arrVendorBills) {
				var arrPayeeInfo = v.split('X@X');
				var payeeId = arrPayeeInfo[1];

				//var objVendor=arrVendors[payeeId];
				       var objVendor = _.find(arrVendors, { internalid: String(payeeId)});
				// var objVendor = _.find(arrVendors, { internalid: String(payeeId), paymentmethod: String(paymentMethod) })[0];
dAudit('objVendor-new', objVendor);				dLog('objVendor', JSON.stringify(objVendor));

				if (isEmpty(objVendor)) continue;

				var pmtMethod = objVendor.paymentmethod;

				if (paymentMethod != pmtMethod) continue;

				var arrBills = arrVendorBills[paymentMethod + 'X@X' + payeeId];
				dLog('arrBills', JSON.stringify(arrBills));
				var tmpAmt = 0;

				var numberOfBills = _.size(arrBills);
				for (by in arrBills) {
					var billId = arrBills[by];
					refnum = _.find(arrBillsProcessed, { id: String(billId) }).refnum;
					currency = _.find(arrBillsProcessed, { id: String(billId) }).currid;
					subtext = _.find(arrBillsProcessed, { id: String(billId) }).subtext;
					billnum = _.find(arrBillsProcessed, { id: String(billId) }).billnum;

					try {
						symbol = _.find(_currencies, { internalid: String(currency) }).symbol;
					} catch (e) {}
					// dLog('createAUACHXMLDocrefnum', JSON.stringify(refnum));

					var netAmt = 0;
					var origAmt = getFloatVal(arrBillAmtOrig[billId]);
					var amt = getFloatVal(arrBillAmt[billId]);

					var discAmt = !isEmpty(arrBillDiscAmt[billId]) ? getFloatVal(arrBillDiscAmt[billId]) : 0;

					dLog(
						'amounts',
						JSON.stringify({
							netAmt: netAmt,
							origAmt: origAmt,
							amt: amt,
							discAmt: discAmt,
						})
					);

					netAmt = origAmt;
					tmpAmt += amt; //used to be netAmt

					if (discAmt > 0) {
						netAmt -= discAmt;
						tmpAmt -= discAmt;
					}

					if (!isEmpty(arrBillCredits[billId])) {
						var arrBC = arrBillCredits[billId];

						dLog('arrBC in arrBills', JSON.stringify(arrBC));

						for (bc in arrBC) {
							var billCreditAmtP = getFloatVal(arrBC[bc].bcamt);
							var billCreditAmt = billCreditAmtP * -1;

							// tmpAmt = (tmpAmt - billCreditAmtP);
							netAmt = netAmt - billCreditAmtP;
						}
					}
				}

				var cdtTrfTxInfObj = {};
				cdtTrfTxInfObj.PmtId = {};

				var refnum = arrBillPaymentMap[payeeId];
				var instrId = '';
				if (refnum.length > 12) {
					instrId = pz(refnum.substring(refnum.length - 12, refnum.length), 12);
				} else {
					instrId = pz(refnum, 12);
				}
				var endToEndId = billnum.substr(0, 15);
				if (numberOfBills > 1) {
					endToEndId = subtext.substr(0, 15);
				}
				//refnum

				cdtTrfTxInfObj.PmtId.InstrId = instrId;
				cdtTrfTxInfObj.PmtId.EndToEndId = endToEndId;
				cdtTrfTxInfObj.Amt = {};
				cdtTrfTxInfObj.Amt.value = tmpAmt.toFixed(2); //amt.toFixed(2);
				cdtTrfTxInfObj.Amt.Ccy = symbol;
				cdtTrfTxInfObj.ChrgBr = 'CRED';

				tmpAmt = 0; // need to initialize back to 0

				var Strd = [];

				for (y in arrBills) {
					var billId = arrBills[y];
					var StrdObj = {};
					StrdObj.RfrdDocInf = {};
					StrdObj.RfrdDocInf.Tp = {};
					StrdObj.RfrdDocInf.Tp.CdOrPrtry = {};
					StrdObj.RfrdDocInf.Tp.CdOrPrtry.Cd = 'CINV'; //Hardcoded?

					var netAmt = 0;
					var origAmt = getFloatVal(arrBillAmtOrig[billId]);
					var amt = getFloatVal(arrBillAmt[billId]);

					var discAmt = !isEmpty(arrBillDiscAmt[billId]) ? getFloatVal(arrBillDiscAmt[billId]) : 0;

					dLog('billId before', billId);
					dLog('arrBC in y.arrBills before', JSON.stringify(arrBillCredits));

					if (!isEmpty(arrBillCredits[billId])) {
						var arrBC = arrBillCredits[billId];

						dLog('arrBC in y.arrBills', JSON.stringify(arrBC));

						for (bc in arrBC) {
							var billCreditAmtP = getFloatVal(arrBC[bc].bcamt);
							var billCreditAmt = billCreditAmtP * -1;

							// tmpAmt = (tmpAmt - billCreditAmtP);
							netAmt = netAmt - billCreditAmtP;
						}
					}

					// tmpAmt += amt;
					netAmt = origAmt;
					tmpAmt += amt; //used to be netAmt

					if (discAmt > 0) {
						netAmt -= discAmt;
						tmpAmt -= discAmt;
					}

					dLog('createUSWIREXMLDoc. objBillsData', JSON.stringify(objBillsData[billId]));

					if (!isEmpty(objBillsData[billId].num)) {
						StrdObj.RfrdDocInf.Nb = objBillsData[billId].num;
					} else if (!isEmpty(objBillsData[billId].trnxnumber)) {
						StrdObj.RfrdDocInf.Nb = objBillsData[billId].trnxnumber;
					}

					var invoiceDate = objBillsData[billId].dte;
					StrdObj.RfrdDocInf.RltdDt = formatDate(nlapiStringToDate(invoiceDate));
					StrdObj.RfrdDocAmt = {};
					StrdObj.RfrdDocAmt.DuePyblAmt = {};
					StrdObj.RfrdDocAmt.DscntApldAmt = {};
					StrdObj.RfrdDocAmt.RmtdAmt = {};
					StrdObj.RfrdDocAmt.DuePyblAmt.value = origAmt.toFixed(2);

					if (discAmt == 0) discAmt = '';
					else discAmt = discAmt.toFixed(2);

					StrdObj.RfrdDocAmt.DscntApldAmt.value = discAmt;
					StrdObj.RfrdDocAmt.RmtdAmt.value = netAmt.toFixed(2);

					StrdObj.RfrdDocAmt.DuePyblAmt.Ccy = symbol;
					StrdObj.RfrdDocAmt.DscntApldAmt.Ccy = symbol;
					StrdObj.RfrdDocAmt.RmtdAmt.Ccy = symbol;

					//Add CDtrRefInf
					StrdObj.CdtrRefInf = {};
					StrdObj.CdtrRefInf.Tp = {};
					StrdObj.CdtrRefInf.CdOrPrtry = {};
					StrdObj.CdtrRefInf.CdOrPrtry.Cd = 'PUOR';

					Strd.push(StrdObj);

					if (!isEmpty(arrBillCredits[billId])) {
						var arrBC = arrBillCredits[billId];

						for (bc in arrBC) {
							var billCreditAmtP = getFloatVal(arrBC[bc].bcamt);
							var billCreditAmt = billCreditAmtP;

							tmpAmt = tmpAmt - billCreditAmtP;
							netAmt = netAmt - billCreditAmtP;

							var StrdObj = {};
							StrdObj.RfrdDocInf = {};
							StrdObj.RfrdDocInf.Tp = {};
							StrdObj.RfrdDocInf.Tp.CdOrPrtry = {};
							StrdObj.RfrdDocInf.Tp.CdOrPrtry.Cd = 'CREN'; //Hardcoded?

							var bcNum = arrBC[bc].bcnum;
							dLog('createJPMXMLDoc', 'VC number : ' + bcNum);

							if (!isEmpty(bcNum)) StrdObj.RfrdDocInf.Nb = bcNum;
							else if (!isEmpty(arrBillCredits[billId].bcmemo)) {
								StrdObj.RfrdDocInf.Nb = arrBillCredits[billId].bcmemo;
							}

							var invoiceDate = objBillsData[billId].dte;
							StrdObj.RfrdDocInf.RltdDt = formatDate(nlapiStringToDate(arrBC[bc].bcdate));

							StrdObj.RfrdDocAmt = {};
							StrdObj.RfrdDocAmt.DuePyblAmt = {};
							StrdObj.RfrdDocAmt.DscntApldAmt = {};
							StrdObj.RfrdDocAmt.CdtNoteAmt = {};

							StrdObj.RfrdDocAmt.DuePyblAmt.value = billCreditAmt.toFixed(2);
							if (discAmt == 0) discAmt = '';
							else discAmt = discAmt.toFixed(2);

							StrdObj.RfrdDocAmt.DscntApldAmt.value = discAmt;
							StrdObj.RfrdDocAmt.CdtNoteAmt.value = billCreditAmt.toFixed(2);

							StrdObj.RfrdDocAmt.DuePyblAmt.Ccy = symbol;
							StrdObj.RfrdDocAmt.DscntApldAmt.Ccy = symbol;
							StrdObj.RfrdDocAmt.CdtNoteAmt.Ccy = symbol;

							Strd.push(StrdObj);
						}
					}
				}

				cdtTrfTxInfObj.CdtrAgt = {};
				cdtTrfTxInfObj.CdtrAgt.FinInstnId = {};
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.BIC = objVendor.recbankprimid;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.ClrSysMmbId = {};
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.ClrSysMmbId.MmbId = objVendor.bankid || objVendor.recbankprimid; // Receiving Bank Routing
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.Nm = objVendor.vbankname;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr = {};
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.Ctry = countryCodeMapping[objVendor.vbankcountry];

				if (isEmpty(objVendor.vbankaddrs1) || isEmpty(objVendor.vbankzip) || isEmpty(objVendor.vbankcity) || isEmpty(objVendor.vbankstate)) {
					cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.StrtNm = '';
					cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.BldgNb = '';
					cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.PstCd = '';
					cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.TwnNm = '';
					cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.CtrySubDvsn = '';
				} else {
					cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.StrtNm = objVendor.vbankaddrs1;
					cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.BldgNb = '';
					cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.PstCd = objVendor.vbankzip;
					cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.TwnNm = objVendor.vbankcity;
					cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.CtrySubDvsn = objVendor.vbankstate;
				}

				// cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.StrtNum = objVendor.vbankaddrs1;
				// cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.PstCd = objVendor.vbankzip;
				// cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.TwnNm = objVendor.vbankcity;
				// cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.BldgNb = '';
				// cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.CtrySubDvsn = objVendor.vbankstate;

				cdtTrfTxInfObj.Cdtr = {};
				cdtTrfTxInfObj.Cdtr.Nm = objVendor.vendorname;
				cdtTrfTxInfObj.Cdtr.PstlAdr = {};

				// if ( (isEmpty(objVendor.vendoraddrs1)) || (isEmpty(objVendor.vendorpostal)) || (isEmpty(objVendor.vendorcity)) || (isEmpty(objVendor.vendorstateprovince)) ) {
				// 	cdtTrfTxInfObj.Cdtr.PstlAdr.StrtNm = '';
				// 	cdtTrfTxInfObj.Cdtr.PstlAdr.BldgNb = "";
				// 	cdtTrfTxInfObj.Cdtr.PstlAdr.PstCd = '';
				// 	cdtTrfTxInfObj.Cdtr.PstlAdr.TwnNm = '';
				// 	cdtTrfTxInfObj.Cdtr.PstlAdr.CtrySubDvsn = '';
				// } else {
				// }
				cdtTrfTxInfObj.Cdtr.PstlAdr.StrtNm = objVendor.vendoraddrs1 || '';
				cdtTrfTxInfObj.Cdtr.PstlAdr.BldgNb = objVendor.vendoraddrs2 || '';
				cdtTrfTxInfObj.Cdtr.PstlAdr.PstCd = objVendor.vendorpostal || '';
				cdtTrfTxInfObj.Cdtr.PstlAdr.TwnNm = objVendor.vendorcity || '';
				cdtTrfTxInfObj.Cdtr.PstlAdr.CtrySubDvsn = objVendor.vendorstateprovince || '';

				// cdtTrfTxInfObj.Cdtr.PstlAdr.StrtNm = objVendor.vendoraddrs1;
				// cdtTrfTxInfObj.Cdtr.PstlAdr.BldgNb = objVendor.vendoraddrs2 || "";
				// cdtTrfTxInfObj.Cdtr.PstlAdr.PstCd = objVendor.vendorpostal;
				// cdtTrfTxInfObj.Cdtr.PstlAdr.TwnNm = objVendor.vendorcity;
				// cdtTrfTxInfObj.Cdtr.PstlAdr.CtrySubDvsn = objVendor.vendorstateprovince;
				cdtTrfTxInfObj.Cdtr.PstlAdr.Ctry = countryCodeMapping[objVendor.vendorcountrycode];

				var chars = objVendor.recpartyaccount.substring(0, 2);
				dAudit('CHECK for IBAN: objVendor.recpartyaccount', objVendor.recpartyaccount);
				if (isAlpha(chars)) {
					//IBAN

					cdtTrfTxInfObj.CdtrAcct = {};
					cdtTrfTxInfObj.CdtrAcct.Id = {};
					cdtTrfTxInfObj.CdtrAcct.Id.IBAN = objVendor.recpartyaccount;
				} else {
					cdtTrfTxInfObj.CdtrAcct = {};
					cdtTrfTxInfObj.CdtrAcct.Id = {};
					cdtTrfTxInfObj.CdtrAcct.Id.Othr = {};
					cdtTrfTxInfObj.CdtrAcct.Id.Othr.Id = objVendor.recpartyaccount;
				}

				// cdtTrfTxInfObj.RltdAmtInf = {};
				// cdtTrfTxInfObj.RltdAmtInf.RmtLctnMtd = objVendor.pmp_dac_contactname || "";
				// cdtTrfTxInfObj.RltdAmtInf.RmtLctnElctrncAdr = objVendor.pmp_dac_emailaddress || "";
				cdtTrfTxInfObj.RmtInf = {};
				cdtTrfTxInfObj.RmtInf.Ustrd = refnum;
				cdtTrfTxInfObj.RmtInf.Strd = Strd;

				CdtTrfTxInf.push(cdtTrfTxInfObj);
			}
		}
	}
	objects.CdtTrfTxInf = CdtTrfTxInf;

	dLog('objects', JSON.stringify(objects));

	var fileId = nlapiSearchRecord('file', null, [['name', 'is', 'ica_us_wire.xml']], []);
	if (fileId != null) {
		fileId = fileId[0].getId();
	}

	var tmplFile = nlapiLoadFile(fileId);

	var template = Handlebars.compile(tmplFile.getValue());
	var xmlDoc = template(objects);

	dLog('xmlDoc', xmlDoc);
	return xmlDoc;
}

function createCA_DAC_XMLDoc(objAcctMapping) {
	var arrTempBillIds = [];
	var arrBillCRIds = [];
	var arrBillAmt = [];
	var arrBillAmtOrig = [];
	var arrBillDiscAmt = [];
	var arrBillPayInfoCtr = [];
	var arrBillPayInfoSum = [];
	var arrGrpHdrNbOfTxs = [];
	var arrPmtInfNbOfTxs = [];
	var arrBillIds = [];
	var grpHdrNbOfTxs = 0;
	var grpHdrCtrlSum = 0;
	var arrPayeeIds = [];
	var _currencies = getCurrencies();

	for (x in arrBillsProcessed) {
		var billId = arrBillsProcessed[x].id;
		var billPaymentId = arrBillsProcessed[x].payment;

		dLog('createCA_DAC_XMLDoc', 'Bill info = ' + JSON.stringify(arrBillsProcessed[x]));
		if (!isEmpty(billPaymentId) && billPaymentId != 'XXXNONEXXX' && billPaymentId != 'CREDIT') {
			if (billPaymentId != 'CREDIT') arrTempBillIds.push(billId);

			var payMethod = arrBillsProcessed[x].paymethod;
			var paymentId = arrBillsProcessed[x].payment;
			var payeeId = arrBillsProcessed[x].payeeid;

			arrBillAmtOrig[billId] = arrBillsProcessed[x].origamt;
			// arrBillAmt[billId] = arrBillsProcessed[x].pay;
			arrBillAmt[billId] = arrBillsProcessed[x].payamt;
			arrBillDiscAmt[billId] = arrBillsProcessed[x].discamt;

			var ndx = payMethod + '@@' + paymentId;

			if (arrBillPayInfoCtr[payMethod] == null) arrBillPayInfoCtr[payMethod] = 0;
			if (arrBillPayInfoSum[payMethod] == null) arrBillPayInfoSum[payMethod] = 0;
			if (arrPmtInfNbOfTxs[ndx] == null) arrPmtInfNbOfTxs[ndx] = 0;

			if (paymentId && arrGrpHdrNbOfTxs[paymentId] == null) grpHdrNbOfTxs++;

			arrPmtInfNbOfTxs[ndx]++;
			arrBillPayInfoCtr[payMethod]++;
			arrBillPayInfoSum[payMethod] += getFloatVal(arrBillsProcessed[x].payamt);
			arrGrpHdrNbOfTxs[paymentId] = paymentId;

			grpHdrCtrlSum += getFloatVal(arrBillsProcessed[x].payamt);
		}

		if (billPaymentId == 'CREDIT') arrBillCRIds.push(billId);
	}

	var arrBillIds = [];
	var arrBillIds2 = [];
	var arrBillIds3 = [];
	var arrBillIds4 = [];
	var arrBillIds5 = [];

	for (vx in arrTempBillIds) {
		var isBC = false;

		for (var x in arrBillCRIds) {
			if (arrTempBillIds[vx] == arrBillCRIds[x]) {
				isBC = true;
				break;
			}
		}

		if (!isBC) {
			arrBillIds.push(arrTempBillIds[vx]);
			arrBillIds2.push(arrTempBillIds[vx]);
			arrBillIds3.push(arrTempBillIds[vx]);
			arrBillIds4.push(arrTempBillIds[vx]);
			arrBillIds5.push(arrTempBillIds[vx]);
		}
	}

	var arrBillCredits = getBillCredit(arrBillIds);
	var objBillsData = getBillData(arrBillIds2);
	var arrBillPO = getPOMap(arrBillIds3);
	var arrVendorBills = getPayeeBillsByPayMethod(arrBillIds4);
	var arrVendorBillsCurr = getPayeeBillsCurrency(arrBillIds5);
	var nsAcctSub = !isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('subsidiary', 'CUSTRECORD_ACCT_MAP_NETSUITE_ACCOUNT')) ? objAcctMapping[0].getValue('subsidiary', 'CUSTRECORD_ACCT_MAP_NETSUITE_ACCOUNT') : '';
	// var nsAcctSub
	var objVDCRecResults = getVendorDAC_CCRPaymentRec(nsAcctSub);
	dLog('objVDCRecResults', JSON.stringify(objVDCRecResults));
	dLog('objAcctMapping', JSON.stringify(objAcctMapping));

	//Gather data.
	var CdtTrfTxInf = [];

	var objects = {
		MsgId: 'TBD',
		CreDtTm: 'Test',
		Authstn: {
			Cd: '',
		},
		NbOfTxs: '2',
		CtrlSum: '2000',
		InitgPty: {
			Id: {
				OrgId: {
					Othr: {
						Id: '',
					},
				},
			},
		},
		PmtInfId: 'PmtInfId',
		PmtMtd: 'PmtMtd',
		PmtTpInf: {
			SvcLvl: {
				Cd: 'This is CD',
			},
		},
		ReqdExctnDt: 'ReqdExctnDt',
		Dbtr: {
			Nm: 'This is Nm',
			PstlAdr: {
				StrtNm: '',
				BldgNb: '',
				PstCd: '',
				TwnNm: '',
				CtrySubDvsn: '',
				Ctry: '',
			},
			Id: {
				Othr: {
					Id: 'Dbtr.Id.Othr.Id',
				},
			},
		},
		DbtrAcct: {
			Id: {
				Othr: {
					Id: 'DbtrAcct.Id.Othr.Id',
				},
			},
			PstlAdr: {
				StrtNm: '',
				BldgNb: '',
				PstCd: '',
				TwnNm: '',
				CtrySubDvsn: '',
				Ctry: '',
			},
		},
		DbtrAgt: {
			FinInstnId: {
				BIC: 'BIC',
				PstlAdr: {
					StrtNm: '',
					BldgNb: '',
					PstCd: '',
					TwnNm: '',
					CtrySubDvsn: '',
					Ctry: '',
				},
			},
		},
		CdtTrfTxInf: CdtTrfTxInf,
	};

	for (x in arrVendorBills) {
		var payeeId = x.split('X@X')[1];
		arrPayeeIds.push(payeeId);
	}

	var arrVendors = getEntityData(arrPayeeIds);

	var today = new Date();
	var bpmdate = BPM_DATE;
	var d = nlapiStringToDate(bpmdate, 'datetime');

	var fileCtrlNumber = moment(today).format('MMDDhhmmss'); //Date.create().format("{yy}{MM}{dd}{mm}{ss}");
	objects.MsgId = pad(fileCtrlNumber, 4);
	objects.CreDtTm = moment(d).format('YYYY-MM-DDThh:mm:ss') || today.format('{yyyy}-{MM}-{dd}T{hh}:{mm}:{ss}');
	objects.Authstn.Cd = 'FDET';
	objects.NbOfTxs = grpHdrNbOfTxs;
	objects.CtrlSum = grpHdrCtrlSum.toFixed(2); // Do we comment this out?

	if (objects.CtrlSum == '0.00') {
		dLog('CtrlSum is 0.00, this should not happen. Returning empty file', objects.CtrlSum);
		return '';
	}

	if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ceo_company_id'))) {
		objects.InitgPty.Id.OrgId.Othr.Id = objAcctMapping[0].getValue('custrecord_acct_map_ceo_company_id'); //CEO ID
	}

	for (x in arrBillPayInfoCtr) {
		objects.PmtInfId = fileCtrlNumber;
		var paymentMethod = x;
		objects.PmtMtd = 'TRF';

		objects.PmtTpInf.SvcLvl.Cd = paymentMethod == 'DAC' ? 'NURG' : 'URGP';
		objects.ReqdExctnDt = moment(d).format('YYYY-MM-DD') || today.format('{yyyy}-{MM}-{dd}');

		if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_companyname'))) objects.Dbtr.Nm = objVDCRecResults[0].getValue('custrecord_companyname');

		//PstlAdr
		var country = !isEmpty(objVDCRecResults) ? objVDCRecResults[0].getValue('custrecord_compcountrycode') : '';

		if (
			(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_comppostcode'))) ||
			(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compcity'))) ||
			(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compstateprov'))) ||
			(!isEmpty(objVDCRecResults) && objVDCRecResults[0].getValue('custrecord_compcountrycode')) ||
			(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compadd1')))
		) {
			if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compadd1'))) {
				objects.Dbtr.PstlAdr.StrtNm = '<StrtNm>' + objVDCRecResults[0].getValue('custrecord_compadd1') + '</StrtNm>';
			}
			if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compadd2'))) {
				objects.Dbtr.PstlAdr.BldgNb = '<BldgNb>' + objVDCRecResults[0].getValue('custrecord_compadd2') + '</BldgNb>';
			}

			if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_comppostcode'))) {
				objects.Dbtr.PstlAdr.PstCd = '<PstCd>' + objVDCRecResults[0].getValue('custrecord_comppostcode') + '</PstCd>';
			}
			// addTextNodeFromParentNode(xmlDoc, pstlAdr, 'PstCd', objVDCRecResults[0].getValue('custrecord_comppostcode'));

			if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compcity'))) {
				objects.Dbtr.PstlAdr.TwnNm = '<TwnNm>' + objVDCRecResults[0].getValue('custrecord_compcity') + '</TwnNm>';
			}
			// addTextNodeFromParentNode(xmlDoc, pstlAdr, 'TwnNm', objVDCRecResults[0].getValue('custrecord_compcity'));

			//Where do we get CtrySubDvsn?
			if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compstateprov'))) {
				objects.Dbtr.PstlAdr.TwnNm = '<CtrySubDvsn>' + objVDCRecResults[0].getValue('custrecord_compstateprov') + '</CtrySubDvsn>';
			}

			// addTextNodeFromParentNode(xmlDoc, pstlAdr, 'Ctry', country);
			if (country) {
				objects.Dbtr.PstlAdr.Ctry = '<Ctry>' + country + '</Ctry>';
			}
			dLog('Added Ctry', JSON.stringify(objects));

			// addTextNodeFromParentNode(xmlDoc, pstlAdr, 'AdrLine', objVDCRecResults[0].getValue('custrecord_compadd1'));
			// objects.Dbtr.PstlAdr.BldgNb = '2'; not used
		}

		if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_dom_ach_co_id'))) {
			objects.Dbtr.Id = {};
			objects.Dbtr.Id.Othr = {};
			objects.Dbtr.Id.Othr.Id = objAcctMapping[0].getValue('custrecord_acct_map_dom_ach_co_id'); //ACH Company ID
		}

		//DbtrAcct
		if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_origin_acc'))) {
			objects.DbtrAcct = {};
			objects.DbtrAcct.Id = {};
			objects.DbtrAcct.Id.Othr = {};
			objects.DbtrAcct.Id.Othr.Id = objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_origin_acc'); // Bank Account Number
		}

		//DbtrAgt
		if ((!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id'))) || !isEmpty(country)) {
			if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id'))) {
				// objects.DbtrAgt.FinInstnId.BIC = objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id');

				objects.DbtrAgt = {};
				objects.DbtrAgt.Nm = objVDCRecResults[0].getValue('custrecord_bankname') || '';
				objects.DbtrAgt.FinInstnId = {};
				objects.DbtrAgt.FinInstnId.ClrSysMmbId = {};
				objects.DbtrAgt.FinInstnId.ClrSysMmbId.MmbId = objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id'); // Routing Number 10 Digit
			}
			objects.DbtrAgt.FinInstnId.PstlAdr = {};
			objects.DbtrAgt.FinInstnId.PstlAdr.Ctry = 'CA';
		}

		//CdtTrfTxInf loop starts here.

		if (SINGLEBILLPYMTS == 'T') {
			dAudit('Create Single Bill Payments here.', JSON.stringify(arrBillsProcessed));

			for (var i = 0; i < arrBillsProcessed.length; i++) {
				var billPayment = arrBillsProcessed[i];

				if (billPayment.payment == 'CREDIT') {
					continue;
				}

				var symbol = '';

				try {
					symbol = _.find(_currencies, { internalid: String(billPayment.currid) }).symbol;
				} catch (e) {}

				var objVendor = arrVendors[billPayment.payeeid];
				if (!objVendor) objVendor = _.find(arrVendors, { internalid: String(billPayment.payeeid) });

				dLog('objVendor', JSON.stringify(objVendor));

				var cdtTrfTxInfObj = {};
				cdtTrfTxInfObj.PmtId = {};

				var refnum = billPayment.refnum; //arrBillPaymentMap[billPayment.payeeid];
				// var refnum = billPayment.billnum; //arrBillPaymentMap[billPayment.payeeid];
				var instrId = '';
				if (refnum.length > 12) {
					instrId = pz(refnum.substring(refnum.length - 12, refnum.length), 12);
				} else {
					instrId = pz(refnum, 12);
				}
				refnum = billPayment.billnum; //Overwrite endToendID
				var endToEndId = refnum;
				if (refnum.length > 18) {
					endToEndId = refnum.substr(0, 18);
				}

				cdtTrfTxInfObj.PmtId.InstrId = instrId;
				cdtTrfTxInfObj.PmtId.EndToEndId = endToEndId;
				cdtTrfTxInfObj.Amt = {};
				cdtTrfTxInfObj.Amt.value = billPayment.payamt; //amt.toFixed(2);
				cdtTrfTxInfObj.Amt.Ccy = symbol;
				// cdtTrfTxInfObj.ChrgBr = (billPayment.paymethod == 'AUCR') ? 'CRED' : 'DEBT';

				cdtTrfTxInfObj.CdtrAgt = {};
				cdtTrfTxInfObj.CdtrAgt.FinInstnId = {};
				// cdtTrfTxInfObj.CdtrAgt.FinInstnId.BIC = objVendor.recbankprimid;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.ClrSysMmbId = {};
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.ClrSysMmbId.MmbId = objVendor.recbankprimid; //objVendor.bankid; // Receiving Bank Routing
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.Nm = objVendor.vbankname;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr = {};
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.Ctry = countryCodeMapping[objVendor.vbankcountry];
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.AdrLine = objVendor.vbankaddrs1;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.StrtNm = objVendor.vbankaddrs1;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.BldgNb = '';
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.PstCd = objVendor.vbankzip;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.TwnNm = objVendor.vbankcity;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.CtrySubDvsn = objVendor.vbankstate;

				cdtTrfTxInfObj.Cdtr = {};
				cdtTrfTxInfObj.Cdtr.Nm = objVendor.vendorname;
				cdtTrfTxInfObj.Cdtr.PstlAdr = {};
				cdtTrfTxInfObj.Cdtr.PstlAdr.StrtNm = objVendor.vendoraddrs1;
				cdtTrfTxInfObj.Cdtr.PstlAdr.BldgNb = objVendor.vendoraddrs2 || '';
				cdtTrfTxInfObj.Cdtr.PstlAdr.PstCd = objVendor.vendorpostal;
				cdtTrfTxInfObj.Cdtr.PstlAdr.TwnNm = objVendor.vendorcity;
				cdtTrfTxInfObj.Cdtr.PstlAdr.CtrySubDvsn = objVendor.vendorstateprovince;
				cdtTrfTxInfObj.Cdtr.PstlAdr.Ctry = countryCodeMapping[objVendor.vendorcountrycode];

				cdtTrfTxInfObj.CdtrAcct = {};
				cdtTrfTxInfObj.CdtrAcct.Id = {};
				cdtTrfTxInfObj.CdtrAcct.Id.Othr = {};
				cdtTrfTxInfObj.CdtrAcct.Id.Othr.Id = objVendor.recpartyaccount;

				// cdtTrfTxInfObj.RltdAmtInf = {};
				// cdtTrfTxInfObj.RltdAmtInf.RmtLctnMtd = objVendor.pmp_dac_contactname || "";
				// cdtTrfTxInfObj.RltdAmtInf.RmtLctnElctrncAdr = objVendor.pmp_dac_emailaddress || "";
				cdtTrfTxInfObj.RmtInf = {};
				cdtTrfTxInfObj.RmtInf.Ustrd = refnum;
				cdtTrfTxInfObj.RmtInf.Strd = Strd;

				CdtTrfTxInf.push(cdtTrfTxInfObj);
			}
		} else {
			dAudit('arrVendorBills', arrVendorBills);
			var refnum = '';
			var currency = '';
			var symbol = '';

			for (v in arrVendorBills) {
				var arrPayeeInfo = v.split('X@X');
				var payeeId = arrPayeeInfo[1];

				//var objVendor=arrVendors[payeeId];
				       var objVendor = _.find(arrVendors, { internalid: String(payeeId)});
				// var objVendor = _.find(arrVendors, { internalid: String(payeeId), paymentmethod: String(paymentMethod) })[0];
dAudit('objVendor-new', objVendor);				dLog('objVendor', JSON.stringify(objVendor));

				if (isEmpty(objVendor)) continue;

				var pmtMethod = objVendor.paymentmethod;

				if (paymentMethod != pmtMethod) continue;

				var arrBills = arrVendorBills[paymentMethod + 'X@X' + payeeId];
				dLog('arrBills', JSON.stringify(arrBills));
				var tmpAmt = 0;

				var numberOfBills = _.size(arrBills);
				for (by in arrBills) {
					var billId = arrBills[by];
					refnum = _.find(arrBillsProcessed, { id: String(billId) }).refnum;
					currency = _.find(arrBillsProcessed, { id: String(billId) }).currid;
					subtext = _.find(arrBillsProcessed, { id: String(billId) }).subtext;
					billnum = _.find(arrBillsProcessed, { id: String(billId) }).billnum;

					dLog('billnum', billnum);

					try {
						symbol = _.find(_currencies, { internalid: String(currency) }).symbol;
					} catch (e) {}
					dLog('createCA_DAC_XMLDoc', JSON.stringify(refnum));

					var netAmt = 0;
					var origAmt = getFloatVal(arrBillAmtOrig[billId]);
					var amt = getFloatVal(arrBillAmt[billId]);

					var discAmt = !isEmpty(arrBillDiscAmt[billId]) ? getFloatVal(arrBillDiscAmt[billId]) : 0;

					dLog(
						'amounts',
						JSON.stringify({
							netAmt: netAmt,
							origAmt: origAmt,
							amt: amt,
							discAmt: discAmt,
						})
					);

					netAmt = origAmt;
					tmpAmt += amt; //used to be netAmt

					if (discAmt > 0) {
						netAmt -= discAmt;
						tmpAmt -= discAmt;
					}

					if (!isEmpty(arrBillCredits[billId])) {
						var arrBC = arrBillCredits[billId];

						dLog('arrBC in arrBills', JSON.stringify(arrBC));

						for (bc in arrBC) {
							var billCreditAmtP = getFloatVal(arrBC[bc].bcamt);
							var billCreditAmt = billCreditAmtP * -1;

							// tmpAmt = (tmpAmt - billCreditAmtP);
							netAmt = netAmt - billCreditAmtP;
						}
					}
				}

				var cdtTrfTxInfObj = {};
				cdtTrfTxInfObj.PmtId = {};

				var refnum = arrBillPaymentMap[payeeId];
				var instrId = '';
				if (refnum.length > 12) {
					instrId = pz(refnum.substring(refnum.length - 12, refnum.length), 12);
				} else {
					instrId = pz(refnum, 12);
				}

				// var endToEndId = billnum.substr(0, 18);
				var endToEndId = refnum.substr(0, 18);
				// if (numberOfBills > 1) {
				// 	endToEndId = subtext.substr(0, 18);
				// }
				//refnum

				cdtTrfTxInfObj.PmtId.InstrId = instrId;
				cdtTrfTxInfObj.PmtId.EndToEndId = endToEndId;
				cdtTrfTxInfObj.Amt = {};
				cdtTrfTxInfObj.Amt.value = tmpAmt.toFixed(2); //amt.toFixed(2);
				cdtTrfTxInfObj.Amt.Ccy = symbol;
				// cdtTrfTxInfObj.ChrgBr = (paymentMethod == 'AUCR') ? 'CRED' : 'DEBT';

				tmpAmt = 0; // need to initialize back to 0

				var Strd = [];

				for (y in arrBills) {
					var billId = arrBills[y];
					var StrdObj = {};
					StrdObj.RfrdDocInf = {};
					StrdObj.RfrdDocInf.Tp = {};
					StrdObj.RfrdDocInf.Tp.CdOrPrtry = {};
					StrdObj.RfrdDocInf.Tp.CdOrPrtry.Cd = 'CINV'; //Hardcoded?

					var netAmt = 0;
					var origAmt = getFloatVal(arrBillAmtOrig[billId]);
					var amt = getFloatVal(arrBillAmt[billId]);

					var discAmt = !isEmpty(arrBillDiscAmt[billId]) ? getFloatVal(arrBillDiscAmt[billId]) : 0;

					dLog('billId before', billId);
					dLog('arrBC in y.arrBills before', JSON.stringify(arrBillCredits));

					if (!isEmpty(arrBillCredits[billId])) {
						var arrBC = arrBillCredits[billId];

						dLog('arrBC in y.arrBills', JSON.stringify(arrBC));

						for (bc in arrBC) {
							var billCreditAmtP = getFloatVal(arrBC[bc].bcamt);
							var billCreditAmt = billCreditAmtP * -1;

							// tmpAmt = (tmpAmt - billCreditAmtP);
							netAmt = netAmt - billCreditAmtP;
						}
					}

					// tmpAmt += amt;
					netAmt = origAmt;
					tmpAmt += amt; //used to be netAmt

					if (discAmt > 0) {
						netAmt -= discAmt;
						tmpAmt -= discAmt;
					}

					dLog('createCA_DAC_XMLDoc. objBillsData', JSON.stringify(objBillsData[billId]));

					if (!isEmpty(objBillsData[billId].num)) {
						StrdObj.RfrdDocInf.Nb = objBillsData[billId].num;
					} else if (!isEmpty(objBillsData[billId].trnxnumber)) {
						StrdObj.RfrdDocInf.Nb = objBillsData[billId].trnxnumber;
					}

					var invoiceDate = objBillsData[billId].dte;
					StrdObj.RfrdDocInf.RltdDt = formatDate(nlapiStringToDate(invoiceDate));
					StrdObj.RfrdDocAmt = {};
					StrdObj.RfrdDocAmt.DuePyblAmt = {};
					StrdObj.RfrdDocAmt.DscntApldAmt = {};
					StrdObj.RfrdDocAmt.RmtdAmt = {};
					StrdObj.RfrdDocAmt.DuePyblAmt.value = origAmt.toFixed(2);

					if (discAmt == 0) discAmt = '';
					else discAmt = discAmt.toFixed(2);

					StrdObj.RfrdDocAmt.DscntApldAmt.value = discAmt;
					StrdObj.RfrdDocAmt.RmtdAmt.value = netAmt.toFixed(2);

					StrdObj.RfrdDocAmt.DuePyblAmt.Ccy = symbol;
					StrdObj.RfrdDocAmt.DscntApldAmt.Ccy = symbol;
					StrdObj.RfrdDocAmt.RmtdAmt.Ccy = symbol;

					//Add CDtrRefInf
					StrdObj.CdtrRefInf = {};
					StrdObj.CdtrRefInf.Tp = {};
					StrdObj.CdtrRefInf.CdOrPrtry = {};
					StrdObj.CdtrRefInf.CdOrPrtry.Cd = 'PUOR';

					Strd.push(StrdObj);

					if (!isEmpty(arrBillCredits[billId])) {
						var arrBC = arrBillCredits[billId];

						for (bc in arrBC) {
							var billCreditAmtP = getFloatVal(arrBC[bc].bcamt);
							var billCreditAmt = billCreditAmtP;

							tmpAmt = tmpAmt - billCreditAmtP;
							netAmt = netAmt - billCreditAmtP;

							var StrdObj = {};
							StrdObj.RfrdDocInf = {};
							StrdObj.RfrdDocInf.Tp = {};
							StrdObj.RfrdDocInf.Tp.CdOrPrtry = {};
							StrdObj.RfrdDocInf.Tp.CdOrPrtry.Cd = 'CREN'; //Hardcoded?

							var bcNum = arrBC[bc].bcnum;
							dLog('createJPMXMLDoc', 'VC number : ' + bcNum);

							if (!isEmpty(bcNum)) StrdObj.RfrdDocInf.Nb = bcNum;
							else if (!isEmpty(arrBillCredits[billId].bcmemo)) {
								StrdObj.RfrdDocInf.Nb = arrBillCredits[billId].bcmemo;
							}

							var invoiceDate = objBillsData[billId].dte;
							StrdObj.RfrdDocInf.RltdDt = formatDate(nlapiStringToDate(arrBC[bc].bcdate));

							StrdObj.RfrdDocAmt = {};
							StrdObj.RfrdDocAmt.DuePyblAmt = {};
							StrdObj.RfrdDocAmt.DscntApldAmt = {};
							StrdObj.RfrdDocAmt.CdtNoteAmt = {};

							StrdObj.RfrdDocAmt.DuePyblAmt.value = billCreditAmt.toFixed(2);
							if (discAmt == 0) discAmt = '';
							else discAmt = discAmt.toFixed(2);

							StrdObj.RfrdDocAmt.DscntApldAmt.value = discAmt;
							StrdObj.RfrdDocAmt.CdtNoteAmt.value = billCreditAmt.toFixed(2);

							StrdObj.RfrdDocAmt.DuePyblAmt.Ccy = symbol;
							StrdObj.RfrdDocAmt.DscntApldAmt.Ccy = symbol;
							StrdObj.RfrdDocAmt.CdtNoteAmt.Ccy = symbol;

							Strd.push(StrdObj);
						}
					}
				}

				cdtTrfTxInfObj.CdtrAgt = {};
				cdtTrfTxInfObj.CdtrAgt.FinInstnId = {};
				// cdtTrfTxInfObj.CdtrAgt.FinInstnId.BIC = objVendor.recbankprimid;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.ClrSysMmbId = {};
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.ClrSysMmbId.MmbId = objVendor.recbankprimid; // Receiving Bank Routing
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.Nm = objVendor.vbankname;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr = {};
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.Ctry = countryCodeMapping[objVendor.vbankcountry];
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.AdrLine = objVendor.vbankaddrs1;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.StrtNm = objVendor.vbankaddrs1;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.PstCd = objVendor.vbankzip;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.TwnNm = objVendor.vbankcity;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.BldgNb = '';
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.CtrySubDvsn = objVendor.vbankstate;

				cdtTrfTxInfObj.Cdtr = {};
				cdtTrfTxInfObj.Cdtr.Nm = objVendor.vendorname;
				cdtTrfTxInfObj.Cdtr.PstlAdr = {};
				cdtTrfTxInfObj.Cdtr.PstlAdr.StrtNm = objVendor.vendoraddrs1;
				cdtTrfTxInfObj.Cdtr.PstlAdr.BldgNb = objVendor.vendoraddrs2 || '';
				cdtTrfTxInfObj.Cdtr.PstlAdr.PstCd = objVendor.vendorpostal;
				cdtTrfTxInfObj.Cdtr.PstlAdr.TwnNm = objVendor.vendorcity;
				cdtTrfTxInfObj.Cdtr.PstlAdr.CtrySubDvsn = objVendor.vendorstateprovince;
				cdtTrfTxInfObj.Cdtr.PstlAdr.Ctry = countryCodeMapping[objVendor.vendorcountrycode];

				cdtTrfTxInfObj.CdtrAcct = {};
				cdtTrfTxInfObj.CdtrAcct.Id = {};
				cdtTrfTxInfObj.CdtrAcct.Id.Othr = {};
				cdtTrfTxInfObj.CdtrAcct.Id.Othr.Id = objVendor.recpartyaccount;

				// cdtTrfTxInfObj.RltdAmtInf = {};
				// cdtTrfTxInfObj.RltdAmtInf.RmtLctnMtd = objVendor.pmp_dac_contactname || "";
				// cdtTrfTxInfObj.RltdAmtInf.RmtLctnElctrncAdr = objVendor.pmp_dac_emailaddress || "";
				cdtTrfTxInfObj.RmtInf = {};
				cdtTrfTxInfObj.RmtInf.Ustrd = refnum;
				cdtTrfTxInfObj.RmtInf.Strd = Strd;

				CdtTrfTxInf.push(cdtTrfTxInfObj);
			}
		}
	}
	objects.CdtTrfTxInf = CdtTrfTxInf;

	dLog('objects', JSON.stringify(objects));

	var fileId = nlapiSearchRecord('file', null, [['name', 'is', 'ica_ca_dac.xml']], []);
	if (fileId != null) {
		fileId = fileId[0].getId();
	}

	var tmplFile = nlapiLoadFile(fileId);

	var template = Handlebars.compile(tmplFile.getValue());
	var xmlDoc = template(objects);

	dLog('xmlDoc', xmlDoc);
	return xmlDoc;
}

function createCA_MTS_XMLDoc(objAcctMapping) {
	var arrTempBillIds = [];
	var arrBillCRIds = [];
	var arrBillAmt = [];
	var arrBillAmtOrig = [];
	var arrBillDiscAmt = [];
	var arrBillPayInfoCtr = [];
	var arrBillPayInfoSum = [];
	var arrGrpHdrNbOfTxs = [];
	var arrPmtInfNbOfTxs = [];
	var arrBillIds = [];
	var grpHdrNbOfTxs = 0;
	var grpHdrCtrlSum = 0;
	var arrPayeeIds = [];
	var _currencies = getCurrencies();

	for (x in arrBillsProcessed) {
		var billId = arrBillsProcessed[x].id;
		var billPaymentId = arrBillsProcessed[x].payment;

		dLog('createCA_MTS_XMLDoc', 'Bill info = ' + JSON.stringify(arrBillsProcessed[x]));
		if (!isEmpty(billPaymentId) && billPaymentId != 'XXXNONEXXX' && billPaymentId != 'CREDIT') {
			if (billPaymentId != 'CREDIT') arrTempBillIds.push(billId);

			var payMethod = arrBillsProcessed[x].paymethod;
			var paymentId = arrBillsProcessed[x].payment;
			var payeeId = arrBillsProcessed[x].payeeid;

			arrBillAmtOrig[billId] = arrBillsProcessed[x].origamt;
			// arrBillAmt[billId] = arrBillsProcessed[x].pay;
			arrBillAmt[billId] = arrBillsProcessed[x].payamt;
			arrBillDiscAmt[billId] = arrBillsProcessed[x].discamt;

			var ndx = payMethod + '@@' + paymentId;

			if (arrBillPayInfoCtr[payMethod] == null) arrBillPayInfoCtr[payMethod] = 0;
			if (arrBillPayInfoSum[payMethod] == null) arrBillPayInfoSum[payMethod] = 0;
			if (arrPmtInfNbOfTxs[ndx] == null) arrPmtInfNbOfTxs[ndx] = 0;

			if (paymentId && arrGrpHdrNbOfTxs[paymentId] == null) grpHdrNbOfTxs++;

			arrPmtInfNbOfTxs[ndx]++;
			arrBillPayInfoCtr[payMethod]++;
			arrBillPayInfoSum[payMethod] += getFloatVal(arrBillsProcessed[x].payamt);
			arrGrpHdrNbOfTxs[paymentId] = paymentId;

			grpHdrCtrlSum += getFloatVal(arrBillsProcessed[x].payamt);
		}

		if (billPaymentId == 'CREDIT') arrBillCRIds.push(billId);
	}

	var arrBillIds = [];
	var arrBillIds2 = [];
	var arrBillIds3 = [];
	var arrBillIds4 = [];
	var arrBillIds5 = [];

	for (vx in arrTempBillIds) {
		var isBC = false;

		for (var x in arrBillCRIds) {
			if (arrTempBillIds[vx] == arrBillCRIds[x]) {
				isBC = true;
				break;
			}
		}

		if (!isBC) {
			arrBillIds.push(arrTempBillIds[vx]);
			arrBillIds2.push(arrTempBillIds[vx]);
			arrBillIds3.push(arrTempBillIds[vx]);
			arrBillIds4.push(arrTempBillIds[vx]);
			arrBillIds5.push(arrTempBillIds[vx]);
		}
	}

	var arrBillCredits = getBillCredit(arrBillIds);
	var objBillsData = getBillData(arrBillIds2);
	var arrBillPO = getPOMap(arrBillIds3);
	var arrVendorBills = getPayeeBillsByPayMethod(arrBillIds4);
	var arrVendorBillsCurr = getPayeeBillsCurrency(arrBillIds5);
	var nsAcctSub = !isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('subsidiary', 'CUSTRECORD_ACCT_MAP_NETSUITE_ACCOUNT')) ? objAcctMapping[0].getValue('subsidiary', 'CUSTRECORD_ACCT_MAP_NETSUITE_ACCOUNT') : '';
	var objVDCRecResults = getVendorDAC_CCRPaymentRec(nsAcctSub);
	dLog('objVDCRecResults', JSON.stringify(objVDCRecResults));
	dLog('objAcctMapping', JSON.stringify(objAcctMapping));

	//Gather data.
	var CdtTrfTxInf = [];

	var objects = {
		MsgId: 'TBD',
		CreDtTm: 'Test',
		Authstn: {
			Cd: '',
		},
		NbOfTxs: '2',
		CtrlSum: '2000',
		InitgPty: {
			Id: {
				OrgId: {
					Othr: {
						Id: '',
					},
				},
			},
		},
		PmtInfId: 'PmtInfId',
		PmtMtd: 'PmtMtd',
		PmtTpInf: {
			SvcLvl: {
				Cd: 'This is CD',
			},
		},
		ReqdExctnDt: 'ReqdExctnDt',
		Dbtr: {
			Nm: 'This is Nm',
			PstlAdr: {
				StrtNm: '',
				BldgNb: '',
				PstCd: '',
				TwnNm: '',
				CtrySubDvsn: '',
				Ctry: '',
			},
			Id: {
				Othr: {
					Id: 'Dbtr.Id.Othr.Id',
				},
			},
		},
		DbtrAcct: {
			Id: {
				Othr: {
					Id: 'DbtrAcct.Id.Othr.Id',
				},
			},
			PstlAdr: {
				StrtNm: '',
				BldgNb: '',
				PstCd: '',
				TwnNm: '',
				CtrySubDvsn: '',
				Ctry: '',
			},
		},
		DbtrAgt: {
			FinInstnId: {
				BIC: 'BIC',
				PstlAdr: {
					StrtNm: '',
					BldgNb: '',
					PstCd: '',
					TwnNm: '',
					CtrySubDvsn: '',
					Ctry: '',
				},
			},
		},
		CdtTrfTxInf: CdtTrfTxInf,
	};

	for (x in arrVendorBills) {
		var payeeId = x.split('X@X')[1];
		arrPayeeIds.push(payeeId);
	}

	var arrVendors = getEntityData(arrPayeeIds);

	var today = new Date();
	var bpmdate = BPM_DATE;
	var d = nlapiStringToDate(bpmdate, 'datetime');

	var fileCtrlNumber = moment(today).format('MMDDhhmmss'); //Date.create().format("{yy}{MM}{dd}{mm}{ss}");
	objects.MsgId = pad(fileCtrlNumber, 4);
	objects.CreDtTm = moment(d).format('YYYY-MM-DDThh:mm:ss') || today.format('{yyyy}-{MM}-{dd}T{hh}:{mm}:{ss}');
	objects.Authstn.Cd = 'FDET'; // Changed from AUTH
	objects.NbOfTxs = grpHdrNbOfTxs;
	objects.CtrlSum = grpHdrCtrlSum.toFixed(2); // Do we comment this out?

	if (objects.CtrlSum == '0.00') {
		dLog('CtrlSum is 0.00, this should not happen. Returning empty file', objects.CtrlSum);
		return '';
	}

	if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ceo_company_id'))) {
		objects.InitgPty.Id.OrgId.Othr.Id = objAcctMapping[0].getValue('custrecord_acct_map_ceo_company_id'); //CEO ID
	}

	for (x in arrBillPayInfoCtr) {
		objects.PmtInfId = fileCtrlNumber;
		var paymentMethod = x;
		objects.PmtMtd = 'TRF';

		objects.PmtTpInf.SvcLvl.Cd = paymentMethod == 'MTS' ? 'URGP' : 'NURG';
		objects.ReqdExctnDt = moment(d).format('YYYY-MM-DD') || today.format('{yyyy}-{MM}-{dd}');

		if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_companyname'))) objects.Dbtr.Nm = objVDCRecResults[0].getValue('custrecord_companyname');

		//PstlAdr
		var country = !isEmpty(objVDCRecResults) ? objVDCRecResults[0].getValue('custrecord_compcountrycode') : '';

		if (
			(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_comppostcode'))) ||
			(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compcity'))) ||
			(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compstateprov'))) ||
			(!isEmpty(objVDCRecResults) && objVDCRecResults[0].getValue('custrecord_compcountrycode')) ||
			(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compadd1')))
		) {
			if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compadd1'))) {
				objects.Dbtr.PstlAdr.StrtNm = '<StrtNm>' + objVDCRecResults[0].getValue('custrecord_compadd1') + '</StrtNm>';
			}
			if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compadd2'))) {
				objects.Dbtr.PstlAdr.BldgNb = '<BldgNb>' + objVDCRecResults[0].getValue('custrecord_compadd2') + '</BldgNb>';
			}

			if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_comppostcode'))) {
				objects.Dbtr.PstlAdr.PstCd = '<PstCd>' + objVDCRecResults[0].getValue('custrecord_comppostcode') + '</PstCd>';
			}
			// addTextNodeFromParentNode(xmlDoc, pstlAdr, 'PstCd', objVDCRecResults[0].getValue('custrecord_comppostcode'));

			if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compcity'))) {
				objects.Dbtr.PstlAdr.TwnNm = '<TwnNm>' + objVDCRecResults[0].getValue('custrecord_compcity') + '</TwnNm>';
			}
			// addTextNodeFromParentNode(xmlDoc, pstlAdr, 'TwnNm', objVDCRecResults[0].getValue('custrecord_compcity'));

			//Where do we get CtrySubDvsn?
			if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compstateprov'))) {
				objects.Dbtr.PstlAdr.CtrySubDvsn = '<CtrySubDvsn>' + objVDCRecResults[0].getValue('custrecord_compstateprov') + '</CtrySubDvsn>';
			}

			// addTextNodeFromParentNode(xmlDoc, pstlAdr, 'Ctry', country);
			if (country) {
				objects.Dbtr.PstlAdr.Ctry = '<Ctry>' + country + '</Ctry>';
			}
			dLog('Added Ctry', JSON.stringify(objects));

			// addTextNodeFromParentNode(xmlDoc, pstlAdr, 'AdrLine', objVDCRecResults[0].getValue('custrecord_compadd1'));
			// objects.Dbtr.PstlAdr.BldgNb = '2'; not used
		}

		if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_dom_ach_co_id'))) {
			objects.Dbtr.Id = {};
			objects.Dbtr.Id.Othr = {};
			objects.Dbtr.Id.Othr.Id = objAcctMapping[0].getValue('custrecord_acct_map_dom_ach_co_id'); //ACH Company ID
		}

		//DbtrAcct
		if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_origin_acc'))) {
			objects.DbtrAcct = {};
			objects.DbtrAcct.Id = {};
			objects.DbtrAcct.Id.Othr = {};
			objects.DbtrAcct.Id.Othr.Id = objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_origin_acc'); // Bank Account Number
		}

		//DbtrAgt
		if ((!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id'))) || !isEmpty(country)) {
			objects.DbtrAgt = {};
			objects.DbtrAgt.FinInstnId = {};
			if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_hsbc_swift_bank_id'))) {
				objects.DbtrAgt.FinInstnId.BIC = objAcctMapping[0].getValue('custrecord_acct_map_hsbc_swift_bank_id');
			}
			if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id'))) {
				objects.DbtrAgt.FinInstnId.ClrSysMmbId = {};
				objects.DbtrAgt.FinInstnId.ClrSysMmbId.MmbId = objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id'); // Routing Number 10 Digit
			}
			objects.DbtrAgt.FinInstnId.PstlAdr = {};
			objects.DbtrAgt.FinInstnId.PstlAdr.Ctry = country;
		}

		//CdtTrfTxInf loop starts here.

		if (SINGLEBILLPYMTS == 'T') {
			dAudit('Create Single Bill Payments here.', JSON.stringify(arrBillsProcessed));

			for (var i = 0; i < arrBillsProcessed.length; i++) {
				var billPayment = arrBillsProcessed[i];

				if (billPayment.payment == 'CREDIT') {
					continue;
				}

				var symbol = '';

				try {
					symbol = _.find(_currencies, { internalid: String(billPayment.currid) }).symbol;
				} catch (e) {}

				var objVendor = arrVendors[billPayment.payeeid];
				if (!objVendor) objVendor = _.find(arrVendors, { internalid: String(billPayment.payeeid) });

				dLog('objVendor', JSON.stringify(objVendor));

				var cdtTrfTxInfObj = {};
				cdtTrfTxInfObj.PmtId = {};

				var refnum = billPayment.refnum; //arrBillPaymentMap[billPayment.payeeid];
				// var refnum = billPayment.billnum; //arrBillPaymentMap[billPayment.payeeid];
				var instrId = '';
				if (refnum.length > 12) {
					instrId = pz(refnum.substring(refnum.length - 12, refnum.length), 12);
				} else {
					instrId = pz(refnum, 12);
				}
				refnum = billPayment.billnum; //Overwrite endToendID
				var endToEndId = refnum;
				if (refnum.length > 18) {
					endToEndId = refnum.substr(0, 18);
				}

				cdtTrfTxInfObj.PmtId.InstrId = instrId;
				cdtTrfTxInfObj.PmtId.EndToEndId = endToEndId;
				cdtTrfTxInfObj.Amt = {};
				cdtTrfTxInfObj.Amt.value = billPayment.payamt; //amt.toFixed(2);
				cdtTrfTxInfObj.Amt.Ccy = symbol;
				cdtTrfTxInfObj.ChrgBr = 'CRED';

				cdtTrfTxInfObj.CdtrAgt = {};
				cdtTrfTxInfObj.CdtrAgt.FinInstnId = {};
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.BIC = objVendor.recbankprimid;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.ClrSysMmbId = {};
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.ClrSysMmbId.MmbId = objVendor.bankid; //objVendor.recbankprimid;// objVendor.bankid; // Receiving Bank Routing
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.Nm = objVendor.vbankname;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr = {};
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.Ctry = countryCodeMapping[objVendor.vbankcountry];
				// cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.AdrLine = objVendor.vbankaddrs1;

				if (isEmpty(objVendor.vbankaddrs1) || isEmpty(objVendor.vbankzip) || isEmpty(objVendor.vbankcity) || isEmpty(objVendor.vbankstate)) {
					cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.StrtNm = '';
					cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.BldgNb = '';
					cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.PstCd = '';
					cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.TwnNm = '';
					cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.CtrySubDvsn = '';
				} else {
					cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.StrtNm = objVendor.vbankaddrs1;
					cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.BldgNb = '';
					cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.PstCd = objVendor.vbankzip;
					cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.TwnNm = objVendor.vbankcity;
					cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.CtrySubDvsn = objVendor.vbankstate;
				}

				cdtTrfTxInfObj.Cdtr = {};
				cdtTrfTxInfObj.Cdtr.Nm = objVendor.vendorname;
				cdtTrfTxInfObj.Cdtr.PstlAdr = {};
				if (isEmpty(objVendor.vendoraddrs1) || isEmpty(objVendor.vendorpostal) || isEmpty(objVendor.vendorcity) || isEmpty(objVendor.vendorstateprovince)) {
					dLog('Here, should be empty', JSON.stringify(objVendor));
					cdtTrfTxInfObj.Cdtr.PstlAdr.StrtNm = '';
					cdtTrfTxInfObj.Cdtr.PstlAdr.BldgNb = '';
					cdtTrfTxInfObj.Cdtr.PstlAdr.PstCd = '';
					cdtTrfTxInfObj.Cdtr.PstlAdr.TwnNm = '';
					cdtTrfTxInfObj.Cdtr.PstlAdr.CtrySubDvsn = '';
				} else {
					dLog('Here?', JSON.stringify(objVendor));
					cdtTrfTxInfObj.Cdtr.PstlAdr.StrtNm = objVendor.vendoraddrs1;
					cdtTrfTxInfObj.Cdtr.PstlAdr.BldgNb = objVendor.vendoraddrs2 || '';
					cdtTrfTxInfObj.Cdtr.PstlAdr.PstCd = objVendor.vendorpostal;
					cdtTrfTxInfObj.Cdtr.PstlAdr.TwnNm = objVendor.vendorcity;
					cdtTrfTxInfObj.Cdtr.PstlAdr.CtrySubDvsn = objVendor.vendorstateprovince;
				}
				cdtTrfTxInfObj.Cdtr.PstlAdr.Ctry = countryCodeMapping[objVendor.vendorcountrycode];

				cdtTrfTxInfObj.CdtrAcct = {};
				cdtTrfTxInfObj.CdtrAcct.Id = {};
				cdtTrfTxInfObj.CdtrAcct.Id.Othr = {};
				cdtTrfTxInfObj.CdtrAcct.Id.Othr.Id = objVendor.recpartyaccount;

				// cdtTrfTxInfObj.RltdAmtInf = {};
				// cdtTrfTxInfObj.RltdAmtInf.RmtLctnMtd = objVendor.pmp_dac_contactname || "";
				// cdtTrfTxInfObj.RltdAmtInf.RmtLctnElctrncAdr = objVendor.pmp_dac_emailaddress || "";
				cdtTrfTxInfObj.RmtInf = {};
				cdtTrfTxInfObj.RmtInf.Ustrd = refnum;
				cdtTrfTxInfObj.RmtInf.Strd = Strd;
				cdtTrfTxInfObj.UltmtCdtr = {};
				cdtTrfTxInfObj.UltmtCdtr.Nm = objVendor.vendorname;

				CdtTrfTxInf.push(cdtTrfTxInfObj);
			}
		} else {
			dAudit('arrVendorBills', arrVendorBills);
			var refnum = '';
			var currency = '';
			var symbol = '';

			for (v in arrVendorBills) {
				var arrPayeeInfo = v.split('X@X');
				var payeeId = arrPayeeInfo[1];

				//var objVendor=arrVendors[payeeId];
				       var objVendor = _.find(arrVendors, { internalid: String(payeeId)});
				// var objVendor = _.find(arrVendors, { internalid: String(payeeId), paymentmethod: String(paymentMethod) })[0];
dAudit('objVendor-new', objVendor);				dLog('objVendor', JSON.stringify(objVendor));

				if (isEmpty(objVendor)) continue;

				var pmtMethod = objVendor.paymentmethod;

				if (paymentMethod != pmtMethod) continue;

				var arrBills = arrVendorBills[paymentMethod + 'X@X' + payeeId];
				dLog('arrBills', JSON.stringify(arrBills));
				var tmpAmt = 0;

				var numberOfBills = _.size(arrBills);
				for (by in arrBills) {
					var billId = arrBills[by];
					refnum = _.find(arrBillsProcessed, { id: String(billId) }).refnum;
					currency = _.find(arrBillsProcessed, { id: String(billId) }).currid;
					subtext = _.find(arrBillsProcessed, { id: String(billId) }).subtext;
					billnum = _.find(arrBillsProcessed, { id: String(billId) }).billnum;

					try {
						symbol = _.find(_currencies, { internalid: String(currency) }).symbol;
					} catch (e) {}
					// dLog('createAUACHXMLDocrefnum', JSON.stringify(refnum));

					var netAmt = 0;
					var origAmt = getFloatVal(arrBillAmtOrig[billId]);
					var amt = getFloatVal(arrBillAmt[billId]);

					var discAmt = !isEmpty(arrBillDiscAmt[billId]) ? getFloatVal(arrBillDiscAmt[billId]) : 0;

					dLog(
						'amounts',
						JSON.stringify({
							netAmt: netAmt,
							origAmt: origAmt,
							amt: amt,
							discAmt: discAmt,
						})
					);

					netAmt = origAmt;
					tmpAmt += amt; //used to be netAmt

					if (discAmt > 0) {
						netAmt -= discAmt;
						tmpAmt -= discAmt;
					}

					if (!isEmpty(arrBillCredits[billId])) {
						var arrBC = arrBillCredits[billId];

						dLog('arrBC in arrBills', JSON.stringify(arrBC));

						for (bc in arrBC) {
							var billCreditAmtP = getFloatVal(arrBC[bc].bcamt);
							var billCreditAmt = billCreditAmtP * -1;

							// tmpAmt = (tmpAmt - billCreditAmtP);
							netAmt = netAmt - billCreditAmtP;
						}
					}
				}

				var cdtTrfTxInfObj = {};
				cdtTrfTxInfObj.PmtId = {};

				var refnum = arrBillPaymentMap[payeeId];
				var instrId = '';
				if (refnum.length > 12) {
					instrId = pz(refnum.substring(refnum.length - 12, refnum.length), 12);
				} else {
					instrId = pz(refnum, 12);
				}
				var endToEndId = refnum.substr(0, 18);
				// if (numberOfBills > 1) {
				// 	endToEndId = subtext.substr(0, 18);
				// }
				//refnum

				cdtTrfTxInfObj.PmtId.InstrId = instrId;
				cdtTrfTxInfObj.PmtId.EndToEndId = endToEndId;
				cdtTrfTxInfObj.Amt = {};
				cdtTrfTxInfObj.Amt.value = tmpAmt.toFixed(2); //amt.toFixed(2);
				cdtTrfTxInfObj.Amt.Ccy = symbol;
				cdtTrfTxInfObj.ChrgBr = 'CRED';

				tmpAmt = 0; // need to initialize back to 0

				var Strd = [];

				for (y in arrBills) {
					var billId = arrBills[y];
					var StrdObj = {};
					StrdObj.RfrdDocInf = {};
					StrdObj.RfrdDocInf.Tp = {};
					StrdObj.RfrdDocInf.Tp.CdOrPrtry = {};
					StrdObj.RfrdDocInf.Tp.CdOrPrtry.Cd = 'CINV'; //Hardcoded?

					var netAmt = 0;
					var origAmt = getFloatVal(arrBillAmtOrig[billId]);
					var amt = getFloatVal(arrBillAmt[billId]);

					var discAmt = !isEmpty(arrBillDiscAmt[billId]) ? getFloatVal(arrBillDiscAmt[billId]) : 0;

					dLog('billId before', billId);
					dLog('arrBC in y.arrBills before', JSON.stringify(arrBillCredits));

					if (!isEmpty(arrBillCredits[billId])) {
						var arrBC = arrBillCredits[billId];

						dLog('arrBC in y.arrBills', JSON.stringify(arrBC));

						for (bc in arrBC) {
							var billCreditAmtP = getFloatVal(arrBC[bc].bcamt);
							var billCreditAmt = billCreditAmtP * -1;

							// tmpAmt = (tmpAmt - billCreditAmtP);
							netAmt = netAmt - billCreditAmtP;
						}
					}

					// tmpAmt += amt;
					netAmt = origAmt;
					tmpAmt += amt; //used to be netAmt

					if (discAmt > 0) {
						netAmt -= discAmt;
						tmpAmt -= discAmt;
					}

					dLog('createCA_MTS_XMLDoc. objBillsData', JSON.stringify(objBillsData[billId]));

					if (!isEmpty(objBillsData[billId].num)) {
						StrdObj.RfrdDocInf.Nb = objBillsData[billId].num;
					} else if (!isEmpty(objBillsData[billId].trnxnumber)) {
						StrdObj.RfrdDocInf.Nb = objBillsData[billId].trnxnumber;
					}

					var invoiceDate = objBillsData[billId].dte;
					StrdObj.RfrdDocInf.RltdDt = formatDate(nlapiStringToDate(invoiceDate));
					StrdObj.RfrdDocAmt = {};
					StrdObj.RfrdDocAmt.DuePyblAmt = {};
					StrdObj.RfrdDocAmt.DscntApldAmt = {};
					StrdObj.RfrdDocAmt.RmtdAmt = {};
					StrdObj.RfrdDocAmt.DuePyblAmt.value = origAmt.toFixed(2);

					if (discAmt == 0) discAmt = '';
					else discAmt = discAmt.toFixed(2);

					StrdObj.RfrdDocAmt.DscntApldAmt.value = discAmt;
					StrdObj.RfrdDocAmt.RmtdAmt.value = netAmt.toFixed(2);

					StrdObj.RfrdDocAmt.DuePyblAmt.Ccy = symbol;
					StrdObj.RfrdDocAmt.DscntApldAmt.Ccy = symbol;
					StrdObj.RfrdDocAmt.RmtdAmt.Ccy = symbol;

					//Add CDtrRefInf
					StrdObj.CdtrRefInf = {};
					StrdObj.CdtrRefInf.Tp = {};
					StrdObj.CdtrRefInf.CdOrPrtry = {};
					StrdObj.CdtrRefInf.CdOrPrtry.Cd = 'PUOR';

					Strd.push(StrdObj);

					if (!isEmpty(arrBillCredits[billId])) {
						var arrBC = arrBillCredits[billId];

						for (bc in arrBC) {
							var billCreditAmtP = getFloatVal(arrBC[bc].bcamt);
							var billCreditAmt = billCreditAmtP;

							tmpAmt = tmpAmt - billCreditAmtP;
							netAmt = netAmt - billCreditAmtP;

							var StrdObj = {};
							StrdObj.RfrdDocInf = {};
							StrdObj.RfrdDocInf.Tp = {};
							StrdObj.RfrdDocInf.Tp.CdOrPrtry = {};
							StrdObj.RfrdDocInf.Tp.CdOrPrtry.Cd = 'CREN'; //Hardcoded?

							var bcNum = arrBC[bc].bcnum;
							dLog('createJPMXMLDoc', 'VC number : ' + bcNum);

							if (!isEmpty(bcNum)) StrdObj.RfrdDocInf.Nb = bcNum;
							else if (!isEmpty(arrBillCredits[billId].bcmemo)) {
								StrdObj.RfrdDocInf.Nb = arrBillCredits[billId].bcmemo;
							}

							var invoiceDate = objBillsData[billId].dte;
							StrdObj.RfrdDocInf.RltdDt = formatDate(nlapiStringToDate(arrBC[bc].bcdate));

							StrdObj.RfrdDocAmt = {};
							StrdObj.RfrdDocAmt.DuePyblAmt = {};
							StrdObj.RfrdDocAmt.DscntApldAmt = {};
							StrdObj.RfrdDocAmt.CdtNoteAmt = {};

							StrdObj.RfrdDocAmt.DuePyblAmt.value = billCreditAmt.toFixed(2);
							if (discAmt == 0) discAmt = '';
							else discAmt = discAmt.toFixed(2);

							StrdObj.RfrdDocAmt.DscntApldAmt.value = discAmt;
							StrdObj.RfrdDocAmt.CdtNoteAmt.value = billCreditAmt.toFixed(2);

							StrdObj.RfrdDocAmt.DuePyblAmt.Ccy = symbol;
							StrdObj.RfrdDocAmt.DscntApldAmt.Ccy = symbol;
							StrdObj.RfrdDocAmt.CdtNoteAmt.Ccy = symbol;

							Strd.push(StrdObj);
						}
					}
				}

				cdtTrfTxInfObj.CdtrAgt = {};
				cdtTrfTxInfObj.CdtrAgt.FinInstnId = {};
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.BIC = objVendor.recbankprimid;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.ClrSysMmbId = {};
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.ClrSysMmbId.MmbId = objVendor.bankid; //objVendor.recbankprimid;// objVendor.bankid; // Receiving Bank Routing
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.Nm = objVendor.vbankname;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr = {};
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.Ctry = countryCodeMapping[objVendor.vbankcountry];

				if (isEmpty(objVendor.vbankaddrs1) || isEmpty(objVendor.vbankzip) || isEmpty(objVendor.vbankcity) || isEmpty(objVendor.vbankstate)) {
					cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.StrtNm = '';
					cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.BldgNb = '';
					cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.PstCd = '';
					cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.TwnNm = '';
					cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.CtrySubDvsn = '';
				} else {
					cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.StrtNm = objVendor.vbankaddrs1;
					cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.BldgNb = '';
					cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.PstCd = objVendor.vbankzip;
					cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.TwnNm = objVendor.vbankcity;
					cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.CtrySubDvsn = objVendor.vbankstate;
				}

				// cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.StrtNum = objVendor.vbankaddrs1;
				// cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.PstCd = objVendor.vbankzip;
				// cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.TwnNm = objVendor.vbankcity;
				// cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.BldgNb = '';
				// cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.CtrySubDvsn = objVendor.vbankstate;

				cdtTrfTxInfObj.Cdtr = {};
				cdtTrfTxInfObj.Cdtr.Nm = objVendor.vendorname;
				cdtTrfTxInfObj.Cdtr.PstlAdr = {};

				if (isEmpty(objVendor.vendoraddrs1) || isEmpty(objVendor.vendorpostal) || isEmpty(objVendor.vendorcity) || isEmpty(objVendor.vendorstateprovince)) {
					cdtTrfTxInfObj.Cdtr.PstlAdr.StrtNm = '';
					cdtTrfTxInfObj.Cdtr.PstlAdr.BldgNb = '';
					cdtTrfTxInfObj.Cdtr.PstlAdr.PstCd = '';
					cdtTrfTxInfObj.Cdtr.PstlAdr.TwnNm = '';
					cdtTrfTxInfObj.Cdtr.PstlAdr.CtrySubDvsn = '';
				} else {
					cdtTrfTxInfObj.Cdtr.PstlAdr.StrtNm = objVendor.vendoraddrs1;
					cdtTrfTxInfObj.Cdtr.PstlAdr.BldgNb = objVendor.vendoraddrs2 || '';
					cdtTrfTxInfObj.Cdtr.PstlAdr.PstCd = objVendor.vendorpostal;
					cdtTrfTxInfObj.Cdtr.PstlAdr.TwnNm = objVendor.vendorcity;
					cdtTrfTxInfObj.Cdtr.PstlAdr.CtrySubDvsn = objVendor.vendorstateprovince;
				}

				// cdtTrfTxInfObj.Cdtr.PstlAdr.StrtNm = objVendor.vendoraddrs1;
				// cdtTrfTxInfObj.Cdtr.PstlAdr.BldgNb = objVendor.vendoraddrs2 || "";
				// cdtTrfTxInfObj.Cdtr.PstlAdr.PstCd = objVendor.vendorpostal;
				// cdtTrfTxInfObj.Cdtr.PstlAdr.TwnNm = objVendor.vendorcity;
				// cdtTrfTxInfObj.Cdtr.PstlAdr.CtrySubDvsn = objVendor.vendorstateprovince;
				cdtTrfTxInfObj.Cdtr.PstlAdr.Ctry = countryCodeMapping[objVendor.vendorcountrycode];

				var chars = objVendor.recpartyaccount.substring(0, 2);
				dAudit('CHECK for IBAN: objVendor.recpartyaccount', objVendor.recpartyaccount);
				if (isAlpha(chars)) {
					//IBAN

					cdtTrfTxInfObj.CdtrAcct = {};
					cdtTrfTxInfObj.CdtrAcct.Id = {};
					cdtTrfTxInfObj.CdtrAcct.Id.IBAN = objVendor.recpartyaccount;
				} else {
					cdtTrfTxInfObj.CdtrAcct = {};
					cdtTrfTxInfObj.CdtrAcct.Id = {};
					cdtTrfTxInfObj.CdtrAcct.Id.Othr = {};
					cdtTrfTxInfObj.CdtrAcct.Id.Othr.Id = objVendor.recpartyaccount;
				}

				// cdtTrfTxInfObj.RltdAmtInf = {};
				// cdtTrfTxInfObj.RltdAmtInf.RmtLctnMtd = objVendor.pmp_dac_contactname || "";
				// cdtTrfTxInfObj.RltdAmtInf.RmtLctnElctrncAdr = objVendor.pmp_dac_emailaddress || "";
				cdtTrfTxInfObj.RmtInf = {};
				cdtTrfTxInfObj.RmtInf.Ustrd = refnum;
				cdtTrfTxInfObj.RmtInf.Strd = Strd;
				cdtTrfTxInfObj.UltmtCdtr = {};
				cdtTrfTxInfObj.UltmtCdtr.Nm = objVendor.vendorname;

				CdtTrfTxInf.push(cdtTrfTxInfObj);
			}
		}
	}
	objects.CdtTrfTxInf = CdtTrfTxInf;

	dLog('objects', JSON.stringify(objects));

	var fileId = nlapiSearchRecord('file', null, [['name', 'is', 'ica_ca_mts.xml']], []);
	if (fileId != null) {
		fileId = fileId[0].getId();
	}

	var tmplFile = nlapiLoadFile(fileId);

	var template = Handlebars.compile(tmplFile.getValue());
	var xmlDoc = template(objects);

	dLog('xmlDoc', xmlDoc);
	return xmlDoc;
}

function createUBC_XMLDoc(objAcctMapping) {
	var arrTempBillIds = [];
	var arrBillCRIds = [];
	var arrBillAmt = [];
	var arrBillAmtOrig = [];
	var arrBillDiscAmt = [];
	var arrBillPayInfoCtr = [];
	var arrBillPayInfoSum = [];
	var arrGrpHdrNbOfTxs = [];
	var arrPmtInfNbOfTxs = [];
	var arrBillIds = [];
	var grpHdrNbOfTxs = 0;
	var grpHdrCtrlSum = 0;
	var arrPayeeIds = [];
	var _currencies = getCurrencies();

	for (x in arrBillsProcessed) {
		var billId = arrBillsProcessed[x].id;
		var billPaymentId = arrBillsProcessed[x].payment;

		dLog('createUBC_XMLDoc', 'Bill info = ' + JSON.stringify(arrBillsProcessed[x]));
		if (!isEmpty(billPaymentId) && billPaymentId != 'XXXNONEXXX' && billPaymentId != 'CREDIT') {
			if (billPaymentId != 'CREDIT') arrTempBillIds.push(billId);

			var payMethod = arrBillsProcessed[x].paymethod;
			var paymentId = arrBillsProcessed[x].payment;
			var payeeId = arrBillsProcessed[x].payeeid;

			arrBillAmtOrig[billId] = arrBillsProcessed[x].origamt;
			arrBillAmt[billId] = arrBillsProcessed[x].payamt;
			arrBillDiscAmt[billId] = arrBillsProcessed[x].discamt;

			var ndx = payMethod + '@@' + paymentId;

			if (arrBillPayInfoCtr[payMethod] == null) arrBillPayInfoCtr[payMethod] = 0;
			if (arrBillPayInfoSum[payMethod] == null) arrBillPayInfoSum[payMethod] = 0;
			if (arrPmtInfNbOfTxs[ndx] == null) arrPmtInfNbOfTxs[ndx] = 0;

			if (paymentId && arrGrpHdrNbOfTxs[paymentId] == null) grpHdrNbOfTxs++;

			arrPmtInfNbOfTxs[ndx]++;
			arrBillPayInfoCtr[payMethod]++;
			arrBillPayInfoSum[payMethod] += getFloatVal(arrBillsProcessed[x].payamt);
			arrGrpHdrNbOfTxs[paymentId] = paymentId;

		}
		grpHdrCtrlSum += getFloatVal(arrBillsProcessed[x].payamt);

		if (billPaymentId == 'CREDIT') arrBillCRIds.push(billId);
	}

	var arrBillIds = [];
	var arrBillIds2 = [];
	var arrBillIds3 = [];
	var arrBillIds4 = [];
	var arrBillIds5 = [];
  var arrBillIds6 = [];

	for (vx in arrTempBillIds) {
		var isBC = false;
		for (var x in arrBillCRIds) {
			if (arrTempBillIds[vx] == arrBillCRIds[x]) {
				isBC = true;
				break;
			}
		}
		if (!isBC) {
			arrBillIds.push(arrTempBillIds[vx]);
			arrBillIds2.push(arrTempBillIds[vx]);
			arrBillIds3.push(arrTempBillIds[vx]);
			arrBillIds4.push(arrTempBillIds[vx]);
			arrBillIds5.push(arrTempBillIds[vx]);
      arrBillIds6.push(arrTempBillIds[vx]);
		}
	}

	var arrBillCredits = getBillCredit(arrBillIds);
	var objBillsData = getBillData(arrBillIds2);
	var arrBillPO = getPOMap(arrBillIds3);
	var arrVendorBills = getPayeeBillsByPayMethod(arrBillIds4);
	var arrVendorBillsCurr = getPayeeBillsCurrency(arrBillIds5);
	var nsAcctSub = !isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('subsidiary', 'CUSTRECORD_ACCT_MAP_NETSUITE_ACCOUNT')) ? objAcctMapping[0].getValue('subsidiary', 'CUSTRECORD_ACCT_MAP_NETSUITE_ACCOUNT') : '';
	// var nsAcctSub
	var objVDCRecResults = getVendorDAC_CCRPaymentRec(nsAcctSub);
	dLog('createUBC_XMLDoc.objVDCRecResults', JSON.stringify(objVDCRecResults));
	dLog('createUBC_XMLDoc.objAcctMapping', JSON.stringify(objAcctMapping));

  var arrBillAddresses = getBillAddresses(arrBillIds6);
  dLog('createUBC_XMLDoc.arrBillAddresses', JSON.stringify(arrBillAddresses));

	//Gather data.

	var objects = {
		MsgId: 'TBD',
		CreDtTm: 'Test',
		Authstn: {
			Cd: '',
		},
		NbOfTxs: '2',
		CtrlSum: '2000',
		InitgPty: {
      Nm : ''
		},
		PmtInfId: 'PmtInfId',
		PmtMtd: 'PmtMtd',
		PmtTpInf: {
			SvcLvl: {
				Cd: 'This is CD',
			},
		},
		ReqdExctnDt: 'ReqdExctnDt',
		Dbtr: {
			Nm: 'This is Nm',
			PstlAdr: {
				StrtNm: '',
				BldgNb: '',
				PstCd: '',
				TwnNm: '',
				CtrySubDvsn: '',
				Ctry: '',
			},
			Id: {
				Othr: {
					Id: 'Dbtr.Id.Othr.Id',
				},
			},
		},
		DbtrAcct: {
			Id: {
				Othr: {
					Id: 'DbtrAcct.Id.Othr.Id',
				},
			},
			PstlAdr: {
				StrtNm: '',
				BldgNb: '',
				PstCd: '',
				TwnNm: '',
				CtrySubDvsn: '',
				Ctry: '',
			},
		},
		DbtrAgt: {
			FinInstnId: {
				BIC: 'BIC',
				PstlAdr: {
					StrtNm: '',
					BldgNb: '',
					PstCd: '',
					TwnNm: '',
					CtrySubDvsn: '',
					Ctry: '',
				},
			},
		},
		CdtTrfTxInf: CdtTrfTxInf,
	};

	var PmtInf = [];

	for (x in arrVendorBills) {
		var payeeId = x.split('X@X')[1];
		arrPayeeIds.push(payeeId);
	}

	var arrVendors = getEntityData(arrPayeeIds);

	var today = new Date();
	var bpmdate = BPM_DATE;
	var d = nlapiStringToDate(bpmdate, 'datetime');

	var fileCtrlNumber = moment(today).format('MMDDhhmmss');
	objects.MsgId = pad(fileCtrlNumber, 4);
	objects.CreDtTm = moment(d).format('YYYY-MM-DDThh:mm:ss') || today.format('{yyyy}-{MM}-{dd}T{hh}:{mm}:{ss}');
	objects.Authstn.Cd = 'AUTH';

	if (objects.CtrlSum == '0.00') {
		dLog('CtrlSum is 0.00, this should not happen. Returning empty file', objects.CtrlSum);
		return '';
	}

	// if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ceo_company_id'))) {
	// 	// objects.InitgPty.Id.OrgId.Othr.Id = objAcctMapping[0].getValue('custrecord_acct_map_ceo_company_id');
  //   objects.InitgPty.Nm = objVDCRecResults[0].getValue('custrecord_companyname'); //objAcctMapping[0].getValue('custrecord_acct_map_ceo_company_id');
	// }
  objects.InitgPty.Nm = objVDCRecResults[0].getValue('custrecord_companyname');

	var totalNbOfTxs = 0;
	var totalCtrlSum = 0;

	dLog('UBC: arrBillPayInfoCtr', JSON.stringify(arrBillPayInfoCtr));
	for (x in arrBillPayInfoCtr) {
		var CdtTrfTxInf = [];

		if (SINGLEBILLPYMTS == 'T') {
			dAudit('Create Single Bill Payments here.', JSON.stringify(arrBillsProcessed));
			var PmtInfObj = {};
			PmtInfObj.PmtInfId = fileCtrlNumber;
			var paymentMethod = x;
			PmtInfObj.PmtMtd = 'CHK';

			PmtInfObj.ReqdExctnDt = moment(d).format('YYYY-MM-DD') || today.format('{yyyy}-{MM}-{dd}');

      dAudit('objVDCRecResults', JSON.stringify(objVDCRecResults));
      PmtInfObj.Dbtr = {};
      PmtInfObj.Dbtr.Nm = objVDCRecResults[0].getValue('custrecord_companyname');

			// if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_companyname'))) {
			// 	PmtInfObj.Dbtr = {};
			// 	PmtInfObj.Dbtr.Nm = objVDCRecResults[0].getValue('custrecord_companyname');
			// }

			//PstlAdr
			var country = !isEmpty(objVDCRecResults) ? objVDCRecResults[0].getValue('custrecord_compcountrycode') : '';

			if (
				(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_comppostcode'))) ||
				(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compcity'))) ||
				(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compstateprov'))) ||
				(!isEmpty(objVDCRecResults) && objVDCRecResults[0].getValue('custrecord_compcountrycode')) ||
				(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compadd1')))
			) {
				
				PmtInfObj.Dbtr.PstlAdr = {};
				if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compadd1'))) {
					PmtInfObj.Dbtr.PstlAdr.StrtNm = '<AdrLine>' + objVDCRecResults[0].getValue('custrecord_compadd1') + '</AdrLine>';
				}
				if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compadd2'))) {
					PmtInfObj.Dbtr.PstlAdr.BldgNb = '<BldgNb>' + objVDCRecResults[0].getValue('custrecord_compadd2') + '</BldgNb>';
				}

				if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_comppostcode'))) {
					PmtInfObj.Dbtr.PstlAdr.PstCd = '<PstCd>' + objVDCRecResults[0].getValue('custrecord_comppostcode') + '</PstCd>';
				}
				// addTextNodeFromParentNode(xmlDoc, pstlAdr, 'PstCd', objVDCRecResults[0].getValue('custrecord_comppostcode'));

				if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compcity'))) {
					PmtInfObj.Dbtr.PstlAdr.TwnNm = '<TwnNm>' + objVDCRecResults[0].getValue('custrecord_compcity') + '</TwnNm>';
				}
				// addTextNodeFromParentNode(xmlDoc, pstlAdr, 'TwnNm', objVDCRecResults[0].getValue('custrecord_compcity'));

				//Where do we get CtrySubDvsn?
				if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compstateprov'))) {
					PmtInfObj.Dbtr.PstlAdr.TwnNm = '<CtrySubDvsn>' + objVDCRecResults[0].getValue('custrecord_compstateprov') + '</CtrySubDvsn>';
				}

				// addTextNodeFromParentNode(xmlDoc, pstlAdr, 'Ctry', country);
				if (country) {
					PmtInfObj.Dbtr.PstlAdr.Ctry = '<Ctry>' + country + '</Ctry>';
				}
			}

			// PmtInfObj.Dbtr.Id = {};
			// PmtInfObj.Dbtr.Id.Othr = {};
			// if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_dom_ach_co_id'))) {
			// 	PmtInfObj.Dbtr.Id.Othr.Id = objAcctMapping[0].getValue('custrecord_acct_map_dom_ach_co_id'); //ACH Company ID
			// }

			//DbtrAcct
			PmtInfObj.DbtrAcct = {};
			PmtInfObj.DbtrAcct.Id = {};
			PmtInfObj.DbtrAcct.Id.Othr = {};
			if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_origin_acc'))) {
				PmtInfObj.DbtrAcct.Id.Othr.Id = objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_origin_acc'); // Bank Account Number

				var symbol = '';
				try {
					symbol = _.find(_currencies, { internalid: String(objAcctMapping[0].getValue('custrecord_acct_map_account_currency')) }).symbol || 'USD';
					PmtInfObj.DbtrAcct.Ccy = symbol; //objAcctMapping[0].getValue('custrecord_acct_map_account_currency') || ''; // Bank Currency
					dAudit('DbtrAcct.Ccy-Currency', objAcctMapping[0].getValue('custrecord_acct_map_account_currency'));
					dAudit('DbtrAcct.Ccy', JSON.stringify(_currencies));
				} catch (e) {
          symbol = 'USD';
        }
			}

      PmtInfObj.DbtrAgt = {};
      PmtInfObj.DbtrAgt.Bic = objAcctMapping[0].getValue('custrecord_acct_map_hsbc_swift_bank_id');

			var noOfBillPayments = 0;
			var totalAmount = 0;
			for (var i = 0; i < arrBillsProcessed.length; i++) {
				

				var billPayment = arrBillsProcessed[i];
        dLog('billPayment-details', JSON.stringify(billPayment));

				if (billPayment.payment == 'CREDIT') {
					continue;
				}

				var symbol = '';

				try {
					symbol = _.find(_currencies, { internalid: String(billPayment.currid) }).symbol || 'USD';
				} catch (e) {
          symbol = 'USD';
        }

				var objVendor = arrVendors[billPayment.payeeid];        
				if (!objVendor) {
          dLog('objVendor is null', JSON.stringify(objVendor));
          objVendor = _.find(arrVendors, { internalid: String(billPayment.payeeid) });
        }

				dLog('objVendor', JSON.stringify(objVendor));

				var cdtTrfTxInfObj = {};
				cdtTrfTxInfObj.PmtId = {};

				var refnum = billPayment.refnum; //arrBillPaymentMap[billPayment.payeeid];
				// var refnum = billPayment.billnum; //arrBillPaymentMap[billPayment.payeeid];
				var instrId = '';
				if (refnum.length > 12) {
					instrId = pz(refnum.substring(refnum.length - 12, refnum.length), 12);
				} else {
					instrId = pz(refnum, 12);
				}
				refnum = billPayment.billnum; //Overwrite endToendID
				var endToEndId = refnum;
				if (refnum.length > 18) {
					endToEndId = refnum.substr(0, 18);
				}

				endToEndId = moment(d).format('YYYY-MM-DDThh:mm:ss');

        var addressDetails = {};
        if (billPayment.id) {
          // var billDetails = nlapiLoadRecord('vendorbill', billPayment.id);
          var billDetails = _.find(arrBillAddresses, {internalid: String(billPayment.id)});
          if (billDetails) {
            addressDetails = {
              entity: objVendor.vendorname,
              attention: billDetails.attention,
              addressee: billDetails.addressee,
              addr1: billDetails.addr1,
              addr2: billDetails.addr2,
              city: billDetails.city,
              state: billDetails.state,
              zip: billDetails.zip,
              country: billDetails.country || 'US',
              custbody_ica_grant_data: billDetails.custbody_ica_grant_data,
              custbody_ica_union_bank_vendor_id: billDetails.custbody_ica_union_bank_vendor_id
              // attention: billDetails.getFieldValue('billattention'),
              // addressee: billDetails.getFieldValue('billaddressee'),
              // addr1: billDetails.getFieldValue('billaddr1'),
              // addr2: billDetails.getFieldValue('billaddr2'),
              // city: billDetails.getFieldValue('billcity'),
              // state: billDetails.getFieldValue('billstate'),
              // zip: billDetails.getFieldValue('billzip'),
              // custbody_ica_grant_data: billDetails.getFieldValue('custbody_ica_grant_data'),

            };
          }  
        }
        dLog('addressDetails', JSON.stringify(addressDetails));


				cdtTrfTxInfObj.PmtId.InstrId = instrId;
				cdtTrfTxInfObj.PmtId.EndToEndId = endToEndId;

        if (paymentMethod == 'CHK') {
					cdtTrfTxInfObj.PmtInfObj = {};
					cdtTrfTxInfObj.PmtInfObj.PmtTpInf = {};
					cdtTrfTxInfObj.PmtInfObj.PmtTpInf.SvcLvl = {};

					if (objVendor.deliverycode == '') {
						cdtTrfTxInfObj.PmtInfObj.PmtTpInf.SvcLvl.Prtry = '00PY1';
					} else {
						cdtTrfTxInfObj.PmtInfObj.PmtTpInf.SvcLvl.Prtry = '00000';
					}
					cdtTrfTxInfObj.ChqInstr = {};
					cdtTrfTxInfObj.ChqInstr.ChqNb = billPayment.refnum;
					if (objVendor.deliverycode) {
						cdtTrfTxInfObj.ChqInstr.DlvryMtd = {};
						cdtTrfTxInfObj.ChqInstr.DlvryMtd.Cd = objVendor.deliverycode;
					}
				}
				cdtTrfTxInfObj.Amt = {};
				cdtTrfTxInfObj.Amt.value = billPayment.payamt; //amt.toFixed(2);
				cdtTrfTxInfObj.Amt.Ccy = symbol;
				cdtTrfTxInfObj.ChrgBr = billPayment.paymethod == 'MTS' ? 'CRED' : '';
        cdtTrfTxInfObj.ClrSysId = {};
        cdtTrfTxInfObj.ClrSysId.Cd = 'CACPA';


        cdtTrfTxInfObj.Cdtr = {};
        cdtTrfTxInfObj.Cdtr.Nm = addressDetails.attention; //objVendor.vendorname; //addressDetails.attention; //addressDetails.entity; //objVendor.vendorname;
        cdtTrfTxInfObj.Cdtr.PstlAdr = {};
        cdtTrfTxInfObj.Cdtr.PstlAdr.Addressee = addressDetails.addressee; //objVendor.vendorname;
        // cdtTrfTxInfObj.Cdtr.PstlAdr.BldgNb = addressDetails.addr1 + ' ' +  addressDetails.addr2; //(objVendor.vendoraddrs1 + ' ' + objVendor.vendoraddrs2) || '';
        // cdtTrfTxInfObj.Cdtr.PstlAdr.PstCd =  addressDetails.city + ' ' +  addressDetails.state + ' ' + addressDetails.zip; //objVendor.vendorstateprovince + ' ' + objVendor.vendorpostal;
        // cdtTrfTxInfObj.Cdtr.PstlAdr.BldgNb = addressDetails.addr1 + ' ' +  addressDetails.addr2; //(objVendor.vendoraddrs1 + ' ' + objVendor.vendoraddrs2) || '';
        // cdtTrfTxInfObj.Cdtr.PstlAdr.PstCd =  addressDetails.city + ' ' +  addressDetails.state + ' ' + addressDetails.zip; //objVendor.vendorstateprovince + ' ' + objVendor.vendorpostal;

        cdtTrfTxInfObj.Cdtr.PstlAdr.Addr1 = addressDetails.addr1;
        cdtTrfTxInfObj.Cdtr.PstlAdr.Addr2 = addressDetails.addr2;
        cdtTrfTxInfObj.Cdtr.PstlAdr.City = addressDetails.city;
        cdtTrfTxInfObj.Cdtr.PstlAdr.State = addressDetails.state;
        cdtTrfTxInfObj.Cdtr.PstlAdr.Zip = addressDetails.zip;
        cdtTrfTxInfObj.Cdtr.PstlAdr.Country = addressDetails.country;


        cdtTrfTxInfObj.Cdtr.Id = {};
        cdtTrfTxInfObj.Cdtr.Id.OrgId = {};
        cdtTrfTxInfObj.Cdtr.Id.OrgId.Othr = {};
        // var vendorid = objVendor.internalid;
        // if (DEFAULT_MSG_VENDOR_ID == 'T') {
        //   vendorid = objVendor[UNIONBANK_VENDOR_ID] || objVendor.internalid;
        // }
        cdtTrfTxInfObj.Cdtr.Id.OrgId.Othr.Id = addressDetails.custbody_ica_union_bank_vendor_id; // vendorid; //objVendor.internalid;

        // cdtTrfTxInfObj.Cdtr.Id.OrgId.Othr.Id = objVendor.internalid;
        cdtTrfTxInfObj.InstrForDbtrAgt = addressDetails.custbody_ica_grant_data; //'GB-' + billPayment.refnum;
        cdtTrfTxInfObj.AddtlRmtInf = objBillsData[billId].memo;


				cdtTrfTxInfObj.CdtrAcct = {};
				cdtTrfTxInfObj.CdtrAcct.Id = {};
				cdtTrfTxInfObj.CdtrAcct.Id.Othr = {};
				cdtTrfTxInfObj.CdtrAcct.Id.Othr.Id = objVendor.recpartyaccount;

        

				// cdtTrfTxInfObj.RltdAmtInf = {};
				// cdtTrfTxInfObj.RltdAmtInf.RmtLctnMtd = objVendor.pmp_dac_contactname || "";
				// cdtTrfTxInfObj.RltdAmtInf.RmtLctnElctrncAdr = objVendor.pmp_dac_emailaddress || "";
				cdtTrfTxInfObj.RmtInf = {};
				// cdtTrfTxInfObj.RmtInf.Ustrd = refnum;
				cdtTrfTxInfObj.RmtInf.VendorId = objVendor.entityid;
				cdtTrfTxInfObj.RmtInf.Category = objVendor.category;


        var billId = billPayment.id;
        var StrdObj = {};
        StrdObj.RfrdDocInf = {};
        StrdObj.RfrdDocInf.Nb = billPayment.billnum;
        StrdObj.RfrdDocInf.Tp = {};
        StrdObj.RfrdDocInf.Tp.CdOrPrtry = {};
        StrdObj.RfrdDocInf.Tp.CdOrPrtry.Cd = 'CINV';

        var netAmt = 0;
        var origAmt = getFloatVal(arrBillAmtOrig[billId]);
        var amt = getFloatVal(arrBillAmt[billId]);

        var discAmt = !isEmpty(arrBillDiscAmt[billId]) ? getFloatVal(arrBillDiscAmt[billId]) : 0;

        if (!isEmpty(arrBillCredits[billId])) {
          var arrBC = arrBillCredits[billId];

          dLog('arrBC in y.arrBills', JSON.stringify(arrBC));

          for (bc in arrBC) {
            var billCreditAmtP = getFloatVal(arrBC[bc].bcamt);
            var billCreditAmt = billCreditAmtP * -1;

            netAmt = netAmt - billCreditAmtP;
          }
        }

        netAmt = origAmt;
        tmpAmt += amt; //used to be netAmt
        totalCdtTrfTxInfAmount += amt; //origAmt;

        if (discAmt > 0) {
          netAmt -= discAmt;
          tmpAmt -= discAmt;
        }


        var invoiceDate = objBillsData[billId].dte;
        StrdObj.RfrdDocInf.RltdDt = formatDate(nlapiStringToDate(invoiceDate));
        StrdObj.RfrdDocAmt = {};
        StrdObj.RfrdDocAmt.DuePyblAmt = {};
        StrdObj.RfrdDocAmt.DscntApldAmt = {};
        StrdObj.RfrdDocAmt.RmtdAmt = {};
        StrdObj.RfrdDocAmt.DuePyblAmt.value = origAmt.toFixed(2);

        if (discAmt == 0) discAmt = '';
        else discAmt = discAmt.toFixed(2);

        StrdObj.RfrdDocAmt.DscntApldAmt.value = discAmt;

        if (!isEmpty(arrBillCredits[billId])) {
          var arrBC = arrBillCredits[billId];
          for (bc in arrBC) {
            var billCreditAmt = getFloatVal(arrBC[bc].bcamt);
            amt += Number(billCreditAmt);
          }
        }

        StrdObj.RfrdDocAmt.RmtdAmt.value = amt.toFixed(2); //netAmt.toFixed(2);

        StrdObj.RfrdDocAmt.DuePyblAmt.Ccy = symbol;
        StrdObj.RfrdDocAmt.DscntApldAmt.Ccy = symbol;
        StrdObj.RfrdDocAmt.RmtdAmt.Ccy = symbol;

        StrdObj.CdtrRefInf = {};
        StrdObj.CdtrRefInf.Tp = {};
        StrdObj.CdtrRefInf.CdOrPrtry = {};
        StrdObj.CdtrRefInf.CdOrPrtry.Cd = billPaymentTranId; //"CINV";
        // if (objBillsData[billId].memo) {
        //   StrdObj.CdtrRefInf.Ref = objBillsData[billId].memo || '';
        // }
        StrdObj.CdtrRefInf.Ref = billPaymentTranId; //objBillsData[billId].num; //billPaymentTranId;
        
        // StrdObj.RfrdDocInf.Nb = billPaymentTranId; //objBillsData[billId].num; //objBillsData[billId].memo; //billPaymentTranId;
        StrdObj.AddtlRmtInf = objBillsData[billId].memo;

        dLog('createUBC_XMLDoc. StrdObj', JSON.stringify(StrdObj));
        var Strd = [];
        Strd.push(StrdObj);

				cdtTrfTxInfObj.RmtInf.Strd = Strd;

				CdtTrfTxInf.push(cdtTrfTxInfObj);
        totalNbOfTxs++;
        totalCtrlSum += Number(billPayment.payamt);  
			}
			PmtInfObj.CdtTrfTxInf = CdtTrfTxInf;      
      PmtInfObj.NbOfTxs = 1;
      PmtInfObj.CtrlSum = Number(billPayment.payamt).toFixed(2);
			PmtInf.push(PmtInfObj);
      dLog('PmtInf', JSON.stringify(PmtInf));
		} else {
			dAudit('createUBC_XMLDoc.arrVendorBills', arrVendorBills);
			var refnum = '';
			var currency = '';
			var symbol = '';
			try {
				dLog('objAcctMapping', JSON.stringify(objAcctMapping));
				symbol = _.find(_currencies, { internalid: String(objAcctMapping[0].getValue('custrecord_acct_map_account_currency')) }).symbol || 'USD';
			} catch (e) {
				symbol = 'USD';
			}

			dLog('SYMBOL', symbol);

			var PmtInfObj = {};
			// var fileCtrlNumber = Date.create().format("{yy}{MM}{dd}{mm}{ss}"); //RSF add millisecs
			var fileCtrlNumber = moment(today).format('YYMMDDmmssSS');
			PmtInfObj.PmtInfId = fileCtrlNumber;
			var paymentMethod = x;
			if (paymentMethod == 'CHK') {
				PmtInfObj.PmtMtd = 'CHK';
			} else {
				PmtInfObj.PmtMtd = 'TRF';
			}

			// objects.PmtTpInf.SvcLvl.Cd = (paymentMethod == 'DAC') ? 'NURG' : 'URGP';
			if (paymentMethod == 'DAC' || paymentMethod == 'MTS') {
				PmtInfObj.PmtTpInf = {};
				PmtInfObj.PmtTpInf.SvcLvl = {};

				if (paymentMethod == 'DAC') {
					PmtInfObj.PmtTpInf.SvcLvl.Cd = 'NURG';
				} else if (paymentMethod == 'CHK') {
					PmtInfObj.PmtTpInf.SvcLvl.Prtry = 'PM';
				} else if (paymentMethod == 'MTS') {
					PmtInfObj.PmtTpInf.SvcLvl.Cd = 'URGP';
				}
			}

			PmtInfObj.ReqdExctnDt = moment(d).format('YYYY-MM-DD') || today.format('{yyyy}-{MM}-{dd}');

			dAudit('objVDCRecResults', JSON.stringify(objVDCRecResults));
			if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_companyname'))) {
				PmtInfObj.Dbtr = {};
				PmtInfObj.Dbtr.Nm = objVDCRecResults[0].getValue('custrecord_companyname');
				dLog('Added Nm', objVDCRecResults[0].getValue('custrecord_companyname'));
			}

			//PstlAdr
			var country = !isEmpty(objVDCRecResults) ? objVDCRecResults[0].getValue('custrecord_compcountrycode') : '';

			if (
				(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_comppostcode'))) ||
				(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compcity'))) ||
				(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compstateprov'))) ||
				(!isEmpty(objVDCRecResults) && objVDCRecResults[0].getValue('custrecord_compcountrycode')) ||
				(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compadd1')))
			) {
				PmtInfObj.Dbtr.PstlAdr = {};

				if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compadd1'))) {
					PmtInfObj.Dbtr.PstlAdr.StrtNm = '<StrtNm>' + objVDCRecResults[0].getValue('custrecord_compadd1') + '</StrtNm>';
				}
				if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compadd2'))) {
					PmtInfObj.Dbtr.PstlAdr.BldgNb = '<BldgNb>' + objVDCRecResults[0].getValue('custrecord_compadd2') + '</BldgNb>';
				}

				if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_comppostcode'))) {
					PmtInfObj.Dbtr.PstlAdr.PstCd = '<PstCd>' + objVDCRecResults[0].getValue('custrecord_comppostcode') + '</PstCd>';
				}
				// addTextNodeFromParentNode(xmlDoc, pstlAdr, 'PstCd', objVDCRecResults[0].getValue('custrecord_comppostcode'));

				if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compcity'))) {
					PmtInfObj.Dbtr.PstlAdr.TwnNm = '<TwnNm>' + objVDCRecResults[0].getValue('custrecord_compcity') + '</TwnNm>';
				}
				// addTextNodeFromParentNode(xmlDoc, pstlAdr, 'TwnNm', objVDCRecResults[0].getValue('custrecord_compcity'));

				//Where do we get CtrySubDvsn?
				if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compstateprov'))) {
					PmtInfObj.Dbtr.PstlAdr.TwnNm = '<CtrySubDvsn>' + objVDCRecResults[0].getValue('custrecord_compstateprov') + '</CtrySubDvsn>';
				}

				// addTextNodeFromParentNode(xmlDoc, pstlAdr, 'Ctry', country);
				if (country) {
					PmtInfObj.Dbtr.PstlAdr.Ctry = '<Ctry>' + country + '</Ctry>';
				}
			}

			if (paymentMethod == 'DAC') {
				PmtInfObj.Dbtr.Id = {};
				PmtInfObj.Dbtr.Id.Othr = {};

				if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_dom_ach_co_id'))) {
					PmtInfObj.Dbtr.Id.Othr.Id = objAcctMapping[0].getValue('custrecord_acct_map_dom_ach_co_id'); //ACH Company ID
				}

				PmtInfObj.Dbtr.Id.OrgId = {};
				PmtInfObj.Dbtr.Id.OrgId.Othr = {};

				if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ceo_company_id'))) {
					PmtInfObj.Dbtr.Id.OrgId.Othr.Id = objAcctMapping[0].getValue('custrecord_acct_map_ceo_company_id');
				}

				if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_bankname'))) {
					PmtInfObj.Dbtr.Id.OrgId.Othr.SchmeNm = {};
					PmtInfObj.Dbtr.Id.OrgId.Othr.SchmeNm.Cd = objVDCRecResults[0].getValue('custrecord_bankname');
				}
			}

			//DbtrAcct
			PmtInfObj.DbtrAcct = {};
			PmtInfObj.DbtrAcct.Id = {};
			PmtInfObj.DbtrAcct.Id.Othr = {};
			if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_origin_acc'))) {
				PmtInfObj.DbtrAcct.Id.Othr.Id = objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_origin_acc'); // Bank Account Number

				// var symbol = "";
				try {
					// symbol = _.find(_currencies, { internalid: String(objAcctMapping[0].getValue("custrecord_acct_map_account_currency")) }).symbol || "USD";
					PmtInfObj.DbtrAcct.Ccy = symbol; //objAcctMapping[0].getValue('custrecord_acct_map_account_currency') || ''; // Bank Currency
					dAudit('DbtrAcct.Ccy', objAcctMapping[0].getValue('custrecord_acct_map_account_currency'));
					dAudit('DbtrAcct.Ccy_currencies', JSON.stringify(_currencies));
				} catch (e) {}
			}

      PmtInfObj.DbtrAgt = {};
      PmtInfObj.DbtrAgt.Bic = objAcctMapping[0].getValue('custrecord_acct_map_hsbc_swift_bank_id');

			var noOfBillPayments = 0;
			var totalAmount = 0;
			for (v in arrVendorBills) {
				var arrPayeeInfo = v.split('X@X');
				var payeeId = arrPayeeInfo[1];

				//var objVendor=arrVendors[payeeId];
				       var objVendor = _.find(arrVendors, { internalid: String(payeeId)});
				// var objVendor = _.find(arrVendors, { internalid: String(payeeId), paymentmethod: String(paymentMethod) })[0];
dAudit('objVendor-new', objVendor);				dLog('objVendor', JSON.stringify(objVendor));

				if (isEmpty(objVendor)) continue;

				var pmtMethod = objVendor.paymentmethod;

				if (paymentMethod != pmtMethod) continue;
				
				if (pmtMethod == 'DAC') {
					PmtInfObj.PmtTpInf.LclInstrm = {};
					PmtInfObj.PmtTpInf.LclInstrm.Cd = objVendor.payformat;
				}

				var arrBills = arrVendorBills[paymentMethod + 'X@X' + payeeId];
				dLog('arrBills', JSON.stringify(arrBills));
				var tmpAmt = 0;

				var numberOfBills = _.size(arrBills);
				var billnum = '';
				var billPaymentTranId = '';
        var billDetails = null;
        var currentBillId = '';
				for (by in arrBills) {
					var billId = arrBills[by];
					refnum = _.find(arrBillsProcessed, { id: String(billId) }).refnum;
					currency = _.find(arrBillsProcessed, { id: String(billId) }).currid;
					subtext = _.find(arrBillsProcessed, { id: String(billId) }).subtext;
					billnum = _.find(arrBillsProcessed, { id: String(billId) }).billnum;
					billPaymentTranId = _.find(arrBillsProcessed, { id: String(billId) }).refnum;
					dLog('billnum', billnum);

					try {
						symbol = _.find(_currencies, { internalid: String(currency) }).symbol || 'USD';
					} catch (e) {}
					dLog('billPaymentTranId', billPaymentTranId);

					var netAmt = 0;
					var origAmt = getFloatVal(arrBillAmtOrig[billId]);
					var amt = getFloatVal(arrBillAmt[billId]);

					var discAmt = !isEmpty(arrBillDiscAmt[billId]) ? getFloatVal(arrBillDiscAmt[billId]) : 0;

					dLog(
						'amounts',
						JSON.stringify({
							netAmt: netAmt,
							origAmt: origAmt,
							amt: amt,
							discAmt: discAmt,
						})
					);

					netAmt = origAmt;
					tmpAmt += amt; //used to be netAmt

					if (discAmt > 0) {
						netAmt -= discAmt;
						tmpAmt -= discAmt;
					}

					if (!isEmpty(arrBillCredits[billId])) {
						var arrBC = arrBillCredits[billId];

						dLog('arrBC in arrBills', JSON.stringify(arrBC));

						for (bc in arrBC) {
							var billCreditAmtP = getFloatVal(arrBC[bc].bcamt);
							var billCreditAmt = billCreditAmtP * -1;

							// tmpAmt = (tmpAmt - billCreditAmtP);
							netAmt = netAmt - billCreditAmtP;
						}
					}
          if (!billDetails) {
            billDetails = nlapiLoadRecord('vendorbill', billId);
            currentBillId = billId;
          }
				}

        var addressDetails = {};
        if (currentBillId) {
          // var billDetails = nlapiLoadRecord('vendorbill', billPayment.id);
          var billDetails = _.find(arrBillAddresses, {internalid: String(currentBillId)});
          if (billDetails) {
            addressDetails = {
              entity: objVendor.vendorname,
              attention: billDetails.attention,
              addressee: billDetails.addressee,
              addr1: billDetails.addr1,
              addr2: billDetails.addr2,
              city: billDetails.city,
              state: billDetails.state,
              zip: billDetails.zip,
              country: billDetails.country || 'US',              
              custbody_ica_grant_data: billDetails.custbody_ica_grant_data,
              custbody_ica_union_bank_vendor_id: billDetails.custbody_ica_union_bank_vendor_id
              // attention: billDetails.getFieldValue('billattention'),
              // addressee: billDetails.getFieldValue('billaddressee'),
              // addr1: billDetails.getFieldValue('billaddr1'),
              // addr2: billDetails.getFieldValue('billaddr2'),
              // city: billDetails.getFieldValue('billcity'),
              // state: billDetails.getFieldValue('billstate'),
              // zip: billDetails.getFieldValue('billzip'),
              // custbody_ica_grant_data: billDetails.getFieldValue('custbody_ica_grant_data'),

            };
          }  
        }
        


				var cdtTrfTxInfObj = {};
				cdtTrfTxInfObj.PmtId = {};

				var refnum = arrBillPaymentMap[payeeId];
				var instrId = '';
				if (refnum.length > 12) {
					instrId = pz(refnum.substring(refnum.length - 12, refnum.length), 12);
				} else {
					instrId = pz(refnum, 12);
				}
				var endToEndId = billnum.substr(0, 18);
				if (numberOfBills > 1) {
					endToEndId = subtext.substr(0, 18);
				}

				var s = String(moment().valueOf());
				s = s.slice(s.length - 6);
				endToEndId = moment(d).format('YYYYMMDD') + s;

				cdtTrfTxInfObj.PmtId.InstrId = instrId;
				cdtTrfTxInfObj.PmtId.EndToEndId = endToEndId;

				if (paymentMethod == 'CHK') {
					cdtTrfTxInfObj.PmtInfObj = {};
					cdtTrfTxInfObj.PmtInfObj.PmtTpInf = {};
					cdtTrfTxInfObj.PmtInfObj.PmtTpInf.SvcLvl = {};

					if (objVendor.deliverycode == '') {
						cdtTrfTxInfObj.PmtInfObj.PmtTpInf.SvcLvl.Prtry = '00PY1';
					} else {
						cdtTrfTxInfObj.PmtInfObj.PmtTpInf.SvcLvl.Prtry = '00000';
					}
					cdtTrfTxInfObj.ChqInstr = {};
					cdtTrfTxInfObj.ChqInstr.ChqNb = billPaymentTranId;
					if (objVendor.deliverycode) {
						cdtTrfTxInfObj.ChqInstr.DlvryMtd = {};
						cdtTrfTxInfObj.ChqInstr.DlvryMtd.Cd = objVendor.deliverycode;
					}
				}

				if (paymentMethod == 'DAC') {
					cdtTrfTxInfObj.ChrgBr = 'DEBT';
					// cdtTrfTxInfObj.ChrgBr = (paymentMethod == 'MTS') ? 'CRED' : "";
				} else if (paymentMethod == 'MTS') {
					cdtTrfTxInfObj.ChrgBr = 'DEBT';
				}

				if (paymentMethod == 'DAC' || paymentMethod == 'CHK') {
					cdtTrfTxInfObj.ClrSysId = {};
					cdtTrfTxInfObj.ClrSysId.Cd = 'CACPA';
				}

				tmpAmt = 0; // need to initialize back to 0

				var Strd = [];
				var totalCdtTrfTxInfAmount = 0;

				for (y in arrBills) {
					var billId = arrBills[y];
					var StrdObj = {};
					StrdObj.RfrdDocInf = {};
					StrdObj.RfrdDocInf.Tp = {};
					StrdObj.RfrdDocInf.Tp.CdOrPrtry = {};
					StrdObj.RfrdDocInf.Tp.CdOrPrtry.Cd = 'CINV';
          // StrdObj.RfrdDocInf.Nb = 'CINV';

					var netAmt = 0;
					var origAmt = getFloatVal(arrBillAmtOrig[billId]);
					var amt = getFloatVal(arrBillAmt[billId]);

					var discAmt = !isEmpty(arrBillDiscAmt[billId]) ? getFloatVal(arrBillDiscAmt[billId]) : 0;

					// dLog("billId before", billId);
					// dLog("arrBC in y.arrBills before", JSON.stringify(arrBillCredits));
					dLog(
						'values',
						JSON.stringify({
							netAmt: netAmt,
							origAmt: origAmt,
							amt: amt,
							discAmt: discAmt,
							tmpAmt: tmpAmt,
						})
					);

					if (!isEmpty(arrBillCredits[billId])) {
						var arrBC = arrBillCredits[billId];

						dLog('arrBC in y.arrBills', JSON.stringify(arrBC));

						for (bc in arrBC) {
							var billCreditAmtP = getFloatVal(arrBC[bc].bcamt);
							var billCreditAmt = billCreditAmtP * -1;

							// tmpAmt = (tmpAmt - billCreditAmtP);
							netAmt = netAmt - billCreditAmtP;
						}
					}

					// tmpAmt += amt;
					netAmt = origAmt;
					tmpAmt += amt; //used to be netAmt
					totalCdtTrfTxInfAmount += amt; //origAmt;

					if (discAmt > 0) {
						netAmt -= discAmt;
						tmpAmt -= discAmt;
						// totalCdtTrfTxInfAmount -= discAmt;
					}


					var invoiceDate = objBillsData[billId].dte;
					StrdObj.RfrdDocInf.RltdDt = formatDate(nlapiStringToDate(invoiceDate));
					StrdObj.RfrdDocAmt = {};
					StrdObj.RfrdDocAmt.DuePyblAmt = {};
					StrdObj.RfrdDocAmt.DscntApldAmt = {};
					StrdObj.RfrdDocAmt.RmtdAmt = {};
					StrdObj.RfrdDocAmt.DuePyblAmt.value = origAmt.toFixed(2);

					if (discAmt == 0) discAmt = '';
					else discAmt = discAmt.toFixed(2);

					StrdObj.RfrdDocAmt.DscntApldAmt.value = discAmt;

					//RSF - Added to make the RmtdAmt the same as DuePyblAmt
					if (!isEmpty(arrBillCredits[billId])) {
						var arrBC = arrBillCredits[billId];
						for (bc in arrBC) {
							var billCreditAmt = getFloatVal(arrBC[bc].bcamt);
							amt += Number(billCreditAmt);
						}
					}

					StrdObj.RfrdDocAmt.RmtdAmt.value = amt.toFixed(2); //netAmt.toFixed(2);

					StrdObj.RfrdDocAmt.DuePyblAmt.Ccy = symbol;
					StrdObj.RfrdDocAmt.DscntApldAmt.Ccy = symbol;
					StrdObj.RfrdDocAmt.RmtdAmt.Ccy = symbol;

					//Add CDtrRefInf
					StrdObj.CdtrRefInf = {};
					StrdObj.CdtrRefInf.Tp = {};
					StrdObj.CdtrRefInf.CdOrPrtry = {};
					StrdObj.CdtrRefInf.CdOrPrtry.Cd = billPaymentTranId; //"CINV";
					// if (objBillsData[billId].memo) {
					//   StrdObj.CdtrRefInf.Ref = objBillsData[billId].memo || '';
					// }
					StrdObj.CdtrRefInf.Ref = billPaymentTranId; //objBillsData[billId].num; //billPaymentTranId;
					
					StrdObj.RfrdDocInf.Nb = billPaymentTranId; //objBillsData[billId].num; //objBillsData[billId].memo; //billPaymentTranId;
          StrdObj.AddtlRmtInf = objBillsData[billId].memo;

          dLog('createUBC_XMLDoc. StrdObj', JSON.stringify(StrdObj));
					Strd.push(StrdObj);

					if (!isEmpty(arrBillCredits[billId])) {
						var arrBC = arrBillCredits[billId];

						for (bc in arrBC) {
							var billCreditAmtP = getFloatVal(arrBC[bc].bcamt);
							var billCreditAmt = billCreditAmtP;

							tmpAmt = tmpAmt - billCreditAmtP;
							netAmt = netAmt - billCreditAmtP;
							// totalCdtTrfTxInfAmount -= billCreditAmtP;

							var StrdObj = {};
							StrdObj.RfrdDocInf = {};
							StrdObj.RfrdDocInf.Tp = {};
							StrdObj.RfrdDocInf.Tp.CdOrPrtry = {};
							StrdObj.RfrdDocInf.Tp.CdOrPrtry.Cd = 'CREN'; //Hardcoded?

							var bcNum = arrBC[bc].bcnum;
							dLog('createJPMXMLDoc', 'VC number : ' + bcNum);
							dLog('arrBC[bc]', JSON.stringify(arrBC));

							if (!isEmpty(bcNum)) StrdObj.RfrdDocInf.Nb = bcNum;
							else if (!isEmpty(arrBillCredits[billId].bcmemo)) {
								StrdObj.RfrdDocInf.Nb = arrBillCredits[billId].bcmemo;
							}

							var invoiceDate = objBillsData[billId].dte;
							StrdObj.RfrdDocInf.RltdDt = formatDate(nlapiStringToDate(arrBC[bc].bcdate));

							StrdObj.RfrdDocAmt = {};
							StrdObj.RfrdDocAmt.CdtNoteAmt = {};
							StrdObj.RfrdDocAmt.DuePyblAmt = null;
							StrdObj.RfrdDocAmt.DscntApldAmt = null;
							StrdObj.RfrdDocAmt.RmtdAmt = null;

							// StrdObj.RfrdDocAmt.DuePyblAmt.value = (billCreditAmt).toFixed(2);
							// if (discAmt==0)
							// 	discAmt = '';
							// else
							// 	discAmt = discAmt.toFixed(2);

							// StrdObj.RfrdDocAmt.DscntApldAmt.value = discAmt;
							StrdObj.RfrdDocAmt.CdtNoteAmt.value = billCreditAmt.toFixed(2);
							StrdObj.RfrdDocAmt.CdtNoteAmt.Ccy = symbol;

							// StrdObj.RfrdDocAmt.DuePyblAmt.Ccy = symbol;
							// StrdObj.RfrdDocAmt.DscntApldAmt.Ccy = symbol;
							// if (arrBC[bc].bcmemo) {
							//   StrdObj.CdtrRefInf = {};
							//   StrdObj.CdtrRefInf.Ref = arrBC[bc].bcmemo;
							// }
							StrdObj.CdtrRefInf = {};
							StrdObj.CdtrRefInf.Ref = billPaymentTranId; //objBillsData[billId].num; //

							Strd.push(StrdObj);
						}
					}

					dLog(
						'Amounts in loop=' + y,
						JSON.stringify({
							totalAmount: totalAmount,
							totalCdtTrfTxInfAmount: totalCdtTrfTxInfAmount,
							netAmt: netAmt,
							tmpAmt: tmpAmt,
						})
					);
				}

				dLog('createUBC_XMLDoc.Strd2', JSON.stringify(Strd));

				noOfBillPayments = noOfBillPayments + 1;
				totalAmount += Number(totalCdtTrfTxInfAmount);
				dLog(
					'Amounts',
					JSON.stringify({
						totalAmount: totalAmount,
						totalCdtTrfTxInfAmount: totalCdtTrfTxInfAmount,
						netAmt: netAmt,
						tmpAmt: tmpAmt,
					})
				);

				cdtTrfTxInfObj.Amt = {};
				cdtTrfTxInfObj.Amt.value = totalCdtTrfTxInfAmount.toFixed(2); //netAmt.toFixed(2); //tmpAmt.toFixed(2); //netAmt.toFixed(2); //tmpAmt.toFixed(2); //amt.toFixed(2);
				cdtTrfTxInfObj.Amt.Ccy = symbol;

				if (paymentMethod == 'DAC' || paymentMethod == 'MTS') {
					cdtTrfTxInfObj.CdtrAgt = {};
					cdtTrfTxInfObj.CdtrAgt.FinInstnId = {};
					// cdtTrfTxInfObj.CdtrAgt.FinInstnId.BIC = objVendor.recbankprimid;
					cdtTrfTxInfObj.CdtrAgt.FinInstnId.ClrSysMmbId = {};
					cdtTrfTxInfObj.CdtrAgt.FinInstnId.ClrSysMmbId.MmbId = objVendor.recbankprimid; // Receiving Bank Routing
					cdtTrfTxInfObj.CdtrAgt.FinInstnId.Nm = objVendor.vbankname || 'custrecord_bankname';

					if (objVendor.vbankaddrs1 || objVendor.vbankzip || objVendor.vbankcity || objVendor.vbankstate) {
						cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr = {};
						cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.Ctry = countryCodeMapping[objVendor.vbankcountry];
						cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.AdrLine = objVendor.vbankaddrs1;
						cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.StrtNm = objVendor.vbankaddrs1;
						cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.PstCd = objVendor.vbankzip;
						cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.TwnNm = objVendor.vbankcity;
						cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.BldgNb = '';
						cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.CtrySubDvsn = objVendor.vbankstate;
					}

					if (paymentMethod == 'MTS') {
						cdtTrfTxInfObj.CdtrAgt.InstrForCdtrAgt = {};
						cdtTrfTxInfObj.CdtrAgt.InstrForCdtrAgt.InstrInf = objVendor.custentity_ica_vendor_bank_instructions;
					}
				}

				cdtTrfTxInfObj.Cdtr = {};
				

				// if (paymentMethod != 'DAC') {
					// if (objVendor.vendorname || objVendor.vendoraddrs1 || objVendor.vendoraddrs2 || objVendor.vendorstateprovince || objVendor.vendorpostal) {
						dLog(
							'Vendor Address',
							JSON.stringify({
								addr1: objVendor.vendoraddrs1,
								addr2: objVendor.vendoraddrs2,
								postal: objVendor.vendorpostal,
								city: objVendor.vendorcity,
								vsp: objVendor.vendorstateprovince,
								countrycode: objVendor.vendorcountrycode,
								countryCodeMapping: countryCodeMapping[objVendor.vendorcountrycode],
							})
						);

            // addressDetails = {
            //   entity: billDetails.getFieldValue('entity'),
            //   addressee: billDetails.getFieldValue('billaddressee'),
            //   addr1: billDetails.getFieldValue('billaddr1'),
            //   addr2: billDetails.getFieldValue('billaddr2'),
            //   city: billDetails.getFieldValue('billcity'),
            //   state: billDetails.getFieldValue('billstate'),
            //   zip: billDetails.getFieldValue('billzip')
            // };

            cdtTrfTxInfObj.Cdtr.Nm = addressDetails.attention; //objVendor.vendorname; //addressDetails.attention; //addressDetails.entity; //objVendor.vendorname;
						cdtTrfTxInfObj.Cdtr.PstlAdr = {};
						// cdtTrfTxInfObj.Cdtr.PstlAdr.StrtNm = addressDetails.addressee; //objVendor.vendorname;
            cdtTrfTxInfObj.Cdtr.PstlAdr.Addressee = addressDetails.addressee; //objVendor.vendorname;
						// cdtTrfTxInfObj.Cdtr.PstlAdr.BldgNb = addressDetails.addr1 + ' ' +  addressDetails.addr2; //(objVendor.vendoraddrs1 + ' ' + objVendor.vendoraddrs2) || '';
						// cdtTrfTxInfObj.Cdtr.PstlAdr.PstCd =  addressDetails.city + ' ' +  addressDetails.state + ' ' + addressDetails.zip; //objVendor.vendorstateprovince + ' ' + objVendor.vendorpostal;

						cdtTrfTxInfObj.Cdtr.PstlAdr.Addr1 = addressDetails.addr1;
            cdtTrfTxInfObj.Cdtr.PstlAdr.Addr2 = addressDetails.addr2;
            cdtTrfTxInfObj.Cdtr.PstlAdr.City = addressDetails.city;
            cdtTrfTxInfObj.Cdtr.PstlAdr.State = addressDetails.state;
            cdtTrfTxInfObj.Cdtr.PstlAdr.Zip = addressDetails.zip;
            cdtTrfTxInfObj.Cdtr.PstlAdr.Country = addressDetails.country;
						// cdtTrfTxInfObj.Cdtr.PstlAdr.PstCd =  addressDetails.city + ' ' +  addressDetails.state + ' ' + addressDetails.zip; //objVendor.vendorstateprovince + ' ' + objVendor.vendorpostal;
            // cdtTrfTxInfObj.Cdtr.PstlAdr.TwnNm = objVendor.vendorcity;
						// cdtTrfTxInfObj.Cdtr.PstlAdr.CtrySubDvsn = objVendor.vendorstateprovince;
						// cdtTrfTxInfObj.Cdtr.PstlAdr.Ctry = countryCodeMapping[objVendor.vendorcountrycode];
					// }
				// } else {
				// 	cdtTrfTxInfObj.Cdtr.PstlAdr = null;
				// }

				// if (paymentMethod == 'CHK') {
					// cdtTrfTxInfObj.Cdtr = {};
					cdtTrfTxInfObj.Cdtr.Id = {};
          cdtTrfTxInfObj.Cdtr.Id.OrgId = {};
					cdtTrfTxInfObj.Cdtr.Id.OrgId.Othr = {};
          var vendorid = objVendor.internalid;
          if (DEFAULT_MSG_VENDOR_ID == 'T') {
            vendorid = objVendor[UNIONBANK_VENDOR_ID] || objVendor.internalid;
          }
					cdtTrfTxInfObj.Cdtr.Id.OrgId.Othr.Id = addressDetails.custbody_ica_union_bank_vendor_id; //vendorid; //objVendor.internalid;
          cdtTrfTxInfObj.InstrForDbtrAgt = addressDetails.custbody_ica_grant_data; //'GB-' + billPayment.refnum;
          cdtTrfTxInfObj.AddtlRmtInf = objBillsData[billId].memo;
				// }

				// cdtTrfTxInfObj.RltdAmtInf = {};
				// cdtTrfTxInfObj.RltdAmtInf.RmtLctnMtd = objVendor.pmp_dac_contactname || "";
				// cdtTrfTxInfObj.RltdAmtInf.RmtLctnElctrncAdr = objVendor.pmp_dac_emailaddress || "";
				if (paymentMethod == 'CHK') {
					dLog('objVendor.custentity_ica_vendor_bank_instructions', objVendor.custentity_ica_vendor_bank_instructions);
					cdtTrfTxInfObj.RmtInf = {};
					// cdtTrfTxInfObj.RmtInf.Ustrd = objVendor.custentity_ica_vendor_bank_instructions; //
					cdtTrfTxInfObj.RmtInf.Strd = Strd;
          // cdtTrfTxInfObj.RmtInf.AddtlRmtInf = objBillsData[billId].memo;
				}
				// dLog("cdtTrfTxInfObj", JSON.stringify(cdtTrfTxInfObj));
				CdtTrfTxInf.push(cdtTrfTxInfObj);
			}

			dLog(
				'About to add totalAmount',
				JSON.stringify({
					totalAmount: totalAmount,
				})
			);

			PmtInfObj.NbOfTxs = noOfBillPayments;
			PmtInfObj.CtrlSum = totalAmount.toFixed(2);
			totalNbOfTxs += Number(noOfBillPayments);
			totalCtrlSum += Number(totalAmount);
			PmtInfObj.CdtTrfTxInf = CdtTrfTxInf;
			PmtInf.push(PmtInfObj);
		}
	}

	objects.NbOfTxs = totalNbOfTxs;
	objects.CtrlSum = totalCtrlSum.toFixed(2);
	objects.PmtInf = PmtInf;

	var fileId = nlapiSearchRecord('file', null, [['name', 'is', 'ica_unionbank_check.xml']], []);
	if (fileId != null) {
		fileId = fileId[0].getId();
	}

	var tmplFile = nlapiLoadFile(fileId);

	var template = Handlebars.compile(tmplFile.getValue());
	var xmlDoc = template(objects);

	dLog('createUBC_XMLDoc.xmlDoc', xmlDoc);
	return xmlDoc;
}

function createJPM_ISO_XMLDoc(objAcctMapping) {
	var arrTempBillIds = [];
	var arrBillCRIds = [];
	var arrBillAmt = [];
	var arrBillAmtOrig = [];
	var arrBillDiscAmt = [];
	var arrBillPayInfoCtr = [];
	var arrBillPayInfoSum = [];
	var arrGrpHdrNbOfTxs = [];
	var arrPmtInfNbOfTxs = [];
	var arrBillIds = [];
	var grpHdrNbOfTxs = 0;
	var grpHdrCtrlSum = 0;
	var arrPayeeIds = [];
	var _currencies = getCurrencies();

	for (x in arrBillsProcessed) {
		var billId = arrBillsProcessed[x].id;
		var billPaymentId = arrBillsProcessed[x].payment;

		dLog('createJPM_ISO_XMLDoc', 'Bill info = ' + JSON.stringify(arrBillsProcessed[x]));
		if (!isEmpty(billPaymentId) && billPaymentId != 'XXXNONEXXX' && billPaymentId != 'CREDIT') {
			if (billPaymentId != 'CREDIT') arrTempBillIds.push(billId);

			var payMethod = arrBillsProcessed[x].paymethod;
			var paymentId = arrBillsProcessed[x].payment;
			var payeeId = arrBillsProcessed[x].payeeid;

			arrBillAmtOrig[billId] = arrBillsProcessed[x].origamt;
			// arrBillAmt[billId] = arrBillsProcessed[x].pay;
			arrBillAmt[billId] = arrBillsProcessed[x].payamt;
			arrBillDiscAmt[billId] = arrBillsProcessed[x].discamt;

			var ndx = payMethod + '@@' + paymentId;

			if (arrBillPayInfoCtr[payMethod] == null) arrBillPayInfoCtr[payMethod] = 0;
			if (arrBillPayInfoSum[payMethod] == null) arrBillPayInfoSum[payMethod] = 0;
			if (arrPmtInfNbOfTxs[ndx] == null) arrPmtInfNbOfTxs[ndx] = 0;

			if (paymentId && arrGrpHdrNbOfTxs[paymentId] == null) grpHdrNbOfTxs++;

			arrPmtInfNbOfTxs[ndx]++;
			arrBillPayInfoCtr[payMethod]++;
			arrBillPayInfoSum[payMethod] += getFloatVal(arrBillsProcessed[x].payamt);
			arrGrpHdrNbOfTxs[paymentId] = paymentId;

			//grpHdrCtrlSum += getFloatVal(arrBillsProcessed[x].payamt);
		}
		grpHdrCtrlSum += getFloatVal(arrBillsProcessed[x].payamt);
		// grpHdrCtrlSum += (getFloatVal(arrBillsProcessed[x].payamt) - getFloatVal(arrBillsProcessed[x].discamt));

		if (billPaymentId == 'CREDIT') arrBillCRIds.push(billId);
	}

	var arrBillIds = [];
	var arrBillIds2 = [];
	var arrBillIds3 = [];
	var arrBillIds4 = [];
	var arrBillIds5 = [];

	for (vx in arrTempBillIds) {
		var isBC = false;
		for (var x in arrBillCRIds) {
			if (arrTempBillIds[vx] == arrBillCRIds[x]) {
				isBC = true;
				break;
			}
		}
		if (!isBC) {
			arrBillIds.push(arrTempBillIds[vx]);
			arrBillIds2.push(arrTempBillIds[vx]);
			arrBillIds3.push(arrTempBillIds[vx]);
			arrBillIds4.push(arrTempBillIds[vx]);
			arrBillIds5.push(arrTempBillIds[vx]);
		}
	}

	var arrBillCredits = getBillCredit(arrBillIds);
	var objBillsData = getBillData(arrBillIds2);
	var arrBillPO = getPOMap(arrBillIds3);
	var arrVendorBills = getPayeeBillsByPayMethod(arrBillIds4);
	var arrVendorBillsCurr = getPayeeBillsCurrency(arrBillIds5);
	var nsAcctSub = !isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('subsidiary', 'CUSTRECORD_ACCT_MAP_NETSUITE_ACCOUNT')) ? objAcctMapping[0].getValue('subsidiary', 'CUSTRECORD_ACCT_MAP_NETSUITE_ACCOUNT') : '';
  var jpmFormCode = objAcctMapping[0].getValue('custrecord_ica_pm_jpm_form_code') || 'A1';

	// var nsAcctSub
	var objVDCRecResults = getVendorDAC_CCRPaymentRec(nsAcctSub);
	dLog('objVDCRecResults', JSON.stringify(objVDCRecResults));
	dLog('objAcctMapping', JSON.stringify(objAcctMapping));

	//Gather data.

	var objects = {
		MsgId: 'TBD',
		CreDtTm: 'Test',
		Authstn: {
			Cd: '',
		},
		NbOfTxs: '2',
		CtrlSum: '2000',
		InitgPty: {
      SchmeNm: '',
      Nm: '', 
			Id: {
				OrgId: {
					Othr: {
						Id: '',            
					},
				},
			},
		},
		PmtInfId: 'PmtInfId',
		PmtMtd: 'PmtMtd',
		PmtTpInf: {
			SvcLvl: {
				Cd: 'This is CD',
			},
		},
		ReqdExctnDt: 'ReqdExctnDt',
		Dbtr: {
			Nm: 'This is Nm',
			PstlAdr: {
				StrtNm: '',
				BldgNb: '',
				PstCd: '',
				TwnNm: '',
				CtrySubDvsn: '',
				Ctry: '',
			},
			Id: {
				Othr: {
					Id: 'Dbtr.Id.Othr.Id',
				},
			},
		},
		DbtrAcct: {
			Id: {
				Othr: {
					Id: 'DbtrAcct.Id.Othr.Id',
				},
			},
			PstlAdr: {
				StrtNm: '',
				BldgNb: '',
				PstCd: '',
				TwnNm: '',
				CtrySubDvsn: '',
				Ctry: '',
			},
		},
		DbtrAgt: {
			FinInstnId: {
				BIC: 'BIC',
				PstlAdr: {
					StrtNm: '',
					BldgNb: '',
					PstCd: '',
					TwnNm: '',
					CtrySubDvsn: '',
					Ctry: '',
				},
			},
		},
		CdtTrfTxInf: CdtTrfTxInf,
	};

	var PmtInf = [];

	for (x in arrVendorBills) {
		var payeeId = x.split('X@X')[1];
		arrPayeeIds.push(payeeId);
	}

	var arrVendors = getEntityData(arrPayeeIds);

	var today = new Date();
	var bpmdate = BPM_DATE;
	var d = nlapiStringToDate(bpmdate, 'datetime');

	var fileCtrlNumber = moment(new Date()).format('YYMMDDmmssSS');
	objects.MsgId = pad(fileCtrlNumber, 4);
	objects.CreDtTm = moment(d).format('YYYY-MM-DDThh:mm:ss') || today.format('{yyyy}-{MM}-{dd}T{hh}:{mm}:{ss}');
	objects.Authstn.Cd = 'AUTH';
	// objects.NbOfTxs = grpHdrNbOfTxs;
	// objects.CtrlSum = grpHdrCtrlSum.toFixed(2); // Do we comment this out?

	if (objects.CtrlSum == '0.00') {
		dLog('CtrlSum is 0.00, this should not happen. Returning empty file', objects.CtrlSum);
		return '';
	}



	if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_dom_ach_co_id'))) {
		objects.InitgPty.Id.OrgId.Othr.Id = objAcctMapping[0].getValue('custrecord_acct_map_dom_ach_co_id'); //Previously CEO ID
	}


	var totalNbOfTxs = 0;
	var totalCtrlSum = 0;

	dLog('JPM ISO: arrBillPayInfoCtr', JSON.stringify(arrBillPayInfoCtr));
	for (x in arrBillPayInfoCtr) {
		//CdtTrfTxInf loop starts here.
		var CdtTrfTxInf = [];

		if (SINGLEBILLPYMTS == 'T') {
			dAudit('Create Single Bill Payments here.', JSON.stringify(arrBillsProcessed));
			var PmtInfObj = {};

			PmtInfObj.PmtInfId = fileCtrlNumber;
			var paymentMethod = x;
			PmtInfObj.PmtMtd = 'TRF';

			// objects.PmtTpInf.SvcLvl.Cd = (paymentMethod == 'DAC') ? 'NURG' : 'URGP';
			PmtInfObj.PmtTpInf = {};
			PmtInfObj.PmtTpInf.SvcLvl = {};
			PmtInfObj.PmtTpInf.SvcLvl.Prtry = paymentMethod == 'DAC' ? 'NORM' : 'URGP';
			PmtInfObj.ReqdExctnDt = moment(d).format('YYYY-MM-DD') || today.format('{yyyy}-{MM}-{dd}');

			if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_companyname'))) {
				PmtInfObj.Dbtr = {};
				PmtInfObj.Dbtr.Nm = objVDCRecResults[0].getValue('custrecord_companyname');
			}

			//PstlAdr
			var country = !isEmpty(objVDCRecResults) ? objVDCRecResults[0].getValue('custrecord_compcountrycode') : '';

			if (
				(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_comppostcode'))) ||
				(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compcity'))) ||
				(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compstateprov'))) ||
				(!isEmpty(objVDCRecResults) && objVDCRecResults[0].getValue('custrecord_compcountrycode')) ||
				(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compadd1')))
			) {
				PmtInfObj.Dbtr = {};
				PmtInfObj.Dbtr.PstlAdr = {};
				if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compadd1'))) {
					PmtInfObj.Dbtr.PstlAdr.StrtNm = '<AdrLine>' + objVDCRecResults[0].getValue('custrecord_compadd1') + '</AdrLine>';
				}
				if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compadd2'))) {
					PmtInfObj.Dbtr.PstlAdr.BldgNb = '<BldgNb>' + objVDCRecResults[0].getValue('custrecord_compadd2') + '</BldgNb>';
				}

				if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_comppostcode'))) {
					PmtInfObj.Dbtr.PstlAdr.PstCd = '<PstCd>' + objVDCRecResults[0].getValue('custrecord_comppostcode') + '</PstCd>';
				}
				// addTextNodeFromParentNode(xmlDoc, pstlAdr, 'PstCd', objVDCRecResults[0].getValue('custrecord_comppostcode'));

				if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compcity'))) {
					PmtInfObj.Dbtr.PstlAdr.TwnNm = '<TwnNm>' + objVDCRecResults[0].getValue('custrecord_compcity') + '</TwnNm>';
				}
				// addTextNodeFromParentNode(xmlDoc, pstlAdr, 'TwnNm', objVDCRecResults[0].getValue('custrecord_compcity'));

				//Where do we get CtrySubDvsn?
				if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compstateprov'))) {
					PmtInfObj.Dbtr.PstlAdr.TwnNm = '<CtrySubDvsn>' + objVDCRecResults[0].getValue('custrecord_compstateprov') + '</CtrySubDvsn>';
				}

				// addTextNodeFromParentNode(xmlDoc, pstlAdr, 'Ctry', country);
				if (country) {
					PmtInfObj.Dbtr.PstlAdr.Ctry = '<Ctry>' + country + '</Ctry>';
				}
			}

			PmtInfObj.Dbtr.Id = {};
			PmtInfObj.Dbtr.Id.Othr = {};
			// if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_dom_ach_co_id'))) {
			// 	PmtInfObj.Dbtr.OrgId.Id.Othr.Id = objAcctMapping[0].getValue('custrecord_acct_map_dom_ach_co_id'); //ACH Company ID
			// }

      // RSF
      if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ceo_company_id'))) {
        PmtInfObj.Dbtr.Id.OrgId.Othr.Id = objAcctMapping[0].getValue('custrecord_acct_map_ceo_company_id');
      }


			//DbtrAcct
			PmtInfObj.DbtrAcct = {};
			PmtInfObj.DbtrAcct.Id = {};
			PmtInfObj.DbtrAcct.Id.Othr = {};
			if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_origin_acc'))) {
				PmtInfObj.DbtrAcct.Id.Othr.Id = objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_origin_acc'); // Bank Account Number

				var symbol = '';
				try {
					symbol = _.find(_currencies, { internalid: String(objAcctMapping[0].getValue('custrecord_acct_map_account_currency')) }).symbol;
					PmtInfObj.DbtrAcct.Ccy = symbol; //objAcctMapping[0].getValue('custrecord_acct_map_account_currency') || ''; // Bank Currency
					dAudit('DbtrAcct.Ccy-Currency', objAcctMapping[0].getValue('custrecord_acct_map_account_currency'));
					dAudit('DbtrAcct.Ccy', JSON.stringify(_currencies));
				} catch (e) {}
			}

			//DbtrAgt
			if ((!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id'))) || !isEmpty(country)) {
				if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id'))) {
					// objects.DbtrAgt.FinInstnId.BIC = objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id');

					PmtInfObj.DbtrAgt = {};
					PmtInfObj.DbtrAgt.Nm = objVDCRecResults[0].getValue('custrecord_bankname') || '';
					PmtInfObj.DbtrAgt.FinInstnId = {};
					PmtInfObj.DbtrAgt.FinInstnId.ClrSysMmbId = {};
					PmtInfObj.DbtrAgt.FinInstnId.ClrSysMmbId.MmbId = objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id'); // Routing Number 10 Digit
				}
				PmtInfObj.DbtrAgt.FinInstnId.PstlAdr = {};
				PmtInfObj.DbtrAgt.FinInstnId.PstlAdr.Ctry = 'CA';
			}

			for (var i = 0; i < arrBillsProcessed.length; i++) {
				
				var billPayment = arrBillsProcessed[i];

				if (billPayment.payment == 'CREDIT') {
					continue;
				}

				var symbol = '';

				try {
					symbol = _.find(_currencies, { internalid: String(billPayment.currid) }).symbol || 'USD';
				} catch (e) {}

				var objVendor = arrVendors[billPayment.payeeid];
				if (!objVendor) objVendor = _.find(arrVendors, { internalid: String(billPayment.payeeid) });

				dLog('objVendor', JSON.stringify(objVendor));

				var cdtTrfTxInfObj = {};
				cdtTrfTxInfObj.PmtId = {};

				var refnum = billPayment.refnum; //arrBillPaymentMap[billPayment.payeeid];
				// var refnum = billPayment.billnum; //arrBillPaymentMap[billPayment.payeeid];
				var instrId = '';
				if (refnum.length > 12) {
					instrId = pz(refnum.substring(refnum.length - 12, refnum.length), 12);
				} else {
					instrId = pz(refnum, 12);
				}
				refnum = billPayment.billnum; //Overwrite endToendID
				var endToEndId = refnum;
				if (refnum.length > 18) {
					endToEndId = refnum.substr(0, 18);
				}

				endToEndId = moment(d).format('YYYY-MM-DDThh:mm:ss');

				cdtTrfTxInfObj.PmtId.InstrId = instrId;
				cdtTrfTxInfObj.PmtId.EndToEndId = endToEndId;
				cdtTrfTxInfObj.Amt = {};
				cdtTrfTxInfObj.Amt.value = billPayment.payamt; //amt.toFixed(2);
				cdtTrfTxInfObj.Amt.Ccy = symbol;
				cdtTrfTxInfObj.ChrgBr = billPayment.paymethod == 'MTS' ? 'CRED' : '';

				cdtTrfTxInfObj.CdtrAgt = {};
				cdtTrfTxInfObj.CdtrAgt.FinInstnId = {};
				// cdtTrfTxInfObj.CdtrAgt.FinInstnId.BIC = objVendor.recbankprimid;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.ClrSysMmbId = {};
        if (billPayment.paymethod == 'MTS') {
          dAudit('objVendor.recbankprimidtype', objVendor.recbankprimidtype);
          if (objVendor.recbankprimidtype==1) { //ABA
            dAudit('ABA', objVendor.recbankprimid);
            cdtTrfTxInfObj.CdtrAgt.FinInstnId.ClrSysMmbId.BIC = '';          
            cdtTrfTxInfObj.CdtrAgt.FinInstnId.ClrSysMmbId.MmbId = objVendor.recbankprimid;  
          } else {
            dAudit('SWT', objVendor.recbankprimid);
            cdtTrfTxInfObj.CdtrAgt.FinInstnId.ClrSysMmbId.BIC = objVendor.recbankprimid;
            cdtTrfTxInfObj.CdtrAgt.FinInstnId.ClrSysMmbId.MmbId = '';  
          }           
        } else {
          cdtTrfTxInfObj.CdtrAgt.FinInstnId.ClrSysMmbId.MmbId = '';
          cdtTrfTxInfObj.CdtrAgt.FinInstnId.ClrSysMmbId.BIC = '';          
          cdtTrfTxInfObj.CdtrAgt.FinInstnId.ClrSysMmbId.MmbId = objVendor.recbankprimid;
        }
				
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.Nm = objVendor.vbankname;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr = {};
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.Ctry = countryCodeMapping[objVendor.vbankcountry];
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.AdrLine = objVendor.vbankaddrs1;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.StrtNm = objVendor.vbankaddrs1;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.BldgNb = '';
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.PstCd = objVendor.vbankzip;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.TwnNm = objVendor.vbankcity;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.CtrySubDvsn = objVendor.vbankstate;

				if (billPayment.paymethod == 'MTS') {
					cdtTrfTxInfObj.CdtrAgt.InstrForCdtrAgt = {};
					cdtTrfTxInfObj.CdtrAgt.InstrForCdtrAgt.InstrInf = objVendor.custentity_ica_vendor_bank_instructions;
				}

				cdtTrfTxInfObj.Cdtr = {};
				cdtTrfTxInfObj.Cdtr.Nm = objVendor.vendorname;
				cdtTrfTxInfObj.Cdtr.PstlAdr = {};
				cdtTrfTxInfObj.Cdtr.PstlAdr.StrtNm = objVendor.vendoraddrs1;
				cdtTrfTxInfObj.Cdtr.PstlAdr.BldgNb = objVendor.vendoraddrs2 || '';
				cdtTrfTxInfObj.Cdtr.PstlAdr.PstCd = objVendor.vendorpostal;
				cdtTrfTxInfObj.Cdtr.PstlAdr.TwnNm = objVendor.vendorcity;
				cdtTrfTxInfObj.Cdtr.PstlAdr.CtrySubDvsn = objVendor.vendorstateprovince;
				cdtTrfTxInfObj.Cdtr.PstlAdr.Ctry = countryCodeMapping[objVendor.vendorcountrycode];

				cdtTrfTxInfObj.CdtrAcct = {};
				cdtTrfTxInfObj.CdtrAcct.Id = {};
				cdtTrfTxInfObj.CdtrAcct.Id.Othr = {};
				cdtTrfTxInfObj.CdtrAcct.Id.Othr.Id = objVendor.recpartyaccount;

				// cdtTrfTxInfObj.RltdAmtInf = {};
				// cdtTrfTxInfObj.RltdAmtInf.RmtLctnMtd = objVendor.pmp_dac_contactname || "";
				// cdtTrfTxInfObj.RltdAmtInf.RmtLctnElctrncAdr = objVendor.pmp_dac_emailaddress || "";
				cdtTrfTxInfObj.RmtInf = {};
				cdtTrfTxInfObj.RmtInf.Ustrd = refnum;
				cdtTrfTxInfObj.RmtInf.VendorId = objVendor.entityid;
				cdtTrfTxInfObj.RmtInf.Category = objVendor.category;

				cdtTrfTxInfObj.RmtInf.Strd = Strd;

				CdtTrfTxInf.push(cdtTrfTxInfObj);
			}
			PmtInfObj.CdtTrfTxInf = CdtTrfTxInf;
			PmtInf.push(PmtInfObj);
		} else {
			dAudit('arrVendorBills', arrVendorBills);
			var refnum = '';
			var currency = '';
			var symbol = '';
			try {
				dLog('objAcctMapping', JSON.stringify(objAcctMapping));
				symbol = _.find(_currencies, { internalid: String(objAcctMapping[0].getValue('custrecord_acct_map_account_currency')) }).symbol;
			} catch (e) {
				symbol = 'USD';
			}

			dLog('SYMBOL', symbol);

			var PmtInfObj = {};
			// var fileCtrlNumber = Date.create().format("{yy}{MM}{dd}{mm}{ss}"); //RSF add millisecs
			var fileCtrlNumber = moment(new Date()).format('YYMMDDmmssSS');
			PmtInfObj.PmtInfId = fileCtrlNumber;
			var paymentMethod = x;
			if (paymentMethod == 'CHK') {
				PmtInfObj.PmtMtd = 'CHK';
			} else {
				PmtInfObj.PmtMtd = 'TRF';
			}

      dLog('About to add Nm', objVDCRecResults[0].getValue('custrecord_companyname'));
      if (paymentMethod=='CCR') {
        if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_companyname'))) {    
          objects.InitgPty.Nm = objVDCRecResults[0].getValue('custrecord_companyname');
          dLog('Added Nm', objVDCRecResults[0].getValue('custrecord_companyname'));
        }  
    
        if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ceo_company_id'))) {
          objects.InitgPty.SchmeNm = objAcctMapping[0].getValue('custrecord_acct_map_ceo_company_id');
        }  
      }      

			// objects.PmtTpInf.SvcLvl.Cd = (paymentMethod == 'DAC') ? 'NURG' : 'URGP';
			if (paymentMethod == 'DAC' || paymentMethod == 'MTS' || paymentMethod == 'CCR') {
				PmtInfObj.PmtTpInf = {};
				PmtInfObj.PmtTpInf.SvcLvl = {};

				if (paymentMethod == 'DAC') {
					PmtInfObj.PmtTpInf.SvcLvl.Cd = 'NURG';
				} else if (paymentMethod == 'CHK') {
					PmtInfObj.PmtTpInf.SvcLvl.Prtry = 'PM';
				} else if (paymentMethod == 'MTS') {
					PmtInfObj.PmtTpInf.SvcLvl.Cd = 'URGP';
				} else if (paymentMethod == 'CCR') {
          PmtInfObj.PmtTpInf.SvcLvl.Cd = 'NURG';
        }
			}


			PmtInfObj.ReqdExctnDt = moment(d).format('YYYY-MM-DD') || today.format('{yyyy}-{MM}-{dd}');

			dAudit('objVDCRecResults', JSON.stringify(objVDCRecResults));
			if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_companyname'))) {
				PmtInfObj.Dbtr = {};
				PmtInfObj.Dbtr.Nm = objVDCRecResults[0].getValue('custrecord_companyname');
				dLog('Added Nm', objVDCRecResults[0].getValue('custrecord_companyname'));
			}

			//PstlAdr
			var country = !isEmpty(objVDCRecResults) ? objVDCRecResults[0].getValue('custrecord_compcountrycode') : '';

			if (
				(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_comppostcode'))) ||
				(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compcity'))) ||
				(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compstateprov'))) ||
				(!isEmpty(objVDCRecResults) && objVDCRecResults[0].getValue('custrecord_compcountrycode')) ||
				(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compadd1')))
			) {
				PmtInfObj.Dbtr.PstlAdr = {};

        if (paymentMethod!='CCR') {
          if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compadd1'))) {
            PmtInfObj.Dbtr.PstlAdr.StrtNm = '<StrtNm>' + objVDCRecResults[0].getValue('custrecord_compadd1') + '</StrtNm>';
          }
          if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compadd2'))) {
            PmtInfObj.Dbtr.PstlAdr.BldgNb = '<BldgNb>' + objVDCRecResults[0].getValue('custrecord_compadd2') + '</BldgNb>';
          }
  
          if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_comppostcode'))) {
            PmtInfObj.Dbtr.PstlAdr.PstCd = '<PstCd>' + objVDCRecResults[0].getValue('custrecord_comppostcode') + '</PstCd>';
          }
          // addTextNodeFromParentNode(xmlDoc, pstlAdr, 'PstCd', objVDCRecResults[0].getValue('custrecord_comppostcode'));
  
          if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compcity'))) {
            PmtInfObj.Dbtr.PstlAdr.TwnNm = '<TwnNm>' + objVDCRecResults[0].getValue('custrecord_compcity') + '</TwnNm>';
          }
          // addTextNodeFromParentNode(xmlDoc, pstlAdr, 'TwnNm', objVDCRecResults[0].getValue('custrecord_compcity'));
  
          //Where do we get CtrySubDvsn?
          if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compstateprov'))) {
            PmtInfObj.Dbtr.PstlAdr.TwnNm = '<CtrySubDvsn>' + objVDCRecResults[0].getValue('custrecord_compstateprov') + '</CtrySubDvsn>';
          }  
        }

				// addTextNodeFromParentNode(xmlDoc, pstlAdr, 'Ctry', country);
				if (country) {
					PmtInfObj.Dbtr.PstlAdr.Ctry = '<Ctry>' + country + '</Ctry>';
				}
			}

			if (paymentMethod == 'DAC') {
				PmtInfObj.Dbtr.Id = {};
				PmtInfObj.Dbtr.Id.Othr = {};

				// if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_dom_ach_co_id'))) {
				// 	PmtInfObj.Dbtr.Id.Othr.Id = objAcctMapping[0].getValue('custrecord_acct_map_dom_ach_co_id'); //ACH Company ID
				// }

				PmtInfObj.Dbtr.Id.OrgId = {};
				PmtInfObj.Dbtr.Id.OrgId.Othr = {};

				if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ceo_company_id'))) {
					PmtInfObj.Dbtr.Id.OrgId.Othr.Id = objAcctMapping[0].getValue('custrecord_acct_map_ceo_company_id');
				}

				// if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_dom_ach_co_id'))) {
				// 	PmtInfObj.Dbtr.Id.OrgId.Othr.Id = objAcctMapping[0].getValue('custrecord_acct_map_dom_ach_co_id'); //ACH Company ID
				// }


				if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_bankname'))) {
					PmtInfObj.Dbtr.Id.OrgId.Othr.SchmeNm = {};
					PmtInfObj.Dbtr.Id.OrgId.Othr.SchmeNm.Cd = objVDCRecResults[0].getValue('custrecord_bankname');
				}
			}

			//DbtrAcct
			PmtInfObj.DbtrAcct = {};
			PmtInfObj.DbtrAcct.Id = {};
			PmtInfObj.DbtrAcct.Id.Othr = {};
      if (paymentMethod=='CCR') {        
        PmtInfObj.DbtrAcct.Id.Othr.Id = objAcctMapping[0].getValue('custrecord_acct_map_credit_card_man');
        if (paymentMethod=='CCR') {
          PmtInfObj.DbtrAcct.Tp = {};
          PmtInfObj.DbtrAcct.Tp.Prtry = 'YES';
        }
        try {          
          PmtInfObj.DbtrAcct.Ccy = symbol;
          dAudit('DbtrAcct.Ccy', objAcctMapping[0].getValue('custrecord_acct_map_account_currency'));
          dAudit('DbtrAcct.Ccy_currencies', JSON.stringify(_currencies));
        } catch (e) {}
  
      } else {
        if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_origin_acc'))) {
          PmtInfObj.DbtrAcct.Id.Othr.Id = objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_origin_acc'); // Bank Account Number
  
          if (paymentMethod=='CCR') {
            PmtInfObj.DbtrAcct.Tp = {};
            PmtInfObj.DbtrAcct.Tp.Prtry = 'YES';
          }
  
          // var symbol = "";
          try {
            // symbol = _.find(_currencies, { internalid: String(objAcctMapping[0].getValue("custrecord_acct_map_account_currency")) }).symbol || "USD";
            PmtInfObj.DbtrAcct.Ccy = symbol; //objAcctMapping[0].getValue('custrecord_acct_map_account_currency') || ''; // Bank Currency
            dAudit('DbtrAcct.Ccy', objAcctMapping[0].getValue('custrecord_acct_map_account_currency'));
            dAudit('DbtrAcct.Ccy_currencies', JSON.stringify(_currencies));
          } catch (e) {}
        }
  
      }

			//DbtrAgt
			if ((!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id'))) || !isEmpty(country)) {
				if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id'))) {
					// objects.DbtrAgt.FinInstnId.BIC = objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id');
					dLog('Here BIC', objAcctMapping[0].getValue('custrecord_acct_map_hsbc_swift_bank_id'));
					PmtInfObj.DbtrAgt = {};

          if (paymentMethod=='CCR') {
            // PmtInfObj.DbtrAgt.Nm = objVDCRecResults[0].getValue('custrecord_bankname') || '';
          } else {
            PmtInfObj.DbtrAgt.Nm = objVDCRecResults[0].getValue('custrecord_bankname') || '';
          }
					
					PmtInfObj.DbtrAgt.FinInstnId = {};
          if (paymentMethod != 'MTS') {
            if (paymentMethod!='CCR') {
              PmtInfObj.DbtrAgt.FinInstnId.ClrSysMmbId = {};
              PmtInfObj.DbtrAgt.FinInstnId.ClrSysMmbId.MmbId = objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id'); // Routing Number 10 Digit    
            }
          } else {
            dAudit('DbtrAgt.FinInstnId.ClrSysMmbId should be empty', 'MTS');
            PmtInfObj.DbtrAgt.FinInstnId.ClrSysMmbId = null;
            PmtInfObj.DbtrAgt.Nm = null;
          }
				}
				var country = !isEmpty(objVDCRecResults) ? objVDCRecResults[0].getValue('custrecord_ica_orig_bank_country_code') : '';
				if (!isEmpty(country)) {
					dLog('Here Country Code', country);
					PmtInfObj.DbtrAgt.FinInstnId.PstlAdr = {};
					PmtInfObj.DbtrAgt.FinInstnId.PstlAdr.Ctry = country;
				}
			}
      if (paymentMethod == 'DAC') {
        dLog('Here DAC MmbId', objAcctMapping[0].getValue('custrecord_acct_map_hsbc_swift_bank_id'));
        // PmtInfObj.DbtrAgt.MmbId = objAcctMapping[0].getValue('custrecord_acct_map_hsbc_swift_bank_id');
      }
      if ((paymentMethod == 'MTS')||(paymentMethod == 'CCR')) {
        dLog('Here MTS BIC', objAcctMapping[0].getValue('custrecord_acct_map_hsbc_swift_bank_id'));
        PmtInfObj.DbtrAgt.BIC = objAcctMapping[0].getValue('custrecord_acct_map_hsbc_swift_bank_id') || 'BIC';
      }

      dLog('PmtInfObj', JSON.stringify(PmtInfObj));

			var noOfBillPayments = 0;
			var totalAmount = 0;
			for (v in arrVendorBills) {
				var arrPayeeInfo = v.split('X@X');
				var payeeId = arrPayeeInfo[1];

				//var objVendor=arrVendors[payeeId];
        dLog('arrVendors-jpm-iso', arrVendors);
				       var objVendor = _.find(arrVendors, { internalid: String(payeeId)});
				// var objVendor = _.find(arrVendors, { internalid: String(payeeId), paymentmethod: String(paymentMethod) })[0];
dAudit('objVendor-new', objVendor);				dLog('objVendor', JSON.stringify(objVendor));

				if (isEmpty(objVendor)) continue;

				var pmtMethod = objVendor.paymentmethod;

				if (paymentMethod != pmtMethod) continue;
				//JPM ISO
				if (pmtMethod == 'DAC') {
					PmtInfObj.PmtTpInf.LclInstrm = {};
					PmtInfObj.PmtTpInf.LclInstrm.Cd = objVendor.payformat;
				}
        else if (pmtMethod == 'CCR') {
					PmtInfObj.PmtTpInf.LclInstrm = {};
					PmtInfObj.PmtTpInf.LclInstrm.Prtry = 950; 
        }
        if (pmtMethod == 'CCR') {
          PmtInfObj.PmtTpInf.CtgyPurp = {};
          PmtInfObj.PmtTpInf.CtgyPurp.Cd = 'CCRD';
        }
  

				var arrBills = arrVendorBills[paymentMethod + 'X@X' + payeeId];
				dLog('arrBills', JSON.stringify(arrBills));
				var tmpAmt = 0;

				var numberOfBills = _.size(arrBills);
				var billnum = '';
				var billPaymentTranId = '';
				for (by in arrBills) {
					var billId = arrBills[by];
					refnum = _.find(arrBillsProcessed, { id: String(billId) }).refnum;
					currency = _.find(arrBillsProcessed, { id: String(billId) }).currid;
					subtext = _.find(arrBillsProcessed, { id: String(billId) }).subtext;
					billnum = _.find(arrBillsProcessed, { id: String(billId) }).billnum;
					billPaymentTranId = _.find(arrBillsProcessed, { id: String(billId) }).refnum;
          duedate = _.find(arrBillsProcessed, { id: String(billId) }).duedate;
					dLog('duedate', duedate);

					try {
						symbol = _.find(_currencies, { internalid: String(currency) }).symbol || 'USD';
					} catch (e) {}
					dLog('billPaymentTranId', billPaymentTranId);

					var netAmt = 0;
					var origAmt = getFloatVal(arrBillAmtOrig[billId]);
					var amt = getFloatVal(arrBillAmt[billId]);

					var discAmt = !isEmpty(arrBillDiscAmt[billId]) ? getFloatVal(arrBillDiscAmt[billId]) : 0;

					dLog(
						'amounts',
						JSON.stringify({
							netAmt: netAmt,
							origAmt: origAmt,
							amt: amt,
							discAmt: discAmt,
						})
					);

					netAmt = origAmt;
					tmpAmt += amt; //used to be netAmt

					if (discAmt > 0) {
						netAmt -= discAmt;
						tmpAmt -= discAmt;
					}

					if (!isEmpty(arrBillCredits[billId])) {
						var arrBC = arrBillCredits[billId];

						dLog('arrBC in arrBills', JSON.stringify(arrBC));

						for (bc in arrBC) {
							var billCreditAmtP = getFloatVal(arrBC[bc].bcamt);
							var billCreditAmt = billCreditAmtP * -1;

							// tmpAmt = (tmpAmt - billCreditAmtP);
							netAmt = netAmt - billCreditAmtP;
						}
					}
				}

				var cdtTrfTxInfObj = {};
				cdtTrfTxInfObj.PmtId = {};

				var refnum = arrBillPaymentMap[payeeId] || '';
				var instrId = '';
				if (refnum.length > 12) {
					instrId = pz(refnum.substring(refnum.length - 12, refnum.length), 12);
				} else {
					instrId = pz(refnum, 12);
				}
				var endToEndId = billnum.substr(0, 18);
				if (numberOfBills > 1) {
					endToEndId = subtext.substr(0, 18);
				}

				var s = String(moment().valueOf());
				s = s.slice(s.length - 6);
				endToEndId = moment(d).format('YYYYMMDD') + s;

				cdtTrfTxInfObj.PmtId.InstrId = instrId;
				cdtTrfTxInfObj.PmtId.EndToEndId = endToEndId;

				if (paymentMethod == 'CHK') {
					cdtTrfTxInfObj.PmtInfObj = {};
					cdtTrfTxInfObj.PmtInfObj.PmtTpInf = {};
					cdtTrfTxInfObj.PmtInfObj.PmtTpInf.SvcLvl = {};

					if (objVendor.deliverycode == '') {
						cdtTrfTxInfObj.PmtInfObj.PmtTpInf.SvcLvl.Prtry = '00PY1';
					} else {
						cdtTrfTxInfObj.PmtInfObj.PmtTpInf.SvcLvl.Prtry = '00000';
					}
					cdtTrfTxInfObj.ChqInstr = {};
					cdtTrfTxInfObj.ChqInstr.ChqNb = billPaymentTranId;
					if (objVendor.deliverycode) {
						cdtTrfTxInfObj.ChqInstr.DlvryMtd = {};
						cdtTrfTxInfObj.ChqInstr.DlvryMtd.Cd = objVendor.deliverycode;
					}
          cdtTrfTxInfObj.ChqInstr.FrmsCd = jpmFormCode;
          dLog("FrmsCd", jpmFormCode);
				}

				if (paymentMethod == 'DAC') {
					cdtTrfTxInfObj.ChrgBr = 'DEBT';
					// cdtTrfTxInfObj.ChrgBr = (paymentMethod == 'MTS') ? 'CRED' : "";
				} else if (paymentMethod == 'MTS') {
					cdtTrfTxInfObj.ChrgBr = 'DEBT';
				}

				if (paymentMethod == 'DAC' || paymentMethod == 'CHK') {
					cdtTrfTxInfObj.ClrSysId = {};
					cdtTrfTxInfObj.ClrSysId.Cd = 'CACPA';
				}

				tmpAmt = 0; // need to initialize back to 0

				var Strd = [];
				var totalCdtTrfTxInfAmount = 0;

				for (y in arrBills) {
					var billId = arrBills[y];
					var StrdObj = {};
					StrdObj.RfrdDocInf = {};
					StrdObj.RfrdDocInf.Tp = {};
					StrdObj.RfrdDocInf.Tp.CdOrPrtry = {};
					StrdObj.RfrdDocInf.Tp.CdOrPrtry.Cd = 'CINV';

					var netAmt = 0;
					var origAmt = getFloatVal(arrBillAmtOrig[billId]);
					var amt = getFloatVal(arrBillAmt[billId]);

					var discAmt = !isEmpty(arrBillDiscAmt[billId]) ? getFloatVal(arrBillDiscAmt[billId]) : 0;

					// dLog("billId before", billId);
					// dLog("arrBC in y.arrBills before", JSON.stringify(arrBillCredits));
					dLog(
						'values',
						JSON.stringify({
							netAmt: netAmt,
							origAmt: origAmt,
							amt: amt,
							discAmt: discAmt,
							tmpAmt: tmpAmt,
						})
					);

					if (!isEmpty(arrBillCredits[billId])) {
						var arrBC = arrBillCredits[billId];

						dLog('arrBC in y.arrBills', JSON.stringify(arrBC));

						for (bc in arrBC) {
							var billCreditAmtP = getFloatVal(arrBC[bc].bcamt);
							var billCreditAmt = billCreditAmtP * -1;

							// tmpAmt = (tmpAmt - billCreditAmtP);
							netAmt = netAmt - billCreditAmtP;
						}
					}

					// tmpAmt += amt;
					netAmt = origAmt;
					tmpAmt += amt; //used to be netAmt
					totalCdtTrfTxInfAmount += amt; //origAmt;

					if (discAmt > 0) {
						netAmt -= discAmt;
						tmpAmt -= discAmt;
						// totalCdtTrfTxInfAmount -= discAmt;
					}

					dLog('createJPM_ISO_XMLDoc. objBillsData', JSON.stringify(objBillsData[billId]));
          if (paymentMethod=='CHK') {            
            StrdObj.RfrdDocInf.Nb = moment(duedate, "DD-MMMM-YYYY").format("MM/DD/YY");
          } else {
            StrdObj.RfrdDocInf.Nb = objBillsData[billId].num; //objBillsData[billId].memo; //billPaymentTranId;
          }				

					var invoiceDate = objBillsData[billId].dte;
					StrdObj.RfrdDocInf.RltdDt = formatDate(nlapiStringToDate(invoiceDate));
					StrdObj.RfrdDocAmt = {};
					StrdObj.RfrdDocAmt.DuePyblAmt = {};
					StrdObj.RfrdDocAmt.DscntApldAmt = {};
					StrdObj.RfrdDocAmt.RmtdAmt = {};
					StrdObj.RfrdDocAmt.DuePyblAmt.value = origAmt.toFixed(2);

					if (discAmt == 0) discAmt = '';
					else discAmt = discAmt.toFixed(2);

					StrdObj.RfrdDocAmt.DscntApldAmt.value = discAmt;

					//RSF - Added to make the RmtdAmt the same as DuePyblAmt
					if (!isEmpty(arrBillCredits[billId])) {
						var arrBC = arrBillCredits[billId];
						for (bc in arrBC) {
							var billCreditAmt = getFloatVal(arrBC[bc].bcamt);
							amt += Number(billCreditAmt);
						}
					}

					StrdObj.RfrdDocAmt.RmtdAmt.value = amt.toFixed(2); //netAmt.toFixed(2);

					StrdObj.RfrdDocAmt.DuePyblAmt.Ccy = symbol;
					StrdObj.RfrdDocAmt.DscntApldAmt.Ccy = symbol;
					StrdObj.RfrdDocAmt.RmtdAmt.Ccy = symbol;

					//Add CDtrRefInf
					StrdObj.CdtrRefInf = {};
					StrdObj.CdtrRefInf.Tp = {};
					StrdObj.CdtrRefInf.CdOrPrtry = {};
					StrdObj.CdtrRefInf.CdOrPrtry.Cd = billPaymentTranId; //"CINV";
					// if (objBillsData[billId].memo) {
					//   StrdObj.CdtrRefInf.Ref = objBillsData[billId].memo || '';
					// }
					StrdObj.CdtrRefInf.Ref = billPaymentTranId; //objBillsData[billId].num; //billPaymentTranId;

          if (paymentMethod=='CHK') {
            StrdObj.AddtlRmtInf = {};
            StrdObj.AddtlRmtInf = billnum;
          }

					Strd.push(StrdObj);

					if (!isEmpty(arrBillCredits[billId])) {
						var arrBC = arrBillCredits[billId];

						for (bc in arrBC) {
							var billCreditAmtP = getFloatVal(arrBC[bc].bcamt);
							var billCreditAmt = billCreditAmtP;

							tmpAmt = tmpAmt - billCreditAmtP;
							netAmt = netAmt - billCreditAmtP;
							// totalCdtTrfTxInfAmount -= billCreditAmtP;

							var StrdObj = {};
							StrdObj.RfrdDocInf = {};
							StrdObj.RfrdDocInf.Tp = {};
							StrdObj.RfrdDocInf.Tp.CdOrPrtry = {};
							StrdObj.RfrdDocInf.Tp.CdOrPrtry.Cd = 'CREN'; //Hardcoded?

							var bcNum = arrBC[bc].bcnum;
							dLog('createJPMXMLDoc', 'VC number : ' + bcNum);
							dLog('arrBC[bc]', JSON.stringify(arrBC));

							if (!isEmpty(bcNum)) StrdObj.RfrdDocInf.Nb = bcNum;
							else if (!isEmpty(arrBillCredits[billId].bcmemo)) {
								StrdObj.RfrdDocInf.Nb = arrBillCredits[billId].bcmemo;
							}

							var invoiceDate = objBillsData[billId].dte;
							StrdObj.RfrdDocInf.RltdDt = formatDate(nlapiStringToDate(arrBC[bc].bcdate));

							StrdObj.RfrdDocAmt = {};
							StrdObj.RfrdDocAmt.CdtNoteAmt = {};
							StrdObj.RfrdDocAmt.DuePyblAmt = null;
							StrdObj.RfrdDocAmt.DscntApldAmt = null;
							StrdObj.RfrdDocAmt.RmtdAmt = null;

							// StrdObj.RfrdDocAmt.DuePyblAmt.value = (billCreditAmt).toFixed(2);
							// if (discAmt==0)
							// 	discAmt = '';
							// else
							// 	discAmt = discAmt.toFixed(2);

							// StrdObj.RfrdDocAmt.DscntApldAmt.value = discAmt;
							StrdObj.RfrdDocAmt.CdtNoteAmt.value = billCreditAmt.toFixed(2);
							StrdObj.RfrdDocAmt.CdtNoteAmt.Ccy = symbol;

							// StrdObj.RfrdDocAmt.DuePyblAmt.Ccy = symbol;
							// StrdObj.RfrdDocAmt.DscntApldAmt.Ccy = symbol;
							// if (arrBC[bc].bcmemo) {
							//   StrdObj.CdtrRefInf = {};
							//   StrdObj.CdtrRefInf.Ref = arrBC[bc].bcmemo;
							// }
							StrdObj.CdtrRefInf = {};
							StrdObj.CdtrRefInf.Ref = billPaymentTranId; //objBillsData[billId].num; //

							Strd.push(StrdObj);
						}
					}

					dLog(
						'Amounts in loop=' + y,
						JSON.stringify({
							totalAmount: totalAmount,
							totalCdtTrfTxInfAmount: totalCdtTrfTxInfAmount,
							netAmt: netAmt,
							tmpAmt: tmpAmt,
						})
					);
				}

				dLog('createJPM_ISO_XMLDoc.Strd2', JSON.stringify(Strd));

				noOfBillPayments = noOfBillPayments + 1;
				totalAmount += Number(totalCdtTrfTxInfAmount);
				dLog(
					'Amounts',
					JSON.stringify({
						totalAmount: totalAmount,
						totalCdtTrfTxInfAmount: totalCdtTrfTxInfAmount,
						netAmt: netAmt,
						tmpAmt: tmpAmt,
					})
				);

				cdtTrfTxInfObj.Amt = {};
				cdtTrfTxInfObj.Amt.value = totalCdtTrfTxInfAmount.toFixed(2); //netAmt.toFixed(2); //tmpAmt.toFixed(2); //netAmt.toFixed(2); //tmpAmt.toFixed(2); //amt.toFixed(2);
				cdtTrfTxInfObj.Amt.Ccy = symbol;

				if (paymentMethod == 'DAC' || paymentMethod == 'MTS') {
					cdtTrfTxInfObj.CdtrAgt = {};
					cdtTrfTxInfObj.CdtrAgt.FinInstnId = {};
					// cdtTrfTxInfObj.CdtrAgt.FinInstnId.BIC = objVendor.recbankprimid;
          if (paymentMethod=='DAC') {
            cdtTrfTxInfObj.CdtrAgt.FinInstnId.ClrSysMmbId = {};
            cdtTrfTxInfObj.CdtrAgt.FinInstnId.ClrSysMmbId.MmbId = objVendor.recbankprimid; // Receiving Bank Routing  
          } else if (paymentMethod=='MTS') {

            cdtTrfTxInfObj.CdtrAgt.FinInstnId.ClrSysMmbId = {};
            dAudit('objVendor.recbankprimidtype', objVendor.recbankprimidtype);
            if (objVendor.recbankprimidtype=='ABA') { //ABA
              dAudit('ABA', objVendor.recbankprimid);
              cdtTrfTxInfObj.CdtrAgt.FinInstnId.ClrSysMmbId.BIC = '';          
              cdtTrfTxInfObj.CdtrAgt.FinInstnId.ClrSysMmbId.MmbId = objVendor.recbankprimid;  
            } else {
              dAudit('SWT', objVendor.recbankprimid);
              cdtTrfTxInfObj.CdtrAgt.FinInstnId.ClrSysMmbId.BIC = objVendor.recbankprimid;
              cdtTrfTxInfObj.CdtrAgt.FinInstnId.ClrSysMmbId.MmbId = '';  
            }           
    
            // cdtTrfTxInfObj.CdtrAgt.FinInstnId.ClrSysMmbId = {};
            // cdtTrfTxInfObj.CdtrAgt.FinInstnId.ClrSysMmbId.BIC = objVendor.recbankprimid; // Receiving Bank Routing  
          }
					cdtTrfTxInfObj.CdtrAgt.FinInstnId.Nm = objVendor.vbankname || 'custrecord_bankname';

					if (objVendor.vbankaddrs1 || objVendor.vbankzip || objVendor.vbankcity || objVendor.vbankstate) {
						cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr = {};
						cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.Ctry = countryCodeMapping[objVendor.vbankcountry];
						cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.AdrLine = objVendor.vbankaddrs1;
						cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.StrtNm = objVendor.vbankaddrs1;
						cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.PstCd = objVendor.vbankzip;
						cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.TwnNm = objVendor.vbankcity;
						cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.BldgNb = '';
						cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.CtrySubDvsn = objVendor.vbankstate;
					}

					if (paymentMethod == 'MTS') {
						cdtTrfTxInfObj.CdtrAgt.InstrForCdtrAgt = {};
						cdtTrfTxInfObj.CdtrAgt.InstrForCdtrAgt.InstrInf = objVendor.custentity_ica_vendor_bank_instructions;
					}
				}

				cdtTrfTxInfObj.Cdtr = {};
				cdtTrfTxInfObj.Cdtr.Nm = objVendor.vendorname;

				if (paymentMethod != 'DAC') {
					if (objVendor.vendoraddrs1 || objVendor.vendoraddrs2 || objVendor.vendorpostal || objVendor.vendorcity || objVendor.vendorstateprovince || countryCodeMapping[objVendor.vendorcountrycode]) {
						dLog(
							'Vendor Address',
							JSON.stringify({
								addr1: objVendor.vendoraddrs1,
								addr2: objVendor.vendoraddrs2,
								postal: objVendor.vendorpostal,
								city: objVendor.vendorcity,
								vsp: objVendor.vendorstateprovince,
								countrycode: objVendor.vendorcountrycode,
								countryCodeMapping: countryCodeMapping[objVendor.vendorcountrycode],
							})
						);
						cdtTrfTxInfObj.Cdtr.PstlAdr = {};
						cdtTrfTxInfObj.Cdtr.PstlAdr.StrtNm = objVendor.vendoraddrs1;
						cdtTrfTxInfObj.Cdtr.PstlAdr.BldgNb = objVendor.vendoraddrs2 || '';
						cdtTrfTxInfObj.Cdtr.PstlAdr.PstCd = objVendor.vendorpostal;
						cdtTrfTxInfObj.Cdtr.PstlAdr.TwnNm = objVendor.vendorcity;
						cdtTrfTxInfObj.Cdtr.PstlAdr.CtrySubDvsn = objVendor.vendorstateprovince;
						cdtTrfTxInfObj.Cdtr.PstlAdr.Ctry = countryCodeMapping[objVendor.vendorcountrycode];
					}
				} else {
					cdtTrfTxInfObj.Cdtr.PstlAdr = null;
				}

        if (paymentMethod == 'CCR') {
          cdtTrfTxInfObj.Cdtr.CtctDtls = objVendor.vemailadrs;
        }


        

				if (paymentMethod == 'DAC' || paymentMethod == 'MTS') {
					cdtTrfTxInfObj.CdtrAcct = {};
					cdtTrfTxInfObj.CdtrAcct.Id = {};
					cdtTrfTxInfObj.CdtrAcct.Id.Othr = {};
					cdtTrfTxInfObj.CdtrAcct.Id.Othr.Id = objVendor.recpartyaccount;

					if (paymentMethod == 'DAC') {
						cdtTrfTxInfObj.CdtrAcct.Tp = {};
						cdtTrfTxInfObj.CdtrAcct.Tp.Cd = 'CACC';
					}
				}

				// cdtTrfTxInfObj.RltdAmtInf = {};
				// cdtTrfTxInfObj.RltdAmtInf.RmtLctnMtd = objVendor.pmp_dac_contactname || "";
				// cdtTrfTxInfObj.RltdAmtInf.RmtLctnElctrncAdr = objVendor.pmp_dac_emailaddress || "";
				if (paymentMethod == 'CHK' || paymentMethod == 'CCR') {
					dLog('objVendor.custentity_ica_vendor_bank_instructions', objVendor.custentity_ica_vendor_bank_instructions);
					cdtTrfTxInfObj.RmtInf = {};
					cdtTrfTxInfObj.RmtInf.Ustrd = objVendor.custentity_ica_vendor_bank_instructions; //
					cdtTrfTxInfObj.RmtInf.Strd = Strd;
				}
				// dLog("cdtTrfTxInfObj", JSON.stringify(cdtTrfTxInfObj));
				CdtTrfTxInf.push(cdtTrfTxInfObj);
			}

			dLog(
				'About to add totalAmount',
				JSON.stringify({
					totalAmount: totalAmount,
				})
			);

			PmtInfObj.NbOfTxs = noOfBillPayments;
			PmtInfObj.CtrlSum = totalAmount.toFixed(2);
			totalNbOfTxs += Number(noOfBillPayments);
			totalCtrlSum += Number(totalAmount);
			PmtInfObj.CdtTrfTxInf = CdtTrfTxInf;
			PmtInf.push(PmtInfObj);
		}
	}

	objects.NbOfTxs = totalNbOfTxs; //grpHdrNbOfTxs;
	objects.CtrlSum = totalCtrlSum.toFixed(2); //grpHdrCtrlSum.toFixed(2); // Do we comment this out?
	objects.PmtInf = PmtInf;
	// objects.CdtTrfTxInf = CdtTrfTxInf;
	dLog("objects.PmtInf", JSON.stringify(objects.PmtInf));
	// dLog('objects.CdtTrfTxInf', JSON.stringify(objects.CdtTrfTxInf));

	var fileId = nlapiSearchRecord('file', null, [['name', 'is', 'ica_jpm_iso.xml']], []);
	if (fileId != null) {
		fileId = fileId[0].getId();
	}

	var tmplFile = nlapiLoadFile(fileId);

	var template = Handlebars.compile(tmplFile.getValue());
	var xmlDoc = template(objects);

	dLog('xmlDoc', xmlDoc);
	return xmlDoc;
}

function createSANTANDER_POLAND_XMLDoc(objAcctMapping) {
	var arrTempBillIds = [];
	var arrBillCRIds = [];
	var arrBillAmt = [];
	var arrBillAmtOrig = [];
	var arrBillDiscAmt = [];
	var arrBillPayInfoCtr = [];
	var arrBillPayInfoSum = [];
	var arrGrpHdrNbOfTxs = [];
	var arrPmtInfNbOfTxs = [];
	var arrBillIds = [];
	var grpHdrNbOfTxs = 0;
	var grpHdrCtrlSum = 0;
	var arrPayeeIds = [];
	var _currencies = getCurrencies();

	for (x in arrBillsProcessed) {
		var billId = arrBillsProcessed[x].id;
		var billPaymentId = arrBillsProcessed[x].payment;

		dLog('createSANTANDER_POLAND_XMLDoc', 'Bill info = ' + JSON.stringify(arrBillsProcessed[x]));
		if (!isEmpty(billPaymentId) && billPaymentId != 'XXXNONEXXX' && billPaymentId != 'CREDIT') {
			if (billPaymentId != 'CREDIT') arrTempBillIds.push(billId);

			var payMethod = arrBillsProcessed[x].paymethod;
			var paymentId = arrBillsProcessed[x].payment;
			var payeeId = arrBillsProcessed[x].payeeid;

			arrBillAmtOrig[billId] = arrBillsProcessed[x].origamt;
			// arrBillAmt[billId] = arrBillsProcessed[x].pay;
			arrBillAmt[billId] = arrBillsProcessed[x].payamt;
			arrBillDiscAmt[billId] = arrBillsProcessed[x].discamt;

			var ndx = payMethod + '@@' + paymentId;

			if (arrBillPayInfoCtr[payMethod] == null) arrBillPayInfoCtr[payMethod] = 0;
			if (arrBillPayInfoSum[payMethod] == null) arrBillPayInfoSum[payMethod] = 0;
			if (arrPmtInfNbOfTxs[ndx] == null) arrPmtInfNbOfTxs[ndx] = 0;

			if (paymentId && arrGrpHdrNbOfTxs[paymentId] == null) grpHdrNbOfTxs++;

			arrPmtInfNbOfTxs[ndx]++;
			arrBillPayInfoCtr[payMethod]++;
			arrBillPayInfoSum[payMethod] += getFloatVal(arrBillsProcessed[x].payamt);
			arrGrpHdrNbOfTxs[paymentId] = paymentId;

			//grpHdrCtrlSum += getFloatVal(arrBillsProcessed[x].payamt);
		}
		grpHdrCtrlSum += getFloatVal(arrBillsProcessed[x].payamt);
		// grpHdrCtrlSum += (getFloatVal(arrBillsProcessed[x].payamt) - getFloatVal(arrBillsProcessed[x].discamt));

		if (billPaymentId == 'CREDIT') arrBillCRIds.push(billId);
	}

	var arrBillIds = [];
	var arrBillIds2 = [];
	var arrBillIds3 = [];
	var arrBillIds4 = [];
	var arrBillIds5 = [];

	for (vx in arrTempBillIds) {
		var isBC = false;
		for (var x in arrBillCRIds) {
			if (arrTempBillIds[vx] == arrBillCRIds[x]) {
				isBC = true;
				break;
			}
		}
		if (!isBC) {
			arrBillIds.push(arrTempBillIds[vx]);
			arrBillIds2.push(arrTempBillIds[vx]);
			arrBillIds3.push(arrTempBillIds[vx]);
			arrBillIds4.push(arrTempBillIds[vx]);
			arrBillIds5.push(arrTempBillIds[vx]);
		}
	}

	var arrBillCredits = getBillCredit(arrBillIds);
	var objBillsData = getBillData(arrBillIds2);
	var arrBillPO = getPOMap(arrBillIds3);
	var arrVendorBills = getPayeeBillsByPayMethod(arrBillIds4);
	var arrVendorBillsCurr = getPayeeBillsCurrency(arrBillIds5);
	var nsAcctSub = !isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('subsidiary', 'CUSTRECORD_ACCT_MAP_NETSUITE_ACCOUNT')) ? objAcctMapping[0].getValue('subsidiary', 'CUSTRECORD_ACCT_MAP_NETSUITE_ACCOUNT') : '';
  var jpmFormCode = objAcctMapping[0].getValue('custrecord_ica_pm_jpm_form_code') || 'A1';

	// var nsAcctSub
	var objVDCRecResults = getVendorDAC_CCRPaymentRec(nsAcctSub);
	dLog('objVDCRecResults', JSON.stringify(objVDCRecResults));
	dLog('objAcctMapping', JSON.stringify(objAcctMapping));

	//Gather data.

	var objects = {
		MsgId: 'TBD',
		CreDtTm: 'Test',
		Authstn: {
			Cd: '',
		},
		NbOfTxs: '2',
		CtrlSum: '2000',
		InitgPty: {
      SchmeNm: '',
      Nm: '', 
			Id: {
				OrgId: {
					Othr: {
						Id: '',            
					},
				},
			},
		},
		PmtInfId: 'PmtInfId',
		PmtMtd: 'PmtMtd',
		PmtTpInf: {
			SvcLvl: {
				Cd: 'This is CD',
			},
		},
		ReqdExctnDt: 'ReqdExctnDt',
		Dbtr: {
			Nm: 'This is Nm',
			PstlAdr: {
				StrtNm: '',
				BldgNb: '',
				PstCd: '',
				TwnNm: '',
				CtrySubDvsn: '',
				Ctry: '',
			},
			Id: {
				Othr: {
					Id: 'Dbtr.Id.Othr.Id',
				},
			},
		},
		DbtrAcct: {
			Id: {
				Othr: {
					Id: 'DbtrAcct.Id.Othr.Id',
				},
			},
			PstlAdr: {
				StrtNm: '',
				BldgNb: '',
				PstCd: '',
				TwnNm: '',
				CtrySubDvsn: '',
				Ctry: '',
			},
		},
		DbtrAgt: {
			FinInstnId: {
				BIC: 'BIC',
				PstlAdr: {
					StrtNm: '',
					BldgNb: '',
					PstCd: '',
					TwnNm: '',
					CtrySubDvsn: '',
					Ctry: '',
				},
			},
		},
		CdtTrfTxInf: CdtTrfTxInf,
	};

	var PmtInf = [];

	for (x in arrVendorBills) {
		var payeeId = x.split('X@X')[1];
		arrPayeeIds.push(payeeId);
	}

	var arrVendors = getEntityData(arrPayeeIds);

	var today = new Date();
	var bpmdate = BPM_DATE;
	var d = nlapiStringToDate(bpmdate, 'datetime');

	var fileCtrlNumber = moment(new Date()).format('YYMMDDmmssSS');
	objects.MsgId = pad(fileCtrlNumber, 4);
	objects.CreDtTm = moment(d).format('YYYY-MM-DDThh:mm:ss') || today.format('{yyyy}-{MM}-{dd}T{hh}:{mm}:{ss}');
	objects.Authstn.Cd = 'AUTH';
	// objects.NbOfTxs = grpHdrNbOfTxs;
	// objects.CtrlSum = grpHdrCtrlSum.toFixed(2); // Do we comment this out?

	if (objects.CtrlSum == '0.00') {
		dLog('CtrlSum is 0.00, this should not happen. Returning empty file', objects.CtrlSum);
		return '';
	}



	if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_dom_ach_co_id'))) {
		objects.InitgPty.Id.OrgId.Othr.Id = objAcctMapping[0].getValue('custrecord_acct_map_dom_ach_co_id'); //Previously CEO ID
	}


	var totalNbOfTxs = 0;
	var totalCtrlSum = 0;

	dLog('JPM ISO: arrBillPayInfoCtr', JSON.stringify(arrBillPayInfoCtr));
	for (x in arrBillPayInfoCtr) {
		//CdtTrfTxInf loop starts here.
		var CdtTrfTxInf = [];

		if (SINGLEBILLPYMTS == 'T') {
			dAudit('Create Single Bill Payments here.', JSON.stringify(arrBillsProcessed));
			var PmtInfObj = {};

			PmtInfObj.PmtInfId = fileCtrlNumber;
			var paymentMethod = x;
			PmtInfObj.PmtMtd = 'TRF';

			// objects.PmtTpInf.SvcLvl.Cd = (paymentMethod == 'DAC') ? 'NURG' : 'URGP';
			PmtInfObj.PmtTpInf = {};
			PmtInfObj.PmtTpInf.SvcLvl = {};
			PmtInfObj.PmtTpInf.SvcLvl.Prtry = paymentMethod == 'DAC' ? 'NORM' : 'URGP';
			PmtInfObj.ReqdExctnDt = moment(d).format('YYYY-MM-DD') || today.format('{yyyy}-{MM}-{dd}');

			if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_companyname'))) {
				PmtInfObj.Dbtr = {};
				PmtInfObj.Dbtr.Nm = objVDCRecResults[0].getValue('custrecord_companyname');
			}

			//PstlAdr
			var country = !isEmpty(objVDCRecResults) ? objVDCRecResults[0].getValue('custrecord_compcountrycode') : '';

			if (
				(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_comppostcode'))) ||
				(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compcity'))) ||
				(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compstateprov'))) ||
				(!isEmpty(objVDCRecResults) && objVDCRecResults[0].getValue('custrecord_compcountrycode')) ||
				(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compadd1')))
			) {
				PmtInfObj.Dbtr = {};
				PmtInfObj.Dbtr.PstlAdr = {};
				if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compadd1'))) {
					PmtInfObj.Dbtr.PstlAdr.StrtNm = '<AdrLine>' + objVDCRecResults[0].getValue('custrecord_compadd1') + '</AdrLine>';
				}
				if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compadd2'))) {
					PmtInfObj.Dbtr.PstlAdr.BldgNb = '<BldgNb>' + objVDCRecResults[0].getValue('custrecord_compadd2') + '</BldgNb>';
				}

				if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_comppostcode'))) {
					PmtInfObj.Dbtr.PstlAdr.PstCd = '<PstCd>' + objVDCRecResults[0].getValue('custrecord_comppostcode') + '</PstCd>';
				}
				// addTextNodeFromParentNode(xmlDoc, pstlAdr, 'PstCd', objVDCRecResults[0].getValue('custrecord_comppostcode'));

				if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compcity'))) {
					PmtInfObj.Dbtr.PstlAdr.TwnNm = '<TwnNm>' + objVDCRecResults[0].getValue('custrecord_compcity') + '</TwnNm>';
				}
				// addTextNodeFromParentNode(xmlDoc, pstlAdr, 'TwnNm', objVDCRecResults[0].getValue('custrecord_compcity'));

				//Where do we get CtrySubDvsn?
				if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compstateprov'))) {
					PmtInfObj.Dbtr.PstlAdr.TwnNm = '<CtrySubDvsn>' + objVDCRecResults[0].getValue('custrecord_compstateprov') + '</CtrySubDvsn>';
				}

				// addTextNodeFromParentNode(xmlDoc, pstlAdr, 'Ctry', country);
				if (country) {
					PmtInfObj.Dbtr.PstlAdr.Ctry = '<Ctry>' + country + '</Ctry>';
				}
			}

			PmtInfObj.Dbtr.Id = {};
			PmtInfObj.Dbtr.Id.Othr = {};
			// if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_dom_ach_co_id'))) {
			// 	PmtInfObj.Dbtr.OrgId.Id.Othr.Id = objAcctMapping[0].getValue('custrecord_acct_map_dom_ach_co_id'); //ACH Company ID
			// }

      // RSF
      if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ceo_company_id'))) {
        PmtInfObj.Dbtr.Id.OrgId.Othr.Id = objAcctMapping[0].getValue('custrecord_acct_map_ceo_company_id');
      }


			//DbtrAcct
			PmtInfObj.DbtrAcct = {};
			PmtInfObj.DbtrAcct.Id = {};
			PmtInfObj.DbtrAcct.Id.Othr = {};
			if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_origin_acc'))) {
				PmtInfObj.DbtrAcct.Id.Othr.Id = objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_origin_acc'); // Bank Account Number

				var symbol = '';
				try {
					symbol = _.find(_currencies, { internalid: String(objAcctMapping[0].getValue('custrecord_acct_map_account_currency')) }).symbol;
					PmtInfObj.DbtrAcct.Ccy = symbol; //objAcctMapping[0].getValue('custrecord_acct_map_account_currency') || ''; // Bank Currency
					dAudit('DbtrAcct.Ccy-Currency', objAcctMapping[0].getValue('custrecord_acct_map_account_currency'));
					dAudit('DbtrAcct.Ccy', JSON.stringify(_currencies));
				} catch (e) {}
			}

			//DbtrAgt
			if ((!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id'))) || !isEmpty(country)) {
				if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id'))) {
					// objects.DbtrAgt.FinInstnId.BIC = objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id');

					PmtInfObj.DbtrAgt = {};
					PmtInfObj.DbtrAgt.Nm = objVDCRecResults[0].getValue('custrecord_bankname') || '';
					PmtInfObj.DbtrAgt.FinInstnId = {};
					PmtInfObj.DbtrAgt.FinInstnId.ClrSysMmbId = {};
					PmtInfObj.DbtrAgt.FinInstnId.ClrSysMmbId.MmbId = objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id'); // Routing Number 10 Digit
				}
				PmtInfObj.DbtrAgt.FinInstnId.PstlAdr = {};
				PmtInfObj.DbtrAgt.FinInstnId.PstlAdr.Ctry = 'CA';
			}

			for (var i = 0; i < arrBillsProcessed.length; i++) {
				
				var billPayment = arrBillsProcessed[i];

				if (billPayment.payment == 'CREDIT') {
					continue;
				}

				var symbol = '';

				try {
					symbol = _.find(_currencies, { internalid: String(billPayment.currid) }).symbol || 'USD';
				} catch (e) {}

				var objVendor = arrVendors[billPayment.payeeid];
				if (!objVendor) objVendor = _.find(arrVendors, { internalid: String(billPayment.payeeid) });

				dLog('objVendor', JSON.stringify(objVendor));

				var cdtTrfTxInfObj = {};
				cdtTrfTxInfObj.PmtId = {};

				var refnum = billPayment.refnum; //arrBillPaymentMap[billPayment.payeeid];
				// var refnum = billPayment.billnum; //arrBillPaymentMap[billPayment.payeeid];
				var instrId = '';
				if (refnum.length > 12) {
					instrId = pz(refnum.substring(refnum.length - 12, refnum.length), 12);
				} else {
					instrId = pz(refnum, 12);
				}
				refnum = billPayment.billnum; //Overwrite endToendID
				var endToEndId = refnum;
				if (refnum.length > 18) {
					endToEndId = refnum.substr(0, 18);
				}

				endToEndId = moment(d).format('YYYY-MM-DDThh:mm:ss');

				cdtTrfTxInfObj.PmtId.InstrId = instrId;
				cdtTrfTxInfObj.PmtId.EndToEndId = endToEndId;
				cdtTrfTxInfObj.Amt = {};
				cdtTrfTxInfObj.Amt.value = billPayment.payamt; //amt.toFixed(2);
				cdtTrfTxInfObj.Amt.Ccy = symbol;
				cdtTrfTxInfObj.ChrgBr = billPayment.paymethod == 'MTS' ? 'CRED' : '';

				cdtTrfTxInfObj.CdtrAgt = {};
				cdtTrfTxInfObj.CdtrAgt.FinInstnId = {};
				// cdtTrfTxInfObj.CdtrAgt.FinInstnId.BIC = objVendor.recbankprimid;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.ClrSysMmbId = {};
        if (paymentMethod=='MTS') {
          cdtTrfTxInfObj.CdtrAgt.FinInstnId.ClrSysMmbId.BIC = objVendor.recbankprimid;
          cdtTrfTxInfObj.CdtrAgt.FinInstnId.ClrSysMmbId.MmbId = '';
        } else {
          cdtTrfTxInfObj.CdtrAgt.FinInstnId.ClrSysMmbId.MmbId = '';
          cdtTrfTxInfObj.CdtrAgt.FinInstnId.ClrSysMmbId.MmbId = objVendor.recbankprimid;
        }
				
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.Nm = objVendor.vbankname;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr = {};
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.Ctry = countryCodeMapping[objVendor.vbankcountry];
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.AdrLine = objVendor.vbankaddrs1;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.StrtNm = objVendor.vbankaddrs1;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.BldgNb = '';
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.PstCd = objVendor.vbankzip;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.TwnNm = objVendor.vbankcity;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.CtrySubDvsn = objVendor.vbankstate;

				if (billPayment.paymethod == 'MTS') {
					cdtTrfTxInfObj.CdtrAgt.InstrForCdtrAgt = {};
					cdtTrfTxInfObj.CdtrAgt.InstrForCdtrAgt.InstrInf = objVendor.custentity_ica_vendor_bank_instructions;
				}

				cdtTrfTxInfObj.Cdtr = {};
				cdtTrfTxInfObj.Cdtr.Nm = objVendor.vendorname;
				cdtTrfTxInfObj.Cdtr.PstlAdr = {};
				cdtTrfTxInfObj.Cdtr.PstlAdr.StrtNm = objVendor.vendoraddrs1;
				cdtTrfTxInfObj.Cdtr.PstlAdr.BldgNb = objVendor.vendoraddrs2 || '';
				cdtTrfTxInfObj.Cdtr.PstlAdr.PstCd = objVendor.vendorpostal;
				cdtTrfTxInfObj.Cdtr.PstlAdr.TwnNm = objVendor.vendorcity;
				cdtTrfTxInfObj.Cdtr.PstlAdr.CtrySubDvsn = objVendor.vendorstateprovince;
				cdtTrfTxInfObj.Cdtr.PstlAdr.Ctry = countryCodeMapping[objVendor.vendorcountrycode];

				cdtTrfTxInfObj.CdtrAcct = {};
				cdtTrfTxInfObj.CdtrAcct.Id = {};
				cdtTrfTxInfObj.CdtrAcct.Id.Othr = {};
				cdtTrfTxInfObj.CdtrAcct.Id.Othr.Id = objVendor.recpartyaccount;

				// cdtTrfTxInfObj.RltdAmtInf = {};
				// cdtTrfTxInfObj.RltdAmtInf.RmtLctnMtd = objVendor.pmp_dac_contactname || "";
				// cdtTrfTxInfObj.RltdAmtInf.RmtLctnElctrncAdr = objVendor.pmp_dac_emailaddress || "";
				cdtTrfTxInfObj.RmtInf = {};
				cdtTrfTxInfObj.RmtInf.Ustrd = refnum;
				cdtTrfTxInfObj.RmtInf.VendorId = objVendor.entityid;
				cdtTrfTxInfObj.RmtInf.Category = objVendor.category;

				cdtTrfTxInfObj.RmtInf.Strd = Strd;

				CdtTrfTxInf.push(cdtTrfTxInfObj);
			}
			PmtInfObj.CdtTrfTxInf = CdtTrfTxInf;
			PmtInf.push(PmtInfObj);
		} else {
			dAudit('arrVendorBills', arrVendorBills);
			var refnum = '';
			var currency = '';
			var symbol = '';
			try {
				dLog('objAcctMapping', JSON.stringify(objAcctMapping));
				symbol = _.find(_currencies, { internalid: String(objAcctMapping[0].getValue('custrecord_acct_map_account_currency')) }).symbol;
			} catch (e) {
				symbol = 'USD';
			}

			dLog('SYMBOL', symbol);

			var PmtInfObj = {};
			// var fileCtrlNumber = Date.create().format("{yy}{MM}{dd}{mm}{ss}"); //RSF add millisecs
			var fileCtrlNumber = moment(new Date()).format('YYMMDDmmssSS');
			PmtInfObj.PmtInfId = fileCtrlNumber;
			var paymentMethod = x;
			if (paymentMethod == 'CHK') {
				PmtInfObj.PmtMtd = 'CHK';
			} else {
				PmtInfObj.PmtMtd = 'TRF';
			}
      dLog('objVDCRecResults', objVDCRecResults);
      dLog('About to add Nm', objVDCRecResults[0].getValue('custrecord_companyname'));
      if (paymentMethod=='CCR') {
        if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_companyname'))) {    
          objects.InitgPty.Nm = objVDCRecResults[0].getValue('custrecord_companyname');
          dLog('Added Nm', objVDCRecResults[0].getValue('custrecord_companyname'));
        }  
    
        if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ceo_company_id'))) {
          objects.InitgPty.SchmeNm = objAcctMapping[0].getValue('custrecord_acct_map_ceo_company_id');
        }  
      }      

			// objects.PmtTpInf.SvcLvl.Cd = (paymentMethod == 'DAC') ? 'NURG' : 'URGP';
			if (paymentMethod == 'DAC' || paymentMethod == 'MTS' || paymentMethod == 'CCR') {
				PmtInfObj.PmtTpInf = {};
				PmtInfObj.PmtTpInf.SvcLvl = {};

				if (paymentMethod == 'DAC') {
					PmtInfObj.PmtTpInf.SvcLvl.Cd = 'NURG';
				} else if (paymentMethod == 'CHK') {
					PmtInfObj.PmtTpInf.SvcLvl.Prtry = 'PM';
				} else if (paymentMethod == 'MTS') {
					PmtInfObj.PmtTpInf.SvcLvl.Cd = 'URGP';
				} else if (paymentMethod == 'CCR') {
          PmtInfObj.PmtTpInf.SvcLvl.Cd = 'NURG';
        }
			}


			PmtInfObj.ReqdExctnDt = moment(d).format('YYYY-MM-DD') || today.format('{yyyy}-{MM}-{dd}');

			dAudit('objVDCRecResults', JSON.stringify(objVDCRecResults));
			if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_companyname'))) {
				PmtInfObj.Dbtr = {};
				PmtInfObj.Dbtr.Nm = objVDCRecResults[0].getValue('custrecord_companyname');
				dLog('Added Nm', objVDCRecResults[0].getValue('custrecord_companyname'));
			}

			//PstlAdr
			var country = !isEmpty(objVDCRecResults) ? objVDCRecResults[0].getValue('custrecord_compcountrycode') : '';

			if (
				(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_comppostcode'))) ||
				(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compcity'))) ||
				(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compstateprov'))) ||
				(!isEmpty(objVDCRecResults) && objVDCRecResults[0].getValue('custrecord_compcountrycode')) ||
				(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compadd1')))
			) {
				PmtInfObj.Dbtr.PstlAdr = {};

        if (paymentMethod!='CCR') {
          if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compadd1'))) {
            PmtInfObj.Dbtr.PstlAdr.AdrLine = '<AdrLine>' + objVDCRecResults[0].getValue('custrecord_compadd1');

            if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compadd2'))) {
              PmtInfObj.Dbtr.PstlAdr.AdrLine += ' ' + objVDCRecResults[0].getValue('custrecord_compadd2');
            }              
            PmtInfObj.Dbtr.PstlAdr.AdrLine +='</AdrLine>';
          }
    
          if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compcity'))) {
            PmtInfObj.Dbtr.PstlAdr.AdrLine += '<AdrLine>' + objVDCRecResults[0].getValue('custrecord_compcity') + '</AdrLine>';            
          }
        }

				// addTextNodeFromParentNode(xmlDoc, pstlAdr, 'Ctry', country);
				if (country) {
					PmtInfObj.Dbtr.PstlAdr.Ctry = '<Ctry>' + country + '</Ctry>';
				}
			}

			if (paymentMethod == 'DAC') {
				PmtInfObj.Dbtr.Id = {};
				PmtInfObj.Dbtr.Id.Othr = {};

				// if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_dom_ach_co_id'))) {
				// 	PmtInfObj.Dbtr.Id.Othr.Id = objAcctMapping[0].getValue('custrecord_acct_map_dom_ach_co_id'); //ACH Company ID
				// }

				PmtInfObj.Dbtr.Id.OrgId = {};
				PmtInfObj.Dbtr.Id.OrgId.Othr = {};

				if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ceo_company_id'))) {
					PmtInfObj.Dbtr.Id.OrgId.Othr.Id = objAcctMapping[0].getValue('custrecord_acct_map_ceo_company_id');
				}

				// if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_dom_ach_co_id'))) {
				// 	PmtInfObj.Dbtr.Id.OrgId.Othr.Id = objAcctMapping[0].getValue('custrecord_acct_map_dom_ach_co_id'); //ACH Company ID
				// }


				if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_bankname'))) {
					PmtInfObj.Dbtr.Id.OrgId.Othr.SchmeNm = {};
					PmtInfObj.Dbtr.Id.OrgId.Othr.SchmeNm.Cd = objVDCRecResults[0].getValue('custrecord_bankname');
				}
			}

			//DbtrAcct
			PmtInfObj.DbtrAcct = {};
			PmtInfObj.DbtrAcct.Id = {};
			PmtInfObj.DbtrAcct.Id.Othr = {};
			if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_origin_acc'))) {
				PmtInfObj.DbtrAcct.Id.Othr.Id = objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_origin_acc'); // Bank Account Number

        if (paymentMethod=='CCR') {
          PmtInfObj.DbtrAcct.Tp = {};
          PmtInfObj.DbtrAcct.Tp.Prtry = 'YES';
        }

				// var symbol = "";
				try {
					// symbol = _.find(_currencies, { internalid: String(objAcctMapping[0].getValue("custrecord_acct_map_account_currency")) }).symbol || "USD";
					PmtInfObj.DbtrAcct.Ccy = symbol; //objAcctMapping[0].getValue('custrecord_acct_map_account_currency') || ''; // Bank Currency
					dAudit('DbtrAcct.Ccy', objAcctMapping[0].getValue('custrecord_acct_map_account_currency'));
					dAudit('DbtrAcct.Ccy_currencies', JSON.stringify(_currencies));
				} catch (e) {}
			}

			//DbtrAgt
			if ((!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id'))) || !isEmpty(country)) {
				if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id'))) {
					// objects.DbtrAgt.FinInstnId.BIC = objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id');
					dLog('Here BIC', objAcctMapping[0].getValue('custrecord_acct_map_hsbc_swift_bank_id'));
					PmtInfObj.DbtrAgt = {};

          if (paymentMethod=='CCR') {
            // PmtInfObj.DbtrAgt.Nm = objVDCRecResults[0].getValue('custrecord_bankname') || '';
          } else {
            PmtInfObj.DbtrAgt.Nm = objVDCRecResults[0].getValue('custrecord_bankname') || '';
          }
					
					PmtInfObj.DbtrAgt.FinInstnId = {};
          if (paymentMethod != 'MTS') {
            if (paymentMethod!='CCR') {
              PmtInfObj.DbtrAgt.FinInstnId.ClrSysMmbId = {};
              PmtInfObj.DbtrAgt.FinInstnId.ClrSysMmbId.MmbId = objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id'); // Routing Number 10 Digit    
            }
          } else {
            dAudit('DbtrAgt.FinInstnId.ClrSysMmbId should be empty', 'MTS');
            PmtInfObj.DbtrAgt.FinInstnId.ClrSysMmbId = null;
            PmtInfObj.DbtrAgt.Nm = null;
          }
          PmtInfObj.DbtrAgt.MmbId = objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id');
				}
				var country = !isEmpty(objVDCRecResults) ? objVDCRecResults[0].getValue('custrecord_ica_orig_bank_country_code') : '';
				if (!isEmpty(country)) {
					dLog('Here Country Code', country);
					PmtInfObj.DbtrAgt.FinInstnId.PstlAdr = {};
					PmtInfObj.DbtrAgt.FinInstnId.PstlAdr.Ctry = country;
				}
			}
      if (paymentMethod == 'DAC') {
        dLog('Here DAC MmbId', objAcctMapping[0].getValue('custrecord_acct_map_hsbc_swift_bank_id'));
        // PmtInfObj.DbtrAgt.MmbId = objAcctMapping[0].getValue('custrecord_acct_map_hsbc_swift_bank_id');
      }
      if ((paymentMethod == 'MTS')||(paymentMethod == 'CCR')) {
        dLog('Here MTS BIC', objAcctMapping[0].getValue('custrecord_acct_map_hsbc_swift_bank_id'));
        PmtInfObj.DbtrAgt.BIC = objAcctMapping[0].getValue('custrecord_acct_map_hsbc_swift_bank_id') || 'BIC';
      }

      dLog('PmtInfObj', JSON.stringify(PmtInfObj));

			var noOfBillPayments = 0;
			var totalAmount = 0;
			for (v in arrVendorBills) {
				var arrPayeeInfo = v.split('X@X');
				var payeeId = arrPayeeInfo[1];

				//var objVendor=arrVendors[payeeId];
        dLog('arrVendors-jpm-iso', arrVendors);
				       var objVendor = _.find(arrVendors, { internalid: String(payeeId)});
				// var objVendor = _.find(arrVendors, { internalid: String(payeeId), paymentmethod: String(paymentMethod) })[0];
dAudit('objVendor-new', objVendor);				dLog('objVendor', JSON.stringify(objVendor));

				if (isEmpty(objVendor)) continue;

				var pmtMethod = objVendor.paymentmethod;

				if (paymentMethod != pmtMethod) continue;
				//JPM ISO
				if (pmtMethod == 'DAC') {
					PmtInfObj.PmtTpInf.LclInstrm = {};
					PmtInfObj.PmtTpInf.LclInstrm.Cd = objVendor.payformat;
				}
        else if (pmtMethod == 'CCR') {
					PmtInfObj.PmtTpInf.LclInstrm = {};
					PmtInfObj.PmtTpInf.LclInstrm.Cd = 950; 
        }
        if (pmtMethod == 'CCR') {
          PmtInfObj.PmtTpInf.CtgyPurp = {};
          PmtInfObj.PmtTpInf.CtgyPurp.Cd = 'CCRD';
        }
  

				var arrBills = arrVendorBills[paymentMethod + 'X@X' + payeeId];
				dLog('arrBills', JSON.stringify(arrBills));
				var tmpAmt = 0;

				var numberOfBills = _.size(arrBills);
				var billnum = '';
				var billPaymentTranId = '';
				for (by in arrBills) {
					var billId = arrBills[by];
					refnum = _.find(arrBillsProcessed, { id: String(billId) }).refnum;
					currency = _.find(arrBillsProcessed, { id: String(billId) }).currid;
					subtext = _.find(arrBillsProcessed, { id: String(billId) }).subtext;
					billnum = _.find(arrBillsProcessed, { id: String(billId) }).billnum;
					billPaymentTranId = _.find(arrBillsProcessed, { id: String(billId) }).refnum;
					dLog('billnum', billnum);

					try {
						symbol = _.find(_currencies, { internalid: String(currency) }).symbol || 'USD';
					} catch (e) {}
					dLog('billPaymentTranId', billPaymentTranId);

					var netAmt = 0;
					var origAmt = getFloatVal(arrBillAmtOrig[billId]);
					var amt = getFloatVal(arrBillAmt[billId]);

					var discAmt = !isEmpty(arrBillDiscAmt[billId]) ? getFloatVal(arrBillDiscAmt[billId]) : 0;

					dLog(
						'amounts',
						JSON.stringify({
							netAmt: netAmt,
							origAmt: origAmt,
							amt: amt,
							discAmt: discAmt,
						})
					);

					netAmt = origAmt;
					tmpAmt += amt; //used to be netAmt

					if (discAmt > 0) {
						netAmt -= discAmt;
						tmpAmt -= discAmt;
					}

					if (!isEmpty(arrBillCredits[billId])) {
						var arrBC = arrBillCredits[billId];

						dLog('arrBC in arrBills', JSON.stringify(arrBC));

						for (bc in arrBC) {
							var billCreditAmtP = getFloatVal(arrBC[bc].bcamt);
							var billCreditAmt = billCreditAmtP * -1;

							// tmpAmt = (tmpAmt - billCreditAmtP);
							netAmt = netAmt - billCreditAmtP;
						}
					}
				}

				var cdtTrfTxInfObj = {};
				cdtTrfTxInfObj.PmtId = {};

				var refnum = arrBillPaymentMap[payeeId] || '';
				var instrId = '';
				if (refnum.length > 12) {
					instrId = pz(refnum.substring(refnum.length - 12, refnum.length), 12);
				} else {
					instrId = pz(refnum, 12);
				}
				var endToEndId = billnum.substr(0, 18);
				if (numberOfBills > 1) {
					endToEndId = subtext.substr(0, 18);
				}

				var s = String(moment().valueOf());
				s = s.slice(s.length - 6);
				endToEndId = moment(d).format('YYYYMMDD') + s;

				cdtTrfTxInfObj.PmtId.InstrId = instrId;
				cdtTrfTxInfObj.PmtId.EndToEndId = endToEndId;

				if (paymentMethod == 'CHK') {
					cdtTrfTxInfObj.PmtInfObj = {};
					cdtTrfTxInfObj.PmtInfObj.PmtTpInf = {};
					cdtTrfTxInfObj.PmtInfObj.PmtTpInf.SvcLvl = {};

					if (objVendor.deliverycode == '') {
						cdtTrfTxInfObj.PmtInfObj.PmtTpInf.SvcLvl.Prtry = '00PY1';
					} else {
						cdtTrfTxInfObj.PmtInfObj.PmtTpInf.SvcLvl.Prtry = '00000';
					}
					cdtTrfTxInfObj.ChqInstr = {};
					cdtTrfTxInfObj.ChqInstr.ChqNb = billPaymentTranId;
					if (objVendor.deliverycode) {
						cdtTrfTxInfObj.ChqInstr.DlvryMtd = {};
						cdtTrfTxInfObj.ChqInstr.DlvryMtd.Cd = objVendor.deliverycode;
					}
          cdtTrfTxInfObj.ChqInstr.FrmsCd = jpmFormCode;
          dLog("FrmsCd", jpmFormCode);
				}

				if (paymentMethod == 'DAC') {
					cdtTrfTxInfObj.ChrgBr = 'DEBT';
					// cdtTrfTxInfObj.ChrgBr = (paymentMethod == 'MTS') ? 'CRED' : "";
				} else if (paymentMethod == 'MTS') {
					cdtTrfTxInfObj.ChrgBr = 'DEBT';
				}

				if (paymentMethod == 'DAC' || paymentMethod == 'CHK') {
					cdtTrfTxInfObj.ClrSysId = {};
					cdtTrfTxInfObj.ClrSysId.Cd = 'CACPA';
				}

				tmpAmt = 0; // need to initialize back to 0

				var Strd = [];
				var totalCdtTrfTxInfAmount = 0;

				for (y in arrBills) {
					var billId = arrBills[y];
					var StrdObj = {};
					StrdObj.RfrdDocInf = {};
					StrdObj.RfrdDocInf.Tp = {};
					StrdObj.RfrdDocInf.Tp.CdOrPrtry = {};
					StrdObj.RfrdDocInf.Tp.CdOrPrtry.Cd = 'CINV';

					var netAmt = 0;
					var origAmt = getFloatVal(arrBillAmtOrig[billId]);
					var amt = getFloatVal(arrBillAmt[billId]);

					var discAmt = !isEmpty(arrBillDiscAmt[billId]) ? getFloatVal(arrBillDiscAmt[billId]) : 0;

					// dLog("billId before", billId);
					// dLog("arrBC in y.arrBills before", JSON.stringify(arrBillCredits));
					dLog(
						'values',
						JSON.stringify({
							netAmt: netAmt,
							origAmt: origAmt,
							amt: amt,
							discAmt: discAmt,
							tmpAmt: tmpAmt,
						})
					);

					if (!isEmpty(arrBillCredits[billId])) {
						var arrBC = arrBillCredits[billId];

						dLog('arrBC in y.arrBills', JSON.stringify(arrBC));

						for (bc in arrBC) {
							var billCreditAmtP = getFloatVal(arrBC[bc].bcamt);
							var billCreditAmt = billCreditAmtP * -1;

							// tmpAmt = (tmpAmt - billCreditAmtP);
							netAmt = netAmt - billCreditAmtP;
						}
					}

					// tmpAmt += amt;
					netAmt = origAmt;
					tmpAmt += amt; //used to be netAmt
					totalCdtTrfTxInfAmount += amt; //origAmt;

					if (discAmt > 0) {
						netAmt -= discAmt;
						tmpAmt -= discAmt;
						// totalCdtTrfTxInfAmount -= discAmt;
					}

					dLog('createJPM_ISO_XMLDoc. objBillsData', JSON.stringify(objBillsData[billId]));
					StrdObj.RfrdDocInf.Nb = objBillsData[billId].num; //objBillsData[billId].memo; //billPaymentTranId;

					var invoiceDate = objBillsData[billId].dte;
					StrdObj.RfrdDocInf.RltdDt = formatDate(nlapiStringToDate(invoiceDate));
					StrdObj.RfrdDocAmt = {};
					StrdObj.RfrdDocAmt.DuePyblAmt = {};
					StrdObj.RfrdDocAmt.DscntApldAmt = {};
					StrdObj.RfrdDocAmt.RmtdAmt = {};
					StrdObj.RfrdDocAmt.DuePyblAmt.value = origAmt.toFixed(2);

					if (discAmt == 0) discAmt = '';
					else discAmt = discAmt.toFixed(2);

					StrdObj.RfrdDocAmt.DscntApldAmt.value = discAmt;

					//RSF - Added to make the RmtdAmt the same as DuePyblAmt
					if (!isEmpty(arrBillCredits[billId])) {
						var arrBC = arrBillCredits[billId];
						for (bc in arrBC) {
							var billCreditAmt = getFloatVal(arrBC[bc].bcamt);
							amt += Number(billCreditAmt);
						}
					}

					StrdObj.RfrdDocAmt.RmtdAmt.value = amt.toFixed(2); //netAmt.toFixed(2);

					StrdObj.RfrdDocAmt.DuePyblAmt.Ccy = symbol;
					StrdObj.RfrdDocAmt.DscntApldAmt.Ccy = symbol;
					StrdObj.RfrdDocAmt.RmtdAmt.Ccy = symbol;

					//Add CDtrRefInf
					StrdObj.CdtrRefInf = {};
					StrdObj.CdtrRefInf.Tp = {};
					StrdObj.CdtrRefInf.CdOrPrtry = {};
					StrdObj.CdtrRefInf.CdOrPrtry.Cd = billPaymentTranId; //"CINV";
					// if (objBillsData[billId].memo) {
					//   StrdObj.CdtrRefInf.Ref = objBillsData[billId].memo || '';
					// }
					StrdObj.CdtrRefInf.Ref = billPaymentTranId; //objBillsData[billId].num; //billPaymentTranId;

					Strd.push(StrdObj);

					if (!isEmpty(arrBillCredits[billId])) {
						var arrBC = arrBillCredits[billId];

						for (bc in arrBC) {
							var billCreditAmtP = getFloatVal(arrBC[bc].bcamt);
							var billCreditAmt = billCreditAmtP;

							tmpAmt = tmpAmt - billCreditAmtP;
							netAmt = netAmt - billCreditAmtP;
							// totalCdtTrfTxInfAmount -= billCreditAmtP;

							var StrdObj = {};
							StrdObj.RfrdDocInf = {};
							StrdObj.RfrdDocInf.Tp = {};
							StrdObj.RfrdDocInf.Tp.CdOrPrtry = {};
							StrdObj.RfrdDocInf.Tp.CdOrPrtry.Cd = 'CREN'; //Hardcoded?

							var bcNum = arrBC[bc].bcnum;
							dLog('createJPMXMLDoc', 'VC number : ' + bcNum);
							dLog('arrBC[bc]', JSON.stringify(arrBC));

							if (!isEmpty(bcNum)) StrdObj.RfrdDocInf.Nb = bcNum;
							else if (!isEmpty(arrBillCredits[billId].bcmemo)) {
								StrdObj.RfrdDocInf.Nb = arrBillCredits[billId].bcmemo;
							}

							var invoiceDate = objBillsData[billId].dte;
							StrdObj.RfrdDocInf.RltdDt = formatDate(nlapiStringToDate(arrBC[bc].bcdate));

							StrdObj.RfrdDocAmt = {};
							StrdObj.RfrdDocAmt.CdtNoteAmt = {};
							StrdObj.RfrdDocAmt.DuePyblAmt = null;
							StrdObj.RfrdDocAmt.DscntApldAmt = null;
							StrdObj.RfrdDocAmt.RmtdAmt = null;

							// StrdObj.RfrdDocAmt.DuePyblAmt.value = (billCreditAmt).toFixed(2);
							// if (discAmt==0)
							// 	discAmt = '';
							// else
							// 	discAmt = discAmt.toFixed(2);

							// StrdObj.RfrdDocAmt.DscntApldAmt.value = discAmt;
							StrdObj.RfrdDocAmt.CdtNoteAmt.value = billCreditAmt.toFixed(2);
							StrdObj.RfrdDocAmt.CdtNoteAmt.Ccy = symbol;

							// StrdObj.RfrdDocAmt.DuePyblAmt.Ccy = symbol;
							// StrdObj.RfrdDocAmt.DscntApldAmt.Ccy = symbol;
							// if (arrBC[bc].bcmemo) {
							//   StrdObj.CdtrRefInf = {};
							//   StrdObj.CdtrRefInf.Ref = arrBC[bc].bcmemo;
							// }
							StrdObj.CdtrRefInf = {};
							StrdObj.CdtrRefInf.Ref = billPaymentTranId; //objBillsData[billId].num; //

							Strd.push(StrdObj);
						}
					}

					dLog(
						'Amounts in loop=' + y,
						JSON.stringify({
							totalAmount: totalAmount,
							totalCdtTrfTxInfAmount: totalCdtTrfTxInfAmount,
							netAmt: netAmt,
							tmpAmt: tmpAmt,
						})
					);
				}

				dLog('createJPM_ISO_XMLDoc.Strd2', JSON.stringify(Strd));

				noOfBillPayments = noOfBillPayments + 1;
				totalAmount += Number(totalCdtTrfTxInfAmount);
				dLog(
					'Amounts',
					JSON.stringify({
						totalAmount: totalAmount,
						totalCdtTrfTxInfAmount: totalCdtTrfTxInfAmount,
						netAmt: netAmt,
						tmpAmt: tmpAmt,
					})
				);

				cdtTrfTxInfObj.Amt = {};
				cdtTrfTxInfObj.Amt.value = totalCdtTrfTxInfAmount.toFixed(2); //netAmt.toFixed(2); //tmpAmt.toFixed(2); //netAmt.toFixed(2); //tmpAmt.toFixed(2); //amt.toFixed(2);
				cdtTrfTxInfObj.Amt.Ccy = symbol;

				if (paymentMethod == 'DAC' || paymentMethod == 'MTS') {
					cdtTrfTxInfObj.CdtrAgt = {};
					cdtTrfTxInfObj.CdtrAgt.FinInstnId = {};
					// cdtTrfTxInfObj.CdtrAgt.FinInstnId.BIC = objVendor.recbankprimid;
          if (paymentMethod=='DAC') {
            cdtTrfTxInfObj.CdtrAgt.FinInstnId.ClrSysMmbId = {};
            cdtTrfTxInfObj.CdtrAgt.FinInstnId.ClrSysMmbId.MmbId = objVendor.recbankprimid; // Receiving Bank Routing  
          } else if (paymentMethod=='MTS') {
            cdtTrfTxInfObj.CdtrAgt.FinInstnId.ClrSysMmbId = {};
            cdtTrfTxInfObj.CdtrAgt.FinInstnId.ClrSysMmbId.BIC = objVendor.recbankprimid; // Receiving Bank Routing  
          }
					cdtTrfTxInfObj.CdtrAgt.FinInstnId.Nm = objVendor.vbankname || 'custrecord_bankname';

					if (objVendor.vbankaddrs1 || objVendor.vbankzip || objVendor.vbankcity || objVendor.vbankstate) {
						cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr = {};
						cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.Ctry = countryCodeMapping[objVendor.vbankcountry];
						cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.AdrLine = objVendor.vbankaddrs1;
						cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.StrtNm = objVendor.vbankaddrs1;
						cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.PstCd = objVendor.vbankzip;
						cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.TwnNm = objVendor.vbankcity;
						cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.BldgNb = '';
						cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.CtrySubDvsn = objVendor.vbankstate;
					}

					if (paymentMethod == 'MTS') {
						cdtTrfTxInfObj.CdtrAgt.InstrForCdtrAgt = {};
						cdtTrfTxInfObj.CdtrAgt.InstrForCdtrAgt.InstrInf = objVendor.custentity_ica_vendor_bank_instructions;
					}
				}

				cdtTrfTxInfObj.Cdtr = {};
				cdtTrfTxInfObj.Cdtr.Nm = objVendor.vendorname;

				if (paymentMethod != 'DAC') {
					if (objVendor.vendoraddrs1 || objVendor.vendoraddrs2 || objVendor.vendorpostal || objVendor.vendorcity || objVendor.vendorstateprovince || countryCodeMapping[objVendor.vendorcountrycode]) {
						dLog(
							'Vendor Address',
							JSON.stringify({
								addr1: objVendor.vendoraddrs1,
								addr2: objVendor.vendoraddrs2,
								postal: objVendor.vendorpostal,
								city: objVendor.vendorcity,
								vsp: objVendor.vendorstateprovince,
								countrycode: objVendor.vendorcountrycode,
								countryCodeMapping: countryCodeMapping[objVendor.vendorcountrycode],
							})
						);
						cdtTrfTxInfObj.Cdtr.PstlAdr = {};

            cdtTrfTxInfObj.Cdtr.PstlAdr.AdrLine = '<AdrLine>' + objVendor.vendoraddrs1 + ' ' + objVendor.vendoraddrs2 + '</AdrLine>';
            cdtTrfTxInfObj.Cdtr.PstlAdr.AdrLine += '<AdrLine>' + objVendor.vendorcity + '</AdrLine>';
					}
				} else {
					cdtTrfTxInfObj.Cdtr.PstlAdr = null;
				}

        if (paymentMethod == 'CCR') {
          cdtTrfTxInfObj.Cdtr.CtctDtls = objVendor.vemailadrs;
        }


        

				if (paymentMethod == 'DAC' || paymentMethod == 'MTS') {
					cdtTrfTxInfObj.CdtrAcct = {};
					cdtTrfTxInfObj.CdtrAcct.Id = {};
					cdtTrfTxInfObj.CdtrAcct.Id.Othr = {};
					cdtTrfTxInfObj.CdtrAcct.Id.Othr.Id = objVendor.recpartyaccount;

					if (paymentMethod == 'DAC') {
						cdtTrfTxInfObj.CdtrAcct.Tp = {};
						cdtTrfTxInfObj.CdtrAcct.Tp.Cd = 'CACC';
					}
				}

				// cdtTrfTxInfObj.RltdAmtInf = {};
				// cdtTrfTxInfObj.RltdAmtInf.RmtLctnMtd = objVendor.pmp_dac_contactname || "";
				// cdtTrfTxInfObj.RltdAmtInf.RmtLctnElctrncAdr = objVendor.pmp_dac_emailaddress || "";
				if (paymentMethod == 'CHK' || paymentMethod == 'CCR') {
					dLog('objVendor.custentity_ica_vendor_bank_instructions', objVendor.custentity_ica_vendor_bank_instructions);
					cdtTrfTxInfObj.RmtInf = {};
					cdtTrfTxInfObj.RmtInf.Ustrd = objVendor.custentity_ica_vendor_bank_instructions; //
					cdtTrfTxInfObj.RmtInf.Strd = Strd;
				}
				// dLog("cdtTrfTxInfObj", JSON.stringify(cdtTrfTxInfObj));
				CdtTrfTxInf.push(cdtTrfTxInfObj);
			}

			dLog(
				'About to add totalAmount',
				JSON.stringify({
					totalAmount: totalAmount,
				})
			);

			PmtInfObj.NbOfTxs = noOfBillPayments;
			PmtInfObj.CtrlSum = totalAmount.toFixed(2);
			totalNbOfTxs += Number(noOfBillPayments);
			totalCtrlSum += Number(totalAmount);
			PmtInfObj.CdtTrfTxInf = CdtTrfTxInf;
			PmtInf.push(PmtInfObj);
		}
	}

	objects.NbOfTxs = totalNbOfTxs; //grpHdrNbOfTxs;
	objects.CtrlSum = totalCtrlSum.toFixed(2); //grpHdrCtrlSum.toFixed(2); // Do we comment this out?
	objects.PmtInf = PmtInf;
	// objects.CdtTrfTxInf = CdtTrfTxInf;
	dLog("objects.PmtInf", JSON.stringify(objects.PmtInf));
	// dLog('objects.CdtTrfTxInf', JSON.stringify(objects.CdtTrfTxInf));

	var fileId = nlapiSearchRecord('file', null, [['name', 'is', 'ica_santander_poland.xml']], []);
	if (fileId != null) {
		fileId = fileId[0].getId();
	}

	var tmplFile = nlapiLoadFile(fileId);

	var template = Handlebars.compile(tmplFile.getValue());
	var xmlDoc = template(objects);

	dLog('xmlDoc', xmlDoc);
	return xmlDoc;
}


function createSVB_CHECK_ISO_XMLDoc(objAcctMapping) {
	var arrTempBillIds = [];
	var arrBillCRIds = [];
	var arrBillAmt = [];
	var arrBillAmtOrig = [];
	var arrBillDiscAmt = [];
	var arrBillPayInfoCtr = [];
	var arrBillPayInfoSum = [];
	var arrGrpHdrNbOfTxs = [];
	var arrPmtInfNbOfTxs = [];
	var arrBillIds = [];
	var grpHdrNbOfTxs = 0;
	var grpHdrCtrlSum = 0;
	var arrPayeeIds = [];
	var _currencies = getCurrencies();

	for (x in arrBillsProcessed) {
		var billId = arrBillsProcessed[x].id;
		var billPaymentId = arrBillsProcessed[x].payment;

		dLog('createSVB_CHECK_ISO_XMLDoc', 'Bill info = ' + JSON.stringify(arrBillsProcessed[x]));
		if (!isEmpty(billPaymentId) && billPaymentId != 'XXXNONEXXX' && billPaymentId != 'CREDIT') {
			if (billPaymentId != 'CREDIT') arrTempBillIds.push(billId);

			var payMethod = arrBillsProcessed[x].paymethod;
			var paymentId = arrBillsProcessed[x].payment;
			var payeeId = arrBillsProcessed[x].payeeid;

			arrBillAmtOrig[billId] = arrBillsProcessed[x].origamt;
			// arrBillAmt[billId] = arrBillsProcessed[x].pay;
			arrBillAmt[billId] = arrBillsProcessed[x].payamt;
			arrBillDiscAmt[billId] = arrBillsProcessed[x].discamt;

			var ndx = payMethod + '@@' + paymentId;

			if (arrBillPayInfoCtr[payMethod] == null) arrBillPayInfoCtr[payMethod] = 0;
			if (arrBillPayInfoSum[payMethod] == null) arrBillPayInfoSum[payMethod] = 0;
			if (arrPmtInfNbOfTxs[ndx] == null) arrPmtInfNbOfTxs[ndx] = 0;

			if (paymentId && arrGrpHdrNbOfTxs[paymentId] == null) grpHdrNbOfTxs++;

			arrPmtInfNbOfTxs[ndx]++;
			arrBillPayInfoCtr[payMethod]++;
			arrBillPayInfoSum[payMethod] += getFloatVal(arrBillsProcessed[x].payamt);
			arrGrpHdrNbOfTxs[paymentId] = paymentId;

			//grpHdrCtrlSum += getFloatVal(arrBillsProcessed[x].payamt);
		}
		grpHdrCtrlSum += getFloatVal(arrBillsProcessed[x].payamt);
		// grpHdrCtrlSum += (getFloatVal(arrBillsProcessed[x].payamt) - getFloatVal(arrBillsProcessed[x].discamt));

		if (billPaymentId == 'CREDIT') arrBillCRIds.push(billId);
	}

	var arrBillIds = [];
	var arrBillIds2 = [];
	var arrBillIds3 = [];
	var arrBillIds4 = [];
	var arrBillIds5 = [];

	for (vx in arrTempBillIds) {
		var isBC = false;
		for (var x in arrBillCRIds) {
			if (arrTempBillIds[vx] == arrBillCRIds[x]) {
				isBC = true;
				break;
			}
		}
		if (!isBC) {
			arrBillIds.push(arrTempBillIds[vx]);
			arrBillIds2.push(arrTempBillIds[vx]);
			arrBillIds3.push(arrTempBillIds[vx]);
			arrBillIds4.push(arrTempBillIds[vx]);
			arrBillIds5.push(arrTempBillIds[vx]);
		}
	}

	var arrBillCredits = getBillCredit(arrBillIds);
	var objBillsData = getBillData(arrBillIds2);
	var arrBillPO = getPOMap(arrBillIds3);
	var arrVendorBills = getPayeeBillsByPayMethod(arrBillIds4);
	var arrVendorBillsCurr = getPayeeBillsCurrency(arrBillIds5);
	var nsAcctSub = !isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('subsidiary', 'CUSTRECORD_ACCT_MAP_NETSUITE_ACCOUNT')) ? objAcctMapping[0].getValue('subsidiary', 'CUSTRECORD_ACCT_MAP_NETSUITE_ACCOUNT') : '';
  var jpmFormCode = objAcctMapping[0].getValue('custrecord_ica_pm_jpm_form_code') || 'A1';

	// var nsAcctSub
	var objVDCRecResults = getVendorDAC_CCRPaymentRec(nsAcctSub);
	dLog('objVDCRecResults', JSON.stringify(objVDCRecResults));
	dLog('objAcctMapping', JSON.stringify(objAcctMapping));

	//Gather data.

	var objects = {
		MsgId: 'TBD',
		CreDtTm: 'Test',
		Authstn: {
			Cd: '',
		},
		NbOfTxs: '2',
		CtrlSum: '2000',
		InitgPty: {
			Id: {
				OrgId: {
					Othr: {
						Id: '',
					},
				},
			},
		},
		PmtInfId: 'PmtInfId',
		PmtMtd: 'PmtMtd',
		PmtTpInf: {
			SvcLvl: {
				Cd: 'This is CD',
			},
		},
		ReqdExctnDt: 'ReqdExctnDt',
		Dbtr: {
			Nm: 'This is Nm',
			PstlAdr: {
				StrtNm: '',
				BldgNb: '',
				PstCd: '',
				TwnNm: '',
				CtrySubDvsn: '',
				Ctry: '',
			},
			Id: {
				Othr: {
					Id: 'Dbtr.Id.Othr.Id',
				},
			},
		},
		DbtrAcct: {
			Id: {
				Othr: {
					Id: 'DbtrAcct.Id.Othr.Id',
				},
			},
			PstlAdr: {
				StrtNm: '',
				BldgNb: '',
				PstCd: '',
				TwnNm: '',
				CtrySubDvsn: '',
				Ctry: '',
			},
		},
		DbtrAgt: {
			FinInstnId: {
				BIC: 'BIC',
				PstlAdr: {
					StrtNm: '',
					BldgNb: '',
					PstCd: '',
					TwnNm: '',
					CtrySubDvsn: '',
					Ctry: '',
				},
			},
		},
		CdtTrfTxInf: CdtTrfTxInf,
	};

	var PmtInf = [];

	for (x in arrVendorBills) {
		var payeeId = x.split('X@X')[1];
		arrPayeeIds.push(payeeId);
	}

	var arrVendors = getEntityData(arrPayeeIds);

	var today = new Date();
	var bpmdate = BPM_DATE;
	var d = nlapiStringToDate(bpmdate, 'datetime');

	var fileCtrlNumber = moment(new Date()).format('YYMMDDmmssSS');
	objects.MsgId = pad(fileCtrlNumber, 4);
	objects.CreDtTm = moment(d).format('YYYY-MM-DDThh:mm:ss') || today.format('{yyyy}-{MM}-{dd}T{hh}:{mm}:{ss}');
	objects.Authstn.Cd = 'AUTH';
	// objects.NbOfTxs = grpHdrNbOfTxs;
	// objects.CtrlSum = grpHdrCtrlSum.toFixed(2); // Do we comment this out?

	if (objects.CtrlSum == '0.00') {
		dLog('CtrlSum is 0.00, this should not happen. Returning empty file', objects.CtrlSum);
		return '';
	}

  objects.InitgPty.Nm = objVDCRecResults[0].getValue('custrecord_companyname');


	var totalNbOfTxs = 0;
	var totalCtrlSum = 0;

	dLog('SVB Check ISO: arrBillPayInfoCtr', JSON.stringify(arrBillPayInfoCtr));
	for (x in arrBillPayInfoCtr) {
		//CdtTrfTxInf loop starts here.
		var CdtTrfTxInf = [];

		if (SINGLEBILLPYMTS == 'T') {
			dAudit('Create Single Bill Payments here.', JSON.stringify(arrBillsProcessed));
			var PmtInfObj = {};

			PmtInfObj.PmtInfId = fileCtrlNumber;
			var paymentMethod = x;
			PmtInfObj.PmtMtd = 'TRF';

			// objects.PmtTpInf.SvcLvl.Cd = (paymentMethod == 'DAC') ? 'NURG' : 'URGP';
			PmtInfObj.PmtTpInf = {};
			PmtInfObj.PmtTpInf.SvcLvl = {};
			PmtInfObj.PmtTpInf.SvcLvl.Prtry = paymentMethod == 'DAC' ? 'NORM' : 'URGP';
			PmtInfObj.ReqdExctnDt = moment(d).format('YYYY-MM-DD') || today.format('{yyyy}-{MM}-{dd}');

			if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_companyname'))) {
				PmtInfObj.Dbtr = {};
				PmtInfObj.Dbtr.Nm = objVDCRecResults[0].getValue('custrecord_companyname');
			}

			//PstlAdr
			var country = !isEmpty(objVDCRecResults) ? objVDCRecResults[0].getValue('custrecord_compcountrycode') : '';

			if (
				(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_comppostcode'))) ||
				(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compcity'))) ||
				(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compstateprov'))) ||
				(!isEmpty(objVDCRecResults) && objVDCRecResults[0].getValue('custrecord_compcountrycode')) ||
				(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compadd1')))
			) {
				PmtInfObj.Dbtr = {};
				PmtInfObj.Dbtr.PstlAdr = {};
				if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compadd1'))) {
					PmtInfObj.Dbtr.PstlAdr.StrtNm = '<AdrLine>' + objVDCRecResults[0].getValue('custrecord_compadd1') + '</AdrLine>';
				}
				if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compadd2'))) {
					PmtInfObj.Dbtr.PstlAdr.BldgNb = '<BldgNb>' + objVDCRecResults[0].getValue('custrecord_compadd2') + '</BldgNb>';
				}

				if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_comppostcode'))) {
					PmtInfObj.Dbtr.PstlAdr.PstCd = '<PstCd>' + objVDCRecResults[0].getValue('custrecord_comppostcode') + '</PstCd>';
				}
				// addTextNodeFromParentNode(xmlDoc, pstlAdr, 'PstCd', objVDCRecResults[0].getValue('custrecord_comppostcode'));

				if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compcity'))) {
					PmtInfObj.Dbtr.PstlAdr.TwnNm = '<TwnNm>' + objVDCRecResults[0].getValue('custrecord_compcity') + '</TwnNm>';
				}
				// addTextNodeFromParentNode(xmlDoc, pstlAdr, 'TwnNm', objVDCRecResults[0].getValue('custrecord_compcity'));

				//Where do we get CtrySubDvsn?
				if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compstateprov'))) {
					PmtInfObj.Dbtr.PstlAdr.TwnNm = '<CtrySubDvsn>' + objVDCRecResults[0].getValue('custrecord_compstateprov') + '</CtrySubDvsn>';
				}

				// addTextNodeFromParentNode(xmlDoc, pstlAdr, 'Ctry', country);
				if (country) {
					PmtInfObj.Dbtr.PstlAdr.Ctry = '<Ctry>' + country + '</Ctry>';
				}
			}

			PmtInfObj.Dbtr.Id = {};
			PmtInfObj.Dbtr.Id.Othr = {};
			// if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_dom_ach_co_id'))) {
			// 	PmtInfObj.Dbtr.OrgId.Id.Othr.Id = objAcctMapping[0].getValue('custrecord_acct_map_dom_ach_co_id'); //ACH Company ID
			// }

      // RSF
      if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ceo_company_id'))) {
        PmtInfObj.Dbtr.Id.OrgId.Othr.Id = objAcctMapping[0].getValue('custrecord_acct_map_ceo_company_id');
      }


			//DbtrAcct
			PmtInfObj.DbtrAcct = {};
			PmtInfObj.DbtrAcct.Id = {};
			PmtInfObj.DbtrAcct.Id.Othr = {};
			if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_origin_acc'))) {
				PmtInfObj.DbtrAcct.Id.Othr.Id = objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_origin_acc'); // Bank Account Number

				var symbol = '';
				try {
					symbol = _.find(_currencies, { internalid: String(objAcctMapping[0].getValue('custrecord_acct_map_account_currency')) }).symbol;
					PmtInfObj.DbtrAcct.Ccy = symbol; //objAcctMapping[0].getValue('custrecord_acct_map_account_currency') || ''; // Bank Currency
					dAudit('DbtrAcct.Ccy-Currency', objAcctMapping[0].getValue('custrecord_acct_map_account_currency'));
					dAudit('DbtrAcct.Ccy', JSON.stringify(_currencies));
				} catch (e) {}
			}

			//DbtrAgt
			if ((!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id'))) || !isEmpty(country)) {
				if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id'))) {
					// objects.DbtrAgt.FinInstnId.BIC = objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id');

					PmtInfObj.DbtrAgt = {};
					PmtInfObj.DbtrAgt.Nm = objVDCRecResults[0].getValue('custrecord_bankname') || '';
					PmtInfObj.DbtrAgt.FinInstnId = {};
					PmtInfObj.DbtrAgt.FinInstnId.ClrSysMmbId = {};
					PmtInfObj.DbtrAgt.FinInstnId.ClrSysMmbId.MmbId = objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id'); // Routing Number 10 Digit
				}
				PmtInfObj.DbtrAgt.FinInstnId.PstlAdr = {};
				PmtInfObj.DbtrAgt.FinInstnId.PstlAdr.Ctry = 'CA';
			}

			for (var i = 0; i < arrBillsProcessed.length; i++) {
				
				var billPayment = arrBillsProcessed[i];

				if (billPayment.payment == 'CREDIT') {
					continue;
				}

				var symbol = '';

				try {
					symbol = _.find(_currencies, { internalid: String(billPayment.currid) }).symbol || 'USD';
				} catch (e) {}

				var objVendor = arrVendors[billPayment.payeeid];
				if (!objVendor) objVendor = _.find(arrVendors, { internalid: String(billPayment.payeeid) });

				dLog('objVendor', JSON.stringify(objVendor));

				var cdtTrfTxInfObj = {};
				cdtTrfTxInfObj.PmtId = {};

				var refnum = billPayment.refnum; //arrBillPaymentMap[billPayment.payeeid];
				// var refnum = billPayment.billnum; //arrBillPaymentMap[billPayment.payeeid];
				var instrId = '';
				if (refnum.length > 12) {
					instrId = pz(refnum.substring(refnum.length - 12, refnum.length), 12);
				} else {
					instrId = pz(refnum, 12);
				}
				refnum = billPayment.billnum; //Overwrite endToendID
				var endToEndId = refnum;
				if (refnum.length > 18) {
					endToEndId = refnum.substr(0, 18);
				}

				endToEndId = moment(d).format('YYYY-MM-DDThh:mm:ss');

				cdtTrfTxInfObj.PmtId.InstrId = instrId;
				cdtTrfTxInfObj.PmtId.EndToEndId = endToEndId;
				cdtTrfTxInfObj.Amt = {};
				cdtTrfTxInfObj.Amt.value = billPayment.payamt; //amt.toFixed(2);
				cdtTrfTxInfObj.Amt.Ccy = symbol;
				cdtTrfTxInfObj.ChrgBr = billPayment.paymethod == 'MTS' ? 'CRED' : '';

				cdtTrfTxInfObj.CdtrAgt = {};
				cdtTrfTxInfObj.CdtrAgt.FinInstnId = {};
				// cdtTrfTxInfObj.CdtrAgt.FinInstnId.BIC = objVendor.recbankprimid;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.ClrSysMmbId = {};
        if (paymentMethod=='MTS') {
          cdtTrfTxInfObj.CdtrAgt.FinInstnId.ClrSysMmbId.BIC = objVendor.recbankprimid;
          cdtTrfTxInfObj.CdtrAgt.FinInstnId.ClrSysMmbId.MmbId = '';
        } else {
          cdtTrfTxInfObj.CdtrAgt.FinInstnId.ClrSysMmbId.MmbId = '';
          cdtTrfTxInfObj.CdtrAgt.FinInstnId.ClrSysMmbId.MmbId = objVendor.recbankprimid;
        }
				
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.Nm = objVendor.vbankname;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr = {};
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.Ctry = countryCodeMapping[objVendor.vbankcountry];
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.AdrLine = objVendor.vbankaddrs1;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.StrtNm = objVendor.vbankaddrs1;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.BldgNb = '';
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.PstCd = objVendor.vbankzip;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.TwnNm = objVendor.vbankcity;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.CtrySubDvsn = objVendor.vbankstate;

				if (billPayment.paymethod == 'MTS') {
					cdtTrfTxInfObj.CdtrAgt.InstrForCdtrAgt = {};
					cdtTrfTxInfObj.CdtrAgt.InstrForCdtrAgt.InstrInf = objVendor.custentity_ica_vendor_bank_instructions;
				}

				cdtTrfTxInfObj.Cdtr = {};
				cdtTrfTxInfObj.Cdtr.Nm = objVendor.vendorname;
				cdtTrfTxInfObj.Cdtr.PstlAdr = {};
				cdtTrfTxInfObj.Cdtr.PstlAdr.StrtNm = objVendor.vendoraddrs1;
				cdtTrfTxInfObj.Cdtr.PstlAdr.BldgNb = objVendor.vendoraddrs2 || '';
				cdtTrfTxInfObj.Cdtr.PstlAdr.PstCd = objVendor.vendorpostal;
				cdtTrfTxInfObj.Cdtr.PstlAdr.TwnNm = objVendor.vendorcity;
				cdtTrfTxInfObj.Cdtr.PstlAdr.CtrySubDvsn = objVendor.vendorstateprovince;
				cdtTrfTxInfObj.Cdtr.PstlAdr.Ctry = countryCodeMapping[objVendor.vendorcountrycode];

				cdtTrfTxInfObj.CdtrAcct = {};
				cdtTrfTxInfObj.CdtrAcct.Id = {};
				cdtTrfTxInfObj.CdtrAcct.Id.Othr = {};
				cdtTrfTxInfObj.CdtrAcct.Id.Othr.Id = objVendor.recpartyaccount;

				// cdtTrfTxInfObj.RltdAmtInf = {};
				// cdtTrfTxInfObj.RltdAmtInf.RmtLctnMtd = objVendor.pmp_dac_contactname || "";
				// cdtTrfTxInfObj.RltdAmtInf.RmtLctnElctrncAdr = objVendor.pmp_dac_emailaddress || "";
				cdtTrfTxInfObj.RmtInf = {};
				cdtTrfTxInfObj.RmtInf.Ustrd = refnum;
				cdtTrfTxInfObj.RmtInf.VendorId = objVendor.entityid;
				cdtTrfTxInfObj.RmtInf.Category = objVendor.category;

				cdtTrfTxInfObj.RmtInf.Strd = Strd;

				CdtTrfTxInf.push(cdtTrfTxInfObj);
			}
			PmtInfObj.CdtTrfTxInf = CdtTrfTxInf;
			PmtInf.push(PmtInfObj);
		} else {
			dAudit('arrVendorBills', arrVendorBills);
			var refnum = '';
			var currency = '';
			var symbol = '';
			try {
				dLog('objAcctMapping', JSON.stringify(objAcctMapping));
				symbol = _.find(_currencies, { internalid: String(objAcctMapping[0].getValue('custrecord_acct_map_account_currency')) }).symbol;
			} catch (e) {
				symbol = 'USD';
			}

			dLog('SYMBOL', symbol);

			var PmtInfObj = {};
			// var fileCtrlNumber = Date.create().format("{yy}{MM}{dd}{mm}{ss}"); //RSF add millisecs
			var fileCtrlNumber = moment(new Date()).format('YYMMDDmmssSS');
			PmtInfObj.PmtInfId = fileCtrlNumber;
			var paymentMethod = x;
			if (paymentMethod == 'CHK') {
				PmtInfObj.PmtMtd = 'CHK';
			} else {
				PmtInfObj.PmtMtd = 'TRF';
			}

			// objects.PmtTpInf.SvcLvl.Cd = (paymentMethod == 'DAC') ? 'NURG' : 'URGP';
			if (paymentMethod == 'DAC' || paymentMethod == 'MTS') {
				PmtInfObj.PmtTpInf = {};
				PmtInfObj.PmtTpInf.SvcLvl = {};

				if (paymentMethod == 'DAC') {
					PmtInfObj.PmtTpInf.SvcLvl.Cd = 'NURG';
				} else if (paymentMethod == 'CHK') {
					PmtInfObj.PmtTpInf.SvcLvl.Prtry = 'PM';
				} else if (paymentMethod == 'MTS') {
					PmtInfObj.PmtTpInf.SvcLvl.Cd = 'URGP';
				}
			}

			PmtInfObj.ReqdExctnDt = moment(d).format('YYYY-MM-DD') || today.format('{yyyy}-{MM}-{dd}');

			dAudit('objVDCRecResults', JSON.stringify(objVDCRecResults));
			if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_companyname'))) {
				PmtInfObj.Dbtr = {};
				PmtInfObj.Dbtr.Nm = objVDCRecResults[0].getValue('custrecord_companyname');
				dLog('Added Nm', objVDCRecResults[0].getValue('custrecord_companyname'));
			}

			//PstlAdr
			var country = !isEmpty(objVDCRecResults) ? objVDCRecResults[0].getValue('custrecord_compcountrycode') : '';

			if (
				(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_comppostcode'))) ||
				(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compcity'))) ||
				(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compstateprov'))) ||
				(!isEmpty(objVDCRecResults) && objVDCRecResults[0].getValue('custrecord_compcountrycode')) ||
				(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compadd1')))
			) {
				PmtInfObj.Dbtr.PstlAdr = {};

				if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compadd1'))) {
					PmtInfObj.Dbtr.PstlAdr.StrtNm = '<StrtNm>' + objVDCRecResults[0].getValue('custrecord_compadd1') + '</StrtNm>';
				}
				if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compadd2'))) {
					PmtInfObj.Dbtr.PstlAdr.BldgNb = '<BldgNb>' + objVDCRecResults[0].getValue('custrecord_compadd2') + '</BldgNb>';
				}

				if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_comppostcode'))) {
					PmtInfObj.Dbtr.PstlAdr.PstCd = '<PstCd>' + objVDCRecResults[0].getValue('custrecord_comppostcode') + '</PstCd>';
				}
				// addTextNodeFromParentNode(xmlDoc, pstlAdr, 'PstCd', objVDCRecResults[0].getValue('custrecord_comppostcode'));

				if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compcity'))) {
					PmtInfObj.Dbtr.PstlAdr.TwnNm = '<TwnNm>' + objVDCRecResults[0].getValue('custrecord_compcity') + '</TwnNm>';
				}
				// addTextNodeFromParentNode(xmlDoc, pstlAdr, 'TwnNm', objVDCRecResults[0].getValue('custrecord_compcity'));

				//Where do we get CtrySubDvsn?
				if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compstateprov'))) {
					PmtInfObj.Dbtr.PstlAdr.TwnNm = '<CtrySubDvsn>' + objVDCRecResults[0].getValue('custrecord_compstateprov') + '</CtrySubDvsn>';
				}

				// addTextNodeFromParentNode(xmlDoc, pstlAdr, 'Ctry', country);
				if (country) {
					PmtInfObj.Dbtr.PstlAdr.Ctry = '<Ctry>' + country + '</Ctry>';
				}
			}

			if (paymentMethod == 'DAC') {
				PmtInfObj.Dbtr.Id = {};
				PmtInfObj.Dbtr.Id.Othr = {};

				// if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_dom_ach_co_id'))) {
				// 	PmtInfObj.Dbtr.Id.Othr.Id = objAcctMapping[0].getValue('custrecord_acct_map_dom_ach_co_id'); //ACH Company ID
				// }

				PmtInfObj.Dbtr.Id.OrgId = {};
				PmtInfObj.Dbtr.Id.OrgId.Othr = {};

				if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ceo_company_id'))) {
					PmtInfObj.Dbtr.Id.OrgId.Othr.Id = objAcctMapping[0].getValue('custrecord_acct_map_ceo_company_id');
				}

				// if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_dom_ach_co_id'))) {
				// 	PmtInfObj.Dbtr.Id.OrgId.Othr.Id = objAcctMapping[0].getValue('custrecord_acct_map_dom_ach_co_id'); //ACH Company ID
				// }


				if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_bankname'))) {
					PmtInfObj.Dbtr.Id.OrgId.Othr.SchmeNm = {};
					PmtInfObj.Dbtr.Id.OrgId.Othr.SchmeNm.Cd = objVDCRecResults[0].getValue('custrecord_bankname');
				}
			}

			//DbtrAcct
			PmtInfObj.DbtrAcct = {};
			PmtInfObj.DbtrAcct.Id = {};
			PmtInfObj.DbtrAcct.Id.Othr = {};
			if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_origin_acc'))) {
				PmtInfObj.DbtrAcct.Id.Othr.Id = objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_origin_acc'); // Bank Account Number

				// var symbol = "";
				try {
					// symbol = _.find(_currencies, { internalid: String(objAcctMapping[0].getValue("custrecord_acct_map_account_currency")) }).symbol || "USD";
					PmtInfObj.DbtrAcct.Ccy = symbol; //objAcctMapping[0].getValue('custrecord_acct_map_account_currency') || ''; // Bank Currency
					dAudit('DbtrAcct.Ccy', objAcctMapping[0].getValue('custrecord_acct_map_account_currency'));
					dAudit('DbtrAcct.Ccy_currencies', JSON.stringify(_currencies));
				} catch (e) {}
			}

			//DbtrAgt
			if ((!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id'))) || !isEmpty(country)) {
				if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id'))) {
					// objects.DbtrAgt.FinInstnId.BIC = objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id');
					dLog('Here BIC', objAcctMapping[0].getValue('custrecord_acct_map_hsbc_swift_bank_id'));
					PmtInfObj.DbtrAgt = {};
					PmtInfObj.DbtrAgt.Nm = objVDCRecResults[0].getValue('custrecord_bankname') || '';
					PmtInfObj.DbtrAgt.FinInstnId = {};
          if (paymentMethod != 'MTS') {
            PmtInfObj.DbtrAgt.FinInstnId.ClrSysMmbId = {};
            PmtInfObj.DbtrAgt.FinInstnId.ClrSysMmbId.MmbId = objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id'); // Routing Number 10 Digit  
          } else {
            dAudit('DbtrAgt.FinInstnId.ClrSysMmbId should be empty', 'MTS');
            PmtInfObj.DbtrAgt.FinInstnId.ClrSysMmbId = null;
            PmtInfObj.DbtrAgt.Nm = null;
          }
				}
				var country = !isEmpty(objVDCRecResults) ? objVDCRecResults[0].getValue('custrecord_ica_orig_bank_country_code') : '';
				if (!isEmpty(country)) {
					dLog('Here Country Code', country);
					PmtInfObj.DbtrAgt.FinInstnId.PstlAdr = {};
					PmtInfObj.DbtrAgt.FinInstnId.PstlAdr.Ctry = country;
				}
			}
      if (paymentMethod == 'DAC') {
        dLog('Here DAC MmbId', objAcctMapping[0].getValue('custrecord_acct_map_hsbc_swift_bank_id'));
        // PmtInfObj.DbtrAgt.MmbId = objAcctMapping[0].getValue('custrecord_acct_map_hsbc_swift_bank_id');
      }
      if (paymentMethod == 'MTS') {
        dLog('Here MTS BIC', objAcctMapping[0].getValue('custrecord_acct_map_hsbc_swift_bank_id'));
        PmtInfObj.DbtrAgt.BIC = objAcctMapping[0].getValue('custrecord_acct_map_hsbc_swift_bank_id') || 'BIC';
      }

      dLog('PmtInfObj', JSON.stringify(PmtInfObj));

			var noOfBillPayments = 0;
			var totalAmount = 0;
			for (v in arrVendorBills) {
				var arrPayeeInfo = v.split('X@X');
				var payeeId = arrPayeeInfo[1];

				//var objVendor=arrVendors[payeeId];
        dLog('arrVendors-jpm-iso', arrVendors);
				       var objVendor = _.find(arrVendors, { internalid: String(payeeId)});
				// var objVendor = _.find(arrVendors, { internalid: String(payeeId), paymentmethod: String(paymentMethod) })[0];
dAudit('objVendor-new', objVendor);				dLog('objVendor', JSON.stringify(objVendor));

				if (isEmpty(objVendor)) continue;

				var pmtMethod = objVendor.paymentmethod;

				if (paymentMethod != pmtMethod) continue;
				//JPM ISO
				if (pmtMethod == 'DAC') {
					PmtInfObj.PmtTpInf.LclInstrm = {};
					PmtInfObj.PmtTpInf.LclInstrm.Cd = objVendor.payformat;
				}

				var arrBills = arrVendorBills[paymentMethod + 'X@X' + payeeId];
				dLog('arrBills', JSON.stringify(arrBills));
				var tmpAmt = 0;

				var numberOfBills = _.size(arrBills);
				var billnum = '';
				var billPaymentTranId = '';
				for (by in arrBills) {
					var billId = arrBills[by];
					refnum = _.find(arrBillsProcessed, { id: String(billId) }).refnum;
					currency = _.find(arrBillsProcessed, { id: String(billId) }).currid;
					subtext = _.find(arrBillsProcessed, { id: String(billId) }).subtext;
					billnum = _.find(arrBillsProcessed, { id: String(billId) }).billnum;
					billPaymentTranId = _.find(arrBillsProcessed, { id: String(billId) }).refnum;
					dLog('billnum', billnum);

					try {
						symbol = _.find(_currencies, { internalid: String(currency) }).symbol || 'USD';
					} catch (e) {}
					dLog('billPaymentTranId', billPaymentTranId);

					var netAmt = 0;
					var origAmt = getFloatVal(arrBillAmtOrig[billId]);
					var amt = getFloatVal(arrBillAmt[billId]);

					var discAmt = !isEmpty(arrBillDiscAmt[billId]) ? getFloatVal(arrBillDiscAmt[billId]) : 0;

					dLog(
						'amounts',
						JSON.stringify({
							netAmt: netAmt,
							origAmt: origAmt,
							amt: amt,
							discAmt: discAmt,
						})
					);

					netAmt = origAmt;
					tmpAmt += amt; //used to be netAmt

					if (discAmt > 0) {
						netAmt -= discAmt;
						tmpAmt -= discAmt;
					}

					if (!isEmpty(arrBillCredits[billId])) {
						var arrBC = arrBillCredits[billId];

						dLog('arrBC in arrBills', JSON.stringify(arrBC));

						for (bc in arrBC) {
							var billCreditAmtP = getFloatVal(arrBC[bc].bcamt);
							var billCreditAmt = billCreditAmtP * -1;

							// tmpAmt = (tmpAmt - billCreditAmtP);
							netAmt = netAmt - billCreditAmtP;
						}
					}
				}

				var cdtTrfTxInfObj = {};
				cdtTrfTxInfObj.PmtId = {};

				var refnum = arrBillPaymentMap[payeeId] || '';
				var instrId = '';
				if (refnum.length > 12) {
					instrId = pz(refnum.substring(refnum.length - 12, refnum.length), 12);
				} else {
					instrId = pz(refnum, 12);
				}
				var endToEndId = billnum.substr(0, 18);
				if (numberOfBills > 1) {
					endToEndId = subtext.substr(0, 18);
				}

				var s = String(moment().valueOf());
				s = s.slice(s.length - 6);
				endToEndId = moment(d).format('YYYYMMDD') + s;

				cdtTrfTxInfObj.PmtId.InstrId = instrId;
				cdtTrfTxInfObj.PmtId.EndToEndId = endToEndId;

				if (paymentMethod == 'CHK') {
					cdtTrfTxInfObj.PmtInfObj = {};
					cdtTrfTxInfObj.PmtInfObj.PmtTpInf = {};
					cdtTrfTxInfObj.PmtInfObj.PmtTpInf.SvcLvl = {};

					if (objVendor.deliverycode == '') {
						cdtTrfTxInfObj.PmtInfObj.PmtTpInf.SvcLvl.Prtry = '00PY1';
					} else {
						cdtTrfTxInfObj.PmtInfObj.PmtTpInf.SvcLvl.Prtry = '00000';
					}
					cdtTrfTxInfObj.ChqInstr = {};
					cdtTrfTxInfObj.ChqInstr.ChqNb = billPaymentTranId;
					if (objVendor.deliverycode) {
						cdtTrfTxInfObj.ChqInstr.DlvryMtd = {};
						cdtTrfTxInfObj.ChqInstr.DlvryMtd.Cd = objVendor.deliverycode;
					}

					if (objVendor.deliverycode) {
						cdtTrfTxInfObj.ChqInstr.DlvryMtd = {};
						cdtTrfTxInfObj.ChqInstr.DlvryMtd.Cd = objVendor.deliverycode;
					}

          //RSF - add DlvrTo here


          // cdtTrfTxInfObj.ChqInstr.FrmsCd = jpmFormCode;
          // dLog("FrmsCd", jpmFormCode);
				}

				if (paymentMethod == 'DAC') {
					cdtTrfTxInfObj.ChrgBr = 'DEBT';
					// cdtTrfTxInfObj.ChrgBr = (paymentMethod == 'MTS') ? 'CRED' : "";
				} else if (paymentMethod == 'MTS') {
					cdtTrfTxInfObj.ChrgBr = 'DEBT';
				}

				if (paymentMethod == 'DAC' || paymentMethod == 'CHK') {
					cdtTrfTxInfObj.ClrSysId = {};
					cdtTrfTxInfObj.ClrSysId.Cd = 'CACPA';
				}

				tmpAmt = 0; // need to initialize back to 0

				var Strd = [];
				var totalCdtTrfTxInfAmount = 0;

				for (y in arrBills) {
					var billId = arrBills[y];
					var StrdObj = {};
					StrdObj.RfrdDocInf = {};
					StrdObj.RfrdDocInf.Tp = {};
					StrdObj.RfrdDocInf.Tp.CdOrPrtry = {};
					StrdObj.RfrdDocInf.Tp.CdOrPrtry.Cd = 'CINV';

					var netAmt = 0;
					var origAmt = getFloatVal(arrBillAmtOrig[billId]);
					var amt = getFloatVal(arrBillAmt[billId]);

					var discAmt = !isEmpty(arrBillDiscAmt[billId]) ? getFloatVal(arrBillDiscAmt[billId]) : 0;

					// dLog("billId before", billId);
					// dLog("arrBC in y.arrBills before", JSON.stringify(arrBillCredits));
					dLog(
						'values',
						JSON.stringify({
							netAmt: netAmt,
							origAmt: origAmt,
							amt: amt,
							discAmt: discAmt,
							tmpAmt: tmpAmt,
						})
					);

					if (!isEmpty(arrBillCredits[billId])) {
						var arrBC = arrBillCredits[billId];

						dLog('arrBC in y.arrBills', JSON.stringify(arrBC));

						for (bc in arrBC) {
							var billCreditAmtP = getFloatVal(arrBC[bc].bcamt);
							var billCreditAmt = billCreditAmtP * -1;

							// tmpAmt = (tmpAmt - billCreditAmtP);
							netAmt = netAmt - billCreditAmtP;
						}
					}

					// tmpAmt += amt;
					netAmt = origAmt;
					tmpAmt += amt; //used to be netAmt
					totalCdtTrfTxInfAmount += amt; //origAmt;

					if (discAmt > 0) {
						netAmt -= discAmt;
						tmpAmt -= discAmt;
						// totalCdtTrfTxInfAmount -= discAmt;
					}

					dLog('createJPM_ISO_XMLDoc. objBillsData', JSON.stringify(objBillsData[billId]));
					StrdObj.RfrdDocInf.Nb = objBillsData[billId].num; //objBillsData[billId].memo; //billPaymentTranId;

					var invoiceDate = objBillsData[billId].dte;
					StrdObj.RfrdDocInf.RltdDt = formatDate(nlapiStringToDate(invoiceDate));
					StrdObj.RfrdDocAmt = {};
					StrdObj.RfrdDocAmt.DuePyblAmt = {};
					StrdObj.RfrdDocAmt.DscntApldAmt = {};
					StrdObj.RfrdDocAmt.RmtdAmt = {};
					StrdObj.RfrdDocAmt.DuePyblAmt.value = origAmt.toFixed(2);

					if (discAmt == 0) discAmt = '';
					else discAmt = discAmt.toFixed(2);

					StrdObj.RfrdDocAmt.DscntApldAmt.value = discAmt;

					//RSF - Added to make the RmtdAmt the same as DuePyblAmt
					if (!isEmpty(arrBillCredits[billId])) {
						var arrBC = arrBillCredits[billId];
						for (bc in arrBC) {
							var billCreditAmt = getFloatVal(arrBC[bc].bcamt);
							amt += Number(billCreditAmt);
						}
					}

					StrdObj.RfrdDocAmt.RmtdAmt.value = amt.toFixed(2); //netAmt.toFixed(2);

					StrdObj.RfrdDocAmt.DuePyblAmt.Ccy = symbol;
					StrdObj.RfrdDocAmt.DscntApldAmt.Ccy = symbol;
					StrdObj.RfrdDocAmt.RmtdAmt.Ccy = symbol;

					//Add CDtrRefInf
					StrdObj.CdtrRefInf = {};
					StrdObj.CdtrRefInf.Tp = {};
					StrdObj.CdtrRefInf.CdOrPrtry = {};
					StrdObj.CdtrRefInf.CdOrPrtry.Cd = billPaymentTranId; //"CINV";
					// if (objBillsData[billId].memo) {
					//   StrdObj.CdtrRefInf.Ref = objBillsData[billId].memo || '';
					// }
					StrdObj.CdtrRefInf.Ref = billPaymentTranId; //objBillsData[billId].num; //billPaymentTranId;

					Strd.push(StrdObj);

					if (!isEmpty(arrBillCredits[billId])) {
						var arrBC = arrBillCredits[billId];

						for (bc in arrBC) {
							var billCreditAmtP = getFloatVal(arrBC[bc].bcamt);
							var billCreditAmt = billCreditAmtP;

							tmpAmt = tmpAmt - billCreditAmtP;
							netAmt = netAmt - billCreditAmtP;
							// totalCdtTrfTxInfAmount -= billCreditAmtP;

							var StrdObj = {};
							StrdObj.RfrdDocInf = {};
							StrdObj.RfrdDocInf.Tp = {};
							StrdObj.RfrdDocInf.Tp.CdOrPrtry = {};
							StrdObj.RfrdDocInf.Tp.CdOrPrtry.Cd = 'CREN'; //Hardcoded?

							var bcNum = arrBC[bc].bcnum;
							dLog('createJPMXMLDoc', 'VC number : ' + bcNum);
							dLog('arrBC[bc]', JSON.stringify(arrBC));

							if (!isEmpty(bcNum)) StrdObj.RfrdDocInf.Nb = bcNum;
							else if (!isEmpty(arrBillCredits[billId].bcmemo)) {
								StrdObj.RfrdDocInf.Nb = arrBillCredits[billId].bcmemo;
							}

							var invoiceDate = objBillsData[billId].dte;
							StrdObj.RfrdDocInf.RltdDt = formatDate(nlapiStringToDate(arrBC[bc].bcdate));

							StrdObj.RfrdDocAmt = {};
							StrdObj.RfrdDocAmt.CdtNoteAmt = {};
							StrdObj.RfrdDocAmt.DuePyblAmt = null;
							StrdObj.RfrdDocAmt.DscntApldAmt = null;
							StrdObj.RfrdDocAmt.RmtdAmt = null;

							// StrdObj.RfrdDocAmt.DuePyblAmt.value = (billCreditAmt).toFixed(2);
							// if (discAmt==0)
							// 	discAmt = '';
							// else
							// 	discAmt = discAmt.toFixed(2);

							// StrdObj.RfrdDocAmt.DscntApldAmt.value = discAmt;
							StrdObj.RfrdDocAmt.CdtNoteAmt.value = billCreditAmt.toFixed(2);
							StrdObj.RfrdDocAmt.CdtNoteAmt.Ccy = symbol;

							// StrdObj.RfrdDocAmt.DuePyblAmt.Ccy = symbol;
							// StrdObj.RfrdDocAmt.DscntApldAmt.Ccy = symbol;
							// if (arrBC[bc].bcmemo) {
							//   StrdObj.CdtrRefInf = {};
							//   StrdObj.CdtrRefInf.Ref = arrBC[bc].bcmemo;
							// }
							StrdObj.CdtrRefInf = {};
							StrdObj.CdtrRefInf.Ref = billPaymentTranId; //objBillsData[billId].num; //

							Strd.push(StrdObj);
						}
					}

					dLog(
						'Amounts in loop=' + y,
						JSON.stringify({
							totalAmount: totalAmount,
							totalCdtTrfTxInfAmount: totalCdtTrfTxInfAmount,
							netAmt: netAmt,
							tmpAmt: tmpAmt,
						})
					);
				}

				dLog('createJPM_ISO_XMLDoc.Strd2', JSON.stringify(Strd));

				noOfBillPayments = noOfBillPayments + 1;
				totalAmount += Number(totalCdtTrfTxInfAmount);
				dLog(
					'Amounts',
					JSON.stringify({
						totalAmount: totalAmount,
						totalCdtTrfTxInfAmount: totalCdtTrfTxInfAmount,
						netAmt: netAmt,
						tmpAmt: tmpAmt,
					})
				);

				cdtTrfTxInfObj.Amt = {};
				cdtTrfTxInfObj.Amt.value = totalCdtTrfTxInfAmount.toFixed(2); //netAmt.toFixed(2); //tmpAmt.toFixed(2); //netAmt.toFixed(2); //tmpAmt.toFixed(2); //amt.toFixed(2);
				cdtTrfTxInfObj.Amt.Ccy = symbol;

				if (paymentMethod == 'DAC' || paymentMethod == 'MTS') {
					cdtTrfTxInfObj.CdtrAgt = {};
					cdtTrfTxInfObj.CdtrAgt.FinInstnId = {};
					// cdtTrfTxInfObj.CdtrAgt.FinInstnId.BIC = objVendor.recbankprimid;
          if (paymentMethod=='DAC') {
            cdtTrfTxInfObj.CdtrAgt.FinInstnId.ClrSysMmbId = {};
            cdtTrfTxInfObj.CdtrAgt.FinInstnId.ClrSysMmbId.MmbId = objVendor.recbankprimid; // Receiving Bank Routing  
          } else if (paymentMethod=='MTS') {
            cdtTrfTxInfObj.CdtrAgt.FinInstnId.ClrSysMmbId = {};
            cdtTrfTxInfObj.CdtrAgt.FinInstnId.ClrSysMmbId.BIC = objVendor.recbankprimid; // Receiving Bank Routing  
          }
					cdtTrfTxInfObj.CdtrAgt.FinInstnId.Nm = objVendor.vbankname || 'custrecord_bankname';

					if (objVendor.vbankaddrs1 || objVendor.vbankzip || objVendor.vbankcity || objVendor.vbankstate) {
						cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr = {};
						cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.Ctry = countryCodeMapping[objVendor.vbankcountry];
						cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.AdrLine = objVendor.vbankaddrs1;
						cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.StrtNm = objVendor.vbankaddrs1;
						cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.PstCd = objVendor.vbankzip;
						cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.TwnNm = objVendor.vbankcity;
						cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.BldgNb = objVendor.vbankaddrs2;
						cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.CtrySubDvsn = objVendor.vbankstate;
					}

					if (paymentMethod == 'MTS') {
						cdtTrfTxInfObj.CdtrAgt.InstrForCdtrAgt = {};
						cdtTrfTxInfObj.CdtrAgt.InstrForCdtrAgt.InstrInf = objVendor.custentity_ica_vendor_bank_instructions;
					}
				}

				cdtTrfTxInfObj.Cdtr = {};
				cdtTrfTxInfObj.Cdtr.Nm = objVendor.vendorname;

				if (paymentMethod != 'DAC') {
					if (objVendor.vendoraddrs1 || objVendor.vendoraddrs2 || objVendor.vendorpostal || objVendor.vendorcity || objVendor.vendorstateprovince || countryCodeMapping[objVendor.vendorcountrycode]) {
						dLog(
							'Vendor Address',
							JSON.stringify({
								addr1: objVendor.vendoraddrs1,
								addr2: objVendor.vendoraddrs2,
								postal: objVendor.vendorpostal,
								city: objVendor.vendorcity,
								vsp: objVendor.vendorstateprovince,
								countrycode: objVendor.vendorcountrycode,
								countryCodeMapping: countryCodeMapping[objVendor.vendorcountrycode],
							})
						);
						cdtTrfTxInfObj.Cdtr.PstlAdr = {};
						cdtTrfTxInfObj.Cdtr.PstlAdr.StrtNm = objVendor.vendoraddrs1;
						cdtTrfTxInfObj.Cdtr.PstlAdr.BldgNb = objVendor.vendoraddrs2 || '';
						cdtTrfTxInfObj.Cdtr.PstlAdr.PstCd = objVendor.vendorpostal;
						cdtTrfTxInfObj.Cdtr.PstlAdr.TwnNm = objVendor.vendorcity;
						cdtTrfTxInfObj.Cdtr.PstlAdr.CtrySubDvsn = objVendor.vendorstateprovince;
						cdtTrfTxInfObj.Cdtr.PstlAdr.Ctry = countryCodeMapping[objVendor.vendorcountrycode];
					}
				} else {
					cdtTrfTxInfObj.Cdtr.PstlAdr = null;
				}

				if (paymentMethod == 'DAC' || paymentMethod == 'MTS') {
					cdtTrfTxInfObj.CdtrAcct = {};
					cdtTrfTxInfObj.CdtrAcct.Id = {};
					cdtTrfTxInfObj.CdtrAcct.Id.Othr = {};
					cdtTrfTxInfObj.CdtrAcct.Id.Othr.Id = objVendor.recpartyaccount;

					if (paymentMethod == 'DAC') {
						cdtTrfTxInfObj.CdtrAcct.Tp = {};
						cdtTrfTxInfObj.CdtrAcct.Tp.Cd = 'CACC';
					}
				}

				// cdtTrfTxInfObj.RltdAmtInf = {};
				// cdtTrfTxInfObj.RltdAmtInf.RmtLctnMtd = objVendor.pmp_dac_contactname || "";
				// cdtTrfTxInfObj.RltdAmtInf.RmtLctnElctrncAdr = objVendor.pmp_dac_emailaddress || "";
				if (paymentMethod == 'CHK') {
					dLog('objVendor.custentity_ica_vendor_bank_instructions', objVendor.custentity_ica_vendor_bank_instructions);
					cdtTrfTxInfObj.RmtInf = {};
					cdtTrfTxInfObj.RmtInf.Ustrd = objVendor.custentity_ica_vendor_bank_instructions; //
					cdtTrfTxInfObj.RmtInf.Strd = Strd;
				}
				// dLog("cdtTrfTxInfObj", JSON.stringify(cdtTrfTxInfObj));
				CdtTrfTxInf.push(cdtTrfTxInfObj);
			}

			dLog(
				'About to add totalAmount',
				JSON.stringify({
					totalAmount: totalAmount,
				})
			);

			PmtInfObj.NbOfTxs = noOfBillPayments;
			PmtInfObj.CtrlSum = totalAmount.toFixed(2);
			totalNbOfTxs += Number(noOfBillPayments);
			totalCtrlSum += Number(totalAmount);
			PmtInfObj.CdtTrfTxInf = CdtTrfTxInf;
			PmtInf.push(PmtInfObj);
		}
	}

	objects.NbOfTxs = totalNbOfTxs; //grpHdrNbOfTxs;
	objects.CtrlSum = totalCtrlSum.toFixed(2); //grpHdrCtrlSum.toFixed(2); // Do we comment this out?
	objects.PmtInf = PmtInf;
	// objects.CdtTrfTxInf = CdtTrfTxInf;
	dLog("objects.PmtInf", JSON.stringify(objects.PmtInf));
	// dLog('objects.CdtTrfTxInf', JSON.stringify(objects.CdtTrfTxInf));

	var fileId = nlapiSearchRecord('file', null, [['name', 'is', 'ica_svb_check_iso.xml']], []);
	if (fileId != null) {
		fileId = fileId[0].getId();
	}

	var tmplFile = nlapiLoadFile(fileId);

	var template = Handlebars.compile(tmplFile.getValue());
	var xmlDoc = template(objects);

	dLog('xmlDoc', xmlDoc);
	return xmlDoc;
}



function createBOA_ISO_XMLDoc(objAcctMapping) {
	var arrTempBillIds = [];
	var arrBillCRIds = [];
	var arrBillAmt = [];
	var arrBillAmtOrig = [];
	var arrBillDiscAmt = [];
	var arrBillPayInfoCtr = [];
	var arrBillPayInfoSum = [];
	var arrGrpHdrNbOfTxs = [];
	var arrPmtInfNbOfTxs = [];
	var arrBillIds = [];
	var grpHdrNbOfTxs = 0;
	var grpHdrCtrlSum = 0;
	var arrPayeeIds = [];
	var _currencies = getCurrencies();

	for (x in arrBillsProcessed) {
		var billId = arrBillsProcessed[x].id;
		var billPaymentId = arrBillsProcessed[x].payment;

		dLog('createBOA_ISO_XMLDoc', 'Bill info = ' + JSON.stringify(arrBillsProcessed[x]));
		if (!isEmpty(billPaymentId) && billPaymentId != 'XXXNONEXXX' && billPaymentId != 'CREDIT') {
			if (billPaymentId != 'CREDIT') arrTempBillIds.push(billId);

			var payMethod = arrBillsProcessed[x].paymethod;
			var paymentId = arrBillsProcessed[x].payment;
			var payeeId = arrBillsProcessed[x].payeeid;

			arrBillAmtOrig[billId] = arrBillsProcessed[x].origamt;
			// arrBillAmt[billId] = arrBillsProcessed[x].pay;
			arrBillAmt[billId] = arrBillsProcessed[x].payamt;
			arrBillDiscAmt[billId] = arrBillsProcessed[x].discamt;

			var ndx = payMethod + '@@' + paymentId;

			if (arrBillPayInfoCtr[payMethod] == null) arrBillPayInfoCtr[payMethod] = 0;
			if (arrBillPayInfoSum[payMethod] == null) arrBillPayInfoSum[payMethod] = 0;
			if (arrPmtInfNbOfTxs[ndx] == null) arrPmtInfNbOfTxs[ndx] = 0;

			if (paymentId && arrGrpHdrNbOfTxs[paymentId] == null) grpHdrNbOfTxs++;

			arrPmtInfNbOfTxs[ndx]++;
			arrBillPayInfoCtr[payMethod]++;
			arrBillPayInfoSum[payMethod] += getFloatVal(arrBillsProcessed[x].payamt);
			arrGrpHdrNbOfTxs[paymentId] = paymentId;

			//grpHdrCtrlSum += getFloatVal(arrBillsProcessed[x].payamt);
		}
		grpHdrCtrlSum += getFloatVal(arrBillsProcessed[x].payamt);

		if (billPaymentId == 'CREDIT') arrBillCRIds.push(billId);
	}

	var arrBillIds = [];
	var arrBillIds2 = [];
	var arrBillIds3 = [];
	var arrBillIds4 = [];
	var arrBillIds5 = [];

	for (vx in arrTempBillIds) {
		var isBC = false;
		for (var x in arrBillCRIds) {
			if (arrTempBillIds[vx] == arrBillCRIds[x]) {
				isBC = true;
				break;
			}
		}
		if (!isBC) {
			arrBillIds.push(arrTempBillIds[vx]);
			arrBillIds2.push(arrTempBillIds[vx]);
			arrBillIds3.push(arrTempBillIds[vx]);
			arrBillIds4.push(arrTempBillIds[vx]);
			arrBillIds5.push(arrTempBillIds[vx]);
		}
	}

	var arrBillCredits = getBillCredit(arrBillIds);
	var objBillsData = getBillData(arrBillIds2);
	var arrBillPO = getPOMap(arrBillIds3);
	var arrVendorBills = getPayeeBillsByPayMethod(arrBillIds4);
	var arrVendorBillsCurr = getPayeeBillsCurrency(arrBillIds5);
	var nsAcctSub = !isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('subsidiary', 'CUSTRECORD_ACCT_MAP_NETSUITE_ACCOUNT')) ? objAcctMapping[0].getValue('subsidiary', 'CUSTRECORD_ACCT_MAP_NETSUITE_ACCOUNT') : '';
	// var nsAcctSub
	var objVDCRecResults = getVendorDAC_CCRPaymentRec(nsAcctSub);
	dLog('objVDCRecResults', JSON.stringify(objVDCRecResults));
	dLog('objAcctMapping', JSON.stringify(objAcctMapping));

	//Gather data.

	var objects = {
		MsgId: 'TBD',
		CreDtTm: 'Test',
		Authstn: {
			Cd: '',
		},
		NbOfTxs: '2',
		CtrlSum: '2000',
		InitgPty: {
			Id: {
				OrgId: {
					Othr: {
						Id: '',
					},
				},
			},
		},
		PmtInfId: 'PmtInfId',
		PmtMtd: 'PmtMtd',
		PmtTpInf: {
			SvcLvl: {
				Cd: 'This is CD',
			},
		},
		ReqdExctnDt: 'ReqdExctnDt',
		Dbtr: {
			Nm: 'This is Nm',
			PstlAdr: {
				StrtNm: '',
				BldgNb: '',
				PstCd: '',
				TwnNm: '',
				CtrySubDvsn: '',
				Ctry: '',
			},
			Id: {
				Othr: {
					Id: 'Dbtr.Id.Othr.Id',
				},
			},
		},
		DbtrAcct: {
			Id: {
				Othr: {
					Id: 'DbtrAcct.Id.Othr.Id',
				},
			},
			PstlAdr: {
				StrtNm: '',
				BldgNb: '',
				PstCd: '',
				TwnNm: '',
				CtrySubDvsn: '',
				Ctry: '',
			},
		},
		DbtrAgt: {
			FinInstnId: {
				BIC: 'BIC',
				PstlAdr: {
					StrtNm: '',
					BldgNb: '',
					PstCd: '',
					TwnNm: '',
					CtrySubDvsn: '',
					Ctry: '',
				},
			},
		},
		CdtTrfTxInf: CdtTrfTxInf,
	};

	var PmtInf = [];

	for (x in arrVendorBills) {
		var payeeId = x.split('X@X')[1];
		arrPayeeIds.push(payeeId);
	}

	var arrVendors = getEntityData(arrPayeeIds);

	var today = new Date();
	var bpmdate = BPM_DATE;
	var d = nlapiStringToDate(bpmdate, 'datetime');

	var fileCtrlNumber = moment(today).format('MMDDhhmmss'); //Date.create().format("{yy}{MM}{dd}{mm}{ss}");
	objects.MsgId = pad(fileCtrlNumber, 4);
	objects.CreDtTm = moment(d).format('YYYY-MM-DDThh:mm:ss') || today.format('{yyyy}-{MM}-{dd}T{hh}:{mm}:{ss}');
	objects.Authstn.Cd = 'AUTH';

	if (objects.CtrlSum == '0.00') {
		dLog('CtrlSum is 0.00, this should not happen. Returning empty file', objects.CtrlSum);
		return '';
	}

	if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_dom_ach_co_id'))) {
		objects.InitgPty.Id.OrgId.Othr.Id = objAcctMapping[0].getValue('custrecord_acct_map_dom_ach_co_id'); //Previously CEO ID
	}

	var totalNbOfTxs = 0;
	var totalCtrlSum = 0;

	dLog('BOA ISO: arrBillPayInfoCtr', JSON.stringify(arrBillPayInfoCtr));
	for (x in arrBillPayInfoCtr) {
		//CdtTrfTxInf loop starts here.
		var CdtTrfTxInf = [];

		if (SINGLEBILLPYMTS == 'T') {
			dAudit('Create Single Bill Payments here.', JSON.stringify(arrBillsProcessed));
			var PmtInfObj = {};

			PmtInfObj.PmtInfId = fileCtrlNumber;
			var paymentMethod = x;
			PmtInfObj.PmtMtd = 'TRF';

			// objects.PmtTpInf.SvcLvl.Cd = (paymentMethod == 'DAC') ? 'NURG' : 'URGP';
			PmtInfObj.PmtTpInf = {};
			PmtInfObj.PmtTpInf.SvcLvl = {};
			PmtInfObj.PmtTpInf.SvcLvl.Prtry = paymentMethod == 'DAC' ? 'NORM' : 'URGP';
			PmtInfObj.ReqdExctnDt = moment(d).format('YYYY-MM-DD') || today.format('{yyyy}-{MM}-{dd}');

			if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_companyname'))) {
				PmtInfObj.Dbtr = {};
				PmtInfObj.Dbtr.Nm = objVDCRecResults[0].getValue('custrecord_companyname');
			}

			//PstlAdr
			var country = !isEmpty(objVDCRecResults) ? objVDCRecResults[0].getValue('custrecord_compcountrycode') : '';

			if (
				(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_comppostcode'))) ||
				(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compcity'))) ||
				(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compstateprov'))) ||
				(!isEmpty(objVDCRecResults) && objVDCRecResults[0].getValue('custrecord_compcountrycode')) ||
				(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compadd1')))
			) {
				PmtInfObj.Dbtr = {};
				PmtInfObj.Dbtr.PstlAdr = {};
				if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compadd1'))) {
					PmtInfObj.Dbtr.PstlAdr.StrtNm = '<AdrLine>' + objVDCRecResults[0].getValue('custrecord_compadd1') + '</AdrLine>';
				}
				if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compadd2'))) {
					PmtInfObj.Dbtr.PstlAdr.BldgNb = '<BldgNb>' + objVDCRecResults[0].getValue('custrecord_compadd2') + '</BldgNb>';
				}

				if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_comppostcode'))) {
					PmtInfObj.Dbtr.PstlAdr.PstCd = '<PstCd>' + objVDCRecResults[0].getValue('custrecord_comppostcode') + '</PstCd>';
				}
				// addTextNodeFromParentNode(xmlDoc, pstlAdr, 'PstCd', objVDCRecResults[0].getValue('custrecord_comppostcode'));

				if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compcity'))) {
					PmtInfObj.Dbtr.PstlAdr.TwnNm = '<TwnNm>' + objVDCRecResults[0].getValue('custrecord_compcity') + '</TwnNm>';
				}
				// addTextNodeFromParentNode(xmlDoc, pstlAdr, 'TwnNm', objVDCRecResults[0].getValue('custrecord_compcity'));

				//Where do we get CtrySubDvsn?
				if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compstateprov'))) {
					PmtInfObj.Dbtr.PstlAdr.TwnNm = '<CtrySubDvsn>' + objVDCRecResults[0].getValue('custrecord_compstateprov') + '</CtrySubDvsn>';
				}

				// addTextNodeFromParentNode(xmlDoc, pstlAdr, 'Ctry', country);
				if (country) {
					PmtInfObj.Dbtr.PstlAdr.Ctry = '<Ctry>' + country + '</Ctry>';
				}
			}

			PmtInfObj.Dbtr.Id = {};
			PmtInfObj.Dbtr.Id.Othr = {};
			// if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_dom_ach_co_id'))) {
			// 	PmtInfObj.Dbtr.OrgId.Id.Othr.Id = objAcctMapping[0].getValue('custrecord_acct_map_dom_ach_co_id'); //ACH Company ID
			// }

      // RSF
      if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ceo_company_id'))) {
        PmtInfObj.Dbtr.Id.OrgId.Othr.Id = objAcctMapping[0].getValue('custrecord_acct_map_ceo_company_id');
      }


			//DbtrAcct
			PmtInfObj.DbtrAcct = {};
			PmtInfObj.DbtrAcct.Id = {};
			PmtInfObj.DbtrAcct.Id.Othr = {};
			if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_origin_acc'))) {
				PmtInfObj.DbtrAcct.Id.Othr.Id = objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_origin_acc'); // Bank Account Number

				var symbol = '';
				try {
					symbol = _.find(_currencies, { internalid: String(objAcctMapping[0].getValue('custrecord_acct_map_account_currency')) }).symbol;
					PmtInfObj.DbtrAcct.Ccy = symbol; //objAcctMapping[0].getValue('custrecord_acct_map_account_currency') || ''; // Bank Currency
					dAudit('DbtrAcct.Ccy-Currency', objAcctMapping[0].getValue('custrecord_acct_map_account_currency'));
					dAudit('DbtrAcct.Ccy', JSON.stringify(_currencies));
				} catch (e) {}
			}

			//DbtrAgt
			if ((!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id'))) || !isEmpty(country)) {
				if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id'))) {
					// objects.DbtrAgt.FinInstnId.BIC = objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id');

					PmtInfObj.DbtrAgt = {};
					PmtInfObj.DbtrAgt.Nm = objVDCRecResults[0].getValue('custrecord_bankname') || '';
					PmtInfObj.DbtrAgt.FinInstnId = {};
					PmtInfObj.DbtrAgt.FinInstnId.ClrSysMmbId = {};
					PmtInfObj.DbtrAgt.FinInstnId.ClrSysMmbId.MmbId = objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id'); // Routing Number 10 Digit
				}
				PmtInfObj.DbtrAgt.FinInstnId.PstlAdr = {};
				PmtInfObj.DbtrAgt.FinInstnId.PstlAdr.Ctry = 'CA';
			}

			for (var i = 0; i < arrBillsProcessed.length; i++) {
				// objects.PmtInfId = fileCtrlNumber;
				// var paymentMethod = x;
				// objects.PmtMtd = 'TRF';

				// // objects.PmtTpInf.SvcLvl.Cd = (paymentMethod == 'DAC') ? 'NURG' : 'URGP';
				// objects.PmtTpInf.SvcLvl = {};
				// objects.PmtTpInf.SvcLvl.Prtry = (paymentMethod == 'DAC') ? 'NORM' : 'URGP';
				// objects.ReqdExctnDt = moment(d).format('YYYY-MM-DD') || today.format('{yyyy}-{MM}-{dd}');

				// if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_companyname')))
				//         objects.Dbtr.Nm = objVDCRecResults[0].getValue('custrecord_companyname');

				// //PstlAdr
				// var country = (!isEmpty(objVDCRecResults)) ? objVDCRecResults[0].getValue('custrecord_compcountrycode') : '';

				// if ((!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_comppostcode')))
				//                 || (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compcity')))
				//                 || (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compstateprov')))
				//                 || (!isEmpty(objVDCRecResults) && objVDCRecResults[0].getValue('custrecord_compcountrycode'))
				//                 || (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compadd1')))) {

				//         if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compadd1'))) {
				//                 objects.Dbtr.PstlAdr.StrtNm = "<AdrLine>" + objVDCRecResults[0].getValue('custrecord_compadd1') + "</AdrLine>";
				//         }
				//         if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compadd2'))) {
				//                 objects.Dbtr.PstlAdr.BldgNb = "<BldgNb>" + objVDCRecResults[0].getValue('custrecord_compadd2') + "</BldgNb>";
				//         }

				//         if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_comppostcode'))) {
				//                 objects.Dbtr.PstlAdr.PstCd = "<PstCd>" + objVDCRecResults[0].getValue('custrecord_comppostcode') + "</PstCd>";
				//         }
				//                 // addTextNodeFromParentNode(xmlDoc, pstlAdr, 'PstCd', objVDCRecResults[0].getValue('custrecord_comppostcode'));

				//         if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compcity'))) {
				//                 objects.Dbtr.PstlAdr.TwnNm = "<TwnNm>" + objVDCRecResults[0].getValue('custrecord_compcity') + "</TwnNm>";
				//         }
				//                 // addTextNodeFromParentNode(xmlDoc, pstlAdr, 'TwnNm', objVDCRecResults[0].getValue('custrecord_compcity'));

				//         //Where do we get CtrySubDvsn?
				//         if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compstateprov'))) {
				//                 objects.Dbtr.PstlAdr.TwnNm = "<CtrySubDvsn>" + objVDCRecResults[0].getValue('custrecord_compstateprov') + "</CtrySubDvsn>";
				//         }

				//         // addTextNodeFromParentNode(xmlDoc, pstlAdr, 'Ctry', country);
				//         if (country) {
				//                 objects.Dbtr.PstlAdr.Ctry = "<Ctry>" + country + "</Ctry>";
				//         }
				//         dLog('Added Ctry', JSON.stringify(objects) );

				//         // addTextNodeFromParentNode(xmlDoc, pstlAdr, 'AdrLine', objVDCRecResults[0].getValue('custrecord_compadd1'));
				//         // objects.Dbtr.PstlAdr.BldgNb = '2'; not used
				// }

				// if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_dom_ach_co_id'))) {
				//         objects.Dbtr.Id = {};
				//         objects.Dbtr.Id.Othr = {};
				//         objects.Dbtr.Id.Othr.Id = objAcctMapping[0].getValue('custrecord_acct_map_dom_ach_co_id'); //ACH Company ID
				// }

				// //DbtrAcct
				// if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_origin_acc'))) {
				//         objects.DbtrAcct = {};
				//         objects.DbtrAcct.Id = {};
				//         objects.DbtrAcct.Id.Othr = {};
				//         objects.DbtrAcct.Id.Othr.Id = objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_origin_acc'); // Bank Account Number

				//         var symbol = '';
				//         try {
				//                 symbol = _.find(_currencies, {"internalid" : String(objAcctMapping[0].getValue('custrecord_acct_map_account_currency'))}).symbol;
				//                 objects.DbtrAcct.Ccy = symbol; //objAcctMapping[0].getValue('custrecord_acct_map_account_currency') || ''; // Bank Currency
				//                 dAudit('DbtrAcct.Ccy', objAcctMapping[0].getValue('custrecord_acct_map_account_currency'));
				//                 dAudit('DbtrAcct.Ccy', JSON.stringify(_currencies));
				//         } catch(e) {}

				// }

				// //DbtrAgt
				// if ((!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id'))) || !isEmpty(country)) {
				//         if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id'))) {
				//                 // objects.DbtrAgt.FinInstnId.BIC = objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id');

				//                 objects.DbtrAgt = {};
				//                 objects.DbtrAgt.Nm = objVDCRecResults[0].getValue('custrecord_bankname') || "";
				//                 objects.DbtrAgt.FinInstnId = {};
				//                 objects.DbtrAgt.FinInstnId.ClrSysMmbId = {};
				//                 objects.DbtrAgt.FinInstnId.ClrSysMmbId.MmbId = objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id'); // Routing Number 10 Digit
				//         }
				//         objects.DbtrAgt.FinInstnId.PstlAdr = {};
				//         objects.DbtrAgt.FinInstnId.PstlAdr.Ctry = 'CA';
				// }

				var billPayment = arrBillsProcessed[i];

				if (billPayment.payment == 'CREDIT') {
					continue;
				}

				var symbol = '';

				try {
					symbol = _.find(_currencies, { internalid: String(billPayment.currid) }).symbol || 'USD';
				} catch (e) {}

				var objVendor = arrVendors[billPayment.payeeid];
				if (!objVendor) objVendor = _.find(arrVendors, { internalid: String(billPayment.payeeid) });

				dLog('objVendor', JSON.stringify(objVendor));

				var cdtTrfTxInfObj = {};
				cdtTrfTxInfObj.PmtId = {};

				var refnum = billPayment.refnum; //arrBillPaymentMap[billPayment.payeeid];
				// var refnum = billPayment.billnum; //arrBillPaymentMap[billPayment.payeeid];
				var instrId = '';
				if (refnum.length > 12) {
					instrId = pz(refnum.substring(refnum.length - 12, refnum.length), 12);
				} else {
					instrId = pz(refnum, 12);
				}
				refnum = billPayment.billnum; //Overwrite endToendID
				var endToEndId = refnum;
				if (refnum.length > 18) {
					endToEndId = refnum.substr(0, 18);
				}

				endToEndId = moment(d).format('YYYY-MM-DDThh:mm:ss');

				cdtTrfTxInfObj.PmtId.InstrId = instrId;
				cdtTrfTxInfObj.PmtId.EndToEndId = endToEndId;
				cdtTrfTxInfObj.Amt = {};
				cdtTrfTxInfObj.Amt.value = billPayment.payamt; //amt.toFixed(2);
				cdtTrfTxInfObj.Amt.Ccy = symbol;
				cdtTrfTxInfObj.ChrgBr = billPayment.paymethod == 'MTS' ? 'CRED' : '';

				cdtTrfTxInfObj.CdtrAgt = {};
				cdtTrfTxInfObj.CdtrAgt.FinInstnId = {};
				// cdtTrfTxInfObj.CdtrAgt.FinInstnId.BIC = objVendor.recbankprimid;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.ClrSysMmbId = {};
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.ClrSysMmbId.MmbId = objVendor.recbankprimid; //objVendor.bankid; // Receiving Bank Routing
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.Nm = objVendor.vbankname;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr = {};
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.Ctry = countryCodeMapping[objVendor.vbankcountry];
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.AdrLine = objVendor.vbankaddrs1;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.StrtNm = objVendor.vbankaddrs1;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.BldgNb = '';
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.PstCd = objVendor.vbankzip;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.TwnNm = objVendor.vbankcity;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.CtrySubDvsn = objVendor.vbankstate;

				if (billPayment.paymethod == 'MTS') {
					cdtTrfTxInfObj.CdtrAgt.InstrForCdtrAgt = {};
					cdtTrfTxInfObj.CdtrAgt.InstrForCdtrAgt.InstrInf = objVendor.custentity_ica_vendor_bank_instructions;
				}

				cdtTrfTxInfObj.Cdtr = {};
				cdtTrfTxInfObj.Cdtr.Nm = objVendor.vendorname;
				cdtTrfTxInfObj.Cdtr.PstlAdr = {};
				cdtTrfTxInfObj.Cdtr.PstlAdr.StrtNm = objVendor.vendoraddrs1;
				cdtTrfTxInfObj.Cdtr.PstlAdr.BldgNb = objVendor.vendoraddrs2 || '';
				cdtTrfTxInfObj.Cdtr.PstlAdr.PstCd = objVendor.vendorpostal;
				cdtTrfTxInfObj.Cdtr.PstlAdr.TwnNm = objVendor.vendorcity;
				cdtTrfTxInfObj.Cdtr.PstlAdr.CtrySubDvsn = objVendor.vendorstateprovince;
				cdtTrfTxInfObj.Cdtr.PstlAdr.Ctry = countryCodeMapping[objVendor.vendorcountrycode];

				cdtTrfTxInfObj.CdtrAcct = {};
				cdtTrfTxInfObj.CdtrAcct.Id = {};
				cdtTrfTxInfObj.CdtrAcct.Id.Othr = {};
				cdtTrfTxInfObj.CdtrAcct.Id.Othr.Id = objVendor.recpartyaccount;

				// cdtTrfTxInfObj.RltdAmtInf = {};
				// cdtTrfTxInfObj.RltdAmtInf.RmtLctnMtd = objVendor.pmp_dac_contactname || "";
				// cdtTrfTxInfObj.RltdAmtInf.RmtLctnElctrncAdr = objVendor.pmp_dac_emailaddress || "";
				cdtTrfTxInfObj.RmtInf = {};
				cdtTrfTxInfObj.RmtInf.Ustrd = refnum;
				cdtTrfTxInfObj.RmtInf.VendorId = objVendor.entityid;
				cdtTrfTxInfObj.RmtInf.Category = objVendor.category;

				cdtTrfTxInfObj.RmtInf.Strd = Strd;

				CdtTrfTxInf.push(cdtTrfTxInfObj);
			}
			PmtInfObj.CdtTrfTxInf = CdtTrfTxInf;
			PmtInf.push(PmtInfObj);
		} else {
			dAudit('arrVendorBills', arrVendorBills);
			var refnum = '';
			var currency = '';
			var symbol = '';
			try {
				dLog('objAcctMapping', JSON.stringify(objAcctMapping));
				symbol = _.find(_currencies, { internalid: String(objAcctMapping[0].getValue('custrecord_acct_map_account_currency')) }).symbol;
			} catch (e) {
				symbol = 'USD';
			}

			dLog('SYMBOL', symbol);

			var PmtInfObj = {};
			// var fileCtrlNumber = Date.create().format("{yy}{MM}{dd}{mm}{ss}"); //RSF add millisecs
			var fileCtrlNumber = moment(today).format('YYMMDDmmssSS');
			PmtInfObj.PmtInfId = fileCtrlNumber;
			var paymentMethod = x;
			if (paymentMethod == 'CHK') {
				PmtInfObj.PmtMtd = 'CHK';
			} else {
				PmtInfObj.PmtMtd = 'TRF';
			}

			// objects.PmtTpInf.SvcLvl.Cd = (paymentMethod == 'DAC') ? 'NURG' : 'URGP';
			if (paymentMethod == 'DAC' || paymentMethod == 'MTS') {
				PmtInfObj.PmtTpInf = {};
				PmtInfObj.PmtTpInf.SvcLvl = {};

				if (paymentMethod == 'DAC') {
					PmtInfObj.PmtTpInf.SvcLvl.Cd = 'NURG';
				} else if (paymentMethod == 'CHK') {
					PmtInfObj.PmtTpInf.SvcLvl.Prtry = 'PM';
				} else if (paymentMethod == 'MTS') {
					PmtInfObj.PmtTpInf.SvcLvl.Cd = 'URGP';
				}
			}

			PmtInfObj.ReqdExctnDt = moment(d).format('YYYY-MM-DD') || today.format('{yyyy}-{MM}-{dd}');

			dAudit('objVDCRecResults', JSON.stringify(objVDCRecResults));
			if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_companyname'))) {
				PmtInfObj.Dbtr = {};
				PmtInfObj.Dbtr.Nm = objVDCRecResults[0].getValue('custrecord_companyname');
				dLog('Added Nm', objVDCRecResults[0].getValue('custrecord_companyname'));
			}

			//PstlAdr
			var country = !isEmpty(objVDCRecResults) ? objVDCRecResults[0].getValue('custrecord_compcountrycode') : '';

			if (
				(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_comppostcode'))) ||
				(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compcity'))) ||
				(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compstateprov'))) ||
				(!isEmpty(objVDCRecResults) && objVDCRecResults[0].getValue('custrecord_compcountrycode')) ||
				(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compadd1')))
			) {
				PmtInfObj.Dbtr.PstlAdr = {};

				if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compadd1'))) {
					PmtInfObj.Dbtr.PstlAdr.StrtNm = '<StrtNm>' + objVDCRecResults[0].getValue('custrecord_compadd1') + '</StrtNm>';
				}
				if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compadd2'))) {
					PmtInfObj.Dbtr.PstlAdr.BldgNb = '<BldgNb>' + objVDCRecResults[0].getValue('custrecord_compadd2') + '</BldgNb>';
				}

				if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_comppostcode'))) {
					PmtInfObj.Dbtr.PstlAdr.PstCd = '<PstCd>' + objVDCRecResults[0].getValue('custrecord_comppostcode') + '</PstCd>';
				}
				// addTextNodeFromParentNode(xmlDoc, pstlAdr, 'PstCd', objVDCRecResults[0].getValue('custrecord_comppostcode'));

				if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compcity'))) {
					PmtInfObj.Dbtr.PstlAdr.TwnNm = '<TwnNm>' + objVDCRecResults[0].getValue('custrecord_compcity') + '</TwnNm>';
				}
				// addTextNodeFromParentNode(xmlDoc, pstlAdr, 'TwnNm', objVDCRecResults[0].getValue('custrecord_compcity'));

				//Where do we get CtrySubDvsn?
				if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compcountrycode'))) {
					PmtInfObj.Dbtr.PstlAdr.CtrySubDvsn = '<CtrySubDvsn>' + objVDCRecResults[0].getValue('custrecord_compcountrycode') + '</CtrySubDvsn>';
				}

				// addTextNodeFromParentNode(xmlDoc, pstlAdr, 'Ctry', country);
				if (country) {
					PmtInfObj.Dbtr.PstlAdr.Ctry = '<Ctry>' + country + '</Ctry>';
				}
			}

			if (paymentMethod == 'DAC') {
				PmtInfObj.Dbtr.Id = {};
				PmtInfObj.Dbtr.Id.Othr = {};

				// if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_dom_ach_co_id'))) {
				// 	PmtInfObj.Dbtr.Id.Othr.Id = objAcctMapping[0].getValue('custrecord_acct_map_dom_ach_co_id'); //ACH Company ID
				// }

				PmtInfObj.Dbtr.Id.OrgId = {};
				PmtInfObj.Dbtr.Id.OrgId.Othr = {};

				if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ceo_company_id'))) {
					PmtInfObj.Dbtr.Id.OrgId.Othr.Id = objAcctMapping[0].getValue('custrecord_acct_map_ceo_company_id');
				}

				// if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_dom_ach_co_id'))) {
				// 	PmtInfObj.Dbtr.Id.OrgId.Othr.Id = objAcctMapping[0].getValue('custrecord_acct_map_dom_ach_co_id'); //ACH Company ID
				// }


				if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_bankname'))) {
					PmtInfObj.Dbtr.Id.OrgId.Othr.SchmeNm = {};
					PmtInfObj.Dbtr.Id.OrgId.Othr.SchmeNm.Cd = objVDCRecResults[0].getValue('custrecord_bankname');
				}
			}

			//DbtrAcct
			PmtInfObj.DbtrAcct = {};
			PmtInfObj.DbtrAcct.Id = {};
			PmtInfObj.DbtrAcct.Id.Othr = {};
			if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_origin_acc'))) {
				PmtInfObj.DbtrAcct.Id.Othr.Id = objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_origin_acc'); // Bank Account Number

				// var symbol = "";
				try {
					// symbol = _.find(_currencies, { internalid: String(objAcctMapping[0].getValue("custrecord_acct_map_account_currency")) }).symbol || "USD";
					PmtInfObj.DbtrAcct.Ccy = symbol; //objAcctMapping[0].getValue('custrecord_acct_map_account_currency') || ''; // Bank Currency
					dAudit('DbtrAcct.Ccy', objAcctMapping[0].getValue('custrecord_acct_map_account_currency'));
					dAudit('DbtrAcct.Ccy_currencies', JSON.stringify(_currencies));
				} catch (e) {}
			}

			//DbtrAgt
			if ((!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id'))) || !isEmpty(country)) {
				if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id'))) {
					// objects.DbtrAgt.FinInstnId.BIC = objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id');
					dLog('Here BIC', objAcctMapping[0].getValue('custrecord_acct_map_hsbc_swift_bank_id'));
					PmtInfObj.DbtrAgt = {};
					PmtInfObj.DbtrAgt.Nm = objVDCRecResults[0].getValue('custrecord_bankname') || '';
					PmtInfObj.DbtrAgt.FinInstnId = {};
					PmtInfObj.DbtrAgt.FinInstnId.ClrSysMmbId = {};
					PmtInfObj.DbtrAgt.FinInstnId.ClrSysMmbId.MmbId = objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id'); // Routing Number 10 Digit

					if (paymentMethod == 'DAC' || paymentMethod == 'MTS' || paymentMethod == 'CHK') {
						// PmtInfObj.DbtrAgt
						PmtInfObj.DbtrAgt.Bic = objAcctMapping[0].getValue('custrecord_acct_map_hsbc_swift_bank_id');
					}
				}
				var country = !isEmpty(objVDCRecResults) ? objVDCRecResults[0].getValue('custrecord_ica_orig_bank_country_code') : '';
				if (!isEmpty(country)) {
					dLog('Here Country Code', country);
					PmtInfObj.DbtrAgt.FinInstnId.PstlAdr = {};
					PmtInfObj.DbtrAgt.FinInstnId.PstlAdr.Ctry = country;
				}
			}

			var noOfBillPayments = 0;
			var totalAmount = 0;
			for (v in arrVendorBills) {
				var arrPayeeInfo = v.split('X@X');
				var payeeId = arrPayeeInfo[1];

				//var objVendor=arrVendors[payeeId];
				       var objVendor = _.find(arrVendors, { internalid: String(payeeId)});
				// var objVendor = _.find(arrVendors, { internalid: String(payeeId), paymentmethod: String(paymentMethod) })[0];
dAudit('objVendor-new', objVendor);				dLog('objVendor', JSON.stringify(objVendor));

				if (isEmpty(objVendor)) continue;

				var pmtMethod = objVendor.paymentmethod;

				if (paymentMethod != pmtMethod) continue;
				//JPM ISO
				if (pmtMethod == 'DAC') {
					PmtInfObj.PmtTpInf.LclInstrm = {};
					PmtInfObj.PmtTpInf.LclInstrm.Cd = objVendor.payformat;
				}

				var arrBills = arrVendorBills[paymentMethod + 'X@X' + payeeId];
				dLog('arrBills', JSON.stringify(arrBills));
				var tmpAmt = 0;

				var numberOfBills = _.size(arrBills);
				var billnum = '';
				var billPaymentTranId = '';
				for (by in arrBills) {
					var billId = arrBills[by];
					refnum = _.find(arrBillsProcessed, { id: String(billId) }).refnum;
					currency = _.find(arrBillsProcessed, { id: String(billId) }).currid;
					subtext = _.find(arrBillsProcessed, { id: String(billId) }).subtext;
					billnum = _.find(arrBillsProcessed, { id: String(billId) }).billnum;
					billPaymentTranId = _.find(arrBillsProcessed, { id: String(billId) }).refnum;
					dLog('billnum', billnum);

					try {
						symbol = _.find(_currencies, { internalid: String(currency) }).symbol || 'USD';
					} catch (e) {}
					dLog('billPaymentTranId', billPaymentTranId);

					var netAmt = 0;
					var origAmt = getFloatVal(arrBillAmtOrig[billId]);
					var amt = getFloatVal(arrBillAmt[billId]);

					var discAmt = !isEmpty(arrBillDiscAmt[billId]) ? getFloatVal(arrBillDiscAmt[billId]) : 0;

					dLog(
						'amounts',
						JSON.stringify({
							netAmt: netAmt,
							origAmt: origAmt,
							amt: amt,
							discAmt: discAmt,
						})
					);

					netAmt = origAmt;
					tmpAmt += amt; //used to be netAmt

					if (discAmt > 0) {
						netAmt -= discAmt;
						tmpAmt -= discAmt;
					}

					if (!isEmpty(arrBillCredits[billId])) {
						var arrBC = arrBillCredits[billId];

						dLog('arrBC in arrBills', JSON.stringify(arrBC));

						for (bc in arrBC) {
							var billCreditAmtP = getFloatVal(arrBC[bc].bcamt);
							var billCreditAmt = billCreditAmtP * -1;

							// tmpAmt = (tmpAmt - billCreditAmtP);
							netAmt = netAmt - billCreditAmtP;
						}
					}
				}

				var cdtTrfTxInfObj = {};
				cdtTrfTxInfObj.PmtId = {};

				var refnum = arrBillPaymentMap[payeeId];
				var instrId = '';
				if (refnum.length > 12) {
					instrId = pz(refnum.substring(refnum.length - 12, refnum.length), 12);
				} else {
					instrId = pz(refnum, 12);
				}
				var endToEndId = billnum.substr(0, 18);
				if (numberOfBills > 1) {
					endToEndId = subtext.substr(0, 18);
				}

				var s = String(moment().valueOf());
				s = s.slice(s.length - 6);
				endToEndId = moment(d).format('YYYYMMDD') + s;

				cdtTrfTxInfObj.PmtId.InstrId = instrId;
				cdtTrfTxInfObj.PmtId.EndToEndId = endToEndId;

				if (paymentMethod == 'CHK') {
					cdtTrfTxInfObj.PmtInfObj = {};
					cdtTrfTxInfObj.PmtInfObj.PmtTpInf = {};
					cdtTrfTxInfObj.PmtInfObj.PmtTpInf.SvcLvl = {};

					if (objVendor.deliverycode == '') {
						cdtTrfTxInfObj.PmtInfObj.PmtTpInf.SvcLvl.Prtry = '00PY1';
					} else {
						cdtTrfTxInfObj.PmtInfObj.PmtTpInf.SvcLvl.Prtry = '00000';
					}
					cdtTrfTxInfObj.ChqInstr = {};
					cdtTrfTxInfObj.ChqInstr.ChqNb = billPaymentTranId;
					if (objVendor.deliverycode) {
						cdtTrfTxInfObj.ChqInstr.DlvryMtd = {};
						cdtTrfTxInfObj.ChqInstr.DlvryMtd.Cd = objVendor.deliverycode;
					}
				}

				if (paymentMethod == 'DAC') {
					cdtTrfTxInfObj.ChrgBr = 'DEBT';
					// cdtTrfTxInfObj.ChrgBr = (paymentMethod == 'MTS') ? 'CRED' : "";
				} else if (paymentMethod == 'MTS') {
					cdtTrfTxInfObj.ChrgBr = 'DEBT';
				}

				if (paymentMethod == 'DAC' || paymentMethod == 'CHK') {
					cdtTrfTxInfObj.ClrSysId = {};
					cdtTrfTxInfObj.ClrSysId.Cd = 'CACPA';
				}

				tmpAmt = 0; // need to initialize back to 0

				var Strd = [];
				var totalCdtTrfTxInfAmount = 0;

				for (y in arrBills) {
					var billId = arrBills[y];
					var StrdObj = {};
					StrdObj.RfrdDocInf = {};
					StrdObj.RfrdDocInf.Tp = {};
					StrdObj.RfrdDocInf.Tp.CdOrPrtry = {};
					StrdObj.RfrdDocInf.Tp.CdOrPrtry.Cd = 'CINV';

					var netAmt = 0;
					var origAmt = getFloatVal(arrBillAmtOrig[billId]);
					var amt = getFloatVal(arrBillAmt[billId]);

					var discAmt = !isEmpty(arrBillDiscAmt[billId]) ? getFloatVal(arrBillDiscAmt[billId]) : 0;

					// dLog("billId before", billId);
					// dLog("arrBC in y.arrBills before", JSON.stringify(arrBillCredits));
					dLog(
						'values',
						JSON.stringify({
							netAmt: netAmt,
							origAmt: origAmt,
							amt: amt,
							discAmt: discAmt,
							tmpAmt: tmpAmt,
						})
					);

					if (!isEmpty(arrBillCredits[billId])) {
						var arrBC = arrBillCredits[billId];

						dLog('arrBC in y.arrBills', JSON.stringify(arrBC));

						for (bc in arrBC) {
							var billCreditAmtP = getFloatVal(arrBC[bc].bcamt);
							var billCreditAmt = billCreditAmtP * -1;

							// tmpAmt = (tmpAmt - billCreditAmtP);
							netAmt = netAmt - billCreditAmtP;
						}
					}

					// tmpAmt += amt;
					netAmt = origAmt;
					tmpAmt += amt; //used to be netAmt
					totalCdtTrfTxInfAmount += amt; //origAmt;

					if (discAmt > 0) {
						netAmt -= discAmt;
						tmpAmt -= discAmt;
						// totalCdtTrfTxInfAmount -= discAmt;
					}

					dLog('createBOA_ISO_XMLDoc. objBillsData', JSON.stringify(objBillsData[billId]));
					StrdObj.RfrdDocInf.Nb = objBillsData[billId].num; //objBillsData[billId].memo; //billPaymentTranId;

					var invoiceDate = objBillsData[billId].dte;
					StrdObj.RfrdDocInf.RltdDt = formatDate(nlapiStringToDate(invoiceDate));
					StrdObj.RfrdDocAmt = {};
					StrdObj.RfrdDocAmt.DuePyblAmt = {};
					StrdObj.RfrdDocAmt.DscntApldAmt = {};
					StrdObj.RfrdDocAmt.RmtdAmt = {};
					StrdObj.RfrdDocAmt.DuePyblAmt.value = origAmt.toFixed(2);

					if (discAmt == 0) discAmt = '';
					else discAmt = discAmt.toFixed(2);

					StrdObj.RfrdDocAmt.DscntApldAmt.value = discAmt;

					//RSF - Added to make the RmtdAmt the same as DuePyblAmt
					if (!isEmpty(arrBillCredits[billId])) {
						var arrBC = arrBillCredits[billId];
						for (bc in arrBC) {
							var billCreditAmt = getFloatVal(arrBC[bc].bcamt);
							amt += Number(billCreditAmt);
						}
					}

					StrdObj.RfrdDocAmt.RmtdAmt.value = amt.toFixed(2); //netAmt.toFixed(2);

					StrdObj.RfrdDocAmt.DuePyblAmt.Ccy = symbol;
					StrdObj.RfrdDocAmt.DscntApldAmt.Ccy = symbol;
					StrdObj.RfrdDocAmt.RmtdAmt.Ccy = symbol;

					//Add CDtrRefInf
					StrdObj.CdtrRefInf = {};
					StrdObj.CdtrRefInf.Tp = {};
					StrdObj.CdtrRefInf.CdOrPrtry = {};
					StrdObj.CdtrRefInf.CdOrPrtry.Cd = billPaymentTranId; //"CINV";
					// if (objBillsData[billId].memo) {
					//   StrdObj.CdtrRefInf.Ref = objBillsData[billId].memo || '';
					// }
					StrdObj.CdtrRefInf.Ref = billPaymentTranId; //objBillsData[billId].num; //billPaymentTranId;

					Strd.push(StrdObj);

					if (!isEmpty(arrBillCredits[billId])) {
						var arrBC = arrBillCredits[billId];

						for (bc in arrBC) {
							var billCreditAmtP = getFloatVal(arrBC[bc].bcamt);
							var billCreditAmt = billCreditAmtP;

							tmpAmt = tmpAmt - billCreditAmtP;
							netAmt = netAmt - billCreditAmtP;
							// totalCdtTrfTxInfAmount -= billCreditAmtP;

							var StrdObj = {};
							StrdObj.RfrdDocInf = {};
							StrdObj.RfrdDocInf.Tp = {};
							StrdObj.RfrdDocInf.Tp.CdOrPrtry = {};
							StrdObj.RfrdDocInf.Tp.CdOrPrtry.Cd = 'CREN'; //Hardcoded?

							var bcNum = arrBC[bc].bcnum;
							dLog('createJPMXMLDoc', 'VC number : ' + bcNum);
							dLog('arrBC[bc]', JSON.stringify(arrBC));

							if (!isEmpty(bcNum)) StrdObj.RfrdDocInf.Nb = bcNum;
							else if (!isEmpty(arrBillCredits[billId].bcmemo)) {
								StrdObj.RfrdDocInf.Nb = arrBillCredits[billId].bcmemo;
							}

							var invoiceDate = objBillsData[billId].dte;
							StrdObj.RfrdDocInf.RltdDt = formatDate(nlapiStringToDate(arrBC[bc].bcdate));

							StrdObj.RfrdDocAmt = {};
							StrdObj.RfrdDocAmt.CdtNoteAmt = {};
							StrdObj.RfrdDocAmt.DuePyblAmt = null;
							StrdObj.RfrdDocAmt.DscntApldAmt = null;
							StrdObj.RfrdDocAmt.RmtdAmt = null;

							// StrdObj.RfrdDocAmt.DuePyblAmt.value = (billCreditAmt).toFixed(2);
							// if (discAmt==0)
							// 	discAmt = '';
							// else
							// 	discAmt = discAmt.toFixed(2);

							// StrdObj.RfrdDocAmt.DscntApldAmt.value = discAmt;
							StrdObj.RfrdDocAmt.CdtNoteAmt.value = billCreditAmt.toFixed(2);
							StrdObj.RfrdDocAmt.CdtNoteAmt.Ccy = symbol;

							// StrdObj.RfrdDocAmt.DuePyblAmt.Ccy = symbol;
							// StrdObj.RfrdDocAmt.DscntApldAmt.Ccy = symbol;
							// if (arrBC[bc].bcmemo) {
							//   StrdObj.CdtrRefInf = {};
							//   StrdObj.CdtrRefInf.Ref = arrBC[bc].bcmemo;
							// }
							StrdObj.CdtrRefInf = {};
							StrdObj.CdtrRefInf.Ref = billPaymentTranId; //objBillsData[billId].num; //

							Strd.push(StrdObj);
						}
					}

					dLog(
						'Amounts in loop=' + y,
						JSON.stringify({
							totalAmount: totalAmount,
							totalCdtTrfTxInfAmount: totalCdtTrfTxInfAmount,
							netAmt: netAmt,
							tmpAmt: tmpAmt,
						})
					);
				}

				dLog('createBOA_ISO_XMLDoc.Strd2', JSON.stringify(Strd));

				noOfBillPayments = noOfBillPayments + 1;
				totalAmount += Number(totalCdtTrfTxInfAmount);
				dLog(
					'Amounts',
					JSON.stringify({
						totalAmount: totalAmount,
						totalCdtTrfTxInfAmount: totalCdtTrfTxInfAmount,
						netAmt: netAmt,
						tmpAmt: tmpAmt,
					})
				);

				cdtTrfTxInfObj.Amt = {};
				cdtTrfTxInfObj.Amt.value = totalCdtTrfTxInfAmount.toFixed(2); //netAmt.toFixed(2); //tmpAmt.toFixed(2); //netAmt.toFixed(2); //tmpAmt.toFixed(2); //amt.toFixed(2);
				cdtTrfTxInfObj.Amt.Ccy = symbol;

				if (paymentMethod == 'DAC' || paymentMethod == 'MTS') {
					cdtTrfTxInfObj.CdtrAgt = {};
					cdtTrfTxInfObj.CdtrAgt.FinInstnId = {};
					// cdtTrfTxInfObj.CdtrAgt.FinInstnId.BIC = objVendor.recbankprimid;
					cdtTrfTxInfObj.CdtrAgt.FinInstnId.ClrSysMmbId = {};
					cdtTrfTxInfObj.CdtrAgt.FinInstnId.ClrSysMmbId.MmbId = objVendor.recbankprimid; // Receiving Bank Routing
					cdtTrfTxInfObj.CdtrAgt.FinInstnId.Nm = objVendor.vbankname || 'custrecord_bankname';

					if (objVendor.vbankaddrs1 || objVendor.vbankzip || objVendor.vbankcity || objVendor.vbankstate) {
						cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr = {};
						cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.Ctry = countryCodeMapping[objVendor.vbankcountry];

            if (paymentMethod!='MTS') {
              cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.AdrLine = objVendor.vbankaddrs1;
              cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.StrtNm = objVendor.vbankaddrs1;
              cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.PstCd = objVendor.vbankzip;
              cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.TwnNm = objVendor.vbankcity;
              cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.BldgNb = '';
              cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.CtrySubDvsn = objVendor.vbankstate;  
            }
					}

				}

				cdtTrfTxInfObj.Cdtr = {};
				cdtTrfTxInfObj.Cdtr.Nm = objVendor.vendorname;

				if (paymentMethod != 'DAC') {
					if (objVendor.vendoraddrs1 || objVendor.vendoraddrs2 || objVendor.vendorpostal || objVendor.vendorcity || objVendor.vendorstateprovince || countryCodeMapping[objVendor.vendorcountrycode]) {
						dLog(
							'Vendor Address',
							JSON.stringify({
								addr1: objVendor.vendoraddrs1,
								addr2: objVendor.vendoraddrs2,
								postal: objVendor.vendorpostal,
								city: objVendor.vendorcity,
								vsp: objVendor.vendorstateprovince,
								countrycode: objVendor.vendorcountrycode,
								countryCodeMapping: countryCodeMapping[objVendor.vendorcountrycode],
							})
						);
						cdtTrfTxInfObj.Cdtr.PstlAdr = {};
						cdtTrfTxInfObj.Cdtr.PstlAdr.StrtNm = objVendor.vendoraddrs1;
						cdtTrfTxInfObj.Cdtr.PstlAdr.BldgNb = objVendor.vendoraddrs2 || '';
						cdtTrfTxInfObj.Cdtr.PstlAdr.PstCd = objVendor.vendorpostal;
						cdtTrfTxInfObj.Cdtr.PstlAdr.TwnNm = objVendor.vendorcity;
						cdtTrfTxInfObj.Cdtr.PstlAdr.CtrySubDvsn = objVendor.vendorstateprovince;
						cdtTrfTxInfObj.Cdtr.PstlAdr.Ctry = countryCodeMapping[objVendor.vendorcountrycode];
					}
				} else {
					cdtTrfTxInfObj.Cdtr.PstlAdr = null;
				}

				if (paymentMethod == 'DAC' || paymentMethod == 'MTS') {
					cdtTrfTxInfObj.CdtrAcct = {};
					cdtTrfTxInfObj.CdtrAcct.Id = {};
					cdtTrfTxInfObj.CdtrAcct.Id.Othr = {};
					cdtTrfTxInfObj.CdtrAcct.Id.Othr.Id = objVendor.recpartyaccount;

					if (paymentMethod == 'DAC') {
						cdtTrfTxInfObj.CdtrAcct.Tp = {};
						cdtTrfTxInfObj.CdtrAcct.Tp.Cd = 'CACC';
					}
				}
        if (paymentMethod == 'MTS') {
          cdtTrfTxInfObj.InstrForCdtrAgt = {};
          cdtTrfTxInfObj.InstrForCdtrAgt.InstrInf = objVendor.custentity_ica_vendor_bank_instructions;
        }


				// cdtTrfTxInfObj.RltdAmtInf = {};
				// cdtTrfTxInfObj.RltdAmtInf.RmtLctnMtd = objVendor.pmp_dac_contactname || "";
				// cdtTrfTxInfObj.RltdAmtInf.RmtLctnElctrncAdr = objVendor.pmp_dac_emailaddress || "";
				if (paymentMethod == 'CHK') {
					dLog('objVendor.custentity_ica_vendor_bank_instructions', objVendor.custentity_ica_vendor_bank_instructions);
					cdtTrfTxInfObj.RmtInf = {};
					cdtTrfTxInfObj.RmtInf.Ustrd = objVendor.custentity_ica_vendor_bank_instructions; //
					cdtTrfTxInfObj.RmtInf.Strd = Strd;
				}
				// dLog("cdtTrfTxInfObj", JSON.stringify(cdtTrfTxInfObj));
				CdtTrfTxInf.push(cdtTrfTxInfObj);
			}

			dLog(
				'About to add totalAmount',
				JSON.stringify({
					totalAmount: totalAmount,
				})
			);

			PmtInfObj.NbOfTxs = noOfBillPayments;
			PmtInfObj.CtrlSum = totalAmount.toFixed(2);
			totalNbOfTxs += Number(noOfBillPayments);
			totalCtrlSum += Number(totalAmount);
			PmtInfObj.CdtTrfTxInf = CdtTrfTxInf;
			PmtInf.push(PmtInfObj);
		}
	}

	objects.NbOfTxs = totalNbOfTxs; //grpHdrNbOfTxs;
	objects.CtrlSum = totalCtrlSum.toFixed(2); //grpHdrCtrlSum.toFixed(2); // Do we comment this out?
	objects.PmtInf = PmtInf;
	// objects.CdtTrfTxInf = CdtTrfTxInf;
	// dLog("objects.PmtInf", JSON.stringify(objects.PmtInf));
	// dLog('objects.CdtTrfTxInf', JSON.stringify(objects.CdtTrfTxInf));

	var fileId = nlapiSearchRecord('file', null, [['name', 'is', 'ica_boa_iso.xml']], []);
	if (fileId != null) {
		fileId = fileId[0].getId();
	}

	var tmplFile = nlapiLoadFile(fileId);

	var template = Handlebars.compile(tmplFile.getValue());
	var xmlDoc = template(objects);

	dLog('xmlDoc', xmlDoc);
	return xmlDoc;
}


function createBMO_ISO_XMLDoc(objAcctMapping) {
	var arrTempBillIds = [];
	var arrBillCRIds = [];
	var arrBillAmt = [];
	var arrBillAmtOrig = [];
	var arrBillDiscAmt = [];
	var arrBillPayInfoCtr = [];
	var arrBillPayInfoSum = [];
	var arrGrpHdrNbOfTxs = [];
	var arrPmtInfNbOfTxs = [];
	var arrBillIds = [];
	var grpHdrNbOfTxs = 0;
	var grpHdrCtrlSum = 0;
	var arrPayeeIds = [];
	var _currencies = getCurrencies();

	for (x in arrBillsProcessed) {
		var billId = arrBillsProcessed[x].id;
		var billPaymentId = arrBillsProcessed[x].payment;

		dLog('createBMO_ISO_XMLDoc', 'Bill info = ' + JSON.stringify(arrBillsProcessed[x]));
		if (!isEmpty(billPaymentId) && billPaymentId != 'XXXNONEXXX' && billPaymentId != 'CREDIT') {
			if (billPaymentId != 'CREDIT') arrTempBillIds.push(billId);

			var payMethod = arrBillsProcessed[x].paymethod;
			var paymentId = arrBillsProcessed[x].payment;
			var payeeId = arrBillsProcessed[x].payeeid;

			arrBillAmtOrig[billId] = arrBillsProcessed[x].origamt;
			// arrBillAmt[billId] = arrBillsProcessed[x].pay;
			arrBillAmt[billId] = arrBillsProcessed[x].payamt;
			arrBillDiscAmt[billId] = arrBillsProcessed[x].discamt;

			var ndx = payMethod + '@@' + paymentId;

			if (arrBillPayInfoCtr[payMethod] == null) arrBillPayInfoCtr[payMethod] = 0;
			if (arrBillPayInfoSum[payMethod] == null) arrBillPayInfoSum[payMethod] = 0;
			if (arrPmtInfNbOfTxs[ndx] == null) arrPmtInfNbOfTxs[ndx] = 0;

			if (paymentId && arrGrpHdrNbOfTxs[paymentId] == null) grpHdrNbOfTxs++;

			arrPmtInfNbOfTxs[ndx]++;
			arrBillPayInfoCtr[payMethod]++;
			arrBillPayInfoSum[payMethod] += getFloatVal(arrBillsProcessed[x].payamt);
			arrGrpHdrNbOfTxs[paymentId] = paymentId;
		}
		grpHdrCtrlSum += getFloatVal(arrBillsProcessed[x].payamt);
		if (billPaymentId == 'CREDIT') arrBillCRIds.push(billId);
	}

	var arrBillIds = [];
	var arrBillIds2 = [];
	var arrBillIds3 = [];
	var arrBillIds4 = [];
	var arrBillIds5 = [];

	for (vx in arrTempBillIds) {
		var isBC = false;
		for (var x in arrBillCRIds) {
			if (arrTempBillIds[vx] == arrBillCRIds[x]) {
				isBC = true;
				break;
			}
		}
		if (!isBC) {
			arrBillIds.push(arrTempBillIds[vx]);
			arrBillIds2.push(arrTempBillIds[vx]);
			arrBillIds3.push(arrTempBillIds[vx]);
			arrBillIds4.push(arrTempBillIds[vx]);
			arrBillIds5.push(arrTempBillIds[vx]);
		}
	}

	var arrBillCredits = getBillCredit(arrBillIds);
	var objBillsData = getBillData(arrBillIds2);
	var arrBillPO = getPOMap(arrBillIds3);
	var arrVendorBills = getPayeeBillsByPayMethod(arrBillIds4);
	var arrVendorBillsCurr = getPayeeBillsCurrency(arrBillIds5);
	var nsAcctSub = !isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('subsidiary', 'CUSTRECORD_ACCT_MAP_NETSUITE_ACCOUNT')) ? objAcctMapping[0].getValue('subsidiary', 'CUSTRECORD_ACCT_MAP_NETSUITE_ACCOUNT') : '';
	// var nsAcctSub
	var objVDCRecResults = getVendorDAC_CCRPaymentRec(nsAcctSub);
	dLog('objVDCRecResults', JSON.stringify(objVDCRecResults));
	dLog('objAcctMapping', JSON.stringify(objAcctMapping));

	//Gather data.

	var objects = {
		MsgId: 'TBD',
		CreDtTm: 'Test',
		Authstn: {
			Cd: '',
		},
		NbOfTxs: '2',
		CtrlSum: '2000',
		InitgPty: {
			Nm: 'Name',
			Id: {
				OrgId: {
					Othr: {
						Id: '',
					},
				},
			},
		},
		PmtInfId: 'PmtInfId',
		PmtMtd: 'PmtMtd',
		PmtTpInf: {
			SvcLvl: {
				Cd: 'This is CD',
			},
			LclInstrm: {
				Cd: 'This is CD',
			},
		},
		ReqdExctnDt: 'ReqdExctnDt',
		Dbtr: {
			Nm: 'This is Nm',
			PstlAdr: {
				StrtNm: '',
				BldgNb: '',
				PstCd: '',
				TwnNm: '',
				CtrySubDvsn: '',
				Ctry: '',
			},
			Id: {
				Othr: {
					Id: 'Dbtr.Id.Othr.Id',
				},
			},
		},
		DbtrAcct: {
			Id: {
				Othr: {
					Id: 'DbtrAcct.Id.Othr.Id',
				},
			},
			PstlAdr: {
				StrtNm: '',
				BldgNb: '',
				PstCd: '',
				TwnNm: '',
				CtrySubDvsn: '',
				Ctry: '',
			},
		},
		DbtrAgt: {
			FinInstnId: {
				BIC: 'BIC',
				PstlAdr: {
					StrtNm: '',
					BldgNb: '',
					PstCd: '',
					TwnNm: '',
					CtrySubDvsn: '',
					Ctry: '',
				},
			},
		},
		CdtTrfTxInf: CdtTrfTxInf,
	};

	var PmtInf = [];

	for (x in arrVendorBills) {
		var payeeId = x.split('X@X')[1];
		arrPayeeIds.push(payeeId);
	}

	var arrVendors = getEntityData(arrPayeeIds);

	var today = new Date();
	var bpmdate = BPM_DATE;
	var d = nlapiStringToDate(bpmdate, 'datetime');

	var fileCtrlNumber = moment(today).format('MMDDhhmmss');
	objects.MsgId = pad(fileCtrlNumber, 4);
	objects.CreDtTm = moment(d).format('YYYY-MM-DDThh:mm:ss') || today.format('{yyyy}-{MM}-{dd}T{hh}:{mm}:{ss}');

	objects.Authstn.Cd = 'AUTH';

	if (objects.CtrlSum == '0.00') {
		dLog('CtrlSum is 0.00, this should not happen. Returning empty file', objects.CtrlSum);
		return '';
	}

	if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ceo_company_id'))) {
		objects.InitgPty.Id.OrgId.Othr.Id = objAcctMapping[0].getValue('custrecord_acct_map_ceo_company_id'); //CEO ID
	}

	var totalNbOfTxs = 0;
	var totalCtrlSum = 0;

	dLog('BMO ISO: arrBillPayInfoCtr', JSON.stringify(arrBillPayInfoCtr));
	for (x in arrBillPayInfoCtr) {
		//CdtTrfTxInf loop starts here.
		var CdtTrfTxInf = [];

		if (SINGLEBILLPYMTS == 'T') {
			dAudit('Create Single Bill Payments here.', JSON.stringify(arrBillsProcessed));
			var PmtInfObj = {};

			PmtInfObj.PmtInfId = fileCtrlNumber;
			var paymentMethod = x;
			PmtInfObj.PmtMtd = 'TRF';

			// objects.PmtTpInf.SvcLvl.Cd = (paymentMethod == 'DAC') ? 'NURG' : 'URGP';
			PmtInfObj.PmtTpInf = {};
			PmtInfObj.PmtTpInf.SvcLvl = {};
			PmtInfObj.PmtTpInf.SvcLvl.Prtry = paymentMethod == 'DAC' ? 'NORM' : 'URGP';
			PmtInfObj.ReqdExctnDt = moment(d).format('YYYY-MM-DD') || today.format('{yyyy}-{MM}-{dd}');

			if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_companyname'))) {
				PmtInfObj.Dbtr = {};
				PmtInfObj.Dbtr.Nm = objVDCRecResults[0].getValue('custrecord_companyname');
			}

			//PstlAdr
			var country = !isEmpty(objVDCRecResults) ? objVDCRecResults[0].getValue('custrecord_compcountrycode') : '';

			if (
				(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_comppostcode'))) ||
				(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compcity'))) ||
				(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compstateprov'))) ||
				(!isEmpty(objVDCRecResults) && objVDCRecResults[0].getValue('custrecord_compcountrycode')) ||
				(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compadd1')))
			) {
				PmtInfObj.Dbtr = {};
				PmtInfObj.Dbtr.PstlAdr = {};
				if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compadd1'))) {
					PmtInfObj.Dbtr.PstlAdr.StrtNm = '<AdrLine>' + objVDCRecResults[0].getValue('custrecord_compadd1') + '</AdrLine>';
				}
				if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compadd2'))) {
					PmtInfObj.Dbtr.PstlAdr.BldgNb = '<BldgNb>' + objVDCRecResults[0].getValue('custrecord_compadd2') + '</BldgNb>';
				}

				if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_comppostcode'))) {
					PmtInfObj.Dbtr.PstlAdr.PstCd = '<PstCd>' + objVDCRecResults[0].getValue('custrecord_comppostcode') + '</PstCd>';
				}
				// addTextNodeFromParentNode(xmlDoc, pstlAdr, 'PstCd', objVDCRecResults[0].getValue('custrecord_comppostcode'));

				if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compcity'))) {
					PmtInfObj.Dbtr.PstlAdr.TwnNm = '<TwnNm>' + objVDCRecResults[0].getValue('custrecord_compcity') + '</TwnNm>';
				}
				// addTextNodeFromParentNode(xmlDoc, pstlAdr, 'TwnNm', objVDCRecResults[0].getValue('custrecord_compcity'));

				//Where do we get CtrySubDvsn?
				// if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue("custrecord_compstateprov"))) {
				// 	PmtInfObj.Dbtr.PstlAdr.TwnNm = "<CtrySubDvsn>" + objVDCRecResults[0].getValue("custrecord_compstateprov") + "</CtrySubDvsn>";
				// }

				// addTextNodeFromParentNode(xmlDoc, pstlAdr, 'Ctry', country);
				if (country) {
					PmtInfObj.Dbtr.PstlAdr.Ctry = '<Ctry>' + country + '</Ctry>';
				}
			}

			PmtInfObj.Dbtr.Id = {};
			PmtInfObj.Dbtr.Id.Othr = {};
			if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_dom_ach_co_id'))) {
				PmtInfObj.Dbtr.Id.Othr.Id = objAcctMapping[0].getValue('custrecord_acct_map_dom_ach_co_id'); //ACH Company ID
			}

			//DbtrAcct
			PmtInfObj.DbtrAcct = {};
			PmtInfObj.DbtrAcct.Id = {};
			PmtInfObj.DbtrAcct.Id.Othr = {};
			if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_origin_acc'))) {
				PmtInfObj.DbtrAcct.Id.Othr.Id = objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_origin_acc'); // Bank Account Number

				var symbol = '';
				try {
					symbol = _.find(_currencies, { internalid: String(objAcctMapping[0].getValue('custrecord_acct_map_account_currency')) }).symbol;
					PmtInfObj.DbtrAcct.Ccy = symbol; //objAcctMapping[0].getValue('custrecord_acct_map_account_currency') || ''; // Bank Currency
					dAudit('DbtrAcct.Ccy', objAcctMapping[0].getValue('custrecord_acct_map_account_currency'));
					dAudit('DbtrAcct.Ccy', JSON.stringify(_currencies));
				} catch (e) {}
			}

			//DbtrAgt
			if ((!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id'))) || !isEmpty(country)) {
				if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id'))) {
					// objects.DbtrAgt.FinInstnId.BIC = objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id');

					PmtInfObj.DbtrAgt = {};
					PmtInfObj.DbtrAgt.Nm = objVDCRecResults[0].getValue('custrecord_bankname') || '';
					PmtInfObj.DbtrAgt.FinInstnId = {};
					PmtInfObj.DbtrAgt.FinInstnId.ClrSysMmbId = {};
					PmtInfObj.DbtrAgt.FinInstnId.ClrSysMmbId.MmbId = objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id'); // Routing Number 10 Digit
				}
				PmtInfObj.DbtrAgt.FinInstnId.PstlAdr = {};
				PmtInfObj.DbtrAgt.FinInstnId.PstlAdr.Ctry = 'CA';
			}

			for (var i = 0; i < arrBillsProcessed.length; i++) {
				// objects.PmtInfId = fileCtrlNumber;
				// var paymentMethod = x;
				// objects.PmtMtd = 'TRF';

				// // objects.PmtTpInf.SvcLvl.Cd = (paymentMethod == 'DAC') ? 'NURG' : 'URGP';
				// objects.PmtTpInf.SvcLvl = {};
				// objects.PmtTpInf.SvcLvl.Prtry = (paymentMethod == 'DAC') ? 'NORM' : 'URGP';
				// objects.ReqdExctnDt = moment(d).format('YYYY-MM-DD') || today.format('{yyyy}-{MM}-{dd}');

				// if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_companyname')))
				//         objects.Dbtr.Nm = objVDCRecResults[0].getValue('custrecord_companyname');

				// //PstlAdr
				// var country = (!isEmpty(objVDCRecResults)) ? objVDCRecResults[0].getValue('custrecord_compcountrycode') : '';

				// if ((!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_comppostcode')))
				//                 || (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compcity')))
				//                 || (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compstateprov')))
				//                 || (!isEmpty(objVDCRecResults) && objVDCRecResults[0].getValue('custrecord_compcountrycode'))
				//                 || (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compadd1')))) {

				//         if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compadd1'))) {
				//                 objects.Dbtr.PstlAdr.StrtNm = "<AdrLine>" + objVDCRecResults[0].getValue('custrecord_compadd1') + "</AdrLine>";
				//         }
				//         if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compadd2'))) {
				//                 objects.Dbtr.PstlAdr.BldgNb = "<BldgNb>" + objVDCRecResults[0].getValue('custrecord_compadd2') + "</BldgNb>";
				//         }

				//         if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_comppostcode'))) {
				//                 objects.Dbtr.PstlAdr.PstCd = "<PstCd>" + objVDCRecResults[0].getValue('custrecord_comppostcode') + "</PstCd>";
				//         }
				//                 // addTextNodeFromParentNode(xmlDoc, pstlAdr, 'PstCd', objVDCRecResults[0].getValue('custrecord_comppostcode'));

				//         if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compcity'))) {
				//                 objects.Dbtr.PstlAdr.TwnNm = "<TwnNm>" + objVDCRecResults[0].getValue('custrecord_compcity') + "</TwnNm>";
				//         }
				//                 // addTextNodeFromParentNode(xmlDoc, pstlAdr, 'TwnNm', objVDCRecResults[0].getValue('custrecord_compcity'));

				//         //Where do we get CtrySubDvsn?
				//         if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compstateprov'))) {
				//                 objects.Dbtr.PstlAdr.TwnNm = "<CtrySubDvsn>" + objVDCRecResults[0].getValue('custrecord_compstateprov') + "</CtrySubDvsn>";
				//         }

				//         // addTextNodeFromParentNode(xmlDoc, pstlAdr, 'Ctry', country);
				//         if (country) {
				//                 objects.Dbtr.PstlAdr.Ctry = "<Ctry>" + country + "</Ctry>";
				//         }
				//         dLog('Added Ctry', JSON.stringify(objects) );

				//         // addTextNodeFromParentNode(xmlDoc, pstlAdr, 'AdrLine', objVDCRecResults[0].getValue('custrecord_compadd1'));
				//         // objects.Dbtr.PstlAdr.BldgNb = '2'; not used
				// }

				// if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_dom_ach_co_id'))) {
				//         objects.Dbtr.Id = {};
				//         objects.Dbtr.Id.Othr = {};
				//         objects.Dbtr.Id.Othr.Id = objAcctMapping[0].getValue('custrecord_acct_map_dom_ach_co_id'); //ACH Company ID
				// }

				// //DbtrAcct
				// if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_origin_acc'))) {
				//         objects.DbtrAcct = {};
				//         objects.DbtrAcct.Id = {};
				//         objects.DbtrAcct.Id.Othr = {};
				//         objects.DbtrAcct.Id.Othr.Id = objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_origin_acc'); // Bank Account Number

				//         var symbol = '';
				//         try {
				//                 symbol = _.find(_currencies, {"internalid" : String(objAcctMapping[0].getValue('custrecord_acct_map_account_currency'))}).symbol;
				//                 objects.DbtrAcct.Ccy = symbol; //objAcctMapping[0].getValue('custrecord_acct_map_account_currency') || ''; // Bank Currency
				//                 dAudit('DbtrAcct.Ccy', objAcctMapping[0].getValue('custrecord_acct_map_account_currency'));
				//                 dAudit('DbtrAcct.Ccy', JSON.stringify(_currencies));
				//         } catch(e) {}

				// }

				// //DbtrAgt
				// if ((!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id'))) || !isEmpty(country)) {
				//         if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id'))) {
				//                 // objects.DbtrAgt.FinInstnId.BIC = objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id');

				//                 objects.DbtrAgt = {};
				//                 objects.DbtrAgt.Nm = objVDCRecResults[0].getValue('custrecord_bankname') || "";
				//                 objects.DbtrAgt.FinInstnId = {};
				//                 objects.DbtrAgt.FinInstnId.ClrSysMmbId = {};
				//                 objects.DbtrAgt.FinInstnId.ClrSysMmbId.MmbId = objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id'); // Routing Number 10 Digit
				//         }
				//         objects.DbtrAgt.FinInstnId.PstlAdr = {};
				//         objects.DbtrAgt.FinInstnId.PstlAdr.Ctry = 'CA';
				// }

				var billPayment = arrBillsProcessed[i];

				if (billPayment.payment == 'CREDIT') {
					continue;
				}

				var symbol = '';

				try {
					symbol = _.find(_currencies, { internalid: String(billPayment.currid) }).symbol;
				} catch (e) {}

				var objVendor = arrVendors[billPayment.payeeid];
				if (!objVendor) objVendor = _.find(arrVendors, { internalid: String(billPayment.payeeid) });

				dLog('objVendor', JSON.stringify(objVendor));

				var cdtTrfTxInfObj = {};
				cdtTrfTxInfObj.PmtId = {};

				var refnum = billPayment.refnum; //arrBillPaymentMap[billPayment.payeeid];
				// var refnum = billPayment.billnum; //arrBillPaymentMap[billPayment.payeeid];
				var instrId = '';
				if (refnum.length > 12) {
					instrId = pz(refnum.substring(refnum.length - 12, refnum.length), 12);
				} else {
					instrId = pz(refnum, 12);
				}
				refnum = billPayment.billnum; //Overwrite endToendID
				var endToEndId = refnum;
				if (refnum.length > 18) {
					endToEndId = refnum.substr(0, 18);
				}

				endToEndId = moment(d).format('YYYY-MM-DDThh:mm:ss');

				cdtTrfTxInfObj.PmtId.InstrId = instrId;
				cdtTrfTxInfObj.PmtId.EndToEndId = endToEndId;
				cdtTrfTxInfObj.Amt = {};
				cdtTrfTxInfObj.Amt.value = billPayment.payamt; //amt.toFixed(2);
				cdtTrfTxInfObj.Amt.Ccy = symbol;
				cdtTrfTxInfObj.ChrgBr = billPayment.paymethod == 'MTS' ? 'CRED' : '';

				cdtTrfTxInfObj.CdtrAgt = {};
				cdtTrfTxInfObj.CdtrAgt.FinInstnId = {};
				// cdtTrfTxInfObj.CdtrAgt.FinInstnId.BIC = objVendor.recbankprimid;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.ClrSysMmbId = {};
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.ClrSysMmbId.MmbId = objVendor.recbankprimid; //objVendor.bankid; // Receiving Bank Routing
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.Nm = objVendor.vbankname;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr = {};
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.Ctry = countryCodeMapping[objVendor.vbankcountry];
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.AdrLine = objVendor.vbankaddrs1;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.StrtNm = objVendor.vbankaddrs1;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.BldgNb = '';
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.PstCd = objVendor.vbankzip;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.TwnNm = objVendor.vbankcity;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.CtrySubDvsn = objVendor.vbankstate;

				if (billPayment.paymethod == 'MTS') {
					cdtTrfTxInfObj.CdtrAgt.InstrForCdtrAgt = {};
					cdtTrfTxInfObj.CdtrAgt.InstrForCdtrAgt.InstrInf = objVendor.custentity_ica_vendor_bank_instructions;
				}

				cdtTrfTxInfObj.Cdtr = {};
				cdtTrfTxInfObj.Cdtr.Nm = objVendor.vendorname;
				cdtTrfTxInfObj.Cdtr.PstlAdr = {};
				cdtTrfTxInfObj.Cdtr.PstlAdr.StrtNm = objVendor.vendoraddrs1;
				cdtTrfTxInfObj.Cdtr.PstlAdr.BldgNb = objVendor.vendoraddrs2 || '';
				cdtTrfTxInfObj.Cdtr.PstlAdr.PstCd = objVendor.vendorpostal;
				cdtTrfTxInfObj.Cdtr.PstlAdr.TwnNm = objVendor.vendorcity;
				cdtTrfTxInfObj.Cdtr.PstlAdr.CtrySubDvsn = objVendor.vendorstateprovince;
				cdtTrfTxInfObj.Cdtr.PstlAdr.Ctry = countryCodeMapping[objVendor.vendorcountrycode];

				cdtTrfTxInfObj.CdtrAcct = {};
				cdtTrfTxInfObj.CdtrAcct.Id = {};
				cdtTrfTxInfObj.CdtrAcct.Id.Othr = {};
				cdtTrfTxInfObj.CdtrAcct.Id.Othr.Id = objVendor.recpartyaccount;

				// cdtTrfTxInfObj.RltdAmtInf = {};
				// cdtTrfTxInfObj.RltdAmtInf.RmtLctnMtd = objVendor.pmp_dac_contactname || "";
				// cdtTrfTxInfObj.RltdAmtInf.RmtLctnElctrncAdr = objVendor.pmp_dac_emailaddress || "";
				cdtTrfTxInfObj.RmtInf = {};
				cdtTrfTxInfObj.RmtInf.Ustrd = refnum;
				cdtTrfTxInfObj.RmtInf.VendorId = objVendor.entityid;
				cdtTrfTxInfObj.RmtInf.Category = objVendor.category;

				cdtTrfTxInfObj.RmtInf.Strd = Strd;

				CdtTrfTxInf.push(cdtTrfTxInfObj);
			}
			PmtInfObj.CdtTrfTxInf = CdtTrfTxInf;
			PmtInf.push(PmtInfObj);
		} else {
			dAudit('arrVendorBills', arrVendorBills);
			var refnum = '';
			var currency = '';
			var symbol = '';
			var PmtInfObj = {};
			var fileCtrlNumber = Date.create().format('{yy}{MM}{dd}{mm}{ss}');
			PmtInfObj.PmtInfId = fileCtrlNumber;
			var paymentMethod = x;
			if (paymentMethod == 'CHK') {
				PmtInfObj.PmtMtd = 'CHK';
			} else {
				PmtInfObj.PmtMtd = 'TRF';
			}

			// objects.PmtTpInf.SvcLvl.Cd = (paymentMethod == 'DAC') ? 'NURG' : 'URGP';
			if (paymentMethod == 'DAC') {
				PmtInfObj.PmtTpInf = {};
				PmtInfObj.PmtTpInf.SvcLvl = {};

				if (paymentMethod == 'DAC') {
					PmtInfObj.PmtTpInf.SvcLvl.Cd = 'NURG';
				} else if (paymentMethod == 'CHK') {
					PmtInfObj.PmtTpInf.SvcLvl.Prtry = 'PM';
				} 
			} else if (paymentMethod =='MTS') {
				PmtInfObj.PmtTpInf = {};
				PmtInfObj.PmtTpInf.LclInstrm = {};
				PmtInfObj.PmtTpInf.LclInstrm.Prtry = 'SWT';

				PmtInfObj.PmtTpInf = {};
				PmtInfObj.PmtTpInf.SvcLvl = {};
        PmtInfObj.PmtTpInf.SvcLvl.Cd = 'URGP';
      } else if (paymentMethod == 'CHK') {
				PmtInfObj.PmtTpInf = {};
				PmtInfObj.PmtTpInf.LclInstrm = {};
				PmtInfObj.PmtTpInf.LclInstrm.Prtry = 'CHK';
			}

			PmtInfObj.ReqdExctnDt = moment(d).format('YYYY-MM-DD') || today.format('{yyyy}-{MM}-{dd}');

			dAudit('objVDCRecResults', JSON.stringify(objVDCRecResults));
			if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_companyname'))) {
				PmtInfObj.Dbtr = {};
				PmtInfObj.Dbtr.Nm = objVDCRecResults[0].getValue('custrecord_companyname');
				objects.CompanyName = objVDCRecResults[0].getValue('custrecord_companyname');
				dLog('Added Nm', objVDCRecResults[0].getValue('custrecord_companyname'));
			}

			//PstlAdr
			var country = !isEmpty(objVDCRecResults) ? objVDCRecResults[0].getValue('custrecord_compcountrycode') : '';

			if (
				(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_comppostcode'))) ||
				(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compcity'))) ||
				(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compstateprov'))) ||
				(!isEmpty(objVDCRecResults) && objVDCRecResults[0].getValue('custrecord_compcountrycode')) ||
				(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compadd1')))
			) {
				PmtInfObj.Dbtr.PstlAdr = {};

				if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compadd1'))) {
					PmtInfObj.Dbtr.PstlAdr.StrtNm = '<StrtNm>' + objVDCRecResults[0].getValue('custrecord_compadd1') + '</StrtNm>';
				}
				if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compadd2'))) {
					PmtInfObj.Dbtr.PstlAdr.BldgNb = '<BldgNb>' + objVDCRecResults[0].getValue('custrecord_compadd2') + '</BldgNb>';
				}

				if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_comppostcode'))) {
					PmtInfObj.Dbtr.PstlAdr.PstCd = '<PstCd>' + objVDCRecResults[0].getValue('custrecord_comppostcode') + '</PstCd>';
				}
				// addTextNodeFromParentNode(xmlDoc, pstlAdr, 'PstCd', objVDCRecResults[0].getValue('custrecord_comppostcode'));

				if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compcity'))) {
					PmtInfObj.Dbtr.PstlAdr.TwnNm = '<TwnNm>' + objVDCRecResults[0].getValue('custrecord_compcity') + '</TwnNm>';
				}
				// addTextNodeFromParentNode(xmlDoc, pstlAdr, 'TwnNm', objVDCRecResults[0].getValue('custrecord_compcity'));

				//Where do we get CtrySubDvsn?
				if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compstateprov'))) {
					PmtInfObj.Dbtr.PstlAdr.CtrySubDvsn = '<CtrySubDvsn>' + objVDCRecResults[0].getValue('custrecord_compstateprov') + '</CtrySubDvsn>';
				}

				// addTextNodeFromParentNode(xmlDoc, pstlAdr, 'Ctry', country);
				if (country) {
					PmtInfObj.Dbtr.PstlAdr.Ctry = '<Ctry>' + country + '</Ctry>';
				}
			}

			if (paymentMethod == 'DAC') {
				PmtInfObj.Dbtr.Id = {};
				PmtInfObj.Dbtr.Id.Othr = {};
				PmtInfObj.Dbtr.Id.OrgId = {};
				PmtInfObj.Dbtr.Id.OrgId.Othr = {};
				if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_dom_ach_co_id'))) {
					PmtInfObj.Dbtr.Id.Othr.Id = objAcctMapping[0].getValue('custrecord_acct_map_dom_ach_co_id'); //ACH Company ID
					PmtInfObj.Dbtr.Id.OrgId.Othr.Id = objAcctMapping[0].getValue('custrecord_acct_map_dom_ach_co_id'); //ACH Company ID
				}

				// if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue("custrecord_acct_map_ceo_company_id"))) {
				// 	PmtInfObj.Dbtr.Id.OrgId.Othr.Id = objAcctMapping[0].getValue("custrecord_acct_map_ceo_company_id");
				// }
				// if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue("custrecord_acct_map_ceo_company_id"))) {
				// 	PmtInfObj.Dbtr.Id.OrgId.Othr.Id = objAcctMapping[0].getValue("custrecord_acct_map_ceo_company_id");
				// }

				if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_bankname'))) {
					PmtInfObj.Dbtr.Id.OrgId.Othr.SchmeNm = {};
					PmtInfObj.Dbtr.Id.OrgId.Othr.SchmeNm.Cd = objVDCRecResults[0].getValue('custrecord_bankname');
				}
			}

			//DbtrAcct
			PmtInfObj.DbtrAcct = {};
			PmtInfObj.DbtrAcct.Id = {};
			PmtInfObj.DbtrAcct.Id.Othr = {};
			if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_origin_acc'))) {
				PmtInfObj.DbtrAcct.Id.Othr.Id = objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_origin_acc'); // Bank Account Number

				var symbol = '';
				try {
					symbol = _.find(_currencies, { internalid: String(objAcctMapping[0].getValue('custrecord_acct_map_account_currency')) }).symbol;
					PmtInfObj.DbtrAcct.Ccy = symbol; //objAcctMapping[0].getValue('custrecord_acct_map_account_currency') || ''; // Bank Currency
					dAudit('DbtrAcct.Ccy', objAcctMapping[0].getValue('custrecord_acct_map_account_currency'));
					dAudit('DbtrAcct.Ccy', JSON.stringify(_currencies));
				} catch (e) {}
			}

			//DbtrAgt
			if ((!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id'))) || !isEmpty(country)) {
				if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id'))) {
					// objects.DbtrAgt.FinInstnId.BIC = objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id');
					dLog('Here BIC', objAcctMapping[0].getValue('custrecord_acct_map_hsbc_swift_bank_id'));
					PmtInfObj.DbtrAgt = {};
					PmtInfObj.DbtrAgt.Nm = objVDCRecResults[0].getValue('custrecord_bankname') || '';
					PmtInfObj.DbtrAgt.FinInstnId = {};
					PmtInfObj.DbtrAgt.FinInstnId.ClrSysMmbId = {};
					PmtInfObj.DbtrAgt.FinInstnId.ClrSysMmbId.MmbId = objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id'); // Routing Number 10 Digit

					if (paymentMethod == 'DAC' || paymentMethod == 'MTS' || paymentMethod == 'CHK') {
						// PmtInfObj.DbtrAgt
						PmtInfObj.DbtrAgt.Bic = objAcctMapping[0].getValue('custrecord_acct_map_hsbc_swift_bank_id');
					}
				}
				var country = !isEmpty(objVDCRecResults) ? objVDCRecResults[0].getValue('custrecord_ica_orig_bank_country_code') : '';
				if (!isEmpty(country)) {
					dLog('Here Country Code', country);
					PmtInfObj.DbtrAgt.FinInstnId.PstlAdr = {};
					PmtInfObj.DbtrAgt.FinInstnId.PstlAdr.Ctry = country;
				}
			}

			var noOfBillPayments = 0;
			var totalAmount = 0;
			for (v in arrVendorBills) {
				var arrPayeeInfo = v.split('X@X');
				var payeeId = arrPayeeInfo[1];

				//var objVendor=arrVendors[payeeId];
				       var objVendor = _.find(arrVendors, { internalid: String(payeeId)});
				// var objVendor = _.find(arrVendors, { internalid: String(payeeId), paymentmethod: String(paymentMethod) })[0];
dAudit('objVendor-new', objVendor);				dLog('objVendor', JSON.stringify(objVendor));

				if (isEmpty(objVendor)) continue;

				var pmtMethod = objVendor.paymentmethod;
				// dLog("pmtMethod", JSON.stringify(pmtMethod));
				if (paymentMethod != pmtMethod) continue;
				if (pmtMethod == 'DAC') {
					PmtInfObj.PmtTpInf.LclInstrm = {};
					PmtInfObj.PmtTpInf.LclInstrm.Cd = objVendor.payformat;
				}
				else if (pmtMethod == 'MTS') {
					PmtInfObj.PmtTpInf.LclInstrm = {};
          if (objVendor.recbankprimidtype == 'ABA') {
            PmtInfObj.PmtTpInf.LclInstrm.Prtry = 'FWT';
          } else {
            PmtInfObj.PmtTpInf.LclInstrm.Prtry = 'SWT';
          }				          
				}

				// else if (pmtMethod == "CHK") {
				//   PmtInfObj.PmtTpInf = {};
				// 	PmtInfObj.PmtTpInf.LclInstrm = {};
				// 	PmtInfObj.PmtTpInf.LclInstrm.Prtry = 'CHK';
				// }

				var arrBills = arrVendorBills[paymentMethod + 'X@X' + payeeId];
				dLog('arrBills', JSON.stringify(arrBills));
				var tmpAmt = 0;

				var numberOfBills = _.size(arrBills);
				var billnum = '';
				var billPaymentTranId = '';
				for (by in arrBills) {
					var billId = arrBills[by];
					refnum = _.find(arrBillsProcessed, { id: String(billId) }).refnum;
					currency = _.find(arrBillsProcessed, { id: String(billId) }).currid;
					subtext = _.find(arrBillsProcessed, { id: String(billId) }).subtext;
					billnum = _.find(arrBillsProcessed, { id: String(billId) }).billnum;
					billPaymentTranId = _.find(arrBillsProcessed, { id: String(billId) }).refnum;
					dLog('billnum', billnum);

					try {
						symbol = _.find(_currencies, { internalid: String(currency) }).symbol;
					} catch (e) {}
					dLog('billPaymentTranId', billPaymentTranId);

					var netAmt = 0;
					var origAmt = getFloatVal(arrBillAmtOrig[billId]);
					var amt = getFloatVal(arrBillAmt[billId]);

					var discAmt = !isEmpty(arrBillDiscAmt[billId]) ? getFloatVal(arrBillDiscAmt[billId]) : 0;

					dLog(
						'amounts',
						JSON.stringify({
							netAmt: netAmt,
							origAmt: origAmt,
							amt: amt,
							discAmt: discAmt,
						})
					);

					netAmt = origAmt;
					tmpAmt += amt; //used to be netAmt

					if (discAmt > 0) {
						netAmt -= discAmt;
						tmpAmt -= discAmt;
					}

					if (!isEmpty(arrBillCredits[billId])) {
						var arrBC = arrBillCredits[billId];

						dLog('arrBC in arrBills', JSON.stringify(arrBC));

						for (bc in arrBC) {
							var billCreditAmtP = getFloatVal(arrBC[bc].bcamt);
							var billCreditAmt = billCreditAmtP * -1;

							// tmpAmt = (tmpAmt - billCreditAmtP);
							netAmt = netAmt - billCreditAmtP;
						}
					}
				}

				var cdtTrfTxInfObj = {};
				cdtTrfTxInfObj.PmtId = {};

				var refnum = arrBillPaymentMap[payeeId];
				var instrId = '';
				if (refnum.length > 12) {
					instrId = pz(refnum.substring(refnum.length - 12, refnum.length), 12);
				} else {
					instrId = pz(refnum, 12);
				}
				var endToEndId = billnum.substr(0, 18);
				if (numberOfBills > 1) {
					endToEndId = subtext.substr(0, 18);
				}

				var s = String(moment().valueOf());
				s = s.slice(s.length - 6);
				endToEndId = moment(d).format('YYYYMMDD') + s;

				cdtTrfTxInfObj.PmtId.InstrId = instrId;
				cdtTrfTxInfObj.PmtId.EndToEndId = endToEndId;

				if (paymentMethod == 'CHK') {
					cdtTrfTxInfObj.PmtInfObj = {};
					cdtTrfTxInfObj.PmtInfObj.PmtTpInf = {};
					cdtTrfTxInfObj.PmtInfObj.PmtTpInf.SvcLvl = {};

					if (objVendor.deliverycode == '') {
						cdtTrfTxInfObj.PmtInfObj.PmtTpInf.SvcLvl.Prtry = '00PY1';
					} else {
						cdtTrfTxInfObj.PmtInfObj.PmtTpInf.SvcLvl.Prtry = '00000';
					}

					cdtTrfTxInfObj.ChqInstr = {};
					cdtTrfTxInfObj.ChqInstr.ChqNb = billPaymentTranId;
					if (objVendor.deliverycode) {
						cdtTrfTxInfObj.ChqInstr.DlvryMtd = {};
						cdtTrfTxInfObj.ChqInstr.DlvryMtd.Cd = objVendor.deliverycode;
					}
				}

				if (paymentMethod == 'DAC') {
					cdtTrfTxInfObj.ChrgBr = 'DEBT';
					// cdtTrfTxInfObj.ChrgBr = (paymentMethod == 'MTS') ? 'CRED' : "";
				} else if (paymentMethod == 'MTS') {
					cdtTrfTxInfObj.ChrgBr = 'DEBT';
				}

				if (paymentMethod == 'DAC' || paymentMethod == 'CHK') {
					cdtTrfTxInfObj.ClrSysId = {};
          cdtTrfTxInfObj.ClrSysId.Dac = 'True'
					cdtTrfTxInfObj.ClrSysId.Cd = 'CACPA';
				} else if (paymentMethod == 'MTS') {
					cdtTrfTxInfObj.ClrSysId = {};
          if (objVendor.recbankprimidtype == 'ABA') {
            cdtTrfTxInfObj.ClrSysId.Mts2 = 'True';
          } else {
            cdtTrfTxInfObj.ClrSysId.Mts = 'True';
          }				                
        }

				tmpAmt = 0; // need to initialize back to 0

				var Strd = [];
				var totalCdtTrfTxInfAmount = 0;

				for (y in arrBills) {
					var billId = arrBills[y];
					var StrdObj = {};
					StrdObj.RfrdDocInf = {};
					StrdObj.RfrdDocInf.Tp = {};
					StrdObj.RfrdDocInf.Tp.CdOrPrtry = {};
					StrdObj.RfrdDocInf.Tp.CdOrPrtry.Cd = 'CINV';

					var netAmt = 0;
					var origAmt = getFloatVal(arrBillAmtOrig[billId]);
					var amt = getFloatVal(arrBillAmt[billId]);

					var discAmt = !isEmpty(arrBillDiscAmt[billId]) ? getFloatVal(arrBillDiscAmt[billId]) : 0;

					dLog('billId before', billId);
					dLog('arrBC in y.arrBills before', JSON.stringify(arrBillCredits));

					if (!isEmpty(arrBillCredits[billId])) {
						var arrBC = arrBillCredits[billId];

						dLog('arrBC in y.arrBills', JSON.stringify(arrBC));

						for (bc in arrBC) {
							var billCreditAmtP = getFloatVal(arrBC[bc].bcamt);
							var billCreditAmt = billCreditAmtP * -1;

							// tmpAmt = (tmpAmt - billCreditAmtP);
							netAmt = netAmt - billCreditAmtP;
						}
					}

					// tmpAmt += amt;
					netAmt = origAmt;
					tmpAmt += amt; //used to be netAmt
					totalCdtTrfTxInfAmount += amt; //origAmt;

					if (discAmt > 0) {
						netAmt -= discAmt;
						// tmpAmt -= discAmt;
						// totalCdtTrfTxInfAmount -= discAmt;
					}

					dLog('createBMO_ISO_XMLDoc. objBillsData', JSON.stringify(objBillsData[billId]));
					StrdObj.RfrdDocInf.Nb = objBillsData[billId].num; //billPaymentTranId;

					var invoiceDate = objBillsData[billId].dte;
					StrdObj.RfrdDocInf.RltdDt = formatDate(nlapiStringToDate(invoiceDate));
					StrdObj.RfrdDocAmt = {};
					StrdObj.RfrdDocAmt.DuePyblAmt = {};
					StrdObj.RfrdDocAmt.DscntApldAmt = {};
					StrdObj.RfrdDocAmt.RmtdAmt = {};
					StrdObj.RfrdDocAmt.DuePyblAmt.value = amt.toFixed(2); //origAmt

					if (discAmt == 0) discAmt = '';
					else discAmt = discAmt.toFixed(2);

					StrdObj.RfrdDocAmt.DscntApldAmt.value = discAmt;
					StrdObj.RfrdDocAmt.RmtdAmt.value = netAmt.toFixed(2);

					StrdObj.RfrdDocAmt.DuePyblAmt.Ccy = symbol;
					StrdObj.RfrdDocAmt.DscntApldAmt.Ccy = symbol;
					StrdObj.RfrdDocAmt.RmtdAmt.Ccy = symbol;

					//Add CDtrRefInf
					StrdObj.CdtrRefInf = {};
					StrdObj.CdtrRefInf.Tp = {};
					StrdObj.CdtrRefInf.CdOrPrtry = {};
					StrdObj.CdtrRefInf.CdOrPrtry.Cd = 'CINV';
					if (objBillsData[billId].memo) {
						if (objBillsData[billId].memo.length > 35) {
							StrdObj.CdtrRefInf.Ref = objBillsData[billId].memo.substring(0, 35) || '';
						} else {
							StrdObj.CdtrRefInf.Ref = objBillsData[billId].memo || '';
						}
					}

					Strd.push(StrdObj);

					if (!isEmpty(arrBillCredits[billId])) {
						var arrBC = arrBillCredits[billId];

						for (bc in arrBC) {
							var billCreditAmtP = getFloatVal(arrBC[bc].bcamt);
							var billCreditAmt = billCreditAmtP;

							tmpAmt = tmpAmt - billCreditAmtP;
							netAmt = netAmt - billCreditAmtP;
							// totalCdtTrfTxInfAmount -= billCreditAmtP;

							var StrdObj = {};
							StrdObj.RfrdDocInf = {};
							StrdObj.RfrdDocInf.Tp = {};
							StrdObj.RfrdDocInf.Tp.CdOrPrtry = {};
							StrdObj.RfrdDocInf.Tp.CdOrPrtry.Cd = 'CREN'; //Hardcoded?

							var bcNum = arrBC[bc].bcnum;
							dLog('createBMO_ISO_XMLDoc', 'VC number : ' + bcNum);
							dLog('arrBC[bc]', JSON.stringify(arrBC));

							if (!isEmpty(bcNum)) StrdObj.RfrdDocInf.Nb = bcNum;
							else if (!isEmpty(arrBillCredits[billId].bcmemo)) {
								StrdObj.RfrdDocInf.Nb = arrBillCredits[billId].bcmemo;
							}

							var invoiceDate = objBillsData[billId].dte;
							StrdObj.RfrdDocInf.RltdDt = formatDate(nlapiStringToDate(arrBC[bc].bcdate));

							StrdObj.RfrdDocAmt = {};
							StrdObj.RfrdDocAmt.CdtNoteAmt = {};
							StrdObj.RfrdDocAmt.DuePyblAmt = null;
							StrdObj.RfrdDocAmt.DscntApldAmt = null;
							StrdObj.RfrdDocAmt.RmtdAmt = null;

							// StrdObj.RfrdDocAmt.DuePyblAmt.value = (billCreditAmt).toFixed(2);
							// if (discAmt==0)
							// 	discAmt = '';
							// else
							// 	discAmt = discAmt.toFixed(2);

							// StrdObj.RfrdDocAmt.DscntApldAmt.value = discAmt;
							StrdObj.RfrdDocAmt.CdtNoteAmt.value = billCreditAmt.toFixed(2);
							StrdObj.RfrdDocAmt.CdtNoteAmt.Ccy = symbol;

							// StrdObj.RfrdDocAmt.DuePyblAmt.Ccy = symbol;
							// StrdObj.RfrdDocAmt.DscntApldAmt.Ccy = symbol;
							if (arrBC[bc].bcmemo) {
								StrdObj.CdtrRefInf = {};
								StrdObj.CdtrRefInf.Ref = arrBC[bc].bcmemo;
							}

							Strd.push(StrdObj);
						}
					}

					dLog(
						'Amounts in loop=' + y,
						JSON.stringify({
							totalAmount: totalAmount,
							totalCdtTrfTxInfAmount: totalCdtTrfTxInfAmount,
							netAmt: netAmt,
							tmpAmt: tmpAmt,
						})
					);
				}

				dLog('createBMO_ISO_XMLDoc.Strd', JSON.stringify(Strd));

				noOfBillPayments = noOfBillPayments + 1;
				totalAmount += Number(totalCdtTrfTxInfAmount);
				dLog(
					'Amounts',
					JSON.stringify({
						totalAmount: totalAmount,
						totalCdtTrfTxInfAmount: totalCdtTrfTxInfAmount,
						netAmt: netAmt,
						tmpAmt: tmpAmt,
					})
				);

				cdtTrfTxInfObj.Amt = {};
				cdtTrfTxInfObj.Amt.value = totalCdtTrfTxInfAmount.toFixed(2); //netAmt.toFixed(2); //tmpAmt.toFixed(2); //netAmt.toFixed(2); //tmpAmt.toFixed(2); //amt.toFixed(2);
				cdtTrfTxInfObj.Amt.Ccy = symbol;

				if (paymentMethod == 'DAC' || paymentMethod == 'MTS') {
					cdtTrfTxInfObj.CdtrAgt = {};
					if (paymentMethod == 'DAC') {
            cdtTrfTxInfObj.CdtrAgt.FinInstnId = {};
            // cdtTrfTxInfObj.CdtrAgt.FinInstnId.BIC = objVendor.recbankprimid;
            cdtTrfTxInfObj.CdtrAgt.FinInstnId.ClrSysMmbId = {};
            cdtTrfTxInfObj.CdtrAgt.FinInstnId.ClrSysMmbId.MmbId = objVendor.recbankprimid; // Receiving Bank Routing
            cdtTrfTxInfObj.CdtrAgt.FinInstnId.Nm = objVendor.vbankname; //objVDCRecResults[0].getValue("custrecord_companyname"); //  
          } else if (paymentMethod == 'MTS') {

            if (objVendor.recbankprimidtype == 'ABA') {
              
              cdtTrfTxInfObj.CdtrAgt.FinInstnId = {};
              cdtTrfTxInfObj.CdtrAgt.FinInstnId.ClrSysMmbId = {};
              cdtTrfTxInfObj.CdtrAgt.FinInstnId.ClrSysMmbId.MmbId = objVendor.recbankprimid;
              cdtTrfTxInfObj.CdtrAgt.FinInstnId.Nm = objVendor.vbankname;
              dLog('Set ABA', objVendor.recbankprimid);
            }
            else {
              cdtTrfTxInfObj.CdtrAgt.FinInstnId = {};
              cdtTrfTxInfObj.CdtrAgt.FinInstnId.BIC = {};
              cdtTrfTxInfObj.CdtrAgt.FinInstnId.BIC = objVendor.recbankprimid;
              cdtTrfTxInfObj.CdtrAgt.FinInstnId.Nm = objVendor.vbankname;
            }
          }



					if (objVendor.vbankaddrs1 || objVendor.vbankzip || objVendor.vbankcity || objVendor.vbankstate) {
						cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr = {};
						cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.Ctry = countryCodeMapping[objVendor.vbankcountry];
						cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.AdrLine = objVendor.vbankaddrs1;
						cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.StrtNm = objVendor.vbankaddrs1;
						cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.PstCd = objVendor.vbankzip;
						cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.TwnNm = objVendor.vbankcity;
						cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.BldgNb = '';
						cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.CtrySubDvsn = objVendor.vbankstate;
					}

					if (paymentMethod == 'MTS') { //Removed Aug 18
						// cdtTrfTxInfObj.CdtrAgt.InstrForCdtrAgt = {};
						// cdtTrfTxInfObj.CdtrAgt.InstrForCdtrAgt.InstrInf = objVendor.custentity_ica_vendor_bank_instructions;
					}
				}

				cdtTrfTxInfObj.Cdtr = {};
				cdtTrfTxInfObj.Cdtr.Nm = objVendor.vendorname;
				if (objVendor.vendoraddrs1 || objVendor.vendoraddrs2 || objVendor.vendorpostal || objVendor.vendorcity || objVendor.vendorstateprovince || countryCodeMapping[objVendor.vendorcountrycode]) {
					cdtTrfTxInfObj.Cdtr.PstlAdr = {};
					cdtTrfTxInfObj.Cdtr.PstlAdr.StrtNm = objVendor.vendoraddrs1;
					cdtTrfTxInfObj.Cdtr.PstlAdr.BldgNb = objVendor.vendoraddrs2 || '';
					cdtTrfTxInfObj.Cdtr.PstlAdr.PstCd = objVendor.vendorpostal;
					cdtTrfTxInfObj.Cdtr.PstlAdr.TwnNm = objVendor.vendorcity;
					cdtTrfTxInfObj.Cdtr.PstlAdr.CtrySubDvsn = objVendor.vendorstateprovince;
					cdtTrfTxInfObj.Cdtr.PstlAdr.Ctry = countryCodeMapping[objVendor.vendorcountrycode];
				}
				if (paymentMethod == 'CHK') {
					if (!cdtTrfTxInfObj.Cdtr) {
						cdtTrfTxInfObj.Cdtr = {};
					}
					cdtTrfTxInfObj.Cdtr.Id = objVendor.internalid;
				}

				if (paymentMethod == 'DAC' || paymentMethod == 'MTS') {
					cdtTrfTxInfObj.CdtrAcct = {};
					cdtTrfTxInfObj.CdtrAcct.Id = {};
					cdtTrfTxInfObj.CdtrAcct.Id.Othr = {};
					cdtTrfTxInfObj.CdtrAcct.Id.Othr.Id = objVendor.recpartyaccount;

					if (paymentMethod == 'DAC') {
						cdtTrfTxInfObj.CdtrAcct.Tp = {};
						cdtTrfTxInfObj.CdtrAcct.Tp.Cd = 'CACC';
					}
				}

				// cdtTrfTxInfObj.RltdAmtInf = {};
				// cdtTrfTxInfObj.RltdAmtInf.RmtLctnMtd = objVendor.pmp_dac_contactname || "";
				// cdtTrfTxInfObj.RltdAmtInf.RmtLctnElctrncAdr = objVendor.pmp_dac_emailaddress || "";
				if (paymentMethod == 'CHK') {
					dLog('objVendor.custentity_ica_vendor_bank_instructions', objVendor.custentity_ica_vendor_bank_instructions);
					cdtTrfTxInfObj.RmtInf = {};
					cdtTrfTxInfObj.RmtInf.Ustrd = objVendor.custentity_ica_vendor_bank_instructions; //
					cdtTrfTxInfObj.RmtInf.Strd = Strd;
				}
				// dLog("cdtTrfTxInfObj", JSON.stringify(cdtTrfTxInfObj));
				CdtTrfTxInf.push(cdtTrfTxInfObj);
			}

			dLog(
				'About to add totalAmount',
				JSON.stringify({
					totalAmount: totalAmount,
				})
			);

			PmtInfObj.NbOfTxs = noOfBillPayments;
			PmtInfObj.CtrlSum = totalAmount.toFixed(2);
			totalNbOfTxs += Number(noOfBillPayments);
			totalCtrlSum += Number(totalAmount);
			PmtInfObj.CdtTrfTxInf = CdtTrfTxInf;
			PmtInf.push(PmtInfObj);
		}
	}

	objects.NbOfTxs = totalNbOfTxs; //grpHdrNbOfTxs;
	objects.CtrlSum = totalCtrlSum.toFixed(2); //grpHdrCtrlSum.toFixed(2); // Do we comment this out?
	objects.PmtInf = PmtInf;
	// objects.CdtTrfTxInf = CdtTrfTxInf;
	// dLog("objects.PmtInf", JSON.stringify(objects.PmtInf));
	// dLog('objects.CdtTrfTxInf', JSON.stringify(objects.CdtTrfTxInf));

	var fileId = nlapiSearchRecord('file', null, [['name', 'is', 'ica_bmo_iso.xml']], []);
	if (fileId != null) {
		fileId = fileId[0].getId();
	}

	var tmplFile = nlapiLoadFile(fileId);

	var template = Handlebars.compile(tmplFile.getValue());
	var xmlDoc = template(objects);

	dLog('xmlDoc', xmlDoc);
	return xmlDoc;
}

function createRBC_DAC_XMLDoc(objAcctMapping) {
	var arrTempBillIds = [];
	var arrBillCRIds = [];
	var arrBillAmt = [];
	var arrBillAmtOrig = [];
	var arrBillDiscAmt = [];
	var arrBillPayInfoCtr = [];
	var arrBillPayInfoSum = [];
	var arrGrpHdrNbOfTxs = [];
	var arrPmtInfNbOfTxs = [];
	var arrBillIds = [];
	var grpHdrNbOfTxs = 0;
	var grpHdrCtrlSum = 0;
	var arrPayeeIds = [];
	var _currencies = getCurrencies();

	for (x in arrBillsProcessed) {
		var billId = arrBillsProcessed[x].id;
		var billPaymentId = arrBillsProcessed[x].payment;

		dLog('createRBC_DAC_XMLDoc', 'Bill info = ' + JSON.stringify(arrBillsProcessed[x]));
		if (!isEmpty(billPaymentId) && billPaymentId != 'XXXNONEXXX' && billPaymentId != 'CREDIT') {
			if (billPaymentId != 'CREDIT') arrTempBillIds.push(billId);

			var payMethod = arrBillsProcessed[x].paymethod;
			var paymentId = arrBillsProcessed[x].payment;
			var payeeId = arrBillsProcessed[x].payeeid;

			arrBillAmtOrig[billId] = arrBillsProcessed[x].origamt;
			// arrBillAmt[billId] = arrBillsProcessed[x].pay;
			arrBillAmt[billId] = arrBillsProcessed[x].payamt;
			arrBillDiscAmt[billId] = arrBillsProcessed[x].discamt;

			var ndx = payMethod + '@@' + paymentId;

			if (arrBillPayInfoCtr[payMethod] == null) arrBillPayInfoCtr[payMethod] = 0;
			if (arrBillPayInfoSum[payMethod] == null) arrBillPayInfoSum[payMethod] = 0;
			if (arrPmtInfNbOfTxs[ndx] == null) arrPmtInfNbOfTxs[ndx] = 0;

			if (paymentId && arrGrpHdrNbOfTxs[paymentId] == null) grpHdrNbOfTxs++;

			arrPmtInfNbOfTxs[ndx]++;
			arrBillPayInfoCtr[payMethod]++;
			arrBillPayInfoSum[payMethod] += getFloatVal(arrBillsProcessed[x].payamt);
			arrGrpHdrNbOfTxs[paymentId] = paymentId;

			grpHdrCtrlSum += getFloatVal(arrBillsProcessed[x].payamt);
		}

		if (billPaymentId == 'CREDIT') arrBillCRIds.push(billId);
	}

	var arrBillIds = [];
	var arrBillIds2 = [];
	var arrBillIds3 = [];
	var arrBillIds4 = [];
	var arrBillIds5 = [];

	for (vx in arrTempBillIds) {
		var isBC = false;
		for (var x in arrBillCRIds) {
			if (arrTempBillIds[vx] == arrBillCRIds[x]) {
				isBC = true;
				break;
			}
		}
		if (!isBC) {
			arrBillIds.push(arrTempBillIds[vx]);
			arrBillIds2.push(arrTempBillIds[vx]);
			arrBillIds3.push(arrTempBillIds[vx]);
			arrBillIds4.push(arrTempBillIds[vx]);
			arrBillIds5.push(arrTempBillIds[vx]);
		}
	}

	var arrBillCredits = getBillCredit(arrBillIds);
	var objBillsData = getBillData(arrBillIds2);
	var arrBillPO = getPOMap(arrBillIds3);
	var arrVendorBills = getPayeeBillsByPayMethod(arrBillIds4);
	var arrVendorBillsCurr = getPayeeBillsCurrency(arrBillIds5);
	var nsAcctSub = !isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('subsidiary', 'CUSTRECORD_ACCT_MAP_NETSUITE_ACCOUNT')) ? objAcctMapping[0].getValue('subsidiary', 'CUSTRECORD_ACCT_MAP_NETSUITE_ACCOUNT') : '';
	// var nsAcctSub
	var objVDCRecResults = getVendorDAC_CCRPaymentRec(nsAcctSub);
	dLog('objVDCRecResults', JSON.stringify(objVDCRecResults));
	dLog('objAcctMapping', JSON.stringify(objAcctMapping));

	//Gather data.

	var objects = {
		MsgId: 'TBD',
		CreDtTm: 'Test',
		Authstn: {
			Cd: '',
		},
		NbOfTxs: '2',
		CtrlSum: '2000',
		InitgPty: {
			Id: {
				OrgId: {
					Othr: {
						Id: '',
					},
				},
			},
		},
		PmtInfId: 'PmtInfId',
		PmtMtd: 'PmtMtd',
		PmtTpInf: {
			SvcLvl: {
				Cd: 'This is CD',
			},
		},
		ReqdExctnDt: 'ReqdExctnDt',
		Dbtr: {
			Nm: 'This is Nm',
			PstlAdr: {
				StrtNm: '',
				BldgNb: '',
				PstCd: '',
				TwnNm: '',
				CtrySubDvsn: '',
				Ctry: '',
			},
			Id: {
				Othr: {
					Id: 'Dbtr.Id.Othr.Id',
				},
			},
		},
		DbtrAcct: {
			Id: {
				Othr: {
					Id: 'DbtrAcct.Id.Othr.Id',
				},
			},
			PstlAdr: {
				StrtNm: '',
				BldgNb: '',
				PstCd: '',
				TwnNm: '',
				CtrySubDvsn: '',
				Ctry: '',
			},
		},
		DbtrAgt: {
			FinInstnId: {
				BIC: 'BIC',
				PstlAdr: {
					StrtNm: '',
					BldgNb: '',
					PstCd: '',
					TwnNm: '',
					CtrySubDvsn: '',
					Ctry: '',
				},
			},
		},
		CdtTrfTxInf: CdtTrfTxInf,
	};

	var PmtInf = [];

	for (x in arrVendorBills) {
		var payeeId = x.split('X@X')[1];
		arrPayeeIds.push(payeeId);
	}

	var arrVendors = getEntityData(arrPayeeIds);

	var today = new Date();
	var bpmdate = BPM_DATE;
	var d = nlapiStringToDate(bpmdate, 'datetime');

	var fileCtrlNumber = Date.create().format('{yy}{MM}{dd}{mm}{ss}');
	objects.MsgId = pad(fileCtrlNumber, 4);
	objects.CreDtTm = moment(d).format('YYYY-MM-DDThh:mm:ss') || today.format('{yyyy}-{MM}-{dd}T{hh}:{mm}:{ss}');
	objects.Authstn.Cd = 'AUTH';
	objects.NbOfTxs = grpHdrNbOfTxs;
	objects.CtrlSum = grpHdrCtrlSum.toFixed(2); // Do we comment this out?

	if (objects.CtrlSum == '0.00') {
		dLog('CtrlSum is 0.00, this should not happen. Returning empty file', objects.CtrlSum);
		return '';
	}

	if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ceo_company_id'))) {
		objects.InitgPty.Id.OrgId.Othr.Id = objAcctMapping[0].getValue('custrecord_acct_map_ceo_company_id'); //CEO ID
	}

	dLog('RBC: arrBillPayInfoCtr', JSON.stringify(arrBillPayInfoCtr));
	for (x in arrBillPayInfoCtr) {
		//CdtTrfTxInf loop starts here.
		var CdtTrfTxInf = [];

		if (SINGLEBILLPYMTS == 'T') {
			dAudit('Create Single Bill Payments here.', JSON.stringify(arrBillsProcessed));
			var PmtInfObj = {};

			PmtInfObj.PmtInfId = fileCtrlNumber;
			var paymentMethod = x;
			PmtInfObj.PmtMtd = 'TRF';

			// objects.PmtTpInf.SvcLvl.Cd = (paymentMethod == 'DAC') ? 'NURG' : 'URGP';
			PmtInfObj.PmtTpInf = {};
			PmtInfObj.PmtTpInf.SvcLvl = {};
			PmtInfObj.PmtTpInf.SvcLvl.Prtry = paymentMethod == 'DAC' ? 'NORM' : 'URGP';
			PmtInfObj.ReqdExctnDt = moment(d).format('YYYY-MM-DD') || today.format('{yyyy}-{MM}-{dd}');

			if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_companyname'))) {
				PmtInfObj.Dbtr = {};
				PmtInfObj.Dbtr.Nm = objVDCRecResults[0].getValue('custrecord_companyname');
			}

			//PstlAdr
			var country = !isEmpty(objVDCRecResults) ? objVDCRecResults[0].getValue('custrecord_compcountrycode') : '';

			if (
				(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_comppostcode'))) ||
				(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compcity'))) ||
				(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compstateprov'))) ||
				(!isEmpty(objVDCRecResults) && objVDCRecResults[0].getValue('custrecord_compcountrycode')) ||
				(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compadd1')))
			) {
				PmtInfObj.Dbtr = {};
				PmtInfObj.Dbtr.PstlAdr = {};
				if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compadd1'))) {
					PmtInfObj.Dbtr.PstlAdr.StrtNm = '<AdrLine>' + objVDCRecResults[0].getValue('custrecord_compadd1') + '</AdrLine>';
				}
				if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compadd2'))) {
					PmtInfObj.Dbtr.PstlAdr.BldgNb = '<BldgNb>' + objVDCRecResults[0].getValue('custrecord_compadd2') + '</BldgNb>';
				}

				if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_comppostcode'))) {
					PmtInfObj.Dbtr.PstlAdr.PstCd = '<PstCd>' + objVDCRecResults[0].getValue('custrecord_comppostcode') + '</PstCd>';
				}
				// addTextNodeFromParentNode(xmlDoc, pstlAdr, 'PstCd', objVDCRecResults[0].getValue('custrecord_comppostcode'));

				if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compcity'))) {
					PmtInfObj.Dbtr.PstlAdr.TwnNm = '<TwnNm>' + objVDCRecResults[0].getValue('custrecord_compcity') + '</TwnNm>';
				}
				// addTextNodeFromParentNode(xmlDoc, pstlAdr, 'TwnNm', objVDCRecResults[0].getValue('custrecord_compcity'));

				//Where do we get CtrySubDvsn?
				if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compstateprov'))) {
					PmtInfObj.Dbtr.PstlAdr.TwnNm = '<CtrySubDvsn>' + objVDCRecResults[0].getValue('custrecord_compstateprov') + '</CtrySubDvsn>';
				}

				// addTextNodeFromParentNode(xmlDoc, pstlAdr, 'Ctry', country);
				if (country) {
					PmtInfObj.Dbtr.PstlAdr.Ctry = '<Ctry>' + country + '</Ctry>';
				}
			}

			PmtInfObj.Dbtr.Id = {};
			PmtInfObj.Dbtr.Id.Othr = {};
			if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_dom_ach_co_id'))) {
				PmtInfObj.Dbtr.Id.Othr.Id = objAcctMapping[0].getValue('custrecord_acct_map_dom_ach_co_id'); //ACH Company ID
			}

			//DbtrAcct
			PmtInfObj.DbtrAcct = {};
			PmtInfObj.DbtrAcct.Id = {};
			PmtInfObj.DbtrAcct.Id.Othr = {};
			if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_origin_acc'))) {
				PmtInfObj.DbtrAcct.Id.Othr.Id = objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_origin_acc'); // Bank Account Number

				var symbol = '';
				try {
					symbol = _.find(_currencies, { internalid: String(objAcctMapping[0].getValue('custrecord_acct_map_account_currency')) }).symbol;
					PmtInfObj.DbtrAcct.Ccy = symbol; //objAcctMapping[0].getValue('custrecord_acct_map_account_currency') || ''; // Bank Currency
					dAudit('DbtrAcct.Ccy', objAcctMapping[0].getValue('custrecord_acct_map_account_currency'));
					dAudit('DbtrAcct.Ccy', JSON.stringify(_currencies));
				} catch (e) {}
			}

			//DbtrAgt
			if ((!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id'))) || !isEmpty(country)) {
				if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id'))) {
					// objects.DbtrAgt.FinInstnId.BIC = objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id');

					PmtInfObj.DbtrAgt = {};
					PmtInfObj.DbtrAgt.Nm = objVDCRecResults[0].getValue('custrecord_bankname') || '';
					PmtInfObj.DbtrAgt.FinInstnId = {};
					PmtInfObj.DbtrAgt.FinInstnId.ClrSysMmbId = {};
					PmtInfObj.DbtrAgt.FinInstnId.ClrSysMmbId.MmbId = objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id'); // Routing Number 10 Digit
				}
				PmtInfObj.DbtrAgt.FinInstnId.PstlAdr = {};
				PmtInfObj.DbtrAgt.FinInstnId.PstlAdr.Ctry = 'CA';
			}

			for (var i = 0; i < arrBillsProcessed.length; i++) {
				// objects.PmtInfId = fileCtrlNumber;
				// var paymentMethod = x;
				// objects.PmtMtd = 'TRF';

				// // objects.PmtTpInf.SvcLvl.Cd = (paymentMethod == 'DAC') ? 'NURG' : 'URGP';
				// objects.PmtTpInf.SvcLvl = {};
				// objects.PmtTpInf.SvcLvl.Prtry = (paymentMethod == 'DAC') ? 'NORM' : 'URGP';
				// objects.ReqdExctnDt = moment(d).format('YYYY-MM-DD') || today.format('{yyyy}-{MM}-{dd}');

				// if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_companyname')))
				//         objects.Dbtr.Nm = objVDCRecResults[0].getValue('custrecord_companyname');

				// //PstlAdr
				// var country = (!isEmpty(objVDCRecResults)) ? objVDCRecResults[0].getValue('custrecord_compcountrycode') : '';

				// if ((!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_comppostcode')))
				//                 || (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compcity')))
				//                 || (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compstateprov')))
				//                 || (!isEmpty(objVDCRecResults) && objVDCRecResults[0].getValue('custrecord_compcountrycode'))
				//                 || (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compadd1')))) {

				//         if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compadd1'))) {
				//                 objects.Dbtr.PstlAdr.StrtNm = "<AdrLine>" + objVDCRecResults[0].getValue('custrecord_compadd1') + "</AdrLine>";
				//         }
				//         if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compadd2'))) {
				//                 objects.Dbtr.PstlAdr.BldgNb = "<BldgNb>" + objVDCRecResults[0].getValue('custrecord_compadd2') + "</BldgNb>";
				//         }

				//         if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_comppostcode'))) {
				//                 objects.Dbtr.PstlAdr.PstCd = "<PstCd>" + objVDCRecResults[0].getValue('custrecord_comppostcode') + "</PstCd>";
				//         }
				//                 // addTextNodeFromParentNode(xmlDoc, pstlAdr, 'PstCd', objVDCRecResults[0].getValue('custrecord_comppostcode'));

				//         if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compcity'))) {
				//                 objects.Dbtr.PstlAdr.TwnNm = "<TwnNm>" + objVDCRecResults[0].getValue('custrecord_compcity') + "</TwnNm>";
				//         }
				//                 // addTextNodeFromParentNode(xmlDoc, pstlAdr, 'TwnNm', objVDCRecResults[0].getValue('custrecord_compcity'));

				//         //Where do we get CtrySubDvsn?
				//         if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compstateprov'))) {
				//                 objects.Dbtr.PstlAdr.TwnNm = "<CtrySubDvsn>" + objVDCRecResults[0].getValue('custrecord_compstateprov') + "</CtrySubDvsn>";
				//         }

				//         // addTextNodeFromParentNode(xmlDoc, pstlAdr, 'Ctry', country);
				//         if (country) {
				//                 objects.Dbtr.PstlAdr.Ctry = "<Ctry>" + country + "</Ctry>";
				//         }
				//         dLog('Added Ctry', JSON.stringify(objects) );

				//         // addTextNodeFromParentNode(xmlDoc, pstlAdr, 'AdrLine', objVDCRecResults[0].getValue('custrecord_compadd1'));
				//         // objects.Dbtr.PstlAdr.BldgNb = '2'; not used
				// }

				// if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_dom_ach_co_id'))) {
				//         objects.Dbtr.Id = {};
				//         objects.Dbtr.Id.Othr = {};
				//         objects.Dbtr.Id.Othr.Id = objAcctMapping[0].getValue('custrecord_acct_map_dom_ach_co_id'); //ACH Company ID
				// }

				// //DbtrAcct
				// if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_origin_acc'))) {
				//         objects.DbtrAcct = {};
				//         objects.DbtrAcct.Id = {};
				//         objects.DbtrAcct.Id.Othr = {};
				//         objects.DbtrAcct.Id.Othr.Id = objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_origin_acc'); // Bank Account Number

				//         var symbol = '';
				//         try {
				//                 symbol = _.find(_currencies, {"internalid" : String(objAcctMapping[0].getValue('custrecord_acct_map_account_currency'))}).symbol;
				//                 objects.DbtrAcct.Ccy = symbol; //objAcctMapping[0].getValue('custrecord_acct_map_account_currency') || ''; // Bank Currency
				//                 dAudit('DbtrAcct.Ccy', objAcctMapping[0].getValue('custrecord_acct_map_account_currency'));
				//                 dAudit('DbtrAcct.Ccy', JSON.stringify(_currencies));
				//         } catch(e) {}

				// }

				// //DbtrAgt
				// if ((!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id'))) || !isEmpty(country)) {
				//         if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id'))) {
				//                 // objects.DbtrAgt.FinInstnId.BIC = objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id');

				//                 objects.DbtrAgt = {};
				//                 objects.DbtrAgt.Nm = objVDCRecResults[0].getValue('custrecord_bankname') || "";
				//                 objects.DbtrAgt.FinInstnId = {};
				//                 objects.DbtrAgt.FinInstnId.ClrSysMmbId = {};
				//                 objects.DbtrAgt.FinInstnId.ClrSysMmbId.MmbId = objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id'); // Routing Number 10 Digit
				//         }
				//         objects.DbtrAgt.FinInstnId.PstlAdr = {};
				//         objects.DbtrAgt.FinInstnId.PstlAdr.Ctry = 'CA';
				// }

				var billPayment = arrBillsProcessed[i];

				if (billPayment.payment == 'CREDIT') {
					continue;
				}

				var symbol = '';

				try {
					symbol = _.find(_currencies, { internalid: String(billPayment.currid) }).symbol;
				} catch (e) {}

				var objVendor = arrVendors[billPayment.payeeid];
				if (!objVendor) objVendor = _.find(arrVendors, { internalid: String(billPayment.payeeid) });

				dLog('objVendor', JSON.stringify(objVendor));

				var cdtTrfTxInfObj = {};
				cdtTrfTxInfObj.PmtId = {};

				var refnum = billPayment.refnum; //arrBillPaymentMap[billPayment.payeeid];
				// var refnum = billPayment.billnum; //arrBillPaymentMap[billPayment.payeeid];
				var instrId = '';
				if (refnum.length > 12) {
					instrId = pz(refnum.substring(refnum.length - 12, refnum.length), 12);
				} else {
					instrId = pz(refnum, 12);
				}
				refnum = billPayment.billnum; //Overwrite endToendID
				var endToEndId = refnum;
				if (refnum.length > 18) {
					endToEndId = refnum.substr(0, 18);
				}

				endToEndId = moment(d).format('YYYY-MM-DDThh:mm:ss');

				cdtTrfTxInfObj.PmtId.InstrId = instrId;
				cdtTrfTxInfObj.PmtId.EndToEndId = endToEndId;
				cdtTrfTxInfObj.Amt = {};
				cdtTrfTxInfObj.Amt.value = billPayment.payamt; //amt.toFixed(2);
				cdtTrfTxInfObj.Amt.Ccy = symbol;
				cdtTrfTxInfObj.ChrgBr = billPayment.paymethod == 'MTS' ? 'CRED' : '';

				cdtTrfTxInfObj.CdtrAgt = {};
				cdtTrfTxInfObj.CdtrAgt.FinInstnId = {};
				// cdtTrfTxInfObj.CdtrAgt.FinInstnId.BIC = objVendor.recbankprimid;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.ClrSysMmbId = {};
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.ClrSysMmbId.MmbId = objVendor.recbankprimid; //objVendor.bankid; // Receiving Bank Routing
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.Nm = objVendor.vbankname;
				if (objVendor.vbankcountry || objVendor.vbankaddrs1 || objVendor.vbankzip || objVendor.vbankcity || objVendor.vbankstate) {
					cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr = {};
					cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.Ctry = countryCodeMapping[objVendor.vbankcountry];
					cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.AdrLine = objVendor.vbankaddrs1;
					cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.StrtNm = objVendor.vbankaddrs1;
					cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.BldgNb = '';
					cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.PstCd = objVendor.vbankzip;
					cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.TwnNm = objVendor.vbankcity;
					cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.CtrySubDvsn = objVendor.vbankstate;
				}

				if (billPayment.paymethod == 'MTS') {
					cdtTrfTxInfObj.CdtrAgt.InstrForCdtrAgt = {};
					cdtTrfTxInfObj.CdtrAgt.InstrForCdtrAgt.InstrInf = objVendor.custentity_ica_vendor_bank_instructions;
				}

				cdtTrfTxInfObj.Cdtr = {};
				cdtTrfTxInfObj.Cdtr.Nm = objVendor.vendorname;
				cdtTrfTxInfObj.Cdtr.PstlAdr = {};
				cdtTrfTxInfObj.Cdtr.PstlAdr.StrtNm = objVendor.vendoraddrs1;
				cdtTrfTxInfObj.Cdtr.PstlAdr.BldgNb = objVendor.vendoraddrs2 || '';
				cdtTrfTxInfObj.Cdtr.PstlAdr.PstCd = objVendor.vendorpostal;
				cdtTrfTxInfObj.Cdtr.PstlAdr.TwnNm = objVendor.vendorcity;
				cdtTrfTxInfObj.Cdtr.PstlAdr.CtrySubDvsn = objVendor.vendorstateprovince;
				cdtTrfTxInfObj.Cdtr.PstlAdr.Ctry = countryCodeMapping[objVendor.vendorcountrycode];

				cdtTrfTxInfObj.CdtrAcct = {};
				cdtTrfTxInfObj.CdtrAcct.Id = {};
				cdtTrfTxInfObj.CdtrAcct.Id.Othr = {};
				cdtTrfTxInfObj.CdtrAcct.Id.Othr.Id = objVendor.recpartyaccount;

				// cdtTrfTxInfObj.RltdAmtInf = {};
				// cdtTrfTxInfObj.RltdAmtInf.RmtLctnMtd = objVendor.pmp_dac_contactname || "";
				// cdtTrfTxInfObj.RltdAmtInf.RmtLctnElctrncAdr = objVendor.pmp_dac_emailaddress || "";
				cdtTrfTxInfObj.RmtInf = {};
				cdtTrfTxInfObj.RmtInf.Ustrd = refnum;
				cdtTrfTxInfObj.RmtInf.VendorId = objVendor.entityid;
				cdtTrfTxInfObj.RmtInf.Category = objVendor.category;

				cdtTrfTxInfObj.RmtInf.Strd = Strd;

				CdtTrfTxInf.push(cdtTrfTxInfObj);
			}
			PmtInfObj.CdtTrfTxInf = CdtTrfTxInf;
			PmtInf.push(PmtInfObj);
		} else {
			dAudit('arrVendorBills', arrVendorBills);
			var refnum = '';
			var currency = '';
			var symbol = '';
			var PmtInfObj = {};

			PmtInfObj.PmtInfId = fileCtrlNumber;
			var paymentMethod = x;
			if (paymentMethod == 'CHK') {
				PmtInfObj.PmtMtd = 'CHK';
			} else {
				PmtInfObj.PmtMtd = 'TRF';
			}

			// objects.PmtTpInf.SvcLvl.Cd = (paymentMethod == 'DAC') ? 'NURG' : 'URGP';
			PmtInfObj.PmtTpInf = {};
			PmtInfObj.PmtTpInf.SvcLvl = {};

			if (paymentMethod == 'DAC') {
				PmtInfObj.PmtTpInf.SvcLvl.Prtry = 'NORM';
			} else if (paymentMethod == 'CHK') {
				PmtInfObj.PmtTpInf.SvcLvl.Prtry = 'PM';
			} else if (paymentMethod == 'MTS') {
				PmtInfObj.PmtTpInf.SvcLvl.Prtry = 'URG';
			}
			if (paymentMethod == 'DAC') {
				PmtInfObj.PmtTpInf.SvcLvl.Cd = 'CTX';
			}
			PmtInfObj.ReqdExctnDt = moment(d).format('YYYY-MM-DD') || today.format('{yyyy}-{MM}-{dd}');

			dAudit('objVDCRecResults', JSON.stringify(objVDCRecResults));
			if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_companyname'))) {
				PmtInfObj.Dbtr = {};
				PmtInfObj.Dbtr.Nm = objVDCRecResults[0].getValue('custrecord_companyname');
				dLog('Added Nm', objVDCRecResults[0].getValue('custrecord_companyname'));
			}

			//PstlAdr
			var country = !isEmpty(objVDCRecResults) ? objVDCRecResults[0].getValue('custrecord_compcountrycode') : '';

			if (
				(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_comppostcode'))) ||
				(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compcity'))) ||
				(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compstateprov'))) ||
				(!isEmpty(objVDCRecResults) && objVDCRecResults[0].getValue('custrecord_compcountrycode')) ||
				(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compadd1')))
			) {
				PmtInfObj.Dbtr.PstlAdr = {};

				if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compadd1'))) {
					PmtInfObj.Dbtr.PstlAdr.StrtNm = '<StrtNm>' + objVDCRecResults[0].getValue('custrecord_compadd1') + '</StrtNm>';
				}
				if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compadd2'))) {
					PmtInfObj.Dbtr.PstlAdr.BldgNb = '<BldgNb>' + objVDCRecResults[0].getValue('custrecord_compadd2') + '</BldgNb>';
				}

				if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_comppostcode'))) {
					PmtInfObj.Dbtr.PstlAdr.PstCd = '<PstCd>' + objVDCRecResults[0].getValue('custrecord_comppostcode') + '</PstCd>';
				}
				// addTextNodeFromParentNode(xmlDoc, pstlAdr, 'PstCd', objVDCRecResults[0].getValue('custrecord_comppostcode'));

				if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compcity'))) {
					PmtInfObj.Dbtr.PstlAdr.TwnNm = '<TwnNm>' + objVDCRecResults[0].getValue('custrecord_compcity') + '</TwnNm>';
				}
				// addTextNodeFromParentNode(xmlDoc, pstlAdr, 'TwnNm', objVDCRecResults[0].getValue('custrecord_compcity'));

				//Where do we get CtrySubDvsn?
				if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compstateprov'))) {
					PmtInfObj.Dbtr.PstlAdr.TwnNm = '<CtrySubDvsn>' + objVDCRecResults[0].getValue('custrecord_compstateprov') + '</CtrySubDvsn>';
				}

				// addTextNodeFromParentNode(xmlDoc, pstlAdr, 'Ctry', country);
				if (country) {
					PmtInfObj.Dbtr.PstlAdr.Ctry = '<Ctry>' + country + '</Ctry>';
				}
			}

			PmtInfObj.Dbtr.Id = {};
			PmtInfObj.Dbtr.Id.Othr = {};

			if (paymentMethod == 'DAC') {
				if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_dom_ach_co_id'))) {
					PmtInfObj.Dbtr.Id.Othr.Id = objAcctMapping[0].getValue('custrecord_acct_map_dom_ach_co_id'); //ACH Company ID
				}
			} else if (paymentMethod == 'CHK') {
				if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_check_template_id'))) {
					PmtInfObj.Dbtr.Id.Othr.Id = objAcctMapping[0].getValue('custrecord_acct_map_check_template_id'); //Check Template ID
				}
			}

			PmtInfObj.Dbtr.Id.OrgId = {};
			PmtInfObj.Dbtr.Id.OrgId.Othr = {};

			// if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ceo_company_id'))) {
			//         PmtInfObj.Dbtr.Id.OrgId.Othr.Id = objAcctMapping[0].getValue('custrecord_acct_map_ceo_company_id');
			// }

			if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_bankname'))) {
				PmtInfObj.Dbtr.Id.OrgId.Othr.SchmeNm = {};
				PmtInfObj.Dbtr.Id.OrgId.Othr.SchmeNm.Cd = objVDCRecResults[0].getValue('custrecord_bankname');
			}

			//DbtrAcct
			PmtInfObj.DbtrAcct = {};
			PmtInfObj.DbtrAcct.Id = {};
			PmtInfObj.DbtrAcct.Id.Othr = {};
			if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_origin_acc'))) {
				PmtInfObj.DbtrAcct.Id.Othr.Id = objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_origin_acc'); // Bank Account Number

				var symbol = '';
				try {
					symbol = _.find(_currencies, { internalid: String(objAcctMapping[0].getValue('custrecord_acct_map_account_currency')) }).symbol;
					PmtInfObj.DbtrAcct.Ccy = symbol; //objAcctMapping[0].getValue('custrecord_acct_map_account_currency') || ''; // Bank Currency
					dAudit('DbtrAcct.Ccy', objAcctMapping[0].getValue('custrecord_acct_map_account_currency'));
					dAudit('DbtrAcct.Ccy', JSON.stringify(_currencies));
				} catch (e) {}
			}

			//DbtrAgt
			if ((!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id'))) || !isEmpty(country)) {
				if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id'))) {
					// objects.DbtrAgt.FinInstnId.BIC = objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id');

					PmtInfObj.DbtrAgt = {};
					PmtInfObj.DbtrAgt.Nm = objVDCRecResults[0].getValue('custrecord_bankname') || '';
					PmtInfObj.DbtrAgt.FinInstnId = {};
					PmtInfObj.DbtrAgt.FinInstnId.ClrSysMmbId = {};
					PmtInfObj.DbtrAgt.FinInstnId.ClrSysMmbId.MmbId = objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id'); // Routing Number 10 Digit
				}
				PmtInfObj.DbtrAgt.FinInstnId.PstlAdr = {};
				PmtInfObj.DbtrAgt.FinInstnId.PstlAdr.Ctry = 'CA';
			}

			var totalCtrlSum = 0;
			var noOfBillPayments = 0;
			for (v in arrVendorBills) {
				var arrPayeeInfo = v.split('X@X');
				var payeeId = arrPayeeInfo[1];

				//var objVendor=arrVendors[payeeId];
				       var objVendor = _.find(arrVendors, { internalid: String(payeeId)});
				// var objVendor = _.find(arrVendors, { internalid: String(payeeId), paymentmethod: String(paymentMethod) })[0];
dAudit('objVendor-new', objVendor);				dLog('objVendor', JSON.stringify(objVendor));

				if (isEmpty(objVendor)) continue;

				var pmtMethod = objVendor.paymentmethod;

				if (paymentMethod != pmtMethod) continue;

				var arrBills = arrVendorBills[paymentMethod + 'X@X' + payeeId];
				dLog('arrBills', JSON.stringify(arrBills));
				var tmpAmt = 0;

				var numberOfBills = _.size(arrBills);
				var billnum = '';
				var billPaymentTranId = '';
				for (by in arrBills) {
					var billId = arrBills[by];
					refnum = _.find(arrBillsProcessed, { id: String(billId) }).refnum;
					currency = _.find(arrBillsProcessed, { id: String(billId) }).currid;
					subtext = _.find(arrBillsProcessed, { id: String(billId) }).subtext;
					billnum = _.find(arrBillsProcessed, { id: String(billId) }).billnum;
					billPaymentTranId = _.find(arrBillsProcessed, { id: String(billId) }).refnum;
					dLog('billnum', billnum);

					try {
						symbol = _.find(_currencies, { internalid: String(currency) }).symbol;
					} catch (e) {}
					dLog('billPaymentTranId', billPaymentTranId);

					var netAmt = 0;
					var origAmt = getFloatVal(arrBillAmtOrig[billId]);
					var amt = getFloatVal(arrBillAmt[billId]);

					var discAmt = !isEmpty(arrBillDiscAmt[billId]) ? getFloatVal(arrBillDiscAmt[billId]) : 0;

					dLog(
						'amounts',
						JSON.stringify({
							netAmt: netAmt,
							origAmt: origAmt,
							amt: amt,
							discAmt: discAmt,
						})
					);

					netAmt = origAmt;
					tmpAmt += amt; //used to be netAmt

					if (discAmt > 0) {
						netAmt -= discAmt;
						tmpAmt -= discAmt;
					}

					if (!isEmpty(arrBillCredits[billId])) {
						var arrBC = arrBillCredits[billId];

						dLog('arrBC in arrBills', JSON.stringify(arrBC));

						for (bc in arrBC) {
							var billCreditAmtP = getFloatVal(arrBC[bc].bcamt);
							var billCreditAmt = billCreditAmtP * -1;

							// tmpAmt = (tmpAmt - billCreditAmtP);
							netAmt = netAmt - billCreditAmtP;
						}
					}
				}
				noOfBillPayments = noOfBillPayments + 1;

				//to add 10062021
				PmtInfObj.NbOfTxs = numberOfBills;
				// PmtInfObj.CtrlSum = tmpAmt.toFixed(2);

				var cdtTrfTxInfObj = {};
				cdtTrfTxInfObj.PmtId = {};

				var refnum = arrBillPaymentMap[payeeId];
				var instrId = '';
				if (refnum.length > 12) {
					instrId = pz(refnum.substring(refnum.length - 12, refnum.length), 12);
				} else {
					instrId = pz(refnum, 12);
				}
				var endToEndId = billnum.substr(0, 18);
				if (numberOfBills > 1) {
					endToEndId = subtext.substr(0, 18);
				}

				var s = String(moment().valueOf());
				s = s.slice(s.length - 6);
				endToEndId = moment(d).format('YYYYMMDD') + s;

				cdtTrfTxInfObj.PmtId.InstrId = instrId;
				if (paymentMethod == 'CHK') {
					cdtTrfTxInfObj.PmtId.EndToEndId = billPaymentTranId || endToEndId;
				} else {
					cdtTrfTxInfObj.PmtId.EndToEndId = endToEndId;
				}

				cdtTrfTxInfObj.Amt = {};
				cdtTrfTxInfObj.Amt.value = tmpAmt.toFixed(2); //amt.toFixed(2);
				totalCtrlSum = totalCtrlSum + Number(tmpAmt.toFixed(2));
				cdtTrfTxInfObj.Amt.Ccy = symbol;

				if (paymentMethod == 'CHK') {
					cdtTrfTxInfObj.PmtInfObj = {};
					cdtTrfTxInfObj.PmtInfObj.PmtTpInf = {};
					cdtTrfTxInfObj.PmtInfObj.PmtTpInf.SvcLvl = {};
					cdtTrfTxInfObj.PmtInfObj.PmtTpInf.SvcLvl.Prtry = 'PM';

					cdtTrfTxInfObj.ChqInstr = {};
					cdtTrfTxInfObj.ChqInstr.ChqNb = billPaymentTranId;
					cdtTrfTxInfObj.ChqInstr.DlvryMtd = {};
					cdtTrfTxInfObj.ChqInstr.DlvryMtd.Cd = objVendor.deliverycode;
				}

				if (paymentMethod == 'DAC') {
					cdtTrfTxInfObj.ChrgBr = 'DEBT';
					// cdtTrfTxInfObj.ChrgBr = (paymentMethod == 'MTS') ? 'CRED' : "";
				} else if (paymentMethod == 'MTS') {
					cdtTrfTxInfObj.ChrgBr = 'DEBT';
				}

				if (paymentMethod == 'DAC' || paymentMethod == 'CHK') {
					cdtTrfTxInfObj.ClrSysId = {};
					cdtTrfTxInfObj.ClrSysId.Cd = 'CACPA';
				}

				tmpAmt = 0; // need to initialize back to 0

				var Strd = [];

				for (y in arrBills) {
					var billId = arrBills[y];
					var StrdObj = {};
					StrdObj.RfrdDocInf = {};
					StrdObj.RfrdDocInf.Tp = {};
					StrdObj.RfrdDocInf.Tp.CdOrPrtry = {};
					StrdObj.RfrdDocInf.Tp.CdOrPrtry.Cd = 'CINV'; //Hardcoded?

					var netAmt = 0;
					var origAmt = getFloatVal(arrBillAmtOrig[billId]);
					var amt = getFloatVal(arrBillAmt[billId]);

					dLog(
						'amounts',
						JSON.stringify({
							origAmt: origAmt,
							amt: amt,
						})
					);

					var discAmt = !isEmpty(arrBillDiscAmt[billId]) ? getFloatVal(arrBillDiscAmt[billId]) : 0;

					dLog('billId before', billId);
					dLog('arrBC in y.arrBills before', JSON.stringify(arrBillCredits));

					if (!isEmpty(arrBillCredits[billId])) {
						var arrBC = arrBillCredits[billId];

						dLog('arrBC in y.arrBills', JSON.stringify(arrBC));

						for (bc in arrBC) {
							var billCreditAmtP = getFloatVal(arrBC[bc].bcamt);
							var billCreditAmt = billCreditAmtP * -1;

							// tmpAmt = (tmpAmt - billCreditAmtP);
							netAmt = netAmt - billCreditAmtP;
						}
					}

					// tmpAmt += amt;
					netAmt = origAmt;
					tmpAmt += amt; //used to be netAmt

					if (discAmt > 0) {
						netAmt -= discAmt;
						tmpAmt -= discAmt;
					}

					dLog('createRBC_DAC_XMLDoc. objBillsData', JSON.stringify(objBillsData[billId]));

					// if (!isEmpty(objBillsData[billId].num)) {
					// 	StrdObj.RfrdDocInf.Nb = objBillsData[billId].num;
					// } else if (!isEmpty(objBillsData[billId].trnxnumber)) {
					// 	StrdObj.RfrdDocInf.Nb = objBillsData[billId].trnxnumber;
					// }
					StrdObj.RfrdDocInf.Nb = billPaymentTranId; //objBillsData[billId].num;

					var invoiceDate = objBillsData[billId].dte;
					StrdObj.RfrdDocInf.RltdDt = formatDate(nlapiStringToDate(invoiceDate));
					StrdObj.RfrdDocAmt = {};
					StrdObj.RfrdDocAmt.DuePyblAmt = {};
					StrdObj.RfrdDocAmt.DscntApldAmt = {};
					StrdObj.RfrdDocAmt.RmtdAmt = {};
					StrdObj.RfrdDocAmt.DuePyblAmt.value = origAmt.toFixed(2);

					if (discAmt == 0) discAmt = '';
					else discAmt = discAmt.toFixed(2);

					StrdObj.RfrdDocAmt.DscntApldAmt.value = discAmt;
					StrdObj.RfrdDocAmt.RmtdAmt.value = netAmt.toFixed(2);

					StrdObj.RfrdDocAmt.DuePyblAmt.Ccy = symbol;
					StrdObj.RfrdDocAmt.DscntApldAmt.Ccy = symbol;
					StrdObj.RfrdDocAmt.RmtdAmt.Ccy = symbol;

					//Add CDtrRefInf
					StrdObj.CdtrRefInf = {};
					StrdObj.CdtrRefInf.Tp = {};
					StrdObj.CdtrRefInf.CdOrPrtry = {};
					StrdObj.CdtrRefInf.CdOrPrtry.Cd = 'PUOR';
					StrdObj.CdtrRefInf.Ref = objBillsData[billId].num; //objBillsData[billId].memo;

					Strd.push(StrdObj);

					if (!isEmpty(arrBillCredits[billId])) {
						var arrBC = arrBillCredits[billId];

						for (bc in arrBC) {
							var billCreditAmtP = getFloatVal(arrBC[bc].bcamt);
							var billCreditAmt = billCreditAmtP;

							tmpAmt = tmpAmt - billCreditAmtP;
							netAmt = netAmt - billCreditAmtP;

							var StrdObj = {};
							StrdObj.RfrdDocInf = {};
							StrdObj.RfrdDocInf.Tp = {};
							StrdObj.RfrdDocInf.Tp.CdOrPrtry = {};
							StrdObj.RfrdDocInf.Tp.CdOrPrtry.Cd = 'CREN'; //Hardcoded?
							StrdObj.RfrdDocInf.Ref = objBillsData[billId].num;

							var bcNum = arrBC[bc].bcnum;
							dLog('createJPMXMLDoc', 'VC number : ' + bcNum);

							if (!isEmpty(bcNum)) StrdObj.RfrdDocInf.Nb = bcNum;
							else if (!isEmpty(arrBillCredits[billId].bcmemo)) {
								StrdObj.RfrdDocInf.Nb = arrBillCredits[billId].bcmemo;
							}

							var invoiceDate = objBillsData[billId].dte;
							StrdObj.RfrdDocInf.RltdDt = formatDate(nlapiStringToDate(arrBC[bc].bcdate));

							StrdObj.RfrdDocAmt = {};
							StrdObj.RfrdDocAmt.DuePyblAmt = {};
							StrdObj.RfrdDocAmt.DscntApldAmt = {};
							StrdObj.RfrdDocAmt.RmtdAmt = {};

							StrdObj.RfrdDocAmt.DuePyblAmt.value = billCreditAmt.toFixed(2);
							if (discAmt == 0) discAmt = '';
							else discAmt = discAmt.toFixed(2);

							StrdObj.RfrdDocAmt.DscntApldAmt.value = discAmt;
							StrdObj.RfrdDocAmt.RmtdAmt.value = billCreditAmt.toFixed(2);

							StrdObj.RfrdDocAmt.DuePyblAmt.Ccy = symbol;
							StrdObj.RfrdDocAmt.DscntApldAmt.Ccy = symbol;
							StrdObj.RfrdDocAmt.RmtdAmt.Ccy = symbol;

							Strd.push(StrdObj);
						}
					}
				}
				dLog('createRBC_DAC_XMLDoc.Strd', JSON.stringify(Strd));
				dLog('createRBC_DAC_XMLDoc.objVendor', JSON.stringify(objVendor));

				if (paymentMethod == 'DAC' || paymentMethod == 'MTS') {
					cdtTrfTxInfObj.CdtrAgt = {};
					cdtTrfTxInfObj.CdtrAgt.FinInstnId = {};
					// cdtTrfTxInfObj.CdtrAgt.FinInstnId.BIC = objVendor.recbankprimid;
					cdtTrfTxInfObj.CdtrAgt.FinInstnId.ClrSysMmbId = {};
					cdtTrfTxInfObj.CdtrAgt.FinInstnId.ClrSysMmbId.MmbId = objVendor.recbankprimid; // Receiving Bank Routing
					cdtTrfTxInfObj.CdtrAgt.ClrSysId = {};
					cdtTrfTxInfObj.CdtrAgt.ClrSysId.Cd = 'CACPA';

					cdtTrfTxInfObj.CdtrAgt.FinInstnId.Nm = objVendor.vbankname;
					if (objVendor.vbankcountry || objVendor.vbankaddrs1 || objVendor.vbankzip || objVendor.vbankcity || objVendor.vbankstate) {
						cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr = {};
						cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.Ctry = countryCodeMapping[objVendor.vbankcountry];
						cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.AdrLine = objVendor.vbankaddrs1;
						cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.StrtNm = objVendor.vbankaddrs1;
						cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.PstCd = objVendor.vbankzip;
						cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.TwnNm = objVendor.vbankcity;
						cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.BldgNb = '';
						cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.CtrySubDvsn = objVendor.vbankstate;
					}

					if (paymentMethod == 'MTS') {
						cdtTrfTxInfObj.CdtrAgt.InstrForCdtrAgt = {};
						cdtTrfTxInfObj.CdtrAgt.InstrForCdtrAgt.InstrInf = objVendor.custentity_ica_vendor_bank_instructions;
					}
				}

				cdtTrfTxInfObj.Cdtr = {};
				cdtTrfTxInfObj.Cdtr.Nm = objVendor.vendorname;
				if (objVendor.vendoraddrs1 || objVendor.vendoraddrs2 || objVendor.vendorpostal || objVendor.vendorcity || objVendor.vendorstateprovince || countryCodeMapping[objVendor.vendorcountrycode]) {
					cdtTrfTxInfObj.Cdtr.PstlAdr = {};
					cdtTrfTxInfObj.Cdtr.PstlAdr.StrtNm = objVendor.vendoraddrs1;
					cdtTrfTxInfObj.Cdtr.PstlAdr.BldgNb = objVendor.vendoraddrs2 || '';
					cdtTrfTxInfObj.Cdtr.PstlAdr.PstCd = objVendor.vendorpostal;
					cdtTrfTxInfObj.Cdtr.PstlAdr.TwnNm = objVendor.vendorcity;
					cdtTrfTxInfObj.Cdtr.PstlAdr.CtrySubDvsn = objVendor.vendorstateprovince;
					cdtTrfTxInfObj.Cdtr.PstlAdr.Ctry = countryCodeMapping[objVendor.vendorcountrycode];
				}

				if (paymentMethod == 'DAC' || paymentMethod == 'MTS') {
					cdtTrfTxInfObj.CdtrAcct = {};
					cdtTrfTxInfObj.CdtrAcct.Id = {};
					cdtTrfTxInfObj.CdtrAcct.Id.Othr = {};
					cdtTrfTxInfObj.CdtrAcct.Id.Othr.Id = objVendor.recpartyaccount;

					if (paymentMethod == 'DAC') {
						cdtTrfTxInfObj.CdtrAcct.Tp = {};
						cdtTrfTxInfObj.CdtrAcct.Tp.Cd = 'CACC';
					}
				}

				// cdtTrfTxInfObj.RltdAmtInf = {};
				// cdtTrfTxInfObj.RltdAmtInf.RmtLctnMtd = objVendor.pmp_dac_contactname || "";
				// cdtTrfTxInfObj.RltdAmtInf.RmtLctnElctrncAdr = objVendor.pmp_dac_emailaddress || "";
				if (paymentMethod == 'CHK' || paymentMethod == 'DAC') {
					dLog('objVendor.custentity_ica_vendor_bank_instructions', objVendor.custentity_ica_vendor_bank_instructions);
					cdtTrfTxInfObj.RmtInf = {};
					cdtTrfTxInfObj.RmtInf.Ustrd = objVendor.custentity_ica_vendor_bank_instructions; //
					cdtTrfTxInfObj.RmtInf.Strd = Strd;
				}

				if (paymentMethod == 'DAC') {
					if (objVendor.pmp_dac_emailaddress || objVendor.pmp_dac_contactname) {
						cdtTrfTxInfObj.RltdRmtInf = {};
						cdtTrfTxInfObj.RltdRmtInf.RmtLctnElctrncAdr = objVendor.pmp_dac_emailaddress;
						cdtTrfTxInfObj.RltdRmtInf.RmtLctnPstlAdr = {};
						cdtTrfTxInfObj.RltdRmtInf.RmtLctnPstlAdr.Nm = objVendor.pmp_dac_contactname;
					}
				}
				dLog('cdtTrfTxInfObj', JSON.stringify(cdtTrfTxInfObj));
				CdtTrfTxInf.push(cdtTrfTxInfObj);
			}
			PmtInfObj.NbOfTxs = noOfBillPayments;
			PmtInfObj.CtrlSum = totalCtrlSum.toFixed(2); //RSF
			PmtInfObj.CdtTrfTxInf = CdtTrfTxInf;
			PmtInf.push(PmtInfObj);
		}
	}
	objects.PmtInf = PmtInf;
	// objects.CdtTrfTxInf = CdtTrfTxInf;
	dLog('objects.PmtInf', JSON.stringify(objects.PmtInf));
	// dLog('objects.CdtTrfTxInf', JSON.stringify(objects.CdtTrfTxInf));

	var fileId = nlapiSearchRecord('file', null, [['name', 'is', 'ica_rbc_dac.xml']], []);
	if (fileId != null) {
		fileId = fileId[0].getId();
	}

	var tmplFile = nlapiLoadFile(fileId);

	var template = Handlebars.compile(tmplFile.getValue());
	var xmlDoc = template(objects);

	dLog('xmlDoc', xmlDoc);
	return xmlDoc;
}

function createBNS_DAC_XMLDoc(objAcctMapping) {
	var arrTempBillIds = [];
	var arrBillCRIds = [];
	var arrBillAmt = [];
	var arrBillAmtOrig = [];
	var arrBillDiscAmt = [];
	var arrBillPayInfoCtr = [];
	var arrBillPayInfoSum = [];
	var arrGrpHdrNbOfTxs = [];
	var arrPmtInfNbOfTxs = [];
	var arrBillIds = [];
	var grpHdrNbOfTxs = 0;
	var grpHdrCtrlSum = 0;
	var arrPayeeIds = [];
	var _currencies = getCurrencies();

	for (x in arrBillsProcessed) {
		var billId = arrBillsProcessed[x].id;
		var billPaymentId = arrBillsProcessed[x].payment;

		dLog('createBNS_DAC_XMLDoc', 'Bill info = ' + JSON.stringify(arrBillsProcessed[x]));
		if (!isEmpty(billPaymentId) && billPaymentId != 'XXXNONEXXX' && billPaymentId != 'CREDIT') {
			if (billPaymentId != 'CREDIT') arrTempBillIds.push(billId);

			var payMethod = arrBillsProcessed[x].paymethod;
			var paymentId = arrBillsProcessed[x].payment;
			var payeeId = arrBillsProcessed[x].payeeid;

			arrBillAmtOrig[billId] = arrBillsProcessed[x].origamt;
			// arrBillAmt[billId] = arrBillsProcessed[x].pay;
			arrBillAmt[billId] = arrBillsProcessed[x].payamt;
			arrBillDiscAmt[billId] = arrBillsProcessed[x].discamt;

			var ndx = payMethod + '@@' + paymentId;

			if (arrBillPayInfoCtr[payMethod] == null) arrBillPayInfoCtr[payMethod] = 0;
			if (arrBillPayInfoSum[payMethod] == null) arrBillPayInfoSum[payMethod] = 0;
			if (arrPmtInfNbOfTxs[ndx] == null) arrPmtInfNbOfTxs[ndx] = 0;

			if (paymentId && arrGrpHdrNbOfTxs[paymentId] == null) grpHdrNbOfTxs++;

			arrPmtInfNbOfTxs[ndx]++;
			arrBillPayInfoCtr[payMethod]++;
			arrBillPayInfoSum[payMethod] += getFloatVal(arrBillsProcessed[x].payamt);
			arrGrpHdrNbOfTxs[paymentId] = paymentId;

			grpHdrCtrlSum += getFloatVal(arrBillsProcessed[x].payamt);
		}

		if (billPaymentId == 'CREDIT') arrBillCRIds.push(billId);
	}

	var arrBillIds = [];
	var arrBillIds2 = [];
	var arrBillIds3 = [];
	var arrBillIds4 = [];
	var arrBillIds5 = [];

	for (vx in arrTempBillIds) {
		var isBC = false;

		for (var x in arrBillCRIds) {
			if (arrTempBillIds[vx] == arrBillCRIds[x]) {
				isBC = true;
				break;
			}
		}

		if (!isBC) {
			arrBillIds.push(arrTempBillIds[vx]);
			arrBillIds2.push(arrTempBillIds[vx]);
			arrBillIds3.push(arrTempBillIds[vx]);
			arrBillIds4.push(arrTempBillIds[vx]);
			arrBillIds5.push(arrTempBillIds[vx]);
		}
	}

	var arrBillCredits = getBillCredit(arrBillIds);
	var objBillsData = getBillData(arrBillIds2);
	var arrBillPO = getPOMap(arrBillIds3);
	var arrVendorBills = getPayeeBillsByPayMethod(arrBillIds4);
	var arrVendorBillsCurr = getPayeeBillsCurrency(arrBillIds5);
	var nsAcctSub = !isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('subsidiary', 'CUSTRECORD_ACCT_MAP_NETSUITE_ACCOUNT')) ? objAcctMapping[0].getValue('subsidiary', 'CUSTRECORD_ACCT_MAP_NETSUITE_ACCOUNT') : '';
	// var nsAcctSub
	var objVDCRecResults = getVendorDAC_CCRPaymentRec(nsAcctSub);
	dLog('objVDCRecResults', JSON.stringify(objVDCRecResults));
	dLog('objAcctMapping', JSON.stringify(objAcctMapping));

	//Gather data.
	var CdtTrfTxInf = [];

	var objects = {
		MsgId: 'TBD',
		CreDtTm: 'Test',
		Authstn: {
			Cd: '',
		},
		NbOfTxs: '2',
		CtrlSum: '2000',
		InitgPty: {
			Id: {
				OrgId: {
					Othr: {
						Id: '',
					},
				},
			},
		},
		PmtInfId: 'PmtInfId',
		PmtMtd: 'PmtMtd',
		PmtTpInf: {
			SvcLvl: {
				Cd: 'This is CD',
			},
		},
		ReqdExctnDt: 'ReqdExctnDt',
		Dbtr: {
			Nm: 'This is Nm',
			PstlAdr: {
				StrtNm: '',
				BldgNb: '',
				PstCd: '',
				TwnNm: '',
				CtrySubDvsn: '',
				Ctry: '',
			},
			Id: {
				Othr: {
					Id: 'Dbtr.Id.Othr.Id',
				},
			},
		},
		DbtrAcct: {
			Id: {
				Othr: {
					Id: 'DbtrAcct.Id.Othr.Id',
				},
			},
			PstlAdr: {
				StrtNm: '',
				BldgNb: '',
				PstCd: '',
				TwnNm: '',
				CtrySubDvsn: '',
				Ctry: '',
			},
		},
		DbtrAgt: {
			FinInstnId: {
				BIC: 'BIC',
				PstlAdr: {
					StrtNm: '',
					BldgNb: '',
					PstCd: '',
					TwnNm: '',
					CtrySubDvsn: '',
					Ctry: '',
				},
			},
		},
		CdtTrfTxInf: CdtTrfTxInf,
	};

	for (x in arrVendorBills) {
		var payeeId = x.split('X@X')[1];
		arrPayeeIds.push(payeeId);
	}

	var arrVendors = getEntityData(arrPayeeIds);

	var today = new Date();
	var bpmdate = BPM_DATE;
	var d = nlapiStringToDate(bpmdate, 'datetime');

	var fileCtrlNumber = Date.create().format('{yy}{MM}{dd}{mm}{ss}');
	objects.MsgId = pad(fileCtrlNumber, 4);
	objects.CreDtTm = moment(d).format('YYYY-MM-DDThh:mm:ss') || today.format('{yyyy}-{MM}-{dd}T{hh}:{mm}:{ss}');
	objects.Authstn.Cd = 'AUTH';
	objects.NbOfTxs = grpHdrNbOfTxs;
	objects.CtrlSum = grpHdrCtrlSum.toFixed(2); // Do we comment this out?

	if (objects.CtrlSum == '0.00') {
		dLog('CtrlSum is 0.00, this should not happen. Returning empty file', objects.CtrlSum);
		return '';
	}

	if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ceo_company_id'))) {
		objects.InitgPty.Id.OrgId.Othr.Id = objAcctMapping[0].getValue('custrecord_acct_map_ceo_company_id'); //CEO ID
	}

	for (x in arrBillPayInfoCtr) {
		objects.PmtInfId = fileCtrlNumber;
		var paymentMethod = x;
		objects.PmtMtd = 'TRF';

		objects.PmtTpInf.SvcLvl.Cd = paymentMethod == 'DAC' ? 'NURG' : 'URGP';
		objects.ReqdExctnDt = moment(d).format('YYYY-MM-DD') || today.format('{yyyy}-{MM}-{dd}');

		if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_companyname'))) objects.Dbtr.Nm = objVDCRecResults[0].getValue('custrecord_companyname');

		//PstlAdr
		var country = !isEmpty(objVDCRecResults) ? objVDCRecResults[0].getValue('custrecord_compcountrycode') : '';

		if (
			(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_comppostcode'))) ||
			(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compcity'))) ||
			(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compstateprov'))) ||
			(!isEmpty(objVDCRecResults) && objVDCRecResults[0].getValue('custrecord_compcountrycode')) ||
			(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compadd1')))
		) {
			if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compadd1'))) {
				objects.Dbtr.PstlAdr.StrtNm = '<AdrLine>' + objVDCRecResults[0].getValue('custrecord_compadd1') + '</AdrLine>';
			}
			if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compadd2'))) {
				objects.Dbtr.PstlAdr.BldgNb = '<BldgNb>' + objVDCRecResults[0].getValue('custrecord_compadd2') + '</BldgNb>';
			}

			if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_comppostcode'))) {
				objects.Dbtr.PstlAdr.PstCd = '<PstCd>' + objVDCRecResults[0].getValue('custrecord_comppostcode') + '</PstCd>';
			}
			// addTextNodeFromParentNode(xmlDoc, pstlAdr, 'PstCd', objVDCRecResults[0].getValue('custrecord_comppostcode'));

			if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compcity'))) {
				objects.Dbtr.PstlAdr.TwnNm = '<TwnNm>' + objVDCRecResults[0].getValue('custrecord_compcity') + '</TwnNm>';
			}
			// addTextNodeFromParentNode(xmlDoc, pstlAdr, 'TwnNm', objVDCRecResults[0].getValue('custrecord_compcity'));

			//Where do we get CtrySubDvsn?
			if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compstateprov'))) {
				objects.Dbtr.PstlAdr.TwnNm = '<CtrySubDvsn>' + objVDCRecResults[0].getValue('custrecord_compstateprov') + '</CtrySubDvsn>';
			}

			// addTextNodeFromParentNode(xmlDoc, pstlAdr, 'Ctry', country);
			if (country) {
				objects.Dbtr.PstlAdr.Ctry = '<Ctry>' + country + '</Ctry>';
			}
			dLog('Added Ctry', JSON.stringify(objects));

			// addTextNodeFromParentNode(xmlDoc, pstlAdr, 'AdrLine', objVDCRecResults[0].getValue('custrecord_compadd1'));
			// objects.Dbtr.PstlAdr.BldgNb = '2'; not used
		}

		if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_dom_ach_co_id'))) {
			objects.Dbtr.Id = {};
			objects.Dbtr.Id.Othr = {};
			objects.Dbtr.Id.Othr.Id = objAcctMapping[0].getValue('custrecord_acct_map_dom_ach_co_id'); //ACH Company ID
		}

		//DbtrAcct
		if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_origin_acc'))) {
			objects.DbtrAcct = {};
			objects.DbtrAcct.Id = {};
			objects.DbtrAcct.Id.Othr = {};
			objects.DbtrAcct.Id.Othr.Id = objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_origin_acc'); // Bank Account Number

			var symbol = '';
			try {
				symbol = _.find(_currencies, { internalid: String(objAcctMapping[0].getValue('custrecord_acct_map_account_currency')) }).symbol;
				objects.DbtrAcct.Ccy = symbol; //objAcctMapping[0].getValue('custrecord_acct_map_account_currency') || ''; // Bank Currency
				dAudit('DbtrAcct.Ccy', objAcctMapping[0].getValue('custrecord_acct_map_account_currency'));
				dAudit('DbtrAcct.Ccy', JSON.stringify(_currencies));
			} catch (e) {}
		}

		//DbtrAgt
		if ((!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id'))) || !isEmpty(country)) {
			if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id'))) {
				// objects.DbtrAgt.FinInstnId.BIC = objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id');

				objects.DbtrAgt = {};
				objects.DbtrAgt.Nm = objVDCRecResults[0].getValue('custrecord_bankname') || '';
				objects.DbtrAgt.FinInstnId = {};
				objects.DbtrAgt.FinInstnId.ClrSysMmbId = {};
				objects.DbtrAgt.FinInstnId.ClrSysMmbId.MmbId = objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id'); // Routing Number 10 Digit
			}
			objects.DbtrAgt.FinInstnId.PstlAdr = {};
			objects.DbtrAgt.FinInstnId.PstlAdr.Ctry = 'CA';
		}

		//CdtTrfTxInf loop starts here.

		if (SINGLEBILLPYMTS == 'T') {
			dAudit('Create Single Bill Payments here.', JSON.stringify(arrBillsProcessed));

			for (var i = 0; i < arrBillsProcessed.length; i++) {
				var billPayment = arrBillsProcessed[i];

				if (billPayment.payment == 'CREDIT') {
					continue;
				}

				var symbol = '';

				try {
					symbol = _.find(_currencies, { internalid: String(billPayment.currid) }).symbol;
				} catch (e) {}

				var objVendor = arrVendors[billPayment.payeeid];
				if (!objVendor) objVendor = _.find(arrVendors, { internalid: String(billPayment.payeeid) });

				dLog('objVendor', JSON.stringify(objVendor));

				var cdtTrfTxInfObj = {};
				cdtTrfTxInfObj.PmtId = {};

				var refnum = billPayment.refnum; //arrBillPaymentMap[billPayment.payeeid];
				// var refnum = billPayment.billnum; //arrBillPaymentMap[billPayment.payeeid];
				var instrId = '';
				if (refnum.length > 12) {
					instrId = pz(refnum.substring(refnum.length - 12, refnum.length), 12);
				} else {
					instrId = pz(refnum, 12);
				}
				refnum = billPayment.billnum; //Overwrite endToendID
				var endToEndId = refnum;
				if (refnum.length > 18) {
					endToEndId = refnum.substr(0, 18);
				}

				cdtTrfTxInfObj.PmtId.InstrId = instrId;
				cdtTrfTxInfObj.PmtId.EndToEndId = endToEndId;
				cdtTrfTxInfObj.Amt = {};
				cdtTrfTxInfObj.Amt.value = billPayment.payamt; //amt.toFixed(2);
				cdtTrfTxInfObj.Amt.Ccy = symbol;
				// cdtTrfTxInfObj.ChrgBr = (billPayment.paymethod == 'AUCR') ? 'CRED' : 'DEBT';

				cdtTrfTxInfObj.CdtrAgt = {};
				cdtTrfTxInfObj.CdtrAgt.FinInstnId = {};
				// cdtTrfTxInfObj.CdtrAgt.FinInstnId.BIC = objVendor.recbankprimid;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.ClrSysMmbId = {};
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.ClrSysMmbId.MmbId = objVendor.recbankprimid; //objVendor.bankid; // Receiving Bank Routing
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.Nm = objVendor.vbankname;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr = {};
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.Ctry = countryCodeMapping[objVendor.vbankcountry];
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.AdrLine = objVendor.vbankaddrs1;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.StrtNm = objVendor.vbankaddrs1;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.BldgNb = '';
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.PstCd = objVendor.vbankzip;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.TwnNm = objVendor.vbankcity;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.CtrySubDvsn = objVendor.vbankstate;

				cdtTrfTxInfObj.Cdtr = {};
				cdtTrfTxInfObj.Cdtr.Nm = objVendor.vendorname;
				cdtTrfTxInfObj.Cdtr.PstlAdr = {};
				cdtTrfTxInfObj.Cdtr.PstlAdr.StrtNm = objVendor.vendoraddrs1;
				cdtTrfTxInfObj.Cdtr.PstlAdr.BldgNb = objVendor.vendoraddrs2 || '';
				cdtTrfTxInfObj.Cdtr.PstlAdr.PstCd = objVendor.vendorpostal;
				cdtTrfTxInfObj.Cdtr.PstlAdr.TwnNm = objVendor.vendorcity;
				cdtTrfTxInfObj.Cdtr.PstlAdr.CtrySubDvsn = objVendor.vendorstateprovince;
				cdtTrfTxInfObj.Cdtr.PstlAdr.Ctry = countryCodeMapping[objVendor.vendorcountrycode];

				cdtTrfTxInfObj.CdtrAcct = {};
				cdtTrfTxInfObj.CdtrAcct.Id = {};
				cdtTrfTxInfObj.CdtrAcct.Id.Othr = {};
				cdtTrfTxInfObj.CdtrAcct.Id.Othr.Id = objVendor.recpartyaccount;

				// cdtTrfTxInfObj.RltdAmtInf = {};
				// cdtTrfTxInfObj.RltdAmtInf.RmtLctnMtd = objVendor.pmp_dac_contactname || "";
				// cdtTrfTxInfObj.RltdAmtInf.RmtLctnElctrncAdr = objVendor.pmp_dac_emailaddress || "";
				cdtTrfTxInfObj.RmtInf = {};
				cdtTrfTxInfObj.RmtInf.Ustrd = refnum;
				cdtTrfTxInfObj.RmtInf.VendorId = objVendor.entityid;
				cdtTrfTxInfObj.RmtInf.Category = objVendor.category;

				cdtTrfTxInfObj.RmtInf.Strd = Strd;

				CdtTrfTxInf.push(cdtTrfTxInfObj);
			}
		} else {
			dAudit('arrVendorBills', arrVendorBills);
			var refnum = '';
			var currency = '';
			var symbol = '';

			for (v in arrVendorBills) {
				var arrPayeeInfo = v.split('X@X');
				var payeeId = arrPayeeInfo[1];

				//var objVendor=arrVendors[payeeId];
				       var objVendor = _.find(arrVendors, { internalid: String(payeeId)});
				// var objVendor = _.find(arrVendors, { internalid: String(payeeId), paymentmethod: String(paymentMethod) })[0];
dAudit('objVendor-new', objVendor);				dLog('objVendor', JSON.stringify(objVendor));

				if (isEmpty(objVendor)) continue;

				var pmtMethod = objVendor.paymentmethod;

				if (paymentMethod != pmtMethod) continue;

				var arrBills = arrVendorBills[paymentMethod + 'X@X' + payeeId];
				dLog('arrBills', JSON.stringify(arrBills));
				var tmpAmt = 0;

				var numberOfBills = _.size(arrBills);
				for (by in arrBills) {
					var billId = arrBills[by];
					refnum = _.find(arrBillsProcessed, { id: String(billId) }).refnum;
					currency = _.find(arrBillsProcessed, { id: String(billId) }).currid;
					subtext = _.find(arrBillsProcessed, { id: String(billId) }).subtext;
					billnum = _.find(arrBillsProcessed, { id: String(billId) }).billnum;

					dLog('billnum', billnum);

					try {
						symbol = _.find(_currencies, { internalid: String(currency) }).symbol;
					} catch (e) {}
					dLog('createBNS_DAC_XMLDoc', JSON.stringify(refnum));

					var netAmt = 0;
					var origAmt = getFloatVal(arrBillAmtOrig[billId]);
					var amt = getFloatVal(arrBillAmt[billId]);

					var discAmt = !isEmpty(arrBillDiscAmt[billId]) ? getFloatVal(arrBillDiscAmt[billId]) : 0;

					dLog(
						'amounts',
						JSON.stringify({
							netAmt: netAmt,
							origAmt: origAmt,
							amt: amt,
							discAmt: discAmt,
						})
					);

					netAmt = origAmt;
					tmpAmt += amt; //used to be netAmt

					if (discAmt > 0) {
						netAmt -= discAmt;
						tmpAmt -= discAmt;
					}

					if (!isEmpty(arrBillCredits[billId])) {
						var arrBC = arrBillCredits[billId];

						dLog('arrBC in arrBills', JSON.stringify(arrBC));

						for (bc in arrBC) {
							var billCreditAmtP = getFloatVal(arrBC[bc].bcamt);
							var billCreditAmt = billCreditAmtP * -1;

							// tmpAmt = (tmpAmt - billCreditAmtP);
							netAmt = netAmt - billCreditAmtP;
						}
					}
				}

				var cdtTrfTxInfObj = {};
				cdtTrfTxInfObj.PmtId = {};

				var refnum = arrBillPaymentMap[payeeId];
				var instrId = '';
				if (refnum.length > 12) {
					instrId = pz(refnum.substring(refnum.length - 12, refnum.length), 12);
				} else {
					instrId = pz(refnum, 12);
				}
				var endToEndId = billnum.substr(0, 18);
				if (numberOfBills > 1) {
					endToEndId = subtext.substr(0, 18);
				}
				//refnum

				cdtTrfTxInfObj.PmtId.InstrId = instrId;
				cdtTrfTxInfObj.PmtId.EndToEndId = endToEndId;
				cdtTrfTxInfObj.Amt = {};
				cdtTrfTxInfObj.Amt.value = tmpAmt.toFixed(2); //amt.toFixed(2);
				cdtTrfTxInfObj.Amt.Ccy = symbol;
				// cdtTrfTxInfObj.ChrgBr = (paymentMethod == 'AUCR') ? 'CRED' : 'DEBT';

				tmpAmt = 0; // need to initialize back to 0

				var Strd = [];

				for (y in arrBills) {
					var billId = arrBills[y];
					var StrdObj = {};
					StrdObj.RfrdDocInf = {};
					StrdObj.RfrdDocInf.Tp = {};
					StrdObj.RfrdDocInf.Tp.CdOrPrtry = {};
					StrdObj.RfrdDocInf.Tp.CdOrPrtry.Cd = 'CINV'; //Hardcoded?

					var netAmt = 0;
					var origAmt = getFloatVal(arrBillAmtOrig[billId]);
					var amt = getFloatVal(arrBillAmt[billId]);

					var discAmt = !isEmpty(arrBillDiscAmt[billId]) ? getFloatVal(arrBillDiscAmt[billId]) : 0;

					dLog('billId before', billId);
					dLog('arrBC in y.arrBills before', JSON.stringify(arrBillCredits));

					if (!isEmpty(arrBillCredits[billId])) {
						var arrBC = arrBillCredits[billId];

						dLog('arrBC in y.arrBills', JSON.stringify(arrBC));

						for (bc in arrBC) {
							var billCreditAmtP = getFloatVal(arrBC[bc].bcamt);
							var billCreditAmt = billCreditAmtP * -1;

							// tmpAmt = (tmpAmt - billCreditAmtP);
							netAmt = netAmt - billCreditAmtP;
						}
					}

					// tmpAmt += amt;
					netAmt = origAmt;
					tmpAmt += amt; //used to be netAmt

					if (discAmt > 0) {
						netAmt -= discAmt;
						tmpAmt -= discAmt;
					}

					dLog('createBNS_DAC_XMLDoc. objBillsData', JSON.stringify(objBillsData[billId]));

					if (!isEmpty(objBillsData[billId].num)) {
						StrdObj.RfrdDocInf.Nb = objBillsData[billId].num;
					} else if (!isEmpty(objBillsData[billId].trnxnumber)) {
						StrdObj.RfrdDocInf.Nb = objBillsData[billId].trnxnumber;
					}

					var invoiceDate = objBillsData[billId].dte;
					StrdObj.RfrdDocInf.RltdDt = formatDate(nlapiStringToDate(invoiceDate));
					StrdObj.RfrdDocAmt = {};
					StrdObj.RfrdDocAmt.DuePyblAmt = {};
					StrdObj.RfrdDocAmt.DscntApldAmt = {};
					StrdObj.RfrdDocAmt.RmtdAmt = {};
					StrdObj.RfrdDocAmt.DuePyblAmt.value = origAmt.toFixed(2);

					if (discAmt == 0) discAmt = '';
					else discAmt = discAmt.toFixed(2);

					StrdObj.RfrdDocAmt.DscntApldAmt.value = discAmt;
					StrdObj.RfrdDocAmt.RmtdAmt.value = netAmt.toFixed(2);

					StrdObj.RfrdDocAmt.DuePyblAmt.Ccy = symbol;
					StrdObj.RfrdDocAmt.DscntApldAmt.Ccy = symbol;
					StrdObj.RfrdDocAmt.RmtdAmt.Ccy = symbol;

					//Add CDtrRefInf
					StrdObj.CdtrRefInf = {};
					StrdObj.CdtrRefInf.Tp = {};
					StrdObj.CdtrRefInf.CdOrPrtry = {};
					StrdObj.CdtrRefInf.CdOrPrtry.Cd = 'PUOR';

					Strd.push(StrdObj);

					if (!isEmpty(arrBillCredits[billId])) {
						var arrBC = arrBillCredits[billId];

						for (bc in arrBC) {
							var billCreditAmtP = getFloatVal(arrBC[bc].bcamt);
							var billCreditAmt = billCreditAmtP;

							tmpAmt = tmpAmt - billCreditAmtP;
							netAmt = netAmt - billCreditAmtP;

							var StrdObj = {};
							StrdObj.RfrdDocInf = {};
							StrdObj.RfrdDocInf.Tp = {};
							StrdObj.RfrdDocInf.Tp.CdOrPrtry = {};
							StrdObj.RfrdDocInf.Tp.CdOrPrtry.Cd = 'CREN'; //Hardcoded?

							var bcNum = arrBC[bc].bcnum;
							dLog('createJPMXMLDoc', 'VC number : ' + bcNum);

							if (!isEmpty(bcNum)) StrdObj.RfrdDocInf.Nb = bcNum;
							else if (!isEmpty(arrBillCredits[billId].bcmemo)) {
								StrdObj.RfrdDocInf.Nb = arrBillCredits[billId].bcmemo;
							}

							var invoiceDate = objBillsData[billId].dte;
							StrdObj.RfrdDocInf.RltdDt = formatDate(nlapiStringToDate(arrBC[bc].bcdate));

							StrdObj.RfrdDocAmt = {};
							StrdObj.RfrdDocAmt.DuePyblAmt = {};
							StrdObj.RfrdDocAmt.DscntApldAmt = {};
							StrdObj.RfrdDocAmt.CdtNoteAmt = {};

							StrdObj.RfrdDocAmt.DuePyblAmt.value = billCreditAmt.toFixed(2);
							if (discAmt == 0) discAmt = '';
							else discAmt = discAmt.toFixed(2);

							StrdObj.RfrdDocAmt.DscntApldAmt.value = discAmt;
							StrdObj.RfrdDocAmt.CdtNoteAmt.value = billCreditAmt.toFixed(2);

							StrdObj.RfrdDocAmt.DuePyblAmt.Ccy = symbol;
							StrdObj.RfrdDocAmt.DscntApldAmt.Ccy = symbol;
							StrdObj.RfrdDocAmt.CdtNoteAmt.Ccy = symbol;

							Strd.push(StrdObj);
						}
					}
				}

				cdtTrfTxInfObj.CdtrAgt = {};
				cdtTrfTxInfObj.CdtrAgt.FinInstnId = {};
				// cdtTrfTxInfObj.CdtrAgt.FinInstnId.BIC = objVendor.recbankprimid;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.ClrSysMmbId = {};
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.ClrSysMmbId.MmbId = objVendor.recbankprimid; // Receiving Bank Routing
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.Nm = objVendor.vbankname;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr = {};
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.Ctry = countryCodeMapping[objVendor.vbankcountry];
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.AdrLine = objVendor.vbankaddrs1;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.StrtNm = objVendor.vbankaddrs1;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.PstCd = objVendor.vbankzip;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.TwnNm = objVendor.vbankcity;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.BldgNb = '';
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.CtrySubDvsn = objVendor.vbankstate;

				cdtTrfTxInfObj.Cdtr = {};
				cdtTrfTxInfObj.Cdtr.Nm = objVendor.vendorname;
				if (objVendor.vendoraddrs1 || objVendor.vendoraddrs2 || objVendor.vendorpostal || objVendor.vendorcity || objVendor.vendorstateprovince || countryCodeMapping[objVendor.vendorcountrycode]) {
					cdtTrfTxInfObj.Cdtr.PstlAdr = {};
					cdtTrfTxInfObj.Cdtr.PstlAdr.StrtNm = objVendor.vendoraddrs1;
					cdtTrfTxInfObj.Cdtr.PstlAdr.BldgNb = objVendor.vendoraddrs2 || '';
					cdtTrfTxInfObj.Cdtr.PstlAdr.PstCd = objVendor.vendorpostal;
					cdtTrfTxInfObj.Cdtr.PstlAdr.TwnNm = objVendor.vendorcity;
					cdtTrfTxInfObj.Cdtr.PstlAdr.CtrySubDvsn = objVendor.vendorstateprovince;
					cdtTrfTxInfObj.Cdtr.PstlAdr.Ctry = countryCodeMapping[objVendor.vendorcountrycode];
				}

				cdtTrfTxInfObj.CdtrAcct = {};
				cdtTrfTxInfObj.CdtrAcct.Id = {};
				cdtTrfTxInfObj.CdtrAcct.Id.Othr = {};
				cdtTrfTxInfObj.CdtrAcct.Id.Othr.Id = objVendor.recpartyaccount;

				// cdtTrfTxInfObj.RltdAmtInf = {};
				// cdtTrfTxInfObj.RltdAmtInf.RmtLctnMtd = objVendor.pmp_dac_contactname || "";
				// cdtTrfTxInfObj.RltdAmtInf.RmtLctnElctrncAdr = objVendor.pmp_dac_emailaddress || "";
				cdtTrfTxInfObj.RmtInf = {};
				cdtTrfTxInfObj.RmtInf.Ustrd = refnum;
				cdtTrfTxInfObj.RmtInf.VendorId = objVendor.entityid;
				cdtTrfTxInfObj.RmtInf.Category = objVendor.category;
				cdtTrfTxInfObj.RmtInf.Strd = Strd;

				CdtTrfTxInf.push(cdtTrfTxInfObj);
			}
		}
	}
	objects.CdtTrfTxInf = CdtTrfTxInf;

	dLog('objects', JSON.stringify(objects));

	var fileId = nlapiSearchRecord('file', null, [['name', 'is', 'ica_bns_dac.xml']], []);
	if (fileId != null) {
		fileId = fileId[0].getId();
	}

	var tmplFile = nlapiLoadFile(fileId);

	var template = Handlebars.compile(tmplFile.getValue());
	var xmlDoc = template(objects);

	dLog('xmlDoc', xmlDoc);
	return xmlDoc;
}

function createBNS_MTS_XMLDoc(objAcctMapping) {
	var arrTempBillIds = [];
	var arrBillCRIds = [];
	var arrBillAmt = [];
	var arrBillAmtOrig = [];
	var arrBillDiscAmt = [];
	var arrBillPayInfoCtr = [];
	var arrBillPayInfoSum = [];
	var arrGrpHdrNbOfTxs = [];
	var arrPmtInfNbOfTxs = [];
	var arrBillIds = [];
	var grpHdrNbOfTxs = 0;
	var grpHdrCtrlSum = 0;
	var arrPayeeIds = [];
	var _currencies = getCurrencies();

	for (x in arrBillsProcessed) {
		var billId = arrBillsProcessed[x].id;
		var billPaymentId = arrBillsProcessed[x].payment;

		dLog('createBNS_MTS_XMLDoc', 'Bill info = ' + JSON.stringify(arrBillsProcessed[x]));
		if (!isEmpty(billPaymentId) && billPaymentId != 'XXXNONEXXX' && billPaymentId != 'CREDIT') {
			if (billPaymentId != 'CREDIT') arrTempBillIds.push(billId);

			var payMethod = arrBillsProcessed[x].paymethod;
			var paymentId = arrBillsProcessed[x].payment;
			var payeeId = arrBillsProcessed[x].payeeid;

			arrBillAmtOrig[billId] = arrBillsProcessed[x].origamt;
			// arrBillAmt[billId] = arrBillsProcessed[x].pay;
			arrBillAmt[billId] = arrBillsProcessed[x].payamt;
			arrBillDiscAmt[billId] = arrBillsProcessed[x].discamt;

			var ndx = payMethod + '@@' + paymentId;

			if (arrBillPayInfoCtr[payMethod] == null) arrBillPayInfoCtr[payMethod] = 0;
			if (arrBillPayInfoSum[payMethod] == null) arrBillPayInfoSum[payMethod] = 0;
			if (arrPmtInfNbOfTxs[ndx] == null) arrPmtInfNbOfTxs[ndx] = 0;

			if (paymentId && arrGrpHdrNbOfTxs[paymentId] == null) grpHdrNbOfTxs++;

			arrPmtInfNbOfTxs[ndx]++;
			arrBillPayInfoCtr[payMethod]++;
			arrBillPayInfoSum[payMethod] += getFloatVal(arrBillsProcessed[x].payamt);
			arrGrpHdrNbOfTxs[paymentId] = paymentId;

			grpHdrCtrlSum += getFloatVal(arrBillsProcessed[x].payamt);
		}

		if (billPaymentId == 'CREDIT') arrBillCRIds.push(billId);
	}

	var arrBillIds = [];
	var arrBillIds2 = [];
	var arrBillIds3 = [];
	var arrBillIds4 = [];
	var arrBillIds5 = [];

	for (vx in arrTempBillIds) {
		var isBC = false;

		for (var x in arrBillCRIds) {
			if (arrTempBillIds[vx] == arrBillCRIds[x]) {
				isBC = true;
				break;
			}
		}

		if (!isBC) {
			arrBillIds.push(arrTempBillIds[vx]);
			arrBillIds2.push(arrTempBillIds[vx]);
			arrBillIds3.push(arrTempBillIds[vx]);
			arrBillIds4.push(arrTempBillIds[vx]);
			arrBillIds5.push(arrTempBillIds[vx]);
		}
	}

	var arrBillCredits = getBillCredit(arrBillIds);
	var objBillsData = getBillData(arrBillIds2);
	var arrBillPO = getPOMap(arrBillIds3);
	var arrVendorBills = getPayeeBillsByPayMethod(arrBillIds4);
	var arrVendorBillsCurr = getPayeeBillsCurrency(arrBillIds5);
	var nsAcctSub = !isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('subsidiary', 'CUSTRECORD_ACCT_MAP_NETSUITE_ACCOUNT')) ? objAcctMapping[0].getValue('subsidiary', 'CUSTRECORD_ACCT_MAP_NETSUITE_ACCOUNT') : '';
	var objVDCRecResults = getVendorDAC_CCRPaymentRec(nsAcctSub);
	dLog('objVDCRecResults', JSON.stringify(objVDCRecResults));
	dLog('objAcctMapping', JSON.stringify(objAcctMapping));

	//Gather data.
	var CdtTrfTxInf = [];

	var objects = {
		MsgId: 'TBD',
		CreDtTm: 'Test',
		Authstn: {
			Cd: '',
		},
		NbOfTxs: '2',
		CtrlSum: '2000',
		InitgPty: {
			Id: {
				OrgId: {
					Othr: {
						Id: '',
					},
				},
			},
		},
		PmtInfId: 'PmtInfId',
		PmtMtd: 'PmtMtd',
		PmtTpInf: {
			SvcLvl: {
				Cd: 'This is CD',
			},
		},
		ReqdExctnDt: 'ReqdExctnDt',
		Dbtr: {
			Nm: 'This is Nm',
			PstlAdr: {
				StrtNm: '',
				BldgNb: '',
				PstCd: '',
				TwnNm: '',
				CtrySubDvsn: '',
				Ctry: '',
			},
			Id: {
				Othr: {
					Id: 'Dbtr.Id.Othr.Id',
				},
			},
		},
		DbtrAcct: {
			Id: {
				Othr: {
					Id: 'DbtrAcct.Id.Othr.Id',
				},
			},
			PstlAdr: {
				StrtNm: '',
				BldgNb: '',
				PstCd: '',
				TwnNm: '',
				CtrySubDvsn: '',
				Ctry: '',
			},
		},
		DbtrAgt: {
			FinInstnId: {
				BIC: 'BIC',
				PstlAdr: {
					StrtNm: '',
					BldgNb: '',
					PstCd: '',
					TwnNm: '',
					CtrySubDvsn: '',
					Ctry: '',
				},
			},
		},
		CdtTrfTxInf: CdtTrfTxInf,
	};

	for (x in arrVendorBills) {
		var payeeId = x.split('X@X')[1];
		arrPayeeIds.push(payeeId);
	}

	var arrVendors = getEntityData(arrPayeeIds);

	var today = new Date();
	var bpmdate = BPM_DATE;
	var d = nlapiStringToDate(bpmdate, 'datetime');

	var fileCtrlNumber = Date.create().format('{yy}{MM}{dd}{mm}{ss}');
	objects.MsgId = pad(fileCtrlNumber, 4);
	objects.CreDtTm = moment(d).format('YYYY-MM-DDThh:mm:ss') || today.format('{yyyy}-{MM}-{dd}T{hh}:{mm}:{ss}');
	objects.Authstn.Cd = 'AUTH'; // Changed from AUTH
	objects.NbOfTxs = grpHdrNbOfTxs;
	objects.CtrlSum = grpHdrCtrlSum.toFixed(2); // Do we comment this out?

	if (objects.CtrlSum == '0.00') {
		dLog('CtrlSum is 0.00, this should not happen. Returning empty file', objects.CtrlSum);
		return '';
	}

	if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ceo_company_id'))) {
		objects.InitgPty.Id.OrgId.Othr.Id = objAcctMapping[0].getValue('custrecord_acct_map_ceo_company_id'); //CEO ID
	}

	for (x in arrBillPayInfoCtr) {
		objects.PmtInfId = fileCtrlNumber;
		var paymentMethod = x;
		objects.PmtMtd = 'TRF';

		objects.PmtTpInf.SvcLvl.Cd = paymentMethod == 'MTS' ? 'URGP' : 'NURG';
		objects.ReqdExctnDt = moment(d).format('YYYY-MM-DD') || today.format('{yyyy}-{MM}-{dd}');

		if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_companyname'))) objects.Dbtr.Nm = objVDCRecResults[0].getValue('custrecord_companyname');

		//PstlAdr
		var country = !isEmpty(objVDCRecResults) ? objVDCRecResults[0].getValue('custrecord_compcountrycode') : '';

		if (
			(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_comppostcode'))) ||
			(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compcity'))) ||
			(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compstateprov'))) ||
			(!isEmpty(objVDCRecResults) && objVDCRecResults[0].getValue('custrecord_compcountrycode')) ||
			(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compadd1')))
		) {
			if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compadd1'))) {
				objects.Dbtr.PstlAdr.StrtNm = '<AdrLine>' + objVDCRecResults[0].getValue('custrecord_compadd1') + '</AdrLine>';
			}
			if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compadd2'))) {
				objects.Dbtr.PstlAdr.BldgNb = '<BldgNb>' + objVDCRecResults[0].getValue('custrecord_compadd2') + '</BldgNb>';
			}

			if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_comppostcode'))) {
				objects.Dbtr.PstlAdr.PstCd = '<PstCd>' + objVDCRecResults[0].getValue('custrecord_comppostcode') + '</PstCd>';
			}
			// addTextNodeFromParentNode(xmlDoc, pstlAdr, 'PstCd', objVDCRecResults[0].getValue('custrecord_comppostcode'));

			if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compcity'))) {
				objects.Dbtr.PstlAdr.TwnNm = '<TwnNm>' + objVDCRecResults[0].getValue('custrecord_compcity') + '</TwnNm>';
			}
			// addTextNodeFromParentNode(xmlDoc, pstlAdr, 'TwnNm', objVDCRecResults[0].getValue('custrecord_compcity'));

			//Where do we get CtrySubDvsn?
			if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compstateprov'))) {
				objects.Dbtr.PstlAdr.CtrySubDvsn = '<CtrySubDvsn>' + objVDCRecResults[0].getValue('custrecord_compstateprov') + '</CtrySubDvsn>';
			}

			// addTextNodeFromParentNode(xmlDoc, pstlAdr, 'Ctry', country);
			if (country) {
				objects.Dbtr.PstlAdr.Ctry = '<Ctry>' + country + '</Ctry>';
			}
			dLog('Added Ctry', JSON.stringify(objects));

			// addTextNodeFromParentNode(xmlDoc, pstlAdr, 'AdrLine', objVDCRecResults[0].getValue('custrecord_compadd1'));
			// objects.Dbtr.PstlAdr.BldgNb = '2'; not used
		}

		if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_dom_ach_co_id'))) {
			objects.Dbtr.Id = {};
			objects.Dbtr.Id.Othr = {};
			objects.Dbtr.Id.Othr.Id = objAcctMapping[0].getValue('custrecord_acct_map_dom_ach_co_id'); //ACH Company ID
		}

		//DbtrAcct
		if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_origin_acc'))) {
			objects.DbtrAcct = {};
			objects.DbtrAcct.Id = {};
			objects.DbtrAcct.Id.Othr = {};
			objects.DbtrAcct.Id.Othr.Id = objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_origin_acc'); // Bank Account Number
		}

		//DbtrAgt
		if ((!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id'))) || !isEmpty(country)) {
			objects.DbtrAgt = {};
			objects.DbtrAgt.FinInstnId = {};
			if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_hsbc_swift_bank_id'))) {
				objects.DbtrAgt.FinInstnId.BIC = objAcctMapping[0].getValue('custrecord_acct_map_hsbc_swift_bank_id');
			}
			if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id'))) {
				objects.DbtrAgt.FinInstnId.ClrSysMmbId = {};
				objects.DbtrAgt.FinInstnId.ClrSysMmbId.MmbId = objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id'); // Routing Number 10 Digit
			}
			objects.DbtrAgt.FinInstnId.PstlAdr = {};
			objects.DbtrAgt.FinInstnId.PstlAdr.Ctry = country;
		}

		//CdtTrfTxInf loop starts here.

		if (SINGLEBILLPYMTS == 'T') {
			dAudit('Create Single Bill Payments here.', JSON.stringify(arrBillsProcessed));

			for (var i = 0; i < arrBillsProcessed.length; i++) {
				var billPayment = arrBillsProcessed[i];

				if (billPayment.payment == 'CREDIT') {
					continue;
				}

				var symbol = '';

				try {
					symbol = _.find(_currencies, { internalid: String(billPayment.currid) }).symbol;
				} catch (e) {}

				var objVendor = arrVendors[billPayment.payeeid];
				if (!objVendor) objVendor = _.find(arrVendors, { internalid: String(billPayment.payeeid) });

				dLog('objVendor', JSON.stringify(objVendor));

				var cdtTrfTxInfObj = {};
				cdtTrfTxInfObj.PmtId = {};

				var refnum = billPayment.refnum; //arrBillPaymentMap[billPayment.payeeid];
				// var refnum = billPayment.billnum; //arrBillPaymentMap[billPayment.payeeid];
				var instrId = '';
				if (refnum.length > 12) {
					instrId = pz(refnum.substring(refnum.length - 12, refnum.length), 12);
				} else {
					instrId = pz(refnum, 12);
				}
				refnum = billPayment.billnum; //Overwrite endToendID
				var endToEndId = refnum;
				if (refnum.length > 18) {
					endToEndId = refnum.substr(0, 18);
				}

				cdtTrfTxInfObj.PmtId.InstrId = instrId;
				cdtTrfTxInfObj.PmtId.EndToEndId = endToEndId;
				cdtTrfTxInfObj.Amt = {};
				cdtTrfTxInfObj.Amt.value = billPayment.payamt; //amt.toFixed(2);
				cdtTrfTxInfObj.Amt.Ccy = symbol;
				cdtTrfTxInfObj.ChrgBr = 'CRED';

				cdtTrfTxInfObj.CdtrAgt = {};
				cdtTrfTxInfObj.CdtrAgt.FinInstnId = {};
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.BIC = objVendor.recbankprimid;
				if (objVendor.recbankprimidtype == 'ABA') {
					cdtTrfTxInfObj.CdtrAgt.FinInstnId.ClrSysMmbId = {};
					cdtTrfTxInfObj.CdtrAgt.FinInstnId.ClrSysMmbId.MmbId = objVendor.recbankprimid; // objVendor.bankid; // Receiving Bank Routing
				}
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.Nm = objVendor.vbankname;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr = {};
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.Ctry = countryCodeMapping[objVendor.vbankcountry];
				// cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.AdrLine = objVendor.vbankaddrs1;

				// if ( (isEmpty(objVendor.vbankaddrs1)) || (isEmpty(objVendor.vbankzip)) || (isEmpty(objVendor.vbankcity)) || (isEmpty(objVendor.vbankstate)) ) {
				// 	cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.StrtNm = '';
				// 	cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.BldgNb = '';
				// 	cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.PstCd = '';
				// 	cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.TwnNm = '';
				// 	cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.CtrySubDvsn = '';
				// }
				// else {
				// }
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.StrtNm = objVendor.vbankaddrs1 || '';
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.BldgNb = '';
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.PstCd = objVendor.vbankzip || '';
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.TwnNm = objVendor.vbankcity || '';
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.CtrySubDvsn = objVendor.vbankstate || '';

				if (objVendor.recbankprimidtype == 'SWT') {
					//SWT
					cdtTrfTxInfObj.CdtrAgt.FinInstnId.Othr = {};
					cdtTrfTxInfObj.CdtrAgt.FinInstnId.Othr.Id = objVendor.recbankprimid;
					dAudit('Should have set value', 'SWT');
				}

				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.CtrySubDvsn = objVendor.vbankstate;

				cdtTrfTxInfObj.Cdtr = {};
				cdtTrfTxInfObj.Cdtr.Nm = objVendor.vendorname;
				cdtTrfTxInfObj.Cdtr.PstlAdr = {};
				// if ( (isEmpty(objVendor.vendoraddrs1)) || (isEmpty(objVendor.vendorpostal)) || (isEmpty(objVendor.vendorcity)) || (isEmpty(objVendor.vendorstateprovince)) ) {
				// 	dLog('Here, should be empty', JSON.stringify(objVendor));
				// 	cdtTrfTxInfObj.Cdtr.PstlAdr.StrtNm = '';
				// 	cdtTrfTxInfObj.Cdtr.PstlAdr.BldgNb = "";
				// 	cdtTrfTxInfObj.Cdtr.PstlAdr.PstCd = '';
				// 	cdtTrfTxInfObj.Cdtr.PstlAdr.TwnNm = '';
				// 	cdtTrfTxInfObj.Cdtr.PstlAdr.CtrySubDvsn = '';
				// } else {
				// 	dLog('Here?', JSON.stringify(objVendor));
				// }
				cdtTrfTxInfObj.Cdtr.PstlAdr.StrtNm = objVendor.vendoraddrs1 || '';
				cdtTrfTxInfObj.Cdtr.PstlAdr.BldgNb = objVendor.vendoraddrs2 || '';
				cdtTrfTxInfObj.Cdtr.PstlAdr.PstCd = objVendor.vendorpostal || '';
				cdtTrfTxInfObj.Cdtr.PstlAdr.TwnNm = objVendor.vendorcity || '';
				cdtTrfTxInfObj.Cdtr.PstlAdr.CtrySubDvsn = objVendor.vendorstateprovince || '';

				cdtTrfTxInfObj.Cdtr.PstlAdr.Ctry = countryCodeMapping[objVendor.vendorcountrycode];

				// cdtTrfTxInfObj.CdtrAcct = {};
				// cdtTrfTxInfObj.CdtrAcct.Id = {};
				// cdtTrfTxInfObj.CdtrAcct.Id.Othr = {};
				// cdtTrfTxInfObj.CdtrAcct.Id.Othr.Id = objVendor.recpartyaccount;
				var chars = objVendor.recpartyaccount.substring(0, 2);
				dAudit('CHECK for IBAN: objVendor.recpartyaccount', objVendor.recpartyaccount);

				var iban = objVendor.custentity_ica_bns_use_iban;
				if (iban == 'T') {
					cdtTrfTxInfObj.CdtrAcct = {};
					cdtTrfTxInfObj.CdtrAcct.Id = {};
					cdtTrfTxInfObj.CdtrAcct.Id.IBAN = objVendor.recpartyaccount;
				} else {
					cdtTrfTxInfObj.CdtrAcct = {};
					cdtTrfTxInfObj.CdtrAcct.Id = {};
					cdtTrfTxInfObj.CdtrAcct.Id.Othr = {};
					cdtTrfTxInfObj.CdtrAcct.Id.Othr.Id = objVendor.recpartyaccount;
				}
				if (isAlpha(chars)) {
					//IBAN
				} else {
				}

				// cdtTrfTxInfObj.RltdAmtInf = {};
				// cdtTrfTxInfObj.RltdAmtInf.RmtLctnMtd = objVendor.pmp_dac_contactname || "";
				// cdtTrfTxInfObj.RltdAmtInf.RmtLctnElctrncAdr = objVendor.pmp_dac_emailaddress || "";
				cdtTrfTxInfObj.RmtInf = {};
				cdtTrfTxInfObj.RmtInf.Ustrd = refnum;
				cdtTrfTxInfObj.RmtInf.VendorId = objVendor.entityid;
				cdtTrfTxInfObj.RmtInf.Category = objVendor.category;
				cdtTrfTxInfObj.RmtInf.Strd = Strd;
				cdtTrfTxInfObj.UltmtCdtr = {};
				cdtTrfTxInfObj.UltmtCdtr.Nm = objVendor.vendorname;

				CdtTrfTxInf.push(cdtTrfTxInfObj);
			}
		} else {
			dAudit('arrVendorBills', arrVendorBills);
			var refnum = '';
			var currency = '';
			var symbol = '';

			for (v in arrVendorBills) {
				var arrPayeeInfo = v.split('X@X');
				var payeeId = arrPayeeInfo[1];

				//var objVendor=arrVendors[payeeId];
				       var objVendor = _.find(arrVendors, { internalid: String(payeeId)});
				// var objVendor = _.find(arrVendors, { internalid: String(payeeId), paymentmethod: String(paymentMethod) })[0];
dAudit('objVendor-new', objVendor);				dLog('objVendor', JSON.stringify(objVendor));

				if (isEmpty(objVendor)) continue;

				var pmtMethod = objVendor.paymentmethod;

				if (paymentMethod != pmtMethod) continue;

				var arrBills = arrVendorBills[paymentMethod + 'X@X' + payeeId];
				dLog('arrBills', JSON.stringify(arrBills));
				var tmpAmt = 0;

				var numberOfBills = _.size(arrBills);
				for (by in arrBills) {
					var billId = arrBills[by];
					refnum = _.find(arrBillsProcessed, { id: String(billId) }).refnum;
					currency = _.find(arrBillsProcessed, { id: String(billId) }).currid;
					subtext = _.find(arrBillsProcessed, { id: String(billId) }).subtext;
					billnum = _.find(arrBillsProcessed, { id: String(billId) }).billnum;

					try {
						symbol = _.find(_currencies, { internalid: String(currency) }).symbol;
					} catch (e) {}
					// dLog('createAUACHXMLDocrefnum', JSON.stringify(refnum));

					var netAmt = 0;
					var origAmt = getFloatVal(arrBillAmtOrig[billId]);
					var amt = getFloatVal(arrBillAmt[billId]);

					var discAmt = !isEmpty(arrBillDiscAmt[billId]) ? getFloatVal(arrBillDiscAmt[billId]) : 0;

					dLog(
						'amounts',
						JSON.stringify({
							netAmt: netAmt,
							origAmt: origAmt,
							amt: amt,
							discAmt: discAmt,
						})
					);

					netAmt = origAmt;
					tmpAmt += amt; //used to be netAmt

					if (discAmt > 0) {
						netAmt -= discAmt;
						tmpAmt -= discAmt;
					}

					if (!isEmpty(arrBillCredits[billId])) {
						var arrBC = arrBillCredits[billId];

						dLog('arrBC in arrBills', JSON.stringify(arrBC));

						for (bc in arrBC) {
							var billCreditAmtP = getFloatVal(arrBC[bc].bcamt);
							var billCreditAmt = billCreditAmtP * -1;

							// tmpAmt = (tmpAmt - billCreditAmtP);
							netAmt = netAmt - billCreditAmtP;
						}
					}
				}

				var cdtTrfTxInfObj = {};
				cdtTrfTxInfObj.PmtId = {};

				var refnum = arrBillPaymentMap[payeeId];
				var instrId = '';
				if (refnum.length > 12) {
					instrId = pz(refnum.substring(refnum.length - 12, refnum.length), 12);
				} else {
					instrId = pz(refnum, 12);
				}
				var endToEndId = billnum.substr(0, 18);
				if (numberOfBills > 1) {
					endToEndId = subtext.substr(0, 18);
				}
				//refnum

				cdtTrfTxInfObj.PmtId.InstrId = instrId;
				cdtTrfTxInfObj.PmtId.EndToEndId = endToEndId;
				cdtTrfTxInfObj.Amt = {};
				cdtTrfTxInfObj.Amt.value = tmpAmt.toFixed(2); //amt.toFixed(2);
				cdtTrfTxInfObj.Amt.Ccy = symbol;
				cdtTrfTxInfObj.ChrgBr = 'CRED';

				tmpAmt = 0; // need to initialize back to 0

				var Strd = [];

				for (y in arrBills) {
					var billId = arrBills[y];
					var StrdObj = {};
					StrdObj.RfrdDocInf = {};
					StrdObj.RfrdDocInf.Tp = {};
					StrdObj.RfrdDocInf.Tp.CdOrPrtry = {};
					StrdObj.RfrdDocInf.Tp.CdOrPrtry.Cd = 'CINV'; //Hardcoded?

					var netAmt = 0;
					var origAmt = getFloatVal(arrBillAmtOrig[billId]);
					var amt = getFloatVal(arrBillAmt[billId]);

					var discAmt = !isEmpty(arrBillDiscAmt[billId]) ? getFloatVal(arrBillDiscAmt[billId]) : 0;

					dLog('billId before', billId);
					dLog('arrBC in y.arrBills before', JSON.stringify(arrBillCredits));

					if (!isEmpty(arrBillCredits[billId])) {
						var arrBC = arrBillCredits[billId];

						dLog('arrBC in y.arrBills', JSON.stringify(arrBC));

						for (bc in arrBC) {
							var billCreditAmtP = getFloatVal(arrBC[bc].bcamt);
							var billCreditAmt = billCreditAmtP * -1;

							// tmpAmt = (tmpAmt - billCreditAmtP);
							netAmt = netAmt - billCreditAmtP;
						}
					}

					// tmpAmt += amt;
					netAmt = origAmt;
					tmpAmt += amt; //used to be netAmt

					if (discAmt > 0) {
						netAmt -= discAmt;
						tmpAmt -= discAmt;
					}

					dLog('createBNS_MTS_XMLDoc. objBillsData', JSON.stringify(objBillsData[billId]));

					if (!isEmpty(objBillsData[billId].num)) {
						StrdObj.RfrdDocInf.Nb = objBillsData[billId].num;
					} else if (!isEmpty(objBillsData[billId].trnxnumber)) {
						StrdObj.RfrdDocInf.Nb = objBillsData[billId].trnxnumber;
					}

					var invoiceDate = objBillsData[billId].dte;
					StrdObj.RfrdDocInf.RltdDt = formatDate(nlapiStringToDate(invoiceDate));
					StrdObj.RfrdDocAmt = {};
					StrdObj.RfrdDocAmt.DuePyblAmt = {};
					StrdObj.RfrdDocAmt.DscntApldAmt = {};
					StrdObj.RfrdDocAmt.RmtdAmt = {};
					StrdObj.RfrdDocAmt.DuePyblAmt.value = origAmt.toFixed(2);

					if (discAmt == 0) discAmt = '';
					else discAmt = discAmt.toFixed(2);

					StrdObj.RfrdDocAmt.DscntApldAmt.value = discAmt;
					StrdObj.RfrdDocAmt.RmtdAmt.value = netAmt.toFixed(2);

					StrdObj.RfrdDocAmt.DuePyblAmt.Ccy = symbol;
					StrdObj.RfrdDocAmt.DscntApldAmt.Ccy = symbol;
					StrdObj.RfrdDocAmt.RmtdAmt.Ccy = symbol;

					//Add CDtrRefInf
					StrdObj.CdtrRefInf = {};
					StrdObj.CdtrRefInf.Tp = {};
					StrdObj.CdtrRefInf.CdOrPrtry = {};
					StrdObj.CdtrRefInf.CdOrPrtry.Cd = 'PUOR';

					Strd.push(StrdObj);

					if (!isEmpty(arrBillCredits[billId])) {
						var arrBC = arrBillCredits[billId];

						for (bc in arrBC) {
							var billCreditAmtP = getFloatVal(arrBC[bc].bcamt);
							var billCreditAmt = billCreditAmtP;

							tmpAmt = tmpAmt - billCreditAmtP;
							netAmt = netAmt - billCreditAmtP;

							var StrdObj = {};
							StrdObj.RfrdDocInf = {};
							StrdObj.RfrdDocInf.Tp = {};
							StrdObj.RfrdDocInf.Tp.CdOrPrtry = {};
							StrdObj.RfrdDocInf.Tp.CdOrPrtry.Cd = 'CREN'; //Hardcoded?

							var bcNum = arrBC[bc].bcnum;
							dLog('createJPMXMLDoc', 'VC number : ' + bcNum);

							if (!isEmpty(bcNum)) StrdObj.RfrdDocInf.Nb = bcNum;
							else if (!isEmpty(arrBillCredits[billId].bcmemo)) {
								StrdObj.RfrdDocInf.Nb = arrBillCredits[billId].bcmemo;
							}

							var invoiceDate = objBillsData[billId].dte;
							StrdObj.RfrdDocInf.RltdDt = formatDate(nlapiStringToDate(arrBC[bc].bcdate));

							StrdObj.RfrdDocAmt = {};
							StrdObj.RfrdDocAmt.DuePyblAmt = {};
							StrdObj.RfrdDocAmt.DscntApldAmt = {};
							StrdObj.RfrdDocAmt.CdtNoteAmt = {};

							StrdObj.RfrdDocAmt.DuePyblAmt.value = billCreditAmt.toFixed(2);
							if (discAmt == 0) discAmt = '';
							else discAmt = discAmt.toFixed(2);

							StrdObj.RfrdDocAmt.DscntApldAmt.value = discAmt;
							StrdObj.RfrdDocAmt.CdtNoteAmt.value = billCreditAmt.toFixed(2);

							StrdObj.RfrdDocAmt.DuePyblAmt.Ccy = symbol;
							StrdObj.RfrdDocAmt.DscntApldAmt.Ccy = symbol;
							StrdObj.RfrdDocAmt.CdtNoteAmt.Ccy = symbol;

							Strd.push(StrdObj);
						}
					}
				}

				cdtTrfTxInfObj.CdtrAgt = {};
				cdtTrfTxInfObj.CdtrAgt.FinInstnId = {};
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.BIC = objVendor.recbankprimid;
				if (objVendor.recbankprimidtype == 'ABA') {
					cdtTrfTxInfObj.CdtrAgt.FinInstnId.ClrSysMmbId = {};
					cdtTrfTxInfObj.CdtrAgt.FinInstnId.ClrSysMmbId.MmbId = objVendor.recbankprimid; // objVendor.bankid; // Receiving Bank Routing
				}
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.Nm = objVendor.vbankname;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr = {};
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.Ctry = countryCodeMapping[objVendor.vbankcountry];

				// if ( (isEmpty(objVendor.vbankaddrs1)) || (isEmpty(objVendor.vbankzip)) || (isEmpty(objVendor.vbankcity)) || (isEmpty(objVendor.vbankstate)) ) {
				// 	cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.StrtNm = '';
				// 	cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.BldgNb = '';
				// 	cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.PstCd = '';
				// 	cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.TwnNm = '';
				// 	cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.CtrySubDvsn = '';
				// }
				// else {
				// 	cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.StrtNm = objVendor.vbankaddrs1;
				// 	cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.BldgNb = '';
				// 	cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.PstCd = objVendor.vbankzip;
				// 	cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.TwnNm = objVendor.vbankcity;
				// 	cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.CtrySubDvsn = objVendor.vbankstate;
				// }

				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.StrtNm = objVendor.vbankaddrs1 || '';
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.BldgNb = '';
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.PstCd = objVendor.vbankzip || '';
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.TwnNm = objVendor.vbankcity || '';
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.CtrySubDvsn = objVendor.vbankstate || '';

				if (objVendor.recbankprimidtype == 'SWT') {
					//SWT
					cdtTrfTxInfObj.CdtrAgt.FinInstnId.Othr = {};
					cdtTrfTxInfObj.CdtrAgt.FinInstnId.Othr.Id = objVendor.recbankprimid;
					dAudit('Should have set value', objVendor.recbankprimid);
				}

				// cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.StrtNum = objVendor.vbankaddrs1;
				// cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.PstCd = objVendor.vbankzip;
				// cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.TwnNm = objVendor.vbankcity;
				// cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.BldgNb = '';
				// cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.CtrySubDvsn = objVendor.vbankstate;

				cdtTrfTxInfObj.Cdtr = {};
				cdtTrfTxInfObj.Cdtr.Nm = objVendor.vendorname;
				cdtTrfTxInfObj.Cdtr.PstlAdr = {};

				// if ( (isEmpty(objVendor.vendoraddrs1)) || (isEmpty(objVendor.vendorpostal)) || (isEmpty(objVendor.vendorcity)) || (isEmpty(objVendor.vendorstateprovince)) ) {
				// 	cdtTrfTxInfObj.Cdtr.PstlAdr.StrtNm = '';
				// 	cdtTrfTxInfObj.Cdtr.PstlAdr.BldgNb = "";
				// 	cdtTrfTxInfObj.Cdtr.PstlAdr.PstCd = '';
				// 	cdtTrfTxInfObj.Cdtr.PstlAdr.TwnNm = '';
				// 	cdtTrfTxInfObj.Cdtr.PstlAdr.CtrySubDvsn = '';
				// } else {
				// 	cdtTrfTxInfObj.Cdtr.PstlAdr.StrtNm = objVendor.vendoraddrs1;
				// 	cdtTrfTxInfObj.Cdtr.PstlAdr.BldgNb = objVendor.vendoraddrs2 || "";
				// 	cdtTrfTxInfObj.Cdtr.PstlAdr.PstCd = objVendor.vendorpostal;
				// 	cdtTrfTxInfObj.Cdtr.PstlAdr.TwnNm = objVendor.vendorcity;
				// 	cdtTrfTxInfObj.Cdtr.PstlAdr.CtrySubDvsn = objVendor.vendorstateprovince;
				// }
				cdtTrfTxInfObj.Cdtr.PstlAdr.StrtNm = objVendor.vendoraddrs1 || '';
				cdtTrfTxInfObj.Cdtr.PstlAdr.BldgNb = objVendor.vendoraddrs2 || '';
				cdtTrfTxInfObj.Cdtr.PstlAdr.PstCd = objVendor.vendorpostal || '';
				cdtTrfTxInfObj.Cdtr.PstlAdr.TwnNm = objVendor.vendorcity || '';
				cdtTrfTxInfObj.Cdtr.PstlAdr.CtrySubDvsn = objVendor.vendorstateprovince || '';

				// cdtTrfTxInfObj.Cdtr.PstlAdr.StrtNm = objVendor.vendoraddrs1;
				// cdtTrfTxInfObj.Cdtr.PstlAdr.BldgNb = objVendor.vendoraddrs2 || "";
				// cdtTrfTxInfObj.Cdtr.PstlAdr.PstCd = objVendor.vendorpostal;
				// cdtTrfTxInfObj.Cdtr.PstlAdr.TwnNm = objVendor.vendorcity;
				// cdtTrfTxInfObj.Cdtr.PstlAdr.CtrySubDvsn = objVendor.vendorstateprovince;
				cdtTrfTxInfObj.Cdtr.PstlAdr.Ctry = countryCodeMapping[objVendor.vendorcountrycode];

				var chars = objVendor.recpartyaccount.substring(0, 2);
				dAudit('CHECK for IBAN: objVendor.recpartyaccount', objVendor.recpartyaccount);
				var iban = objVendor.custentity_ica_bns_use_iban;
				if (iban == 'T') {
					cdtTrfTxInfObj.CdtrAcct = {};
					cdtTrfTxInfObj.CdtrAcct.Id = {};
					cdtTrfTxInfObj.CdtrAcct.Id.IBAN = objVendor.recpartyaccount;
				} else {
					cdtTrfTxInfObj.CdtrAcct = {};
					cdtTrfTxInfObj.CdtrAcct.Id = {};
					cdtTrfTxInfObj.CdtrAcct.Id.Othr = {};
					cdtTrfTxInfObj.CdtrAcct.Id.Othr.Id = objVendor.recpartyaccount;
				}
				if (isAlpha(chars)) {
					//IBAN
				} else {
				}

				// cdtTrfTxInfObj.RltdAmtInf = {};
				// cdtTrfTxInfObj.RltdAmtInf.RmtLctnMtd = objVendor.pmp_dac_contactname || "";
				// cdtTrfTxInfObj.RltdAmtInf.RmtLctnElctrncAdr = objVendor.pmp_dac_emailaddress || "";
				cdtTrfTxInfObj.RmtInf = {};
				cdtTrfTxInfObj.RmtInf.Ustrd = refnum;
				cdtTrfTxInfObj.RmtInf.VendorId = objVendor.entityid;
				cdtTrfTxInfObj.RmtInf.Category = objVendor.category;
				cdtTrfTxInfObj.RmtInf.Strd = Strd;
				cdtTrfTxInfObj.UltmtCdtr = {};
				cdtTrfTxInfObj.UltmtCdtr.Nm = objVendor.vendorname;

				CdtTrfTxInf.push(cdtTrfTxInfObj);
			}
		}
	}
	objects.CdtTrfTxInf = CdtTrfTxInf;

	dLog('objects', JSON.stringify(objects));

	var fileId = nlapiSearchRecord('file', null, [['name', 'is', 'ica_bns_mts.xml']], []);
	if (fileId != null) {
		fileId = fileId[0].getId();
	}

	var tmplFile = nlapiLoadFile(fileId);

	var template = Handlebars.compile(tmplFile.getValue());
	var xmlDoc = template(objects);

	dLog('xmlDoc', xmlDoc);
	return xmlDoc;
}

function createBNS_IAC_XMLDoc(objAcctMapping) {
	var arrTempBillIds = [];
	var arrBillCRIds = [];
	var arrBillAmt = [];
	var arrBillAmtOrig = [];
	var arrBillDiscAmt = [];
	var arrBillPayInfoCtr = [];
	var arrBillPayInfoSum = [];
	var arrGrpHdrNbOfTxs = [];
	var arrPmtInfNbOfTxs = [];
	var arrBillIds = [];
	var grpHdrNbOfTxs = 0;
	var grpHdrCtrlSum = 0;
	var arrPayeeIds = [];
	var _currencies = getCurrencies();

	for (x in arrBillsProcessed) {
		var billId = arrBillsProcessed[x].id;
		var billPaymentId = arrBillsProcessed[x].payment;

		dLog('createBNS_IAC_XMLDoc', 'Bill info = ' + JSON.stringify(arrBillsProcessed[x]));
		if (!isEmpty(billPaymentId) && billPaymentId != 'XXXNONEXXX' && billPaymentId != 'CREDIT') {
			if (billPaymentId != 'CREDIT') arrTempBillIds.push(billId);

			var payMethod = arrBillsProcessed[x].paymethod;
			var paymentId = arrBillsProcessed[x].payment;
			var payeeId = arrBillsProcessed[x].payeeid;

			arrBillAmtOrig[billId] = arrBillsProcessed[x].origamt;
			// arrBillAmt[billId] = arrBillsProcessed[x].pay;
			arrBillAmt[billId] = arrBillsProcessed[x].payamt;
			arrBillDiscAmt[billId] = arrBillsProcessed[x].discamt;

			var ndx = payMethod + '@@' + paymentId;

			if (arrBillPayInfoCtr[payMethod] == null) arrBillPayInfoCtr[payMethod] = 0;
			if (arrBillPayInfoSum[payMethod] == null) arrBillPayInfoSum[payMethod] = 0;
			if (arrPmtInfNbOfTxs[ndx] == null) arrPmtInfNbOfTxs[ndx] = 0;

			if (paymentId && arrGrpHdrNbOfTxs[paymentId] == null) grpHdrNbOfTxs++;

			arrPmtInfNbOfTxs[ndx]++;
			arrBillPayInfoCtr[payMethod]++;
			arrBillPayInfoSum[payMethod] += getFloatVal(arrBillsProcessed[x].payamt);
			arrGrpHdrNbOfTxs[paymentId] = paymentId;

			grpHdrCtrlSum += getFloatVal(arrBillsProcessed[x].payamt);
		}

		if (billPaymentId == 'CREDIT') arrBillCRIds.push(billId);
	}

	var arrBillIds = [];
	var arrBillIds2 = [];
	var arrBillIds3 = [];
	var arrBillIds4 = [];
	var arrBillIds5 = [];

	for (vx in arrTempBillIds) {
		var isBC = false;

		for (var x in arrBillCRIds) {
			if (arrTempBillIds[vx] == arrBillCRIds[x]) {
				isBC = true;
				break;
			}
		}

		if (!isBC) {
			arrBillIds.push(arrTempBillIds[vx]);
			arrBillIds2.push(arrTempBillIds[vx]);
			arrBillIds3.push(arrTempBillIds[vx]);
			arrBillIds4.push(arrTempBillIds[vx]);
			arrBillIds5.push(arrTempBillIds[vx]);
		}
	}

	var arrBillCredits = getBillCredit(arrBillIds);
	var objBillsData = getBillData(arrBillIds2);
	var arrBillPO = getPOMap(arrBillIds3);
	var arrVendorBills = getPayeeBillsByPayMethod(arrBillIds4);
	var arrVendorBillsCurr = getPayeeBillsCurrency(arrBillIds5);
	var nsAcctSub = !isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('subsidiary', 'CUSTRECORD_ACCT_MAP_NETSUITE_ACCOUNT')) ? objAcctMapping[0].getValue('subsidiary', 'CUSTRECORD_ACCT_MAP_NETSUITE_ACCOUNT') : '';
	var objVDCRecResults = getVendorDAC_CCRPaymentRec(nsAcctSub);
	dLog('objVDCRecResults', JSON.stringify(objVDCRecResults));
	dLog('objAcctMapping', JSON.stringify(objAcctMapping));

	//Gather data.
	var CdtTrfTxInf = [];

	var objects = {
		MsgId: 'TBD',
		CreDtTm: 'Test',
		Authstn: {
			Cd: '',
		},
		NbOfTxs: '2',
		CtrlSum: '2000',
		InitgPty: {
			Id: {
				OrgId: {
					Othr: {
						Id: '',
					},
				},
			},
		},
		PmtInfId: 'PmtInfId',
		PmtMtd: 'PmtMtd',
		PmtTpInf: {
			SvcLvl: {
				Cd: 'This is CD',
			},
		},
		ReqdExctnDt: 'ReqdExctnDt',
		Dbtr: {
			Nm: 'This is Nm',
			PstlAdr: {
				StrtNm: '',
				BldgNb: '',
				PstCd: '',
				TwnNm: '',
				CtrySubDvsn: '',
				Ctry: '',
			},
			Id: {
				Othr: {
					Id: 'Dbtr.Id.Othr.Id',
				},
			},
		},
		DbtrAcct: {
			Id: {
				Othr: {
					Id: 'DbtrAcct.Id.Othr.Id',
				},
			},
			PstlAdr: {
				StrtNm: '',
				BldgNb: '',
				PstCd: '',
				TwnNm: '',
				CtrySubDvsn: '',
				Ctry: '',
			},
		},
		DbtrAgt: {
			FinInstnId: {
				BIC: 'BIC',
				PstlAdr: {
					StrtNm: '',
					BldgNb: '',
					PstCd: '',
					TwnNm: '',
					CtrySubDvsn: '',
					Ctry: '',
				},
			},
		},
		CdtTrfTxInf: CdtTrfTxInf,
	};

	for (x in arrVendorBills) {
		var payeeId = x.split('X@X')[1];
		arrPayeeIds.push(payeeId);
	}

	var arrVendors = getEntityData(arrPayeeIds);

	var today = new Date();
	var bpmdate = BPM_DATE;
	var d = nlapiStringToDate(bpmdate, 'datetime');

	var fileCtrlNumber = Date.create().format('{yy}{MM}{dd}{mm}{ss}');
	objects.MsgId = pad(fileCtrlNumber, 4);
	objects.CreDtTm = moment(d).format('YYYY-MM-DDThh:mm:ss') || today.format('{yyyy}-{MM}-{dd}T{hh}:{mm}:{ss}');
	objects.Authstn.Cd = 'AUTH'; // Changed from AUTH
	objects.NbOfTxs = grpHdrNbOfTxs;
	objects.CtrlSum = grpHdrCtrlSum.toFixed(2); // Do we comment this out?

	if (objects.CtrlSum == '0.00') {
		dLog('CtrlSum is 0.00, this should not happen. Returning empty file', objects.CtrlSum);
		return '';
	}

	if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ceo_company_id'))) {
		objects.InitgPty.Id.OrgId.Othr.Id = objAcctMapping[0].getValue('custrecord_acct_map_ceo_company_id'); //CEO ID
	}

	for (x in arrBillPayInfoCtr) {
		objects.PmtInfId = fileCtrlNumber;
		var paymentMethod = x;
		objects.PmtMtd = 'TRF';

		objects.PmtTpInf.SvcLvl.Cd = paymentMethod == 'MTS' ? 'URGP' : 'NURG';
		objects.ReqdExctnDt = moment(d).format('YYYY-MM-DD') || today.format('{yyyy}-{MM}-{dd}');

		if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_companyname'))) objects.Dbtr.Nm = objVDCRecResults[0].getValue('custrecord_companyname');

		//PstlAdr
		var country = !isEmpty(objVDCRecResults) ? objVDCRecResults[0].getValue('custrecord_compcountrycode') : '';

		if (
			(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_comppostcode'))) ||
			(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compcity'))) ||
			(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compstateprov'))) ||
			(!isEmpty(objVDCRecResults) && objVDCRecResults[0].getValue('custrecord_compcountrycode')) ||
			(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compadd1')))
		) {
			if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compadd1'))) {
				objects.Dbtr.PstlAdr.StrtNm = '<AdrLine>' + objVDCRecResults[0].getValue('custrecord_compadd1') + '</AdrLine>';
			}
			if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compadd2'))) {
				objects.Dbtr.PstlAdr.BldgNb = '<BldgNb>' + objVDCRecResults[0].getValue('custrecord_compadd2') + '</BldgNb>';
			}

			if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_comppostcode'))) {
				objects.Dbtr.PstlAdr.PstCd = '<PstCd>' + objVDCRecResults[0].getValue('custrecord_comppostcode') + '</PstCd>';
			}
			// addTextNodeFromParentNode(xmlDoc, pstlAdr, 'PstCd', objVDCRecResults[0].getValue('custrecord_comppostcode'));

			if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compcity'))) {
				objects.Dbtr.PstlAdr.TwnNm = '<TwnNm>' + objVDCRecResults[0].getValue('custrecord_compcity') + '</TwnNm>';
			}
			// addTextNodeFromParentNode(xmlDoc, pstlAdr, 'TwnNm', objVDCRecResults[0].getValue('custrecord_compcity'));

			//Where do we get CtrySubDvsn?
			if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compstateprov'))) {
				objects.Dbtr.PstlAdr.CtrySubDvsn = '<CtrySubDvsn>' + objVDCRecResults[0].getValue('custrecord_compstateprov') + '</CtrySubDvsn>';
			}

			// addTextNodeFromParentNode(xmlDoc, pstlAdr, 'Ctry', country);
			if (country) {
				objects.Dbtr.PstlAdr.Ctry = '<Ctry>' + country + '</Ctry>';
			}
			dLog('Added Ctry', JSON.stringify(objects));

			// addTextNodeFromParentNode(xmlDoc, pstlAdr, 'AdrLine', objVDCRecResults[0].getValue('custrecord_compadd1'));
			// objects.Dbtr.PstlAdr.BldgNb = '2'; not used
		}

		if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_dom_ach_co_id'))) {
			objects.Dbtr.Id = {};
			objects.Dbtr.Id.Othr = {};
			objects.Dbtr.Id.Othr.Id = objAcctMapping[0].getValue('custrecord_acct_map_dom_ach_co_id'); //ACH Company ID
		}

		//DbtrAcct
		if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_origin_acc'))) {
			objects.DbtrAcct = {};
			objects.DbtrAcct.Id = {};
			objects.DbtrAcct.Id.Othr = {};
			objects.DbtrAcct.Id.Othr.Id = objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_origin_acc'); // Bank Account Number
		}

		//DbtrAgt
		if ((!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id'))) || !isEmpty(country)) {
			objects.DbtrAgt = {};
			objects.DbtrAgt.FinInstnId = {};
			if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_hsbc_swift_bank_id'))) {
				objects.DbtrAgt.FinInstnId.BIC = objAcctMapping[0].getValue('custrecord_acct_map_hsbc_swift_bank_id');
			}
			if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id'))) {
				objects.DbtrAgt.FinInstnId.ClrSysMmbId = {};
				objects.DbtrAgt.FinInstnId.ClrSysMmbId.MmbId = objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id'); // Routing Number 10 Digit
			}
			objects.DbtrAgt.FinInstnId.PstlAdr = {};
			objects.DbtrAgt.FinInstnId.PstlAdr.Ctry = country;
		}

		//CdtTrfTxInf loop starts here.

		if (SINGLEBILLPYMTS == 'T') {
			dAudit('Create Single Bill Payments here.', JSON.stringify(arrBillsProcessed));

			for (var i = 0; i < arrBillsProcessed.length; i++) {
				var billPayment = arrBillsProcessed[i];

				if (billPayment.payment == 'CREDIT') {
					continue;
				}

				var symbol = '';

				try {
					symbol = _.find(_currencies, { internalid: String(billPayment.currid) }).symbol;
				} catch (e) {}

				var objVendor = arrVendors[billPayment.payeeid];
				if (!objVendor) objVendor = _.find(arrVendors, { internalid: String(billPayment.payeeid) });

				dLog('objVendor', JSON.stringify(objVendor));

				var cdtTrfTxInfObj = {};
				cdtTrfTxInfObj.PmtId = {};

				var refnum = billPayment.refnum; //arrBillPaymentMap[billPayment.payeeid];
				// var refnum = billPayment.billnum; //arrBillPaymentMap[billPayment.payeeid];
				var instrId = '';
				if (refnum.length > 12) {
					instrId = pz(refnum.substring(refnum.length - 12, refnum.length), 12);
				} else {
					instrId = pz(refnum, 12);
				}
				refnum = billPayment.billnum; //Overwrite endToendID
				var endToEndId = refnum;
				if (refnum.length > 18) {
					endToEndId = refnum.substr(0, 18);
				}

				cdtTrfTxInfObj.PmtId.InstrId = instrId;
				cdtTrfTxInfObj.PmtId.EndToEndId = endToEndId.replace(/[&.'"<>-]/g, ' ');
				cdtTrfTxInfObj.Amt = {};
				cdtTrfTxInfObj.Amt.value = billPayment.payamt; //amt.toFixed(2);
				cdtTrfTxInfObj.Amt.Ccy = symbol;
				cdtTrfTxInfObj.ChrgBr = 'CRED';

				cdtTrfTxInfObj.CdtrAgt = {};
				cdtTrfTxInfObj.CdtrAgt.FinInstnId = {};
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.BIC = objVendor.recbankprimid;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.ClrSysMmbId = {};
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.ClrSysMmbId.MmbId = objVendor.recbankprimid; // objVendor.bankid; // Receiving Bank Routing
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.Nm = objVendor.vbankname.replace(/[&.'"<>-]/g, ' ');

				if (countryCodeMapping[objVendor.vbankcountry] != '') {
					cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr = {};
					cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.Ctry = countryCodeMapping[objVendor.vbankcountry];
				}

				// cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr = {};
				// cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.Ctry = countryCodeMapping[objVendor.vbankcountry];
				// cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.AdrLine = objVendor.vbankaddrs1;

				// if ( (isEmpty(objVendor.vbankaddrs1)) || (isEmpty(objVendor.vbankzip)) || (isEmpty(objVendor.vbankcity)) || (isEmpty(objVendor.vbankstate)) ) {
				// 	cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.StrtNm = '';
				// 	cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.BldgNb = '';
				// 	cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.PstCd = '';
				// 	cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.TwnNm = '';
				// 	cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.CtrySubDvsn = '';
				// }
				// else {
				// 	cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.StrtNm = objVendor.vbankaddrs1;
				// 	cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.BldgNb = '';
				// 	cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.PstCd = objVendor.vbankzip;
				// 	cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.TwnNm = objVendor.vbankcity;
				// 	cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.CtrySubDvsn = objVendor.vbankstate;
				// }

				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.StrtNm = objVendor.vbankaddrs1.replace(/[&.'"<>-]/g, ' ') || '';
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.BldgNb = '';
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.PstCd = objVendor.vbankzip.replace(/[&.'"<>-]/g, ' ') || '';
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.TwnNm = objVendor.vbankcity.replace(/[&.'"<>-]/g, ' ') || '';
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.CtrySubDvsn = objVendor.vbankstate.replace(/[&.'"<>-]/g, ' ') || '';

				cdtTrfTxInfObj.Cdtr = {};
				cdtTrfTxInfObj.Cdtr.Nm = objVendor.vendorname.replace(/[&.'"<>-]/g, ' ');
				cdtTrfTxInfObj.Cdtr.PstlAdr = {};
				// if ( (isEmpty(objVendor.vendoraddrs1)) || (isEmpty(objVendor.vendorpostal)) || (isEmpty(objVendor.vendorcity)) || (isEmpty(objVendor.vendorstateprovince)) ) {
				// 	dLog('Here, should be empty', JSON.stringify(objVendor));
				// 	cdtTrfTxInfObj.Cdtr.PstlAdr.StrtNm = '';
				// 	cdtTrfTxInfObj.Cdtr.PstlAdr.BldgNb = "";
				// 	cdtTrfTxInfObj.Cdtr.PstlAdr.PstCd = '';
				// 	cdtTrfTxInfObj.Cdtr.PstlAdr.TwnNm = '';
				// 	cdtTrfTxInfObj.Cdtr.PstlAdr.CtrySubDvsn = '';
				// } else {
				// 	dLog('Here?', JSON.stringify(objVendor));
				// 	cdtTrfTxInfObj.Cdtr.PstlAdr.StrtNm = objVendor.vendoraddrs1;
				// 	cdtTrfTxInfObj.Cdtr.PstlAdr.BldgNb = objVendor.vendoraddrs2 || "";
				// 	cdtTrfTxInfObj.Cdtr.PstlAdr.PstCd = objVendor.vendorpostal;
				// 	cdtTrfTxInfObj.Cdtr.PstlAdr.TwnNm = objVendor.vendorcity;
				// 	cdtTrfTxInfObj.Cdtr.PstlAdr.CtrySubDvsn = objVendor.vendorstateprovince;
				// }
				cdtTrfTxInfObj.Cdtr.PstlAdr.StrtNm = objVendor.vendoraddrs1.replace(/[&.'"<>-]/g, ' ') || '';
				cdtTrfTxInfObj.Cdtr.PstlAdr.BldgNb = objVendor.vendoraddrs2.replace(/[&.'"-]/g, ' ') || '';
				cdtTrfTxInfObj.Cdtr.PstlAdr.PstCd = objVendor.vendorpostal.replace(/[&.'"<>-]/g, ' ') || '';
				cdtTrfTxInfObj.Cdtr.PstlAdr.TwnNm = objVendor.vendorcity.replace(/[&.'"<>-]/g, ' ') || '';
				cdtTrfTxInfObj.Cdtr.PstlAdr.CtrySubDvsn = objVendor.vendorstateprovince.replace(/[&.'"<>-]/g, ' ') || '';

				cdtTrfTxInfObj.Cdtr.PstlAdr.Ctry = countryCodeMapping[objVendor.vendorcountrycode];

				cdtTrfTxInfObj.CdtrAcct = {};
				cdtTrfTxInfObj.CdtrAcct.Id = {};
				cdtTrfTxInfObj.CdtrAcct.Id.Othr = {};
				cdtTrfTxInfObj.CdtrAcct.Id.Othr.Id = objVendor.recpartyaccount;

				// cdtTrfTxInfObj.RltdAmtInf = {};
				// cdtTrfTxInfObj.RltdAmtInf.RmtLctnMtd = objVendor.pmp_dac_contactname || "";
				// cdtTrfTxInfObj.RltdAmtInf.RmtLctnElctrncAdr = objVendor.pmp_dac_emailaddress || "";
				cdtTrfTxInfObj.RmtInf = {};
				cdtTrfTxInfObj.RmtInf.Ustrd = refnum;
				cdtTrfTxInfObj.RmtInf.VendorId = objVendor.entityid.replace(/[&.'"<>-]/g, ' ');
				cdtTrfTxInfObj.RmtInf.Category = objVendor.category.replace(/[&.'"<>-]/g, ' ');

				cdtTrfTxInfObj.RmtInf.Strd = Strd;

				cdtTrfTxInfObj.UltmtCdtr = {};
				cdtTrfTxInfObj.UltmtCdtr.Nm = objVendor.vendorname.replace(/[&.'"<>-]/g, ' ');

				CdtTrfTxInf.push(cdtTrfTxInfObj);
			}
		} else {
			dAudit('arrVendorBills', arrVendorBills);
			var refnum = '';
			var currency = '';
			var symbol = '';

			for (v in arrVendorBills) {
				var arrPayeeInfo = v.split('X@X');
				var payeeId = arrPayeeInfo[1];

				//var objVendor=arrVendors[payeeId];
				       var objVendor = _.find(arrVendors, { internalid: String(payeeId)});
				// var objVendor = _.find(arrVendors, { internalid: String(payeeId), paymentmethod: String(paymentMethod) })[0];
dAudit('objVendor-new', objVendor);				dLog('objVendor', JSON.stringify(objVendor));

				if (isEmpty(objVendor)) continue;

				var pmtMethod = objVendor.paymentmethod;

				if (paymentMethod != pmtMethod) continue;

				var arrBills = arrVendorBills[paymentMethod + 'X@X' + payeeId];
				dLog('arrBills', JSON.stringify(arrBills));
				var tmpAmt = 0;

				var numberOfBills = _.size(arrBills);
				for (by in arrBills) {
					var billId = arrBills[by];
					refnum = _.find(arrBillsProcessed, { id: String(billId) }).refnum;
					currency = _.find(arrBillsProcessed, { id: String(billId) }).currid;
					subtext = _.find(arrBillsProcessed, { id: String(billId) }).subtext;
					billnum = _.find(arrBillsProcessed, { id: String(billId) }).billnum;

					try {
						symbol = _.find(_currencies, { internalid: String(currency) }).symbol;
					} catch (e) {}
					// dLog('createAUACHXMLDocrefnum', JSON.stringify(refnum));

					var netAmt = 0;
					var origAmt = getFloatVal(arrBillAmtOrig[billId]);
					var amt = getFloatVal(arrBillAmt[billId]);

					var discAmt = !isEmpty(arrBillDiscAmt[billId]) ? getFloatVal(arrBillDiscAmt[billId]) : 0;

					dLog(
						'amounts',
						JSON.stringify({
							netAmt: netAmt,
							origAmt: origAmt,
							amt: amt,
							discAmt: discAmt,
						})
					);

					netAmt = origAmt;
					tmpAmt += amt; //used to be netAmt

					if (discAmt > 0) {
						netAmt -= discAmt;
						tmpAmt -= discAmt;
					}

					if (!isEmpty(arrBillCredits[billId])) {
						var arrBC = arrBillCredits[billId];

						dLog('arrBC in arrBills', JSON.stringify(arrBC));

						for (bc in arrBC) {
							var billCreditAmtP = getFloatVal(arrBC[bc].bcamt);
							var billCreditAmt = billCreditAmtP * -1;

							// tmpAmt = (tmpAmt - billCreditAmtP);
							netAmt = netAmt - billCreditAmtP;
						}
					}
				}

				var cdtTrfTxInfObj = {};
				cdtTrfTxInfObj.PmtId = {};

				var refnum = arrBillPaymentMap[payeeId];
				var instrId = '';
				if (refnum.length > 12) {
					instrId = pz(refnum.substring(refnum.length - 12, refnum.length), 12);
				} else {
					instrId = pz(refnum, 12);
				}
				var endToEndId = billnum.substr(0, 18);
				if (numberOfBills > 1) {
					endToEndId = subtext.substr(0, 18);
				}
				//refnum

				cdtTrfTxInfObj.PmtId.InstrId = instrId;
				cdtTrfTxInfObj.PmtId.EndToEndId = endToEndId.replace(/[&.'"<>-]/g, '');
				cdtTrfTxInfObj.Amt = {};
				cdtTrfTxInfObj.Amt.value = tmpAmt.toFixed(2); //amt.toFixed(2);
				cdtTrfTxInfObj.Amt.Ccy = symbol;
				cdtTrfTxInfObj.ChrgBr = 'CRED';

				tmpAmt = 0; // need to initialize back to 0

				var Strd = [];

				for (y in arrBills) {
					var billId = arrBills[y];
					var StrdObj = {};
					StrdObj.RfrdDocInf = {};
					StrdObj.RfrdDocInf.Tp = {};
					StrdObj.RfrdDocInf.Tp.CdOrPrtry = {};
					StrdObj.RfrdDocInf.Tp.CdOrPrtry.Cd = 'CINV'; //Hardcoded?

					var netAmt = 0;
					var origAmt = getFloatVal(arrBillAmtOrig[billId]);
					var amt = getFloatVal(arrBillAmt[billId]);

					var discAmt = !isEmpty(arrBillDiscAmt[billId]) ? getFloatVal(arrBillDiscAmt[billId]) : 0;

					dLog('billId before', billId);
					dLog('arrBC in y.arrBills before', JSON.stringify(arrBillCredits));

					if (!isEmpty(arrBillCredits[billId])) {
						var arrBC = arrBillCredits[billId];

						dLog('arrBC in y.arrBills', JSON.stringify(arrBC));

						for (bc in arrBC) {
							var billCreditAmtP = getFloatVal(arrBC[bc].bcamt);
							var billCreditAmt = billCreditAmtP * -1;

							// tmpAmt = (tmpAmt - billCreditAmtP);
							netAmt = netAmt - billCreditAmtP;
						}
					}

					// tmpAmt += amt;
					netAmt = origAmt;
					tmpAmt += amt; //used to be netAmt

					if (discAmt > 0) {
						netAmt -= discAmt;
						tmpAmt -= discAmt;
					}

					dLog('createBNS_MTS_XMLDoc. objBillsData', JSON.stringify(objBillsData[billId]));

					if (!isEmpty(objBillsData[billId].num)) {
						StrdObj.RfrdDocInf.Nb = objBillsData[billId].num;
					} else if (!isEmpty(objBillsData[billId].trnxnumber)) {
						StrdObj.RfrdDocInf.Nb = objBillsData[billId].trnxnumber;
					}

					var invoiceDate = objBillsData[billId].dte;
					StrdObj.RfrdDocInf.RltdDt = formatDate(nlapiStringToDate(invoiceDate));
					StrdObj.RfrdDocAmt = {};
					StrdObj.RfrdDocAmt.DuePyblAmt = {};
					StrdObj.RfrdDocAmt.DscntApldAmt = {};
					StrdObj.RfrdDocAmt.RmtdAmt = {};
					StrdObj.RfrdDocAmt.DuePyblAmt.value = origAmt.toFixed(2);

					if (discAmt == 0) discAmt = '';
					else discAmt = discAmt.toFixed(2);

					StrdObj.RfrdDocAmt.DscntApldAmt.value = discAmt;
					StrdObj.RfrdDocAmt.RmtdAmt.value = netAmt.toFixed(2);

					StrdObj.RfrdDocAmt.DuePyblAmt.Ccy = symbol;
					StrdObj.RfrdDocAmt.DscntApldAmt.Ccy = symbol;
					StrdObj.RfrdDocAmt.RmtdAmt.Ccy = symbol;

					//Add CDtrRefInf
					StrdObj.CdtrRefInf = {};
					StrdObj.CdtrRefInf.Tp = {};
					StrdObj.CdtrRefInf.CdOrPrtry = {};
					StrdObj.CdtrRefInf.CdOrPrtry.Cd = 'PUOR';

					Strd.push(StrdObj);

					if (!isEmpty(arrBillCredits[billId])) {
						var arrBC = arrBillCredits[billId];

						for (bc in arrBC) {
							var billCreditAmtP = getFloatVal(arrBC[bc].bcamt);
							var billCreditAmt = billCreditAmtP;

							tmpAmt = tmpAmt - billCreditAmtP;
							netAmt = netAmt - billCreditAmtP;

							var StrdObj = {};
							StrdObj.RfrdDocInf = {};
							StrdObj.RfrdDocInf.Tp = {};
							StrdObj.RfrdDocInf.Tp.CdOrPrtry = {};
							StrdObj.RfrdDocInf.Tp.CdOrPrtry.Cd = 'CREN'; //Hardcoded?

							var bcNum = arrBC[bc].bcnum;
							dLog('createBNS_IAC_XMLDoc', 'VC number : ' + bcNum);

							if (!isEmpty(bcNum)) StrdObj.RfrdDocInf.Nb = bcNum;
							else if (!isEmpty(arrBillCredits[billId].bcmemo)) {
								StrdObj.RfrdDocInf.Nb = arrBillCredits[billId].bcmemo;
							}

							var invoiceDate = objBillsData[billId].dte;
							StrdObj.RfrdDocInf.RltdDt = formatDate(nlapiStringToDate(arrBC[bc].bcdate));

							StrdObj.RfrdDocAmt = {};
							StrdObj.RfrdDocAmt.DuePyblAmt = {};
							StrdObj.RfrdDocAmt.DscntApldAmt = {};
							StrdObj.RfrdDocAmt.CdtNoteAmt = {};

							StrdObj.RfrdDocAmt.DuePyblAmt.value = billCreditAmt.toFixed(2);
							if (discAmt == 0) discAmt = '';
							else discAmt = discAmt.toFixed(2);

							StrdObj.RfrdDocAmt.DscntApldAmt.value = discAmt;
							StrdObj.RfrdDocAmt.CdtNoteAmt.value = billCreditAmt.toFixed(2);

							StrdObj.RfrdDocAmt.DuePyblAmt.Ccy = symbol;
							StrdObj.RfrdDocAmt.DscntApldAmt.Ccy = symbol;
							StrdObj.RfrdDocAmt.CdtNoteAmt.Ccy = symbol;

							Strd.push(StrdObj);
						}
					}
				}

				cdtTrfTxInfObj.CdtrAgt = {};
				cdtTrfTxInfObj.CdtrAgt.FinInstnId = {};
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.BIC = objVendor.recbankprimid;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.ClrSysMmbId = {};
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.ClrSysMmbId.MmbId = objVendor.recbankprimid; // objVendor.bankid; // Receiving Bank Routing
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.Nm = objVendor.vbankname.replace(/[&.'"<>-]/g, ' ');
				dLog('IAC: countryCodeMapping[objVendor.vbankcountry]', countryCodeMapping[objVendor.vbankcountry]);
				if (countryCodeMapping[objVendor.vbankcountry] != '') {
					cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr = {};
					cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.Ctry = countryCodeMapping[objVendor.vbankcountry];
				}
				// cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr = {};
				// cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.Ctry = countryCodeMapping[objVendor.vbankcountry];

				// if ( (isEmpty(objVendor.vbankaddrs1)) || (isEmpty(objVendor.vbankzip)) || (isEmpty(objVendor.vbankcity)) || (isEmpty(objVendor.vbankstate)) ) {
				// 	cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.StrtNm = '';
				// 	cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.BldgNb = '';
				// 	cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.PstCd = '';
				// 	cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.TwnNm = '';
				// 	cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.CtrySubDvsn = '';
				// }
				// else {
				// 	cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.StrtNm = objVendor.vbankaddrs1;
				// 	cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.BldgNb = '';
				// 	cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.PstCd = objVendor.vbankzip;
				// 	cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.TwnNm = objVendor.vbankcity;
				// 	cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.CtrySubDvsn = objVendor.vbankstate;
				// }

				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.StrtNum = objVendor.vbankaddrs1.replace(/[&.'"<>-]/g, ' ') || '';
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.PstCd = objVendor.vbankzip.replace(/[&.'"<>-]/g, ' ') || '';
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.TwnNm = objVendor.vbankcity.replace(/[&.'"<>-]/g, ' ') || '';
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.BldgNb = '';
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.CtrySubDvsn = objVendor.vbankstate.replace(/[&.'"<>-]/g, ' ') || '';

				cdtTrfTxInfObj.Cdtr = {};
				cdtTrfTxInfObj.Cdtr.Nm = objVendor.vendorname.replace(/[&.'"<>-]/g, ' ');
				cdtTrfTxInfObj.Cdtr.PstlAdr = {};

				// if ( (isEmpty(objVendor.vendoraddrs1)) || (isEmpty(objVendor.vendorpostal)) || (isEmpty(objVendor.vendorcity)) || (isEmpty(objVendor.vendorstateprovince)) ) {
				// 	cdtTrfTxInfObj.Cdtr.PstlAdr.StrtNm = '';
				// 	cdtTrfTxInfObj.Cdtr.PstlAdr.BldgNb = "";
				// 	cdtTrfTxInfObj.Cdtr.PstlAdr.PstCd = '';
				// 	cdtTrfTxInfObj.Cdtr.PstlAdr.TwnNm = '';
				// 	cdtTrfTxInfObj.Cdtr.PstlAdr.CtrySubDvsn = '';
				// } else {
				// 	cdtTrfTxInfObj.Cdtr.PstlAdr.StrtNm = objVendor.vendoraddrs1;
				// 	cdtTrfTxInfObj.Cdtr.PstlAdr.BldgNb = objVendor.vendoraddrs2 || "";
				// 	cdtTrfTxInfObj.Cdtr.PstlAdr.PstCd = objVendor.vendorpostal;
				// 	cdtTrfTxInfObj.Cdtr.PstlAdr.TwnNm = objVendor.vendorcity;
				// 	cdtTrfTxInfObj.Cdtr.PstlAdr.CtrySubDvsn = objVendor.vendorstateprovince;
				// }

				cdtTrfTxInfObj.Cdtr.PstlAdr.StrtNm = objVendor.vendoraddrs1.replace(/[&.'"<>-]/g, ' ') || '';
				cdtTrfTxInfObj.Cdtr.PstlAdr.BldgNb = objVendor.vendoraddrs2.replace(/[&.'"-]/gi, ' ') || '';
				cdtTrfTxInfObj.Cdtr.PstlAdr.PstCd = objVendor.vendorpostal.replace(/[&.'"<>-]/g, ' ') || '';
				cdtTrfTxInfObj.Cdtr.PstlAdr.TwnNm = objVendor.vendorcity.replace(/[&.'"<>-]/g, ' ') || '';
				cdtTrfTxInfObj.Cdtr.PstlAdr.CtrySubDvsn = objVendor.vendorstateprovince.replace(/[&.'"<>-]/g, ' ') || '';

				// cdtTrfTxInfObj.Cdtr.PstlAdr.StrtNm = objVendor.vendoraddrs1;
				// cdtTrfTxInfObj.Cdtr.PstlAdr.BldgNb = objVendor.vendoraddrs2 || "";
				// cdtTrfTxInfObj.Cdtr.PstlAdr.PstCd = objVendor.vendorpostal;
				// cdtTrfTxInfObj.Cdtr.PstlAdr.TwnNm = objVendor.vendorcity;
				// cdtTrfTxInfObj.Cdtr.PstlAdr.CtrySubDvsn = objVendor.vendorstateprovince;
				cdtTrfTxInfObj.Cdtr.PstlAdr.Ctry = countryCodeMapping[objVendor.vendorcountrycode];

				var chars = objVendor.recpartyaccount.substring(0, 2);
				dAudit('CHECK for IBAN: objVendor.recpartyaccount', objVendor.recpartyaccount);
				var iban = objVendor.custentity_ica_bns_use_iban;
				if (iban == 'T') {
					cdtTrfTxInfObj.CdtrAcct = {};
					cdtTrfTxInfObj.CdtrAcct.Id = {};
					cdtTrfTxInfObj.CdtrAcct.Id.IBAN = objVendor.recpartyaccount;
				} else {
					cdtTrfTxInfObj.CdtrAcct = {};
					cdtTrfTxInfObj.CdtrAcct.Id = {};
					cdtTrfTxInfObj.CdtrAcct.Id.Othr = {};
					cdtTrfTxInfObj.CdtrAcct.Id.Othr.Id = objVendor.recpartyaccount;
				}
				if (isAlpha(chars)) {
					//IBAN
				} else {
				}

				// cdtTrfTxInfObj.RltdAmtInf = {};
				// cdtTrfTxInfObj.RltdAmtInf.RmtLctnMtd = objVendor.pmp_dac_contactname || "";
				// cdtTrfTxInfObj.RltdAmtInf.RmtLctnElctrncAdr = objVendor.pmp_dac_emailaddress || "";
				cdtTrfTxInfObj.RmtInf = {};
				cdtTrfTxInfObj.RmtInf.Ustrd = refnum;
				cdtTrfTxInfObj.RmtInf.VendorId = objVendor.entityid.replace(/[&.'"<>-]/g, ' ');
				cdtTrfTxInfObj.RmtInf.Category = objVendor.category.replace(/[&.'"<>-]/g, ' ');

				cdtTrfTxInfObj.RmtInf.Strd = Strd;
				cdtTrfTxInfObj.UltmtCdtr = {};
				cdtTrfTxInfObj.UltmtCdtr.Nm = objVendor.vendorname.replace(/[&.'"<>-]/g, ' ');

				CdtTrfTxInf.push(cdtTrfTxInfObj);
			}
		}
	}
	objects.CdtTrfTxInf = CdtTrfTxInf;

	// .replace(/[&.'"<>-]/g, '')

	dLog('objects', JSON.stringify(objects));

	var fileId = nlapiSearchRecord('file', null, [['name', 'is', 'ica_bns_iac.xml']], []);
	if (fileId != null) {
		fileId = fileId[0].getId();
	}

	var tmplFile = nlapiLoadFile(fileId);

	var template = Handlebars.compile(tmplFile.getValue());
	var xmlDoc = template(objects);

	dLog('xmlDoc', xmlDoc);
	return xmlDoc;
}

function createPacWestXMLDoc(objAcctMapping) {
	var arrTempBillIds = [];
	var arrBillCRIds = [];
	var arrBillAmt = [];
	var arrBillAmtOrig = [];
	var arrBillDiscAmt = [];
	var arrBillPayInfoCtr = [];
	var arrBillPayInfoSum = [];
	var arrGrpHdrNbOfTxs = [];
	var arrPmtInfNbOfTxs = [];
	var arrBillIds = [];
	var grpHdrNbOfTxs = 0;
	var grpHdrCtrlSum = 0;
	var arrPayeeIds = [];
	var _currencies = getCurrencies();

	for (x in arrBillsProcessed) {
		var billId = arrBillsProcessed[x].id;
		var billPaymentId = arrBillsProcessed[x].payment;

		dLog('createPacWestXMLDoc', 'Bill info = ' + JSON.stringify(arrBillsProcessed[x]));
		if (!isEmpty(billPaymentId) && billPaymentId != 'XXXNONEXXX' && billPaymentId != 'CREDIT') {
			if (billPaymentId != 'CREDIT') arrTempBillIds.push(billId);

			var payMethod = arrBillsProcessed[x].paymethod;
			var paymentId = arrBillsProcessed[x].payment;
			var payeeId = arrBillsProcessed[x].payeeid;

			arrBillAmtOrig[billId] = arrBillsProcessed[x].origamt;
			// arrBillAmt[billId] = arrBillsProcessed[x].pay;
			arrBillAmt[billId] = arrBillsProcessed[x].payamt;
			arrBillDiscAmt[billId] = arrBillsProcessed[x].discamt;

			var ndx = payMethod + '@@' + paymentId;

			if (arrBillPayInfoCtr[payMethod] == null) arrBillPayInfoCtr[payMethod] = 0;
			if (arrBillPayInfoSum[payMethod] == null) arrBillPayInfoSum[payMethod] = 0;
			if (arrPmtInfNbOfTxs[ndx] == null) arrPmtInfNbOfTxs[ndx] = 0;

			if (paymentId && arrGrpHdrNbOfTxs[paymentId] == null) grpHdrNbOfTxs++;

			arrPmtInfNbOfTxs[ndx]++;
			arrBillPayInfoCtr[payMethod]++;
			arrBillPayInfoSum[payMethod] += getFloatVal(arrBillsProcessed[x].payamt);
			arrGrpHdrNbOfTxs[paymentId] = paymentId;

			grpHdrCtrlSum += getFloatVal(arrBillsProcessed[x].payamt);
		}

		if (billPaymentId == 'CREDIT') arrBillCRIds.push(billId);
	}

	var arrBillIds = [];
	var arrBillIds2 = [];
	var arrBillIds3 = [];
	var arrBillIds4 = [];
	var arrBillIds5 = [];

	for (vx in arrTempBillIds) {
		var isBC = false;

		for (var x in arrBillCRIds) {
			if (arrTempBillIds[vx] == arrBillCRIds[x]) {
				isBC = true;
				break;
			}
		}

		if (!isBC) {
			arrBillIds.push(arrTempBillIds[vx]);
			arrBillIds2.push(arrTempBillIds[vx]);
			arrBillIds3.push(arrTempBillIds[vx]);
			arrBillIds4.push(arrTempBillIds[vx]);
			arrBillIds5.push(arrTempBillIds[vx]);
		}
	}

	var arrBillCredits = getBillCredit(arrBillIds);
	var objBillsData = getBillData(arrBillIds2);
	var arrBillPO = getPOMap(arrBillIds3);
	var arrVendorBills = getPayeeBillsByPayMethod(arrBillIds4);
	var arrVendorBillsCurr = getPayeeBillsCurrency(arrBillIds5);
	var nsAcctSub = !isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('subsidiary', 'CUSTRECORD_ACCT_MAP_NETSUITE_ACCOUNT')) ? objAcctMapping[0].getValue('subsidiary', 'CUSTRECORD_ACCT_MAP_NETSUITE_ACCOUNT') : '';
	var objVDCRecResults = getVendorDAC_CCRPaymentRec(nsAcctSub);
	dLog('objVDCRecResults', JSON.stringify(objVDCRecResults));
	dLog('objAcctMapping', JSON.stringify(objAcctMapping));

	//Gather data.
	var CdtTrfTxInf = [];

	var objects = {
		MsgId: 'TBD',
		CreDtTm: 'Test',
		Authstn: {
			Cd: '',
		},
		NbOfTxs: '2',
		CtrlSum: '2000',
		InitgPty: {
			Id: {
				OrgId: {
					Othr: {
						Id: '',
					},
				},
			},
		},
		PmtInfId: 'PmtInfId',
		PmtMtd: 'PmtMtd',
		PmtTpInf: {
			SvcLvl: {
				Cd: 'This is CD',
			},
		},
		ReqdExctnDt: 'ReqdExctnDt',
		Dbtr: {
			Nm: 'This is Nm',
			PstlAdr: {
				StrtNm: '',
				BldgNb: '',
				PstCd: '',
				TwnNm: '',
				CtrySubDvsn: '',
				Ctry: '',
			},
			Id: {
				Othr: {
					Id: 'Dbtr.Id.Othr.Id',
				},
			},
		},
		DbtrAcct: {
			Id: {
				Othr: {
					Id: 'DbtrAcct.Id.Othr.Id',
				},
			},
			PstlAdr: {
				StrtNm: '',
				BldgNb: '',
				PstCd: '',
				TwnNm: '',
				CtrySubDvsn: '',
				Ctry: '',
			},
		},
		DbtrAgt: {
			FinInstnId: {
				BIC: 'BIC',
				PstlAdr: {
					StrtNm: '',
					BldgNb: '',
					PstCd: '',
					TwnNm: '',
					CtrySubDvsn: '',
					Ctry: '',
				},
			},
		},
		CdtTrfTxInf: CdtTrfTxInf,
	};

	for (x in arrVendorBills) {
		var payeeId = x.split('X@X')[1];
		arrPayeeIds.push(payeeId);
	}

	var arrVendors = getEntityData(arrPayeeIds);

	var today = new Date();
	var bpmdate = BPM_DATE;
	var d = nlapiStringToDate(bpmdate, 'datetime');

	var fileCtrlNumber = Date.create().format('{yy}{MM}{dd}{mm}{ss}');
	objects.MsgId = pad(fileCtrlNumber, 4);
	objects.CreDtTm = moment(d).format('YYYY-MM-DDThh:mm:ss') || today.format('{yyyy}-{MM}-{dd}T{hh}:{mm}:{ss}');
	objects.Authstn.Cd = 'AUTH'; // Changed from AUTH
	objects.NbOfTxs = grpHdrNbOfTxs;
	objects.CtrlSum = grpHdrCtrlSum.toFixed(2); // Do we comment this out?

	if (objects.CtrlSum == '0.00') {
		dLog('CtrlSum is 0.00, this should not happen. Returning empty file', objects.CtrlSum);
		return '';
	}

	if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ceo_company_id'))) {
		objects.InitgPty.Id.OrgId.Othr.Id = objAcctMapping[0].getValue('custrecord_acct_map_ceo_company_id'); //CEO ID
	}

	for (x in arrBillPayInfoCtr) {
		objects.PmtInfId = fileCtrlNumber;
		var paymentMethod = x;
		objects.PmtMtd = 'TRF';

		objects.PmtTpInf.SvcLvl.Cd = paymentMethod == 'MTS' ? 'URGP' : 'NURG';
		objects.ReqdExctnDt = moment(d).format('YYYY-MM-DD') || today.format('{yyyy}-{MM}-{dd}');

		if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_companyname'))) objects.Dbtr.Nm = objVDCRecResults[0].getValue('custrecord_companyname');

		//PstlAdr
		var country = !isEmpty(objVDCRecResults) ? objVDCRecResults[0].getValue('custrecord_compcountrycode') : '';

		if (
			(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_comppostcode'))) ||
			(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compcity'))) ||
			(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compstateprov'))) ||
			(!isEmpty(objVDCRecResults) && objVDCRecResults[0].getValue('custrecord_compcountrycode')) ||
			(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compadd1')))
		) {
			if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compadd1'))) {
				objects.Dbtr.PstlAdr.StrtNm = '<StrtNm>' + objVDCRecResults[0].getValue('custrecord_compadd1') + '</StrtNm>';
			}
			if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compadd2'))) {
				objects.Dbtr.PstlAdr.BldgNb = '<BldgNb>' + objVDCRecResults[0].getValue('custrecord_compadd2') + '</BldgNb>';
			}

			if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_comppostcode'))) {
				objects.Dbtr.PstlAdr.PstCd = '<PstCd>' + objVDCRecResults[0].getValue('custrecord_comppostcode') + '</PstCd>';
			}
			// addTextNodeFromParentNode(xmlDoc, pstlAdr, 'PstCd', objVDCRecResults[0].getValue('custrecord_comppostcode'));

			if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compcity'))) {
				objects.Dbtr.PstlAdr.TwnNm = '<TwnNm>' + objVDCRecResults[0].getValue('custrecord_compcity') + '</TwnNm>';
			}
			// addTextNodeFromParentNode(xmlDoc, pstlAdr, 'TwnNm', objVDCRecResults[0].getValue('custrecord_compcity'));

			//Where do we get CtrySubDvsn?
			if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compstateprov'))) {
				objects.Dbtr.PstlAdr.CtrySubDvsn = '<CtrySubDvsn>' + objVDCRecResults[0].getValue('custrecord_compstateprov') + '</CtrySubDvsn>';
			}

			// addTextNodeFromParentNode(xmlDoc, pstlAdr, 'Ctry', country);
			if (country) {
				objects.Dbtr.PstlAdr.Ctry = '<Ctry>' + country + '</Ctry>';
			}
			dLog('Added Ctry', JSON.stringify(objects));

			// addTextNodeFromParentNode(xmlDoc, pstlAdr, 'AdrLine', objVDCRecResults[0].getValue('custrecord_compadd1'));
			// objects.Dbtr.PstlAdr.BldgNb = '2'; not used
		}

		if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_dom_ach_co_id'))) {
			objects.Dbtr.Id = {};
			objects.Dbtr.Id.Othr = {};
			objects.Dbtr.Id.Othr.Id = objAcctMapping[0].getValue('custrecord_acct_map_dom_ach_co_id'); //ACH Company ID
		}

		//DbtrAcct
		if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_origin_acc'))) {
			objects.DbtrAcct = {};
			objects.DbtrAcct.Id = {};
			objects.DbtrAcct.Id.Othr = {};
			objects.DbtrAcct.Id.Othr.Id = objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_origin_acc'); // Bank Account Number
		}

		//DbtrAgt
		if ((!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id'))) || !isEmpty(country)) {
			objects.DbtrAgt = {};
			objects.DbtrAgt.FinInstnId = {};
			if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_hsbc_swift_bank_id'))) {
				objects.DbtrAgt.FinInstnId.BIC = objAcctMapping[0].getValue('custrecord_acct_map_hsbc_swift_bank_id');
			}
			if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id'))) {
				objects.DbtrAgt.FinInstnId.ClrSysMmbId = {};
				objects.DbtrAgt.FinInstnId.ClrSysMmbId.MmbId = objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id'); // Routing Number 10 Digit
			}
			objects.DbtrAgt.FinInstnId.PstlAdr = {};
			objects.DbtrAgt.FinInstnId.PstlAdr.Ctry = country;
		}

		//CdtTrfTxInf loop starts here.

		if (SINGLEBILLPYMTS == 'T') {
			dAudit('Create Single Bill Payments here.', JSON.stringify(arrBillsProcessed));

			for (var i = 0; i < arrBillsProcessed.length; i++) {
				var billPayment = arrBillsProcessed[i];

				if (billPayment.payment == 'CREDIT') {
					continue;
				}

				var symbol = '';

				try {
					symbol = _.find(_currencies, { internalid: String(billPayment.currid) }).symbol;
				} catch (e) {}

				var objVendor = arrVendors[billPayment.payeeid];
				if (!objVendor) objVendor = _.find(arrVendors, { internalid: String(billPayment.payeeid) });

				dLog('objVendor', JSON.stringify(objVendor));

				var cdtTrfTxInfObj = {};
				cdtTrfTxInfObj.PmtId = {};

				var refnum = billPayment.refnum; //arrBillPaymentMap[billPayment.payeeid];
				// var refnum = billPayment.billnum; //arrBillPaymentMap[billPayment.payeeid];
				var instrId = '';
				if (refnum.length > 12) {
					instrId = pz(refnum.substring(refnum.length - 12, refnum.length), 12);
				} else {
					instrId = pz(refnum, 12);
				}
				refnum = billPayment.billnum; //Overwrite endToendID
				var endToEndId = refnum;
				if (refnum.length > 18) {
					endToEndId = refnum.substr(0, 18);
				}

				cdtTrfTxInfObj.PmtId.InstrId = instrId;
				cdtTrfTxInfObj.PmtId.EndToEndId = endToEndId;
				cdtTrfTxInfObj.Amt = {};
				cdtTrfTxInfObj.Amt.value = billPayment.payamt; //amt.toFixed(2);
				cdtTrfTxInfObj.Amt.Ccy = symbol;
				cdtTrfTxInfObj.ChrgBr = 'CRED';

				cdtTrfTxInfObj.CdtrAgt = {};
				cdtTrfTxInfObj.CdtrAgt.FinInstnId = {};
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.BIC = objVendor.recbankprimid;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.ClrSysMmbId = {};
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.ClrSysMmbId.MmbId = objVendor.bankid; // Receiving Bank Routing
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.Nm = objVendor.vbankname;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr = {};
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.Ctry = countryCodeMapping[objVendor.vbankcountry];
				// cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.AdrLine = objVendor.vbankaddrs1;

				if (isEmpty(objVendor.vbankaddrs1) || isEmpty(objVendor.vbankzip) || isEmpty(objVendor.vbankcity) || isEmpty(objVendor.vbankstate)) {
					cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.StrtNm = '';
					cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.BldgNb = '';
					cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.PstCd = '';
					cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.TwnNm = '';
					cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.CtrySubDvsn = '';
				} else {
					cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.StrtNm = objVendor.vbankaddrs1;
					cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.BldgNb = '';
					cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.PstCd = objVendor.vbankzip;
					cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.TwnNm = objVendor.vbankcity;
					cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.CtrySubDvsn = objVendor.vbankstate;
				}

				cdtTrfTxInfObj.Cdtr = {};
				cdtTrfTxInfObj.Cdtr.Nm = objVendor.vendorname;
				cdtTrfTxInfObj.Cdtr.PstlAdr = {};
				if (isEmpty(objVendor.vendoraddrs1) || isEmpty(objVendor.vendorpostal) || isEmpty(objVendor.vendorcity) || isEmpty(objVendor.vendorstateprovince)) {
					dLog('Here, should be empty', JSON.stringify(objVendor));
					cdtTrfTxInfObj.Cdtr.PstlAdr.StrtNm = '';
					cdtTrfTxInfObj.Cdtr.PstlAdr.BldgNb = '';
					cdtTrfTxInfObj.Cdtr.PstlAdr.PstCd = '';
					cdtTrfTxInfObj.Cdtr.PstlAdr.TwnNm = '';
					cdtTrfTxInfObj.Cdtr.PstlAdr.CtrySubDvsn = '';
				} else {
					dLog('Here?', JSON.stringify(objVendor));
					cdtTrfTxInfObj.Cdtr.PstlAdr.StrtNm = objVendor.vendoraddrs1;
					cdtTrfTxInfObj.Cdtr.PstlAdr.BldgNb = objVendor.vendoraddrs2 || '';
					cdtTrfTxInfObj.Cdtr.PstlAdr.PstCd = objVendor.vendorpostal;
					cdtTrfTxInfObj.Cdtr.PstlAdr.TwnNm = objVendor.vendorcity;
					cdtTrfTxInfObj.Cdtr.PstlAdr.CtrySubDvsn = objVendor.vendorstateprovince;
				}
				cdtTrfTxInfObj.Cdtr.PstlAdr.Ctry = countryCodeMapping[objVendor.vendorcountrycode];

				cdtTrfTxInfObj.CdtrAcct = {};
				cdtTrfTxInfObj.CdtrAcct.Id = {};
				cdtTrfTxInfObj.CdtrAcct.Id.Othr = {};
				cdtTrfTxInfObj.CdtrAcct.Id.Othr.Id = objVendor.recpartyaccount;

				// cdtTrfTxInfObj.RltdAmtInf = {};
				// cdtTrfTxInfObj.RltdAmtInf.RmtLctnMtd = objVendor.pmp_dac_contactname || "";
				// cdtTrfTxInfObj.RltdAmtInf.RmtLctnElctrncAdr = objVendor.pmp_dac_emailaddress || "";
				cdtTrfTxInfObj.RmtInf = {};
				cdtTrfTxInfObj.RmtInf.Ustrd = refnum;
				cdtTrfTxInfObj.RmtInf.Strd = Strd;

				CdtTrfTxInf.push(cdtTrfTxInfObj);
			}
		} else {
			dAudit('arrVendorBills', arrVendorBills);
			var refnum = '';
			var currency = '';
			var symbol = '';

			for (v in arrVendorBills) {
				var arrPayeeInfo = v.split('X@X');
				var payeeId = arrPayeeInfo[1];

				//var objVendor=arrVendors[payeeId];
				       var objVendor = _.find(arrVendors, { internalid: String(payeeId)});
				// var objVendor = _.find(arrVendors, { internalid: String(payeeId), paymentmethod: String(paymentMethod) })[0];
dAudit('objVendor-new', objVendor);				dLog('objVendor', JSON.stringify(objVendor));

				if (isEmpty(objVendor)) continue;

				var pmtMethod = objVendor.paymentmethod;

				if (paymentMethod != pmtMethod) continue;

				var arrBills = arrVendorBills[paymentMethod + 'X@X' + payeeId];
				dLog('arrBills', JSON.stringify(arrBills));
				var tmpAmt = 0;

				var numberOfBills = _.size(arrBills);
				for (by in arrBills) {
					var billId = arrBills[by];
					refnum = _.find(arrBillsProcessed, { id: String(billId) }).refnum;
					currency = _.find(arrBillsProcessed, { id: String(billId) }).currid;
					subtext = _.find(arrBillsProcessed, { id: String(billId) }).subtext;
					billnum = _.find(arrBillsProcessed, { id: String(billId) }).billnum;

					try {
						symbol = _.find(_currencies, { internalid: String(currency) }).symbol;
					} catch (e) {}
					// dLog('createAUACHXMLDocrefnum', JSON.stringify(refnum));

					var netAmt = 0;
					var origAmt = getFloatVal(arrBillAmtOrig[billId]);
					var amt = getFloatVal(arrBillAmt[billId]);

					var discAmt = !isEmpty(arrBillDiscAmt[billId]) ? getFloatVal(arrBillDiscAmt[billId]) : 0;

					dLog(
						'amounts',
						JSON.stringify({
							netAmt: netAmt,
							origAmt: origAmt,
							amt: amt,
							discAmt: discAmt,
						})
					);

					netAmt = origAmt;
					tmpAmt += amt; //used to be netAmt

					if (discAmt > 0) {
						netAmt -= discAmt;
						tmpAmt -= discAmt;
					}

					if (!isEmpty(arrBillCredits[billId])) {
						var arrBC = arrBillCredits[billId];

						dLog('arrBC in arrBills', JSON.stringify(arrBC));

						for (bc in arrBC) {
							var billCreditAmtP = getFloatVal(arrBC[bc].bcamt);
							var billCreditAmt = billCreditAmtP * -1;

							// tmpAmt = (tmpAmt - billCreditAmtP);
							netAmt = netAmt - billCreditAmtP;
						}
					}
				}

				var cdtTrfTxInfObj = {};
				cdtTrfTxInfObj.PmtId = {};

				var refnum = arrBillPaymentMap[payeeId];
				var instrId = '';
				if (refnum.length > 12) {
					instrId = pz(refnum.substring(refnum.length - 12, refnum.length), 12);
				} else {
					instrId = pz(refnum, 12);
				}
				var endToEndId = billnum.substr(0, 18);
				if (numberOfBills > 1) {
					endToEndId = subtext.substr(0, 18);
				}
				//refnum

				cdtTrfTxInfObj.PmtId.InstrId = instrId;
				cdtTrfTxInfObj.PmtId.EndToEndId = endToEndId;
				cdtTrfTxInfObj.Amt = {};
				cdtTrfTxInfObj.Amt.value = tmpAmt.toFixed(2); //amt.toFixed(2);
				cdtTrfTxInfObj.Amt.Ccy = symbol;
				cdtTrfTxInfObj.ChrgBr = 'CRED';

				tmpAmt = 0; // need to initialize back to 0

				var Strd = [];

				for (y in arrBills) {
					var billId = arrBills[y];
					var StrdObj = {};
					StrdObj.RfrdDocInf = {};
					StrdObj.RfrdDocInf.Tp = {};
					StrdObj.RfrdDocInf.Tp.CdOrPrtry = {};
					StrdObj.RfrdDocInf.Tp.CdOrPrtry.Cd = 'CINV'; //Hardcoded?

					var netAmt = 0;
					var origAmt = getFloatVal(arrBillAmtOrig[billId]);
					var amt = getFloatVal(arrBillAmt[billId]);

					var discAmt = !isEmpty(arrBillDiscAmt[billId]) ? getFloatVal(arrBillDiscAmt[billId]) : 0;

					dLog('billId before', billId);
					dLog('arrBC in y.arrBills before', JSON.stringify(arrBillCredits));

					if (!isEmpty(arrBillCredits[billId])) {
						var arrBC = arrBillCredits[billId];

						dLog('arrBC in y.arrBills', JSON.stringify(arrBC));

						for (bc in arrBC) {
							var billCreditAmtP = getFloatVal(arrBC[bc].bcamt);
							var billCreditAmt = billCreditAmtP * -1;

							// tmpAmt = (tmpAmt - billCreditAmtP);
							netAmt = netAmt - billCreditAmtP;
						}
					}

					// tmpAmt += amt;
					netAmt = origAmt;
					tmpAmt += amt; //used to be netAmt

					if (discAmt > 0) {
						netAmt -= discAmt;
						tmpAmt -= discAmt;
					}

					dLog('createUSWIREXMLDoc. objBillsData', JSON.stringify(objBillsData[billId]));

					if (!isEmpty(objBillsData[billId].num)) {
						StrdObj.RfrdDocInf.Nb = objBillsData[billId].num;
					} else if (!isEmpty(objBillsData[billId].trnxnumber)) {
						StrdObj.RfrdDocInf.Nb = objBillsData[billId].trnxnumber;
					}

					var invoiceDate = objBillsData[billId].dte;
					StrdObj.RfrdDocInf.RltdDt = formatDate(nlapiStringToDate(invoiceDate));
					StrdObj.RfrdDocAmt = {};
					StrdObj.RfrdDocAmt.DuePyblAmt = {};
					StrdObj.RfrdDocAmt.DscntApldAmt = {};
					StrdObj.RfrdDocAmt.RmtdAmt = {};
					StrdObj.RfrdDocAmt.DuePyblAmt.value = origAmt.toFixed(2);

					if (discAmt == 0) discAmt = '';
					else discAmt = discAmt.toFixed(2);

					StrdObj.RfrdDocAmt.DscntApldAmt.value = discAmt;
					StrdObj.RfrdDocAmt.RmtdAmt.value = netAmt.toFixed(2);

					StrdObj.RfrdDocAmt.DuePyblAmt.Ccy = symbol;
					StrdObj.RfrdDocAmt.DscntApldAmt.Ccy = symbol;
					StrdObj.RfrdDocAmt.RmtdAmt.Ccy = symbol;

					//Add CDtrRefInf
					StrdObj.CdtrRefInf = {};
					StrdObj.CdtrRefInf.Tp = {};
					StrdObj.CdtrRefInf.CdOrPrtry = {};
					StrdObj.CdtrRefInf.CdOrPrtry.Cd = 'PUOR';

					Strd.push(StrdObj);

					if (!isEmpty(arrBillCredits[billId])) {
						var arrBC = arrBillCredits[billId];

						for (bc in arrBC) {
							var billCreditAmtP = getFloatVal(arrBC[bc].bcamt);
							var billCreditAmt = billCreditAmtP;

							tmpAmt = tmpAmt - billCreditAmtP;
							netAmt = netAmt - billCreditAmtP;

							var StrdObj = {};
							StrdObj.RfrdDocInf = {};
							StrdObj.RfrdDocInf.Tp = {};
							StrdObj.RfrdDocInf.Tp.CdOrPrtry = {};
							StrdObj.RfrdDocInf.Tp.CdOrPrtry.Cd = 'CREN'; //Hardcoded?

							var bcNum = arrBC[bc].bcnum;
							dLog('createJPMXMLDoc', 'VC number : ' + bcNum);

							if (!isEmpty(bcNum)) StrdObj.RfrdDocInf.Nb = bcNum;
							else if (!isEmpty(arrBillCredits[billId].bcmemo)) {
								StrdObj.RfrdDocInf.Nb = arrBillCredits[billId].bcmemo;
							}

							var invoiceDate = objBillsData[billId].dte;
							StrdObj.RfrdDocInf.RltdDt = formatDate(nlapiStringToDate(arrBC[bc].bcdate));

							StrdObj.RfrdDocAmt = {};
							StrdObj.RfrdDocAmt.DuePyblAmt = {};
							StrdObj.RfrdDocAmt.DscntApldAmt = {};
							StrdObj.RfrdDocAmt.CdtNoteAmt = {};

							StrdObj.RfrdDocAmt.DuePyblAmt.value = billCreditAmt.toFixed(2);
							if (discAmt == 0) discAmt = '';
							else discAmt = discAmt.toFixed(2);

							StrdObj.RfrdDocAmt.DscntApldAmt.value = discAmt;
							StrdObj.RfrdDocAmt.CdtNoteAmt.value = billCreditAmt.toFixed(2);

							StrdObj.RfrdDocAmt.DuePyblAmt.Ccy = symbol;
							StrdObj.RfrdDocAmt.DscntApldAmt.Ccy = symbol;
							StrdObj.RfrdDocAmt.CdtNoteAmt.Ccy = symbol;

							Strd.push(StrdObj);
						}
					}
				}

				cdtTrfTxInfObj.CdtrAgt = {};
				cdtTrfTxInfObj.CdtrAgt.FinInstnId = {};
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.BIC = objVendor.recbankprimid;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.ClrSysMmbId = {};
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.ClrSysMmbId.MmbId = objVendor.bankid; // Receiving Bank Routing
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.Nm = objVendor.vbankname;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr = {};
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.Ctry = countryCodeMapping[objVendor.vbankcountry];

				if (isEmpty(objVendor.vbankaddrs1) || isEmpty(objVendor.vbankzip) || isEmpty(objVendor.vbankcity) || isEmpty(objVendor.vbankstate)) {
					cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.StrtNm = '';
					cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.BldgNb = '';
					cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.PstCd = '';
					cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.TwnNm = '';
					cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.CtrySubDvsn = '';
				} else {
					cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.StrtNm = objVendor.vbankaddrs1;
					cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.BldgNb = '';
					cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.PstCd = objVendor.vbankzip;
					cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.TwnNm = objVendor.vbankcity;
					cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.CtrySubDvsn = objVendor.vbankstate;
				}

				// cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.StrtNum = objVendor.vbankaddrs1;
				// cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.PstCd = objVendor.vbankzip;
				// cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.TwnNm = objVendor.vbankcity;
				// cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.BldgNb = '';
				// cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.CtrySubDvsn = objVendor.vbankstate;

				cdtTrfTxInfObj.Cdtr = {};
				cdtTrfTxInfObj.Cdtr.Nm = objVendor.vendorname;
				cdtTrfTxInfObj.Cdtr.PstlAdr = {};

				if (isEmpty(objVendor.vendoraddrs1) || isEmpty(objVendor.vendorpostal) || isEmpty(objVendor.vendorcity) || isEmpty(objVendor.vendorstateprovince)) {
					cdtTrfTxInfObj.Cdtr.PstlAdr.StrtNm = '';
					cdtTrfTxInfObj.Cdtr.PstlAdr.BldgNb = '';
					cdtTrfTxInfObj.Cdtr.PstlAdr.PstCd = '';
					cdtTrfTxInfObj.Cdtr.PstlAdr.TwnNm = '';
					cdtTrfTxInfObj.Cdtr.PstlAdr.CtrySubDvsn = '';
				} else {
					cdtTrfTxInfObj.Cdtr.PstlAdr.StrtNm = objVendor.vendoraddrs1;
					cdtTrfTxInfObj.Cdtr.PstlAdr.BldgNb = objVendor.vendoraddrs2 || '';
					cdtTrfTxInfObj.Cdtr.PstlAdr.PstCd = objVendor.vendorpostal;
					cdtTrfTxInfObj.Cdtr.PstlAdr.TwnNm = objVendor.vendorcity;
					cdtTrfTxInfObj.Cdtr.PstlAdr.CtrySubDvsn = objVendor.vendorstateprovince;
				}

				// cdtTrfTxInfObj.Cdtr.PstlAdr.StrtNm = objVendor.vendoraddrs1;
				// cdtTrfTxInfObj.Cdtr.PstlAdr.BldgNb = objVendor.vendoraddrs2 || "";
				// cdtTrfTxInfObj.Cdtr.PstlAdr.PstCd = objVendor.vendorpostal;
				// cdtTrfTxInfObj.Cdtr.PstlAdr.TwnNm = objVendor.vendorcity;
				// cdtTrfTxInfObj.Cdtr.PstlAdr.CtrySubDvsn = objVendor.vendorstateprovince;
				cdtTrfTxInfObj.Cdtr.PstlAdr.Ctry = countryCodeMapping[objVendor.vendorcountrycode];

				var chars = objVendor.recpartyaccount.substring(0, 2);
				dAudit('CHECK for IBAN: objVendor.recpartyaccount', objVendor.recpartyaccount);
				if (isAlpha(chars)) {
					//IBAN

					cdtTrfTxInfObj.CdtrAcct = {};
					cdtTrfTxInfObj.CdtrAcct.Id = {};
					cdtTrfTxInfObj.CdtrAcct.Id.IBAN = objVendor.recpartyaccount;
				} else {
					cdtTrfTxInfObj.CdtrAcct = {};
					cdtTrfTxInfObj.CdtrAcct.Id = {};
					cdtTrfTxInfObj.CdtrAcct.Id.Othr = {};
					cdtTrfTxInfObj.CdtrAcct.Id.Othr.Id = objVendor.recpartyaccount;
				}

				// cdtTrfTxInfObj.RltdAmtInf = {};
				// cdtTrfTxInfObj.RltdAmtInf.RmtLctnMtd = objVendor.pmp_dac_contactname || "";
				// cdtTrfTxInfObj.RltdAmtInf.RmtLctnElctrncAdr = objVendor.pmp_dac_emailaddress || "";
				cdtTrfTxInfObj.RmtInf = {};
				cdtTrfTxInfObj.RmtInf.Ustrd = refnum;
				cdtTrfTxInfObj.RmtInf.Strd = Strd;

				CdtTrfTxInf.push(cdtTrfTxInfObj);
			}
		}
	}
	objects.CdtTrfTxInf = CdtTrfTxInf;

	dLog('objects', JSON.stringify(objects));

	var fileId = nlapiSearchRecord('file', null, [['name', 'is', 'ica_pacwest.xml']], []);
	if (fileId != null) {
		fileId = fileId[0].getId();
	}

	var tmplFile = nlapiLoadFile(fileId);

	var template = Handlebars.compile(tmplFile.getValue());
	var xmlDoc = template(objects);

	dLog('xmlDoc', xmlDoc);
	return xmlDoc;
}

/**
 *
 * @param bills
 * @param subId
 * @returns
 */
function createEWBXMLDoc(objAcctMapping) {
	try {
		dLog('createEWBXMLDoc', '>>> START <<<');

		var schema = nlapiGetContext().getSetting('SCRIPT', 'custscript_v16_xml_schema');

		// dLog('creatXMLDoc', 'VPM Mapping results = ' +
		// JSON.stringify(objAcctMapping));

		// start create xml line
		var xmlDoc = nlapiStringToXML('<?xml version="1.0" encoding="utf-8"?><Document></Document>');
		var DocumentNode = getNode(xmlDoc, '/Document');
		setAttributeValue(DocumentNode, 'xmlns', 'urn:iso:std:iso:20022:tech:xsd:pain.001.001.03');

		var ns1 = 'urn:iso:std:iso:20022:tech:xsd:pain.001.001.03';
		var xsi = 'http://www.w3.org/2001/XMLSchema-instance';
		DocumentNode.setAttributeNS(xsi, 'xsi:schemaLocation', 'urn:iso:std:iso:20022:tech:xsd:pain.001.001.03 file:///H:/EDI%20SERVICES%20REFERENCE%20DATA/XML/SCHEMAS/pain.001.001.03.xsd');

		var cstmrCdtTrfInitnNode = addNodeFromParentNode(xmlDoc, DocumentNode, 'CstmrCdtTrfInitn');

		var arrTempBillIds = [];
		var arrBillCRIds = [];
		var arrBillAmt = [];
		var arrBillAmtOrig = [];
		var arrBillDiscAmt = [];
		var arrBillPayInfoCtr = [];
		var arrBillPayInfoSum = [];
		var arrGrpHdrNbOfTxs = [];
		var arrPmtInfNbOfTxs = [];
		var arrBillIds = [];
		var grpHdrNbOfTxs = 0;
		var grpHdrCtrlSum = 0;

		for (x in arrBillsProcessed) {
			var billId = arrBillsProcessed[x].id;
			var billPaymentId = arrBillsProcessed[x].payment;

			dLog('createEWBXMLDoc', 'Bill info = ' + JSON.stringify(arrBillsProcessed[x]));

			// check if payment id exist, only generate xml bills with payment
			// id, skip processed bill credit
			if (!isEmpty(billPaymentId) && billPaymentId != 'XXXNONEXXX' && billPaymentId != 'CREDIT') {
				if (billPaymentId != 'CREDIT') arrTempBillIds.push(billId);

				var payMethod = arrBillsProcessed[x].paymethod;
				var paymentId = arrBillsProcessed[x].payment;
				var payeeId = arrBillsProcessed[x].payeeid;

				arrBillAmtOrig[billId] = arrBillsProcessed[x].origamt;
				// arrBillAmt[billId] = arrBillsProcessed[x].pay;
				arrBillAmt[billId] = arrBillsProcessed[x].payamt;
				arrBillDiscAmt[billId] = arrBillsProcessed[x].discamt;

				var ndx = payMethod + '@@' + paymentId;

				if (arrBillPayInfoCtr[payMethod] == null) arrBillPayInfoCtr[payMethod] = 0;
				if (arrBillPayInfoSum[payMethod] == null) arrBillPayInfoSum[payMethod] = 0;
				if (arrPmtInfNbOfTxs[ndx] == null) arrPmtInfNbOfTxs[ndx] = 0;

				if (paymentId && arrGrpHdrNbOfTxs[paymentId] == null) grpHdrNbOfTxs++;

				arrPmtInfNbOfTxs[ndx]++;
				arrBillPayInfoCtr[payMethod]++;
				arrBillPayInfoSum[payMethod] += getFloatVal(arrBillsProcessed[x].payamt);
				arrGrpHdrNbOfTxs[paymentId] = paymentId;

				grpHdrCtrlSum += getFloatVal(arrBillsProcessed[x].payamt);
			}

			if (billPaymentId == 'CREDIT') arrBillCRIds.push(billId);
		}

		var arrBillIds2 = [];
		var arrBillIds3 = [];
		var arrBillIds4 = [];
		var arrBillIds5 = [];

		for (vx in arrTempBillIds) {
			var isBC = false;

			for (var x in arrBillCRIds) {
				if (arrTempBillIds[vx] == arrBillCRIds[x]) {
					isBC = true;
					break;
				}
			}

			if (!isBC) {
				arrBillIds.push(arrTempBillIds[vx]);
				arrBillIds2.push(arrTempBillIds[vx]);
				arrBillIds3.push(arrTempBillIds[vx]);
				arrBillIds4.push(arrTempBillIds[vx]);
				arrBillIds5.push(arrTempBillIds[vx]);
			}
		}

		dAudit(
			'createEWBXMLDoc',
			JSON.stringify({
				'arrBillIds.length': arrBillIds.length,
				'arrBillIds2.length': arrBillIds2.length,
				'arrBillIds3.length': arrBillIds3.length,
				'arrBillIds4.length': arrBillIds4.length,
				'arrBillIds5.length': arrBillIds5.length,
			})
		);

		dLog('createEWBXMLDoc', 'arrBillIds = ' + arrBillIds);
		dLog('createEWBXMLDoc', 'arrBillIds.length ' + arrBillIds.length);

		if (arrBillIds.length < 1) {
			dLog('createEWBXMLDoc', 'No bill id to generate xml. exit xml creation.');
			return null;
		}

		var arrBillCredits = getBillCredit(arrBillIds);
		var objBillsData = getBillData(arrBillIds2);
		var arrBillPO = getPOMap(arrBillIds3);
		var arrVendorBills = getPayeeBillsByPayMethod(arrBillIds4);
		var arrVendorBillsCurr = getPayeeBillsCurrency(arrBillIds5);
		var nsAcctSub = !isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('subsidiary', 'CUSTRECORD_ACCT_MAP_NETSUITE_ACCOUNT')) ? objAcctMapping[0].getValue('subsidiary', 'CUSTRECORD_ACCT_MAP_NETSUITE_ACCOUNT') : '';
		var objVDCRecResults = getVendorDAC_CCRPaymentRec(nsAcctSub);
		var arrCurrMap = getCurrecnyISOCode();
		var currDate = formatDate(new Date());
		var tmpTotalAmt = 0;
		var arrPayeeIds = [];

		dAudit(
			'createEWBXMLDoc',
			JSON.stringify({
				'arrBillCredits.length': arrBillCredits.length,
				'objBillsData.length': objBillsData.length,
				'arrBillPO.length': arrBillPO.length,
				'arrVendorBills.length': arrVendorBills.length,
				'objVDCRecResults.length': objVDCRecResults.length,
			})
		);

		// get Total Bill amount
		for (x in arrVendorBills) {
			var arrBillIds = arrVendorBills[x];
			// dLog('creatBOAXMLDoc', 'Vendor Id = ' + x);

			var payeeId = x.split('X@X')[1];
			arrPayeeIds.push(payeeId);

			for (vbill in arrBillIds) {
				// pmtTotalAmt += getFloatVal(arrBillAmt[arrBillIds[vbill]]);
			}
		}

		arrPayeeIds = removeDuplicates(arrPayeeIds);
		var arrVendors = getEntityData(arrPayeeIds);
		// var arrPayeeInterBillsMemo = getPayeeBillsMemo(arrPayeeIds);
		// dLog('creatBOAXMLDoc', 'pmtTotalAmt = ' + pmtTotalAmt);

		var fileCtrlNumber = Date.create().format('{yy}{MM}{dd}{mm}{ss}');

		// ***START*** A. GROUP HEADER
		var grpHdr = addNodeFromParentNode(xmlDoc, cstmrCdtTrfInitnNode, 'GrpHdr');
		addTextNodeFromParentNode(xmlDoc, grpHdr, 'MsgId', 'FILE' + pad(fileCtrlNumber, 4));

		// var currDate = Date.create();
		var currDate = new Date();
		// var mm = ("0" + currDate.getMilliseconds()).slice(-2);
		// var ss = ("0" + currDate.getMilliseconds()).slice(-2);
		// var ms = ("0" + currDate.getMilliseconds()).slice(-2);
		addTextNodeFromParentNode(xmlDoc, grpHdr, 'CreDtTm', currDate.format('{yyyy}-{MM}-{dd}T{hh}:{mm}:{ss}'));
		addTextNodeFromParentNode(xmlDoc, grpHdr, 'NbOfTxs', grpHdrNbOfTxs);
		addTextNodeFromParentNode(xmlDoc, grpHdr, 'CtrlSum', grpHdrCtrlSum.toFixed(2));

		var initgPty = addNodeFromParentNode(xmlDoc, grpHdr, 'InitgPty');
		var idInitgPty = addNodeFromParentNode(xmlDoc, initgPty, 'Id');
		var orgIdIdInitgPty = addNodeFromParentNode(xmlDoc, idInitgPty, 'OrgId');
		var othrOrgIdIdInitgPty = addNodeFromParentNode(xmlDoc, orgIdIdInitgPty, 'Othr');

		if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_cash_pro_send_id_bank_america'))) addTextNodeFromParentNode(xmlDoc, othrOrgIdIdInitgPty, 'Id', objVDCRecResults[0].getValue('custrecord_cash_pro_send_id_bank_america'));

		// ***END*** A. GROUP HEADER

		var ccy = '';
		if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_account_currency'))) ccy = arrCurrMap[objAcctMapping[0].getValue('custrecord_acct_map_account_currency')];

		dAudit('arrBillPayInfoCtr', JSON.stringify(arrBillPayInfoCtr));
		dAudit('arrBillPayInfoCtr.length', JSON.stringify(arrBillPayInfoCtr.length));

		for (x in arrBillPayInfoCtr) {
			// var arrTemp = x.split('@@');
			// var payeeId = arrTemp[1];
			var paymentMethod = x;

			// ***START*** B. PAYMENT INFORMATION SECTION
			var pmtInf = addNodeFromParentNode(xmlDoc, cstmrCdtTrfInitnNode, 'PmtInf');

			//Added for EWB
			// var pmtInfId = addNodeFromParentNode(xmlDoc, cstmrCdtTrfInitnNode, 'PmtInfId');

			addTextNodeFromParentNode(xmlDoc, pmtInf, 'PmtInfId', 'PAYMENT');

			if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_ceocompid'))) addTextNodeFromParentNode(xmlDoc, pmtInf, 'PmtInfId', objVDCRecResults[0].getValue('custrecord_ceocompid'));

			addTextNodeFromParentNode(xmlDoc, pmtInf, 'PmtMtd', paymentMethod == 'DAC' ? 'TRF' : paymentMethod);

			var pmtInfNbOfTxs = 0;
			for (pnb in arrPmtInfNbOfTxs) {
				var tmp = pnb.split('@@');
				var tmpPmethod = tmp[0];
				if (tmpPmethod == paymentMethod) {
					pmtInfNbOfTxs++;
				}
			}
			addTextNodeFromParentNode(xmlDoc, pmtInf, 'NbOfTxs', pmtInfNbOfTxs);

			addTextNodeFromParentNode(xmlDoc, pmtInf, 'CtrlSum', Number(arrBillPayInfoSum[paymentMethod]).toFixed(2));

			var pmtTpInf = addNodeFromParentNode(xmlDoc, pmtInf, 'PmtTpInf');
			var svcLvl = addNodeFromParentNode(xmlDoc, pmtTpInf, 'SvcLvl');
			addTextNodeFromParentNode(xmlDoc, svcLvl, 'Cd', 'NURG');

			var lclInstrm = addNodeFromParentNode(xmlDoc, pmtTpInf, 'LclInstrm');
			//var objVendor = arrVendors[payeeId];
			        var objVendor = _.find(arrVendors, { internalid: String(payeeId)});
				//v.ar objVendor = _.find(arrVendors, { internalid: String(payeeId), paymentmethod: String(paymentMethod) })[0];
			if (objVendor) {
				if (!isEmpty(objVendor.payformat)) addTextNodeFromParentNode(xmlDoc, lclInstrm, 'Cd', objVendor.payformat);
			}
			// addTextNodeFromParentNode(xmlDoc, lclInstrm, "Cd", "CTX");

			var new_date = moment(new Date()).add(1, 'days').format('YYYY-MM-DD');
			addTextNodeFromParentNode(xmlDoc, pmtInf, 'ReqdExctnDt', new_date); //currDate.format("{yyyy}-{MM}-{dd}")

			var dbtr = addNodeFromParentNode(xmlDoc, pmtInf, 'Dbtr');

			if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_companyname'))) addTextNodeFromParentNode(xmlDoc, dbtr, 'Nm', objVDCRecResults[0].getValue('custrecord_companyname'));

			if (
				(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_comppostcode'))) ||
				(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compcity'))) ||
				(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compstateprov'))) ||
				(!isEmpty(objVDCRecResults) && objVDCRecResults[0].getValue('custrecord_compcountrycode')) ||
				(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compadd1')))
			) {
				var pstlAdr = addNodeFromParentNode(xmlDoc, dbtr, 'PstlAdr');

				if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_comppostcode'))) addTextNodeFromParentNode(xmlDoc, pstlAdr, 'PstCd', objVDCRecResults[0].getValue('custrecord_comppostcode'));

				if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compcity'))) addTextNodeFromParentNode(xmlDoc, pstlAdr, 'TwnNm', objVDCRecResults[0].getValue('custrecord_compcity'));

				if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compstateprov'))) addTextNodeFromParentNode(xmlDoc, pstlAdr, 'CtrySubDvsn', objVDCRecResults[0].getValue('custrecord_compstateprov'));

				var country = !isEmpty(objVDCRecResults) ? objVDCRecResults[0].getValue('custrecord_compcountrycode') : '';
				addTextNodeFromParentNode(xmlDoc, pstlAdr, 'Ctry', country);

				if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compadd1'))) addTextNodeFromParentNode(xmlDoc, pstlAdr, 'AdrLine', objVDCRecResults[0].getValue('custrecord_compadd1'));
			}

			var idPmtInf = addNodeFromParentNode(xmlDoc, dbtr, 'Id');
			var orgIdIdPmtInf = addNodeFromParentNode(xmlDoc, idPmtInf, 'OrgId');
			var othrOrgIdIdPmtInf = addNodeFromParentNode(xmlDoc, orgIdIdPmtInf, 'Othr');

			if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_dom_ach_co_id'))) addTextNodeFromParentNode(xmlDoc, othrOrgIdIdPmtInf, 'Id', objAcctMapping[0].getValue('custrecord_acct_map_dom_ach_co_id'));

			var schmeNm = addNodeFromParentNode(xmlDoc, othrOrgIdIdPmtInf, 'SchmeNm');
			addTextNodeFromParentNode(xmlDoc, schmeNm, 'Prtry', 'JPMCOID');

			var dbtrAcct = addNodeFromParentNode(xmlDoc, pmtInf, 'DbtrAcct');
			var idDbtrAcct = addNodeFromParentNode(xmlDoc, dbtrAcct, 'Id');

			var otherDbtrAcct = addNodeFromParentNode(xmlDoc, idDbtrAcct, 'Othr');

			if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_origin_acc'))) addTextNodeFromParentNode(xmlDoc, otherDbtrAcct, 'Id', objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_origin_acc'));

			if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_account_currency'))) addTextNodeFromParentNode(xmlDoc, dbtrAcct, 'Ccy', arrCurrMap[objAcctMapping[0].getValue('custrecord_acct_map_account_currency')]);

			if ((!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id'))) || !isEmpty(country)) {
				var dbtrAgt = addNodeFromParentNode(xmlDoc, pmtInf, 'DbtrAgt');
				var finlstnId = addNodeFromParentNode(xmlDoc, dbtrAgt, 'FinInstnId');
				var clrSysMmbId = addNodeFromParentNode(xmlDoc, finlstnId, 'ClrSysMmbId');

				if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id'))) addTextNodeFromParentNode(xmlDoc, clrSysMmbId, 'MmbId', objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id'));

				var pstlAdr = addNodeFromParentNode(xmlDoc, finlstnId, 'PstlAdr');
				addTextNodeFromParentNode(xmlDoc, pstlAdr, 'Ctry', country);
			}

			// ***END*** B. PAYMENT INFORMATION SECTION

			// dLog('creatBOAXMLDoc', 'Bill Payment Method = ' + paymentMethod);

			dAudit('arrVendorBills', arrVendorBills);
			var payformat = '';
			for (v in arrVendorBills) {
				var arrPayeeInfo = v.split('X@X');
				var payeeId = arrPayeeInfo[1];

				dLog('createJPMXMLDoc', 'vb ndex = ' + v);
				       var objVendor = _.find(arrVendors, { internalid: String(payeeId)});
				// var objVendor = _.find(arrVendors, { internalid: String(payeeId), paymentmethod: String(paymentMethod) })[0];
dAudit('objVendor-new', objVendor);
				if (isEmpty(objVendor)) continue;
				if (payformat == '') payformat = objVendor.payformat;

				var pmtMethod = objVendor.paymentmethod;
				if (paymentMethod != pmtMethod) continue;

				dLog('createJPMXMLDoc', 'Vendor Payment Method = ' + pmtMethod);

				// dLog('creatBOAXMLDoc', 'paymentMethod = ' + paymentMethod);
				// dLog('creatBOAXMLDoc', 'pmtMethod = ' +
				// objVendor.paymentmethod);

				var arrBills = arrVendorBills[paymentMethod + 'X@X' + payeeId];
				// var pmtRecCurAmt = 0;
				var tmpAmt = 0;
				var instdAmt = 0;

				// for (bill in arrBills) {
				// pmtRecCurAmt += getFloatVal(arrBillAmt[arrBills[bill]]);
				// }

				var numberOfBills = _.size(arrBills);
				for (by in arrBills) {
					var billId = arrBills[by];
					// if (pmtMethod == 'CHK' || pmtMethod == 'DAC' || pmtMethod
					// ==
					// 'CCR' || pmtMethod == 'IWI' || pmtMethod == 'MTS' ||
					// pmtMethod == 'IAC') {

					var netAmt = 0;
					var origAmt = getFloatVal(arrBillAmtOrig[billId]);
					var amt = getFloatVal(arrBillAmt[billId]); //this is the payment amount

					// dLog('creatXMLDoc', 'origAmt = ' + origAmt);
					// dLog('creatXMLDoc', 'amt = ' + amt);

					var discAmt = !isEmpty(arrBillDiscAmt[billId]) ? getFloatVal(arrBillDiscAmt[billId]) : 0;

					// tmpAmt += amt;
					netAmt = origAmt; //origAmt; CHANGED FROM AMT
					tmpAmt += netAmt;
					instdAmt += amt;
					if (discAmt > 0) {
						netAmt -= discAmt;
						tmpAmt -= discAmt;
						instdAmt -= discAmt;
					}

					if (!isEmpty(arrBillCredits[billId])) {
						var arrBC = arrBillCredits[billId];

						for (bc in arrBC) {
							var billCreditAmtP = getFloatVal(arrBC[bc].bcamt);
							var billCreditAmt = billCreditAmtP * -1;

							// pmtTotalAmt = (pmtTotalAmt - billCreditAmtP);
							// pmtRecCurAmt = (pmtRecCurAmt - billCreditAmtP);
							tmpAmt = tmpAmt - billCreditAmtP;
							netAmt = netAmt - billCreditAmtP;
							// instdAmt -= billCreditAmtP;
						}
					}
					// }
				}

				// ***START*** C. CREDIT TRANSFER TRANSACTION INFORMATION
				// SECTION

				var cdtTrfTxInf = addNodeFromParentNode(xmlDoc, pmtInf, 'CdtTrfTxInf');
				var pmtIdCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtTrfTxInf, 'PmtId');

				addTextNodeFromParentNode(xmlDoc, pmtIdCdtTrfTxInf, 'EndToEndId', arrBillPaymentMap[payeeId]);

				var amtCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtTrfTxInf, 'Amt');
				var amtCdtTrfTxInfInstdAmt = addTextNodeFromParentNode(xmlDoc, amtCdtTrfTxInf, 'InstdAmt', instdAmt.toFixed(2));
				setAttributeValue(amtCdtTrfTxInfInstdAmt, 'Ccy', ccy);

				var cdtrAgtCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtTrfTxInf, 'CdtrAgt');
				var finInstnIdCdtrAgtCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtrAgtCdtTrfTxInf, 'FinInstnId');
				var clrSysmmbIdFinInstnIdCdtrAgtCdtTrfTxInf = addNodeFromParentNode(xmlDoc, finInstnIdCdtrAgtCdtTrfTxInf, 'ClrSysMmbId');

				if (!isEmpty(objVendor.recbankprimid)) addTextNodeFromParentNode(xmlDoc, clrSysmmbIdFinInstnIdCdtrAgtCdtTrfTxInf, 'MmbId', objVendor.recbankprimid);

				var pstlAdrFinInstnIdCdtrAgtCdtTrfTxInf = addNodeFromParentNode(xmlDoc, finInstnIdCdtrAgtCdtTrfTxInf, 'PstlAdr');

				if (!isEmpty(objVendor.vendorcountrycode)) addTextNodeFromParentNode(xmlDoc, pstlAdrFinInstnIdCdtrAgtCdtTrfTxInf, 'Ctry', countryCodeMapping[objVendor.vendorcountrycode]);

				var cdtrCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtTrfTxInf, 'Cdtr');

				if (!isEmpty(objVendor.vendorname)) addTextNodeFromParentNode(xmlDoc, cdtrCdtTrfTxInf, 'Nm', objVendor.vendorname);

				var pstlAdrCdtrCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtrCdtTrfTxInf, 'PstlAdr');

				if (!isEmpty(objVendor.vendorpostal)) addTextNodeFromParentNode(xmlDoc, pstlAdrCdtrCdtTrfTxInf, 'PstCd', objVendor.vendorpostal);
				if (!isEmpty(objVendor.vendorcity)) addTextNodeFromParentNode(xmlDoc, pstlAdrCdtrCdtTrfTxInf, 'TwnNm', objVendor.vendorcity);
				if (!isEmpty(objVendor.vendorstateprovince)) addTextNodeFromParentNode(xmlDoc, pstlAdrCdtrCdtTrfTxInf, 'CtrySubDvsn', objVendor.vendorstateprovince);
				if (!isEmpty(objVendor.vendorcountrycode)) addTextNodeFromParentNode(xmlDoc, pstlAdrCdtrCdtTrfTxInf, 'Ctry', countryCodeMapping[objVendor.vendorcountrycode]);
				if (!isEmpty(objVendor.vendoraddrs1)) addTextNodeFromParentNode(xmlDoc, pstlAdrCdtrCdtTrfTxInf, 'AdrLine', objVendor.vendoraddrs1);

				var cdtrAcct = addNodeFromParentNode(xmlDoc, cdtTrfTxInf, 'CdtrAcct');

				if (!isEmpty(objVendor.recpartyaccount)) {
					var idCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtrAcct, 'Id');
					var othrIdCdtTrfTxInf = addNodeFromParentNode(xmlDoc, idCdtTrfTxInf, 'Othr');

					addTextNodeFromParentNode(xmlDoc, othrIdCdtTrfTxInf, 'Id', objVendor.recpartyaccount);
				}

				var tpCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtrAcct, 'Tp');
				// addTextNodeFromParentNode(xmlDoc, tpCdtTrfTxInf, 'Cd', 'CASH');
				addTextNodeFromParentNode(xmlDoc, tpCdtTrfTxInf, 'Prtry', 'DDA');

				// //CHUZEFITNESS
				// if (!isEmpty(objVendor.accountType)) {
				//         addTextNodeFromParentNode(xmlDoc, tpCdtTrfTxInf, 'PrTry', objVendor.accountType);
				// }

				// var instrForCdtAgtCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtTrfTxInf, 'InstrForCdtrAgt');
				// addTextNodeFromParentNode(xmlDoc, instrForCdtAgtCdtTrfTxInf, 'InstrInf', 'CORP PMT');

				var rmtInfCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtTrfTxInf, 'RmtInf');

				tmpAmt = 0; // need to initialize back to 0

				for (y in arrBills) {
					var billId = arrBills[y];
					dLog('createJPMXMLDoc', 'billId = ' + billId);

					// if (pmtMethod == 'CHK' || pmtMethod == 'DAC' || pmtMethod
					// ==
					// 'CCR' || pmtMethod == 'IWI' || pmtMethod == 'MTS' ||
					// pmtMethod == 'IAC') {

					var strdRmtInfCdtTrfTxInf = addNodeFromParentNode(xmlDoc, rmtInfCdtTrfTxInf, 'Strd');
					var rfrdDocInfStrdRmtInfCdtTrfTxInf = addNodeFromParentNode(xmlDoc, strdRmtInfCdtTrfTxInf, 'RfrdDocInf');
					var tpRfrdDocInfStrdRmtInfCdtTrfTxInf = addNodeFromParentNode(xmlDoc, rfrdDocInfStrdRmtInfCdtTrfTxInf, 'Tp');
					var cdOrPrtryRpRfrdDocInfStrdRmtInfCdtTrfTxInf = addNodeFromParentNode(xmlDoc, tpRfrdDocInfStrdRmtInfCdtTrfTxInf, 'CdOrPrtry');
					addTextNodeFromParentNode(xmlDoc, cdOrPrtryRpRfrdDocInfStrdRmtInfCdtTrfTxInf, 'Cd', 'CINV');

					var netAmt = 0;
					var origAmt = getFloatVal(arrBillAmtOrig[billId]);
					var amt = getFloatVal(arrBillAmt[billId]);

					dLog('creatXMLDoc-ewb', 'origAmt = ' + origAmt);
					dLog('creatXMLDoc-ewb', 'amt = ' + amt);

					var discAmt = !isEmpty(arrBillDiscAmt[billId]) ? getFloatVal(arrBillDiscAmt[billId]) : 0;

					if (!isEmpty(arrBillCredits[billId])) {
						var arrBC = arrBillCredits[billId];
						for (bc in arrBC) {
							var billCreditAmtP = getFloatVal(arrBC[bc].bcamt);
							var billCreditAmt = billCreditAmtP * -1;

							tmpAmt = tmpAmt - billCreditAmtP;
							netAmt = netAmt - billCreditAmtP;
							// instdAmt -= billCreditAmtP;
						}
					}

					// tmpAmt += amt;
					netAmt = origAmt; //origAmt;
					tmpAmt += netAmt;
					instdAmt += amt;
					if (discAmt > 0) {
						netAmt -= discAmt;
						tmpAmt -= discAmt;
						instdAmt -= discAmt;
					}

					// dLog('creatBOAXMLDoc', 'objBillsData[billId] = ' +
					// JSON.stringify(objBillsData[billId]));
					// dLog('creatBOAXMLDoc', 'Num = ' + objBillsData[billId].num);
					// dLog('creatBOAXMLDoc', 'Trn = ' + objBillsData[billId].trnxnumber);

					dLog('createEWBXMLDoc', JSON.stringify(objBillsData[billId]));

					if (!isEmpty(objBillsData[billId].num)) {
						addTextNodeFromParentNode(xmlDoc, rfrdDocInfStrdRmtInfCdtTrfTxInf, 'Nb', objBillsData[billId].num);
					} else if (!isEmpty(objBillsData[billId].trnxnumber)) {
						addTextNodeFromParentNode(xmlDoc, rfrdDocInfStrdRmtInfCdtTrfTxInf, 'Nb', objBillsData[billId].trnxnumber);
					}

					var invoiceDate = objBillsData[billId].dte;

					addTextNodeFromParentNode(xmlDoc, rfrdDocInfStrdRmtInfCdtTrfTxInf, 'RltdDt', formatDate(nlapiStringToDate(invoiceDate)));

					var rfrdDocAmtStrdRmtInfCdtTrfTxInf = addNodeFromParentNode(xmlDoc, strdRmtInfCdtTrfTxInf, 'RfrdDocAmt');
					var duePyblAmt = addTextNodeFromParentNode(xmlDoc, rfrdDocAmtStrdRmtInfCdtTrfTxInf, 'DuePyblAmt', origAmt.toFixed(2)); //origAmt
					var dscntApldAmt = addTextNodeFromParentNode(xmlDoc, rfrdDocAmtStrdRmtInfCdtTrfTxInf, 'DscntApldAmt', discAmt.toFixed(2));
					var rmtdAmt = addTextNodeFromParentNode(xmlDoc, rfrdDocAmtStrdRmtInfCdtTrfTxInf, 'RmtdAmt', amt.toFixed(2)); //netAmt

					setAttributeValue(duePyblAmt, 'Ccy', ccy);
					setAttributeValue(dscntApldAmt, 'Ccy', ccy);
					setAttributeValue(rmtdAmt, 'Ccy', ccy);

					if (!isEmpty(arrBillCredits[billId])) {
						var arrBC = arrBillCredits[billId];

						for (bc in arrBC) {
							var billCreditAmtP = getFloatVal(arrBC[bc].bcamt);
							var billCreditAmt = billCreditAmtP;

							// pmtTotalAmt = (pmtTotalAmt - billCreditAmtP);
							// pmtRecCurAmt = (pmtRecCurAmt - billCreditAmtP);

							tmpAmt = tmpAmt - billCreditAmtP;
							netAmt = netAmt - billCreditAmtP;
							// instdAmt -= billCreditAmtP;

							var strdRmtInfCdtTrfTxInf = addNodeFromParentNode(xmlDoc, rmtInfCdtTrfTxInf, 'Strd');
							var rfrdDocInfStrdRmtInfCdtTrfTxInf = addNodeFromParentNode(xmlDoc, strdRmtInfCdtTrfTxInf, 'RfrdDocInf');
							var tpRfrdDocInfStrdRmtInfCdtTrfTxInf = addNodeFromParentNode(xmlDoc, rfrdDocInfStrdRmtInfCdtTrfTxInf, 'Tp');
							var cdOrPrtryRpRfrdDocInfStrdRmtInfCdtTrfTxInf = addNodeFromParentNode(xmlDoc, tpRfrdDocInfStrdRmtInfCdtTrfTxInf, 'CdOrPrtry');
							addTextNodeFromParentNode(xmlDoc, cdOrPrtryRpRfrdDocInfStrdRmtInfCdtTrfTxInf, 'Cd', 'CREN');

							var bcNum = arrBC[bc].bcnum;
							dLog('createJPMXMLDoc', 'VC number : ' + bcNum);
							if (!isEmpty(bcNum)) addTextNodeFromParentNode(xmlDoc, rfrdDocInfStrdRmtInfCdtTrfTxInf, 'Nb', bcNum);
							else if (!isEmpty(arrBillCredits[billId].bcmemo)) {
								addTextNodeFromParentNode(xmlDoc, rfrdDocInfStrdRmtInfCdtTrfTxInf, 'Nb', arrBillCredits[billId].bcmemo);
							}

							addTextNodeFromParentNode(xmlDoc, rfrdDocInfStrdRmtInfCdtTrfTxInf, 'RltdDt', formatDate(nlapiStringToDate(arrBC[bc].bcdate)));

							var rfrdDocAmtStrdRmtInfCdtTrfTxInf = addNodeFromParentNode(xmlDoc, strdRmtInfCdtTrfTxInf, 'RfrdDocAmt');
							var duePyblAmtRfrdDocAmtStrdRmtInfCdtTrfTxInf = addTextNodeFromParentNode(xmlDoc, rfrdDocAmtStrdRmtInfCdtTrfTxInf, 'DuePyblAmt', billCreditAmt.toFixed(2));
							var dscntApldAmtRfrdDocAmtStrdRmtInfCdtTrfTxInf = addTextNodeFromParentNode(xmlDoc, rfrdDocAmtStrdRmtInfCdtTrfTxInf, 'DscntApldAmt', discAmt.toFixed(2));
							var rmtdAmtRfrdDocAmtStrdRmtInfCdtTrfTxInf = addTextNodeFromParentNode(xmlDoc, rfrdDocAmtStrdRmtInfCdtTrfTxInf, 'CdtNoteAmt', billCreditAmt.toFixed(2));

							setAttributeValue(duePyblAmtRfrdDocAmtStrdRmtInfCdtTrfTxInf, 'Ccy', ccy);
							setAttributeValue(dscntApldAmtRfrdDocAmtStrdRmtInfCdtTrfTxInf, 'Ccy', ccy);
							setAttributeValue(rmtdAmtRfrdDocAmtStrdRmtInfCdtTrfTxInf, 'Ccy', ccy);
						}
					}

					// }
				}

				// ***END*** C. CREDIT TRANSFER TRANSACTION INFORMATION SECTION

				// END: PmtDetail
				tmpTotalAmt += tmpAmt;
			}
		}

		dLog('createEWBXMLDoc', 'tmpTotalAmt = ' + tmpTotalAmt);
		dLog('createEWBXMLDoc', '>>> END <<<');

		// dLog('creatBOAXMLDoc', 'xmlDoc = ' + nlapiXMLToString(xmlDoc));

		return xmlDoc;
	} catch (e) {
		var stErrMsg = '';
		if (e.getDetails != undefined) {
			stErrMsg = 'Script Error: ' + e.getCode() + '<br>' + e.getDetails() + '<br>' + e.getStackTrace();
		} else {
			stErrMsg = 'Script Error: ' + e.toString();
		}

		dLog('Script Error', stErrMsg);
	}
}

function createSNEFTXMLDoc(objAcctMapping) {
	try {
		dLog('createSNEFTXMLDocs', '>>> START <<<');

		// start create xml line
		var xmlDoc = nlapiStringToXML('<?xml version="1.0" encoding="utf-8"?><Document></Document>');
		var DocumentNode = getNode(xmlDoc, '/Document');
		setAttributeValue(DocumentNode, 'xmlns', 'urn:iso:std:iso:20022:tech:xsd:pain.001.001.03');

		var ns1 = 'urn:iso:std:iso:20022:tech:xsd:pain.001.001.03';
		var xsi = 'http://www.w3.org/2001/XMLSchema-instance';
		DocumentNode.setAttributeNS(xsi, 'xsi:schemaLocation', 'urn:iso:std:iso:20022:tech:xsd:pain.001.001.03 file:///H:/EDI%20SERVICES%20REFERENCE%20DATA/XML/SCHEMAS/pain.001.001.03.xsd');

		var cstmrCdtTrfInitnNode = addNodeFromParentNode(xmlDoc, DocumentNode, 'CstmrCdtTrfInitn');

		var arrTempBillIds = [];
		var arrBillCRIds = [];
		var arrBillAmt = [];
		var arrBillAmtOrig = [];
		var arrBillDiscAmt = [];
		var arrBillPayInfoCtr = [];
		var arrBillPayInfoSum = [];
		var arrGrpHdrNbOfTxs = [];
		var arrPmtInfNbOfTxs = [];
		var arrBillIds = [];
		var grpHdrNbOfTxs = 0;
		var grpHdrCtrlSum = 0;

		for (x in arrBillsProcessed) {
			var billId = arrBillsProcessed[x].id;
			var billPaymentId = arrBillsProcessed[x].payment;

			dLog('createSNEFTXMLDoc', 'Bill info = ' + JSON.stringify(arrBillsProcessed[x]));

			// check if payment id exist, only generate xml bills with payment
			// id, skip processed bill credit
			if (!isEmpty(billPaymentId) && billPaymentId != 'XXXNONEXXX' && billPaymentId != 'CREDIT') {
				if (billPaymentId != 'CREDIT') arrTempBillIds.push(billId);

				var payMethod = arrBillsProcessed[x].paymethod;
				var paymentId = arrBillsProcessed[x].payment;
				var payeeId = arrBillsProcessed[x].payeeid;

				arrBillAmtOrig[billId] = arrBillsProcessed[x].origamt;
				// arrBillAmt[billId] = arrBillsProcessed[x].pay;
				arrBillAmt[billId] = arrBillsProcessed[x].payamt;
				arrBillDiscAmt[billId] = arrBillsProcessed[x].discamt;

				var ndx = payMethod + '@@' + paymentId;

				if (arrBillPayInfoCtr[payMethod] == null) arrBillPayInfoCtr[payMethod] = 0;
				if (arrBillPayInfoSum[payMethod] == null) arrBillPayInfoSum[payMethod] = 0;
				if (arrPmtInfNbOfTxs[ndx] == null) arrPmtInfNbOfTxs[ndx] = 0;

				if (paymentId && arrGrpHdrNbOfTxs[paymentId] == null) grpHdrNbOfTxs++;

				arrPmtInfNbOfTxs[ndx]++;
				arrBillPayInfoCtr[payMethod]++;
				arrBillPayInfoSum[payMethod] += getFloatVal(arrBillsProcessed[x].payamt);
				arrGrpHdrNbOfTxs[paymentId] = paymentId;

				grpHdrCtrlSum += getFloatVal(arrBillsProcessed[x].payamt);
			}

			if (billPaymentId == 'CREDIT') arrBillCRIds.push(billId);
		}

		var arrBillIds2 = [];
		var arrBillIds3 = [];
		var arrBillIds4 = [];
		var arrBillIds5 = [];

		for (vx in arrTempBillIds) {
			var isBC = false;

			for (var x in arrBillCRIds) {
				if (arrTempBillIds[vx] == arrBillCRIds[x]) {
					isBC = true;
					break;
				}
			}

			if (!isBC) {
				arrBillIds.push(arrTempBillIds[vx]);
				arrBillIds2.push(arrTempBillIds[vx]);
				arrBillIds3.push(arrTempBillIds[vx]);
				arrBillIds4.push(arrTempBillIds[vx]);
				arrBillIds5.push(arrTempBillIds[vx]);
			}
		}

		dAudit(
			'createSNEFTXMLDoc',
			JSON.stringify({
				'arrBillIds.length': arrBillIds.length,
				'arrBillIds2.length': arrBillIds2.length,
				'arrBillIds3.length': arrBillIds3.length,
				'arrBillIds4.length': arrBillIds4.length,
				'arrBillIds5.length': arrBillIds5.length,
			})
		);

		dLog('createSNEFTXMLDoc', 'arrBillIds = ' + arrBillIds);
		dLog('createSNEFTXMLDoc', 'arrBillIds.length ' + arrBillIds.length);

		if (arrBillIds.length < 1) {
			dLog('createSNEFTXMLDoc', 'No bill id to generate xml. exit xml creation.');
			return null;
		}

		var arrBillCredits = getBillCredit(arrBillIds);
		var objBillsData = getBillData(arrBillIds2);
		var arrBillPO = getPOMap(arrBillIds3);
		var arrVendorBills = getPayeeBillsByPayMethod(arrBillIds4);
		var arrVendorBillsCurr = getPayeeBillsCurrency(arrBillIds5);
		var nsAcctSub = !isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('subsidiary', 'CUSTRECORD_ACCT_MAP_NETSUITE_ACCOUNT')) ? objAcctMapping[0].getValue('subsidiary', 'CUSTRECORD_ACCT_MAP_NETSUITE_ACCOUNT') : '';
		var objVDCRecResults = getVendorDAC_CCRPaymentRec(nsAcctSub);
		var arrCurrMap = getCurrecnyISOCode();
		var currDate = formatDate(new Date());
		var tmpTotalAmt = 0;
		var arrPayeeIds = [];

		dAudit(
			'createSNEFTXMLDoc',
			JSON.stringify({
				'arrBillCredits.length': arrBillCredits.length,
				'objBillsData.length': objBillsData.length,
				'arrBillPO.length': arrBillPO.length,
				'arrVendorBills.length': arrVendorBills.length,
				'objVDCRecResults.length': objVDCRecResults.length,
			})
		);

		// get Total Bill amount
		for (x in arrVendorBills) {
			var arrBillIds = arrVendorBills[x];

			var payeeId = x.split('X@X')[1];
			arrPayeeIds.push(payeeId);

			for (vbill in arrBillIds) {
				// pmtTotalAmt += getFloatVal(arrBillAmt[arrBillIds[vbill]]);
			}
		}

		arrPayeeIds = removeDuplicates(arrPayeeIds);
		var arrVendors = getEntityData(arrPayeeIds);

		var fileCtrlNumber = Date.create().format('{yy}{MM}{dd}{mm}{ss}');

		// ***START*** A. GROUP HEADER
		var grpHdr = addNodeFromParentNode(xmlDoc, cstmrCdtTrfInitnNode, 'GrpHdr');
		addTextNodeFromParentNode(xmlDoc, grpHdr, 'MsgId', 'FILE' + pad(fileCtrlNumber, 4));

		// var currDate = Date.create();
		var currDate = new Date();
		// var mm = ("0" + currDate.getMilliseconds()).slice(-2);
		// var ss = ("0" + currDate.getMilliseconds()).slice(-2);
		// var ms = ("0" + currDate.getMilliseconds()).slice(-2);
		addTextNodeFromParentNode(xmlDoc, grpHdr, 'CreDtTm', currDate.format('{yyyy}-{MM}-{dd}T{hh}:{mm}:{ss}'));
		addTextNodeFromParentNode(xmlDoc, grpHdr, 'NbOfTxs', grpHdrNbOfTxs);
		addTextNodeFromParentNode(xmlDoc, grpHdr, 'CtrlSum', grpHdrCtrlSum.toFixed(2));

		var initgPty = addNodeFromParentNode(xmlDoc, grpHdr, 'InitgPty');
		addTextNodeFromParentNode(xmlDoc, initgPty, 'Nm', objVDCRecResults[0].getValue('custrecord_companyname') || '');

		// ***END*** A. GROUP HEADER

		var ccy = '';
		if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_account_currency'))) ccy = arrCurrMap[objAcctMapping[0].getValue('custrecord_acct_map_account_currency')];

		dAudit('arrBillPayInfoCtr', JSON.stringify(arrBillPayInfoCtr));
		dAudit('arrBillPayInfoCtr.length', JSON.stringify(arrBillPayInfoCtr.length));

		for (x in arrBillPayInfoCtr) {
			// var arrTemp = x.split('@@');
			// var payeeId = arrTemp[1];
			var paymentMethod = x;

			// ***START*** B. PAYMENT INFORMATION SECTION
			var pmtInf = addNodeFromParentNode(xmlDoc, cstmrCdtTrfInitnNode, 'PmtInf');
			// if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_ceocompid'))) 
      //   addTextNodeFromParentNode(xmlDoc, pmtInf, 'PmtInfId', objVDCRecResults[0].getValue('custrecord_ceocompid'));

      addTextNodeFromParentNode(xmlDoc, pmtInf, 'PmtInfId', 'FILE' + pad(fileCtrlNumber, 4));
			addTextNodeFromParentNode(xmlDoc, pmtInf, 'PmtMtd', paymentMethod == 'DAC' ? 'TRF' : 'TRF'); //always TRF
			addTextNodeFromParentNode(xmlDoc, pmtInf, 'BtchBookg', 'false');

			var pmtInfNbOfTxs = 0;
			for (pnb in arrPmtInfNbOfTxs) {
				var tmp = pnb.split('@@');
				var tmpPmethod = tmp[0];
				if (tmpPmethod == paymentMethod) {
					pmtInfNbOfTxs++;
				}
			}
			addTextNodeFromParentNode(xmlDoc, pmtInf, 'NbOfTxs', pmtInfNbOfTxs);

			addTextNodeFromParentNode(xmlDoc, pmtInf, 'CtrlSum', Number(arrBillPayInfoSum[paymentMethod]).toFixed(2));

			var pmtTpInf = addNodeFromParentNode(xmlDoc, pmtInf, 'PmtTpInf');
			var svcLvl = addNodeFromParentNode(xmlDoc, pmtTpInf, 'SvcLvl');
			addTextNodeFromParentNode(xmlDoc, svcLvl, 'Cd', 'NURG');

			var lclInstrm = addNodeFromParentNode(xmlDoc, pmtTpInf, 'LclInstrm');
			addTextNodeFromParentNode(xmlDoc, lclInstrm, 'Prtry', 'CITI540');

			// var ctgyPurp = addNodeFromParentNode(xmlDoc, pmtTpInf, 'ctgyPurp');
			// addTextNodeFromParentNode(xmlDoc, ctgyPurp, 'Cd', 'SUPP');

			var new_date = moment(new Date()).add(1, 'days').format('YYYY-MM-DD');
			addTextNodeFromParentNode(xmlDoc, pmtInf, 'ReqdExctnDt', new_date); //currDate.format("{yyyy}-{MM}-{dd}")

			var dbtr = addNodeFromParentNode(xmlDoc, pmtInf, 'Dbtr');

			if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_companyname'))) addTextNodeFromParentNode(xmlDoc, dbtr, 'Nm', objVDCRecResults[0].getValue('custrecord_companyname'));
			
			var dbtrAcct = addNodeFromParentNode(xmlDoc, pmtInf, 'DbtrAcct');
			var idDbtrAcct = addNodeFromParentNode(xmlDoc, dbtrAcct, 'Id');

			var otherDbtrAcct = addNodeFromParentNode(xmlDoc, idDbtrAcct, 'Othr');

			if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_origin_acc'))) 
        addTextNodeFromParentNode(xmlDoc, otherDbtrAcct, 'Id', objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_origin_acc'));

			
      var dbtrAgt = addNodeFromParentNode(xmlDoc, pmtInf, 'DbtrAgt');
      var finlstnId = addNodeFromParentNode(xmlDoc, dbtrAgt, 'FinInstnId');
      addTextNodeFromParentNode(xmlDoc, finlstnId, 'BIC', objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id') || 'CITIINBXBLR');
      addTextNodeFromParentNode(xmlDoc, pmtInf, 'ChrgBr', 'SLEV');
			

			// ***END*** B. PAYMENT INFORMATION SECTION

			// dLog('creatBOAXMLDoc', 'Bill Payment Method = ' + paymentMethod);

			dAudit('arrVendorBills', arrVendorBills);
			var payformat = '';
			for (v in arrVendorBills) {
				var arrPayeeInfo = v.split('X@X');
				var payeeId = arrPayeeInfo[1];

				dLog('createJPMXMLDoc', 'vb ndex = ' + v);
				       var objVendor = _.find(arrVendors, { internalid: String(payeeId)});
				// var objVendor = _.find(arrVendors, { internalid: String(payeeId), paymentmethod: String(paymentMethod) })[0];
dAudit('objVendor-new', objVendor);
				if (isEmpty(objVendor)) continue;
				if (payformat == '') payformat = objVendor.payformat;

				var pmtMethod = objVendor.paymentmethod;
				if (paymentMethod != pmtMethod) continue;

				dLog('createJPMXMLDoc', 'Vendor Payment Method = ' + pmtMethod);

				var arrBills = arrVendorBills[paymentMethod + 'X@X' + payeeId];
				var tmpAmt = 0;

				var numberOfBills = _.size(arrBills);
				for (by in arrBills) {
					var billId = arrBills[by];

					var netAmt = 0;
					var origAmt = getFloatVal(arrBillAmtOrig[billId]);
					var amt = getFloatVal(arrBillAmt[billId]); //this is the payment amount

					// dLog('creatXMLDoc', 'origAmt = ' + origAmt);
					// dLog('creatXMLDoc', 'amt = ' + amt);

					var discAmt = !isEmpty(arrBillDiscAmt[billId]) ? getFloatVal(arrBillDiscAmt[billId]) : 0;

					// tmpAmt += amt;
					netAmt = amt; //origAmt;
					tmpAmt += netAmt;

					if (discAmt > 0) {
						netAmt -= discAmt;
						tmpAmt -= discAmt;
					}

          
					if (!isEmpty(arrBillCredits[billId])) {
            dLog('arrBillCredits[billId]', JSON.stringify(arrBillCredits[billId]));
						var arrBC = arrBillCredits[billId];

						for (bc in arrBC) {
							var billCreditAmtP = getFloatVal(arrBC[bc].bcamt);
							var billCreditAmt = billCreditAmtP * -1;

							// pmtTotalAmt = (pmtTotalAmt - billCreditAmtP);
							// pmtRecCurAmt = (pmtRecCurAmt - billCreditAmtP);
							// tmpAmt = tmpAmt - billCreditAmtP; commented out 7/21/2022
							netAmt = netAmt - billCreditAmtP;
						}
					}
					// }
				}

				// ***START*** C. CREDIT TRANSFER TRANSACTION INFORMATION
				// SECTION

				var cdtTrfTxInf = addNodeFromParentNode(xmlDoc, pmtInf, 'CdtTrfTxInf');
				var pmtIdCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtTrfTxInf, 'PmtId');

        addTextNodeFromParentNode(xmlDoc, pmtIdCdtTrfTxInf, 'InstrId', objAcctMapping[0].getValue('custrecord_ica_account_number'));
				addTextNodeFromParentNode(xmlDoc, pmtIdCdtTrfTxInf, 'EndToEndId', arrBillPaymentMap[payeeId]);

				var amtCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtTrfTxInf, 'Amt');
				var amtCdtTrfTxInfInstdAmt = addTextNodeFromParentNode(xmlDoc, amtCdtTrfTxInf, 'InstdAmt', tmpAmt.toFixed(2));
				setAttributeValue(amtCdtTrfTxInfInstdAmt, 'Ccy', ccy);

				var cdtrAgtCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtTrfTxInf, 'CdtrAgt');
				var finInstnIdCdtrAgtCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtrAgtCdtTrfTxInf, 'FinInstnId');
				var clrSysmmbIdFinInstnIdCdtrAgtCdtTrfTxInf = addNodeFromParentNode(xmlDoc, finInstnIdCdtrAgtCdtTrfTxInf, 'ClrSysMmbId');

				if (!isEmpty(objVendor.recbankprimid)) addTextNodeFromParentNode(xmlDoc, clrSysmmbIdFinInstnIdCdtrAgtCdtTrfTxInf, 'MmbId', objVendor.recbankprimid);


				var cdtrCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtTrfTxInf, 'Cdtr');

				if (!isEmpty(objVendor.vendorname)) addTextNodeFromParentNode(xmlDoc, cdtrCdtTrfTxInf, 'Nm', objVendor.vendorname);

				var pstlAdrCdtrCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtrCdtTrfTxInf, 'PstlAdr');
				if (!isEmpty(objVendor.vendorcountrycode)) addTextNodeFromParentNode(xmlDoc, pstlAdrCdtrCdtTrfTxInf, 'Ctry', countryCodeMapping[objVendor.vendorcountrycode]);
        if (!isEmpty(objVendor.vendoraddrs1)) addTextNodeFromParentNode(xmlDoc, pstlAdrCdtrCdtTrfTxInf, 'AdrLine', objVendor.vendoraddrs1);
        if (!isEmpty(objVendor.vendoraddrs1)) addTextNodeFromParentNode(xmlDoc, pstlAdrCdtrCdtTrfTxInf, 'AdrLine', objVendor.vendoraddrs2);
				
				var cdtrAcct = addNodeFromParentNode(xmlDoc, cdtTrfTxInf, 'CdtrAcct');

				if (!isEmpty(objVendor.recpartyaccount)) {
					var idCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtrAcct, 'Id');
					var othrIdCdtTrfTxInf = addNodeFromParentNode(xmlDoc, idCdtTrfTxInf, 'Othr');

					addTextNodeFromParentNode(xmlDoc, othrIdCdtTrfTxInf, 'Id', objVendor.recpartyaccount);
				}

				var tpCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtrAcct, 'Tp');
				addTextNodeFromParentNode(xmlDoc, tpCdtTrfTxInf, 'Cd', 'CACC');

        var purpInf = addNodeFromParentNode(xmlDoc, cdtTrfTxInf, 'Purp');
        addTextNodeFromParentNode(xmlDoc, purpInf, 'Cd', 'SUPP');


				var rmtInfCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtTrfTxInf, 'RmtInf');

				tmpAmt = 0; // need to initialize back to 0

				for (y in arrBills) {
					var billId = arrBills[y];
					dLog('createJPMXMLDoc', 'billId = ' + billId);

					// if (pmtMethod == 'CHK' || pmtMethod == 'DAC' || pmtMethod
					// ==
					// 'CCR' || pmtMethod == 'IWI' || pmtMethod == 'MTS' ||
					// pmtMethod == 'IAC') {

					// var strdRmtInfCdtTrfTxInf = addNodeFromParentNode(xmlDoc, rmtInfCdtTrfTxInf, 'Strd');
					// var rfrdDocInfStrdRmtInfCdtTrfTxInf = addNodeFromParentNode(xmlDoc, strdRmtInfCdtTrfTxInf, 'RfrdDocInf');
					// var tpRfrdDocInfStrdRmtInfCdtTrfTxInf = addNodeFromParentNode(xmlDoc, rfrdDocInfStrdRmtInfCdtTrfTxInf, 'Tp');
					// var cdOrPrtryRpRfrdDocInfStrdRmtInfCdtTrfTxInf = addNodeFromParentNode(xmlDoc, tpRfrdDocInfStrdRmtInfCdtTrfTxInf, 'CdOrPrtry');
					// addTextNodeFromParentNode(xmlDoc, cdOrPrtryRpRfrdDocInfStrdRmtInfCdtTrfTxInf, 'Cd', 'CINV');

					var netAmt = 0;
					var origAmt = getFloatVal(arrBillAmtOrig[billId]);
					var amt = getFloatVal(arrBillAmt[billId]);

					// dLog('creatXMLDoc', 'origAmt = ' + origAmt);
					// dLog('creatXMLDoc', 'amt = ' + amt);

					var discAmt = !isEmpty(arrBillDiscAmt[billId]) ? getFloatVal(arrBillDiscAmt[billId]) : 0;

					if (!isEmpty(arrBillCredits[billId])) {
						var arrBC = arrBillCredits[billId];
						for (bc in arrBC) {
							var billCreditAmtP = getFloatVal(arrBC[bc].bcamt);
							var billCreditAmt = billCreditAmtP * -1;

							tmpAmt = tmpAmt - billCreditAmtP;
							netAmt = netAmt - billCreditAmtP;
						}
					}

					// tmpAmt += amt;
					netAmt = amt; //origAmt;
					tmpAmt += netAmt;

					if (discAmt > 0) {
						netAmt -= discAmt;
						tmpAmt -= discAmt;
					}

					// dLog('creatBOAXMLDoc', 'objBillsData[billId] = ' +
					// JSON.stringify(objBillsData[billId]));
					// dLog('creatBOAXMLDoc', 'Num = ' + objBillsData[billId].num);
					// dLog('creatBOAXMLDoc', 'Trn = ' + objBillsData[billId].trnxnumber);

					dLog('createSNEFTXMLDoc', JSON.stringify(objBillsData[billId]));

					// if (!isEmpty(objBillsData[billId].num)) {
					// 	addTextNodeFromParentNode(xmlDoc, rfrdDocInfStrdRmtInfCdtTrfTxInf, 'Nb', objBillsData[billId].num);
					// } else if (!isEmpty(objBillsData[billId].trnxnumber)) {
					// 	addTextNodeFromParentNode(xmlDoc, rfrdDocInfStrdRmtInfCdtTrfTxInf, 'Nb', objBillsData[billId].trnxnumber);
					// }

					// var invoiceDate = objBillsData[billId].dte;

					// addTextNodeFromParentNode(xmlDoc, rfrdDocInfStrdRmtInfCdtTrfTxInf, 'RltdDt', formatDate(nlapiStringToDate(invoiceDate)));

					// var rfrdDocAmtStrdRmtInfCdtTrfTxInf = addNodeFromParentNode(xmlDoc, strdRmtInfCdtTrfTxInf, 'RfrdDocAmt');
					// var duePyblAmt = addTextNodeFromParentNode(xmlDoc, rfrdDocAmtStrdRmtInfCdtTrfTxInf, 'DuePyblAmt', amt.toFixed(2)); //origAmt
					// var dscntApldAmt = addTextNodeFromParentNode(xmlDoc, rfrdDocAmtStrdRmtInfCdtTrfTxInf, 'DscntApldAmt', discAmt.toFixed(2));
					// var rmtdAmt = addTextNodeFromParentNode(xmlDoc, rfrdDocAmtStrdRmtInfCdtTrfTxInf, 'RmtdAmt', amt.toFixed(2)); //netAmt

					// setAttributeValue(duePyblAmt, 'Ccy', ccy);
					// setAttributeValue(dscntApldAmt, 'Ccy', ccy);
					// setAttributeValue(rmtdAmt, 'Ccy', ccy);

					if (!isEmpty(arrBillCredits[billId])) {
						var arrBC = arrBillCredits[billId];

						for (bc in arrBC) {
							var billCreditAmtP = getFloatVal(arrBC[bc].bcamt);
							var billCreditAmt = billCreditAmtP;

							tmpAmt = tmpAmt - billCreditAmtP;
							netAmt = netAmt - billCreditAmtP;

							var bcNum = arrBC[bc].bcnum;
						}
					}

					// }
				}

				// ***END*** C. CREDIT TRANSFER TRANSACTION INFORMATION SECTION

				// END: PmtDetail
				tmpTotalAmt += tmpAmt;

        // var ustrdRmtInfCdtTrfTxInf = addNodeFromParentNode(xmlDoc, rmtInfCdtTrfTxInf, 'Ustrd');
        addTextNodeFromParentNode(xmlDoc, rmtInfCdtTrfTxInf, 'Ustrd', arrBillPaymentMap[payeeId] +',' + tmpTotalAmt);

			}
		}

		dLog('createSNEFTXMLDoc', 'tmpTotalAmt = ' + tmpTotalAmt);
		dLog('createSNEFTXMLDoc', '>>> END <<<');

		// dLog('creatBOAXMLDoc', 'xmlDoc = ' + nlapiXMLToString(xmlDoc));

		return xmlDoc;
	} catch (e) {
		var stErrMsg = '';
		if (e.getDetails != undefined) {
			stErrMsg = 'Script Error: ' + e.getCode() + '<br>' + e.getDetails() + '<br>' + e.getStackTrace();
		} else {
			stErrMsg = 'Script Error: ' + e.toString();
		}

		dLog('createSNEFTXMLDoc Script Error', stErrMsg);
	}
}


function createNEFTXMLDoc(objAcctMapping) {
	try {
		dLog('createNEFTXMLDoc', '>>> START <<<');

		// start create xml line
		var xmlDoc = nlapiStringToXML('<?xml version="1.0" encoding="utf-8"?><Document></Document>');
		var DocumentNode = getNode(xmlDoc, '/Document');
		setAttributeValue(DocumentNode, 'xmlns', 'urn:iso:std:iso:20022:tech:xsd:pain.001.001.03');

		var ns1 = 'urn:iso:std:iso:20022:tech:xsd:pain.001.001.03';
		var xsi = 'http://www.w3.org/2001/XMLSchema-instance';
		DocumentNode.setAttributeNS(xsi, 'xsi:schemaLocation', 'urn:iso:std:iso:20022:tech:xsd:pain.001.001.03 file:///H:/EDI%20SERVICES%20REFERENCE%20DATA/XML/SCHEMAS/pain.001.001.03.xsd');

		var cstmrCdtTrfInitnNode = addNodeFromParentNode(xmlDoc, DocumentNode, 'CstmrCdtTrfInitn');

		var arrTempBillIds = [];
		var arrBillCRIds = [];
		var arrBillAmt = [];
		var arrBillAmtOrig = [];
		var arrBillDiscAmt = [];
		var arrBillPayInfoCtr = [];
		var arrBillPayInfoSum = [];
		var arrGrpHdrNbOfTxs = [];
		var arrPmtInfNbOfTxs = [];
		var arrBillIds = [];
		var grpHdrNbOfTxs = 0;
		var grpHdrCtrlSum = 0;

		for (x in arrBillsProcessed) {
			var billId = arrBillsProcessed[x].id;
			var billPaymentId = arrBillsProcessed[x].payment;

			dLog('createNEFTXMLDoc', 'Bill info = ' + JSON.stringify(arrBillsProcessed[x]));

			// check if payment id exist, only generate xml bills with payment
			// id, skip processed bill credit
			if (!isEmpty(billPaymentId) && billPaymentId != 'XXXNONEXXX' && billPaymentId != 'CREDIT') {
				if (billPaymentId != 'CREDIT') arrTempBillIds.push(billId);

				var payMethod = arrBillsProcessed[x].paymethod;
				var paymentId = arrBillsProcessed[x].payment;
				var payeeId = arrBillsProcessed[x].payeeid;

				arrBillAmtOrig[billId] = arrBillsProcessed[x].origamt;
				// arrBillAmt[billId] = arrBillsProcessed[x].pay;
				arrBillAmt[billId] = arrBillsProcessed[x].payamt;
				arrBillDiscAmt[billId] = arrBillsProcessed[x].discamt;

				var ndx = payMethod + '@@' + paymentId;

				if (arrBillPayInfoCtr[payMethod] == null) arrBillPayInfoCtr[payMethod] = 0;
				if (arrBillPayInfoSum[payMethod] == null) arrBillPayInfoSum[payMethod] = 0;
				if (arrPmtInfNbOfTxs[ndx] == null) arrPmtInfNbOfTxs[ndx] = 0;

				if (paymentId && arrGrpHdrNbOfTxs[paymentId] == null) grpHdrNbOfTxs++;

				arrPmtInfNbOfTxs[ndx]++;
				arrBillPayInfoCtr[payMethod]++;
				arrBillPayInfoSum[payMethod] += getFloatVal(arrBillsProcessed[x].payamt);
				arrGrpHdrNbOfTxs[paymentId] = paymentId;

				grpHdrCtrlSum += getFloatVal(arrBillsProcessed[x].payamt);
			}

			if (billPaymentId == 'CREDIT') arrBillCRIds.push(billId);
		}

		var arrBillIds2 = [];
		var arrBillIds3 = [];
		var arrBillIds4 = [];
		var arrBillIds5 = [];

		for (vx in arrTempBillIds) {
			var isBC = false;

			for (var x in arrBillCRIds) {
				if (arrTempBillIds[vx] == arrBillCRIds[x]) {
					isBC = true;
					break;
				}
			}

			if (!isBC) {
				arrBillIds.push(arrTempBillIds[vx]);
				arrBillIds2.push(arrTempBillIds[vx]);
				arrBillIds3.push(arrTempBillIds[vx]);
				arrBillIds4.push(arrTempBillIds[vx]);
				arrBillIds5.push(arrTempBillIds[vx]);
			}
		}

		dAudit(
			'createNEFTXMLDoc',
			JSON.stringify({
				'arrBillIds.length': arrBillIds.length,
				'arrBillIds2.length': arrBillIds2.length,
				'arrBillIds3.length': arrBillIds3.length,
				'arrBillIds4.length': arrBillIds4.length,
				'arrBillIds5.length': arrBillIds5.length,
			})
		);

		dLog('createNEFTXMLDoc', 'arrBillIds = ' + arrBillIds);
		dLog('createNEFTXMLDoc', 'arrBillIds.length ' + arrBillIds.length);

		if (arrBillIds.length < 1) {
			dLog('createNEFTXMLDoc', 'No bill id to generate xml. exit xml creation.');
			return null;
		}

		var arrBillCredits = getBillCredit(arrBillIds);
		var objBillsData = getBillData(arrBillIds2);
		var arrBillPO = getPOMap(arrBillIds3);
		var arrVendorBills = getPayeeBillsByPayMethod(arrBillIds4);
		var arrVendorBillsCurr = getPayeeBillsCurrency(arrBillIds5);
		var nsAcctSub = !isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('subsidiary', 'CUSTRECORD_ACCT_MAP_NETSUITE_ACCOUNT')) ? objAcctMapping[0].getValue('subsidiary', 'CUSTRECORD_ACCT_MAP_NETSUITE_ACCOUNT') : '';
		var objVDCRecResults = getVendorDAC_CCRPaymentRec(nsAcctSub);
		var arrCurrMap = getCurrecnyISOCode();
		var currDate = formatDate(new Date());
		var tmpTotalAmt = 0;
		var arrPayeeIds = [];

		dAudit(
			'createNEFTXMLDoc',
			JSON.stringify({
				'arrBillCredits.length': arrBillCredits.length,
				'objBillsData.length': objBillsData.length,
				'arrBillPO.length': arrBillPO.length,
				'arrVendorBills.length': arrVendorBills.length,
				'objVDCRecResults.length': objVDCRecResults.length,
			})
		);

		// get Total Bill amount
		for (x in arrVendorBills) {
			var arrBillIds = arrVendorBills[x];

			var payeeId = x.split('X@X')[1];
			arrPayeeIds.push(payeeId);

			for (vbill in arrBillIds) {
				// pmtTotalAmt += getFloatVal(arrBillAmt[arrBillIds[vbill]]);
			}
		}

		arrPayeeIds = removeDuplicates(arrPayeeIds);
		var arrVendors = getEntityData(arrPayeeIds);

		var fileCtrlNumber = Date.create().format('{yy}{MM}{dd}{mm}{ss}');

		// ***START*** A. GROUP HEADER
		var grpHdr = addNodeFromParentNode(xmlDoc, cstmrCdtTrfInitnNode, 'GrpHdr');
		addTextNodeFromParentNode(xmlDoc, grpHdr, 'MsgId', 'FILE' + pad(fileCtrlNumber, 4));

		// var currDate = Date.create();
		var currDate = new Date();
		// var mm = ("0" + currDate.getMilliseconds()).slice(-2);
		// var ss = ("0" + currDate.getMilliseconds()).slice(-2);
		// var ms = ("0" + currDate.getMilliseconds()).slice(-2);
		addTextNodeFromParentNode(xmlDoc, grpHdr, 'CreDtTm', currDate.format('{yyyy}-{MM}-{dd}T{hh}:{mm}:{ss}'));
		addTextNodeFromParentNode(xmlDoc, grpHdr, 'NbOfTxs', grpHdrNbOfTxs);
		addTextNodeFromParentNode(xmlDoc, grpHdr, 'CtrlSum', grpHdrCtrlSum.toFixed(2));

		var initgPty = addNodeFromParentNode(xmlDoc, grpHdr, 'InitgPty');
		addTextNodeFromParentNode(xmlDoc, initgPty, 'Nm', objVDCRecResults[0].getValue('custrecord_companyname') || '');

		// ***END*** A. GROUP HEADER

		var ccy = '';
		if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_account_currency'))) ccy = arrCurrMap[objAcctMapping[0].getValue('custrecord_acct_map_account_currency')];

		dAudit('arrBillPayInfoCtr', JSON.stringify(arrBillPayInfoCtr));
		dAudit('arrBillPayInfoCtr.length', JSON.stringify(arrBillPayInfoCtr.length));

		for (x in arrBillPayInfoCtr) {
			// var arrTemp = x.split('@@');
			// var payeeId = arrTemp[1];
			var paymentMethod = x;

			// ***START*** B. PAYMENT INFORMATION SECTION
			var pmtInf = addNodeFromParentNode(xmlDoc, cstmrCdtTrfInitnNode, 'PmtInf');
			if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_ceocompid'))) 
        addTextNodeFromParentNode(xmlDoc, pmtInf, 'PmtInfId', objVDCRecResults[0].getValue('custrecord_ceocompid'));

      addTextNodeFromParentNode(xmlDoc, pmtInf, 'PmtInfId', 'FILE' + pad(fileCtrlNumber, 4));
			addTextNodeFromParentNode(xmlDoc, pmtInf, 'PmtMtd', paymentMethod == 'DAC' ? 'TRF' : 'TRF'); //always TRF
			addTextNodeFromParentNode(xmlDoc, pmtInf, 'BtchBookg', 'false');

			var pmtInfNbOfTxs = 0;
			for (pnb in arrPmtInfNbOfTxs) {
				var tmp = pnb.split('@@');
				var tmpPmethod = tmp[0];
				if (tmpPmethod == paymentMethod) {
					pmtInfNbOfTxs++;
				}
			}
			addTextNodeFromParentNode(xmlDoc, pmtInf, 'NbOfTxs', pmtInfNbOfTxs);

			addTextNodeFromParentNode(xmlDoc, pmtInf, 'CtrlSum', Number(arrBillPayInfoSum[paymentMethod]).toFixed(2));

			var pmtTpInf = addNodeFromParentNode(xmlDoc, pmtInf, 'PmtTpInf');
			var svcLvl = addNodeFromParentNode(xmlDoc, pmtTpInf, 'SvcLvl');
			addTextNodeFromParentNode(xmlDoc, svcLvl, 'Cd', 'URNS');

			var lclInstrm = addNodeFromParentNode(xmlDoc, pmtTpInf, 'LclInstrm');
			addTextNodeFromParentNode(xmlDoc, lclInstrm, 'Prtry', 'CITI540');

			// var ctgyPurp = addNodeFromParentNode(xmlDoc, pmtTpInf, 'ctgyPurp');
			// addTextNodeFromParentNode(xmlDoc, ctgyPurp, 'Cd', 'SUPP');

			var new_date = moment(new Date()).add(1, 'days').format('YYYY-MM-DD');
			addTextNodeFromParentNode(xmlDoc, pmtInf, 'ReqdExctnDt', new_date); //currDate.format("{yyyy}-{MM}-{dd}")

			var dbtr = addNodeFromParentNode(xmlDoc, pmtInf, 'Dbtr');

			if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_companyname'))) addTextNodeFromParentNode(xmlDoc, dbtr, 'Nm', objVDCRecResults[0].getValue('custrecord_companyname'));
			
			var dbtrAcct = addNodeFromParentNode(xmlDoc, pmtInf, 'DbtrAcct');
			var idDbtrAcct = addNodeFromParentNode(xmlDoc, dbtrAcct, 'Id');

			var otherDbtrAcct = addNodeFromParentNode(xmlDoc, idDbtrAcct, 'Othr');

			if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_origin_acc'))) 
        addTextNodeFromParentNode(xmlDoc, otherDbtrAcct, 'Id', objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_origin_acc'));

			
      var dbtrAgt = addNodeFromParentNode(xmlDoc, pmtInf, 'DbtrAgt');
      var finlstnId = addNodeFromParentNode(xmlDoc, dbtrAgt, 'FinInstnId');
      addTextNodeFromParentNode(xmlDoc, finlstnId, 'BIC', objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id') || 'CITIINBXBLR');
      addTextNodeFromParentNode(xmlDoc, pmtInf, 'ChrgBr', 'SLEV');
			

			// ***END*** B. PAYMENT INFORMATION SECTION

			// dLog('creatBOAXMLDoc', 'Bill Payment Method = ' + paymentMethod);

			dAudit('arrVendorBills', arrVendorBills);
			var payformat = '';
			for (v in arrVendorBills) {
				var arrPayeeInfo = v.split('X@X');
				var payeeId = arrPayeeInfo[1];

				dLog('createJPMXMLDoc', 'vb ndex = ' + v);
				       var objVendor = _.find(arrVendors, { internalid: String(payeeId)});
				// var objVendor = _.find(arrVendors, { internalid: String(payeeId), paymentmethod: String(paymentMethod) })[0];
dAudit('objVendor-new', objVendor);
				if (isEmpty(objVendor)) continue;
				if (payformat == '') payformat = objVendor.payformat;

				var pmtMethod = objVendor.paymentmethod;
				if (paymentMethod != pmtMethod) continue;

				dLog('createJPMXMLDoc', 'Vendor Payment Method = ' + pmtMethod);

				var arrBills = arrVendorBills[paymentMethod + 'X@X' + payeeId];
				var tmpAmt = 0;

				var numberOfBills = _.size(arrBills);
				for (by in arrBills) {
					var billId = arrBills[by];

					var netAmt = 0;
					var origAmt = getFloatVal(arrBillAmtOrig[billId]);
					var amt = getFloatVal(arrBillAmt[billId]); //this is the payment amount

					// dLog('creatXMLDoc', 'origAmt = ' + origAmt);
					// dLog('creatXMLDoc', 'amt = ' + amt);

					var discAmt = !isEmpty(arrBillDiscAmt[billId]) ? getFloatVal(arrBillDiscAmt[billId]) : 0;

					// tmpAmt += amt;
					netAmt = amt; //origAmt;
					tmpAmt += netAmt;

					if (discAmt > 0) {
						netAmt -= discAmt;
						tmpAmt -= discAmt;
					}

          
					if (!isEmpty(arrBillCredits[billId])) {
            dLog('arrBillCredits[billId]', JSON.stringify(arrBillCredits[billId]));
						var arrBC = arrBillCredits[billId];

						for (bc in arrBC) {
							var billCreditAmtP = getFloatVal(arrBC[bc].bcamt);
							var billCreditAmt = billCreditAmtP * -1;

							// pmtTotalAmt = (pmtTotalAmt - billCreditAmtP);
							// pmtRecCurAmt = (pmtRecCurAmt - billCreditAmtP);
							// tmpAmt = tmpAmt - billCreditAmtP; commented out 7/21/2022
							netAmt = netAmt - billCreditAmtP;
						}
					}
					// }
				}

				// ***START*** C. CREDIT TRANSFER TRANSACTION INFORMATION
				// SECTION

				var cdtTrfTxInf = addNodeFromParentNode(xmlDoc, pmtInf, 'CdtTrfTxInf');
				var pmtIdCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtTrfTxInf, 'PmtId');

        addTextNodeFromParentNode(xmlDoc, pmtIdCdtTrfTxInf, 'InstrId', objAcctMapping[0].getValue('custrecord_ica_account_number'));
				addTextNodeFromParentNode(xmlDoc, pmtIdCdtTrfTxInf, 'EndToEndId', arrBillPaymentMap[payeeId]);

				var amtCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtTrfTxInf, 'Amt');
				var amtCdtTrfTxInfInstdAmt = addTextNodeFromParentNode(xmlDoc, amtCdtTrfTxInf, 'InstdAmt', tmpAmt.toFixed(2));
				setAttributeValue(amtCdtTrfTxInfInstdAmt, 'Ccy', ccy);

				var cdtrAgtCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtTrfTxInf, 'CdtrAgt');
				var finInstnIdCdtrAgtCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtrAgtCdtTrfTxInf, 'FinInstnId');
				var clrSysmmbIdFinInstnIdCdtrAgtCdtTrfTxInf = addNodeFromParentNode(xmlDoc, finInstnIdCdtrAgtCdtTrfTxInf, 'ClrSysMmbId');

				if (!isEmpty(objVendor.recbankprimid)) addTextNodeFromParentNode(xmlDoc, clrSysmmbIdFinInstnIdCdtrAgtCdtTrfTxInf, 'MmbId', objVendor.recbankprimid);


				var cdtrCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtTrfTxInf, 'Cdtr');

				if (!isEmpty(objVendor.vendorname)) addTextNodeFromParentNode(xmlDoc, cdtrCdtTrfTxInf, 'Nm', objVendor.vendorname);

				var pstlAdrCdtrCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtrCdtTrfTxInf, 'PstlAdr');
				if (!isEmpty(objVendor.vendorcountrycode)) addTextNodeFromParentNode(xmlDoc, pstlAdrCdtrCdtTrfTxInf, 'Ctry', countryCodeMapping[objVendor.vendorcountrycode]);
        if (!isEmpty(objVendor.vendoraddrs1)) addTextNodeFromParentNode(xmlDoc, pstlAdrCdtrCdtTrfTxInf, 'AdrLine', objVendor.vendoraddrs1);
        if (!isEmpty(objVendor.vendoraddrs1)) addTextNodeFromParentNode(xmlDoc, pstlAdrCdtrCdtTrfTxInf, 'AdrLine', objVendor.vendoraddrs2);
				
				var cdtrAcct = addNodeFromParentNode(xmlDoc, cdtTrfTxInf, 'CdtrAcct');

				if (!isEmpty(objVendor.recpartyaccount)) {
					var idCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtrAcct, 'Id');
					var othrIdCdtTrfTxInf = addNodeFromParentNode(xmlDoc, idCdtTrfTxInf, 'Othr');

					addTextNodeFromParentNode(xmlDoc, othrIdCdtTrfTxInf, 'Id', objVendor.recpartyaccount);
				}

				var tpCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtrAcct, 'Tp');
				addTextNodeFromParentNode(xmlDoc, tpCdtTrfTxInf, 'Cd', 'CACC');

        var purpInf = addNodeFromParentNode(xmlDoc, cdtTrfTxInf, 'Purp');
        addTextNodeFromParentNode(xmlDoc, purpInf, 'Cd', 'SUPP');


				var rmtInfCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtTrfTxInf, 'RmtInf');

				tmpAmt = 0; // need to initialize back to 0

				for (y in arrBills) {
					var billId = arrBills[y];
					dLog('createJPMXMLDoc', 'billId = ' + billId);

					// if (pmtMethod == 'CHK' || pmtMethod == 'DAC' || pmtMethod
					// ==
					// 'CCR' || pmtMethod == 'IWI' || pmtMethod == 'MTS' ||
					// pmtMethod == 'IAC') {

					// var strdRmtInfCdtTrfTxInf = addNodeFromParentNode(xmlDoc, rmtInfCdtTrfTxInf, 'Strd');
					// var rfrdDocInfStrdRmtInfCdtTrfTxInf = addNodeFromParentNode(xmlDoc, strdRmtInfCdtTrfTxInf, 'RfrdDocInf');
					// var tpRfrdDocInfStrdRmtInfCdtTrfTxInf = addNodeFromParentNode(xmlDoc, rfrdDocInfStrdRmtInfCdtTrfTxInf, 'Tp');
					// var cdOrPrtryRpRfrdDocInfStrdRmtInfCdtTrfTxInf = addNodeFromParentNode(xmlDoc, tpRfrdDocInfStrdRmtInfCdtTrfTxInf, 'CdOrPrtry');
					// addTextNodeFromParentNode(xmlDoc, cdOrPrtryRpRfrdDocInfStrdRmtInfCdtTrfTxInf, 'Cd', 'CINV');

					var netAmt = 0;
					var origAmt = getFloatVal(arrBillAmtOrig[billId]);
					var amt = getFloatVal(arrBillAmt[billId]);

					// dLog('creatXMLDoc', 'origAmt = ' + origAmt);
					// dLog('creatXMLDoc', 'amt = ' + amt);

					var discAmt = !isEmpty(arrBillDiscAmt[billId]) ? getFloatVal(arrBillDiscAmt[billId]) : 0;

					if (!isEmpty(arrBillCredits[billId])) {
						var arrBC = arrBillCredits[billId];
						for (bc in arrBC) {
							var billCreditAmtP = getFloatVal(arrBC[bc].bcamt);
							var billCreditAmt = billCreditAmtP * -1;

							tmpAmt = tmpAmt - billCreditAmtP;
							netAmt = netAmt - billCreditAmtP;
						}
					}

					// tmpAmt += amt;
					netAmt = amt; //origAmt;
					tmpAmt += netAmt;

					if (discAmt > 0) {
						netAmt -= discAmt;
						tmpAmt -= discAmt;
					}

					// dLog('creatBOAXMLDoc', 'objBillsData[billId] = ' +
					// JSON.stringify(objBillsData[billId]));
					// dLog('creatBOAXMLDoc', 'Num = ' + objBillsData[billId].num);
					// dLog('creatBOAXMLDoc', 'Trn = ' + objBillsData[billId].trnxnumber);

					dLog('createNEFTXMLDoc', JSON.stringify(objBillsData[billId]));

					// if (!isEmpty(objBillsData[billId].num)) {
					// 	addTextNodeFromParentNode(xmlDoc, rfrdDocInfStrdRmtInfCdtTrfTxInf, 'Nb', objBillsData[billId].num);
					// } else if (!isEmpty(objBillsData[billId].trnxnumber)) {
					// 	addTextNodeFromParentNode(xmlDoc, rfrdDocInfStrdRmtInfCdtTrfTxInf, 'Nb', objBillsData[billId].trnxnumber);
					// }

					// var invoiceDate = objBillsData[billId].dte;

					// addTextNodeFromParentNode(xmlDoc, rfrdDocInfStrdRmtInfCdtTrfTxInf, 'RltdDt', formatDate(nlapiStringToDate(invoiceDate)));

					// var rfrdDocAmtStrdRmtInfCdtTrfTxInf = addNodeFromParentNode(xmlDoc, strdRmtInfCdtTrfTxInf, 'RfrdDocAmt');
					// var duePyblAmt = addTextNodeFromParentNode(xmlDoc, rfrdDocAmtStrdRmtInfCdtTrfTxInf, 'DuePyblAmt', amt.toFixed(2)); //origAmt
					// var dscntApldAmt = addTextNodeFromParentNode(xmlDoc, rfrdDocAmtStrdRmtInfCdtTrfTxInf, 'DscntApldAmt', discAmt.toFixed(2));
					// var rmtdAmt = addTextNodeFromParentNode(xmlDoc, rfrdDocAmtStrdRmtInfCdtTrfTxInf, 'RmtdAmt', amt.toFixed(2)); //netAmt

					// setAttributeValue(duePyblAmt, 'Ccy', ccy);
					// setAttributeValue(dscntApldAmt, 'Ccy', ccy);
					// setAttributeValue(rmtdAmt, 'Ccy', ccy);

					if (!isEmpty(arrBillCredits[billId])) {
						var arrBC = arrBillCredits[billId];

						for (bc in arrBC) {
							var billCreditAmtP = getFloatVal(arrBC[bc].bcamt);
							var billCreditAmt = billCreditAmtP;

							// pmtTotalAmt = (pmtTotalAmt - billCreditAmtP);
							// pmtRecCurAmt = (pmtRecCurAmt - billCreditAmtP);

							tmpAmt = tmpAmt - billCreditAmtP;
							netAmt = netAmt - billCreditAmtP;

							// var strdRmtInfCdtTrfTxInf = addNodeFromParentNode(xmlDoc, rmtInfCdtTrfTxInf, 'Strd');
							// var rfrdDocInfStrdRmtInfCdtTrfTxInf = addNodeFromParentNode(xmlDoc, strdRmtInfCdtTrfTxInf, 'RfrdDocInf');
							// var tpRfrdDocInfStrdRmtInfCdtTrfTxInf = addNodeFromParentNode(xmlDoc, rfrdDocInfStrdRmtInfCdtTrfTxInf, 'Tp');
							// var cdOrPrtryRpRfrdDocInfStrdRmtInfCdtTrfTxInf = addNodeFromParentNode(xmlDoc, tpRfrdDocInfStrdRmtInfCdtTrfTxInf, 'CdOrPrtry');
							// addTextNodeFromParentNode(xmlDoc, cdOrPrtryRpRfrdDocInfStrdRmtInfCdtTrfTxInf, 'Cd', 'CREN');

							var bcNum = arrBC[bc].bcnum;
							// dLog('createNEFTXMLDoc', 'VC number : ' + bcNum);
							// if (!isEmpty(bcNum)) addTextNodeFromParentNode(xmlDoc, rfrdDocInfStrdRmtInfCdtTrfTxInf, 'Nb', bcNum);
							// else if (!isEmpty(arrBillCredits[billId].bcmemo)) {
							// 	addTextNodeFromParentNode(xmlDoc, rfrdDocInfStrdRmtInfCdtTrfTxInf, 'Nb', arrBillCredits[billId].bcmemo);
							// }

							// addTextNodeFromParentNode(xmlDoc, rfrdDocInfStrdRmtInfCdtTrfTxInf, 'RltdDt', formatDate(nlapiStringToDate(arrBC[bc].bcdate)));

							// var rfrdDocAmtStrdRmtInfCdtTrfTxInf = addNodeFromParentNode(xmlDoc, strdRmtInfCdtTrfTxInf, 'RfrdDocAmt');
							// var duePyblAmtRfrdDocAmtStrdRmtInfCdtTrfTxInf = addTextNodeFromParentNode(xmlDoc, rfrdDocAmtStrdRmtInfCdtTrfTxInf, 'DuePyblAmt', billCreditAmt.toFixed(2));
							// var dscntApldAmtRfrdDocAmtStrdRmtInfCdtTrfTxInf = addTextNodeFromParentNode(xmlDoc, rfrdDocAmtStrdRmtInfCdtTrfTxInf, 'DscntApldAmt', discAmt.toFixed(2));
							// var rmtdAmtRfrdDocAmtStrdRmtInfCdtTrfTxInf = addTextNodeFromParentNode(xmlDoc, rfrdDocAmtStrdRmtInfCdtTrfTxInf, 'CdtNoteAmt', billCreditAmt.toFixed(2));

							// setAttributeValue(duePyblAmtRfrdDocAmtStrdRmtInfCdtTrfTxInf, 'Ccy', ccy);
							// setAttributeValue(dscntApldAmtRfrdDocAmtStrdRmtInfCdtTrfTxInf, 'Ccy', ccy);
							// setAttributeValue(rmtdAmtRfrdDocAmtStrdRmtInfCdtTrfTxInf, 'Ccy', ccy);
						}
					}

					// }
				}

				// ***END*** C. CREDIT TRANSFER TRANSACTION INFORMATION SECTION

				// END: PmtDetail
				tmpTotalAmt += tmpAmt;

        // var ustrdRmtInfCdtTrfTxInf = addNodeFromParentNode(xmlDoc, rmtInfCdtTrfTxInf, 'Ustrd');
        addTextNodeFromParentNode(xmlDoc, rmtInfCdtTrfTxInf, 'Ustrd', arrBillPaymentMap[payeeId] +',' + tmpTotalAmt);

			}
		}

		dLog('createNEFTXMLDoc', 'tmpTotalAmt = ' + tmpTotalAmt);
		dLog('createNEFTXMLDoc', '>>> END <<<');

		// dLog('creatBOAXMLDoc', 'xmlDoc = ' + nlapiXMLToString(xmlDoc));

		return xmlDoc;
	} catch (e) {
		var stErrMsg = '';
		if (e.getDetails != undefined) {
			stErrMsg = 'Script Error: ' + e.getCode() + '<br>' + e.getDetails() + '<br>' + e.getStackTrace();
		} else {
			stErrMsg = 'Script Error: ' + e.toString();
		}

		dLog('createNEFTXMLDoc Script Error', stErrMsg);
	}
}

function createHSBCNEFTXMLDoc(objAcctMapping) {
	try {
		dLog('createHSBCNEFTXMLDoc', '>>> START <<<');

		// start create xml line
		var xmlDoc = nlapiStringToXML('<?xml version="1.0" encoding="utf-8"?><Document></Document>');
		var DocumentNode = getNode(xmlDoc, '/Document');
		setAttributeValue(DocumentNode, 'xmlns', 'urn:iso:std:iso:20022:tech:xsd:pain.001.001.03');

		// var ns1 = 'urn:iso:std:iso:20022:tech:xsd:pain.001.001.03';
		// var xsi = 'http://www.w3.org/2001/XMLSchema-instance';
		// DocumentNode.setAttributeNS(xsi, 'xsi:schemaLocation', 'urn:iso:std:iso:20022:tech:xsd:pain.001.001.03 file:///H:/EDI%20SERVICES%20REFERENCE%20DATA/XML/SCHEMAS/pain.001.001.03.xsd');

		var cstmrCdtTrfInitnNode = addNodeFromParentNode(xmlDoc, DocumentNode, 'CstmrCdtTrfInitn');

    var bpmdate = BPM_DATE;
    var d = nlapiStringToDate(bpmdate, 'datetime');
  

		var arrTempBillIds = [];
		var arrBillCRIds = [];
		var arrBillAmt = [];
		var arrBillAmtOrig = [];
		var arrBillDiscAmt = [];
		var arrBillPayInfoCtr = [];
		var arrBillPayInfoSum = [];
		var arrGrpHdrNbOfTxs = [];
		var arrPmtInfNbOfTxs = [];
		var arrBillIds = [];
		var grpHdrNbOfTxs = 0;
		var grpHdrCtrlSum = 0;

		for (x in arrBillsProcessed) {
			var billId = arrBillsProcessed[x].id;
			var billPaymentId = arrBillsProcessed[x].payment;

			dLog('createHSBCNEFTXMLDoc', 'Bill info = ' + JSON.stringify(arrBillsProcessed[x]));

			// check if payment id exist, only generate xml bills with payment
			// id, skip processed bill credit
			if (!isEmpty(billPaymentId) && billPaymentId != 'XXXNONEXXX' && billPaymentId != 'CREDIT') {
				if (billPaymentId != 'CREDIT') arrTempBillIds.push(billId);

				var payMethod = arrBillsProcessed[x].paymethod;
				var paymentId = arrBillsProcessed[x].payment;
				var payeeId = arrBillsProcessed[x].payeeid;

				arrBillAmtOrig[billId] = arrBillsProcessed[x].origamt;
				// arrBillAmt[billId] = arrBillsProcessed[x].pay;
				arrBillAmt[billId] = arrBillsProcessed[x].payamt;
				arrBillDiscAmt[billId] = arrBillsProcessed[x].discamt;

				var ndx = payMethod + '@@' + paymentId;

				if (arrBillPayInfoCtr[payMethod] == null) arrBillPayInfoCtr[payMethod] = 0;
				if (arrBillPayInfoSum[payMethod] == null) arrBillPayInfoSum[payMethod] = 0;
				if (arrPmtInfNbOfTxs[ndx] == null) arrPmtInfNbOfTxs[ndx] = 0;

				if (paymentId && arrGrpHdrNbOfTxs[paymentId] == null) grpHdrNbOfTxs++;

				arrPmtInfNbOfTxs[ndx]++;
				arrBillPayInfoCtr[payMethod]++;
				arrBillPayInfoSum[payMethod] += getFloatVal(arrBillsProcessed[x].payamt);
				arrGrpHdrNbOfTxs[paymentId] = paymentId;

				grpHdrCtrlSum += getFloatVal(arrBillsProcessed[x].payamt);
			}

			if (billPaymentId == 'CREDIT') arrBillCRIds.push(billId);
		}

		var arrBillIds2 = [];
		var arrBillIds3 = [];
		var arrBillIds4 = [];
		var arrBillIds5 = [];
    var arrBillIds6 = [];

		for (vx in arrTempBillIds) {
			var isBC = false;

			for (var x in arrBillCRIds) {
				if (arrTempBillIds[vx] == arrBillCRIds[x]) {
					isBC = true;
					break;
				}
			}

			if (!isBC) {
				arrBillIds.push(arrTempBillIds[vx]);
				arrBillIds2.push(arrTempBillIds[vx]);
				arrBillIds3.push(arrTempBillIds[vx]);
				arrBillIds4.push(arrTempBillIds[vx]);
				arrBillIds5.push(arrTempBillIds[vx]);
        arrBillIds6.push(arrTempBillIds[vx]);
			}
		}

		dAudit(
			'createHSBCNEFTXMLDoc',
			JSON.stringify({
				'arrBillIds.length': arrBillIds.length,
				'arrBillIds2.length': arrBillIds2.length,
				'arrBillIds3.length': arrBillIds3.length,
				'arrBillIds4.length': arrBillIds4.length,
				'arrBillIds5.length': arrBillIds5.length,
        'arrBillIds6.length': arrBillIds6.length,
			})
		);

		dLog('createHSBCNEFTXMLDoc', 'arrBillIds = ' + arrBillIds);
		dLog('createHSBCNEFTXMLDoc', 'arrBillIds.length ' + arrBillIds.length);

		if (arrBillIds.length < 1) {
			dLog('createHSBCNEFTXMLDoc', 'No bill id to generate xml. exit xml creation.');
			return null;
		}

		var arrBillCredits = getBillCredit(arrBillIds);
		var objBillsData = getBillData(arrBillIds2);
		var arrBillPO = getPOMap(arrBillIds3);
		var arrVendorBills = getPayeeBillsByPayMethod(arrBillIds4);
		var arrVendorBillsCurr = getPayeeBillsCurrency(arrBillIds5);
    var arrExpenseReports = getExpenseReports(arrBillIds6);
    dLog('arrExpenseReports', JSON.stringify(arrExpenseReports));

		var nsAcctSub = !isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('subsidiary', 'CUSTRECORD_ACCT_MAP_NETSUITE_ACCOUNT')) ? objAcctMapping[0].getValue('subsidiary', 'CUSTRECORD_ACCT_MAP_NETSUITE_ACCOUNT') : '';
		var objVDCRecResults = getVendorDAC_CCRPaymentRec(nsAcctSub);
		var arrCurrMap = getCurrecnyISOCode();
		var currDate = formatDate(new Date());
		var tmpTotalAmt = 0;
		var arrPayeeIds = [];

		dAudit(
			'createHSBCNEFTXMLDoc',
			JSON.stringify({
				'arrBillCredits.length': arrBillCredits.length,
				'objBillsData.length': objBillsData.length,
				'arrBillPO.length': arrBillPO.length,
				'arrVendorBills.length': arrVendorBills.length,
        'arrExpenseReports.length': arrExpenseReports.length,
				'objVDCRecResults.length': objVDCRecResults.length,
			})
		);

		// get Total Bill amount
		for (x in arrVendorBills) {
			var arrBillIds = arrVendorBills[x];

			var payeeId = x.split('X@X')[1];
			arrPayeeIds.push(payeeId);

			for (vbill in arrBillIds) {
				// pmtTotalAmt += getFloatVal(arrBillAmt[arrBillIds[vbill]]);
			}
		}    
    for (var z=0; z<arrExpenseReports.length; z++) {      
      arrPayeeIds.push(arrExpenseReports[z].emp);
    }
    
		arrPayeeIds = removeDuplicates(arrPayeeIds);
    dLog('arrPayeeIds', JSON.stringify(arrPayeeIds));
		var arrVendors = getEntityData(arrPayeeIds);
    var arrEmployees = getEmployeeData(arrPayeeIds);

		var fileCtrlNumber = Date.create().format('{yy}{MM}{dd}{mm}{ss}');

		// ***START*** A. GROUP HEADER
		var grpHdr = addNodeFromParentNode(xmlDoc, cstmrCdtTrfInitnNode, 'GrpHdr');
		addTextNodeFromParentNode(xmlDoc, grpHdr, 'MsgId', 'FILE' + pad(fileCtrlNumber, 4));

		// var currDate = Date.create();
		var currDate = new Date();
		// var mm = ("0" + currDate.getMilliseconds()).slice(-2);
		// var ss = ("0" + currDate.getMilliseconds()).slice(-2);
		// var ms = ("0" + currDate.getMilliseconds()).slice(-2);
		addTextNodeFromParentNode(xmlDoc, grpHdr, 'CreDtTm', currDate.format('{yyyy}-{MM}-{dd}T{hh}:{mm}:{ss}'));
    var authStn = addNodeFromParentNode(xmlDoc, grpHdr, 'Authstn');
    addTextNodeFromParentNode(xmlDoc, authStn, 'Cd', 'ILEV');

		addTextNodeFromParentNode(xmlDoc, grpHdr, 'NbOfTxs', grpHdrNbOfTxs);
		addTextNodeFromParentNode(xmlDoc, grpHdr, 'CtrlSum', grpHdrCtrlSum.toFixed(2));
    

		var initgPty = addNodeFromParentNode(xmlDoc, grpHdr, 'InitgPty');
		// addTextNodeFromParentNode(xmlDoc, initgPty, 'Nm', objVDCRecResults[0].getValue('custrecord_companyname') || '');
    var initgPtyId = addNodeFromParentNode(xmlDoc, initgPty, 'Id');
    var initgPtyOrgId = addNodeFromParentNode(xmlDoc, initgPtyId, 'OrgId');
    var initgPtyOthr = addNodeFromParentNode(xmlDoc, initgPtyOrgId, 'Othr');
    addTextNodeFromParentNode(xmlDoc, initgPtyOthr, 'Id', objAcctMapping[0].getValue('custrecord_acct_map_ceo_company_id')); //custrecord_acct_map_ceo_company_id //custrecord_ceocompid
    dAudit('company id', objAcctMapping[0].getValue('custrecord_acct_map_ceo_company_id'));
    

		// ***END*** A. GROUP HEADER

		var ccy = '';
		if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_account_currency'))) ccy = arrCurrMap[objAcctMapping[0].getValue('custrecord_acct_map_account_currency')];

		dAudit('arrBillPayInfoCtr', JSON.stringify(arrBillPayInfoCtr));
		dAudit('arrBillPayInfoCtr.length', JSON.stringify(arrBillPayInfoCtr.length));

		for (x in arrBillPayInfoCtr) {
			// var arrTemp = x.split('@@');
			// var payeeId = arrTemp[1];
			var paymentMethod = x;

			// ***START*** B. PAYMENT INFORMATION SECTION
			var pmtInf = addNodeFromParentNode(xmlDoc, cstmrCdtTrfInitnNode, 'PmtInf');
      // if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_ceocompid'))) 
			addTextNodeFromParentNode(xmlDoc, pmtInf, 'PmtInfId', 'FILE' + pad(fileCtrlNumber, 4)); //objVDCRecResults[0].getValue('custrecord_ceocompid'));

			addTextNodeFromParentNode(xmlDoc, pmtInf, 'PmtMtd', paymentMethod == 'DAC' ? 'TRF' : 'TRF'); //always TRF
			// addTextNodeFromParentNode(xmlDoc, pmtInf, 'BtchBookg', 'false');

			var pmtInfNbOfTxs = 0;
			for (pnb in arrPmtInfNbOfTxs) {
				var tmp = pnb.split('@@');
				var tmpPmethod = tmp[0];
				if (tmpPmethod == paymentMethod) {
					pmtInfNbOfTxs++;
				}
			}
			// addTextNodeFromParentNode(xmlDoc, pmtInf, 'NbOfTxs', pmtInfNbOfTxs);

			// addTextNodeFromParentNode(xmlDoc, pmtInf, 'CtrlSum', Number(arrBillPayInfoSum[paymentMethod]).toFixed(2));

			var pmtTpInf = addNodeFromParentNode(xmlDoc, pmtInf, 'PmtTpInf');
			var svcLvl = addNodeFromParentNode(xmlDoc, pmtTpInf, 'SvcLvl');
			addTextNodeFromParentNode(xmlDoc, svcLvl, 'Cd', 'URNS');

			// var lclInstrm = addNodeFromParentNode(xmlDoc, pmtTpInf, 'LclInstrm');
			// addTextNodeFromParentNode(xmlDoc, lclInstrm, 'Prtry', 'CITI540');

			// var ctgyPurp = addNodeFromParentNode(xmlDoc, pmtTpInf, 'ctgyPurp');
			// addTextNodeFromParentNode(xmlDoc, ctgyPurp, 'Cd', 'SUPP');

			var new_date = moment(new Date()).add(1, 'days').format('YYYY-MM-DD');
      // moment(d).format('YYMMDD')
			addTextNodeFromParentNode(xmlDoc, pmtInf, 'ReqdExctnDt', moment(d).format('YYYY-MM-DD')); //new_date); //currDate.format("{yyyy}-{MM}-{dd}")

			var dbtr = addNodeFromParentNode(xmlDoc, pmtInf, 'Dbtr');

			if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_companyname'))) 
        addTextNodeFromParentNode(xmlDoc, dbtr, 'Nm', objVDCRecResults[0].getValue('custrecord_companyname'));
      
      var dbtrPstlAdr = addNodeFromParentNode(xmlDoc, dbtr, 'PstlAdr');
      if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compadd1'))) 
        addTextNodeFromParentNode(xmlDoc, dbtrPstlAdr, 'StrtNm', objVDCRecResults[0].getValue('custrecord_compadd1'));
      if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compadd2'))) 
        addTextNodeFromParentNode(xmlDoc, dbtrPstlAdr, 'BldgNb', objVDCRecResults[0].getValue('custrecord_compadd2'));
      if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_comppostcode'))) 
        addTextNodeFromParentNode(xmlDoc, dbtrPstlAdr, 'PstCd', objVDCRecResults[0].getValue('custrecord_comppostcode'));
      if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compcity'))) 
        addTextNodeFromParentNode(xmlDoc, dbtrPstlAdr, 'TwnNm', objVDCRecResults[0].getValue('custrecord_compcity'));
      if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compstateprov'))) 
        addTextNodeFromParentNode(xmlDoc, dbtrPstlAdr, 'CtrySubDvsn', objVDCRecResults[0].getValue('custrecord_compstateprov'));
      if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compcountrycode'))) 
        addTextNodeFromParentNode(xmlDoc, dbtrPstlAdr, 'Ctry', countryCodeMapping[objVDCRecResults[0].getValue('custrecord_compcountrycode')] || objVDCRecResults[0].getValue('custrecord_compcountrycode'));
    
			
			var dbtrAcct = addNodeFromParentNode(xmlDoc, pmtInf, 'DbtrAcct');
			var idDbtrAcct = addNodeFromParentNode(xmlDoc, dbtrAcct, 'Id');

			var otherDbtrAcct = addNodeFromParentNode(xmlDoc, idDbtrAcct, 'Othr');

			if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_origin_acc'))) 
        addTextNodeFromParentNode(xmlDoc, otherDbtrAcct, 'Id', objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_origin_acc'));

			
      var dbtrAgt = addNodeFromParentNode(xmlDoc, pmtInf, 'DbtrAgt');
      if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id'))) {
        var finlstnId = addNodeFromParentNode(xmlDoc, dbtrAgt, 'FinInstnId');
        addTextNodeFromParentNode(xmlDoc, finlstnId, 'BIC', objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id'));
        addTextNodeFromParentNode(xmlDoc, finlstnId, 'Nm', 'HSBC');

        var dbtrAgtPstlAdr = addNodeFromParentNode(xmlDoc, finlstnId, 'PstlAdr');
        addTextNodeFromParentNode(xmlDoc, dbtrAgtPstlAdr, 'Ctry', 'IN');        
      }

      addTextNodeFromParentNode(xmlDoc, pmtInf, 'ChrgBr', 'DEBT');

      
			

			// ***END*** B. PAYMENT INFORMATION SECTION

			// dLog('creatBOAXMLDoc', 'Bill Payment Method = ' + paymentMethod);

      //Add something here for ExpenseReport

      dAudit('arrExpenseReports',JSON.stringify(arrExpenseReports));
      var expenseReports = _.groupBy(arrExpenseReports, "emp");
			var payformat = '';
      dAudit('expenseReports', JSON.stringify(expenseReports));
      for (er in expenseReports) {
        var payeeId = er;
        dLog('createHSBCNEFTXMLDoc', JSON.stringify(expenseReports[er]));
        dLog('createHSBCNEFTXMLDoc.payeeId', payeeId);
        var objVendor = _.find(arrEmployees, { internalid: String(payeeId) });
        dLog('createHSBCNEFTXMLDoc.objVendor', JSON.stringify(objVendor));
				if (isEmpty(objVendor)) continue;
				if (payformat == '') payformat = objVendor.payformat;

				var pmtMethod = objVendor.paymentmethod;
				if (paymentMethod != pmtMethod) continue;

				dLog('createHSBCNEFTXMLDoc', 'Vendor Payment Method = ' + pmtMethod);

				var arrBills = expenseReports[er];
				var tmpAmt = 0;

        var numberOfBills = _.size(arrBills);
        for (by in arrBills) {
					var billId = arrBills[by].internalid;

					var netAmt = 0;
					var origAmt = getFloatVal(arrBillAmtOrig[billId]);
					var amt = getFloatVal(arrBillAmt[billId]); //this is the payment amount
					var discAmt = !isEmpty(arrBillDiscAmt[billId]) ? getFloatVal(arrBillDiscAmt[billId]) : 0;
					netAmt = amt;
					tmpAmt += netAmt;

					if (discAmt > 0) {
						netAmt -= discAmt;
						tmpAmt -= discAmt;
					}          
				}

        dLog('createHSBCNEFTXMLDoc.expenseReports', 'Adding xml details=' + payeeId);
				// ***START*** C. CREDIT TRANSFER TRANSACTION INFORMATION
				// SECTION

				var cdtTrfTxInf = addNodeFromParentNode(xmlDoc, pmtInf, 'CdtTrfTxInf');
				var pmtIdCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtTrfTxInf, 'PmtId');

        var instrId = String(arrBillPaymentMap[payeeId]);				
        var endToEndId = String(arrBillPaymentMap[payeeId]);				
        instrId = instrId.substring(instrId.length - 16);            
        endToEndId = endToEndId.substring(endToEndId.length - 16);  
        addTextNodeFromParentNode(xmlDoc, pmtIdCdtTrfTxInf, 'InstrId', instrId);
        addTextNodeFromParentNode(xmlDoc, pmtIdCdtTrfTxInf, 'EndToEndId', endToEndId);  

        // addTextNodeFromParentNode(xmlDoc, pmtIdCdtTrfTxInf, 'InstrId', arrBillPaymentMap[payeeId]);
				// addTextNodeFromParentNode(xmlDoc, pmtIdCdtTrfTxInf, 'EndToEndId', arrBillPaymentMap[payeeId]);


				var amtCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtTrfTxInf, 'Amt');
				var amtCdtTrfTxInfInstdAmt = addTextNodeFromParentNode(xmlDoc, amtCdtTrfTxInf, 'InstdAmt', tmpAmt.toFixed(2));
				setAttributeValue(amtCdtTrfTxInfInstdAmt, 'Ccy', ccy);
				var cdtrAgtCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtTrfTxInf, 'CdtrAgt');
        var finInstnIdCdtrAgtCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtrAgtCdtTrfTxInf, 'FinInstnId');			
				var clrSysmmbIdFinInstnIdCdtrAgtCdtTrfTxInf = addNodeFromParentNode(xmlDoc, finInstnIdCdtrAgtCdtTrfTxInf, 'ClrSysMmbId');
				if (!isEmpty(objVendor.recbankprimid)) addTextNodeFromParentNode(xmlDoc, clrSysmmbIdFinInstnIdCdtrAgtCdtTrfTxInf, 'MmbId', objVendor.recbankprimid);
        if (!isEmpty(objVendor.vbankname)) addTextNodeFromParentNode(xmlDoc, finInstnIdCdtrAgtCdtTrfTxInf, 'Nm', objVendor.vbankname);
        var cdtrAgtPstlAdr = addNodeFromParentNode(xmlDoc, finInstnIdCdtrAgtCdtTrfTxInf, 'PstlAdr');
        addTextNodeFromParentNode(xmlDoc, cdtrAgtPstlAdr, 'Ctry', countryCodeMapping[objVendor.vbankcountry] || objVendor.vbankcountry);
        
				var cdtrCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtTrfTxInf, 'Cdtr');

				if (!isEmpty(objVendor.vendorname)) addTextNodeFromParentNode(xmlDoc, cdtrCdtTrfTxInf, 'Nm', objVendor.vendorname);

				var pstlAdrCdtrCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtrCdtTrfTxInf, 'PstlAdr');
				if (!isEmpty(objVendor.vendoraddrs1)) addTextNodeFromParentNode(xmlDoc, pstlAdrCdtrCdtTrfTxInf, 'StrtNm', objVendor.vendoraddrs1);
        if (!isEmpty(objVendor.vendoraddrs2)) addTextNodeFromParentNode(xmlDoc, pstlAdrCdtrCdtTrfTxInf, 'BldgNb', objVendor.vendoraddrs2);
        if (!isEmpty(objVendor.vendorpostal)) addTextNodeFromParentNode(xmlDoc, pstlAdrCdtrCdtTrfTxInf, 'PstCd', objVendor.vendorpostal);
				if (!isEmpty(objVendor.vendorcity)) addTextNodeFromParentNode(xmlDoc, pstlAdrCdtrCdtTrfTxInf, 'TwnNm', objVendor.vendorcity);
        if (!isEmpty(objVendor.vendorstateprovince)) addTextNodeFromParentNode(xmlDoc, pstlAdrCdtrCdtTrfTxInf, 'CtrySubDvsn', objVendor.vendorstateprovince);
        if (!isEmpty(objVendor.vendorcountrycode)) addTextNodeFromParentNode(xmlDoc, pstlAdrCdtrCdtTrfTxInf, 'Ctry', countryCodeMapping[objVendor.vendorcountrycode]);
				
				var cdtrAcct = addNodeFromParentNode(xmlDoc, cdtTrfTxInf, 'CdtrAcct');

				if (!isEmpty(objVendor.recpartyaccount)) {
					var idCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtrAcct, 'Id');
					var othrIdCdtTrfTxInf = addNodeFromParentNode(xmlDoc, idCdtTrfTxInf, 'Othr');
					addTextNodeFromParentNode(xmlDoc, othrIdCdtTrfTxInf, 'Id', objVendor.recpartyaccount);
				}

				var rmtInfCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtTrfTxInf, 'RmtInf');

				tmpAmt = 0; // need to initialize back to 0

				for (y in arrBills) {
					var billId = arrBills[y].internalid;
          dLog('createHSBCNEFTXMLDoc.billId', JSON.stringify(billId));
					dLog('createHSBCNEFTXMLDoc', 'billId = ' + billId);

					var netAmt = 0;
					var origAmt = getFloatVal(arrBillAmtOrig[billId]);
					var amt = getFloatVal(arrBillAmt[billId]);

					var discAmt = !isEmpty(arrBillDiscAmt[billId]) ? getFloatVal(arrBillDiscAmt[billId]) : 0;

					netAmt = amt;
					tmpAmt += netAmt;

					if (discAmt > 0) {
						netAmt -= discAmt;
						tmpAmt -= discAmt;
					}

					dLog('createHSBCNEFTXMLDoc', JSON.stringify(objBillsData[billId]));
				}

				// ***END*** C. CREDIT TRANSFER TRANSACTION INFORMATION SECTION

				// END: PmtDetail
				tmpTotalAmt += tmpAmt;

        // var ustrdRmtInfCdtTrfTxInf = addNodeFromParentNode(xmlDoc, rmtInfCdtTrfTxInf, 'Ustrd');
        addTextNodeFromParentNode(xmlDoc, rmtInfCdtTrfTxInf, 'Ustrd', arrBillPaymentMap[payeeId] +',' + tmpTotalAmt);
			}      

			dAudit('arrVendorBills', arrVendorBills);
			var payformat = '';
			for (v in arrVendorBills) {
				var arrPayeeInfo = v.split('X@X');
				var payeeId = arrPayeeInfo[1];

				dLog('createHSBCNEFTXMLDoc', 'vb ndex = ' + v);
				       var objVendor = _.find(arrVendors, { internalid: String(payeeId)});
				// var objVendor = _.find(arrVendors, { internalid: String(payeeId), paymentmethod: String(paymentMethod) })[0];
dAudit('objVendor-new', objVendor);
				if (isEmpty(objVendor)) continue;
				if (payformat == '') payformat = objVendor.payformat;

				var pmtMethod = objVendor.paymentmethod;
				if (paymentMethod != pmtMethod) continue;

				dLog('createHSBCNEFTXMLDoc', 'Vendor Payment Method = ' + pmtMethod);

				var arrBills = arrVendorBills[paymentMethod + 'X@X' + payeeId];
				var tmpAmt = 0;

				var numberOfBills = _.size(arrBills);
				for (by in arrBills) {
					var billId = arrBills[by];

					var netAmt = 0;
					var origAmt = getFloatVal(arrBillAmtOrig[billId]);
					var amt = getFloatVal(arrBillAmt[billId]); //this is the payment amount

					// dLog('creatXMLDoc', 'origAmt = ' + origAmt);
					// dLog('creatXMLDoc', 'amt = ' + amt);

					var discAmt = !isEmpty(arrBillDiscAmt[billId]) ? getFloatVal(arrBillDiscAmt[billId]) : 0;

					// tmpAmt += amt;
					netAmt = amt; //origAmt;
					tmpAmt += netAmt;

					if (discAmt > 0) {
						netAmt -= discAmt;
						tmpAmt -= discAmt;
					}

          
					if (!isEmpty(arrBillCredits[billId])) {
            dLog('arrBillCredits[billId]', JSON.stringify(arrBillCredits[billId]));
						var arrBC = arrBillCredits[billId];

						for (bc in arrBC) {
							var billCreditAmtP = getFloatVal(arrBC[bc].bcamt);
							var billCreditAmt = billCreditAmtP * -1;

							// pmtTotalAmt = (pmtTotalAmt - billCreditAmtP);
							// pmtRecCurAmt = (pmtRecCurAmt - billCreditAmtP);
							// tmpAmt = tmpAmt - billCreditAmtP; commented out 7/21/2022
							netAmt = netAmt - billCreditAmtP;
						}
					}
					// }
				}

				// ***START*** C. CREDIT TRANSFER TRANSACTION INFORMATION
				// SECTION

				var cdtTrfTxInf = addNodeFromParentNode(xmlDoc, pmtInf, 'CdtTrfTxInf');
				var pmtIdCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtTrfTxInf, 'PmtId');

        addTextNodeFromParentNode(xmlDoc, pmtIdCdtTrfTxInf, 'InstrId', arrBillPaymentMap[payeeId]); //objAcctMapping[0].getValue('custrecord_ica_account_number'));
				addTextNodeFromParentNode(xmlDoc, pmtIdCdtTrfTxInf, 'EndToEndId', arrBillPaymentMap[payeeId]);

				var amtCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtTrfTxInf, 'Amt');
				var amtCdtTrfTxInfInstdAmt = addTextNodeFromParentNode(xmlDoc, amtCdtTrfTxInf, 'InstdAmt', tmpAmt.toFixed(2));
				setAttributeValue(amtCdtTrfTxInfInstdAmt, 'Ccy', ccy);

				var cdtrAgtCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtTrfTxInf, 'CdtrAgt');

        var finInstnIdCdtrAgtCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtrAgtCdtTrfTxInf, 'FinInstnId');
				
				var clrSysmmbIdFinInstnIdCdtrAgtCdtTrfTxInf = addNodeFromParentNode(xmlDoc, finInstnIdCdtrAgtCdtTrfTxInf, 'ClrSysMmbId'); //finInstnIdCdtrAgtCdtTrfTxInf

				if (!isEmpty(objVendor.recbankprimid)) addTextNodeFromParentNode(xmlDoc, clrSysmmbIdFinInstnIdCdtrAgtCdtTrfTxInf, 'MmbId', objVendor.recbankprimid);
        if (!isEmpty(objVendor.vbankname)) addTextNodeFromParentNode(xmlDoc, finInstnIdCdtrAgtCdtTrfTxInf, 'Nm', objVendor.vbankname); //cdtrAgtCdtTrfTxInf

        var cdtrAgtPstlAdr = addNodeFromParentNode(xmlDoc, finInstnIdCdtrAgtCdtTrfTxInf, 'PstlAdr'); // cdtrAgtCdtTrfTxInf
        addTextNodeFromParentNode(xmlDoc, cdtrAgtPstlAdr, 'Ctry', countryCodeMapping[objVendor.vbankcountry] || objVendor.vbankcountry);
        
        


				var cdtrCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtTrfTxInf, 'Cdtr');

				if (!isEmpty(objVendor.vendorname)) addTextNodeFromParentNode(xmlDoc, cdtrCdtTrfTxInf, 'Nm', objVendor.vendorname);

				var pstlAdrCdtrCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtrCdtTrfTxInf, 'PstlAdr');
				if (!isEmpty(objVendor.vendoraddrs1)) addTextNodeFromParentNode(xmlDoc, pstlAdrCdtrCdtTrfTxInf, 'StrtNm', objVendor.vendoraddrs1);
        if (!isEmpty(objVendor.vendoraddrs2)) addTextNodeFromParentNode(xmlDoc, pstlAdrCdtrCdtTrfTxInf, 'BldgNb', objVendor.vendoraddrs2);
        if (!isEmpty(objVendor.vendorpostal)) addTextNodeFromParentNode(xmlDoc, pstlAdrCdtrCdtTrfTxInf, 'PstCd', objVendor.vendorpostal);
				if (!isEmpty(objVendor.vendorcity)) addTextNodeFromParentNode(xmlDoc, pstlAdrCdtrCdtTrfTxInf, 'TwnNm', objVendor.vendorcity);
        if (!isEmpty(objVendor.vendorstateprovince)) addTextNodeFromParentNode(xmlDoc, pstlAdrCdtrCdtTrfTxInf, 'CtrySubDvsn', objVendor.vendorstateprovince);
        if (!isEmpty(objVendor.vendorcountrycode)) addTextNodeFromParentNode(xmlDoc, pstlAdrCdtrCdtTrfTxInf, 'Ctry', countryCodeMapping[objVendor.vendorcountrycode]);
				
				var cdtrAcct = addNodeFromParentNode(xmlDoc, cdtTrfTxInf, 'CdtrAcct');

				if (!isEmpty(objVendor.recpartyaccount)) {
					var idCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtrAcct, 'Id');
					var othrIdCdtTrfTxInf = addNodeFromParentNode(xmlDoc, idCdtTrfTxInf, 'Othr');

					addTextNodeFromParentNode(xmlDoc, othrIdCdtTrfTxInf, 'Id', objVendor.recpartyaccount);
				}

				// var tpCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtrAcct, 'Tp');
				// addTextNodeFromParentNode(xmlDoc, tpCdtTrfTxInf, 'Cd', 'CACC');

        // var purpInf = addNodeFromParentNode(xmlDoc, cdtTrfTxInf, 'Purp');
        // addTextNodeFromParentNode(xmlDoc, purpInf, 'Cd', 'SUPP');


				var rmtInfCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtTrfTxInf, 'RmtInf');

				tmpAmt = 0; // need to initialize back to 0

				for (y in arrBills) {
					var billId = arrBills[y];
					dLog('createHSBCNEFTXMLDoc', 'billId = ' + billId);

					// if (pmtMethod == 'CHK' || pmtMethod == 'DAC' || pmtMethod
					// ==
					// 'CCR' || pmtMethod == 'IWI' || pmtMethod == 'MTS' ||
					// pmtMethod == 'IAC') {

					// var strdRmtInfCdtTrfTxInf = addNodeFromParentNode(xmlDoc, rmtInfCdtTrfTxInf, 'Strd');
					// var rfrdDocInfStrdRmtInfCdtTrfTxInf = addNodeFromParentNode(xmlDoc, strdRmtInfCdtTrfTxInf, 'RfrdDocInf');
					// var tpRfrdDocInfStrdRmtInfCdtTrfTxInf = addNodeFromParentNode(xmlDoc, rfrdDocInfStrdRmtInfCdtTrfTxInf, 'Tp');
					// var cdOrPrtryRpRfrdDocInfStrdRmtInfCdtTrfTxInf = addNodeFromParentNode(xmlDoc, tpRfrdDocInfStrdRmtInfCdtTrfTxInf, 'CdOrPrtry');
					// addTextNodeFromParentNode(xmlDoc, cdOrPrtryRpRfrdDocInfStrdRmtInfCdtTrfTxInf, 'Cd', 'CINV');

					var netAmt = 0;
					var origAmt = getFloatVal(arrBillAmtOrig[billId]);
					var amt = getFloatVal(arrBillAmt[billId]);

					// dLog('creatXMLDoc', 'origAmt = ' + origAmt);
					// dLog('creatXMLDoc', 'amt = ' + amt);

					var discAmt = !isEmpty(arrBillDiscAmt[billId]) ? getFloatVal(arrBillDiscAmt[billId]) : 0;

					if (!isEmpty(arrBillCredits[billId])) {
						var arrBC = arrBillCredits[billId];
						for (bc in arrBC) {
							var billCreditAmtP = getFloatVal(arrBC[bc].bcamt);
							var billCreditAmt = billCreditAmtP * -1;

							tmpAmt = tmpAmt - billCreditAmtP;
							netAmt = netAmt - billCreditAmtP;
						}
					}

					// tmpAmt += amt;
					netAmt = amt; //origAmt;
					tmpAmt += netAmt;

					if (discAmt > 0) {
						netAmt -= discAmt;
						tmpAmt -= discAmt;
					}

					// dLog('creatBOAXMLDoc', 'objBillsData[billId] = ' +
					// JSON.stringify(objBillsData[billId]));
					// dLog('creatBOAXMLDoc', 'Num = ' + objBillsData[billId].num);
					// dLog('creatBOAXMLDoc', 'Trn = ' + objBillsData[billId].trnxnumber);

					dLog('createHSBCNEFTXMLDoc', JSON.stringify(objBillsData[billId]));

					// if (!isEmpty(objBillsData[billId].num)) {
					// 	addTextNodeFromParentNode(xmlDoc, rfrdDocInfStrdRmtInfCdtTrfTxInf, 'Nb', objBillsData[billId].num);
					// } else if (!isEmpty(objBillsData[billId].trnxnumber)) {
					// 	addTextNodeFromParentNode(xmlDoc, rfrdDocInfStrdRmtInfCdtTrfTxInf, 'Nb', objBillsData[billId].trnxnumber);
					// }

					// var invoiceDate = objBillsData[billId].dte;

					// addTextNodeFromParentNode(xmlDoc, rfrdDocInfStrdRmtInfCdtTrfTxInf, 'RltdDt', formatDate(nlapiStringToDate(invoiceDate)));

					// var rfrdDocAmtStrdRmtInfCdtTrfTxInf = addNodeFromParentNode(xmlDoc, strdRmtInfCdtTrfTxInf, 'RfrdDocAmt');
					// var duePyblAmt = addTextNodeFromParentNode(xmlDoc, rfrdDocAmtStrdRmtInfCdtTrfTxInf, 'DuePyblAmt', amt.toFixed(2)); //origAmt
					// var dscntApldAmt = addTextNodeFromParentNode(xmlDoc, rfrdDocAmtStrdRmtInfCdtTrfTxInf, 'DscntApldAmt', discAmt.toFixed(2));
					// var rmtdAmt = addTextNodeFromParentNode(xmlDoc, rfrdDocAmtStrdRmtInfCdtTrfTxInf, 'RmtdAmt', amt.toFixed(2)); //netAmt

					// setAttributeValue(duePyblAmt, 'Ccy', ccy);
					// setAttributeValue(dscntApldAmt, 'Ccy', ccy);
					// setAttributeValue(rmtdAmt, 'Ccy', ccy);

					if (!isEmpty(arrBillCredits[billId])) {
						var arrBC = arrBillCredits[billId];

						for (bc in arrBC) {
							var billCreditAmtP = getFloatVal(arrBC[bc].bcamt);
							var billCreditAmt = billCreditAmtP;

							// pmtTotalAmt = (pmtTotalAmt - billCreditAmtP);
							// pmtRecCurAmt = (pmtRecCurAmt - billCreditAmtP);

							tmpAmt = tmpAmt - billCreditAmtP;
							netAmt = netAmt - billCreditAmtP;

							// var strdRmtInfCdtTrfTxInf = addNodeFromParentNode(xmlDoc, rmtInfCdtTrfTxInf, 'Strd');
							// var rfrdDocInfStrdRmtInfCdtTrfTxInf = addNodeFromParentNode(xmlDoc, strdRmtInfCdtTrfTxInf, 'RfrdDocInf');
							// var tpRfrdDocInfStrdRmtInfCdtTrfTxInf = addNodeFromParentNode(xmlDoc, rfrdDocInfStrdRmtInfCdtTrfTxInf, 'Tp');
							// var cdOrPrtryRpRfrdDocInfStrdRmtInfCdtTrfTxInf = addNodeFromParentNode(xmlDoc, tpRfrdDocInfStrdRmtInfCdtTrfTxInf, 'CdOrPrtry');
							// addTextNodeFromParentNode(xmlDoc, cdOrPrtryRpRfrdDocInfStrdRmtInfCdtTrfTxInf, 'Cd', 'CREN');

							var bcNum = arrBC[bc].bcnum;
							// dLog('createNEFTXMLDoc', 'VC number : ' + bcNum);
							// if (!isEmpty(bcNum)) addTextNodeFromParentNode(xmlDoc, rfrdDocInfStrdRmtInfCdtTrfTxInf, 'Nb', bcNum);
							// else if (!isEmpty(arrBillCredits[billId].bcmemo)) {
							// 	addTextNodeFromParentNode(xmlDoc, rfrdDocInfStrdRmtInfCdtTrfTxInf, 'Nb', arrBillCredits[billId].bcmemo);
							// }

							// addTextNodeFromParentNode(xmlDoc, rfrdDocInfStrdRmtInfCdtTrfTxInf, 'RltdDt', formatDate(nlapiStringToDate(arrBC[bc].bcdate)));

							// var rfrdDocAmtStrdRmtInfCdtTrfTxInf = addNodeFromParentNode(xmlDoc, strdRmtInfCdtTrfTxInf, 'RfrdDocAmt');
							// var duePyblAmtRfrdDocAmtStrdRmtInfCdtTrfTxInf = addTextNodeFromParentNode(xmlDoc, rfrdDocAmtStrdRmtInfCdtTrfTxInf, 'DuePyblAmt', billCreditAmt.toFixed(2));
							// var dscntApldAmtRfrdDocAmtStrdRmtInfCdtTrfTxInf = addTextNodeFromParentNode(xmlDoc, rfrdDocAmtStrdRmtInfCdtTrfTxInf, 'DscntApldAmt', discAmt.toFixed(2));
							// var rmtdAmtRfrdDocAmtStrdRmtInfCdtTrfTxInf = addTextNodeFromParentNode(xmlDoc, rfrdDocAmtStrdRmtInfCdtTrfTxInf, 'CdtNoteAmt', billCreditAmt.toFixed(2));

							// setAttributeValue(duePyblAmtRfrdDocAmtStrdRmtInfCdtTrfTxInf, 'Ccy', ccy);
							// setAttributeValue(dscntApldAmtRfrdDocAmtStrdRmtInfCdtTrfTxInf, 'Ccy', ccy);
							// setAttributeValue(rmtdAmtRfrdDocAmtStrdRmtInfCdtTrfTxInf, 'Ccy', ccy);
						}
					}

					// }
				}

				// ***END*** C. CREDIT TRANSFER TRANSACTION INFORMATION SECTION

				// END: PmtDetail
				tmpTotalAmt += tmpAmt;

        // var ustrdRmtInfCdtTrfTxInf = addNodeFromParentNode(xmlDoc, rmtInfCdtTrfTxInf, 'Ustrd');
        addTextNodeFromParentNode(xmlDoc, rmtInfCdtTrfTxInf, 'Ustrd', arrBillPaymentMap[payeeId] +',' + tmpTotalAmt);

			}
		}

		dLog('createHSBCNEFTXMLDoc', 'tmpTotalAmt = ' + tmpTotalAmt);
		dLog('createHSBCNEFTXMLDoc', '>>> END <<<');

		// dLog('creatBOAXMLDoc', 'xmlDoc = ' + nlapiXMLToString(xmlDoc));

		return xmlDoc;
	} catch (e) {
		var stErrMsg = '';
		if (e.getDetails != undefined) {
			stErrMsg = 'Script Error: ' + e.getCode() + '<br>' + e.getDetails() + '<br>' + e.getStackTrace();
		} else {
			stErrMsg = 'Script Error: ' + e.toString();
		}

		dLog('createHSBCNEFTXMLDoc Script Error', stErrMsg);
	}
}

function createHSBCSGXMLDoc(objAcctMapping) {
	try {
		dLog('createHSBCSGXMLDoc', '>>> START <<<');

		// start create xml line
		var xmlDoc = nlapiStringToXML('<?xml version="1.0" encoding="utf-8"?><Document></Document>');
		var DocumentNode = getNode(xmlDoc, '/Document');
		setAttributeValue(DocumentNode, 'xmlns', 'urn:iso:std:iso:20022:tech:xsd:pain.001.001.03');

    var cstmrCdtTrfInitnNode = addNodeFromParentNode(xmlDoc, DocumentNode, 'CstmrCdtTrfInitn');

    var bpmdate = BPM_DATE;
    var d = nlapiStringToDate(bpmdate, 'datetime');
  
		var arrTempBillIds = [];
		var arrBillCRIds = [];
		var arrBillAmt = [];
		var arrBillAmtOrig = [];
		var arrBillDiscAmt = [];
		var arrBillPayInfoCtr = [];
		var arrBillPayInfoSum = [];
		var arrGrpHdrNbOfTxs = [];
		var arrPmtInfNbOfTxs = [];
		var arrBillIds = [];
		var grpHdrNbOfTxs = 0;
		var grpHdrCtrlSum = 0;

		for (x in arrBillsProcessed) {
			var billId = arrBillsProcessed[x].id;
			var billPaymentId = arrBillsProcessed[x].payment;

			dLog('createHSBCSGXMLDoc', 'Bill info = ' + JSON.stringify(arrBillsProcessed[x]));

			// check if payment id exist, only generate xml bills with payment
			// id, skip processed bill credit
			if (!isEmpty(billPaymentId) && billPaymentId != 'XXXNONEXXX' && billPaymentId != 'CREDIT') {
				if (billPaymentId != 'CREDIT') arrTempBillIds.push(billId);

				var payMethod = arrBillsProcessed[x].paymethod;
				var paymentId = arrBillsProcessed[x].payment;
				var payeeId = arrBillsProcessed[x].payeeid;

				arrBillAmtOrig[billId] = arrBillsProcessed[x].origamt;
				// arrBillAmt[billId] = arrBillsProcessed[x].pay;
				arrBillAmt[billId] = arrBillsProcessed[x].payamt;
				arrBillDiscAmt[billId] = arrBillsProcessed[x].discamt;

				var ndx = payMethod + '@@' + paymentId;

				if (arrBillPayInfoCtr[payMethod] == null) arrBillPayInfoCtr[payMethod] = 0;
				if (arrBillPayInfoSum[payMethod] == null) arrBillPayInfoSum[payMethod] = 0;
				if (arrPmtInfNbOfTxs[ndx] == null) arrPmtInfNbOfTxs[ndx] = 0;

				if (paymentId && arrGrpHdrNbOfTxs[paymentId] == null) grpHdrNbOfTxs++;

				arrPmtInfNbOfTxs[ndx]++;
				arrBillPayInfoCtr[payMethod]++;
				arrBillPayInfoSum[payMethod] += getFloatVal(arrBillsProcessed[x].payamt);
				arrGrpHdrNbOfTxs[paymentId] = paymentId;

				grpHdrCtrlSum += getFloatVal(arrBillsProcessed[x].payamt);
			}

			if (billPaymentId == 'CREDIT') arrBillCRIds.push(billId);
		}

		var arrBillIds2 = [];
		var arrBillIds3 = [];
		var arrBillIds4 = [];
		var arrBillIds5 = [];
    var arrBillIds6 = [];

		for (vx in arrTempBillIds) {
			var isBC = false;

			for (var x in arrBillCRIds) {
				if (arrTempBillIds[vx] == arrBillCRIds[x]) {
					isBC = true;
					break;
				}
			}

			if (!isBC) {
				arrBillIds.push(arrTempBillIds[vx]);
				arrBillIds2.push(arrTempBillIds[vx]);
				arrBillIds3.push(arrTempBillIds[vx]);
				arrBillIds4.push(arrTempBillIds[vx]);
				arrBillIds5.push(arrTempBillIds[vx]);
        arrBillIds6.push(arrTempBillIds[vx]);
			}
		}

		dAudit(
			'createHSBCSGXMLDoc',
			JSON.stringify({
				'arrBillIds.length': arrBillIds.length,
				'arrBillIds2.length': arrBillIds2.length,
				'arrBillIds3.length': arrBillIds3.length,
				'arrBillIds4.length': arrBillIds4.length,
				'arrBillIds5.length': arrBillIds5.length,
        'arrBillIds6.length': arrBillIds6.length,
			})
		);

		dLog('createHSBCSGXMLDoc', 'arrBillIds = ' + arrBillIds);
		dLog('createHSBCSGXMLDoc', 'arrBillIds.length ' + arrBillIds.length);

		if (arrBillIds.length < 1) {
			dLog('createHSBCSGXMLDoc', 'No bill id to generate xml. exit xml creation.');
			return null;
		}

		var arrBillCredits = getBillCredit(arrBillIds);
		var objBillsData = getBillData(arrBillIds2);
		var arrBillPO = getPOMap(arrBillIds3);
		var arrVendorBills = getPayeeBillsByPayMethod(arrBillIds4);
		var arrVendorBillsCurr = getPayeeBillsCurrency(arrBillIds5);
    var arrExpenseReports = getExpenseReports(arrBillIds6);
    dLog('arrExpenseReports', JSON.stringify(arrExpenseReports));

		var nsAcctSub = !isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('subsidiary', 'CUSTRECORD_ACCT_MAP_NETSUITE_ACCOUNT')) ? objAcctMapping[0].getValue('subsidiary', 'CUSTRECORD_ACCT_MAP_NETSUITE_ACCOUNT') : '';
		var objVDCRecResults = getVendorDAC_CCRPaymentRec(nsAcctSub);
		var arrCurrMap = getCurrecnyISOCode();
		var currDate = formatDate(new Date());
		var tmpTotalAmt = 0;
		var arrPayeeIds = [];

		dAudit(
			'createHSBCSGXMLDoc',
			JSON.stringify({
				'arrBillCredits.length': arrBillCredits.length,
				'objBillsData.length': objBillsData.length,
				'arrBillPO.length': arrBillPO.length,
				'arrVendorBills.length': arrVendorBills.length,
        'arrExpenseReports.length': arrExpenseReports.length,
				'objVDCRecResults.length': objVDCRecResults.length,
			})
		);

		// get Total Bill amount
		for (x in arrVendorBills) {
			var arrBillIds = arrVendorBills[x];

			var payeeId = x.split('X@X')[1];
			arrPayeeIds.push(payeeId);

			for (vbill in arrBillIds) {
				// pmtTotalAmt += getFloatVal(arrBillAmt[arrBillIds[vbill]]);
			}
		}    
    for (var z=0; z<arrExpenseReports.length; z++) {      
      arrPayeeIds.push(arrExpenseReports[z].emp);
    }
    
		arrPayeeIds = removeDuplicates(arrPayeeIds);
    dLog('arrPayeeIds', JSON.stringify(arrPayeeIds));
		var arrVendors = getEntityData(arrPayeeIds);
    var arrEmployees = getEmployeeData(arrPayeeIds);

		var fileCtrlNumber = Date.create().format('{yy}{MM}{dd}{mm}{ss}');

		// ***START*** A. GROUP HEADER
		var grpHdr = addNodeFromParentNode(xmlDoc, cstmrCdtTrfInitnNode, 'GrpHdr');
		addTextNodeFromParentNode(xmlDoc, grpHdr, 'MsgId', 'FILE' + pad(fileCtrlNumber, 4));

		// var currDate = Date.create();
		var currDate = new Date();
		addTextNodeFromParentNode(xmlDoc, grpHdr, 'CreDtTm', currDate.format('{yyyy}-{MM}-{dd}T{hh}:{mm}:{ss}'));
    var authStn = addNodeFromParentNode(xmlDoc, grpHdr, 'Authstn');
    addTextNodeFromParentNode(xmlDoc, authStn, 'Cd', 'ILEV'); //

		addTextNodeFromParentNode(xmlDoc, grpHdr, 'NbOfTxs', grpHdrNbOfTxs);
		addTextNodeFromParentNode(xmlDoc, grpHdr, 'CtrlSum', grpHdrCtrlSum.toFixed(2));
    

		var initgPty = addNodeFromParentNode(xmlDoc, grpHdr, 'InitgPty');
		// addTextNodeFromParentNode(xmlDoc, initgPty, 'Nm', objVDCRecResults[0].getValue('custrecord_companyname') || '');
    var initgPtyId = addNodeFromParentNode(xmlDoc, initgPty, 'Id');
    var initgPtyOrgId = addNodeFromParentNode(xmlDoc, initgPtyId, 'OrgId');
    var initgPtyOthr = addNodeFromParentNode(xmlDoc, initgPtyOrgId, 'Othr');
    addTextNodeFromParentNode(xmlDoc, initgPtyOthr, 'Id', objAcctMapping[0].getValue('custrecord_acct_map_ceo_company_id')); //custrecord_acct_map_ceo_company_id //custrecord_ceocompid
    dAudit('company id', objAcctMapping[0].getValue('custrecord_acct_map_ceo_company_id'));
    

		// ***END*** A. GROUP HEADER

		var ccy = '';
		if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_account_currency'))) ccy = arrCurrMap[objAcctMapping[0].getValue('custrecord_acct_map_account_currency')];

		dAudit('arrBillPayInfoCtr', JSON.stringify(arrBillPayInfoCtr));
		dAudit('arrBillPayInfoCtr.length', JSON.stringify(arrBillPayInfoCtr.length));

		for (x in arrBillPayInfoCtr) {
			// var arrTemp = x.split('@@');
			// var payeeId = arrTemp[1];
			var paymentMethod = x;

			// ***START*** B. PAYMENT INFORMATION SECTION
			var pmtInf = addNodeFromParentNode(xmlDoc, cstmrCdtTrfInitnNode, 'PmtInf');
      // if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_ceocompid'))) 
			addTextNodeFromParentNode(xmlDoc, pmtInf, 'PmtInfId', 'FILE' + pad(fileCtrlNumber, 4)); //objVDCRecResults[0].getValue('custrecord_ceocompid'));

			addTextNodeFromParentNode(xmlDoc, pmtInf, 'PmtMtd', paymentMethod == 'DAC' ? 'TRF' : 'TRF'); //always TRF
			// addTextNodeFromParentNode(xmlDoc, pmtInf, 'BtchBookg', 'false');

			var pmtInfNbOfTxs = 0;
			for (pnb in arrPmtInfNbOfTxs) {
				var tmp = pnb.split('@@');
				var tmpPmethod = tmp[0];
				if (tmpPmethod == paymentMethod) {
					pmtInfNbOfTxs++;
				}
			}
			// addTextNodeFromParentNode(xmlDoc, pmtInf, 'NbOfTxs', pmtInfNbOfTxs);

			// addTextNodeFromParentNode(xmlDoc, pmtInf, 'CtrlSum', Number(arrBillPayInfoSum[paymentMethod]).toFixed(2));

			var pmtTpInf = addNodeFromParentNode(xmlDoc, pmtInf, 'PmtTpInf');
			var svcLvl = addNodeFromParentNode(xmlDoc, pmtTpInf, 'SvcLvl');
      if (paymentMethod=='DAC') {
        addTextNodeFromParentNode(xmlDoc, svcLvl, 'Cd', 'NURG');
      } else if (paymentMethod=='MTS') {
        addTextNodeFromParentNode(xmlDoc, svcLvl, 'Cd', 'URGP');
      }
			

			// var lclInstrm = addNodeFromParentNode(xmlDoc, pmtTpInf, 'LclInstrm');
			// addTextNodeFromParentNode(xmlDoc, lclInstrm, 'Prtry', 'CITI540');

			// var ctgyPurp = addNodeFromParentNode(xmlDoc, pmtTpInf, 'ctgyPurp');
			// addTextNodeFromParentNode(xmlDoc, ctgyPurp, 'Cd', 'SUPP');

			var new_date = moment(new Date()).add(1, 'days').format('YYYY-MM-DD');
      // moment(d).format('YYMMDD')
			addTextNodeFromParentNode(xmlDoc, pmtInf, 'ReqdExctnDt', moment(d).format('YYYY-MM-DD')); //new_date); //currDate.format("{yyyy}-{MM}-{dd}")

			var dbtr = addNodeFromParentNode(xmlDoc, pmtInf, 'Dbtr');

			if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_companyname'))) 
        addTextNodeFromParentNode(xmlDoc, dbtr, 'Nm', objVDCRecResults[0].getValue('custrecord_companyname'));
      
      var dbtrPstlAdr = addNodeFromParentNode(xmlDoc, dbtr, 'PstlAdr');
      if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compadd1'))) 
        addTextNodeFromParentNode(xmlDoc, dbtrPstlAdr, 'StrtNm', objVDCRecResults[0].getValue('custrecord_compadd1'));
      // if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compadd2'))) 
      //   addTextNodeFromParentNode(xmlDoc, dbtrPstlAdr, 'BldgNb', objVDCRecResults[0].getValue('custrecord_compadd2'));
      if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_comppostcode'))) 
        addTextNodeFromParentNode(xmlDoc, dbtrPstlAdr, 'PstCd', objVDCRecResults[0].getValue('custrecord_comppostcode'));
      // if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compcity'))) 
      //   addTextNodeFromParentNode(xmlDoc, dbtrPstlAdr, 'TwnNm', objVDCRecResults[0].getValue('custrecord_compcity'));
      // if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compstateprov'))) 
      //   addTextNodeFromParentNode(xmlDoc, dbtrPstlAdr, 'CtrySubDvsn', objVDCRecResults[0].getValue('custrecord_compstateprov'));
      if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compcountrycode'))) 
        addTextNodeFromParentNode(xmlDoc, dbtrPstlAdr, 'Ctry', countryCodeMapping[objVDCRecResults[0].getValue('custrecord_compcountrycode')] || objVDCRecResults[0].getValue('custrecord_compcountrycode'));
    
      var dbtrId = addNodeFromParentNode(xmlDoc, dbtr, 'Id');
      var dbtrIdOrgId = addNodeFromParentNode(xmlDoc, dbtrId, 'OrgId');
      var dbtrIdOrgIdOthr = addNodeFromParentNode(xmlDoc, dbtrIdOrgId, 'Othr');
      addTextNodeFromParentNode(xmlDoc, dbtrIdOrgIdOthr, 'Id', 'E04');      
      var dbtrIdOrgIdOthrSchmeNm = addNodeFromParentNode(xmlDoc, dbtrIdOrgIdOthr, 'SchmeNm');
      addTextNodeFromParentNode(xmlDoc, dbtrIdOrgIdOthrSchmeNm, 'Prtry', 'PSET');      
			
			var dbtrAcct = addNodeFromParentNode(xmlDoc, pmtInf, 'DbtrAcct');
			var idDbtrAcct = addNodeFromParentNode(xmlDoc, dbtrAcct, 'Id');

			var otherDbtrAcct = addNodeFromParentNode(xmlDoc, idDbtrAcct, 'Othr');

			if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_origin_acc'))) 
        addTextNodeFromParentNode(xmlDoc, otherDbtrAcct, 'Id', objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_origin_acc'));

      if (paymentMethod=='MTS') {
        addTextNodeFromParentNode(xmlDoc, dbtrAcct, 'Ccy', 'SGD');
      }
			
      var dbtrAgt = addNodeFromParentNode(xmlDoc, pmtInf, 'DbtrAgt');
      if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id'))) {
        var finlstnId = addNodeFromParentNode(xmlDoc, dbtrAgt, 'FinInstnId');
        addTextNodeFromParentNode(xmlDoc, finlstnId, 'BIC', objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id'));
        addTextNodeFromParentNode(xmlDoc, finlstnId, 'Nm', 'HSBC');

        var dbtrAgtPstlAdr = addNodeFromParentNode(xmlDoc, finlstnId, 'PstlAdr');
        addTextNodeFromParentNode(xmlDoc, dbtrAgtPstlAdr, 'Ctry', countryCodeMapping[objVDCRecResults[0].getValue('custrecord_ica_orig_bank_country_code')] || 'SG');  //Change this      
      }

      if (paymentMethod=='DAC') {
        addTextNodeFromParentNode(xmlDoc, pmtInf, 'ChrgBr', 'DEBT');
      }
      

      
			

			// ***END*** B. PAYMENT INFORMATION SECTION

			// dLog('creatBOAXMLDoc', 'Bill Payment Method = ' + paymentMethod);

      //Add something here for ExpenseReport

      dAudit('arrExpenseReports',JSON.stringify(arrExpenseReports));
      var expenseReports = _.groupBy(arrExpenseReports, "emp");
			var payformat = '';
      dAudit('expenseReports', JSON.stringify(expenseReports));
      for (er in expenseReports) {
        var payeeId = er;
        dLog('createHSBCSGXMLDoc', JSON.stringify(expenseReports[er]));
        dLog('createHSBCSGXMLDoc.payeeId', payeeId);
        var objVendor = _.find(arrEmployees, { internalid: String(payeeId) });
        dLog('createHSBCSGXMLDoc.objVendor', JSON.stringify(objVendor));
				if (isEmpty(objVendor)) continue;
				if (payformat == '') payformat = objVendor.payformat;

				var pmtMethod = objVendor.paymentmethod;
				if (paymentMethod != pmtMethod) continue;

				dLog('createHSBCSGXMLDoc', 'Vendor Payment Method = ' + pmtMethod);

				var arrBills = expenseReports[er];
				var tmpAmt = 0;

        var numberOfBills = _.size(arrBills);
        for (by in arrBills) {
					var billId = arrBills[by].internalid;

					var netAmt = 0;
					var origAmt = getFloatVal(arrBillAmtOrig[billId]);
					var amt = getFloatVal(arrBillAmt[billId]); //this is the payment amount
					var discAmt = !isEmpty(arrBillDiscAmt[billId]) ? getFloatVal(arrBillDiscAmt[billId]) : 0;
					netAmt = amt;
					tmpAmt += netAmt;

					if (discAmt > 0) {
						netAmt -= discAmt;
						tmpAmt -= discAmt;
					}          
				}

        dLog('createHSBCSGXMLDoc.expenseReports', 'Adding xml details=' + payeeId);
				// ***START*** C. CREDIT TRANSFER TRANSACTION INFORMATION
				// SECTION

				var cdtTrfTxInf = addNodeFromParentNode(xmlDoc, pmtInf, 'CdtTrfTxInf');
				var pmtIdCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtTrfTxInf, 'PmtId');
        
        var instrId = String(arrBillPaymentMap[payeeId]);				
        var endToEndId = String(arrBillPaymentMap[payeeId]);				
        if (paymentMethod=='DAC') {
          instrId = instrId.substring(instrId.length - 12);            
          endToEndId = endToEndId.substring(endToEndId.length - 35);  
        } else if (paymentMethod=='MTS') {
          instrId = instrId.substring(instrId.length - 35);            
          endToEndId = endToEndId.substring(endToEndId.length - 16);  
        }
        addTextNodeFromParentNode(xmlDoc, pmtIdCdtTrfTxInf, 'InstrId', instrId);
				addTextNodeFromParentNode(xmlDoc, pmtIdCdtTrfTxInf, 'EndToEndId', endToEndId);

				var amtCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtTrfTxInf, 'Amt');
				var amtCdtTrfTxInfInstdAmt = addTextNodeFromParentNode(xmlDoc, amtCdtTrfTxInf, 'InstdAmt', tmpAmt.toFixed(2));
        var curr = arrCurrMap[objBillsData[billId].currency] || ccy;
				setAttributeValue(amtCdtTrfTxInfInstdAmt, 'Ccy', curr);


				var cdtrAgtCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtTrfTxInf, 'CdtrAgt');
        var finInstnIdCdtrAgtCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtrAgtCdtTrfTxInf, 'FinInstnId');
        if (paymentMethod=='MTS') {
          addTextNodeFromParentNode(xmlDoc, finInstnIdCdtrAgtCdtTrfTxInf, 'BIC', objVendor.recbankprimid || 'DBSSSGSGXXX');
        }
        
        addTextNodeFromParentNode(xmlDoc, finInstnIdCdtrAgtCdtTrfTxInf, 'Nm', objVendor.vbankname || 'DBS_BANK');
				// var clrSysmmbIdFinInstnIdCdtrAgtCdtTrfTxInf = addNodeFromParentNode(xmlDoc, finInstnIdCdtrAgtCdtTrfTxInf, 'ClrSysMmbId');
				// if (!isEmpty(objVendor.recbankprimid)) addTextNodeFromParentNode(xmlDoc, clrSysmmbIdFinInstnIdCdtrAgtCdtTrfTxInf, 'MmbId', objVendor.recbankprimid);
        // if (!isEmpty(objVendor.vbankname)) addTextNodeFromParentNode(xmlDoc, finInstnIdCdtrAgtCdtTrfTxInf, 'Nm', objVendor.vbankname);
        var cdtrAgtPstlAdr = addNodeFromParentNode(xmlDoc, finInstnIdCdtrAgtCdtTrfTxInf, 'PstlAdr');
        addTextNodeFromParentNode(xmlDoc, cdtrAgtPstlAdr, 'Ctry', countryCodeMapping[objVendor.vbankcountry] || objVendor.vbankcountry || 'SG');
        // addTextNodeFromParentNode(xmlDoc, cdtrAgtPstlAdr, 'Ctry', countryCodeMapping[objVendor.vbankcountry] || objVendor.vbankcountry);
        
				var cdtrCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtTrfTxInf, 'Cdtr');

				if (!isEmpty(objVendor.vendorname)) addTextNodeFromParentNode(xmlDoc, cdtrCdtTrfTxInf, 'Nm', objVendor.vendorname);

				var pstlAdrCdtrCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtrCdtTrfTxInf, 'PstlAdr');
				if (!isEmpty(objVendor.vendoraddrs1)) addTextNodeFromParentNode(xmlDoc, pstlAdrCdtrCdtTrfTxInf, 'StrtNm', objVendor.vendoraddrs1);
        if (!isEmpty(objVendor.vendoraddrs2)) addTextNodeFromParentNode(xmlDoc, pstlAdrCdtrCdtTrfTxInf, 'BldgNb', objVendor.vendoraddrs2);
        if (!isEmpty(objVendor.vendorpostal)) addTextNodeFromParentNode(xmlDoc, pstlAdrCdtrCdtTrfTxInf, 'PstCd', objVendor.vendorpostal);
				if (!isEmpty(objVendor.vendorcity)) addTextNodeFromParentNode(xmlDoc, pstlAdrCdtrCdtTrfTxInf, 'TwnNm', objVendor.vendorcity);
        if (!isEmpty(objVendor.vendorstateprovince)) addTextNodeFromParentNode(xmlDoc, pstlAdrCdtrCdtTrfTxInf, 'CtrySubDvsn', objVendor.vendorstateprovince);
        if (!isEmpty(objVendor.vendorcountrycode)) addTextNodeFromParentNode(xmlDoc, pstlAdrCdtrCdtTrfTxInf, 'Ctry', countryCodeMapping[objVendor.vendorcountrycode]);
				
				var cdtrAcct = addNodeFromParentNode(xmlDoc, cdtTrfTxInf, 'CdtrAcct');

				if (!isEmpty(objVendor.recpartyaccount)) {
					var idCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtrAcct, 'Id');
					var othrIdCdtTrfTxInf = addNodeFromParentNode(xmlDoc, idCdtTrfTxInf, 'Othr');
					addTextNodeFromParentNode(xmlDoc, othrIdCdtTrfTxInf, 'Id', objVendor.recpartyaccount);
				}

        // var purp = addNodeFromParentNode(xmlDoc, cdtTrfTxInf, 'Purp');
        // addTextNodeFromParentNode(xmlDoc, purp, 'Cd', 'SUPP');

				var rmtInfCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtTrfTxInf, 'RmtInf');

				tmpAmt = 0; // need to initialize back to 0

				for (y in arrBills) {
					var billId = arrBills[y].internalid;
          dLog('createHSBCSGXMLDoc.billId', JSON.stringify(billId));
					dLog('createHSBCSGXMLDoc', 'billId = ' + billId);

					var netAmt = 0;
					var origAmt = getFloatVal(arrBillAmtOrig[billId]);
					var amt = getFloatVal(arrBillAmt[billId]);

					var discAmt = !isEmpty(arrBillDiscAmt[billId]) ? getFloatVal(arrBillDiscAmt[billId]) : 0;

					netAmt = amt;
					tmpAmt += netAmt;

					if (discAmt > 0) {
						netAmt -= discAmt;
						tmpAmt -= discAmt;
					}

					dLog('createHSBCSGXMLDoc', JSON.stringify(objBillsData[billId]));
				}

				// ***END*** C. CREDIT TRANSFER TRANSACTION INFORMATION SECTION

				// END: PmtDetail
				tmpTotalAmt += tmpAmt;

        // var ustrdRmtInfCdtTrfTxInf = addNodeFromParentNode(xmlDoc, rmtInfCdtTrfTxInf, 'Ustrd');
        addTextNodeFromParentNode(xmlDoc, rmtInfCdtTrfTxInf, 'Ustrd', arrBillPaymentMap[payeeId] +',' + tmpTotalAmt);
			}      

			dAudit('arrVendorBills', arrVendorBills);
			var payformat = '';
			for (v in arrVendorBills) {
				var arrPayeeInfo = v.split('X@X');
				var payeeId = arrPayeeInfo[1];

				dLog('createHSBCSGXMLDoc', 'vb ndex = ' + v);
				       var objVendor = _.find(arrVendors, { internalid: String(payeeId)});
				// var objVendor = _.find(arrVendors, { internalid: String(payeeId), paymentmethod: String(paymentMethod) })[0];
        dAudit('objVendor-new', objVendor);
				if (isEmpty(objVendor)) continue;
				if (payformat == '') payformat = objVendor.payformat;

				var pmtMethod = objVendor.paymentmethod;
				if (paymentMethod != pmtMethod) continue;

				dLog('createHSBCSGXMLDoc', 'Vendor Payment Method = ' + pmtMethod);

				var arrBills = arrVendorBills[paymentMethod + 'X@X' + payeeId];
				var tmpAmt = 0;

				var numberOfBills = _.size(arrBills);
				for (by in arrBills) {
					var billId = arrBills[by];

					var netAmt = 0;
					var origAmt = getFloatVal(arrBillAmtOrig[billId]);
					var amt = getFloatVal(arrBillAmt[billId]); //this is the payment amount

					// dLog('creatXMLDoc', 'origAmt = ' + origAmt);
					// dLog('creatXMLDoc', 'amt = ' + amt);

					var discAmt = !isEmpty(arrBillDiscAmt[billId]) ? getFloatVal(arrBillDiscAmt[billId]) : 0;

					// tmpAmt += amt;
					netAmt = amt; //origAmt;
					tmpAmt += netAmt;

					if (discAmt > 0) {
						netAmt -= discAmt;
						tmpAmt -= discAmt;
					}

          
					if (!isEmpty(arrBillCredits[billId])) {
            dLog('arrBillCredits[billId]', JSON.stringify(arrBillCredits[billId]));
						var arrBC = arrBillCredits[billId];

						for (bc in arrBC) {
							var billCreditAmtP = getFloatVal(arrBC[bc].bcamt);
							var billCreditAmt = billCreditAmtP * -1;

							netAmt = netAmt - billCreditAmtP;
						}
					}
					// }
				}

				// ***START*** C. CREDIT TRANSFER TRANSACTION INFORMATION
				// SECTION

				var cdtTrfTxInf = addNodeFromParentNode(xmlDoc, pmtInf, 'CdtTrfTxInf');
				var pmtIdCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtTrfTxInf, 'PmtId');

        var instrId = String(arrBillPaymentMap[payeeId]);				
        var endToEndId = String(arrBillPaymentMap[payeeId]);				
        if (paymentMethod=='DAC') {
          instrId = instrId.substring(instrId.length - 12);            
          endToEndId = endToEndId.substring(endToEndId.length - 35);  
        } else if (paymentMethod=='MTS') {
          instrId = instrId.substring(instrId.length - 35);            
          endToEndId = endToEndId.substring(endToEndId.length - 16);  
        }
        addTextNodeFromParentNode(xmlDoc, pmtIdCdtTrfTxInf, 'InstrId', instrId);
				addTextNodeFromParentNode(xmlDoc, pmtIdCdtTrfTxInf, 'EndToEndId', endToEndId);        

        // addTextNodeFromParentNode(xmlDoc, pmtIdCdtTrfTxInf, 'InstrId', arrBillPaymentMap[payeeId]); //objAcctMapping[0].getValue('custrecord_ica_account_number'));
				// addTextNodeFromParentNode(xmlDoc, pmtIdCdtTrfTxInf, 'EndToEndId', arrBillPaymentMap[payeeId]);

				var amtCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtTrfTxInf, 'Amt');
				var amtCdtTrfTxInfInstdAmt = addTextNodeFromParentNode(xmlDoc, amtCdtTrfTxInf, 'InstdAmt', tmpAmt.toFixed(2));
        var curr = arrCurrMap[objBillsData[billId].currency] || ccy;
				setAttributeValue(amtCdtTrfTxInfInstdAmt, 'Ccy', curr);

				var cdtrAgtCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtTrfTxInf, 'CdtrAgt');

        var finInstnIdCdtrAgtCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtrAgtCdtTrfTxInf, 'FinInstnId');
        if (paymentMethod=='MTS') {
          addTextNodeFromParentNode(xmlDoc, finInstnIdCdtrAgtCdtTrfTxInf, 'BIC', objVendor.recbankprimid || 'DBSSSGSGXXX');
        } else if (paymentMethod=='DAC') {
          addTextNodeFromParentNode(xmlDoc, finInstnIdCdtrAgtCdtTrfTxInf, 'BIC', objVendor.recbankprimid);
        }
        
        addTextNodeFromParentNode(xmlDoc, finInstnIdCdtrAgtCdtTrfTxInf, 'Nm', objVendor.vbankname || 'DBS_BANK');
				
				// var clrSysmmbIdFinInstnIdCdtrAgtCdtTrfTxInf = addNodeFromParentNode(xmlDoc, finInstnIdCdtrAgtCdtTrfTxInf, 'ClrSysMmbId'); //finInstnIdCdtrAgtCdtTrfTxInf

				// if (!isEmpty(objVendor.recbankprimid)) addTextNodeFromParentNode(xmlDoc, clrSysmmbIdFinInstnIdCdtrAgtCdtTrfTxInf, 'MmbId', objVendor.recbankprimid);
        // if (!isEmpty(objVendor.vbankname)) addTextNodeFromParentNode(xmlDoc, finInstnIdCdtrAgtCdtTrfTxInf, 'Nm', objVendor.vbankname); //cdtrAgtCdtTrfTxInf

        var cdtrAgtPstlAdr = addNodeFromParentNode(xmlDoc, finInstnIdCdtrAgtCdtTrfTxInf, 'PstlAdr'); // cdtrAgtCdtTrfTxInf
        addTextNodeFromParentNode(xmlDoc, cdtrAgtPstlAdr, 'Ctry', countryCodeMapping[objVendor.vbankcountry] || 'SG');
        
        


				var cdtrCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtTrfTxInf, 'Cdtr');

				if (!isEmpty(objVendor.vendorname)) addTextNodeFromParentNode(xmlDoc, cdtrCdtTrfTxInf, 'Nm', objVendor.vendorname);

				var pstlAdrCdtrCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtrCdtTrfTxInf, 'PstlAdr');
				if (!isEmpty(objVendor.vendoraddrs1)) addTextNodeFromParentNode(xmlDoc, pstlAdrCdtrCdtTrfTxInf, 'StrtNm', objVendor.vendoraddrs1);
        if (!isEmpty(objVendor.vendoraddrs2)) addTextNodeFromParentNode(xmlDoc, pstlAdrCdtrCdtTrfTxInf, 'BldgNb', objVendor.vendoraddrs2);
        if (!isEmpty(objVendor.vendorpostal)) addTextNodeFromParentNode(xmlDoc, pstlAdrCdtrCdtTrfTxInf, 'PstCd', objVendor.vendorpostal);
				if (!isEmpty(objVendor.vendorcity)) addTextNodeFromParentNode(xmlDoc, pstlAdrCdtrCdtTrfTxInf, 'TwnNm', objVendor.vendorcity);
        if (!isEmpty(objVendor.vendorstateprovince)) addTextNodeFromParentNode(xmlDoc, pstlAdrCdtrCdtTrfTxInf, 'CtrySubDvsn', objVendor.vendorstateprovince);
        if (!isEmpty(objVendor.vendorcountrycode)) addTextNodeFromParentNode(xmlDoc, pstlAdrCdtrCdtTrfTxInf, 'Ctry', countryCodeMapping[objVendor.vendorcountrycode]);
				
				var cdtrAcct = addNodeFromParentNode(xmlDoc, cdtTrfTxInf, 'CdtrAcct');

				if (!isEmpty(objVendor.recpartyaccount)) {
					var idCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtrAcct, 'Id');
					var othrIdCdtTrfTxInf = addNodeFromParentNode(xmlDoc, idCdtTrfTxInf, 'Othr');

					addTextNodeFromParentNode(xmlDoc, othrIdCdtTrfTxInf, 'Id', objVendor.recpartyaccount);
				}
        var purp = addNodeFromParentNode(xmlDoc, cdtTrfTxInf, 'Purp');
        addTextNodeFromParentNode(xmlDoc, purp, 'Cd', 'SUPP');


				var rmtInfCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtTrfTxInf, 'RmtInf');

				tmpAmt = 0; // need to initialize back to 0

				for (y in arrBills) {
					var billId = arrBills[y];
					dLog('createHSBCSGXMLDoc', 'billId = ' + billId);

					var netAmt = 0;
					var origAmt = getFloatVal(arrBillAmtOrig[billId]);
					var amt = getFloatVal(arrBillAmt[billId]);

					// dLog('creatXMLDoc', 'origAmt = ' + origAmt);
					// dLog('creatXMLDoc', 'amt = ' + amt);

					var discAmt = !isEmpty(arrBillDiscAmt[billId]) ? getFloatVal(arrBillDiscAmt[billId]) : 0;

					if (!isEmpty(arrBillCredits[billId])) {
						var arrBC = arrBillCredits[billId];
						for (bc in arrBC) {
							var billCreditAmtP = getFloatVal(arrBC[bc].bcamt);
							var billCreditAmt = billCreditAmtP * -1;

							tmpAmt = tmpAmt - billCreditAmtP;
							netAmt = netAmt - billCreditAmtP;
						}
					}

					// tmpAmt += amt;
					netAmt = amt; //origAmt;
					tmpAmt += netAmt;

					if (discAmt > 0) {
						netAmt -= discAmt;
						tmpAmt -= discAmt;
					}

					dLog('createHSBCSGXMLDoc', JSON.stringify(objBillsData[billId]));

					if (!isEmpty(arrBillCredits[billId])) {
						var arrBC = arrBillCredits[billId];

						for (bc in arrBC) {
							var billCreditAmtP = getFloatVal(arrBC[bc].bcamt);
							var billCreditAmt = billCreditAmtP;

							tmpAmt = tmpAmt - billCreditAmtP;
							netAmt = netAmt - billCreditAmtP;

							var bcNum = arrBC[bc].bcnum;
						}
					}

				}

				// ***END*** C. CREDIT TRANSFER TRANSACTION INFORMATION SECTION

				// END: PmtDetail
				tmpTotalAmt += tmpAmt;

        addTextNodeFromParentNode(xmlDoc, rmtInfCdtTrfTxInf, 'Ustrd', arrBillPaymentMap[payeeId] +',' + tmpTotalAmt);

			}
		}

		dLog('createHSBCSGXMLDoc', 'tmpTotalAmt = ' + tmpTotalAmt);
		dLog('createHSBCSGXMLDoc', '>>> END <<<');

		return xmlDoc;
	} catch (e) {
		var stErrMsg = '';
		if (e.getDetails != undefined) {
			stErrMsg = 'Script Error: ' + e.getCode() + '<br>' + e.getDetails() + '<br>' + e.getStackTrace();
		} else {
			stErrMsg = 'Script Error: ' + e.toString();
		}

		dLog('createHSBCSGXMLDoc Script Error', stErrMsg);
	}
}

function createHSBC_KOREA_XMLDoc(objAcctMapping) {
	try {
		dLog('createHSBC_KOREA_XMLDoc', '>>> START <<<');

		// start create xml line
		var xmlDoc = nlapiStringToXML('<?xml version="1.0" encoding="utf-8"?><Document></Document>');
		var DocumentNode = getNode(xmlDoc, '/Document');
		setAttributeValue(DocumentNode, 'xmlns', 'urn:iso:std:iso:20022:tech:xsd:pain.001.001.03');

    var cstmrCdtTrfInitnNode = addNodeFromParentNode(xmlDoc, DocumentNode, 'CstmrCdtTrfInitn');

    var bpmdate = BPM_DATE;
    var d = nlapiStringToDate(bpmdate, 'datetime');
  
		var arrTempBillIds = [];
		var arrBillCRIds = [];
		var arrBillAmt = [];
		var arrBillAmtOrig = [];
		var arrBillDiscAmt = [];
		var arrBillPayInfoCtr = [];
		var arrBillPayInfoSum = [];
		var arrGrpHdrNbOfTxs = [];
		var arrPmtInfNbOfTxs = [];
		var arrBillIds = [];
		var grpHdrNbOfTxs = 0;
		var grpHdrCtrlSum = 0;

		for (x in arrBillsProcessed) {
			var billId = arrBillsProcessed[x].id;
			var billPaymentId = arrBillsProcessed[x].payment;

			dLog('createHSBC_KOREA_XMLDoc', 'Bill info = ' + JSON.stringify(arrBillsProcessed[x]));

			// check if payment id exist, only generate xml bills with payment
			// id, skip processed bill credit
			if (!isEmpty(billPaymentId) && billPaymentId != 'XXXNONEXXX' && billPaymentId != 'CREDIT') {
				if (billPaymentId != 'CREDIT') arrTempBillIds.push(billId);

				var payMethod = arrBillsProcessed[x].paymethod;
				var paymentId = arrBillsProcessed[x].payment;
				var payeeId = arrBillsProcessed[x].payeeid;

				arrBillAmtOrig[billId] = arrBillsProcessed[x].origamt;
				// arrBillAmt[billId] = arrBillsProcessed[x].pay;
				arrBillAmt[billId] = arrBillsProcessed[x].payamt;
				arrBillDiscAmt[billId] = arrBillsProcessed[x].discamt;

				var ndx = payMethod + '@@' + paymentId;

				if (arrBillPayInfoCtr[payMethod] == null) arrBillPayInfoCtr[payMethod] = 0;
				if (arrBillPayInfoSum[payMethod] == null) arrBillPayInfoSum[payMethod] = 0;
				if (arrPmtInfNbOfTxs[ndx] == null) arrPmtInfNbOfTxs[ndx] = 0;

				if (paymentId && arrGrpHdrNbOfTxs[paymentId] == null) grpHdrNbOfTxs++;

				arrPmtInfNbOfTxs[ndx]++;
				arrBillPayInfoCtr[payMethod]++;
				arrBillPayInfoSum[payMethod] += getFloatVal(arrBillsProcessed[x].payamt);
				arrGrpHdrNbOfTxs[paymentId] = paymentId;

				grpHdrCtrlSum += getFloatVal(arrBillsProcessed[x].payamt);
			}

			if (billPaymentId == 'CREDIT') arrBillCRIds.push(billId);
		}

		var arrBillIds2 = [];
		var arrBillIds3 = [];
		var arrBillIds4 = [];
		var arrBillIds5 = [];
    var arrBillIds6 = [];

		for (vx in arrTempBillIds) {
			var isBC = false;

			for (var x in arrBillCRIds) {
				if (arrTempBillIds[vx] == arrBillCRIds[x]) {
					isBC = true;
					break;
				}
			}

			if (!isBC) {
				arrBillIds.push(arrTempBillIds[vx]);
				arrBillIds2.push(arrTempBillIds[vx]);
				arrBillIds3.push(arrTempBillIds[vx]);
				arrBillIds4.push(arrTempBillIds[vx]);
				arrBillIds5.push(arrTempBillIds[vx]);
        arrBillIds6.push(arrTempBillIds[vx]);
			}
		}

		dAudit(
			'createHSBC_KOREA_XMLDoc',
			JSON.stringify({
				'arrBillIds.length': arrBillIds.length,
				'arrBillIds2.length': arrBillIds2.length,
				'arrBillIds3.length': arrBillIds3.length,
				'arrBillIds4.length': arrBillIds4.length,
				'arrBillIds5.length': arrBillIds5.length,
        'arrBillIds6.length': arrBillIds6.length,
			})
		);

		dLog('createHSBC_KOREA_XMLDoc', 'arrBillIds = ' + arrBillIds);
		dLog('createHSBC_KOREA_XMLDoc', 'arrBillIds.length ' + arrBillIds.length);

		if (arrBillIds.length < 1) {
			dLog('createHSBC_KOREA_XMLDoc', 'No bill id to generate xml. exit xml creation.');
			return null;
		}

		var arrBillCredits = getBillCredit(arrBillIds);
		var objBillsData = getBillData(arrBillIds2);
		var arrBillPO = getPOMap(arrBillIds3);
		var arrVendorBills = getPayeeBillsByPayMethod(arrBillIds4);
		var arrVendorBillsCurr = getPayeeBillsCurrency(arrBillIds5);
    var arrExpenseReports = getExpenseReports(arrBillIds6);
    dLog('arrExpenseReports', JSON.stringify(arrExpenseReports));

		var nsAcctSub = !isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('subsidiary', 'CUSTRECORD_ACCT_MAP_NETSUITE_ACCOUNT')) ? objAcctMapping[0].getValue('subsidiary', 'CUSTRECORD_ACCT_MAP_NETSUITE_ACCOUNT') : '';
		var objVDCRecResults = getVendorDAC_CCRPaymentRec(nsAcctSub);
		var arrCurrMap = getCurrecnyISOCode();
		var currDate = formatDate(new Date());
		var tmpTotalAmt = 0;
		var arrPayeeIds = [];

		dAudit(
			'createHSBC_KOREA_XMLDoc',
			JSON.stringify({
				'arrBillCredits.length': arrBillCredits.length,
				'objBillsData.length': objBillsData.length,
				'arrBillPO.length': arrBillPO.length,
				'arrVendorBills.length': arrVendorBills.length,
        'arrExpenseReports.length': arrExpenseReports.length,
				'objVDCRecResults.length': objVDCRecResults.length,
			})
		);

		// get Total Bill amount
		for (x in arrVendorBills) {
			var arrBillIds = arrVendorBills[x];

			var payeeId = x.split('X@X')[1];
			arrPayeeIds.push(payeeId);

			for (vbill in arrBillIds) {
				// pmtTotalAmt += getFloatVal(arrBillAmt[arrBillIds[vbill]]);
			}
		}    
    for (var z=0; z<arrExpenseReports.length; z++) {      
      arrPayeeIds.push(arrExpenseReports[z].emp);
    }
    
		arrPayeeIds = removeDuplicates(arrPayeeIds);
    dLog('arrPayeeIds', JSON.stringify(arrPayeeIds));
		var arrVendors = getEntityData(arrPayeeIds);
    var arrEmployees = getEmployeeData(arrPayeeIds);

		var fileCtrlNumber = Date.create().format('{yy}{MM}{dd}{mm}{ss}');

		// ***START*** A. GROUP HEADER
		var grpHdr = addNodeFromParentNode(xmlDoc, cstmrCdtTrfInitnNode, 'GrpHdr');
		addTextNodeFromParentNode(xmlDoc, grpHdr, 'MsgId', 'FILE' + pad(fileCtrlNumber, 4));

		// var currDate = Date.create();
		var currDate = new Date();
		addTextNodeFromParentNode(xmlDoc, grpHdr, 'CreDtTm', currDate.format('{yyyy}-{MM}-{dd}T{hh}:{mm}:{ss}'));
    var authStn = addNodeFromParentNode(xmlDoc, grpHdr, 'Authstn');
    addTextNodeFromParentNode(xmlDoc, authStn, 'Cd', 'ILEV'); //

		addTextNodeFromParentNode(xmlDoc, grpHdr, 'NbOfTxs', grpHdrNbOfTxs);
		addTextNodeFromParentNode(xmlDoc, grpHdr, 'CtrlSum', grpHdrCtrlSum.toFixed(2));
    

		var initgPty = addNodeFromParentNode(xmlDoc, grpHdr, 'InitgPty');
		// addTextNodeFromParentNode(xmlDoc, initgPty, 'Nm', objVDCRecResults[0].getValue('custrecord_companyname') || '');
    var initgPtyId = addNodeFromParentNode(xmlDoc, initgPty, 'Id');
    var initgPtyOrgId = addNodeFromParentNode(xmlDoc, initgPtyId, 'OrgId');
    var initgPtyOthr = addNodeFromParentNode(xmlDoc, initgPtyOrgId, 'Othr');
    addTextNodeFromParentNode(xmlDoc, initgPtyOthr, 'Id', objAcctMapping[0].getValue('custrecord_acct_map_ceo_company_id')); //custrecord_acct_map_ceo_company_id //custrecord_ceocompid
    dAudit('company id', objAcctMapping[0].getValue('custrecord_acct_map_ceo_company_id'));
    

		// ***END*** A. GROUP HEADER

		var ccy = '';
		if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_account_currency'))) ccy = arrCurrMap[objAcctMapping[0].getValue('custrecord_acct_map_account_currency')];

		dAudit('arrBillPayInfoCtr', JSON.stringify(arrBillPayInfoCtr));
		dAudit('arrBillPayInfoCtr.length', JSON.stringify(arrBillPayInfoCtr.length));

		for (x in arrBillPayInfoCtr) {
			// var arrTemp = x.split('@@');
			// var payeeId = arrTemp[1];
			var paymentMethod = x;

			// ***START*** B. PAYMENT INFORMATION SECTION
			var pmtInf = addNodeFromParentNode(xmlDoc, cstmrCdtTrfInitnNode, 'PmtInf');
      // if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_ceocompid'))) 
			addTextNodeFromParentNode(xmlDoc, pmtInf, 'PmtInfId', 'FILE' + pad(fileCtrlNumber, 4)); //objVDCRecResults[0].getValue('custrecord_ceocompid'));

			addTextNodeFromParentNode(xmlDoc, pmtInf, 'PmtMtd', paymentMethod == 'DAC' ? 'TRF' : 'TRF'); //always TRF
			// addTextNodeFromParentNode(xmlDoc, pmtInf, 'BtchBookg', 'false');

			var pmtInfNbOfTxs = 0;
			for (pnb in arrPmtInfNbOfTxs) {
				var tmp = pnb.split('@@');
				var tmpPmethod = tmp[0];
				if (tmpPmethod == paymentMethod) {
					pmtInfNbOfTxs++;
				}
			}
			// addTextNodeFromParentNode(xmlDoc, pmtInf, 'NbOfTxs', pmtInfNbOfTxs);

			// addTextNodeFromParentNode(xmlDoc, pmtInf, 'CtrlSum', Number(arrBillPayInfoSum[paymentMethod]).toFixed(2));

			var pmtTpInf = addNodeFromParentNode(xmlDoc, pmtInf, 'PmtTpInf');
			var svcLvl = addNodeFromParentNode(xmlDoc, pmtTpInf, 'SvcLvl');
      if (paymentMethod=='DAC') {
        addTextNodeFromParentNode(xmlDoc, svcLvl, 'Cd', 'NURG');
      } else if (paymentMethod=='MTS') {
        addTextNodeFromParentNode(xmlDoc, svcLvl, 'Cd', 'URGP');
      }
			

			// var lclInstrm = addNodeFromParentNode(xmlDoc, pmtTpInf, 'LclInstrm');
			// addTextNodeFromParentNode(xmlDoc, lclInstrm, 'Prtry', 'CITI540');

			// var ctgyPurp = addNodeFromParentNode(xmlDoc, pmtTpInf, 'ctgyPurp');
			// addTextNodeFromParentNode(xmlDoc, ctgyPurp, 'Cd', 'SUPP');

			var new_date = moment(new Date()).add(1, 'days').format('YYYY-MM-DD');
      // moment(d).format('YYMMDD')
			addTextNodeFromParentNode(xmlDoc, pmtInf, 'ReqdExctnDt', moment(d).format('YYYY-MM-DD')); //new_date); //currDate.format("{yyyy}-{MM}-{dd}")

			var dbtr = addNodeFromParentNode(xmlDoc, pmtInf, 'Dbtr');

			if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_companyname'))) 
        addTextNodeFromParentNode(xmlDoc, dbtr, 'Nm', objVDCRecResults[0].getValue('custrecord_companyname'));
      
      var dbtrPstlAdr = addNodeFromParentNode(xmlDoc, dbtr, 'PstlAdr');
      if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compadd1'))) 
        addTextNodeFromParentNode(xmlDoc, dbtrPstlAdr, 'StrtNm', objVDCRecResults[0].getValue('custrecord_compadd1'));
      // if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compadd2'))) 
      //   addTextNodeFromParentNode(xmlDoc, dbtrPstlAdr, 'BldgNb', objVDCRecResults[0].getValue('custrecord_compadd2'));
      if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_comppostcode'))) 
        addTextNodeFromParentNode(xmlDoc, dbtrPstlAdr, 'PstCd', objVDCRecResults[0].getValue('custrecord_comppostcode'));
      // if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compcity'))) 
      //   addTextNodeFromParentNode(xmlDoc, dbtrPstlAdr, 'TwnNm', objVDCRecResults[0].getValue('custrecord_compcity'));
      // if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compstateprov'))) 
      //   addTextNodeFromParentNode(xmlDoc, dbtrPstlAdr, 'CtrySubDvsn', objVDCRecResults[0].getValue('custrecord_compstateprov'));
      if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compcountrycode'))) 
        addTextNodeFromParentNode(xmlDoc, dbtrPstlAdr, 'Ctry', countryCodeMapping[objVDCRecResults[0].getValue('custrecord_compcountrycode')] || objVDCRecResults[0].getValue('custrecord_compcountrycode'));
    
      if (paymentMethod=='DAC') {
        var dbtrId = addNodeFromParentNode(xmlDoc, dbtr, 'Id');
        var dbtrIdOrgId = addNodeFromParentNode(xmlDoc, dbtrId, 'OrgId');
        var dbtrIdOrgIdOthr = addNodeFromParentNode(xmlDoc, dbtrIdOrgId, 'Othr');
        addTextNodeFromParentNode(xmlDoc, dbtrIdOrgIdOthr, 'Id', '006');      
        var dbtrIdOrgIdOthrSchmeNm = addNodeFromParentNode(xmlDoc, dbtrIdOrgIdOthr, 'SchmeNm');
        addTextNodeFromParentNode(xmlDoc, dbtrIdOrgIdOthrSchmeNm, 'Prtry', 'PSET');        
      }
			
			var dbtrAcct = addNodeFromParentNode(xmlDoc, pmtInf, 'DbtrAcct');
			var idDbtrAcct = addNodeFromParentNode(xmlDoc, dbtrAcct, 'Id');

			var otherDbtrAcct = addNodeFromParentNode(xmlDoc, idDbtrAcct, 'Othr');

			if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_origin_acc'))) 
        addTextNodeFromParentNode(xmlDoc, otherDbtrAcct, 'Id', objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_origin_acc'));

      if (paymentMethod=='MTS') {
        addTextNodeFromParentNode(xmlDoc, dbtrAcct, 'Ccy', 'KRW');
      }
			
      var dbtrAgt = addNodeFromParentNode(xmlDoc, pmtInf, 'DbtrAgt');
      if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id'))) {
        var finlstnId = addNodeFromParentNode(xmlDoc, dbtrAgt, 'FinInstnId');
        addTextNodeFromParentNode(xmlDoc, finlstnId, 'BIC', objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id'));
        addTextNodeFromParentNode(xmlDoc, finlstnId, 'Nm', 'HSBC');

        var dbtrAgtPstlAdr = addNodeFromParentNode(xmlDoc, finlstnId, 'PstlAdr');
        addTextNodeFromParentNode(xmlDoc, dbtrAgtPstlAdr, 'Ctry', countryCodeMapping[objVDCRecResults[0].getValue('custrecord_ica_orig_bank_country_code')] || 'KR');  //Change this      
      }

      if (paymentMethod=='DAC') {
        addTextNodeFromParentNode(xmlDoc, pmtInf, 'ChrgBr', 'DEBT');
      }
      

      
			

			// ***END*** B. PAYMENT INFORMATION SECTION

			// dLog('creatBOAXMLDoc', 'Bill Payment Method = ' + paymentMethod);

      //Add something here for ExpenseReport

      dAudit('arrExpenseReports',JSON.stringify(arrExpenseReports));
      var expenseReports = _.groupBy(arrExpenseReports, "emp");
			var payformat = '';
      dAudit('expenseReports', JSON.stringify(expenseReports));
      for (er in expenseReports) {
        var payeeId = er;
        dLog('createHSBC_KOREA_XMLDoc', JSON.stringify(expenseReports[er]));
        dLog('createHSBC_KOREA_XMLDoc.payeeId', payeeId);
        var objVendor = _.find(arrEmployees, { internalid: String(payeeId) });
        dLog('createHSBC_KOREA_XMLDoc.objVendor', JSON.stringify(objVendor));
				if (isEmpty(objVendor)) continue;
				if (payformat == '') payformat = objVendor.payformat;

				var pmtMethod = objVendor.paymentmethod;
				if (paymentMethod != pmtMethod) continue;

				dLog('createHSBC_KOREA_XMLDoc', 'Vendor Payment Method = ' + pmtMethod);

				var arrBills = expenseReports[er];
				var tmpAmt = 0;

        var numberOfBills = _.size(arrBills);
        for (by in arrBills) {
					var billId = arrBills[by].internalid;

					var netAmt = 0;
					var origAmt = getFloatVal(arrBillAmtOrig[billId]);
					var amt = getFloatVal(arrBillAmt[billId]); //this is the payment amount
					var discAmt = !isEmpty(arrBillDiscAmt[billId]) ? getFloatVal(arrBillDiscAmt[billId]) : 0;
					netAmt = amt;
					tmpAmt += netAmt;

					if (discAmt > 0) {
						netAmt -= discAmt;
						tmpAmt -= discAmt;
					}          
				}

        dLog('createHSBC_KOREA_XMLDoc.expenseReports', 'Adding xml details=' + payeeId);
				// ***START*** C. CREDIT TRANSFER TRANSACTION INFORMATION
				// SECTION

				var cdtTrfTxInf = addNodeFromParentNode(xmlDoc, pmtInf, 'CdtTrfTxInf');
				var pmtIdCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtTrfTxInf, 'PmtId');

        // var refnum = arrBillPaymentMap[payeeId];
				// var instrId = '';
				// if (refnum.length > 12) {
				// 	instrId = pz(refnum.substring(refnum.length - 12, refnum.length), 12);
				// } else {
				// 	instrId = pz(refnum, 12);
				// }

        var instrId = String(arrBillPaymentMap[payeeId]);				
        var endToEndId = String(arrBillPaymentMap[payeeId]);				
        if (paymentMethod=='DAC') {
          instrId = instrId.substring(instrId.length - 12);            
          endToEndId = endToEndId.substring(endToEndId.length - 12);  
          addTextNodeFromParentNode(xmlDoc, pmtIdCdtTrfTxInf, 'InstrId', instrId);
          addTextNodeFromParentNode(xmlDoc, pmtIdCdtTrfTxInf, 'EndToEndId', instrId);  
        } else if (paymentMethod=='MTS') {
          // instrId = instrId.substring(instrId.length - 35);            
          endToEndId = endToEndId.substring(endToEndId.length - 12);  
          // addTextNodeFromParentNode(xmlDoc, pmtIdCdtTrfTxInf, 'InstrId', instrId);
          addTextNodeFromParentNode(xmlDoc, pmtIdCdtTrfTxInf, 'EndToEndId', instrId);  
        }


        // addTextNodeFromParentNode(xmlDoc, pmtIdCdtTrfTxInf, 'InstrId', instrId);
				// addTextNodeFromParentNode(xmlDoc, pmtIdCdtTrfTxInf, 'EndToEndId', instrId); //arrBillPaymentMap[payeeId]
				var amtCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtTrfTxInf, 'Amt');
				var amtCdtTrfTxInfInstdAmt = addTextNodeFromParentNode(xmlDoc, amtCdtTrfTxInf, 'InstdAmt', tmpAmt.toFixed(2));
        var curr = arrCurrMap[objBillsData[billId].currency] || ccy;
				setAttributeValue(amtCdtTrfTxInfInstdAmt, 'Ccy', curr);


				var cdtrAgtCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtTrfTxInf, 'CdtrAgt');
        var finInstnIdCdtrAgtCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtrAgtCdtTrfTxInf, 'FinInstnId');
        dLog('paymentMethod.HSBCKOREA', paymentMethod);
        if (paymentMethod=='MTS') {
          addTextNodeFromParentNode(xmlDoc, finInstnIdCdtrAgtCdtTrfTxInf, 'BIC', objVendor.recbankprimid || 'DBSSSGSGXXX');
        }
        else if (paymentMethod=='DAC') {
          var clrSysInf = addNodeFromParentNode(xmlDoc, finInstnIdCdtrAgtCdtTrfTxInf, 'ClrSysMmbId');
          addTextNodeFromParentNode(xmlDoc, clrSysInf, 'MmbId', objVendor.recbankprimid || '');          
        }
        
        addTextNodeFromParentNode(xmlDoc, finInstnIdCdtrAgtCdtTrfTxInf, 'Nm', objVendor.vbankname || 'DBS_BANK');
				// var clrSysmmbIdFinInstnIdCdtrAgtCdtTrfTxInf = addNodeFromParentNode(xmlDoc, finInstnIdCdtrAgtCdtTrfTxInf, 'ClrSysMmbId');
				// if (!isEmpty(objVendor.recbankprimid)) addTextNodeFromParentNode(xmlDoc, clrSysmmbIdFinInstnIdCdtrAgtCdtTrfTxInf, 'MmbId', objVendor.recbankprimid);
        // if (!isEmpty(objVendor.vbankname)) addTextNodeFromParentNode(xmlDoc, finInstnIdCdtrAgtCdtTrfTxInf, 'Nm', objVendor.vbankname);
        var cdtrAgtPstlAdr = addNodeFromParentNode(xmlDoc, finInstnIdCdtrAgtCdtTrfTxInf, 'PstlAdr');
        addTextNodeFromParentNode(xmlDoc, cdtrAgtPstlAdr, 'Ctry', countryCodeMapping[objVendor.vbankcountry] || objVendor.vbankcountry || 'KR');
        // addTextNodeFromParentNode(xmlDoc, cdtrAgtPstlAdr, 'Ctry', countryCodeMapping[objVendor.vbankcountry] || objVendor.vbankcountry);
        
				var cdtrCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtTrfTxInf, 'Cdtr');

				if (!isEmpty(objVendor.vendorname)) addTextNodeFromParentNode(xmlDoc, cdtrCdtTrfTxInf, 'Nm', objVendor.vendorname);

				var pstlAdrCdtrCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtrCdtTrfTxInf, 'PstlAdr');
				if (!isEmpty(objVendor.vendoraddrs1)) addTextNodeFromParentNode(xmlDoc, pstlAdrCdtrCdtTrfTxInf, 'StrtNm', objVendor.vendoraddrs1);
        if (!isEmpty(objVendor.vendoraddrs2)) addTextNodeFromParentNode(xmlDoc, pstlAdrCdtrCdtTrfTxInf, 'BldgNb', objVendor.vendoraddrs2);
        if (!isEmpty(objVendor.vendorpostal)) addTextNodeFromParentNode(xmlDoc, pstlAdrCdtrCdtTrfTxInf, 'PstCd', objVendor.vendorpostal);
				if (!isEmpty(objVendor.vendorcity)) addTextNodeFromParentNode(xmlDoc, pstlAdrCdtrCdtTrfTxInf, 'TwnNm', objVendor.vendorcity);
        if (!isEmpty(objVendor.vendorstateprovince)) addTextNodeFromParentNode(xmlDoc, pstlAdrCdtrCdtTrfTxInf, 'CtrySubDvsn', objVendor.vendorstateprovince);
        if (!isEmpty(objVendor.vendorcountrycode)) addTextNodeFromParentNode(xmlDoc, pstlAdrCdtrCdtTrfTxInf, 'Ctry', countryCodeMapping[objVendor.vendorcountrycode]);
				
				var cdtrAcct = addNodeFromParentNode(xmlDoc, cdtTrfTxInf, 'CdtrAcct');

				if (!isEmpty(objVendor.recpartyaccount)) {
					var idCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtrAcct, 'Id');
					var othrIdCdtTrfTxInf = addNodeFromParentNode(xmlDoc, idCdtTrfTxInf, 'Othr');
					addTextNodeFromParentNode(xmlDoc, othrIdCdtTrfTxInf, 'Id', objVendor.recbankprimid + objVendor.recpartyaccount);
				}

        // var purp = addNodeFromParentNode(xmlDoc, cdtTrfTxInf, 'Purp');
        // addTextNodeFromParentNode(xmlDoc, purp, 'Cd', 'SUPP');

				var rmtInfCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtTrfTxInf, 'RmtInf');

				tmpAmt = 0; // need to initialize back to 0

				for (y in arrBills) {
					var billId = arrBills[y].internalid;
          dLog('createHSBC_KOREA_XMLDoc.billId', JSON.stringify(billId));
					dLog('createHSBC_KOREA_XMLDoc', 'billId = ' + billId);

					var netAmt = 0;
					var origAmt = getFloatVal(arrBillAmtOrig[billId]);
					var amt = getFloatVal(arrBillAmt[billId]);

					var discAmt = !isEmpty(arrBillDiscAmt[billId]) ? getFloatVal(arrBillDiscAmt[billId]) : 0;

					netAmt = amt;
					tmpAmt += netAmt;

					if (discAmt > 0) {
						netAmt -= discAmt;
						tmpAmt -= discAmt;
					}

					dLog('createHSBC_KOREA_XMLDoc', JSON.stringify(objBillsData[billId]));
				}

				// ***END*** C. CREDIT TRANSFER TRANSACTION INFORMATION SECTION

				// END: PmtDetail
				tmpTotalAmt += tmpAmt;

        // var ustrdRmtInfCdtTrfTxInf = addNodeFromParentNode(xmlDoc, rmtInfCdtTrfTxInf, 'Ustrd');
        addTextNodeFromParentNode(xmlDoc, rmtInfCdtTrfTxInf, 'Ustrd', arrBillPaymentMap[payeeId] +',' + tmpTotalAmt);
			}      

			dAudit('arrVendorBills', arrVendorBills);
			var payformat = '';
			for (v in arrVendorBills) {
				var arrPayeeInfo = v.split('X@X');
				var payeeId = arrPayeeInfo[1];

				dLog('createHSBC_KOREA_XMLDoc', 'vb ndex = ' + v);
				       var objVendor = _.find(arrVendors, { internalid: String(payeeId)});
				// var objVendor = _.find(arrVendors, { internalid: String(payeeId), paymentmethod: String(paymentMethod) })[0];
        dAudit('objVendor-new', objVendor);
				if (isEmpty(objVendor)) continue;
				if (payformat == '') payformat = objVendor.payformat;

				var pmtMethod = objVendor.paymentmethod;
				if (paymentMethod != pmtMethod) continue;

				dLog('createHSBC_KOREA_XMLDoc', 'Vendor Payment Method = ' + pmtMethod);

				var arrBills = arrVendorBills[paymentMethod + 'X@X' + payeeId];
				var tmpAmt = 0;

				var numberOfBills = _.size(arrBills);
				for (by in arrBills) {
					var billId = arrBills[by];

					var netAmt = 0;
					var origAmt = getFloatVal(arrBillAmtOrig[billId]);
					var amt = getFloatVal(arrBillAmt[billId]); //this is the payment amount

					// dLog('creatXMLDoc', 'origAmt = ' + origAmt);
					// dLog('creatXMLDoc', 'amt = ' + amt);

					var discAmt = !isEmpty(arrBillDiscAmt[billId]) ? getFloatVal(arrBillDiscAmt[billId]) : 0;

					// tmpAmt += amt;
					netAmt = amt; //origAmt;
					tmpAmt += netAmt;

					if (discAmt > 0) {
						netAmt -= discAmt;
						tmpAmt -= discAmt;
					}

          
					if (!isEmpty(arrBillCredits[billId])) {
            dLog('arrBillCredits[billId]', JSON.stringify(arrBillCredits[billId]));
						var arrBC = arrBillCredits[billId];

						for (bc in arrBC) {
							var billCreditAmtP = getFloatVal(arrBC[bc].bcamt);
							var billCreditAmt = billCreditAmtP * -1;

							netAmt = netAmt - billCreditAmtP;
						}
					}
					// }
				}

				// ***START*** C. CREDIT TRANSFER TRANSACTION INFORMATION
				// SECTION

				var cdtTrfTxInf = addNodeFromParentNode(xmlDoc, pmtInf, 'CdtTrfTxInf');
				var pmtIdCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtTrfTxInf, 'PmtId');

        // var refnum = arrBillPaymentMap[payeeId];
				// var instrId = '';
				// if (refnum.length > 12) {
				// 	instrId = pz(refnum.substring(refnum.length - 12, refnum.length), 12);
				// } else {
				// 	instrId = pz(refnum, 12);
				// }

        var instrId = String(arrBillPaymentMap[payeeId]);				
        var endToEndId = String(arrBillPaymentMap[payeeId]);				
        if (paymentMethod=='DAC') {
          instrId = instrId.substring(instrId.length - 12);            
          endToEndId = endToEndId.substring(endToEndId.length - 12);  
          addTextNodeFromParentNode(xmlDoc, pmtIdCdtTrfTxInf, 'InstrId', instrId);
          addTextNodeFromParentNode(xmlDoc, pmtIdCdtTrfTxInf, 'EndToEndId', instrId);  
        } else if (paymentMethod=='MTS') {
          // instrId = instrId.substring(instrId.length - 35);            
          endToEndId = endToEndId.substring(endToEndId.length - 12);  
          // addTextNodeFromParentNode(xmlDoc, pmtIdCdtTrfTxInf, 'InstrId', instrId);
          addTextNodeFromParentNode(xmlDoc, pmtIdCdtTrfTxInf, 'EndToEndId', instrId);  
        }



        // addTextNodeFromParentNode(xmlDoc, pmtIdCdtTrfTxInf, 'InstrId', instrId);
				// addTextNodeFromParentNode(xmlDoc, pmtIdCdtTrfTxInf, 'EndToEndId', instrId);

				var amtCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtTrfTxInf, 'Amt');
				var amtCdtTrfTxInfInstdAmt = addTextNodeFromParentNode(xmlDoc, amtCdtTrfTxInf, 'InstdAmt', tmpAmt.toFixed(2));
        var curr = arrCurrMap[objBillsData[billId].currency] || ccy;
				setAttributeValue(amtCdtTrfTxInfInstdAmt, 'Ccy', curr);

				var cdtrAgtCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtTrfTxInf, 'CdtrAgt');

        var finInstnIdCdtrAgtCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtrAgtCdtTrfTxInf, 'FinInstnId');
        if (paymentMethod=='MTS') {
          addTextNodeFromParentNode(xmlDoc, finInstnIdCdtrAgtCdtTrfTxInf, 'BIC', objVendor.recbankprimid || 'DBSSSGSGXXX');
        }
        else if (paymentMethod=='DAC') {
          var clrSysInf = addNodeFromParentNode(xmlDoc, finInstnIdCdtrAgtCdtTrfTxInf, 'ClrSysMmbId');
          addTextNodeFromParentNode(xmlDoc, clrSysInf, 'MmbId', objVendor.recbankprimid || '');          
        }

        
        addTextNodeFromParentNode(xmlDoc, finInstnIdCdtrAgtCdtTrfTxInf, 'Nm', objVendor.vbankname || 'DBS_BANK');
				
				// var clrSysmmbIdFinInstnIdCdtrAgtCdtTrfTxInf = addNodeFromParentNode(xmlDoc, finInstnIdCdtrAgtCdtTrfTxInf, 'ClrSysMmbId'); //finInstnIdCdtrAgtCdtTrfTxInf

				// if (!isEmpty(objVendor.recbankprimid)) addTextNodeFromParentNode(xmlDoc, clrSysmmbIdFinInstnIdCdtrAgtCdtTrfTxInf, 'MmbId', objVendor.recbankprimid);
        // if (!isEmpty(objVendor.vbankname)) addTextNodeFromParentNode(xmlDoc, finInstnIdCdtrAgtCdtTrfTxInf, 'Nm', objVendor.vbankname); //cdtrAgtCdtTrfTxInf

        var cdtrAgtPstlAdr = addNodeFromParentNode(xmlDoc, finInstnIdCdtrAgtCdtTrfTxInf, 'PstlAdr'); // cdtrAgtCdtTrfTxInf
        addTextNodeFromParentNode(xmlDoc, cdtrAgtPstlAdr, 'Ctry', countryCodeMapping[objVendor.vbankcountry] || 'KR');
        
        


				var cdtrCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtTrfTxInf, 'Cdtr');

				if (!isEmpty(objVendor.vendorname)) addTextNodeFromParentNode(xmlDoc, cdtrCdtTrfTxInf, 'Nm', objVendor.vendorname);

				var pstlAdrCdtrCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtrCdtTrfTxInf, 'PstlAdr');
				if (!isEmpty(objVendor.vendoraddrs1)) addTextNodeFromParentNode(xmlDoc, pstlAdrCdtrCdtTrfTxInf, 'StrtNm', objVendor.vendoraddrs1);
        if (!isEmpty(objVendor.vendoraddrs2)) addTextNodeFromParentNode(xmlDoc, pstlAdrCdtrCdtTrfTxInf, 'BldgNb', objVendor.vendoraddrs2);
        if (!isEmpty(objVendor.vendorpostal)) addTextNodeFromParentNode(xmlDoc, pstlAdrCdtrCdtTrfTxInf, 'PstCd', objVendor.vendorpostal);
				if (!isEmpty(objVendor.vendorcity)) addTextNodeFromParentNode(xmlDoc, pstlAdrCdtrCdtTrfTxInf, 'TwnNm', objVendor.vendorcity);
        if (!isEmpty(objVendor.vendorstateprovince)) addTextNodeFromParentNode(xmlDoc, pstlAdrCdtrCdtTrfTxInf, 'CtrySubDvsn', objVendor.vendorstateprovince);
        if (!isEmpty(objVendor.vendorcountrycode)) addTextNodeFromParentNode(xmlDoc, pstlAdrCdtrCdtTrfTxInf, 'Ctry', countryCodeMapping[objVendor.vendorcountrycode] || 'KR');
				
				var cdtrAcct = addNodeFromParentNode(xmlDoc, cdtTrfTxInf, 'CdtrAcct');

				if (!isEmpty(objVendor.recpartyaccount)) {
					var idCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtrAcct, 'Id');
					var othrIdCdtTrfTxInf = addNodeFromParentNode(xmlDoc, idCdtTrfTxInf, 'Othr');

					addTextNodeFromParentNode(xmlDoc, othrIdCdtTrfTxInf, 'Id', objVendor.recbankprimid + objVendor.recpartyaccount);
				}
        //KOREA_REMOVE?
        var purp = addNodeFromParentNode(xmlDoc, cdtTrfTxInf, 'Purp');
        addTextNodeFromParentNode(xmlDoc, purp, 'Cd', 'SUPP');


				var rmtInfCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtTrfTxInf, 'RmtInf');

				tmpAmt = 0; // need to initialize back to 0

				for (y in arrBills) {
					var billId = arrBills[y];
					dLog('createHSBCSGXMLDoc', 'billId = ' + billId);

					var netAmt = 0;
					var origAmt = getFloatVal(arrBillAmtOrig[billId]);
					var amt = getFloatVal(arrBillAmt[billId]);

					// dLog('creatXMLDoc', 'origAmt = ' + origAmt);
					// dLog('creatXMLDoc', 'amt = ' + amt);

					var discAmt = !isEmpty(arrBillDiscAmt[billId]) ? getFloatVal(arrBillDiscAmt[billId]) : 0;

					if (!isEmpty(arrBillCredits[billId])) {
						var arrBC = arrBillCredits[billId];
						for (bc in arrBC) {
							var billCreditAmtP = getFloatVal(arrBC[bc].bcamt);
							var billCreditAmt = billCreditAmtP * -1;

							tmpAmt = tmpAmt - billCreditAmtP;
							netAmt = netAmt - billCreditAmtP;
						}
					}

					// tmpAmt += amt;
					netAmt = amt; //origAmt;
					tmpAmt += netAmt;

					if (discAmt > 0) {
						netAmt -= discAmt;
						tmpAmt -= discAmt;
					}

					dLog('createHSBC_KOREA_XMLDoc', JSON.stringify(objBillsData[billId]));

					if (!isEmpty(arrBillCredits[billId])) {
						var arrBC = arrBillCredits[billId];

						for (bc in arrBC) {
							var billCreditAmtP = getFloatVal(arrBC[bc].bcamt);
							var billCreditAmt = billCreditAmtP;

							tmpAmt = tmpAmt - billCreditAmtP;
							netAmt = netAmt - billCreditAmtP;

							var bcNum = arrBC[bc].bcnum;
						}
					}

				}

				// ***END*** C. CREDIT TRANSFER TRANSACTION INFORMATION SECTION

				// END: PmtDetail
				tmpTotalAmt += tmpAmt;

        addTextNodeFromParentNode(xmlDoc, rmtInfCdtTrfTxInf, 'Ustrd', arrBillPaymentMap[payeeId] +',' + tmpTotalAmt);

			}
		}

		dLog('createHSBC_KOREA_XMLDoc', 'tmpTotalAmt = ' + tmpTotalAmt);
		dLog('createHSBC_KOREA_XMLDoc', '>>> END <<<');

		return xmlDoc;
	} catch (e) {
		var stErrMsg = '';
		if (e.getDetails != undefined) {
			stErrMsg = 'Script Error: ' + e.getCode() + '<br>' + e.getDetails() + '<br>' + e.getStackTrace();
		} else {
			stErrMsg = 'Script Error: ' + e.toString();
		}

		dLog('createHSBC_KOREA_XMLDoc Script Error', stErrMsg);
	}
}

function createHSBC_CHINA_XMLDoc(objAcctMapping) {
	try {
		dLog('createHSBC_CHINA_XMLDoc', '>>> START <<<');

		// start create xml line
		var xmlDoc = nlapiStringToXML('<?xml version="1.0" encoding="utf-8"?><Document></Document>');
		var DocumentNode = getNode(xmlDoc, '/Document');
		setAttributeValue(DocumentNode, 'xmlns', 'urn:iso:std:iso:20022:tech:xsd:pain.001.001.03');

    var cstmrCdtTrfInitnNode = addNodeFromParentNode(xmlDoc, DocumentNode, 'CstmrCdtTrfInitn');

    var bpmdate = BPM_DATE;
    var d = nlapiStringToDate(bpmdate, 'datetime');
  
		var arrTempBillIds = [];
		var arrBillCRIds = [];
		var arrBillAmt = [];
		var arrBillAmtOrig = [];
		var arrBillDiscAmt = [];
		var arrBillPayInfoCtr = [];
		var arrBillPayInfoSum = [];
		var arrGrpHdrNbOfTxs = [];
		var arrPmtInfNbOfTxs = [];
		var arrBillIds = [];
		var grpHdrNbOfTxs = 0;
		var grpHdrCtrlSum = 0;

    var pmHead = '';

		for (x in arrBillsProcessed) {
			var billId = arrBillsProcessed[x].id;
			var billPaymentId = arrBillsProcessed[x].payment;

			dLog('createHSBC_CHINA_XMLDoc', 'Bill info = ' + JSON.stringify(arrBillsProcessed[x]));

			// check if payment id exist, only generate xml bills with payment
			// id, skip processed bill credit
			if (!isEmpty(billPaymentId) && billPaymentId != 'XXXNONEXXX' && billPaymentId != 'CREDIT') {
				if (billPaymentId != 'CREDIT') arrTempBillIds.push(billId);

				var payMethod = arrBillsProcessed[x].paymethod;
				var paymentId = arrBillsProcessed[x].payment;
				var payeeId = arrBillsProcessed[x].payeeid;
        if (pmHead=='') pmHead = payMethod;

				arrBillAmtOrig[billId] = arrBillsProcessed[x].origamt;
				// arrBillAmt[billId] = arrBillsProcessed[x].pay;
				arrBillAmt[billId] = arrBillsProcessed[x].payamt;
				arrBillDiscAmt[billId] = arrBillsProcessed[x].discamt;

				var ndx = payMethod + '@@' + paymentId;

				if (arrBillPayInfoCtr[payMethod] == null) arrBillPayInfoCtr[payMethod] = 0;
				if (arrBillPayInfoSum[payMethod] == null) arrBillPayInfoSum[payMethod] = 0;
				if (arrPmtInfNbOfTxs[ndx] == null) arrPmtInfNbOfTxs[ndx] = 0;

				if (paymentId && arrGrpHdrNbOfTxs[paymentId] == null) grpHdrNbOfTxs++;

				arrPmtInfNbOfTxs[ndx]++;
				arrBillPayInfoCtr[payMethod]++;
				arrBillPayInfoSum[payMethod] += getFloatVal(arrBillsProcessed[x].payamt);
				arrGrpHdrNbOfTxs[paymentId] = paymentId;

				grpHdrCtrlSum += getFloatVal(arrBillsProcessed[x].payamt);
			}

			if (billPaymentId == 'CREDIT') arrBillCRIds.push(billId);
		}

		var arrBillIds2 = [];
		var arrBillIds3 = [];
		var arrBillIds4 = [];
		var arrBillIds5 = [];
    var arrBillIds6 = [];

		for (vx in arrTempBillIds) {
			var isBC = false;

			for (var x in arrBillCRIds) {
				if (arrTempBillIds[vx] == arrBillCRIds[x]) {
					isBC = true;
					break;
				}
			}

			if (!isBC) {
				arrBillIds.push(arrTempBillIds[vx]);
				arrBillIds2.push(arrTempBillIds[vx]);
				arrBillIds3.push(arrTempBillIds[vx]);
				arrBillIds4.push(arrTempBillIds[vx]);
				arrBillIds5.push(arrTempBillIds[vx]);
        arrBillIds6.push(arrTempBillIds[vx]);
			}
		}

		dAudit(
			'createHSBC_CHINA_XMLDoc',
			JSON.stringify({
				'arrBillIds.length': arrBillIds.length,
				'arrBillIds2.length': arrBillIds2.length,
				'arrBillIds3.length': arrBillIds3.length,
				'arrBillIds4.length': arrBillIds4.length,
				'arrBillIds5.length': arrBillIds5.length,
        'arrBillIds6.length': arrBillIds6.length,
			})
		);

		dLog('createHSBC_CHINA_XMLDoc', 'arrBillIds = ' + arrBillIds);
		dLog('createHSBC_CHINA_XMLDoc', 'arrBillIds.length ' + arrBillIds.length);

		if (arrBillIds.length < 1) {
			dLog('createHSBC_CHINA_XMLDoc', 'No bill id to generate xml. exit xml creation.');
			return null;
		}

		var arrBillCredits = getBillCredit(arrBillIds);
		var objBillsData = getBillData(arrBillIds2);
		var arrBillPO = getPOMap(arrBillIds3);
		var arrVendorBills = getPayeeBillsByPayMethod(arrBillIds4);
		var arrVendorBillsCurr = getPayeeBillsCurrency(arrBillIds5);
    var arrExpenseReports = getExpenseReports(arrBillIds6);
    dLog('arrExpenseReports', JSON.stringify(arrExpenseReports));

		var nsAcctSub = !isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('subsidiary', 'CUSTRECORD_ACCT_MAP_NETSUITE_ACCOUNT')) ? objAcctMapping[0].getValue('subsidiary', 'CUSTRECORD_ACCT_MAP_NETSUITE_ACCOUNT') : '';
		var objVDCRecResults = getVendorDAC_CCRPaymentRec(nsAcctSub);
		var arrCurrMap = getCurrecnyISOCode();
		var currDate = formatDate(new Date());
		var tmpTotalAmt = 0;
		var arrPayeeIds = [];

		dAudit(
			'createHSBC_CHINA_XMLDoc',
			JSON.stringify({
				'arrBillCredits.length': arrBillCredits.length,
				'objBillsData.length': objBillsData.length,
				'arrBillPO.length': arrBillPO.length,
				'arrVendorBills.length': arrVendorBills.length,
        'arrExpenseReports.length': arrExpenseReports.length,
				'objVDCRecResults.length': objVDCRecResults.length,
			})
		);

		// get Total Bill amount
		for (x in arrVendorBills) {
			var arrBillIds = arrVendorBills[x];

			var payeeId = x.split('X@X')[1];
			arrPayeeIds.push(payeeId);

			for (vbill in arrBillIds) {
				// pmtTotalAmt += getFloatVal(arrBillAmt[arrBillIds[vbill]]);
			}
		}    
    for (var z=0; z<arrExpenseReports.length; z++) {      
      arrPayeeIds.push(arrExpenseReports[z].emp);
    }
    
		arrPayeeIds = removeDuplicates(arrPayeeIds);
    dLog('arrPayeeIds', JSON.stringify(arrPayeeIds));
		var arrVendors = getEntityData(arrPayeeIds);
    var arrEmployees = getEmployeeData(arrPayeeIds);

		var fileCtrlNumber = Date.create().format('{yy}{MM}{dd}{mm}{ss}');

		// ***START*** A. GROUP HEADER
		var grpHdr = addNodeFromParentNode(xmlDoc, cstmrCdtTrfInitnNode, 'GrpHdr');
		addTextNodeFromParentNode(xmlDoc, grpHdr, 'MsgId', 'FILE' + pad(fileCtrlNumber, 4));

		// var currDate = Date.create();
		var currDate = new Date();
		addTextNodeFromParentNode(xmlDoc, grpHdr, 'CreDtTm', currDate.format('{yyyy}-{MM}-{dd}T{hh}:{mm}:{ss}'));
    var authStn = addNodeFromParentNode(xmlDoc, grpHdr, 'Authstn');
    addTextNodeFromParentNode(xmlDoc, authStn, 'Cd', 'ILEV'); //

		addTextNodeFromParentNode(xmlDoc, grpHdr, 'NbOfTxs', grpHdrNbOfTxs);
		addTextNodeFromParentNode(xmlDoc, grpHdr, 'CtrlSum', grpHdrCtrlSum.toFixed(2));
    

		var initgPty = addNodeFromParentNode(xmlDoc, grpHdr, 'InitgPty');
    if (pmHead=='DAC') {
      dLog('createHSBC_CHINA_XMLDoc', 'add initgPty.Nm=' + paymentMethod);  
      addTextNodeFromParentNode(xmlDoc, initgPty, 'Nm', objVDCRecResults[0].getValue('custrecord_companyname') || '');
    }		

    var initgPtyId = addNodeFromParentNode(xmlDoc, initgPty, 'Id');
    var initgPtyOrgId = addNodeFromParentNode(xmlDoc, initgPtyId, 'OrgId');
    var initgPtyOthr = addNodeFromParentNode(xmlDoc, initgPtyOrgId, 'Othr');
    addTextNodeFromParentNode(xmlDoc, initgPtyOthr, 'Id', objAcctMapping[0].getValue('custrecord_acct_map_ceo_company_id')); //custrecord_acct_map_ceo_company_id //custrecord_ceocompid
    dAudit('company id', objAcctMapping[0].getValue('custrecord_acct_map_ceo_company_id'));
    

		// ***END*** A. GROUP HEADER

		var ccy = '';
		if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_account_currency'))) ccy = arrCurrMap[objAcctMapping[0].getValue('custrecord_acct_map_account_currency')];

		dAudit('arrBillPayInfoCtr', JSON.stringify(arrBillPayInfoCtr));
		dAudit('arrBillPayInfoCtr.length', JSON.stringify(arrBillPayInfoCtr.length));

		for (x in arrBillPayInfoCtr) {
			// var arrTemp = x.split('@@');
			// var payeeId = arrTemp[1];
			var paymentMethod = x;

			// ***START*** B. PAYMENT INFORMATION SECTION
			var pmtInf = addNodeFromParentNode(xmlDoc, cstmrCdtTrfInitnNode, 'PmtInf');
			addTextNodeFromParentNode(xmlDoc, pmtInf, 'PmtInfId', 'FILE' + pad(fileCtrlNumber, 4));
			addTextNodeFromParentNode(xmlDoc, pmtInf, 'PmtMtd', paymentMethod == 'DAC' ? 'TRF' : 'TRF'); //always TRF

			var pmtInfNbOfTxs = 0;
			for (pnb in arrPmtInfNbOfTxs) {
				var tmp = pnb.split('@@');
				var tmpPmethod = tmp[0];
				if (tmpPmethod == paymentMethod) {
					pmtInfNbOfTxs++;
				}
			}

			var pmtTpInf = addNodeFromParentNode(xmlDoc, pmtInf, 'PmtTpInf');
			var svcLvl = addNodeFromParentNode(xmlDoc, pmtTpInf, 'SvcLvl');
      if (paymentMethod=='DAC') {
        addTextNodeFromParentNode(xmlDoc, svcLvl, 'Cd', 'NURG');
      } else if (paymentMethod=='MTS') {
        addTextNodeFromParentNode(xmlDoc, svcLvl, 'Cd', 'URGP');
      }
			
			addTextNodeFromParentNode(xmlDoc, pmtInf, 'ReqdExctnDt', moment(d).format('YYYY-MM-DD'));

			var dbtr = addNodeFromParentNode(xmlDoc, pmtInf, 'Dbtr');

			if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_companyname'))) 
        addTextNodeFromParentNode(xmlDoc, dbtr, 'Nm', objVDCRecResults[0].getValue('custrecord_companyname'));
      
      var dbtrPstlAdr = addNodeFromParentNode(xmlDoc, dbtr, 'PstlAdr');
      if (paymentMethod=='MTS') {
        if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compadd1'))) 
          addTextNodeFromParentNode(xmlDoc, dbtrPstlAdr, 'StrtNm', objVDCRecResults[0].getValue('custrecord_compadd1'));
        if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_comppostcode'))) 
          addTextNodeFromParentNode(xmlDoc, dbtrPstlAdr, 'PstCd', objVDCRecResults[0].getValue('custrecord_comppostcode'));
      }
      if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compcountrycode'))) 
        addTextNodeFromParentNode(xmlDoc, dbtrPstlAdr, 'Ctry', countryCodeMapping[objVDCRecResults[0].getValue('custrecord_compcountrycode')] || objVDCRecResults[0].getValue('custrecord_compcountrycode'));

      if (paymentMethod=='DAC') {
        var dbtrId = addNodeFromParentNode(xmlDoc, dbtr, 'Id');
        var dbtrIdOrgId = addNodeFromParentNode(xmlDoc, dbtrId, 'OrgId');
        var dbtrIdOrgIdOthr = addNodeFromParentNode(xmlDoc, dbtrIdOrgId, 'Othr');
        addTextNodeFromParentNode(xmlDoc, dbtrIdOrgIdOthr, 'Id', 'O00');      
        var dbtrIdOrgIdOthrSchmeNm = addNodeFromParentNode(xmlDoc, dbtrIdOrgIdOthr, 'SchmeNm');
        addTextNodeFromParentNode(xmlDoc, dbtrIdOrgIdOthrSchmeNm, 'Prtry', 'PSET');      
      }
  
    
			
			var dbtrAcct = addNodeFromParentNode(xmlDoc, pmtInf, 'DbtrAcct');
			var idDbtrAcct = addNodeFromParentNode(xmlDoc, dbtrAcct, 'Id');

			var otherDbtrAcct = addNodeFromParentNode(xmlDoc, idDbtrAcct, 'Othr');

			if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_origin_acc')))  {
        if (paymentMethod=='DAC') {
          addTextNodeFromParentNode(xmlDoc, otherDbtrAcct, 'Id', 'CNACH' + objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_origin_acc'));
        } else {
          addTextNodeFromParentNode(xmlDoc, otherDbtrAcct, 'Id', objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_origin_acc'));
        }
      }
        
        

      if (paymentMethod=='MTS') {
        addTextNodeFromParentNode(xmlDoc, dbtrAcct, 'Ccy', ccy || 'CNY');
      }
			
      var dbtrAgt = addNodeFromParentNode(xmlDoc, pmtInf, 'DbtrAgt');
      if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id'))) {
        var finlstnId = addNodeFromParentNode(xmlDoc, dbtrAgt, 'FinInstnId');
        addTextNodeFromParentNode(xmlDoc, finlstnId, 'BIC', objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id'));
        addTextNodeFromParentNode(xmlDoc, finlstnId, 'Nm', 'HSBC');

        var dbtrAgtPstlAdr = addNodeFromParentNode(xmlDoc, finlstnId, 'PstlAdr');
        addTextNodeFromParentNode(xmlDoc, dbtrAgtPstlAdr, 'Ctry', countryCodeMapping[objVDCRecResults[0].getValue('custrecord_ica_orig_bank_country_code')] || 'CN');  //Change this      
      }

      if (paymentMethod=='DAC') {
        // addTextNodeFromParentNode(xmlDoc, pmtInf, 'ChrgBr', 'DEBT');
      }
      

      
			

			// ***END*** B. PAYMENT INFORMATION SECTION

			// dLog('creatBOAXMLDoc', 'Bill Payment Method = ' + paymentMethod);

      //Add something here for ExpenseReport

      dAudit('arrExpenseReports',JSON.stringify(arrExpenseReports));
      var expenseReports = _.groupBy(arrExpenseReports, "emp");
			var payformat = '';
      dAudit('expenseReports', JSON.stringify(expenseReports));
      for (er in expenseReports) {
        var payeeId = er;
        dLog('createHSBC_CHINA_XMLDoc', JSON.stringify(expenseReports[er]));
        dLog('createHSBC_CHINA_XMLDoc.payeeId', payeeId);
        var objVendor = _.find(arrEmployees, { internalid: String(payeeId) });
        dLog('createHSBC_CHINA_XMLDoc.objVendor', JSON.stringify(objVendor));
				if (isEmpty(objVendor)) continue;
				if (payformat == '') payformat = objVendor.payformat;

				var pmtMethod = objVendor.paymentmethod;
				if (paymentMethod != pmtMethod) continue;

				dLog('createHSBC_CHINA_XMLDoc', 'Vendor Payment Method = ' + pmtMethod);

				var arrBills = expenseReports[er];
				var tmpAmt = 0;

        var numberOfBills = _.size(arrBills);
        for (by in arrBills) {
					var billId = arrBills[by].internalid;

					var netAmt = 0;
					var origAmt = getFloatVal(arrBillAmtOrig[billId]);
					var amt = getFloatVal(arrBillAmt[billId]); //this is the payment amount
					var discAmt = !isEmpty(arrBillDiscAmt[billId]) ? getFloatVal(arrBillDiscAmt[billId]) : 0;
					netAmt = amt;
					tmpAmt += netAmt;

					if (discAmt > 0) {
						netAmt -= discAmt;
						tmpAmt -= discAmt;
					}          
				}

        dLog('createHSBC_CHINA_XMLDoc.expenseReports', 'Adding xml details=' + payeeId);
				// ***START*** C. CREDIT TRANSFER TRANSACTION INFORMATION
				// SECTION

				var cdtTrfTxInf = addNodeFromParentNode(xmlDoc, pmtInf, 'CdtTrfTxInf');
				var pmtIdCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtTrfTxInf, 'PmtId');

        // var refnum = arrBillPaymentMap[payeeId];
				// var instrId = '';
				// if (refnum.length > 12) {
				// 	instrId = pz(refnum.substring(refnum.length - 12, refnum.length), 12);
				// } else {
				// 	instrId = pz(refnum, 12);
				// }
        var instrId = String(arrBillPaymentMap[payeeId]);				
        var endToEndId = String(arrBillPaymentMap[payeeId]);				
        if (paymentMethod=='DAC') {
          instrId = instrId.substring(instrId.length - 16);            
          endToEndId = endToEndId.substring(endToEndId.length - 16);  
          addTextNodeFromParentNode(xmlDoc, pmtIdCdtTrfTxInf, 'InstrId', instrId);
          addTextNodeFromParentNode(xmlDoc, pmtIdCdtTrfTxInf, 'EndToEndId', endToEndId);  
        } else if (paymentMethod=='MTS') {
          instrId = instrId.substring(instrId.length - 16);            
          endToEndId = endToEndId.substring(endToEndId.length - 16);  
          addTextNodeFromParentNode(xmlDoc, pmtIdCdtTrfTxInf, 'InstrId', instrId);
          addTextNodeFromParentNode(xmlDoc, pmtIdCdtTrfTxInf, 'EndToEndId', endToEndId);  
        }


				var amtCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtTrfTxInf, 'Amt');
				var amtCdtTrfTxInfInstdAmt = addTextNodeFromParentNode(xmlDoc, amtCdtTrfTxInf, 'InstdAmt', tmpAmt.toFixed(2));
        var curr = arrCurrMap[objBillsData[billId].currency] || ccy;
				setAttributeValue(amtCdtTrfTxInfInstdAmt, 'Ccy', curr);

        //Add ChrgBr
        addTextNodeFromParentNode(xmlDoc, cdtTrfTxInf, 'ChrgBr', 'DEBT');


				var cdtrAgtCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtTrfTxInf, 'CdtrAgt');
        var finInstnIdCdtrAgtCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtrAgtCdtTrfTxInf, 'FinInstnId');
        dLog('paymentMethod.HSBCChina', paymentMethod);
        if (paymentMethod=='MTS') {
          // addTextNodeFromParentNode(xmlDoc, finInstnIdCdtrAgtCdtTrfTxInf, 'BIC', objVendor.recbankprimid || 'DBSSSGSGXXX');
          addTextNodeFromParentNode(xmlDoc, finInstnIdCdtrAgtCdtTrfTxInf, 'Nm', objVendor.recbankprimid || 'DBS_BANK'); //objVendor.vbankname
        }
        else if (paymentMethod=='DAC') {
          // addTextNodeFromParentNode(xmlDoc, finInstnIdCdtrAgtCdtTrfTxInf, 'MmbId', objVendor.recbankprimid || '');
          addTextNodeFromParentNode(xmlDoc, finInstnIdCdtrAgtCdtTrfTxInf, 'Nm', objVendor.vbankname);
          
        }
        
        
				// var clrSysmmbIdFinInstnIdCdtrAgtCdtTrfTxInf = addNodeFromParentNode(xmlDoc, finInstnIdCdtrAgtCdtTrfTxInf, 'ClrSysMmbId');
				// if (!isEmpty(objVendor.recbankprimid)) addTextNodeFromParentNode(xmlDoc, clrSysmmbIdFinInstnIdCdtrAgtCdtTrfTxInf, 'MmbId', objVendor.recbankprimid);
        // if (!isEmpty(objVendor.vbankname)) addTextNodeFromParentNode(xmlDoc, finInstnIdCdtrAgtCdtTrfTxInf, 'Nm', objVendor.vbankname);
        var cdtrAgtPstlAdr = addNodeFromParentNode(xmlDoc, finInstnIdCdtrAgtCdtTrfTxInf, 'PstlAdr');
        addTextNodeFromParentNode(xmlDoc, cdtrAgtPstlAdr, 'Ctry', countryCodeMapping[objVendor.vbankcountry] || objVendor.vbankcountry || 'KOR');
        // addTextNodeFromParentNode(xmlDoc, cdtrAgtPstlAdr, 'Ctry', countryCodeMapping[objVendor.vbankcountry] || objVendor.vbankcountry);
        
				var cdtrCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtTrfTxInf, 'Cdtr');

				if (!isEmpty(objVendor.vendorname)) addTextNodeFromParentNode(xmlDoc, cdtrCdtTrfTxInf, 'Nm', objVendor.vendorname);

				var pstlAdrCdtrCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtrCdtTrfTxInf, 'PstlAdr');
				if (!isEmpty(objVendor.vendoraddrs1)) addTextNodeFromParentNode(xmlDoc, pstlAdrCdtrCdtTrfTxInf, 'StrtNm', objVendor.vendoraddrs1);
        if (!isEmpty(objVendor.vendoraddrs2)) addTextNodeFromParentNode(xmlDoc, pstlAdrCdtrCdtTrfTxInf, 'BldgNb', objVendor.vendoraddrs2);
        if (!isEmpty(objVendor.vendorpostal)) addTextNodeFromParentNode(xmlDoc, pstlAdrCdtrCdtTrfTxInf, 'PstCd', objVendor.vendorpostal);
				if (!isEmpty(objVendor.vendorcity)) addTextNodeFromParentNode(xmlDoc, pstlAdrCdtrCdtTrfTxInf, 'TwnNm', objVendor.vendorcity);
        if (!isEmpty(objVendor.vendorstateprovince)) addTextNodeFromParentNode(xmlDoc, pstlAdrCdtrCdtTrfTxInf, 'CtrySubDvsn', objVendor.vendorstateprovince);
        if (!isEmpty(objVendor.vendorcountrycode)) addTextNodeFromParentNode(xmlDoc, pstlAdrCdtrCdtTrfTxInf, 'Ctry', countryCodeMapping[objVendor.vendorcountrycode]);
				
				var cdtrAcct = addNodeFromParentNode(xmlDoc, cdtTrfTxInf, 'CdtrAcct');

				if (!isEmpty(objVendor.recpartyaccount)) {
					var idCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtrAcct, 'Id');
					var othrIdCdtTrfTxInf = addNodeFromParentNode(xmlDoc, idCdtTrfTxInf, 'Othr');
					addTextNodeFromParentNode(xmlDoc, othrIdCdtTrfTxInf, 'Id', objVendor.recpartyaccount);
				}

        // var purp = addNodeFromParentNode(xmlDoc, cdtTrfTxInf, 'Purp');
        // addTextNodeFromParentNode(xmlDoc, purp, 'Cd', 'SUPP');

				var rmtInfCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtTrfTxInf, 'RmtInf');

				tmpAmt = 0; // need to initialize back to 0

				for (y in arrBills) {
					var billId = arrBills[y].internalid;
          dLog('createHSBC_CHINA_XMLDoc.billId', JSON.stringify(billId));
					dLog('createHSBC_CHINA_XMLDoc', 'billId = ' + billId);

					var netAmt = 0;
					var origAmt = getFloatVal(arrBillAmtOrig[billId]);
					var amt = getFloatVal(arrBillAmt[billId]);

					var discAmt = !isEmpty(arrBillDiscAmt[billId]) ? getFloatVal(arrBillDiscAmt[billId]) : 0;

					netAmt = amt;
					tmpAmt += netAmt;

					if (discAmt > 0) {
						netAmt -= discAmt;
						tmpAmt -= discAmt;
					}

					dLog('createHSBC_CHINA_XMLDoc', JSON.stringify(objBillsData[billId]));
				}

				// ***END*** C. CREDIT TRANSFER TRANSACTION INFORMATION SECTION

				// END: PmtDetail
				tmpTotalAmt += tmpAmt;

        // var ustrdRmtInfCdtTrfTxInf = addNodeFromParentNode(xmlDoc, rmtInfCdtTrfTxInf, 'Ustrd');
        addTextNodeFromParentNode(xmlDoc, rmtInfCdtTrfTxInf, 'Ustrd', arrBillPaymentMap[payeeId] +',' + tmpTotalAmt);
			}      

			dAudit('arrVendorBills', arrVendorBills);
			var payformat = '';
			for (v in arrVendorBills) {
				var arrPayeeInfo = v.split('X@X');
				var payeeId = arrPayeeInfo[1];

				dLog('createHSBC_CHINA_XMLDoc', 'vb ndex = ' + v);
				       var objVendor = _.find(arrVendors, { internalid: String(payeeId)});
				// var objVendor = _.find(arrVendors, { internalid: String(payeeId), paymentmethod: String(paymentMethod) })[0];
        dAudit('objVendor-new', objVendor);
				if (isEmpty(objVendor)) continue;
				if (payformat == '') payformat = objVendor.payformat;

				var pmtMethod = objVendor.paymentmethod;
				if (paymentMethod != pmtMethod) continue;

				dLog('createHSBC_CHINA_XMLDoc', 'Vendor Payment Method = ' + pmtMethod);

				var arrBills = arrVendorBills[paymentMethod + 'X@X' + payeeId];
				var tmpAmt = 0;

				var numberOfBills = _.size(arrBills);
				for (by in arrBills) {
					var billId = arrBills[by];

					var netAmt = 0;
					var origAmt = getFloatVal(arrBillAmtOrig[billId]);
					var amt = getFloatVal(arrBillAmt[billId]); //this is the payment amount

					// dLog('creatXMLDoc', 'origAmt = ' + origAmt);
					// dLog('creatXMLDoc', 'amt = ' + amt);

					var discAmt = !isEmpty(arrBillDiscAmt[billId]) ? getFloatVal(arrBillDiscAmt[billId]) : 0;

					// tmpAmt += amt;
					netAmt = amt; //origAmt;
					tmpAmt += netAmt;

					if (discAmt > 0) {
						netAmt -= discAmt;
						tmpAmt -= discAmt;
					}

          
					if (!isEmpty(arrBillCredits[billId])) {
            dLog('arrBillCredits[billId]', JSON.stringify(arrBillCredits[billId]));
						var arrBC = arrBillCredits[billId];

						for (bc in arrBC) {
							var billCreditAmtP = getFloatVal(arrBC[bc].bcamt);
							var billCreditAmt = billCreditAmtP * -1;

							netAmt = netAmt - billCreditAmtP;
						}
					}
					// }
				}

				// ***START*** C. CREDIT TRANSFER TRANSACTION INFORMATION
				// SECTION

				var cdtTrfTxInf = addNodeFromParentNode(xmlDoc, pmtInf, 'CdtTrfTxInf');
				var pmtIdCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtTrfTxInf, 'PmtId');

        var instrId = String(arrBillPaymentMap[payeeId]);				
        var endToEndId = String(arrBillPaymentMap[payeeId]);				
        if (paymentMethod=='DAC') {
          instrId = instrId.substring(instrId.length - 16);            
          endToEndId = endToEndId.substring(endToEndId.length - 16);  
          addTextNodeFromParentNode(xmlDoc, pmtIdCdtTrfTxInf, 'InstrId', instrId);
          addTextNodeFromParentNode(xmlDoc, pmtIdCdtTrfTxInf, 'EndToEndId', endToEndId);  
        } else if (paymentMethod=='MTS') {
          instrId = instrId.substring(instrId.length - 16);            
          endToEndId = endToEndId.substring(endToEndId.length - 16);  
          addTextNodeFromParentNode(xmlDoc, pmtIdCdtTrfTxInf, 'InstrId', instrId);
          addTextNodeFromParentNode(xmlDoc, pmtIdCdtTrfTxInf, 'EndToEndId', endToEndId);  
        }


        // var refnum = arrBillPaymentMap[payeeId];
				// var instrId = '';
				// if (refnum.length > 12) {
				// 	instrId = pz(refnum.substring(refnum.length - 12, refnum.length), 12);
				// } else {
				// 	instrId = pz(refnum, 12);
				// }
        // // addTextNodeFromParentNode(xmlDoc, pmtIdCdtTrfTxInf, 'InstrId', instrId); //objAcctMapping[0].getValue('custrecord_ica_account_number')); //arrBillPaymentMap[payeeId]
				// addTextNodeFromParentNode(xmlDoc, pmtIdCdtTrfTxInf, 'EndToEndId', instrId); //arrBillPaymentMap[payeeId]

				var amtCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtTrfTxInf, 'Amt');
				var amtCdtTrfTxInfInstdAmt = addTextNodeFromParentNode(xmlDoc, amtCdtTrfTxInf, 'InstdAmt', tmpAmt.toFixed(2));
        var curr = arrCurrMap[objBillsData[billId].currency] || ccy;
				setAttributeValue(amtCdtTrfTxInfInstdAmt, 'Ccy', curr);

        addTextNodeFromParentNode(xmlDoc, cdtTrfTxInf, 'ChrgBr', 'DEBT');

				var cdtrAgtCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtTrfTxInf, 'CdtrAgt');

        var finInstnIdCdtrAgtCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtrAgtCdtTrfTxInf, 'FinInstnId');
        if (paymentMethod=='MTS') {
          addTextNodeFromParentNode(xmlDoc, finInstnIdCdtrAgtCdtTrfTxInf, 'Nm', objVendor.recbankprimid || 'DBSSSGSGXXX');
        }
        else if (paymentMethod=='DAC') {
          // addTextNodeFromParentNode(xmlDoc, finInstnIdCdtrAgtCdtTrfTxInf, 'MmbId', objVendor.recbankprimid || '');          
          addTextNodeFromParentNode(xmlDoc, finInstnIdCdtrAgtCdtTrfTxInf, 'Nm', objVendor.vbankname || 'China Bank');
        }

        // if (paymentMethod=='MTS') { //Remove for DAC
        //   addTextNodeFromParentNode(xmlDoc, finInstnIdCdtrAgtCdtTrfTxInf, 'Nm', objVendor.vbankname || 'DBS_BANK');
        // }
        
				
				// var clrSysmmbIdFinInstnIdCdtrAgtCdtTrfTxInf = addNodeFromParentNode(xmlDoc, finInstnIdCdtrAgtCdtTrfTxInf, 'ClrSysMmbId'); //finInstnIdCdtrAgtCdtTrfTxInf

				// if (!isEmpty(objVendor.recbankprimid)) addTextNodeFromParentNode(xmlDoc, clrSysmmbIdFinInstnIdCdtrAgtCdtTrfTxInf, 'MmbId', objVendor.recbankprimid);
        // if (!isEmpty(objVendor.vbankname)) addTextNodeFromParentNode(xmlDoc, finInstnIdCdtrAgtCdtTrfTxInf, 'Nm', objVendor.vbankname); //cdtrAgtCdtTrfTxInf

        var cdtrAgtPstlAdr = addNodeFromParentNode(xmlDoc, finInstnIdCdtrAgtCdtTrfTxInf, 'PstlAdr'); // cdtrAgtCdtTrfTxInf
        addTextNodeFromParentNode(xmlDoc, cdtrAgtPstlAdr, 'Ctry', countryCodeMapping[objVendor.vbankcountry] || 'CN');
        
        


				var cdtrCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtTrfTxInf, 'Cdtr');

				if (!isEmpty(objVendor.vendorname)) addTextNodeFromParentNode(xmlDoc, cdtrCdtTrfTxInf, 'Nm', objVendor.vendorname);

				var pstlAdrCdtrCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtrCdtTrfTxInf, 'PstlAdr');
        if (paymentMethod=='MTS') {
          if (!isEmpty(objVendor.vendoraddrs1)) addTextNodeFromParentNode(xmlDoc, pstlAdrCdtrCdtTrfTxInf, 'StrtNm', objVendor.vendoraddrs1);
          if (!isEmpty(objVendor.vendoraddrs2)) addTextNodeFromParentNode(xmlDoc, pstlAdrCdtrCdtTrfTxInf, 'BldgNb', objVendor.vendoraddrs2);
          if (!isEmpty(objVendor.vendorpostal)) addTextNodeFromParentNode(xmlDoc, pstlAdrCdtrCdtTrfTxInf, 'PstCd', objVendor.vendorpostal);
          if (!isEmpty(objVendor.vendorcity)) addTextNodeFromParentNode(xmlDoc, pstlAdrCdtrCdtTrfTxInf, 'TwnNm', objVendor.vendorcity);
          if (!isEmpty(objVendor.vendorstateprovince)) addTextNodeFromParentNode(xmlDoc, pstlAdrCdtrCdtTrfTxInf, 'CtrySubDvsn', objVendor.vendorstateprovince);            
        }
        if (!isEmpty(objVendor.vendorcountrycode)) addTextNodeFromParentNode(xmlDoc, pstlAdrCdtrCdtTrfTxInf, 'Ctry', countryCodeMapping[objVendor.vendorcountrycode]);

        if (paymentMethod=='DAC') {
          var dbtrId = addNodeFromParentNode(xmlDoc, cdtrCdtTrfTxInf, 'Id');
          var dbtrIdOrgId = addNodeFromParentNode(xmlDoc, dbtrId, 'OrgId');
          var dbtrIdOrgIdOthr = addNodeFromParentNode(xmlDoc, dbtrIdOrgId, 'Othr');
          addTextNodeFromParentNode(xmlDoc, dbtrIdOrgIdOthr, 'Id', objAcctMapping[0].getValue('custrecord_acct_map_dom_ach_co_id'));      
        }
  
				
				var cdtrAcct = addNodeFromParentNode(xmlDoc, cdtTrfTxInf, 'CdtrAcct');

				if (!isEmpty(objVendor.recpartyaccount)) {
					var idCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtrAcct, 'Id');
					var othrIdCdtTrfTxInf = addNodeFromParentNode(xmlDoc, idCdtTrfTxInf, 'Othr');

					addTextNodeFromParentNode(xmlDoc, othrIdCdtTrfTxInf, 'Id', objVendor.recpartyaccount);
				}
        if (paymentMethod=='DAC' && (!isEmpty(objVendor.custentity_ica_vendor_bank_instructions))) {
          var purp = addNodeFromParentNode(xmlDoc, cdtTrfTxInf, 'Purp');
          addTextNodeFromParentNode(xmlDoc, purp,'Cd', objVendor.custentity_ica_vendor_bank_instructions);            
        }


				var rmtInfCdtTrfTxInf = addNodeFromParentNode(xmlDoc, cdtTrfTxInf, 'RmtInf');

				tmpAmt = 0; // need to initialize back to 0

				for (y in arrBills) {
					var billId = arrBills[y];
					dLog('createHSBC_CHINA_XMLDoc', 'billId = ' + billId);

					var netAmt = 0;
					var origAmt = getFloatVal(arrBillAmtOrig[billId]);
					var amt = getFloatVal(arrBillAmt[billId]);

					// dLog('creatXMLDoc', 'origAmt = ' + origAmt);
					// dLog('creatXMLDoc', 'amt = ' + amt);

					var discAmt = !isEmpty(arrBillDiscAmt[billId]) ? getFloatVal(arrBillDiscAmt[billId]) : 0;

					if (!isEmpty(arrBillCredits[billId])) {
						var arrBC = arrBillCredits[billId];
						for (bc in arrBC) {
							var billCreditAmtP = getFloatVal(arrBC[bc].bcamt);
							var billCreditAmt = billCreditAmtP * -1;

							tmpAmt = tmpAmt - billCreditAmtP;
							netAmt = netAmt - billCreditAmtP;
						}
					}

					// tmpAmt += amt;
					netAmt = amt; //origAmt;
					tmpAmt += netAmt;

					if (discAmt > 0) {
						netAmt -= discAmt;
						tmpAmt -= discAmt;
					}

					dLog('createHSBC_CHINA_XMLDoc', JSON.stringify(objBillsData[billId]));

					if (!isEmpty(arrBillCredits[billId])) {
						var arrBC = arrBillCredits[billId];

						for (bc in arrBC) {
							var billCreditAmtP = getFloatVal(arrBC[bc].bcamt);
							var billCreditAmt = billCreditAmtP;

							tmpAmt = tmpAmt - billCreditAmtP;
							netAmt = netAmt - billCreditAmtP;

							var bcNum = arrBC[bc].bcnum;
						}
					}

				}

				// ***END*** C. CREDIT TRANSFER TRANSACTION INFORMATION SECTION

				// END: PmtDetail
				tmpTotalAmt += tmpAmt;

        addTextNodeFromParentNode(xmlDoc, rmtInfCdtTrfTxInf, 'Ustrd', arrBillPaymentMap[payeeId] +',' + tmpTotalAmt);

			}
		}



    dLog('createHSBC_CHINA_XMLDoc', 'tmpTotalAmt = ' + tmpTotalAmt);
		dLog('createHSBC_CHINA_XMLDoc', '>>> END <<<');

		return xmlDoc;
	} catch (e) {
		var stErrMsg = '';
		if (e.getDetails != undefined) {
			stErrMsg = 'Script Error: ' + e.getCode() + '<br>' + e.getDetails() + '<br>' + e.getStackTrace();
		} else {
			stErrMsg = 'Script Error: ' + e.toString();
		}

		dLog('createHSBC_CHINA_XMLDoc Script Error', stErrMsg);
	}
}



function createCAP_ISO_XMLDoc(objAcctMapping) {
	var arrTempBillIds = [];
	var arrBillCRIds = [];
	var arrBillAmt = [];
	var arrBillAmtOrig = [];
	var arrBillDiscAmt = [];
	var arrBillPayInfoCtr = [];
	var arrBillPayInfoSum = [];
	var arrGrpHdrNbOfTxs = [];
	var arrPmtInfNbOfTxs = [];
	var arrBillIds = [];
	var grpHdrNbOfTxs = 0;
	var grpHdrCtrlSum = 0;
	var arrPayeeIds = [];
	var _currencies = getCurrencies();
  var dpf = nlapiGetContext().getPreference('DATEFORMAT');
  if (dpf=='DD-Mon-YYYY') dpf = 'DD-MMM-YYYY';
  else if (dpf=='D-MONTH-YYYY') dpf = 'DD-MMMM-YYYY';
  else if (dpf=='D-Month-YYYY') dpf = 'DD-MMMM-YYYY';


	for (x in arrBillsProcessed) {
		var billId = arrBillsProcessed[x].id;
		var billPaymentId = arrBillsProcessed[x].payment;

		dLog('createCAP_ISO_XMLDoc', 'Bill info = ' + JSON.stringify(arrBillsProcessed[x]));
		if (!isEmpty(billPaymentId) && billPaymentId != 'XXXNONEXXX' && billPaymentId != 'CREDIT') {
			if (billPaymentId != 'CREDIT') arrTempBillIds.push(billId);

			var payMethod = arrBillsProcessed[x].paymethod;
			var paymentId = arrBillsProcessed[x].payment;
			var payeeId = arrBillsProcessed[x].payeeid;

			arrBillAmtOrig[billId] = arrBillsProcessed[x].origamt;
			arrBillAmt[billId] = arrBillsProcessed[x].payamt;
			arrBillDiscAmt[billId] = arrBillsProcessed[x].discamt;

			var ndx = payMethod + '@@' + paymentId;

			if (arrBillPayInfoCtr[payMethod] == null) arrBillPayInfoCtr[payMethod] = 0;
			if (arrBillPayInfoSum[payMethod] == null) arrBillPayInfoSum[payMethod] = 0;
			if (arrPmtInfNbOfTxs[ndx] == null) arrPmtInfNbOfTxs[ndx] = 0;

			if (paymentId && arrGrpHdrNbOfTxs[paymentId] == null) grpHdrNbOfTxs++;

			arrPmtInfNbOfTxs[ndx]++;
			arrBillPayInfoCtr[payMethod]++;
			arrBillPayInfoSum[payMethod] += getFloatVal(arrBillsProcessed[x].payamt);
			arrGrpHdrNbOfTxs[paymentId] = paymentId;
		}
		grpHdrCtrlSum += getFloatVal(arrBillsProcessed[x].payamt);
		if (billPaymentId == 'CREDIT') arrBillCRIds.push(billId);
	}

	var arrBillIds = [];
	var arrBillIds2 = [];
	var arrBillIds3 = [];
	var arrBillIds4 = [];
	var arrBillIds5 = [];

	for (vx in arrTempBillIds) {
		var isBC = false;
		for (var x in arrBillCRIds) {
			if (arrTempBillIds[vx] == arrBillCRIds[x]) {
				isBC = true;
				break;
			}
		}
		if (!isBC) {
			arrBillIds.push(arrTempBillIds[vx]);
			arrBillIds2.push(arrTempBillIds[vx]);
			arrBillIds3.push(arrTempBillIds[vx]);
			arrBillIds4.push(arrTempBillIds[vx]);
			arrBillIds5.push(arrTempBillIds[vx]);
		}
	}

	var arrBillCredits = getBillCredit(arrBillIds);
	var objBillsData = getBillData(arrBillIds2);
	var arrBillPO = getPOMap(arrBillIds3);
	var arrVendorBills = getPayeeBillsByPayMethod(arrBillIds4);
	var arrVendorBillsCurr = getPayeeBillsCurrency(arrBillIds5);
	var nsAcctSub = !isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('subsidiary', 'CUSTRECORD_ACCT_MAP_NETSUITE_ACCOUNT')) ? objAcctMapping[0].getValue('subsidiary', 'CUSTRECORD_ACCT_MAP_NETSUITE_ACCOUNT') : '';
	var objVDCRecResults = getVendorDAC_CCRPaymentRec(nsAcctSub);
	dLog('objVDCRecResults', JSON.stringify(objVDCRecResults));
	dLog('objAcctMapping', JSON.stringify(objAcctMapping));

	//Gather data.
	var objects = {
		MsgId: 'TBD',
		CreDtTm: 'Test',
		Authstn: {
			Cd: '',
		},
		NbOfTxs: '2',
		CtrlSum: '2000',
		InitgPty: {
			Id: {
				OrgId: {
					Othr: {
						Id: '',
					},
				},
			},
		},
		PmtInfId: 'PmtInfId',
		PmtMtd: 'PmtMtd',
		PmtTpInf: {
			SvcLvl: {
				Cd: 'This is CD',
			},
		},
		ReqdExctnDt: 'ReqdExctnDt',
		Dbtr: {
			Nm: 'This is Nm',
			PstlAdr: {
				StrtNm: '',
				BldgNb: '',
				PstCd: '',
				TwnNm: '',
				CtrySubDvsn: '',
				Ctry: '',
			},
			Id: {
				Othr: {
					Id: 'Dbtr.Id.Othr.Id',
				},
			},
		},
		DbtrAcct: {
			Id: {
				Othr: {
					Id: 'DbtrAcct.Id.Othr.Id',
				},
			},
			PstlAdr: {
				StrtNm: '',
				BldgNb: '',
				PstCd: '',
				TwnNm: '',
				CtrySubDvsn: '',
				Ctry: '',
			},
		},
		DbtrAgt: {
			FinInstnId: {
				BIC: 'BIC',
				PstlAdr: {
					StrtNm: '',
					BldgNb: '',
					PstCd: '',
					TwnNm: '',
					CtrySubDvsn: '',
					Ctry: '',
				},
			},
		},
		CdtTrfTxInf: CdtTrfTxInf,
	};

	var PmtInf = [];

	for (x in arrVendorBills) {
		var payeeId = x.split('X@X')[1];
		arrPayeeIds.push(payeeId);
	}

	var arrVendors = getEntityData(arrPayeeIds);

	var today = new Date();
	var bpmdate = BPM_DATE;
	var d = nlapiStringToDate(bpmdate, 'datetime');

	var fileCtrlNumber = moment(today).format('MMDDhhmmss');
	objects.MsgId = pad(fileCtrlNumber, 4);
	objects.CreDtTm = moment(d).format('YYYY-MM-DDThh:mm:ss') || today.format('{yyyy}-{MM}-{dd}T{hh}:{mm}:{ss}');
	objects.Authstn.Cd = 'AUTH';

	if (objects.CtrlSum == '0.00') {
		dLog('CtrlSum is 0.00, this should not happen. Returning empty file', objects.CtrlSum);
		return '';
	}

	if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_dom_ach_co_id'))) {
		objects.InitgPty.Id.OrgId.Othr.Id = objAcctMapping[0].getValue('custrecord_acct_map_dom_ach_co_id'); //Previously CEO ID
	}

	var totalNbOfTxs = 0;
	var totalCtrlSum = 0;

	dLog('CAP ISO: arrBillPayInfoCtr', JSON.stringify(arrBillPayInfoCtr));
	for (x in arrBillPayInfoCtr) {
		var CdtTrfTxInf = [];

		if (SINGLEBILLPYMTS == 'T') {
			dAudit('createCAP_ISO_XMLDoc: Create Single Bill Payments here.', JSON.stringify(arrBillsProcessed));
			var PmtInfObj = {};

			PmtInfObj.PmtInfId = fileCtrlNumber;
			var paymentMethod = x;
			PmtInfObj.PmtMtd = 'TRF';

			// objects.PmtTpInf.SvcLvl.Cd = (paymentMethod == 'DAC') ? 'NURG' : 'URGP';
			PmtInfObj.PmtTpInf = {};
			PmtInfObj.PmtTpInf.SvcLvl = {};
			PmtInfObj.PmtTpInf.SvcLvl.Prtry = paymentMethod == 'DAC' ? 'NORM' : 'URGP';
			PmtInfObj.ReqdExctnDt = moment(d).format('YYYY-MM-DD') || today.format('{yyyy}-{MM}-{dd}');

			if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_companyname'))) {
				PmtInfObj.Dbtr = {};
				PmtInfObj.Dbtr.Nm = objVDCRecResults[0].getValue('custrecord_companyname');
			}

			//PstlAdr
			var country = !isEmpty(objVDCRecResults) ? objVDCRecResults[0].getValue('custrecord_compcountrycode') : '';

			if (
				(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_comppostcode'))) ||
				(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compcity'))) ||
				(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compstateprov'))) ||
				(!isEmpty(objVDCRecResults) && objVDCRecResults[0].getValue('custrecord_compcountrycode')) ||
				(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compadd1')))
			) {
				PmtInfObj.Dbtr = {};
				PmtInfObj.Dbtr.PstlAdr = {};
				if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compadd1'))) {
					PmtInfObj.Dbtr.PstlAdr.StrtNm = '<AdrLine>' + objVDCRecResults[0].getValue('custrecord_compadd1') + '</AdrLine>';
				}
				if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compadd2'))) {
					PmtInfObj.Dbtr.PstlAdr.BldgNb = '<BldgNb>' + objVDCRecResults[0].getValue('custrecord_compadd2') + '</BldgNb>';
				}

				if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_comppostcode'))) {
					PmtInfObj.Dbtr.PstlAdr.PstCd = '<PstCd>' + objVDCRecResults[0].getValue('custrecord_comppostcode') + '</PstCd>';
				}
				// addTextNodeFromParentNode(xmlDoc, pstlAdr, 'PstCd', objVDCRecResults[0].getValue('custrecord_comppostcode'));

				if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compcity'))) {
					PmtInfObj.Dbtr.PstlAdr.TwnNm = '<TwnNm>' + objVDCRecResults[0].getValue('custrecord_compcity') + '</TwnNm>';
				}
				// addTextNodeFromParentNode(xmlDoc, pstlAdr, 'TwnNm', objVDCRecResults[0].getValue('custrecord_compcity'));

				//Where do we get CtrySubDvsn?
				if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compstateprov'))) {
					PmtInfObj.Dbtr.PstlAdr.TwnNm = '<CtrySubDvsn>' + objVDCRecResults[0].getValue('custrecord_compstateprov') + '</CtrySubDvsn>';
				}

				// addTextNodeFromParentNode(xmlDoc, pstlAdr, 'Ctry', country);
				if (country) {
					PmtInfObj.Dbtr.PstlAdr.Ctry = '<Ctry>' + country + '</Ctry>';
				}
			}

			PmtInfObj.Dbtr.Id = {};
			PmtInfObj.Dbtr.Id.Othr = {};
			// if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_dom_ach_co_id'))) {
			// 	PmtInfObj.Dbtr.OrgId.Id.Othr.Id = objAcctMapping[0].getValue('custrecord_acct_map_dom_ach_co_id'); //ACH Company ID
			// }

      // RSF
      if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ceo_company_id'))) {
        PmtInfObj.Dbtr.Id.OrgId.Othr.Id = objAcctMapping[0].getValue('custrecord_acct_map_ceo_company_id');
      }


			//DbtrAcct
			PmtInfObj.DbtrAcct = {};
			PmtInfObj.DbtrAcct.Id = {};
			PmtInfObj.DbtrAcct.Id.Othr = {};
			if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_origin_acc'))) {
				PmtInfObj.DbtrAcct.Id.Othr.Id = objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_origin_acc'); // Bank Account Number

				var symbol = '';
				try {
					symbol = _.find(_currencies, { internalid: String(objAcctMapping[0].getValue('custrecord_acct_map_account_currency')) }).symbol;
					PmtInfObj.DbtrAcct.Ccy = symbol; //objAcctMapping[0].getValue('custrecord_acct_map_account_currency') || ''; // Bank Currency
					dAudit('DbtrAcct.Ccy-Currency', objAcctMapping[0].getValue('custrecord_acct_map_account_currency'));
					dAudit('DbtrAcct.Ccy', JSON.stringify(_currencies));
				} catch (e) {}
			}

			//DbtrAgt
			if ((!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id'))) || !isEmpty(country)) {
				if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id'))) {
					// objects.DbtrAgt.FinInstnId.BIC = objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id');

					PmtInfObj.DbtrAgt = {};
					PmtInfObj.DbtrAgt.Nm = objVDCRecResults[0].getValue('custrecord_bankname') || '';
					PmtInfObj.DbtrAgt.FinInstnId = {};
					PmtInfObj.DbtrAgt.FinInstnId.ClrSysMmbId = {};
					PmtInfObj.DbtrAgt.FinInstnId.ClrSysMmbId.MmbId = objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id'); // Routing Number 10 Digit
				}
				PmtInfObj.DbtrAgt.FinInstnId.PstlAdr = {};
				PmtInfObj.DbtrAgt.FinInstnId.PstlAdr.Ctry = 'CA';
			}

			for (var i = 0; i < arrBillsProcessed.length; i++) {
				var billPayment = arrBillsProcessed[i];

				if (billPayment.payment == 'CREDIT') {
					continue;
				}

				var symbol = '';

				try {
					symbol = _.find(_currencies, { internalid: String(billPayment.currid) }).symbol || 'USD';
				} catch (e) {}

				var objVendor = arrVendors[billPayment.payeeid];
				if (!objVendor) objVendor = _.find(arrVendors, { internalid: String(billPayment.payeeid) });

				dLog('objVendor', JSON.stringify(objVendor));

				var cdtTrfTxInfObj = {};
				cdtTrfTxInfObj.PmtId = {};

				var refnum = billPayment.refnum; //arrBillPaymentMap[billPayment.payeeid];
				// var refnum = billPayment.billnum; //arrBillPaymentMap[billPayment.payeeid];
				var instrId = '';
				if (refnum.length > 12) {
					instrId = pz(refnum.substring(refnum.length - 12, refnum.length), 12);
				} else {
					instrId = pz(refnum, 12);
				}
				refnum = billPayment.billnum; //Overwrite endToendID
				var endToEndId = refnum;
				if (refnum.length > 18) {
					endToEndId = refnum.substr(0, 18);
				}

				endToEndId = moment(d).format('YYYY-MM-DDThh:mm:ss');

				cdtTrfTxInfObj.PmtId.InstrId = instrId;
				cdtTrfTxInfObj.PmtId.EndToEndId = endToEndId;
				cdtTrfTxInfObj.Amt = {};
				cdtTrfTxInfObj.Amt.value = billPayment.payamt; //amt.toFixed(2);
				cdtTrfTxInfObj.Amt.Ccy = symbol;
				cdtTrfTxInfObj.ChrgBr = billPayment.paymethod == 'MTS' ? 'CRED' : '';

				cdtTrfTxInfObj.CdtrAgt = {};
				cdtTrfTxInfObj.CdtrAgt.FinInstnId = {};
				// cdtTrfTxInfObj.CdtrAgt.FinInstnId.BIC = objVendor.recbankprimid;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.ClrSysMmbId = {};
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.ClrSysMmbId.MmbId = objVendor.recbankprimid; //objVendor.bankid; // Receiving Bank Routing
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.Nm = objVendor.vbankname;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr = {};
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.Ctry = countryCodeMapping[objVendor.vbankcountry];
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.AdrLine = objVendor.vbankaddrs1;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.StrtNm = objVendor.vbankaddrs1;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.BldgNb = '';
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.PstCd = objVendor.vbankzip;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.TwnNm = objVendor.vbankcity;
				cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.CtrySubDvsn = objVendor.vbankstate;

				if (billPayment.paymethod == 'MTS') {
					cdtTrfTxInfObj.CdtrAgt.InstrForCdtrAgt = {};
					cdtTrfTxInfObj.CdtrAgt.InstrForCdtrAgt.InstrInf = objVendor.custentity_ica_vendor_bank_instructions;
				}

				cdtTrfTxInfObj.Cdtr = {};
				cdtTrfTxInfObj.Cdtr.Nm = objVendor.vendorname;
				cdtTrfTxInfObj.Cdtr.PstlAdr = {};
				cdtTrfTxInfObj.Cdtr.PstlAdr.StrtNm = objVendor.vendoraddrs1;
				cdtTrfTxInfObj.Cdtr.PstlAdr.BldgNb = objVendor.vendoraddrs2 || '';
				cdtTrfTxInfObj.Cdtr.PstlAdr.PstCd = objVendor.vendorpostal;
				cdtTrfTxInfObj.Cdtr.PstlAdr.TwnNm = objVendor.vendorcity;
				cdtTrfTxInfObj.Cdtr.PstlAdr.CtrySubDvsn = objVendor.vendorstateprovince;
				cdtTrfTxInfObj.Cdtr.PstlAdr.Ctry = countryCodeMapping[objVendor.vendorcountrycode];

				cdtTrfTxInfObj.CdtrAcct = {};
				cdtTrfTxInfObj.CdtrAcct.Id = {};
				cdtTrfTxInfObj.CdtrAcct.Id.Othr = {};
				cdtTrfTxInfObj.CdtrAcct.Id.Othr.Id = objVendor.recpartyaccount;

				// cdtTrfTxInfObj.RltdAmtInf = {};
				// cdtTrfTxInfObj.RltdAmtInf.RmtLctnMtd = objVendor.pmp_dac_contactname || "";
				// cdtTrfTxInfObj.RltdAmtInf.RmtLctnElctrncAdr = objVendor.pmp_dac_emailaddress || "";
				cdtTrfTxInfObj.RmtInf = {};
				cdtTrfTxInfObj.RmtInf.Ustrd = refnum;
				cdtTrfTxInfObj.RmtInf.VendorId = objVendor.entityid;
				cdtTrfTxInfObj.RmtInf.Category = objVendor.category;

				cdtTrfTxInfObj.RmtInf.Strd = Strd;

				CdtTrfTxInf.push(cdtTrfTxInfObj);
			}
			PmtInfObj.CdtTrfTxInf = CdtTrfTxInf;
			PmtInf.push(PmtInfObj);
		} else {
			dAudit('createCAP_ISO_XMLDoc: arrVendorBills', arrVendorBills);
			var refnum = '';
			var currency = '';
			var symbol = '';
			try {
				dLog('objAcctMapping', JSON.stringify(objAcctMapping));
				symbol = _.find(_currencies, { internalid: String(objAcctMapping[0].getValue('custrecord_acct_map_account_currency')) }).symbol;
			} catch (e) {
				symbol = 'USD';
			}

			dLog('SYMBOL', symbol);

			var PmtInfObj = {};
			// var fileCtrlNumber = Date.create().format("{yy}{MM}{dd}{mm}{ss}"); //RSF add millisecs
			var fileCtrlNumber = moment(today).format('YYMMDDmmssSS');
			PmtInfObj.PmtInfId = fileCtrlNumber;
			var paymentMethod = x;
			if (paymentMethod == 'CHK') {
				PmtInfObj.PmtMtd = 'CHK';
			} else {
				PmtInfObj.PmtMtd = 'TRF';
			}

			// objects.PmtTpInf.SvcLvl.Cd = (paymentMethod == 'DAC') ? 'NURG' : 'URGP';
			if (paymentMethod == 'DAC' || paymentMethod == 'MTS') {
				PmtInfObj.PmtTpInf = {};
				PmtInfObj.PmtTpInf.SvcLvl = {};

				if (paymentMethod == 'DAC') {
					PmtInfObj.PmtTpInf.SvcLvl.Cd = 'NURG';
				} else if (paymentMethod == 'CHK') {
					PmtInfObj.PmtTpInf.SvcLvl.Prtry = 'PM';
				} else if (paymentMethod == 'MTS') {
					PmtInfObj.PmtTpInf.SvcLvl.Cd = 'URGP';
				}
			}

			PmtInfObj.ReqdExctnDt = moment(d).format('YYYY-MM-DD') || today.format('{yyyy}-{MM}-{dd}');

			dAudit('objVDCRecResults', JSON.stringify(objVDCRecResults));
			if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_companyname'))) {
				PmtInfObj.Dbtr = {};
				PmtInfObj.Dbtr.Nm = objVDCRecResults[0].getValue('custrecord_companyname');
				dLog('Added Nm', objVDCRecResults[0].getValue('custrecord_companyname'));
			}

			//PstlAdr
			var country = !isEmpty(objVDCRecResults) ? objVDCRecResults[0].getValue('custrecord_compcountrycode') : '';

			if (
				(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_comppostcode'))) ||
				(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compcity'))) ||
				(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compstateprov'))) ||
				(!isEmpty(objVDCRecResults) && objVDCRecResults[0].getValue('custrecord_compcountrycode')) ||
				(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compadd1')))
			) {
				PmtInfObj.Dbtr.PstlAdr = {};

				if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compadd1'))) {
					PmtInfObj.Dbtr.PstlAdr.StrtNm = '<StrtNm>' + objVDCRecResults[0].getValue('custrecord_compadd1') + '</StrtNm>';
				}
				if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compadd2'))) {
					PmtInfObj.Dbtr.PstlAdr.BldgNb = '<BldgNb>' + objVDCRecResults[0].getValue('custrecord_compadd2') + '</BldgNb>';
				}

				if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_comppostcode'))) {
					PmtInfObj.Dbtr.PstlAdr.PstCd = '<PstCd>' + objVDCRecResults[0].getValue('custrecord_comppostcode') + '</PstCd>';
				}
				// addTextNodeFromParentNode(xmlDoc, pstlAdr, 'PstCd', objVDCRecResults[0].getValue('custrecord_comppostcode'));

				if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compcity'))) {
					PmtInfObj.Dbtr.PstlAdr.TwnNm = '<TwnNm>' + objVDCRecResults[0].getValue('custrecord_compcity') + '</TwnNm>';
				}
				// addTextNodeFromParentNode(xmlDoc, pstlAdr, 'TwnNm', objVDCRecResults[0].getValue('custrecord_compcity'));

				//Where do we get CtrySubDvsn?
				if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compstateprov'))) {
					PmtInfObj.Dbtr.PstlAdr.CtrySubDvsn = '<CtrySubDvsn>' + objVDCRecResults[0].getValue('custrecord_compstateprov') + '</CtrySubDvsn>';
				}

				// addTextNodeFromParentNode(xmlDoc, pstlAdr, 'Ctry', country);
				if (country) {
					PmtInfObj.Dbtr.PstlAdr.Ctry = '<Ctry>' + country + '</Ctry>';
				}
			}

			if (paymentMethod == 'DAC') {
				PmtInfObj.Dbtr.Id = {};
				PmtInfObj.Dbtr.Id.Othr = {};
				PmtInfObj.Dbtr.Id.OrgId = {};
				PmtInfObj.Dbtr.Id.OrgId.Othr = {};

				if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ceo_company_id'))) {
					PmtInfObj.Dbtr.Id.OrgId.Othr.Id = objAcctMapping[0].getValue('custrecord_acct_map_ceo_company_id');
				}

				if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_bankname'))) {
					PmtInfObj.Dbtr.Id.OrgId.Othr.SchmeNm = {};
					PmtInfObj.Dbtr.Id.OrgId.Othr.SchmeNm.Cd = objVDCRecResults[0].getValue('custrecord_bankname');
				}
			}

			//DbtrAcct
			PmtInfObj.DbtrAcct = {};
			PmtInfObj.DbtrAcct.Id = {};
			PmtInfObj.DbtrAcct.Id.Othr = {};
			if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_origin_acc'))) {
				PmtInfObj.DbtrAcct.Id.Othr.Id = objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_origin_acc'); // Bank Account Number

				try {
					PmtInfObj.DbtrAcct.Ccy = symbol; //objAcctMapping[0].getValue('custrecord_acct_map_account_currency') || ''; // Bank Currency
					dAudit('DbtrAcct.Ccy', objAcctMapping[0].getValue('custrecord_acct_map_account_currency'));
					dAudit('DbtrAcct.Ccy_currencies', JSON.stringify(_currencies));
				} catch (e) {}
			}

			//DbtrAgt
			if ((!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id'))) || !isEmpty(country)) {
				if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id'))) {
					// objects.DbtrAgt.FinInstnId.BIC = objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id');
					dLog('Here BIC', objAcctMapping[0].getValue('custrecord_acct_map_hsbc_swift_bank_id'));
					PmtInfObj.DbtrAgt = {};
					PmtInfObj.DbtrAgt.Nm = objVDCRecResults[0].getValue('custrecord_bankname') || '';
					PmtInfObj.DbtrAgt.FinInstnId = {};
					PmtInfObj.DbtrAgt.FinInstnId.ClrSysMmbId = {};
					PmtInfObj.DbtrAgt.FinInstnId.ClrSysMmbId.MmbId = objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id'); // Routing Number 10 Digit

					if (paymentMethod == 'DAC' || paymentMethod == 'MTS' || paymentMethod == 'CHK') {
						// PmtInfObj.DbtrAgt
						PmtInfObj.DbtrAgt.Bic = objAcctMapping[0].getValue('custrecord_acct_map_hsbc_swift_bank_id');
					}
				}
				var country = !isEmpty(objVDCRecResults) ? objVDCRecResults[0].getValue('custrecord_ica_orig_bank_country_code') : '';
				if (!isEmpty(country)) {
					dLog('Here Country Code', country);
					PmtInfObj.DbtrAgt.FinInstnId.PstlAdr = {};
					PmtInfObj.DbtrAgt.FinInstnId.PstlAdr.Ctry = country;
				}
			}

			var noOfBillPayments = 0;
			var totalAmount = 0;
			for (v in arrVendorBills) {
				var arrPayeeInfo = v.split('X@X');
				var payeeId = arrPayeeInfo[1];

				//var objVendor=arrVendors[payeeId];
        dAudit('arrVendors', arrVendors);				
        var objVendor = _.find(arrVendors, { internalid: String(payeeId)});
				// var objVendor = _.find(arrVendors, { internalid: String(payeeId), paymentmethod: String(paymentMethod) })[0];
        dAudit('objVendor-new', objVendor);				
        dLog('objVendor', JSON.stringify(objVendor));

				if (isEmpty(objVendor)) continue;

				var pmtMethod = objVendor.paymentmethod;

				if (paymentMethod != pmtMethod) continue;
				//JPM ISO
				if (pmtMethod == 'DAC') {
					PmtInfObj.PmtTpInf.LclInstrm = {};
					PmtInfObj.PmtTpInf.LclInstrm.Cd = objVendor.payformat;
				}

				var arrBills = arrVendorBills[paymentMethod + 'X@X' + payeeId];
				dLog('arrBills', JSON.stringify(arrBills));
				var tmpAmt = 0;

				var numberOfBills = _.size(arrBills);
				var billnum = '';
				var billPaymentTranId = '';
				for (by in arrBills) {
					var billId = arrBills[by];
					refnum = _.find(arrBillsProcessed, { id: String(billId) }).refnum;
					currency = _.find(arrBillsProcessed, { id: String(billId) }).currid;
					subtext = _.find(arrBillsProcessed, { id: String(billId) }).subtext;
					billnum = _.find(arrBillsProcessed, { id: String(billId) }).billnum;
					billPaymentTranId = _.find(arrBillsProcessed, { id: String(billId) }).refnum;
					dLog('values', {
            billId: billId,
            refnum: refnum,
            currency: currency,
            subtext: subtext,
            billnum: billnum,
            billPaymentTranId: billPaymentTranId
          });

					try {
						symbol = _.find(_currencies, { internalid: String(currency) }).symbol || 'USD';
					} catch (e) {}
					dLog('billPaymentTranId', billPaymentTranId);

					var netAmt = 0;
					var origAmt = getFloatVal(arrBillAmtOrig[billId]);
					var amt = getFloatVal(arrBillAmt[billId]);

					var discAmt = !isEmpty(arrBillDiscAmt[billId]) ? getFloatVal(arrBillDiscAmt[billId]) : 0;

					dLog(
						'amounts',
						JSON.stringify({
							netAmt: netAmt,
							origAmt: origAmt,
							amt: amt,
							discAmt: discAmt,
						})
					);

					netAmt = origAmt;
					tmpAmt += amt; //used to be netAmt

					if (discAmt > 0) {
						netAmt -= discAmt;
						tmpAmt -= discAmt;
					}

					if (!isEmpty(arrBillCredits[billId])) {
						var arrBC = arrBillCredits[billId];

						dLog('arrBC in arrBills', JSON.stringify(arrBC));

						for (bc in arrBC) {
							var billCreditAmtP = getFloatVal(arrBC[bc].bcamt);
							var billCreditAmt = billCreditAmtP * -1;

							// tmpAmt = (tmpAmt - billCreditAmtP);
							netAmt = netAmt - billCreditAmtP;
						}
					}
				}

				var cdtTrfTxInfObj = {};
				cdtTrfTxInfObj.PmtId = {};

				var refnum = arrBillPaymentMap[payeeId];
				var instrId = '';
				if (refnum.length > 12) {
					instrId = pz(refnum.substring(refnum.length - 12, refnum.length), 12);
				} else {
					instrId = pz(refnum, 12);
				}
				var endToEndId = billnum.substr(0, 18);
				if (numberOfBills > 1) {
					endToEndId = subtext.substr(0, 18);
				}

				var s = String(moment().valueOf());
				s = s.slice(s.length - 6);
				endToEndId = moment(d).format('YYYYMMDD') + s;

				cdtTrfTxInfObj.PmtId.InstrId = instrId;
				cdtTrfTxInfObj.PmtId.EndToEndId = billPaymentTranId;//endToEndId;

				if (paymentMethod == 'CHK') {
					cdtTrfTxInfObj.PmtInfObj = {};
					cdtTrfTxInfObj.PmtInfObj.PmtTpInf = {};
					cdtTrfTxInfObj.PmtInfObj.PmtTpInf.SvcLvl = {};

					if (objVendor.deliverycode == '') {
						cdtTrfTxInfObj.PmtInfObj.PmtTpInf.SvcLvl.Prtry = '00PY1';
					} else {
						cdtTrfTxInfObj.PmtInfObj.PmtTpInf.SvcLvl.Prtry = '00000';
					}
					cdtTrfTxInfObj.ChqInstr = {};
					cdtTrfTxInfObj.ChqInstr.ChqNb = billPaymentTranId;
					if (objVendor.deliverycode) {
						cdtTrfTxInfObj.ChqInstr.DlvryMtd = {};
						cdtTrfTxInfObj.ChqInstr.DlvryMtd.Cd = objVendor.deliverycode;
					}
          cdtTrfTxInfObj.ChqInstr.ChqMtrtyDt = moment(d).format('YYYY-MM-DD'); //Added

          cdtTrfTxInfObj.ChqInstr.MemoFld = objVendor[UNIONBANK_VENDOR_ID] || '';
				}

				if (paymentMethod == 'DAC') {
					cdtTrfTxInfObj.ChrgBr = 'DEBT';
					// cdtTrfTxInfObj.ChrgBr = (paymentMethod == 'MTS') ? 'CRED' : "";
				} else if (paymentMethod == 'MTS') {
					cdtTrfTxInfObj.ChrgBr = 'DEBT';
				}

				if (paymentMethod == 'DAC' || paymentMethod == 'CHK') {
					cdtTrfTxInfObj.ClrSysId = {};
					cdtTrfTxInfObj.ClrSysId.Cd = 'CACPA';
				}

				tmpAmt = 0; // need to initialize back to 0

				var Strd = [];
        var uStrd = [];
				var totalCdtTrfTxInfAmount = 0;
        var transactionCount = 1;

				for (y in arrBills) {
					var billId = arrBills[y];
					refnum = _.find(arrBillsProcessed, { id: String(billId) }).refnum;
					currency = _.find(arrBillsProcessed, { id: String(billId) }).currid;
					subtext = _.find(arrBillsProcessed, { id: String(billId) }).subtext;
					billnum = _.find(arrBillsProcessed, { id: String(billId) }).billnum;
					billPaymentTranId = _.find(arrBillsProcessed, { id: String(billId) }).refnum;
					dLog('values', {
            billId: billId,
            refnum: refnum,
            currency: currency,
            subtext: subtext,
            billnum: billnum,
            billPaymentTranId: billPaymentTranId
          });

					var StrdObj = {};
					StrdObj.RfrdDocInf = {};
					StrdObj.RfrdDocInf.Tp = {};
					StrdObj.RfrdDocInf.Tp.CdOrPrtry = {};
					StrdObj.RfrdDocInf.Tp.CdOrPrtry.Cd = 'CINV';

					var netAmt = 0;
					var origAmt = getFloatVal(arrBillAmtOrig[billId]);
					var amt = getFloatVal(arrBillAmt[billId]);

					var discAmt = !isEmpty(arrBillDiscAmt[billId]) ? getFloatVal(arrBillDiscAmt[billId]) : 0;

					// dLog("billId before", billId);
					// dLog("arrBC in y.arrBills before", JSON.stringify(arrBillCredits));
					dLog(
						'values',
						JSON.stringify({
							netAmt: netAmt,
							origAmt: origAmt,
							amt: amt,
							discAmt: discAmt,
							tmpAmt: tmpAmt,
						})
					);

					if (!isEmpty(arrBillCredits[billId])) {
						var arrBC = arrBillCredits[billId];

						dLog('arrBC in y.arrBills', JSON.stringify(arrBC));

						for (bc in arrBC) {
							var billCreditAmtP = getFloatVal(arrBC[bc].bcamt);
							var billCreditAmt = billCreditAmtP * -1;

							// tmpAmt = (tmpAmt - billCreditAmtP);
							netAmt = netAmt - billCreditAmtP;
						}
					}

					// tmpAmt += amt;
					netAmt = origAmt;
					tmpAmt += amt; //used to be netAmt
					totalCdtTrfTxInfAmount += amt; //origAmt;

					if (discAmt > 0) {
						netAmt -= discAmt;
						tmpAmt -= discAmt;
						// totalCdtTrfTxInfAmount -= discAmt;
					}

					dLog('createJPM_ISO_XMLDoc. objBillsData', JSON.stringify(objBillsData[billId]));
					StrdObj.RfrdDocInf.Nb = objBillsData[billId].num; //objBillsData[billId].memo; //billPaymentTranId;

					var invoiceDate = String(objBillsData[billId].dte);
          dLog('createJPM_ISO_XMLDoc. invoiceDate', invoiceDate);
          var rltdDt = moment(invoiceDate, dpf).format('YYYYMMDD');
          dLog('createJPM_ISO_XMLDoc. rltdDt', rltdDt);
					StrdObj.RfrdDocInf.RltdDt = rltdDt; //formatDate(nlapiStringToDate(invoiceDate));
					StrdObj.RfrdDocAmt = {};
					StrdObj.RfrdDocAmt.DuePyblAmt = {};
					StrdObj.RfrdDocAmt.DscntApldAmt = {};
					StrdObj.RfrdDocAmt.RmtdAmt = {};
					StrdObj.RfrdDocAmt.DuePyblAmt.value = origAmt.toFixed(2);

					if (discAmt == 0) discAmt = '0.00';
					else discAmt = discAmt.toFixed(2);

					StrdObj.RfrdDocAmt.DscntApldAmt.value = discAmt;

					//RSF - Added to make the RmtdAmt the same as DuePyblAmt
					if (!isEmpty(arrBillCredits[billId])) {
						var arrBC = arrBillCredits[billId];
						for (bc in arrBC) {
							var billCreditAmt = getFloatVal(arrBC[bc].bcamt);
							amt += Number(billCreditAmt);
						}
					}

					StrdObj.RfrdDocAmt.RmtdAmt.value = amt.toFixed(2); //netAmt.toFixed(2);

					StrdObj.RfrdDocAmt.DuePyblAmt.Ccy = symbol;
					StrdObj.RfrdDocAmt.DscntApldAmt.Ccy = symbol;
					StrdObj.RfrdDocAmt.RmtdAmt.Ccy = symbol;

					//Add CDtrRefInf
					StrdObj.CdtrRefInf = {};
					StrdObj.CdtrRefInf.Tp = {};
					StrdObj.CdtrRefInf.CdOrPrtry = {};
					StrdObj.CdtrRefInf.CdOrPrtry.Cd = billPaymentTranId; //"CINV";
					StrdObj.CdtrRefInf.Ref = billPaymentTranId; //objBillsData[billId].num; //billPaymentTranId;

					Strd.push(StrdObj);

					if (!isEmpty(arrBillCredits[billId])) {
						var arrBC = arrBillCredits[billId];

						for (bc in arrBC) {
							var billCreditAmtP = getFloatVal(arrBC[bc].bcamt);
							var billCreditAmt = billCreditAmtP;

							tmpAmt = tmpAmt - billCreditAmtP;
							netAmt = netAmt - billCreditAmtP;
							// totalCdtTrfTxInfAmount -= billCreditAmtP;

							var StrdObj = {};
							StrdObj.RfrdDocInf = {};
							StrdObj.RfrdDocInf.Tp = {};
							StrdObj.RfrdDocInf.Tp.CdOrPrtry = {};
							StrdObj.RfrdDocInf.Tp.CdOrPrtry.Cd = 'CREN'; //Hardcoded?

							var bcNum = arrBC[bc].bcnum;
							dLog('createJPMXMLDoc', 'VC number : ' + bcNum);
							dLog('arrBC[bc]', JSON.stringify(arrBC));

							if (!isEmpty(bcNum)) StrdObj.RfrdDocInf.Nb = bcNum;
							else if (!isEmpty(arrBillCredits[billId].bcmemo)) {
								StrdObj.RfrdDocInf.Nb = arrBillCredits[billId].bcmemo;
							}

							var invoiceDate = objBillsData[billId].dte;
							StrdObj.RfrdDocInf.RltdDt = moment(arrBC[bc].bcdate, dpf).format('YYYYMMDD'); //formatDate(nlapiStringToDate(invoiceDate));formatDate(nlapiStringToDate(arrBC[bc].bcdate));

							StrdObj.RfrdDocAmt = {};
							StrdObj.RfrdDocAmt.CdtNoteAmt = {};
							StrdObj.RfrdDocAmt.DuePyblAmt = null;
							StrdObj.RfrdDocAmt.DscntApldAmt = null;
							StrdObj.RfrdDocAmt.RmtdAmt = null;

							StrdObj.RfrdDocAmt.CdtNoteAmt.value = billCreditAmt.toFixed(2);
							StrdObj.RfrdDocAmt.CdtNoteAmt.Ccy = symbol;

							StrdObj.CdtrRefInf = {};
							StrdObj.CdtrRefInf.Ref = billPaymentTranId; //objBillsData[billId].num; //

							Strd.push(StrdObj);

              // var balance = Number(netAmt + billCreditAmt).toFixed(2);
              var bcAmt = '';
              if (billCreditAmt > 0) {
                bcAmt = "-" + billCreditAmt.toFixed(2);
              }

              var obj = {};
              obj.line = 'TX1' + '|' + rltdDt + '|' 
              + 'CREDIT' + '|' + bcNum.replace(/\D/g,'') + '|' + bcAmt + '|'+bcAmt+'|' 
              + discAmt + '|' + bcAmt;
              obj.line = obj.line.trim();
              uStrd.push(obj);
              transactionCount++;
    
						}
					}

					dLog(
						'Amounts in loop=' + y,
						JSON.stringify({
							totalAmount: totalAmount,
							totalCdtTrfTxInfAmount: totalCdtTrfTxInfAmount,
							netAmt: netAmt,
							tmpAmt: tmpAmt,
						})
					);

          var balance = amt.toFixed(2);
          
          var obj = {};
          obj.line = 'TX1' + '|' + rltdDt + '|' 
          + 'INVOICE' + '|' + billnum.replace(/\D/g,'') + '|' + origAmt.toFixed(2) + '|' + balance + '|' 
          + discAmt + '|' + amt.toFixed(2);
          obj.line = obj.line.trim();
          uStrd.push(obj);
          transactionCount++;
				}

				dLog('createCAP_ISO_XMLDoc.Strd2', JSON.stringify(Strd));
        dLog('createCAP_ISO_XMLDoc.uStrd', JSON.stringify(uStrd));

				noOfBillPayments = noOfBillPayments + 1;
				totalAmount += Number(totalCdtTrfTxInfAmount);
				dLog(
					'Amounts',
					JSON.stringify({
						totalAmount: totalAmount,
						totalCdtTrfTxInfAmount: totalCdtTrfTxInfAmount,
						netAmt: netAmt,
						tmpAmt: tmpAmt,
					})
				);

				cdtTrfTxInfObj.Amt = {};
				cdtTrfTxInfObj.Amt.value = totalCdtTrfTxInfAmount.toFixed(2); //netAmt.toFixed(2); //tmpAmt.toFixed(2); //netAmt.toFixed(2); //tmpAmt.toFixed(2); //amt.toFixed(2);
				cdtTrfTxInfObj.Amt.Ccy = symbol;

        if (paymentMethod == 'MTS') {
          if (objVendor.custentity_inter_bank_id) {
            cdtTrfTxInfObj.Interbank = {};          
            cdtTrfTxInfObj.Interbank.MmbId = objVendor.custentity_inter_bank_id;  
          }          
        }

				if (paymentMethod == 'DAC' || paymentMethod == 'MTS') {
					cdtTrfTxInfObj.CdtrAgt = {};
					cdtTrfTxInfObj.CdtrAgt.FinInstnId = {};

          if (objVendor.recbankprimidtype=='SWT' || objVendor.recbankprimidtype==2) {
					  cdtTrfTxInfObj.CdtrAgt.BIC = objVendor.recbankprimid;
          } else {
            cdtTrfTxInfObj.CdtrAgt.FinInstnId.ClrSysMmbId = {};
            cdtTrfTxInfObj.CdtrAgt.FinInstnId.ClrSysMmbId.MmbId = objVendor.recbankprimid; // Receiving Bank Routing  
          }
          
					cdtTrfTxInfObj.CdtrAgt.FinInstnId.Nm = objVendor.vbankname || 'custrecord_bankname';

					if (objVendor.vbankaddrs1 || objVendor.vbankzip || objVendor.vbankcity || objVendor.vbankstate) {
						cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr = {};
						cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.Ctry = countryCodeMapping[objVendor.vbankcountry];
						cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.AdrLine = objVendor.vbankaddrs1;
						cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.StrtNm = objVendor.vbankaddrs1;
						cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.PstCd = objVendor.vbankzip;
						cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.TwnNm = objVendor.vbankcity;
						cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.BldgNb = '';
						cdtTrfTxInfObj.CdtrAgt.FinInstnId.PstlAdr.CtrySubDvsn = objVendor.vbankstate;
					}

					if (paymentMethod == 'MTS') {
						// cdtTrfTxInfObj.CdtrAgt.InstrForCdtrAgt = {};
						// cdtTrfTxInfObj.CdtrAgt.InstrForCdtrAgt.InstrInf = objVendor.custentity_ica_vendor_bank_instructions;
					}
				}

				cdtTrfTxInfObj.Cdtr = {};
        if(objVendor.vendorname.length > 22) objVendor.vendorname = objVendor.vendorname.substring(0,22);
				cdtTrfTxInfObj.Cdtr.Nm = objVendor.vendorname;

				if (paymentMethod != 'DAC') {
					if (objVendor.vendoraddrs1 || objVendor.vendoraddrs2 || objVendor.vendorpostal || objVendor.vendorcity || objVendor.vendorstateprovince || countryCodeMapping[objVendor.vendorcountrycode]) {
						dLog(
							'Vendor Address',
							JSON.stringify({
								addr1: objVendor.vendoraddrs1,
								addr2: objVendor.vendoraddrs2,
								postal: objVendor.vendorpostal,
								city: objVendor.vendorcity,
								vsp: objVendor.vendorstateprovince,
								countrycode: objVendor.vendorcountrycode,
								countryCodeMapping: countryCodeMapping[objVendor.vendorcountrycode],
							})
						);
						cdtTrfTxInfObj.Cdtr.PstlAdr = {};
						cdtTrfTxInfObj.Cdtr.PstlAdr.StrtNm = objVendor.vendoraddrs1;
						cdtTrfTxInfObj.Cdtr.PstlAdr.BldgNb = objVendor.vendoraddrs2 || '';
						cdtTrfTxInfObj.Cdtr.PstlAdr.PstCd = objVendor.vendorpostal;
						cdtTrfTxInfObj.Cdtr.PstlAdr.TwnNm = objVendor.vendorcity;
						cdtTrfTxInfObj.Cdtr.PstlAdr.CtrySubDvsn = objVendor.vendorstateprovince;
						cdtTrfTxInfObj.Cdtr.PstlAdr.Ctry = countryCodeMapping[objVendor.vendorcountrycode];
					}
          if (paymentMethod == 'CHK') {
            cdtTrfTxInfObj.Cdtr.CtctDtls = objVendor.custentity_ica_vendorname2;
            dLog('Added vendorname2 to CtctDtls', objVendor.custentity_ica_vendorname2)
          }

				} else {
					cdtTrfTxInfObj.Cdtr.PstlAdr = null;
				}

				if (paymentMethod == 'DAC' || paymentMethod == 'MTS') {
					cdtTrfTxInfObj.CdtrAcct = {};
					cdtTrfTxInfObj.CdtrAcct.Id = {};
					cdtTrfTxInfObj.CdtrAcct.Id.Othr = {};
					cdtTrfTxInfObj.CdtrAcct.Id.Othr.Id = objVendor.recpartyaccount;

					// if (paymentMethod == 'DAC') {
					// 	cdtTrfTxInfObj.CdtrAcct.Tp = {};
					// 	cdtTrfTxInfObj.CdtrAcct.Tp.Cd = 'CACC';
					// }
					if (paymentMethod == 'DAC') {
						cdtTrfTxInfObj.CdtrAcct.Prtry = {};
            if (objVendor.recpartyaccount=='D') {
              cdtTrfTxInfObj.CdtrAcct.Prtry = 'DDA';
            } else if (objVendor.recpartyaccount=='S') {
              cdtTrfTxInfObj.CdtrAcct.Prtry = 'SAV';
            } else if (objVendor.recpartyaccount=='G') {
              cdtTrfTxInfObj.CdtrAcct.Prtry = 'GL';
            } else {
              cdtTrfTxInfObj.CdtrAcct.Prtry = 'DDA';
            }						
					}

				}

				// cdtTrfTxInfObj.RltdAmtInf = {};
				// cdtTrfTxInfObj.RltdAmtInf.RmtLctnMtd = objVendor.pmp_dac_contactname || "";
				// cdtTrfTxInfObj.RltdAmtInf.RmtLctnElctrncAdr = objVendor.pmp_dac_emailaddress || "";
				if (paymentMethod == 'CHK') {
					dLog('objVendor.custentity_ica_vendor_bank_instructions', objVendor.custentity_ica_vendor_bank_instructions);
					cdtTrfTxInfObj.RmtInf = {};
                    
					cdtTrfTxInfObj.RmtInf.Ustrd = objVendor.custentity_ica_vendor_bank_instructions; //
          cdtTrfTxInfObj.RmtInf.StrdC = {};
          cdtTrfTxInfObj.RmtInf.StrdC = uStrd;
					// cdtTrfTxInfObj.RmtInf.Strd = Strd; //Replace once Al confirms
				}
				// dLog("cdtTrfTxInfObj", JSON.stringify(cdtTrfTxInfObj));
				CdtTrfTxInf.push(cdtTrfTxInfObj);
			}
			dLog(
				'createCAP_ISO_XMLDoc:CdtTrfTxInf',
				JSON.stringify(CdtTrfTxInf)
			);


			dLog(
				'createCAP_ISO_XMLDoc:About to add totalAmount',
				JSON.stringify({
					totalAmount: totalAmount,
				})
			);

			PmtInfObj.NbOfTxs = noOfBillPayments;
			PmtInfObj.CtrlSum = totalAmount.toFixed(2);
			totalNbOfTxs += Number(noOfBillPayments);
			totalCtrlSum += Number(totalAmount);
			PmtInfObj.CdtTrfTxInf = CdtTrfTxInf;
			PmtInf.push(PmtInfObj);
		}
	}

	objects.NbOfTxs = totalNbOfTxs; //grpHdrNbOfTxs;
	objects.CtrlSum = totalCtrlSum.toFixed(2); //grpHdrCtrlSum.toFixed(2); // Do we comment this out?
	objects.PmtInf = PmtInf;
	// objects.CdtTrfTxInf = CdtTrfTxInf;
	// dLog("objects.PmtInf", JSON.stringify(objects.PmtInf));
	// dLog('objects.CdtTrfTxInf', JSON.stringify(objects.CdtTrfTxInf));

	var fileId = nlapiSearchRecord('file', null, [['name', 'is', 'ica_cap_iso.xml']], []);
	if (fileId != null) {
		fileId = fileId[0].getId();
	}

	var tmplFile = nlapiLoadFile(fileId);

	var template = Handlebars.compile(tmplFile.getValue());
	var xmlDoc = template(objects);

	dLog('xmlDoc', xmlDoc);
  xmlDoc = xmlDoc.replace(/^\s*[\r\n]/gm, '');
  
	return xmlDoc;
}



function isAlpha(str) {
	return /^[a-zA-Z]+$/.test(str);
}
