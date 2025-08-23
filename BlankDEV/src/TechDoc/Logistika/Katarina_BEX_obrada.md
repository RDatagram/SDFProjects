Predlog realizacije na osnovu ideja i sugestija svih članova tima:

PARSIRANJE I OBRADA IZVODA - DOPUNA PROCESA; PARSIRANJE I OBRADA IZVEŠTAJA KURIRSKE SLUŽBE

PRIPREMA (u svrhu test provere rada kroz NetSuite i obezbeđivanja tehnićkih preduslova za automatizaciju procesa)

- Custom Lista "RSM : Bank Statement Actions" (koja se referencira na stavkama parsiranog izvoda) dopunjena sa još jednom FIKSNOM vrednošću: CS_PAYMENT
- Otvoren bankarski konto 241009 ograničen na subsidiary IPG koji je vezan za IPG tekući račun Banca Intesa 160-0000000000000-97
- Otvorena dva PRELAZNA bankarska konta 241901 i 241902 ograničena na subsidiary IPG za, npr., BEX uplate i Post Express uplate ka IPG-u
- U custom record type "RSM : BankDataParsed" dodata dva nova fielda: 
	1. custrecord_rsm_bdp_cs_bank_account (za ručni unos prelaznog konta tipa Bank)
	2. custrecord_rsm_bdp_je_number (za upis ID-a formirane transakcije tipa Journal)
- U custom record type "RSM : Courier Service Document Line" dodati nova fieldovi (po analogiji sa linijama bankarskog izvoda): 
	1. custrecord_rsm_csdl_action (prepoznata/uneta akcija koja treba da se izvrši na liniji iz liste akcija)
	2. custrecord_rsm_csdl_transaction_recog (prepoznata određena transakcija - neki specifični SO ili Invoice)
	3. custrecord_rsm_csdl_transaction (ID kreirane specifične transakcije PAYMENT / CUSTOMER DEPOSIT)

PARSIRANJE I OBRADA IZVODA - DOPUNA PROCESA 

- Proces "Payments" postaje "Payments & JE" 
- Proces "Rollback Payments" postaje "Rollback Payments & JE"
- Nakon procesa "Parsiranje", a pre procesa "Payments & JE" klijent treba da pronađe importovane stavke zbirnih uplata od kurirskih službi 
i edituje ih u svrhu unosa akcije "CS_PAYMENT" i unosa prelaznog bankarskog konta za formiranje protivstavke JE 
(u našem primeru to je npr. konto 241901 IPG Bex uplate).
- "Payments & JE" za stavke izvoda čija je akcija "CS_PAYMENT" formira JE.
	Na zaglavlju tako formiranog JE upisuje se: 
	- datum sa stavke izvoda
	- posting period na osnovu tog datuma
	- currency sa izvoda
	- subsidiary sa izvoda
	- echange rate 1
 	Za svaku stavku izvoda sa akcijom CS_PAYMENT formira se par stavki u JE: 
	- prva u duguje iznosu stavke ide na bankarski konto sa zaglavlja izvoda, 
	- druga je potražna i ide na uneti bankarski konto stavke (npr. 241901 IPG BEX uplate).
- ID formiranog JE upisje se u stavke izvoda koje su ga inicirale. 
- Ideja je da se kreira jedan JE za sve stavke jednog izvoda koje imaju akciju
CS_PAYMENT, međutim, može se ići i na rešenje jedna stavka-jedan JE sa striktno dve stavke.
- Tokom "Rollback Payments & JE" bi trebalo u potpunosti poništiti (izbrisati) formirani JE sa pripadajućim stavkama (linijama).

PARSIRANJE I OBRADA DOKUMENTA KURIRSKE SLUŽBE

- Kod otvaranja zaglavlja dokumenta kurirske službe u polje Bank Account unosi se prelazni konto na koji su prethodnim JE preneta sredstva 
(241901 IPG BEX uplate), a ne konto odgovarajućeg tekućeg IPG-a.
- Import BEX specifikacije je Vladimir već uspešno realizovao.
- Ako analiziramo procese "Parsiranje", "Povezivanje" i "Payments & JE" kod obrade izvoda banke, 
videćemo da se već kod parsiranja vrši inicijalno prepoznavanja/povezivanje stavki sa SO i Invoice.
Povezivanje ponavlja taj isti postupak prepoznavanja nakon ručne izmene za proces bitnih podataka.
U slučaju BEX uplata, prepoznavanje se vrši na osnovu vrednost dva polja iz linije dokumenta kurirske službe:
	1. Parcel ID (custrecord_rsm_csdl_parcel_id) - broj paketa koji stigao iz CRM-a i treba ga pronaći
		u sublisti SO customrecord_rsm_courier_parcel u odgovarajućem polju custrecord_rsm_courier_parcel_id
		i na taj način detektovati odgovarajući SO custrecord_rsm_courier_parcel_tran
	2. Reference - client (custrecord_rsm_csdl_ref_client) - koji mora biti upisan u SO body polju custbody_rsm_crm_ordernum (broj narudžbenice)
	3. U pretraživanje / prepoznavanje se može uključiti i uslov da prepoznata transakcija datumski mora biti pre/do datuma 
	   dokumenta kurirske službe, kao i dodatni, naknadno uočeni uslovi.
Ako je prepoznati SO fakturisan, rezultat povezivanja treba da bude akcija PAYMENT (u custrecord_rsm_csdl_action) koja kao prepoznatu 
transakciju ima odgovarajući Invoice nastao iz tog SO; u suprotnom, akcija je DEPOSIT, a prepoznata transakcija 
specifičan SO (custrecord_rsm_csdl_transaction_recog).
- Opet po analogiji sa obradom izvoda, proces koji se pokreće na taster "Payments" treba na identičan način da kreira i primeni paymente ili deposite
u zavisnosti od prepoznatog vezivnog dokumenta i predložene akcije, i da u custrecord_rsm_csdl_transaction upiše ID kreiranog paymenta ili
deposita.     

NAPOMENA: moramo još da razmislimo da li će proces obrade specifikacije kurirske službe biti praćen procesom Match Bank Data za prelazni konto.
Ukoliko dođemo do tog zaključka, treba specificirati i koji bi se podatak upisivao u Memo polje Paymenta ili Deposita radi budućeg matchinga.
 	
