# Esportazione in PDF e Word dei calcolatori e "Intestazione documenti"

**Stato:** implementato nel frontend contro il contratto del backend, **senza poter chiamare il backend né provare su dispositivo**. Non è in nessuna build iOS.

## Cosa è stato fatto

- **Modulo comune di esportazione**
  - `src/utils/corpoEsportazione.ts`: funzione pura `costruisciCorpoEsportazione` che costruisce il corpo di `POST /api/documenti/esporta` (`formato`, `titolo`, `sottotitolo`, `sezioni`, `note`) e applica i limiti (40 sezioni, 400 righe, 60.000 caratteri) con troncamento **dichiarato** nel campo `note`.
  - `src/utils/esportaDocumento.ts`: `esportaDocumento(formato, dati)` e `anteprimaIntestazione()`.
  - `src/utils/apriDocumentoRemoto.ts` (esteso, non duplicato): `apriDocumentoRemotoPost` scarica con `fetch` autenticata (header `Authorization`, mai token in URL), legge `Content-Disposition` e `X-Filigrana`, salva nella cache e apre con `expo-sharing`; su web scarica con un link temporaneo come già fa `impostazioni.tsx`. Gli errori portano il `detail` del server.
  - `src/components/EsportaDocumento.tsx`: i pulsanti "PDF" e "Word".
- **Calcolatori**: il componente è collegato al blocco dei risultati del motore generico (`CONFIG_GENERICI`) e a ogni calcolatore scritto a mano che mostra un risultato. Titolo = nome del calcolatore, sottotitolo vuoto. Sezioni: "Dati inseriti" (etichetta del campo → valore mostrato), "Risultato" (le stesse righe mostrate a schermo) e, dove il calcolatore ha `documento`, la sezione "Documento" con il testo. Le righe del risultato senza valore (titoletti e note) diventano testo della sezione, non righe con valore vuoto.
- **Schermata "Intestazione documenti"** (`app/(app)/intestazione.tsx`), raggiungibile da Impostazioni > Studio, visibile a tutti.
- `profilo.tsx` accetta `?piano=1` e apre subito la schermata dei piani esistente (usata dai due punti che invitano ai piani).

## Come appare

- **Pulsanti**: sotto il risultato, un'etichetta "ESPORTA" e due pulsanti affiancati, "PDF" e "Word", nello stile dei pulsanti Copia/Condividi. Durante la richiesta il pulsante mostra uno spinner e "Creo il file..." (l'altro è disattivato). Con piano Free/No-Ads compare sotto una riga piccola "Il PDF del piano gratuito ha la filigrana"; premendo "Word" un avviso spiega che il formato è disponibile con i piani Pro e Studio, con il pulsante "Vedi i piani". Un 403 del server sul Word mostra lo stesso invito; gli altri errori mostrano il `detail` del server. Copia e Condividi del Preventivo Stragiudiziale e della Ricevuta Occasionale restano dove sono.
- **Schermata**: intestazione "Intestazione documenti"; eventuale riquadro informativo; sezione LOGO (anteprima, "Scegli immagine"/"Sostituisci", "Rimuovi"); i campi Nome dello studio, Indirizzo, Codice fiscale, Partita IVA, Telefono, Email, PEC, Sito web, Ordine degli avvocati di, Assicurazione professionale, Riga a piè di pagina; pulsanti "Salva" e "Anteprima PDF". Se `abilitata` è false: campi e logo in sola lettura e riquadro "disponibile con i piani Pro e Studio" con "Vedi i piani". Se `abilitata` è true e `modificabile` è false: sola lettura con la spiegazione che può modificarla chi gestisce lo studio. Il logo oltre 1 MB o non PNG/JPEG viene rifiutato con un messaggio chiaro prima dell'invio.

## Copertura dei calcolatori (94 voci del menu)

### Motore generico (`CONFIG_GENERICI`): 82

- Giorni tra due date
- Termini di impugnazione
- Opposizione a decreto ingiuntivo
- Prescrizione e decadenza
- Termini di comparizione in citazione
- Precetto ed esecuzione
- Impugnazione licenziamento
- Ricorso tributario
- Ricorso al TAR
- Termine per la querela
- Disdetta di locazione
- Parametri forensi / spese di lite
- Compenso mediazione civile
- Calcolo Età Anagrafica
- Giorni Lavorativi e Festivi
- Termini Separazione e Divorzio
- Termini Esecuzioni
- Termini Procedimento Semplificato
- Termini Deposito Atti Appello
- Termini Deposito CTU
- Scadenze Multe
- Calcolo Prescrizione Reati
- Calcolo Fine Pena
- Conversione Pena
- Interessi e Acconti
- Interessi 1284 c.c. nel corso della causa
- Interessi Mora Appalti
- Calcolo Maggior Danno
- Pignoramento stipendio o pensione
- Calcolo Equo Indennizzo
- Compenso Curatore Fallimentare
- Compenso Delegati Vendite Giudiziarie
- Compenso Mediatore Familiare
- Parametri 2014 Penale
- Parametri 2012 Penale
- Parametri 2012 Civile
- Spese Trasferta Avvocati
- Calcolo Notula Penale
- Calcolo Nota Spese
- Preventivo Attività Stragiudiziali
- Parametri Stragiudiziali
- Calcolo Eredità
- Calcolo Usufrutto
- Calcolo Valore Catastale
- Imposte Compravendita Immobiliare
- Tassa Registro Locazioni
- Danno Biologico (lieve entità)
- Danno Biologico (macropermanenti)
- Calcolo Menomazioni Plurime
- Danno Parentale Milano
- Danno Parentale Roma
- Risarcimento INAIL
- Calcolo Devalutazione
- Calcolo Inflazione
- Rivalutazione Storica
- Rivalutazione Annuale Media
- Rivalutazione TFR
- Ammortamento Mutuo
- Surroga Mutuo
- Calcolo TAEG
- Compenso a Ore
- Ritenuta d'Acconto
- Scorporo Importi
- Fattura Avvocati
- Fattura Professionisti
- Fattura Agente Enasarco
- Ricevuta Prestazione Occasionale
- Tariffe Mediazione
- Calcolo Preventivo
- Calcolo IMU
- Interessi a Tasso Fisso
- Calcolo Tasso di Usura
- Calcolo Scadenze
- Termini 183 + 190 cpc
- Diritti di Copia
- Copie Processo Tributario
- Verifica Gratuito Patrocinio
- Aumenti/Riduzioni Pena
- Grado di Parentela
- Superficie Commerciale
- Calcolo Cedolare Secca
- Pensione di Reversibilità

### Scritti a mano, coperti: 11

- Scadenze Processuali
- Termini memorie e conclusionali
- Interessi legali
- Interessi di mora
- Contributo unificato
- Rivalutazione ISTAT
- Rivalutazione Mensile
- Adeguamento Canone
- Interessi Vari sul Capitale Rivalutato
- Imposta di successione
- Compenso CTU

### Esclusi: 1 calcolatore e gli atti

- **Parcelle**: ha già la propria esportazione (PDF della parcella da Archivio > Parcelle), resta com'è.
- **Atti** (Diffida ad adempiere, Messa in mora, Lettera di incarico professionale, Procura alle liti, Disdetta di locazione lettera): non sono calcolatori e hanno già il proprio Word; restano come sono.

Nessun calcolatore attivo resta senza i pulsanti (controllato confrontando l'elenco `CALCOLATORI` con `CONFIG_GENERICI` e i blocchi scritti a mano).

## Librerie

Nessuna aggiunta. Usate: `expo-file-system`, `expo-sharing`, `expo-document-picker` (anche per scegliere il logo: `expo-image-picker` **non** è nel progetto, quindi ho usato il selettore di documenti limitato a PNG/JPEG), `expo-image` (anteprima del logo con header di autenticazione).

## Verifica

- `npx tsc --noEmit -p .`: 11 righe, uguali al baseline. `npx expo lint`: 10 problemi (6 errori, 4 warning), uguali al baseline.
- Funzione pura provata con node (fuori dal repository, nessuno script lasciato) su: risultato generico con righe-titolo e note, risultato con `documento`, 900 righe (troncato a 400 con nota), 200 righe alternate titolo/valore (sezioni limitate a 40), testo da 100.000 caratteri e 300 righe da 1.000 caratteri (entro 60.000 caratteri). Il corpo rispetta il contratto in tutti i casi. I campioni sono costruiti a mano nella forma del motore generico (non importando `CONFIG_GENERICI`, che vive nel file della schermata).

## Non provato (niente backend né dispositivo)

Chiamate reali a `/documenti/esporta`, `/studio/intestazione*`, apertura del foglio di condivisione su iOS, download su web, selezione e anteprima del logo con `expo-image` e header, VoiceOver, aspetto grafico su schermo.

## Scelte provvisorie da confermare

1. Il piano è letto da `user.piano` (`/auth/me`): Free/No-Ads (o piano assente) = gratuito; `pro`, `studio`, `illimitato` = Word consentito lato app. Decide comunque il server.
2. "Dati inseriti" dei calcolatori scritti a mano è fotografato quando compare il risultato, così resta coerente con i numeri se l'utente modifica i campi dopo. I campi booleani appaiono come "Sì"/"No".
3. Le righe del risultato senza valore diventano testo della sezione (non righe con valore vuoto).
4. Il troncamento oltre i limiti è dichiarato in `note` con una frase fissa.
5. Il nome del file è quello di `Content-Disposition`; se manca, `<titolo>.pdf|docx`.
6. L'anteprima PDF usa l'intestazione **salvata**: con modifiche non salvate la schermata lo segnala ma non salva da sola.
7. La voce "Intestazione documenti" in Impostazioni è visibile a tutti i ruoli e piani (la schermata spiega i limiti).
8. Il logo non viene rimpicciolito sul dispositivo: oltre 1 MB è rifiutato.

## PR e sha dei merge

PR_PLACEHOLDER
