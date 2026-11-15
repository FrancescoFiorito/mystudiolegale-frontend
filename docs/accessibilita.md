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

## Proprietà aggiunte per file

Conteggio delle proprietà di accessibilità presenti nelle righe aggiunte rispetto a `ec25de6`. Totale: 394.

| Proprietà | File |
|---|---|
| 102 | `app/(app)/calcolatori.tsx` |
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

## Elementi che non sono stati etichettati

Su 277 tag interattivi o immagini in `app/` e `src/`, 226 hanno almeno una proprietà di accessibilità. Gli altri 51 sono tutti in `app/(app)/calcolatori.tsx`:

- **Campi dinamici di liste** (parti assistite, procura, voci personalizzate, spese, crediti): l'etichetta visibile è un testo generato nel ciclo e non è sempre disponibile in forma leggibile. Servirebbe passare l'etichetta della riga come parametro.
- **Pulsanti "rimuovi" dinamici** (cestino delle righe): stessa situazione, servono etichette per riga.
- **Interruttori non ancora etichettati** (`mem-toggle-feriale`, `rivmens-check-mensile`, `rivmens-check-interessi`, `rivmens-check-annuale`, `succ-toggle-disabile`, e i pulsanti di grado successorio `succ-grado-*`): qui l'etichetta è chiara e l'intervento è semplice (ruolo `checkbox` con `checked`), ma non è stato fatto in questa tornata.
- **Campi senza etichetta visibile** (`cu-valore-causa`, `mem-udienza`): richiedono una scelta sul testo da usare.

Elenco esatto (riga di `app/(app)/calcolatori.tsx` al momento del merge `fcb2cdb`):

| Riga | Tipo | Inizio del tag |
|---|---|---|
| 5212 | campo | `<TextInput` |
| 5220 | pulsante | `<Pressable testID={`par-parte-rimuovi-${i}`} onPress={() => setPartiAs` |
| 5224 | pulsante | `<Pressable` |
| 5235 | campo | `<TextInput` |
| 5244 | campo | `<TextInput` |
| 5254 | pulsante | `<Pressable` |
| 5293 | pulsante | `<Pressable` |
| 5318 | campo | `<TextInput testID={`par-${kImporto}`} value={par[kImporto]} onChangeTe` |
| 5322 | campo | `<TextInput testID={`par-${kPct}`} value={par[kPct]} onChangeText={(v) ` |
| 5334 | campo | `<TextInput` |
| 5342 | campo | `<TextInput` |
| 5351 | pulsante | `<Pressable testID={`par-voce-custom-rimuovi-${i}`} onPress={() => setV` |
| 5356 | pulsante | `<Pressable` |
| 5369 | campo | `<TextInput` |
| 5377 | pulsante | `<Pressable testID={`par-spesa-rimuovi-${i}`} onPress={() => setVociSpe` |
| 5382 | campo | `<TextInput` |
| 5391 | pulsante | `<Pressable` |
| 5401 | pulsante | `<Pressable` |
| 5420 | campo | `<TextInput testID={`par-${k}`} value={par[k as string]} onChangeText={` |
| 5510 | pulsante | `<Pressable` |
| 5551 | pulsante | `<Pressable` |
| 5627 | campo | `<TextInput` |
| 5635 | campo | `<TextInput` |
| 5644 | pulsante | `<Pressable testID={`atto-credito-rimuovi-${i}`} onPress={() => setAtto` |
| 5649 | pulsante | `<Pressable` |
| 5665 | campo | `<TextInput` |
| 5673 | pulsante | `<Pressable testID={`procura-parte-rimuovi-${i}`} onPress={() => setPro` |
| 5677 | pulsante | `<Pressable` |
| 5688 | campo | `<TextInput` |
| 5697 | campo | `<TextInput` |
| 5705 | campo | `<TextInput` |
| 5715 | pulsante | `<Pressable` |
| 5731 | campo | `<TextInput` |
| 5739 | pulsante | `<Pressable testID={`procura-avvocato-rimuovi-${i}`} onPress={() => set` |
| 5752 | campo | `<TextInput` |
| 5760 | pulsante | `<Pressable` |
| 5771 | campo | `<TextInput` |
| 5780 | pulsante | `<Pressable` |
| 5792 | pulsante | `<Pressable` |
| 5818 | pulsante | `<Pressable` |
| 5858 | pulsante | `<Pressable testID="mem-toggle-feriale" onPress={() => setMemEscludiFer` |
| 5920 | pulsante | `<Pressable` |
| 5996 | campo | `<TextInput testID="cu-valore-causa" value={cuValoreCausa} onChangeText` |
| 6007 | pulsante | `<Pressable` |
| 6090 | pulsante | `<Pressable testID="rivmens-check-mensile" onPress={() => setRivMensMen` |
| 6096 | pulsante | `<Pressable testID="rivmens-check-interessi" onPress={() => setRivMensI` |
| 6108 | pulsante | `<Pressable testID="rivmens-check-annuale" onPress={() => setRivMensAnn` |
| 6203 | pulsante | `<Pressable` |
| 6219 | pulsante | `<Pressable` |
| 6271 | pulsante | `<Pressable key={g.id} testID={`succ-grado-${g.id}`} onPress={() => set` |
| 6278 | pulsante | `<Pressable testID="succ-toggle-disabile" onPress={() => setSuccDisabil` |

## Da controllare a mano con VoiceOver su iPhone

- Accesso e registrazione: i campi email, password e codice leggono l'etichetta giusta; "Mostra password" cambia in "Nascondi password".
- Barra delle schede: la scheda attiva viene annunciata come selezionata.
- Calendario: le celle dei giorni leggono la data in formato ISO (`AAAA-MM-GG`): valutare se va letta in formato italiano.
- Selettori (`SelectInput`, `DataInput`, `MeseAnnoInput`): apertura, scelta voce, chiusura con "Fatto"; le ruote mese/anno sono raggiungibili.
- Pulsanti a sola icona: indietro, chiudi, elimina, aggiungi.
- Schermate con overlay (`SwipeBackScreen`): il focus resta dentro l'overlay mentre è aperto.
- Calcolatori: il motore generico (etichette dei campi, checkbox, pulsanti di calcolo e salvataggio); i campi dinamici elencati sopra.
- Icone decorative: non devono essere annunciate (il logo di caricamento è già `accessible={false}`; le altre icone Feather accanto a un testo visibile non hanno proprietà dedicate e vengono ignorate da VoiceOver quando il pulsante ha già un'etichetta).
