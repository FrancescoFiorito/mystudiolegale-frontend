// Helper condiviso per scaricare/aprire un file protetto dal backend (documenti
// del fascicolo, PDF di una parcella, export GDPR, ...).
//
// In passato questi endpoint venivano aperti con `Linking.openURL` passando il
// JWT come query string (`?access_token=...`): il token finiva così nei log del
// browser di sistema, nella cronologia e in eventuali proxy/log del provider
// di hosting. Trattandosi di un gestionale che maneggia dati di uno studio
// legale (informazioni potenzialmente coperte da segreto professionale), qui
// invece scarichiamo il file con una `fetch` autenticata (header
// `Authorization: Bearer <token>`, lo stesso usato da src/api.ts), lo salviamo
// nella cache dell'app con expo-file-system e lo apriamo/condividiamo con il
// foglio di condivisione di sistema (expo-sharing): da lì l'utente può
// visualizzarlo, salvarlo o inoltrarlo, senza che il token compaia mai in un URL.
import { Alert, Linking, Platform } from "react-native";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { api } from "@/src/api";

function sanitizeFileName(nome: string) {
  return (nome || "documento").replace(/[\\/]/g, "_");
}

// `path` e' il percorso relativo all'API (es. `/documenti/${id}/download`),
// SENZA alcun token in query string. `nomeFile` e' il nome suggerito per il
// file scaricato (usato solo per il nome locale/di condivisione).
export async function apriDocumentoRemoto(path: string, nomeFile: string) {
  try {
    const headers = await api.authHeader();
    const url = `${api.base}/api${path}`;
    const res = await fetch(url, { headers: headers as HeadersInit });
    if (!res.ok) {
      throw new Error(`Errore ${res.status}`);
    }
    const buffer = await res.arrayBuffer();
    const dest = new File(Paths.cache, sanitizeFileName(nomeFile));
    dest.write(new Uint8Array(buffer));
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(dest.uri);
    } else {
      Alert.alert("Scaricato", `File salvato in ${dest.uri}`);
    }
  } catch {
    Alert.alert("Errore", "Impossibile aprire il file");
  }
}

// Apre nel browser di sistema un link "usa e getta" (5 minuti) generato dal
// backend apposta per la visualizzazione: non espone mai il token di sessione
// nell'URL (a differenza di come funzionava in passato), solo un codice
// casuale a scadenza breve legato a quel singolo file.
async function apriInBrowser(viewLinkPath: string) {
  try {
    const { url } = await api.post<{ url: string }>(viewLinkPath);
    await Linking.openURL(url);
  } catch {
    Alert.alert("Errore", "Impossibile aprire il file nel browser");
  }
}

// Chiede all'utente se vuole visualizzare il file nel browser (senza
// scaricarlo sul dispositivo) oppure scaricarlo/condividerlo (comportamento
// precedente). `viewLinkPath` e' l'endpoint POST che genera il link
// temporaneo (es. `/documenti/${id}/view-link`), `downloadPath` quello GET
// per lo scaricamento vero e proprio (es. `/documenti/${id}/download`).
export function scegliAperturaDocumento(downloadPath: string, viewLinkPath: string, nomeFile: string) {
  Alert.alert(nomeFile, "Cosa vuoi fare con questo file?", [
    { text: "Annulla", style: "cancel" },
    { text: "Visualizza", onPress: () => apriInBrowser(viewLinkPath) },
    { text: "Scarica o condividi", onPress: () => apriDocumentoRemoto(downloadPath, nomeFile) },
  ]);
}

// Estrae il messaggio leggibile (`detail`) da una risposta di errore del backend.
async function messaggioDaRisposta(res: Response): Promise<string> {
  try {
    const j = await res.json();
    if (typeof j?.detail === "string" && j.detail) return j.detail;
    if (Array.isArray(j?.detail)) {
      const msgs = j.detail.map((d: any) => d?.msg).filter(Boolean);
      if (msgs.length) return msgs.join("; ");
    }
  } catch {}
  return `Errore ${res.status}`;
}

// Nome del file dall'intestazione Content-Disposition (filename*= o filename=).
export function nomeFileDaContentDisposition(cd: string | null): string | null {
  if (!cd) return null;
  const m = /filename\*=(?:UTF-8'')?([^;]+)/i.exec(cd);
  if (m) {
    try { return decodeURIComponent(m[1].trim().replace(/^"|"$/g, "")); } catch {}
  }
  const m2 = /filename="?([^";]+)"?/i.exec(cd);
  return m2 ? m2[1].trim() : null;
}

// Come `apriDocumentoRemoto` ma per un POST con corpo JSON (es. esportazione
// dei risultati dei calcolatori). A differenza dell'altra NON mostra alert e
// lancia un Error con il `detail` del server, cosi' chi chiama puo' mostrare
// il messaggio giusto (es. 403 per il formato Word). Su web scarica il file
// con un link temporaneo (come per l'export GDPR), altrimenti lo salva nella
// cache e apre il foglio di condivisione. Restituisce `filigrana` letto
// dall'intestazione `X-Filigrana`.
export async function apriDocumentoRemotoPost(path: string, body: unknown, nomeFileFallback: string): Promise<{ filigrana: boolean | null; nomeFile: string }> {
  const headers: Record<string, string> = { ...((await api.authHeader()) as Record<string, string>) };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const res = await fetch(`${api.base}/api${path}`, { method: "POST", headers: headers as HeadersInit, body: body === undefined ? undefined : JSON.stringify(body) });
  if (!res.ok) throw new Error(await messaggioDaRisposta(res));
  const xf = res.headers.get("X-Filigrana");
  const filigrana = xf === "1" ? true : xf === "0" ? false : null;
  const nomeFile = sanitizeFileName(nomeFileDaContentDisposition(res.headers.get("Content-Disposition")) || nomeFileFallback);
  if (Platform.OS === "web") {
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = nomeFile;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
    return { filigrana, nomeFile };
  }
  const buffer = await res.arrayBuffer();
  const dest = new File(Paths.cache, nomeFile);
  if (dest.exists) dest.delete();
  dest.write(new Uint8Array(buffer));
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(dest.uri);
  } else {
    Alert.alert("Scaricato", `File salvato in ${dest.uri}`);
  }
  return { filigrana, nomeFile };
}

// POST senza corpo (es. anteprima PDF dell'intestazione).
export async function apriDocumentoRemotoPostVuoto(path: string, nomeFileFallback: string) {
  return apriDocumentoRemotoPost(path, undefined, nomeFileFallback);
}
