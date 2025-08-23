/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/render', 'N/config', 'N/runtime', 'N/file', 'N/query', 'N/url', 'N/email', 'N/log', 'N/search', './dateUtil.js', 'N/redirect'],
  function (record, render, config, runtime, file, query, url, email, log, search, dateUtil, redirect) {

    var dUtil = dateUtil.dateUtil;
    var message = null;
    var CURRENCIES = ['EUR', 'USD', 'CHF']; // foreign currencies in netsuite

    /**
     * Formats the currency value to incluce comma sign/signs (eg. 1,000)
     * @param {string} value input value
     * @returns {string} formated value
     */
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

    function getLogoUrl(params) {
      var locationId = params.transactionRecord.getValue({
        fieldId: 'location'
      });
      var logoUrl = '';
      if (params.subsidiaryFeatureCheck) {  //IF SUBSIDIARY FEATURE IS ON
        if (locationId) { // IF LOCATION ON TRANSACTION BODY FIELD EXISTS
          var locationRecord = record.load({
            type: record.Type.LOCATION,
            id: locationId
          });
          var logoFileId = locationRecord.getValue({
            fieldId: 'logo'
          });
          if (logoFileId) {  // IF LOCATION RECORD HAS LOGO
            logoUrl = file.load({
              id: logoFileId
            }).url;
            return logoUrl;
          } else {  // IF THERE IS NO LOGO INSIDE LOCATION RECORD, GET LOGO FROM SUBSIDIARY
            var logoIdSubsidiary = params.subsidiary.getValue({
              fieldId: 'logo'
            });
            if (logoIdSubsidiary) { // IF SUBSIDIARY HAS LOGO, LOAD IT
              logoUrl = file.load({
                id: logoIdSubsidiary
              }).url;
              return logoUrl;
            }
          }
        } else {  // IF THERE IS NO LOCATION ON TRANSACTION BODY FIELD, LOAD LOGO FROM SUBSIDIARY
          var logoIdSubsidiary = params.subsidiary.getValue({
            fieldId: 'logo'
          });
          if (logoIdSubsidiary) {
            logoUrl = file.load({
              id: logoIdSubsidiary
            }).url;
            return logoUrl;
          }
        }
      } else { // IF SUBSIDIARY FEATURE IS OFF
        if (locationId) { // IF LOCATION ON TRANSACTION BODY FIELD EXISTS
          var locationRecord = record.load({
            type: record.Type.LOCATION,
            id: locationId
          });
          var logoFileId = locationRecord.getValue({
            fieldId: 'logo'
          });
          if (logoFileId) {  // IF LOCATION RECORD HAS LOGO
            logoUrl = file.load({
              id: logoFileId
            }).url;
            return logoUrl;
          } else {  // IF THERE IS NO LOGO INSIDE LOCATION RECORD, GET LOGO FROM COMPANY INFORMATION CONFIG
            var logoIdCompanyInfo = params.companyInfo.getValue({
              fieldId: 'formlogo'
            });
            if (logoIdCompanyInfo) { // IF COMPANY INFORMATION CONFIG HAS LOGO, LOAD IT
              logoUrl = file.load({
                id: logoIdCompanyInfo
              }).url;
              return logoUrl;
            }
          }
        } else { // IF THERE IS NO LOCATION ON TRANSACTON BODY FIELD, LOAD LOGO FROM COMPANY INFORMATION CONFIG
          var logoIdCompanyInfo = params.companyInfo.getValue({
            fieldId: 'formlogo'
          });
          if (logoIdCompanyInfo) {
            logoUrl = file.load({
              id: logoIdCompanyInfo
            }).url;
            return logoUrl;
          }
        }
      }
      return logoUrl;
    }

    function getConfigRecord(subsidiaryId) {
      var configQuery = query.runSuiteQL({
        query: "SELECT id FROM customrecord_rsm_subsidiary_config WHERE custrecord_rsm_config_subsidiary = ?",
        params: [subsidiaryId]
      });

      var configId = configQuery.results[0].values[0];

      var configRecord = record.load({
        type: 'customrecord_rsm_subsidiary_config',
        id: configId,
        isDynamic: true
      });

      return configRecord;
    }

    function getConfigRecordWithoutSubsidiaryFeature() {
      var configQuery = query.runSuiteQL({
        query: 'SELECT id FROM customrecord_rsm_subsidiary_config'
      });

      var configId = configQuery.results[0].values[0];

      var configRecord = record.load({
        type: 'customrecord_rsm_subsidiary_config',
        id: configId,
        isDynamic: true
      });

      return configRecord;
    }

    function post(requestBody) {
      var user = runtime.getCurrentUser();
      var userName = user.name;
      var userId = user.id;
      var userEmail = user.email;

      if (requestBody.action === 'createkalkulacijapdf') {
        try {
          var itemReceiptRecord = record.load({
            type: record.Type.ITEM_RECEIPT,
            id: requestBody.transactionId
          });

          var vendorName = '',
            vendorCompany = '',
            vendorAddress = '',
            vendorPhone = '',
            vendorPib = '',
            vendorMaticniBroj = '';

          var vendorId = itemReceiptRecord.getValue({
            fieldId: 'entity'
          });
          var vendorRec = record.load({
            type: record.Type.VENDOR,
            id: vendorId
          });

          var currencyRec = record.load({
            type: record.Type.CURRENCY,
            id: itemReceiptRecord.getValue('currency')
          });
          var itemReceiptCurreny = currencyRec.getValue('symbol');
          var currencyDisplaySymbol = currencyRec.getValue('displaysymbol');

          var currencyAppend = (currencyDisplaySymbol) ? currencyDisplaySymbol : itemReceiptCurreny;

          vendorName = vendorRec.getValue('companyname');
          vendorCompany = vendorRec.getValue('companyname');
          vendorAddress = vendorRec.getValue('defaultaddress');
          vendorPhone = vendorRec.getValue('phone');
          vendorPib = vendorRec.getValue('custentity_pib');
          vendorMaticniBroj = vendorRec.getValue('custentity_matbrpred');

          var itemLineCount = itemReceiptRecord.getLineCount({
            sublistId: 'item'
          });

          var items = [];
          for (var i = 0; i < itemLineCount; i++) {
            var name = itemReceiptRecord.getSublistText({
              sublistId: 'item',
              fieldId: 'itemname',
              line: i
            });
            var units = itemReceiptRecord.getSublistText({
              sublistId: 'item',
              fieldId: 'unitsdisplay',
              line: i
            });
            var quantity = itemReceiptRecord.getSublistValue({
              sublistId: 'item',
              fieldId: 'quantity',
              line: i
            });
            var purchasePriceByUnit = itemReceiptRecord.getSublistValue({
              sublistId: 'item',
              fieldId: 'rate',
              line: i
            });
            var salesPriceByUnit = itemReceiptRecord.getSublistValue({
              sublistId: 'item',
              fieldId: 'custcol_rsm_itr_sale_rate',
              line: i
            });
            var priceDifference = itemReceiptRecord.getSublistValue({
              sublistId: 'item',
              fieldId: 'custcol_rsm_itr_gross_profit',
              line: i
            });
            var taxRate = itemReceiptRecord.getSublistValue({
              sublistId: 'item',
              fieldId: 'custcol_rsm_itr_tax_rate',
              line: i
            });
            var taxAmount = itemReceiptRecord.getSublistValue({
              sublistId: 'item',
              fieldId: 'custcol_rsm_itr_tax_amount',
              line: i
            });
            var salesValuePerUnit = itemReceiptRecord.getSublistValue({
              sublistId: 'item',
              fieldId: 'custcol_rsm_itr_gross_rate',
              line: i
            });
            var salesValueWithoutVAT = itemReceiptRecord.getSublistValue({
              sublistId: 'item',
              fieldId: 'custcol_rsm_itr_sale_amount',
              line: i
            });
            var purchaseValue = purchasePriceByUnit * quantity;
            var salesGrossAmount = itemReceiptRecord.getSublistValue({
              sublistId: 'item',
              fieldId: 'custcol_rsm_itr_sale_gross_amount',
              line: i
            });

            items.push({
              name: name,
              quantity: quantity,
              units: units,
              purchasePriceByUnit: formatCurrency(parseFloat(purchasePriceByUnit).toFixed(2)),
              salesPriceByUnit: formatCurrency(parseFloat(salesPriceByUnit).toFixed(2)),
              priceDifference: formatCurrency(parseFloat(priceDifference).toFixed(2)),
              taxRate: taxRate,
              taxAmount: formatCurrency(parseFloat(taxAmount).toFixed(2)),
              salesValuePerUnit: formatCurrency(parseFloat(salesValuePerUnit).toFixed(2)),
              purchaseValue: formatCurrency(parseFloat(purchaseValue).toFixed(2)),
              salesValueWithoutVAT: formatCurrency(parseFloat(salesValueWithoutVAT).toFixed(2)),
              salesGrossAmount: formatCurrency(parseFloat(salesGrossAmount).toFixed(2))
            });
          }

          var subsidiaryFeatureCheck = runtime.isFeatureInEffect({
            feature: 'SUBSIDIARIES'
          });

          var domain, logoUrl, companyName, address, city, phone, emailUrl, website, accountNumber, pib, maticniBroj,
            country, zip;
          if (subsidiaryFeatureCheck) {

            var subsidiaryId = itemReceiptRecord.getValue({
              fieldId: 'subsidiary'
            });

            var subsidiaryRecord = record.load({
              type: record.Type.SUBSIDIARY,
              id: subsidiaryId
            });
            var logoIdSubsidiary = subsidiaryRecord.getValue({
              fieldId: 'logo'
            });
            logoUrl = file.load({
              id: logoIdSubsidiary
            }).url;
            domain = url.resolveDomain({
              hostType: url.HostType.APPLICATION
            });
            companyName = subsidiaryRecord.getValue({
              fieldId: 'legalname'
            });
            var addrSubRec = subsidiaryRecord.getSubrecord('mainaddress');

            address = addrSubRec.getValue({
              fieldId: 'addr1'
            });
            city = addrSubRec.getValue({
              fieldId: 'city'
            });
            phone = subsidiaryRecord.getValue({
              fieldId: 'fax'
            });
            country = addrSubRec.getValue({
              fieldId: 'country'
            });
            zip = addrSubRec.getValue({
              fieldId: 'zip'
            });
            emailUrl = subsidiaryRecord.getValue({
              fieldId: 'email'
            });
            website = subsidiaryRecord.getValue({
              fieldId: 'url'
            });
            accountNumber = subsidiaryRecord.getValue({
              fieldId: 'custrecord_subsid_tekuci_racun'
            });
            pib = subsidiaryRecord.getValue({
              fieldId: 'federalidnumber'
            });
            maticniBroj = subsidiaryRecord.getValue({
              fieldId: 'custrecord_subs_mat_broj'
            });
          } else {
            try {
              var companyInfo = config.load({
                type: config.Type.COMPANY_INFORMATION
              });
              var logoIdCompanyInfo = companyInfo.getValue({
                fieldId: 'formlogo'
              });
              if (logoIdCompanyInfo) {
                logoUrl = file.load({
                  id: logoIdCompanyInfo
                }).url;
              } else {
                logoUrl = '';
              }
              domain = url.resolveDomain({
                hostType: url.HostType.APPLICATION
              });
              companyName = companyInfo.getValue({
                fieldId: 'companyname'
              });
              address = companyInfo.getValue({
                fieldId: 'mainaddress_text'
              });
              phone = companyInfo.getValue({
                fieldId: 'fax'
              });
              country = companyInfo.getValue({
                fieldId: 'country'
              });
              zip = companyInfo.getValue({
                fieldId: 'zip'
              });
              emailUrl = companyInfo.getValue({
                fieldId: 'email'
              });
              website = companyInfo.getValue({
                fieldId: 'url'
              });
              accountNumber = '';
              pib = companyInfo.getValue({
                fieldId: 'employerid'
              });
              maticniBroj = companyInfo.getValue({
                fieldId: 'custrecord_rsm_mat_br_komp'
              });
            } catch (error) {
              logoUrl = '';
              domain = '';
              companyName = '';
              address = '';
              city = '';
              phone = '';
              emailUrl = '';
              website = '';
              pib = '';
              maticniBroj = '';
              log.error('Error', "Couldn't get company information data! Error message:\n" + error);
            }
          }

          // Get address details from vendor
          var vendAddress = vendorRec.getSublistValue({
            sublistId: 'addressbook',
            fieldId: 'addr1_initialvalue',
            line: 0
          });
          var vendCity = vendorRec.getSublistValue({
            sublistId: 'addressbook',
            fieldId: 'city_initialvalue',
            line: 0
          });
          var vendCountry = vendorRec.getSublistValue({
            sublistId: 'addressbook',
            fieldId: 'country_initialvalue',
            line: 0
          });
          vendCountry = (vendCountry === 'RS') ? '' : vendCountry;

          var vendZip = vendorRec.getSublistValue({
            sublistId: 'addressbook',
            fieldId: 'zip_initialvalue',
            line: 0
          });

          var data = {};
          data.tranid = itemReceiptRecord.getValue('tranid');
          data.tranDate = dUtil.getDateFromFormattedDate(dUtil.formatDate(itemReceiptRecord.getValue('trandate')));
          data.orderNum = itemReceiptRecord.getValue('custbody_rsm_crm_ordernum');
          data.items = items;

          data.user = {
            name: userName,
            id: userId
          }

          data.companyInformation = {
            name: companyName,
            address: address,
            city: city,
            phone: phone,
            country: country,
            zip: zip,
            email: emailUrl,
            website: website,
            accountNumber: accountNumber,
            pib: pib,
            maticniBroj: maticniBroj,
            logoUrl: 'https://' + domain + logoUrl.replace(/&/g, '&amp;')
          };

          data.customer = {
            name: vendorName,
            companyName: vendorCompany,
            phone: vendorPhone,
            pib: vendorPib,
            maticniBroj: vendorMaticniBroj,
            address: vendorAddress,
            addrDetails: {
              addrText: vendAddress,
              city: vendCity,
              country: vendCountry,
              zip: vendZip
            }
          }

          var renderer = render.create();
          renderer.addCustomDataSource({
            format: render.DataSource.OBJECT,
            alias: "JSON",
            data: data
          });

          /*var configRecord;
          if (subsidiaryFeatureCheck) {
            configRecord = getConfigRecord(subsidiaryId);
          } else {
            configRecord = getConfigRecordWithoutSubsidiaryFeature()
          }
          // TODO: Odraditi preko config recorda ili hardcodovati templejt id
          var bill_io_pdf_rs = configRecord.getValue({
            fieldId: 'custrecord_rsm_config_io_pdf'
          });*/

          renderer.setTemplateByScriptId('CUSTTMPL_INFOSTUD_KALKULACIJA');

          var pdfFile = renderer.renderAsPdf();

          // Delete the old pdf file if it already exists
          var oldFileId = itemReceiptRecord.getValue('custbody_cust_dep_pdf_file');
          if (oldFileId) {
            file.delete({
              id: oldFileId
            });
            log.audit('Success', 'Old pdf file deleted');
          }

          var newPdfFile = file.create({
            name: "PDF Prijemnice za kalkulacijama:" + requestBody.transactionId,
            fileType: file.Type.PDF,
            contents: pdfFile.getContents(),
            folder: file.load({
              id: './pdf_files/flagfile'
            }).folder
          });
          var newPdfFileId = newPdfFile.save();
          log.audit('Success', "New pdf file created! ID:" + newPdfFileId);

          itemReceiptRecord.setValue({
            fieldId: 'custbody_cust_dep_pdf_file',
            value: newPdfFileId
          });
          itemReceiptRecord.save();

          message = {
            type: 'confirmation',
            titple: 'Uspesno!',
            message: "PDF Prijemnice sa kalkulacijama " + requestBody.transactionId + " je uspesno kreiran! Osvezite stranicu",
            duration: '0'
          }

        } catch (error) {
          message = {
            type: 'error',
            titple: 'Greska!',
            message: 'Generisanje PDF internog obracuna je neuspesno! Proverite log skripte!',
            duration: '0'
          };
          log.error('Error!', error);
        }
      }
      return {
        message: message
      }
    }

    return {
      post: post
    }
  });