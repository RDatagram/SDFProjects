/**
 *@NApiVersion 2.x
 *@NScriptType ScheduledScript
 */
define(['N/search', 'N/record', 'N/file', 'N/compress', 'N/runtime', 'N/email', './ica_cz_lodash.js', './ica_cz_hb.js', './ica_cz_moment.js'], function (search, record, file, compress, runtime, email, _, Handlebars, moment) {
	var params = {
		type: runtime.getCurrentScript().getParameter('custscript_ica_cz_type'),
		billerId: runtime.getCurrentScript().getParameter('custscript_ica_cz_billerid'),
		billPaymentIds: runtime.getCurrentScript().getParameter('custscript_ica_cz_billpymtid'),
		internalids: runtime.getCurrentScript().getParameter('custscript_ica_cz_internalids_to_check'),
		zipfilename: runtime.getCurrentScript().getParameter('custscript_ica_cz_zip_file_name'),
		folderid: runtime.getCurrentScript().getParameter('custscript_ica_cz_folder_id'),
		econnfolderid: runtime.getCurrentScript().getParameter('custscript_ica_cz_econn_folder'),
		defaultXMLTemplateId: function () {
			var fileSearchObj = search.create({
				type: 'file',
				filters: [['name', 'contains', 'ica_wf_xml_tmpl.xml']],
				columns: [],
			});
			var fileId = '';
			fileSearchObj.run().each(function (result) {
				fileId = result.id;
				return true;
			});
			return fileId;
		},
	};

	function pad(n, width, z) {
		try {
			z = z || '0';
			n = n + '';
			return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
		} catch (e) {
			log.error('Error padding, returning n', n);
			return n;
		}
	}

	function execute(context) {
		log.audit('params', JSON.stringify(params));
		if (params.type == 'REFUND') {
			createZipForRefunds(context);
		} else {
			createZipForPayments(context);
		}
	}

	function createZipForPayments(context) {
		try {
			var billPayments = JSON.parse(params.billPaymentIds);

			billPayments = _.uniq(billPayments);

			log.audit('billPayments', JSON.stringify(billPayments));

			var billIds = [];

			var internalids = params.internalids.split(',');
			var cleaned = [];
			for (var i = 0; i < internalids.length; i++) {
				cleaned.push(internalids[i].trim());
			}
			internalids = cleaned;
			log.audit('internalids', internalids);

			var chkCount = 0;
			for (var b = 0; b < billPayments.length; b++) {
				//Get Bills from Bill Payment
				var billPaymentRec = record.load({
					type: 'vendorpayment',
					id: billPayments[b],
				});

				for (var i = 0; i < billPaymentRec.getLineCount({ sublistId: 'apply' }); i++) {
					var paymentCheckNum = billPaymentRec.getValue({ fieldId: 'tranid' });
					var entity = billPaymentRec.getValue({ fieldId: 'entity' });
					try {
						var pm = search.lookupFields({
							type: 'vendor',
							id: entity,
							columns: 'custentity_paymentmethod',
						}).custentity_paymentmethod[0].text;

						if (pm == 'CHK') {
							if (billPaymentRec.getSublistValue({ sublistId: 'apply', fieldId: 'apply', line: i })) {
								billIds.push({
									filename: paymentCheckNum + '-xxx.pdf', //to be used for filename
									internalid: billPaymentRec.getSublistValue({ sublistId: 'apply', fieldId: 'doc', line: i }),
								});
							}
							chkCount++;
						}
					} catch (e) {
						log.error('Error encountered: No Payment Method set on Vendor', e.message);
					}
				}
				// log.audit("billIds", JSON.stringify(billIds));
			}

			if (chkCount == 0) {
				log.audit('There are no CHK payment methods, exiting...', chkCount);
				return;
			}

			log.audit('billIds', JSON.stringify(billIds));

			//Get Files from Bill
			var filesData = [];

			var arrDeliveryItems = [];
			var index = 1;
			for (var i = 0; i < billIds.length; i++) {
				var rec = record.load({
					type: 'vendorbill',
					id: billIds[i].internalid,
					isDynamic: true,
				});

				var vendorRec = record.load({
					type: 'vendor',
					id: rec.getValue({ fieldId: 'entity' }),
					isDynamic: true,
				});

				for (var j = 0; j < internalids.length; j++) {
					var fileId = rec.getValue({
						fieldId: internalids[j],
					});
					log.audit('fileId:' + fileId, 'internalids[j]:' + internalids[j]);

					if (fileId == undefined || fileId == '') {
					} else {
						var f = file.load({ id: fileId });

						arrDeliveryItems.push({
							PartnerInfo: {
								Name: vendorRec.getValue({ fieldId: 'custentity_vendorname' }),
								PartnerID: vendorRec.getValue({ fieldId: 'entityid' }),
								Address: {
									Address1: vendorRec.getValue({ fieldId: 'custentity_vendoraddline1' }),
									City: vendorRec.getValue({ fieldId: 'custentity_vendorcity' }),
									StateOrProvince: vendorRec.getValue({ fieldId: 'custentity_vendorstateprovince' }),
									ZipCode: vendorRec.getValue({ fieldId: 'custentity_vendorpostalcode' }),
								},
								DocInfo: {
									DocDeliveryCode: 'X', //hardcoded
								},
							},
							FileInfo: {
								FileName: billIds[i].filename.replace('xxx', pad(index, 3, 0)), // f.name,
								FileType: 'PDF',
								DocumentName: 'CHECK',
								DocumentDate: moment().format('YYYY-MM-DD'),
							},
							RecipientName: vendorRec.getValue({ fieldId: 'custentity_vendorname' }),
							Delivery: {
								PrintAndMailDelivery: {
									Address: {
										Address1: vendorRec.getValue({ fieldId: 'custentity_vendoraddline1' }),
										City: vendorRec.getValue({ fieldId: 'custentity_vendorcity' }),
										StateOrProvince: vendorRec.getValue({
											fieldId: 'custentity_vendorstateprovince',
										}),
										ZipCode: vendorRec.getValue({ fieldId: 'custentity_vendorpostalcode' }),
									},
								},
							},
						});
						filesData.push({
							archiveFilename: billIds[i].filename.replace('xxx', pad(index, 3, 0)),
							actualFile: f,
							realFilename: f.name,
						});
						index++;
					}
				}
			}

			log.audit('filesData', JSON.stringify(billIds));
			log.audit('arrDeliveryItems.length', arrDeliveryItems.length);
			//Generate XML (wait for Al's template)

			var objects = {};
			objects.BillerID = params.billerId;
			objects.DeliveryItems = arrDeliveryItems;

			if (arrDeliveryItems.length == 0) {
				log.audit('There are no files associated to the Payments (CHK), exiting...', arrDeliveryItems.length);
				return;
			} else {
				log.audit('objects', JSON.stringify(objects));

				var fileObj = file.load({
					id: params.defaultXMLTemplateId(),
				});
				var template = Handlebars.compile(fileObj.getContents());
				var xmlContents = template(objects);

				var xmlFile = file.create({
					name: 'eddDeliveryRequest.xml',
					fileType: file.Type.XMLDOC,
					contents: xmlContents,
					folder: params.folderid,
				});

				log.audit('Pushing XML to filesData', xmlContents);
				var fileid = xmlFile.save();

				filesData.push({
					archiveFilename: 'eddDeliveryRequest.xml',
					actualFile: file.load({ id: fileid }),
					realFilename: 'eddDeliveryRequest.xml',
				});

				//Create Zip File in ica Archive
				var archiver = compress.createArchiver();
				for (var i = 0; i < filesData.length; i++) {
					var f = filesData[i].actualFile;
					f.name = filesData[i].archiveFilename;
					var fid = f.save();
					archiver.add({
						file: f,
					});

					//Update back to old name
					f = file.load({ id: fid });
					f.name = filesData[i].realFilename;
					f.save();
				}

				var d = moment().format('hhmmssYYYYMMDD'); // Ask to Al, what is nnn?
				var zipFile = archiver.archive({
					name: params.zipfilename + '.' + d + '.zip',
				});

				//Save Zip File to designated Folder
				zipFile.folder = params.folderid;
				zipFile.save();

				log.audit('Zip created');

				//Create Zip File in ica econn folder
				var archiver = compress.createArchiver();
				for (var i = 0; i < filesData.length; i++) {
					var f = filesData[i].actualFile;
					f.name = filesData[i].archiveFilename;
					var fid = f.save();
					archiver.add({
						file: f,
					});

					//Update back to old name
					f = file.load({ id: fid });
					f.name = filesData[i].realFilename;
					f.save();
				}

				var d = moment().format('hhmmssYYYYMMDD'); // Ask to Al, what is nnn?
				var zipFile = archiver.archive({
					name: params.zipfilename + '.' + d + '.zip',
				});

				//Save Zip File to designated Folder
				zipFile.folder = params.econnfolderid;
				zipFile.save();

				log.audit('Zip created');

				//Send Email

				//Parameter who to send
			}
		} catch (e) {
			log.error({ title: 'error', details: e.message });

			var subject = 'Fatal Error: Did not generate file';
			var authorId = -5;
			var recipientEmail = 'franco.randolf@gmail.com';

			email.send({
				author: authorId,
				recipients: recipientEmail,
				subject: subject,
				body: 'Fatal error occurred in script: ' + runtime.getCurrentScript().id + '\n\n' + JSON.stringify(e),
			});
		}
	}

	function createZipForRefunds(context) {
		try {
			var customerRefunds = JSON.parse(params.billPaymentIds);

			customerRefunds = _.uniq(customerRefunds);

			log.audit('customerRefunds', JSON.stringify(customerRefunds));

			var appliedIds = [];

			var internalids = params.internalids.split(',');
			var cleaned = [];
			for (var i = 0; i < internalids.length; i++) {
				cleaned.push(internalids[i].trim());
			}
			internalids = cleaned;
			log.audit('internalids', internalids);

			var chkCount = 0;
			for (var b = 0; b < customerRefunds.length; b++) {
				//Get Bills from Bill Payment
				var customerRefundRec = record.load({
					type: 'customerrefund',
					id: customerRefunds[b],
				});

        var customer = customerRefundRec.getValue({ fieldId: 'customer' });
        var paymentCheckNum = customerRefundRec.getValue({ fieldId: 'tranid' });

        try {
          var pm = search.lookupFields({
            type: 'customer',
            id: customer,
            columns: 'custentity_paymentmethod',
          }).custentity_paymentmethod[0].text;

          if (pm == 'CHK') {
            appliedIds.push({
              filename: paymentCheckNum + '-xxx.pdf', //to be used for filename
              internalid: customerRefunds[b],
              customer: customer,
              type: 'customerrefund'
            });
    
            chkCount++;
          }
        } catch (e) {
          log.error('Error encountered: No Payment Method set on Vendor', e.message);
        }        


				// for (var i = 0; i < customerRefundRec.getLineCount({ sublistId: 'apply' }); i++) {
				// 	var paymentCheckNum = customerRefundRec.getValue({ fieldId: 'tranid' });
				// 	var customer = customerRefundRec.getValue({ fieldId: 'customer' });
				// 	log.audit(
				// 		'values',
				// 		JSON.stringify({
				// 			paymentCheckNum: paymentCheckNum,
				// 			customer: customer,
				// 		})
				// 	);
				// 	try {
				// 		var pm = search.lookupFields({
				// 			type: 'customer',
				// 			id: customer,
				// 			columns: 'custentity_paymentmethod',
				// 		}).custentity_paymentmethod[0].text;

				// 		if (pm == 'CHK') {
				// 			if (customerRefundRec.getSublistValue({ sublistId: 'apply', fieldId: 'apply', line: i })) {
				// 				var type = customerRefundRec.getSublistValue({ sublistId: 'apply', fieldId: 'type', line: i });
				// 				if (type == 'Credit Memo') type = 'creditmemo';

				// 				appliedIds.push({
				// 					filename: paymentCheckNum + '-xxx.pdf', //to be used for filename
				// 					internalid: customerRefundRec.getSublistValue({ sublistId: 'apply', fieldId: 'doc', line: i }),
				// 					customer: customerRefundRec.getValue({ fieldId: 'customer' }),
				// 					type: type,
				// 				});
				// 			}
				// 			chkCount++;
				// 		}
				// 	} catch (e) {
				// 		log.error('Error encountered: No Payment Method set on Vendor', e.message);
				// 	}
				// }
			}

			if (chkCount == 0) {
				log.audit('There are no CHK payment methods, exiting...', chkCount);
				return;
			}

			log.audit('appliedIds', JSON.stringify(appliedIds));

			//Get Files from Transactions
			var filesData = [];

			var arrDeliveryItems = [];
			var index = 1;
			for (var i = 0; i < appliedIds.length; i++) {
				var rec = record.load({
					type: appliedIds[i].type,
					id: appliedIds[i].internalid,
					isDynamic: true,
				});
				var vendorRec = record.load({
					type: record.Type.CUSTOMER,
					id: appliedIds[i].customer,
					isDynamic: true,
				});
				log.audit('here', 'internalids[j]:' + appliedIds[i].customer);
				for (var j = 0; j < internalids.length; j++) {
					var fileId = rec.getValue({
						fieldId: internalids[j],
					});
					log.audit('fileId:' + fileId, 'internalids[j]:' + internalids[j]);

					if (fileId == undefined || fileId == '') {
					} else {
						var f = file.load({ id: fileId });

						arrDeliveryItems.push({
							PartnerInfo: {
								Name: vendorRec.getValue({ fieldId: 'custentity_vendorname' }),
								PartnerID: vendorRec.getValue({ fieldId: 'entityid' }),
								Address: {
									Address1: vendorRec.getValue({ fieldId: 'custentity_vendoraddline1' }),
									City: vendorRec.getValue({ fieldId: 'custentity_vendorcity' }),
									StateOrProvince: vendorRec.getValue({ fieldId: 'custentity_vendorstateprovince' }),
									ZipCode: vendorRec.getValue({ fieldId: 'custentity_vendorpostalcode' }),
								},
								DocInfo: {
									DocDeliveryCode: 'X', //hardcoded
								},
							},
							FileInfo: {
								FileName: appliedIds[i].filename.replace('xxx', pad(index, 3, 0)), // f.name,
								FileType: 'PDF',
								DocumentName: 'CHECK',
								DocumentDate: moment().format('YYYY-MM-DD'),
							},
							RecipientName: vendorRec.getValue({ fieldId: 'custentity_vendorname' }),
							Delivery: {
								PrintAndMailDelivery: {
									Address: {
										Address1: vendorRec.getValue({ fieldId: 'custentity_vendoraddline1' }),
										City: vendorRec.getValue({ fieldId: 'custentity_vendorcity' }),
										StateOrProvince: vendorRec.getValue({
											fieldId: 'custentity_vendorstateprovince',
										}),
										ZipCode: vendorRec.getValue({ fieldId: 'custentity_vendorpostalcode' }),
									},
								},
							},
						});
						filesData.push({
							archiveFilename: appliedIds[i].filename.replace('xxx', pad(index, 3, 0)),
							actualFile: f,
							realFilename: f.name,
						});
						index++;
					}
				}
			}

			log.audit('filesData', JSON.stringify(appliedIds));
			log.audit('arrDeliveryItems.length', arrDeliveryItems.length);
			//Generate XML (wait for Al's template)

			var objects = {};
			objects.BillerID = params.billerId;
			objects.DeliveryItems = arrDeliveryItems;

			if (arrDeliveryItems.length == 0) {
				log.audit('There are no files associated to the Payments (CHK), exiting...', arrDeliveryItems.length);
				return;
			} else {
				log.audit('objects', JSON.stringify(objects));

				var fileObj = file.load({
					id: params.defaultXMLTemplateId(),
				});
				var template = Handlebars.compile(fileObj.getContents());
				var xmlContents = template(objects);

				var xmlFile = file.create({
					name: 'eddDeliveryRequest.xml',
					fileType: file.Type.XMLDOC,
					contents: xmlContents,
					folder: params.folderid,
				});

				log.audit('Pushing XML to filesData', xmlContents);
				var fileid = xmlFile.save();

				filesData.push({
					archiveFilename: 'eddDeliveryRequest.xml',
					actualFile: file.load({ id: fileid }),
					realFilename: 'eddDeliveryRequest.xml',
				});

				//Create Zip File in ica Archive
				var archiver = compress.createArchiver();
				for (var i = 0; i < filesData.length; i++) {
					var f = filesData[i].actualFile;
					f.name = filesData[i].archiveFilename;
					var fid = f.save();
					archiver.add({
						file: f,
					});

					//Update back to old name
					f = file.load({ id: fid });
					f.name = filesData[i].realFilename;
					f.save();
				}

				var d = moment().format('hhmmssYYYYMMDD'); // Ask to Al, what is nnn?
				var zipFile = archiver.archive({
					name: params.zipfilename + '.' + d + '.zip',
				});

				//Save Zip File to designated Folder
				zipFile.folder = params.folderid;
				zipFile.save();

				log.audit('Zip created');

				//Create Zip File in ica econn folder
				var archiver = compress.createArchiver();
				for (var i = 0; i < filesData.length; i++) {
					var f = filesData[i].actualFile;
					f.name = filesData[i].archiveFilename;
					var fid = f.save();
					archiver.add({
						file: f,
					});

					//Update back to old name
					f = file.load({ id: fid });
					f.name = filesData[i].realFilename;
					f.save();
				}

				var d = moment().format('hhmmssYYYYMMDD'); // Ask to Al, what is nnn?
				var zipFile = archiver.archive({
					name: params.zipfilename + '.' + d + '.zip',
				});

				//Save Zip File to designated Folder
				zipFile.folder = params.econnfolderid;
				zipFile.save();

				log.audit('Zip created');

				//Send Email

				//Parameter who to send
			}
		} catch (e) {
			log.error({ title: 'error', details: e.message });

			var subject = 'Fatal Error: Did not generate file';
			var authorId = -5;
			var recipientEmail = 'franco.randolf@gmail.com';

			email.send({
				author: authorId,
				recipients: recipientEmail,
				subject: subject,
				body: 'Fatal error occurred in script: ' + runtime.getCurrentScript().id + '\n\n' + JSON.stringify(e),
			});
		}
	}

	return {
		execute: execute,
	};
});
