# Lotto E — Calcolatrice Online, Tariffe Forensi 2004, Calcolo Impronta Hash (+ indagine ACI)

Le tre voci erano "in arrivo" nel menù (`calcolatori.tsx`). Ora sono selezionabili. Il "sito di riferimento" è stato letto con Chromium headless (contesto nuovo, richieste in serie con pausa di 1,1 s, meno di 200 richieste per voce). Nessuna build iOS, nessun `expo start`, nessun deploy.

## Pull request e sha dei merge

| Repo | PR | Contenuto | Sha merge |
|---|---|---|---|
| Frontend | #196 | Calcolatrice Online | `9636fb0` |
| Backend | #211 | `GET /api/tariffe-forensi-2004` (**non deployato**, come da mandato) | `28b9c4f` |
| Frontend | #197 | Tariffe Forensi 2004 | `d9c9dcf` |
| Frontend | #198 | Calcolo Impronta Hash | `1d326f7` |
| Frontend | questa | resoconto + intestazione "Indeterminabile" nello stragiudiziale | (vedi la PR) |

**Attenzione:** finché il backend non è deployato su Render, la schermata Tariffe Forensi 2004 mostra un errore (la rotta non esiste in produzione). Calcolatrice e Impronta Hash non usano il backend.

Librerie: **nessuna aggiunta** (né npm né Expo). Usati moduli già presenti: `expo-document-picker`, `expo-file-system` (`File.open()` + `readBytes`), `expo-clipboard`. L'SHA-256 è un'implementazione JavaScript incrementale (`src/utils/sha256.ts`, ~100 righe), provata contro `sha256sum` e i vettori NIST.

---

## 1. Calcolatrice Online

**Sito:** la calcolatrice è in un iframe con il motore in un file JavaScript leggibile (versione 1.02). L'ho portato in TypeScript riga per riga (`src/utils/calcolatriceOnline.ts`), con interfaccia in `src/components/CalcolatriceOnline.tsx`.

| | Sito | App |
|---|---|---|
| Tasti (7 colonne × 5 righe) | indicatore memoria, CE, C, «, arr, iva, sc / M+, 7 8 9, /, sqrt, Δ% / M-, 4 5 6, x, %, pct / MR, 1 2 3, -, 1/n, idiv / MC, 0, ±, `,`, +, =, mod | identici, stessa disposizione e stesse etichette |
| Valori di partenza | display 0, IVA 22, 2 decimali, nessun raggruppamento | identici |
| Impostazioni | Aliquota IVA (2 cifre), Cifre decimali (1 cifra), Raggruppa cifre; Applica / Salva / Annulla | identiche; "Salva" usa la memoria del telefono al posto del cookie |
| Display | max 15 cifre digitate | uguale |
| Memoria | indicatore "M", valore al passaggio del mouse | indicatore "M"; il valore si vede toccando l'indicatore |
| Incolla/copia | copia-incolla sul display, tasti da tastiera | tocco lungo sul display = copia; pulsante "Incolla" (solo numeri) |
| Informazioni | icona "i" con versione | uguale, senza il nome del sito |

**Logica:** nessuna precedenza tra le operazioni (ogni operatore esegue subito il precedente: 2 + 3 x 4 = 20). Somma, sottrazione, prodotto e divisione sono arrotondati al numero di decimali presente negli operandi (per evitare 0,1+0,2=0,30000000000000004); "iva" scorpora con l'aliquota impostata; sc = x − x·y/100; Δ% = (x−y)/y·100; pct = x/y·100; idiv, mod, 1/n, sqrt, arr con le cifre impostate. Il tasto "C" non cancella la memoria né lo stato "nuovo numero", come nel sito.

**Verifica:** 536 sequenze di tasti (≈8.900 pressioni) eseguite con click veri sulla pagina di riferimento e riprodotte sul motore dell'app, confrontando display e indicatore di memoria dopo ogni tasto: **0 differenze**. Composizione: 400 sequenze (30 mirate + 370 casuali), 120 casuali con impostazioni diverse (IVA 0/4/5/10/22/99, decimali 0-4/9, raggruppamento, campi vuoti), 16 casi mirati sugli errori, 7 incolla, cambio di raggruppamento a numero sul display. Il motore originale è stato eseguito solo dentro Chromium.

**Differenze residue:** (a) incolla: il sito accetta qualsiasi testo ("abc12" → NaN), l'app ignora i testi non numerici; (b) niente scorciatoie da tastiera fisica; (c) l'informazione di versione non riporta il dominio; (d) tooltip → etichette/suggerimenti VoiceOver.

## 2. Tariffe Forensi 2004 (consultazione)

**Sito:** tre schede — Diritti, Onorari, Stragiudiziale — con valore della causa (Specificato € [0,00] / Indeterminabile / Indeterminabile e di particolare importanza), Competenza (non presente nello Stragiudiziale), Testo da cercare, pulsante Visualizza. Il risultato mostra "Competenza", "Valore della Causa", la tabella e (PDF/Word/Stampa).

| | Sito | App |
|---|---|---|
| Schede | Diritti, Onorari, Stragiudiziale; cambiando scheda restano valore e testo, la competenza torna alla prima voce | identico |
| Valore | radio a 3 voci; campo "0,00" max 12 caratteri | identico |
| Competenza | Diritti: Processo di cognizione / di esecuzione / Procedimenti speciali; Onorari: 14 voci da "Giudice di Pace" a "Procedure Esecutive" | identiche, stesso ordine |
| Colonne | una colonna "Tariffa", oppure Minimo/Medio/Massimo | identiche; una voce con una sola tariffa la ripete nelle tre colonne (come il sito) |
| Note | bottone "i" a sinistra della voce | bottone "Nota" sotto la voce |
| Stampa/Anteprima | sì | no: PDF e Word come gli altri calcolatori |

**Dati:** riusati quelli del backend (`NOTA_SPESE_TARIFFE`), con un endpoint nuovo `GET /api/tariffe-forensi-2004` (parametri: tariffario, competenza, tipo_valore, valore, q) e le **note delle voci** (197) prese dal sito, che il backend non aveva. Controllo valore per valore su **113 risposte del sito** (diritti: 3 competenze, onorari: 14, stragiudiziale; scaglioni diversi e indeterminabili; tutti i confini 600…1.549.400 € ± 0,01 per i diritti di cognizione): 3.229 righe, **0 differenze** su codice, nome, tariffe, nota, numero di colonne. Non verificati (limite di 200 richieste): onorari nelle fasce 1, 2, 3, 5, 6, 7, 8, 9 (verificate 0, 4, 10 e i due indeterminabili); diritti di esecuzione e speciali e stragiudiziale nelle fasce 1, 3, 5, 6, 8, 9. Le stesse tabelle erano già state lette dal sito nel lotto B.

**Regole ricavate dal sito:**
- Valore: spazi e "€" ignorati; il punto è decimale se unico e seguito da al massimo 2 cifre ("5.5" = 5,50, "5000.50" = 5.000,50), altrimenti migliaia ("5.500" = 5.500, "1.2345" = 12.345, "1.234.567"); virgola decimale; arrotondamento al centesimo mezzo-su sulle cifre scritte (1,005 → 1,01; 12,345 → 12,35).
- Scaglione: valore ≤ soglia (600; 1.600; 2.600; 5.200; 25.900; 51.700; 103.300; 258.300; 516.500; 1.549.400) → quello; oltre → l'ultimo.
- Errori (con il riquadro "Un campo risulta errato o non compilato."): vuoto o "0" → "Digita il valore della causa"; "0,00" → "Specifica il valore della causa"; negativo → "Digita un valore corretto"; non numerico → "Valore non numerico".
- Ricerca: sul nome della prestazione, senza maiuscole né accenti ("piu" trova "più"), spazi ai bordi ignorati, sottostringa esatta (niente codici, niente parole in ordine diverso, spazi doppi contano); nessun risultato → "ATTENZIONE: Nessuna voce trovata con questo critero di ricerca" (refuso del sito mantenuto).
- Tre colonne: sempre per gli Onorari, per i valori indeterminabili, e quando c'è almeno una voce a tre tariffe. Nello stragiudiziale "di particolare importanza" è scritto "Indeterminabile".

**Casi del sito verificati:** 39 letture del valore (0 differenze), 8 ricerche (0 differenze con l'endpoint).

**Differenze residue:** "1,234.56" il sito lo legge 1,23 (scarta ".56"), l'app lo rifiuta ("Valore non numerico"); competenza nell'app resettata come il sito; Stampa/Anteprima assenti.

## 3. Calcolo Impronta Hash

**Sito:** calcola **solo SHA256** (libreria Asmcrypto) nel browser. Funzioni: scelta/trascinamento di max 64 file; modalità CALCOLO e VERIFICA con un riquadro di testo; "Nuovo Calcolo"; elenco con nome, dimensioni in byte, riferimento temporale UTC (ultima modifica) e impronta **in minuscolo**.

| | Sito | App |
|---|---|---|
| Algoritmi | SHA256 | SHA256 (stesso formato: esadecimale minuscolo) |
| Selezione | trascina o clicca, max 64 | tocca per selezionare (selettore documenti), max 64 |
| Modalità | CALCOLO / VERIFICA | uguali, stesse etichette |
| Testo di verifica | "Inserisci il testo contentente le impronte hash da verificare:" (refuso mantenuto) | uguale |
| Elenco | File, Dimensioni, Riferimento temporale (es. "Lun, 08 Gen 2024 10:20:30 UTC"), Impronta Hash SHA256 | uguale |
| Messaggi | "Elaborazione terminata ( n/N file elaborat[o/i] )", "L'elenco contiene N file.", "Perfetto! Il file corrisponde." / "Tutti i file corrispondono alle impronte inserite.", "File X: nessuna corrispondenza!", "k file su N non corrispond[e/ono]!", "Nessuna impronta da confrontare!", "Il file X è già presente[ ( è il n. K dall'alto )].", "Superato il n. massimo di file…", "Troppi file nella lista (max = 64)" | identici |
| Rimozione | X su ogni file (in verifica solo sui non corrispondenti) | uguale |

**Il file non esce dal telefono:** il calcolo legge il file a blocchi da 256 KB con `File.open()` e non fa nessuna richiesta di rete; la copia temporanea creata dal selettore di documenti (nella cache dell'app) viene cancellata appena calcolata l'impronta. Dal calcolo escono solo nome, dimensione, data e impronta, e solo se l'utente preme PDF/Word (come per gli altri calcolatori, il documento lo genera il backend): **nome del file e impronta vanno al server solo in quel caso**.

**Regole di verifica del sito:** il testo, tolti gli spazi ai bordi, deve avere almeno 64 caratteri; un file corrisponde se la sua impronta **compare nel testo** (ricerca esatta di sottostringa, maiuscole e minuscole contano); i doppioni si riconoscono dall'impronta (non dal nome) e solo rispetto ai file già in elenco.

**Verifica:** SHA256 su **13 file di prova** (vuoto, 1 byte, testo, UTF-8 con accenti, binari 1000 byte, 55/56/64/65 byte, byte speciali, 1 MB, 5 MB, 32 MB + 1 byte) con 101 confronti (blocchi da 1, 7, 63, 64, 65, 4096, 1 MB e intero) contro `sha256sum`: **0 differenze**; vettori NIST ("", "abc", 448 bit, 1.000.000 di "a"): OK. Tutti gli stessi file sul sito: impronte uguali. **14 scenari** confrontati con il sito (calcolo di 13 file, doppione con lista da 13, doppione nella stessa selezione, doppione con 2 file, singolo, verifica con 1/2/3 file, testo prima e dopo i file, uno su due, maiuscolo, testo con prefisso, testo corto, testo vuoto, 66 file): risultato, messaggi ed errori **uguali**. In V8 32 MB in 0,34 s.

**Limite pratico:** nessun limite fisso nel codice (lettura a blocchi, memoria costante). Il limite è il tempo: su iPhone con Hermes la velocità non è stata misurata; stima prudente da centinaia di MB in qualche decina di secondi, con avanzamento per file ("Elaborazione in corso… ( k/N )"), ma **è una stima, non una misura**.

**Differenze residue:** niente trascinamento; la verifica si aggiorna subito mentre si scrive (il sito al termine della modifica); il "riferimento temporale" dipende da `lastModified` del selettore (vedi sotto).

---

## Da decidere con l'utente

Il comportamento del sito è stato implementato così com'è. Per ciascun punto: cosa fa il sito → perché lo ritengo sbagliato → cosa farei → esempio.

### Calcolatrice
1. **Divisione per zero.** Il sito restituisce 0 senza avvisare (anche per `pct`, `Δ%`, `idiv`, `mod`). Un risultato falso invece di un errore. Mostrerei "Errore" e bloccherei la catena. Esempio: `5 / 0 =` → **0**; `3 mod 0 =` → 0.
2. **Variazione percentuale (Δ%) invertita.** Calcola (x−y)/y·100, cioè quanto x è sopra/sotto y, mentre la descrizione dice "variazione tra x e y" (da x a y). Userei (y−x)/x·100. Esempio: `100 Δ% 80 =` → **25** (da 100 a 80 la variazione è −20); `80 Δ% 100 =` → **−20** (da 80 a 100 è +25).
3. **Tasto % con moltiplicazione e divisione.** "%" mette sul display il x% dell'accumulatore, poi l'operazione lo usa come numero: va bene per + e −, non per × e ÷. Userei il valore percentuale (y/100) come le calcolatrici da scrivania. Esempio: `200 x 10 % =` → **4000** (atteso 20); `200 / 10 % =` → **10** (atteso 2000); `200 + 10 % =` → 220 e `200 - 10 % =` → 180 sono corretti.
4. **mod arrotonda i due numeri all'intero.** Il resto con decimali è sbagliato e con divisore < 0,5 dà NaN. Userei il resto vero (o rifiuterei i decimali). Esempio: `7,5 mod 2 =` → **0** (atteso 1,5); `0,5 mod 0,4 =` → **NaN** (atteso 0,1).
5. **idiv tronca verso zero e soffre dei decimali binari.** La guida dice "per difetto" (floor). Userei il floor e i decimali esatti. Esempio: `23 ± idiv 5 =` → **−4** (floor: −5); `0,3 idiv 0,1 =` → **2** (atteso 3).
6. **Impostazioni vuote accettate.** Con "Aliquota IVA" vuota, `iva` dà 0 e con "Cifre decimali" vuota `arr` dà NaN. Rifiuterei il salvataggio di un campo vuoto (o terrei il valore precedente). Esempio: IVA vuota, `100 iva` → **0**.
7. **M+ non chiude il numero.** Dopo `5 M+` la cifra successiva si accoda: `5 M+ 3` → **53**; di solito dopo M+/M- si inizia un nuovo numero (avrei 3).
8. **Backspace su un negativo.** `5 ± «` lascia **"-"** sul display (NaN per le operazioni). Porterei a 0.
9. **sqrt di un negativo non fa nulla** senza avviso (`2 ± sqrt` → −2). Mostrerei un errore.

### Tariffe Forensi 2004
10. **Valore con punto ambiguo.** "1.234" è letto 1.234 (migliaia) e "5.5" è letto 5,50: chi scrive il punto come decimale su una cifra ne può ricavare un importo mille volte più grande. Userei sempre il punto come migliaia o chiederei conferma. Esempio: "1.234" → fascia da € 1.234, non € 1,23.
11. **Messaggi diversi per lo zero.** "0" → "Digita il valore della causa", "0,00" → "Specifica il valore della causa". Userei un solo messaggio.
12. **Refuso "critero"** nel messaggio di nessun risultato; l'ho mantenuto. Lo correggerei in "criterio".
13. **Conformità alla norma non verificata:** i valori sono quelli del sito (e del backend dal lotto B); non ho potuto confrontarli con il testo del D.M. 127/2004 perché il sito della Gazzetta Ufficiale è bloccato dalla rete. Se serve, va fatto a parte.

### Impronta Hash
14. **La verifica distingue maiuscole e minuscole.** Un'impronta incollata in maiuscolo (come la scrivono molti programmi e certe attestazioni) non corrisponde, pur essendo la stessa. Confronterei ignorando le maiuscole. Esempio: file di 1 byte "a", impronta `ca97…48bb`; testo `CA97…48BB` → "**File x: nessuna corrispondenza!**"; scritta in minuscolo corrisponde.
15. **Doppioni nella stessa selezione.** La guida dice "non è possibile inserire due volte lo stesso file", ma il controllo vale solo contro i file già in elenco: due file identici scelti insieme entrano tutti e due. Controllerei anche dentro la selezione. Esempio: `testo.txt` e una sua copia scelti insieme → "L'elenco contiene 2 file." con la stessa impronta due volte.
16. **Verifica per sottostringa senza controlli.** Il testo conta come elenco di impronte se ha almeno 64 caratteri di qualsiasi tipo, e un file "corrisponde" se la sua impronta compare ovunque nel testo (anche dentro una parola più lunga). Estrarrei dal testo solo le sequenze di 64 cifre esadecimali e confronterei quelle.

## Cosa non è stato possibile provare senza iPhone
- Aspetto e uso reale delle tre schermate (nessun `expo start`), VoiceOver, tastiera numerica per il valore delle tariffe.
- `expo-document-picker` su iOS: `lastModified` potrebbe riportare la data della copia in cache e non quella del file originale (il "Riferimento temporale" dell'Impronta Hash); la copia nella cache e la sua cancellazione; la lettura a blocchi con `File.open()`/`readBytes` su file molto grandi; la velocità dell'SHA-256 in Hermes.
- Chiamata reale a `GET /api/tariffe-forensi-2004` (la logica è stata provata offline sul codice dell'endpoint; non deployato) e agli endpoint PDF/Word dei tre risultati.
- `Number.toFixed` in Hermes (usato dalla calcolatrice): verificato in V8 e Chromium.

---

## Indagine: Calcolo Rimborso Chilometrico ACI (non implementato)

**Come funziona la pagina.** Campi: **Tabella di riferimento** (anno: oggi 2026 e 2025), **Chilometri** (max 6 cifre; facoltativo), campo di ricerca con completamento automatico (almeno 3 caratteri, max 64; es. "fiat 500L", "audi a4"); la scelta di un veicolo calcola subito, e cambiando l'anno si ricalcola. Nessun pulsante: il pulsante "Calcola" resta nascosto.

**Ricerca del veicolo.** Il completamento automatico chiama un servizio del sito (`jdecode.php?t=aci&aa=<anno>&s=<testo>`) che risponde con al massimo **60 voci** `{value, label}` (l'indicatore diventa "60+"), per marca e modello, ordinate per nome (es. "FIAT 500 0.9 TWINAIR 85CV"). Il codice `value` cambia da un anno all'altro per lo stesso veicolo (2026: 6643, 2025: 666). Nessun elenco intero è scaricabile dal client: i dati stanno sul server.

**Risultato.** Mostra il veicolo, la motorizzazione (es. "benzina"), "Chilometri percorsi", "Tariffa chilometrica <anno>: € 0,3687" (4 decimali) e "Rimborso chilometrico: € 36,87". **Formula:** `rimborso = arrotonda(km) × tariffa €/km`, al centesimo (123,5 km → 124 km; 124 × 0,3710 = 46,00). Senza chilometri (o 0) mostra solo la tariffa. Oltre una soglia di chilometri dà un errore ("Non ci credo che hai percorso 999.999 chilometri.", soglia non cercata).

**Da dove vengono i dati.** Dalle tabelle nazionali dei costi chilometrici elaborate dall'ACI e pubblicate ogni anno dall'Agenzia delle Entrate in Gazzetta Ufficiale (art. 51 c. 4 lett. a TUIR; per il 2026: GU n. 297 del 23/12/2025, Suppl. ord. n. 40), calcolate su una percorrenza di 15.000 km/anno; vengono riorganizzate in un database per anno.

**Quanti veicoli e anni.** Anni: **2** (2026, 2025). Veicoli: non quantificato esattamente (non ho scaricato la banca dati, come richiesto); dalla numerazione dei codici e da tre ricerche l'ordine di grandezza è di **alcune migliaia di righe per anno** (codici 2026 osservati fra 5.145 e 9.847; 2025 fra 666 e 4.015; "ford" da solo supera le 60 voci).

**Fonte ufficiale scaricabile.** Sì, ma **solo come PDF**, non come dati strutturati: il comunicato in Gazzetta Ufficiale (annuale, entro il 31 dicembre, valido dal 1° gennaio) e il relativo PDF diffuso da riviste di settore; la ricerca web non ha trovato un open data ACI/MEF in CSV o JSON. **Rete:** i siti pubblici di ACI (`www.aci.it`) e della Gazzetta Ufficiale (`www.gazzettaufficiale.it`) sono **bloccati** dalla rete di questa sessione (risposta 403 del proxy), quindi non ho potuto aprire né scaricare i PDF ufficiali: le informazioni sulla fonte vengono da una ricerca web (articoli di Ipsoa, Informazione Fiscale, Sicurauto, Fleet Magazine, Assolombarda).

**Tre modi di farla.**
1. **Importare dai PDF ufficiali ogni anno** (parser una tantum + tabella nel backend con anno, marca, modello, alimentazione, €/km; endpoint di ricerca e di calcolo). *Pro:* fonte ufficiale e verificabile, indipendente dal sito di riferimento, aggiornabile a gennaio. *Contro:* i PDF hanno impaginazione variabile e vanno controllati a mano a ogni uscita; lavoro iniziale maggiore (parser, ricerca testuale, modello di dati).
2. **Copiare la banca dati dal sito di riferimento** (ricerca con 60 risultati, calcolo per codice). *Pro:* identica al sito e rapida da fare. *Contro:* è esattamente ciò che il mandato esclude (dati e servizio di un terzo, codici che cambiano ogni anno, possibili problemi di condizioni d'uso, dipendenza da un servizio senza garanzie).
3. **Solo calcolo con tariffa inserita dall'utente** (più, eventualmente, un piccolo elenco di veicoli frequenti caricato a mano dai PDF). *Pro:* immediato, nessun dato da mantenere, sempre corretto se l'utente copia la tariffa dalla tabella ufficiale. *Contro:* non è "uguale al sito": manca la ricerca del veicolo; l'utente deve aprire il PDF.

---

## Correzioni decise dall'utente (22/11/2026)

L'utente ha deciso di correggere tutti i 16 punti della sezione "Da decidere con l'utente", scostandosi dal sito di riferimento. Le prove sono casi eseguiti con node sulla logica (funzioni pure in `src/utils/`), con il valore **prima** (codice di `main` prima della PR) e **dopo**. Nessuno script di prova è nel repository.

| PR | Contenuto | Sha merge |
|---|---|---|
| #206 | Calcolatrice Online, punti 1-9 | `f115e3b` |
| #207 | Tariffe Forensi 2004, punti 10-12 | `50cac10` |
| #208 | Impronta Hash, punti 14-16 | `52014f5` |
| #209 | resoconto (punto 13 non eseguibile al momento) | `9aa15a2` |
| questa | punto 13: confronto con il testo ufficiale | (vedi la PR) |

### Calcolatrice Online

Nel motore: stato con due campi nuovi (`errore`, `dopoMemoria`); la divisione per zero lancia internamente e il tasto mostra "Errore".

| # | Comportamento nuovo | Prova (sequenza di tasti) | Prima → dopo |
|---|---|---|---|
| 1 | Divisione per zero (`/`, `pct`, `Δ%`, `idiv`, `mod`) → "Errore"; tutti i tasti bloccati (cifre, operazioni, memoria, incolla…) finché non si preme CE o C; la memoria resta | `5 / 0 =`; `5 pct 0 =`; `0 Δ% 5 =`; `7 idiv 0 =`; `3 mod 0 =` | 0 → Errore (per tutti); dopo l'errore `7` non scrive, `C 7` → 7; `CE 8 + 1 =` → 9 |
| 2 | Δ% = (y − x) / x × 100 | `100 Δ% 80 =`; `80 Δ% 100 =` | 25 → **−20**; −20 → **25** |
| 3 | `%` con × e ÷ usa y/100; + e − invariati | `200 x 10 % =`; `200 / 10 % =`; `200 + 10 % =`; `200 - 10 % =` | 4000 → **20**; 10 → **2000**; 220 → 220; 180 → 180 |
| 4 | mod: resto vero con i decimali (esatto, su interi scalati; segno del dividendo come prima) | `7,5 mod 2 =`; `0,5 mod 0,4 =` | 0 → **1,5**; NaN → **0,1** |
| 5 | idiv: per difetto (floor) e decimali esatti | `−23 idiv 5 =`; `0,3 idiv 0,1 =` | −4 → **−5**; 2 → **3** |
| 6 | Impostazione vuota o non valida non salvata: resta il valore precedente, con un messaggio (Alert) | IVA vuota, decimali 2; IVA 22, decimali vuoti; entrambi vuoti; IVA 10 e decimali 3 (valide) | `pctIva` null → **22** (messaggio "Aliquota IVA non valida: resta 22."); `cifreDecimali` null → **2**; `100 iva` con IVA vuota: 0 → 81,9672131147541 (aliquota 22 mantenuta); con valori validi nessun messaggio, invariato |
| 7 | Dopo M+ e M− la cifra successiva inizia un numero nuovo (senza perdere l'operazione in corso) | `5 M+ 3`; `5 M- 3`; `5 M+ + 3 =`; `2 + 5 M+ =` | 53 → **3**; 53 → **3**; 8 → 8; 7 → 7 |
| 8 | Cancella-ultima-cifra su un negativo di una cifra → 0 | `5 ± «` | "-" → **0** |
| 9 | Radice di un negativo → "Errore" | `2 ± sqrt` | −2 → **Errore** |

Testi di aiuto (suggerimenti VoiceOver dei tasti `Δ%`, `%`, `idiv`, `mod`, `sqrt`, `/`, `«`, `M+`, `M−` e dei campi delle impostazioni) aggiornati al comportamento nuovo.

**Confronto con il motore precedente:** 20.000 sequenze casuali (≈162.000 tasti, tutti i tasti) eseguite in parallelo su vecchio e nuovo motore, confrontando display e memoria dopo ogni tasto: 5.661 sequenze con una differenza, **tutte spiegate da uno dei 9 punti** (errore 3.379, M+/M− 1.107, Δ% 456, % con × e ÷ 295, mod 283, idiv 89, indietro 52), **0 non spiegate**. Le prove del lotto E sul sito (536 sequenze con click veri) non sono ripetibili senza la rete verso il sito; il confronto tra vecchio e nuovo motore, che era uguale al sito, ne tiene il posto. Un punto aperto: il segno di `mod` con negativi resta quello del dividendo (−23 mod 5 = −3), mentre `idiv` ora è per difetto (−5); se si vuole il resto coerente con il floor (2) è una modifica a parte.

### Tariffe Forensi 2004

| # | Comportamento nuovo | Prova | Prima → dopo |
|---|---|---|---|
| 10 | Il punto è sempre separatore delle migliaia, la virgola il decimale. Il campo è usato solo da questa schermata (la funzione `leggiValoreCausa` non è condivisa con altri calcolatori). Punto iniziale, finale o doppio, o punto dopo la virgola → "Valore non numerico" | `"1.234"`; `"5.5"`; `"5,5"`; `"5000.50"`; `"1.2345"` | 1234 → 1234; 5,5 → **55**; 5,5 → 5,5; 5000,5 → **500050**; 12345 → 12345 |
| 11 | Un solo messaggio per valore vuoto, "0" o "0,00": "Inserisci il valore della causa" | `""`; `"0"`; `"0,00"`; `"  "` | "Digita il valore della causa" / "Specifica il valore della causa" → **"Inserisci il valore della causa"** |
| 12 | Refuso corretto | costante del messaggio di nessun risultato | "…questo critero di ricerca" → "…questo **criterio** di ricerca" |

Invariati (prova prima = dopo): `"5.000,50"` 5000,5; `"1.234.567"`; `"€ 5000"`; `"1,005"` → 1,01; `"12,345"` → 12,35; `"600"`; `"0,01"`; `"-5"` → "Digita un valore corretto"; `"abc"` e `"1,2,3"` e `"1,23.4"` → "Valore non numerico"; `"1.549.400"`; `"1549400,01"`; `"5,"` → 5. Il punto 10 cambia solo i casi con un punto seguito da 1-2 cifre senza altri punti.

### Punto 13 — conformità con il D.M. 127/2004

**Eseguito il 22/11/2026, dopo che la rete ha consentito la Gazzetta Ufficiale** (nel primo tentativo era bloccata: `net::ERR_TUNNEL_CONNECTION_FAILED`). Nessun valore dell'app è stato cambiato.

**Fonte.** D.M. 8 aprile 2004, n. 127, pubblicato nella Gazzetta Ufficiale n. 115 del 18-5-2004, **Supplemento ordinario n. 95/L** (PDF ufficiale, 64 pagine). Il testo del decreto è leggibile (pagine 1-5), ma **le tabelle degli allegati (Tabella A onorari, Tabella B diritti, Tabella D stragiudiziale, pagine 11-25 e 36) sono immagini scansionate senza strato di testo**: il PDF non è estraibile in modo automatico e sul sistema non c'è un riconoscimento ottico (OCR). Le ho quindi lette **a vista** sulle immagini a 150 dpi, trascritte in una tabella di prova e confrontate per codice con i valori del backend (`NOTA_SPESE_TARIFFE`, il dato da cui l'app legge; commit `ee6abef` del backend). Il rischio di errore di trascrizione c'è: le 6 differenze sono state ricontrollate sulle immagini.

**Campione.** Circa **134 voci ufficiali** (più di 40, come richiesto) e **2.214 confronti** voce × fascia (una voce ufficiale può corrispondere a più righe dell'app, es. "4. Ispezione… Ricerca dei documenti" → 4.1 e 4.2), così distribuiti:

| Tariffario / competenza | Voci ufficiali | Fasce confrontate |
|---|---|---|
| Onorari — Giudice di Pace (n. 1-11) | 11 | fino a 600; 600-1.600; 1.600-2.600 |
| Onorari — Tribunale (12-21) | 10 | tutte da "fino a 5.200" a 1.549.400, indeterminabile e di particolare importanza |
| Onorari — T.A.R. (22-31) | 10 | idem |
| Onorari — Corte d'Appello e Comm. Trib. Reg. (32-41) | 10 | idem |
| Onorari — Cassazione (42-45) e Consiglio di Stato | 4 | fino a 103.300 |
| Onorari — Corte Costituzionale, CEDU, Corte di Giustizia CEE (46-49) | 4 | fino a 103.300 |
| Onorari — Procedimenti speciali e Procedure esecutive (50-56) | 8 | fino a 103.300 |
| Diritti — Processo di cognizione (1-45, con la notifica a più persone) | 46 | tutte, da "fino a 600" a 1.549.400, e indeterminabile |
| Diritti — Processo di esecuzione (46-65) | 21 | da "fino a 600" a 103.300 |
| Stragiudiziale (consulenza, assistenza, diffide, conferenze, archivio, lettere) | 10 | tutte le 8 fasce, da "fino a 600" a 516.500 |

Non confrontati: Diritti — Procedimenti speciali (competenza 3) e le voci 66-80 della Tabella B (vacazione, domiciliazione, trasferta, collazione); onorari e diritti delle fasce oltre 103.300 per Cassazione, Corti europee e Procedimenti speciali; stragiudiziale: percentuali sul valore (contratti, statuti, ecc.), arbitrati, onorario a tempo; i coefficienti "oltre 5.164.600" e le fasce 2.582.300-5.164.600 (vedi sotto).

**Risultato: 6 differenze** di valore su 2.214 confronti (tutte le altre celle coincidono col decreto):

| # | Voce | Fascia | Decreto | App | Dove |
|---|---|---|---|---|---|
| 1 | Onorari G.d.P. n. 4 "Ispezione dei luoghi… Ricerca dei documenti" (riga app 4.2 "Ricerca dei documenti") | da 1.600,01 a 2.600 (e fino a 5.200, che l'app tratta come la stessa fascia) | min **25**, max 40 | min **30**, max 40 | `NOTA_SPESE_TARIFFE.onorari["11"]`, riga 4.2, fasce 2-3 |
| 2 | Onorari Tribunale n. 14 "Ispezione… Ricerca dei documenti" (riga 14.2) | da 5.200,01 a 25.900 | min **35**, max 105 | min **40**, max 105 | `onorari["1"]`, riga 14.2, fascia 4 |
| 3 | Onorari T.A.R. n. 28 "Atto di intervento" | da 258.300,01 a 516.500 | min **275**, max **810** | min 1.425, max 4.260 (valori della riga 27, motivi aggiuntivi) | `onorari["15"]`, riga 28, fascia 8 |
| 4 | Onorari T.A.R. n. 28 "Atto di intervento" | da 516.500,01 a 1.549.400 | min **410**, max **1.080** | min 2.135, max 5.680 (valori della riga 27) | `onorari["15"]`, riga 28, fascia 9 |
| 5 | Onorari T.A.R. n. 25 "Redazione del ricorso introduttivo o della memoria di costituzione" (riga 25.2) | di particolare importanza o indeterminabile | min **360**, max 4.260 | min **369**, max 4.260 | `onorari["15"]`, riga 25.2, fascia i2 |
| 6 | Diritti, processo di cognizione, n. 25 "Collaborazione prestata per la conciliazione" | da 25.900,01 a 51.700 | **89** | **59** | `diritti["1"]`, riga 25, fascia 5 |

Le differenze 5 e 6 sono evidenti errori di battitura nei dati; la 6 si vede anche confrontando con la stessa voce nel processo di esecuzione (n. 51), che nell'app vale 89. Le 3-4 sembrano righe copiate dalla voce vicina (27). Le 1-2 sono una divisione in due righe (4.1/4.2, 14.1/14.2) che nel decreto è una riga sola con un unico minimo: il minimo di "Ricerca dei documenti" dovrebbe essere quello di "Ispezione" (25 e 35).

**Differenze di struttura (non di valore), da decidere:**
- **Fasce oltre 1.549.400 €**: il decreto ha tre fasce ulteriori (1.549.400,01-2.582.300; 2.582.300,01-5.164.600; oltre 5.164.600, per quest'ultima con coefficienti percentuali per onorari e importi fissi per diritti). L'app ha una sola fascia "oltre 1.549.400", i cui valori sono quelli della fascia 1.549.400,01-2.582.300 (verificato su Tribunale, riga 12, e su tutti i diritti di cognizione): **per valori della causa sopra 2.582.300 € l'app mostra i valori della fascia sbagliata**. Lo stesso vale per il sito di riferimento, da cui i dati sono stati presi.
- **Giudice di Pace**: il decreto prevede solo tre fasce (fino a 600; 600-1.600; 1.600-2.600). Sopra 2.600 € l'app ripete la terza fascia fino a 5.200 e poi non mostra voci.
- **Importo "medio"**: il decreto dà solo minimo e massimo; la colonna "Medio" dell'app è la media aritmetica (confermata su 1.173 voci a tre valori) e non è nel decreto.
- Nel decreto le voci hanno numerazione propria (es. "4." ↔ 4.1 e 4.2 dell'app): il confronto è stato fatto per nome e posizione.

Nessuno dei valori è stato modificato: le correzioni (i sei valori e le fasce oltre 1.549.400 €) le decide l'utente.

### Impronta Hash

| # | Comportamento nuovo | Prova | Prima → dopo |
|---|---|---|---|
| 14 | La verifica ignora maiuscole e minuscole | file con impronta `00…ca97`, testo con la stessa impronta in maiuscolo | "File x: nessuna corrispondenza!" → **"Perfetto! Il file corrisponde."** (minuscolo: invariato) |
| 15 | Due file identici nella stessa selezione: il secondo non entra, con il messaggio dei doppioni (con il suffisso "( è il n. K dall'alto )" quando l'elenco ha almeno 3 file) | `testo.txt` + `copia.txt` (stessa impronta); tre file con il primo e il terzo uguali | "L'elenco contiene 2 file." → **1 file, "Il file copia.txt è già presente."**; 3 file → **2 file, "Il file 3 è già presente."** Invariati: doppione contro una lista da 13 file, contro una lista da 1 |
| 16 | Dal testo si estraggono solo le sequenze di esattamente 64 caratteri esadecimali (delimitate da non esadecimali), minuscole e senza ripetizioni, e si confrontano quelle. Nessuna sequenza: testo non vuoto → "Nessuna impronta valida da confrontare: nel testo non c'è nessuna sequenza di 64 caratteri esadecimali."; testo vuoto → "Nessuna impronta da confrontare!" (invariato) | impronta preceduta da `abc` (67 caratteri esadecimali); impronta seguita da `0`; testo corto; testo lungo senza impronte | "Perfetto!" → **messaggio nuovo** (per i primi due); "Nessuna impronta da confrontare!" → **messaggio nuovo**; "nessuna corrispondenza" → **messaggio nuovo**. Invariato: `sha256:` + impronta, testo vuoto |

Scenari del lotto E non toccati dai punti, ripetuti prima/dopo e risultati **identici**: verifica con 1, 2 e 3 file, uno su due, testo prima dei file, calcolo di 13 file, 66 file (limite di 64), nuovo calcolo.

### Controlli

`npx tsc --noEmit -p .` (11 righe) e `npx expo lint` (10 problemi: 6 errori, 4 warning) al baseline dopo ciascuna delle tre PR, con `.expo/types` assente.
