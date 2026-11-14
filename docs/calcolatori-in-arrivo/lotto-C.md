# Lotto C — fatture e parcelle

Stato: backend mergiato (PR #154, merge `8b32142`), **non deployato su Render e nessuna chiamata alla produzione** (a carico della sessione di coordinamento). Frontend in questa PR. Nessuna build iOS lanciata.

Valori attesi = quelli letti dal sito di riferimento in questa sessione (Chromium headless, form reali compilati e inviati; per gli acconti la finestra "Acconti ricevuti" via UI). Confronto contro `server.py` di `main` dopo il merge (coroutine chiamate con `u=None`), voce per voce; rotte presenti in `app.routes`, definite prima di `include_router`.

| Calcolatore | Esito | Casi confrontati |
|---|---|---|
| Fattura Avvocati | allineato **tranne acconti: scarto di 0,01 € sull'onorario coperto in 8 casi su 94** (vedi sotto); senza acconti 0 differenze | 149 (55 senza acconti, 94 con acconti) |
| Fattura Professionisti | "Calcola" allineato (0 differenze); **"Scorpora & Calcola": scarto di 0,01 € sul compenso in 11 casi su 158** | 36 calcola + 158 scorpora |
| Calcolo Fattura Enasarco | allineato | 56 + ~25 prove sui limiti |
| Ricevuta Prestazione Occasionale | parte numerica allineata (documento NON replicato) | 61 |
| Tariffe Mediazione | allineato (D.M. 180/2010, il sito è ancora quello vecchio) | 67 |
| Calcolo Preventivo | allineato | 36 + prove sui limiti |
| Calcolo Rimborso Chilometrico ACI | **non implementato**: dipende dal database ACI dei veicoli (ricerca con autocompletamento su marca/modello, migliaia di righe, tariffa €/km per veicolo e anno), non da una formula | — |
| Calcolatrice Online | **non implementato**: è una calcolatrice a tasti con memoria, scorporo IVA, sconti ecc. in finestra popup, non un form con risultato | — |

Le due voci non implementate restano "in arrivo" nel menù.

## Regole ricavate dal sito
- **Fattura Avvocati**: spese generali 0–20% (oltre: il sito rifiuta) sugli onorari; cassa 4% su onorari+spese generali+spese imponibili(+bollo); IVA 22% sull'imponibile; ritenuta 20% sulla stessa base (cassa esclusa) solo in regime ordinario e nei minimi (3), mai nei regimi 1-2. Bollo 2 € solo nei regimi 1-3, con spunta e se onorari+accessori+spese esenti superano 77,47 €; la dicitura "bollo assolto" compare sopra soglia anche senza spunta. Split payment: netto = totale − IVA − ritenuta. IVA per cassa solo dicitura. Iva per cassa, split e regime sono alternativi (nell'app le altre voci si nascondono). Acconti (max 16): comprensivi di spese generali 15% fisse, cassa, IVA, al netto della ritenuta; gli accessori sono scorporati e il saldo si calcola su onorari−X; spese comprese negli acconti non possono superare quelle della fattura, né gli acconti la fattura.
- **Fattura Professionisti**: contributo previdenziale (0–100%) sul compenso+spese forfettarie+spese imponibili(+bollo); spese forfettarie % sul solo importo; IVA % (≤0 o vuota = 22; nessun massimo); ritenuta (≤0 o vuota = 20) sul compenso+forfettarie+imponibili, **più il contributo se la descrizione contiene "inps"** (qualsiasi maiuscola); descrizioni con la prima lettera maiuscola (default "Contributo previdenziale", "Spese ed altri oneri"). Scorporo: l'importo omnicomprensivo è il netto da incassare (se c'è ritenuta o split) altrimenti il totale documento; si ricostruisce a ritroso per passi arrotondati (IVA/ritenuta → contributo → spese → compenso), bollo dedotto.
- **Enasarco**: Enasarco % (8,5 default) sull'imponibile (bollo incluso); ritenuta = R(imponibile × quota) × % con quota 50% / 20% / 78% per inquadramento (arrotondamento intermedio al centesimo); netto = totale documento + spese esenti − Enasarco − ritenuta; Totale documento escluse le spese esenti. IVA % ≤0 o vuota = nessuna IVA. Enasarco e ritenuta % = 0 → errore (vuoto = default 8,5 / 23); provvigione da vendite: vendite e % > 0.
- **Ricevuta occasionale**: imponibile = compensi + spese forfettarie (importo prevale sulla %); bollo 2 € se imponibile > 77,47; ritenuta d'acconto sull'imponibile (0 < % < 100); ritenuta INPS = 1/3 del contributo; imponibile INPS = quota di (altri compensi + imponibile) oltre 5.000 € (al massimo l'imponibile) e fino al massimale (119.650 € per 2024-25, 122.295 per 2026-27); anno = anno della data, **meno uno fino al 12 gennaio** (cassa allargato); date accettate 2025–2027; aliquota vuota/0 = 35,03 (gestione separata) o 24 (altre forme). Compensi: descrizione facoltativa ("Compenso n° N"), importo > 0, max 20; spese: descrizione obbligatoria, max 50.
- **Tariffe Mediazione**: scaglioni (≤): 1.000 (0–65), 5.000 (65–130), 10.000 (130–240), 25.000 (240–360), 50.000 (360–600), 250.000 (600–1.000), 500.000 (1.000–2.000), 2,5 M (2.000–3.800), 5 M (3.800–5.200); valore da 41 a 5.000.000. Spese avvio 40; riduzione materia obbligatoria 1/3 fino a 250.000, 1/2 oltre; aumenti sull'indennità base (non sulla ridotta): complessità 1–20%, proposta 20%, esito positivo 1–25%; assenza controparte: indennità 0–40 (≤1.000), 40–50 (≤5.000), 50 (oltre) e niente proposta/esito. L'IVA si applica alle spese di avvio solo con la spunta "imponibili". **Quirk del sito riprodotto**: un valore con centesimi (es. 10.000,50) cade fra gli scaglioni (…1.000 / 1.001…) e dà indennità zero; l'endpoint lo segnala con un avviso.
- **Calcolo Preventivo**: quantità e prezzo arrotondati al centesimo (0,335 → 0,34; 1,005 → 1,01), importo riga = q × p; righe vuote ignorate, incomplete → errore; IVA solo intera da 1 a 22; ritenuta fissa 20% sull'imponibile; date del giorno.

## Verifica in produzione e correzione dello scorporo (sessione di coordinamento)
- Backend deployato su Render (`8b32142`, poi `9cddade`). I 18 esempi di questo resoconto con body JSON sono stati rieseguiti sull'API in produzione: 16 coincidenti, i 2 diversi erano i casi dichiarati sotto.
- **Fattura Professionisti, scorporo: regola del sito ricostruita** (backend PR #155). Il sito non sceglie il valore più vicino: parte dal compenso uguale all'importo omnicomprensivo, calcola la fattura e riscala il compenso di `importo / risultato`, per tre volte. Su 160 scorpori letti dal sito (65 sola IVA, 38 con ritenuta, 57 con contributo, spese forfettarie, spese, split, regimi) si passa da 135 a 158 coincidenti: 107 su 107 senza importi fissi, 51 su 53 con spese esenti/imponibili o bollo (lì la proporzione non descrive il sito e resta la ricerca nell'intorno; scarto di 1 centesimo nei 2 casi residui). L'elenco dei casi "sito / nostro" qui sotto per lo scorporo è quindi superato per i casi senza spese e senza bollo.
- **Fattura Avvocati, acconti: regola non ricostruita.** Su 30 acconti letti dal sito il codice attuale coincide in 27 (14 su 15 senza spese, 13 su 15 con spese); la proporzione in tre passi spiega gli scarti senza spese ma ne introduce altri, e con spese non descrive il sito. Lasciato com'è: scarto di 1 centesimo sull'onorario coperto in circa un caso su dieci.

## Differenze residue (non allineate)
Il sito, quando non esiste un valore al centesimo che dia esattamente il risultato, sceglie a volte il centesimo sopra e a volte quello sotto senza una regola che io sia riuscito a ricostruire (la decisione non dipende nemmeno dalla sola parte frazionaria: 941,2950… → 941,30 ma 1357,2950… → 1357,29). Il nostro codice sceglie il valore più vicino al risultato richiesto, a parità il più vicino alla soluzione analitica (≈93% di coincidenza).
- **Fattura Professionisti, scorporo** (importo omnicomprensivo | compenso sito / nostro | totale documento sito / nostro): 1.234,56 | 1.011,94 / 1.011,93 | 1.234,57 / 1.234,55 · 1.655,90 | 1.357,29 / 1.357,30 | 1.655,89 / 1.655,91 · 790,03 | 647,56 / 647,57 · 682,45 | 559,38 / 559,39 · 2.174,57 con spese forfettarie 3,5% | 1.722,16 / 1.722,15 · 716,11 forf. 5% | 559,02 / 559,03 · 188,86 con ritenuta 20% | 185,15 / 185,16 · 700,90 con ritenuta 20% | 687,15 / 687,16 · 2.324,71 con ritenuta 20% | 2.279,12 / 2.279,13 · 5.067,38 forf. 15%, spese imp. 158,10, ritenuta 23% | 4.313,44 / 4.313,45 · 117,64 (IVA 5%, ritenuta 4%, forf. 15%, spese) | 61,05 / 61,04. Scarto sul totale: 0,01–0,03 €.
- **Fattura Avvocati, acconti** (onorario coperto dall'acconto, sito / nostro): 2.000 € con acconti 500+300 (esenti 20, imponibili 10) 625,91 / 625,90 · acconto 400 su 1.500 con split payment 325,43 / 325,44 · acconto 400 senza spese generali 325,43 / 325,44 · acconto 334,08 → 271,81 / 271,80 · 887,15 → 721,77 / 721,78 · 2.182,57 → 1.775,71 / 1.775,72 · 1.487,98 senza ritenuta → 1.019,77 / 1.019,78 · 1.121,81 con IVA per cassa → 912,70 / 912,69. Scarto sul totale documento: 0,01–0,02 €.

## Altri limiti e scelte
- Non replicati: dati anagrafici, intestazione/dati documento, stampa/PDF/Word, fattura elettronica, dati della Ricevuta (anagrafica prestatore/committente con codice fiscale/P.IVA, oggetto, luogo, firma, testo delle dichiarazioni).
- Nel sito "Scorpora & Calcola" è un secondo pulsante: nell'app è la tendina "Operazione".
- Il sito rifiuta (nessun risultato) importi negativi, percentuali fuori range e righe incomplete: gli endpoint rispondono 400 con lo stesso criterio, verificato caso per caso.
- Nota: nel sito la dicitura sulla ritenuta dei regimi 1-2 compare solo se "Ritenuta d'acconto" è spuntata; riprodotto.

## Esempi (campi del form del sito → body per il nostro endpoint → output letto dal sito)
Gli importi del sito sono quelli dopo "Calcola"; i body sono eseguibili così come sono (`POST /api/calc/<id>`, autenticato).

### Fattura Avvocati — `POST /api/calc/fattura-avvocati`

**1. Ordinario, spese esenti e imponibili**  
Campi del sito: `Importo=1000,00`, `SpeseEsenti=50,00`, `SpeseNonEsenti=30,00`  
Body: `{"onorari": 1000.0, "spese_esenti": 50.0, "spese_imponibili": 30.0, "applica_spese_generali": true, "pct_spese_generali": 15.0, "applica_ritenuta": true, "iva_per_cassa": false, "split_payment": false, "regime_semplificato": false, "tipo_regime": 1, "addebito_bollo": false, "acconti": []}`  
Output sito: Onorari **1.000,00**; Spese generali ex art. 13 ( 15% su onorari ) **150,00**; Spese imponibili **30,00**; Cassa Avvocati ( 4% ) **47,20**; Totale imponibile **1.227,20**; IVA 22% su Imponibile **269,98**; Spese esenti ex art. 15, DPR 633/72 **50,00**; Totale documento **1.547,18**; A dedurre ritenuta d'acconto 20% (su onorari e spese) **236,00**; Netto a pagare **1.311,18**

**2. Regime forfettario agevolato con bollo**  
Campi del sito: `Importo=1000,00`, `SpeseEsenti=50,00`, `SpeseNonEsenti=30,00`, `RegimeSempl=True`, `TipoRegime=1`, `DoBollo=True`  
Body: `{"onorari": 1000.0, "spese_esenti": 50.0, "spese_imponibili": 30.0, "applica_spese_generali": true, "pct_spese_generali": 15.0, "applica_ritenuta": true, "iva_per_cassa": false, "split_payment": false, "regime_semplificato": true, "tipo_regime": 1, "addebito_bollo": true, "acconti": []}`  
Output sito: Onorari **1.000,00**; Spese generali ex art. 13 ( 15% su onorari ) **150,00**; Spese imponibili **30,00**; Imposta di bollo **2,00**; Cassa Avvocati ( 4% ) **47,28**; Spese esenti ex art. 15, DPR 633/72 **50,00**; Totale documento **1.279,28**; _Operazione non soggetta a IVA effettuata ai sensi dell’art. 1, commi 54-89, L. 190/2014 (regime forfettario agevolato)._; _Compenso non soggetto a ritenuta d’acconto ai sensi dell’art. 1, comma 67 L. 190/2014._; _Imposta di bollo assolta sull’originale._

**3. Split payment**  
Campi del sito: `Importo=1000,00`, `SpeseEsenti=50,00`, `SpeseNonEsenti=30,00`, `SplitPayment=True`  
Body: `{"onorari": 1000.0, "spese_esenti": 50.0, "spese_imponibili": 30.0, "applica_spese_generali": true, "pct_spese_generali": 15.0, "applica_ritenuta": true, "iva_per_cassa": false, "split_payment": true, "regime_semplificato": false, "tipo_regime": 1, "addebito_bollo": false, "acconti": []}`  
Output sito: Onorari **1.000,00**; Spese generali ex art. 13 ( 15% su onorari ) **150,00**; Spese imponibili **30,00**; Cassa Avvocati ( 4% ) **47,20**; Totale imponibile **1.227,20**; IVA 22% su Imponibile **269,98**; Spese esenti ex art. 15, DPR 633/72 **50,00**; Totale documento **1.547,18**; Importo IVA versato direttamente dal Cliente all'Erario (scissione dei pagamenti) **269,98**; A dedurre ritenuta d'acconto 20% (su onorari e spese) **236,00**; Netto a pagare **1.041,20**; _Operazione con "scissione dei pagamenti" ex art. 17-ter, DPR 633/72_

**4. Con un acconto (ritenuta disattivata)**  
Campi del sito: `Importo=2000,00`, `DoRacc=False` acconto [['500,00', '', '']]  
Body: `{"onorari": 2000.0, "spese_esenti": 0.0, "spese_imponibili": 0.0, "applica_spese_generali": true, "pct_spese_generali": 15.0, "applica_ritenuta": false, "iva_per_cassa": false, "split_payment": false, "regime_semplificato": false, "tipo_regime": 1, "addebito_bollo": false, "acconti": [{"importo": 500.0, "spese_esenti": 0, "spese_imponibili": 0}]}`  
Output sito: Saldo onorari (€ 2.000,00 - acconto € 342,68) **1.657,32**; Spese generali ex art. 13 ( 15% su onorari ) **248,60**; Cassa Avvocati ( 4% ) **76,24**; Totale imponibile **1.982,16**; IVA 22% su Imponibile **436,08**; Totale documento **2.418,24**

**5. Caso che differisce di 1 centesimo (acconto, split payment) — nostro: onorari saldo 1.174,56, totale documento 1.713,82, netto 1.134,62**  
Campi del sito: `Importo=1500,00`, `SplitPayment=True` acconto [['400,00', '', '']]  
Body: `{"onorari": 1500.0, "spese_esenti": 0.0, "spese_imponibili": 0.0, "applica_spese_generali": true, "pct_spese_generali": 15.0, "applica_ritenuta": true, "iva_per_cassa": false, "split_payment": true, "regime_semplificato": false, "tipo_regime": 1, "addebito_bollo": false, "acconti": [{"importo": 400.0, "spese_esenti": 0, "spese_imponibili": 0}]}`  
Output sito: Saldo onorari (€ 1.500,00 - acconto € 325,43) **1.174,57**; Spese generali ex art. 13 ( 15% su onorari ) **176,19**; Cassa Avvocati ( 4% ) **54,03**; Totale imponibile **1.404,79**; IVA 22% su Imponibile **309,05**; Totale documento **1.713,84**; Importo IVA versato direttamente dal Cliente all'Erario (scissione dei pagamenti) **309,05**; A dedurre ritenuta d'acconto 20% (su onorari e spese) **270,15**; Netto a pagare **1.134,64**; _Operazione con "scissione dei pagamenti" ex art. 17-ter, DPR 633/72_

### Fattura Professionisti — `POST /api/calc/fattura-professionisti`

**1. Calcola con contributo, ritenuta e IVA per cassa**  
Campi del sito: `Importo=3560,18`, `SpeseNonEsenti=58,39`, `DoContr1=True`, `DesContr1=Enpam`, `PctContr1=10`, `DoRacc=True`, `PctRacc=20`, `IvaDifferita=True`  
Body: `{"importo": 3560.18, "spese_esenti": 0.0, "spese_imponibili": 58.39, "applica_iva": true, "pct_iva": 22.0, "applica_contributo": true, "descrizione_contributo": "Enpam", "pct_contributo": 10.0, "applica_spese_forfettarie": false, "descrizione_spese_forfettarie": null, "pct_spese_forfettarie": 0.0, "applica_ritenuta": true, "pct_ritenuta": 20.0, "iva_per_cassa": true, "split_payment": false, "regime_semplificato": false, "tipo_regime": 1, "addebito_bollo": false, "scorpora": false}`  
Output sito: Importo **3.560,18**; Spese imponibili **58,39**; Enpam ( 10% ) **361,86**; Totale imponibile **3.980,43**; IVA 22% su Imponibile **875,69**; Totale documento **4.856,12**; A dedurre ritenuta d'acconto 20% su € 3.618,57 **723,71**; Netto a pagare **4.132,41**; _IVA ad esigibilità differita ai sensi dell’art. 32 bis, D.L. 83/2012._

**2. Calcola in regime semplificato con bollo**  
Campi del sito: `Importo=4270,04`, `SpeseNonEsenti=261,89`, `DoContr1=True`, `DesContr1=Inps`, `PctContr1=4`, `RegimeSempl=True`, `TipoRegime=2`, `DoBollo=True`  
Body: `{"importo": 4270.04, "spese_esenti": 0.0, "spese_imponibili": 261.89, "applica_iva": true, "pct_iva": 22.0, "applica_contributo": true, "descrizione_contributo": "Inps", "pct_contributo": 4.0, "applica_spese_forfettarie": false, "descrizione_spese_forfettarie": null, "pct_spese_forfettarie": 0.0, "applica_ritenuta": false, "pct_ritenuta": 20.0, "iva_per_cassa": false, "split_payment": false, "regime_semplificato": true, "tipo_regime": 2, "addebito_bollo": true, "scorpora": false}`  
Output sito: Importo **4.270,04**; Spese imponibili **261,89**; Imposta di bollo **2,00**; Inps ( 4% ) **181,36**; Totale documento **4.715,29**; _Operazione non soggetta a IVA effettuata ai sensi dell’art. 27, D.L. 98/2011 (regime fiscale di vantaggio per l'imprenditoria giovanile)._; _Imposta di bollo assolta sull’originale._

**3. Scorpora & Calcola (IVA 21%, ritenuta 23%)**  
Campi del sito: `Importo=3486,07`, `SpeseNonEsenti=284,10`, `PctIva=21`, `DoRacc=True`, `PctRacc=23` (pulsante Scorpora & Calcola)  
Body: `{"importo": 3486.07, "spese_esenti": 0.0, "spese_imponibili": 284.1, "applica_iva": true, "pct_iva": 21.0, "applica_contributo": false, "descrizione_contributo": null, "pct_contributo": 0.0, "applica_spese_forfettarie": false, "descrizione_spese_forfettarie": null, "pct_spese_forfettarie": 0.0, "applica_ritenuta": true, "pct_ritenuta": 23.0, "iva_per_cassa": false, "split_payment": false, "regime_semplificato": false, "tipo_regime": 1, "addebito_bollo": false, "scorpora": true}`  
Output sito: Importo omnicomprensivo **3.486,07**; Risultato scorporo **3.273,11**; Spese imponibili **284,10**; Totale imponibile **3.557,21**; IVA 21% su Imponibile **747,01**; Totale documento **4.304,22**; A dedurre ritenuta d'acconto 23% su € 3.557,21 **818,16**; Netto a pagare **3.486,06**

**4. Scorpora con differenza di 1 centesimo (nostro compenso 1.011,93, totale 1.234,55)**  
Campi del sito: `Importo=1234,56`  
Body: `{"importo": 1234.56, "spese_esenti": 0.0, "spese_imponibili": 0.0, "applica_iva": true, "pct_iva": 22.0, "applica_contributo": false, "descrizione_contributo": null, "pct_contributo": 0.0, "applica_spese_forfettarie": false, "descrizione_spese_forfettarie": null, "pct_spese_forfettarie": 0.0, "applica_ritenuta": false, "pct_ritenuta": 20.0, "iva_per_cassa": false, "split_payment": false, "regime_semplificato": false, "tipo_regime": 1, "addebito_bollo": false, "scorpora": true}`  
Output sito: Importo omnicomprensivo **1.234,56**; Risultato scorporo **1.011,94**; Totale imponibile **1.011,94**; IVA 22% su Imponibile **222,63**; Totale documento **1.234,57**; Netto a pagare **1.234,57**

### Fattura Enasarco — `POST /api/calc/fattura-enasarco`

**1. Con collaboratori (20%) e spese**  
Campi del sito: `Importo=245,85`, `SpeseEsenti=288,81`, `SpeseNonEsenti=232,82`, `PctIva=5`, `DoRacc=False`, `Categoria=2`  
Body: `{"importo": 245.85, "calcola_da_vendite": false, "vendite": 0.0, "pct_provvigione": 0.0, "spese_esenti": 288.81, "spese_imponibili": 232.82, "applica_iva": true, "pct_iva": 5.0, "applica_enasarco": true, "pct_enasarco": 8.5, "applica_ritenuta": false, "pct_ritenuta": 23.0, "categoria": 2, "regime_semplificato": false, "tipo_regime": 1, "addebito_bollo": false}`  
Output sito: Importo Prestazione **245,85**; Spese imponibili **232,82**; Totale imponibile **478,67**; IVA 5% su Imponibile **23,93**; Totale documento **502,60**; Contributo obbligatorio Enasarco ( 8,5% ) **40,69**; Spese esenti ex art. 15, DPR 633/72 **288,81**; Netto a pagare **750,72**

**2. Calcolo dalle vendite**  
Campi del sito: `CalcolaDaVendite=True`, `Vendite=14550,56`, `PctProvvigione=7,25`, `SpeseEsenti=240,72`, `SpeseNonEsenti=189,33`, `PctEnasarco=4`, `Categoria=2`, `RegimeSempl=True`, `TipoRegime=2`, `DoBollo=True`  
Body: `{"importo": 0.0, "calcola_da_vendite": true, "vendite": 14550.56, "pct_provvigione": 7.25, "spese_esenti": 240.72, "spese_imponibili": 189.33, "applica_iva": true, "pct_iva": 22.0, "applica_enasarco": true, "pct_enasarco": 4.0, "applica_ritenuta": true, "pct_ritenuta": 23.0, "categoria": 2, "regime_semplificato": true, "tipo_regime": 2, "addebito_bollo": true}`  
Output sito: Totale Vendite **14.550,56**; Provvigioni ( 7,25% sulle vendite ) **1.054,92**; Spese imponibili **189,33**; Imposta di bollo **2,00**; Totale imponibile **1.246,25**; Contributo obbligatorio Enasarco ( 4% ) **49,85**; Spese esenti ex art. 15, DPR 633/72 **240,72**; Netto a pagare **1.437,12**; _Operazione non soggetta a IVA effettuata ai sensi dell’art. 27, D.L. 98/2011 (regime fiscale di vantaggio per l'imprenditoria giovanile)._; _Compenso non soggetto a ritenuta d’acconto come da provvedimento del Direttore dell’Agenzia delle entrate n. 185820/2011._; _Imposta di bollo assolta sull’originale._

**3. Regime dei minimi con bollo**  
Campi del sito: `Importo=1651,26`, `SpeseNonEsenti=232,17`, `PctIva=5`, `Categoria=3`, `RegimeSempl=True`, `TipoRegime=3`, `DoBollo=True`  
Body: `{"importo": 1651.26, "calcola_da_vendite": false, "vendite": 0.0, "pct_provvigione": 0.0, "spese_esenti": 0.0, "spese_imponibili": 232.17, "applica_iva": true, "pct_iva": 5.0, "applica_enasarco": true, "pct_enasarco": 8.5, "applica_ritenuta": true, "pct_ritenuta": 23.0, "categoria": 3, "regime_semplificato": true, "tipo_regime": 3, "addebito_bollo": true}`  
Output sito: Importo Prestazione **1.651,26**; Spese imponibili **232,17**; Imposta di bollo **2,00**; Totale imponibile **1.885,43**; Contributo obbligatorio Enasarco ( 8,5% ) **160,26**; Ritenuta d'acconto ( 23% sul 78% dell'imponibile ) **338,25**; Netto a pagare **1.386,92**; _Operazione non soggetta a IVA effettuata ai sensi dell’art. 1, commi 96-117, L. 244/2007 (regime fiscale semplificato)._; _Imposta di bollo assolta sull’originale._

### Ricevuta Prestazione Occasionale — `POST /api/calc/ricevuta-prestazione-occasionale` (solo parte numerica)

**1. 6.000 € con ritenuta d'acconto**  
Campi del sito: `DoRacc=True`, compensi [['C', '6000,00']], spese []  
Body: `{"data_ricevuta": "2026-11-14", "compensi": [{"descrizione": "C", "importo": 6000.0}], "spese_documentate": [], "applica_spese_forfettarie": false, "pct_spese_forfettarie": null, "importo_spese_forfettarie": null, "addebito_bollo": false, "applica_ritenuta": true, "pct_ritenuta": 20.0, "altri_compensi_percepiti": false, "totale_altri_compensi": null, "tipo_lavoratore": 1, "aliquota_inps": null}`  
Output sito: C **6.000,00**; Ritenuta d’acconto (20% sul compenso) **1.200,00**; Imponibile Inps per la parte eccedente € 5000 annuali **1.000,00**; Aliquota gestione separata Inps **35,03%**; Ritenuta INPS a carico del prestatore (1/3 di € 350,30) **116,77**; Netto a pagare: **4.683,23**

**2. Spese forfettarie 10%, altri compensi già percepiti 7.301,55**  
Campi del sito: `DoRacc=True`, `DoSpeseGen=True`, `PctSpeseGen=10`, `CompPerc=1`, `TotCompPerc=7301,55`, compensi [['C0', '2554,94'], ['C1', '390,44']], spese []  
Body: `{"data_ricevuta": "2026-11-14", "compensi": [{"descrizione": "C0", "importo": 2554.94}, {"descrizione": "C1", "importo": 390.44}], "spese_documentate": [], "applica_spese_forfettarie": true, "pct_spese_forfettarie": 10.0, "importo_spese_forfettarie": null, "addebito_bollo": false, "applica_ritenuta": true, "pct_ritenuta": 20.0, "altri_compensi_percepiti": true, "totale_altri_compensi": 7301.55, "tipo_lavoratore": 1, "aliquota_inps": null}`  
Output sito: C0 **2.554,94**; C1 **390,44**; Totale compenso: **2.945,38**; Spese forfettarie (10%) **294,54**; Totale imponibile: **3.239,92**; Ritenuta d’acconto (20% sull’imponibile) **647,98**; Imponibile Inps per la parte eccedente € 5000 annuali **3.239,92**; Aliquota gestione separata Inps **35,03%**; Ritenuta INPS a carico del prestatore (1/3 di € 1.134,94) **378,31**; Netto a pagare: **2.213,63**

**3. Massimale annuo superato (altri compensi 120.000 €)**  
Campi del sito: `CompPerc=1`, `TotCompPerc=120000,00`, compensi [['C', '5000,00']], spese []  
Body: `{"data_ricevuta": "2026-11-14", "compensi": [{"descrizione": "C", "importo": 5000.0}], "spese_documentate": [], "applica_spese_forfettarie": false, "pct_spese_forfettarie": null, "importo_spese_forfettarie": null, "addebito_bollo": false, "applica_ritenuta": false, "pct_ritenuta": 20.0, "altri_compensi_percepiti": true, "totale_altri_compensi": 120000.0, "tipo_lavoratore": 1, "aliquota_inps": null}`  
Output sito: C **5.000,00**; Imponibile Inps per la parte eccedente € 5000 annuali **2.295,00**; Aliquota gestione separata Inps **35,03%**; Ritenuta INPS a carico del prestatore (1/3 di € 803,94) **267,98**; Netto a pagare: **4.732,02**

### Tariffe Mediazione — `POST /api/calc/tariffe-mediazione`

**1. Materia obbligatoria + esito positivo (default del sito)**  
Campi del sito: `ValoreCausa=30000`  
Body: `{"valore_controversia": 30000.0, "materia_obbligatoria": true, "assenza_controparte": false, "complessita": false, "pct_complessita": 1, "proposta_formulata": false, "esito_positivo": true, "pct_esito_positivo": 25, "applica_iva": true, "pct_iva": 22.0, "spese_avvio_imponibili": false}`  
Output sito (minimo / massimo): Indennità Base **360,00 / 600,00**; Spese fisse di avvio mediazione: **40,00 / 40,00**; Riduzione 1/3 materia obbligatoria: **-120,00 / -200,00**; Aumento 25% esito positivo: **90,00 / 150,00**; Imponibile: **330,00 / 550,00**; Iva 22%: **72,60 / 121,00**; Costo Totale (per ciascuna parte): **442,60 / 711,00**

**2. Assenza controparte**  
Campi del sito: `ValoreCausa=30000`, `AssenzaControparte=True`  
Body: `{"valore_controversia": 30000.0, "materia_obbligatoria": true, "assenza_controparte": true, "complessita": false, "pct_complessita": 1, "proposta_formulata": false, "esito_positivo": false, "pct_esito_positivo": 25, "applica_iva": true, "pct_iva": 22.0, "spese_avvio_imponibili": false}`  
Output sito (minimo / massimo): Indennità Base **50,00 / 50,00**; Spese fisse di avvio mediazione: **40,00 / 40,00**; Riduzione 1/3 materia obbligatoria: **-16,67 / -16,67**; Imponibile: **33,33 / 33,33**; Iva 22%: **7,33 / 7,33**; Costo Totale (per ciascuna parte): **80,66 / 80,66**

**3. Valore oltre 2,5 milioni, proposta ed esito positivo**  
Campi del sito: `ValoreCausa=999`, `MateriaObbligatoria=False`, `Difficolta=True`, `PctDifficolta=10`, `Successo=False`, `PctIva=21`, `SpeseAvvioImponibili=True`  
Body: `{"valore_controversia": 999.0, "materia_obbligatoria": false, "assenza_controparte": false, "complessita": true, "pct_complessita": 10, "proposta_formulata": false, "esito_positivo": false, "pct_esito_positivo": 25, "applica_iva": true, "pct_iva": 21.0, "spese_avvio_imponibili": true}`  
Output sito (minimo / massimo): Indennità Base **0,00 / 65,00**; Spese fisse di avvio mediazione: **40,00 / 40,00**; Aumento 10% complessità: **0,00 / 6,50**; Imponibile: **40,00 / 111,50**; Iva 21%: **8,40 / 23,42**; Costo Totale (per ciascuna parte): **48,40 / 134,92**

### Calcolo Preventivo — `POST /api/calc/calcolo-preventivo`

**1. IVA e ritenuta**  
Campi del sito: `DoIva=True`, `Ritenuta=True`, righe [['A', '2', '100,00'], ['B', '1', '250,55']]  
Body: `{"righe": [{"descrizione": "A", "quantita": 2.0, "prezzo": 100.0}, {"descrizione": "B", "quantita": 1.0, "prezzo": 250.55}], "applica_iva": true, "pct_iva": 22, "ritenuta": true}`  
Output sito: A 2 € 100,00 **200,00**; B 1 € 250,55 **250,55**; TOTALE: **450,55**; Imponibile **450,55**; IVA 22% su Imponibile **99,12**; Totale **549,67**; A dedurre ritenuta d'acconto 20% **90,11**; Totale documento **459,56**

**2. IVA 10%**  
Campi del sito: `DoIva=True`, `PctIva=10`, righe [['A', '3', '33,33']]  
Body: `{"righe": [{"descrizione": "A", "quantita": 3.0, "prezzo": 33.33}], "applica_iva": true, "pct_iva": 10, "ritenuta": false}`  
Output sito: A 3 € 33,33 **99,99**; TOTALE: **99,99**; Imponibile **99,99**; IVA 10% su Imponibile **10,00**; Totale documento **109,99**

**3. Prezzo con più di 2 decimali (0,335 → 0,34)**  
Campi del sito: , righe [['A', '1', '0,005']]  
Body: `{"righe": [{"descrizione": "A", "quantita": 1.0, "prezzo": 0.005}], "applica_iva": false, "pct_iva": 22, "ritenuta": false}`  
Output sito: A 1 € 0,01 **0,01**; TOTALE: **0,01**

Nota: i casi "differisce di 1 centesimo" sono volutamente inclusi per poter rieseguire il confronto in produzione.

## Commit mergiati
- Backend: PR #154, merge `8b32142` (ultimo commit feature `ba6150f`).
- Frontend: ultimo commit feature in questa PR; merge SHA nel riepilogo in chat.
