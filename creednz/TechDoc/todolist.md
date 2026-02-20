### 14.October Munich
- [x] DONE: Adding another base url for the creednz application (links)

- [x] DONE: Vendor name in vendor evaluation table will be a link to navigate to vendor page on creednz

- [x] DONE: Change all "AtRisk" to "At Risk"

- [x] DONE: Change 1 to "At risk"

- [x] DONE: Change "NO RISK" to "No Risk" and "ON RISK" to "On Risk"

### 15.October Munich
- [x] Add Gap-> Moderate Risk
- [x] change from OPERATION to Payment Operation
- [x] Regex make BankAcoount -> Bank Account, PaymentOperation -> Payment Operation

### 26.December
- [x] WFA init Delta MR -> add to Bundle!
- [x] Creednz details button to init delta MR
- [ ] Clean DELTA - when to initiate? We need an option to remove "old" deltas
- [x] Workflow Creednz Delta FORM -> import into SDF -> ADD to Bundle

### 30. January

- [ ] Add ALL Fields from PaymentDTO in the transaction body
  - [x] Amount
  - [x] Date
  - [x] PayeeName
  - [x] PayerName
  - [x] Currency Code
  - !!!! Check out the request from 08.April, more fields

### 18. Feb

- [x] Email (NetSuite) -> purchaseEmail (Creednz)
- [x] Payee Email Address (NetSuite) -> paymentRemittanceEmail (Creednz)
- [x] Relationships > contacts > Email (Netsuite)  ->  accountingEmail (Creednz)
- [x] Relationships > contacts > Phone (Netsuite)  ->  phone (Creednz)
- [x] Relationships > contacts > Name (Netsuite)  ->  accountingContact (Creednz)

### 10. Mar
- [x] New fields in the vendor record
  - [x] Bank account request email
  - [x] Bank account request contact
  - [x] Add to bundle
- [x] Refactoring API for update-and-invite Evaluation

### 11.Mar
- [x] New fields in the Vendor Evaluation record
  - [x] Linked Vendor
  - [x] Vendor JSON
- [ ] Retrieve data for Vendor for each VendorEvaluation synced record - existing WorkFlow
- [x] WFA Eval To Vendor
  - [x] SDF
  - [x] Bundle

https://docs.google.com/spreadsheets/d/1yf7-MPF4NardU7aKZMmYGfR9tBLTzoR_VIgtbWQReDQ/edit?gid=0#gid=0

https://docs.google.com/document/d/1Cx0MU51QLZsPZu67r0_LbbPZuVMg5wSe/edit

```javascript
if (paymentMethod == “ACH” || paymentMethod == “Wire”)  {
	if (billingCountry == “United States”)  {
		if(Bank account number != null Bank account number != “” &&   routing number != null && routing number != “” ) {
            PaymentMethod(custentity_paymentmethod) = DAC 
		    PaymentFormat(custentity_paymentformat) = CTX
		    Receiving Bank Primary ID Type(custentity_recbankprimidtype) = ABA
		    Receiving Party Account  (custentity_recpartyaccount)= Bank account number
		    Receiving Bank Primary ID (custentity_recbankprimid) = routing number
        } else if (Bank account number != null Bank account number != “” &&  swift != null && swift != “” ) {
PaymentMethod(custentity_paymentmethod) = MTS 
		Receiving Bank Primary ID Type(custentity_recbankprimidtype) = SWT
		Receiving Party Account  (custentity_recpartyaccount)= Bank account number
		Receiving Bank Primary ID (custentity_recbankprimid) = swift
}

} else if (billingCountry != “United States”) {
        PaymentMethod(custentity_paymentmethod) = MTS 
		PaymentFormat(custentity_paymentformat) = Wire
        Branch, Bank, IRC ID, or SORT Code(custentity_vendorbranchbankircid) = usWireInternationalData - (creednz)
		Receiving Bank Primary ID Type(custentity_recbankprimidtype) = SWT
		Receiving Party Account  (custentity_recpartyaccount)= Bank account number or iban -
 one of them will be populated
		Receiving Bank Primary ID (custentity_recbankprimid) = swift number 
}

}

```


### 08.April
- [ ] New fields in the Payments (Transaction) body (required for PaymentDTO)
  - [x] Creednz Invoice Id
  - [x] Creednz swift
  - [x] Creednz iban
- [x] Adding fields into project and bundle
  - [x] SDF
  - [x] Bundle
- [ ] API changes
  - [ ] Load new fields into VendorDTO