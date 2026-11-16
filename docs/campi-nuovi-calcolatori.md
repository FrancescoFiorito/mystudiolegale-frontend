# Campi nuovi dei calcolatori (allineamento al sito di riferimento)

Data: 16/11/2026. Nessuna build iOS, nessun workflow, nessun `expo start`, nessun deploy, nessuna chiamata al backend di produzione; il backend non è stato modificato. Specifiche lette in sola lettura da `mystudiolegale-backend` (`docs/danno-non-patrimoniale.md`, `docs/differenze-lotto-parametri-compensi.md`, `docs/differenze-lotto-penale-vari.md`, commit `4c622e2`) e controllate contro i modelli di richiesta di `server.py`.

## PR e sha dei merge

| PR | Contenuto | Sha merge |
|---|---|---|
| #172 | Danno non Patrimoniale: 11 tabelle di Roma, danno morale | `7845384` |
| #173 | Compenso CTU, Delegati Vendite, Mediatore Familiare | `b5a92b9` |
| #174 | Parametri 2014 Civile, Parametri Stragiudiziali | `0a88dfe` |
| #175 | Preventivo Cause Civili | `d4e5c0f` |
| #176 | Fine Pena, Prescrizione Reati, Maggior Danno | `5e939ca` |
| #177 | Scorporo Importi, Valore Catastale, Imposte Compravendita, Tassa Registro Locazioni | `50ef5d3` |
| #179 | Ammortamento e TAEG (sostituisce la #178, chiusa senza merge: aveva un conflitto con la #177 e non ho usato il force-push) | `790b57e` |

Nessuna di queste modifiche è in una build iOS.

## Come ho provato

Per ogni calcolatore: funzioni dell'app eseguite con node (valori di partenza e 3-13 combinazioni delle opzioni nuove), corpo passato alla coroutine vera di `server.py` caricata in locale (`u=None`, Mongo non usato) e funzione `risultato` dell'app applicata alla risposta vera. Gli script stavano nello scratchpad, non nel repository. `tsc` 11 righe e lint 10 problemi (6 errori, 4 warning) dopo ogni PR (baseline).

| Calcolatore | Aggiunto | Corpo accettato dal backend locale |
|---|---|---|
| Danno non Patrimoniale | 11 tabelle Roma (2025…2009); Punto base I.T.T. fisso e non modificabile (omesso dal corpo, nota "(non personalizzabile)"); sezione "DANNO MORALE" (Perc. riconosciuta 33,33; Calcola danno morale) solo con Roma 2010/2009; Roma 2010 limitata a 50 punti; nota del massimo ora "€ 173,00". Le righe di oscillazione arrivano da `righe`. | Sì, 22 corpi (tutte le 18 tabelle + 4 combinazioni) |
| Compenso CTU | "Numero Periti" 1-9 (inviato sempre), righe pro-capite / +40% art. 53 / totale onorari e spese | Sì; esempio della specifica coincidente (2.005,22) |
| Delegati Vendite | "Ritenuta d'acconto" (spuntata, inviata sempre); senza ritenuta niente ritenuta/netto; riga "Compenso con limitazione" | Sì |
| Mediatore Familiare | "Cassa" + % modificabile (2/2/4 alla scelta della cassa), "Tipo regime", "Addebito bollo", righe nell'ordine del sito, note di regime | Sì |
| Parametri 2014 Civile | Tabelle 2022/2014-2018, competenza (29/27), scaglione (anche 130 con valore, indeterminabili), fasi min/med/max o importo libero, tutti gli aumenti e le riduzioni, spese, accessori ("Includi accessori" spunta IVA+CPA), righe del prospetto | Sì, 13 corpi; esempio della specifica coincidente (5.083,63) |
| Parametri Stragiudiziali | Tabelle, competenza, tabellare/percentuale, scaglione (140 con metodo secca/scaglioni), fasi, esito positivo, ulteriore valutazione, praticante, spese, accessori | Sì, 9 corpi; esempi coincidenti (5.252,83; 4.351,47) |
| Preventivo Cause Civili | Scelta "Valore della controversia" (12 scaglioni + 4 indeterminabili, filtrata per competenza), fasi per competenza con casella, % (-100/+100), importo libero | Sì, 4 corpi; esempio coincidente (1.011 e 622) |
| Fine Pena | "L. a. speciale" e "Integrazione" (spuntate, collegate alla L.A.), durata in anni/mesi/giorni nei periodi già scontati, righe come sul sito | Sì; esempio coincidente (525 gg, 16-04-2015) |
| Prescrizione Reati | Confronto ante 251/2005, data ultimo atto, pena "Sostitutiva", 3 aggravanti alternative, righe ANTE/EX con le due colonne | Sì; esempio coincidente |
| Maggior Danno | Tasso di riferimento, rendimenti (non con Istat), sviluppo; righe di descrizione | Sì; esempio coincidente (189,20) |
| Scorporo Importi | Iva per Cassa, Split Payment, Tipo regime, Addebito bollo, righe e diciture | Sì; esempio split coincidente |
| Valore Catastale | Data di riferimento, riga 10%, rendita rivalutata solo dal 1997; casella abitazione principale visibile solo per le categorie che ne beneficiano | Sì |
| Imposte Compravendita | Prezzo-Valore, calcolo da rendita (campo con tre etichette), aliquota registro, confronto 2013 | Sì; esempio coincidente (115.500 / 2.410 / 1.711) |
| Tassa Registro Locazioni | Durata in anni o mesi, tipo importo canone passato al backend, righe del sito | Sì; esempio 30 mesi coincidente (586,00) |
| Ammortamento / TAEG | Durata in anni o numero di rate (2-360); Ammortamento: singole rate, riepilogo annuale, durata e modalità | Sì; riepilogo annuale coincidente (51.577,45) |

## Scostamenti e scelte prudenti (da rivedere)

1. **Roma, "personalizzazione"**: il mandato la citava, ma per Roma il backend non ha personalizzazione né incremento (solo oscillazione di fascia, che arriva nelle righe). Non aggiunta.
2. **Danno morale, posizione**: la specifica non dice dove sta la sezione "DANNO MORALE" sul sito; l'ho messa tra invalidità temporanea e spese.
3. **Parametri Civili/Stragiudiziali, scaglione di partenza**: ora è un menu (di partenza il primo, "Fino a € 1.100") e non più il valore in euro; il valore serve solo per "Oltre € 32.000.000" (e, per le stragiudiziali, "Oltre € 520.000" e il compenso in percentuale). Le tabelle per fase sono copiate in `src/utils/tabelleParametri2014.ts` (solo per le scelte valide e per gli importi accanto alle fasi; il calcolo è sempre del backend).
4. **Spese generali (Parametri)**: la risposta non contiene la percentuale, quindi l'etichetta è "Spese generali (sul compenso totale)" senza "15%"; idem "Cassa Avvocati (4%)" è fisso. Stesso limite per Scorporo ("Cassa Avvocati", "IVA su imponibile" senza percentuali).
5. **Conciliazione / motivi aggiunti / ricorso incidentale / memoria 378**: se la competenza non ha la fase collegata (codici 40/20/20/40) l'app chiede "calcolato su €" prima di inviare (regola letta dal codice, non solo dalla specifica).
6. **Preventivo Cause Civili**: il vecchio campo in euro resta (scaglione vuoto = ricavato dall'importo) e senza fasi caricate restano i quattro campi fissi, così le parcelle salvate si aprono come prima. Le fasi si caricano col pulsante esistente (non in automatico a ogni cambio). Competenze: le 26 del preventivo (mancano 230, 335, 390, come dice la specifica).
7. **Maggior Danno**: tasso di partenza lasciato su Istat (comportamento attuale) invece del BOT 3/6/12 del sito; netti/annuale come il sito. Non mostro il dettaglio per riga.
8. **Imposte Compravendita**: "Prezzo-Valore" e "Calcola dalla rendita" spuntate di partenza come sul sito, quindi il campo importo di partenza è la rendita (l'etichetta lo dice). Con l'impresa entro 5 anni Prezzo-Valore sparisce.
9. **Valore Catastale**: la casella "Abitazione principale" (già spuntata di partenza dalla riga 49) dava 400 con le categorie che non ne beneficiano (B, D, E, T, A/10, C/1, C/3-5); ora si nasconde e non si invia per quelle.
10. **Tassa Registro**: per un contratto abitativo di 12 mesi il backend risponde `contratto_transitorio: true` ma `pagamento_effettivo: rateale` (la specifica dice unica soluzione forzata per i transitori); mostro quanto risponde il backend. Il campo durata accetta 1-102 come il sito.
11. **Fine Pena**: la nota del sito sulle due caselle non è mostrata (il motore non ha note sulle caselle). "Calcola fino al" non compare nella riga dei giorni.
12. **Ammortamento**: con "Singole rate" e "Riepilogo annuale" di partenza spuntati (come il sito) il risultato di un mutuo a 30 anni ha circa 400 righe; la riga di ogni rata è una stringa unica (rata · interessi · capitale · interessi residui · capitale residuo), non una tabella.
13. **TAEG**: la specifica lo dà "non toccato" nel backend, ma la nota finale dice che `numero_rate` è già accettato: ho fatto solo la parte frontend (durata in rate), come l'Ammortamento.
14. **Motore generico**: nuove proprietà facoltative `nonModificabile` (campo di sola lettura) e secondo argomento di `risultato(r, form)`; nuovi `testID` sono quelli del motore (`gen-<chiave>`), nuove etichette accessibili dove l'etichetta si ripete (fasi). I campi nuovi compaiono in "Dati inseriti" dell'esportazione come gli altri; l'esportazione PDF/Word non è stata cambiata.

## Calcolatori rimasti fuori

- **Prescrizione e decadenza** e **Interessi 1284 cc**: il backend non li ha toccati (documento: "non toccati"), quindi niente da portare.
- Righe 32 (Prescrizione e decadenza, 7 voci mancanti) e 58 (Interessi 1284): restano aperte.
- Non toccati, come da mandato: i quattro campi che l'app ha e il sito no (Scorporo "Percentuale cassa previdenziale", Giorni Lavorativi "Chiusura estiva", Eredità "Quota di legittima", Prescrizione e decadenza "Data ultimo atto interruttivo") e i valori di partenza delle "Osservazioni fuori tabella".

## Cosa non è stato possibile provare senza dispositivo

- Nessuna schermata è stata aperta: layout dei campi nuovi (nota accanto al punto base, elenco fasi del preventivo, lista fasi dei Parametri), VoiceOver, lunghezza del risultato dell'Ammortamento, pulsanti PDF/Word con i nuovi campi.
- Il Preventivo: salvataggio, modifica e PDF di una parcella con `fasi_preventivo` provati solo sul calcolo (`/calc/parcella`), non su `POST/PUT /parcelle` né sul PDF.
- Il backend è stato eseguito come funzione (coroutine con `u=None`), non via HTTP: validazione delle richieste ed errori 422 non provati.
- Non ho confrontato i risultati con il sito di riferimento (non consultato): i confronti sono con gli esempi delle specifiche.

---

# Aggiornamento del 16/11/2026: i calcolatori rimasti fuori

Specifiche lette in sola lettura da `mystudiolegale-backend` (`docs/differenze-lotto-penale-vari.md` aggiornato, commit `c041428`) e controllate contro i modelli di richiesta di `server.py`; dove specifica e codice non coincidono vale il codice. Nessuna build iOS, workflow, `expo start`, deploy, nessuna chiamata alla produzione; il backend non è stato modificato; il sito di riferimento non è stato consultato (la specifica bastava anche per il Maggior Danno). Questo aggiornamento sostituisce la sezione "Calcolatori rimasti fuori" qui sopra.

## PR e sha dei merge

| PR | Contenuto | Sha merge |
|---|---|---|
| #181 | Prescrizione e decadenza | `713562a` |
| #182 | Interessi 1284 cc | `d547bd5` |
| #183 | Calcolo TAEG | `62a8601` |
| #184 | Maggior Danno | `01d32a1` |
| #185 | Etichette trovate dall'audit (Imposte, Tassa Registro, Scorporo, Maggior Danno) | `327cea6` |

Nessuna di queste modifiche è in una build iOS.

## Cosa è stato aggiunto e come l'ho provato

Per ogni calcolatore: funzione che costruisce il corpo eseguita con node (estratta dal file dell'app), corpo passato alla coroutine vera di `server.py` caricata in locale (`u=None`, Mongo non usato), funzione `risultato` dell'app applicata alla risposta vera. Gli script stavano nello scratchpad, non nel repository. `tsc` 11 righe e lint 10 problemi (6 errori, 4 warning) dopo ogni PR (baseline), con `.expo/types` assente.

| Calcolatore | Aggiunto | Prova |
|---|---|---|
| Prescrizione e decadenza | Il menu "Tipo di termine" (43 voci sintetiche) è sostituito da "Diritto" con le 49 voci del sito (a0-a39, b0-b8, etichette e ordine del codice; di partenza "Scegli..." con avviso se non scelto); "Data Riferimento" (oggi di partenza); corpo con `diritto`; righe nuove: note di proroga, frase del risultato, "Norma di Riferimento" (non mostrata se assente). "Data ultimo atto interruttivo" non toccato. | 49 voci senza errori, 6 casi mirati (a0 Natale, bollette a due regimi, bollo auto a fine anno, domenica, Immacolata, atto interruttivo); esempio della specifica coincidente (28 Dicembre 2026, Art. 2948 c.c.) |
| Interessi 1284 cc | Etichette del sito (Importo credito, Decorrenza credito, Domanda giudiziale, Calcola interessi al, Tasso fisso con "Interessi %", Rivaluta annualmente, Rivaluta al %); con "Tasso fisso" spuntato si invia sempre `tasso_fisso_da_decorrenza: true`; nota sulla domanda giudiziale con tasso fisso; risultato con una riga per periodo (dal → al, giorni, tasso, credito), sezione moratori, totale giorni, totali legali/moratori (o "Totale interessi" col tasso fisso), rivalutazione, "Credito (rivalutato) + interessi", "Rivalutazione + interessi". | 6 corpi (tasso fisso, legale+moratori con e senza rivalutazione, al 75%, domanda anteriore al 2014, tasso decimale); esempio della specifica coincidente (604,80 / 607,06 / 609,60 / 648,60 / 289,08; 2.759,14; 1.130,00; 13.889,14) |
| Calcolo TAEG | Etichette "Spese Incasso Rata", "Spese Assicurative", "Spese di Gestione Annuali" con le note del sito (assicurazione = importo mensile riportato a rata; gestione addebitata a fine anno); righe del risultato nell'ordine del sito, comprese le tre nuove (rata con spese ricorrenti, spese ricorrenti complessive, totale con spese ricorrenti) e "Interessi totali calcolati all'X%". | 4 corpi (mensile, semestrale, trimestrale con durata in rate, senza spese); esempio della specifica coincidente (269,37 / 272,37 / 480,00 / 32.804,94 / 1,99%) |
| Calcolo Ammortamento | Nessuna modifica: la specifica aggiornata non ha campi nuovi della richiesta e la risposta (interessi residui, riepilogo annuale, durata, modalità) era già mostrata dalla PR #179. Riletto il codice dell'app contro la specifica: copre tutto. | 6 corpi (francese/italiano, con e senza singole rate e riepilogo, durata in anni e in rate); riepilogo annuale coincidente (51.577,45 / 2.326,46 / 49.250,99 / 828,45 / 50.749,01), interessi residui della 1ª rata 2.904,91 |
| Maggior Danno | Valore di partenza del tasso di riferimento: BOT 3/6/12 (netti, annuale) come il sito, al posto di Istat; dettaglio per riga come il sito (tasso legale, tasso di riferimento o "-", interessi legali, maggior danno o "-", più "Totale giorni"); i tassi sono arrotondati a 4 decimali nella riga. | 5 corpi (tutti i tassi, netti/lordi, annuale/mensile); esempio della specifica coincidente (64,62 / 35,34 / 89,24; 189,20; totale 10.320,20) |

## Audit dei campi (punto 4)

Confrontati con la "Specifica per il frontend" aggiornata: Fine Pena, Prescrizione Reati, Maggior Danno, Scorporo, Valore Catastale, Imposte Compravendita, Tassa Registro, Ammortamento, TAEG, Prescrizione e decadenza, Interessi 1284. **Nessun campo della richiesta mancava** (tutti i campi elencati hanno il loro campo nell'app, anche quelli del lotto già portato dalla sessione precedente). Buchi trovati e chiusi (solo etichette, PR #185):

- Imposte Compravendita: le voci del Venditore avevano una virgola e un "dal" in più rispetto al sito ("Impresa costruttrice entro/oltre 5 anni fine lavori").
- Tassa Registro: il campo era "Importo del canone €" preceduto da una scelta con voci diverse; ora "Importo Canone €" seguito dalla scelta annuale / mensile / intera durata (la scelta ha un'etichetta propria, "Importo canone riferito a", per VoiceOver).
- Scorporo: "Tipo Regime" (maiuscola come sul sito).
- Maggior Danno: tolti i due punti dalle etichette aggiunte in #184 (l'app non li usa mai; la specifica li riporta ma resto coerente con il resto dell'app).

## Scostamenti e scelte prudenti (da rivedere)

1. **Prescrizione e decadenza, gruppi del menu**: il motore delle scelte non ha intestazioni di gruppo, quindi le 49 voci sono in un solo elenco nell'ordine del sito (prima le "persone fisiche e/o giuridiche" con "Prescrizione ordinaria" in fondo, poi "enti e pubblica amministrazione"), senza le due intestazioni. Le voci sintetiche non sono più raggiungibili dall'app (il backend le accetta ancora). Le righe di risultato "Proroga" e "Risultato" hanno etichette scelte da me.
2. **Prescrizione e decadenza, "Data Riferimento"**: sul sito è la data di riferimento del calcolo; qui resta il campo `data_decorrenza` (è quello che il backend usa come decorrenza) con l'etichetta del sito.
3. **Interessi 1284, tasso decimale**: il sito accetta solo interi per "Interessi %" e "Rivaluta al"; l'app accetta anche decimali (il backend li accetta) per non bloccare input validi.
4. **Interessi 1284, sezioni legali/moratori**: la risposta non le distingue; le ricavo nell'app dalla data della domanda (righe con `al` ≤ domanda = legali). Il rigo con la frase del sito sui moratori ha il valore vuoto.
5. **Interessi 1284, "Tasso fisso"**: l'app non ha un campo "tasso" a sé (il vecchio "Tasso di mora convenzionale %") ma casella + "Interessi %", come il sito; il vecchio comportamento (tasso fisso solo dalla domanda) non è più raggiungibile dall'app, resta nel backend.
6. **TAEG, righe sulle spese ricorrenti**: mostrate sempre, anche con spese a zero (la specifica non dice se il sito le nasconde); le altre etichette dei campi non sono state cambiate perché la specifica non ne dà il testo esatto.
7. **Maggior Danno, dettaglio**: con "Sviluppo mensile" su 1980-2026 le righe sono ~560; l'etichetta di riga è una stringa unica, non una tabella.
8. **Un'avvertenza di processo**: il primo ramo (Prescrizione) è partito da un `origin/main` locale non aggiornato (non avevo fatto il `fetch`); l'unione su GitHub è avvenuta senza conflitti e ho rieseguito `tsc`, lint e le prove sul `main` risultante (stessi risultati). Gli altri rami partono da un `fetch` fatto prima.

## Cosa non è stato possibile provare senza dispositivo

Come nella sezione precedente: nessuna schermata aperta (layout delle note sui campi, lunghezza dei risultati di Interessi, Ammortamento e Maggior Danno mensile, VoiceOver, pulsanti PDF/Word con i campi nuovi); backend eseguito come funzione e non via HTTP (errori 422 non provati); confronto col sito solo tramite gli esempi delle specifiche.

## Cosa resta fuori

- I quattro campi che l'app ha e il sito no e i valori di partenza delle "Osservazioni fuori tabella": non toccati, come da mandato.
- Residui dichiarati dal backend (Fine Pena 1-2 giorni, Scorporo 1 centesimo in ~4% dei casi, TAEG 1 centesimo con tassi molto alti, Interessi 1 caso su 80 con rivalutazione 2010): sono del motore, non dell'app.
- Ammortamento: il menu del sito sembra limitare il numero di rate (letti fino a 72 mensili); l'app accetta 2-360 come prima.
