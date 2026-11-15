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
