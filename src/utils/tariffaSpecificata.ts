// Tariffe 2004 (Nota Spese e Notula Penale): scelta Minima / Massima / Specificata, limiti dell'importo
// specificato e deroghe previste dal D.M. 127/2004. Funzioni pure.
export type Opzione = { value: string; label: string };
export type Calcolatore2004 = "civile" | "penale";
export type Limiti = { min: number | null; max: number | null };

export const TARIFFA_MINIMA_MASSIMA: Opzione[] = [{ value: "minima", label: "Minima" }, { value: "massima", label: "Massima" }];
export const TARIFFA_SCELTE: Opzione[] = [...TARIFFA_MINIMA_MASSIMA, { value: "manuale", label: "Specificata" }];
export const TARIFFA_SCELTE_RIGA: Opzione[] = [{ value: "predefinita", label: "Predefinita" }, ...TARIFFA_SCELTE];

export const DEROGHE_NOTA_SPESE: Opzione[] = [
  { value: "", label: "Nessuna: l'importo deve stare tra minimo e massimo" },
  { value: "particolare_importanza", label: "Causa di particolare importanza (art. 5, comma 2)" },
  { value: "straordinaria_importanza", label: "Causa di straordinaria importanza (art. 5, comma 3, previo parere del Consiglio dell'Ordine)" },
  { value: "manifesta_sproporzione", label: "Manifesta sproporzione (art. 4, comma 2, con parere del Consiglio dell'Ordine)" },
];
export const DEROGHE_NOTULA_PENALE: Opzione[] = [
  { value: "", label: "Nessuna: l'importo deve stare tra minimo e massimo" },
  { value: "particolare_impegno", label: "Particolare impegno (art. 1, comma 2)" },
  { value: "manifesta_sproporzione", label: "Manifesta sproporzione (art. 1, comma 3)" },
  { value: "difensore_ufficio_minorenne", label: "Difensore d'ufficio di imputato minorenne (art. 1, comma 6)" },
];

// Tariffa effettiva di una riga: «Predefinita» rimanda alla tariffa predefinita del calcolatore.
export const tariffaEffettiva = (rigaTariffa: string, predefinita: string): string => (rigaTariffa === "predefinita" ? predefinita : rigaTariffa);

// Limiti dell'importo specificato per una voce con minimo e massimo; null = nessun limite da quel lato.
export function limitiConDeroga(minimo: number, massimo: number, deroga: string, calc: Calcolatore2004): Limiti {
  if (!deroga) return { min: minimo, max: massimo };
  if (calc === "civile") {
    if (deroga === "particolare_importanza") return { min: minimo, max: massimo * 2 };
    if (deroga === "straordinaria_importanza") return { min: minimo, max: massimo * 4 };
    if (deroga === "manifesta_sproporzione") return { min: null, max: null };
  } else {
    if (deroga === "particolare_impegno") return { min: minimo, max: massimo * 4 };
    if (deroga === "manifesta_sproporzione") return { min: minimo, max: null }; // toglie solo il limite superiore
    if (deroga === "difensore_ufficio_minorenne") return { min: minimo / 3, max: massimo };
  }
  return { min: minimo, max: massimo };
}

const IT = { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: true } as const;
const euro = (n: number) => `€ ${Number(n).toLocaleString("it-IT", IT)}`;

// "da € X a € Y" accanto al campo dell'importo specificato.
export function testoIntervallo(l: Limiti): string {
  if (l.min != null && l.max != null) return `da ${euro(l.min)} a ${euro(l.max)}`;
  if (l.min != null) return `da ${euro(l.min)}, senza limite massimo`;
  if (l.max != null) return `fino a ${euro(l.max)}`;
  return "senza limiti (con il parere del Consiglio dell'Ordine)";
}

// Messaggio se l'importo è fuori dai limiti (stessa tolleranza del backend: mezzo centesimo), altrimenti null.
export function erroreImporto(codice: string, nome: string, importo: number, l: Limiti, derogaAttiva: boolean): string | null {
  const sotto = l.min != null && importo < l.min - 0.005;
  const sopra = l.max != null && importo > l.max + 0.005;
  if (!sotto && !sopra) return null;
  let msg = `Voce ${codice} (${nome}): l'importo specificato (${euro(importo)}) deve essere `;
  msg += l.min != null && l.max != null ? `compreso tra ${euro(l.min)} e ${euro(l.max)}` : l.min != null ? `almeno ${euro(l.min)}` : `al massimo ${euro(l.max as number)}`;
  if (!derogaAttiva && sopra) msg += "; per superare il massimo scegli la deroga ai limiti prevista dal decreto";
  return msg + ".";
}
