# Punti aperti

Elenco unico delle cose rimaste da fare o da decidere. Aggiornato al 23/11/2026, dopo la build iOS #97 (commit `88b4382`) e il deploy del backend `5b23b92`.

## Da pianificare

### SDK iOS 27 (entro aprile 2027)

App Store Connect ha accettato la build 111 con un avviso (ITMS-90725): l'app è compilata con l'SDK di iOS 26.5, e da aprile 2027 le app caricate o inviate in revisione dovranno essere compilate con l'SDK di iOS 27 o successivo (Xcode 27).

- Oggi il workflow `.github/workflows/ios-build.yml` compila su `macos-latest` con la versione di Xcode predefinita di GitHub.
- Cosa servirà: scegliere nel workflow una macchina con Xcode 27 e, con ogni probabilità, aggiornare Expo (oggi 54) e React Native (oggi 0.81) a versioni compatibili.
- Quando: inizio 2027, quando Xcode 27 è stabile e Expo lo supporta. È un lavoro a sé: aggiornamento, prova dell'app, una build di verifica prima della scadenza.

### Aggiornamento mensile dei tassi del Maggior Danno

Il calcolatore usa serie mensili (Istat FOI, BOT, Rendistato) che il sito di riferimento aggiorna una volta al mese, dopo la metà del mese. Se non si aggiornano anche da noi, per l'anno in corso l'ultimo mese vale zero e la media annuale è un po' sbagliata (gli anni passati non cambiano).

- Dati aggiornati fino a ottobre 2026 (letti il 22/11/2026): costanti `MAGGIOR_DANNO_DATI_FINO_A` e `MAGGIOR_DANNO_DATI_LETTI_IL` in `server.py` del backend.
- Procedura: `docs/maggior-danno-taeg.md` nel backend, sezione "Ogni quanto il sito aggiorna". Un calcolo per riferimento sul sito, un commit, un test. Indicativamente dal 20 di ogni mese.
- Lo fa da sola la sessione di manutenzione (giri del 21 e del 2 del mese): apre le PR ma non le unisce. Unendo la PR del backend il deploy parte da solo; con la PR del frontend serve poi una build.
- Nell'app la data massima (sia inizio sia fine) è la costante `MAGGIOR_DANNO_DATA_MASSIMA` in `app/(app)/calcolatori.tsx`: va aggiornata ogni mese insieme a `MAGGIOR_DANNO_DATI_FINO_A` del backend. Se non si aggiorna, l'app accetta date per cui il calcolo non ha tassi.

### Aggiornamento annuale delle tabelle ACI (Rimborso Chilometrico)

Il comunicato dell'Agenzia delle Entrate con le tabelle nazionali dei costi chilometrici elaborate dall'ACI esce in Gazzetta Ufficiale (supplemento ordinario) **entro il 31 dicembre** ed è valido dal 1° gennaio. Senza il nuovo file l'app offre solo gli anni già importati (oggi 2026 e 2025).

- Procedura: `docs/rimborso-aci.md` nel backend (scaricare il PDF, `python3 -I tools/importa_tabelle_aci.py <anno> <pdf>`, controllare le righe, test, commit). L'app legge gli anni dal server: nessuna modifica al frontend.
- Da provare su iPhone: ricerca con tastiera, cambio anno, chilometri con virgola e punto, PDF e Word, VoiceOver (elenco in `docs/rimborso-aci.md`, sezione "Da provare su iPhone").
- Gli endpoint sono in produzione dal 23/11/2026.

### Moltiplicatore catastale gruppo B dal 1° gennaio 2027
Dal 1° gennaio 2027 il moltiplicatore del gruppo B (B/1–B/8) passa da 140 a 168 (art. 299, comma 5, D.Lgs. 141/2026). La tabella delle categorie catastali mostra già 168. Il calcolatore del valore catastale (`server.py`, dizionario con `"B": 140`) usa ancora 140: a gennaio 2027 portarlo a 168, oppure fargli scegliere il valore in base alla data.

### Fornitori: passi successivi

Stato al 23/11/2026 dopo il controllo dei fornitori (dettaglio in `docs/revisione-sicurezza-novembre.md` del backend).

- **Render in Europa, piano a pagamento**: oggi Oregon (USA), piano Free. La regione non si cambia: serve un servizio nuovo a Francoforte, le stesse variabili, il nuovo indirizzo nell'app (quindi una build). Con il piano a pagamento il server non si addormenta (niente cronjob "Sveglia") e ha indirizzi in uscita fissi.
- **MongoDB Atlas, accesso dalla rete**: oggi `0.0.0.0/0`, necessario perché Render Free non ha indirizzi fissi. Con Render a pagamento si mettono solo gli indirizzi di Render.
- **MongoDB Atlas, spazio**: piano M0, 144 MB usati su 512 MB (23/11/2026). A database pieno l'app non salva più: passare a un piano a pagamento prima (che include anche i backup di Atlas).
- **Cloudflare R2, giurisdizione UE**: il bucket `lexflow-documenti` ha solo l'indicazione "Eastern Europe (EEUR)". Il vincolo "EU jurisdiction" si sceglie solo creando un bucket nuovo: bucket nuovo, copia dei file (4 MB), nuove variabili su Render. Da fare insieme allo spostamento di Render.

## Decisioni dell'utente

- **Informativa privacy** (`static/privacy.html` nel backend): mancano titolare del trattamento, indirizzo, eventuale partita IVA ed email di contatto. È il testo accettato alla registrazione.
- **Abbonamenti**: la schermata dei piani non dice che l'abbonamento si rinnova né come si disdice; non esistono condizioni d'uso. Da sistemare prima di attivare i pagamenti reali.
- Quote documenti provvisorie (500 MB Free e No-Ads, 10 GB Pro, 50 GB Studio); 45 voci di menù "in arrivo" che non sono calcolatori; pubblicità sul piano Free (servirà il consenso); testo della filigrana del PDF gratuito (provvisorio: "MyStudioLegale – versione gratuita").

## Decisioni prese

- **Campi che l'app ha e il sito di riferimento no** (23/11/2026, vedi `danno-non-patrimoniale-e-differenze-frontend.md`): Scorporo Importi "Percentuale cassa previdenziale" resta, con valore di partenza 0 (il risultato senza modifiche coincide con il sito); Giorni Lavorativi "Chiusura estiva", Calcolo Eredità "Quota di legittima" e Prescrizione e decadenza "Data ultimo atto interruttivo" restano come sono.
- **Valori di partenza diversi dal sito** (23/11/2026, controllati sul sito senza inviare moduli): Spese di Mediazione con IVA spuntata; Termini Esecuzioni con tipo di pignoramento "Mobiliare"; sospensione Covid-19 spuntata in Procedimento Semplificato, Deposito Atti Appello e Separazione e Divorzio. Nessun valore del sito era diverso da quanto previsto.

## Da provare su iPhone (build #97)

Barra di ricerca nel tab Calcolatori; Calcolatrice; Rimborso Chilometrico ACI; Hash; Tariffe 2004 (Minima/Massima/Specificata, tendina delle deroghe); VoiceOver; esportazione PDF con piano gratuito (filigrana, nessuna intestazione) e con piano a pagamento (intestazione, anche Word); Preventivo Cause Civili (importo salvato uguale a quello mostrato); Danno non Patrimoniale (Milano e Roma); Ammortamento con un mutuo lungo (centinaia di righe di risultato).

## Differenze note con il sito di riferimento

- Scorporo Importi: 1 centesimo in circa un caso su venti (regola non trovata).
- Fine Pena: 3 casi con 1-2 giorni di scarto (interruzione su un confine di semestre).
- Danno non Patrimoniale: tabella generica e Roma 2010 oltre 50 punti non disponibili.
- Parametri civili e stragiudiziali: IVA, cassa e ritenuta non verificabili sul sito senza accesso.
- Prescrizione Reati: il sito scrive "1" per il primo del mese; l'app mostra le date in formato numerico.
- Tariffe 2004 (Tariffe Forensi e Nota Spese): i valori seguono il D.M. 127/2004 anche dove il sito di riferimento differisce (voci corrette del punto 13 e altre tre; fasce 2.582.300-5.164.600 e oltre 5.164.600 con coefficienti e tetto del 3%; Giudice di Pace: nessuna tariffa oltre 2.600 €). Dettaglio: `docs/tariffe-2004-decreto.md` del backend.
- Tariffe 2004: niente tariffa Media (solo Minima, Massima, Specificata, partenza Minima); l'importo specificato deve stare nei limiti del decreto (superabili solo con le deroghe dell'art. 5 commi 2-3 e art. 4 comma 2 del Cap. I e dell'art. 1 commi 2, 3, 6 del Cap. II); consultazione senza colonna Medio. Il sito di riferimento mostra Media e non controlla i limiti.

## Lato utente

- Verifica in due passaggi (con i codici di recupero salvati) su Cloudflare, Render, MongoDB Atlas e GitHub.
- Cloudflare R2: avviso di spesa a 1 $ (Billing Dashboard → Add Budget Alert).
- Un account di prova con email già verificata, per le prove in produzione.
- App Store Connect: modulo fiscale, prima di attivare gli abbonamenti.
- Con un professionista: informativa, condizioni d'uso, procedura per le violazioni di dati, registro dei trattamenti, accordi con i fornitori.
