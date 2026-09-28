// Le scadenze senza orario specifico ("ora" nullo/vuoto) sono "tutta la
// giornata" (default), coerentemente col backend (ScadenzaReq.ora: Optional[str]).
export function formatOra(ora?: string | null): string {
  return ora ? ora : "Tutto il giorno";
}

// Chiave di ordinamento null-safe: le scadenze senza orario specifico
// vengono prima di quelle con un orario, nello stesso giorno.
export function chiaveOrdinamentoOra(ora?: string | null): string {
  return ora || "";
}
