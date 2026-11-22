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
  // Dopo M+ e M- la cifra successiva inizia un numero nuovo (senza perdere l'operazione in corso).
  dopoMemoria: boolean;
  // Dopo un errore (divisione per zero, radice di un negativo) il display mostra "Errore"
  // e tutti i tasti sono bloccati fino a CE o C.
  errore: boolean;
  impostazioni: ImpostazioniCalc;
};

export const TESTO_ERRORE = "Errore";

export const IMPOSTAZIONI_PREDEFINITE: ImpostazioniCalc = { pctIva: 22, cifreDecimali: 2, raggruppa: false };

// Il sito accetta fino a 15 caratteri digitati (DisplaySize) e 64 nel campo.
const LUNGHEZZA_DISPLAY = 15;
const LUNGHEZZA_MAX_INCOLLA = 64;
const PRECISIONE_MAX = 20;
const SEP_DEC = ",";
const SEP_MIGLIAIA = ".";

export function statoIniziale(impostazioni: ImpostazioniCalc = IMPOSTAZIONI_PREDEFINITE): StatoCalc {
  return { display: "0", accum: 0, nuovoNumero: false, operazione: "", memoria: 0, incollato: false, dopoMemoria: false, errore: false, impostazioni: { ...impostazioni } };
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
// La divisione per zero non produce più 0: lancia, e il tasto che l'ha richiesta mostra "Errore".
const ERRORE_CALCOLO = { motivo: "divisione per zero" };
function divDecimal(a: number, b: number): number {
  if (b === 0) throw ERRORE_CALCOLO;
  return parseFloat((a / b).toFixed(PRECISIONE_MAX));
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
// Cifre decimali di un numero, anche se scritto in notazione esponenziale.
function cifreDecimaliDi(a: number): number {
  const t = String(a);
  if (t.indexOf("e") === -1 && t.indexOf("E") === -1) return parteDecimale(a).length;
  return parteDecimale(parseFloat(a.toFixed(PRECISIONE_MAX))).length;
}

// Porta i due operandi a interi con lo stesso fattore di scala (10^k), così resto e
// quoziente sono esatti anche con i decimali (0,3 / 0,1 = 3, non 2,9999...). Se gli interi
// scalati non sono rappresentabili con esattezza, restituisce null.
function scalati(a: number, b: number): { A: number; B: number; fattore: number } | null {
  const k = Math.min(Math.max(cifreDecimaliDi(a), cifreDecimaliDi(b)), PRECISIONE_MAX);
  const fattore = Math.pow(10, k);
  const A = Math.round(a * fattore);
  const B = Math.round(b * fattore);
  if (!Number.isSafeInteger(A) || !Number.isSafeInteger(B)) return null;
  return { A, B, fattore };
}

// Resto della divisione con i decimali (stesso segno del dividendo, come l'operatore % di JavaScript).
function iMod(a: number, b: number): number {
  if (b === 0) throw ERRORE_CALCOLO;
  const sc = scalati(a, b);
  if (!sc) return a % b;
  return (sc.A % sc.B) / sc.fattore;
}
// Divisione intera per difetto (floor): -23 idiv 5 = -5.
function iDiv(a: number, b: number): number {
  if (b === 0) throw ERRORE_CALCOLO;
  const sc = scalati(a, b);
  if (!sc) return Math.floor(a / b);
  const r = sc.A % sc.B;
  let q = (sc.A - r) / sc.B;
  if (r !== 0 && (r < 0) !== (sc.B < 0)) q -= 1;
  return q === 0 ? 0 : q;
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
  return { ...s, display: a, dopoMemoria: false };
}

// Mostra "Errore" e blocca la calcolatrice fino a CE o C (la memoria resta).
function inErrore(s: StatoCalc): StatoCalc {
  return { ...s, display: TESTO_ERRORE, accum: 0, operazione: "", nuovoNumero: false, incollato: false, dopoMemoria: false, errore: true };
}

function riformattaDisplay(s: StatoCalc): StatoCalc {
  let a = leggiDisplay(s);
  a = a.replace(".", SEP_DEC);
  a = numberFormat(a, s.impostazioni.raggruppa);
  return { ...s, display: a };
}

// ---- Tasti ----

export function cifra(s: StatoCalc, n: number | string): StatoCalc {
  if (s.errore) return s;
  if (s.nuovoNumero || s.dopoMemoria) {
    return { ...scriviDisplay(s, n), nuovoNumero: false };
  }
  const b = leggiDisplay(s);
  if (b === "0") return scriviDisplay(s, n);
  if (b.length < LUNGHEZZA_DISPLAY) return scriviDisplay(s, b + n);
  return s;
}

export function virgola(s0: StatoCalc): StatoCalc {
  if (s0.errore) return s0;
  const s = s0.dopoMemoria ? { ...s0, nuovoNumero: true, dopoMemoria: false } : s0;
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

// Tutti i tasti (tranne CE e C) sono bloccati dopo un errore.
const bloccato = (s: StatoCalc) => s.errore;

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
  if (bloccato(s)) return s;
  const pulito = (testo || "").trim().slice(0, LUNGHEZZA_MAX_INCOLLA);
  if (!/^[-+]?[0-9.,]*([eE][-+]?[0-9]+)?$/.test(pulito) || !/[0-9]/.test(pulito)) return s;
  return { ...s, display: pulito, incollato: true, dopoMemoria: false };
}

export function operazione(s0: StatoCalc, op: Exclude<OperatoreCalc, "">): StatoCalc {
  if (bloccato(s0)) return s0;
  let s = controllaIncollato(s0);
  const b = leggiDisplay(s);
  if (s.nuovoNumero && s.operazione !== "=") {
    return { ...s, operazione: op };
  }
  s = { ...s, nuovoNumero: true };
  let accum = s.accum;
  try {
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
        // Variazione percentuale dal primo al secondo numero: (y - x) / x * 100.
        let c = calcSub(b, accum);
        c = calcDiv(c, accum);
        accum = calcMul(c, "100,0");
        break;
      }
      case "m": accum = iMod(accum, parseFloat2(b)); break;
      case "i": accum = iDiv(accum, parseFloat2(b)); break;
      default: accum = parseFloat2(b);
    }
  } catch (e) {
    if (e === ERRORE_CALCOLO) return inErrore(s);
    throw e;
  }
  return { ...scriviDisplay({ ...s, accum }, accum), operazione: op };
}

export function cambiaSegno(s0: StatoCalc): StatoCalc {
  if (bloccato(s0)) return s0;
  const s = controllaIncollato(s0);
  return { ...scriviDisplay(s, calcMul(leggiDisplay(s), -1)), nuovoNumero: false };
}

export function percentuale(s0: StatoCalc): StatoCalc {
  if (bloccato(s0)) return s0;
  const s = controllaIncollato(s0);
  // Con x e ÷ il valore percentuale è y/100, come sulle calcolatrici da scrivania
  // (200 x 10 % = 20; 200 ÷ 10 % = 2000). Con + e - (e senza operazione) resta y% di x.
  if (s.operazione === "*" || s.operazione === "/") {
    return { ...scriviDisplay(s, calcDiv(leggiDisplay(s), 100)), nuovoNumero: false };
  }
  const a = calcMul(leggiDisplay(s), s.accum);
  return { ...scriviDisplay(s, calcDiv(a, 100)), nuovoNumero: false };
}

export function scorporoIva(s0: StatoCalc): StatoCalc {
  if (bloccato(s0)) return s0;
  const s = controllaIncollato(s0);
  let a = calcDiv(s.impostazioni.pctIva, 100);
  a = calcAdd(a, 1);
  a = calcDiv(leggiDisplay(s), a);
  return { ...scriviDisplay(s, a), nuovoNumero: false };
}

export function inverso(s0: StatoCalc): StatoCalc {
  if (bloccato(s0)) return s0;
  const s = controllaIncollato(s0);
  const a = parseFloat2(leggiDisplay(s));
  if (a) return { ...scriviDisplay(s, calcDiv(1, a)), nuovoNumero: false };
  return s;
}

export function arrotonda(s0: StatoCalc): StatoCalc {
  if (bloccato(s0)) return s0;
  const s = controllaIncollato(s0);
  let a = parseFloat2(leggiDisplay(s));
  a = roundTo(a, s.impostazioni.cifreDecimali);
  return { ...scriviDisplay(s, a), nuovoNumero: false };
}

export function radice(s0: StatoCalc): StatoCalc {
  if (bloccato(s0)) return s0;
  const s = controllaIncollato(s0);
  const a = parseFloat2(leggiDisplay(s));
  if (a < 0) return inErrore(s);
  return { ...scriviDisplay(s, Math.sqrt(a)), nuovoNumero: false };
}

export function indietro(s: StatoCalc): StatoCalc {
  if (bloccato(s) || s.nuovoNumero) return s;
  const t = leggiDisplay(s);
  if (t.length > 1) {
    const r = t.substring(0, t.length - 1);
    // Un negativo di una cifra ("-5") non deve lasciare "-" (o "-0") sul display: torna a 0.
    return scriviDisplay(s, r === "-" || r === "-0" ? "0" : r);
  }
  return s;
}

// CE: dopo un errore azzera anche l'operazione in corso (la memoria resta).
export function cancellaVoce(s: StatoCalc): StatoCalc {
  if (s.errore) return { ...scriviDisplay(s, "0"), accum: 0, operazione: "", nuovoNumero: false, incollato: false, errore: false };
  return { ...scriviDisplay(s, "0"), incollato: false };
}

// "C": azzera accumulatore e operazione pendente, non la memoria. Come nel
// sito, non riporta a "falso" l'indicatore di nuovo numero.
export function cancellaTutto(s: StatoCalc): StatoCalc {
  return cancellaVoce({ ...s, accum: 0, operazione: "" });
}

export type OperazioneMemoria = "+" | "-" | "R" | "C";

export function memoria(s0: StatoCalc, op: OperazioneMemoria): StatoCalc {
  if (bloccato(s0)) return s0;
  let s = op !== "C" ? controllaIncollato(s0) : s0;
  const b = parseFloat2(leggiDisplay(s));
  switch (op) {
    // Dopo M+ e M- la cifra successiva inizia un numero nuovo.
    case "+": return { ...s, memoria: calcAdd(s.memoria, b), dopoMemoria: true };
    case "-": return { ...s, memoria: calcSub(s.memoria, b), dopoMemoria: true };
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

// "Applica"/"Salva" delle impostazioni. Un campo vuoto o non valido non viene salvato:
// resta il valore precedente e viene restituito un messaggio (null se è tutto valido).
export function applicaImpostazioni(
  s: StatoCalc, iva: string, decimali: string, raggruppa: boolean,
): { stato: StatoCalc; messaggio: string | null } {
  const ivaTrim = (iva || "").trim();
  const decTrim = (decimali || "").trim();
  const ivaValida = /^[0-9]{1,2}$/.test(ivaTrim);
  const decValido = /^[0-9]$/.test(decTrim);
  const imp: ImpostazioniCalc = {
    pctIva: ivaValida ? parseInt(ivaTrim, 10) : s.impostazioni.pctIva,
    cifreDecimali: decValido ? parseInt(decTrim, 10) : s.impostazioni.cifreDecimali,
    raggruppa,
  };
  let r: StatoCalc = { ...s, impostazioni: imp };
  if (!s.errore && s.impostazioni.raggruppa !== raggruppa) r = riformattaDisplay(r);
  const avvisi: string[] = [];
  if (!ivaValida) avvisi.push(`Aliquota IVA non valida: resta ${s.impostazioni.pctIva}`);
  if (!decValido) avvisi.push(`Cifre decimali non valide: restano ${s.impostazioni.cifreDecimali}`);
  return { stato: r, messaggio: avvisi.length ? avvisi.join(". ") + "." : null };
}
