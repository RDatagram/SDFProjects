/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * 
 * This Suitelet script generates XLS file which represents OA1 Asset amortization report form.
 * 
 * The script depends on custom dateUtil module and it needs to be stored in the same directory with it. 
 * 
 * Variables:
 * 
 * ukupnaispravka - total depreciation
 * 
 */

define(["N/search", "N/util", "N/file", "N/encode", "N/log", "./dateUtil"], function (search, util, file, encode, log, dateUtil) {

  var calculatedAssets = [];
  var dUtil = dateUtil.dateUtil;

  // function createMessage(type, title, content) {
  //   var message = {
  //     "type": type,
  //     "title": title,
  //     "content": content
  //   };
  //   return JSON.stringify(message);
  // }

  /**
   * Helper function which calculates number of months in deprreciation period for which asset has beed used
   * @param {object} paramObj
   */
  function getNumberOfMonthsOfUse(paramObj) {
    var result = null;
    if (paramObj.deprStartYear === paramObj.year && paramObj.asset.disposaldate === '') {
      result = 13 - dUtil.getMonth(paramObj.deprStartDate);
    } else if (
      paramObj.deprStartYear === paramObj.year &&
      paramObj.asset.disposaldate !== '' &&
      dUtil.getYear(paramObj.asset.disposaldate) === paramObj.year
    ) {
      result = dUtil.getMonth(paramObj.asset.disposaldate) - dUtil.getMonth(paramObj.deprStartDate);
    } else if (paramObj.deprStartYear < paramObj.year && paramObj.asset.disposaldate === '') {
      result = 12;
    } else if (
      paramObj.deprStartYear < paramObj.year &&
      paramObj.asset.disposaldate !== '' &&
      dUtil.getYear(paramObj.asset.disposaldate) === paramObj.year
    ) {
      result = dUtil.getMonth(paramObj.asset.disposaldate) - 1;
    } else if (paramObj.deprStartYear > paramObj.year) {
      result = 0;
    } else if (paramObj.asset.disposaldate !== '' && dUtil.getYear(paramObj.asset.disposaldate) < paramObj.year) {
      result = 0;
    }
    return result;
  }

  /**
   * Asset depreciation history saves search
   * @param {object} params contains startDate and endDate values
   * @returns {search.ResultSet} NetSuite search.ResultSet object
   */
  function deprHistSearch(params) {
    var customrecord_ncfar_deprhistorySearchObj = search.create({
      type: "customrecord_ncfar_deprhistory",
      filters:
        [
          ["custrecord_deprhistasset.id", "isnotempty", ""],
          "AND",
          ["custrecord_deprhistaltmethod", "noneof", "@NONE@"],
          "AND",
          ["custrecord_deprhistasset.custrecord_assetinclreports", "is", "T"],
          "AND",
          ["isinactive", "is", "F"],
          "AND",
          ["custrecord_deprhistasset.isinactive", "is", "F"],
          "AND",
          ["custrecord_deprhistassettype", "anyof", "@ALL@"],
          "AND",
          ["custrecord_deprhistdate", "within", params.startDate, params.endDate],
          "AND",
          ["formulanumeric: CASE WHEN {custrecord_deprhistassettype}={custrecord_deprhistasset.custrecord_assettype} THEN 1 ELSE 0 END", "equalto", "1"],
          "AND",
          ["formulanumeric: CASE WHEN NVL({custrecord_deprhistassetslave.custrecord_slavecurrentage},0) < {custrecord_deprhistcurrentage} THEN 1 ELSE 0 END", "equalto", "0"],
          "AND",
          ["formulanumeric: CASE WHEN {custrecord_deprhistdate} > {custrecord_deprhistassetslave.custrecord_slavelastdeprdate} THEN 1 ELSE 0 END", "equalto", "0"],
          "AND",
          ["custrecord_deprhistory_schedule", "is", "F"],
          "AND",
          ["custrecord_deprhistasset.custrecord_rsm_fam_grupa_sredstva", "anyof", "1"],
          "AND",
          ["custrecord_deprhistsubsidiary", "is", params.selectedSubsidiary]
        ],
      columns:
        [
          search.createColumn({
            name: "internalid",
            join: "CUSTRECORD_DEPRHISTASSET",
            summary: "GROUP",
            label: "INTERNALID"
          }),
          search.createColumn({
            name: "custrecord_deprhistassettype",
            summary: "GROUP",
            sort: search.Sort.ASC,
            label: "TYPE"
          }),
          search.createColumn({
            name: "name",
            join: "CUSTRECORD_DEPRHISTASSET",
            summary: "GROUP",
            sort: search.Sort.ASC,
            label: "ID"
          }),
          search.createColumn({
            name: "altname",
            join: "CUSTRECORD_DEPRHISTASSET",
            summary: "GROUP",
            label: "NAME"
          }),
          search.createColumn({
            name: "custrecord_assetstatus",
            join: "CUSTRECORD_DEPRHISTASSET",
            summary: "GROUP",
            label: "STATUS"
          }),
          search.createColumn({
            name: "custrecord_assetdeprstartdate",
            join: "CUSTRECORD_DEPRHISTASSET",
            summary: "GROUP",
            sort: search.Sort.ASC,
            label: "IN SERVICE"
          }),
          search.createColumn({
            name: "custrecord_assetlifetime",
            join: "CUSTRECORD_DEPRHISTASSET",
            summary: "GROUP",
            label: "AL"
          }),
          search.createColumn({
            name: "formulacurrencyoc",
            summary: "SUM",
            formula: "MAX({custrecord_deprhistasset.custrecord_assetcost})",
            label: "OC"
          }),
          search.createColumn({
            name: "formulacurrencyacq",
            summary: "SUM",
            formula: "CASE WHEN {custrecord_deprhisttype.ID} = 1 THEN {custrecord_deprhistamount} ELSE 0 END",
            label: "ACQ"
          }),
          search.createColumn({
            name: "formulacurrencydepr",
            summary: "SUM",
            formula: "CASE WHEN {custrecord_deprhisttype.ID} = 2 THEN {custrecord_deprhistamount} ELSE 0 END",
            label: "DEPR"
          }),
          search.createColumn({
            name: "formulacurrencyreval",
            summary: "SUM",
            formula: "CASE WHEN {custrecord_deprhisttype.ID} = 5 THEN {custrecord_deprhistamount} ELSE 0 END",
            label: "REVAL"
          }),
          search.createColumn({
            name: "formulacurrencywd",
            summary: "SUM",
            formula: "CASE WHEN {custrecord_deprhisttype.ID} = 4 THEN {custrecord_deprhistamount} ELSE 0 END",
            label: "WD"
          }),
          search.createColumn({
            name: "formulacurrencysale",
            summary: "SUM",
            formula: "CASE WHEN ({custrecord_deprhistasset.custrecord_assetdisposaltype.ID} = 1 and                                               {custrecord_deprhisttype.ID} = 3) or {custrecord_deprhisttype.ID} = 6                                               THEN {custrecord_deprhistamount} ELSE 0 END",
            label: "SALE"
          }),
          search.createColumn({
            name: "formulacurrencydisp",
            summary: "SUM",
            formula: "CASE WHEN ({custrecord_deprhistasset.custrecord_assetdisposaltype.ID} = 2 and                                              {custrecord_deprhisttype.ID} = 3) or {custrecord_deprhisttype.ID} = 7                                              THEN {custrecord_deprhistamount} ELSE 0 END",
            label: "DISP"
          }),
          search.createColumn({
            name: "formulacurrencynbv",
            summary: "MIN",
            formula: "CASE WHEN {custrecord_deprhisttype} = 'Acquisition' THEN {custrecord_deprhistamount} ELSE {custrecord_deprhistbookvalue} END",
            label: "NBV"
          }),
          search.createColumn({
            name: "formulacurrencyukupnaispravka",
            summary: "SUM",
            formula: "MAX({custrecord_deprhistasset.custrecord_assetcost} - {custrecord_deprhistbookvalue})",
            label: "Ukupna ispravka vrednosti "
          }),
          search.createColumn({
            name: "custrecord_assetdeprrules",
            join: "CUSTRECORD_DEPRHISTASSET",
            summary: "GROUP",
            label: "Depreciation Rules"
          }),
          search.createColumn({
            name: "custrecord_assetpurchasedate",
            join: "CUSTRECORD_DEPRHISTASSET",
            summary: "GROUP",
            label: "Purchase Date"
          }),
          search.createColumn({
            name: "custrecord_assetdeprstartdate",
            join: "CUSTRECORD_DEPRHISTASSET",
            summary: "GROUP",
            label: "Depreciation Start Date"
          }),
          search.createColumn({
            name: "custrecord_assetdisposaldate",
            join: "CUSTRECORD_DEPRHISTASSET",
            summary: "GROUP",
            label: "Disposal Date"
          }),
          search.createColumn({
            name: "custrecord_assetaccmethod",
            join: "CUSTRECORD_DEPRHISTASSET",
            summary: "GROUP",
            label: "Depreciation Method"
          }),
          search.createColumn({
            name: "custrecord_rsm_fam_grupa_sredstva",
            join: "CUSTRECORD_DEPRHISTASSET",
            summary: "GROUP",
            label: "RSM Grupa sredstva"
          })
        ]
    });
    return customrecord_ncfar_deprhistorySearchObj.run();
  }

  /**
   * Create asset object from asset saved search results
   * @param {search.ResultSet} searchResults NetSuite search.ResultSet object
   * @returns {object} Asset depreciation history object with column results as properties
   */
  function createAssetObject(searchResults) {
    var obj = {};
    var results = [],
      start = 0,
      end = 1000;

    // This fixes the Results.each() limit of 4000 results
    while (true) {
      // getRange returns an array of Result objects
      var tempList = searchResults.getRange({
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

    // Go through each result in results array and create a new object property for that result (Asset)
    util.each(results, function (result) {
      obj[result.getValue({ name: 'name', summary: 'GROUP', join: 'CUSTRECORD_DEPRHISTASSET' })] = {
        id: result.getValue({ name: 'internalid', join: 'CUSTRECORD_DEPRHISTASSET', summary: 'GROUP' }),
        name: result.getValue({ name: 'name', summary: 'GROUP', join: 'CUSTRECORD_DEPRHISTASSET' }),
        type: result.getText({ name: 'custrecord_deprhistassettype', summary: 'GROUP' }),
        altname: result.getValue({ name: 'altname', join: 'CUSTRECORD_DEPRHISTASSET', summary: 'GROUP' }),
        status: result.getText({ name: 'custrecord_assetstatus', join: 'CUSTRECORD_DEPRHISTASSET', summary: 'GROUP' }),
        inservice: result.getValue({ name: 'custrecord_assetdeprstartdate', join: 'CUSTRECORD_DEPRHISTASSET', summary: 'GROUP' }),
        al: parseInt(result.getValue({ name: 'custrecord_assetlifetime', join: 'CUSTRECORD_DEPRHISTASSET', summary: 'GROUP' })),
        oc: parseFloat(result.getValue({ name: 'formulacurrencyoc', summary: 'SUM' })),
        acq: parseFloat(result.getValue({ name: 'formulacurrencyacq', summary: 'SUM' })),
        depr: parseFloat(result.getValue({ name: 'formulacurrencydepr', summary: 'SUM' })),
        reval: parseFloat(result.getValue({ name: 'formulacurrencyreval', summary: 'SUM' })),
        wd: parseFloat(result.getValue({ name: 'formulacurrencywd', summary: 'SUM' })),
        sale: parseFloat(result.getValue({ name: 'formulacurrencysale', summary: 'SUM' })),
        disp: parseFloat(result.getValue({ name: 'formulacurrencydisp', summary: 'SUM' })),
        nbv: parseFloat(result.getValue({ name: 'formulacurrencynbv', summary: 'MIN' })),
        ukupnaispravka: parseFloat(result.getValue({ name: 'formulacurrencyukupnaispravka', summary: 'SUM' })),
        deprrule: result.getText({ name: 'custrecord_assetdeprrules', join: 'CUSTRECORD_DEPRHISTASSET', summary: 'GROUP' }),
        purchasedate: result.getValue({ name: 'custrecord_assetpurchasedate', join: 'CUSTRECORD_DEPRHISTASSET', summary: 'GROUP' }),
        deprstartdate: result.getValue({ name: 'custrecord_assetdeprstartdate', join: 'CUSTRECORD_DEPRHISTASSET', summary: 'GROUP' }),
        disposaldate: result.getValue({ name: 'custrecord_assetdisposaldate', join: 'CUSTRECORD_DEPRHISTASSET', summary: 'GROUP' }),
        deprmethod: result.getText({ name: 'custrecord_assetaccmethod', join: 'CUSTRECORD_DEPRHISTASSET', summary: 'GROUP' }),
        assetgroup: result.getText({ name: 'custrecord_rsm_fam_grupa_sredstva', join: 'CUSTRECORD_DEPRHISTASSET', summary: 'GROUP' })
      }
      return true;
    });
    return obj;
  }

  /**
   * Disposed assets saved search - assets with alternate method 
   * @param {object} params contains startDate and endDate values
   * @returns {search.ResultSet} NetSuite search.ResultSet object
   */
  function disposedAssetsSS(params) {
    return search.create({
      type: "customrecord_ncfar_deprhistory",
      filters:
        [
          ["custrecord_deprhistaltmethod", "noneof", "@NONE@"],
          "AND",
          ["custrecord_deprhistasset", "noneof", "@NONE@"],
          "AND",
          // This is internal id - it's not good because status 'Disposed' can have different internal id in different environment (different accaount)
          ["custrecord_deprhistasset.custrecord_assetstatus", "anyof", "4"],
          "AND",
          ["custrecord_deprhisttype", "anyof", "2"], // This is also internal id - not good
          "AND",
          ["custrecord_deprhistory_summjournal", "anyof", "@NONE@"],
          "AND",
          ["custrecord_deprhistasset.custrecord_assetdisposaldate", "within", params.startDate, params.endDate],
          "AND",
          ["custrecord_deprhistasset.custrecord_rsm_fam_grupa_sredstva", "anyof", "1"],
          "AND",
          ["custrecord_deprhistsubsidiary", "is", params.selectedSubsidiary]
        ],
      columns:
        [
          search.createColumn({
            name: "name",
            join: "CUSTRECORD_DEPRHISTASSET",
            summary: "GROUP",
            label: "ID"
          }),
          search.createColumn({
            name: "custrecord_assetcost",
            join: "CUSTRECORD_DEPRHISTASSET",
            summary: "MAX",
            label: "Asset Original Cost"
          }),
          search.createColumn({
            name: "formulanumeric",
            summary: "SUM",
            formula: "MAX({custrecord_deprhistaltdepr.custrecord_altdepr_originalcost})+MIN({custrecord_deprhistamount})",
            label: "NBV on disposal date"
          }),
          search.createColumn({
            name: "formulacurrency",
            summary: "SUM",
            formula: "MAX({custrecord_deprhistaltdepr.custrecord_altdepr_originalcost}) - (MAX({custrecord_deprhistaltdepr.custrecord_altdepr_originalcost}) + MIN({custrecord_deprhistamount}))",
            label: "Total accumulated depr. on disposal date"
          })
        ]
    }).run();
  }

  /**
   * Creates an object of asset depreciation history results - disposed asset depreciation history
   * @param {search.ResultSet} results NetSuite search.ResultSet object
   * @returns {object} Asset depreciation history object with column results as properties
   */
  function disposedToObj(results) {
    var obj = {};
    results.each(function (result) {
      obj[result.getValue({ name: 'name', summary: 'GROUP', join: 'CUSTRECORD_DEPRHISTASSET' })] = {
        name: result.getValue({ name: 'name', summary: 'GROUP', join: 'CUSTRECORD_DEPRHISTASSET' }),
        oc: parseFloat(result.getValue({ name: 'custrecord_assetcost', summary: 'MAX', join: 'CUSTRECORD_DEPRHISTASSET' })),
        nbvDisposal: parseFloat(result.getValue({ name: 'formulanumeric', summary: 'SUM' })),
        totalDepr: parseFloat(result.getValue({ name: 'formulacurrency', summary: 'SUM' }))
      }
      return true;
    });
    return obj;
  }

  /**
   * Process assets 
   * @param {object} assets object created using saved search results 
   * @param {object} disposedAssets object created using saved search results
   * @param {object} assetsPrevYear object created using saved search results
   * @param {Number} year year for which we generate report
   */
  function processAssets(assets, disposedAssets, assetsPrevYear, year) {
    util.each(assets, function (asset) {
      // Resolve depreciation start date and year
      var deprStartDate = dUtil.resolveDepreciationStartDate(asset.deprrule, asset.deprstartdate);
      var deprStartYear = dUtil.getYear(deprStartDate);
      // Resolve number of months in depreciation period for which asset has been used
      var numberOfMonthsOfUseInPeriod = getNumberOfMonthsOfUse({
        deprStartYear: deprStartYear,
        deprStartDate: deprStartDate,
        year: year,
        asset: asset
      });

      // Set depreciation in period
      var depr = null;
      if (asset.disposaldate === '') {
        depr = asset.depr;
      } else if (asset.disposaldate !== '' && deprStartYear === year) {
        depr = disposedAssets[asset.name].totalDepr;
      } else if (asset.disposaldate !== '' && deprStartYear !== year) {
        depr = asset.depr + disposedAssets[asset.name].totalDepr;
      }

      // Set total depreciation and nbv values
      var field9 = (assetsPrevYear[asset.name]) ?
        assetsPrevYear[asset.name].ukupnaispravka + depr :
        asset.ukupnaispravka + depr;
      var field10 = asset.oc - field9;

      if (asset.disposaldate !== '' && dUtil.getYear(asset.disposaldate) === year) {
        field9 = 0; field10 = 0;
      }
      if (asset.disposaldate !== '' && dUtil.getYear(asset.disposaldate) < year) {
        depr = 0; field9 = 0; field10 = 0;
      }

      var field4 = (assetsPrevYear[asset.name]) ? assetsPrevYear[asset.name].ukupnaispravka : 0;
      var field5 = (assetsPrevYear[asset.name]) ? assetsPrevYear[asset.name].nbv : asset.oc - field4;

      // Push calculated values into the calculatedAssets array
      calculatedAssets.push({
        "id": asset.id,
        "field2": asset.name,
        "field3": asset.oc, // purchase amount
        "field4": Math.round(field4), // total depreciation
        "field5": Math.round(field5), // prior year nbv
        "field6": numberOfMonthsOfUseInPeriod, // number of months of use in current period
        "field7": '2.5%', // rate
        "field8": Math.round(depr), // depreciation amount in period
        "field9": Math.round(field9), // recalculating total depreciation 
        "field10": Math.round(field10), // current year nbv
      });
      return true;
    });
  }

  /**
   * Generate XLS file and return it as suitescript File object
   * @param {Number} year year for which we generate report
   */
  function createXlsFile(year) {
    var xmlString = '<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>';
    xmlString += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" ';
    xmlString += 'xmlns:o="urn:schemas-microsoft-com:office:office" ';
    xmlString += 'xmlns:x="urn:schemas-microsoft-com:office:excel" ';
    xmlString += 'xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet" ';
    xmlString += 'xmlns:html="http://www.w3.org/TR/REC-html40">';

    xmlString += '<Worksheet ss:Name="OA1">';
    xmlString += '<Table>' +
      '<Row>' +
      '<Cell><Data ss:Type="String"> Id </Data></Cell>' +
      '<Cell><Data ss:Type="String"> Stalno sredstvo </Data></Cell>' +
      '<Cell><Data ss:Type="String"> Nabavna vrednost </Data></Cell>' +
      '<Cell><Data ss:Type="String"> Ispravka vrednosti </Data></Cell>' +
      '<Cell><Data ss:Type="String"> Neotpisana vrednost (3-4) </Data></Cell>' +
      '<Cell><Data ss:Type="String"> Broj meseci koriscenja </Data></Cell>' +
      '<Cell><Data ss:Type="String"> Stopa % </Data></Cell>' +
      '<Cell><Data ss:Type="String"> Obracunata amortizacija (3*6*7/12) </Data></Cell>' +
      '<Cell><Data ss:Type="String"> Ispravka vrednosti (4+8) </Data></Cell>' +
      '<Cell><Data ss:Type="String"> Neotpisana vrednost (3-9) </Data></Cell>' +
      '</Row>';

    util.each(calculatedAssets, function (asset) {
      xmlString +=
        '<Row>' +
        '<Cell><Data ss:Type="String"> ' + asset.id + ' </Data></Cell>' +
        '<Cell><Data ss:Type="String"> ' + asset.field2 + ' </Data></Cell>' +
        '<Cell><Data ss:Type="String"> ' + asset.field3 + ' </Data></Cell>' +
        '<Cell><Data ss:Type="String"> ' + asset.field4 + ' </Data></Cell>' +
        '<Cell><Data ss:Type="String"> ' + asset.field5 + ' </Data></Cell>' +
        '<Cell><Data ss:Type="String"> ' + asset.field6 + ' </Data></Cell>' +
        '<Cell><Data ss:Type="String"> ' + asset.field7 + ' </Data></Cell>' +
        '<Cell><Data ss:Type="String"> ' + asset.field8 + ' </Data></Cell>' +
        '<Cell><Data ss:Type="String"> ' + asset.field9 + ' </Data></Cell>' +
        '<Cell><Data ss:Type="String"> ' + asset.field10 + ' </Data></Cell>' +
        '</Row>';
    });

    xmlString += '</Table></Worksheet></Workbook>';

    // Create and return file
    var xlsFile = file.create({
      name: "OA1-" + year + ".xls",
      fileType: file.Type.EXCEL,
      contents: encode.convert({
        string: xmlString,
        inputEncoding: encode.Encoding.UTF_8,
        outputEncoding: encode.Encoding.BASE_64
      })
    });

    return xlsFile;
  }

  // Suitelet entry-point function
  function onRequest(context) {
    if (context.request.method === "GET") {
      // Get year parameter from request. Resolve start and end date using year parameter and set params object
      var year = parseInt(context.request.parameters.year);
      var params = {
        startDate: dUtil.createNewDateString(1, 1, year),
        endDate: dUtil.createNewDateString(31, 12, year),
        selectedSubsidiary: context.request.parameters.selectedSubsidiary
      };
      // Get asset and depreciation history objects from saved search results
      var assets = createAssetObject(deprHistSearch(params));
      var disposedAssets = disposedToObj(disposedAssetsSS(params));
      var assetsPrevYear = createAssetObject(deprHistSearch({
        startDate: dUtil.createNewDateString(1, 1, 1980),
        endDate: dUtil.createNewDateString(31, 12, year - 1),
        selectedSubsidiary: params.selectedSubsidiary
      }));

      processAssets(assets, disposedAssets, assetsPrevYear, year);

      context.response.writeFile(createXlsFile(year));

      // context.response.write({
      //   output: JSON.stringify(calculatedAssets)
      //   // output: JSON.stringify(assetsPrevYear)
      //   // output: JSON.stringify({
      //   //   assets: assets,
      //   //   assetsPrevYear: assetsPrevYear,
      //   //   // disposedAssets: disposedAssets
      //   // })
      // });
    }
  }

  return {
    onRequest: onRequest
  };
});
