// Calcolo dell'impronta SHA256 di un file scelto dal selettore dei documenti
// (usato da "Calcolo Impronta Hash" e dai modelli di atti).
import { Platform } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { File } from "expo-file-system";
import { Sha256 } from "@/src/utils/sha256";
import type { FileHash } from "@/src/utils/improntaHash";

type Asset = DocumentPicker.DocumentPickerAsset;

// Blocchi di lettura: abbastanza piccoli da non bloccare l'interfaccia e da non
// tenere in memoria più di un blocco alla volta, anche per file molto grandi.
const BLOCCO = 256 * 1024;
const cedi = () => new Promise<void>((r) => setTimeout(r, 0));

// Calcola l'impronta SHA256 leggendo il file a blocchi. Il file resta sul telefono: non viene
// mai inviato da nessuna parte (nessuna richiesta di rete in questa funzione).
export async function improntaFile(asset: Asset): Promise<FileHash> {
  const sha = new Sha256();
  let dimensione = 0;
  if (Platform.OS === "web" && asset.file) {
    const blob: Blob = asset.file;
    dimensione = blob.size;
    for (let o = 0; o < blob.size; o += BLOCCO) {
      sha.update(new Uint8Array(await blob.slice(o, o + BLOCCO).arrayBuffer()));
      await cedi();
    }
  } else {
    const f = new File(asset.uri);
    const h = f.open();
    try {
      dimensione = h.size ?? asset.size ?? 0;
      let letti = 0;
      while (letti < dimensione) {
        const pezzo = h.readBytes(Math.min(BLOCCO, dimensione - letti));
        if (!pezzo.length) break;
        sha.update(pezzo);
        letti += pezzo.length;
        await cedi();
      }
    } finally {
      try { h.close(); } catch {}
      // La copia temporanea fatta dal selettore dei documenti non serve più.
      try { f.delete(); } catch {}
    }
  }
  return { nome: asset.name, dimensione, modificato: asset.lastModified || Date.now(), hash: sha.digestHex() };
}
