function processAndSendFlatFile(objAcctMap) {
	try {
		var timeStamp = Date.create().format('{HH}{mm}{ss}{yyyy}{MM}{dd}');
		var fileName = FILE_NAME_PREFIX + '.' + timeStamp + '.txt';
		var fileContent = createBBVAPayments(objAcctMap);

        dLog('fileContent', fileContent);
		if (!fileContent)
			return null;


		var file = nlapiCreateFile(fileName, 'PLAINTEXT', fileContent);
		if (BILL_FOLDER)
            file.setFolder(BILL_FOLDER);
		var fileId = nlapiSubmitFile(file);

		dLog('processAndSendXMLFile', 'file 1 Id = ' + fileId);

		if (!isEmpty(VPM_CONNECTOR_FOLDER)) {

			var file2 = nlapiCreateFile(fileName, 'PLAINTEXT', fileContent);
			file2.setFolder(VPM_CONNECTOR_FOLDER);
			var file2Id = nlapiSubmitFile(file2);

			dLog('processAndSendXMLFile', 'file 2 Id = ' + file2Id);
		}

		// If this checkbox is checked, then send the file to the person that
		// created the payment
		if (SEND_FILE_VIA_EMAIL == 'T') {

			if (!isEmpty(SEND_FILE_EMAIL)) {

				EMAIL_SENDER_EMAIL += ',' + SEND_FILE_EMAIL;
			}

			nlapiSendEmail(EMAIL_SENDER, EMAIL_SENDER_EMAIL, EMAIL_SUBJECT_XML, EMAIL_BODY, null, null, null, file, true);
		}

		return fileId;
	} catch (e) {
		dLog('processAndSendFlatFile | Script Error', e);
	}
}


function createBBVAPayments(objAcctMapping) {
    
    var df = nlapiGetContext().getPreference('DATEFORMAT'); 
    if (df=='DD-MONTH-YYYY') df = 'DD-MMM-YYYY';
    if (df=='D-MONTH-YYYY') df = 'D-MMM-YYYY';

    if (objAcctMapping[0].getValue('custrecord_acct_map_next_day')=='T') {
        dAudit('Next Day Payment should not reflect in creating output file, removing a day to BPM_DATE:before', BPM_DATE);			
        var BPM_DATE_CONVERTED = nlapiStringToDate(BPM_DATE);
        BPM_DATE = nlapiDateToString(moment(BPM_DATE_CONVERTED).subtract(1, "days").toDate(), 'date');
        dAudit('Next Day Payment, adding a day to BPM_DATE', BPM_DATE);			
    };


    var BPM_DATE_CONVERTED = nlapiStringToDate(BPM_DATE);

    var totals = {
        noofregisters: 0,
        registeramount: 0,
        noofdismisses: 0,
        dismissamount: 0
    };
    var usdtotals = {
        noofregisters: 0,
        registeramount: 0,
        noofdismisses: 0,
        dismissamount: 0
    };
    var eurtotals = {
        noofregisters: 0,
        registeramount: 0,
        noofdismisses: 0,
        dismissamount: 0
    };
    
    dLog('createBBVAPayments.objAcctMapping', JSON.stringify(objAcctMapping));
    dLog('createBBVAPayments.custrecord_acct_map_ceo_company_id', objAcctMapping[0].getValue('custrecord_acct_map_ceo_company_id'));
    dLog('arrBillsProcessed', JSON.stringify(arrBillsProcessed));
    for (x in arrBillsProcessed) {
        dLog('arrBillsProcessed[' + x + ']', JSON.stringify(arrBillsProcessed[x]));
    }

    var today = moment().format('YYYY-MM-DD'); 
    var fileKey = moment().format('DDMMYYYYhhmmss'); //TODO: Add filename 

    var file = '';

    var line = '';
    //Header
    line += 'H';
    line += _.padStart(objAcctMapping[0].getValue('custrecord_acct_map_ceo_company_id') || '', 9, '0'); //custrecord_acct_map_ceo_company_id -- account mapping
    line += _.padEnd(today, 10, ' ');
    line += _.padEnd('01', 2, ' ');        
    line += _.padEnd(fileKey, 30, ' ');
    line += '00'; //Response Code
    line += _.padEnd('', 20, ' '); //20 Spaces
    line += _.padEnd('', 3, ' '); //3 spaces
    // line += _.padEnd('', 35, ''); //35 Spaces //H2H custrecord_acct_map_ext_bank_origin_acc
    line += _.padStart(objAcctMapping[0].getValue('custrecord_acct_map_ext_bank_origin_acc'), 35, '0'); //35 Spaces //H2H custrecord_acct_map_ext_bank_origin_acc
    line += _.padEnd('', 3, ' '); //3 spaces //Contract currency
    line += _.padEnd('', 1251, ' '); //1251 spaces //For future use
    line += '\n';


    //Detail
    //Add loop, based on objAcctMapping

    //Group
    var grouped = _.groupBy(arrBillsProcessed, 'payment');
    dLog('grouped', JSON.stringify(grouped));

    for (x in grouped) {
        var data = {
            billIds: '',
            entity: '',
            custbody_ica_bbva_concept_of_payment: '',
            custbody_ica_bbva_additional_data: '',
            custbody_ica_bbva_cie_reference_num: '',
            totalbillamount: 0,
            transactionnumbers: ''
        };
        // var billIds = '';
        for (var i=0; i<grouped[x].length; i++) {

            var billRec = nlapiLookupField('vendorbill', grouped[x][i].id, 
            [
            'entity',
            'custbody_ica_bbva_concept_of_payment',
            'custbody_ica_bbva_additional_data',
            'custbody_ica_bbva_cie_reference_num',
            'transactionnumber'
            ]);
    
            data.transactionnumbers += billRec.transactionnumber + ' ';
            data.billIds += grouped[x][i].id + ' ';
            data.entity += billRec.entity + ' ';
            data.custbody_ica_bbva_concept_of_payment += billRec.custbody_ica_bbva_concept_of_payment + ' ';
            data.custbody_ica_bbva_additional_data += billRec.custbody_ica_bbva_additional_data + ' ';
            data.custbody_ica_bbva_cie_reference_num += billRec.custbody_ica_bbva_cie_reference_num + ' ';
            data.totalbillamount += Number(grouped[x][i].payamt);            
        }

        data.totalbillamount = parseFloat(Math.round(data.totalbillamount * 100) / 100).toFixed(2);

        dLog('data', JSON.stringify(data));

        

        var billRec = nlapiLookupField('vendorbill', grouped[x][0].id, 
        [
        'entity',
        'custbody_ica_bbva_concept_of_payment',
        'custbody_ica_bbva_additional_data',
        'custbody_ica_bbva_cie_reference_num',
        'tranid'
        ]);

        var vendorRec = nlapiLookupField('vendor', billRec.entity, 
        [
        'custentity_ica_bbva_bancomer_acct_cur',        
        'custentity_ica_bbva_bancomer_acct_type', 
        'custentity_ica_bbva_other_banks_acct_num', 
        'custentity_ica_bbva_banc_acct_number',
        'custentity_vendorname',
        'custentity_ica_bbva_select_bank',
        'custentity_ica_bbva_pay_conf_email',
        'entityid'
        ]
        );

        dLog('newdata', JSON.stringify({
            'billRec': billRec,
            'vendorRec': vendorRec
        }));

        var selectBank = vendorRec.custentity_ica_bbva_select_bank;
        var accountType = vendorRec.custentity_ica_bbva_bancomer_acct_type;

        var billPaymentId = grouped[x][0].billnum || '';
        var reference = data.custbody_ica_bbva_cie_reference_num; //billRec.custbody_ica_bbva_cie_reference_num; //arrBillsProcessed[x].reference || ''; // custbody_ica_bbva_cie_reference_num TODO: add on scheduled script loop

        //Item 1 -
        if (accountType=='2' || accountType=='3') {
            // reference = grouped[x][0].refnum; //Change to FOLIO FISCAL (bill.tranid)

            //Commented out on Oct 5
            // reference = billRec.tranid; //grouped[x][0].refnum; //Change to FOLIO FISCAL (bill.tranid)
            // reference = reference.substr(reference.length - 20); //get last 20 characters
        };
        
        
        // var thirdPartyCode = grouped[x][0].id || ''; //internalid
        var thirdPartyCode = vendorRec.entityid; //grouped[x][0].id || ''; //internalid
        dAudit('thirdPartyCode', thirdPartyCode);
        // thirdPartyCode = thirdPartyCode.substr(thirdPartyCode.length - 30); //get last 30 characters
        thirdPartyCode = thirdPartyCode.substr(0,30); //get last 30 characters
        dAudit('thirdPartyCode', thirdPartyCode);

        //Clean
        reference = reference.replace(/[^a-zA-Z 0-9]/g, "");
        reference = reference.replace(/\s/g, ''); //remove space -- do we have to do this?
        billPaymentId = billPaymentId.replace(/[^a-zA-Z 0-9]/g, "");
    
        line += 'D';
        line += 'A';
        line += 'P';
        line += _.padEnd(reference, 20, ' '); //replaced Bill Payment ID to reference.
        line += _.padEnd(thirdPartyCode, 30, ' '); //third Party Code -- where to retrieve? 
        line += _.padEnd('PDA', 3, ' ');
    

        
        var operationCode = 6; //default Other //varies from 1-6, not 5. //based on Vendor.
        var referenceNote = data.custbody_ica_bbva_concept_of_payment; //Get From bill
        referenceNote = referenceNote.replace(/[^a-zA-Z 0-9]/g, "");
        var convenioNumber = referenceNote; //

        //CIE - 1
        //CLABE - 2
        //B10 - 3

        if (accountType=='3') { //Bancomer 10 Position account
            operationCode = 2;
            convenioNumber = referenceNote;
        }
        else if (accountType=='1') { //CIE Service Number
            operationCode = 3;
            convenioNumber = "|" + referenceNote;
        }


        // if ((accountType=='1') || (accountType=='3')) { //Bancomer CLABE Account //Bancomer 10 Position account
        //     operationCode = 2;
        //     convenioNumber = referenceNote;
        // }
        // else if (accountType=='2') { //CIE Service Number
        //     operationCode = 3;
        //     convenioNumber = "|" + referenceNote;
        // }
        
    
        line += _.padEnd(operationCode, 1, ' ');
        line += _.padEnd('', 20, '0'); //Charge Account
        line += _.padEnd('', 15, ' '); //Filler
    
        // line += _.padEnd(billPaymentId, 25, ' '); //Numeric reference 
        // line += _.padEnd(billPaymentId, 25, ' '); // Replace and put in the payment date for all payment methods.
        dLog('BPM_DATE', BPM_DATE);
        var dateOfPayment = moment(BPM_DATE_CONVERTED).format('0DDMMYY'); //TODO: add dateofpayment from object; //removed .add(1, "days")
        line += _.padEnd(dateOfPayment, 25, ' '); //Ask Al about this
        // line += _.padEnd(dateOfPayment, 15, ' ');
    
        // var billIds = '';
        var txnnumbers = data.transactionnumbers;
        if(txnnumbers.length > 37) 
            txnnumbers = txnnumbers.substring(0,37);
        line += _.padEnd(txnnumbers, 37, ' '); //Concatenate the bills for this payment. TODO: see top
        line += _.padEnd('', 15, ' ');

        // var personalizedCredit = vendorRec.custentity_companyname;
        line += _.padEnd(txnnumbers, 25, ' '); //Personalized Credit  -- used to be personalizedCredit. Changed Oct 5.
    
        line += _.padEnd(convenioNumber, 37, ' '); //CIE Service Number
    
        line += 'N';
        line += _.padEnd('', 8, ' '); //8 Spaces
    
        var paymentAccountType = '';
        // Bancomer net cash (BNC): Fill with 2 spaces.
    
        // Host to Host (H2H), Without third party validation capture the following:
        // 00 = Branch payment
        // 40 = Clabe account (Bancomer and other Banks)
        // 50 = CIE service number
        // 96 = International account (except USA). For Internacional Payments it is mandatory when there is no third party validation.
        // 97 = USA International Account. For International Payments it is mandatory when there is no third party validation. 
        // 99 = BBVA Bancomer account, 10 positions. 

        if (accountType=='1') { //CIE
            paymentAccountType = '50';
        } else if (accountType=='2') { //CLABE/OtherBank
            paymentAccountType = '40';
        } else if (accountType=='3') { //B10
            paymentAccountType = '99';
        } else if (accountType=='4') { //default to 00 for branch payment. Not in list.
            paymentAccountType = '00';
        };    

    
        line += _.padEnd(paymentAccountType, 2, ' ');
    
        var otherBanksAccountNumber = vendorRec.custentity_ica_bbva_other_banks_acct_num; //18
    
        // Host to Host (H2H) without third party validation is mandatory and it has to be aligned to the right, complete with zeros to the left e.g.
        
        // Bancomer (Bancomer 10 positions)
        // 00000000000000000000000001023456123
        
        // Bancomer (CLABE format):
        // 00000000000000000123456789012345678
        
        // CIE service number (02 + Convenio): 00000000000000000000000000200678765
        
        // Other banks
        // 00000000000000000123456789012345678
        
        // International, is mandatory for payments WITHOUT third party validation:
        // 123456790 (spaces)
    
        line += _.padEnd('', 35, ' '); //removed otherBanksAccountNumber Sep30
    
        //278-317
        line += _.padEnd('', 40, ' '); //19
    
        line += _.padEnd('', 1, ' ');
    
        line += _.padEnd('', 30, ' '); //ID Number of First Beneficiary
    
        line += _.padEnd('', 40, ' '); //Always 40 spaces
    
        line += _.padEnd('', 1, ' '); //ID Code (Always space)
    
        line += _.padEnd('', 30, ' '); //ID Number of Second Beneficiary
    

        var currency = 'MXP'; //Get from bill. TODO;

        line += _.padEnd(currency, 3, ' '); //currency
    
        line += _.padEnd('', 11, ' '); //BIC
    
        line += _.padEnd('', 9, ' '); //ABA
    
        line += _.padEnd('FA', 2, ' '); //FA
    
        var totalBillAmount = String(data.totalbillamount).replace(/\D/g,'') || ""; //String(grouped[x][0].payamt).replace(/\D/g,'') || "";
        dAudit('totalBillAmount', totalBillAmount);
    
        line += _.padStart(totalBillAmount, 15, '0'); //totalBillAmount without period
    
        line += _.padEnd('', 15, '0'); //BIC

        line += _.padEnd('01', 2, ' '); //Email confirmation (previously SMS)
        
        var emailConf = vendorRec.custentity_ica_bbva_pay_conf_email;
        if (emailConf) {
            line += _.padEnd(emailConf, 50, ' '); //50 Spaces    
        } else {
            line += _.padEnd('', 50, ' '); //50 Spaces
        }        
    
        line += _.padEnd('N', 1, '');
    
        line += _.padEnd('', 8, '0');
    
        line += _.padEnd('', 4, '0');

        var billPaymentDate = moment(BPM_DATE_CONVERTED).add(1, "days").format('YYYY-MM-DD');  //''; //get from bill.
        line += _.padEnd(billPaymentDate, 10, ''); //switched from Today
    
        var apDate = '0001-01-01';
    
        line += _.padEnd(apDate, 10, '');
        line += _.padEnd(apDate, 10, '');
        line += _.padEnd(apDate, 10, '');
    
        
        
        line += _.padEnd(today, 10, ''); //switched from BillPaymentDate
    
        line += _.padEnd('N', 1, '');
    
        line += _.padEnd(' ', 1, '');
        line += _.padEnd(apDate, 10, '');
        line += _.padEnd('700', 3, ''); //Constant 700
    
        var notes = String(data.custbody_ica_bbva_additional_data).replace(/[^a-zA-Z0-9 ]/g,'') || ""; //billRec
        dAudit('notes', notes);
        line += _.padEnd('', 700, ' '); //leave blank in the meantime, use to be 'notes'
    
        line += _.padEnd('', 10, ' '); //credits
    
        line += _.padEnd('', 10, ' '); //debits
    
        line += _.padEnd('', 2, ' '); //Reply code
    
        line += _.padEnd('', 30, ' '); //Description reply code
        
        line += _.padEnd(apDate, 10, ' ');
        line += '\n';

        totals.noofregisters = Number(totals.noofregisters) + 1;
        totals.registeramount = Number(totals.registeramount) + Number(data.totalbillamount);
        dAudit('totals.registeramount', totals.registeramount);

    }

    // for (x in arrBillsProcessed) {
    //     dLog('arrBillsProcessed[' + x + ']', JSON.stringify(arrBillsProcessed[x]));

    //     var billRec = nlapiLookupField('vendorbill', arrBillsProcessed[x].id, 
    //     [
    //     'entity',
    //     'custbody_ica_bbva_concept_of_payment',
    //     'custbody_ica_bbva_additional_data',
    //     'custbody_ica_bbva_cie_reference_num'
    //     ]);

    //     var vendorRec = nlapiLookupField('vendor', billRec.entity, 
    //     [
    //     'custentity_ica_bbva_bancomer_acct_cur',        
    //     'custentity_ica_bbva_bancomer_acct_type', 
    //     'custentity_ica_bbva_other_banks_acct_num', 
    //     'custentity_ica_bbva_banc_acct_number',
    //     'custentity_vendorname'
    //     ]
    //     );

    //     dLog('newdata', JSON.stringify({
    //         'billRec': billRec,
    //         'vendorRec': vendorRec
    //     }));






    //     var billPaymentId = arrBillsProcessed[x].billnum || '';
    //     var reference = billRec.custbody_ica_bbva_cie_reference_num; //arrBillsProcessed[x].reference || ''; // custbody_ica_bbva_cie_reference_num TODO: add on scheduled script loop
    //     var thirdPartyCode = arrBillsProcessed[x].id || ''; //internalid
    
    //     line += 'D';
    //     line += 'A';
    //     line += 'P';
    //     line += _.padEnd(reference, 20, ' '); //replaced Bill Payment ID to reference.
    //     line += _.padEnd(thirdPartyCode, 30, ' '); //third Party Code -- where to retrieve? 
    //     line += _.padEnd('PDA', 3, ' ');
    

    //     var accountType = vendorRec.custentity_ica_bbva_bancomer_acct_type;
    //     var operationCode = 6; //default Other //varies from 1-6, not 5. //based on Vendor.
    //     if ((accountType=='1') || (accountType=='3')) { //Bancomer CLABE Account //Bancomer 10 Position account
    //         operationCode = 2;
    //     }
    //     else if (accountType=='2') { //CIE Service Number
    //         operationCode = 3;
    //     }
        
    
    //     line += _.padEnd(operationCode, 1, ' ');
    //     line += _.padEnd('', 20, '0'); //Charge Account
    //     line += _.padEnd('', 15, ' '); //Filler
    
    //     line += _.padEnd(billPaymentId, 25, ' '); //Numeric reference
    //     // var dateOfPayment = moment().format('YYYY-MM-DD'); //TODO: add dateofpayment from object;
    //     // line += _.padEnd(dateOfPayment, 25, ' '); //Ask Al about this
    //     // line += _.padEnd(dateOfPayment, 15, ' ');
    
    //     var billIds = '';

    //     for (var z=0; z<grouped[arrBillsProcessed[x].payment].length; z++) {
    //         billIds += grouped[arrBillsProcessed[x].payment][z].id + ' ';

    //     }
    //     dLog('billIds', billIds);
    //     line += _.padEnd(billIds, 37, ' '); //Concatenate the bills for this payment. TODO: see top
    //     line += _.padEnd('', 15, ' ');

    //     var personalizedCredit = vendorRec.custentity_companyname;
    //     line += _.padEnd(personalizedCredit, 25, ' '); //Personalized Credit
    
    //     var referenceNote = billRec.custbody_ica_bbva_concept_of_payment; //Get From bill
    //     var convenioNumber = "|" + referenceNote; //
    //     line += _.padEnd(convenioNumber, 37, ' '); //CIE Service Number
    
    //     line += 'N';
    //     line += _.padEnd('', 8, ' '); //8 Spaces
    
    //     var paymentAccountType = '';
    //     // Bancomer net cash (BNC): Fill with 2 spaces.
    
    //     // Host to Host (H2H), Without third party validation capture the following:
    //     // 00 = Branch payment
    //     // 40 = Clabe account (Bancomer and other Banks)
    //     // 50 = CIE service number
    //     // 96 = International account (except USA). For Internacional Payments it is mandatory when there is no third party validation.
    //     // 97 = USA International Account. For International Payments it is mandatory when there is no third party validation. 
    //     // 99 = BBVA Bancomer account, 10 positions. 

    //     if (accountType=='1') {
    //         paymentAccountType = '40';
    //     } else if (accountType=='2') {
    //         paymentAccountType = '50';
    //     } else if (accountType=='3') {
    //         paymentAccountType = '40';
    //     } else if (accountType=='4') {
    //         paymentAccountType = '00';
    //     };
    
    //     line += _.padEnd(paymentAccountType, 2, ' ');
    
    //     var otherBanksAccountNumber = vendorRec.custentity_ica_bbva_other_banks_acct_num; //18
    
    //     // Host to Host (H2H) without third party validation is mandatory and it has to be aligned to the right, complete with zeros to the left e.g.
        
    //     // Bancomer (Bancomer 10 positions)
    //     // 00000000000000000000000001023456123
        
    //     // Bancomer (CLABE format):
    //     // 00000000000000000123456789012345678
        
    //     // CIE service number (02 + Convenio): 00000000000000000000000000200678765
        
    //     // Other banks
    //     // 00000000000000000123456789012345678
        
    //     // International, is mandatory for payments WITHOUT third party validation:
    //     // 123456790 (spaces)
    
    //     line += _.padEnd(otherBanksAccountNumber, 35, ' ');
    
    //     //278-317
    //     line += _.padEnd('', 40, ' ');
    
    //     line += _.padEnd('', 1, ' ');
    
    //     line += _.padEnd('', 30, ' '); //ID Number of First Beneficiary
    
    //     line += _.padEnd('', 40, ' '); //Always 40 spaces
    
    //     line += _.padEnd('', 1, ' '); //ID Code (Always space)
    
    //     line += _.padEnd('', 30, ' '); //ID Number of Second Beneficiary
    

    //     var currency = 'MXP'; //Get from bill. TODO;

    //     line += _.padEnd(currency, 3, ' '); //currency
    
    //     line += _.padEnd('', 11, ' '); //BIC
    
    //     line += _.padEnd('', 9, ' '); //ABA
    
    //     line += _.padEnd('FA', 2, ' '); //FA
    
    //     var totalBillAmount = String(arrBillsProcessed[x].payamt).replace(/\D/g,'') || "";
    
    //     line += _.padEnd(totalBillAmount, 15, '0'); //totalBillAmount without period
    
    //     line += _.padEnd('', 15, '0'); //BIC
    
    //     line += _.padEnd('01', 2, ' '); //Email confirmation (previously SMS)
    
    //     line += _.padEnd('', 50, ' '); //50 Spaces
    
    //     line += _.padEnd('N', 1, '');
    
    //     line += _.padEnd('', 8, '0');
    
    //     line += _.padEnd('', 4, '0');
    
    //     line += _.padEnd(today, 10, '');
    
    //     var apDate = '0001-01-01';
    
    //     line += _.padEnd(apDate, 10, '');
    //     line += _.padEnd(apDate, 10, '');
    //     line += _.padEnd(apDate, 10, '');
    
    //     var billPaymentDate = moment(arrBillsProcessed[x].duedate).format('YYYY-MM-DD');  //''; //get from bill.
        
    //     line += _.padEnd(billPaymentDate, 10, '');
    
    //     line += _.padEnd('N', 1, '');
    
    //     line += _.padEnd(' ', 1, '');
    //     line += _.padEnd(apDate, 10, '');
    //     line += _.padEnd('700', 3, ''); //Constant 700
    
    //     var notes = billRec.custbody_ica_bbva_additional_data || "";
    //     line += _.padEnd(notes, 700, ' ');
    
    //     line += _.padEnd('', 10, ' '); //credits
    
    //     line += _.padEnd('', 10, ' '); //debits
    
    //     line += _.padEnd('', 2, ' '); //Reply code
    
    //     line += _.padEnd('', 30, ' '); //Description reply code
        
    //     line += _.padEnd(apDate, 10, ' ');
    //     line += '\n';

    //     totals.noofregisters = Number(totals.noofregisters) + 1;
    //     totals.registeramount = Number(totals.registeramount) + Number(arrBillsProcessed[x].payamt);
    //     dAudit('totals.registeramount', totals.registeramount);
    // }
    totals.registeramount = parseFloat(Math.round(totals.registeramount * 100) / 100).toFixed(2);
    totals.registeramount = String(totals.registeramount).replace(/\D/g,'') || "";
    
    dAudit('totals.registeramount - final:', totals.registeramount);





    //Footer
    line += 'T';
    line += _.padStart(totals.noofregisters, 10, '0');  //11 padEnd
    line += _.padStart(totals.registeramount, 15, '0'); //remove period //26
    line += _.padStart(totals.noofdismisses, 10, '0');  //36 padEnd
    line += _.padStart(totals.dismissamount, 15, '0'); //remove period //51
    line += _.padStart('', 10, '0'); 
    line += _.padStart('', 15, '0'); 
    line += _.padStart('', 10, '0'); 
    line += _.padStart('', 15, '0'); 
    line += _.padStart('', 10, '0'); 
    line += _.padStart('', 15, '0'); 
    line += _.padStart('', 10, '0'); 
    line += _.padStart('', 15, '0'); 
    line += _.padStart('', 10, '0'); 
    line += _.padStart('', 15, '0'); 
    line += _.padStart('', 10, '0'); 
    line += _.padStart('', 15, '0'); 
    line += _.padStart('', 10, '0'); 
    line += _.padStart('', 15, '0'); 
    line += _.padStart('', 10, '0'); 
    line += _.padStart('', 15, '0'); 

    line += _.padStart('', 10, '0'); 
    line += _.padStart('', 15, '0'); 
    line += _.padStart('', 10, '0'); 
    line += _.padStart('', 15, '0'); 
    // line += _.padEnd(usdtotals.noofregisters, 10, '0'); 
    // line += _.padStart(usdtotals.registeramount, 15, '0'); //remove period
    // line += _.padEnd(usdtotals.noofdismisses, 10, '0'); 
    // line += _.padStart(usdtotals.dismissamount, 15, '0'); //remove period

    line += _.padStart('', 10, '0'); 
    line += _.padStart('', 15, '0'); 
    line += _.padStart('', 10, '0'); 
    line += _.padStart('', 15, '0'); 
    line += _.padStart('', 10, '0'); 
    line += _.padStart('', 15, '0'); 
    line += _.padStart('', 10, '0'); 
    line += _.padStart('', 15, '0'); 

    line += _.padStart('', 10, '0'); 
    line += _.padStart('', 15, '0'); 
    line += _.padStart('', 10, '0'); 
    line += _.padStart('', 15, '0'); 
    // line += _.padEnd(eurtotals.noofregisters, 10, '0'); 
    // line += _.padStart(eurtotals.registeramount, 15, '0'); //remove period
    // line += _.padEnd(eurtotals.noofdismisses, 10, '0'); //10 zeros
    // line += _.padStart(eurtotals.dismissamount, 15, '0'); //remove period

    line += _.padStart('', 10, '0'); 
    line += _.padStart('', 15, '0'); 
    line += _.padStart('', 10, '0'); 
    line += _.padStart('', 15, '0'); 
    line += _.padStart('', 10, '0'); 
    line += _.padStart('', 15, '0'); 
    line += _.padStart('', 10, '0'); 
    line += _.padStart('', 15, '0'); 
    line += _.padStart('', 10, '0'); 
    line += _.padStart('', 15, '0'); 
    line += _.padStart('', 10, '0'); 
    line += _.padStart('', 15, '0'); 
    line += _.padStart('', 10, '0'); 
    line += _.padStart('', 15, '0'); 
    line += _.padStart('', 10, '0'); 
    line += _.padStart('', 15, '0'); 
    line += _.padStart('', 10, '0'); 
    line += _.padStart('', 15, '0'); 
    line += _.padStart('', 10, '0'); 
    line += _.padStart('', 15, '0'); 
    line += _.padStart('', 10, '0'); 
    line += _.padStart('', 15, '0'); 
    line += _.padStart('', 10, '0'); 
    line += _.padStart('', 15, '0'); 
    line += _.padStart('', 10, '0'); 
    line += _.padStart('', 15, '0'); 
    line += _.padStart('', 10, '0'); 
    line += _.padStart('', 15, '0'); 
    line += _.padStart('', 10, '0'); 
    line += _.padStart('', 15, '0'); 
    line += _.padStart('', 10, '0'); 
    line += _.padStart('', 15, '0'); 
    line += _.padStart('', 10, '0'); 
    line += _.padStart('', 15, '0'); 
    line += _.padStart('', 10, '0'); 
    line += _.padStart('', 15, '0'); 
    line += _.padStart('', 10, '0'); 
    line += _.padStart('', 15, '0'); 
    line += _.padStart('', 10, '0'); 
    line += _.padStart('', 15, '0'); 
    line += _.padStart('', 10, '0'); 
    line += _.padStart('', 15, '0'); 
    line += _.padStart('', 10, '0'); 
    line += _.padStart('', 15, '0'); 
    line += _.padStart('', 10, '0'); 
    line += _.padStart('', 15, '0'); 
    line += _.padStart('', 10, '0'); 
    line += _.padStart('', 15, '0'); 
    line += _.padStart('', 10, '0'); 
    line += _.padStart('', 15, '0'); 
    line += _.padStart('', 10, '0'); 
    line += _.padStart('', 15, '0'); 
    line += _.padStart('', 10, '0'); 
    line += _.padStart('', 15, '0'); 
    line += _.padStart('', 10, '0'); 
    line += _.padStart('', 15, '0'); 
    line += _.padStart('', 10, '0'); 
    line += _.padStart('', 15, '0'); 
    line += _.padStart('', 10, '0'); 
    line += _.padStart('', 15, '0'); 
    line += _.padStart('', 10, '0'); 
    line += _.padStart('', 15, '0'); 
    line += _.padStart('', 10, '0'); 
    line += _.padStart('', 15, '0'); 
    line += _.padStart('', 10, '0'); 
    line += _.padStart('', 15, '0'); 
    line += _.padStart('', 10, '0'); 
    line += _.padStart('', 15, '0'); 
    line += _.padStart('', 65, ' '); 

    line += '\n'; //Filler




    














    //Footer

    return line;
}

function pad(n, width, z) {
    z = z || '0';
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}
