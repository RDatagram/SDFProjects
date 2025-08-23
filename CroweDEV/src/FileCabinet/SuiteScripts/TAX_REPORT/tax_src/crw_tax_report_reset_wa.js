/**
 * @NApiVersion 2.1
 * @NScriptType WorkflowActionScript
 */
define(['N/record','N/dataset'],
    /**
 * @param{record} record
 */
    (record,dataset) => {
        /**
         * Defines the WorkflowAction script trigger point.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.workflowId - Internal ID of workflow which triggered this action
         * @param {string} scriptContext.type - Event type
         * @param {Form} scriptContext.form - Current form that the script uses to interact with the record
         *
         * @since 2016.1
         */
        const onAction = (scriptContext) => {

            const taxrepRecord = scriptContext.newRecord;
            const popdvSublistId   = 'recmachcustrecord_crw_taxrep_popdv_parent';
            const taxcodeSublistId = 'recmachcustrecord_crw_taxrep_taxcode_parent';

            log.debug({
                title : 'isDynamic',
                details : taxrepRecord.isDynamic
            });

            // Remove all existing POPDV lines
            while (taxrepRecord.getLineCount({sublistId: popdvSublistId}) > 0) {
                taxrepRecord.removeLine({
                    sublistId: popdvSublistId,
                    line: 0
                });
            }
            while (taxrepRecord.getLineCount({sublistId: taxcodeSublistId}) > 0) {
                taxrepRecord.removeLine({
                    sublistId: taxcodeSublistId,
                    line: 0
                });
            }

            let ds = dataset.load({id : 'custdataset_crw_popdv_code'});

            let myPagedResults = ds.runPaged({pageSize : 500});

            let iterator = myPagedResults.iterator();

            iterator.each(function(resultPage) {
                let currentPage = resultPage.value;
                let theData = currentPage.data.asMappedResults();
                for (let a = 0; a < theData.length; a++) {
                    if (taxrepRecord.isDynamic) {


                        log.debug({
                            title : 'PoPDV item',
                            details : theData[a]
                        })
                        taxrepRecord.selectNewLine({
                            sublistId : popdvSublistId
                        });
                        taxrepRecord.setCurrentSublistValue({
                            sublistId : popdvSublistId,
                            fieldId : 'custrecord_crw_taxrep_popdv_code',
                            value : theData[a]["id"]
                        });
                        //custrecord_crw_taxrep_popdv_taxamount
                        taxrepRecord.setCurrentSublistValue({
                            sublistId : popdvSublistId,
                            fieldId : 'custrecord_crw_taxrep_popdv_taxamount',
                            value : (0).toFixed(2)
                        });
                        taxrepRecord.setCurrentSublistValue({
                            sublistId : popdvSublistId,
                            fieldId : 'custrecord_crw_taxrep_popdv_taxbase',
                            value : (0).toFixed(2)
                        });
                        taxrepRecord.setCurrentSublistValue({
                            sublistId : popdvSublistId,
                            fieldId : 'custrecord_crw_taxrep_popdv_rtaxamount',
                            value : (0).toFixed(2)
                        });
                        taxrepRecord.setCurrentSublistValue({
                            sublistId : popdvSublistId,
                            fieldId : 'custrecord_crw_taxrep_popdv_rtaxbase',
                            value : (0).toFixed(2)
                        });
                        taxrepRecord.commitLine({
                            sublistId : popdvSublistId
                        });
                    }
                }
                return true;
            });

        }

        return {onAction};
    });
