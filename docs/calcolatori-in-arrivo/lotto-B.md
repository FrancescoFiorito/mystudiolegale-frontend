# Lotto B — compensi avvocati

Stato: backend mergiato (PR #149), **non deployato su Render e nessuna chiamata alla produzione** (a carico della sessione di coordinamento). Frontend in questa PR.

Valori attesi = quelli letti dal sito di riferimento in questa sessione (Chromium headless; i form sono POST, riprodotti con `fetch` dentro la pagina; la Spese Trasferta è calcolata dal JavaScript della pagina, pilotata via UI). Confronto contro il codice backend eseguito in locale (stesse coroutine deployate), voce per voce.

| Calcolatore | Esito | Casi confrontati |
|---|---|---|
| Parametri 2014 Penale | allineato | 59 casuali + ~35 mirati |
| Parametri 2012 Penale | allineato | 120 casuali (2 lotti) + ~35 mirati |
| Parametri 2012 Civile | allineato | 117 casuali (2 lotti) + ~25 mirati |
| Spese Trasferta Avvocati | allineato dopo correzioni | 30 scenari / 76 righe |
| Tariffe Forensi 2004 | **non implementato**: è un tariffario consultabile (elenco prestazioni/tariffe per valore, con ricerca), non un calcolatore | — |
| Calcolo Nota Spese | **resta "in arrivo"** (non indagato oltre il form) | — |
| Calcolo Notula Penale | allineato, con 1 scarto residuo noto (anticipi con spese imponibili: 1 centesimo) | ~110 casi via UI reale: 24+30+36+30 casuali (attività, tariffe, regimi, bollo, anticipi, riparametrazione) + ~60 mirati |
| Preventivo Attività Stragiudiziali | **resta "in arrivo"**, non indagato | — |

## Regole ricavate dal sito
- **Parametri 2014 Penale** (tabelle 2022 vigenti / 2014-2018; 2014-2018 non ha Convalida dell'arresto e Magistrato di sorveglianza): compenso = somma fasi (min/medio/max o importo personalizzato, per fase on/off). Ulteriore valutazione (art. 12 c.1, % libera, 0/vuoto = errore) sul tabellare; poi aumento più parti **sul risultato** (default = massimo: +30% per soggetto fino a 10, poi +10% fino a 30; 11 parti=280%, 30=470%). Riduzioni **a scalare** nell'ordine assenza questioni (1-30%) → gratuito patrocinio (1/3) → praticante (1-50%); ogni passaggio arrotondato al centesimo mezzo-su e la base del successivo è l'importo arrotondato. Spese generali sul compenso totale; CPA su compenso+spese generali+trasferta+altre imponibili; IVA 22% sull'imponibile; ritenuta 20% senza CPA; spese esenti fuori IVA.
- **Parametri 2012 Penale/Civile**: aumenti (collegiale, più parti, class action, conciliazione — questa è un aumento —, ulteriore valutazione) tutti **sul tabellare** e sommati; riduzioni a scalare (lavoro → indennizzo → responsabilità 50% → gratuito patrocinio 50%, minori → GP nel penale). Catena **a precisione piena**: si arrotonda solo per mostrare, il netto finale è arrotondato dall'esatto (8.296,05 con minori 50% e GP: −4.148,03, −2.074,01, netto 2.074,01); spese generali e CPA arrotondate, IVA calcolata sul compenso esatto + addendi arrotondati (caso 5.752,50 +5% collegiale, spese 20%, IVA 1.594,59). Fase esecutiva penale: tariffa oraria × ore, **ore troncate all'intero** (0 o vuoto = errore).
- **Spese Trasferta**: rimborso carburante max 20%, costi accessori albergo max 10% (valori superiori riportati al massimo dal sito); km arrotondati all'intero mezzo-su (0,5→1); tutti gli importi mezzo-su (250,55×10% = 25,06, non 25,05).

## Differenze residue / scelte
- Nessun caso noto che differisca nei calcolatori consegnati. Il motore 2014 (riduzioni sull'importo arrotondato) e quello 2012 (precisione piena) sono volutamente diversi, come sul sito.
- Il sito 2014 mostra tabelle vuote per le competenze non previste nell'anno: qui la competenza non è selezionabile / errore.
- Spese Trasferta: Località e Data sono solo campi descrittivi (il sito non li usa nel calcolo); max 8 trasferte come sul sito.
- Non replicati: tab "Dati Documento", salvataggio documento, stampa/PDF/Word, fattura da prospetto.
- **Nota Spese**: non indagata (stesso impianto della Notula Penale ma con Diritti/Onorari/Stragiudiziale); resta "in arrivo".
- **Notula Penale** (guidata via UI reale: Imposta le attività → Salva e chiudi → Calcola Notula). Regole: quantità intera 1-99 (0 → errore); tariffa specificata senza limiti min/max (0 → errore); le attività 7.5 di GdP/GIP/GUP hanno solo tariffa specificata (l'endpoint aveva 0/60/180: errato); spese generali sugli onorari, CPA 4% su onorari+spese generali+spese imponibili(+bollo), IVA 22% solo regime ordinario, ritenuta 20% su stessa base (CPA esclusa) nei regimi ordinario e minimi, mai nei regimi 1-2. **Bollo**: 2 € solo nei regimi 1-3, se spuntato e se il totale prima del bollo (spese esenti comprese) supera 77,47 €; la nota "Imposta di bollo assolta sull'originale" compare sopra soglia anche senza bollo spuntato. **Anticipi**: l'onorario anticipato X è quello il cui totale con la catena diretta (spese generali fisse 15%, CPA, IVA, al netto di ritenuta se spuntata) coincide con anticipo − spese esenti − spese imponibili ricalcolate; il resto della notula si calcola su onorari − X, spese − anticipate (anche negative). **Riparametrazione**: tariffa (min/med/max, anche personalizzate se spuntato: sostituite), variazione ±% (per unità, arrotondata), forza totale (più piccolo onorario il cui totale con la catena reale raggiunge quello richiesto, poi fattore = onorario/Σ(tariffa×qtà) a precisione piena, tariffe per unità arrotondate).
- **Differenza residua nota (Notula Penale)**: con anticipi che includono *spese imponibili* l'onorario anticipato può differire di 1 centesimo dal sito (in una griglia di 24 anticipi: 5 casi, tutti con spese imponibili; senza spese imponibili 0 differenze su ~25). Non ho trovato la regola esatta di arrotondamento.

## Esempi (campi del form del sito → output letto)
**Notula Penale** (`IdCompetenza(4)=1` Tribunale Monocratico, tariffa predefinita Media)
1. `Sel(0)` qta 2 (1.1 Corrispondenza informativa), `Sel(1)` 1.2 con `Tar(1)=3` e `SpEse(1)=10,00`, `SpNon(1)=5,00` → onorari 68,00; spese gen. 10,20; cassa 3,33; imponibile 86,53; IVA 19,04; esenti 10,00; totale 115,57; ritenuta 16,64; netto 98,93.
2. Stessa notula con `RegimeSempl`, `TipoRegime=1` → totale documento 96,53, senza IVA né ritenuta; con `DoBollo` e totale >77,47 → bollo 2,00, cassa 3,41, totale 98,61.
3. Attività 1.1 qta 9 con anticipo `AntVal(0)=100,00` (ritenuta attiva, ordinario) → di cui anticipi 81,36; totale onorari 8,64; liquidabile 12,61; netto 10,62.


**Parametri 2014 Penale** (`Competenza=570`, `Anno=2022`, tutte le fasi, valori medi, spese generali 15%)
1. Nessuna variazione → Compenso tabellare 3.592,00; spese generali 538,80; ipotesi liquidabile 4.130,80.
2. `PiuParti=3`, `PctPiuParti=60`, `Importanza` 25% → tabellare 4.490,00; aumento parti 2.694,00; totale 7.184,00.
3. `AssenzaQfd=30`, `GP`, `Praticante=50` → −1.077,60, −838,13, −838,14; compenso totale 838,13; spese gen 125,72; ipotesi 963,85.

**Parametri 2012 Penale** (`Competenza=210`, medi, esecutiva 20 €/h × 3 ore)
1. Base → tabellare 2.760,00; spese gen 414,00; liquidabile 3.174,00.
2. `Collegiale=25`, `PiuParti=40`, `Importanza=15`, `Minori=30`, `GP` → maggiorato 4.968,00; −1.490,40; −1.738,80; totale 1.738,80; liquidabile 1.999,62.
3. `Qta=2,5` → 2 ore, tabellare 2.740,00.

**Parametri 2012 Civile** (`Competenza=20`, `Scaglione=20`, 8 fasi medie)
1. Base → tabellare 8.460,00; liquidabile 9.729,00.
2. `Collegiale=25`, `Conciliazione=20`, `GP` → maggiorato 12.267,00; −6.133,50; spese gen 920,03; liquidabile 7.053,53.
3. Lavoro 30%, Indennizzo 45%, Responsabilità, GP con conciliazione 20% → −3.045,60, −3.197,88, −1.954,26, −977,13; liquidabile 1.123,70.

**Spese Trasferta**: `CostoCarburante0=1`, `Chilometri0=10,5`, `PctRimborsoCarburante=20` → rimborso 2,20; con `PctRimborsoCarburante=25` il sito usa 20.

## Deploy / verifica in produzione (a carico del coordinamento)
- Backend mergiato, **da deployare su Render**; verificare le 4 rotte `/api/calc/parametri-penali-2014`, `/parametri-penali-2012`, `/parametri-civili-2012`, `/spese-trasferta-avvocati` (presenti in `app.routes` locale, definite prima di `include_router`).
- Nessuna build iOS lanciata: queste modifiche non sono in nessuna build.

## Commit mergiati
- Backend: merge PR #149 `a00db1a` (ultimo commit feature `56e2525`).
- Frontend: vedi merge di questa PR (ultimo commit feature `ca3c1f1`→`Spese Trasferta`).
