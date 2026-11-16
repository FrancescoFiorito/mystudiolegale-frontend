# Danno non Patrimoniale e differenze "Solo frontend"

Data: 16/11/2026. Nessuna build iOS, nessun deploy, nessuna chiamata al backend. Il backend non è stato toccato.

## PR e sha dei merge

| PR | Contenuto | Sha merge |
|---|---|---|
| #169 | Calcolatore Danno non Patrimoniale | `693f60a` |
| #170 | Differenze "Solo frontend" (righe A, C, D, E) | `b99deab` |

Nessuna delle due modifiche è in una build iOS.

## Lavoro 1 — Danno non Patrimoniale

- La voce del menù non è più "in arrivo": apre il calcolatore `danno-non-patrimoniale`, dichiarato in `CONFIG_GENERICI` (`POST /calc/danno-non-patrimoniale`), con i pulsanti PDF/Word del motore generico.
- Le funzioni sono in `src/utils/dannoNonPatrimoniale.ts` (pure, senza React Native): campi nell'ordine e con le etichette indicate, tabelle (solo Milano 2024, 2021, 2018, 2014, 2013, 2011, 2009; Roma e generica non proposte), minimi e massimi del punto base I.T.T., validazione, corpo della richiesta, lettura di `righe`.
- Motore generico, tre aggiunte piccole e valide per tutti i calcolatori: `alCambio` (chiamata dopo la modifica di una scelta o casella: qui riporta il punto base al minimo della tabella), la nota accanto ai campi numerici ("(valore massimo: € X)") e la nota sotto i campi di testo, un'etichetta accessibile distinta (`etichettaAcc`) per i campi con etichetta ripetuta (le tre righe "Giorni invalidità parziale" / "Inabilità %" diventano "… (riga 1)" per VoiceOver e nell'esportazione). Tutti i campi hanno `testID` `gen-<chiave>` e proprietà di accessibilità.
- Scelte prudenti: l'incremento per sofferenza viene inviato solo con le tabelle 2024 e 2021 (con le altre non è visibile, quindi si omette). Una percentuale di inabilità lasciata vuota usa quella di partenza. Il controllo del punto base contro minimo e massimo è fatto anche nell'app (il backend darebbe comunque 400). Se una riga della risposta ha `valore` vuoto ma un `importo` numerico, mostro l'importo in euro; altrimenti `righe` è mostrata senza modifiche. Gli errori 400 mostrano il `detail` (già gestito da `api.ts`).
- Prove con node (fuori dall'app, script non lasciato nel repository): `defaultGenForm` reale estratto da `calcolatori.tsx` applicato ai campi; valori di partenza; form dell'esempio (34 punti, 40 anni, 10 giorni) → corpo `{"tabella":"1-2024","punti":34,"eta":40,"punto_base_itt":115,"giorni_itt":10,"incremento_sofferenza":true,...}`; per ognuna delle 7 tabelle: punto base reimpostato al minimo, nota con il massimo, casella visibile solo per 2024 e 2021; limiti (punti, età, giorni, percentuale, punto base); spese in notazione italiana; la risposta di esempio dell'incarico → 6 righe invariate e nell'ordine. Tutto superato. `tsc`: 11 righe, lint: 10 problemi (baseline).

## Lavoro 2 — righe "Solo frontend"

Valori letti dal sito il 16/11/2026, una lettura per pagina (Chromium headless), senza inviare moduli; per le sezioni nascoste ho solo cambiato scelte e atteso la comparsa dei campi.

| N. | Calcolatore | Cosa è cambiato | Valore letto dal sito |
|---:|---|---|---|
| 27 | Calcolo Età Anagrafica | Nuovo campo "Codice Fiscale" (facoltativo) sotto la data di nascita: se compilato la data viene letta da lì (con nota che mostra la data letta); codice non valido → avviso. | Il sito ha il campo `CodiceFiscale` accanto alla data di nascita. |
| 33 | Termini Procedimento Semplificato | Sospensione feriale spuntata di partenza | `SospensioneFeriale` spuntata |
| 34 | Termini Deposito CTU | idem | spuntata |
| 35 | Termini Deposito Atti Appello | idem | spuntata |
| 36 | Termini Separazione e Divorzio | idem | spuntata |
| 37 | Termini Esecuzioni | idem (`Sospensione`) | spuntata |
| 38 | Parametri 2012 Civile | Spese generali non spuntate di partenza (15% resta pronto) | `DoSpeseGen` non spuntata, `PctSpeseGen` 15 |
| 39 | Parametri 2012 Penale | idem | non spuntata, 15 |
| 40 | Calcolo Fine Pena | Liberazione anticipata spuntata | `LiberazioneAnticipata` spuntata |
| 41 | Calcolo Spese di Mediazione | Mediazione obbligatoria: Sì | `MedObb` = Si |
| 42 | Calcolo Spese di Mediazione | Numero incontri: più di uno | `Incontri` = "Più di uno" |
| 43 | Calcolo Spese di Mediazione | Accordo raggiunto: Sì | `Accordo` = Si |
| 44 | Danno Biologico (lieve entità) | Personalizzazione danno morale 33,33 | `PctDM` = 33,33; è lo stesso campo ("Perc. riconosciuta" nella sezione Danno morale) |
| 45 | Danno Parentale Milano | Convivenza spuntata | `Convivenza` spuntata |
| 46 | Danno Parentale Milano | Altri familiari: 2 | `AltriFamiliari` = 2 |
| 47 | Danno Parentale Roma | Convivenza spuntata | spuntata |
| 48 | Calcolo Eredità | Coniuge spuntato | `Coniuge` spuntato |
| 49 | Calcolo Valore Catastale | Abitazione principale spuntata | `AbitazionePrincipale` spuntata |
| 50 | Calcolo Compenso CTU | Tariffa predefinita: Massima (anche nel ripristino del form) | `DefaultTar` = Massima |
| 55 | Danno Parentale Milano | Voce "Coniuge non separato" (il valore inviato non cambia) | "Coniuge non separato" |
| 56 | Imposte Compravendita | "Prima casa e/o pertinenze", "Abitazione secondaria e/o pertinenze", "Abitazione di lusso (cat. A/1, A/8, A/9)" (valori inviati invariati) | le stesse tre diciture |
| 57 | Pignoramento stipendio o pensione | Etichetta "Liquidità su CC €" | dal censimento; il campo è visibile solo con "Accredito su CC: Sì". Scelta prudente: ho preso la dicitura del sito; la chiave inviata non è cambiata. Se il dato che serve al calcolo è davvero la giacenza media, va deciso dall'utente. |

### Righe chiuse senza modifica

- **29 (Delegati Vendite, limite della riduzione):** nessun cambiamento. Il sito nel menù accetta 1-60 sia per l'aumento sia per la riduzione, ma il testo della sua stessa pagina dice "aumentato fino al 60% o ridotto fino al 25% (DM 104/2021)": l'app è già coerente con il testo. Non c'è controllo del limite nell'app (lo fa il backend, non mio).
- **31 (Compenso CTU, art. 12 diviso in 12.1 e 12.2): da confermare.** Il sito ha "Art.12" unico. Nel codice la divisione segue la tabella verificata nel backend (`ARTICOLI_DM182_2002`, commento sopra `ARTICOLI_DM182`): unire le voci cambierebbe anche il contratto con il backend. Non cambiato.

### Righe D "scelta voluta e dichiarata nei commenti"

Nessuna delle righe D lavorate aveva un commento che dichiarasse il valore di partenza diverso come voluto: le ho cambiate tutte. **Da confermare: nessuna** per la categoria D (restano da confermare solo la 31 e la riga 57 più sopra).

### Righe B (non toccate, le decide l'utente)

- **51 Scorporo Importi:** "Percentuale cassa previdenziale", già scritta a 4%. Serve a scorporare anche il contributo della cassa degli avvocati (4%) dall'importo lordo; il sito non lo chiede e il totale cambia anche senza toccarla.
- **52 Giorni Lavorativi e Festivi:** "Chiusura estiva (1-31 agosto)". Serve a escludere agosto dal conteggio per gli studi o gli uffici chiusi in estate.
- **53 Calcolo Eredità:** scelta "Modalità" con anche "Quota di legittima (con testamento)". Serve a calcolare le quote riservate ai legittimari quando c'è un testamento; il sito ha solo la successione senza testamento.
- **54 Prescrizione e decadenza:** "Data ultimo atto interruttivo". Serve a far ripartire il termine di prescrizione dall'ultimo atto che lo ha interrotto (diffida, domanda giudiziale).

### "Da provare sul sito" (solo frontend)

- **Preventivo Attività Stragiudiziali, "Ufficio giudiziario":** il campo resta nascosto con tutte e due le competenze ("Assistenza stragiudiziale", "Mediazione e Negoziazione assistita"), e il suo elenco non ha voci. Non serve: nessuna modifica.
- **Calcolo Compenso CTU, "Giorni lavorativi" e "Max vacazioni":** sono disattivati sul sito (calcolati). Non modificabili: nessuna modifica.
- **Calcolo Compenso a Ore:** il sito è una calcolatrice con un solo ingresso ore/minuti e i tasti "+", "−", annulla e azzera su un totale progressivo; non aggiunge altre righe. Le quattro righe con segno dell'app fanno lo stesso lavoro: nessuna modifica.
- **Calcolo Spese di Mediazione, "spese ulteriori":** compare appena si sceglie lo scaglione (tre voci minimo/medio/massimo, di partenza medio, cursore e importo calcolato). Il calcolo dell'importo richiede dati dal backend: **non è solo frontend**, non l'ho fatto.

### Osservazioni fuori tabella (non toccate)

- Mediazione: sul sito "IVA" è spuntata di partenza (22), nell'app no.
- Termini Procedimento Semplificato, Deposito Atti Appello e Separazione e Divorzio: la sospensione straordinaria Covid è spuntata sul sito e non nell'app (riguarda solo date del 2020).
- Termini Esecuzioni: tipo di pignoramento di partenza "Mobiliare" sul sito, "Immobiliare" nell'app.

## Cosa non ho potuto provare

- Senza backend: il Danno non Patrimoniale non è stato chiamato davvero (backend non ancora in produzione): provate solo le funzioni con node e la risposta di esempio. Non so se `punto_base_itt` con due decimali e `incremento_sofferenza` omesso per le tabelle vecchie sono accettati dal contratto reale.
- Senza dispositivo: nessuna schermata è stata aperta (layout della nota accanto al punto base, VoiceOver, pulsanti PDF/Word sul nuovo calcolatore). Verificati solo tipi e lint.
- Codice fiscale: il secolo dell'anno a due cifre è dedotto (si sceglie la data più recente non nel futuro); il sito non è stato interrogato con un modulo per verificarne il comportamento. La data letta è mostrata sotto il campo per il controllo.
- Valori di partenza D: letti dalla struttura della pagina, non da un calcolo con risultato.
