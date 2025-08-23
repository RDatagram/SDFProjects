/**
 * @NApiVersion 2.1
 */
define(['N/record', 'N/search'],
    /**
     * @param{record} record
     * @param{Search} search
     */
    (record, search) => {

        const POPDVSUBLIST = 'recmachcustrecord_crw_taxrep_popdv_parent';

        function taxCodeSum(dateStart, dateEnd, subsidiaryId) {
            const dateFilter = (dateStart && dateEnd) ? ["trandate", "within", dateStart, dateEnd] : ["trandate", "within", "lastmonth"];
            /*
            TODO : Sta je ovo? Izbrisano iz filter sekcije
            ,
                    'AND',
                    [
                        ['taxitem.custrecord_4110_import', 'is', 'F'],
                        'OR',
                        ['taxitem.isexport', 'is', 'F']
                    ]
             */
            return search.create({
                type: "transaction",
                settings: [
                    {
                        name: 'consolidationtype',
                        value: 'NONE'
                    }
                ],
                filters: [
                    ["taxitem.country", "anyof", "RS"],
                    "AND",
                    ["posting", "is", "T"],
                    "AND",
                    ["subsidiary", "anyof", subsidiaryId],
                    "AND",
                    ["taxline", "is", "F"],
                    "AND",
                    dateFilter,
                    /*
                    'AND',
                    // ommit journal transactions totally
                    ['type', 'noneof', ['Journal']]
                     */
                ],
                columns: [
                    search.createColumn({
                        name: "grossamount",
                        summary: "SUM"
                    }),
                    search.createColumn({
                        name: "taxcode",
                        summary: "GROUP"
                    }),
                    search.createColumn({
                        name: "taxamount",
                        summary: "SUM"
                    }),
                    //Unbilled Receivable
                    search.createColumn({
                        name: "formulacurrency",
                        formula: "CASE WHEN ({accounttype}='Other Current Liability' OR {accounttype}='Long Term Liability' OR {accounttype}='Deferred Revenue')AND {debitamount}>0 THEN {amount}*(-1)WHEN ({accounttype}='Bank' OR {accounttype}='Other Current Asset' OR {accounttype}='Fixed Asset' OR {accounttype}='Other Asset' OR {accounttype}='Deffered Expense' OR {accounttype}='Unbilled Receivable')AND {creditamount}>0 THEN {amount}*(-1)ELSE {amount}END",
                        label: "amount",
                        summary: "SUM"
                    }),
                    search.createColumn({
                        name: "formulacurrency2",
                        formula: "CASE WHEN ({accounttype}='Other Current Liability' OR {accounttype}='Long Term Liability' OR {accounttype}='Deferred Revenue')AND {debitamount}>0 THEN {taxamount}*(-1)WHEN ({accounttype}='Bank' OR {accounttype}='Other Current Asset' OR {accounttype}='Fixed Asset' OR {accounttype}='Other Asset' OR {accounttype}='Deffered Expense' OR {accounttype}='Unbilled Receivable')AND {creditamount}>0 THEN {taxamount}*(-1)ELSE {taxamount}END",
                        label: "amount",
                        summary: "SUM"
                    })
                ]
            }).run();

        }

        function depositTaxTransactions(dateStart, dateEnd, subsidiaryId) {

            const dateFilter = (dateStart && dateEnd) ? ["trandate", "within", dateStart, dateEnd] : ["trandate", "within", "lastmonth"];

            return search.create({
                type: 'transaction',
                settings: [
                    {
                        name: 'consolidationtype',
                        value: 'NONE'
                    }
                ],
                filters: [
                    dateFilter,
                    'AND',
                    [
                        ['recordtype', 'is', 'customerdeposit'],
                        'OR',
                        ['recordtype', 'is', 'vendorprepayment']
                    ],
                    'AND',
                    ["posting", "is", "T"],
                    "AND",
                    ["subsidiary", "anyof", subsidiaryId],
                    "AND",
                    ['mainline', 'is', 'T']
                ],


                columns: [
                    search.createColumn({
                        name: "amount",
                        summary: "SUM"
                    }),
                    search.createColumn({
                        name: "custbody_crw_taxcode",
                        summary: "GROUP"
                    }),
                    search.createColumn({
                        name: "custbody_crw_taxamount",
                        summary: "SUM"
                    })
                ]
            }).run();

        }

        function depositAppTaxTransactions(dateStart, dateEnd, subsidiaryId) {

            const dateFilter = (dateStart && dateEnd) ? ["trandate", "within", dateStart, dateEnd] : ["trandate", "within", "lastmonth"];

            return search.create({
                type: 'transaction',
                settings: [
                    {
                        name: 'consolidationtype',
                        value: 'NONE'
                    }
                ],
                filters: [
                    dateFilter,
                    'AND',
                    [
                        ['recordtype', 'is', 'depositapplication'],
                        'OR',
                        ['recordtype', 'is', 'vendorprepaymentapplication']
                    ],
                    'AND',
                    ["posting", "is", "T"],
                    "AND",
                    ["subsidiary", "anyof", subsidiaryId],
                    "AND",
                    ['mainline', 'is', 'T']
                ],


                columns:
                    [
                        search.createColumn({
                            name: "amount",
                            summary: "SUM"
                        }),
                        search.createColumn({
                            name: "custbody_crw_taxcode",
                            join: "appliedToTransaction",
                            summary: "GROUP"
                        })
                    ]
            }).run();

        }

        function getPopdvCodes() {
            const searchRun = search.create({
                type: "customrecord_crw_popdv_code",
                filters: [],
                columns: [
                    'internalid',
                    'name'
                ]
            }).run();

            let map = {};

            searchRun.each(function (result) {
                map[result.getValue('name').toLowerCase()] = {
                    internalId: result.getValue('internalid')
                };
                return true;
            });

            return map;
        }

        function getTaxCodes() {
            const searchRun = search.create({
                type: search.Type.SALES_TAX_ITEM,
                filters: [['country', 'anyof', 'RS']],
                columns: [
                    'internalid',
                    'name',
                    'itemid',
                    'rate',
                    'country',
                    'custrecord_popdv_code',
                    'custrecord_crw_popdv_tax_only',
                    'custrecord_crw_neodbitni',
                    'custrecord_crw_posebna_stopa',
                    'isreversecharge',
                    'parent',
                    'custrecord_crw_depapp_taxcode',
                    'custrecord_crw_popdv_deductable_code'
                ]
            }).run();

            let obj = {};
            searchRun.each(function (result) {
                obj[result.getValue('internalid')] = {
                    internalId: result.getValue('internalid'),
                    rate: parseFloat(result.getValue("rate")),
                    popdvField: result.getText("custrecord_popdv_code"), // text
                    popdvIdField: result.getValue("custrecord_popdv_code"), // id
                    popdvTaxField: result.getText("custrecord_crw_popdv_tax_only"),
                    popdvTaxIdField: result.getValue("custrecord_crw_popdv_tax_only"),
                    //popdvDeductionField: result.getValue("custrecord_odbitnipdv").toLowerCase(),
                    //reverseChargeField: result.getValue("custrecord_rcpopdv").toLowerCase(),
                    reducedRate: result.getValue("custrecord_crw_posebna_stopa"),
                    reverseCharge: result.getValue("isreversecharge"),
                    nonDeductable: result.getValue("custrecord_crw_neodbitni"),
                    popdvDeductableCode: result.getValue("custrecord_crw_popdv_deductable_code"),
                    parent: result.getValue("parent") ? result.getValue("parent") : null,
                    depappTaxCode: result.getValue("custrecord_crw_depapp_taxcode") ? result.getValue("custrecord_crw_depapp_taxcode") : null
                };
                return true;
            });
            return obj;
        }

        /**
         *
         * @param {Record} taxrepRecord
         */
        function zeroPopdvSublist(taxrepRecord) {
            const numLines = taxrepRecord.getLineCount({
                sublistId: POPDVSUBLIST
            });
            for (let ii = 0; ii < numLines; ii++) {
                taxrepRecord.selectLine({
                    sublistId: POPDVSUBLIST,
                    line: ii
                });
                taxrepRecord.setCurrentSublistValue({
                    sublistId: POPDVSUBLIST,
                    fieldId: 'custrecord_crw_taxrep_popdv_taxamount',
                    value: 0.00
                })
                taxrepRecord.commitLine({
                    sublistId: POPDVSUBLIST
                });
            }
        }

        function addPopdvAmounts(options) {
            const taxrepRecord = options.taxrepRecord;
            const popdvId = options.popdvId || "";
            const taxAmount = options.taxAmount || 0.00;
            const taxAmntRev = options.taxAmntRev || 0.00;
            const taxDepApp = options.taxDepApp || 0.00;
            const taxBase = options.taxBase || 0.00;
            const isReverse = options.isReverse;
            const isReduce = options.isReduced;

            const isDepApp = options.isDepApp ? options.isDepApp : false;

            const popdvTaxId = options.popdvTaxId || popdvId;
            const popdvParentTaxId = options.popdvParentTaxId || "";
            const popdvDeductableId = options.popdvDeductableCode || "";

            log.debug({
                title: ' addPopdvAmounts.options',
                details: {
                    "popdvId": popdvId,
                    "taxAmount": taxAmount,
                    "taxAmntRev": taxAmntRev,
                    "taxBase": taxBase ? taxBase : -1,
                    "isReverse": isReverse,
                    "popdvTaxId": popdvTaxId,
                    "popdvParentTaxId": popdvParentTaxId,
                    "popdvDeductableId":popdvDeductableId
                }
            });

            const numLines = taxrepRecord.getLineCount({
                sublistId: POPDVSUBLIST
            });

            for (let ii = 0; ii < numLines; ii++) {

                let doBreak = false;

                taxrepRecord.selectLine({
                    sublistId: POPDVSUBLIST,
                    line: ii
                });

                let linePopdvId = taxrepRecord.getCurrentSublistValue(
                    {
                        sublistId: POPDVSUBLIST,
                        fieldId: 'custrecord_crw_taxrep_popdv_code'
                    }
                )
                if ((!isDepApp) && (linePopdvId === popdvId)) {
                    // Tax BASE always
                    let FIELDIDBASE = isReduce ? 'custrecord_crw_taxrep_popdv_rtaxbase' : 'custrecord_crw_taxrep_popdv_taxbase';
                    let FIELDIDTAX = isReduce ? 'custrecord_crw_taxrep_popdv_rtaxamount' : 'custrecord_crw_taxrep_popdv_taxamount';

                    let currValue = taxrepRecord.getCurrentSublistValue({
                        sublistId: POPDVSUBLIST,
                        fieldId: FIELDIDBASE
                    });
                    let newValue = currValue + taxBase;
                    taxrepRecord.setCurrentSublistValue({
                        sublistId: POPDVSUBLIST,
                        fieldId: FIELDIDBASE,
                        value: newValue.toFixed(2)
                    });

                    // Tax amount in the same row
                    if (linePopdvId === popdvTaxId) {
                        let currTaxValue = taxrepRecord.getCurrentSublistValue({
                            sublistId: POPDVSUBLIST,
                            fieldId: FIELDIDTAX
                        });
                        let newTaxValue = currTaxValue + taxAmount;
                        taxrepRecord.setCurrentSublistValue({
                            sublistId: POPDVSUBLIST,
                            fieldId: FIELDIDTAX,
                            value: newTaxValue.toFixed(2)
                        });
                    }
                    taxrepRecord.commitLine({
                        sublistId: POPDVSUBLIST
                    });
                    doBreak = true;
                }
                if ((!isDepApp) && (linePopdvId === popdvDeductableId)) {
                    // Tax BASE always
                    let FIELDIDTAX = isReduce ? 'custrecord_crw_taxrep_popdv_rtaxamount' : 'custrecord_crw_taxrep_popdv_taxamount';

                    // Tax amount in the same row
                    let currTaxValue = taxrepRecord.getCurrentSublistValue({
                        sublistId: POPDVSUBLIST,
                        fieldId: FIELDIDTAX
                    });
                    let newTaxValue = currTaxValue + taxAmount;
                    taxrepRecord.setCurrentSublistValue({
                        sublistId: POPDVSUBLIST,
                        fieldId: FIELDIDTAX,
                        value: newTaxValue.toFixed(2)
                    });
                    taxrepRecord.commitLine({
                        sublistId: POPDVSUBLIST
                    });
                    doBreak = true;
                }

                /*
                TAX Amount when taxcode is reverse charge and parent tax code is processing
                */
                if ((isReverse) && (linePopdvId === popdvParentTaxId)) {

                    let FIELDIDTAX = isReduce ? 'custrecord_crw_taxrep_popdv_rtaxamount' : 'custrecord_crw_taxrep_popdv_taxamount';

                    let currValue = taxrepRecord.getCurrentSublistValue({
                        sublistId: POPDVSUBLIST,
                        fieldId: 'custrecord_crw_taxrep_popdv_taxamount'
                    });

                    let newValue = currValue + taxAmntRev;

                    taxrepRecord.setCurrentSublistValue({
                        sublistId: POPDVSUBLIST,
                        fieldId: 'custrecord_crw_taxrep_popdv_taxamount',
                        value: newValue.toFixed(2)
                    });
                    taxrepRecord.commitLine({
                        sublistId: POPDVSUBLIST
                    });
                }

                /*
                TAX Amount when taxcode is reverse charge and transaction tax code is processing. PoPDV field is not the same as taxbase PoPDV field
                */
                if ((isReverse) && (linePopdvId === popdvTaxId)) {

                    let FIELDIDTAX = isReduce ? 'custrecord_crw_taxrep_popdv_rtaxamount' : 'custrecord_crw_taxrep_popdv_taxamount';

                    let currValue = taxrepRecord.getCurrentSublistValue({
                        sublistId: POPDVSUBLIST,
                        fieldId: FIELDIDTAX
                    });

                    let newValue = currValue + taxAmntRev;

                    taxrepRecord.setCurrentSublistValue({
                        sublistId: POPDVSUBLIST,
                        fieldId: FIELDIDTAX,
                        value: newValue.toFixed(2)
                    });
                    taxrepRecord.commitLine({
                        sublistId: POPDVSUBLIST
                    });
                }

                if ((isDepApp) && (linePopdvId === popdvParentTaxId)) {

                    let FIELDIDTAX = isReduce ? 'custrecord_crw_taxrep_popdv_rtaxamount' : 'custrecord_crw_taxrep_popdv_taxamount';

                    let currValue = taxrepRecord.getCurrentSublistValue({
                        sublistId: POPDVSUBLIST,
                        fieldId: FIELDIDTAX
                    });

                    let newValue = currValue + taxDepApp;

                    taxrepRecord.setCurrentSublistValue({
                        sublistId: POPDVSUBLIST,
                        fieldId: FIELDIDTAX,
                        value: newValue.toFixed(2)
                    });
                    taxrepRecord.commitLine({
                        sublistId: POPDVSUBLIST
                    });
                }
            }
        }

        /**
         *
         * @param options
         *
         * @param {Record} options.taxRepRecord
         * @param {Object} options.popdvMap
         * @param {String} options.popdvCode
         * @param {String} options.popdvField
         * @return {Object}
         *
         */
        function getPopdvValue(options) {

            const debugOptions = Object.assign({}, options);
            delete debugOptions["taxRepRecord"];

            const taxReportRecord = options.taxRepRecord;
            const popdvMap = options.popdvMap; // loaded in upper level
            const popdvIdObj = popdvMap[options.popdvCode];
            const popdvId = popdvIdObj.internalId;
            const popdvField = options.popdvField;

            log.debug({
                title: 'crw_util.consts',
                details: {"popdvId": popdvId, "popdvField": popdvField}
            })
            let retObj = {
                "found": false,
                "value": 0.00
            };

            const lineCount = taxReportRecord.getLineCount({
                sublistId: POPDVSUBLIST
            });

            for (let ii = 0; ii < lineCount; ii++) {

                taxReportRecord.selectLine({
                    sublistId: POPDVSUBLIST,
                    line: ii
                });

                let linePopdvId = taxReportRecord.getCurrentSublistValue(
                    {
                        sublistId: POPDVSUBLIST,
                        fieldId: 'custrecord_crw_taxrep_popdv_code'
                    }
                )

                if (linePopdvId === popdvId) {
                    retObj.found = true;
                    retObj.value = parseFloat(taxReportRecord.getCurrentSublistValue({
                        sublistId: POPDVSUBLIST,
                        fieldId: popdvField
                    }));
                    break;
                }
            }
            return retObj
        }

        return {
            taxCodeSum,
            getTaxCodes,
            zeroPopdvSublist,
            addPopdvAmounts,
            depositTaxTransactions,
            depositAppTaxTransactions,
            getPopdvCodes,
            getPopdvValue
        }

    });
