
import React from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, KeyboardAvoidingView, Platform, Alert, Keyboard } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "@/src/ThemeContext";
import { useAuth } from "@/src/AuthContext";
import { api } from "@/src/api";
import { useLocalSearchParams, useRouter, useNavigation } from "expo-router";
import { SPACING, RADIUS } from "@/src/theme";
import Header from "@/src/components/Header";
import PromemoriaInput from "@/src/components/PromemoriaInput";
import PraticaPicker from "@/src/components/PraticaPicker";
import OrarioInput from "@/src/components/OrarioInput";
import DataInput from "@/src/components/DataInput";
import MeseAnnoInput from "@/src/components/MeseAnnoInput";
import ListaInput, { CampoRigaLista } from "@/src/components/ListaInput";
import SelectInput from "@/src/components/SelectInput";
import SwipeBackScreen from "@/src/components/SwipeBackScreen";
import { sincronizzaSeConnesso } from "@/src/utils/calendarioDispositivo";
import { scegliAperturaDocumento } from "@/src/utils/apriDocumentoRemoto";
import { formatEuro, parseNumeroIt, isoToDataIt } from "@/src/utils/formatoItaliano";

type CalcId =
  | "scadenze" | "parcelle"
  | "termini-memorie" | "interessi-legali" | "interessi-mora" | "contributo-unificato"
  | "rivalutazione-istat" | "rivalutazione-mensile" | "adeguamento-canone" | "interessi-vari-capitale-rivalutato"
  | "imposta-successione" | "compenso-ctu"
  | "termini-impugnazione" | "opposizione-decreto-ingiuntivo" | "prescrizione" | "termini-citazione"
  | "precetto" | "impugnazione-licenziamento" | "ricorso-tributario" | "ricorso-tar"
  | "termine-querela" | "disdetta-locazione" | "parametri-forensi" | "compenso-mediazione"
  | "giorni-tra-date"
  | "eta-anagrafica" | "aggiungi-giorni-lavorativi" | "termini-separazione-divorzio"
  | "termini-esecuzioni" | "termini-procedimento-semplificato" | "termini-deposito-appello" | "termini-deposito-ctu"
  | "scadenze-multe" | "prescrizione-reati" | "fine-pena" | "conversione-pena"
  | "interessi-acconti" | "interessi-corso-causa" | "interessi-mora-appalti" | "maggior-danno" | "pignoramento-stipendio-pensione"
  | "equo-indennizzo" | "compenso-curatore-fallimentare" | "compenso-delegati-vendite" | "compenso-mediatore-familiare" | "parametri-stragiudiziali"
  | "quote-ereditarie" | "usufrutto" | "valore-catastale" | "imposte-compravendita-immobiliare" | "tassa-registro-locazione"
  | "danno-biologico-lieve-entita" | "danno-biologico-macropermanenti" | "menomazioni-plurime"
  | "danno-perdita-parentale-milano" | "danno-perdita-parentale-roma" | "risarcimento-inail"
  | "devalutazione" | "inflazione" | "rivalutazione-storica" | "rivalutazione-annuale-media" | "coefficiente-rivalutazione-tfr"
  | "ammortamento-mutuo" | "surroga-mutuo" | "taeg" | "compenso-ore" | "ritenuta-acconto" | "scorporo-importi" | "imu"
  | "interessi-tasso-fisso" | "tasso-usura" | "calcolo-scadenze" | "termini-183-190" | "diritti-copia" | "diritti-copia-tributario" | "gratuito-patrocinio" | "parametri-penali-2014" | "parametri-penali-2012" | "parametri-civili-2012" | "spese-trasferta-avvocati" | "notula-penale-tariffario-2004" | "nota-spese-tariffe-2004" | "preventivo-stragiudiziale"
  | "fattura-avvocati" | "fattura-professionisti" | "fattura-enasarco" | "ricevuta-occasionale" | "tariffe-mediazione" | "calcolo-preventivo" | "aumenti-riduzioni-pena" | "grado-parentela";

// Campo di un calcolatore "generico": una lista di questi descrive un intero
// form (date, numeri, booleani, scelte multiple) senza dover scrivere una
// nuova schermata JSX per ciascuno. Usato dai 12 calcolatori sotto, che sono
// tutti un piccolo form -> un POST -> un risultato da mostrare (ed
// eventualmente da salvare come scadenza), senza logica particolare propria
// che giustifichi una schermata dedicata come quelle storiche sopra.
type CampoGenericoBase = { key: string; label: string; mostraSe?: (form: Record<string, any>) => boolean; nota?: (form: Record<string, any>) => string | null };
type CampoGenerico =
  | (CampoGenericoBase & { tipo: "data" })
  | (CampoGenericoBase & { tipo: "data_opzionale" })
  // Come "data" ma fa scegliere solo mese e anno, per i campi in cui il
  // backend ignora il giorno (adeguamento canone, devalutazione, inflazione,
  // rivalutazione TFR). Valore in forma "AAAA-MM".
  | (CampoGenericoBase & { tipo: "mese_anno" })
  | (CampoGenericoBase & { tipo: "numero"; default?: string })
  | (CampoGenericoBase & { tipo: "testo"; default?: string })
  | (CampoGenericoBase & { tipo: "bool"; default?: boolean })
  | (CampoGenericoBase & { tipo: "scelta"; opzioni: { value: string; label: string }[] | ((form: Record<string, any>) => { value: string; label: string }[]); default?: string; cercabile?: boolean })
  // Sola intestazione di sezione (nessun valore nel form): raggruppa più
  // campi "bool" sotto un'unica frase comune, invece di ripeterla in ogni
  // singola etichetta.
  | (CampoGenericoBase & { tipo: "titolo" })
  // Elenco di righe ripetibili (aggiungi/rimuovi), per i campi in cui il
  // backend si aspetta una lista di oggetti invece di un valore singolo
  // (es. acconti versati nel tempo, periodi di credito pena). Il valore nel
  // form è un array di oggetti {chiave: stringa}, uno per riga.
  | (CampoGenericoBase & { tipo: "lista"; campiRiga: CampoRigaLista[]; etichettaAggiungi?: string });

type ConfigGenerico = {
  campi: CampoGenerico[];
  endpoint: string | ((form: Record<string, any>) => string);
  buildBody?: (form: Record<string, any>) => any;
  validate?: (form: Record<string, any>) => string | null;
  risultato: (r: any) => [string, string][];
  scadenze?: (r: any) => { titolo: string; data: string }[];
};

// "Competenza per giurisdizione o materia" del calcolatore di riferimento (Preventivo avvocato
// civile): stessa tendina usata sia per il dato visualizzato nel documento
// sia, dove abbiamo una tabella DM 55/2014 verificata, per suggerire gli
// importi delle 4 fasi (vedi TABELLE_PARAMETRI_FORENSI nel backend — solo 4
// delle ~25 voci hanno oggi una tabella propria verificata: le altre restano
// selezionabili ma senza suggerimento automatico, da compilare a mano).
const COMPETENZE_PARCELLA: { value: string; label: string; rito: string | null }[] = [
  { value: "giudice_di_pace", label: "Giudice di pace", rito: "giudice_di_pace" },
  { value: "tribunale", label: "Giudizi di cognizione innanzi al tribunale", rito: "tribunale" },
  { value: "corte_dei_conti", label: "Corte dei Conti", rito: null },
  { value: "corte_appello", label: "Corte d'Appello", rito: "appello" },
  { value: "cassazione", label: "Corte di Cassazione", rito: "cassazione" },
  { value: "corte_costituzionale", label: "Corte Costituzionale", rito: null },
  { value: "corte_europea", label: "Corte Europea", rito: null },
  { value: "cgue", label: "Corte di Giustizia UE", rito: null },
  { value: "tar", label: "T.A.R.", rito: null },
  { value: "consiglio_di_stato", label: "Consiglio di Stato", rito: null },
  { value: "cgt_primo_grado", label: "Corte di Giustizia Tributaria di primo grado", rito: null },
  { value: "cgt_secondo_grado", label: "Corte di Giustizia Tributaria di secondo grado", rito: null },
  { value: "arbitrato", label: "Arbitrato", rito: null },
  { value: "cause_lavoro", label: "Cause di lavoro", rito: null },
  { value: "cause_previdenza", label: "Cause di previdenza", rito: null },
  { value: "convalida_locatizia", label: "Procedimenti per convalida locatizia", rito: null },
  { value: "atto_precetto", label: "Atto di precetto", rito: null },
  { value: "volontaria_giurisdizione", label: "Volontaria giurisdizione", rito: null },
  { value: "procedimenti_monitori", label: "Procedimenti monitori", rito: null },
  { value: "istruzione_preventiva", label: "Procedimenti di istruzione preventiva", rito: null },
  { value: "procedimenti_cautelari", label: "Procedimenti cautelari", rito: null },
  { value: "esecuzioni_mobiliari", label: "Esecuzioni mobiliari", rito: null },
  { value: "esecuzioni_presso_terzi", label: "Esecuzioni presso terzi, per consegna e rilascio", rito: null },
  { value: "esecuzioni_immobiliari", label: "Esecuzioni immobiliari", rito: null },
  { value: "iscrizione_ipotecaria", label: "Iscrizione ipotecaria / Affari tavolari", rito: null },
  { value: "fallimento", label: "Dichiarazione di fallimento", rito: null },
];

// Un campo "mese_anno" salva il valore in forma "AAAA-MM": questa funzione lo
// scompone nei due interi mese/anno richiesti dal backend.
function meseAnnoNum(v: string): { mese: number; anno: number } {
  const [anno, mese] = (v || "").split("-");
  return { mese: parseInt(mese, 10) || 0, anno: parseInt(anno, 10) || 0 };
}

// Solo per l'etichetta del dettaglio di "Rivalutazione TFR" qui sotto.
const MESI_IT_TFR = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];

// Tabelle del calcolatore "Parametri 2014 Penale" (DM 55/2014, compensi min/medio/max per fase), per mostrare gli importi accanto a ciascuna fase.
const TABELLE_PENALI_2014: Record<string, Record<string, Record<string, [number, number, number]>>> = {"2022":{"500":{"10":[189,378,567],"20":[237,473,710],"60":[378,756,1134],"90":[331,662,993]},"510":{"10":[426,851,1277],"20":[331,662,993],"60":[520,1040,1560],"90":[615,1229,1844]},"520":{"10":[426,851,1277],"60":[709,1418,2127]},"525":{"10":[189,378,567],"60":[237,473,710],"90":[355,709,1064]},"530":{"10":[189,378,567],"20":[615,1229,1844],"90":[709,1418,2127]},"540":{"10":[189,378,567],"20":[615,1229,1844],"90":[709,1418,2127]},"550":{"10":[426,851,1277],"20":[378,756,1134],"60":[520,1040,1560],"90":[709,1418,2127]},"560":{"10":[426,851,1277],"20":[378,756,1134],"60":[520,1040,1560],"90":[709,1418,2127]},"570":{"10":[237,473,710],"20":[284,567,851],"60":[567,1134,1701],"90":[709,1418,2127]},"580":{"10":[237,473,710],"20":[378,756,1134],"60":[709,1418,2127],"90":[709,1418,2127]},"590":{"10":[378,756,1134],"20":[709,1418,2127],"60":[1182,2363,3545],"90":[1418,2835,4253]},"600":{"10":[237,473,710],"20":[473,945,1418],"60":[709,1418,2127],"90":[709,1418,2127]},"610":{"10":[237,473,710],"20":[473,945,1418],"60":[709,1418,2127],"90":[709,1418,2127]},"615":{"10":[158,315,473],"20":[189,378,567],"90":[473,945,1418]},"620":{"10":[378,756,1134],"20":[993,1985,2978],"60":[1134,2268,3402],"90":[1168,2336,3504]},"630":{"10":[473,945,1418],"20":[1323,2646,3969],"90":[1371,2741,4112]},"640":{"10":[473,945,1418],"20":[1323,2646,3969],"90":[1371,2741,4112]}},"2014":{"500":{"10":[180,360,648],"20":[225,450,810],"60":[360,720,1296],"90":[315,630,1134]},"510":{"10":[405,810,1458],"20":[315,630,1134],"60":[495,990,1782],"90":[585,1170,2106]},"520":{"10":[405,810,1458],"60":[675,1350,2430]},"530":{"10":[180,360,648],"20":[585,1170,2106],"90":[675,1350,2430]},"540":{"10":[180,360,648],"20":[585,1170,2106],"90":[675,1350,2430]},"550":{"10":[405,810,1458],"20":[360,720,1296],"60":[495,990,1782],"90":[675,1350,2430]},"560":{"10":[405,810,1458],"20":[360,720,1296],"60":[495,990,1782],"90":[675,1350,2430]},"570":{"10":[225,450,810],"20":[270,540,972],"60":[540,1080,1944],"90":[675,1350,2430]},"580":{"10":[225,450,810],"20":[360,720,1296],"60":[675,1350,2430],"90":[675,1350,2430]},"590":{"10":[360,720,1296],"20":[675,1350,2430],"60":[1125,2250,4050],"90":[1350,2700,4860]},"600":{"10":[225,450,810],"20":[450,900,1620],"60":[675,1350,2430],"90":[675,1350,2430]},"610":{"10":[225,450,810],"20":[450,900,1620],"60":[675,1350,2430],"90":[675,1350,2430]},"620":{"10":[360,720,1296],"20":[945,1890,3402],"60":[1080,2160,3888],"90":[1113,2225,4005]},"630":{"10":[450,900,1620],"20":[1260,2520,4536],"90":[1305,2610,4698]},"640":{"10":[450,900,1620],"20":[1260,2520,4536],"90":[1305,2610,4698]}}};

const COMPETENZE_PENALI_2014: { value: string; label: string }[] = [
  { value: "500", label: "Giudice di pace" }, { value: "510", label: "Indagini preliminari" }, { value: "520", label: "Indagini difensive" },
  { value: "525", label: "Convalida dell'arresto" }, { value: "530", label: "Cautelari personali" }, { value: "540", label: "Cautelari reali" },
  { value: "550", label: "GIP" }, { value: "560", label: "GUP" }, { value: "570", label: "Tribunale monocratico" }, { value: "580", label: "Tribunale collegiale" },
  { value: "590", label: "Corte d'Assise" }, { value: "600", label: "Corte d'Appello" }, { value: "610", label: "Tribunale di sorveglianza" },
  { value: "615", label: "Magistrato di sorveglianza" }, { value: "620", label: "Corte d'Assise d'Appello" }, { value: "630", label: "Corte di Cassazione" },
  { value: "640", label: "Magistrature superiori" },
];
const FASI_PENALI_2014: { cod: string; nome: string }[] = [
  { cod: "10", nome: "Studio" }, { cod: "20", nome: "Introduttiva" }, { cod: "60", nome: "Istruttoria / dibattimentale" }, { cod: "90", nome: "Decisionale" },
];
function fasePenale2014(f: Record<string, any>, cod: string): [number, number, number] | null {
  return TABELLE_PENALI_2014[f.anno]?.[f.competenza]?.[cod] ?? null;
}
// Percentuale massima (e predefinita) di aumento per pluralità di parti (art. 12 c.2): +30% per ciascun soggetto oltre il primo fino a 10, poi +10% fino a 30.
function pctMaxPartiPenale2014(n: number): number {
  return n <= 1 ? 0 : 30 * (Math.min(n, 10) - 1) + 10 * Math.max(n - 10, 0);
}
function opzioniPctPartiPenale2014(f: Record<string, any>): { value: string; label: string }[] {
  const n = Math.min(30, Math.max(1, Math.round(parseNumeroIt(f.num_parti) || 1)));
  const mx = pctMaxPartiPenale2014(n);
  const out: { value: string; label: string }[] = [{ value: "", label: `${mx}% (massimo)` }];
  for (let p = mx - (mx > 270 ? 5 : 10); p >= 0; p -= p > 270 ? 5 : 10) out.push({ value: String(p), label: `${p}%` });
  return out;
}

// Tabelle del calcolatore "Parametri 2012 Penale" (DM 140/2012): minimo/medio/massimo per fase (l'esecutiva è una tariffa oraria).
const TABELLE_PENALI_2012: Record<string, Record<string, [number, number, number]>> = {"200":{"10":[120,240,960],"20":[240,480,720],"30":[216,720,1440],"40":[216,720,1080],"50":[8,16,24]},"210":{"10":[150,300,1200],"20":[300,600,900],"30":[270,900,1800],"40":[270,900,1350],"50":[10,20,30]},"220":{"10":[180,360,1440],"20":[360,720,1080],"30":[324,1080,2160],"40":[324,1080,1620],"50":[12,24,36]},"230":{"10":[180,360,1440],"20":[360,720,1080],"30":[324,1080,2160],"40":[324,1080,1620],"50":[12,24,36]},"240":{"10":[195,390,1560],"20":[390,780,1170],"30":[351,1170,2340],"40":[351,1170,1755],"50":[13,26,39]},"250":{"10":[375,750,3000],"20":[750,1500,2250],"30":[675,2250,4500],"40":[675,2250,3375],"50":[25,50,75]},"260":{"10":[240,480,1920],"20":[480,960,1440],"30":[432,1440,2880],"40":[432,1440,2160],"50":[16,32,48]},"270":{"10":[240,480,1920],"20":[480,960,1440],"30":[432,1440,2880],"40":[432,1440,2160],"50":[16,32,48]},"280":{"10":[390,780,3120],"20":[780,1560,2340],"30":[702,2340,4680],"40":[702,2340,3510],"50":[26,52,78]},"290":{"10":[480,960,3840],"20":[960,1920,2880],"30":[864,2880,5760],"40":[864,2880,4320],"50":[32,64,96]},"300":{"10":[480,960,3840],"20":[960,1920,2880],"30":[864,2880,5760],"40":[864,2880,4320],"50":[32,64,96]}};
const COMPETENZE_PENALI_2012: { value: string; label: string }[] = [
  { value: "200", label: "Giudice di pace" }, { value: "210", label: "Tribunale monocratico" }, { value: "220", label: "Procedimenti davanti al GIP" },
  { value: "230", label: "Procedimenti davanti al GUP" }, { value: "240", label: "Tribunale penale collegiale" }, { value: "250", label: "Corte d'Assise" },
  { value: "260", label: "Corte d'Appello" }, { value: "270", label: "Tribunale di sorveglianza" }, { value: "280", label: "Corte d'Assise d'Appello" },
  { value: "290", label: "Corte di Cassazione" }, { value: "300", label: "Magistrature superiori" },
];
const FASI_PENALI_2012: { cod: string; nome: string; orario?: boolean }[] = [
  { cod: "10", nome: "Studio" }, { cod: "20", nome: "Introduttiva" }, { cod: "30", nome: "Istruttoria" }, { cod: "40", nome: "Decisoria" }, { cod: "50", nome: "Esecutiva", orario: true },
];
const OPZIONI_PCT_5_100 = Array.from({ length: 20 }, (_, i) => ({ value: String(100 - i * 5), label: `${100 - i * 5}%` }));

// Tabelle del calcolatore "Parametri 2012 Civile" (DM 140/2012) per competenza e scaglione di valore.
const TABELLE_CIVILI_2012: Record<string, Record<string, Record<string, [number, number, number]>>> = {"10":{"100":{"10":[120,300,450],"20":[60,150,225],"30":[60,300,600],"40":[120,400,520]},"110":{"10":[165,330,528],"20":[90,180,288],"30":[99,330,825],"40":[210,420,672]}},"20":{"10":{"10":[275,550,880],"20":[150,300,480],"30":[165,550,1375],"40":[350,700,1120],"60":[200,400,640],"70":[450,900,1440],"80":[180,360,576],"90":[160,320,512]},"20":{"10":[600,1200,1920],"20":[300,600,960],"30":[360,1200,3000],"40":[750,1500,2400],"60":[400,800,1280],"70":[900,1800,2880],"80":[360,720,1152],"90":[320,640,1024]},"30":{"10":[950,1900,3040],"20":[500,1000,1600],"30":[600,2000,5000],"40":[1300,2600,4160],"60":[650,1300,2080],"70":[1450,2900,4640],"80":[585,1170,1872],"90":[520,1040,1664]},"40":{"10":[1625,3250,5200],"20":[825,1650,2640],"30":[975,3250,8125],"40":[2025,4050,6480],"60":[1050,2100,3360],"70":[2400,4800,7680],"80":[945,1890,3024],"90":[840,1680,2688]},"50":{"10":[2700,5400,8640],"20":[1350,2700,4320],"30":[1620,5400,13500],"40":[3375,6750,10800],"60":[1800,3600,5760],"70":[4050,8100,12960],"80":[1620,3240,5184],"90":[1440,2880,4608]},"60":{"10":[2700,5400,8640],"20":[1350,2700,4320],"30":[1620,5400,13500],"40":[3375,6750,10800],"60":[1800,3600,5760],"70":[4050,8100,12960],"80":[1620,3240,5184],"90":[1440,2880,4608]},"999":{"10":[600,1200,3000],"20":[300,600,1500],"30":[600,1200,3000],"40":[750,1500,3750],"60":[400,800,2000],"70":[900,1800,4500],"80":[360,720,1800],"90":[320,640,1600]}},"30":{"10":{"10":[275,550,880],"20":[150,300,480],"30":[165,550,1375],"40":[350,700,1120],"60":[200,400,640],"70":[450,900,1440],"80":[180,360,576],"90":[160,320,512]},"20":{"10":[600,1200,1920],"20":[300,600,960],"30":[360,1200,3000],"40":[750,1500,2400],"60":[400,800,1280],"70":[900,1800,2880],"80":[360,720,1152],"90":[320,640,1024]},"30":{"10":[950,1900,3040],"20":[500,1000,1600],"30":[600,2000,5000],"40":[1300,2600,4160],"60":[650,1300,2080],"70":[1450,2900,4640],"80":[585,1170,1872],"90":[520,1040,1664]},"40":{"10":[1625,3250,5200],"20":[825,1650,2640],"30":[975,3250,8125],"40":[2025,4050,6480],"60":[1050,2100,3360],"70":[2400,4800,7680],"80":[945,1890,3024],"90":[840,1680,2688]},"50":{"10":[2700,5400,8640],"20":[1350,2700,4320],"30":[1620,5400,13500],"40":[3375,6750,10800],"60":[1800,3600,5760],"70":[4050,8100,12960],"80":[1620,3240,5184],"90":[1440,2880,4608]},"60":{"10":[2700,5400,8640],"20":[1350,2700,4320],"30":[1620,5400,13500],"40":[3375,6750,10800],"60":[1800,3600,5760],"70":[4050,8100,12960],"80":[1620,3240,5184],"90":[1440,2880,4608]},"999":{"10":[600,1200,3000],"20":[300,600,1500],"30":[600,1200,3000],"40":[750,1500,3750],"60":[400,800,2000],"70":[900,1800,4500],"80":[360,720,1800],"90":[320,640,1600]}},"40":{"10":{"10":[330,660,1056],"20":[180,360,576],"30":[198,660,1650],"40":[420,840,1344],"60":[240,480,768],"70":[540,1080,1728],"80":[216,432,691],"90":[192,384,614]},"20":{"10":[720,1440,2304],"20":[360,720,1152],"30":[432,1440,3600],"40":[900,1800,2880],"60":[480,960,1536],"70":[1080,2160,3456],"80":[432,864,1382],"90":[384,768,1229]},"30":{"10":[1140,2280,3648],"20":[600,1200,1920],"30":[720,2400,6000],"40":[1560,3120,4992],"60":[780,1560,2496],"70":[1740,3480,5568],"80":[702,1404,2246],"90":[624,1248,1997]},"40":{"10":[1950,3900,6240],"20":[990,1980,3168],"30":[1170,3900,9750],"40":[2430,4860,7776],"60":[1260,2520,4032],"70":[2880,5760,9216],"80":[1134,2268,3629],"90":[1008,2016,3226]},"50":{"10":[3240,6480,10368],"20":[1620,3240,5184],"30":[1944,6480,16200],"40":[4050,8100,12960],"60":[2160,4320,6912],"70":[4860,9720,15552],"80":[1944,3888,6221],"90":[1728,3456,5530]},"60":{"10":[3240,6480,10368],"20":[1620,3240,5184],"30":[1944,6480,16200],"40":[4050,8100,12960],"60":[2160,4320,6912],"70":[4860,9720,15552],"80":[1944,3888,6221],"90":[1728,3456,5530]},"999":{"10":[720,1440,3600],"20":[360,720,1800],"30":[720,1440,3600],"40":[900,1800,4500],"60":[480,960,2400],"70":[1080,2160,5400],"80":[432,864,2160],"90":[384,768,1920]}},"50":{"10":{"10":[330,660,1056],"20":[180,360,576],"30":[198,660,1650],"40":[420,840,1344],"60":[240,480,768],"70":[540,1080,1728],"80":[216,432,691],"90":[192,384,614]},"20":{"10":[720,1440,2304],"20":[360,720,1152],"30":[432,1440,3600],"40":[900,1800,2880],"60":[480,960,1536],"70":[1080,2160,3456],"80":[432,864,1382],"90":[384,768,1229]},"30":{"10":[1140,2280,3648],"20":[600,1200,1920],"30":[720,2400,6000],"40":[1560,3120,4992],"60":[780,1560,2496],"70":[1740,3480,5568],"80":[702,1404,2246],"90":[624,1248,1997]},"40":{"10":[1950,3900,6240],"20":[990,1980,3168],"30":[1170,3900,9750],"40":[2430,4860,7776],"60":[1260,2520,4032],"70":[2880,5760,9216],"80":[1134,2268,3629],"90":[1008,2016,3226]},"50":{"10":[3240,6480,10368],"20":[1620,3240,5184],"30":[1944,6480,16200],"40":[4050,8100,12960],"60":[2160,4320,6912],"70":[4860,9720,15552],"80":[1944,3888,6221],"90":[1728,3456,5530]},"60":{"10":[3240,6480,10368],"20":[1620,3240,5184],"30":[1944,6480,16200],"40":[4050,8100,12960],"60":[2160,4320,6912],"70":[4860,9720,15552],"80":[1944,3888,6221],"90":[1728,3456,5530]},"999":{"10":[720,1440,3600],"20":[360,720,1800],"30":[720,1440,3600],"40":[900,1800,4500],"60":[480,960,2400],"70":[1080,2160,5400],"80":[432,864,2160],"90":[384,768,1920]}},"60":{"10":{"10":[330,660,1056],"20":[180,360,576],"30":[198,660,1650],"40":[420,840,1344],"60":[240,480,768],"70":[540,1080,1728],"80":[216,432,691],"90":[192,384,614]},"20":{"10":[720,1440,2304],"20":[360,720,1152],"30":[432,1440,3600],"40":[900,1800,2880],"60":[480,960,1536],"70":[1080,2160,3456],"80":[432,864,1382],"90":[384,768,1229]},"30":{"10":[1140,2280,3648],"20":[600,1200,1920],"30":[720,2400,6000],"40":[1560,3120,4992],"60":[780,1560,2496],"70":[1740,3480,5568],"80":[702,1404,2246],"90":[624,1248,1997]},"40":{"10":[1950,3900,6240],"20":[990,1980,3168],"30":[1170,3900,9750],"40":[2430,4860,7776],"60":[1260,2520,4032],"70":[2880,5760,9216],"80":[1134,2268,3629],"90":[1008,2016,3226]},"50":{"10":[3240,6480,10368],"20":[1620,3240,5184],"30":[1944,6480,16200],"40":[4050,8100,12960],"60":[2160,4320,6912],"70":[4860,9720,15552],"80":[1944,3888,6221],"90":[1728,3456,5530]},"60":{"10":[3240,6480,10368],"20":[1620,3240,5184],"30":[1944,6480,16200],"40":[4050,8100,12960],"60":[2160,4320,6912],"70":[4860,9720,15552],"80":[1944,3888,6221],"90":[1728,3456,5530]},"999":{"10":[720,1440,3600],"20":[360,720,1800],"30":[720,1440,3600],"40":[900,1800,4500],"60":[480,960,2400],"70":[1080,2160,5400],"80":[432,864,2160],"90":[384,768,1920]}},"70":{"10":{"10":[360,720,1224],"20":[225,450,720],"40":[428,855,1454]},"20":{"10":[800,1600,2720],"20":[500,1000,1600],"40":[950,1900,3230]},"30":{"10":[1320,2640,4488],"20":[825,1650,2640],"40":[1568,3135,5330]},"40":{"10":[2160,4320,7344],"20":[1350,2700,4320],"40":[2565,5130,8721]},"50":{"10":[3600,7200,12240],"20":[2250,4500,7200],"40":[4275,8550,14535]},"60":{"10":[3600,7200,12240],"20":[2250,4500,7200],"40":[4275,8550,14535]},"999":{"10":[800,1600,4000],"20":[500,1000,2500],"40":[950,1900,4750]}},"80":{"10":{"10":[360,720,1224],"20":[225,450,720],"40":[428,855,1454]},"20":{"10":[800,1600,2720],"20":[500,1000,1600],"40":[950,1900,3230]},"30":{"10":[1320,2640,4488],"20":[825,1650,2640],"40":[1568,3135,5330]},"40":{"10":[2160,4320,7344],"20":[1350,2700,4320],"40":[2565,5130,8721]},"50":{"10":[3600,7200,12240],"20":[2250,4500,7200],"40":[4275,8550,14535]},"60":{"10":[3600,7200,12240],"20":[2250,4500,7200],"40":[4275,8550,14535]},"999":{"10":[800,1600,4000],"20":[500,1000,2500],"40":[950,1900,4750]}},"90":{"10":{"10":[360,720,1224],"20":[225,450,720],"40":[428,855,1454]},"20":{"10":[800,1600,2720],"20":[500,1000,1600],"40":[950,1900,3230]},"30":{"10":[1320,2640,4488],"20":[825,1650,2640],"40":[1568,3135,5330]},"40":{"10":[2160,4320,7344],"20":[1350,2700,4320],"40":[2565,5130,8721]},"50":{"10":[3600,7200,12240],"20":[2250,4500,7200],"40":[4275,8550,14535]},"60":{"10":[3600,7200,12240],"20":[2250,4500,7200],"40":[4275,8550,14535]},"999":{"10":[800,1600,4000],"20":[500,1000,2500],"40":[950,1900,4750]}},"100":{"10":{"10":[360,720,1224],"20":[225,450,720],"40":[428,855,1454]},"20":{"10":[800,1600,2720],"20":[500,1000,1600],"40":[950,1900,3230]},"30":{"10":[1320,2640,4488],"20":[825,1650,2640],"40":[1568,3135,5330]},"40":{"10":[2160,4320,7344],"20":[1350,2700,4320],"40":[2565,5130,8721]},"50":{"10":[3600,7200,12240],"20":[2250,4500,7200],"40":[4275,8550,14535]},"60":{"10":[3600,7200,12240],"20":[2250,4500,7200],"40":[4275,8550,14535]},"999":{"10":[800,1600,4000],"20":[500,1000,2500],"40":[950,1900,4750]}},"110":{"10":{"10":[383,765,1301],"20":[248,495,792],"40":[450,900,1530]},"20":{"10":[850,1700,2890],"20":[550,1100,1760],"40":[1000,2000,3400]},"30":{"10":[1403,2805,4769],"20":[908,1815,2904],"40":[1650,3300,5610]},"40":{"10":[2295,4590,7803],"20":[1485,2970,4752],"40":[2700,5400,9180]},"50":{"10":[3825,7650,13005],"20":[2475,4950,7920],"40":[4500,9000,15300]},"60":{"10":[3825,7650,13005],"20":[2475,4950,7920],"40":[4500,9000,15300]},"999":{"10":[850,1700,4250],"20":[550,1100,2750],"40":[1000,2000,5000]}},"120":{"10":{"10":[383,765,1301],"20":[248,495,792],"40":[450,900,1530]},"20":{"10":[850,1700,2890],"20":[550,1100,1760],"40":[1000,2000,3400]},"30":{"10":[1403,2805,4769],"20":[908,1815,2904],"40":[1650,3300,5610]},"40":{"10":[2295,4590,7803],"20":[1485,2970,4752],"40":[2700,5400,9180]},"50":{"10":[3825,7650,13005],"20":[2475,4950,7920],"40":[4500,9000,15300]},"60":{"10":[3825,7650,13005],"20":[2475,4950,7920],"40":[4500,9000,15300]},"999":{"10":[850,1700,4250],"20":[550,1100,2750],"40":[1000,2000,5000]}},"130":{"200":{"0":[50,375,700]},"210":{"0":[400,1200,2000]},"220":{"0":[1000,1750,2500]}},"140":{"300":{"0":[20,60,100]},"310":{"0":[150,250,350]},"320":{"0":[400,500,600]},"330":{"0":[700,800,900]}}};
const SCAGLIONI_CIVILI_2012: Record<string, { value: string; label: string }[]> = {"10":[{"value":"100","label":"Fino a € 5.000"},{"value":"110","label":"Da € 5.001 a € 25.000"}],"20":[{"value":"10","label":"Fino a € 25.000"},{"value":"20","label":"Da € 25.001 a € 50.000"},{"value":"30","label":"Da € 50.001 a € 100.000"},{"value":"40","label":"Da € 100.001 a € 500.000"},{"value":"50","label":"Da € 500.001 a € 1.500.000"},{"value":"60","label":"Oltre € 1.500.000"},{"value":"999","label":"Indeterminato / indeterminabile"}],"30":[{"value":"10","label":"Fino a € 25.000"},{"value":"20","label":"Da € 25.001 a € 50.000"},{"value":"30","label":"Da € 50.001 a € 100.000"},{"value":"40","label":"Da € 100.001 a € 500.000"},{"value":"50","label":"Da € 500.001 a € 1.500.000"},{"value":"60","label":"Oltre € 1.500.000"},{"value":"999","label":"Indeterminato / indeterminabile"}],"40":[{"value":"10","label":"Fino a € 25.000"},{"value":"20","label":"Da € 25.001 a € 50.000"},{"value":"30","label":"Da € 50.001 a € 100.000"},{"value":"40","label":"Da € 100.001 a € 500.000"},{"value":"50","label":"Da € 500.001 a € 1.500.000"},{"value":"60","label":"Oltre € 1.500.000"},{"value":"999","label":"Indeterminato / indeterminabile"}],"50":[{"value":"10","label":"Fino a € 25.000"},{"value":"20","label":"Da € 25.001 a € 50.000"},{"value":"30","label":"Da € 50.001 a € 100.000"},{"value":"40","label":"Da € 100.001 a € 500.000"},{"value":"50","label":"Da € 500.001 a € 1.500.000"},{"value":"60","label":"Oltre € 1.500.000"},{"value":"999","label":"Indeterminato / indeterminabile"}],"60":[{"value":"10","label":"Fino a € 25.000"},{"value":"20","label":"Da € 25.001 a € 50.000"},{"value":"30","label":"Da € 50.001 a € 100.000"},{"value":"40","label":"Da € 100.001 a € 500.000"},{"value":"50","label":"Da € 500.001 a € 1.500.000"},{"value":"60","label":"Oltre € 1.500.000"},{"value":"999","label":"Indeterminato / indeterminabile"}],"70":[{"value":"10","label":"Fino a € 25.000"},{"value":"20","label":"Da € 25.001 a € 50.000"},{"value":"30","label":"Da € 50.001 a € 100.000"},{"value":"40","label":"Da € 100.001 a € 500.000"},{"value":"50","label":"Da € 500.001 a € 1.500.000"},{"value":"60","label":"Oltre € 1.500.000"},{"value":"999","label":"Indeterminato / indeterminabile"}],"80":[{"value":"10","label":"Fino a € 25.000"},{"value":"20","label":"Da € 25.001 a € 50.000"},{"value":"30","label":"Da € 50.001 a € 100.000"},{"value":"40","label":"Da € 100.001 a € 500.000"},{"value":"50","label":"Da € 500.001 a € 1.500.000"},{"value":"60","label":"Oltre € 1.500.000"},{"value":"999","label":"Indeterminato / indeterminabile"}],"90":[{"value":"10","label":"Fino a € 25.000"},{"value":"20","label":"Da € 25.001 a € 50.000"},{"value":"30","label":"Da € 50.001 a € 100.000"},{"value":"40","label":"Da € 100.001 a € 500.000"},{"value":"50","label":"Da € 500.001 a € 1.500.000"},{"value":"60","label":"Oltre € 1.500.000"},{"value":"999","label":"Indeterminato / indeterminabile"}],"100":[{"value":"10","label":"Fino a € 25.000"},{"value":"20","label":"Da € 25.001 a € 50.000"},{"value":"30","label":"Da € 50.001 a € 100.000"},{"value":"40","label":"Da € 100.001 a € 500.000"},{"value":"50","label":"Da € 500.001 a € 1.500.000"},{"value":"60","label":"Oltre € 1.500.000"},{"value":"999","label":"Indeterminato / indeterminabile"}],"110":[{"value":"10","label":"Fino a € 25.000"},{"value":"20","label":"Da € 25.001 a € 50.000"},{"value":"30","label":"Da € 50.001 a € 100.000"},{"value":"40","label":"Da € 100.001 a € 500.000"},{"value":"50","label":"Da € 500.001 a € 1.500.000"},{"value":"60","label":"Oltre € 1.500.000"},{"value":"999","label":"Indeterminato / indeterminabile"}],"120":[{"value":"10","label":"Fino a € 25.000"},{"value":"20","label":"Da € 25.001 a € 50.000"},{"value":"30","label":"Da € 50.001 a € 100.000"},{"value":"40","label":"Da € 100.001 a € 500.000"},{"value":"50","label":"Da € 500.001 a € 1.500.000"},{"value":"60","label":"Oltre € 1.500.000"},{"value":"999","label":"Indeterminato / indeterminabile"}],"130":[{"value":"200","label":"Fino a € 5.000"},{"value":"210","label":"Da € 5.001 a € 500.000"},{"value":"220","label":"Da € 500.001 a € 1.500.000"}],"140":[{"value":"300","label":"Fino a € 5.000"},{"value":"310","label":"Da € 5.001 a € 500.000"},{"value":"320","label":"Da € 500.001 a € 1.500.000"},{"value":"330","label":"Oltre € 1.500.000"}]};
const COMPETENZE_CIVILI_2012: { value: string; label: string }[] = [{"value":"10","label":"Giudice di pace civile"},{"value":"20","label":"Tribunale ordinario civile"},{"value":"30","label":"Commissione tributaria di I° grado"},{"value":"40","label":"T.A.R."},{"value":"50","label":"Corte d'Appello"},{"value":"60","label":"Commissione tributaria regionale"},{"value":"70","label":"Corte di Cassazione"},{"value":"80","label":"Consiglio di Stato"},{"value":"90","label":"Magistrature superiori"},{"value":"100","label":"Tribunale di prima istanza UE"},{"value":"110","label":"Corte Costituzionale"},{"value":"120","label":"Altri organi sovranazionali"},{"value":"130","label":"Procedimento per ingiunzione"},{"value":"140","label":"Precetto"}];
const FASI_CIVILI_2012: { cod: string; nome: string }[] = [
  { cod: "0", nome: "Fase unica" }, { cod: "10", nome: "Studio" }, { cod: "20", nome: "Introduttiva" }, { cod: "30", nome: "Istruttoria" }, { cod: "40", nome: "Decisoria" },
  { cod: "60", nome: "Esecutiva mobiliare" }, { cod: "70", nome: "Esecutiva immobiliare" }, { cod: "80", nome: "Espropriazione presso terzi, consegna o rilascio" }, { cod: "90", nome: "Affari tavolari" },
];
function faseCivile2012(f: Record<string, any>, cod: string): [number, number, number] | null {
  return TABELLE_CIVILI_2012[f.competenza]?.[f.scaglione]?.[cod] ?? null;
}

// Tariffario penale 2004 (attività per competenza, tariffe minima/media/massima) per il calcolatore "Calcolo Notula Penale".
const NOTULA_PENALE_2004: Record<string, { nome: string; att: [string, string, number, number, number][] }> = {"11":{"nome":"Giudice di Pace","att":[["1.1","Corrispondenza informativa",6.0,8.0,10.0],["1.2","Consultazione con il cliente in studio",19.0,29.0,39.0],["1.3a","Consultazione con il cliente fuori studio",39.0,58.0,77.0],["1.3b","Congresso con collega",39.0,58.0,77.0],["1.3c","Congresso con consulente",39.0,58.0,77.0],["1.3d","Congresso con investigatore",39.0,58.0,77.0],["1.3e","Congresso con magistrato",39.0,58.0,77.0],["2.","Esame e studio",20.0,27.5,35.0],["3.1","Colloquio con persona informata dei fatti",50.0,150.0,250.0],["3.2","Assunzione di informazioni",50.0,150.0,250.0],["3.3","Ricezione di dichiarazioni",50.0,150.0,250.0],["3.4","Richiesta di documentazione",50.0,150.0,250.0],["3.5","Richiesta di accesso a luoghi",50.0,150.0,250.0],["3.6","Accertamenti tecnici",50.0,150.0,250.0],["3.7","Produzione di documenti",50.0,150.0,250.0],["4.1","Accesso al carcere",10.0,13.0,16.0],["4.2","Accesso agli uffici",10.0,13.0,16.0],["4.3","Accesso a luoghi inerenti ai fatti",10.0,13.0,16.0],["4.4","Indennita' di attesa",10.0,13.0,16.0],["5.1","Assistenza nelle indagini preliminari",20.0,27.5,35.0],["5.2","Ricerca e formazione mezzi di prova",20.0,27.5,35.0],["6.1a","Partecipazione in camera di consiglio",30.0,45.0,60.0],["6.1b","Partecipazione udienza dibattimentale",30.0,45.0,60.0],["6.2","Esercizio attivita' difensive",50.0,150.0,250.0],["6.3","Discussione orale",60.0,180.0,300.0],["7.1a","Redazione esposto",50.0,140.0,230.0],["7.1b","Redazione denuncia",50.0,140.0,230.0],["7.1c","Redazione querela",50.0,140.0,230.0],["7.2a","Redazione istanza o richiesta",50.0,140.0,230.0],["7.2b","Redazione opposizione",50.0,140.0,230.0],["7.2c","Redazione dichiarazione difensiva",50.0,140.0,230.0],["7.2d","Redazione ricorso immediato al G.d.P.",50.0,140.0,230.0],["7.3","Redazione lista testi e consulenti",50.0,140.0,230.0],["7.4","Redazione citazione e notifica",20.0,35.0,50.0],["7.5","Redazione impugnazione",0.0,60.0,180.0],["7.6","Redazione memoria",60.0,180.0,300.0],["7.7","Redazione parere che esaurisca l'attivita'",60.0,180.0,300.0],["8.","Indennita' di trasferta",10.0,20.0,30.0]]},"12":{"nome":"G.I.P.","att":[["1.1","Corrispondenza informativa",8.0,12.0,16.0],["1.2","Consultazione con il cliente in studio",24.0,44.5,65.0],["1.3a","Consultazione con il cliente fuori studio",48.0,88.5,129.0],["1.3b","Congresso con collega",48.0,88.5,129.0],["1.3c","Congresso con consulente",48.0,88.5,129.0],["1.3d","Congresso con investigatore",48.0,88.5,129.0],["1.3e","Congresso con magistrato",48.0,88.5,129.0],["2.","Esame e studio",25.0,42.5,60.0],["3.1","Colloquio con persona informata dei fatti",60.0,217.5,375.0],["3.2","Assunzione di informazioni",60.0,217.5,375.0],["3.3","Ricezione di dichiarazioni",60.0,217.5,375.0],["3.4","Richiesta di documentazione",60.0,217.5,375.0],["3.5","Richiesta di accesso a luoghi",60.0,217.5,375.0],["3.6","Accertamenti tecnici",60.0,217.5,375.0],["3.7","Produzione di documenti",60.0,217.5,375.0],["4.1","Accesso al carcere",13.0,19.5,26.0],["4.2","Accesso agli uffici",13.0,19.5,26.0],["4.3","Accesso a luoghi inerenti ai fatti",13.0,19.5,26.0],["4.4","Indennita' di attesa",13.0,19.5,26.0],["5.1","Assistenza nelle indagini preliminari",30.0,45.0,60.0],["5.2","Ricerca e formazione mezzi di prova",30.0,45.0,60.0],["6.1a","Partecipazione in camera di consiglio",40.0,65.0,90.0],["6.1b","Partecipazione udienza dibattimentale",40.0,65.0,90.0],["6.2","Esercizio attivita' difensive",75.0,225.0,375.0],["6.3","Discussione orale",115.0,282.5,450.0],["7.1a","Redazione esposto",60.0,202.5,345.0],["7.1b","Redazione denuncia",60.0,202.5,345.0],["7.1c","Redazione querela",60.0,202.5,345.0],["7.2a","Redazione istanza o richiesta",60.0,202.5,345.0],["7.2b","Redazione opposizione",60.0,202.5,345.0],["7.2c","Redazione dichiarazione difensiva",60.0,202.5,345.0],["7.2d","Redazione ricorso immediato al G.d.P.",60.0,202.5,345.0],["7.3","Redazione lista testi e consulenti",60.0,202.5,345.0],["7.4","Redazione citazione e notifica",25.0,50.0,75.0],["7.5","Redazione impugnazione",0.0,90.0,270.0],["7.6","Redazione memoria",90.0,270.0,450.0],["7.7","Redazione parere che esaurisca l'attivita'",90.0,270.0,450.0],["8.","Indennita' di trasferta",10.0,20.0,30.0]]},"13":{"nome":"G.U.P","att":[["1.1","Corrispondenza informativa",8.0,12.0,16.0],["1.2","Consultazione con il cliente in studio",24.0,44.5,65.0],["1.3a","Consultazione con il cliente fuori studio",48.0,88.5,129.0],["1.3b","Congresso con collega",48.0,88.5,129.0],["1.3c","Congresso con consulente",48.0,88.5,129.0],["1.3d","Congresso con investigatore",48.0,88.5,129.0],["1.3e","Congresso con magistrato",48.0,88.5,129.0],["2.","Esame e studio",25.0,42.5,60.0],["3.1","Colloquio con persona informata dei fatti",60.0,217.5,375.0],["3.2","Assunzione di informazioni",60.0,217.5,375.0],["3.3","Ricezione di dichiarazioni",60.0,217.5,375.0],["3.4","Richiesta di documentazione",60.0,217.5,375.0],["3.5","Richiesta di accesso a luoghi",60.0,217.5,375.0],["3.6","Accertamenti tecnici",60.0,217.5,375.0],["3.7","Produzione di documenti",60.0,217.5,375.0],["4.1","Accesso al carcere",13.0,19.5,26.0],["4.2","Accesso agli uffici",13.0,19.5,26.0],["4.3","Accesso a luoghi inerenti ai fatti",13.0,19.5,26.0],["4.4","Indennita' di attesa",13.0,19.5,26.0],["5.1","Assistenza nelle indagini preliminari",30.0,45.0,60.0],["5.2","Ricerca e formazione mezzi di prova",30.0,45.0,60.0],["6.1a","Partecipazione in camera di consiglio",40.0,65.0,90.0],["6.1b","Partecipazione udienza dibattimentale",40.0,65.0,90.0],["6.2","Esercizio attivita' difensive",75.0,225.0,375.0],["6.3","Discussione orale",115.0,282.5,450.0],["7.1a","Redazione esposto",60.0,202.5,345.0],["7.1b","Redazione denuncia",60.0,202.5,345.0],["7.1c","Redazione querela",60.0,202.5,345.0],["7.2a","Redazione istanza o richiesta",60.0,202.5,345.0],["7.2b","Redazione opposizione",60.0,202.5,345.0],["7.2c","Redazione dichiarazione difensiva",60.0,202.5,345.0],["7.2d","Redazione ricorso immediato al G.d.P.",60.0,202.5,345.0],["7.3","Redazione lista testi e consulenti",60.0,202.5,345.0],["7.4","Redazione citazione e notifica",25.0,50.0,75.0],["7.5","Redazione impugnazione",0.0,90.0,270.0],["7.6","Redazione memoria",90.0,270.0,450.0],["7.7","Redazione parere che esaurisca l'attivita'",90.0,270.0,450.0],["8.","Indennita' di trasferta",10.0,20.0,30.0]]},"1":{"nome":"Tribunale Monocratico","att":[["1.1","Corrispondenza informativa",8.0,10.0,12.0],["1.2","Consultazione con il cliente in studio",24.0,36.0,48.0],["1.3a","Consultazione con il cliente fuori studio",48.0,72.5,97.0],["1.3b","Congresso con collega",48.0,72.5,97.0],["1.3c","Congresso con consulente",48.0,72.5,97.0],["1.3d","Congresso con investigatore",48.0,72.5,97.0],["1.3c","Congresso con magistrato",48.0,72.5,97.0],["2.","Esame e studio",25.0,35.0,45.0],["3.1","Colloquio con persona informata dei fatti",60.0,170.0,280.0],["3.2","Assunzione di informazioni",60.0,170.0,280.0],["3.3","Ricezione di dichiarazioni",60.0,170.0,280.0],["3.4","Richiesta di documentazione",60.0,170.0,280.0],["3.5","Richiesta di accesso a luoghi",60.0,170.0,280.0],["3.6","Accertamenti tecnici",60.0,170.0,280.0],["3.7","Produzione di documenti",60.0,170.0,280.0],["4.1","Accesso al carcere",13.0,16.0,19.0],["4.2","Accesso agli uffici",13.0,16.0,19.0],["4.3","Accesso a luoghi inerenti ai fatti",13.0,16.0,19.0],["4.4","Indennita' di attesa",13.0,16.0,19.0],["5.1","Assistenza nelle indagini preliminari",30.0,37.5,45.0],["5.2","Ricerca e formazione mezzi di prova",30.0,37.5,45.0],["6.1a","Partecipazione in camera di consiglio",40.0,52.5,65.0],["6.1b","Partecipazione udienza dibattimentale",40.0,52.5,65.0],["6.2","Esercizio attivita' difensive",75.0,177.5,280.0],["6.3","Discussione orale",115.0,225.0,335.0],["7.1a","Redazione esposto",60.0,157.5,255.0],["7.1b","Redazione denuncia",60.0,157.5,255.0],["7.1c","Redazione querela",60.0,157.5,255.0],["7.2a","Redazione istanza o richiesta",60.0,157.5,255.0],["7.2b","Redazione opposizione",60.0,157.5,255.0],["7.2c","Redazione dichiarazione difensiva",60.0,157.5,255.0],["7.2d","Redazione ricorso immediato al G.d.P.",60.0,157.5,255.0],["7.3","Redazione lista testi e consulenti",60.0,157.5,255.0],["7.4","Redazione citazione e notifica",25.0,40.0,55.0],["7.5","Redazione impugnazione",90.0,270.0,450.0],["7.6","Redazione memoria",70.0,202.5,335.0],["7.7","Redazione parere che esaurisca l'attivita'",70.0,202.5,335.0],["8.","Indennita' di trasferta",10.0,20.0,30.0]]},"3":{"nome":"Magistrato di Sorveglianza","att":[["1.1","Corrispondenza informativa",8.0,10.0,12.0],["1.2","Consultazione con il cliente in studio",24.0,36.0,48.0],["1.3a","Consultazione con il cliente fuori studio",48.0,72.5,97.0],["1.3b","Congresso con collega",48.0,72.5,97.0],["1.3c","Congresso con consulente",48.0,72.5,97.0],["1.3d","Congresso con investigatore",48.0,72.5,97.0],["1.3c","Congresso con magistrato",48.0,72.5,97.0],["2.","Esame e studio",25.0,35.0,45.0],["3.1","Colloquio con persona informata dei fatti",60.0,170.0,280.0],["3.2","Assunzione di informazioni",60.0,170.0,280.0],["3.3","Ricezione di dichiarazioni",60.0,170.0,280.0],["3.4","Richiesta di documentazione",60.0,170.0,280.0],["3.5","Richiesta di accesso a luoghi",60.0,170.0,280.0],["3.6","Accertamenti tecnici",60.0,170.0,280.0],["3.7","Produzione di documenti",60.0,170.0,280.0],["4.1","Accesso al carcere",13.0,16.0,19.0],["4.2","Accesso agli uffici",13.0,16.0,19.0],["4.3","Accesso a luoghi inerenti ai fatti",13.0,16.0,19.0],["4.4","Indennita' di attesa",13.0,16.0,19.0],["5.1","Assistenza nelle indagini preliminari",30.0,37.5,45.0],["5.2","Ricerca e formazione mezzi di prova",30.0,37.5,45.0],["6.1a","Partecipazione in camera di consiglio",40.0,52.5,65.0],["6.1b","Partecipazione udienza dibattimentale",40.0,52.5,65.0],["6.2","Esercizio attivita' difensive",75.0,177.5,280.0],["6.3","Discussione orale",115.0,225.0,335.0],["7.1a","Redazione esposto",60.0,157.5,255.0],["7.1b","Redazione denuncia",60.0,157.5,255.0],["7.1c","Redazione querela",60.0,157.5,255.0],["7.2a","Redazione istanza o richiesta",60.0,157.5,255.0],["7.2b","Redazione opposizione",60.0,157.5,255.0],["7.2c","Redazione dichiarazione difensiva",60.0,157.5,255.0],["7.2d","Redazione ricorso immediato al G.d.P.",60.0,157.5,255.0],["7.3","Redazione lista testi e consulenti",60.0,157.5,255.0],["7.4","Redazione citazione e notifica",25.0,40.0,55.0],["7.5","Redazione impugnazione",90.0,270.0,450.0],["7.6","Redazione memoria",70.0,202.5,335.0],["7.7","Redazione parere che esaurisca l'attivita'",70.0,202.5,335.0],["8.","Indennita' di trasferta",10.0,20.0,30.0]]},"2":{"nome":"Tribunale Collegiale","att":[["1.1","Corrispondenza informativa",10.0,13.0,16.0],["1.2","Consultazione con il cliente in studio",32.0,48.5,65.0],["1.3a","Consultazione con il cliente fuori studio",65.0,97.0,129.0],["1.3b","Congresso con collega",65.0,97.0,129.0],["1.3c","Congresso con consulente",65.0,97.0,129.0],["1.3d","Congresso con investigatore",65.0,97.0,129.0],["1.3e","Congresso con magistrato",65.0,97.0,129.0],["2.","Esame e studio",30.0,45.0,60.0],["3.1","Colloquio con persona informata dei fatti",75.0,225.0,375.0],["3.2","Assunzione di informazioni",75.0,225.0,375.0],["3.3","Ricezione di dichiarazioni",75.0,225.0,375.0],["3.4","Richiesta di documentazione",75.0,225.0,375.0],["3.5","Richiesta di accesso a luoghi",75.0,225.0,375.0],["3.6","Accertamenti tecnici",75.0,225.0,375.0],["3.7","Produzione di documenti",75.0,225.0,375.0],["4.1","Accesso al carcere",16.0,21.0,26.0],["4.2","Accesso agli uffici",16.0,21.0,26.0],["4.3","Accesso a luoghi inerenti ai fatti",16.0,21.0,26.0],["4.4","Indennita' di attesa",16.0,21.0,26.0],["5.1","Assistenza nelle indagini preliminari",35.0,47.5,60.0],["5.2","Ricerca e formazione mezzi di prova",35.0,47.5,60.0],["6.1a","Partecipazione in camera di consiglio",50.0,70.0,90.0],["6.1b","Partecipazione udienza dibattimentale",50.0,70.0,90.0],["6.2","Esercizio attivita' difensive",100.0,237.5,375.0],["6.3","Discussione orale",150.0,300.0,450.0],["7.1a","Redazione esposto",75.0,210.0,345.0],["7.1b","Redazione denuncia",75.0,210.0,345.0],["7.1c","Redazione querela",75.0,210.0,345.0],["7.2a","Redazione istanza o richiesta",75.0,210.0,345.0],["7.2b","Redazione opposizione",75.0,210.0,345.0],["7.2c","Redazione dichiarazione difensiva",75.0,210.0,345.0],["7.2d","Redazione ricorso immediato al G.d.P.",75.0,210.0,345.0],["7.3","Redazione lista testi e consulenti",75.0,210.0,345.0],["7.4","Redazione citazione e notifica",30.0,52.5,75.0],["7.5","Redazione impugnazione",120.0,360.0,600.0],["7.6","Redazione memoria",90.0,270.0,450.0],["7.7","Redazione parere che esaurisca l'attivita'",90.0,270.0,450.0],["8.","Indennita' di trasferta",10.0,20.0,30.0]]},"5":{"nome":"Corte d'Appello","att":[["1.1","Corrispondenza informativa",12.0,16.0,20.0],["1.2","Consultazione con il cliente in studio",40.0,60.5,81.0],["1.3a","Consultazione con il cliente fuori studio",81.0,121.0,161.0],["1.3b","Congresso con collega",81.0,121.0,161.0],["1.3c","Congresso con consulente",81.0,121.0,161.0],["1.3d","Congresso con investigatore",81.0,121.0,161.0],["1.3e","Congresso con magistrato",81.0,121.0,161.0],["2.","Esame e studio",40.0,57.5,75.0],["3.1","Colloquio con persona informata dei fatti",95.0,280.0,465.0],["3.2","Assunzione di informazioni",95.0,280.0,465.0],["3.3","Ricezione di dichiarazioni",95.0,280.0,465.0],["3.4","Richiesta di documentazione",95.0,280.0,465.0],["3.5","Richiesta di accesso a luoghi",95.0,280.0,465.0],["3.6","Accertamenti tecnici",95.0,280.0,465.0],["3.7","Produzione di documenti",95.0,280.0,465.0],["4.1","Accesso al carcere",20.0,26.0,32.0],["4.2","Accesso agli uffici",20.0,26.0,32.0],["4.3","Accesso a luoghi inerenti ai fatti",20.0,26.0,32.0],["4.4","Indennita' di attesa",20.0,26.0,32.0],["5.1","Assistenza nelle indagini preliminari",45.0,60.0,75.0],["5.2","Ricerca e formazione mezzi di prova",45.0,60.0,75.0],["6.1a","Partecipazione in camera di consiglio",65.0,87.5,110.0],["6.1b","Partecipazione udienza dibattimentale",65.0,87.5,110.0],["6.2","Esercizio attivita' difensive",125.0,295.0,465.0],["6.3","Discussione orale",190.0,375.0,560.0],["7.1a","Redazione esposto",95.0,262.5,430.0],["7.1b","Redazione denuncia",95.0,262.5,430.0],["7.1c","Redazione querela",95.0,262.5,430.0],["7.2a","Redazione istanza o richiesta",95.0,262.5,430.0],["7.2b","Redazione opposizione",95.0,262.5,430.0],["7.2c","Redazione dichiarazione difensiva",95.0,262.5,430.0],["7.2d","Redazione ricorso immediato al G.d.P.",95.0,262.5,430.0],["7.3","Redazione lista testi e consulenti",95.0,262.5,430.0],["7.4","Redazione citazione e notifica",40.0,65.0,90.0],["7.5","Redazione impugnazione",150.0,450.0,750.0],["7.6","Redazione memoria",115.0,337.5,560.0],["7.7","Redazione parere che esaurisca l'attivita'",115.0,337.5,560.0],["8.","Indennita' di trasferta",10.0,20.0,30.0]]},"6":{"nome":"Tribunale di Sorveglianza","att":[["1.1","Corrispondenza informativa",12.0,16.0,20.0],["1.2","Consultazione con il cliente in studio",40.0,60.5,81.0],["1.3a","Consultazione con il cliente fuori studio",81.0,121.0,161.0],["1.3b","Congresso con collega",81.0,121.0,161.0],["1.3c","Congresso con consulente",81.0,121.0,161.0],["1.3d","Congresso con investigatore",81.0,121.0,161.0],["1.3e","Congresso con magistrato",81.0,121.0,161.0],["2.","Esame e studio",40.0,57.5,75.0],["3.1","Colloquio con persona informata dei fatti",95.0,280.0,465.0],["3.2","Assunzione di informazioni",95.0,280.0,465.0],["3.3","Ricezione di dichiarazioni",95.0,280.0,465.0],["3.4","Richiesta di documentazione",95.0,280.0,465.0],["3.5","Richiesta di accesso a luoghi",95.0,280.0,465.0],["3.6","Accertamenti tecnici",95.0,280.0,465.0],["3.7","Produzione di documenti",95.0,280.0,465.0],["4.1","Accesso al carcere",20.0,26.0,32.0],["4.2","Accesso agli uffici",20.0,26.0,32.0],["4.3","Accesso a luoghi inerenti ai fatti",20.0,26.0,32.0],["4.4","Indennita' di attesa",20.0,26.0,32.0],["5.1","Assistenza nelle indagini preliminari",45.0,60.0,75.0],["5.2","Ricerca e formazione mezzi di prova",45.0,60.0,75.0],["6.1a","Partecipazione in camera di consiglio",65.0,87.5,110.0],["6.1b","Partecipazione udienza dibattimentale",65.0,87.5,110.0],["6.2","Esercizio attivita' difensive",125.0,295.0,465.0],["6.3","Discussione orale",190.0,375.0,560.0],["7.1a","Redazione esposto",95.0,262.5,430.0],["7.1b","Redazione denuncia",95.0,262.5,430.0],["7.1c","Redazione querela",95.0,262.5,430.0],["7.2a","Redazione istanza o richiesta",95.0,262.5,430.0],["7.2b","Redazione opposizione",95.0,262.5,430.0],["7.2c","Redazione dichiarazione difensiva",95.0,262.5,430.0],["7.2d","Redazione ricorso immediato al G.d.P.",95.0,262.5,430.0],["7.3","Redazione lista testi e consulenti",95.0,262.5,430.0],["7.4","Redazione citazione e notifica",40.0,65.0,90.0],["7.5","Redazione impugnazione",150.0,450.0,750.0],["7.6","Redazione memoria",115.0,337.5,560.0],["7.7","Redazione parere che esaurisca l'attivita'",115.0,337.5,560.0],["8.","Indennita' di trasferta",10.0,20.0,30.0]]},"7":{"nome":"Corte d'Assise","att":[["1.1","Corrispondenza informativa",19.0,25.5,32.0],["1.2","Consultazione con il cliente in studio",65.0,97.0,129.0],["1.3a","Consultazione con il cliente fuori studio",129.0,193.5,258.0],["1.3b","Congresso con collega",129.0,193.5,258.0],["1.3c","Congresso con consulente",129.0,193.5,258.0],["1.3d","Congresso con investigatore",129.0,193.5,258.0],["1.3e","Congresso con magistrato",129.0,193.5,258.0],["2.","Esame e studio",60.0,90.0,120.0],["3.1","Colloquio con persona informata dei fatti",150.0,450.0,750.0],["3.2","Assunzione di informazioni",150.0,450.0,750.0],["3.3","Ricezione di dichiarazioni",150.0,450.0,750.0],["3.4","Richiesta di documentazione",150.0,450.0,750.0],["3.5","Richiesta di accesso a luoghi",150.0,450.0,750.0],["3.6","Accertamenti tecnici",150.0,450.0,750.0],["3.7","Produzione di documenti",150.0,450.0,750.0],["4.1","Accesso al carcere",35.0,43.5,52.0],["4.2","Accesso agli uffici",35.0,43.5,52.0],["4.3","Accesso a luoghi inerenti ai fatti",35.0,43.5,52.0],["4.4","Indennita' di attesa",35.0,43.5,52.0],["5.1","Assistenza nelle indagini preliminari",70.0,95.0,120.0],["5.2","Ricerca e formazione mezzi di prova",70.0,95.0,120.0],["6.1a","Partecipazione in camera di consiglio",100.0,140.0,180.0],["6.1b","Partecipazione udienza dibattimentale",100.0,140.0,180.0],["6.2","Esercizio attivita' difensive",200.0,475.0,750.0],["6.3","Discussione orale",300.0,600.0,900.0],["7.1a","Redazione esposto",150.0,420.0,690.0],["7.1b","Redazione denuncia",150.0,420.0,690.0],["7.1c","Redazione querela",150.0,420.0,690.0],["7.2a","Redazione istanza o richiesta",150.0,420.0,690.0],["7.2b","Redazione opposizione",150.0,420.0,690.0],["7.2c","Redazione dichiarazione difensiva",150.0,420.0,690.0],["7.2d","Redazione ricorso immediato al G.d.P.",150.0,420.0,690.0],["7.3","Redazione lista testi e consulenti",150.0,420.0,690.0],["7.4","Redazione citazione e notifica",60.0,105.0,150.0],["7.5","Redazione impugnazione",240.0,720.0,1200.0],["7.6","Redazione memoria",180.0,540.0,900.0],["7.7","Redazione parere che esaurisca l'attivita'",180.0,540.0,900.0],["8.","Indennita' di trasferta",10.0,20.0,30.0]]},"8":{"nome":"Corte d'Assise di appello","att":[["1.1","Corrispondenza informativa",19.0,25.5,32.0],["1.2","Consultazione con il cliente in studio",65.0,97.0,129.0],["1.3a","Consultazione con il cliente fuori studio",129.0,193.5,258.0],["1.3b","Congresso con collega",129.0,193.5,258.0],["1.3c","Congresso con consulente",129.0,193.5,258.0],["1.3d","Congresso con investigatore",129.0,193.5,258.0],["1.3e","Congresso con magistrato",129.0,193.5,258.0],["2.","Esame e studio",60.0,90.0,120.0],["3.1","Colloquio con persona informata dei fatti",150.0,450.0,750.0],["3.2","Assunzione di informazioni",150.0,450.0,750.0],["3.3","Ricezione di dichiarazioni",150.0,450.0,750.0],["3.4","Richiesta di documentazione",150.0,450.0,750.0],["3.5","Richiesta di accesso a luoghi",150.0,450.0,750.0],["3.6","Accertamenti tecnici",150.0,450.0,750.0],["3.7","Produzione di documenti",150.0,450.0,750.0],["4.1","Accesso al carcere",35.0,43.5,52.0],["4.2","Accesso agli uffici",35.0,43.5,52.0],["4.3","Accesso a luoghi inerenti ai fatti",35.0,43.5,52.0],["4.4","Indennita' di attesa",35.0,43.5,52.0],["5.1","Assistenza nelle indagini preliminari",70.0,95.0,120.0],["5.2","Ricerca e formazione mezzi di prova",70.0,95.0,120.0],["6.1a","Partecipazione in camera di consiglio",100.0,140.0,180.0],["6.1b","Partecipazione udienza dibattimentale",100.0,140.0,180.0],["6.2","Esercizio attivita' difensive",200.0,475.0,750.0],["6.3","Discussione orale",300.0,600.0,900.0],["7.1a","Redazione esposto",150.0,420.0,690.0],["7.1b","Redazione denuncia",150.0,420.0,690.0],["7.1c","Redazione querela",150.0,420.0,690.0],["7.2a","Redazione istanza o richiesta",150.0,420.0,690.0],["7.2b","Redazione opposizione",150.0,420.0,690.0],["7.2c","Redazione dichiarazione difensiva",150.0,420.0,690.0],["7.2d","Redazione ricorso immediato al G.d.P.",150.0,420.0,690.0],["7.3","Redazione lista testi e consulenti",150.0,420.0,690.0],["7.4","Redazione citazione e notifica",60.0,105.0,150.0],["7.5","Redazione impugnazione",240.0,720.0,1200.0],["7.6","Redazione memoria",180.0,540.0,900.0],["7.7","Redazione parere che esaurisca l'attivita'",180.0,540.0,900.0],["8.","Indennita' di trasferta",10.0,20.0,30.0]]},"9":{"nome":"Procedimenti Speciali","att":[["1.1","Corrispondenza informativa",24.0,32.0,40.0],["1.2","Consultazione con il cliente in studio",81.0,121.0,161.0],["1.3a","Consultazione con il cliente fuori studio",161.0,242.0,323.0],["1.3b","Congresso con collega",161.0,242.0,323.0],["1.3c","Congresso con consulente",161.0,242.0,323.0],["1.3d","Congresso con investigatore",161.0,242.0,323.0],["1.3e","Congresso con magistrato",161.0,242.0,323.0],["2.","Esame e studio",75.0,112.5,150.0],["3.1","Colloquio con persona informata dei fatti",190.0,562.5,935.0],["3.2","Assunzione di informazioni",190.0,562.5,935.0],["3.3","Ricezione di dichiarazioni",190.0,562.5,935.0],["3.4","Richiesta di documentazione",190.0,562.5,935.0],["3.5","Richiesta di accesso a luoghi",190.0,562.5,935.0],["3.6","Accertamenti tecnici",190.0,562.5,935.0],["3.7","Produzione di documenti",190.0,562.5,935.0],["4.1","Accesso al carcere",40.0,52.5,65.0],["4.2","Accesso agli uffici",40.0,52.5,65.0],["4.3","Accesso a luoghi inerenti ai fatti",40.0,52.5,65.0],["4.4","Indennita' di attesa",40.0,52.5,65.0],["5.1","Assistenza nelle indagini preliminari",90.0,120.0,150.0],["5.2","Ricerca e formazione mezzi di prova",90.0,120.0,150.0],["6.1a","Partecipazione in camera di consiglio",125.0,175.0,225.0],["6.1b","Partecipazione udienza dibattimentale",125.0,175.0,225.0],["6.2","Esercizio attivita' difensive",250.0,592.5,935.0],["6.3","Discussione orale",375.0,750.0,1125.0],["7.1a","Redazione esposto",190.0,525.0,860.0],["7.1b","Redazione denuncia",190.0,525.0,860.0],["7.1c","Redazione querela",190.0,525.0,860.0],["7.2a","Redazione istanza o richiesta",190.0,525.0,860.0],["7.2b","Redazione opposizione",190.0,525.0,860.0],["7.2c","Redazione dichiarazione difensiva",190.0,525.0,860.0],["7.2d","Redazione ricorso immediato al G.d.P.",190.0,525.0,860.0],["7.3","Redazione lista testi e consulenti",190.0,525.0,860.0],["7.4","Redazione citazione e notifica",75.0,130.0,185.0],["7.5","Redazione impugnazione",300.0,900.0,1500.0],["7.6","Redazione memoria",225.0,675.0,1125.0],["7.7","Redazione parere che esaurisca l'attivita'",225.0,675.0,1125.0],["8.","Indennita' di trasferta",10.0,20.0,30.0]]},"10":{"nome":"Corte Costituzionale","att":[["1.1","Corrispondenza informativa",24.0,32.0,40.0],["1.2","Consultazione con il cliente in studio",81.0,121.0,161.0],["1.3a","Consultazione con il cliente fuori studio",161.0,242.0,323.0],["1.3b","Congresso con collega",161.0,242.0,323.0],["1.3c","Congresso con consulente",161.0,242.0,323.0],["1.3d","Congresso con investigatore",161.0,242.0,323.0],["1.3e","Congresso con magistrato",161.0,242.0,323.0],["2.","Esame e studio",75.0,112.5,150.0],["3.1","Colloquio con persona informata dei fatti",190.0,562.5,935.0],["3.2","Assunzione di informazioni",190.0,562.5,935.0],["3.3","Ricezione di dichiarazioni",190.0,562.5,935.0],["3.4","Richiesta di documentazione",190.0,562.5,935.0],["3.5","Richiesta di accesso a luoghi",190.0,562.5,935.0],["3.6","Accertamenti tecnici",190.0,562.5,935.0],["3.7","Produzione di documenti",190.0,562.5,935.0],["4.1","Accesso al carcere",40.0,52.5,65.0],["4.2","Accesso agli uffici",40.0,52.5,65.0],["4.3","Accesso a luoghi inerenti ai fatti",40.0,52.5,65.0],["4.4","Indennita' di attesa",40.0,52.5,65.0],["5.1","Assistenza nelle indagini preliminari",90.0,120.0,150.0],["5.2","Ricerca e formazione mezzi di prova",90.0,120.0,150.0],["6.1a","Partecipazione in camera di consiglio",125.0,175.0,225.0],["6.1b","Partecipazione udienza dibattimentale",125.0,175.0,225.0],["6.2","Esercizio attivita' difensive",250.0,592.5,935.0],["6.3","Discussione orale",375.0,750.0,1125.0],["7.1a","Redazione esposto",190.0,525.0,860.0],["7.1b","Redazione denuncia",190.0,525.0,860.0],["7.1c","Redazione querela",190.0,525.0,860.0],["7.2a","Redazione istanza o richiesta",190.0,525.0,860.0],["7.2b","Redazione opposizione",190.0,525.0,860.0],["7.2c","Redazione dichiarazione difensiva",190.0,525.0,860.0],["7.2d","Redazione ricorso immediato al G.d.P.",190.0,525.0,860.0],["7.3","Redazione lista testi e consulenti",190.0,525.0,860.0],["7.4","Redazione citazione e notifica",75.0,130.0,185.0],["7.5","Redazione impugnazione",300.0,900.0,1500.0],["7.6","Redazione memoria",225.0,675.0,1125.0],["7.7","Redazione parere che esaurisca l'attivita'",225.0,675.0,1125.0],["8.","Indennita' di trasferta",10.0,20.0,30.0]]},"16":{"nome":"Corte di Cassazione ed equiparati","att":[["1.1","Corrispondenza informativa",24.0,32.0,40.0],["1.2","Consultazione con il cliente in studio",81.0,121.0,161.0],["1.3a","Consultazione con il cliente fuori studio",161.0,242.0,323.0],["1.3b","Congresso con collega",161.0,242.0,323.0],["1.3c","Congresso con consulente",161.0,242.0,323.0],["1.3d","Congresso con investigatore",161.0,242.0,323.0],["1.3e","Congresso con magistrato",161.0,242.0,323.0],["2.","Esame e studio",75.0,112.5,150.0],["3.1","Colloquio con persona informata dei fatti",190.0,562.5,935.0],["3.2","Assunzione di informazioni",190.0,562.5,935.0],["3.3","Ricezione di dichiarazioni",190.0,562.5,935.0],["3.4","Richiesta di documentazione",190.0,562.5,935.0],["3.5","Richiesta di accesso a luoghi",190.0,562.5,935.0],["3.6","Accertamenti tecnici",190.0,562.5,935.0],["3.7","Produzione di documenti",190.0,562.5,935.0],["4.1","Accesso al carcere",40.0,52.5,65.0],["4.2","Accesso agli uffici",40.0,52.5,65.0],["4.3","Accesso a luoghi inerenti ai fatti",40.0,52.5,65.0],["4.4","Indennita' di attesa",40.0,52.5,65.0],["5.1","Assistenza nelle indagini preliminari",90.0,120.0,150.0],["5.2","Ricerca e formazione mezzi di prova",90.0,120.0,150.0],["6.1a","Partecipazione in camera di consiglio",125.0,175.0,225.0],["6.1b","Partecipazione udienza dibattimentale",125.0,175.0,225.0],["6.2","Esercizio attivita' difensive",250.0,592.5,935.0],["6.3","Discussione orale",375.0,750.0,1125.0],["7.1a","Redazione esposto",190.0,525.0,860.0],["7.1b","Redazione denuncia",190.0,525.0,860.0],["7.1c","Redazione querela",190.0,525.0,860.0],["7.2a","Redazione istanza o richiesta",190.0,525.0,860.0],["7.2b","Redazione opposizione",190.0,525.0,860.0],["7.2c","Redazione dichiarazione difensiva",190.0,525.0,860.0],["7.2d","Redazione ricorso immediato al G.d.P.",190.0,525.0,860.0],["7.3","Redazione lista testi e consulenti",190.0,525.0,860.0],["7.4","Redazione citazione e notifica",75.0,130.0,185.0],["7.5","Redazione impugnazione",300.0,900.0,1500.0],["7.6","Redazione memoria",225.0,675.0,1125.0],["7.7","Redazione parere che esaurisca l'attivita'",225.0,675.0,1125.0],["8.","Indennita' di trasferta",10.0,20.0,30.0]]}};
const NOTULA_PENALE_ORDINE = ["11", "12", "13", "1", "3", "2", "5", "6", "7", "8", "9", "10", "16"];
function opzioniAttivitaNotula(f: Record<string, any>): { value: string; label: string }[] {
  const comp = NOTULA_PENALE_2004[f.competenza];
  if (!comp) return [];
  return comp.att.map((a, i) => ({ value: String(i), label: `${a[0]} ${a[1]}${a[2] === 0 ? " (tariffa da specificare)" : ` — ${formatEuro(a[2])} / ${formatEuro(a[3])} / ${formatEuro(a[4])}`}` }));
}

// Tariffe forensi civili 2004 (diritti, onorari, stragiudiziale) per il calcolatore "Calcolo Nota Spese": solo codici e nomi delle attività, le tariffe le calcola il backend.
const NS_DIRITTI: Record<string, [string, string][]> = {"1":[["1","Posizione e archivio"],["2","Disamina"],["3.1","Redazione atto di citazione"],["3.2","Redazione ricorso introduttivo"],["3.3","Redazione atto di appello"],["3.4","Redazione comparsa di risposta"],["3.5","Redazione atto di intervento"],["4.1","Rinnovazione della domanda"],["4.2","Riassunzione della domanda"],["5","Chiamata di un terzo in causa"],["6","Autentica di ogni firma"],["7","Esame procura notarile"],["8","Versamento contributo unificato"],["9","Iscrizione della causa a ruolo"],["10","Costituzione in giudizio"],["11","Esame scritti difensivi di controparte"],["12","Esame documentazione prodotta da controparte"],["13.1","Redazione deduzioni di udienza"],["13.2","Redazione memoria"],["13.3","Redazione comparsa conclusionale"],["13.4","Redazione note illustrative"],["14.1","Redazione istanza"],["14.2","Redazione ricorso"],["14.3","Redazione reclamo"],["15.1","Esame dispositivo sentenza"],["15.2","Esame decreto"],["15.3","Esame ordinanza"],["16.1","Esame testo integrale sentenza"],["16.2","Esame testo integrale ordinanza collegiale"],["17","Dichiarazione resa dalla parte"],["18","Formazione del fascicolo"],["19.1","Partecipazione udienza"],["19.2","Intervento alle operazioni del consulente tecnico"],["20.1","Assistenza alla parte comparsa avanti al giudice"],["20.2","Assistenza alla parte comparsa avanti al collegio"],["21","Consultazione con il cliente"],["22","Corrispondenza informativa"],["23.1","Notifica atto"],["23.2","Notifica atto a più persone"],["24","Esame relata di notifica"],["25","Collaborazione prestata per la conciliazione"],["26","Intimazione ai testimoni"],["27","Designazione consulente tecnico di parte"],["28","Assistenza atti di istruzione probatoria"],["29","Richiesta documenti e certificati"],["30","Richiesta alla cancelleria di copia di atti"],["31.1","Deposito atti in cancelleria"],["31.2","Deposito documenti in cancelleria"],["32","Ritiro fascicolo di parte dalla cancelleria"],["33","Registrazione atti e documenti"],["34.1","Iscrizione nel F.A.L. della Provincia"],["34.2","Iscrizione nella Gazzetta Ufficiale"],["34.3","Iscrizione in altre stampe periodiche"],["35","Proposizione querela di falso"],["36.1","Esame prove testimoniali"],["36.2","Esame dell'interrogatorio"],["37.1","Esame relazione del consulente tecnico"],["37.2","Esame documenti contabili"],["38.1","Precisazione delle conclusioni"],["38.2","Precisazione conclusioni al consulente tecnico"],["39","Esame conclusioni di controparte"],["40","Redazione nota spese giudiziale"],["41","Richiesta al Consiglio dell'Ordine"],["42.1","Registrazione della sentenza"],["42.2","Registrazione provvedimento giudiziale"],["43","Deposito cauzionale"],["44","Deposito presso Agenzia delle Entrate"],["45.1","Accesso agli uffici"],["45.2","Ritiro atto"],["77","Diritto di vacazione"],["78.1","Domiciliazione (tribunale, corte di appello)"],["78.2","Domiciliazione (corte cost., cassazione)"],["79.1","Trasferta con indennità minima"],["79.2","Trasferta con indennità intermedia"],["79.3","Trasferta con indennità massima"],["80.1","Diritti di collazione per dattilografia"],["80.2","Diritti di collazione per stampa"]],"2":[["46","Disamina titolo esecutivo"],["47.1","Redazione atto di precetto"],["47.2","Redazione atto di pignoramento presso terzi"],["48.1","Notifica titolo esecutivo"],["48.2","Notifica titolo esecutivo a più persone"],["48.3","Notifica precetto"],["48.4","Notifica precetto a più persone"],["48.5","Notifica atto di pignoramento"],["48.6","Notifica atto di pignoramento a più persone"],["49.1","Redazione atto di pignoramento immobiliare"],["49.2","Redazione atto di pignoramento autoveicolo"],["50","Esame verbale di pignoramento mobiliare"],["51.1","Assistenza esecuzione della consegna"],["51.2","Assistenza esecuzione del rilascio"],["52.1","Intervento nell'esecuzione"],["52.2","Ricorso al giudice dell'esecuzione"],["52.3","Redazione intimazione ad altri creditori"],["52.4","Redazione istanza di fallimento"],["52.5","Redazione istanza di insinuazione al credito"],["53.1","Compilazione nota di iscrizione pubblici registri"],["53.2","Compilazione nota di trascrizione pubblici registri"],["54","Formalità in pubblici registri"],["55.1","Esame certificato ipotecario"],["55.2","Esame certificato catastale"],["56.1","Richiesta di certificato ipotecario"],["56.2","Richiesta di certificato catastale"],["57","Redazione nota di ispezione ipotecaria"],["58","Ispezione catastale"],["59","Richiesta pubblicità di avvisi"],["60","Esame domanda e titoli dei creditori"],["61","Deposito somme"],["62","Domanda di vendita beni pignorati"],["63","Comparizione davanti al giudice dell'esecuzione"],["64","Dichiarazione nella procedura di incanto"],["65","Assistenza all'incanto"],["66","Offerta all'incanto"],["67","Offerta dopo l'incanto"],["68","Per concorrere alla distribuzione del prezzo"],["69","Formazione progetto di distribuzione amichevole"],["70","Esame del progetto di distribuzione"],["71","Discussione progetto di distribuzione"],["72","Approvazione progetto di distribuzione"],["73","Assistenza adunanza creditori"],["74.1","Altre prestazioni nel processo di esecuzione"],["74.2","Altre prestazioni in procedimenti concorsuali"],["77","Diritto di vacazione"],["78.1","Domiciliazione (tribunale, appello)"],["78.2","Domiciliazione (corte cost., cassazione)"],["79.1","Trasferta con indennità minima"],["79.2","Trasferta con indennità intermedia"],["79.3","Trasferta con indennità massima"],["80.1","Diritti di collazione per dattilografia"],["80.2","Diritti di collazione per stampa"]],"3":[["75.1","Procedimento speciale in Camera di Consiglio"],["75.2","Procedimento speciale avanti Giudice Tutelare"],["76","Prestazioni in altri procedimenti speciali"],["77","Diritto di vacazione"],["78.1","Domiciliazione (tribunale, appello)"],["78.2","Domiciliazione (corte cost., cassazione)"],["79.1","Trasferta con indennità minima"],["79.2","Trasferta con indennità intermedia"],["79.3","Trasferta con indennità massima"],["80.1","Diritti di collazione per dattilografia"],["80.2","Diritti di collazione per stampa"]]};
const NS_ONORARI: Record<string, [string, string][]> = {"1":[["12","Studio della controversia"],["13","Consultazione con il cliente"],["14.1","Ispezione luoghi della controversia"],["14.2","Ricerca dei documenti"],["15.1","Redazione atto introduttivo"],["15.2","Redazione comparsa di risposta"],["16","Assistenza udienza"],["17","Assistenza ai mezzi di prova"],["18","Redazione memoria"],["19.1","Redazione comparsa conclusionale"],["19.2","Redazione memoria di replica"],["20.1","Discussione in pubblica udienza"],["20.2","Discussione in camera di consiglio"],["21","Opera prestata per la conciliazione"]],"2":[["12","Studio della controversia"],["13","Consultazione con il cliente"],["14.1","Ispezione luoghi della controversia"],["14.2","Ricerca dei documenti"],["15.1","Redazione atto introduttivo"],["15.2","Redazione comparsa di risposta"],["16","Assistenza udienza"],["17","Assistenza ai mezzi di prova"],["18","Redazione memoria"],["19.1","Redazione comparsa conclusionale"],["19.2","Redazione memoria di replica"],["20.1","Discussione in pubblica udienza"],["20.2","Discussione in camera di consiglio"],["21","Opera prestata per la conciliazione"]],"4":[["12","Studio della controversia"],["13","Consultazione con il cliente"],["14.1","Ispezione luoghi della controversia"],["14.2","Ricerca dei documenti"],["15.1","Redazione atto introduttivo"],["15.2","Redazione comparsa di risposta"],["16","Assistenza udienza"],["17","Assistenza ai mezzi di prova"],["18","Redazione memoria"],["19.1","Redazione comparsa conclusionale"],["19.2","Redazione memoria di replica"],["20.1","Discussione in pubblica udienza"],["20.2","Discussione in camera di consiglio"],["21","Opera prestata per la conciliazione"]],"5":[["32","Studio della controversia"],["33","Consultazione con il cliente"],["34.1","Ispezione luoghi della controversia"],["34.2","Ricerca documenti"],["35.1","Redazione atto introduttivo"],["35.2","Redazione comparsa di risposta"],["36","Assistenza udienza"],["37","Assitenza ai mezzi di prova"],["38","Redazione memoria"],["39.1","Redazione comparsa conclusionale"],["39.2","Redazione memoria di replica"],["40.1","Discussione in pubblica udienza"],["40.2","Discussione in camera di consiglio"],["41","Opera prestata per la conciliazione"]],"9":[["50.1","Procedimento speciale davanti al Tribunale"],["50.2","Procedimento speciale davanti alla Corte di Appello"],["50.3","Procedimento concorsuale davanti al Tribunale"],["50.4","Procedimento concorsuale davanti alla Corte d'Appello"],["51","Procedimento di ingiunzione"],["52","Redazione del precetto"],["53","Iscrizione di ipoteca giudiziale"],["54","Procedure esecutive immobiliari"],["55.1","Procedure esecutive mobiliari"],["55.2","Procedure per affari tavolari"],["55.3","Procedure per compravendita autoveicoli"],["56.1","Procedure esecutive presso terzi"],["56.2","Procedure per consegna o rilascio"]],"10":[["46","Studio della controversia"],["47","Consultazioni con il cliente"],["48.1","Redazione del ricorso"],["48.2","Redazione del controricorso"],["48.3","Redazione memoria"],["49","Discussione"]],"11":[["1","Per l'intero giudizio"],["2","Studio della controversia"],["3","Consultazione con il cliente"],["4.1","Ispezione luoghi della controversia"],["4.2","Ricerca dei documenti"],["5.1","Redazione atto introduttivo"],["5.2","Redazione comparsa di risposta"],["6","Assistenza udienza"],["7","Assistenza ai mezzi di prova"],["8","Redazione memoria"],["9.1","Redazione comparsa conclusionale"],["9.2","Redazione memoria di replica"],["10.1","Discussione in camera di consiglio"],["10.2","Discussione in pubblica udienza"],["11","Opera prestata per la conciliazione"]],"14":[["32","Studio della controversia"],["33","Consultazione con il cliente"],["34.1","Ispezione luoghi della controversia"],["34.2","Ricerca documenti"],["35.1","Redazione atto introduttivo"],["35.2","Redazione comparsa di risposta"],["36","Assistenza udienza"],["37","Assitenza ai mezzi di prova"],["38","Redazione memoria"],["39.1","Redazione comparsa conclusionale"],["39.2","Redazione memoria di replica"],["40.1","Discussione in pubblica udienza"],["40.2","Discussione in camera di consiglio"],["41","Opera prestata per la conciliazione"]],"15":[["22","Studio della controversia"],["23","Consultazione con il cliente"],["24","Ricerca dei documenti"],["25.1","Redazione ricorso introduttivo"],["25.2","Redazione memoria di costituzione"],["26","Redazione istanza di sospensione"],["27","Redazione motivi aggiuntivi"],["28","Readazione atto di intervento"],["29","Assistenza ai mezzi di prova"],["30","Redazione memoria difensiva"],["31.1","Discussione in pubblica udienza"],["31.2","Discussione in camera di consiglio"]],"16":[["42","Studio della controversia"],["43","Consultazioni con il cliente"],["44.1","Redazione ricorso"],["44.2","Redazione controricorso"],["44.3","Redazione memoria"],["45","Discussione"]],"17":[["46","Studio della controversia"],["47","Consultazioni con il cliente"],["48.1","Redazione del ricorso"],["48.2","Redazione del controricorso"],["48.3","Redazione memoria"],["49","Discussione"]],"18":[["46","Studio della controversia"],["47","Consultazioni con il cliente"],["48.1","Redazione del ricorso"],["48.2","Redazione del controricorso"],["48.3","Redazione memoria"],["49","Discussione"]],"19":[["42","Studio della controversia"],["43","Consultazioni con il cliente"],["44.1","Redazione ricorso"],["44.2","Redazione controricorso"],["44.3","Redazione memoria"],["45","Discussione"]],"20":[["50.1","Procedimento speciale davanti al Tribunale"],["50.2","Procedimento speciale davanti alla Corte di Appello"],["50.3","Procedimento concorsuale davanti al Tribunale"],["50.4","Procedimento concorsuale davanti alla Corte d'Appello"],["51","Procedimento di ingiunzione"],["52","Redazione del precetto"],["53","Iscrizione di ipoteca giudiziale"],["54","Procedure esecutive immobiliari"],["55.1","Procedure esecutive mobiliari"],["55.2","Procedure per affari tavolari"],["55.3","Procedure per compravendita autoveicoli"],["56.1","Procedure esecutive presso terzi"],["56.2","Procedure per consegna o rilascio"]]};
const NS_STRAG: [string, string][] = [["1.1","Consultazione orale"],["1.2","Parere orale"],["1.3","Parere telefonico o telematico"],["1.4","Parere orale"],["1.5","Parere scritto"],["2.1","Posizione e archivio"],["2.2","Redazione lettera"],["2.3","Redazione telegramma"],["2.4","Comunicazione telefonica o telematica"],["2.5","Esame e studio della pratica"],["2.6","Conferenza di trattazione"],["2.7","Conferenza collegiale di trattazione"],["2.8","Conferenza di trattazione fuori studio"],["2.9","Redazione diffida"],["2.10","Redazione ricorso"],["2.11","Redazione memoria"],["2.12","Redazione esposto"],["2.13","Redazione relazione"],["2.14","Redazione denuncia"],["2.15","Redazione contratto"],["2.16","Redazione statuto"],["2.17","Redazione regolamento"],["2.18","Redazione testamento"],["2.19","Assistenza stipulazione contratto"],["2.20","Assistenza redazione statuto"],["2.21","Assistenza redazione regolamento"],["2.22","Assistenza redazione testamento"],["3.1","Assistenza ad assemblea"],["3.2","Assistenza ad adunanza"],["3.3","Assistenza in consiglio"],["3.4","Assistenza in comitato"],["4.1","Assistenza in procedura concorsuale"],["4.2","Assistenza pratica di successione"],["4.3","Assistenza in pratiche di divisione"],["4.4","Assistenza liquidazione"],["4.5","Assistenza tributaria"],["5.1","Assistenza in arbitrato rituale"],["5.2","Assistenza in arbitrato irrituale"],["6","Gestione amministrativa"],["7.1","Ispezione"],["7.2","Richiesta visura"],["7.3","Ricerca e richiesta documenti"],["8","Arbitro unico"],["9","Collegio arbitrale"],["10","Onorario a tempo"],["11","Indennità di trasferta"]];
const NS_COMP_DIRITTI = [{ value: "1", label: "Processo di cognizione" }, { value: "2", label: "Processo di esecuzione" }, { value: "3", label: "Procedimenti speciali" }];
const NS_COMP_ONORARI = [
  { value: "11", label: "Giudice di Pace" }, { value: "1", label: "Tribunale Monocratico" }, { value: "2", label: "Tribunale Collegiale" }, { value: "4", label: "Commissione Tributaria di 1^ grado" },
  { value: "15", label: "T.A.R." }, { value: "5", label: "Corte d'Appello" }, { value: "14", label: "Commissione Tributaria Regionale" }, { value: "16", label: "Corte di Cassazione ed equiparati" },
  { value: "19", label: "Consiglio di Stato" }, { value: "10", label: "Corte Costituzionale" }, { value: "17", label: "Corte Europea per i diritti dell'uomo" }, { value: "18", label: "Corte di Giustizia CEE" },
  { value: "9", label: "Procedimenti Speciali" }, { value: "20", label: "Procedure Esecutive" },
];
function opzioniNotaSpese(righe: [string, string][] | undefined): { value: string; label: string }[] {
  return (righe || []).map((r, i) => ({ value: String(i), label: `${r[0]} ${r[1]}` }));
}

const PV_SCAGLIONI_ASSISTENZA = [
  { value: "10", label: "Fino a € 1.100" }, { value: "20", label: "Da € 1.101 a € 5.200" }, { value: "30", label: "Da € 5.201 a € 26.000" },
  { value: "40", label: "Da € 26.001 a € 52.000" }, { value: "50", label: "Da € 52.001 a € 260.000" }, { value: "60", label: "Da € 260.001 a € 520.000" },
];
const PV_SCAGLIONI_MEDIAZIONE = [
  ...PV_SCAGLIONI_ASSISTENZA,
  { value: "70", label: "Da € 520.001 a € 1.000.000" }, { value: "80", label: "Da € 1.000.001 a € 2.000.000" }, { value: "90", label: "Da € 2.000.001 a € 4.000.000" },
  { value: "100", label: "Da € 4.000.001 a € 8.000.000" }, { value: "110", label: "Da € 8.000.001 a € 16.000.000" }, { value: "120", label: "Da € 16.000.001 a € 32.000.000" },
];
const PV_INDETERMINABILI = [
  { value: "901", label: "Indeterminabile - complessità bassa" }, { value: "902", label: "Indeterminabile - complessità media" },
  { value: "903", label: "Indeterminabile - complessità alta" }, { value: "910", label: "Indeterminabile di particolare importanza" },
];

const fmtPct = (n: number | string) => String(n).replace(".", ",");
const TIPI_REGIME_SEMPLIFICATO = [
  { value: "1", label: "Regime forfettario agevolato 2014" },
  { value: "2", label: "Regime di vantaggio 2011" },
  { value: "3", label: "Regime dei minimi 2008" },
];
const PERCENTUALI_1_20 = Array.from({ length: 20 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) }));
const PERCENTUALI_1_25 = Array.from({ length: 25 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) }));

const CONFIG_GENERICI: Record<string, ConfigGenerico> = {
  "termini-impugnazione": {
    campi: [
      { tipo: "scelta", key: "tipo_processo", label: "Tipo di processo", default: "civile", opzioni: [
        { value: "civile", label: "Civile" }, { value: "amministrativo", label: "Amministrativo" }, { value: "tributario", label: "Tributario" },
      ] },
      // Come nel calcolatore di riferimento: 4 voci in "Impugnazione" (Appello, Cassazione,
      // Revocazione, Opposizione di terzo — quest'ultima assente per
      // Tributario, che non ne ha un'autonoma equivalente agli artt. 404
      // c.p.c./108 c.p.a.), non 6. La distinzione ordinaria/straordinaria
      // (già presente da prima, più granulare di quella) si sceglie con
      // un secondo campo mostrato solo per Revocazione/Opposizione di
      // terzo, analogo al "Dalla data di" di quel calcolatore.
      { tipo: "scelta", key: "categoria_impugnazione", label: "Tipo di impugnazione", default: "appello", opzioni: (f) => [
        { value: "appello", label: f.tipo_processo === "amministrativo" ? "Appello al Consiglio di Stato" : f.tipo_processo === "tributario" ? "Ricorso in Corte di Giustizia Tributaria di secondo grado" : "Appello" },
        { value: "cassazione", label: "Cassazione" },
        { value: "revocazione", label: "Revocazione" },
        ...(f.tipo_processo === "tributario" ? [] : [{ value: "opposizione_terzo", label: "Opposizione di terzo" }]),
      ] },
      { tipo: "scelta", key: "sottotipo", label: "Motivo", default: "ordinaria",
        mostraSe: (f) => f.categoria_impugnazione === "revocazione" || f.categoria_impugnazione === "opposizione_terzo",
        opzioni: (f) => f.categoria_impugnazione === "opposizione_terzo" ? [
          { value: "ordinaria", label: "Ordinaria (art. 404 c.1 — nessun termine)" },
          { value: "revocatoria", label: "Revocatoria (art. 404 c.2 — dalla scoperta del vizio)" },
        ] : [
          { value: "ordinaria", label: "Ordinaria (errore di fatto / giudicato contrario, art. 395 nn. 4-5)" },
          { value: "straordinaria", label: "Straordinaria (dolo, falsità, documenti, art. 395 nn. 1-3-6)" },
        ] },
      { tipo: "data", key: "data_pubblicazione", label: "Data pubblicazione sentenza",
        mostraSe: (f) => f.categoria_impugnazione === "appello" || f.categoria_impugnazione === "cassazione" || (f.categoria_impugnazione === "revocazione" && f.sottotipo !== "straordinaria") },
      { tipo: "data_opzionale", key: "data_notificazione", label: "Data notificazione sentenza, se notificata",
        mostraSe: (f) => f.categoria_impugnazione === "appello" || f.categoria_impugnazione === "cassazione" || (f.categoria_impugnazione === "revocazione" && f.sottotipo !== "straordinaria") },
      { tipo: "data", key: "data_scoperta_vizio", label: "Data di scoperta del vizio/dolo",
        mostraSe: (f) => (f.categoria_impugnazione === "revocazione" && f.sottotipo === "straordinaria") || (f.categoria_impugnazione === "opposizione_terzo" && f.sottotipo === "revocatoria") },
      { tipo: "bool", key: "escludi_feriale", label: "Applica sospensione feriale (1-31 agosto)", default: true },
    ],
    endpoint: "/calc/termini-impugnazione",
    buildBody: (f) => ({
      tipo_processo: f.tipo_processo,
      escludi_feriale: f.escludi_feriale,
      tipo: f.categoria_impugnazione === "revocazione" ? (f.sottotipo === "straordinaria" ? "revocazione_straordinaria" : "revocazione_ordinaria")
        : f.categoria_impugnazione === "opposizione_terzo" ? (f.sottotipo === "revocatoria" ? "opposizione_terzo_revocatoria" : "opposizione_terzo_ordinaria")
        : f.categoria_impugnazione,
      data_pubblicazione: f.data_pubblicazione || null,
      data_notificazione: f.data_notificazione || null,
      data_scoperta_vizio: f.data_scoperta_vizio || null,
    }),
    risultato: (r) => r.tipo === "opposizione_terzo_ordinaria"
      ? [["Nota", r.nota]]
      : r.tipo === "revocazione_straordinaria" || r.tipo === "opposizione_terzo_revocatoria"
      ? [[`Termine applicabile (${r.tipo_processo === "civile" ? "30" : "60"}gg dalla scoperta)`, isoToDataIt(r.termine_applicabile)]]
      : [
          ["Termine applicabile", isoToDataIt(r.termine_applicabile)],
          ["Termine lungo (6 mesi da pubblicazione)", isoToDataIt(r.termine_lungo)],
          ...(r.termine_breve ? ([["Termine breve (da notificazione)", isoToDataIt(r.termine_breve)]] as [string, string][]) : []),
        ],
    scadenze: (r) => r.termine_applicabile ? [{ titolo: `Scadenza impugnazione (${r.tipo})`, data: r.termine_applicabile }] : [],
  },
  "opposizione-decreto-ingiuntivo": {
    campi: [
      { tipo: "data", key: "data_notifica_decreto", label: "Data notifica del decreto" },
      { tipo: "numero", key: "giorni_concessi", label: "Giorni concessi dal giudice (vedi il decreto)", default: "40" },
      { tipo: "bool", key: "escludi_feriale", label: "Applica sospensione feriale (1-31 agosto)", default: true },
    ],
    endpoint: "/calc/opposizione-decreto-ingiuntivo",
    risultato: (r) => [
      ["Scadenza opposizione", isoToDataIt(r.scadenza_opposizione)],
      ["Giorni di sospensione applicati", String(r.giorni_sospensione_applicati)],
    ],
    scadenze: (r) => [{ titolo: "Scadenza opposizione a decreto ingiuntivo", data: r.scadenza_opposizione }],
  },
  "prescrizione": {
    campi: [
      { tipo: "data", key: "data_decorrenza", label: "Data di decorrenza" },
      { tipo: "scelta", key: "tipo_termine", label: "Tipo di termine", default: "ordinaria_10", cercabile: true, opzioni: [
        { value: "albergatori_6m", label: "Albergatori: alloggio e vitto - 6 mesi (art. 2954 c.c.)" },
        { value: "assicurazione_vita_10", label: "Assicurazioni: contratto di assicurazione sulla vita - 10 anni (art. 2952 c.4 c.c.)" },
        { value: "riassicurazione_2", label: "Assicurazioni: contratto di riassicurazione - 2 anni (art. 2952 c.3 c.c.)" },
        { value: "assicurazione_premio_1", label: "Assicurazioni: rate del premio - 1 anno (art. 2952 c.2 c.c.)" },
        { value: "assicurazione_2", label: "Assicurazioni: somme da contratto di assicurazione danni - 2 anni (art. 2952 c.1 c.c.)" },
        { value: "mutui_rate_5", label: "Banche/finanziarie: rate di mutui e finanziamenti - 5 anni (art. 2948 n.4 c.c.)" },
        { value: "banche_ripetizione_indebito_10", label: "Banche: restituzione accredito indebito su c/c - 10 anni (art. 2946 c.c.)" },
        { value: "bollette_utenze_5", label: "Bollette/utenze (acqua, energia, gas, telefono) - 5 anni (art. 2948 n.4 c.c.)" },
        { value: "bollo_auto_3", label: "Bollo auto: tassa automobilistica - 3 anni (D.L. 953/1982)" },
        { value: "cambiali_azione_diretta_3", label: "Cambiali (tratte e pagherò): azione diretta - 3 anni (art. 94 l. cambiaria)" },
        { value: "canoni_periodici_5", label: "Canoni, interessi, indennità periodiche in genere - 5 anni (art. 2948 n.4 c.c.)" },
        { value: "commercianti_merci_1", label: "Commercianti: vendita di merci al minuto - 1 anno (art. 2955 n.5 c.c.)" },
        { value: "condominio_ordinarie_5", label: "Condominio: spese ordinarie - 5 anni (art. 2948 n.4 c.c.)" },
        { value: "condominio_straordinarie_10", label: "Condominio: spese straordinarie - 10 anni (art. 2946 c.c.)" },
        { value: "circolazione_veicoli_2", label: "Danni da circolazione veicoli - 2 anni (art. 2947 c.2 c.c.)" },
        { value: "actio_iudicati_10", label: "Diritto già accertato con sentenza passata in giudicato - 10 anni (art. 2953 c.c.)" },
        { value: "tributi_locali_5", label: "Enti locali: tributi locali (IMU, TARI/TARSU, TOSAP) - 5 anni (art. 2948 n.4 c.c.)" },
        { value: "farmacisti_medicinali_1", label: "Farmacisti: prezzo dei medicinali - 1 anno (art. 2955 n.6 c.c.)" },
        { value: "fisco_rimborso_10", label: "Fisco: rimborso imposte dirette o bollo auto - 10 anni (art. 2946 c.c.)" },
        { value: "insegnanti_lezioni_brevi_1", label: "Insegnanti: lezioni a mesi, giorni o ore - 1 anno (art. 2955 n.1 c.c.)" },
        { value: "insegnanti_lezioni_lunghe_3", label: "Insegnanti: lezioni impartite per più di un mese - 3 anni (art. 2956 n.1 c.c.)" },
        { value: "lavoro_tfr_5", label: "Lavoro: indennità di fine rapporto/TFR - 5 anni (art. 2948 n.5 c.c.)" },
        { value: "lavoro_retribuzioni_periodo_lungo_5", label: "Lavoro: retribuzioni per periodi > 1 mese - 5 anni (art. 2948 n.4 c.c.)" },
        { value: "lavoro_retribuzioni_periodo_breve_1", label: "Lavoro: retribuzioni per periodi ≤ 1 mese - 1 anno (art. 2955 n.2 c.c.)" },
        { value: "locazioni_canoni_5", label: "Locazioni e affitti: canoni - 5 anni (art. 2948 n.3 c.c.)" },
        { value: "mediatori_provvigione_1", label: "Mediatori: provvigione - 1 anno (art. 2950 c.c.)" },
        { value: "notai_parcella_3", label: "Notai: compenso per gli atti del loro ministero - 3 anni (art. 2956 n.2 c.c.)" },
        { value: "ordinaria_10", label: "Ordinaria - 10 anni (art. 2946 c.c.)" },
        { value: "previdenza_contributi_5", label: "Previdenza: contributi INPS obbligatori - 5 anni (L. 335/1995)" },
        { value: "professionisti_parcella_3", label: "Professionisti (avvocati, commercialisti, ecc.): parcella - 3 anni (art. 2956 n.2 c.c.)" },
        { value: "rai_canone_10", label: "RAI: canone di abbonamento - 10 anni (art. 2946 c.c.)" },
        { value: "rendite_vitalizie_5", label: "Rendite perpetue o vitalizie: annualità - 5 anni (art. 2948 n.1 c.c.)" },
        { value: "fatto_illecito_5", label: "Risarcimento da fatto illecito - 5 anni (art. 2947 c.1 c.c.)" },
        { value: "sanzioni_amministrative_5", label: "Sanzioni amministrative e multe - 5 anni (art. 28 L. 689/1981)" },
        { value: "sanzioni_tributarie_5", label: "Sanzioni tributarie - 5 anni (art. 20 c.3 D.Lgs. 472/1997)" },
        { value: "scuole_rette_1", label: "Scuole/convitti: rette scolastiche - 1 anno (art. 2955 n.3 c.c.)" },
        { value: "societa_rapporti_sociali_5", label: "Società: diritti da rapporti sociali - 5 anni (art. 2949 c.1 c.c.)" },
        { value: "societa_responsabilita_amministratori_5", label: "Società: responsabilità verso amministratori - 5 anni (art. 2949 c.2 c.c.)" },
        { value: "titoli_stato_capitale_5", label: "Titoli di Stato al portatore: capitale nominale - 5 anni (art. 2948 n.1-bis c.c.)" },
        { value: "trasporto_servizi_linea_1", label: "Trasporti: servizi pubblici di linea - 1 anno (art. 2951 c.3 c.c.)" },
        { value: "trasporto_extra_europa_18", label: "Trasporto/spedizione fuori Europa - 18 mesi (art. 2951 c.2 c.c.)" },
        { value: "trasporto_1", label: "Trasporto/spedizione in Europa - 1 anno (art. 2951 c.1 c.c.)" },
        { value: "ufficiali_giudiziari_1", label: "Ufficiali giudiziari: compensi per gli atti - 1 anno (art. 2955 n.4 c.c.)" },
      ] },
      { tipo: "data_opzionale", key: "ultimo_atto_interruttivo", label: "Data ultimo atto interruttivo (se presente)" },
    ],
    endpoint: "/calc/prescrizione",
    buildBody: (f) => ({
      data_decorrenza: f.data_decorrenza,
      tipo_termine: f.tipo_termine,
      atti_interruttivi: f.ultimo_atto_interruttivo ? [f.ultimo_atto_interruttivo] : [],
    }),
    risultato: (r) => [["Data di prescrizione", isoToDataIt(r.data_prescrizione)], ["Decorrenza effettiva", isoToDataIt(r.decorrenza_effettiva)]],
    scadenze: (r) => [{ titolo: `Prescrizione (${r.label})`, data: r.data_prescrizione }],
  },
  "termini-citazione": {
    campi: [
      { tipo: "scelta", key: "direzione", label: "Calcola...", default: "da_notifica", opzioni: [
        { value: "da_notifica", label: "Udienza minima (da una notifica)" },
        { value: "da_udienza", label: "Termine ultimo di notifica (da un'udienza)" },
      ] },
      { tipo: "data", key: "data", label: "Data" },
      { tipo: "bool", key: "estero", label: "Notifica all'estero (150gg anziché 120gg)", default: false },
      { tipo: "bool", key: "escludi_feriale", label: "Applica sospensione feriale (1-31 agosto)", default: true },
    ],
    endpoint: "/calc/termini-citazione",
    risultato: (r) => r.direzione === "da_notifica"
      ? [["Udienza minima", isoToDataIt(r.udienza_minima)], ["Giorni liberi", String(r.giorni_liberi)]]
      : [["Notifica entro", isoToDataIt(r.notifica_entro)], ["Giorni liberi", String(r.giorni_liberi)]],
    scadenze: (r) => r.direzione === "da_notifica"
      ? [{ titolo: "Udienza minima di comparizione", data: r.udienza_minima }]
      : [{ titolo: "Termine ultimo notifica citazione", data: r.notifica_entro }],
  },
  "precetto": {
    campi: [
      { tipo: "data", key: "data_notifica_precetto", label: "Data notifica del precetto" },
      { tipo: "bool", key: "escludi_feriale", label: "Applica sospensione feriale", default: false },
      { tipo: "scelta", key: "tipo_pignoramento", label: "Termini successivi al pignoramento (facoltativo)", default: "", opzioni: [
        { value: "", label: "Nessuno" },
        { value: "mobiliare", label: "Mobiliare (iscrizione a ruolo e istanza di vendita, art. 518 c.p.c.)" },
        { value: "immobiliare", label: "Immobiliare (iscrizione a ruolo e istanza di vendita, art. 557 c.p.c.)" },
        { value: "presso_terzi", label: "Presso terzi (iscrizione a ruolo)" },
        { value: "autoveicoli", label: "Autoveicoli/motoveicoli/rimorchi (art. 521-bis)" },
      ] },
      { tipo: "data_opzionale", key: "data_pignoramento", label: "Data di compimento del pignoramento (per l'istanza di vendita)",
        mostraSe: (f) => f.tipo_pignoramento === "mobiliare" || f.tipo_pignoramento === "immobiliare" || f.tipo_pignoramento === "autoveicoli",
        nota: (f) => f.tipo_pignoramento === "immobiliare" ? "Per l'immobiliare, il \"compimento del pignoramento\" coincide con la notificazione al debitore, non con la trascrizione (Cass. civ. n. 7998/2015)." : null },
      { tipo: "data_opzionale", key: "data_consegna_verbale", label: "Data di consegna del verbale/atto al creditore da parte dell'ufficiale giudiziario (per l'iscrizione a ruolo)",
        mostraSe: (f) => f.tipo_pignoramento === "mobiliare" || f.tipo_pignoramento === "immobiliare" || f.tipo_pignoramento === "presso_terzi" },
      { tipo: "data_opzionale", key: "data_comunicazione_ivg", label: "Data comunicazione IVG di avvenuta consegna (solo autoveicoli)",
        mostraSe: (f) => f.tipo_pignoramento === "autoveicoli" },
      { tipo: "data_opzionale", key: "data_iscrizione_ruolo", label: "Data iscrizione a ruolo (solo autoveicoli, se già avvenuta)",
        mostraSe: (f) => f.tipo_pignoramento === "autoveicoli" },
    ],
    endpoint: "/calc/precetto",
    buildBody: (f) => ({
      data_notifica_precetto: f.data_notifica_precetto,
      escludi_feriale: f.escludi_feriale,
      ...(f.tipo_pignoramento ? {
        tipo_pignoramento: f.tipo_pignoramento,
        data_pignoramento: f.data_pignoramento || null,
        ...(f.tipo_pignoramento !== "autoveicoli" ? {
          data_consegna_verbale: f.data_consegna_verbale || null,
        } : {
          data_comunicazione_ivg: f.data_comunicazione_ivg || null,
          data_iscrizione_ruolo: f.data_iscrizione_ruolo || null,
        }),
      } : {}),
    }),
    risultato: (r) => [
      ["Data minima pignoramento", isoToDataIt(r.data_minima_pignoramento)],
      ["Scadenza efficacia precetto", isoToDataIt(r.scadenza_efficacia_precetto)],
      ...(r.articolo_iscrizione_ruolo ? ([["Articolo iscrizione a ruolo", r.articolo_iscrizione_ruolo]] as [string, string][]) : []),
      ...(r.articolo_istanza_vendita ? ([["Articolo istanza di vendita", r.articolo_istanza_vendita]] as [string, string][]) : []),
      ...(r.termine_minimo_istanza_vendita ? ([
        ["Istanza di vendita - dal", isoToDataIt(r.termine_minimo_istanza_vendita)],
        ["Istanza di vendita - entro", isoToDataIt(r.termine_massimo_istanza_vendita)],
      ] as [string, string][]) : []),
      ...(r.termine_iscrizione_ruolo && !r.termine_consegna_volontaria ? ([["Iscrizione a ruolo entro", isoToDataIt(r.termine_iscrizione_ruolo)]] as [string, string][]) : []),
      ...(r.termine_consegna_volontaria ? ([["Consegna volontaria veicolo entro", isoToDataIt(r.termine_consegna_volontaria)]] as [string, string][]) : []),
      ...(r.termine_consegna_volontaria && r.termine_iscrizione_ruolo ? ([["Iscrizione a ruolo entro (da comunicazione IVG)", isoToDataIt(r.termine_iscrizione_ruolo)]] as [string, string][]) : []),
      ...(r.termine_istanza_vendita ? ([["Istanza di vendita entro (da iscrizione a ruolo)", isoToDataIt(r.termine_istanza_vendita)]] as [string, string][]) : []),
    ],
    scadenze: (r) => [
      { titolo: "Data minima per il pignoramento", data: r.data_minima_pignoramento },
      { titolo: "Scadenza efficacia del precetto", data: r.scadenza_efficacia_precetto },
      ...(r.termine_massimo_istanza_vendita ? [{ titolo: "Termine istanza di vendita", data: r.termine_massimo_istanza_vendita }] : []),
      ...(r.termine_iscrizione_ruolo && !r.termine_consegna_volontaria ? [{ titolo: "Termine iscrizione a ruolo", data: r.termine_iscrizione_ruolo }] : []),
      ...(r.termine_consegna_volontaria ? [{ titolo: "Consegna volontaria veicolo (IVG)", data: r.termine_consegna_volontaria }] : []),
      ...(r.termine_consegna_volontaria && r.termine_iscrizione_ruolo ? [{ titolo: "Iscrizione a ruolo (pignoramento autoveicoli)", data: r.termine_iscrizione_ruolo }] : []),
      ...(r.termine_istanza_vendita ? [{ titolo: "Istanza di vendita (pignoramento autoveicoli)", data: r.termine_istanza_vendita }] : []),
    ],
  },
  "impugnazione-licenziamento": {
    campi: [
      { tipo: "data", key: "data_licenziamento", label: "Data di ricezione del licenziamento" },
    ],
    endpoint: "/calc/impugnazione-licenziamento",
    risultato: (r) => [
      ["Termine impugnazione stragiudiziale", isoToDataIt(r.termine_impugnazione_stragiudiziale)],
      ["Termine deposito ricorso/conciliazione", isoToDataIt(r.termine_deposito_ricorso_o_richiesta_conciliazione)],
    ],
    scadenze: (r) => [
      { titolo: "Termine impugnazione licenziamento", data: r.termine_impugnazione_stragiudiziale },
      { titolo: "Termine deposito ricorso o richiesta conciliazione", data: r.termine_deposito_ricorso_o_richiesta_conciliazione },
    ],
  },
  "ricorso-tributario": {
    campi: [
      { tipo: "data", key: "data_notifica_atto", label: "Data notifica dell'atto impositivo" },
      { tipo: "bool", key: "escludi_feriale", label: "Applica sospensione feriale (1-31 agosto)", default: true },
    ],
    endpoint: "/calc/ricorso-tributario",
    risultato: (r) => [["Scadenza ricorso", isoToDataIt(r.scadenza_ricorso)]],
    scadenze: (r) => [{ titolo: "Scadenza ricorso tributario", data: r.scadenza_ricorso }],
  },
  "ricorso-tar": {
    campi: [
      { tipo: "scelta", key: "tipo", label: "Tipo di ricorso", default: "giurisdizionale", opzioni: [
        { value: "giurisdizionale", label: "Giurisdizionale al TAR (60gg)" },
        { value: "straordinario", label: "Straordinario al Capo dello Stato (120gg)" },
      ] },
      { tipo: "data", key: "data_notifica_o_conoscenza", label: "Data notifica o piena conoscenza" },
      { tipo: "bool", key: "escludi_feriale", label: "Applica sospensione feriale (1-31 agosto)", default: true },
    ],
    endpoint: "/calc/ricorso-tar",
    risultato: (r) => [["Scadenza ricorso", isoToDataIt(r.scadenza_ricorso)]],
    scadenze: (r) => [{ titolo: "Scadenza ricorso TAR", data: r.scadenza_ricorso }],
  },
  "termine-querela": {
    campi: [
      { tipo: "data", key: "data_notizia_del_fatto", label: "Data della notizia del fatto" },
      { tipo: "bool", key: "reato_sessuale", label: "Reato contro la libertà sessuale (12 mesi anziché 3)", default: false },
    ],
    endpoint: "/calc/termine-querela",
    risultato: (r) => [["Scadenza querela", isoToDataIt(r.scadenza_querela)]],
    scadenze: (r) => [{ titolo: "Termine per la querela", data: r.scadenza_querela }],
  },
  "disdetta-locazione": {
    campi: [
      { tipo: "data", key: "data_scadenza_contratto", label: "Data di scadenza del contratto" },
      { tipo: "scelta", key: "tipo", label: "Tipo di locazione", default: "abitativo", opzioni: [
        { value: "abitativo", label: "Abitativa (6 mesi prima)" },
        { value: "commerciale", label: "Commerciale (12 mesi prima)" },
        { value: "commerciale_alberghiero", label: "Commerciale con attività alberghiera (18 mesi prima)" },
      ] },
    ],
    endpoint: "/calc/disdetta-locazione",
    risultato: (r) => [["Termine ultimo per la disdetta", isoToDataIt(r.termine_ultimo_disdetta)]],
    scadenze: (r) => [{ titolo: "Termine ultimo per la disdetta di locazione", data: r.termine_ultimo_disdetta }],
  },
  "parametri-forensi": {
    campi: [
      {
        tipo: "scelta", key: "competenza", label: "Competenza per giurisdizione o materia", default: "tribunale", opzioni: COMPETENZE_PARCELLA,
        nota: (f) => (COMPETENZE_PARCELLA.find((c) => c.value === f.competenza)?.rito
          ? null
          : "Per questa competenza non abbiamo una tabella di parametri forensi verificata (disponibile per Giudice di pace, Tribunale, Corte d'Appello e Cassazione)."),
      },
      { tipo: "bool", key: "valore_indeterminabile", label: "Valore della causa indeterminabile", default: false },
      { tipo: "numero", key: "valore_causa", label: "Valore della causa €", default: "", mostraSe: (f) => !f.valore_indeterminabile },
      { tipo: "scelta", key: "complessita_indeterminabile", label: "Complessità", default: "alta", mostraSe: (f) => !!f.valore_indeterminabile, opzioni: [
        { value: "bassa", label: "Bassa" }, { value: "media", label: "Media" }, { value: "alta", label: "Alta" }, { value: "particolare_importanza", label: "Particolare importanza" },
      ] },
      { tipo: "numero", key: "numero_parti_stessa_posizione", label: "N. parti assistite con la stessa posizione", default: "1" },
      { tipo: "bool", key: "gratuito_patrocinio", label: "Gratuito patrocinio (riduzione del 50%)", default: false },
    ],
    endpoint: "/calc/parametri-forensi",
    validate: (f) => {
      const rito = COMPETENZE_PARCELLA.find((c) => c.value === f.competenza)?.rito;
      if (!rito) return "Per la competenza scelta non abbiamo una tabella di parametri forensi verificata (disponibile per Giudice di pace, Tribunale, Corte d'Appello e Cassazione).";
      return null;
    },
    buildBody: (f) => ({
      rito: COMPETENZE_PARCELLA.find((c) => c.value === f.competenza)?.rito,
      valore_indeterminabile: !!f.valore_indeterminabile,
      valore_causa: f.valore_indeterminabile ? 0 : parseNumeroIt(f.valore_causa),
      complessita_indeterminabile: f.complessita_indeterminabile,
      numero_parti_stessa_posizione: parseNumeroIt(f.numero_parti_stessa_posizione) || 1,
      gratuito_patrocinio: !!f.gratuito_patrocinio,
    }),
    risultato: (r) => [
      ["Fase di studio", formatEuro(r.fasi.studio)],
      ["Fase introduttiva", formatEuro(r.fasi.introduttiva)],
      ...(r.fasi.istruttoria != null ? ([["Fase istruttoria", formatEuro(r.fasi.istruttoria)]] as [string, string][]) : []),
      ["Fase decisionale", formatEuro(r.fasi.decisionale)],
      ...(r.maggiorazione_parti_pct ? ([["Maggiorazione pluralità parti", `+${r.maggiorazione_parti_pct}%`]] as [string, string][]) : []),
      ...(r.incremento_oltre_520k_pct ? ([["Incremento oltre 520.000€ (fino a)", `+${r.incremento_oltre_520k_pct}%`]] as [string, string][]) : []),
      ["Totale medio", formatEuro(r.totale_medio)],
      ...(r.totale_minimo_discrezionale != null
        ? ([["Range discrezionale del giudice", `${formatEuro(r.totale_minimo_discrezionale)} - ${formatEuro(r.totale_massimo_discrezionale)}`]] as [string, string][])
        : []),
    ],
  },
  "compenso-mediazione": {
    campi: [
      { tipo: "bool", key: "valore_indeterminabile", label: "Valore della lite indeterminabile", default: false },
      { tipo: "numero", key: "valore_lite", label: "Valore della lite €", default: "", mostraSe: (f) => !f.valore_indeterminabile },
      {
        tipo: "scelta", key: "valore_indeterminabile_livello", label: "Complessità presunta (sceglie lo scaglione del 1° incontro)", default: "medio", mostraSe: (f) => !!f.valore_indeterminabile,
        opzioni: [
          { value: "basso", label: "Basso" },
          { value: "medio", label: "Medio" },
          { value: "alto", label: "Alto" },
        ],
      },
      { tipo: "bool", key: "condizione_procedibilita", label: "Mediazione obbligatoria o demandata dal giudice (-1/5)", default: false },
      {
        tipo: "scelta", key: "numero_incontri", label: "Numero di incontri", default: "uno",
        opzioni: [
          { value: "uno", label: "Uno" },
          { value: "piu_di_uno", label: "Più di uno" },
        ],
      },
      { tipo: "bool", key: "accordo_raggiunto", label: "Accordo raggiunto", default: false },
      { tipo: "numero", key: "maggiorazione_discrezionale_pct", label: "Maggiorazione discrezionale dell'organismo sull'accordo (0-20%)", default: "0", mostraSe: (f) => !!f.accordo_raggiunto },
      { tipo: "bool", key: "applica_iva", label: "Applica IVA (22%)", default: false },
    ],
    endpoint: "/calc/compenso-mediazione",
    risultato: (r) => [
      ["Spese di avvio", formatEuro(r.spese_avvio)],
      ["Indennità primo incontro", formatEuro(r.spese_primo_incontro)],
      ...(r.ulteriori_spese_dovute
        ? ([
            ["Ulteriori spese (tabella A) — minimo", formatEuro(r.ulteriori_spese_minimo)],
            ["Ulteriori spese (tabella A) — massimo", formatEuro(r.ulteriori_spese_massimo)],
            ...(r.maggiorazione_accordo_pct ? ([["di cui maggiorazione per accordo", `+${r.maggiorazione_accordo_pct}%`]] as [string, string][]) : []),
            ...(r.maggiorazione_discrezionale_pct ? ([["di cui maggiorazione discrezionale (sul massimo)", `+${r.maggiorazione_discrezionale_pct}%`]] as [string, string][]) : []),
          ] as [string, string][])
        : ([["Ulteriori spese (tabella A)", "Non dovute: esito negativo al primo incontro"]] as [string, string][])),
      ["Totale — minimo", formatEuro(r.totale_minimo)],
      ["Totale — massimo", formatEuro(r.totale_massimo)],
      ...(r.applica_iva
        ? ([
            ["Totale con IVA — minimo", formatEuro(r.totale_minimo_con_iva)],
            ["Totale con IVA — massimo", formatEuro(r.totale_massimo_con_iva)],
          ] as [string, string][])
        : []),
    ],
  },
  "giorni-tra-date": {
    campi: [
      { tipo: "data", key: "data_iniziale", label: "Data iniziale" },
      { tipo: "data", key: "data_finale", label: "Data finale" },
      { tipo: "titolo", key: "escludi_titolo", label: "Escludi dal conteggio:" },
      { tipo: "bool", key: "escludi_sabati", label: "Sabati", default: false },
      { tipo: "bool", key: "escludi_domeniche", label: "Domeniche", default: false },
      { tipo: "bool", key: "escludi_festivi", label: "Festivi", default: false },
      { tipo: "bool", key: "escludi_chiusura_estiva", label: "Chiusura estiva (1-31 agosto)", default: false },
      { tipo: "bool", key: "includi_data_iniziale", label: "Conta anche il giorno iniziale (di norma escluso)", default: false },
      { tipo: "numero", key: "giorno_patrono", label: "Festa patronale locale — giorno (opzionale)", default: "" },
      { tipo: "numero", key: "mese_patrono", label: "Festa patronale locale — mese (opzionale)", default: "" },
    ],
    endpoint: "/calc/giorni-tra-date",
    buildBody: (f) => ({
      data_iniziale: f.data_iniziale, data_finale: f.data_finale,
      escludi_sabati: f.escludi_sabati, escludi_domeniche: f.escludi_domeniche,
      escludi_festivi: f.escludi_festivi, escludi_chiusura_estiva: f.escludi_chiusura_estiva,
      includi_data_iniziale: f.includi_data_iniziale,
      giorno_patrono: f.giorno_patrono ? parseNumeroIt(f.giorno_patrono) : null,
      mese_patrono: f.mese_patrono ? parseNumeroIt(f.mese_patrono) : null,
    }),
    risultato: (r) => [["Giorni", String(r.giorni)]],
  },
  "eta-anagrafica": {
    campi: [
      { tipo: "data", key: "data_nascita", label: "Data di nascita" },
      { tipo: "data_opzionale", key: "data_riferimento", label: "Data di riferimento (default oggi)" },
    ],
    endpoint: "/calc/eta-anagrafica",
    buildBody: (f) => ({ data_nascita: f.data_nascita, data_riferimento: f.data_riferimento || null }),
    risultato: (r) => [["Età", `${r.anni} anni, ${r.mesi} mesi, ${r.giorni} giorni`]],
  },
  "aggiungi-giorni-lavorativi": {
    campi: [
      { tipo: "data", key: "data", label: "Data di partenza" },
      { tipo: "numero", key: "numero_giorni", label: "Numero di giorni", default: "" },
      { tipo: "scelta", key: "direzione", label: "Direzione", default: "dopo", opzioni: [
        { value: "dopo", label: "Dopo (in avanti)" }, { value: "prima", label: "Prima (a ritroso)" },
      ] },
      { tipo: "titolo", key: "escludi_titolo", label: "Escludi dal conteggio:" },
      { tipo: "bool", key: "escludi_sabati", label: "Sabati", default: true },
      { tipo: "bool", key: "escludi_domeniche", label: "Domeniche", default: true },
      { tipo: "bool", key: "escludi_festivi", label: "Festivi", default: true },
      { tipo: "bool", key: "escludi_chiusura_estiva", label: "Chiusura estiva (1-31 agosto)", default: false },
      { tipo: "numero", key: "giorno_patrono", label: "Festa patronale locale — giorno (opzionale)", default: "" },
      { tipo: "numero", key: "mese_patrono", label: "Festa patronale locale — mese (opzionale)", default: "" },
    ],
    endpoint: "/calc/aggiungi-giorni-lavorativi",
    buildBody: (f) => ({
      data: f.data, numero_giorni: parseNumeroIt(f.numero_giorni), direzione: f.direzione,
      escludi_sabati: f.escludi_sabati, escludi_domeniche: f.escludi_domeniche,
      escludi_festivi: f.escludi_festivi, escludi_chiusura_estiva: f.escludi_chiusura_estiva,
      giorno_patrono: f.giorno_patrono ? parseNumeroIt(f.giorno_patrono) : null,
      mese_patrono: f.mese_patrono ? parseNumeroIt(f.mese_patrono) : null,
    }),
    risultato: (r) => [["Data calcolata", isoToDataIt(r.data_calcolata)]],
    scadenze: (r) => [{ titolo: "Data calcolata (giorni lavorativi)", data: r.data_calcolata }],
  },
  "termini-separazione-divorzio": {
    campi: [
      { tipo: "data", key: "data_udienza", label: "Data udienza" },
      { tipo: "scelta", key: "tipo", label: "Fase", default: "473bis17", opzioni: [
        { value: "473bis17", label: "Memorie (udienza di prima comparizione, art. 473-bis.17 c.p.c.)" },
        { value: "473bis28", label: "Comparse e repliche (udienza di discussione, art. 473-bis.28 c.p.c.)" },
      ] },
      { tipo: "bool", key: "escludi_feriale", label: "Applica sospensione feriale (1-31 agosto)", default: false },
      { tipo: "bool", key: "escludi_covid", label: "Applica sospensione Covid-19 (9/3-11/5/2020)", default: false },
    ],
    endpoint: "/calc/termini-separazione-divorzio",
    risultato: (r) => [
      ["Primo termine", isoToDataIt(r.primo_termine)],
      ["Secondo termine", isoToDataIt(r.secondo_termine)],
      ["Terzo termine", isoToDataIt(r.terzo_termine)],
    ],
    scadenze: (r) => [
      { titolo: "Separazione/divorzio — primo termine", data: r.primo_termine },
      { titolo: "Separazione/divorzio — secondo termine", data: r.secondo_termine },
      { titolo: "Separazione/divorzio — terzo termine", data: r.terzo_termine },
    ],
  },
  "termini-esecuzioni": {
    campi: [
      { tipo: "scelta", key: "tipo", label: "Tipo di pignoramento", default: "immobiliare", opzioni: [
        { value: "mobiliare", label: "Mobiliare" }, { value: "immobiliare", label: "Immobiliare" },
        { value: "presso_terzi", label: "Presso terzi" }, { value: "autoveicoli", label: "Autoveicoli" },
      ] },
      { tipo: "data", key: "data_consegna_verbale", label: "Data consegna verbale di pignoramento (UNEP)" },
      { tipo: "data", key: "data_compimento_pignoramento", label: "Data compimento pignoramento", mostraSe: (f) => f.tipo !== "presso_terzi" },
      { tipo: "bool", key: "escludi_feriale", label: "Applica sospensione feriale (1-31 agosto)", default: false },
    ],
    endpoint: "/calc/termini-esecuzioni",
    buildBody: (f) => ({
      tipo: f.tipo, data_consegna_verbale: f.data_consegna_verbale,
      data_compimento_pignoramento: f.data_compimento_pignoramento || null, escludi_feriale: f.escludi_feriale,
    }),
    risultato: (r) => [
      ["Primo termine", isoToDataIt(r.primo_termine)],
      ["Secondo termine", isoToDataIt(r.secondo_termine)],
    ],
    scadenze: (r) => [
      { titolo: "Termini esecuzione — primo termine", data: r.primo_termine },
      { titolo: "Termini esecuzione — secondo termine", data: r.secondo_termine },
    ],
  },
  "termini-procedimento-semplificato": {
    campi: [
      { tipo: "data", key: "data_udienza", label: "Data della prima udienza" },
      { tipo: "numero", key: "giorni_primo_termine", label: "Giorni per il primo termine", default: "" },
      { tipo: "numero", key: "giorni_secondo_termine", label: "Giorni per il secondo termine", default: "" },
      { tipo: "bool", key: "escludi_feriale", label: "Applica sospensione feriale (1-31 agosto)", default: false },
      { tipo: "bool", key: "escludi_covid", label: "Applica sospensione Covid-19 (9/3-11/5/2020)", default: false },
      { tipo: "bool", key: "prudenziale", label: "Calcolo prudenziale (termine più favorevole)", default: false },
    ],
    endpoint: "/calc/termini-procedimento-semplificato",
    buildBody: (f) => ({
      data_udienza: f.data_udienza, giorni_primo_termine: parseNumeroIt(f.giorni_primo_termine),
      giorni_secondo_termine: parseNumeroIt(f.giorni_secondo_termine),
      escludi_feriale: f.escludi_feriale, escludi_covid: f.escludi_covid, prudenziale: f.prudenziale,
    }),
    risultato: (r) => [
      ["Primo termine", isoToDataIt(r.primo_termine)],
      ["Secondo termine", isoToDataIt(r.secondo_termine)],
    ],
    scadenze: (r) => [
      { titolo: "Procedimento semplificato — primo termine", data: r.primo_termine },
      { titolo: "Procedimento semplificato — secondo termine", data: r.secondo_termine },
    ],
  },
  "termini-deposito-appello": {
    campi: [
      { tipo: "data", key: "data_udienza", label: "Data udienza di precisazione delle conclusioni" },
      { tipo: "bool", key: "escludi_feriale", label: "Applica sospensione feriale (1-31 agosto)", default: false },
      { tipo: "bool", key: "escludi_covid", label: "Applica sospensione Covid-19 (9/3-11/5/2020)", default: false },
    ],
    endpoint: "/calc/termini-deposito-appello",
    risultato: (r) => [
      ["Note di precisazione delle conclusioni", isoToDataIt(r.note_precisazione_conclusioni)],
      ["Comparsa conclusionale", isoToDataIt(r.comparsa_conclusionale)],
      ["Memoria di replica", isoToDataIt(r.memoria_replica)],
    ],
    scadenze: (r) => [
      { titolo: "Note di precisazione delle conclusioni", data: r.note_precisazione_conclusioni },
      { titolo: "Comparsa conclusionale", data: r.comparsa_conclusionale },
      { titolo: "Memoria di replica", data: r.memoria_replica },
    ],
  },
  "termini-deposito-ctu": {
    campi: [
      { tipo: "data", key: "data_iniziale", label: "Data inizio operazioni peritali" },
      { tipo: "numero", key: "giorni_bozza", label: "Giorni per l'invio della bozza ai CTP", default: "20" },
      { tipo: "numero", key: "giorni_osservazioni", label: "Giorni per le osservazioni dei CTP", default: "15" },
      { tipo: "numero", key: "giorni_deposito", label: "Giorni per il deposito della relazione definitiva", default: "15" },
      { tipo: "bool", key: "escludi_feriale", label: "Applica sospensione feriale (1-31 agosto)", default: false },
      { tipo: "bool", key: "prudenziale", label: "Calcolo prudenziale (termine più favorevole)", default: false },
    ],
    endpoint: "/calc/termini-deposito-ctu",
    buildBody: (f) => ({
      data_iniziale: f.data_iniziale, giorni_bozza: parseNumeroIt(f.giorni_bozza),
      giorni_osservazioni: parseNumeroIt(f.giorni_osservazioni), giorni_deposito: parseNumeroIt(f.giorni_deposito),
      escludi_feriale: f.escludi_feriale, prudenziale: f.prudenziale,
    }),
    risultato: (r) => [
      ["Termine bozza", isoToDataIt(r.termine_bozza)],
      ["Termine osservazioni", isoToDataIt(r.termine_osservazioni)],
      ["Termine deposito", isoToDataIt(r.termine_deposito)],
    ],
    scadenze: (r) => [
      { titolo: "CTU — invio bozza ai CTP", data: r.termine_bozza },
      { titolo: "CTU — osservazioni dei CTP", data: r.termine_osservazioni },
      { titolo: "CTU — deposito relazione definitiva", data: r.termine_deposito },
    ],
  },
  "scadenze-multe": {
    campi: [
      { tipo: "scelta", key: "stato", label: "Stato della multa", default: "contestata", opzioni: [
        { value: "contestata", label: "Contestata immediatamente (verbale consegnato a mano)" },
        { value: "notificata", label: "Notificata (verbale ricevuto per posta/PEC)" },
        { value: "ricorso_prefetto_consegnato", label: "Ricorso al Prefetto consegnato a mano" },
        { value: "ricorso_prefetto_raccomandata", label: "Ricorso al Prefetto inviato per raccomandata" },
        { value: "ricorso_gdp_presentato", label: "Ricorso al Giudice di Pace presentato" },
        { value: "prefetto_respinto", label: "Ricorso al Prefetto respinto" },
        { value: "gdp_respinto", label: "Ricorso al Giudice di Pace respinto" },
      ] },
      { tipo: "data", key: "data_riferimento", label: "Data di riferimento" },
      { tipo: "scelta", key: "azione", label: "Cosa vuoi fare", default: "pagare",
        mostraSe: (f) => f.stato === "contestata" || f.stato === "notificata",
        opzioni: [
          { value: "pagare", label: "Pagare (eventualmente con sconto)" },
          { value: "ricorso_prefetto", label: "Fare ricorso al Prefetto" },
          { value: "ricorso_gdp", label: "Fare ricorso al Giudice di Pace" },
        ] },
      { tipo: "scelta", key: "inoltro", label: "Modalità di inoltro del ricorso", default: "organo_accertatore",
        mostraSe: (f) => f.stato === "ricorso_prefetto_raccomandata",
        opzioni: [
          { value: "organo_accertatore", label: "All'organo accertatore" },
          { value: "prefetto_diretto", label: "Direttamente al Prefetto" },
        ] },
      { tipo: "numero", key: "sanzione", label: "Importo della sanzione € (opzionale, per lo sconto del 30%)", default: "",
        mostraSe: (f) => (f.stato === "contestata" || f.stato === "notificata") && f.azione === "pagare" },
    ],
    endpoint: "/calc/scadenze-multe",
    buildBody: (f) => ({
      stato: f.stato, data_riferimento: f.data_riferimento,
      azione: (f.stato === "contestata" || f.stato === "notificata") ? f.azione : null,
      inoltro: f.stato === "ricorso_prefetto_raccomandata" ? f.inoltro : null,
      sanzione: f.sanzione ? parseNumeroIt(f.sanzione) : null,
    }),
    risultato: (r) => r.nota ? [["Nota", r.nota]] : [
      ...(r.scadenza_ricorso_prefetto ? ([["Scadenza ricorso al Prefetto", isoToDataIt(r.scadenza_ricorso_prefetto)]] as [string, string][]) : []),
      ...(r.scadenza_ricorso_gdp ? ([["Scadenza ricorso al Giudice di Pace", isoToDataIt(r.scadenza_ricorso_gdp)]] as [string, string][]) : []),
      ...(r.scadenza_appello ? ([["Scadenza appello", isoToDataIt(r.scadenza_appello)]] as [string, string][]) : []),
      ...(r.scadenza_pagamento ? ([
        ["Scadenza pagamento", isoToDataIt(r.scadenza_pagamento)],
        ["Scadenza pagamento scontato (5gg)", isoToDataIt(r.scadenza_sconto)],
        ...(r.importo_scontato_30pct != null ? ([["Importo scontato del 30%", formatEuro(r.importo_scontato_30pct)]] as [string, string][]) : []),
      ] as [string, string][]) : []),
      ...(r.scadenza_silenzio_assenso ? ([["Scadenza per silenzio-assenso", isoToDataIt(r.scadenza_silenzio_assenso)]] as [string, string][]) : []),
    ],
  },
  "prescrizione-reati": {
    campi: [
      { tipo: "data", key: "data_reato", label: "Data del reato" },
      { tipo: "scelta", key: "tipo_pena", label: "Tipo di pena", default: "reclusione", opzioni: [
        { value: "reclusione", label: "Reclusione" }, { value: "arresto", label: "Arresto" },
        { value: "multa", label: "Multa" }, { value: "ammenda", label: "Ammenda" },
      ] },
      { tipo: "numero", key: "pena_edittale_anni", label: "Pena edittale massima (anni)", default: "", mostraSe: (f) => f.tipo_pena === "reclusione" || f.tipo_pena === "arresto" },
      { tipo: "bool", key: "raddoppio", label: "Raddoppio dei termini (es. art. 157 c.8 c.p.)", default: false },
    ],
    endpoint: "/calc/prescrizione-reati",
    buildBody: (f) => ({
      data_reato: f.data_reato, tipo_pena: f.tipo_pena,
      pena_edittale_anni: (f.tipo_pena === "reclusione" || f.tipo_pena === "arresto") ? parseNumeroIt(f.pena_edittale_anni) : null,
      raddoppio: f.raddoppio,
    }),
    risultato: (r) => [["Termine massimo di prescrizione", isoToDataIt(r.termine_massimo)]],
    scadenze: (r) => [{ titolo: "Prescrizione del reato", data: r.termine_massimo }],
  },
  "fine-pena": {
    campi: [
      { tipo: "data", key: "data_inizio", label: "Data di inizio esecuzione della pena" },
      { tipo: "numero", key: "durata_anni", label: "Durata pena — anni", default: "0" },
      { tipo: "numero", key: "durata_mesi", label: "Durata pena — mesi", default: "0" },
      { tipo: "numero", key: "durata_giorni", label: "Durata pena — giorni", default: "0" },
      { tipo: "bool", key: "liberazione_anticipata", label: "Applica liberazione anticipata (45gg a semestre)", default: false },
      { tipo: "data_opzionale", key: "data_limite", label: "Calcola fino al (opzionale)", mostraSe: (f) => !!f.liberazione_anticipata },
      { tipo: "bool", key: "solo_semestri_completi", label: "Conta solo i semestri completi", default: true, mostraSe: (f) => !!f.liberazione_anticipata },
      {
        tipo: "lista", key: "crediti", label: "Periodi già scontati (crediti di pena)", etichettaAggiungi: "Aggiungi un periodo",
        campiRiga: [
          { tipo: "scelta", key: "tipo", label: "Tipo", default: "10", opzioni: [
            { value: "10", label: "Custodia cautelare in carcere" },
            { value: "20", label: "Custodia cautelare in detenzione domiciliare" },
            { value: "30", label: "Detenzione domiciliare ex art. 47-ter O.P." },
            { value: "40", label: "Periodo di detenzione all'estero riconosciuto" },
            { value: "50", label: "Semilibertà" },
            { value: "60", label: "Affidamento in prova al servizio sociale" },
            { value: "70", label: "Lavoro di pubblica utilità" },
            { value: "80", label: "Sospensione dell'esecuzione ex art. 656 c.p.p." },
            { value: "90", label: "Periodo che rileva per la liberazione anticipata" },
            { value: "100", label: "Periodo che non rileva per la liberazione anticipata" },
          ] },
          { tipo: "data", key: "dal", label: "Dal" },
          { tipo: "data", key: "al", label: "Al" },
        ],
      },
      {
        tipo: "lista", key: "interruzioni", label: "Interruzioni dell'esecuzione", etichettaAggiungi: "Aggiungi un'interruzione",
        campiRiga: [
          { tipo: "data", key: "dal", label: "Dal" },
          { tipo: "data", key: "al", label: "Al" },
        ],
      },
    ],
    endpoint: "/calc/fine-pena",
    buildBody: (f) => ({
      data_inizio: f.data_inizio, durata_anni: parseNumeroIt(f.durata_anni), durata_mesi: parseNumeroIt(f.durata_mesi),
      durata_giorni: parseNumeroIt(f.durata_giorni), liberazione_anticipata: f.liberazione_anticipata,
      data_limite: f.liberazione_anticipata ? (f.data_limite || null) : null,
      solo_semestri_completi: f.solo_semestri_completi,
      crediti: (f.crediti || []).map((c: Record<string, string>) => ({ tipo: c.tipo, dal: c.dal, al: c.al })),
      interruzioni: (f.interruzioni || []).map((i: Record<string, string>) => ({ dal: i.dal, al: i.al })),
    }),
    risultato: (r) => r.fine_pena_con_liberazione_anticipata ? [
      ["Fine pena (senza detrazioni)", isoToDataIt(r.fine_pena_senza_detrazioni)],
      ["Giorni di detrazione spettanti", String(r.giorni_detrazione_spettanti)],
      ["Fine pena (con liberazione anticipata)", isoToDataIt(r.fine_pena_con_liberazione_anticipata)],
      ["Termine attivazione ufficio (90gg prima)", isoToDataIt(r.termine_attivazione_ufficio)],
    ] : [["Fine pena", isoToDataIt(r.fine_pena_senza_detrazioni)]],
    scadenze: (r) => [{ titolo: "Fine pena", data: r.fine_pena_con_liberazione_anticipata || r.fine_pena_senza_detrazioni }],
  },
  "conversione-pena": {
    campi: [
      { tipo: "scelta", key: "direzione", label: "Direzione", default: "pecuniaria_a_detentiva", opzioni: [
        { value: "pecuniaria_a_detentiva", label: "Da pena pecuniaria a detentiva (ragguaglio)" },
        { value: "detentiva_a_pecuniaria", label: "Da pena detentiva a pecuniaria" },
      ] },
      { tipo: "numero", key: "valore_giornaliero", label: "Valore giornaliero di ragguaglio €", default: "250" },
      { tipo: "numero", key: "pena_pecuniaria", label: "Pena pecuniaria da convertire €", default: "", mostraSe: (f) => f.direzione === "pecuniaria_a_detentiva" },
      { tipo: "titolo", key: "tit_congiunta", label: "Pena detentiva congiunta (se presente):", mostraSe: (f) => f.direzione === "pecuniaria_a_detentiva" },
      { tipo: "numero", key: "pena_congiunta_anni", label: "Anni", default: "0", mostraSe: (f) => f.direzione === "pecuniaria_a_detentiva" },
      { tipo: "numero", key: "pena_congiunta_mesi", label: "Mesi", default: "0", mostraSe: (f) => f.direzione === "pecuniaria_a_detentiva" },
      { tipo: "numero", key: "pena_congiunta_giorni", label: "Giorni", default: "0", mostraSe: (f) => f.direzione === "pecuniaria_a_detentiva" },
      { tipo: "titolo", key: "tit_pena", label: "Pena da convertire:", mostraSe: (f) => f.direzione === "detentiva_a_pecuniaria" },
      { tipo: "numero", key: "pena_anni", label: "Anni", default: "0", mostraSe: (f) => f.direzione === "detentiva_a_pecuniaria" },
      { tipo: "numero", key: "pena_mesi", label: "Mesi", default: "0", mostraSe: (f) => f.direzione === "detentiva_a_pecuniaria" },
      { tipo: "numero", key: "pena_giorni", label: "Giorni", default: "0", mostraSe: (f) => f.direzione === "detentiva_a_pecuniaria" },
      { tipo: "titolo", key: "tit_scontata", label: "Pena già scontata (se presente):", mostraSe: (f) => f.direzione === "detentiva_a_pecuniaria" },
      { tipo: "numero", key: "pena_scontata_anni", label: "Anni", default: "0", mostraSe: (f) => f.direzione === "detentiva_a_pecuniaria" },
      { tipo: "numero", key: "pena_scontata_mesi", label: "Mesi", default: "0", mostraSe: (f) => f.direzione === "detentiva_a_pecuniaria" },
      { tipo: "numero", key: "pena_scontata_giorni", label: "Giorni", default: "0", mostraSe: (f) => f.direzione === "detentiva_a_pecuniaria" },
    ],
    endpoint: "/calc/conversione-pena",
    buildBody: (f) => ({
      direzione: f.direzione, valore_giornaliero: parseNumeroIt(f.valore_giornaliero),
      pena_pecuniaria: f.direzione === "pecuniaria_a_detentiva" ? parseNumeroIt(f.pena_pecuniaria) : null,
      pena_congiunta_anni: parseNumeroIt(f.pena_congiunta_anni), pena_congiunta_mesi: parseNumeroIt(f.pena_congiunta_mesi), pena_congiunta_giorni: parseNumeroIt(f.pena_congiunta_giorni),
      pena_anni: parseNumeroIt(f.pena_anni), pena_mesi: parseNumeroIt(f.pena_mesi), pena_giorni: parseNumeroIt(f.pena_giorni),
      pena_scontata_anni: parseNumeroIt(f.pena_scontata_anni), pena_scontata_mesi: parseNumeroIt(f.pena_scontata_mesi), pena_scontata_giorni: parseNumeroIt(f.pena_scontata_giorni),
    }),
    risultato: (r) => r.pena_complessiva_anni != null ? [
      ["Pena pecuniaria", formatEuro(r.pena_pecuniaria)],
      ["Pena complessiva", `${r.pena_complessiva_anni}a ${r.pena_complessiva_mesi}m ${r.pena_complessiva_giorni}gg`],
    ] : [
      ["Pena residua", `${r.pena_residua_anni}a ${r.pena_residua_mesi}m ${r.pena_residua_giorni}gg`],
      ["Pena pecuniaria equivalente", formatEuro(r.pena_pecuniaria)],
    ],
  },
  "interessi-acconti": {
    campi: [
      { tipo: "numero", key: "capitale", label: "Capitale €", default: "" },
      { tipo: "data", key: "data_inizio", label: "Data iniziale" },
      { tipo: "data", key: "data_fine", label: "Data finale" },
      { tipo: "scelta", key: "tipo_interesse", label: "Tipo di interesse", default: "legale", opzioni: [
        { value: "legale", label: "Legale (art. 1284 c.c.)" }, { value: "moratori", label: "Moratori (D.Lgs. 231/2002)" }, { value: "fisso", label: "Tasso fisso" },
      ] },
      { tipo: "numero", key: "tasso_fisso_pct", label: "Tasso fisso annuo %", default: "", mostraSe: (f) => f.tipo_interesse === "fisso" },
      { tipo: "bool", key: "normativa_previgente", label: "Normativa previgente (maggiorazione 7 punti, ante 2013)", default: false, mostraSe: (f) => f.tipo_interesse === "moratori" },
      { tipo: "numero", key: "maggiorazione_extra_pct", label: "Maggiorazione extra (0, 2 o 4 punti, art. 62 c.3 D.L. 1/2012)", default: "0", mostraSe: (f) => f.tipo_interesse === "moratori" },
      { tipo: "bool", key: "applica_1194cc", label: "Imputa gli acconti prima agli interessi maturati, poi al capitale (art. 1194 c.c.)", default: true },
      {
        tipo: "lista", key: "movimenti", label: "Acconti versati e nuovi crediti nel tempo", etichettaAggiungi: "Aggiungi un movimento",
        campiRiga: [
          { tipo: "scelta", key: "tipo", label: "Tipo", default: "acconto", opzioni: [
            { value: "acconto", label: "Acconto" }, { value: "credito", label: "Nuovo credito" },
          ] },
          { tipo: "data", key: "data", label: "Data" },
          { tipo: "numero", key: "importo", label: "Importo €" },
        ],
      },
    ],
    endpoint: "/calc/interessi-acconti",
    buildBody: (f) => ({
      capitale: parseNumeroIt(f.capitale), data_inizio: f.data_inizio, data_fine: f.data_fine, tipo_interesse: f.tipo_interesse,
      tasso_fisso_pct: f.tipo_interesse === "fisso" ? parseNumeroIt(f.tasso_fisso_pct) : null,
      normativa_previgente: f.normativa_previgente, maggiorazione_extra_pct: parseNumeroIt(f.maggiorazione_extra_pct),
      applica_1194cc: f.applica_1194cc !== false,
      movimenti: (f.movimenti || []).map((m: Record<string, string>) => ({
        tipo: m.tipo, data: m.data, importo: parseNumeroIt(m.importo),
      })),
    }),
    risultato: (r) => [
      ["Totale interessi", formatEuro(r.totale_interessi)],
      ["Credito residuo", formatEuro(r.credito_residuo)],
      ["Interessi residui", formatEuro(r.interessi_residui)],
      ["Totale", formatEuro(r.totale)],
    ],
  },
  "interessi-corso-causa": {
    campi: [
      { tipo: "numero", key: "capitale", label: "Capitale €", default: "" },
      { tipo: "data", key: "data_inizio", label: "Decorrenza del credito" },
      { tipo: "data", key: "data_causa", label: "Data della domanda giudiziale" },
      { tipo: "data", key: "data_fine", label: "Data finale" },
      { tipo: "numero", key: "tasso_fisso", label: "Tasso di mora convenzionale %, se pattuito (opzionale)", default: "" },
      { tipo: "bool", key: "rivaluta", label: "Applica rivalutazione monetaria (Cass. SU 1712/1995)", default: true },
      { tipo: "numero", key: "rivaluta_al_pct", label: "Percentuale di rivalutazione", default: "100", mostraSe: (f) => !!f.rivaluta },
    ],
    endpoint: "/calc/interessi-corso-causa",
    buildBody: (f) => ({
      capitale: parseNumeroIt(f.capitale), data_inizio: f.data_inizio, data_causa: f.data_causa, data_fine: f.data_fine,
      tasso_fisso: f.tasso_fisso ? parseNumeroIt(f.tasso_fisso) : null,
      rivaluta: f.rivaluta, rivaluta_al_pct: parseNumeroIt(f.rivaluta_al_pct),
    }),
    risultato: (r) => [
      ["Rivalutazione", formatEuro(r.rivalutazione)],
      ["Totale interessi", formatEuro(r.totale_interessi)],
      ["Totale", formatEuro(r.totale)],
    ],
  },
  "interessi-mora-appalti": {
    campi: [
      { tipo: "scelta", key: "tipo_ritardo", label: "Tipo di ritardo", default: "certificato_pagamento", opzioni: [
        { value: "certificato_pagamento", label: "Emissione certificato di pagamento" },
        { value: "acconto", label: "Pagamento acconto" }, { value: "saldo", label: "Pagamento saldo" },
      ] },
      { tipo: "numero", key: "importo", label: "Importo €", default: "" },
      { tipo: "data", key: "data_inizio", label: "Decorrenza del termine (es. esecuzione lavori/emissione SAL)" },
      { tipo: "numero", key: "termine_giorni", label: "Termine contrattuale per il pagamento (giorni)", default: "45" },
      { tipo: "data", key: "data_fine", label: "Data dell'effettivo pagamento" },
    ],
    endpoint: "/calc/interessi-mora-appalti",
    buildBody: (f) => ({
      tipo_ritardo: f.tipo_ritardo, importo: parseNumeroIt(f.importo), data_inizio: f.data_inizio,
      termine_giorni: parseNumeroIt(f.termine_giorni), data_fine: f.data_fine,
    }),
    risultato: (r) => [
      ["Interessi legali", formatEuro(r.interessi_legali)],
      ["Interessi moratori", formatEuro(r.interessi_moratori)],
      ["Totale interessi", formatEuro(r.totale_interessi)],
      ["Totale", formatEuro(r.totale)],
    ],
  },
  "maggior-danno": {
    campi: [
      { tipo: "numero", key: "capitale", label: "Capitale €", default: "" },
      { tipo: "data", key: "data_inizio", label: "Data iniziale" },
      { tipo: "data", key: "data_fine", label: "Data finale" },
    ],
    endpoint: "/calc/maggior-danno",
    buildBody: (f) => ({ capitale: parseNumeroIt(f.capitale), data_inizio: f.data_inizio, data_fine: f.data_fine, tasso_riferimento: "istat" }),
    risultato: (r) => [
      ["Totale interessi legali", formatEuro(r.totale_interessi_legali)],
      ["Totale maggior danno", formatEuro(r.totale_maggior_danno)],
      ["Totale", formatEuro(r.totale)],
    ],
  },
  "pignoramento-stipendio-pensione": {
    campi: [
      { tipo: "scelta", key: "tipo_importo", label: "Tipo di importo", default: "stipendio", opzioni: [
        { value: "stipendio", label: "Stipendio" }, { value: "pensione", label: "Pensione" },
      ] },
      { tipo: "numero", key: "importo", label: "Importo netto €", default: "" },
      { tipo: "scelta", key: "freq_importo", label: "Frequenza", default: "mensile", opzioni: [
        { value: "mensile", label: "Mensile" }, { value: "annuale", label: "Annuale" },
      ] },
      { tipo: "scelta", key: "mensilita", label: "Numero di mensilità annue", default: "13", mostraSe: (f) => f.freq_importo === "annuale", opzioni: [
        { value: "12", label: "12" }, { value: "13", label: "13" }, { value: "14", label: "14" },
      ] },
      { tipo: "bool", key: "accredito_conto", label: "Accreditato su conto corrente", default: false },
      { tipo: "numero", key: "giacenza_conto", label: "Giacenza media sul conto €", default: "", mostraSe: (f) => !!f.accredito_conto },
      { tipo: "bool", key: "credito_alimentare", label: "Credito di natura alimentare", default: false },
      { tipo: "numero", key: "fraz_pers_num", label: "Frazione personalizzata — numeratore (il giudice può fissarla liberamente)", default: "1", mostraSe: (f) => !!f.credito_alimentare },
      { tipo: "numero", key: "fraz_pers_den", label: "Frazione personalizzata — denominatore", default: "5", mostraSe: (f) => !!f.credito_alimentare },
      { tipo: "scelta", key: "tipo_creditore", label: "Tipo di creditore", default: "ordinario", opzioni: [
        { value: "ordinario", label: "Ordinario" }, { value: "agenzia_entrate", label: "Agenzia delle Entrate - Riscossione" },
      ] },
      { tipo: "numero", key: "totale_da_pignorare", label: "Debito totale da recuperare € (opzionale)", default: "" },
    ],
    endpoint: "/calc/pignoramento-stipendio-pensione",
    buildBody: (f) => ({
      tipo_importo: f.tipo_importo, importo: parseNumeroIt(f.importo), freq_importo: f.freq_importo,
      mensilita: parseNumeroIt(f.mensilita) || 13, accredito_conto: f.accredito_conto,
      giacenza_conto: f.accredito_conto && f.giacenza_conto ? parseNumeroIt(f.giacenza_conto) : null,
      credito_alimentare: f.credito_alimentare,
      fraz_pers_num: f.credito_alimentare ? (parseNumeroIt(f.fraz_pers_num) || 1) : 1,
      fraz_pers_den: f.credito_alimentare ? (parseNumeroIt(f.fraz_pers_den) || 5) : 5,
      tipo_creditore: f.tipo_creditore,
      totale_da_pignorare: f.totale_da_pignorare ? parseNumeroIt(f.totale_da_pignorare) : null,
    }),
    risultato: (r) => [
      ["Importo mensile", formatEuro(r.importo_mensile)],
      ...(r.minimo_vitale != null ? ([["Minimo vitale (non pignorabile)", formatEuro(r.minimo_vitale)]] as [string, string][]) : []),
      ["Frazione pignorabile", r.frazione_pignorabile],
      ["Pignorabile mensile", formatEuro(r.pignorabile_mensile)],
      ["Disponibile mensile", formatEuro(r.disponibile_mensile)],
      ...(r.massimo_pignorabile_dal_conto != null ? ([["Massimo pignorabile dal conto", formatEuro(r.massimo_pignorabile_dal_conto)]] as [string, string][]) : []),
      ...(r.mensilita_piene != null ? ([["Mensilità piene necessarie", String(r.mensilita_piene)]] as [string, string][]) : []),
      ...(r.ultima_mensilita_residua != null ? ([["Ultima mensilità residua", formatEuro(r.ultima_mensilita_residua)]] as [string, string][]) : []),
    ],
  },
  "equo-indennizzo": {
    campi: [
      { tipo: "numero", key: "stipendio_tabellare_annuo", label: "Stipendio tabellare annuo lordo €", default: "" },
      { tipo: "scelta", key: "categoria", label: "Categoria di menomazione", default: "5", opzioni: [
        { value: "1", label: "1ª categoria" }, { value: "2", label: "2ª categoria" }, { value: "3", label: "3ª categoria" },
        { value: "4", label: "4ª categoria" }, { value: "5", label: "5ª categoria" }, { value: "6", label: "6ª categoria" },
        { value: "7", label: "7ª categoria" }, { value: "8", label: "8ª categoria" }, { value: "9", label: "9ª categoria (indennità una tantum)" },
      ] },
      { tipo: "numero", key: "eta", label: "Età", default: "" },
    ],
    endpoint: "/calc/equo-indennizzo",
    buildBody: (f) => ({ stipendio_tabellare_annuo: parseNumeroIt(f.stipendio_tabellare_annuo), categoria: parseNumeroIt(f.categoria), eta: parseNumeroIt(f.eta) }),
    risultato: (r) => [
      ["Percentuale di categoria", `${r.percentuale_categoria}%`],
      ["Riduzione per età", `${r.riduzione_eta_pct}%`],
      ["Equo indennizzo", formatEuro(r.equo_indennizzo)],
    ],
  },
  "compenso-curatore-fallimentare": {
    campi: [
      { tipo: "numero", key: "attivo_realizzato", label: "Attivo realizzato €", default: "0" },
      { tipo: "numero", key: "passivo_accertato", label: "Passivo accertato €", default: "0" },
      { tipo: "numero", key: "utili_netti", label: "Utili netti €", default: "0" },
      { tipo: "numero", key: "ricavi_lordi", label: "Ricavi lordi €", default: "0" },
      { tipo: "numero", key: "spese_documentate", label: "Spese documentate €", default: "0" },
      { tipo: "numero", key: "indennita_missione", label: "Indennità di missione €", default: "0" },
    ],
    endpoint: "/calc/compenso-curatore-fallimentare",
    buildBody: (f) => ({
      attivo_realizzato: parseNumeroIt(f.attivo_realizzato), passivo_accertato: parseNumeroIt(f.passivo_accertato),
      esercizio_provvisorio: true, utili_netti: parseNumeroIt(f.utili_netti), ricavi_lordi: parseNumeroIt(f.ricavi_lordi),
      spese_documentate: parseNumeroIt(f.spese_documentate), indennita_missione: parseNumeroIt(f.indennita_missione),
    }),
    risultato: (r) => [
      ["Compenso sull'attivo (min-max)", `${formatEuro(r.compenso_attivo_minimo)} - ${formatEuro(r.compenso_attivo_massimo)}`],
      ["Compenso sul passivo (min-max)", `${formatEuro(r.compenso_passivo_minimo)} - ${formatEuro(r.compenso_passivo_massimo)}`],
      ...(r.esercizio_provvisorio ? ([["Compenso esercizio provvisorio", formatEuro(r.compenso_esercizio_provvisorio)]] as [string, string][]) : []),
      ["Compenso minimo", formatEuro(r.compenso_minimo)],
      ["Compenso massimo", formatEuro(r.compenso_massimo)],
      ["Spese forfettarie (min-max)", `${formatEuro(r.spese_forfettarie_minimo)} - ${formatEuro(r.spese_forfettarie_massimo)}`],
      ["Totale minimo", formatEuro(r.totale_minimo)],
      ["Totale massimo", formatEuro(r.totale_massimo)],
      ["Totale medio", formatEuro(r.totale_medio)],
    ],
  },
  "compenso-delegati-vendite": {
    campi: [
      { tipo: "scelta", key: "tipo_vendita", label: "Tipo di vendita", default: "immobili", opzioni: [
        { value: "immobili", label: "Immobili" }, { value: "mobili", label: "Mobili" },
      ] },
      { tipo: "numero", key: "valore", label: "Valore di aggiudicazione €", default: "0" },
      { tipo: "titolo", key: "fasi_titolo", label: "Fasi da compensare:" },
      { tipo: "bool", key: "fase_1", label: "Attività preliminari", default: true },
      { tipo: "bool", key: "fase_2", label: "Aggiudicazione/assegnazione", default: true },
      { tipo: "bool", key: "fase_3", label: "Trasferimento proprietà", default: true },
      { tipo: "bool", key: "fase_4", label: "Distribuzione", default: true },
      { tipo: "numero", key: "numero_debitori", label: "Numero debitori (fase distribuzione)", default: "1", mostraSe: (f) => !!f.fase_4 },
      { tipo: "scelta", key: "tipo_variazione", label: "Variazione discrezionale", default: "nessuna", opzioni: [
        { value: "nessuna", label: "Nessuna" }, { value: "aumento", label: "Aumento (fino al 60%)" }, { value: "diminuzione", label: "Diminuzione (fino al 25%)" },
      ] },
      { tipo: "numero", key: "pct_variazione", label: "Percentuale di variazione", default: "0", mostraSe: (f) => f.tipo_variazione !== "nessuna" },
      { tipo: "numero", key: "spese_registrazione", label: "Spese di registrazione €", default: "0" },
      { tipo: "numero", key: "altre_spese", label: "Altre spese €", default: "0" },
      { tipo: "numero", key: "carico_aggiudicatario_manuale", label: "Quota a carico dell'aggiudicatario € (opzionale, se non indicata si applica il calcolo di legge)", default: "" },
      { tipo: "bool", key: "applica_iva", label: "Applica IVA", default: true },
      { tipo: "numero", key: "pct_iva", label: "Percentuale IVA %", default: "22", mostraSe: (f) => !!f.applica_iva },
      { tipo: "bool", key: "applica_contributo_cassa", label: "Applica contributo previdenziale", default: true },
      { tipo: "numero", key: "pct_contributo_cassa", label: "Percentuale di contribuzione %", default: "4", mostraSe: (f) => !!f.applica_contributo_cassa },
    ],
    endpoint: "/calc/compenso-delegati-vendite",
    validate: (f) => ([1, 2, 3, 4].some((n) => !!f[`fase_${n}`]) ? null : "Seleziona almeno una fase da compensare."),
    buildBody: (f) => ({
      tipo_vendita: f.tipo_vendita, valore: parseNumeroIt(f.valore),
      fasi_selezionate: [1, 2, 3, 4].filter((n) => !!f[`fase_${n}`]),
      numero_debitori: parseNumeroIt(f.numero_debitori) || 1,
      tipo_variazione: f.tipo_variazione !== "nessuna" ? f.tipo_variazione : null,
      pct_variazione: f.tipo_variazione !== "nessuna" ? parseNumeroIt(f.pct_variazione) : 0,
      spese_registrazione: parseNumeroIt(f.spese_registrazione),
      altre_spese: parseNumeroIt(f.altre_spese),
      carico_aggiudicatario_manuale: f.carico_aggiudicatario_manuale ? parseNumeroIt(f.carico_aggiudicatario_manuale) : null,
      applica_iva: f.applica_iva, pct_iva: parseNumeroIt(f.pct_iva),
      applica_contributo_cassa: f.applica_contributo_cassa, pct_contributo_cassa: parseNumeroIt(f.pct_contributo_cassa),
    }),
    risultato: (r) => [
      ["Compenso tabellare", formatEuro(r.compenso_tabellare)],
      ["Totale imponibile", formatEuro(r.totale_imponibile)],
      ["IVA", formatEuro(r.iva)],
      ["Quota a carico dell'aggiudicatario", formatEuro(r.carico_aggiudicatario)],
      ["Ritenuta d'acconto", formatEuro(r.ritenuta_acconto)],
      ["Netto a pagare", formatEuro(r.netto_a_pagare)],
    ],
  },
  "compenso-mediatore-familiare": {
    campi: [
      { tipo: "scelta", key: "complessita", label: "Complessità", default: "media", opzioni: [
        { value: "bassa", label: "Bassa" }, { value: "media", label: "Media" }, { value: "alta", label: "Alta" },
      ] },
      { tipo: "numero", key: "numero_incontri", label: "Numero di incontri", default: "1" },
      { tipo: "numero", key: "spese_esenti", label: "Spese esenti €", default: "0" },
      { tipo: "numero", key: "spese_imponibili", label: "Spese imponibili €", default: "0" },
      { tipo: "scelta", key: "cassa", label: "Cassa previdenziale", default: "", opzioni: [
        { value: "", label: "Nessuna" }, { value: "enpap", label: "ENPAP" }, { value: "enpam", label: "ENPAM" }, { value: "inps_gestione_separata", label: "INPS gestione separata" },
      ] },
      { tipo: "bool", key: "regime_semplificato", label: "Regime fiscale semplificato (no IVA)", default: false },
    ],
    endpoint: "/calc/compenso-mediatore-familiare",
    buildBody: (f) => ({
      complessita: f.complessita, numero_incontri: parseNumeroIt(f.numero_incontri) || 1,
      spese_esenti: parseNumeroIt(f.spese_esenti), spese_imponibili: parseNumeroIt(f.spese_imponibili),
      cassa: f.cassa || null, regime_semplificato: f.regime_semplificato,
    }),
    risultato: (r) => [
      ["Compenso", formatEuro(r.compenso)],
      ["Totale imponibile", formatEuro(r.totale_imponibile)],
      ["Totale", formatEuro(r.totale)],
    ],
  },
  "parametri-stragiudiziali": {
    campi: [
      { tipo: "scelta", key: "competenza", label: "Tipo di attività", default: "assistenza", opzioni: [
        { value: "assistenza", label: "Assistenza stragiudiziale" }, { value: "mediazione", label: "Mediazione e negoziazione assistita" },
      ] },
      { tipo: "bool", key: "valore_indeterminabile", label: "Valore indeterminabile", default: false },
      { tipo: "numero", key: "valore_causa", label: "Valore della pratica €", default: "", mostraSe: (f) => !f.valore_indeterminabile },
      { tipo: "scelta", key: "complessita_indeterminabile", label: "Complessità", default: "media", mostraSe: (f) => !!f.valore_indeterminabile, opzioni: [
        { value: "bassa", label: "Bassa" }, { value: "media", label: "Media" }, { value: "alta", label: "Alta" }, { value: "particolare_importanza", label: "Particolare importanza" },
      ] },
    ],
    endpoint: "/calc/parametri-stragiudiziali",
    buildBody: (f) => ({
      competenza: f.competenza, valore_causa: f.valore_indeterminabile ? 0 : parseNumeroIt(f.valore_causa),
      valore_indeterminabile: f.valore_indeterminabile, complessita_indeterminabile: f.complessita_indeterminabile,
    }),
    risultato: (r) => [
      ["Totale (valore medio)", formatEuro(r.totale_medio)],
      ["Totale minimo (-50%)", formatEuro(r.totale_minimo_discrezionale)],
      ["Totale massimo (+50%)", formatEuro(r.totale_massimo_discrezionale)],
    ],
  },
  "parametri-penali-2014": {
    campi: [
      { tipo: "scelta", key: "anno", label: "Tabelle", default: "2022", opzioni: [
        { value: "2022", label: "2022 (vigenti)" }, { value: "2014", label: "2014-2018 (precedenti)" },
      ] },
      { tipo: "scelta", key: "competenza", label: "Competenza", default: "570", opzioni: (f) => COMPETENZE_PENALI_2014.filter((c) => !!TABELLE_PENALI_2014[f.anno]?.[c.value]) },
      { tipo: "scelta", key: "valore", label: "Compenso di tutte le fasi", default: "med", opzioni: [
        { value: "min", label: "Minimo" }, { value: "med", label: "Medio" }, { value: "max", label: "Massimo" },
      ] },
      { tipo: "titolo", key: "tit_f10", label: "Fase: Studio", mostraSe: (f) => !!fasePenale2014(f, "10") },
      { tipo: "bool", key: "f10_on", label: "Includi la fase", default: true, mostraSe: (f) => !!fasePenale2014(f, "10"),
        nota: (f) => { const t = fasePenale2014(f, "10"); return t ? `Min ${formatEuro(t[0])} · Med ${formatEuro(t[1])} · Max ${formatEuro(t[2])}` : null; } },
      { tipo: "scelta", key: "f10_val", label: "Valore", default: "", mostraSe: (f) => !!fasePenale2014(f, "10") && !!f.f10_on, opzioni: [
        { value: "", label: "Come la scelta generale" }, { value: "min", label: "Minimo" }, { value: "med", label: "Medio" }, { value: "max", label: "Massimo" },
      ] },
      { tipo: "numero", key: "f10_imp", label: "Compenso personalizzato € (facoltativo)", default: "", mostraSe: (f) => !!fasePenale2014(f, "10") && !!f.f10_on },
      { tipo: "titolo", key: "tit_f20", label: "Fase: Introduttiva", mostraSe: (f) => !!fasePenale2014(f, "20") },
      { tipo: "bool", key: "f20_on", label: "Includi la fase", default: true, mostraSe: (f) => !!fasePenale2014(f, "20"),
        nota: (f) => { const t = fasePenale2014(f, "20"); return t ? `Min ${formatEuro(t[0])} · Med ${formatEuro(t[1])} · Max ${formatEuro(t[2])}` : null; } },
      { tipo: "scelta", key: "f20_val", label: "Valore", default: "", mostraSe: (f) => !!fasePenale2014(f, "20") && !!f.f20_on, opzioni: [
        { value: "", label: "Come la scelta generale" }, { value: "min", label: "Minimo" }, { value: "med", label: "Medio" }, { value: "max", label: "Massimo" },
      ] },
      { tipo: "numero", key: "f20_imp", label: "Compenso personalizzato € (facoltativo)", default: "", mostraSe: (f) => !!fasePenale2014(f, "20") && !!f.f20_on },
      { tipo: "titolo", key: "tit_f60", label: "Fase: Istruttoria / dibattimentale", mostraSe: (f) => !!fasePenale2014(f, "60") },
      { tipo: "bool", key: "f60_on", label: "Includi la fase", default: true, mostraSe: (f) => !!fasePenale2014(f, "60"),
        nota: (f) => { const t = fasePenale2014(f, "60"); return t ? `Min ${formatEuro(t[0])} · Med ${formatEuro(t[1])} · Max ${formatEuro(t[2])}` : null; } },
      { tipo: "scelta", key: "f60_val", label: "Valore", default: "", mostraSe: (f) => !!fasePenale2014(f, "60") && !!f.f60_on, opzioni: [
        { value: "", label: "Come la scelta generale" }, { value: "min", label: "Minimo" }, { value: "med", label: "Medio" }, { value: "max", label: "Massimo" },
      ] },
      { tipo: "numero", key: "f60_imp", label: "Compenso personalizzato € (facoltativo)", default: "", mostraSe: (f) => !!fasePenale2014(f, "60") && !!f.f60_on },
      { tipo: "titolo", key: "tit_f90", label: "Fase: Decisionale", mostraSe: (f) => !!fasePenale2014(f, "90") },
      { tipo: "bool", key: "f90_on", label: "Includi la fase", default: true, mostraSe: (f) => !!fasePenale2014(f, "90"),
        nota: (f) => { const t = fasePenale2014(f, "90"); return t ? `Min ${formatEuro(t[0])} · Med ${formatEuro(t[1])} · Max ${formatEuro(t[2])}` : null; } },
      { tipo: "scelta", key: "f90_val", label: "Valore", default: "", mostraSe: (f) => !!fasePenale2014(f, "90") && !!f.f90_on, opzioni: [
        { value: "", label: "Come la scelta generale" }, { value: "min", label: "Minimo" }, { value: "med", label: "Medio" }, { value: "max", label: "Massimo" },
      ] },
      { tipo: "numero", key: "f90_imp", label: "Compenso personalizzato € (facoltativo)", default: "", mostraSe: (f) => !!fasePenale2014(f, "90") && !!f.f90_on },
      { tipo: "titolo", key: "tit_aum", label: "Aumenti" },
      { tipo: "numero", key: "num_parti", label: "Numero parti (stessa posizione processuale)", default: "1", nota: () => "Aumento per più parti, art. 12 comma 2" },
      { tipo: "scelta", key: "pct_parti", label: "Aumento per più parti", default: "", mostraSe: (f) => (parseNumeroIt(f.num_parti) || 1) > 1, opzioni: opzioniPctPartiPenale2014 },
      { tipo: "bool", key: "importanza", label: "Ulteriore valutazione (art. 12, comma 1)", default: false },
      { tipo: "numero", key: "pct_importanza", label: "Aumento %", default: "", mostraSe: (f) => !!f.importanza },
      { tipo: "titolo", key: "tit_rid", label: "Riduzioni" },
      { tipo: "bool", key: "assenza", label: "Assenza di questioni di fatto e diritto (art. 12, comma 2)", default: false },
      { tipo: "scelta", key: "pct_assenza", label: "Riduzione %", default: "30", mostraSe: (f) => !!f.assenza, opzioni: Array.from({ length: 30 }, (_, i) => ({ value: String(30 - i), label: `${30 - i}%` })) },
      { tipo: "bool", key: "gratuito_patrocinio", label: "Gratuito patrocinio (riduzione di 1/3, art. 106 bis DPR 115/02)", default: false },
      { tipo: "bool", key: "praticante", label: "Compenso liquidato al praticante abilitato (art. 17)", default: false },
      { tipo: "scelta", key: "pct_praticante", label: "Riduzione %", default: "50", mostraSe: (f) => !!f.praticante, opzioni: Array.from({ length: 50 }, (_, i) => ({ value: String(50 - i), label: `${50 - i}%` })) },
      { tipo: "titolo", key: "tit_spese", label: "Spese" },
      { tipo: "numero", key: "spese_esenti", label: "Spese esenti € (art. 15 DPR 633/72)", default: "" },
      { tipo: "numero", key: "spese_trasferta", label: "Spese di trasferta €", default: "" },
      { tipo: "numero", key: "spese_imponibili", label: "Altre spese imponibili € (non relative a trasferte)", default: "" },
      { tipo: "bool", key: "spese_generali", label: "Spese generali", default: true },
      { tipo: "numero", key: "pct_spese_generali", label: "Percentuale spese generali", default: "15", mostraSe: (f) => !!f.spese_generali },
      { tipo: "titolo", key: "tit_acc", label: "Accessori" },
      { tipo: "bool", key: "cassa", label: "CPA (Cassa Avvocati 4%)", default: false },
      { tipo: "bool", key: "iva", label: "IVA 22%", default: false },
      { tipo: "bool", key: "ritenuta", label: "Ritenuta d'acconto 20%", default: false },
    ],
    endpoint: "/calc/parametri-penali-2014",
    validate: (f) => {
      if (!TABELLE_PENALI_2014[f.anno]?.[f.competenza]) return "Competenza non prevista per le tabelle selezionate.";
      if (!FASI_PENALI_2014.some((x) => fasePenale2014(f, x.cod) && f[`f${x.cod}_on`])) return "Selezionare almeno una fase.";
      if (f.importanza && !(parseNumeroIt(f.pct_importanza) > 0)) return "Indicare la percentuale di aumento per ulteriore valutazione.";
      const n = parseNumeroIt(f.num_parti) || 1;
      if (n < 1 || n > 30) return "Il numero di parti deve essere compreso tra 1 e 30.";
      return null;
    },
    buildBody: (f) => {
      const n = Math.round(parseNumeroIt(f.num_parti) || 1);
      return {
        anno: f.anno, competenza: f.competenza, valore: f.valore,
        fasi: FASI_PENALI_2014.filter((x) => fasePenale2014(f, x.cod)).map((x) => ({
          cod: parseInt(x.cod, 10), attiva: !!f[`f${x.cod}_on`],
          valore: f[`f${x.cod}_val`] || null,
          importo: String(f[`f${x.cod}_imp`] ?? "").trim() !== "" ? parseNumeroIt(f[`f${x.cod}_imp`]) : null,
        })),
        num_parti: n, pct_parti: n > 1 && f.pct_parti !== "" ? parseNumeroIt(f.pct_parti) : null,
        importanza: !!f.importanza, pct_importanza: f.importanza ? parseNumeroIt(f.pct_importanza) : null,
        assenza_questioni: !!f.assenza, pct_assenza_questioni: parseNumeroIt(f.pct_assenza) || 30,
        gratuito_patrocinio: !!f.gratuito_patrocinio,
        praticante: !!f.praticante, pct_praticante: parseNumeroIt(f.pct_praticante) || 50,
        spese_esenti: parseNumeroIt(f.spese_esenti), spese_trasferta: parseNumeroIt(f.spese_trasferta), spese_imponibili: parseNumeroIt(f.spese_imponibili),
        spese_generali: !!f.spese_generali, pct_spese_generali: parseNumeroIt(f.pct_spese_generali),
        cassa: !!f.cassa, iva: !!f.iva, ritenuta: !!f.ritenuta,
      };
    },
    risultato: (r) => {
      const tipoLbl: Record<string, string> = { min: "valore minimo", med: "valore medio", max: "valore massimo", pers: "valore personalizzato" };
      const out: [string, string][] = [["Competenza", r.competenza_nome]];
      for (const x of r.fasi) out.push([`${x.nome} (${tipoLbl[x.tipo]})`, formatEuro(x.importo)]);
      out.push([r.etichetta_tabellare ? `Compenso tabellare (${r.etichetta_tabellare})` : "Compenso tabellare", formatEuro(r.compenso_tabellare_fasi)]);
      for (const a of r.aumenti) out.push([`${a.descrizione} — ${a.pct}%`, formatEuro(a.importo)]);
      if (r.aumenti.length) out.push(["Compenso maggiorato comprensivo degli aumenti", formatEuro(r.compenso_maggiorato)]);
      for (const x of r.riduzioni) out.push([`${x.descrizione}${x.pct != null ? ` — ${x.pct}%` : ""} su ${formatEuro(x.base)}`, formatEuro(x.importo)]);
      if (r.riduzioni.length) out.push(["Compenso al netto delle riduzioni", formatEuro(r.compenso_totale)]);
      out.push(["Compenso totale", formatEuro(r.compenso_totale)]);
      if (r.spese_generali) out.push(["Spese generali", formatEuro(r.spese_generali)]);
      if (r.spese_trasferta) out.push(["Spese di trasferta", formatEuro(r.spese_trasferta)]);
      if (r.spese_imponibili) out.push(["Altre spese imponibili non relative a trasferte", formatEuro(r.spese_imponibili)]);
      if (r.cassa) out.push(["Cassa Avvocati (4%)", formatEuro(r.cassa)]);
      if (r.cassa || r.iva) out.push(["Totale imponibile", formatEuro(r.totale_imponibile)]);
      if (r.iva) out.push(["IVA 22% su imponibile", formatEuro(r.iva)]);
      if (r.spese_esenti) out.push(["Spese esenti ex art. 15 DPR 633/72", formatEuro(r.spese_esenti)]);
      out.push(["Ipotesi di compenso liquidabile", formatEuro(r.totale)]);
      if (r.ritenuta) {
        out.push(["A dedurre ritenuta d'acconto 20% (su compenso e spese imponibili)", formatEuro(r.ritenuta)]);
        out.push(["Totale documento", formatEuro(r.totale_documento)]);
      }
      return out;
    },
  },
  "parametri-penali-2012": {
    campi: [
      { tipo: "scelta", key: "competenza", label: "Competenza", default: "210", opzioni: COMPETENZE_PENALI_2012 },
      { tipo: "scelta", key: "valore", label: "Compenso di tutte le fasi", default: "med", opzioni: [
        { value: "min", label: "Minimo" }, { value: "med", label: "Medio" }, { value: "max", label: "Massimo" },
      ] },
      { tipo: "titolo", key: "tit_f10", label: "Fase: Studio" },
      { tipo: "bool", key: "f10_on", label: "Includi la fase", default: true,
        nota: (f) => { const t = TABELLE_PENALI_2012[f.competenza]?.["10"]; return t ? `Min ${formatEuro(t[0])} · Med ${formatEuro(t[1])} · Max ${formatEuro(t[2])}` : null; } },
      { tipo: "scelta", key: "f10_val", label: "Valore", default: "", mostraSe: (f) => !!f.f10_on, opzioni: [
        { value: "", label: "Come la scelta generale" }, { value: "min", label: "Minimo" }, { value: "med", label: "Medio" }, { value: "max", label: "Massimo" },
      ] },
      { tipo: "numero", key: "f10_imp", label: "Compenso personalizzato € (facoltativo)", default: "", mostraSe: (f) => !!f.f10_on },
      { tipo: "titolo", key: "tit_f20", label: "Fase: Introduttiva" },
      { tipo: "bool", key: "f20_on", label: "Includi la fase", default: true,
        nota: (f) => { const t = TABELLE_PENALI_2012[f.competenza]?.["20"]; return t ? `Min ${formatEuro(t[0])} · Med ${formatEuro(t[1])} · Max ${formatEuro(t[2])}` : null; } },
      { tipo: "scelta", key: "f20_val", label: "Valore", default: "", mostraSe: (f) => !!f.f20_on, opzioni: [
        { value: "", label: "Come la scelta generale" }, { value: "min", label: "Minimo" }, { value: "med", label: "Medio" }, { value: "max", label: "Massimo" },
      ] },
      { tipo: "numero", key: "f20_imp", label: "Compenso personalizzato € (facoltativo)", default: "", mostraSe: (f) => !!f.f20_on },
      { tipo: "titolo", key: "tit_f30", label: "Fase: Istruttoria" },
      { tipo: "bool", key: "f30_on", label: "Includi la fase", default: true,
        nota: (f) => { const t = TABELLE_PENALI_2012[f.competenza]?.["30"]; return t ? `Min ${formatEuro(t[0])} · Med ${formatEuro(t[1])} · Max ${formatEuro(t[2])}` : null; } },
      { tipo: "scelta", key: "f30_val", label: "Valore", default: "", mostraSe: (f) => !!f.f30_on, opzioni: [
        { value: "", label: "Come la scelta generale" }, { value: "min", label: "Minimo" }, { value: "med", label: "Medio" }, { value: "max", label: "Massimo" },
      ] },
      { tipo: "numero", key: "f30_imp", label: "Compenso personalizzato € (facoltativo)", default: "", mostraSe: (f) => !!f.f30_on },
      { tipo: "titolo", key: "tit_f40", label: "Fase: Decisoria" },
      { tipo: "bool", key: "f40_on", label: "Includi la fase", default: true,
        nota: (f) => { const t = TABELLE_PENALI_2012[f.competenza]?.["40"]; return t ? `Min ${formatEuro(t[0])} · Med ${formatEuro(t[1])} · Max ${formatEuro(t[2])}` : null; } },
      { tipo: "scelta", key: "f40_val", label: "Valore", default: "", mostraSe: (f) => !!f.f40_on, opzioni: [
        { value: "", label: "Come la scelta generale" }, { value: "min", label: "Minimo" }, { value: "med", label: "Medio" }, { value: "max", label: "Massimo" },
      ] },
      { tipo: "numero", key: "f40_imp", label: "Compenso personalizzato € (facoltativo)", default: "", mostraSe: (f) => !!f.f40_on },
      { tipo: "titolo", key: "tit_f50", label: "Fase: Esecutiva (tariffa oraria)" },
      { tipo: "bool", key: "f50_on", label: "Includi la fase", default: true,
        nota: (f) => { const t = TABELLE_PENALI_2012[f.competenza]?.["50"]; return t ? `Min ${formatEuro(t[0])} / ora · Med ${formatEuro(t[1])} / ora · Max ${formatEuro(t[2])} / ora` : null; } },
      { tipo: "scelta", key: "f50_val", label: "Valore", default: "", mostraSe: (f) => !!f.f50_on, opzioni: [
        { value: "", label: "Come la scelta generale" }, { value: "min", label: "Minimo" }, { value: "med", label: "Medio" }, { value: "max", label: "Massimo" },
      ] },
      { tipo: "numero", key: "f50_imp", label: "Tariffa oraria personalizzata €/ora (facoltativo)", default: "", mostraSe: (f) => !!f.f50_on },
      { tipo: "numero", key: "f50_ore", label: "Ore (numero intero)", default: "", mostraSe: (f) => !!f.f50_on },
      { tipo: "titolo", key: "tit_aum", label: "Aumenti (tutti calcolati sul compenso tabellare)" },
      { tipo: "bool", key: "collegiale", label: "Incarico collegiale (art. 1, comma 4)", default: false },
      { tipo: "scelta", key: "pct_collegiale", label: "Aumento %", default: "100", mostraSe: (f) => !!f.collegiale, opzioni: OPZIONI_PCT_5_100 },
      { tipo: "bool", key: "piu_parti", label: "Più parti (art. 12, comma 4)", default: false },
      { tipo: "scelta", key: "pct_piu_parti", label: "Aumento %", default: "100", mostraSe: (f) => !!f.piu_parti, opzioni: OPZIONI_PCT_5_100 },
      { tipo: "bool", key: "importanza", label: "Ulteriore valutazione (art. 12, commi 2 e 3)", default: false },
      { tipo: "numero", key: "pct_importanza", label: "Aumento %", default: "", mostraSe: (f) => !!f.importanza },
      { tipo: "titolo", key: "tit_rid", label: "Riduzioni" },
      { tipo: "bool", key: "minori", label: "Assistenza d'ufficio a minori (art. 12, comma 5)", default: false },
      { tipo: "scelta", key: "pct_minori", label: "Riduzione %", default: "50", mostraSe: (f) => !!f.minori, opzioni: Array.from({ length: 50 }, (_, i) => ({ value: String(50 - i), label: `${50 - i}%` })) },
      { tipo: "bool", key: "gratuito_patrocinio", label: "Gratuito patrocinio (riduzione del 50%, art. 12, comma 7)", default: false },
      { tipo: "titolo", key: "tit_spese", label: "Spese" },
      { tipo: "numero", key: "spese_esenti", label: "Spese esenti € (art. 15 DPR 633/72)", default: "" },
      { tipo: "numero", key: "spese_imponibili", label: "Spese imponibili €", default: "" },
      { tipo: "bool", key: "spese_generali", label: "Spese generali", default: true },
      { tipo: "numero", key: "pct_spese_generali", label: "Percentuale spese generali", default: "15", mostraSe: (f) => !!f.spese_generali },
      { tipo: "titolo", key: "tit_acc", label: "Accessori" },
      { tipo: "bool", key: "cassa", label: "CPA (Cassa Avvocati 4%)", default: false },
      { tipo: "bool", key: "iva", label: "IVA 22%", default: false },
      { tipo: "bool", key: "ritenuta", label: "Ritenuta d'acconto 20%", default: false },
    ],
    endpoint: "/calc/parametri-penali-2012",
    validate: (f) => {
      if (!FASI_PENALI_2012.some((x) => f[`f${x.cod}_on`])) return "Non hai selezionato alcuna fase.";
      if (f.f50_on && !(parseNumeroIt(f.f50_ore) > 0)) return "Specifica un valore (ore) per la fase esecutiva.";
      if (f.importanza && !(parseNumeroIt(f.pct_importanza) > 0)) return "Specifica un valore per la percentuale di ulteriore valutazione.";
      return null;
    },
    buildBody: (f) => ({
      competenza: f.competenza, valore: f.valore,
      fasi: FASI_PENALI_2012.map((x) => ({
        cod: parseInt(x.cod, 10), attiva: !!f[`f${x.cod}_on`],
        valore: f[`f${x.cod}_val`] || null,
        importo: String(f[`f${x.cod}_imp`] ?? "").trim() !== "" ? parseNumeroIt(f[`f${x.cod}_imp`]) : null,
        ...(x.orario ? { ore: parseNumeroIt(f.f50_ore) } : {}),
      })),
      collegiale: !!f.collegiale, pct_collegiale: parseNumeroIt(f.pct_collegiale) || 100,
      piu_parti: !!f.piu_parti, pct_piu_parti: parseNumeroIt(f.pct_piu_parti) || 100,
      importanza: !!f.importanza, pct_importanza: f.importanza ? parseNumeroIt(f.pct_importanza) : null,
      minori: !!f.minori, pct_minori: parseNumeroIt(f.pct_minori) || 50,
      gratuito_patrocinio: !!f.gratuito_patrocinio,
      spese_esenti: parseNumeroIt(f.spese_esenti), spese_imponibili: parseNumeroIt(f.spese_imponibili),
      spese_generali: !!f.spese_generali, pct_spese_generali: parseNumeroIt(f.pct_spese_generali),
      cassa: !!f.cassa, iva: !!f.iva, ritenuta: !!f.ritenuta,
    }),
    risultato: (r) => {
      const out: [string, string][] = [["Competenza", r.competenza_nome]];
      for (const x of r.fasi) {
        out.push([x.ore != null ? `${x.nome} (${formatEuro(x.tariffa_oraria)} x ${x.ore} ${x.ore === 1 ? "ora" : "ore"})` : x.nome, formatEuro(x.importo)]);
      }
      out.push(["Compenso tabellare ex art. 14", formatEuro(r.compenso_tabellare)]);
      for (const a of r.aumenti) out.push([`${a.descrizione} — ${a.pct}%`, formatEuro(a.importo)]);
      if (r.aumenti.length) out.push(["Compenso maggiorato (comprensivo degli aumenti)", formatEuro(r.compenso_maggiorato)]);
      for (const x of r.riduzioni) out.push([`${x.descrizione} — ${x.pct}% su ${formatEuro(x.base)}`, formatEuro(x.importo)]);
      if (r.riduzioni.length) out.push(["Compenso al netto delle riduzioni", formatEuro(r.compenso_totale)]);
      out.push(["Compenso totale", formatEuro(r.compenso_totale)]);
      if (r.spese_generali) out.push(["Spese generali", formatEuro(r.spese_generali)]);
      if (r.spese_imponibili) out.push(["Spese imponibili", formatEuro(r.spese_imponibili)]);
      if (r.cassa) out.push(["Cassa Avvocati (4%)", formatEuro(r.cassa)]);
      if (r.cassa || r.iva) out.push(["Totale imponibile", formatEuro(r.totale_imponibile)]);
      if (r.iva) out.push(["IVA 22% su imponibile", formatEuro(r.iva)]);
      if (r.spese_esenti) out.push(["Spese esenti ex art. 15 DPR 633/72", formatEuro(r.spese_esenti)]);
      out.push(["Ipotesi di compenso liquidabile", formatEuro(r.totale)]);
      if (r.ritenuta) {
        out.push(["A dedurre ritenuta d'acconto 20% (su compenso e spese)", formatEuro(r.ritenuta)]);
        out.push(["Totale documento", formatEuro(r.totale_documento)]);
      }
      return out;
    },
  },
  "parametri-civili-2012": {
    campi: [
      { tipo: "scelta", key: "competenza", label: "Competenza", default: "20", opzioni: COMPETENZE_CIVILI_2012 },
      { tipo: "scelta", key: "scaglione", label: "Valore della causa", default: "20", opzioni: (f) => SCAGLIONI_CIVILI_2012[f.competenza] ?? [],
        nota: (f) => (SCAGLIONI_CIVILI_2012[f.competenza]?.some((s) => s.value === f.scaglione) ? null : "Seleziona lo scaglione di valore.") },
      { tipo: "scelta", key: "valore", label: "Compenso di tutte le fasi", default: "med", opzioni: [
        { value: "min", label: "Minimo" }, { value: "med", label: "Medio" }, { value: "max", label: "Massimo" },
      ] },
      { tipo: "titolo", key: "tit_f0", label: "Fase: Fase unica", mostraSe: (f) => !!faseCivile2012(f, "0") },
      { tipo: "bool", key: "f0_on", label: "Includi la fase", default: true, mostraSe: (f) => !!faseCivile2012(f, "0"),
        nota: (f) => { const t = faseCivile2012(f, "0"); return t ? `Min ${formatEuro(t[0])} · Med ${formatEuro(t[1])} · Max ${formatEuro(t[2])}` : null; } },
      { tipo: "scelta", key: "f0_val", label: "Valore", default: "", mostraSe: (f) => !!faseCivile2012(f, "0") && !!f.f0_on, opzioni: [
        { value: "", label: "Come la scelta generale" }, { value: "min", label: "Minimo" }, { value: "med", label: "Medio" }, { value: "max", label: "Massimo" },
      ] },
      { tipo: "numero", key: "f0_imp", label: "Compenso personalizzato € (facoltativo)", default: "", mostraSe: (f) => !!faseCivile2012(f, "0") && !!f.f0_on },
      { tipo: "titolo", key: "tit_f10", label: "Fase: Studio", mostraSe: (f) => !!faseCivile2012(f, "10") },
      { tipo: "bool", key: "f10_on", label: "Includi la fase", default: true, mostraSe: (f) => !!faseCivile2012(f, "10"),
        nota: (f) => { const t = faseCivile2012(f, "10"); return t ? `Min ${formatEuro(t[0])} · Med ${formatEuro(t[1])} · Max ${formatEuro(t[2])}` : null; } },
      { tipo: "scelta", key: "f10_val", label: "Valore", default: "", mostraSe: (f) => !!faseCivile2012(f, "10") && !!f.f10_on, opzioni: [
        { value: "", label: "Come la scelta generale" }, { value: "min", label: "Minimo" }, { value: "med", label: "Medio" }, { value: "max", label: "Massimo" },
      ] },
      { tipo: "numero", key: "f10_imp", label: "Compenso personalizzato € (facoltativo)", default: "", mostraSe: (f) => !!faseCivile2012(f, "10") && !!f.f10_on },
      { tipo: "titolo", key: "tit_f20", label: "Fase: Introduttiva", mostraSe: (f) => !!faseCivile2012(f, "20") },
      { tipo: "bool", key: "f20_on", label: "Includi la fase", default: true, mostraSe: (f) => !!faseCivile2012(f, "20"),
        nota: (f) => { const t = faseCivile2012(f, "20"); return t ? `Min ${formatEuro(t[0])} · Med ${formatEuro(t[1])} · Max ${formatEuro(t[2])}` : null; } },
      { tipo: "scelta", key: "f20_val", label: "Valore", default: "", mostraSe: (f) => !!faseCivile2012(f, "20") && !!f.f20_on, opzioni: [
        { value: "", label: "Come la scelta generale" }, { value: "min", label: "Minimo" }, { value: "med", label: "Medio" }, { value: "max", label: "Massimo" },
      ] },
      { tipo: "numero", key: "f20_imp", label: "Compenso personalizzato € (facoltativo)", default: "", mostraSe: (f) => !!faseCivile2012(f, "20") && !!f.f20_on },
      { tipo: "titolo", key: "tit_f30", label: "Fase: Istruttoria", mostraSe: (f) => !!faseCivile2012(f, "30") },
      { tipo: "bool", key: "f30_on", label: "Includi la fase", default: true, mostraSe: (f) => !!faseCivile2012(f, "30"),
        nota: (f) => { const t = faseCivile2012(f, "30"); return t ? `Min ${formatEuro(t[0])} · Med ${formatEuro(t[1])} · Max ${formatEuro(t[2])}` : null; } },
      { tipo: "scelta", key: "f30_val", label: "Valore", default: "", mostraSe: (f) => !!faseCivile2012(f, "30") && !!f.f30_on, opzioni: [
        { value: "", label: "Come la scelta generale" }, { value: "min", label: "Minimo" }, { value: "med", label: "Medio" }, { value: "max", label: "Massimo" },
      ] },
      { tipo: "numero", key: "f30_imp", label: "Compenso personalizzato € (facoltativo)", default: "", mostraSe: (f) => !!faseCivile2012(f, "30") && !!f.f30_on },
      { tipo: "titolo", key: "tit_f40", label: "Fase: Decisoria", mostraSe: (f) => !!faseCivile2012(f, "40") },
      { tipo: "bool", key: "f40_on", label: "Includi la fase", default: true, mostraSe: (f) => !!faseCivile2012(f, "40"),
        nota: (f) => { const t = faseCivile2012(f, "40"); return t ? `Min ${formatEuro(t[0])} · Med ${formatEuro(t[1])} · Max ${formatEuro(t[2])}` : null; } },
      { tipo: "scelta", key: "f40_val", label: "Valore", default: "", mostraSe: (f) => !!faseCivile2012(f, "40") && !!f.f40_on, opzioni: [
        { value: "", label: "Come la scelta generale" }, { value: "min", label: "Minimo" }, { value: "med", label: "Medio" }, { value: "max", label: "Massimo" },
      ] },
      { tipo: "numero", key: "f40_imp", label: "Compenso personalizzato € (facoltativo)", default: "", mostraSe: (f) => !!faseCivile2012(f, "40") && !!f.f40_on },
      { tipo: "titolo", key: "tit_f60", label: "Fase: Esecutiva mobiliare", mostraSe: (f) => !!faseCivile2012(f, "60") },
      { tipo: "bool", key: "f60_on", label: "Includi la fase", default: true, mostraSe: (f) => !!faseCivile2012(f, "60"),
        nota: (f) => { const t = faseCivile2012(f, "60"); return t ? `Min ${formatEuro(t[0])} · Med ${formatEuro(t[1])} · Max ${formatEuro(t[2])}` : null; } },
      { tipo: "scelta", key: "f60_val", label: "Valore", default: "", mostraSe: (f) => !!faseCivile2012(f, "60") && !!f.f60_on, opzioni: [
        { value: "", label: "Come la scelta generale" }, { value: "min", label: "Minimo" }, { value: "med", label: "Medio" }, { value: "max", label: "Massimo" },
      ] },
      { tipo: "numero", key: "f60_imp", label: "Compenso personalizzato € (facoltativo)", default: "", mostraSe: (f) => !!faseCivile2012(f, "60") && !!f.f60_on },
      { tipo: "titolo", key: "tit_f70", label: "Fase: Esecutiva immobiliare", mostraSe: (f) => !!faseCivile2012(f, "70") },
      { tipo: "bool", key: "f70_on", label: "Includi la fase", default: true, mostraSe: (f) => !!faseCivile2012(f, "70"),
        nota: (f) => { const t = faseCivile2012(f, "70"); return t ? `Min ${formatEuro(t[0])} · Med ${formatEuro(t[1])} · Max ${formatEuro(t[2])}` : null; } },
      { tipo: "scelta", key: "f70_val", label: "Valore", default: "", mostraSe: (f) => !!faseCivile2012(f, "70") && !!f.f70_on, opzioni: [
        { value: "", label: "Come la scelta generale" }, { value: "min", label: "Minimo" }, { value: "med", label: "Medio" }, { value: "max", label: "Massimo" },
      ] },
      { tipo: "numero", key: "f70_imp", label: "Compenso personalizzato € (facoltativo)", default: "", mostraSe: (f) => !!faseCivile2012(f, "70") && !!f.f70_on },
      { tipo: "titolo", key: "tit_f80", label: "Fase: Espropriazione presso terzi, consegna o rilascio", mostraSe: (f) => !!faseCivile2012(f, "80") },
      { tipo: "bool", key: "f80_on", label: "Includi la fase", default: true, mostraSe: (f) => !!faseCivile2012(f, "80"),
        nota: (f) => { const t = faseCivile2012(f, "80"); return t ? `Min ${formatEuro(t[0])} · Med ${formatEuro(t[1])} · Max ${formatEuro(t[2])}` : null; } },
      { tipo: "scelta", key: "f80_val", label: "Valore", default: "", mostraSe: (f) => !!faseCivile2012(f, "80") && !!f.f80_on, opzioni: [
        { value: "", label: "Come la scelta generale" }, { value: "min", label: "Minimo" }, { value: "med", label: "Medio" }, { value: "max", label: "Massimo" },
      ] },
      { tipo: "numero", key: "f80_imp", label: "Compenso personalizzato € (facoltativo)", default: "", mostraSe: (f) => !!faseCivile2012(f, "80") && !!f.f80_on },
      { tipo: "titolo", key: "tit_f90", label: "Fase: Affari tavolari", mostraSe: (f) => !!faseCivile2012(f, "90") },
      { tipo: "bool", key: "f90_on", label: "Includi la fase", default: true, mostraSe: (f) => !!faseCivile2012(f, "90"),
        nota: (f) => { const t = faseCivile2012(f, "90"); return t ? `Min ${formatEuro(t[0])} · Med ${formatEuro(t[1])} · Max ${formatEuro(t[2])}` : null; } },
      { tipo: "scelta", key: "f90_val", label: "Valore", default: "", mostraSe: (f) => !!faseCivile2012(f, "90") && !!f.f90_on, opzioni: [
        { value: "", label: "Come la scelta generale" }, { value: "min", label: "Minimo" }, { value: "med", label: "Medio" }, { value: "max", label: "Massimo" },
      ] },
      { tipo: "numero", key: "f90_imp", label: "Compenso personalizzato € (facoltativo)", default: "", mostraSe: (f) => !!faseCivile2012(f, "90") && !!f.f90_on },
      { tipo: "titolo", key: "tit_aum", label: "Aumenti (tutti calcolati sul compenso tabellare)" },
      { tipo: "bool", key: "collegiale", label: "Incarico collegiale (art. 1, comma 4)", default: false },
      { tipo: "scelta", key: "pct_collegiale", label: "Aumento %", default: "100", mostraSe: (f) => !!f.collegiale, opzioni: OPZIONI_PCT_5_100 },
      { tipo: "bool", key: "piu_parti", label: "Più parti (art. 4, comma 4)", default: false },
      { tipo: "scelta", key: "pct_piu_parti", label: "Aumento %", default: "100", mostraSe: (f) => !!f.piu_parti, opzioni: OPZIONI_PCT_5_100 },
      { tipo: "bool", key: "class_action", label: "Class action (art. 4, comma 4)", default: false },
      { tipo: "scelta", key: "pct_class_action", label: "Aumento %", default: "200", mostraSe: (f) => !!f.class_action, opzioni: Array.from({ length: 20 }, (_, i) => ({ value: String(200 - i * 10), label: `${200 - i * 10}%` })) },
      { tipo: "bool", key: "conciliazione", label: "Causa conciliata (art. 4, comma 5)", default: false },
      { tipo: "scelta", key: "pct_conciliazione", label: "Aumento %", default: "25", mostraSe: (f) => !!f.conciliazione, opzioni: Array.from({ length: 25 }, (_, i) => ({ value: String(25 - i), label: `${25 - i}%` })) },
      { tipo: "bool", key: "importanza", label: "Ulteriore valutazione (art. 4, commi 2 e 3)", default: false },
      { tipo: "numero", key: "pct_importanza", label: "Aumento %", default: "", mostraSe: (f) => !!f.importanza },
      { tipo: "titolo", key: "tit_rid", label: "Riduzioni (a scalare)" },
      { tipo: "bool", key: "lavoro", label: "Causa di lavoro di valore inferiore a 1000 (art. 8, comma 1)", default: false },
      { tipo: "scelta", key: "pct_lavoro", label: "Riduzione %", default: "50", mostraSe: (f) => !!f.lavoro, opzioni: Array.from({ length: 50 }, (_, i) => ({ value: String(50 - i), label: `${50 - i}%` })) },
      { tipo: "bool", key: "indennizzo", label: "Indennizzo per irragionevole durata del processo (art. 9, comma 1)", default: false },
      { tipo: "scelta", key: "pct_indennizzo", label: "Riduzione %", default: "50", mostraSe: (f) => !!f.indennizzo, opzioni: Array.from({ length: 50 }, (_, i) => ({ value: String(50 - i), label: `${50 - i}%` })) },
      { tipo: "bool", key: "responsabilita", label: "Responsabilità art. 96 c.p.c. o pronunce in rito (50%, art. 10, comma 1)", default: false },
      { tipo: "bool", key: "gratuito_patrocinio", label: "Gratuito patrocinio (50%, art. 9, comma 1)", default: false },
      { tipo: "titolo", key: "tit_spese", label: "Spese" },
      { tipo: "numero", key: "spese_esenti", label: "Spese esenti € (art. 15 DPR 633/72)", default: "" },
      { tipo: "numero", key: "spese_imponibili", label: "Spese imponibili €", default: "" },
      { tipo: "bool", key: "spese_generali", label: "Spese generali", default: true },
      { tipo: "numero", key: "pct_spese_generali", label: "Percentuale spese generali", default: "15", mostraSe: (f) => !!f.spese_generali },
      { tipo: "titolo", key: "tit_acc", label: "Accessori" },
      { tipo: "bool", key: "cassa", label: "CPA (Cassa Avvocati 4%)", default: false },
      { tipo: "bool", key: "iva", label: "IVA 22%", default: false },
      { tipo: "bool", key: "ritenuta", label: "Ritenuta d'acconto 20%", default: false },
    ],
    endpoint: "/calc/parametri-civili-2012",
    validate: (f) => {
      if (!TABELLE_CIVILI_2012[f.competenza]?.[f.scaglione]) return "Seleziona il valore della causa per la competenza scelta.";
      if (!FASI_CIVILI_2012.some((x) => faseCivile2012(f, x.cod) && f[`f${x.cod}_on`])) return "Non hai selezionato alcuna fase.";
      if (f.importanza && !(parseNumeroIt(f.pct_importanza) > 0)) return "Specifica un valore per la percentuale di ulteriore valutazione.";
      return null;
    },
    buildBody: (f) => ({
      competenza: f.competenza, scaglione: f.scaglione, valore: f.valore,
      fasi: FASI_CIVILI_2012.filter((x) => faseCivile2012(f, x.cod)).map((x) => ({
        cod: parseInt(x.cod, 10), attiva: !!f[`f${x.cod}_on`],
        valore: f[`f${x.cod}_val`] || null,
        importo: String(f[`f${x.cod}_imp`] ?? "").trim() !== "" ? parseNumeroIt(f[`f${x.cod}_imp`]) : null,
      })),
      collegiale: !!f.collegiale, pct_collegiale: parseNumeroIt(f.pct_collegiale) || 100,
      piu_parti: !!f.piu_parti, pct_piu_parti: parseNumeroIt(f.pct_piu_parti) || 100,
      class_action: !!f.class_action, pct_class_action: parseNumeroIt(f.pct_class_action) || 200,
      conciliazione: !!f.conciliazione, pct_conciliazione: parseNumeroIt(f.pct_conciliazione) || 25,
      importanza: !!f.importanza, pct_importanza: f.importanza ? parseNumeroIt(f.pct_importanza) : null,
      lavoro: !!f.lavoro, pct_lavoro: parseNumeroIt(f.pct_lavoro) || 50,
      indennizzo: !!f.indennizzo, pct_indennizzo: parseNumeroIt(f.pct_indennizzo) || 50,
      responsabilita: !!f.responsabilita, gratuito_patrocinio: !!f.gratuito_patrocinio,
      spese_esenti: parseNumeroIt(f.spese_esenti), spese_imponibili: parseNumeroIt(f.spese_imponibili),
      spese_generali: !!f.spese_generali, pct_spese_generali: parseNumeroIt(f.pct_spese_generali),
      cassa: !!f.cassa, iva: !!f.iva, ritenuta: !!f.ritenuta,
    }),
    risultato: (r) => {
      const out: [string, string][] = [["Competenza", r.competenza_nome], ["Valore della causa", r.scaglione_etichetta]];
      for (const x of r.fasi) out.push([x.nome, formatEuro(x.importo)]);
      out.push(["Compenso tabellare ex art. 11", formatEuro(r.compenso_tabellare)]);
      for (const a of r.aumenti) out.push([`${a.descrizione} — ${a.pct}%`, formatEuro(a.importo)]);
      if (r.aumenti.length) out.push(["Compenso maggiorato (comprensivo degli aumenti)", formatEuro(r.compenso_maggiorato)]);
      for (const x of r.riduzioni) out.push([`${x.descrizione} — ${x.pct}% su ${formatEuro(x.base)}`, formatEuro(x.importo)]);
      if (r.riduzioni.length) out.push(["Compenso al netto delle riduzioni", formatEuro(r.compenso_totale)]);
      out.push(["Compenso totale", formatEuro(r.compenso_totale)]);
      if (r.spese_generali) out.push(["Spese generali", formatEuro(r.spese_generali)]);
      if (r.spese_imponibili) out.push(["Spese imponibili", formatEuro(r.spese_imponibili)]);
      if (r.cassa) out.push(["Cassa Avvocati (4%)", formatEuro(r.cassa)]);
      if (r.cassa || r.iva) out.push(["Totale imponibile", formatEuro(r.totale_imponibile)]);
      if (r.iva) out.push(["IVA 22% su imponibile", formatEuro(r.iva)]);
      if (r.spese_esenti) out.push(["Spese esenti ex art. 15 DPR 633/72", formatEuro(r.spese_esenti)]);
      out.push(["Ipotesi di compenso liquidabile", formatEuro(r.totale)]);
      if (r.ritenuta) {
        out.push(["A dedurre ritenuta d'acconto 20% (su compenso e spese)", formatEuro(r.ritenuta)]);
        out.push(["Totale documento", formatEuro(r.totale_documento)]);
      }
      return out;
    },
  },
  "spese-trasferta-avvocati": {
    campi: [
      { tipo: "numero", key: "pct_rimborso_carburante", label: "Rimborso carburante % (massimo 20%)", default: "20" },
      { tipo: "numero", key: "pct_costi_accessori", label: "Costi accessori albergo % (massimo 10%)", default: "10" },
      {
        tipo: "lista", key: "trasferte", label: "Trasferte (massimo 8)", etichettaAggiungi: "Aggiungi una trasferta",
        campiRiga: [
          { tipo: "testo", key: "localita", label: "Località" },
          { tipo: "testo", key: "data", label: "Data" },
          { tipo: "numero", key: "costo_carburante_litro", label: "Costo carburante al litro €" },
          { tipo: "numero", key: "km", label: "Chilometri" },
          { tipo: "numero", key: "pedaggi", label: "Pedaggi €" },
          { tipo: "numero", key: "parcheggio", label: "Parcheggio €" },
          { tipo: "numero", key: "albergo", label: "Albergo €" },
          { tipo: "numero", key: "treno", label: "Treno €" },
          { tipo: "numero", key: "aereo", label: "Aereo €" },
          { tipo: "numero", key: "altri_trasporti", label: "Altri trasporti €" },
          { tipo: "numero", key: "vitto", label: "Vitto €" },
          { tipo: "numero", key: "spese_varie", label: "Spese varie €" },
        ],
      },
    ],
    endpoint: "/calc/spese-trasferta-avvocati",
    validate: (f) => {
      if (!(f.trasferte || []).length) return "Inserire almeno una trasferta.";
      if ((f.trasferte || []).length > 8) return "Il calcolatore prevede al massimo 8 trasferte.";
      return null;
    },
    buildBody: (f) => ({
      pct_rimborso_carburante: Math.min(20, Math.max(0, parseNumeroIt(f.pct_rimborso_carburante))),
      pct_costi_accessori: Math.min(10, Math.max(0, parseNumeroIt(f.pct_costi_accessori))),
      trasferte: (f.trasferte || []).map((t: Record<string, string>) => ({
        costo_carburante_litro: parseNumeroIt(t.costo_carburante_litro), km: parseNumeroIt(t.km),
        pedaggi: parseNumeroIt(t.pedaggi), parcheggio: parseNumeroIt(t.parcheggio), albergo: parseNumeroIt(t.albergo),
        treno: parseNumeroIt(t.treno), aereo: parseNumeroIt(t.aereo), altri_trasporti: parseNumeroIt(t.altri_trasporti),
        vitto: parseNumeroIt(t.vitto), spese_varie: parseNumeroIt(t.spese_varie),
      })),
    }),
    risultato: (r) => {
      const out: [string, string][] = [];
      r.dettaglio.forEach((d: any, i: number) => {
        const n = r.dettaglio.length > 1 ? ` (trasferta ${i + 1})` : "";
        if (d.rimborso_carburante) out.push([`Rimborso carburante${n}`, formatEuro(d.rimborso_carburante)]);
        out.push([`Totale spese auto${n}`, formatEuro(d.totale_spese_auto)]);
        if (d.costi_accessori) out.push([`Costi accessori albergo${n}`, formatEuro(d.costi_accessori)]);
        out.push([`Totale albergo${n}`, formatEuro(d.totale_albergo)]);
        out.push([`Totale trasporti${n}`, formatEuro(d.totale_trasporti)]);
        out.push([`Totale trasferta${n}`, formatEuro(d.totale_trasferta)]);
      });
      out.push(["Totale generale", formatEuro(r.totale_generale)]);
      return out;
    },
  },
  "notula-penale-tariffario-2004": {
    campi: [
      { tipo: "scelta", key: "competenza", label: "Competenza", default: "1", opzioni: NOTULA_PENALE_ORDINE.map((k) => ({ value: k, label: NOTULA_PENALE_2004[k].nome })) },
      { tipo: "scelta", key: "tariffa_predefinita", label: "Tariffa predefinita", default: "media", opzioni: [
        { value: "minima", label: "Minima" }, { value: "media", label: "Media" }, { value: "massima", label: "Massima" },
      ] },
      {
        tipo: "lista", key: "attivita", label: "Attività", etichettaAggiungi: "Aggiungi un'attività",
        campiRiga: [
          { tipo: "scelta", key: "indice", label: "Attività", default: "", opzioni: opzioniAttivitaNotula },
          { tipo: "numero", key: "quantita", label: "Quantità (1-99)", default: "1" },
          { tipo: "scelta", key: "tariffa", label: "Tariffa", default: "predefinita", opzioni: [
            { value: "predefinita", label: "Predefinita" }, { value: "minima", label: "Minima" }, { value: "media", label: "Media" }, { value: "massima", label: "Massima" }, { value: "manuale", label: "Specificata" },
          ] },
          { tipo: "numero", key: "valore", label: "Tariffa specificata € (solo se 'Specificata')" },
          { tipo: "numero", key: "spese_esenti", label: "Spese esenti €" },
          { tipo: "numero", key: "spese_imponibili", label: "Spese imponibili €" },
        ],
      },
      { tipo: "bool", key: "spese_generali", label: "Spese generali", default: true },
      { tipo: "numero", key: "pct_spese_generali", label: "Percentuale spese generali", default: "15", mostraSe: (f) => !!f.spese_generali },
      { tipo: "bool", key: "ritenuta", label: "Ritenuta d'acconto", default: true },
      { tipo: "scelta", key: "regime", label: "Regime", default: "0", opzioni: [
        { value: "0", label: "Ordinario" }, { value: "1", label: "Regime forfettario agevolato 2014" }, { value: "2", label: "Regime di vantaggio 2011" }, { value: "3", label: "Regime dei minimi 2008" },
      ] },
      { tipo: "bool", key: "bollo", label: "Bollo (2 € se il totale supera 77,47 €)", default: false, mostraSe: (f) => f.regime !== "0" },
      {
        tipo: "lista", key: "anticipi", label: "Anticipi ricevuti", etichettaAggiungi: "Aggiungi un anticipo",
        campiRiga: [
          { tipo: "testo", key: "data", label: "Data" },
          { tipo: "numero", key: "importo", label: "Anticipo €" },
          { tipo: "numero", key: "spese_esenti", label: "di cui spese esenti €" },
          { tipo: "numero", key: "spese_imponibili", label: "di cui spese imponibili €" },
        ],
      },
      { tipo: "titolo", key: "tit_rip", label: "Riparametrazione della notula" },
      { tipo: "scelta", key: "rip_tipo", label: "Operazione", default: "", opzioni: [
        { value: "", label: "Nessuna" }, { value: "tariffa", label: "Ricalcola tutto a una tariffa" }, { value: "variazione", label: "Aumenta o riduci le tariffe di una percentuale" }, { value: "forza_totale", label: "Forza il totale" },
      ] },
      { tipo: "scelta", key: "rip_tariffa", label: "Tariffa", default: "media", mostraSe: (f) => f.rip_tipo === "tariffa", opzioni: [
        { value: "minima", label: "Minima" }, { value: "media", label: "Media" }, { value: "massima", label: "Massima" },
      ] },
      { tipo: "bool", key: "rip_incl", label: "Comprese le tariffe personalizzate", default: false, mostraSe: (f) => f.rip_tipo === "tariffa" },
      { tipo: "scelta", key: "rip_dir", label: "Variazione", default: "aumenta", mostraSe: (f) => f.rip_tipo === "variazione", opzioni: [{ value: "aumenta", label: "Aumenta" }, { value: "riduci", label: "Riduci" }] },
      { tipo: "numero", key: "rip_pct", label: "Percentuale", default: "", mostraSe: (f) => f.rip_tipo === "variazione" },
      { tipo: "numero", key: "rip_totale", label: "Totale € da ottenere", default: "", mostraSe: (f) => f.rip_tipo === "forza_totale" },
    ],
    endpoint: "/calc/notula-penale-tariffario-2004",
    validate: (f) => {
      const righe = f.attivita || [];
      if (!righe.length) return "Selezionare almeno un'attività.";
      for (const r of righe) {
        if (r.indice === "" || r.indice == null) return "Scegli l'attività in ogni riga.";
        if (!(Math.floor(parseNumeroIt(r.quantita)) >= 1)) return "La quantità deve essere almeno 1.";
        if (r.tariffa === "manuale" && !(parseNumeroIt(r.valore) > 0)) return "Indica la tariffa specificata.";
        const voce = NOTULA_PENALE_2004[f.competenza]?.att[parseInt(r.indice, 10)];
        if (voce && voce[2] === 0 && r.tariffa !== "manuale") return `Per l'attività ${voce[0]} la tariffa va specificata.`;
      }
      if (f.rip_tipo === "variazione" && !(parseNumeroIt(f.rip_pct) > 0)) return "Indica la percentuale di variazione.";
      if (f.rip_tipo === "forza_totale" && !(parseNumeroIt(f.rip_totale) > 0)) return "Indica il totale da ottenere.";
      return null;
    },
    buildBody: (f) => ({
      competenza: f.competenza,
      attivita: (f.attivita || []).map((r: Record<string, string>) => {
        const tar = r.tariffa === "predefinita" ? f.tariffa_predefinita : r.tariffa;
        return {
          indice: parseInt(r.indice, 10), quantita: Math.floor(parseNumeroIt(r.quantita)) || 1, tariffa: tar,
          valore_manuale: tar === "manuale" ? parseNumeroIt(r.valore) : null,
          spese_esenti: parseNumeroIt(r.spese_esenti), spese_imponibili: parseNumeroIt(r.spese_imponibili),
        };
      }),
      applica_spese_generali: !!f.spese_generali, spese_generali_pct: parseNumeroIt(f.pct_spese_generali),
      applica_ritenuta: !!f.ritenuta, regime: parseInt(f.regime, 10) || 0, applica_bollo: f.regime !== "0" && !!f.bollo,
      anticipi: (f.anticipi || []).map((a: Record<string, string>) => ({
        data: a.data || null, importo: parseNumeroIt(a.importo), spese_esenti: parseNumeroIt(a.spese_esenti), spese_imponibili: parseNumeroIt(a.spese_imponibili),
      })),
      riparametrazione: f.rip_tipo === "tariffa" ? { tipo: "tariffa", tariffa: f.rip_tariffa, includi_personalizzate: !!f.rip_incl }
        : f.rip_tipo === "variazione" ? { tipo: "variazione", variazione_pct: (f.rip_dir === "riduci" ? -1 : 1) * parseNumeroIt(f.rip_pct) }
        : f.rip_tipo === "forza_totale" ? { tipo: "forza_totale", totale: parseNumeroIt(f.rip_totale) } : null,
    }),
    risultato: (r) => {
      const out: [string, string][] = [["Competenza", r.competenza_nome]];
      for (const d of r.dettaglio) {
        out.push([`${d.codice} ${d.nome} (${d.quantita} x ${formatEuro(d.valore_unitario)})`, formatEuro(d.importo)]);
        if (d.spese_esenti) out.push(["   spese esenti", formatEuro(d.spese_esenti)]);
        if (d.spese_imponibili) out.push(["   spese imponibili", formatEuro(d.spese_imponibili)]);
      }
      out.push(["Totale onorari", formatEuro(r.onorari_lordi)]);
      for (const a of r.avvertenze || []) out.push(["Avvertenza", a]);
      if (r.anticipi) {
        out.push(["Totale anticipi", formatEuro(r.anticipi.totale)]);
        out.push(["di cui onorari anticipati", formatEuro(r.anticipi.onorari_anticipati)]);
        out.push(["Onorari al netto degli anticipi", formatEuro(r.onorari)]);
      } else out.push(["Onorari", formatEuro(r.onorari)]);
      if (r.spese_generali) out.push(["Spese generali", formatEuro(r.spese_generali)]);
      if (r.spese_imponibili) out.push(["Spese imponibili", formatEuro(r.spese_imponibili)]);
      if (r.bollo) out.push(["Imposta di bollo", formatEuro(r.bollo)]);
      if (r.cpa) out.push(["Cassa Avvocati (4%)", formatEuro(r.cpa)]);
      if (r.regime === 0 || (r.regime === 3 && r.ritenuta_acconto)) out.push(["Totale imponibile", formatEuro(r.totale_imponibile)]);
      if (r.iva) out.push(["IVA 22% su imponibile", formatEuro(r.iva)]);
      if (r.spese_esenti) out.push(["Spese esenti ex art. 15 DPR 633/72", formatEuro(r.spese_esenti)]);
      out.push([r.ritenuta_acconto ? "Totale" : "Totale documento", formatEuro(r.totale)]);
      if (r.ritenuta_acconto) {
        out.push(["A dedurre ritenuta d'acconto 20% (su onorari e spese)", formatEuro(r.ritenuta_acconto)]);
        out.push(["Netto a pagare", formatEuro(r.netto_a_pagare)]);
      }
      const notaIva: Record<number, string> = {
        1: "Operazione non soggetta a IVA effettuata ai sensi dell'art. 1, commi 54-89, L. 190/2014 (regime forfettario agevolato).",
        2: "Operazione non soggetta a IVA effettuata ai sensi dell'art. 27, D.L. 98/2011 (regime fiscale di vantaggio per l'imprenditoria giovanile).",
        3: "Operazione non soggetta a IVA effettuata ai sensi dell'art. 1, commi 96-117, L. 244/2007 (regime fiscale semplificato).",
      };
      if (notaIva[r.regime]) out.push(["Nota", notaIva[r.regime]]);
      if (r.applica_ritenuta && r.regime === 1) out.push(["Nota", "Compenso non soggetto a ritenuta d'acconto ai sensi dell'art. 1, comma 67 L. 190/2014."]);
      if (r.applica_ritenuta && r.regime === 2) out.push(["Nota", "Compenso non soggetto a ritenuta d'acconto come da provvedimento del Direttore dell'Agenzia delle entrate n. 185820/2011."]);
      if (r.nota_bollo) out.push(["Nota", "Imposta di bollo assolta sull'originale."]);
      return out;
    },
  },
  "nota-spese-tariffe-2004": {
    campi: [
      { tipo: "scelta", key: "tariffario", label: "Tariffario", default: "civile", opzioni: [
        { value: "civile", label: "Diritti e Onorari" }, { value: "stragiudiziale", label: "Stragiudiziale" },
      ] },
      { tipo: "scelta", key: "valore_tipo", label: "Valore della causa", default: "specificato", opzioni: [
        { value: "specificato", label: "Specificato" }, { value: "indeterminabile", label: "Indeterminabile" }, { value: "indeterminabile_importanza", label: "Indeterminabile e di particolare importanza" },
      ] },
      { tipo: "numero", key: "valore_causa", label: "Valore della causa €", default: "", mostraSe: (f) => f.valore_tipo === "specificato" },
      { tipo: "scelta", key: "tariffa_predefinita", label: "Tariffa predefinita", default: "media", opzioni: [
        { value: "minima", label: "Minima" }, { value: "media", label: "Media" }, { value: "massima", label: "Massima" },
      ] },
      { tipo: "scelta", key: "competenza_diritti", label: "Competenza (diritti)", default: "1", mostraSe: (f) => f.tariffario === "civile", opzioni: NS_COMP_DIRITTI },
      {
        tipo: "lista", key: "diritti", label: "Diritti", etichettaAggiungi: "Aggiungi un diritto", mostraSe: (f) => f.tariffario === "civile",
        campiRiga: [
          { tipo: "scelta", key: "indice", label: "Attività", default: "", opzioni: (f) => opzioniNotaSpese(NS_DIRITTI[f.competenza_diritti]) },
          { tipo: "numero", key: "quantita", label: "Quantità (1-99)", default: "1" },
          { tipo: "scelta", key: "tariffa", label: "Tariffa", default: "predefinita", opzioni: [
            { value: "predefinita", label: "Predefinita" }, { value: "minima", label: "Minima" }, { value: "media", label: "Media" }, { value: "massima", label: "Massima" }, { value: "manuale", label: "Specificata" },
          ] },
          { tipo: "numero", key: "valore", label: "Tariffa specificata € (solo se 'Specificata')" },
          { tipo: "numero", key: "spese_esenti", label: "Spese esenti €" },
          { tipo: "numero", key: "spese_imponibili", label: "Spese imponibili €" },
        ],
      },
      { tipo: "scelta", key: "competenza_onorari", label: "Competenza (onorari)", default: "11", mostraSe: (f) => f.tariffario === "civile", opzioni: NS_COMP_ONORARI },
      {
        tipo: "lista", key: "onorari", label: "Onorari", etichettaAggiungi: "Aggiungi un onorario", mostraSe: (f) => f.tariffario === "civile",
        campiRiga: [
          { tipo: "scelta", key: "indice", label: "Attività", default: "", opzioni: (f) => opzioniNotaSpese(NS_ONORARI[f.competenza_onorari]) },
          { tipo: "numero", key: "quantita", label: "Quantità (1-99)", default: "1" },
          { tipo: "scelta", key: "tariffa", label: "Tariffa", default: "predefinita", opzioni: [
            { value: "predefinita", label: "Predefinita" }, { value: "minima", label: "Minima" }, { value: "media", label: "Media" }, { value: "massima", label: "Massima" }, { value: "manuale", label: "Specificata" },
          ] },
          { tipo: "numero", key: "valore", label: "Tariffa specificata € (solo se 'Specificata')" },
        ],
      },
      {
        tipo: "lista", key: "stragiudiziale", label: "Attività stragiudiziali", etichettaAggiungi: "Aggiungi un'attività", mostraSe: (f) => f.tariffario === "stragiudiziale",
        campiRiga: [
          { tipo: "scelta", key: "indice", label: "Attività", default: "", opzioni: () => opzioniNotaSpese(NS_STRAG) },
          { tipo: "numero", key: "quantita", label: "Quantità (1-99)", default: "1" },
          { tipo: "scelta", key: "tariffa", label: "Tariffa", default: "predefinita", opzioni: [
            { value: "predefinita", label: "Predefinita" }, { value: "minima", label: "Minima" }, { value: "media", label: "Media" }, { value: "massima", label: "Massima" }, { value: "manuale", label: "Specificata" },
          ] },
          { tipo: "numero", key: "valore", label: "Tariffa specificata € (solo se 'Specificata')" },
          { tipo: "numero", key: "spese_esenti", label: "Spese esenti €" },
          { tipo: "numero", key: "spese_imponibili", label: "Spese imponibili €" },
        ],
      },
      { tipo: "bool", key: "spese_generali", label: "Spese generali", default: true },
      { tipo: "numero", key: "pct_spese_generali", label: "Percentuale spese generali", default: "15", mostraSe: (f) => !!f.spese_generali },
      { tipo: "bool", key: "ritenuta", label: "Ritenuta d'acconto", default: true },
      { tipo: "scelta", key: "regime", label: "Regime", default: "0", opzioni: [
        { value: "0", label: "Ordinario" }, { value: "1", label: "Regime forfettario agevolato 2014" }, { value: "2", label: "Regime di vantaggio 2011" }, { value: "3", label: "Regime dei minimi 2008" },
      ] },
      { tipo: "bool", key: "bollo", label: "Bollo (2 € se il totale supera 77,47 €)", default: false, mostraSe: (f) => f.regime !== "0" },
      {
        tipo: "lista", key: "anticipi", label: "Anticipi ricevuti", etichettaAggiungi: "Aggiungi un anticipo",
        campiRiga: [
          { tipo: "testo", key: "data", label: "Data" },
          { tipo: "numero", key: "importo", label: "Anticipo €" },
          { tipo: "numero", key: "spese_esenti", label: "di cui spese esenti €" },
          { tipo: "numero", key: "spese_imponibili", label: "di cui spese imponibili €" },
        ],
      },
      { tipo: "titolo", key: "tit_rip", label: "Riparametrazione (variazione e totale agiscono solo sugli onorari)" },
      { tipo: "scelta", key: "rip_tipo", label: "Operazione", default: "", opzioni: [
        { value: "", label: "Nessuna" }, { value: "tariffa", label: "Ricalcola tutto a una tariffa" }, { value: "variazione", label: "Aumenta o riduci le tariffe di una percentuale" }, { value: "forza_totale", label: "Forza il totale" },
      ] },
      { tipo: "scelta", key: "rip_tariffa", label: "Tariffa", default: "media", mostraSe: (f) => f.rip_tipo === "tariffa", opzioni: [
        { value: "minima", label: "Minima" }, { value: "media", label: "Media" }, { value: "massima", label: "Massima" },
      ] },
      { tipo: "bool", key: "rip_incl", label: "Comprese le tariffe personalizzate", default: false, mostraSe: (f) => f.rip_tipo === "tariffa" },
      { tipo: "scelta", key: "rip_dir", label: "Variazione", default: "aumenta", mostraSe: (f) => f.rip_tipo === "variazione", opzioni: [{ value: "aumenta", label: "Aumenta" }, { value: "riduci", label: "Riduci" }] },
      { tipo: "numero", key: "rip_pct", label: "Percentuale", default: "", mostraSe: (f) => f.rip_tipo === "variazione" },
      { tipo: "numero", key: "rip_totale", label: "Totale € da ottenere", default: "", mostraSe: (f) => f.rip_tipo === "forza_totale" },
    ],
    endpoint: "/calc/nota-spese-tariffe-2004",
    validate: (f) => {
      const strag = f.tariffario === "stragiudiziale";
      const righe: Record<string, string>[] = strag ? f.stragiudiziale || [] : [...(f.diritti || []), ...(f.onorari || [])];
      if (f.valore_tipo === "specificato" && !(parseNumeroIt(f.valore_causa) > 0)) return "Indica il valore della causa.";
      if (!righe.length) return "Selezionare almeno un'attività.";
      for (const r of righe) {
        if (r.indice === "" || r.indice == null) return "Scegli l'attività in ogni riga.";
        if (!(Math.floor(parseNumeroIt(r.quantita)) >= 1)) return "La quantità deve essere almeno 1.";
        if (r.tariffa === "manuale" && !(parseNumeroIt(r.valore) > 0)) return "Indica la tariffa specificata.";
      }
      if (f.rip_tipo === "variazione" && !(parseNumeroIt(f.rip_pct) > 0)) return "Indica la percentuale di variazione.";
      if (f.rip_tipo === "forza_totale" && !(parseNumeroIt(f.rip_totale) > 0)) return "Indica il totale da ottenere.";
      return null;
    },
    buildBody: (f) => {
      const righe = (lista: Record<string, string>[]) => (lista || []).map((r) => {
        const tar = r.tariffa === "predefinita" ? f.tariffa_predefinita : r.tariffa;
        return {
          indice: parseInt(r.indice, 10), quantita: Math.floor(parseNumeroIt(r.quantita)) || 1, tariffa: tar,
          valore_manuale: tar === "manuale" ? parseNumeroIt(r.valore) : null,
          spese_esenti: parseNumeroIt(r.spese_esenti), spese_imponibili: parseNumeroIt(r.spese_imponibili),
        };
      });
      const strag = f.tariffario === "stragiudiziale";
      return {
        tariffario: f.tariffario, valore_tipo: f.valore_tipo, valore_causa: f.valore_tipo === "specificato" ? parseNumeroIt(f.valore_causa) : 0,
        competenza_diritti: parseInt(f.competenza_diritti, 10) || 1, competenza_onorari: parseInt(f.competenza_onorari, 10) || 11,
        diritti: strag ? [] : righe(f.diritti), onorari: strag ? [] : righe(f.onorari), stragiudiziale: strag ? righe(f.stragiudiziale) : [],
        applica_spese_generali: !!f.spese_generali, spese_generali_pct: parseNumeroIt(f.pct_spese_generali),
        applica_ritenuta: !!f.ritenuta, regime: parseInt(f.regime, 10) || 0, applica_bollo: f.regime !== "0" && !!f.bollo,
        anticipi: (f.anticipi || []).map((a: Record<string, string>) => ({
          data: a.data || null, importo: parseNumeroIt(a.importo), spese_esenti: parseNumeroIt(a.spese_esenti), spese_imponibili: parseNumeroIt(a.spese_imponibili),
        })),
        riparametrazione: f.rip_tipo === "tariffa" ? { tipo: "tariffa", tariffa: f.rip_tariffa, includi_personalizzate: !!f.rip_incl }
          : f.rip_tipo === "variazione" ? { tipo: "variazione", variazione_pct: (f.rip_dir === "riduci" ? -1 : 1) * parseNumeroIt(f.rip_pct) }
          : f.rip_tipo === "forza_totale" ? { tipo: "forza_totale", totale: parseNumeroIt(f.rip_totale) } : null,
      };
    },
    risultato: (r) => {
      const out: [string, string][] = [];
      const titoli: Record<string, string> = { diritti: "Diritti", onorari: "Onorari", stragiudiziale: "Attività stragiudiziali" };
      let sez = "";
      for (const d of r.dettaglio) {
        if (d.sezione !== sez) { sez = d.sezione; out.push([titoli[sez] || sez, ""]); }
        out.push([`${d.codice} ${d.nome} (${d.quantita} x ${formatEuro(d.valore_unitario)})`, formatEuro(d.importo)]);
        if (d.spese_esenti) out.push(["   spese esenti", formatEuro(d.spese_esenti)]);
        if (d.spese_imponibili) out.push(["   spese imponibili", formatEuro(d.spese_imponibili)]);
      }
      for (const [k, v] of Object.entries(r.totali_sezione as Record<string, number>)) out.push([`Totale ${titoli[k] || k}`, formatEuro(v)]);
      const etichettaBase = r.tariffario === "stragiudiziale" ? "Competenze" : "Diritti e Onorari";
      for (const a of r.avvertenze || []) out.push(["Avvertenza", a]);
      if (r.anticipi) {
        out.push(["Totale anticipi", formatEuro(r.anticipi.totale)]);
        out.push(["di cui anticipati", formatEuro(r.anticipi.onorari_anticipati)]);
        out.push([`${etichettaBase} al netto degli anticipi`, formatEuro(r.onorari)]);
      } else out.push([etichettaBase, formatEuro(r.onorari)]);
      if (r.spese_generali) out.push(["Spese generali", formatEuro(r.spese_generali)]);
      if (r.spese_imponibili) out.push(["Spese imponibili", formatEuro(r.spese_imponibili)]);
      if (r.bollo) out.push(["Imposta di bollo", formatEuro(r.bollo)]);
      if (r.cpa) out.push(["Cassa Avvocati (4%)", formatEuro(r.cpa)]);
      if (r.regime === 0 || (r.regime === 3 && r.ritenuta_acconto)) out.push(["Totale imponibile", formatEuro(r.totale_imponibile)]);
      if (r.iva) out.push(["IVA 22% su imponibile", formatEuro(r.iva)]);
      if (r.spese_esenti) out.push(["Spese esenti ex art. 15 DPR 633/72", formatEuro(r.spese_esenti)]);
      out.push([r.ritenuta_acconto ? "Totale" : "Totale documento", formatEuro(r.totale)]);
      if (r.ritenuta_acconto) {
        out.push(["A dedurre ritenuta d'acconto 20%", formatEuro(r.ritenuta_acconto)]);
        out.push(["Netto a pagare", formatEuro(r.netto_a_pagare)]);
      }
      const notaIva: Record<number, string> = {
        1: "Operazione non soggetta a IVA effettuata ai sensi dell'art. 1, commi 54-89, L. 190/2014 (regime forfettario agevolato).",
        2: "Operazione non soggetta a IVA effettuata ai sensi dell'art. 27, D.L. 98/2011 (regime fiscale di vantaggio per l'imprenditoria giovanile).",
        3: "Operazione non soggetta a IVA effettuata ai sensi dell'art. 1, commi 96-117, L. 244/2007 (regime fiscale semplificato).",
      };
      if (notaIva[r.regime]) out.push(["Nota", notaIva[r.regime]]);
      if (r.applica_ritenuta && r.regime === 1) out.push(["Nota", "Compenso non soggetto a ritenuta d'acconto ai sensi dell'art. 1, comma 67 L. 190/2014."]);
      if (r.applica_ritenuta && r.regime === 2) out.push(["Nota", "Compenso non soggetto a ritenuta d'acconto come da provvedimento del Direttore dell'Agenzia delle entrate n. 185820/2011."]);
      if (r.nota_bollo) out.push(["Nota", "Imposta di bollo assolta sull'originale."]);
      return out;
    },
  },
  "preventivo-stragiudiziale": {
    campi: [
      { tipo: "scelta", key: "competenza", label: "Tipo attività", default: "assistenza", opzioni: [
        { value: "assistenza", label: "Assistenza stragiudiziale" }, { value: "mediazione", label: "Mediazione e Negoziazione assistita" },
      ] },
      { tipo: "scelta", key: "tipo_compenso", label: "Calcolo compenso", default: "tabellare", mostraSe: (f) => f.competenza === "assistenza", opzioni: [
        { value: "tabellare", label: "Tabellare" }, { value: "percentuale", label: "In percentuale" },
      ] },
      { tipo: "scelta", key: "scaglione", label: "Valore della pratica", default: "30", mostraSe: (f) => !(f.competenza === "assistenza" && f.tipo_compenso === "percentuale"),
        opzioni: (f) => [...(f.competenza === "mediazione" ? PV_SCAGLIONI_MEDIAZIONE : PV_SCAGLIONI_ASSISTENZA), ...PV_INDETERMINABILI] },
      { tipo: "numero", key: "valore_causa", label: "Valore della pratica €", default: "", mostraSe: (f) => f.competenza === "assistenza" && f.tipo_compenso === "percentuale" },
      { tipo: "numero", key: "pct_compenso", label: "Percentuale del compenso (massimo 5%)", default: "", mostraSe: (f) => f.competenza === "assistenza" && f.tipo_compenso === "percentuale" },
      { tipo: "titolo", key: "pv_tit0", label: "Fase 1: Compenso (assistenza) / Fase dell'attivazione (mediazione)", mostraSe: (f) => true },
      { tipo: "bool", key: "pv_f0_on", label: "Includi la fase", default: true, mostraSe: (f) => true },
      { tipo: "numero", key: "pv_f0_pct", label: "Variazione % sul valore medio (da -100 a 100)", default: "0", mostraSe: (f) => true && !!f.pv_f0_on },
      { tipo: "numero", key: "pv_f0_imp", label: "Compenso personalizzato € (facoltativo, sostituisce il calcolato)", default: "", mostraSe: (f) => true && !!f.pv_f0_on },
      { tipo: "titolo", key: "pv_tit1", label: "Fase 2: Fase di negoziazione", mostraSe: (f) => (f.competenza === "mediazione" && f.tipo_compenso === "tabellare") },
      { tipo: "bool", key: "pv_f1_on", label: "Includi la fase", default: true, mostraSe: (f) => (f.competenza === "mediazione" && f.tipo_compenso === "tabellare") },
      { tipo: "numero", key: "pv_f1_pct", label: "Variazione % sul valore medio (da -100 a 100)", default: "0", mostraSe: (f) => (f.competenza === "mediazione" && f.tipo_compenso === "tabellare") && !!f.pv_f1_on },
      { tipo: "numero", key: "pv_f1_imp", label: "Compenso personalizzato € (facoltativo, sostituisce il calcolato)", default: "", mostraSe: (f) => (f.competenza === "mediazione" && f.tipo_compenso === "tabellare") && !!f.pv_f1_on },
      { tipo: "titolo", key: "pv_tit2", label: "Fase 3: Conciliazione", mostraSe: (f) => (f.competenza === "mediazione" && f.tipo_compenso === "tabellare") },
      { tipo: "bool", key: "pv_f2_on", label: "Includi la fase", default: true, mostraSe: (f) => (f.competenza === "mediazione" && f.tipo_compenso === "tabellare") },
      { tipo: "numero", key: "pv_f2_pct", label: "Variazione % sul valore medio (da -100 a 100)", default: "0", mostraSe: (f) => (f.competenza === "mediazione" && f.tipo_compenso === "tabellare") && !!f.pv_f2_on },
      { tipo: "numero", key: "pv_f2_imp", label: "Compenso personalizzato € (facoltativo, sostituisce il calcolato)", default: "", mostraSe: (f) => (f.competenza === "mediazione" && f.tipo_compenso === "tabellare") && !!f.pv_f2_on },
      {
        tipo: "lista", key: "compensi", label: "Altre voci di compenso", etichettaAggiungi: "Aggiungi una voce di compenso",
        campiRiga: [
          { tipo: "testo", key: "descrizione", label: "Descrizione" },
          { tipo: "numero", key: "importo", label: "Importo €" },
        ],
      },
      {
        tipo: "lista", key: "spese", label: "Spese ipotizzabili", etichettaAggiungi: "Aggiungi una spesa",
        campiRiga: [
          { tipo: "testo", key: "descrizione", label: "Descrizione (es. Trasferte)" },
          { tipo: "numero", key: "esente", label: "Spesa esente €" },
          { tipo: "numero", key: "non_esente", label: "Spesa non esente €" },
        ],
      },
      { tipo: "bool", key: "accessori", label: "Includi gli accessori di legge", default: true },
      { tipo: "bool", key: "spese_generali", label: "Spese generali", default: true, mostraSe: (f) => !!f.accessori },
      { tipo: "numero", key: "pct_spese_generali", label: "Percentuale spese generali", default: "15", mostraSe: (f) => !!f.accessori && !!f.spese_generali },
      { tipo: "bool", key: "cassa", label: "Cassa Avvocati (4%)", default: true, mostraSe: (f) => !!f.accessori },
      { tipo: "bool", key: "iva", label: "IVA 22%", default: true, mostraSe: (f) => !!f.accessori },
    ],
    endpoint: "/calc/preventivo-stragiudiziale",
    validate: (f) => {
      if (f.competenza === "assistenza" && f.tipo_compenso === "percentuale") {
        if (!(parseNumeroIt(f.valore_causa) > 0)) return "Indica il valore della pratica.";
        if (!(parseNumeroIt(f.pct_compenso) > 0)) return "Indica la percentuale del compenso.";
      }
      return null;
    },
    buildBody: (f) => {
      const perc = f.competenza === "assistenza" && f.tipo_compenso === "percentuale";
      const nfasi = f.competenza === "mediazione" ? 3 : 1;
      return {
        competenza: f.competenza, tipo_compenso: f.competenza === "assistenza" ? f.tipo_compenso : "tabellare",
        scaglione: perc ? "30" : f.scaglione, valore_causa: perc ? parseNumeroIt(f.valore_causa) : 0, pct_compenso: perc ? parseNumeroIt(f.pct_compenso) : 0,
        fasi: Array.from({ length: nfasi }, (_, i) => ({
          attiva: !!f[`pv_f${i}_on`], variazione_pct: Math.max(-100, Math.min(100, parseNumeroIt(f[`pv_f${i}_pct`]))),
          importo: String(f[`pv_f${i}_imp`] ?? "").trim() !== "" ? parseNumeroIt(f[`pv_f${i}_imp`]) : null,
        })),
        compensi: (f.compensi || []).map((r: Record<string, string>) => ({ descrizione: r.descrizione || "", importo: parseNumeroIt(r.importo) })),
        spese: (f.spese || []).map((r: Record<string, string>) => ({ descrizione: r.descrizione || "", esente: parseNumeroIt(r.esente), non_esente: parseNumeroIt(r.non_esente) })),
        accessori: !!f.accessori, spese_generali: !!f.spese_generali, pct_spese_generali: parseNumeroIt(f.pct_spese_generali),
        cassa: !!f.cassa, iva: !!f.iva,
      };
    },
    risultato: (r) => {
      const out: [string, string][] = [["Valore dell'affare", r.valore_affare]];
      for (const x of r.fasi) if (x.attiva) out.push([x.nome, formatEuro(x.importo)]);
      for (const x of r.compensi_aggiuntivi) out.push([x.descrizione, formatEuro(x.importo)]);
      out.push(["Totale compenso", formatEuro(r.compenso_totale)]);
      for (const s of r.spese) {
        if (s.esente) out.push([`${s.descrizione} (esente)`, formatEuro(s.esente)]);
        if (s.non_esente) out.push([`${s.descrizione} (non esente)`, formatEuro(s.non_esente)]);
      }
      if (r.spese_generali) out.push(["Spese generali", formatEuro(r.spese_generali)]);
      if (r.cassa) out.push(["Cassa Avvocati (4%)", formatEuro(r.cassa)]);
      if (r.iva) out.push(["IVA 22%", formatEuro(r.iva)]);
      if (r.totale_accessori) out.push(["Totale accessori", formatEuro(r.totale_accessori)]);
      out.push(["TOTALE PREVENTIVO", formatEuro(r.totale)]);
      return out;
    },
  },
  "quote-ereditarie": {
    campi: [
      { tipo: "scelta", key: "modalita", label: "Modalità", default: "legittima", opzioni: [
        { value: "legittima", label: "Successione legittima (senza testamento)" }, { value: "testamentaria", label: "Quota di legittima (con testamento)" },
      ] },
      { tipo: "numero", key: "patrimonio", label: "Patrimonio ereditario €", default: "" },
      { tipo: "bool", key: "coniuge", label: "Coniuge superstite", default: false },
      { tipo: "numero", key: "numero_figli", label: "Numero di figli", default: "0" },
      { tipo: "numero", key: "numero_ascendenti", label: "Numero di ascendenti (genitori, max 2)", default: "0" },
      { tipo: "numero", key: "numero_fratelli", label: "Numero di fratelli", default: "0", mostraSe: (f) => f.modalita === "legittima" },
      { tipo: "numero", key: "numero_parenti", label: "Numero di altri parenti entro il 6° grado", default: "0", mostraSe: (f) => f.modalita === "legittima" },
    ],
    endpoint: "/calc/quote-ereditarie",
    buildBody: (f) => ({
      modalita: f.modalita, patrimonio: parseNumeroIt(f.patrimonio), coniuge: f.coniuge,
      numero_figli: parseNumeroIt(f.numero_figli), numero_ascendenti: parseNumeroIt(f.numero_ascendenti),
      numero_fratelli: f.modalita === "legittima" ? parseNumeroIt(f.numero_fratelli) : 0,
      numero_parenti: f.modalita === "legittima" ? parseNumeroIt(f.numero_parenti) : 0,
    }),
    risultato: (r) => [
      ...Object.entries(r.eredi || {}).map(([cat, v]: [string, any]) => [
        `${cat} (quota ${v.quota_pct}%)`, `${formatEuro(v.importo_totale)}${v.numero > 1 ? ` — ${formatEuro(v.importo_ciascuno)} ciascuno` : ""}`,
      ] as [string, string]),
      ...(r.quota_disponibile_importo != null ? ([["Quota disponibile", formatEuro(r.quota_disponibile_importo)]] as [string, string][]) : []),
    ],
  },
  "usufrutto": {
    campi: [
      { tipo: "numero", key: "valore_piena_proprieta", label: "Valore della piena proprietà €", default: "" },
      { tipo: "scelta", key: "tipo_calcolo", label: "Tipo di usufrutto", default: "vitalizio", opzioni: [
        { value: "vitalizio", label: "Vitalizio (per età)" }, { value: "termine", label: "A termine (per durata)" },
      ] },
      { tipo: "numero", key: "eta", label: "Età dell'usufruttuario", default: "", mostraSe: (f) => f.tipo_calcolo === "vitalizio" },
      { tipo: "numero", key: "durata", label: "Durata (anni)", default: "", mostraSe: (f) => f.tipo_calcolo === "termine" },
    ],
    endpoint: "/calc/usufrutto",
    buildBody: (f) => ({
      valore_piena_proprieta: parseNumeroIt(f.valore_piena_proprieta), tipo_calcolo: f.tipo_calcolo,
      eta: f.tipo_calcolo === "vitalizio" ? parseNumeroIt(f.eta) : null, durata: f.tipo_calcolo === "termine" ? parseNumeroIt(f.durata) : null,
    }),
    risultato: (r) => [
      ["Valore usufrutto", formatEuro(r.valore_usufrutto)],
      ["Valore nuda proprietà", formatEuro(r.valore_nuda_proprieta)],
    ],
  },
  "valore-catastale": {
    campi: [
      { tipo: "scelta", key: "categoria_catastale", label: "Categoria catastale", default: "A/2", cercabile: true, opzioni: [
        "A/1", "A/2", "A/3", "A/4", "A/5", "A/6", "A/7", "A/8", "A/9", "A/11",
        "B/1", "B/2", "B/3", "B/4", "B/5", "B/6", "B/7", "B/8",
        "C/1", "C/2", "C/3", "C/4", "C/5", "C/6", "C/7",
        "D/1", "D/2", "D/3", "D/4", "D/5", "D/6", "D/7", "D/8", "D/9", "D/10",
        "E/1", "E/2", "E/3", "E/4", "E/5", "E/6", "E/7", "E/8", "E/9",
        "T",
      ].map((v) => ({ value: v, label: v === "T" ? "Terreni" : v })) },
      { tipo: "numero", key: "rendita_catastale", label: "Rendita catastale (o reddito dominicale per i terreni) €", default: "" },
      { tipo: "bool", key: "abitazione_principale", label: "Abitazione principale (non di lusso)", default: false },
    ],
    endpoint: "/calc/valore-catastale",
    buildBody: (f) => ({ categoria_catastale: f.categoria_catastale, rendita_catastale: parseNumeroIt(f.rendita_catastale), abitazione_principale: f.abitazione_principale }),
    risultato: (r) => [
      ["Rendita rivalutata", formatEuro(r.rendita_rivalutata)],
      ["Moltiplicatore catastale", String(r.moltiplicatore_catastale)],
      ["Valore catastale", formatEuro(r.valore_catastale)],
    ],
  },
  "imposte-compravendita-immobiliare": {
    campi: [
      { tipo: "scelta", key: "tipo_immobile", label: "Tipo di immobile", default: "prima_casa", opzioni: [
        { value: "prima_casa", label: "Prima casa" }, { value: "abitazione_secondaria", label: "Abitazione secondaria" }, { value: "lusso", label: "Immobile di lusso" },
      ] },
      { tipo: "scelta", key: "venditore", label: "Venditore", default: "privato", opzioni: [
        { value: "privato", label: "Privato" }, { value: "costruttrice_entro_5_anni", label: "Impresa costruttrice, entro 5 anni dal fine lavori" },
        { value: "costruttrice_oltre_5_anni", label: "Impresa costruttrice, oltre 5 anni dal fine lavori" }, { value: "non_costruttrice", label: "Impresa non costruttrice" },
      ] },
      { tipo: "numero", key: "valore", label: "Prezzo (o valore catastale) €", default: "" },
    ],
    endpoint: "/calc/imposte-compravendita-immobiliare",
    buildBody: (f) => ({ tipo_immobile: f.tipo_immobile, venditore: f.venditore, valore: parseNumeroIt(f.valore) }),
    risultato: (r) => [
      ...(r.iva > 0 ? ([["IVA", formatEuro(r.iva)]] as [string, string][]) : []),
      ["Imposta di registro", formatEuro(r.imposta_registro)],
      ["Imposta ipotecaria", formatEuro(r.imposta_ipotecaria)],
      ["Imposta catastale", formatEuro(r.imposta_catastale)],
      ...(r.imposta_bollo > 0 ? ([["Imposta di bollo", formatEuro(r.imposta_bollo)]] as [string, string][]) : []),
      ...(r.diritti_trascrizione > 0 ? ([["Diritti di trascrizione", formatEuro(r.diritti_trascrizione)]] as [string, string][]) : []),
      ["Totale", formatEuro(r.totale)],
    ],
  },
  "tassa-registro-locazione": {
    campi: [
      { tipo: "scelta", key: "tipo_immobile", label: "Tipo di immobile", default: "abitativo", opzioni: [
        { value: "abitativo", label: "Abitativo" }, { value: "strumentale", label: "Strumentale" }, { value: "fondo_rustico", label: "Fondo rustico" }, { value: "altro", label: "Altro" },
      ] },
      { tipo: "numero", key: "durata_anni", label: "Durata del contratto (anni)", default: "" },
      { tipo: "scelta", key: "tipo_canone", label: "L'importo del canone è riferito a", default: "annuale", opzioni: [
        { value: "annuale", label: "Un intero anno" }, { value: "mensile", label: "Un solo mese" }, { value: "intera_durata", label: "Tutta la durata del contratto" },
      ] },
      { tipo: "numero", key: "canone", label: "Importo del canone €", default: "" },
      { tipo: "bool", key: "canone_concordato", label: "Canone concordato (-30%)", default: false, mostraSe: (f) => f.tipo_immobile === "abitativo" },
      { tipo: "bool", key: "soggetto_iva", label: "Locatore soggetto IVA", default: false, mostraSe: (f) => f.tipo_immobile === "strumentale" },
      { tipo: "scelta", key: "pagamento", label: "Modalità di pagamento", default: "rateale", opzioni: [
        { value: "rateale", label: "Rateale (anno per anno)" }, { value: "unica_soluzione", label: "Unica soluzione (per l'intera durata)" },
      ] },
    ],
    endpoint: "/calc/tassa-registro-locazione",
    buildBody: (f) => {
      const durataAnni = parseNumeroIt(f.durata_anni);
      const canone = parseNumeroIt(f.canone);
      const canoneAnnuo = f.tipo_canone === "mensile" ? canone * 12 : f.tipo_canone === "intera_durata" ? canone / (durataAnni || 1) : canone;
      return {
        tipo_immobile: f.tipo_immobile, durata_anni: durataAnni, canone_annuo: canoneAnnuo,
        canone_concordato: f.tipo_immobile === "abitativo" ? f.canone_concordato : false,
        soggetto_iva: f.tipo_immobile === "strumentale" ? f.soggetto_iva : false, pagamento: f.pagamento,
      };
    },
    risultato: (r) => r.pagamento === "unica_soluzione" ? [
      ["Imposta calcolata", formatEuro(r.imposta_calcolata)],
      ["Sconto", formatEuro(r.sconto)],
      ["Imposta da versare", formatEuro(r.imposta_da_versare)],
    ] : [
      ["Prima rata", formatEuro(r.prima_rata)],
      ["Rata successiva (annuale)", formatEuro(r.rata_successiva)],
      ["Imposta complessiva", formatEuro(r.imposta_complessiva)],
    ],
  },
  "danno-biologico-lieve-entita": {
    campi: [
      { tipo: "numero", key: "punti", label: "Punti di invalidità (0-9, anche con decimali 0,25/0,5/0,75)", default: "" },
      { tipo: "numero", key: "eta", label: "Età del danneggiato", default: "" },
      { tipo: "numero", key: "giorni_invalidita_totale", label: "Giorni di invalidità assoluta (ITT)", default: "0" },
      { tipo: "numero", key: "pct_danno_morale", label: "Personalizzazione per danno morale (%)", default: "0" },
      { tipo: "scelta", key: "danno_morale_su_temporanea", label: "Calcolo del danno morale", default: "si", opzioni: [
        { value: "si", label: "Su invalidità permanente e temporanea" }, { value: "no", label: "Solo su invalidità permanente" },
      ] },
      { tipo: "numero", key: "spese_mediche", label: "Spese mediche €", default: "0" },
      { tipo: "numero", key: "altre_spese", label: "Altre spese €", default: "0" },
      {
        tipo: "lista", key: "giorni_invalidita_parziale", label: "Periodi di invalidità parziale (ITP)", etichettaAggiungi: "Aggiungi un periodo",
        campiRiga: [
          { tipo: "numero", key: "giorni", label: "Giorni" },
          { tipo: "numero", key: "pct_inabilita", label: "Percentuale di inabilità %" },
        ],
      },
    ],
    endpoint: "/calc/danno-biologico-lieve-entita",
    buildBody: (f) => ({
      punti: parseNumeroIt(f.punti), eta: parseNumeroIt(f.eta), giorni_invalidita_totale: parseNumeroIt(f.giorni_invalidita_totale),
      giorni_invalidita_parziale: (f.giorni_invalidita_parziale || []).map((v: Record<string, string>) => ({
        giorni: parseNumeroIt(v.giorni), pct_inabilita: parseNumeroIt(v.pct_inabilita),
      })),
      pct_danno_morale: parseNumeroIt(f.pct_danno_morale), danno_morale_su_temporanea: f.danno_morale_su_temporanea !== "no",
      spese_mediche: parseNumeroIt(f.spese_mediche), altre_spese: parseNumeroIt(f.altre_spese),
    }),
    risultato: (r) => [
      ["Danno biologico permanente", formatEuro(r.danno_biologico_permanente)],
      ["Danno biologico temporaneo", formatEuro(r.danno_biologico_temporaneo)],
      ...(r.danno_morale > 0 ? ([["Danno morale", formatEuro(r.danno_morale)]] as [string, string][]) : []),
      ["Totale", formatEuro(r.totale)],
    ],
  },
  "danno-biologico-macropermanenti": {
    campi: [
      { tipo: "numero", key: "punti", label: "Punti di invalidità permanente (10-100)", default: "" },
      { tipo: "numero", key: "eta", label: "Età al momento del sinistro", default: "" },
      { tipo: "bool", key: "applica_personalizzazione_morale", label: "Applica la personalizzazione di fascia per danno morale", default: true },
      { tipo: "numero", key: "pct_morale", label: "Percentuale personalizzazione danno morale % (facoltativo: lascia vuoto per il valore medio di fascia)", default: "", mostraSe: (f) => !!f.applica_personalizzazione_morale },
      { tipo: "numero", key: "giorni_invalidita_totale", label: "Giorni di invalidità assoluta (ITT)", default: "0" },
      { tipo: "numero", key: "pct_personalizzazione_itt", label: "Personalizzazione ITT (30-60%)", default: "45" },
      { tipo: "numero", key: "pct_personalizzazione_ulteriore", label: "Personalizzazione ulteriore (fino al 30%, art. 138 c.3)", default: "0" },
      { tipo: "scelta", key: "applica_ulteriore_su", label: "Applica la personalizzazione ulteriore a", default: "permanente_itt",
        mostraSe: (f) => !!parseNumeroIt(f.pct_personalizzazione_ulteriore),
        opzioni: [
          { value: "permanente_itt", label: "Danno permanente + I.T.T." }, { value: "solo_permanente", label: "Solo danno permanente" },
        ] },
      { tipo: "numero", key: "spese_mediche", label: "Spese mediche €", default: "0" },
      { tipo: "numero", key: "altre_spese", label: "Altre spese €", default: "0" },
      {
        tipo: "lista", key: "giorni_invalidita_parziale", label: "Periodi di invalidità parziale (ITP)", etichettaAggiungi: "Aggiungi un periodo",
        campiRiga: [
          { tipo: "numero", key: "giorni", label: "Giorni" },
          { tipo: "numero", key: "pct_inabilita", label: "Percentuale di inabilità %" },
        ],
      },
    ],
    endpoint: "/calc/danno-biologico-macropermanenti",
    buildBody: (f) => ({
      punti: parseNumeroIt(f.punti), eta: parseNumeroIt(f.eta),
      applica_personalizzazione_morale: !!f.applica_personalizzazione_morale,
      pct_morale: (f.applica_personalizzazione_morale && f.pct_morale) ? parseNumeroIt(f.pct_morale) : null,
      giorni_invalidita_totale: parseNumeroIt(f.giorni_invalidita_totale),
      giorni_invalidita_parziale: (f.giorni_invalidita_parziale || []).map((v: Record<string, string>) => ({
        giorni: parseNumeroIt(v.giorni), pct_inabilita: parseNumeroIt(v.pct_inabilita),
      })),
      pct_personalizzazione_itt: parseNumeroIt(f.pct_personalizzazione_itt), pct_personalizzazione_ulteriore: parseNumeroIt(f.pct_personalizzazione_ulteriore),
      applica_ulteriore_su: f.applica_ulteriore_su || "permanente_itt",
      spese_mediche: parseNumeroIt(f.spese_mediche), altre_spese: parseNumeroIt(f.altre_spese),
    }),
    risultato: (r) => [
      ["Danno permanente complessivo", formatEuro(r.danno_permanente_complessivo)],
      ["Danno temporaneo totale", formatEuro(r.danno_temporaneo_totale)],
      ["Totale danno non patrimoniale", formatEuro(r.totale_danno_non_patrimoniale)],
      ["Totale generale", formatEuro(r.totale_generale)],
    ],
  },
  "menomazioni-plurime": {
    campi: [
      { tipo: "scelta", key: "metodo", label: "Metodo", default: "balthazard", opzioni: [
        { value: "balthazard", label: "Balthazard (menomazioni coesistenti)" }, { value: "salomonica", label: "Salomonica (menomazioni concorrenti)" },
      ] },
      {
        tipo: "lista", key: "percentuali", label: "Percentuali di invalidità delle singole menomazioni", etichettaAggiungi: "Aggiungi una menomazione",
        campiRiga: [{ tipo: "numero", key: "valore", label: "Percentuale invalidità %" }],
      },
      { tipo: "scelta", key: "decimali", label: "Decimali per l'arrotondamento", default: "0", opzioni: [
        { value: "0", label: "0" }, { value: "1", label: "1" }, { value: "2", label: "2" },
      ] },
    ],
    endpoint: "/calc/menomazioni-plurime",
    validate: (f) => ((f.percentuali || []).filter((r: Record<string, string>) => r.valore).length < 2) ? "Inserire almeno due percentuali di invalidità" : null,
    buildBody: (f) => ({
      percentuali: (f.percentuali || []).map((r: Record<string, string>) => parseNumeroIt(r.valore)).filter((v: number) => !isNaN(v)),
      metodo: f.metodo, decimali: parseNumeroIt(f.decimali),
    }),
    risultato: (r) => [["Invalidità totale", `${r.invalidita_totale_pct}%`]],
  },
  "danno-perdita-parentale-milano": {
    campi: [
      { tipo: "scelta", key: "parentela", label: "Grado di parentela", default: "coniuge", opzioni: [
        { value: "genitore", label: "Genitore" }, { value: "figlio", label: "Figlio" }, { value: "coniuge", label: "Coniuge" },
        { value: "unione_civile", label: "Parte dell'unione civile" }, { value: "convivente_fatto", label: "Convivente di fatto" },
        { value: "fratello", label: "Fratello" }, { value: "nonno", label: "Nonno" }, { value: "nipote", label: "Nipote" }, { value: "zio", label: "Zio" },
      ] },
      { tipo: "numero", key: "eta_congiunto", label: "Età del congiunto superstite", default: "" },
      { tipo: "numero", key: "eta_vittima", label: "Età della vittima al momento del decesso", default: "" },
      { tipo: "bool", key: "convivenza", label: "Convivenza tra congiunto e vittima", default: false },
      { tipo: "scelta", key: "durata_convivenza", label: "Durata della convivenza", default: "meno_30",
        mostraSe: (f) => !!f.convivenza && ["fratello", "nonno", "nipote", "zio"].includes(f.parentela),
        opzioni: [
          { value: "meno_30", label: "Meno di 30 anni" }, { value: "oltre_30", label: "Oltre 30 anni" }, { value: "oltre_40", label: "Oltre 40 anni" },
        ] },
      { tipo: "bool", key: "stesso_condominio", label: "Stesso condominio (se non convivenza)", default: false, mostraSe: (f) => !f.convivenza },
      { tipo: "scelta", key: "altri_familiari", label: "Numero di altri familiari nel nucleo primario", default: "0", opzioni: [
        { value: "0", label: "Nessuno" }, { value: "1", label: "1" }, { value: "2", label: "2" }, { value: "3", label: "3" }, { value: "99", label: "Oltre 3" },
      ] },
      { tipo: "numero", key: "relazione", label: "Qualità/intensità della relazione affettiva (0-30)", default: "15" },
    ],
    endpoint: "/calc/danno-perdita-parentale-milano",
    buildBody: (f) => ({
      parentela: f.parentela, eta_congiunto: parseNumeroIt(f.eta_congiunto), eta_vittima: parseNumeroIt(f.eta_vittima),
      convivenza: f.convivenza, durata_convivenza: f.durata_convivenza, stesso_condominio: f.stesso_condominio,
      altri_familiari: parseNumeroIt(f.altri_familiari), relazione: parseNumeroIt(f.relazione),
    }),
    risultato: (r) => [
      ["Punti totali", String(r.punti_totali)],
      ["Importo", formatEuro(r.importo)],
      ["Range (relazione min-max)", `${formatEuro(r.importo_minimo)} - ${formatEuro(r.importo_massimo)}`],
    ],
  },
  "danno-perdita-parentale-roma": {
    campi: [
      { tipo: "scelta", key: "parentela", label: "Grado di parentela", default: "coniuge", opzioni: [
        { value: "genitore", label: "Genitore" }, { value: "figlio", label: "Figlio" }, { value: "avo", label: "Avo" },
        { value: "fratello", label: "Fratello" }, { value: "zio", label: "Zio" }, { value: "nipote", label: "Nipote" },
        { value: "cugino", label: "Cugino" }, { value: "coniuge", label: "Coniuge" }, { value: "convivente", label: "Convivente" },
      ] },
      { tipo: "numero", key: "eta_congiunto", label: "Età del congiunto superstite", default: "" },
      { tipo: "numero", key: "eta_vittima", label: "Età della vittima al momento del decesso", default: "" },
      { tipo: "bool", key: "convivenza", label: "Convivenza con la vittima", default: false },
      { tipo: "bool", key: "altri_conviventi", label: "Presenza di altri familiari conviventi del congiunto", default: false },
      { tipo: "bool", key: "altri_familiari", label: "Presenza di altri familiari non conviventi entro il 2° grado", default: false },
    ],
    endpoint: "/calc/danno-perdita-parentale-roma",
    buildBody: (f) => ({
      parentela: f.parentela, eta_congiunto: parseNumeroIt(f.eta_congiunto), eta_vittima: parseNumeroIt(f.eta_vittima),
      convivenza: f.convivenza, altri_conviventi: f.altri_conviventi, altri_familiari: f.altri_familiari,
    }),
    risultato: (r) => [
      ["Punti totali", String(r.punti_totali)],
      ["Importo", formatEuro(r.importo)],
      ...(r.nota_aumento_assenza_altri_familiari ? ([["Possibile aumento (assenza altri familiari)", `fino a ${formatEuro(r.nota_aumento_assenza_altri_familiari.importo_massimo)}`]] as [string, string][]) : []),
      ...(r.nota_riduzione_non_convivenza ? ([["Possibile riduzione (non convivenza)", `fino a ${formatEuro(r.nota_riduzione_non_convivenza.importo_minimo)}`]] as [string, string][]) : []),
    ],
  },
  "risarcimento-inail": {
    campi: [
      { tipo: "numero", key: "punti", label: "Invalidità riconosciuta (6-100%)", default: "" },
      { tipo: "numero", key: "eta", label: "Età del lavoratore", default: "", mostraSe: (f) => parseNumeroIt(f.punti) > 0 && parseNumeroIt(f.punti) <= 15 },
      { tipo: "scelta", key: "inquadramento", label: "Inquadramento", default: "10", mostraSe: (f) => parseNumeroIt(f.punti) >= 16, opzioni: [
        { value: "10", label: "Industria: tutti i lavoratori" }, { value: "20", label: "Agricoltura: a tempo indeterminato" },
        { value: "30", label: "Agricoltura: a tempo determinato" }, { value: "40", label: "Agricoltura: lavoratore autonomo" },
        { value: "50", label: "Sanità: medico radiologo" }, { value: "60", label: "Sanità: tecnico di radiologia autonomo" },
      ] },
      { tipo: "numero", key: "retribuzione", label: "Retribuzione annua di riferimento €", default: "", mostraSe: (f) => parseNumeroIt(f.punti) >= 16 && (f.inquadramento === "10" || f.inquadramento === "20") },
      { tipo: "numero", key: "quote_integrative", label: "Numero di familiari per quote integrative", default: "0", mostraSe: (f) => parseNumeroIt(f.punti) >= 16 },
    ],
    endpoint: "/calc/risarcimento-inail",
    buildBody: (f) => {
      const punti = parseNumeroIt(f.punti);
      return punti <= 15
        ? { punti, eta: parseNumeroIt(f.eta) }
        : { punti, inquadramento: f.inquadramento, retribuzione: f.retribuzione ? parseNumeroIt(f.retribuzione) : null, quote_integrative: parseNumeroIt(f.quote_integrative) };
    },
    risultato: (r) => r.tipo === "capitale" ? [
      ["Risarcimento in capitale", formatEuro(r.risarcimento_capitale)],
    ] : [
      ["Rendita per danno biologico (annua)", formatEuro(r.rendita_biologico)],
      ...(r.rendita_annua != null ? ([
        ["Rendita vitalizia annua", formatEuro(r.rendita_annua)],
        ["Rendita vitalizia mensile", formatEuro(r.rendita_mensile)],
      ] as [string, string][]) : []),
    ],
  },
  "devalutazione": {
    campi: [
      { tipo: "numero", key: "capitale", label: "Importo da devalutare €", default: "" },
      { tipo: "mese_anno", key: "dal", label: "Dal (più recente)" },
      { tipo: "mese_anno", key: "al", label: "Al (più remoto)" },
    ],
    endpoint: "/calc/devalutazione",
    buildBody: (f) => {
      const dal = meseAnnoNum(f.dal); const al = meseAnnoNum(f.al);
      return { capitale: parseNumeroIt(f.capitale), mese_dal: dal.mese, anno_dal: dal.anno, mese_al: al.mese, anno_al: al.anno };
    },
    risultato: (r) => [
      ["Indice di devalutazione", String(r.indice_devalutazione)],
      ["Totale devalutazione", formatEuro(r.totale_devalutazione)],
      ["Importo devalutato", formatEuro(r.importo_devalutato)],
    ],
  },
  "inflazione": {
    campi: [
      { tipo: "numero", key: "capitale", label: "Somma di denaro €", default: "" },
      { tipo: "bool", key: "usa_indici_istat", label: "Usa gli indici Istat", default: true },
      { tipo: "mese_anno", key: "dal", label: "Dal", mostraSe: (f) => !!f.usa_indici_istat },
      { tipo: "mese_anno", key: "al", label: "Al", mostraSe: (f) => !!f.usa_indici_istat },
      { tipo: "numero", key: "inflazione_pct_manuale", label: "Tasso di inflazione da usare (%)", default: "", mostraSe: (f) => !f.usa_indici_istat },
    ],
    endpoint: "/calc/inflazione",
    buildBody: (f) => {
      const dal = meseAnnoNum(f.dal); const al = meseAnnoNum(f.al);
      return {
        capitale: parseNumeroIt(f.capitale), usa_indici_istat: f.usa_indici_istat,
        mese_dal: dal.mese || 1, anno_dal: dal.anno || new Date().getFullYear(),
        mese_al: al.mese || 1, anno_al: al.anno || new Date().getFullYear(),
        inflazione_pct_manuale: f.usa_indici_istat ? null : parseNumeroIt(f.inflazione_pct_manuale),
      };
    },
    risultato: (r) => [
      ["Inflazione", `${r.inflazione_pct}%`],
      ["Somma equivalente", formatEuro(r.somma_equivalente)],
      ["Perdita di potere di acquisto", formatEuro(r.perdita_potere_acquisto)],
    ],
  },
  "rivalutazione-storica": {
    campi: [
      { tipo: "numero", key: "capitale", label: "Capitale", default: "" },
      { tipo: "scelta", key: "valuta", label: "Valuta", default: "euro", opzioni: [
        { value: "euro", label: "Euro" }, { value: "lire", label: "Lire" },
      ] },
      { tipo: "numero", key: "anno_iniziale", label: "Anno iniziale (min 1861)", default: "" },
      { tipo: "numero", key: "anno_finale", label: "Anno finale", default: "" },
    ],
    endpoint: "/calc/rivalutazione-storica",
    buildBody: (f) => ({ capitale: parseNumeroIt(f.capitale), valuta: f.valuta, anno_iniziale: parseNumeroIt(f.anno_iniziale), anno_finale: parseNumeroIt(f.anno_finale) }),
    risultato: (r) => [
      ["Coefficiente", String(r.coefficiente)],
      ["Capitale rivalutato", r.valuta === "lire" ? `Lire ${Number(r.capitale_rivalutato).toLocaleString("it-IT")}` : formatEuro(r.capitale_rivalutato)],
      ...(r.valuta === "lire" ? ([["Equivalente in Euro", formatEuro(r.euro_rivalutato)]] as [string, string][]) : []),
    ],
  },
  "rivalutazione-annuale-media": {
    campi: [
      { tipo: "numero", key: "capitale", label: "Capitale €", default: "" },
      { tipo: "numero", key: "anno_iniziale", label: "Anno iniziale (dal 1947)", default: "" },
      { tipo: "numero", key: "anno_finale", label: "Anno finale (massimo 20 anni dopo)", default: "" },
    ],
    endpoint: "/calc/rivalutazione-annuale-media",
    buildBody: (f) => ({ capitale: parseNumeroIt(f.capitale), anno_iniziale: parseNumeroIt(f.anno_iniziale), anno_finale: parseNumeroIt(f.anno_finale) }),
    risultato: (r) => [
      ["Capitale rivalutato", formatEuro(r.capitale_rivalutato)],
      ["Rivalutazione totale", formatEuro(r.rivalutazione_totale)],
    ],
  },
  "coefficiente-rivalutazione-tfr": {
    campi: [
      { tipo: "mese_anno", key: "mese_anno", label: "Mese e anno (dal 1982)" },
    ],
    endpoint: "/calc/coefficiente-rivalutazione-tfr",
    buildBody: (f) => meseAnnoNum(f.mese_anno),
    risultato: (r) => [
      ["Coefficiente di rivalutazione TFR", `${r.coefficiente_pct}%`],
      [`Indice FOI a dicembre ${r.anno - 1}`, String(r.indice_dicembre_precedente)],
      [`Indice FOI a ${MESI_IT_TFR[r.mese - 1]} ${r.anno}`, String(r.indice_mese)],
      ["Variazione dell'indice al 100%", `${r.variazione_pct_100}%`],
      ["Tasso fisso annuo", `${r.tasso_fisso_annuo_pct}%`],
      ["Mesi utili", String(r.mese)],
      ["Quota fissa (tasso rapportato ai mesi)", `${r.quota_fissa_pct}%`],
      ["Quota variabile (75% della variazione)", `${r.quota_variabile_pct}%`],
    ],
  },
  "ammortamento-mutuo": {
    campi: [
      { tipo: "scelta", key: "metodo", label: "Metodo di calcolo", default: "francese", opzioni: [
        { value: "francese", label: "Rata Costante (metodo francese)" }, { value: "italiano", label: "Capitale Costante (metodo italiano)" },
      ] },
      { tipo: "numero", key: "capitale", label: "Capitale finanziato €", default: "" },
      { tipo: "numero", key: "tasso_annuo_pct", label: "Tasso annuale %", default: "" },
      { tipo: "scelta", key: "periodicita", label: "Periodicità rate", default: "12", opzioni: [
        { value: "12", label: "Mensile = 12 rate all'anno" }, { value: "6", label: "Bimestrale = 6 rate all'anno" },
        { value: "4", label: "Trimestrale = 4 rate all'anno" }, { value: "3", label: "Quadrimestrale = 3 rate all'anno" },
        { value: "2", label: "Semestrale = 2 rate all'anno" }, { value: "1", label: "Annuale = 1 rata" },
      ] },
      { tipo: "numero", key: "durata_anni", label: "Durata in anni", default: "" },
    ],
    endpoint: "/calc/ammortamento-mutuo",
    buildBody: (f) => ({
      metodo: f.metodo, capitale: parseNumeroIt(f.capitale), tasso_annuo_pct: parseNumeroIt(f.tasso_annuo_pct),
      periodicita: parseNumeroIt(f.periodicita), numero_rate: Math.round(parseNumeroIt(f.periodicita) * parseNumeroIt(f.durata_anni)),
      dettaglio_rate: false,
    }),
    risultato: (r) => [
      ...(r.metodo === "francese" ? ([["Importo rata", formatEuro(r.importo_rata)]] as [string, string][]) : ([
        ["Prima rata", formatEuro(r.prima_rata)],
        ["Ultima rata", formatEuro(r.ultima_rata)],
      ] as [string, string][])),
      ["Totale interessi", formatEuro(r.totale_interessi)],
      ["Totale da restituire", formatEuro(r.totale_versato)],
      ["Incidenza interessi sul capitale", `${r.incidenza_interessi_pct}%`],
    ],
  },
  "surroga-mutuo": {
    campi: [
      { tipo: "numero", key: "capitale", label: "Capitale del mutuo originario €", default: "" },
      { tipo: "numero", key: "tasso_annuo_pct", label: "Tasso annuale originario %", default: "" },
      { tipo: "numero", key: "durata_anni_originale", label: "Durata originaria (anni)", default: "" },
      { tipo: "mese_anno", key: "data_inizio_mutuo", label: "Dal mese di (inizio mutuo originario)" },
      { tipo: "mese_anno", key: "data_surroga", label: "Dal mese di (surroga)" },
      { tipo: "numero", key: "nuovo_tasso_annuo_pct", label: "Nuovo tasso annuale (surroga) %", default: "" },
      { tipo: "scelta", key: "tipo_durata_surroga", label: "Durata della surroga", default: "residua", opzioni: [
        { value: "residua", label: "Mantieni la durata residua" }, { value: "personalizzata", label: "Scegli una nuova durata" },
      ] },
      { tipo: "numero", key: "nuova_durata_anni", label: "Nuova durata (anni)", default: "", mostraSe: (f) => f.tipo_durata_surroga === "personalizzata" },
    ],
    endpoint: "/calc/surroga-mutuo",
    buildBody: (f) => {
      const inizio = meseAnnoNum(f.data_inizio_mutuo), surroga = meseAnnoNum(f.data_surroga);
      const mesiTrascorsi = (surroga.anno - inizio.anno) * 12 + (surroga.mese - inizio.mese);
      return {
        capitale: parseNumeroIt(f.capitale), tasso_annuo_pct: parseNumeroIt(f.tasso_annuo_pct),
        durata_anni_originale: parseNumeroIt(f.durata_anni_originale), mesi_trascorsi: mesiTrascorsi,
        nuovo_tasso_annuo_pct: parseNumeroIt(f.nuovo_tasso_annuo_pct),
        nuova_durata_anni: f.tipo_durata_surroga === "personalizzata" ? parseNumeroIt(f.nuova_durata_anni) : null,
      };
    },
    risultato: (r) => [
      ["Rata originaria", formatEuro(r.rata_originale)],
      ["Capitale residuo", formatEuro(r.capitale_residuo)],
      ["Nuova rata", formatEuro(r.nuova_rata)],
      ["Differenza di rata", formatEuro(r.differenza_rata)],
      ["Interessi già versati sul mutuo originario", formatEuro(r.interessi_versati)],
      ["Interessi residui del mutuo originario", formatEuro(r.interessi_residui_originari)],
      ["Interessi del nuovo mutuo (surroga)", formatEuro(r.interessi_nuovo_mutuo)],
      ["Risparmio complessivo di interessi", formatEuro(r.risparmio_interessi)],
      ["Valutazione", r.conveniente ? "Operazione conveniente" : "Operazione non conveniente con questi parametri"],
    ],
  },
  "taeg": {
    campi: [
      { tipo: "numero", key: "capitale", label: "Capitale finanziato €", default: "" },
      { tipo: "numero", key: "tasso_annuo_nominale_pct", label: "Tasso annuale nominale (TAN) %", default: "" },
      { tipo: "scelta", key: "periodicita", label: "Periodicità rate", default: "12", opzioni: [
        { value: "12", label: "Mensile = 12 rate all'anno" }, { value: "6", label: "Bimestrale = 6 rate all'anno" },
        { value: "4", label: "Trimestrale = 4 rate all'anno" }, { value: "3", label: "Quadrimestrale = 3 rate all'anno" },
        { value: "2", label: "Semestrale = 2 rate all'anno" }, { value: "1", label: "Annuale = 1 rata" },
      ] },
      { tipo: "numero", key: "durata_anni", label: "Durata in anni", default: "" },
      { tipo: "titolo", key: "tit_spese_iniziali", label: "Spese iniziali (una tantum):" },
      { tipo: "numero", key: "spese_istruttoria", label: "Spese di istruttoria €", default: "0" },
      { tipo: "numero", key: "costo_mediazione", label: "Costo di mediazione €", default: "0" },
      { tipo: "numero", key: "spese_notarili", label: "Spese notarili €", default: "0" },
      { tipo: "numero", key: "spese_iniziali_altre", label: "Altre spese iniziali €", default: "0" },
      { tipo: "titolo", key: "tit_spese_ricorrenti", label: "Spese ricorrenti:" },
      { tipo: "numero", key: "spese_incasso_rata", label: "Spese di incasso rata €", default: "0" },
      { tipo: "numero", key: "spese_assicurazione", label: "Spese assicurative per rata €", default: "0" },
      { tipo: "numero", key: "spese_gestione_annuale", label: "Spese di gestione annuali €", default: "0" },
    ],
    endpoint: "/calc/taeg",
    buildBody: (f) => ({
      capitale: parseNumeroIt(f.capitale), tasso_annuo_nominale_pct: parseNumeroIt(f.tasso_annuo_nominale_pct),
      periodicita: parseNumeroIt(f.periodicita), numero_rate: Math.round(parseNumeroIt(f.periodicita) * parseNumeroIt(f.durata_anni)),
      spese_istruttoria: parseNumeroIt(f.spese_istruttoria), costo_mediazione: parseNumeroIt(f.costo_mediazione),
      spese_notarili: parseNumeroIt(f.spese_notarili), spese_iniziali_altre: parseNumeroIt(f.spese_iniziali_altre),
      spese_incasso_rata: parseNumeroIt(f.spese_incasso_rata), spese_assicurazione: parseNumeroIt(f.spese_assicurazione),
      spese_gestione_annuale: parseNumeroIt(f.spese_gestione_annuale),
    }),
    risultato: (r) => [
      ["Importo rata", formatEuro(r.importo_rata)],
      ["TAEG", `${r.taeg_pct}%`],
      ["Interessi totali al TAN", formatEuro(r.interessi_totali_tan)],
      ["Spese iniziali complessive", formatEuro(r.spese_iniziali_complessive)],
      ["Totale da restituire (senza spese)", formatEuro(r.importo_totale_da_restituire)],
    ],
  },
  "compenso-ore": {
    campi: [
      { tipo: "titolo", key: "tit_1", label: "Voce 1" },
      { tipo: "numero", key: "ore_1", label: "Ore", default: "0" },
      { tipo: "numero", key: "minuti_1", label: "Minuti", default: "0" },
      { tipo: "scelta", key: "segno_1", label: "Segno", default: "+", opzioni: [{ value: "+", label: "+ (aggiungi)" }, { value: "-", label: "- (sottrai)" }] },
      { tipo: "titolo", key: "tit_2", label: "Voce 2 (opzionale)" },
      { tipo: "numero", key: "ore_2", label: "Ore", default: "0" },
      { tipo: "numero", key: "minuti_2", label: "Minuti", default: "0" },
      { tipo: "scelta", key: "segno_2", label: "Segno", default: "+", opzioni: [{ value: "+", label: "+ (aggiungi)" }, { value: "-", label: "- (sottrai)" }] },
      { tipo: "titolo", key: "tit_3", label: "Voce 3 (opzionale)" },
      { tipo: "numero", key: "ore_3", label: "Ore", default: "0" },
      { tipo: "numero", key: "minuti_3", label: "Minuti", default: "0" },
      { tipo: "scelta", key: "segno_3", label: "Segno", default: "+", opzioni: [{ value: "+", label: "+ (aggiungi)" }, { value: "-", label: "- (sottrai)" }] },
      { tipo: "titolo", key: "tit_4", label: "Voce 4 (opzionale)" },
      { tipo: "numero", key: "ore_4", label: "Ore", default: "0" },
      { tipo: "numero", key: "minuti_4", label: "Minuti", default: "0" },
      { tipo: "scelta", key: "segno_4", label: "Segno", default: "+", opzioni: [{ value: "+", label: "+ (aggiungi)" }, { value: "-", label: "- (sottrai)" }] },
      { tipo: "numero", key: "tariffa_oraria", label: "Tariffa oraria € (opzionale)", default: "" },
    ],
    endpoint: "/calc/compenso-ore",
    buildBody: (f) => ({
      voci: [1, 2, 3, 4].map((n) => ({
        ore: parseNumeroIt(f[`ore_${n}`]) || 0, minuti: parseNumeroIt(f[`minuti_${n}`]) || 0, segno: f[`segno_${n}`] || "+",
      })),
      tariffa_oraria: f.tariffa_oraria ? parseNumeroIt(f.tariffa_oraria) : null,
    }),
    risultato: (r) => [
      ["Tempo totale", r.tempo_totale],
      ...(r.importo != null ? ([["Importo", formatEuro(r.importo)]] as [string, string][]) : []),
    ],
  },
  "ritenuta-acconto": {
    campi: [
      { tipo: "scelta", key: "operazione", label: "Operazione", default: "lordo_a_netto", opzioni: [
        { value: "lordo_a_netto", label: "Dal Lordo al Netto" }, { value: "netto_a_lordo", label: "Dal Netto al Lordo" },
      ] },
      { tipo: "numero", key: "importo", label: "Importo €", default: "" },
      { tipo: "numero", key: "pct_ritenuta", label: "Ritenuta d'acconto %", default: "20" },
    ],
    endpoint: "/calc/ritenuta-acconto",
    buildBody: (f) => ({ operazione: f.operazione, importo: parseNumeroIt(f.importo), pct_ritenuta: parseNumeroIt(f.pct_ritenuta) }),
    risultato: (r) => [
      ["Importo lordo", formatEuro(r.importo_lordo)],
      ["Ritenuta d'acconto", formatEuro(r.ritenuta_acconto)],
      ["Importo netto", formatEuro(r.importo_netto)],
    ],
  },
  "scorporo-importi": {
    campi: [
      { tipo: "numero", key: "importo", label: "Importo forfettario da scorporare €", default: "" },
      { tipo: "numero", key: "spese_esenti", label: "Spese esenti € (art. 15, DPR 633/72)", default: "0" },
      { tipo: "numero", key: "spese_non_esenti", label: "Spese imponibili IVA €", default: "0" },
      { tipo: "bool", key: "applica_spese_generali", label: "Includi spese generali (art. 13 L. 247/2012)", default: true },
      { tipo: "numero", key: "pct_spese_generali", label: "Percentuale spese generali", default: "15", mostraSe: (f) => !!f.applica_spese_generali },
      { tipo: "numero", key: "pct_cassa", label: "Percentuale cassa previdenziale (4% ENPAP, altre casse diverse)", default: "4" },
      { tipo: "bool", key: "regime_semplificato", label: "Regime fiscale semplificato (no IVA)", default: false },
      { tipo: "numero", key: "pct_iva", label: "Percentuale IVA", default: "22", mostraSe: (f) => !f.regime_semplificato },
      { tipo: "bool", key: "applica_ritenuta", label: "Applica ritenuta d'acconto", default: true },
      { tipo: "numero", key: "pct_ritenuta", label: "Percentuale ritenuta d'acconto", default: "20", mostraSe: (f) => !!f.applica_ritenuta },
    ],
    endpoint: "/calc/scorporo-importi",
    buildBody: (f) => ({
      importo: parseNumeroIt(f.importo), spese_esenti: parseNumeroIt(f.spese_esenti), spese_non_esenti: parseNumeroIt(f.spese_non_esenti),
      applica_spese_generali: f.applica_spese_generali, pct_spese_generali: parseNumeroIt(f.pct_spese_generali),
      pct_cassa: parseNumeroIt(f.pct_cassa) || 4,
      regime_semplificato: f.regime_semplificato, pct_iva: f.regime_semplificato ? 22 : (parseNumeroIt(f.pct_iva) || 22),
      applica_ritenuta: f.applica_ritenuta, pct_ritenuta: parseNumeroIt(f.pct_ritenuta),
    }),
    risultato: (r) => [
      ["Compenso netto", formatEuro(r.compenso_netto)],
      ["Spese generali", formatEuro(r.spese_generali)],
      ["Cassa", formatEuro(r.cassa)],
      ["Totale imponibile", formatEuro(r.totale_imponibile)],
      ...(r.iva > 0 ? ([["IVA", formatEuro(r.iva)]] as [string, string][]) : []),
      ["Totale documento", formatEuro(r.totale_documento)],
      ...(r.ritenuta_acconto > 0 ? ([["Ritenuta d'acconto", formatEuro(r.ritenuta_acconto)]] as [string, string][]) : []),
      ["Netto a pagare", formatEuro(r.netto_a_pagare)],
    ],
  },
  "imu": {
    campi: [
      { tipo: "scelta", key: "categoria_catastale", label: "Categoria catastale", default: "A", cercabile: true, opzioni: [
        { value: "A", label: "Abitazioni da A/2 ad A/7 e relative pertinenze" },
        { value: "AL", label: "Abitazioni di pregio: A/1, A/8, A/9 e relative pertinenze" },
        { value: "A10", label: "A/10 (uffici e studi privati)" }, { value: "B", label: "Gruppo B (da B/1 a B/8)" },
        { value: "C1", label: "C/1 (negozi e botteghe)" }, { value: "C2", label: "C/2 (cantine, soffitte, magazzini, depositi)" },
        { value: "C3", label: "C/3 (laboratori per arti e mestieri)" }, { value: "C4", label: "C/4 (locali per esercizi sportivi senza fine di lucro)" },
        { value: "C5", label: "C/5 (stabilimenti balneari e termali senza fine di lucro)" },
        { value: "C6", label: "C/6 (garage, rimesse, stalle, scuderie senza fine di lucro)" }, { value: "C7", label: "C/7 (tettoie chiuse o aperte)" },
        { value: "D", label: "Gruppo D (da D/1 a D/12 escluse D/5 e D/10)" },
        { value: "D5", label: "D/5 (istituti di credito e assicurazioni con fine di lucro)" },
        { value: "R1", label: "Fabbricati rurali ad uso strumentale per l'agricoltura (D/10)" },
        { value: "R2", label: "Fabbricati rurali non strumentali" }, { value: "T1", label: "Terreni" },
        { value: "AF", label: "Aree fabbricabili" },
      ] },
      { tipo: "bool", key: "abitazione_principale", label: "Abitazione principale (prima casa)", default: false, mostraSe: (f) => f.categoria_catastale !== "AF" && f.categoria_catastale !== "T1" },
      { tipo: "numero", key: "rendita_catastale", label: "Valore venale di mercato €", default: "", mostraSe: (f) => f.categoria_catastale === "AF" },
      { tipo: "numero", key: "rendita_catastale", label: "Rendita catastale non rivalutata € (reddito dominicale per i terreni)", default: "", mostraSe: (f) => f.categoria_catastale !== "AF" },
      { tipo: "numero", key: "rendita_pertinenze", label: "Rendita catastale pertinenze € (opzionale)", default: "0", mostraSe: (f) => f.categoria_catastale !== "AF" && f.categoria_catastale !== "T1" },
      { tipo: "numero", key: "aliquota_per_mille", label: "Aliquota deliberata dal Comune (per mille)", default: "" },
      { tipo: "numero", key: "quota_possesso_pct", label: "Quota di possesso %", default: "100" },
      { tipo: "numero", key: "mesi_possesso", label: "Mesi di possesso nell'anno", default: "12" },
      { tipo: "bool", key: "immobile_in_comodato", label: "Immobile concesso in comodato a parenti di primo grado", default: false },
      { tipo: "numero", key: "mesi_comodato", label: "Mesi in comodato", default: "0", mostraSe: (f) => !!f.immobile_in_comodato },
      { tipo: "bool", key: "immobile_canone_concordato", label: "Immobile locato a canone concordato", default: false },
      { tipo: "numero", key: "mesi_canone_concordato", label: "Mesi a canone concordato", default: "0", mostraSe: (f) => !!f.immobile_canone_concordato },
      { tipo: "numero", key: "detrazione_prima_casa", label: "Detrazione prima casa € (solo A/1, A/8, A/9)", default: "200", mostraSe: (f) => !!f.abitazione_principale && f.categoria_catastale === "AL" },
      { tipo: "numero", key: "titolari_detrazione", label: "Numero di titolari con diritto alla detrazione", default: "1", mostraSe: (f) => !!f.abitazione_principale && f.categoria_catastale === "AL" },
    ],
    endpoint: "/calc/imu",
    buildBody: (f) => ({
      categoria_catastale: f.categoria_catastale, abitazione_principale: f.abitazione_principale,
      rendita_catastale: parseNumeroIt(f.rendita_catastale), rendita_pertinenze: parseNumeroIt(f.rendita_pertinenze),
      aliquota_per_mille: parseNumeroIt(f.aliquota_per_mille), quota_possesso_pct: parseNumeroIt(f.quota_possesso_pct) || 100,
      mesi_possesso: parseNumeroIt(f.mesi_possesso) ?? 12,
      immobile_in_comodato: f.immobile_in_comodato, mesi_comodato: f.immobile_in_comodato ? parseNumeroIt(f.mesi_comodato) : 0,
      immobile_canone_concordato: f.immobile_canone_concordato, mesi_canone_concordato: f.immobile_canone_concordato ? parseNumeroIt(f.mesi_canone_concordato) : 0,
      detrazione_prima_casa: parseNumeroIt(f.detrazione_prima_casa) || 200, titolari_detrazione: parseNumeroIt(f.titolari_detrazione) || 1,
    }),
    risultato: (r) => r.esente ? [["Esito", "Esente"], ["Motivo", r.motivo_esenzione]] : [
      ["Rendita rivalutata", formatEuro(r.rendita_rivalutata)],
      ["Imponibile", formatEuro(r.imponibile)],
      ...(r.detrazione > 0 ? ([["Detrazione", formatEuro(r.detrazione)]] as [string, string][]) : []),
      ["IMU dovuta", formatEuro(r.imu_dovuta)],
    ],
  },
  "fattura-avvocati": {
    campi: [
      { tipo: "numero", key: "onorari", label: "Onorari €", default: "" },
      { tipo: "numero", key: "spese_esenti", label: "Spese Esenti € (art. 15, DPR 633/72)", default: "" },
      { tipo: "numero", key: "spese_imponibili", label: "Spese Imponibili €", default: "" },
      { tipo: "bool", key: "applica_spese_generali", label: "Spese Generali (art. 13 L. 247/2012)", default: true },
      { tipo: "numero", key: "pct_spese_generali", label: "Spese Generali % (da 0 a 20)", default: "15", mostraSe: (f) => !!f.applica_spese_generali },
      { tipo: "bool", key: "applica_ritenuta", label: "Ritenuta d'Acconto", default: true },
      { tipo: "bool", key: "iva_per_cassa", label: "Iva per Cassa (art. 32 bis, D.L. 83/2012)", default: false, mostraSe: (f) => !f.split_payment && !f.regime_semplificato },
      { tipo: "bool", key: "split_payment", label: "Split Payment (art. 17-ter, DPR 633/72)", default: false, mostraSe: (f) => !f.iva_per_cassa && !f.regime_semplificato },
      { tipo: "bool", key: "regime_semplificato", label: "Regime Semplificato", default: false, mostraSe: (f) => !f.iva_per_cassa && !f.split_payment },
      { tipo: "scelta", key: "tipo_regime", label: "Tipo Regime", default: "1", opzioni: TIPI_REGIME_SEMPLIFICATO, mostraSe: (f) => !!f.regime_semplificato },
      { tipo: "bool", key: "addebito_bollo", label: "Addebito bollo (al cliente)", default: false, mostraSe: (f) => !!f.regime_semplificato },
      {
        tipo: "lista", key: "acconti", label: "Acconti ricevuti (già fatturati, accessori di legge inclusi; max 16)", etichettaAggiungi: "Aggiungi un acconto",
        campiRiga: [
          { tipo: "testo", key: "numero", label: "Numero (facoltativo)" },
          { tipo: "data", key: "data", label: "Data (facoltativa)", default: "" },
          { tipo: "numero", key: "importo", label: "Acconto ricevuto €" },
          { tipo: "numero", key: "spese_esenti", label: "(di cui spese esenti) €" },
          { tipo: "numero", key: "spese_imponibili", label: "(di cui spese imponibili) €" },
        ],
      },
    ],
    endpoint: "/calc/fattura-avvocati",
    validate: (f) => ((f.acconti || []).length > 16 ? "Il calcolatore prevede al massimo 16 acconti." : null),
    buildBody: (f) => ({
      onorari: parseNumeroIt(f.onorari), spese_esenti: parseNumeroIt(f.spese_esenti), spese_imponibili: parseNumeroIt(f.spese_imponibili),
      applica_spese_generali: !!f.applica_spese_generali, pct_spese_generali: f.applica_spese_generali ? parseNumeroIt(f.pct_spese_generali) : 15,
      applica_ritenuta: !!f.applica_ritenuta,
      iva_per_cassa: !!f.iva_per_cassa && !f.split_payment && !f.regime_semplificato,
      split_payment: !!f.split_payment && !f.iva_per_cassa && !f.regime_semplificato,
      regime_semplificato: !!f.regime_semplificato && !f.iva_per_cassa && !f.split_payment,
      tipo_regime: parseInt(f.tipo_regime, 10) || 1, addebito_bollo: !!f.regime_semplificato && !!f.addebito_bollo,
      acconti: (f.acconti || []).map((a: Record<string, string>) => ({
        numero: a.numero || null, data: a.data || null, importo: parseNumeroIt(a.importo),
        spese_esenti: parseNumeroIt(a.spese_esenti), spese_imponibili: parseNumeroIt(a.spese_imponibili),
      })),
    }),
    risultato: (r) => {
      const out: [string, string][] = [];
      const acc = r.acconti_onorari != null;
      const accLabel = r.numero_acconti > 1 ? "acconti" : "acconto";
      out.push([acc ? `Saldo onorari (${formatEuro(r.onorari)} - ${accLabel} ${formatEuro(r.acconti_onorari)})` : "Onorari", formatEuro(r.onorari_saldo)]);
      if (r.pct_spese_generali != null) out.push([`Spese generali ex art. 13 (${fmtPct(r.pct_spese_generali)}% su onorari)`, formatEuro(r.spese_generali)]);
      if (r.spese_imponibili > 0 || r.spese_imponibili_acconti > 0) {
        out.push([r.spese_imponibili_acconti > 0 ? `Saldo spese imponibili (${formatEuro(r.spese_imponibili + r.spese_imponibili_acconti)} - ${accLabel} ${formatEuro(r.spese_imponibili_acconti)})` : "Spese imponibili", formatEuro(r.spese_imponibili)]);
      }
      if (r.bollo > 0) out.push(["Imposta di bollo", formatEuro(r.bollo)]);
      out.push(["Cassa Avvocati (4%)", formatEuro(r.cassa)]);
      if (r.regime === 0 || r.regime === 3) out.push(["Totale imponibile", formatEuro(r.totale_imponibile)]);
      if (r.iva != null) out.push(["IVA 22% su Imponibile", formatEuro(r.iva)]);
      if (r.spese_esenti > 0 || r.spese_esenti_acconti > 0) {
        out.push([r.spese_esenti_acconti > 0 ? `Saldo spese esenti ex art. 15, DPR 633/72 (${formatEuro(r.spese_esenti + r.spese_esenti_acconti)} - ${accLabel} ${formatEuro(r.spese_esenti_acconti)})` : "Spese esenti ex art. 15, DPR 633/72", formatEuro(r.spese_esenti)]);
      }
      out.push(["Totale documento", formatEuro(r.totale_documento)]);
      if (r.iva_versata_dal_cliente != null) out.push(["Importo IVA versato direttamente dal Cliente all'Erario (scissione dei pagamenti)", formatEuro(r.iva_versata_dal_cliente)]);
      if (r.ritenuta != null) out.push(["A dedurre ritenuta d'acconto 20% (su onorari e spese)", formatEuro(r.ritenuta)]);
      if (r.ritenuta != null || r.iva_versata_dal_cliente != null) out.push(["Netto a pagare", formatEuro(r.netto_a_pagare)]);
      (r.note || []).forEach((n: string) => out.push([n, ""]));
      return out;
    },
  },
  "fattura-professionisti": {
    campi: [
      { tipo: "scelta", key: "modalita", label: "Operazione", default: "calcola", opzioni: [
        { value: "calcola", label: "Calcola" }, { value: "scorpora", label: "Scorpora & Calcola (l'importo è omnicomprensivo)" },
      ] },
      { tipo: "numero", key: "importo", label: "Importo €", default: "" },
      { tipo: "numero", key: "spese_esenti", label: "Spese Esenti € (art. 15, DPR 633/72)", default: "" },
      { tipo: "numero", key: "spese_imponibili", label: "Spese Imponibili €", default: "" },
      { tipo: "bool", key: "applica_iva", label: "IVA", default: true, mostraSe: (f) => !f.regime_semplificato },
      { tipo: "numero", key: "pct_iva", label: "IVA %", default: "22", mostraSe: (f) => !!f.applica_iva && !f.regime_semplificato },
      { tipo: "bool", key: "applica_contributo", label: "Contributo Previdenziale", default: false },
      { tipo: "testo", key: "descrizione_contributo", label: "Descrizione contributo (se contiene 'Inps' la ritenuta si calcola anche sul contributo)", default: "", mostraSe: (f) => !!f.applica_contributo },
      { tipo: "numero", key: "pct_contributo", label: "Contributo previdenziale % (da 0 a 100)", default: "", mostraSe: (f) => !!f.applica_contributo },
      { tipo: "bool", key: "applica_spese_forfettarie", label: "Spese Forfettarie", default: false },
      { tipo: "testo", key: "descrizione_spese_forfettarie", label: "Descrizione voce", default: "", mostraSe: (f) => !!f.applica_spese_forfettarie },
      { tipo: "numero", key: "pct_spese_forfettarie", label: "Spese forfettarie % sull'importo (da 0 a 100)", default: "", mostraSe: (f) => !!f.applica_spese_forfettarie },
      { tipo: "bool", key: "applica_ritenuta", label: "Ritenuta d'Acconto", default: false },
      { tipo: "numero", key: "pct_ritenuta", label: "Ritenuta d'acconto %", default: "20", mostraSe: (f) => !!f.applica_ritenuta },
      { tipo: "bool", key: "iva_per_cassa", label: "Iva per Cassa (art. 32 bis, D.L. 83/2012)", default: false, mostraSe: (f) => !!f.applica_iva && !f.split_payment && !f.regime_semplificato },
      { tipo: "bool", key: "split_payment", label: "Split Payment (art. 17-ter, DPR 633/72)", default: false, mostraSe: (f) => !!f.applica_iva && !f.iva_per_cassa && !f.regime_semplificato },
      { tipo: "bool", key: "regime_semplificato", label: "Regime Semplificato", default: false, mostraSe: (f) => !f.iva_per_cassa && !f.split_payment },
      { tipo: "scelta", key: "tipo_regime", label: "Tipo Regime", default: "1", opzioni: TIPI_REGIME_SEMPLIFICATO, mostraSe: (f) => !!f.regime_semplificato },
      { tipo: "bool", key: "addebito_bollo", label: "Addebito bollo (al cliente)", default: false, mostraSe: (f) => !!f.regime_semplificato },
    ],
    endpoint: "/calc/fattura-professionisti",
    validate: (f) => {
      if (f.applica_contributo && !(parseNumeroIt(f.pct_contributo) > 0)) return "Indicare la percentuale del contributo previdenziale (maggiore di 0 e al massimo 100).";
      if (f.applica_spese_forfettarie && !(parseNumeroIt(f.pct_spese_forfettarie) > 0)) return "Indicare la percentuale delle spese forfettarie (maggiore di 0 e al massimo 100).";
      return null;
    },
    buildBody: (f) => {
      const regime = !!f.regime_semplificato && !f.iva_per_cassa && !f.split_payment;
      const iva = !regime && !!f.applica_iva;
      return {
        importo: parseNumeroIt(f.importo), spese_esenti: parseNumeroIt(f.spese_esenti), spese_imponibili: parseNumeroIt(f.spese_imponibili),
        applica_iva: iva, pct_iva: parseNumeroIt(f.pct_iva),
        applica_contributo: !!f.applica_contributo, descrizione_contributo: f.descrizione_contributo || null, pct_contributo: parseNumeroIt(f.pct_contributo),
        applica_spese_forfettarie: !!f.applica_spese_forfettarie, descrizione_spese_forfettarie: f.descrizione_spese_forfettarie || null, pct_spese_forfettarie: parseNumeroIt(f.pct_spese_forfettarie),
        applica_ritenuta: !!f.applica_ritenuta, pct_ritenuta: parseNumeroIt(f.pct_ritenuta),
        iva_per_cassa: iva && !!f.iva_per_cassa && !f.split_payment, split_payment: iva && !!f.split_payment && !f.iva_per_cassa,
        regime_semplificato: regime, tipo_regime: parseInt(f.tipo_regime, 10) || 1, addebito_bollo: regime && !!f.addebito_bollo,
        scorpora: f.modalita === "scorpora",
      };
    },
    risultato: (r) => {
      const out: [string, string][] = [];
      if (r.scorporo) {
        out.push(["Importo omnicomprensivo", formatEuro(r.importo_omnicomprensivo)]);
        out.push(["Risultato scorporo", formatEuro(r.importo)]);
      } else {
        out.push(["Importo", formatEuro(r.importo)]);
      }
      if (r.spese_forfettarie != null) out.push([`${r.etichetta_spese_forfettarie} (${fmtPct(r.pct_spese_forfettarie)}%)`, formatEuro(r.spese_forfettarie)]);
      if (r.spese_imponibili > 0) out.push(["Spese imponibili", formatEuro(r.spese_imponibili)]);
      if (r.bollo > 0) out.push(["Imposta di bollo", formatEuro(r.bollo)]);
      if (r.contributo != null) out.push([`${r.etichetta_contributo} (${fmtPct(r.pct_contributo)}%)`, formatEuro(r.contributo)]);
      if (r.iva != null) out.push(["Totale imponibile", formatEuro(r.totale_imponibile)]);
      if (r.iva != null) out.push([`IVA ${fmtPct(r.pct_iva)}% su Imponibile`, formatEuro(r.iva)]);
      if (r.spese_esenti > 0) out.push(["Spese esenti ex art. 15, DPR 633/72", formatEuro(r.spese_esenti)]);
      out.push(["Totale documento", formatEuro(r.totale_documento)]);
      if (r.iva_versata_dal_cliente != null) out.push(["Importo IVA versato direttamente dal Cliente all'Erario (scissione dei pagamenti)", formatEuro(r.iva_versata_dal_cliente)]);
      if (r.ritenuta != null) out.push([`A dedurre ritenuta d'acconto ${fmtPct(r.pct_ritenuta)}% su ${formatEuro(r.base_ritenuta)}`, formatEuro(r.ritenuta)]);
      if (r.ritenuta != null || r.iva_versata_dal_cliente != null || r.scorporo) out.push(["Netto a pagare", formatEuro(r.netto_a_pagare)]);
      (r.note || []).forEach((n: string) => out.push([n, ""]));
      return out;
    },
  },
  "fattura-enasarco": {
    campi: [
      { tipo: "bool", key: "calcola_da_vendite", label: "Calcola dalle Vendite", default: false },
      { tipo: "numero", key: "importo", label: "Importo € (provvigioni e/o premi da fatturare)", default: "", mostraSe: (f) => !f.calcola_da_vendite },
      { tipo: "numero", key: "vendite", label: "Vendite €", default: "", mostraSe: (f) => !!f.calcola_da_vendite },
      { tipo: "numero", key: "pct_provvigione", label: "Provvigione % sulle vendite", default: "", mostraSe: (f) => !!f.calcola_da_vendite },
      { tipo: "numero", key: "spese_esenti", label: "Spese Esenti € (art. 15, DPR 633/72)", default: "" },
      { tipo: "numero", key: "spese_imponibili", label: "Spese Imponibili €", default: "" },
      { tipo: "bool", key: "applica_iva", label: "IVA", default: true, mostraSe: (f) => !f.regime_semplificato },
      { tipo: "numero", key: "pct_iva", label: "IVA %", default: "22", mostraSe: (f) => !!f.applica_iva && !f.regime_semplificato },
      { tipo: "bool", key: "applica_enasarco", label: "Contributo Enasarco (togli la spunta se hai raggiunto il massimale)", default: true },
      { tipo: "numero", key: "pct_enasarco", label: "Contributo Enasarco %", default: "8,5", mostraSe: (f) => !!f.applica_enasarco },
      { tipo: "bool", key: "applica_ritenuta", label: "Ritenuta d'Acconto", default: true },
      { tipo: "numero", key: "pct_ritenuta", label: "Ritenuta d'acconto %", default: "23", mostraSe: (f) => !!f.applica_ritenuta },
      { tipo: "scelta", key: "categoria", label: "Inquadramento per ritenuta d'acconto", default: "1", opzioni: [
        { value: "1", label: "Senza collaboratori né dipendenti (50% dell'imponibile)" },
        { value: "2", label: "Con collaboratori e/o dipendenti (20% dell'imponibile)" },
        { value: "3", label: "Agente di vendita a domicilio (78% dell'imponibile)" },
      ] },
      { tipo: "bool", key: "regime_semplificato", label: "Regime semplificato", default: false },
      { tipo: "scelta", key: "tipo_regime", label: "Tipo Regime", default: "1", opzioni: TIPI_REGIME_SEMPLIFICATO, mostraSe: (f) => !!f.regime_semplificato },
      { tipo: "bool", key: "addebito_bollo", label: "Addebito bollo (al cliente)", default: false, mostraSe: (f) => !!f.regime_semplificato },
    ],
    endpoint: "/calc/fattura-enasarco",
    buildBody: (f) => ({
      importo: parseNumeroIt(f.importo), calcola_da_vendite: !!f.calcola_da_vendite, vendite: parseNumeroIt(f.vendite), pct_provvigione: parseNumeroIt(f.pct_provvigione),
      spese_esenti: parseNumeroIt(f.spese_esenti), spese_imponibili: parseNumeroIt(f.spese_imponibili),
      applica_iva: !f.regime_semplificato && !!f.applica_iva, pct_iva: f.applica_iva ? parseNumeroIt(f.pct_iva) : 22,
      applica_enasarco: !!f.applica_enasarco, pct_enasarco: f.applica_enasarco ? (parseNumeroIt(f.pct_enasarco) || 8.5) : 8.5,
      applica_ritenuta: !!f.applica_ritenuta, pct_ritenuta: f.applica_ritenuta ? (parseNumeroIt(f.pct_ritenuta) || 23) : 23,
      categoria: parseInt(f.categoria, 10) || 1, regime_semplificato: !!f.regime_semplificato,
      tipo_regime: parseInt(f.tipo_regime, 10) || 1, addebito_bollo: !!f.regime_semplificato && !!f.addebito_bollo,
    }),
    risultato: (r) => {
      const out: [string, string][] = [];
      if (r.vendite != null) {
        out.push(["Totale Vendite", formatEuro(r.vendite)]);
        out.push([`Provvigioni (${fmtPct(r.pct_provvigione)}% sulle vendite)`, formatEuro(r.importo)]);
      } else {
        out.push(["Importo Prestazione", formatEuro(r.importo)]);
      }
      if (r.spese_imponibili > 0) out.push(["Spese imponibili", formatEuro(r.spese_imponibili)]);
      if (r.bollo > 0) out.push(["Imposta di bollo", formatEuro(r.bollo)]);
      out.push(["Totale imponibile", formatEuro(r.totale_imponibile)]);
      if (r.iva != null) {
        out.push([`IVA ${fmtPct(r.pct_iva)}% su Imponibile`, formatEuro(r.iva)]);
        out.push(["Totale documento", formatEuro(r.totale_documento)]);
      }
      if (r.contributo_enasarco != null) out.push([`Contributo obbligatorio Enasarco (${fmtPct(r.pct_enasarco)}%)`, formatEuro(r.contributo_enasarco)]);
      if (r.spese_esenti > 0) out.push(["Spese esenti ex art. 15, DPR 633/72", formatEuro(r.spese_esenti)]);
      if (r.ritenuta != null) out.push([`Ritenuta d'acconto (${fmtPct(r.pct_ritenuta)}% sul ${fmtPct(r.quota_ritenuta_pct)}% dell'imponibile)`, formatEuro(r.ritenuta)]);
      out.push(["Netto a pagare", formatEuro(r.netto_a_pagare)]);
      (r.note || []).forEach((n: string) => out.push([n, ""]));
      return out;
    },
  },
  "ricevuta-occasionale": {
    campi: [
      { tipo: "data", key: "data_ricevuta", label: "Data ricevuta (data del pagamento, dal 2025 al 2027)" },
      {
        tipo: "lista", key: "compensi", label: "Compensi (max 20)", etichettaAggiungi: "Aggiungi un compenso",
        campiRiga: [
          { tipo: "testo", key: "descrizione", label: "Descrizione" },
          { tipo: "numero", key: "importo", label: "Importo €" },
        ],
      },
      {
        tipo: "lista", key: "spese", label: "Spese documentate da rimborsare (max 50)", etichettaAggiungi: "Aggiungi una voce di spesa",
        campiRiga: [
          { tipo: "testo", key: "descrizione", label: "Descrizione voce di spesa" },
          { tipo: "numero", key: "importo", label: "Importo €" },
        ],
      },
      { tipo: "bool", key: "applica_spese_forfettarie", label: "Spese forfettarie (costituiscono reddito)", default: false },
      { tipo: "numero", key: "pct_spese_forfettarie", label: "Spese forfettarie % sul compenso", default: "", mostraSe: (f) => !!f.applica_spese_forfettarie },
      { tipo: "numero", key: "importo_spese_forfettarie", label: "oppure importo spese forfettarie € (prevale sulla percentuale)", default: "", mostraSe: (f) => !!f.applica_spese_forfettarie },
      { tipo: "bool", key: "addebito_bollo", label: "Addebito bollo (al committente; dovuto se il compenso lordo supera 77,47 €)", default: false },
      { tipo: "bool", key: "applica_ritenuta", label: "Ritenuta d'acconto (il committente è sostituto d'imposta)", default: false },
      { tipo: "numero", key: "pct_ritenuta", label: "Ritenuta d'acconto %", default: "20", mostraSe: (f) => !!f.applica_ritenuta },
      { tipo: "scelta", key: "altri_compensi", label: "Hai già percepito nell'anno altri compensi da lavoro occasionale?", default: "no", opzioni: [{ value: "no", label: "No" }, { value: "si", label: "Sì" }] },
      { tipo: "numero", key: "totale_altri_compensi", label: "Totale compensi già percepiti nell'anno € (escluso quello della presente ricevuta)", default: "", mostraSe: (f) => f.altri_compensi === "si" },
      { tipo: "scelta", key: "tipo_lavoratore", label: "Posizione previdenziale", default: "1", opzioni: [
        { value: "1", label: "Iscritto esclusivamente alla gestione separata" },
        { value: "2", label: "Pensionato o iscritto ad altre forme previdenziali" },
      ] },
      { tipo: "numero", key: "aliquota_inps", label: "Aliquota INPS % (vuoto = predefinita: 35,03 gestione separata, 24 altre forme)", default: "" },
    ],
    endpoint: "/calc/ricevuta-prestazione-occasionale",
    validate: (f) => {
      if (!(f.compensi || []).length) return "Inserire almeno un compenso.";
      if ((f.compensi || []).length > 20) return "Il calcolatore prevede al massimo 20 compensi.";
      if ((f.spese || []).length > 50) return "Il calcolatore prevede al massimo 50 voci di spesa.";
      if (f.applica_ritenuta && !(parseNumeroIt(f.pct_ritenuta) > 0 && parseNumeroIt(f.pct_ritenuta) < 100)) return "La ritenuta d'acconto deve essere maggiore di 0 e minore di 100.";
      return null;
    },
    buildBody: (f) => ({
      data_ricevuta: f.data_ricevuta,
      compensi: (f.compensi || []).map((c: Record<string, string>) => ({ descrizione: c.descrizione || null, importo: c.importo ? parseNumeroIt(c.importo) : null })),
      spese_documentate: (f.spese || []).map((c: Record<string, string>) => ({ descrizione: c.descrizione || null, importo: c.importo ? parseNumeroIt(c.importo) : null })),
      applica_spese_forfettarie: !!f.applica_spese_forfettarie,
      pct_spese_forfettarie: f.pct_spese_forfettarie ? parseNumeroIt(f.pct_spese_forfettarie) : null,
      importo_spese_forfettarie: f.importo_spese_forfettarie ? parseNumeroIt(f.importo_spese_forfettarie) : null,
      addebito_bollo: !!f.addebito_bollo,
      applica_ritenuta: !!f.applica_ritenuta, pct_ritenuta: parseNumeroIt(f.pct_ritenuta) || 20,
      altri_compensi_percepiti: f.altri_compensi === "si", totale_altri_compensi: f.totale_altri_compensi ? parseNumeroIt(f.totale_altri_compensi) : null,
      tipo_lavoratore: parseInt(f.tipo_lavoratore, 10) || 1, aliquota_inps: f.aliquota_inps ? parseNumeroIt(f.aliquota_inps) : null,
    }),
    risultato: (r) => {
      const out: [string, string][] = [];
      r.compensi.forEach((c: any) => out.push([c.descrizione, formatEuro(c.importo)]));
      if (r.compensi.length > 1) out.push(["Totale compenso", formatEuro(r.totale_compensi)]);
      if (r.spese_forfettarie != null) {
        out.push([r.pct_spese_forfettarie != null ? `Spese forfettarie (${fmtPct(r.pct_spese_forfettarie)}%)` : "Spese forfettarie", formatEuro(r.spese_forfettarie)]);
        out.push(["Totale imponibile", formatEuro(r.totale_imponibile)]);
      }
      r.spese_documentate.forEach((s: any) => out.push([`Spese documentate: ${s.descrizione}`, formatEuro(s.importo)]));
      if (r.spese_documentate.length > 1) out.push(["Totale spese", formatEuro(r.totale_spese)]);
      if (r.bollo > 0) out.push(["Addebito imposta di bollo", formatEuro(r.bollo)]);
      if (r.spese_forfettarie != null || r.spese_documentate.length > 0 || r.compensi.length > 1) out.push(["Totale documento", formatEuro(r.totale_documento)]);
      if (r.ritenuta_acconto != null) out.push([`Ritenuta d'acconto (${fmtPct(r.pct_ritenuta)}% ${r.spese_forfettarie != null ? "sull'imponibile" : "sul compenso"})`, formatEuro(r.ritenuta_acconto)]);
      if (r.imponibile_inps != null) {
        out.push(["Imponibile Inps per la parte eccedente € 5000 annuali", formatEuro(r.imponibile_inps)]);
        out.push(["Aliquota gestione separata Inps", `${fmtPct(r.aliquota_inps)}%`]);
        out.push([`Ritenuta INPS a carico del prestatore (1/3 di ${formatEuro(r.contributo_inps)})`, formatEuro(r.ritenuta_inps)]);
      }
      out.push(["Netto a pagare", formatEuro(r.netto_a_pagare)]);
      return out;
    },
  },
  "tariffe-mediazione": {
    campi: [
      { tipo: "numero", key: "valore_controversia", label: "Valore controversia € (da 41 a 5.000.000, in euro interi)", default: "" },
      { tipo: "bool", key: "materia_obbligatoria", label: "Materia obbligatoria (riduzione per materie obbligatorie ex art. 5)", default: true },
      { tipo: "bool", key: "assenza_controparte", label: "Assenza controparte (riduzione a 40 o 50 euro)", default: false },
      { tipo: "bool", key: "complessita", label: "Complessità (aumento fino al 20%)", default: false },
      { tipo: "scelta", key: "pct_complessita", label: "Aumento per complessità %", default: "20", opzioni: PERCENTUALI_1_20, mostraSe: (f) => !!f.complessita },
      { tipo: "bool", key: "proposta_formulata", label: "Proposta formulata (aumento pari al 20%)", default: false, mostraSe: (f) => !f.assenza_controparte },
      { tipo: "bool", key: "esito_positivo", label: "Esito positivo (aumento fino al 25%)", default: true, mostraSe: (f) => !f.assenza_controparte },
      { tipo: "scelta", key: "pct_esito_positivo", label: "Aumento per esito positivo %", default: "25", opzioni: PERCENTUALI_1_25, mostraSe: (f) => !f.assenza_controparte && !!f.esito_positivo },
      { tipo: "bool", key: "applica_iva", label: "IVA", default: true },
      { tipo: "numero", key: "pct_iva", label: "IVA %", default: "22", mostraSe: (f) => !!f.applica_iva },
      { tipo: "bool", key: "spese_avvio_imponibili", label: "Spese di avvio imponibili ai fini IVA", default: false, mostraSe: (f) => !!f.applica_iva },
    ],
    endpoint: "/calc/tariffe-mediazione",
    validate: (f) => {
      const v = parseNumeroIt(f.valore_controversia);
      if (!(v > 40 && v <= 5000000)) return "Il valore della controversia deve essere superiore a 40 e non superare 5.000.000 di euro.";
      if (f.applica_iva && !(parseNumeroIt(f.pct_iva) > 0)) return "Indicare la percentuale IVA.";
      return null;
    },
    buildBody: (f) => ({
      valore_controversia: parseNumeroIt(f.valore_controversia), materia_obbligatoria: !!f.materia_obbligatoria, assenza_controparte: !!f.assenza_controparte,
      complessita: !!f.complessita, pct_complessita: parseInt(f.pct_complessita, 10) || 1,
      proposta_formulata: !f.assenza_controparte && !!f.proposta_formulata, esito_positivo: !f.assenza_controparte && !!f.esito_positivo,
      pct_esito_positivo: parseInt(f.pct_esito_positivo, 10) || 1,
      applica_iva: !!f.applica_iva, pct_iva: f.applica_iva ? parseNumeroIt(f.pct_iva) : 22, spese_avvio_imponibili: !!f.applica_iva && !!f.spese_avvio_imponibili,
    }),
    risultato: (r) => {
      const coppia = (a: number | null | undefined, b: number | null | undefined) => `${formatEuro(a)} – ${formatEuro(b)}`;
      const out: [string, string][] = [];
      const mn = r.minimo, mx = r.massimo;
      out.push(["Costo totale per ciascuna parte (minimo – massimo)", coppia(mn.totale, mx.totale)]);
      out.push(["Indennità base", coppia(mn.indennita_base, mx.indennita_base)]);
      out.push(["Spese fisse di avvio mediazione", coppia(r.spese_avvio, r.spese_avvio)]);
      if (mn.riduzione != null) out.push([`Riduzione ${r.frazione_riduzione} materia obbligatoria`, coppia(mn.riduzione, mx.riduzione)]);
      mn.aumenti.forEach((a: any, i: number) => {
        const nome = a.tipo === "complessita" ? `Aumento ${a.pct}% complessità` : a.tipo === "proposta" ? "Aumento 20% proposta formulata" : `Aumento ${a.pct}% esito positivo`;
        out.push([nome, coppia(a.importo, mx.aumenti[i].importo)]);
      });
      if (mn.imponibile != null) out.push(["Imponibile", coppia(mn.imponibile, mx.imponibile)]);
      if (mn.iva != null) out.push([`Iva ${fmtPct(r.pct_iva)}%`, coppia(mn.iva, mx.iva)]);
      if (r.avviso) out.push([r.avviso, ""]);
      return out;
    },
  },
  "calcolo-preventivo": {
    campi: [
      {
        tipo: "lista", key: "righe", label: "Voci del preventivo", etichettaAggiungi: "Aggiungi una voce",
        campiRiga: [
          { tipo: "testo", key: "descrizione", label: "Descrizione" },
          { tipo: "numero", key: "quantita", label: "Quantità", default: "1" },
          { tipo: "numero", key: "prezzo", label: "Prezzo unitario €" },
        ],
      },
      { tipo: "bool", key: "applica_iva", label: "IVA", default: false },
      { tipo: "numero", key: "pct_iva", label: "IVA % (numero intero da 1 a 22)", default: "22", mostraSe: (f) => !!f.applica_iva },
      { tipo: "bool", key: "ritenuta", label: "Ritenuta d'acconto (20%)", default: false },
    ],
    endpoint: "/calc/calcolo-preventivo",
    validate: (f) => {
      if (!(f.righe || []).length) return "Inserire almeno una voce.";
      if (f.applica_iva) {
        const p = parseNumeroIt(f.pct_iva);
        if (!(Number.isInteger(p) && p >= 1 && p <= 22)) return "L'IVA deve essere un numero intero da 1 a 22.";
      }
      return null;
    },
    buildBody: (f) => ({
      righe: (f.righe || []).map((r: Record<string, string>) => ({
        descrizione: r.descrizione || null, quantita: r.quantita ? parseNumeroIt(r.quantita) : null, prezzo: r.prezzo ? parseNumeroIt(r.prezzo) : null,
      })),
      applica_iva: !!f.applica_iva, pct_iva: f.applica_iva ? parseNumeroIt(f.pct_iva) : 22, ritenuta: !!f.ritenuta,
    }),
    risultato: (r) => {
      const out: [string, string][] = [];
      r.righe.forEach((x: any) => out.push([`${x.descrizione} — ${fmtPct(x.quantita)} × ${formatEuro(x.prezzo)}`, formatEuro(x.importo)]));
      out.push(["TOTALE", formatEuro(r.totale)]);
      if (r.imponibile != null) {
        out.push(["Imponibile", formatEuro(r.imponibile)]);
        if (r.iva != null) out.push([`IVA ${r.pct_iva}% su Imponibile`, formatEuro(r.iva)]);
        if (r.totale_con_iva != null) out.push(["Totale", formatEuro(r.totale_con_iva)]);
        if (r.ritenuta != null) out.push([`A dedurre ritenuta d'acconto ${r.pct_ritenuta}%`, formatEuro(r.ritenuta)]);
        out.push(["Totale documento", formatEuro(r.totale_documento)]);
      }
      return out;
    },
  },
  "aumenti-riduzioni-pena": {
    campi: [
      { tipo: "titolo", key: "tit_det", label: "Pena detentiva:" },
      { tipo: "numero", key: "anni", label: "Anni (0-90)", default: "" },
      { tipo: "numero", key: "mesi", label: "Mesi (0-48)", default: "" },
      { tipo: "numero", key: "giorni", label: "Giorni (0-90)", default: "" },
      { tipo: "numero", key: "pena_pecuniaria", label: "Pena pecuniaria € (senza decimali)", default: "" },
      {
        tipo: "lista", key: "operazioni", label: "Operazioni (massimo 4, eseguite in sequenza)", etichettaAggiungi: "Aggiungi un'operazione",
        campiRiga: [
          { tipo: "scelta", key: "operazione", label: "Operazione", default: "+", opzioni: [
            { value: "+", label: "Aumenta" }, { value: "-", label: "Riduci" },
          ] },
          { tipo: "scelta", key: "frazione", label: "di", default: "1/6", opzioni: [
            { value: "1/6", label: "1/6" }, { value: "1/3", label: "1/3" }, { value: "1/2", label: "1/2" }, { value: "2/3", label: "2/3" },
            { value: "", label: "oppure frazione personalizzata:" },
          ] },
          { tipo: "numero", key: "numeratore", label: "Numeratore (se personalizzata)" },
          { tipo: "numero", key: "denominatore", label: "Denominatore (se personalizzata)" },
        ],
      },
    ],
    endpoint: "/calc/aumenti-riduzioni-pena",
    validate: (f) => {
      const ops = f.operazioni || [];
      if (ops.length > 4) return "Si possono impostare al massimo 4 operazioni.";
      return null;
    },
    buildBody: (f) => ({
      anni: f.anni ? parseNumeroIt(f.anni) : null, mesi: f.mesi ? parseNumeroIt(f.mesi) : null, giorni: f.giorni ? parseNumeroIt(f.giorni) : null,
      pena_pecuniaria: f.pena_pecuniaria ? parseNumeroIt(f.pena_pecuniaria) : null,
      operazioni: (f.operazioni || []).map((o: Record<string, string>) => ({
        operazione: o.operazione || null,
        frazione: o.frazione || null,
        numeratore: !o.frazione && o.numeratore ? parseNumeroIt(o.numeratore) : null,
        denominatore: !o.frazione && o.denominatore ? parseNumeroIt(o.denominatore) : null,
      })),
    }),
    risultato: (r) => {
      const out: [string, string][] = [];
      const riga = (det: string, pec: string | null) => (pec ? `${det} — ${pec}` : det);
      r.passi.forEach((p: any) => out.push([p.descrizione, riga(p.detentiva, p.pecuniaria)]));
      out.push(["Pena finale", riga(r.pena_finale_detentiva, r.pena_finale_pecuniaria)]);
      return out;
    },
  },
  "grado-parentela": {
    campi: [
      { tipo: "scelta", key: "parentela", label: "Parentela", default: "0", cercabile: true, opzioni: [
        { value: "0", label: "padre" },
        { value: "1", label: "madre" },
        { value: "2", label: "nonno" },
        { value: "3", label: "bisnonno" },
        { value: "4", label: "trisnonno" },
        { value: "5", label: "figlio" },
        { value: "6", label: "nipote" },
        { value: "7", label: "nipote (di zio)" },
        { value: "8", label: "pronipote" },
        { value: "9", label: "pronipote (di zio)" },
        { value: "10", label: "pro-pronipote" },
        { value: "11", label: "pro-pronipote (di zio)" },
        { value: "12", label: "fratello" },
        { value: "13", label: "sorella" },
        { value: "14", label: "zio" },
        { value: "15", label: "prozio" },
        { value: "16", label: "pro-prozio" },
        { value: "17", label: "cugino" },
        { value: "18", label: "cugino di 2° grado" },
        { value: "19", label: "cugino di 3° grado" },
        { value: "20", label: "suocero" },
        { value: "21", label: "cognato" },
        { value: "22", label: "prosuocero" },
      ] },
    ],
    endpoint: "/calc/grado-parentela",
    buildBody: (f) => ({ parentela: parseInt(f.parentela, 10) }),
    risultato: (r) => {
      const out: [string, string][] = [
        [r.tipo === "affinità" ? "Affinità" : "Parentela", r.frase],
        ["Grado", `${r.grado}°`],
      ];
      if (r.linea) out.push(["Linea", r.linea]);
      if (r.alberi_genealogici) out.push(["Alberi genealogici possibili", String(r.alberi_genealogici)]);
      return out;
    },
  },
};

// Atti: a differenza dei calcolatori sopra, qui non si calcola un numero o
// una data ma si genera una bozza di documento Word a partire da campi di
// testo libero. Solo i 5 atti più standardizzati e meno rischiosi (nessuna
// argomentazione di merito caso per caso): atto di citazione, comparse e
// ricorsi restano fuori perché richiederebbero contenuto sostanziale che va
// scritto dall'avvocato, non generato automaticamente.
type AttoId = "diffida_ad_adempiere" | "messa_in_mora" | "incarico_professionale" | "procura_alle_liti" | "disdetta_locazione";

type CampoAtto = { key: string; label: string; obbligatorio?: boolean; multiline?: boolean; dataIso?: boolean; opzioni?: { value: string; label: string }[]; tipo?: "bool"; mostraSe?: (form: Record<string, string>) => boolean };

// Ordini Circondariali Forensi italiani (Fori), uno per circondario di Tribunale
// ordinario attualmente operativo (138, verificati su Tabella 5 del Ministero della
// Giustizia incrociata con l'elenco Tribunali di Wikipedia e fonti puntuali per i casi
// dubbi — inclusi i 4 Tribunali abruzzesi mai chiusi nonostante la soppressione 2012/2013
// per proroghe legislative ininterrotte; esclusi Chiavari e Bassano del Grappa, soppressi).
const ORDINI_FORENSI: { value: string; label: string }[] = [
  { value: "Agrigento", label: "Agrigento" },
  { value: "Alessandria", label: "Alessandria" },
  { value: "Ancona", label: "Ancona" },
  { value: "Aosta", label: "Aosta" },
  { value: "Arezzo", label: "Arezzo" },
  { value: "Ascoli Piceno", label: "Ascoli Piceno" },
  { value: "Asti", label: "Asti" },
  { value: "Avellino", label: "Avellino" },
  { value: "Avezzano", label: "Avezzano" },
  { value: "Barcellona Pozzo di Gotto", label: "Barcellona Pozzo di Gotto" },
  { value: "Bari", label: "Bari" },
  { value: "Belluno", label: "Belluno" },
  { value: "Benevento", label: "Benevento" },
  { value: "Bergamo", label: "Bergamo" },
  { value: "Biella", label: "Biella" },
  { value: "Bologna", label: "Bologna" },
  { value: "Bolzano", label: "Bolzano" },
  { value: "Brescia", label: "Brescia" },
  { value: "Brindisi", label: "Brindisi" },
  { value: "Busto Arsizio", label: "Busto Arsizio" },
  { value: "Caltagirone", label: "Caltagirone" },
  { value: "Caltanissetta", label: "Caltanissetta" },
  { value: "Campobasso", label: "Campobasso" },
  { value: "Cassino", label: "Cassino" },
  { value: "Castrovillari", label: "Castrovillari" },
  { value: "Catania", label: "Catania" },
  { value: "Catanzaro", label: "Catanzaro" },
  { value: "Chieti", label: "Chieti" },
  { value: "Civitavecchia", label: "Civitavecchia" },
  { value: "Como", label: "Como" },
  { value: "Cosenza", label: "Cosenza" },
  { value: "Cremona", label: "Cremona" },
  { value: "Crotone", label: "Crotone" },
  { value: "Cuneo", label: "Cuneo" },
  { value: "Enna", label: "Enna" },
  { value: "Fermo", label: "Fermo" },
  { value: "Ferrara", label: "Ferrara" },
  { value: "Firenze", label: "Firenze" },
  { value: "Foggia", label: "Foggia" },
  { value: "Forlì", label: "Forlì" },
  { value: "Frosinone", label: "Frosinone" },
  { value: "Gela", label: "Gela" },
  { value: "Genova", label: "Genova" },
  { value: "Gorizia", label: "Gorizia" },
  { value: "Grosseto", label: "Grosseto" },
  { value: "Imperia", label: "Imperia" },
  { value: "Isernia", label: "Isernia" },
  { value: "Ivrea", label: "Ivrea" },
  { value: "Lagonegro", label: "Lagonegro" },
  { value: "Lamezia Terme", label: "Lamezia Terme" },
  { value: "Lanciano", label: "Lanciano" },
  { value: "Lanusei", label: "Lanusei" },
  { value: "L'Aquila", label: "L'Aquila" },
  { value: "Larino", label: "Larino" },
  { value: "La Spezia", label: "La Spezia" },
  { value: "Latina", label: "Latina" },
  { value: "Lecce", label: "Lecce" },
  { value: "Lecco", label: "Lecco" },
  { value: "Livorno", label: "Livorno" },
  { value: "Locri", label: "Locri" },
  { value: "Lodi", label: "Lodi" },
  { value: "Lucca", label: "Lucca" },
  { value: "Macerata", label: "Macerata" },
  { value: "Mantova", label: "Mantova" },
  { value: "Marsala", label: "Marsala" },
  { value: "Massa", label: "Massa" },
  { value: "Matera", label: "Matera" },
  { value: "Messina", label: "Messina" },
  { value: "Milano", label: "Milano" },
  { value: "Modena", label: "Modena" },
  { value: "Monza", label: "Monza" },
  { value: "Napoli", label: "Napoli" },
  { value: "Napoli Nord", label: "Napoli Nord" },
  { value: "Nocera Inferiore", label: "Nocera Inferiore" },
  { value: "Nola", label: "Nola" },
  { value: "Novara", label: "Novara" },
  { value: "Nuoro", label: "Nuoro" },
  { value: "Oristano", label: "Oristano" },
  { value: "Padova", label: "Padova" },
  { value: "Palermo", label: "Palermo" },
  { value: "Palmi", label: "Palmi" },
  { value: "Paola", label: "Paola" },
  { value: "Parma", label: "Parma" },
  { value: "Patti", label: "Patti" },
  { value: "Pavia", label: "Pavia" },
  { value: "Perugia", label: "Perugia" },
  { value: "Pesaro", label: "Pesaro" },
  { value: "Pescara", label: "Pescara" },
  { value: "Piacenza", label: "Piacenza" },
  { value: "Pisa", label: "Pisa" },
  { value: "Pistoia", label: "Pistoia" },
  { value: "Pordenone", label: "Pordenone" },
  { value: "Potenza", label: "Potenza" },
  { value: "Prato", label: "Prato" },
  { value: "Ragusa", label: "Ragusa" },
  { value: "Ravenna", label: "Ravenna" },
  { value: "Reggio Calabria", label: "Reggio Calabria" },
  { value: "Reggio Emilia", label: "Reggio Emilia" },
  { value: "Rieti", label: "Rieti" },
  { value: "Rimini", label: "Rimini" },
  { value: "Roma", label: "Roma" },
  { value: "Rovereto", label: "Rovereto" },
  { value: "Rovigo", label: "Rovigo" },
  { value: "Salerno", label: "Salerno" },
  { value: "Santa Maria Capua Vetere", label: "Santa Maria Capua Vetere" },
  { value: "Sassari", label: "Sassari" },
  { value: "Savona", label: "Savona" },
  { value: "Sciacca", label: "Sciacca" },
  { value: "Siena", label: "Siena" },
  { value: "Siracusa", label: "Siracusa" },
  { value: "Sondrio", label: "Sondrio" },
  { value: "Spoleto", label: "Spoleto" },
  { value: "Sulmona", label: "Sulmona" },
  { value: "Taranto", label: "Taranto" },
  { value: "Teramo", label: "Teramo" },
  { value: "Termini Imerese", label: "Termini Imerese" },
  { value: "Terni", label: "Terni" },
  { value: "Tivoli", label: "Tivoli" },
  { value: "Torino", label: "Torino" },
  { value: "Torre Annunziata", label: "Torre Annunziata" },
  { value: "Trani", label: "Trani" },
  { value: "Trapani", label: "Trapani" },
  { value: "Trento", label: "Trento" },
  { value: "Treviso", label: "Treviso" },
  { value: "Trieste", label: "Trieste" },
  { value: "Udine", label: "Udine" },
  { value: "Urbino", label: "Urbino" },
  { value: "Vallo della Lucania", label: "Vallo della Lucania" },
  { value: "Varese", label: "Varese" },
  { value: "Vasto", label: "Vasto" },
  { value: "Velletri", label: "Velletri" },
  { value: "Venezia", label: "Venezia" },
  { value: "Verbania", label: "Verbania" },
  { value: "Vercelli", label: "Vercelli" },
  { value: "Verona", label: "Verona" },
  { value: "Vibo Valentia", label: "Vibo Valentia" },
  { value: "Vicenza", label: "Vicenza" },
  { value: "Viterbo", label: "Viterbo" },
];

const ATTI: { id: AttoId; titolo: string; sottotitolo: string; icona: string }[] = [
  { id: "diffida_ad_adempiere", titolo: "Diffida ad adempiere", sottotitolo: "Art. 1454 c.c.", icona: "alert-circle" },
  { id: "messa_in_mora", titolo: "Messa in mora", sottotitolo: "Art. 1219 c.c.", icona: "clock" },
  { id: "incarico_professionale", titolo: "Lettera di incarico professionale", sottotitolo: "Conferimento e accettazione", icona: "file-text" },
  { id: "procura_alle_liti", titolo: "Procura alle liti", sottotitolo: "Nomina del difensore", icona: "edit-3" },
  { id: "disdetta_locazione", titolo: "Disdetta di locazione (lettera)", sottotitolo: "Abitativa o commerciale", icona: "key" },
];

const CAMPI_ATTI: Record<AttoId, CampoAtto[]> = {
  diffida_ad_adempiere: [
    { key: "mittente", label: "Mittente (nome/ragione sociale)", obbligatorio: true },
    { key: "mittente_indirizzo", label: "Indirizzo mittente" },
    { key: "destinatario", label: "Destinatario", obbligatorio: true },
    { key: "destinatario_indirizzo", label: "Indirizzo destinatario" },
    { key: "oggetto_obbligazione", label: "Descrizione dell'obbligazione inadempiuta", obbligatorio: true, multiline: true },
    { key: "termine_giorni", label: "Termine concesso (giorni)", obbligatorio: true },
    { key: "luogo", label: "Luogo" },
    { key: "data", label: "Data", dataIso: true },
  ],
  messa_in_mora: [
    {
      key: "incipit", label: "Incipit", opzioni: [
        { value: "Il sottoscritto,", label: "Il sottoscritto," },
        { value: "La sottoscritta,", label: "La sottoscritta," },
        { value: "Io sottoscritto,", label: "Io sottoscritto," },
        { value: "Io sottoscritta,", label: "Io sottoscritta," },
      ],
    },
    {
      key: "qualifica_mittente", label: "In qualità di", opzioni: [
        { value: "Creditore", label: "Creditore" },
        { value: "Avvocato del Creditore", label: "Avvocato del Creditore" },
        { value: "Legale rappresentante", label: "Legale rappresentante" },
        { value: "Amministratore di condominio", label: "Amministratore di condominio" },
      ],
    },
    { key: "mittente", label: "Mittente (nome/ragione sociale)", obbligatorio: true },
    { key: "mittente_indirizzo", label: "Indirizzo mittente" },
    { key: "creditore", label: "Creditore (se diverso dal mittente, es. cliente dell'avvocato)", obbligatorio: true },
    { key: "creditore_persona_giuridica", label: "Il creditore è una persona giuridica", tipo: "bool" },
    { key: "creditore_legale_rappresentante", label: "Legale rappresentante del creditore", mostraSe: (f) => !!f.creditore_persona_giuridica },
    { key: "creditore_cf_piva", label: "C.F. / P.IVA del creditore" },
    {
      key: "titolo_destinatario", label: "Titolo destinatario", opzioni: [
        { value: "Spett.le", label: "Spett.le" },
        { value: "Egr. Sig.", label: "Egr. Sig." },
        { value: "Gent.ma Sig.ra", label: "Gent.ma Sig.ra" },
        { value: "Egr. Dott.", label: "Egr. Dott." },
        { value: "Gent.ma Dott.ssa", label: "Gent.ma Dott.ssa" },
      ],
    },
    { key: "destinatario", label: "Destinatario", obbligatorio: true },
    { key: "destinatario_indirizzo", label: "Indirizzo destinatario" },
    { key: "destinatario_email_pec", label: "Email / PEC destinatario" },
    { key: "data_scadenza_originaria", label: "Data scadenza originaria", dataIso: true },
    { key: "versamento_entro_giorni", label: "Termine di pagamento concesso (giorni)" },
    { key: "acconti", label: "Acconti già versati (dedotti dal totale) €" },
    {
      key: "invio_tramite", label: "Invio tramite", opzioni: [
        { value: "Posta Ordinaria", label: "Posta Ordinaria" },
        { value: "Raccomandata A/R", label: "Raccomandata A/R" },
        { value: "PEC", label: "PEC / Posta Elettronica" },
      ],
    },
    { key: "luogo", label: "Luogo" },
    { key: "data", label: "Data", dataIso: true },
  ],
  incarico_professionale: [
    { key: "avvocato_studio", label: "Avvocato / Studio", obbligatorio: true },
    { key: "cliente", label: "Cliente", obbligatorio: true },
    { key: "oggetto_incarico", label: "Oggetto dell'incarico", obbligatorio: true, multiline: true },
    { key: "compenso_pattuito", label: "Compenso pattuito", obbligatorio: true, multiline: true },
    { key: "modalita_pagamento", label: "Modalità di pagamento" },
    { key: "luogo", label: "Luogo" },
    { key: "data", label: "Data", dataIso: true },
  ],
  procura_alle_liti: [
    {
      key: "incipit", label: "Incipit", opzioni: [
        { value: "Il sottoscritto/a", label: "Il sottoscritto/a" },
        { value: "Io sottoscritto/a", label: "Io sottoscritto/a" },
      ],
    },
    { key: "dati_causa", label: "Dati della causa (facoltativo)", multiline: true },
    { key: "luogo", label: "Luogo" },
    { key: "data", label: "Data", dataIso: true },
  ],
  disdetta_locazione: [
    { key: "mittente", label: "Mittente (nome/ragione sociale)", obbligatorio: true },
    { key: "destinatario", label: "Destinatario", obbligatorio: true },
    { key: "indirizzo_immobile", label: "Indirizzo dell'immobile", obbligatorio: true },
    { key: "data_contratto", label: "Data del contratto", dataIso: true },
    { key: "data_scadenza_contratto", label: "Data di scadenza del contratto", obbligatorio: true, dataIso: true },
    { key: "tipo_locazione", label: "Tipo di locazione", obbligatorio: true, opzioni: [
      { value: "abitativo", label: "Abitativa (6 mesi prima)" },
      { value: "commerciale", label: "Commerciale (12 mesi prima)" },
      { value: "commerciale_alberghiero", label: "Commerciale con attività alberghiera (18 mesi prima)" },
    ] },
    { key: "luogo", label: "Luogo" },
    { key: "data", label: "Data", dataIso: true },
  ],
};

function defaultGenForm(idc: string): Record<string, any> {
  const cfg = CONFIG_GENERICI[idc];
  if (!cfg) return {};
  const f: Record<string, any> = {};
  cfg.campi.forEach((c) => {
    if (c.tipo === "data") f[c.key] = new Date().toISOString().slice(0, 10);
    else if (c.tipo === "data_opzionale") f[c.key] = "";
    else if (c.tipo === "mese_anno") f[c.key] = new Date().toISOString().slice(0, 7);
    else if (c.tipo === "lista") f[c.key] = [];
    else if (c.tipo === "numero" || c.tipo === "testo") f[c.key] = c.default ?? "";
    else if (c.tipo === "bool") f[c.key] = c.default ?? false;
    else if (c.tipo === "scelta") f[c.key] = c.default ?? (typeof c.opzioni === "function" ? c.opzioni(f) : c.opzioni)[0]?.value;
  });
  return f;
}

// Hub unico per tutti i calcolatori: sostituisce i vecchi pulsanti separati
// "Aggiungi scadenza" e "Crea parcella" sparsi per l'app (Dashboard,
// Archivio, scheda pratica). Scadenze Processuali e Parcelle restano le
// voci "storiche" (form a pagina intera, invariati nella logica); gli
// altri sono i nuovi calcolatori legali aggiunti dopo aver studiato un
// sito di riferimento esterno di calcolatori legali.
// Ogni calcolatore produce o una data (scadenza/termine) o un importo in
// euro: la categoria serve solo a raggruppare il picker in due sezioni,
// cosi' l'utente trova subito il tipo di calcolo che gli serve.
const CALCOLATORI: { id: CalcId; titolo: string; sottotitolo: string; icona: string }[] = [
  { id: "scadenze", titolo: "Scadenze Processuali", sottotitolo: "Calcolo termini a partire da una data", icona: "clock" },
  { id: "giorni-tra-date", titolo: "Giorni tra due date", sottotitolo: "Conteggio giorni di calendario", icona: "calendar" },
  { id: "termini-memorie", titolo: "Termini memorie e conclusionali", sottotitolo: "Artt. 171-ter e 189 c.p.c., riforma Cartabia", icona: "calendar" },
  { id: "termini-impugnazione", titolo: "Termini di impugnazione", sottotitolo: "Appello, Cassazione, revocazione, opposizione di terzo", icona: "flag" },
  { id: "opposizione-decreto-ingiuntivo", titolo: "Opposizione a decreto ingiuntivo", sottotitolo: "Termine fissato nel decreto, art. 641 c.p.c.", icona: "shield" },
  { id: "prescrizione", titolo: "Prescrizione e decadenza", sottotitolo: "Con eventuali atti interruttivi", icona: "rotate-ccw" },
  { id: "termini-citazione", titolo: "Termini di comparizione in citazione", sottotitolo: "Art. 163-bis c.p.c.", icona: "compass" },
  { id: "precetto", titolo: "Precetto ed esecuzione", sottotitolo: "Mobiliare, immobiliare, presso terzi, autoveicoli", icona: "alert-triangle" },
  { id: "impugnazione-licenziamento", titolo: "Impugnazione licenziamento", sottotitolo: "Art. 6 L. 604/1966", icona: "user-x" },
  { id: "ricorso-tributario", titolo: "Ricorso tributario", sottotitolo: "Art. 21 D.Lgs. 546/1992", icona: "file-minus" },
  { id: "ricorso-tar", titolo: "Ricorso al TAR", sottotitolo: "Giurisdizionale o straordinario", icona: "map" },
  { id: "termine-querela", titolo: "Termine per la querela", sottotitolo: "Art. 124 c.p.", icona: "alert-octagon" },
  { id: "disdetta-locazione", titolo: "Disdetta di locazione", sottotitolo: "Abitativa o commerciale", icona: "key" },
  { id: "parcelle", titolo: "Parcelle", sottotitolo: "Compensi, spese, CPA, IVA", icona: "dollar-sign" },
  { id: "interessi-legali", titolo: "Interessi legali", sottotitolo: "Art. 1284 c.c.", icona: "percent" },
  { id: "interessi-mora", titolo: "Interessi di mora", sottotitolo: "D.Lgs. 231/2002, transazioni commerciali", icona: "alert-circle" },
  { id: "contributo-unificato", titolo: "Contributo unificato", sottotitolo: "Processo civile, per valore causa", icona: "file-text" },
  { id: "rivalutazione-istat", titolo: "Rivalutazione ISTAT", sottotitolo: "Capitale rivalutato tra due indici", icona: "trending-up" },
  { id: "rivalutazione-mensile", titolo: "Rivalutazione Mensile", sottotitolo: "Rate mensili non pagate: assegno, canone, retribuzioni", icona: "calendar" },
  { id: "adeguamento-canone", titolo: "Adeguamento Canone", sottotitolo: "Aggiornamento ISTAT annuale del canone di locazione", icona: "home" },
  { id: "interessi-vari-capitale-rivalutato", titolo: "Interessi Vari sul Capitale Rivalutato", sottotitolo: "Legali, di mora o a tasso fisso, con anatocismo e rivalutazione", icona: "percent" },
  { id: "imposta-successione", titolo: "Imposta di successione", sottotitolo: "Aliquote e franchigie per grado di parentela", icona: "home" },
  { id: "compenso-ctu", titolo: "Compenso CTU", sottotitolo: "A vacazioni, DPR 115/2002", icona: "briefcase" },
  { id: "parametri-forensi", titolo: "Parametri forensi / spese di lite", sottotitolo: "Giudice di pace, Tribunale, Appello, Cassazione", icona: "bar-chart-2" },
  { id: "compenso-mediazione", titolo: "Compenso mediazione civile", sottotitolo: "DM 150/2023", icona: "users" },
  { id: "eta-anagrafica", titolo: "Calcolo Età Anagrafica", sottotitolo: "Età in anni, mesi e giorni a una data di riferimento", icona: "user" },
  { id: "aggiungi-giorni-lavorativi", titolo: "Giorni Lavorativi e Festivi", sottotitolo: "Somma o sottrae giorni lavorativi a una data", icona: "calendar" },
  { id: "termini-separazione-divorzio", titolo: "Termini Separazione e Divorzio", sottotitolo: "Art. 473-bis.17 e 473-bis.28 c.p.c.", icona: "users" },
  { id: "termini-esecuzioni", titolo: "Termini Esecuzioni", sottotitolo: "Pignoramento mobiliare, immobiliare, presso terzi, autoveicoli", icona: "alert-triangle" },
  { id: "termini-procedimento-semplificato", titolo: "Termini Procedimento Semplificato", sottotitolo: "Memorie integrative (art. 281-undecies c.p.c.)", icona: "calendar" },
  { id: "termini-deposito-appello", titolo: "Termini Deposito Atti Appello", sottotitolo: "Note di precisazione, comparsa conclusionale, repliche", icona: "flag" },
  { id: "termini-deposito-ctu", titolo: "Termini Deposito CTU", sottotitolo: "Bozza, osservazioni, relazione definitiva", icona: "file-text" },
  { id: "scadenze-multe", titolo: "Scadenze Multe", sottotitolo: "Ricorso al Prefetto, al Giudice di Pace o pagamento", icona: "alert-octagon" },
  { id: "prescrizione-reati", titolo: "Calcolo Prescrizione Reati", sottotitolo: "Art. 157 c.p.", icona: "rotate-ccw" },
  { id: "fine-pena", titolo: "Calcolo Fine Pena", sottotitolo: "Con liberazione anticipata", icona: "clock" },
  { id: "conversione-pena", titolo: "Conversione Pena", sottotitolo: "Pecuniaria-detentiva, per ragguaglio", icona: "repeat" },
  { id: "interessi-acconti", titolo: "Interessi e Acconti", sottotitolo: "Con pagamenti parziali imputati a capitale/interessi", icona: "percent" },
  { id: "interessi-corso-causa", titolo: "Interessi 1284 c.c. nel corso della causa", sottotitolo: "Moratori dalla domanda giudiziale, con rivalutazione", icona: "percent" },
  { id: "interessi-mora-appalti", titolo: "Interessi Mora Appalti", sottotitolo: "Certificati di pagamento, acconti, saldo", icona: "alert-circle" },
  { id: "maggior-danno", titolo: "Calcolo Maggior Danno", sottotitolo: "Obbligazioni pecuniarie, art. 1224 c.2 c.c.", icona: "trending-up" },
  { id: "pignoramento-stipendio-pensione", titolo: "Pignoramento stipendio o pensione", sottotitolo: "Quota pignorabile secondo i limiti di legge", icona: "shield" },
  { id: "equo-indennizzo", titolo: "Calcolo Equo Indennizzo", sottotitolo: "Causa di servizio, pubblico dipendente", icona: "user-check" },
  { id: "compenso-curatore-fallimentare", titolo: "Compenso Curatore Fallimentare", sottotitolo: "DM 25/1/2012 n. 30", icona: "briefcase" },
  { id: "compenso-delegati-vendite", titolo: "Compenso Delegati Vendite Giudiziarie", sottotitolo: "Immobili e mobili", icona: "briefcase" },
  { id: "compenso-mediatore-familiare", titolo: "Compenso Mediatore Familiare", sottotitolo: "Per complessità e numero di incontri", icona: "users" },
  { id: "parametri-penali-2014", titolo: "Parametri 2014 Penale", sottotitolo: "Compenso avvocati in ambito penale, DM 55/2014", icona: "bar-chart-2" },
  { id: "parametri-penali-2012", titolo: "Parametri 2012 Penale", sottotitolo: "Compenso avvocati in ambito penale, DM 140/2012", icona: "bar-chart-2" },
  { id: "parametri-civili-2012", titolo: "Parametri 2012 Civile", sottotitolo: "Compenso avvocati in ambito civile, DM 140/2012", icona: "bar-chart-2" },
  { id: "spese-trasferta-avvocati", titolo: "Spese Trasferta Avvocati", sottotitolo: "Rimborso chilometrico, albergo, trasporti e vitto", icona: "map-pin" },
  { id: "notula-penale-tariffario-2004", titolo: "Calcolo Notula Penale", sottotitolo: "Tariffario forense 2004: attività, regimi, anticipi", icona: "file-text" },
  { id: "nota-spese-tariffe-2004", titolo: "Calcolo Nota Spese", sottotitolo: "Diritti, onorari e stragiudiziale, tariffe forensi 2004", icona: "file-text" },
  { id: "preventivo-stragiudiziale", titolo: "Preventivo Attività Stragiudiziali", sottotitolo: "Compenso, spese e accessori di un preventivo stragiudiziale", icona: "file-text" },
  { id: "parametri-stragiudiziali", titolo: "Parametri Stragiudiziali", sottotitolo: "Assistenza stragiudiziale e mediazione, DM 55/2014", icona: "bar-chart-2" },
  { id: "quote-ereditarie", titolo: "Calcolo Eredità", sottotitolo: "Quote legittime e testamentarie", icona: "home" },
  { id: "usufrutto", titolo: "Calcolo Usufrutto", sottotitolo: "Vitalizio o a termine", icona: "home" },
  { id: "valore-catastale", titolo: "Calcolo Valore Catastale", sottotitolo: "Rendita rivalutata per moltiplicatore catastale", icona: "home" },
  { id: "imposte-compravendita-immobiliare", titolo: "Imposte Compravendita Immobiliare", sottotitolo: "IVA, registro, ipotecaria, catastale", icona: "home" },
  { id: "tassa-registro-locazione", titolo: "Tassa Registro Locazioni", sottotitolo: "Rateale o in unica soluzione", icona: "home" },
  { id: "danno-biologico-lieve-entita", titolo: "Danno Biologico (lieve entità)", sottotitolo: "Micropermanenti 1-9 punti, art. 139 Cod. Ass.", icona: "activity" },
  { id: "danno-biologico-macropermanenti", titolo: "Danno Biologico (macropermanenti)", sottotitolo: "10-100 punti, Tabella Unica Nazionale", icona: "activity" },
  { id: "menomazioni-plurime", titolo: "Calcolo Menomazioni Plurime", sottotitolo: "Balthazard o Salomonica", icona: "activity" },
  { id: "danno-perdita-parentale-milano", titolo: "Danno Parentale Milano", sottotitolo: "Tabelle del Tribunale di Milano 2024", icona: "heart" },
  { id: "danno-perdita-parentale-roma", titolo: "Danno Parentale Roma", sottotitolo: "Tabelle del Tribunale di Roma 2025", icona: "heart" },
  { id: "risarcimento-inail", titolo: "Risarcimento INAIL", sottotitolo: "Infortunio sul lavoro o malattia professionale", icona: "alert-circle" },
  { id: "devalutazione", titolo: "Calcolo Devalutazione", sottotitolo: "Inverso della rivalutazione, tra due mesi", icona: "trending-down" },
  { id: "inflazione", titolo: "Calcolo Inflazione", sottotitolo: "Perdita di potere d'acquisto tra due periodi", icona: "trending-up" },
  { id: "rivalutazione-storica", titolo: "Rivalutazione Storica", sottotitolo: "Dal 1861 a oggi, Lire o Euro", icona: "trending-up" },
  { id: "rivalutazione-annuale-media", titolo: "Rivalutazione Annuale Media", sottotitolo: "Variazione media annua dell'indice FOI", icona: "trending-up" },
  { id: "coefficiente-rivalutazione-tfr", titolo: "Rivalutazione TFR", sottotitolo: "Coefficiente mensile di rivalutazione", icona: "percent" },
  { id: "ammortamento-mutuo", titolo: "Ammortamento Mutuo", sottotitolo: "Piano di rate, metodo francese o italiano", icona: "home" },
  { id: "surroga-mutuo", titolo: "Surroga Mutuo", sottotitolo: "Risparmio con il trasferimento a un nuovo tasso", icona: "repeat" },
  { id: "taeg", titolo: "Calcolo TAEG", sottotitolo: "Tasso Annuo Effettivo Globale di un finanziamento", icona: "percent" },
  { id: "compenso-ore", titolo: "Compenso a Ore", sottotitolo: "Somma di tempi e calcolo del compenso orario", icona: "clock" },
  { id: "ritenuta-acconto", titolo: "Ritenuta d'Acconto", sottotitolo: "Dal lordo al netto e viceversa", icona: "percent" },
  { id: "scorporo-importi", titolo: "Scorporo Importi", sottotitolo: "Fattura inversa da un importo forfettario", icona: "file-text" },
  { id: "fattura-avvocati", titolo: "Fattura Avvocati", sottotitolo: "Onorari, cassa forense, IVA, ritenuta e acconti", icona: "file-text" },
  { id: "fattura-professionisti", titolo: "Fattura Professionisti", sottotitolo: "Contributi, IVA e ritenuta, anche da importo omnicomprensivo", icona: "file-text" },
  { id: "fattura-enasarco", titolo: "Fattura Agente Enasarco", sottotitolo: "Provvigioni, contributo Enasarco e ritenuta d'acconto", icona: "briefcase" },
  { id: "ricevuta-occasionale", titolo: "Ricevuta Prestazione Occasionale", sottotitolo: "Ritenuta d'acconto e ritenuta INPS sul compenso", icona: "file-text" },
  { id: "tariffe-mediazione", titolo: "Tariffe Mediazione", sottotitolo: "Costi per parte, minimo e massimo (D.M. 180/2010)", icona: "users" },
  { id: "calcolo-preventivo", titolo: "Calcolo Preventivo", sottotitolo: "Voci con quantità, IVA e ritenuta d'acconto", icona: "list" },
  { id: "imu", titolo: "Calcolo IMU", sottotitolo: "Imposta municipale propria sugli immobili", icona: "home" },
  { id: "interessi-tasso-fisso", titolo: "Interessi a Tasso Fisso", sottotitolo: "Tasso scelto da te, con capitalizzazione facoltativa", icona: "percent" },
  { id: "tasso-usura", titolo: "Calcolo Tasso di Usura", sottotitolo: "Soglia di usura per tipologia, importo e trimestre", icona: "alert-triangle" },
  { id: "calcolo-scadenze", titolo: "Calcolo Scadenze", sottotitolo: "Scadenza a N giorni e giorni tra due date", icona: "calendar" },
  { id: "termini-183-190", titolo: "Termini 183 + 190 cpc", sottotitolo: "Memorie, comparsa conclusionale e replica", icona: "file-text" },
  { id: "diritti-copia", titolo: "Diritti di Copia", sottotitolo: "Cancelleria di tribunale e giudice di pace", icona: "copy" },
  { id: "diritti-copia-tributario", titolo: "Copie Processo Tributario", sottotitolo: "Diritti di copia nel processo tributario", icona: "copy" },
  { id: "gratuito-patrocinio", titolo: "Verifica Gratuito Patrocinio", sottotitolo: "Requisito reddituale, familiari e soglia dell'anno", icona: "check-circle" },
  { id: "aumenti-riduzioni-pena", titolo: "Aumenti/Riduzioni Pena", sottotitolo: "Fino a 4 variazioni consecutive della pena base", icona: "repeat" },
  { id: "grado-parentela", titolo: "Grado di Parentela", sottotitolo: "Parentela e affinità, in linea retta e collaterale", icona: "users" },
];

// Struttura ricalcata su un sito di riferimento esterno: le 9 macro-categorie del
// suo menu (vedi analisi comparativa), ciascuna con tutte le
// singole voci del sito. Una voce già coperta da un nostro calcolatore o
// atto è selezionabile e apre quello; le altre sono mostrate in grigio con
// etichetta "in arrivo" (non selezionabili), per rendere visibile a colpo
// d'occhio il lavoro ancora da fare, categoria per categoria.
// ---- Lotto A: tassi, termini, atti ----
const GIORNO_FMT = (iso: string, giorno?: string) => `${giorno ? giorno + " " : ""}${isoToDataIt(iso)}`;
const PCT_IT = (n: number) => `${n.toFixed(2).replace(".", ",")}%`;

const OPZIONI_USURA: { value: string; label: string }[] = [
  ...([
    [1, "1. Apertura di credito in conto corrente"], [11, "2. Scoperti senza affidamento"], [21, "3. Anticipi su crediti e sconti, anticipo fornitori"],
    [12, "4. Finanziamento alle imprese (fino a Mar/10)"], [13, "5. Credito personale"], [19, "6. Credito finalizzato"], [3, "7. Factoring"],
    [23, "8. Leasing immobiliare a tasso fisso"], [24, "9. Leasing immobiliare a tasso variabile"], [14, "10. Finanziamento bancario alle famiglie (fino a Mar/10)"],
    [18, "11. Leasing autoveicoli e aeronavale"], [15, "12. Finanziamento non bancario alle famiglie (fino a Mar/10)"], [16, "13. Leasing strumentale"],
    [9, "14. Mutuo a tasso fisso"], [10, "15. Mutuo a tasso variabile"], [6, "16. Cessione del quinto"], [17, "17. Leasing immobiliare (fino a Mar/11)"],
    [20, "18. Credito revolving"], [25, "19. Finanziamenti con carte di credito"], [22, "20. Altri finanziamenti"],
  ] as [number, string][]).map(([id, l]) => ({ value: `n:${id}`, label: `Da gennaio 2010 · ${l}` })),
  ...([
    [1, "1. Apertura di credito in conto corrente"], [2, "2. Finanziamento bancario alle imprese"], [4, "3. Finanziamento bancario personale o alla famiglia"],
    [3, "4. Factoring"], [5, "5. Finanziamento da intermediari non bancari"], [9, "6. Mutuo a tasso fisso"], [7, "7. Leasing"],
    [10, "8. Mutuo a tasso variabile"], [6, "9. Cessione del quinto"], [8, "10. Acquisto rateale beni di consumo e revolving"],
  ] as [number, string][]).map(([id, l]) => ({ value: `o:${id}`, label: `Fino al 2009 · ${l}` })),
];

const CONFIG_LOTTO_A: Record<string, ConfigGenerico> = {
  "interessi-tasso-fisso": {
    campi: [
      { tipo: "numero", key: "tasso", label: "Tasso %", default: "" },
      { tipo: "numero", key: "capitale", label: "Capitale €", default: "" },
      { tipo: "data", key: "data_inizio", label: "Data inizio" },
      { tipo: "data", key: "data_fine", label: "Data fine" },
      { tipo: "scelta", key: "capitalizzazione", label: "Capitalizzazione degli interessi", default: "0", opzioni: [
        { value: "0", label: "Nessuna capitalizzazione (sull'interesse accumulato non si calcola un ulteriore interesse)" },
        { value: "3", label: "Trimestrale (ogni 3 mesi l'interesse maturato si aggiunge al capitale)" },
        { value: "6", label: "Semestrale (ogni 6 mesi l'interesse maturato si aggiunge al capitale)" },
        { value: "12", label: "Annuale (ogni 12 mesi l'interesse maturato si aggiunge al capitale)" },
      ] },
    ],
    endpoint: "/calc/interessi-tasso-fisso",
    buildBody: (f) => ({
      capitale: parseNumeroIt(f.capitale), tasso: parseNumeroIt(f.tasso), data_inizio: f.data_inizio, data_fine: f.data_fine,
      capitalizzazione_mesi: parseInt(f.capitalizzazione, 10) || 0,
    }),
    risultato: (r) => [
      ...r.righe.map((x: any): [string, string] => [`${isoToDataIt(x.dal)} - ${isoToDataIt(x.al)} · ${x.giorni} gg · capitale ${formatEuro(x.capitale)} · ${PCT_IT(x.tasso)}`, formatEuro(x.interessi)]),
      ["Totale giorni", String(r.totale_giorni)],
      ["Totale interessi", formatEuro(r.totale_interessi)],
      ["Capitale + interessi", formatEuro(r.capitale_piu_interessi)],
    ],
  },
  "tasso-usura": {
    campi: [
      { tipo: "scelta", key: "operazione", label: "Finanziamento", default: "n:1", opzioni: OPZIONI_USURA, cercabile: true },
      { tipo: "numero", key: "importo", label: "Importo €", default: "" },
      { tipo: "numero", key: "tasso", label: "Tasso di interesse % (vuoto = solo soglia)", default: "" },
      { tipo: "mese_anno", key: "mese_inizio", label: "Mese di riferimento" },
      { tipo: "bool", key: "usa_fine", label: "Indica un mese finale (più trimestri)", default: false },
      { tipo: "mese_anno", key: "mese_fine", label: "Mese finale", mostraSe: (f) => !!f.usa_fine },
    ],
    endpoint: "/calc/tasso-usura",
    buildBody: (f) => ({
      operazione: parseInt(String(f.operazione).split(":")[1], 10), importo: parseNumeroIt(f.importo),
      tasso: f.tasso ? parseNumeroIt(f.tasso) : null, mese_inizio: f.mese_inizio, mese_fine: f.usa_fine ? f.mese_fine : null,
    }),
    risultato: (r) => (r.righe.length
      ? r.righe.map((x: any): [string, string] => [
        `${x.anno} · ${x.periodo}`,
        `Tasso medio ${PCT_IT(x.tasso_medio)} · Soglia ${PCT_IT(x.tasso_usura)}${x.supera === null ? "" : ` · Supera: ${x.supera ? "Sì" : "No"}`}`,
      ])
      : [["Nessun dato disponibile per la tipologia, l'importo e il periodo indicati", ""]]),
  },
  "calcolo-scadenze": {
    campi: [
      { tipo: "scelta", key: "modalita", label: "Cosa vuoi calcolare", default: "scadenza", opzioni: [
        { value: "scadenza", label: "Scadenza (aggiungere o togliere un numero di giorni)" },
        { value: "tra_date", label: "Giorni intercorrenti tra due date" },
      ] },
      { tipo: "data", key: "data_iniziale", label: "Data iniziale", mostraSe: (f) => f.modalita === "scadenza" },
      { tipo: "numero", key: "giorni", label: "Numero giorni (max 365 con la sospensione, 3650 senza)", default: "", mostraSe: (f) => f.modalita === "scadenza" },
      { tipo: "scelta", key: "direzione", label: "Prima o dopo la data iniziale", default: "dopo", mostraSe: (f) => f.modalita === "scadenza", opzioni: [
        { value: "prima", label: "Prima" }, { value: "dopo", label: "Dopo" },
      ] },
      { tipo: "bool", key: "sospensione_feriale", label: "Sospensione dei termini processuali (1-31 agosto)", default: true, mostraSe: (f) => f.modalita === "scadenza" },
      { tipo: "data", key: "data_a", label: "Data iniziale", mostraSe: (f) => f.modalita === "tra_date" },
      { tipo: "data", key: "data_b", label: "Data finale", mostraSe: (f) => f.modalita === "tra_date" },
    ],
    endpoint: (f) => (f.modalita === "tra_date" ? "/calc/giorni-intercorrenti" : "/calc/calcolo-scadenze"),
    buildBody: (f) => (f.modalita === "tra_date"
      ? { data_inizio: f.data_a, data_fine: f.data_b }
      : { data_iniziale: f.data_iniziale, giorni: Math.trunc(parseNumeroIt(f.giorni)), direzione: f.direzione, sospensione_feriale: !!f.sospensione_feriale }),
    risultato: (r) => {
      if (r.giorni !== undefined) return [["Giorni intercorrenti tra le due date", String(r.giorni)]];
      const out: [string, string][] = [["Data di scadenza calcolata", GIORNO_FMT(r.data_calcolata, r.giorno_settimana)]];
      if (r.festivita) out.push(["Festività", r.festivita]);
      if (r.festivo && r.data_non_festiva) {
        out.push([r.data_non_festiva > r.data_calcolata ? "Primo giorno successivo non festivo" : "Primo giorno precedente non festivo", GIORNO_FMT(r.data_non_festiva, r.giorno_non_festivo)]);
      }
      if (r.sospensione_covid_applicata) out.push(["Avviso", "Il termine tiene conto della sospensione straordinaria 2020 (emergenza coronavirus), dal 9 marzo all'11 maggio 2020."]);
      if (r.data_molto_lontana) out.push(["Nota", "Data molto lontana nel tempo"]);
      return out;
    },
    scadenze: (r) => (r.data_calcolata ? [{ titolo: "Scadenza calcolata", data: r.data_non_festiva || r.data_calcolata }] : []),
  },
  "termini-183-190": {
    campi: [
      { tipo: "data", key: "data_iniziale", label: "Data iniziale" },
      { tipo: "scelta", key: "operazione", label: "Calcolo", default: "183", opzioni: [
        { value: "183", label: "Memorie 183 (30 + 30 + 20 giorni)" },
        { value: "190", label: "Comparsa e Replica 190 (60 + 20 giorni)" },
      ] },
      { tipo: "bool", key: "sospensione_feriale", label: "Sospensione feriale", default: true },
      { tipo: "bool", key: "prudenziale", label: "Modalità prudenziale (il termine successivo decorre dalla scadenza non posticipata)", default: false },
    ],
    endpoint: "/calc/termini-183-190",
    buildBody: (f) => ({ data_iniziale: f.data_iniziale, operazione: f.operazione, sospensione_feriale: !!f.sospensione_feriale, prudenziale: !!f.prudenziale }),
    risultato: (r) => r.termini.flatMap((t: any): [string, string][] => [
      [`${t.etichetta}: ${t.giorni} giorni entro`, GIORNO_FMT(t.data, t.giorno_settimana)],
      ...t.giorni_saltati.map((s: any): [string, string] => [`   giorno saltato: il ${isoToDataIt(s.data)} è ${s.motivo}`, ""]),
    ]),
    scadenze: (r) => r.termini.map((t: any) => ({ titolo: t.etichetta, data: t.data })),
  },
  "diritti-copia": {
    campi: [
      { tipo: "scelta", key: "competenza", label: "Ufficio giudiziario", default: "tribunale", opzioni: [{ value: "tribunale", label: "Tribunale" }, { value: "giudice_di_pace", label: "Giudice di Pace" }] },
      { tipo: "numero", key: "numero_copie", label: "Numero copie", default: "1" },
      { tipo: "numero", key: "numero_pagine", label: "Numero pagine", default: "" },
      { tipo: "scelta", key: "formato", label: "Formato", default: "cartaceo", opzioni: [{ value: "cartaceo", label: "Cartaceo" }, { value: "elettronico", label: "Elettronico" }] },
      { tipo: "bool", key: "autentica", label: "Autentica", default: false, mostraSe: (f) => f.formato === "cartaceo" },
      { tipo: "bool", key: "urgente", label: "Urgente", default: false },
    ],
    endpoint: "/calc/diritti-copia",
    buildBody: (f) => ({
      competenza: f.competenza, numero_copie: parseNumeroIt(f.numero_copie), numero_pagine: parseNumeroIt(f.numero_pagine),
      formato: f.formato, autentica: f.formato === "cartaceo" && !!f.autentica, urgente: !!f.urgente,
    }),
    risultato: (r) => {
      const dettaglio = r.diritto_oltre_100_pagine == null ? formatEuro(r.diritti_per_copia) : `${formatEuro(r.diritto_base)} + ${formatEuro(r.diritto_oltre_100_pagine)} = ${formatEuro(r.diritti_per_copia)}`;
      return r.numero_copie > 1
        ? [["Diritti per ciascuna copia", dettaglio], [`Totale per ${r.numero_copie} copie`, formatEuro(r.totale)]]
        : [["Diritti di copia dovuti", dettaglio]];
    },
  },
  "diritti-copia-tributario": {
    campi: [
      { tipo: "numero", key: "numero_copie", label: "Numero copie", default: "1" },
      { tipo: "scelta", key: "formato", label: "Formato", default: "cartaceo", opzioni: [{ value: "cartaceo", label: "Cartaceo" }, { value: "elettronico", label: "Elettronico" }] },
      { tipo: "scelta", key: "origine", label: "Documento", default: "parti", mostraSe: (f) => f.formato === "elettronico", opzioni: [{ value: "parti", label: "Prodotto dalle parti" }, { value: "archivio", label: "Da archivio" }] },
      { tipo: "numero", key: "pagine", label: "N. pagine", default: "", mostraSe: (f) => f.formato === "cartaceo" || f.origine === "archivio" },
      { tipo: "numero", key: "kb", label: "KBytes", default: "", mostraSe: (f) => f.formato === "elettronico" && f.origine !== "archivio" },
      { tipo: "bool", key: "conformita", label: "Conformità (+ 9 € a copia)", default: false, mostraSe: (f) => f.formato === "cartaceo" },
    ],
    endpoint: "/calc/diritti-copia-tributario",
    buildBody: (f) => ({
      numero_copie: parseNumeroIt(f.numero_copie), formato: f.formato, origine: f.origine === "archivio" ? "archivio" : "parti",
      valore: parseNumeroIt(f.formato === "cartaceo" || f.origine === "archivio" ? f.pagine : f.kb), conformita: f.formato === "cartaceo" && !!f.conformita,
    }),
    risultato: (r) => {
      const dettaglio = r.diritto_oltre == null ? formatEuro(r.diritti_per_copia) : `${formatEuro(r.diritto_base)} + ${formatEuro(r.diritto_oltre)} = ${formatEuro(r.diritti_per_copia)}`;
      return r.numero_copie > 1
        ? [["Diritti per ciascuna copia", dettaglio], [`Totale per ${r.numero_copie} copie`, formatEuro(r.totale)]]
        : [["Diritti di copia dovuti", dettaglio]];
    },
  },
  "gratuito-patrocinio": {
    campi: [
      { tipo: "titolo", key: "t_proc", label: "Dati del procedimento" },
      { tipo: "scelta", key: "materia", label: "Materia del procedimento", default: "1", opzioni: [
        { value: "1", label: "Civile" }, { value: "2", label: "Penale" }, { value: "3", label: "Amministrativa" }, { value: "4", label: "Tributaria" },
        { value: "6", label: "Contabile" }, { value: "5", label: "Volontaria giurisdizione" }, { value: "7", label: "Mediazione" },
        { value: "8", label: "Negoziazione assistita" }, { value: "9", label: "Altra materia" },
      ] },
      { tipo: "scelta", key: "personalita", label: "Diritti della personalità", default: "0", opzioni: [{ value: "0", label: "No" }, { value: "1", label: "Sì" }] },
      { tipo: "titolo", key: "t_red", label: "Redditi del richiedente" },
      { tipo: "scelta", key: "anno", label: "Anno dei redditi", default: "2025", opzioni: Array.from({ length: 12 }, (_, i) => ({ value: String(2025 - i), label: String(2025 - i) })) },
      { tipo: "numero", key: "imponibile", label: "Reddito imponibile €", default: "" },
      { tipo: "numero", key: "esenti", label: "Redditi esenti €", default: "" },
      { tipo: "numero", key: "altri", label: "Altri redditi €", default: "" },
      {
        tipo: "scelta", key: "aumento_penale", label: "Aumento soglia penale", default: "1",
        opzioni: [{ value: "0", label: "No" }, { value: "1", label: "Sì" }], mostraSe: (f) => f.materia === "2",
      },
      { tipo: "lista", key: "familiari", label: "Familiari conviventi", etichettaAggiungi: "Nuovo familiare convivente", campiRiga: [
        { tipo: "testo", key: "nome", label: "Nome familiare" },
        { tipo: "scelta", key: "rapporto", label: "Rapporto familiare", default: "", opzioni: [
          { value: "", label: "Seleziona..." }, { value: "1", label: "Coniuge" }, { value: "2", label: "Unito civilmente" }, { value: "3", label: "Figlio" },
          { value: "4", label: "Genitore" }, { value: "5", label: "Fratello o sorella" }, { value: "9", label: "Altro familiare convivente" },
        ] },
        { tipo: "numero", key: "imponibile", label: "Reddito imponibile €" },
        { tipo: "numero", key: "esenti", label: "Redditi esenti €" },
        { tipo: "numero", key: "altri", label: "Altri redditi €" },
        { tipo: "scelta", key: "conflitto", label: "Familiare in conflitto", default: "0", opzioni: [{ value: "0", label: "No" }, { value: "1", label: "Sì" }] },
      ] },
    ],
    endpoint: "/calc/gratuito-patrocinio",
    validate: (f) => {
      const fam: Record<string, string>[] = f.familiari || [];
      return fam.some((x) => !x.rapporto) ? "Indica il rapporto familiare di ogni familiare convivente." : null;
    },
    buildBody: (f) => ({
      materia: parseInt(f.materia, 10), diritti_personalita: f.personalita === "1", anno_reddito: parseInt(f.anno, 10),
      reddito_imponibile: parseNumeroIt(f.imponibile), redditi_esenti: parseNumeroIt(f.esenti), altri_redditi: parseNumeroIt(f.altri),
      familiari: (f.familiari || []).map((x: Record<string, string>) => ({
        nome: x.nome || "", rapporto: parseInt(x.rapporto, 10), reddito_imponibile: parseNumeroIt(x.imponibile),
        redditi_esenti: parseNumeroIt(x.esenti), altri_redditi: parseNumeroIt(x.altri), in_conflitto: x.conflitto === "1",
      })),
      applica_aumento_penale: f.aumento_penale !== "0",
    }),
    risultato: (r) => [
      ["PARAMETRI INSERITI", ""],
      ...r.parametri.map(([k, v]: [string, string]): [string, string] => [k, v]),
      ...(r.familiari.length ? [["FAMILIARI CONVIVENTI INDICATI", ""] as [string, string]] : []),
      ...r.familiari.map((f: any): [string, string] => [
        `${f.nome} (${f.rapporto})${f.conflitto ? " · in conflitto" : ""}`,
        `Imponibile ${formatEuro(f.imponibile)} · Esenti ${formatEuro(f.esenti)} · Altri ${formatEuro(f.altri)} · Totale ${formatEuro(f.totale)}`,
      ]),
      ["SVILUPPO DEL CALCOLO", ""],
      ...r.sviluppo.map(([k, v]: [string, string]): [string, string] => [k, v]),
      ["CONCLUSIONI", ""],
      ...r.conclusioni.map((c: string): [string, string] => [c, ""]),
      ["NOTE", ""],
      ...r.note.map((c: string): [string, string] => [c, ""]),
    ],
  },
};
Object.assign(CONFIG_GENERICI, CONFIG_LOTTO_A);

type VoceMenuCalcolatori =
  | { nome: string; tipo: "calcolatore"; calcId: CalcId }
  | { nome: string; tipo: "atto"; attoId: AttoId }
  | { nome: string; tipo: "in_arrivo" };

type CategoriaMenuCalcolatori = { id: string; titolo: string; icona: string; voci: VoceMenuCalcolatori[] };

const CATEGORIE_MENU_CALCOLATORI: CategoriaMenuCalcolatori[] = [
  {
    id: "rivalutazioni-istat", titolo: "Rivalutazioni Istat", icona: "trending-up",
    voci: [
      { nome: "Rivalutazione e Interessi", tipo: "calcolatore", calcId: "rivalutazione-istat" },
      { nome: "Rivalutazione Mensile", tipo: "calcolatore", calcId: "rivalutazione-mensile" },
      { nome: "Interessi Vari sul Capitale Rivalutato", tipo: "calcolatore", calcId: "interessi-vari-capitale-rivalutato" },
      { nome: "Adeguamento Canone", tipo: "calcolatore", calcId: "adeguamento-canone" },
      { nome: "Lettera Adeguamento Canone Locazione", tipo: "in_arrivo" },
      { nome: "Calcolo Devalutazione", tipo: "calcolatore", calcId: "devalutazione" },
      { nome: "Rivalutazione Storica", tipo: "calcolatore", calcId: "rivalutazione-storica" },
      { nome: "Variazioni Storiche Istat", tipo: "in_arrivo" },
      { nome: "Tabella Variazioni Istat", tipo: "in_arrivo" },
      { nome: "Ultimo Indice Istat", tipo: "in_arrivo" },
      { nome: "Rivalutazione Annuale Media", tipo: "calcolatore", calcId: "rivalutazione-annuale-media" },
      { nome: "Rivalutazione TFR", tipo: "calcolatore", calcId: "coefficiente-rivalutazione-tfr" },
      { nome: "Calcolo Inflazione", tipo: "calcolatore", calcId: "inflazione" },
      { nome: "Inflazione e Titoli di Stato", tipo: "in_arrivo" },
    ],
  },
  {
    id: "tassi-interessi", titolo: "Tassi e Interessi", icona: "percent",
    voci: [
      { nome: "Calcolo Interessi Legali", tipo: "calcolatore", calcId: "interessi-legali" },
      { nome: "Calcolo Interessi di Mora", tipo: "calcolatore", calcId: "interessi-mora" },
      { nome: "Interessi a Tasso Fisso", tipo: "calcolatore", calcId: "interessi-tasso-fisso" },
      { nome: "Interessi e Acconti", tipo: "calcolatore", calcId: "interessi-acconti" },
      { nome: "Calcolo Maggior Danno", tipo: "calcolatore", calcId: "maggior-danno" },
      { nome: "Interessi 1284 cc", tipo: "calcolatore", calcId: "interessi-corso-causa" },
      { nome: "Calcolo Ammortamento", tipo: "calcolatore", calcId: "ammortamento-mutuo" },
      { nome: "Calcolo Surroga", tipo: "calcolatore", calcId: "surroga-mutuo" },
      { nome: "Calcolo Tasso di Usura", tipo: "calcolatore", calcId: "tasso-usura" },
      { nome: "Calcolo TAEG", tipo: "calcolatore", calcId: "taeg" },
      { nome: "Tabella Interessi Legali", tipo: "in_arrivo" },
      { nome: "Tabella Interessi di Mora", tipo: "in_arrivo" },
      { nome: "Interessi Mora Appalti", tipo: "calcolatore", calcId: "interessi-mora-appalti" },
      { nome: "Tabella Tassi Appalti", tipo: "in_arrivo" },
    ],
  },
  {
    id: "scadenze-termini", titolo: "Scadenze e Termini", icona: "clock",
    voci: [
      { nome: "Calcolo Scadenze", tipo: "calcolatore", calcId: "calcolo-scadenze" },
      { nome: "Termini Processuali Civili", tipo: "calcolatore", calcId: "scadenze" },
      { nome: "Termini Memorie e Repliche", tipo: "calcolatore", calcId: "termini-memorie" },
      { nome: "Termini Separazione e Divorzio", tipo: "calcolatore", calcId: "termini-separazione-divorzio" },
      { nome: "Termini Procedimento Semplificato", tipo: "calcolatore", calcId: "termini-procedimento-semplificato" },
      { nome: "Termini 183 + 190 cpc", tipo: "calcolatore", calcId: "termini-183-190" },
      { nome: "Termini Esecuzioni", tipo: "calcolatore", calcId: "termini-esecuzioni" },
      { nome: "Termini Deposito Atti Appello", tipo: "calcolatore", calcId: "termini-deposito-appello" },
      { nome: "Scadenze Impugnazioni", tipo: "calcolatore", calcId: "termini-impugnazione" },
      { nome: "Scadenze Multe", tipo: "calcolatore", calcId: "scadenze-multe" },
      { nome: "Termini Deposito CTU", tipo: "calcolatore", calcId: "termini-deposito-ctu" },
    ],
  },
  {
    id: "atti-giudiziari", titolo: "Atti Giudiziari", icona: "file-text",
    voci: [
      { nome: "Calcolo Contributo Unificato", tipo: "calcolatore", calcId: "contributo-unificato" },
      { nome: "Tabella Contributo Unificato", tipo: "in_arrivo" },
      { nome: "Calcolo Diritti di Copia", tipo: "calcolatore", calcId: "diritti-copia" },
      { nome: "Copie Processo Tributario", tipo: "calcolatore", calcId: "diritti-copia-tributario" },
      { nome: "Fascicolo di Parte", tipo: "in_arrivo" },
      { nome: "Procura alle Liti", tipo: "atto", attoId: "procura_alle_liti" },
      { nome: "Attestazione Conformità", tipo: "in_arrivo" },
      { nome: "Relata Notifica PEC", tipo: "in_arrivo" },
      { nome: "Deposito Telematico Documenti", tipo: "in_arrivo" },
      { nome: "Visibilità Fascicolo Telematico", tipo: "in_arrivo" },
      { nome: "Note di Trattazione Scritta", tipo: "in_arrivo" },
      { nome: "Sollecito di Pagamento", tipo: "atto", attoId: "messa_in_mora" },
      { nome: "Decreto Ingiuntivo", tipo: "in_arrivo" },
      { nome: "Sfratto per Morosità", tipo: "in_arrivo" },
      { nome: "Atto di Precetto", tipo: "in_arrivo" },
      { nome: "Nota di Precisazione del Credito", tipo: "in_arrivo" },
      { nome: "Pignoramento stipendio o pensione", tipo: "calcolatore", calcId: "pignoramento-stipendio-pensione" },
      { nome: "Dichiarazione 553 cpc", tipo: "in_arrivo" },
      { nome: "Indice Allegati", tipo: "in_arrivo" },
      { nome: "Cerca ufficio giudiziario competente", tipo: "in_arrivo" },
      { nome: "Ricerca uffici UNEP", tipo: "in_arrivo" },
      { nome: "Note Iscrizione Ruolo", tipo: "in_arrivo" },
      { nome: "Codici Iscrizione Ruolo", tipo: "in_arrivo" },
      { nome: "Calcolo Impronta Hash", tipo: "in_arrivo" },
      { nome: "Controllo Cause a Ruolo", tipo: "in_arrivo" },
      { nome: "Tassazione Atti Giudiziari", tipo: "in_arrivo" },
      { nome: "Testimonianza Scritta (257-bis cpc)", tipo: "in_arrivo" },
      { nome: "Verifica Gratuito Patrocinio", tipo: "calcolatore", calcId: "gratuito-patrocinio" },
      { nome: "Codice di Procedura Civile", tipo: "in_arrivo" },
      { nome: "Codice della Strada", tipo: "in_arrivo" },
    ],
  },
  {
    id: "fatturazione-avvocati", titolo: "Fatturazione Avvocati", icona: "dollar-sign",
    voci: [
      { nome: "Preventivo Cause Civili", tipo: "calcolatore", calcId: "parcelle" },
      { nome: "Preventivo Attività Stragiudiziali", tipo: "calcolatore", calcId: "preventivo-stragiudiziale" },
      { nome: "Fattura Elettronica Avvocati", tipo: "in_arrivo" },
      { nome: "Visualizzatore Fatture Elettroniche", tipo: "in_arrivo" },
      { nome: "Scorporo Importi", tipo: "calcolatore", calcId: "scorporo-importi" },
      { nome: "Fattura Avvocati", tipo: "calcolatore", calcId: "fattura-avvocati" },
      { nome: "Parametri 2014 Civile", tipo: "calcolatore", calcId: "parametri-forensi" },
      { nome: "Parametri 2014 Penale", tipo: "calcolatore", calcId: "parametri-penali-2014" },
      { nome: "Parametri Stragiudiziali", tipo: "calcolatore", calcId: "parametri-stragiudiziali" },
      { nome: "Spese Trasferta Avvocati", tipo: "calcolatore", calcId: "spese-trasferta-avvocati" },
      { nome: "Tabelle Parametri", tipo: "in_arrivo" },
      { nome: "Parametri 2012 Civile", tipo: "calcolatore", calcId: "parametri-civili-2012" },
      { nome: "Parametri 2012 Penale", tipo: "calcolatore", calcId: "parametri-penali-2012" },
      { nome: "Tariffe Forensi 2004", tipo: "in_arrivo" },
      { nome: "Calcolo Nota Spese", tipo: "calcolatore", calcId: "nota-spese-tariffe-2004" },
      { nome: "Modelli di Notula", tipo: "in_arrivo" },
      { nome: "Calcolo Notula Penale", tipo: "calcolatore", calcId: "notula-penale-tariffario-2004" },
    ],
  },
  {
    id: "parcelle-professionisti", titolo: "Parcelle Professionisti", icona: "briefcase",
    voci: [
      { nome: "Fattura Elettronica", tipo: "in_arrivo" },
      { nome: "Visualizza Messaggi SDI", tipo: "in_arrivo" },
      { nome: "Fattura Professionisti", tipo: "calcolatore", calcId: "fattura-professionisti" },
      { nome: "Calcolo Compenso CTU", tipo: "calcolatore", calcId: "compenso-ctu" },
      { nome: "Compenso Curatore Fallimentare", tipo: "calcolatore", calcId: "compenso-curatore-fallimentare" },
      { nome: "Compenso Delegati Vendite Giudiziarie", tipo: "calcolatore", calcId: "compenso-delegati-vendite" },
      { nome: "Compenso Mediatore Familiare", tipo: "calcolatore", calcId: "compenso-mediatore-familiare" },
      { nome: "Calcolo Fattura Enasarco", tipo: "calcolatore", calcId: "fattura-enasarco" },
      { nome: "Ricevuta Prestazione Occasionale", tipo: "calcolatore", calcId: "ricevuta-occasionale" },
      { nome: "Calcolo Spese di Mediazione", tipo: "calcolatore", calcId: "compenso-mediazione" },
      { nome: "Tariffe Mediazione", tipo: "calcolatore", calcId: "tariffe-mediazione" },
      { nome: "Calcolo Compenso a Ore", tipo: "calcolatore", calcId: "compenso-ore" },
      { nome: "Calcolo Rimborso Chilometrico ACI", tipo: "in_arrivo" },
      { nome: "Calcolo Ritenuta d'Acconto", tipo: "calcolatore", calcId: "ritenuta-acconto" },
      { nome: "Calcolo Preventivo", tipo: "calcolatore", calcId: "calcolo-preventivo" },
      { nome: "Calcolatrice Online", tipo: "in_arrivo" },
    ],
  },
  {
    id: "risarcimento-danni", titolo: "Risarcimento Danni", icona: "alert-circle",
    voci: [
      { nome: "Calcolo Danno Biologico (lieve entità)", tipo: "calcolatore", calcId: "danno-biologico-lieve-entita" },
      { nome: "Calcolo Risarcimento Danno Tabella Unica", tipo: "calcolatore", calcId: "danno-biologico-macropermanenti" },
      { nome: "Danno non Patrimoniale", tipo: "in_arrivo" },
      { nome: "Danno Parentale Roma", tipo: "calcolatore", calcId: "danno-perdita-parentale-roma" },
      { nome: "Danno Parentale Milano", tipo: "calcolatore", calcId: "danno-perdita-parentale-milano" },
      { nome: "Calcolo Menomazioni Plurime", tipo: "calcolatore", calcId: "menomazioni-plurime" },
      { nome: "Risarcimento INAIL", tipo: "calcolatore", calcId: "risarcimento-inail" },
      { nome: "Calcolo Equo Indennizzo", tipo: "calcolatore", calcId: "equo-indennizzo" },
      { nome: "Tabelle Danno Biologico", tipo: "in_arrivo" },
      { nome: "Tabella Unica Macropermanenti", tipo: "in_arrivo" },
      { nome: "Tabelle Milano e Roma", tipo: "in_arrivo" },
      { nome: "Tabella delle Menomazioni", tipo: "in_arrivo" },
    ],
  },
  {
    id: "diritto-penale", titolo: "Diritto Penale", icona: "alert-octagon",
    voci: [
      { nome: "Aumenti/Riduzioni Pena", tipo: "calcolatore", calcId: "aumenti-riduzioni-pena" },
      { nome: "Conversione Pena", tipo: "calcolatore", calcId: "conversione-pena" },
      { nome: "Calcolo Fine Pena", tipo: "calcolatore", calcId: "fine-pena" },
      { nome: "Calcolo Prescrizione Reati", tipo: "calcolatore", calcId: "prescrizione-reati" },
      { nome: "Codice di Procedura Penale", tipo: "in_arrivo" },
    ],
  },
  {
    id: "proprieta-successioni", titolo: "Proprietà, Successioni", icona: "home",
    voci: [
      { nome: "Calcolo Eredità", tipo: "calcolatore", calcId: "quote-ereditarie" },
      { nome: "Calcolo Imposte di Successione", tipo: "calcolatore", calcId: "imposta-successione" },
      { nome: "Calcolo Usufrutto", tipo: "calcolatore", calcId: "usufrutto" },
      { nome: "Coefficienti Usufrutto", tipo: "in_arrivo" },
      { nome: "Pensione di Reversibilità", tipo: "in_arrivo" },
      { nome: "Grado di Parentela", tipo: "calcolatore", calcId: "grado-parentela" },
      { nome: "Calcolo IMU", tipo: "calcolatore", calcId: "imu" },
      { nome: "Calcolo Valore Catastale", tipo: "calcolatore", calcId: "valore-catastale" },
      { nome: "Categorie Catastali", tipo: "in_arrivo" },
      { nome: "Ricerca Codici Catastali", tipo: "in_arrivo" },
      { nome: "Calcolo Superficie Commerciale", tipo: "in_arrivo" },
      { nome: "Imposte Compravendita", tipo: "calcolatore", calcId: "imposte-compravendita-immobiliare" },
      { nome: "Calcolo Cedolare Secca", tipo: "in_arrivo" },
      { nome: "Tassa Registro Locazioni", tipo: "calcolatore", calcId: "tassa-registro-locazione" },
      { nome: "Spese Condominiali", tipo: "in_arrivo" },
    ],
  },
];

// Calcolatori nostri che non hanno una voce corrispondente in nessuna delle
// 9 categorie sopra (il loro equivalente, quando esiste, sta in una
// macro-categoria del sito di riferimento non coperta da questa ristrutturazione — es.
// "Giorni tra due date" sta sotto "Applicazioni Varie"): restano comunque
// raggiungibili da qui, in una categoria a parte.
const ALTRI_CALCOLATORI: VoceMenuCalcolatori[] = [
  { nome: "Prescrizione e decadenza", tipo: "calcolatore", calcId: "prescrizione" },
  { nome: "Termini di comparizione in citazione", tipo: "calcolatore", calcId: "termini-citazione" },
  { nome: "Opposizione a decreto ingiuntivo", tipo: "calcolatore", calcId: "opposizione-decreto-ingiuntivo" },
  { nome: "Impugnazione licenziamento", tipo: "calcolatore", calcId: "impugnazione-licenziamento" },
  { nome: "Ricorso tributario", tipo: "calcolatore", calcId: "ricorso-tributario" },
  { nome: "Ricorso al TAR", tipo: "calcolatore", calcId: "ricorso-tar" },
  { nome: "Termine per la querela", tipo: "calcolatore", calcId: "termine-querela" },
  { nome: "Disdetta di locazione", tipo: "calcolatore", calcId: "disdetta-locazione" },
  { nome: "Giorni tra due date", tipo: "calcolatore", calcId: "giorni-tra-date" },
  { nome: "Calcolo Età Anagrafica", tipo: "calcolatore", calcId: "eta-anagrafica" },
  { nome: "Giorni Lavorativi e Festivi", tipo: "calcolatore", calcId: "aggiungi-giorni-lavorativi" },
];

// Periodicità di capitalizzazione per gli interessi legali, come nel
// calcolatore di riferimento (4 opzioni, date fisse: 1/1 per tutte, più 1/4-1/7-1/10 a seconda della
// periodicità — vedi MESI_CAPITALIZZAZIONE nel backend).
const CAPITALIZZAZIONI = [
  { value: "nessuna", label: "Nessuna capitalizzazione" },
  { value: "trimestrale", label: "Trimestrale (1/1, 1/4, 1/7, 1/10)" },
  { value: "semestrale", label: "Semestrale (1/1, 1/7)" },
  { value: "annuale", label: "Annuale (1/1)" },
];

// Contributo unificato, come nel calcolatore di riferimento: processo (civile/tributario/
// amministrativo) + giudizio + tipo di valore, più riduzione 50% (solo
// civile) e procedimenti a contributo fisso indipendenti dal resto — v.
// CU_* nel backend per le fonti verificate dietro ogni importo.
const PROCESSI_CU = [
  { value: "civile", label: "Civile" },
  { value: "tributario", label: "Tributario" },
  { value: "amministrativo", label: "Amministrativo" },
];
const GIUDIZI_CU = [
  { value: "primo_grado", label: "Primo grado" },
  { value: "impugnazione", label: "Impugnazione" },
  { value: "cassazione", label: "Cassazione" },
];
// Il processo amministrativo non ha un vero grado di Cassazione ai fini del
// contributo unificato (art. 13 comma 6-bis DPR 115/2002: solo TAR e
// Consiglio di Stato).
const GIUDIZI_CU_AMMINISTRATIVO = [
  { value: "primo_grado", label: "Primo grado (TAR)" },
  { value: "impugnazione", label: "Impugnazione (Consiglio di Stato)" },
];
const VALORE_TIPI_CU_CIVILE = [
  { value: "determinato", label: "Valore determinato" },
  { value: "indeterminabile", label: "Valore indeterminabile" },
];
const VALORE_TIPI_CU_TRIBUTARIO = [
  { value: "determinato", label: "Valore determinato" },
  { value: "indeterminabile", label: "Valore indeterminabile" },
  { value: "non_indicato", label: "Valore non indicato" },
];
const VALORE_TIPI_CU_APPALTI = [
  { value: "determinato", label: "Valore determinato" },
  { value: "non_indicato", label: "Valore non dichiarato" },
];
const UFFICI_CU = [
  { value: "tribunale", label: "Tribunale" },
  { value: "giudice_di_pace", label: "Giudice di pace" },
];
// Elenco non esaustivo dei riti amministrativi a importo fisso: solo le
// voci verificate con fonti indipendenti (v. CU_AMMINISTRATIVO_FISSO nel
// backend).
const RITI_AMMINISTRATIVI_CU = [
  { value: "ricorso_ordinario", label: "Ricorso ordinario / straordinario al Presidente della Repubblica" },
  { value: "accesso_silenzio_ottemperanza_cittadinanza", label: "Accesso agli atti, silenzio, ottemperanza, cittadinanza, residenza/soggiorno" },
  { value: "pubblico_impiego", label: "Pubblico impiego (inclusi concorsi)" },
  { value: "rito_abbreviato", label: "Rito abbreviato (art. 119 c.p.a.)" },
  { value: "appalti_pubblici", label: "Appalti pubblici / Autorità indipendenti" },
];
// Elenco volutamente parziale: solo la procedura fallimentare è verificata
// con fonti indipendenti concordanti (v. CU_PROCEDURE_FISSE nel backend).
const PROCEDURE_FISSE_CU = [
  { value: "", label: "Nessuna (usa processo/giudizio/valore)" },
  { value: "fallimento_istanza", label: "Istanza di fallimento" },
  { value: "fallimento_intera_procedura", label: "Intera procedura fallimentare" },
  { value: "fallimento_insinuazione_passivo", label: "Insinuazione al passivo (esente)" },
];

// Rivalutazione ISTAT: le stesse 3 modalità del calcolatore di riferimento
// (nessuna capitalizzazione/anatocismo in nessuna delle tre).
const MODALITA_ISTAT = [
  { value: "rivalutazione_interessi", label: "Rivalutazione + interessi legali" },
  { value: "solo_interessi", label: "Solo interessi legali (senza rivalutazione)" },
  { value: "sola_rivalutazione", label: "Sola rivalutazione (senza interessi)" },
];

const PERCENTUALI_CANONE = [
  { value: "75", label: "75% (locazioni abitative ordinarie, se la clausola lo prevede — art. 32 L. 392/1978)" },
  { value: "100", label: "100% (locazioni diverse da abitazione, assegni di mantenimento)" },
  { value: "altro", label: "Altra percentuale da contratto" },
];

// Interessi Vari sul Capitale Rivalutato (AND-003): tipo di interesse +
// due modalità di rivalutazione sul montante + convenzione di calcolo dei
// giorni, come nel calcolatore di riferimento.
const TIPI_INTERESSE_VARI = [
  { value: "legali", label: "Legali" },
  { value: "moratori", label: "Di mora (D.Lgs. 231/2002)" },
  { value: "tasso_fisso", label: "A tasso fisso" },
];
const BASI_RIVALUTAZIONE_VARI = [
  { value: "iniziale_fissa", label: "Mese e anno iniziali (confronto a due punti, applicato a fine periodo)" },
  { value: "anno_precedente", label: "Stesso mese dell'anno precedente (rivalutazione annua composta sul montante)" },
];
const GIORNI_INIZIALI_VARI = [
  { value: "escluso", label: "Escluso (conta dal giorno successivo)" },
  { value: "compreso", label: "Compreso" },
];
const CONVENZIONI_GIORNI_VARI = [
  { value: "civile", label: "Civile (365 fisso, anche negli anni bisestili)" },
  { value: "effettivo", label: "Effettivo (365 o 366 secondo il calendario reale)" },
  { value: "giuliano", label: "Giuliano (365,25)" },
];

// 7 voci come nel calcolatore di riferimento (stesse aliquote/franchigie di prima, solo
// etichette più granulari — v. GRADI_PARENTELA_SUCCESSIONE nel backend).
// Sezione "tabellare" del compenso CTU (DM 182/2002), come nel calcolatore
// di riferimento: elenco degli articoli/sottovoci selezionabili. "richiedeValore" = true
// per le prestazioni a percentuale/scaglioni (serve il "Valore Stimato"),
// false per quelle a tariffa fissa — v. ARTICOLI_DM182_2002 nel backend
// per le fonti e i valori numerici verificati.
const ARTICOLI_DM182 = [
  { value: "2", label: "Art. 2 — Perizia contabile/fiscale/amministrativa", richiedeValore: true },
  { value: "3", label: "Art. 3 — Valutazione aziende, patrimoni, avviamento, beni mobili", richiedeValore: true },
  { value: "4_A", label: "Art. 4.A — Bilanci, sul totale delle attività", richiedeValore: true },
  { value: "4_B", label: "Art. 4.B — Bilanci, sul totale dei ricavi lordi", richiedeValore: true },
  { value: "5", label: "Art. 5 — Inventari, rendiconti, situazioni contabili", richiedeValore: false },
  { value: "6_1", label: "Art. 6.1 — Avarie comuni", richiedeValore: true },
  { value: "6_2", label: "Art. 6.2 — Avarie particolari", richiedeValore: true },
  { value: "7_1", label: "Art. 7.1 — Metodo attuariale (posizioni retributive/previdenziali)", richiedeValore: false },
  { value: "7_2", label: "Art. 7.2 — Basi tecniche gestioni previdenziali/assistenziali", richiedeValore: false },
  { value: "8_1", label: "Art. 8.1 — Equilibrio tecnico-finanziario gestioni previdenziali", richiedeValore: true },
  { value: "8_2", label: "Art. 8.2 — Analisi bilanci enti previdenziali/assicurativi/finanziari", richiedeValore: true },
  { value: "9", label: "Art. 9 — Opere di pittura, scultura e simili", richiedeValore: false },
  { value: "10", label: "Art. 10 — Retribuzioni, contributi, rapporto di lavoro", richiedeValore: false },
  { value: "11", label: "Art. 11 — Costruzioni edilizie, impianti, infrastrutture", richiedeValore: true },
  { value: "12_1", label: "Art. 12.1 — Verifica rispondenza tecnica, collaudi, contabilità lavori", richiedeValore: false },
  { value: "12_2", label: "Art. 12.2 — Rilievi topografici, planimetrici, altimetrici", richiedeValore: false },
  { value: "13_1", label: "Art. 13.1 — Estimo (perizia estimativa completa)", richiedeValore: true },
  { value: "13_2", label: "Art. 13.2 — Estimo, stima sommaria", richiedeValore: true },
  { value: "13_3", label: "Art. 13.3 — Estimo, semplice giudizio di stima", richiedeValore: true },
  { value: "14", label: "Art. 14 — Cave e miniere, minerali, sostanze solide/liquide/gassose", richiedeValore: true },
  { value: "15_1", label: "Art. 15.1 — Aerei, navi, imbarcazioni: valutazione/riparazione, salvataggio", richiedeValore: true },
  { value: "15_2", label: "Art. 15.2 — Aerei, navi, imbarcazioni: valutazione danni", richiedeValore: true },
  { value: "16", label: "Art. 16 — Funzioni contabili, equo canone, danni incendio/grandine, millesimali", richiedeValore: false },
  { value: "17", label: "Art. 17 — Infortunistica del traffico e della circolazione", richiedeValore: true },
  { value: "18_1", label: "Art. 18.1 — Esplosivi, armi, proiettili, bossoli", richiedeValore: false },
  { value: "18_3", label: "Art. 18.3 — Balistica", richiedeValore: false },
  { value: "19", label: "Art. 19 — Geomorfologia, idrogeologia, geologia applicata", richiedeValore: false },
  { value: "21", label: "Art. 21 — Accertamenti medici, diagnostici, agenti patogeni (persona)", richiedeValore: false },
  { value: "24", label: "Art. 24 — Materia psichiatrica o criminologica", richiedeValore: false },
  { value: "25", label: "Art. 25 — Diagnosi su materiale biologico / tracce biologiche", richiedeValore: false },
  { value: "28_1", label: "Art. 28.1 — Chimica-tossicologica (ricerca generale incognita)", richiedeValore: false },
  { value: "28_2", label: "Art. 28.2 — Ecotossicologica", richiedeValore: false },
  { value: "28_3", label: "Art. 28.3 — Inquinamento acustico", richiedeValore: false },
];
const ARTICOLI_DM182_CON_NESSUNO = [{ value: "", label: "Nessuno (solo vacazioni)" }, ...ARTICOLI_DM182];
const TARIFFE_PREDEFINITE_CTU = [
  { value: "minima", label: "Minima" },
  { value: "media", label: "Media" },
  { value: "massima", label: "Massima" },
];

const GRADI_SUCCESSIONE = [
  { id: "coniuge", label: "Coniuge" },
  { id: "discendenti_retta", label: "Discendente in linea retta (figlio, nipote ecc.)" },
  { id: "ascendenti_retta", label: "Ascendente in linea retta (genitore, nonno ecc.)" },
  { id: "fratelli_sorelle", label: "Fratello o sorella" },
  { id: "parenti_4grado", label: "Parente fino al quarto grado" },
  { id: "affini_3grado", label: "Affine fino al terzo grado" },
  { id: "altri_soggetti", label: "Altro soggetto diverso dai precedenti" },
] as const;

// Riepilogo di più valori (es. "Capitale: ... · Rivalutazione: ...") come una
// riga di "pillole" che va a capo liberamente, invece di un'unica stringa
// concatenata con "·" che su importi lunghi o schermi stretti può uscire dal
// bordo della card invece di andare a capo in modo leggibile.
function RiepilogoChips({ voci, color, fontSize = 12 }: { voci: { label: string; value: string }[]; color: string; fontSize?: number }) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 4 }}>
      {voci.map((v, i) => (
        <Text key={i} style={{ color, fontSize, marginRight: 10, marginTop: 2 }}>
          {v.label}: {v.value}
        </Text>
      ))}
    </View>
  );
}

export default function Calcolatori() {
  const { t } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams<{ tab?: string; _t?: string; editId?: string; praticaId?: string }>();
  // L'unico caso che resta "a schermo diretto" (senza passare dal picker) è
  // la modifica di una parcella esistente, raggiunta da Archivio o dalla
  // scheda pratica: non è una "creazione" e non fa parte di questa
  // unificazione. Tutte le altre creazioni passano dal picker qui sotto.
  const locked = params.tab === "parcelle" && !!params.editId;
  const isEditingPar = !!params.editId;
  const [calcAperto, setCalcAperto] = React.useState<CalcId | null>(locked ? "parcelle" : null);
  const [categoriaCalc, setCategoriaCalc] = React.useState<string | null>(null);
  const scrollRef = React.useRef<ScrollView>(null);

  // La schermata resta montata da una visita all'altra: se si arriva qui di
  // nuovo (anche con lo stesso editId di prima, grazie a params._t che
  // cambia ad ogni click) riparte sempre dal picker o dalla modifica
  // giusta, invece di restare dov'era stata lasciata l'ultima volta.
  React.useEffect(() => {
    setCalcAperto(params.tab === "parcelle" && params.editId ? "parcelle" : null);
    if (params.praticaId) setPraticaId(params.praticaId);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [params.tab, params.editId, params.praticaId, params._t]);

  // Scadenze
  const [dataPartenza, setDataPartenza] = React.useState(new Date().toISOString().slice(0, 10));
  const [giorni, setGiorni] = React.useState("30");
  const [tipoS, setTipoS] = React.useState<"avanti" | "ritroso">("avanti");
  const [unita, setUnita] = React.useState<"giorni" | "mesi" | "anni">("giorni");
  const [escludiFer, setEscludiFer] = React.useState(true);
  const [escludiCovid, setEscludiCovid] = React.useState(false);
  const [terminLibero, setTerminLibero] = React.useState(false);
  const [ritoTermini, setRitoTermini] = React.useState<"nuovo" | "vecchio">("nuovo");
  // Voci notevoli del c.p.c. (come il selettore del calcolatore di riferimento):
  // precompilano termine/unità/direzione; tutti e tre restano poi bloccati
  // finché la voce è selezionata (si sbloccano solo se quella precisa voce
  // non fissa un valore per quel campo), come in quel calcolatore — la voce si
  // sceglie o si inserisce il termine a mano, non entrambi insieme.
  // Stesso SelectInput cercabile usato per l'elenco di prescrizione e
  // decadenza: niente apertura/chiusura a mano, evita il bug per cui uno
  // scroll veloce nell'elenco a gestione custom chiudeva la tendina.
  const [terminiCpc, setTerminiCpc] = React.useState<any[]>([]);
  const [voceCpcSelezionata, setVoceCpcSelezionata] = React.useState<any>(null);
  const [risScad, setRisScad] = React.useState<any>(null);
  const [titoloScad, setTitoloScad] = React.useState("");
  const [oraScad, setOraScad] = React.useState<string | null>(null);
  const [promemoria, setPromemoria] = React.useState<number[]>([1]);
  const [pratiche, setPratiche] = React.useState<any[]>([]);
  const [praticaId, setPraticaId] = React.useState<string | null>(params.praticaId || null);
  // Parcelle
  const [par, setPar] = React.useState<any>({
    fase_studio: "", fase_introduttiva: "", fase_istruttoria: "", fase_decisionale: "",
    adj_studio_pct: "0", adj_introduttiva_pct: "0", adj_istruttoria_pct: "0", adj_decisionale_pct: "0",
    spese_generali_pct: "15", cpa_pct: "4", iva_pct: "22", ritenuta_pct: "0",
  });
  // Sezione "personalizzata": voci libere descrizione+importo, come il form
  // originale prima dell'allineamento al calcolatore di riferimento — tenute separate dalla
  // sezione automatica (le 4 fasi dei parametri forensi).
  const [vociCustom, setVociCustom] = React.useState<{ descrizione: string; importo: string }[]>([]);
  // Campi non numerici del preventivo (sezioni Avvocato/Procedimento/Altri
  // dati del calcolatore di riferimento — le parti assistite sono in `partiAssistite`, sotto):
  // tenuti separati da `par` perché quest'ultimo viene convertito in blocco
  // con parseNumeroIt prima di ogni calcolo/salvataggio, il che
  // corromperebbe un testo libero.
  const [parDati, setParDati] = React.useState<any>({
    avvocato_nome: "", studio_indirizzo: "", studio_cf: "", ordine_avvocati: "", studio_assicurazione: "",
    oggetto: "", controparte: "", valore_causa: "",
    competenza: "", ufficio_giudiziario: "Tribunale", sede_ufficio: "",
    accessori_di_legge: true, luogo: "",
    data_preventivo: new Date().toISOString().slice(0, 10),
  });
  // Parti assistite: una o più, come nel calcolatore di riferimento
  // (nominativo/ragione sociale, persona giuridica, rappresentante legale,
  // CF/P.IVA) — non un'unica
  // "persona_giuridica"/"rappresentante_legale" ad hoc per il solo cliente
  // collegato alla pratica.
  const [partiAssistite, setPartiAssistite] = React.useState<{ nominativo: string; persona_giuridica: boolean; rappresentante_legale: string; cf_piva: string }[]>([
    { nominativo: "", persona_giuridica: false, rappresentante_legale: "", cf_piva: "" },
  ]);
  const [vociSpese, setVociSpese] = React.useState<{ descrizione: string; importo: string; esente: boolean }[]>([]);
  const [risPar, setRisPar] = React.useState<any>(null);
  const [titoloPar, setTitoloPar] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [suggerendoPar, setSuggerendoPar] = React.useState(false);
  // Interessi legali / di mora
  const [tassiCapitale, setTassiCapitale] = React.useState("");
  const [tassiDataInizio, setTassiDataInizio] = React.useState(new Date().toISOString().slice(0, 10));
  const [tassiDataFine, setTassiDataFine] = React.useState(new Date().toISOString().slice(0, 10));
  const [tassiMaggiorazione, setTassiMaggiorazione] = React.useState("");
  // Come nel calcolatore di riferimento: due spunte che impostano la maggiorazione di conseguenza —
  // il campo maggiorazione resta comunque modificabile a mano dopo.
  // - ante2013: 7 punti anziché 8, per le transazioni commerciali concluse
  //   entro il 31/12/2012, prima dell'innalzamento introdotto dal D.Lgs.
  //   192/2012.
  // - prodottiAgricoli: ulteriori 4 punti (art. 4 comma 2 D.Lgs. 198/2021,
  //   in vigore dal 4/7/2015 con il D.L. 51/2015), per le cessioni di
  //   prodotti agricoli e agroalimentari. Il calcolatore di riferimento la
  //   chiama "maggiorazione del 24%" ma la norma e le fonti indipendenti consultate descrivono
  //   un'aggiunta di 4 punti percentuali, non una moltiplicazione per 1,24:
  //   seguiamo la norma.
  const [tassiProdottiAgricoli, setTassiProdottiAgricoli] = React.useState(false);
  const [tassiCapitalizzazione, setTassiCapitalizzazione] = React.useState("nessuna");
  const [risTassi, setRisTassi] = React.useState<any>(null);
  const [calcolandoTassi, setCalcolandoTassi] = React.useState(false);
  // Contributo unificato
  const [cuValoreCausa, setCuValoreCausa] = React.useState("");
  const [cuProcesso, setCuProcesso] = React.useState("civile");
  const [cuGiudizio, setCuGiudizio] = React.useState("primo_grado");
  const [cuValoreTipo, setCuValoreTipo] = React.useState("determinato");
  const [cuUfficio, setCuUfficio] = React.useState("tribunale");
  const [cuRiduzione50, setCuRiduzione50] = React.useState(false);
  const [cuRitoAmministrativo, setCuRitoAmministrativo] = React.useState("ricorso_ordinario");
  const [cuProceduraFissa, setCuProceduraFissa] = React.useState("");
  const [risCu, setRisCu] = React.useState<any>(null);
  const [calcolandoCu, setCalcolandoCu] = React.useState(false);
  // Rivalutazione ISTAT
  const [istatCapitale, setIstatCapitale] = React.useState("");
  const [istatDataInizio, setIstatDataInizio] = React.useState(new Date().toISOString().slice(0, 10));
  const [istatDataFine, setIstatDataFine] = React.useState(new Date().toISOString().slice(0, 10));
  const [istatRivalutaAlPct, setIstatRivalutaAlPct] = React.useState("100");
  const [istatModalita, setIstatModalita] = React.useState("rivalutazione_interessi");
  const [risIstat, setRisIstat] = React.useState<any>(null);
  const [calcolandoIstat, setCalcolandoIstat] = React.useState(false);
  // Rivalutazione Mensile (rate periodiche non pagate: assegno, canone, retribuzioni)
  const [rivMensImporto, setRivMensImporto] = React.useState("");
  const [rivMensDataInizio, setRivMensDataInizio] = React.useState(new Date().toISOString().slice(0, 10));
  const [rivMensDataFine, setRivMensDataFine] = React.useState(new Date().toISOString().slice(0, 10));
  // Le 3 opzioni sono indipendenti e combinabili in qualsiasi modo, come le
  // 3 spunte del calcolatore di riferimento (es. "rivaluta annualmente" +
  // "interessi legali" insieme sono una combinazione valida e diversa da
  // "rivaluta annualmente" da solo).
  const [rivMensMensilmente, setRivMensMensilmente] = React.useState(true);
  const [rivMensInteressi, setRivMensInteressi] = React.useState(true);
  const [rivMensAnnualmente, setRivMensAnnualmente] = React.useState(false);
  const [rivMensTassoInteressi, setRivMensTassoInteressi] = React.useState("");
  const [rivMensTassoAnnuale, setRivMensTassoAnnuale] = React.useState("");
  const [risRivMens, setRisRivMens] = React.useState<any>(null);
  const [calcolandoRivMens, setCalcolandoRivMens] = React.useState(false);
  // Adeguamento Canone (aggiornamento ISTAT annuale, passo fisso a 12 mesi)
  const [canoneImporto, setCanoneImporto] = React.useState("");
  const [canoneMeseRiferimento, setCanoneMeseRiferimento] = React.useState(new Date().toISOString().slice(0, 7));
  const [canonePercScelta, setCanonePercScelta] = React.useState("100");
  const [canonePercAltro, setCanonePercAltro] = React.useState("");
  const [risCanone, setRisCanone] = React.useState<any>(null);
  const [calcolandoCanone, setCalcolandoCanone] = React.useState(false);
  // Interessi Vari sul Capitale Rivalutato (AND-003)
  const [variCapitale, setVariCapitale] = React.useState("");
  const [variDataInizio, setVariDataInizio] = React.useState(new Date().toISOString().slice(0, 10));
  const [variDataFine, setVariDataFine] = React.useState(new Date().toISOString().slice(0, 10));
  const [variTipoInteresse, setVariTipoInteresse] = React.useState("legali");
  const [variTassoFisso, setVariTassoFisso] = React.useState("");
  const [variMaggiorazione, setVariMaggiorazione] = React.useState("");
  const [variAnatocismo, setVariAnatocismo] = React.useState("nessuna");
  const [variRivaluta, setVariRivaluta] = React.useState(false);
  const [variBaseRivalutazione, setVariBaseRivalutazione] = React.useState("iniziale_fissa");
  const [variRivalutaAlPct, setVariRivalutaAlPct] = React.useState("100");
  const [variIgnoraDeflazione, setVariIgnoraDeflazione] = React.useState(false);
  const [variGiornoIniziale, setVariGiornoIniziale] = React.useState("escluso");
  const [variConvenzioneGiorni, setVariConvenzioneGiorni] = React.useState("civile");
  const [risVari, setRisVari] = React.useState<any>(null);
  const [calcolandoVari, setCalcolandoVari] = React.useState(false);
  // Termini memorie ex art. 171-ter c.p.c.
  const [memUdienza, setMemUdienza] = React.useState(new Date().toISOString().slice(0, 10));
  const [memEscludiFer, setMemEscludiFer] = React.useState(true);
  const [tipoMem, setTipoMem] = React.useState<"171-ter" | "189" | "275-bis">("171-ter");
  const [risMem, setRisMem] = React.useState<any>(null);
  const [calcolandoMem, setCalcolandoMem] = React.useState(false);
  const [savingMem, setSavingMem] = React.useState(false);
  // Imposta di successione
  const [succPrimaCasa, setSuccPrimaCasa] = React.useState("");
  const [succAltriImmobili, setSuccAltriImmobili] = React.useState("");
  const [succBeniMobili, setSuccBeniMobili] = React.useState("");
  const [succGrado, setSuccGrado] = React.useState<string>("discendenti_retta");
  const [succDisabile, setSuccDisabile] = React.useState(false);
  const [risSucc, setRisSucc] = React.useState<any>(null);
  const [calcolandoSucc, setCalcolandoSucc] = React.useState(false);
  // Compenso CTU
  const [ctuDataInizioPerizia, setCtuDataInizioPerizia] = React.useState("");
  const [ctuDataFinePerizia, setCtuDataFinePerizia] = React.useState("");
  const [ctuNumeroVacazioni, setCtuNumeroVacazioni] = React.useState("");
  const [ctuCaricoVacazioni, setCtuCaricoVacazioni] = React.useState("100");
  const [ctuCaricoUrgenza, setCtuCaricoUrgenza] = React.useState("0");
  const [ctuCaricoComplessita, setCtuCaricoComplessita] = React.useState("0");
  const [ctuSpeseDocumentate, setCtuSpeseDocumentate] = React.useState("0");
  const [ctuRimborsoKmUnitario, setCtuRimborsoKmUnitario] = React.useState("0");
  const [ctuNumeroKm, setCtuNumeroKm] = React.useState("0");
  const [ctuArticoloTabellare, setCtuArticoloTabellare] = React.useState("");
  const [ctuValoreStimato, setCtuValoreStimato] = React.useState("");
  const [ctuTariffaPredefinita, setCtuTariffaPredefinita] = React.useState("media");
  const [ctuCaricoOnorari, setCtuCaricoOnorari] = React.useState("100");
  const [titoloCtu, setTitoloCtu] = React.useState("Compenso CTU");
  const [risCtu, setRisCtu] = React.useState<any>(null);
  const [calcolandoCtu, setCalcolandoCtu] = React.useState(false);
  const [savingCtu, setSavingCtu] = React.useState(false);
  // Calcolatori "generici" (termini di scadenza e parametri forensi, vedi CONFIG_GENERICI)
  const [genForm, setGenForm] = React.useState<Record<string, any>>({});
  const [genRisultato, setGenRisultato] = React.useState<any>(null);
  const [genCalcolando, setGenCalcolando] = React.useState(false);
  const [genSaving, setGenSaving] = React.useState(false);
  const [genSalvata, setGenSalvata] = React.useState(false);
  // Atti (bozze di documenti)
  const [attoAperto, setAttoAperto] = React.useState<AttoId | null>(null);
  const [attoForm, setAttoForm] = React.useState<Record<string, string>>({});
  const [attoCrediti, setAttoCrediti] = React.useState<{ descrizione: string; importo: string }[]>([]);
  const [procuraParti, setProcuraParti] = React.useState<{ nome: string; persona_giuridica: boolean; legale_rappresentante: string; cf_piva: string; indirizzo: string }[]>([]);
  const [procuraAvvocati, setProcuraAvvocati] = React.useState<{ nome: string; cf: string; ordine: string; eletto_domicilio: boolean; indirizzo_studio: string; autentica_firme: boolean }[]>([]);
  const [attoGenerato, setAttoGenerato] = React.useState<any>(null);
  const [attoGenerando, setAttoGenerando] = React.useState(false);

  // Con lo Stack nativo, tenere attivo lo swipe-indietro di questa
  // schermata (che tornerebbe alla Home) mentre uno degli overlay qui sotto
  // e' aperto crea un conflitto sul bordo sinistro con lo SwipeBackScreen
  // di quell'overlay: a volte vince il gesto nativo invece di quello
  // dell'overlay, saltando dritti alla Home invece di chiudere solo
  // l'overlay (stesso problema e stessa soluzione di profilo.tsx).
  // Disattivato finche' un overlay e' visibile.
  React.useEffect(() => {
    navigation.setOptions({ gestureEnabled: !(categoriaCalc || calcAperto || attoAperto) });
  }, [categoriaCalc, calcAperto, attoAperto, navigation]);

  React.useEffect(() => { api.get("/pratiche").then(setPratiche).catch(() => {}); }, []);
  React.useEffect(() => { api.get("/calc/termini-notevoli-cpc").then(setTerminiCpc).catch(() => {}); }, []);

  // Precompila parte assistita (dal cliente collegato) e dati del
  // procedimento (dalla pratica) quando si collega una pratica — come nel
  // calcolatore di riferimento, da cui l'utente poi corregge/completa a mano:
  // il collegamento non è mai un requisito, solo un punto di partenza.
  React.useEffect(() => {
    if (!praticaId) return;
    const p = pratiche.find((pp) => pp.id === praticaId);
    if (!p) return;
    if (p.cliente) {
      const nominativo = p.cliente.ragione_sociale || `${p.cliente.nome || ""} ${p.cliente.cognome || ""}`.trim();
      setPartiAssistite((prev) => prev.map((parte, i) => i === 0 ? {
        ...parte,
        nominativo: parte.nominativo || nominativo,
        persona_giuridica: p.cliente.tipo === "azienda",
        cf_piva: parte.cf_piva || p.cliente.codice_fiscale || p.cliente.partita_iva || "",
      } : parte));
    }
    setParDati((prev: any) => ({
      ...prev,
      oggetto: prev.oggetto || p.oggetto || "",
      controparte: prev.controparte || p.controparte || "",
      valore_causa: prev.valore_causa || (p.valore_causa ? String(p.valore_causa) : ""),
      sede_ufficio: prev.sede_ufficio || p.tribunale || "",
    }));
  }, [praticaId, pratiche]);

  // Precompila la sezione Avvocato dal profilo utente, restando comunque
  // modificabile: evita di reinserire sempre gli stessi dati dello studio.
  React.useEffect(() => {
    if (!user) return;
    setParDati((prev: any) => ({
      ...prev,
      avvocato_nome: prev.avvocato_nome || `${user.nome || ""} ${user.cognome || ""}`.trim(),
      studio_indirizzo: prev.studio_indirizzo || user.studio_indirizzo || "",
      studio_cf: prev.studio_cf || user.studio_cf || "",
      ordine_avvocati: prev.ordine_avvocati || user.ordine_avvocati || "",
      studio_assicurazione: prev.studio_assicurazione || user.studio_assicurazione || "",
    }));
  }, [user]);

  // Modifica di una parcella esistente (arrivo qui da Archivio o dalla
  // scheda pratica con ?editId=...): precarica i campi e il calcolo gia'
  // salvato, cosi' il modulo si presenta gia' compilato invece di dover
  // rifare "Calcola" da zero.
  React.useEffect(() => {
    if (!params.editId) return;
    api.get(`/parcelle/${params.editId}`).then((doc: any) => {
      setPar({
        fase_studio: String(doc.fase_studio ?? 0),
        fase_introduttiva: String(doc.fase_introduttiva ?? 0),
        fase_istruttoria: String(doc.fase_istruttoria ?? 0),
        fase_decisionale: String(doc.fase_decisionale ?? 0),
        adj_studio_pct: String(doc.adj_studio_pct ?? 0),
        adj_introduttiva_pct: String(doc.adj_introduttiva_pct ?? 0),
        adj_istruttoria_pct: String(doc.adj_istruttoria_pct ?? 0),
        adj_decisionale_pct: String(doc.adj_decisionale_pct ?? 0),
        spese_generali_pct: String(doc.spese_generali_pct ?? 15),
        cpa_pct: String(doc.cpa_pct ?? 4),
        iva_pct: String(doc.iva_pct ?? 22),
        ritenuta_pct: String(doc.ritenuta_pct ?? 0),
      });
      // Le parcelle salvate prima di questa suddivisione avevano "diritti" e
      // "fase_esecutiva" come campi dedicati: si traducono in voci
      // personalizzate per non perdere il dato in modifica.
      const vociCustomEsistenti = (doc.voci_custom || []).map((v: any) => ({ descrizione: v.descrizione || "", importo: String(v.importo ?? 0) }));
      if (doc.fase_esecutiva) vociCustomEsistenti.push({ descrizione: "Fase esecutiva", importo: String(doc.fase_esecutiva) });
      if (doc.diritti) vociCustomEsistenti.push({ descrizione: "Diritti", importo: String(doc.diritti) });
      setVociCustom(vociCustomEsistenti);
      setParDati({
        avvocato_nome: doc.avvocato_nome || "",
        studio_indirizzo: doc.studio_indirizzo || "",
        studio_cf: doc.studio_cf || "",
        ordine_avvocati: doc.ordine_avvocati || "",
        studio_assicurazione: doc.studio_assicurazione || "",
        oggetto: doc.oggetto || "",
        controparte: doc.controparte || "",
        valore_causa: doc.valore_causa ? String(doc.valore_causa) : "",
        competenza: doc.competenza || "",
        ufficio_giudiziario: doc.ufficio_giudiziario || "Tribunale",
        sede_ufficio: doc.sede_ufficio || "",
        accessori_di_legge: doc.accessori_di_legge ?? true,
        luogo: doc.luogo || "",
        data_preventivo: doc.data_preventivo || new Date().toISOString().slice(0, 10),
      });
      // Le parcelle salvate con una sola parte (prima dell'introduzione di
      // "parti_assistite") si traducono in una lista di una voce, per non
      // perdere il dato in modifica.
      setPartiAssistite(
        doc.parti_assistite && doc.parti_assistite.length > 0
          ? doc.parti_assistite.map((p: any) => ({ nominativo: p.nominativo || "", persona_giuridica: !!p.persona_giuridica, rappresentante_legale: p.rappresentante_legale || "", cf_piva: p.cf_piva || "" }))
          : [{ nominativo: "", persona_giuridica: !!doc.parte_persona_giuridica, rappresentante_legale: doc.parte_rappresentante_legale || "", cf_piva: "" }]
      );
      // Le parcelle salvate prima dell'introduzione delle spese itemizzate
      // hanno solo "anticipazioni": si traduce in un'unica voce esente per
      // non perdere il dato in modifica.
      setVociSpese(
        doc.voci_spese && doc.voci_spese.length > 0
          ? doc.voci_spese.map((v: any) => ({ descrizione: v.descrizione || "", importo: String(v.importo ?? 0), esente: v.esente ?? true }))
          : doc.anticipazioni ? [{ descrizione: "Anticipazioni", importo: String(doc.anticipazioni), esente: true }] : []
      );
      setTitoloPar(doc.titolo || "");
      setPraticaId(doc.pratica_id || null);
      setRisPar(doc.calcolo || null);
    }).catch(() => {});
  }, [params.editId, params._t]);

  const calcScad = async () => {
    Keyboard.dismiss();
    try {
      const r = await api.post("/calc/scadenza", { data_partenza: dataPartenza, giorni: Number(giorni), tipo: tipoS, unita, escludi_feriale: escludiFer, escludi_covid: escludiCovid, termine_libero: unita === "giorni" && terminLibero });
      setRisScad(r);
      setTitoloScad("");
    } catch (e: any) { setRisScad({ error: e.message }); }
  };
  const buildVociSpeseBody = () =>
    vociSpese
      .filter((v) => v.descrizione.trim() || parseNumeroIt(v.importo))
      .map((v) => ({ descrizione: v.descrizione.trim(), importo: parseNumeroIt(v.importo), esente: v.esente }));
  const buildVociCustomBody = () =>
    vociCustom
      .filter((v) => v.descrizione.trim() || parseNumeroIt(v.importo))
      .map((v) => ({ descrizione: v.descrizione.trim(), importo: parseNumeroIt(v.importo) }));
  const buildPartiAssistiteBody = () =>
    partiAssistite
      .filter((p) => p.nominativo.trim())
      .map((p) => ({ nominativo: p.nominativo.trim(), persona_giuridica: p.persona_giuridica, rappresentante_legale: p.rappresentante_legale.trim(), cf_piva: p.cf_piva.trim() }));

  // Precompila i 4 importi di fase con i valori medi della tabella dei
  // parametri forensi per il rito e il valore causa scelti, cosi' come fa
  // il calcolatore di riferimento (che parte sempre dallo scaglione invece che da zero): restano
  // comunque modificabili a mano subito dopo, per i casi in cui l'avvocato
  // voglia pattuire un compenso diverso da quello tabellare.
  const suggerisciDaParametriForensi = async () => {
    const valoreCausa = parseNumeroIt(parDati.valore_causa);
    if (!valoreCausa) {
      Alert.alert("Valore causa mancante", "Inserisci il valore della controversia (sopra, in \"Dati del procedimento\"), oppure inserisci gli importi di fase manualmente.");
      return;
    }
    const rito = COMPETENZE_PARCELLA.find((c) => c.value === parDati.competenza)?.rito;
    if (!rito) {
      Alert.alert("Nessuna tabella disponibile", "Per la competenza scelta non abbiamo una tabella di parametri forensi verificata: inserisci gli importi di fase manualmente.");
      return;
    }
    setSuggerendoPar(true);
    try {
      const r = await api.post("/calc/parametri-forensi", { rito, valore_causa: valoreCausa });
      setPar({
        ...par,
        fase_studio: String(r.fasi.studio ?? 0),
        fase_introduttiva: String(r.fasi.introduttiva ?? 0),
        fase_istruttoria: String(r.fasi.istruttoria ?? 0),
        fase_decisionale: String(r.fasi.decisionale ?? 0),
      });
    } catch (e: any) {
      Alert.alert("Errore", e.message || "Impossibile calcolare i parametri forensi per questo valore causa/rito.");
    } finally {
      setSuggerendoPar(false);
    }
  };

  const calcPar = async () => {
    try {
      const body: any = { ...parDati, valore_causa: parseNumeroIt(parDati.valore_causa) };
      Object.entries(par).forEach(([k, v]) => body[k] = parseNumeroIt(v as string));
      body.voci_spese = buildVociSpeseBody();
      body.voci_custom = buildVociCustomBody();
      body.parti_assistite = buildPartiAssistiteBody();
      const r = await api.post("/calc/parcella", body);
      setRisPar(r);
      // In modifica il ricalcolo raffina la stessa parcella: non si deve
      // perdere il nome/la pratica gia' collegati solo perche' si e'
      // ritoccata una cifra.
      if (!params.editId) setTitoloPar("");
    } catch (e: any) {
      Alert.alert("Errore", e.message || "Impossibile calcolare. Riprova.");
    }
  };

  const saveScad = async () => {
    if (!risScad?.data_calcolata) return;
    if (!titoloScad.trim()) {
      Alert.alert("Nome mancante", "Inserisci un nome per la scadenza.");
      return;
    }
    setSaving(true);
    try {
      await api.post("/scadenze", { pratica_id: praticaId, titolo: titoloScad.trim(), data: risScad.data_calcolata, ora: oraScad || null, categoria: "generale", priorita: "media", promemoria, descrizione: `Partenza: ${isoToDataIt(dataPartenza)}, ${tipoS}` });
      sincronizzaSeConnesso();
      setRisScad({ ...risScad, salvata: true });
    } catch (e: any) {
      Alert.alert("Errore", e.message || "Impossibile salvare. Riprova.");
    } finally {
      setSaving(false);
    }
  };
  const savePar = async () => {
    setSaving(true);
    try {
      const body: any = { tipo: "parcella", pratica_id: praticaId, titolo: titoloPar.trim(), ...parDati, valore_causa: parseNumeroIt(parDati.valore_causa) };
      Object.entries(par).forEach(([k, v]) => body[k] = parseNumeroIt(v as string));
      body.voci_spese = buildVociSpeseBody();
      body.voci_custom = buildVociCustomBody();
      body.parti_assistite = buildPartiAssistiteBody();
      if (params.editId) {
        await api.put(`/parcelle/${params.editId}`, body);
      } else {
        await api.post("/parcelle", body);
      }
      setRisPar((prev: any) => ({ ...prev, salvata: true }));
    } catch (e: any) {
      Alert.alert("Errore", e.message || "Impossibile salvare. Riprova.");
    } finally {
      setSaving(false);
    }
  };

  const calcolaTassi = async (tipo: "interessi-legali" | "interessi-mora") => {
    Keyboard.dismiss();
    setCalcolandoTassi(true);
    setRisTassi(null);
    try {
      const body: any = { capitale: parseNumeroIt(tassiCapitale), data_inizio: tassiDataInizio, data_fine: tassiDataFine };
      if (tipo === "interessi-mora") body.maggiorazione_pct = parseNumeroIt(tassiMaggiorazione) || 0;
      else body.capitalizzazione = tassiCapitalizzazione;
      const r = await api.post(`/calc/${tipo}`, body);
      setRisTassi(r);
    } catch (e: any) {
      Alert.alert("Errore", e.message || "Impossibile calcolare. Riprova.");
    } finally {
      setCalcolandoTassi(false);
    }
  };

  const calcolaContributoUnificato = async () => {
    Keyboard.dismiss();
    setCalcolandoCu(true);
    setRisCu(null);
    try {
      const body: any = cuProceduraFissa
        ? { procedura_fissa: cuProceduraFissa }
        : {
            processo: cuProcesso,
            giudizio: cuGiudizio,
            valore_tipo: cuValoreTipo,
            valore_causa: parseNumeroIt(cuValoreCausa) || 0,
            ufficio: cuUfficio,
            riduzione_50: cuRiduzione50,
            rito_amministrativo: cuRitoAmministrativo,
          };
      const r = await api.post("/calc/contributo-unificato", body);
      setRisCu(r);
    } catch (e: any) {
      Alert.alert("Errore", e.message || "Impossibile calcolare. Riprova.");
    } finally {
      setCalcolandoCu(false);
    }
  };

  const calcolaIstat = async () => {
    Keyboard.dismiss();
    setCalcolandoIstat(true);
    setRisIstat(null);
    try {
      const r = await api.post("/calc/rivalutazione-istat", {
        capitale: parseNumeroIt(istatCapitale),
        data_inizio: istatDataInizio,
        data_fine: istatDataFine,
        rivaluta_al_pct: parseNumeroIt(istatRivalutaAlPct) || 100,
        modalita: istatModalita,
      });
      setRisIstat(r);
    } catch (e: any) {
      Alert.alert("Errore", e.message || "Impossibile calcolare. Riprova.");
    } finally {
      setCalcolandoIstat(false);
    }
  };

  const calcolaRivalutazioneMensile = async () => {
    Keyboard.dismiss();
    setCalcolandoRivMens(true);
    setRisRivMens(null);
    try {
      const body: any = {
        importo_mensile: parseNumeroIt(rivMensImporto),
        data_inizio: rivMensDataInizio,
        data_fine: rivMensDataFine,
        rivaluta_mensilmente: rivMensMensilmente,
        applica_interessi: rivMensInteressi,
        rivaluta_annualmente: rivMensAnnualmente,
      };
      if (rivMensInteressi) body.tasso_interessi_pct = parseNumeroIt(rivMensTassoInteressi) || 100;
      if (rivMensAnnualmente) body.tasso_rivalutazione_annuale_pct = parseNumeroIt(rivMensTassoAnnuale) || 0;
      const r = await api.post("/calc/rivalutazione-mensile", body);
      setRisRivMens(r);
    } catch (e: any) {
      Alert.alert("Errore", e.message || "Impossibile calcolare. Riprova.");
    } finally {
      setCalcolandoRivMens(false);
    }
  };

  const calcolaAdeguamentoCanone = async () => {
    Keyboard.dismiss();
    setCalcolandoCanone(true);
    setRisCanone(null);
    try {
      const pct = canonePercScelta === "altro" ? parseNumeroIt(canonePercAltro) || 0 : Number(canonePercScelta);
      const r = await api.post("/calc/adeguamento-canone", {
        canone: parseNumeroIt(canoneImporto),
        mese_riferimento: `${canoneMeseRiferimento}-01`,
        percentuale_pct: pct,
      });
      setRisCanone(r);
    } catch (e: any) {
      Alert.alert("Errore", e.message || "Impossibile calcolare. Riprova.");
    } finally {
      setCalcolandoCanone(false);
    }
  };

  const calcolaInteressiVari = async () => {
    Keyboard.dismiss();
    setCalcolandoVari(true);
    setRisVari(null);
    try {
      const body: any = {
        capitale: parseNumeroIt(variCapitale),
        data_inizio: variDataInizio,
        data_fine: variDataFine,
        tipo_interesse: variTipoInteresse,
        anatocismo: variAnatocismo,
        rivaluta: variRivaluta,
        base_rivalutazione: variBaseRivalutazione,
        rivaluta_al_pct: variRivaluta ? (parseNumeroIt(variRivalutaAlPct) || 100) : 100,
        ignora_deflazione: variIgnoraDeflazione,
        giorno_iniziale: variGiornoIniziale,
        convenzione_giorni: variConvenzioneGiorni,
      };
      if (variTipoInteresse === "tasso_fisso") body.tasso_fisso_pct = parseNumeroIt(variTassoFisso);
      if (variMaggiorazione.trim()) body.maggiorazione_pct = parseNumeroIt(variMaggiorazione);
      const r = await api.post("/calc/interessi-vari-capitale-rivalutato", body);
      setRisVari(r);
    } catch (e: any) {
      Alert.alert("Errore", e.message || "Impossibile calcolare. Riprova.");
    } finally {
      setCalcolandoVari(false);
    }
  };

  const calcolaMemorie = async () => {
    Keyboard.dismiss();
    setCalcolandoMem(true);
    setRisMem(null);
    try {
      const r = await api.post("/calc/termini-memorie", { data_udienza: memUdienza, escludi_feriale: memEscludiFer, tipo: tipoMem });
      setRisMem(r);
    } catch (e: any) {
      Alert.alert("Errore", e.message || "Impossibile calcolare. Riprova.");
    } finally {
      setCalcolandoMem(false);
    }
  };
  const salvaMemorie = async () => {
    if (!risMem) return;
    setSavingMem(true);
    try {
      const voci = risMem.tipo === "189" ? [
        { titolo: "Note di precisazione delle conclusioni ex art. 189 c.p.c.", data: risMem.prima_memoria },
        { titolo: "Comparse conclusionali ex art. 189 c.p.c.", data: risMem.seconda_memoria },
        { titolo: "Memorie di replica ex art. 189 c.p.c.", data: risMem.terza_memoria },
      ] : risMem.tipo === "275-bis" ? [
        { titolo: "Note di precisazione delle conclusioni ex art. 275-bis c.p.c.", data: risMem.prima_memoria },
        { titolo: "Note conclusive ex art. 275-bis c.p.c.", data: risMem.seconda_memoria },
      ] : [
        { titolo: "1ª memoria ex art. 171-ter c.p.c. (istanze/produzioni)", data: risMem.prima_memoria },
        { titolo: "2ª memoria ex art. 171-ter c.p.c. (repliche/mezzi di prova)", data: risMem.seconda_memoria },
        { titolo: "3ª memoria ex art. 171-ter c.p.c. (sole repliche)", data: risMem.terza_memoria },
      ];
      for (const v of voci) {
        await api.post("/scadenze", { pratica_id: praticaId, titolo: v.titolo, data: v.data, ora: null, categoria: "deposito", priorita: "media", promemoria: [1], descrizione: `Udienza del ${isoToDataIt(risMem.data_udienza)}` });
      }
      sincronizzaSeConnesso();
      setRisMem({ ...risMem, salvata: true });
    } catch (e: any) {
      Alert.alert("Errore", e.message || "Impossibile salvare. Riprova.");
    } finally {
      setSavingMem(false);
    }
  };

  const calcolaSuccessione = async () => {
    Keyboard.dismiss();
    setCalcolandoSucc(true);
    setRisSucc(null);
    try {
      const r = await api.post("/calc/imposta-successione", {
        grado_parentela: succGrado,
        disabile_grave: succDisabile,
        valore_catastale_prima_casa: parseNumeroIt(succPrimaCasa) || 0,
        valore_catastale_altri_immobili: parseNumeroIt(succAltriImmobili) || 0,
        beni_mobili: parseNumeroIt(succBeniMobili) || 0,
      });
      setRisSucc(r);
    } catch (e: any) {
      Alert.alert("Errore", e.message || "Impossibile calcolare. Riprova.");
    } finally {
      setCalcolandoSucc(false);
    }
  };

  const calcolaCtu = async () => {
    Keyboard.dismiss();
    setCalcolandoCtu(true);
    setRisCtu(null);
    try {
      const r = await api.post("/calc/compenso-ctu", {
        data_inizio_perizia: ctuDataInizioPerizia || null,
        data_fine_perizia: ctuDataFinePerizia || null,
        numero_vacazioni: parseNumeroIt(ctuNumeroVacazioni) || 0,
        carico_vacazioni_pct: parseNumeroIt(ctuCaricoVacazioni) || 100,
        carico_urgenza_pct: parseNumeroIt(ctuCaricoUrgenza) || 0,
        carico_complessita_pct: parseNumeroIt(ctuCaricoComplessita) || 0,
        spese_documentate: parseNumeroIt(ctuSpeseDocumentate) || 0,
        rimborso_km_unitario: parseNumeroIt(ctuRimborsoKmUnitario) || 0,
        numero_km: parseNumeroIt(ctuNumeroKm) || 0,
        articolo_tabellare: ctuArticoloTabellare || null,
        valore_stimato: parseNumeroIt(ctuValoreStimato) || 0,
        tariffa_predefinita: ctuTariffaPredefinita,
        carico_onorari_pct: parseNumeroIt(ctuCaricoOnorari) || 100,
      });
      setRisCtu(r);
    } catch (e: any) {
      Alert.alert("Errore", e.message || "Impossibile calcolare. Riprova.");
    } finally {
      setCalcolandoCtu(false);
    }
  };
  const salvaCtu = async () => {
    if (!risCtu) return;
    setSavingCtu(true);
    try {
      await api.post("/parcelle", { tipo: "parcella", pratica_id: praticaId, titolo: titoloCtu.trim() || "Compenso CTU", voci_custom: [{ descrizione: "Compenso CTU (vacazioni)", importo: risCtu.totale }] });
      setRisCtu({ ...risCtu, salvata: true });
    } catch (e: any) {
      Alert.alert("Errore", e.message || "Impossibile salvare. Riprova.");
    } finally {
      setSavingCtu(false);
    }
  };

  const apriCalcolatore = (idc: CalcId) => {
    setCalcAperto(idc);
    setRisScad(null); setTitoloScad(""); setVoceCpcSelezionata(null); setTerminLibero(false); setRitoTermini("nuovo");
    setRisPar(null); setTitoloPar(""); setVociSpese([]); setVociCustom([]);
    setPartiAssistite([{ nominativo: "", persona_giuridica: false, rappresentante_legale: "", cf_piva: "" }]);
    setRisTassi(null); setTassiCapitale(""); setTassiDataInizio(new Date().toISOString().slice(0, 10)); setTassiDataFine(new Date().toISOString().slice(0, 10)); setTassiMaggiorazione("8");
    setRisCu(null); setCuValoreCausa("");
    setRisIstat(null); setIstatCapitale(""); setIstatDataInizio(new Date().toISOString().slice(0, 10)); setIstatDataFine(new Date().toISOString().slice(0, 10)); setIstatRivalutaAlPct("100"); setIstatModalita("rivalutazione_interessi");
    setRisRivMens(null); setRivMensImporto(""); setRivMensDataInizio(new Date().toISOString().slice(0, 10)); setRivMensDataFine(new Date().toISOString().slice(0, 10)); setRivMensMensilmente(true); setRivMensInteressi(true); setRivMensAnnualmente(false); setRivMensTassoInteressi(""); setRivMensTassoAnnuale("");
    setRisCanone(null); setCanoneImporto(""); setCanoneMeseRiferimento(new Date().toISOString().slice(0, 7)); setCanonePercScelta("100"); setCanonePercAltro("");
    setRisVari(null); setVariCapitale(""); setVariDataInizio(new Date().toISOString().slice(0, 10)); setVariDataFine(new Date().toISOString().slice(0, 10)); setVariTipoInteresse("legali"); setVariTassoFisso(""); setVariMaggiorazione(""); setVariAnatocismo("nessuna"); setVariRivaluta(false); setVariBaseRivalutazione("iniziale_fissa"); setVariRivalutaAlPct("100"); setVariIgnoraDeflazione(true); setVariGiornoIniziale("escluso"); setVariConvenzioneGiorni("civile");
    setRisMem(null); setMemUdienza(new Date().toISOString().slice(0, 10)); setMemEscludiFer(true); setTipoMem("171-ter");
    setRisSucc(null); setSuccPrimaCasa(""); setSuccAltriImmobili(""); setSuccBeniMobili(""); setSuccGrado("discendenti_retta"); setSuccDisabile(false);
    setRisCtu(null); setCtuDataInizioPerizia(""); setCtuDataFinePerizia(""); setCtuNumeroVacazioni(""); setCtuCaricoVacazioni("100"); setCtuCaricoUrgenza("0"); setCtuCaricoComplessita("0"); setCtuSpeseDocumentate("0"); setCtuRimborsoKmUnitario("0"); setCtuNumeroKm("0"); setCtuArticoloTabellare(""); setCtuValoreStimato(""); setCtuTariffaPredefinita("media"); setCtuCaricoOnorari("100"); setTitoloCtu("Compenso CTU");
    setGenForm(defaultGenForm(idc)); setGenRisultato(null); setGenSalvata(false);
  };

  const calcolaGenerico = async () => {
    const cfg = CONFIG_GENERICI[calcAperto as string];
    if (!cfg) return;
    const errore = cfg.validate?.(genForm);
    if (errore) {
      Alert.alert("Non disponibile", errore);
      return;
    }
    Keyboard.dismiss();
    setGenCalcolando(true);
    setGenRisultato(null);
    try {
      const body = cfg.buildBody
        ? cfg.buildBody(genForm)
        : Object.fromEntries(cfg.campi.map((c) => [c.key, c.tipo === "numero" ? parseNumeroIt(genForm[c.key]) : genForm[c.key]]));
      const r = await api.post(typeof cfg.endpoint === "function" ? cfg.endpoint(genForm) : cfg.endpoint, body);
      setGenRisultato(r);
      setGenSalvata(false);
    } catch (e: any) {
      Alert.alert("Errore", e.message || "Impossibile calcolare. Riprova.");
    } finally {
      setGenCalcolando(false);
    }
  };

  const salvaGenerico = async () => {
    const cfg = CONFIG_GENERICI[calcAperto as string];
    if (!cfg?.scadenze || !genRisultato) return;
    setGenSaving(true);
    try {
      const voci = cfg.scadenze(genRisultato);
      for (const v of voci) {
        await api.post("/scadenze", { pratica_id: praticaId, titolo: v.titolo, data: v.data, ora: null, categoria: "generale", priorita: "media", promemoria: [1] });
      }
      sincronizzaSeConnesso();
      setGenSalvata(true);
    } catch (e: any) {
      Alert.alert("Errore", e.message || "Impossibile salvare. Riprova.");
    } finally {
      setGenSaving(false);
    }
  };

  const apriAtto = (id: AttoId) => {
    setAttoAperto(id);
    const f: Record<string, string> = {};
    CAMPI_ATTI[id].forEach((c) => {
      f[c.key] = c.dataIso && c.key === "data" ? new Date().toISOString().slice(0, 10) : c.opzioni ? c.opzioni[0].value : "";
    });
    setAttoForm(f);
    setAttoCrediti(id === "messa_in_mora" ? [{ descrizione: "", importo: "" }] : []);
    setProcuraParti(id === "procura_alle_liti" ? [{ nome: "", persona_giuridica: false, legale_rappresentante: "", cf_piva: "", indirizzo: "" }] : []);
    setProcuraAvvocati(id === "procura_alle_liti" ? [{ nome: "", cf: "", ordine: "", eletto_domicilio: false, indirizzo_studio: "", autentica_firme: false }] : []);
    setAttoGenerato(null);
  };

  const generaAtto = async () => {
    if (!attoAperto) return;
    const mancanti = CAMPI_ATTI[attoAperto].filter((c) => c.obbligatorio && (!c.mostraSe || c.mostraSe(attoForm)) && !attoForm[c.key]?.trim());
    if (mancanti.length) {
      Alert.alert("Campi mancanti", `Compila: ${mancanti.map((c) => c.label).join(", ")}`);
      return;
    }
    if (attoAperto === "procura_alle_liti") {
      if (!procuraParti.some((p) => p.nome.trim())) {
        Alert.alert("Campi mancanti", "Compila: almeno una parte assistita con nome");
        return;
      }
      if (!procuraAvvocati.some((a) => a.nome.trim())) {
        Alert.alert("Campi mancanti", "Compila: almeno un avvocato con nome");
        return;
      }
    }
    setAttoGenerando(true);
    try {
      const campi: Record<string, any> = { ...attoForm };
      if (attoAperto === "messa_in_mora") {
        campi.crediti = attoCrediti.filter((v) => v.descrizione.trim() || v.importo.trim());
      }
      if (attoAperto === "procura_alle_liti") {
        campi.parti = procuraParti.filter((p) => p.nome.trim());
        campi.avvocati = procuraAvvocati.filter((a) => a.nome.trim());
      }
      const r = await api.post("/atti", { tipo: attoAperto, pratica_id: praticaId, campi });
      setAttoGenerato(r);
    } catch (e: any) {
      Alert.alert("Errore", e.message || "Impossibile generare il documento. Riprova.");
    } finally {
      setAttoGenerando(false);
    }
  };

  const attoCorrente = ATTI.find((a) => a.id === attoAperto);

  const calcolatoreCorrente = CALCOLATORI.find((c) => c.id === calcAperto);
  const headerTitle = locked ? "Modifica parcella" : calcolatoreCorrente ? calcolatoreCorrente.titolo : "Calcolatori";

  // Contenuto del calcolatore "Scadenze Processuali": invariato nella
  // logica, solo spostato in una funzione cosi' da poterlo renderizzare
  // sia nel caso "locked" sia dentro l'overlay aperto dal picker.
  const terminiCpcPerRito = terminiCpc.filter((v) => !v.rito || v.rito === "entrambi" || v.rito === ritoTermini);
  const cpcOpzioni = [
    { value: "", label: "Nessuna (inserisci il termine manualmente)" },
    ...terminiCpcPerRito.map((v, i) => ({ value: String(i), label: `${v.articolo} — ${v.descrizione} (${v.valore} ${v.unita}, ${v.direzione})` })),
  ];
  const cpcValoreSelezionato = voceCpcSelezionata ? String(terminiCpcPerRito.indexOf(voceCpcSelezionata)) : "";

  const selezionaVoceCpc = (indice: string) => {
    if (indice === "") { setVoceCpcSelezionata(null); return; }
    const v = terminiCpcPerRito[Number(indice)];
    if (!v) return;
    setVoceCpcSelezionata(v);
    setGiorni(String(v.valore));
    setUnita(v.unita);
    setTipoS(v.direzione);
    setTerminLibero(!!v.libero);
  };
  // Una voce selezionata blocca unità e direzione (si inserisce o il
  // termine a mano o si sceglie dall'elenco, non un misto dei due) — a
  // meno che quella specifica voce non fissi un valore per uno dei due
  // campi, nel qual caso quel campo resta modificabile.
  const unitaBloccata = !!voceCpcSelezionata && voceCpcSelezionata.unita != null;
  const direzioneBloccata = !!voceCpcSelezionata && voceCpcSelezionata.direzione != null;
  const valoreBloccato = !!voceCpcSelezionata && voceCpcSelezionata.valore != null;

  const contenutoScadenze = (
    <View>
      <Text style={[st.lbl, { color: t.onSurfaceSecondary }]}>Rito</Text>
      <View style={{ marginBottom: SPACING.xs }}>
        <SelectInput
          testID="scad-rito"
          value={ritoTermini}
          onChange={(v) => {
            const nuovo = v as typeof ritoTermini;
            setRitoTermini(nuovo);
            if (voceCpcSelezionata && voceCpcSelezionata.rito && voceCpcSelezionata.rito !== "entrambi" && voceCpcSelezionata.rito !== nuovo) {
              setVoceCpcSelezionata(null);
            }
          }}
          opzioni={[
            { value: "nuovo", label: "Nuovo rito (post riforma)" },
            { value: "vecchio", label: "Vecchio rito (ante riforma)" },
          ]}
        />
      </View>
      <Text style={{ color: t.onSurfaceTertiary, fontSize: 11, fontStyle: "italic", marginBottom: SPACING.sm }}>
        &quot;Nuovo rito&quot; per i procedimenti iniziati dal 28/02/2023 (riforma Cartabia, D.Lgs. 149/2022); &quot;Vecchio rito&quot; per quelli iniziati prima di tale data. Cambia quali voci dell&apos;elenco sottostante sono proposte.
      </Text>
      <Text style={[st.lbl, { color: t.onSurfaceSecondary }]}>Voce notevole del c.p.c. (facoltativo)</Text>
      <View style={{ marginBottom: SPACING.sm }}>
        <SelectInput
          testID="voce-cpc"
          value={cpcValoreSelezionato}
          onChange={selezionaVoceCpc}
          opzioni={cpcOpzioni}
          cercabile
          placeholder="Cerca per articolo o descrizione (es. 325, impugnazione...)"
        />
      </View>
      <Text style={[st.lbl, { color: t.onSurfaceSecondary }]}>Data di partenza</Text>
      <DataInput testID="scad-data" value={dataPartenza} onChange={setDataPartenza} />
      <Text style={[st.lbl, { color: t.onSurfaceSecondary }]}>Termine ({unita}){valoreBloccato ? " (fissato dalla voce scelta)" : ""}</Text>
      <TextInput
        testID="scad-giorni"
        value={giorni}
        onChangeText={setGiorni}
        keyboardType="numeric"
        editable={!valoreBloccato}
        style={[st.input, { backgroundColor: t.surfaceSecondary, color: t.onSurface, borderColor: t.border, opacity: valoreBloccato ? 0.6 : 1 }]}
      />
      <Text style={[st.lbl, { color: t.onSurfaceSecondary }]}>Unità{unitaBloccata ? " (fissata dalla voce scelta)" : ""}</Text>
      <View style={{ marginBottom: SPACING.sm }}>
        <SelectInput
          value={unita}
          onChange={(v) => setUnita(v as typeof unita)}
          opzioni={[{ value: "giorni", label: "Giorni" }, { value: "mesi", label: "Mesi" }, { value: "anni", label: "Anni" }]}
          disabled={unitaBloccata}
        />
      </View>
      <Text style={[st.lbl, { color: t.onSurfaceSecondary }]}>Direzione{direzioneBloccata ? " (fissata dalla voce scelta)" : ""}</Text>
      <View style={{ marginBottom: SPACING.sm }}>
        <SelectInput
          testID="dir"
          value={tipoS}
          onChange={(v) => setTipoS(v as typeof tipoS)}
          opzioni={[{ value: "avanti", label: "Avanti" }, { value: "ritroso", label: "Ritroso" }]}
          disabled={direzioneBloccata}
        />
      </View>
      <Pressable testID="toggle-feriale" onPress={() => setEscludiFer(!escludiFer)} style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: SPACING.md, marginTop: SPACING.sm }}>
        <View style={{ width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: t.brand, backgroundColor: escludiFer ? t.brand : "transparent", alignItems: "center", justifyContent: "center" }}>
          {escludiFer ? <Feather name="check" size={14} color={t.onBrand} /> : null}
        </View>
        <Text style={{ color: t.onSurface }}>Applica sospensione feriale (1-31 agosto)</Text>
      </Pressable>
      <Pressable testID="toggle-covid" onPress={() => setEscludiCovid(!escludiCovid)} style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: SPACING.md }}>
        <View style={{ width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: t.brand, backgroundColor: escludiCovid ? t.brand : "transparent", alignItems: "center", justifyContent: "center" }}>
          {escludiCovid ? <Feather name="check" size={14} color={t.onBrand} /> : null}
        </View>
        <Text style={{ color: t.onSurface, flex: 1 }}>Applica sospensione straordinaria COVID-19 (9 marzo - 11 maggio 2020)</Text>
      </Pressable>
      {unita === "giorni" ? (
        <Pressable testID="toggle-libero" onPress={() => setTerminLibero(!terminLibero)} style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: SPACING.md }}>
          <View style={{ width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: t.brand, backgroundColor: terminLibero ? t.brand : "transparent", alignItems: "center", justifyContent: "center" }}>
            {terminLibero ? <Feather name="check" size={14} color={t.onBrand} /> : null}
          </View>
          <Text style={{ color: t.onSurface, flex: 1 }}>Termine libero (art. 155 c.p.c.: né il giorno iniziale né quello finale si computano — solo per i casi previsti dalla legge, es. art. 163-bis)</Text>
        </Pressable>
      ) : null}
      <Pressable testID="btn-calc-scad" onPress={calcScad} style={[st.submit, { backgroundColor: t.brand }]}>
        <Text style={{ color: t.onBrand, fontWeight: "700" }}>Calcola</Text>
      </Pressable>
      {risScad ? (
        <View style={[st.result, { backgroundColor: t.brandSecondary, borderColor: t.brand }]}>
          {risScad.error ? <Text style={{ color: t.error }}>{risScad.error}</Text> : (
            <>
              <Text style={{ color: t.onBrandSecondary, fontSize: 12, fontWeight: "700" }}>DATA CALCOLATA</Text>
              <Text testID="scad-result" style={{ color: t.onBrandSecondary, fontSize: 26, fontWeight: "800", fontVariant: ["tabular-nums"] }}>{isoToDataIt(risScad.data_calcolata)}</Text>
              {risScad.giorni_sospensione_applicati ? <Text style={{ color: t.onBrandSecondary, marginTop: 4, fontSize: 12 }}>Giorni di sospensione feriale: {risScad.giorni_sospensione_applicati}</Text> : null}
              {risScad.prorogato_a_prossimo_feriale ? <Text style={{ color: t.onBrandSecondary, marginTop: 4, fontSize: 12 }}>Prorogato al prossimo giorno feriale</Text> : null}
              {!risScad.salvata ? (
                <>
                  <Text style={{ color: t.onBrandSecondary, fontSize: 11, fontWeight: "700", marginTop: SPACING.md, marginBottom: SPACING.xs }}>Nome scadenza *</Text>
                  <TextInput
                    testID="scad-titolo"
                    value={titoloScad}
                    onChangeText={setTitoloScad}
                    placeholder="Es. Deposito ricorso"
                    placeholderTextColor={t.onSurfaceTertiary}
                    style={[st.input, { backgroundColor: t.surface, color: t.onSurface, borderColor: t.border }]}
                  />
                  <PraticaPicker
                    pratiche={pratiche}
                    praticaId={praticaId}
                    onChange={setPraticaId}
                    helperText={praticaId ? "Comparirà anche nella scheda di quella pratica." : "Comparirà solo qui e nel calendario."}
                  />
                  <OrarioInput value={oraScad} onChange={setOraScad} />
                  <PromemoriaInput value={promemoria} onChange={setPromemoria} />
                  <Pressable testID="save-scad" onPress={saveScad} disabled={saving} style={{ marginTop: SPACING.md, backgroundColor: t.brand, padding: 10, borderRadius: RADIUS.md, alignItems: "center", opacity: saving ? 0.6 : 1 }}>
                    <Text style={{ color: t.onBrand, fontWeight: "700" }}>{saving ? "Salvataggio..." : "Salva come scadenza"}</Text>
                  </Pressable>
                </>
              ) : <Text style={{ color: t.success, marginTop: 8 }}>✓ Salvata</Text>}
            </>
          )}
        </View>
      ) : null}
    </View>
  );

  const sezioneLbl = { color: t.onSurfaceTertiary, fontSize: 12, fontWeight: "700" as const, textTransform: "uppercase" as const, letterSpacing: 0.5, marginTop: SPACING.lg, marginBottom: SPACING.sm };
  const checkbox = (checked: boolean, onToggle: () => void, label: string, testID: string) => (
    <Pressable testID={testID} onPress={onToggle} style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: SPACING.sm }}>
      <View style={{ width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: t.brand, backgroundColor: checked ? t.brand : "transparent", alignItems: "center", justifyContent: "center" }}>
        {checked ? <Feather name="check" size={14} color={t.onBrand} /> : null}
      </View>
      <Text style={{ color: t.onSurface, flex: 1 }}>{label}</Text>
    </Pressable>
  );
  const campoTesto = (campo: string, label: string, placeholder?: string) => (
    <View key={campo}>
      <Text style={[st.lbl, { color: t.onSurfaceSecondary }]}>{label}</Text>
      <TextInput
        testID={`par-${campo}`}
        value={parDati[campo]}
        onChangeText={(v) => setParDati({ ...parDati, [campo]: v })}
        placeholder={placeholder}
        placeholderTextColor={t.onSurfaceTertiary}
        style={[st.input, { backgroundColor: t.surfaceSecondary, color: t.onSurface, borderColor: t.border }]}
      />
    </View>
  );

  const contenutoParcelle = (
    <View>
      <PraticaPicker
        pratiche={pratiche}
        praticaId={praticaId}
        onChange={setPraticaId}
        helperText="Precompila parte assistita e dati del procedimento dalla pratica collegata."
      />

      <Text style={sezioneLbl}>Avvocato</Text>
      {campoTesto("avvocato_nome", "Nome e cognome")}
      {campoTesto("studio_indirizzo", "Indirizzo studio")}
      {campoTesto("studio_cf", "Codice fiscale")}
      {campoTesto("ordine_avvocati", "Ordine degli avvocati di")}
      {campoTesto("studio_assicurazione", "Assicurazione professionale")}

      <Text style={sezioneLbl}>Parti assistite</Text>
      <Text style={{ color: t.onSurfaceTertiary, fontSize: 11, fontStyle: "italic", marginBottom: SPACING.sm }}>
        Precompilate dal cliente collegato alla pratica (se presente), sempre modificabili: puoi aggiungerne altre.
      </Text>
      {partiAssistite.map((parte, i) => (
        <View key={i} style={{ marginTop: i === 0 ? 0 : SPACING.sm, padding: SPACING.md, borderRadius: RADIUS.md, backgroundColor: t.surfaceSecondary }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <TextInput
              testID={`par-parte-nominativo-${i}`}
              value={parte.nominativo}
              onChangeText={(v) => setPartiAssistite(partiAssistite.map((x, j) => j === i ? { ...x, nominativo: v } : x))}
              placeholder="Nome e cognome / Ragione sociale"
              placeholderTextColor={t.onSurfaceTertiary}
              style={[st.input, { flex: 1, backgroundColor: t.surface, color: t.onSurface, borderColor: t.border }]}
            />
            <Pressable testID={`par-parte-rimuovi-${i}`} onPress={() => setPartiAssistite(partiAssistite.filter((_, j) => j !== i))} style={{ padding: 8 }}>
              <Feather name="trash-2" size={16} color={t.onSurfaceTertiary} />
            </Pressable>
          </View>
          <Pressable
            testID={`par-parte-persona-giuridica-${i}`}
            onPress={() => setPartiAssistite(partiAssistite.map((x, j) => j === i ? { ...x, persona_giuridica: !x.persona_giuridica } : x))}
            style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: SPACING.sm }}
          >
            <View style={{ width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: t.brand, backgroundColor: parte.persona_giuridica ? t.brand : "transparent", alignItems: "center", justifyContent: "center" }}>
              {parte.persona_giuridica ? <Feather name="check" size={14} color={t.onBrand} /> : null}
            </View>
            <Text style={{ color: t.onSurface, flex: 1 }}>Persona giuridica</Text>
          </Pressable>
          {parte.persona_giuridica ? (
            <TextInput
              testID={`par-parte-rappresentante-${i}`}
              value={parte.rappresentante_legale}
              onChangeText={(v) => setPartiAssistite(partiAssistite.map((x, j) => j === i ? { ...x, rappresentante_legale: v } : x))}
              placeholder="Rappresentante legale"
              placeholderTextColor={t.onSurfaceTertiary}
              style={[st.input, { marginTop: SPACING.sm, backgroundColor: t.surface, color: t.onSurface, borderColor: t.border }]}
            />
          ) : null}
          <TextInput
            testID={`par-parte-cf-piva-${i}`}
            value={parte.cf_piva}
            onChangeText={(v) => setPartiAssistite(partiAssistite.map((x, j) => j === i ? { ...x, cf_piva: v } : x))}
            placeholder="CF / P.IVA"
            placeholderTextColor={t.onSurfaceTertiary}
            style={[st.input, { marginTop: SPACING.sm, backgroundColor: t.surface, color: t.onSurface, borderColor: t.border }]}
          />
        </View>
      ))}
      <Pressable
        testID="par-parte-aggiungi"
        onPress={() => setPartiAssistite([...partiAssistite, { nominativo: "", persona_giuridica: false, rappresentante_legale: "", cf_piva: "" }])}
        style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: SPACING.sm }}
      >
        <Feather name="plus-circle" size={16} color={t.brand} />
        <Text style={{ color: t.brand, fontWeight: "700", fontSize: 13 }}>Aggiungi un&apos;altra parte assistita</Text>
      </Pressable>

      <Text style={sezioneLbl}>Dati del procedimento</Text>
      {campoTesto("oggetto", "Descrizione del procedimento")}
      {campoTesto("controparte", "Contro")}
      <Text style={[st.lbl, { color: t.onSurfaceSecondary }]}>Competenza per giurisdizione o materia</Text>
      <View style={{ marginBottom: SPACING.sm }}>
        <SelectInput
          testID="par-competenza"
          value={parDati.competenza}
          onChange={(v) => setParDati({ ...parDati, competenza: v })}
          opzioni={COMPETENZE_PARCELLA}
          placeholder="Seleziona"
        />
      </View>
      {campoTesto("ufficio_giudiziario", "Ufficio giudiziario")}
      {campoTesto("sede_ufficio", "Ubicazione ufficio giudiziario")}
      <Text style={[st.lbl, { color: t.onSurfaceSecondary }]}>Valore della controversia €</Text>
      <TextInput
        testID="par-valore-causa"
        value={parDati.valore_causa}
        onChangeText={(v) => setParDati({ ...parDati, valore_causa: v })}
        keyboardType="numeric"
        placeholder="Precompilato dalla pratica collegata, se presente"
        placeholderTextColor={t.onSurfaceTertiary}
        style={[st.input, { backgroundColor: t.surfaceSecondary, color: t.onSurface, borderColor: t.border }]}
      />

      <Text style={sezioneLbl}>Attività e compensi — sezione automatica</Text>
      <Text style={{ color: t.onSurfaceTertiary, fontSize: 11, fontStyle: "italic", marginBottom: SPACING.sm }}>
        Le 4 fasi standard del preventivo: un importo (dai parametri forensi, per la competenza e il valore della controversia scelti sopra) con un aggiustamento percentuale discrezionale per fase.
      </Text>
      <Pressable
        testID="par-suggerisci-parametri-forensi"
        onPress={suggerisciDaParametriForensi}
        disabled={suggerendoPar}
        style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, padding: 10, borderRadius: RADIUS.md, backgroundColor: t.brandSecondary, opacity: suggerendoPar ? 0.6 : 1, marginBottom: SPACING.sm }}
      >
        <Feather name="zap" size={14} color={t.brand} />
        <Text style={{ color: t.brand, fontWeight: "700", fontSize: 13 }}>{suggerendoPar ? "Calcolo..." : "Calcola importi dai parametri forensi"}</Text>
      </Pressable>
      {!COMPETENZE_PARCELLA.find((c) => c.value === parDati.competenza)?.rito ? (
        <Text style={{ color: t.onSurfaceTertiary, fontSize: 11, fontStyle: "italic", marginBottom: SPACING.sm }}>
          Richiede una competenza con tabella di parametri forensi disponibile (Giudice di pace, Tribunale, Corte d&apos;Appello o Cassazione) e un valore della controversia.
        </Text>
      ) : null}
      {([
        ["fase_studio", "adj_studio_pct", "Fase di studio"],
        ["fase_introduttiva", "adj_introduttiva_pct", "Fase introduttiva"],
        ["fase_istruttoria", "adj_istruttoria_pct", "Fase istruttoria"],
        ["fase_decisionale", "adj_decisionale_pct", "Fase decisionale"],
      ] as const).map(([kImporto, kPct, label]) => (
        <View key={kImporto} style={{ marginTop: SPACING.sm, padding: SPACING.md, borderRadius: RADIUS.md, backgroundColor: t.surfaceSecondary }}>
          <Text style={{ color: t.onSurface, fontWeight: "700", fontSize: 13, marginBottom: SPACING.xs }}>{label}</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <View style={{ flex: 1 }}>
              <Text style={[st.lbl, { color: t.onSurfaceSecondary, marginTop: 0 }]}>Importo €</Text>
              <TextInput testID={`par-${kImporto}`} value={par[kImporto]} onChangeText={(v) => setPar({ ...par, [kImporto]: v })} keyboardType="numeric" style={[st.input, { backgroundColor: t.surface, color: t.onSurface, borderColor: t.border }]} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[st.lbl, { color: t.onSurfaceSecondary, marginTop: 0 }]}>Aggiustamento %</Text>
              <TextInput testID={`par-${kPct}`} value={par[kPct]} onChangeText={(v) => setPar({ ...par, [kPct]: v })} keyboardType="numeric" style={[st.input, { backgroundColor: t.surface, color: t.onSurface, borderColor: t.border }]} />
            </View>
          </View>
        </View>
      ))}

      <Text style={sezioneLbl}>Attività e compensi — sezione personalizzata</Text>
      <Text style={{ color: t.onSurfaceTertiary, fontSize: 11, fontStyle: "italic", marginBottom: SPACING.sm }}>
        Voci aggiuntive a importo libero (&quot;Compensi personalizzati&quot;): usale anche per diritti o fase esecutiva, non previsti dalle 4 fasi sopra.
      </Text>
      {vociCustom.map((v, i) => (
        <View key={i} style={{ marginTop: i === 0 ? 0 : SPACING.sm, flexDirection: "row", alignItems: "center", gap: 8 }}>
          <TextInput
            testID={`par-voce-custom-descrizione-${i}`}
            value={v.descrizione}
            onChangeText={(val) => setVociCustom(vociCustom.map((x, j) => j === i ? { ...x, descrizione: val } : x))}
            placeholder="Descrizione"
            placeholderTextColor={t.onSurfaceTertiary}
            style={[st.input, { flex: 2, backgroundColor: t.surfaceSecondary, color: t.onSurface, borderColor: t.border }]}
          />
          <TextInput
            testID={`par-voce-custom-importo-${i}`}
            value={v.importo}
            onChangeText={(val) => setVociCustom(vociCustom.map((x, j) => j === i ? { ...x, importo: val } : x))}
            keyboardType="numeric"
            placeholder="Importo €"
            placeholderTextColor={t.onSurfaceTertiary}
            style={[st.input, { flex: 1, backgroundColor: t.surfaceSecondary, color: t.onSurface, borderColor: t.border }]}
          />
          <Pressable testID={`par-voce-custom-rimuovi-${i}`} onPress={() => setVociCustom(vociCustom.filter((_, j) => j !== i))} style={{ padding: 8 }}>
            <Feather name="trash-2" size={16} color={t.onSurfaceTertiary} />
          </Pressable>
        </View>
      ))}
      <Pressable
        testID="par-voce-custom-aggiungi"
        onPress={() => setVociCustom([...vociCustom, { descrizione: "", importo: "" }])}
        style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: SPACING.sm }}
      >
        <Feather name="plus-circle" size={16} color={t.brand} />
        <Text style={{ color: t.brand, fontWeight: "700", fontSize: 13 }}>Aggiungi voce personalizzata</Text>
      </Pressable>

      <Text style={sezioneLbl}>Spese preventivate</Text>
      {vociSpese.map((v, i) => (
        <View key={i} style={{ marginTop: i === 0 ? 0 : SPACING.sm, padding: SPACING.md, borderRadius: RADIUS.md, backgroundColor: t.surfaceSecondary }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <TextInput
              testID={`par-spesa-descrizione-${i}`}
              value={v.descrizione}
              onChangeText={(val) => setVociSpese(vociSpese.map((x, j) => j === i ? { ...x, descrizione: val } : x))}
              placeholder="Voce di spesa"
              placeholderTextColor={t.onSurfaceTertiary}
              style={[st.input, { flex: 1, backgroundColor: t.surface, color: t.onSurface, borderColor: t.border }]}
            />
            <Pressable testID={`par-spesa-rimuovi-${i}`} onPress={() => setVociSpese(vociSpese.filter((_, j) => j !== i))} style={{ padding: 8 }}>
              <Feather name="trash-2" size={16} color={t.onSurfaceTertiary} />
            </Pressable>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: SPACING.sm }}>
            <TextInput
              testID={`par-spesa-importo-${i}`}
              value={v.importo}
              onChangeText={(val) => setVociSpese(vociSpese.map((x, j) => j === i ? { ...x, importo: val } : x))}
              keyboardType="numeric"
              placeholder="Importo €"
              placeholderTextColor={t.onSurfaceTertiary}
              style={[st.input, { flex: 1, backgroundColor: t.surface, color: t.onSurface, borderColor: t.border }]}
            />
            <Pressable
              testID={`par-spesa-esente-${i}`}
              onPress={() => setVociSpese(vociSpese.map((x, j) => j === i ? { ...x, esente: !x.esente } : x))}
              style={[st.pill, { backgroundColor: v.esente ? t.brand : t.surface, borderColor: t.border }]}
            >
              <Text style={{ color: v.esente ? t.onBrand : t.onSurfaceSecondary, fontSize: 12, fontWeight: "700" }}>{v.esente ? "Esente" : "Non esente"}</Text>
            </Pressable>
          </View>
        </View>
      ))}
      <Pressable
        testID="par-spesa-aggiungi"
        onPress={() => setVociSpese([...vociSpese, { descrizione: "", importo: "", esente: true }])}
        style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: SPACING.sm }}
      >
        <Feather name="plus-circle" size={16} color={t.brand} />
        <Text style={{ color: t.brand, fontWeight: "700", fontSize: 13 }}>Aggiungi voce di spesa</Text>
      </Pressable>

      <Text style={sezioneLbl}>Altri dati</Text>
      {checkbox(parDati.accessori_di_legge, () => setParDati({ ...parDati, accessori_di_legge: !parDati.accessori_di_legge }), "Applica accessori di legge (spese generali, CPA, IVA)", "par-accessori-di-legge")}
      {[
        ["spese_generali_pct", "Spese generali %"],
        ["cpa_pct", "CPA %"],
        ["iva_pct", "IVA %"],
        ["ritenuta_pct", "Ritenuta acconto %"],
      ].map(([k, l]) => (
        <View key={k as string}>
          <Text style={[st.lbl, { color: t.onSurfaceSecondary }]}>{l}</Text>
          <TextInput testID={`par-${k}`} value={par[k as string]} onChangeText={(v) => setPar({ ...par, [k as string]: v })} keyboardType="numeric" style={[st.input, { backgroundColor: t.surfaceSecondary, color: t.onSurface, borderColor: t.border }]} />
        </View>
      ))}
      {campoTesto("luogo", "Luogo")}
      <Text style={[st.lbl, { color: t.onSurfaceSecondary }]}>Data</Text>
      <DataInput testID="par-data-preventivo" value={parDati.data_preventivo} onChange={(iso) => setParDati({ ...parDati, data_preventivo: iso })} />

      <Pressable testID="btn-calc-par" onPress={calcPar} style={[st.submit, { backgroundColor: t.brand }]}>
        <Text style={{ color: t.onBrand, fontWeight: "700" }}>Calcola</Text>
      </Pressable>
      {risPar ? (
        <View style={[st.result, { backgroundColor: t.surfaceSecondary, borderColor: t.border }]}>
          {([
            ["A) Totale compensi per fase", risPar.compensi_fasi],
            ["B) Totale voci personalizzate", risPar.voci_custom_totale],
            ...(risPar.diritti ? [["Diritti", risPar.diritti]] : []),
            ...(risPar.maggiorazione ? [["Maggiorazione discrezionale", risPar.maggiorazione]] : []),
            ["Spese generali", risPar.spese_generali],
            ["Imp. previdenza", risPar.imponibile_previdenza],
            ["CPA", risPar.cpa],
            ["Imp. IVA", risPar.imponibile_iva],
            ["IVA", risPar.iva],
            ["Spese esenti IVA", risPar.spese_esenti],
            ["Spese non esenti", risPar.spese_imponibili],
            ["Ritenuta", -Math.abs(risPar.ritenuta_acconto || 0)],
          ] as [string, number][]).map(([l, v]) => (
            <View key={l as string} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 }}>
              <Text style={{ color: t.onSurfaceSecondary, fontSize: 13 }}>{l}</Text>
              <Text style={{ color: t.onSurface, fontSize: 13, fontVariant: ["tabular-nums"] }}>{formatEuro(v as number)}</Text>
            </View>
          ))}
          <View style={{ flexDirection: "row", justifyContent: "space-between", paddingTop: SPACING.sm, marginTop: SPACING.sm, borderTopWidth: 1, borderTopColor: t.border }}>
            <Text style={{ color: t.onSurface, fontSize: 15, fontWeight: "800" }}>TOTALE</Text>
            <Text testID="par-totale" style={{ color: t.brand, fontSize: 22, fontWeight: "800", fontVariant: ["tabular-nums"] }}>{formatEuro(risPar.totale)}</Text>
          </View>
          {!risPar.salvata ? (
            <>
              <Text style={[st.lbl, { color: t.onSurfaceSecondary, marginTop: SPACING.md }]}>Nome parcella (facoltativo)</Text>
              <TextInput
                testID="par-titolo"
                value={titoloPar}
                onChangeText={setTitoloPar}
                placeholder="Es. Acconto fase istruttoria"
                placeholderTextColor={t.onSurfaceTertiary}
                style={[st.input, { backgroundColor: t.surface, color: t.onSurface, borderColor: t.border }]}
              />
              <Pressable testID="save-par" onPress={savePar} disabled={saving} style={{ marginTop: SPACING.md, backgroundColor: t.brand, padding: 10, borderRadius: RADIUS.md, alignItems: "center", opacity: saving ? 0.6 : 1 }}>
                <Text style={{ color: t.onBrand, fontWeight: "700" }}>{saving ? "Salvataggio..." : isEditingPar ? "Salva modifiche" : "Salva parcella"}</Text>
              </Pressable>
            </>
          ) : <Text style={{ color: t.success, marginTop: 8 }}>✓ {isEditingPar ? "Modifiche salvate" : "Parcella salvata"}</Text>}
        </View>
      ) : null}
    </View>
  );

  if (locked) {
    return (
      <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: t.surfaceSecondary }}>
        <Header variant="hero" title={headerTitle} onBack={() => router.back()} />
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
          <ScrollView ref={scrollRef} contentContainerStyle={{ padding: SPACING.lg, paddingBottom: SPACING.xxxl + 80 }} keyboardShouldPersistTaps="handled">
            {contenutoParcelle}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  const CATEGORIE_CALC: { id: string; titolo: string; icona: string }[] = [
    ...CATEGORIE_MENU_CALCOLATORI.map((c) => ({ id: c.id, titolo: c.titolo, icona: c.icona })),
    { id: "altri-calcolatori", titolo: "Altri calcolatori", icona: "grid" },
    { id: "atti", titolo: "Atti (bozze di documenti)", icona: "file-text" },
  ];
  const vociCategoria = (catId: string): VoceMenuCalcolatori[] => {
    if (catId === "atti") return ATTI.map((a) => ({ nome: a.titolo, tipo: "atto" as const, attoId: a.id }));
    if (catId === "altri-calcolatori") return ALTRI_CALCOLATORI;
    return CATEGORIE_MENU_CALCOLATORI.find((c) => c.id === catId)?.voci || [];
  };

  const categoriaCorrente = CATEGORIE_CALC.find((c) => c.id === categoriaCalc);

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: t.surfaceSecondary }}>
      <Header variant="hero" title="Calcolatori" onBack={() => router.back()} />
      <ScrollView ref={scrollRef} contentContainerStyle={{ padding: SPACING.lg, paddingBottom: SPACING.xxxl + 80 }}>
        {CATEGORIE_CALC.map((cat) => {
          const voci = vociCategoria(cat.id);
          const disponibili = voci.filter((v) => v.tipo !== "in_arrivo").length;
          return (
            <Pressable
              key={cat.id}
              testID={`categoria-${cat.id}`}
              onPress={() => setCategoriaCalc(cat.id)}
              style={[st.calcCard, { backgroundColor: t.surface, borderColor: t.border, marginBottom: SPACING.sm }]}
            >
              <View style={[st.calcIcon, { backgroundColor: t.brandSecondary }]}>
                <Feather name={cat.icona as any} size={18} color={t.brand} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: t.onSurface, fontWeight: "700", fontSize: 14 }}>{cat.titolo}</Text>
                <Text style={{ color: t.onSurfaceTertiary, fontSize: 12, marginTop: 2 }}>
                  {disponibili < voci.length ? `${disponibili} di ${voci.length} voci` : `${voci.length} ${voci.length === 1 ? "voce" : "voci"}`}
                </Text>
              </View>
              <Feather name="chevron-right" size={18} color={t.onSurfaceTertiary} />
            </Pressable>
          );
        })}
      </ScrollView>

      {categoriaCalc ? (
        <SwipeBackScreen edges={["top"]} style={{ backgroundColor: t.surfaceSecondary }} onDismiss={() => setCategoriaCalc(null)} disabled={!!calcAperto || !!attoAperto}>
          <Header variant="hero" title={categoriaCorrente?.titolo || "Calcolatori"} onBack={() => setCategoriaCalc(null)} />
          <ScrollView contentContainerStyle={{ padding: SPACING.lg, paddingBottom: SPACING.xxxl }}>
            {vociCategoria(categoriaCalc).map((v, i) => {
              if (v.tipo === "in_arrivo") {
                return (
                  <View key={i} style={[st.calcCard, { backgroundColor: t.surfaceSecondary, borderColor: t.border, marginBottom: SPACING.sm, opacity: 0.55 }]}>
                    <View style={[st.calcIcon, { backgroundColor: t.border }]}>
                      <Feather name={categoriaCorrente?.icona as any} size={18} color={t.onSurfaceTertiary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: t.onSurfaceSecondary, fontWeight: "700", fontSize: 14 }}>{v.nome}</Text>
                      <Text style={{ color: t.onSurfaceTertiary, fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5, marginTop: 2 }}>In arrivo</Text>
                    </View>
                  </View>
                );
              }
              const sorgente = v.tipo === "calcolatore" ? CALCOLATORI.find((c) => c.id === v.calcId) : ATTI.find((a) => a.id === v.attoId);
              return (
                <Pressable
                  key={i}
                  testID={v.tipo === "atto" ? `atto-${v.attoId}` : `calc-${v.calcId}`}
                  onPress={() => (v.tipo === "atto" ? apriAtto(v.attoId) : apriCalcolatore(v.calcId))}
                  style={[st.calcCard, { backgroundColor: t.surface, borderColor: t.border, marginBottom: SPACING.sm }]}
                >
                  <View style={[st.calcIcon, { backgroundColor: t.brandSecondary }]}>
                    <Feather name={(sorgente?.icona || categoriaCorrente?.icona) as any} size={18} color={t.brand} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: t.onSurface, fontWeight: "700", fontSize: 14 }}>{v.nome}</Text>
                    <Text style={{ color: t.onSurfaceTertiary, fontSize: 12, marginTop: 2 }}>
                      {sorgente?.sottotitolo}
                    </Text>
                  </View>
                  <Feather name="chevron-right" size={18} color={t.onSurfaceTertiary} />
                </Pressable>
              );
            })}
          </ScrollView>
        </SwipeBackScreen>
      ) : null}

      {attoAperto ? (
        <SwipeBackScreen edges={["top"]} style={{ backgroundColor: t.surface }} onDismiss={() => setAttoAperto(null)}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
            <Header variant="hero" title={attoCorrente?.titolo || "Atto"} onBack={() => setAttoAperto(null)} />
            <ScrollView contentContainerStyle={{ padding: SPACING.lg, paddingBottom: SPACING.xxxl }} keyboardShouldPersistTaps="handled">
              <Text style={{ color: t.warning, fontSize: 12, marginBottom: SPACING.md }}>
                Il documento generato è una bozza: va rivista e personalizzata prima dell&apos;invio.
              </Text>
              {attoAperto && CAMPI_ATTI[attoAperto].map((c) => {
                if (c.mostraSe && !c.mostraSe(attoForm)) return null;
                return (
                  <React.Fragment key={c.key}>
                    {c.tipo === "bool" ? (
                      <Pressable
                        testID={`atto-campo-${c.key}`}
                        onPress={() => setAttoForm({ ...attoForm, [c.key]: attoForm[c.key] ? "" : "true" })}
                        style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: SPACING.md, marginBottom: SPACING.sm }}
                      >
                        <View style={{ width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: t.brand, backgroundColor: attoForm[c.key] ? t.brand : "transparent", alignItems: "center", justifyContent: "center" }}>
                          {attoForm[c.key] ? <Feather name="check" size={14} color={t.onBrand} /> : null}
                        </View>
                        <Text style={{ color: t.onSurface, flex: 1 }}>{c.label}</Text>
                      </Pressable>
                    ) : (
                      <View>
                        <Text style={[st.lbl, { color: t.onSurfaceSecondary }]}>{c.label}{c.obbligatorio ? " *" : ""}</Text>
                        {c.opzioni ? (
                          <View style={{ marginBottom: SPACING.sm }}>
                            <SelectInput
                              testID={`atto-campo-${c.key}`}
                              value={attoForm[c.key] || ""}
                              onChange={(v) => setAttoForm({ ...attoForm, [c.key]: v })}
                              opzioni={c.opzioni}
                            />
                          </View>
                        ) : c.dataIso ? (
                          <DataInput testID={`atto-campo-${c.key}`} value={attoForm[c.key] || ""} onChange={(v) => setAttoForm({ ...attoForm, [c.key]: v })} />
                        ) : (
                          <TextInput
                            testID={`atto-campo-${c.key}`}
                            value={attoForm[c.key] || ""}
                            onChangeText={(v) => setAttoForm({ ...attoForm, [c.key]: v })}
                            multiline={c.multiline}
                            style={[st.input, c.multiline ? { minHeight: 80, textAlignVertical: "top" } : null, { backgroundColor: t.surfaceSecondary, color: t.onSurface, borderColor: t.border }]}
                          />
                        )}
                      </View>
                    )}
                    {attoAperto === "messa_in_mora" && c.key === "destinatario_email_pec" ? (
                      <View>
                        <Text style={[st.lbl, { color: t.onSurfaceSecondary, marginTop: SPACING.md }]}>Crediti</Text>
                        {attoCrediti.map((v, i) => (
                          <View key={i} style={{ marginTop: i === 0 ? 0 : SPACING.sm, flexDirection: "row", alignItems: "center", gap: 8 }}>
                            <TextInput
                              testID={`atto-credito-descrizione-${i}`}
                              value={v.descrizione}
                              onChangeText={(val) => setAttoCrediti(attoCrediti.map((x, j) => (j === i ? { ...x, descrizione: val } : x)))}
                              placeholder="Descrizione"
                              placeholderTextColor={t.onSurfaceTertiary}
                              style={[st.input, { flex: 2, backgroundColor: t.surfaceSecondary, color: t.onSurface, borderColor: t.border }]}
                            />
                            <TextInput
                              testID={`atto-credito-importo-${i}`}
                              value={v.importo}
                              onChangeText={(val) => setAttoCrediti(attoCrediti.map((x, j) => (j === i ? { ...x, importo: val } : x)))}
                              keyboardType="numeric"
                              placeholder="Importo €"
                              placeholderTextColor={t.onSurfaceTertiary}
                              style={[st.input, { flex: 1, backgroundColor: t.surfaceSecondary, color: t.onSurface, borderColor: t.border }]}
                            />
                            <Pressable testID={`atto-credito-rimuovi-${i}`} onPress={() => setAttoCrediti(attoCrediti.filter((_, j) => j !== i))} style={{ padding: 8 }}>
                              <Feather name="trash-2" size={16} color={t.onSurfaceTertiary} />
                            </Pressable>
                          </View>
                        ))}
                        <Pressable
                          testID="atto-credito-aggiungi"
                          onPress={() => setAttoCrediti([...attoCrediti, { descrizione: "", importo: "" }])}
                          style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: SPACING.sm, marginBottom: SPACING.sm }}
                        >
                          <Feather name="plus-circle" size={16} color={t.brand} />
                          <Text style={{ color: t.brand, fontWeight: "700", fontSize: 13 }}>Aggiungi un altro credito</Text>
                        </Pressable>
                      </View>
                    ) : null}
                    {attoAperto === "procura_alle_liti" && c.key === "incipit" ? (
                      <View>
                        <Text style={[st.lbl, { color: t.onSurfaceSecondary, marginTop: SPACING.md }]}>Parti assistite</Text>
                        {procuraParti.map((p, i) => (
                          <View key={i} style={{ marginTop: i === 0 ? 0 : SPACING.md, padding: SPACING.md, borderRadius: RADIUS.md, backgroundColor: t.surfaceSecondary }}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                              <TextInput
                                testID={`procura-parte-nome-${i}`}
                                value={p.nome}
                                onChangeText={(val) => setProcuraParti(procuraParti.map((x, j) => (j === i ? { ...x, nome: val } : x)))}
                                placeholder="Nome / Ragione sociale"
                                placeholderTextColor={t.onSurfaceTertiary}
                                style={[st.input, { flex: 1, backgroundColor: t.surface, color: t.onSurface, borderColor: t.border }]}
                              />
                              <Pressable testID={`procura-parte-rimuovi-${i}`} onPress={() => setProcuraParti(procuraParti.filter((_, j) => j !== i))} style={{ padding: 8 }}>
                                <Feather name="trash-2" size={16} color={t.onSurfaceTertiary} />
                              </Pressable>
                            </View>
                            <Pressable
                              testID={`procura-parte-persona-giuridica-${i}`}
                              onPress={() => setProcuraParti(procuraParti.map((x, j) => (j === i ? { ...x, persona_giuridica: !x.persona_giuridica } : x)))}
                              style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: SPACING.sm }}
                            >
                              <View style={{ width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: t.brand, backgroundColor: p.persona_giuridica ? t.brand : "transparent", alignItems: "center", justifyContent: "center" }}>
                                {p.persona_giuridica ? <Feather name="check" size={14} color={t.onBrand} /> : null}
                              </View>
                              <Text style={{ color: t.onSurface, flex: 1 }}>Persona giuridica</Text>
                            </Pressable>
                            {p.persona_giuridica ? (
                              <TextInput
                                testID={`procura-parte-legale-rappresentante-${i}`}
                                value={p.legale_rappresentante}
                                onChangeText={(val) => setProcuraParti(procuraParti.map((x, j) => (j === i ? { ...x, legale_rappresentante: val } : x)))}
                                placeholder="Legale rappresentante"
                                placeholderTextColor={t.onSurfaceTertiary}
                                style={[st.input, { marginTop: SPACING.sm, backgroundColor: t.surface, color: t.onSurface, borderColor: t.border }]}
                              />
                            ) : null}
                            <TextInput
                              testID={`procura-parte-cf-piva-${i}`}
                              value={p.cf_piva}
                              onChangeText={(val) => setProcuraParti(procuraParti.map((x, j) => (j === i ? { ...x, cf_piva: val } : x)))}
                              placeholder="C.F. / P.IVA"
                              placeholderTextColor={t.onSurfaceTertiary}
                              style={[st.input, { marginTop: SPACING.sm, backgroundColor: t.surface, color: t.onSurface, borderColor: t.border }]}
                            />
                            <TextInput
                              testID={`procura-parte-indirizzo-${i}`}
                              value={p.indirizzo}
                              onChangeText={(val) => setProcuraParti(procuraParti.map((x, j) => (j === i ? { ...x, indirizzo: val } : x)))}
                              placeholder="Indirizzo / sede"
                              placeholderTextColor={t.onSurfaceTertiary}
                              style={[st.input, { marginTop: SPACING.sm, backgroundColor: t.surface, color: t.onSurface, borderColor: t.border }]}
                            />
                          </View>
                        ))}
                        <Pressable
                          testID="procura-parte-aggiungi"
                          onPress={() => setProcuraParti([...procuraParti, { nome: "", persona_giuridica: false, legale_rappresentante: "", cf_piva: "", indirizzo: "" }])}
                          style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: SPACING.sm, marginBottom: SPACING.sm }}
                        >
                          <Feather name="plus-circle" size={16} color={t.brand} />
                          <Text style={{ color: t.brand, fontWeight: "700", fontSize: 13 }}>Aggiungi un&apos;altra parte assistita</Text>
                        </Pressable>
                      </View>
                    ) : null}
                    {attoAperto === "procura_alle_liti" && c.key === "dati_causa" ? (
                      <View>
                        <Text style={[st.lbl, { color: t.onSurfaceSecondary, marginTop: SPACING.md }]}>Avvocati</Text>
                        {procuraAvvocati.map((a, i) => (
                          <View key={i} style={{ marginTop: i === 0 ? 0 : SPACING.md, padding: SPACING.md, borderRadius: RADIUS.md, backgroundColor: t.surfaceSecondary }}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                              <TextInput
                                testID={`procura-avvocato-nome-${i}`}
                                value={a.nome}
                                onChangeText={(val) => setProcuraAvvocati(procuraAvvocati.map((x, j) => (j === i ? { ...x, nome: val } : x)))}
                                placeholder="Nome e cognome"
                                placeholderTextColor={t.onSurfaceTertiary}
                                style={[st.input, { flex: 1, backgroundColor: t.surface, color: t.onSurface, borderColor: t.border }]}
                              />
                              <Pressable testID={`procura-avvocato-rimuovi-${i}`} onPress={() => setProcuraAvvocati(procuraAvvocati.filter((_, j) => j !== i))} style={{ padding: 8 }}>
                                <Feather name="trash-2" size={16} color={t.onSurfaceTertiary} />
                              </Pressable>
                            </View>
                            <View style={{ marginTop: SPACING.sm }}>
                              <SelectInput
                                testID={`procura-avvocato-ordine-${i}`}
                                value={a.ordine}
                                onChange={(val) => setProcuraAvvocati(procuraAvvocati.map((x, j) => (j === i ? { ...x, ordine: val } : x)))}
                                opzioni={ORDINI_FORENSI}
                                placeholder="Ordine forense"
                              />
                            </View>
                            <TextInput
                              testID={`procura-avvocato-cf-${i}`}
                              value={a.cf}
                              onChangeText={(val) => setProcuraAvvocati(procuraAvvocati.map((x, j) => (j === i ? { ...x, cf: val } : x)))}
                              placeholder="Codice fiscale"
                              placeholderTextColor={t.onSurfaceTertiary}
                              style={[st.input, { marginTop: SPACING.sm, backgroundColor: t.surface, color: t.onSurface, borderColor: t.border }]}
                            />
                            <Pressable
                              testID={`procura-avvocato-eletto-domicilio-${i}`}
                              onPress={() => setProcuraAvvocati(procuraAvvocati.map((x, j) => (j === i ? { ...x, eletto_domicilio: !x.eletto_domicilio } : x)))}
                              style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: SPACING.sm }}
                            >
                              <View style={{ width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: t.brand, backgroundColor: a.eletto_domicilio ? t.brand : "transparent", alignItems: "center", justifyContent: "center" }}>
                                {a.eletto_domicilio ? <Feather name="check" size={14} color={t.onBrand} /> : null}
                              </View>
                              <Text style={{ color: t.onSurface, flex: 1 }}>Eletto domicilio presso questo avvocato</Text>
                            </Pressable>
                            {a.eletto_domicilio ? (
                              <TextInput
                                testID={`procura-avvocato-indirizzo-studio-${i}`}
                                value={a.indirizzo_studio}
                                onChangeText={(val) => setProcuraAvvocati(procuraAvvocati.map((x, j) => (j === i ? { ...x, indirizzo_studio: val } : x)))}
                                placeholder="Indirizzo dello studio"
                                placeholderTextColor={t.onSurfaceTertiary}
                                style={[st.input, { marginTop: SPACING.sm, backgroundColor: t.surface, color: t.onSurface, borderColor: t.border }]}
                              />
                            ) : null}
                            <Pressable
                              testID={`procura-avvocato-autentica-firme-${i}`}
                              onPress={() => setProcuraAvvocati(procuraAvvocati.map((x, j) => (j === i ? { ...x, autentica_firme: !x.autentica_firme } : x)))}
                              style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: SPACING.sm }}
                            >
                              <View style={{ width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: t.brand, backgroundColor: a.autentica_firme ? t.brand : "transparent", alignItems: "center", justifyContent: "center" }}>
                                {a.autentica_firme ? <Feather name="check" size={14} color={t.onBrand} /> : null}
                              </View>
                              <Text style={{ color: t.onSurface, flex: 1 }}>Autentica le firme degli assistiti</Text>
                            </Pressable>
                          </View>
                        ))}
                        <Pressable
                          testID="procura-avvocato-aggiungi"
                          onPress={() => setProcuraAvvocati([...procuraAvvocati, { nome: "", cf: "", ordine: "", eletto_domicilio: false, indirizzo_studio: "", autentica_firme: false }])}
                          style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: SPACING.sm, marginBottom: SPACING.sm }}
                        >
                          <Feather name="plus-circle" size={16} color={t.brand} />
                          <Text style={{ color: t.brand, fontWeight: "700", fontSize: 13 }}>Aggiungi un altro avvocato</Text>
                        </Pressable>
                      </View>
                    ) : null}
                  </React.Fragment>
                );
              })}
              <PraticaPicker
                pratiche={pratiche}
                praticaId={praticaId}
                onChange={setPraticaId}
                helperText={praticaId ? "Sarà collegato a quella pratica." : "Non sarà collegato a nessuna pratica."}
              />
              <Pressable testID="btn-genera-atto" onPress={generaAtto} disabled={attoGenerando} style={[st.submit, { backgroundColor: t.brand, opacity: attoGenerando ? 0.6 : 1 }]}>
                <Text style={{ color: t.onBrand, fontWeight: "700" }}>{attoGenerando ? "Generazione..." : "Genera documento"}</Text>
              </Pressable>
              {attoGenerato ? (
                <View style={[st.result, { backgroundColor: t.brandSecondary, borderColor: t.brand }]}>
                  <Text style={{ color: t.onBrandSecondary, fontSize: 12, fontWeight: "700" }}>BOZZA GENERATA</Text>
                  <Text style={{ color: t.onBrandSecondary, marginTop: 4 }}>{attoGenerato.titolo}</Text>
                  <Pressable
                    testID="apri-atto-docx"
                    onPress={() => scegliAperturaDocumento(`/atti/${attoGenerato.id}/docx`, `/atti/${attoGenerato.id}/docx/view-link`, `${attoGenerato.tipo}.docx`)}
                    style={{ marginTop: SPACING.md, flexDirection: "row", gap: 6, alignItems: "center", justifyContent: "center", backgroundColor: t.brand, padding: 10, borderRadius: RADIUS.md }}
                  >
                    <Feather name="download" size={14} color={t.onBrand} />
                    <Text style={{ color: t.onBrand, fontWeight: "700" }}>Apri documento</Text>
                  </Pressable>
                </View>
              ) : null}
            </ScrollView>
          </KeyboardAvoidingView>
        </SwipeBackScreen>
      ) : null}

      {calcAperto ? (
        <SwipeBackScreen edges={["top"]} style={{ backgroundColor: t.surface }} onDismiss={() => setCalcAperto(null)}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
            <Header variant="hero" title={headerTitle} onBack={() => setCalcAperto(null)} />
            <ScrollView contentContainerStyle={{ padding: SPACING.lg, paddingBottom: SPACING.xxxl }} keyboardShouldPersistTaps="handled">
              {calcAperto === "scadenze" ? contenutoScadenze : null}
              {calcAperto === "parcelle" ? contenutoParcelle : null}

              {calcAperto === "termini-memorie" ? (
                <View>
                  <Text style={[st.lbl, { color: t.onSurfaceSecondary }]}>Tipo di termine</Text>
                  <View style={{ marginBottom: SPACING.sm }}>
                    <SelectInput
                      testID="mem-tipo"
                      value={tipoMem}
                      onChange={(v) => setTipoMem(v as typeof tipoMem)}
                      opzioni={[
                        { value: "171-ter", label: "Memorie integrative (art. 171-ter)" },
                        { value: "189", label: "Conclusionali, trattazione scritta (art. 189)" },
                        { value: "275-bis", label: "Conclusionali, discussione orale (art. 275-bis)" },
                      ]}
                    />
                  </View>
                  <Text style={[st.lbl, { color: t.onSurfaceSecondary }]}>{tipoMem === "171-ter" ? "Data udienza di trattazione" : "Data udienza collegiale di discussione"}</Text>
                  <DataInput testID="mem-udienza" value={memUdienza} onChange={setMemUdienza} />
                  <Pressable testID="mem-toggle-feriale" onPress={() => setMemEscludiFer(!memEscludiFer)} style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: SPACING.md, marginTop: SPACING.md }}>
                    <View style={{ width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: t.brand, backgroundColor: memEscludiFer ? t.brand : "transparent", alignItems: "center", justifyContent: "center" }}>
                      {memEscludiFer ? <Feather name="check" size={14} color={t.onBrand} /> : null}
                    </View>
                    <Text style={{ color: t.onSurface }}>Applica sospensione feriale (1-31 agosto)</Text>
                  </Pressable>
                  <Pressable testID="btn-calc-mem" onPress={calcolaMemorie} disabled={calcolandoMem} style={[st.submit, { backgroundColor: t.brand, opacity: calcolandoMem ? 0.6 : 1 }]}>
                    <Text style={{ color: t.onBrand, fontWeight: "700" }}>{calcolandoMem ? "Calcolo..." : "Calcola"}</Text>
                  </Pressable>
                  {risMem ? (
                    <View style={[st.result, { backgroundColor: t.brandSecondary, borderColor: t.brand }]}>
                      <Text style={{ color: t.onBrandSecondary, fontSize: 12, fontWeight: "700" }}>
                        {risMem.tipo === "189" ? "CONCLUSIONALI EX ART. 189 C.P.C." : risMem.tipo === "275-bis" ? "CONCLUSIONALI EX ART. 275-BIS C.P.C." : "MEMORIE EX ART. 171-TER C.P.C."}
                      </Text>
                      <View style={{ marginTop: SPACING.sm, gap: 4 }}>
                        {risMem.tipo === "189" ? (
                          <>
                            <Text style={{ color: t.onBrandSecondary, fontSize: 13 }}>Note precisazione conclusioni (-60 gg): <Text style={{ fontWeight: "800" }}>{isoToDataIt(risMem.prima_memoria)}</Text></Text>
                            <Text style={{ color: t.onBrandSecondary, fontSize: 13 }}>Comparse conclusionali (-30 gg): <Text style={{ fontWeight: "800" }}>{isoToDataIt(risMem.seconda_memoria)}</Text></Text>
                            <Text style={{ color: t.onBrandSecondary, fontSize: 13 }}>Memorie di replica (-15 gg): <Text style={{ fontWeight: "800" }}>{isoToDataIt(risMem.terza_memoria)}</Text></Text>
                          </>
                        ) : risMem.tipo === "275-bis" ? (
                          <>
                            <Text style={{ color: t.onBrandSecondary, fontSize: 13 }}>Note precisazione conclusioni (-30 gg): <Text style={{ fontWeight: "800" }}>{isoToDataIt(risMem.prima_memoria)}</Text></Text>
                            <Text style={{ color: t.onBrandSecondary, fontSize: 13 }}>Note conclusive (-15 gg): <Text style={{ fontWeight: "800" }}>{isoToDataIt(risMem.seconda_memoria)}</Text></Text>
                          </>
                        ) : (
                          <>
                            <Text style={{ color: t.onBrandSecondary, fontSize: 13 }}>1ª memoria (-40 gg): <Text style={{ fontWeight: "800" }}>{isoToDataIt(risMem.prima_memoria)}</Text></Text>
                            <Text style={{ color: t.onBrandSecondary, fontSize: 13 }}>2ª memoria (-20 gg): <Text style={{ fontWeight: "800" }}>{isoToDataIt(risMem.seconda_memoria)}</Text></Text>
                            <Text style={{ color: t.onBrandSecondary, fontSize: 13 }}>3ª memoria (-10 gg): <Text style={{ fontWeight: "800" }}>{isoToDataIt(risMem.terza_memoria)}</Text></Text>
                          </>
                        )}
                      </View>
                      {!risMem.salvata ? (
                        <>
                          <PraticaPicker
                            pratiche={pratiche}
                            praticaId={praticaId}
                            onChange={setPraticaId}
                            helperText={praticaId ? "Compariranno anche nella scheda di quella pratica." : "Compariranno solo qui e nel calendario."}
                          />
                          <Pressable testID="save-mem" onPress={salvaMemorie} disabled={savingMem} style={{ marginTop: SPACING.md, backgroundColor: t.brand, padding: 10, borderRadius: RADIUS.md, alignItems: "center", opacity: savingMem ? 0.6 : 1 }}>
                            <Text style={{ color: t.onBrand, fontWeight: "700" }}>{savingMem ? "Salvataggio..." : risMem.tipo === "275-bis" ? "Salva le 2 scadenze" : "Salva le 3 scadenze"}</Text>
                          </Pressable>
                        </>
                      ) : <Text style={{ color: t.success, marginTop: 8 }}>✓ Salvate</Text>}
                    </View>
                  ) : null}
                </View>
              ) : null}

              {calcAperto === "interessi-legali" || calcAperto === "interessi-mora" ? (
                <View>
                  <Text style={[st.lbl, { color: t.onSurfaceSecondary }]}>Capitale €</Text>
                  <TextInput testID="tassi-capitale" value={tassiCapitale} onChangeText={setTassiCapitale} keyboardType="numeric" style={[st.input, { backgroundColor: t.surfaceSecondary, color: t.onSurface, borderColor: t.border }]} />
                  <Text style={[st.lbl, { color: t.onSurfaceSecondary }]}>Dal</Text>
                  <DataInput testID="tassi-data-inizio" value={tassiDataInizio} onChange={setTassiDataInizio} />
                  <Text style={[st.lbl, { color: t.onSurfaceSecondary }]}>Al</Text>
                  <DataInput testID="tassi-data-fine" value={tassiDataFine} onChange={setTassiDataFine} />
                  {calcAperto === "interessi-mora" ? (
                    <>
                      <Pressable
                        testID="tassi-prodotti-agricoli"
                        onPress={() => {
                          const nuovo = !tassiProdottiAgricoli;
                          setTassiProdottiAgricoli(nuovo);
                          setTassiMaggiorazione(nuovo ? "4" : "");
                        }}
                        style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: SPACING.sm, marginBottom: SPACING.sm }}
                      >
                        <View style={{ width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: t.brand, backgroundColor: tassiProdottiAgricoli ? t.brand : "transparent", alignItems: "center", justifyContent: "center" }}>
                          {tassiProdottiAgricoli ? <Feather name="check" size={14} color={t.onBrand} /> : null}
                        </View>
                        <Text style={{ color: t.onSurface, flex: 1, fontSize: 13 }}>Cessione di prodotti agricoli e agroalimentari: +4 punti percentuali (art. 4 c. 2 D.Lgs. 198/2021)</Text>
                      </Pressable>
                      <Text style={[st.lbl, { color: t.onSurfaceSecondary }]}>Maggiorazione aggiuntiva sul tasso % (facoltativa — la maggiorazione statutaria, 7 punti fino al 2012 e 8 dal 2013, si applica già in automatico in base alla data, art. 5 D.Lgs. 231/2002)</Text>
                      <TextInput testID="tassi-maggiorazione" value={tassiMaggiorazione} onChangeText={setTassiMaggiorazione} keyboardType="numeric" style={[st.input, { backgroundColor: t.surfaceSecondary, color: t.onSurface, borderColor: t.border }]} />
                    </>
                  ) : (
                    <>
                      <Text style={[st.lbl, { color: t.onSurfaceSecondary }]}>Capitalizzazione</Text>
                      <SelectInput testID="tassi-capitalizzazione" value={tassiCapitalizzazione} onChange={setTassiCapitalizzazione} opzioni={CAPITALIZZAZIONI} />
                    </>
                  )}
                  <Pressable testID="btn-calc-tassi" onPress={() => calcolaTassi(calcAperto)} disabled={calcolandoTassi} style={[st.submit, { backgroundColor: t.brand, opacity: calcolandoTassi ? 0.6 : 1 }]}>
                    <Text style={{ color: t.onBrand, fontWeight: "700" }}>{calcolandoTassi ? "Calcolo..." : "Calcola"}</Text>
                  </Pressable>
                  {risTassi ? (
                    <View style={[st.result, { backgroundColor: t.brandSecondary, borderColor: t.brand }]}>
                      <Text style={{ color: t.onBrandSecondary, fontSize: 12, fontWeight: "700" }}>INTERESSI MATURATI</Text>
                      <Text testID="tassi-result" style={{ color: t.onBrandSecondary, fontSize: 26, fontWeight: "800", fontVariant: ["tabular-nums"] }}>{formatEuro(risTassi.interessi)}</Text>
                      <Text style={{ color: t.onBrandSecondary, marginTop: 4, fontSize: 12 }}>Totale (capitale + interessi): {formatEuro(risTassi.totale)}</Text>
                      {(risTassi.dettaglio || []).map((d: any, i: number) => (
                        <View key={i} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 3, marginTop: i === 0 ? SPACING.sm : 0 }}>
                          <Text style={{ color: t.onBrandSecondary, fontSize: 11 }}>{isoToDataIt(d.dal)} → {isoToDataIt(d.al)} ({d.tasso_pct ?? d.tasso_applicato_pct}%)</Text>
                          <Text style={{ color: t.onBrandSecondary, fontSize: 11, fontVariant: ["tabular-nums"] }}>{formatEuro(d.interesse)}</Text>
                        </View>
                      ))}
                    </View>
                  ) : null}
                </View>
              ) : null}

              {calcAperto === "contributo-unificato" ? (
                <View>
                  <Text style={[st.lbl, { color: t.onSurfaceSecondary }]}>Procedimento a contributo fisso</Text>
                  <SelectInput testID="cu-procedura-fissa" value={cuProceduraFissa} onChange={setCuProceduraFissa} opzioni={PROCEDURE_FISSE_CU} />
                  {!cuProceduraFissa ? (
                    <>
                      <Text style={[st.lbl, { color: t.onSurfaceSecondary }]}>Processo</Text>
                      <SelectInput
                        testID="cu-processo"
                        value={cuProcesso}
                        onChange={(v) => {
                          setCuProcesso(v);
                          if (v === "amministrativo" && cuGiudizio === "cassazione") setCuGiudizio("primo_grado");
                        }}
                        opzioni={PROCESSI_CU}
                      />
                      <Text style={[st.lbl, { color: t.onSurfaceSecondary }]}>Giudizio</Text>
                      <SelectInput testID="cu-giudizio" value={cuGiudizio} onChange={setCuGiudizio} opzioni={cuProcesso === "amministrativo" ? GIUDIZI_CU_AMMINISTRATIVO : GIUDIZI_CU} />
                      {cuProcesso === "amministrativo" ? (
                        <>
                          <Text style={[st.lbl, { color: t.onSurfaceSecondary }]}>Rito</Text>
                          <SelectInput testID="cu-rito-amministrativo" value={cuRitoAmministrativo} onChange={setCuRitoAmministrativo} opzioni={RITI_AMMINISTRATIVI_CU} />
                        </>
                      ) : null}
                      {cuProcesso !== "amministrativo" || cuRitoAmministrativo === "appalti_pubblici" ? (
                        <>
                          <Text style={[st.lbl, { color: t.onSurfaceSecondary }]}>Valore della causa</Text>
                          <SelectInput
                            testID="cu-valore-tipo"
                            value={cuValoreTipo}
                            onChange={setCuValoreTipo}
                            opzioni={cuProcesso === "amministrativo" ? VALORE_TIPI_CU_APPALTI : cuProcesso === "tributario" ? VALORE_TIPI_CU_TRIBUTARIO : VALORE_TIPI_CU_CIVILE}
                          />
                          {cuValoreTipo === "determinato" ? (
                            <TextInput testID="cu-valore-causa" value={cuValoreCausa} onChangeText={setCuValoreCausa} keyboardType="numeric" style={[st.input, { backgroundColor: t.surfaceSecondary, color: t.onSurface, borderColor: t.border }]} />
                          ) : null}
                          {cuProcesso === "civile" && cuValoreTipo === "indeterminabile" ? (
                            <>
                              <Text style={[st.lbl, { color: t.onSurfaceSecondary }]}>Ufficio giudiziario</Text>
                              <SelectInput testID="cu-ufficio" value={cuUfficio} onChange={setCuUfficio} opzioni={UFFICI_CU} />
                            </>
                          ) : null}
                        </>
                      ) : null}
                      {cuProcesso === "civile" ? (
                        <Pressable
                          testID="cu-riduzione-50"
                          onPress={() => setCuRiduzione50(!cuRiduzione50)}
                          style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: SPACING.sm, marginBottom: SPACING.sm }}
                        >
                          <View style={{ width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: t.brand, backgroundColor: cuRiduzione50 ? t.brand : "transparent", alignItems: "center", justifyContent: "center" }}>
                            {cuRiduzione50 ? <Feather name="check" size={14} color={t.onBrand} /> : null}
                          </View>
                          <Text style={{ color: t.onSurface, flex: 1, fontSize: 13 }}>Riduzione del 50% (ingiunzione, sfratto, cautelari/possessori, ATP, lavoro/pubblico impiego)</Text>
                        </Pressable>
                      ) : null}
                    </>
                  ) : null}
                  <Pressable testID="btn-calc-cu" onPress={calcolaContributoUnificato} disabled={calcolandoCu} style={[st.submit, { backgroundColor: t.brand, opacity: calcolandoCu ? 0.6 : 1 }]}>
                    <Text style={{ color: t.onBrand, fontWeight: "700" }}>{calcolandoCu ? "Calcolo..." : "Calcola"}</Text>
                  </Pressable>
                  {risCu ? (
                    <View style={[st.result, { backgroundColor: t.brandSecondary, borderColor: t.brand }]}>
                      <Text style={{ color: t.onBrandSecondary, fontSize: 12, fontWeight: "700" }}>CONTRIBUTO UNIFICATO</Text>
                      <Text testID="cu-result" style={{ color: t.onBrandSecondary, fontSize: 26, fontWeight: "800", fontVariant: ["tabular-nums"] }}>{formatEuro(risCu.contributo_unificato)}</Text>
                      {risCu.descrizione ? <Text style={{ color: t.onBrandSecondary, marginTop: 4, fontSize: 12 }}>{risCu.descrizione}</Text> : null}
                    </View>
                  ) : null}
                </View>
              ) : null}

              {calcAperto === "rivalutazione-istat" ? (
                <View>
                  <Text style={[st.lbl, { color: t.onSurfaceSecondary }]}>Capitale €</Text>
                  <TextInput testID="istat-capitale" value={istatCapitale} onChangeText={setIstatCapitale} keyboardType="numeric" style={[st.input, { backgroundColor: t.surfaceSecondary, color: t.onSurface, borderColor: t.border }]} />
                  <Text style={[st.lbl, { color: t.onSurfaceSecondary }]}>Dal</Text>
                  <DataInput testID="istat-data-inizio" value={istatDataInizio} onChange={setIstatDataInizio} />
                  <Text style={[st.lbl, { color: t.onSurfaceSecondary }]}>Al</Text>
                  <DataInput testID="istat-data-fine" value={istatDataFine} onChange={setIstatDataFine} />
                  <Text style={[st.lbl, { color: t.onSurfaceSecondary }]}>Rivaluta al % (100 ordinario, 75 tipico per i canoni di locazione)</Text>
                  <TextInput testID="istat-rivaluta-al" value={istatRivalutaAlPct} onChangeText={setIstatRivalutaAlPct} keyboardType="numeric" style={[st.input, { backgroundColor: t.surfaceSecondary, color: t.onSurface, borderColor: t.border }]} />
                  <Text style={[st.lbl, { color: t.onSurfaceSecondary }]}>Modalità</Text>
                  <SelectInput testID="istat-modalita" value={istatModalita} onChange={setIstatModalita} opzioni={MODALITA_ISTAT} />
                  <Text style={{ color: t.onSurfaceTertiary, fontSize: 11, marginTop: SPACING.sm }}>
                    Indice FOI recuperato automaticamente dal mese di inizio e fine (serie dal gennaio 1947). Nessun anatocismo: interesse sempre semplice.
                  </Text>
                  <Pressable testID="btn-calc-istat" onPress={calcolaIstat} disabled={calcolandoIstat} style={[st.submit, { backgroundColor: t.brand, opacity: calcolandoIstat ? 0.6 : 1 }]}>
                    <Text style={{ color: t.onBrand, fontWeight: "700" }}>{calcolandoIstat ? "Calcolo..." : "Calcola"}</Text>
                  </Pressable>
                  {risIstat ? (
                    <View style={[st.result, { backgroundColor: t.brandSecondary, borderColor: t.brand }]}>
                      {istatModalita === "sola_rivalutazione" ? (
                        <>
                          <Text style={{ color: t.onBrandSecondary, fontSize: 12, fontWeight: "700" }}>CAPITALE RIVALUTATO</Text>
                          <Text testID="istat-result" style={{ color: t.onBrandSecondary, fontSize: 26, fontWeight: "800", fontVariant: ["tabular-nums"] }}>{formatEuro(risIstat.capitale_rivalutato)}</Text>
                          <Text style={{ color: t.onBrandSecondary, marginTop: 4, fontSize: 12 }}>Rivalutazione: {formatEuro(risIstat.rivalutazione)}</Text>
                        </>
                      ) : (
                        <>
                          <Text style={{ color: t.onBrandSecondary, fontSize: 12, fontWeight: "700" }}>TOTALE</Text>
                          <Text testID="istat-result" style={{ color: t.onBrandSecondary, fontSize: 26, fontWeight: "800", fontVariant: ["tabular-nums"] }}>{formatEuro(risIstat.totale)}</Text>
                          <RiepilogoChips color={t.onBrandSecondary} voci={[
                            { label: "Capitale", value: formatEuro(risIstat.capitale) },
                            ...(risIstat.rivalutazione != null ? [{ label: "Rivalutazione", value: formatEuro(risIstat.rivalutazione) }] : []),
                            { label: "Interessi", value: formatEuro(risIstat.interessi) },
                          ]} />
                          {(risIstat.dettaglio || []).map((d: any, i: number) => (
                            <View key={i} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 3, marginTop: i === 0 ? SPACING.sm : 0 }}>
                              <Text style={{ color: t.onBrandSecondary, fontSize: 11 }}>{isoToDataIt(d.dal)} → {isoToDataIt(d.al)} ({d.tasso_pct}%)</Text>
                              <Text style={{ color: t.onBrandSecondary, fontSize: 11, fontVariant: ["tabular-nums"] }}>{formatEuro(d.interesse)}</Text>
                            </View>
                          ))}
                        </>
                      )}
                    </View>
                  ) : null}
                </View>
              ) : null}

              {calcAperto === "rivalutazione-mensile" ? (
                <View>
                  <Text style={[st.lbl, { color: t.onSurfaceSecondary }]}>Importo di ogni rata €</Text>
                  <TextInput testID="rivmens-importo" value={rivMensImporto} onChangeText={setRivMensImporto} keyboardType="numeric" style={[st.input, { backgroundColor: t.surfaceSecondary, color: t.onSurface, borderColor: t.border }]} />
                  <Text style={[st.lbl, { color: t.onSurfaceSecondary }]}>Scadenza della prima rata non pagata</Text>
                  <DataInput testID="rivmens-data-inizio" value={rivMensDataInizio} onChange={setRivMensDataInizio} />
                  <Text style={[st.lbl, { color: t.onSurfaceSecondary }]}>Fino al (di norma la data del pagamento, o oggi)</Text>
                  <DataInput testID="rivmens-data-fine" value={rivMensDataFine} onChange={setRivMensDataFine} />
                  <Text style={[st.lbl, { color: t.onSurfaceSecondary, marginTop: SPACING.sm }]}>Opzioni di calcolo (combinabili liberamente tra loro)</Text>
                  <Pressable testID="rivmens-check-mensile" onPress={() => setRivMensMensilmente(!rivMensMensilmente)} style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: SPACING.sm, marginBottom: SPACING.sm }}>
                    <View style={{ width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: t.brand, backgroundColor: rivMensMensilmente ? t.brand : "transparent", alignItems: "center", justifyContent: "center" }}>
                      {rivMensMensilmente ? <Feather name="check" size={14} color={t.onBrand} /> : null}
                    </View>
                    <Text style={{ color: t.onSurface, flex: 1 }}>Rivaluta mensilmente gli importi dovuti e non riscossi (ISTAT)</Text>
                  </Pressable>
                  <Pressable testID="rivmens-check-interessi" onPress={() => setRivMensInteressi(!rivMensInteressi)} style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: SPACING.sm }}>
                    <View style={{ width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: t.brand, backgroundColor: rivMensInteressi ? t.brand : "transparent", alignItems: "center", justifyContent: "center" }}>
                      {rivMensInteressi ? <Feather name="check" size={14} color={t.onBrand} /> : null}
                    </View>
                    <Text style={{ color: t.onSurface, flex: 1 }}>Calcola gli interessi legali</Text>
                  </Pressable>
                  {rivMensInteressi ? (
                    <>
                      <Text style={[st.lbl, { color: t.onSurfaceSecondary }]}>Percentuale del tasso legale % (100 = tasso pieno)</Text>
                      <TextInput testID="rivmens-tasso-interessi" value={rivMensTassoInteressi} onChangeText={setRivMensTassoInteressi} keyboardType="numeric" placeholder="100" placeholderTextColor={t.onSurfaceTertiary} style={[st.input, { backgroundColor: t.surfaceSecondary, color: t.onSurface, borderColor: t.border }]} />
                    </>
                  ) : null}
                  <Pressable testID="rivmens-check-annuale" onPress={() => setRivMensAnnualmente(!rivMensAnnualmente)} style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: SPACING.sm }}>
                    <View style={{ width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: t.brand, backgroundColor: rivMensAnnualmente ? t.brand : "transparent", alignItems: "center", justifyContent: "center" }}>
                      {rivMensAnnualmente ? <Feather name="check" size={14} color={t.onBrand} /> : null}
                    </View>
                    <Text style={{ color: t.onSurface, flex: 1 }}>Rivaluta annualmente l&apos;importo dovuto, a un tasso indicato da te</Text>
                  </Pressable>
                  {rivMensAnnualmente ? (
                    <>
                      <Text style={[st.lbl, { color: t.onSurfaceSecondary }]}>Tasso di rivalutazione annua %</Text>
                      <TextInput testID="rivmens-tasso-annuale" value={rivMensTassoAnnuale} onChangeText={setRivMensTassoAnnuale} keyboardType="numeric" style={[st.input, { backgroundColor: t.surfaceSecondary, color: t.onSurface, borderColor: t.border }]} />
                    </>
                  ) : null}
                  <Text style={{ color: t.onSurfaceTertiary, fontSize: 11, marginTop: SPACING.sm }}>
                    Una rata al mese dalla data di inizio alla data di fine (incluse entrambe). Le rate si sommano in un unico montante che cresce mese per mese: ogni mese si aggiunge la nuova rata, poi il montante si rivaluta e matura interessi.
                  </Text>
                  <Pressable testID="btn-calc-rivmens" onPress={calcolaRivalutazioneMensile} disabled={calcolandoRivMens} style={[st.submit, { backgroundColor: t.brand, opacity: calcolandoRivMens ? 0.6 : 1 }]}>
                    <Text style={{ color: t.onBrand, fontWeight: "700" }}>{calcolandoRivMens ? "Calcolo..." : "Calcola"}</Text>
                  </Pressable>
                  {risRivMens ? (
                    <View style={[st.result, { backgroundColor: t.brandSecondary, borderColor: t.brand }]}>
                      <Text style={{ color: t.onBrandSecondary, fontSize: 12, fontWeight: "700" }}>TOTALE ({risRivMens.numero_rate} {risRivMens.numero_rate === 1 ? "rata" : "rate"})</Text>
                      <Text testID="rivmens-result" style={{ color: t.onBrandSecondary, fontSize: 26, fontWeight: "800", fontVariant: ["tabular-nums"] }}>{formatEuro(risRivMens.totale)}</Text>
                      <RiepilogoChips color={t.onBrandSecondary} voci={[
                        { label: "Capitale", value: formatEuro(risRivMens.capitale_totale) },
                        { label: "Rivalutazione", value: formatEuro(risRivMens.rivalutazione_totale) },
                        { label: "Montante rivalutato", value: formatEuro(risRivMens.capitale_rivalutato) },
                        { label: "Interessi", value: formatEuro(risRivMens.interessi_totale) },
                      ]} />
                      {(risRivMens.dettaglio || []).map((d: any, i: number) => (
                        <View key={i} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 3, marginTop: i === 0 ? SPACING.sm : 0 }}>
                          <Text style={{ color: t.onBrandSecondary, fontSize: 11 }}>{isoToDataIt(d.dal)} → {isoToDataIt(d.al)} ({d.giorni}gg)</Text>
                          <Text style={{ color: t.onBrandSecondary, fontSize: 11, fontVariant: ["tabular-nums"] }}>{formatEuro(d.totale)}</Text>
                        </View>
                      ))}
                    </View>
                  ) : null}
                </View>
              ) : null}

              {calcAperto === "adeguamento-canone" ? (
                <View>
                  <Text style={[st.lbl, { color: t.onSurfaceSecondary }]}>Canone attuale €</Text>
                  <TextInput testID="canone-importo" value={canoneImporto} onChangeText={setCanoneImporto} keyboardType="numeric" style={[st.input, { backgroundColor: t.surfaceSecondary, color: t.onSurface, borderColor: t.border }]} />
                  <Text style={[st.lbl, { color: t.onSurfaceSecondary }]}>Mese di riferimento per l&apos;indice ISTAT</Text>
                  <MeseAnnoInput testID="canone-mese-riferimento" value={canoneMeseRiferimento} onChange={setCanoneMeseRiferimento} />
                  <Text style={[st.lbl, { color: t.onSurfaceSecondary }]}>Percentuale di adeguamento</Text>
                  <SelectInput testID="canone-perc" value={canonePercScelta} onChange={setCanonePercScelta} opzioni={PERCENTUALI_CANONE} />
                  {canonePercScelta === "altro" ? (
                    <>
                      <Text style={[st.lbl, { color: t.onSurfaceSecondary }]}>Percentuale %</Text>
                      <TextInput testID="canone-perc-altro" value={canonePercAltro} onChangeText={setCanonePercAltro} keyboardType="numeric" style={[st.input, { backgroundColor: t.surfaceSecondary, color: t.onSurface, borderColor: t.border }]} />
                    </>
                  ) : null}
                  <Text style={{ color: t.onSurfaceTertiary, fontSize: 11, marginTop: SPACING.sm }}>
                    Variazione dell&apos;indice FOI tra il mese di riferimento e lo stesso mese dell&apos;anno precedente (serie dal gennaio 1947).
                  </Text>
                  <Pressable testID="btn-calc-canone" onPress={calcolaAdeguamentoCanone} disabled={calcolandoCanone} style={[st.submit, { backgroundColor: t.brand, opacity: calcolandoCanone ? 0.6 : 1 }]}>
                    <Text style={{ color: t.onBrand, fontWeight: "700" }}>{calcolandoCanone ? "Calcolo..." : "Calcola"}</Text>
                  </Pressable>
                  {risCanone ? (
                    <View style={[st.result, { backgroundColor: t.brandSecondary, borderColor: t.brand }]}>
                      <Text style={{ color: t.onBrandSecondary, fontSize: 12, fontWeight: "700" }}>NUOVO CANONE</Text>
                      <Text testID="canone-result" style={{ color: t.onBrandSecondary, fontSize: 26, fontWeight: "800", fontVariant: ["tabular-nums"] }}>{formatEuro(risCanone.nuovo_canone)}</Text>
                      <RiepilogoChips color={t.onBrandSecondary} voci={[
                        { label: "Adeguamento", value: formatEuro(risCanone.adeguamento) },
                        { label: "Variazione ISTAT", value: `${risCanone.variazione_istat_pct}%` },
                      ]} />
                      <Text style={{ color: t.onBrandSecondary, marginTop: 2, fontSize: 11 }}>
                        Indice FOI: {risCanone.indice_precedente} → {risCanone.indice_corrente}
                      </Text>
                    </View>
                  ) : null}
                </View>
              ) : null}

              {calcAperto === "interessi-vari-capitale-rivalutato" ? (
                <View>
                  <Text style={[st.lbl, { color: t.onSurfaceSecondary }]}>Capitale €</Text>
                  <TextInput testID="vari-capitale" value={variCapitale} onChangeText={setVariCapitale} keyboardType="numeric" style={[st.input, { backgroundColor: t.surfaceSecondary, color: t.onSurface, borderColor: t.border }]} />
                  <Text style={[st.lbl, { color: t.onSurfaceSecondary }]}>Dal</Text>
                  <DataInput testID="vari-data-inizio" value={variDataInizio} onChange={setVariDataInizio} />
                  <Text style={[st.lbl, { color: t.onSurfaceSecondary }]}>Al</Text>
                  <DataInput testID="vari-data-fine" value={variDataFine} onChange={setVariDataFine} />
                  <Text style={[st.lbl, { color: t.onSurfaceSecondary }]}>Tipo di interesse</Text>
                  <SelectInput testID="vari-tipo-interesse" value={variTipoInteresse} onChange={setVariTipoInteresse} opzioni={TIPI_INTERESSE_VARI} />
                  {variTipoInteresse === "tasso_fisso" ? (
                    <>
                      <Text style={[st.lbl, { color: t.onSurfaceSecondary }]}>Tasso fisso %</Text>
                      <TextInput testID="vari-tasso-fisso" value={variTassoFisso} onChangeText={setVariTassoFisso} keyboardType="numeric" style={[st.input, { backgroundColor: t.surfaceSecondary, color: t.onSurface, borderColor: t.border }]} />
                    </>
                  ) : null}
                  <Text style={[st.lbl, { color: t.onSurfaceSecondary }]}>Maggiorazione punti % (facoltativa — default 8 per gli interessi di mora, 0 per gli altri)</Text>
                  <TextInput testID="vari-maggiorazione" value={variMaggiorazione} onChangeText={setVariMaggiorazione} keyboardType="numeric" style={[st.input, { backgroundColor: t.surfaceSecondary, color: t.onSurface, borderColor: t.border }]} />
                  <Text style={[st.lbl, { color: t.onSurfaceSecondary }]}>Anatocismo</Text>
                  <SelectInput testID="vari-anatocismo" value={variAnatocismo} onChange={setVariAnatocismo} opzioni={CAPITALIZZAZIONI} />
                  <Pressable
                    testID="vari-rivaluta"
                    onPress={() => setVariRivaluta(!variRivaluta)}
                    style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: SPACING.sm, marginBottom: SPACING.sm }}
                  >
                    <View style={{ width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: t.brand, backgroundColor: variRivaluta ? t.brand : "transparent", alignItems: "center", justifyContent: "center" }}>
                      {variRivaluta ? <Feather name="check" size={14} color={t.onBrand} /> : null}
                    </View>
                    <Text style={{ color: t.onSurface, flex: 1, fontSize: 13 }}>Rivaluta il capitale secondo l&apos;indice FOI</Text>
                  </Pressable>
                  {variRivaluta ? (
                    <>
                      <Text style={[st.lbl, { color: t.onSurfaceSecondary }]}>Modalità di rivalutazione</Text>
                      <SelectInput testID="vari-base-rivalutazione" value={variBaseRivalutazione} onChange={setVariBaseRivalutazione} opzioni={BASI_RIVALUTAZIONE_VARI} />
                      <Text style={[st.lbl, { color: t.onSurfaceSecondary }]}>Percentuale di applicazione della rivalutazione % (100 = piena, es. 75 per clausole di adeguamento parziale)</Text>
                      <TextInput testID="vari-rivaluta-al-pct" value={variRivalutaAlPct} onChangeText={setVariRivalutaAlPct} keyboardType="numeric" placeholder="100" placeholderTextColor={t.onSurfaceTertiary} style={[st.input, { backgroundColor: t.surfaceSecondary, color: t.onSurface, borderColor: t.border }]} />
                      <Pressable
                        testID="vari-ignora-deflazione"
                        onPress={() => setVariIgnoraDeflazione(!variIgnoraDeflazione)}
                        style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: SPACING.sm, marginBottom: SPACING.sm }}
                      >
                        <View style={{ width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: t.brand, backgroundColor: variIgnoraDeflazione ? t.brand : "transparent", alignItems: "center", justifyContent: "center" }}>
                          {variIgnoraDeflazione ? <Feather name="check" size={14} color={t.onBrand} /> : null}
                        </View>
                        <Text style={{ color: t.onSurface, flex: 1, fontSize: 13 }}>Ignora la deflazione (se l&apos;indice cala, non applica una rivalutazione negativa)</Text>
                      </Pressable>
                    </>
                  ) : null}
                  <Text style={[st.lbl, { color: t.onSurfaceSecondary }]}>Giorno iniziale</Text>
                  <SelectInput testID="vari-giorno-iniziale" value={variGiornoIniziale} onChange={setVariGiornoIniziale} opzioni={GIORNI_INIZIALI_VARI} />
                  <Text style={[st.lbl, { color: t.onSurfaceSecondary }]}>Convenzione di calcolo dei giorni</Text>
                  <SelectInput testID="vari-convenzione-giorni" value={variConvenzioneGiorni} onChange={setVariConvenzioneGiorni} opzioni={CONVENZIONI_GIORNI_VARI} />
                  <Text style={{ color: t.onSurfaceTertiary, fontSize: 11, marginTop: SPACING.sm }}>
                    Calcolatore avanzato: l&apos;interazione fra tutti questi parametri in ogni combinazione non è specificata in dettaglio — il risultato può differire in casi particolari.
                  </Text>
                  <Pressable testID="btn-calc-vari" onPress={calcolaInteressiVari} disabled={calcolandoVari} style={[st.submit, { backgroundColor: t.brand, opacity: calcolandoVari ? 0.6 : 1 }]}>
                    <Text style={{ color: t.onBrand, fontWeight: "700" }}>{calcolandoVari ? "Calcolo..." : "Calcola"}</Text>
                  </Pressable>
                  {risVari ? (
                    <View style={[st.result, { backgroundColor: t.brandSecondary, borderColor: t.brand }]}>
                      <Text style={{ color: t.onBrandSecondary, fontSize: 12, fontWeight: "700" }}>TOTALE</Text>
                      <Text testID="vari-result" style={{ color: t.onBrandSecondary, fontSize: 26, fontWeight: "800", fontVariant: ["tabular-nums"] }}>{formatEuro(risVari.totale)}</Text>
                      <RiepilogoChips color={t.onBrandSecondary} voci={[
                        { label: "Capitale", value: formatEuro(risVari.capitale) },
                        { label: "Interessi", value: formatEuro(risVari.interessi) },
                        ...(risVari.rivalutazione != null ? [{ label: "Rivalutazione", value: formatEuro(risVari.rivalutazione) }] : []),
                      ]} />
                      {(risVari.dettaglio || []).map((d: any, i: number) => (
                        <View key={i} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 3, marginTop: i === 0 ? SPACING.sm : 0 }}>
                          <Text style={{ color: t.onBrandSecondary, fontSize: 11 }}>{isoToDataIt(d.dal)} → {isoToDataIt(d.al)} ({d.tasso_pct}%)</Text>
                          <Text style={{ color: t.onBrandSecondary, fontSize: 11, fontVariant: ["tabular-nums"] }}>{formatEuro(d.montante)}</Text>
                        </View>
                      ))}
                    </View>
                  ) : null}
                </View>
              ) : null}

              {calcAperto === "imposta-successione" ? (
                <View>
                  <Text style={[st.lbl, { color: t.onSurfaceSecondary }]}>Valore catastale immobile adibito a prima casa €</Text>
                  <TextInput testID="succ-prima-casa" value={succPrimaCasa} onChangeText={setSuccPrimaCasa} keyboardType="numeric" style={[st.input, { backgroundColor: t.surfaceSecondary, color: t.onSurface, borderColor: t.border }]} />
                  <Text style={[st.lbl, { color: t.onSurfaceSecondary }]}>Valore catastale altri immobili €</Text>
                  <TextInput testID="succ-altri-immobili" value={succAltriImmobili} onChangeText={setSuccAltriImmobili} keyboardType="numeric" style={[st.input, { backgroundColor: t.surfaceSecondary, color: t.onSurface, borderColor: t.border }]} />
                  <Text style={[st.lbl, { color: t.onSurfaceSecondary }]}>Beni mobili (denaro e strumenti finanziari, esclusi i titoli di Stato) €</Text>
                  <TextInput testID="succ-beni-mobili" value={succBeniMobili} onChangeText={setSuccBeniMobili} keyboardType="numeric" style={[st.input, { backgroundColor: t.surfaceSecondary, color: t.onSurface, borderColor: t.border }]} />
                  <Text style={[st.lbl, { color: t.onSurfaceSecondary }]}>Grado di parentela/affinità dell&apos;erede rispetto al defunto</Text>
                  {GRADI_SUCCESSIONE.map((g) => (
                    <Pressable key={g.id} testID={`succ-grado-${g.id}`} onPress={() => setSuccGrado(g.id)} style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8 }}>
                      <View style={{ width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: t.brand, alignItems: "center", justifyContent: "center" }}>
                        {succGrado === g.id ? <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: t.brand }} /> : null}
                      </View>
                      <Text style={{ color: t.onSurface, fontSize: 13, flex: 1 }}>{g.label}</Text>
                    </Pressable>
                  ))}
                  <Pressable testID="succ-toggle-disabile" onPress={() => setSuccDisabile(!succDisabile)} style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: SPACING.md }}>
                    <View style={{ width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: t.brand, backgroundColor: succDisabile ? t.brand : "transparent", alignItems: "center", justifyContent: "center" }}>
                      {succDisabile ? <Feather name="check" size={14} color={t.onBrand} /> : null}
                    </View>
                    <Text style={{ color: t.onSurface, flex: 1 }}>Erede portatore di handicap grave (L. 104/1992)</Text>
                  </Pressable>
                  <Pressable testID="btn-calc-succ" onPress={calcolaSuccessione} disabled={calcolandoSucc} style={[st.submit, { backgroundColor: t.brand, opacity: calcolandoSucc ? 0.6 : 1 }]}>
                    <Text style={{ color: t.onBrand, fontWeight: "700" }}>{calcolandoSucc ? "Calcolo..." : "Calcola"}</Text>
                  </Pressable>
                  {risSucc ? (
                    <View style={[st.result, { backgroundColor: t.brandSecondary, borderColor: t.brand }]}>
                      <Text style={{ color: t.onBrandSecondary, fontSize: 12, fontWeight: "700" }}>IMPOSTE TOTALI DOVUTE</Text>
                      <Text testID="succ-result" style={{ color: t.onBrandSecondary, fontSize: 26, fontWeight: "800", fontVariant: ["tabular-nums"] }}>{formatEuro(risSucc.imposte_totali)}</Text>
                      <View style={{ marginTop: SPACING.sm, gap: 3 }}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                          <Text style={{ color: t.onBrandSecondary, fontSize: 11 }}>Imposta di successione (franchigia {formatEuro(risSucc.franchigia)}, {risSucc.aliquota_pct}% su {formatEuro(risSucc.imponibile)})</Text>
                          <Text style={{ color: t.onBrandSecondary, fontSize: 11, fontVariant: ["tabular-nums"] }}>{formatEuro(risSucc.imposta_successione)}</Text>
                        </View>
                        {risSucc.imposta_ipotecaria_prima_casa > 0 || risSucc.imposta_catastale_prima_casa > 0 ? (
                          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                            <Text style={{ color: t.onBrandSecondary, fontSize: 11 }}>Ipotecaria + catastale prima casa</Text>
                            <Text style={{ color: t.onBrandSecondary, fontSize: 11, fontVariant: ["tabular-nums"] }}>{formatEuro(risSucc.imposta_ipotecaria_prima_casa + risSucc.imposta_catastale_prima_casa)}</Text>
                          </View>
                        ) : null}
                        {risSucc.imposta_ipotecaria_altri_immobili > 0 || risSucc.imposta_catastale_altri_immobili > 0 ? (
                          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                            <Text style={{ color: t.onBrandSecondary, fontSize: 11 }}>Ipotecaria + catastale altri immobili</Text>
                            <Text style={{ color: t.onBrandSecondary, fontSize: 11, fontVariant: ["tabular-nums"] }}>{formatEuro(risSucc.imposta_ipotecaria_altri_immobili + risSucc.imposta_catastale_altri_immobili)}</Text>
                          </View>
                        ) : null}
                      </View>
                    </View>
                  ) : null}
                </View>
              ) : null}

              {calcAperto === "compenso-ctu" ? (
                <View>
                  <Text style={[st.lbl, { color: t.onSurfaceSecondary }]}>Inizio perizia</Text>
                  <DataInput testID="ctu-data-inizio" value={ctuDataInizioPerizia} onChange={setCtuDataInizioPerizia} />
                  <Text style={[st.lbl, { color: t.onSurfaceSecondary }]}>Fine perizia</Text>
                  <DataInput testID="ctu-data-fine" value={ctuDataFinePerizia} onChange={setCtuDataFinePerizia} />
                  {risCtu && risCtu.giorni_lavorativi != null ? (
                    <RiepilogoChips color={t.onSurfaceTertiary} fontSize={11} voci={[
                      { label: "Giorni lavorativi", value: String(risCtu.giorni_lavorativi) },
                      { label: "Max vacazioni liquidabili", value: String(risCtu.max_vacazioni) },
                    ]} />
                  ) : null}
                  <Text style={[st.lbl, { color: t.onSurfaceSecondary }]}>Numero vacazioni (14,68€ ciascuna, tariffa piena dal 13/2/2025, Corte Cost. 16/2025)</Text>
                  <TextInput testID="ctu-numero-vacazioni" value={ctuNumeroVacazioni} onChangeText={setCtuNumeroVacazioni} keyboardType="numeric" style={[st.input, { backgroundColor: t.surfaceSecondary, color: t.onSurface, borderColor: t.border }]} />
                  <Text style={[st.lbl, { color: t.onSurfaceSecondary }]}>Carico vacazioni % (100 ordinario; fino a 200% se termine ≤5gg, fino a 150% se ≤15gg, art. 4 c. 3 L. 319/1980)</Text>
                  <TextInput testID="ctu-carico-vacazioni" value={ctuCaricoVacazioni} onChangeText={setCtuCaricoVacazioni} keyboardType="numeric" style={[st.input, { backgroundColor: t.surfaceSecondary, color: t.onSurface, borderColor: t.border }]} />
                  <Text style={[st.lbl, { color: t.onSurfaceSecondary }]}>Carico urgenza % (0-20)</Text>
                  <TextInput testID="ctu-carico-urgenza" value={ctuCaricoUrgenza} onChangeText={setCtuCaricoUrgenza} keyboardType="numeric" style={[st.input, { backgroundColor: t.surfaceSecondary, color: t.onSurface, borderColor: t.border }]} />
                  <Text style={[st.lbl, { color: t.onSurfaceSecondary }]}>Carico complessità % (0-100)</Text>
                  <TextInput testID="ctu-carico-complessita" value={ctuCaricoComplessita} onChangeText={setCtuCaricoComplessita} keyboardType="numeric" style={[st.input, { backgroundColor: t.surfaceSecondary, color: t.onSurface, borderColor: t.border }]} />
                  <Text style={[st.lbl, { color: t.onSurfaceSecondary }]}>Spese documentate €</Text>
                  <TextInput testID="ctu-spese-documentate" value={ctuSpeseDocumentate} onChangeText={setCtuSpeseDocumentate} keyboardType="numeric" style={[st.input, { backgroundColor: t.surfaceSecondary, color: t.onSurface, borderColor: t.border }]} />
                  <Text style={[st.lbl, { color: t.onSurfaceSecondary }]}>Rimborso chilometrico € per km</Text>
                  <TextInput testID="ctu-rimborso-km-unitario" value={ctuRimborsoKmUnitario} onChangeText={setCtuRimborsoKmUnitario} keyboardType="numeric" style={[st.input, { backgroundColor: t.surfaceSecondary, color: t.onSurface, borderColor: t.border }]} />
                  <Text style={[st.lbl, { color: t.onSurfaceSecondary }]}>Numero km</Text>
                  <TextInput testID="ctu-numero-km" value={ctuNumeroKm} onChangeText={setCtuNumeroKm} keyboardType="numeric" style={[st.input, { backgroundColor: t.surfaceSecondary, color: t.onSurface, borderColor: t.border }]} />

                  <Text style={[st.lbl, { color: t.onSurfaceSecondary, marginTop: SPACING.lg, fontWeight: "700" }]}>Onorario tabellare (DM 182/2002)</Text>
                  <SelectInput testID="ctu-articolo-tabellare" value={ctuArticoloTabellare} onChange={setCtuArticoloTabellare} opzioni={ARTICOLI_DM182_CON_NESSUNO} />
                  {ctuArticoloTabellare ? (
                    <>
                      {ARTICOLI_DM182.find((a) => a.value === ctuArticoloTabellare)?.richiedeValore ? (
                        <>
                          <Text style={[st.lbl, { color: t.onSurfaceSecondary }]}>Valore stimato €</Text>
                          <TextInput testID="ctu-valore-stimato" value={ctuValoreStimato} onChangeText={setCtuValoreStimato} keyboardType="numeric" style={[st.input, { backgroundColor: t.surfaceSecondary, color: t.onSurface, borderColor: t.border }]} />
                        </>
                      ) : null}
                      <Text style={[st.lbl, { color: t.onSurfaceSecondary }]}>Tariffa predefinita</Text>
                      <SelectInput testID="ctu-tariffa-predefinita" value={ctuTariffaPredefinita} onChange={setCtuTariffaPredefinita} opzioni={TARIFFE_PREDEFINITE_CTU} />
                      <Text style={[st.lbl, { color: t.onSurfaceSecondary }]}>Carico onorari % (1-200)</Text>
                      <TextInput testID="ctu-carico-onorari" value={ctuCaricoOnorari} onChangeText={setCtuCaricoOnorari} keyboardType="numeric" style={[st.input, { backgroundColor: t.surfaceSecondary, color: t.onSurface, borderColor: t.border }]} />
                    </>
                  ) : null}

                  <Pressable testID="btn-calc-ctu" onPress={calcolaCtu} disabled={calcolandoCtu} style={[st.submit, { backgroundColor: t.brand, opacity: calcolandoCtu ? 0.6 : 1 }]}>
                    <Text style={{ color: t.onBrand, fontWeight: "700" }}>{calcolandoCtu ? "Calcolo..." : "Calcola"}</Text>
                  </Pressable>
                  {risCtu ? (
                    <View style={[st.result, { backgroundColor: t.brandSecondary, borderColor: t.brand }]}>
                      <Text style={{ color: t.onBrandSecondary, fontSize: 12, fontWeight: "700" }}>COMPENSO TOTALE</Text>
                      <Text testID="ctu-result" style={{ color: t.onBrandSecondary, fontSize: 26, fontWeight: "800", fontVariant: ["tabular-nums"] }}>{formatEuro(risCtu.totale)}</Text>
                      <RiepilogoChips color={t.onBrandSecondary} voci={[
                        { label: "Onorario vacazioni", value: formatEuro(risCtu.onorario_vacazioni) },
                        ...(risCtu.maggiorazione_urgenza > 0 ? [{ label: "Urgenza", value: formatEuro(risCtu.maggiorazione_urgenza) }] : []),
                        ...(risCtu.maggiorazione_complessita > 0 ? [{ label: "Complessità", value: formatEuro(risCtu.maggiorazione_complessita) }] : []),
                        ...(risCtu.rimborso_km > 0 ? [{ label: "Rimborso km", value: formatEuro(risCtu.rimborso_km) }] : []),
                        ...(risCtu.onorario_tabellare > 0 ? [{ label: "Onorario tabellare", value: formatEuro(risCtu.onorario_tabellare) }] : []),
                      ]} />
                      {!risCtu.salvata ? (
                        <>
                          <Text style={{ color: t.onBrandSecondary, fontSize: 11, fontWeight: "700", marginTop: SPACING.md, marginBottom: SPACING.xs }}>Nome parcella</Text>
                          <TextInput
                            testID="ctu-titolo"
                            value={titoloCtu}
                            onChangeText={setTitoloCtu}
                            placeholderTextColor={t.onSurfaceTertiary}
                            style={[st.input, { backgroundColor: t.surface, color: t.onSurface, borderColor: t.border }]}
                          />
                          <PraticaPicker
                            pratiche={pratiche}
                            praticaId={praticaId}
                            onChange={setPraticaId}
                            helperText={praticaId ? "Comparirà anche nella scheda di quella pratica." : "Comparirà solo qui in Archivio."}
                          />
                          <Pressable testID="save-ctu" onPress={salvaCtu} disabled={savingCtu} style={{ marginTop: SPACING.md, backgroundColor: t.brand, padding: 10, borderRadius: RADIUS.md, alignItems: "center", opacity: savingCtu ? 0.6 : 1 }}>
                            <Text style={{ color: t.onBrand, fontWeight: "700" }}>{savingCtu ? "Salvataggio..." : "Salva come parcella"}</Text>
                          </Pressable>
                        </>
                      ) : <Text style={{ color: t.success, marginTop: 8 }}>✓ Salvata come parcella (in Archivio &gt; Parcelle puoi emetterla e scaricarne il PDF)</Text>}
                    </View>
                  ) : null}
                </View>
              ) : null}

              {calcAperto && CONFIG_GENERICI[calcAperto] ? (
                <View>
                  {CONFIG_GENERICI[calcAperto].campi.map((c) => {
                    if (c.mostraSe && !c.mostraSe(genForm)) return null;
                    if (c.tipo === "data" || c.tipo === "data_opzionale") {
                      const notaData = c.nota?.(genForm);
                      return (
                        <View key={c.key}>
                          <Text style={[st.lbl, { color: t.onSurfaceSecondary }]}>{c.label}{c.tipo === "data_opzionale" ? " (opzionale)" : ""}</Text>
                          <DataInput testID={`gen-${c.key}`} value={genForm[c.key] || ""} onChange={(v) => setGenForm({ ...genForm, [c.key]: v })} />
                          {notaData ? (
                            <Text style={{ color: t.onSurfaceTertiary, fontSize: 11, fontStyle: "italic", marginTop: 4, marginBottom: SPACING.sm }}>{notaData}</Text>
                          ) : null}
                        </View>
                      );
                    }
                    if (c.tipo === "mese_anno") {
                      return (
                        <View key={c.key}>
                          <Text style={[st.lbl, { color: t.onSurfaceSecondary }]}>{c.label}</Text>
                          <MeseAnnoInput testID={`gen-${c.key}`} value={genForm[c.key] || ""} onChange={(v) => setGenForm({ ...genForm, [c.key]: v })} />
                        </View>
                      );
                    }
                    if (c.tipo === "lista") {
                      return (
                        <View key={c.key} style={{ marginTop: SPACING.md }}>
                          <Text style={[st.lbl, { color: t.onSurfaceSecondary }]}>{c.label}</Text>
                          <ListaInput
                            testID={`gen-${c.key}`}
                            value={genForm[c.key] || []}
                            onChange={(v) => setGenForm({ ...genForm, [c.key]: v })}
                            campiRiga={c.campiRiga}
                            etichettaAggiungi={c.etichettaAggiungi}
                            form={genForm}
                          />
                        </View>
                      );
                    }
                    if (c.tipo === "titolo") {
                      return (
                        <Text key={c.key} style={[st.lbl, { color: t.onSurfaceSecondary, marginTop: SPACING.md }]}>{c.label}</Text>
                      );
                    }
                    if (c.tipo === "testo") {
                      return (
                        <View key={c.key}>
                          <Text style={[st.lbl, { color: t.onSurfaceSecondary }]}>{c.label}</Text>
                          <TextInput testID={`gen-${c.key}`} value={genForm[c.key] ?? ""} onChangeText={(v) => setGenForm({ ...genForm, [c.key]: v })} style={[st.input, { backgroundColor: t.surfaceSecondary, color: t.onSurface, borderColor: t.border }]} />
                        </View>
                      );
                    }
                    if (c.tipo === "numero") {
                      return (
                        <View key={c.key}>
                          <Text style={[st.lbl, { color: t.onSurfaceSecondary }]}>{c.label}</Text>
                          <TextInput testID={`gen-${c.key}`} value={genForm[c.key] ?? ""} onChangeText={(v) => setGenForm({ ...genForm, [c.key]: v })} keyboardType="numeric" style={[st.input, { backgroundColor: t.surfaceSecondary, color: t.onSurface, borderColor: t.border }]} />
                        </View>
                      );
                    }
                    if (c.tipo === "bool") {
                      return (
                        <Pressable key={c.key} testID={`gen-${c.key}`} onPress={() => setGenForm({ ...genForm, [c.key]: !genForm[c.key] })} style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: SPACING.md, marginBottom: SPACING.sm }}>
                          <View style={{ width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: t.brand, backgroundColor: genForm[c.key] ? t.brand : "transparent", alignItems: "center", justifyContent: "center" }}>
                            {genForm[c.key] ? <Feather name="check" size={14} color={t.onBrand} /> : null}
                          </View>
                          <Text style={{ color: t.onSurface, flex: 1 }}>{c.label}</Text>
                        </Pressable>
                      );
                    }
                    const nota = c.nota?.(genForm);
                    return (
                      <View key={c.key}>
                        <Text style={[st.lbl, { color: t.onSurfaceSecondary }]}>{c.label}</Text>
                        <View style={{ marginBottom: SPACING.sm }}>
                          <SelectInput
                            testID={`gen-${c.key}`}
                            value={genForm[c.key] || ""}
                            onChange={(v) => setGenForm({ ...genForm, [c.key]: v })}
                            opzioni={typeof c.opzioni === "function" ? c.opzioni(genForm) : c.opzioni}
                            cercabile={c.cercabile}
                          />
                        </View>
                        {nota ? (
                          <Text style={{ color: t.onSurfaceTertiary, fontSize: 11, fontStyle: "italic", marginTop: -SPACING.sm, marginBottom: SPACING.sm }}>{nota}</Text>
                        ) : null}
                      </View>
                    );
                  })}
                  <Pressable testID="btn-calc-gen" onPress={calcolaGenerico} disabled={genCalcolando} style={[st.submit, { backgroundColor: t.brand, opacity: genCalcolando ? 0.6 : 1 }]}>
                    <Text style={{ color: t.onBrand, fontWeight: "700" }}>{genCalcolando ? "Calcolo..." : "Calcola"}</Text>
                  </Pressable>
                  {genRisultato ? (
                    <View style={[st.result, { backgroundColor: t.brandSecondary, borderColor: t.brand }]}>
                      {CONFIG_GENERICI[calcAperto].risultato(genRisultato).map(([l, v], i) => (
                        <View key={i} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 4, gap: 8 }}>
                          <Text style={{ color: t.onBrandSecondary, fontSize: 12, flex: 1 }}>{l}</Text>
                          <Text testID={i === 0 ? "gen-result" : undefined} style={{ color: t.onBrandSecondary, fontSize: 13, fontWeight: "800" }}>{v}</Text>
                        </View>
                      ))}
                      {CONFIG_GENERICI[calcAperto].scadenze ? (
                        !genSalvata ? (
                          <>
                            <PraticaPicker
                              pratiche={pratiche}
                              praticaId={praticaId}
                              onChange={setPraticaId}
                              helperText={praticaId ? "Comparirà anche nella scheda di quella pratica." : "Comparirà solo qui e nel calendario."}
                            />
                            <Pressable testID="save-gen" onPress={salvaGenerico} disabled={genSaving} style={{ marginTop: SPACING.md, backgroundColor: t.brand, padding: 10, borderRadius: RADIUS.md, alignItems: "center", opacity: genSaving ? 0.6 : 1 }}>
                              <Text style={{ color: t.onBrand, fontWeight: "700" }}>{genSaving ? "Salvataggio..." : "Salva come scadenza"}</Text>
                            </Pressable>
                          </>
                        ) : <Text style={{ color: t.success, marginTop: 8 }}>✓ Salvata</Text>
                      ) : null}
                    </View>
                  ) : null}
                </View>
              ) : null}
            </ScrollView>
          </KeyboardAvoidingView>
        </SwipeBackScreen>
      ) : null}
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  lbl: { fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5, marginTop: SPACING.md, marginBottom: SPACING.xs },
  input: { borderWidth: 1, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.md, fontSize: 14 },
  pill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.pill, borderWidth: 1 },
  submit: { marginTop: SPACING.lg, paddingVertical: SPACING.md, borderRadius: RADIUS.md, alignItems: "center" },
  result: { marginTop: SPACING.lg, padding: SPACING.md, borderRadius: RADIUS.lg, borderWidth: 0 },
  calcCard: { flexDirection: "row", alignItems: "center", gap: SPACING.md, padding: SPACING.md, borderRadius: RADIUS.lg, borderWidth: 1, marginBottom: SPACING.sm },
  calcIcon: { width: 38, height: 38, borderRadius: RADIUS.md, alignItems: "center", justifyContent: "center" },
});
