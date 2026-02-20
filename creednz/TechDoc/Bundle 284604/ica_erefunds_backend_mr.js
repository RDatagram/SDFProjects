/**
 * @NApiVersion 2.0
 * @NScriptType MapReduceScript
 */
define(['N/task', 'N/search', 'N/record', 'N/email', 'N/runtime', 'N/error', 'N/xml', 'N/file', './ica_erefunds_xmllib.js', './ica_erefunds_lib.js'], function (task, search, record, email, runtime, error, xml, file, xmllib, lib) {
	function getInputData() {
		var pids = JSON.parse(runtime.getCurrentScript().getParameter('custscript_ica_er_pids')) || [];
		log.audit('About to process this pids', JSON.stringify(pids));
		return pids;
	}

	function map(context) {
		var params = JSON.parse(context.value);
		log.audit('params', JSON.stringify(params));

		var recordId = params.internalid;
		var amount = Math.abs(Number(params.amount));

    try {
      log.audit(
        'values',
        JSON.stringify({
          recordId: recordId,
          amount: amount,
        })
      );
  
      var customerRefund = record.load({
        type: 'customerrefund',
        id: recordId,
        isDynamic: true,
      });
  
      var lineCount = customerRefund.getLineCount({ sublistId: 'apply' });
      
      var totalAmount = amount;
      for (var i = 0; i < lineCount; i++) {
        if (amount > 0) {
          customerRefund.selectLine({
            sublistId: 'apply',
            line: i,
          });
  
          var lineAmount = Number(
            customerRefund.getCurrentSublistValue({
              sublistId: 'apply',
              fieldId: 'due',
            })
          );
          log.audit('lineAmount', lineAmount);
  
          customerRefund.setCurrentSublistValue({
            sublistId: 'apply',
            fieldId: 'apply',
            value: true,
          });
  
          if (lineAmount > amount) {
            customerRefund.setCurrentSublistValue({
              sublistId: 'apply',
              fieldId: 'amount',
              value: amount,
            });
          } else {
            customerRefund.setCurrentSublistValue({
              sublistId: 'apply',
              fieldId: 'amount',
              value: lineAmount,
            });
            amount -= lineAmount;
          }
          customerRefund.commitLine({
            sublistId: 'apply',
          });
          log.audit('Should have updated', amount);
        }
      }
  
      customerRefund.setValue({
        fieldId: 'custbody_ica_erefunds_paid',
        value: true,
      });
  
      customerRefund.setValue({
        fieldId: 'custbody_ica_eref_date_time_paid_2',
        value: new Date(),
      });
  
      customerRefund.setValue({
        fieldId: 'custbody_ica_erefunds_total_paid',
        value: totalAmount,
      });
  
      // customerRefund.setValue({
      //   fieldId: 'custbody_ica_erefunds_date_time',
      //   value: new Date(),
      // });
      log.audit('before update record', '');
      var id = customerRefund.save(
        {
          ignoreMandatoryFields: true
        }
      );

  
      log.audit('Updated record', id);
  
      context.write({
        key: params.amount,
        value: id,
      });
    } catch (e) {
      log.error('Error encountered. Map', JSON.stringify(e));
    }

		
	}

	function summarize(summary) {
    var is_multicurrency = runtime.isFeatureInEffect({
      feature: 'MULTICURRENCY'
    });

		var type = summary.toString();
		log.audit(type + ' Summary', JSON.stringify(summary));
		log.audit(type + ' Usage Consumed', summary.usage);
		log.audit(type + ' Concurrency Number ', summary.concurrency);
		log.audit(type + ' Number of Yields', summary.yields);

		var contents = 'The following Customer Payments were processed: \n\n';
		var paymentIds = [];
		var internalids = [];
		summary.output.iterator().each(function (key, value) {
			contents += key + ' - ' + value + '\n';
			paymentIds.push({
				internalid: value,
				amount: key,
			});
			internalids.push(value);
			return true;
		});
		log.audit('contents', contents);

		var scriptParams = JSON.parse(runtime.getCurrentScript().getParameter('custscript_ica_er_script_params')) || [];
		log.audit('scriptParams', JSON.stringify(scriptParams));
		log.audit('scriptParams.pageFilters', scriptParams.pageFilters);
		log.audit('scriptParams.pageFilters.currencyFilter', scriptParams.pageFilters.currencyFilter);
		log.audit('scriptParams.scriptParameters', scriptParams.scriptParameters);
		log.audit('scriptParams.scriptParameters.fileNamePrefix', scriptParams.scriptParameters.fileNamePrefix);

		//Create XML File.

    if (paymentIds.length > 0) {
      var fileId = xmllib.processAndSendXMLFile(JSON.stringify(paymentIds), scriptParams);
      var user = scriptParams.scriptParameters.sendSummaryEmail;
      log.audit('DATA', {
        fileId: fileId,
        user: user,
      });
      //Send Email.
      if (user) {
        log.audit('About to send 2 emails', user);
        var senderId = -5;
        var recipientId = user;
        var arr = recipientId.split(',').map(function (item) {
          return item.trim();
        });
        log.audit('arr', arr);
        var timeStamp = new Date().getUTCMilliseconds();
  
        if (fileId) {
          var fileRec = file.load({
            id: fileId,
          });
          email.send({
            author: senderId,
            recipients: arr,
            subject: 'XML Customer Payment (iCA eRefunds)',
            body: 'Hi, <br /><br />Please see attached file.',
            attachments: [fileRec],
          });
        } else {
          email.send({
            author: senderId,
            recipients: arr,
            subject: 'XML Customer Payment (iCA eRefunds)',
            body: 'Hi, <br /><br />No file generated for this run.',
          });
        }
  
        //Send XML Email if preference is to send to logged in user.
        //Ask Al if to send email to vendor?
  
        //Send Email.
        var stHtml = '<table>';
        stHtml += ' <tr><td></td></tr>';
        stHtml += '</table><br>';
        stHtml += ' <table width="100%">';
        stHtml += '<tr style="background-color: #555555; color: white;">';
        stHtml += '<td style="border-bottom:1px black; width: 10px;" align="center">Payee Name</td>';
        stHtml += '<td style="border-bottom:1px black; width: 10px;" align="center">Payment Method</td>';
        stHtml += '<td style="border-bottom:1px black; width: 10px;" align="center">Reference Number</td>';
        stHtml += '<td style="border-bottom:1px black; width: 10px;" align="center">Payment Total</td>';
        stHtml += '<td style="border-bottom:1px black; width: 10px;" align="center">Currency</td>';
        stHtml += ' </tr>';
  
        var paymentsData = lib.getPaymentsData(internalids, null);
  
        if (paymentsData.length > 0) {
          for (var i = 0; i < paymentsData.length; i++) {
            var customerPayment = paymentsData[i];
            log.audit('customerPayment', JSON.stringify(customerPayment));
            var currencyText = '';
            if (!is_multicurrency) currencyText = 'USD';
            else currencyText = customerPayment.currency.text;
  
            stHtml += '<tr style="background-color: #e3e3e3">';
            stHtml += '<td align="left">' + customerPayment.entity.text + '</td>';
            stHtml += '<td align="left">' + customerPayment.custentity_paymentmethod_customer.text + '</td>';
            stHtml += '<td align="left"><a href="/app/accounting/transactions/custrfnd.nl?id=' + customerPayment.internalid.value + '" target="_blank">' + customerPayment.tranid.value + '</a></td>';
            stHtml += '<td align="left">' + customerPayment.amount.value + '</td>';
            stHtml += '<td align="left">' + currencyText + '</td>';
          }
        }
  
        log.audit('stHtml', stHtml);
  
        var senderId = -5;
        var recipientId = user;
        email.send({
          author: senderId,
          recipients: recipientId,
          subject: 'Batch Payment Summary (iCA eRefunds)',
          body: stHtml,
        });
      }
  
      //Deploy Check Zip
      log.audit('scriptParams.scriptParameters.includeCheckZip', scriptParams.scriptParameters.includeCheckZip);
      if (scriptParams.scriptParameters.includeCheckZip) {
        if (scriptParams.scriptParameters.checkZipDeploymentID) {
          var scriptTask = task.create({ taskType: task.TaskType.SCHEDULED_SCRIPT });
          scriptTask.scriptId = 'customscript_ica_bpm_zip_check';
          scriptTask.deploymentId = scriptParams.scriptParameters.checkZipDeploymentID;
          scriptTask.params = { 
            custscript_ica_cz_type: 'REFUND',
            custscript_ica_cz_billpymtid: JSON.stringify(internalids),
            custscript_ica_cz_internalids_to_check: scriptParams.scriptParameters.checkZipColumns
          };
          var scriptTaskId = scriptTask.submit();
          log.audit('Deployed Check zip', scriptTaskId);    
        }
      }
  
      //Send Email Summary.
  
      log.audit('End Map Reduce', '');
  
    } else {
      log.error('No Payment IDs correctly processed, aborting creation of XML and sending error email', JSON.stringify(paymentIds));
      var user = scriptParams.scriptParameters.sendSummaryEmail;
      log.audit('DATA', {        
        user: user,
      });
      var recipientId = user;
      var arr = recipientId.split(',').map(function (item) {
        return item.trim();
      });
      log.audit('arr', arr);

      //Send Email.

      email.send({
        author: -5,
        recipients: arr,
        subject: 'Error on Customer Refunds - Aborting File Creation',
        body: 'No file created. There were errors creating customer refunds. If issue persists, please contact administrator.'
      });
    }

	}

	return {
		getInputData: getInputData,
		map: map,
		summarize: summarize,
	};
});
