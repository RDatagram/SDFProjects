/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * 
 * Suitelet script which creates OA report xls file
 * 
 * The script depends on custom dateUtil module and it needs to be stored in the same directory with it.
 * 
 */

define(["N/search", "N/util", "N/file", "N/encode", "N/log", "./dateUtil"],
  function (search, util, file, encode, log, dateUtil) {

    var dUtil = dateUtil.dateUtil;

    // Asset util object
    var assetUtil = {
      form_data: {
        "2 grupa": {
          "field1": "II",
          "field2": 0,
          "field3": 0,
          "field4": 0,
          "field5": 0,
          "field6": 10,
          "field7": 0,
          "field8": 0,
          "fixedParam2": 0
        },
        "3 grupa": {
          "field1": "III",
          "field2": 0,
          "field3": 0,
          "field4": 0,
          "field5": 0,
          "field6": 15,
          "field7": 0,
          "field8": 0,
          "fixedParam2": 0
        },
        "4 grupa": {
          "field1": "IV",
          "field2": 0,
          "field3": 0,
          "field4": 0,
          "field5": 0,
          "field6": 20,
          "field7": 0,
          "field8": 0,
          "fixedParam2": 0
        },
        "5 grupa": {
          "field1": "V",
          "field2": 0,
          "field3": 0,
          "field4": 0,
          "field5": 0,
          "field6": 30,
          "field7": 0,
          "field8": 0,
          "fixedParam2": 0
        }
      }
    }

    /**
     * Asset depreciation history saved search
     * @param {string} startDate
     * @param {string} endDate
     * @returns {search.ResultSet} NetSuite search.ResultSet object
     */
    function deprHistSearch(startDate, endDate, subsidiary) {
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
            ["custrecord_deprhistsubsidiary", "anyof", subsidiary],
            "AND",
            ["custrecord_deprhistassettype", "anyof", "@ALL@"],
            "AND",
            ["custrecord_deprhistdate", "within", startDate, endDate],
            "AND",
            ["formulanumeric: CASE WHEN {custrecord_deprhistassettype}={custrecord_deprhistasset.custrecord_assettype} THEN 1 ELSE 0 END", "equalto", "1"],
            "AND",
            ["formulanumeric: CASE WHEN NVL({custrecord_deprhistassetslave.custrecord_slavecurrentage},0) < {custrecord_deprhistcurrentage} THEN 1 ELSE 0 END", "equalto", "0"],
            "AND",
            ["formulanumeric: CASE WHEN {custrecord_deprhistdate} > {custrecord_deprhistassetslave.custrecord_slavelastdeprdate} THEN 1 ELSE 0 END", "equalto", "0"],
            "AND",
            ["custrecord_deprhistory_schedule", "is", "F"],
            "AND",
            ["custrecord_deprhistasset.custrecord_rsm_fam_grupa_sredstva", "anyof", "2", "3", "4", "5"]
          ],
        columns:
          [
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
              name: "custrecord_altdeprstatus",
              join: "CUSTRECORD_DEPRHISTALTDEPR",
              summary: "GROUP",
              label: "STATUS"
            }),
            search.createColumn({
              name: "custrecord_altdeprstartdeprdate",
              join: "CUSTRECORD_DEPRHISTALTDEPR",
              summary: "GROUP",
              label: "IN SERVICE"
            }),
            search.createColumn({
              name: "custrecord_altdeprlifetime",
              join: "CUSTRECORD_DEPRHISTALTDEPR",
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
              name: "formulacurrencydanacumdepr",
              summary: "SUM",
              formula: "MAX({custrecord_deprhistasset.custrecord_assetcost} - {custrecord_deprhistbookvalue})",
              label: "dana cum depr"
            }),
            search.createColumn({
              name: "custrecord_altdepr_deprrules",
              join: "CUSTRECORD_DEPRHISTALTDEPR",
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
              name: "custrecord_assetdisposaldate",
              join: "CUSTRECORD_DEPRHISTASSET",
              summary: "GROUP",
              label: "Disposal Date"
            }),
            search.createColumn({
              name: "custrecord_deprhistdeprmethod",
              summary: "GROUP",
              label: "Actual Depreciation Method"
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
          name: result.getValue({ name: 'name', summary: 'GROUP', join: 'CUSTRECORD_DEPRHISTASSET' }),
          type: result.getText({ name: 'custrecord_deprhistassettype', summary: 'GROUP' }),
          altname: result.getValue({ name: 'altname', join: 'CUSTRECORD_DEPRHISTASSET', summary: 'GROUP' }),
          status: result.getText({ name: 'custrecord_altdeprstatus', join: 'CUSTRECORD_DEPRHISTALTDEPR', summary: 'GROUP' }),
          inservice: result.getValue({ name: 'custrecord_altdeprstartdeprdate', join: 'CUSTRECORD_DEPRHISTALTDEPR', summary: 'GROUP' }),
          al: parseInt(result.getValue({ name: 'custrecord_altdeprlifetime', join: 'CUSTRECORD_DEPRHISTALTDEPR', summary: 'GROUP' })),
          oc: parseFloat(result.getValue({ name: 'formulacurrencyoc', summary: 'SUM' })),
          acq: parseFloat(result.getValue({ name: 'formulacurrencyacq', summary: 'SUM' })),
          depr: parseFloat(result.getValue({ name: 'formulacurrencydepr', summary: 'SUM' })),
          reval: parseFloat(result.getValue({ name: 'formulacurrencyreval', summary: 'SUM' })),
          wd: parseFloat(result.getValue({ name: 'formulacurrencywd', summary: 'SUM' })),
          sale: parseFloat(result.getValue({ name: 'formulacurrencysale', summary: 'SUM' })),
          disp: parseFloat(result.getValue({ name: 'formulacurrencydisp', summary: 'SUM' })),
          nbv: parseFloat(result.getValue({ name: 'formulacurrencynbv', summary: 'MIN' })),
          danacumdepr: parseFloat(result.getValue({ name: 'formulacurrencydanacumdepr', summary: 'SUM' })),
          deprrule: result.getText({ name: 'custrecord_altdepr_deprrules', join: 'CUSTRECORD_DEPRHISTALTDEPR', summary: 'GROUP' }),
          purchasedate: result.getValue({ name: 'custrecord_assetpurchasedate', join: 'CUSTRECORD_DEPRHISTASSET', summary: 'GROUP' }),
          disposaldate: result.getValue({ name: 'custrecord_assetdisposaldate', join: 'CUSTRECORD_DEPRHISTASSET', summary: 'GROUP' }),
          deprmethod: result.getText({ name: 'custrecord_deprhistdeprmethod', summary: 'GROUP' }),
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
    function disposedSS(startDate, endDate, subsidiary) {
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
            ["custrecord_deprhistasset.custrecord_assetdisposaldate", "within", startDate, endDate],
            "AND",
            ["custrecord_deprhistasset.custrecord_rsm_fam_grupa_sredstva", "anyof", "2", "3", "4", "5"],
            "AND",
            ["custrecord_deprhistsubsidiary", "anyof", subsidiary]
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
              name: "custrecord_altdepr_originalcost",
              join: "CUSTRECORD_DEPRHISTALTDEPR",
              summary: "MAX",
              label: "Original cost Alternate / Nabavna"
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
          oc: parseFloat(result.getValue({ name: 'custrecord_altdepr_originalcost', summary: 'MAX', join: 'CUSTRECORD_DEPRHISTALTDEPR' })),
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
     * @param {object} params
     * @param {object} config
     */
    function processAssets(assets, disposedAssets, params, config) {
      // For each asset depr. history result add original cost to field3 and nbv value on disposal to field4
      util.each(assets, function (asset) {
        if (dUtil.getYear(asset.purchasedate) === params.year) {
          assetUtil.form_data[asset.assetgroup].field3 += asset.oc;
        }
        if (asset.disposaldate !== '' && dUtil.getYear(asset.disposaldate) === params.year) {
          assetUtil.form_data[asset.assetgroup].field4 += disposedAssets[asset.name].nbvDisposal;
        }
        return true;
      });

      // Final processing
      // For each group in form_data object set fields according to if cases
      for (var key in assetUtil.form_data) {
        var group = assetUtil.form_data[key];

        var fixedParam2 = parseFloat(config.oa.fixedParam2[params.selectedSubsidiary][key]);
        group.field2 = params.priorYearNBV[key];
        group.field5 = group.field2 + group.field3 - group.field4;
        group.field7 = group.field5 * group.field6 / 100;

        if (group.field2 === 0 && group.field4 > 0) {
          group.field5 = 0;
          group.field7 = 0;
        }

        group.field8 = group.field5 - group.field7;

        if (group.field8 < params.fixedParam1 || group.field8 < fixedParam2) {
          group.field7 = group.field5;
          group.field8 = 0;
        }
        if (group.field5 < 0) {
          group.field5 = 0;
          group.field7 = 0;
          group.field8 = 0;
        }
      }
    }

    /**
     * Generate XLS file and return it as suitescript File object
     * @param {Number} year year for which we generate report
     */
    function createXlsFileOA(year) {
      var xmlString = '<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>';
      xmlString += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" ';
      xmlString += 'xmlns:o="urn:schemas-microsoft-com:office:office" ';
      xmlString += 'xmlns:x="urn:schemas-microsoft-com:office:excel" ';
      xmlString += 'xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet" ';
      xmlString += 'xmlns:html="http://www.w3.org/TR/REC-html40">';

      xmlString += '<Worksheet ss:Name="OA">';
      xmlString += '<Table>' +
        '<Row>' +
        '<Cell><Data ss:Type="String"> Broj grupe </Data></Cell>' +
        '<Cell><Data ss:Type="String"> Pocetni saldo grupe </Data></Cell>' +
        '<Cell><Data ss:Type="String"> Pribavljena sredstva u toku godine koja se stavljaju u upotrebu </Data></Cell>' +
        '<Cell><Data ss:Type="String"> Otudjena sredstva u toku godine </Data></Cell>' +
        '<Cell><Data ss:Type="String"> Neotpisana vrednost (2+3-4) </Data></Cell>' +
        '<Cell><Data ss:Type="String"> Stopa % </Data></Cell>' +
        '<Cell><Data ss:Type="String"> Amortizacija (5*6) </Data></Cell>' +
        '<Cell><Data ss:Type="String"> Neotpisana vrednost na kraju godine (5-7) </Data></Cell>' +
        '</Row>';

      var totals = [0, 0, 0, 0, 0, 0, 0];
      util.each(assetUtil.form_data, function (group) {
        totals[0] += Math.round(group.field2);
        totals[1] += Math.round(group.field3);
        totals[2] += Math.round(group.field4);
        totals[3] += Math.round(group.field5);
        totals[4] += Math.round(group.field6);
        totals[5] += Math.round(group.field7);
        totals[6] += Math.round(group.field8);
        xmlString +=
          '<Row>' +
          '<Cell><Data ss:Type="String"> ' + group.field1 + ' </Data></Cell>' +
          '<Cell><Data ss:Type="String"> ' + Math.round(group.field2) + ' </Data></Cell>' +
          '<Cell><Data ss:Type="String"> ' + Math.round(group.field3) + ' </Data></Cell>' +
          '<Cell><Data ss:Type="String"> ' + Math.round(group.field4) + ' </Data></Cell>' +
          '<Cell><Data ss:Type="String"> ' + Math.round(group.field5) + ' </Data></Cell>' +
          '<Cell><Data ss:Type="String"> ' + Math.round(group.field6) + ' </Data></Cell>' +
          '<Cell><Data ss:Type="String"> ' + Math.round(group.field7) + ' </Data></Cell>' +
          '<Cell><Data ss:Type="String"> ' + Math.round(group.field8) + ' </Data></Cell>' +
          '</Row>';
      });

      xmlString +=
        '<Row>' +
        '<Cell><Data ss:Type="String"></Data></Cell>' +
        '<Cell><Data ss:Type="String"> ' + totals[0] + ' </Data></Cell>' +
        '<Cell><Data ss:Type="String"> ' + totals[1] + ' </Data></Cell>' +
        '<Cell><Data ss:Type="String"> ' + totals[2] + ' </Data></Cell>' +
        '<Cell><Data ss:Type="String"> ' + totals[3] + ' </Data></Cell>' +
        '<Cell><Data ss:Type="String"></Data></Cell>' +
        '<Cell><Data ss:Type="String"> ' + totals[5] + ' </Data></Cell>' +
        '<Cell><Data ss:Type="String"> ' + totals[6] + ' </Data></Cell>' +
        '</Row>';

      xmlString += '</Table></Worksheet></Workbook>';

      // Create and return file
      var xlsFile = file.create({
        name: "OA" + year + ".xls",
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

        // Get parameters from request and create params object
        var params = {
          year: parseInt(context.request.parameters.year),
          fixedParam1: parseFloat(context.request.parameters.prosecnaPlata) * 5,
          selectedSubsidiary: context.request.parameters.selectedSubsidiary,
          priorYearNBV: {
            '2 grupa': parseFloat(context.request.parameters.nbvGroup2),
            '3 grupa': parseFloat(context.request.parameters.nbvGroup3),
            '4 grupa': parseFloat(context.request.parameters.nbvGroup4),
            '5 grupa': parseFloat(context.request.parameters.nbvGroup5)
          }
        };

        // Load FAM configuration file, read it's JSON content and parse it.
        // This config has values for fixed parameters 2 for OA report
        var configFile = file.load({
          id: './fam_config.json'
        });
        var config = JSON.parse(configFile.getContents());

        // Calculating fixed parameter 2 for each group (nbv for 2018 * group rate)
        for (var groupParam in config.oa.fixedParam2[params.selectedSubsidiary]) {
          config.oa.fixedParam2[params.selectedSubsidiary][groupParam] = parseFloat(config.oa.fixedParam2[params.selectedSubsidiary][groupParam]) * assetUtil.form_data[groupParam].field6 / 100;
        }

        // Generate start and end dates using year parameter
        var startDate = dUtil.createNewDateString(1, 1, params.year),
          endDate = dUtil.createNewDateString(31, 12, params.year);

        // Get asset objects from saved searches
        var assets = createAssetObject(deprHistSearch(startDate, endDate, params.selectedSubsidiary));
        var disposedAssets = disposedToObj(disposedSS(startDate, endDate, params.selectedSubsidiary));

        processAssets(assets, disposedAssets, params, config);

        context.response.writeFile(createXlsFileOA(params.year));

        // context.response.write({
        //   // output: JSON.stringify({
        //   //   assets: assets,
        //   //   disposedAssets: disposedAssets
        //   // })
        //   // output: JSON.stringify(assetUtil.form_data)
        //   output: JSON.stringify({
        //     config: config,
        //     params: params
        //   })
        //   // output: JSON.stringify(assetUtil)
        //   // output: JSON.stringify(disposedToObj(disposedSS()))
        //   // output: JSON.stringify(config)
        // });
      }
    }

    return {
      onRequest: onRequest
    };
  });
