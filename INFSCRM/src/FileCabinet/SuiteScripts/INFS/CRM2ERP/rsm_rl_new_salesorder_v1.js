/**
 * @NApiVersion 2.0
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 */

// TODO : Sprovesti currency kroz kreiranje SO, preuzeti sa customer record

/* TODO : upis poslatog ili calculate so_duedate (trandate+broj_dana_za_uplatu)
    - prvo testirati da li je poslat unapred definisan datum u JSON - ignorisati broj_dana_za_uplatu
    - ako nema so_duedate u JSON, ili je prazan , proveriti vrednost broj_dana_za_uplatu i izracunati :(
 */

define(['N/search', 'N/record', 'N/format', './rsm_crm2erp_util', './rsm_crm2erp_restlets'],

    function (searchModule, recordModule, format, crm2erp_util, crm2erp_restlets) {

        /**
         * Function called upon sending a POST request to the RESTlet.
         *
         * @param {string | Object} requestBody
         * @param {number} requestBody.customer
         * @param {number} requestBody.subsidiary
         * @param {number} requestBody.department
         * @param {number} requestBody.location
         * @param {number} requestBody.class
         * @param {number} requestBody.custbody_rsm_infs_fakturista
         * @param {number} requestBody.custbody_rsm_infs_representative
         * @param {string} requestBody.startdate
         * @param {string} requestBody.enddate
         * @param {string} requestBody.trandate
         * @param {boolean} requestBody.custbody_rsm_force_invoice
         * @param {string} requestBody.memo
         * @param {Array} requestBody.itemArray
         * @param {Array} requestBody.parcelArray
         * @param {string} requestBody.custbody_rsm_crm_ordernum
         * @param {string} requestBody.custbody_rsm_crm_ordernum_parent
         * @param {string} requestBody.custbody_rsm_internal_memo
         * @param {string} requestBody.custbody_rsm_so_type
         * @param {number} requestBody.custbody_rsm_so_duration
         * @param {number} requestBody.custbody_rsm_bs_estimates
         * @param {number} requestBody.custbody_rsm_so_brojrata
         * @param {string} requestBody.custbody_rsm_auth_payment_code
         * @param {string} requestBody.custbody_rsm_additional_cc_email
         * @param {string} requestBody.custbody_rsm_additional_bcc_email
         * @param {number} requestBody.custbody_rsm_broj_dana_uplata
         * @param {string} requestBody.custbody_poziv_na_broj
         * @param {string} requestBody.custbody_rsm_sales_delvtype
         * @param {string} requestBody.custbody_rsm_sales_payment_type
         * @param {string} requestBody.terms
         * @param {string} requestBody.email_status
         * @param {string} requestBody.custbody_rsm_napomena_za_print
         * @param {string} requestBody.custbody_rsm_so_duedate
         *
         * @returns {string | Object} HTTP response body; return string when request
         *          Content-Type is 'text/plain'; return Object when request
         *          Content-Type is 'application/json'
         * @since 2015.2
         */
        function doPost(requestBody) {


            var vSalesOrderType = requestBody.custbody_rsm_so_type || '';
            //var accConfig = crm2erp_util.AccountConfig.load();

            if (!vSalesOrderType) {
                return {
                    "result": "error",
                    "message": 'SalesOrderType (custbody_rsm_so_type) je obavezan podatak',
                    "errorName": 'SalesOrderTypeUndefined',
                    "e": {}
                }
            }
            var vSalesOrderTypeId;
            var vDefaultEmailStatusID;

            var soType;

            var vDeliveryTypeId;
            var vPayTypeId;
            var vTermId;
            var vEmailStatusId;

            if (!vSalesOrderType) {
                // NO SALES ORDER TYPE
                vSalesOrderTypeId = -1;
            } else {
                soType = crm2erp_util.SalesOrderType.load(vSalesOrderType);
                vSalesOrderTypeId = soType.getTypeId();
                vDefaultEmailStatusID = soType.getEmailStatus();
            }

            var newSalesOrder;

            /**
             *
             * @param options
             * @param {Array} options.vItemArray
             * @private
             */
            function _processItems(options) {
                /**
                 * @typedef {Array} _ItemArray
                 */
                var _ItemArray;

                /**
                 * @var {Object} _OneItem
                 * @property {number} item : InternalID of item
                 * @property {number} quantity : Quantity
                 * @property {number} rate : Rate
                 * @property {number} custcol_rsm_package_quantity : Quantity in package
                 * @property {number} custcol_rsm_item_rate_full : Full rate without discount
                 * @property {number} custcol_rsm_item_rate_discount : Discount (%)
                 * @property {number} taxcode : TaxCode
                 * @property {boolean} createpo : Create Purchase Order for Item
                 * @property {number} povendor : Vendor ID for Purchase Order
                 * @property {number} porate : Vendor price for Purchase Order
                 * @property {number} location : Inventory location for commiting
                 *
                 */
                var _OneItem;

                var _RateFull;
                var _RateDiscount;
                var _Rate;
                var _Amount;
                var _TaxCode;
                var _SpecOrd;
                var _PoVendor;
                var _PoRate;
                var _PackageQuantity;
                var _Location;

                _ItemArray = options.vItemArray;

                for (var ia = 0; ia < _ItemArray.length; ia++) {

                    _OneItem = _ItemArray[ia];

                    newSalesOrder.selectNewLine({
                        sublistId: 'item'
                    });
                    newSalesOrder.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'item',
                        value: _OneItem.item
                    });
                    newSalesOrder.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'quantity',
                        value: _OneItem.quantity
                    });

                    /*
                    TODO : ako ima discount probati da se forsira pricelevel -1
                    TODO : LOGIKA sa cenama
                    - NetSuite RATE obavezan
                    - RSM FullRate i Discount - uslovno u odsustvu copy Rate i 0% discount
                    */

                    _Rate = _OneItem.rate || 0.00;
                    _Amount = _OneItem.amount || 0.00;
                    _RateFull = _OneItem.custcol_rsm_item_rate_full || _Rate;
                    _RateDiscount = _OneItem.custcol_rsm_item_rate_discount || 0.00;
                    _PackageQuantity = _OneItem.custcol_rsm_package_quantity || 0.00;

                    newSalesOrder.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_rsm_package_quantity',
                        value: _PackageQuantity
                    });

                    newSalesOrder.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_rsm_item_rate_full',
                        value: _RateFull
                    });
                    newSalesOrder.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_rsm_item_rate_discount',
                        value: _RateDiscount
                    });

                    if (_Rate > 0.00) {
                        newSalesOrder.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'rate',
                            value: _Rate
                        });
                    } else {
                        throw {message: "Cena je obavezna", name: "ITEM_PRICE_REQUEIRED"}
                    }

                    if (_Amount > 0.00) {
                        newSalesOrder.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'amount',
                            value: _Amount
                        });
                    }
                    _TaxCode = _OneItem.taxcode;
                    if (_TaxCode) {
                        newSalesOrder.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'taxcode',
                            value: _TaxCode
                        });
                    }

                    _SpecOrd = _OneItem.createpo || '';
                    _Location = _OneItem.location || '';

                    // TODO : Purchase Price

                    if (_SpecOrd) {
                        newSalesOrder.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'createpo',
                            value: 'SpecOrd'
                        });

                        _PoVendor = _OneItem.povendor;
                        _PoRate = _OneItem.porate || _Rate;

                        newSalesOrder.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'povendor',
                            value: _PoVendor
                        });
                        newSalesOrder.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'porate',
                            value: _PoRate
                        });

                        if (_Location) {
                            newSalesOrder.setCurrentSublistValue({
                                sublistId : 'item',
                                fieldId : 'location',
                                value : _Location
                            });
                            newSalesOrder.setCurrentSublistValue({
                                sublistId : 'item',
                                fieldId : 'inventorylocation',
                                value : _Location
                            });
                        }

                    } else {
                        newSalesOrder.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'createpo',
                            value: ' '
                        });
                    }
                    newSalesOrder.commitLine({
                        sublistId: 'item'
                    });
                }
            }

            /**
             * @param options
             * @param {Array} options.vParcelArray
             * @private
             */
            function _processParcels(options) {

                /**
                 * @typedef {Array} _ParcelArray
                 */
                var _ParcelArray;
                /**
                 * @var {Object} _OneParcel
                 * @property {string} parcel_service : Courier Service
                 * @property {string} parcel_id : Delivery id
                 * @property {number} parcel_dc : Delivery cost
                 */
                var _OneParcel;

                var _Sublist = 'recmachcustrecord_rsm_courier_parcel_tran';

                _ParcelArray = options.vParcelArray;
                if (!_ParcelArray) {
                    return;
                }

                for (var ip = 0; ip < _ParcelArray.length; ip++) {
                    newSalesOrder.selectNewLine({
                        sublistId: _Sublist
                    });

                    _OneParcel = _ParcelArray[ip];
                    newSalesOrder.setCurrentSublistText({
                        sublistId: _Sublist,
                        fieldId: 'custrecord_rsm_courier_parcel_service',
                        text: _OneParcel.parcel_service
                    });

                    newSalesOrder.setCurrentSublistValue({
                        sublistId: _Sublist,
                        fieldId: 'custrecord_rsm_courier_parcel_id',
                        value: _OneParcel.parcel_id
                    });

                    newSalesOrder.setCurrentSublistValue({
                        sublistId: _Sublist,
                        fieldId: 'custrecord_rsm_courier_parcel_dc',
                        value: _OneParcel.parcel_dc
                    });

                    newSalesOrder.commitLine({
                        sublistId: _Sublist
                    })
                }
            }

            function addDays(date, days) {
                var result = new Date(date);
                result.setDate(result.getDate() + days);
                return result;
            }

            try {
                var vCustomer = requestBody.customer;
                var vSubsidiary = requestBody.subsidiary;
                var vDepartment = requestBody.department;
                var vLocation = requestBody.location;
                var vClass = requestBody.class;
                var vFakturista = requestBody.custbody_rsm_infs_fakturista;
                var vRepresentative = requestBody.custbody_rsm_infs_representative;
                var vStartDate = requestBody.startdate;
                var vEndDate = requestBody.enddate;
                var vOdmahInvoice = requestBody.custbody_rsm_force_invoice || false;
                var vMemo = requestBody.memo || '';
                var vCrmOrdernum = requestBody.custbody_rsm_crm_ordernum || '';
                var vCrmOrdernum_parent = requestBody.custbody_rsm_crm_ordernum_parent || '';
                var vInternalMemo = requestBody.custbody_rsm_internal_memo || '';
                var v_custbody_rsm_napomena_za_print = requestBody.custbody_rsm_napomena_za_print || '';
                var vSalesOrderDuration = requestBody.custbody_rsm_so_duration || 0;
                var vAuthPaymentCode = requestBody.custbody_rsm_auth_payment_code || '';

                var v_rsm_additional_cc_email = requestBody.custbody_rsm_additional_cc_email || '';
                var v_rsm_additional_bcc_email = requestBody.custbody_rsm_additional_bcc_email || '';
                var v_rsm_broj_dana_uplata = requestBody.custbody_rsm_broj_dana_uplata || 0;
                var v_rsm_so_duedate = requestBody.custbody_rsm_so_duedate || '';
                var v_custbody_poziv_na_broj = requestBody.custbody_poziv_na_broj || '';

                var v_custbody_rsm_sales_delvtype = requestBody.custbody_rsm_sales_delvtype || '';
                var v_custbody_rsm_sales_payment_type = requestBody.custbody_rsm_sales_payment_type || '';
                var v_terms = requestBody.terms || '';

                var v_email_status = requestBody.email_status || '';

                log.debug({title:"+ v_email_status",details:v_email_status});
                log.debug({title:"+ vDefaultEmailStatusID",details:vDefaultEmailStatusID});

                if (v_email_status) {
                    // poslat je eMail status
                    vEmailStatusId = crm2erp_util.GetEmailStatusId(v_email_status);
                    log.debug({title:"vEmailStatusId od v_email_status",details:vEmailStatusId});
                } else {
                    // eMail status nije u JSON, da li SalesOrderType ima default?
                    if (!vDefaultEmailStatusID) {
                        // nema JSON, nema Default - podesi SKIP
                        vEmailStatusId = crm2erp_util.GetEmailStatusId('SKIP');
                        log.debug({title:"vEmailStatusId od SKIP",details:vEmailStatusId});
                    } else {
                        // nema JSON, ima Default - prosledi ID
                        vEmailStatusId = vDefaultEmailStatusID;
                        log.debug({title:"vEmailStatusId od vDefaultEmailStatusID",details:vEmailStatusId});
                    }
                }

                // TODO : sredi ovo!!!
                // var bsEst = soRec.getValue('custbody_rsm_bs_estimates');
                var bsEst = 18; // testno mesecno
                //var bsEst = accConfig.getSoeBS();

                var bsCount = requestBody.custbody_rsm_so_brojrata || 0;

                var vTrandate = format.parse({
                    value: requestBody.trandate,
                    type: format.Type.DATE,
                    timezone: format.Timezone.EUROPE_BUDAPEST
                });

                newSalesOrder = recordModule.create({
                    type: recordModule.Type.SALES_ORDER,
                    isDynamic: true
                });

                newSalesOrder.setValue('entity', vCustomer);
                newSalesOrder.setValue('trandate', vTrandate);
                newSalesOrder.setValue('custbody_rsm_broj_dana_uplata',v_rsm_broj_dana_uplata);

                if (v_rsm_so_duedate) {
                    newSalesOrder.setValue('custbody_rsm_so_duedate', format.parse({
                        value: v_rsm_so_duedate,
                        type: format.Type.DATE,
                        timezone: format.Timezone.EUROPE_BUDAPEST
                    }));
                } else if (v_rsm_broj_dana_uplata > 0) {
                    var tmpDate = newSalesOrder.getValue("trandate");
                    tmpDate = addDays(tmpDate, v_rsm_broj_dana_uplata);
                    newSalesOrder.setValue('custbody_rsm_so_duedate',tmpDate);
                }

                if (vSalesOrderTypeId !== -1) {
                    newSalesOrder.setValue({
                        fieldId: 'custbody_rsm_so_type',
                        value: vSalesOrderTypeId,
                        ignoreFieldChange: true
                    });
                }

                if (vStartDate) {
                    newSalesOrder.setValue('startdate', format.parse({
                        value: vStartDate,
                        type: format.Type.DATE,
                        timezone: format.Timezone.EUROPE_BUDAPEST
                    }));
                }
                if (vEndDate) {
                    newSalesOrder.setValue('enddate', format.parse({
                        value: vEndDate,
                        type: format.Type.DATE,
                        timezone: format.Timezone.EUROPE_BUDAPEST
                    }));
                }

                newSalesOrder.setValue({
                    fieldId: 'custbody_rsm_so_duration',
                    value: vSalesOrderDuration
                });

                newSalesOrder.setValue('subsidiary', vSubsidiary);
                newSalesOrder.setValue('department', vDepartment);
                newSalesOrder.setValue('location', vLocation);
                newSalesOrder.setValue('class', vClass);
                newSalesOrder.setValue('memo', vMemo);
                newSalesOrder.setValue('custbody_rsm_napomena_za_print',v_custbody_rsm_napomena_za_print);
                newSalesOrder.setValue('custbody_rsm_crm_ordernum', vCrmOrdernum);
                newSalesOrder.setValue('custbody_rsm_crm_ordernum_parent', vCrmOrdernum_parent);
                newSalesOrder.setValue('custbody_rsm_additional_cc_email',v_rsm_additional_cc_email);
                newSalesOrder.setValue('custbody_rsm_additional_bcc_email',v_rsm_additional_bcc_email);

                if (bsCount > 0) {
                    newSalesOrder.setValue('custbody_rsm_bs_estimates', bsEst);
                    newSalesOrder.setValue('custbody_rsm_so_brojrata', bsCount);
                } else {
                    newSalesOrder.setValue('custbody_rsm_so_brojrata', 0);
                }

                if (vFakturista) {
                    newSalesOrder.setValue('custbody_rsm_infs_fakturista', vFakturista);
                }
                if (vRepresentative) {
                    newSalesOrder.setValue('custbody_rsm_infs_representative', vRepresentative)
                }
                if (vInternalMemo) {
                    newSalesOrder.setValue('custbody_rsm_internal_memo', vInternalMemo);
                }

                if (vAuthPaymentCode) {
                    newSalesOrder.setValue('custbody_rsm_auth_payment_code', vAuthPaymentCode);
                }

                if (soType.getHasBillingSchedule() === 'T') {
                    newSalesOrder.setValue('billingschedule', soType.getBillingSchedule());
                }

                if (v_custbody_poziv_na_broj){
                    newSalesOrder.setValue('custbody_poziv_na_broj',v_custbody_poziv_na_broj);
                }

                if (v_custbody_rsm_sales_delvtype) {
                    vDeliveryTypeId = crm2erp_util.GetDeliveryTypeId(v_custbody_rsm_sales_delvtype);

                    if (vDeliveryTypeId != -1){
                        newSalesOrder.setValue({
                            fieldId : 'custbody_rsm_sales_delvtype',
                            value : vDeliveryTypeId
                        })
                    }
                }

                if (vEmailStatusId != -1){
                    newSalesOrder.setValue({
                        fieldId : 'custbody_rsm_salesorder_email_status',
                        value : vEmailStatusId
                    })
                }

                if (v_custbody_rsm_sales_payment_type){
                    vPayTypeId = crm2erp_util.GetPayTypeId(v_custbody_rsm_sales_payment_type);
                    if (vPayTypeId != -1){
                        newSalesOrder.setValue({
                            fieldId: 'custbody_rsm_sales_payment_type',
                            value: vPayTypeId
                        })
                    }
                }
                if (v_terms){
                    vTermId = crm2erp_util.GetTermId(v_terms);
                        // ovde idemo bezuslovan upis, ako je -1 kada nema terms u NetSuite, dizemo error
                        newSalesOrder.setValue({
                            fieldId: 'terms',
                            value: vTermId
                        });

                }

                _processItems({
                    vItemArray: requestBody.itemArray
                })

                _processParcels({
                    vParcelArray: requestBody.parcelArray || []
                })

                if (soType.getCreateInvoice() === 'T') {
                    newSalesOrder.setValue('custbody_rsm_force_invoice', vOdmahInvoice);
                }

                // KREIRANJE SALES ORDER-a

                var nId = newSalesOrder.save();
                var cpdfMessage = [];

                if (soType.getCreatePDF() === "T") {
                    try {
                        crm2erp_restlets.createSalesOrderPDF({soId: nId, location: newSalesOrder.getText('location')});
                        cpdfMessage.push({'step' : 'CreateSalesOrderPDF', 'message' : 'Kreiran PDF', 'status' : 'ok'});
                    } catch (e) {
                        cpdfMessage.push({'step' : 'CreateSalesOrderPDF', 'message' : 'Greska prilikom kreiranja PDF', 'status' : 'error'});
                    }
                } else {
                    cpdfMessage.push({'step' : 'CreateSalesOrderPDF', 'message' : 'Kreiranje PDF nije zahtevano', 'status' : 'ok'});
                }
                var transMessage;
                transMessage = [];
                if (soType.getItemReciept() === 'T') {

                    var metaArr;
                    metaArr = crm2erp_util.GetSalesOrderMeta(nId);
                    if (metaArr.length > 0) {
                        var _OneMeta;

                        var irRecord;
                        for (var im = 0; im < metaArr.length; im++) {
                            _OneMeta = metaArr[im];

                            if (_OneMeta.recordType === 'purchaseorder') {
                                transMessage.push(JSON.stringify(_OneMeta))
                                try {
                                    irRecord = recordModule.transform({
                                        fromType: 'purchaseorder',
                                        fromId: _OneMeta.id,
                                        toType: 'itemreceipt'
                                    });
                                    //
                                    irRecord.setValue('trandate',vTrandate);
                                    irRecord.save();
                                } catch (e) {
                                    transMessage.push(e.message)
                                }
                            }
                        }

                    }
                }
                var soLookup = searchModule.lookupFields({
                    type: searchModule.Type.SALES_ORDER,
                    id: nId,
                    columns: ['trandate', 'enddate']
                });

                var soInvTranDate = soLookup.trandate;
                var soInvEndDate = soLookup.enddate;

                var invTranDate = format.parse({
                    value: soInvEndDate || soInvTranDate,
                    type: format.Type.DATE,
                    timezone: format.Timezone.EUROPE_BUDAPEST
                });

                if (soType.getItemFullfilment() === 'T') {
                    var ifRecord;
                    try {
                        ifRecord = recordModule.transform({
                            fromType: 'salesorder',
                            fromId: nId,
                            toType: 'itemfulfillment',
                            defaultValues: {
                                inventorylocation: vLocation
                            }
                        });
                        ifRecord.setValue('trandate', new Date(invTranDate));
                        ifRecord.save();

                    } catch (e) {
                        transMessage.push(e.message)
                    }
                }
                if (soType.getCreateInvoice() === 'T') {
                    var inRecord;
                    try {
                        inRecord = crm2erp_util.SalesOrderToInvoice(nId);
                        if (inRecord) {
                            /*
                            var soLookup = searchModule.lookupFields({
                                type: searchModule.Type.SALES_ORDER,
                                id: nId,
                                columns: ['trandate', 'enddate']
                            });
                            var soInvTranDate = soLookup.trandate;
                            var soInvEndDate = soLookup.enddate;
                            var invTranDate = format.parse({
                                value: soInvEndDate || soInvTranDate,
                                type: format.Type.DATE,
                                timezone: format.Timezone.EUROPE_BUDAPEST
                            });

                             */
                            inRecord.setValue('trandate', new Date(invTranDate));
                            inRecord.setValue('custbody_popdv_datum', new Date(invTranDate));
                            inRecord.setValue('custbody_cust_dep_pdf_file','');

                            log.debug({
                              title : 'TranID before save',
                              details : inRecord.getValue('tranid')
                            });
                            // SET INITIAL EMAIL STATUS = SALES ORDER JSON email_status
                            if (vEmailStatusId != -1){
                                inRecord.setValue({
                                    fieldId : 'custbody_rsm_invoice_email_status',
                                    value : vEmailStatusId
                                })
                            }
                            var nSavedInvoice = inRecord.save();
                            if (soType.getCreateInvoicePDF() === 'T') {
                                try {
                                    crm2erp_restlets.createInvoicePDF({invoiceId: nSavedInvoice});
                                    cpdfMessage.push({
                                        'step': 'createInvoicePDF',
                                        'message': 'Kreiran PDF',
                                        'status': 'ok'
                                    });
                                } catch (e) {
                                    cpdfMessage.push({
                                        'step': 'createInvoicePDF',
                                        'message': 'Greska prilikom kreiranja PDF',
                                        'status': 'error'
                                    });
                                    cpdfMessage.push(e.message);
                                }
                            }
                        }
                    } catch (e) {
                        transMessage.push({'step' : 'SalesOrderToInovice', 'message': e.message, 'status' : "error"});
                    }
                }

                if (soType.getCreateEstimates() === "T") {
                    try {
                        crm2erp_restlets.createSalesOrderEstimates({idSO: nId});
                        transMessage.push({'step' : 'createSalesOrderEstimates', 'message' : 'Kreirani SO Estimates', 'status' : 'ok'});
                    } catch (e) {
                        transMessage.push({'step' : 'createSalesOrderEstimates', 'message' : 'Greska prilikom kreiranja Estimates', 'status' : 'error'});
                        transMessage.push(e.message)
                    }
                } else {
                    transMessage.push({'step' : 'createSalesOrderEstimates', 'message' : 'Kreiranje Estimates nije zahtevano', 'status' : 'ok'});
                }

                return {
                    "result": 'ok',
                    "internalid": nId,
                    "cpdfMessage": cpdfMessage,
                    "transMessage": transMessage
                }

            } catch (e) {
                return {
                    "result": "error",
                    "message": e.message,
                    "errorName": e.name,
                    "e": e
                }
            }

        }

        /**
         *
         * @param requestParams
         * @param requestParams.orderid
         * @returns {{result: string}|{result: string, errorName, message}}
         */
        function doDelete(requestParams) {
            try {
                recordModule["delete"]({
                    type: 'salesorder',
                    id: requestParams.orderid
                });
                return {
                    "result": "ok"
                }
            } catch (e) {
                return {
                    "result": "error",
                    "message": e.message,
                    "errorName": e.name
                }
            }
        }

        /**
         *
         * @param requestParams
         * @param {Number} requestParams.orderid
         *
         * @returns {{result: string, errorName, message}|{result: string, record: Record}}
         */
        function doGet(requestParams) {
            try {
                var orderRec = recordModule.load({
                    type: recordModule.Type.SALES_ORDER,
                    id: requestParams.orderid
                });
                return {
                    "result": "ok",
                    "record": orderRec
                }
            } catch (e) {
                return {
                    "result": "error",
                    "message": e.message,
                    "errorName": e.name
                }
            }
        }

        return {
            post: doPost,
            'get': doGet,
            // put: doPut,
            'delete': doDelete
        };

    });
