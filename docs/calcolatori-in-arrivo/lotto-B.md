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
| Calcolo Notula Penale | **resta "in arrivo"**, endpoint non collegato | — |
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
- **Notula Penale / Nota Spese**: il sito è un costruttore di notula a più passi con stato di sessione (Imposta le attività → Calcola Notula), con regime semplificato (forfettario/vantaggio/minimi), bollo, anticipi, riparametrazione (ricalcolo min/med/max, ±%, forzatura totale). L'endpoint esistente `/calc/notula-penale-tariffario-2004` non copre queste funzioni e non l'ho ricontrollato: resta non esposto.

## Esempi (campi del form del sito → output letto)
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
