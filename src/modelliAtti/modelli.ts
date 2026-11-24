// Descrizione dei modelli di atti disponibili nel menù Calcolatori. I campi, le opzioni e i valori di
// partenza seguono i moduli del backend (`POST /api/atti-modello/<nome>`, vedi docs/modelli-atti.md
// nel repo backend). Per aggiungere un modello basta aggiungere qui la sua descrizione e
// collegarla a una voce del menù.
import type { CampoRigaLista } from "@/src/components/ListaInput";
import { improntaFile } from "@/src/utils/improntaFile";
import { riferimentoTemporale } from "@/src/utils/improntaHash";
import * as DocumentPicker from "expo-document-picker";
import type { CampoModello, ModelloAtto, Opzione } from "./tipi";

// ---- Opzioni comuni a più modelli ----
const INCIPIT: Opzione[] = [
  { value: "il_sottoscritto", label: "Il sottoscritto" },
  { value: "la_sottoscritta", label: "La sottoscritta" },
  { value: "io_sottoscritto", label: "Io sottoscritto" },
  { value: "io_sottoscritta", label: "Io sottoscritta" },
];
const NORMA: Opzione[] = [
  { value: "nuovo_rito", label: "Nuovo rito (riforma Cartabia)" },
  { value: "vecchio_rito", label: "Vecchio rito" },
  { value: "nessuna", label: "Nessuna normativa" },
];
const PROVENIENZA_PEC: Opzione[] = [
  { value: "inipec", label: "INI-PEC" },
  { value: "reginde", label: "ReGIndE" },
  { value: "registro_imprese", label: "Registro Imprese" },
  { value: "albo_professionale", label: "Albo professionale" },
  { value: "registro_pa", label: "Registro PA" },
  { value: "inad", label: "INAD" },
];
const PROVENIENZA_PEC_FACOLTATIVA: Opzione[] = [{ value: "", label: "Non indicata" }, ...PROVENIENZA_PEC];

const testo = (key: string, label: string, extra: Partial<Extract<CampoModello, { tipo: "testo" }>> & { obbligatorio?: boolean; mostraSe?: CampoModello["mostraSe"]; aiuto?: string } = {}): CampoModello =>
  ({ tipo: "testo", key, label, ...extra }) as CampoModello;
const bool = (key: string, label: string, def = false, extra: { mostraSe?: CampoModello["mostraSe"]; valoreSeNascosto?: unknown; aiuto?: string; soloSchermo?: boolean } = {}): CampoModello =>
  ({ tipo: "bool", key, label, default: def, ...extra }) as CampoModello;

const campiFirma = (nomeKey: string, nomeLabel: string): CampoModello[] => [
  { tipo: "scelta", key: "incipit", label: "Incipit", opzioni: INCIPIT },
  testo(nomeKey, nomeLabel, { obbligatorio: true }),
  testo("luogo", "Luogo", { obbligatorio: true }),
  { tipo: "data", key: "data", label: "Data", vuotaOggi: true, aiuto: "Se lasci vuoto vale oggi." },
];

// ---- 1. Attestazione di conformità ----
const stessoDocumento = (f: Record<string, any>) => f.inserimento === "stesso_documento" && ["pct", "pec", "altri_usi"].includes(f.ambito);
const ATTESTAZIONE: ModelloAtto = {
  id: "attestazione-conformita",
  titolo: "Attestazione Conformità",
  endpoint: "/atti-modello/attestazione-conformita",
  gruppi: [
    {
      titolo: "Utilizzo",
      campi: [
        {
          tipo: "scelta", key: "ambito", label: "Utilizzo", default: "pct", opzioni: [
            { value: "pct", label: "Deposito telematico (PCT)" },
            { value: "notifica_telematica", label: "Notifica telematica art. 3-bis L.53/1994" },
            { value: "notifica_unep", label: "Notifica cartacea a mezzo UNEP" },
            { value: "pec", label: "Invio tramite PEC" },
            { value: "altri_usi", label: "Conformità di documento informatico per altri usi" },
          ],
        },
        {
          tipo: "scelta", key: "inserimento", label: "Da inserire in", default: "documento_separato",
          mostraSe: (f) => ["pct", "pec", "altri_usi"].includes(f.ambito),
          opzioni: [{ value: "documento_separato", label: "Documento separato" }, { value: "stesso_documento", label: "Stesso documento" }],
        },
        { tipo: "scelta", key: "norma", label: "Normativa", default: "nuovo_rito", opzioni: NORMA },
        {
          tipo: "scelta", key: "origine", label: "Origine", default: "originale", mostraSe: stessoDocumento, opzioni: [
            { value: "originale", label: "Originale" },
            { value: "copia_conforme", label: "Copia conforme" },
            { value: "fascicolo_telematico", label: "Fascicolo telematico" },
            { value: "cancelleria", label: "Cancelleria" },
          ],
        },
        { tipo: "numero", key: "numero_fogli", label: "Pagine", invio: "intero", default: "0", mostraSe: (f) => f.ambito === "notifica_unep", aiuto: "Numero di fogli della copia cartacea." },
      ],
    },
    { titolo: "Firma", campi: campiFirma("firmatario", "Firmatario") },
    {
      titolo: "Documenti",
      campi: [
        {
          tipo: "lista", key: "documenti", label: "Documenti da dichiarare conformi", etichettaAggiungi: "Aggiungi un documento", nomeVoce: "documento", max: 16, min: 1,
          mostraSe: (f) => !(stessoDocumento(f) && f.ambito !== "pec"),
          campi: [
            { tipo: "testo", key: "nome_file", label: "Nome del file", mostraSe: (_r, f) => f.ambito !== "notifica_unep" },
            {
              tipo: "azione", key: "scegli_file", label: "Scegli il file e calcola l'impronta", mostraSe: (_r, f) => f.ambito === "altri_usi" && f.inserimento !== "stesso_documento",
              esegui: async () => {
                const res = await DocumentPicker.getDocumentAsync({ multiple: false, copyToCacheDirectory: true, type: "*/*" });
                if (res.canceled || !res.assets?.length) return null;
                const h = await improntaFile(res.assets[0]);
                return { nome_file: h.nome, impronta: h.hash, riferimento_temporale: riferimentoTemporale(h.modificato) };
              },
            },
            {
              tipo: "scelta", key: "prepo", label: "Documento", default: "del decreto ingiuntivo",
              opzioni: ["del decreto ingiuntivo", "della sentenza", "del provvedimento", "del ricorso e decreto", "del ricorso", "del decreto", "dell’atto di citazione", "dell’atto di pignoramento", "del titolo esecutivo", "del precetto", "del", "della", "dell’", "dello", "dei", "degli", "delle"].map((v) => ({ value: v, label: v })),
            },
            { tipo: "testo", key: "descrizione", label: "Descrizione", nota: () => "Completa la frase, es. «decreto ingiuntivo n. 123/2026»." },
            {
              tipo: "scelta", key: "origine", label: "Origine", default: "originale", mostraSe: (_r, f) => f.ambito !== "notifica_unep" && !stessoDocumento(f),
              opzioni: [
                { value: "originale", label: "Originale" }, { value: "copia_conforme", label: "Copia conforme" },
                { value: "fascicolo_telematico", label: "Fascicolo telematico" }, { value: "cancelleria", label: "Cancelleria" },
              ],
            },
            { tipo: "testo", key: "impronta", label: "Impronta (SHA-256)", mostraSe: (_r, f) => f.ambito === "altri_usi" && f.inserimento !== "stesso_documento" },
            { tipo: "testo", key: "riferimento_temporale", label: "Riferimento temporale", mostraSe: (_r, f) => f.ambito === "altri_usi" && f.inserimento !== "stesso_documento" },
          ] as CampoRigaLista[],
        },
      ],
    },
  ],
};

// ---- 2. Relata di notifica via PEC ----
const campiSoggetto = (): CampoRigaLista[] => [
  { tipo: "testo", key: "nome", label: "Nome", obbligatorio: true },
  { tipo: "bool", key: "persona_giuridica", label: "Persona giuridica" },
  { tipo: "testo", key: "rappresentante_legale", label: "Rappresentante legale", mostraSe: (r) => !!r.persona_giuridica },
  { tipo: "testo", key: "codice_fiscale", label: "Codice fiscale o partita IVA" },
];
const RELATA: ModelloAtto = {
  id: "relata-notifica-pec",
  titolo: "Relata Notifica PEC",
  endpoint: "/atti-modello/relata-notifica-pec",
  gruppi: [
    {
      titolo: "Avvocato",
      campi: [
        { tipo: "scelta", key: "incipit", label: "Incipit", opzioni: INCIPIT },
        testo("avvocato", "Avvocato", { obbligatorio: true }),
        testo("codice_fiscale", "Codice fiscale", { obbligatorio: true }),
        testo("ordine", "Ordine degli avvocati di", { aiuto: "Città, es. Roma. Se lasci vuoto non viene indicato." }),
        testo("luogo", "Luogo", { obbligatorio: true }),
        { tipo: "data", key: "data", label: "Data", vuotaOggi: true, aiuto: "Se lasci vuoto vale oggi." },
      ],
    },
    {
      titolo: "Parti",
      campi: [
        { tipo: "lista", key: "parti", label: "Parti assistite", etichettaAggiungi: "Aggiungi una parte", nomeVoce: "parte", min: 1, max: 20, campi: campiSoggetto().map((c) => (c.key === "codice_fiscale" ? ({ ...c, obbligatorio: true } as CampoRigaLista) : c)) },
        bool("in_corso", "Procedimento in corso"),
        testo("numero_rg", "Numero R.G.", { mostraSe: (f) => !!f.in_corso, obbligatorio: true }),
        testo("ufficio_giudiziario", "Ufficio giudiziario", { mostraSe: (f) => !!f.in_corso, obbligatorio: true }),
      ],
    },
    {
      titolo: "Allegati",
      campi: [
        {
          tipo: "lista", key: "allegati", label: "Allegati", etichettaAggiungi: "Aggiungi un allegato", nomeVoce: "allegato", min: 1, max: 16,
          campi: [
            { tipo: "testo", key: "nome_file", label: "Nome del file" },
            {
              tipo: "scelta", key: "tipologia", label: "Tipologia", default: "copia_fascicolo_telematico", opzioni: [
                { value: "scansione_originale", label: "Scansione dell'originale" },
                { value: "scansione_copia_conforme", label: "Scansione di copia conforme" },
                { value: "copia_fascicolo_telematico", label: "Copia dal fascicolo telematico" },
                { value: "copia_cancelleria", label: "Copia di cancelleria" },
                { value: "duplicato_fascicolo_telematico", label: "Duplicato del fascicolo telematico" },
                { value: "documento_in_proprio", label: "Documento in proprio" },
              ],
            },
            { tipo: "testo", key: "descrizione", label: "Descrizione", obbligatorio: true, nota: () => "Con l'articolo, es. «il contratto di locazione»." },
          ],
        },
        {
          tipo: "scelta", key: "modalita_attestazione", label: "Modalità di attestazione", default: "in_calce", opzioni: [
            { value: "in_calce", label: "In calce" }, { value: "per_ogni_file", label: "Per ogni file" },
          ],
        },
        { tipo: "scelta", key: "norma", label: "Normativa", default: "nuovo_rito", opzioni: NORMA },
      ],
    },
    {
      titolo: "Destinatari",
      campi: [
        {
          tipo: "lista", key: "destinatari", label: "Destinatari della notifica", etichettaAggiungi: "Aggiungi un destinatario", nomeVoce: "destinatario", min: 1, max: 20,
          campi: [
            ...campiSoggetto(),
            { tipo: "bool", key: "domicilio_eletto", label: "Domicilio eletto" },
            { tipo: "testo", key: "domicilio_presso", label: "Domicilio presso", mostraSe: (r) => !!r.domicilio_eletto },
            { tipo: "testo", key: "pec", label: "Indirizzo PEC", obbligatorio: true },
            { tipo: "scelta", key: "provenienza_pec", label: "Provenienza della PEC", default: "inipec", opzioni: PROVENIENZA_PEC },
          ],
        },
      ],
    },
  ],
};

// ---- Uffici giudiziari (fascicolo di parte e note di trattazione) ----
const competenze = (consiglioDiStato: string): Opzione[] => [
  { value: "giudice_di_pace", label: "Giudice di pace" },
  { value: "tribunale", label: "Tribunale" },
  { value: "corte_appello", label: "Corte d'appello" },
  { value: "tar", label: "T.A.R." },
  { value: consiglioDiStato, label: "Consiglio di Stato" },
  { value: "cgt_primo_grado", label: "Corte di giustizia tributaria di primo grado" },
  { value: "cgt_secondo_grado", label: "Corte di giustizia tributaria di secondo grado" },
  { value: "cassazione", label: "Corte di Cassazione" },
];
const serveLuogo = (f: Record<string, any>) => !["consiglio_stato", "consiglio_di_stato", "cassazione"].includes(f.competenza);

// ---- 3. Fascicolo di parte ----
const campiParteFascicolo = (): CampoRigaLista[] => [
  { tipo: "testo", key: "nome", label: "Nome", obbligatorio: true },
  { tipo: "testo", key: "indirizzo", label: "Indirizzo" },
  { tipo: "bool", key: "persona_giuridica", label: "Persona giuridica" },
  { tipo: "testo", key: "rappresentante_legale", label: "Rappresentante legale", mostraSe: (r) => !!r.persona_giuridica },
  { tipo: "testo", key: "codice_fiscale", label: "Codice fiscale o partita IVA" },
];
const FASCICOLO: ModelloAtto = {
  id: "fascicolo-di-parte",
  titolo: "Fascicolo di Parte",
  endpoint: "/atti-modello/fascicolo-di-parte",
  introduzione: "Crea la copertina del fascicolo di parte. Nel testo compaiono solo ufficio, R.G., giudice, oggetto, ruolo e nomi di parti e controparti: gli altri dati vengono solo controllati.",
  gruppi: [
    {
      titolo: "Procedimento",
      campi: [
        { tipo: "scelta", key: "competenza", label: "Competenza", default: "tribunale", opzioni: competenze("consiglio_stato") },
        testo("ufficio_giudiziario", "Luogo", { mostraSe: serveLuogo, obbligatorio: true, aiuto: "Città, senza articolo (la regione per T.A.R. e Corte di giustizia tributaria di secondo grado)." }),
        testo("numero_rg", "Numero R.G."),
        testo("giudice", "Giudice"),
        testo("oggetto", "Oggetto", { lungo: true }),
        {
          tipo: "scelta", key: "ruolo_parti", label: "Ruolo delle parti assistite", default: "", opzioni: [
            { value: "", label: "Non indicato (come convenuto)" }, { value: "attore", label: "Attore" }, { value: "convenuto", label: "Convenuto" },
          ],
        },
      ],
    },
    { titolo: "Parti", campi: [{ tipo: "lista", key: "parti", label: "Parti assistite", etichettaAggiungi: "Aggiungi una parte", nomeVoce: "parte", min: 1, max: 64, campi: campiParteFascicolo() }] },
    {
      titolo: "Avvocati",
      campi: [{
        tipo: "lista", key: "avvocati", label: "Avvocati", etichettaAggiungi: "Aggiungi un avvocato", nomeVoce: "avvocato", min: 1, max: 16,
        campi: [
          { tipo: "testo", key: "nome", label: "Nome", obbligatorio: true },
          { tipo: "bool", key: "domicilio_eletto", label: "Domicilio eletto" },
          { tipo: "bool", key: "autentica_firme", label: "Autentica delle firme" },
          { tipo: "testo", key: "indirizzo", label: "Indirizzo" },
          { tipo: "testo", key: "codice_fiscale", label: "Codice fiscale" },
          { tipo: "testo", key: "fax", label: "Fax" },
          { tipo: "testo", key: "pec", label: "PEC" },
          { tipo: "testo", key: "ordine", label: "Ordine degli avvocati di" },
        ],
      }],
    },
    {
      titolo: "Controparti",
      campi: [{
        tipo: "lista", key: "controparti", label: "Controparti", etichettaAggiungi: "Aggiungi una controparte", nomeVoce: "controparte", min: 1, max: 64,
        campi: [
          ...campiParteFascicolo(),
          { tipo: "testo", key: "pec", label: "PEC" },
          { tipo: "scelta", key: "provenienza_pec", label: "Provenienza della PEC", default: "", opzioni: PROVENIENZA_PEC_FACOLTATIVA },
          { tipo: "testo", key: "avvocato", label: "Avvocato" },
          { tipo: "testo", key: "avvocato_indirizzo", label: "Indirizzo dell'avvocato" },
          { tipo: "testo", key: "avvocato_pec", label: "PEC dell'avvocato" },
          { tipo: "scelta", key: "avvocato_provenienza_pec", label: "Provenienza della PEC dell'avvocato", default: "", opzioni: PROVENIENZA_PEC_FACOLTATIVA },
        ],
      }],
    },
  ],
};

// ---- 4. Indice allegati ----
const INDICE: ModelloAtto = {
  id: "indice-allegati",
  titolo: "Indice Allegati",
  endpoint: "/atti-modello/indice-allegati",
  introduzione: "Le voci restano nell'ordine in cui le inserisci. Se lasci vuoto «Nome nell'Indice» lo ricava dal nome del file.",
  gruppi: [
    {
      campi: [
        {
          tipo: "scelta", key: "numerazione", label: "Numerazione", default: "numeri", opzioni: [
            { value: "nessuna", label: "Nessuna (elenco puntato)" }, { value: "numeri", label: "Numeri (1, 2, 3…)" },
            { value: "lettere_minuscole", label: "Lettere minuscole (a, b, c…)" }, { value: "lettere_maiuscole", label: "Lettere maiuscole (A, B, C…)" },
            { value: "romani_minuscoli", label: "Numeri romani minuscoli (i, ii, iii…)" }, { value: "romani_maiuscoli", label: "Numeri romani maiuscoli (I, II, III…)" },
          ],
        },
        {
          tipo: "lista", key: "allegati", label: "Allegati", etichettaAggiungi: "Aggiungi un allegato", nomeVoce: "allegato", min: 1, max: 128,
          campi: [
            { tipo: "testo", key: "nome_file", label: "Nome del file" },
            { tipo: "testo", key: "nome_indice", label: "Nome nell'Indice", nota: () => "Al massimo 80 caratteri." },
          ],
        },
      ],
    },
  ],
};

// ---- 5. Lettera di adeguamento del canone ----
const MESI = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];
const mesePrecedente = () => String(new Date().getMonth() === 0 ? 12 : new Date().getMonth());
const LETTERA: ModelloAtto = {
  id: "lettera-adeguamento-canone",
  titolo: "Lettera Adeguamento Canone Locazione",
  endpoint: "/atti-modello/lettera-adeguamento-canone",
  gruppi: [
    {
      titolo: "Invio",
      campi: [
        {
          tipo: "scelta", key: "invio", label: "Invio", default: "raccomandata", opzioni: [
            { value: "posta_ordinaria", label: "Posta ordinaria" }, { value: "raccomandata", label: "Raccomandata A.R." }, { value: "email_pec", label: "Email / PEC" },
          ],
        },
      ],
    },
    {
      titolo: "Locatore",
      campi: [
        testo("locatore_nome", "Nome del locatore"),
        testo("locatore_indirizzo", "Indirizzo del locatore", { lungo: true }),
      ],
    },
    {
      titolo: "Conduttore",
      campi: [
        {
          tipo: "scelta", key: "conduttore_titolo", label: "Titolo del conduttore", default: "", opzioni: [
            { value: "", label: "Nessuno" }, { value: "spett_le", label: "Spett.le" }, { value: "egr_sig", label: "Egr. Sig." }, { value: "gent_sig_ra", label: "Gent. Sig.ra" },
            { value: "gent_ma_sig_ra", label: "Gent.ma Sig.ra" }, { value: "egr_dott", label: "Egr. Dott." }, { value: "gent_ma_dott_ssa", label: "Gent.ma Dott.ssa" },
            { value: "sig", label: "Sig." }, { value: "sig_ra", label: "Sig.ra" }, { value: "dott", label: "Dott." }, { value: "dott_ssa", label: "Dott.ssa" },
          ],
        },
        testo("conduttore_nome", "Nome e cognome del conduttore", { obbligatorio: true }),
        testo("conduttore_indirizzo", "Indirizzo del conduttore", { lungo: true, obbligatorio: true, mostraSe: (f) => f.invio !== "email_pec" }),
        testo("conduttore_email", "Indirizzo email o PEC del conduttore", { obbligatorio: true, mostraSe: (f) => f.invio === "email_pec", tastiera: "email-address" }),
        bool("stesso_indirizzo", "L'immobile è all'indirizzo del conduttore", true, { mostraSe: (f) => f.invio !== "email_pec", valoreSeNascosto: false }),
        testo("indirizzo_immobile", "Indirizzo dell'immobile", { obbligatorio: true, mostraSe: (f) => f.invio === "email_pec" || !f.stesso_indirizzo }),
      ],
    },
    {
      titolo: "Adeguamento",
      campi: [
        testo("canone", "Canone mensile (€)", { obbligatorio: true, aiuto: "Es. 500,00 oppure 1.234,56." }),
        {
          tipo: "scelta", key: "mese_indice", label: "Mese dell'indice ISTAT", default: mesePrecedente(), invio: "numero",
          opzioni: MESI.map((m, i) => ({ value: String(i + 1), label: m })),
        },
        { tipo: "numero", key: "anno_indice", label: "Anno dell'indice ISTAT", invio: "intero", aiuto: "Se lasci vuoto si usano i dodici mesi che finiscono il mese prima della data." },
        {
          tipo: "scelta", key: "rivaluta_al", label: "Rivalutazione", default: "75", opzioni: [{ value: "75", label: "Al 75% della variazione ISTAT" }, { value: "100", label: "Al 100% della variazione ISTAT" }],
        },
        { tipo: "numero", key: "altra_percentuale", label: "Altra percentuale (%)", aiuto: "Se la indichi sostituisce 75% o 100%." },
        { tipo: "data", key: "data_decorrenza", label: "Data di decorrenza", aiuto: "Se lasci vuoto la lettera dice «a decorrere dal mese prossimo»." },
        testo("tassa_registro", "Imposta di registro (€)", { aiuto: "Facoltativa: se indicata la lettera riporta la quota a carico del conduttore (50%)." }),
        testo("luogo", "Luogo"),
        { tipo: "data", key: "data", label: "Data", vuotaOggi: true, aiuto: "Se lasci vuoto vale oggi." },
      ],
    },
  ],
};

// ---- 6. Modelli di notula (per ora solo «Decreto Ingiuntivo») ----
const VOCI_DECRETO_INGIUNTIVO: Opzione[] = [
  { value: "1", label: "1 · Posizione e archivio" },
  { value: "2", label: "2 · Disamina" },
  { value: "6", label: "6 · Autentica di ogni firma" },
  { value: "7", label: "7 · Esame procura notarile" },
  { value: "8", label: "8 · Versamento contributo unificato" },
  { value: "9", label: "9 · Iscrizione della causa a ruolo" },
  { value: "15.2", label: "15.2 · Esame decreto" },
  { value: "18", label: "18 · Formazione del fascicolo" },
  { value: "21", label: "21 · Consultazione con il cliente" },
  { value: "22", label: "22 · Corrispondenza informativa" },
  { value: "30", label: "30 · Richiesta alla cancelleria di copia di atti" },
  { value: "31.2", label: "31.2 · Deposito documenti in cancelleria" },
  { value: "40", label: "40 · Redazione nota spese giudiziale" },
  { value: "45.1", label: "45.1 · Accesso agli uffici" },
  { value: "45.2", label: "45.2 · Ritiro atto" },
  { value: "80.1", label: "80.1 · Diritti di collazione per dattilografia" },
  { value: "80.2", label: "80.2 · Diritti di collazione per stampa" },
  { value: "51", label: "51 · Procedimento di ingiunzione (onorari)" },
];
const TARIFFE: Opzione[] = [
  { value: "minima", label: "Minima" }, { value: "media", label: "Media" }, { value: "massima", label: "Massima" }, { value: "specificata", label: "Specificata" },
];
const NOTULA: ModelloAtto = {
  id: "modelli-notula",
  titolo: "Modelli di Notula",
  endpoint: "/atti-modello/modelli-notula",
  introduzione: "Il modello usa le tariffe forensi del 2004 (D.M. 127/2004), come il modulo di riferimento: dal 2014 i compensi si calcolano con i parametri del D.M. 55/2014.",
  gruppi: [
    {
      titolo: "Modello e valore",
      campi: [
        { tipo: "scelta", key: "modello", label: "Modello", default: "decreto_ingiuntivo", opzioni: [{ value: "decreto_ingiuntivo", label: "Decreto Ingiuntivo" }] },
        {
          tipo: "scelta", key: "valore_tipo", label: "Valore della causa", default: "specificato", opzioni: [
            { value: "specificato", label: "Specificato" }, { value: "indeterminabile", label: "Indeterminabile" }, { value: "indeterminabile_importanza", label: "Indeterminabile di particolare importanza" },
          ],
        },
        { tipo: "numero", key: "valore_causa", label: "Importo del valore della causa (€)", invio: "numero", obbligatorio: true, mostraSe: (f) => f.valore_tipo === "specificato" },
        { tipo: "scelta", key: "tariffa_predefinita", label: "Tariffa", default: "media", opzioni: TARIFFE },
      ],
    },
    {
      titolo: "Attività",
      campi: [
        { tipo: "bool", key: "tutte_le_voci", label: "Usa tutte le voci del modello (Seleziona tutte)", default: true, soloSchermo: true },
        {
          tipo: "lista", key: "attivita", label: "Voci da includere", etichettaAggiungi: "Aggiungi una voce", nomeVoce: "voce", min: 1,
          mostraSe: (f) => !f.tutte_le_voci,
          campi: [
            { tipo: "scelta", key: "codice", label: "Voce", default: "1", opzioni: VOCI_DECRETO_INGIUNTIVO },
            { tipo: "numero", key: "quantita", label: "Quantità", default: "1", invio: "intero" },
            {
              tipo: "scelta", key: "tariffa", label: "Tariffa della voce", default: "", omettiSeVuoto: true,
              opzioni: [{ value: "", label: "Come la tariffa predefinita" }, ...TARIFFE],
            },
            {
              tipo: "numero", key: "valore", label: "Importo della tariffa specificata (€)", invio: "numero",
              mostraSe: (r, f) => r.tariffa === "specificata" || (!r.tariffa && f.tariffa_predefinita === "specificata"),
            },
            { tipo: "numero", key: "spese_esenti", label: "Spese esenti (€)", invio: "numero", mostraSe: (r) => r.codice !== "51" },
            { tipo: "numero", key: "spese_imponibili", label: "Spese imponibili (€)", invio: "numero", mostraSe: (r) => r.codice !== "51" },
          ] as CampoRigaLista[],
        },
      ],
    },
    {
      titolo: "Spese, ritenuta e regime",
      campi: [
        bool("spese_generali", "Spese generali", true),
        { tipo: "numero", key: "spese_generali_pct", label: "Percentuale spese generali (%)", invio: "numero", default: "15", mostraSe: (f) => !!f.spese_generali, aiuto: "Al massimo 20%." },
        bool("ritenuta", "Ritenuta d'acconto", true),
        {
          tipo: "scelta", key: "regime", label: "Regime fiscale", default: "0", invio: "numero", opzioni: [
            { value: "0", label: "Ordinario" }, { value: "1", label: "Forfettario agevolato 2014" }, { value: "2", label: "Contribuenti in regime di vantaggio 2011" }, { value: "3", label: "Contribuenti minimi 2008" },
          ],
        },
        bool("bollo", "Marca da bollo", false, { mostraSe: (f) => f.regime !== "0" }),
        bool("dettaglio", "Mostra il dettaglio della notula", true, { aiuto: "Se spenta resta solo il riepilogo." }),
        bool("stampa_codici", "Stampa i codici delle voci", false),
        { tipo: "data", key: "data", label: "Data", vuotaOggi: true, aiuto: "Se lasci vuoto vale oggi." },
      ],
    },
  ],
};

// ---- 7. Note di trattazione scritta ----
const NOTE_TRATTAZIONE: ModelloAtto = {
  id: "note-trattazione-scritta",
  titolo: "Note di Trattazione Scritta",
  endpoint: "/atti-modello/note-trattazione-scritta",
  gruppi: [
    {
      titolo: "Procedimento",
      campi: [
        { tipo: "scelta", key: "competenza", label: "Competenza", default: "tribunale", opzioni: competenze("consiglio_di_stato") },
        testo("ufficio_giudiziario", "Luogo", { mostraSe: serveLuogo, obbligatorio: true, aiuto: "Città, senza articolo." }),
        testo("numero_rg", "Numero R.G.", { obbligatorio: true }),
        { tipo: "data", key: "data_udienza", label: "Data dell'udienza", obbligatorio: true },
        testo("giudice", "Giudice"),
        testo("oggetto", "Oggetto", { lungo: true }),
        {
          tipo: "scelta", key: "ruolo_parti", label: "Ruolo delle parti assistite", default: "", opzioni: [
            { value: "", label: "Non indicato (come convenuto)" }, { value: "ricorrente", label: "Ricorrente" }, { value: "convenuto", label: "Convenuto" },
          ],
        },
      ],
    },
    {
      titolo: "Parti",
      campi: [
        { tipo: "lista", key: "parti", label: "Parti assistite", etichettaAggiungi: "Aggiungi una parte", nomeVoce: "parte", min: 1, max: 20, comeTesti: true, campi: [{ tipo: "testo", key: "nome", label: "Nome della parte", obbligatorio: true }] },
        { tipo: "lista", key: "avvocati", label: "Avvocati", etichettaAggiungi: "Aggiungi un avvocato", nomeVoce: "avvocato", min: 1, max: 20, comeTesti: true, campi: [{ tipo: "testo", key: "nome", label: "Nome dell'avvocato", obbligatorio: true }] },
        {
          tipo: "lista", key: "controparti", label: "Controparti", etichettaAggiungi: "Aggiungi una controparte", nomeVoce: "controparte", min: 1, max: 20,
          campi: [{ tipo: "testo", key: "nome", label: "Nome della controparte", obbligatorio: true }, { tipo: "testo", key: "avvocato", label: "Avvocato della controparte" }],
        },
      ],
    },
    {
      titolo: "Note",
      campi: [
        testo("note", "Note", { lungo: true, aiuto: "Testo semplice: un a capo è un nuovo paragrafo." }),
        testo("luogo", "Luogo in calce", { aiuto: "Facoltativo." }),
        { tipo: "data", key: "data", label: "Data in calce", vuotaOggi: true, aiuto: "Se lasci vuoto vale oggi." },
      ],
    },
  ],
};

// ---- 8. Nota di precisazione del credito ----
const importo = (key: string, label: string, extra: { obbligatorio?: boolean; aiuto?: string; mostraSe?: CampoModello["mostraSe"] } = {}): CampoModello => testo(key, label, extra);
const PRECISAZIONE: ModelloAtto = {
  id: "nota-precisazione-credito",
  titolo: "Nota di Precisazione del Credito",
  endpoint: "/atti-modello/nota-precisazione-credito",
  gruppi: [
    {
      titolo: "Avvocato e procedura",
      campi: [
        testo("avvocato", "Avvocato", { obbligatorio: true }),
        testo("indirizzo_studio", "Indirizzo dello studio"),
        testo("luogo", "Luogo", { obbligatorio: true }),
        { tipo: "data", key: "data", label: "Data", vuotaOggi: true, aiuto: "Data finale del calcolo degli interessi. Se lasci vuoto vale oggi." },
        testo("tribunale", "Tribunale", { obbligatorio: true, aiuto: "Richiesto ma non compare nel testo." }),
        {
          tipo: "scelta", key: "pignoramento", label: "Pignoramento", default: "mobiliare", opzioni: [
            { value: "mobiliare", label: "Mobiliare" }, { value: "presso_terzi", label: "Presso terzi" }, { value: "immobiliare", label: "Immobiliare" },
          ],
        },
        testo("numero_rge", "Numero R.G.E.", { obbligatorio: true }),
        testo("creditori", "Creditori", { lungo: true, obbligatorio: true, aiuto: "Un nominativo per riga." }),
        testo("debitore", "Debitore", { lungo: true, obbligatorio: true, aiuto: "Un nominativo per riga." }),
        testo("terzi_pignorati", "Terzi pignorati", { lungo: true, obbligatorio: true, mostraSe: (f) => f.pignoramento === "presso_terzi", aiuto: "Un nominativo per riga." }),
      ],
    },
    {
      titolo: "Credito",
      campi: [
        { tipo: "data", key: "data_precetto", label: "Data del precetto", obbligatorio: true },
        importo("importo_precetto", "Importo del precetto (€)", { obbligatorio: true }),
        {
          tipo: "scelta", key: "interessi", label: "Interessi", default: "nessuno", opzioni: [
            { value: "nessuno", label: "Nessuno" }, { value: "legale", label: "Al tasso legale" }, { value: "moratori", label: "Moratori" },
          ],
        },
        importo("acconti", "Acconti ricevuti (€)", { aiuto: "Si sottraggono dal credito prima degli interessi." }),
      ],
    },
    {
      titolo: "Compenso e spese",
      campi: [
        importo("compenso", "Compenso (€)", { aiuto: "Se lasci vuoto si usa la tariffa media per il tipo di pignoramento." }),
        bool("istanza_492bis", "Istanza ex art. 492-bis c.p.c."),
        importo("importo_istanza_492bis", "Compenso per l'istanza (€)", { mostraSe: (f) => !!f.istanza_492bis }),
        bool("spese_generali", "Spese generali", true),
        testo("percentuale_spese_generali", "Percentuale spese generali (%)", { default: "15", mostraSe: (f) => !!f.spese_generali, aiuto: "Tra 0 (escluso) e 100." }),
        {
          tipo: "lista", key: "spese", label: "Anticipazioni e spese", etichettaAggiungi: "Aggiungi una spesa", nomeVoce: "spesa", max: 20,
          righeIniziali: [
            { descrizione: "Diritti per iscrizione pignoramento", importo: "27,00" },
            { descrizione: "Contributo unificato", importo: "" },
            { descrizione: "Notifica precetto", importo: "" },
          ],
          campi: [{ tipo: "testo", key: "descrizione", label: "Descrizione" }, { tipo: "testo", key: "importo", label: "Importo (€)" }],
        },
        bool("accessori_di_legge", "Accessori di legge (CPA)", true),
        bool("iva", "IVA", true),
        bool("cassa", "Cassa avvocati", true),
      ],
    },
  ],
};

export const MODELLI_ATTI: Record<string, ModelloAtto> = Object.fromEntries(
  [ATTESTAZIONE, RELATA, FASCICOLO, INDICE, LETTERA, NOTULA, NOTE_TRATTAZIONE, PRECISAZIONE].map((m) => [m.id, m]),
);
export type ModelloAttoId = string;
