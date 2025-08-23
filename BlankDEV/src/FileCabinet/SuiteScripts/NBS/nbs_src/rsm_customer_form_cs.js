/**
 * @NApiVersion 2.0
 * @NScriptType ClientScript
 */

define([ "N/https", "N/xml", "N/currentRecord", "N/ui/message", "./util_nbs", 'N/url', 'N/ui/dialog' ], 
		function(https, xml, currentRecord, message, util_nbs, url, dialog) {
	
	var record = currentRecord.get();

	var accountNumber = "";
	var nationalIdentificationNumber = "";
	var taxIdentificationNumber = "";

	function _onClick(id){
		alert("Internal _onClick");
	}
	function getValueFromNodeByTagName(xml, tagName) {
		var elements = xml.getElementsByTagName(tagName)[0];
		var nodes = elements.childNodes[0];
		return nodes.nodeValue;
	}

	function getValuesFromNodeByTagName(xml, tagName) {
		var retArr = [];
		var elements = xml.getElementsByTagName(tagName);
		for (var i = 0; i < elements.length; i++) {
			retArr.push(elements[i].childNodes[0].nodeValue);
		}
		return retArr;
	}

	function handleRequest() {
		accountNumber = record.getValue({
			fieldId : "accountnumber"
		});

		nationalIdentificationNumber = record.getValue({
			fieldId : "custentity_matbrpred"
		});

		taxIdentificationNumber = record.getValue({
			fieldId : "custentity_pib"
		});

		var queryTag = util_nbs.generateQueryTag({
			"accountNumber" : accountNumber,
			"nationalIdentificationNumber" : nationalIdentificationNumber,
			"taxIdentificationNumber" : taxIdentificationNumber
		});

		if (!queryTag) {
			var errorMessage = message.create({
				title : "Error",
				message : "Molim vas unesite jedan od parametara za pretragu (PIB, matični broj, broj računa).",
				type : message.Type.ERROR
			});

			errorMessage.show({
				duration : 5000
			});

			return null;
		}

		var body = util_nbs.generateXmlBody(queryTag);
		
		var headerObj = {
			name : "Content-Type",
			value : "application/soap+xml; charset=utf-8"
		};

		https.post.promise({
			url : "https://webservices.nbs.rs/CommunicationOfficeService1_0/CompanyAccountXmlService.asmx",
			body : body,
			headers : headerObj
		}).then(function(response) {
			var xmlDocument = xml.Parser.fromString({
				text : util_nbs.unescapeXml(response.body)
			});
			
			var dArray = util_nbs.parseXmlForCompanyAccounts(xmlDocument);
			var noviArray = [];

			var tbRows = '<tr class="uir-machine-headerrow">';
			tbRows += '<td class="listheadertdleft listheadertextb uir-column-large">Novi</td>';
			tbRows += '<td class="listheadertdleft listheadertextb uir-column-large">Tekući račun</td>';
			tbRows += '<td class="listheadertdleft listheadertextb uir-column-large">Banka</td>';
			tbRows += '<td class="listheadertdleft listheadertextb uir-column-large">Ime u banci</td>';
			tbRows += '</tr>';
			var lstLines = '';
			
			if (dArray.length > 0) {
				
				for (var ia = 0; ia < dArray.length; ia++) {
					
					var dummy = util_nbs.buildFullBankAccount({
						"BankCode" : dArray[ia].BankCode,
						"AccountNumber" : dArray[ia].AccountNumber,
						"ControlNumber" : dArray[ia].ControlNumber
					});
					

					var l_novi = true;
					
					var l_lc = record.getLineCount({
						sublistId : 'recmachcustrecord_rsm_cust_bank_accounts_cust'
					});
					
					for (var lc = 0; lc < l_lc && l_novi; lc++) {
						var l_value = record.getSublistValue({
							sublistId : 'recmachcustrecord_rsm_cust_bank_accounts_cust',
							line : lc,
							fieldId : 'custrecord_rsm_cust_bank_accounts_tr' 
						})
						if (dummy == l_value) {
							l_novi = false;
						}
					}

					lstLines += '<option value="'+ ia+'">' + dArray[ia].CompanyName + '</option>'; 
					
					tbRows += '<tr class="uir-machine-row uir-machine-row-odd">';
					if (l_novi) {
						tbRows += '<td><input type="checkbox" checked="checked"></td>';
						
						var trNovi = {
								"dummy" : dummy,
								"BankName" : dArray[ia].BankName								
						};
						noviArray.push(trNovi);
					
					} else {
						tbRows += '<td><input type="checkbox" disabled></td>';
					}
					tbRows += '<td class="listtexthl">'+dummy+'</td>';
					tbRows += '<td class="listtexthl">'+dArray[ia].BankName+'</td>';
					tbRows += '<td class="listtexthl">'+dArray[ia].CompanyName+'</td>';
					tbRows += '</tr>';										

				}
			}

			var companyName = getValueFromNodeByTagName(xmlDocument, "CompanyName");
			window.custdlg_listname_val = "-1";
			
			var htmlMsg = '<script>(function($){' +
			'$(function($, undefined){' +
			'$(".x-window").css("width","600px");' +
			'});' +
			'})(jQuery);'+ 
			'</script>';
			htmlMsg += '<div class="uir-record-name">'+ companyName + '</div>'; 
			htmlMsg += '<table class="listtable listborder uir-machine-table">'+tbRows+'</table>';
			
			//napravi listu
			/*
			htmlMsg += '<label for="listNames">Izaberi ime za upis</label>';
			htmlMsg += '<select name="listNames" id="custdlg_listname">';
			htmlMsg += '<option value="-1">Izaberite ime za upis</option>';
			htmlMsg += lstLines + '</select>';
			htmlMsg += '<script>(jQuery("#custdlg_listname")).change(function(){ window.custdlg_listname_val = (jQuery(this)).val();});</script>';
			*/
			//napravi dodatni button
			/*
			htmlMsg += '<div class="uir-uir-message-buttons">';
			htmlMsg += '<button id="custdlg_button_101" onclick="dd()">My button</button>';
			htmlMsg += '</div>';
			htmlMsg += '<script>function dd(){alert("internal function");}</script>';
			*/
			var dlgOptions = {
			           title: 'Basic Input Dialog',
			            message: htmlMsg,
			            buttons: [{label: 'OK', value: 1},{label:"Odustani", value : -1}]	
	        } 
			
			dialog.create(dlgOptions)
	        .then(function(result) {
	            console.log('Input dialog closed with button ' + result);
	            // TODO: Trigger saving the form
     
				if ((result == 1)&&(noviArray.length > 0)) {
					for (var ixx = 0; ixx < noviArray.length; ixx++) {
						record.selectNewLine({
							sublistId : 'recmachcustrecord_rsm_cust_bank_accounts_cust'
						});
						record.setCurrentSublistValue({
							sublistId : 'recmachcustrecord_rsm_cust_bank_accounts_cust',
							fieldId : 'custrecord_rsm_cust_bank_accounts_tr',
							value : noviArray[ixx].dummy,
							ignoreFieldChange : true
						});
						record.setCurrentSublistValue({
							sublistId : 'recmachcustrecord_rsm_cust_bank_accounts_cust',
							fieldId : 'custrecord_rsm_cust_bank_accounts_banka',
							value : noviArray[ixx].BankName,
							ignoreFieldChange : true
						});
						record.commitLine({
							sublistId : 'recmachcustrecord_rsm_cust_bank_accounts_cust'
						});
					}
					var confirmationMessage = message.create({
						title : "Confirmation",
						message : "Podaci o privrednom društvu su uspešno pronađeni i popunjeni.",
						type : message.Type.CONFIRMATION
					});

					confirmationMessage.show({
						duration : 5000
					});
				}

	        }).catch(function(reason) {
	            console.log('Failure: ' + reason);
	        });
			

			if (!accountNumber) {
				accountNumber = getValueFromNodeByTagName(xmlDocument, "Account");
			}

			if (!nationalIdentificationNumber) {
				nationalIdentificationNumber = getValueFromNodeByTagName(xmlDocument, "NationalIdentificationNumber");
			}

			if (!taxIdentificationNumber) {
				taxIdentificationNumber = getValueFromNodeByTagName(xmlDocument, "TaxIdentificationNumber");
			}

			record.setValue({
				fieldId : "accountnumber",
				value : accountNumber
			});
/*
 * record.setValue({ fieldId : "companyname", value : companyName });
 */
			
			record.setValue({
				fieldId : "custentity_matbrpred",
				value : nationalIdentificationNumber
			});

			record.setValue({
				fieldId : "custentity_pib",
				value : taxIdentificationNumber.trim()
			// nbs is adding spaces for some
			// reason
			});


		}).catch(function onRejected(reason) {
			var errorMessage = message.create({
				title : "Error",
				message : "Nije pronađeno ni jedno privredno društvo za zadate parametre. Molim vas proverite parametre i pokušajte ponovo.",
				type : message.Type.ERROR
			});

			errorMessage.show({
				duration : 5000
			});
		});
	}

	function nbsRestlet(){
		
    	var cRec = currentRecord.get();
    	
		var restUrl = url.resolveScript({
			scriptId : 'customscript_rsm_customer_bank_rl',
			deploymentId : 'customdeploy_rsm_customer_bank_rl'
		});

		// Generate request headers
		var headers = new Array();
		headers['Content-type'] = 'application/json';

		// Perform HTTP POST call
		https.post.promise({
			url : restUrl,
			headers : headers,
			body : {
				cId : cRec.id
			}
		}).then(function(reponse){
			
			var myMsg = message.create({
				title : "Result",
				message : "Zavrsena procedura upita u NBS",
				type : message.Type.CONFIRMATION
			});

			myMsg.show({
				duration : 5000
			});

			window.location.reload(true);	
			
		}).catch(function onRejected(reason) {
			
			var errorMessage = message.create({
				title : "Error",
				message : "Greska prilikom preuzimanja podataka sa NBS",
				type : message.Type.ERROR
			});

			errorMessage.show({
				duration : 5000
			});
		})
		
	}
	
	function pageInit(scriptContext) {
		console.log("PageInit-CUSTOMER Form");
	}

	return {
		pageInit : pageInit,
		nbsPretraga : handleRequest,
		nbsRestlet : nbsRestlet,
		dlgClick : _onClick
	};
});
