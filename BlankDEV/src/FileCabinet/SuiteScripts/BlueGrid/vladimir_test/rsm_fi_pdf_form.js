/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 *
 * Custom form page for PDF export of Financial reports
 *
 */

define(["N/ui/serverWidget", "N/util", "N/search", "./dateUtil", "N/query", "N/log"], function(ui, util, search, dateUtil, query, log) {

    var dUtil = dateUtil.dateUtil;

    function periodsSavedSearch() {
        var currDate = new Date();
        var year = currDate.getFullYear();
        var month = currDate.getMonth() + 1;

        // System periods start at Jan 2001, so -25, -30 or -50 is same
        var date1 = dUtil.createNewDateString(1, 1, year - 50);
        var date2;
        if (month === 1) {
            date2 = dUtil.createNewDateString(1, 12, year - 1);
        } else {
            date2 = dUtil.createNewDateString(1, month - 1, year);
        }

        return search.create({
            type: "accountingperiod",
            filters: [
                ["isYear", "is", "F"],
                "AND",
                ["isQuarter", "is", "F"],
                "AND",
                ["startdate", "within", date1, date2]  
            ],
            columns: [
                "internalid",
                "periodname",
                "startdate",
                "enddate"
            ]
        }).run();
    }

    function periodsQuery(query) {

        var currDate = new Date();
        var year = currDate.getFullYear();
        var month = currDate.getMonth() + 1;

        // System periods start at Jan 2001, so -25, -30 or -50 is same
        var date1 = dUtil.createNewDateString(1, 1, year - 50);
        var date2;
        if (month === 1) {
            date2 = dUtil.createNewDateString(1, 12, year - 1);
        } else {
            date2 = dUtil.createNewDateString(1, month - 1, year);
        }

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

        var thirdCondition = accountingPeriodQuery.createCondition({
            fieldId: 'startdate',
            operator: query.Operator.WITHIN,
            values: [date1, date2]
        });

        accountingPeriodQuery.condition = accountingPeriodQuery.and([firstCondition, secondCondition, thirdCondition]);

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

    function periodsToArray(results) {
        var periods = [];
        results.each(function (result) {
            periods.push({
                "id": result.value.values[0],
                "name": result.value.values[1],
                "start_date": result.value.values[2],
                "end_date": result.value.values[3]  
            });
            return true;
        });
        return periods;
    }

    // Function returns number
    function getMonth(month) {
        var months = {
            "Jan": 1,
            "Feb": 2,
            "Mar": 3,
            "Apr": 4,
            "May": 5,
            "Jun": 6,
            "Jul": 7,
            "Aug": 8,
            "Sep": 9,
            "Oct": 10,
            "Nov": 11,
            "Dec": 12
        };
        return months[month];
    }

    function comparePeriods(a, b) {
        var split1 = a.name.split(" ");
        var split2 = b.name.split(" ");

        var monthA = getMonth(split1[0]);
        var monthB = getMonth(split2[0]);

        var yearA = parseInt(split1[1]);
        var yearB = parseInt(split2[1]);

        if (yearA > yearB) {
            return -1;
        }
        if (yearA < yearB) {
            return 1;
        }
        if (yearA === yearB) {
            if (monthA > monthB) {
                return -1;
            } else {
                return 1;
            }
        }
        return 0;
    }

    function onRequest(context) {
        if (context.request.method === "GET") {
            var form = ui.createForm({
                title: "Finansijski izvestaji - PDF Export"
            });
            form.clientScriptModulePath = './rsm_fi_pdf_client_script.js';

            form.addButton({
                id: "export_button",
                label: "Export PDF",
                functionName: 'onButtonClick'
            });

            var izvestajiGrupa = form.addFieldGroup({
                id: 'izvestaji_grupa',
                label: 'Odabir izvestaja'
            });
            izvestajiGrupa.isSingleColumn = true;

            var listaIzvestaja = form.addField({
                id: "izvestaji_select",
                type: ui.FieldType.SELECT,
                label: "Izaberite izvestaj",
                container: "izvestaji_grupa"
            });

            // Financial report names. Needed for option elements in listaIzvestaja select field
            var izvestajiArray = [
                "Bilans stanja",
                "Bilans uspeha",
                "Izvestaj o ostalom rezultatu",
                "Izvestaj o tokovima gotovine",
                "Izvestaj o promenama na kapitalu",
                "Statisticki izvestaj"
            ];

            // Adding options to Select element
            util.each(izvestajiArray, function(izvestaj, id) {
                listaIzvestaja.addSelectOption({
                    value: id,
                    text: izvestaj
                });
            });

            var  bilansStanjaFieldGroup = form.addFieldGroup({
                id : 'bilans_stanja_grupa',
                label : 'Bilans stanja'
            });
            bilansStanjaFieldGroup.isSingleColumn = true;

            var periodBilansStanja = form.addField({
                id: "bilans_stanja_period",
                type: ui.FieldType.SELECT,
                label: "Period (Bilans stanja)",
                container: "bilans_stanja_grupa"
            });

            periodBilansStanja.updateBreakType({
                breakType: ui.FieldBreakType.STARTCOL
            });

            var  bilansUspehaFieldGroup = form.addFieldGroup({
                id : 'bilans_uspeha_grupa',
                label : 'Bilans uspeha'
            });
            bilansUspehaFieldGroup.isSingleColumn = true;

            var periodOd = form.addField({
                id: "bilans_uspeha_period_od",
                type: ui.FieldType.SELECT,
                label: "Period od (Bilans uspeha)",
                container: "bilans_uspeha_grupa"
            });

            var periodDo = form.addField({
                id: "bilans_uspeha_period_do",
                type: ui.FieldType.SELECT,
                label: "Period do: (Bilans uspeha)",
                container: "bilans_uspeha_grupa"
            });

            // TODO: adding periods to 3 select elements
            var periods = periodsToArray(periodsQuery(query));
            periods.sort(comparePeriods);

            util.each(periods, function(period) {
                periodBilansStanja.addSelectOption({
                    value: period.name,
                    text: period.name
                });
                periodOd.addSelectOption({
                    value: period.name,
                    text: period.name
                });
                periodDo.addSelectOption({
                    value: period.name,
                    text: period.name
                });
            });

            var commonFieldGroup = form.addFieldGroup({
                id: "common_field_group",
                label: "Zajednicka polja"
            });
            commonFieldGroup.isSingleColumn = true;

            form.addField({
                id: "maticnibroj",
                type: ui.FieldType.TEXT,
                label: "Maticni broj",
                container: "common_field_group"
            });

            form.addField({
                id: "sifradelatnosti",
                type: ui.FieldType.TEXT,
                label: "Sifra delatnosti",
                container: "common_field_group"
            });

            form.addField({
                id: "pib",
                type: ui.FieldType.TEXT,
                label: "PIB",
                container: "common_field_group"
            });

            context.response.writePage(form);
        }
    }
    return {
        onRequest: onRequest
    };

});