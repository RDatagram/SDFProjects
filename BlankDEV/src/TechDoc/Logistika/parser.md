## PARSER IZVEŠTAJA OD KURIRSKE SLUŽBE

---
### Working directory
[courier_src](/src/FileCabinet/SuiteScripts/RSM_COURIER/courier_src)

---
### Custom records

+ document header
- document lines 

---
#### Document header

NetSuite ID : **customrecord_rsm_csdh**

``` http request
https://tstdrv2274808.app.netsuite.com/app/common/custom/custrecord.nl?id=357
```

[XML definition](/src/Objects/customrecord_rsm_csdh.xml)

---

#### Document lines

NetSuite ID : customrecord_rsm_csdl

```http request
https://tstdrv2274808.app.netsuite.com/app/common/custom/custrecord.nl?id=358&e=T
```

[XML definition](/src/Objects/customrecord_rsm_csdl.xml)

---

#### Input file example
[Link to example](340000001100638463-1232020%20-%20Excel.csv)

```text

IdPosiljke , DatumPreuzimanja , DatumNaplateOtkupnine , UplatilacNaziv , UplatilacMesto , UplacenoOtkupa , PrimalacNaziv , MestoP , ZiroRacun , NapomenaInternaBex , NapomenaInternaKlijent , NapomenaZaPreuzimanje , RegionIz , RegionZa,
200979621 , 09.03.2020 00:00:00 , 11.03.2020 00:00:00 , Ljumovic Radoje , NIS-MEDIANA - BULEVAR NEMANJICA 10/53 , 11942 , INTERNET PRODAJA GUMA D.O.O. , LAPOVO (VAROSICA) , 340-11006384-63 ,  , 994267 , AC Baki doo , NI , KG,
...
```

---
###Draft algoritam

Kurirska služba dostvlja dokument (CSV) kojim informiše klijenta o dostvljenim pošiljkama. 
<br> Pored informacija o datumu kada je pošiljka dostavljena, unutar istog dokumenta se nalaze i informacije 
o iznosu koji je naplaćen prilikom isporuke.
<br> Kurirska služba vrši uplatu (zbirnu) na tekući račun klijenta. Ne uplaćuje posebno svaku pošiljku.

- user kreira zaglavlje dokumenta (Netsuite user interface) : **document header**
- forma vec poseduje funkciju upload CSV datoteke i samim tim imamo link do nje
- potrebno je kreirati **button** na forni koja preko client script startuje Map/Reduce skriptu za parsiranje.
Podaci se upisuju u **document lines**

### Naredni koraci

Klijent obezbeđuje u sklopu svakog Sales Order-a, spisak pošiljki koje su vezane sa njega. 
Ovi isti podaci (brojevi) se nalaze u parsiranom CSV. 
Pretpostavka je da će biti potrebno ukrštanje ovih podataka (SalesORder <> Izveštaj)
<br> Podatke iz ovog parsiranog izveštaja, sistem će morati da iskoristi za knjiženje uplata