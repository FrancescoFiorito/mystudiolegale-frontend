// Nome visualizzato e iniziali di un cliente: ragione sociale per le
// aziende, altrimenti nome + cognome. Le iniziali di una persona sono la
// prima lettera del nome e la prima del cognome, non le prime due lettere
// del nome per intero (che ignoravano il cognome).
export function nomeCliente(c: any): string {
  return c.ragione_sociale || `${c.nome || ""} ${c.cognome || ""}`.trim();
}

export function inizialiCliente(c: any): string {
  if (c.ragione_sociale) return c.ragione_sociale.trim().slice(0, 2).toUpperCase();
  const iniziali = `${(c.nome || "").trim().charAt(0)}${(c.cognome || "").trim().charAt(0)}`.toUpperCase();
  return iniziali || "?";
}
