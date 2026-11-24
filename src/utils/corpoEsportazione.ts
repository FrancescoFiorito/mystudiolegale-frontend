// Costruzione (pura, senza dipendenze da React Native) del corpo della
// richiesta POST /documenti/esporta a partire da un risultato di calcolatore.
// Tenuta separata da `esportaDocumento.ts` cosi' si puo' provare con node.

export type RigaDocumento = { etichetta: string; valore: string };
export type SezioneDocumento = { titolo: string | null; righe: RigaDocumento[]; testo: string | null };
export type FormatoEsportazione = "pdf" | "docx";
export type CorpoEsportazione = {
  formato: FormatoEsportazione;
  titolo: string;
  sottotitolo: string | null;
  sezioni: SezioneDocumento[];
  note: string | null;
};

// Limiti del backend.
export const MAX_SEZIONI = 40;
export const MAX_RIGHE = 400;
export const MAX_CARATTERI = 60000;

export type DatiEsportazione = {
  titolo: string;
  sottotitolo?: string | null;
  // Valori inseriti dall'utente: etichetta del campo -> valore mostrato.
  datiInseriti?: [string, string][];
  // Righe del risultato come mostrate a schermo. Una riga con valore vuoto
  // e' una riga di solo testo (titoletto o nota) e finisce nel `testo` della sezione.
  risultato?: [string, string][];
  titoloRisultato?: string;
  // Testo del documento (preventivo, ricevuta) dove il calcolatore lo prevede.
  testoDocumento?: string | null;
  // Sezioni già pronte (tabelle di consultazione): si aggiungono dopo il risultato.
  sezioni?: SezioneDocumento[];
  note?: string | null;
};

const pulisci = (s: unknown) => (s == null ? "" : String(s)).replace(/\r\n/g, "\n").trim();

// Divide le righe del risultato in sezioni consecutive: righe con valore ->
// `righe`, righe senza valore -> `testo` (una per riga, nell'ordine originale).
function sezioniDaRisultato(titolo: string, coppie: [string, string][]): SezioneDocumento[] {
  const out: SezioneDocumento[] = [];
  let cur: SezioneDocumento | null = null;
  let curTipo: "righe" | "testo" | null = null;
  for (const [e0, v0] of coppie) {
    const e = pulisci(e0);
    const v = pulisci(v0);
    if (!e && !v) continue;
    const tipo = v ? "righe" : "testo";
    if (!cur || curTipo !== tipo) {
      cur = { titolo: out.length === 0 ? titolo : null, righe: [], testo: null };
      curTipo = tipo;
      out.push(cur);
    }
    if (tipo === "righe") cur.righe.push({ etichetta: e || "-", valore: v });
    else cur.testo = cur.testo ? `${cur.testo}\n${e}` : e;
  }
  return out;
}

function lunghezza(s: SezioneDocumento) {
  return (s.titolo?.length || 0) + (s.testo?.length || 0) + s.righe.reduce((a, r) => a + r.etichetta.length + r.valore.length, 0);
}

export function costruisciCorpoEsportazione(formato: FormatoEsportazione, d: DatiEsportazione): CorpoEsportazione {
  let sezioni: SezioneDocumento[] = [];
  const dati = (d.datiInseriti || []).filter(([e, v]) => pulisci(e) && pulisci(v));
  if (dati.length) {
    sezioni.push({ titolo: "Dati inseriti", righe: dati.map(([e, v]) => ({ etichetta: pulisci(e), valore: pulisci(v) })), testo: null });
  }
  sezioni.push(...sezioniDaRisultato(d.titoloRisultato || "Risultato", d.risultato || []));
  for (const x of d.sezioni || []) {
    const titolo = pulisci(x.titolo) || null;
    const righe = x.righe.map((r) => ({ etichetta: pulisci(r.etichetta) || "-", valore: pulisci(r.valore) || "-" }));
    const testo = pulisci(x.testo) || null;
    if (righe.length || testo) sezioni.push({ titolo, righe, testo });
  }
  if (d.testoDocumento && pulisci(d.testoDocumento)) {
    sezioni.push({ titolo: "Documento", righe: [], testo: pulisci(d.testoDocumento) });
  }

  // Troncamenti dichiarati: righe (400), sezioni (40), caratteri (60.000).
  let troncato = false;
  let righeTot = 0;
  const conRighe: SezioneDocumento[] = [];
  for (const s of sezioni) {
    const resto = MAX_RIGHE - righeTot;
    if (resto <= 0 && s.righe.length) { troncato = true; continue; }
    if (s.righe.length > resto) { troncato = true; conRighe.push({ ...s, righe: s.righe.slice(0, resto) }); righeTot += resto; }
    else { conRighe.push(s); righeTot += s.righe.length; }
  }
  sezioni = conRighe;
  if (sezioni.length > MAX_SEZIONI - 1) { sezioni = sezioni.slice(0, MAX_SEZIONI - 1); troncato = true; }

  // Riserva spazio per titolo, sottotitolo, note e avviso di troncamento.
  const avviso = "Documento abbreviato: il risultato superava i limiti di dimensione dell'esportazione e alcune righe sono state omesse.";
  const riserva = pulisci(d.titolo).length + pulisci(d.sottotitolo).length + pulisci(d.note).length + avviso.length + 200;
  let budget = MAX_CARATTERI - riserva;
  const finali: SezioneDocumento[] = [];
  for (const s of sezioni) {
    const l = lunghezza(s);
    if (l <= budget) { finali.push(s); budget -= l; continue; }
    troncato = true;
    // Taglia il testo e le righe finche' ci sta, poi si ferma.
    const righe: RigaDocumento[] = [];
    for (const r of s.righe) {
      const lr = r.etichetta.length + r.valore.length;
      if (lr > budget) break;
      righe.push(r); budget -= lr;
    }
    let testo = s.testo;
    if (testo && righe.length === s.righe.length) {
      testo = testo.length > budget ? testo.slice(0, Math.max(0, budget - 1)).trimEnd() + "…" : testo;
      budget -= testo.length;
    } else testo = null;
    if (righe.length || testo) finali.push({ titolo: s.titolo, righe, testo });
    break;
  }
  const note = [pulisci(d.note), troncato ? avviso : ""].filter(Boolean).join("\n");
  return {
    formato,
    titolo: pulisci(d.titolo) || "Documento",
    sottotitolo: pulisci(d.sottotitolo) || null,
    sezioni: finali,
    note: note || null,
  };
}
