// Motore della "Calcolatrice Online": porta fedele, passo per passo, della
// calcolatrice del sito di riferimento (versione 1.02), senza precedenza tra
// le operazioni (ogni operatore esegue subito la precedente, come una
// calcolatrice da scrivania). Funzioni pure: ogni tasto riceve lo stato e ne
// restituisce uno nuovo. Il display è sempre una stringa con la virgola come
// separatore decimale e, se attivo, il punto come separatore delle migliaia.

export type OperatoreCalc = "+" | "-" | "*" | "/" | "s" | "p" | "d" | "m" | "i" | "=" | "";

export type ImpostazioniCalc = {
  pctIva: number;
  cifreDecimali: number;
  raggruppa: boolean;
};

export type StatoCalc = {
  display: string;
  accum: number;
  nuovoNumero: boolean;
  operazione: OperatoreCalc;
  memoria: number;
  incollato: boolean;
  impostazioni: ImpostazioniCalc;
};

export const IMPOSTAZIONI_PREDEFINITE: ImpostazioniCalc = { pctIva: 22, cifreDecimali: 2, raggruppa: false };

// Il sito accetta fino a 15 caratteri digitati (DisplaySize) e 64 nel campo.
const LUNGHEZZA_DISPLAY = 15;
const LUNGHEZZA_MAX_INCOLLA = 64;
const PRECISIONE_MAX = 20;
const SEP_DEC = ",";
const SEP_MIGLIAIA = ".";

export function statoIniziale(impostazioni: ImpostazioniCalc = IMPOSTAZIONI_PREDEFINITE): StatoCalc {
  return { display: "0", accum: 0, nuovoNumero: false, operazione: "", memoria: 0, incollato: false, impostazioni: { ...impostazioni } };
}

// ---- Funzioni numeriche (identiche a quelle del sito) ----

function parteDecimale(a: any): string {
  const p = String(a).split(".");
  return p[1] === undefined ? "" : p[1];
}

function parseFloat2(a: any): number {
  let s = a + "";
  s = s.replace(SEP_DEC, ".");
  return parseFloat(s);
}

function addDecimal(a: number, b: number): number {
  let c = parteDecimale(a).length;
  const d = parteDecimale(b).length;
  c = c > d ? c : d;
  return parseFloat((a + b).toFixed(c > PRECISIONE_MAX ? PRECISIONE_MAX : c));
}
function subDecimal(a: number, b: number): number {
  let c = parteDecimale(a).length;
  const d = parteDecimale(b).length;
  c = c > d ? c : d;
  return parseFloat((a - b).toFixed(c > PRECISIONE_MAX ? PRECISIONE_MAX : c));
}
function mulDecimal(a: number, b: number): number {
  let c = parteDecimale(a).length;
  const d = parteDecimale(b).length;
  c += d;
  return parseFloat((a * b).toFixed(c > PRECISIONE_MAX ? PRECISIONE_MAX : c));
}
function divDecimal(a: number, b: number): number {
  return parseFloat((b ? a / b : 0).toFixed(PRECISIONE_MAX));
}
const calcAdd = (a: any, b: any) => addDecimal(parseFloat2(a), parseFloat2(b));
const calcSub = (a: any, b: any) => subDecimal(parseFloat2(a), parseFloat2(b));
const calcMul = (a: any, b: any) => mulDecimal(parseFloat2(a), parseFloat2(b));
const calcDiv = (a: any, b: any) => divDecimal(parseFloat2(a), parseFloat2(b));

function roundTo(a: number, b: number): number {
  let c = a * Math.pow(10, b);
  c = Math.round(c);
  return c / Math.pow(10, b);
}
function iMod(a: number, b: number): number {
  return b ? roundTo(a, 0) % roundTo(b, 0) : 0;
}
function iDiv(a: number, b: number): number {
  return b ? (a - (a % b)) / b : 0;
}

// ---- Display ----

function numberFormat(a: string, raggruppa: boolean): string {
  if (!raggruppa) return a;
  const x = a.toString().split(SEP_DEC);
  let x1 = x[0];
  const x2 = x.length > 1 ? SEP_DEC + x[1] : "";
  const re = /(\d+)(\d{3})/;
  while (re.test(x1)) x1 = x1.replace(re, "$1" + SEP_MIGLIAIA + "$2");
  return x1 + x2;
}

// Valore del display senza i separatori delle migliaia (tutti i punti).
export function leggiDisplay(s: StatoCalc): string {
  return s.display.replace(/[.]/g, "");
}

function scriviDisplay(s: StatoCalc, v: any): StatoCalc {
  let a = (v + "").replace(".", SEP_DEC);
  a = numberFormat(a, s.impostazioni.raggruppa);
  return { ...s, display: a };
}

function riformattaDisplay(s: StatoCalc): StatoCalc {
  let a = leggiDisplay(s);
  a = a.replace(".", SEP_DEC);
  a = numberFormat(a, s.impostazioni.raggruppa);
  return { ...s, display: a };
}

// ---- Tasti ----

export function cifra(s: StatoCalc, n: number | string): StatoCalc {
  if (s.nuovoNumero) {
    return { ...scriviDisplay(s, n), nuovoNumero: false };
  }
  const b = leggiDisplay(s);
  if (b === "0") return scriviDisplay(s, n);
  if (b.length < LUNGHEZZA_DISPLAY) return scriviDisplay(s, b + n);
  return s;
}

export function virgola(s: StatoCalc): StatoCalc {
  let a = leggiDisplay(s);
  if (a.indexOf(SEP_DEC) === -1 || s.nuovoNumero) {
    let n = s.nuovoNumero;
    if (s.nuovoNumero) {
      a = "0" + SEP_DEC;
      n = false;
    } else if (a.indexOf(SEP_DEC) === -1) {
      a += SEP_DEC;
    }
    return riformattaDisplay({ ...s, display: a, nuovoNumero: n });
  }
  return s;
}

function incollaValore(s: StatoCalc, v: any): StatoCalc {
  return cifra({ ...s, nuovoNumero: true }, v);
}

// Da chiamare all'inizio di ogni operazione: normalizza un valore incollato e
// non lascia il display vuoto.
function controllaIncollato(s: StatoCalc): StatoCalc {
  let r = s;
  if (r.incollato) {
    r = incollaValore({ ...r, incollato: false }, leggiDisplay(r));
  }
  if (leggiDisplay(r) === "") r = scriviDisplay(r, "0");
  return r;
}

// Testo incollato sul display. Il sito accetta qualunque testo (un testo non numerico
// diventa "NaN"): qui sono accettati solo numeri (cifre, punto, virgola, segno,
// eventuale esponente) e il resto è ignorato; i numeri sono trattati come nel sito
// ("12.5" è letto come 125, il punto è il separatore delle migliaia).
export function incolla(s: StatoCalc, testo: string): StatoCalc {
  const pulito = (testo || "").trim().slice(0, LUNGHEZZA_MAX_INCOLLA);
  if (!/^[-+]?[0-9.,]*([eE][-+]?[0-9]+)?$/.test(pulito) || !/[0-9]/.test(pulito)) return s;
  return { ...s, display: pulito, incollato: true };
}

export function operazione(s0: StatoCalc, op: Exclude<OperatoreCalc, "">): StatoCalc {
  let s = controllaIncollato(s0);
  const b = leggiDisplay(s);
  if (s.nuovoNumero && s.operazione !== "=") {
    return { ...s, operazione: op };
  }
  s = { ...s, nuovoNumero: true };
  let accum = s.accum;
  switch (s.operazione) {
    case "+": accum = calcAdd(accum, b); break;
    case "-": accum = calcSub(accum, b); break;
    case "/": accum = calcDiv(accum, b); break;
    case "*": accum = calcMul(accum, b); break;
    case "s": {
      let c = calcMul(b, accum);
      c = calcDiv(c, "100.0");
      accum = calcSub(accum, c);
      break;
    }
    case "p": {
      const c = calcDiv(accum, b);
      accum = calcMul(c, "100,0");
      break;
    }
    case "d": {
      let c = calcSub(accum, b);
      c = calcDiv(c, b);
      accum = calcMul(c, "100,0");
      break;
    }
    case "m": accum = iMod(accum, parseFloat2(b)); break;
    case "i": accum = iDiv(accum, parseFloat2(b)); break;
    default: accum = parseFloat2(b);
  }
  return { ...scriviDisplay({ ...s, accum }, accum), operazione: op };
}

export function cambiaSegno(s0: StatoCalc): StatoCalc {
  const s = controllaIncollato(s0);
  return { ...scriviDisplay(s, calcMul(leggiDisplay(s), -1)), nuovoNumero: false };
}

export function percentuale(s0: StatoCalc): StatoCalc {
  const s = controllaIncollato(s0);
  const a = calcMul(leggiDisplay(s), s.accum);
  return { ...scriviDisplay(s, calcDiv(a, 100)), nuovoNumero: false };
}

export function scorporoIva(s0: StatoCalc): StatoCalc {
  const s = controllaIncollato(s0);
  let a = calcDiv(s.impostazioni.pctIva, 100);
  a = calcAdd(a, 1);
  a = calcDiv(leggiDisplay(s), a);
  return { ...scriviDisplay(s, a), nuovoNumero: false };
}

export function inverso(s0: StatoCalc): StatoCalc {
  const s = controllaIncollato(s0);
  const a = parseFloat2(leggiDisplay(s));
  if (a) return { ...scriviDisplay(s, calcDiv(1, a)), nuovoNumero: false };
  return s;
}

export function arrotonda(s0: StatoCalc): StatoCalc {
  const s = controllaIncollato(s0);
  let a = parseFloat2(leggiDisplay(s));
  a = roundTo(a, s.impostazioni.cifreDecimali);
  return { ...scriviDisplay(s, a), nuovoNumero: false };
}

export function radice(s0: StatoCalc): StatoCalc {
  const s = controllaIncollato(s0);
  const a = parseFloat2(leggiDisplay(s));
  if (a >= 0) return { ...scriviDisplay(s, Math.sqrt(a)), nuovoNumero: false };
  return s;
}

export function indietro(s: StatoCalc): StatoCalc {
  if (s.nuovoNumero) return s;
  const t = leggiDisplay(s);
  if (t.length > 1) return scriviDisplay(s, t.substring(0, t.length - 1));
  return s;
}

export function cancellaVoce(s: StatoCalc): StatoCalc {
  return { ...scriviDisplay(s, "0"), incollato: false };
}

// "C": azzera accumulatore e operazione pendente, non la memoria. Come nel
// sito, non riporta a "falso" l'indicatore di nuovo numero.
export function cancellaTutto(s: StatoCalc): StatoCalc {
  return cancellaVoce({ ...s, accum: 0, operazione: "" });
}

export type OperazioneMemoria = "+" | "-" | "R" | "C";

export function memoria(s0: StatoCalc, op: OperazioneMemoria): StatoCalc {
  let s = op !== "C" ? controllaIncollato(s0) : s0;
  const b = parseFloat2(leggiDisplay(s));
  switch (op) {
    case "+": return { ...s, memoria: calcAdd(s.memoria, b) };
    case "-": return { ...s, memoria: calcSub(s.memoria, b) };
    case "R": return incollaValore(s, s.memoria);
    default: s = { ...s, memoria: 0 }; return s;
  }
}

export function memoriaPiena(s: StatoCalc): boolean {
  return !!s.memoria;
}

// Testo del suggerimento sull'indicatore di memoria.
export function testoMemoria(s: StatoCalc): string {
  if (!s.memoria) return "Memoria vuota";
  let a = s.memoria.toString().replace(".", SEP_DEC);
  a = numberFormat(a, s.impostazioni.raggruppa);
  return "Memoria: " + a;
}

// "Applica"/"Salva" delle impostazioni: i valori sono quelli scritti nei
// campi (il sito non li controlla: un campo vuoto diventa NaN).
export function applicaImpostazioni(s: StatoCalc, iva: string, decimali: string, raggruppa: boolean): StatoCalc {
  const imp: ImpostazioniCalc = { pctIva: parseFloat2(iva), cifreDecimali: parseInt(decimali, 10), raggruppa };
  let r: StatoCalc = { ...s, impostazioni: imp };
  if (s.impostazioni.raggruppa !== raggruppa) r = riformattaDisplay(r);
  return r;
}
