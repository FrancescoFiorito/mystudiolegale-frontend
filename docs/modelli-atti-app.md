# Modelli di atti nel menù Calcolatori

Undici voci del menù (Atti Giudiziari, Rivalutazioni Istat, Fatturazione Avvocati) aprono un modulo generico (`src/components/ModelloAtto.tsx`) guidato dalla descrizione dei campi in `src/modelliAtti/modelli.ts`. Il backend espone `POST /api/atti-modello/<nome>`; l'app mostra l'anteprima del testo, promemoria e avviso (solo a schermo) e permette "Copia testo" e l'esportazione PDF/Word con `POST /documenti/esporta` (stesse regole dei piani).

Per aggiungere un modello: descrivere i campi in `modelli.ts` (tipi: testo, numero, data, scelta, bool, lista ripetibile; `mostraSe`, `valoreSeNascosto`, `comeTesti`) e sostituire la voce `in_arrivo` in `CATEGORIE_MENU_CALCOLATORI` con `tipo: "modello"`.

Note: i dati restano finché la schermata è aperta; la data vuota vale oggi (dove previsto). Indice allegati: i collegamenti ai file non sono riprodotti. Note di trattazione e nota di precisazione dipendono dal branch backend `claude/atti-modello-nota-precisazione`; dichiarazione 553, atto di precetto e sfratto dai branch `claude/atti-modello-dichiarazione-553`, `-precetto`, `-sfratto` (il branch sfratto li contiene tutti). Moduli con un solo oggetto (parte, terzo, ricorrente, conduttore): lista con `comeOggetto`.
