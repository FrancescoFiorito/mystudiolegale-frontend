// Trattamento dei nominativi nei documenti (parti assistite, avvocato):
// iniziali maiuscole, titolo con articolo, genere dal codice fiscale, come
// nel calcolatore di riferimento.

// Articolo davanti alla prima parola del nominativo. Titoli (la parola prima del
// primo punto): [maschile, femminile]; le parole non elencate non hanno articolo.
const ARTICOLI_TITOLI: Record<string, [string, string]> = {
  sig: ["il", "la"], dr: ["il", "la"], dott: ["il", "la"], dottor: ["il", "la"], dottoressa: ["il", "la"],
  geom: ["il", "la"], rag: ["il", "la"], notaio: ["il", "la"],
  ing: ["l’", "l’"], arch: ["l’", "l’"], avv: ["l’", "l’"], avvocato: ["l’", "l’"],
};
// Forme sociali e parole di persone giuridiche con articolo fisso.
const ARTICOLI_PAROLE: Record<string, string> = {
  condominio: "il", consorzio: "il", associazione: "l’", studio: "lo", ditta: "la", "soc.": "la", società: "la", cooperativa: "la",
};
// Titoli il cui suffisso resta minuscolo (gli altri, es. "Prof.ssa", diventano "Prof.Ssa").
const TITOLI_FISSI = ["Sig.ra", "Sig.na", "Dr.ssa", "Dott.ssa"];
// Forme sociali e parole che indicano un soggetto di genere maschile.
const PAROLE_MASCHILI = ["condominio", "consorzio", "studio"];
const TITOLI_FEMMINILI = ["sig.ra", "sig.na", "dr.ssa", "dott.ssa", "dottoressa"];

// Prima lettera maiuscola dopo spazio, punto o apostrofo; il resto minuscolo.
export function maiuscoleNome(s: string): string {
  const t = s.replace(/'/g, "’").toLowerCase();
  let out = "";
  let inizio = true;
  for (const ch of t) {
    out += inizio ? ch.toUpperCase() : ch;
    inizio = ch === " " || ch === "." || ch === "’";
  }
  return out;
}

export type Nominativo = {
  nome: string; // parte iniziale in maiuscole ("Sig.ra Anna Verdi")
  resto: string; // dal primo "," o "-" in poi, invariato
  articolo: string; // "il", "la", "l’", "lo" oppure ""
};

export function leggiNominativo(grezzo: string, personaGiuridica = false): Nominativo {
  const s = (grezzo || "").trim();
  const m = s.match(/^[^,-]*/);
  const testa = m ? m[0] : s;
  const resto = s.slice(testa.length);
  let nome = maiuscoleNome(testa.trim());
  const primo = nome.split(" ")[0];
  const fisso = TITOLI_FISSI.find((t) => t.toLowerCase() === primo.toLowerCase());
  if (fisso) nome = fisso + nome.slice(primo.length);
  const chiave = primo.toLowerCase();
  const titolo = personaGiuridica ? undefined : ARTICOLI_TITOLI[chiave.split(".")[0]];
  const articolo = ARTICOLI_PAROLE[chiave] || (titolo ? titolo[/(ssa|ra|na)$/.test(chiave) ? 1 : 0] : "");
  return { nome, resto, articolo };
}

export function conArticolo(n: Nominativo): string {
  const corpo = n.nome + n.resto;
  return n.articolo ? (n.articolo.endsWith("’") ? `${n.articolo}${corpo}` : `${n.articolo} ${corpo}`) : corpo;
}

// Genere: con un codice fiscale di 16 caratteri dal giorno di nascita (>40 = femmina), anche
// per le persone giuridiche; con la partita IVA dalla prima parola del nome (le persone
// giuridiche sono di norma femminili, salvo Condominio, Consorzio, Studio) o dal titolo.
export function eFemminile(n: Nominativo, cf: string, personaGiuridica: boolean): boolean {
  const c = (cf || "").trim().toUpperCase();
  if (c.length === 16) return Number(c.slice(9, 11)) > 40;
  const primo = n.nome.split(" ")[0].toLowerCase();
  if (personaGiuridica) return !PAROLE_MASCHILI.includes(primo);
  return TITOLI_FEMMINILI.includes(primo);
}

// Vero se la prima parola è un titolo riconosciuto (Dott., Ing., Avv. ...).
export function haTitolo(nome: string): boolean {
  return !!ARTICOLI_TITOLI[(nome.trim().split(" ")[0] || "").toLowerCase().split(".")[0]];
}
