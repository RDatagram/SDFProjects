/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 *
 * Custom form page for XML export of Financial reports
 *
 *
 */

define(["N/ui/serverWidget", "N/util", "N/search", "./dateUtil"], function(ui, util, search, dateUtil) {

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

    function periodsToArray(results) {
        var periods = [];
        results.each(function (result) {
            periods.push({
                "id": result.getValue("internalid"),
                "name": result.getValue("periodname"),
                "start_date": result.getValue("startdate"),
                "end_date": result.getValue("enddate")   
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
                title: "Finansijski izvestaji - XML Export"
            });

            form.clientScriptModulePath = './rsm_fi_xml_client_script.js';

            var  listaIzvestaja = form.addFieldGroup({
                id : 'izvestaji_grupa',
                label : 'Odabir izvestaja'
            });
            listaIzvestaja.isSingleColumn = true;

            form.addField({
                id: "bilans_stanja",
                type: ui.FieldType.CHECKBOX,
                label: "Bilans stanja",
                container: "izvestaji_grupa"
            });

            form.addField({
                id: "bilans_uspeha",
                type: ui.FieldType.CHECKBOX,
                label: "Bilans uspeha",
                container: "izvestaji_grupa"
            });

            form.addField({
                id: "izvestaj_o_ostalom_rezultatu",
                type: ui.FieldType.CHECKBOX,
                label: "Izvestaj o ostalom rezultatu",
                container: "izvestaji_grupa"
            });

            form.addField({
                id: "izvestaj_o_tokovima_gotovine",
                type: ui.FieldType.CHECKBOX,
                label: "Izvestaj o tokovima gotovine",
                container: "izvestaji_grupa"
            });

            form.addField({
                id: "statisticki_izvestaj",
                type: ui.FieldType.CHECKBOX,
                label: "Statisticki izvestaj",
                container: "izvestaji_grupa"
            });

            form.addField({
                id: "izvestaj_o_promenama_na_kapitalu",
                type: ui.FieldType.CHECKBOX,
                label: "Izvestaj o promenama na kapitalu",
                container: "izvestaji_grupa"
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
            var periods = periodsToArray(periodsSavedSearch());
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

            form.addButton({
                id: "export_button",
                label: "Export XML",
                functionName: 'onButtonClick'
            });

            context.response.writePage(form);
        }
    }
    return {
        onRequest: onRequest
    };

});
