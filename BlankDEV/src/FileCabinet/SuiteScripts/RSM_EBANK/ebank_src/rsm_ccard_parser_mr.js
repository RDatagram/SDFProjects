/**
 * @NApiVersion 2.0
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
define(
    ['N/record', 'N/runtime', 'N/query', 'N/task', 'N/format', './util_ccard', 'N/search'],

    function (record, runtime, query, task, format, util_ccard, searchModule) {

        function getInputData() {

            var scriptObj = runtime.getCurrentScript();
            var idHeader = scriptObj.getParameter({"name": 'custscript_rsm_ccard_mr_param1'});
            var myOptions = {};

            /**
             *
             * @type {Object}
             * @property {number} custrecord_rsm_crdh_file
             * @property {number} custrecord_rsm_crdh_subsidiary
             */
            var look = searchModule.lookupFields({
                type: 'customrecord_rsm_crdh',
                id: idHeader,
                columns: ['custrecord_rsm_crdh_file', 'custrecord_rsm_crdh_subsidiary']
            });

            myOptions.fileId = look.custrecord_rsm_crdh_file[0].value;
            myOptions.subsidiary = look.custrecord_rsm_crdh_subsidiary[0].value;

            var outputArray = [];

            outputArray = util_ccard.csv_parser(myOptions);

            return outputArray;
        }

        function map(context) {

            var resData = JSON.parse(context.value);
            /*
                        var dateAndTimeDelivery = resData.deliveryDate.split(' ');
                        var deliveryDate = dateAndTimeDelivery[0]; // Get only date from date and time

                        var dateAndTimePayment = resData.paymentDate.split(' ');
                        var paymentDate = dateAndTimePayment[0]; // Get only date from date and time
            */


            var data = {
                index: resData.index,


                custrecord_rsm_crdl_sifra_pm: resData.custrecord_rsm_crdl_sifra_pm,          //SIFRA_PM,
                custrecord_rsm_crdl_naziv_pm: resData.custrecord_rsm_crdl_naziv_pm,          //NAZIV_PM,
                custrecord_rsm_crdl_datum_tran: resData.custrecord_rsm_crdl_datum_tran,        //DATUM_TRAN,
                custrecord_rsm_crdl_status: resData.custrecord_rsm_crdl_status,            //STATUS,
                custrecord_rsm_crdl_tip: resData.custrecord_rsm_crdl_tip,               //TIP,
                custrecord_rsm_crdl_vrsta: resData.custrecord_rsm_crdl_vrsta,             //VRSTA_KARTICE,
                custrecord_rsm_crdl_vreme_tran: resData.custrecord_rsm_crdl_vreme_tran,       //VREME,
                custrecord_rsm_crdl_broj_kartice: resData.custrecord_rsm_crdl_broj_kartice,     //BR_KARTICE,
                custrecord_rsm_crdl_pos_id: resData.custrecord_rsm_crdl_pos_id,           //POS_ID,
                custrecord_rsm_crdl_rata: resData.custrecord_rsm_crdl_rata,             //RATA,
                custrecord_rsm_crdl_broj_aut: resData.custrecord_rsm_crdl_broj_aut,         //BR_AUT,
                custrecord_rsm_crdl_bruto: resData.custrecord_rsm_crdl_bruto,            //BRUTO,
                custrecord_rsm_crdl_provizija: resData.custrecord_rsm_crdl_provizija,        //PROVIZIJA,
                custrecord_rsm_crdl_visina_mbn: resData.custrecord_rsm_crdl_visina_mbn,       //VISINA_MBN,
                custrecord_rsm_crdl_iznos_mbn: resData.custrecord_rsm_crdl_iznos_mbn,        //IZNOS_MBN,
                custrecord_rsm_crdl_visina_ksn: resData.custrecord_rsm_crdl_visina_ksn,       //VISINA_KSN,
                custrecord_rsm_crdl_iznos_ksn: resData.custrecord_rsm_crdl_iznos_ksn,        //IZNOS_KSN,
                custrecord_rsm_crdl_visina_otpk_m: resData.custrecord_rsm_crdl_visina_otpk_m,    //VISINA_OTPK_M,
                custrecord_rsm_crdl_iznos_otpk_m: resData.custrecord_rsm_crdl_iznos_otpk_m,     //IZNOS_OTPK_M,
                custrecord_rsm_crdl_iznos_za_uplatu: resData.custrecord_rsm_crdl_iznos_za_uplatu,  //IZNOS_ZA_UPLATU,
                custrecord_rsm_crdl_provizija_proc: resData.custrecord_rsm_crdl_provizija_proc,   //PROVIZIJA_PROC,
                custrecord_rsm_crdl_datum_valute: resData.custrecord_rsm_crdl_datum_valute,     //DATUM_VALUTE,
                custrecord_rsm_crdl_id_naloga: resData.custrecord_rsm_crdl_id_naloga


            }

            context.write({
                key: data.index,
                value: data
            });


        }

        function summarize(summary) {

            var scriptObj = runtime.getCurrentScript();
            var headerId = scriptObj.getParameter({"name": 'custscript_rsm_ccard_mr_param1'});

            var headerRecord = record.load({
                type: "customrecord_rsm_crdh",
                id: headerId,
                isDynamic: true
            });

            summary.output.iterator().each(function (key, value) {

                var transaction = JSON.parse(value);

                headerRecord.selectNewLine({
                    sublistId: 'recmachcustrecord_rsm_crdl_crdh'
                });

                headerRecord.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsm_crdl_crdh',
                    fieldId: 'custrecord_rsm_crdl_sifra_pm',
                    value: transaction.custrecord_rsm_crdl_sifra_pm
                });
                headerRecord.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsm_crdl_crdh',
                    fieldId: 'custrecord_rsm_crdl_naziv_pm',
                    value: transaction.custrecord_rsm_crdl_naziv_pm
                });

                headerRecord.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsm_crdl_crdh',
                    fieldId: 'custrecord_rsm_crdl_datum_tran',
                    value: format.parse({
                        value : util_ccard.fixDateString(transaction.custrecord_rsm_crdl_datum_tran),
                        type : format.Type.DATE,
                        timezone : format.Timezone.EUROPE_BUDAPEST
                    })
                });


                headerRecord.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsm_crdl_crdh',
                    fieldId: 'custrecord_rsm_crdl_status',
                    value: transaction.custrecord_rsm_crdl_status
                });
                headerRecord.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsm_crdl_crdh',
                    fieldId: 'custrecord_rsm_crdl_tip',
                    value: transaction.custrecord_rsm_crdl_tip
                });
                headerRecord.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsm_crdl_crdh',
                    fieldId: 'custrecord_rsm_crdl_vrsta',
                    value: transaction.custrecord_rsm_crdl_vrsta
                });
                headerRecord.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsm_crdl_crdh',
                    fieldId: 'custrecord_rsm_crdl_vreme_tran',
                    value: transaction.custrecord_rsm_crdl_vreme_tran
                });
                headerRecord.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsm_crdl_crdh',
                    fieldId: 'custrecord_rsm_crdl_broj_kartice',
                    value: transaction.custrecord_rsm_crdl_broj_kartice
                });
                headerRecord.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsm_crdl_crdh',
                    fieldId: 'custrecord_rsm_crdl_pos_id',
                    value: transaction.custrecord_rsm_crdl_pos_id
                });
                headerRecord.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsm_crdl_crdh',
                    fieldId: 'custrecord_rsm_crdl_rata',
                    value: transaction.custrecord_rsm_crdl_rata
                });
                headerRecord.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsm_crdl_crdh',
                    fieldId: 'custrecord_rsm_crdl_broj_aut',
                    value: transaction.custrecord_rsm_crdl_broj_aut
                });
                headerRecord.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsm_crdl_crdh',
                    fieldId: 'custrecord_rsm_crdl_bruto',
                    value: transaction.custrecord_rsm_crdl_bruto
                });
                headerRecord.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsm_crdl_crdh',
                    fieldId: 'custrecord_rsm_crdl_provizija',
                    value: transaction.custrecord_rsm_crdl_provizija
                });

                headerRecord.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsm_crdl_crdh',
                    fieldId: 'custrecord_rsm_crdl_visina_mbn',
                    value: transaction.custrecord_rsm_crdl_visina_mbn
                });
                headerRecord.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsm_crdl_crdh',
                    fieldId: 'custrecord_rsm_crdl_iznos_mbn',
                    value: transaction.custrecord_rsm_crdl_iznos_mbn
                });
                headerRecord.setCurrentSublistText({
                    sublistId: 'recmachcustrecord_rsm_crdl_crdh',
                    fieldId: 'custrecord_rsm_crdl_visina_ksn',
                    value: transaction.custrecord_rsm_crdl_visina_ksn
                });
                headerRecord.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsm_crdl_crdh',
                    fieldId: 'custrecord_rsm_crdl_iznos_ksn',
                    value: transaction.custrecord_rsm_crdl_iznos_ksn
                });
                headerRecord.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsm_crdl_crdh',
                    fieldId: 'custrecord_rsm_crdl_visina_otpk_m',
                    value: transaction.custrecord_rsm_crdl_visina_otpk_m
                });
                headerRecord.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsm_crdl_crdh',
                    fieldId: 'custrecord_rsm_crdl_iznos_otpk_m',
                    value: transaction.custrecord_rsm_crdl_iznos_otpk_m
                });
                headerRecord.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsm_crdl_crdh',
                    fieldId: 'custrecord_rsm_crdl_iznos_za_uplatu',
                    value: transaction.custrecord_rsm_crdl_iznos_za_uplatu
                });
                headerRecord.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsm_crdl_crdh',
                    fieldId: 'custrecord_rsm_crdl_provizija_proc',
                    value: transaction.custrecord_rsm_crdl_provizija_proc
                });

                headerRecord.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsm_crdl_crdh',
                    fieldId: 'custrecord_rsm_crdl_datum_valute',
                    value: format.parse({
                        value : util_ccard.fixDateString(transaction.custrecord_rsm_crdl_datum_valute),
                        type : format.Type.DATE,
                        timezone : format.Timezone.EUROPE_BUDAPEST
                    })
                });


                headerRecord.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_rsm_crdl_crdh',
                    fieldId: 'custrecord_rsm_crdl_id_naloga',
                    value: transaction.custrecord_rsm_crdl_id_naloga
                });

                headerRecord.commitLine({
                    sublistId: 'recmachcustrecord_rsm_crdl_crdh'
                });

                return true;

            });

            headerRecord.save();


            /*
                        log.audit({ title : 'inputSummary:Usage', details : summary.inputSummary.usage});
                        log.audit({ title :'inputSummary:Seconds', details : summary.inputSummary.seconds});
                        log.audit({ title :'inputSummary:Yields', details : summary.inputSummary.yields});
                        log.error({ title :'inputSummary:Error', details : summary.inputSummary.error});

                        log.audit({ title :'mapSummary:Usage', details : summary.mapSummary.usage});
                        log.audit({ title :'mapSummary:Seconds', details : summary.mapSummary.seconds});
                        log.audit({ title :'mapSummary:Yields', details : summary.mapSummary.yields});
                        log.error({ title :'mapSummary:Errors', details : summary.mapSummary.errors});

                        log.audit({ title :'reduceSummary:Usage', details : summary.reduceSummary.usage});
                        log.audit({ title :'reduceSummary:Seconds', details : summary.reduceSummary.seconds});
                        log.audit({ title :'reduceSummary:Yields', details : summary.reduceSummary.yields});
                        log.error({ title :'reduceSummary:Errors', details : summary.reduceSummary.errors});
            */
            log.audit({title: 'Usage', details: summary.usage});
            log.audit({title: 'Seconds', details: summary.seconds});
            log.audit({title: 'Yields', details: summary.yields});

        }

        return {
            getInputData: getInputData,
            map: map,
            summarize: summarize
        };

    });