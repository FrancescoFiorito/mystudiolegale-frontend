// Calcolo e verifica dell'impronta hash (SHA256): logica della lista dei file, dei
// messaggi e della verifica, come nell'applicazione del sito di riferimento.
// Funzioni pure (il calcolo dell'impronta e la lettura dei file stanno altrove).

export const MAX_FILE = 64;

export type FileHash = { nome: string; dimensione: number; modificato: number; hash: string };
export type Modo = "calcolo" | "verifica";

export type StatoHash = {
  modo: Modo;
  file: FileHash[];
  testoVerifica: string;
  // Messaggi dell'ultima selezione (si azzerano a ogni cambio di modo, di testo o rimozione di un file).
  progresso: { fatti: number; totale: number } | null;
  erroriSelezione: string[];
};

export const statoHashIniziale = (): StatoHash => ({ modo: "calcolo", file: [], testoVerifica: "", progresso: null, erroriSelezione: [] });

const GIORNI = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];
const MESI = ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"];
const due = (n: number) => (n < 10 ? "0" + n : String(n));

// "Lun, 08 Gen 2024 10:20:30 UTC" (data di ultima modifica del file, in UTC).
export function riferimentoTemporale(ms: number): string {
  const d = new Date(ms);
  return `${GIORNI[d.getUTCDay()]}, ${due(d.getUTCDate())} ${MESI[d.getUTCMonth()]} ${d.getUTCFullYear()} ${due(d.getUTCHours())}:${due(d.getUTCMinutes())}:${due(d.getUTCSeconds())} UTC`;
}

// Impronte presenti nel testo: solo le sequenze di esattamente 64 caratteri esadecimali
// (delimitate da caratteri non esadecimali), in minuscolo e senza ripetizioni.
export function impronteNelTesto(testo: string): string[] {
  const trovate = (testo || "").match(/[0-9a-fA-F]+/g) || [];
  const uniche = new Set<string>();
  for (const t of trovate) if (t.length === 64) uniche.add(t.toLowerCase());
  return Array.from(uniche);
}

// L'impronta del file (esadecimale minuscolo) corrisponde se è tra quelle del testo, a prescindere
// da maiuscole e minuscole.
export const hashCorrisponde = (hash: string, impronte: string[]) => impronte.indexOf(hash.toLowerCase()) >= 0;

export const MSG_NESSUNA_IMPRONTA = "Nessuna impronta da confrontare!";
export const MSG_NESSUNA_IMPRONTA_VALIDA = "Nessuna impronta valida da confrontare: nel testo non c'è nessuna sequenza di 64 caratteri esadecimali.";

// Aggiunge i file scelti (già elaborati, nell'ordine di selezione). `selezionati` è il numero di
// file scelti dall'utente (anche oltre il massimo). Replica selezione + coda + elenco del sito:
// i doppioni (stessa impronta) si cercano tra i file già in elenco e dentro la stessa selezione:
// il secondo non entra.
export function aggiungiSelezione(s: StatoHash, elaborati: FileHash[], selezionati: number): StatoHash {
  const errori: string[] = [];
  let totale = selezionati;
  if (totale > MAX_FILE) {
    totale = MAX_FILE;
    errori.push(`Superato il n. massimo di file. Elaborazione limitata a ${MAX_FILE} file.`);
  }
  const lavorati = elaborati.slice(0, totale);
  const nuovi: FileHash[] = [];
  for (const f of lavorati) {
    const attuale = s.file.concat(nuovi);
    const idx = attuale.findIndex((x) => x.hash === f.hash);
    if (idx >= 0) {
      const suffisso = attuale.length >= 3 ? ` ( è il n. ${idx + 1} dall'alto )` : "";
      errori.push(`Il file ${f.nome} è già presente${suffisso}.`);
    } else nuovi.push(f);
  }
  const elenco = s.file.slice();
  for (const f of nuovi) {
    if (elenco.length >= MAX_FILE) {
      errori.push(`Troppi file nella lista (max = ${MAX_FILE})`);
      break;
    }
    elenco.push(f);
  }
  return { ...s, file: elenco, progresso: { fatti: lavorati.length, totale }, erroriSelezione: errori };
}

export function impostaModo(s: StatoHash, modo: Modo): StatoHash {
  return { ...s, modo, progresso: null, erroriSelezione: [] };
}
export function impostaTesto(s: StatoHash, testo: string): StatoHash {
  return { ...s, testoVerifica: testo, progresso: s.modo === "verifica" ? null : s.progresso, erroriSelezione: s.modo === "verifica" ? [] : s.erroriSelezione };
}
export function rimuoviFile(s: StatoHash, indice: number): StatoHash {
  const file = s.file.filter((_, i) => i !== indice);
  // Senza più file si ricomincia da capo (anche il testo da verificare si svuota).
  if (!file.length) return { ...s, file: [], testoVerifica: "", progresso: null, erroriSelezione: [] };
  return { ...s, file, progresso: null, erroriSelezione: [] };
}
export function nuovoCalcolo(s: StatoHash): StatoHash {
  return { ...s, file: [], testoVerifica: "", progresso: null, erroriSelezione: [] };
}

export type VistaHash = {
  // Per ogni file: null (nessuna verifica), true (corrisponde), false (nessuna corrispondenza).
  esiti: (boolean | null)[];
  messaggio: string;
  errori: string[];
};

// Messaggi e esiti mostrati per lo stato corrente (ClearAllMessages + RefreshAllFileInfo del sito).
export function vistaHash(s: StatoHash): VistaHash {
  const errori = s.erroriSelezione.slice();
  let messaggio = "";
  if (s.progresso) {
    const { fatti, totale } = s.progresso;
    messaggio = `Elaborazione terminata ( ${fatti}/${totale} file elaborat${fatti > 1 ? "i" : "o"} )`;
  }
  const n = s.file.length;
  const impronte = s.modo === "verifica" ? impronteNelTesto(s.testoVerifica) : [];
  const confronta = impronte.length > 0;
  if (s.modo === "verifica" && !confronta && n) {
    errori.push(s.testoVerifica.trim() ? MSG_NESSUNA_IMPRONTA_VALIDA : MSG_NESSUNA_IMPRONTA);
  }
  let ok = 0;
  const esiti = s.file.map((f) => {
    if (s.modo !== "verifica" || !confronta) return null;
    if (hashCorrisponde(f.hash, impronte)) { ok++; return true; }
    errori.push(`File ${f.nome}: nessuna corrispondenza!`);
    return false;
  });
  if (s.modo === "calcolo") {
    if (n > 1) messaggio += `${messaggio ? "\n" : ""}L'elenco contiene ${n} file.`;
  } else {
    const nonOk = n - ok;
    if (nonOk) {
      if (confronta) errori.push(`${nonOk} file su ${n} non corrispond${nonOk > 1 ? "ono" : "e"}!`);
    } else if (n) {
      messaggio = `Perfetto! ${ok > 1 ? "Tutti i file corrispondono alle impronte inserite." : "Il file corrisponde."}`;
    }
  }
  return { esiti, messaggio, errori };
}

// Testo di un file come mostrato nell'elenco (righe etichetta/valore).
export function righeFile(f: FileHash): [string, string][] {
  return [
    ["File", f.nome],
    ["Dimensioni", `${f.dimensione} byte`],
    ["Riferimento temporale", riferimentoTemporale(f.modificato)],
    ["Impronta Hash SHA256", f.hash],
  ];
}

export function testoDaCopiare(file: FileHash[]): string {
  return file.map((f) => righeFile(f).map(([e, v]) => (e === "Impronta Hash SHA256" ? `${e}:\n${v}` : `${e}: ${v}`)).join("\n")).join("\n\n");
}
