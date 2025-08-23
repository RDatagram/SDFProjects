/**
 * @NApiVersion 2.0
 */
define(['N/query', 'N/url', 'N/https'],

    function (query, url,https) {

        /**
         *
         * @param _data
         * @param _data.soId
         * @param _data.location
         *
         * @private
         */
        function _createSalesOrderPDF(_data){

            var myHeaders = [];
            myHeaders['Content-type'] = 'application/json';

            var data = {
                action: 'createpdf',
                salesOrderId: _data.soId,
                location: _data.location
            };

            https.requestRestlet({
                scriptId: 'customscript_rsm_sales_order_rl',
                deploymentId: 'customdeploy_rsm_sales_order_rl',
                method: 'POST',
                headers: myHeaders,
                body: JSON.stringify(data)
            });

        }

        /**
         *
         * @param _data
         * @param _data.idSO
         * @private
         */
        function _createSalesOrderEstimates(_data){

            var myHeaders = [];
            myHeaders['Content-type'] = 'application/json';

            var data = {
                idSO: _data.idSO
            };

            https.requestRestlet({
                scriptId: 'customscript_rsm_create_so_estimate_rl',
                deploymentId: 'customdeploy_rsm_create_so_estimate_rl',
                method: 'POST',
                headers: myHeaders,
                body: JSON.stringify(data)
            });

        }

        /**
         *
         * @param _data
         * @param _data.invoiceId
         *
         * @private
         */
        function _createInvoicePDF(_data){
            //
            var myHeaders = [];
            myHeaders['Content-type'] = 'application/json';

            var data = {
                action: 'createpdf',
                invoiceId: _data.invoiceId
            };

            https.requestRestlet({
                scriptId: 'customscript_rsm_invoice_rl',
                deploymentId: 'customdeploy_rsm_invoice_rl',
                method: 'POST',
                headers: myHeaders,
                body: JSON.stringify(data)
            });
        }

        return {
            createSalesOrderPDF : _createSalesOrderPDF,
            createSalesOrderEstimates : _createSalesOrderEstimates,
            createInvoicePDF : _createInvoicePDF
        }
    }
);