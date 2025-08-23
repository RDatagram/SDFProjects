/**
 * @NApiVersion 2.0
 * @NScriptType ClientScript
 */

define(['N/currentRecord', 'N/ui/message', 'N/url'], function (currentRecord, message, url) {

    var exports = {}

    function pageInit(context) {

    }

    function onButtonClick() {
        // Disabling "Changes you made may not be saved" pop-up window
        window.onbeforeunload = null;

        var parameters = getParameters();
        var periodOd = parameters.bilansUspehaPeriodOd;
        var periodDo = parameters.bilansUspehaPeriodDo;

        if (comparePeriods(periodOd, periodDo) === -1) {
            var msg1 = message.create({
                title: "Greska!",
                message: "Vrednost polja 'Period od' mora biti hronološki manja od vrednosti polja 'Period do'!",
                type: message.Type.ERROR,
                duration: 5000
            });
            msg1.show();
            return;
        }
        
        if (parameters.maticniBroj === "" || parameters.sifraDelatnosti === "" || parameters.pib === "") {
            var msg = message.create({
                title: "Greska!",
                message: "Maticni broj, sifra delatnosti i pib su neophodna polja. Morate ih popuniti!",
                type: message.Type.ERROR,
                duration: 5000
            });
            msg.show();
            return;
        } else {
            // TODO: kada se deplojuje skripta za pravljenje xml-a
            // treba id i deployment id dodati ovde
            var script = 'customscript_rsm_fi_xml1';
            var deployment = 'customdeploy_rsm_fi_xml1';
            var suitletUrl = url.resolveScript({
                scriptId: script,
                deploymentId: deployment,
                params: parameters
            });

            var link = document.createElement('a');
            link.href = suitletUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    function getParameters() {
        var cr = currentRecord.get();

        var parameters = {
            'bilansStanjaChecked' : cr.getValue({
                fieldId: "bilans_stanja"
            }),
            'bilansUspehaChecked' : cr.getValue({
                fieldId: "bilans_uspeha"
            }),
            'izvestajOOstalomRezultatuChecked' : cr.getValue({
                fieldId: "izvestaj_o_ostalom_rezultatu"
            }),
            'izvestajOTokovimaGotovineChecked' : cr.getValue({
                fieldId: "izvestaj_o_tokovima_gotovine"
            }),
            'statistickiIzvestajChecked' : cr.getValue({
                fieldId: "statisticki_izvestaj"
            }),
            'izvestajOPromenamaNaKapitaluChecked' : cr.getValue({
                fieldId: "izvestaj_o_promenama_na_kapitalu"
            }),
            'periodBilansStanja' : cr.getValue({
                fieldId: "bilans_stanja_period"
            }),
            'bilansUspehaPeriodOd' : cr.getValue({
                fieldId: "bilans_uspeha_period_od"
            }),
            'bilansUspehaPeriodDo' : cr.getValue({
                fieldId: "bilans_uspeha_period_do"
            }),
            'maticniBroj' : cr.getValue({
                fieldId: "maticnibroj"
            }),
            'sifraDelatnosti' : cr.getValue({
                fieldId: "sifradelatnosti"
            }),
            'pib' : cr.getValue({
                fieldId: "pib"
            })
        }
        return parameters;
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
        var split1 = a.split(" ");
        var split2 = b.split(" ");

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

    exports.onButtonClick = onButtonClick;
    exports.pageInit = pageInit;
    return exports;

})