// Formattazione/parsing in notazione italiana, usati dai calcolatori: punto
// per le migliaia e virgola per i decimali negli importi (es. "1.234,56"),
// giorno-mese-anno per le date mostrate all'utente, mentre backend e stato
// interno restano sempre in ISO (yyyy-mm-dd) e con il punto come separatore
// decimale, che è quello che le API si aspettano.

export function formatEuro(n: number | null | undefined): string {
  const v = Number(n) || 0;
  // useGrouping va passato esplicitamente: con "auto" (il default), il
  // locale it-IT non raggruppa le migliaia sotto le 5 cifre (es. 1234 non
  // diventa 1.234), un comportamento di Intl/ICU che si scopre solo
  // testandolo e che vanificherebbe silenziosamente la notazione italiana
  // sui gli importi più comuni.
  return `€ ${v.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: true })}`;
}

// Un utente italiano digita naturalmente la virgola come separatore
// decimale su una tastiera numerica: senza questa conversione Number()
// restituirebbe NaN e il calcolo userebbe silenziosamente 0. Il punto
// viene trattato come migliaia SOLO se è presente anche una virgola
// (notazione italiana piena, es. "1.234,56"): altrimenti un valore come
// "1234.56" digitato con il punto come decimale andrebbe altrimenti letto
// come 123456.
export function parseNumeroIt(v: string | null | undefined): number {
  if (!v) return 0;
  const s = v.trim();
  if (s.includes(",")) {
    return Number(s.replace(/\./g, "").replace(",", ".")) || 0;
  }
  return Number(s) || 0;
}

export function isoToDataIt(iso: string | null | undefined): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}-${m}-${y}`;
}
