/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * 
 * 
 * 
 */

define(["./balanceSheet", 
        "./incomeStatement",
        "./IoOR", "N/log"], 
function(balanceSheet, incomeStatement, ioor) {

    // Create xml string with fields and values from bsScheme
    function createXMLString(checkedForms, params) {
        // TODO xml structure
        var xmlStr = "<FiZahtev xmlns='http://schemas.datacontract.org/2004/07/Domain.Model' xmlns:i='http://www.w3.org/2001/XMLSchema-instance'>";
        
        if (checkedForms['bilansStanjaChecked'] === "true") {
            xmlStr += balanceSheet.getXml(params['periodBilansStanja']);
        }
        if (checkedForms['bilansUspehaChecked'] === "true") {
            xmlStr += incomeStatement.getXml(params['bilansUspehaPeriodOd'], params['bilansUspehaPeriodDo']);
        }
        if (checkedForms['izvestajOOstalomRezultatuChecked'] === "true") {
            xmlStr += ioor.getXml(params["bilansUspehaPeriodOd"], params["bilansUspehaPeriodDo"]);
        }
        if (checkedForms['izvestajOTokovimaGotovineChecked'] === "true") {
            // TODO
        }
        if (checkedForms['izvestajOPromenamaNaKapitaluChecked'] === "true") {
            // TODO
        }
        if (checkedForms['statistickiIzvestajChecked'] === "true") {
            // TODO
        }
       
        xmlStr += "</FiZahtev>";
        return xmlStr;
    }

    function onRequest(context) {
        
        // Checkboxes returns strings "T" and "F"
        var checkedForms = {
            bilansStanjaChecked: context.request.parameters.bilansStanjaChecked,
            bilansUspehaChecked: context.request.parameters.bilansUspehaChecked,
            izvestajOOstalomRezultatuChecked: context.request.parameters.izvestajOOstalomRezultatuChecked,
            izvestajOTokovimaGotovineChecked: context.request.parameters.izvestajOTokovimaGotovineChecked,
            statistickiIzvestajChecked: context.request.parameters.statistickiIzvestajChecked,
            izvestajOPromenamaNaKapitaluChecked: context.request.parameters.izvestajOPromenamaNaKapitaluChecked
        }

        var params = {
            periodBilansStanja : context.request.parameters.periodBilansStanja,
            bilansUspehaPeriodOd : context.request.parameters.bilansUspehaPeriodOd,
            bilansUspehaPeriodDo : context.request.parameters.bilansUspehaPeriodDo,
            maticniBroj : context.request.parameters.maticniBroj,
            sifraDelatnosti : context.request.parameters.sifraDelatnosti,
            pib : context.request.parameters.pib
        }

        // Sets header for xml content type - Needed for development only
        context.response.setHeader({
            name: 'Content-Type',
            value: 'text/xml'
        });

        context.response.write({
            output: createXMLString(checkedForms, params)
            // output: balanceSheet.getXml(bilansStanjaDatum)
            // output: JSON.stringify(incomeStatement.getTranObjects())
            // output: JSON.stringify(params)
        });

    }

    return {
        onRequest: onRequest
    };
});
