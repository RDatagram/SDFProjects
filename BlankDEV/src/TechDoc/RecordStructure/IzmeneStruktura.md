### Promene u NetSuite

#### Vladimir 02.04.2021

| Labela | ID | Komentar |
|-----|-----|----|
| RSM : Knjizno zaduzenje document number | custbody_rsm_kz_document_number | Polje za upisivanje brojaca knjiznog zaduzenja |
| RSM : Nastalo od fakture | custbody_rsm_kz_linked_invoice  | Polje za upisivanje od kog invoice-a je nastalo knjizno zaduzenje |

#### Zoran 05.04.2021

| Labela | ID | Komentar |
|-----|-----|----|
| RSM : Billing schedules	| custrecord_rsm_sot_billing_sch | Polje se nalazi u SalesOrderTypes custom record |

#### Vladimir 06.04.2021

| Labela | ID | Komentar |
|----|----|----|
| Interni obracun document number | custbody_rsm_io_counter | Brojac za interni obracun. Applies to: Journal, Purchase |

#### Zoran 12.04.2021

Subsidiary Config

| Labela | ID | Komentar |
|----|----|----|
| Interni obracun | custrecord_rsm_config_io_pdf | ID template za Interni obracun |
| Knjizno zaduzenje | custrecord_rsm_config_kz_pdf | ID template za Knjizno zaduzenje |

#### Vladimir 13.04.2021.
### Podlezno izmenama!
| Labela | ID | Komentar |
|----|----|----|
| Tax Code | custcol_rsm_itr_tax_code | Poreski kod za item receipt |
| Tax Rate | custcol_rsm_itr_tax_rate | Poreska stopa za item receipt |
| Tax Amount | custcol_rsm_itr_tax_amount | Iznos PDV-a |
| Sale Rate | custcol_rsm_itr_sale_rate | Prodajna cena po jedinici bez PDV |
| Sale Amount | custcol_rsm_itr_sale_amount | Prodajna vrednost bez PDV |
| Gross Rate | custcol_rsm_itr_gross_rate | Vrednost po jedinici sa PDV |
| Sale Gross Rate | custcol_rsm_itr_sale_gr_amount | Prodajna vrednost robe sa PDV |
| Gross Profit | custcol_rsm_itr_gross_profit | Razlika u ceni(marza) |

#### Vladimir 20.04.2021.
| Labela | ID | Komentar |
|----|----|----|
| RSM: Parent Invoice Date | custbody_rsm_kz_linked_invoice_date | Datum fakture od kojeg je KZ nastalo |

#### Vladimir 22.04.2021.
#### Interni Obracun BUNDLE!
| Naziv skripte | ID | Folder |
|----|----|----|
| RSM Bill Credit Interni Obracun RL | customscript_rsm_bill_credit_io_rl | RSM Interni obracun/src_interni_obracun |
| RSM Bill Credit Interni Obracun UE | customscript_rsm_bill_credit_io_ue | RSM Interni obracun/src_interni_obracun |
| RSM Bill Interni Obracun RL | customscript_rsm_bill_io_rl | RSM Interni obracun/src_interni_obracun |
| RSM Bill Interni Obracun UE | customscript_rsm_bill_io_ue | RSM Interni obracun/src_interni_obracun |
| Ne postoji record | rsm_interni_obracun_cs.js | RSM Interni obracun/src_interni_obracun |
| RSM Journal Interni Obracun RL | customscript_rsm_journal_entry_io_rl | RSM Interni obracun/src_interni_obracun |
| RSM Journal Interni Obracun UE | customscript_rsm_journal_entry_io_ue | RSM Interni obracun/src_interni_obracun |
| Ne postoji record | dateUtil.js | RSM Interni obracun/src_interni_obracun |

#### Luka 26.04.2021.

| Labela | ID | Komentar |
|----|----|----|
| RSM: KEP Document | customrecord_rsm_kep_document | Knjiga Evidencije Prometa |
| RSM: KEP Document Line | customrecord_rsm_kep_document_line | Rekord transakcije u KEP knjizi |

#### Zoran 09.05.2021
| Labela | ID | Komentar |
|----|----|----|
| RSM : Nacin isporuke | customrecord_rsm_delivery_type  | Custom record nacini isporuke |
| RSM : Nacin placanja | customrecord_rsm_payment_type   | Custom record nacini placanja |
| Nacin isporuke       | custbody_rsm_sales_delvtype     | Transaction body field nacin isporuke |
| Nacin placanja       | custbody_rsm_sales_payment_type | Transaction body field Nacin placanja |

#### Zoran 10.05.2021 - Sprovesti u BUNDLE kada se zavrsi PDF template proces
| Labela | ID | Komentar |
|--------|----|----------|
| Broj dana za uplatu | custbody_rsm_broj_dana_uplata | Transaction body field |

#### Zoran 11.05.2021 - OTVORENO ZA IZMENE
| Labela | ID | Komentar | Bundle |
|--------|----|----------|
| RSM : Card Report Document | customrecord_rsm_crdh | Custom Record | x |
| CCARD document line| ### | Custom Record | x |
| Util parser - | nema script record | util_ccard.js | folder |
| RSM : CCARD document UE | UserEvent | rsm_ccard_ue.js | x |
| Client Script | nema script record | rsm_ccard_cs.js | folder |
| RSM : CCARD Restlet  | customscript_rsm_ccard_rl | rsm_ccard_rl.js | x |
| MR Parser   | ### | rsm_ccard_parser_mr.js | x |
| MR Lookup   | ### | rsm_ccard_lookup_mr.js | x |
| MR Payment  | ### | rsm_ccard_payments_mr.js | x |
| MR Rollback | ### | rsm_ccard_rollback_mr.js | x |


#### Zoran 19.05.2021 - OTVORENO ZA IZMENE
| Labela | ID | Komentar |
|--------|----|----------|
| RSM : Email schedule status   | customlist_rsm_email_schedule_status | Status slanja e-Mail |
| RSM : Invoice eMail-status    | custbody_rsm_invoice_email_status    | Status Invoice |
| RSM : SalesOrder eMail-status | custbody_rsm_salesorder_email_status | Status Sales Order |
| RSM : SOE eMail-status        | custbody_rsm_soe_email_status        | Status Sales Order Estimate |

#### Vladimir 19.05.2021
| Labela | ID | Komentar |
|--------|----|----------|
| RSM : Blagajna Checkbox | custbody_rsm_blagajna_checkbox | Checkbox koji ce se menjati preko UE skripe, da se zna da journal sluzi za blagajnu |

#### Zoran 20.05 - Milan dodao
| Labela | ID | Komentar |
|--------|----|----------|
| PO Reference No. | custbody_rsm_po_ref_no | U ovo polje se upisuje broj računa na Purchase Order formi |

#### Luka 21.05.2021
| Labela | ID | Komentar |
|--------|----|----------|
| RSM : CreditMemo eMail-status      | custbody_rsm_creditmemo_email_status | Status Credit Memo |
| RSM : CustomerDeposit eMail-status | custbody_rsm_cd_email_status         | Status Customer Deposit |

#### Luka 11.06.2021
| Labela | ID | Komentar |
|--------|----|----------|
| RSM : Blagajna Prethodno Stanje | custbody_rsm_blagajna_prethodno_stanje | Polje koje pamti trenutno konto stanje van linija Journala na kome je |

#### Vladimir 24.06.2021
| Labela | ID | Komentar |
|--------|----|----------|
| RSM : AOP CF code | customrecord_rsm_aop_cf_code | Custom record za aop kodove |
| RSM : CF Report | customrecord_rsm_cf_report | Custom record, header za CF izvestaj |
| RSM : CF Report Lines | customrecord_rsm_cf_report_lines | Custom record. linije za CF izvestaj |

#### Vladimir 01.07.2021
| Labela | ID | Komentar |
|--------|----|----------|
| AOP CF Credit | custrecord_rsm_aop_cf_credit_code | Other record field za unos AOP koda za CF credit stranu |
| AOP CF Debit | custrecord_rsm_aop_cf_debit_code | Other record field za unos AOP koda za CF debit stranu |

#### Roncevic 28.07.2021
| Labela | ID | Komentar |
|--------|----|----------|
| RSM : Sales Order duedate | custbody_rsm_so_duedate | Transaction body field - Datum valute za SalesOrder |

#### Luka 13.10.2021
| Naziv skripte | ID | Folder |
|----|----|----|
| RSM : KEP Document UE | customscript_rsm_kep_document_ue | KEP_KNJIGA/kep_knjiga_src |
| Ne postoji record | rsm_kep_document_cs.js | KEP_KNJIGA/kep_knjiga_src |
| RSM : KEP Document RL | customscript_rsm_kep_document_rl | KEP_KNJIGA/kep_knjiga_src |
| RSM : KEP Document MR | customscript_rsm_kep_document_mr | KEP_KNJIGA/kep_knjiga_src |

#### Luka 19.10.2021
| Labela | ID/Name | Folder/Komentar |
|----|----|----|
| Ne postoji record | ior_excel_template.xml | Tacka1 - Finansijski izvestaji / FinRepSrc / finansijski_templates |
| RSM : AOP initial IOR codes | customscript_rsm_initial_aop_ior_codes | Tacka1 - Finansijski izvestaji / FinRepSrc / Izveštaj o ostalom rezultatu |
| Ne postoji record | iorScheme.json | Tacka1 - Finansijski izvestaji / FinRepSrc / Izveštaj o ostalom rezultatu |
| RSM : Finansijski Ostali Rez IOR UE | customscript_finansijski_ostali_ior_ue | Tacka1 - Finansijski izvestaji / FinRepSrc / Izveštaj o ostalom rezultatu |
| Ne postoji record | cs_ior_report.js | Tacka1 - Finansijski izvestaji / FinRepSrc / Izveštaj o ostalom rezultatu |
| RSM : IOR Report | customrecord_rsm_ior_report | IOR Report Custom Rekord |
| RSM : IOR Report Lines | customrecord_rsm_ior_report_lines | IOR Report Line Custom Rekord |
| RSM : AOP IOR code | customrecord_rsm_aop_ior_code | AOP IOR Code Custom Record |
| CUSTTMPL_IOR_HTML_PDF_TEMPLATE | CUSTTMPL_IOR_HTML_PDF_TEMPLATE | PDF template za exportovanje IOR Report-a |