/**
 *@NApiVersion 2.x
 *@NScriptType ScheduledScript
 *
 * Sets 'Depreciation Active' field value to False for each FAM Alternate Depreciation record 
 * where it's FAM Asset parent record has depreciation status set to 'Fully Depreciated' (Depreciation has ended).
 *
 */
define(["N/search", "N/record", "N/util", "N/log"], function (search, record, util, log) {

  // Create FAM Alternate Depreciation object form resultSet
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

  function execute(context) {

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

    // Fix for search.ResultSet.forEach limit
    var results = [],
      start = 0,
      end = 1000;

    while (true) {
      var tempList = assetResultSet.getRange({
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

    // FAM Alternate Depreciation search
    var altDeprResultSet = search.create({
      type: "customrecord_ncfar_altdepreciation",
      filters: [],
      columns: [
        "internalid",
        "custrecord_altdeprasset"
      ]
    }).run();

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
        } catch (e) {
          log.error("Error", "Could not load record!");
        }

      }

      return true;
    });

  }

  return {
    execute: execute
  };
}); 