// Interpreta il corpo di una risposta di errore del backend ed estrae il
// messaggio leggibile (`detail`). Funzione pura, senza dipendenze, cosi' si
// puo' provare fuori dall'app.
//
// - `detail` stringa (402, 403, 404, ...): e' il messaggio.
// - `detail` lista (422 di validazione): si uniscono i `msg`.
// - corpo vuoto, non JSON o senza `detail`: "Errore <codice>".
export function messaggioDaCorpo(status: number, corpo: string | null | undefined): string {
  const fallback = `Errore ${status}`;
  if (!corpo) return fallback;
  try {
    const j = JSON.parse(corpo);
    const d = j?.detail;
    if (typeof d === "string" && d.trim()) return d;
    if (Array.isArray(d)) {
      const msgs = d.map((x: any) => (typeof x === "string" ? x : x?.msg)).filter(Boolean);
      if (msgs.length) return msgs.join("; ");
    }
  } catch {}
  return fallback;
}
