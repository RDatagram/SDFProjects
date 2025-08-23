/**
 * @NApiVersion 2.0
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 */
define([ 'N/file' ],

    function(file) {

        /**
         * Function called upon sending a GET request to the RESTlet.
         *
         * @param {Object} requestParams - Parameters from HTTP request URL; parameters
         * @param {Number} requestParams.fileId - File ID from File Cabinet
         *
         * @returns {string} Base64 PDF content
         *
         * @since 2015.1
         *
         */
        function doGet(requestParams) {

            if (!requestParams.fileId){
                return 'error : fileId is required';
            }

            var myFile = file.load({
                id : requestParams.fileId
            });

            return myFile.getContents();

        }

        return {
            'get': doGet
        };

    });
