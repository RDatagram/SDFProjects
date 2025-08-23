define(["N/file", 'N/query', 'N/runtime'],

    function (file, query, runtime) {

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

                    transaction.index = counter - linesSkipped;
                    transaction.parcelId = lineElements[0].trim();
                    transaction.deliveryDate = lineElements[1].trim();
                    transaction.paymentDate = lineElements[2].trim();
                    transaction.payerName = lineElements[3].trim();
                    transaction.payerAddress = lineElements[4].trim();
                    transaction.amount = lineElements[5].trim();
                    transaction.recipientName = lineElements[6].trim();
                    transaction.recipientCity = lineElements[7].trim();
                    transaction.refClient = lineElements[10].trim();
                    transaction.refRecipient = lineElements[11].trim();
                    transaction.regionFrom = lineElements[12].trim();
                    transaction.regionTo = lineElements[13].trim();
                    transaction.currency = "RSD";

                    outputArray.push(transaction);
                    counter++;
                }
                return true;

            });
            return outputArray;
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
                sqlQuery += " where (transaction.type = 'CustInvc') AND (transaction.custbody_rsm_crm_ordernum = ?) ";
                sqlQuery += " AND ( transactionline.subsidiary = ? ) AND (transactionline.mainline = 'T')"
                parQuery = [srchBroj, srchSub];
            } else {
                sqlQuery = " select id, entity from transaction where (type = 'CustInvc') AND (custbody_rsm_crm_ordernum = ?) AND (transactionline.mainline = 'T') ";
                parQuery = [srchBroj];
            }
            resultSet = query.runSuiteQL({
                query: sqlQuery,
                params: parQuery
            });

            log.debug({
                title: 'Result set',
                details: resultSet
            })
            for (var i = 0; i < resultSet.results.length; i++) {
                l_found = 1;
                var mResult = resultSet.results[i].asMap();
                data.isFound = 1;
                data.custrecord_rsm_csdl_action = lPnboBdpAct.getActionID('PAYMENT'); // PAYMENT
                data.custrecord_rsm_csdl_customer = mResult.entity;
                data.custrecord_rsm_csdl_transaction_recog = mResult.id;
            }

            if (l_found === 0) {
                if (subcheck) {
                    sqlQuery = " select transaction.id, transaction.entity from transactionline join transaction on (transactionline.transaction = transaction.id) ";
                    sqlQuery += " where (transaction.type = 'SalesOrd') AND (transaction.custbody_rsm_crm_ordernum = ?) ";
                    sqlQuery += " AND ( transactionline.subsidiary = ? ) AND (transactionline.mainline = 'T')"
                    parQuery = [srchBroj, srchSub];
                } else {
                    sqlQuery = " select id, entity from transaction where (type = 'SalesOrd') AND (custbody_rsm_crm_ordernum = ?) AND (transactionline.mainline = 'T') ";
                    parQuery = [srchBroj];
                }
                resultSet = query.runSuiteQL({
                    query: sqlQuery,
                    params: parQuery
                });

                log.debug({
                    title: 'Result set',
                    details: resultSet
                })
                for (var i = 0; i < resultSet.results.length; i++) {
                    l_found = 1;
                    var mResult = resultSet.results[i].asMap();
                    data.isFound = 1;
                    data.custrecord_rsm_csdl_action = lPnboBdpAct.getActionID('PAYMENT'); // PAYMENT
                    data.custrecord_rsm_csdl_customer = mResult.entity;
                    data.custrecord_rsm_csdl_transaction_recog = mResult.id;
                }
            }
            return data;
        }

        var BdpActions = {
            load: function () {
                return new _BdpActions();
            }
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

        return {
            csv_parser: _csv_parser,
            lookupREF: _lookupREF
        }

    }
)