# EFT Payments

- Halcom file template
- Intesa file template
- Raiffeisen template

· Preduslov za korišćenje prilagođenih formata za plaćanje je instalacija Advanced Electronic Bank Payments bundle.

· U File cabinetu otvoriti folder (ili foldere) za smeštanje formiranih datoteka za plaćanje (Name: EFT File Repository).
	Razmisliti: otvoriti više foldera - za svaki subsidiary/pravni entitet posebno!
	Folderi imaju mogućnost ograničavanja/restrikcija vidljivosti po različitim kriterijumima.

· Podesiti Electronic Payments Preferences. Za inicijalnu primenu značajna samo provera da li su podešeni/izabrani email template-i za vendore i customere. 

· Definisati Payment File Templates – formate file-ova za željene banke koje klijent koristi.

· Definisati banke kojima će se slati file-ovi za plaćanje (Payments -> Setup -> (Company) Bank Details).
  Svaki Company Bank Detail se odnosi na jedan tekući račun jedne banke sa specificiranim Payment File Template-om i direktorijumom u File Cabinetu za smeštanje file-a za plaćanje.

· Instalacijom Electronic Bank Payments bundle na listama Customer, Vendor, Employee se otvara mogućnost unosa (više) stavki podliste podataka vezanih za Electronic Bank Payments 
	sa određivanjem TR i formata file-a za uplatu – ove podatke treba uneti za svakog vendora.
	Takođe, kod SVAKOG VENDORA treba uključiti checkbox da je za njega dozvoljen EFT Bill Payment!

· Model poziva na broj odobrenja i poziv na broj odobrenja su nova custom polja na dokumentu koji se plaća (Vendor Bill) 
	koja služe isključivo toj svrsi. 
	Isto važi i za šifru plaćanja. (Svaka promena logike popunjavanja naloga za prenos sredstava izaziva izmenu formiranih Payment File Template-a.)
	
	Custom forma za unos Vendor Bill treba da sadrži i dva custom fielda:
	1. custbody_rsm_ven_bank_payment_detail 
		Bank Payment Detail
		List/Record from Bank Details
		store value
		Purchase transactions
		Display type: Normal
	2. custbody_rsm_ven_bank_account_number 
		Bank Account Number
		Free-Form Text
		store value
		Purchase transactions
		Display type: Inline Text
		Sourcing and Filtering: Bank Payment Detail / Bank Account Number
	
	U ovu svrhu oformljena grupa polja "Payment Options" na customizovanoj formi
		
· Dodati custom polje za Maticni broj firme custrecord_2663_bank_mb u customrecord_2663_format_details pod Company Bank Detail
