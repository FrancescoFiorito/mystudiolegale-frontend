# Lotto A — tassi, termini, atti

Stato: backend mergiato e in produzione (verificato solo che le rotte rispondano, 401 senza token); frontend in PR **non mergiata** perché la riesecuzione dei casi contro l'API di produzione non è stata possibile (vedi "Deploy e verifica in produzione").

Tutti e 7 i calcolatori sono veri calcolatori (form con risultato numerico o di date). Valori attesi = quelli letti dal sito di riferimento in questa sessione (Chromium headless, controlli azionati via UI reale dove la pagina abilita/disabilita campi). I confronti qui sotto sono stati fatti contro il codice del backend eseguito in locale (stesse funzioni deployate), non contro la produzione.

| Calcolatore | Esito | Casi confrontati |
|---|---|---|
| Interessi a Tasso Fisso | allineato | 19 (16 numerici + 3 errori) |
| Calcolo Tasso di Usura | allineato | ~55 casi + dataset di 600 interrogazioni del sito (25 tipologie × 24 importi, 2002-2026) |
| Calcolo Scadenze (+ giorni tra due date) | allineato | 148 scadenze + 23 giorni tra date |
| Termini 183 + 190 cpc | allineato | 93 combinazioni × 2 operazioni (186 confronti, inclusi i giorni "saltati") |
| Calcolo Diritti di Copia | allineato | 73 casi + 408 punti tabella |
| Copie Processo Tributario | allineato | ~400 punti (tutte le fasce, tetti, KB) |
| Verifica Gratuito Patrocinio | allineato con 1 scarto voluto | 115 casi |

## Regole ricavate (non a memoria, dal sito)
- **Tasso fisso**: anno sempre 365 gg; giorni di un periodo = (fine periodo precedente, fine]; il capitale riportato e gli interessi sono arrotondati al centesimo per periodo. Date uguali / invertite, tasso o capitale ≤ 0 → errore.
- **Tasso di usura**: soglia = valore pubblicato per trimestre e fascia di importo (≤X / >X: 1.500, 5.000, 10.000, 15.000, 25.000, 50.000, 100.000, 200.000 a seconda di tipologia e periodo; fasce verificate a livello di centesimo). Il dataset TEGM è nel backend (`_USURA_TEGM`); soglie pubblicate che differiscono dalla formula (×1,5 fino al 1° trim. 2011, poi min(1,25·T+4; T+8)) in `_USURA_SOGLIE_ECC` (7 eccezioni). "Supera" = tasso arrotondato a 2 decimali > soglia. Per le tipologie/fasce non rilevate nel trimestre il sito non produce righe.
- **Scadenze**: sabato NON festivo; domenica e festività nazionali sì (Pasqua prevale su 25/4 nel 2038); sospensione feriale 1-31/8; sospensione Covid sempre automatica; calcolo a ritroso che toccherebbe la sospensione Covid → errore con data iniziale minima; max 365 gg con sospensione, 3650 senza.
- **Termini 183+190**: sabato/domenica/festivi passano al giorno lavorativo successivo, ma un sabato che segue una festività NON viene saltato; dal 2026 il 4 ottobre (San Francesco d'Assisi) è festivo solo in questo calcolatore; anni ammessi 2021-2031; modalità prudenziale = il termine successivo parte dalla scadenza non posticipata.
- **Diritti di copia civile / tributario**: tabelle e tetti letti dal sito (tributario: oltre 100 pagine +15 €/centinaio max 999; KB oltre 1000 +6 € ogni 4.928 KB max 500 €). Copie, pagine, KB decimali arrotondati all'intero (metà per eccesso). L'autentica/conformità non esiste per il formato elettronico (il sito disabilita il campo).
- **Gratuito patrocinio**: limite per anno (11.528,41 / 11.493,82 / 11.746,68 / 12.838,01 / 13.659,64 €), +1.032,91 € per ogni familiare nel penale; familiari in conflitto o diritti della personalità esclusi dalla somma; reddito uguale al limite = requisito rispettato.

## Differenze residue / scelte
- **Gratuito patrocinio**: il nome di un familiare con tag HTML (`<b>x</b>`) viene ripulito dai tag e messo con l'iniziale maiuscola; il sito lo stampa come HTML interpretato. Nessun effetto sui calcoli.
- **Gratuito patrocinio**: il testo di riferimento normativo per il 2022-2024 è copiato dal sito ("Decreto 10 maggio 2023, pubblicato sulla G.U. n. 130 del 6 giugno 2022"): l'anno della G.U. sembra un refuso del sito (probabile 2023), da verificare.
- **Scadenze**: il messaggio d'errore del calcolo a ritroso usa uno spazio normale invece dello spazio non separabile del sito. Il sito mostra anche una battuta ("forse serve una macchina del tempo?") per risultati oltre l'anno corrente + 5: riprodotta come nota "Data molto lontana nel tempo".
- Etichette dei festivi e giorni della settimana: il sito scrive senza accento ("Lunedi"); qui con accento ("Lunedì").
- **Tasso di usura / Scadenze / Diritti**: i risultati tabellari sono resi come righe etichetta/valore (adattamento mobile), non come tabelle.
- Fuori lotto, non toccate: "Tabella Interessi Legali/di Mora/Tassi Appalti" ecc.

## Deploy e verifica in produzione
- Backend PR #146 (`354ee82`): gli endpoint erano definiti dopo `app.include_router(api)` → 404 in produzione pur con deploy "live" (non rilevabile con i test locali che chiamano le funzioni direttamente). Corretto con la PR #147 (`506dfc9`), deploy Render `dep-dbrmqkjl550s73cuhg0g`.
- **Verificato in produzione**: le 8 rotte `/api/calc/...` rispondono (401 senza token). **Non verificato**: i valori. La registrazione dell'utente usa-e-getta su produzione è stata bloccata dalle regole di permesso della sessione, quindi la riesecuzione dei casi contro l'API live non è stata fatta. Da fare: registrare un utente di prova e rilanciare i confronti (script nello scratchpad della sessione, non versionati).
- Auto-deploy Render risulta attivo sul servizio, ma per il merge #146 non è partito nulla da solo: il deploy è stato lanciato a mano.
- Nessuna build iOS lanciata: queste modifiche al frontend non sono in nessuna build.
