NAME
```RSM Banca Intesa Serbia Domestic```

PAYMENT FILE TYPE
```EFT```

COUNTRY
```Serbia```

REFERENCE FIELDS
```
<refFields type="RSM Banca Intesa Serbia Domestic">
<refField id="custrecord_2663_acct_num" label="Account Number" helptext="Enter your company's bank account number." mandatory="true"/>
<refField id="custrecord_2663_bank_city" label="City" helptext="Enter your company's city." mandatory="true"/>
</refFields>
```

ENTITY REFERENCE FIELDS

```
<refFields type="RSM Banca Intesa Serbia Domestic">
<refField id='custrecord_2663_entity_acct_no' label='Bank Account Number' mandatory='true'/>
<refField id="custrecord_2663_entity_city" label="City" mandatory="true"/>
<refField id="custrecord_2663_entity_address1" label="Address" mandatory="true"/>
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
<#-- template building -->

<#assign lineTitle = '<?xml version="1.0" encoding="UTF-8"?>'>
<#assign linePaketStart1 = '<pmtorderrq count="'>
<#assign linePaketStart2 = '">'>
<#assign lineDataStart = '	<pmtorder>'>
<#assign lineDataEnd = '	</pmtorder>'>
<#assign linePaketEnd = '</pmtorderrq>'>

<#function getTotalCount>
<#assign totalCount = 0>
<#list payments as payment>
	<#assign totalCount = totalCount + 1>
</#list>
<#return totalCount>
</#function>

<#function getValueDate>
<#assign valueDate = "">
<#list payments as payment>
	<#if valueDate == "">
		<#assign valueDate = payment.trandate?string("yyyy-MM-dd")>
	<#elseif valueDate != payment.trandate?string("yyyy-MM-dd")>
		<#assign valueDate = "">
		<#return valueDate>
	</#if>
</#list>
<#return valueDate>
</#function>

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

<#function getTrnType>
<#assign trnType = "ibank payment pp3">
<#return trnType>
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
<#assign totalCount = getTotalCount()>
<#assign trnType = getTrnType()>
${setLength(lineTitle,255)}
${setLength(linePaketStart1,19)}${formatAmount(totalCount,"truncDec")?string?replace(" ", "")}${setLength(linePaketStart2,255)}
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
${setLength(lineDataStart,255)}
${'		<companyinfo>'}
${'			<name>'}${cbank.custrecord_2663_legal_name}${'</name>'}
${'			<city>'}${cbank.custpage_eft_custrecord_2663_bank_city}${'</city>'}
${'		</companyinfo>'}
${'		<accountinfo>'}
${'			<acctid>'}${cbank.custpage_eft_custrecord_2663_acct_num?string?replace(" ", "")}${'</acctid>'}
${'			<bankid>'}${setLength(cbank.custpage_eft_custrecord_2663_acct_num?string?replace("-", "")?replace(" ", ""), 3)}${'</bankid>'}
${'			<bankname>Banca Intesa</bankname>'}
${'		</accountinfo>'}
${'		<payeecompanyinfo>'}
${'			<name>'}${entityName}${'</name>'}
${'			<address>'}${ebank.custrecord_2663_entity_address1}${'</address>'}
${'			<postalcode/>'}
${'			<city>'}${ebank.custrecord_2663_entity_city}${'</city>'}
${'		</payeecompanyinfo>'}
${'		<payeeaccountinfo>'}
${'			<acctid>'}${venBillAN?string?replace(" ", "")}${'</acctid>'}
${'			<bankid>'}${setLength(venBillAN?string?replace("-", "")?replace(" ", ""), 3)}${'</bankid>'}
${'			<bankname/>'}
${'		</payeeaccountinfo>'}
${'		<trntype>'}${trnType?replace(" ", ".")}${'</trntype>'}
${'		<trnuid>'}${payment.tranid}${'</trnuid>'}
${'		<dtdue>'}${setLength(getValueDate(),10)}${'T00:00:00</dtdue>'}
${'		<trnamt>'}${formatAmount(getAmount(payment),"dec")}${'</trnamt>'}
${'		<trnplace>online</trnplace>'}
${'		<purpose>'}${paymentDetails}${'</purpose>'}
${'		<purposecode>'}${setLength(formOfPayment,1)}${setLength(paymentCode,2)}${'</purposecode>'}
${'		<curdef>RSD</curdef>'}
${'		<refmodel/>'}
${'		<refnumber/>'}
${'		<payeerefmodel>'}${creditReferenceModel}${'</payeerefmodel>'}
${'		<payeerefnumber>'}${creditReference}${'</payeerefnumber>'}
${'		<urgency>ACH</urgency>'}
${'		<priority>50</priority>'}
${setLength(lineDataEnd,255)}
</#list>
${setLength(linePaketEnd,255)}
#REMOVE EOL#
#OUTPUT END#
```
OUTPUT FILE EXTENSION
```xml```

OUTPUT FILE ENCODING
```UTF-8```