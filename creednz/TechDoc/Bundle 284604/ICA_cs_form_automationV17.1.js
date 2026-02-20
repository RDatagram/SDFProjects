

var myMask = new Ext.LoadMask(Ext.getBody(), {
	msg : "Your request is processing."
});

var dfArr = [];

function pageInit_() {
	try {
		var intCount = nlapiGetLineItemCount('result_list');
		for (var i = 1; i <= intCount; i++) {

			var billType = nlapiGetLineItemValue('result_list', '_billtype', i);
			// console.log('pageInit_', 'Bill type : ' + billType);
			if ((billType == 'vendorcredit') || (billType == 'check')) {
				nlapiSetLineItemDisabled('result_list', '_disctaken', true, i);
				nlapiSetLineItemDisabled('result_list', '_payment', true, i);
			}
		}

		var dfSearch = nlapiSearchRecord("customrecord_ica_bpm_dynamic_filter", null, [], [
			new nlobjSearchColumn("custrecord_ica_bpm_df_field_name"), 
			new nlobjSearchColumn("custrecord_ica_bpm_df_internal_id"), 
			new nlobjSearchColumn("custrecord_ica_bpm_df_type"),
			new nlobjSearchColumn("custrecord_ica_bpm_df_source"),
		]);
		if (dfSearch!=null) {
			for (var i=0; i<dfSearch.length; i++) {
				dfArr.push('custpage_' + dfSearch[i].getValue('custrecord_ica_bpm_df_internal_id'));
			}
		}
		

	} catch (e) {
		console.log('pageInit_', 'ERROR : ' + e.message);
	}
}

/**
 * 
 */
function fieldChanged_set(type, name) {

	var lineno = nlapiGetCurrentLineItemIndex('result_list');

	if (name == '_pay') {

		var amtDue = nlapiGetLineItemValue('result_list', '_amt_due', lineno);
		var isSelected = nlapiGetLineItemValue('result_list', '_pay', lineno);
		var payment = (isSelected == 'T') ? getFloatValue(amtDue).toFixed(2) : '';

		nlapiSetLineItemValue('result_list', '_payment', lineno, payment, true, false);

		recalc_setTotal();
	}

	if (name == 'custpage_sdate' || name == 'custpage_edate') {
		var sDate = nlapiGetFieldValue('custpage_sdate');
		var eDate = nlapiGetFieldValue('custpage_edate');

		if (!isEmpty(sDate))
			nlapiSetFieldValue('custpage_sdate', sDate, false, false);
		if (!isEmpty(eDate))
			nlapiSetFieldValue('custpage_edate', eDate, false, false);

		nlapiSetFieldValue('custpage_stage', 'N');
    // if (generateXML()) {
      refreshBillList();
    // };		
	}

	if (name == 'custpage_ap_account') {
		nlapiSetFieldValue('custpage_ap_account', nlapiGetFieldValue(name), false, false);
		nlapiSetFieldValue('custpage_stage', 'N');
		refreshBillList();
	}

	if (name == '_payment') {
		var currAmtDue = getFloatValue(nlapiGetLineItemValue('result_list', '_amt_due', lineno));
		var currPay = getFloatValue(nlapiGetLineItemValue('result_list', name, lineno));
		var billType = nlapiGetLineItemValue('result_list', '_billtype', lineno)

		if (billType != 'vendorcredit') {

			if (currPay < 0) {
				nlapiSetLineItemValue('result_list', '_pay', lineno, 'F', false, false);
				nlapiSetLineItemValue('result_list', name, lineno, '0.00');
			} else if (currPay > currAmtDue) {
				nlapiSetLineItemValue('result_list', '_payment', lineno, currAmtDue.toFixed(2));
				nlapiSetLineItemValue('result_list', '_pay', lineno, 'T');
			} else {
				nlapiSetLineItemValue('result_list', '_pay', lineno, 'T');
			}
		} else {
			if (currPay < 0) {

				nlapiSetLineItemValue('result_list', '_pay', lineno, 'T');

			} else if (currPay > 0) {
				nlapiSetLineItemValue('result_list', name, lineno, (currPay * -1));
				nlapiSetLineItemValue('result_list', '_pay', lineno, 'T');
			}
		}

		recalc_setTotal();
	}

	if (name == '_disctaken') {
		var currDisc = getFloatValue(nlapiGetLineItemValue('result_list', '_disctaken', lineno));
		var amtDue = getFloatValue(nlapiGetLineItemValue('result_list', '_amt_due', lineno));
		var isSelect = nlapiGetLineItemValue('result_list', '_pay', lineno);

		if (currDisc > 0 && isSelect == 'T') {

			nlapiSetLineItemValue('result_list', '_payment', lineno, (amtDue - currDisc).toFixed(2));
			recalc_setTotal();
		}
	}

	if (name == 'custpage_bank_account') {
		// nlapiSetFieldValue('custpage_balance', nlapiLookupField('account',
		// nlapiGetFieldValue(name), 'balance'));
		nlapiSetFieldValue('custpage_stage', 'N');
		refreshBillList();
	}

	if (name == 'custpage_paymenttype') {
		nlapiSetFieldValue('custpage_stage', 'N');
		refreshBillList();
	}

	if (name == 'custpage_payee') {
		var payee = nlapiGetFieldValues('custpage_payee');
		nlapiSetFieldValues('custpage_payee', payee, false, false);
		nlapiSetFieldValue('custpage_stage', 'N');
		refreshBillList();
	}

	if (name == 'custpage_bill_type') {
		var billType = nlapiGetFieldValue('custpage_bill_type');
		nlapiSetFieldValue('custpage_bill_type', billType, false, false);
		nlapiSetFieldValue('custpage_stage', 'N');
		refreshBillList();
	}

	//Added for currency automation - RSF

	if (name == 'custpage_currency') {
		var currency = nlapiGetFieldValue('custpage_bill_type');
		//nlapiSetFieldValue('custpage_currency', currency, false, false);
		nlapiSetFieldValue('custpage_stage', 'N');
		refreshBillList();
	}
	if (name == 'custpage_priority') {
		// var currency = nlapiGetFieldValue('custpage_bill_type');
		//nlapiSetFieldValue('custpage_currency', currency, false, false);
		nlapiSetFieldValue('custpage_stage', 'N');
		refreshBillList();
	}
	

	if (name == 'custpage_vendor_categ') {
		
		//var billType = nlapiGetFieldValue('custpage_bill_type');
		//nlapiSetFieldValue('custpage_bill_type', billType, false, false);
		nlapiSetFieldValue('custpage_stage', 'N');
		refreshBillList();
	}

	if ((name == 'custpage_tobeprinted') || (name == 'custpage_processascheck')) {
		
		//var billType = nlapiGetFieldValue('custpage_bill_type');
		//nlapiSetFieldValue('custpage_bill_type', billType, false, false);
		nlapiSetFieldValue('custpage_stage', 'N');
		refreshBillList();
	}

	if (dfArr!=null) {
		for (var i=0; i<dfArr.length; i++) {
			if (name==dfArr[i]) {
				nlapiSetFieldValue('custpage_stage', 'N');
				refreshBillList();		
			}
		}
		
	}



	return true;
}



function recalc_setTotal() {
  var TOTAL_BATCH_NUM = nlapiGetFieldValue('custpage_tbn');  
	var amountTotal = 0;
	var listCtr = nlapiGetLineItemCount('result_list');

  var counter = 0;
  
	for (var i = 1; i <= listCtr; i++) {
		if (nlapiGetLineItemValue('result_list', '_pay', i) == 'T') {

			var amtDue = nlapiGetLineItemValue('result_list', '_amt_due', i);
			var discTaken = nlapiGetLineItemValue('result_list', '_disctaken', i);
			var payment = nlapiGetLineItemValue('result_list', '_payment', i);
      var payee = nlapiGetLineItemValue('result_list', '_payee_id_hdn', i); 

      
      
      

			if (!isEmpty(discTaken)) {
				payment = parseFloat(amtDue) - parseFloat(discTaken);
				nlapiSetLineItemValue('result_list', '_payment', i, payment.toFixed(2));
			}
			amountTotal += parseFloat((isEmpty(payment) ? '0' : payment));
      counter++;      
      

      if (amountTotal>TOTAL_BATCH_NUM && TOTAL_BATCH_NUM != '') {
        alert('Selected transaction exceeds total batch number. Unchecking last transaction selected.');
        counter--;
        amountTotal -= parseFloat((isEmpty(payment) ? '0' : payment));
        nlapiSetLineItemValue('result_list', '_payment', i, '');
        nlapiSetLineItemValue('result_list', '_pay', i, false);
      }
    
		}
	}

  // alert(JSON.stringify(totalsPerVendor));


  
  
  nlapiSetFieldValue('custpage_amount', amountTotal);
	nlapiSetFieldValue('custpage_counter', counter);
}

function toMark(bmark) {
	var listCtr = nlapiGetLineItemCount('result_list');
	var amountTotal = 0;
	for (var i = 1; i <= listCtr; i++) {
		nlapiSetLineItemValue('result_list', '_pay', i, bmark ? 'T' : 'F');
		var amtDue = getFloatValue(nlapiGetLineItemValue('result_list', '_amt_due', i));

		if (bmark) {
			nlapiSetLineItemValue('result_list', '_payment', i, amtDue.toFixed(2), true, false);
		} else {
			nlapiSetLineItemValue('result_list', '_payment', i, '', true, false);
		}
	}

	recalc_setTotal();
}

function downloadCSV() {

	var lineCtr = nlapiGetLineItemCount('result_list');
	var selected = [];
	var inputData = [];
	for (var i = 1; i <= lineCtr; i++) {
		if (nlapiGetLineItemValue('result_list', '_pay', i) == 'T') {
			selected.push(nlapiGetLineItemValue('result_list', '_billid', i));
			inputData.push({
				id: nlapiGetLineItemValue('result_list', '_billid', i),
				disctaken: nlapiGetLineItemValue('result_list', '_disctaken', i),
				payment: nlapiGetLineItemValue('result_list', '_payment', i)
			});
		}
	}

	// var context = nlapiGetContext();
	// context.setSessionObject('test', 'This is a test');

	var params = {
		apaccount : nlapiGetFieldValue('custpage_ap_account') || "",
		account : nlapiGetFieldValue('custpage_bank_account') || "",
		balance : nlapiGetFieldValue('custpage_balance') || "",
		date : nlapiGetFieldValue('custpage_trandate') || "",
		postingperiod : nlapiGetFieldValue('custpage_postingperiod') || "",
		amount : nlapiGetFieldValue('custpage_amount') || "",
		subsidiary : nlapiGetFieldValue('custpage_subsidiary_id') || "",
		billtype : nlapiGetFieldValue('custpage_bill_type') || "",
		paymentmethod : nlapiGetFieldValue('custpage_paymenttype') || "",
		vendorcategory : nlapiGetFieldValues('custpage_vendor_categ') || "",
		currency : nlapiGetFieldValue('custpage_currency') || "",
		priority : nlapiGetFieldValue('custpage_priority') || "",
		vendor : nlapiGetFieldValues('custpage_payee') || "",
		location : nlapiGetFieldValue('custpage_location') || "",
		startduedate : nlapiGetFieldValue('custpage_sdate') || "",
		endduedate : nlapiGetFieldValue('custpage_edate') || "",
		selected : selected,
		inputData: JSON.stringify(inputData),
		client : ($('#clientSelect').val() || ""),
		stage : ($('#stageSelect').val() || ""),
		location : ($('#locationSelect').val() || ""),
		clientgroup : ($('#clientgroupSelect').val() || ""),
		subsidiary : ($('#subsidiarySelect').val() || ""),
		fundgroup : ($('#fundgroupSelect').val() || "")
	}
	// alert(JSON.stringify(params));

	// alert(JSON.stringify(selected));
	if (dfArr!=null) {
		for (var i=0; i<dfArr.length; i++) {
			params[dfArr[i]] = nlapiGetFieldValue(dfArr[i]);
		}
		
	}




	var maintable = nlapiResolveURL('SUITELET', 'customscript_ica_sl_vpm_mainv17_1', 'customdeploy1') + '&action=downloadcsv';
	// maintable += '&params=' + JSON.stringify(params);
    // maintable += '&client=' + ($('#clientSelect').val() || "");
    // maintable += '&stage=' + ($('#stageSelect').val() || "");
    // maintable += '&location=' + ($('#locationSelect').val() || "");
    // maintable += '&clientgroup=' + ($('#clientgroupSelect').val() || "");
    // maintable += '&subsidiary=' + ($('#subsidiarySelect').val() || "");
	// maintable += '&fundgroup=' + ($('#fundgroupSelect').val() || "");

	var url = nlapiRequestURL(maintable, params);

	window.open(url.getBody());

	// alert(url.getBody());


	// nlapiSetRedirectURL("SUITELET", "customscript_ica_sl_vpm_mainv17_1", "customdeploy1", false, params);
    // window.open(maintable);

	// window.open("www.google.com");
}



function generateXML() {
  // Create our number formatter.
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  });  

  var totalsPerVendor = {};
  var listCtr = nlapiGetLineItemCount('result_list');

  var counter = 0;
  
	for (var i = 1; i <= listCtr; i++) {
		if (nlapiGetLineItemValue('result_list', '_pay', i) == 'T') {

			var amtDue = nlapiGetLineItemValue('result_list', '_amt_due', i);
			var discTaken = nlapiGetLineItemValue('result_list', '_disctaken', i);
			var payment = nlapiGetLineItemValue('result_list', '_payment', i);
      var payee = nlapiGetLineItemValue('result_list', '_payee_id_hdn', i); 
      
    

      payment = parseFloat(payment)  || (parseFloat(amtDue) - (parseFloat(discTaken) || 0));        
		  if (payment) {
        if (!totalsPerVendor[payee]) {
          totalsPerVendor[payee] = 0;
        }
        totalsPerVendor[payee] += payment;
      }            
		}
	}  

  var overTheLimit = [];
  var limitDetails = [];
  var crLimitDetails = [];
  for (var i = 1; i <= listCtr; i++) {
    if (nlapiGetLineItemValue('result_list', '_pay', i) == 'T') {
      var payee = nlapiGetLineItemValue('result_list', '_payee_id_hdn', i);
      var paymentMethod = nlapiGetLineItemValue('result_list', '_paymethod', i);      
      var vendorCL = nlapiGetLineItemValue('result_list', '_vendor_cl', i);       
      var vendorCCL = nlapiGetLineItemValue('result_list', '_vendor_ccl', i);
      var payeeName = nlapiGetLineItemValue('result_list', '_payee_name', i);       

      if (vendorCL) {
        if (Number(totalsPerVendor[payee]) > Number(vendorCL)) {
          if(overTheLimit.indexOf(payeeName) === -1) {
            overTheLimit.push(payeeName);
            limitDetails.push({
              payeeName: payeeName,
              vendorCL: vendorCL,
              totalSelected: totalsPerVendor[payee]
            });
          }        
        }  
      }

      if (vendorCCL) {
        if (paymentMethod=='CCR') {
          if (Number(totalsPerVendor[payee]) > Number(vendorCCL)) {
            if(overTheLimit.indexOf(payeeName) === -1) {
              overTheLimit.push(payeeName);
              crLimitDetails.push({
                payeeName: payeeName,
                vendorCCL: vendorCCL,
                totalSelected: totalsPerVendor[payee]
              });
            }        
          }    
        }
      }
    }
  }

  if (limitDetails.length) {
    var text = 'Selected bills of the following exceeded vendor credit limit: \n\n';
    for (var i=0; i<limitDetails.length; i++) {
      text += 'Vendor: ' + limitDetails[i].payeeName + ', Credit Limit: ' + formatter.format(limitDetails[i].vendorCL) + '\nSelected bill/s total: ' + formatter.format(limitDetails[i].totalSelected)  + '\n\n';

    }
    text += '\n Please adjust.';
    alert(text);
    nlapiSetFieldValue('custpage_hascl', 'T');
    return false;
  }

  if (crLimitDetails.length) {
    var text = 'Selected bills of the following exceeded vendor credit card limit: \n\n';
    for (var i=0; i<crLimitDetails.length; i++) {
      text += 'Vendor: ' + crLimitDetails[i].payeeName + ', Credit Limit: ' + formatter.format(crLimitDetails[i].vendorCCL) + '\nSelected bill/s total: ' + formatter.format(crLimitDetails[i].totalSelected)  + '\n\n';

    }
    text += '\n Please adjust.';
    alert(text);
    nlapiSetFieldValue('custpage_hascl', 'T');
    return false;
  }

  nlapiSetFieldValue('custpage_hascl', 'F');
	return true;
}

/**
 * 
 * @param fldValue
 * @returns
 */
function getFloatValue(fldValue) {
	if (isEmpty(fldValue))
		return 0.00;

	return parseFloat(fldValue);
}

function refreshBillList() {
	var d = nlapiGetFieldValue('custpage_delay_result');
	if (d=='F') {
		window.ischanged = false;
		document.forms['main_form'].submit();	
	}
}

function displayresults() {
	nlapiSetFieldValue('custpage_stage', 'N');
	window.ischanged = false;
	document.forms['main_form'].submit();	
}

function isEmpty(fldValue) {
	return fldValue == '' || fldValue == null || fldValue == undefined;
}
