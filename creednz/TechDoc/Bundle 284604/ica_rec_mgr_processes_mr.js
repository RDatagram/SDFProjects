/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/task', 'N/search', 'N/record', 'N/email', 'N/runtime', 'N/error', 'N/xml', 'N/file', './ica_rec_mgr_xml_lib', './ica_rec_mgr_lib'], function (task, search, record, email, runtime, error, xml, file, xmllib, lib) {
	const PM = {
		DAC: 1,
		MTS: 4,
		NACHA: 21,
	};

	const groupBy = (xs, key) => {
		return xs.reduce((rv, x) => {
			(rv[x[key]] = rv[x[key]] || []).push(x);
			return rv;
		}, {});
	};

	const getInputData = () => {
		let ids = JSON.parse(runtime.getCurrentScript().getParameter('custscript_ica_recmgr_ids')) || [];
		ids = groupBy(ids, 'customerid');
		const toProcess = Object.keys(ids).map((customerid) => ({ customerid, transactions: ids[customerid] }));

		log.audit('About to process this ids', JSON.stringify(toProcess));
		return toProcess;
	};

	const map = (context) => {
		let params = JSON.parse(context.value);
		let scriptParams = JSON.parse(runtime.getCurrentScript().getParameter('custscript_ica_recmgr_script_params')) || [];

		log.audit('params', JSON.stringify(params));
		log.audit('scriptParams', JSON.stringify(scriptParams));
		log.audit('scriptParams.pageFilters', scriptParams.pageFilters);

		let customerId = params.customerid;
		let transactionLineItems = params.transactions;
		transactionLineItems = _.map(transactionLineItems, 'internalid');
		let transactions = params.transactions;
		log.audit('customerId', customerId);
		log.audit('transactionLineItems', transactionLineItems);

    let accountId = '';
    try {
      accountId = search.lookupFields({
        type: 'invoice',
        id: transactionLineItems[0],
        columns: 'account',
      }).account[0].value;
      log.audit('accountId loaded', accountId);
    } catch(e) {
      log.error('Error loading account Id from transaction, defaulting to system pref', e.message);
    }

    
		try {
			let rec = record.create({
				type: 'customerpayment',
				isDynamic: true,
				defaultValues: {
					entity: customerId,
				},
			});

      if (accountId) {
        try {
          rec.setValue('undepfunds', 'T'); //        
          rec.setValue('aracct', accountId);
          rec.setValue('account', scriptParams.pageFilters.bankaccountFilter);
          log.audit('Account set', accountId);  
        } catch (e) {
          log.error('Account not set, defaulting', e.message);
          if (scriptParams.pageFilters.bankaccountFilter) {
            rec.setValue('undepfunds', 'F'); //
            rec.setValue('account', scriptParams.pageFilters.bankaccountFilter);          
            log.audit('Account set', scriptParams.pageFilters.bankaccountFilter);
          }          
        }
      } else {
        if (scriptParams.pageFilters.bankaccountFilter) {
          rec.setValue('undepfunds', 'F'); //
          rec.setValue('account', scriptParams.pageFilters.bankaccountFilter);          
          log.audit('Account set', scriptParams.pageFilters.bankaccountFilter);
        }        
      }


			let applyCount = rec.getLineCount('apply');
			log.audit('applyCount', applyCount);
			for (let i = 0; i < applyCount; i++) {
				let doc = rec.getSublistValue('apply', 'doc', i);
        log.audit('doc-applying', doc);
				if (_.includes(transactionLineItems, Number(doc))) {					
					rec.selectLine('apply', i);
					rec.setCurrentSublistValue({
						sublistId: 'apply',
						fieldId: 'apply',
						value: true,
					});
					rec.commitLine('apply');
				}
			}

			let creditCount = rec.getLineCount('credit');
			log.audit('creditCount', creditCount);
			for (let i = 0; i < creditCount; i++) {
				let doc = rec.getSublistValue('credit', 'doc', i);
				log.audit('doc', doc);
				if (_.includes(transactionLineItems, Number(doc))) {
					rec.selectLine('credit', i);
					rec.setCurrentSublistValue({
						sublistId: 'credit',
						fieldId: 'apply',
						value: true,
					});
					rec.commitLine('credit');
				}
			}

			rec.setValue('custbody_paid_by_file', true);

			let id = rec.save({ ignoreMandatoryFields: true });
			log.audit('Customer Payment created', id);

			context.write({
				key: id,
				value: JSON.stringify({
					customer: customerId,
					transactions: transactions,
				}),
			});
		} catch (e) {
			log.error('Map.error', e.message);
		}
	};

	const summarize = (summary) => {
		var type = summary.toString();

		let contents = 'The following Customer Payments were created: \n\n';
		let paymentIds = [];
		summary.output.iterator().each(function (key, value) {
			let v = JSON.parse(value);
			contents += key + ' - ' + v.transactions + '\n';
			paymentIds.push({
				internalid: key,
				customerid: v.customer,
				transactions: v.transactions,
			});
			return true;
		});
		let scriptParams = JSON.parse(runtime.getCurrentScript().getParameter('custscript_ica_recmgr_script_params')) || [];
		log.audit('summary.paymentIds', paymentIds);
		if (paymentIds.length == 0) {
			log.audit('scriptParams', JSON.stringify(scriptParams));
			log.audit('scriptParams.pageFilters', scriptParams.pageFilters);
			log.audit('scriptParams.pageFilters.currencyFilter', scriptParams.pageFilters.currencyFilter);
			log.audit('scriptParams.scriptParameters', scriptParams.scriptParameters);
			log.audit('scriptParams.scriptParameters.fileNamePrefix', scriptParams.scriptParameters.fileNamePrefix);
			log.error('No Payments were created.', paymentIds);
			return;
		} else {
			log.audit('scriptParams', JSON.stringify(scriptParams));
			log.audit('scriptParams.pageFilters', scriptParams.pageFilters);
			log.audit('scriptParams.pageFilters.currencyFilter', scriptParams.pageFilters.currencyFilter);
			log.audit('scriptParams.scriptParameters', scriptParams.scriptParameters);
			log.audit('scriptParams.scriptParameters.fileNamePrefix', scriptParams.scriptParameters.fileNamePrefix);

			let fileId = '';

			if (scriptParams.pageFilters.paymentmethodFilter == PM.NACHA) {
				fileId = xmllib.processAndSendNACHAFile(paymentIds, scriptParams);
			} else {
				//Get the payment method of the first payment Id. Use it to process
				let customer = record.load({
					type: 'customer',
					id: paymentIds[0].customerid
				});
				let paymentMethod = customer.getValue('custentity_paymentmethod');
				if (paymentMethod == PM.NACHA) {
					log.audit('Processing as NACHA', PM.NACHA);
					fileId = xmllib.processAndSendNACHAFile(paymentIds, scriptParams);
				} else {
					fileId = xmllib.processAndSendXMLFile(paymentIds, scriptParams);
				}
			}

			let user = scriptParams.scriptParameters.sendSummaryEmail;
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
						subject: 'XML Customer Payment (iCA Receivables Manager)',
						body: 'Hi, <br /><br />Please see attached file.',
						attachments: [fileRec],
					});
				} else {
					email.send({
						author: senderId,
						recipients: arr,
						subject: 'XML Customer Payment (iCA Receivables Manager)',
						body: 'Hi, <br /><br />No file generated for this run.',
					});
				}

				//Send XML Email if preference is to send to logged in user.
				//Ask Al if to send email to vendor?

				//Send Email.
				let stHtml = '<table>';
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
				let internalids = _.map(paymentIds, 'internalid');
				let paymentsData = lib.getPaymentsData(internalids, null);

				let txnInternalids = _.map(_.flatten(_.map(paymentIds, 'transactions')), 'internalid');
				log.audit('txnInternalids', JSON.stringify(txnInternalids));
				let transactionData = lib.getTransactionData(txnInternalids);
				log.audit('transactionData', JSON.stringify(transactionData));
				let creditMemoData = lib.getCreditMemosFromInvoices(txnInternalids);
				log.audit('creditMemoData', JSON.stringify(creditMemoData));

				if (paymentsData.length > 0) {
					for (var i = 0; i < paymentsData.length; i++) {
						var customerPayment = paymentsData[i];
						log.audit('customerPayment', JSON.stringify(customerPayment));
						if (Number(customerPayment.amount.value) > 0) {
							stHtml += '<tr style="background-color: #e3e3e3">';
							stHtml += '<td align="left">' + customerPayment.entity.text + '</td>';
							stHtml += '<td align="left">' + customerPayment.custentity_paymentmethod_customer.text + '</td>';
							stHtml += '<td align="left"><a href="/app/accounting/transactions/custpymt.nl?id=' + customerPayment.internalid.value + '" target="_blank">' + customerPayment.tranid.value + '</a></td>';
							stHtml += '<td align="left">' + customerPayment.amount.value + '</td>';
							stHtml += '<td align="left">' + customerPayment.currency.text + '</td>';

							record.submitFields({
								type: 'customerpayment',
								id: customerPayment.internalid.value,
								values: { custbody_flat_file: fileId },
							});
						}
					}
				}

				// if (transactionData.length > 0) {
				// 	for (var i = 0; i < transactionData.length; i++) {
				// 		var txn = transactionData[i];
				// 		log.audit('txn', JSON.stringify(txn));
				// 		// if (Number(txn.amount.value) > 0) {
				// 		stHtml += '<tr style="background-color: #e3e3e3">';
				// 		stHtml += '<td align="left">' + txn.entity.text + '</td>';
				// 		stHtml += '<td align="left">' + txn.custentity_paymentmethod_customer.text + '</td>';
				// 		stHtml += '<td align="left"><a href="/app/accounting/transactions/transaction.nl?id=' + txn.internalid.value + '" target="_blank">' + txn.tranid.value + '</a></td>';
				// 		// stHtml += '<td align="left"><a href="/app/accounting/transactions/transaction.nl?id=' + txn.internalid.value + '" target="_blank">' + txn.tranid.value + '</a></td>';
				// 		stHtml += '<td align="left">' + txn.amount.value + '</td>';
				// 		stHtml += '<td align="left">' + txn.currency.text + '</td>';

				// 		// record.submitFields({
				// 		//   type: 'customerpayment',
				// 		//   id: customerPayment.internalid.value,
				// 		//   values: { custbody_flat_file: fileId },
				// 		// });
				// 		// }
				// 	}
				// }
				// log.audit('stHtml', stHtml);
				if (creditMemoData.length > 0) {
					for (var i = 0; i < creditMemoData.length; i++) {
						var txn = creditMemoData[i];
						log.audit('txn', JSON.stringify(txn));
						stHtml += '<tr style="background-color: #e3e3e3">';
						stHtml += '<td align="left">' + txn.entity.text + '</td>';
						stHtml += '<td align="left">' + txn.custentity_paymentmethod_customer.text + '</td>';
						stHtml += '<td align="left"><a href="/app/accounting/transactions/transaction.nl?id=' + txn.internalid.value + '" target="_blank">' + txn.tranid.value + '</a></td>';
						// stHtml += '<td align="left"><a href="/app/accounting/transactions/transaction.nl?id=' + txn.internalid.value + '" target="_blank">' + txn.tranid.value + '</a></td>';
						stHtml += '<td align="left">' + txn.amount.value + '</td>';
						stHtml += '<td align="left">' + txn.currency.text + '</td>';
					}
				}

				log.audit('stHtml', stHtml);

				senderId = -5;
				recipientId = user;
				email.send({
					author: senderId,
					recipients: recipientId,
					subject: 'Batch Payment Summary (iCA Receivables Manager)',
					body: stHtml,
				});
			}

			//Send Email Summary.
			log.audit('End Map Reduce', fileId);
		}
	};

	return {
		getInputData: getInputData,
		map: map,
		summarize: summarize,
	};
});
