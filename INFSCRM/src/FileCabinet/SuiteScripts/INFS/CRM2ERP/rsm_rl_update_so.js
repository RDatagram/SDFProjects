/**
 * @NApiVersion 2.0
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 */

define(['N/record', 'N/format'],

    function (recordModule, format) {

        /**
         * @param requestBody
         * @param requestBody.internalid
         * @param requestBody.startdate
         * @param requestBody.enddate
         *
         */
        function doPost(requestBody) {

            var _id = requestBody.internalid;
            var _startdate = requestBody.startdate;
            var _enddate = requestBody.enddate;


            var soRec = recordModule.load({
                type: recordModule.Type.SALES_ORDER,
                id: _id
            })

            try {
                if (_startdate) {
                    soRec.setValue({
                        fieldId: 'startdate',
                        value: format.parse({
                            value: _startdate,
                            type: format.Type.DATE,
                            timezone: format.Timezone.EUROPE_BUDAPEST
                        })
                    });
                }
                if (_enddate) {
                    soRec.setValue({
                        fieldId: 'enddate',
                        value: format.parse({
                            value: _enddate,
                            type: format.Type.DATE,
                            timezone: format.Timezone.EUROPE_BUDAPEST
                        })
                    });

                    soRec.save()
                }

                return {
                    "result": "ok",
                    "error" : ""
                }

            } catch (e) {
                return {
                    "result" : "error",
                    "error" : e.message
                }
            }
        }

            return {
                post: doPost
            }
        }

    )