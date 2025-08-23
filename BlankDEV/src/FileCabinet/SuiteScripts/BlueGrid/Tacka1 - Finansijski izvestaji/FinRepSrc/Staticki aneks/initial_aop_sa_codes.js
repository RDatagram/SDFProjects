/** 
 * @NApiVersion 2.0
 * @NScriptType Suitelet
*/
define(['N/log', 'N/ui/serverWidget', 'N/record', 'N/search'], function (log, ui, record, search) {

    function onRequest(context) {
        if (context.request.method === 'GET') {
            var form = showForm();
            context.response.writePage(form);

        } else {

            var fileToParse = context.request.files.csvfile;

            var iterator = fileToParse.lines.iterator();
            iterator.each(function (line) {
                var parsedLine = splitCSVButIgnoreCommasInDoublequotes(line.value);

                //When parsing values that have commas inside them,
                //Parser leaves values like '"string"', replacement of double quotes with empty string is needed
                var accountNumber = parsedLine[0].replace(/"/g, '');
                var description = parsedLine[1].replace(/"/g, '');
                var aopCode = parsedLine[2].replace(/"/g, '');

                var newRecord = record.create({
                    type: 'customrecord_rsm_aop_sa_code',
                    isDynamic: true
                });
                newRecord.setValue({
                    fieldId: 'name',
                    value: aopCode
                });
                newRecord.setValue({
                    fieldId: 'custrecord_rsm_aop_sa_code_description',
                    value: description
                });
                newRecord.setValue({
                    fieldId: 'custrecord_rsm_aop_sa_code_group',
                    value: accountNumber
                });
                var recordId = newRecord.save();
                return true;
            });
        }

    }

    function splitCSVButIgnoreCommasInDoublequotes(str) {
        //split the str first  
        //then merge the elments between two double quotes  
        var delimiter = ',';
        var quotes = '"';
        var elements = str.split(delimiter);
        var newElements = [];
        for (var i = 0; i < elements.length; ++i) {
            if (elements[i].indexOf(quotes) >= 0) {//the left double quotes is found  
                var indexOfRightQuotes = -1;
                var tmp = elements[i];
                //find the right double quotes  
                for (var j = i + 1; j < elements.length; ++j) {
                    if (elements[j].indexOf(quotes) >= 0) {
                        indexOfRightQuotes = j;
                        break;
                    }
                }
                //found the right double quotes  
                //merge all the elements between double quotes  
                if (-1 != indexOfRightQuotes) {
                    for (var j = i + 1; j <= indexOfRightQuotes; ++j) {
                        tmp = tmp + delimiter + elements[j];
                    }
                    newElements.push(tmp);
                    i = indexOfRightQuotes;
                }
                else { //right double quotes is not found  
                    newElements.push(elements[i]);
                }
            }
            else {//no left double quotes is found  
                newElements.push(elements[i]);
            }
        }

        return newElements;
    }

    function showForm() {
        var form = ui.createForm({
            title: 'Inicijalizacija aop kodova za izveštaj o ostalom rezultatu'
        });

        var csvFile = form.addField({
            id: 'csvfile',
            label: 'File',
            type: ui.FieldType.FILE
        });
        csvFile.isMandatory = true;
        csvFile.layoutType = ui.FieldLayoutType.NORMAL;
        csvFile.updateBreakType = ui.FieldBreakType.STARTCOL;

        form.addSubmitButton({
            label: 'Inicijalizuj aop kodove'
        });

        return form;
    }

    return {
        onRequest: onRequest
    }
})