// Testo del Preventivo per attività stragiudiziali e mediazione, a partire dai
// dati inseriti nel form (avvocato, parti assistite, incarico) e dai numeri
// restituiti dal calcolo.
import { euro, dataIt, maiuscolaIniziale } from "./formati";
import { importoInLettere } from "./numeroInLettere";
import { leggiNominativo, conArticolo, eFemminile, haTitolo } from "./nomi";

export type ParteAssistita = { nome: string; cf: string; personaGiuridica: boolean; rappresentante: string };

export type DatiPreventivo = {
  avvocato: string;
  indirizzo: string;
  cf_avvocato: string;
  ordine: string;
  polizza: string;
  parti: ParteAssistita[];
  descrizione: string;
  controparte: string;
  luogo: string;
  data: string; // ISO
  mediazione: boolean;
  percentuale: boolean;
  valoreAffare: string; // già formattato: "da € 5.201 a € 26.000", "€ 10.000,00"...
  descrizioniFasi: string[]; // facoltative: vuote = nome predefinito
  pctSpeseGenerali: number;
  // Accessori selezionati nel form (tutti false = come senza accessori).
  accessori: { speseGenerali: boolean; cassa: boolean; iva: boolean };
};

const dash = (n: number) => (n ? euro(n) : "-");
const somma = (v: number[]) => Math.round(v.reduce((a, b) => a + b, 0) * 100) / 100;

function parteInTesto(p: ParteAssistita): { testo: string; firma: string; femminile: boolean } {
  const cf = p.cf.trim().toUpperCase();
  const n = leggiNominativo(p.nome, p.personaGiuridica);
  const femminile = eFemminile(n, cf, p.personaGiuridica);
  let testo = `${conArticolo(n)} (${cf.length === 11 ? "P.IVA" : "CF"}: ${cf})`;
  let firma = n.nome;
  if (p.personaGiuridica) {
    const rap = leggiNominativo(p.rappresentante);
    testo += `, in persona del suo legale rappresentante pro tempore ${rap.nome}${rap.resto}`.trimEnd();
    firma = `Firma legale rappresentante ${n.nome}`;
  }
  return { testo, firma, femminile };
}

export function generaPreventivoStragiudiziale(d: DatiPreventivo, r: any): string {
  const out: string[] = [];
  const parti = d.parti.map(parteInTesto);
  const plurale = parti.length > 1;
  const f = parti.every((p) => p.femminile);
  const elenco = parti.length > 1 ? `${parti.slice(0, -1).map((p) => p.testo).join(", ")} e ${parti[parti.length - 1].testo}` : parti[0].testo;
  const clienti = plurale ? "Clienti" : "Cliente";
  const part = plurale ? (f ? "denominate" : "denominati") : f ? "denominata" : "denominato";

  // Avvocato: titolo "Avv." aggiunto se non presente.
  const cfAv = d.cf_avvocato.trim().toUpperCase();
  let av = leggiNominativo(d.avvocato);
  if (!haTitolo(av.nome)) av = leggiNominativo(`Avv. ${d.avvocato.trim()}`);
  const avTesto = conArticolo(av);
  const avvocato = `${avTesto}${av.resto}${d.ordine ? ` del foro di ${d.ordine}` : ""}${cfAv ? ` (CF: ${cfAv})` : ""}, con studio in ${d.indirizzo.trim()}, polizza assicurativa: ${d.polizza.trim()}, di seguito denominato "Avvocato"`;

  out.push("Preventivo ex artt. 13, comma 5, L. n. 247/2012 e 27 Codice deontologico forense.");
  out.push("");
  out.push("Da valere ad ogni effetto di legge tra:");
  out.push(`${elenco}, di seguito ${part} "${clienti}"`);
  out.push("e");
  out.push(avvocato);
  out.push("relativamente al seguente incarico:");
  out.push(`${maiuscolaIniziale(d.descrizione)} contro ${d.controparte.trim()}.`);
  out.push(`${d.mediazione ? "Valore della controversia" : "Valore dell'affare"}: ${d.valoreAffare}.`);
  out.push("");
  out.push("1) Determinazione del compenso e informazione sulla prevedibile misura dei costi della prestazione");
  const prende = plurale ? (f ? "e le Clienti prendono" : "ed i Clienti prendono") : f ? "e la Cliente prende" : "e il Cliente prende";
  out.push(`Ai sensi dell’art. 13, comma 5, della legge 31 dicembre 2012, n. 247, l’Avvocato dichiara ${prende} atto che la prevedibile misura dei costi della prestazione è determinata come segue:`);

  // 1.1 Compenso
  out.push("1.1) Compenso:");
  out.push("Descrizione\tImporto");
  const voci: { d: string; i: number }[] = [];
  (r.fasi || []).forEach((x: any, i: number) => {
    if (x.attiva) voci.push({ d: maiuscolaIniziale((d.descrizioniFasi[i] || "").trim()) || x.nome, i: x.importo });
  });
  (r.compensi_aggiuntivi || []).forEach((x: any) => voci.push({ d: maiuscolaIniziale(x.descrizione), i: x.importo }));
  voci.forEach((v) => out.push(`${v.d}\t${dash(v.i)}`));
  if (voci.length > 1) out.push(`Totale compenso:\t${dash(r.compenso_totale)}`);

  // 1.2 Spese ipotizzabili
  const spese = (r.spese || []).filter((s: any) => s.esente || s.non_esente);
  let n = 2;
  if (spese.length) {
    out.push(`1.${n++}) Spese ipotizzabili:`);
    out.push("Voce di spesa\tEsente\tNon esente");
    spese.forEach((s: any) => out.push(`${maiuscolaIniziale(s.descrizione)}\t${dash(s.esente)}\t${dash(s.non_esente)}`));
    if (spese.length > 1) out.push(`Totale spese:\t${dash(somma(spese.map((s: any) => s.esente)))}\t${dash(somma(spese.map((s: any) => s.non_esente)))}`);
  }

  // Accessori
  const conAccessori = d.accessori.speseGenerali || d.accessori.cassa || d.accessori.iva;
  if (conAccessori) {
    out.push(`1.${n}) Accessori di legge:`);
    const nAcc = [d.accessori.speseGenerali, d.accessori.cassa, d.accessori.iva].filter(Boolean).length;
    if (d.accessori.speseGenerali) out.push(`Spese generali (${String(d.pctSpeseGenerali).replace(".", ",")}% )\t${dash(r.spese_generali)}`);
    if (d.accessori.cassa) out.push(`Cassa Avvocati (4% )\t${dash(r.cassa)}`);
    if (d.accessori.iva) out.push(`IVA (22% )\t${dash(r.iva)}`);
    if (nAcc > 1) out.push(`Totale accessori:\t${dash(r.totale_accessori)}`);
  }
  out.push("");
  out.push(`TOTALE PREVENTIVO: ${euro(r.totale)} (Euro ${importoInLettere(r.totale)}).`);
  if (!conAccessori) out.push("Gli importi come sopra determinati sono da intendersi al netto degli accessori dovuti per legge (spese generali 15%, CPA 4%, IVA 22% ove applicabile).");
  out.push("");
  out.push("2) Clausola di garanzia");
  const soggetto = plurale ? (f ? "Le Clienti sono state informate" : "I Clienti sono stati informati") : f ? "La Cliente è stata informata" : "Il Cliente è stato informato";
  const avvertito = plurale ? (f ? "e sono state avvertite" : "e sono stati avvertiti") : f ? "ed è stata avvertita" : "ed è stato avvertito";
  const avvisato = plurale ? (f ? "verranno tempestivamente avvisate" : "verranno tempestivamente avvisati") : f ? "verrà tempestivamente avvisata" : "verrà tempestivamente avvisato";
  out.push(`${soggetto} della complessità dell’incarico e degli oneri ipotizzabili dal momento del conferimento alla conclusione dell’incarico stesso, ${avvertito} che, attesa la natura della prestazione oggetto del mandato, i costi e/o i compensi potranno subire delle variazioni in aumento qualora dovessero rendersi opportune attività ulteriori e/o adempimenti più complessi (rispetto a quanto inizialmente previsto in modo indicativo) e in tal caso ${avvisato}.`);
  out.push("");
  out.push(`${d.luogo.trim()}, li ${dataIt(d.data)}`);
  out.push("");
  parti.forEach((p) => out.push(p.firma));
  out.push(av.nome);
  return out.join("\n");
}
