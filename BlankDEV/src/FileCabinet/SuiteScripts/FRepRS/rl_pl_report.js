/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 */
define(
		[ 'N/record', 'N/search', 'N/file', 'N/format', './fi_helper.js','/SuiteScripts/RSMLib/lodash.min' ],
		function(record, search, file, format, fi_helper, _) {

			/**
			 * Function called upon sending a POST request to the RESTlet.
			 * 
			 * @param {string |
			 *            Object} requestBody - The HTTP request body; request
			 *            body will be passed into function as a string when
			 *            request Content-Type is 'text/plain' or parsed into an
			 *            Object when request Content-Type is 'application/json'
			 *            (in which case the body must be a valid JSON)
			 * @returns {string | Object} HTTP response body; return string when
			 *          request Content-Type is 'text/plain'; return Object when
			 *          request Content-Type is 'application/json'
			 * @since 2015.2
			 */

			/*
			 * HELPER FUNCTIONS
			 */
			function deleteOldLines(lcId) {
				var sold = search.create({
					'type' : 'customrecord_snt_pl_report_lines',
					filters : [ 'custrecord_snt_pl_report_parent', 'is', lcId ]
				});
				var rold = sold.run().each(function(pl_line) {
					log.debug('Line', pl_line.id);
					record['delete']({
						type : 'customrecord_snt_pl_report_lines',
						id : pl_line.id
					})
					return true;
				});

			}

			/*
			 * Reset svih linija - brisanje postojecih - dodavanje novih sa 0.00
			 * vrednoscu
			 */
			function _pl_init_lines(cId) {
				deleteOldLines(cId);

				var rPLR = record.load({
					type : 'customrecord_snt_pl_report',
					id : cId,
					isDynamic : true
				});

				var srch = search.create({
					'type' : 'customrecord_snt_aop_pl_code',
					columns : [ 'name' ]
				});

				var result = srch.run().each(function(rowdata) {

					rPLR.selectNewLine({
						sublistId : 'recmachcustrecord_snt_pl_report_parent'
					});
					rPLR.setCurrentSublistValue({
						sublistId : 'recmachcustrecord_snt_pl_report_parent',
						fieldId : 'custrecord_snt_pl_lines_code',
						value : rowdata.id
					});
					var nula = 0.00;
					rPLR.setCurrentSublistValue({
						sublistId : 'recmachcustrecord_snt_pl_report_parent',
						fieldId : 'custrecord_snt_pl_lines_cy_calc',
						value : nula.toFixed(2)
					});
					rPLR.setCurrentSublistValue({
						sublistId : 'recmachcustrecord_snt_pl_report_parent',
						fieldId : 'custrecord_snt_pl_lines_py_xml',
						value : nula.toFixed(2)
					});
					rPLR.commitLine({
						sublistId : 'recmachcustrecord_snt_pl_report_parent'
					});
					return true;
				});
				rPLR.save();
			}

			function _pl_calc_lines(cId) {

				var hJson = []; // JSON helper

				var rPLR = record.load({
					type : 'customrecord_snt_pl_report',
					id : cId,
					isDynamic : true
				});

				var sAOP = search.load({
					id : 'customsearch_snt_aop_pl_summary'
				});

				/*
				 * Pokretanje Save Search koji vraca bilas uspeha iz NetSuite po
				 * kodovima Prebacivanje u JSON koji se prenosi u objekat
				 * fi_helper
				 */

				var datOd = format.format({
					value : rPLR.getValue("custrecord_snt_pl_lines_date_from"),
					type : format.Type.DATE
				});
				var datDo = format.format({
					value : rPLR.getValue("custrecord_snt_pl_lines_date_to"),
					type : format.Type.DATE
				});

				sAOP.filters.push(search.createFilter({
					name : 'trandate',
					operator : search.Operator.WITHIN,
					values : [ datOd, datDo ]
				}));

				sAOP
						.run()
						.each(
								function(rowData) {
									var ad = rowData.getAllValues();
									var sCode = ad['GROUP(account.custrecord_acc_aop_pl_code)'][0]['value'];
									var sCodeText = ad['GROUP(account.custrecord_acc_aop_pl_code)'][0]['text'];
									var sDebit = ad['SUM(debitamount)'];
									var sCredit = ad['SUM(creditamount)'];

									hJson.push({
										"aopCodeValue" : sCode,
										"aopCodeText" : sCodeText,
										"aopDebit" : sDebit,
										"aopCredit" : sCredit,
										"aopValue" : 0.00
									});
									return true;
								});

				fi_helper.setSS_json(hJson);

				/*
				 * Ucitavanje PL Report record, zajedno sa LINES sublistom
				 * copySStoPL - ucitava sve linije iz PL Report Lines u JSON
				 * Array - prebacuje izracunate vrednosti (sume) iz prometa u
				 * JSON Array -
				 */

				fi_helper.copySStoPL(rPLR);

				/*
				 * Obrada zbirnih polja ... ovo posle prbaciti u fi_helper
				 * funkciju
				 */

				var tmpSum = fi_helper.getAop('1003', 'cy_calc');
				tmpSum = tmpSum + fi_helper.getAop('1004', 'cy_calc');
				tmpSum = tmpSum + fi_helper.getAop('1005', 'cy_calc');
				tmpSum = tmpSum + fi_helper.getAop('1006', 'cy_calc');
				tmpSum = tmpSum + fi_helper.getAop('1007', 'cy_calc');
				tmpSum = tmpSum + fi_helper.getAop('1008', 'cy_calc');

				fi_helper.setAop('1002', 'cy_calc', tmpSum);

				var tmpSum = fi_helper.getAop('1010', 'cy_calc');
				tmpSum = tmpSum + fi_helper.getAop('1011', 'cy_calc');
				tmpSum = tmpSum + fi_helper.getAop('1012', 'cy_calc');
				tmpSum = tmpSum + fi_helper.getAop('1013', 'cy_calc');
				tmpSum = tmpSum + fi_helper.getAop('1014', 'cy_calc');
				tmpSum = tmpSum + fi_helper.getAop('1015', 'cy_calc');

				fi_helper.setAop('1009', 'cy_calc', tmpSum);

				var tmpSum = fi_helper.getAop('1002', 'cy_calc');
				var tmpSum = tmpSum + fi_helper.getAop('1009', 'cy_calc');
				var tmpSum = tmpSum + fi_helper.getAop('1016', 'cy_calc');
				var tmpSum = tmpSum + fi_helper.getAop('1017', 'cy_calc');

				fi_helper.setAop('1001', 'cy_calc', tmpSum);
				var TotalIncome = tmpSum;

				var tmpSum = fi_helper.getAop('1019', 'cy_calc');
				tmpSum = tmpSum - fi_helper.getAop('1020', 'cy_calc');
				tmpSum = tmpSum - fi_helper.getAop('1021', 'cy_calc');
				tmpSum = tmpSum + fi_helper.getAop('1022', 'cy_calc');
				tmpSum = tmpSum + fi_helper.getAop('1023', 'cy_calc');
				tmpSum = tmpSum + fi_helper.getAop('1024', 'cy_calc');
				tmpSum = tmpSum + fi_helper.getAop('1025', 'cy_calc');
				tmpSum = tmpSum + fi_helper.getAop('1026', 'cy_calc');
				tmpSum = tmpSum + fi_helper.getAop('1027', 'cy_calc');
				tmpSum = tmpSum + fi_helper.getAop('1028', 'cy_calc');
				tmpSum = tmpSum + fi_helper.getAop('1029', 'cy_calc');

				fi_helper.setAop('1018', 'cy_calc', tmpSum);
				var TotalExpense = tmpSum;

				// 1001-1018 / 1018-1001
				if (TotalIncome > TotalExpense) {
					fi_helper.setAop('1030', 'cy_calc', TotalIncome
							- TotalExpense);
					fi_helper.setAop('1031', 'cy_calc', 0);
				} else {
					fi_helper.setAop('1031', 'cy_calc', TotalExpense
							- TotalIncome);
					fi_helper.setAop('1030', 'cy_calc', 0);
				}

				// 1033 = 1034..1037
				var tmpSum = fi_helper.getAop('1034', 'cy_calc');
				tmpSum = tmpSum - fi_helper.getAop('1035', 'cy_calc');
				tmpSum = tmpSum - fi_helper.getAop('1036', 'cy_calc');
				tmpSum = tmpSum + fi_helper.getAop('1037', 'cy_calc');
				fi_helper.setAop('1033', 'cy_calc', tmpSum);

				// 1032 = 1033..
				var tmpSum = fi_helper.getAop('1033', 'cy_calc');
				tmpSum = tmpSum + fi_helper.getAop('1038', 'cy_calc');
				tmpSum = tmpSum + fi_helper.getAop('1039', 'cy_calc');
				fi_helper.setAop('1032', 'cy_calc', tmpSum);

				// 1041
				var tmpSum = fi_helper.getAop('1042', 'cy_calc');
				tmpSum = tmpSum + fi_helper.getAop('1043', 'cy_calc');
				tmpSum = tmpSum + fi_helper.getAop('1044', 'cy_calc');
				tmpSum = tmpSum + fi_helper.getAop('1045', 'cy_calc');
				fi_helper.setAop('1041', 'cy_calc', tmpSum);

				// 1040
				var tmpSum = fi_helper.getAop('1041', 'cy_calc');
				tmpSum = tmpSum + fi_helper.getAop('1046', 'cy_calc');
				tmpSum = tmpSum + fi_helper.getAop('1047', 'cy_calc');
				fi_helper.setAop('1040', 'cy_calc', tmpSum);

				// 1048,1049
				var vp1 = fi_helper.getAop('1032', 'cy_calc');
				var vp2 = fi_helper.getAop('1040', 'cy_calc');
				if (vp1 > vp2) {
					fi_helper.setAop('1048', 'cy_calc', vp1 - vp2);
					fi_helper.setAop('1049', 'cy_calc', 0);
				} else {
					fi_helper.setAop('1048', 'cy_calc', 0);
					fi_helper.setAop('1049', 'cy_calc', vp2 - vp1);
				}

				// 1054,1055
				var tmpSum = fi_helper.getAop('1030', 'cy_calc');
				tmpSum = tmpSum - fi_helper.getAop('1031', 'cy_calc');
				tmpSum = tmpSum + fi_helper.getAop('1048', 'cy_calc');
				tmpSum = tmpSum - fi_helper.getAop('1049', 'cy_calc');
				tmpSum = tmpSum + fi_helper.getAop('1050', 'cy_calc');
				tmpSum = tmpSum - fi_helper.getAop('1051', 'cy_calc');
				tmpSum = tmpSum + fi_helper.getAop('1052', 'cy_calc');
				tmpSum = tmpSum - fi_helper.getAop('1053', 'cy_calc');

				if (tmpSum > 0) {
					fi_helper.setAop('1054', 'cy_calc', tmpSum);
					fi_helper.setAop('1055', 'cy_calc', 0);
				} else {
					fi_helper.setAop('1055', 'cy_calc', -tmpSum);
					fi_helper.setAop('1054', 'cy_calc', 0);
				}

				// 1058,1059
				var tmpSum = fi_helper.getAop('1054', 'cy_calc');
				tmpSum = tmpSum - fi_helper.getAop('1055', 'cy_calc');
				tmpSum = tmpSum + fi_helper.getAop('1056', 'cy_calc');
				tmpSum = tmpSum - fi_helper.getAop('1057', 'cy_calc');

				if (tmpSum > 0) {
					fi_helper.setAop('1058', 'cy_calc', tmpSum);
					fi_helper.setAop('1059', 'cy_calc', 0);
				} else {
					fi_helper.setAop('1059', 'cy_calc', -tmpSum);
					fi_helper.setAop('1058', 'cy_calc', 0);
				}

				// (1058 - 1059 - 1060 - 1061 + 1062 - 1063)
				var tmpSum = fi_helper.getAop('1058', 'cy_calc');
				tmpSum = tmpSum - fi_helper.getAop('1059', 'cy_calc');
				tmpSum = tmpSum - fi_helper.getAop('1060', 'cy_calc');
				tmpSum = tmpSum - fi_helper.getAop('1061', 'cy_calc');
				tmpSum = tmpSum + fi_helper.getAop('1062', 'cy_calc');
				tmpSum = tmpSum - fi_helper.getAop('1063', 'cy_calc');
				if (tmpSum > 0) {
					fi_helper.setAop('1064', 'cy_calc', tmpSum);
					fi_helper.setAop('1065', 'cy_calc', 0);
				} else {
					fi_helper.setAop('1065', 'cy_calc', -tmpSum);
					fi_helper.setAop('1064', 'cy_calc', 0);
				}

				fi_helper.copyCalcToXML();
				var xmlArr = fi_helper.getPlLines();

				for (var i = 0; i < xmlArr.length; i++) {
					rPLR.selectLine({
						sublistId : 'recmachcustrecord_snt_pl_report_parent',
						line : xmlArr[i]['line']
					})
					rPLR.setCurrentSublistValue({
						sublistId : 'recmachcustrecord_snt_pl_report_parent',
						fieldId : 'custrecord_snt_pl_lines_cy_calc',
						value : xmlArr[i]['cy_calc']
					});
					rPLR.setCurrentSublistValue({
						sublistId : 'recmachcustrecord_snt_pl_report_parent',
						fieldId : 'custrecord_snt_pl_lines_cy_xml',
						value : xmlArr[i]['cy_xml']
					});
					rPLR.commitLine({
						sublistId : 'recmachcustrecord_snt_pl_report_parent'
					});
				}
				rPLR.save();
			}

			function _pl_xml_file(cId) {
				var rPLR = record.load({
					type : 'customrecord_snt_pl_report',
					id : cId,
					isDynamic : true
				});

				fi_helper.copySublistToPL(rPLR);
				var myXML = fi_helper.generateXML();

			}

			function doPost(requestBody) {

				var cId = requestBody.idPLR;
				var cAct = requestBody.action;
				var retVal = {
					"result" : "Error"
				};

				if (cAct == "init_lines") {
					_pl_init_lines(cId);
					retVal = {
						"result" : 'ok'
					}
				}
				if (cAct == "calc_lines") {
					_pl_calc_lines(cId);
					retVal = {
						"result" : 'ok'
					}
				}
				if (cAct == "xml_file") {
					_pl_xml_file(cId);
					retVal = {
						"result" : 'ok'
					}
				}
				return retVal;
			}

			function doDelete(requestParams) {

			}
			function doGet(requestParams) {

			}

			function doPut(requestBody) {

			}

			return {
				// 'get': doGet,
				// put: doPut,
				// 'delete': doDelete,
				post : doPost
			};

		});
