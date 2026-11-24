// Costruzione (pura) del modulo iniziale e del corpo della richiesta di un modello di atto.
import type { CampoRigaLista } from "@/src/components/ListaInput";
import { rigaVuota } from "@/src/components/ListaInput";
import { parseNumeroIt } from "@/src/utils/formatoItaliano";
import type { CampoModello, ModelloAtto, Modulo } from "./tipi";

const due = (n: number) => (n < 10 ? "0" + n : String(n));

// Oggi come data ISO (aaaa-mm-gg), nel fuso del telefono.
export const oggiIso = (d: Date = new Date()) => `${d.getFullYear()}-${due(d.getMonth() + 1)}-${due(d.getDate())}`;

// "2026-11-24" -> "24/11/2026"
export const isoAGgMmAaaa = (iso: string) => {
  const [y, m, g] = (iso || "").split("-");
  return y && m && g ? `${g}/${m}/${y}` : "";
};

export const tuttiICampi = (m: ModelloAtto): CampoModello[] => m.gruppi.flatMap((g) => g.campi);

export function modulaIniziale(m: ModelloAtto): Modulo {
  const f: Modulo = {};
  for (const c of tuttiICampi(m)) {
    if (c.tipo === "bool") f[c.key] = c.default ?? false;
    else if (c.tipo === "scelta") f[c.key] = c.default ?? c.opzioni[0]?.value ?? "";
    else if (c.tipo === "lista") f[c.key] = c.righeIniziali ? c.righeIniziali.map((r) => ({ ...r })) : Array.from({ length: c.min ?? 0 }, () => rigaVuota(c.campi));
    else if (c.tipo === "data") f[c.key] = "";
    else f[c.key] = c.default ?? "";
  }
  return f;
}

// Valore di un singolo campo (di primo livello o di una riga) come lo vuole il server;
// `undefined` = non inviarlo.
function valoreCampo(c: { tipo: string; invio?: string; omettiSeVuoto?: boolean; vuotaOggi?: boolean }, v: any, oggi: string): unknown {
  switch (c.tipo) {
    case "bool":
      return v === true || v === "true";
    case "data": {
      const iso = typeof v === "string" ? v : "";
      return isoAGgMmAaaa(iso || (c.vuotaOggi ? oggi : ""));
    }
    case "numero": {
      const s = String(v ?? "").trim();
      if (!s) return undefined;
      if (c.invio === "numero") return parseNumeroIt(s);
      if (c.invio === "intero") return parseInt(s, 10);
      return s;
    }
    case "scelta": {
      const s = String(v ?? "");
      if (!s && c.omettiSeVuoto) return undefined;
      return c.invio === "numero" ? Number(s) : s;
    }
    default: {
      const s = String(v ?? "");
      if (!s.trim() && c.omettiSeVuoto) return undefined;
      return s;
    }
  }
}

function righeLista(c: Extract<CampoModello, { tipo: "lista" }>, righe: Record<string, string>[], f: Modulo, oggi: string): unknown[] {
  const campi = c.campi.filter((x) => x.tipo !== "azione");
  if (c.comeTesti) {
    const k = campi[0];
    return righe.map((r) => String(r[k.key] ?? "").trim()).filter(Boolean);
  }
  return righe.map((r) => {
    const out: Record<string, unknown> = {};
    for (const k of c.campi as CampoRigaLista[]) {
      if (k.tipo === "azione") continue;
      if (k.mostraSe && !k.mostraSe(r, f)) continue;
      const val = valoreCampo(k as any, r[k.key], oggi);
      if (val !== undefined) out[k.key] = val;
    }
    return out;
  });
}

export function costruisciBody(m: ModelloAtto, f: Modulo, oggi: string = oggiIso()): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  for (const c of tuttiICampi(m)) {
    if (c.soloSchermo) continue;
    if (c.mostraSe && !c.mostraSe(f)) {
      if ("valoreSeNascosto" in c) body[c.key] = c.valoreSeNascosto;
      continue;
    }
    const v = c.tipo === "lista" ? righeLista(c, f[c.key] || [], f, oggi) : valoreCampo(c, f[c.key], oggi);
    if (v !== undefined) body[c.key] = v;
  }
  return body;
}
