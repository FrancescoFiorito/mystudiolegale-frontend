// Nota Spese 2004: tariffe (minimo e massimo) di ogni voce per il valore e le competenze scelti,
// lette dalla consultazione del backend (GET /tariffe-forensi-2004). Servono a mostrare
// l'intervallo accanto all'importo specificato e a bloccare il calcolo se è fuori. Funzioni pure.
import type { RisultatoTariffe } from "@/src/utils/tariffeForensi2004";

export type Intervallo = { min: number; max: number };
export type SezioneNotaSpese = "diritti" | "onorari" | "stragiudiziale";
export type IntervalliNotaSpese = {
  // per sezione: indice della voce -> intervallo (assente = voce a importo libero o fisso)
  voci: Record<SezioneNotaSpese, Record<number, Intervallo>>;
  // per sezione: messaggio del backend che rifiuta la richiesta (es. Giudice di Pace oltre 2.600 €)
  errori: Partial<Record<SezioneNotaSpese, string>>;
};

export const INTERVALLI_VUOTI: IntervalliNotaSpese = { voci: { diritti: {}, onorari: {}, stragiudiziale: {} }, errori: {} };

// Sezioni da interrogare e relativa query, o [] se il form non è ancora completo.
export function richiesteIntervalli(f: Record<string, any>, valore: number): { sezione: SezioneNotaSpese; qs: string }[] {
  const tipo = f.valore_tipo || "specificato";
  if (tipo === "specificato" && !(valore > 0)) return [];
  const base = { tipo_valore: tipo, valore: String(tipo === "specificato" ? valore : 0), q: "" };
  const crea = (tariffario: string, competenza?: string) =>
    new URLSearchParams({ tariffario, ...base, ...(competenza ? { competenza } : {}) }).toString();
  if (f.tariffario === "stragiudiziale") return [{ sezione: "stragiudiziale", qs: crea("stragiudiziale") }];
  return [
    { sezione: "diritti", qs: crea("diritti", String(f.competenza_diritti || "1")) },
    { sezione: "onorari", qs: crea("onorari", String(f.competenza_onorari || "11")) },
  ];
}

// Indice della voce (posizione nell'elenco, senza filtro di ricerca) -> intervallo, per le sole voci con minimo e massimo.
export function intervalliDaRisposta(r: Pick<RisultatoTariffe, "righe">): Record<number, Intervallo> {
  const out: Record<number, Intervallo> = {};
  r.righe.forEach((riga, i) => {
    const min = riga.minimo ?? (riga.tariffe.length === 3 ? riga.tariffe[0] : null);
    const max = riga.massimo ?? (riga.tariffe.length === 3 ? riga.tariffe[2] : null);
    if (min != null && max != null && max > 0) out[i] = { min, max };
  });
  return out;
}
