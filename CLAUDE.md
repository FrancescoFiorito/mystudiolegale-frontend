# MyStudioLegale Frontend

App di gestione per studi legali (React Native / Expo, distribuita via TestFlight). Il backend vive nel repo separato `mystudiolegale-backend` (FastAPI/Python/MongoDB, hosted su Render).

## Workflow per ogni modifica

1. Parti sempre da un branch nuovo creato da `main` — il branch più di recente usato in una sessione precedente è quasi certamente già stato mergiato:
   ```
   git fetch origin main --quiet && git checkout -B <nome-branch> origin/main --quiet
   ```
   Se ci sono modifiche non committate da portare sul nuovo branch, `git stash push -u --` prima e `git stash pop` dopo il checkout.
2. Verifica prima di committare:
   - `npx tsc --noEmit -p .`
   - `npx expo lint`
   Confronta l'output con gli errori/warning preesistenti (non sono regressioni introdotte dalla modifica): i confronti `"light"`/`"dark"` in `dashboard.tsx`, `profilo.tsx`, `login.tsx`, `_layout.tsx`, `ThemeContext.tsx`; l'icona `"euro"` non tipizzata in `pratica/[id].tsx`; vari `react/no-unescaped-entities` (calendario.tsx, pratica/[id].tsx, register.tsx); l'import `SHADOW` inutilizzato in `calcolatori.tsx`; alcuni `react-hooks/exhaustive-deps`. Un `npx expo lint` genera anche un `eslint.config.js` locale non versionato: cancellalo prima di committare.
3. Messaggio di commit in italiano, terminato con:
   ```
   Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
   Claude-Session: <link della sessione>
   ```
4. Push, apri una PR verso `main`, mergiala (metodo "merge") — in autonomia, senza chiedere conferma per il merge in sé.

## Dopo ogni modifica

Riporta sempre con questo formato esatto (anche se coinvolge un solo repo tra i due):
```
**Frontend:** <descrizione> — GitHub: <sha corto, primi 7 caratteri>
**Backend:** <descrizione> — Render: <sha corto, primi 7 caratteri>
```
Render mostra lo short SHA standard (primi 7 caratteri), non gli ultimi.

## Build iOS

Non lanciare mai una build in automatico. Solo quando l'utente scrive esplicitamente "Lancia"/"Lancia una build", tramite il workflow GitHub Actions `ios-build.yml` (`workflow_dispatch` su `main`). Segnala sempre se una modifica appena fatta non è inclusa nell'ultima build già lanciata. Se una build fallisce per un errore di infrastruttura (es. timeout CocoaPods, non un errore del diff), rilanciala con un re-run invece di indagare nel codice.

## Deploy backend su Render

Dopo ogni merge sul repo backend, lancia **sempre** il deploy su Render in automatico (connettore Render, servizio `mystudiolegale-backend`), senza chiedere conferma — a differenza delle build iOS, che vanno sempre chieste esplicitamente.

## Pattern UI stabiliti

- Per overlay "a schermo intero" aperti da stato locale (non route vere), usa `SwipeBackScreen` (`src/components/SwipeBackScreen.tsx`) con `onDismiss` per chiuderli, invece del `<Modal>` di React Native — quest'ultimo non supporta lo swipe-da-sinistra-per-tornare-indietro usato nel resto dell'app.
- `useFocusEffect` (non `useEffect`) per ricaricare i dati a ogni focus della schermata: nessuno schermo viene mai smontato cambiando tab in questa app, quindi un `useEffect` legato al solo mount non basterebbe.
