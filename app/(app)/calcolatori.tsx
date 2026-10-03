
import React from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, KeyboardAvoidingView, Platform, Alert, Keyboard } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "@/src/ThemeContext";
import { api } from "@/src/api";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SPACING, RADIUS, SHADOW } from "@/src/theme";
import Header from "@/src/components/Header";
import PromemoriaInput from "@/src/components/PromemoriaInput";
import PraticaPicker from "@/src/components/PraticaPicker";
import OrarioInput from "@/src/components/OrarioInput";
import DataInput from "@/src/components/DataInput";
import SwipeBackScreen from "@/src/components/SwipeBackScreen";
import { sincronizzaSeConnesso } from "@/src/utils/calendarioDispositivo";
import { scegliAperturaDocumento } from "@/src/utils/apriDocumentoRemoto";
import { formatEuro, parseNumeroIt, isoToDataIt } from "@/src/utils/formatoItaliano";

type CalcId =
  | "scadenze" | "parcelle"
  | "termini-memorie" | "interessi-legali" | "interessi-mora" | "contributo-unificato"
  | "rivalutazione-istat" | "imposta-successione" | "compenso-ctu"
  | "termini-impugnazione" | "opposizione-decreto-ingiuntivo" | "prescrizione" | "termini-citazione"
  | "precetto" | "impugnazione-licenziamento" | "ricorso-tributario" | "ricorso-tar"
  | "termine-querela" | "disdetta-locazione" | "parametri-forensi" | "compenso-mediazione"
  | "giorni-tra-date";

// Campo di un calcolatore "generico": una lista di questi descrive un intero
// form (date, numeri, booleani, scelte multiple) senza dover scrivere una
// nuova schermata JSX per ciascuno. Usato dai 12 calcolatori sotto, che sono
// tutti un piccolo form -> un POST -> un risultato da mostrare (ed
// eventualmente da salvare come scadenza), senza logica particolare propria
// che giustifichi una schermata dedicata come quelle storiche sopra.
type CampoGenerico =
  | { tipo: "data"; key: string; label: string }
  | { tipo: "data_opzionale"; key: string; label: string }
  | { tipo: "numero"; key: string; label: string; default?: string }
  | { tipo: "bool"; key: string; label: string; default?: boolean }
  | { tipo: "scelta"; key: string; label: string; opzioni: { value: string; label: string }[]; default?: string };

type ConfigGenerico = {
  campi: CampoGenerico[];
  endpoint: string;
  buildBody?: (form: Record<string, any>) => any;
  risultato: (r: any) => [string, string][];
  scadenze?: (r: any) => { titolo: string; data: string }[];
};

const CONFIG_GENERICI: Record<string, ConfigGenerico> = {
  "termini-impugnazione": {
    campi: [
      { tipo: "scelta", key: "tipo", label: "Tipo di impugnazione", default: "appello", opzioni: [
        { value: "appello", label: "Appello" }, { value: "cassazione", label: "Cassazione" },
        { value: "revocazione_ordinaria", label: "Revocazione ordinaria (errore di fatto / giudicato contrario, art. 395 nn. 4-5)" },
        { value: "revocazione_straordinaria", label: "Revocazione straordinaria (dolo, falsità, documenti, art. 395 nn. 1-3-6)" },
        { value: "opposizione_terzo_revocatoria", label: "Opposizione di terzo revocatoria (art. 404 c.2)" },
        { value: "opposizione_terzo_ordinaria", label: "Opposizione di terzo ordinaria (art. 404 c.1 — nessun termine)" },
      ] },
      { tipo: "data_opzionale", key: "data_pubblicazione", label: "Data pubblicazione sentenza (appello/cassazione/revocazione ordinaria)" },
      { tipo: "data_opzionale", key: "data_notificazione", label: "Data notificazione sentenza, se notificata (appello/cassazione/revocazione ordinaria)" },
      { tipo: "data_opzionale", key: "data_scoperta_vizio", label: "Data di scoperta del vizio/dolo (revocazione straordinaria/opposizione di terzo revocatoria)" },
      { tipo: "bool", key: "escludi_feriale", label: "Applica sospensione feriale (1-31 agosto)", default: true },
    ],
    endpoint: "/calc/termini-impugnazione",
    risultato: (r) => r.tipo === "opposizione_terzo_ordinaria"
      ? [["Nota", r.nota]]
      : r.tipo === "revocazione_straordinaria" || r.tipo === "opposizione_terzo_revocatoria"
      ? [["Termine applicabile (30gg dalla scoperta)", isoToDataIt(r.termine_applicabile)]]
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
      { tipo: "scelta", key: "tipo_termine", label: "Tipo di termine", default: "ordinaria_10", opzioni: [
        { value: "ordinaria_10", label: "Ordinaria - 10 anni (art. 2946 c.c.)" },
        { value: "fatto_illecito_5", label: "Fatto illecito - 5 anni (art. 2947 c.1 c.c.)" },
        { value: "circolazione_veicoli_2", label: "Circolazione veicoli - 2 anni (art. 2947 c.2 c.c.)" },
        { value: "canoni_periodici_5", label: "Canoni periodici - 5 anni (art. 2948 c.c.)" },
        { value: "trasporto_1", label: "Trasporto - 1 anno (art. 2951 c.c.)" },
        { value: "assicurazione_2", label: "Assicurazione danni - 2 anni (art. 2952 c.c.)" },
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
      { tipo: "bool", key: "estero", label: "Notifica all'estero (150gg anziché 90gg)", default: false },
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
      { tipo: "bool", key: "escludi_feriale", label: "Applica sospensione feriale (dibattuto per l'esecutivo)", default: false },
      { tipo: "scelta", key: "tipo_pignoramento", label: "Termini successivi al pignoramento (facoltativo)", default: "", opzioni: [
        { value: "", label: "Nessuno" },
        { value: "mobiliare_immobiliare", label: "Mobiliare/immobiliare (istanza di vendita)" },
        { value: "presso_terzi", label: "Presso terzi (iscrizione a ruolo)" },
        { value: "autoveicoli", label: "Autoveicoli/motoveicoli/rimorchi (art. 521-bis)" },
      ] },
      { tipo: "data_opzionale", key: "data_pignoramento", label: "Data del pignoramento (se calcoli i termini successivi)" },
      { tipo: "data_opzionale", key: "data_comunicazione_ivg", label: "Data comunicazione IVG di avvenuta consegna (solo autoveicoli)" },
      { tipo: "data_opzionale", key: "data_iscrizione_ruolo", label: "Data iscrizione a ruolo (solo autoveicoli, se già avvenuta)" },
    ],
    endpoint: "/calc/precetto",
    buildBody: (f) => ({
      data_notifica_precetto: f.data_notifica_precetto,
      escludi_feriale: f.escludi_feriale,
      ...(f.tipo_pignoramento ? {
        tipo_pignoramento: f.tipo_pignoramento,
        data_pignoramento: f.data_pignoramento,
        ...(f.tipo_pignoramento === "autoveicoli" ? {
          data_comunicazione_ivg: f.data_comunicazione_ivg || null,
          data_iscrizione_ruolo: f.data_iscrizione_ruolo || null,
        } : {}),
      } : {}),
    }),
    risultato: (r) => [
      ["Data minima pignoramento", isoToDataIt(r.data_minima_pignoramento)],
      ["Scadenza efficacia precetto", isoToDataIt(r.scadenza_efficacia_precetto)],
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
      ...(r.termine_iscrizione_ruolo && !r.termine_consegna_volontaria ? [{ titolo: "Termine iscrizione a ruolo (pignoramento presso terzi)", data: r.termine_iscrizione_ruolo }] : []),
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
      { tipo: "scelta", key: "rito", label: "Rito/grado", default: "tribunale", opzioni: [
        { value: "giudice_di_pace", label: "Giudice di pace (fino a 26.000€)" },
        { value: "tribunale", label: "Tribunale (giudizio ordinario)" },
        { value: "appello", label: "Corte d'Appello" },
        { value: "cassazione", label: "Corte di Cassazione" },
      ] },
      { tipo: "bool", key: "valore_indeterminabile", label: "Valore della causa indeterminabile", default: false },
      { tipo: "numero", key: "valore_causa", label: "Valore della causa €", default: "" },
      { tipo: "numero", key: "numero_parti_stessa_posizione", label: "N. parti assistite con la stessa posizione", default: "1" },
      { tipo: "bool", key: "gratuito_patrocinio", label: "Gratuito patrocinio (riduzione del 50%)", default: false },
    ],
    endpoint: "/calc/parametri-forensi",
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
      { tipo: "numero", key: "valore_lite", label: "Valore della lite €", default: "" },
      { tipo: "bool", key: "condizione_procedibilita", label: "Condizione di procedibilità / demandata dal giudice (-1/5)", default: false },
    ],
    endpoint: "/calc/compenso-mediazione",
    risultato: (r) => [
      ["Spese di avvio (1° incontro)", formatEuro(r.spese_avvio_primo_incontro)],
      ["Spese mediazione (1° incontro)", formatEuro(r.spese_mediazione_primo_incontro)],
      ["Spese mediazione oltre il 1° incontro", `${formatEuro(r.spese_mediazione_minimo_oltre_primo_incontro)} - ${formatEuro(r.spese_mediazione_massimo_oltre_primo_incontro)}`],
      ["Maggiorazione se accordo al 1° incontro", `+${r.maggiorazione_accordo_primo_incontro_pct}%`],
      ["Maggiorazione se accordo in incontri successivi", `+${r.maggiorazione_accordo_incontri_successivi_pct}%`],
    ],
  },
  "giorni-tra-date": {
    campi: [
      { tipo: "data", key: "data_iniziale", label: "Data iniziale" },
      { tipo: "data", key: "data_finale", label: "Data finale" },
    ],
    endpoint: "/calc/giorni-tra-date",
    risultato: (r) => [["Giorni di calendario", String(r.giorni)]],
  },
};

// Atti: a differenza dei calcolatori sopra, qui non si calcola un numero o
// una data ma si genera una bozza di documento Word a partire da campi di
// testo libero. Solo i 5 atti più standardizzati e meno rischiosi (nessuna
// argomentazione di merito caso per caso): atto di citazione, comparse e
// ricorsi restano fuori perché richiederebbero contenuto sostanziale che va
// scritto dall'avvocato, non generato automaticamente.
type AttoId = "diffida_ad_adempiere" | "messa_in_mora" | "incarico_professionale" | "procura_alle_liti" | "disdetta_locazione";

type CampoAtto = { key: string; label: string; obbligatorio?: boolean; multiline?: boolean; dataIso?: boolean; opzioni?: { value: string; label: string }[] };

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
    { key: "mittente", label: "Mittente (nome/ragione sociale)", obbligatorio: true },
    { key: "mittente_indirizzo", label: "Indirizzo mittente" },
    { key: "destinatario", label: "Destinatario", obbligatorio: true },
    { key: "destinatario_indirizzo", label: "Indirizzo destinatario" },
    { key: "descrizione_credito", label: "Descrizione del credito", obbligatorio: true, multiline: true },
    { key: "data_scadenza_originaria", label: "Data scadenza originaria", dataIso: true },
    { key: "importo", label: "Importo dovuto €" },
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
    { key: "parte_nome", label: "Nome della parte", obbligatorio: true },
    { key: "parte_cf", label: "Codice fiscale della parte" },
    { key: "parte_indirizzo", label: "Indirizzo/sede della parte" },
    { key: "oggetto_procedimento", label: "Oggetto del procedimento", obbligatorio: true, multiline: true },
    { key: "avvocato_nome", label: "Nome dell'avvocato", obbligatorio: true },
    { key: "avvocato_foro", label: "Foro di iscrizione dell'avvocato", obbligatorio: true },
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
    else if (c.tipo === "numero") f[c.key] = c.default ?? "";
    else if (c.tipo === "bool") f[c.key] = c.default ?? false;
    else if (c.tipo === "scelta") f[c.key] = c.default ?? c.opzioni[0]?.value;
  });
  return f;
}

// Hub unico per tutti i calcolatori: sostituisce i vecchi pulsanti separati
// "Aggiungi scadenza" e "Crea parcella" sparsi per l'app (Dashboard,
// Archivio, scheda pratica). Scadenze Processuali e Parcelle restano le
// voci "storiche" (form a pagina intera, invariati nella logica); gli
// altri sono i nuovi calcolatori legali aggiunti dopo aver studiato
// avvocatoandreani.it.
// Ogni calcolatore produce o una data (scadenza/termine) o un importo in
// euro: la categoria serve solo a raggruppare il picker in due sezioni,
// cosi' l'utente trova subito il tipo di calcolo che gli serve.
const CALCOLATORI: { id: CalcId; titolo: string; sottotitolo: string; icona: string; categoria: "data" | "euro" }[] = [
  { id: "scadenze", titolo: "Scadenze Processuali", sottotitolo: "Calcolo termini a partire da una data", icona: "clock", categoria: "data" },
  { id: "giorni-tra-date", titolo: "Giorni tra due date", sottotitolo: "Conteggio giorni di calendario", icona: "calendar", categoria: "data" },
  { id: "termini-memorie", titolo: "Termini memorie e conclusionali", sottotitolo: "Artt. 171-ter e 189 c.p.c., riforma Cartabia", icona: "calendar", categoria: "data" },
  { id: "termini-impugnazione", titolo: "Termini di impugnazione", sottotitolo: "Appello, Cassazione, revocazione, opposizione di terzo", icona: "flag", categoria: "data" },
  { id: "opposizione-decreto-ingiuntivo", titolo: "Opposizione a decreto ingiuntivo", sottotitolo: "Termine fissato nel decreto, art. 641 c.p.c.", icona: "shield", categoria: "data" },
  { id: "prescrizione", titolo: "Prescrizione e decadenza", sottotitolo: "Con eventuali atti interruttivi", icona: "rotate-ccw", categoria: "data" },
  { id: "termini-citazione", titolo: "Termini di comparizione in citazione", sottotitolo: "Art. 163-bis c.p.c.", icona: "compass", categoria: "data" },
  { id: "precetto", titolo: "Precetto ed esecuzione", sottotitolo: "Mobiliare, immobiliare, presso terzi, autoveicoli", icona: "alert-triangle", categoria: "data" },
  { id: "impugnazione-licenziamento", titolo: "Impugnazione licenziamento", sottotitolo: "Art. 6 L. 604/1966", icona: "user-x", categoria: "data" },
  { id: "ricorso-tributario", titolo: "Ricorso tributario", sottotitolo: "Art. 21 D.Lgs. 546/1992", icona: "file-minus", categoria: "data" },
  { id: "ricorso-tar", titolo: "Ricorso al TAR", sottotitolo: "Giurisdizionale o straordinario", icona: "map", categoria: "data" },
  { id: "termine-querela", titolo: "Termine per la querela", sottotitolo: "Art. 124 c.p.", icona: "alert-octagon", categoria: "data" },
  { id: "disdetta-locazione", titolo: "Disdetta di locazione", sottotitolo: "Abitativa o commerciale", icona: "key", categoria: "data" },
  { id: "parcelle", titolo: "Parcelle", sottotitolo: "Compensi, spese, CPA, IVA", icona: "dollar-sign", categoria: "euro" },
  { id: "interessi-legali", titolo: "Interessi legali", sottotitolo: "Art. 1284 c.c.", icona: "percent", categoria: "euro" },
  { id: "interessi-mora", titolo: "Interessi di mora", sottotitolo: "D.Lgs. 231/2002, transazioni commerciali", icona: "alert-circle", categoria: "euro" },
  { id: "contributo-unificato", titolo: "Contributo unificato", sottotitolo: "Processo civile, per valore causa", icona: "file-text", categoria: "euro" },
  { id: "rivalutazione-istat", titolo: "Rivalutazione ISTAT", sottotitolo: "Capitale rivalutato tra due indici", icona: "trending-up", categoria: "euro" },
  { id: "imposta-successione", titolo: "Imposta di successione", sottotitolo: "Aliquote e franchigie per grado di parentela", icona: "home", categoria: "euro" },
  { id: "compenso-ctu", titolo: "Compenso CTU", sottotitolo: "A vacazioni, DPR 115/2002", icona: "briefcase", categoria: "euro" },
  { id: "parametri-forensi", titolo: "Parametri forensi / spese di lite", sottotitolo: "Giudice di pace, Tribunale, Appello, Cassazione", icona: "bar-chart-2", categoria: "euro" },
  { id: "compenso-mediazione", titolo: "Compenso mediazione civile", sottotitolo: "DM 150/2023", icona: "users", categoria: "euro" },
];

const GRADI_SUCCESSIONE = [
  { id: "coniuge_parenti_retta", label: "Coniuge e parenti in linea retta (figli, genitori)" },
  { id: "fratelli_sorelle", label: "Fratelli e sorelle" },
  { id: "altri_parenti_4grado", label: "Altri parenti fino al 4° grado / affini" },
  { id: "altri_soggetti", label: "Altri soggetti" },
] as const;

export default function Calcolatori() {
  const { t } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string; _t?: string; editId?: string; praticaId?: string }>();
  // L'unico caso che resta "a schermo diretto" (senza passare dal picker) è
  // la modifica di una parcella esistente, raggiunta da Archivio o dalla
  // scheda pratica: non è una "creazione" e non fa parte di questa
  // unificazione. Tutte le altre creazioni passano dal picker qui sotto.
  const locked = params.tab === "parcelle" && !!params.editId;
  const isEditingPar = !!params.editId;
  const [calcAperto, setCalcAperto] = React.useState<CalcId | null>(locked ? "parcelle" : null);
  const [categoriaCalc, setCategoriaCalc] = React.useState<"data" | "euro" | "atti" | null>(null);
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
  const [risScad, setRisScad] = React.useState<any>(null);
  const [titoloScad, setTitoloScad] = React.useState("");
  const [oraScad, setOraScad] = React.useState<string | null>(null);
  const [promemoria, setPromemoria] = React.useState<number[]>([1]);
  const [pratiche, setPratiche] = React.useState<any[]>([]);
  const [praticaId, setPraticaId] = React.useState<string | null>(params.praticaId || null);
  // Parcelle
  const [par, setPar] = React.useState<any>({ fase_studio: "", fase_introduttiva: "", fase_istruttoria: "", fase_decisionale: "", fase_esecutiva: "", diritti: "", maggiorazione_discrezionale_pct: "0", spese_generali_pct: "15", cpa_pct: "4", iva_pct: "22", ritenuta_pct: "0" });
  // Campi non numerici del preventivo (sezioni Avvocato/Parte
  // assistita/Procedimento/Altri dati di Andreani): tenuti separati da `par`
  // perché quest'ultimo viene convertito in blocco con parseNumeroIt prima
  // di ogni calcolo/salvataggio, il che corromperebbe un testo libero.
  const [parDati, setParDati] = React.useState<any>({
    avvocato_nome: "", studio_indirizzo: "", studio_cf: "", ordine_avvocati: "", studio_assicurazione: "",
    parte_persona_giuridica: false, parte_rappresentante_legale: "",
    competenza: "", ufficio_giudiziario: "Tribunale", sede_ufficio: "",
    accessori_di_legge: true, intestazione_studio: "", luogo: "",
    data_preventivo: new Date().toISOString().slice(0, 10),
  });
  const [vociSpese, setVociSpese] = React.useState<{ descrizione: string; importo: string; esente: boolean }[]>([]);
  const [risPar, setRisPar] = React.useState<any>(null);
  const [titoloPar, setTitoloPar] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  // Per precompilare "Attività e compensi" dalla tabella dei parametri
  // forensi (come fa Andreani, che calcola i compensi dallo scaglione di
  // valore invece di farli digitare da zero): rito scelto + stato del
  // suggerimento, separati da `par` perché non vengono salvati con la
  // parcella (sono solo un punto di partenza, poi modificabile a mano).
  const [ritoPar, setRitoPar] = React.useState<"giudice_di_pace" | "tribunale" | "appello" | "cassazione">("tribunale");
  const [suggerendoPar, setSuggerendoPar] = React.useState(false);
  // Interessi legali / di mora
  const [tassiCapitale, setTassiCapitale] = React.useState("");
  const [tassiDataInizio, setTassiDataInizio] = React.useState(new Date().toISOString().slice(0, 10));
  const [tassiDataFine, setTassiDataFine] = React.useState(new Date().toISOString().slice(0, 10));
  const [tassiMaggiorazione, setTassiMaggiorazione] = React.useState("8");
  const [risTassi, setRisTassi] = React.useState<any>(null);
  const [calcolandoTassi, setCalcolandoTassi] = React.useState(false);
  // Contributo unificato
  const [cuValoreCausa, setCuValoreCausa] = React.useState("");
  const [risCu, setRisCu] = React.useState<any>(null);
  const [calcolandoCu, setCalcolandoCu] = React.useState(false);
  // Rivalutazione ISTAT
  const [istatCapitale, setIstatCapitale] = React.useState("");
  const [istatIndiceIniziale, setIstatIndiceIniziale] = React.useState("");
  const [istatIndiceFinale, setIstatIndiceFinale] = React.useState("");
  const [risIstat, setRisIstat] = React.useState<any>(null);
  const [calcolandoIstat, setCalcolandoIstat] = React.useState(false);
  // Termini memorie ex art. 171-ter c.p.c.
  const [memUdienza, setMemUdienza] = React.useState(new Date().toISOString().slice(0, 10));
  const [memEscludiFer, setMemEscludiFer] = React.useState(true);
  const [tipoMem, setTipoMem] = React.useState<"171-ter" | "189">("171-ter");
  const [risMem, setRisMem] = React.useState<any>(null);
  const [calcolandoMem, setCalcolandoMem] = React.useState(false);
  const [savingMem, setSavingMem] = React.useState(false);
  // Imposta di successione
  const [succValoreQuota, setSuccValoreQuota] = React.useState("");
  const [succGrado, setSuccGrado] = React.useState<string>("coniuge_parenti_retta");
  const [succDisabile, setSuccDisabile] = React.useState(false);
  const [risSucc, setRisSucc] = React.useState<any>(null);
  const [calcolandoSucc, setCalcolandoSucc] = React.useState(false);
  // Compenso CTU
  const [ctuVacazioni, setCtuVacazioni] = React.useState("");
  const [ctuTariffa, setCtuTariffa] = React.useState("");
  const [ctuSpese, setCtuSpese] = React.useState("0");
  const [ctuMaggiorazione, setCtuMaggiorazione] = React.useState("0");
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
  const [attoGenerato, setAttoGenerato] = React.useState<any>(null);
  const [attoGenerando, setAttoGenerando] = React.useState(false);

  React.useEffect(() => { api.get("/pratiche").then(setPratiche).catch(() => {}); }, []);

  // Precompila "persona giuridica" dal tipo del cliente collegato alla
  // pratica scelta, invece di richiederlo di nuovo: resta comunque
  // modificabile a mano subito dopo.
  React.useEffect(() => {
    if (!praticaId) return;
    const p = pratiche.find((pp) => pp.id === praticaId);
    if (p?.cliente?.tipo === "azienda") setParDati((prev: any) => ({ ...prev, parte_persona_giuridica: true }));
  }, [praticaId, pratiche]);

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
        fase_esecutiva: String(doc.fase_esecutiva ?? 0),
        diritti: String(doc.diritti ?? 0),
        maggiorazione_discrezionale_pct: String(doc.maggiorazione_discrezionale_pct ?? 0),
        spese_generali_pct: String(doc.spese_generali_pct ?? 15),
        cpa_pct: String(doc.cpa_pct ?? 4),
        iva_pct: String(doc.iva_pct ?? 22),
        ritenuta_pct: String(doc.ritenuta_pct ?? 0),
      });
      setParDati({
        avvocato_nome: doc.avvocato_nome || "",
        studio_indirizzo: doc.studio_indirizzo || "",
        studio_cf: doc.studio_cf || "",
        ordine_avvocati: doc.ordine_avvocati || "",
        studio_assicurazione: doc.studio_assicurazione || "",
        parte_persona_giuridica: !!doc.parte_persona_giuridica,
        parte_rappresentante_legale: doc.parte_rappresentante_legale || "",
        competenza: doc.competenza || "",
        ufficio_giudiziario: doc.ufficio_giudiziario || "Tribunale",
        sede_ufficio: doc.sede_ufficio || "",
        accessori_di_legge: doc.accessori_di_legge ?? true,
        intestazione_studio: doc.intestazione_studio || "",
        luogo: doc.luogo || "",
        data_preventivo: doc.data_preventivo || new Date().toISOString().slice(0, 10),
      });
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
      const r = await api.post("/calc/scadenza", { data_partenza: dataPartenza, giorni: Number(giorni), tipo: tipoS, unita, escludi_feriale: escludiFer, escludi_covid: escludiCovid });
      setRisScad(r);
      setTitoloScad("");
    } catch (e: any) { setRisScad({ error: e.message }); }
  };
  const buildVociSpeseBody = () =>
    vociSpese
      .filter((v) => v.descrizione.trim() || parseNumeroIt(v.importo))
      .map((v) => ({ descrizione: v.descrizione.trim(), importo: parseNumeroIt(v.importo), esente: v.esente }));

  // Precompila i 4 importi di fase con i valori medi della tabella dei
  // parametri forensi per il rito e il valore causa scelti, cosi' come fa
  // Andreani (che parte sempre dallo scaglione invece che da zero): restano
  // comunque modificabili a mano subito dopo, per i casi in cui l'avvocato
  // voglia pattuire un compenso diverso da quello tabellare.
  const suggerisciDaParametriForensi = async () => {
    const valoreCausa = praticaParSelezionata?.valore_causa;
    if (!valoreCausa) {
      Alert.alert("Valore causa mancante", "Collega una pratica con un valore della causa impostato, oppure inserisci gli importi di fase manualmente.");
      return;
    }
    setSuggerendoPar(true);
    try {
      const r = await api.post("/calc/parametri-forensi", { rito: ritoPar, valore_causa: valoreCausa });
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
    const body: any = { ...parDati };
    Object.entries(par).forEach(([k, v]) => body[k] = parseNumeroIt(v as string));
    body.voci_spese = buildVociSpeseBody();
    const r = await api.post("/calc/parcella", body);
    setRisPar(r);
    // In modifica il ricalcolo raffina la stessa parcella: non si deve
    // perdere il nome/la pratica gia' collegati solo perche' si e'
    // ritoccata una cifra.
    if (!params.editId) setTitoloPar("");
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
      const body: any = { tipo: "parcella", pratica_id: praticaId, titolo: titoloPar.trim(), ...parDati };
      Object.entries(par).forEach(([k, v]) => body[k] = parseNumeroIt(v as string));
      body.voci_spese = buildVociSpeseBody();
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
      if (tipo === "interessi-mora") body.maggiorazione_pct = parseNumeroIt(tassiMaggiorazione) || 8;
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
      const r = await api.post("/calc/contributo-unificato", { valore_causa: parseNumeroIt(cuValoreCausa) });
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
      const r = await api.post("/calc/rivalutazione-istat", { capitale: parseNumeroIt(istatCapitale), indice_iniziale: parseNumeroIt(istatIndiceIniziale), indice_finale: parseNumeroIt(istatIndiceFinale) });
      setRisIstat(r);
    } catch (e: any) {
      Alert.alert("Errore", e.message || "Impossibile calcolare. Riprova.");
    } finally {
      setCalcolandoIstat(false);
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
      const r = await api.post("/calc/imposta-successione", { valore_quota: parseNumeroIt(succValoreQuota), grado_parentela: succGrado, disabile_grave: succDisabile });
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
      const r = await api.post("/calc/compenso-ctu", { vacazioni: parseNumeroIt(ctuVacazioni), tariffa_oraria: parseNumeroIt(ctuTariffa), spese_rimborso: parseNumeroIt(ctuSpese), maggiorazione_pct: parseNumeroIt(ctuMaggiorazione) });
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
    setRisScad(null); setTitoloScad("");
    setRisPar(null); setTitoloPar("");
    setRisTassi(null); setTassiCapitale(""); setTassiDataInizio(new Date().toISOString().slice(0, 10)); setTassiDataFine(new Date().toISOString().slice(0, 10)); setTassiMaggiorazione("8");
    setRisCu(null); setCuValoreCausa("");
    setRisIstat(null); setIstatCapitale(""); setIstatIndiceIniziale(""); setIstatIndiceFinale("");
    setRisMem(null); setMemUdienza(new Date().toISOString().slice(0, 10)); setMemEscludiFer(true); setTipoMem("171-ter");
    setRisSucc(null); setSuccValoreQuota(""); setSuccGrado("coniuge_parenti_retta"); setSuccDisabile(false);
    setRisCtu(null); setCtuVacazioni(""); setCtuTariffa(""); setCtuSpese("0"); setCtuMaggiorazione("0"); setTitoloCtu("Compenso CTU");
    setGenForm(defaultGenForm(idc)); setGenRisultato(null); setGenSalvata(false);
  };

  const calcolaGenerico = async () => {
    const cfg = CONFIG_GENERICI[calcAperto as string];
    if (!cfg) return;
    Keyboard.dismiss();
    setGenCalcolando(true);
    setGenRisultato(null);
    try {
      const body = cfg.buildBody
        ? cfg.buildBody(genForm)
        : Object.fromEntries(cfg.campi.map((c) => [c.key, c.tipo === "numero" ? parseNumeroIt(genForm[c.key]) : genForm[c.key]]));
      const r = await api.post(cfg.endpoint, body);
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
    setAttoGenerato(null);
  };

  const generaAtto = async () => {
    if (!attoAperto) return;
    const mancanti = CAMPI_ATTI[attoAperto].filter((c) => c.obbligatorio && !attoForm[c.key]?.trim());
    if (mancanti.length) {
      Alert.alert("Campi mancanti", `Compila: ${mancanti.map((c) => c.label).join(", ")}`);
      return;
    }
    setAttoGenerando(true);
    try {
      const r = await api.post("/atti", { tipo: attoAperto, pratica_id: praticaId, campi: attoForm });
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
  const contenutoScadenze = (
    <View>
      <Text style={[st.lbl, { color: t.onSurfaceSecondary }]}>Data di partenza</Text>
      <DataInput testID="scad-data" value={dataPartenza} onChange={setDataPartenza} />
      <Text style={[st.lbl, { color: t.onSurfaceSecondary }]}>Termine ({unita})</Text>
      <TextInput testID="scad-giorni" value={giorni} onChangeText={setGiorni} keyboardType="numeric" style={[st.input, { backgroundColor: t.surfaceSecondary, color: t.onSurface, borderColor: t.border }]} />
      <Text style={[st.lbl, { color: t.onSurfaceSecondary }]}>Unità</Text>
      <View style={{ flexDirection: "row", gap: 8, marginBottom: SPACING.sm }}>
        {(["giorni", "mesi", "anni"] as const).map((u) => (
          <Pressable key={u} onPress={() => setUnita(u)} style={[st.pill, { backgroundColor: unita === u ? t.brand : t.surfaceSecondary, borderColor: t.border }]}>
            <Text style={{ color: unita === u ? t.onBrand : t.onSurfaceSecondary, fontSize: 12, textTransform: "capitalize" }}>{u}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={[st.lbl, { color: t.onSurfaceSecondary }]}>Direzione</Text>
      <View style={{ flexDirection: "row", gap: 8, marginBottom: SPACING.sm }}>
        {(["avanti", "ritroso"] as const).map((d) => (
          <Pressable key={d} testID={`dir-${d}`} onPress={() => setTipoS(d)} style={[st.pill, { backgroundColor: tipoS === d ? t.brand : t.surfaceSecondary, borderColor: t.border }]}>
            <Text style={{ color: tipoS === d ? t.onBrand : t.onSurfaceSecondary, fontSize: 12, textTransform: "capitalize" }}>{d}</Text>
          </Pressable>
        ))}
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

  const praticaParSelezionata = pratiche.find((p) => p.id === praticaId);
  const clienteParSelezionato = praticaParSelezionata?.cliente;

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

      <Text style={sezioneLbl}>Parte assistita</Text>
      {clienteParSelezionato ? (
        <View style={{ padding: SPACING.md, borderRadius: RADIUS.md, backgroundColor: t.surfaceSecondary }}>
          <Text style={{ color: t.onSurface, fontWeight: "700" }}>
            {clienteParSelezionato.ragione_sociale || `${clienteParSelezionato.nome || ""} ${clienteParSelezionato.cognome || ""}`.trim()}
          </Text>
          {clienteParSelezionato.codice_fiscale ? <Text style={{ color: t.onSurfaceSecondary, fontSize: 12, marginTop: 2 }}>CF: {clienteParSelezionato.codice_fiscale}</Text> : null}
          {clienteParSelezionato.partita_iva ? <Text style={{ color: t.onSurfaceSecondary, fontSize: 12, marginTop: 2 }}>P.IVA: {clienteParSelezionato.partita_iva}</Text> : null}
        </View>
      ) : (
        <Text style={{ color: t.onSurfaceTertiary, fontSize: 12, fontStyle: "italic" }}>Collega una pratica per precompilare i dati del cliente.</Text>
      )}
      {checkbox(parDati.parte_persona_giuridica, () => setParDati({ ...parDati, parte_persona_giuridica: !parDati.parte_persona_giuridica }), "Persona giuridica", "par-persona-giuridica")}
      {parDati.parte_persona_giuridica ? campoTesto("parte_rappresentante_legale", "Rappresentante legale") : null}

      <Text style={sezioneLbl}>Dati del procedimento</Text>
      {praticaParSelezionata ? (
        <View style={{ padding: SPACING.md, borderRadius: RADIUS.md, backgroundColor: t.surfaceSecondary, marginBottom: SPACING.sm }}>
          <Text style={{ color: t.onSurface, fontWeight: "700" }}>{praticaParSelezionata.oggetto}</Text>
          {praticaParSelezionata.controparte ? <Text style={{ color: t.onSurfaceSecondary, fontSize: 12, marginTop: 2 }}>Contro: {praticaParSelezionata.controparte}</Text> : null}
          {praticaParSelezionata.valore_causa ? <Text style={{ color: t.onSurfaceSecondary, fontSize: 12, marginTop: 2 }}>Valore della controversia: {formatEuro(praticaParSelezionata.valore_causa)}</Text> : null}
        </View>
      ) : null}
      {campoTesto("competenza", "Competenza per giurisdizione o materia", "Es. Tribunale")}
      {campoTesto("ufficio_giudiziario", "Ufficio giudiziario")}
      {campoTesto("sede_ufficio", "Ubicazione ufficio giudiziario", praticaParSelezionata?.tribunale || undefined)}

      <Text style={sezioneLbl}>Attività e compensi</Text>
      <Text style={[st.lbl, { color: t.onSurfaceSecondary }]}>Rito/grado (per il suggerimento dai parametri forensi)</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: SPACING.sm }}>
        {([["giudice_di_pace", "Giudice di pace"], ["tribunale", "Tribunale"], ["appello", "Appello"], ["cassazione", "Cassazione"]] as const).map(([v, l]) => (
          <Pressable key={v} testID={`par-rito-${v}`} onPress={() => setRitoPar(v)} style={[st.pill, { backgroundColor: ritoPar === v ? t.brand : t.surfaceSecondary, borderColor: t.border }]}>
            <Text style={{ color: ritoPar === v ? t.onBrand : t.onSurfaceSecondary, fontSize: 12 }}>{l}</Text>
          </Pressable>
        ))}
      </View>
      <Pressable
        testID="par-suggerisci-parametri-forensi"
        onPress={suggerisciDaParametriForensi}
        disabled={suggerendoPar}
        style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, padding: 10, borderRadius: RADIUS.md, backgroundColor: t.brandSecondary, opacity: suggerendoPar ? 0.6 : 1, marginBottom: SPACING.sm }}
      >
        <Feather name="zap" size={14} color={t.brand} />
        <Text style={{ color: t.brand, fontWeight: "700", fontSize: 13 }}>{suggerendoPar ? "Calcolo..." : "Calcola compensi dai parametri forensi"}</Text>
      </Pressable>
      {!praticaParSelezionata?.valore_causa ? (
        <Text style={{ color: t.onSurfaceTertiary, fontSize: 11, fontStyle: "italic", marginBottom: SPACING.sm }}>
          Richiede una pratica collegata con un valore della causa impostato.
        </Text>
      ) : null}
      {[
        ["fase_studio", "Fase studio €"],
        ["fase_introduttiva", "Fase introduttiva €"],
        ["fase_istruttoria", "Fase istruttoria €"],
        ["fase_decisionale", "Fase decisionale €"],
        ["fase_esecutiva", "Fase esecutiva €"],
        ["diritti", "Diritti €"],
        ["maggiorazione_discrezionale_pct", "Maggiorazione discrezionale %"],
      ].map(([k, l]) => (
        <View key={k as string}>
          <Text style={[st.lbl, { color: t.onSurfaceSecondary }]}>{l}</Text>
          <TextInput testID={`par-${k}`} value={par[k as string]} onChangeText={(v) => setPar({ ...par, [k as string]: v })} keyboardType="numeric" style={[st.input, { backgroundColor: t.surfaceSecondary, color: t.onSurface, borderColor: t.border }]} />
        </View>
      ))}

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
      {campoTesto("intestazione_studio", "Intestazione studio")}
      {checkbox(parDati.accessori_di_legge, () => setParDati({ ...parDati, accessori_di_legge: !parDati.accessori_di_legge }), "Oltre accessori di legge (spese generali, CPA, IVA)", "par-accessori-di-legge")}
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
          {[
            ["Compensi fasi", risPar.compensi_fasi],
            ["Voci custom", risPar.voci_custom_totale],
            ["Diritti", risPar.diritti],
            ["Maggiorazione discrezionale", risPar.maggiorazione],
            ["Spese generali", risPar.spese_generali],
            ["Imp. previdenza", risPar.imponibile_previdenza],
            ["CPA", risPar.cpa],
            ["Imp. IVA", risPar.imponibile_iva],
            ["IVA", risPar.iva],
            ["Spese esenti IVA", risPar.spese_esenti],
            ["Spese non esenti", risPar.spese_imponibili],
            ["Ritenuta", -Math.abs(risPar.ritenuta_acconto || 0)],
          ].map(([l, v]) => (
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

  const CATEGORIE_CALC: { id: "data" | "euro" | "atti"; titolo: string; icona: string }[] = [
    { id: "data", titolo: "Date e scadenze", icona: "calendar" },
    { id: "euro", titolo: "Importi e compensi", icona: "dollar-sign" },
    { id: "atti", titolo: "Atti (bozze di documenti)", icona: "file-text" },
  ];
  const vociCategoria = (catId: "data" | "euro" | "atti") =>
    catId === "atti" ? ATTI : CALCOLATORI.filter((c) => c.categoria === catId);

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: t.surfaceSecondary }}>
      <Header variant="hero" title="Calcolatori" onBack={() => router.back()} />
      <ScrollView ref={scrollRef} contentContainerStyle={{ padding: SPACING.lg, paddingBottom: SPACING.xxxl + 80 }}>
        {CATEGORIE_CALC.map((cat) => {
          const voci = vociCategoria(cat.id);
          const aperta = categoriaCalc === cat.id;
          return (
            <View key={cat.id} style={{ marginBottom: SPACING.sm }}>
              <Pressable
                testID={`categoria-${cat.id}`}
                onPress={() => setCategoriaCalc(aperta ? null : cat.id)}
                style={[st.calcCard, { backgroundColor: t.surface, borderColor: aperta ? t.brand : t.border }]}
              >
                <View style={[st.calcIcon, { backgroundColor: t.brandSecondary }]}>
                  <Feather name={cat.icona as any} size={18} color={t.brand} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: t.onSurface, fontWeight: "700", fontSize: 14 }}>{cat.titolo}</Text>
                  <Text style={{ color: t.onSurfaceTertiary, fontSize: 12, marginTop: 2 }}>{voci.length} {voci.length === 1 ? "voce" : "voci"}</Text>
                </View>
                <Feather name={aperta ? "chevron-up" : "chevron-down"} size={18} color={t.onSurfaceTertiary} />
              </Pressable>
              {aperta ? (
                <View style={{ marginTop: SPACING.sm, gap: SPACING.sm }}>
                  {voci.map((v: any) => (
                    <Pressable
                      key={v.id}
                      testID={cat.id === "atti" ? `atto-${v.id}` : `calc-${v.id}`}
                      onPress={() => (cat.id === "atti" ? apriAtto(v.id) : apriCalcolatore(v.id))}
                      style={[st.calcCard, { backgroundColor: t.surfaceSecondary, borderColor: t.border, marginLeft: SPACING.md }]}
                    >
                      <View style={[st.calcIcon, { backgroundColor: t.surface }]}>
                        <Feather name={v.icona as any} size={16} color={t.brand} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: t.onSurface, fontWeight: "700", fontSize: 14 }}>{v.titolo}</Text>
                        <Text style={{ color: t.onSurfaceTertiary, fontSize: 12, marginTop: 2 }}>{v.sottotitolo}</Text>
                      </View>
                      <Feather name="chevron-right" size={18} color={t.onSurfaceTertiary} />
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </View>
          );
        })}
      </ScrollView>

      {attoAperto ? (
        <SwipeBackScreen edges={["top"]} style={{ backgroundColor: t.surface }} onDismiss={() => setAttoAperto(null)}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
            <Header variant="hero" title={attoCorrente?.titolo || "Atto"} onBack={() => setAttoAperto(null)} />
            <ScrollView contentContainerStyle={{ padding: SPACING.lg, paddingBottom: SPACING.xxxl }} keyboardShouldPersistTaps="handled">
              <Text style={{ color: t.warning, fontSize: 12, marginBottom: SPACING.md }}>
                Il documento generato è una bozza: va rivista e personalizzata prima dell&apos;invio.
              </Text>
              {attoAperto && CAMPI_ATTI[attoAperto].map((c) => (
                <View key={c.key}>
                  <Text style={[st.lbl, { color: t.onSurfaceSecondary }]}>{c.label}{c.obbligatorio ? " *" : ""}</Text>
                  {c.opzioni ? (
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: SPACING.sm }}>
                      {c.opzioni.map((o) => (
                        <Pressable key={o.value} testID={`atto-campo-${c.key}-${o.value}`} onPress={() => setAttoForm({ ...attoForm, [c.key]: o.value })} style={[st.pill, { backgroundColor: attoForm[c.key] === o.value ? t.brand : t.surfaceSecondary, borderColor: t.border }]}>
                          <Text style={{ color: attoForm[c.key] === o.value ? t.onBrand : t.onSurfaceSecondary, fontSize: 12 }}>{o.label}</Text>
                        </Pressable>
                      ))}
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
              ))}
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
                  <View style={{ flexDirection: "row", gap: 8, marginBottom: SPACING.sm }}>
                    {([["171-ter", "Memorie integrative (art. 171-ter)"], ["189", "Conclusionali (art. 189)"]] as const).map(([v, l]) => (
                      <Pressable key={v} testID={`mem-tipo-${v}`} onPress={() => setTipoMem(v)} style={[st.pill, { backgroundColor: tipoMem === v ? t.brand : t.surfaceSecondary, borderColor: t.border }]}>
                        <Text style={{ color: tipoMem === v ? t.onBrand : t.onSurfaceSecondary, fontSize: 12 }}>{l}</Text>
                      </Pressable>
                    ))}
                  </View>
                  <Text style={[st.lbl, { color: t.onSurfaceSecondary }]}>{tipoMem === "189" ? "Data udienza collegiale di discussione" : "Data udienza di trattazione"}</Text>
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
                      <Text style={{ color: t.onBrandSecondary, fontSize: 12, fontWeight: "700" }}>{risMem.tipo === "189" ? "CONCLUSIONALI EX ART. 189 C.P.C." : "MEMORIE EX ART. 171-TER C.P.C."}</Text>
                      <View style={{ marginTop: SPACING.sm, gap: 4 }}>
                        {risMem.tipo === "189" ? (
                          <>
                            <Text style={{ color: t.onBrandSecondary, fontSize: 13 }}>Note precisazione conclusioni (-60 gg): <Text style={{ fontWeight: "800" }}>{isoToDataIt(risMem.prima_memoria)}</Text></Text>
                            <Text style={{ color: t.onBrandSecondary, fontSize: 13 }}>Comparse conclusionali (-30 gg): <Text style={{ fontWeight: "800" }}>{isoToDataIt(risMem.seconda_memoria)}</Text></Text>
                            <Text style={{ color: t.onBrandSecondary, fontSize: 13 }}>Memorie di replica (-15 gg): <Text style={{ fontWeight: "800" }}>{isoToDataIt(risMem.terza_memoria)}</Text></Text>
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
                            <Text style={{ color: t.onBrand, fontWeight: "700" }}>{savingMem ? "Salvataggio..." : "Salva le 3 scadenze"}</Text>
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
                      <Text style={[st.lbl, { color: t.onSurfaceSecondary }]}>Maggiorazione sul tasso BCE % (default 8, art. 5 D.Lgs. 231/2002)</Text>
                      <TextInput testID="tassi-maggiorazione" value={tassiMaggiorazione} onChangeText={setTassiMaggiorazione} keyboardType="numeric" style={[st.input, { backgroundColor: t.surfaceSecondary, color: t.onSurface, borderColor: t.border }]} />
                    </>
                  ) : null}
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
                  <Text style={[st.lbl, { color: t.onSurfaceSecondary }]}>Valore della causa €</Text>
                  <TextInput testID="cu-valore-causa" value={cuValoreCausa} onChangeText={setCuValoreCausa} keyboardType="numeric" style={[st.input, { backgroundColor: t.surfaceSecondary, color: t.onSurface, borderColor: t.border }]} />
                  <Pressable testID="btn-calc-cu" onPress={calcolaContributoUnificato} disabled={calcolandoCu} style={[st.submit, { backgroundColor: t.brand, opacity: calcolandoCu ? 0.6 : 1 }]}>
                    <Text style={{ color: t.onBrand, fontWeight: "700" }}>{calcolandoCu ? "Calcolo..." : "Calcola"}</Text>
                  </Pressable>
                  {risCu ? (
                    <View style={[st.result, { backgroundColor: t.brandSecondary, borderColor: t.brand }]}>
                      <Text style={{ color: t.onBrandSecondary, fontSize: 12, fontWeight: "700" }}>CONTRIBUTO UNIFICATO</Text>
                      <Text testID="cu-result" style={{ color: t.onBrandSecondary, fontSize: 26, fontWeight: "800", fontVariant: ["tabular-nums"] }}>{formatEuro(risCu.contributo_unificato)}</Text>
                    </View>
                  ) : null}
                </View>
              ) : null}

              {calcAperto === "rivalutazione-istat" ? (
                <View>
                  <Text style={[st.lbl, { color: t.onSurfaceSecondary }]}>Capitale €</Text>
                  <TextInput testID="istat-capitale" value={istatCapitale} onChangeText={setIstatCapitale} keyboardType="numeric" style={[st.input, { backgroundColor: t.surfaceSecondary, color: t.onSurface, borderColor: t.border }]} />
                  <Text style={[st.lbl, { color: t.onSurfaceSecondary }]}>Indice ISTAT al mese di partenza</Text>
                  <TextInput testID="istat-indice-iniziale" value={istatIndiceIniziale} onChangeText={setIstatIndiceIniziale} keyboardType="numeric" style={[st.input, { backgroundColor: t.surfaceSecondary, color: t.onSurface, borderColor: t.border }]} />
                  <Text style={[st.lbl, { color: t.onSurfaceSecondary }]}>Indice ISTAT al mese di arrivo</Text>
                  <TextInput testID="istat-indice-finale" value={istatIndiceFinale} onChangeText={setIstatIndiceFinale} keyboardType="numeric" style={[st.input, { backgroundColor: t.surfaceSecondary, color: t.onSurface, borderColor: t.border }]} />
                  <Text style={{ color: t.onSurfaceTertiary, fontSize: 11, marginTop: SPACING.sm }}>
                    Gli indici si trovano nelle tabelle di rivalutazione ISTAT ufficiali (serie FOI), per il mese di partenza e quello di arrivo.
                  </Text>
                  <Pressable testID="btn-calc-istat" onPress={calcolaIstat} disabled={calcolandoIstat} style={[st.submit, { backgroundColor: t.brand, opacity: calcolandoIstat ? 0.6 : 1 }]}>
                    <Text style={{ color: t.onBrand, fontWeight: "700" }}>{calcolandoIstat ? "Calcolo..." : "Calcola"}</Text>
                  </Pressable>
                  {risIstat ? (
                    <View style={[st.result, { backgroundColor: t.brandSecondary, borderColor: t.brand }]}>
                      <Text style={{ color: t.onBrandSecondary, fontSize: 12, fontWeight: "700" }}>CAPITALE RIVALUTATO</Text>
                      <Text testID="istat-result" style={{ color: t.onBrandSecondary, fontSize: 26, fontWeight: "800", fontVariant: ["tabular-nums"] }}>{formatEuro(risIstat.capitale_rivalutato)}</Text>
                      <Text style={{ color: t.onBrandSecondary, marginTop: 4, fontSize: 12 }}>Rivalutazione: {formatEuro(risIstat.rivalutazione)}</Text>
                    </View>
                  ) : null}
                </View>
              ) : null}

              {calcAperto === "imposta-successione" ? (
                <View>
                  <Text style={[st.lbl, { color: t.onSurfaceSecondary }]}>Valore della quota ereditaria €</Text>
                  <TextInput testID="succ-valore-quota" value={succValoreQuota} onChangeText={setSuccValoreQuota} keyboardType="numeric" style={[st.input, { backgroundColor: t.surfaceSecondary, color: t.onSurface, borderColor: t.border }]} />
                  <Text style={[st.lbl, { color: t.onSurfaceSecondary }]}>Grado di parentela</Text>
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
                      <Text style={{ color: t.onBrandSecondary, fontSize: 12, fontWeight: "700" }}>IMPOSTA DI SUCCESSIONE</Text>
                      <Text testID="succ-result" style={{ color: t.onBrandSecondary, fontSize: 26, fontWeight: "800", fontVariant: ["tabular-nums"] }}>{formatEuro(risSucc.imposta)}</Text>
                      <Text style={{ color: t.onBrandSecondary, marginTop: 4, fontSize: 12 }}>Franchigia: {formatEuro(risSucc.franchigia)} · Aliquota: {risSucc.aliquota_pct}% · Imponibile: {formatEuro(risSucc.imponibile)}</Text>
                    </View>
                  ) : null}
                </View>
              ) : null}

              {calcAperto === "compenso-ctu" ? (
                <View>
                  <Text style={[st.lbl, { color: t.onSurfaceSecondary }]}>Vacazioni (ore)</Text>
                  <TextInput testID="ctu-vacazioni" value={ctuVacazioni} onChangeText={setCtuVacazioni} keyboardType="numeric" style={[st.input, { backgroundColor: t.surfaceSecondary, color: t.onSurface, borderColor: t.border }]} />
                  <Text style={[st.lbl, { color: t.onSurfaceSecondary }]}>Tariffa oraria € (da verificare sul TU spese di giustizia vigente)</Text>
                  <TextInput testID="ctu-tariffa" value={ctuTariffa} onChangeText={setCtuTariffa} keyboardType="numeric" style={[st.input, { backgroundColor: t.surfaceSecondary, color: t.onSurface, borderColor: t.border }]} />
                  <Text style={[st.lbl, { color: t.onSurfaceSecondary }]}>Maggiorazione complessità %</Text>
                  <TextInput testID="ctu-maggiorazione" value={ctuMaggiorazione} onChangeText={setCtuMaggiorazione} keyboardType="numeric" style={[st.input, { backgroundColor: t.surfaceSecondary, color: t.onSurface, borderColor: t.border }]} />
                  <Text style={[st.lbl, { color: t.onSurfaceSecondary }]}>Rimborso spese €</Text>
                  <TextInput testID="ctu-spese" value={ctuSpese} onChangeText={setCtuSpese} keyboardType="numeric" style={[st.input, { backgroundColor: t.surfaceSecondary, color: t.onSurface, borderColor: t.border }]} />
                  <Pressable testID="btn-calc-ctu" onPress={calcolaCtu} disabled={calcolandoCtu} style={[st.submit, { backgroundColor: t.brand, opacity: calcolandoCtu ? 0.6 : 1 }]}>
                    <Text style={{ color: t.onBrand, fontWeight: "700" }}>{calcolandoCtu ? "Calcolo..." : "Calcola"}</Text>
                  </Pressable>
                  {risCtu ? (
                    <View style={[st.result, { backgroundColor: t.brandSecondary, borderColor: t.brand }]}>
                      <Text style={{ color: t.onBrandSecondary, fontSize: 12, fontWeight: "700" }}>COMPENSO TOTALE</Text>
                      <Text testID="ctu-result" style={{ color: t.onBrandSecondary, fontSize: 26, fontWeight: "800", fontVariant: ["tabular-nums"] }}>{formatEuro(risCtu.totale)}</Text>
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
                    if (c.tipo === "data" || c.tipo === "data_opzionale") {
                      return (
                        <View key={c.key}>
                          <Text style={[st.lbl, { color: t.onSurfaceSecondary }]}>{c.label}{c.tipo === "data_opzionale" ? " (opzionale)" : ""}</Text>
                          <DataInput testID={`gen-${c.key}`} value={genForm[c.key] || ""} onChange={(v) => setGenForm({ ...genForm, [c.key]: v })} />
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
                    return (
                      <View key={c.key}>
                        <Text style={[st.lbl, { color: t.onSurfaceSecondary }]}>{c.label}</Text>
                        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: SPACING.sm }}>
                          {c.opzioni.map((o) => (
                            <Pressable key={o.value} testID={`gen-${c.key}-${o.value}`} onPress={() => setGenForm({ ...genForm, [c.key]: o.value })} style={[st.pill, { backgroundColor: genForm[c.key] === o.value ? t.brand : t.surfaceSecondary, borderColor: t.border }]}>
                              <Text style={{ color: genForm[c.key] === o.value ? t.onBrand : t.onSurfaceSecondary, fontSize: 12 }}>{o.label}</Text>
                            </Pressable>
                          ))}
                        </View>
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
