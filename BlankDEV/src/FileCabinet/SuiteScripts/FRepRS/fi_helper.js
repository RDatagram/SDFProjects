define(['N/xml', 'N/search', 'N/format'],

function(xml,search,format) {

	/*
	 * SS_json : Array sa podacima iz Saved Search
	 * pl_lines : Array sa podacima iz PL Report subliste, sve operacije od ucitavanja do snimanja se rade na ovom objektu
	 */
	
	self = this;

	this.pl_lines = []; // lines koje pripadaju Pl reportu - ubacimo linije posle record.load
	this.ss_json = []; // rezultatni JSON od saved search za bilans po AOP kodovima
	
	function setPlLines(_Arr){
		self.pl_lines = _Arr;
	}
	
	function getPlLines(){
		return self.pl_lines;
	}
	
	function setSS_json(_Arr){
		self.ss_json = _Arr;
	}
	
	/*
	 * u glavnoj proceduri se otvara PLR record
	 * 
	 */

	function copySStoPL(rPLR){
		var counter = rPLR.getLineCount({
			sublistId : 'recmachcustrecord_snt_pl_report_parent'
		});

		self.pl_lines = [];
		for (var i = 0; i < counter; i++) {
			var vId = rPLR.getSublistValue({
				sublistId : 'recmachcustrecord_snt_pl_report_parent',
				fieldId : 'custrecord_snt_pl_lines_code',
				line : i
			});
			var vText = rPLR.getSublistText({
				sublistId : 'recmachcustrecord_snt_pl_report_parent',
				fieldId : 'custrecord_snt_pl_lines_code',
				line : i
			});			
			var lValue = getAopFromSS(vId);
			self.pl_lines.push({"line" : i, "aopText" : vText, "cy_calc" : lValue, "cy_xml" : 0});
		}

	}
	
	function copySublistToPL(rPLR){
		self.pl_lines = [];		
		var srch = search.load({'id':'customsearch_snt_pl_lines_sublist'});
		srch.filters.push(search.createFilter({
		    name: 'custrecord_snt_pl_report_parent',
		    operator: search.Operator.IS,
		    values : rPLR.id})
		);
		srch.run().each(function(data){
			var ad = data.getAllValues();
			var vId = data.getValue('custrecord_snt_pl_lines_code');
			var vText = data.getText('custrecord_snt_pl_lines_code');
			var vCalc = data.getValue('custrecord_snt_pl_lines_cy_calc');
			var vXml = data.getValue('custrecord_snt_pl_lines_cy_xml');
			var vPxml = data.getValue('custrecord_snt_pl_lines_py_xml');
			var vDesc = data.getValue('custrecord_snt_pl_lines_desc');
			var vGrp = ad['CUSTRECORD_SNT_PL_LINES_CODE.custrecord_snt_aop_pl_group'];
			self.pl_lines.push({"line" : i, "aopText" : vText, "cy_calc" : vCalc, "cy_xml" : vXml, "desc" : vDesc, "accgrp" : vGrp, "py_xml" : vPxml});			
			return true;
		})

	}

	function prepareJSONforPDF(rPLR){
		copySublistToPL(rPLR);
		
		var datOd = format.format({value: rPLR.getValue("custrecord_snt_pl_lines_date_from"), type:format.Type.DATE});
		var datDo = format.format({value: rPLR.getValue("custrecord_snt_pl_lines_date_to"), type:format.Type.DATE});
		
		var retVal = {};
		var retObj = {};
		var retArr = [];
		var hdrArr = [];
		
		hdrArr.push({"datOd" : datOd, "datDo" : datDo});
		
		for(var i = 0; i<self.pl_lines.length;i++){
			var nodejson = 'aop' + self.pl_lines[i]["aopText"]+'cy';
			retObj[nodejson] = self.pl_lines[i]["cy_xml"];
			var nodejson = 'aop' + self.pl_lines[i]["aopText"]+'py';
			retObj[nodejson] = self.pl_lines[i]["py_xml"];
			var nodejson = 'aop' + self.pl_lines[i]["aopText"]+'desc';
			retObj[nodejson] = self.pl_lines[i]["desc"];
			var nodejson = 'aop' + self.pl_lines[i]["aopText"]+'accgrp';
			retObj[nodejson] = self.pl_lines[i]["accgrp"];
			
		}
		retArr.push(retObj);
		retVal = {"podaci":retArr, "header" : hdrArr};
		
		return retVal;
	}
	/* pomocna funkcija koja kopira Calculated polja u XML (koja se salju u XML datoteku kasnije
	 * 
	 */
	function copyCalcToXML(){
		for(var i = 0; i<self.pl_lines.length;i++){
			self.pl_lines[i]["cy_xml"] = self.pl_lines[i]["cy_calc"];
		}
	}
	/*
	 * vraca vrednost iz Saved Search, koliki je promet na nekom AOP kodu
	 */
	function getAopFromSS(aop){
		var rValue = 0;
		for(var i = 0; i<self.ss_json.length;i++){
			var lArr = self.ss_json[i];
			if (aop == lArr['aopCodeValue']){
				var vDebit = 0.00;
				var vCredit = 0.00;
				if (lArr['aopDebit']){
					vDebit = parseFloat(lArr['aopDebit']);
				}
				if (lArr['aopCredit']){
					vCredit = parseFloat(lArr['aopCredit']);
				}
				
				if(vDebit > vCredit){
					rValue = vDebit - vCredit;					
				} else {
					rValue = vCredit - vDebit;
				}
				
				// svedi na hiljade
				rValue = Math.round(rValue/1000);
			}
			
		}
		return rValue;
	}
	
	/*
	 * Vraca vrednost AOP polja iz pl_lines
	 */
	function getAopFromJSON(aopt,fld){
		
		var rValue = 0;
		var js  = self.pl_lines;
		for(var i = 0; i<js.length;i++){
			var lArr = js[i];
			if (aopt == lArr['aopText']){
				
				rValue = lArr[fld];
			}
		}
		
		return rValue;		
	}
	
	function setAopFromJSON(aopt,fld,value){
		var rValue = 0;
		
		for(var i = 0; i<self.pl_lines.length;i++){
			var lArr = self.pl_lines[i];
			if (aopt == lArr['aopText']){
				
				self.pl_lines[i][fld] = value;
			}
		}
		return rValue;		
	}
	
	function generateXML(){
		var xmlstr = '<FiForma xmlns="http://schemas.datacontract.org/2004/07/Domain.Model" xmlns:i="http://www.w3.org/2001/XMLSchema-instance">';
		xmlstr = xmlstr + '<Naziv>Bilans uspeha</Naziv>';
		xmlstr = xmlstr + '<NumerickaPoljaForme xmlns:a="http://schemas.datacontract.org/2004/07/AppDef">';
		
		for(var i = 0; i<self.pl_lines.length;i++){
			var lArr = self.pl_lines[i];
			xmlstr = xmlstr + '<a:NumerickoPolje><a:Naziv>aop-'+lArr["aopText"]+'-5</a:Naziv><a:Vrednosti>'+lArr["cy_xml"]+'</a:Vrednosti></a:NumerickoPolje>';
		}
		xmlstr = xmlstr + '</NumerickaPoljaForme>';
		xmlstr = xmlstr + '<TekstualnaPoljaForme>';
		xmlstr = xmlstr + '</TekstualnaPoljaForme>';
		xmlstr = xmlstr + '</FiForma>';
		
		fo = file.create({
			name : 'BU.xml',
			folder : 400,
			contents : xmlstr,
			fileType : file.Type.XMLDOC
		});
		fo.save();		
		
		return fo;
		
	}
	
    return {
        getAop : getAopFromJSON,
        setAop : setAopFromJSON,
        setSS_json : setSS_json,
        copySStoPL : copySStoPL,
        setPlLines : setPlLines,
        getPlLines : getPlLines,
        copyCalcToXML : copyCalcToXML,
        copySublistToPL : copySublistToPL,
        prepareJSONforPDF : prepareJSONforPDF,        
        generateXML : generateXML 
    };
    
});
