/**
 * @NApiVersion 2.0
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
define(
		[ 'N/record', 'N/runtime', 'N/query', 'N/task', 'N/format', './util_parsers', 'N/search' ],

		function(record, runtime, query, task, format, util_parsers, searchModule) {

			/**
			 * Marks the beginning of the Map/Reduce process and generates input
			 * data.
			 * 
			 *
			 * @return {Array|Object|Search|RecordRef} inputSummary
			 * @since 2015.1
			 */

			function getInputData() {

				var scriptObj = runtime.getCurrentScript();
				var masterId = scriptObj.getParameter({"name" : 'custscript_rsm_bstmt_mr_param1'});
				/**
				 *
				 * @type {Object}
				 * @property {string} parser
				 *
				 */
				var myOptions;

				myOptions = {};

				/**
				 *
				 * @type {Object} look
				 * @property {number} custrecord_rsm_bstmt_file
				 * @property {string} custrecord_rsm_bstmt_parser.text - from custom List
				 * @property {number} custrecord_rsm_bstmt_subsidiary
				 *
				 */
				var look = searchModule.lookupFields({
					type: 'customrecord_snt_bank_statement',
					id: masterId,
					columns : ['custrecord_rsm_bstmt_file', 'custrecord_rsm_bstmt_parser', 'custrecord_rsm_bstmt_subsidiary']
				});
				//log.debug({title:"Lookup Fields", details:look});

				myOptions.fileId = look.custrecord_rsm_bstmt_file[0].value;
				myOptions.parser = look.custrecord_rsm_bstmt_parser[0].text;
				myOptions.subsidiary = look.custrecord_rsm_bstmt_subsidiary[0].value;
				//log.debug({title: "myOptions",details: myOptions});

				var outputArray = [];

				if (myOptions.parser === 'INTESA') {
					log.debug({
						title:"Step",
						details: "INTESA Parser"
					});
					outputArray = util_parsers.parserIntesa(myOptions);
					//log.debug({title: "Intesa Array",	details: outputArray});
				}
				if (myOptions.parser === 'HALCOM') {
					log.debug({
						title:"Step",
						details: "HALCOM Parser"
					});
					outputArray = util_parsers.parserHalcom(myOptions);
					//log.debug({	title: "Intesa Array", details: outputArray });
				}
				log.debug({"title":"Step : ", "details":"getInputData finished"});

				// check is there dtPosted <> masterDate
				//var masterDate = recMaster.getValue("custrecord_rsm_bstmt_trandate");

				return outputArray;
			}

			/**
			 * MAP function
			 */
			
			function map(context) {

				var resData = JSON.parse(context.value);
				var BdpAct = util_parsers.BdpActions.load();

				try {
					if (resData.transactionMappingKey === 'credit') {

						var data = {
							index : resData.index,
							'custrecord_rsm_bdp_bank_acct_p' : resData.bankAccountId,
							'custrecord_rsm_bdp_payee_p' : resData.payee,
							'custrecord_rsm_bdp_amount_p' : resData.amount,
							'custrecord_rsm_bdp_memo_p' : resData.memo,
							'custrecord_rsm_bdp_model1' : resData.model_1,
							'custrecord_rsm_bdp_model2' : resData.model_2,
							'custrecord_rsm_bdp_pozivnabroj1' : resData.poziviNaBroj1,
							'custrecord_rsm_bdp_pozivnabroj2' : resData.poziviNaBroj2,
							'custrecord_rsm_bdp_linedate' : resData.dtPosted,
							'custrecord_rsm_bdp_bankref' : resData.bankRef,
							'custrecord_rsm_bdp_purpose' : resData.purpose,
							'custrecord_rsm_bdp_action' : BdpAct.getActionID('UNDEFINED')
						// ACTION 1 = UNDEFINED
						}

						var l_found;
						l_found = 0;
						var srchBroj = resData.poziviNaBroj1;
						var srchSub = resData.subsidiary;

						var srchData = {};
						if (srchBroj) {
							srchData = util_parsers.lookupPNBO(srchBroj,srchSub);
							l_found = srchData.isFound;
							if (srchData.isFound === 1) {
								data.custrecord_rsm_bdp_action = srchData.custrecord_rsm_bdp_action; // PAYMENT
								data.custrecord_rsm_bdp_customer = srchData.custrecord_rsm_bdp_customer;
								data.custrecord_rsm_bdp_transaction_recog = srchData.custrecord_rsm_bdp_transaction_recog;
							}

						}
						
						if (l_found === 0) {
							
							srchData = util_parsers.lookupBankID(resData.bankAccountId);
							if (srchData.isFound === 1) {
								data.custrecord_rsm_bdp_customer = srchData.custrecord_rsm_bdp_customer;
							}

						}

						context.write({
							key : resData.index,
							value : data
						});

					}
				} catch (e) {
					log.error({"title":'MAP error', "details":e.message});
				}

			}

			function reduce(context) {

				// log.debug("Step : ", "reduce entry : key =" + context.key);
				context.write({
					key : context.key,
					value : JSON.parse(context.values[0])
				});
			}

			/**
			 * Executes when the summarize entry point is triggered and applies
			 * to the result set.
			 * 
			 * @param {Summary}  summary - Holds statistics regarding the execution of
			 *            a map/reduce script
			 * @param {Object} summary.output
			 *
			 * @since 2015.1
			 */
			function summarize(summary) {

				log.debug({"title":"Step : ", "details":"summarize entry"});
				var scriptObj = runtime.getCurrentScript();
				var masterId = scriptObj.getParameter({"name":'custscript_rsm_bstmt_mr_param1'});

				var recMaster = record.load({
					type : "customrecord_snt_bank_statement",
					id : masterId,
					isDynamic : true
				});

				var masterDate = recMaster.getValue("custrecord_rsm_bstmt_trandate");

				// log.debug("Step : output : ", summary.output);

				summary.output.iterator().each(function(key, value) {
					// log.debug("Step : ", "summary iterator");

					var transaction = JSON.parse(value);

					/* AKO ZATREBA
					log.debug({"title":"summarize lineDate : ", "details":format.parse({
						value : transaction.custrecord_rsm_bdp_linedate,
						type : format.Type.DATE,
							timezone : format.Timezone.EUROPE_BUDAPEST
					})});
					log.debug({"title":"summarize masterDate : ", "details":masterDate});
					log.debug({"title":"summarize TlineDate : ", "details": typeof format.parse({
						value : transaction.custrecord_rsm_bdp_linedate,
						type : format.Type.DATE,
							timezone : format.Timezone.EUROPE_BUDAPEST
					})});
					log.debug({"title":"summarize TmasterDate : ", "details": typeof masterDate});
					*/

					if (format.parse({
						value : transaction.custrecord_rsm_bdp_linedate,
						type : format.Type.DATE,
						timezone : format.Timezone.EUROPE_BUDAPEST
					}).getDate() === masterDate.getDate()) {
						// if (1 == 1) {

						recMaster.selectNewLine({
							sublistId : 'recmachcustrecord_rsm_bdp_parent'
						});

						recMaster.setCurrentSublistValue({
							sublistId : 'recmachcustrecord_rsm_bdp_parent',
							fieldId : 'custrecord_rsm_bdp_bank_acct_p',
							value : transaction.custrecord_rsm_bdp_bank_acct_p
						});

						// custrecord_rsm_bdp_payee_p
						recMaster.setCurrentSublistValue({
							sublistId : 'recmachcustrecord_rsm_bdp_parent',
							fieldId : 'custrecord_rsm_bdp_payee_p',
							value : transaction.custrecord_rsm_bdp_payee_p
						});

						recMaster.setCurrentSublistValue({
							sublistId : 'recmachcustrecord_rsm_bdp_parent',
							fieldId : 'custrecord_rsm_bdp_amount_p',
							value : transaction.custrecord_rsm_bdp_amount_p
						});

						// custrecord_rsm_bdp_memo_p
//						recMaster.setCurrentSublistValue({
//							sublistId : 'recmachcustrecord_rsm_bdp_parent',
//							fieldId : 'custrecord_rsm_bdp_memo_p',
//							value : transaction.custrecord_rsm_bdp_memo_p
//						});

						recMaster.setCurrentSublistValue({
							sublistId : 'recmachcustrecord_rsm_bdp_parent',
							fieldId : 'custrecord_rsm_bdp_model1',
							value : transaction.custrecord_rsm_bdp_model1
						});

						recMaster.setCurrentSublistValue({
							sublistId : 'recmachcustrecord_rsm_bdp_parent',
							fieldId : 'custrecord_rsm_bdp_model2',
							value : transaction.custrecord_rsm_bdp_model2
						});

						recMaster.setCurrentSublistValue({
							sublistId : 'recmachcustrecord_rsm_bdp_parent',
							fieldId : 'custrecord_rsm_bdp_pozivnabroj1',
							value : transaction.custrecord_rsm_bdp_pozivnabroj1
						});

						recMaster.setCurrentSublistValue({
							sublistId : 'recmachcustrecord_rsm_bdp_parent',
							fieldId : 'custrecord_rsm_bdp_pozivnabroj2',
							value : transaction.custrecord_rsm_bdp_pozivnabroj2
						});

						recMaster.setCurrentSublistValue({
							sublistId : 'recmachcustrecord_rsm_bdp_parent',
							fieldId : 'custrecord_rsm_bdp_linedate',
							value : format.parse({
								value : transaction.custrecord_rsm_bdp_linedate,
								type : format.Type.DATE,
								timezone : format.Timezone.EUROPE_BUDAPEST
							})
						});

						recMaster.setCurrentSublistValue({
							sublistId : 'recmachcustrecord_rsm_bdp_parent',
							fieldId : 'custrecord_rsm_bdp_bankref',
							value :  transaction.custrecord_rsm_bdp_bankref
						});
						recMaster.setCurrentSublistValue({
							sublistId : 'recmachcustrecord_rsm_bdp_parent',
							fieldId : 'custrecord_rsm_bdp_purpose',
							value :  transaction.custrecord_rsm_bdp_purpose
						});
						
						if (transaction.custrecord_rsm_bdp_customer) {
							recMaster.setCurrentSublistValue({
								sublistId : 'recmachcustrecord_rsm_bdp_parent',
								fieldId : 'custrecord_rsm_bdp_customer',
								value : transaction.custrecord_rsm_bdp_customer
							});
						}

						if (transaction.custrecord_rsm_bdp_transaction_recog) {
							recMaster.setCurrentSublistValue({
								sublistId : 'recmachcustrecord_rsm_bdp_parent',
								fieldId : 'custrecord_rsm_bdp_transaction_recog',
								value : transaction.custrecord_rsm_bdp_transaction_recog
							});
						}

						recMaster.setCurrentSublistValue({
							sublistId : 'recmachcustrecord_rsm_bdp_parent',
							fieldId : 'custrecord_rsm_bdp_action',
							value : transaction.custrecord_rsm_bdp_action
						// default UNDEFINED!!!
						});

						recMaster.commitLine({
							sublistId : 'recmachcustrecord_rsm_bdp_parent'
						});
					}
					return true;

				});

				recMaster.save();

				log.audit({title:'inputSummary:Usage', details: summary.inputSummary.usage});
				log.audit({title:'mapSummary:Usage', details: summary.mapSummary.usage});
				log.audit({title:'reduceSummary:Usage', details: summary.reduceSummary.usage});
				log.audit({title:'Usage', details: summary.usage});

			}

			return {
				getInputData : getInputData,
				map : map,
				reduce : reduce,
				summarize : summarize
			};

		});
/*
 * select accountnumber ,concat(substr(trim(replace(accountnumber,'-')),1,3)
 * ,concat(lpad(substr(trim(replace(accountnumber,'-')),4,length(trim(replace(accountnumber,'-')))-5),13,'0')
 * ,substr(trim(replace(accountnumber,'-')),length(trim(replace(accountnumber,'-')))-1)))
 * ,concat(concat(concat(concat(substr(trim(replace(accountnumber,'-')),1,3),'-')
 * ,lpad(substr(trim(replace(accountnumber,'-')),4,length(trim(replace(accountnumber,'-')))-5),13,'0')
 * ),'-'),substr(trim(replace(accountnumber,'-')),length(trim(replace(accountnumber,'-')))-1))
 * from customer
 */