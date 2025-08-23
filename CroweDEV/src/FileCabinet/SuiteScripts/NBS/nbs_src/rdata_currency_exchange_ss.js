/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 *
 * Change recipientEmail and authorId variables with account specific ones for
 * email notification in case of import failure
 */

 define([
	 "N/config",
	 "N/email",
	 "N/file",
	 "N/https",
	 "N/log",
	 "N/runtime",
	 "N/search",
	 "N/task",
	 "N/xml",
	 "./util_nbs"]
	 , function(config, email, file, https, log, runtime, search, task, xml,util_nbs) {
	function execute() {

		function getCurrencies(xml, tagName) {
			let currencies = [];
			let elements = xml.getElementsByTagName({
				tagName : tagName
			});

			for (let index = 0; index < elements.length; index++) {
				let currencyObj = {};

				currencyObj.currencyCode = elements[index].getElementsByTagName({
					tagName : "CurrencyCodeAlfaChar",
				})[0].textContent;
				currencyObj.date = elements[index].getElementsByTagName({
					tagName : "Date",
				})[0].textContent;
				currencyObj.middleRate = elements[index].getElementsByTagName({
					tagName : "MiddleRate",
				})[0].textContent;
              	currencyObj.unit = elements[index].getElementsByTagName({
					tagName : "Unit",
				})[0].textContent;
				currencies.push(currencyObj);
			}

			return currencies;
		}

		function createNewDateString(day, month, year) {
			let months = [ {
				Mon : "Jan",
				MONTH : "January",
			}, {
				Mon : "Feb",
				MONTH : "February",
			}, {
				Mon : "Mar",
				MONTH : "March",
			}, {
				Mon : "Apr",
				MONTH : "April",
			}, {
				Mon : "May",
				MONTH : "May",
			}, {
				Mon : "Jun",
				MONTH : "June",
			}, {
				Mon : "Jul",
				MONTH : "July",
			}, {
				Mon : "Aug",
				MONTH : "August",
			}, {
				Mon : "Sep",
				MONTH : "September",
			}, {
				Mon : "Oct",
				MONTH : "October",
			}, {
				Mon : "Nov",
				MONTH : "November",
			}, {
				Mon : "Dec",
				MONTH : "December",
			}, ];
			// Get current-in-use date format from system
			const configRecObject = config.load({
				type : config.Type.USER_PREFERENCES,
			});
			const dateFormat = configRecObject.getValue({
				fieldId : "DATEFORMAT",
			});
			let resDate;
			if (dateFormat.match(/MONTH/)) {
				resDate = dateFormat.replace(/MONTH/, months[month - 1]["MONTH"]);
			} else if (dateFormat.match(/Mon/)) {
				resDate = dateFormat.replace(/Mon/, months[month - 1]["Mon"]);
			} else if (dateFormat.match(/MM/)) {
				resDate = dateFormat.replace(/MM/, month < 10 ? "0" + month : month);
			} else {
				resDate = dateFormat.replace(/M/, month);
			}
			if (dateFormat.match(/DD/)) {
				resDate = resDate.replace(/DD/, day < 10 ? "0" + day : day);
			} else {
				resDate = resDate.replace(/D/, day);
			}
			resDate = resDate.replace(/YYYY/, year);
			return resDate;
		}

		let currencySearchObj = search.create({
			type : "currency",
			filters : [],
			columns : [ search.createColumn({
				name : "name",
				sort : search.Sort.ASC,
				label : "Name",
			}), search.createColumn({
				name : "symbol",
				label : "Symbol"
			}), search.createColumn({
				name : "exchangerate",
				label : "Exchange Rage"
			}), ],
		});

		const mappingField = "custimport_rdata_nbs_exch_rate";
		let scriptTask = task.create({
			taskType : task.TaskType.CSV_IMPORT
		});

		scriptTask.mappingId = mappingField;

		const body = util_nbs.generateXmlExchange();

		const headerObj = {
			name : "Content-Type",
			value : "application/soap+xml; charset=utf-8",
		};

		let csvTaskStatus;
		let csvImportTaskId;

		try {
			const response = https.post({
				url : "https://webservices.nbs.rs/CommunicationOfficeService1_0/ExchangeRateXmlService.asmx",
				body : body,
				headers : headerObj,
			});

			// parse the document into XML object
			const xmlDocument = xml.Parser.fromString({
				text : util_nbs.unescapeXml(response.body),
			});
          log.debug('xmlDocument',util_nbs.unescapeXml(response.body));
          
			let currencies = getCurrencies(xmlDocument, "ExchangeRate");

			const currencyString = [ "Base Currency,Source Currency,Exchange Rate,Effective Date", ];

			let baseCurrency = "";

			const scriptObj = runtime.getCurrentScript();
			const RSDId = scriptObj.getParameter('custscript_rdata_currency_id_nbs_exch');
			
			currencySearchObj.run().each(function(result) {
				if (result.id === RSDId) {
					baseCurrency = result.getValue("name");
				}
				return true;
			});

			for (let index = 0; index < currencies.length; index++) {
				let current = currencies[index].date.split(".");

				currencySearchObj.run().each(function(result) {
					if (currencies[index].currencyCode === result.getValue("symbol")) {
						currencyString.push(baseCurrency + "," + result.getValue("name") + "," + currencies[index].middleRate/currencies[index].unit + "," + createNewDateString(current[0], current[1], current[2]));
					}

					return true;
				});
			}


			scriptTask.importFile = currencyString.join("\n");
			log.debug('currencyString',currencyString.join("\n"));
          
			csvImportTaskId = scriptTask.submit();

			csvTaskStatus = task.checkStatus({
				taskId : csvImportTaskId,
			});
            
		} catch (error) {
			const subject = "Fatal Error: Unable to import CSV file!";
			const authorId = -5;
			const recipientEmail = "zoran.r@rdata.rs";
			email.send({
				author : authorId,
				recipients : recipientEmail,
				subject : subject,
				body : "Error occurred in script: " + runtime.getCurrentScript().id + "\n\n" + JSON.stringify(error),
			});

			if (csvTaskStatus === task.TaskStatus.FAILED) {
				log.debug({
					title : "CSV import failed",
					details : "Failed import task ID: " + csvImportTaskId,
				});
			}
		}
	}

	return {
		execute : execute,
	};
});