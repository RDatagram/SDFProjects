var MSG_TYPE = [];
MSG_TYPE['CHK'] = 'custrecord_checkmessage';
MSG_TYPE['DAC'] = 'custrecord_achmessage';
MSG_TYPE['MTS'] = 'custrecord_mtsmessage';
MSG_TYPE['IAC'] = 'custrecord_iacmessage';
MSG_TYPE['IWI'] = 'custrecord_iwimessage';
MSG_TYPE['CCR'] = 'custrecord_ccr_message';

/**
 *
 * @param bills
 * @param subId
 * @returns
 */
function creatXMLDoc(objAcctMapping) {
	try {
		dLog('creatXMLDoc', '>>> START <<<');
		dLog('arrBillChkMap', JSON.stringify(arrBillChkMap));

		var schema = nlapiGetContext().getSetting('SCRIPT', 'custscript_v16_xml_schema');

		dLog('creatXMLDoc', 'VPM Mapping results = ' + JSON.stringify(objAcctMapping));

		dLog('creatXMLDoc', 'arrBillsProcessed = ' + JSON.stringify(arrBillsProcessed));

		// start create xml line
		var xmlDoc = nlapiStringToXML('<?xml version="1.0"?><File></File>');
		var fileNode = getNode(xmlDoc, '/File');
		setAttributeValue(fileNode, 'CompanyID', COMPANY_PREFIX);
		setAttributeValue(fileNode, 'xmlns:xsi', isEmpty(schema) ? 'http://www.w3.org/2001/XMLSchema-instance' : schema);

		var arrTempBillIds = [];
		var arrBillCRIds = [];
		var arrBillAmt = [];
		var arrBillAmtOrig = [];
		var arrBillDiscAmt = [];
		var arrPLCIds = [];
		var arrMemos = [];
		var arrChecks = [];
		var arrChecks2 = [];

		dAudit('createXMLDoc: about to create xml, arrBillsProcessed.length', arrBillsProcessed.length);

		for (x in arrBillsProcessed) {
			var billId = arrBillsProcessed[x].id;
			var billPaymentId = arrBillsProcessed[x].payment;

			dLog('creatXMLDoc', 'Bill info = ' + JSON.stringify(arrBillsProcessed[x]));

			// check if payment id exist, only generate xml bills with payment
			// id, skip processed bill credit
			if (!isEmpty(billPaymentId) && billPaymentId != 'XXXNONEXXX' && billPaymentId != 'CREDIT') {
				if (billPaymentId != 'CREDIT') arrTempBillIds.push(billId);

				arrBillAmtOrig[billId] = arrBillsProcessed[x].origamt;
				// arrBillAmt[billId] = arrBillsProcessed[x].pay;
				arrBillAmt[billId] = arrBillsProcessed[x].payamt;
				arrBillDiscAmt[billId] = arrBillsProcessed[x].discamt;
				arrMemos[billId] = arrBillsProcessed[x].memo;
			}

			if (billPaymentId == 'CREDIT') arrBillCRIds.push(billId);
			if (billPaymentId == 'PLC') {
				arrPLCIds.push(arrBillsProcessed[x]);
			}
			if (billPaymentId == 'check') {
				arrChecks.push(billId);
				arrChecks2.push(billId);
			}
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

			for (var x in arrChecks) {
				if (arrTempBillIds[vx] == arrChecks[x]) {
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

		dAudit('creatXMLDoc', 'arrBillIds = ' + arrBillIds.length);

		if (arrBillIds.length < 1 && arrChecks.length < 1) {
			dLog('creatXMLDoc', 'No bill id to generate xml. exit xml creation.');
			return null;
		}

		var arrPLCs = getPLCs(arrPLCIds);
		var arrBillCredits = getBillCredit(arrBillIds);
		var objBillsData = getBillData(arrBillIds4);
		var arrBillPO = getPOMap(arrBillIds2);
		var arrVendorBills = getPayeeBills(arrBillIds3);
		var arrVendorBillsCurr = getPayeeBillsCurrency(arrBillIds4);
		var objBillsData = getBillData(arrBillIds5);
		var arrChecksData = getCheckDetails(arrChecks, objAcctMapping);
		// var getCheckDetails(checkIds)
		var arrCustomDefinition = getCustomDefinitionDetails(arrBillIds4, objAcctMapping);
    dAudit('objBillsData', JSON.stringify(objBillsData));
		dAudit('arrChecksData', JSON.stringify(arrChecksData));
		dAudit('arrCustomDefinition', JSON.stringify(arrCustomDefinition));
		var nsAcctSub =
			!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('subsidiary', 'CUSTRECORD_ACCT_MAP_NETSUITE_ACCOUNT'))
				? objAcctMapping[0].getValue('subsidiary', 'CUSTRECORD_ACCT_MAP_NETSUITE_ACCOUNT')
				: '';
    dAudit('nsAcctSub', JSON.stringify(nsAcctSub));         
		var objVDCRecResults = getVendorDAC_CCRPaymentRec(nsAcctSub);
		dAudit('objVDCRecResults', JSON.stringify(objVDCRecResults));
		var arrCurrMap = getCurrecnyISOCode();
		var currDate = formatDate(new Date());
		var pmtCtr = '';
		var pmtTotalAmt = 0;
		var b2pMemo = '';
		var tmpTotalAmt = 0;
		var arrPayeeIds = [];

		// get Total Bill amount
		for (x in arrVendorBills) {
			var arrBillIds = arrVendorBills[x];

			var payeeId = x.split('X@X')[0];
			arrPayeeIds.push(payeeId);
			for (vbill in arrBillIds) {
				pmtTotalAmt += getFloatVal(arrBillAmt[arrBillIds[vbill]]);
				b2pMemo += objBillsData[arrBillIds[vbill]].memo + ' ';
			}
		}

		arrPayeeIds = removeDuplicates(arrPayeeIds);
		dAudit('creatXMLDoc', 'arrPayeeIds = ' + arrPayeeIds.length);
		var arrVendors = [];
		if (arrPayeeIds.length > 0) {
			arrVendors = getEntityData(arrPayeeIds);
		}

		//TEST OTHER PAYMENTS TOMORROW
		arrVendors = arrVendors.concat(getEmployeeData(arrPayeeIds));
		dLog('arrVendors', 'arrVendors = ' + JSON.stringify(arrVendors));

		var arrPayeeInterBillsMemo = getPayeeBillsMemo(arrPayeeIds);
		dLog('creatXMLDoc', 'pmtTotalAmt = ' + pmtTotalAmt);

		var objLog = {
			arrBillCredits: arrBillCredits,
			objBillsData: objBillsData,
			arrBillPO: arrBillPO,
			arrVendorBills: arrVendorBills,
		};

		dAudit('creatXMLDoc', JSON.stringify(objLog));

		for (v in arrVendorBills) {
			dAudit('arrVendorBills=' + v, JSON.stringify(arrVendorBills[v]));
			pmtCtr++;
			var arrPayeeCurr = v.split('X@X');
			var payeeId = arrPayeeCurr[0];
			var currId = arrPayeeCurr[1];
			var hasChkNum = true;
      var billtype = 

			dLog('creatXMLDoc', 'vb ndex = ' + v);

			// var objVendor = arrVendors[payeeId];
			var objVendor = _.find(arrVendors, { internalid: String(payeeId) }); //entityData[payeeId];
      // var objVendor = _.find(arrVendors, { internalid: String(payeeId), paymentmethod: String(paymentMethod) })[0];
			dLog('creatXMLDoc', 'objVendor = ' + JSON.stringify(objVendor));

			var checkId = arrVendorBills[v][0];
			var billId = arrVendorBills[v][0];

			var checkData = _.find(arrChecksData, { internalid: String(checkId) });
			var customDefData = _.find(arrCustomDefinition, { internalid: String(checkId) });
			var billsLength = arrVendorBills[v].length;
			dLog('creatXMLDoc', 'checkData = ' + JSON.stringify(checkData));
			dLog('creatXMLDoc', 'customDefData = ' + JSON.stringify(customDefData));
			dLog('creatXMLDoc', 'arrVendorBills.length = ' + arrVendorBills[v].length);
			// var objCheck = nlapiLoadRecord('check', checkId);

			if (isEmpty(objVendor)) continue;

			var pmtMethod = objVendor.paymentmethod;
			dLog('creatXMLDoc', 'pmtMethod = ' + pmtMethod);
      if (PROCESS_AS_CHECK == 'T') pmtMethod = 'CHK';

			// dLog('creatXMLDoc', 'countryCode = ' + countryCode);

			// START: PmtRec Node
			var pmtRecNode = addNodeFromParentNode(xmlDoc, fileNode, 'PmtRec');

			// as per Al on 4th May
			// On the VPM: Payment Profile Tab: custentity_creditdebitflag,
			// (XML: PmtCrDr = C) please default this value to 'C' in your code,
			// I don't want to use this field anymore.
			// setAttributeValue(pmtRecNode, 'PmtCrDr', objVendor.crdrflag);
			if (
				pmtMethod == 'IAC' ||
				pmtMethod == 'MTS' ||
				pmtMethod == 'IWI' ||
				pmtMethod == 'ACH' ||
				pmtMethod == 'DAC' ||
				pmtMethod == 'CHK' ||
				pmtMethod == 'PLC' ||
				pmtMethod == 'CCR' ||
				pmtMethod == 'NRG' ||
				pmtMethod == 'URG'
			) {
				setAttributeValue(pmtRecNode, 'PmtCrDr', 'C');
			}

			setAttributeValue(pmtRecNode, 'PmtMethod', pmtMethod);

			if (WF_NO_ACCOUNT_INFORMATION_IN_XML == 'T' && pmtMethod == 'DAC') addTextNodeFromParentNode(xmlDoc, pmtRecNode, 'PDPHandlingCode', 'T');

			if (pmtMethod != 'CHK' && pmtMethod != 'MTS' && pmtMethod != 'B2P') {
				if (!isEmpty(objVendor.payformat)) setAttributeValue(pmtRecNode, 'PmtFormat', objVendor.payformat);
			}

			if (
				pmtMethod == 'IAC' ||
				pmtMethod == 'MTS' ||
				pmtMethod == 'IWI' ||
				pmtMethod == 'ACH' ||
				pmtMethod == 'DAC' ||
				pmtMethod == 'CHK' ||
				pmtMethod == 'CCR' ||
				pmtMethod == 'NRG' ||
				pmtMethod == 'URG'
			) {
        if (PROCESS_AS_CHECK == 'T') {
          //Nothing to show 
        } else {
          if (!isEmpty(objVendor.pmformatintl)) setAttributeValue(pmtRecNode, 'PmtFormatIntl', objVendor.pmformatintl);
        }
				

				// as per Al on 9th May 2017
				// Hi Fernie, can you check and see that the TransHandlingCode
				// is set to 'U' when the 'ACCT Mapping PMP BILLER ID' is not
				// empty and the fields on the vendor are populated for ‘pmp
				// delivery contact name and pmp delivery email address.

				//HOTFIX - Oct 11 2019
				if (pmtMethod == 'CCR' || pmtMethod == 'CHK' || pmtMethod == 'URG' || pmtMethod == 'NRG') {
					//Do nothing.
					dLog('creatXMLDoc', 'doing nothing. pmtMethod = ' + pmtMethod);
				} else {
					if (!isEmpty(objVendor.custentity_pmp_biller_id)) {
						setAttributeValue(pmtRecNode, 'TranHandlingCode', 'U');
					} else if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_pmp_biller_id'))) {
						setAttributeValue(pmtRecNode, 'TranHandlingCode', 'U');
					} else {
						//set to U if acct_map_biller_id dont have a value.
						// if (pmtMethod=='IWI' || pmtMethod=='IAC' || pmtMethod=='MTS' || pmtMethod=='DAC') {
						setAttributeValue(pmtRecNode, 'TranHandlingCode', 'D');
						// }
					}
				}
			}

			if (pmtMethod == 'CCR') {
				// START: IDInfo - Batch
				var idInfoNodeBatch = addNodeFromParentNode(xmlDoc, pmtRecNode, 'IDInfo');
				setAttributeValue(idInfoNodeBatch, 'IDType', 'BatchID');
				var batchId = Date.create().format('{yy}{hh}{mm}{ss}');
				addTextNodeFromParentNode(xmlDoc, idInfoNodeBatch, 'ID', pad(batchId, 10));

				// END: IDInfo - Batch

				// START: IDInfo - Customer ID
				var idInfoNodeBatch = addNodeFromParentNode(xmlDoc, pmtRecNode, 'IDInfo');
				setAttributeValue(idInfoNodeBatch, 'IDType', 'CustomerID');

				if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ceo_company_id')))
					addTextNodeFromParentNode(xmlDoc, idInfoNodeBatch, 'ID', objAcctMapping[0].getValue('custrecord_acct_map_ceo_company_id'));

				// END: IDInfo - Customer ID
			}

			if (
				pmtMethod == 'IAC' ||
				pmtMethod == 'MTS' ||
				pmtMethod == 'IWI' ||
				pmtMethod == 'ACH' ||
				pmtMethod == 'DAC' ||
				pmtMethod == 'CHK' ||
				pmtMethod == 'CCR' ||
				pmtMethod == 'NRG' ||
				pmtMethod == 'URG'
			) {
				addTextNodeFromParentNode(xmlDoc, pmtRecNode, 'PmtID', arrBillPaymentMap[payeeId]);
			}

			if (!isEmpty(currId)) {
				// addTextNodeFromParentNode(xmlDoc, pmtRecNode, 'CurCode',
				// objVDCRecResults[0].getValue('custrecord_companycurrency'));
				// as per AL on Oct 8, 2015
				// After the PMTID, there is a field called CurCode. For IAC,
				// this needs to be always set to USD if the Originating Account
				// is set to USD (ActCurr = USD). This rule should override any
				// other logic ONLY for IAC.

				var curCode =
					pmtMethod == 'IAC' && !isEmpty(objAcctMapping)
						? objAcctMapping[0].getValue('symbol', 'CUSTRECORD_ACCT_MAP_ACCOUNT_CURRENCY')
						: arrCurrMap[currId];

				if (pmtMethod != 'B2P') {
					addTextNodeFromParentNode(xmlDoc, pmtRecNode, 'CurCode', curCode);
				}
			}

			if (pmtMethod != 'B2P') {
				addTextNodeFromParentNode(xmlDoc, pmtRecNode, 'ValueDate', formatDate(nlapiStringToDate(BPM_DATE)));
			}

			if (pmtMethod == 'IAC' || pmtMethod == 'IWI' || pmtMethod == 'NRG' || pmtMethod == 'URG') {
				if (!isEmpty(objVendor.fx_reftype) || !isEmpty(objVendor.fx_refid)) {
					var iacRefInfo = addNodeFromParentNode(xmlDoc, pmtRecNode, 'RefInfo');

					if (!isEmpty(objVendor.fx_reftype)) setAttributeValue(iacRefInfo, 'RefType', objVendor.fx_reftype);
					if (!isEmpty(objVendor.fx_refid)) addTextNodeFromParentNode(xmlDoc, iacRefInfo, 'RefID', objVendor.fx_refid);
				}
			} else if (pmtMethod == 'CHK') {
				// if ((!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_check_insert_type')))
				// 		|| (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_check_insert_value')))) {

				// 	var iacRefInfo = addNodeFromParentNode(xmlDoc, pmtRecNode, 'RefInfo');

				// 	if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_check_insert_type')))
				// 		setAttributeValue(iacRefInfo, 'RefType', objVDCRecResults[0].getValue('custrecord_check_insert_type'));

				// 	if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_check_insert_value')))
				// 		addTextNodeFromParentNode(xmlDoc, iacRefInfo, 'RefID', objVDCRecResults[0].getValue('custrecord_check_insert_value'));
				// }

				var refType = '';
				var refId = '';

				refType =
					objVendor.custentity_ica_entity_check_insert_type ||
					objAcctMapping[0].getValue('custrecord_ica_acct_map_check_inert_type') ||
					objVDCRecResults[0].getValue('custrecord_check_insert_type') ||
					'';
				refId =
					objVendor.custentity_ica_entity_check_insert_value ||
					objAcctMapping[0].getValue('custrecord_ica_acct_map_check_insert_val') ||
					objVDCRecResults[0].getValue('custrecord_check_insert_value') ||
					'';

				dAudit(
					'refType',
					JSON.stringify({
						vendor: objVendor.custentity_ica_entity_check_insert_type,
						acctmapping: objAcctMapping[0].getValue('custrecord_ica_acct_map_check_inert_type'),
						objVDCRecResults: objVDCRecResults[0].getValue('custrecord_check_insert_type'),
					})
				);

				dAudit(
					'refType',
					JSON.stringify({
						vendor: objVendor.custentity_ica_entity_check_insert_value,
						acctmapping: objAcctMapping[0].getValue('custrecord_ica_acct_map_check_insert_val'),
						objVDCRecResults: objVDCRecResults[0].getValue('custrecord_check_insert_value'),
					})
				);

				if (refType != '' && refId != '') {
					var iacRefInfo = addNodeFromParentNode(xmlDoc, pmtRecNode, 'RefInfo');
					setAttributeValue(iacRefInfo, 'RefType', refType);
					addTextNodeFromParentNode(xmlDoc, iacRefInfo, 'RefID', refId);
				}
			}

			//Add RefID=WC RSF
			// if (pmtMethod == 'MTS') {

			// dLog('Wire FEEs', WIRE_FEES);
			if (WIRE_FEES != '') {
				var wireFees = '';
				if (WIRE_FEES == 1) wireFees = 'BEN';
				else if (WIRE_FEES == 2) wireFees = 'OUR';
				if (wireFees != '') {
					var wcRefInfo = addNodeFromParentNode(xmlDoc, pmtRecNode, 'RefInfo');
					setAttributeValue(wcRefInfo, 'RefType', 'WC');
					addTextNodeFromParentNode(xmlDoc, wcRefInfo, 'RefID', wireFees);
				}
			}

			///RSF - 03292021
			if (pmtMethod == 'CHK') {
				if (CHECKZIP == 'T') {
					//Check if the bills have documents
					dLog('CHECKZIP_INTERNALIDS', CHECKZIP_INTERNALIDS);
					if (!isEmpty(CHECKZIP_INTERNALIDS)) {
						var internalids = CHECKZIP_INTERNALIDS.split(',');
						var cleaned = [];
						for (var i = 0; i < internalids.length; i++) {
							cleaned.push(internalids[i].trim());
						}
						internalids = cleaned;
						dLog('internalids', internalids);
						var hasAttachments = false;

						for (var i = 0; i < internalids.length; i++) {
							if (objBillsData[billId][internalids[i]]) {
								hasAttachments = true;
								dLog('Found an attachment', internalids[i]);
							}
						}

						if (hasAttachments) {
							var wcRefInfo = addNodeFromParentNode(xmlDoc, pmtRecNode, 'RefInfo');
							setAttributeValue(wcRefInfo, 'RefType', 'ZZ');
							addTextNodeFromParentNode(xmlDoc, wcRefInfo, 'RefID', 'EOR');
							DEPLOY_CHECKZIP = true;
						}
					}
				}
				// if (!isEmpty(objVendor.custentity_ica_location_code)) {
				// 	var wcRefInfo = addNodeFromParentNode(xmlDoc, pmtRecNode, 'RefInfo');
				// 	setAttributeValue(wcRefInfo, 'RefType', "ZZ");
				// 	addTextNodeFromParentNode(xmlDoc, wcRefInfo, 'RefID', objVendor.custentity_ica_location_code);
				// }

				//Location Code RefId
				dLog('locationCode', objVendor.custentity_ica_location_code);
				if (!isEmpty(objVendor.custentity_ica_location_code)) {
					var wcRefInfo = addNodeFromParentNode(xmlDoc, pmtRecNode, 'RefInfo');
					setAttributeValue(wcRefInfo, 'RefType', '93');
					addTextNodeFromParentNode(xmlDoc, wcRefInfo, 'RefID', objVendor.custentity_ica_location_code);
				}
			}

			// END: PmtRec Node
			// dLog('creatXMLDoc', 'End: PmtRec Node');

			// START: Message Node
			if (
				pmtMethod == 'IAC' ||
				pmtMethod == 'MTS' ||
				pmtMethod == 'IWI' ||
				pmtMethod == 'ACH' ||
				pmtMethod == 'DAC' ||
				pmtMethod == 'PLC' ||
				pmtMethod == 'CHK' ||
				pmtMethod == 'CCR' ||
				pmtMethod == 'NRG' ||
				pmtMethod == 'URG'
			) {
				var msgNode = addNodeFromParentNode(xmlDoc, pmtRecNode, 'Message');

				if (pmtMethod == 'PLC') {
					setAttributeValue(msgNode, 'MsgType', 'CHK'); //RSF - for PLC
				} else if (pmtMethod == 'NRG' || pmtMethod == 'URG') {
					setAttributeValue(msgNode, 'MsgType', 'OBI');
				} else {
					setAttributeValue(msgNode, 'MsgType', objVDCRecResults[0].getValue(MSG_TYPE[pmtMethod]));
				}

				// 18 May 2017 as per AL We need to add '/FPS/' before the vendor
				// internal ID as listed below; this is only for customers that have
				// a checkbox checked on the Payment Profile tab called FAS
				// IF the checkbox is checked, then add the /FPS/Internal ID
				// Only for IWI

				//RSF Check Memo Field – this is writing in the internal ID of the vendor; I would like this changed to be either blank or the Bill Payment Memo Field. (parameter that can be set under General Preferences.
				// if (CHECK_MEMO=='T') {
				// 	// var msgTypeTxt = (objVendor.custentity_fas == 'T' && pmtMethod == 'IWI') ? '/FPS/' + payeeId : payeeId;
				// 	var msgTypeTxt = b2pMemo;
				// 	addTextNodeFromParentNode(xmlDoc, msgNode, 'MsgText', msgTypeTxt);
				// } else {
				// 	addTextNodeFromParentNode(xmlDoc, msgNode, 'MsgText', '');
				// }

        

				if (pmtMethod == 'CHK') {
					try {
						dLog('creatXMLDoc-objBillData', JSON.stringify(objBillsData[billId]));
						if (checkData != undefined) {
							addTextNodeFromParentNode(xmlDoc, msgNode, 'MsgText', checkData.memo || objBillsData[billId].msgText || arrBillChkMap[payeeId] || '');
						} else {
							if (billsLength > 1) {
								dLog('Adding MsgText PayeeId', '');
								dLog('Adding MsgText PayeeId:objBillsData', JSON.stringify(objBillsData));
								var msgText = '';
								for (var b in objBillsData) {
                  if (objBillsData[b].entity==payeeId) {
                    if (!msgText) {
                      msgText = objBillsData[b].msgText;
                    }  
                  }
								}
								addTextNodeFromParentNode(xmlDoc, msgNode, 'MsgText', msgText || '');
							} else {
								dLog(
									'About to set MsgText',
									JSON.stringify({
										objBillsDataBillId: objBillsData[billId],
										objBillsDataBillIdMsgText: objBillsData[billId].msgText,
										customDefData: customDefData[customDefData.MsgText],
										customDefDatamemo: customDefData.memo,
									})
								);

								var msgTypeTxt = '';
								if (DEFAULT_MSG_VENDOR_ID == 'T') {
									msgTypeTxt = objVendor.custentity_ica_vendor_external_id;
								}

								if (!isEmpty(msgTypeTxt))
									addTextNodeFromParentNode(xmlDoc, msgNode,'MsgText', objBillsData[billId].msgText || msgTypeTxt || customDefData[customDefData.MsgText] || customDefData.memo || arrBillChkMap[payeeId] || '');
								else
									addTextNodeFromParentNode(xmlDoc, msgNode, 'MsgText', objBillsData[billId].msgText || customDefData[customDefData.MsgText] || customDefData.memo || arrBillChkMap[payeeId] || '');
							}
						}
					} catch (e) {
						dLog('creatXMLDoc', 'There was an error retrieving value for billData - ' + e.message);
					}
				} else {

          var combinedMessageText = '';
          if (pmtMethod == 'MTS' || pmtMethod == 'IAC' || pmtMethod == 'DAC' || pmtMethod == 'IWI') {
            // || pmtMethod == 'NRG' ||pmtMethod == 'URG'
  
            var msgTxt = '';
            var bMemo = arrPayeeInterBillsMemo[payeeId];
            dLog('creatXMLDoc', 'Msg bMemo = ' + bMemo);
  
            if (!isEmpty(bMemo)) msgTxt += isEmpty(msgTxt) ? bMemo : ' ' + bMemo;
  
            dLog('creatXMLDoc', 'Msg text = ' + msgTxt);
  
            if (!isEmpty(msgTxt)) {
              // var msgNode = addNodeFromParentNode(xmlDoc, pmtRecNode, 'Message');
              setAttributeValue(msgNode, 'MsgType', VENDOR_ORIG_MSG_TYPE);
              // addTextNodeFromParentNode(xmlDoc, msgNode, 'MsgText', msgTxt);
              combinedMessageText += msgTxt;
            }
          }
  
          try {
            var msgTypeTxt = '';
            if (DEFAULT_MSG_VENDOR_ID == 'T') {
              msgTypeTxt = objVendor.custentity_ica_vendor_external_id;
            } else {
              msgTypeTxt = objVendor.custentity_fas == 'T' && pmtMethod == 'IWI' ? '/FPS/' + payeeId : payeeId;
            }
            dLog('creatXMLDoc', 'Msg msgTypeTxt = ' + msgTypeTxt);
            if (!msgTypeTxt) msgTypeTxt = payeeId;
            combinedMessageText += ' ' + (objBillsData[billId].msgText || msgTypeTxt);

            // if (!isEmpty(msgTypeTxt)) addTextNodeFromParentNode(xmlDoc, msgNode, 'MsgText', objBillsData[billId].msgText || msgTypeTxt);
            // else addTextNodeFromParentNode(xmlDoc, msgNode, 'MsgText', objBillsData[billId].msgText || '');  
          } catch(e) {
            dLog('creatXMLDoc', 'msgText - ' + e.message);
          }
          dLog('creatXMLDoc', 'combinedMessageText - ' + combinedMessageText.trim());
          
          if (combinedMessageText) {
            addTextNodeFromParentNode(xmlDoc, msgNode, 'MsgText', combinedMessageText.trim())
          }
				}

			}
			// END: Message Node

			// dLog('creatXMLDoc', 'End: Message Node');

			if (pmtMethod == 'CHK') {
				// Check Node
				var chkNode = addNodeFromParentNode(xmlDoc, pmtRecNode, 'Check');

				if (!isEmpty(arrBillChkMap[payeeId])) {
					addTextNodeFromParentNode(xmlDoc, chkNode, 'ChkNum', arrBillChkMap[payeeId]);
				} else {
					hasChkNum = false;
				}

				if (!isEmpty(objVendor.custentity_check_style)) {
					addTextNodeFromParentNode(xmlDoc, chkNode, 'ChkDocNum', objVendor.custentity_check_style);
				} else if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_check_template_id'))) {
					addTextNodeFromParentNode(xmlDoc, chkNode, 'ChkDocNum', objAcctMapping[0].getValue('custrecord_acct_map_check_template_id'));
				}

				if (!isEmpty(objVDCRecResults) && !isEmpty(objVendor.couriername))
					addTextNodeFromParentNode(xmlDoc, chkNode, 'CourierName', objVendor.couriername);

				if (!isEmpty(objVDCRecResults) && !isEmpty(objVendor.courieraccount))
					addTextNodeFromParentNode(xmlDoc, chkNode, 'CourierAccount', objVendor.courieraccount);

        // if (USE_CHECK_ADDR=='T') {
        //   addTextNodeFromParentNode(xmlDoc, chkNode, 'DeliveryCode', objBillsData[billId].custbody_ica_delivery_code);  
        // } else {
        //   if (!isEmpty(objVDCRecResults) && !isEmpty(objVendor.deliverycode))
        //     addTextNodeFromParentNode(xmlDoc, chkNode, 'DeliveryCode', objVendor.deliverycode);  
        // }
			}

			// dLog('creatXMLDoc', 'End: Check Node');

			// START: Origin Party
			var orgnPartyNode = addNodeFromParentNode(xmlDoc, pmtRecNode, 'OrgnrParty');

			if (pmtMethod != 'CCR') {
				if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_companyname'))) {
					var orgpNameNode = addNodeFromParentNode(xmlDoc, orgnPartyNode, 'Name');
					addTextNodeFromParentNode(xmlDoc, orgpNameNode, 'Name1', objVDCRecResults[0].getValue('custrecord_companyname'));

					if (pmtMethod == 'URG') {
						if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compaddname'))) {
							addTextNodeFromParentNode(xmlDoc, orgpNameNode, 'Name2', objVDCRecResults[0].getValue('custrecord_compaddname'));
						}
					} else if (pmtMethod == 'NRG') {
						if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compaddname'))) {
							var name2 = objVDCRecResults[0].getValue('custrecord_compaddname').substring(0, 15);
							addTextNodeFromParentNode(xmlDoc, orgpNameNode, 'Name2', name2);
						}
					}
				}
			} else {
				var orgpContactInfoNode = '';
				if (
					(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_ccr_contact'))) ||
					(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_ccr_phonetype'))) ||
					(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_ccr_phonenum')))
				) {
					orgpContactInfoNode = addNodeFromParentNode(xmlDoc, orgnPartyNode, 'ContactInfo');
				}

				if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_ccr_contact')))
					setAttributeValue(orgpContactInfoNode, 'Name', objVDCRecResults[0].getValue('custrecord_ccr_contact'));

				if (
					(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_ccr_phonetype'))) ||
					(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_ccr_phonenum')))
				) {
					var orgpPhoneNumNode = addNodeFromParentNode(xmlDoc, orgpContactInfoNode, 'PhoneNum');

					if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_ccr_phonetype')))
						setAttributeValue(orgpPhoneNumNode, 'PhoneType', objVDCRecResults[0].getValue('custrecord_ccr_phonetype'));

					if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_ccr_phonenum')))
						setAttributeValue(orgpPhoneNumNode, 'Phone', objVDCRecResults[0].getValue('custrecord_ccr_phonenum'));
				}
			}

			if (
				pmtMethod == 'IAC' ||
				pmtMethod == 'MTS' ||
				pmtMethod == 'IWI' ||
				pmtMethod == 'ACH' ||
				pmtMethod == 'DAC' ||
				pmtMethod == 'PLC' ||
				pmtMethod == 'CHK' ||
				pmtMethod == 'NRG' ||
				pmtMethod == 'URG'
			) {
				if (
					(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compadd1'))) ||
					(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compadd2'))) ||
					(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compcity'))) ||
					(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compstateprov'))) ||
					(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_comppostcode')))
				) {
					var postAddrNode = addNodeFromParentNode(xmlDoc, orgnPartyNode, 'PostAddr');

					if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compadd1')))
						addTextNodeFromParentNode(xmlDoc, postAddrNode, 'Addr1', objVDCRecResults[0].getValue('custrecord_compadd1'));
					if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compadd2')))
						addTextNodeFromParentNode(xmlDoc, postAddrNode, 'Addr2', objVDCRecResults[0].getValue('custrecord_compadd2'));
					if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compcity')))
						addTextNodeFromParentNode(xmlDoc, postAddrNode, 'City', objVDCRecResults[0].getValue('custrecord_compcity'));
					if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compstateprov')))
						addTextNodeFromParentNode(xmlDoc, postAddrNode, 'StateProv', objVDCRecResults[0].getValue('custrecord_compstateprov'));
					if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_comppostcode')))
						addTextNodeFromParentNode(xmlDoc, postAddrNode, 'PostalCode', objVDCRecResults[0].getValue('custrecord_comppostcode'));

					var country = !isEmpty(objVDCRecResults) ? objVDCRecResults[0].getValue('custrecord_compcountrycode') : '';
					if (!isEmpty(country)) addTextNodeFromParentNode(xmlDoc, postAddrNode, 'Country', country);

					var countryName = !isEmpty(objVDCRecResults) ? objVDCRecResults[0].getText('custrecord_compcountrynames') : '';
					if (!isEmpty(countryName)) addTextNodeFromParentNode(xmlDoc, postAddrNode, 'CountryName', countryName);
				}
			}
			// END: Origin Party

			// dLog('creatXMLDoc', 'End: Origin Party Node');

			// START: OrgnrDepAcctID

			if (
				pmtMethod == 'IAC' ||
				pmtMethod == 'MTS' ||
				pmtMethod == 'IWI' ||
				pmtMethod == 'ACH' ||
				pmtMethod == 'DAC' ||
				pmtMethod == 'PLC' ||
				pmtMethod == 'CHK' ||
				pmtMethod == 'CCR' ||
				pmtMethod == 'NRG' ||
				pmtMethod == 'URG'
			) {
				var orgnDepAcctIDNode = addNodeFromParentNode(xmlDoc, pmtRecNode, 'OrgnrDepAcctID');
				var odepacctIdNode = addNodeFromParentNode(xmlDoc, orgnDepAcctIDNode, 'DepAcctID');

				if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getText('custrecord_acct_map_ext_bank_account_typ')))
					setAttributeValue(odepacctIdNode, 'AcctType', objAcctMapping[0].getText('custrecord_acct_map_ext_bank_account_typ'));

				if (pmtMethod != 'CCR') {
					if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_origin_acc')))
						setAttributeValue(odepacctIdNode, 'AcctID', objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_origin_acc'));
				} else {
					if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_credit_card_man')))
						setAttributeValue(odepacctIdNode, 'AcctID', objAcctMapping[0].getValue('custrecord_acct_map_credit_card_man'));
				}

				if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_account_currency')))
					setAttributeValue(odepacctIdNode, 'AcctCur', arrCurrMap[objAcctMapping[0].getValue('custrecord_acct_map_account_currency')]);

				var bankInfoNode = addNodeFromParentNode(xmlDoc, odepacctIdNode, 'BankInfo');
				if (!isEmpty(objVDCRecResults)) setAttributeValue(bankInfoNode, 'Name', objVDCRecResults[0].getValue('custrecord_bankname'));

				if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getText('custrecord_acct_map_ext_bank_id_type')))
					setAttributeValue(bankInfoNode, 'BankIDType', objAcctMapping[0].getText('custrecord_acct_map_ext_bank_id_type'));

				if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id')))
					addTextNodeFromParentNode(xmlDoc, bankInfoNode, 'BankID', objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id'));

				if (pmtMethod != 'CHK') {
					var orgrefInfoNode = addNodeFromParentNode(xmlDoc, bankInfoNode, 'RefInfo');

					if (pmtMethod == 'NRG' || pmtMethod == 'URG') {
						if (!isEmpty(objVDCRecResults)) setAttributeValue(orgrefInfoNode, 'RefType', 'ACH');
					} else {
						if (!isEmpty(objVDCRecResults))
							setAttributeValue(orgrefInfoNode, 'RefType', objVDCRecResults[0].getValue(MSG_TYPE[pmtMethod]));
					}

					if (
						(pmtMethod == 'IAC' || pmtMethod == 'NRG') &&
						!isEmpty(objAcctMapping) &&
						!isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_inter_ach_co_id'))
					) {
						addTextNodeFromParentNode(
							xmlDoc,
							orgrefInfoNode,
							'RefID',
							objAcctMapping[0].getValue('custrecord_acct_map_inter_ach_co_id')
						);
					} else if (
						(pmtMethod == 'ACH' || pmtMethod == 'DAC') &&
						!isEmpty(objAcctMapping) &&
						!isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_dom_ach_co_id'))
					) {
						addTextNodeFromParentNode(xmlDoc, orgrefInfoNode, 'RefID', objAcctMapping[0].getValue('custrecord_acct_map_dom_ach_co_id'));
					}
				}

				if (pmtMethod == 'NRG' || pmtMethod == 'URG') {
					if (!isEmpty(objVDCRecResults)) {
						var postAddrNode = addNodeFromParentNode(xmlDoc, bankInfoNode, 'PostAddr');
						addTextNodeFromParentNode(xmlDoc, postAddrNode, 'City', objVDCRecResults[0].getValue('custrecord_ica_orig_bank_city'));
						addTextNodeFromParentNode(
							xmlDoc,
							postAddrNode,
							'Country',
							objVDCRecResults[0].getValue('custrecord_ica_orig_bank_country_code')
						);
					}
				}
			}

			// END: OrgnrDepAcctID
			// dLog('creatXMLDoc', 'End: OrgnrDepAcctID Node');

			// START: RcvrParty
      dLog('Adding RcvrParty', pmtMethod);
			if (
				pmtMethod == 'IAC' ||
				pmtMethod == 'MTS' ||
				pmtMethod == 'IWI' ||
				pmtMethod == 'ACH' ||
				pmtMethod == 'DAC' ||
				pmtMethod == 'PLC' ||
				pmtMethod == 'CHK' ||
				pmtMethod == 'CCR' ||
				pmtMethod == 'NRG' ||
				pmtMethod == 'URG'
			) {
				var rcvrPartyNode = addNodeFromParentNode(xmlDoc, pmtRecNode, 'RcvrParty');
        var rcvrPartyNameNode = addNodeFromParentNode(xmlDoc, rcvrPartyNode, 'Name');
        
        if (USE_CHECK_ADDR=='T' && checkData != undefined) { 
          if (checkData!=undefined && !isEmpty(checkData.custbody_ica_vendor_name)) {            
            dLog('Adding checkData.custbody_ica_vendor_name', checkData.custbody_ica_vendor_name);
            addTextNodeFromParentNode(xmlDoc, rcvrPartyNameNode, 'Name1', checkData.custbody_ica_vendor_name);
          } else {
            if (!isEmpty(objVendor.vendorname)) {
              dLog('Adding objVendor.vendorname', objVendor.vendorname);
              addTextNodeFromParentNode(xmlDoc, rcvrPartyNameNode, 'Name1', objVendor.vendorname);
            }    
          }  
        } else {
          if (!isEmpty(objVendor.vendorname)) {
            dLog('Adding objVendor.vendorname', objVendor.vendorname);
            addTextNodeFromParentNode(xmlDoc, rcvrPartyNameNode, 'Name1', objVendor.vendorname);
          }  
        }


				//RefInfo Change March 9 - RSF
				if (pmtMethod == 'NRG' || pmtMethod == 'URG') {
					var ccrRefType =
						!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_ccr_reftype'))
							? objVDCRecResults[0].getValue('custrecord_ccr_reftype')
							: '';
					var refType = ccrRefType ? ccrRefType : 'VN';
					var refInfoNode = addNodeFromParentNode(xmlDoc, rcvrPartyNode, 'RefInfo');

					if (refType) setAttributeValue(refInfoNode, 'RefType', refType);

					dLog('objVendor - URG/NRG', JSON.stringify(objVendor));
					dLog('objVendor - URG/NRG - payeeId', payeeId);
					addTextNodeFromParentNode(xmlDoc, refInfoNode, 'RefID', objVendor.internalid);
				} else {
					if (OVERWRITE_REFINFO == 'F') {
						var ccrRefType =
							!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_ccr_reftype'))
								? objVDCRecResults[0].getValue('custrecord_ccr_reftype')
								: '';
						// as per Al on 4th May 2016
						// On the VPM: Vendor Profile Tab: custentity_vendorreftype,
						// (XML: RefType = VN) please default this value to 'VN' in your
						// code, I don't want to use this field anymore.
						// var refType = (pmtMethod != 'CCR') ? objVendor.vreftype :
						// ccrRefType;
						var refType = ccrRefType ? ccrRefType : 'VN';
						var refInfoNode = addNodeFromParentNode(xmlDoc, rcvrPartyNode, 'RefInfo');

						if (refType) setAttributeValue(refInfoNode, 'RefType', refType);

						// if (!isEmpty(payeeId))
						// 	addTextNodeFromParentNode(xmlDoc, refInfoNode, 'RefID', payeeId);

						var refIDTxt = '';
						if (DEFAULT_MSG_VENDOR_ID == 'T') {
							refIDTxt = objVendor.custentity_ica_vendor_external_id;
						}

						// else {
						// 	if (!isEmpty(payeeId))
						// 		addTextNodeFromParentNode(xmlDoc, refInfoNode, 'RefID', payeeId);
						// }

						if (!isEmpty(refIDTxt)) addTextNodeFromParentNode(xmlDoc, refInfoNode, 'RefID', refIDTxt || payeeId);
						else {
							addTextNodeFromParentNode(xmlDoc, refInfoNode, 'RefID', payeeId);
						}
					} else {
						if (CUSTOM_REFINFO) {
							dLog('CUSTOM_REFINFO', objVendor[CUSTOM_REFINFO]);
							var refInfoNode = addNodeFromParentNode(xmlDoc, rcvrPartyNode, 'RefInfo');
							setAttributeValue(refInfoNode, 'RefType', 'VN');
							addTextNodeFromParentNode(xmlDoc, refInfoNode, 'RefID', objVendor[CUSTOM_REFINFO] || payeeId);
						} else {
							dLog('Did not add RefInfo', '');
							// Dont add RefInfo node
						}
					}
				}

				var rPPostAddrNode = '';
        if (USE_CHECK_ADDR=='T' && checkData != undefined) {

          if (
            !isEmpty(objBillsData[billId].custbody_ica_vendor_name) ||
            !isEmpty(objBillsData[billId].custbody_ica_vendor_add_line_1) ||
            !isEmpty(objBillsData[billId].custbody_ica_vendor_add_line_2) ||
            !isEmpty(objBillsData[billId].custbody_ica_vendor_city) ||            
            !isEmpty(objBillsData[billId].custbody_ica_vendor_state) ||
            !isEmpty(objBillsData[billId].custbody_ica_zip_postal_code) ||
            !isEmpty(objBillsData[billId].custbody_ica_country_code) 
          ) {
            rPPostAddrNode = addNodeFromParentNode(xmlDoc, rcvrPartyNode, 'PostAddr');
          }
          dAudit('RcvrParty', 'Using DEFAULT Address');
          if (!isEmpty(objBillsData[billId].custbody_ica_vendor_add_line_1)) 
            addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, 'Addr1', objBillsData[billId].custbody_ica_vendor_add_line_1);
          if (!isEmpty(objBillsData[billId].custbody_ica_vendor_add_line_2)) 
            addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, 'Addr2', objBillsData[billId].custbody_ica_vendor_add_line_2);
          if (!isEmpty(objBillsData[billId].custbody_ica_vendor_city)) 
            addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, 'City', objBillsData[billId].custbody_ica_vendor_city);
          if (!isEmpty(objBillsData[billId].custbody_ica_vendor_state))
            addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, 'StateProv', objBillsData[billId].custbody_ica_vendor_state);
          if (!isEmpty(objBillsData[billId].custbody_ica_zip_postal_code))
            addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, 'PostalCode', objBillsData[billId].custbody_ica_zip_postal_code);
    
          if (!isEmpty(objBillsData[billId].custbody_ica_country_code)) {
            addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, 'Country', countryCodeMapping[objBillsData[billId].custbody_ica_country_code]);
            addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, 'CountryName', cmMapping[objBillsData[billId].custbody_ica_country_code]);
          }
  
        } else {
          if (
            !isEmpty(objVendor.vendoraddrs1) ||
            !isEmpty(objVendor.vendoraddrs2) ||
            !isEmpty(objVendor.vendorcity) ||
            !isEmpty(objVendor.vendorstateprovince) ||
            (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_comppostcode'))) ||
            !isEmpty(objVendor.vendorpostal) ||
            !isEmpty(objVendor.vendorcountrycode)
          ) {
            rPPostAddrNode = addNodeFromParentNode(xmlDoc, rcvrPartyNode, 'PostAddr');
          }
          dAudit('RcvrParty', 'Using DEFAULT Address');
          if (!isEmpty(objVendor.vendoraddrs1)) addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, 'Addr1', objVendor.vendoraddrs1);
          if (!isEmpty(objVendor.vendoraddrs2)) addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, 'Addr2', objVendor.vendoraddrs2);
          if (!isEmpty(objVendor.vendorcity)) addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, 'City', objVendor.vendorcity);
          if (!isEmpty(objVendor.vendorstateprovince))
            addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, 'StateProv', objVendor.vendorstateprovince);
  
          if (pmtMethod == 'CCR') {
            if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_comppostcode')))
              addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, 'PostalCode', objVDCRecResults[0].getValue('custrecord_comppostcode'));
  
            var contactInfoNode = addNodeFromParentNode(xmlDoc, rcvrPartyNode, 'ContactInfo');
  
            if (!isEmpty(objVendor) && !isEmpty(objVendor.vemailadrs))
              addTextNodeFromParentNode(xmlDoc, contactInfoNode, 'EmailAddr', objVendor.vemailadrs);
          } else {
            if (!isEmpty(objVendor.vendorpostal)) addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, 'PostalCode', objVendor.vendorpostal);
          }
  
          if (!isEmpty(objVendor.vendorcountrycode)) {
            addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, 'Country', countryCodeMapping[objVendor.vendorcountrycode]);
            addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, 'CountryName', objVendor.vendorcountrycode);
          }  
        }

				// }
			}
			// END: RcvrParty
			// dLog('creatXMLDoc', 'End: RcvrParty Node');

			// START: DeliveryParty
			if (pmtMethod == 'CHK') {
				var billId = arrVendorBills[v][0];
				var fmAddr = _.find(fleetMappingJSON, function (o) {
					var vname = String(objVendor.vendorname.toLowerCase());
					dAudit(
						'vname',
						JSON.stringify({
							vname: vname,
						})
					);
					return vname.indexOf(String(o.vendorname.toLowerCase())) != -1;
				});
				dAudit(
					'objBillsData',
					JSON.stringify({
						objBillsData: objBillsData,
					})
				);

				dAudit(
					'DeliveryParty Details',
					JSON.stringify({
						billId: billId,
						fleet: objBillsData[billId].fleet,
						USE_CUSTOM_ADDRESSES: USE_CUSTOM_ADDRESSES,
						fmAddr: fmAddr,
					})
				);
				if (USE_CUSTOM_ADDRESSES == 'T' && fmAddr && objBillsData[billId].fleet == 'T') {
					dAudit('Adding deliveryParty', '');
					if (!isEmpty(fmAddr.vendoreplacementname.address)) {
						var deliveryPartyNode = addNodeFromParentNode(xmlDoc, pmtRecNode, 'DeliveryParty');
						if (!isEmpty(fmAddr.vendoreplacementname.address.name)) {
							var deliveryPartyNameNode = addNodeFromParentNode(xmlDoc, deliveryPartyNode, 'Name');
							addTextNodeFromParentNode(xmlDoc, deliveryPartyNameNode, 'Name1', fmAddr.vendoreplacementname.address.name);
						}

						var rPPostAddrNode = '';
						rPPostAddrNode = addNodeFromParentNode(xmlDoc, deliveryPartyNode, 'PostAddr');
						dAudit('objBillsData[billId].fleet', 'Using Vendor Replacement Address');

						dLog('Fleet Address For ', JSON.stringify(objVendor));
						var addr = fmAddr.vendoreplacementname.address;

						if (!isEmpty(addr.addrline1)) addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, 'Addr1', addr.addrline1);
						if (!isEmpty(addr.addrline2)) addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, 'Addr2', addr.addrline2);
						addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, 'City', addr.city);
						addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, 'StateProv', addr.state);
						addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, 'PostalCode', addr.zip);
						if (!isEmpty(addr.countrycode)) {
							addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, 'Country', countryCodeMapping[addr.countrycode]);
							addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, 'CountryName', addr.countrycode);
						}
					}
				}
			}
			// END: RcvrParty
			// dLog('creatXMLDoc', 'End: RcvrParty Node');

			if (pmtMethod == 'CCR') {
				// dLog('creatXMLDoc', 'Start: PmtSuppCCR');
				// START: PmtSuppCCR

				var pmtSuppCCRNode = addNodeFromParentNode(xmlDoc, pmtRecNode, 'PmtSuppCCR');

				// if (!isEmpty(objVendor.merchantid))
				// 	addTextNodeFromParentNode(xmlDoc, pmtSuppCCRNode, 'MerchantID', objVendor.merchantid);

				dAudit('DEFAULT_MSG_VENDOR_ID', DEFAULT_MSG_VENDOR_ID);
				var merchantIDTxt = '';
				if (DEFAULT_MSG_VENDOR_ID == 'T') {
					merchantIDTxt = objVendor.custentity_ica_vendor_external_id;
				} else {
					if (!isEmpty(objVendor.merchantid)) addTextNodeFromParentNode(xmlDoc, pmtSuppCCRNode, 'MerchantID', objVendor.merchantid);
				}

				if (!isEmpty(merchantIDTxt)) addTextNodeFromParentNode(xmlDoc, pmtSuppCCRNode, 'MerchantID', merchantIDTxt);

				if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_credit_card_div_num')))
					addTextNodeFromParentNode(
						xmlDoc,
						pmtSuppCCRNode,
						'Division',
						objAcctMapping[0].getValue('custrecord_acct_map_credit_card_div_num')
					);

				// END: PmtSuppCCR
				// dLog('creatXMLDoc', 'End: PmtSuppCCR');
			}

			// START: RcvrDepAcctID
			if (pmtMethod != 'CHK') {
				if (
					pmtMethod == 'IAC' ||
					pmtMethod == 'MTS' ||
					pmtMethod == 'IWI' ||
					pmtMethod == 'ACH' ||
					pmtMethod == 'DAC' ||
					pmtMethod == 'PLC' ||
					pmtMethod == 'CCR' ||
					pmtMethod == 'NRG' ||
					pmtMethod == 'URG'
				) {
					var rcvrDeptAcctID = addNodeFromParentNode(xmlDoc, pmtRecNode, 'RcvrDepAcctID');
					var rdeptAcctIdNode = addNodeFromParentNode(xmlDoc, rcvrDeptAcctID, 'DepAcctID');
					if (!isEmpty(objVendor.recpartyaccount)) setAttributeValue(rdeptAcctIdNode, 'AcctID', objVendor.recpartyaccount);

					// As per Al on 4th May | On the VPM: Payment Profile Tab:
					// custentity_recpartyaccttype,
					// (XML: AcctType = D) please default this value to 'D' in your
					// code, I don't want to use this field anymore.
					// if (!isEmpty(objVendor.recpartyaccttype))
          if (!isEmpty(objVendor.recpartyaccttype)) setAttributeValue(rdeptAcctIdNode, 'AcctType', objVendor.recpartyaccttype);
          else setAttributeValue(rdeptAcctIdNode, 'AcctType', 'D');

					if (!isEmpty(currId)) setAttributeValue(rdeptAcctIdNode, 'AcctCur', arrCurrMap[currId]);

					var rbankInfoNode = addNodeFromParentNode(xmlDoc, rdeptAcctIdNode, 'BankInfo');
					if (!isEmpty(objVendor.vbankname)) setAttributeValue(rbankInfoNode, 'Name', objVendor.vbankname);
					if (!isEmpty(objVendor.recbankprimidtype)) setAttributeValue(rbankInfoNode, 'BankIDType', objVendor.recbankprimidtype);

					if (
						(pmtMethod == 'IAC' || pmtMethod == 'IWI' || pmtMethod == 'MTS' || pmtMethod == 'NRG' || pmtMethod == 'URG') &&
						!isEmpty(objVendor.bankid)
					)
						setAttributeValue(rbankInfoNode, 'BranchID', objVendor.bankid);

					var rpostAddrNode = '';
					if (
						!isEmpty(objVendor.vbankaddrs1) ||
						!isEmpty(objVendor.vbankstate) ||
						!isEmpty(objVendor.vbankcity) ||
						!isEmpty(objVendor.vbankzip) ||
						!isEmpty(objVendor.vbankcountry)
					) {
						rpostAddrNode = addNodeFromParentNode(xmlDoc, rbankInfoNode, 'PostAddr');
					}

					if (pmtMethod != 'IAC') {
						if (!isEmpty(objVendor.vbankaddrs1)) addTextNodeFromParentNode(xmlDoc, rpostAddrNode, 'Addr1', objVendor.vbankaddrs1);
						if (!isEmpty(objVendor.vbankstate)) addTextNodeFromParentNode(xmlDoc, rpostAddrNode, 'StateProv', objVendor.vbankstate);
					}

					if (!isEmpty(objVendor.vbankcity)) addTextNodeFromParentNode(xmlDoc, rpostAddrNode, 'City', objVendor.vbankcity);

					if (!isEmpty(objVendor.vbankzip)) addTextNodeFromParentNode(xmlDoc, rpostAddrNode, 'PostalCode', objVendor.vbankzip);

					if (!isEmpty(objVendor.vbankcountry))
						addTextNodeFromParentNode(xmlDoc, rpostAddrNode, 'Country', countryCodeMapping[objVendor.vbankcountry]);

					if (!isEmpty(objVendor.recbankprimid)) addTextNodeFromParentNode(xmlDoc, rbankInfoNode, 'BankID', objVendor.recbankprimid);
				}
			}
			// END: RcvrDepAcctID

			// START : IntermediaryDepAccID
			if (pmtMethod == 'MTS' || pmtMethod == 'IAC' || pmtMethod == 'NRG') {
        if (!isEmpty(objVendor.custentity_inter_bank_name)) {
          var intermediaryDepAccID = addNodeFromParentNode(xmlDoc, pmtRecNode, 'IntermediaryDepAcctID');
          var iDeptAcctIdNode = addNodeFromParentNode(xmlDoc, intermediaryDepAccID, 'DepAcctID');
          var iBankInfoNode = addNodeFromParentNode(xmlDoc, iDeptAcctIdNode, 'BankInfo');
  
          if (!isEmpty(objVendor.custentity_inter_bank_id_type))
            setAttributeValue(iBankInfoNode, 'BankIDType', objVendor.custentity_inter_bank_id_type);
  
           setAttributeValue(iBankInfoNode, 'Name', objVendor.custentity_inter_bank_name);
  
          if (!isEmpty(objVendor.custentity_inter_bank_id)) {
            // If Bank ID is ABA, enter the 9 digit ABA routing/transit
            // number.
            // If BankID Type is SWT, enter 8 or 11 character SWIFT BIC
            // code.
            // If BankIDType is CHP enter the 4 digit CHP participant
            // ID.
  
            addTextNodeFromParentNode(xmlDoc, iBankInfoNode, 'BankID', objVendor.custentity_inter_bank_id);  
        }
				}

				var iPostAddrNode = '';
				if (
					!isEmpty(objVendor.custentity_inter_bank_address_1) ||
					!isEmpty(objVendor.custentity_inter_bank_city) ||
					!isEmpty(objVendor.custentity_inter_bank_state) ||
					!isEmpty(objVendor.custentity_inter_bank_postal) ||
					!isEmpty(objVendor.custentity_inter_bank_country)
				) {
					iPostAddrNode = addNodeFromParentNode(xmlDoc, iBankInfoNode, 'PostAddr');
				}

				if (!isEmpty(objVendor.custentity_inter_bank_address_1))
					addTextNodeFromParentNode(xmlDoc, iPostAddrNode, 'Addr1', objVendor.custentity_inter_bank_address_1);

				if (!isEmpty(objVendor.custentity_inter_bank_city))
					addTextNodeFromParentNode(xmlDoc, iPostAddrNode, 'City', objVendor.custentity_inter_bank_city);

				if (!isEmpty(objVendor.custentity_inter_bank_state))
					addTextNodeFromParentNode(xmlDoc, iPostAddrNode, 'StateProv', objVendor.custentity_inter_bank_state);

				if (!isEmpty(objVendor.custentity_inter_bank_postal))
					addTextNodeFromParentNode(xmlDoc, iPostAddrNode, 'PostalCode', objVendor.custentity_inter_bank_postal);

				if (!isEmpty(objVendor.custentity_inter_bank_country))
					addTextNodeFromParentNode(xmlDoc, iPostAddrNode, 'Country', countryCodeMapping[objVendor.custentity_inter_bank_country]);
			}
			// END : IntermediaryDepAccID

			var arrBills = arrVendorBills[payeeId + 'X@X' + currId];

			var pmtRecCurAmt = 0;
			var tmpAmt = 0;

			for (bill in arrBills) {
				pmtRecCurAmt += getFloatVal(arrBillAmt[arrBills[bill]]);
			}

			// START: PmtDetail

			if (pmtMethod == 'B2P') {
				for (y in arrBills) {
					var billId = arrBills[y];

					var netAmt = 0;
					var origAmt = getFloatVal(arrBillAmtOrig[billId]);
					var amt = getFloatVal(arrBillAmt[billId]);
					var discAmt = !isEmpty(arrBillDiscAmt[billId]) ? getFloatVal(arrBillDiscAmt[billId]) : 0;
					netAmt = amt;
					tmpAmt += netAmt;
				}
				dLog('b2p.creatXMLDoc', 'tmpAmt = ' + tmpAmt);
				dLog('b2p.creatXMLDoc', 'pmtRecCurAmt = ' + pmtRecCurAmt);
			}

			if (checkData == undefined) {
				if (
					pmtMethod == 'IAC' ||
					pmtMethod == 'MTS' ||
					pmtMethod == 'IWI' ||
					pmtMethod == 'PLC' ||
					pmtMethod == 'CCR' ||
					pmtMethod == 'NRG' ||
					pmtMethod == 'URG'
				) {
					if (arrBills != null) var pmtDetailsNode = addNodeFromParentNode(xmlDoc, pmtRecNode, 'PmtDetail');

					for (y in arrBills) {
						var billId = arrBills[y];
						dLog('creatXMLDoc', 'billId = ' + billId);

						var pmtInvoiceInfoNode = addNodeFromParentNode(xmlDoc, pmtDetailsNode, 'InvoiceInfo');

						if (!isEmpty(objVDCRecResults)) {
							setAttributeValue(pmtInvoiceInfoNode, 'InvoiceType', objVDCRecResults[0].getValue('custrecord_invoicetype'));
						} else {
							setAttributeValue(pmtInvoiceInfoNode, 'InvoiceType', '');
						}

						if (
							pmtMethod == 'CHK' ||
							pmtMethod == 'DAC' ||
							pmtMethod == 'CCR' ||
							pmtMethod == 'IWI' ||
							pmtMethod == 'MTS' ||
							pmtMethod == 'IAC' ||
							pmtMethod == 'CCR' ||
							pmtMethod == 'NRG' ||
							pmtMethod == 'URG'
						) {
							var netAmt = 0;
							var origAmt = getFloatVal(arrBillAmtOrig[billId]);
							var amt = getFloatVal(arrBillAmt[billId]);

							// dLog('creatXMLDoc', 'origAmt = ' + origAmt);
							// dLog('creatXMLDoc', 'amt = ' + amt);

							var discAmt = !isEmpty(arrBillDiscAmt[billId]) ? getFloatVal(arrBillDiscAmt[billId]) : 0;

							// tmpAmt += amt;
							netAmt = amt;
							tmpAmt += netAmt;

							dLog('creatXMLDoc', 'netAmt = ' + netAmt);
							dLog('creatXMLDoc', 'tmpAmt' + tmpAmt);

							// TODO : this may be deleted, in the UI discount is already
							// calculated.
							if (discAmt > 0) {
								// netAmt -= discAmt;
								// tmpAmt -= discAmt;
							}

							// Sep 8, 2016 : As per AL test, need to add DAC as of the
							// criteria
							// if (pmtMethod != 'DAC' &&
							// !isEmpty(arrBillCredits[billId])) {
							if (!isEmpty(arrBillCredits[billId])) {
								var arrBC = arrBillCredits[billId];

								for (bc in arrBC) {
									var pmtInvoiceInfoNodeCR = addNodeFromParentNode(xmlDoc, pmtDetailsNode, 'InvoiceInfo');
									setAttributeValue(pmtInvoiceInfoNodeCR, 'InvoiceType', 'CM');
									setAttributeValue(pmtInvoiceInfoNodeCR, 'InvoiceNum', arrBC[bc].bcnum);

									var billCreditAmtP = getFloatVal(arrBC[bc].bcamt);
									var billCreditAmt = billCreditAmtP * -1;

									// pmtTotalAmt = (pmtTotalAmt - billCreditAmtP);
									// pmtRecCurAmt = (pmtRecCurAmt - billCreditAmtP);

									// tmpAmt = (tmpAmt - billCreditAmtP);
									// netAmt = (netAmt - billCreditAmtP);

									setAttributeValue(pmtInvoiceInfoNodeCR, 'EffDt', formatDate(nlapiStringToDate(arrBC[bc].bcdate)));
									setAttributeValue(pmtInvoiceInfoNodeCR, 'NetCurAmt', billCreditAmt.toFixed(2));
									setAttributeValue(pmtInvoiceInfoNodeCR, 'TotalCurAmt', billCreditAmt.toFixed(2));

									// pmtRecCurAmt += billCreditAmt;
									// pmtTotalAmt += billCreditAmt;

									if (!isEmpty(arrBC[bc].bcmemo)) {
										var pmtdNoteNodeCRBC = addNodeFromParentNode(xmlDoc, pmtInvoiceInfoNodeCR, 'Note');
										setAttributeValue(pmtdNoteNodeCRBC, 'NoteType', 'INV');
										addTextNodeFromParentNode(
											xmlDoc,
											pmtdNoteNodeCRBC,
											'NoteText',
											(isEmpty(arrBC[bc].bcmemo) ? '' : setValue(arrBC[bc].bcmemo)).replace(/\*/g, '')
										);
									}
								}
							}

							setAttributeValue(
								pmtInvoiceInfoNode,
								'InvoiceNum',
								isEmpty(objBillsData[billId]) ? '' : setValue(objBillsData[billId].num)
							);
							setAttributeValue(pmtInvoiceInfoNode, 'TotalCurAmt', origAmt.toFixed(2));
							// setAttributeValue(pmtInvoiceInfoNode, 'NetCurAmt',
							// amt.toFixed(2));
							setAttributeValue(pmtInvoiceInfoNode, 'NetCurAmt', netAmt.toFixed(2));

							if (!isEmpty(objBillsData[billId])) {
								if (!isEmpty(objBillsData[billId].memo)) {
									var pmtdNoteNodeCR = addNodeFromParentNode(xmlDoc, pmtInvoiceInfoNode, 'Note');
									setAttributeValue(pmtdNoteNodeCR, 'NoteType', 'INV');

									addTextNodeFromParentNode(
										xmlDoc,
										pmtdNoteNodeCR,
										'NoteText',
										(isEmpty(objBillsData[billId]) ? '' : setValue(objBillsData[billId].memo)).replace(/\*/g, '')
									);
								}
							}

							setAttributeValue(pmtInvoiceInfoNode, 'DiscountCurAmt', discAmt.toFixed(2));

							var invoiceDate = objBillsData[billId].dte;
							if ((pmtMethod == 'CHK' || pmtMethod == 'CCR' || pmtMethod == 'DAC') && !isEmpty(invoiceDate))
								setAttributeValue(pmtInvoiceInfoNode, 'EffDt', formatDate(nlapiStringToDate(invoiceDate)));

							// Add PO Num
							if (!isEmpty(arrBillPO[billId])) {
								var poInfoNode = addNodeFromParentNode(xmlDoc, pmtInvoiceInfoNode, 'POInfo');
								setAttributeValue(poInfoNode, 'POType', 'PO');

								addTextNodeFromParentNode(xmlDoc, poInfoNode, 'PONum', arrBillPO[billId]);
							}
						} else {
							if (!isEmpty(arrBillCredits[billId])) {
								var arrBC = arrBillCredits[billId];

								for (bc in arrBC) {
									var pmtInvoiceInfoNodeCR = addNodeFromParentNode(xmlDoc, pmtDetailsNode, 'InvoiceInfo');
									setAttributeValue(
										pmtInvoiceInfoNodeCR,
										'InvoiceType',
										objVDCRecResults[0].getValue('custrecord_invoicetype')
									);
									setAttributeValue(pmtInvoiceInfoNodeCR, 'InvoiceNum', arrBC[bc].bcnum);
								}
							}
						}

						try {
							if (nlapiGetContext().getRemainingUsage() < 1000) {
								nlapiLogExecution('AUDIT', 'yieldIfRequired', '*** Yielding ***');

								var tempEMAIL_SENDER = EMAIL_SENDER;
								var tempEMAIL_SENDER_EMAIL = EMAIL_SENDER_EMAIL;
								var tempSUB_ID = SUB_ID;
								var tempACCOUNT = ACCOUNT;
								var tempAPACCOUNT = APACCOUNT;
								var tempBPM_DATE = BPM_DATE;
                var tempPROCESSASCHECK = PROCESS_AS_CHECK;

								var yieldObject = nlapiYieldScript();
								nlapiLogExecution('AUDIT', 'yieldIfRequired', 'Yield size: ', yieldObject.size);
								if (yieldObject.status !== 'RESUME') {
									nlapiLogExecution('ERROR', 'yieldIfRequired', 'Yield status: ' + yieldObject.status, yieldObject.reason);
									throw nlapiCreateError('YIELD_ERROR', yieldObject.reason);
								}
								nlapiLogExecution(
									'AUDIT',
									'yieldIfRequired',
									'*** Resuming from Yield ***',
									yieldObject ? yieldObject.size || '' : ''
								);

								EMAIL_SENDER = tempEMAIL_SENDER;
								EMAIL_SENDER_EMAIL = tempEMAIL_SENDER_EMAIL;
								SUB_ID = tempSUB_ID;
								ACCOUNT = tempACCOUNT;
								APACCOUNT = tempAPACCOUNT;
								BPM_DATE = tempBPM_DATE;
                PROCESS_AS_CHECK = tempPROCESSASCHECK;

								var objLog = {
									EMAIL_SENDER: EMAIL_SENDER,
									EMAIL_SENDER_EMAIL: EMAIL_SENDER_EMAIL,
									SUB_ID: SUB_ID,
									ACCOUNT: ACCOUNT,
									APACCOUNT: APACCOUNT,
									BPM_DATE: BPM_DATE,
                  PROCESS_AS_CHECK: PROCESS_AS_CHECK
								};
								dAudit('yielded', JSON.stringify(objLog));
							}

							var plcRes = nlapiSearchRecord(
								'transaction',
								null,
								[['type', 'anyof', 'LiabPymt'], 'AND', ['mainline', 'is', 'F'], 'AND', ['internalid', 'is', billId]],
								[
									new nlobjSearchColumn('mainline'),
									new nlobjSearchColumn('trandate').setSort(false),
									new nlobjSearchColumn('tranid'),
									new nlobjSearchColumn('entity'),
									new nlobjSearchColumn('amount'),
									new nlobjSearchColumn('amountpaid'),
									new nlobjSearchColumn('memomain'),
									// new nlobjSearchColumn("custbody_ica_pl_status"),
									new nlobjSearchColumn('line'),
									new nlobjSearchColumn('name', 'payrollItem', null),
								]
							);
							// var tmpAmt = 0;
							var memo = null;
							var tranid = null;
							if (plcRes != null) {
								for (var j = 0; j < plcRes.length; j++) {
									dAudit('plcRes', JSON.stringify(plcRes[j]));
									var amt = Math.abs(plcRes[j].getValue('amount'));
									var pmtInvoiceInfoNodeCR = addNodeFromParentNode(xmlDoc, pmtDetailsNode, 'InvoiceInfo');
									setAttributeValue(pmtInvoiceInfoNodeCR, 'InvoiceType', 'IV');

									try {
										setAttributeValue(
											pmtInvoiceInfoNodeCR,
											'InvoiceNum',
											plcRes[j].getValue('name', 'payrollitem', null) + '_' + plcRes[j].getText('entity')
										); //ITEM_VENDOR
									} catch (e) {
										setAttributeValue(
											pmtInvoiceInfoNodeCR,
											'InvoiceNum',
											plcRes[j].getValue('line') + '_' + plcRes[j].getText('entity')
										); //ITEM_VENDOR
									}

									setAttributeValue(pmtInvoiceInfoNodeCR, 'NetCurAmt', numeral(amt).format('0.00'));
									setAttributeValue(pmtInvoiceInfoNodeCR, 'TotalCurAmt', numeral(amt).format('0.00')); //getFloatVal(amt)

									if (!isEmpty(plcRes[j].getValue('memomain'))) {
										memo = plcRes[j].getValue('memomain');
									}
									if (!isEmpty(plcRes[j].getValue('tranid'))) {
										tranid = plcRes[j].getValue('tranid');
									}

									tmpAmt += Number(amt);
								}
							}
							if (memo != null) {
								var pmtdNoteNodeCRBC = addNodeFromParentNode(xmlDoc, pmtInvoiceInfoNodeCR, 'Note');
								setAttributeValue(pmtdNoteNodeCRBC, 'NoteType', 'INV');
								addTextNodeFromParentNode(xmlDoc, pmtdNoteNodeCRBC, 'NoteText', memo.replace(/\*/g, ''));
							}
							// setTextNodeValueFromPath(pmtRecNode, 'PmtID', billId);

							dAudit('tranid', tranid);
							dAudit('arrBillPaymentMap[payeeId]', arrBillPaymentMap[payeeId]);

							if (!isEmpty(tranid)) {
								setTextNodeValueFromPath(pmtRecNode, 'PmtID', tranid);
							} else {
								setTextNodeValueFromPath(pmtRecNode, 'PmtID', arrBillPaymentMap[payeeId]); //billId
							}

							if (!hasChkNum) {
								var chkNumPLC = tranid || billId;
								dLog('adding ChkNum', chkNumPLC);
								addTextNodeFromParentNode(xmlDoc, chkNode, 'ChkNum', chkNumPLC);
							}
						} catch (e) {
							// dErr('PLC Error. ', e.message);
							// dErr('PLC Process', 'Account PLC not enabled, ignore this.');
							yieldIfRequired(100);
						}
					}
				} else if (pmtMethod == 'CHK' || pmtMethod == 'ACH' || pmtMethod == 'DAC') {
					var pmtDetailsNode = addNodeFromParentNode(xmlDoc, pmtRecNode, 'PmtDetail');
					for (y in arrBills) {
						var billId = arrBills[y];
						var customDefData = _.find(arrCustomDefinition, { internalid: String(billId) });
						dLog('creatXMLDoc', 'customDefData = ' + JSON.stringify(customDefData));

						var netAmt = 0;
						var origAmt = getFloatVal(arrBillAmtOrig[billId]);
						var amt = getFloatVal(arrBillAmt[billId]);
						var discAmt = !isEmpty(arrBillDiscAmt[billId]) ? getFloatVal(arrBillDiscAmt[billId]) : 0;
						netAmt = amt;
						tmpAmt += netAmt;
						dLog('creatXMLDoc', 'customDefData = ' + JSON.stringify(customDefData));

						if (customDefData != undefined && !customDefData.ncd) {
							if (
								customDefData.InvoiceNum ||
								customDefData.TotalCurAmt ||
								customDefData.NetCurAmt ||
								customDefData.DiscountCurAmt ||
								customDefData.PONum ||
								customDefData.NoteText ||
								customDefData.EffDt
							) {
								var pmtInvoiceInfoNode = addNodeFromParentNode(xmlDoc, pmtDetailsNode, 'InvoiceInfo');

								if (!isEmpty(objVDCRecResults)) {
									setAttributeValue(
										pmtInvoiceInfoNode,
										'InvoiceType',
										objVDCRecResults[0].getValue('custrecord_invoicetype')
									);
								} else {
									setAttributeValue(pmtInvoiceInfoNode, 'InvoiceType', '');
								}

								if (customDefData.EffDt) {
									var d = nlapiStringToDate(customDefData[customDefData.EffDt]);
									var momentD = moment(d);
									if (momentD.isValid()) {
										setAttributeValue(pmtInvoiceInfoNode, 'EffDt', momentD.format('YYYY-MM-DD') || '');
									}
								}

								if (customDefData.InvoiceNum) {
									setAttributeValue(pmtInvoiceInfoNode, 'InvoiceNum', customDefData[customDefData.InvoiceNum]);
								}
								if (customDefData.TotalCurAmt) {
									if (isNaN(customDefData[customDefData.TotalCurAmt])) {
										// setAttributeValue(pmtInvoiceInfoNode, 'TotalCurAmt', checkData[checkData.TotalCurAmt]);
									} else {
										setAttributeValue(
											pmtInvoiceInfoNode,
											'TotalCurAmt',
											Math.abs(customDefData[customDefData.TotalCurAmt]).toFixed(2)
										);
									}
								}

								if (customDefData.NetCurAmt) {
									if (isNaN(customDefData[customDefData.NetCurAmt])) {
										// setAttributeValue(pmtInvoiceInfoNode, 'NetCurAmt', checkData[checkData.NetCurAmt]);
									} else {
										setAttributeValue(
											pmtInvoiceInfoNode,
											'NetCurAmt',
											Math.abs(customDefData[customDefData.NetCurAmt]).toFixed(2)
										);
									}
								}

								if (customDefData.DiscountCurAmt) {
									if (isNaN(customDefData[customDefData.DiscountCurAmt])) {
										// setAttributeValue(pmtInvoiceInfoNode, 'NetCurAmt', checkData[checkData.NetCurAmt]);
									} else {
										setAttributeValue(
											pmtInvoiceInfoNode,
											'DiscountCurAmt',
											Math.abs(customDefData[customDefData.DiscountCurAmt]).toFixed(2)
										);
									}
								}

								if (customDefData.PONum) {
									var pmtPOInfoNode = addNodeFromParentNode(xmlDoc, pmtInvoiceInfoNode, 'POInfo');
									setAttributeValue(pmtPOInfoNode, 'POType', 'PO');
									addTextNodeFromParentNode(xmlDoc, pmtPOInfoNode, 'PONum', customDefData[customDefData.PONum]);
								}
								if (customDefData.NoteText) {
									var pmtNoteNode = addNodeFromParentNode(xmlDoc, pmtInvoiceInfoNode, 'Note');
									setAttributeValue(pmtNoteNode, 'NoteType', 'INV');
									addTextNodeFromParentNode(xmlDoc, pmtNoteNode, 'NoteText', customDefData[customDefData.NoteText]);
								}
							} else {
								//same as top, if there is no customDefData, default to action
								if (arrBills != null)
									// var pmtDetailsNode = addNodeFromParentNode(xmlDoc, pmtRecNode, 'PmtDetail');

									var pmtInvoiceInfoNode = addNodeFromParentNode(xmlDoc, pmtDetailsNode, 'InvoiceInfo');

								if (!isEmpty(objVDCRecResults)) {
									setAttributeValue(
										pmtInvoiceInfoNode,
										'InvoiceType',
										objVDCRecResults[0].getValue('custrecord_invoicetype')
									);
								} else {
									setAttributeValue(pmtInvoiceInfoNode, 'InvoiceType', '');
								}

								if (
									pmtMethod == 'CHK' ||
									pmtMethod == 'DAC' ||
									pmtMethod == 'CCR' ||
									pmtMethod == 'IWI' ||
									pmtMethod == 'MTS' ||
									pmtMethod == 'IAC' ||
									pmtMethod == 'CCR'
								) {
									var netAmt = 0;
									var origAmt = getFloatVal(arrBillAmtOrig[billId]);
									var amt = getFloatVal(arrBillAmt[billId]);

									// dLog('creatXMLDoc', 'origAmt = ' + origAmt);
									// dLog('creatXMLDoc', 'amt = ' + amt);

									var discAmt = !isEmpty(arrBillDiscAmt[billId]) ? getFloatVal(arrBillDiscAmt[billId]) : 0;

									// tmpAmt += amt;
									netAmt = amt;
									tmpAmt += netAmt;

									dLog('creatXMLDoc', 'netAmt = ' + netAmt);
									dLog('creatXMLDoc', 'tmpAmt' + tmpAmt);

									// TODO : this may be deleted, in the UI discount is already
									// calculated.
									if (discAmt > 0) {
										// netAmt -= discAmt;
										// tmpAmt -= discAmt;
									}

									// Sep 8, 2016 : As per AL test, need to add DAC as of the
									// criteria
									// if (pmtMethod != 'DAC' &&
									// !isEmpty(arrBillCredits[billId])) {
									if (!isEmpty(arrBillCredits[billId])) {
										var arrBC = arrBillCredits[billId];

										for (bc in arrBC) {
											var pmtInvoiceInfoNodeCR = addNodeFromParentNode(xmlDoc, pmtDetailsNode, 'InvoiceInfo');
											setAttributeValue(pmtInvoiceInfoNodeCR, 'InvoiceType', 'CM');
											setAttributeValue(pmtInvoiceInfoNodeCR, 'InvoiceNum', arrBC[bc].bcnum);

											var billCreditAmtP = getFloatVal(arrBC[bc].bcamt);
											var billCreditAmt = billCreditAmtP * -1;

											// pmtTotalAmt = (pmtTotalAmt - billCreditAmtP);
											// pmtRecCurAmt = (pmtRecCurAmt - billCreditAmtP);

											// tmpAmt = (tmpAmt - billCreditAmtP);
											// netAmt = (netAmt - billCreditAmtP);

											setAttributeValue(
												pmtInvoiceInfoNodeCR,
												'EffDt',
												formatDate(nlapiStringToDate(arrBC[bc].bcdate))
											);
											setAttributeValue(pmtInvoiceInfoNodeCR, 'NetCurAmt', billCreditAmt.toFixed(2));
											setAttributeValue(pmtInvoiceInfoNodeCR, 'TotalCurAmt', billCreditAmt.toFixed(2));

											// pmtRecCurAmt += billCreditAmt;
											// pmtTotalAmt += billCreditAmt;

											if (!isEmpty(arrBC[bc].bcmemo)) {
												var pmtdNoteNodeCRBC = addNodeFromParentNode(xmlDoc, pmtInvoiceInfoNodeCR, 'Note');
												setAttributeValue(pmtdNoteNodeCRBC, 'NoteType', 'INV');
												addTextNodeFromParentNode(
													xmlDoc,
													pmtdNoteNodeCRBC,
													'NoteText',
													(isEmpty(arrBC[bc].bcmemo) ? '' : setValue(arrBC[bc].bcmemo)).replace(/\*/g, '')
												);
											}
										}
									}

									setAttributeValue(
										pmtInvoiceInfoNode,
										'InvoiceNum',
										isEmpty(objBillsData[billId]) ? '' : setValue(objBillsData[billId].num)
									);
									setAttributeValue(pmtInvoiceInfoNode, 'TotalCurAmt', origAmt.toFixed(2));
									// setAttributeValue(pmtInvoiceInfoNode, 'NetCurAmt',
									// amt.toFixed(2));
									setAttributeValue(pmtInvoiceInfoNode, 'NetCurAmt', netAmt.toFixed(2));

									if (!isEmpty(objBillsData[billId])) {
										if (!isEmpty(objBillsData[billId].memo)) {
											var pmtdNoteNodeCR = addNodeFromParentNode(xmlDoc, pmtInvoiceInfoNode, 'Note');
											setAttributeValue(pmtdNoteNodeCR, 'NoteType', 'INV');

											addTextNodeFromParentNode(
												xmlDoc,
												pmtdNoteNodeCR,
												'NoteText',
												(isEmpty(objBillsData[billId]) ? '' : setValue(objBillsData[billId].memo)).replace(
													/\*/g,
													''
												)
											);
										}
									}

									setAttributeValue(pmtInvoiceInfoNode, 'DiscountCurAmt', discAmt.toFixed(2));

									var invoiceDate = objBillsData[billId].dte;
									if ((pmtMethod == 'CHK' || pmtMethod == 'CCR' || pmtMethod == 'DAC') && !isEmpty(invoiceDate))
										setAttributeValue(pmtInvoiceInfoNode, 'EffDt', formatDate(nlapiStringToDate(invoiceDate)));

									// Add PO Num
									if (!isEmpty(arrBillPO[billId])) {
										var poInfoNode = addNodeFromParentNode(xmlDoc, pmtInvoiceInfoNode, 'POInfo');
										setAttributeValue(poInfoNode, 'POType', 'PO');

										addTextNodeFromParentNode(xmlDoc, poInfoNode, 'PONum', arrBillPO[billId]);
									}
								} else {
									if (!isEmpty(arrBillCredits[billId])) {
										var arrBC = arrBillCredits[billId];

										for (bc in arrBC) {
											var pmtInvoiceInfoNodeCR = addNodeFromParentNode(xmlDoc, pmtDetailsNode, 'InvoiceInfo');
											setAttributeValue(
												pmtInvoiceInfoNodeCR,
												'InvoiceType',
												objVDCRecResults[0].getValue('custrecord_invoicetype')
											);
											setAttributeValue(pmtInvoiceInfoNodeCR, 'InvoiceNum', arrBC[bc].bcnum);
										}
									}
								}

								try {
									if (nlapiGetContext().getRemainingUsage() < 1000) {
										nlapiLogExecution('AUDIT', 'yieldIfRequired', '*** Yielding ***');

										var tempEMAIL_SENDER = EMAIL_SENDER;
										var tempEMAIL_SENDER_EMAIL = EMAIL_SENDER_EMAIL;
										var tempSUB_ID = SUB_ID;
										var tempACCOUNT = ACCOUNT;
										var tempAPACCOUNT = APACCOUNT;
										var tempBPM_DATE = BPM_DATE;
                    var tempPROCESSASCHECK = PROCESS_AS_CHECK;

										var yieldObject = nlapiYieldScript();
										nlapiLogExecution('AUDIT', 'yieldIfRequired', 'Yield size: ', yieldObject.size);
										if (yieldObject.status !== 'RESUME') {
											nlapiLogExecution(
												'ERROR',
												'yieldIfRequired',
												'Yield status: ' + yieldObject.status,
												yieldObject.reason
											);
											throw nlapiCreateError('YIELD_ERROR', yieldObject.reason);
										}
										nlapiLogExecution(
											'AUDIT',
											'yieldIfRequired',
											'*** Resuming from Yield ***',
											yieldObject ? yieldObject.size || '' : ''
										);

										EMAIL_SENDER = tempEMAIL_SENDER;
										EMAIL_SENDER_EMAIL = tempEMAIL_SENDER_EMAIL;
										SUB_ID = tempSUB_ID;
										ACCOUNT = tempACCOUNT;
										APACCOUNT = tempAPACCOUNT;
										BPM_DATE = tempBPM_DATE;
                    PROCESS_AS_CHECK = tempPROCESSASCHECK;

										var objLog = {
											EMAIL_SENDER: EMAIL_SENDER,
											EMAIL_SENDER_EMAIL: EMAIL_SENDER_EMAIL,
											SUB_ID: SUB_ID,
											ACCOUNT: ACCOUNT,
											APACCOUNT: APACCOUNT,
											BPM_DATE: BPM_DATE,
                      PROCESS_AS_CHECK: PROCESS_AS_CHECK
										};
										dAudit('yielded', JSON.stringify(objLog));
									}

									var plcRes = nlapiSearchRecord(
										'transaction',
										null,
										[
											['type', 'anyof', 'LiabPymt'],
											'AND',
											['mainline', 'is', 'F'],
											'AND',
											['internalid', 'is', billId],
										],
										[
											new nlobjSearchColumn('mainline'),
											new nlobjSearchColumn('trandate').setSort(false),
											new nlobjSearchColumn('tranid'),
											new nlobjSearchColumn('entity'),
											new nlobjSearchColumn('amount'),
											new nlobjSearchColumn('amountpaid'),
											new nlobjSearchColumn('memomain'),
											// new nlobjSearchColumn("custbody_ica_pl_status"),
											new nlobjSearchColumn('line'),
											new nlobjSearchColumn('name', 'payrollItem', null),
										]
									);
									// var tmpAmt = 0;
									var memo = null;
									var tranid = null;
									if (plcRes != null) {
										for (var j = 0; j < plcRes.length; j++) {
											dAudit('plcRes', JSON.stringify(plcRes[j]));
											var amt = Math.abs(plcRes[j].getValue('amount'));
											var pmtInvoiceInfoNodeCR = addNodeFromParentNode(xmlDoc, pmtDetailsNode, 'InvoiceInfo');
											setAttributeValue(pmtInvoiceInfoNodeCR, 'InvoiceType', 'IV');

											try {
												setAttributeValue(
													pmtInvoiceInfoNodeCR,
													'InvoiceNum',
													plcRes[j].getValue('name', 'payrollitem', null) +
														'_' +
														plcRes[j].getText('entity')
												); //ITEM_VENDOR
											} catch (e) {
												setAttributeValue(
													pmtInvoiceInfoNodeCR,
													'InvoiceNum',
													plcRes[j].getValue('line') + '_' + plcRes[j].getText('entity')
												); //ITEM_VENDOR
											}

											setAttributeValue(pmtInvoiceInfoNodeCR, 'NetCurAmt', numeral(amt).format('0.00'));
											setAttributeValue(pmtInvoiceInfoNodeCR, 'TotalCurAmt', numeral(amt).format('0.00')); //getFloatVal(amt)

											if (!isEmpty(plcRes[j].getValue('memomain'))) {
												memo = plcRes[j].getValue('memomain');
											}
											if (!isEmpty(plcRes[j].getValue('tranid'))) {
												tranid = plcRes[j].getValue('tranid');
											}

											tmpAmt += Number(amt);
										}
									}
									if (memo != null) {
										var pmtdNoteNodeCRBC = addNodeFromParentNode(xmlDoc, pmtInvoiceInfoNodeCR, 'Note');
										setAttributeValue(pmtdNoteNodeCRBC, 'NoteType', 'INV');
										addTextNodeFromParentNode(xmlDoc, pmtdNoteNodeCRBC, 'NoteText', memo.replace(/\*/g, ''));
									}
									// setTextNodeValueFromPath(pmtRecNode, 'PmtID', billId);

									dAudit('tranid', tranid);
									dAudit('arrBillPaymentMap[payeeId]', arrBillPaymentMap[payeeId]);

									if (!isEmpty(tranid)) {
										setTextNodeValueFromPath(pmtRecNode, 'PmtID', tranid);
									} else {
										setTextNodeValueFromPath(pmtRecNode, 'PmtID', arrBillPaymentMap[payeeId]); //billId
									}

									if (!hasChkNum) {
										var chkNumPLC = tranid || billId;
										dLog('adding ChkNum', chkNumPLC);
										addTextNodeFromParentNode(xmlDoc, chkNode, 'ChkNum', chkNumPLC);
									}
								} catch (e) {
									// dErr('PLC Error. ', e.message);
									// dErr('PLC Process', 'Account PLC not enabled, ignore this.');
									yieldIfRequired(100);
								}
							}
						} else {
							dLog('creatXMLDoc', 'using standard action for pmtDetails = ' + JSON.stringify(customDefData));
							//same as top, if there is no customDefData, default to action
							if (arrBills != null)
								// var pmtDetailsNode = addNodeFromParentNode(xmlDoc, pmtRecNode, 'PmtDetail');

								var pmtInvoiceInfoNode = addNodeFromParentNode(xmlDoc, pmtDetailsNode, 'InvoiceInfo');

							if (!isEmpty(objVDCRecResults)) {
								setAttributeValue(pmtInvoiceInfoNode, 'InvoiceType', objVDCRecResults[0].getValue('custrecord_invoicetype'));
							} else {
								setAttributeValue(pmtInvoiceInfoNode, 'InvoiceType', '');
							}

							if (
								pmtMethod == 'CHK' ||
								pmtMethod == 'DAC' ||
								pmtMethod == 'CCR' ||
								pmtMethod == 'IWI' ||
								pmtMethod == 'MTS' ||
								pmtMethod == 'IAC' ||
								pmtMethod == 'CCR'
							) {
								if (!isEmpty(arrBillCredits[billId])) {
									var arrBC = arrBillCredits[billId];

									for (bc in arrBC) {
										var pmtInvoiceInfoNodeCR = addNodeFromParentNode(xmlDoc, pmtDetailsNode, 'InvoiceInfo');
										setAttributeValue(pmtInvoiceInfoNodeCR, 'InvoiceType', 'CM');
										setAttributeValue(pmtInvoiceInfoNodeCR, 'InvoiceNum', arrBC[bc].bcnum);

										var billCreditAmtP = getFloatVal(arrBC[bc].bcamt);
										var billCreditAmt = billCreditAmtP * -1;

										// pmtTotalAmt = (pmtTotalAmt - billCreditAmtP);
										// pmtRecCurAmt = (pmtRecCurAmt - billCreditAmtP);

										// tmpAmt = (tmpAmt - billCreditAmtP);
										// netAmt = (netAmt - billCreditAmtP);

										setAttributeValue(pmtInvoiceInfoNodeCR, 'EffDt', formatDate(nlapiStringToDate(arrBC[bc].bcdate)));
										setAttributeValue(pmtInvoiceInfoNodeCR, 'NetCurAmt', billCreditAmt.toFixed(2));
										setAttributeValue(pmtInvoiceInfoNodeCR, 'TotalCurAmt', billCreditAmt.toFixed(2));

										// pmtRecCurAmt += billCreditAmt;
										// pmtTotalAmt += billCreditAmt;

										if (!isEmpty(arrBC[bc].bcmemo)) {
											var pmtdNoteNodeCRBC = addNodeFromParentNode(xmlDoc, pmtInvoiceInfoNodeCR, 'Note');
											setAttributeValue(pmtdNoteNodeCRBC, 'NoteType', 'INV');
											addTextNodeFromParentNode(
												xmlDoc,
												pmtdNoteNodeCRBC,
												'NoteText',
												(isEmpty(arrBC[bc].bcmemo) ? '' : setValue(arrBC[bc].bcmemo)).replace(/\*/g, '')
											);
										}
									}
								}

								setAttributeValue(
									pmtInvoiceInfoNode,
									'InvoiceNum',
									isEmpty(objBillsData[billId]) ? '' : setValue(objBillsData[billId].num)
								);
								setAttributeValue(pmtInvoiceInfoNode, 'TotalCurAmt', origAmt.toFixed(2));
								// setAttributeValue(pmtInvoiceInfoNode, 'NetCurAmt',
								// amt.toFixed(2));
								setAttributeValue(pmtInvoiceInfoNode, 'NetCurAmt', netAmt.toFixed(2));

								if (!isEmpty(objBillsData[billId])) {
									if (!isEmpty(objBillsData[billId].memo)) {
										var pmtdNoteNodeCR = addNodeFromParentNode(xmlDoc, pmtInvoiceInfoNode, 'Note');
										setAttributeValue(pmtdNoteNodeCR, 'NoteType', 'INV');

										addTextNodeFromParentNode(
											xmlDoc,
											pmtdNoteNodeCR,
											'NoteText',
											(isEmpty(objBillsData[billId]) ? '' : setValue(objBillsData[billId].memo)).replace(/\*/g, '')
										);
									}
								}

								setAttributeValue(pmtInvoiceInfoNode, 'DiscountCurAmt', discAmt.toFixed(2));

								var invoiceDate = objBillsData[billId].dte;
								if ((pmtMethod == 'CHK' || pmtMethod == 'CCR' || pmtMethod == 'DAC') && !isEmpty(invoiceDate))
									setAttributeValue(pmtInvoiceInfoNode, 'EffDt', formatDate(nlapiStringToDate(invoiceDate)));

								// Add PO Num
								if (!isEmpty(arrBillPO[billId])) {
									var poInfoNode = addNodeFromParentNode(xmlDoc, pmtInvoiceInfoNode, 'POInfo');
									setAttributeValue(poInfoNode, 'POType', 'PO');

									addTextNodeFromParentNode(xmlDoc, poInfoNode, 'PONum', arrBillPO[billId]);
								}
							} else {
								if (!isEmpty(arrBillCredits[billId])) {
									var arrBC = arrBillCredits[billId];

									for (bc in arrBC) {
										var pmtInvoiceInfoNodeCR = addNodeFromParentNode(xmlDoc, pmtDetailsNode, 'InvoiceInfo');
										setAttributeValue(
											pmtInvoiceInfoNodeCR,
											'InvoiceType',
											objVDCRecResults[0].getValue('custrecord_invoicetype')
										);
										setAttributeValue(pmtInvoiceInfoNodeCR, 'InvoiceNum', arrBC[bc].bcnum);
									}
								}
							}

							try {
								if (nlapiGetContext().getRemainingUsage() < 1000) {
									nlapiLogExecution('AUDIT', 'yieldIfRequired', '*** Yielding ***');

									var tempEMAIL_SENDER = EMAIL_SENDER;
									var tempEMAIL_SENDER_EMAIL = EMAIL_SENDER_EMAIL;
									var tempSUB_ID = SUB_ID;
									var tempACCOUNT = ACCOUNT;
									var tempAPACCOUNT = APACCOUNT;
									var tempBPM_DATE = BPM_DATE;
                  var tempPROCESSASCHECK = PROCESS_AS_CHECK;

									var yieldObject = nlapiYieldScript();
									nlapiLogExecution('AUDIT', 'yieldIfRequired', 'Yield size: ', yieldObject.size);
									if (yieldObject.status !== 'RESUME') {
										nlapiLogExecution(
											'ERROR',
											'yieldIfRequired',
											'Yield status: ' + yieldObject.status,
											yieldObject.reason
										);
										throw nlapiCreateError('YIELD_ERROR', yieldObject.reason);
									}
									nlapiLogExecution(
										'AUDIT',
										'yieldIfRequired',
										'*** Resuming from Yield ***',
										yieldObject ? yieldObject.size || '' : ''
									);

									EMAIL_SENDER = tempEMAIL_SENDER;
									EMAIL_SENDER_EMAIL = tempEMAIL_SENDER_EMAIL;
									SUB_ID = tempSUB_ID;
									ACCOUNT = tempACCOUNT;
									APACCOUNT = tempAPACCOUNT;
									BPM_DATE = tempBPM_DATE;
                  PROCESS_AS_CHECK = tempPROCESSASCHECK;

									var objLog = {
										EMAIL_SENDER: EMAIL_SENDER,
										EMAIL_SENDER_EMAIL: EMAIL_SENDER_EMAIL,
										SUB_ID: SUB_ID,
										ACCOUNT: ACCOUNT,
										APACCOUNT: APACCOUNT,
										BPM_DATE: BPM_DATE,
                    PROCESS_AS_CHECK: PROCESS_AS_CHECK
									};
									dAudit('yielded', JSON.stringify(objLog));
								}

								var plcRes = nlapiSearchRecord(
									'transaction',
									null,
									[['type', 'anyof', 'LiabPymt'], 'AND', ['mainline', 'is', 'F'], 'AND', ['internalid', 'is', billId]],
									[
										new nlobjSearchColumn('mainline'),
										new nlobjSearchColumn('trandate').setSort(false),
										new nlobjSearchColumn('tranid'),
										new nlobjSearchColumn('entity'),
										new nlobjSearchColumn('amount'),
										new nlobjSearchColumn('amountpaid'),
										new nlobjSearchColumn('memomain'),
										// new nlobjSearchColumn("custbody_ica_pl_status"),
										new nlobjSearchColumn('line'),
										new nlobjSearchColumn('name', 'payrollItem', null),
									]
								);
								// var tmpAmt = 0;
								var memo = null;
								var tranid = null;
								if (plcRes != null) {
									for (var j = 0; j < plcRes.length; j++) {
										dAudit('plcRes', JSON.stringify(plcRes[j]));
										var amt = Math.abs(plcRes[j].getValue('amount'));
										var pmtInvoiceInfoNodeCR = addNodeFromParentNode(xmlDoc, pmtDetailsNode, 'InvoiceInfo');
										setAttributeValue(pmtInvoiceInfoNodeCR, 'InvoiceType', 'IV');

										try {
											setAttributeValue(
												pmtInvoiceInfoNodeCR,
												'InvoiceNum',
												plcRes[j].getValue('name', 'payrollitem', null) + '_' + plcRes[j].getText('entity')
											); //ITEM_VENDOR
										} catch (e) {
											setAttributeValue(
												pmtInvoiceInfoNodeCR,
												'InvoiceNum',
												plcRes[j].getValue('line') + '_' + plcRes[j].getText('entity')
											); //ITEM_VENDOR
										}

										setAttributeValue(pmtInvoiceInfoNodeCR, 'NetCurAmt', numeral(amt).format('0.00'));
										setAttributeValue(pmtInvoiceInfoNodeCR, 'TotalCurAmt', numeral(amt).format('0.00')); //getFloatVal(amt)

										if (!isEmpty(plcRes[j].getValue('memomain'))) {
											memo = plcRes[j].getValue('memomain');
										}
										if (!isEmpty(plcRes[j].getValue('tranid'))) {
											tranid = plcRes[j].getValue('tranid');
										}

										tmpAmt += Number(amt);
									}
								}
								if (memo != null) {
									var pmtdNoteNodeCRBC = addNodeFromParentNode(xmlDoc, pmtInvoiceInfoNodeCR, 'Note');
									setAttributeValue(pmtdNoteNodeCRBC, 'NoteType', 'INV');
									addTextNodeFromParentNode(xmlDoc, pmtdNoteNodeCRBC, 'NoteText', memo.replace(/\*/g, ''));
								}
								// setTextNodeValueFromPath(pmtRecNode, 'PmtID', billId);

								dAudit('tranid', tranid);
								dAudit('arrBillPaymentMap[payeeId]', arrBillPaymentMap[payeeId]);

								if (!isEmpty(tranid)) {
									setTextNodeValueFromPath(pmtRecNode, 'PmtID', tranid);
								} else {
									setTextNodeValueFromPath(pmtRecNode, 'PmtID', arrBillPaymentMap[payeeId]); //billId
								}

								if (!hasChkNum) {
									var chkNumPLC = tranid || billId;
									dLog('adding ChkNum', chkNumPLC);
									addTextNodeFromParentNode(xmlDoc, chkNode, 'ChkNum', chkNumPLC);
								}
							} catch (e) {
								// dErr('PLC Error. ', e.message);
								// dErr('PLC Process', 'Account PLC not enabled, ignore this.');
								yieldIfRequired(100);
							}
						}
					}
				}
			} else {
				if (checkData.rtype == 'Check') {
					for (y in arrBills) {
						var billId = arrBills[y];

						var netAmt = 0;
						var origAmt = getFloatVal(arrBillAmtOrig[billId]);
						var amt = getFloatVal(arrBillAmt[billId]);
						var discAmt = !isEmpty(arrBillDiscAmt[billId]) ? getFloatVal(arrBillDiscAmt[billId]) : 0;
						netAmt = amt;
						tmpAmt += netAmt;
					}
					setTextNodeValueFromPath(pmtRecNode, 'PmtID', checkData.num);
				}
			}

			// END: PmtDetail

			// IAC, DAC and CHK
			// if (pmtMethod == 'DAC' || pmtMethod == 'IAC' || pmtMethod ==
			// 'CHK') {
			// 9 Feb 2017: PMP should only work for IAC, MTS, IWI and ACH. This
			// means
			// that the Handling code should be 'U' for these payment methods.
			// 13 Feb 2017 : Al > ach is dac, same thing.
			if (pmtMethod == 'IAC' || pmtMethod == 'MTS' || pmtMethod == 'IWI' || pmtMethod == 'ACH' || pmtMethod == 'DAC' || pmtMethod == 'PLC') {
				//URG NRG removed

				// START: DocDelivery

				var docDeliveryNode = addNodeFromParentNode(xmlDoc, pmtRecNode, 'DocDelivery');

				if (!isEmpty(objVendor.custentity_pmp_biller_id)) {
					addTextNodeFromParentNode(xmlDoc, docDeliveryNode, 'EDDBillerID', objVendor.custentity_pmp_biller_id);
				} else if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_pmp_biller_id'))) {
					addTextNodeFromParentNode(
						xmlDoc,
						docDeliveryNode,
						'EDDBillerID',
						objAcctMapping[0].getValue('custrecord_acct_map_pmp_biller_id')
					);
				}

				var fileOutNode = addNodeFromParentNode(xmlDoc, docDeliveryNode, 'FileOut');

				if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_dac_pmp_file_type')))
					addTextNodeFromParentNode(xmlDoc, fileOutNode, 'FileType', objVDCRecResults[0].getValue('custrecord_dac_pmp_file_type'));

				if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_dac_pmp_file_format')))
					addTextNodeFromParentNode(xmlDoc, fileOutNode, 'FileFormat', objVDCRecResults[0].getValue('custrecord_dac_pmp_file_format'));

				var deliveryNode = addNodeFromParentNode(xmlDoc, fileOutNode, 'Delivery');

				if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_dac_pmp_delivery_type')))
					addTextNodeFromParentNode(xmlDoc, deliveryNode, 'DeliveryType', objVDCRecResults[0].getValue('custrecord_dac_pmp_delivery_type'));

				if (!isEmpty(objVendor.pmp_dac_contactname))
					addTextNodeFromParentNode(xmlDoc, deliveryNode, 'DeliveryContactName', objVendor.pmp_dac_contactname);

				if (!isEmpty(objVendor.pmp_dac_emailaddress))
					addTextNodeFromParentNode(xmlDoc, deliveryNode, 'DeliveryEmailAddress', objVendor.pmp_dac_emailaddress);

				// END: DocDelivery
			}

			// dLog('creatXMLDoc', 'End: PmtDetail Node');
			// addTextNodeFromParentNode(xmlDoc, pmtRecNode, 'CurAmt',
			// pmtRecCurAmt.toFixed(2));
			if (
				pmtMethod == 'IAC' ||
				pmtMethod == 'MTS' ||
				pmtMethod == 'IWI' ||
				pmtMethod == 'ACH' ||
				pmtMethod == 'DAC' ||
				pmtMethod == 'PLC' ||
				pmtMethod == 'CHK' ||
				pmtMethod == 'CCR' ||
				pmtMethod == 'NRG' ||
				pmtMethod == 'URG'
			) {
				tmpTotalAmt += tmpAmt;
				addTextNodeFromParentNode(xmlDoc, pmtRecNode, 'CurAmt', tmpAmt.toFixed(2));
			}

			//RSF - BSP - add PmtID after OrgnrParty
			if (pmtMethod == 'B2P') {
				//PmtID
				addTextNodeFromParentNode(xmlDoc, pmtRecNode, 'PmtID', arrBillPaymentMap[payeeId]);

				//CurAmt
				tmpTotalAmt += tmpAmt;
				addTextNodeFromParentNode(xmlDoc, pmtRecNode, 'CurAmt', tmpAmt.toFixed(2));

				//CurCode
				if (!isEmpty(currId)) {
					var curCode =
						pmtMethod == 'IAC' && !isEmpty(objAcctMapping)
							? objAcctMapping[0].getValue('symbol', 'CUSTRECORD_ACCT_MAP_ACCOUNT_CURRENCY')
							: arrCurrMap[currId];
					addTextNodeFromParentNode(xmlDoc, pmtRecNode, 'CurCode', curCode);
				}

				//ValueDate
				addTextNodeFromParentNode(xmlDoc, pmtRecNode, 'ValueDate', formatDate(nlapiStringToDate(BPM_DATE)));

				//ElectronicPmtInfo
				var ElecPmtNode = addNodeFromParentNode(xmlDoc, pmtRecNode, 'ElectronicPmtInfo');
				if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id')))
					addTextNodeFromParentNode(
						xmlDoc,
						ElecPmtNode,
						'EPBankID',
						objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id')
					);
				if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_origin_acc')))
					addTextNodeFromParentNode(xmlDoc, ElecPmtNode, 'EPAcctID', objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_origin_acc'));

				if (!isEmpty(objVendor) && !isEmpty(objVendor.pmp_dac_contactname))
					addTextNodeFromParentNode(xmlDoc, ElecPmtNode, 'EPFirstName', objVendor.pmp_dac_contactname);
				if (!isEmpty(objVendor) && !isEmpty(objVendor.pmp_dac_emailaddress))
					addTextNodeFromParentNode(xmlDoc, ElecPmtNode, 'EPEmailToken', objVendor.pmp_dac_emailaddress);

				if (!isEmpty(objBillsData[billId])) {
					if (!isEmpty(objBillsData[billId].memo)) {
						addTextNodeFromParentNode(xmlDoc, ElecPmtNode, 'EPDesc', b2pMemo.substr(0, 200)); //setValue(objBillsData[billId].memo));
					}
				}
			}
		}

		//Check transaction type starts here.
		var checks = _.filter(arrBillsProcessed, { trantype: 'check' });
		dLog('creatXMLDoc-startofCheck', 'Checks = ' + JSON.stringify(checks));
		var entityData = [];
		if (checks.length > 0) {
			entityData = getCheckEntityData(_.map(checks, 'payeeid'));
		}

		dLog('creatXMLDoc-startofCheck', 'arrBillsProcessed = ' + JSON.stringify(arrBillsProcessed));
		dLog('creatXMLDoc', 'entityData = ' + JSON.stringify(entityData));

		// for (v in arrVendorBills) {
		for (var z = 0; z < checks.length; z++) {
			if (nlapiGetContext().getRemainingUsage() < 1000) {
				nlapiLogExecution('AUDIT', 'yieldIfRequired', '*** Yielding ***');

				var tempEMAIL_SENDER = EMAIL_SENDER;
				var tempEMAIL_SENDER_EMAIL = EMAIL_SENDER_EMAIL;
				var tempSUB_ID = SUB_ID;
				var tempACCOUNT = ACCOUNT;
				var tempAPACCOUNT = APACCOUNT;
				var tempBPM_DATE = BPM_DATE;
        var tempPROCESSASCHECK = PROCESS_AS_CHECK;

				var yieldObject = nlapiYieldScript();
				nlapiLogExecution('AUDIT', 'yieldIfRequired', 'Yield size: ', yieldObject.size);
				if (yieldObject.status !== 'RESUME') {
					nlapiLogExecution('ERROR', 'yieldIfRequired', 'Yield status: ' + yieldObject.status, yieldObject.reason);
					throw nlapiCreateError('YIELD_ERROR', yieldObject.reason);
				}
				nlapiLogExecution('AUDIT', 'yieldIfRequired', '*** Resuming from Yield ***', yieldObject ? yieldObject.size || '' : '');

				EMAIL_SENDER = tempEMAIL_SENDER;
				EMAIL_SENDER_EMAIL = tempEMAIL_SENDER_EMAIL;
				SUB_ID = tempSUB_ID;
				ACCOUNT = tempACCOUNT;
				APACCOUNT = tempAPACCOUNT;
				BPM_DATE = tempBPM_DATE;
        PROCESS_AS_CHECK = tempPROCESSASCHECK;

				var objLog = {
					EMAIL_SENDER: EMAIL_SENDER,
					EMAIL_SENDER_EMAIL: EMAIL_SENDER_EMAIL,
					SUB_ID: SUB_ID,
					ACCOUNT: ACCOUNT,
					APACCOUNT: APACCOUNT,
					BPM_DATE: BPM_DATE,
          PROCESS_AS_CHECK: PROCESS_AS_CHECK
				};
				dAudit('yielded', JSON.stringify(objLog));
			}

			pmtCtr++;
			var payeeId = checks[z].payeeid;
			var currId = checks[z].curr;
			var hasChkNum = true;

			var objVendor = _.find(entityData, { internalid: payeeId }); //entityData[payeeId];

			dLog('creatXMLDoc', 'payeeId = ' + JSON.stringify(payeeId));
			dLog('creatXMLDoc', 'objVendor = ' + JSON.stringify(objVendor));
			var checkData = _.find(arrChecksData, { internalid: checks[z].id });
			dLog('creatXMLDoc', 'checkData = ' + JSON.stringify(checkData));

			if (isEmpty(objVendor)) {
				continue;
			}

			var pmtMethod = 'CHK';

			var pmtRecNode = addNodeFromParentNode(xmlDoc, fileNode, 'PmtRec');

			setAttributeValue(pmtRecNode, 'PmtCrDr', 'C');
			setAttributeValue(pmtRecNode, 'PmtMethod', pmtMethod);
			setAttributeValue(pmtRecNode, 'TranHandlingCode', 'U');

			if (!isEmpty(objVendor.pmformatintl)) setAttributeValue(pmtRecNode, 'PmtFormatIntl', objVendor.pmformatintl);

			addTextNodeFromParentNode(xmlDoc, pmtRecNode, 'PmtID', checks[z].billnum);

			if (!isEmpty(currId)) {
				var curCode =
					pmtMethod == 'IAC' && !isEmpty(objAcctMapping)
						? objAcctMapping[0].getValue('symbol', 'CUSTRECORD_ACCT_MAP_ACCOUNT_CURRENCY')
						: arrCurrMap[currId];
				if (pmtMethod != 'B2P') {
					addTextNodeFromParentNode(xmlDoc, pmtRecNode, 'CurCode', curCode);
				}
			}

			addTextNodeFromParentNode(xmlDoc, pmtRecNode, 'ValueDate', formatDate(nlapiStringToDate(BPM_DATE)));

			// if ((!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_check_insert_type')))
			// 		|| (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_check_insert_value')))) {

			// 	var iacRefInfo = addNodeFromParentNode(xmlDoc, pmtRecNode, 'RefInfo');

			// 	if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_check_insert_type')))
			// 		setAttributeValue(iacRefInfo, 'RefType', objVDCRecResults[0].getValue('custrecord_check_insert_type'));

			// 	if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_check_insert_value')))
			// 		addTextNodeFromParentNode(xmlDoc, iacRefInfo, 'RefID', objVDCRecResults[0].getValue('custrecord_check_insert_value'));
			// }

			var refType = '';
			var refId = '';

			refType =
				objVendor.custentity_ica_entity_check_insert_type ||
				objAcctMapping[0].getValue('custrecord_ica_acct_map_check_inert_type') ||
				objVDCRecResults[0].getValue('custrecord_check_insert_type') ||
				'';
			refId =
				objVendor.custentity_ica_entity_check_insert_value ||
				objAcctMapping[0].getValue('custrecord_ica_acct_map_check_insert_val') ||
				objVDCRecResults[0].getValue('custrecord_check_insert_value') ||
				'';

			// dAudit('refType', JSON.stringify({
			// 	vendor: objVendor.custentity_ica_entity_check_insert_type,
			// 	acctmapping: objAcctMapping[0].getValue('custrecord_ica_acct_map_check_inert_type'),
			// 	objVDCRecResults: objVDCRecResults[0].getValue('custrecord_check_insert_type')
			// }));

			// dAudit('refType', JSON.stringify({
			// 	vendor: objVendor.custentity_ica_entity_check_insert_value,
			// 	acctmapping: objAcctMapping[0].getValue('custrecord_ica_acct_map_check_insert_val'),
			// 	objVDCRecResults: objVDCRecResults[0].getValue('custrecord_check_insert_value')
			// }));

			if (refType != '' && refId != '') {
				var iacRefInfo = addNodeFromParentNode(xmlDoc, pmtRecNode, 'RefInfo');
				setAttributeValue(iacRefInfo, 'RefType', refType);
				addTextNodeFromParentNode(xmlDoc, iacRefInfo, 'RefID', refId);
			}

			if (WIRE_FEES != '') {
				var wireFees = '';
				if (WIRE_FEES == 1) wireFees = 'BEN';
				else if (WIRE_FEES == 2) wireFees = 'OUR';

				if (wireFees != '') {
					var wcRefInfo = addNodeFromParentNode(xmlDoc, pmtRecNode, 'RefInfo');
					setAttributeValue(wcRefInfo, 'RefType', 'WC');
					addTextNodeFromParentNode(xmlDoc, wcRefInfo, 'RefID', wireFees);
				}
			}

			var msgNode = addNodeFromParentNode(xmlDoc, pmtRecNode, 'Message');
			setAttributeValue(msgNode, 'MsgType', 'CHK');
			if (checkData != undefined) {
				addTextNodeFromParentNode(xmlDoc, msgNode, 'MsgText', checkData.memo || '');
			}

			// Check Node
			var chkNode = addNodeFromParentNode(xmlDoc, pmtRecNode, 'Check');

			if (checks[z].billnum) {
				var chknum = checks[z].billnum || checks[z].refnum || checks[z].id;
				if (chknum.length > 10) {
					chknum = chknum.substring(chknum.length - 10, chknum.length);
				}
				addTextNodeFromParentNode(xmlDoc, chkNode, 'ChkNum', chknum);
			} else {
				hasChkNum = false;
			}

			if (!isEmpty(objVendor.custentity_check_style)) {
				addTextNodeFromParentNode(xmlDoc, chkNode, 'ChkDocNum', objVendor.custentity_check_style);
			} else if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_check_template_id'))) {
				addTextNodeFromParentNode(xmlDoc, chkNode, 'ChkDocNum', objAcctMapping[0].getValue('custrecord_acct_map_check_template_id'));
			}

      if (USE_CHECK_ADDR=='T' && checkData != undefined) { 
        if (checkData != undefined) {
          addTextNodeFromParentNode(xmlDoc, chkNode, 'DeliveryCode', checkData.custbody_ica_delivery_code);  
        }
      } else {
        if (!isEmpty(objVDCRecResults) && !isEmpty(objVendor.deliverycode))
          addTextNodeFromParentNode(xmlDoc, chkNode, 'DeliveryCode', objVendor.deliverycode);  
      }


			if (!isEmpty(objVDCRecResults) && !isEmpty(objVendor.couriername))
				addTextNodeFromParentNode(xmlDoc, chkNode, 'CourierName', objVendor.couriername);

			if (!isEmpty(objVDCRecResults) && !isEmpty(objVendor.courieraccount))
				addTextNodeFromParentNode(xmlDoc, chkNode, 'CourierAccount', objVendor.courieraccount);

			// if (!isEmpty(objVDCRecResults) && !isEmpty(objVendor.deliverycode))
			// 	addTextNodeFromParentNode(xmlDoc, chkNode, 'DeliveryCode', objVendor.deliverycode);

			// START: Origin Party
			var orgnPartyNode = addNodeFromParentNode(xmlDoc, pmtRecNode, 'OrgnrParty');

			if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_companyname'))) {
				var orgpNameNode = addNodeFromParentNode(xmlDoc, orgnPartyNode, 'Name');
				addTextNodeFromParentNode(xmlDoc, orgpNameNode, 'Name1', objVDCRecResults[0].getValue('custrecord_companyname'));
			}

			if (
				(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compadd1'))) ||
				(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compadd2'))) ||
				(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compcity'))) ||
				(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compstateprov'))) ||
				(!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_comppostcode')))
			) {
				var postAddrNode = addNodeFromParentNode(xmlDoc, orgnPartyNode, 'PostAddr');

				if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compadd1')))
					addTextNodeFromParentNode(xmlDoc, postAddrNode, 'Addr1', objVDCRecResults[0].getValue('custrecord_compadd1'));
				if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compadd2')))
					addTextNodeFromParentNode(xmlDoc, postAddrNode, 'Addr2', objVDCRecResults[0].getValue('custrecord_compadd2'));
				if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compcity')))
					addTextNodeFromParentNode(xmlDoc, postAddrNode, 'City', objVDCRecResults[0].getValue('custrecord_compcity'));
				if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_compstateprov')))
					addTextNodeFromParentNode(xmlDoc, postAddrNode, 'StateProv', objVDCRecResults[0].getValue('custrecord_compstateprov'));
				if (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_comppostcode')))
					addTextNodeFromParentNode(xmlDoc, postAddrNode, 'PostalCode', objVDCRecResults[0].getValue('custrecord_comppostcode'));

				var country = !isEmpty(objVDCRecResults) ? objVDCRecResults[0].getValue('custrecord_compcountrycode') : '';
				if (!isEmpty(country)) addTextNodeFromParentNode(xmlDoc, postAddrNode, 'Country', country);

				var countryName = !isEmpty(objVDCRecResults) ? objVDCRecResults[0].getText('custrecord_compcountrynames') : '';
				if (!isEmpty(countryName)) addTextNodeFromParentNode(xmlDoc, postAddrNode, 'CountryName', countryName);
			}
			// END: Origin Party

			// START: OrgnrDepAcctID
			var orgnDepAcctIDNode = addNodeFromParentNode(xmlDoc, pmtRecNode, 'OrgnrDepAcctID');
			var odepacctIdNode = addNodeFromParentNode(xmlDoc, orgnDepAcctIDNode, 'DepAcctID');

			if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getText('custrecord_acct_map_ext_bank_account_typ')))
				setAttributeValue(odepacctIdNode, 'AcctType', objAcctMapping[0].getText('custrecord_acct_map_ext_bank_account_typ'));

			if (pmtMethod != 'CCR') {
				if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_origin_acc')))
					setAttributeValue(odepacctIdNode, 'AcctID', objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_origin_acc'));
			} else {
				if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_credit_card_man')))
					setAttributeValue(odepacctIdNode, 'AcctID', objAcctMapping[0].getValue('custrecord_acct_map_credit_card_man'));
			}

			if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_account_currency')))
				setAttributeValue(odepacctIdNode, 'AcctCur', arrCurrMap[objAcctMapping[0].getValue('custrecord_acct_map_account_currency')]);

			var bankInfoNode = addNodeFromParentNode(xmlDoc, odepacctIdNode, 'BankInfo');
			if (!isEmpty(objVDCRecResults)) setAttributeValue(bankInfoNode, 'Name', objVDCRecResults[0].getValue('custrecord_bankname'));

			if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getText('custrecord_acct_map_ext_bank_id_type')))
				setAttributeValue(bankInfoNode, 'BankIDType', objAcctMapping[0].getText('custrecord_acct_map_ext_bank_id_type'));

			if (!isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id')))
				addTextNodeFromParentNode(xmlDoc, bankInfoNode, 'BankID', objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_ori_bank_id'));

			if (pmtMethod != 'CHK') {
				var orgrefInfoNode = addNodeFromParentNode(xmlDoc, bankInfoNode, 'RefInfo');

				if (!isEmpty(objVDCRecResults)) setAttributeValue(orgrefInfoNode, 'RefType', objVDCRecResults[0].getValue(MSG_TYPE[pmtMethod]));

				if (pmtMethod == 'IAC' && !isEmpty(objAcctMapping) && !isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_inter_ach_co_id'))) {
					addTextNodeFromParentNode(xmlDoc, orgrefInfoNode, 'RefID', objAcctMapping[0].getValue('custrecord_acct_map_inter_ach_co_id'));
				} else if (
					(pmtMethod == 'ACH' || pmtMethod == 'DAC') &&
					!isEmpty(objAcctMapping) &&
					!isEmpty(objAcctMapping[0].getValue('custrecord_acct_map_dom_ach_co_id'))
				) {
					addTextNodeFromParentNode(xmlDoc, orgrefInfoNode, 'RefID', objAcctMapping[0].getValue('custrecord_acct_map_dom_ach_co_id'));
				}
			}
			// END: OrgnrDepAcctID

			// START: RcvrParty
			var rcvrPartyNode = addNodeFromParentNode(xmlDoc, pmtRecNode, 'RcvrParty');

			// if checks[z].entityname
			// if (!isEmpty(objVendor.vendorname)) {
			if (checkData != undefined) {
				var rcvrPartyNameNode = addNodeFromParentNode(xmlDoc, rcvrPartyNode, 'Name');
        if (USE_CHECK_ADDR=='T' && checkData != undefined) { 
          if (!isEmpty(checkData.custbody_ica_vendor_name)) {
            addTextNodeFromParentNode(xmlDoc, rcvrPartyNameNode, 'Name1', checkData.custbody_ica_vendor_name || '');
          } else {
            addTextNodeFromParentNode(xmlDoc, rcvrPartyNameNode, 'Name1', checkData.addressee || '');  
          }
          
        } else  {
          addTextNodeFromParentNode(xmlDoc, rcvrPartyNameNode, 'Name1', checkData.addressee || '');
        }				
			}
			// }

			var ccrRefType =
				!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_ccr_reftype'))
					? objVDCRecResults[0].getValue('custrecord_ccr_reftype')
					: '';
			// as per Al on 4th May 2016
			// On the VPM: Vendor Profile Tab: custentity_vendorreftype,
			// (XML: RefType = VN) please default this value to 'VN' in your
			// code, I don't want to use this field anymore.
			// var refType = (pmtMethod != 'CCR') ? objVendor.vreftype :
			// ccrRefType;
			var refType = ccrRefType ? ccrRefType : 'VN';
			var refInfoNode = addNodeFromParentNode(xmlDoc, rcvrPartyNode, 'RefInfo');

			if (refType) setAttributeValue(refInfoNode, 'RefType', refType);

			if (!isEmpty(payeeId)) addTextNodeFromParentNode(xmlDoc, refInfoNode, 'RefID', payeeId);

      

			var rPPostAddrNode = '';
			// if (checkData.address) {
			rPPostAddrNode = addNodeFromParentNode(xmlDoc, rcvrPartyNode, 'PostAddr');

      
      if (USE_CHECK_ADDR=='T' && checkData != undefined) { 
        dAudit('RcvrParty', 'Using CHECK Address');
        dAudit('checkData', JSON.stringify(checkData));
        if (!isEmpty(checkData.custbody_ica_vendor_add_line_1)) 
          addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, 'Addr1', checkData.custbody_ica_vendor_add_line_1);
        if (!isEmpty(checkData.custbody_ica_vendor_add_line_2)) 
          addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, 'Addr2', checkData.custbody_ica_vendor_add_line_2);
        if (!isEmpty(checkData.custbody_ica_vendor_city)) 
          addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, 'City', checkData.custbody_ica_vendor_city);
        if (!isEmpty(checkData.custbody_ica_vendor_state))
          addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, 'StateProv', checkData.custbody_ica_vendor_state);
        if (!isEmpty(checkData.custbody_ica_zip_postal_code))
          addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, 'PostalCode', checkData.custbody_ica_zip_postal_code);  
        if (!isEmpty(checkData.custbody_ica_country_code)) {
          addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, 'Country', checkData.custbody_ica_country_code);
          addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, 'CountryName', cmMapping[checkData.custbody_ica_country_code]);
        }        

        // if (!isEmpty(checkData.address1)) addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, 'Addr1', checkData.address1);
        // if (!isEmpty(checkData.address2)) addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, 'Addr2', checkData.address2);
        // if (!isEmpty(checkData.city)) addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, 'City', checkData.city);
        // if (!isEmpty(checkData.state)) addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, 'StateProv', checkData.state);
        // if (!isEmpty(checkData.zipcode)) addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, 'PostalCode', checkData.zipcode);
  
        // if (!isEmpty(checkData.countrycode)) {
        //   addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, 'Country', checkData.countrycode); //countryCodeMapping[checkData.countrycode]
        //   // addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, 'country', checkData.countrycode);
        // }  

      } else {
        //if billtype is check, use entity
        // if (!isEmpty(checkData.address1)) addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, 'Addr1', checkData.address1);
        // if (!isEmpty(checkData.address2)) addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, 'Addr2', checkData.address2);
        // if (!isEmpty(checkData.city)) addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, 'City', checkData.city);
        // if (!isEmpty(checkData.state)) addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, 'StateProv', checkData.state);
        // if (!isEmpty(checkData.zipcode)) addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, 'PostalCode', checkData.zipcode);
  
        // if (!isEmpty(checkData.countrycode)) {
        //   addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, 'Country', checkData.countrycode); //countryCodeMapping[checkData.countrycode]
        // }
        
        // if ((!isEmpty(objVendor.vendoraddrs1)) || (!isEmpty(objVendor.vendoraddrs2)) || (!isEmpty(objVendor.vendorcity)) || (!isEmpty(objVendor.vendorstateprovince))
        //     || (!isEmpty(objVDCRecResults) && !isEmpty(objVDCRecResults[0].getValue('custrecord_comppostcode'))) || (!isEmpty(objVendor.vendorpostal))
        //     || (!isEmpty(objVendor.vendorcountrycode))) {

        //   rPPostAddrNode = addNodeFromParentNode(xmlDoc, rcvrPartyNode, 'PostAddr');
        // }

        if (!isEmpty(objVendor.vendoraddrs1))
          addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, 'Addr1', objVendor.vendoraddrs1);
        if (!isEmpty(objVendor.vendoraddrs2))
          addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, 'Addr2', objVendor.vendoraddrs2);
        if (!isEmpty(objVendor.vendorcity))
          addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, 'City', objVendor.vendorcity);
        if (!isEmpty(objVendor.vendorstateprovince))
          addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, 'StateProv', objVendor.vendorstateprovince);
        if (!isEmpty(objVendor.vendorpostal))
          addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, 'PostalCode', objVendor.vendorpostal);

        if (!isEmpty(objVendor.vendorcountrycode)) {
          addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, 'Country', countryCodeMapping[objVendor.vendorcountrycode]);
          addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, 'CountryName', objVendor.vendorcountrycode);
        }

      }  
      


			// }


			// END: RcvrParty

			// START: RcvrDepAcctID
			// END: RcvrDepAcctID

			// START : IntermediaryDepAccID
			// END : IntermediaryDepAccID
      if (checkData != undefined) {
        if (
          checkData.InvoiceNum ||
          checkData.TotalCurAmt ||
          checkData.NetCurAmt ||
          checkData.DiscountCurAmt ||
          checkData.PONum ||
          checkData.NoteText ||
          checkData.EffDt
        ) {
          var pmtDetailsNode = addNodeFromParentNode(xmlDoc, pmtRecNode, 'PmtDetail');
          var pmtInvoiceInfoNode = addNodeFromParentNode(xmlDoc, pmtDetailsNode, 'InvoiceInfo');
          if (checkData.EffDt) {
            var d = nlapiStringToDate(checkData[checkData.EffDt]);
            var momentD = moment(d);
            if (momentD.isValid()) {
              setAttributeValue(pmtInvoiceInfoNode, 'EffDt', momentD.format('YYYY-MM-DD') || '');
            }
          }
  
          if (checkData.InvoiceNum) {
            setAttributeValue(pmtInvoiceInfoNode, 'InvoiceNum', checkData[checkData.InvoiceNum]);
          }
          if (checkData.TotalCurAmt) {
            if (isNaN(checkData[checkData.TotalCurAmt])) {
              // setAttributeValue(pmtInvoiceInfoNode, 'TotalCurAmt', checkData[checkData.TotalCurAmt]);
            } else {
              setAttributeValue(pmtInvoiceInfoNode, 'TotalCurAmt', Math.abs(checkData[checkData.TotalCurAmt]).toFixed(2));
            }
          }
  
          if (checkData.NetCurAmt) {
            if (isNaN(checkData[checkData.NetCurAmt])) {
              // setAttributeValue(pmtInvoiceInfoNode, 'NetCurAmt', checkData[checkData.NetCurAmt]);
            } else {
              setAttributeValue(pmtInvoiceInfoNode, 'NetCurAmt', Math.abs(checkData[checkData.NetCurAmt]).toFixed(2));
            }
          }
  
      }

				//Always 0.00
				setAttributeValue(pmtInvoiceInfoNode, 'DiscountCurAmt', '0.00');
				// if (checkData.DiscountCurAmt) {
				// 	if (isNaN(checkData[checkData.DiscountCurAmt])) {
				// 		// setAttributeValue(pmtInvoiceInfoNode, 'DiscountCurAmt', checkData[checkData.DiscountCurAmt]);
				// 	} else {
				// 		setAttributeValue(pmtInvoiceInfoNode, 'DiscountCurAmt', Math.abs(checkData[checkData.DiscountCurAmt]).toFixed(2));
				// 	}
				// }

				if (checkData.PONum) {
					var pmtPOInfoNode = addNodeFromParentNode(xmlDoc, pmtInvoiceInfoNode, 'POInfo');
					setAttributeValue(pmtPOInfoNode, 'POType', 'PO');
					addTextNodeFromParentNode(xmlDoc, pmtPOInfoNode, 'PONum', checkData[checkData.PONum]);
				}
				if (checkData.NoteText) {
					var pmtNoteNode = addNodeFromParentNode(xmlDoc, pmtInvoiceInfoNode, 'Note');
					setAttributeValue(pmtNoteNode, 'NoteType', 'INV');
					addTextNodeFromParentNode(xmlDoc, pmtNoteNode, 'NoteText', checkData[checkData.NoteText]);
					// setAttributeValue(pmtNoteNode, 'NoteText', checkData[checkData.NoteText]);
				}
			}

			addTextNodeFromParentNode(xmlDoc, pmtRecNode, 'CurAmt', Number(checks[z].amtdue).toFixed(2));

			tmpTotalAmt += Number(checks[z].amtdue);

			dAudit('Added check', JSON.stringify(checks[z]));
		}

		//end

		// if (pmtMethod == 'IAC' || pmtMethod == 'MTS' || pmtMethod == 'IWI' || pmtMethod == 'ACH' || pmtMethod == 'DAC' || pmtMethod=='PLC' || pmtMethod=='CHK' || pmtMethod == 'CCR') {
		// 	dAudit('creatXMLDoc', 'tmpTotalAmt = ' + tmpTotalAmt);
		// }
		// else {
		// 	setAttributeValue(fileNode, 'PmtRecCount', pmtCtr);
		// 	setAttributeValue(fileNode, 'PmtRecTotal', tmpTotalAmt.toFixed(2));
		// }
		setAttributeValue(fileNode, 'PmtRecCount', pmtCtr);
		setAttributeValue(fileNode, 'PmtRecTotal', tmpTotalAmt.toFixed(2));

		var fileCtrlNumber = Date.create().format('{yy}{MM}{dd}{mm}{ss}');
		var fileInfoGrpNode = addNodeFromParentNode(xmlDoc, fileNode, 'FileInfoGrp');
		setAttributeValue(fileInfoGrpNode, 'FileDate', currDate);
		setAttributeValue(fileInfoGrpNode, 'FileControlNumber', 'FILE' + pad(fileCtrlNumber, 4));

		dAudit('creatXMLDoc', '>>> END <<<');

		// dLog('creatXMLDoc', 'xmlDoc = ' + nlapiXMLToString(xmlDoc));

		return xmlDoc;
	} catch (e) {
		var stErrMsg = '';
		if (e.getDetails != undefined) {
			stErrMsg = 'Script Error: ' + e.getCode() + '<br>' + e.getDetails() + '<br>' + e.getStackTrace();
		} else {
			stErrMsg = 'Script Error: ' + e.toString();
		}

		dErr('Script Error', stErrMsg);
	}
}



