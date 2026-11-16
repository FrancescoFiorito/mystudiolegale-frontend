// Preventivo Cause Civili: scelta del valore della controversia (scaglioni e
// voci "indeterminabile") e fasi del preventivo, una per riga. Funzioni pure
// usate dalla schermata in `calcolatori.tsx`.
import { parseNumeroIt } from "@/src/utils/formatoItaliano";
import { TABELLE_CIVILI_2014 } from "@/src/utils/tabelleParametri2014";

// Codici delle competenze nei parametri forensi (le tre voci "Magistrature
// superiori", "Consiglio di Stato (appello cautelare)" e "Accertamento del
// passivo" non sono tra le competenze del preventivo).
export const CODICE_COMPETENZA_PREVENTIVO: Record<string, string> = {
  giudice_di_pace: "100", tribunale: "110", corte_dei_conti: "200", corte_appello: "210", cassazione: "220",
  corte_costituzionale: "240", corte_europea: "250", cgue: "260", tar: "320", consiglio_di_stato: "330",
  cgt_primo_grado: "340", cgt_secondo_grado: "350", arbitrato: "370", cause_lavoro: "120", cause_previdenza: "130",
  convalida_locatizia: "140", atto_precetto: "150", volontaria_giurisdizione: "160", procedimenti_monitori: "170",
  istruzione_preventiva: "180", procedimenti_cautelari: "190", esecuzioni_mobiliari: "270", esecuzioni_presso_terzi: "280",
  esecuzioni_immobiliari: "290", iscrizione_ipotecaria: "300", fallimento: "310",
};

// "Valore della controversia": 12 scaglioni e 4 voci "indeterminabile". Il
// valore vuoto lascia lo scaglione al valore in euro scritto nel campo accanto.
export const SCAGLIONI_PREVENTIVO: { value: string; label: string }[] = [
  { value: "", label: "Da importo (campo «Valore della controversia €»)" },
  ...TABELLE_CIVILI_2014["2022"]["110"].scaglioni.filter(([c]) => c !== 130).map(([c, l]) => ({ value: String(c), label: l })),
];

// Scaglioni validi per la competenza scelta (alcune partono da una fascia più alta).
export function scaglioniPreventivoPer(competenza: string): { value: string; label: string }[] {
  const info = TABELLE_CIVILI_2014["2022"][CODICE_COMPETENZA_PREVENTIVO[competenza] ?? ""];
  if (!info) return SCAGLIONI_PREVENTIVO;
  return [SCAGLIONI_PREVENTIVO[0], ...info.scaglioni.filter(([c]) => c !== 130).map(([c, l]) => ({ value: String(c), label: l }))];
}

const COMPLESSITA_DA_SCAGLIONE: Record<string, string> = { "901": "bassa", "902": "media", "903": "alta", "910": "particolare_importanza" };

// Campi di scaglione e indeterminabilità da mandare al backend.
export function campiScaglione(scaglione: string): { scaglione: string; valore_indeterminabile: boolean; complessita_indeterminabile: string } {
  const compl = COMPLESSITA_DA_SCAGLIONE[scaglione];
  return { scaglione: scaglione || "", valore_indeterminabile: !!compl, complessita_indeterminabile: compl ?? "" };
}

export type FasePreventivo = { cod: number; descrizione: string; importo_medio: number; adj_pct: string; importo: string; attiva: boolean };

// Fasi proposte dalla risposta di /calc/parametri-forensi (valori medi).
export function fasiDaParametri(r: any): FasePreventivo[] {
  return (Array.isArray(r?.fasi_dettaglio) ? r.fasi_dettaglio : []).map((x: any) => ({
    cod: Number(x.cod), descrizione: String(x.nome ?? ""), importo_medio: Number(x.medio ?? 0), adj_pct: "0", importo: "", attiva: true,
  }));
}

export function validaFasiPreventivo(fasi: FasePreventivo[] | null): string | null {
  for (const f of fasi ?? []) {
    const p = String(f.adj_pct ?? "").trim();
    if (p !== "" && !(/^-?\d+$/.test(p) && Math.abs(+p) <= 100)) return `Fase «${f.descrizione}»: la percentuale deve essere un intero da -100 a 100.`;
    if (String(f.importo ?? "").trim() !== "" && !(parseNumeroIt(f.importo) >= 0)) return `Fase «${f.descrizione}»: l'importo non può essere negativo.`;
  }
  return null;
}

export function corpoFasiPreventivo(fasi: FasePreventivo[] | null): Record<string, any>[] {
  return (fasi ?? []).map((f) => ({
    cod: f.cod, descrizione: f.descrizione, importo_medio: f.importo_medio,
    adj_pct: String(f.adj_pct ?? "").trim() === "" ? 0 : parseInt(String(f.adj_pct), 10),
    importo: String(f.importo ?? "").trim() === "" ? null : parseNumeroIt(f.importo),
    attiva: !!f.attiva,
  }));
}

// Importo della fase come lo calcola il backend (percentuale sul medio,
// variazione arrotondata all'euro con mezzo euro verso l'alto; l'importo
// libero sostituisce il calcolo): solo per mostrarlo accanto alla fase.
export function importoFasePreventivo(f: FasePreventivo): number {
  if (String(f.importo ?? "").trim() !== "") return parseNumeroIt(f.importo);
  const adj = /^-?\d+$/.test(String(f.adj_pct ?? "").trim()) ? parseInt(String(f.adj_pct), 10) : 0;
  return f.importo_medio + Math.floor((f.importo_medio * adj) / 100 + 0.5);
}
