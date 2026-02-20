/**
 * @NApiVersion 2.x
 */

//xmllib .js file

define(['./ica_rec_mgr_lib', './ica_rec_mgr_lodash', './ica_rec_mgr_moment', 'N/file', 'N/search', 'N/xml', 'N/format', 'N/runtime'], function (
	lib,
	_,
	moment,
	file,
	search,
	xml,
	format,
	runtime
) {
	function returnProperDateFormat(d) {
		if (d == 'D-Mon-YYYY') return 'D-MMM-YYYY';
		else if (d == 'D-Mon-YYYY') return 'D-MMM-YYYY';
		else if (d == 'DD-Mon-YYYY') return 'DD-MMM-YYYY';
		else if (d == 'D-MONTH-YYYY') return 'D-MMMM-YYYY';
		else if (d == 'DD-MONTH-YYYY') return 'DD-MMMM-YYYY';
		else if (d == 'D MONTH, YYYY') return 'D MMMM, YYYY';
		else if (d == 'DD MONTH, YYYY') return 'DD MMMM, YYYY';
		else return d;
	}

	//Existing lib that is reusable.
	function isEmpty(fldValue) {
		return fldValue == '' || fldValue == null || fldValue == undefined;
	}

	function getFloatVal(val) {
		return isEmpty(val) ? 0.0 : parseFloat(val);
	}
	function setValue(fldValue, fldVal2) {
		if (!fldValue && !fldVal2) return '';

		return fldValue ? fldValue : fldVal2;
	}

	var MSG_TYPE = [];
	MSG_TYPE['CHK'] = 'custrecord_checkmessage';
	MSG_TYPE['DAC'] = 'custrecord_achmessage';
	MSG_TYPE['MTS'] = 'custrecord_mtsmessage';
	MSG_TYPE['IAC'] = 'custrecord_iacmessage';
	MSG_TYPE['IWI'] = 'custrecord_iwimessage';
	MSG_TYPE['CCR'] = 'custrecord_ccr_message';

	var countryCodeMapping = {
		Albania: 'AL',
		Algeria: 'DZ',
		'American Samoa': 'AS',
		Andorra: 'AD',
		Angola: 'AO',
		Anguilla: 'AI',
		Antarctica: 'AQ',
		'Antigua and Barbuda': 'AG',
		Argentina: 'AR',
		Armenia: 'AM',
		Aruba: 'AW',
		Australia: 'AU',
		Austria: 'AT',
		Azerbaijan: 'AZ',
		Bahamas: 'BS',
		Bahrain: 'BH',
		Bangladesh: 'BD',
		Barbados: 'BB',
		Belarus: 'BY',
		Belgium: 'BE',
		Belize: 'BZ',
		Benin: 'BJ',
		Bermuda: 'BM',
		Bhutan: 'BT',
		Bolivia: 'BO',
		'Bosnia and Herzegovina': 'BA',
		Botswana: 'BW',
		'Bouvet Island': 'BV',
		Brazil: 'BR',
		'British Indian Ocean Territory': 'IO',
		'Brunei Darussalam': 'BN',
		Bulgaria: 'BG',
		'Burkina Faso': 'BF',
		Burundi: 'BI',
		Cambodia: 'KH',
		Cameroon: 'CM',
		Canada: 'CA',
		'Cap Verde': 'CV',
		'Cayman Islands': 'KY',
		'Central African Republic': 'CF',
		Chad: 'TD',
		Chile: 'CL',
		China: 'CN',
		'Christmas Island': 'CX',
		'Cocos (Keeling) Islands': 'CC',
		Colombia: 'CO',
		Comoros: 'KM',
		"Congo, Democratic People's Republic": 'CD',
		'Congo, Republic of': 'CG',
		'Cook Islands': 'CK',
		'Costa Rica': 'CR',
		"Cote d'Ivoire": 'CI',
		'Croatia/Hrvatska': 'HR',
		Cuba: 'CU',
		Cyprus: 'CY',
		'Czech Republic': 'CZ',
		Denmark: 'DK',
		Djibouti: 'DJ',
		Dominica: 'DM',
		'Dominican Republic': 'DO',
		'East Timor': 'TP',
		Ecuador: 'EC',
		Egypt: 'EG',
		'El Salvador': 'SV',
		'Equatorial Guinea': 'GQ',
		Eritrea: 'ER',
		Estonia: 'EE',
		Ethiopia: 'ET',
		'Falkland Islands (Malvina)': 'FK',
		'Faroe Islands': 'FO',
		Fiji: 'FJ',
		Finland: 'FI',
		France: 'FR',
		'French Guiana': 'GF',
		'French Polynesia': 'PF',
		'French Southern Territories': 'TF',
		Gabon: 'GA',
		Gambia: 'GM',
		Georgia: 'GE',
		Germany: 'DE',
		Ghana: 'GH',
		Gibraltar: 'GI',
		Greece: 'GR',
		Greenland: 'GL',
		Grenada: 'GD',
		Guadeloupe: 'GP',
		Guam: 'GU',
		Guatemala: 'GT',
		Guernsey: 'GG',
		Guinea: 'GN',
		'Guinea-Bissau': 'GW',
		Guyana: 'GY',
		Haiti: 'HT',
		'Heard and McDonald Islands': 'HM',
		'Holy See (City Vatican State)': 'VA',
		Honduras: 'HN',
		'Hong Kong': 'HK',
		Hungary: 'HU',
		Iceland: 'IS',
		India: 'IN',
		Indonesia: 'ID',
		'Iran (Islamic Republic of)': 'IR',
		Iraq: 'IQ',
		Ireland: 'IE',
		'Isle of Man': 'IM',
		Israel: 'IL',
		Italy: 'IT',
		Jamaica: 'JM',
		Japan: 'JP',
		Jersey: 'JE',
		Jordan: 'JO',
		Kazakhstan: 'KZ',
		Kenya: 'KE',
		Kiribati: 'KI',
		"Korea, Democratic People's Republic": 'KP',
		'Korea, Republic of': 'KR',
		Kuwait: 'KW',
		Kyrgyzstan: 'KG',
		"Lao People's Democratic Republic": 'LA',
		Latvia: 'LV',
		Lebanon: 'LB',
		Lesotho: 'LS',
		Liberia: 'LR',
		'Libyan Arab Jamahiriya': 'LY',
		Liechtenstein: 'LI',
		Lithuania: 'LT',
		Luxembourg: 'LU',
		Macau: 'MO',
		Macedonia: 'MK',
		Madagascar: 'MG',
		Malawi: 'MW',
		Malaysia: 'MY',
		Maldives: 'MV',
		Mali: 'ML',
		Malta: 'MT',
		'Marshall Islands': 'MH',
		Martinique: 'MQ',
		Mauritania: 'MR',
		Mauritius: 'MU',
		Mayotte: 'YT',
		Mexico: 'MX',
		'Micronesia, Federal State of': 'FM',
		'Moldova, Republic of': 'MD',
		Monaco: 'MC',
		Mongolia: 'MN',
		Montenegro: 'ME',
		Montserrat: 'MS',
		Morocco: 'MA',
		Mozambique: 'MZ',
		Myanmar: 'MM',
		Namibia: 'NA',
		Nauru: 'NR',
		Nepal: 'NP',
		Netherlands: 'NL',
		'Netherlands Antilles': 'AN',
		'New Caledonia': 'NC',
		'New Zealand': 'NZ',
		Nicaragua: 'NI',
		Niger: 'NE',
		Nigeria: 'NG',
		Niue: 'NU',
		'Norfolk Island': 'NF',
		'Northern Mariana Islands': 'MP',
		Norway: 'NO',
		Oman: 'OM',
		Pakistan: 'PK',
		Palau: 'PW',
		'Palestinian Territories': 'PS',
		Panama: 'PA',
		'Papua New Guinea': 'PG',
		Paraguay: 'PY',
		Peru: 'PE',
		Philippines: 'PH',
		'Pitcairn Island': 'PN',
		Poland: 'PL',
		Portugal: 'PT',
		'Puerto Rico': 'PR',
		Qatar: 'QA',
		'Reunion Island': 'RE',
		Romania: 'RO',
		'Russian Federation': 'RU',
		Rwanda: 'RW',
		'Saint Barth�lemy': 'BL',
		'Saint Kitts and Nevis': 'KN',
		'Saint Lucia': 'LC',
		'Saint Martin': 'MF',
		'Saint Vincent and the Grenadines': 'VC',
		'San Marino': 'SM',
		'Sao Tome and Principe': 'ST',
		'Saudi Arabia': 'SA',
		Senegal: 'SN',
		Serbia: 'CS',
		Seychelles: 'SC',
		'Sierra Leone': 'SL',
		Singapore: 'SG',
		'Slovak Republic': 'SK',
		Slovenia: 'SI',
		'Solomon Islands': 'SB',
		Somalia: 'SO',
		'South Africa': 'ZA',
		'South Georgia': 'GS',
		Spain: 'ES',
		'Sri Lanka': 'LK',
		'St. Helena': 'SH',
		'St. Pierre and Miquelon': 'PM',
		Sudan: 'SD',
		Suriname: 'SR',
		'Svalbard and Jan Mayen Islands': 'SJ',
		Swaziland: 'SZ',
		Sweden: 'SE',
		Switzerland: 'CH',
		'Syrian Arab Republic': 'SY',
		Taiwan: 'TW',
		Tajikistan: 'TJ',
		Tanzania: 'TZ',
		Thailand: 'TH',
		Togo: 'TG',
		Tokelau: 'TK',
		Tonga: 'TO',
		'Trinidad and Tobago': 'TT',
		Tunisia: 'TN',
		Turkey: 'TR',
		Turkmenistan: 'TM',
		'Turks and Caicos Islands': 'TC',
		Tuvalu: 'TV',
		Uganda: 'UG',
		Ukraine: 'UA',
		'United Arab Emirates': 'AE',
		'United Kingdom': 'GB',
		'United Kingdom (GB)': 'GB',
		'United States': 'US',
		Uruguay: 'UY',
		'US Minor Outlying Islands': 'UM',
		Uzbekistan: 'UZ',
		Vanuatu: 'VU',
		Venezuela: 'VE',
		Vietnam: 'VN',
		'Virgin Islands (British)': 'VG',
		'Virgin Islands (USA)': 'VI',
		'Wallis and Futuna Islands': 'WF',
		'Western Sahara': 'EH',
		'Western Samoa': 'WS',
		Yemen: 'YE',
		Zambia: 'ZM',
		Zimbabwe: 'ZW',
	};

	function pad(number, length) {
		var str = '' + number;
		while (str.length < length) {
			str = '0' + str;
		}

		return str;
	}
	function IsNullOrEmpty(value) {
		var isNullOrEmpty = true;
		if (value) {
			if (typeof value == 'string') {
				if (value.length > 0) isNullOrEmpty = false;
			}
		}

		return isNullOrEmpty;
	}
	function addNodeFromParentNode(xmlDoc, parentNode, nodeName) {

		var newNode = null;
		if (parentNode != null) {
			newNode = xmlDoc.createElement(nodeName);
			parentNode.appendChild(newNode);
		}
		return newNode;
	}
	function addTextNodeFromParentPath(xmlDoc, xmlPath, nodeName, nodeValue) {
		var newNode = null;
		if (xmlDoc != null) {
			parentNode = nlapiSelectNode(xmlDoc, xmlPath);
			if (parentNode != null) {
				newNode = addTextNodeFromParentNode(xmlDoc, parentNode, nodeName, nodeValue);
			}
		}
		return newNode;
	}
	function addTextNodeFromParentNode(xmlDoc, parentNode, nodeName, nodeValue) {
		nodeValue = '' + nodeValue;

		var newNode = null;
		if (xmlDoc != null && parentNode != null && !IsNullOrEmpty(nodeName)) {
			newNode = xmlDoc.createElement(nodeName);
			newNode.appendChild(xmlDoc.createTextNode(nodeValue));
			parentNode.appendChild(newNode);
		}
		return newNode;
	}
	function addNodeFromParentNode(xmlDoc, parentNode, nodeName) {
		var newNode = null;

		if (parentNode != null) {
			newNode = xmlDoc.createElement(nodeName);
			parentNode.appendChild(newNode);
		}

		return newNode;
	}

	//Process And SendXML File.
	function processAndSendXMLFile(options, scriptParams) {
		log.audit('processAndSendXMLFile-options', JSON.stringify(options));

		log.audit('scriptParams', JSON.stringify(scriptParams));
		log.audit("scriptParams.pageFilters", scriptParams.pageFilters);
		log.audit("scriptParams.pageFilters.currencyFilter", scriptParams.pageFilters.currencyFilter);
		log.audit("scriptParams.scriptParameters", scriptParams.scriptParameters);
		log.audit("scriptParams.scriptParameters.fileNamePrefix", scriptParams.scriptParameters.fileNamePrefix);

		try {
			var timeStamp = moment().format('HHmmssYYMMDD');
			var fileName = timeStamp + '.xml';
			var fileName = scriptParams.scriptParameters.fileNamePrefix + '.' + timeStamp + '.xml';
			log.audit('processAndSendXMLFile:fileName', fileName);

			var xmlDoc = '';
			xmlDoc = createXMLDocumentOld(options, scriptParams);

			if (!xmlDoc) return null;

			var xmlData = xml.Parser.toString({
				document: xmlDoc,
			});

			var xmlFile = file.create({
				name: fileName,
				fileType: file.Type.XMLDOC,
				contents: xmlData,
				isOnline: true,
			});

			xmlFile.folder = scriptParams.scriptParameters.folderID;
			var fileId = xmlFile.save();
			log.audit('fileId', fileId);

			if (scriptParams.scriptParameters.connectorFolderID) {
				log.audit('processAndSendXMLFile:connectorFolderID exists, copying', scriptParams.scriptParameters.connectorFolderID);
				//copy the file
				var newFile = file.copy({
					folder: Number(scriptParams.scriptParameters.connectorFolderID),
					id: fileId,
					conflictResolution: file.NameConflictResolution.RENAME_TO_UNIQUE,
				});
				log.audit('processAndSendXMLFile:connectorFolderID exists, newFile', newFile);
			}

			return fileId;
		} catch (e) {
			log.error('Error on ProcessandSendXMLFile', e.message);
		}
	}

	//Process And SendXML File.
	function processAndSendNACHAFile(options, scriptParams) {
		log.audit('processAndSendNACHAFile-options', JSON.stringify(options));

		log.audit('scriptParams', JSON.stringify(scriptParams));
		log.audit("scriptParams.pageFilters", scriptParams.pageFilters);
		log.audit("scriptParams.pageFilters.currencyFilter", scriptParams.pageFilters.currencyFilter);
		log.audit("scriptParams.scriptParameters", scriptParams.scriptParameters);
		log.audit("scriptParams.scriptParameters.fileNamePrefix", scriptParams.scriptParameters.fileNamePrefix);

		try {
			var timeStamp = moment().format('HHmmssYYMMDD');
			var fileName = timeStamp + '.txt';
			var fileName = scriptParams.scriptParameters.fileNamePrefix + '.' + timeStamp + '.txt';
			log.audit('processAndSendNACHAFile:fileName', fileName);

			var textData = '';
			textData = createNACHADoc(options, scriptParams);

			if (!textData) return null;


			var xmlFile = file.create({
				name: fileName,
				fileType: file.Type.PLAINTEXT,
				contents: textData,
				isOnline: true,
			});

			xmlFile.folder = scriptParams.scriptParameters.folderID;
			var fileId = xmlFile.save();
			log.audit('text.fileId', fileId);

			if (scriptParams.scriptParameters.connectorFolderID) {
				log.audit('processAndSendNACHAFile:connectorFolderID exists, copying', scriptParams.scriptParameters.connectorFolderID);
				//copy the file
				var newFile = file.copy({
					folder: Number(scriptParams.scriptParameters.connectorFolderID),
					id: fileId,
					conflictResolution: file.NameConflictResolution.RENAME_TO_UNIQUE,
				});
				log.audit('processAndSendNACHAFile:connectorFolderID exists, newFile', newFile);
			}

			return fileId;
		} catch (e) {
			log.error('Error on processAndSendNACHAFile', e.message);
		}
	}
  
  function createNACHADoc(params, global) {
    //Set these variables - rewrite based on Receivables data

    log.audit('createNACHADoc-params', JSON.stringify(params));
		log.audit('createNACHADoc-global', JSON.stringify(global));

		//Load Bill Payments Data
		var paymentsIds = _.map(params, 'internalid');
		log.audit('createNACHADoc-paymentsIds', JSON.stringify(paymentsIds));

    var checkZipColumns = global.scriptParameters.checkZipColumns.split(',');
    log.audit('createNACHADoc-checkZipColumns', JSON.stringify(checkZipColumns));
		var paymentsData = lib.getPaymentsData(paymentsIds, checkZipColumns);
		log.audit('createNACHADoc-paymentsData', JSON.stringify(paymentsData));

		var paymentLinesData = lib.getPaymentLinesData(paymentsIds);
		log.audit('createNACHADoc-paymentLinesData', JSON.stringify(paymentLinesData));

		//Load Customers Data
		var customerIds = _.map(_.map(paymentsData, 'entity'), 'value');
		log.audit('createNACHADoc-customerIds', JSON.stringify(customerIds));

		var customersData = lib.getCustomersData(customerIds);
		log.audit('createNACHADoc-customersData', JSON.stringify(customersData));

		//Load Account Mappings
		var accountDataAll = lib.getAccountMappings();
		log.audit('createNACHADoc-accountDataAll', JSON.stringify(accountDataAll));
		var accountId = global.pageFilters.bankaccountFilter;
		var oam = _.find(accountDataAll, { custrecord_acct_map_netsuite_account: { value: String(accountId) } });
    // var oam = objAcctMapping[0];
		// var accountData = _.find

		//Load VPM
		var vendorPaymentInfoData = lib.getVendorPaymentMethods();
		log.audit('createNACHADoc-vpm', JSON.stringify(vendorPaymentInfoData));
		var vendorPaymentInfo = _.find(vendorPaymentInfoData, {
			custrecord_ica_bpm_subsidiary: { value: String(oam.custrecord_acct_map_sub.value) },
		});
		log.audit('createNACHADoc-vendorPaymentInfo', JSON.stringify(vendorPaymentInfo));
    // var nsAcctSub = !isEmpty(oam) && !isEmpty(oam.getValue('subsidiary', 'CUSTRECORD_ACCT_MAP_NETSUITE_ACCOUNT')) ? oam.getValue('subsidiary', 'CUSTRECORD_ACCT_MAP_NETSUITE_ACCOUNT') : '';
    // var objVDCRecResults = getVendorDAC_CCRPaymentRec(nsAcctSub);


		var arrCurrencyMap = lib.getCurrencyCodes();
		log.audit('createNACHADoc-arrCurrencyMap', JSON.stringify(arrCurrencyMap));

		var currDate = moment().format('YYYY-MM-DD');

    
    var today = new Date();
    var d = new Date(); //nlapiStringToDate(BPM_DATE, 'datetime');
  
  
    // dLog('createNACHADoc:arrBillsProcessed', JSON.stringify(arrBillsProcessed));
    // dLog('createNACHADoc:oam', JSON.stringify(oam));


  
    var text = '';
    var totalLines = 0;
    var tallyCount = 0;
    var COUNTER = 0;
  
    //Create File Header
  
    var header = '';
    header += '1';
    header += '01';
    header += ' ' + _.padStart(oam.custrecord_acct_map_ext_bank_ori_bank_id.value.substring(0, 9), 9, ' ');
    header += _.padStart(oam.custrecord_acct_map_ceo_company_id.value.substring(0, 10), 10, ' ');
    header += moment(d).format('YYMMDD') || moment(today).format('YYMMDD');
    header += moment(d).format('hhmm') || moment(today).format('hhmm');
    header += COUNTER; //TODO - assign day counter;
    header += '094';
    header += '10';
    header += '1';
    header += _.padEnd(vendorPaymentInfo.custrecord_bankname.value.toUpperCase(), 23, ' ');
    header += _.padEnd('', 23, ' ');
    header += _.padEnd('', 8, ' ');
    header += '\n';
    totalLines++;
  
    text += header;
  
    // var arrVendors = getEntityData(_.map(arrBillsProcessed, 'payeeid'));
    // dLog('arrVendors', JSON.stringify(arrVendors));
    // arrVendors = arrVendors.concat(getEmployeeData(_.map(arrBillsProcessed, 'payeeid')));
    // dLog('arrVendors concat', JSON.stringify(arrVendors));
    var billsProcessed = [];
    for (var i = 0; i < paymentsData.length; i++) {
      var data = paymentsData[i];
      log.audit('data', JSON.stringify(data));
      try {
        //Rewrite this!
        data['paymentformat'] = _.find(customersData, { internalid: { value: String(data.entity.value) } }).custentity_paymentformat.text;
      } catch (e) {
        data['paymentformat'] = '';
      }      
  
      billsProcessed.push(data);
    }
    
    var groupedByPaymentFormat = _.groupBy(billsProcessed, 'paymentformat');  
    log.audit('groupedByPaymentFormat', JSON.stringify(groupedByPaymentFormat));
  
    var tallyCount = 0;
    var batchNum = 0;
    var totalSumRouting = 0;
    var totalPayments = 0;
    for (x in groupedByPaymentFormat) {
      // var payments = groupedByPaymentFormat[x];
      var grouped = _.groupBy(groupedByPaymentFormat[x], 'internalid.value');
      var paymentformat = x;
      log.audit('grouped', grouped);
      log.audit('paymentformat', paymentformat);
  
      //Create header
      var batchHeader = '';
      batchHeader += '5';
      batchHeader += '200';
      batchHeader += _.padStart(vendorPaymentInfo.custrecord_companyname.value.substring(0, 16), 16, ' ');
      batchHeader += _.padStart('', 20, ' ');
      batchHeader += _.padStart(oam.custrecord_acct_map_ceo_company_id.value.substring(0, 10), 10, ' ');
      batchHeader += _.padStart(paymentformat, 3, ' ');
      batchHeader += 'PAYMENT   '; //_.padStart(billPayment.getValue("tranid"), 10, ' '); //Ask Al
      batchHeader += _.padStart('', 6, ' '); //Suppose to be date
      batchHeader += moment(d).format('YYMMDD') || moment(today).format('YYMMDD');
      batchHeader += _.padStart('', 3, ' ');
      batchHeader += '1';
      batchHeader += _.padStart(oam.custrecord_acct_map_ext_bank_ori_bank_id.value.substring(0, 8), 8, ' ');
      batchHeader += _.padStart(batchNum + 1, 7, '0');
      batchHeader += '\n';
      totalLines++;
      text += batchHeader;
  
      var entryDetailTotal = 0;
      var sumRoutingEntries = 0;
  
      var paymentsCount = 0;
      for (y in grouped) {
        var paymentAmount = 0;
        var payeeid = 0;
        for (var i = 0; i < grouped[y].length; i++) {
          log.audit('grouped[y]', JSON.stringify(grouped[y]));
          paymentAmount += Number(grouped[y][i].amount.value);
          payeeid = grouped[y][i].entity.value;
        }
        log.audit('paymentAmount', paymentAmount);
        log.audit('payeeid', payeeid);
  
        // var objVendor = arrVendors[payeeid];
        var objVendor =  _.find(customersData, { internalid: { value: String(payeeid) } });
        log.audit('objVendor', JSON.stringify(objVendor));
        //Create entry detail
        var entryDetail = '';
        entryDetail += '6';
        entryDetail += '22';
        entryDetail += _.padStart(objVendor.custentity_recbankprimid.value.substring(0, 8), 8, ' ');
        entryDetail += objVendor.custentity_recbankprimid.value.charAt(objVendor.custentity_recbankprimid.value.length - 1);
        entryDetail += _.padEnd(objVendor.custentity_recpartyaccount.value, 17, ' ');
        entryDetail += _.padStart(String(paymentAmount.toFixed(2)).replace('.', ''), 10, '0');
        entryDetail += _.padStart(objVendor.entityid.value.substring(0, 15), 15, ' ');
        entryDetail += _.padEnd(objVendor.custentity_vendorname.value.substring(0, 22), 22, ' ');
        entryDetail += _.padStart('', 2, ' ');
        entryDetail += '0';
        entryDetail += _.padStart(objVendor.custentity_recbankprimid.value.substring(0, 8), 15, ' ');
        entryDetail += '\n';
        totalLines++;
        text += entryDetail;
  
        entryDetailTotal += Number(paymentAmount);
        totalPayments += Number(paymentAmount);
        sumRoutingEntries += Number(objVendor.custentity_recbankprimid.value.substring(0, 8));
        totalSumRouting += Number(objVendor.custentity_recbankprimid.value.substring(0, 8));
        tallyCount++;
        paymentsCount++;
      }
    
      //Create batch control
      var batchControl = '';
      batchControl += '8';
      batchControl += '220';
      batchControl += _.padStart(paymentsCount, 6, '0'); //correct
      batchControl += _.padStart(sumRoutingEntries, 10, '0'); //just add the values of recbankprimid
      batchControl += _.padStart(String(entryDetailTotal.toFixed(2)).replace('.', ''), 12, '0'); //TODO: Get the total in amounts of all payments in the batch
      batchControl += _.padStart('', 12, '0');
      batchControl += _.padStart(oam.custrecord_acct_map_ceo_company_id.value.substring(0, 10), 10, ' ');
      batchControl += _.padStart('', 19, ' ');
      batchControl += _.padStart('', 6, ' ');
      batchControl += _.padStart(oam.custrecord_acct_map_ceo_company_id.value.substring(0, 8), 8, ' ');
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
    trailer += _.padStart(String(totalPayments.toFixed(2)).replace('.', ''), 12, '0'); //TODO: total in amounts
    trailer += _.padEnd('', 12, '0');
    trailer += _.padEnd('', 39, ' ');
    trailer += '\n';
    text += trailer;
  
    log.audit('text', text);
  
    return text;
  }

	function createXMLDocumentOld(params, global) {
		log.audit('createXMLDocumentOld-params', JSON.stringify(params));
		log.audit('createXMLDocumentOld-global', JSON.stringify(global));

		//Load Bill Payments Data
		var paymentsIds = _.map(params, 'internalid');
		log.audit('createXMLDocument-paymentsIds', JSON.stringify(paymentsIds));

    var checkZipColumns = global.scriptParameters.checkZipColumns.split(',');
    log.audit('createXMLDocument-checkZipColumns', JSON.stringify(checkZipColumns));
		var paymentsData = lib.getPaymentsData(paymentsIds, checkZipColumns);
		log.audit('createXMLDocument-paymentsData', JSON.stringify(paymentsData));

		var paymentLinesData = lib.getPaymentLinesData(paymentsIds);
		log.audit('createXMLDocument-paymentLinesData', JSON.stringify(paymentLinesData));

		//Load Customers Data
		var customerIds = _.map(_.map(paymentsData, 'entity'), 'value');
		log.audit('createXMLDocument-customerIds', JSON.stringify(customerIds));

		var customersData = lib.getCustomersData(customerIds);
		log.audit('createXMLDocument-customersData', JSON.stringify(customersData));

		// var entityProfilesData = lib.getEntityProfilesData(customerIds);
		// log.audit("createXMLDocument-entityProfilesData", JSON.stringify(entityProfilesData));

		//Load Account Mappings
		var accountDataAll = lib.getAccountMappings();
		log.audit('createXMLDocument-accountDataAll', JSON.stringify(accountDataAll));
		var accountId = global.pageFilters.bankaccountFilter;
		var accountData = _.find(accountDataAll, { custrecord_acct_map_netsuite_account: { value: String(accountId) } });
		log.audit('createXMLDocument-accountData', JSON.stringify(accountData));
		// var accountData = _.find

		//Load VPM
		var vendorPaymentInfoData = lib.getVendorPaymentMethods();
		log.audit('createXMLDocument-vpm', JSON.stringify(vendorPaymentInfoData));
		var vendorPaymentInfo = _.find(vendorPaymentInfoData, {
			custrecord_ica_bpm_subsidiary: { value: String(accountData.custrecord_acct_map_sub.value) },
		});
		log.audit('createXMLDocument-vendorPaymentInfo', JSON.stringify(vendorPaymentInfo));

		var arrCurrencyMap = lib.getCurrencyCodes();
		log.audit('createXMLDocument-arrCurrencyMap', JSON.stringify(arrCurrencyMap));

		var currDate = moment().format('YYYY-MM-DD');
		var xmlFileContent = '<?xml version="1.0"?><File></File>';
		var xmlDoc = xml.Parser.fromString({
			text: xmlFileContent,
		});

		var fileNode = xml.XPath.select({ node: xmlDoc, xpath: '/File' })[0]; //Get first element.
		fileNode.setAttribute({ name: 'CompanyID', value: global.scriptParameters.companyId });
		fileNode.setAttribute({ name: 'xmlns:xsi', value: 'http://www.w3.org/2001/XMLSchema-instance' });

		var pmtRecTotal = 0;
		var pmtRecTotalDue = 0;

		var dpf = runtime.getCurrentUser().getPreference({
			name: 'DATEFORMAT',
		});
		var dateformat = returnProperDateFormat(dpf);
		var E_REFUND_DATE = moment(global.pageFilters.dateFilter, dateformat).format('YYYY-MM-DD');

		try {
			for (var i = 0; i < paymentsData.length; i++) {
				var customerPayment = paymentsData[i];
				var customerPaymentLines = _.filter(paymentLinesData, { internalid: { value: String(customerPayment.internalid.value) } });
				log.audit('customerPayment', JSON.stringify(customerPayment));
				log.audit('customerPaymentLines-internalid', JSON.stringify(customerPaymentLines));

        // var transactionDetails = 
        // log.audit('transactionDetails', transactionDetails);

				//Preload data from JSON arrays.
				// var customer = _.find(entityProfilesData, {custrecord_ica_ep_parent_entity: {value: String(customerPayment.entity.value)}});
				// var customer = customersData[customerPayment.entity.value];
				var customer = _.find(customersData, { internalid: { value: String(customerPayment.entity.value) } });
				log.audit('customer', JSON.stringify(customer));

				var pmtRecNode = addNodeFromParentNode(xmlDoc, fileNode, 'PmtRec');
				log.audit('pmtRecNode', JSON.stringify(pmtRecNode));

				pmtRecTotal += Number(customerPayment.amount.value);
				pmtRecTotalDue += Number(customerPayment.amountremaining.value);

				var paymentMethod = customerPayment.custentity_paymentmethod_customer.text;

				log.audit(
					'Details at top',
					JSON.stringify({
						pmtRecTotal: pmtRecTotal,
						pmtRecTotalDue: pmtRecTotalDue,
						pmtMethod: paymentMethod,
					})
				);

				var MSGTYPE = MSG_TYPE[paymentMethod];

				//add sections.
				var sectionHeader = ['DAC', 'IAC', 'CHK', 'MTS', 'IWI', 'ACH', 'CCR'];
				var sectionMessageNode = ['DAC', 'IAC', 'CHK', 'MTS', 'IWI', 'ACH', 'CCR'];
				var sectionMessageExtraNode = ['DAC', 'IAC', 'MTS', 'IWI'];
				var sectionOriginParty = ['DAC', 'IAC', 'CHK', 'MTS', 'IWI', 'ACH'];
				var sectionOrgnrDepAcctID = ['DAC', 'IAC', 'CHK', 'MTS', 'IWI', 'ACH', 'CCR'];
				var sectionRcvrParty = ['DAC', 'IAC', 'CHK', 'MTS', 'IWI', 'ACH', 'CCR'];
				var sectionRcvrDepAcctID = ['DAC', 'IAC', 'MTS', 'IWI', 'ACH', 'CCR'];
				var sectionIntermediaryDepAccID = ['MTS', 'IAC'];
				var sectionPmtDetail = ['DAC', 'CHK', 'IAC', 'MTS', 'IWI', 'ACH', 'CCR'];
				var sectionDocDelivery = ['DAC', 'IAC', 'MTS', 'IWI'];
				var sectionCurrAmt = ['DAC', 'IAC', 'CHK', 'MTS', 'IWI', 'CCR', 'B2P'];

				//B2P
				if (paymentMethod == 'B2P') {
					pmtRecNode.setAttribute({ name: 'PmtCrDr', value: 'D' });
					pmtRecNode.setAttribute({ name: 'PmtMethod', value: paymentMethod });

					if (lib.utils.isNotEmpty(customerPayment.currency.value)) {
						var curCode = arrCurrencyMap[customerPayment.currency.value];
						addTextNodeFromParentNode(xmlDoc, pmtRecNode, 'CurCode', curCode);
					}

					var orgnPartyNode = addNodeFromParentNode(xmlDoc, pmtRecNode, 'OrgnrParty');

					if (lib.utils.isNotEmpty(vendorPaymentInfo) && lib.utils.isNotEmpty(vendorPaymentInfo.custrecord_companyname.value)) {
						var orgpNameNode = addNodeFromParentNode(xmlDoc, orgnPartyNode, 'Name');
						addTextNodeFromParentNode(xmlDoc, orgpNameNode, 'Name1', vendorPaymentInfo.custrecord_companyname.value);
					}

          var pmtId = customerPayment.tranid.value || customerPayment.transactionnumber.value;
					addTextNodeFromParentNode(xmlDoc, pmtRecNode, 'PmtID', pmtId);

					// var bpm_date = moment().format("YYYY-MM-DD"); //Let's assume bpm_date is today. This will be a parameter from suitelet. options.filter_options.bpm_date
					addTextNodeFromParentNode(xmlDoc, pmtRecNode, 'ValueDate', E_REFUND_DATE);

					//ElectronicPmtInfo
					var ElecPmtNode = addNodeFromParentNode(xmlDoc, pmtRecNode, 'ElectronicPmtInfo');
					if (lib.utils.isNotEmpty(accountData) && lib.utils.isNotEmpty(accountData.custrecord_acct_map_ext_bank_ori_bank_id.value))
						addTextNodeFromParentNode(xmlDoc, ElecPmtNode, 'EPBankID', accountData.custrecord_acct_map_ext_bank_ori_bank_id.value);
					if (lib.utils.isNotEmpty(accountData) && lib.utils.isNotEmpty(accountData.custrecord_acct_map_ext_bank_origin_acc.value))
						addTextNodeFromParentNode(xmlDoc, ElecPmtNode, 'EPAcctID', accountData.custrecord_acct_map_ext_bank_origin_acc.value);

					if (lib.utils.isNotEmpty(customer) && lib.utils.isNotEmpty(customer.custentity_pmp_dac_delivery_contact_name.value))
						addTextNodeFromParentNode(xmlDoc, ElecPmtNode, 'EPFirstName', customer.custentity_pmp_dac_delivery_contact_name.value);
					if (lib.utils.isNotEmpty(customer) && lib.utils.isNotEmpty(customer.custentity_pmp_dac_delivery_email_addres.value))
						addTextNodeFromParentNode(xmlDoc, ElecPmtNode, 'EPEmailToken', customer.custentity_pmp_dac_delivery_email_addres.value);

					// if (lib.utils.isNotEmpty(customer) && lib.utils.isNotEmpty(customer.custrecord_ica_ep_pmp_del_contact_name.value))
					//         addTextNodeFromParentNode(xmlDoc, ElecPmtNode, "EPFirstName", customer.custrecord_ica_ep_pmp_del_contact_name.value);
					// if (lib.utils.isNotEmpty(customer) && lib.utils.isNotEmpty(customer.custrecord_ica_ep_pmp_del_email_addr.value))
					//         addTextNodeFromParentNode(xmlDoc, ElecPmtNode, "EPEmailToken", customer.custrecord_ica_ep_pmp_del_email_addr.value);

					//Need to check memo of B2P.
					if (lib.utils.isNotEmpty(customerPayment.memomain.value)) {
						addTextNodeFromParentNode(xmlDoc, ElecPmtNode, 'EPDesc', customerPayment.memomain.value.substr(0, 200));
					}
				}

				//1. Header
				if (_.includes(sectionHeader, paymentMethod)) {
					pmtRecNode.setAttribute({ name: 'PmtCrDr', value: 'D' });
					pmtRecNode.setAttribute({ name: 'PmtMethod', value: paymentMethod });

					//Special for DAC.
					if (paymentMethod == 'DAC') {
						if (global.scriptParameters.WFNoAccountInformation) {
							addTextNodeFromParentNode(xmlDoc, pmtRecNode, 'PDPHandlingCode', 'T');
						}
					}

					if (paymentMethod != 'MTS') {
						if (lib.utils.isNotEmpty(customer.custentity_paymentformat.text)) {
							pmtRecNode.setAttribute({ name: 'PmtFormat', value: customer.custentity_paymentformat.text });
						}
						// if (lib.utils.isNotEmpty(customer.custrecord_ica_ep_payment_format.text)) {
						//         pmtRecNode.setAttribute({ name: "PmtFormat", value: customer.custrecord_ica_ep_payment_format.text });
						// }
					}

					if (lib.utils.isNotEmpty(customer.custentity_interpayformat.value)) {
						pmtRecNode.setAttribute({ name: 'PmtFormatIntl', value: customer.custentity_interpayformat.value });
					}

					// if (lib.utils.isNotEmpty(customer.custrecord_ica_ep_intl_payment_format.value)) {
					//         pmtRecNode.setAttribute({ name: "PmtFormatIntl", value: customer.custrecord_ica_ep_intl_payment_format.value });
					// }

					if (paymentMethod == 'CCR' || paymentMethod == 'CHK') {
						//Do nothing.
					} else {
						if (lib.utils.isNotEmpty(customer.custentity_pmp_biller_id.value)) {
							// if (lib.utils.isNotEmpty(customer.custrecord_ica_ep_pmp_biller_id.value)) {
							pmtRecNode.setAttribute({ name: 'TranHandlingCode', value: 'U' });
						} else if (lib.utils.isNotEmpty(accountData) && lib.utils.isNotEmpty(accountData.custrecord_acct_map_pmp_biller_id.value)) {
							pmtRecNode.setAttribute({ name: 'TranHandlingCode', value: 'U' });
						}
					}

					//Special for CCR
					if (paymentMethod == 'CCR') {
						var idInfoNodeBatch = addNodeFromParentNode(xmlDoc, pmtRecNode, 'IDInfo');
						idInfoNodeBatch.setAttribute({ name: 'IDType', value: 'BatchID' });
						var batchId = moment().format('YYhhmmSS');
						addTextNodeFromParentNode(xmlDoc, idInfoNodeBatch, 'ID', pad(batchId, 10));

						// START: IDInfo - Customer ID
						var idInfoNodeBatch = addNodeFromParentNode(xmlDoc, pmtRecNode, 'IDInfo');
						idInfoNodeBatch.setAttribute({ name: 'IDType', value: 'CustomerID' });

						if (lib.utils.isNotEmpty(accountData) && lib.utils.isNotEmpty(accountData.custrecord_acct_map_ceo_company_id.value))
							addTextNodeFromParentNode(xmlDoc, idInfoNodeBatch, 'ID', accountData.custrecord_acct_map_ceo_company_id.value);
					}

          var pmtId = customerPayment.tranid.value || customerPayment.transactionnumber.value;
					addTextNodeFromParentNode(xmlDoc, pmtRecNode, 'PmtID', pmtId); //used to be billnum
					if (lib.utils.isNotEmpty(customerPayment.currency.value)) {
						var curCode = arrCurrencyMap[customerPayment.currency.value];
						addTextNodeFromParentNode(xmlDoc, pmtRecNode, 'CurCode', curCode);
					}

					addTextNodeFromParentNode(xmlDoc, pmtRecNode, 'ValueDate', E_REFUND_DATE);
				}

				log.debug('after 1', '');

				//2. Exclusive for MTS - Wire Frees
				if (paymentMethod == 'MTS') {
					var wireFees = global.scriptParameters.wireFees == 1 ? 'BEN' : 'OUR';
					var wcRefInfo = addNodeFromParentNode(xmlDoc, pmtRecNode, 'RefInfo');
					wcRefInfo.setAttribute({ name: 'RefType', value: 'WC' });
					addTextNodeFromParentNode(xmlDoc, wcRefInfo, 'RefID', wireFees);
				}

				//2. Exclusive for CHK
				if (paymentMethod == 'CHK') {
					if (lib.utils.isNotEmpty(vendorPaymentInfo)) {
						log.audit('here', '');
						if (lib.utils.isNotEmpty(vendorPaymentInfo.custrecord_check_insert_type.value) ||
							lib.utils.isNotEmpty(vendorPaymentInfo.custrecord_check_insert_value.value)) {
							var iacRefInfo = addNodeFromParentNode(xmlDoc, pmtRecNode, 'RefInfo');
							if (lib.utils.isNotEmpty(vendorPaymentInfo.custrecord_check_insert_type.value)) {
								iacRefInfo.setAttribute({ name: 'RefType', value: vendorPaymentInfo.custrecord_check_insert_type.value });
								// setAttributeValue(iacRefInfo, 'RefType', vendorPaymentInfo.custrecord_check_insert_type);
							}
							if (lib.utils.isNotEmpty(vendorPaymentInfo.custrecord_check_insert_value.value)) {
								addTextNodeFromParentNode(xmlDoc, iacRefInfo, 'RefID', vendorPaymentInfo.custrecord_check_insert_value.value);
							}

							log.audit('here', 'end');
						}

            if ((global.scriptParameters.includeCheckZip == 'true')) {
              log.audit('About to add ZZ', global.scriptParameters.includeCheckZip);
              if (!isEmpty(global.scriptParameters.checkZipColumns)) {
                var internalids = global.scriptParameters.checkZipColumns.split(',');
                var cleaned = [];
                for (var z = 0; z < internalids.length; z++) {
                  cleaned.push(internalids[z].trim());
                }
                internalids = cleaned;
                log.audit('internalids', internalids);
                var hasAttachments = false;
    
                log.audit('customerPayment', JSON.stringify(customerPayment));

                for (var z = 0; z < internalids.length; z++) {
                  if (customerPayment[internalids[z]].value) {
                    hasAttachments = true;
                    log.audit('Found an attachment', internalids[z]);
                  }
                }
    
                if (hasAttachments) {
                  log.audit('Found an attachment', hasAttachments);
                  var wcRefInfo = addNodeFromParentNode(xmlDoc, pmtRecNode, 'RefInfo');
                  wcRefInfo.setAttribute({ name: 'RefType', value: 'ZZ' });
                  addTextNodeFromParentNode(xmlDoc, wcRefInfo, 'RefID', 'EOR');
                }
              }
            }                
					}
				}

				//2. Exclusive for IAC/IWI
				if (paymentMethod == 'IAC' || paymentMethod == 'IWI') {
					// if (lib.utils.isNotEmpty(customer.custrecord_ica_ep_forex_ref_type.value) || lib.utils.isNotEmpty(customer.custrecord_ica_ep_forex_ref_id.value)) {
					//         var iacRefInfo = addNodeFromParentNode(xmlDoc, pmtRecNode, "RefInfo");
					//         if (lib.utils.isNotEmpty(customer.custrecord_ica_ep_forex_ref_type.value)) iacRefInfo.setAttribute({ name: "RefType", value: customer.custrecord_ica_ep_forex_ref_type.value });
					//         if (lib.utils.isNotEmpty(customer.custrecord_ica_ep_forex_ref_id.value)) addTextNodeFromParentNode(xmlDoc, iacRefInfo, "RefID", customer.custrecord_ica_ep_forex_ref_id.value);
					// }
					if (
						lib.utils.isNotEmpty(customer.custentity_forex_ref_type.value) ||
						lib.utils.isNotEmpty(customer.custentity_forex_ref_id.value)
					) {
						var iacRefInfo = addNodeFromParentNode(xmlDoc, pmtRecNode, 'RefInfo');
						if (lib.utils.isNotEmpty(customer.custentity_forex_ref_type.value))
							iacRefInfo.setAttribute({ name: 'RefType', value: customer.custentity_forex_ref_type.value });
						if (lib.utils.isNotEmpty(customer.custentity_forex_ref_id.value))
							addTextNodeFromParentNode(xmlDoc, iacRefInfo, 'RefID', customer.custentity_forex_ref_id.value);
					}
				}
				log.debug('after 2', '');

				//3. sectionMessageNode
				// if (_.includes(sectionMessageNode, paymentMethod)) {
				// 	var msgNode = addNodeFromParentNode(xmlDoc, pmtRecNode, 'Message');
				// 	msgNode.setAttribute({ name: 'MsgType', value: vendorPaymentInfo[MSGTYPE].value });

				// 	//Simplified logic -- verify with Al.
				// 	// var msgTypeTxt = ''; //customerPayment.memomain.value || ""; //customer.custrecord_ica_ep_parent_entity.value;
        //   try {
        //     var msgTypeTxt = customerPayment.memomain.value || customer.custrecord_ica_ep_parent_entity.value || customerPayment.tranid.value;
        //     addTextNodeFromParentNode(xmlDoc, msgNode, 'MsgText', msgTypeTxt);  
        //   } catch(e) {
        //     log.error('Did not get any message Texts, defaulting to blank', '');
        //     addTextNodeFromParentNode(xmlDoc, msgNode, 'MsgText', ''); 
        //   }
				// }

				//ChkNode -- only for CHK
				if (paymentMethod == 'CHK') {
					var chkNode = addNodeFromParentNode(xmlDoc, pmtRecNode, 'Check');
          var chkNum = customerPayment.tranid.value || customerPayment.transactionnumber.value;
					addTextNodeFromParentNode(xmlDoc, chkNode, 'ChkNum', chkNum); //RSF

					if (lib.utils.isNotEmpty(customer.custentity_check_style.value)) {
						addTextNodeFromParentNode(xmlDoc, chkNode, 'ChkDocNum', customer.custentity_check_style.value);
						// if (lib.utils.isNotEmpty(customer.custrecord_ica_ep_check_style.value)) {
						//         addTextNodeFromParentNode(xmlDoc, chkNode, "ChkDocNum", customer.custrecord_ica_ep_check_style.value);
					} else if (lib.utils.isNotEmpty(accountData) && lib.utils.isNotEmpty(accountData.custrecord_acct_map_check_template_id.value)) {
						addTextNodeFromParentNode(xmlDoc, chkNode, 'ChkDocNum', accountData.custrecord_acct_map_check_template_id.value);
					}

					// if (lib.utils.isNotEmpty(customer) && lib.utils.isNotEmpty(customer.custrecord_ica_ep_courier_name.value))
					//         addTextNodeFromParentNode(xmlDoc, chkNode, "CourierName", customer.custrecord_ica_ep_courier_name.value);

					// if (lib.utils.isNotEmpty(customer) && lib.utils.isNotEmpty(customer.custrecord_ica_ep_courier_account.value))
					//         addTextNodeFromParentNode(xmlDoc, chkNode, "CourierAccount", customer.custrecord_ica_ep_courier_account.value);

					// if (lib.utils.isNotEmpty(customer) && lib.utils.isNotEmpty(customer.custrecord_ica_ep_delivery_code.value))
					//         addTextNodeFromParentNode(xmlDoc, chkNode, "DeliveryCode", customer.custrecord_ica_ep_delivery_code.text);

					if (lib.utils.isNotEmpty(customer) && lib.utils.isNotEmpty(customer.custentity_courier_name.value))
						addTextNodeFromParentNode(xmlDoc, chkNode, 'CourierName', customer.custentity_courier_name.value);

					if (lib.utils.isNotEmpty(customer) && lib.utils.isNotEmpty(customer.custentity_courier_account.value))
						addTextNodeFromParentNode(xmlDoc, chkNode, 'CourierAccount', customer.custentity_courier_account.value);

					if (lib.utils.isNotEmpty(customer) && lib.utils.isNotEmpty(customer.custentity_courier_deliverycode.value))
						addTextNodeFromParentNode(xmlDoc, chkNode, 'DeliveryCode', customer.custentity_courier_deliverycode.text);
				}

				//3. sectionMEssageExtra
				// if (_.includes(sectionMessageExtraNode, paymentMethod)) {
				// 	var msgTxt = '';
				// 	var bMemo = customer.custentity_ica_vendor_bank_instructions.value;
				// 	// var bMemo = "";

				// 	if (lib.utils.isNotEmpty(bMemo)) {
				// 		msgTxt += lib.utils.isEmpty(msgTxt) ? bMemo : ' ' + bMemo;
				// 	}

				// 	if (lib.utils.isNotEmpty(msgTxt)) {
				// 		var msgNode = addNodeFromParentNode(xmlDoc, pmtRecNode, 'Message');
				// 		msgNode.setAttribute({ name: 'MsgType', value: global.scriptParameters.vendorOrigMsgType });
				// 		addTextNodeFromParentNode(xmlDoc, msgNode, 'MsgText', msgTxt);
				// 	}
				// }

				log.debug(
					'after 3',
					JSON.stringify({
						sectionOriginParty: sectionOriginParty,
						paymentMethod: paymentMethod,
					})
				);

				//4. sectionOriginParty
				if (_.includes(sectionOriginParty, paymentMethod)) {
					log.debug('inside 3', paymentMethod);
					// START: Origin Party
					var orgnPartyNode = addNodeFromParentNode(xmlDoc, pmtRecNode, 'OrgnrParty');

					if (lib.utils.isNotEmpty(vendorPaymentInfo) && lib.utils.isNotEmpty(vendorPaymentInfo.custrecord_companyname.value)) {
						var orgpNameNode = addNodeFromParentNode(xmlDoc, orgnPartyNode, 'Name');
						addTextNodeFromParentNode(xmlDoc, orgpNameNode, 'Name1', vendorPaymentInfo.custrecord_companyname.value);
					}
					if (
						(lib.utils.isNotEmpty(vendorPaymentInfo) && lib.utils.isNotEmpty(vendorPaymentInfo.custrecord_compadd1.value)) ||
						(lib.utils.isNotEmpty(vendorPaymentInfo) && lib.utils.isNotEmpty(vendorPaymentInfo.custrecord_compadd2.value)) ||
						(lib.utils.isNotEmpty(vendorPaymentInfo) && lib.utils.isNotEmpty(vendorPaymentInfo.custrecord_compcity.value)) ||
						(lib.utils.isNotEmpty(vendorPaymentInfo) && lib.utils.isNotEmpty(vendorPaymentInfo.custrecord_compstateprov.value)) ||
						(lib.utils.isNotEmpty(vendorPaymentInfo) && lib.utils.isNotEmpty(vendorPaymentInfo.custrecord_comppostcode.value))
					) {
						var postAddrNode = addNodeFromParentNode(xmlDoc, orgnPartyNode, 'PostAddr');

						if (lib.utils.isNotEmpty(vendorPaymentInfo) && lib.utils.isNotEmpty(vendorPaymentInfo.custrecord_compadd1.value))
							addTextNodeFromParentNode(xmlDoc, postAddrNode, 'Addr1', vendorPaymentInfo.custrecord_compadd1.value);
						if (lib.utils.isNotEmpty(vendorPaymentInfo) && lib.utils.isNotEmpty(vendorPaymentInfo.custrecord_compadd2.value))
							addTextNodeFromParentNode(xmlDoc, postAddrNode, 'Addr2', vendorPaymentInfo.custrecord_compadd2.value);
						if (lib.utils.isNotEmpty(vendorPaymentInfo) && lib.utils.isNotEmpty(vendorPaymentInfo.custrecord_compcity.value))
							addTextNodeFromParentNode(xmlDoc, postAddrNode, 'City', vendorPaymentInfo.custrecord_compcity.value);
						if (lib.utils.isNotEmpty(vendorPaymentInfo) && lib.utils.isNotEmpty(vendorPaymentInfo.custrecord_compstateprov.value))
							addTextNodeFromParentNode(xmlDoc, postAddrNode, 'StateProv', vendorPaymentInfo.custrecord_compstateprov.value);
						if (lib.utils.isNotEmpty(vendorPaymentInfo) && lib.utils.isNotEmpty(vendorPaymentInfo.custrecord_comppostcode.value))
							addTextNodeFromParentNode(xmlDoc, postAddrNode, 'PostalCode', vendorPaymentInfo.custrecord_comppostcode.value);

						var country = lib.utils.isNotEmpty(vendorPaymentInfo) ? vendorPaymentInfo.custrecord_compcountrycode.value : '';
						if (lib.utils.isNotEmpty(country)) addTextNodeFromParentNode(xmlDoc, postAddrNode, 'Country', country);

						var countryName = lib.utils.isNotEmpty(vendorPaymentInfo) ? vendorPaymentInfo.custrecord_compcountrynames.text : '';
						if (lib.utils.isNotEmpty(countryName)) addTextNodeFromParentNode(xmlDoc, postAddrNode, 'CountryName', countryName);
					}
					// END: Origin Party
				}

				//4.A OrgnParty for CCR
				if (paymentMethod == 'CCR') {
					log.audit('vendorPaymentInfo', JSON.stringify(vendorPaymentInfo));
					var orgnPartyNode = addNodeFromParentNode(xmlDoc, pmtRecNode, 'OrgnrParty');

					var orgpContactInfoNode = '';
					if (
						(lib.utils.isNotEmpty(vendorPaymentInfo) && lib.utils.isNotEmpty(vendorPaymentInfo.custrecord_ccr_contact.value)) ||
						(lib.utils.isNotEmpty(vendorPaymentInfo) && lib.utils.isNotEmpty(vendorPaymentInfo.custrecord_ccr_phonetype.value)) ||
						(lib.utils.isNotEmpty(vendorPaymentInfo) && lib.utils.isNotEmpty(vendorPaymentInfo.custrecord_ccr_phonenum.value))
					) {
						orgpContactInfoNode = addNodeFromParentNode(xmlDoc, orgnPartyNode, 'ContactInfo');
					}

					if (lib.utils.isNotEmpty(vendorPaymentInfo) && lib.utils.isNotEmpty(vendorPaymentInfo.custrecord_ccr_contact.value))
						orgpContactInfoNode.setAttribute({ name: 'Name', value: vendorPaymentInfo.custrecord_ccr_contact.value });

					if (
						(lib.utils.isNotEmpty(vendorPaymentInfo) && lib.utils.isNotEmpty(vendorPaymentInfo.custrecord_ccr_phonetype.value)) ||
						(lib.utils.isNotEmpty(vendorPaymentInfo) && lib.utils.isNotEmpty(vendorPaymentInfo.custrecord_ccr_phonenum.value))
					) {
						var orgpPhoneNumNode = addNodeFromParentNode(xmlDoc, orgpContactInfoNode, 'PhoneNum');

						if (lib.utils.isNotEmpty(vendorPaymentInfo) && lib.utils.isNotEmpty(vendorPaymentInfo.custrecord_ccr_phonetype.value))
							orgpPhoneNumNode.setAttribute({ name: 'PhoneType', value: vendorPaymentInfo.custrecord_ccr_phonetype.value });

						if (lib.utils.isNotEmpty(vendorPaymentInfo) && lib.utils.isNotEmpty(vendorPaymentInfo.custrecord_ccr_phonenum.value))
							orgpPhoneNumNode.setAttribute({ name: 'Phone', value: vendorPaymentInfo.custrecord_ccr_phonenum.value });
					}
				}

				log.debug('after 4', '');

				//5. OrgnrDepAcctID
				if (_.includes(sectionOrgnrDepAcctID, paymentMethod)) {
					// START: OrgnrDepAcctID
					var orgnDepAcctIDNode = addNodeFromParentNode(xmlDoc, pmtRecNode, 'OrgnrDepAcctID');
					var odepacctIdNode = addNodeFromParentNode(xmlDoc, orgnDepAcctIDNode, 'DepAcctID');

					if (lib.utils.isNotEmpty(accountData) && lib.utils.isNotEmpty(accountData.custrecord_acct_map_ext_bank_account_typ.text))
						odepacctIdNode.setAttribute({ name: 'AcctType', value: accountData.custrecord_acct_map_ext_bank_account_typ.text });

					if (paymentMethod == 'CCR') {
						if (lib.utils.isNotEmpty(accountData) && lib.utils.isNotEmpty(accountData.custrecord_acct_map_credit_card_man.value))
							odepacctIdNode.setAttribute({ name: 'AcctID', value: accountData.custrecord_acct_map_credit_card_man.value });
					} else {
						if (lib.utils.isNotEmpty(accountData) && lib.utils.isNotEmpty(accountData.custrecord_acct_map_ext_bank_origin_acc.value))
							odepacctIdNode.setAttribute({ name: 'AcctID', value: accountData.custrecord_acct_map_ext_bank_origin_acc.value });
					}

					if (lib.utils.isNotEmpty(accountData) && lib.utils.isNotEmpty(accountData.custrecord_acct_map_account_currency.value))
						odepacctIdNode.setAttribute({
							name: 'AcctCur',
							value: arrCurrencyMap[accountData.custrecord_acct_map_account_currency.value],
						});

					var bankInfoNode = addNodeFromParentNode(xmlDoc, odepacctIdNode, 'BankInfo');
					if (lib.utils.isNotEmpty(vendorPaymentInfo))
						bankInfoNode.setAttribute({ name: 'Name', value: vendorPaymentInfo.custrecord_bankname.value });

					if (lib.utils.isNotEmpty(accountData) && lib.utils.isNotEmpty(accountData.custrecord_acct_map_ext_bank_id_type.text))
						bankInfoNode.setAttribute({ name: 'BankIDType', value: accountData.custrecord_acct_map_ext_bank_id_type.text });

					if (lib.utils.isNotEmpty(accountData) && lib.utils.isNotEmpty(accountData.custrecord_acct_map_ext_bank_ori_bank_id.value)) {
						// addTextNodeFromParentNode(xmlDoc, postAddrNode, 'CountryName', countryName);
						addTextNodeFromParentNode(xmlDoc, bankInfoNode, 'BankID', accountData.custrecord_acct_map_ext_bank_ori_bank_id.value);
					}
					// bankInfoNode.setAttribute({name: 'BankID', value: accountData.custrecord_acct_map_ext_bank_ori_bank_id});
					var refType = ['DAC', 'IAC', 'MTS', 'IWI', 'ACH', 'CCR'];
					if (_.includes(refType, paymentMethod)) {
						var orgrefInfoNode = addNodeFromParentNode(xmlDoc, bankInfoNode, 'RefInfo');
						if (lib.utils.isNotEmpty(vendorPaymentInfo))
							orgrefInfoNode.setAttribute({ name: 'RefType', value: vendorPaymentInfo[MSGTYPE].value });
					}

					//Excluded from CHK
					var refId = ['DAC', 'IAC', 'MTS', 'ACH'];
					if (_.includes(refId, paymentMethod)) {
						if (lib.utils.isNotEmpty(accountData) && lib.utils.isNotEmpty(accountData.custrecord_acct_map_dom_ach_co_id.value)) {
							addTextNodeFromParentNode(xmlDoc, orgrefInfoNode, 'RefID', accountData.custrecord_acct_map_dom_ach_co_id.value);
						}
					}
					// END: OrgnrDepAcctID
				}

				log.debug('after 5', '');

				//6. RcvrParty
				if (_.includes(sectionRcvrParty, paymentMethod)) {
					// START: RcvrParty
					var rcvrPartyNode = addNodeFromParentNode(xmlDoc, pmtRecNode, 'RcvrParty');

					// if (lib.utils.isNotEmpty(customer.custrecord_ica_ep_entity_name.value)) {
					//         var rcvrPartyNameNode = addNodeFromParentNode(xmlDoc, rcvrPartyNode, "Name");
					//         addTextNodeFromParentNode(xmlDoc, rcvrPartyNameNode, "Name1", customer.custrecord_ica_ep_entity_name.value);
					// }

					if (lib.utils.isNotEmpty(customer.custentity_vendorname.value)) {
						var rcvrPartyNameNode = addNodeFromParentNode(xmlDoc, rcvrPartyNode, 'Name');
						addTextNodeFromParentNode(xmlDoc, rcvrPartyNameNode, 'Name1', customer.custentity_vendorname.value);
					}

					var ccrRefType =
						lib.utils.isNotEmpty(vendorPaymentInfo) && lib.utils.isNotEmpty(vendorPaymentInfo.custrecord_ccr_reftype.value)
							? vendorPaymentInfo.custrecord_ccr_reftype.value
							: '';
					var refType = ccrRefType ? ccrRefType : 'VN';
					var refInfoNode = addNodeFromParentNode(xmlDoc, rcvrPartyNode, 'RefInfo');
					refInfoNode.setAttribute({ name: 'RefType', value: refType });
					// setAttributeValue(refInfoNode, 'RefType', refType);

					addTextNodeFromParentNode(xmlDoc, refInfoNode, 'RefID', customerPayment.entity.value);

					// var rPPostAddrNode = "";
					// if (
					//         lib.utils.isNotEmpty(customer.custrecord_ica_ep_entity_addr_line_1.value) ||
					//         lib.utils.isNotEmpty(customer.custrecord_ica_ep_entity_addr_line_2.value) ||
					//         lib.utils.isNotEmpty(customer.custrecord_ica_ep_city.value) ||
					//         lib.utils.isNotEmpty(customer.custrecord_ica_ep_entity_state.value) ||
					//         (lib.utils.isNotEmpty(vendorPaymentInfo) && lib.utils.isNotEmpty(vendorPaymentInfo.custrecord_comppostcode.value)) ||
					//         lib.utils.isNotEmpty(customer.custentity_vendorpostalcode.value) ||
					//         lib.utils.isNotEmpty(customer.custentity_vendorcountrycode.value)
					// ) {
					//         rPPostAddrNode = addNodeFromParentNode(xmlDoc, rcvrPartyNode, "PostAddr");
					// }

					// if (lib.utils.isNotEmpty(customer.custrecord_ica_ep_entity_addr_line_1.value))
					//         addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, "Addr1", customer.custrecord_ica_ep_entity_addr_line_1.value);
					// if (lib.utils.isNotEmpty(customer.custrecord_ica_ep_entity_addr_line_2.value))
					//         addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, "Addr2", customer.custrecord_ica_ep_entity_addr_line_2.value);
					// if (lib.utils.isNotEmpty(customer.custrecord_ica_ep_city.value))
					//         addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, "City", customer.custrecord_ica_ep_city.value);
					// if (lib.utils.isNotEmpty(customer.custrecord_ica_ep_entity_state.value))
					//         addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, "StateProv", customer.custrecord_ica_ep_entity_state.value);

					// if (paymentMethod != "CCR") {
					//         if (lib.utils.isNotEmpty(customer.custrecord_ica_ep_postal_code.value))
					//                 addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, "PostalCode", customer.custrecord_ica_ep_postal_code.value);
					// }

					// if (paymentMethod == "CCR") {
					//         if (lib.utils.isNotEmpty(vendorPaymentInfo) && lib.utils.isNotEmpty(vendorPaymentInfo.custrecord_comppostcode.value))
					//                 addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, "PostalCode", vendorPaymentInfo.custrecord_comppostcode.value);
					//         var contactInfoNode = addNodeFromParentNode(xmlDoc, rcvrPartyNode, "ContactInfo");
					//         if (lib.utils.isNotEmpty(customer) && lib.utils.isNotEmpty(customer.custrecord_ica_ep_payee_email.value))
					//                 addTextNodeFromParentNode(xmlDoc, contactInfoNode, "EmailAddr", customer.custrecord_ica_ep_payee_email.value);
					//         // if (lib.utils.isNotEmpty(customer) && lib.utils.isNotEmpty(customer.custentity_payee_email.value))
					//         //         addTextNodeFromParentNode(xmlDoc, contactInfoNode, "EmailAddr", customer.custentity_payee_email.value);
					// }

					// if (lib.utils.isNotEmpty(customer.custrecord_ica_ep_entity_country.text)) {
					//         addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, "Country", countryCodeMapping[customer.custrecord_ica_ep_entity_country.text]);
					//         addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, "CountryName", customer.custrecord_ica_ep_entity_country.text);
					// }

					// if (lib.utils.isNotEmpty(customer.custentity_vendorcountrycode.text)) {
					// 	addTextNodeFromParentNode(
					// 		xmlDoc,
					// 		rPPostAddrNode,
					// 		'Country',
					// 		countryCodeMapping[customer.custentity_vendorcountrycode.text]
					// 	);
					// 	addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, 'CountryName', customer.custentity_vendorcountrycode.text);
					// }

					var rPPostAddrNode = '';
					if (
						lib.utils.isNotEmpty(customer.custentity_vendoraddline1.value) ||
						lib.utils.isNotEmpty(customer.custentity_vendoraddline2.value) ||
						lib.utils.isNotEmpty(customer.custentity_vendorcity.value) ||
						lib.utils.isNotEmpty(customer.custentity_vendorstateprovince.value) ||
						(lib.utils.isNotEmpty(vendorPaymentInfo) && lib.utils.isNotEmpty(vendorPaymentInfo.custrecord_comppostcode.value)) ||
						lib.utils.isNotEmpty(customer.custentity_vendorpostalcode.value) ||
						lib.utils.isNotEmpty(customer.custentity_vendorcountrycode.value)
					) {
						rPPostAddrNode = addNodeFromParentNode(xmlDoc, rcvrPartyNode, 'PostAddr');
					}

					if (lib.utils.isNotEmpty(customer.custentity_vendoraddline1.value))
						addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, 'Addr1', customer.custentity_vendoraddline1.value);
					if (lib.utils.isNotEmpty(customer.custentity_vendoraddline2.value))
						addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, 'Addr2', customer.custentity_vendoraddline2.value);
					if (lib.utils.isNotEmpty(customer.custentity_vendorcity.value))
						addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, 'City', customer.custentity_vendorcity.value);
					if (lib.utils.isNotEmpty(customer.custentity_vendorstateprovince.value))
						addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, 'StateProv', customer.custentity_vendorstateprovince.value);

					if (paymentMethod != 'CCR') {
						if (lib.utils.isNotEmpty(customer.custentity_vendorpostalcode.value))
							addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, 'PostalCode', customer.custentity_vendorpostalcode.value);
					}

					if (paymentMethod == 'CCR') {
						if (lib.utils.isNotEmpty(vendorPaymentInfo) && lib.utils.isNotEmpty(vendorPaymentInfo.custrecord_comppostcode.value))
							addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, 'PostalCode', vendorPaymentInfo.custrecord_comppostcode.value);
						var contactInfoNode = addNodeFromParentNode(xmlDoc, rcvrPartyNode, 'ContactInfo');
						if (lib.utils.isNotEmpty(customer) && lib.utils.isNotEmpty(customer.custentity_payee_email.value))
							addTextNodeFromParentNode(xmlDoc, contactInfoNode, 'EmailAddr', customer.custentity_payee_email.value);
					}

					if (lib.utils.isNotEmpty(customer.custentity_vendorcountrycode.text)) {
						addTextNodeFromParentNode(
							xmlDoc,
							rPPostAddrNode,
							'Country',
							countryCodeMapping[customer.custentity_vendorcountrycode.text]
						);
						addTextNodeFromParentNode(xmlDoc, rPPostAddrNode, 'CountryName', customer.custentity_vendorcountrycode.text);
					}
					// END: RcvrParty
				}

				//Exclusive for CCR. PmtSuppCCR
				if (paymentMethod == 'CCR') {
					var pmtSuppCCRNode = addNodeFromParentNode(xmlDoc, pmtRecNode, 'PmtSuppCCR');

					addTextNodeFromParentNode(xmlDoc, pmtSuppCCRNode, 'MerchantID', customer.internalid.value);
					// addTextNodeFromParentNode(xmlDoc, pmtSuppCCRNode, "MerchantID", customer.custrecord_ica_ep_parent_entity.value);

					if (lib.utils.isNotEmpty(accountData) && lib.utils.isNotEmpty(accountData.custrecord_acct_map_credit_card_div_num))
						addTextNodeFromParentNode(xmlDoc, pmtSuppCCRNode, 'Division', accountData.custrecord_acct_map_credit_card_div_num);
				}
				log.debug('after 6', '');

				//7. RcvrDepAcctID
				if (_.includes(sectionRcvrDepAcctID, paymentMethod)) {
					// START: RcvrDepAcctID
					var rcvrDeptAcctID = addNodeFromParentNode(xmlDoc, pmtRecNode, 'RcvrDepAcctID');
					var rdeptAcctIdNode = addNodeFromParentNode(xmlDoc, rcvrDeptAcctID, 'DepAcctID');

					// if (lib.utils.isNotEmpty(customer.custrecord_ica_ep_rec_party_account.value))  {
					//         rdeptAcctIdNode.setAttribute({ name: "AcctID", value: customer.custrecord_ica_ep_rec_party_account.value });
					//         rdeptAcctIdNode.setAttribute({ name: "AcctType", value: "D" });
					// }
					if (lib.utils.isNotEmpty(customer.custentity_recpartyaccount.value)) {
						rdeptAcctIdNode.setAttribute({ name: 'AcctID', value: customer.custentity_recpartyaccount.value });
						// rdeptAcctIdNode.setAttribute({ name: 'AcctType', value: 'D' });
					}
					if (lib.utils.isNotEmpty(customer.custentity_recpartyaccttype.text)) {
						rdeptAcctIdNode.setAttribute({ name: 'AcctType', value: customer.custentity_recpartyaccttype.text || 'D' });
					} else {
            rdeptAcctIdNode.setAttribute({ name: 'AcctType', value: 'D' });
          }

					if (lib.utils.isNotEmpty(customerPayment.currency.value)) {
						rdeptAcctIdNode.setAttribute({ name: 'AcctCur', value: arrCurrencyMap[customerPayment.currency.value] });
					}

					var rbankInfoNode = addNodeFromParentNode(xmlDoc, rdeptAcctIdNode, 'BankInfo');
					// if (lib.utils.isNotEmpty(customer.custrecord_ica_ep_bank_name.value))
					//         rbankInfoNode.setAttribute({ name: "Name", value: customer.custrecord_ica_ep_bank_name.value });
					if (lib.utils.isNotEmpty(customer.custentity_bankname.value))
						rbankInfoNode.setAttribute({ name: 'Name', value: customer.custentity_bankname.value });

					// if (lib.utils.isNotEmpty(customer.custrecord_ica_ep_receiving_bank_id_type.text))
					//         rbankInfoNode.setAttribute({ name: "BankIDType", value: customer.custrecord_ica_ep_receiving_bank_id_type.text });
					if (lib.utils.isNotEmpty(customer.custentity_recbankprimidtype.text))
						rbankInfoNode.setAttribute({ name: 'BankIDType', value: customer.custentity_recbankprimidtype.text });

					if (paymentMethod == 'IAC' || paymentMethod == 'IWI' || paymentMethod == 'MTS') {
						// if (lib.utils.isNotEmpty(customer.custrecord_ica_ep_sort_code.value))
						//         rbankInfoNode.setAttribute({ name: "BranchID", value: customer.custrecord_ica_ep_sort_code.value });

						if (lib.utils.isNotEmpty(customer.custentity_vendorbranchbankircid.value))
							//(pmtMethod == 'IAC' || pmtMethod == 'IWI' || pmtMethod == 'MTS') &&
							rbankInfoNode.setAttribute({ name: 'BranchID', value: customer.custentity_vendorbranchbankircid.value });
					}

					// var rpostAddrNode = "";
					// if (
					//         lib.utils.isNotEmpty(customer.custrecord_ica_ep_bank_addr_1.value) ||
					//         lib.utils.isNotEmpty(customer.custrecord_ica_ep_bank_state.value) ||
					//         lib.utils.isNotEmpty(customer.custrecord_ica_ep_bank_city.value) ||
					//         lib.utils.isNotEmpty(customer.custrecord_ica_ep_bank_post_code.value) ||
					//         lib.utils.isNotEmpty(customer.custrecord_ica_ep_bank_country_code.text)
					// ) {
					//         rpostAddrNode = addNodeFromParentNode(xmlDoc, rbankInfoNode, "PostAddr");
					// }

					// if (lib.utils.isNotEmpty(customer.custrecord_ica_ep_bank_addr_1.value))
					//         addTextNodeFromParentNode(xmlDoc, rpostAddrNode, "Addr1", customer.custrecord_ica_ep_bank_addr_1.value);
					// if (lib.utils.isNotEmpty(customer.custrecord_ica_ep_bank_state.value))
					//         addTextNodeFromParentNode(xmlDoc, rpostAddrNode, "StateProv", customer.custrecord_ica_ep_bank_state.value);
					// if (lib.utils.isNotEmpty(customer.custrecord_ica_ep_bank_city.value))
					//         addTextNodeFromParentNode(xmlDoc, rpostAddrNode, "City", customer.custrecord_ica_ep_bank_city.value);
					// if (lib.utils.isNotEmpty(customer.custrecord_ica_ep_bank_post_code.value))
					//         addTextNodeFromParentNode(xmlDoc, rpostAddrNode, "PostalCode", customer.custrecord_ica_ep_bank_post_code.value);
					// if (lib.utils.isNotEmpty(customer.custrecord_ica_ep_bank_country_code.text))
					//         addTextNodeFromParentNode(xmlDoc, rpostAddrNode, "Country", countryCodeMapping[customer.custrecord_ica_ep_bank_country_code.text]);
					// if (lib.utils.isNotEmpty(customer.custrecord_ica_ep_rec_bank_primary_id.value))
					//         addTextNodeFromParentNode(xmlDoc, rbankInfoNode, "BankID", customer.custrecord_ica_ep_rec_bank_primary_id.value);

					var rpostAddrNode = '';
					if (
						lib.utils.isNotEmpty(customer.custentity_bankaddressline1.value) ||
						lib.utils.isNotEmpty(customer.custentity_bankstate.value) ||
						lib.utils.isNotEmpty(customer.custentity_bankcity.value) ||
						lib.utils.isNotEmpty(customer.custentity_bankpostcode.value) ||
						lib.utils.isNotEmpty(customer.custentity_bankcountrycode.text)
					) {
						rpostAddrNode = addNodeFromParentNode(xmlDoc, rbankInfoNode, 'PostAddr');
					}

					if (lib.utils.isNotEmpty(customer.custentity_bankaddressline1.value))
						addTextNodeFromParentNode(xmlDoc, rpostAddrNode, 'Addr1', customer.custentity_bankaddressline1.value);
					if (lib.utils.isNotEmpty(customer.custentity_bankstate.value))
						addTextNodeFromParentNode(xmlDoc, rpostAddrNode, 'StateProv', customer.custentity_bankstate.value);
					if (lib.utils.isNotEmpty(customer.custentity_bankcity.value))
						addTextNodeFromParentNode(xmlDoc, rpostAddrNode, 'City', customer.custentity_bankcity.value);
					if (lib.utils.isNotEmpty(customer.custentity_bankpostcode.value))
						addTextNodeFromParentNode(xmlDoc, rpostAddrNode, 'PostalCode', customer.custentity_bankpostcode.value);
					if (lib.utils.isNotEmpty(customer.custentity_bankcountrycode.text))
						addTextNodeFromParentNode(xmlDoc, rpostAddrNode, 'Country', countryCodeMapping[customer.custentity_bankcountrycode.text]);
					if (lib.utils.isNotEmpty(customer.custentity_recbankprimid.value))
						addTextNodeFromParentNode(xmlDoc, rbankInfoNode, 'BankID', customer.custentity_recbankprimid.value);
					// END: RcvrDepAcctID
				}

				log.debug('after 7', '');

				//8. sectionIntermediaryDepAccID ['MTS', 'IAC'];
				if (_.includes(sectionIntermediaryDepAccID, paymentMethod)) {
					// START : IntermediaryDepAccID -- Only for MTS and IAC.
					var intermediaryDepAccID = addNodeFromParentNode(xmlDoc, pmtRecNode, 'IntermediaryDepAccID');
					var iDeptAcctIdNode = addNodeFromParentNode(xmlDoc, intermediaryDepAccID, 'DepAcctID');
					var iBankInfoNode = addNodeFromParentNode(xmlDoc, iDeptAcctIdNode, 'BankInfo');

					// if (lib.utils.isNotEmpty(customer.custrecord_ica_ep_bank_id_type.text))
					//         iBankInfoNode.setAttribute({ name: "BankIDType", value: customer.custrecord_ica_ep_bank_id_type.text });

					// if (lib.utils.isNotEmpty(customer.custrecord_ica_ep_intm_bank_name.value))
					//         iBankInfoNode.setAttribute({ name: "Name", value: customer.custrecord_ica_ep_intm_bank_name.value });

					// if (lib.utils.isNotEmpty(customer.custrecord_ica_ep_intm_bank_id.value)) {
					//         // If Bank ID is ABA, enter the 9 digit ABA routing/transit
					//         // number.
					//         // If BankID Type is SWT, enter 8 or 11 character SWIFT BIC
					//         // code.
					//         // If BankIDType is CHP enter the 4 digit CHP participant
					//         // ID.
					//         addTextNodeFromParentNode(xmlDoc, iBankInfoNode, "BankID", customer.custrecord_ica_ep_intm_bank_id.value);
					// }

					// var iPostAddrNode = "";
					// if (
					//         lib.utils.isNotEmpty(customer.custrecord_ica_ep_intm_bank_addr_1.value) ||
					//         lib.utils.isNotEmpty(customer.custrecord_ica_ep_intm_bank_city.value) ||
					//         lib.utils.isNotEmpty(customer.custrecord_ica_ep_intm_bank_state.value) ||
					//         lib.utils.isNotEmpty(customer.custrecord_ica_ep_intm_bank_postal_code.value) ||
					//         lib.utils.isNotEmpty(customer.custrecord_ica_ep_intm_bank_country.text)
					// ) {
					//         iPostAddrNode = addNodeFromParentNode(xmlDoc, iBankInfoNode, "PostAddr");
					// }

					// if (lib.utils.isNotEmpty(customer.custrecord_ica_ep_intm_bank_addr_1.value))
					//         addTextNodeFromParentNode(xmlDoc, iPostAddrNode, "Addr1", customer.custrecord_ica_ep_intm_bank_addr_1.value);

					// if (lib.utils.isNotEmpty(customer.custrecord_ica_ep_intm_bank_city.value))
					//         addTextNodeFromParentNode(xmlDoc, iPostAddrNode, "City", customer.custrecord_ica_ep_intm_bank_city.value);

					// if (lib.utils.isNotEmpty(customer.custrecord_ica_ep_intm_bank_state.value))
					//         addTextNodeFromParentNode(xmlDoc, iPostAddrNode, "StateProv", customer.custrecord_ica_ep_intm_bank_state.value);

					// if (lib.utils.isNotEmpty(customer.custrecord_ica_ep_intm_bank_postal_code.value))
					//         addTextNodeFromParentNode(xmlDoc, iPostAddrNode, "PostalCode", customer.custrecord_ica_ep_intm_bank_postal_code.value);

					// if (lib.utils.isNotEmpty(customer.custrecord_ica_ep_intm_bank_country.text))
					//         addTextNodeFromParentNode(xmlDoc, iPostAddrNode, "Country", countryCodeMapping[customer.custrecord_ica_ep_intm_bank_country.text]);
					// END : IntermediaryDepAccID

					if (lib.utils.isNotEmpty(customer.custentity_inter_bank_id_type.text))
						iBankInfoNode.setAttribute({ name: 'BankIDType', value: customer.custentity_inter_bank_id_type.text });

					if (lib.utils.isNotEmpty(customer.custentity_inter_bank_name.value))
						iBankInfoNode.setAttribute({ name: 'Name', value: customer.custentity_inter_bank_name.value });

					if (lib.utils.isNotEmpty(customer.custentity_inter_bank_id.value)) {
						// If Bank ID is ABA, enter the 9 digit ABA routing/transit
						// number.
						// If BankID Type is SWT, enter 8 or 11 character SWIFT BIC
						// code.
						// If BankIDType is CHP enter the 4 digit CHP participant
						// ID.
						addTextNodeFromParentNode(xmlDoc, iBankInfoNode, 'BankID', customer.custentity_inter_bank_id.value);
					}

					var iPostAddrNode = '';
					if (
						lib.utils.isNotEmpty(customer.custentity_inter_bank_address_1.value) ||
						lib.utils.isNotEmpty(customer.custentity_inter_bank_city.value) ||
						lib.utils.isNotEmpty(customer.custentity_inter_bank_state.value) ||
						lib.utils.isNotEmpty(customer.custentity_inter_bank_postal.value) ||
						lib.utils.isNotEmpty(customer.custentity_inter_bank_country.text)
					) {
						iPostAddrNode = addNodeFromParentNode(xmlDoc, iBankInfoNode, 'PostAddr');
					}

					if (lib.utils.isNotEmpty(customer.custentity_inter_bank_address_1.value))
						addTextNodeFromParentNode(xmlDoc, iPostAddrNode, 'Addr1', customer.custentity_inter_bank_address_1.value);

					if (lib.utils.isNotEmpty(customer.custentity_inter_bank_city.value))
						addTextNodeFromParentNode(xmlDoc, iPostAddrNode, 'City', customer.custentity_inter_bank_city.value);

					if (lib.utils.isNotEmpty(customer.custentity_inter_bank_state.value))
						addTextNodeFromParentNode(xmlDoc, iPostAddrNode, 'StateProv', customer.custentity_inter_bank_state.value);

					if (lib.utils.isNotEmpty(customer.custentity_inter_bank_postal.value))
						addTextNodeFromParentNode(xmlDoc, iPostAddrNode, 'PostalCode', customer.custentity_inter_bank_postal.value);

					if (lib.utils.isNotEmpty(customer.custentity_inter_bank_country.text))
						addTextNodeFromParentNode(
							xmlDoc,
							iPostAddrNode,
							'Country',
							countryCodeMapping[customer.custentity_inter_bank_country.text]
						);
					// END : IntermediaryDepAccID
				}
				log.debug('after 8', paymentMethod);

				//9. PmtDetail
        var invoicesIncluded = [];
				if (_.includes(sectionPmtDetail, paymentMethod)) {
					// START: PmtDetail
					var pmtDetailsNode = addNodeFromParentNode(xmlDoc, pmtRecNode, 'PmtDetail');
					log.audit('customerPaymentLines-here', JSON.stringify(customerPaymentLines));
					//Loop on bill details.
					for (var z = 0; z < customerPaymentLines.length; z++) {
						var current = customerPaymentLines[z];
            invoicesIncluded.push(current.internalid_appliedToTransaction.value);
						log.audit('current', JSON.stringify(current));

            if (current.internalid_appliedToTransaction.value) { //only add if it has an internalid.s
              var pmtInvoiceInfoNode = addNodeFromParentNode(xmlDoc, pmtDetailsNode, 'InvoiceInfo');
              pmtInvoiceInfoNode.setAttribute({ name: 'InvoiceType', value: 'IV' }); //Always
              // if (lib.utils.isNotEmpty(vendorPaymentInfo)) {
              // 	pmtInvoiceInfoNode.setAttribute({ name: "InvoiceType", value: vendorPaymentInfo.custrecord_invoicetype });
              // } else {
              // 	pmtInvoiceInfoNode.setAttribute({ name: "InvoiceType", value: "" });
              // }
  
              try {
                pmtInvoiceInfoNode.setAttribute({ name: 'InvoiceNum', value: current.tranid_appliedToTransaction.value });
              } catch (e) {
                pmtInvoiceInfoNode.setAttribute({ name: 'InvoiceNum', value: current.transactionnumber_appliedToTransaction.value });
              }
              
              pmtInvoiceInfoNode.setAttribute({
                name: 'TotalCurAmt',
                value: Math.abs(Number(current['Paying Amount'].value)).toFixed(2),
              });
              pmtInvoiceInfoNode.setAttribute({
                name: 'NetCurAmt',
                value: Math.abs(Number(current.amount_appliedToTransaction.value)).toFixed(2), //amount_applyingTransaction
              });
  
              var effDate = ['DAC', 'CHK', 'MTS', 'ACH', 'CCR'];
              if (_.includes(effDate, paymentMethod)) {
                var trandate = moment(current.trandate_appliedToTransaction.value, dateformat).format('YYYY-MM-DD');
                log.audit('trandate', trandate);
                pmtInvoiceInfoNode.setAttribute({ name: 'EffDt', value: trandate });
              }  
            }
					}

          // var creditMemos = _.find(params, { customerid: String(customer.internalid.value) });
          // log.audit('customer', customer);
          // log.audit('creditMemos', JSON.stringify(creditMemos));
          // if (creditMemos) {
          //   creditMemos = creditMemos.transactions;
          //   for (var z = 0; z < creditMemos.length; z++) {
          //     var cm = creditMemos[z];
          //     log.audit('cm', JSON.stringify(cm));
          //     if (cm.type=='Credit Memo') {
          //       var pmtInvoiceInfoNode = addNodeFromParentNode(xmlDoc, pmtDetailsNode, 'InvoiceInfo');
          //       pmtInvoiceInfoNode.setAttribute({ name: 'InvoiceType', value: 'CM' }); //Always
          //       pmtInvoiceInfoNode.setAttribute({ name: 'InvoiceNum', value: cm.tranid });
                
          //       pmtInvoiceInfoNode.setAttribute({ name: 'TotalCurAmt', value: Number(cm.amount).toFixed(2) });
          //       pmtInvoiceInfoNode.setAttribute({ name: 'NetCurAmt', value: Number(cm.amount).toFixed(2) });
    
          //       var effDate = ['DAC', 'CHK', 'MTS', 'ACH', 'CCR'];
          //       if (_.includes(effDate, paymentMethod)) {
          //         var trandate = moment(cm.trandate).format('YYYY-MM-DD');
          //         log.audit('trandate', trandate);
          //         pmtInvoiceInfoNode.setAttribute({ name: 'EffDt', value: trandate });
          //       }  
          //     }
          //   }  
          // }

          var creditMemos = lib.getCreditMemosFromInvoices(invoicesIncluded);
          log.audit('invoicesIncluded', invoicesIncluded);
          log.audit('creditMemos', JSON.stringify(creditMemos));
          if (creditMemos) {
            // creditMemos = creditMemos.transactions;
            for (var z = 0; z < creditMemos.length; z++) {
              var cm = creditMemos[z];
              log.audit('cm', JSON.stringify(cm));
              var pmtInvoiceInfoNode = addNodeFromParentNode(xmlDoc, pmtDetailsNode, 'InvoiceInfo');
              pmtInvoiceInfoNode.setAttribute({ name: 'InvoiceType', value: 'CM' }); //Always
              pmtInvoiceInfoNode.setAttribute({ name: 'InvoiceNum', value: cm.tranid.value });
              
              pmtInvoiceInfoNode.setAttribute({ name: 'TotalCurAmt', value: Number(cm.amount.value).toFixed(2) });
              pmtInvoiceInfoNode.setAttribute({ name: 'NetCurAmt', value: Number(cm.amount.value).toFixed(2) });
  
              var effDate = ['DAC', 'CHK', 'MTS', 'ACH', 'CCR'];
              if (_.includes(effDate, paymentMethod)) {
                var trandate = moment(cm.trandate.value).format('YYYY-MM-DD');
                log.audit('trandate', trandate);
                pmtInvoiceInfoNode.setAttribute({ name: 'EffDt', value: trandate });
              }  
            }  
          }

				}
				log.debug('after 9', paymentMethod);
				// END: PmtDetail


				//10. DocDelivery
				if (_.includes(sectionDocDelivery, paymentMethod)) {
					// START: DocDelivery
					var docDeliveryNode = addNodeFromParentNode(xmlDoc, pmtRecNode, 'DocDelivery');
					if (lib.utils.isNotEmpty(customer.custentity_pmp_biller_id.text)) {
						addTextNodeFromParentNode(xmlDoc, docDeliveryNode, 'EDDBillerID', customer.custentity_pmp_biller_id.text);
					} else if (lib.utils.isNotEmpty(accountData) && lib.utils.isNotEmpty(accountData.custrecord_acct_map_pmp_biller_id.value)) {
						addTextNodeFromParentNode(xmlDoc, docDeliveryNode, 'EDDBillerID', accountData.custrecord_acct_map_pmp_biller_id.value);
					}

					var fileOutNode = addNodeFromParentNode(xmlDoc, docDeliveryNode, 'FileOut');

					if (lib.utils.isNotEmpty(vendorPaymentInfo) && lib.utils.isNotEmpty(vendorPaymentInfo.custrecord_dac_pmp_file_type.text))
						addTextNodeFromParentNode(xmlDoc, fileOutNode, 'FileType', vendorPaymentInfo.custrecord_dac_pmp_file_type.text);

					if (lib.utils.isNotEmpty(vendorPaymentInfo) && lib.utils.isNotEmpty(vendorPaymentInfo.custrecord_dac_pmp_file_format.text))
						addTextNodeFromParentNode(xmlDoc, fileOutNode, 'FileFormat', vendorPaymentInfo.custrecord_dac_pmp_file_format.text);

					var deliveryNode = addNodeFromParentNode(xmlDoc, fileOutNode, 'Delivery');

					if (lib.utils.isNotEmpty(vendorPaymentInfo) && lib.utils.isNotEmpty(vendorPaymentInfo.custrecord_dac_pmp_delivery_type.text))
						addTextNodeFromParentNode(xmlDoc, deliveryNode, 'DeliveryType', vendorPaymentInfo.custrecord_dac_pmp_delivery_type.text);

					if (lib.utils.isNotEmpty(customer.custentity_pmp_dac_delivery_contact_name.value))
						addTextNodeFromParentNode(
							xmlDoc,
							deliveryNode,
							'DeliveryContactName',
							customer.custentity_pmp_dac_delivery_contact_name.value
						);

					if (lib.utils.isNotEmpty(customer.custentity_pmp_dac_delivery_email_addres.value))
						addTextNodeFromParentNode(
							xmlDoc,
							deliveryNode,
							'DeliveryEmailAddress',
							customer.custentity_pmp_dac_delivery_email_addres.value
						);
					// // END: DocDelivery
				}
				log.debug('after 10', '');

				//11. CurrAmt Section
				if (_.includes(sectionCurrAmt, paymentMethod)) {
					var NetCurAmt = Math.abs(Number(customerPayment.amount.value)).toFixed(2);
					addTextNodeFromParentNode(xmlDoc, pmtRecNode, 'CurAmt', NetCurAmt); //confirm with Al.
				}
			}

			log.audit(
				'Details',
				JSON.stringify({
					PmtRecCount: paymentsData.length,
					pmtRecTotal: pmtRecTotal,
					pmtRecTotalDue: pmtRecTotalDue,
				})
			);
		} catch (e) {
			log.error('message', e.message);
		}

		fileNode.setAttribute({ name: 'PmtRecCount', value: String(paymentsData.length) });

		if (isNaN(pmtRecTotal) || pmtRecTotal == 0) {
			pmtRecTotal = pmtRecTotalDue;
		}

		fileNode.setAttribute({ name: 'PmtRecTotal', value: Math.abs(pmtRecTotal).toFixed(2) }); //no math abs

		var fileCtrlNumber = moment().format('YYMMDDmmss');
		var fileInfoGrpNode = addNodeFromParentNode(xmlDoc, fileNode, 'FileInfoGrp');
		fileInfoGrpNode.setAttribute({ name: 'FileDate', value: currDate });
		fileInfoGrpNode.setAttribute({ name: 'FileControlNumber', value: 'FILE' + pad(fileCtrlNumber, 4) });

		log.audit('createXMLDocument-End', xmlDoc);
		return xmlDoc;
	}

	return {
		processAndSendXMLFile: processAndSendXMLFile,
    processAndSendNACHAFile: processAndSendNACHAFile,
		createXMLDocumentOld: createXMLDocumentOld,
	};
});
