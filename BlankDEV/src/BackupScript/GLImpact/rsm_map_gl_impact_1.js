/**
 * Module Description
 * 
 * Version Date Author Remarks 1.00 06 Oct 2020 ZoranRoncevic
 * 
 */
function customizeGlImpact(transactionRecord, standardLines, customLines, book) {
	// Specify the record type and the saved search ID
	var transactionRecordType = transactionRecord.getRecordType();

	function findKupac(srchArray, value) {
		var retVal = false;
		for (var i = 0; i < srchArray.length; i++) {
			if (value == srchArray[i]["kupac"]) {
				retVal = true;
			}
		}
		return retVal;
	}

	function mapPrihod(srchArray, kupac, saRacuna) {
		var retVal = {
			"trebaMap" : false,
			"naRacun" : ''

		};

		for (var i = 0; i < srchArray.length; i++) {
			if ((srchArray[i]["kupac"] == kupac) && (srchArray[i]["saRacuna"] == saRacuna)) {
				retVal = {
					"trebaMap" : true,
					"naRacun" : srchArray[i]["naRacun"]
				};
			}
		}
		return retVal;
	}

	if ((transactionRecordType === 'invoice') || (transactionRecordType === 'creditmemo')) {

		nlapiLogExecution('DEBUG', 'Entry :', 'RSM_MAP_INCOME 2020.10.08.04');

		var mapAccList = [];

		var searchresults = nlapiSearchRecord("customrecord_rsm_map_income", null, [], [ new nlobjSearchColumn("name").setSort(false), new nlobjSearchColumn("id"), new nlobjSearchColumn("custrecord_konto_kod_customera"),
				new nlobjSearchColumn("custrecord_sa_racuna"), new nlobjSearchColumn("custrecord_na_racun") ]);

		for (var i = 0; searchresults != null && i < searchresults.length; i++) {
			var cRecord = searchresults[i];

			var obj = {};
			obj.kupac = cRecord.getValue("custrecord_konto_kod_customera");
			obj.saRacuna = parseInt(cRecord.getValue("custrecord_sa_racuna"));
			obj.naRacun = parseInt(cRecord.getValue("custrecord_na_racun"));
			mapAccList.push(obj);

		}

		/*
		 * 
		 * Check if Account Receivable exists in MAP Custom Record ... Store
		 * that account in object for the next step
		 * 
		 */
		var custObj = {};
		custObj.customerARFound = false;
		custObj.customerAR = -1;

		for (var i = 0; i < standardLines.getCount(); i++) {
			var currLineAcc = standardLines.getLine(i).getAccountId();
			if (findKupac(mapAccList, currLineAcc)) {
				custObj.customerARFound = true;
				custObj.customerAR = currLineAcc;
				nlapiLogExecution('DEBUG', 'Found customer acct :', currLineAcc);
			}
			;
		}

		nlapiLogExecution('DEBUG', 'Found :', custObj.customerARFound);

		if (custObj.customerARFound) {
			// nlapiLogExecution('DEBUG', 'Step :', 'customerARFound');
			for (var j = 0; j < standardLines.getCount(); j++) {
				var currLineAcc = standardLines.getLine(j).getAccountId();
				var dbgdata = {
					"lineid" : j,
					"currLineAcc" : currLineAcc,
					"isPosting" : standardLines.getLine(j).isPosting(),
					"creditAmount" : standardLines.getLine(j).getCreditAmount(),
					"debitAmount" : standardLines.getLine(j).getDebitAmount(),
					"entityId" : standardLines.getLine(j).getEntityId(),
					"departmentId" : standardLines.getLine(j).getDepartmentId(),
					"locationId" : standardLines.getLine(j).getLocationId(),
					"classId" : standardLines.getLine(j).getClassId()
				}

				// nlapiLogExecution('DEBUG', 'currLineAcc
				// :',JSON.stringify(dbgdata));

				var checkMap = mapPrihod(mapAccList, custObj.customerAR, currLineAcc);

				if (checkMap.trebaMap) {
					// "storno"
					var newLine = customLines.addNewLine();
					newLine.setAccountId(currLineAcc);
					newLine.setEntityId(standardLines.getLine(j).getEntityId());
					newLine.setDepartmentId(standardLines.getLine(j).getDepartmentId());
					newLine.setLocationId(standardLines.getLine(j).getLocationId());
					newLine.setClassId(standardLines.getLine(j).getClassId());

					if (standardLines.getLine(j).getCreditAmount() > 0) {
						newLine.setDebitAmount(standardLines.getLine(j).getCreditAmount());
					}
					if (standardLines.getLine(j).getDebitAmount() > 0) {
						newLine.setCreditAmount(standardLines.getLine(j).getDebitAmount());
					}
					
					newLine.setMemo("Prenos na konto prihoda");

					// "preknjizeno
					var newLine = customLines.addNewLine();
					newLine.setAccountId(checkMap.naRacun);
					newLine.setEntityId(standardLines.getLine(j).getEntityId());
					newLine.setDepartmentId(standardLines.getLine(j).getDepartmentId());
					newLine.setLocationId(standardLines.getLine(j).getLocationId());
					newLine.setClassId(standardLines.getLine(j).getClassId());

					//newLine.setCreditAmount(standardLines.getLine(j).getCreditAmount());
					if (standardLines.getLine(j).getCreditAmount() > 0) {
						newLine.setCreditAmount(standardLines.getLine(j).getCreditAmount());
					}
					if (standardLines.getLine(j).getDebitAmount() > 0) {
						newLine.setDebitAmount(standardLines.getLine(j).getDebitAmount());
					}					
					newLine.setMemo("Donos sa konta prihoda");
				}
				;
			}
		}

		// nlapiLogExecution('DEBUG', 'GL Impact EXIT :', 'RSM_MAP_INCOME');
	}

}
