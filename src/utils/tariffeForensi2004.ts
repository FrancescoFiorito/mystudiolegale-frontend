// Tariffe Forensi 2004 (consultazione): lettura del valore della causa, messaggi
// di errore e utilità di presentazione, come nella maschera del sito di
// riferimento. Funzioni pure.

export type TariffarioForense = "diritti" | "onorari" | "stragiudiziale";
export type TipoValoreForense = "specificato" | "indeterminabile" | "indeterminabile_importanza";

export const TARIFFARI: { id: TariffarioForense; etichetta: string }[] = [
  { id: "diritti", etichetta: "Diritti" },
  { id: "onorari", etichetta: "Onorari" },
  { id: "stragiudiziale", etichetta: "Stragiudiziale" },
];

export const COMPETENZE_DIRITTI = [
  { value: "1", label: "Processo di cognizione" },
  { value: "2", label: "Processo di esecuzione" },
  { value: "3", label: "Procedimenti speciali" },
];
export const COMPETENZE_ONORARI = [
  { value: "11", label: "Giudice di Pace" }, { value: "1", label: "Tribunale Monocratico" }, { value: "2", label: "Tribunale Collegiale" },
  { value: "4", label: "Commissione Tributaria di 1^ grado" }, { value: "15", label: "T.A.R." }, { value: "5", label: "Corte d'Appello" },
  { value: "14", label: "Commissione Tributaria Regionale" }, { value: "16", label: "Corte di Cassazione ed equiparati" },
  { value: "19", label: "Consiglio di Stato" }, { value: "10", label: "Corte Costituzionale" },
  { value: "17", label: "Corte Europea per i diritti dell'uomo" }, { value: "18", label: "Corte di Giustizia CEE" },
  { value: "9", label: "Procedimenti Speciali" }, { value: "20", label: "Procedure Esecutive" },
];

export const MSG_CAMPO_ERRATO = "Un campo risulta errato o non compilato.";
export const MSG_NESSUNA_VOCE = "ATTENZIONE: Nessuna voce trovata con questo critero di ricerca";

export type EsitoValore = { ok: true; valore: number } | { ok: false; errore: string };

// Arrotondamento al centesimo "mezzo per eccesso" sulle cifre decimali scritte
// (1,005 -> 1,01; 12,345 -> 12,35), senza passare dai decimali binari.
function arrotondaCentesimi(intero: string, decimali: string): number {
  const d = (decimali + "00").slice(0, 2);
  let cent = parseInt(intero || "0", 10) * 100 + parseInt(d, 10);
  if (decimali.length > 2 && decimali.charCodeAt(2) >= 53) cent += 1; // '5'
  return cent / 100;
}

// Legge il valore scritto nel campo come la maschera del sito: spazi e "€"
// ignorati, punto come migliaia o come decimale (un solo punto seguito da non
// più di 2 cifre è un decimale), virgola decimale, arrotondamento a 2 decimali.
export function leggiValoreCausa(testo: string): EsitoValore {
  const s = (testo || "").replace(/[\s€]/g, "");
  if (s === "" || s === "0") return { ok: false, errore: "Digita il valore della causa" };
  const negativo = s.startsWith("-");
  const corpo = negativo ? s.slice(1) : s;
  const nonNumerico = { ok: false as const, errore: "Valore non numerico" };
  if (!/^[0-9.,]+$/.test(corpo)) return nonNumerico;
  const virgole = corpo.split(",");
  if (virgole.length > 2) return nonNumerico;
  const sinistra = virgole[0];
  const destra = virgole.length === 2 ? virgole[1] : "";
  if (!/^[0-9]*$/.test(destra)) return nonNumerico;
  let intero: string;
  let decimali = destra;
  const gruppi = sinistra.split(".");
  if (gruppi.length === 1) {
    intero = sinistra;
  } else if (gruppi.length === 2 && virgole.length === 1 && gruppi[1].length <= 2) {
    intero = gruppi[0];
    decimali = gruppi[1];
  } else if (gruppi.length === 2 && gruppi[0] !== "" && gruppi[1] !== "" && /^[0-9]+$/.test(gruppi[1]) && (virgole.length === 2 || gruppi[1].length >= 3)) {
    intero = gruppi[0] + gruppi[1]; // un solo punto prima di 3 o più cifre: migliaia
  } else if (gruppi.length > 2 && gruppi.slice(1).every((g) => /^[0-9]{3}$/.test(g)) && /^[0-9]+$/.test(gruppi[0])) {
    intero = gruppi.join("");
  } else {
    return nonNumerico;
  }
  if (intero === "" && decimali === "") return nonNumerico;
  if (negativo) return { ok: false, errore: "Digita un valore corretto" };
  const valore = arrotondaCentesimi(intero, decimali);
  if (valore === 0) return { ok: false, errore: "Specifica il valore della causa" };
  return { ok: true, valore };
}

const IT = { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: true } as const;
// "€ 5.000,00" (raggruppa sempre le migliaia, anche sotto le 5 cifre).
export const euro = (n: number) => `€ ${Number(n).toLocaleString("it-IT", IT)}`;

export function testoValoreCausa(tipo: TipoValoreForense, valore: number | null): string {
  if (tipo === "indeterminabile") return "Indeterminabile";
  if (tipo === "indeterminabile_importanza") return "Indeterminabile di particolare importanza";
  return euro(valore || 0);
}

export type RigaTariffa = { codice: string; nome: string; tariffe: number[]; nota: string | null };
export type RisultatoTariffe = {
  tariffario: TariffarioForense;
  competenza: number | null;
  competenza_nome: string | null;
  tipo_valore: TipoValoreForense;
  valore: number | null;
  colonne: 1 | 3;
  righe: RigaTariffa[];
};

// Le tre colonne (minimo, medio, massimo): una voce con una sola tariffa la ripete nelle tre.
export function valoriRiga(r: RigaTariffa, colonne: 1 | 3): number[] {
  if (colonne === 1) return [r.tariffe[0]];
  return r.tariffe.length === 3 ? r.tariffe : [r.tariffe[0], r.tariffe[0], r.tariffe[0]];
}
