/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 * 
 * Blagajna
 * Take the received parameters and export the required pulled data to PDF
 */
define(['N/ui/serverWidget', 'N/search', 'N/file', 'N/render', 'N/encode', 'N/log', 'N/ui/message', 'N/http', 'N/util', "N/record", "N/url"], function (serverWidget, search, file, render, encode, log, message, http, util, record, url) {

  // Suitelet entry point function
  function onRequest(context) {

    function formatCurrency(value) {
      if (!value && value === '' && value === ' ') {
        return value;
      }
      var sign = '', decimalPart = '';
      try {
        sign = value.match(/\-/g)[0];
        value = value.replace(sign, '');
      } catch (error) {
      }
      try {
        decimalPart = value.match(/\..+/g)[0];
        value = value.replace(decimalPart, '');
      } catch (error) {
      }
      var newValue = '';
      for (var i = value.length - 1, j = 0; i >= 0; i--, j++) {
        if (j % 3 == 0) {
          newValue = newValue !== '' ? ',' + newValue : newValue;
          newValue = value[i] + newValue;
        } else {
          newValue = value[i] + newValue;
        }
      }
      return sign + newValue + decimalPart;
    }

    // Get parameters
    var exportType = context.request.parameters.exportType;
    var subsidiaryId = context.request.parameters.subsidiaryId;
    var onDate = context.request.parameters.onDate;

    // Pull entries from the journals that satisfy given parameters
    var searchResults = search.create({
      type: search.Type.TRANSACTION,
      columns: ["account", "debitamount", "creditamount", "name", "memo", "tranid", "taxamount", "custbody_rsm_blagajna_prethodno_stanje"],
      filters: [
        ["subsidiary", "is", subsidiaryId],
        "AND",
        ["trandate", search.Operator.ON, onDate],
        "AND",
        ["custbody_rsm_blagajna_checkbox", "is", "T"]
      ]
    }).run();
    //context.response.writeLine("Search Data: " + JSON.stringify(searchResults.getRange({ start: 0, end: 100 }), null, 2));

    var extractedLines = [];
    var counter = 1;
    function addData(result, accountNumber, lineTypeMatches) {

      var debitamount = result.getValue('debitamount');
      var creditamount = result.getValue('creditamount');
      // In cases where tax is applied to the fields "debitamount" and "creditamount" calculate the full value we need instead
      if (result.getValue('taxamount')) {
        if (debitamount) {
          debitamount = (Math.abs(parseFloat(result.getValue('taxamount'))) + parseFloat(debitamount)).toFixed(2);
        } else if (creditamount) {
          creditamount = (Math.abs(parseFloat(result.getValue('taxamount'))) + parseFloat(creditamount)).toFixed(2);
        }
      }

      extractedLines.push({
        customId: counter,
        pairedWith: false,
        accountNumber: accountNumber,
        account: result.getText('account'),
        debitamount: debitamount,
        creditamount: creditamount,
        name: result.getText('name'),
        memo: result.getValue('memo'),
        tranid: result.getValue('tranid'),
        prethodnoStanje: result.getValue('custbody_rsm_blagajna_prethodno_stanje'),
        lineTypeMatches: lineTypeMatches
      });

      counter++;
    }
    // Iterate through the found journal lines and add the required ones to the extractedLines object
    searchResults.each(function (result) {

      // Return only the first batch of numbers from a string ("243 2 test 84648" => "243")
      var accountNumber = result.getText('account').replace(/(^\d+)(.+$)/i, '$1');

      if (
        (accountNumber.substr(0, 3) == "243" && result.getValue('debitamount')) ||
        ((accountNumber.substr(0, 3) == "241" || accountNumber.substr(0, 3) == "221" || accountNumber[0] == "6") && result.getValue('creditamount'))
      ) {
        if (exportType == "uplatnica" || exportType == "glavna") {
          addData(result, accountNumber, true);
        } else {
          addData(result, accountNumber, false);
        }
      }

      if (
        (accountNumber.substr(0, 3) == "243" && result.getValue('creditamount')) ||
        ((accountNumber.substr(0, 3) == "241" || accountNumber.substr(0, 3) == "221" || accountNumber.substr(0, 3) == "463" || accountNumber[0] == "5") && result.getValue('debitamount'))
      ) {
        if (exportType == "isplatnica" || exportType == "glavna") {
          addData(result, accountNumber, true);
        } else {
          addData(result, accountNumber, false);
        }
      }

      return true
    });

    // Find pairs among the extracted lines from the journal and merge them into one to print as a single line in PDF
    var jsonData = {
      subsidiary: "",
      address: "",
      pib: 0,
      logoUrl: "",
      date: "",
      numeracijaJournala: "",
      nazivKonta: "",
      ukupnoUplata: 0,
      ukupnoIsplata: 0,
      stanje: 0,
      prethodnoStanje: 0,
      lines: [],
      linesByName: []
    };
    var pairId = 0;
    var kontoNumber = false;
    var journalsIdString = "";
    for (var i = 0; i < extractedLines.length; i++) {
      for (var j = 0; j < extractedLines.length; j++) {

        // Check if: 1. Both amounts are the same (credit A = debit B or reverse (or empty)),
        // 2. the names are the same,
        // 3. It's not the same object,
        // 4. If both objects don't already have a pair
        if (
          (extractedLines[i].debitamount == extractedLines[j].creditamount && extractedLines[i].creditamount == extractedLines[j].debitamount) &&
          extractedLines[i].name == extractedLines[j].name &&
          extractedLines[i].customId != extractedLines[j].customId &&
          !extractedLines[i].pairId && !extractedLines[j].pairId
        ) {
          if (extractedLines[i].accountNumber.substr(0, 3) == "243") {
            var mergedObject = {};

            // Only set kontoNumber and prethodnoStanje on the first pair found here because they will always be the same and also you can only get kontoNumber in here
            if (!pairId) {
              kontoNumber = extractedLines[i].accountNumber;
              jsonData.prethodnoStanje = extractedLines[i].prethodnoStanje;
            }

            // Add every unique Journal ID to the variable to put as the title of the PDF document later
            if (journalsIdString.indexOf(extractedLines[j].tranid) == -1) {
              journalsIdString += " - J" + extractedLines[j].tranid;
            }

            // PDF lines
            mergedObject.oznaka = "J" + extractedLines[j].tranid + "/" + (pairId + 1);
            mergedObject.opis = extractedLines[j].memo;
            mergedObject.ime = extractedLines[i].name;
            mergedObject.uplata = extractedLines[j].creditamount ? formatCurrency(parseFloat(extractedLines[j].creditamount).toFixed(2)) : "0.00";
            mergedObject.isplata = extractedLines[j].debitamount ? formatCurrency(parseFloat(extractedLines[j].debitamount).toFixed(2)) : "0.00";
            mergedObject.accountNumber = extractedLines[j].accountNumber;

            jsonData.ukupnoUplata += +extractedLines[j].creditamount;
            jsonData.ukupnoIsplata += +extractedLines[j].debitamount;

            extractedLines[i].pairedWith = extractedLines[j].customId;
            extractedLines[j].pairedWith = extractedLines[i].customId;

            // Only save the line if the exportType required matches with the line type (do the previous calculations just so the incremental data is consistent throughout the journal, "oznaka" for example)
            if (extractedLines[i].lineTypeMatches) {

              jsonData.lines.push(mergedObject);

              // Group lines in another array by name as well (but still separate those without a name)
              function addToNewGroup(groupedByName) {
                jsonData.linesByName.push({
                  groupedByName: groupedByName,
                  groupUkupnoUplata: +extractedLines[j].creditamount,
                  groupUkupnoIsplata: +extractedLines[j].debitamount,
                  linesByNameLines: [mergedObject]
                });
              }
              if (extractedLines[i].name === "") {
                addToNewGroup(extractedLines[j].memo);
              } else {
                var nameFound = false;
                for (var k = 0; k < jsonData.linesByName.length; k++) {
                  if (jsonData.linesByName[k].groupedByName === extractedLines[i].name) {

                    // Add credit/debit to local line's ukupno
                    jsonData.linesByName[k].groupUkupnoUplata += +extractedLines[j].creditamount;
                    jsonData.linesByName[k].groupUkupnoIsplata += +extractedLines[j].debitamount;

                    jsonData.linesByName[k].linesByNameLines.push(mergedObject);
                    nameFound = true;
                    break;

                  }
                }
                if (!nameFound) {
                  addToNewGroup(extractedLines[i].name);
                }
              }

            }

            pairId++;
            break;
          }
        }

      }
    }
    // Get objects without pairs for logging
    var noPair = [];
    for (var i in extractedLines) {
      if (!extractedLines[i].pairedWith) {
        noPair.push(extractedLines[i]);
      }
    }

    // Only if there are lines to print fill up the rest of the data and continue
    if (jsonData.lines.length) {

      var subsidiaryRecord = record.load({
        type: "subsidiary",
        id: subsidiaryId
      });
      jsonData.subsidiary = subsidiaryRecord.getText("legalname");
      jsonData.address = subsidiaryRecord.getSubrecord("mainaddress").getValue("addr1");
      jsonData.pib = subsidiaryRecord.getText("federalidnumber");

      var domain = url.resolveDomain({
        hostType: url.HostType.APPLICATION
      });
      var logoUrl = file.load({
        id: subsidiaryRecord.getValue({ fieldId: 'logo' })
      }).url;
      jsonData.logoUrl = 'https://' + domain + logoUrl.replace(/&/g, '&amp;');

      jsonData.date = onDate + ".";
      jsonData.numeracijaJournala = exportType == "glavna" ? "Dnevnik glavne blagajne" + journalsIdString : exportType[0].toUpperCase() + exportType.substr(1) + journalsIdString;
      jsonData.nazivKonta = search.create({ type: "account", columns: "name", filters: ["number", "is", kontoNumber] }).run().getRange(0, 1)[0].getValue("name");

      jsonData.stanje = +jsonData.prethodnoStanje + jsonData.ukupnoUplata - jsonData.ukupnoIsplata;

      // Fix format of the main object
      jsonData.ukupnoUplata = formatCurrency(parseFloat(jsonData.ukupnoUplata).toFixed(2));
      jsonData.ukupnoIsplata = formatCurrency(parseFloat(jsonData.ukupnoIsplata).toFixed(2));
      jsonData.stanje = formatCurrency(parseFloat(jsonData.stanje).toFixed(2));
      jsonData.prethodnoStanje = formatCurrency(parseFloat(jsonData.prethodnoStanje).toFixed(2));
      // Fix format of the "linesByName" array values
      for (var k = 0; k < jsonData.linesByName.length; k++) {
        jsonData.linesByName[k].groupUkupnoUplata = formatCurrency(parseFloat(jsonData.linesByName[k].groupUkupnoUplata).toFixed(2));
        jsonData.linesByName[k].groupUkupnoIsplata = formatCurrency(parseFloat(jsonData.linesByName[k].groupUkupnoIsplata).toFixed(2));
      }

      // context.response.writeLine("DEBUG: " + ",\nparams: " + exportType + " " + subsidiaryId + " " + onDate + "\nextractedLines: " + JSON.stringify(extractedLines, null, 2) + ", noPair: " + JSON.stringify(noPair, null, 2) + ",\njsonData: " + JSON.stringify(jsonData, null, 2));

      // Load the required template, fill it up with data and then download it as PDF
      var renderer = render.create();
      renderer.addCustomDataSource({
        format: render.DataSource.OBJECT,
        alias: "JSON",
        data: jsonData
      });
      if (exportType === "glavna") {
        renderer.setTemplateByScriptId("CUSTTMPL_RSM_BLAGAJNA");
      } else if (exportType === "isplatnica") {
        renderer.setTemplateByScriptId("CUSTTMPL_RSM_ISPLATNICA");
      } else if (exportType === "uplatnica") {
        renderer.setTemplateByScriptId("CUSTTMPL_RSM_UPLATNICA");
      }
      var pdfFile = renderer.renderAsPdf();

      var separator = " - ";
      pdfFile.name = "Blagajna" + separator + exportType + separator + jsonData.subsidiary + separator + onDate + ".pdf";

      context.response.writeFile(pdfFile);
    } else {

      // If no journal entries are found send back a response to display a dialog
      if (!searchResults.length) {

        context.response.sendRedirect({
          type: http.RedirectType.SUITELET,
          identifier: "customscript_rsm_blagajna_form_su",
          id: "customdeploy_rsm_blagajna_form_su",
          parameters: { errorMessage: "No journal entries found!" }
        });

      }

    }

  }

  return {
    onRequest: onRequest,
  };

});