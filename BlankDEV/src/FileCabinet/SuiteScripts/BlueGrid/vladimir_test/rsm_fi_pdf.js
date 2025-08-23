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
function(balanceSheet, incomeStatement, ioor, log) {

    // Return pdf file of chosen form
    function returnPdfFile(params) {
        log.debug({
            title: 'Parametri koji su stigli',
            details: params
        });
        var izvestaj = parseInt(params["odabraniIzvestaj"]);
        var pdfFile = null;
        switch(izvestaj) {
            case 0:
                pdfFile = balanceSheet.savePdf(
                    params["periodBilansStanja"],
                    params["maticniBroj"],
                    params["sifraDelatnosti"],
                    params["pib"]
                );
                break;
            case 1:
                pdfFile = incomeStatement.savePdf(
                    params["bilansUspehaPeriodOd"],
                    params["bilansUspehaPeriodDo"],
                    params["maticniBroj"],
                    params["sifraDelatnosti"],
                    params["pib"]
                );
                break;
            case 2:
                pdfFile = ioor.savePdf(
                    params["bilansUspehaPeriodOd"],
                    params["bilansUspehaPeriodDo"],
                    params["maticniBroj"],
                    params["sifraDelatnosti"],
                    params["pib"]
                )
                break;
            case 3:
                // TODO
                break;
            case 4:
                // TODO
                break;
            case 5:
                // TODO
                break;
            default:
                return "No File";
        }

        return pdfFile;
    }

    function onRequest(context) {

        var params = {
            odabraniIzvestaj: context.request.parameters.odabraniIzvestaj,
            periodBilansStanja : context.request.parameters.periodBilansStanja,
            bilansUspehaPeriodOd : context.request.parameters.bilansUspehaPeriodOd,
            bilansUspehaPeriodDo : context.request.parameters.bilansUspehaPeriodDo,
            maticniBroj : context.request.parameters.maticniBroj,
            sifraDelatnosti : context.request.parameters.sifraDelatnosti,
            pib : context.request.parameters.pib
        };

        context.response.writeFile({
            file: returnPdfFile(params)
        });
        
        // context.response.write({
        //     output: JSON.stringify(returnPdfFile(params))
        // });

    }

    return {
        onRequest: onRequest
    };
});
