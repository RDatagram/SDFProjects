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
         * @param {Number} requestBody.orderId
         *
         * @returns {string | Object}
         * @since 2015.2
         */
        function doPost(requestBody) {

            var retArr;

            var sId = requestBody.orderId;

            retArr = crm2erp_util.GetSalesOrderMeta(sId);
            /*
            var mySearchSO = searchModule.create({
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

            var myPagedDataSO = mySearchSO.runPaged({
                pageSize: 10
            });
            myPagedDataSO.pageRanges.forEach(function (pageRange) {
                var myPage = myPagedDataSO.fetch({
                    index: pageRange.index
                });

                for (var ix = 0; ix < myPage.data.length; ix++) {
                    retArr.push(myPage.data[ix]);
                }

            });

            var mySearch = searchModule.create({
                type: searchModule.Type.TRANSACTION,
                columns: [
                    {"name": "trandate"},
                    {"name": "custbody_cust_dep_pdf_file"}
                ],
                filters: [
                    {"name": "createdfrom", "operator": "anyof", "values": [sId]},
                    {"name": "mainline", "operator": "is", "values": ["T"]}
                ]
            })

            var myPagedData = mySearch.runPaged({
                pageSize: 10
            });
            myPagedData.pageRanges.forEach(function (pageRange) {
                var myPage = myPagedData.fetch({
                    index: pageRange.index
                });

                for (var ix = 0; ix < myPage.data.length; ix++) {
                    retArr.push(myPage.data[ix]);
                }

            });

            var mySearchSoe = searchModule.create({
                type: 'customsale_rsm_so_estimate',
                columns: [
                    {"name": "trandate"},
                    {"name": "custbody_cust_dep_pdf_file"}
                ],
                filters: [
                    {"name": "custbody_rsm_est_from_so", "operator": "anyof", "values": [sId]},
                    {"name": "mainline", "operator": "is", "values": ["T"]}
                ]
            })

            var myPagedDataSoe = mySearchSoe.runPaged({
                pageSize: 30
            });
            myPagedDataSoe.pageRanges.forEach(function (pageRange) {

                var myPage = myPagedDataSoe.fetch({
                    index: pageRange.index
                });
                for (var ix = 0; ix < myPage.data.length; ix++) {

                    retArr.push(myPage.data[ix]);
                }

            });
            */

            return {
                "orderdata": retArr
            }
        }

        return {
            post: doPost
        };

    });
