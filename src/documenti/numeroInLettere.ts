// Importo in lettere ("duemilaottocentonovantasei/35") per i documenti dei
// calcolatori: parole unite senza spazi, come nel calcolatore di riferimento.

const UNITA = ["zero", "uno", "due", "tre", "quattro", "cinque", "sei", "sette", "otto", "nove", "dieci", "undici", "dodici", "tredici", "quattordici", "quindici", "sedici", "diciassette", "diciotto", "diciannove"];
const DECINE = ["", "", "venti", "trenta", "quaranta", "cinquanta", "sessanta", "settanta", "ottanta", "novanta"];

// Parole per un numero da 0 a 999 (senza accenti né elisioni dopo "cento", come nel calcolatore di riferimento: ventitre, centoottanta).
function centinaia(n: number): string {
  let s = "";
  const c = Math.floor(n / 100);
  const r = n % 100;
  if (c > 0) s += c === 1 ? "cento" : UNITA[c] + "cento";
  if (r === 0) return s;
  let resto: string;
  if (r < 20) resto = UNITA[r];
  else {
    const d = Math.floor(r / 10);
    const u = r % 10;
    let dec = DECINE[d];
    if (u === 1 || u === 8) dec = dec.slice(0, -1);
    resto = dec + (u === 0 ? "" : UNITA[u]);
  }
  return s + resto;
}

export function interoInLettere(n: number): string {
  if (n === 0) return "zero";
  const parti: string[] = [];
  const mld = Math.floor(n / 1e9);
  const mln = Math.floor((n % 1e9) / 1e6);
  const mig = Math.floor((n % 1e6) / 1e3);
  const res = n % 1e3;
  if (mld) parti.push(mld === 1 ? "unmiliardo" : centinaia(mld) + "miliardi");
  if (mln) parti.push(mln === 1 ? "unmilione" : centinaia(mln) + "milioni");
  if (mig) parti.push(mig === 1 ? "mille" : centinaia(mig) + "mila");
  if (res) parti.push(centinaia(res));
  return parti.join("");
}

// Importo in euro nella forma "<lettere>/<centesimi>", es. "milleduecento/50".
export function importoInLettere(importo: number): string {
  const cent = Math.round(Math.abs(importo) * 100);
  const euro = Math.floor(cent / 100);
  return `${interoInLettere(euro)}/${String(cent % 100).padStart(2, "0")}`;
}
