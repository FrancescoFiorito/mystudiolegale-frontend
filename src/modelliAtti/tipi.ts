// Descrizione dei campi di un modello di atto. Il modulo `ModelloAtto` (src/components) disegna
// il modulo e `corpo.ts` costruisce la richiesta al server a partire da questa descrizione:
// aggiungere un modello futuro vuol dire scrivere solo la sua descrizione in `modelli.ts`.
import type { CampoRigaLista } from "@/src/components/ListaInput";

export type Opzione = { value: string; label: string };
export type Modulo = Record<string, any>;

// Come si invia il valore: testo così com'è (il server legge importi e numeri scritti all'italiana),
// numero decimale o intero (il server li vuole già numerici).
export type Invio = "stringa" | "numero" | "intero";

type Comune = {
  key: string;
  label: string;
  // Spiegazione sotto il campo.
  aiuto?: string;
  obbligatorio?: boolean;
  // Il campo compare (e viene inviato) solo se la funzione restituisce true.
  mostraSe?: (f: Modulo) => boolean;
  // Valore inviato quando il campo non è visibile (di norma il campo non viene inviato).
  valoreSeNascosto?: unknown;
  // Campo solo a schermo (non inviato al server).
  soloSchermo?: boolean;
};

export type CampoModello = Comune & (
  | { tipo: "testo"; lungo?: boolean; default?: string; segnaposto?: string; tastiera?: "default" | "email-address" }
  | { tipo: "numero"; default?: string; invio?: Invio; segnaposto?: string }
  // Nel modulo la data è ISO (aaaa-mm-gg), al server va gg/mm/aaaa. Con `vuotaOggi` una data lasciata vuota vale oggi.
  | { tipo: "data"; vuotaOggi?: boolean }
  | { tipo: "scelta"; opzioni: Opzione[]; default?: string; invio?: "stringa" | "numero"; omettiSeVuoto?: boolean }
  | { tipo: "bool"; default?: boolean }
  // Elenco ripetibile ("aggiungi" / "rimuovi"). Con `comeTesti` ogni riga ha un solo campo e al server
  // va l'elenco dei soli testi (es. parti assistite).
  | { tipo: "lista"; campi: CampoRigaLista[]; min?: number; max?: number; etichettaAggiungi: string; nomeVoce: string; righeIniziali?: Record<string, string>[]; comeTesti?: boolean }
);

export type GruppoCampi = { titolo?: string; campi: CampoModello[] };

export type ModelloAtto = {
  id: string;
  titolo: string;
  // Percorso dell'endpoint, es. "/atti-modello/indice-allegati".
  endpoint: string;
  // Breve spiegazione in cima al modulo.
  introduzione?: string;
  gruppi: GruppoCampi[];
};

// Risposta del server (stessa forma dell'esportazione, più testo/promemoria/avviso solo a schermo).
export type RispostaModello = {
  titolo: string;
  sottotitolo: string | null;
  sezioni: { titolo: string | null; righe: { etichetta: string; valore: string }[]; testo: string | null }[];
  note: string | null;
  testo: string;
  promemoria?: string[];
  avviso?: string;
};
