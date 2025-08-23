/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 * 
 * Scheduled script depends on previously saved CSV import record
 * (CUSTIMPORT_currency_exchange_rates_new). In order for it to execute properly
 * on other accounts, new saved CSV import has to be created with the following
 * setting:
 *  - Save mapping & Start Import - IMPORT TYPE - Accounting - RECORD TYPE -
 * Currency Exchange Rates - CHARACTER ENCODING - Unicode (UTF-8) - CSV COLUMN
 * DELIMITER - Comma - Specify CSV File template (should be prior to this step)
 * with the following columns: - Base Currency,Source Currency,Exchange
 * Rate,Effective Date
 *  - File mapping - Base Currency <=> Currency Rate: Base Currency - Effective
 * Date <=> Currency Rate: Effective Date - Exchange Rate <=> Currency Rate:
 * Rate - Source Currency <=> Currency Rate: Currency
 *  - Save mapping & Start Import - IMPORT MAP NAME - custom name - ID - unique
 * string identifier starting with underscore character (eg.
 * _currency_exchange_rates_csv)
 * 
 * After creating a CSV import record, full saved CSV import ID should be
 * replaced on line 141. (note that CUSTIMPORT is being prepended to the ID
 * automatically)
 * 
 * Update the default base currency ID on line 195
 * 
 * Change recipientEmail and authorId variables with account specific ones for
 * email notification in case of import failure
 */

 define([ "N/config", "N/email", "N/file", "N/https", "N/log", "N/runtime", "N/search", "N/task", "N/xml", ], function(config, email, file, https, log, runtime, search, task, xml) {
	function execute() {
		function unescapeXml(string) {
			var unescapeMap = {
				"&amp;" : "&",
				"&quot;" : '"',
				"&lt;" : "<",
				"&gt;" : ">",
			};

			return string.replace(/(&quot;|&lt;|&gt;|&amp;)/g, function(str, item) {
				return unescapeMap[item];
			});
		}

		function getCurrencies(xml, tagName) {
			var currencies = [];
			var elements = xml.getElementsByTagName({
				tagName : tagName
			});

			for (var index = 0; index < elements.length; index++) {
				var currencyObj = {};

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
			var months = [ {
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
			var configRecObject = config.load({
				type : config.Type.USER_PREFERENCES,
			});
			var dateFormat = configRecObject.getValue({
				fieldId : "DATEFORMAT",
			});
			var resDate;
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

		var currencySearchObj = search.create({
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

		var mappingField = "custimport_currency_exchange_rates_new";
		var scriptTask = task.create({
			taskType : task.TaskType.CSV_IMPORT
		});

		scriptTask.mappingId = mappingField;

		var body = '<?xml version="1.0" encoding="utf-8"?>' + "<soap12:Envelope " + 'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ' + 'xmlns:xsd="http://www.w3.org/2001/XMLSchema" '
				+ 'xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">' + "<soap12:Header> " + '<AuthenticationHeader xmlns="http://communicationoffice.nbs.rs"> ' + "<UserName>rsm_serbia</UserName> "
				+ "<Password>rsm2020serbia</Password> " + "<LicenceID>e24a8ef8-fff1-4b78-8165-c27b8aa985fb</LicenceID> " + "</AuthenticationHeader> " + "</soap12:Header> " + "<soap12:Body> "
				+ '<GetCurrentExchangeRate xmlns="http://communicationoffice.nbs.rs"> ' + "<exchangeRateListTypeID>3</exchangeRateListTypeID>" + "</GetCurrentExchangeRate> " + "</soap12:Body> " + "</soap12:Envelope> ";

		var headerObj = {
			name : "Content-Type",
			value : "application/soap+xml; charset=utf-8",
		};

		try {
			var response = https.post({
				url : "https://webservices.nbs.rs/CommunicationOfficeService1_0/ExchangeRateXmlService.asmx",
				body : body,
				headers : headerObj,
			});

			// parse the document into XML object
			var xmlDocument = xml.Parser.fromString({
				text : unescapeXml(response.body),
			});
          log.debug('xmlDocument',unescapeXml(response.body));
          
			var currencies = getCurrencies(xmlDocument, "ExchangeRate");

			var currencyString = [ "Base Currency,Source Currency,Exchange Rate,Effective Date", ];

			var baseCurrency = "";

			var scriptObj = runtime.getCurrentScript();
			var RSDId = scriptObj.getParameter('custscript_rsm_currency_id_nbs_exch');
			
			currencySearchObj.run().each(function(result) {
				if (result.id == RSDId) {
					baseCurrency = result.getValue("name");
				}
				return true;
			});

			/*
			 * currencySearchObj.run().each(function (result) { if (result.id
			 * === "5") { baseCurrency = result.getValue("name"); } return true;
			 * });
			 */
			for (var index = 0; index < currencies.length; index++) {
				var current = currencies[index].date.split(".");

				currencySearchObj.run().each(function(result) {
					if (currencies[index].currencyCode === result.getValue("symbol")) {
						currencyString.push(baseCurrency + "," + result.getValue("name") + "," + currencies[index].middleRate/currencies[index].unit + "," + createNewDateString(current[0], current[1], current[2]));
					}

					return true;
				});
			}


			scriptTask.importFile = currencyString.join("\n");
			log.debug('currencyString',currencyString.join("\n"));
          
			var csvImportTaskId = scriptTask.submit();

			var csvTaskStatus = task.checkStatus({
				taskId : csvImportTaskId,
			});
            
		} catch (error) {
			var subject = "Fatal Error: Unable to import CSV file!";
			var authorId = -5;
			var recipientEmail = "zoran.roncevic@rsm.rs";
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
