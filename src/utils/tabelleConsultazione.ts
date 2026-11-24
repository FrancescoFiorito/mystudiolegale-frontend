// Tabelle di consultazione del menù Calcolatori: tipi della risposta del server
// (GET /api/tabelle/<nome>, contratto comune), configurazione di ciascuna voce
// e costruzione (pura, senza React Native) dei dati per l'esportazione PDF/Word.
// Le celle arrivano già formattate dal server: qui non si riformatta nulla.
import type { DatiEsportazione, SezioneDocumento } from "@/src/utils/corpoEsportazione";

export type ColonnaTab = { chiave: string; etichetta: string; gruppo?: string; etichetta_acc?: string };
export type OpzioneFiltro = { valore: string | number; etichetta: string; descrizione?: string; gruppo?: string };
export type FiltroTab = {
  nome: string;
  etichetta: string;
  tipo: "scelta" | "scelta_multipla" | "mese" | "anno" | "testo";
  predefinito: string | number | null;
  opzioni?: OpzioneFiltro[];
  minimo?: number;
  massimo?: number;
  massimo_caratteri?: number;
  etichetta_acc?: string;
};
export type InfoRigaTab = { nota?: string; moltiplicatori?: Record<string, string> | null; moltiplicatori_testo?: string | null };
export type SezioneTab = {
  id: string;
  titolo: string | null;
  colonne: ColonnaTab[];
  righe: string[][];
  note: string[];
  gruppo?: string | null;
  titolo_gruppo?: string;
  testo?: string[];
  elenco?: string[];
  ids?: string[];
  blocchi_righe?: number[];
  righe_intestazione?: number[];
  info?: InfoRigaTab[];
  periodo?: string;
};
export type RispostaTab = {
  id: string;
  titolo: string;
  sottotitolo: string | null;
  introduzione: string[];
  evidenza: { etichetta: string; valore: string }[];
  filtri: FiltroTab[];
  sezioni: SezioneTab[];
  note: string[];
  fonti: string[];
  aggiornato_al: string | null;
  messaggio?: string | null;
  indice?: { gruppo: string; voci: { id: string; titolo: string }[] }[];
  // Solo "Spese Condominiali": risposta originale del server, per l'esportazione.
  grezzo?: RispostaSpese;
};

export type TabellaId =
  | "variazioni-storiche-istat" | "variazioni-istat" | "ultimo-indice-istat" | "inflazione-titoli-di-stato"
  | "interessi-legali" | "interessi-di-mora" | "tassi-appalti"
  | "contributo-unificato" | "codici-iscrizione-ruolo" | "parametri-forensi"
  | "coefficienti-usufrutto" | "categorie-catastali"
  | "danno-biologico-lieve" | "tabella-unica-macropermanenti" | "danno-milano-roma" | "menomazioni"
  | "spese-condominiali";

export type ConfigTabella = {
  id: TabellaId;
  titolo: string; // titolo della schermata
  sottotitolo: string; // riga sotto il nome nel menù (e nella ricerca)
  icona: string;
  // Come si chiamano i dati: GET /tabelle/<endpoint> (o la funzione dedicata).
  endpoint?: string;
  // Filtri mostrati come pulsanti di scelta (radio) invece della tendina.
  radio?: string[];
  radioSenzaEtichetta?: string[];
  // Testo mostrato prima della N-esima opzione di un radio (come sul sito).
  radioTestoPrima?: Record<string, { indice: number; testo: string }>;
  // Se presente, i filtri non ricaricano da soli: serve il pulsante.
  pulsante?: string;
  soloPulsante?: boolean;
  // Cambiando il filtro `chiave`, altri filtri tornano al valore indicato.
  azzera?: Record<string, Record<string, string>>;
  // Dopo ogni risposta i filtri si riallineano ai valori scelti dal server.
  sincronizza?: boolean;
  apribili?: boolean;
  azioneRiga?: { tipo: "copia"; colonna: string } | { tipo: "info" };
  evidenziaUltima?: boolean;
  // "Dati aggiornati a …" sotto il titolo (solo le tabelle Istat lo hanno sul sito).
  mostraAggiornamento?: boolean;
};

export const TABELLE_CONSULTAZIONE: Record<TabellaId, ConfigTabella> = {
  "variazioni-storiche-istat": {
    id: "variazioni-storiche-istat", titolo: "Variazioni Storiche Istat", sottotitolo: "Variazioni e coefficienti dell'indice Istat dal 1948", icona: "trending-up",
    endpoint: "variazioni-storiche-istat", mostraAggiornamento: true, radio: ["tipo"], radioSenzaEtichetta: ["tipo"],
    radioTestoPrima: { tipo: { indice: 1, testo: "Calcola le variazioni percentuali:" } },
    pulsante: "Visualizza", soloPulsante: true,
  },
  "variazioni-istat": {
    id: "variazioni-istat", titolo: "Tabella Variazioni Istat", sottotitolo: "Variazioni annuali e biennali dell'indice FOI, al 100%, 75% e 50%", icona: "bar-chart-2",
    endpoint: "variazioni-istat", mostraAggiornamento: true,
  },
  "ultimo-indice-istat": {
    id: "ultimo-indice-istat", titolo: "Ultimo Indice Istat", sottotitolo: "Ultimo indice FOI pubblicato e variazioni", icona: "activity",
    endpoint: "ultimo-indice-istat", mostraAggiornamento: true,
  },
  "inflazione-titoli-di-stato": {
    id: "inflazione-titoli-di-stato", titolo: "Inflazione e Titoli di Stato", sottotitolo: "Andamento di inflazione, BOT e Rendistato", icona: "percent",
    endpoint: "inflazione-titoli-di-stato", mostraAggiornamento: true,
  },
  "interessi-legali": {
    id: "interessi-legali", titolo: "Tabella Interessi Legali", sottotitolo: "Saggio di interesse legale dal 1942", icona: "percent",
    endpoint: "interessi-legali", evidenziaUltima: true,
  },
  "interessi-di-mora": {
    id: "interessi-di-mora", titolo: "Tabella Interessi di Mora", sottotitolo: "Tassi di mora ex d.lgs. 231/2002, semestre per semestre", icona: "percent",
    endpoint: "interessi-di-mora",
  },
  "tassi-appalti": {
    id: "tassi-appalti", titolo: "Tabella Tassi Appalti", sottotitolo: "Tassi moratori per gli appalti pubblici", icona: "percent",
    endpoint: "tassi-appalti",
  },
  "contributo-unificato": {
    id: "contributo-unificato", titolo: "Tabella Contributo Unificato", sottotitolo: "Scaglioni, riduzioni, aumenti e importi fissi", icona: "file-text",
    endpoint: "contributo-unificato", apribili: true,
  },
  "codici-iscrizione-ruolo": {
    id: "codici-iscrizione-ruolo", titolo: "Codici Iscrizione Ruolo", sottotitolo: "Ricerca dei codici oggetto per materia", icona: "search",
    endpoint: "codici-iscrizione-ruolo", radio: ["modalita", "ordina"], radioSenzaEtichetta: ["modalita"], pulsante: "CERCA",
    azioneRiga: { tipo: "copia", colonna: "codice" },
  },
  "parametri-forensi": {
    id: "parametri-forensi", titolo: "Tabelle Parametri", sottotitolo: "Parametri forensi D.M. 55/2014, tabella per tabella", icona: "table",
    endpoint: "parametri-forensi",
  },
  "coefficienti-usufrutto": {
    id: "coefficienti-usufrutto", titolo: "Coefficienti Usufrutto", sottotitolo: "Coefficienti per età e anno di riferimento", icona: "home",
    endpoint: "coefficienti-usufrutto",
  },
  "categorie-catastali": {
    id: "categorie-catastali", titolo: "Categorie Catastali", sottotitolo: "Elenco delle categorie catastali con moltiplicatori", icona: "map",
    endpoint: "categorie-catastali", azioneRiga: { tipo: "info" },
  },
  "danno-biologico-lieve": {
    id: "danno-biologico-lieve", titolo: "Tabelle Danno Biologico", sottotitolo: "Lesioni di lieve entità, fino a 9 punti (art. 139 CAP)", icona: "heart",
    endpoint: "danno-biologico-lieve",
  },
  "tabella-unica-macropermanenti": {
    id: "tabella-unica-macropermanenti", titolo: "Tabella Unica Macropermanenti", sottotitolo: "Tabella unica nazionale DPR 12/2025, da 10 a 100 punti", icona: "heart",
    endpoint: "tabella-unica-macropermanenti",
  },
  "danno-milano-roma": {
    id: "danno-milano-roma", titolo: "Tabelle Milano e Roma", sottotitolo: "Danno non patrimoniale: tabelle dei Tribunali di Milano e Roma", icona: "heart",
    endpoint: "danno-milano-roma",
  },
  menomazioni: {
    id: "menomazioni", titolo: "Tabella delle Menomazioni", sottotitolo: "Menomazioni di lieve entità, D.M. 3/7/2003", icona: "heart",
    endpoint: "menomazioni", pulsante: "CERCA",
  },
  "spese-condominiali": {
    id: "spese-condominiali", titolo: "Spese Condominiali", sottotitolo: "Ripartizione spese tra proprietario e inquilino", icona: "users",
    azzera: { tabella: { categoria: "0" } }, sincronizza: true,
  },
};

// ---------- Richieste -------------------------------------------------------

export type Valori = Record<string, string>;

export function valoriIniziali(filtri: FiltroTab[]): Valori {
  const v: Valori = {};
  for (const f of filtri) v[f.nome] = f.predefinito == null ? "" : String(f.predefinito);
  return v;
}

// Query string con i soli filtri valorizzati (il server usa i predefiniti per il resto).
export function queryTabella(valori: Valori, filtri: FiltroTab[]): string {
  const parti: string[] = [];
  for (const f of filtri) {
    const v = (valori[f.nome] ?? "").trim();
    if (v !== "") parti.push(`${encodeURIComponent(f.nome)}=${encodeURIComponent(v)}`);
  }
  return parti.length ? `?${parti.join("&")}` : "";
}

export type RispostaSpese = {
  tabella: number;
  categoria: number;
  tabelle: { id: number; nome: string }[];
  categorie: { id: number; nome: string }[];
  legenda: string;
  sezioni: { id: number; nome: string; voci: { voce: string; proprietario: string; inquilino: string; pct_proprietario: number | null; pct_inquilino: number | null }[] }[];
  nota: string;
};

// Adatta la risposta di POST /calc/spese-condominiali alla forma comune delle tabelle,
// così la schermata generica la mostra come tutte le altre.
export function rispostaDaSpese(r: RispostaSpese): RispostaTab {
  return {
    id: "spese-condominiali",
    titolo: "Ripartizione Spese Condominiali",
    sottotitolo: null,
    introduzione: r.legenda ? [r.legenda] : [],
    evidenza: [],
    filtri: [
      { nome: "tabella", etichetta: "", etichetta_acc: "Tabella di ripartizione", tipo: "scelta", predefinito: r.tabella, opzioni: r.tabelle.map((x) => ({ valore: x.id, etichetta: x.nome })) },
      { nome: "categoria", etichetta: "", etichetta_acc: "Categoria di spesa", tipo: "scelta", predefinito: r.categoria, opzioni: r.categorie.map((x) => ({ valore: x.id, etichetta: x.nome })) },
    ],
    sezioni: r.sezioni.map((s) => ({
      id: `cat-${s.id}`,
      titolo: s.nome,
      colonne: [
        { chiave: "voce", etichetta: "Voce" },
        { chiave: "p", etichetta: "P", etichetta_acc: "Proprietario" },
        { chiave: "i", etichetta: "I", etichetta_acc: "Inquilino" },
      ],
      righe: s.voci.map((v) => [v.voce, v.proprietario || "", v.inquilino || ""]),
      note: [],
    })),
    note: r.nota ? [r.nota] : [],
    fonti: [],
    aggiornato_al: null,
    grezzo: r,
  };
}

// ---------- Esportazione PDF/Word -----------------------------------------

const t = (s: unknown) => (s == null ? "" : String(s)).trim();
const unisci = (parti: (string | false | null | undefined)[], sep = " · ") => parti.filter((p) => !!p).join(sep);
const righeVuote = (s: SezioneTab) => !s.righe.length && !(s.testo || []).length && !(s.elenco || []).length;

function noteEFonti(r: RispostaTab, extra: string[] = []): string | null {
  const out = [...extra, ...(r.note || []), ...(r.fonti || [])].map(t).filter(Boolean).join("\n");
  return out || null;
}

function sottotitoloAggiornamento(r: RispostaTab): string | null {
  const a = t(r.aggiornato_al);
  if (!a) return null;
  return /^\d/.test(a) ? `Dati aggiornati al ${a}` : `Dati aggiornati a ${a}`;
}

const sez = (titolo: string | null, righe: { etichetta: string; valore: string }[], testo: string | null = null): SezioneDocumento => ({ titolo, righe, testo });

// Valore di una riga di tabella: le colonne dopo la prima unite da " · ".
function coppiaGenerica(s: SezioneTab, riga: string[], senzaVuoti = true): { etichetta: string; valore: string } {
  const altre = riga.slice(1).map((c, i) => ({ c: t(c), col: s.colonne[i + 1] }));
  return { etichetta: t(riga[0]) || "-", valore: unisci(altre.filter((x) => !senzaVuoti || x.c).map((x) => x.c), " · ") || "-" };
}

// Una riga per ogni riga della tabella, con le celle precedute dalla loro intestazione.
function rigaConIntestazioni(s: SezioneTab, riga: string[], saltaVuote = true): string {
  const celle: string[] = [];
  riga.slice(1).forEach((c, i) => {
    const v = t(c);
    if (saltaVuote && (!v || /^-+$/.test(v))) return;
    const lab = t(s.colonne[i + 1]?.etichetta);
    celle.push(lab ? `${lab} ${v}` : v);
  });
  return unisci([t(riga[0]), ...celle]);
}

const NOMI_COLONNE_DANNO: Record<string, string> = {
  biologico: "Biologico", incremento: "Incremento", non_patrimoniale: "Non patrimoniale",
  personalizzazione: "Personalizzazione massima", risarcibile: "Danno risarcibile", minima: "Minima", media: "Media", massima: "Massima",
};

// Colonne con intestazione "%": il valore si accoda alla cella precedente "(49%)".
function valoreDanno(s: SezioneTab, riga: string[]): string {
  const parti: string[] = [];
  for (let j = 1; j < s.colonne.length; j++) {
    const c = s.colonne[j];
    const v = t(riga[j]);
    if (!v) continue;
    if (t(c.etichetta) === "%" && parti.length) { parti[parti.length - 1] += ` (${v})`; continue; }
    parti.push(`${NOMI_COLONNE_DANNO[c.chiave] || t(c.etichetta)} ${v}`);
  }
  return unisci(parti);
}

const puntiEtichetta = (n: string) => (t(n) === "1" ? "1 punto" : `${t(n)} punti`);

// Parametri forensi: ogni fase occupa `blocchi_righe` righe (medio, "-50% +50%", Min, Max).
function righeParametri(s: SezioneTab): { etichetta: string; valore: string }[] {
  const out: { etichetta: string; valore: string }[] = [];
  const blocchi = s.blocchi_righe && s.blocchi_righe.length ? s.blocchi_righe : [s.righe.length];
  let i = 0;
  for (const n of blocchi) {
    const gruppo = s.righe.slice(i, i + n);
    i += n;
    if (!gruppo.length) continue;
    const fase = t(gruppo[0][0]) || "-";
    const celle: string[] = [];
    for (let j = 1; j < s.colonne.length; j++) {
      const medio = t(gruppo[0][j]);
      if (!medio || medio === "-") continue;
      const min = gruppo.map((r) => t(r[j])).find((c) => /^Min:/i.test(c));
      const max = gruppo.map((r) => t(r[j])).find((c) => /^Max:/i.test(c));
      const estremi = unisci([min && min.replace(/^Min:\s*/i, "min "), max && max.replace(/^Max:\s*/i, "max ")], ", ");
      celle.push(`${t(s.colonne[j].etichetta)}: ${medio}${estremi ? ` (${estremi})` : ""}`);
    }
    out.push({ etichetta: fase, valore: unisci(celle) || "-" });
  }
  return out;
}

// Gruppi del contributo unificato, nell'ordine dell'indice del sito.
export function gruppiContributo(r: RispostaTab): string[] {
  const g: string[] = [];
  for (const x of r.indice || []) if (!g.includes(x.gruppo)) g.push(x.gruppo);
  for (const s of r.sezioni) if (s.gruppo && !g.includes(s.gruppo)) g.push(s.gruppo);
  return g;
}
const GRUPPO_ALTRI = "Contributo determinato in misura fissa";

export type OpzioniEsportazione = {
  valori: Valori;
  // Contributo unificato: gruppi da esportare (vuoto = tutti).
  gruppi?: string[];
  // Categorie catastali: aggiunge il moltiplicatore catastale a ogni voce.
  moltiplicatori?: boolean;
};

function sezioneContributo(s: SezioneTab): SezioneDocumento {
  const titolo = s.titolo_gruppo ? `${s.titolo_gruppo} – ${t(s.titolo)}` : t(s.titolo);
  const righe: { etichetta: string; valore: string }[] = [];
  const testo: string[] = [];
  if (s.colonne.length === 1) {
    const intest = new Set(s.righe_intestazione || []);
    s.righe.forEach((r, i) => testo.push(intest.has(i) ? t(r[0]) : `- ${t(r[0])}`));
  } else {
    for (const r of s.righe) righe.push(coppiaGenerica(s, r, false));
  }
  for (const p of s.testo || []) testo.push(t(p));
  for (const e of s.elenco || []) testo.push(t(e) === "---" ? "" : `- ${t(e)}`);
  for (const n of s.note || []) testo.push(t(n));
  return sez(titolo, righe, testo.filter((x, i) => x || i > 0).join("\n") || null);
}

// Dati per POST /documenti/esporta, secondo la sezione "esportazione" di ciascuna
// tabella (docs/tabelle-consultazione.md). Ritorna null se non c'è nulla da esportare.
export function esportazioneTabella(id: TabellaId, r: RispostaTab, o: OpzioniEsportazione): DatiEsportazione | null {
  const base = { titolo: t(r.titolo) || "Tabella", note: noteEFonti(r) };
  const sezioniVere = r.sezioni.filter((s) => !righeVuote(s));
  if (!sezioniVere.length) return null;
  const s0 = sezioniVere[0];
  let sezioni: SezioneDocumento[] = [];
  let sottotitolo: string | null = TABELLE_CONSULTAZIONE[id].mostraAggiornamento ? sottotitoloAggiornamento(r) : null;
  let note = base.note;

  switch (id) {
    case "variazioni-storiche-istat":
      sottotitolo = t(s0.titolo) || sottotitolo;
      sezioni = [sez(null, [], s0.righe.map((riga) => rigaConIntestazioni(s0, riga)).join("\n"))];
      break;
    case "variazioni-istat": {
      const gruppoBreve = (g?: string) => t(g).replace(/^Variazioni\s+/i, "");
      sezioni = [sez(null, s0.righe.map((riga) => {
        const parti: string[] = [];
        let ultimo = "";
        for (let j = 2; j < s0.colonne.length; j++) {
          const g = gruppoBreve(s0.colonne[j].gruppo);
          const lab = t(s0.colonne[j].etichetta);
          parti.push(`${g && g !== ultimo ? `${g} ` : ""}${lab} ${t(riga[j])}`);
          ultimo = g;
        }
        return { etichetta: unisci([t(riga[0]), t(riga[1])], " "), valore: unisci(parti) };
      }))];
      break;
    }
    case "ultimo-indice-istat":
      sottotitolo = t(s0.periodo) || sottotitolo;
      sezioni = [sez(t(s0.titolo) || null, s0.righe.map((riga) => ({ etichetta: t(riga[0]), valore: t(riga[1]) || "-" })))];
      break;
    case "inflazione-titoli-di-stato":
      sezioni = sezioniVere.map((s) => sez(t(s.titolo) || null, s.righe.map((riga) => ({
        etichetta: t(riga[0]),
        valore: unisci(riga.slice(1).map((c, i) => (t(c) ? `${t(s.colonne[i + 1].etichetta)} ${t(c)}` : ""))) || "-",
      }))));
      break;
    case "interessi-legali": {
      const vigente = r.evidenza.find((e) => /vigente/i.test(e.etichetta));
      sottotitolo = vigente ? `${t(vigente.etichetta)}: ${t(vigente.valore)}` : sottotitolo;
      sezioni = [sez(t(s0.titolo) || null, s0.righe.map((riga) => {
        const al = t(riga[1]);
        return { etichetta: !al || /^-+$/.test(al) ? `dal ${t(riga[0])}` : `dal ${t(riga[0])} al ${al}`, valore: unisci([t(riga[2]), t(riga[3])]) || "-" };
      }))];
      break;
    }
    case "interessi-di-mora":
      sezioni = [sez(t(s0.titolo) || null, s0.righe.map((riga) => ({
        etichetta: `${t(riga[0])} – ${t(riga[1])}`,
        valore: `B.C.E. ${t(riga[2])} + ${t(riga[3])} = ${t(riga[4])}`,
      })))];
      break;
    case "tassi-appalti":
      sezioni = [sez(t(s0.titolo) || null, s0.righe.map((riga) => ({ etichetta: `dal ${t(riga[0])} al ${t(riga[1])}`, valore: t(riga[2]) || "-" })))];
      // L'avviso è un testo da mantenere nel documento.
      note = noteEFonti(r, r.introduzione);
      break;
    case "contributo-unificato": {
      const scelti = o.gruppi && o.gruppi.length ? o.gruppi : gruppiContributo(r);
      sezioni = r.sezioni
        .filter((s) => !righeVuote(s) && scelti.includes(s.gruppo || GRUPPO_ALTRI))
        .map(sezioneContributo);
      sottotitolo = null;
      break;
    }
    case "codici-iscrizione-ruolo": {
      const materia = r.filtri.find((f) => f.nome === "materia")?.opzioni?.find((x) => String(x.valore) === o.valori.materia);
      const ricerca = t(o.valori.q);
      sottotitolo = unisci([materia && o.valori.materia !== "0" ? `Materia: ${materia.etichetta}` : "", ricerca ? `Ricerca: "${ricerca}"` : ""]) || null;
      // Una ricerca su tutte le materie dà decine di gruppi: oltre 30 si uniscono in una
      // sola sezione, con la materia davanti a ogni voce (il limite è di 40 sezioni).
      sezioni = sezioniVere.length > 30
        ? [sez("Risultati della ricerca", sezioniVere.flatMap((s) => s.righe.map((riga) => ({ etichetta: `${t(s.titolo)} – ${t(riga[0])}`.slice(0, 300), valore: t(riga[1]) || "-" }))))]
        : sezioniVere.map((s) => sez(t(s.titolo) || null, s.righe.map((riga) => ({ etichetta: t(riga[0]), valore: t(riga[1]) || "-" }))));
      break;
    }
    case "parametri-forensi": {
      // Solo la tabella scelta (l'elenco non si esporta).
      if (!r.sezioni.some((s) => s.blocchi_righe) && !(r.sezioni[0]?.colonne.length > 2)) return null;
      sottotitolo = t(r.sottotitolo) || sottotitolo;
      sezioni = sezioniVere.map((s) => sez(t(r.titolo) || null, righeParametri(s)));
      break;
    }
    case "coefficienti-usufrutto": {
      const saggio = r.introduzione.map((p) => /(\d+,\d+)\s*%/.exec(p)?.[1]).find(Boolean);
      sottotitolo = `Saggio di interesse legale ${saggio ? `${saggio}%` : ""} — anno ${o.valori.anno || ""}`.replace(/\s+/g, " ").trim();
      sezioni = [sez(null, s0.righe.map((riga) => ({
        etichetta: t(riga[0]),
        valore: `Coefficiente ${t(riga[1])} · Usufrutto ${t(riga[2])}% · Nuda proprietà ${t(riga[3])}%`,
      })))];
      break;
    }
    case "categorie-catastali":
      sezioni = sezioniVere.map((s) => sez(t(s.titolo) || null, s.righe.map((riga, i) => {
        const molt = t(s.info?.[i]?.moltiplicatori_testo);
        return { etichetta: t(riga[0]), valore: `${t(riga[1])}${o.moltiplicatori && molt ? ` — ${molt}` : ""}` || "-" };
      })));
      sottotitolo = null;
      break;
    case "danno-biologico-lieve": {
      const eb = r.evidenza.find((e) => /punto base/i.test(e.etichetta));
      const ei = r.evidenza.find((e) => /indennit/i.test(e.etichetta));
      sottotitolo = eb && ei ? `Punto base ${t(eb.valore)} — indennità giornaliera ${t(ei.valore)}` : sottotitolo;
      sezioni = [sez(t(s0.titolo) || null, s0.righe.map((riga) => ({
        etichetta: `Età ${t(riga[0])}`,
        valore: unisci(riga.slice(1).map((c, i) => (t(c) ? `${puntiEtichetta(s0.colonne[i + 1].etichetta)} ${t(c)}` : ""))) || "-",
      })))];
      break;
    }
    case "tabella-unica-macropermanenti":
      sottotitolo = `Tabella ${o.valori.anno || ""} — età ${o.valori.eta || ""}`.replace(/\s+/g, " ").trim();
      sezioni = [sez(null, s0.righe.map((riga) => ({ etichetta: puntiEtichetta(riga[0]), valore: valoreDanno(s0, riga) || "-" })))];
      break;
    case "danno-milano-roma":
      sottotitolo = t(s0.titolo) || sottotitolo;
      sezioni = [sez(null, s0.righe.map((riga) => ({ etichetta: puntiEtichetta(riga[0]), valore: valoreDanno(s0, riga) || "-" })))];
      break;
    case "menomazioni":
      sottotitolo = null;
      sezioni = sezioniVere.map((s) => sez(t(s.titolo) || null, s.righe.map((riga) => {
        const due = s.colonne.length > 2;
        const valore = due
          ? unisci([t(riga[1]) && `d. ${t(riga[1])}`, t(riga[2]) && `n.d. ${t(riga[2])}`])
          : t(riga[1]);
        return { etichetta: t(riga[0]), valore: valore || "-" };
      })));
      break;
    case "spese-condominiali": {
      const g = r.grezzo;
      if (!g) return null;
      const nomeTab = g.tabelle.find((x) => x.id === g.tabella)?.nome || "";
      const nomeCat = g.categoria ? g.categorie.find((x) => x.id === g.categoria)?.nome : "";
      sottotitolo = unisci([nomeTab, nomeCat], " – ") || null;
      const chi = (v: RispostaSpese["sezioni"][number]["voci"][number]) => {
        const p = v.pct_proprietario, i = v.pct_inquilino;
        const lato = (nome: string, pct: number | null) => (pct == null ? "" : pct === 100 ? nome : `${nome} ${pct}%`);
        return unisci([lato("Proprietario", p), lato("Inquilino", i)]);
      };
      sezioni = g.sezioni.map((s) => sez(s.nome, s.voci.map((v) => ({ etichetta: t(v.voce), valore: chi(v) || "-" }))));
      note = [t(g.nota), t(g.legenda)].filter(Boolean).join("\n") || null;
      break;
    }
    default:
      sezioni = sezioniVere.map((s) => sez(t(s.titolo) || null, s.righe.map((riga) => coppiaGenerica(s, riga))));
  }
  if (!sezioni.length) return null;
  return { titolo: base.titolo, sottotitolo, sezioni, note };
}
