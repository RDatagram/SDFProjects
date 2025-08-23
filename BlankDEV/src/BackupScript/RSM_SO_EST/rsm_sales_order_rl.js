/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 * 
 *  Back-end functionality which generates pdf sales order and sends it via E-mail
 * 
 */
define(['N/record', 'N/render', 'N/config', 'N/runtime', 'N/file', 'N/url', 'N/email', 'N/log', './dateUtil.js', 'N/query', 'N/search'],
  function (record, render, config, runtime, file, url, email, log, dateUtil, query, search) {

    var dUtil = dateUtil.dateUtil;
    var message = null;

    var CURRENCIES = ['EUR', 'USD', 'CHF']; // foreign currencies in netsuite

    /**
     * Formats the currency value to incluce comma sign/signs (eg. 1,000.00)
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
      } catch (error) { }
      try {
        decimalPart = value.match(/\..+/g)[0];
        value = value.replace(decimalPart, '');
      } catch (error) { }

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

    /**
    * Returns email address from customer record
    * @param {record.record} customer customer record object
    * @param {string} tranLocation location from transaction form
    * @returns {string} email address
    */
    function getEmailFromCustomer(customer, tranLocation) {
      var recipientEmail = null;
      // Try to get email from contacts sublist
      var lineCount = customer.getLineCount('contactroles');
      for (var i = 0; i < lineCount; i++) {
        var contactId = customer.getSublistValue({
          sublistId: 'contactroles',
          fieldId: 'contact',
          line: i
        });
        var contactRec = record.load({
          type: record.Type.CONTACT,
          id: contactId
        });
        var locations = contactRec.getText({
          fieldId: 'custentity_contact_location'
        });

        for (var j in locations) {
          var loc = locations[j].trim();
          if (loc === tranLocation) {
            recipientEmail = customer.getSublistValue({
              sublistId: 'contactroles',
              fieldId: 'email',
              line: i
            });
            break;
          }
        }
      }

      // Else
      if (!recipientEmail) {
        recipientEmail = customer.getValue('email');
      }

      return recipientEmail;
    }

    function getWebsiteClass(transactionRecord) {
      var currentClass = transactionRecord.getText({
        fieldId: 'class'
      });
      var websiteClass = '';

      if (currentClass.indexOf('https://') !== -1 || currentClass.indexOf('http://') !== -1 ||
       currentClass.indexOf('www.') !== -1 || currentClass.indexOf('.rs') !== -1 ||
       currentClass.indexOf('.com') !== -1) {
          websiteClass = currentClass;
          return websiteClass;
       } else {
          return websiteClass;
       }
    }

    function getLogoForEmail(transactionRecord) {
      var subsidiaryFeatureCheck = runtime.isFeatureInEffect({
        feature: 'SUBSIDIARIES'
      });
      var logoUrl = '';
      if (subsidiaryFeatureCheck) {
        var subsidiaryId = transactionRecord.getValue({
          fieldId: 'subsidiary'
        });
        var subsidiaryRec = record.load({
          type: record.Type.SUBSIDIARY,
          id: subsidiaryId
        });
        logoUrl = getLogoUrl({transactionRecord: transactionRecord,
          subsidiaryFeatureCheck: subsidiaryFeatureCheck,
          subsidiary: subsidiaryRec});
      } else {
        var companyInfo = config.load({
          type: config.Type.COMPANY_INFORMATION
        });
        logoUrl = getLogoUrl({transactionRecord: transactionRecord,
          subsidiaryFeatureCheck: subsidiaryFeatureCheck,
          companyInfo: companyInfo});
      }
      return logoUrl;
    }

    function getEmailSender(transactionRecord) {

      // PROVERITI SUBSIDIARY FEATURE
      var subsidiaryFeatureCheck = runtime.isFeatureInEffect({
        feature: 'SUBSIDIARIES'
      });
      var senderId;
      if (!subsidiaryFeatureCheck) { // RSM
        var fakturistaId = transactionRecord.getValue({
          fieldId: 'custbody_rsm_infs_fakturista'
        });
        if (fakturistaId) { // AKO JE POPUNJENO FAKTURISTA POLJE
          senderId = fakturistaId;
          return senderId;
        } else { // ULOGOVANI KORISNIK
          var user = runtime.getCurrentUser();
          var senderId = user.id;
          return senderId;
        }
      } else { // INFOSTUD
        var subsidiaryId = transactionRecord.getValue({
          fieldId: 'subsidiary'
        });
        var configRecord = getConfigRecord(subsidiaryId);

        var virtualBoolean, locationBoolean, loginBoolean;

        virtualBoolean = configRecord.getValue({
          fieldId: 'custrecord_rsm_config_email_virtual'
        });
        locationBoolean = configRecord.getValue({
          fieldId: 'custrecord_rsm_config_email_location'
        });
        loginBoolean = configRecord.getValue({
          fieldId: 'custrecord_rsm_config_email_login'
        });

        if (virtualBoolean) {
          var configVirtualEmployeeId = configRecord.getValue({
            fieldId: 'custrecord_rsm_config_email_employee'
          });
          senderId = configVirtualEmployeeId;
          return senderId;
        }
        if (locationBoolean) {
          var locationId = transactionRecord.getValue({
            fieldId: 'location'
          });
          var locationRecord = record.load({
            type: record.Type.LOCATION,
            id: locationId
          });
          var emailAuthorId = locationRecord.getValue({
            fieldId: 'custrecord_rsm_location_email_author'
          });
          if (emailAuthorId) {
            senderId = emailAuthorId;
            return senderId;
          }
        }
        if (loginBoolean) {
          var user = runtime.getCurrentUser();
          var senderId = user.id;
          return senderId;
        }
        var user = runtime.getCurrentUser();
        var senderId = user.id;
        return senderId;
      }
    }

    function getSignatureUser(transactionRecord) {
      var subsidiaryFeatureCheck = runtime.isFeatureInEffect({
        feature: 'SUBSIDIARIES'
      });
      if (!subsidiaryFeatureCheck) { // RSM
        var fakturistaId = transactionRecord.getValue({
          fieldId: 'custbody_rsm_infs_fakturista'
        });
        if (fakturistaId) { // AKO JE POPUNJENO FAKTURISTA POLJE
          var fakturistaLookup = search.lookupFields({
            type: search.Type.EMPLOYEE,
            id: fakturistaId,
            columns: ['entityid', 'mobilephone', 'email']
          });
          var userName = fakturistaLookup.entityid;
          var userEmail = fakturistaLookup.email;
          var userPhoneNumber = fakturistaLookup.mobilephone;
          var signatureData = [];
          signatureData.push(userName);
          signatureData.push(userEmail);
          signatureData.push(userPhoneNumber);
          return signatureData;
        } else {
          var loggedInUser = runtime.getCurrentUser();
          var loggedInUserId = loggedInUser.id;
          var loggedInLookup = search.lookupFields({
            type: search.Type.EMPLOYEE,
            id: loggedInUserId,
            columns: ['entityid', 'mobilephone', 'email']
          });
          var userName = loggedInLookup.entityid;
          var userEmail = loggedInLookup.email;
          var userPhoneNumber = loggedInLookup.mobilephone;
          var signatureData = [];
          signatureData.push(userName);
          signatureData.push(userEmail);
          signatureData.push(userPhoneNumber);
          return signatureData;
        }
      } else { // INFOSTUD
        var employeeRepId = transactionRecord.getValue({
          fieldId: 'custbody_rsm_infs_representative'
        });
        if (employeeRepId) {
          var employeeRepLookup = search.lookupFields({
            type: search.Type.EMPLOYEE,
            id: employeeRepId,
            columns: ['entityid', 'mobilephone', 'email']
          });
          var userName = employeeRepLookup.entityid;
          var userEmail = employeeRepLookup.email;
          var userPhoneNumber = employeeRepLookup.mobilephone;
          var signatureData = [];
          signatureData.push(userName);
          signatureData.push(userEmail);
          signatureData.push(userPhoneNumber);
          return signatureData;
        } else {
          var loggedInUser = runtime.getCurrentUser();
          var loggedInUserId = loggedInUser.id;
          var loggedInLookup = search.lookupFields({
            type: search.Type.EMPLOYEE,
            id: loggedInUserId,
            columns: ['entityid', 'mobilephone', 'email']
          });
          var userName = loggedInLookup.entityid;
          var userEmail = loggedInLookup.email;
          var userPhoneNumber = loggedInLookup.mobilephone;
          var signatureData = [];
          signatureData.push(userName);
          signatureData.push(userEmail);
          signatureData.push(userPhoneNumber);
          return signatureData;
        }
      }
    }

    function getAddressForEmailBody(transactionRecord) {
      var subsidiaryFeatureCheck = runtime.isFeatureInEffect({
        feature: 'SUBSIDIARIES'
      });
      var subsidiaryId = transactionRecord.getValue({
        fieldId: 'subsidiary'
      });
      var configRecord = getConfigRecord(subsidiaryId);
      var companyName = '';
      var address = '';
      var dataArray = [];
      if (subsidiaryFeatureCheck) {
        var locationBoolean, subsidiaryBoolean;

        locationBoolean = configRecord.getValue({
          fieldId: 'custrecord_rsm_config_address_from_loc'
        });
        subsidiaryBoolean = configRecord.getValue({
          fieldId: 'custrecord_rsm_config_address_from_sub'
        });
        if (locationBoolean) {
          var locationId = transactionRecord.getValue({
            fieldId: 'location'
          });
          var locationRecord = record.load({
            type: record.Type.LOCATION,
            id: locationId
          });
          companyName = locationRecord.getValue({
            fieldId: 'name'
          });

          var addrSubRec = locationRecord.getSubrecord('mainaddress');
          var city = addrSubRec.getValue({
            fieldId: 'city'
          });
          var country = addrSubRec.getText({
            fieldId: 'country'
          });
          var zip = addrSubRec.getValue({
            fieldId: 'zip'
          });
          var streetAndNumber = addrSubRec.getValue({
            fieldId: 'addr1'
          });

          address = streetAndNumber + ', ' + zip + ' ' + city + ', ' + country; 

          dataArray.push(companyName);
          dataArray.push(address);
          return dataArray;

        } else if (subsidiaryBoolean) {
          var subsidiaryRecord = record.load({
            type: record.Type.SUBSIDIARY,
            id: subsidiaryId
          });
          companyName = subsidiaryRecord.getValue({
            fieldId: 'name'
          });    
          var mainAddressSubrecord = subsidiaryRecord.getSubrecord('mainaddress');
          var zip = mainAddressSubrecord.getValue({
            fieldId: 'zip'
          });
          var streetAndNumber = mainAddressSubrecord.getText({
            fieldId: 'addr1'
          });
          var country = mainAddressSubrecord.getText({
            fieldId: 'country'
          });
          var city = mainAddressSubrecord.getText({
            fieldId: 'city'
          });
          address = streetAndNumber + ', ' + zip + ' ' + city + ', ' + country;
          dataArray.push(companyName);
          dataArray.push(address); 
          return dataArray;
        } else {
          dataArray.push(companyName);
          dataArray.push(address); 
          return dataArray;
        }
      }
    }

    function getNotificationParamObj(locationId, transactionCustomerId) {
      var notificationParamQuery = query.runSuiteQL({
        query: 'SELECT custrecord_rsm_custnp_mailto, custrecord_rsm_custnp_mailcc, custrecord_rsm_custnp_location FROM customrecord_rsm_cust_notif_param WHERE custrecord_rsm_custnp_customer =?',
        params: [transactionCustomerId]
      });

      var obj = {};
      if (!notificationParamQuery.results) {
        return obj;
      } else {
        for (var i = 0; i < notificationParamQuery.results.length; i++) {
          var allValues = notificationParamQuery.results[i].values;
          var mailTo = allValues[0];
          var mailCC = allValues[1];
          var locationsString = allValues[2];

          var mailCCArray = [];
          if (mailCC) {
            var mailCCArraySplit = mailCC.split(";");
            mailCCArraySplit.forEach(function (item) {
              mailCCArray.push(item.trim());
            });
          }
          var locationArraySplit = locationsString.split(",");
          var locationsArray = [];
          locationArraySplit.forEach(function (item) {
            locationsArray.push(parseInt(item));
          });

          obj[i] = {
            "mailTo": mailTo,
            "ccEmails": mailCCArray,
            "locations": locationsArray
          }
        }
        for (var iterator in obj) {
          for (var j = 0; j < obj[iterator]["locations"].length; j++) {
            if (obj[iterator]["locations"][j] == locationId) {
              var returnObject = {};
              returnObject.mailTo = obj[iterator]["mailTo"];
              returnObject.ccEmails = obj[iterator]["ccEmails"];
              return returnObject;
            }
          }
        }
        return null;
      }
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

    /** 
    * Loads logoUrl dynamically
    * params.transactionRecord {object} - Current transaction record
    * params.subsidiaryFeatureCheck {boolean} - Boolean value that shows if subsidiary feature is on or off
    * params.subsidiary {object} - Subsidiary object
    * params.companyInfo {object} - Company information config object 
    */
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

    function getBankAccountsWithSubsidiary(locationId, subsidiaryId, currencyId, bankAccounts) {

      var bankAccountsData = [];
      if (bankAccounts.toString() !== '') { // If Bank Accounts field is not empty on transaction
        bankAccounts = "(" + bankAccounts.toString() + ")"; // Transformation needed for query
        var bankAccountsQuery = query.runSuiteQL({
          query: 'SELECT custrecord_rsm_comp_ba_swift, custrecord_rsm_comp_ba_account, custrecord_rsm_comp_ba_preferred, custrecord_rsm_comp_ba_bank FROM customrecord_rsm_company_bank_accounts WHERE id IN ' + bankAccounts
        });

        bankAccountsQuery.results.forEach(function (item) { // Turning query results into obj and adding it to array
          var obj = {};
          obj.swift = item.values[0];
          obj.iban = item.values[1];
          obj.bankName = item.values[2];
          bankAccountsData.push(obj)
        });
      } else {
        var bankAccountsQuery = query.runSuiteQL({  // If Bank Accounts field is empty on transaction
          query: 'SELECT custrecord_rsm_comp_ba_swift, custrecord_rsm_comp_ba_account, custrecord_rsm_comp_ba_preferred, custrecord_rsm_comp_ba_locations, custrecord_rsm_comp_ba_bank FROM customrecord_rsm_company_bank_accounts WHERE custrecord_rsm_comp_ba_currency =? AND custrecord_rsm_comp_ba_subsidiary =?',
          params: [currencyId, subsidiaryId]
        });
        var tempData = [];
        bankAccountsQuery.results.forEach(function (item) { // Turning query results into obj and adding it to array
          var obj = {};
          obj.swift = item.values[0];
          obj.iban = item.values[1];
          obj.preferred = (item.values[2] === 'T') ? true : false;
          obj.locations = [];
          obj.bankName = item.values[4];

          var locationArraySplit = (item.values[3] != null) ? item.values[3].split(",") : [];
          locationArraySplit.forEach(function (item) {
            obj.locations.push(parseInt(item));
          });
          tempData.push(obj);
        });

        if (locationId) {
          locationId = parseInt(locationId);
          tempData.forEach(function (arrayItem) {
            if (arrayItem.locations.indexOf(locationId) !== -1 && arrayItem.preferred) { // If there is location in BankAccount record and that record is preferred
              bankAccountsData.push(arrayItem);
            }
          });
          if (bankAccountsData.length === 0) {
            tempData.forEach(function(arrayItem) {
              if (arrayItem.locations.indexOf(locationId) !== -1 && !arrayItem.preferred) { // If there is location in BankAccount record and that record is not preferred
                bankAccountsData.push(arrayItem);
              }
            });
          }
        }
        if (bankAccountsData.length === 0) {
          tempData.forEach(function(arrayItem) {
            if (arrayItem.locations.length === 0 && arrayItem.preferred) {  // If there is no location in BankAccount record and that record is preferred
              bankAccountsData.push(arrayItem);
            }
          });
        }

        if (bankAccountsData.length === 0) {
          tempData.forEach(function(arrayItem) {
            if (arrayItem.locations.length === 0 && !arrayItem.preferred) { // If there is no location in BankAccount Record and that record is not preferred
              bankAccountsData.push(arrayItem);
            }
          })
        }
        if (bankAccountsData.length === 0) {
          var emptyObject = {
            swift: '',
            iban: '',
            bankName: ''
          };
          bankAccountsData.push(emptyObject);
        }
      }
      return bankAccountsData;
    }

    function getBankAccountsWithoutSubsidiary(locationId, currencyId, bankAccounts) {
      var bankAccountsData = [];
      if (bankAccounts.toString() !== '') { //If Bank Accounts field is not empty on transaction
        bankAccounts = "(" + bankAccounts.toString() + ")"; // Transformation needed for query
        var bankAccountsQuery = query.runSuiteQL({
          query: 'SELECT custrecord_rsm_comp_ba_swift, custrecord_rsm_comp_ba_account, custrecord_rsm_comp_ba_preferred, custrecord_rsm_comp_ba_bank FROM customrecord_rsm_company_bank_accounts WHERE id IN ' + bankAccounts
        });

        bankAccountsQuery.results.forEach(function (item) {
          var obj = {};
          obj.swift = item.values[0];
          obj.iban = item.values[1];
          obj.bankName = item.values[2];
          bankAccountsData.push(obj)
        });
      } else {
        var bankAccountsQuery = query.runSuiteQL({
          query: 'SELECT custrecord_rsm_comp_ba_swift, custrecord_rsm_comp_ba_account, custrecord_rsm_comp_ba_preferred, custrecord_rsm_comp_ba_locations, custrecord_rsm_comp_ba_bank FROM customrecord_rsm_company_bank_accounts WHERE custrecord_rsm_comp_ba_currency =?',
          params: [currencyId]
        });
        var tempData = [];
        bankAccountsQuery.results.forEach(function (item) {
          var obj = {};
          obj.swift = item.values[0];
          obj.iban = item.values[1];
          obj.preferred = (item.values[2] === 'T') ? true : false;
          obj.locations = [];
          obj.bankName = item.values[4];

          var locationArraySplit = (item.values[3] != null) ? item.values[3].split(",") : [];
          locationArraySplit.forEach(function (item) {
            obj.locations.push(parseInt(item));
          });
          tempData.push(obj);
        });

        if (locationId) {
          locationId = parseInt(locationId);
          tempData.forEach(function (arrayItem) {
            if (arrayItem.locations.indexOf(locationId) !== -1 && arrayItem.preferred) { // If there is location in BankAccount record and that record is preferred
              bankAccountsData.push(arrayItem);
            }
          });
          if (bankAccountsData.length === 0) {
            tempData.forEach(function(arrayItem) {
              if (arrayItem.locations.indexOf(locationId) !== -1 && !arrayItem.preferred) { // If there is location in BankAccount record and that record is not preferred
                bankAccountsData.push(arrayItem);
              }
            });
          }
        }
        if (bankAccountsData.length === 0) {
          tempData.forEach(function(arrayItem) {
            if (arrayItem.locations.length === 0 && arrayItem.preferred) { // If there is no location in BankAccount record and that record is preferred
              bankAccountsData.push(arrayItem);
            }
          });
        }

        if (bankAccountsData.length === 0) {
          tempData.forEach(function(arrayItem) {
            if (arrayItem.locations.length === 0 && !arrayItem.preferred) { // If there is no location in BankAccount Record and that record is not preferred
              bankAccountsData.push(arrayItem);
            }
          })
        }
        if (bankAccountsData.length === 0) {
          var emptyObject = {
            swift: '',
            iban: '',
            bankName: ''
          };
          bankAccountsData.push(emptyObject);
        }
      }
      return bankAccountsData;
    }

    // Restlet entry-point function (post)
    function post(requestBody) {
      // Get current user and user's data
      var user = runtime.getCurrentUser();
      var userName = user.name;
      var userId = user.id;
      var userEmail = user.email;

      if (requestBody.action === 'createpdf') {
        try {
          // Load sales order record
          var salesOrderRec = record.load({
            type: record.Type.SALES_ORDER,
            id: requestBody.salesOrderId
          });
        } catch (error) {
          log.error('Error', error);
          message = {
            type: 'error',
            title: 'Greska',
            message: "Doslo je do greske prilikom kreiranja PDF fakture! Proverite log restlet skripte!",
            duration: '0'
          };
          return message;
        }

        try {
          var customerName = '',
            customerCompany = '',
            customerAddress = '',
            customerPhone = '',
            customerPib = '',
            soAmount = 0,
            soTaxAmount = 0,
            soGrossAmount = 0,
            soAmountIno = 0,
            soTaxAmountIno = 0,
            soGrossAmountIno = 0;

          var currencyRec = record.load({
            type: record.Type.CURRENCY,
            id: salesOrderRec.getValue('currency')
          });
          var soCurrency = currencyRec.getValue('symbol');
          var soCurrencyDisplaySymbol = currencyRec.getValue('displaysymbol');
          var currencyAppend = (soCurrencyDisplaySymbol) ? soCurrencyDisplaySymbol : soCurrency;
          var customerCountry;

          // Load customer record and get field values
          try {
            var customerId = salesOrderRec.getValue('entity');
            var customerRec = record.load({
              type: record.Type.CUSTOMER,
              id: customerId
            });
            customerCountry = customerRec.getSublistValue({
              sublistId: 'addressbook',
              fieldId: 'country_initialvalue',
              line: 0
            });

            customerName = customerRec.getValue('companyname');
            customerCompany = customerRec.getValue('companyname');
            customerAddress = customerRec.getValue('defaultaddress');
            customerPhone = customerRec.getValue('phone');
            customerPib = customerRec.getValue('custentity_pib');
            customerMaticniBroj = customerRec.getValue('custentity_matbrpred');
            customerPozivNaBroj = customerRec.getValue('custbody_poziv_na_broj');
            customerModel = customerRec.getValue('custbody_broj_modela');
          } catch (err) {
            log.error('Error', "Could not load linked customer record");
          }

          //Check if custbody_rsm_infs_fakturista is empty
          var fakturistaId = salesOrderRec.getValue({
            fieldId: 'custbody_rsm_infs_fakturista'
          });
          if (fakturistaId) {
            var fakturistaLookup = search.lookupFields({
              type: search.Type.EMPLOYEE,
              id: fakturistaId,
              columns: ['entityid']
            });
            userName = fakturistaLookup.entityid;
            userId = fakturistaId;
          }

          // Get items line data from sales order
          var lineCount = salesOrderRec.getLineCount({
            sublistId: 'item'
          });

          var items = [];
          for (var i = 0; i < lineCount; i++) {
            var amt = salesOrderRec.getSublistValue({
              sublistId: 'item',
              fieldId: 'amount',
              line: i
            });
            var taxAmt = salesOrderRec.getSublistValue({
              sublistId: 'item',
              fieldId: 'tax1amt',
              line: i
            });
            var unitPrice = parseFloat(salesOrderRec.getSublistValue({
              sublistId: 'item',
              fieldId: 'rate',
              line: i
            }));
            var amtIno = 0,
              taxAmtIno = 0,
              unitPriceIno = 0,
              grsAmtIno = 0;
            if (CURRENCIES.indexOf(soCurrency) !== -1 && (customerCountry === 'RS' || customerCountry === 'Serbia')) {
              amtIno = amt;
              taxAmtIno = taxAmt;
              unitPriceIno = (unitPrice) ? unitPrice : 0;
              grsAmtIno = amtIno + taxAmtIno;
              soGrossAmountIno += grsAmtIno;
              soTaxAmountIno += taxAmtIno;
              soAmountIno += amtIno;
              var exchangeRate = salesOrderRec.getValue('exchangerate');
              amt *= exchangeRate;
              taxAmt *= exchangeRate;
              unitPrice = (unitPrice) ? unitPrice * exchangeRate : '';
            }
            var grsAmt = amt + taxAmt;
            soGrossAmount += grsAmt;
            soTaxAmount += taxAmt;
            soAmount += amt;

            items.push({
              name: salesOrderRec.getSublistText({
                sublistId: 'item',
                fieldId: 'item',
                line: i
              }),
              description: salesOrderRec.getSublistText({
                sublistId: 'item',
                fieldId: 'description',
                line: i
              }),
              units: salesOrderRec.getSublistText({
                sublistId: 'item',
                fieldId: 'units',
                line: i
              }),
              quantity: salesOrderRec.getSublistValue({
                sublistId: 'item',
                fieldId: 'quantity',
                line: i
              }),
              unitPrice: (unitPrice) ? formatCurrency(unitPrice.toFixed(2)) : '',
              unitPriceIno: (unitPriceIno != 0) ? '(' + formatCurrency(unitPriceIno.toFixed(2)) + currencyAppend + ')' : '',
              taxRate: salesOrderRec.getSublistValue({
                sublistId: 'item',
                fieldId: 'taxrate1',
                line: i
              }),
              amount: formatCurrency(parseFloat(amt).toFixed(2)),
              amountIno: (amtIno != 0) ? '(' + formatCurrency(parseFloat(amtIno).toFixed(2)) + currencyAppend + ')' : '',
              taxAmount: formatCurrency(parseFloat(taxAmt).toFixed(2)),
              taxAmountIno: (taxAmtIno != 0) ? '(' + formatCurrency(parseFloat(taxAmtIno).toFixed(2)) + currencyAppend + ')' : '',
              grossAmount: formatCurrency(parseFloat(grsAmt).toFixed(2)),
              grossAmountIno: (grsAmtIno != 0) ? '(' + formatCurrency(parseFloat(grsAmtIno).toFixed(2)) + currencyAppend + ')' : ''
            });
          }

          var subsidiaryFeatureCheck = runtime.isFeatureInEffect({
            feature: 'SUBSIDIARIES'
          });

          var locationId = salesOrderRec.getValue('location');
          var currencyId = salesOrderRec.getValue('currency');
          var bankAccounts = salesOrderRec.getValue('custbody_rsm_trans_bank_acc');
          var bankAccountsData = [];
          if ((customerCountry !== 'Serbia' || customerCountry !== 'RS')) {
            if (subsidiaryFeatureCheck) {
              var subsidiaryId = salesOrderRec.getValue('subsidiary');
              bankAccountsData = getBankAccountsWithSubsidiary(locationId, subsidiaryId, currencyId, bankAccounts);
            } else {
              bankAccountsData = getBankAccountsWithoutSubsidiary(locationId, currencyId, bankAccounts);
            }
          }

          // Get logo from subsidiary first. If it doesn't exist, get logo from company information
          // Get other company information also
          var domain, logoUrl, companyName, address, city, phone, emailUrl, webSite, accountNumber, pib, maticniBroj;
          if (subsidiaryFeatureCheck) {
            var subsidiaryId = salesOrderRec.getValue({
              fieldId: 'subsidiary'
            });
            var configRecord = getConfigRecord(subsidiaryId);

            var subsidiaryRec = record.load({
              type: record.Type.SUBSIDIARY,
              id: subsidiaryId
            });

            var locationBoolean = configRecord.getValue({
              fieldId: 'custrecord_rsm_config_address_from_loc'
            });
            if (locationBoolean) {
              var locationId = salesOrderRec.getValue({
                fieldId: 'location'
              });
              var locationRecord = record.load({
                type: record.Type.LOCATION,
                id: locationId
              });
              logoUrl = getLogoUrl({
                transactionRecord: salesOrderRec,
                subsidiaryFeatureCheck: subsidiaryFeatureCheck,
                subsidiary: subsidiaryRec
              });
              domain = url.resolveDomain({
                hostType: url.HostType.APPLICATION
              });
              companyName = subsidiaryRec.getValue({
                fieldId: 'legalname'
              });
              var addrSubRec = locationRecord.getSubrecord('mainaddress');
              var subsidiaryMainAddress = subsidiaryRec.getSubrecord('mainaddress');
              address = subsidiaryMainAddress.getValue({
                fieldId: 'addr1'
              });
              city = subsidiaryMainAddress.getValue({
                fieldId: 'city'
              });
              phone = addrSubRec.getValue({
                fieldId: 'addrphone'
              });
              emailUrl = '';
              webSite = locationRecord.getValue({
                fieldId: 'custrecord_rsm_weburl_location'
              });
              accountNumber = '';
              pib = subsidiaryRec.getValue({
                fieldId: 'federalidnumber'
              });
              maticniBroj = subsidiaryRec.getValue({
                fieldId: 'custrecord_subs_mat_broj'
              });
            } else {
              logoUrl = getLogoUrl({
                transactionRecord: salesOrderRec,
                subsidiaryFeatureCheck: subsidiaryFeatureCheck,
                subsidiary: subsidiaryRec
              });
              domain = url.resolveDomain({
                hostType: url.HostType.APPLICATION
              });
              companyName = subsidiaryRec.getValue({
                fieldId: 'legalname'
              });
              var addrSubRec = subsidiaryRec.getSubrecord('mainaddress');
              address = addrSubRec.getValue({
                fieldId: 'addr1'
              });
              city = addrSubRec.getValue({
                fieldId: 'city'
              });
              phone = subsidiaryRec.getValue({
                fieldId: 'fax'
              });
              emailUrl = subsidiaryRec.getValue({
                fieldId: 'email'
              });
              webSite = subsidiaryRec.getValue({
                fieldId: 'url'
              });
              accountNumber = subsidiaryRec.getValue({
                fieldId: 'custrecord_subsid_tekuci_racun'
              });
              pib = subsidiaryRec.getValue({
                fieldId: 'federalidnumber'
              });
              maticniBroj = subsidiaryRec.getValue({
                fieldId: 'custrecord_subs_mat_broj'
              });
            }

          } else {
            accountNumber = '';
            try {
              var companyInfo = config.load({
                type: config.Type.COMPANY_INFORMATION
              });
              logoUrl = getLogoUrl({
                transactionRecord: salesOrderRec,
                subsidiaryFeatureCheck: subsidiaryFeatureCheck,
                companyInfo: companyInfo
              });
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
              emailUrl = companyInfo.getValue({
                fieldId: 'email'
              });
              webSite = companyInfo.getValue({
                fieldId: 'url'
              });
              pib = companyInfo.getValue({
                fieldId: 'employerid'
              });
              maticniBroj = companyInfo.getValue({
                fieldId: 'custrecord_rsm_mat_br_komp'
              });

            } catch (error) {
              logoUrl = ''; domain = ''; companyName = ''; address = ''; city = ''; phone = ''; emailUrl = ''; webSite = '';
              pib = ''; maticniBroj = '';
              log.error('Error', "Couldn't get company information data! Error message:\n" + error);
            }
          }

          var napomenaOPoreskomOslobadjanju = '',
            mestoIzdavanjaFakture = '',
            napomenaZaPrint = '';
          try {
            mestoIzdavanjaFakture = salesOrderRec.getValue({
              fieldId: 'custbody_mestoizdavanjafakture'
            });
          } catch (error) {
            log.error('Error', "Couldn't get field value from 'custbody_mestoizdavanjafakture'");
          }
          try {
            napomenaOPoreskomOslobadjanju = salesOrderRec.getValue({
              fieldId: 'custbody_napomenaporezoslobodjen'
            });
          } catch (error) {
            log.error('Error', "Couldn't get field value from 'custbody_napomenaporezoslobodjen'");
          }
          try {
            napomenaZaPrint = salesOrderRec.getValue({
              fieldId: 'custbody_rsm_napomena_za_print'
            });
          } catch (error) {
            log.error('Error', "Couldn't get field value from 'custbody_rsm_napomena_za_print'");
          }

          // Get address details from customer
          var custAddress = customerRec.getSublistValue({
            sublistId: 'addressbook',
            fieldId: 'addr1_initialvalue',
            line: 0
          });
          var custCity = customerRec.getSublistValue({
            sublistId: 'addressbook',
            fieldId: 'city_initialvalue',
            line: 0
          });
          var custCountry = customerRec.getSublistValue({
            sublistId: 'addressbook',
            fieldId: 'country_initialvalue',
            line: 0
          });
          custCountry = (custCountry === 'RS') ? '' : custCountry;
          var custZip = customerRec.getSublistValue({
            sublistId: 'addressbook',
            fieldId: 'zip_initialvalue',
            line: 0
          });

          var data = {};
          data.tranId = salesOrderRec.getValue('tranid');
          data.tranDate = dUtil.getDateFromFormattedDate(dUtil.formatDate(salesOrderRec.getValue('trandate')));
          data.startDate = dUtil.getDateFromFormattedDate(dUtil.formatDate(salesOrderRec.getValue('startdate')));
          data.endDate = dUtil.getDateFromFormattedDate(dUtil.formatDate(salesOrderRec.getValue('enddate')));
          data.salesEffectiveDate = dUtil.getDateFromFormattedDate(dUtil.formatDate(salesOrderRec.getValue('saleseffectivedate')));
          data.napomenaOPoreskomOslobadjanju = napomenaOPoreskomOslobadjanju;
          data.napomenaZaPrint = napomenaZaPrint;
          data.mestoIzdavanjaFakture = mestoIzdavanjaFakture;
          data.memo = salesOrderRec.getValue('memo');
          data.location = salesOrderRec.getText('location');

          data.totalNetAmount = formatCurrency(soAmount.toFixed(2));
          data.totalTaxAmount = formatCurrency(soTaxAmount.toFixed(2));
          data.totalGrossAmount = formatCurrency(soGrossAmount.toFixed(2));

          data.totalNetAmountIno = (soAmountIno != 0) ? '(' + formatCurrency(soAmountIno.toFixed(2)) + currencyAppend + ')' : '';
          data.totalTaxAmountIno = (soTaxAmountIno != 0) ? '(' + formatCurrency(soTaxAmountIno.toFixed(2)) + currencyAppend + ')' : '';
          data.totalGrossAmountIno = (soGrossAmountIno != 0) ? '(' + formatCurrency(soGrossAmountIno.toFixed(2)) + currencyAppend + ')' : '';
          data.currency = salesOrderRec.getText('currency');

          data.items = items;

          data.user = {
            name: userName,
            id: userId
          };

          data.bankAccountsData = bankAccountsData;

          data.companyInformation = {
            name: companyName,
            address: address,
            city: city,
            phone: phone,
            email: emailUrl,
            webSite: webSite,
            accountNumber: accountNumber,
            pib: pib,
            maticniBroj: maticniBroj,
            logoUrl: 'https://' + domain + logoUrl.replace(/&/g, '&amp;'),
          };

          data.customer = {
            name: customerName,
            companyName: customerCompany,
            phone: customerPhone,
            pib: customerPib,
            maticniBroj: customerMaticniBroj,
            pozivNaBroj: customerPozivNaBroj,
            model: customerModel,
            address: customerAddress,
            addrDetails: {
              addrText: custAddress,
              city: custCity,
              country: custCountry,
              zip: custZip
            }
          };

          var renderer = render.create();
          renderer.addCustomDataSource({
            format: render.DataSource.OBJECT,
            alias: "JSON",
            data: data
          });


          var configRecord, sales_order_pdf_rs;
          if (subsidiaryFeatureCheck) {
            try {
              configRecord = getConfigRecord(subsidiaryId);
            } catch (error) {
              log.error('Error', "Error message: " + error);
              message = {
                type: 'error',
                title: 'Greska!',
                message: "Molimo vas da podesite Subsidiary Config za subsidiary sa transakcije."
              };
              return message;
            }
          } else {
            configRecord = getConfigRecordWithoutSubsidiaryFeature();
          }

          sales_order_pdf_rs = configRecord.getValue({
            fieldId: 'custrecord_rsm_config_so_pdf'
          });

          if (!sales_order_pdf_rs) {
            log.error('Error', 'Sales order PDF template field is empty inside Subsidiary Config.')
            message = {
              type: 'error',
              title: 'Greska!',
              message: "Molimo vas da podesite PDF Template Fields unutar Subsidiary config-a za subsidiary sa transakcije."
            };
            return message;
          }

          renderer.setTemplateByScriptId(sales_order_pdf_rs);

          var pdfFile = renderer.renderAsPdf();

          // Delete the old pdf file if it already exists
          var olfFileId = salesOrderRec.getValue('custbody_cust_dep_pdf_file');
          if (olfFileId) {
            file.delete({
              id: olfFileId
            });
            log.audit('Success', 'Old pdf file deleted!');
          }

          // Save a new pdf file to file cabinet and add it to the cust dep form
          var newPdfFile = file.create({
            name: "PDF faktura - sales order:" + requestBody.salesOrderId,
            fileType: file.Type.PDF,
            contents: pdfFile.getContents(),
            folder: file.load({
              id: './pdf_files/flagfile'
            }).folder
          });
          var newPdfFileId = newPdfFile.save();
          log.audit('Success', "New pdf file created! ID:" + newPdfFileId);

          salesOrderRec.setValue({
            fieldId: 'custbody_cust_dep_pdf_file',
            value: newPdfFileId
          });
          salesOrderRec.save();

          message = {
            type: 'confirmation',
            title: 'Uspesno!',
            message: "PDF faktura za sales order " + requestBody.salesOrderId + " je uspesno kreirana! Osvezite stranicu.",
            duration: '0'
          };

        } catch (error) {
          log.error('Error', "Error message: " + error);
          message = {
            type: 'error',
            title: 'Greska!',
            message: "Doslo je do greske prilikom kreiranja PDF fakture! Proverite log restlet skripte."
          };
        }
      }

      if (requestBody.action === 'emailpdf') {
        try {
          var salesOrderRec = record.load({
            type: record.Type.SALES_ORDER,
            id: requestBody.salesOrderId
          });

          // Get file from customer deposit record
          var pdfFileId = salesOrderRec.getValue('custbody_cust_dep_pdf_file');
          if (!pdfFileId || pdfFileId === '' || pdfFileId === ' ') {
            message = {
              type: 'error',
              title: 'Greska!',
              message: "Prvo morate generisati PDF fakturu!"
            };
            return {
              message: message
            };
          }
          var pdfFile = file.load({
            id: pdfFileId
          });

          // Load customer record
          var customerRec = record.load({
            type: record.Type.CUSTOMER,
            id: salesOrderRec.getValue('entity')
          });

          // Get customer email - recipient email
          var recipientEmail = getEmailFromCustomer(customerRec, requestBody.location);

          var ccEmailArray = [];
          var bccEmailArray = [];
          var transactionLocationId = salesOrderRec.getValue({
            fieldId: 'location'
          });

          var transactionCustomerId = salesOrderRec.getValue('entity');

          var transactionCCField = salesOrderRec.getText('custbody_rsm_additional_cc_email');

          var transactionBCCField = salesOrderRec.getText('custbody_rsm_additional_bcc_email');

          if (transactionCCField !== "") {
            var tempList = transactionCCField.split(";");
            tempList.forEach(function (item) {
              ccEmailArray.push(item.trim());
            });
          }
          if (transactionBCCField !== "") {
            tempList = transactionBCCField.split(";");
            tempList.forEach(function (item) {
              bccEmailArray.push(item.trim());
            });
          }

          var notificationParams = getNotificationParamObj(transactionLocationId, transactionCustomerId);


          if (notificationParams) {
            recipientEmail = notificationParams.mailTo;
            notificationParams.ccEmails.forEach(function (email) {
              ccEmailArray.push(email);
            })
          }

          if (!recipientEmail || recipientEmail === '') {
            log.error('Error', "There is no email on customer record nor Notification param record for this customer!")
            message = {
              type: 'error',
              title: 'Greska!',
              message: "Molimo vas da podesite email polje na Customer record-u ili Notification Param record za datog customera!"
            };
            return message;
          }

          var subsidiaryFeatureCheck = runtime.isFeatureInEffect({
            feature: 'SUBSIDIARIES'
          });
          var configRecord;

          if (subsidiaryFeatureCheck) {
            var subsidiaryId = salesOrderRec.getValue({
              fieldId: 'subsidiary'
            });
            try {
              configRecord = getConfigRecord(subsidiaryId);
            } catch (error) {
              log.error('Error', "Error message: " + error);
              message = {
                type: 'error',
                title: 'Greska!',
                message: "Molimo vas da podesite Subsidiary Config za subsidiary sa transakcije."
              };
              return message;
            }
          } else {
            configRecord = getConfigRecordWithoutSubsidiaryFeature();
          }

          var emailTemplateId = configRecord.getValue({
            fieldId: 'custrecord_rsm_config_so_email'
          });

          if (!emailTemplateId) {
            log.error('Error', "Sales order email template field is empty inside Subsidiary Config.")
            message = {
              type: 'error',
              title: 'Greska!',
              message: "Molimo vas da podesite EMAIL Template Fields unutar Subsidiary config-a za subsidiary sa transakcije."
            };
            return message;
          }

          var emailQuery = query.runSuiteQL({
            query: "SELECT content, subject, mediaItem FROM emailtemplate WHERE scriptid = ?",
            params: [emailTemplateId]
          });

          var emailContent = emailQuery.results[0].values[0];
          var emailSubject = emailQuery.results[0].values[1];
          var mediaItemId = emailQuery.results[0].values[2];
          var content;

          if (emailContent) {
            content = emailContent
          } else {
            var file1 = file.load({
              id: mediaItemId
            });

            var emailRender = render.create();
            emailRender.templateContent = file1.getContents();

            var signatureData = getSignatureUser(salesOrderRec);
            var websiteClass = getWebsiteClass(salesOrderRec);
            var logoUrl = getLogoForEmail(salesOrderRec);
            var nameAndAddressArray = getAddressForEmailBody(salesOrderRec);
            
            if (nameAndAddressArray[0] === '' && nameAndAddressArray[1] === '' && subsidiaryFeatureCheck) {
              log.error;('Error', "Either Address from location or Address from subsidiary checkbox have to be checked.")
              message = {
                type: 'error',
                title: 'Greska!',
                message: "Molimo vas da podesite Email preferences unutar Subsidiary config-a za subsidiary sa transakcije."
              };
              return message;
            }
            var domain = url.resolveDomain({
              hostType: url.HostType.APPLICATION
            });
            var jsonObj = {
              employeeId: signatureData[0],
              employeeEmail: signatureData[1],
              employeeMobilePhone: signatureData[2],
              websiteClass: websiteClass,
              logoUrl: 'https://' + domain + logoUrl.replace(/&/g, '&amp;'),
              locationName: nameAndAddressArray[0],
              locationAddress: nameAndAddressArray[1]
            }

            var emailSender = getEmailSender(salesOrderRec);

            emailRender.addCustomDataSource({
              format: render.DataSource.OBJECT,
              alias: "JSON",
              data: jsonObj
            });

            content = emailRender.renderAsString();
          }

          email.send({
            author: emailSender, // Internal id of email sender - current user
            body: content, // insert email body as a string 
            recipients: recipientEmail, // email of recipient as a string - could be an array of strings also
            cc: ccEmailArray, // array of strings for cc of email
            bcc: bccEmailArray, // array of strings for bcc of email
            subject: emailSubject, // subject as a string
            attachments: [pdfFile], // insert file.File - array
            relatedRecords: {
              entityId: transactionCustomerId,
              transactionId: requestBody.salesOrderId
            }
          });

          message = {
            type: 'confirmation',
            title: 'Uspesno',
            message: "Email sa fakturom je uspesno poslat!",
            duration: '0'
          };
        } catch (error) {
          log.error('Error', error);
          message = {
            type: 'error',
            title: 'Greska',
            message: "Slanje Email-a je neuspesno! Proverite log restlet skripte!",
            duration: '0'
          };
        }

      }

      // Response object
      return {
        newPdfFileId: newPdfFileId,
        message: message
      };

    }

    return {
      post: post
    };

  });
