# Adeguamenti dell'app alle correzioni del backend

Fonte: `docs/correzioni-dopo-riverifica.md` del backend (righe «Frontend:»). Tutte le modifiche sono in `app/(app)/calcolatori.tsx` e `src/utils/parametriFasi.ts`. Prove: `tsc` 11 righe e lint 10 problemi (6 errori, 4 warning) dopo ogni PR, cioè il baseline; per ogni punto `server.py` caricato in locale e interrogato con il corpo costruito dall'app, poi la funzione `risultato` dell'app eseguita con node sulla risposta.

| # | Punto | PR | sha del merge |
|---|---|---|---|
| 1 | Preventivo Cause Civili | #187 | 2044e32 |
| 2 | Delegati Vendite Giudiziarie | #188 | 4379ca5 |
| 3 | Tassa Registro Locazioni | #189 | 060a98d |
| 4 | Valore Catastale | nessuna modifica | – |
| 5 | Parametri 2014 Civile | #190 | 8e7666c |
| 6a | Fine Pena | #191 | 800224d |
| 6b | TAEG | #192 | 5236e62 |
| 6c | Prescrizione Reati | nessuna modifica | – |

## 1. Preventivo Cause Civili
`calcPar` aggiunge `tipo: "preventivo"` al corpo di `POST /calc/parcella`. Il salvataggio (`savePar`, `tipo: "parcella"`) **non è stato toccato** (decisione aperta).
Prova (compenso 7.933,00, spese non esenti 2.270,04, esenti 197,19, spese generali 25%): senza `tipo` cassa 396,65 e totale 15.548,38; con `tipo: "preventivo"` cassa 487,45 e totale 15.659,15. Con «Accessori di legge = NO» (senza spese): 7.933,00 con `preventivo`, 9.678,26 senza.

**Che cosa succede oggi al salvataggio:** l'app mostra il totale calcolato come preventivo (15.659,15 €), ma `POST /parcelle` con `tipo: "parcella"` ricalcola con le vecchie regole e memorizza **15.548,38 €** (cassa 396,65 invece di 487,45): l'importo salvato è inferiore di 110,77 € a quello visto dall'utente. Con «Accessori NO» l'utente vede 7.933,00 € e salva 9.678,26 €. Finché non si decide se salvare con `tipo: "preventivo"`, i due valori divergono.

## 2. Delegati Vendite Giudiziarie
Righe come il sito: «Totale compenso» (da `compenso_prima_limitazione`, con «aumentato/ridotto del X%» se c'è variazione, sostituisce «Compenso tabellare»); con `flag_limitazione`: «Compenso con limitazione» (`compenso_con_limitazione`) e «Importo limitato al X% del valore» (`limite_massimo`). Prova: immobili 1.942,85, fase 1 → 1.000,00 / 706,49 / 777,14 (come il resoconto); stesso caso con riduzione 14% → «Totale compenso ridotto del 14%» 860,00; caso senza limitazione → nessuna delle due righe aggiuntive.

## 3. Tassa Registro Locazioni
«Locatore soggetto IVA» ha `default: true` (visibile solo per «strumentale»; per gli altri tipi resta nascosta e si invia `false`, ignorato). Prova: strumentale 3 anni 15.413,56, unica soluzione → imposta 462,41, sconto 11,10, da versare 451; con la spunta tolta 924,81 / 22,20 / 903; 1 anno rateale → `unica_soluzione` (l'app legge già `pagamento_effettivo`).

## 4. Valore Catastale — già allineato
Letta la pagina del sito (senza inviare il modulo), con un contesto nuovo per ogni lettura: la casella parte spuntata per A/1–A/9, A/11, C/2, C/6, C/7 e disattivata e spenta per tutte le altre categorie. L'app mostra la casella solo per `CATEGORIE_ABITAZIONE_PRINCIPALE` (A/1–A/9, A/11, C/2, C/6, C/7) con `default: true` e invia `false` per le altre: coincide. Nessuna modifica.

## 5. Parametri 2014 Civile
L'app bloccava la conciliazione senza fase collegata chiedendo l'importo. Ora «Conciliazione: calcolato su €» si precompila con 1.701 (2022) o 1.620 (2014) quando la competenza non ha la fase decisionale (anche al cambio di anno o competenza), un importo scritto dall'utente non viene sovrascritto, e il campo non è più obbligatorio. Prova: 2022/arbitrato (370) e 2014/esecuzioni presso terzi (280) → nessun errore di validazione, `imp_conciliazione` 1701 / 1620 nel corpo, il backend risponde con l'aumento calcolato su quelle basi.

## 6. Altre righe «Frontend:»
- **Fine Pena:** con liberazione anticipata spenta una sola riga con `etichetta_fine_pena` («Data fine pena»); accesa, la prima riga usa lo stesso campo. Prova su backend con e senza liberazione.
- **TAEG:** la riga «Importo della rata comprese le spese ricorrenti» compare solo se `mostra_rata_con_spese_ricorrenti`. Prova: nessuna riga con spese di istruttoria o con sola gestione annuale, riga presente (274,37) con incasso rata 2 e assicurazione 3.
- **Prescrizione Reati:** il resoconto chiede di scrivere il primo del mese senza «°». L'app mostra le date nel formato `gg-mm-aaaa` (`isoToDataIt`) e non scrive mai «1°»: nessuna modifica. Il backend non ha altre sezioni con righe «Frontend:» (Scorporo non corretto lato backend, nessuna azione).
