NAME
```RSM Raiffeisen Serbia Domestic```

PAYMENT FILE TYPE
```EFT```

COUNTRY
```Serbia```

REFERENCE FIELDS
- custrecord_2663_bank_mb se dodaje u custom record "Format Details". Deo je NetSuite bundle

```
<refFields type="RSM Raiffeisen Serbia Domestic">
<refField id="custrecord_2663_acct_num" label="Account Number" helptext="Enter your company's bank account number." mandatory="true"/>
<refField id="custrecord_2663_bank_city" label="City" helptext="Enter your company's city." mandatory="true"/>
<refField id="custrecord_2663_bank_mb" label="Matični broj" helptext="Enter your company's MATIČNI BROJ." mandatory="true"/>
</refFields>
```


ENTITY REFERENCE FIELDS
```
<refFields type="RSM Raiffeisen Serbia Domestic">
<refField id='custrecord_2663_entity_acct_no' label='Bank Account Number' mandatory='true'/>
<refField id="custrecord_2663_entity_city" label="City" mandatory="true"/>
</refFields>
```

FIELD VALIDATOR
```
<fieldValidatorList>
</fieldValidatorList>
```

MAXIMUM LINES
```5000```

BANK FILE TEMPLATE
```
<#-- ODREDI JEDAN DATUM ZA SVE NALOGE I TAJ DATUM KORISTI I KAO DATUM DO -->

<#function getValueDate>
<#assign valueDate = "">
<#list payments as payment>
	<#if valueDate == "">
		<#assign valueDate = payment.trandate?string("dd.MM.yyyy")>
	<#elseif valueDate != payment.trandate?string("dd.MM.yyyy")>
		<#assign valueDate = "">
		<#return valueDate>
	</#if>
</#list>
<#return valueDate>
</#function>

<#-- template building -->

<#assign lineTitle = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'>
<#assign lineClientStart = '<Client xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">'>
<#assign linePaketStart = '	<PaketZaSlanje>'>
<#assign lineNalogStart1 = '		<Nalog ImeFajla="Nalog_'>
<#assign lineNalogStart2 = '.XML">'>
<#assign lineDataStart = '			<Data>'>
<#assign lineDataEnd = '			</Data>'>
<#assign lineNalogEnd = '		</Nalog>'>
<#assign linePaketEnd = '	</PaketZaSlanje>'>
<#assign lineClientEnd = '</Client>'>

<#function getCreditReference payment>
<#assign paidTransactions = transHash[payment.internalid]>
<#assign reference = "">
<#assign paidTransactionsCount = paidTransactions?size>
<#if (paidTransactionsCount >= 1)>
	<#list paidTransactions as transaction>
		<#if transaction.custbody_poziv_na_broj?has_content>
			<#assign reference = transaction.custbody_poziv_na_broj>
		</#if>
	</#list>
</#if>
<#return reference>
</#function>

<#function getCreditReferenceModel payment>
<#assign paidTransactions = transHash[payment.internalid]>
<#assign referenceModel = "">
<#assign paidTransactionsCount = paidTransactions?size>
<#if (paidTransactionsCount >= 1)>
	<#list paidTransactions as transaction>
		<#if transaction.custbody_broj_modela?has_content>
			<#assign referenceModel = transaction.custbody_broj_modela>
		</#if>
	</#list>
</#if>
<#return referenceModel>
</#function>

<#function getFormOfPayment payment>
<#assign paidTransactions = transHash[payment.internalid]>
<#assign formOfPayment = "">
<#assign paidTransactionsCount = paidTransactions?size>
<#if (paidTransactionsCount >= 1)>
	<#list paidTransactions as transaction>
		<#if transaction.custbody_sifra_placanja?has_content>
			<#assign formOfPayment = setLength(transaction.custbody_sifra_placanja,1)>
		</#if>
	</#list>
</#if>
<#return formOfPayment>
</#function>

<#function getPaymentCode payment>
<#assign paidTransactions = transHash[payment.internalid]>
<#assign paymentCode = "">
<#assign paidTransactionsCount = paidTransactions?size>
<#if (paidTransactionsCount >= 1)>
	<#list paidTransactions as transaction>
		<#if transaction.custbody_sifra_placanja?has_content>
			<#assign paymentCode = setPadding(transaction.custbody_sifra_placanja, "left", "0", 2)>
		</#if>
	</#list>
</#if>
<#return paymentCode>
</#function>

<#function getVenBillAN payment>
<#assign ebank = ebanks[payment_index]>
<#assign paidTransactions = transHash[payment.internalid]>
<#assign venBillAN = "">
<#assign paidTransactionsCount = paidTransactions?size>
<#if (paidTransactionsCount >= 1)>
	<#list paidTransactions as transaction>
		<#if transaction.custbody_rsm_ven_bank_account_number?has_content>
			<#assign venBillAN = setLength(transaction.custbody_rsm_ven_bank_account_number,20)>
		</#if>
	</#list>
</#if>
<#if (venBillAN == "")>
	<#assign venBillAN = setLength(ebank.custrecord_2663_entity_acct_no,20)>
</#if>
<#return venBillAN>
</#function>

#OUTPUT START#
<#assign redniBroj = 0>
${setLength(lineTitle,255)}
${setLength(lineClientStart,255)}
${setLength(linePaketStart,255)}
<#list payments as payment>
<#assign redniBroj = redniBroj + 1>
<#assign ebank = ebanks[payment_index]>
<#assign entity = entities[payment_index]>
<#assign entityName = buildEntityName(entity,false)>
<#assign creditReferenceModel = getCreditReferenceModel(payment)>
<#assign creditReference = getCreditReference(payment)>
<#assign paymentDetails = "Promet robe i usluga - finalna potrošnja">
<#assign formOfPayment = getFormOfPayment(payment)>
<#assign paymentCode = getPaymentCode(payment)>
<#assign venBillAN = getVenBillAN(payment)>
${setLength(lineNalogStart1,25)}${formatAmount(redniBroj,"truncDec")}${setLength(lineNalogStart2,255)}
${setLength(lineDataStart,255)}
${'				<SifraProizvodaCORE>501</SifraProizvodaCORE>'}
${'				<TransakcijaID/>'}
${'				<PlacanjeID/>'}
${'				<DatumPrijema/>'}
${'				<RedniBrojNaloga>1</RedniBrojNaloga>'}
${'				<MaticniBrojNalogodavca>'}${cbank.custpage_eft_custrecord_2663_bank_mb}${'</MaticniBrojNalogodavca>'}
${'				<VasBrojNaloga/>'}
${'				<SifraPlacanja>'}${setLength(formOfPayment,1)}${setLength(paymentCode,2)}${'</SifraPlacanja>'}
${'				<SvrhaDoznake>'}${paymentDetails}${'</SvrhaDoznake>'}
${'				<SifraValute>941</SifraValute>'}
${'				<Iznos>'}${formatAmount(getAmount(payment),"dec")}${'</Iznos>'}
${'				<DatumValute>'}${setLength(getValueDate(),10)}${'</DatumValute>'}
${'				<DatumValuteDo>'}${setLength(getValueDate(),10)}${'</DatumValuteDo>'}
${'				<RacunNalogodavca>'}${setLength(cbank.custpage_eft_custrecord_2663_acct_num?string?replace("-", "")?replace(" ", ""),18)}${'</RacunNalogodavca>'}
${'				<RacunKorisnika>'}${setLength(venBillAN?string?replace("-", "")?replace(" ", ""),18)}${'</RacunKorisnika>'}
${'				<ModelNalogodavca/>'}
${'				<PozivNaBrojNalogodavca/>'}
${'				<ModelKorisnika>'}${creditReferenceModel}${'</ModelKorisnika>'}
${'				<PozivNaBrojKorisnika>'}${creditReference}${'</PozivNaBrojKorisnika>'}
${'				<NazivNalogodavca>'}${cbank.custrecord_2663_legal_name}${'</NazivNalogodavca>'}
${'				<MestoNalogodavca>'}${cbank.custpage_eft_custrecord_2663_bank_city}${'</MestoNalogodavca>'}
${'				<NazivKorisnika>'}${entityName}${'</NazivKorisnika>'}
${'				<MestoKorisnika>'}${ebank.custrecord_2663_entity_city}${'</MestoKorisnika>'}
${'				<BrojGrupnogNaloga/>'}
${'				<BrojZbirnogNaloga/>'}
${'				<Status/>'}
${'				<Prioritet>100</Prioritet>'}
${setLength(lineDataEnd,255)}
${setLength(lineNalogEnd,255)}
</#list>
${setLength(linePaketEnd,255)}
${setLength(lineClientEnd,255)}
#REMOVE EOL#
#OUTPUT END#
```
OUTPUT FILE EXTENSION
```xml```

OUTPUT FILE ENCODING
```UTF-8```