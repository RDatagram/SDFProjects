/**
 * @NApiVersion 2.x
 * @NScriptType MassUpdateScript
 *  */

define(['N/record', 'N/file', 'N/log'], function (record, file, log) {

    function each(params) {

        var currentRecord = record.load({
            type: params.type,
            id: params.id
        });
        log.debug('Broj acc i aop code', (accNum + ' - ' + aopCode));
        var accountFit = false;
        var accNum = currentRecord.getValue('acctnumber');

        var tmpObj = {}
        var buScheme = {}
        var aopCode = '';

        var file1 = file.load({
            id: "./bu_scheme.json"
        });
        buScheme = JSON.parse(file1.getContents());

        for (var key in buScheme) {
            var currentAop = key.substring(1);
            if (buScheme[key].hasOwnProperty("accounts")) {
                var accList = buScheme[key]["accounts"];
                for (var i = 0; i < accList.length; i++) {
                    tmpObj[accList[i]] = currentAop;
                }
            }
        }
        var flag = false;

        for (var keyAcc in tmpObj) {
            if (accNum.match(new RegExp("^" + keyAcc))) {
                flag = true;
                aopCode = tmpObj[keyAcc];
                break;
            }
        }

        if (!accountFit && flag) {
            accountFit = true;
        }

        if (accountFit) {
            currentRecord.setText({
                "fieldId": 'custrecord_rsm_aop_bu_code',
                "text": aopCode
            });
            try {
                currentRecord.save();
                log.debug('Broj acc i aop code', (accNum + ' - ' + aopCode));
            } catch (e) {
                log.error('Error', e.message);
                log.error('accNum', accNum);
            }
        }
    }

    return {
        each: each
    }

});