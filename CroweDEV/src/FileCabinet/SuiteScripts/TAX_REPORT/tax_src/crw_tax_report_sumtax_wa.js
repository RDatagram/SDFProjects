/**
 * @NApiVersion 2.1
 * @NScriptType WorkflowActionScript
 */
define(['N/search','./crw_tax_report_util'],
    
    (
        search,
        crw_tax_util) => {
        /**
         * Defines the WorkflowAction script trigger point.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.workflowId - Internal ID of workflow which triggered this action
         * @param {string} scriptContext.type - Event type
         * @param {Form} scriptContext.form - Current form that the script uses to interact with the record
         * @since 2016.1
         */
        const onAction = (scriptContext) => {

            const taxrepRecord = scriptContext.newRecord;
            const subsidiaryId = taxrepRecord.getValue('custrecord_crw_taxrep_sub');
            const startDate = taxrepRecord.getText('custrecord_crw_taxrep_start');
            const endDate = taxrepRecord.getText('custrecord_crw_taxrep_end');

            log.debug({
                title : 'Entry point',
                details : {"sub" : subsidiaryId, "start" : startDate, "end" : endDate}
            });

            let taxCodeSumSS = crw_tax_util.taxCodeSum(startDate,endDate,subsidiaryId);

            //let lengthSS = 0;
            const taxcodeSublistId = 'recmachcustrecord_crw_taxrep_taxcode_parent';
            const taxCodeObj = crw_tax_util.getTaxCodes();

            crw_tax_util.zeroPopdvSublist(taxrepRecord);

            let popdvId = "";
            let popdvTaxId = "";
            let popdvParentTaxId = "";
            let popdvParentId = "";
            let popdvDeductableCode = "";

            taxCodeSumSS.each(function (result) {
                //lengthSS++;
                log.debug({
                    title : 'taxCodeSum.each',
                    details : result
                });
                const taxCode = result.getValue({ name: 'taxcode', summary: search.Summary.GROUP });
                //let grossAmnt = parseFloat(result.getValue({ name: 'grossamount', summary: search.Summary.SUM }));
                let grossAmnt = parseFloat(result.getValue({ name:"formulacurrency", summary: search.Summary.SUM}));

                let taxAmnt = parseFloat(result.getValue({ name: 'taxamount', summary: search.Summary.SUM }));
                let taxAmntRev = 0.00;
                let taxAmntDepApp = 0.00;

                if (grossAmnt < 0) {
                    taxAmnt = (taxAmnt > 0) ? -taxAmnt : taxAmnt;
                } else {
                    taxAmnt = (taxAmnt < 0) ? -taxAmnt : taxAmnt;
                }

                popdvId = taxCodeObj[taxCode]["popdvIdField"];
                popdvTaxId = taxCodeObj[taxCode]["popdvTaxIdField"];
                popdvDeductableCode = taxCodeObj[taxCode]["popdvDeductableCode"];

                const isReverse = taxCodeObj[taxCode]["reverseCharge"];
                const isReduced = taxCodeObj[taxCode]["reducedRate"];

                if (isReverse) {
                    const parentTax = taxCodeObj[taxCode]["parent"];
                    const parentRate = taxCodeObj[parentTax]["rate"];
                    popdvParentTaxId = taxCodeObj[parentTax]["popdvTaxIdField"]
                    taxAmntRev = (grossAmnt * parentRate) / 100;
                }

                taxrepRecord.selectNewLine({
                    sublistId : taxcodeSublistId
                });
                taxrepRecord.setCurrentSublistValue({
                    sublistId : taxcodeSublistId,
                    fieldId : 'custrecord_crw_taxrep_taxcode_tax',
                    value : taxCode
                });
                //custrecord_crw_taxrep_taxcode_gross
                taxrepRecord.setCurrentSublistValue({
                    sublistId : taxcodeSublistId,
                    fieldId : 'custrecord_crw_taxrep_taxcode_gross',
                    value : grossAmnt.toFixed(2)
                });
                taxrepRecord.setCurrentSublistValue({
                    sublistId : taxcodeSublistId,
                    fieldId : 'custrecord_crw_taxrep_taxcode_taxamount',
                    value : taxAmnt.toFixed(2)
                });
                // taxAmntRev
                taxrepRecord.setCurrentSublistValue({
                    sublistId : taxcodeSublistId,
                    fieldId : 'custrecord_crw_taxrep_rctax_taxamount',
                    value : taxAmntRev.toFixed(2)
                });
                taxrepRecord.setCurrentSublistValue({
                    sublistId : taxcodeSublistId,
                    fieldId : 'custrecord_crw_taxrep_depapp_taxamount',
                    value : taxAmntDepApp.toFixed(2)
                });
                taxrepRecord.commitLine({
                    sublistId : taxcodeSublistId
                });

                let isDepApp = false;
                if (popdvId){
                    let options = {
                        "isReverse" : isReverse,
                        "isDepApp" : false,
                        "isReduced" : isReduced,
                        "taxrepRecord" : taxrepRecord,
                        "popdvId" : popdvId,
                        "taxAmount" : taxAmnt,
                        "taxAmntRev" : taxAmntRev,
                        "taxDepApp" : taxAmntDepApp,
                        "taxBase" : grossAmnt,
                        "popdvTaxId" : popdvTaxId,
                        "popdvParentTaxId" : popdvParentTaxId,
                        "popdvDeductableCode" : popdvDeductableCode
                    }
                    crw_tax_util.addPopdvAmounts(options);
                }
                return true;
            });

            // Let's do Deposits
            taxCodeSumSS = crw_tax_util.depositTaxTransactions(startDate,endDate,subsidiaryId);
            taxCodeSumSS.each(function (result) {
                //lengthSS++;

                log.debug({
                    title : 'depositTaxTransactions.each',
                    details : result
                });

                const taxCode = result.getValue({ name: 'custbody_crw_taxcode', summary: search.Summary.GROUP });
                let amount = parseFloat(result.getValue({ name: 'amount', summary: search.Summary.SUM }));
                let taxAmnt = parseFloat(result.getValue({ name: 'custbody_crw_taxamount', summary: search.Summary.SUM }));
                let taxAmntRev = 0.0;
                let taxAmntDepApp = 0.00;

                if (amount < 0) {
                    taxAmnt = (taxAmnt > 0) ? -taxAmnt : taxAmnt;
                } else {
                    taxAmnt = (taxAmnt < 0) ? -taxAmnt : taxAmnt;
                }

                let grossAmnt = amount - taxAmnt;

                taxrepRecord.selectNewLine({
                    sublistId : taxcodeSublistId
                });
                taxrepRecord.setCurrentSublistValue({
                    sublistId : taxcodeSublistId,
                    fieldId : 'custrecord_crw_taxrep_taxcode_tax',
                    value : taxCode
                });
                //custrecord_crw_taxrep_taxcode_gross
                taxrepRecord.setCurrentSublistValue({
                    sublistId : taxcodeSublistId,
                    fieldId : 'custrecord_crw_taxrep_taxcode_gross',
                    value : grossAmnt.toFixed(2)
                });
                taxrepRecord.setCurrentSublistValue({
                    sublistId : taxcodeSublistId,
                    fieldId : 'custrecord_crw_taxrep_taxcode_taxamount',
                    value : taxAmnt.toFixed(2)
                });
                taxrepRecord.setCurrentSublistValue({
                    sublistId : taxcodeSublistId,
                    fieldId : 'custrecord_crw_taxrep_rctax_taxamount',
                    value : taxAmntRev.toFixed(2)
                });
                taxrepRecord.setCurrentSublistValue({
                    sublistId : taxcodeSublistId,
                    fieldId : 'custrecord_crw_taxrep_depapp_taxamount',
                    value : taxAmntDepApp.toFixed(2)
                });

                taxrepRecord.commitLine({
                    sublistId : taxcodeSublistId
                });

                popdvId = taxCodeObj[taxCode]["popdvIdField"];
                const isReduced = taxCodeObj[taxCode]["reducedRate"];
                const popdvDeductableCode = taxCodeObj[taxCode]["popdvDeductableCode"];

                log.debug({
                    title :'popdvId',
                    details : popdvId
                });

                if (popdvId){
                    let options = {
                        "taxrepRecord" : taxrepRecord,
                        "isDepApp" : false,
                        "isReduced" : isReduced,
                        "popdvId" : popdvId,
                        "taxAmount" : taxAmnt,
                        "taxBase" : grossAmnt,
                        "taxDepApp" : taxAmntDepApp,
                        "popdvDeductableCode" : popdvDeductableCode
                    }
                    crw_tax_util.addPopdvAmounts(options);
                }
                return true;
            });

            taxCodeSumSS = crw_tax_util.depositAppTaxTransactions(startDate,endDate,subsidiaryId);
            taxCodeSumSS.each(function (result){
                log.debug({
                    title : 'depositAppTaxTransactions.each',
                    details : result
                });

                const taxCode = result.getValue({ name: 'custbody_crw_taxcode',join: "appliedToTransaction", summary: search.Summary.GROUP });
                const parentTax = taxCodeObj[taxCode]["depappTaxCode"];

                let amount = parseFloat(result.getValue({ name: 'amount', summary: search.Summary.SUM }));
                let taxAmnt = 0.00;
                let rate = taxCodeObj[taxCode]["rate"];

                let taxAmntDepApp = amount / (1 + rate / 100) * (rate / 100);
                let taxAmntRev = 0.0;

                let grossAmnt = amount - taxAmntDepApp;

                taxrepRecord.selectNewLine({
                    sublistId : taxcodeSublistId
                });

                taxrepRecord.setCurrentSublistValue({
                    sublistId : taxcodeSublistId,
                    fieldId : 'custrecord_crw_taxrep_taxcode_tax',
                    value : parentTax
                });
                //custrecord_crw_taxrep_taxcode_gross
                taxrepRecord.setCurrentSublistValue({
                    sublistId : taxcodeSublistId,
                    fieldId : 'custrecord_crw_taxrep_taxcode_gross',
                    value : grossAmnt.toFixed(2)
                });
                taxrepRecord.setCurrentSublistValue({
                    sublistId : taxcodeSublistId,
                    fieldId : 'custrecord_crw_taxrep_taxcode_taxamount',
                    value : taxAmnt.toFixed(2)
                });
                taxrepRecord.setCurrentSublistValue({
                    sublistId : taxcodeSublistId,
                    fieldId : 'custrecord_crw_taxrep_rctax_taxamount',
                    value : taxAmntRev.toFixed(2)
                });

                taxrepRecord.setCurrentSublistValue({
                    sublistId : taxcodeSublistId,
                    fieldId : 'custrecord_crw_taxrep_depapp_taxamount',
                    value : taxAmntDepApp.toFixed(2)
                });

                taxrepRecord.commitLine({
                    sublistId : taxcodeSublistId
                });

                popdvId = taxCodeObj[taxCode]["popdvIdField"];
                popdvParentTaxId = taxCodeObj[parentTax]["popdvTaxIdField"]
                popdvParentId = taxCodeObj[parentTax]["popdvIdField"];

                popdvParentTaxId = popdvParentTaxId ? popdvParentTaxId : popdvParentId;

                let isReverse = false; // TODO : ReverseCharge AVANS??
                let isDepApp = true;
                if (popdvId){
                    let options = {
                        "isReverse" : isReverse,
                        "isDepApp" : isDepApp,
                        "taxrepRecord" : taxrepRecord,
                        "popdvId" : popdvId,
                        "taxAmount" : 0.00,
                        "taxAmntRev" : 0.00,
                        "taxDepApp" : taxAmntDepApp,
                        "taxBase" : 0.00,  //ignore taxBase
                        "popdvTaxId" : popdvTaxId,
                        "popdvParentTaxId" : popdvParentTaxId
                    }
                    crw_tax_util.addPopdvAmounts(options);
                }
                log.debug({
                    title :'popdvId',
                    details : popdvId
                });

                return true; // continue with each
            })
        }

        return {onAction};
    });
