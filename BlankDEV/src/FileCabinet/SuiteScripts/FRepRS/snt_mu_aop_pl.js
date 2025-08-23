/**
 * @NApiVersion 2.x
 * @NScriptType MassUpdateScript
 * @NModuleScope SameAccount
 */
define([ 'N/record' ],

function(record) {

	/**
	 * Definition of Mass Update trigger point.
	 *
	 * @param {Object} params
	 * @param {string} params.type - Record type of the record being processed by the mass update
	 * @param {number} params.id - ID of the record being processed by the mass update
	 *
	 * @since 2016.1
	 */
	function each(params) {
		var recMass = record.load({
			type : params.type,
			id : params.id
		});

		var accNum = recMass.getValue('acctnumber');
		if (accNum.length > 3) {
			var accAop = "";
			var accFit = false;
			if (accNum.indexOf("600") == 0) {
				accFit = true;
				accAop = "1003";
			}
			if ((!accFit) && (accNum.indexOf("601") == 0)) {
				accFit = true;
				accAop = "1004";
			}			
			if ((!accFit) && (accNum.indexOf("602") == 0)) {
				accFit = true;
				accAop = "1005";
			}
			if ((!accFit) && (accNum.indexOf("603") == 0)) {
				accFit = true;
				accAop = "1006";
			}			
			if ((!accFit) && (accNum.indexOf("604") == 0)) {
				accFit = true;
				accAop = "1007";
			}			
			if ((!accFit) && (accNum.indexOf("605") == 0)) {
				accFit = true;
				accAop = "1008";
			}			
			if ((!accFit) && (accNum.indexOf("610") == 0)) {
				accFit = true;
				accAop = "1010";
			}			
			if ((!accFit) && (accNum.indexOf("611") == 0)) {
				accFit = true;
				accAop = "1011";
			}			
			if ((!accFit) && (accNum.indexOf("612") == 0)) {
				accFit = true;
				accAop = "1012";
			}			
			if ((!accFit) && (accNum.indexOf("613") == 0)) {
				accFit = true;
				accAop = "1013";
			}			
			if ((!accFit) && (accNum.indexOf("614") == 0)) {
				accFit = true;
				accAop = "1014";
			}			
			if ((!accFit) && (accNum.indexOf("615") == 0)) {
				accFit = true;
				accAop = "1015";
			}			
			if ((!accFit) && (accNum.indexOf("64") == 0)) {
				accFit = true;
				accAop = "1016";
			}			
			if ((!accFit) && (accNum.indexOf("65") == 0)) {
				accFit = true;
				accAop = "1017";
			}			
			if ((!accFit) && (accNum.indexOf("50") == 0)) {
				accFit = true;
				accAop = "1019";
			}			
			
			//Troskovi
			if ((!accFit) && (accNum.indexOf("50") == 0)) {
				accFit = true;
				accAop = "1019";
			}			
			if ((!accFit) && (accNum.indexOf("62") == 0)) {
				accFit = true;
				accAop = "1020";
			}			
			if ((!accFit) && (accNum.indexOf("630") == 0)) {
				accFit = true;
				accAop = "1021";
			}			
			if ((!accFit) && (accNum.indexOf("631") == 0)) {
				accFit = true;
				accAop = "1022";
			}			
			if ((!accFit) && (accNum.indexOf("513") == 0)) {
				accFit = true;
				accAop = "1024";
			}			
			if ((!accFit) && (accNum.indexOf("51") == 0)) {
				accFit = true;
				accAop = "1023";
			}			
			if ((!accFit) && (accNum.indexOf("52") == 0)) {
				accFit = true;
				accAop = "1025";
			}											
		
			var tmpObj = {
					"S530" : "1026",
					"S531" : "1026",
					"S532" : "1026",
					"S533" : "1026",
					"S534" : "1026",
					"S535" : "1026",
					"S536" : "1026",
					"S537" : "1026",
					"S538" : "1026",
					"S539" : "1026",					
					"S540" : "1027",
					"S541" : "1028",
					"S542" : "1028",
					"S543" : "1028",
					"S544" : "1028",
					"S545" : "1028",
					"S546" : "1028",
					"S547" : "1028",
					"S548" : "1028",
					"S549" : "1028",					
					"S550" : "1029",
					"S551" : "1029",
					"S552" : "1029",
					"S553" : "1029",
					"S554" : "1029",
					"S555" : "1029",
					"S556" : "1029",
					"S557" : "1029",
					"S558" : "1029",
					"S559" : "1029",					
					"S660" : "1034",
					"S661" : "1035",
					"S665" : "1036",
					"S669" : "1037",
					"S662" : "1038",
					"S663" : "1039",
					"S664" : "1039",
					"S560" : "1042",
					"S561" : "1043",
					"S565" : "1044",
					"S566" : "1045",
					"S569" : "1045",
					"S562" : "1046",
					"S563" : "1047",
					"S564" : "1047"
			};
			var tmpSint = "S" + accNum.substring(0,3);
			if ((!accFit) &&(tmpObj[tmpSint])){
				accFit = true;
				accAop = tmpObj[tmpSint];
			}
			if (accFit) {
				recMass.setText({
					"fieldId" : 'custrecord_acc_aop_pl_code',
					"text" : accAop
				});
				recMass.save();
			}
		}
	}

	return {
		each : each
	};

});
