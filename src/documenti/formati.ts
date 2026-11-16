// Funzioni di formato comuni ai documenti generati dai calcolatori: importi,
// date e percentuali come nel calcolatore di riferimento.

export function euro(n: number | null | undefined): string {
  const v = Number(n) || 0;
  return `€ ${v.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: true })}`;
}

export function pct(n: number | string): string {
  return String(n).replace(".", ",");
}

// "2026-11-15" -> "15/11/2026"
export function dataIt(iso: string): string {
  const [y, m, d] = (iso || "").split("-");
  if (!y || !m || !d) return iso || "";
  return `${d}/${m}/${y}`;
}

// Prima lettera maiuscola, il resto invariato.
export function maiuscolaIniziale(s: string): string {
  const t = s.trim();
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : t;
}

// Prima lettera minuscola, il resto invariato.
export function minuscolaIniziale(s: string): string {
  const t = s.trim();
  return t ? t.charAt(0).toLowerCase() + t.slice(1) : t;
}

// Aggiunge il punto finale se manca.
export function conPuntoFinale(s: string): string {
  const t = s.trim();
  return t && !t.endsWith(".") ? `${t}.` : t;
}

// Righe non vuote di un testo su più righe.
export function righe(s: string): string[] {
  return (s || "").split(/\r?\n/).map((r) => r.trim()).filter(Boolean);
}

// Controllo del codice fiscale (16 caratteri) e della partita IVA (11 cifre).
const CF_DISPARI = [1, 0, 5, 7, 9, 13, 15, 17, 19, 21, 2, 4, 18, 20, 11, 3, 6, 8, 12, 14, 16, 10, 22, 25, 24, 23];
export function codiceFiscaleValido(cf: string): boolean {
  const s = (cf || "").toUpperCase();
  if (!/^[A-Z0-9]{16}$/.test(s)) return false;
  let somma = 0;
  for (let i = 0; i < 15; i++) {
    const c = s[i];
    const v = c >= "0" && c <= "9" ? c.charCodeAt(0) - 48 : c.charCodeAt(0) - 65;
    somma += i % 2 === 0 ? CF_DISPARI[v] : v;
  }
  return String.fromCharCode(65 + (somma % 26)) === s[15];
}
export function partitaIvaValida(piva: string): boolean {
  if (!/^[0-9]{11}$/.test(piva || "")) return false;
  let somma = 0;
  for (let i = 0; i < 10; i++) {
    let d = piva.charCodeAt(i) - 48;
    if (i % 2 === 1) { d *= 2; if (d > 9) d -= 9; }
    somma += d;
  }
  return (10 - (somma % 10)) % 10 === piva.charCodeAt(10) - 48;
}

// Data di nascita (ISO aaaa-mm-gg) letta da un codice fiscale valido, oppure
// null. Nel codice fiscale l'anno ha solo due cifre: si sceglie il secolo che
// dà la data più recente non nel futuro rispetto a `oggi`.
const CF_MESI = "ABCDEHLMPRST";
export function dataNascitaDaCodiceFiscale(cf: string, oggi: Date = new Date()): string | null {
  const s = (cf || "").trim().toUpperCase();
  if (!codiceFiscaleValido(s)) return null;
  const mese = CF_MESI.indexOf(s[8]) + 1;
  let giorno = parseInt(s.slice(9, 11), 10);
  const aa = parseInt(s.slice(6, 8), 10);
  if (!mese || Number.isNaN(giorno) || Number.isNaN(aa)) return null;
  if (giorno > 40) giorno -= 40; // donne: giorno + 40
  const valida = (anno: number) => {
    const d = new Date(Date.UTC(anno, mese - 1, giorno));
    return d.getUTCFullYear() === anno && d.getUTCMonth() === mese - 1 && d.getUTCDate() === giorno;
  };
  const oggiMs = Date.UTC(oggi.getFullYear(), oggi.getMonth(), oggi.getDate());
  let anno = 2000 + aa;
  if (Date.UTC(anno, mese - 1, giorno) > oggiMs || !valida(anno)) anno = 1900 + aa;
  if (!valida(anno)) return null;
  return `${anno}-${String(mese).padStart(2, "0")}-${String(giorno).padStart(2, "0")}`;
}
