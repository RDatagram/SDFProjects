/**
 * balanceSheet.js
 * @NApiVersion 2.x
 * @NModuleScope Public
 * 
 * Custom module with balance sheet calculation functionality. 
 * 
 * Exports getXml, savePdf functions
 * 
 */


define(["N/search", "N/file", "N/render", "./dateUtil", "N/query"], function (search, file, render, dateUtil, query) {

    var bsScheme = {};
    var dUtil = dateUtil.dateUtil;

    // Load bs_scheme
    function loadScheme() {
        var file1 = file.load({
            id: "./bs_scheme.json"
        });

        bsScheme = JSON.parse(file1.getContents());
    }

    //Create and run transaction query
    function transactionQuery(query, periodList) {

        var newQuery = query.create({
            type: query.Type.TRANSACTION
        });

        var firstCondition = newQuery.createCondition({
            fieldId: ''
        })
    }

    //Create and run accounting period query
    function periodsQuery(query) {
        var accountingPeriodQuery = query.create({
            type: query.Type.ACCOUNTING_PERIOD
        });

        var firstCondition = accountingPeriodQuery.createCondition({
            fieldId: 'isyear',
            operator: query.Operator.IS,
            values: false
        });

        var secondCondition = accountingPeriodQuery.createCondition({
            fieldId: 'isquarter',
            operator: query.Operator.IS,
            values: false
        });

        accountingPeriodQuery.condition = accountingPeriodQuery.and(firstCondition, secondCondition);

        accountingPeriodQuery.columns = [
            accountingPeriodQuery.createColumn({
                fieldId: 'id'
            }),
            accountingPeriodQuery.createColumn({
                fieldId: 'periodname'
            }),
            accountingPeriodQuery.createColumn({
                fieldId: 'startdate'
            }),
            accountingPeriodQuery.createColumn({
                fieldId: 'enddate'
            })
        ];

        var resultSet = accountingPeriodQuery.run();
        var periods = resultSet.iterator();
        return periods;
    }


    // Create and run transaction saved search
    function transactionsSS(periodList) {
        return search.create({
            type: "transaction",
            filters: [
                [
                    ["account.number", "startswith", "0"],
                    "OR",
                    ["account.number", "startswith", "1"],
                    "OR",
                    ["account.number", "startswith", "2"],
                    "OR",
                    ["account.number", "startswith", "3"],
                    "OR",
                    ["account.number", "startswith", "4"],
                    "OR",
                    ["account.number", "startswith", "89"]
                ],
                "AND",
                ["accountingperiod.internalid", search.Operator.ANYOF, periodList]
            ],
            columns: [
                search.createColumn({
                    name: "account",
                    summary: search.Summary.GROUP,
                    label: "Account name"
                }),
                search.createColumn({
                    name: "number",
                    join: "account",
                    summary: search.Summary.GROUP,
                    label: "Account number"
                }),
                search.createColumn({
                    name: "balance",
                    join: "account",
                    summary: search.Summary.GROUP,
                    label: "Balance"
                }),
                search.createColumn({
                    name: "creditamount",
                    summary: search.Summary.SUM,
                    label: "Amount (credit)"
                }),
                search.createColumn({
                    name: "debitamount",
                    summary: search.Summary.SUM,
                    label: "Amount (Debit)"
                }),
                search.createColumn({
                    name: "formulanumeric",
                    formula: '(NVL({debitamount}, 0) - NVL({creditamount}, 0)) / 1000', // division by 1000 ???
                    summary: search.Summary.SUM,
                    label: "Balance as of date"
                })
            ]
        }).run();
    }

    // Convert transaction saved search results into js object
    function tranToObj(results) {
        var obj = {};
        results.each(function(result) {
            var creditAmount = parseFloat(result.getValue({name:'creditamount', summary:search.Summary.SUM}));
            var debitAmount = parseFloat(result.getValue({name:'debitamount', summary:search.Summary.SUM}));
            obj[result.getValue({name:'number', join:'account', summary:search.Summary.GROUP})] = {
                account: result.getValue({name:'account', summary:search.Summary.GROUP}),
                current_balance: parseFloat(result.getValue({name:'balance', join:'account', summary:search.Summary.GROUP})),
                credit_amount: (creditAmount) ? creditAmount : 0,
                debit_amount: (debitAmount) ? debitAmount : 0,
                balance_as_of_date: parseFloat(result.getValue({name:'formulanumeric', summary:search.Summary.SUM}))
            };
            return true;
        });
        return obj;
    }

    
    // Create and run accounting period saved search
    function periodsSS() {
        return search.create({
            type: "accountingperiod",
            filters: [
                ["isYear", "is", "F"],
                "AND",
                ["isQuarter", "is", "F"]
            ],
            columns: [
                "internalid",
                "periodname",
                "startdate",
                "enddate"
            ]
        }).run();
    }

    // Convert accounting period SS results to object
    function periodToObj(results) {
        var obj1 = {},
            obj2 = {};
        results.each(function (result) {
            obj1[result.value.values[0]] = {
                "id": result.value.values[0],
                "name": result.value.values[1],
                "start_date": result.value.values[2],
                "end_date": result.value.values[3]
            };
            obj2[result.value.values[1]] = {
                "id": result.value.values[0],
                "name": result.value.values[1],
                "start_date": result.value.values[2],
                "end_date": result.value.values[3]
            };
            return true;
        });

        return {
            period_key_id: obj1,
            period_key_name: obj2
        };
    }

    // Get the oldest period in system from resultRange
    function getFirstPeriod(periods) {
        var periodKeyName = periods["period_key_name"];

        var period = Object.keys(periodKeyName)[0];

        var resPeriod = "Jan " + dUtil.getYear(period);
        return periodKeyName[resPeriod];
    }

    // Create and return list of period ids for all periods between period1 and period2
    function getPeriodRange(period1Id, period2Id, periods) {
        var periodIdList = [];
        var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov","Dec"];
        var periodKeyId = periods["period_key_id"];
        var periodKeyName = periods["period_key_name"];
        
        var periodFrom =  periodKeyId[period1Id].name;
        var periodTo = periodKeyId[period2Id].name;

        var counter = months.indexOf(periodFrom.match(/[a-zA-Z]+/)[0]),
            year = dUtil.getYear(periodFrom);

        do {
            var periodString = months[counter++] + " " + year;
            periodIdList.push(periodKeyName[periodString].id);
            if (counter % 12 === 0) {
                year++;
                counter = 0;
            }
        } while (periodTo !== periodString);

        return periodIdList;
    }

    // Calculate balance amounts for accounts
    function setBalancesAccounts(obj, obj2, obj3) {
        for (var keyOne in bsScheme) {
            if (bsScheme[keyOne].hasOwnProperty("accounts")) {
                var sum = 0, sum2 = 0, sum3 = 0;
                var accList = bsScheme[keyOne]["accounts"];
                for (var i=0; i<accList.length; i++) {
                    for (var keyTwo in obj) {
                        if (keyTwo.match(new RegExp("^"+accList[i]))) {
                            sum += obj[keyTwo]["balance_as_of_date"];
                        }
                    }
                    for (var keyThree in obj2) {
                        if (keyThree.match(new RegExp("^" + accList[i]))) {
                            sum2 += obj2[keyThree]["balance_as_of_date"];
                        }
                    }
                    for (var keyFour in obj3) {
                        if (keyFour.match(new RegExp("^" + accList[i]))) {
                            sum3 += obj3[keyFour]["balance_as_of_date"];
                        }
                    }
                }
                bsScheme[keyOne]["balance1"] = sum;
                bsScheme[keyOne]["balance2"] = sum2;
                bsScheme[keyOne]["balance3"] = sum3;
            }
        }
    }

    // Calculate balance amounts for aops
    function setBalancesAops() {
        for (var key in bsScheme) {
            if (bsScheme[key].hasOwnProperty("aops")) {
                var sum = 0, sum2 = 0, sum3 = 0;
                var aops = bsScheme[key]["aops"];
                for (var i=0; i<aops.length; i++) {
                    var result = aops[i].split(/\s/);
                    var sign = result[0], aop = result[1];
                    if (sign === "+") {
                        sum += bsScheme["_" + aop]["balance1"];
                        sum2 += bsScheme["_" + aop]["balance2"];
                        sum3 += bsScheme["_" + aop]["balance3"];
                    } else {
                        sum -= bsScheme["_" + aop]["balance1"];
                        sum2 -= bsScheme["_" + aop]["balance2"];
                        sum3 -= bsScheme["_" + aop]["balance3"];
                    }
                    
                }
                bsScheme[key]["balance1"] = sum;
                bsScheme[key]["balance2"] = sum2;
                bsScheme[key]["balance3"] = sum3;
            }
        }
    }

    // Round balance values in bsScheme
    function roundValues() {
        for (var key in bsScheme) {
            bsScheme[key]["balance1"] = Math.round(bsScheme[key]["balance1"]);
            bsScheme[key]["balance2"] = Math.round(bsScheme[key]["balance2"]);
            bsScheme[key]["balance3"] = Math.round(bsScheme[key]["balance3"]);
        }
    }

    // Create xml string with fields and values from bsScheme
    function createXMLString() {
        var xmlStr = 
        "<Forma>" +
        "<Naziv>Bilans stanja</Naziv>" + 
        "<Atributi>" +
        "<Naziv>Bilans stanja</Naziv>" + 
        "<NumerickaPoljaForme xmlns:a='http://schemas.datacontract.org/2004/07/AppDef'>";

        var numerickaPoljaForme = "",
            tekstualnaPoljaForme = "";  

        for (var key in bsScheme) {

            for (var i=5; i<8; i++) {

                var numerickoPolje = "<a:NumerickoPolje>";
                numerickoPolje += "<a:Naziv>aop-" + key.substr(1) + "-" + i + "</a:Naziv>";
                numerickoPolje += "<a:Vrednosti>" + (bsScheme[key]["balance" + (i - 4)]).toString() + "</a:Vrednosti>";
                numerickoPolje += "</a:NumerickoPolje>";

                numerickaPoljaForme += numerickoPolje;
            }

            var tekstualnoPolje = "<TekstualnoPolje>";
            tekstualnoPolje += "<Naziv>aop-" + key.substr(1) + "-4" + "</Naziv>";
            tekstualnoPolje += "<Vrednosti/>";
            tekstualnoPolje += "</TekstualnoPolje>";

            tekstualnaPoljaForme += tekstualnoPolje;
        }

        xmlStr += numerickaPoljaForme;
        xmlStr += "</NumerickaPoljaForme>";
        xmlStr += "<TekstualnaPoljaForme>";
        xmlStr += tekstualnaPoljaForme;
        xmlStr += "</TekstualnaPoljaForme>";

        xmlStr += "</Atributi></Forma>"; 

        return xmlStr;
    }

    // Return date in format suitable for official financial reports in Serbia
    function srbDate(date) {
        if (date === "")
            return "";
        return dUtil.getDay(date) + "." + dUtil.getMonth(date) + "." + dUtil.getYear(date) + ".";
    }

    // Calculate data, populate bs_scheme object
    function processData(period) {
        loadScheme();

        var periods = periodToObj(periodsQuery(query));
        var periodKeyId = periods["period_key_id"];
        var periodKeyName = periods["period_key_name"];

        var firstPeriodId = getFirstPeriod(periods).id;
        var periodList = getPeriodRange(firstPeriodId, periodKeyName[period].id, periods);

        var period1YearAgo = period.replace(new RegExp(/[\d]{4}/), dUtil.getYear(period) - 1);
        var period2YearsAgo = period.replace(new RegExp(/[\d]{4}/), dUtil.getYear(period) - 2);

        var period1YearAgoId,
            period2YearsAgoId,
            periodList1YearAgo,
            periodList2YearsAgo,
            transactionsPrethodnaKrajnje,
            transactionsPrethodnaPocetno = null;

        if (periodKeyName.hasOwnProperty(period1YearAgo)) {
            period1YearAgoId = periodKeyName[period1YearAgo].id;
            periodList1YearAgo = getPeriodRange(firstPeriodId, period1YearAgoId, periods);
            transactionsPrethodnaKrajnje = tranToObj(transactionsSS(periodList1YearAgo));
        } else {
            transactionsPrethodnaKrajnje = null;
        }

        if (periodKeyName.hasOwnProperty(period2YearsAgo)) {
            period2YearsAgoId = periodKeyName[period2YearsAgo].id;
            periodList2YearsAgo = getPeriodRange(firstPeriodId, period2YearsAgoId, periods);
            transactionsPrethodnaPocetno = tranToObj(transactionsSS(periodList2YearsAgo));
        } else {
            period2YearsAgo = "Jan " + (dUtil.getYear(period) - 1);
            if (periodKeyName.hasOwnProperty(period2YearsAgo)) {
                period2YearsAgoId = periodKeyName[period2YearsAgo].id;
                periodList2YearsAgo = getPeriodRange(firstPeriodId, period2YearsAgoId, periods);
                transactionsPrethodnaPocetno = tranToObj(transactionsSS(periodList2YearsAgo));
            } else {
                transactionsPrethodnaPocetno = null;
            }
        }

        var transactionsTekucaGodina = tranToObj(transactionsSS(periodList));
        
        setBalancesAccounts(transactionsTekucaGodina, transactionsPrethodnaKrajnje,  transactionsPrethodnaPocetno);
        roundValues();

        // Double aops calculation fixes the null error
        setBalancesAops();
        setBalancesAops();
    }

    // Returns balance sheet xml string
    function getXml(period) {

        processData(period);

        return createXMLString();
    }

    // Creates pdf file and saves it in file cabinet
    function savePdf(period, maticniBroj, sifraDelatnosti, pib) {

        processData(period);
        
        var periods = periodToObj(periodsQuery(query));
        var periodKeyId = periods["period_key_id"];
        var periodKeyName = periods["period_key_name"];

        // var period1YearAgo = period.replace(new RegExp(/[\d]{4}/), dUtil.getYear(period) - 1);
        // var period2YearsAgo = period.replace(new RegExp(/[\d]{4}/), dUtil.getYear(period) - 2);

        var datum1 = periodKeyName[period].end_date;
        // Need to check here for date2 and date3 if it exists in period object
        // var datum2 = periodKeyName[period1YearAgo].end_date;
        var datum2 = "";
        var datum3 = "";

        var renderer = render.create();

        var jsonObj = {
            datum: srbDate(datum1),
            datumKrajnji: srbDate(datum2),
            datumPocetni: srbDate(datum3),
            maticniBroj: maticniBroj,
            sifraDelatnosti: sifraDelatnosti,
            pib: pib,
            bsScheme: bsScheme
        };

        renderer.addCustomDataSource({
            format: render.DataSource.OBJECT,
            alias: "JSON",
            data: jsonObj
        });

        renderer.setTemplateByScriptId("CUSTTMPL_BALANCE_SHEET_PDF_HTML");
        var pdfFile = renderer.renderAsPdf();
        pdfFile.name = "Bilans stanja-" + srbDate(datum1) + ".pdf";

        // Return file
        return pdfFile;
    }


    return {
        getXml: getXml,
        savePdf: savePdf
    }

});