// Testo della Ricevuta per prestazione occasionale, a partire dai dati
// anagrafici/documento inseriti nel form e dai numeri restituiti dal calcolo.
import { euro, pct, dataIt, maiuscolaIniziale, minuscolaIniziale, conPuntoFinale, righe } from "./formati";

export type DatiRicevuta = {
  prestatore: string;
  cf_prestatore: string;
  committente: string;
  cf_committente: string;
  data_ricevuta: string; // ISO
  numero?: string;
  oggetto?: string;
  luogo?: string;
  pagamento?: string;
  iban?: string;
  altri_compensi_percepiti: boolean;
  totale_altri_compensi: number | null;
};

const ART_67 = "altri redditi per attività di lavoro autonomo non esercitato abitualmente di cui all’art. 67, comma 1, lett. l), DPR 917/1986";
const PREMESSA = "Il sottoscritto dichiara, ai fini della trattenuta contributiva INPS, di";

// Anno di riferimento dei contributi: fino al 12 gennaio vale l'anno precedente.
export function annoRiferimento(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return m === 1 && d <= 12 ? y - 1 : y;
}
export function massimaleInps(anno: number): number {
  return anno <= 2025 ? 119650 : 122295;
}

function dichiarazioneInps(d: DatiRicevuta): string {
  if (!d.altri_compensi_percepiti) return `${PREMESSA} non aver percepito nel corso del ${d.data_ricevuta.slice(0, 4)} ${ART_67}.`;
  const anno = annoRiferimento(d.data_ricevuta);
  const altri = d.totale_altri_compensi || 0;
  const massimale = massimaleInps(anno);
  const finale = `avendo percepito nel corso del ${anno} ${ART_67}, per un importo pari a ${euro(altri)}.`;
  if (altri >= massimale) return `${PREMESSA} aver superato il massimale annuo di ${euro(massimale)}, ${finale}`;
  if (altri > 5000) return `${PREMESSA} aver superato il limite di € 5.000,00 ma non il massimale annuo pari a ${euro(massimale)}, ${finale}`;
  return `${PREMESSA} non aver superato il limite annuo di € 5.000,00, ${finale}`;
}

export function generaRicevutaOccasionale(d: DatiRicevuta, r: any): string {
  const out: string[] = [];
  out.push(...righe(d.prestatore));
  out.push(`C.F.: ${d.cf_prestatore.trim().toUpperCase()}`);
  out.push(...righe(d.committente));
  const cc = d.cf_committente.trim().toUpperCase();
  out.push(`${cc.length === 11 ? "P. IVA" : "C.F."}: ${cc}`);
  out.push("");
  const num = (d.numero || "").trim();
  out.push(`Ricevuta${num ? ` n° ${num}` : ""} del ${dataIt(d.data_ricevuta)}.`);
  if ((d.oggetto || "").trim()) out.push(`Oggetto: ${conPuntoFinale(maiuscolaIniziale(d.oggetto as string))}`);
  out.push("");

  const compensi: any[] = r.compensi || [];
  const spese: any[] = r.spese_documentate || [];
  const conForfettarie = r.spese_forfettarie != null;
  const riga = (a: string, b: string) => `${a}\t${b}`;
  out.push(riga(conForfettarie ? "Compensi" : compensi.length > 1 ? "Dettaglio compensi" : "Compensi", conForfettarie ? "" : "Importo"));
  compensi.forEach((c) => out.push(riga(maiuscolaIniziale(c.descrizione), euro(c.importo))));
  if (compensi.length > 1) out.push(riga("Totale compenso:", euro(r.totale_compensi)));
  if (conForfettarie) {
    out.push(riga(r.pct_spese_forfettarie != null ? `Spese forfettarie (${pct(r.pct_spese_forfettarie)}%)` : "Spese forfettarie", euro(r.spese_forfettarie)));
    out.push(riga("Totale imponibile:", euro(r.totale_imponibile)));
  }
  if (spese.length > 0) {
    out.push("Spese documentate da rimborsare");
    spese.forEach((s) => out.push(riga(maiuscolaIniziale(s.descrizione), euro(s.importo))));
    if (spese.length > 1) out.push(riga("Totale spese:", euro(r.totale_spese)));
  }
  if (r.bollo > 0) out.push(riga("Addebito imposta di bollo", euro(r.bollo)));
  if ((r.ritenuta_acconto != null || r.imponibile_inps != null) && (r.bollo > 0 || spese.length > 0)) out.push(riga("Totale documento:", euro(r.totale_documento)));
  if (r.ritenuta_acconto != null || r.imponibile_inps != null) {
    out.push("RITENUTE");
    if (r.ritenuta_acconto != null) out.push(riga(`Ritenuta d’acconto (${pct(r.pct_ritenuta)}% ${conForfettarie ? "sull’imponibile" : "sul compenso"})`, euro(r.ritenuta_acconto)));
    if (r.imponibile_inps != null) {
      out.push(riga("Imponibile Inps per la parte eccedente € 5000 annuali", euro(r.imponibile_inps)));
      out.push(riga("Aliquota gestione separata Inps", `${Number(r.aliquota_inps).toFixed(2).replace(".", ",")}%`));
      out.push(riga(`Ritenuta INPS a carico del prestatore (1/3 di ${euro(r.contributo_inps)})`, euro(r.ritenuta_inps)));
    }
  }
  out.push(riga("Netto a pagare:", euro(r.netto_a_pagare)));
  out.push("");
  out.push(dichiarazioneInps(d));
  out.push("Il sottoscritto dichiara di non essere soggetto al regime IVA a norma dell’art. 5, comma 2, DPR 633/72.");
  out.push("");
  const luogo = (d.luogo || "").trim();
  out.push(luogo ? `${luogo}, li ${dataIt(d.data_ricevuta)}` : `Data: ${dataIt(d.data_ricevuta)}`);
  out.push("Firma:");
  if ((d.pagamento || "").trim()) out.push(`Pagamento: ${conPuntoFinale(minuscolaIniziale(d.pagamento as string))}`);
  if ((d.iban || "").trim()) out.push(`IBAN: ${(d.iban as string).trim()}`);
  if (r.ritenuta_acconto != null) out.push("La ritenuta d'acconto è a carico del Cliente che vorrà far pervenire la certificazione comprovante l'avvenuto pagamento.");
  return out.join("\n");
}
