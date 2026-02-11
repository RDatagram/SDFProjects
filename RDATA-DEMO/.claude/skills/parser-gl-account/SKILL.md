---
name: parser-gl-account
description: Feature for linking bank accounts to GL accounts
---

# GL Account Linking

Rules for linking bank accounts to GL accounts

## Architecture

### 1. Mapping table

Custom records where bank accounts are mapped to GL accounts
- SRB Bank account mapping => customrecord_srb_bank_acc_mapping
- bank account number => field NAME
- mapped GL account => custrecord_srb_bank_acc_map_to

### 2. Destination field

In the custormrecord_srb_statement need to update the destination field with the GL account number (internal ID)
- destination field => custrecord_srb_bank_gl_account
- source field => custrecord_srb_partija
- XML Source => <Zaglavlje Partija="1">, get the value of Partija attribute

## Rules

- during parsing, get the value of Partija and search for the bank account mapping
- make a sql query to locate where NAME = Partija
- get internal ID of GL account
- update custrecord_srb_bank_gl_account with the internal ID of GL account