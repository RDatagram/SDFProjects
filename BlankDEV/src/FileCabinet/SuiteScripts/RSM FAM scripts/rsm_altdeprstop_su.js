/**
 *@NApiVersion 2.x
 *@NScriptType Suitelet
 *
 * Sets 'Depreciation Active' field value to False for each FAM Alternate Depreciation record 
 * where it's FAM Asset parent record has depreciation status set to 'Fully Depreciated' (Depreciation has ended).
 *
 */
define(["N/search", "N/http", "N/record", "N/util", "N/log"], function (search, http, record, util, log) {

  /**
   * Create FAM Alternate Depreciation object form resultSet
   * @param {search.ResultSet} searchResults NetSuite search.ResultSet object 
   * @returns {object} 
   */
  function createAltDeprObject(searchResults) {
    var obj = {};
    var results = [],
      start = 0,
      end = 1000;

    // Fix for search.ResultSet.forEach limit
    while (true) {
      var tempList = searchResults.getRange({
        start: start,
        end: end
      });

      if (tempList.length === 0) {
        break;
      }

      Array.prototype.push.apply(results, tempList);
      start += 1000;
      end += 1000;
    }

    util.each(results, function (result) {
      var parentId = result.getValue("custrecord_altdeprasset");

      if (!parentId) {
        return true;
      }

      if (!obj.hasOwnProperty(parentId)) {
        obj[parentId] = {
          "id": result.getValue("internalid"),
        }
        return true;
      }
    });

    return obj;
  }

  // Suitelet script entry-point function
  function onRequest(context) {
    var error = false;
    var responseMessage = JSON.stringify({
      "type": "Confirmation",
      "title": "Uspesno!",
      "content": "Poreska amortizacija je stopirana kod sredstava cija je racunovodstvena amortizacija zavrsena"
    });

    // Create and run FAM Asset saved search
    var assetResultSet = search.create({
      type: "customrecord_ncfar_asset",
      filters: [],
      columns:
        [
          "internalid",
          "name",
          "custrecord_rsm_fam_grupa_sredstva",
          "custrecord_assetstatus",
          "custrecord_assetlifetime",
          "custrecord_assetpurchasedate",
          "custrecord_assetdeprrules"
        ]
    }).run();

    var results = [],
      start = 0,
      end = 1000;

    // This fixes the Results.each() limit of 4000 results
    while (true) {
      // getRange returns an array of Result objects
      var tempList = assetResultSet.getRange({
        start: start,
        end: end
      });

      if (tempList.length === 0) {
        break;
      }

      // Push tempList results into results array
      Array.prototype.push.apply(results, tempList);
      start += 1000;
      end += 1000;
    }

    // Create and run FAM Alternate Depreciation search
    var altDeprResultSet = search.create({
      type: "customrecord_ncfar_altdepreciation",
      filters: [],
      columns: [
        "internalid",
        "custrecord_altdeprasset"
      ]
    }).run();
    // Create FAM Alternate Depreciation object from ResultSet
    var altDeprObjs = createAltDeprObject(altDeprResultSet);

    util.each(results, function (asset) {
      var assetInternalId = asset.getValue("internalid");
      var status = asset.getText("custrecord_assetstatus");
      var purchaseDate = asset.getValue("custrecord_assetpurchasedate");
      var assetGroup = asset.getText('custrecord_rsm_fam_grupa_sredstva');

      if (!purchaseDate) {
        return true;
      }

      if (assetGroup === 'PoA' && status === "Fully Depreciated") {
        try {
          var altDeprRecord = record.load({
            type: "customrecord_ncfar_altdepreciation",
            id: altDeprObjs[assetInternalId]["id"]
          });

          var deprActive = altDeprRecord.getText({
            fieldId: "custrecord_altdepr_depractive"
          });

          if (deprActive !== "False") {
            altDeprRecord.setText({
              fieldId: "custrecord_altdepr_depractive",
              text: "False"
            });

            altDeprRecord.save();
          }
        } catch (err) {
          log.error("Error", "Could not load record!\nErr: " + err);
          error = true;
        }
      }

      return true;
    });

    if (error) {
      responseMessage = JSON.stringify({
        "type": "Error",
        "title": "Greska!",
        "content": "Doslo je do greske prilikom pristupanja odredjenom rekordu ili rekordima i poreska amortizacija nije stopirana za iste.<br/>" +
        "Proverite Execution log-ove za ovu skriptu za vise informacija."
      });
    }

    // Redirect back to the form
    context.response.sendRedirect({
      type: http.RedirectType.SUITELET,
      identifier: 'customscript_altdeprstop_form_su',
      id: 'customdeploy_altdeprstop_form_su',
      parameters: {
        message: responseMessage
      }
    });

  }

  return {
    onRequest: onRequest
  };
}); 