// Ricerche su dati pubblici del menù Calcolatori: codici catastali, uffici giudiziari e uffici UNEP.
// Gli endpoint e le risposte sono descritti nel backend (docs/ricerche.md). Nessuna esportazione:
// sono ricerche, non tabelle di consultazione.

export type RicercaId = "codici-catastali" | "uffici-giudiziari" | "uffici-unep";

export type ConfigRicerca = {
  titolo: string;
  sottotitolo: string;
  icona: string;
  endpoint: string;
  segnaposto: string;
  // "codici": elenco di comuni con codice catastale. "uffici": scelta del comune, poi uffici competenti.
  kind: "codici" | "uffici";
  // Solo uffici giudiziari: il filtro «Visualizza tutti» (in più Cassazione, tribunali per i minorenni, ...).
  puoVisualizzareTutti: boolean;
};

export const RICERCHE: Record<RicercaId, ConfigRicerca> = {
  "codici-catastali": {
    titolo: "Ricerca Codici Catastali", sottotitolo: "Codice catastale (Belfiore) di un comune", icona: "map-pin",
    endpoint: "/ricerche/codici-catastali", segnaposto: "Comune o codice (es. H501)", kind: "codici", puoVisualizzareTutti: false,
  },
  "uffici-giudiziari": {
    titolo: "Cerca ufficio giudiziario competente", sottotitolo: "Tribunale, giudice di pace e uffici competenti per comune", icona: "map",
    endpoint: "/ricerche/uffici-giudiziari", segnaposto: "Nome del comune", kind: "uffici", puoVisualizzareTutti: true,
  },
  "uffici-unep": {
    titolo: "Ricerca uffici UNEP", sottotitolo: "Ufficio UNEP competente per comune", icona: "navigation",
    endpoint: "/ricerche/uffici-unep", segnaposto: "Nome del comune", kind: "uffici", puoVisualizzareTutti: false,
  },
};
