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
import { Alert } from "react-native";
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
