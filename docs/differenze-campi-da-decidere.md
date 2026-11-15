# Differenze tra app e sito da decidere

Elenco corto e affidabile delle differenze **vere** tra i calcolatori dell'app (`calcolatori.tsx`) e il sito di riferimento (`avvocatoandreani.it/servizi/`). Nasce dallo scarto del [censimento](censimento-campi-etichette.md), che resta com'era. Data della verifica: 15/11/2026. Nessun codice è stato modificato.

## Riepilogo

- **Calcolatori controllati:** 86 (85 del censimento, più «Prescrizione e decadenza», di cui ho trovato la pagina). **Senza differenze vere:** 54. **Con almeno una differenza vera:** 32. **Pagina non trovata:** 7.
- **Differenze vere: 58.** A (il sito ha un campo o una scelta che l'app non ha): **27**. B (l'app ha un campo che il sito non ha): **4**. C (scelte con voci mancanti, in più o diverse): **5**. D (valore di partenza che cambia il risultato): **18**. E (dicitura che può far sbagliare): **4**.
- **Quanto era rumore:** il censimento dichiarava 838 differenze; ne restano 58, cioè circa il 7%. Il resto (oltre il 90%) erano dicitura diversa, campi che l'app ha già con un altro nome, risultati calcolati dal sito scambiati per campi, «vuoto contro 0,00», «codice contro dicitura».
- Ogni riga della tabella è una cosa da decidere. Dove più campi vanno decisi insieme (per esempio le spese e gli accessori) ho fatto una riga sola.

## Come ho controllato

- Per ogni differenza del censimento ho letto il codice dei calcolatori, eseguendo la configurazione dei campi (per i calcolatori scritti a mano, leggendo la schermata). Così sono emersi errori del censimento: per esempio non leggeva molti campi dei calcolatori scritti a mano (Interessi Vari sul Capitale Rivalutato ha già «Rivaluta il capitale secondo l'indice FOI» e «Ignora la deflazione»; Rivalutazione Mensile ha già le due caselle spuntate come il sito).
- Ho letto le pagine del sito una volta ciascuna, senza inviare moduli, con un secondo di pausa tra una e l'altra. Per le scelte «sì/no» ho letto quale voce è spuntata di partenza dalla struttura della pagina: è una lettura indiretta, ma coerente con gli altri campi controllati.
- Le voci «Da verificare a mano» del censimento erano quasi tutte intestazioni di tabella, totali calcolati dal sito, campi di stampa o righe ripetute senza etichetta. Le ho risolte leggendo codice e pagina: quelle che contano sono nella tabella.
- La colonna «Impatto» è una stima: «Serve anche il backend» se il calcolo ha bisogno di un dato nuovo; «Solo frontend» se basta cambiare la schermata. Non ho letto il backend.
- Se una differenza di tipo D è una scelta voluta (per esempio per motivi di legge), basta annotarla e la riga si chiude.

## Differenze da decidere

Ordine: prima le A, poi C, D, B, E. Cosa significano le lettere: **A** il sito ha, l'app no. **B** l'app ha, il sito no. **C** scelte con voci mancanti, in più o diverse. **D** valore di partenza diverso, con risultato diverso. **E** dicitura che può far sbagliare.

| N. | Calcolatore | Cat. | Cosa ha il sito | Cosa ha l'app | Correzione proposta | Impatto |
|---:|---|:-:|---|---|---|---|
| 1 | Parametri 2014 Civile | A | Si sceglie la tabella: «2022 (vigenti)» oppure «2014-2018 (precedenti)». | Una sola tabella, non si può scegliere. | Aggiungere la scelta della tabella. | Serve anche il backend |
| 2 | Parametri 2014 Civile | A | Le fasi (studio, introduttiva, istruttoria, decisionale…) si spuntano una per una. Per ognuna si sceglie minimo, medio o massimo, oppure si scrive un importo. | Nessuna scelta per fase: l'app non fa scegliere né le fasi né i valori. | Aggiungere l'elenco delle fasi con minimo/medio/massimo e importo libero (come in Parametri 2012 Civile). | Serve anche il backend |
| 3 | Parametri 2014 Civile | A | Aumenti: più parti, conciliazione, class action, manifesta fondatezza, ulteriore valutazione, predisposizioni per il processo telematico, motivi aggiunti, ricorso incidentale, memoria art. 378 cpc. Riduzioni: assenza di questioni di fatto e di diritto, condotte ostative, responsabilità art. 96 cpc, pronunce in rito, praticante abilitato. Ognuno con la sua percentuale. | Solo «numero parti con la stessa posizione» e «gratuito patrocinio». | Aggiungere le caselle degli aumenti e delle riduzioni, con la percentuale. | Serve anche il backend |
| 4 | Parametri 2014 Civile | A | Spese esenti, spese di trasferta, altre spese imponibili, spese generali, IVA, CPA, ritenuta d'acconto. | Nessuno di questi campi. | Aggiungere spese e accessori (come in Parametri 2012 Civile). | Serve anche il backend |
| 5 | Parametri Stragiudiziali | A | Il compenso può essere «tabellare» oppure «in percentuale». In percentuale si indica il metodo («secca» o «a scaglioni»), la percentuale e, volendo, l'«esito positivo» con l'importo su cui calcolarlo. | Nessun calcolo in percentuale: solo valore e complessità. | Aggiungere il calcolo in percentuale con esito positivo. | Serve anche il backend |
| 6 | Parametri Stragiudiziali | A | Per la fase si sceglie minimo, medio o massimo, oppure si scrive un importo. | Nessuna scelta. | Aggiungere la scelta del valore della fase. | Serve anche il backend |
| 7 | Parametri Stragiudiziali | A | «Ulteriore valutazione» (aumento %) e «Praticante abilitato» (riduzione %). | Assenti. | Aggiungere le due caselle con la percentuale. | Serve anche il backend |
| 8 | Parametri Stragiudiziali | A | Spese esenti, spese di trasferta, altre spese imponibili, spese generali, IVA, CPA, ritenuta d'acconto. | Nessuno di questi campi. | Aggiungere spese e accessori. | Serve anche il backend |
| 9 | Preventivo Cause Civili | A | La fascia di valore si sceglie da un elenco che comprende 4 voci «indeterminabile» (complessità bassa, media, alta; di particolare importanza). | Si scrive solo l'importo in euro: non si può dire che il valore è indeterminabile. | Aggiungere «Valore indeterminabile» con la scelta della complessità (come in Parametri 2014 Civile). | Serve anche il backend |
| 10 | Calcolo Compenso CTU | A | «Numero periti», da 1 a 9. | Assente. | Aggiungere il campo. | Serve anche il backend |
| 11 | Calcolo Fine Pena | A | Casella «Liberazione anticipata speciale» (già spuntata all'apertura). | Assente. | Aggiungere la casella. | Serve anche il backend |
| 12 | Calcolo Fine Pena | A | Casella «Integrazione» (già spuntata all'apertura). | Assente. | Aggiungere la casella. | Serve anche il backend |
| 13 | Calcolo Fine Pena | A | Per ogni periodo già scontato si può scrivere la durata (anni e mesi) invece delle date. | Solo date «dal» e «al». | Permettere di indicare la durata al posto delle date. | Serve anche il backend |
| 14 | Calcolo Prescrizione Reati | A | Casella «Confronta con la normativa antecedente la legge 251/2005» (già spuntata). | Assente. | Aggiungere la casella. | Serve anche il backend |
| 15 | Calcolo Prescrizione Reati | A | «Aggravante per recidiva o abitualità» (recidiva, recidiva aggravata, abitualità). | Assente. | Aggiungere le tre scelte. | Serve anche il backend |
| 16 | Calcolo Prescrizione Reati | A | «Data ultimo atto interruttivo». | Assente. | Aggiungere la data. | Serve anche il backend |
| 17 | Calcolo Maggior Danno | A | Tre scelte: il tasso di riferimento (4 modi), il tipo di «rendimenti» (2 modi) e lo «sviluppo del calcolo» (2 modi). | Solo capitale e due date: nessuna di queste scelte. | Aggiungere le tre scelte (le diciture esatte vanno lette sul sito). | Serve anche il backend |
| 18 | Compenso Delegati Vendite Giudiziarie | A | Casella «Ritenuta d'acconto» (già spuntata). | Ci sono IVA e contributo di cassa, ma non la ritenuta. | Aggiungere la ritenuta d'acconto. | Serve anche il backend |
| 19 | Scorporo Importi | A | Caselle «Iva per Cassa» e «Split Payment». | Assenti. | Aggiungerle (come in Fattura Avvocati). | Serve anche il backend |
| 20 | Scorporo Importi | A | Con il regime semplificato compaiono il «Tipo regime» (forfettario 2014, vantaggio 2011, minimi 2008) e «Addebito bollo». | Solo la casella del regime semplificato. | Aggiungere tipo di regime e bollo (come in Fattura Avvocati). | Serve anche il backend |
| 21 | Compenso Mediatore Familiare | A | Con il regime semplificato compaiono il «Tipo regime» e «Addebito bollo» (spuntato). | Solo la casella del regime semplificato. | Aggiungere tipo di regime e bollo. | Serve anche il backend |
| 22 | Tassa Registro Locazioni | A | La durata del contratto si indica in anni oppure in mesi. | Solo anni. | Aggiungere la scelta anni/mesi. | Serve anche il backend |
| 23 | Calcolo TAEG | A | La durata si indica in anni oppure come numero totale di rate (da 2 a 360). | Solo anni. | Aggiungere la scelta e il numero di rate. | Serve anche il backend |
| 24 | Calcolo Ammortamento | A | La durata si indica in anni oppure come numero totale di rate (da 2 a 360). | Solo anni. | Aggiungere la scelta e il numero di rate. | Serve anche il backend |
| 25 | Calcolo Valore Catastale | A | «Data di riferimento» (giorno, mese, anno). | Assente: non si può dire a quale data riferire il valore. | Aggiungere la data. | Serve anche il backend |
| 26 | Imposte Compravendita | A | Casella «Prezzo-Valore» e calcolo del valore catastale a partire dalla «Rendita catastale». | Un solo campo «Prezzo (o valore catastale)»: la rendita non si può inserire. | Aggiungere la rendita catastale e la casella. | Serve anche il backend |
| 27 | Calcolo Età Anagrafica | A | Si può inserire il «Codice Fiscale» al posto della data di nascita. | Solo la data di nascita. | Aggiungere il campo codice fiscale (la lettura si può fare nell'app). | Solo frontend |
| 28 | Parametri 2014 Civile | C | «Competenza» ha 29 voci, tra cui «Magistrature superiori», «Consiglio di Stato (appello cautelare)» e «Accertamento del passivo». | 26 voci: mancano queste tre. | Aggiungere le tre voci. | Serve anche il backend |
| 29 | Compenso Delegati Vendite Giudiziarie | C | La riduzione discrezionale accetta da 1 a 60. | L'etichetta dice «Diminuzione (fino al 25%)». | Controllare quale limite è corretto e usare lo stesso in entrambi. | Solo frontend (da controllare anche il backend) |
| 30 | Calcolo Prescrizione Reati | C | «Pena prevista»: 5 voci (Ammenda, Arresto, Multa, Reclusione, Sostitutiva). | 4 voci: manca «Sostitutiva». | Aggiungere la voce. | Serve anche il backend |
| 31 | Calcolo Compenso CTU | C | L'articolo 12 del DM 182/2002 è una sola voce. | Due voci: «12.1» (verifica, collaudi) e «12.2» (rilievi topografici). | Controllare la norma: se la divisione è voluta basta annotarlo, altrimenti unire le voci. | Solo frontend (da controllare anche il backend) |
| 32 | Prescrizione e decadenza | C | «Diritto»: 50 voci. | 43 voci. | Confrontare l'elenco voce per voce e aggiungere quelle mancanti (nel censimento l'elenco completo del sito non era stato salvato, quindi non so dire quali siano). | Serve anche il backend |
| 33 | Termini Procedimento Semplificato | D | «Sospensione feriale» già spuntata. | Non spuntata: se la data cade in agosto il risultato cambia. | Spuntarla di partenza. | Solo frontend |
| 34 | Termini Deposito CTU | D | «Sospensione feriale» già spuntata. | Non spuntata: se la data cade in agosto il risultato cambia. | Spuntarla di partenza. | Solo frontend |
| 35 | Termini Deposito Atti Appello | D | «Sospensione feriale» già spuntata. | Non spuntata: se la data cade in agosto il risultato cambia. | Spuntarla di partenza. | Solo frontend |
| 36 | Termini Separazione e Divorzio | D | «Sospensione feriale» già spuntata. | Non spuntata: se la data cade in agosto il risultato cambia. | Spuntarla di partenza. | Solo frontend |
| 37 | Termini Esecuzioni | D | «Sospensione feriale» già spuntata. | Non spuntata: se la data cade in agosto il risultato cambia. | Spuntarla di partenza. | Solo frontend |
| 38 | Parametri 2012 Civile | D | «Spese generali» non spuntate. | Spuntate, con il 15%: il totale è più alto. | Non spuntarle di partenza. | Solo frontend |
| 39 | Parametri 2012 Penale | D | «Spese generali» non spuntate. | Spuntate, con il 15%: il totale è più alto. | Non spuntarle di partenza. | Solo frontend |
| 40 | Calcolo Fine Pena | D | «Liberazione anticipata» già spuntata. | Non spuntata. | Spuntarla di partenza. | Solo frontend |
| 41 | Calcolo Spese di Mediazione | D | «Mediazione obbligatoria»: «Sì» di partenza. | «No» di partenza (senza la riduzione di un quinto). | Mettere «Sì» di partenza. | Solo frontend |
| 42 | Calcolo Spese di Mediazione | D | «Numero incontri»: «più di uno» di partenza. | «Uno». | Mettere «più di uno» di partenza. | Solo frontend |
| 43 | Calcolo Spese di Mediazione | D | «Accordo raggiunto»: «Sì» di partenza. | «No». | Mettere «Sì» di partenza. | Solo frontend |
| 44 | Calcolo Danno Biologico (lieve entità) | D | Percentuale per il danno morale già scritta: 33,33. | 0. | Mettere 33,33 di partenza (da confermare che sia lo stesso campo). | Solo frontend |
| 45 | Danno Parentale Milano | D | «Convivenza con la vittima» già spuntata. | Non spuntata. | Spuntarla di partenza. | Solo frontend |
| 46 | Danno Parentale Milano | D | «Altri familiari» di partenza: 2. | 0 («nessuno»). | Mettere 2 di partenza. | Solo frontend |
| 47 | Danno Parentale Roma | D | «Convivenza con la vittima» già spuntata. | Non spuntata. | Spuntarla di partenza. | Solo frontend |
| 48 | Calcolo Eredità | D | «Coniuge» già spuntato. | Non spuntato. | Spuntarlo di partenza. | Solo frontend |
| 49 | Calcolo Valore Catastale | D | «Abitazione principale» già spuntata (cambia il moltiplicatore). | Non spuntata. | Spuntarla di partenza. | Solo frontend |
| 50 | Calcolo Compenso CTU | D | «Tariffa predefinita»: «Massima» di partenza. | «Media». | Mettere «Massima» di partenza. | Solo frontend |
| 51 | Scorporo Importi | B | Nessun campo per la cassa previdenziale. | «Percentuale cassa previdenziale», già scritta: 4%. Cambia il risultato anche se non la si tocca. | Se non è voluta, toglierla o metterla a 0 di partenza; se è voluta, annotarlo. | Solo frontend |
| 52 | Giorni Lavorativi e Festivi | B | Nessuna casella per la chiusura estiva. | «Chiusura estiva (1-31 agosto)». | Toglierla, oppure annotare che è voluta. | Solo frontend |
| 53 | Calcolo Eredità | B | Solo la successione legittima (senza testamento). | Scelta «Modalità», con anche «Quota di legittima (con testamento)». | Toglierla, oppure annotare che è voluta. | Solo frontend |
| 54 | Prescrizione e decadenza | B | Solo il diritto e la data di riferimento. | In più «Data ultimo atto interruttivo». | Probabilmente voluta (l'atto interrompe la prescrizione): annotarlo, oppure toglierla. | Solo frontend |
| 55 | Danno Parentale Milano | E | «Coniuge non separato». | «Coniuge»: chi è separato potrebbe scegliere questa voce. | Usare la stessa dicitura. | Solo frontend |
| 56 | Imposte Compravendita | E | «Abitazione di lusso (cat. A/1, A/8, A/9)», «Prima casa e/o pertinenze», «Abitazione secondaria e/o pertinenze». | «Immobile di lusso», «Prima casa», «Abitazione secondaria»: «immobile di lusso» può far pensare a qualsiasi immobile. | Usare le stesse diciture. | Solo frontend |
| 57 | Pignoramento stipendio o pensione | E | «Liquidità su CC €». | «Giacenza media sul conto €»: è un dato diverso da quello chiesto dal sito. | Controllare quale dato serve al calcolo e usare la stessa dicitura. | Solo frontend |
| 58 | Interessi 1284 cc | E | «Rivaluta annualmente» e «Rivaluta al». | «Applica rivalutazione monetaria (Cass. SU 1712/1995)» e «Percentuale di rivalutazione». | Controllare se la rivalutazione dell'app è annuale come sul sito e usare la stessa dicitura. | Serve anche il backend |

## Da provare sul sito (non decidibili con la sola lettura)

Su queste pagine alcuni campi compaiono solo dopo una scelta, e senza usare il modulo non si capisce quando:

- **Preventivo Attività Stragiudiziali:** il sito ha «Ufficio giudiziario» (nascosto all'apertura, elenco vuoto) e «Ubicazione ufficio giudiziario»; l'app non ha il primo.
- **Calcolo Spese di Mediazione:** il sito ha un gruppo nascosto «spese ulteriori» (minimo/medio/massimo con cursore) che nell'app non c'è.
- **Calcolo Compenso a Ore:** il sito mostra una sola coppia ore/minuti, l'app ne ha quattro con segno + o −. Forse il sito ne aggiunge altre dopo un clic.
- **Calcolo Compenso CTU:** il sito ha «Giorni lavorativi» e «Max vacazioni»; sembrano calcolati dalle date, ma non ho verificato se si possono modificare.

## Calcolatori senza differenze vere

Sono 54. Qui «senza differenze vere» vuol dire che ho confrontato campi, scelte e valori di partenza e le uniche differenze sono di dicitura o di forma:

Adeguamento Canone, Aumenti/Riduzioni Pena, Calcolo Cedolare Secca, Calcolo Compenso a Ore, Calcolo Contributo Unificato, Calcolo Devalutazione, Calcolo Diritti di Copia, Calcolo Equo Indennizzo, Calcolo Fattura Enasarco, Calcolo IMU, Calcolo Imposte di Successione, Calcolo Inflazione, Calcolo Interessi Legali, Calcolo Interessi di Mora, Calcolo Menomazioni Plurime, Calcolo Nota Spese, Calcolo Notula Penale, Calcolo Preventivo, Calcolo Risarcimento Danno Tabella Unica, Calcolo Ritenuta d'Acconto, Calcolo Scadenze, Calcolo Superficie Commerciale, Calcolo Surroga, Calcolo Tasso di Usura, Calcolo Usufrutto, Compenso Curatore Fallimentare, Conversione Pena, Copie Processo Tributario, Fattura Avvocati, Fattura Professionisti, Giorni tra due date, Grado di Parentela, Interessi Mora Appalti, Interessi Vari sul Capitale Rivalutato, Interessi a Tasso Fisso, Interessi e Acconti, Parametri 2014 Penale, Pensione di Reversibilità, Preventivo Attività Stragiudiziali, Ricevuta Prestazione Occasionale, Risarcimento INAIL, Rivalutazione Annuale Media, Rivalutazione Mensile, Rivalutazione Storica, Rivalutazione TFR, Rivalutazione e Interessi, Scadenze Impugnazioni, Scadenze Multe, Spese Trasferta Avvocati, Tariffe Mediazione, Termini 183 + 190 cpc, Termini Memorie e Repliche, Termini Processuali Civili, Verifica Gratuito Patrocinio.

## Pagine non trovate

Ho cercato per nome tra i 521 collegamenti della pagina dei servizi del sito e non c'è una pagina corrispondente. Sono 7:

- Termini di comparizione in citazione.
- Opposizione a decreto ingiuntivo — il sito ha solo il «Redattore del decreto ingiuntivo», che è un atto e non il calcolo dei termini.
- Impugnazione licenziamento.
- Ricorso tributario — esiste solo il calcolo generale «Scadenze Impugnazioni».
- Ricorso al TAR — esiste solo il calcolo generale «Scadenze Impugnazioni»; la voce «TAR e Consiglio di Stato» è una ricerca di sentenze.
- Termine per la querela.
- Disdetta di locazione — il sito ha solo la lettera di adeguamento del canone.

«Prescrizione e decadenza» è invece la pagina «Prescrizione Diritti» (`calcolo-prescrizione-diritti.php`): l'ho confrontata ed è nella tabella.
