# Documenti: Preventivo Stragiudiziale e Ricevuta Occasionale

Stato: frontend. Nessuna modifica al backend, nessun deploy necessario (vedi "Deroga"). Nessuna build iOS, nessun `expo start`, nessuna chiamata alla produzione, nessun connettore Render.

Pagine del sito di riferimento (https://www.avvocatoandreani.it/servizi/):
- `preventivo-avvocato-stragiudiziale.php` — "Preventivo Stragiudiziale e Mediazione"
- `calcolo-ricevuta-prestazione-occasionale.php` — "Ricevuta per prestazione occasionale"

## Deroga al punto 5 del mandato (da annotare)
Il mandato chiedeva di generare il testo dove nasce la parte numerica (backend, estendendo la risposta dell'endpoint). L'aggancio del repository backend è stato negato dal sistema dei permessi, e la sessione di coordinamento ha poi indicato di generare i documenti **lato frontend**: modulo `src/documenti/`, a partire dai numeri già presenti nella risposta degli endpoint e dai campi nuovi, che restano solo nel frontend e **non vengono inviati al backend** (`buildBody` invariato). Conseguenza: **nessun deploy del backend è necessario** perché il frontend funzioni.

## Cosa produce il sito
Dopo "Crea Preventivo" / "Calcola" il sito mostra il documento (testo a video, uguale all'anteprima di stampa e al "Copia" del preventivo; la Ricevuta ha Anteprima/Stampa/PDF/Word).

**Preventivo** (blocco "Copia"): titolo "Preventivo ex artt. 13, comma 5, L. n. 247/2012 e 27 Codice deontologico forense."; "Da valere ad ogni effetto di legge tra:" + parti assistite + "e" + avvocato; "relativamente al seguente incarico:" descrizione + "contro" + controparte; "Valore dell'affare" (o "della controversia" in mediazione); 1) Determinazione del compenso (1.1 Compenso, 1.2 Spese ipotizzabili se presenti, 1.x Accessori di legge); "TOTALE PREVENTIVO" con importo in lettere; nota sugli accessori se non applicati; 2) Clausola di garanzia; "Luogo, li data"; firme. Il testo si adatta al numero e al genere delle parti (Cliente/Clienti, denominato/a/i/e, articoli), a persona fisica o giuridica, ai titoli (Sig., Dott., Ing., Avv. …).

**Ricevuta**: intestazione prestatore + C.F., committente + C.F./P. IVA, "Ricevuta [n° N] del data.", "Oggetto: …", tabella compensi / spese forfettarie / spese documentate / bollo / RITENUTE / Netto a pagare, dichiarazioni INPS (4 varianti) e IVA, "Luogo, li data" oppure "Data:", "Firma:", Pagamento, IBAN, nota sulla ritenuta d'acconto.

## Cosa è stato fatto
- `src/documenti/preventivoStragiudiziale.ts`, `ricevutaOccasionale.ts` (testi), `nomi.ts` (maiuscole, titoli e articoli, genere), `numeroInLettere.ts` (importo in lettere), `formati.ts` (euro, date, validazione CF/P.IVA), `ordiniAvvocati.ts` (elenco dei 140 ordini del sito).
- `app/(app)/calcolatori.tsx`: nuova proprietà opzionale `documento` nella configurazione del motore generico; campi `testo` con `multiline`; blocco "Documento" sotto il risultato. Solo i due calcolatori hanno `documento`: gli altri non cambiano.
- `src/components/ListaInput.tsx`: proprietà opzionale `mostraSe(riga)` per i campi di riga (serve a "Rappres. Legale", visibile solo se "Pers. giuridica" = Sì). Additiva: nessun altro calcolatore la usa.
- Il documento usa una **copia del form al momento del calcolo**: modificare i campi dopo "Calcola" non lo fa divergere dai numeri mostrati.

### Campi aggiunti (etichette del sito)
Preventivo: Avvocato (Nome e Cognome, Indirizzo studio, Codice fiscale, Ordine avvocati [ricercabile], Assicurazione); Parti assistite (Nomin. / Rag. Soc, Pers. giuridica, Rappres. Legale, CF / P.IVA; pulsante "Nuova parte assistita"); Dati dell'attività (Breve descrizione, Controparte); Descrizione della fase (facoltativa, solo assistenza: sul sito la descrizione è modificabile solo lì, in mediazione è di sola lettura); Luogo; Data.
Ricevuta: I miei dati anagrafici (multiriga), Codice fiscale, Dati anagrafici del committente (multiriga), Cod. Fis. / P.IVA, Numero ricevuta, Oggetto, Luogo, Pagamento, IBAN.

**Lasciati fuori** (riservati agli utenti registrati del sito o non pertinenti): "Intestazione studio" / "Intestazioni personalizzate" (header e footer, logo), "Ricorda i dati", aggiunta di più avvocati, "MODIFICA il TESTO", "CREA PROCURA alle LITI", Stampa/PDF/Word, il titolo a video "Preventivo del …" (non fa parte del testo copiato).

## Come appare (soluzione provvisoria da confermare)
Il motore generico non aveva area di testo né Copia/Condividi. Scelta più semplice e coerente: sotto il riquadro dei risultati compare la sezione "Documento": un riquadro con bordo e sfondo chiaro che contiene il testo selezionabile (corpo 12), sotto due pulsanti affiancati dello stile di "Calcola" — **Copia** (`expo-clipboard`, già presente; l'etichetta diventa "Copiato ✓" per 2 secondi) e **Condividi** (foglio di condivisione di React Native, `Share`; nessuna libreria nuova). Le tabelle del sito sono rese con righe "descrizione ⇥ importo". Tutti i nuovi elementi hanno `accessibilityRole`/`accessibilityLabel` e `testID` (`gen-doc-testo`, `gen-doc-copia`, `gen-doc-condividi`, `gen-doc-avviso`, `gen-<campo>`; le righe delle parti `gen-parti-<n>-<campo>`).
Altre scelte provvisorie:
- **Il calcolo numerico non richiede i nuovi campi** (nessuna regressione per chi usa solo i numeri). Se mancano dati obbligatori del sito (o un CF/P.IVA non è corretto: il sito li valida) al posto del testo compare "Per generare il documento compila: …".
- Posizione dei campi: sezioni "Avvocato / Parti assistite / Dati dell'attività" in cima al Preventivo, "Dati anagrafici e fiscali / Dati documento" in cima alla Ricevuta, Luogo e Data in fondo al Preventivo, nell'ordine del sito.
- "Pers. giuridica" è una tendina No/Sì (il componente delle righe di lista non ha una casella).
- Non c'è un limite al numero di parti.

## Verifica
Metodo: Chromium headless (Playwright), un contesto nuovo per ogni caso, click veri su checkbox e radio con rilettura dello stato, richieste in serie con pausa di 1 secondo. Per ogni caso: testo del documento del sito (innerText del blocco documento, spazi normalizzati) confrontato carattere per carattere con l'output del modulo compilato ed eseguito con node fuori dall'app. I numeri in ingresso al modulo (la "risposta dell'endpoint") sono stati ricavati dal sito stesso (stato del form e importi del documento), perché il backend non era raggiungibile e la produzione era vietata: **si verificano quindi layout, frasi, formati, genere/numero, articoli, maiuscole, importi in lettere e dichiarazioni, non il calcolo degli importi** (già coperto dai lotti B e C).
- **Preventivo**: ~91 invii (≤100). 86 documenti letti dal sito e coincidenti (85 testi distinti, 0 differenze nell'ultima passata): 61 per ricavare le regole, poi due serie di verifica con combinazioni casuali (12 + 13 documenti) che hanno fatto emergere 6 scarti, tutti corretti (articolo dell'avvocato indipendente dal genere, "Avv." non aggiunto se c'è già un titolo, genere delle persone giuridiche con CF di 16 caratteri, maiuscola iniziale delle descrizioni di compensi, fasi e spese, riga "Totale accessori" solo con più voci, ecc.). Coperte: assistenza e mediazione, tabellare e percentuale, tutti i tipi di scaglione, variazioni e importi liberi per fase, fasi deselezionate, compensi e spese (solo esente / solo non esente / entrambi), accessori attivi, parziali e assenti, percentuale spese generali decimale, 1–5 parti, uomini, donne, misti, persone giuridiche, titoli, avvocato con e senza ordine/CF, importi in lettere fino a 2.188.381,28 (18 importi).
  Dopo le correzioni della serie di verifica il modulo è stato ricontrollato contro gli stessi testi già letti, non su casi nuovi: per non superare 100 invii non è stata fatta una terza serie.
- **Ricevuta**: ~78 invii. 73 documenti coincidenti (73 testi distinti, 0 differenze nell'ultima passata): 42 per le regole (compresa la condizione di "Totale documento"), poi 16 casuali (hanno fatto emergere 3 scarti, corretti: anno della dichiarazione senza altri compensi, minuscola iniziale di "Pagamento", maiuscola iniziale delle spese) e **15 casuali fresche (S01–S15) coincidenti al primo colpo**. Coperte: 1–4 compensi, descrizione vuota, spese forfettarie in % e in importo, spese documentate, bollo, ritenuta d'acconto con % decimale, ritenuta INPS, le 4 dichiarazioni INPS (nessun altro compenso, ≤ 5.000 compreso 5.000,00, > 5.000, ≥ massimale), anni 2025/2026/2027 e il confine del 12 gennaio, numero/oggetto/luogo/pagamento/IBAN, committente con CF o P.IVA.
- `npx tsc --noEmit -p .`: 11 righe, uguale al baseline. `npx expo lint`: 10 problemi (6 errori, 4 warning), uguale al baseline. `eslint.config.js` locale cancellato; `.expo/types` assente.

## Regole ricavate (non banali)
- **Nomi**: la parte prima della prima virgola o del primo "-" è in maiuscole (iniziale dopo spazio, punto, apostrofo; `'` → `’`: "d'angelo" → "D’Angelo", "Prof.ssa" → "Prof.Ssa"); "Sig.ra", "Sig.na", "Dr.ssa", "Dott.ssa" restano con il suffisso minuscolo; il resto è lasciato com'è ("Rossi-bianchi", ", nato a Roma …"). Nella firma c'è solo la parte iniziale.
- **Articolo** davanti ai titoli: Sig., Dr., Dott., Dottor, Geom., Rag., Notaio → il/la (femminile se la parola termina in -ra, -na, -ssa); Ing., Arch., Avv., Avvocato → l’. Parole senza articolo: Prof., Signor, ecc. Persone giuridiche: Condominio → il, Consorzio → il, Studio → lo, Associazione → l’, Ditta/Soc./Società/Cooperativa → la; per le altre (Comune, Fondazione, Banca, Impresa, …) nessun articolo.
- **Genere**: CF di 16 caratteri → giorno di nascita > 40 = femminile (anche per le persone giuridiche); con P.IVA, le persone giuridiche sono femminili salvo Condominio/Consorzio/Studio. Gruppo misto → maschile. Il tipo di numero/genere cambia "denominato/a/i/e", "e il/la/ed i/e le Cliente/i prende/prendono atto" e la clausola di garanzia.
- **Persona giuridica**: "(P.IVA: …)" con 11 cifre, "(CF: …)" con 16; ", in persona del suo legale rappresentante pro tempore <rappresentante>"; firma "Firma legale rappresentante <nome>".
- **Avvocato**: "l’Avv. <nome>" se il nome non inizia già con un titolo (altrimenti articolo del titolo, es. "il Dott."); "del foro di <ordine>", "(CF: …)", ", con studio in …, polizza assicurativa: …". Articolo sempre maschile.
- **Totale in lettere**: parole unite, senza accenti né elisione dopo "cento" (ventitre, centoottanta, ventunomila, unmilione, duemilioni), centesimi a due cifre.
- **Preventivo**: totali di riga ("Totale compenso", "Totale spese", "Totale accessori") solo con più di una riga; importi a zero come "-"; accessori guidati dalle caselle (non dai valori); nessuna casella accessori attiva = nota di non applicazione (con 15%, 4%, 22% fissi nel testo).
- **Ricevuta**: intestazione tabella "Compensi / Importo", "Dettaglio compensi / Importo" (più compensi senza spese forfettarie), "Compensi" senza colonna Importo (con spese forfettarie); "Totale documento" solo con ritenute (d'acconto o INPS) **e** (spese documentate o bollo); aliquota INPS con due decimali; anno della dichiarazione senza altri compensi = anno della data, con altri compensi = anno precedente fino al 12 gennaio; massimale 119.650 (2025) / 122.295 (2026-27), "aver superato il massimale" se altri compensi ≥ massimale; Oggetto con iniziale maiuscola e punto finale, Pagamento con iniziale minuscola e punto finale, Luogo e IBAN come digitati.

## Differenze residue e punti non verificati
Nessuna differenza nei casi letti dal sito (esempi sotto). Non coperto dai casi:
- **Titoli e parole non osservati**: oltre a quelli elencati, ogni altro titolo (Comm., Cav., Rev., …) o forma sociale (Ente, Istituto, …) è trattato "senza articolo" e, per le persone giuridiche, femminile. Ente e Istituto: il sito non ha permesso di capire se siano maschili.
- Caratteri: il sito rifiuta alcuni caratteri nei nomi (es. "&": "Valore non ammesso"); non replicato. Oltre a "," e "-" non è verificato che altri segni chiudano la parte in maiuscole. Il sito sembra limitare a 5 le parti; non replicato.
- Il sito rifiuta le righe di compenso con solo descrizione o solo importo; l'app, come prima, è più permissiva.
- Persona fisica con P.IVA al posto del CF: genere dal titolo; non confrontato.
- Preventivo, percentuale di compenso con valore tabellare: "Valore dell'affare" mostra il valore inserito con due decimali (verificato), la modalità percentuale non esiste in mediazione.
- **Assunzioni sulla risposta degli endpoint** (non ho potuto chiamarli): il documento usa gli stessi campi che `risultato()` già legge (Preventivo: `fasi[].{nome,attiva,importo}`, `compensi_aggiuntivi`, `spese[].{descrizione,esente,non_esente}`, `compenso_totale`, `spese_generali`, `cassa`, `iva`, `totale_accessori`, `totale`; Ricevuta: `compensi`, `totale_compensi`, `spese_forfettarie`, `pct_spese_forfettarie`, `totale_imponibile`, `spese_documentate`, `totale_spese`, `bollo`, `totale_documento`, `ritenuta_acconto`, `pct_ritenuta`, `imponibile_inps`, `aliquota_inps`, `contributo_inps`, `ritenuta_inps`, `netto_a_pagare`). Due punti da confermare sul backend vero: (1) con spese forfettarie sia in % sia in importo il sito scrive "Spese forfettarie (10%)" con l'importo fisso: serve `pct_spese_forfettarie` valorizzato anche in quel caso; (2) `imponibile_inps` e `ritenuta_acconto` devono essere `null` quando la riga non va mostrata (come già richiede il risultato a video).
- L'interfaccia non è stata provata su dispositivo o simulatore (vietato `expo start`): verificati tipi, lint e il testo generato; non il rendering.

## Esempi completi (sito = nostro)
**Preventivo** (mediazione, 4 parti miste, nessun accessorio; caso K09):
```
Preventivo ex artt. 13, comma 5, L. n. 247/2012 e 27 Codice deontologico forense.
Da valere ad ogni effetto di legge tra:
il Dott. Luca Rossi (CF: DELGIO99S05H501Z), Gamma S.P.A. (P.IVA: 58660167147), in persona del suo legale rappresentante pro tempore Dott. Luigi Verdi, nato a Bari il 02/03/1960 e Prof.Ssa Giulia Conti (CF: BIAGIU60C68H501P), in persona del suo legale rappresentante pro tempore, di seguito denominati "Clienti"
e
l’Avv. Chiara Ferrari, con studio in Via Garibaldi 12, Torino, polizza assicurativa: AXA - polizza 123, di seguito denominato "Avvocato"
relativamente al seguente incarico:
Recupero crediti contro Tizio Bianchi.
Valore della controversia: indeterminabile - complessità bassa.
1) Determinazione del compenso e informazione sulla prevedibile misura dei costi della prestazione
Ai sensi dell’art. 13, comma 5, della legge 31 dicembre 2012, n. 247, l’Avvocato dichiara ed i Clienti prendono atto che la prevedibile misura dei costi della prestazione è determinata come segue:
1.1) Compenso:
Descrizione    Importo
Fase dell'attivazione    € 557,00
Fase di negoziazione    € 1.028,00
Conciliazione    € 2.088,00
Parere scritto    € 320,50
Totale compenso:    € 3.993,50
TOTALE PREVENTIVO: € 3.993,50 (Euro tremilanovecentonovantatre/50).
Gli importi come sopra determinati sono da intendersi al netto degli accessori dovuti per legge (spese generali 15%, CPA 4%, IVA 22% ove applicabile).
2) Clausola di garanzia
I Clienti sono stati informati della complessità dell’incarico e degli oneri ipotizzabili dal momento del conferimento alla conclusione dell’incarico stesso, e sono stati avvertiti che, attesa la natura della prestazione oggetto del mandato, i costi e/o i compensi potranno subire delle variazioni in aumento qualora dovessero rendersi opportune attività ulteriori e/o adempimenti più complessi (rispetto a quanto inizialmente previsto in modo indicativo) e in tal caso verranno tempestivamente avvisati.
milano, li 28/02/2026
Dott. Luca Rossi
Firma legale rappresentante Gamma S.P.A.
Firma legale rappresentante Prof.Ssa Giulia Conti
Avv. Chiara Ferrari
```
(Nel caso la seconda e la terza parte risultavano persone giuridiche perché il sito riporta la casella "Pers. giuridica" della riga precedente nelle righe aggiunte: il documento è quello prodotto dai dati realmente inviati.)

**Ricevuta** (caso S03): vedi sotto.
```
Mario Rossi
Via Roma 1
00100 Roma
C.F.: RSSMRA76E23H501P
giovanni neri
C.F.: VRDGPP60E05H501L
Ricevuta n° 1 del 01/01/2026.
Oggetto: Consulenza legale.
Compensi
Studio della pratica    € 3.000,00
Compenso n° 2    € 7.000,00
Redazione atto    € 80,00
Totale compenso:    € 10.080,00
Spese forfettarie    € 35,50
Totale imponibile:    € 10.115,50
Spese documentate da rimborsare
Viaggio    € 10,00
Addebito imposta di bollo    € 2,00
Totale documento:    € 10.127,50
RITENUTE
Imponibile Inps per la parte eccedente € 5000 annuali    € 5.115,50
Aliquota gestione separata Inps    25,50%
Ritenuta INPS a carico del prestatore (1/3 di € 1.304,45)    € 434,82
Netto a pagare:    € 9.692,68
Il sottoscritto dichiara, ai fini della trattenuta contributiva INPS, di non aver percepito nel corso del 2026 altri redditi per attività di lavoro autonomo non esercitato abitualmente di cui all’art. 67, comma 1, lett. l), DPR 917/1986.
Il sottoscritto dichiara di non essere soggetto al regime IVA a norma dell’art. 5, comma 2, DPR 633/72.
Data: 01/01/2026
Firma:
```

## Da confermare
Posizione e aspetto del blocco "Documento" e dei pulsanti Copia/Condividi; scelta di non rendere obbligatori i nuovi campi per il calcolo; limite o meno del numero di parti; conferma dei due punti sulla risposta del backend.

## PR e merge
Frontend: vedi sezione finale del messaggio di consegna (PR e sha del merge). Backend: non toccato.
