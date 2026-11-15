# Censimento campi ed etichette: calcolatori app vs sito

Confronto, **senza modifiche al codice**, dei campi di input dei calcolatori di `app/(app)/calcolatori.tsx` con le pagine corrispondenti del sito di riferimento (`https://www.avvocatoandreani.it/servizi/`). Il sito è stato letto una sola volta per pagina (nessun modulo inviato). I risultati (etichette dei risultati) non sono inclusi in questo giro. Data della lettura: 15/11/2026.

## Riepilogo

- **Calcolatori esaminati:** 93 (voci attive del menù; ignorate le voci `in_arrivo` e i due atti “Procura alle Liti” e “Sollecito di Pagamento”, che sono atti e non calcolatori).
- **Pagina trovata e letta:** 85. **Non trovata nel menù del sito:** 8.
- **Senza differenze:** 1 (Compenso Curatore Fallimentare).
- **Con differenze** (almeno una delle sei categorie): 82.
- **Solo punti da verificare a mano** (nessuna differenza certa, ma una lettura incerta): 2 (Rivalutazione TFR, Calcolo Preventivo).

Le sei categorie richieste sono: **campo mancante nell'app**, **campo in più nell'app**, **etichetta diversa**, **opzioni diverse** (in una scelta), **predefinito diverso**, **ordine diverso**. La colonna «Da verificare» conta invece i campi del sito la cui etichetta non è stata leggibile dal DOM: non sono classificati come differenze certe (vedi “Nota di metodo”).

## Calcolatore → numero di differenze per tipo

Ordinato dal più divergente (totale = somma delle sei categorie, esclusa la colonna «Da verificare»).

| Calcolatore | Pagina sito | Mancante nell'app | In più nell'app | Etichetta diversa | Opzioni diverse | Predefinito diverso | Ordine diverso | **Totale** | Da verificare |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Preventivo Attività Stragiudiziali (`preventivo-stragiudiziale`) | `preventivo-avvocato-stragiudiziale.php` | 9 | 9 | 7 | 2 | 5 | 2 | **34** | 40 |
| Calcolo Compenso CTU (`compenso-ctu`) | `calcolo-compenso-onorario-ctu-liquidazione-tariffe.php` | 7 | 2 | 6 | 5 | 8 | 3 | **31** | 0 |
| Preventivo Cause Civili (`parcelle`) | `preventivo-avvocato-civile.php` | 7 | 9 | 5 | 4 | 6 | 0 | **31** | 32 |
| Parametri 2014 Civile (`parametri-forensi`) | `calcolo-compenso-avvocati-parametri-civili-2014.php` | 25 | 0 | 3 | 1 | 1 | 0 | **30** | 35 |
| Calcolo Risarcimento Danno Tabella Unica (`danno-biologico-macropermanenti`) | `calcolo-danno-biologico-macropermanenti-tabella-unica.php` | 11 | 1 | 5 | 3 | 4 | 0 | **24** | 19 |
| Calcolo Fine Pena (`fine-pena`) | `calcolo-fine-pena-liberazione-anticipata.php` | 4 | 5 | 7 | 3 | 5 | 0 | **24** | 6 |
| Parametri 2012 Civile (`parametri-civili-2012`) | `calcolo-compenso-avvocati-parametri-ministeriali-civili.php` | 10 | 0 | 9 | 0 | 2 | 1 | **22** | 70 |
| Parametri Stragiudiziali (`parametri-stragiudiziali`) | `calcolo-compenso-avvocati-parametri-stragiudiziali-2014.php` | 18 | 0 | 1 | 0 | 1 | 0 | **20** | 9 |
| Compenso Delegati Vendite Giudiziarie (`compenso-delegati-vendite`) | `calcolo-compenso-delegati-vendite-giudiziarie.php` | 5 | 0 | 7 | 2 | 5 | 0 | **19** | 18 |
| Interessi Vari sul Capitale Rivalutato (`interessi-vari-capitale-rivalutato`) | `calcolo-interessi-vari-capitale-rivalutato.php` | 5 | 0 | 6 | 2 | 4 | 2 | **19** | 8 |
| Parametri 2014 Penale (`parametri-penali-2014`) | `calcolo-compenso-avvocati-parametri-penali-2014.php` | 4 | 0 | 9 | 1 | 2 | 1 | **17** | 39 |
| Calcolo Compenso a Ore (`compenso-ore`) | `calcolo-somma-ore-minuti-compensi-a-tempo.php` | 0 | 10 | 3 | 0 | 2 | 1 | **16** | 0 |
| Danno Parentale Milano (`danno-perdita-parentale-milano`) | `calcolo-danno-perdita-parentale-tribunale-milano.php` | 3 | 0 | 6 | 3 | 4 | 0 | **16** | 2 |
| Parametri 2012 Penale (`parametri-penali-2012`) | `calcolo-compenso-avvocati-parametri-ministeriali-penali.php` | 4 | 0 | 9 | 1 | 1 | 1 | **16** | 43 |
| Calcolo IMU (`imu`) | `calcolo-imu-nuova-ici.php` | 2 | 0 | 8 | 0 | 5 | 0 | **15** | 11 |
| Interessi 1284 cc (`interessi-corso-causa`) | `calcolo-interessi-corso-causa.php` | 5 | 4 | 3 | 0 | 3 | 0 | **15** | 0 |
| Calcolo TAEG (`taeg`) | `calcolo-taeg.php` | 1 | 0 | 6 | 0 | 8 | 0 | **15** | 3 |
| Pignoramento stipendio o pensione (`pignoramento-stipendio-pensione`) | `calcolo-pignoramento-stipendio-pensione.php` | 5 | 0 | 3 | 3 | 3 | 0 | **14** | 10 |
| Ricevuta Prestazione Occasionale (`ricevuta-occasionale`) | `calcolo-ricevuta-prestazione-occasionale.php` | 2 | 0 | 7 | 1 | 4 | 0 | **14** | 18 |
| Termini Procedimento Semplificato (`termini-procedimento-semplificato`) | `calcolo-termini-procedimento-semplificato.php` | 2 | 2 | 4 | 2 | 4 | 0 | **14** | 0 |
| Danno Parentale Roma (`danno-perdita-parentale-roma`) | `calcolo-risarcimento-danno-perdita-parentale.php` | 2 | 1 | 4 | 2 | 3 | 1 | **13** | 0 |
| Calcolo Fattura Enasarco (`fattura-enasarco`) | `calcolo_fattura_agente_enasarco.php` | 0 | 0 | 4 | 1 | 7 | 1 | **13** | 12 |
| Calcolo Eredità (`quote-ereditarie`) | `calcolo_quote_ereditarie.php` | 1 | 2 | 5 | 0 | 5 | 0 | **13** | 0 |
| Scadenze Impugnazioni (`termini-impugnazione`) | `termini-impugnazioni-civile-amministrativo-tributario.php` | 2 | 4 | 3 | 1 | 3 | 0 | **13** | 0 |
| Compenso Mediatore Familiare (`compenso-mediatore-familiare`) | `calcolo-compenso-mediatore-familiare.php` | 3 | 0 | 3 | 1 | 4 | 0 | **11** | 3 |
| Verifica Gratuito Patrocinio (`gratuito-patrocinio`) | `verifica-requisiti-gratuito-patrocinio.php` | 0 | 5 | 1 | 2 | 3 | 0 | **11** | 5 |
| Rivalutazione Mensile (`rivalutazione-mensile`) | `rivalutazione_mensile_assegni_importi_dovuti.php` | 0 | 0 | 5 | 0 | 5 | 1 | **11** | 7 |
| Scadenze Multe (`scadenze-multe`) | `ricorso-pagamento-multa.php` | 3 | 3 | 2 | 1 | 2 | 0 | **11** | 0 |
| Scorporo Importi (`scorporo-importi`) | `calcolatrice_scorporo.php` | 5 | 0 | 4 | 0 | 1 | 1 | **11** | 8 |
| Termini Deposito CTU (`termini-deposito-ctu`) | `calcolo-termini-deposito-ctu.php` | 3 | 3 | 3 | 0 | 2 | 0 | **11** | 0 |
| Adeguamento Canone (`adeguamento-canone`) | `calcolo_adeguamento_istat_canone_locazione.php` | 1 | 1 | 3 | 2 | 3 | 0 | **10** | 0 |
| Calcolo Cedolare Secca (`cedolare-secca`) | `calcolo-convenienza-cedolare-secca-affitti.php` | 0 | 0 | 2 | 3 | 5 | 0 | **10** | 4 |
| Calcolo Spese di Mediazione (`compenso-mediazione`) | `calcolo-spese-di-mediazione.php` | 1 | 0 | 2 | 4 | 3 | 0 | **10** | 11 |
| Calcolo Danno Biologico (lieve entità) (`danno-biologico-lieve-entita`) | `calcolo_danno_biologico.php` | 3 | 0 | 2 | 1 | 4 | 0 | **10** | 10 |
| Interessi e Acconti (`interessi-acconti`) | `calcolo-interessi-acconti.php` | 2 | 2 | 4 | 1 | 1 | 0 | **10** | 14 |
| Calcolo Nota Spese (`nota-spese-tariffe-2004`) | `calcolo_nota_spese_avvocati_tariffe_forensi.php` | 4 | 0 | 2 | 2 | 2 | 0 | **10** | 23 |
| Calcolo Prescrizione Reati (`prescrizione-reati`) | `calcolo-prescrizione-reati.php` | 5 | 0 | 3 | 1 | 1 | 0 | **10** | 2 |
| Risarcimento INAIL (`risarcimento-inail`) | `calcolo_risarcimento_inail_infortunio_lavoro.php` | 0 | 0 | 4 | 3 | 3 | 0 | **10** | 0 |
| Calcolo Superficie Commerciale (`superficie-commerciale`) | `calcolo-superficie-commerciale.php` | 3 | 1 | 3 | 1 | 2 | 0 | **10** | 10 |
| Fattura Avvocati (`fattura-avvocati`) | `calcolo_fattura_studio_legale.php` | 1 | 0 | 4 | 0 | 4 | 0 | **9** | 5 |
| Fattura Professionisti (`fattura-professionisti`) | `calcolo_fattura_generica_scorporo.php` | 0 | 0 | 4 | 0 | 5 | 0 | **9** | 21 |
| Calcolo Imposte di Successione (`imposta-successione`) | `calcolo-imposte-di-successione.php` | 1 | 0 | 2 | 1 | 4 | 1 | **9** | 0 |
| Calcolo Maggior Danno (`maggior-danno`) | `calcolo-maggior-danno-obbligazioni-pecuniarie.php` | 4 | 1 | 2 | 0 | 2 | 0 | **9** | 0 |
| Calcolo Notula Penale (`notula-penale-tariffario-2004`) | `calcolo_parcella_penale_avvocati_tariffario_forense.php` | 2 | 0 | 2 | 2 | 2 | 1 | **9** | 15 |
| Pensione di Reversibilità (`pensione-reversibilita`) | `calcolo-pensione-reversibilita-inps.php` | 1 | 0 | 3 | 4 | 1 | 0 | **9** | 3 |
| Giorni Lavorativi e Festivi (`aggiungi-giorni-lavorativi`) | `calcolo-giorni-lavorativi-festivi.php` | 3 | 0 | 2 | 0 | 1 | 2 | **8** | 10 |
| Calcolo Ammortamento (`ammortamento-mutuo`) | `calcolo-ammortamento-mutuo.php` | 3 | 0 | 1 | 0 | 4 | 0 | **8** | 3 |
| Imposte Compravendita (`imposte-compravendita-immobiliare`) | `calcolo-imposte-compravendita-immobiliare.php` | 2 | 0 | 2 | 2 | 2 | 0 | **8** | 0 |
| Interessi Mora Appalti (`interessi-mora-appalti`) | `calcolo_interessi_mora_appalti_opere_pubbliche.php` | 1 | 1 | 3 | 0 | 3 | 0 | **8** | 0 |
| Rivalutazione e Interessi (`rivalutazione-istat`) | `interessi_rivalutazione.php` | 1 | 1 | 3 | 0 | 3 | 0 | **8** | 0 |
| Termini Esecuzioni (`termini-esecuzioni`) | `calcolo-termini-esecuzioni.php` | 2 | 2 | 2 | 0 | 2 | 0 | **8** | 0 |
| Copie Processo Tributario (`diritti-copia-tributario`) | `calcolo_diritti_copia_processo_tributario.php` | 0 | 1 | 1 | 2 | 2 | 0 | **6** | 0 |
| Interessi a Tasso Fisso (`interessi-tasso-fisso`) | `interessi_tasso_fisso.php` | 0 | 0 | 0 | 1 | 5 | 0 | **6** | 0 |
| Rivalutazione Annuale Media (`rivalutazione-annuale-media`) | `calcolo-rivalutazione-annuale-media.php` | 0 | 0 | 2 | 2 | 2 | 0 | **6** | 0 |
| Termini Deposito Atti Appello (`termini-deposito-appello`) | `calcolo-termini-deposito-atti-appello.php` | 1 | 1 | 2 | 0 | 2 | 0 | **6** | 0 |
| Termini Separazione e Divorzio (`termini-separazione-divorzio`) | `calcolo-termini-separazione-divorzio.php` | 1 | 2 | 1 | 0 | 2 | 0 | **6** | 0 |
| Calcolo Valore Catastale (`valore-catastale`) | `calcolo-valore-catastale-immobili-asse-ereditario.php` | 1 | 0 | 2 | 1 | 2 | 0 | **6** | 0 |
| Calcolo Inflazione (`inflazione`) | `calcolo-inflazione.php` | 0 | 0 | 2 | 1 | 2 | 0 | **5** | 6 |
| Calcolo Menomazioni Plurime (`menomazioni-plurime`) | `calcolo-riduzionistico-menomazioni-plurime.php` | 1 | 1 | 1 | 1 | 1 | 0 | **5** | 0 |
| Rivalutazione Storica (`rivalutazione-storica`) | `rivalutazione-monetaria-storica.php` | 0 | 0 | 2 | 1 | 2 | 0 | **5** | 0 |
| Tariffe Mediazione (`tariffe-mediazione`) | `calcolo-costi-e-tariffe-mediazione-civile.php` | 0 | 0 | 5 | 0 | 0 | 0 | **5** | 8 |
| Termini Memorie e Repliche (`termini-memorie`) | `calcolo-termini-memorie-integrative-comparse-repliche.php` | 1 | 1 | 2 | 0 | 1 | 0 | **5** | 0 |
| Calcolo Usufrutto (`usufrutto`) | `calcolo_usufrutto_nuda_proprieta.php` | 1 | 1 | 2 | 0 | 1 | 0 | **5** | 0 |
| Calcolo Equo Indennizzo (`equo-indennizzo`) | `calcolo-equo-indennizzo-causa-servizio.php` | 1 | 1 | 1 | 1 | 0 | 0 | **4** | 0 |
| Calcolo Età Anagrafica (`eta-anagrafica`) | `calcolo-eta-anagrafica.php` | 2 | 1 | 0 | 0 | 1 | 0 | **4** | 0 |
| Giorni tra due date (`giorni-tra-date`) | `calcolo-giorni-tra-date-e-ricorrenze.php` | 0 | 0 | 2 | 0 | 2 | 0 | **4** | 11 |
| Calcolo Interessi Legali (`interessi-legali`) | `interessi_legali.php` | 0 | 0 | 2 | 0 | 2 | 0 | **4** | 2 |
| Calcolo Interessi di Mora (`interessi-mora`) | `interessi_moratori.php` | 2 | 0 | 2 | 0 | 0 | 0 | **4** | 5 |
| Termini Processuali Civili (`scadenze`) | `calcolo-termini-processuali-civili.php` | 0 | 0 | 2 | 1 | 1 | 0 | **4** | 9 |
| Tassa Registro Locazioni (`tassa-registro-locazione`) | `calcolo-imposta-registro-contratto-locazione.php` | 2 | 0 | 2 | 0 | 0 | 0 | **4** | 9 |
| Calcolo Scadenze (`calcolo-scadenze`) | `calcolo_scadenze_termini_udienze.php` | 0 | 0 | 0 | 1 | 2 | 0 | **3** | 7 |
| Conversione Pena (`conversione-pena`) | `calcolo-conversione-pena-detentiva-pecuniaria.php` | 0 | 0 | 2 | 0 | 0 | 1 | **3** | 19 |
| Calcolo Devalutazione (`devalutazione`) | `calcolo_devalutazione_monetaria.php` | 1 | 0 | 1 | 0 | 1 | 0 | **3** | 6 |
| Spese Trasferta Avvocati (`spese-trasferta-avvocati`) | `calcolo-spese-trasferta-avvocati.php` | 2 | 0 | 1 | 0 | 0 | 0 | **3** | 146 |
| Calcolo Surroga (`surroga-mutuo`) | `calcolo-surroga-mutuo.php` | 1 | 0 | 2 | 0 | 0 | 0 | **3** | 12 |
| Calcolo Tasso di Usura (`tasso-usura`) | `calcolo_tasso_usura.php` | 0 | 0 | 1 | 1 | 1 | 0 | **3** | 7 |
| Calcolo Contributo Unificato (`contributo-unificato`) | `calcolo_contributo_unificato.php` | 1 | 0 | 0 | 0 | 1 | 0 | **2** | 8 |
| Calcolo Diritti di Copia (`diritti-copia`) | `calcolo_diritti_copia_cancelleria.php` | 0 | 0 | 0 | 1 | 1 | 0 | **2** | 0 |
| Grado di Parentela (`grado-parentela`) | `calcolo-grado-di-parentela.php` | 0 | 0 | 1 | 0 | 1 | 0 | **2** | 0 |
| Calcolo Ritenuta d'Acconto (`ritenuta-acconto`) | `calcolo-ritenuta-d-acconto.php` | 1 | 0 | 1 | 0 | 0 | 0 | **2** | 4 |
| Aumenti/Riduzioni Pena (`aumenti-riduzioni-pena`) | `calcolo-aumenti-riduzioni-pena.php` | 0 | 0 | 1 | 0 | 0 | 0 | **1** | 23 |
| Termini 183 + 190 cpc (`termini-183-190`) | `calcolo-termini-memorie-183-comparse-190.php` | 0 | 0 | 0 | 0 | 1 | 0 | **1** | 5 |
| Rivalutazione TFR (`coefficiente-rivalutazione-tfr`) | `coefficienti-rivalutazione-tfr.php` | 0 | 0 | 0 | 0 | 0 | 0 | **0** | 3 |
| Calcolo Preventivo (`calcolo-preventivo`) | `calcolo_preventivo_online.php` | 0 | 0 | 0 | 0 | 0 | 0 | **0** | 34 |
| Compenso Curatore Fallimentare (`compenso-curatore-fallimentare`) | `calcolo-compenso-curatore-fallimentare.php` | 0 | 0 | 0 | 0 | 0 | 0 | **0** | 0 |

## Non trovati nel sito

Nel menù del sito non compare una pagina con lo stesso nome (né con un nome simile). Non sono stati confrontati.

- Prescrizione e decadenza (`prescrizione`)
- Termini di comparizione in citazione (`termini-citazione`)
- Opposizione a decreto ingiuntivo (`opposizione-decreto-ingiuntivo`)
- Impugnazione licenziamento (`impugnazione-licenziamento`)
- Ricorso tributario (`ricorso-tributario`)
- Ricorso al TAR (`ricorso-tar`)
- Termine per la querela (`termine-querela`)
- Disdetta di locazione (`disdetta-locazione`)

## Dettaglio per calcolatore

Per ogni calcolatore: pagina del sito e differenze con le diciture esatte. «App» è l'etichetta in `calcolatori.tsx`, «Sito» quella letta sul sito. Le righe identiche ripetute sono raggruppate con il conteggio.

### Preventivo Attività Stragiudiziali (`preventivo-stragiudiziale`)

Pagina sito: `/servizi/preventivo-avvocato-stragiudiziale.php` · campi app: 32 · campi sito: 40 · esclusi perché riservati agli utenti registrati: “Intestazione studio:”

**Campi mancanti nell'app** (9)
- **Campo mancante nell'app:** “Ufficio giudiziario: (nascosto all'avvio)”
- **Campo mancante nell'app:** “Ubicazione ufficio giudiziario: (nascosto all'avvio)”
- **Campo mancante nell'app:** “Scaglione:”
- **Campo mancante nell'app:** “Valore dell'affare: (nascosto all'avvio)”
- **Campo mancante nell'app:** “Totale compensi per fase (nascosto all'avvio)”
- **Campo mancante nell'app:** “Totale compensi personalizzati”
- **Campo mancante nell'app:** “Nome e Cognome:”
- **Campo mancante nell'app:** “Indirizzo studio:”
- **Campo mancante nell'app:** “Codice fiscale:”

**Campi in più nell'app** (9)
- **Campo in più nell'app:** “Nomin. / Rag. Soc”
- **Campo in più nell'app:** “Pers. giuridica”
- **Campo in più nell'app:** “Rappres. Legale”
- **Campo in più nell'app:** “CF / P.IVA”
- **Campo in più nell'app:** “Descrizione”
- **Campo in più nell'app:** “Importo €”
- **Campo in più nell'app:** “Descrizione (es. Trasferte)”
- **Campo in più nell'app:** “Spesa esente €”
- **Campo in più nell'app:** “Spesa non esente €”

**Etichette diverse** (7)
- **Etichetta diversa:** app “Parti assistite” ↔ sito “(riga ripetibile: ARagSoc)” (lista abbinata per posizione)
- **Etichetta diversa:** app “Altre voci di compenso” ↔ sito “(riga ripetibile: AIndir)” (lista abbinata per posizione)
- **Etichetta diversa:** app “Spese ipotizzabili” ↔ sito “(riga ripetibile: ACodFis)” (lista abbinata per posizione)
- **Etichetta diversa:** app “Includi gli accessori di legge” ↔ sito “Accessori di legge:”
- **Etichetta diversa:** app “Percentuale spese generali” ↔ sito “Percentuale:”
- **Etichetta diversa:** app “Cassa Avvocati (4%)” ↔ sito “Cassa avvocati:”
- **Etichetta diversa:** app “IVA 22%” ↔ sito “IVA:”

**Opzioni diverse** (2)
- **Opzioni diverse** in “Calcolo compenso” (sito “Calcolo compenso:”): solo nell'app: "tabellare", "in percentuale"; solo nel sito: "tabellarein percentuale"
- **Opzioni diverse** in “Includi gli accessori di legge” (sito “Accessori di legge:”): il sito offre una scelta (2 opzioni), l'app un campo libero

**Predefiniti diversi** (5)
- **Predefinito diverso** in “Tipo attività” (sito “Tipo attività:”): app: assistenza — sito: Assistenza stragiudiziale
- **Predefinito diverso** in “Calcolo compenso” (sito “Calcolo compenso:”): app: tabellare — sito: TabellareIn Percentuale
- **Predefinito diverso** in “Includi gli accessori di legge” (sito “Accessori di legge:”): app: selezionata — sito: SINO
- **Predefinito diverso** in “Percentuale spese generali” (sito “Percentuale:”): app: 15 — sito: vuoto
- **Predefinito diverso** in “Data” (sito “Data:”): app: vuoto — sito: 15/11/2026

**Ordine diverso** (2)
- **Ordine diverso:** “Includi gli accessori di legge” (app, posizione 26) ↔ “Accessori di legge:” (sito, posizione 34)
- **Ordine diverso:** “Cassa Avvocati (4%)” (app, posizione 29) ↔ “Cassa avvocati:” (sito, posizione 38)

**Da verificare a mano** (40)
- _Da verificare:_ “Nome e Cognome” — campi del sito con etichetta non leggibile: 5
- _Da verificare:_ “Indirizzo studio” — campi del sito con etichetta non leggibile: 5
- _Da verificare:_ “Codice fiscale” — campi del sito con etichetta non leggibile: 5
- _Da verificare:_ “Ordine avvocati” — campi del sito con etichetta non leggibile: 5
- _Da verificare:_ “Assicurazione” — campi del sito con etichetta non leggibile: 5
- _Da verificare:_ “Valore della pratica” — campi del sito con etichetta non leggibile: 5
- _Da verificare:_ “Valore della pratica €” — campi del sito con etichetta non leggibile: 5
- _Da verificare:_ “Percentuale del compenso (massimo 5%)” — campi del sito con etichetta non leggibile: 5
- _Da verificare:_ “Includi la fase” — campi del sito con etichetta non leggibile: 5 (×3)
- _Da verificare:_ “Variazione % sul valore medio (da -100 a 100)” — campi del sito con etichetta non leggibile: 5 (×3)
- _Da verificare:_ “Compenso personalizzato € (facoltativo, sostituisce il calcolato)” — campi del sito con etichetta non leggibile: 5 (×3)
- _Da verificare:_ “Descrizione della fase (facoltativa)” — campi del sito con etichetta non leggibile: 5
- _Da verificare:_ “Spese generali” — campi del sito con etichetta non leggibile: 5
- _Da verificare:_ riga ripetibile del sito non abbinata ((riga ripetibile: AOrdine), 1 campi)
- _Da verificare:_ riga ripetibile del sito non abbinata ((riga ripetibile: APolizza), 1 campi)
- _Da verificare:_ riga ripetibile del sito non abbinata ((riga ripetibile: PRagSoc), 1 campi)
- _Da verificare:_ riga ripetibile del sito non abbinata ((riga ripetibile: PPerGiu), 1 campi)
- _Da verificare:_ riga ripetibile del sito non abbinata ((riga ripetibile: PRapLeg), 1 campi)
- _Da verificare:_ riga ripetibile del sito non abbinata ((riga ripetibile: PCodFis), 1 campi)
- _Da verificare:_ riga ripetibile del sito non abbinata ((riga ripetibile: SelFase), 1 campi)
- _Da verificare:_ riga ripetibile del sito non abbinata ((riga ripetibile: DescrFase), 1 campi)
- _Da verificare:_ riga ripetibile del sito non abbinata ((riga ripetibile: ImpFase), 1 campi)
- _Da verificare:_ riga ripetibile del sito non abbinata ((riga ripetibile: PctFase), 1 campi)
- _Da verificare:_ riga ripetibile del sito non abbinata ((riga ripetibile: PctFaseVal), 1 campi)
- _Da verificare:_ riga ripetibile del sito non abbinata ((riga ripetibile: DescrComp), 1 campi)
- _Da verificare:_ riga ripetibile del sito non abbinata ((riga ripetibile: ImpComp), 1 campi)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: CompensoTotale, tipo: testo)
- _Da verificare:_ riga ripetibile del sito non abbinata ((riga ripetibile: SpDescr), 1 campi)
- _Da verificare:_ riga ripetibile del sito non abbinata ((riga ripetibile: SpEse), 1 campi)
- _Da verificare:_ riga ripetibile del sito non abbinata ((riga ripetibile: SpNon), 1 campi)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: TotaleSpEse, tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: TotaleSpNon, tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: DoSpeseGen, tipo: casella)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: PctSpeseGen, tipo: testo)

### Calcolo Compenso CTU (`compenso-ctu`)

Pagina sito: `/servizi/calcolo-compenso-onorario-ctu-liquidazione-tariffe.php` · campi app: 13 · campi sito: 18 · esclusi perché riservati agli utenti registrati: “Dati Documento:”

**Campi mancanti nell'app** (7)
- **Campo mancante nell'app:** “Giorni Lavorativi:”
- **Campo mancante nell'app:** “Max Vacazioni:”
- **Campo mancante nell'app:** “Urgenza:”
- **Campo mancante nell'app:** “Complessità:”
- **Campo mancante nell'app:** “Rimborso Chilometr. €”
- **Campo mancante nell'app:** “x chilometri:”
- **Campo mancante nell'app:** “Numero Periti:”

**Campi in più nell'app** (2)
- **Campo in più nell'app:** “Rimborso chilometrico € per km”
- **Campo in più nell'app:** “Numero km”

**Etichette diverse** (6)
- **Etichetta diversa:** app “Numero vacazioni (14,68€ ciascuna, tariffa piena dal 13/2/2025, Corte Cost. 16/2025)” ↔ sito “Numero Vacazioni:”
- **Etichetta diversa:** app “Carico vacazioni % (100 ordinario; fino a 200% se termine ≤5gg, fino a 150% se ≤15gg, art. 4 c. 3 L. 319/1980)” ↔ sito “Carico vacazioni:”
- **Etichetta diversa:** app “Carico urgenza % (0-20)” ↔ sito “Carico urgenza:”
- **Etichetta diversa:** app “Carico complessità % (0-100)” ↔ sito “Carico complessità:”
- **Etichetta diversa:** app “Onorario tabellare (DM 182/2002)” ↔ sito “Articolo DM 182/2002:”
- **Etichetta diversa:** app “Carico onorari %” ↔ sito “Carico Onorari:”

**Opzioni diverse** (5)
- **Opzioni diverse** in “Carico vacazioni % (100 ordinario; fino a 200% se termine ≤5gg, fino a 150% se ≤15gg, art. 4 c. 3 L. 319/1980)” (sito “Carico vacazioni:”): il sito offre una scelta (201 opzioni), l'app un campo libero
- **Opzioni diverse** in “Carico urgenza % (0-20)” (sito “Carico urgenza:”): il sito offre una scelta (21 opzioni), l'app un campo libero
- **Opzioni diverse** in “Carico complessità % (0-100)” (sito “Carico complessità:”): il sito offre una scelta (101 opzioni), l'app un campo libero
- **Opzioni diverse** in “Onorario tabellare (DM 182/2002)” (sito “Articolo DM 182/2002:”): solo nell'app: "nessuno (solo vacazioni)", "art. 2 — perizia contabile/fiscale/amministrativa", "art. 3 — valutazione aziende, patrimoni, avviamento, beni mobili", "art. 4.a — bilanci, sul totale delle attività", "art. 4.b — bilanci, sul totale dei ricavi lordi", "art. 5 — inventari, rendiconti, situazioni contabili", "art. 6.1 — avarie comuni", "art. 6.2 — avarie particolari", "art. 7.1 — metodo attuariale (posizioni retributive/previdenziali)", "art. 7.2 — basi tecniche gestioni previdenziali/assistenziali", "art. 8.1 — equilibrio tecnico-finanziario gestioni previdenziali", "art. 8.2 — analisi bilanci enti previdenziali/assicurativi/finanziari", "art. 9 — opere di pittura, scultura e simili", "art. 10 — retribuzioni, contributi, rapporto di lavoro", "art. 11 — costruzioni edilizie, impianti, infrastrutture", "art. 12.1 — verifica rispondenza tecnica, collaudi, contabilità lavori", "art. 12.2 — rilievi topografici, planimetrici, altimetrici", "art. 13.1 — estimo (perizia estimativa completa)", "art. 13.2 — estimo, stima sommaria", "art. 13.3 — estimo, semplice giudizio di stima", "art. 14 — cave e miniere, minerali, sostanze solide/liquide/gassose", "art. 15.1 — aerei, navi, imbarcazioni: valutazione/riparazione, salvataggio", "art. 15.2 — aerei, navi, imbarcazioni: valutazione danni", "art. 16 — funzioni contabili, equo canone, danni incendio/grandine, millesimali", "art. 17 — infortunistica del traffico e della circolazione", "art. 18.1 — esplosivi, armi, proiettili, bossoli", "art. 18.3 — balistica", "art. 19 — geomorfologia, idrogeologia, geologia applicata", "art. 21 — accertamenti medici, diagnostici, agenti patogeni (persona)", "art. 24 — materia psichiatrica o criminologica", "art. 25 — diagnosi su materiale biologico / tracce biologiche", "art. 28.1 — chimica-tossicologica (ricerca generale incognita)", "art. 28.2 — ecotossicologica", "art. 28.3 — inquinamento acustico"; solo nel sito: "art.2", "art.3", "art.4 - comma a", "art.4 - comma b", "art.5", "art.6 - applicazione 1° comma", "art.6 - applicazione 2° comma", "art.7 - applicazione 1° comma", "art.7 - applicazione 2° comma", "art.8 - applicazione 1° comma", "art.8 - applicazione 2° comma", "art.9", "art.10", "art.11", "art.12", "art.13 - applicazione 1° comma", "art.13 - applicazione 2° comma", "art.13 - applicazione 3° comma", "art.14", "art.15 - applicazione 1° comma", "art.15 - applicazione 2° comma", "art.16", "art.17", "art.18 - applicazione 1° comma", "art.18 - applicazione 3° comma", "art.19", "art.21", "art.24", "art.25", "art.28 - applicazione 1° comma", "art.28 - applicazione 2° comma", "art.28 - applicazione 3° comma"
- **Opzioni diverse** in “Carico onorari %” (sito “Carico Onorari:”): il sito offre una scelta (200 opzioni), l'app un campo libero

**Predefiniti diversi** (8)
- **Predefinito diverso** in “Inizio perizia” (sito “Inizio Perizia:”): app: "" — sito: oggi (15/11/2026)
- **Predefinito diverso** in “Fine perizia” (sito “Fine Perizia:”): app: "" — sito: oggi (15/11/2026)
- **Predefinito diverso** in “Numero vacazioni (14,68€ ciascuna, tariffa piena dal 13/2/2025, Corte Cost. 16/2025)” (sito “Numero Vacazioni:”): app: vuoto — sito: 0
- **Predefinito diverso** in “Carico urgenza % (0-20)” (sito “Carico urgenza:”): app: 0 — sito: 20
- **Predefinito diverso** in “Carico complessità % (0-100)” (sito “Carico complessità:”): app: 0 — sito: 100
- **Predefinito diverso** in “Onorario tabellare (DM 182/2002)” (sito “Articolo DM 182/2002:”): app: Nessuno (solo vacazioni) — sito: vuoto
- **Predefinito diverso** in “Valore stimato €” (sito “Valore Stimato €”): app: vuoto — sito: 0,00
- **Predefinito diverso** in “Tariffa predefinita” (sito “Tariffa Predefinita:”): app: Media — sito: Massima

**Ordine diverso** (3)
- **Ordine diverso:** “Carico urgenza % (0-20)” (app, posizione 5) ↔ “Carico urgenza:” (sito, posizione 12)
- **Ordine diverso:** “Carico complessità % (0-100)” (app, posizione 6) ↔ “Carico complessità:” (sito, posizione 14)
- **Ordine diverso:** “Spese documentate €” (app, posizione 7) ↔ “Spese Documentate €” (sito, posizione 15)

### Preventivo Cause Civili (`parcelle`)

Pagina sito: `/servizi/preventivo-avvocato-civile.php` · campi app: 25 · campi sito: 37 · esclusi perché riservati agli utenti registrati: “Intestazione studio:”

**Campi mancanti nell'app** (7)
- **Campo mancante nell'app:** “A) Totale compensi per fase”
- **Campo mancante nell'app:** “B) Totale compensi personalizzati”
- **Campo mancante nell'app:** “COMPENSO TOTALE (A + B)”
- **Campo mancante nell'app:** “Cassa avvocati:”
- **Campo mancante nell'app:** “Nome e Cognome:”
- **Campo mancante nell'app:** “Indirizzo studio:”
- **Campo mancante nell'app:** “Codice fiscale:”

**Campi in più nell'app** (9)
- **Campo in più nell'app:** “Nome parte assistita”
- **Campo in più nell'app:** “Persona giuridica”
- **Campo in più nell'app:** “Rappresentante legale”
- **Campo in più nell'app:** “CF o P.IVA”
- **Campo in più nell'app:** “Descrizione voce personalizzata”
- **Campo in più nell'app:** “Importo €” (×2)
- **Campo in più nell'app:** “Descrizione spesa”
- **Campo in più nell'app:** “Esente”

**Etichette diverse** (5)
- **Etichetta diversa:** app “Parti assistite” ↔ sito “(riga ripetibile: ARagSoc)” (lista abbinata per posizione)
- **Etichetta diversa:** app “Voci personalizzate” ↔ sito “(riga ripetibile: AIndir)” (lista abbinata per posizione)
- **Etichetta diversa:** app “Spese preventivate” ↔ sito “(riga ripetibile: ACodFis)” (lista abbinata per posizione)
- **Etichetta diversa:** app “Applica accessori di legge (spese generali, CPA, IVA)” ↔ sito “Accessori di legge:”
- **Etichetta diversa:** app “IVA %” ↔ sito “IVA:”

**Opzioni diverse** (4)
- **Opzioni diverse** in “Competenza per giurisdizione o materia” (sito “Competenza per giurisdizione o materia:”): solo nell'app: "corte d'appello"; solo nel sito: "corte d' appello"
- **Opzioni diverse** in “Ufficio giudiziario” (sito “Ufficio giudiziario:”): il sito offre una scelta (1 opzioni), l'app un campo libero
- **Opzioni diverse** in “Valore della controversia €” (sito “Valore della controversia:”): il sito offre una scelta (16 opzioni), l'app un campo libero
- **Opzioni diverse** in “Applica accessori di legge (spese generali, CPA, IVA)” (sito “Accessori di legge:”): il sito offre una scelta (2 opzioni), l'app un campo libero

**Predefiniti diversi** (6)
- **Predefinito diverso** in “Competenza per giurisdizione o materia” (sito “Competenza per giurisdizione o materia:”): app: vuoto — sito: Giudizi di cognizione innanzi al tribunale
- **Predefinito diverso** in “Ufficio giudiziario” (sito “Ufficio giudiziario:”): app: vuoto — sito: Tribunale
- **Predefinito diverso** in “Valore della controversia €” (sito “Valore della controversia:”): app: vuoto — sito: Da € 5.201 a € 26.000
- **Predefinito diverso** in “Applica accessori di legge (spese generali, CPA, IVA)” (sito “Accessori di legge:”): app: selezionata — sito: sino
- **Predefinito diverso** in “IVA %” (sito “IVA:”): app: vuoto — sito: selezionata
- **Predefinito diverso** in “Data” (sito “Data:”): app: oggi — sito: 15/11/2026

**Da verificare a mano** (32)
- _Da verificare:_ “Nome e cognome” — campi del sito con etichetta non leggibile: 4
- _Da verificare:_ “Indirizzo studio” — campi del sito con etichetta non leggibile: 4
- _Da verificare:_ “Codice fiscale” — campi del sito con etichetta non leggibile: 4
- _Da verificare:_ “Ordine degli avvocati di” — campi del sito con etichetta non leggibile: 4
- _Da verificare:_ “Assicurazione professionale” — campi del sito con etichetta non leggibile: 4
- _Da verificare:_ “Fase di studio” — campi del sito con etichetta non leggibile: 4
- _Da verificare:_ “Fase introduttiva” — campi del sito con etichetta non leggibile: 4
- _Da verificare:_ “Fase istruttoria” — campi del sito con etichetta non leggibile: 4
- _Da verificare:_ “Fase decisionale” — campi del sito con etichetta non leggibile: 4
- _Da verificare:_ “Spese generali %” — campi del sito con etichetta non leggibile: 4
- _Da verificare:_ “CPA %” — campi del sito con etichetta non leggibile: 4
- _Da verificare:_ “Ritenuta acconto %” — campi del sito con etichetta non leggibile: 4
- _Da verificare:_ riga ripetibile del sito non abbinata ((riga ripetibile: AOrdine), 1 campi)
- _Da verificare:_ riga ripetibile del sito non abbinata ((riga ripetibile: APolizza), 1 campi)
- _Da verificare:_ riga ripetibile del sito non abbinata ((riga ripetibile: PRagSoc), 1 campi)
- _Da verificare:_ riga ripetibile del sito non abbinata ((riga ripetibile: PPerGiu), 1 campi)
- _Da verificare:_ riga ripetibile del sito non abbinata ((riga ripetibile: PRapLeg), 1 campi)
- _Da verificare:_ riga ripetibile del sito non abbinata ((riga ripetibile: PCodFis), 1 campi)
- _Da verificare:_ riga ripetibile del sito non abbinata ((riga ripetibile: SelFase), 1 campi)
- _Da verificare:_ riga ripetibile del sito non abbinata ((riga ripetibile: DescrFase), 1 campi)
- _Da verificare:_ riga ripetibile del sito non abbinata ((riga ripetibile: ImpFase), 1 campi)
- _Da verificare:_ riga ripetibile del sito non abbinata ((riga ripetibile: PctFase), 1 campi)
- _Da verificare:_ riga ripetibile del sito non abbinata ((riga ripetibile: PctFaseVal), 1 campi)
- _Da verificare:_ riga ripetibile del sito non abbinata ((riga ripetibile: DescrComp), 1 campi)
- _Da verificare:_ riga ripetibile del sito non abbinata ((riga ripetibile: ImpComp), 1 campi)
- _Da verificare:_ riga ripetibile del sito non abbinata ((riga ripetibile: SpDescr), 1 campi)
- _Da verificare:_ riga ripetibile del sito non abbinata ((riga ripetibile: SpEse), 1 campi)
- _Da verificare:_ riga ripetibile del sito non abbinata ((riga ripetibile: SpNon), 1 campi)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: TotaleSpEse, tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: TotaleSpNon, tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: DoSpeseGen, tipo: casella)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: PctSpeseGen, tipo: testo)

### Parametri 2014 Civile (`parametri-forensi`)

Pagina sito: `/servizi/calcolo-compenso-avvocati-parametri-civili-2014.php` · campi app: 6 · campi sito: 60 · esclusi perché riservati agli utenti registrati: “Dati Documento:”

**Campi mancanti nell'app** (25)
- **Campo mancante nell'app:** “Tabelle:”
- **Campo mancante nell'app:** “Scaglione:”
- **Campo mancante nell'app:** “Totale:”
- **Campo mancante nell'app:** “Numero parti:”
- **Campo mancante nell'app:** “Conciliazione:”
- **Campo mancante nell'app:** “Class action:”
- **Campo mancante nell'app:** “Manifesta fondatezza:”
- **Campo mancante nell'app:** “Ulteriore valutazione:”
- **Campo mancante nell'app:** “Predisposizioni x Pct:”
- **Campo mancante nell'app:** “Motivi aggiunti: (nascosto all'avvio)”
- **Campo mancante nell'app:** “Ricorso incidentale: (nascosto all'avvio)”
- **Campo mancante nell'app:** “Memoria 378 c.p.c.: (nascosto all'avvio)”
- **Campo mancante nell'app:** “Assenza questioni di fatto e diritto: (nascosto all'avvio)”
- **Campo mancante nell'app:** “Condotte ostative: (nascosto all'avvio)”
- **Campo mancante nell'app:** “Resp. art. 96 cpc epronunce in rito: (nascosto all'avvio)”
- **Campo mancante nell'app:** “Resp. art. 96 cpc: (nascosto all'avvio)”
- **Campo mancante nell'app:** “Pronunce in rito: (nascosto all'avvio)”
- **Campo mancante nell'app:** “Praticante abilitato: (nascosto all'avvio)”
- **Campo mancante nell'app:** “Spese esenti € (nascosto all'avvio)”
- **Campo mancante nell'app:** “Spese di trasferta € (nascosto all'avvio)”
- **Campo mancante nell'app:** “Altre spese imponibili € (nascosto all'avvio)”
- **Campo mancante nell'app:** “IVA:”
- **Campo mancante nell'app:** “CPA:”
- **Campo mancante nell'app:** “Rit. acc.”
- **Campo mancante nell'app:** “Nascondi tipo compenso:”

**Etichette diverse** (3)
- **Etichetta diversa:** app “Competenza per giurisdizione o materia” ↔ sito “Competenza:”
- **Etichetta diversa:** app “Valore della causa €” ↔ sito “Valore €”
- **Etichetta diversa:** app “Gratuito patrocinio (riduzione del 50%)” ↔ sito “Gratuito patrocinio:”

**Opzioni diverse** (1)
- **Opzioni diverse** in “Competenza per giurisdizione o materia” (sito “Competenza:”): solo nell'app: "corte d'appello"; solo nel sito: "corte d' appello", "magistrature superiori", "consiglio di stato (appello cautelare)", "accertamento del passivo"

**Predefiniti diversi** (1)
- **Predefinito diverso** in “Competenza per giurisdizione o materia” (sito “Competenza:”): app: tribunale — sito: Giudizi di cognizione innanzi al tribunale

**Da verificare a mano** (35)
- _Da verificare:_ “Valore della causa indeterminabile” — campi del sito con etichetta non leggibile: 32
- _Da verificare:_ “Complessità” — campi del sito con etichetta non leggibile: 32
- _Da verificare:_ “N. parti assistite con la stessa posizione” — campi del sito con etichetta non leggibile: 32
- _Da verificare:_ campo sito senza etichetta leggibile (nome: FselAll, tipo: casella)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: VselAll, tipo: scelta, 3 opzioni)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Fsel1, tipo: casella)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Vsel1, tipo: scelta, 3 opzioni)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Val1, tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Fsel2, tipo: casella)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Vsel2, tipo: scelta, 3 opzioni)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Val2, tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Fsel3, tipo: casella)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Vsel3, tipo: scelta, 3 opzioni)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Val3, tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Fsel4, tipo: casella)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Vsel4, tipo: scelta, 3 opzioni)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Val4, tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: PctPiuParti, tipo: scelta, 1 opzioni)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: PctConciliazione, tipo: scelta, 25 opzioni)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: ImpConciliazione, tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: PctClassAction, tipo: scelta, 30 opzioni)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: PctFondatezza, tipo: scelta, 33 opzioni)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: PctImportanza, tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: PctPredPct, tipo: scelta, 30 opzioni)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: PctMotiviAggiunti, tipo: scelta, 50 opzioni)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: ImpMotiviAggiunti, tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: PctRicorsoIncidentale, tipo: scelta, 20 opzioni)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: ImpRicorsoIncidentale, tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: PctMemoria378, tipo: scelta, 50 opzioni)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: ImpMemoria378, tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: PctAssenzaQfd, tipo: scelta, 30 opzioni)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: PctRitardo, tipo: scelta, 50 opzioni)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: PctPraticante, tipo: scelta, 10 opzioni)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: DoSpeseGen, tipo: casella)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: PctSpeseGen, tipo: testo)

### Calcolo Risarcimento Danno Tabella Unica (`danno-biologico-macropermanenti`)

Pagina sito: `/servizi/calcolo-danno-biologico-macropermanenti-tabella-unica.php` · campi app: 11 · campi sito: 29

**Campi mancanti nell'app** (11)
- **Campo mancante nell'app:** “Tabella di riferimento:”
- **Campo mancante nell'app:** “Punto base danno biologico:”
- **Campo mancante nell'app:** “Età del danneggiato:”
- **Campo mancante nell'app:** “Punto danno biologico:”
- **Campo mancante nell'app:** “Punto danno non patrimoniale:”
- **Campo mancante nell'app:** “Danno permanente:”
- **Campo mancante nell'app:** “Punto base I.T.T.:”
- **Campo mancante nell'app:** “Indennità giornaliera:”
- **Campo mancante nell'app:** “Totale I.T.T.:”
- **Campo mancante nell'app:** “DPR n. 12 del 13/01/2025 e art. 138, DLGS 209/2005”
- **Campo mancante nell'app:** “Totale spese:”

**Campi in più nell'app** (1)
- **Campo in più nell'app:** “Percentuale di inabilità %”

**Etichette diverse** (5)
- **Etichetta diversa:** app “Punti di invalidità permanente (10-100)” ↔ sito “Punti di invalidità:”
- **Etichetta diversa:** app “Applica la personalizzazione di fascia per danno morale” ↔ sito “Punto danno morale:”
- **Etichetta diversa:** app “Percentuale personalizzazione danno morale % (facoltativo: lascia vuoto per il valore medio di fascia)” ↔ sito “Percentuale:”
- **Etichetta diversa:** app “Applica la personalizzazione ulteriore a” ↔ sito “Applica a:”
- **Etichetta diversa:** app “Periodi di invalidità parziale (ITP)” ↔ sito “(riga ripetibile: GgITT)” (lista abbinata per posizione)

**Opzioni diverse** (3)
- **Opzioni diverse** in “Punti di invalidità permanente (10-100)” (sito “Punti di invalidità:”): il sito offre una scelta (91 opzioni), l'app un campo libero
- **Opzioni diverse** in “Percentuale personalizzazione danno morale % (facoltativo: lascia vuoto per il valore medio di fascia)” (sito “Percentuale:”): il sito offre una scelta (3 opzioni), l'app un campo libero
- **Opzioni diverse** in “Applica la personalizzazione ulteriore a” (sito “Applica a:”): solo nell'app: "danno permanente + i.t.t", "solo danno permanente"; solo nel sito: "danno permanente + i.t.t.solo danno permanente"

**Predefiniti diversi** (4)
- **Predefinito diverso** in “Punti di invalidità permanente (10-100)” (sito “Punti di invalidità:”): app: vuoto — sito: 10
- **Predefinito diverso** in “Applica la personalizzazione di fascia per danno morale” (sito “Punto danno morale:”): app: selezionata — sito: € 690,77
- **Predefinito diverso** in “Percentuale personalizzazione danno morale % (facoltativo: lascia vuoto per il valore medio di fascia)” (sito “Percentuale:”): app: vuoto — sito: minmedmax (art. 138, comma 3 CAP)
- **Predefinito diverso** in “Applica la personalizzazione ulteriore a” (sito “Applica a:”): app: permanente_itt — sito: danno permanente + I.T.T.solo danno permanente

**Da verificare a mano** (19)
- _Da verificare:_ “Età al momento del sinistro” — campi del sito con etichetta non leggibile: 9
- _Da verificare:_ “Giorni di invalidità assoluta (ITT)” — campi del sito con etichetta non leggibile: 9
- _Da verificare:_ “Personalizzazione ITT (30-60%)” — campi del sito con etichetta non leggibile: 9
- _Da verificare:_ “Personalizzazione ulteriore (fino al 30%, art. 138 c.3)” — campi del sito con etichetta non leggibile: 9
- _Da verificare:_ “Spese mediche €” — campi del sito con etichetta non leggibile: 9
- _Da verificare:_ “Altre spese €” — campi del sito con etichetta non leggibile: 9
- _Da verificare:_ campo sito senza etichetta leggibile (nome: DoPersMorale, tipo: scelta, 2 opzioni)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: SelPctMorale, tipo: scelta, 3 opzioni)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: PctMorale, tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: PctMoraleVal, tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: DoPersITT, tipo: scelta, 2 opzioni)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: SelPctPersITT, tipo: scelta, 3 opzioni)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: PctPersITT, tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: PctPersITTVal, tipo: testo)
- _Da verificare:_ riga ripetibile del sito non abbinata ((riga ripetibile: PctITT), 1 campi)
- _Da verificare:_ riga ripetibile del sito non abbinata ((riga ripetibile: ImpITT), 1 campi)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: PctPersTot, tipo: testo)
- _Da verificare:_ riga ripetibile del sito non abbinata ((riga ripetibile: SpDescr), 1 campi)
- _Da verificare:_ riga ripetibile del sito non abbinata ((riga ripetibile: SpVal), 1 campi)

### Calcolo Fine Pena (`fine-pena`)

Pagina sito: `/servizi/calcolo-fine-pena-liberazione-anticipata.php` · campi app: 9 · campi sito: 17

**Campi mancanti nell'app** (4)
- **Campo mancante nell'app:** “anni”
- **Campo mancante nell'app:** “Inizio detenzione:”
- **Campo mancante nell'app:** “L. a. speciale:”
- **Campo mancante nell'app:** “Integrazione:”

**Campi in più nell'app** (5)
- **Campo in più nell'app:** “Data di inizio esecuzione della pena”
- **Campo in più nell'app:** “Durata pena — giorni”
- **Campo in più nell'app:** “Dal”
- **Campo in più nell'app:** “Al” (×2)

**Etichette diverse** (7)
- **Etichetta diversa:** app “Durata pena — anni” ↔ sito “Durata pena:”
- **Etichetta diversa:** app “Durata pena — mesi” ↔ sito “mesi”
- **Etichetta diversa:** app “Applica liberazione anticipata (45gg a semestre)” ↔ sito “Liberazione anticipata:”
- **Etichetta diversa:** app “Calcola fino al (opzionale)” ↔ sito “Calcola fino al:”
- **Etichetta diversa:** app “Conta solo i semestri completi” ↔ sito “Solo semestri completi:”
- **Etichetta diversa:** app “Periodi già scontati (crediti di pena)” ↔ sito “(riga ripetibile: TipoCre)” (lista abbinata per posizione)
- **Etichetta diversa:** app “Interruzioni dell'esecuzione” ↔ sito “(riga ripetibile: DalCre)” (lista abbinata per posizione)

**Opzioni diverse** (3)
- **Opzioni diverse** in “Durata pena — anni” (sito “Durata pena:”): il sito offre una scelta (31 opzioni), l'app un campo libero
- **Opzioni diverse** in “Durata pena — mesi” (sito “mesi”): il sito offre una scelta (91 opzioni), l'app un campo libero
- **Opzioni diverse** in “Conta solo i semestri completi” (sito “Solo semestri completi:”): il sito offre una scelta (2 opzioni), l'app un campo libero

**Predefiniti diversi** (5)
- **Predefinito diverso** in “Durata pena — anni” (sito “Durata pena:”): app: 0 — sito: vuoto
- **Predefinito diverso** in “Durata pena — mesi” (sito “mesi”): app: 0 — sito: vuoto
- **Predefinito diverso** in “Applica liberazione anticipata (45gg a semestre)” (sito “Liberazione anticipata:”): app: non selezionata — sito: selezionata
- **Predefinito diverso** in “Conta solo i semestri completi” (sito “Solo semestri completi:”): app: selezionata — sito: SiNo
- **Predefinito diverso** in “Tipo” (sito “tipo:”): app: 10 — sito: vuoto

**Da verificare a mano** (6)
- _Da verificare:_ riga ripetibile del sito non abbinata ((riga ripetibile: AlCre), 1 campi)
- _Da verificare:_ riga ripetibile del sito non abbinata ((riga ripetibile: AnniCre), 1 campi)
- _Da verificare:_ riga ripetibile del sito non abbinata ((riga ripetibile: MesiCre), 1 campi)
- _Da verificare:_ riga ripetibile del sito non abbinata ((riga ripetibile: GiorniCre), 1 campi)
- _Da verificare:_ riga ripetibile del sito non abbinata ((riga ripetibile: DalInt), 1 campi)
- _Da verificare:_ riga ripetibile del sito non abbinata ((riga ripetibile: AlInt), 1 campi)

### Parametri 2012 Civile (`parametri-civili-2012`)

Pagina sito: `/servizi/calcolo-compenso-avvocati-parametri-ministeriali-civili.php` · campi app: 53 · campi sito: 51

**Campi mancanti nell'app** (10)
- **Campo mancante nell'app:** “Istruttoria”
- **Campo mancante nell'app:** “Decisoria”
- **Campo mancante nell'app:** “Esecutiva mobiliare”
- **Campo mancante nell'app:** “Esecutiva immobiliare”
- **Campo mancante nell'app:** “Espropriazione”
- **Campo mancante nell'app:** “Affari tavolari”
- **Campo mancante nell'app:** “Conciliazione:”
- **Campo mancante nell'app:** “Indennizzo exL. 89/2001: (nascosto all'avvio)”
- **Campo mancante nell'app:** “Resp. art. 96 cpc epronunce in rito: (nascosto all'avvio)”
- **Campo mancante nell'app:** “Rit. acc.”

**Etichette diverse** (9)
- **Etichetta diversa:** app “Incarico collegiale (art. 1, comma 4)” ↔ sito “Incarico collegiale:”
- **Etichetta diversa:** app “Più parti (art. 4, comma 4)” ↔ sito “Più parti:”
- **Etichetta diversa:** app “Class action (art. 4, comma 4)” ↔ sito “Class action:”
- **Etichetta diversa:** app “Ulteriore valutazione (art. 4, commi 2 e 3)” ↔ sito “Ulteriore valutazione:”
- **Etichetta diversa:** app “Causa di lavoro di valore inferiore a 1000 (art. 8, comma 1)” ↔ sito “Causa lavoro < € 1000:”
- **Etichetta diversa:** app “Gratuito patrocinio (50%, art. 9, comma 1)” ↔ sito “Gratuito patrocinio:”
- **Etichetta diversa:** app “Spese esenti € (art. 15 DPR 633/72)” ↔ sito “Spese esenti €”
- **Etichetta diversa:** app “CPA (Cassa Avvocati 4%)” ↔ sito “CPA:”
- **Etichetta diversa:** app “IVA 22%” ↔ sito “IVA:”

**Predefiniti diversi** (2)
- **Predefinito diverso** in “Competenza” (sito “Competenza:”): app: 20 — sito: Tribunale ordinario civile
- **Predefinito diverso** in “Valore della causa” (sito “Valore della Causa:”): app: 20 — sito: Da € 25.001 a € 50.000

**Ordine diverso** (1)
- **Ordine diverso:** “CPA (Cassa Avvocati 4%)” (app, posizione 51) ↔ “CPA:” (sito, posizione 50)

**Da verificare a mano** (70)
- _Da verificare:_ “Compenso di tutte le fasi” — campi del sito con etichetta non leggibile: 29
- _Da verificare:_ “Includi la fase” — campi del sito con etichetta non leggibile: 29 (×9)
- _Da verificare:_ “Valore” — campi del sito con etichetta non leggibile: 29 (×9)
- _Da verificare:_ “Compenso personalizzato € (facoltativo)” — campi del sito con etichetta non leggibile: 29 (×9)
- _Da verificare:_ “Aumento %” — campi del sito con etichetta non leggibile: 29 (×5)
- _Da verificare:_ “Causa conciliata (art. 4, comma 5)” — campi del sito con etichetta non leggibile: 29
- _Da verificare:_ “Riduzione %” — campi del sito con etichetta non leggibile: 29 (×2)
- _Da verificare:_ “Indennizzo per irragionevole durata del processo (art. 9, comma 1)” — campi del sito con etichetta non leggibile: 29
- _Da verificare:_ “Responsabilità art. 96 c.p.c. o pronunce in rito (50%, art. 10, comma 1)” — campi del sito con etichetta non leggibile: 29
- _Da verificare:_ “Spese generali” — campi del sito con etichetta non leggibile: 29
- _Da verificare:_ “Percentuale spese generali” — campi del sito con etichetta non leggibile: 29
- _Da verificare:_ “Ritenuta d'acconto 20%” — campi del sito con etichetta non leggibile: 29
- _Da verificare:_ campo sito senza etichetta leggibile (nome: FselAll, tipo: casella)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: VselAll, tipo: scelta, 3 opzioni)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Fsel1, tipo: casella)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Vsel1, tipo: scelta, 3 opzioni)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Val1, tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Fsel2, tipo: casella)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Vsel2, tipo: scelta, 3 opzioni)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Val2, tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Vsel3, tipo: scelta, 3 opzioni)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Val3, tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Vsel4, tipo: scelta, 3 opzioni)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Val4, tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Vsel5, tipo: scelta, 3 opzioni)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Val5, tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Vsel6, tipo: scelta, 3 opzioni)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Val6, tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Vsel7, tipo: scelta, 3 opzioni)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Val7, tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Vsel8, tipo: scelta, 3 opzioni)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Val8, tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: PctCollegiale, tipo: scelta, 20 opzioni)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: PctPiuParti, tipo: scelta, 20 opzioni)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: PctClassAction, tipo: scelta, 20 opzioni)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: PctConciliazione, tipo: scelta, 25 opzioni)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: PctImportanza, tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: PctLavoro, tipo: scelta, 50 opzioni)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: PctIndennizzo, tipo: scelta, 50 opzioni)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: DoSpeseGen, tipo: casella)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: PctSpeseGen, tipo: testo)

### Parametri Stragiudiziali (`parametri-stragiudiziali`)

Pagina sito: `/servizi/calcolo-compenso-avvocati-parametri-stragiudiziali-2014.php` · campi app: 4 · campi sito: 25 · esclusi perché riservati agli utenti registrati: “Dati Documento:”

**Campi mancanti nell'app** (18)
- **Campo mancante nell'app:** “Tabelle:”
- **Campo mancante nell'app:** “Competenza:”
- **Campo mancante nell'app:** “Scaglione:”
- **Campo mancante nell'app:** “Metodo di calcolo: (nascosto all'avvio)”
- **Campo mancante nell'app:** “Percentuale: (nascosto all'avvio)”
- **Campo mancante nell'app:** “Esito positivo: (nascosto all'avvio)”
- **Campo mancante nell'app:** “calcolato su: (nascosto all'avvio)”
- **Campo mancante nell'app:** “Ulteriore valutazione:”
- **Campo mancante nell'app:** “aumento del:”
- **Campo mancante nell'app:** “Praticante abilitato: (nascosto all'avvio)”
- **Campo mancante nell'app:** “riduzione del: (nascosto all'avvio)”
- **Campo mancante nell'app:** “Spese esenti € (nascosto all'avvio)”
- **Campo mancante nell'app:** “Spese di trasferta € (nascosto all'avvio)”
- **Campo mancante nell'app:** “Altre spese imponibili € (nascosto all'avvio)”
- **Campo mancante nell'app:** “IVA:”
- **Campo mancante nell'app:** “CPA:”
- **Campo mancante nell'app:** “Rit. acc.”
- **Campo mancante nell'app:** “Nascondi tipo compenso:”

**Etichette diverse** (1)
- **Etichetta diversa:** app “Valore indeterminabile” ↔ sito “Valore €”

**Predefiniti diversi** (1)
- **Predefinito diverso** in “Valore indeterminabile” (sito “Valore €”): app: non selezionata — sito: vuoto

**Da verificare a mano** (9)
- _Da verificare:_ “Tipo di attività” — campi del sito con etichetta non leggibile: 6
- _Da verificare:_ “Valore della pratica €” — campi del sito con etichetta non leggibile: 6
- _Da verificare:_ “Complessità” — campi del sito con etichetta non leggibile: 6
- _Da verificare:_ campo sito senza etichetta leggibile (nome: TipoCompenso, tipo: scelta, 2 opzioni)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Fsel1, tipo: casella)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Vsel1, tipo: scelta, 3 opzioni)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Val1, tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: DoSpeseGen, tipo: casella)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: PctSpeseGen, tipo: testo)

### Compenso Delegati Vendite Giudiziarie (`compenso-delegati-vendite`)

Pagina sito: `/servizi/calcolo-compenso-delegati-vendite-giudiziarie.php` · campi app: 16 · campi sito: 27 · esclusi perché riservati agli utenti registrati: “Dati Documento”

**Campi mancanti nell'app** (5)
- **Campo mancante nell'app:** “Descrizione:”
- **Campo mancante nell'app:** “Compenso totale €”
- **Campo mancante nell'app:** “Spese generali €”
- **Campo mancante nell'app:** “modifica:”
- **Campo mancante nell'app:** “Ritenuta d'acconto:”

**Etichette diverse** (7)
- **Etichetta diversa:** app “Tipo di vendita” ↔ sito “Vendita:”
- **Etichetta diversa:** app “Valore di aggiudicazione €” ↔ sito “Valore €”
- **Etichetta diversa:** app “Aggiudicazione/assegnazione” ↔ sito “Aggiudicazione:”
- **Etichetta diversa:** app “Trasferimento proprietà” ↔ sito “Trasferimento:”
- **Etichetta diversa:** app “Numero debitori (fase distribuzione)” ↔ sito “Numero debitori:”
- **Etichetta diversa:** app “Spese di registrazione €” ↔ sito “Spese registrazione:”
- **Etichetta diversa:** app “Quota a carico dell'aggiudicatario € (opzionale, se non indicata si applica il calcolo di legge)” ↔ sito “Carico aggiudicatario:”

**Opzioni diverse** (2)
- **Opzioni diverse** in “Tipo di vendita” (sito “Vendita:”): solo nell'app: "immobili", "mobili"; solo nel sito: "beni immobili beni mobili"
- **Opzioni diverse** in “Numero debitori (fase distribuzione)” (sito “Numero debitori:”): il sito offre una scelta (16 opzioni), l'app un campo libero

**Predefiniti diversi** (5)
- **Predefinito diverso** in “Tipo di vendita” (sito “Vendita:”): app: immobili — sito: BENI IMMOBILI BENI MOBILI
- **Predefinito diverso** in “Valore di aggiudicazione €” (sito “Valore €”): app: 0 — sito: vuoto
- **Predefinito diverso** in “Spese di registrazione €” (sito “Spese registrazione:”): app: 0 — sito: vuoto
- **Predefinito diverso** in “Altre spese €” (sito “Altre spese:”): app: 0 — sito: vuoto
- **Predefinito diverso** in “Quota a carico dell'aggiudicatario € (opzionale, se non indicata si applica il calcolo di legge)” (sito “Carico aggiudicatario:”): app: vuoto — sito: 550,00

**Da verificare a mano** (18)
- _Da verificare:_ “Variazione discrezionale” — campi del sito con etichetta non leggibile: 12
- _Da verificare:_ “Percentuale di variazione” — campi del sito con etichetta non leggibile: 12
- _Da verificare:_ “Applica IVA” — campi del sito con etichetta non leggibile: 12
- _Da verificare:_ “Percentuale IVA %” — campi del sito con etichetta non leggibile: 12
- _Da verificare:_ “Applica contributo previdenziale” — campi del sito con etichetta non leggibile: 12
- _Da verificare:_ “Percentuale di contribuzione %” — campi del sito con etichetta non leggibile: 12
- _Da verificare:_ campo sito senza etichetta leggibile (nome: SelAll, tipo: casella)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Compenso1, tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Compenso2, tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Compenso3, tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Compenso4, tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: TipoVar, tipo: scelta, 3 opzioni)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: PctVar, tipo: scelta, 61 opzioni)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: DoIva, tipo: casella)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: PctIva, tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: DoContr, tipo: casella)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: DesContr, tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: PctContr, tipo: testo)

### Interessi Vari sul Capitale Rivalutato (`interessi-vari-capitale-rivalutato`)

Pagina sito: `/servizi/calcolo-interessi-vari-capitale-rivalutato.php` · campi app: 13 · campi sito: 14

**Campi mancanti nell'app** (5)
- **Campo mancante nell'app:** “compresa:”
- **Campo mancante nell'app:** “Rivalutazione Monetaria:”
- **Campo mancante nell'app:** “Rivaluta rispetto a:”
- **Campo mancante nell'app:** “Ignora la svalutazione (deflazione):”
- **Campo mancante nell'app:** “Modalità di calcolo degli interessi:”

**Etichette diverse** (6)
- **Etichetta diversa:** app “Dal” ↔ sito “Data Inizio:”
- **Etichetta diversa:** app “Al” ↔ sito “Data Fine:”
- **Etichetta diversa:** app “Tasso fisso %” ↔ sito “Tasso:”
- **Etichetta diversa:** app “Maggiorazione punti % (facoltativa — default 8 per gli interessi di mora, 0 per gli altri)” ↔ sito “Interessi:”
- **Etichetta diversa:** app “Anatocismo” ↔ sito “Capitalizzazione interessi (anatocismo):”
- **Etichetta diversa:** app “Percentuale di applicazione della rivalutazione %” ↔ sito “Percentuale di Rivalutazione:”

**Opzioni diverse** (2)
- **Opzioni diverse** in “Maggiorazione punti % (facoltativa — default 8 per gli interessi di mora, 0 per gli altri)” (sito “Interessi:”): il sito offre una scelta (3 opzioni), l'app un campo libero
- **Opzioni diverse** in “Anatocismo” (sito “Capitalizzazione interessi (anatocismo):”): solo nell'app: "nessuna capitalizzazione", "trimestrale (1/1, 1/4, 1/7, 1/10)", "semestrale (1/1, 1/7)", "annuale (1/1)"; solo nel sito: "nessunatrimestralesemestraleannuale"

**Predefiniti diversi** (4)
- **Predefinito diverso** in “Dal” (sito “Data Inizio:”): app: oggi — sito: 30/09/2026
- **Predefinito diverso** in “Al” (sito “Data Fine:”): app: oggi — sito: 30/09/2026
- **Predefinito diverso** in “Maggiorazione punti % (facoltativa — default 8 per gli interessi di mora, 0 per gli altri)” (sito “Interessi:”): app: vuoto — sito: Legali
- **Predefinito diverso** in “Anatocismo” (sito “Capitalizzazione interessi (anatocismo):”): app: Nessuna capitalizzazione — sito: NessunaTrimestraleSemestraleAnnuale

**Ordine diverso** (2)
- **Ordine diverso:** “Tasso fisso %” (app, posizione 5) ↔ “Tasso:” (sito, posizione 12)
- **Ordine diverso:** “Percentuale di applicazione della rivalutazione %” (app, posizione 10) ↔ “Percentuale di Rivalutazione:” (sito, posizione 7)

**Da verificare a mano** (8)
- _Da verificare:_ “Tipo di interesse” — campi del sito con etichetta non leggibile: 2
- _Da verificare:_ “Rivaluta il capitale secondo l'indice FOI” — campi del sito con etichetta non leggibile: 2
- _Da verificare:_ “Modalità di rivalutazione” — campi del sito con etichetta non leggibile: 2
- _Da verificare:_ “Ignora la deflazione (se l'indice cala, non applica una rivalutazione negativa)” — campi del sito con etichetta non leggibile: 2
- _Da verificare:_ “Giorno iniziale” — campi del sito con etichetta non leggibile: 2
- _Da verificare:_ “Convenzione di calcolo dei giorni” — campi del sito con etichetta non leggibile: 2
- _Da verificare:_ campo sito senza etichetta leggibile (nome: DoMagg, tipo: casella)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: PctMagg, tipo: testo)

### Parametri 2014 Penale (`parametri-penali-2014`)

Pagina sito: `/servizi/calcolo-compenso-avvocati-parametri-penali-2014.php` · campi app: 32 · campi sito: 35 · esclusi perché riservati agli utenti registrati: “Dati Documento:”

**Campi mancanti nell'app** (4)
- **Campo mancante nell'app:** “Istruttoria / dibattiment.”
- **Campo mancante nell'app:** “Totale:”
- **Campo mancante nell'app:** “Rit. acc.”
- **Campo mancante nell'app:** “Nascondi tipo compenso:”

**Etichette diverse** (9)
- **Etichetta diversa:** app “Numero parti (stessa posizione processuale)” ↔ sito “Numero parti:”
- **Etichetta diversa:** app “Ulteriore valutazione (art. 12, comma 1)” ↔ sito “Ulteriore valutazione:”
- **Etichetta diversa:** app “Assenza di questioni di fatto e diritto (art. 12, comma 2)” ↔ sito “Assenza questioni di fatto e diritto:”
- **Etichetta diversa:** app “Gratuito patrocinio (riduzione di 1/3, art. 106 bis DPR 115/02)” ↔ sito “Gratuito patrocinio:”
- **Etichetta diversa:** app “Compenso liquidato al praticante abilitato (art. 17)” ↔ sito “Praticante abilitato:”
- **Etichetta diversa:** app “Spese esenti € (art. 15 DPR 633/72)” ↔ sito “Spese esenti €”
- **Etichetta diversa:** app “Altre spese imponibili € (non relative a trasferte)” ↔ sito “Altre spese imponibili €”
- **Etichetta diversa:** app “CPA (Cassa Avvocati 4%)” ↔ sito “CPA:”
- **Etichetta diversa:** app “IVA 22%” ↔ sito “IVA:”

**Opzioni diverse** (1)
- **Opzioni diverse** in “Numero parti (stessa posizione processuale)” (sito “Numero parti:”): il sito offre una scelta (30 opzioni), l'app un campo libero

**Predefiniti diversi** (2)
- **Predefinito diverso** in “Tabelle” (sito “Tabelle:”): app: 2022 — sito: 2022 (vigenti)
- **Predefinito diverso** in “Competenza” (sito “Competenza:”): app: 570 — sito: Tribunale monocratico

**Ordine diverso** (1)
- **Ordine diverso:** “CPA (Cassa Avvocati 4%)” (app, posizione 30) ↔ “CPA:” (sito, posizione 33)

**Da verificare a mano** (39)
- _Da verificare:_ “Compenso di tutte le fasi” — campi del sito con etichetta non leggibile: 19
- _Da verificare:_ “Includi la fase” — campi del sito con etichetta non leggibile: 19 (×4)
- _Da verificare:_ “Valore” — campi del sito con etichetta non leggibile: 19 (×4)
- _Da verificare:_ “Compenso personalizzato € (facoltativo)” — campi del sito con etichetta non leggibile: 19 (×4)
- _Da verificare:_ “Aumento per più parti” — campi del sito con etichetta non leggibile: 19
- _Da verificare:_ “Aumento %” — campi del sito con etichetta non leggibile: 19
- _Da verificare:_ “Riduzione %” — campi del sito con etichetta non leggibile: 19 (×2)
- _Da verificare:_ “Spese generali” — campi del sito con etichetta non leggibile: 19
- _Da verificare:_ “Percentuale spese generali” — campi del sito con etichetta non leggibile: 19
- _Da verificare:_ “Ritenuta d'acconto 20%” — campi del sito con etichetta non leggibile: 19
- _Da verificare:_ campo sito senza etichetta leggibile (nome: FselAll, tipo: casella)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: VselAll, tipo: scelta, 3 opzioni)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Fsel1, tipo: casella)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Vsel1, tipo: scelta, 3 opzioni)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Val1, tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Fsel2, tipo: casella)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Vsel2, tipo: scelta, 3 opzioni)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Val2, tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Vsel3, tipo: scelta, 3 opzioni)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Val3, tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Fsel4, tipo: casella)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Vsel4, tipo: scelta, 3 opzioni)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Val4, tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: PctPiuParti, tipo: scelta, 1 opzioni)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: PctImportanza, tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: PctAssenzaQfd, tipo: scelta, 30 opzioni)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: PctPraticante, tipo: scelta, 50 opzioni)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: DoSpeseGen, tipo: casella)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: PctSpeseGen, tipo: testo)

### Calcolo Compenso a Ore (`compenso-ore`)

Pagina sito: `/servizi/calcolo-somma-ore-minuti-compensi-a-tempo.php` · campi app: 13 · campi sito: 3

**Campi in più nell'app** (10)
- **Campo in più nell'app:** “Segno” (×4)
- **Campo in più nell'app:** “Ore” (×3)
- **Campo in più nell'app:** “Minuti” (×3)

**Etichette diverse** (3)
- **Etichetta diversa:** app “Ore” ↔ sito “[etichetta non leggibile, nome Ore]”
- **Etichetta diversa:** app “Minuti” ↔ sito “[etichetta non leggibile, nome Minuti]”
- **Etichetta diversa:** app “Tariffa oraria € (opzionale)” ↔ sito “Tariffa Oraria €”

**Predefiniti diversi** (2)
- **Predefinito diverso** in “Ore” (sito “[etichetta non leggibile, nome Ore]”): app: 0 — sito: vuoto
- **Predefinito diverso** in “Minuti” (sito “[etichetta non leggibile, nome Minuti]”): app: 0 — sito: vuoto

**Ordine diverso** (1)
- **Ordine diverso:** “Tariffa oraria € (opzionale)” (app, posizione 13) ↔ “Tariffa Oraria €” (sito, posizione 1)

### Danno Parentale Milano (`danno-perdita-parentale-milano`)

Pagina sito: `/servizi/calcolo-danno-perdita-parentale-tribunale-milano.php` · campi app: 8 · campi sito: 11

**Campi mancanti nell'app** (3)
- **Campo mancante nell'app:** “Tabella di Riferimento:”
- **Campo mancante nell'app:** “Il Congiunto è:”
- **Campo mancante nell'app:** “Valore del punto:”

**Etichette diverse** (6)
- **Etichetta diversa:** app “Età del congiunto superstite” ↔ sito “Età del congiunto:”
- **Etichetta diversa:** app “Età della vittima al momento del decesso” ↔ sito “Età della vittima:”
- **Etichetta diversa:** app “Convivenza tra congiunto e vittima” ↔ sito “Convivenza con la vittima:”
- **Etichetta diversa:** app “Stesso condominio (se non convivenza)” ↔ sito “Stesso stabile/condominio:”
- **Etichetta diversa:** app “Numero di altri familiari nel nucleo primario” ↔ sito “Altri familiari:”
- **Etichetta diversa:** app “Qualità/intensità della relazione affettiva (0-30)” ↔ sito “Intensità della relazione:”

**Opzioni diverse** (3)
- **Opzioni diverse** in “Età del congiunto superstite” (sito “Età del congiunto:”): il sito offre una scelta (102 opzioni), l'app un campo libero
- **Opzioni diverse** in “Età della vittima al momento del decesso” (sito “Età della vittima:”): il sito offre una scelta (102 opzioni), l'app un campo libero
- **Opzioni diverse** in “Qualità/intensità della relazione affettiva (0-30)” (sito “Intensità della relazione:”): il sito offre una scelta (3 opzioni), l'app un campo libero

**Predefiniti diversi** (4)
- **Predefinito diverso** in “Convivenza tra congiunto e vittima” (sito “Convivenza con la vittima:”): app: non selezionata — sito: selezionata
- **Predefinito diverso** in “Durata della convivenza” (sito “Durata della convivenza:”): app: meno_30 — sito: meno di 30 anni
- **Predefinito diverso** in “Numero di altri familiari nel nucleo primario” (sito “Altri familiari:”): app: 0 — sito: 2
- **Predefinito diverso** in “Qualità/intensità della relazione affettiva (0-30)” (sito “Intensità della relazione:”): app: 15 — sito: minmedmax0123456789101112131415161718192021222324252627282930

**Da verificare a mano** (2)
- _Da verificare:_ “Grado di parentela” — campi del sito con etichetta non leggibile: 1
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Relazione, tipo: scelta, 31 opzioni)

### Parametri 2012 Penale (`parametri-penali-2012`)

Pagina sito: `/servizi/calcolo-compenso-avvocati-parametri-ministeriali-penali.php` · campi app: 34 · campi sito: 35

**Campi mancanti nell'app** (4)
- **Campo mancante nell'app:** “Istruttoria”
- **Campo mancante nell'app:** “Decisoria”
- **Campo mancante nell'app:** “Esecutiva”
- **Campo mancante nell'app:** “Rit. acc.”

**Etichette diverse** (9)
- **Etichetta diversa:** app “Incarico collegiale (art. 1, comma 4)” ↔ sito “Incarico collegiale:”
- **Etichetta diversa:** app “Più parti (art. 12, comma 4)” ↔ sito “Più parti:”
- **Etichetta diversa:** app “Ulteriore valutazione (art. 12, commi 2 e 3)” ↔ sito “Ulteriore valutazione:”
- **Etichetta diversa:** app “Assistenza d'ufficio a minori (art. 12, comma 5)” ↔ sito “Assistenza d'ufficioa minori:”
- **Etichetta diversa:** app “Riduzione %” ↔ sito “riduzione del:”
- **Etichetta diversa:** app “Gratuito patrocinio (riduzione del 50%, art. 12, comma 7)” ↔ sito “Gratuito patrocinio:”
- **Etichetta diversa:** app “Spese esenti € (art. 15 DPR 633/72)” ↔ sito “Spese esenti €”
- **Etichetta diversa:** app “CPA (Cassa Avvocati 4%)” ↔ sito “CPA:”
- **Etichetta diversa:** app “IVA 22%” ↔ sito “IVA:”

**Opzioni diverse** (1)
- **Opzioni diverse** in “Riduzione %” (sito “riduzione del:”): solo nell'app: "50%", "49%", "48%", "47%", "46%", "45%", "44%", "43%", "42%", "41%", "40%", "39%", "38%", "37%", "36%", "35%", "34%", "33%", "32%", "31%", "30%", "29%", "28%", "27%", "26%", "25%", "24%", "23%", "22%", "21%", "20%", "19%", "18%", "17%", "16%", "15%", "14%", "13%", "12%", "11%", "10%", "9%", "8%", "7%", "6%", "5%", "4%", "3%", "2%", "1%"; solo nel sito: "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31", "32", "33", "34", "35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46", "47", "48", "49", "50"

**Predefiniti diversi** (1)
- **Predefinito diverso** in “Competenza” (sito “Competenza:”): app: 210 — sito: Tribunale monocratico

**Ordine diverso** (1)
- **Ordine diverso:** “CPA (Cassa Avvocati 4%)” (app, posizione 32) ↔ “CPA:” (sito, posizione 34)

**Da verificare a mano** (43)
- _Da verificare:_ “Compenso di tutte le fasi” — campi del sito con etichetta non leggibile: 20
- _Da verificare:_ “Includi la fase” — campi del sito con etichetta non leggibile: 20 (×5)
- _Da verificare:_ “Valore” — campi del sito con etichetta non leggibile: 20 (×5)
- _Da verificare:_ “Compenso personalizzato € (facoltativo)” — campi del sito con etichetta non leggibile: 20 (×4)
- _Da verificare:_ “Tariffa oraria personalizzata €/ora (facoltativo)” — campi del sito con etichetta non leggibile: 20
- _Da verificare:_ “Ore (numero intero)” — campi del sito con etichetta non leggibile: 20
- _Da verificare:_ “Aumento %” — campi del sito con etichetta non leggibile: 20 (×3)
- _Da verificare:_ “Spese generali” — campi del sito con etichetta non leggibile: 20
- _Da verificare:_ “Percentuale spese generali” — campi del sito con etichetta non leggibile: 20
- _Da verificare:_ “Ritenuta d'acconto 20%” — campi del sito con etichetta non leggibile: 20
- _Da verificare:_ campo sito senza etichetta leggibile (nome: FselAll, tipo: casella)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: VselAll, tipo: scelta, 3 opzioni)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Fsel1, tipo: casella)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Vsel1, tipo: scelta, 3 opzioni)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Val1, tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Fsel2, tipo: casella)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Vsel2, tipo: scelta, 3 opzioni)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Val2, tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Vsel3, tipo: scelta, 3 opzioni)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Val3, tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Vsel4, tipo: scelta, 3 opzioni)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Val4, tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Vsel5, tipo: scelta, 3 opzioni)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Val5, tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Qta5, tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: PctCollegiale, tipo: scelta, 20 opzioni)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: PctPiuParti, tipo: scelta, 20 opzioni)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: PctImportanza, tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: DoSpeseGen, tipo: casella)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: PctSpeseGen, tipo: testo)

### Calcolo IMU (`imu`)

Pagina sito: `/servizi/calcolo-imu-nuova-ici.php` · campi app: 14 · campi sito: 15

**Campi mancanti nell'app** (2)
- **Campo mancante nell'app:** “Rendita pertinenze €”
- **Campo mancante nell'app:** “Titolari residenti:”

**Etichette diverse** (8)
- **Etichetta diversa:** app “Categoria catastale” ↔ sito “Categoria catastale dell'immobile:”
- **Etichetta diversa:** app “Abitazione principale (prima casa)” ↔ sito “Prima casa:”
- **Etichetta diversa:** app “Rendita catastale pertinenze € (opzionale)” ↔ sito “Rendita catastale €”
- **Etichetta diversa:** app “Aliquota deliberata dal Comune (per mille)” ↔ sito “Aliquota:”
- **Etichetta diversa:** app “Quota di possesso %” ↔ sito “Quota di possesso:”
- **Etichetta diversa:** app “Mesi in comodato” ↔ sito “In comodato:”
- **Etichetta diversa:** app “Mesi a canone concordato” ↔ sito “Canone concordato:”
- **Etichetta diversa:** app “Numero di titolari con diritto alla detrazione” ↔ sito “Detrazione:”

**Predefiniti diversi** (5)
- **Predefinito diverso** in “Categoria catastale” (sito “Categoria catastale dell'immobile:”): app: A — sito: Abitazioni da A/2 ad A/7 e relative pertinenze
- **Predefinito diverso** in “Rendita catastale pertinenze € (opzionale)” (sito “Rendita catastale €”): app: 0 — sito: vuoto
- **Predefinito diverso** in “Mesi in comodato” (sito “In comodato:”): app: 0 — sito: non selezionata
- **Predefinito diverso** in “Mesi a canone concordato” (sito “Canone concordato:”): app: 0 — sito: non selezionata
- **Predefinito diverso** in “Numero di titolari con diritto alla detrazione” (sito “Detrazione:”): app: 1 — sito: 200,00

**Da verificare a mano** (11)
- _Da verificare:_ “Valore venale di mercato €” — campi del sito con etichetta non leggibile: 5
- _Da verificare:_ “Rendita catastale non rivalutata € (reddito dominicale per i terreni)” — campi del sito con etichetta non leggibile: 5
- _Da verificare:_ “Mesi di possesso nell'anno” — campi del sito con etichetta non leggibile: 5
- _Da verificare:_ “Immobile concesso in comodato a parenti di primo grado” — campi del sito con etichetta non leggibile: 5
- _Da verificare:_ “Immobile locato a canone concordato” — campi del sito con etichetta non leggibile: 5
- _Da verificare:_ “Detrazione prima casa € (solo A/1, A/8, A/9)” — campi del sito con etichetta non leggibile: 5
- _Da verificare:_ campo sito senza etichetta leggibile (nome: RenditeCatastaliPertinenze2, tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: RenditeCatastaliPertinenze3, tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: MesiPossesso, tipo: scelta, 12 opzioni)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: MesiComodato, tipo: scelta, 12 opzioni)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: MesiCanoneConcordato, tipo: scelta, 12 opzioni)

### Interessi 1284 cc (`interessi-corso-causa`)

Pagina sito: `/servizi/calcolo-interessi-corso-causa.php` · campi app: 7 · campi sito: 8

**Campi mancanti nell'app** (5)
- **Campo mancante nell'app:** “Importo credito:”
- **Campo mancante nell'app:** “Tasso fisso:”
- **Campo mancante nell'app:** “Interessi: (nascosto all'avvio)”
- **Campo mancante nell'app:** “Rivaluta annualmente:”
- **Campo mancante nell'app:** “Rivaluta al:”

**Campi in più nell'app** (4)
- **Campo in più nell'app:** “Capitale €”
- **Campo in più nell'app:** “Tasso di mora convenzionale %, se pattuito (opzionale)”
- **Campo in più nell'app:** “Applica rivalutazione monetaria (Cass. SU 1712/1995)”
- **Campo in più nell'app:** “Percentuale di rivalutazione”

**Etichette diverse** (3)
- **Etichetta diversa:** app “Decorrenza del credito” ↔ sito “Decorrenza credito:”
- **Etichetta diversa:** app “Data della domanda giudiziale” ↔ sito “Domanda giudiziale:”
- **Etichetta diversa:** app “Data finale” ↔ sito “Calcola interessi al:”

**Predefiniti diversi** (3)
- **Predefinito diverso** in “Decorrenza del credito” (sito “Decorrenza credito:”): app: vuoto — sito: oggi (15/11/2026)
- **Predefinito diverso** in “Data della domanda giudiziale” (sito “Domanda giudiziale:”): app: vuoto — sito: oggi (15/11/2026)
- **Predefinito diverso** in “Data finale” (sito “Calcola interessi al:”): app: vuoto — sito: oggi (15/11/2026)

### Calcolo TAEG (`taeg`)

Pagina sito: `/servizi/calcolo-taeg.php` · campi app: 11 · campi sito: 13

**Campi mancanti nell'app** (1)
- **Campo mancante nell'app:** “Numero Totale Rate:”

**Etichette diverse** (6)
- **Etichetta diversa:** app “Tasso annuale nominale (TAN) %” ↔ sito “Tasso Annuale Nominale:”
- **Etichetta diversa:** app “Spese di istruttoria €” ↔ sito “Spese Istruttoria €”
- **Etichetta diversa:** app “Costo di mediazione €” ↔ sito “Costo Mediazione €”
- **Etichetta diversa:** app “Altre spese iniziali €” ↔ sito “Altre Spese €”
- **Etichetta diversa:** app “Spese di incasso rata €” ↔ sito “Spese Incasso Rata €”
- **Etichetta diversa:** app “Spese assicurative per rata €” ↔ sito “Spese Assicurative €”

**Predefiniti diversi** (8)
- **Predefinito diverso** in “Periodicità rate” (sito “Periodicità Rate:”): app: 12 — sito: Mensile = 12 rate all'anno
- **Predefinito diverso** in “Spese di istruttoria €” (sito “Spese Istruttoria €”): app: 0 — sito: vuoto
- **Predefinito diverso** in “Costo di mediazione €” (sito “Costo Mediazione €”): app: 0 — sito: vuoto
- **Predefinito diverso** in “Spese notarili €” (sito “Spese Notarili €”): app: 0 — sito: vuoto
- **Predefinito diverso** in “Altre spese iniziali €” (sito “Altre Spese €”): app: 0 — sito: vuoto
- **Predefinito diverso** in “Spese di incasso rata €” (sito “Spese Incasso Rata €”): app: 0 — sito: vuoto
- **Predefinito diverso** in “Spese assicurative per rata €” (sito “Spese Assicurative €”): app: 0 — sito: vuoto
- **Predefinito diverso** in “Spese di gestione annuali €” (sito “Spese di Gestione Annuali €”): app: 0 — sito: vuoto

**Da verificare a mano** (3)
- _Da verificare:_ “Durata in anni” — campi del sito con etichetta non leggibile: 2
- _Da verificare:_ campo sito senza etichetta leggibile (nome: TipoDurata, tipo: scelta, 2 opzioni)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: DurataAnni, tipo: scelta, 40 opzioni)

### Pignoramento stipendio o pensione (`pignoramento-stipendio-pensione`)

Pagina sito: `/servizi/calcolo-pignoramento-stipendio-pensione.php` · campi app: 11 · campi sito: 10

**Campi mancanti nell'app** (5)
- **Campo mancante nell'app:** “Totale da pignorare €:”
- **Campo mancante nell'app:** “Cosa pignorare:”
- **Campo mancante nell'app:** “Accredito su CC:”
- **Campo mancante nell'app:** “Liquidità su CC €: (nascosto all'avvio)”
- **Campo mancante nell'app:** “Quota pignorabile: (nascosto all'avvio)”

**Etichette diverse** (3)
- **Etichetta diversa:** app “Numero di mensilità annue” ↔ sito “Mensilità:”
- **Etichetta diversa:** app “Credito di natura alimentare” ↔ sito “Credito alimentare:”
- **Etichetta diversa:** app “Tipo di creditore” ↔ sito “Creditore:”

**Opzioni diverse** (3)
- **Opzioni diverse** in “Numero di mensilità annue” (sito “Mensilità:”): solo nell'app: "12", "13", "14"; solo nel sito: "121314"
- **Opzioni diverse** in “Credito di natura alimentare” (sito “Credito alimentare:”): il sito offre una scelta (2 opzioni), l'app un campo libero
- **Opzioni diverse** in “Tipo di creditore” (sito “Creditore:”): solo nell'app: "ordinario", "agenzia delle entrate - riscossione"; solo nel sito: "ordinarioagenzia delle entrate"

**Predefiniti diversi** (3)
- **Predefinito diverso** in “Numero di mensilità annue” (sito “Mensilità:”): app: 13 — sito: 121314
- **Predefinito diverso** in “Credito di natura alimentare” (sito “Credito alimentare:”): app: non selezionata — sito: NoSi
- **Predefinito diverso** in “Tipo di creditore” (sito “Creditore:”): app: ordinario — sito: OrdinarioAgenzia delle Entrate

**Da verificare a mano** (10)
- _Da verificare:_ “Tipo di importo” — campi del sito con etichetta non leggibile: 2
- _Da verificare:_ “Importo netto €” — campi del sito con etichetta non leggibile: 2
- _Da verificare:_ “Frequenza” — campi del sito con etichetta non leggibile: 2
- _Da verificare:_ “Accreditato su conto corrente” — campi del sito con etichetta non leggibile: 2
- _Da verificare:_ “Giacenza media sul conto €” — campi del sito con etichetta non leggibile: 2
- _Da verificare:_ “Frazione personalizzata — numeratore (il giudice può fissarla liberamente)” — campi del sito con etichetta non leggibile: 2
- _Da verificare:_ “Frazione personalizzata — denominatore” — campi del sito con etichetta non leggibile: 2
- _Da verificare:_ “Debito totale da recuperare € (opzionale)” — campi del sito con etichetta non leggibile: 2
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Importo, tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: FreqImporto, tipo: scelta, 2 opzioni)

### Ricevuta Prestazione Occasionale (`ricevuta-occasionale`)

Pagina sito: `/servizi/calcolo-ricevuta-prestazione-occasionale.php` · campi app: 22 · campi sito: 26 · esclusi perché riservati agli utenti registrati: “Intestazione:”, “Ricorda i dati:”

**Campi mancanti nell'app** (2)
- **Campo mancante nell'app:** “Totale compenso: (nascosto all'avvio)”
- **Campo mancante nell'app:** “Totale spese: (nascosto all'avvio)”

**Etichette diverse** (7)
- **Etichetta diversa:** app “Data ricevuta (data del pagamento, dal 2025 al 2027)” ↔ sito “Data ricevuta:”
- **Etichetta diversa:** app “Compensi (max 20)” ↔ sito “(riga ripetibile: DescrComp)” (lista abbinata per posizione)
- **Etichetta diversa:** app “Spese documentate da rimborsare (max 50)” ↔ sito “(riga ripetibile: ImpComp)” (lista abbinata per posizione)
- **Etichetta diversa:** app “Addebito bollo (al committente; dovuto se il compenso lordo supera 77,47 €)” ↔ sito “Addebito bollo:”
- **Etichetta diversa:** app “Totale compensi già percepiti nell'anno € (escluso quello della presente ricevuta)” ↔ sito “Inserisci l'importo totale dei compensi percepiti nell’anno:”
- **Etichetta diversa:** app “Posizione previdenziale” ↔ sito “Seleziona la tua posizione previdenziale:”
- **Etichetta diversa:** app “Aliquota INPS % (vuoto = predefinita: 35,03 gestione separata, 24 altre forme)” ↔ sito “Aliquota INPS:”

**Opzioni diverse** (1)
- **Opzioni diverse** in “Hai già percepito nell'anno altri compensi da lavoro occasionale?” (sito “Hai già percepito nell'anno altri compensi da lavoro occasionale?”): solo nell'app: "no", "sì"; solo nel sito: "nosi"

**Predefiniti diversi** (4)
- **Predefinito diverso** in “Data ricevuta (data del pagamento, dal 2025 al 2027)” (sito “Data ricevuta:”): app: vuoto — sito: 15/11/2026
- **Predefinito diverso** in “Hai già percepito nell'anno altri compensi da lavoro occasionale?” (sito “Hai già percepito nell'anno altri compensi da lavoro occasionale?”): app: no — sito: NoSi
- **Predefinito diverso** in “Posizione previdenziale” (sito “Seleziona la tua posizione previdenziale:”): app: 1 — sito: Iscritto esclusivamente alla gestione separata
- **Predefinito diverso** in “Aliquota INPS % (vuoto = predefinita: 35,03 gestione separata, 24 altre forme)” (sito “Aliquota INPS:”): app: vuoto — sito: 35,03

**Da verificare a mano** (18)
- _Da verificare:_ “Spese forfettarie (costituiscono reddito)” — campi del sito con etichetta non leggibile: 5
- _Da verificare:_ “Spese forfettarie % sul compenso” — campi del sito con etichetta non leggibile: 5
- _Da verificare:_ “oppure importo spese forfettarie € (prevale sulla percentuale)” — campi del sito con etichetta non leggibile: 5
- _Da verificare:_ “Ritenuta d'acconto (il committente è sostituto d'imposta)” — campi del sito con etichetta non leggibile: 5
- _Da verificare:_ “Ritenuta d'acconto %” — campi del sito con etichetta non leggibile: 5
- _Da verificare:_ riga ripetibile del sito non abbinata ((riga ripetibile: SpDescr), 1 campi)
- _Da verificare:_ riga ripetibile del sito non abbinata ((riga ripetibile: SpVal), 1 campi)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: DoSpeseGen, tipo: casella)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: PctSpeseGen, tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: ImpSpeseGen, tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: DoRacc, tipo: casella)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: PctRacc, tipo: testo)
- _Da verificare:_ “Descrizione” — campi del sito con etichetta non leggibile: 1
- _Da verificare:_ “Importo €” — campi del sito con etichetta non leggibile: 1 (×2)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: DescrComp, tipo: testo)
- _Da verificare:_ “Descrizione voce di spesa” — campi del sito con etichetta non leggibile: 1
- _Da verificare:_ campo sito senza etichetta leggibile (nome: ImpComp, tipo: testo)

### Termini Procedimento Semplificato (`termini-procedimento-semplificato`)

Pagina sito: `/servizi/calcolo-termini-procedimento-semplificato.php` · campi app: 6 · campi sito: 6

**Campi mancanti nell'app** (2)
- **Campo mancante nell'app:** “Sospensione straordinaria: (nascosto all'avvio)”
- **Campo mancante nell'app:** “Modalità prudenziale:”

**Campi in più nell'app** (2)
- **Campo in più nell'app:** “Applica sospensione Covid-19 (9/3-11/5/2020)”
- **Campo in più nell'app:** “Calcolo prudenziale (termine più favorevole)”

**Etichette diverse** (4)
- **Etichetta diversa:** app “Data della prima udienza” ↔ sito “Data prima udienza:”
- **Etichetta diversa:** app “Giorni per il primo termine” ↔ sito “Primo termine:”
- **Etichetta diversa:** app “Giorni per il secondo termine” ↔ sito “Secondo termine:”
- **Etichetta diversa:** app “Applica sospensione feriale (1-31 agosto)” ↔ sito “Sospensione feriale:”

**Opzioni diverse** (2)
- **Opzioni diverse** in “Giorni per il primo termine” (sito “Primo termine:”): il sito offre una scelta (20 opzioni), l'app un campo libero
- **Opzioni diverse** in “Giorni per il secondo termine” (sito “Secondo termine:”): il sito offre una scelta (10 opzioni), l'app un campo libero

**Predefiniti diversi** (4)
- **Predefinito diverso** in “Data della prima udienza” (sito “Data prima udienza:”): app: vuoto — sito: oggi (15/11/2026)
- **Predefinito diverso** in “Giorni per il primo termine” (sito “Primo termine:”): app: vuoto — sito: 20
- **Predefinito diverso** in “Giorni per il secondo termine” (sito “Secondo termine:”): app: vuoto — sito: 10
- **Predefinito diverso** in “Applica sospensione feriale (1-31 agosto)” (sito “Sospensione feriale:”): app: non selezionata — sito: selezionata

### Danno Parentale Roma (`danno-perdita-parentale-roma`)

Pagina sito: `/servizi/calcolo-risarcimento-danno-perdita-parentale.php` · campi app: 6 · campi sito: 7

**Campi mancanti nell'app** (2)
- **Campo mancante nell'app:** “Tabella di Riferimento:”
- **Campo mancante nell'app:** “Il Congiunto è:”

**Campi in più nell'app** (1)
- **Campo in più nell'app:** “Grado di parentela”

**Etichette diverse** (4)
- **Etichetta diversa:** app “Età del congiunto superstite” ↔ sito “Età del congiunto:”
- **Etichetta diversa:** app “Età della vittima al momento del decesso” ↔ sito “Età della vittima:”
- **Etichetta diversa:** app “Presenza di altri familiari conviventi del congiunto” ↔ sito “Altri familiari conviventi:”
- **Etichetta diversa:** app “Presenza di altri familiari non conviventi entro il 2° grado” ↔ sito “Altri familiari non conviventi:”

**Opzioni diverse** (2)
- **Opzioni diverse** in “Età del congiunto superstite” (sito “Età del congiunto:”): il sito offre una scelta (111 opzioni), l'app un campo libero
- **Opzioni diverse** in “Età della vittima al momento del decesso” (sito “Età della vittima:”): il sito offre una scelta (111 opzioni), l'app un campo libero

**Predefiniti diversi** (3)
- **Predefinito diverso** in “Età del congiunto superstite” (sito “Età del congiunto:”): app: vuoto — sito: 0
- **Predefinito diverso** in “Età della vittima al momento del decesso” (sito “Età della vittima:”): app: vuoto — sito: 0
- **Predefinito diverso** in “Convivenza con la vittima” (sito “Convivenza con la vittima:”): app: non selezionata — sito: selezionata

**Ordine diverso** (1)
- **Ordine diverso:** “Età del congiunto superstite” (app, posizione 2) ↔ “Età del congiunto:” (sito, posizione 4)

### Calcolo Fattura Enasarco (`fattura-enasarco`)

Pagina sito: `/servizi/calcolo_fattura_agente_enasarco.php` · campi app: 16 · campi sito: 16 · esclusi perché riservati agli utenti registrati: “Dati Fattura”, “Ricorda opzioni:”

**Etichette diverse** (4)
- **Etichetta diversa:** app “Importo € (provvigioni e/o premi da fatturare)” ↔ sito “Importo €”
- **Etichetta diversa:** app “Provvigione % sulle vendite” ↔ sito “Provvigione:”
- **Etichetta diversa:** app “Spese Esenti € (art. 15, DPR 633/72)” ↔ sito “Spese Esenti €”
- **Etichetta diversa:** app “Addebito bollo (al cliente)” ↔ sito “Addebito bollo:”

**Opzioni diverse** (1)
- **Opzioni diverse** in “Inquadramento per ritenuta d'acconto” (sito “Inquadramento per ritenuta d'acconto:”): solo nell'app: "senza collaboratori né dipendenti (50% dell'imponibile)", "con collaboratori e/o dipendenti (20% dell'imponibile)", "agente di vendita a domicilio (78% dell'imponibile)"; solo nel sito: "senza collaboratori né dipendenti", "con collaboratori e/o dipendenti", "agente di vendita a domicilio"

**Predefiniti diversi** (7)
- **Predefinito diverso** in “Importo € (provvigioni e/o premi da fatturare)” (sito “Importo €”): app: vuoto — sito: 0,00
- **Predefinito diverso** in “Vendite €” (sito “Vendite €”): app: vuoto — sito: 0,00
- **Predefinito diverso** in “Provvigione % sulle vendite” (sito “Provvigione:”): app: vuoto — sito: 0,00
- **Predefinito diverso** in “Spese Esenti € (art. 15, DPR 633/72)” (sito “Spese Esenti €”): app: vuoto — sito: 0,00
- **Predefinito diverso** in “Spese Imponibili €” (sito “Spese Imponibili €”): app: vuoto — sito: 0,00
- **Predefinito diverso** in “Inquadramento per ritenuta d'acconto” (sito “Inquadramento per ritenuta d'acconto:”): app: 1 — sito: Senza collaboratori né dipendenti
- **Predefinito diverso** in “Tipo Regime” (sito “Tipo Regime:”): app: 1 — sito: Regime forfettario agevolato 2014

**Ordine diverso** (1)
- **Ordine diverso:** “Calcola dalle Vendite” (app, posizione 1) ↔ “Calcola dalle Vendite” (sito, posizione 2)

**Da verificare a mano** (12)
- _Da verificare:_ “IVA” — campi del sito con etichetta non leggibile: 6
- _Da verificare:_ “IVA %” — campi del sito con etichetta non leggibile: 6
- _Da verificare:_ “Contributo Enasarco (togli la spunta se hai raggiunto il massimale)” — campi del sito con etichetta non leggibile: 6
- _Da verificare:_ “Contributo Enasarco %” — campi del sito con etichetta non leggibile: 6
- _Da verificare:_ “Ritenuta d'Acconto” — campi del sito con etichetta non leggibile: 6
- _Da verificare:_ “Ritenuta d'acconto %” — campi del sito con etichetta non leggibile: 6
- _Da verificare:_ campo sito senza etichetta leggibile (nome: DoIva, tipo: casella)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: PctIva, tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: DoEnasarco, tipo: casella)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: PctEnasarco, tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: DoRacc, tipo: casella)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: PctRacc, tipo: testo)

### Calcolo Eredità (`quote-ereditarie`)

Pagina sito: `/servizi/calcolo_quote_ereditarie.php` · campi app: 7 · campi sito: 6

**Campi mancanti nell'app** (1)
- **Campo mancante nell'app:** “Valore del Patrimonio €”

**Campi in più nell'app** (2)
- **Campo in più nell'app:** “Modalità”
- **Campo in più nell'app:** “Patrimonio ereditario €”

**Etichette diverse** (5)
- **Etichetta diversa:** app “Coniuge superstite” ↔ sito “Coniuge:”
- **Etichetta diversa:** app “Numero di figli” ↔ sito “Figli:”
- **Etichetta diversa:** app “Numero di ascendenti (genitori, max 2)” ↔ sito “Ascendenti:”
- **Etichetta diversa:** app “Numero di fratelli” ↔ sito “Fratelli:”
- **Etichetta diversa:** app “Numero di altri parenti entro il 6° grado” ↔ sito “Parenti < 6° grado:”

**Predefiniti diversi** (5)
- **Predefinito diverso** in “Coniuge superstite” (sito “Coniuge:”): app: non selezionata — sito: selezionata
- **Predefinito diverso** in “Numero di figli” (sito “Figli:”): app: 0 — sito: vuoto
- **Predefinito diverso** in “Numero di ascendenti (genitori, max 2)” (sito “Ascendenti:”): app: 0 — sito: vuoto
- **Predefinito diverso** in “Numero di fratelli” (sito “Fratelli:”): app: 0 — sito: vuoto
- **Predefinito diverso** in “Numero di altri parenti entro il 6° grado” (sito “Parenti < 6° grado:”): app: 0 — sito: vuoto

### Scadenze Impugnazioni (`termini-impugnazione`)

Pagina sito: `/servizi/termini-impugnazioni-civile-amministrativo-tributario.php` · campi app: 7 · campi sito: 5

**Campi mancanti nell'app** (2)
- **Campo mancante nell'app:** “Dalla data di:”
- **Campo mancante nell'app:** “CALCOLO TERMINI per le IMPUGNAZIONI”

**Campi in più nell'app** (4)
- **Campo in più nell'app:** “Motivo”
- **Campo in più nell'app:** “Data notificazione sentenza, se notificata”
- **Campo in più nell'app:** “Data di scoperta del vizio/dolo”
- **Campo in più nell'app:** “Applica sospensione feriale (1-31 agosto)”

**Etichette diverse** (3)
- **Etichetta diversa:** app “Tipo di processo” ↔ sito “Processo:”
- **Etichetta diversa:** app “Tipo di impugnazione” ↔ sito “Impugnazione:”
- **Etichetta diversa:** app “Data pubblicazione sentenza” ↔ sito “giorno:”

**Opzioni diverse** (1)
- **Opzioni diverse** in “Tipo di processo” (sito “Processo:”): solo nell'app: "civile", "amministrativo", "tributario"; solo nel sito: "civile amministrativo tributario"

**Predefiniti diversi** (3)
- **Predefinito diverso** in “Tipo di processo” (sito “Processo:”): app: civile — sito: CIVILE AMMINISTRATIVO TRIBUTARIO
- **Predefinito diverso** in “Tipo di impugnazione” (sito “Impugnazione:”): app: appello — sito: Ricorso in Appello
- **Predefinito diverso** in “Data pubblicazione sentenza” (sito “giorno:”): app: vuoto — sito: oggi (15/11/2026)

### Compenso Mediatore Familiare (`compenso-mediatore-familiare`)

Pagina sito: `/servizi/calcolo-compenso-mediatore-familiare.php` · campi app: 6 · campi sito: 10 · esclusi perché riservati agli utenti registrati: “Intestazione:”

**Campi mancanti nell'app** (3)
- **Campo mancante nell'app:** “Cassa di previdenza:”
- **Campo mancante nell'app:** “Tipo regime: (nascosto all'avvio)”
- **Campo mancante nell'app:** “Addebito bollo: (nascosto all'avvio)”

**Etichette diverse** (3)
- **Etichetta diversa:** app “Complessità” ↔ sito “Complessità incarico:”
- **Etichetta diversa:** app “Numero di incontri” ↔ sito “Numero incontri:”
- **Etichetta diversa:** app “Regime fiscale semplificato (no IVA)” ↔ sito “Regime semplificato:”

**Opzioni diverse** (1)
- **Opzioni diverse** in “Complessità” (sito “Complessità incarico:”): solo nell'app: "bassa", "media", "alta"; solo nel sito: "bassamediaalta"

**Predefiniti diversi** (4)
- **Predefinito diverso** in “Complessità” (sito “Complessità incarico:”): app: media — sito: BassaMediaAlta
- **Predefinito diverso** in “Numero di incontri” (sito “Numero incontri:”): app: 1 — sito: vuoto
- **Predefinito diverso** in “Spese esenti €” (sito “Spese esenti:”): app: 0 — sito: vuoto
- **Predefinito diverso** in “Spese imponibili €” (sito “Spese imponibili:”): app: 0 — sito: vuoto

**Da verificare a mano** (3)
- _Da verificare:_ “Cassa previdenziale” — campi del sito con etichetta non leggibile: 2
- _Da verificare:_ campo sito senza etichetta leggibile (nome: DoCassa, tipo: casella)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: PctCassa, tipo: testo)

### Verifica Gratuito Patrocinio (`gratuito-patrocinio`)

Pagina sito: `/servizi/verifica-requisiti-gratuito-patrocinio.php` · campi app: 8 · campi sito: 13

**Campi in più nell'app** (5)
- **Campo in più nell'app:** “Rapporto familiare”
- **Campo in più nell'app:** “Reddito imponibile €”
- **Campo in più nell'app:** “Redditi esenti €”
- **Campo in più nell'app:** “Altri redditi €”
- **Campo in più nell'app:** “Familiare in conflitto”

**Etichette diverse** (1)
- **Etichetta diversa:** app “Familiari conviventi” ↔ sito “(riga ripetibile: FamNome)” (lista abbinata per posizione)

**Opzioni diverse** (2)
- **Opzioni diverse** in “Diritti della personalità” (sito “Diritti della personalità:”): solo nell'app: "no", "sì"; solo nel sito: "nosi"
- **Opzioni diverse** in “Aumento soglia penale” (sito “Aumento soglia penale:”): solo nell'app: "no", "sì"; solo nel sito: "nosi"

**Predefiniti diversi** (3)
- **Predefinito diverso** in “Materia del procedimento” (sito “Materia del procedimento:”): app: 1 — sito: Civile
- **Predefinito diverso** in “Diritti della personalità” (sito “Diritti della personalità:”): app: 0 — sito: NoSi
- **Predefinito diverso** in “Aumento soglia penale” (sito “Aumento soglia penale:”): app: 1 — sito: NoSi

**Da verificare a mano** (5)
- _Da verificare:_ riga ripetibile del sito non abbinata ((riga ripetibile: FamRapporto), 1 campi)
- _Da verificare:_ riga ripetibile del sito non abbinata ((riga ripetibile: FamRedditoImponibile), 1 campi)
- _Da verificare:_ riga ripetibile del sito non abbinata ((riga ripetibile: FamRedditiEsenti), 1 campi)
- _Da verificare:_ riga ripetibile del sito non abbinata ((riga ripetibile: FamAltriRedditi), 1 campi)
- _Da verificare:_ riga ripetibile del sito non abbinata ((riga ripetibile: FamInConflitto), 1 campi)

### Rivalutazione Mensile (`rivalutazione-mensile`)

Pagina sito: `/servizi/rivalutazione_mensile_assegni_importi_dovuti.php` · campi app: 8 · campi sito: 9

**Etichette diverse** (5)
- **Etichetta diversa:** app “Importo di ogni rata €” ↔ sito “Importo €”
- **Etichetta diversa:** app “Scadenza della prima rata non pagata” ↔ sito “Data Inizio:”
- **Etichetta diversa:** app “Fino al (di norma la data del pagamento, o oggi)” ↔ sito “Data Fine:”
- **Etichetta diversa:** app “Rivaluta mensilmente gli importi dovuti e non riscossi (ISTAT)” ↔ sito “Rivaluta annualmente gli importi dovuti al”
- **Etichetta diversa:** app “Calcola gli interessi legali” ↔ sito “Calcola solo gli interessi legali al”

**Predefiniti diversi** (5)
- **Predefinito diverso** in “Importo di ogni rata €” (sito “Importo €”): app: vuoto — sito: 0,00
- **Predefinito diverso** in “Scadenza della prima rata non pagata” (sito “Data Inizio:”): app: oggi — sito: 01/01/2000
- **Predefinito diverso** in “Fino al (di norma la data del pagamento, o oggi)” (sito “Data Fine:”): app: oggi — sito: 30/09/2026
- **Predefinito diverso** in “Rivaluta mensilmente gli importi dovuti e non riscossi (ISTAT)” (sito “Rivaluta annualmente gli importi dovuti al”): app: non selezionata — sito: 100
- **Predefinito diverso** in “Calcola gli interessi legali” (sito “Calcola solo gli interessi legali al”): app: non selezionata — sito: 100

**Ordine diverso** (1)
- **Ordine diverso:** “Rivaluta mensilmente gli importi dovuti e non riscossi (ISTAT)” (app, posizione 4) ↔ “Rivaluta annualmente gli importi dovuti al” (sito, posizione 8)

**Da verificare a mano** (7)
- _Da verificare:_ “Percentuale del tasso legale %” — campi del sito con etichetta non leggibile: 4
- _Da verificare:_ “Rivaluta annualmente l'importo dovuto, a un tasso indicato da te” — campi del sito con etichetta non leggibile: 4
- _Da verificare:_ “Tasso di rivalutazione annua %” — campi del sito con etichetta non leggibile: 4
- _Da verificare:_ campo sito senza etichetta leggibile (nome: OptRivalutazioneMensile, tipo: casella)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: OptInteressiLegali, tipo: casella)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: OptRivalutazioneAnnuale, tipo: casella)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: OptDettaglioMesi, tipo: casella)

### Scadenze Multe (`scadenze-multe`)

Pagina sito: `/servizi/ricorso-pagamento-multa.php` · campi app: 5 · campi sito: 5

**Campi mancanti nell'app** (3)
- **Campo mancante nell'app:** “Scegli un'opzione:”
- **Campo mancante nell'app:** “TERMINI per RICORSO / PAGAMENTO MULTA (nascosto all'avvio)”
- **Campo mancante nell'app:** “Sanzione prevista (minimo edittale): (nascosto all'avvio)”

**Campi in più nell'app** (3)
- **Campo in più nell'app:** “Stato della multa”
- **Campo in più nell'app:** “Modalità di inoltro del ricorso”
- **Campo in più nell'app:** “Importo della sanzione € (opzionale, per lo sconto del 30%)”

**Etichette diverse** (2)
- **Etichetta diversa:** app “Data di riferimento” ↔ sito “Inserisci la data in cui è avvenuta la contestazione immediata con rilascio del verbale.”
- **Etichetta diversa:** app “Cosa vuoi fare” ↔ sito “Dimmi cosa intendi fare:”

**Opzioni diverse** (1)
- **Opzioni diverse** in “Cosa vuoi fare” (sito “Dimmi cosa intendi fare:”): solo nell'app: "pagare (eventualmente con sconto)", "fare ricorso al prefetto", "fare ricorso al giudice di pace"; solo nel sito: "presentare ricorso al prefetto", "presentare ricorso al giudice di pace", "pagare la multa"

**Predefiniti diversi** (2)
- **Predefinito diverso** in “Data di riferimento” (sito “Inserisci la data in cui è avvenuta la contestazione immediata con rilascio del verbale.”): app: vuoto — sito: oggi (15/11/2026)
- **Predefinito diverso** in “Cosa vuoi fare” (sito “Dimmi cosa intendi fare:”): app: pagare — sito: Presentare ricorso al Prefetto

### Scorporo Importi (`scorporo-importi`)

Pagina sito: `/servizi/calcolatrice_scorporo.php` · campi app: 10 · campi sito: 11 · esclusi perché riservati agli utenti registrati: “Dati Documento”, “Ricorda le impostazioni”

**Campi mancanti nell'app** (5)
- **Campo mancante nell'app:** “Di cui Spese Esenti €”
- **Campo mancante nell'app:** “Iva per Cassa”
- **Campo mancante nell'app:** “Split Payment:”
- **Campo mancante nell'app:** “Tipo Regime (nascosto all'avvio)”
- **Campo mancante nell'app:** “Addebito bollo (nascosto all'avvio)”

**Etichette diverse** (4)
- **Etichetta diversa:** app “Importo forfettario da scorporare €” ↔ sito “Importo €”
- **Etichetta diversa:** app “Spese imponibili IVA €” ↔ sito “Spese Imponibili €”
- **Etichetta diversa:** app “Regime fiscale semplificato (no IVA)” ↔ sito “Regime Semplificato”
- **Etichetta diversa:** app “Applica ritenuta d'acconto” ↔ sito “Ritenuta d'Acconto”

**Predefiniti diversi** (1)
- **Predefinito diverso** in “Importo forfettario da scorporare €” (sito “Importo €”): app: vuoto — sito: 0,00

**Ordine diverso** (1)
- **Ordine diverso:** “Regime fiscale semplificato (no IVA)” (app, posizione 7) ↔ “Regime Semplificato” (sito, posizione 9)

**Da verificare a mano** (8)
- _Da verificare:_ “Spese esenti € (art. 15, DPR 633/72)” — campi del sito con etichetta non leggibile: 2
- _Da verificare:_ “Includi spese generali (art. 13 L. 247/2012)” — campi del sito con etichetta non leggibile: 2
- _Da verificare:_ “Percentuale spese generali” — campi del sito con etichetta non leggibile: 2
- _Da verificare:_ “Percentuale cassa previdenziale (4% ENPAP, altre casse diverse)” — campi del sito con etichetta non leggibile: 2
- _Da verificare:_ “Percentuale IVA” — campi del sito con etichetta non leggibile: 2
- _Da verificare:_ “Percentuale ritenuta d'acconto” — campi del sito con etichetta non leggibile: 2
- _Da verificare:_ campo sito senza etichetta leggibile (nome: DoSpeseGen, tipo: casella)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: PctSpeseGen, tipo: testo)

### Termini Deposito CTU (`termini-deposito-ctu`)

Pagina sito: `/servizi/calcolo-termini-deposito-ctu.php` · campi app: 6 · campi sito: 6

**Campi mancanti nell'app** (3)
- **Campo mancante nell'app:** “Termine per l'invio della bozza alle parti:”
- **Campo mancante nell'app:** “Termine per l'invio delle osservazioni al CTU:”
- **Campo mancante nell'app:** “Modalità Prudenziale:”

**Campi in più nell'app** (3)
- **Campo in più nell'app:** “Giorni per l'invio della bozza ai CTP”
- **Campo in più nell'app:** “Giorni per le osservazioni dei CTP”
- **Campo in più nell'app:** “Calcolo prudenziale (termine più favorevole)”

**Etichette diverse** (3)
- **Etichetta diversa:** app “Data inizio operazioni peritali” ↔ sito “Data Iniziale:”
- **Etichetta diversa:** app “Giorni per il deposito della relazione definitiva” ↔ sito “Termine per il deposito della relazione definitiva in cancelleria:”
- **Etichetta diversa:** app “Applica sospensione feriale (1-31 agosto)” ↔ sito “Sospensione Feriale:”

**Predefiniti diversi** (2)
- **Predefinito diverso** in “Data inizio operazioni peritali” (sito “Data Iniziale:”): app: vuoto — sito: oggi (15/11/2026)
- **Predefinito diverso** in “Applica sospensione feriale (1-31 agosto)” (sito “Sospensione Feriale:”): app: non selezionata — sito: selezionata

### Adeguamento Canone (`adeguamento-canone`)

Pagina sito: `/servizi/calcolo_adeguamento_istat_canone_locazione.php` · campi app: 4 · campi sito: 4

**Campi mancanti nell'app** (1)
- **Campo mancante nell'app:** “Altro:”

**Campi in più nell'app** (1)
- **Campo in più nell'app:** “Percentuale %”

**Etichette diverse** (3)
- **Etichetta diversa:** app “Canone attuale €” ↔ sito “Canone €”
- **Etichetta diversa:** app “Mese di riferimento per l'indice ISTAT” ↔ sito “Indice Istat:”
- **Etichetta diversa:** app “Percentuale di adeguamento” ↔ sito “Percentuale:”

**Opzioni diverse** (2)
- **Opzioni diverse** in “Mese di riferimento per l'indice ISTAT” (sito “Indice Istat:”): il sito offre una scelta (12 opzioni), l'app un campo libero
- **Opzioni diverse** in “Percentuale di adeguamento” (sito “Percentuale:”): solo nell'app: "75% (locazioni abitative ordinarie, se la clausola lo prevede — art. 32 l. 392/1978)", "100% (locazioni diverse da abitazione, assegni di mantenimento)", "altra percentuale da contratto"; solo nel sito: "75% 100%"

**Predefiniti diversi** (3)
- **Predefinito diverso** in “Canone attuale €” (sito “Canone €”): app: vuoto — sito: 0,00
- **Predefinito diverso** in “Mese di riferimento per l'indice ISTAT” (sito “Indice Istat:”): app: oggi — sito: Settembre
- **Predefinito diverso** in “Percentuale di adeguamento” (sito “Percentuale:”): app: 100% (locazioni diverse da abitazione, assegni di mantenimento) — sito: 75% 100%

### Calcolo Cedolare Secca (`cedolare-secca`)

Pagina sito: `/servizi/calcolo-convenienza-cedolare-secca-affitti.php` · campi app: 13 · campi sito: 13

**Etichette diverse** (2)
- **Etichetta diversa:** app “Rivalutazione Istat prevista” ↔ sito “Rivalutazione Istat:”
- **Etichetta diversa:** app “Rivalutazione Istat prevista al % (andamento)” ↔ sito “prevista al”

**Opzioni diverse** (3)
- **Opzioni diverse** in “Tipologia del contratto” (sito “Tipologia del contratto:”): solo nell'app: "libero", "concordato e agevolato"; solo nel sito: "libero concordato e agevolato"
- **Opzioni diverse** in “Il canone indicato è” (sito “[etichetta non leggibile, nome TipoImportoCanone]”): solo nell'app: "annuale", "mensile"; solo nel sito: "annuale mensile"
- **Opzioni diverse** in “Applica rivalutazione al” (sito “Applica rivalutazione al:”): solo nell'app: "50%", "75%", "100%"; solo nel sito: "50% 75% 100%"

**Predefiniti diversi** (5)
- **Predefinito diverso** in “Tipologia del contratto” (sito “Tipologia del contratto:”): app: libero — sito: Libero Concordato e agevolato
- **Predefinito diverso** in “Il canone indicato è” (sito “[etichetta non leggibile, nome TipoImportoCanone]”): app: annuale — sito: annuale mensile
- **Predefinito diverso** in “Applica rivalutazione al” (sito “Applica rivalutazione al:”): app: 75 — sito: 50% 75% 100%
- **Predefinito diverso** in “Il reddito annuo è” (sito “[etichetta non leggibile, nome CanoneInclusoNelReddito]”): app: 0 — sito: escluso il canone
- **Predefinito diverso** in “% Deduzione forfettaria” (sito “% Deduzione forfettaria:”): app: 5 — sito: 5% (dal 1° gennaio 2013)

**Da verificare a mano** (4)
- _Da verificare:_ “Canone di locazione €” — campi del sito con etichetta non leggibile: 2
- _Da verificare:_ “Reddito annuo €” — campi del sito con etichetta non leggibile: 2
- _Da verificare:_ campo sito senza etichetta leggibile (nome: ImportoCanone, tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: RedditoComplessivoIrpef, tipo: testo)

### Calcolo Spese di Mediazione (`compenso-mediazione`)

Pagina sito: `/servizi/calcolo-spese-di-mediazione.php` · campi app: 8 · campi sito: 12

**Campi mancanti nell'app** (1)
- **Campo mancante nell'app:** “Importo €: (nascosto all'avvio)”

**Etichette diverse** (2)
- **Etichetta diversa:** app “Mediazione obbligatoria o demandata dal giudice (-1/5)” ↔ sito “Mediazione obbligatoria:”
- **Etichetta diversa:** app “Numero di incontri” ↔ sito “Numero incontri:”

**Opzioni diverse** (4)
- **Opzioni diverse** in “Valore della lite €” (sito “Valore della lite:”): il sito offre una scelta (16 opzioni), l'app un campo libero
- **Opzioni diverse** in “Mediazione obbligatoria o demandata dal giudice (-1/5)” (sito “Mediazione obbligatoria:”): il sito offre una scelta (2 opzioni), l'app un campo libero
- **Opzioni diverse** in “Numero di incontri” (sito “Numero incontri:”): solo nell'app: "uno", "più di uno"; solo nel sito: "unopiù di uno"
- **Opzioni diverse** in “Accordo raggiunto” (sito “Accordo raggiunto:”): il sito offre una scelta (2 opzioni), l'app un campo libero

**Predefiniti diversi** (3)
- **Predefinito diverso** in “Mediazione obbligatoria o demandata dal giudice (-1/5)” (sito “Mediazione obbligatoria:”): app: non selezionata — sito: SiNo
- **Predefinito diverso** in “Numero di incontri” (sito “Numero incontri:”): app: uno — sito: UnoPiù di uno
- **Predefinito diverso** in “Accordo raggiunto” (sito “Accordo raggiunto:”): app: non selezionata — sito: SiNo

**Da verificare a mano** (11)
- _Da verificare:_ “Valore della lite indeterminabile” — campi del sito con etichetta non leggibile: 7
- _Da verificare:_ “Complessità presunta (sceglie lo scaglione del 1° incontro)” — campi del sito con etichetta non leggibile: 7
- _Da verificare:_ “Maggiorazione discrezionale dell'organismo sull'accordo (0-20%)” — campi del sito con etichetta non leggibile: 7
- _Da verificare:_ “Applica IVA (22%)” — campi del sito con etichetta non leggibile: 7
- _Da verificare:_ campo sito senza etichetta leggibile (nome: TipoVal, tipo: scelta, 3 opzioni)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: ImpSpeseUlteriori, tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: SpeseUlteriori, tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: DoMaggComma5, tipo: casella)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: PctMaggComma5, tipo: scelta, 20 opzioni)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: DoIva, tipo: casella)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: PctIva, tipo: testo)

### Calcolo Danno Biologico (lieve entità) (`danno-biologico-lieve-entita`)

Pagina sito: `/servizi/calcolo_danno_biologico.php` · campi app: 8 · campi sito: 15

**Campi mancanti nell'app** (3)
- **Campo mancante nell'app:** “Anno”
- **Campo mancante nell'app:** “Punti riconosciuti:”
- **Campo mancante nell'app:** “Perc. riconosciuta:”

**Etichette diverse** (2)
- **Etichetta diversa:** app “Giorni di invalidità assoluta (ITT)” ↔ sito “Giorni invalidità totale:”
- **Etichetta diversa:** app “Calcolo del danno morale” ↔ sito “Calcola danno morale:”

**Opzioni diverse** (1)
- **Opzioni diverse** in “Calcolo del danno morale” (sito “Calcola danno morale:”): solo nell'app: "su invalidità permanente e temporanea", "solo su invalidità permanente"; solo nel sito: "su invalidità permanente e temporanea solo su invalidità permanente"

**Predefiniti diversi** (4)
- **Predefinito diverso** in “Giorni di invalidità assoluta (ITT)” (sito “Giorni invalidità totale:”): app: 0 — sito: vuoto
- **Predefinito diverso** in “Calcolo del danno morale” (sito “Calcola danno morale:”): app: si — sito: su invalidità permanente e temporanea solo su invalidità permanente
- **Predefinito diverso** in “Spese mediche €” (sito “Spese mediche €”): app: 0 — sito: vuoto
- **Predefinito diverso** in “Altre spese €” (sito “Altre spese €”): app: 0 — sito: vuoto

**Da verificare a mano** (10)
- _Da verificare:_ “Punti di invalidità (0-9, anche con decimali 0,25/0,5/0,75)” — campi del sito con etichetta non leggibile: 7
- _Da verificare:_ “Personalizzazione per danno morale (%)” — campi del sito con etichetta non leggibile: 7
- _Da verificare:_ “Periodi di invalidità parziale (ITP)” — campi del sito con etichetta non leggibile: 7
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Decimali, tipo: scelta, 4 opzioni)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: GgParz1, tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: PctParz1, tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: GgParz2, tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: PctParz2, tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: GgParz3, tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: PctParz3, tipo: testo)

### Interessi e Acconti (`interessi-acconti`)

Pagina sito: `/servizi/calcolo-interessi-acconti.php` · campi app: 9 · campi sito: 15

**Campi mancanti nell'app** (2)
- **Campo mancante nell'app:** “Credito:”
- **Campo mancante nell'app:** “Interessi:”

**Campi in più nell'app** (2)
- **Campo in più nell'app:** “Data”
- **Campo in più nell'app:** “Importo €”

**Etichette diverse** (4)
- **Etichetta diversa:** app “Data iniziale” ↔ sito “Dal:”
- **Etichetta diversa:** app “Tasso fisso annuo %” ↔ sito “Tasso:”
- **Etichetta diversa:** app “Imputa gli acconti prima agli interessi maturati, poi al capitale (art. 1194 c.c.)” ↔ sito “Art. 1194 c.c.”
- **Etichetta diversa:** app “Acconti versati e nuovi crediti nel tempo” ↔ sito “(riga ripetibile: TipoMovimento)” (lista abbinata per posizione)

**Opzioni diverse** (1)
- **Opzioni diverse** in “Tipo” (sito “[etichetta non leggibile, nome TipoMovimento]”): solo nell'app: "nuovo credito"; solo nel sito: "credito"

**Predefiniti diversi** (1)
- **Predefinito diverso** in “Data iniziale” (sito “Dal:”): app: vuoto — sito: oggi (15/11/2026)

**Da verificare a mano** (14)
- _Da verificare:_ “Capitale €” — campi del sito con etichetta non leggibile: 4
- _Da verificare:_ “Data finale” — campi del sito con etichetta non leggibile: 4
- _Da verificare:_ “Tipo di interesse” — campi del sito con etichetta non leggibile: 4
- _Da verificare:_ “Normativa previgente (maggiorazione 7 punti, ante 2013)” — campi del sito con etichetta non leggibile: 4
- _Da verificare:_ “Maggiorazione extra (0, 2 o 4 punti, art. 62 c.3 D.L. 1/2012)” — campi del sito con etichetta non leggibile: 4
- _Da verificare:_ campo sito senza etichetta leggibile (nome: GiornoFine, tipo: data)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: NormativaPrevigente, tipo: casella)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Maggiorazione, tipo: casella)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: PctMaggiorazione, tipo: scelta, 2 opzioni)
- _Da verificare:_ riga ripetibile del sito non abbinata ((riga ripetibile: GiornoMovimento), 1 campi)
- _Da verificare:_ riga ripetibile del sito non abbinata ((riga ripetibile: MeseMovimento), 1 campi)
- _Da verificare:_ riga ripetibile del sito non abbinata ((riga ripetibile: AnnoMovimento), 1 campi)
- _Da verificare:_ riga ripetibile del sito non abbinata ((riga ripetibile: ImportoMovimento), 1 campi)
- _Da verificare:_ riga ripetibile del sito non abbinata ((riga ripetibile: DescrMovimento), 1 campi)

### Calcolo Nota Spese (`nota-spese-tariffe-2004`)

Pagina sito: `/servizi/calcolo_nota_spese_avvocati_tariffe_forensi.php` · campi app: 21 · campi sito: 18 · esclusi perché riservati agli utenti registrati: “Dati Documento:”, “Ricorda le impostazioni”

**Campi mancanti nell'app** (4)
- **Campo mancante nell'app:** “Regime Semplificato:”
- **Campo mancante nell'app:** “Dettaglio attività:”
- **Campo mancante nell'app:** “Stampa codici attività:”
- **Campo mancante nell'app:** “Mostra in fattura:”

**Etichette diverse** (2)
- **Etichetta diversa:** app “Competenza (diritti)” ↔ sito “Competenza:”
- **Etichetta diversa:** app “Bollo (2 € se il totale supera 77,47 €)” ↔ sito “Bollo:”

**Opzioni diverse** (2)
- **Opzioni diverse** in “Tariffa predefinita” (sito “Tariffa predefinita:”): solo nel sito: "specificata"
- **Opzioni diverse** in “Regime” (sito “Regime”): solo nell'app: "ordinario"

**Predefiniti diversi** (2)
- **Predefinito diverso** in “Competenza (diritti)” (sito “Competenza:”): app: 1 — sito: Processo di cognizione
- **Predefinito diverso** in “Regime” (sito “Regime”): app: 0 — sito: Regime forfettario agevolato 2014

**Da verificare a mano** (23)
- _Da verificare:_ “Tariffario” — campi del sito con etichetta non leggibile: 8
- _Da verificare:_ “Valore della causa €” — campi del sito con etichetta non leggibile: 8
- _Da verificare:_ “Diritti” — campi del sito con etichetta non leggibile: 8
- _Da verificare:_ “Competenza (onorari)” — campi del sito con etichetta non leggibile: 8
- _Da verificare:_ “Onorari” — campi del sito con etichetta non leggibile: 8
- _Da verificare:_ “Attività stragiudiziali” — campi del sito con etichetta non leggibile: 8
- _Da verificare:_ “Spese generali” — campi del sito con etichetta non leggibile: 8
- _Da verificare:_ “Percentuale spese generali” — campi del sito con etichetta non leggibile: 8
- _Da verificare:_ “Anticipi ricevuti” — campi del sito con etichetta non leggibile: 8
- _Da verificare:_ “Operazione” — campi del sito con etichetta non leggibile: 8
- _Da verificare:_ “Tariffa” — campi del sito con etichetta non leggibile: 8
- _Da verificare:_ “Comprese le tariffe personalizzate” — campi del sito con etichetta non leggibile: 8
- _Da verificare:_ “Variazione” — campi del sito con etichetta non leggibile: 8
- _Da verificare:_ “Percentuale” — campi del sito con etichetta non leggibile: 8
- _Da verificare:_ “Totale € da ottenere” — campi del sito con etichetta non leggibile: 8
- _Da verificare:_ campo sito senza etichetta leggibile (nome: ValoreCausa, tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: DoSpeseGen, tipo: casella)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: PctSpeseGen, tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: TotDiritti, tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: TotOnorari, tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: TotSpEse, tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: TotSpNon, tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: TotAnticipi, tipo: testo)

### Calcolo Prescrizione Reati (`prescrizione-reati`)

Pagina sito: `/servizi/calcolo-prescrizione-reati.php` · campi app: 4 · campi sito: 9

**Campi mancanti nell'app** (5)
- **Campo mancante nell'app:** “Confronta con normativa antecedente la legge 251/2005:”
- **Campo mancante nell'app:** “Data ultimo atto interruttivo:”
- **Campo mancante nell'app:** “Pena prevista:”
- **Campo mancante nell'app:** “Aggravante per recidiva o abitualità:”
- **Campo mancante nell'app:** “art. 99 comma 2”

**Etichette diverse** (3)
- **Etichetta diversa:** app “Data del reato” ↔ sito “Data reato:”
- **Etichetta diversa:** app “Pena edittale massima (anni)” ↔ sito “Anni:”
- **Etichetta diversa:** app “Raddoppio dei termini (es. art. 157 c.8 c.p.)” ↔ sito “Raddoppio termini:”

**Opzioni diverse** (1)
- **Opzioni diverse** in “Pena edittale massima (anni)” (sito “Anni:”): il sito offre una scelta (31 opzioni), l'app un campo libero

**Predefiniti diversi** (1)
- **Predefinito diverso** in “Data del reato” (sito “Data reato:”): app: vuoto — sito: 00/00/

**Da verificare a mano** (2)
- _Da verificare:_ “Tipo di pena” — campi del sito con etichetta non leggibile: 1
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Abitualita, tipo: casella)

### Risarcimento INAIL (`risarcimento-inail`)

Pagina sito: `/servizi/calcolo_risarcimento_inail_infortunio_lavoro.php` · campi app: 5 · campi sito: 5

**Etichette diverse** (4)
- **Etichetta diversa:** app “Invalidità riconosciuta (6-100%)” ↔ sito “Invalidità:”
- **Etichetta diversa:** app “Età del lavoratore” ↔ sito “Età:”
- **Etichetta diversa:** app “Retribuzione annua di riferimento €” ↔ sito “Retribuzione annua:”
- **Etichetta diversa:** app “Numero di familiari per quote integrative” ↔ sito “N° familiari per quote integrative:”

**Opzioni diverse** (3)
- **Opzioni diverse** in “Invalidità riconosciuta (6-100%)” (sito “Invalidità:”): il sito offre una scelta (96 opzioni), l'app un campo libero
- **Opzioni diverse** in “Età del lavoratore” (sito “Età:”): il sito offre una scelta (63 opzioni), l'app un campo libero
- **Opzioni diverse** in “Numero di familiari per quote integrative” (sito “N° familiari per quote integrative:”): il sito offre una scelta (16 opzioni), l'app un campo libero

**Predefiniti diversi** (3)
- **Predefinito diverso** in “Inquadramento” (sito “Inquadramento:”): app: 10 — sito: Industria: tutti i lavoratori
- **Predefinito diverso** in “Retribuzione annua di riferimento €” (sito “Retribuzione annua:”): app: vuoto — sito: 0,00
- **Predefinito diverso** in “Numero di familiari per quote integrative” (sito “N° familiari per quote integrative:”): app: 0 — sito: vuoto

### Calcolo Superficie Commerciale (`superficie-commerciale`)

Pagina sito: `/servizi/calcolo-superficie-commerciale.php` · campi app: 5 · campi sito: 10

**Campi mancanti nell'app** (3)
- **Campo mancante nell'app:** “Metri quadri:”
- **Campo mancante nell'app:** “Totale Vani Mq: (nascosto all'avvio)”
- **Campo mancante nell'app:** “Totale Pertinenze Mq: (nascosto all'avvio)”

**Campi in più nell'app** (1)
- **Campo in più nell'app:** “Superficie dei vani principali e accessori diretti (Mq)”

**Etichette diverse** (3)
- **Etichetta diversa:** app “Tipo di immobile” ↔ sito “Tipo Immobile:”
- **Etichetta diversa:** app “Vani principali e vani accessori diretti (massimo 32)” ↔ sito “(riga ripetibile: VCod)” (lista abbinata per posizione)
- **Etichetta diversa:** app “Pertinenze esclusive (massimo 32)” ↔ sito “(riga ripetibile: VSup)” (lista abbinata per posizione)

**Opzioni diverse** (1)
- **Opzioni diverse** in “Superficie” (sito “Superficie:”): solo nell'app: "complessiva", "singoli vani"; solo nel sito: "complessivasingoli vani"

**Predefiniti diversi** (2)
- **Predefinito diverso** in “Tipo di immobile” (sito “Tipo Immobile:”): app: 1 — sito: Abitazioni residenziali (da A/1 a A/6)
- **Predefinito diverso** in “Superficie” (sito “Superficie:”): app: complessiva — sito: ComplessivaSingoli Vani

**Da verificare a mano** (10)
- _Da verificare:_ riga ripetibile del sito non abbinata ((riga ripetibile: PCod), 1 campi)
- _Da verificare:_ riga ripetibile del sito non abbinata ((riga ripetibile: PSup), 1 campi)
- _Da verificare:_ riga ripetibile del sito non abbinata ((riga ripetibile: PCom), 1 campi)
- _Da verificare:_ “Vano” — campi del sito con etichetta non leggibile: 1
- _Da verificare:_ “Superficie (Mq)” — campi del sito con etichetta non leggibile: 1 (×2)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: VCod, tipo: scelta, 18 opzioni)
- _Da verificare:_ “Pertinenza” — campi del sito con etichetta non leggibile: 1
- _Da verificare:_ “Comunicante con i vani (dove previsto)” — campi del sito con etichetta non leggibile: 1
- _Da verificare:_ campo sito senza etichetta leggibile (nome: VSup, tipo: testo)

### Fattura Avvocati (`fattura-avvocati`)

Pagina sito: `/servizi/calcolo_fattura_studio_legale.php` · campi app: 12 · campi sito: 12 · esclusi perché riservati agli utenti registrati: “Dati Documento”, “Ricorda le impostazioni”

**Campi mancanti nell'app** (1)
- **Campo mancante nell'app:** “Inserisci Acconti”

**Etichette diverse** (4)
- **Etichetta diversa:** app “Spese Esenti € (art. 15, DPR 633/72)” ↔ sito “Spese Esenti €”
- **Etichetta diversa:** app “Iva per Cassa (art. 32 bis, D.L. 83/2012)” ↔ sito “Iva per Cassa”
- **Etichetta diversa:** app “Split Payment (art. 17-ter, DPR 633/72)” ↔ sito “Split Payment:”
- **Etichetta diversa:** app “Addebito bollo (al cliente)” ↔ sito “Addebito bollo”

**Predefiniti diversi** (4)
- **Predefinito diverso** in “Onorari €” (sito “Onorari €”): app: vuoto — sito: 0,00
- **Predefinito diverso** in “Spese Esenti € (art. 15, DPR 633/72)” (sito “Spese Esenti €”): app: vuoto — sito: 0,00
- **Predefinito diverso** in “Spese Imponibili €” (sito “Spese Imponibili €”): app: vuoto — sito: 0,00
- **Predefinito diverso** in “Tipo Regime” (sito “Tipo Regime”): app: 1 — sito: Regime forfettario agevolato 2014

**Da verificare a mano** (5)
- _Da verificare:_ “Spese Generali (art. 13 L. 247/2012)” — campi del sito con etichetta non leggibile: 2
- _Da verificare:_ “Spese Generali % (da 0 a 20)” — campi del sito con etichetta non leggibile: 2
- _Da verificare:_ “Acconti ricevuti (già fatturati, accessori di legge inclusi; max 16)” — campi del sito con etichetta non leggibile: 2
- _Da verificare:_ campo sito senza etichetta leggibile (nome: DoSpeseGen, tipo: casella)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: PctSpeseGen, tipo: testo)

### Fattura Professionisti (`fattura-professionisti`)

Pagina sito: `/servizi/calcolo_fattura_generica_scorporo.php` · campi app: 19 · campi sito: 18 · esclusi perché riservati agli utenti registrati: “Dati Documento”, “Ricorda le impostazioni”

**Etichette diverse** (4)
- **Etichetta diversa:** app “Spese Esenti € (art. 15, DPR 633/72)” ↔ sito “Spese Esenti €”
- **Etichetta diversa:** app “IVA” ↔ sito “Iva per Cassa”
- **Etichetta diversa:** app “Split Payment (art. 17-ter, DPR 633/72)” ↔ sito “Split Payment:”
- **Etichetta diversa:** app “Addebito bollo (al cliente)” ↔ sito “Addebito bollo”

**Predefiniti diversi** (5)
- **Predefinito diverso** in “Importo €” (sito “Importo €”): app: vuoto — sito: 0,00
- **Predefinito diverso** in “Spese Esenti € (art. 15, DPR 633/72)” (sito “Spese Esenti €”): app: vuoto — sito: 0,00
- **Predefinito diverso** in “Spese Imponibili €” (sito “Spese Imponibili €”): app: vuoto — sito: 0,00
- **Predefinito diverso** in “IVA” (sito “Iva per Cassa”): app: selezionata — sito: non selezionata
- **Predefinito diverso** in “Tipo Regime” (sito “Tipo Regime”): app: 1 — sito: Regime forfettario agevolato 2014

**Da verificare a mano** (21)
- _Da verificare:_ “Operazione” — campi del sito con etichetta non leggibile: 10
- _Da verificare:_ “IVA %” — campi del sito con etichetta non leggibile: 10
- _Da verificare:_ “Contributo Previdenziale” — campi del sito con etichetta non leggibile: 10
- _Da verificare:_ “Descrizione contributo (se contiene 'Inps' la ritenuta si calcola anche sul contributo)” — campi del sito con etichetta non leggibile: 10
- _Da verificare:_ “Contributo previdenziale % (da 0 a 100)” — campi del sito con etichetta non leggibile: 10
- _Da verificare:_ “Spese Forfettarie” — campi del sito con etichetta non leggibile: 10
- _Da verificare:_ “Descrizione voce” — campi del sito con etichetta non leggibile: 10
- _Da verificare:_ “Spese forfettarie % sull'importo (da 0 a 100)” — campi del sito con etichetta non leggibile: 10
- _Da verificare:_ “Ritenuta d'Acconto” — campi del sito con etichetta non leggibile: 10
- _Da verificare:_ “Ritenuta d'acconto %” — campi del sito con etichetta non leggibile: 10
- _Da verificare:_ “Iva per Cassa (art. 32 bis, D.L. 83/2012)” — campi del sito con etichetta non leggibile: 10
- _Da verificare:_ campo sito senza etichetta leggibile (nome: DoIva, tipo: casella)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: PctIva, tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: DoContr1, tipo: casella)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: DesContr1, tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: PctContr1, tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: DoContr2, tipo: casella)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: DesContr2, tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: PctContr2, tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: DoRacc, tipo: casella)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: PctRacc, tipo: testo)

### Calcolo Imposte di Successione (`imposta-successione`)

Pagina sito: `/servizi/calcolo-imposte-di-successione.php` · campi app: 4 · campi sito: 5

**Campi mancanti nell'app** (1)
- **Campo mancante nell'app:** “Grado di parentela/affinità dell’erede rispetto al defunto:”

**Etichette diverse** (2)
- **Etichetta diversa:** app “Beni mobili (denaro e strumenti finanziari, esclusi i titoli di Stato) €” ↔ sito “Beni mobili (denaro e strumenti finanziari esclusi i titoli di Stato)”
- **Etichetta diversa:** app “Erede portatore di handicap grave (L. 104/1992)” ↔ sito “Erede portatore di handicap grave:”

**Opzioni diverse** (1)
- **Opzioni diverse** in “Erede portatore di handicap grave (L. 104/1992)” (sito “Erede portatore di handicap grave:”): il sito offre una scelta (2 opzioni), l'app un campo libero

**Predefiniti diversi** (4)
- **Predefinito diverso** in “Valore catastale immobile adibito a prima casa €” (sito “Valore catastale immobile adibito a prima casa”): app: vuoto — sito: 0,00
- **Predefinito diverso** in “Valore catastale altri immobili €” (sito “Valore catastale altri immobili”): app: vuoto — sito: 0,00
- **Predefinito diverso** in “Beni mobili (denaro e strumenti finanziari, esclusi i titoli di Stato) €” (sito “Beni mobili (denaro e strumenti finanziari esclusi i titoli di Stato)”): app: vuoto — sito: 0,00
- **Predefinito diverso** in “Erede portatore di handicap grave (L. 104/1992)” (sito “Erede portatore di handicap grave:”): app: non selezionata — sito: nosi

**Ordine diverso** (1)
- **Ordine diverso:** “Erede portatore di handicap grave (L. 104/1992)” (app, posizione 4) ↔ “Erede portatore di handicap grave:” (sito, posizione 2)

### Calcolo Maggior Danno (`maggior-danno`)

Pagina sito: `/servizi/calcolo-maggior-danno-obbligazioni-pecuniarie.php` · campi app: 3 · campi sito: 6

**Campi mancanti nell'app** (4)
- **Campo mancante nell'app:** “Importo €”
- **Campo mancante nell'app:** “Seleziona il tasso di riferimento”
- **Campo mancante nell'app:** “Rendimenti:”
- **Campo mancante nell'app:** “Sviluppo del calcolo:”

**Campi in più nell'app** (1)
- **Campo in più nell'app:** “Capitale €”

**Etichette diverse** (2)
- **Etichetta diversa:** app “Data iniziale” ↔ sito “Data Inizio:”
- **Etichetta diversa:** app “Data finale” ↔ sito “Data Fine:”

**Predefiniti diversi** (2)
- **Predefinito diverso** in “Data iniziale” (sito “Data Inizio:”): app: vuoto — sito: 30/09/2026
- **Predefinito diverso** in “Data finale” (sito “Data Fine:”): app: vuoto — sito: 30/09/2026

### Calcolo Notula Penale (`notula-penale-tariffario-2004`)

Pagina sito: `/servizi/calcolo_parcella_penale_avvocati_tariffario_forense.php` · campi app: 15 · campi sito: 14 · esclusi perché riservati agli utenti registrati: “Dati Documento:”, “Ricorda le impostazioni”

**Campi mancanti nell'app** (2)
- **Campo mancante nell'app:** “Regime Semplificato:”
- **Campo mancante nell'app:** “Mostra in fattura:”

**Etichette diverse** (2)
- **Etichetta diversa:** app “Attività” ↔ sito “Dettaglio attività:”
- **Etichetta diversa:** app “Bollo (2 € se il totale supera 77,47 €)” ↔ sito “Bollo:”

**Opzioni diverse** (2)
- **Opzioni diverse** in “Tariffa predefinita” (sito “Tariffa predefinita:”): solo nel sito: "specificata"
- **Opzioni diverse** in “Regime” (sito “Regime”): solo nell'app: "ordinario"

**Predefiniti diversi** (2)
- **Predefinito diverso** in “Competenza” (sito “Competenza:”): app: 1 — sito: Giudice di Pace
- **Predefinito diverso** in “Regime” (sito “Regime”): app: 0 — sito: Regime forfettario agevolato 2014

**Ordine diverso** (1)
- **Ordine diverso:** “Competenza” (app, posizione 1) ↔ “Competenza:” (sito, posizione 2)

**Da verificare a mano** (15)
- _Da verificare:_ “Spese generali” — campi del sito con etichetta non leggibile: 6
- _Da verificare:_ “Percentuale spese generali” — campi del sito con etichetta non leggibile: 6
- _Da verificare:_ “Anticipi ricevuti” — campi del sito con etichetta non leggibile: 6
- _Da verificare:_ “Operazione” — campi del sito con etichetta non leggibile: 6
- _Da verificare:_ “Tariffa” — campi del sito con etichetta non leggibile: 6
- _Da verificare:_ “Comprese le tariffe personalizzate” — campi del sito con etichetta non leggibile: 6
- _Da verificare:_ “Variazione” — campi del sito con etichetta non leggibile: 6
- _Da verificare:_ “Percentuale” — campi del sito con etichetta non leggibile: 6
- _Da verificare:_ “Totale € da ottenere” — campi del sito con etichetta non leggibile: 6
- _Da verificare:_ campo sito senza etichetta leggibile (nome: DoSpeseGen, tipo: casella)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: PctSpeseGen, tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: TotOnorari, tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: TotSpEse, tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: TotSpNon, tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: TotAnticipi, tipo: testo)

### Pensione di Reversibilità (`pensione-reversibilita`)

Pagina sito: `/servizi/calcolo-pensione-reversibilita-inps.php` · campi app: 9 · campi sito: 9

**Campi mancanti nell'app** (1)
- **Campo mancante nell'app:** “di €”

**Etichette diverse** (3)
- **Etichetta diversa:** app “Il coniuge ha un reddito” ↔ sito “Il coniuge ha un redddito:”
- **Etichetta diversa:** app “Genitori aventi diritto (senza coniuge e figli)” ↔ sito “Genitori aventi diritto:”
- **Etichetta diversa:** app “Fratelli aventi diritto (senza coniuge, figli e genitori)” ↔ sito “Fratelli aventi diritto:”

**Opzioni diverse** (4)
- **Opzioni diverse** in “L'importo della pensione è” (sito “[etichetta non leggibile, nome TipoImportoPensione]”): solo nell'app: "mensile", "annuale"; solo nel sito: "mensile annuale"
- **Opzioni diverse** in “Figli o nipoti aventi diritto” (sito “Figli o nipoti aventi diritto:”): solo nell'app: "nessuno"
- **Opzioni diverse** in “Genitori aventi diritto (senza coniuge e figli)” (sito “Genitori aventi diritto:”): solo nell'app: "nessuno"
- **Opzioni diverse** in “Fratelli aventi diritto (senza coniuge, figli e genitori)” (sito “Fratelli aventi diritto:”): solo nell'app: "nessuno"

**Predefiniti diversi** (1)
- **Predefinito diverso** in “L'importo della pensione è” (sito “[etichetta non leggibile, nome TipoImportoPensione]”): app: mensile — sito: mensile annuale

**Da verificare a mano** (3)
- _Da verificare:_ “Importo pensione €” — campi del sito con etichetta non leggibile: 1
- _Da verificare:_ “Reddito del coniuge all'anno €” — campi del sito con etichetta non leggibile: 1
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Pensione, tipo: testo)

### Giorni Lavorativi e Festivi (`aggiungi-giorni-lavorativi`)

Pagina sito: `/servizi/calcolo-giorni-lavorativi-festivi.php` · campi app: 9 · campi sito: 12

**Campi mancanti nell'app** (3)
- **Campo mancante nell'app:** “Santo Patrono:”
- **Campo mancante nell'app:** “Data Iniziale:”
- **Campo mancante nell'app:** “Data Finale:”

**Etichette diverse** (2)
- **Etichetta diversa:** app “Data di partenza” ↔ sito “Data:”
- **Etichetta diversa:** app “Festivi” ↔ sito “Giorni festivi:”

**Predefiniti diversi** (1)
- **Predefinito diverso** in “Data di partenza” (sito “Data:”): app: vuoto — sito: oggi (15/11/2026)

**Ordine diverso** (2)
- **Ordine diverso:** “Data di partenza” (app, posizione 1) ↔ “Data:” (sito, posizione 10)
- **Ordine diverso:** “Festivi” (app, posizione 6) ↔ “Giorni festivi:” (sito, posizione 1)

**Da verificare a mano** (10)
- _Da verificare:_ “Numero di giorni” — campi del sito con etichetta non leggibile: 5
- _Da verificare:_ “Direzione” — campi del sito con etichetta non leggibile: 5
- _Da verificare:_ “Chiusura estiva (1-31 agosto)” — campi del sito con etichetta non leggibile: 5
- _Da verificare:_ “Festa patronale locale — giorno (opzionale)” — campi del sito con etichetta non leggibile: 5
- _Da verificare:_ “Festa patronale locale — mese (opzionale)” — campi del sito con etichetta non leggibile: 5
- _Da verificare:_ campo sito senza etichetta leggibile (nome: GiornoPatrono, tipo: scelta, 32 opzioni)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: MesePatrono, tipo: scelta, 13 opzioni)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Compreso, tipo: casella)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: NumeroGiorni, tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: PrimaDopo, tipo: scelta, 2 opzioni)

### Calcolo Ammortamento (`ammortamento-mutuo`)

Pagina sito: `/servizi/calcolo-ammortamento-mutuo.php` · campi app: 5 · campi sito: 9

**Campi mancanti nell'app** (3)
- **Campo mancante nell'app:** “Numero Totale Rate:”
- **Campo mancante nell'app:** “Mostra le Singole Rate”
- **Campo mancante nell'app:** “Riepilogo Annuale”

**Etichette diverse** (1)
- **Etichetta diversa:** app “Tasso annuale %” ↔ sito “Tasso Annuale:”

**Predefiniti diversi** (4)
- **Predefinito diverso** in “Metodo di calcolo” (sito “Metodo di Calcolo:”): app: francese — sito: Rata Costante (metodo francese)
- **Predefinito diverso** in “Capitale finanziato €” (sito “Capitale Finanziato €”): app: vuoto — sito: 0,00
- **Predefinito diverso** in “Tasso annuale %” (sito “Tasso Annuale:”): app: vuoto — sito: 0
- **Predefinito diverso** in “Periodicità rate” (sito “Periodicità Rate:”): app: 12 — sito: Mensile = 12 rate all'anno

**Da verificare a mano** (3)
- _Da verificare:_ “Durata in anni” — campi del sito con etichetta non leggibile: 2
- _Da verificare:_ campo sito senza etichetta leggibile (nome: TipoDurata, tipo: scelta, 2 opzioni)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: DurataAnni, tipo: scelta, 40 opzioni)

### Imposte Compravendita (`imposte-compravendita-immobiliare`)

Pagina sito: `/servizi/calcolo-imposte-compravendita-immobiliare.php` · campi app: 3 · campi sito: 5

**Campi mancanti nell'app** (2)
- **Campo mancante nell'app:** “Calcola valore catastale dalla rendita:”
- **Campo mancante nell'app:** “Rendita catastale €”

**Etichette diverse** (2)
- **Etichetta diversa:** app “Tipo di immobile” ↔ sito “Immobile:”
- **Etichetta diversa:** app “Prezzo (o valore catastale) €” ↔ sito “Prezzo-Valore:”

**Opzioni diverse** (2)
- **Opzioni diverse** in “Tipo di immobile” (sito “Immobile:”): solo nell'app: "prima casa", "abitazione secondaria", "immobile di lusso"; solo nel sito: "prima casa e/o pertinenze", "abitazione secondaria e/o pertinenze", "abitazione di lusso (cat. a/1, a/8, a/9)"
- **Opzioni diverse** in “Venditore” (sito “Venditore:”): solo nell'app: "impresa costruttrice, entro 5 anni dal fine lavori", "impresa costruttrice, oltre 5 anni dal fine lavori"; solo nel sito: "impresa costruttrice entro 5 anni fine lavori", "impresa costruttrice oltre 5 anni fine lavori"

**Predefiniti diversi** (2)
- **Predefinito diverso** in “Tipo di immobile” (sito “Immobile:”): app: prima_casa — sito: Prima casa e/o pertinenze
- **Predefinito diverso** in “Prezzo (o valore catastale) €” (sito “Prezzo-Valore:”): app: vuoto — sito: selezionata

### Interessi Mora Appalti (`interessi-mora-appalti`)

Pagina sito: `/servizi/calcolo_interessi_mora_appalti_opere_pubbliche.php` · campi app: 5 · campi sito: 5

**Campi mancanti nell'app** (1)
- **Campo mancante nell'app:** “Tipo calcolo:”

**Campi in più nell'app** (1)
- **Campo in più nell'app:** “Tipo di ritardo”

**Etichette diverse** (3)
- **Etichetta diversa:** app “Decorrenza del termine (es. esecuzione lavori/emissione SAL)” ↔ sito “Data iniziale:”
- **Etichetta diversa:** app “Termine contrattuale per il pagamento (giorni)” ↔ sito “Termine:”
- **Etichetta diversa:** app “Data dell'effettivo pagamento” ↔ sito “Data finale:”

**Predefiniti diversi** (3)
- **Predefinito diverso** in “Importo €” (sito “Importo €”): app: vuoto — sito: 0,00
- **Predefinito diverso** in “Decorrenza del termine (es. esecuzione lavori/emissione SAL)” (sito “Data iniziale:”): app: vuoto — sito: 01/01/2000
- **Predefinito diverso** in “Data dell'effettivo pagamento” (sito “Data finale:”): app: vuoto — sito: oggi (15/11/2026)

### Rivalutazione e Interessi (`rivalutazione-istat`)

Pagina sito: `/servizi/interessi_rivalutazione.php` · campi app: 5 · campi sito: 5

**Campi mancanti nell'app** (1)
- **Campo mancante nell'app:** “Variazione rispetto allo stesso mese dell'anno precedente = 4%”

**Campi in più nell'app** (1)
- **Campo in più nell'app:** “Modalità”

**Etichette diverse** (3)
- **Etichetta diversa:** app “Dal” ↔ sito “Data Inizio:”
- **Etichetta diversa:** app “Al” ↔ sito “Data Fine:”
- **Etichetta diversa:** app “Rivaluta al % (100 ordinario, 75 tipico per i canoni di locazione)” ↔ sito “Rivaluta al:”

**Predefiniti diversi** (3)
- **Predefinito diverso** in “Capitale €” (sito “Capitale €”): app: vuoto — sito: 0,00
- **Predefinito diverso** in “Dal” (sito “Data Inizio:”): app: oggi — sito: 01/01/1970
- **Predefinito diverso** in “Al” (sito “Data Fine:”): app: oggi — sito: 30/09/2026

### Termini Esecuzioni (`termini-esecuzioni`)

Pagina sito: `/servizi/calcolo-termini-esecuzioni.php` · campi app: 4 · campi sito: 4

**Campi mancanti nell'app** (2)
- **Campo mancante nell'app:** “Procedura:”
- **Campo mancante nell'app:** “CALCOLO TERMINI nelle ESECUZIONI”

**Campi in più nell'app** (2)
- **Campo in più nell'app:** “Tipo di pignoramento”
- **Campo in più nell'app:** “Applica sospensione feriale (1-31 agosto)”

**Etichette diverse** (2)
- **Etichetta diversa:** app “Data consegna verbale di pignoramento (UNEP)” ↔ sito “Data di consegna del verbale di pignoramento da parte dell'UNEP:”
- **Etichetta diversa:** app “Data compimento pignoramento” ↔ sito “Data di compimento del pignoramento:”

**Predefiniti diversi** (2)
- **Predefinito diverso** in “Data consegna verbale di pignoramento (UNEP)” (sito “Data di consegna del verbale di pignoramento da parte dell'UNEP:”): app: vuoto — sito: oggi (15/11/2026)
- **Predefinito diverso** in “Data compimento pignoramento” (sito “Data di compimento del pignoramento:”): app: vuoto — sito: oggi (15/11/2026)

### Copie Processo Tributario (`diritti-copia-tributario`)

Pagina sito: `/servizi/calcolo_diritti_copia_processo_tributario.php` · campi app: 6 · campi sito: 5

**Campi in più nell'app** (1)
- **Campo in più nell'app:** “KBytes”

**Etichette diverse** (1)
- **Etichetta diversa:** app “Conformità (+ 9 € a copia)” ↔ sito “Conformità:”

**Opzioni diverse** (2)
- **Opzioni diverse** in “Formato” (sito “Formato:”): solo nell'app: "cartaceo", "elettronico"; solo nel sito: "cartaceo elettronico"
- **Opzioni diverse** in “Documento” (sito “Documento:”): solo nell'app: "prodotto dalle parti"; solo nel sito: "prodotto dalle parti da archivio"

**Predefiniti diversi** (2)
- **Predefinito diverso** in “Formato” (sito “Formato:”): app: cartaceo — sito: Cartaceo Elettronico
- **Predefinito diverso** in “Documento” (sito “Documento:”): app: parti — sito: prodotto dalle parti da archivio

### Interessi a Tasso Fisso (`interessi-tasso-fisso`)

Pagina sito: `/servizi/interessi_tasso_fisso.php` · campi app: 5 · campi sito: 5

**Opzioni diverse** (1)
- **Opzioni diverse** in “Capitalizzazione degli interessi” (sito “[etichetta non leggibile, nome Anatocismo]”): solo nell'app: "nessuna capitalizzazione (sull'interesse accumulato non si calcola un ulteriore interesse)", "trimestrale (ogni 3 mesi l'interesse maturato si aggiunge al capitale)", "semestrale (ogni 6 mesi l'interesse maturato si aggiunge al capitale)", "annuale (ogni 12 mesi l'interesse maturato si aggiunge al capitale)"; solo nel sito: "nessuna capitalizzazione degli interessi (sull'interesse accumulato non si calcola un ulteriore interesse)", "capitalizzazione trimestrale (ogni 3 (tre) mesi l'interesse maturato si aggiunge al capitale)", "capitalizzazione semestrale (ogni 6 (sei) mesi l'interesse maturato si aggiunge al capitale)", "capitalizzazione annuale (ogni 12 (dodici) mesi l'interesse maturato si aggiunge al capitale)"

**Predefiniti diversi** (5)
- **Predefinito diverso** in “Tasso %” (sito “Tasso %”): app: vuoto — sito: 0,00
- **Predefinito diverso** in “Capitale €” (sito “Capitale €”): app: vuoto — sito: 0,00
- **Predefinito diverso** in “Data inizio” (sito “Data Inizio:”): app: vuoto — sito: oggi (15/11/2026)
- **Predefinito diverso** in “Data fine” (sito “Data Fine:”): app: vuoto — sito: oggi (15/11/2026)
- **Predefinito diverso** in “Capitalizzazione degli interessi” (sito “[etichetta non leggibile, nome Anatocismo]”): app: 0 — sito: Nessuna capitalizzazione degli interessi (sull'interesse accumulato non si calcola un ulteriore interesse)

### Rivalutazione Annuale Media (`rivalutazione-annuale-media`)

Pagina sito: `/servizi/calcolo-rivalutazione-annuale-media.php` · campi app: 3 · campi sito: 3

**Etichette diverse** (2)
- **Etichetta diversa:** app “Anno iniziale (dal 1947)” ↔ sito “Anno iniziale:”
- **Etichetta diversa:** app “Anno finale (massimo 20 anni dopo)” ↔ sito “Anno finale:”

**Opzioni diverse** (2)
- **Opzioni diverse** in “Anno iniziale (dal 1947)” (sito “Anno iniziale:”): il sito offre una scelta (79 opzioni), l'app un campo libero
- **Opzioni diverse** in “Anno finale (massimo 20 anni dopo)” (sito “Anno finale:”): il sito offre una scelta (79 opzioni), l'app un campo libero

**Predefiniti diversi** (2)
- **Predefinito diverso** in “Anno iniziale (dal 1947)” (sito “Anno iniziale:”): app: vuoto — sito: 2024
- **Predefinito diverso** in “Anno finale (massimo 20 anni dopo)” (sito “Anno finale:”): app: vuoto — sito: 2025

### Termini Deposito Atti Appello (`termini-deposito-appello`)

Pagina sito: `/servizi/calcolo-termini-deposito-atti-appello.php` · campi app: 3 · campi sito: 3

**Campi mancanti nell'app** (1)
- **Campo mancante nell'app:** “Sospensione straordinaria: (nascosto all'avvio)”

**Campi in più nell'app** (1)
- **Campo in più nell'app:** “Applica sospensione Covid-19 (9/3-11/5/2020)”

**Etichette diverse** (2)
- **Etichetta diversa:** app “Data udienza di precisazione delle conclusioni” ↔ sito “Data udienza:”
- **Etichetta diversa:** app “Applica sospensione feriale (1-31 agosto)” ↔ sito “Sospensione feriale:”

**Predefiniti diversi** (2)
- **Predefinito diverso** in “Data udienza di precisazione delle conclusioni” (sito “Data udienza:”): app: vuoto — sito: oggi (15/11/2026)
- **Predefinito diverso** in “Applica sospensione feriale (1-31 agosto)” (sito “Sospensione feriale:”): app: non selezionata — sito: selezionata

### Termini Separazione e Divorzio (`termini-separazione-divorzio`)

Pagina sito: `/servizi/calcolo-termini-separazione-divorzio.php` · campi app: 4 · campi sito: 3

**Campi mancanti nell'app** (1)
- **Campo mancante nell'app:** “Sospensione straordinaria: (nascosto all'avvio)”

**Campi in più nell'app** (2)
- **Campo in più nell'app:** “Fase”
- **Campo in più nell'app:** “Applica sospensione Covid-19 (9/3-11/5/2020)”

**Etichette diverse** (1)
- **Etichetta diversa:** app “Applica sospensione feriale (1-31 agosto)” ↔ sito “Sospensione feriale:”

**Predefiniti diversi** (2)
- **Predefinito diverso** in “Data udienza” (sito “Data udienza:”): app: vuoto — sito: oggi (15/11/2026)
- **Predefinito diverso** in “Applica sospensione feriale (1-31 agosto)” (sito “Sospensione feriale:”): app: non selezionata — sito: selezionata

### Calcolo Valore Catastale (`valore-catastale`)

Pagina sito: `/servizi/calcolo-valore-catastale-immobili-asse-ereditario.php` · campi app: 3 · campi sito: 4

**Campi mancanti nell'app** (1)
- **Campo mancante nell'app:** “Data di riferimento:”

**Etichette diverse** (2)
- **Etichetta diversa:** app “Rendita catastale (o reddito dominicale per i terreni) €” ↔ sito “Rendita catastale €”
- **Etichetta diversa:** app “Abitazione principale (non di lusso)” ↔ sito “Abitazione principale:”

**Opzioni diverse** (1)
- **Opzioni diverse** in “Categoria catastale” (sito “Categoria catastale:”): solo nell'app: "a/1", "a/2", "a/3", "a/4", "a/5", "a/6", "a/7", "a/8", "a/9", "a/11", "b/1", "b/2", "b/3", "b/4", "b/5", "b/6", "b/7", "b/8", "c/1", "c/2", "c/3", "c/4", "c/5", "c/6", "c/7", "d/1", "d/2", "d/3", "d/4", "d/5", "d/6", "d/7", "d/8", "d/9", "d/10", "e/1", "e/2", "e/3", "e/4", "e/5", "e/6", "e/7", "e/8", "e/9", "terreni"; solo nel sito: "a/1 - abitazioni di tipo signorile", "a/2 - abitazioni di tipo civile", "a/3 - abitazioni di tipo economico", "a/4 - abitazioni di tipo popolare", "a/5 - abitazioni di tipo ultrapopolare", "a/6 - abitazioni di tipo rurale", "a/7 - abitazioni in villini", "a/8 - abitazioni in ville", "a/9 - castelli, palazzi di eminenti pregi artistici o storici", "a/10 - uffici e studi privati", "a/11 - abitazioni ed alloggi tipici dei luoghi", "b/1 - collegi, ricoveri, orfanotrofi, ospizi, conventi, seminari, caserme", "b/2 - case di cura ed ospedali (senza fine di lucro)", "b/3 - prigioni e riformatori", "b/4 - uffici pubblici", "b/5 - scuole e laboratori scientifici", "b/6 - biblioteche, musei, gallerie, accademie non comprese in a/9", "b/7 - cappelle ed oratori non destinati all'esercizio pubblico del culto", "b/8 - magazzini sotterranei per depositi di derrate", "c/1 - negozi e botteghe", "c/2 - magazzini e locali di deposito", "c/3 - laboratori per arti e mestieri", "c/4 - fabbricati e locali per esercizi sportivi (senza fine di lucro)", "c/5 - stabilimenti balneari e di acque curative (senza fine di lucro)", "c/6 - stalle, scuderie, rimesse, autorimesse (senza fine di lucro)", "c/7 - tettoie chiuse od aperte", "d/1 - opifici", "d/2 - alberghi e pensioni (con fine di lucro)", "d/3 - teatri, cinema, sale per concerti e spettacoli (con fine di lucro)", "d/4 - case di cura ed ospedali (con fine di lucro)", "d/5 - istituto di credito, cambio e assicurazione (con fine di lucro)", "d/6 - fabbricati e locali per esercizi sportivi (con fine di lucro)", "d/7 - fabbricati costruiti per le esigenze di un'attività industriale", "d/8 - fabbricati costruiti per le esigenze di un'attività industriale", "d/9 - edifici galleggianti o sospesi, ponti privati soggetti a pedaggio", "d/10 - fabbricati per funzioni produttive connesse alle attività agricole", "d/11 - scuole e laboratori scientifici privati", "d/12 - posti barca in porti turistici, stabilimenti balneari", "e/1 - stazioni per servizi di trasporto, terrestri, marittimi ed aerei", "e/2 - ponti comunali e provinciali soggetti a pedaggio", "e/3 - costruzioni e fabbricati per speciali esigenze pubbliche", "e/4 - recinti chiusi per speciali esigenze pubbliche", "e/5 - fabbricati costituenti fortificazioni e loro dipendenze", "e/6 - fari, semafori, torri per rendere d'uso pubblico l'orologio comunale", "e/7 - fabbricati destinati all'esercizio pubblico dei culti", "e/8 - fabbricati nei cimiteri, esclusi colombari, sepolcri e tombe di famiglia", "e/9 - edifici a destinazione particolare non compresi nel gruppo e", "t - terreni agricoli"

**Predefiniti diversi** (2)
- **Predefinito diverso** in “Categoria catastale” (sito “Categoria catastale:”): app: A/2 — sito: A/2 - Abitazioni di tipo civile
- **Predefinito diverso** in “Abitazione principale (non di lusso)” (sito “Abitazione principale:”): app: non selezionata — sito: selezionata

### Calcolo Inflazione (`inflazione`)

Pagina sito: `/servizi/calcolo-inflazione.php` · campi app: 5 · campi sito: 7

**Etichette diverse** (2)
- **Etichetta diversa:** app “Usa gli indici Istat” ↔ sito “Utilizza indici Istat:”
- **Etichetta diversa:** app “Tasso di inflazione da usare (%)” ↔ sito “Inflazione:”

**Opzioni diverse** (1)
- **Opzioni diverse** in “Usa gli indici Istat” (sito “Utilizza indici Istat:”): il sito offre una scelta (2 opzioni), l'app un campo libero

**Predefiniti diversi** (2)
- **Predefinito diverso** in “Somma di denaro €” (sito “Somma di denaro €”): app: vuoto — sito: 0,00
- **Predefinito diverso** in “Usa gli indici Istat” (sito “Utilizza indici Istat:”): app: selezionata — sito: SiNo

**Da verificare a mano** (6)
- _Da verificare:_ “Dal” — campi del sito con etichetta non leggibile: 4
- _Da verificare:_ “Al” — campi del sito con etichetta non leggibile: 4
- _Da verificare:_ campo sito senza etichetta leggibile (nome: MeseInizio, tipo: scelta, 12 opzioni)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: AnnoInizio, tipo: scelta, 80 opzioni)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: MeseFine, tipo: scelta, 12 opzioni)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: AnnoFine, tipo: scelta, 80 opzioni)

### Calcolo Menomazioni Plurime (`menomazioni-plurime`)

Pagina sito: `/servizi/calcolo-riduzionistico-menomazioni-plurime.php` · campi app: 3 · campi sito: 3

**Campi mancanti nell'app** (1)
- **Campo mancante nell'app:** “Percentuali di Invalidita:”

**Campi in più nell'app** (1)
- **Campo in più nell'app:** “Percentuali di invalidità delle singole menomazioni”

**Etichette diverse** (1)
- **Etichetta diversa:** app “Metodo” ↔ sito “Metodo di Calcolo:”

**Opzioni diverse** (1)
- **Opzioni diverse** in “Metodo” (sito “Metodo di Calcolo:”): solo nell'app: "balthazard (menomazioni coesistenti)", "salomonica (menomazioni concorrenti)"; solo nel sito: "formula di balthazard (menomazioni coesistenti)", "formula salomonica (menomazioni concorrenti)"

**Predefiniti diversi** (1)
- **Predefinito diverso** in “Metodo” (sito “Metodo di Calcolo:”): app: balthazard — sito: Formula di Balthazard (menomazioni coesistenti)

### Rivalutazione Storica (`rivalutazione-storica`)

Pagina sito: `/servizi/rivalutazione-monetaria-storica.php` · campi app: 4 · campi sito: 4

**Etichette diverse** (2)
- **Etichetta diversa:** app “Capitale” ↔ sito “[etichetta non leggibile, nome Capitale]”
- **Etichetta diversa:** app “Anno iniziale (min 1861)” ↔ sito “Anno Iniziale:”

**Opzioni diverse** (1)
- **Opzioni diverse** in “Valuta” (sito “[etichetta non leggibile, nome TipoValuta]”): solo nell'app: "euro", "lire"; solo nel sito: "lire euro"

**Predefiniti diversi** (2)
- **Predefinito diverso** in “Capitale” (sito “[etichetta non leggibile, nome Capitale]”): app: vuoto — sito: 0
- **Predefinito diverso** in “Valuta” (sito “[etichetta non leggibile, nome TipoValuta]”): app: euro — sito: Lire Euro

### Tariffe Mediazione (`tariffe-mediazione`)

Pagina sito: `/servizi/calcolo-costi-e-tariffe-mediazione-civile.php` · campi app: 11 · campi sito: 11

**Etichette diverse** (5)
- **Etichetta diversa:** app “Valore controversia € (da 41 a 5.000.000, in euro interi)” ↔ sito “Valore controversia €”
- **Etichetta diversa:** app “Materia obbligatoria (riduzione per materie obbligatorie ex art. 5)” ↔ sito “Materia obbligatoria:”
- **Etichetta diversa:** app “Assenza controparte (riduzione a 40 o 50 euro)” ↔ sito “Assenza controparte:”
- **Etichetta diversa:** app “Proposta formulata (aumento pari al 20%)” ↔ sito “Proposta formulata:”
- **Etichetta diversa:** app “Spese di avvio imponibili ai fini IVA” ↔ sito “Spese avvio imponibili:”

**Da verificare a mano** (8)
- _Da verificare:_ “Complessità (aumento fino al 20%)” — campi del sito con etichetta non leggibile: 4
- _Da verificare:_ “Esito positivo (aumento fino al 25%)” — campi del sito con etichetta non leggibile: 4
- _Da verificare:_ “IVA” — campi del sito con etichetta non leggibile: 4
- _Da verificare:_ “IVA %” — campi del sito con etichetta non leggibile: 4
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Difficolta, tipo: casella)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Successo, tipo: casella)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: DoIva, tipo: casella)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: PctIva, tipo: testo)

### Termini Memorie e Repliche (`termini-memorie`)

Pagina sito: `/servizi/calcolo-termini-memorie-integrative-comparse-repliche.php` · campi app: 3 · campi sito: 3

**Campi mancanti nell'app** (1)
- **Campo mancante nell'app:** “Sospensione straordinaria: (nascosto all'avvio)”

**Campi in più nell'app** (1)
- **Campo in più nell'app:** “Tipo di termine”

**Etichette diverse** (2)
- **Etichetta diversa:** app “Data udienza di trattazione (o collegiale di discussione, per le conclusionali)” ↔ sito “Data udienza:”
- **Etichetta diversa:** app “Applica sospensione feriale (1-31 agosto)” ↔ sito “Sospensione feriale:”

**Predefiniti diversi** (1)
- **Predefinito diverso** in “Applica sospensione feriale (1-31 agosto)” (sito “Sospensione feriale:”): app: non selezionata — sito: selezionata

### Calcolo Usufrutto (`usufrutto`)

Pagina sito: `/servizi/calcolo_usufrutto_nuda_proprieta.php` · campi app: 4 · campi sito: 4

**Campi mancanti nell'app** (1)
- **Campo mancante nell'app:** “Interesse Legale di Riferimento: 2,50%”

**Campi in più nell'app** (1)
- **Campo in più nell'app:** “Tipo di usufrutto”

**Etichette diverse** (2)
- **Etichetta diversa:** app “Età dell'usufruttuario” ↔ sito “Età:”
- **Etichetta diversa:** app “Durata (anni)” ↔ sito “Durata:”

**Predefiniti diversi** (1)
- **Predefinito diverso** in “Valore della piena proprietà €” (sito “Valore della Piena Proprietà €”): app: vuoto — sito: 0,00

### Calcolo Equo Indennizzo (`equo-indennizzo`)

Pagina sito: `/servizi/calcolo-equo-indennizzo-causa-servizio.php` · campi app: 3 · campi sito: 3

**Campi mancanti nell'app** (1)
- **Campo mancante nell'app:** “Categoria lesione-infermità:”

**Campi in più nell'app** (1)
- **Campo in più nell'app:** “Categoria di menomazione”

**Etichette diverse** (1)
- **Etichetta diversa:** app “Stipendio tabellare annuo lordo €” ↔ sito “Stipendio tabellare annuale €”

**Opzioni diverse** (1)
- **Opzioni diverse** in “Età” (sito “Età:”): il sito offre una scelta (54 opzioni), l'app un campo libero

### Calcolo Età Anagrafica (`eta-anagrafica`)

Pagina sito: `/servizi/calcolo-eta-anagrafica.php` · campi app: 2 · campi sito: 3

**Campi mancanti nell'app** (2)
- **Campo mancante nell'app:** “Codice Fiscale:”
- **Campo mancante nell'app:** “Calcola età al:”

**Campi in più nell'app** (1)
- **Campo in più nell'app:** “Data di riferimento (default oggi)”

**Predefiniti diversi** (1)
- **Predefinito diverso** in “Data di nascita” (sito “Data di nascita:”): app: vuoto — sito: 00/00/

### Giorni tra due date (`giorni-tra-date`)

Pagina sito: `/servizi/calcolo-giorni-tra-date-e-ricorrenze.php` · campi app: 9 · campi sito: 6

**Etichette diverse** (2)
- **Etichetta diversa:** app “Data iniziale” ↔ sito “CALCOLO GIORNI TRA DATE, FESTE e RICORRENZE”
- **Etichetta diversa:** app “Data finale” ↔ sito “CALCOLO GIORNI TRA DATE, FESTE e RICORRENZE”

**Predefiniti diversi** (2)
- **Predefinito diverso** in “Data iniziale” (sito “CALCOLO GIORNI TRA DATE, FESTE e RICORRENZE”): app: vuoto — sito: oggi (15/11/2026)
- **Predefinito diverso** in “Data finale” (sito “CALCOLO GIORNI TRA DATE, FESTE e RICORRENZE”): app: vuoto — sito: 00/00/

**Da verificare a mano** (11)
- _Da verificare:_ “Sabati” — campi del sito con etichetta non leggibile: 4
- _Da verificare:_ “Domeniche” — campi del sito con etichetta non leggibile: 4
- _Da verificare:_ “Festivi” — campi del sito con etichetta non leggibile: 4
- _Da verificare:_ “Chiusura estiva (1-31 agosto)” — campi del sito con etichetta non leggibile: 4
- _Da verificare:_ “Conta anche il giorno iniziale (di norma escluso)” — campi del sito con etichetta non leggibile: 4
- _Da verificare:_ “Festa patronale locale — giorno (opzionale)” — campi del sito con etichetta non leggibile: 4
- _Da verificare:_ “Festa patronale locale — mese (opzionale)” — campi del sito con etichetta non leggibile: 4
- _Da verificare:_ campo sito senza etichetta leggibile (nome: RicorrenzaDal, tipo: scelta, 58 opzioni)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: AnnoRicDal, tipo: scelta, 82 opzioni)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: RicorrenzaAl, tipo: scelta, 58 opzioni)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: AnnoRicAl, tipo: scelta, 82 opzioni)

### Calcolo Interessi Legali (`interessi-legali`)

Pagina sito: `/servizi/interessi_legali.php` · campi app: 4 · campi sito: 4

**Etichette diverse** (2)
- **Etichetta diversa:** app “Dal” ↔ sito “Data Inizio:”
- **Etichetta diversa:** app “Al” ↔ sito “Data Fine:”

**Predefiniti diversi** (2)
- **Predefinito diverso** in “Capitale €” (sito “Capitale €”): app: vuoto — sito: 0,00
- **Predefinito diverso** in “Dal” (sito “Data Inizio:”): app: oggi — sito: 01/01/1970

**Da verificare a mano** (2)
- _Da verificare:_ “Capitalizzazione” — campi del sito con etichetta non leggibile: 1
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Anatocismo, tipo: scelta, 4 opzioni)

### Calcolo Interessi di Mora (`interessi-mora`)

Pagina sito: `/servizi/interessi_moratori.php` · campi app: 5 · campi sito: 6

**Campi mancanti nell'app** (2)
- **Campo mancante nell'app:** “Importo €”
- **Campo mancante nell'app:** “Applica la maggiorazione del”

**Etichette diverse** (2)
- **Etichetta diversa:** app “Dal” ↔ sito “Data Inizio:”
- **Etichetta diversa:** app “Al” ↔ sito “Data Fine:”

**Da verificare a mano** (5)
- _Da verificare:_ “Capitale €” — campi del sito con etichetta non leggibile: 2
- _Da verificare:_ “Maggiorazione aggiuntiva sul tasso %” — campi del sito con etichetta non leggibile: 2
- _Da verificare:_ “Capitalizzazione” — campi del sito con etichetta non leggibile: 2
- _Da verificare:_ campo sito senza etichetta leggibile (nome: NormativaPrevigente, tipo: casella)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Maggiorazione, tipo: casella)

### Termini Processuali Civili (`scadenze`)

Pagina sito: `/servizi/calcolo-termini-processuali-civili.php` · campi app: 9 · campi sito: 8

**Etichette diverse** (2)
- **Etichetta diversa:** app “Rito” ↔ sito “[etichetta non leggibile, nome Rito]”
- **Etichetta diversa:** app “Data di partenza” ↔ sito “Dies a quo:”

**Opzioni diverse** (1)
- **Opzioni diverse** in “Direzione” (sito “[etichetta non leggibile, nome PrimaDopo]”): solo nell'app: "avanti", "ritroso"; solo nel sito: "a ritroso in avanti"

**Predefiniti diversi** (1)
- **Predefinito diverso** in “Direzione” (sito “[etichetta non leggibile, nome PrimaDopo]”): app: Avanti — sito: A ritroso In avanti

**Da verificare a mano** (9)
- _Da verificare:_ “Voce notevole del c.p.c. (facoltativo)” — campi del sito con etichetta non leggibile: 4
- _Da verificare:_ “Termine” — campi del sito con etichetta non leggibile: 4
- _Da verificare:_ “Applica sospensione feriale (1-31 agosto)” — campi del sito con etichetta non leggibile: 4
- _Da verificare:_ “Applica sospensione straordinaria COVID-19 (9 marzo - 11 maggio 2020)” — campi del sito con etichetta non leggibile: 4
- _Da verificare:_ “Termine libero (art. 155 c.p.c.: né il giorno iniziale né quello finale si computano — solo per i casi previsti dalla legge, es. art. 163-bis)” — campi del sito con etichetta non leggibile: 4
- _Da verificare:_ campo sito senza etichetta leggibile (nome: IdTermine, tipo: scelta, 94 opzioni)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Termine1, tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: TermineLibero, tipo: casella)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: SospensioneFeriale, tipo: casella)

### Tassa Registro Locazioni (`tassa-registro-locazione`)

Pagina sito: `/servizi/calcolo-imposta-registro-contratto-locazione.php` · campi app: 7 · campi sito: 8

**Campi mancanti nell'app** (2)
- **Campo mancante nell'app:** “Tipologia Immobile:”
- **Campo mancante nell'app:** “Pagamento Imposta:”

**Etichette diverse** (2)
- **Etichetta diversa:** app “Canone concordato (-30%)” ↔ sito “Canone Concordato:”
- **Etichetta diversa:** app “Locatore soggetto IVA” ↔ sito “Soggetto Passivo Iva:”

**Da verificare a mano** (9)
- _Da verificare:_ “Tipo di immobile” — campi del sito con etichetta non leggibile: 4
- _Da verificare:_ “Durata del contratto (anni)” — campi del sito con etichetta non leggibile: 4
- _Da verificare:_ “L'importo del canone è riferito a” — campi del sito con etichetta non leggibile: 4
- _Da verificare:_ “Importo del canone €” — campi del sito con etichetta non leggibile: 4
- _Da verificare:_ “Modalità di pagamento” — campi del sito con etichetta non leggibile: 4
- _Da verificare:_ campo sito senza etichetta leggibile (nome: DurataContratto, tipo: scelta, 120 opzioni)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: TipoDurata, tipo: scelta, 2 opzioni)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: ImportoCanone, tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: TipoImportoCanone, tipo: scelta, 3 opzioni)

### Calcolo Scadenze (`calcolo-scadenze`)

Pagina sito: `/servizi/calcolo_scadenze_termini_udienze.php` · campi app: 7 · campi sito: 4

**Opzioni diverse** (1)
- **Opzioni diverse** in “Prima o dopo la data iniziale” (sito “[etichetta non leggibile, nome PrimaDopo]”): solo nell'app: "prima", "dopo"; solo nel sito: "prima dopo"

**Predefiniti diversi** (2)
- **Predefinito diverso** in “Data iniziale” (sito “Data Iniziale:”): app: vuoto — sito: oggi (15/11/2026)
- **Predefinito diverso** in “Prima o dopo la data iniziale” (sito “[etichetta non leggibile, nome PrimaDopo]”): app: dopo — sito: Prima Dopo

**Da verificare a mano** (7)
- _Da verificare:_ “Cosa vuoi calcolare” — campi del sito con etichetta non leggibile: 2
- _Da verificare:_ “Numero giorni (max 365 con la sospensione, 3650 senza)” — campi del sito con etichetta non leggibile: 2
- _Da verificare:_ “Sospensione dei termini processuali (1-31 agosto)” — campi del sito con etichetta non leggibile: 2
- _Da verificare:_ “Data iniziale” — campi del sito con etichetta non leggibile: 2
- _Da verificare:_ “Data finale” — campi del sito con etichetta non leggibile: 2
- _Da verificare:_ campo sito senza etichetta leggibile (nome: NumeroGiorni, tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: SospensioneFeriale, tipo: casella)

### Conversione Pena (`conversione-pena`)

Pagina sito: `/servizi/calcolo-conversione-pena-detentiva-pecuniaria.php` · campi app: 12 · campi sito: 11

**Etichette diverse** (2)
- **Etichetta diversa:** app “Valore giornaliero di ragguaglio €” ↔ sito “Valore giornaliero €”
- **Etichetta diversa:** app “Pena pecuniaria da convertire €” ↔ sito “Pena pecuniaria €”

**Ordine diverso** (1)
- **Ordine diverso:** “Valore giornaliero di ragguaglio €” (app, posizione 2) ↔ “Valore giornaliero €” (sito, posizione 11)

**Da verificare a mano** (19)
- _Da verificare:_ “Direzione” — campi del sito con etichetta non leggibile: 9
- _Da verificare:_ “Anni” — campi del sito con etichetta non leggibile: 9 (×3)
- _Da verificare:_ “Mesi” — campi del sito con etichetta non leggibile: 9 (×3)
- _Da verificare:_ “Giorni” — campi del sito con etichetta non leggibile: 9 (×3)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Anni3, tipo: scelta, 31 opzioni)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Mesi3, tipo: scelta, 49 opzioni)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Giorni3, tipo: scelta, 91 opzioni)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Anni1, tipo: scelta, 31 opzioni)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Mesi1, tipo: scelta, 49 opzioni)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Giorni1, tipo: scelta, 91 opzioni)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Anni2, tipo: scelta, 31 opzioni)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Mesi2, tipo: scelta, 49 opzioni)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Giorni2, tipo: scelta, 91 opzioni)

### Calcolo Devalutazione (`devalutazione`)

Pagina sito: `/servizi/calcolo_devalutazione_monetaria.php` · campi app: 3 · campi sito: 6

**Campi mancanti nell'app** (1)
- **Campo mancante nell'app:** “Variazione rispetto allo stesso mese dell'anno precedente = 4%”

**Etichette diverse** (1)
- **Etichetta diversa:** app “Importo da devalutare €” ↔ sito “Importo €”

**Predefiniti diversi** (1)
- **Predefinito diverso** in “Importo da devalutare €” (sito “Importo €”): app: vuoto — sito: 0,00

**Da verificare a mano** (6)
- _Da verificare:_ “Dal (più recente)” — campi del sito con etichetta non leggibile: 4
- _Da verificare:_ “Al (più remoto)” — campi del sito con etichetta non leggibile: 4
- _Da verificare:_ campo sito senza etichetta leggibile (nome: MeseFine, tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: AnnoFine, tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: MeseInizio, tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: AnnoInizio, tipo: testo)

### Spese Trasferta Avvocati (`spese-trasferta-avvocati`)

Pagina sito: `/servizi/calcolo-spese-trasferta-avvocati.php` · campi app: 3 · campi sito: 147

**Campi mancanti nell'app** (2)
- **Campo mancante nell'app:** “Costi accessori Hotel:”
- **Campo mancante nell'app:** “Totale Generale €”

**Etichette diverse** (1)
- **Etichetta diversa:** app “Rimborso carburante % (massimo 20%)” ↔ sito “Rimborso carburante:”

**Da verificare a mano** (146)
- _Da verificare:_ “Costi accessori albergo % (massimo 10%)” — campi del sito con etichetta non leggibile: 144
- _Da verificare:_ “Trasferte (massimo 8)” — campi del sito con etichetta non leggibile: 144
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Localita[], tipo: testo) (×8)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: DataTrasferta[], tipo: testo) (×8)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: CostoCarburante[], tipo: testo) (×8)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Chilometri[], tipo: testo) (×8)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: TotCarburante[], tipo: testo) (×8)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Pedaggi[], tipo: testo) (×8)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Parcheggio[], tipo: testo) (×8)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: TotSpeseAuto[], tipo: testo) (×8)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Albergo[], tipo: testo) (×8)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: CostiAccessori[], tipo: testo) (×8)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: TotAlbergo[], tipo: testo) (×8)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Treno[], tipo: testo) (×8)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Aereo[], tipo: testo) (×8)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: AltriTrasporti[], tipo: testo) (×8)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: TotTrasporti[], tipo: testo) (×8)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Vitto[], tipo: testo) (×8)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: SpeseVarie[], tipo: testo) (×8)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: TotTrasferta[], tipo: testo) (×8)

### Calcolo Surroga (`surroga-mutuo`)

Pagina sito: `/servizi/calcolo-surroga-mutuo.php` · campi app: 8 · campi sito: 9

**Campi mancanti nell'app** (1)
- **Campo mancante nell'app:** “Capitale Finanziato:”

**Etichette diverse** (2)
- **Etichetta diversa:** app “Tasso annuale originario %” ↔ sito “Tasso Annuale:”
- **Etichetta diversa:** app “Nuovo tasso annuale (surroga) %” ↔ sito “Nuovo Tasso:”

**Da verificare a mano** (12)
- _Da verificare:_ “Capitale del mutuo originario €” — campi del sito con etichetta non leggibile: 6
- _Da verificare:_ “Durata originaria (anni)” — campi del sito con etichetta non leggibile: 6
- _Da verificare:_ “Dal mese di (inizio mutuo originario)” — campi del sito con etichetta non leggibile: 6
- _Da verificare:_ “Dal mese di (surroga)” — campi del sito con etichetta non leggibile: 6
- _Da verificare:_ “Durata della surroga” — campi del sito con etichetta non leggibile: 6
- _Da verificare:_ “Nuova durata (anni)” — campi del sito con etichetta non leggibile: 6
- _Da verificare:_ campo sito senza etichetta leggibile (nome: MeseInizio, tipo: scelta, 13 opzioni)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: AnnoInizio, tipo: scelta, 42 opzioni)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: DurataAnni, tipo: scelta, 40 opzioni)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: MeseSurroga, tipo: scelta, 13 opzioni)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: AnnoSurroga, tipo: scelta, 22 opzioni)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: DurataAnniSurroga, tipo: scelta, 41 opzioni)

### Calcolo Tasso di Usura (`tasso-usura`)

Pagina sito: `/servizi/calcolo_tasso_usura.php` · campi app: 6 · campi sito: 7

**Etichette diverse** (1)
- **Etichetta diversa:** app “Tasso di interesse % (vuoto = solo soglia)” ↔ sito “Tasso di interesse”

**Opzioni diverse** (1)
- **Opzioni diverse** in “Finanziamento” (sito “Finanziamento”): solo nell'app: "da gennaio 2010 · 1. apertura di credito in conto corrente", "da gennaio 2010 · 2. scoperti senza affidamento", "da gennaio 2010 · 3. anticipi su crediti e sconti, anticipo fornitori", "da gennaio 2010 · 4. finanziamento alle imprese (fino a mar/10)", "da gennaio 2010 · 5. credito personale", "da gennaio 2010 · 6. credito finalizzato", "da gennaio 2010 · 7. factoring", "da gennaio 2010 · 8. leasing immobiliare a tasso fisso", "da gennaio 2010 · 9. leasing immobiliare a tasso variabile", "da gennaio 2010 · 10. finanziamento bancario alle famiglie (fino a mar/10)", "da gennaio 2010 · 11. leasing autoveicoli e aeronavale", "da gennaio 2010 · 12. finanziamento non bancario alle famiglie (fino a mar/10)", "da gennaio 2010 · 13. leasing strumentale", "da gennaio 2010 · 14. mutuo a tasso fisso", "da gennaio 2010 · 15. mutuo a tasso variabile", "da gennaio 2010 · 16. cessione del quinto", "da gennaio 2010 · 17. leasing immobiliare (fino a mar/11)", "da gennaio 2010 · 18. credito revolving", "da gennaio 2010 · 19. finanziamenti con carte di credito", "da gennaio 2010 · 20. altri finanziamenti", "fino al 2009 · 1. apertura di credito in conto corrente", "fino al 2009 · 2. finanziamento bancario alle imprese", "fino al 2009 · 3. finanziamento bancario personale o alla famiglia", "fino al 2009 · 4. factoring", "fino al 2009 · 5. finanziamento da intermediari non bancari", "fino al 2009 · 6. mutuo a tasso fisso", "fino al 2009 · 7. leasing", "fino al 2009 · 8. mutuo a tasso variabile", "fino al 2009 · 9. cessione del quinto", "fino al 2009 · 10. acquisto rateale beni di consumo e revolving"; solo nel sito: "1. apertura di credito in conto corrente", "2. scoperti senza affidamento", "3. anticipi su crediti e sconti, anticipo fornitori", "4. finanziamento alle imprese (fino a mar/10)", "5. credito personale", "6. credito finalizzato", "7. factoring", "8. leasing immobiliare a tasso fisso", "9. leasing immobiliare a tasso variabile", "10. finanziamento bancario alle famiglie (fino a mar/10)", "11. leasing autoveicoli e aeronavale", "12. finanziamento non bancario alle famiglie (fino a mar/10)", "13. leasing strumentale", "14. mutuo a tasso fisso", "15. mutuo a tasso variabile", "16. cessione del quinto", "17. leasing immobiliare (fino a mar/11)", "18. credito revolving", "19. finanziamenti con carte di credito", "20. altri finanziamenti", "2. finanziamento bancario alle imprese", "3. finanziamento bancario personale o alla famiglia", "4. factoring", "5. finanziamento da intermediari non bancari", "6. mutuo a tasso fisso", "7. leasing", "8. mutuo a tasso variabile", "9. cessione del quinto", "10. acquisto rateale beni di consumo e revolving"

**Predefiniti diversi** (1)
- **Predefinito diverso** in “Finanziamento” (sito “Finanziamento”): app: n:1 — sito: 1. Apertura di credito in conto corrente

**Da verificare a mano** (7)
- _Da verificare:_ “Mese di riferimento” — campi del sito con etichetta non leggibile: 4
- _Da verificare:_ “Indica un mese finale (più trimestri)” — campi del sito con etichetta non leggibile: 4
- _Da verificare:_ “Mese finale” — campi del sito con etichetta non leggibile: 4
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Mese1, tipo: scelta, 12 opzioni)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Anno1, tipo: scelta, 25 opzioni)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Mese2, tipo: scelta, 13 opzioni)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Anno2, tipo: scelta, 26 opzioni)

### Calcolo Contributo Unificato (`contributo-unificato`)

Pagina sito: `/servizi/calcolo_contributo_unificato.php` · campi app: 8 · campi sito: 5

**Campi mancanti nell'app** (1)
- **Campo mancante nell'app:** “Valore determinato €:”

**Predefiniti diversi** (1)
- **Predefinito diverso** in “Giudizio” (sito “Giudizio”): app: primo_grado — sito: Primo grado

**Da verificare a mano** (8)
- _Da verificare:_ “Procedimento a contributo fisso” — campi del sito con etichetta non leggibile: 2
- _Da verificare:_ “Rito” — campi del sito con etichetta non leggibile: 2
- _Da verificare:_ “Valore della causa” — campi del sito con etichetta non leggibile: 2
- _Da verificare:_ “Importo della causa €” — campi del sito con etichetta non leggibile: 2
- _Da verificare:_ “Ufficio giudiziario” — campi del sito con etichetta non leggibile: 2
- _Da verificare:_ “Riduzione del 50% (ingiunzione, sfratto, cautelari/possessori, ATP, lavoro/pubblico impiego)” — campi del sito con etichetta non leggibile: 2
- _Da verificare:_ campo sito senza etichetta leggibile (nome: TipoValore, tipo: scelta, 3 opzioni)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Riduzione, tipo: casella)

### Calcolo Diritti di Copia (`diritti-copia`)

Pagina sito: `/servizi/calcolo_diritti_copia_cancelleria.php` · campi app: 6 · campi sito: 6

**Opzioni diverse** (1)
- **Opzioni diverse** in “Formato” (sito “Formato:”): solo nell'app: "cartaceo", "elettronico"; solo nel sito: "cartaceo elettronico"

**Predefiniti diversi** (1)
- **Predefinito diverso** in “Formato” (sito “Formato:”): app: cartaceo — sito: Cartaceo Elettronico

### Grado di Parentela (`grado-parentela`)

Pagina sito: `/servizi/calcolo-grado-di-parentela.php` · campi app: 1 · campi sito: 1

**Etichette diverse** (1)
- **Etichetta diversa:** app “Parentela” ↔ sito “Parentela/Affinità:”

**Predefiniti diversi** (1)
- **Predefinito diverso** in “Parentela” (sito “Parentela/Affinità:”): app: 0 — sito: padre

### Calcolo Ritenuta d'Acconto (`ritenuta-acconto`)

Pagina sito: `/servizi/calcolo-ritenuta-d-acconto.php` · campi app: 3 · campi sito: 4

**Campi mancanti nell'app** (1)
- **Campo mancante nell'app:** “Importo Netto:”

**Etichette diverse** (1)
- **Etichetta diversa:** app “Importo €” ↔ sito “Importo Lordo:”

**Da verificare a mano** (4)
- _Da verificare:_ “Operazione” — campi del sito con etichetta non leggibile: 2
- _Da verificare:_ “Ritenuta d'acconto %” — campi del sito con etichetta non leggibile: 2
- _Da verificare:_ campo sito senza etichetta leggibile (nome: PctRitenutaLordo, tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: PctRitenutaNetto, tipo: testo)

### Aumenti/Riduzioni Pena (`aumenti-riduzioni-pena`)

Pagina sito: `/servizi/calcolo-aumenti-riduzioni-pena.php` · campi app: 5 · campi sito: 20

**Etichette diverse** (1)
- **Etichetta diversa:** app “Pena pecuniaria € (senza decimali)” ↔ sito “Pena Pecuniaria €”

**Da verificare a mano** (23)
- _Da verificare:_ “Anni (0-90)” — campi del sito con etichetta non leggibile: 19
- _Da verificare:_ “Mesi (0-48)” — campi del sito con etichetta non leggibile: 19
- _Da verificare:_ “Giorni (0-90)” — campi del sito con etichetta non leggibile: 19
- _Da verificare:_ “Operazioni (massimo 4, eseguite in sequenza)” — campi del sito con etichetta non leggibile: 19
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Anni, tipo: scelta, 91 opzioni)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Mesi, tipo: scelta, 49 opzioni)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Giorni, tipo: scelta, 91 opzioni)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Operazione(1), tipo: scelta, 2 opzioni)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Frazione(1), tipo: scelta, 5 opzioni)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: VarNum(1), tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: VarDen(1), tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Operazione(2), tipo: scelta, 2 opzioni)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Frazione(2), tipo: scelta, 5 opzioni)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: VarNum(2), tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: VarDen(2), tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Operazione(3), tipo: scelta, 2 opzioni)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Frazione(3), tipo: scelta, 5 opzioni)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: VarNum(3), tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: VarDen(3), tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Operazione(4), tipo: scelta, 2 opzioni)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Frazione(4), tipo: scelta, 5 opzioni)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: VarNum(4), tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: VarDen(4), tipo: testo)

### Termini 183 + 190 cpc (`termini-183-190`)

Pagina sito: `/servizi/calcolo-termini-memorie-183-comparse-190.php` · campi app: 4 · campi sito: 3

**Predefiniti diversi** (1)
- **Predefinito diverso** in “Data iniziale” (sito “Data Iniziale:”): app: vuoto — sito: oggi (15/11/2026)

**Da verificare a mano** (5)
- _Da verificare:_ “Calcolo” — campi del sito con etichetta non leggibile: 2
- _Da verificare:_ “Sospensione feriale” — campi del sito con etichetta non leggibile: 2
- _Da verificare:_ “Modalità prudenziale (il termine successivo decorre dalla scadenza non posticipata)” — campi del sito con etichetta non leggibile: 2
- _Da verificare:_ campo sito senza etichetta leggibile (nome: SospensioneFeriale, tipo: casella)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Prudenziale, tipo: casella)

### Calcolo Preventivo (`calcolo-preventivo`)

Pagina sito: `/servizi/calcolo_preventivo_online.php` · campi app: 4 · campi sito: 30

**Da verificare a mano** (34)
- _Da verificare:_ “Voci del preventivo” — campi del sito con etichetta non leggibile: 30
- _Da verificare:_ “IVA” — campi del sito con etichetta non leggibile: 30
- _Da verificare:_ “IVA % (numero intero da 1 a 22)” — campi del sito con etichetta non leggibile: 30
- _Da verificare:_ “Ritenuta d'acconto (20%)” — campi del sito con etichetta non leggibile: 30
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Des(0), tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Qta(0), tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Val(0), tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Des(1), tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Qta(1), tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Val(1), tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Des(2), tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Qta(2), tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Val(2), tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Des(3), tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Qta(3), tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Val(3), tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Des(4), tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Qta(4), tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Val(4), tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Des(5), tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Qta(5), tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Val(5), tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Des(6), tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Qta(6), tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Val(6), tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Des(7), tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Qta(7), tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Val(7), tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Des(8), tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Qta(8), tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Val(8), tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Des(9), tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Qta(9), tipo: testo)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: Val(9), tipo: testo)

### Rivalutazione TFR (`coefficiente-rivalutazione-tfr`)

Pagina sito: `/servizi/coefficienti-rivalutazione-tfr.php` · campi app: 1 · campi sito: 2

**Da verificare a mano** (3)
- _Da verificare:_ “Mese e anno (dal 1982)” — campi del sito con etichetta non leggibile: 2
- _Da verificare:_ campo sito senza etichetta leggibile (nome: MeseRif, tipo: scelta, 13 opzioni)
- _Da verificare:_ campo sito senza etichetta leggibile (nome: AnnoRif, tipo: scelta, 46 opzioni)

## Nota di metodo

- **Lato app.** Campi generici letti dalla configurazione `CONFIG_GENERICI` (con `CONFIG_LOTTO_A`) eseguendo il modulo, non a occhio. Per 12 calcolatori scritti a mano nel componente (Interessi legali, Interessi di mora, Scadenze, Termini memorie, Contributo unificato, Rivalutazione ISTAT, Rivalutazione mensile, Adeguamento canone, Interessi vari, Imposta di successione, Compenso CTU, Parcelle) i campi sono stati estratti dal JSX con l'AST TypeScript; per Parcelle la lista è ricostruita leggendo il codice, perché alcune righe sono ripetute per parte e voce.
- **Esclusi dal confronto:** i campi che compaiono solo dopo il calcolo per salvare il risultato (nome della scadenza o della parcella, promemoria e orario di Scadenze), le sezioni di intestazione (`titolo`), la sezione di scelta della pratica e le voci della tabella dei risultati.
- **Lato sito.** Form principale della pagina (escluse ricerca, login, newsletter e Google CSE). Etichetta letta dal DOM vicino al campo. I campi nascosti all'avvio sono inclusi e segnati «(nascosto all'avvio)».
- **Abbinamento.** Prima per etichetta identica (ignorando maiuscole, «€», punteggiatura finale); poi per somiglianza delle parole; poi le date «dal/al» con «data inizio/fine» (in ordine); infine le scelte abbinate per opzioni simili; le liste ripetibili per ordine. Gli abbinamenti per somiglianza sono classificati come «etichetta diversa»: vanno letti come segnalazioni, non come certezze.
- **Date.** Le tre menù giorno/mese/anno del sito sono trattati come un unico campo data. Il predefinito «oggi» (data odierna, anche se fissata dal sito al momento della lettura) è considerato equivalente al predefinito dinamico dell'app.
- **Opzioni.** Confrontate per etichetta, non per valore interno. Dove le opzioni dipendono da altri campi (es. Competenza in Parametri penali 2014, Scaglione in Parametri civili 2012, righe di Nota spese e Notula penale, Scaglioni in Preventivo stragiudiziale, Superficie commerciale) non sono confrontate.
- **Da verificare a mano.** Campi del sito di cui il DOM non dà un'etichetta leggibile (titoli di sezione ripetuti, intestazioni di tabella, campi senza testo vicino). Per questi l'abbinamento è stato tentato solo per opzioni o per tipo; quando non riesce, il campo resta qui e non è contato come mancante.
- **Tabelle.** Spese trasferta, Calcolo preventivo, Parametri (civili/penali) e alcune tabelle di Danno biologico hanno campi ripetuti con intestazioni di colonna non leggibili dal DOM: il confronto è parziale su queste pagine e va verificato a mano sulla pagina.
- **Non confrontato in questo giro:** le etichette dei risultati (richiederebbe l'invio dei moduli); il tipo di widget (testo/numero/data) non è una delle sei categorie e non viene segnalato come differenza.
- **Configurato ma non nel menù:** `precetto` esiste nella configurazione ma non è una voce del menù; non è stato esaminato.
