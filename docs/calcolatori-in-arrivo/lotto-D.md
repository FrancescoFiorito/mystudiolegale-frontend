# Lotto D — danni, penale, proprietà

Stato: backend mergiato (PR #156 `da7d10d` e PR #157 `0459710`), **non deployato su Render e nessuna chiamata alla produzione** (a carico della sessione di coordinamento). Frontend in queste PR. Nessuna build iOS lanciata.

Valori attesi = quelli letti dal sito di riferimento in questa sessione (Chromium headless, form reali compilati e inviati). Confronto contro `server.py` di `main` dopo il merge (coroutine chiamate con `u=None`), voce per voce; le rotte sono presenti in `app.routes` e definite prima di `include_router`.

| Calcolatore | Esito | Casi confrontati |
|---|---|---|
| Danno non Patrimoniale | **non implementato**: 19 tabelle (Milano 2009-2024, Roma 2009-2025, generica) con regole diverse per tabella, vedi sotto | — |
| Aumenti/Riduzioni Pena | allineato **tranne un bug del sito** (numeratore negativo accettato, vedi sotto) | 175 con risultato (+ i casi di errore) |
| Pensione di Reversibilità | **importi allineati in tutti i casi**; in 51 casi su 285 il sito usa la dicitura "riduzione teorica… Tuttavia, per la clausola di salvaguardia" dove noi scriviamo "riduzione… Pertanto" (vedi sotto) | 285 + 6 errori |
| Grado di Parentela | allineato (parte testuale; gli alberi genealogici sono immagini e non sono replicati) | 23 voci su 23 |
| Calcolo Superficie Commerciale | allineato | 715 con risultato (+ 12 di errore) |
| Calcolo Cedolare Secca | allineato **tranne rivalutazione Istat < −100%** (il sito la accetta, noi la rifiutiamo) | 198 + 19 errori |
| Calcolo Impronta Hash | **non implementato**: calcola l'hash di file trascinati nel browser (e verifica un elenco di hash incollato), non è un form con risultato | — |

Le voci "Danno non Patrimoniale" e "Calcolo Impronta Hash" restano "in arrivo" nel menù.

## Regole ricavate dal sito
- **Aumenti/Riduzioni Pena**: fino a 4 operazioni consecutive, ciascuna sul risultato della precedente. Pena detentiva: anno = 360 giorni, mese = 30; la pena base è mostrata come inserita (non normalizzata: "90 anni, 48 mesi, 90 giorni"). Aumento troncato ai giorni interi (5 gg + 1/6 = 5 gg), riduzione per eccesso (10 gg − 1/3 = 6 gg): il risultato è sempre il giorno intero inferiore; zero = "-". Pena pecuniaria: euro interi, la **variazione** è arrotondata all'euro (mezzo per eccesso; 5 − 1/2: variazione 3, risultato 2) e poi sommata/sottratta; la base con decimali è arrotondata (100,5 → 101). Frazioni predefinite 1/6, 1/3, 1/2, 2/3 o personalizzata numeratore/denominatore (una riduzione deve essere < 1, un aumento può superare l'intero, 3/2 e 100/3 sono ammessi); righe del tutto vuote ignorate. Errori letti dal sito: nessuna pena ("Inserisci la pena detentiva e/o pecuniaria"), pecuniaria 0 ("Specifica un valore") o negativa ("Valore non ammesso"), nessuna operazione, riga senza Aumenta/Riduci, frazione mancante, denominatore/numeratore nulli, riduzione ≥ 1.
- **Grado di Parentela**: 23 voci (padre … prosuocero); per ciascuna grado e linea sono fissi. Per cugino di 2° e 3° grado il sito disegna 2 e 3 alberi genealogici possibili (immagini): riportiamo solo il numero. Nel sito il soggetto è un'icona ("Tra [icona] e suo padre"): nell'app è scritto "(tu)".
- **Superficie Commerciale** (D.P.R. 138/1998): vani al 100% (negozi: i vani accessori diretti — sottonegozio, ripostiglio, W.C., altro accessorio — al 50%); superficie complessiva = 100%. Pertinenze di ornamento: balconi/terrazze/porticati in abitazioni e ville 30% fino a 25 mq e 10% oltre se comunicanti, 15%/5% se non comunicanti (soglie separate per i due insiemi); uffici e negozi 10% fisso; aree scoperte (giardino, cortile, parco, patio, posto auto scoperto, parcheggio, altra area): abitazioni 10% fino alla superficie dei vani e 2% oltre, ville 10% fino a 5 volte la superficie dei vani e 2% oltre, uffici 10% fisso, negozi 20% fisso. Pertinenze di servizio (cantina, box, garage, soffitta, magazzino…): 25% non comunicanti, 50% comunicanti. Ogni superficie a 2 decimali, ogni addendo (per classe e per fascia) arrotondato al centesimo mezzo per eccesso prima di sommare; totale arrotondato al mq intero. La spunta "comunicante" compare solo per alcuni tipi (box, cantina, garage, legnaia, deposito, magazzino, locale tecnico, portico, terrazza, altre pertinenze di servizio; predefinita "sì" solo per locale tecnico, magazzino, portico, terrazza); per balcone, soffitta, soppalco, archivio e sale il sito le considera sempre comunicanti. Nel sito le tendine delle righe aggiunte prima di cambiare gruppo non si aggiornano: nell'app le voci dipendono sempre dal gruppo scelto. Errori letti: nessuna superficie ("Specifica un valore"), vano senza tipo ("Seleziona il vano"), pertinenza senza tipo ("Seleziona la pertinenza"), superficie mancante ("Indica la superficie in Mq"), nessun vano ("Inserisci almeno un vano principale").
- **Cedolare Secca**: cedolare 21% (libero) o 10% (concordato, con canone imponibile ridotto del 30%) sul canone annuo senza rivalutazione, arrotondata all'euro. IRPEF a tre scaglioni (23% fino a 28.000, 35% fino a 50.000, 43% oltre), lorda arrotondata all'euro, al netto delle detrazioni (non oltre l'imposta); canone imponibile = canone × (1 − deduzione) arrotondato all'euro. Reddito imponibile = reddito − oneri (e, se il reddito "comprende il canone", meno il canone imponibile del primo anno; in quel caso la base può risultare negativa e il reddito non può essere inferiore al canone imponibile: "Reddito non congruo con il canone"). Addizionali: gli importi dichiarati sono riproporzionati sul canone con la differenza di due totali arrotondati all'euro. Risparmio dell'imposta di registro (2% del canone — 70% se concordato — con minimo 67 € solo nel primo anno, arrotondato all'euro, metà a carico del locatore) e dell'imposta di bollo (16 €, metà, solo il primo anno). Convenienza fiscale dell'anno n = IRPEF + addizionali + metà registro (+ 8 € di bollo nel primo anno) − cedolare. Rivalutazione: percentuale (arrotondata a 2 decimali, vuota = 2,1 che è l'ultimo indice Istat del sito, 0 = errore, ≥ 100 = errore) × quota applicata (50/75/100%); il canone dell'anno n si ottiene dal precedente con arrotondamento al centesimo ogni anno; la "rinuncia" è il canone perso rispetto al primo anno. Verdetto: conveniente un anno se la convenienza complessiva è > 0 (zero = non conveniente): "per tutti gli anni", "solo il primo anno", "il primo e il secondo anno", "il primo, il secondo e il terzo anno", "non è mai conveniente"; media = totale/4, "risparmio medio" se il totale è ≥ 0, "minor ricavo medio" altrimenti. Importi inseriti arrotondati all'euro; negativi = "Valore non ammesso"; canone o reddito 0/vuoti = "Specifica un valore".
- **Pensione di Reversibilità**: percentuali L. 335/1995 (coniuge 60%; un figlio 70%; coniuge e un figlio 60+20; due figli 80%; coniuge e due o più figli 60+40; tre o più figli 100%; genitori 15% ciascuno, massimo 2; fratelli 15% ciascuno fino al 100%). Genitori e fratelli solo senza coniuge e figli (i fratelli anche senza genitori), come i campi disabilitati del sito. Quote arrotondate al centesimo e "ciascuno" = quota/numero beneficiari al centesimo. Riduzione per il reddito del coniuge: 25% oltre 3 volte il trattamento minimo annuo, 40% oltre 4, 50% oltre 5 (confronto stretto in virgola mobile con T = minimo mensile × 13 arrotondato al centesimo, verificato al centesimo alla soglia per tutti i 18 anni 2009-2026; i minimi mensili letti dal sito: 2026 611,85; 2025 603,40; 2024 598,61; 2023 567,94; 2022 525,38; 2021 e 2020 515,58; 2019 513,01; 2018 507,42; 2017, 2016 e 2015 501,89; 2014 500,88; 2013 495,43; 2012 481,00; 2011 468,35; 2010 460,97; 2009 457,76). Clausola di salvaguardia: reddito + pensione ridotta non può scendere sotto il limite della fascia precedente + la pensione della fascia precedente. Sull'importo annuo il sito arrotonda la quota del coniuge e poi sottrae la riduzione già arrotondata. Errori: pensione 0/vuota ("Specifica un valore"), reddito del coniuge mancante se la spunta è attiva ("Specifica un valore"), nessun avente diritto ("Specifica almeno un parente avente diritto").

## Verifica in produzione (sessione di coordinamento)
- Backend deployato su Render (`0459710`). I 15 esempi di questo resoconto con body JSON sono stati rieseguiti sull'API in produzione: 15 coincidenti con gli output letti dal sito.

## Differenze residue (non allineate)
- **Aumenti/Riduzioni Pena** — numeratore negativo: il sito accetta ad esempio "−1/3" con "Aumenta" e lo calcola come riduzione (1 anno → 8 mesi, "Aumento di -1/3"). Noi rifiutiamo numeratori non positivi (nel sito è un campo di testo, qui un campo numerico). Un numeratore decimale ("1.5/3") nel sito viene troncato a 1; noi lo rifiutiamo.
- **Pensione di Reversibilità** — dicitura della salvaguardia: in 51 casi su 285 il sito scrive "…una riduzione **teorica** del X% … Tuttavia, per la clausola di salvaguardia, la pensione … ammonta a € N" mentre la salvaguardia non modifica l'importo (la pensione effettiva coincide con quella ridotta); noi in quel caso scriviamo "…una riduzione del X% … Pertanto la pensione … ammonta a € N". Gli importi sono identici. Il sito sembra decidere con un confronto in virgola mobile (la dicitura cambia passando da una pensione di 1.400 € a 1.401 € a parità di reddito e anno) e non sono riuscito a ricostruire la regola esatta; la dicitura "teorica" compare sempre quando la salvaguardia aumenta davvero l'importo, ed è così anche per noi. Esempio: anno 2022, pensione 1.401,00 mensile, coniuge con reddito 48.225: sito "riduzione teorica del 50% … Tuttavia … ammonta a € 420,30", nostro "riduzione del 50% … Pertanto … ammonta a € 420,30"; con pensione 1.400,00 entrambi scrivono "Pertanto … € 420,00".
- **Cedolare Secca** — rivalutazione Istat ≤ −100% (es. −101): il sito la accetta e produce canoni negativi con scarti di 1 € su alcuni valori; noi rifiutiamo i valori < −100 (−100 incluso è calcolato come il sito). Zero esatto del verdetto: provato su due casi reali (convenienza complessiva 0,00 = "non conveniente").
- **Cedolare Secca** — il valore predefinito della rivalutazione Istat (2,1%) è quello letto dal sito il 14/11/2026: se il sito aggiorna il suo "ultimo indice" il valore predefinito va aggiornato.

## Altri limiti e scelte
- **Danno non Patrimoniale non implementato**: il calcolo dipende da 19 tabelle (Tribunale di Milano 2009-2024, Roma 2009-2025, tabella generica) caricate lato server; ognuna ha parametri propri letti da una richiesta interna (punto base I.T.T. minimo/massimo da 71 a 173 €, personalizzazione, tabelle PDF oltre 50 punti per Roma 2010 con discrepanza dichiarata dal sito, maggiorazione ±50% per Roma 2011, danno morale dove previsto, "incremento per sofferenza" con percentuale variabile). Per replicarlo servono i valori della griglia 101×101 di ciascuna tabella (ricavabili dalla pagina "Tabelle Milano e Roma", 1.919 richieste) più le regole di ciascuna tabella; non entra in questo lotto e resta a carico di un lotto dedicato.
- **Impronta Hash non implementato**: calcola l'hash dei file trascinati nell'area tratteggiata (elaborazione nel browser) e "Verifica" confronta un testo contenente hash con i file; richiede un selettore di file e il calcolo su dati binari, non è un form numerico/testuale.
- Nel sito il risultato di ciascun calcolatore è un popup: nell'app è la scheda risultato standard con righe etichetta/valore.
- Superficie commerciale: nel sito le righe di vani e pertinenze si aggiungono con un pulsante; nell'app con "Aggiungi un vano/una pertinenza" (massimo 32 ciascuna, come il sito).

## Esempi (campi del form del sito → body per il nostro endpoint → output letto dal sito)
Gli importi del sito sono quelli dopo "Calcola"; i body sono eseguibili così come sono (`POST /api/calc/<id>`, autenticato).

### Aumenti/Riduzioni Pena — `POST /api/calc/aumenti-riduzioni-pena`

**1. Aumento di 1/3 e riduzione personalizzata di 1/3 sulla pena detentiva**  
Campi del sito: `Anni=3, Mesi=5, Giorni=17, Operazione(1)=Aumenta, Frazione(1)=1/3, Operazione(2)=Riduci, VarNum(2)=1, VarDen(2)=3`  
Body: `{"anni": 3, "mesi": 5, "giorni": 17, "pena_pecuniaria": null, "operazioni": [{"operazione": "+", "frazione": "1/3", "numeratore": null, "denominatore": null}, {"operazione": "-", "frazione": null, "numeratore": 1.0, "denominatore": 3.0}]}`  
Output sito: Pena Base  = **3** anni, **5** mesi, **17** giorni; + Aumento di **1/3**  = **4** anni, **7** mesi, **12** giorni; - Riduzione di **1/3**  = **3** anni, **28** giorni; Pena Finale  = **3** anni, **28** giorni

**2. Pena detentiva e pecuniaria insieme**  
Campi del sito: `Anni=2, Mesi=3, Giorni=10, PenaPecuniaria=2500, Operazione(1)=Riduci, Frazione(1)=1/3, Operazione(2)=Aumenta, VarNum(2)=1, VarDen(2)=6`  
Body: `{"anni": 2, "mesi": 3, "giorni": 10, "pena_pecuniaria": 2500.0, "operazioni": [{"operazione": "-", "frazione": "1/3", "numeratore": null, "denominatore": null}, {"operazione": "+", "frazione": null, "numeratore": 1.0, "denominatore": 6.0}]}`  
Output sito: Pena Base  = **2** anni, **3** mesi, **10** giorni € **2.500**; - Riduzione di **1/3**  = **1** anno, **6** mesi, **6** giorni € **1.667**; + Aumento di **1/6**  = **1** anno, **9** mesi, **7** giorni € **1.945**; Pena Finale  = **1** anno, **9** mesi, **7** giorni € **1.945**

**3. Aumento sui giorni: tronca per difetto (5 giorni + 1/6 = 5 giorni)**  
Campi del sito: `Giorni=5, Operazione(1)=Aumenta, Frazione(1)=1/6`  
Body: `{"anni": null, "mesi": null, "giorni": 5, "pena_pecuniaria": null, "operazioni": [{"operazione": "+", "frazione": "1/6", "numeratore": null, "denominatore": null}]}`  
Output sito: Pena Base  = **5** giorni; + Aumento di **1/6**  = **5** giorni; Pena Finale  = **5** giorni


### Grado di Parentela — `POST /api/calc/grado-parentela`

**1. Figlio**  
Campi del sito: `Parentela=figlio`  
Body: `{"parentela": 5}`  
Output sito: Tra padre e figlio (tu) vi è una parentela di **1°** grado in linea retta discendente.  
(il sito mostra al posto di "(tu)" l'icona della persona)

**2. Cugino di 2° grado**  
Campi del sito: `Parentela=cugino di 2° grado`  
Body: `{"parentela": 18}`  
Output sito: Tra (tu) e suo cugino di **2°** grado vi è una parentela di **5°** grado in linea collaterale. Per la parentela selezionata vi sono **2** possibili alberi genealogici.  
(il sito mostra al posto di "(tu)" l'icona della persona)

**3. Suocero**  
Campi del sito: `Parentela=suocero`  
Body: `{"parentela": 20}`  
Output sito: Tra (tu) e suo suocero vi è una affinità di **1°** grado.  
(il sito mostra al posto di "(tu)" l'icona della persona)

### Calcolo Superficie Commerciale — `POST /api/calc/superficie-commerciale`

**1. Abitazione, superficie complessiva con balcone e cantina non comunicante**  
Campi del sito: `CodGruppo=1, TipoSuperficie=1, Superficie=80, Pertinenza Balcone=10, Pertinenza Cantina=10 (comunicante: no)`  
Body: `{"gruppo": 1, "tipo_superficie": "complessiva", "superficie": 80.0, "vani": [], "pertinenze": [{"codice": "v24", "superficie": 10.0, "comunicante": null}, {"codice": "v27", "superficie": 10.0, "comunicante": false}]}`  
Output sito: Superficie commerciale calcolata: **86** Mq; Vani principali e accessori diretti (totale → commerciale): **80** Mq → **80** Mq; Pertinenze di ornamento (totale → commerciale): **10** Mq → **3** Mq; Pertinenze di servizio (totale → commerciale): **10** Mq → **2,5** Mq; Totale pertinenze (totale → commerciale): **20** Mq → **5,5** Mq; Totale immobile (totale → commerciale): **100** Mq → **86** Mq

**2. Negozio, singoli vani (accessori al 50%) con cortile**  
Campi del sito: `CodGruppo=8, TipoSuperficie=2, Vano Retrobottega=30, Vano W.C.=10, Vano Sottonegozio=7, Pertinenza Cortile=50`  
Body: `{"gruppo": 8, "tipo_superficie": "singoli_vani", "superficie": null, "vani": [{"codice": "v3", "superficie": 30.0}, {"codice": "v21", "superficie": 10.0}, {"codice": "v19", "superficie": 7.0}], "pertinenze": [{"codice": "v28", "superficie": 50.0, "comunicante": null}]}`  
Output sito: Superficie commerciale calcolata: **49** Mq; Vani principali e accessori diretti (totale → commerciale): **47** Mq → **38,5** Mq; Pertinenze di ornamento (totale → commerciale): **50** Mq → **10** Mq; Totale immobile (totale → commerciale): **97** Mq → **49** Mq

**3. Abitazione con cantina e decimali (3,3 Mq al 25%)**  
Campi del sito: `CodGruppo=1, TipoSuperficie=1, Superficie=80,5, Pertinenza Cantina=3,3 (comunicante: no)`  
Body: `{"gruppo": 1, "tipo_superficie": "complessiva", "superficie": 80.5, "vani": [], "pertinenze": [{"codice": "v27", "superficie": 3.3, "comunicante": false}]}`  
Output sito: Superficie commerciale calcolata: **81** Mq; Vani principali e accessori diretti (totale → commerciale): **80,5** Mq → **80,5** Mq; Pertinenze di servizio (totale → commerciale): **3,3** Mq → **0,83** Mq; Totale immobile (totale → commerciale): **83,8** Mq → **81** Mq


### Calcolo Cedolare Secca — `POST /api/calc/cedolare-secca`

**1. Canone libero con rivalutazione Istat, reddito escluso il canone**  
Campi del sito: `CanoneConcordato=0, ImportoCanone=12000, TipoImportoCanone=a, AdeguamentoIstatPrevisto=True, PercentualeAdeguamentoIstat=2,1, PercentualeApplicazioneRivalutazione=75, RedditoComplessivoIrpef=40000, CanoneInclusoNelReddito=0, OneriDeducibili=1000, DetrazioniCreditiImposta=1900, AddizionaleComunale=300, AddizionaleRegionale=600, RiduzioneRedditoLocazioni=5`  
Body: `{"tipo_contratto": "libero", "canone": 12000.0, "tipo_importo": "annuale", "rivalutazione_istat": true, "pct_istat": 2.1, "pct_applicazione": 75, "reddito": 40000.0, "canone_incluso_nel_reddito": false, "oneri_deducibili": 1000.0, "detrazioni": 1900.0, "addizionale_comunale": 300.0, "addizionale_regionale": 600.0, "deduzione_forfettaria": 5}`  
Output sito: Cedolare secca calcolata (**21**%): € **2.520,00**; Primo anno: convenienza fiscale € **1.893,00**, rinuncia alla rivalutazione € **0,00**, convenienza complessiva € **1.893,00**; Secondo anno: convenienza fiscale € **1.968,00**, rinuncia alla rivalutazione € **-189,00**, convenienza complessiva € **1.779,00**; Terzo anno: convenienza fiscale € **2.053,00**, rinuncia alla rivalutazione € **-380,98**, convenienza complessiva € **1.672,02**; Quarto anno: convenienza fiscale € **2.139,00**, rinuncia alla rivalutazione € **-575,98**, convenienza complessiva € **1.563,02**; Totale **4** anni: convenienza fiscale € **8.053,00**, rinuncia alla rivalutazione € **-1.145,96**, convenienza complessiva € **6.907,04**; La cedolare secca è conveniente per tutti gli anni.; Per il proprietario che sceglie la cedolare secca si stima un risparmio medio di € **1.726,76** per ciascun anno.

**2. Canone concordato (cedolare 10%)**  
Campi del sito: `CanoneConcordato=1, ImportoCanone=10000, TipoImportoCanone=a, RedditoComplessivoIrpef=40000, CanoneInclusoNelReddito=0, RiduzioneRedditoLocazioni=5`  
Body: `{"tipo_contratto": "concordato", "canone": 10000.0, "tipo_importo": "annuale", "rivalutazione_istat": false, "pct_istat": null, "pct_applicazione": 75, "reddito": 40000.0, "canone_incluso_nel_reddito": false, "oneri_deducibili": null, "detrazioni": null, "addizionale_comunale": null, "addizionale_regionale": null, "deduzione_forfettaria": 5}`  
Output sito: Cedolare secca calcolata (**10**%): € **1.000,00**; Primo anno: convenienza fiscale € **1.406,00**, rinuncia alla rivalutazione € **0,00**, convenienza complessiva € **1.406,00**; Secondo anno: convenienza fiscale € **1.398,00**, rinuncia alla rivalutazione € **0,00**, convenienza complessiva € **1.398,00**; Terzo anno: convenienza fiscale € **1.398,00**, rinuncia alla rivalutazione € **0,00**, convenienza complessiva € **1.398,00**; Quarto anno: convenienza fiscale € **1.398,00**, rinuncia alla rivalutazione € **0,00**, convenienza complessiva € **1.398,00**; Totale **4** anni: convenienza fiscale € **5.600,00**, rinuncia alla rivalutazione € **0,00**, convenienza complessiva € **5.600,00**; La cedolare secca è conveniente per tutti gli anni.; Per il proprietario che sceglie la cedolare secca si stima un risparmio medio di € **1.400,00** per ciascun anno.

**3. Reddito che comprende il canone, con oneri deducibili**  
Campi del sito: `CanoneConcordato=0, ImportoCanone=5301,14, TipoImportoCanone=a, AdeguamentoIstatPrevisto=True, RedditoComplessivoIrpef=11292, CanoneInclusoNelReddito=1, OneriDeducibili=4077, RiduzioneRedditoLocazioni=5, PercentualeAdeguamentoIstat=0,5, PercentualeApplicazioneRivalutazione=50`  
Body: `{"tipo_contratto": "libero", "canone": 5301.14, "tipo_importo": "annuale", "rivalutazione_istat": true, "pct_istat": 0.5, "pct_applicazione": 50, "reddito": 11292.0, "canone_incluso_nel_reddito": true, "oneri_deducibili": 4077.0, "detrazioni": null, "addizionale_comunale": null, "addizionale_regionale": null, "deduzione_forfettaria": 5}`  
Output sito: Cedolare secca calcolata (**21**%): € **1.113,00**; Primo anno: convenienza fiscale € **106,00**, rinuncia alla rivalutazione € **0,00**, convenienza complessiva € **106,00**; Secondo anno: convenienza fiscale € **101,00**, rinuncia alla rivalutazione € **-13,25**, convenienza complessiva € **87,75**; Terzo anno: convenienza fiscale € **104,50**, rinuncia alla rivalutazione € **-26,54**, convenienza complessiva € **77,96**; Quarto anno: convenienza fiscale € **107,50**, rinuncia alla rivalutazione € **-39,86**, convenienza complessiva € **67,64**; Totale **4** anni: convenienza fiscale € **419,00**, rinuncia alla rivalutazione € **-79,65**, convenienza complessiva € **339,35**; La cedolare secca è conveniente per tutti gli anni.; Per il proprietario che sceglie la cedolare secca si stima un risparmio medio di € **84,84** per ciascun anno.


### Pensione di Reversibilità — `POST /api/calc/pensione-reversibilita`

**1. Coniuge con reddito: clausola di salvaguardia**  
Campi del sito: `Anno=2026, Pensione=1000, TipoImportoPensione=m, Coniuge=True, ConiugePercepisceReddito=True, RedditoConiuge=25000`  
Body: `{"anno": 2026, "pensione": 1000.0, "tipo_importo": "mensile", "coniuge": true, "coniuge_percepisce_reddito": true, "reddito_coniuge": 25000.0, "figli": 0, "genitori": 0, "fratelli": 0}`  
Output sito: Al coniuge spetta il **60**% della pensione pari a € **600,00** al mese. In base al reddito indicato, l'importo spettante è soggetto ad una riduzione teorica del **25**% (pari a € **150,00** al mese). Tuttavia, per la clausola di salvaguardia, la pensione di reversibilità effettivamente spettante, cumulabile con il reddito, ammonta a € **512,47**.

**2. Coniuge e un figlio, reddito oltre 5 volte il minimo**  
Campi del sito: `Anno=2026, Pensione=1000, TipoImportoPensione=m, Coniuge=True, NumeroFigli=1, ConiugePercepisceReddito=True, RedditoConiuge=40000`  
Body: `{"anno": 2026, "pensione": 1000.0, "tipo_importo": "mensile", "coniuge": true, "coniuge_percepisce_reddito": true, "reddito_coniuge": 40000.0, "figli": 1, "genitori": 0, "fratelli": 0}`  
Output sito: Al coniuge spetta il **60**% della pensione pari a € **600,00** al mese. In base al reddito indicato, l'importo spettante è soggetto ad una riduzione teorica del **50**% (pari a € **300,00** al mese). Tuttavia, per la clausola di salvaguardia, la pensione di reversibilità effettivamente spettante, cumulabile con il reddito, ammonta a € **342,33**. Al figlio spetta il **20**% della pensione pari a € **200,00** al mese.

**3. Coniuge e 2 figli, pensione 1.234,56 mensile**  
Campi del sito: `Anno=2026, Pensione=1234,56, TipoImportoPensione=m, Coniuge=True, NumeroFigli=2`  
Body: `{"anno": 2026, "pensione": 1234.56, "tipo_importo": "mensile", "coniuge": true, "coniuge_percepisce_reddito": false, "reddito_coniuge": null, "figli": 2, "genitori": 0, "fratelli": 0}`  
Output sito: Al coniuge spetta il **60**% della pensione pari a € **740,74** al mese. Ai **2** figli va complessivamente il **40**% della pensione pari a € **493,82** al mese, che corrispondono a € **246,91** ciascuno.

## Sha mergiati
- **Backend** (`mystudiolegale-backend`): PR #156 merge `da7d10d` (aumenti/riduzioni pena, grado di parentela, superficie commerciale) e PR #157 merge `0459710` (cedolare secca, pensione di reversibilità, finiture). Deploy su Render **non** lanciato.
- **Frontend** (`mystudiolegale-frontend`): PR #151 merge `f22ef36` (tre calcolatori) e PR #153 merge `b348cd5` (cedolare secca, pensione di reversibilità, questo resoconto). Nessuna build iOS lanciata.
