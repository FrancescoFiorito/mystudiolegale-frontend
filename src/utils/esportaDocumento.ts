// Esportazione in PDF / Word dei risultati dei calcolatori: il file lo
// genera il server (POST /documenti/esporta) e qui lo scarichiamo con una
// richiesta autenticata, lo salviamo nella cache e lo apriamo con il foglio
// di condivisione (su web: download del browser). Il server decide in base al
// piano (filigrana, formato Word, intestazione): l'app mostra solo il risultato.
import { apriDocumentoRemotoPost } from "@/src/utils/apriDocumentoRemoto";
import { costruisciCorpoEsportazione, DatiEsportazione, FormatoEsportazione } from "@/src/utils/corpoEsportazione";

export type { DatiEsportazione, FormatoEsportazione } from "@/src/utils/corpoEsportazione";

const nomeSicuro = (t: string) =>
  (t || "documento").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "documento";

// Scarica e apre il documento. Lancia un Error con il `detail` del server
// (es. 403 "Il formato Word è disponibile con i piani Pro e Studio").
export async function esportaDocumento(formato: FormatoEsportazione, dati: DatiEsportazione) {
  const corpo = costruisciCorpoEsportazione(formato, dati);
  return apriDocumentoRemotoPost("/documenti/esporta", corpo, `${nomeSicuro(dati.titolo)}.${formato}`);
}

// Anteprima PDF (una pagina) dell'intestazione dello studio.
export async function anteprimaIntestazione() {
  return apriDocumentoRemotoPost("/documenti/esporta/anteprima-intestazione", undefined, "anteprima-intestazione.pdf");
}
