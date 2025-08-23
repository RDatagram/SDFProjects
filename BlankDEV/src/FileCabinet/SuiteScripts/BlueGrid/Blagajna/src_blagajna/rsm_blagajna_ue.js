/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 *
 * Blagajna
 * Check a custom checkbox field if "Account" field in the record sublist begins with 243 or 246
 * Gets the current balance of the required Account and remembers it inside a custom field before the user inputed lines are added thorugh this Journal
 */
define(['N/record', 'N/query', 'N/log', 'N/ui/serverWidget', 'N/search', 'N/runtime'], function (record, query, log, serverWidget, search, runtime) {

    // For some reason the date format the UserEvent script gets with .getValue is returned as "2019-04-01T07:00:00.000Z" for example
    function fixDateFormat(date) {
        var day = new Date(date).getDate();
        var month = new Date(date).getMonth() + 1;
        var year = new Date(date).getFullYear();
        return day + "." + month + "." + year;
    }

    function afterSubmit(context) {
        if (context.type === context.UserEventType.CREATE || context.type === context.UserEventType.EDIT) {

            var currentRecord = record.load({
                type: "journalentry",
                id: context.newRecord.id,
                isDynamic: true
            });

            var startingDigits = ["243", "246"];

            var lineCount = currentRecord.getLineCount({
                sublistId: 'line'
            });
            for (var i = 0; i < lineCount; i++) {
                var currentSublistAccountText = currentRecord.getSublistText({
                    sublistId: 'line',
                    fieldId: 'account',
                    line: i
                });
                // Return only the first batch of numbers from a string ("243 2 test 84648" => "243")
                var accountNumber = currentSublistAccountText.replace(/(^\d+)(.+$)/i, '$1');

                if (startingDigits.indexOf(accountNumber.substring(0, 3)) != -1) {

                    currentRecord.setValue({
                        fieldId: "custbody_rsm_blagajna_checkbox",
                        value: true
                    });

                    var accountId = search.create({
                        type: "account",
                        columns: ["internalid"],
                        filters: ["number", "is", accountNumber]
                    }).run().getRange(0, 1)[0].getValue("internalid");

                    var debitAndCreditSums = search.create({
                        type: "transaction",
                        filters:
                            [
                                ["posting", "is", "T"],
                                "AND",
                                ["account", "is", accountId],
                                "AND",
                                ["trandate", "before", fixDateFormat(currentRecord.getValue("trandate"))]
                            ],
                        columns:
                            [
                                search.createColumn({
                                    name: "creditamount",
                                    summary: "SUM"
                                }),
                                search.createColumn({
                                    name: "debitamount",
                                    summary: "SUM"
                                })
                            ]
                    }).run().getRange(0, 1)[0].getAllValues();

                    var debitAmount = debitAndCreditSums['SUM(debitamount)'] ? parseFloat(debitAndCreditSums['SUM(debitamount)']) : 0;
                    var creditAmount = debitAndCreditSums['SUM(creditamount)'] ? parseFloat(debitAndCreditSums['SUM(creditamount)']) : 0;
                    currentRecord.setValue({
                        fieldId: "custbody_rsm_blagajna_prethodno_stanje",
                        value: debitAmount - creditAmount
                    });

                    currentRecord.save();
                    break;
                }
            }

        }
    }

    return {
        afterSubmit: afterSubmit
    };

});