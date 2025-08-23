
#### Inicijalni dopis
Bex dostavlja specifikaciju za uplate, ali se na izvodu pojavljuje u celosti.

Posle se taj iznos rasknjizava na uplate po osnovu:

1.      Uplata pravnih lica za fakture za koje su izdate kao fakture pravna lica

2.      Uplata fizicikih lica za koja ne postoje pojedinacne fakture, ali postoje SO I fakture. E, sada, ovde je pitanje za Vesnu da li ce se sa jednog SO za svako posebno fizicko lice praviti faktura, ali ce se izdavati na jednog customera- fizicko lice. Vesna, molim te ovo da proverimo, pa da vidimo
 

    Koliko se secam oni za sve ove specifikacije izdaju racune, ali ih ne salju. Ako je fizicko lice, onda ce se izdati faktura na neki zbirnu sifru fizicka lica. Ako iz CRMa dodju podaci o ovim posljkama I ako za ove posljike za IPG ide model da se upise poziv na broj taj iz CRMA (koji je broj iz ove kolone napomena NapomenaInternaKlijent/za prvu posljku to je broj 994267.
    Za Zorana I za Katarinu pitanje: da li mogu da naprave skrpitu koja bi radila po principu onog RSM BANK STATEMENT PARSERA  gde bi umesto izvoda mogao da se ucita ovaj CSV fajl tako sto ce se preoznati fakture preko poziva na broj ili IPG broja na SO, mada mislim da je poziv na broj bolje. Znaci, da se uradi kao u parseru za normalne izvode da prepozna fakturu, da uradi apply, ali da je ne veze za konto bankarskog racuna na koji ce im BEX uplatiti, nego da to bude recimo prelazni konto 241901-IPG PO SPECIFIKACIJI.
    Kada stigne ova specifikacija, ucitamo ovaj CSV, on uradi povezivanje kao sto je uradjeno sa fakturama, imamo poziv na broj. STav za knjizenje bi bio 241901/204-fizicka lica, odnosno kupac koji treba (mogu I pravna lica da budu uplatioci).

Kada stigne izvod imamo dve opcije:

    Da u samom parseru RSM Bank statement kod IPG, sistem vidi da su u pitanju druge transakcije, sifra placanja 290, pa da se onda pored depozita, invoice, otvori konto prelazni konto po specifikaciji I da se und ana samom kontu 241901 nadje iznos uplate.
    Ili da im kazemo da kroz bank matching data naprave varijantu kroz JE, da proknjize rucno uplatu BEXA na 241014tekuci racun/241901-IPG PO specifikaciji,

U najidealnijik uslovima, ovaj konto 241901 je na nuli, ali cesto se ne desava. Ovako ce imati uvek inforamciju koliko im je Bex duguje.
