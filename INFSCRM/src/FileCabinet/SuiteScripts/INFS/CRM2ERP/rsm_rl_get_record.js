/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 */
define([ 'N/record' ],

    function(recordModule) {

        /**
         * Function called upon sending a GET request to the RESTlet.
         *
         * @param {Object} requestParams - Parameters from HTTP request URL; parameters
         *
         * @returns {Record} HTTP response body;
         * return string when request Content-Type is 'text/plain';
         * return Object when request Content-Type is 'application/json'
         *
         * @since 2015.1
         */
        function doGet(requestParams) {

            var _type = requestParams.type;
            var _id = requestParams.id;

            var _rec = recordModule.load({
                type : _type,
                id : _id
            })

            return _rec;
        }

        /**
         * Function called upon sending a DELETE request to the RESTlet.
         *
         * @param {Object} requestParams - Parameters from HTTP request URL; parameters
         *            will be passed into function as an Object (for all supported
         *            content types)
         * @returns {string | Object} HTTP response body; return string when request
         *          Content-Type is 'text/plain'; return Object when request
         *          Content-Type is 'application/json'
         * @since 2015.2
         */
        function doDelete(requestParams) {
            var _type = requestParams.type;
            var _id = requestParams.id;

            var _rec = recordModule.delete({
                type : _type,
                id : _id
            })

            return _rec;
        }

        return {
            'get': doGet,
            // put: doPut,
            // post : doPost
            'delete': doDelete
        };

    });
