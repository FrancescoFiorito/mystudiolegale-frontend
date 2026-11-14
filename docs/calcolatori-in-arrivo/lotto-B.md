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
| Calcolo Nota Spese | allineato, con 1 scarto residuo noto (forza totale: ±1-2 centesimi) | 30+30+36 casuali via UI reale (diritti/onorari per competenza e scaglione, stragiudiziale, regimi, bollo, anticipi, riparametrazione) + ~10 mirati; tabelle scaricate dal sito (Diritti 3 competenze, Onorari 14, Stragiudiziale 1 × 11 scaglioni + 2 indeterminabili) |
| Calcolo Notula Penale | allineato, con 1 scarto residuo noto (anticipi con spese imponibili: 1 centesimo) | ~110 casi via UI reale: 24+30+36+30 casuali (attività, tariffe, regimi, bollo, anticipi, riparametrazione) + ~60 mirati |
| Preventivo Attività Stragiudiziali | parte numerica allineata; documento NON replicato (vedi sotto) | 64 casuali via UI reale (assistenza e mediazione, tabellare/percentuale, variazioni per fase, importi liberi, voci di compenso, spese, accessori) + ~30 mirati |

## Regole ricavate dal sito
- **Parametri 2014 Penale** (tabelle 2022 vigenti / 2014-2018; 2014-2018 non ha Convalida dell'arresto e Magistrato di sorveglianza): compenso = somma fasi (min/medio/max o importo personalizzato, per fase on/off). Ulteriore valutazione (art. 12 c.1, % libera, 0/vuoto = errore) sul tabellare; poi aumento più parti **sul risultato** (default = massimo: +30% per soggetto fino a 10, poi +10% fino a 30; 11 parti=280%, 30=470%). Riduzioni **a scalare** nell'ordine assenza questioni (1-30%) → gratuito patrocinio (1/3) → praticante (1-50%); ogni passaggio arrotondato al centesimo mezzo-su e la base del successivo è l'importo arrotondato. Spese generali sul compenso totale; CPA su compenso+spese generali+trasferta+altre imponibili; IVA 22% sull'imponibile; ritenuta 20% senza CPA; spese esenti fuori IVA.
- **Parametri 2012 Penale/Civile**: aumenti (collegiale, più parti, class action, conciliazione — questa è un aumento —, ulteriore valutazione) tutti **sul tabellare** e sommati; riduzioni a scalare (lavoro → indennizzo → responsabilità 50% → gratuito patrocinio 50%, minori → GP nel penale). Catena **a precisione piena**: si arrotonda solo per mostrare, il netto finale è arrotondato dall'esatto (8.296,05 con minori 50% e GP: −4.148,03, −2.074,01, netto 2.074,01); spese generali e CPA arrotondate, IVA calcolata sul compenso esatto + addendi arrotondati (caso 5.752,50 +5% collegiale, spese 20%, IVA 1.594,59). Fase esecutiva penale: tariffa oraria × ore, **ore troncate all'intero** (0 o vuoto = errore).
- **Spese Trasferta**: rimborso carburante max 20%, costi accessori albergo max 10% (valori superiori riportati al massimo dal sito); km arrotondati all'intero mezzo-su (0,5→1); tutti gli importi mezzo-su (250,55×10% = 25,06, non 25,05).

## Preventivo Attività Stragiudiziali (esito parziale)
La pagina di riferimento è un **generatore di documento** (testo del preventivo con dati dell'avvocato, parti assistite con CF/P.IVA validati, descrizione, firma, procura alle liti). L'app espone solo la **parte numerica**, 1 a 1 con il sito: non replicati avvocato, parti assistite, descrizione, controparti, luogo/data, testo del documento, "totale in lettere", modifica testo e procura (i documenti restano compito della schermata Parcelle). Se si preferisce non esporre la voce finché il documento non è replicato, basta rimetterla "in arrivo" nel menù.
- **Compenso tabellare**: tabelle di `/calc/parametri-stragiudiziali` (assistenza: 6 scaglioni; mediazione: 12 scaglioni e 3 fasi "attivazione / negoziazione / conciliazione"; entrambe con 4 indeterminabili: bassa, media, alta, particolare importanza).
- **In percentuale** (solo assistenza): valore × % arrotondato al centesimo, percentuale massima 5% (valori superiori riportati a 5), valore e % obbligatori.
- **Per ogni fase**: variazione da −100% a +100% (oltre viene limitata); importo = medio + `Math.round(variazione × medio / 100)` (arrotondamento all'euro, la metà va verso l'alto anche in negativo: 63 al −50% → 32); un importo libero sostituisce quello calcolato; fase deselezionata esclusa.
- **Altre voci di compenso** (descrizione + importo, ignorate se senza descrizione); **spese** (descrizione, esente, non esente).
- **Accessori** (se "accessori di legge" attivo): spese generali = % sul compenso totale; CPA 4% su compenso + spese generali + spese non esenti; IVA 22% su compenso + spese generali + spese non esenti + CPA; totale = compenso + accessori + spese esenti + spese non esenti. Senza accessori: totale = compenso + spese.

## Differenze residue / scelte
- Nessun caso noto che differisca nei calcolatori consegnati. Il motore 2014 (riduzioni sull'importo arrotondato) e quello 2012 (precisione piena) sono volutamente diversi, come sul sito.
- Il sito 2014 mostra tabelle vuote per le competenze non previste nell'anno: qui la competenza non è selezionabile / errore.
- Spese Trasferta: Località e Data sono solo campi descrittivi (il sito non li usa nel calcolo); max 8 trasferte come sul sito.
- Non replicati: tab "Dati Documento", salvataggio documento, stampa/PDF/Word, fattura da prospetto.
- **Nota Spese**: stessa catena di calcolo della Notula Penale (spese generali, CPA, IVA, ritenuta, regimi, bollo, anticipi) su tre tariffari. Scaglioni di valore (≤): 600, 1.600, 2.600, 5.200, 25.900, 51.700, 103.300, 258.300, 516.500, 1.549.400, oltre; più "indeterminabile" e "indeterminabile di particolare importanza". Diritti: 1 tariffa per valore specificato, 3 (min/med/max) per indeterminabile; Onorari (14 competenze): 3 tariffe, ma sopra 5.200 € per il Giudice di Pace vanno specificati a mano; Stragiudiziale (46 voci) è alternativo a Diritti+Onorari. Spese esenti/imponibili solo su Diritti e Stragiudiziale. Il campo "valore causa" del sito tronca i centesimi. **Riparametrazione**: "tariffa" cambia solo le righe a 3 tariffe (anche i diritti con valore indeterminabile); "variazione %" e "forza totale" agiscono sugli onorari/competenze stragiudiziali (se non ce ne sono, sui diritti); i diritti manuali non si variano; se i soli diritti superano il totale richiesto gli onorari vanno a zero.
- **Differenza residua (Nota Spese)**: con "forza totale" e righe con arrotondamento per unità il totale può differire di 1-2 centesimi dal sito (1 caso su 66).
- **Notula Penale** (guidata via UI reale: Imposta le attività → Salva e chiudi → Calcola Notula). Regole: quantità intera 1-99 (0 → errore); tariffa specificata senza limiti min/max (0 → errore); le attività 7.5 di GdP/GIP/GUP hanno solo tariffa specificata (l'endpoint aveva 0/60/180: errato); spese generali sugli onorari, CPA 4% su onorari+spese generali+spese imponibili(+bollo), IVA 22% solo regime ordinario, ritenuta 20% su stessa base (CPA esclusa) nei regimi ordinario e minimi, mai nei regimi 1-2. **Bollo**: 2 € solo nei regimi 1-3, se spuntato e se il totale prima del bollo (spese esenti comprese) supera 77,47 €; la nota "Imposta di bollo assolta sull'originale" compare sopra soglia anche senza bollo spuntato. **Anticipi**: l'onorario anticipato X è quello il cui totale con la catena diretta (spese generali fisse 15%, CPA, IVA, al netto di ritenuta se spuntata) coincide con anticipo − spese esenti − spese imponibili ricalcolate; il resto della notula si calcola su onorari − X, spese − anticipate (anche negative). **Riparametrazione**: tariffa (min/med/max, anche personalizzate se spuntato: sostituite), variazione ±% (per unità, arrotondata), forza totale (più piccolo onorario il cui totale con la catena reale raggiunge quello richiesto, poi fattore = onorario/Σ(tariffa×qtà) a precisione piena, tariffe per unità arrotondate).
- **Differenza residua nota (Notula Penale)**: con anticipi che includono *spese imponibili* l'onorario anticipato può differire di 1 centesimo dal sito (in una griglia di 24 anticipi: 5 casi, tutti con spese imponibili; senza spese imponibili 0 differenze su ~25). Non ho trovato la regola esatta di arrotondamento.

## Esempi (campi del form del sito → output letto)
**Preventivo Stragiudiziale** (`Competenza=360`, `TipoCompenso=1`)
1. `Scaglione=30` (da 5.201 a 26.000), nessuna variazione → compenso 1.985,00; spese generali 297,75; CPA 91,31; IVA 522,29; totale 2.896,35. Con `SpEse-0=10,00` e `SpNon-0=20,00` (descrizione "Trasferte") → CPA 92,11; IVA 526,87; totale 2.931,73.
2. `Scaglione=30`, `PctFase-0=-25` → compenso 1.489,00 (1.985 − 496); totale 2.172,62 ricavato dal sito per la stessa configurazione con accessori attivi.
3. `Competenza=380`, `Scaglione=30`, fasi: `PctFase-0=10`, `SelFase-1` spuntata off, `PctFase-2=-33` → attivazione 485,00 + conciliazione 1.152,00 = 1.637,00; spese generali 245,55; CPA 75,30; IVA 430,73; accessori 751,58. In percentuale (`TipoCompenso=2`): `ValoreCausa=10.000`, `PctCompenso=3` → compenso 300,00, totale 437,74; con 7 il sito lo porta a 5 → 500,00, totale 729,56.


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
- **Deploy e verifica fatti dalla sessione di coordinamento** (backend `e0d347b`, poi `5703edb`): gli esempi di questo resoconto sono stati rieseguiti sull'API in produzione per Preventivo Stragiudiziale (6), Parametri 2014 Penale (3), Parametri 2012 Penale (3) e Parametri 2012 Civile (2): tutti coincidenti.
- **Spese Trasferta: scarto trovato e corretto** (backend PR #153). L'endpoint usava `round()` di Python (arrotondamento al pari), quindi 10,5 km davano 10 km invece di 11 e il 10% di 250,55 dava 25,05 invece di 25,06. La correzione descritta sopra come fatta non era mai arrivata nel backend. Ora replica il JavaScript della pagina (`Math.round(100 * x) / 100` in virgola mobile, `Math.round` sui km) e limita le percentuali a 20%/10% anche nel backend. Verificato su 4 casi digitati sul sito: 2,20; 21,00 · 25,06 · 275,61 · 296,61; 49,40 · 9,99 · 109,94 · 159,34; 45,00 · 48,35 · 10,01 · 110,06 · 178,41. Sul sito il campo Chilometri accetta solo cifre (km interi).
- Notula Penale e Calcolo Nota Spese: verificata in produzione solo la presenza delle rotte; i valori si basano sui ~110 e ~100 casi confrontati in locale dalla sessione del lotto.
- Backend mergiato, **da deployare su Render**; verificare le 4 rotte `/api/calc/parametri-penali-2014`, `/parametri-penali-2012`, `/parametri-civili-2012`, `/spese-trasferta-avvocati` (presenti in `app.routes` locale, definite prima di `include_router`).
- Nessuna build iOS lanciata: queste modifiche non sono in nessuna build.

## Commit mergiati
- Backend: merge PR #149 `a00db1a` (ultimo commit feature `56e2525`).
- Frontend: vedi merge di questa PR (ultimo commit feature `ca3c1f1`→`Spese Trasferta`).
