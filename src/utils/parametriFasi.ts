// Parametri 2014 Civile e Parametri Stragiudiziali: campi, validazione, corpo
// della richiesta e righe del risultato. Funzioni pure (nessuna dipendenza da
// React Native), usate dalla configurazione in `calcolatori.tsx`.
import type { CampoGenerico } from "@/app/(app)/calcolatori";
import { formatEuro, parseNumeroIt } from "@/src/utils/formatoItaliano";
import { TABELLE_CIVILI_2014, TABELLE_STRAGIUDIZIALI_2014, type TabellaFasi, type TabelleAnno } from "@/src/utils/tabelleParametri2014";

type Form = Record<string, any>;
type Opz = { value: string; label: string };

const vuoto = (v: unknown) => v === undefined || v === null || String(v).trim() === "";
const num = (v: unknown) => parseNumeroIt(String(v ?? ""));
const intero = (v: unknown) => /^\d+$/.test(String(v ?? "").trim());

export const COMPETENZE_CIVILI_2014: Opz[] = [
  { value: "100", label: "Giudice di pace" }, { value: "110", label: "Giudizi di cognizione innanzi al tribunale" },
  { value: "200", label: "Corte dei Conti" }, { value: "210", label: "Corte d' Appello" }, { value: "220", label: "Corte di Cassazione" },
  { value: "230", label: "Magistrature superiori" }, { value: "240", label: "Corte Costituzionale" }, { value: "250", label: "Corte Europea" },
  { value: "260", label: "Corte di Giustizia UE" }, { value: "320", label: "T.A.R." }, { value: "330", label: "Consiglio di Stato" },
  { value: "335", label: "Consiglio di Stato (appello cautelare)" }, { value: "340", label: "Corte di Giustizia Tributaria di primo grado" },
  { value: "350", label: "Corte di Giustizia Tributaria di secondo grado" }, { value: "370", label: "Arbitrato" },
  { value: "120", label: "Cause di lavoro" }, { value: "130", label: "Cause di previdenza" }, { value: "140", label: "Procedimenti per convalida locatizia" },
  { value: "150", label: "Atto di precetto" }, { value: "160", label: "Volontaria giurisdizione" }, { value: "170", label: "Procedimenti monitori" },
  { value: "180", label: "Procedimenti di istruzione preventiva" }, { value: "190", label: "Procedimenti cautelari" },
  { value: "270", label: "Esecuzioni mobiliari" }, { value: "280", label: "Esecuzioni presso terzi, per consegna e rilascio" },
  { value: "290", label: "Esecuzioni immobiliari" }, { value: "300", label: "Iscrizione ipotecaria / Affari tavolari" },
  { value: "310", label: "Dichiarazione di fallimento" }, { value: "390", label: "Accertamento del passivo" },
];

const ANNI: Opz[] = [{ value: "2022", label: "2022 (vigenti)" }, { value: "2014", label: "2014-2018 (precedenti)" }];
const OLTRE_32M = "130";
const OLTRE_520K = "140";

// Nomi delle fasi per codice (il codice identifica sempre lo stesso nome).
const NOMI_FASI: Record<number, string> = {
  0: "Fase unica", 10: "Studio", 20: "Introduttiva", 30: "Istruttoria / trattazione", 40: "Decisionale", 50: "Istruttoria",
  70: "Cautelare", 72: "Cautelare collegiale", 74: "Cautelare monocratica", 80: "Trattazione / conclusiva", 99: "Compenso",
  110: "Attivazione", 120: "Negoziazione", 130: "Conciliazione",
};

type Ctx = {
  tab: TabelleAnno;
  info: (f: Form) => TabellaFasi | null;
  // Il compenso non è per scaglione (percentuale sul valore): niente importi accanto alle fasi.
  senzaImportiFase: (f: Form) => boolean;
};

const ctxCivile: Ctx = {
  tab: TABELLE_CIVILI_2014,
  info: (f) => TABELLE_CIVILI_2014[f.anno]?.[f.competenza] ?? null,
  senzaImportiFase: (f) => String(f.scaglione) === OLTRE_32M,
};
const ctxStrag: Ctx = {
  tab: TABELLE_STRAGIUDIZIALI_2014,
  info: (f) => TABELLE_STRAGIUDIZIALI_2014[f.anno]?.[f.competenza === "mediazione" ? "380" : "360"] ?? null,
  senzaImportiFase: (f) => f.tipo_compenso === "percentuale" || [OLTRE_32M, OLTRE_520K].includes(String(f.scaglione)),
};

const scaglioniDi = (c: Ctx, f: Form): Opz[] => (c.info(f)?.scaglioni ?? []).map(([v, l]) => ({ value: String(v), label: l }));
const haFase = (c: Ctx, f: Form, cod: number) => !!c.info(f)?.fasi.some(([x]) => x === cod);

function hintFase(c: Ctx, f: Form, cod: number): string | null {
  if (c.senzaImportiFase(f)) return null;
  const info = c.info(f);
  const i = info?.fasi.findIndex(([x]) => x === cod) ?? -1;
  const t = i >= 0 ? info?.val[String(f.scaglione)]?.[i] : null;
  return t ? `Min ${formatEuro(t[0])} · Med ${formatEuro(t[1])} · Max ${formatEuro(t[2])}` : null;
}

// Per ogni fase: casella, scelta min/med/max e importo libero.
function campiFase(c: Ctx, cod: number): CampoGenerico[] {
  const nome = NOMI_FASI[cod];
  const visibile = (f: Form) => haFase(c, f, cod);
  const attiva = (f: Form) => haFase(c, f, cod) && !!f[`f${cod}_on`];
  return [
    { tipo: "titolo", key: `tit_f${cod}`, label: `Fase: ${nome}`, mostraSe: visibile },
    { tipo: "bool", key: `f${cod}_on`, label: "Includi la fase", etichettaAcc: `Includi la fase ${nome}`, default: true, mostraSe: visibile, nota: (f) => hintFase(c, f, cod) },
    { tipo: "scelta", key: `f${cod}_val`, label: "Valore", etichettaAcc: `Valore della fase ${nome}`, default: "", mostraSe: attiva, opzioni: [
      { value: "", label: "Come la scelta generale" }, { value: "min", label: "Minimo" }, { value: "med", label: "Medio" }, { value: "max", label: "Massimo" },
    ] },
    { tipo: "numero", key: `f${cod}_imp`, label: "Compenso personalizzato € (facoltativo)", etichettaAcc: `Compenso personalizzato della fase ${nome}`, default: "", mostraSe: attiva },
  ];
}
const CODICI_FASE_CIVILE = [10, 20, 30, 40, 50, 70, 72, 74, 80, 99, 0];
const CODICI_FASE_STRAG = [99, 110, 120, 130];

// Elenco di percentuali (dal massimo in giù) per le scelte a valori chiusi.
const opzioniPct = (lo: number, hi: number, passo = 1): Opz[] => {
  const out: Opz[] = [];
  for (let p = hi; p >= lo; p -= passo) out.push({ value: String(p), label: `${p}%` });
  return out;
};

// Aumento massimo per pluralità di parti: +30% per ciascuna dalla seconda alla decima, poi +10% fino alla trentesima.
const pctMaxParti = (n: number) => (n <= 1 ? 0 : 30 * (Math.min(n, 10) - 1) + 10 * Math.max(n - 10, 0));
const nParti = (f: Form) => Math.min(30, Math.max(1, Math.round(num(f.numero_parti_stessa_posizione) || 1)));
const opzioniPctParti = (f: Form): Opz[] => {
  const mx = pctMaxParti(nParti(f));
  const out: Opz[] = [{ value: "", label: `${mx}% (massimo)` }];
  for (let p = mx - (mx > 270 ? 5 : 10); p >= 0; p -= p > 270 ? 5 : 10) out.push({ value: String(p), label: `${p}%` });
  return out;
};

// ---------------------------------------------------------------------------
// Parametri 2014 Civile
// ---------------------------------------------------------------------------

const ANTE_COMP = (f: Form) => ["320", "330", "335"].includes(String(f.competenza));
const DISP = {
  motivi: (f: Form) => ANTE_COMP(f),
  ricorsoInc: (f: Form) => ANTE_COMP(f) && f.anno === "2022",
  memoria: (f: Form) => f.competenza === "220" && f.anno === "2022",
};
// Fase su cui si calcola l'aumento: se la competenza non l'ha, serve l'importo.
const FASE_COLLEGATA: Record<string, number> = { conciliazione: 40, motivi_aggiunti: 20, ricorso_incidentale: 20, memoria_378: 40 };

export const CAMPI_PARAMETRI_CIVILI_2014: CampoGenerico[] = [
  { tipo: "scelta", key: "anno", label: "Tabelle", default: "2022", opzioni: ANNI },
  { tipo: "scelta", key: "competenza", label: "Competenza", default: "110", cercabile: true, opzioni: (f) => COMPETENZE_CIVILI_2014.filter((c) => !!TABELLE_CIVILI_2014[f.anno]?.[c.value]) },
  { tipo: "scelta", key: "scaglione", label: "Scaglione", default: "10", opzioni: (f) => scaglioniDi(ctxCivile, f) },
  { tipo: "numero", key: "valore_causa", label: "Valore €", default: "", mostraSe: (f) => String(f.scaglione) === OLTRE_32M, nota: () => "(da 32.000.001 a 999.999.999)" },
  { tipo: "scelta", key: "valore", label: "Compenso di tutte le fasi", default: "med", opzioni: [
    { value: "min", label: "Minimo" }, { value: "med", label: "Medio" }, { value: "max", label: "Massimo" },
  ] },
  ...CODICI_FASE_CIVILE.flatMap((cod) => campiFase(ctxCivile, cod)),
  { tipo: "titolo", key: "tit_aum", label: "Aumenti" },
  { tipo: "numero", key: "numero_parti_stessa_posizione", label: "Numero parti", default: "1", nota: () => "Più parti con la stessa posizione (art. 4, comma 2)" },
  { tipo: "scelta", key: "pct_parti", label: "Aumento per più parti", default: "", mostraSe: (f) => nParti(f) > 1, opzioni: opzioniPctParti },
  { tipo: "bool", key: "conciliazione", label: "Conciliazione (art. 4, comma 6)", default: false },
  { tipo: "scelta", key: "pct_conciliazione", label: "Conciliazione: aumento del", default: "25", mostraSe: (f) => !!f.conciliazione, opzioni: opzioniPct(1, 25) },
  { tipo: "numero", key: "imp_conciliazione", label: "Conciliazione: calcolato su €", default: "", mostraSe: (f) => !!f.conciliazione, nota: (f) => (f.anno === "2022" ? "(fase decisionale)" : null) },
  { tipo: "bool", key: "class_action", label: "Class action", default: false },
  { tipo: "scelta", key: "pct_class_action", label: "Class action: aumento del", default: "300", mostraSe: (f) => !!f.class_action, opzioni: opzioniPct(10, 300, 10) },
  { tipo: "bool", key: "fondatezza", label: "Manifesta fondatezza", default: false },
  { tipo: "scelta", key: "pct_fondatezza", label: "Manifesta fondatezza: aumento del", default: "33", mostraSe: (f) => !!f.fondatezza, opzioni: opzioniPct(1, 33) },
  { tipo: "bool", key: "importanza", label: "Ulteriore valutazione (art. 4, comma 1)", default: false },
  { tipo: "numero", key: "pct_importanza", label: "Ulteriore valutazione: aumento del %", default: "", mostraSe: (f) => !!f.importanza },
  { tipo: "bool", key: "predisposizioni_pct", label: "Predisposizioni x Pct", default: false },
  { tipo: "scelta", key: "pct_predisposizioni_pct", label: "Predisposizioni x Pct: aumento del", default: "30", mostraSe: (f) => !!f.predisposizioni_pct, opzioni: opzioniPct(1, 30) },
  { tipo: "bool", key: "motivi_aggiunti", label: "Motivi aggiunti", default: false, mostraSe: DISP.motivi },
  { tipo: "scelta", key: "pct_motivi_aggiunti", label: "Motivi aggiunti: aumento del", default: "50", mostraSe: (f) => DISP.motivi(f) && !!f.motivi_aggiunti, opzioni: opzioniPct(1, 50) },
  { tipo: "numero", key: "imp_motivi_aggiunti", label: "Motivi aggiunti: calcolato su €", default: "", mostraSe: (f) => DISP.motivi(f) && !!f.motivi_aggiunti, nota: () => "(fase introduttiva)" },
  { tipo: "bool", key: "ricorso_incidentale", label: "Ricorso incidentale", default: false, mostraSe: DISP.ricorsoInc },
  { tipo: "scelta", key: "pct_ricorso_incidentale", label: "Ricorso incidentale: aumento del", default: "20", mostraSe: (f) => DISP.ricorsoInc(f) && !!f.ricorso_incidentale, opzioni: opzioniPct(1, 20) },
  { tipo: "numero", key: "imp_ricorso_incidentale", label: "Ricorso incidentale: calcolato su €", default: "", mostraSe: (f) => DISP.ricorsoInc(f) && !!f.ricorso_incidentale, nota: () => "(fase introduttiva)" },
  { tipo: "bool", key: "memoria_378", label: "Memoria 378 c.p.c.", default: false, mostraSe: DISP.memoria },
  { tipo: "scelta", key: "pct_memoria_378", label: "Memoria 378 c.p.c.: aumento del", default: "50", mostraSe: (f) => DISP.memoria(f) && !!f.memoria_378, opzioni: opzioniPct(1, 50) },
  { tipo: "numero", key: "imp_memoria_378", label: "Memoria 378 c.p.c.: calcolato su €", default: "", mostraSe: (f) => DISP.memoria(f) && !!f.memoria_378, nota: () => "(fase decisionale)" },
  { tipo: "titolo", key: "tit_rid", label: "Riduzioni" },
  { tipo: "bool", key: "assenza_questioni", label: "Assenza questioni di fatto e diritto", default: false },
  { tipo: "scelta", key: "pct_assenza_questioni", label: "Assenza questioni di fatto e diritto: riduzione del", default: "30", mostraSe: (f) => !!f.assenza_questioni, opzioni: opzioniPct(1, 30) },
  { tipo: "bool", key: "condotte_ostative", label: "Condotte ostative", default: false },
  { tipo: "scelta", key: "pct_condotte_ostative", label: "Condotte ostative: riduzione del", default: "50", mostraSe: (f) => !!f.condotte_ostative, opzioni: opzioniPct(1, 50) },
  { tipo: "bool", key: "responsabilita_96", label: "Resp. art. 96 cpc e pronunce in rito: riduzione del 50% (art. 4, comma 9)", default: false, mostraSe: (f) => f.anno === "2014" },
  { tipo: "bool", key: "responsabilita_96_proc", label: "Resp. art. 96 cpc: riduzione del 75% (art. 4, comma 9)", default: false, mostraSe: (f) => f.anno === "2022" },
  { tipo: "bool", key: "pronunce_rito", label: "Pronunce in rito: riduzione del 50% (art. 4, comma 9)", default: false, mostraSe: (f) => f.anno === "2022" },
  { tipo: "bool", key: "gratuito_patrocinio", label: "Gratuito patrocinio: riduzione del 50% (art. 130 Dpr 115/02)", default: false },
  { tipo: "bool", key: "praticante", label: "Praticante abilitato (art. 9)", default: false },
  { tipo: "scelta", key: "pct_praticante", label: "Praticante abilitato: riduzione del", default: "50", mostraSe: (f) => !!f.praticante, opzioni: opzioniPct(5, 50, 5) },
  ...campiSpeseEAccessori("Spese di trasferta € (artt. 11 e 27)"),
];

// Sezioni "Spese" e accessori, uguali nei due calcolatori (cambia solo l'articolo della trasferta).
function campiSpeseEAccessori(etichettaTrasferta: string): CampoGenerico[] {
  return [
    { tipo: "titolo", key: "tit_spese", label: "Spese" },
    { tipo: "numero", key: "spese_esenti", label: "Spese esenti € (art. 15, DPR 633/72)", default: "" },
    { tipo: "numero", key: "spese_trasferta", label: etichettaTrasferta, default: "" },
    { tipo: "numero", key: "spese_imponibili", label: "Altre spese imponibili € (non relative a trasferte)", default: "" },
    { tipo: "bool", key: "spese_generali", label: "Spese generali (art. 2)", default: true },
    { tipo: "numero", key: "pct_spese_generali", label: "Spese generali %", default: "15", mostraSe: (f) => !!f.spese_generali },
    { tipo: "titolo", key: "tit_acc", label: "Accessori" },
    { tipo: "bool", key: "accessori", label: "Includi accessori", default: false },
    { tipo: "bool", key: "iva", label: "IVA", default: false },
    { tipo: "bool", key: "cassa", label: "CPA", default: false },
    { tipo: "bool", key: "ritenuta", label: "Rit. acc.", default: false },
  ];
}

// "Includi accessori" spunta o toglie insieme IVA e CPA.
function alCambioAccessori(chiave: string, f: Form): Form {
  return chiave === "accessori" ? { ...f, iva: !!f.accessori, cassa: !!f.accessori } : f;
}

// Cambio di tabelle o competenza: competenza e scaglione tornano a valori validi.
function alCambioTabella(c: Ctx, predefinita: string) {
  return (chiave: string, f: Form): Form => {
    let out = alCambioAccessori(chiave, f);
    if (chiave === "anno" && c === ctxCivile && !c.tab[out.anno]?.[out.competenza]) out = { ...out, competenza: predefinita };
    if (chiave === "anno" || chiave === "competenza" || chiave === "tipo_compenso") {
      const sc = scaglioniDi(c, out);
      if (!sc.some((o) => o.value === String(out.scaglione))) out = { ...out, scaglione: sc[0]?.value ?? "" };
    }
    return out;
  };
}
export const alCambioParametriCivili2014 = alCambioTabella(ctxCivile, "110");

function bodyFasi(c: Ctx, codici: number[], f: Form) {
  return codici.filter((cod) => haFase(c, f, cod)).map((cod) => ({
    cod, attiva: !!f[`f${cod}_on`],
    valore: f[`f${cod}_val`] || null,
    importo: !vuoto(f[`f${cod}_imp`]) ? num(f[`f${cod}_imp`]) : null,
  }));
}

function validaComune(c: Ctx, codici: number[], f: Form): string | null {
  if (!c.info(f)) return "Competenza non prevista per le tabelle selezionate.";
  if (!bodyFasi(c, codici, f).some((x) => x.attiva)) return "Selezionare almeno una fase.";
  for (const cod of codici) {
    if (haFase(c, f, cod) && f[`f${cod}_on`] && !vuoto(f[`f${cod}_imp`]) && !(num(f[`f${cod}_imp`]) >= 0)) return "Il compenso personalizzato deve essere un importo non negativo.";
  }
  if (f.importanza && !(intero(f.pct_importanza) && +String(f.pct_importanza).trim() >= 1)) return "Indicare la percentuale di aumento per ulteriore valutazione (numero intero, almeno 1).";
  if (f.spese_generali) {
    const p = num(f.pct_spese_generali);
    if (!(p > 0 && p <= 20)) return "La percentuale delle spese generali deve essere maggiore di 0 e al massimo 20.";
  }
  for (const k of ["spese_esenti", "spese_trasferta", "spese_imponibili"]) {
    if (!vuoto(f[k]) && (!/^[\d.,]+$/.test(String(f[k]).trim()) || num(f[k]) < 0)) return "Le spese devono essere numeri non negativi.";
  }
  return null;
}

const ACCESSORI = (f: Form) => ({ cassa: !!f.cassa, iva: !!f.iva, ritenuta: !!f.ritenuta });
const SPESE = (f: Form) => ({
  spese_esenti: num(f.spese_esenti) || 0, spese_trasferta: num(f.spese_trasferta) || 0, spese_imponibili: num(f.spese_imponibili) || 0,
  spese_generali: !!f.spese_generali, pct_spese_generali: f.spese_generali ? num(f.pct_spese_generali) : 15,
});

export function validaParametriCivili2014(f: Form): string | null {
  const e = validaComune(ctxCivile, CODICI_FASE_CIVILE, f);
  if (e) return e;
  if (!ctxCivile.info(f)?.scaglioni.some(([c]) => String(c) === String(f.scaglione))) return "Scaglione non previsto per la competenza selezionata.";
  if (String(f.scaglione) === OLTRE_32M) {
    const v = num(f.valore_causa);
    if (!(v > 32_000_000 && v <= 999_999_999)) return "Per lo scaglione «Oltre € 32.000.000» indicare un valore da 32.000.001 a 999.999.999.";
  }
  const n = num(f.numero_parti_stessa_posizione) || 1;
  if (!Number.isInteger(n) || n < 1 || n > 30) return "Il numero di parti deve essere un intero da 1 a 30.";
  const richiedeImporto: [string, boolean][] = [
    ["conciliazione", true], ["motivi_aggiunti", DISP.motivi(f)], ["ricorso_incidentale", DISP.ricorsoInc(f)], ["memoria_378", DISP.memoria(f)],
  ];
  for (const [nome, disponibile] of richiedeImporto) {
    if (!disponibile || !f[nome]) continue;
    if (!haFase(ctxCivile, f, FASE_COLLEGATA[nome]) && vuoto(f[`imp_${nome}`])) return "Per la competenza scelta manca la fase su cui calcolare l'aumento: indicare l'importo («calcolato su €»).";
  }
  return null;
}

export function corpoParametriCivili2014(f: Form): Record<string, any> {
  const n = nParti(f);
  const body: Record<string, any> = {
    anno: f.anno, competenza: f.competenza, scaglione: String(f.scaglione), valore: f.valore,
    fasi: bodyFasi(ctxCivile, CODICI_FASE_CIVILE, f),
    numero_parti_stessa_posizione: n,
    gratuito_patrocinio: !!f.gratuito_patrocinio,
    responsabilita_96: f.anno === "2014" && !!f.responsabilita_96,
    responsabilita_96_proc: f.anno === "2022" && !!f.responsabilita_96_proc,
    pronunce_rito: f.anno === "2022" && !!f.pronunce_rito,
    ...SPESE(f), ...ACCESSORI(f),
  };
  if (String(f.scaglione) === OLTRE_32M) body.valore_causa = num(f.valore_causa);
  if (n > 1 && !vuoto(f.pct_parti)) body.pct_parti = num(f.pct_parti);
  // Aumenti e riduzioni: si inviano solo se spuntati e disponibili.
  const conPct = (nome: string, disponibile = true, conImporto = false) => {
    body[nome] = disponibile && !!f[nome];
    if (!body[nome]) return;
    body[`pct_${nome}`] = num(f[`pct_${nome}`]);
    if (conImporto && !vuoto(f[`imp_${nome}`])) body[`imp_${nome}`] = num(f[`imp_${nome}`]);
  };
  conPct("conciliazione", true, true);
  conPct("class_action");
  conPct("fondatezza");
  conPct("importanza");
  conPct("predisposizioni_pct");
  conPct("motivi_aggiunti", DISP.motivi(f), true);
  conPct("ricorso_incidentale", DISP.ricorsoInc(f), true);
  conPct("memoria_378", DISP.memoria(f), true);
  conPct("assenza_questioni");
  conPct("condotte_ostative");
  conPct("praticante");
  return body;
}

// ---------------------------------------------------------------------------
// Parametri Stragiudiziali
// ---------------------------------------------------------------------------

const assistenza = (f: Form) => f.competenza !== "mediazione";
const inPercentuale = (f: Form) => assistenza(f) && f.tipo_compenso === "percentuale";
const scagStrag = (f: Form) => String(f.scaglione);

export const CAMPI_PARAMETRI_STRAGIUDIZIALI: CampoGenerico[] = [
  { tipo: "scelta", key: "anno", label: "Tabelle", default: "2022", opzioni: ANNI },
  { tipo: "scelta", key: "competenza", label: "Competenza", default: "assistenza", opzioni: [
    { value: "assistenza", label: "Assistenza stragiudiziale" }, { value: "mediazione", label: "Mediazione e Negoziazione assistita" },
  ] },
  { tipo: "scelta", key: "tipo_compenso", label: "Compenso", default: "tabellare", mostraSe: assistenza, opzioni: [
    { value: "tabellare", label: "Tabellare" }, { value: "percentuale", label: "In Percentuale" },
  ] },
  { tipo: "scelta", key: "scaglione", label: "Scaglione", default: "10", mostraSe: (f) => !inPercentuale(f), opzioni: (f) => scaglioniDi(ctxStrag, f) },
  { tipo: "numero", key: "valore_causa", label: "Valore €", default: "", mostraSe: (f) => inPercentuale(f) || [OLTRE_32M, OLTRE_520K].includes(scagStrag(f)) },
  { tipo: "scelta", key: "metodo_calcolo", label: "Metodo di calcolo", default: "secca", mostraSe: (f) => !inPercentuale(f) && scagStrag(f) === OLTRE_520K, opzioni: [
    { value: "secca", label: "percentuale 'secca'" }, { value: "scaglioni", label: "a scaglioni" },
  ] },
  { tipo: "numero", key: "pct_compenso", label: "Percentuale % (sul valore dell'affare)", default: "", mostraSe: inPercentuale, nota: () => "(da più di 0 a 5)" },
  { tipo: "scelta", key: "valore", label: "Compenso di tutte le fasi", default: "med", opzioni: [
    { value: "min", label: "Minimo" }, { value: "med", label: "Medio" }, { value: "max", label: "Massimo" },
  ] },
  ...CODICI_FASE_STRAG.flatMap((cod) => campiFase(ctxStrag, cod)),
  { tipo: "titolo", key: "tit_aum", label: "Aumenti" },
  { tipo: "bool", key: "esito_positivo", label: "Esito positivo: aumento del 30% (art. 20, comma 1 bis)", default: false, mostraSe: (f) => f.competenza === "mediazione" && f.anno === "2022" },
  { tipo: "numero", key: "imp_esito_positivo", label: "Esito positivo: calcolato su € (attiv. + negoz.)", default: "", mostraSe: (f) => f.competenza === "mediazione" && f.anno === "2022" && !!f.esito_positivo },
  { tipo: "bool", key: "importanza", label: "Ulteriore valutazione (art. 19, comma 1)", default: false },
  { tipo: "numero", key: "pct_importanza", label: "Ulteriore valutazione: aumento del %", default: "", mostraSe: (f) => !!f.importanza },
  { tipo: "titolo", key: "tit_rid", label: "Riduzioni" },
  { tipo: "bool", key: "praticante", label: "Praticante abilitato (art. 24)", default: false },
  { tipo: "numero", key: "pct_praticante", label: "Praticante abilitato: riduzione del %", default: "50", mostraSe: (f) => !!f.praticante },
  ...campiSpeseEAccessori("Spese di trasferta € (art. 27)"),
];

export const alCambioParametriStragiudiziali = alCambioTabella(ctxStrag, "");

export function validaParametriStragiudiziali(f: Form): string | null {
  const e = validaComune(ctxStrag, CODICI_FASE_STRAG, f);
  if (e) return e;
  const v = num(f.valore_causa);
  if (inPercentuale(f)) {
    if (!(v > 0 && v <= 999_999_999)) return "Indicare il valore dell'affare (maggiore di 0 e fino a 999.999.999).";
    const p = num(f.pct_compenso);
    if (!(p > 0 && p <= 5)) return "La percentuale del compenso deve essere maggiore di 0 e al massimo 5.";
  } else {
    if (!ctxStrag.info(f)?.scaglioni.some(([c]) => String(c) === scagStrag(f))) return "Scaglione non previsto per la competenza selezionata.";
    if (scagStrag(f) === OLTRE_32M && !(v > 32_000_000 && v <= 999_999_999)) return "Per lo scaglione «Oltre € 32.000.000» indicare un valore da 32.000.001 a 999.999.999.";
    if (scagStrag(f) === OLTRE_520K && !(v > 520_000 && v <= 999_999_999)) return "Per lo scaglione «Oltre € 520.000» indicare un valore superiore a 520.000 e fino a 999.999.999.";
  }
  if (f.praticante) {
    const p = num(f.pct_praticante);
    if (!(Number.isInteger(p) && p >= 1 && p <= 50)) return "La riduzione per il praticante abilitato deve essere un intero da 1 a 50.";
  }
  return null;
}

export function corpoParametriStragiudiziali(f: Form): Record<string, any> {
  const perc = inPercentuale(f);
  const body: Record<string, any> = {
    anno: f.anno, competenza: f.competenza, tipo_compenso: assistenza(f) ? f.tipo_compenso : "tabellare", valore: f.valore,
    fasi: bodyFasi(ctxStrag, CODICI_FASE_STRAG, f),
    ...SPESE(f), ...ACCESSORI(f),
  };
  if (perc) {
    body.valore_causa = num(f.valore_causa);
    body.pct_compenso = num(f.pct_compenso);
  } else {
    body.scaglione = scagStrag(f);
    if ([OLTRE_32M, OLTRE_520K].includes(scagStrag(f))) body.valore_causa = num(f.valore_causa);
    if (scagStrag(f) === OLTRE_520K) body.metodo_calcolo = f.metodo_calcolo;
  }
  const esito = f.competenza === "mediazione" && f.anno === "2022" && !!f.esito_positivo;
  body.esito_positivo = esito;
  if (esito && !vuoto(f.imp_esito_positivo)) body.imp_esito_positivo = num(f.imp_esito_positivo);
  body.importanza = !!f.importanza;
  if (f.importanza) body.pct_importanza = num(f.pct_importanza);
  body.praticante = !!f.praticante;
  if (f.praticante) body.pct_praticante = num(f.pct_praticante);
  return body;
}

// ---------------------------------------------------------------------------
// Righe del risultato (stesso ordine del prospetto del sito di riferimento)
// ---------------------------------------------------------------------------

const TIPO_VALORE: Record<string, string> = { min: "valore minimo", med: "valore medio", max: "valore massimo", pers: "valore personalizzato" };
const pctIt = (p: unknown) => String(p).replace(".", ",");

export function righeParametriCompenso(r: any): [string, string][] {
  const out: [string, string][] = [];
  if (r.competenza_nome) out.push(["Competenza", String(r.competenza_nome)]);
  if (r.valore_causa_etichetta) out.push(["Valore della causa", String(r.valore_causa_etichetta)]);
  if (r.valore_affare_etichetta) out.push(["Valore dell'affare", String(r.valore_affare_etichetta)]);
  if (r.compenso_pct_etichetta != null) out.push([`Compenso (${pctIt(r.pct_compenso_etichetta ?? "")}% sul valore dell'affare)`, formatEuro(r.compenso_pct_etichetta)]);
  for (const s of Array.isArray(r.scaglioni_calcolo) ? r.scaglioni_calcolo : []) {
    out.push([`Da ${formatEuro(s.da)} a ${formatEuro(s.a)}, ${pctIt(s.pct)}%`, formatEuro(s.importo)]);
  }
  for (const x of Array.isArray(r.fasi_dettaglio) ? r.fasi_dettaglio : []) {
    if (x.inclusa) out.push([`Fase ${x.nome}, ${TIPO_VALORE[x.tipo] ?? "valore"}`, formatEuro(x.importo)]);
  }
  out.push([r.etichetta_tabellare ? `Compenso tabellare (${r.etichetta_tabellare})` : "Compenso tabellare", formatEuro(r.compenso_tabellare_fasi)]);
  const aumenti: any[] = Array.isArray(r.aumenti) ? r.aumenti : [];
  for (const a of aumenti) {
    const et = a.modalita === "somma"
      ? `Aumento di ${formatEuro(a.base)} + ${pctIt(a.pct)}% per conciliazione giudiziale o transazione della controversia (art. 4, comma 6)`
      : `${a.descrizione} (${pctIt(a.pct)}%)`;
    out.push([et, formatEuro(a.importo)]);
    if (a.codice === "importanza") out.push(["Compenso tabellare con aumenti ex art. 4, comma 1", formatEuro(r.compenso_tabellare)]);
  }
  if (aumenti.length) out.push(["Compenso maggiorato comprensivo degli aumenti", formatEuro(r.compenso_maggiorato)]);
  const riduzioni: any[] = Array.isArray(r.riduzioni) ? r.riduzioni : [];
  for (const x of riduzioni) out.push([`${x.descrizione}${x.pct != null ? ` (${pctIt(x.pct)}% su ${formatEuro(x.base)})` : ""}`, formatEuro(x.importo)]);
  if (riduzioni.length) out.push(["Compenso al netto delle riduzioni", formatEuro(r.compenso_totale)]);
  out.push([r.tipo_compenso === "percentuale" ? "Compenso" : "Compenso tabellare", formatEuro(r.compenso_tabellare)]);
  if (r.variazioni_aumento) out.push(["Totale variazioni in aumento", formatEuro(r.variazioni_aumento)]);
  if (r.variazioni_diminuzione) out.push(["Totale variazioni in diminuzione", formatEuro(r.variazioni_diminuzione)]);
  out.push(["Compenso totale", formatEuro(r.compenso_totale)]);
  if (r.spese_generali) out.push(["Spese generali (sul compenso totale)", formatEuro(r.spese_generali)]);
  if (r.spese_trasferta) out.push(["Spese di trasferta", formatEuro(r.spese_trasferta)]);
  if (r.spese_imponibili) out.push(["Altre spese imponibili non relative a trasferte", formatEuro(r.spese_imponibili)]);
  if (r.cassa) out.push(["Cassa Avvocati (4%)", formatEuro(r.cassa)]);
  if (r.cassa || r.iva) out.push(["Totale imponibile", formatEuro(r.totale_imponibile)]);
  if (r.iva) out.push(["IVA 22% su imponibile", formatEuro(r.iva)]);
  if (r.spese_esenti) out.push(["Spese esenti ex art. 15, DPR 633/72", formatEuro(r.spese_esenti)]);
  out.push(["IPOTESI DI COMPENSO LIQUIDABILE", formatEuro(r.totale)]);
  if (r.ritenuta) {
    out.push(["A dedurre ritenuta d'acconto 20% (su compenso e spese imponibili)", formatEuro(r.ritenuta)]);
    out.push(["Totale documento", formatEuro(r.totale_documento)]);
  }
  return out;
}
