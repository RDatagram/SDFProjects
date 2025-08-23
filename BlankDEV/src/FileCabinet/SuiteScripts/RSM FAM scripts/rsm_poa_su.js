/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * 
 * This Suitelet script generates XLS file which represents POA Asset amortization report form.
 * 
 * The script depends on custom dateUtil module and it needs to be stored in the same directory with it.
 * 
 * Variables/Properties:
 * 
 * iznos_amortizacije - total depreciation in period (for all assets)
 * iznos_razlike = difference between non-amortized values (accounting and alternate methods)
 * ukupan_iznos_amortizacije - total depreciation amount (iznos_amortizaicje + iznos_razlike)
 *
 */

define(["N/search", "N/util", "N/file", "N/encode", 'N/http', "N/log", "./dateUtil"],
  function (search, util, file, encode, http, log, dateUtil) {

    var dUtil = dateUtil.dateUtil;
    var poa = {
      iznos_amortizacije: 0, // 1
      iznos_razlike: 0,  // 2
      ukupan_iznos_amortizacije: 0 // 1 + 2
    };
    var calculatedAssets = [];

    /**
     * Asset depreciation history saves search
     * @param {object} params contains startDate and endDate values
     * @param {boolean} alternate flag which determines custrecord_deprhistaltmethod filter
     * @returns {search.ResultSet} NetSuite search.ResultSet object
     */
    function deprHistSearch(params, alternate) {
      var altMethodFilter = (alternate) ? ["custrecord_deprhistaltmethod", "noneof", "@NONE@"] : ["custrecord_deprhistaltmethod", "anyof", "@NONE@"];

      var ocFormula = (alternate) ?
        "MAX({custrecord_deprhistaltdepr.custrecord_altdepr_originalcost})" :
        "MAX({custrecord_deprhistasset.custrecord_assetcost})";
      var ukupnaIspravkaFormula = (alternate) ?
        "MAX({custrecord_deprhistaltdepr.custrecord_altdepr_originalcost} - {custrecord_deprhistbookvalue})" :
        "MAX({custrecord_deprhistasset.custrecord_assetcost} - {custrecord_deprhistbookvalue})";

      var customrecord_ncfar_deprhistorySearchObj = search.create({
        type: "customrecord_ncfar_deprhistory",
        filters:
          [
            ["custrecord_deprhistasset.id", "isnotempty", ""],
            "AND",
            altMethodFilter,
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
            ["formulanumeric: CASE WHEN {custrecord_deprhistdate} > {custrecord_deprhistassetslave.custrecord_slavelastdeprdate} THEN 1 ELSE 0 END", "equalto", "0"],
            "AND",
            ["formulanumeric: CASE WHEN NVL({custrecord_deprhistassetslave.custrecord_slavecurrentage},0) < {custrecord_deprhistcurrentage} THEN 1 ELSE 0 END", "equalto", "0"],
            "AND",
            ["custrecord_deprhistory_schedule", "is", "F"],
            "AND",
            ["custrecord_deprhistasset.custrecord_rsm_fam_grupa_sredstva", "anyof", "7", "8"],
            "AND",
            ["custrecord_deprhistsubsidiary", "anyof", params.selectedSubsidiary]
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
              formula: ocFormula,
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
              formula: "CASE WHEN ({custrecord_deprhistasset.custrecord_assetdisposaltype.ID} = 1 and {custrecord_deprhisttype.ID} = 3) or {custrecord_deprhisttype.ID} = 6 THEN {custrecord_deprhistamount} ELSE 0 END",
              label: "SALE"
            }),
            search.createColumn({
              name: "formulacurrencydisp",
              summary: "SUM",
              formula: "CASE WHEN ({custrecord_deprhistasset.custrecord_assetdisposaltype.ID} = 2 and {custrecord_deprhisttype.ID} = 3) or {custrecord_deprhisttype.ID} = 7 THEN {custrecord_deprhistamount} ELSE 0 END",
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
              formula: ukupnaIspravkaFormula,
              label: "Ukupna ispravka vrednosti"
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
     * @param {boolean} alternate flag which determines custrecord_deprhistaltmethod filter
     * @returns {search.ResultSet} NetSuite search.ResultSet object
     */
    function disposedAssetsSS(params, alternate) {
      var altMethodFilter = (alternate) ? ["custrecord_deprhistaltmethod", "noneof", "@NONE@"] : ["custrecord_deprhistaltmethod", "anyof", "@NONE@"];
      var column1 = null, column2 = null;

      if (alternate) {
        column1 = search.createColumn({
          name: "formulanumeric",
          summary: "SUM",
          formula: "MAX({custrecord_deprhistaltdepr.custrecord_altdepr_originalcost})+MIN({custrecord_deprhistamount})",
          label: "NBV on disposal date"
        });
        column2 = search.createColumn({
          name: "formulacurrency",
          summary: "SUM",
          formula: "MAX({custrecord_deprhistaltdepr.custrecord_altdepr_originalcost}) - (MAX({custrecord_deprhistaltdepr.custrecord_altdepr_originalcost}) + MIN({custrecord_deprhistamount}))",
          label: "Total accumulated depr. on disposal date"
        });
      } else {
        column1 = search.createColumn({
          name: "formulanumeric",
          summary: "MIN",
          formula: "{custrecord_deprhistasset.custrecord_assetcost}+{custrecord_deprhistamount}",
          label: "NBV on disposal date"
        });
        column2 = search.createColumn({
          name: "formulacurrency",
          summary: "SUM",
          formula: "MAX({custrecord_deprhistasset.custrecord_assetcost}) - MIN({custrecord_deprhistasset.custrecord_assetcost} + {custrecord_deprhistamount})",
          label: "Total accumulated depr. on disposal date"
        });
      }

      return search.create({
        type: "customrecord_ncfar_deprhistory",
        filters:
          [
            altMethodFilter,
            "AND",
            ["custrecord_deprhistasset", "noneof", "@NONE@"],
            "AND",
            // This is internal id - it's not good because status 'Disposed' can have different internal id in different environment (different accaount)
            ["custrecord_deprhistasset.custrecord_assetstatus", "anyof", "4"],
            "AND",
            ["custrecord_deprhisttype", "anyof", "2"], // This is also an internal id - not good
            "AND",
            ["custrecord_deprhistory_summjournal", "anyof", "@NONE@"],
            "AND",
            ["custrecord_deprhistasset.custrecord_assetdisposaldate", "within", params.startDate, params.endDate],
            "AND",
            ["custrecord_deprhistasset.custrecord_rsm_fam_grupa_sredstva", "anyof", "7", "8"],
            "AND",
            ["custrecord_deprhistsubsidiary", "anyof", params.selectedSubsidiary]
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
            column1,
            column2
          ]
      }).run();
    }

    /**
     * Creates an object of asset depreciation history results - disposed asset depreciation history
     * @param {search.ResultSet} results NetSuite search.ResultSet object
     * @returns {object} Asset depreciation history object with column results as properties
     */
    function disposedToObj(results, alternate) {
      var obj = {};
      results.each(function (result) {
        obj[result.getValue({ name: 'name', summary: 'GROUP', join: 'CUSTRECORD_DEPRHISTASSET' })] = {
          name: result.getValue({ name: 'name', summary: 'GROUP', join: 'CUSTRECORD_DEPRHISTASSET' }),
          oc: parseFloat(result.getValue({ name: 'custrecord_assetcost', summary: 'MAX', join: 'CUSTRECORD_DEPRHISTASSET' })),
          nbvDisposal: parseFloat(result.getValue({ name: 'formulanumeric', summary: (alternate) ? 'SUM' : 'MIN' })),
          totalDepr: parseFloat(result.getValue({ name: 'formulacurrency', summary: 'SUM' }))
        }
        return true;
      });
      return obj;
    }

    /**
     * Process assets 
     * @param {object} assets object created using saved search results 
     * @param {object} altMethodAssets object created using saved search results
     * @param {object} disposedAssets object created using saved search results
     * @param {object} altMethodDisposedAssets object created using saved search results
     * @param {Number} year year for which we generate report
     */
    function processAssets(assets, altMethodAssets, disposedAssets, altMethodDisposedAssets, year, poaNbvAmount) {
      // Load poa_nbv.json file and parse it
      poaNbvObj = null,
        folderId = null;
      try {
        var poaNbvFile = file.load({
          id: './poa_nbv.json'
        });
        poaNbvObj = JSON.parse(poaNbvFile.getContents());
        folderId = poaNbvFile.folder;
      } catch (err) {
        log.audit('Information', "POA nbv json file does not exist yet. Autocreating nbv json file...");
        poaNbvObj = {};
        folderId = file.load({
          id: './rsm_poa_su.js'
        }).folder;
      }
      util.each(assets, function (asset) {
        var deprStartDate = dUtil.resolveDepreciationStartDate(asset.deprrule, asset.deprstartdate);
        var field5 = 0, field7;

        // Accounting and alternate method cases)
        if (asset.disposaldate === '' || (asset.disposaldate !== '' && dUtil.getYear(asset.disposaldate) > year)) {
          field5 = asset.depr;
        } else if (asset.disposaldate !== '' && (dUtil.getYear(asset.disposaldate) === dUtil.getYear(deprStartDate))) {
          field5 = disposedAssets[asset.name].totalDepr;
        } else if (
          asset.disposaldate !== '' &&
          (dUtil.getYear(asset.disposaldate) > dUtil.getYear(deprStartDate)) &&
          (dUtil.getYear(asset.disposaldate) === year)
        ) {
          field5 = disposedAssets[asset.name].totalDepr + asset.depr;
        }

        // If altMethodAssets has asset.name property then set field7 according to other cases
        if (altMethodAssets.hasOwnProperty(asset.name)) {
          if (
            altMethodAssets[asset.name].disposaldate === '' ||
            (altMethodAssets[asset.name].disposaldate !== '' && dUtil.getYear(altMethodAssets[asset.name].disposaldate) > year)
          ) {
            field7 = altMethodAssets[asset.name].depr;
          } else if (altMethodAssets[asset.name].disposaldate !== '' && (dUtil.getYear(altMethodAssets[asset.name].disposaldate) === dUtil.getYear(deprStartDate))) {
            field7 = altMethodDisposedAssets[asset.name].totalDepr;
          } else if (
            altMethodAssets[asset.name].disposaldate !== '' &&
            (dUtil.getYear(altMethodAssets[asset.name].disposaldate) > dUtil.getYear(deprStartDate)) &&
            (dUtil.getYear(altMethodAssets[asset.name].disposaldate) === year)
          ) {
            field7 = altMethodDisposedAssets[asset.name].totalDepr + altMethodAssets[asset.name].depr;
          }
        } else {
          field7 = (asset.assetgroup === 'PoAN') ? field5 : 0;
        }

        var field6 = (field5 <= field7) ? field5 : 0;
        var field8 = (field7 < field5) ? field7 : 0;

        var field11 = (asset.disposaldate !== '' && (dUtil.getYear(asset.disposaldate) === year)) ? disposedAssets[asset.name].nbvDisposal : 0;
        var field10 = 0;
        if (altMethodAssets.hasOwnProperty(asset.name)) {
          field10 = (altMethodAssets[asset.name].disposaldate !== '' && (dUtil.getYear(altMethodAssets[asset.name].disposaldate) === year)) ? altMethodDisposedAssets[asset.name].nbvDisposal : 0;
        } else {
          field10 = (asset.assetgroup === 'PoAN') ? field11 : 0;
        }

        // Read nbv for each asset for last year, calculate new nbv for this year and write it
        var nbvNewValue = 0;
        var depr = (field6 !== 0) ? field6 : field8;
        // If asset is disposed in the chosen year, set nbvNewValue to 0
        if (asset.disposaldate !== '' && (dUtil.getYear(asset.disposaldate) === year)) {
          nbvNewValue = 0;
        } else {
          // if (year === 2019) {
          //   nbvNewValue = asset.oc - depr;
          // } else {
          //   // If poa nbv object does not contain last year values, the script cannot procede with report calculation and
          //   // will redirect to the form page with error
          //   if (!poaNbvObj.hasOwnProperty(year - 1)) {
          //     throw new Error('Nije odradjen izvestaj za proslu godinu');
          //   }
          //   var lastYearNbv = poaNbvObj[year - 1][asset.name];
          //   nbvNewValue = (lastYearNbv) ? lastYearNbv - depr : asset.oc - depr;
          // }
          if (dUtil.getYear(deprStartDate) === year) {
            nbvNewValue = asset.oc - depr;
          } else {
            // TODO: Treba pitati da li postoji za prethodnu godinu asset.name, ako ne postoji onda uzeti vrednost iz custom field-a
            if (poaNbvObj[year - 1][asset.name]) {
              var lastYearNbv = poaNbvObj[year - 1][asset.name];
              nbvNewValue = (lastYearNbv) ? lastYearNbv - depr : asset.oc - depr;
            } else {
              var lastYearNbv = poaNbvAmount;
              nbvNewValue = (lastYearNbv) ? lastYearNbv - depr : asset.oc - depr;
            }

          }
        }

        if (!poaNbvObj.hasOwnProperty(year)) {
          poaNbvObj[year] = {};
        }
        poaNbvObj[year][asset.name] = nbvNewValue;

        calculatedAssets.push({
          "id": asset.id,
          "name": asset.name,
          "field1": asset.purchasedate,
          "field2": asset.oc,
          "field3": deprStartDate,
          "field4": "",
          "field5": field5,
          "field6": field6,
          "field7": field7,
          "field8": field8,
          "field9": nbvNewValue,
          "field10": field10,
          "field11": field11
        });
        return true;
      });

      // Write new content of poaNbvObj to the file
      poaNbvFile = file.create({
        name: 'poa_nbv.json',
        fileType: file.Type.JSON,
        contents: JSON.stringify(poaNbvObj)
      });
      poaNbvFile.folder = folderId;
      poaNbvFile.save();

      // Final asset calculation
      util.each(calculatedAssets, function (asset) {
        poa.iznos_amortizacije += (asset.field6 > 0) ? asset.field6 : asset.field8;
        poa.iznos_razlike += (asset.field10 > asset.field11) ? asset.field10 - asset.field11 : 0;
        return true;
      });
      poa.iznos_amortizacije = Math.round(poa.iznos_amortizacije);
      poa.iznos_razlike = Math.round(poa.iznos_razlike);
      poa.ukupan_iznos_amortizacije = poa.iznos_amortizacije + poa.iznos_razlike;
    }

    /**
     * Generate xls file and return it as N/File type
     * @param {Number} year year for which we generate report 
     * @returns {file.File} NetSuite file.File object of EXCEL type
     */
    function createXlsFilePOA(year) {
      var xmlString = '<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>';
      xmlString += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" ';
      xmlString += 'xmlns:o="urn:schemas-microsoft-com:office:office" ';
      xmlString += 'xmlns:x="urn:schemas-microsoft-com:office:excel" ';
      xmlString += 'xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet" ';
      xmlString += 'xmlns:html="http://www.w3.org/TR/REC-html40">';

      xmlString += '<Worksheet ss:Name="POA">';
      xmlString += '<Table>' +
        '<Row>' +
        '<Cell><Data ss:Type="String"> Redni broj </Data></Cell>' +
        '<Cell><Data ss:Type="String"> Opis </Data></Cell>' +
        '<Cell><Data ss:Type="String"> Iznos </Data></Cell>' +
        '</Row>';

      xmlString +=
        '<Row>' +
        '<Cell><Data ss:Type="String"> 1 </Data></Cell>' +
        '<Cell><Data ss:Type="String"> Iznos amortizacije koji se priznaje kao rashod u poreskom periodu </Data></Cell>' +
        '<Cell><Data ss:Type="String"> ' + poa.iznos_amortizacije + ' </Data></Cell>' +
        '</Row>';

      xmlString +=
        '<Row>' +
        '<Cell><Data ss:Type="String"> 2 </Data></Cell>' +
        '<Cell><Data ss:Type="String"> Iznos razlike između neotpisane poreske i neotpisane računovodstvene vrednosti stalnih sredstava </Data></Cell>' +
        '<Cell><Data ss:Type="String"> ' + poa.iznos_razlike + ' </Data></Cell>' +
        '</Row>';

      xmlString +=
        '<Row>' +
        '<Cell><Data ss:Type="String"> 3 </Data></Cell>' +
        '<Cell><Data ss:Type="String"> Ukupan iznos amortizacije koji se priznaje kao rashod u poreskom periodu (1+2) </Data></Cell>' +
        '<Cell><Data ss:Type="String"> ' + poa.ukupan_iznos_amortizacije + ' </Data></Cell>' +
        '</Row>';

      xmlString += '</Table></Worksheet>';

      xmlString += '<Worksheet ss:Name="POA sredstva">';

      xmlString += '<Table>' +
        '<Row>' +
        '<Cell><Data ss:Type="String">Interni id</Data></Cell>' +
        '<Cell><Data ss:Type="String">Naziv</Data></Cell>' +
        '<Cell><Data ss:Type="String">Datum nabavke i stavljanja u upotrebu</Data></Cell>' +
        '<Cell><Data ss:Type="String">Nabavna vrednost</Data></Cell>' +
        '<Cell><Data ss:Type="String">Početak obračuna računovodstvne amortizacije</Data></Cell>' +
        '<Cell><Data ss:Type="String">Iznos naknadnih ulaganja</Data></Cell>' +
        '<Cell><Data ss:Type="String">Iznos računovodstvene amortizacije u periodu</Data></Cell>' +
        '<Cell><Data ss:Type="String">Iznos računovodstvene amortizacije koja se priznaje za poreske svrhe</Data></Cell>' +
        '<Cell><Data ss:Type="String">Iznos poreske amortizacije u periodu</Data></Cell>' +
        '<Cell><Data ss:Type="String">Iznos poreske amortizacije koja se priznaje za poreske svrhe</Data></Cell>' +
        '<Cell><Data ss:Type="String">Neotpisana poreksa vrednost na kraju perioda</Data></Cell>' +
        '<Cell><Data ss:Type="String">Neotpisana poreska vrednost na dan prestanka obračuna amortizacije</Data></Cell>' +
        '<Cell><Data ss:Type="String">Neotpisana računovodstvena vrednost na dan prestanka obračuna amortizacije</Data></Cell>' +
        '</Row>';

      util.each(calculatedAssets, function (asset) {
        xmlString +=
          '<Row>' +
          '<Cell><Data ss:Type="String">' + asset.id + '</Data></Cell>' +
          '<Cell><Data ss:Type="String">' + asset.name + '</Data></Cell>' +
          '<Cell><Data ss:Type="String">' + asset.field1 + '</Data></Cell>' +
          '<Cell><Data ss:Type="String">' + asset.field2.toFixed(2) + '</Data></Cell>' +
          '<Cell><Data ss:Type="String">' + asset.field3 + '</Data></Cell>' +
          '<Cell><Data ss:Type="String">' + asset.field4 + '</Data></Cell>' +
          '<Cell><Data ss:Type="String">' + asset.field5.toFixed(2) + '</Data></Cell>' +
          '<Cell><Data ss:Type="String">' + asset.field6.toFixed(2) + '</Data></Cell>' +
          '<Cell><Data ss:Type="String">' + asset.field7.toFixed(2) + '</Data></Cell>' +
          '<Cell><Data ss:Type="String">' + asset.field8.toFixed(2) + '</Data></Cell>' +
          '<Cell><Data ss:Type="String">' + asset.field9.toFixed(2) + '</Data></Cell>' +
          '<Cell><Data ss:Type="String">' + asset.field10.toFixed(2) + '</Data></Cell>' +
          '<Cell><Data ss:Type="String">' + asset.field11.toFixed(2) + '</Data></Cell>' +
          '</Row>';
      });

      xmlString += '</Table></Worksheet></Workbook>';

      // Create and return file
      var xlsFile = file.create({
        name: "POA-" + year + ".xls",
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
        var poaNbvAmount = parseInt(context.request.parameters.poaNbvAmount);
        poaNbvAmount = (isNaN(poaNbvAmount)) ? 0 : poaNbvAmount;
        var params = {
          startDate: dUtil.createNewDateString(1, 1, year),
          endDate: dUtil.createNewDateString(31, 12, year),
          selectedSubsidiary: context.request.parameters.selectedSubsidiary
        };
        // Get asset and depreciation history objects from saved search results
        var assets = createAssetObject(deprHistSearch(params, false));
        var altMethodAssets = createAssetObject(deprHistSearch(params, true));
        var disposedAssets = disposedToObj(disposedAssetsSS(params, false), false);
        var altMethodDisposedAssets = disposedToObj(disposedAssetsSS(params, true), true);

        try {
          processAssets(assets, altMethodAssets, disposedAssets, altMethodDisposedAssets, year, poaNbvAmount);
        } catch (err) {
          // Redirect to the POA form suitelet with an error message
          log.error('Error', err);
          context.response.sendRedirect({
            type: http.RedirectType.SUITELET,
            identifier: 'customscript_poa_form_su',
            id: 'customdeploy_poa_form_su',
            parameters: {
              message: JSON.stringify({
                "type": "Error",
                "title": "Greska!",
                "content": "Izvestaj za prethodnu godinu nije odradjen!\n" +
                  "Neophodno je uraditi izvestaj za prethodnu godinu kako bi se generisali metapodaci neophodni za kalkulaciju izvestaja izabrane godine"
              })
            }
          });
        }

        context.response.writeFile(createXlsFilePOA(year));

        // context.response.write({
        //   output: JSON.stringify({
        //     assets: assets,
        //     altMethodAssets: altMethodAssets,
        //     disposedAssets: disposedAssets
        //   })
        //   // output: JSON.stringify(disposedAssets)
        //   // output: JSON.stringify(altMethodDisposedAssets)

        //   // output: JSON.stringify(calculatedAssets)

        //   // output: JSON.stringify(testList)
        //   // output: JSON.stringify(params)
        // });
      }
    }

    return {
      onRequest: onRequest
    };
  });
