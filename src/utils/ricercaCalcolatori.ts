// Ricerca locale nel menù dei calcolatori: nome o sottotitolo contengono il
// testo cercato, senza distinguere maiuscole, minuscole e accenti.

export const normalizzaTesto = (s: string): string =>
  (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

export type VoceRicercabile = { nome: string; tipo: string };
export type CategoriaRicercabile<V extends VoceRicercabile> = { id: string; titolo: string; voci: V[] };
export type RisultatoRicerca<V extends VoceRicercabile> = { voce: V; categoriaId: string; categoriaTitolo: string; sottotitolo?: string };

export function cercaVociCalcolatori<V extends VoceRicercabile>(
  categorie: CategoriaRicercabile<V>[],
  testo: string,
  sottotitoloDi: (v: V) => string | undefined,
): RisultatoRicerca<V>[] {
  const q = normalizzaTesto(testo);
  if (!q) return [];
  const out: RisultatoRicerca<V>[] = [];
  for (const cat of categorie) {
    for (const voce of cat.voci) {
      const sottotitolo = sottotitoloDi(voce);
      if (normalizzaTesto(voce.nome).includes(q) || normalizzaTesto(sottotitolo || "").includes(q)) {
        out.push({ voce, categoriaId: cat.id, categoriaTitolo: cat.titolo, sottotitolo });
      }
    }
  }
  return out;
}
