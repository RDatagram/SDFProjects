/**
 * @NApiVersion 2.0
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 */
define(['N/search'],

    function (searchModule) {

        /**
         * Function called upon sending a GET request to the RESTlet.
         *
         * @param {Object} requestBody - Parameters from HTTP request URL; parameters
         * @param {Number} requestBody.subsidiaryId - File ID from File Cabinet
         * @param {string} requestBody.startDate - period Start;
         * @param {string} requestBody.endDate - period End;
         * @param {boolean} requestBody.debug - samo za debug reponse
         *
         * @returns {string} Base64 PDF content
         *
         * @since 2015.1
         *
         */
        function doPost(requestBody) {

            var retArr;
            var mySearch;

            var sId = requestBody.subsidiaryId;
            var dStart = requestBody.startDate;
            var dEnd = requestBody.endDate;
            var bDebug = requestBody.debug || false;

            mySearch = searchModule.create({
                type: "transaction",
                filters: [
                    {"name": "type", "operator": "anyof", "values": ["CustPymt", "CustDep"]},
                    //{"name": "mainline", "operator": "is", "values": ["T"]},
                    {"name": "subsidiary", "operator": "is", "values": [sId]},
                    {"name": "lastmodifieddate", "operator": "notbefore", "values": [dStart]},
                    {"name": "lastmodifieddate", "operator": "notafter", "values": [dEnd]}

                ],
                columns: [
                    searchModule.createColumn({"name": "line"}),
                    searchModule.createColumn({"name": "trandate"}),
                    searchModule.createColumn({"name": "lastmodifieddate"}),
                    searchModule.createColumn({"name": "subsidiary"}),
                    searchModule.createColumn({"name": "amount"}),
                    searchModule.createColumn({"name": "salesorder"}),
                    searchModule.createColumn({"name": "entityid", join: "customer"}),
                    searchModule.createColumn({"name": "createdfrom", join: "appliedToTransaction"}),
                    //searchModule.createColumn({"name": "custbody_rsm_invoice_old_crm_id", join: "appliedToTransaction"}),
                    searchModule.createColumn({"name": "appliedtotransaction"}),
                    searchModule.createColumn({"name": "applyingtransaction"}),
                    searchModule.createColumn({"name": "applyinglinkamount"}),
                    searchModule.createColumn({"name": "appliedtolinkamount"})
                ]
            });
            retArr = [];
            /*
                        var myPagedData = mySearch.runPaged({
                            pageSize: 1000
                        });

             */
            var myPagedData = mySearch.run();
            var results = [],
                start = 0,
                end = 1000;

            // This fixes the Results.each() limit of 4000 results
            while (true) {
                // getRange returns an array of Result objects
                var tempList = myPagedData.getRange({
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


            util.each(results, function (result) {

                if (result.recordType === 'customerdeposit') {
                    if ((result.getValue({name: 'line'}) === "0") && (result.getValue({name: 'salesorder'}))) {
                        var retDeposit = {
                            'recordType': result.recordType,
                            'lastmodifieddate': result.getValue({"name": "lastmodifieddate"}),
                            'trandate': result.getValue({name: 'trandate'}),
                            'customer': result.getValue({name: 'entityid', join: "customer"}),
                            'line': result.getValue({name: 'line'}),
                            'tranid': result.id,
                            'amount': result.getValue({name: 'amount'}),
                            'salesorder': result.getValue({name: 'salesorder'}),
                            "appliedtotransaction": result.getText({name: 'appliedtotransaction'})
                        }

                        retArr.push(retDeposit);
                    }
                }

                if (result.recordType === 'customerpayment') {
                    if (result.getValue({name: 'line'}) === "0") {
                        //
                    } else {
                        if (result.getValue({name: "createdfrom", join: "appliedToTransaction"})) {
                            var retPymt = {
                                'recordType': result.recordType,
                                'lastmodifieddate': result.getValue({"name": "lastmodifieddate"}),
                                'trandate': result.getValue({name: 'trandate'}),
                                'customer': result.getValue({name: 'entityid', join: "customer"}),
                                'line': result.getValue({name: 'line'}),
                                'tranid': result.id,
                                'amount': result.getValue({name: 'appliedtolinkamount'}),
                                'salesorder': result.getValue({name: "createdfrom", join: "appliedToTransaction"}),
                                //'invoice_old_crm_id' : result.getValue({name : 'custbody_rsm_invoice_old_crm_id', join: "appliedToTransaction"}),
                                'appliedtotransaction': result.getText({name: 'appliedtotransaction'})
                            }
                            retArr.push(retPymt);
                        }
                    }
                }

                return true;
            })

            var retObject;
            if (bDebug) {
                retObject = {
                    "paymentdata": retArr,
                    "debugdata": results
                }
            } else {
                retObject = {
                    "paymentdata": retArr
                }
            }
            return retObject;
        }


        return {
            'post': doPost
        };

    })
;
