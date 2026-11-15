# Accessibilità (VoiceOver): cosa è stato fatto e cosa resta

Questo documento riepiloga le proprietà di accessibilità aggiunte all'app per VoiceOver su iPhone, e quello che resta da fare. Le modifiche sono solo proprietà (`accessibilityRole`, `accessibilityLabel`, `accessibilityState`, `accessibilityValue`, `accessibilityHint`, `accessible`): nessuna modifica a logica, stili, testi visibili o `testID`.

**Stato:** le modifiche sono nel branch `main` ma **non sono in nessuna build iOS**. Non è stato possibile provare VoiceOver da qui: quello che segue è verificato solo a livello di codice (tipi, lint, diff).

## Pull request e sha dei merge

| PR | Contenuto | Sha merge |
|---|---|---|
| #156 | Componenti condivisi (`src/components`) | `292317f` |
| #157 | Accesso, registrazione, reset, verifica email, barra schede | `d14145e` |
| #158 | Schermate principali (dashboard, clienti, archivio, calendario, profilo, pratica, cliente, impostazioni, team, audit, notifiche) | `d334e7c` |
| #159 | Motore dei calcolatori e componenti di campo | `fcb2cdb` |
| #161 | Calcolatori: etichette dei 51 elementi residui e di `mem-udienza` | vedi nota in "Scelte da confermare" |

## Proprietà aggiunte per file

Conteggio delle proprietà di accessibilità presenti nelle righe aggiunte rispetto a `ec25de6`. Totale: 482 (era 394; +88 da `app/(app)/calcolatori.tsx` con la PR #161).

| Proprietà | File |
|---|---|
| 190 | `app/(app)/calcolatori.tsx` |
| 49 | `app/(app)/pratica/[id].tsx` |
| 32 | `app/(app)/(tabs)/archivio.tsx` |
| 23 | `app/(app)/calendario.tsx` |
| 17 | `app/(app)/(tabs)/dashboard.tsx` |
| 17 | `src/components/MeseAnnoInput.tsx` |
| 14 | `app/(app)/cliente/[id].tsx` |
| 13 | `src/components/NuovaPraticaForm.tsx` |
| 12 | `app/(app)/profilo.tsx` |
| 10 | `src/components/SelectInput.tsx` |
| 9 | `app/(app)/(tabs)/clienti.tsx` |
| 9 | `app/(app)/impostazioni.tsx` |
| 9 | `app/(auth)/login.tsx` |
| 8 | `app/(auth)/register.tsx` |
| 7 | `app/(auth)/reset-password.tsx` |
| 7 | `src/components/DataInput.tsx` |
| 6 | `app/(auth)/verify-reset-code.tsx` |
| 6 | `src/components/ListaInput.tsx` |
| 5 | `app/(app)/team.tsx` |
| 5 | `app/verify-email.tsx` |
| 5 | `src/components/Header.tsx` |
| 5 | `src/components/OrarioInput.tsx` |
| 5 | `src/components/PraticaPicker.tsx` |
| 5 | `src/components/PromemoriaInput.tsx` |
| 4 | `app/(auth)/forgot-password.tsx` |
| 3 | `app/(app)/audit.tsx` |
| 2 | `src/AnimatedTabBar.tsx` |
| 2 | `src/components/PasswordHint.tsx` |
| 1 | `app/(app)/notifiche.tsx` |
| 1 | `src/components/LoadingScreen.tsx` |
| 1 | `src/components/SwipeToDelete.tsx` |

## Componenti condivisi con nuova prop

Prop facoltativa aggiunta, da passare all'elemento interno (pulsante o campo):

- `DataInput`: `accessibilityLabel?: string` (se assente usa il segnaposto).
- `SelectInput`: `accessibilityLabel?: string` (se assente usa il segnaposto).
- `MeseAnnoInput`: `accessibilityLabel?: string` (se assente usa "Mese e anno").

Non è cambiata la firma di `Header`, `ListaInput`, `OrarioInput`, `PraticaPicker`, `PromemoriaInput`, `PasswordHint`, `SwipeToDelete`: hanno ricevuto etichette fisse o derivate dai propri dati.
`SwipeBackScreen` è solo un contenitore e non ha elementi interattivi: non è stato modificato.

## Elementi di `calcolatori.tsx` etichettati nella PR #161

Su 277 tag interattivi o immagini in `app/` e `src/`, **277 su 277 hanno almeno una proprietà di accessibilità**. I 51 elementi che nella versione precedente di questo documento risultavano senza etichetta sono ora tutti in `app/(app)/calcolatori.tsx`. In più è stato etichettato `mem-udienza`, che è un `DataInput` (componente, fuori dal conteggio dei 277).

Legenda: **button** = `accessibilityRole="button"`, senza etichetta propria (VoiceOver legge il testo visibile del pulsante); **campo** = `TextInput` o `DataInput` con `accessibilityLabel`; **checkbox** = `accessibilityRole="checkbox"` con `accessibilityState={{ checked }}`; **radio** = `accessibilityRole="radio"` con `accessibilityState={{ selected }}`. Le righe con `${i}` o `${i + 1}` sono liste dinamiche: l'etichetta include il numero di riga.

| testID o contesto | ruolo | etichetta usata |
|---|---|---|
| `par-parte-nominativo-${i}` | campo | `Nome parte assistita ${i + 1}` |
| `par-parte-rimuovi-${i}` | button | `Rimuovi parte assistita ${i + 1}` |
| `par-parte-persona-giuridica-${i}` | checkbox | `Persona giuridica, parte assistita ${i + 1}` |
| `par-parte-rappresentante-${i}` | campo | `Rappresentante legale, parte assistita ${i + 1}` |
| `par-parte-cf-piva-${i}` | campo | `CF o P.IVA, parte assistita ${i + 1}` |
| `par-parte-aggiungi` | button | testo visibile "Aggiungi un'altra parte assistita" |
| `par-suggerisci-parametri-forensi` | button | testo visibile "Calcola importi dai parametri forensi" |
| `par-${kImporto}` (4 fasi) | campo | `${fase}, importo €` (es. "Fase di studio, importo €") |
| `par-${kPct}` (4 fasi) | campo | `${fase}, aggiustamento %` (es. "Fase di studio, aggiustamento %") |
| `par-voce-custom-descrizione-${i}` | campo | `Descrizione voce personalizzata ${i + 1}` |
| `par-voce-custom-importo-${i}` | campo | `Importo voce personalizzata ${i + 1} €` |
| `par-voce-custom-rimuovi-${i}` | button | `Rimuovi voce personalizzata ${i + 1}` |
| `par-voce-custom-aggiungi` | button | testo visibile "Aggiungi voce personalizzata" |
| `par-spesa-descrizione-${i}` | campo | `Descrizione spesa ${i + 1}` |
| `par-spesa-rimuovi-${i}` | button | `Rimuovi spesa ${i + 1}` |
| `par-spesa-importo-${i}` | campo | `Importo spesa ${i + 1} €` |
| `par-spesa-esente-${i}` | checkbox | `Spesa ${i + 1} esente` |
| `par-spesa-aggiungi` | button | testo visibile "Aggiungi voce di spesa" |
| `par-${k}` (spese generali, CPA, IVA, ritenuta) | campo | `l`, cioè il testo della riga (es. "Spese generali %") |
| `categoria-${cat.id}` | button | testo visibile (titolo della categoria) |
| `atto-${v.attoId}` / `calc-${v.calcId}` | button | testo visibile (nome della voce) |
| `atto-credito-descrizione-${i}` | campo | `Descrizione credito ${i + 1}` |
| `atto-credito-importo-${i}` | campo | `Importo credito ${i + 1} €` |
| `atto-credito-rimuovi-${i}` | button | `Rimuovi credito ${i + 1}` |
| `atto-credito-aggiungi` | button | testo visibile "Aggiungi un altro credito" |
| `procura-parte-nome-${i}` | campo | `Nome parte assistita procura ${i + 1}` |
| `procura-parte-rimuovi-${i}` | button | `Rimuovi parte assistita procura ${i + 1}` |
| `procura-parte-persona-giuridica-${i}` | checkbox | `Persona giuridica, parte assistita procura ${i + 1}` |
| `procura-parte-legale-rappresentante-${i}` | campo | `Legale rappresentante, parte assistita procura ${i + 1}` |
| `procura-parte-cf-piva-${i}` | campo | `CF o P.IVA, parte assistita procura ${i + 1}` |
| `procura-parte-indirizzo-${i}` | campo | `Indirizzo, parte assistita procura ${i + 1}` |
| `procura-parte-aggiungi` | button | testo visibile "Aggiungi un'altra parte assistita" |
| `procura-avvocato-nome-${i}` | campo | `Nome avvocato ${i + 1}` |
| `procura-avvocato-rimuovi-${i}` | button | `Rimuovi avvocato ${i + 1}` |
| `procura-avvocato-cf-${i}` | campo | `Codice fiscale avvocato ${i + 1}` |
| `procura-avvocato-eletto-domicilio-${i}` | checkbox | `Eletto domicilio presso questo avvocato, avvocato ${i + 1}` |
| `procura-avvocato-indirizzo-studio-${i}` | campo | `Indirizzo dello studio, avvocato ${i + 1}` |
| `procura-avvocato-autentica-firme-${i}` | checkbox | `Autentica le firme degli assistiti, avvocato ${i + 1}` |
| `procura-avvocato-aggiungi` | button | testo visibile "Aggiungi un altro avvocato" |
| `apri-atto-docx` | button | testo visibile "Apri documento" |
| `mem-udienza` (fuori dai 51) | campo | dinamica: "Data udienza di trattazione" (art. 171-ter) oppure "Data udienza collegiale di discussione" (art. 189 e 275-bis) |
| `mem-toggle-feriale` | checkbox | "Applica sospensione feriale (1-31 agosto)" |
| `tassi-prodotti-agricoli` | checkbox | "Cessione di prodotti agricoli e agroalimentari: +4 punti percentuali (art. 4 c. 2 D.Lgs. 198/2021)" |
| `cu-valore-causa` | campo | "Valore della causa" |
| `cu-riduzione-50` | checkbox | "Riduzione del 50% (ingiunzione, sfratto, cautelari/possessori, ATP, lavoro/pubblico impiego)" |
| `rivmens-check-mensile` | checkbox | "Rivaluta mensilmente gli importi dovuti e non riscossi (ISTAT)" |
| `rivmens-check-interessi` | checkbox | "Calcola gli interessi legali" |
| `rivmens-check-annuale` | checkbox | "Rivaluta annualmente l'importo dovuto, a un tasso indicato da te" |
| `vari-rivaluta` | checkbox | "Rivaluta il capitale secondo l'indice FOI" |
| `vari-ignora-deflazione` | checkbox | "Ignora la deflazione (se l'indice cala, non applica una rivalutazione negativa)" |
| `succ-grado-${g.id}` | radio | testo del grado di parentela (`g.label`) |
| `succ-toggle-disabile` | checkbox | "Erede portatore di handicap grave (L. 104/1992)" |

## Scelte da confermare

Scelte fatte in autonomia, da rivedere con VoiceOver o con l'autore del calcolatore:

- **`cu-valore-causa`**: l'etichetta è "Valore della causa", come richiesto. Il selettore sopra (`cu-valore-tipo`) ha la stessa etichetta, e il campo è l'importo: un utente VoiceOver potrebbe non distinguerli. Proposta: "Importo della causa €".
- **`mem-udienza`**: la richiesta indicava "Data dell'udienza", ma dal codice il testo visibile cambia con il tipo di termine. È stata usata l'etichetta dinamica corrispondente, non un testo fisso.
- **`par-spesa-esente-${i}`**: è un pulsante a pillola con testo "Esente" / "Non esente", che funziona da interruttore: trattato come casella con etichetta "Spesa N esente". Il testo visibile cambia a ogni stato, quindi l'etichetta non lo ripete.
- **Pulsanti con testo visibile**: hanno solo il ruolo, come richiesto; VoiceOver legge il testo del figlio.
- **Liste dinamiche**: le etichette includono il numero di riga (`${i + 1}`). Per le parti della procura è stato aggiunto "procura" per distinguerle dalle parti della parcella.
- **Proprietà fuori dai 51**: `mem-udienza` è un componente `DataInput`, non conteggiato nei 277; è stato etichettato perché era nell'elenco della richiesta.
- **Sha del merge**: lo sha del commit di merge non può comparire nel file della stessa PR. Viene riportato nel resoconto della PR, e la tabella sopra mantiene il riferimento "vedi nota".

## Elementi che non sono stati etichettati

Nessuno: i 277 tag interattivi o immagini in `app/` e `src/` hanno almeno una proprietà di accessibilità.

## Da controllare a mano con VoiceOver su iPhone

- Accesso e registrazione: i campi email, password e codice leggono l'etichetta giusta; "Mostra password" cambia in "Nascondi password".
- Barra delle schede: la scheda attiva viene annunciata come selezionata.
- Calendario: le celle dei giorni leggono la data in formato ISO (`AAAA-MM-GG`): valutare se va letta in formato italiano.
- Selettori (`SelectInput`, `DataInput`, `MeseAnnoInput`): apertura, scelta voce, chiusura con "Fatto"; le ruote mese/anno sono raggiungibili.
- Pulsanti a sola icona: indietro, chiudi, elimina, aggiungi.
- Schermate con overlay (`SwipeBackScreen`): il focus resta dentro l'overlay mentre è aperto.
- Calcolatori: le etichette dinamiche con numero di riga e le caselle di `calcolatori.tsx` (tabella sopra), in particolare il ruolo `radio` dei gradi di successione.
- Icone decorative: non devono essere annunciate (il logo di caricamento è già `accessible={false}`; le altre icone Feather accanto a un testo visibile non hanno proprietà dedicate e vengono ignorate da VoiceOver quando il pulsante ha già un'etichetta).
