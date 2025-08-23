const DEBUGMODE = false;

define(["N/file", 'N/xml', 'N/query', 'N/runtime'],

    function (file, xml, query, runtime) {

        function _fixDateString(inDate) {
            var delimiter = '-';
            var elements = inDate.split(delimiter);
            return elements[2] + '.' + elements[1] + '.' + elements[0];
        }


        function fixPercentage(inString) {

            return inString.replace('%', '').replace('-', '0.00');

        }

        function fixEmptyNumber(inString) {

            return (inString.trim() === '') ? '0.00' : inString;
        }

        function _csv_parser(context) {

            var util = {
                getParsedLine: function (line) {
                    var delimiter = ',';
                    var elements = line.split(delimiter);
                    return elements
                }
            }
            var counter = 0;
            var linesSkipped = 0;
            var courierFile = file.load({
                id: context.fileId
            });

            var outputArray = [];
            var courierLineIterator = courierFile.lines.iterator();

            courierLineIterator.each(function (line) {
                var lineElements = util.getParsedLine(line.value);
                if (lineElements.length === 1) { // Skip the lines that are empty

                } else if (counter < 1) { // Skip the first HEADER line of CSV file
                    counter++;
                    linesSkipped++;
                } else {
                    var transaction = {};
                    /*
                    BR_RACUNA,SIFRA_PM,NAZIV_PM,VALUTA_TRANSAKCIJE,DATUM_TRAN,STATUS,TIP,VRSTA_KARTICE,VREME,
                    BR_KARTICE,POS_ID,RATA,BR_AUT,BRUTO,PROVIZIJA,VISINA_MBN,IZNOS_MBN,VISINA_KSN,IZNOS_KSN,VISINA_OTPK_M,
                    IZNOS_OTPK_M,IZNOS_ZA_UPLATU,PROVIZIJA_PROC,DATUM_VALUTE,ID_NALOGA
                     */
                    transaction.index = counter - linesSkipped;
                    if ((lineElements[5].trim() === 'DOSPELO') || (lineElements[5].trim() === 'PLACENO')) {
                        transaction.brRacuna = lineElements[0].trim();                              //BR_RACUNA,
                        transaction.custrecord_rsm_crdl_sifra_pm = lineElements[1].trim();          //SIFRA_PM,
                        transaction.custrecord_rsm_crdl_naziv_pm = lineElements[2].trim();          //NAZIV_PM,
                        transaction.valutaTransakcije = lineElements[3].trim();                     //VALUTA_TRANSAKCIJE,
                        transaction.custrecord_rsm_crdl_datum_tran = lineElements[4].trim();        //DATUM_TRAN,
                        transaction.custrecord_rsm_crdl_status = lineElements[5].trim();            //STATUS,
                        transaction.custrecord_rsm_crdl_tip = lineElements[6].trim();               //TIP,
                        transaction.custrecord_rsm_crdl_vrsta = lineElements[7].trim();             //VRSTA_KARTICE,
                        transaction.custrecord_rsm_crdl_vreme_tran = lineElements[8].trim();       //VREME,
                        transaction.custrecord_rsm_crdl_broj_kartice = lineElements[9].trim();     //BR_KARTICE,
                        transaction.custrecord_rsm_crdl_pos_id = lineElements[10].trim();           //POS_ID,
                        transaction.custrecord_rsm_crdl_rata = lineElements[11].trim();             //RATA,
                        transaction.custrecord_rsm_crdl_broj_aut = lineElements[12].trim();         //BR_AUT,
                        transaction.custrecord_rsm_crdl_bruto = lineElements[13].trim();            //BRUTO,
                        transaction.custrecord_rsm_crdl_provizija = fixEmptyNumber(lineElements[14].trim());        //PROVIZIJA,
                        transaction.custrecord_rsm_crdl_visina_mbn = fixPercentage(lineElements[15].trim());       //VISINA_MBN,
                        transaction.custrecord_rsm_crdl_iznos_mbn = fixEmptyNumber(lineElements[16].trim());        //IZNOS_MBN,
                        transaction.custrecord_rsm_crdl_visina_ksn = fixPercentage(lineElements[17].trim());       //VISINA_KSN,
                        transaction.custrecord_rsm_crdl_iznos_ksn = fixEmptyNumber(lineElements[18].trim());        //IZNOS_KSN,
                        transaction.custrecord_rsm_crdl_visina_otpk_m = fixPercentage(lineElements[19].trim());    //VISINA_OTPK_M,
                        transaction.custrecord_rsm_crdl_iznos_otpk_m = fixEmptyNumber(lineElements[20].trim());     //IZNOS_OTPK_M,
                        transaction.custrecord_rsm_crdl_iznos_za_uplatu = lineElements[21].trim();  //IZNOS_ZA_UPLATU,
                        transaction.custrecord_rsm_crdl_provizija_proc = fixPercentage(lineElements[22].trim());   //PROVIZIJA_PROC,
                        transaction.custrecord_rsm_crdl_datum_valute = lineElements[23].trim();     //DATUM_VALUTE,
                        transaction.custrecord_rsm_crdl_id_naloga = lineElements[24].trim();        //ID_NALOGA


                        transaction.currency = "RSD";


                        outputArray.push(transaction);
                    }
                    counter++;
                }
                return true;

            });
            return outputArray;
        }

        function _BdpActions() {
            var selfThis = this;
            this._sql = " select id, name from customlist_rsm_bdp_actions ";

            this._result = {};

            var _temp = query.runSuiteQL(({
                query: selfThis._sql
            }));

            this._result = _temp.asMappedResults();

            this.getActionID = function (_name) {
                var retId = -1;
                log.debug({"title": "getActionID", details: selfThis._result});

                for (var _ia = 0; _ia < selfThis._result.length; _ia++) {
                    if (selfThis._result[_ia]['name'] === _name) {
                        retId = selfThis._result[_ia]['id']
                    }
                }
                return retId;
            }
        }

        function _lookupREF(srchBroj, srchSub) {

/*
            log.debug({
              title : 'LookupREF param',
              details : JSON.stringify({'srchBroj' : srchBroj, 'srchSub' : srchSub})
            });
 */
            var lPnboBdpAct = new _BdpActions();

            var data = {
                "isFound": 0
            };
            var l_found = 0;
            var resultSet;
            var subcheck = runtime.isFeatureInEffect({
                feature: 'SUBSIDIARIES'
            });

            var sqlQuery;
            var parQuery;

            if (subcheck) {
                sqlQuery = " select transaction.id, transaction.entity from transactionline join transaction on (transactionline.transaction = transaction.id) ";
                sqlQuery += " where (transaction.type = 'CustInvc') AND (transaction.custbody_rsm_auth_payment_code = ?) ";
                sqlQuery += " AND ( transactionline.subsidiary = ? ) AND (transactionline.mainline = 'T')"
                parQuery = [srchBroj, srchSub];
            } else {
                sqlQuery = " select id, entity from transaction where (type = 'CustInvc') AND (custbody_rsm_auth_payment_code = ?) AND (transactionline.mainline = 'T') ";
                parQuery = [srchBroj];
            }
            resultSet = query.runSuiteQL({
                query: sqlQuery,
                params: parQuery
            });

            /*
            log.debug({
                title: 'Result set INV',
                details: resultSet
            })
            */

            for (var i_1 = 0; i_1 < resultSet.results.length; i_1++) {
                l_found = 1;
                var mResult_1 = resultSet.results[i_1].asMap();
                data.isFound = 1;
                data.custrecord_rsm_crdl_action = lPnboBdpAct.getActionID('PAYMENT'); // PAYMENT
                data.custrecord_rsm_crdl_customer = mResult_1.entity;
                data.custrecord_rsm_crdl_transaction_recog = mResult_1.id;
            }

            if (l_found === 0) {
                if (subcheck) {
                    sqlQuery = " select transaction.id, transaction.entity from transactionline join transaction on (transactionline.transaction = transaction.id) ";
                    sqlQuery += " where (transaction.type = 'SalesOrd') AND (transaction.custbody_rsm_auth_payment_code = ?) ";
                    sqlQuery += " AND ( transactionline.subsidiary = ? ) AND (transactionline.mainline = 'T')"
                    parQuery = [srchBroj, srchSub];
                } else {
                    sqlQuery = " select id, entity from transaction where (type = 'SalesOrd') AND (custbody_rsm_auth_payment_code = ?) AND (transactionline.mainline = 'T') ";
                    parQuery = [srchBroj];
                }
                resultSet = query.runSuiteQL({
                    query: sqlQuery,
                    params: parQuery
                });

                if (DEBUGMODE) {
                    log.debug({
                        title: 'Result set SO',
                        details: resultSet
                    })
                }
                for (var i = 0; i < resultSet.results.length; i++) {
                    l_found = 1;
                    var mResult = resultSet.results[i].asMap();
                    data.isFound = 1;
                    data.custrecord_rsm_crdl_action = lPnboBdpAct.getActionID('PAYMENT'); // PAYMENT
                    data.custrecord_rsm_crdl_customer = mResult.entity;
                    data.custrecord_rsm_crdl_transaction_recog = mResult.id;
                }
            }
            return data;
        }

        return {
            csv_parser: _csv_parser,
            lookupREF: _lookupREF,
            fixDateString: _fixDateString
        }

    }
)
