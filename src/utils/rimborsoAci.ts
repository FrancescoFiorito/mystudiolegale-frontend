// Calcolo Rimborso Chilometrico ACI: parti pure (senza React Native), provabili con node.
// La ricerca del veicolo e il calcolo stanno sul server (GET /calc/rimborso-aci/veicoli,
// POST /calc/rimborso-aci); le tariffe vengono dalle tabelle ufficiali ACI pubblicate in
// Gazzetta Ufficiale.

export type VeicoloAci = { id: number; etichetta: string; marca: string; modello: string; motorizzazione: string | null };
export type RicercaAci = { anno: number; risultati: VeicoloAci[]; altri: boolean };
export type RisultatoAci = {
  anno: number; veicolo_id: number; veicolo: string; motorizzazione: string | null;
  km: number | null; tariffa: number; rimborso: number | null;
};

export const MIN_CARATTERI_RICERCA = 3;
export const MAX_CARATTERI_RICERCA = 60;
export const MAX_CIFRE_KM = 6;
export const MAX_RISULTATI_RICERCA = 60;

// Come il campo del sito: solo cifre, virgola, punto e spazio.
export const pulisciKm = (s: string) => s.replace(/[^0-9.,\s]/g, "").slice(0, MAX_CIFRE_KM);

// Il server ignora i caratteri diversi da lettere, cifre, spazio, punto e trattino.
export const pulisciRicerca = (s: string) => s.replace(/[^0-9A-Za-zÀ-ÖØ-öø-ÿ .\-]/g, "").replace(/^-+/, "").slice(0, MAX_CARATTERI_RICERCA);

export const ricercaValida = (s: string) => s.trim().length >= MIN_CARATTERI_RICERCA;

// Testo sotto il campo di ricerca (con "60+" quando i risultati sono troncati).
export function testoContatore(n: number, altri: boolean): string {
  if (n === 0) return "Nessuna corrispondenza trovata.";
  if (n === 1) return "Una corrispondenza trovata.";
  return `${n}${altri ? "+" : ""} corrispondenze trovate.`;
}

const it = (n: number, cifre: number) => Number(n).toLocaleString("it-IT", { minimumFractionDigits: cifre, maximumFractionDigits: cifre });

// Tariffa a 4 decimali, rimborso al centesimo, chilometri con il punto delle migliaia.
export const euroTariffa = (n: number) => `€ ${it(n, 4)}`;
export const euroRimborso = (n: number) => `€ ${it(n, 2)}`;
export const testoKm = (n: number) => Number(n).toLocaleString("it-IT", { maximumFractionDigits: 0 });

// Righe del risultato come nella pagina di riferimento.
export function righeRisultato(r: RisultatoAci): [string, string][] {
  const righe: [string, string][] = [["Veicolo", r.veicolo]];
  if (r.motorizzazione) righe.push(["Motorizzazione", r.motorizzazione]);
  if (r.km) righe.push(["Chilometri percorsi", testoKm(r.km)]);
  righe.push([`Tariffa chilometrica ${r.anno}`, euroTariffa(r.tariffa)]);
  if (r.rimborso != null) righe.push(["Rimborso chilometrico", euroRimborso(r.rimborso)]);
  return righe;
}
