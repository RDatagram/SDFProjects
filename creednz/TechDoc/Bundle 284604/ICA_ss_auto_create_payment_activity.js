/**
 * 
 * @returns
 */
function schedCreatePaymentActivityRec() {
	try {

		dLog('schedCreatePaymentActivityRec', '>>>START<<<');
		var paramBPMRecords = nlapiGetContext().getSetting('SCRIPT', 'custscript_ica_bpm_records');
		var paramPayeePayments = nlapiGetContext().getSetting('SCRIPT', 'custscript_ica_payee_payments');
		var objBPMRecs = JSON.parse(paramBPMRecords);
		var objPayeePayments = JSON.parse(paramPayeePayments);

		dLog('schedCreatePaymentActivityRec', 'Bills info  = ' + JSON.stringify(objBPMRecs));
		dLog('schedCreatePaymentActivityRec', 'Payee payments  = ' + JSON.stringify(objPayeePayments));

		var arrPaymentBatchMap = [];

		for (x in objBPMRecs) {

			var yielded = yieldIfRequired();

			var objD = objBPMRecs[x];
			dLog('schedCreatePaymentActivityRec', 'Bill selected  = ' + JSON.stringify(objD));

			try {

				var rec = nlapiCreateRecord('customrecord_ica_pn_payment_activity', {
					recordmode : 'dynamic'
				});

				var today = new Date();
				var timeStamp = Date.create().format('{HH}{mm}{ss}{yyyy}{MM}{dd}');
				rec.setFieldValue('custrecord_ica_batchid', timeStamp);
				// rec.setFieldValue('custrecord_ica_type', objD.);
				rec.setFieldValue('custrecord_ica_payee', objD.payee);
				rec.setFieldValue('custrecord_ica_payee_internal_id', objD.payee);
				// rec.setFieldValue('custrecord_ica_reference_number', '');
				rec.setFieldValue('custrecord_ica_trans_internal_id', objD.id);
        
				// rec.setFieldValue('custrecord_ica_date_of_transcation', '');
				rec.setFieldValue('custrecord_ica_payment_date', nlapiDateToString(today));
				// rec.setFieldValue('custrecord_ica_payment_currency', '');
				rec.setFieldValue('custrecord_ica_payment_orig_amt', Math.abs(objD.origamt));
				rec.setFieldValue('custrecord_ica_amount_of_payment', Math.abs(objD.pay));

				rec.setFieldValue('custrecord_ica_transaction', objD.id);



				if (objD.sub_id)
					rec.setFieldValue('custrecord_ica_subsidiary', Math.abs(objD.sub_id));
				
				if (objPayeePayments[objD.payee]) {
					rec.setFieldValue('custrecord_ica_bill_payment_id', objPayeePayments[objD.payee]);

          if (!arrPaymentBatchMap[objPayeePayments[objD.payee]]) {
            arrPaymentBatchMap[objPayeePayments[objD.payee]] = timeStamp;
          } else {
            timeStamp = arrPaymentBatchMap[objPayeePayments[objD.payee]];
          }
					
          try {
            nlapiSubmitField('vendorbill', objD.id, 'custbody_ica_batch_id', timeStamp);
          } catch (e) {
            try {
              nlapiSubmitField('vendorcredit', objD.id, 'custbody_ica_batch_id', timeStamp);
            } catch (e) {
              var stErrMsg = '';
              if (e.getDetails != undefined) {
                stErrMsg = e.getCode() + '<br>' + e.getDetails() + '<br>' + e.getStackTrace();
              } else {
                stErrMsg = e.toString();
              }
          
              dLog('Script Error', stErrMsg);        
            }
          }  
				}

				var id = nlapiSubmitRecord(rec, true, true);
				dLog('schedCreatePaymentActivityRec', 'Created Payment Activity record | id : ' + id);

			} catch (e) {
				dLog('schedCreatePaymentActivityRec', 'ERROR : ' + e.message);
			}
		}

		for (y in arrPaymentBatchMap) {
			
			var yielded = yieldIfRequired();
			//nlapiSubmitField('vendorpayment', y, 'custbody_ica_batch_id', arrPaymentBatchMap[y]);
      var r = nlapiLoadRecord('vendorpayment', y);
      r.setFieldValue('custbody_ica_batch_id', arrPaymentBatchMap[y]);
      nlapiSubmitRecord(r, true, true);
      dLog('schedCreatePaymentActivityRec', 'Updated Vendor Payment : ' + y);      
          
		}

	} catch (e) {

		var stErrMsg = '';
		if (e.getDetails != undefined) {
			stErrMsg = e.getCode() + '<br>' + e.getDetails() + '<br>' + e.getStackTrace();
		} else {
			stErrMsg = e.toString();
		}

		dLog('Script Error', stErrMsg);
	}

	dLog('sched_createRec', '>>>FINISH<<<');
}

function isEmpty(fldValue) {
	return fldValue == '' || fldValue == null || fldValue == undefined;
}

function dLog(logTitle, logDetails) {
	nlapiLogExecution('DEBUG', logTitle, logDetails);
}
