# Esportazione di atti e parcelle: adeguamento dell'app

**Stato:** implementato contro il contratto del backend nuovo (non ancora in produzione), **senza poter chiamare il backend né provare su iPhone**. Non è in nessuna build iOS. Percorsi `/atti/{aid}/pdf`, `/pdf/view-link`, `/docx`, `/docx/view-link` e `/parcelle/{pid}/pdf` verificati leggendo `server.py` del backend (sola lettura).

## Cosa è cambiato

- **Errori del server** (`src/utils/apriDocumentoRemoto.ts`, nuovo `src/utils/messaggioErrore.ts`): il corpo della risposta di errore viene letto e si mostra `detail` (stringa, oppure i `msg` di un 422). Corpo vuoto, non JSON o senza `detail` → `Errore <codice>`. Vale per `apriDocumentoRemoto` (download), per l'apertura nel browser (`api.post` portava già il `detail`; ora l'avviso lo mostra invece di "Impossibile aprire il file nel browser") e per le funzioni POST. Il testo generico resta solo per errori di rete. Su web `Alert.alert` non mostra nulla, quindi gli avvisi usano `window.alert`; `apriDocumentoRemoto` ora scarica anche su web (blob + link temporaneo).
- **Atti** (`src/utils/apriAtto.ts`, hook `useApriAtto`): PDF per tutti (`/atti/{id}/pdf`, `/pdf/view-link`, file `<tipo>.pdf`) e Word (`/docx`, file `<tipo>.docx`). Per entrambi resta la scelta "Visualizza / Scarica o condividi".
  - `calcolatori.tsx`: sotto "BOZZA GENERATA" due pulsanti "PDF" (`apri-atto-pdf`) e "Word" (`apri-atto-docx`); con Free/No-Ads la riga `apri-atto-filigrana`.
  - `pratica/[id].tsx` e `archivio.tsx`: il tocco su un atto chiede "PDF" o "Word" (riga con `testID` `atto-apri-<id>`).
- **Parcelle e preventivi**: nessun cambiamento oltre al punto sugli errori. Le chiamate (`pratica/[id].tsx`, `archivio.tsx`) passano da `scegliAperturaDocumento`, quindi un rifiuto del server mostra ora il `detail`.

## Come appare

- **Free / No-Ads**: "PDF" apre l'atto con filigrana (decide il server). "Word" è visibile ma al tocco mostra "Il formato Word è disponibile con i piani Pro e Studio." con "Vedi i piani", senza chiamare il server. Il piano si legge da `user.piano` come in `EsportaDocumento.tsx` (free, no_ads o assente = gratuito).
- **Pro / Studio**: "PDF" e "Word" aprono i file senza filigrana, con intestazione dello studio.

## Con la build attuale (#95) quando il backend nuovo sarà in produzione

La #95 apre ancora solo `/atti/{id}/docx`: per Pro e Studio funziona come prima; per Free e No-Ads il server ora risponde 403 e la build vecchia mostra il generico "Impossibile aprire il file" (il `detail` non viene letto), senza PDF. Serve una nuova build con queste modifiche per offrire il PDF e mostrare il messaggio. Parcelle e preventivi continuano a funzionare.

## Verifica

- `tsc`: 11 righe e `expo lint`: 10 problemi (6 errori, 4 warning), uguali al baseline (con `.expo/types` assente).
- Funzione `messaggioDaCorpo` provata con node fuori dal repository: 403 con `detail` stringa, 402 con `detail`, 422 con lista di `msg`, corpo vuoto, corpo HTML, JSON senza `detail`, `null`, corpo assente. Tutti i casi danno il messaggio atteso o `Errore <codice>`.

## Non provato (niente iPhone, niente backend)

Chiamate reali agli endpoint, foglio di condivisione, apertura nel browser, download e `window.alert` su web, VoiceOver, aspetto grafico dei nuovi pulsanti, flusso "Vedi i piani".
