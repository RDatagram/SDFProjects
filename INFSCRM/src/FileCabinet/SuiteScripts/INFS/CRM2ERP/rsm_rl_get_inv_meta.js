/**
 * @NApiVersion 2.0
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 */
define(['N/search', './rsm_crm2erp_util'],

    /**
     * @param {search} searchModule
     * @param crm2erp_util
     */
    function (searchModule,crm2erp_util) {


        /**
         * Function called upon sending a POST request to the RESTlet.
         *
         * Creates array of transatcions (strandard and SoE) created from Sales Order
         *
         * @param {string | Object} requestBody
         * @param {Number} requestBody.invoiceId
         *
         * @returns {string | Object}
         * @since 2015.2
         */
        function doPost(requestBody) {

            var retArr;

            var sId = requestBody.invoiceId;

            //retArr = crm2erp_util.GetSalesOrderMeta(sId);
            retArr = [];

            var mySearchInv = searchModule.create({
                type: searchModule.Type.TRANSACTION,
                columns: [
                    {"name": "trandate"},
                    {"name": "custbody_cust_dep_pdf_file"}
                ],
                filters: [
                    {"name": "internalid", "operator": "is", "values": [sId]},
                    {"name": "mainline", "operator": "is", "values": ["T"]}
                ]
            })

            var myPagedDataInv = mySearchInv.runPaged({
                pageSize: 10
            });

            myPagedDataInv.pageRanges.forEach(function (pageRange) {
                var myPage = myPagedDataInv.fetch({
                    index: pageRange.index
                });

                for (var ix = 0; ix < myPage.data.length; ix++) {
                    retArr.push(myPage.data[ix]);
                }

            });

            var mySearch = searchModule.create({
                type: 'depositapplication',
                columns:
                    [
                        {"name" : "trandate"},
                        {"name":"internalid"}
                    ],
                filters:
                    [
                        {"name" : "mainline", "operator" : "is", "values" : ["F"]},
                        {"name":"internalidnumber","join":"appliedtotransaction","operator":"equalto","values":[sId]}
                    ],
            })

            var myPagedData = mySearch.runPaged({
                pageSize: 10
            });
            myPagedData.pageRanges.forEach(function (pageRange) {
                var myPage = myPagedData.fetch({
                    index: pageRange.index
                });

                for (var ix = 0; ix < myPage.data.length; ix++) {
                    //retArr.push(myPage.data[ix]);
                    var mySearchCD = searchModule.create({
                        "type": "depositapplication",
                        "filters":
                            [
                                {"name" : "mainline", "operator" : "is", "values" : ["T"]},
                                {"name":"internalidnumber","operator":"equalto","values":[652]}
                            ],
                        "columns":
                            [
                                {"name" : "trandate"},
                                {"name" : "custbody_cust_dep_pdf_file", "join": "appliedtotransaction"},
                                {"name" : "appliedtotransaction"}
                            ]
                    });
                    var myPagedDataCD = mySearchCD.runPaged({
                        pageSize: 10
                    });
                    myPagedDataCD.pageRanges.forEach(function (pageRangeCD) {
                        var myPageCD = myPagedDataCD.fetch({
                            index: pageRangeCD.index
                        });

                        for (var ix = 0; ix < myPageCD.data.length; ix++) {
                            retArr.push(myPageCD.data[ix]);
                        }

                    });
                }

            });

            return {
                "invoicedata": retArr
            }
        }

        return {
            post: doPost
        };

    });
