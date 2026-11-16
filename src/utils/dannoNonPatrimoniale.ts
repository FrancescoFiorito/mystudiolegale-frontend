// Calcolatore "Danno non Patrimoniale": campi, corpo della richiesta,
// validazione e lettura della risposta. Funzioni pure (nessuna dipendenza da
// React Native), usate dalla configurazione in `calcolatori.tsx`.
import type { CampoGenerico } from "@/app/(app)/calcolatori";
import { parseNumeroIt } from "@/src/utils/formatoItaliano";

type Form = Record<string, any>;

// Tabelle disponibili, con il minimo e il massimo del punto base I.T.T.
// Per Roma il punto base è fisso (minimo = massimo, non personalizzabile).
// `dannoMorale`: solo Roma 2010 e 2009 (sezione "DANNO MORALE"); `maxPunti`:
// Roma 2010 è calcolabile solo fino a 50 punti. La tabella generica non va
// proposta (il backend la rifiuta).
type TabellaDnp = { value: string; label: string; min: number; max: number; roma?: boolean; dannoMorale?: boolean; maxPunti?: number };
export const TABELLE_DNP: TabellaDnp[] = [
  { value: "1-2024", label: "Tribunale di Milano 2024", min: 115, max: 173 },
  { value: "1-2021", label: "Tribunale di Milano 2021", min: 99, max: 149 },
  { value: "1-2018", label: "Tribunale di Milano 2018", min: 98, max: 147 },
  { value: "1-2014", label: "Tribunale di Milano 2014", min: 96, max: 145 },
  { value: "1-2013", label: "Tribunale di Milano 2013", min: 96, max: 144 },
  { value: "1-2011", label: "Tribunale di Milano 2011", min: 91, max: 137 },
  { value: "1-2009", label: "Tribunale di Milano 2009", min: 88, max: 132 },
  { value: "2-2025", label: "Tribunale di Roma 2025", min: 130.25, max: 130.25, roma: true },
  { value: "2-2023", label: "Tribunale di Roma 2023", min: 128.07, max: 128.07, roma: true },
  { value: "2-2019", label: "Tribunale di Roma 2019", min: 110.6, max: 110.6, roma: true },
  { value: "2-2018", label: "Tribunale di Roma 2018", min: 109.4, max: 109.4, roma: true },
  { value: "2-2016", label: "Tribunale di Roma 2016", min: 108.1, max: 108.1, roma: true },
  { value: "2-2014", label: "Tribunale di Roma 2014", min: 107.8, max: 107.8, roma: true },
  { value: "2-2013", label: "Tribunale di Roma 2013", min: 106.4, max: 106.4, roma: true },
  { value: "2-2012", label: "Tribunale di Roma 2012", min: 103.3, max: 103.3, roma: true },
  { value: "2-2011", label: "Tribunale di Roma 2011", min: 100, max: 100, roma: true },
  { value: "2-2010", label: "Tribunale di Roma 2010", min: 72, max: 72, roma: true, dannoMorale: true, maxPunti: 50 },
  { value: "2-2009", label: "Tribunale di Roma 2009", min: 71, max: 71, roma: true, dannoMorale: true },
];

// L'incremento per sofferenza esiste solo per le tabelle più recenti di Milano.
const TABELLE_CON_INCREMENTO = ["1-2024", "1-2021"];

const tabella = (f: Form) => TABELLE_DNP.find((t) => t.value === f.tabella) ?? TABELLE_DNP[0];
export const incrementoVisibile = (f: Form) => TABELLE_CON_INCREMENTO.includes(f.tabella);
export const dannoMoraleVisibile = (f: Form) => !!tabella(f).dannoMorale;
const puntoBaseFisso = (f: Form) => !!tabella(f).roma;
const euroIt = (n: number) => n.toFixed(2).replace(".", ",");
const numeroIt2 = (n: number) => n.toFixed(2).replace(".", ",");

// Righe "giorni parziale / inabilità %": tre coppie con le percentuali di partenza.
const ITP: { n: number; pct: string }[] = [{ n: 1, pct: "75" }, { n: 2, pct: "50" }, { n: 3, pct: "25" }];

export const CAMPI_DANNO_NON_PATRIMONIALE: CampoGenerico[] = [
  { tipo: "scelta", key: "tabella", label: "Tabella", default: "1-2024", opzioni: TABELLE_DNP.map((t) => ({ value: t.value, label: t.label })) },
  { tipo: "titolo", key: "t_permanente", label: "DANNO BIOLOGICO PERMANENTE" },
  { tipo: "numero", key: "punti", label: "Punti riconosciuti", default: "" },
  { tipo: "numero", key: "eta", label: "Età", default: "" },
  { tipo: "bool", key: "incremento_sofferenza", label: "Incremento per sofferenza", default: true, mostraSe: incrementoVisibile },
  { tipo: "titolo", key: "t_temporanea", label: "INVALIDITA' TEMPORANEA" },
  { tipo: "numero", key: "punto_base_itt", label: "Punto Base I.T.T. €", default: numeroIt2(TABELLE_DNP[0].min), nonModificabile: puntoBaseFisso, nota: (f) => (puntoBaseFisso(f) ? "(non personalizzabile)" : `(valore massimo: € ${euroIt(tabella(f).max)})`) },
  { tipo: "numero", key: "giorni_itt", label: "Giorni invalidità totale", default: "0" },
  ...ITP.flatMap<CampoGenerico>(({ n, pct }) => [
    { tipo: "numero", key: `giorni_itp_${n}`, label: "Giorni invalidità parziale", etichettaAcc: `Giorni invalidità parziale (riga ${n})`, default: "0" },
    { tipo: "numero", key: `pct_itp_${n}`, label: "Inabilità %", etichettaAcc: `Inabilità % (riga ${n})`, default: pct },
  ]),
  { tipo: "titolo", key: "t_danno_morale", label: "DANNO MORALE", mostraSe: dannoMoraleVisibile },
  { tipo: "numero", key: "pct_danno_morale", label: "Perc. riconosciuta", default: "33,33", mostraSe: dannoMoraleVisibile },
  { tipo: "scelta", key: "danno_morale_su_temporanea", label: "Calcola danno morale", default: "si", mostraSe: dannoMoraleVisibile, opzioni: [
    { value: "si", label: "su invalidità permanente e temporanea" }, { value: "no", label: "solo su invalidità permanente" },
  ] },
  { tipo: "titolo", key: "t_spese", label: "SPESE DOCUMENTATE" },
  { tipo: "numero", key: "spese_mediche", label: "Spese mediche €", default: "0" },
  { tipo: "numero", key: "altre_spese", label: "Altre spese €", default: "0" },
];

// Al cambio di tabella il punto base I.T.T. torna al minimo della nuova tabella.
export function alCambioDannoNonPatrimoniale(chiave: string, form: Form): Form {
  if (chiave !== "tabella") return form;
  return { ...form, punto_base_itt: numeroIt2(tabella(form).min) };
}

const vuoto = (v: unknown) => v === undefined || v === null || String(v).trim() === "";
const intero = (v: unknown) => /^\d+$/.test(String(v ?? "").trim());

export function validaDannoNonPatrimoniale(f: Form): string | null {
  if (vuoto(f.punti) || !intero(f.punti) || +f.punti < 1 || +f.punti > 100) return "Inserire i punti riconosciuti (numero intero da 1 a 100).";
  if (vuoto(f.eta) || !intero(f.eta) || +f.eta < 1 || +f.eta > 100) return "Inserire l'età (numero intero da 1 a 100).";
  const t = tabella(f);
  if (t.maxPunti && +f.punti > t.maxPunti) return `Con ${t.label} il calcolo è disponibile fino a ${t.maxPunti} punti.`;
  if (t.dannoMorale) {
    const dm = parseNumeroIt(String(f.pct_danno_morale ?? ""));
    if (!vuoto(f.pct_danno_morale) && !(dm >= 0 && dm <= 75)) return "La percentuale del danno morale deve essere da 0 a 75.";
  }
  const pb = parseNumeroIt(String(f.punto_base_itt ?? ""));
  if (!t.roma && !(pb >= t.min && pb <= t.max)) return `Il punto base I.T.T. deve essere compreso tra € ${euroIt(t.min)} e € ${euroIt(t.max)}.`;
  const giorniOk = (v: unknown) => vuoto(v) || (intero(v) && +String(v).trim() <= 999);
  if (!giorniOk(f.giorni_itt)) return "I giorni di invalidità totale devono essere da 0 a 999.";
  for (const { n } of ITP) {
    if (!giorniOk(f[`giorni_itp_${n}`])) return "I giorni di invalidità parziale devono essere da 0 a 999.";
    const p = f[`pct_itp_${n}`];
    if (!vuoto(p)) {
      const pn = parseNumeroIt(String(p));
      if (!(pn >= 1 && pn <= 99)) return "La percentuale di inabilità deve essere da 1 a 99.";
    }
  }
  for (const k of ["spese_mediche", "altre_spese"]) {
    if (!vuoto(f[k]) && (!/^[\d.,]+$/.test(String(f[k]).trim()) || parseNumeroIt(String(f[k])) < 0)) return "Le spese devono essere numeri non negativi.";
  }
  return null;
}

export function corpoDannoNonPatrimoniale(f: Form): Record<string, any> {
  const body: Record<string, any> = {
    tabella: f.tabella,
    punti: parseInt(String(f.punti), 10),
    eta: parseInt(String(f.eta), 10),
    giorni_itt: parseInt(String(f.giorni_itt || "0"), 10),
  };
  // Roma: punto base fisso, si omette (il backend usa quello della tabella).
  if (!puntoBaseFisso(f)) body.punto_base_itt = Math.round(parseNumeroIt(String(f.punto_base_itt ?? "")) * 100) / 100;
  if (incrementoVisibile(f)) body.incremento_sofferenza = !!f.incremento_sofferenza;
  for (const { n, pct } of ITP) {
    body[`giorni_itp_${n}`] = parseInt(String(f[`giorni_itp_${n}`] || "0"), 10);
    // Percentuale lasciata vuota: si usa quella di partenza.
    body[`pct_itp_${n}`] = vuoto(f[`pct_itp_${n}`]) ? Number(pct) : parseNumeroIt(String(f[`pct_itp_${n}`]));
  }
  if (dannoMoraleVisibile(f)) {
    // Percentuale vuota: 33,33 di partenza.
    body.pct_danno_morale = vuoto(f.pct_danno_morale) ? 33.33 : parseNumeroIt(String(f.pct_danno_morale));
    body.danno_morale_su_temporanea = f.danno_morale_su_temporanea !== "no";
  }
  body.spese_mediche = parseNumeroIt(String(f.spese_mediche ?? ""));
  body.altre_spese = parseNumeroIt(String(f.altre_spese ?? ""));
  return body;
}

// La risposta contiene `righe` già nell'ordine e coi testi da mostrare: si
// mostrano tutte, etichetta → valore, senza riformattare.
export function righeDannoNonPatrimoniale(r: any): [string, string][] {
  const righe: any[] = Array.isArray(r?.righe) ? r.righe : [];
  return righe.map((x) => {
    const valore = x?.valore;
    // Solo se manca il testo del valore ma c'è un importo, lo si mostra in euro.
    const v = vuoto(valore) && typeof x?.importo === "number"
      ? `€ ${x.importo.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : String(valore ?? "");
    return [String(x?.etichetta ?? ""), v];
  });
}
