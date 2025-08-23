/**
 * incomeStatement.js
 * @NApiVersion 2.x
 * @NModuleScope Public
 * 
 * Custom module with income statement calculation functionality. 
 * 
 * Exports getXml, savePdf functions
 * 
 */


define(["N/search", "N/file", "N/render", "./dateUtil"], function (search, file, render, dateUtil) {

    var buScheme = {};
    var dUtil = dateUtil.dateUtil;

    // Load bs_scheme
    function loadScheme() {
        var file1 = file.load({
            id: "./bu_scheme.json"
        });

        buScheme = JSON.parse(file1.getContents());
    }

    // Create and run ransactions saved search
    function transactionsSS(periodList) {
        return search.create({
            type: "transaction",
            filters: [
                [
                    ["account.number", "startswith", "5"],
                    "OR",
                    ["account.number", "startswith", "6"],
                    "OR",
                    ["account.number", "startswith", "7"]
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
                    formula: '(NVL({debitamount}, 0) - NVL({creditamount}, 0))', // division by 1000 ???
                    summary: search.Summary.SUM,
                    label: "Balance between periods"
                })
            ]
        }).run();
    }

    // Convert transactions SS results to object
    function tranToObj(results) {
        var obj = {};
        results.each(function (result) {
            var creditAmount = parseFloat(result.getValue({ name: 'creditamount', summary: search.Summary.SUM }));
            var debitAmount = parseFloat(result.getValue({ name: 'debitamount', summary: search.Summary.SUM }));
            obj[result.getValue({ name: 'number', join: 'account', summary: search.Summary.GROUP })] = {
                account: result.getValue({ name: 'account', summary: search.Summary.GROUP }),
                current_balance: parseFloat(result.getValue({ name: 'balance', join: 'account', summary: search.Summary.GROUP })),
                credit_amount: (creditAmount) ? creditAmount : 0,
                debit_amount: (debitAmount) ? debitAmount : 0,
                balance_between_periods: parseFloat(result.getValue({ name: 'formulanumeric', summary: search.Summary.SUM }))
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
            obj1[result.getValue("internalid")] = {
                "id": result.getValue("internalid"),
                "name": result.getValue("periodname"),
                "start_date": result.getValue("startdate"),
                "end_date": result.getValue("enddate")
            };
            obj2[result.getValue("periodname")] = {
                "id": result.getValue("internalid"),
                "name": result.getValue("periodname"),
                "start_date": result.getValue("startdate"),
                "end_date": result.getValue("enddate")
            };
            return true;
        });

        return {
            period_key_id: obj1,
            period_key_name: obj2
        };
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

    // Calculate balances of fields containing accounts
    function setBalancesAccounts(obj, obj2) {
        for (var keyOne in buScheme) {
            if (buScheme[keyOne].hasOwnProperty("accounts")) {
                var sum = 0, sum2 = 0;
                var accList = buScheme[keyOne]["accounts"];
                for (var i = 0; i < accList.length; i++) {
                    for (var keyTwo in obj) {
                        if (keyTwo.match(new RegExp("^" + accList[i]))) {
                            sum += obj[keyTwo]["balance_between_periods"];
                        }
                    }
                    for (var keyThree in obj2) {
                        if (keyThree.match(new RegExp("^" + accList[i]))) {
                            sum2 += obj2[keyThree]["balance_between_periods"];
                        }
                    }
                }
                buScheme[keyOne]["current_year"] = sum;
                buScheme[keyOne]["last_year"] = sum2;
            }
        }
    }

    // Calculate balances of fields containing aops
    function setBalancesAops() {
        for (var key in buScheme) {
            if (buScheme[key].hasOwnProperty("aops")) {
                var sum = 0, sum2 = 0;
                var aops = buScheme[key]["aops"];
                for (var i = 0; i < aops.length; i++) {
                    var result = aops[i].split(/\s/);
                    var sign = result[0], aop = result[1];
                    if (sign === "+") {
                        sum += buScheme["_" + aop]["current_year"];
                        sum2 += buScheme["_" + aop]["last_year"];
                    } else {
                        sum -= buScheme["_" + aop]["current_year"];
                        sum2 -= buScheme["_" + aop]["last_year"];
                    }

                }
                buScheme[key]["current_year"] = sum;
                buScheme[key]["last_year"] = sum2;
            }
        }
    }

    // Round values in bu_scheme
    function roundValues() {
        for (var key in buScheme) {
            buScheme[key]["current_year"] = Math.round(buScheme[key]["current_year"]);
            buScheme[key]["last_year"] = Math.round(buScheme[key]["last_year"]);
        }
    }

    // Return one-year-ago period
    function oneYearAgo(period) {
        year = parseInt(period.match(/.*([\d]{4}).*/)[1]);
        newPeriod = period.replace(year.toString(), (year - 1).toString());
        return newPeriod;
    }

    // Return date string suitable for pdf report
    function srbDateAndMonth(dateString, firstDay) {
        var months = {
            Jan: 1,
            Feb: 2,
            Mar: 3,
            Apr: 4,
            May: 5,
            Jun: 6,
            Jul: 7,
            Aug: 8,
            Sep: 9,
            Oct: 10,
            Nov: 11,
            Dec: 12
        };
        var grps = dateString.match(/([a-zA-Z]+)\s*(\d*)/);
        var day = null;
        if (firstDay) {
            day = new Date(parseInt(grps[2]), months[grps[1]] - 1, 1).getDate();
        } else {
            day = new Date(parseInt(grps[2]), months[grps[1]], 0).getDate();
        }
        var month = months[grps[1]];
        return day + "." + month + ".";
    }

    // Create xml string with fields and values from buScheme
    function createXMLString() {
        var xmlStr =
            "<Forma>" +
            "<Naziv>Bilans uspeha</Naziv>" +
            "<Atributi>" +
            "<Naziv>Bilans uspeha</Naziv>" +
            "<NumerickaPoljaForme xmlns:a='http://schemas.datacontract.org/2004/07/AppDef'>";

        var numerickaPoljaForme = "",
            tekstualnaPoljaForme = "";

        for (var key in buScheme) {

            var numerickoPolje = "<a:NumerickoPolje>";
            numerickoPolje += "<a:Naziv>aop-" + key.substr(1) + "-5</a:Naziv>";
            numerickoPolje += "<a:Vrednosti>" + (buScheme[key]["current_year"]).toString() + "</a:Vrednosti>";
            numerickoPolje += "</a:NumerickoPolje>";

            numerickaPoljaForme += numerickoPolje;

            numerickoPolje = "<a:NumerickoPolje>";
            numerickoPolje += "<a:Naziv>aop-" + key.substr(1) + "-6</a:Naziv>";
            numerickoPolje += "<a:Vrednosti>" + (buScheme[key]["last_year"]).toString() + "</a:Vrednosti>";
            numerickoPolje += "</a:NumerickoPolje>";

            numerickaPoljaForme += numerickoPolje;

            var tekstualnoPolje = "<TekstualnoPolje>";
            tekstualnoPolje += "<Naziv>aop-" + key.substr(1) + "-4</Naziv>";
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

    // Calculate data, populate bu_scheme object
    function processData(periodFrom, periodTo) {
        loadScheme();

        var periods = periodToObj(periodsSS());
        var periodKeyId = periods["period_key_id"];
        var periodKeyName = periods["period_key_name"];

        var periodList,
            periodList1YearAgo,
            periodFrom1YearAgo,
            periodTo1YearAgo,
            currentYearTrans,
            lastYearTrans;

        periodList = getPeriodRange(periodKeyName[periodFrom].id, periodKeyName[periodTo].id, periods);

        currentYearTrans = tranToObj(transactionsSS(periodList));

        periodFrom1YearAgo = oneYearAgo(periodFrom);
        periodTo1YearAgo = oneYearAgo(periodTo);

        if (periodKeyName.hasOwnProperty(periodFrom1YearAgo) && periodKeyName.hasOwnProperty(periodTo1YearAgo)) {
            periodList1YearAgo = getPeriodRange(periodKeyName[periodFrom1YearAgo].id, periodKeyName[periodTo1YearAgo].id, periods);
            lastYearTrans = tranToObj(transactionsSS(periodList1YearAgo));
        } else {
            lastYearTrans = null;
        }
        
        setBalancesAccounts(currentYearTrans, lastYearTrans);
        // Double aops calculation fixes the null error
        setBalancesAops();
        setBalancesAops();
        roundValues();
    }

    // Returns balance sheet xml string
    function getXml(periodFrom, periodTo) {
        processData(periodFrom, periodTo);
        return createXMLString();
    }

    // Creates pdf file and saves it in file cabinet
    function savePdf(periodFrom, periodTo, maticniBroj, sifraDelatnosti, pib) {
        processData(periodFrom, periodTo);

        var renderer = render.create();

        var datumOd = srbDateAndMonth(periodFrom, true) + dUtil.getYear(periodFrom) + ".";
        var datumDo = srbDateAndMonth(periodTo, false) + dUtil.getYear(periodTo) + ".";

        var jsonObj = {
            datum_od: datumOd,
            datum_do: datumDo,
            maticniBroj: maticniBroj,
            sifraDelatnosti: sifraDelatnosti,
            pib: pib,
            naziv: "",
            sediste: "",
            buScheme: buScheme
        };

        renderer.addCustomDataSource({
            format: render.DataSource.OBJECT,
            alias: "JSON",
            data: jsonObj
        });

        renderer.setTemplateByScriptId("CUSTTMPL_BILANS_USPEHA_HTML_PDF_TEMPLATE");
        var pdfFile = renderer.renderAsPdf();
        pdfFile.name = "Bilans uspeha-" + datumOd + "-" + datumDo + ".pdf";
        return pdfFile;
    }

    // Return aops 1064 and 1065 neccessary for ioor report
    function getIoorAops(periodFrom, periodTo) {
        processData(periodFrom, periodTo);

        return {
            current_year_1064: buScheme["_1064"].current_year,
            last_year_1064: buScheme["_1064"].last_year,
            current_year_1065: buScheme["_1065"].current_year,
            last_year_1065: buScheme["_1065"].last_year
        }
    }


    return {
        getXml: getXml,
        savePdf: savePdf,
        getIoorAops: getIoorAops
    }

});