NAME
```RSM Halcom Serbia Domestic```

PAYMENT FILE TYPE
```EFT```

COUNTRY
```Serbia```

REFERENCE FIELDS
```xml
<refFields type="RSM Halcom Serbia Domestic">
<refField id="custrecord_2663_acct_num" label="Account Number" helptext="Enter your company's bank account number." mandatory="true"/>
<refField id="custrecord_2663_bank_city" label="City" helptext="Enter your company's city." mandatory="true"/>
</refFields>
```

ENTITY REFERENCE FIELDS
```xml
<refFields type="RSM Halcom Serbia Domestic">
<refField id='custrecord_2663_entity_acct_no' label='Bank Account Number' mandatory='true'/>
<refField id="custrecord_2663_entity_city" label="City" mandatory="true"/>
<refField id="custrecord_2663_entity_address1" label="Address" mandatory="true"/>
</refFields>
```

FIELD VALIDATOR
```xml
<fieldValidatorList>
</fieldValidatorList>
```

MAXIMUM LINES
```5000```

BANK FILE TEMPLATE
```
<#function getValueDate>
<#assign valueDate = "">
<#list payments as payment>
	<#if valueDate == "">
		<#assign valueDate = payment.trandate?string("ddMMyy")>
	<#elseif valueDate != payment.trandate?string("ddMMyy")>
		<#assign valueDate = "">
		<#return valueDate>
	</#if>
</#list>
<#return valueDate>
</#function>

<#function getTotalAmount>
<#assign totalAmount = computeTotalAmount(payments)?string?replace(",", "")>
<#if totalAmount?string?contains(".")>
	<#assign lastTwoChars = amount[totalAmount?string?length-2..]>
	<#if lastTwoChars?contains(".")>
		<#assign totalAmount = totalAmount?string + "0">
	</#if>
	<#assign totalAmount = totalAmount?string?replace(".", "")>
<#else>
	<#assign totalAmount = totalAmount?string + "00">
</#if>
<#return totalAmount>
</#function>

<#function getPaymentAmount payment>
<#assign amount = getAmount(payment)?string?replace(",", "")>
<#if amount?string?contains(".")>
	<#assign lastTwoChars = amount[amount?string?length-2..]>
	<#if lastTwoChars?contains(".")>
		<#assign amount = amount?string + "0">
	</#if>
	<#assign amount = amount?string?replace(".", "")>
<#else>
	<#assign amount = amount?string + "00">
</#if>
<#return amount>
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

<#function getPaymentMemo payment>
<#assign paymentMemo = "">
	<#if payment.memo?has_content>
		<#assign paymentMemo = payment.memo>
	</#if>
<#return paymentMemo>
</#function>

<#function getBillTranId payment>
<#assign paidTransactions = transHash[payment.internalid]>
<#assign billTranId = "">
<#assign paidTransactionsCount = paidTransactions?size>
<#if (paidTransactionsCount >= 1)>
	<#list paidTransactions as transaction>
		<#if transaction.tranid?has_content>
			<#assign billTranId = transaction.tranid>
		</#if>
	</#list>
</#if>
<#return billTranId>
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

<#-- template building -->
#OUTPUT START#
${setLength(cbank.custpage_eft_custrecord_2663_acct_num?string?replace("-", "")?replace(" ", ""),18)}${setLength(cbank.custrecord_2663_legal_name,35)}${setLength(cbank.custpage_eft_custrecord_2663_bank_city,10)}${setLength(getValueDate(),6)}${setLength("",98)}${setLength("MULTI E-BANK",12)}${setLength(0,1)}
${setLength(cbank.custpage_eft_custrecord_2663_acct_num?string?replace("-", "")?replace(" ", ""),18)}${setLength(cbank.custrecord_2663_legal_name,35)}${setLength(cbank.custpage_eft_custrecord_2663_bank_city,10)}${setPadding(getTotalAmount(),"left","0",15)}${setPadding(payments?size,"left","0",5)}${setLength("",96)}${setLength(9,1)}
<#list payments as payment>
<#assign ebank = ebanks[payment_index]>
<#assign entity = entities[payment_index]>
<#assign entityName = buildEntityName(entity,false)>
<#assign creditReferenceModel = getCreditReferenceModel(payment)>
<#assign billTranId = getBillTranId(payment)>
<#assign paymentMemo = getPaymentMemo(payment)>
<#assign creditReference = getCreditReference(payment)>
<#assign paymentDetails = "Promet robe i usluga - finalna potrosnja">
<#assign formOfPayment = getFormOfPayment(payment)>
<#assign paymentCode = getPaymentCode(payment)>
<#assign formOfPaymentRef = "">
<#assign documentType = "0">
<#assign venBillAN = getVenBillAN(payment)>
${setLength(venBillAN?string?replace("-", "")?replace(" ", ""),18)}${setLength(entityName,35)}${setLength(ebank.custrecord_2663_entity_address1,35)}${setLength(ebank.custrecord_2663_entity_city,10)}${setLength(0,1)}${setLength("",2)}${setLength(paymentMemo,23)}${setLength(paymentDetails,36)}${setLength("00000",5)}${setLength("",1)}${setLength(formOfPayment,1)}${setLength(paymentCode,2)}${setLength(formOfPaymentRef,1)}${setLength("",1)}${setPadding(getPaymentAmount(payment),"left","0",13)}${setLength(creditReferenceModel,2)}${setLength(creditReference,23)}${setLength(payment.trandate?string("ddMMyy"),6)}${setLength(documentType,1)}${setLength(1,1)}
</#list>

#REMOVE EOL#
#OUTPUT END#
```

OUTPUT FILE EXTENSION
```txt```

OUTPUT FILE ENCODING
```windows-1252```
