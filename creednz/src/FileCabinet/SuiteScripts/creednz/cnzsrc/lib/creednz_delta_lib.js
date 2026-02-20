/**
 * @NApiVersion 2.1
 */
define(['N/search', 'N/record'],
    /**
     * @param search
     * @param record
     */
    (search, record) => {

        /**
         *
         * @param idSearch
         * @return {{internalid: number, found: boolean}}
         */
        const isExistingEval = (idSearch) => {

            log.debug({
                title: 'idSearch',details:idSearch
            });

            let result = {
                found: false,
                internalid: -1
            };
            let mySearch = search.create({
                type: "customrecord_vendor_evaluation_table",
                filters:
                    [
                        ["custrecord_creednz_evaluation_id", "is", idSearch]
                    ],
                columns:
                    [
                        "internalid"
                    ]
            });

            let searchResult = mySearch.run().getRange({
                start: 0,
                end: 2
            });

            log.debug({
                title: 'searchResult',
                details:searchResult
            })
            if (searchResult.length > 0) {
                result.found = true;
                result.internalid = searchResult[0].id;
            }

            return result;

        }

        /**
         *
         * @param evalRecord
         * @param {{
         *  id:string,
         *  email:string,
         *  primaryContact:string,
         *  name:string,
         *  riskAssessmentStatus:string,
         *  riskStatus:string,
         *  vendorInternalId:string
         *  vendorJSON:string
         *  }} evalJSON
         */
        const setEvalValues = (evalRecord, evalJSON) => {

            evalRecord.setValue({
                fieldId: 'custrecord_vendor_name',
                value: evalJSON.name
            });
            evalRecord.setValue({
                fieldId: 'custrecord_creednz_evaluation_id',
                value: evalJSON.id
            });
            evalRecord.setValue({
                fieldId: 'custrecord_primary_contact',
                value: evalJSON.primaryContact
            });
            evalRecord.setValue({
                fieldId: 'custrecord_vendor_email',
                value: evalJSON.email
            });
            evalRecord.setValue({
                fieldId: 'custrecord_risk_status',
                value: evalJSON.riskStatus
            });
            evalRecord.setValue({
                fieldId: 'custrecord_assessment_status',
                value: evalJSON.riskAssessmentStatus
            });

            if (evalJSON.vendorInternalId) {
                evalRecord.setValue({
                    fieldId: 'custrecord_vendor_internalid',
                    value: evalJSON.vendorInternalId
                });
            }
            evalRecord.setValue({
                fieldId: 'custrecord_vendor_json',
                value: evalJSON.vendorJSON
            });

        }

        const insertEval = (evalJSON) => {

            let newRecord = record.create({
                type: "customrecord_vendor_evaluation_table",
                isDynamic: true
            });

            setEvalValues(newRecord, evalJSON);

            return newRecord.save();
        }
        const updateEval = (internalid, evalJSON) => {

            let existingRecord = record.load({
                type: "customrecord_vendor_evaluation_table",
                id: internalid,
                isDynamic: true
            });

            setEvalValues(existingRecord, evalJSON);

            return existingRecord.save();

        }


        const isExistingDelta = (nameSearch) => {

            let result =
                {
                    found: false,
                    internalid: -1
                };

            let mySearch = search.create({
                type: "customrecord_creednz_vendor_delta",
                filters:
                    [
                        ["name", "is", nameSearch]
                    ],
                columns:
                    [
                        "internalid",
                        "name"
                    ]
            });

            let searchResult = mySearch.run().getRange({
                start: 0,
                end: 2
            });

            if (searchResult.length > 0) {
                result.found = true;
                result.internalid = searchResult[0].id;
            }

            return result;

        }

        const setDeltaValues = (deltaRecord, deltaJSON) => {

            deltaRecord.setValue({
                fieldId: 'custrecord_delta_id',
                value: deltaJSON.id
            });
            // setValue for custrecord_delta_email
            deltaRecord.setValue({
                fieldId: 'custrecord_delta_email',
                value: deltaJSON.email
            });

            deltaRecord.setValue({
                fieldId: 'custrecord_delta_json',
                value: JSON.stringify(deltaJSON)
            });

            deltaRecord.setValue({
                fieldId: 'custrecord_delta_is_person',
                value: deltaJSON.isIndividual
            });
            deltaRecord.setValue({
                fieldId: 'custrecord_delta_company_id',
                value: deltaJSON.companyId
            });
            deltaRecord.setValue({
                fieldId: 'custrecord_delta_phone',
                value: deltaJSON.phone
            });

        }
        const insertDelta = (deltaJSON) => {

            let newRecord = record.create({
                type: "customrecord_creednz_vendor_delta",
                isDynamic: true
            });

            newRecord.setValue({
                fieldId: 'name',
                value: deltaJSON.name
            });

            setDeltaValues(newRecord, deltaJSON);

            return newRecord.save();
        }

        const updateDelta = (internalid, deltaJSON) => {


            let existingRecord = record.load({
                type: "customrecord_creednz_vendor_delta",
                id: internalid,
                isDynamic: true
            });

            setDeltaValues(existingRecord, deltaJSON);

            return existingRecord.save();

        }

        return {
            isExistingDelta,
            insertDelta,
            updateDelta,
            isExistingEval,
            insertEval,
            updateEval
        }

    });
