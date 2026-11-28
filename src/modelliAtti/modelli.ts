// Descrizione dei modelli di atti disponibili nel menù Calcolatori. I campi, le opzioni e i valori di
// partenza seguono i moduli del backend (`POST /api/atti-modello/<nome>`, vedi docs/modelli-atti.md
// nel repo backend). Per aggiungere un modello basta aggiungere qui la sua descrizione e
// collegarla a una voce del menù.
import type { CampoRigaLista } from "@/src/components/ListaInput";
import { improntaFile } from "@/src/utils/improntaFile";
import { riferimentoTemporale } from "@/src/utils/improntaHash";
import * as DocumentPicker from "expo-document-picker";
import { ORDINI_AVVOCATI } from "@/src/documenti/ordiniAvvocati";
import { oggiIso } from "./corpo";
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

// ---- 6. Modelli di notula (decreto ingiuntivo, precetto, esecuzioni) ----
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
// Voci dei modelli di notula (diritti dal processo di cognizione o di esecuzione; l'onorario in fondo a ciascun elenco).
const voceNotula = (codice: string, etichetta: string): Opzione => ({ value: codice, label: `${codice} · ${etichetta}` });
const VOCI_PRECETTO: Opzione[] = [
  voceNotula("1", "Posizione e archivio"), voceNotula("2", "Disamina"), voceNotula("6", "Autentica di ogni firma"), voceNotula("21", "Consultazione con il cliente"),
  voceNotula("22", "Corrispondenza informativa"), voceNotula("24", "Esame relata di notifica"), voceNotula("30", "Richiesta alla cancelleria di copia di atti"),
  voceNotula("42.1", "Registrazione della sentenza"), voceNotula("42.2", "Registrazione provvedimento giudiziale"), voceNotula("45.1", "Accesso agli uffici"),
  voceNotula("45.2", "Ritiro atto"), voceNotula("46", "Disamina titolo esecutivo"), voceNotula("47.1", "Redazione atto di precetto"),
  voceNotula("48.1", "Notifica titolo esecutivo"), voceNotula("48.2", "Notifica titolo esecutivo a più persone"), voceNotula("48.3", "Notifica precetto"),
  voceNotula("48.4", "Notifica precetto a più persone"), voceNotula("80.1", "Diritti di collazione per dattilografia"), voceNotula("80.2", "Diritti di collazione per stampa"),
  voceNotula("52", "Redazione del precetto (onorari)"),
];
const VOCI_ESECUZIONE_MOBILIARE: Opzione[] = [
  voceNotula("1", "Posizione e archivio"), voceNotula("2", "Disamina"), voceNotula("15.3", "Esame ordinanza"), voceNotula("21", "Consultazione con il cliente"),
  voceNotula("22", "Corrispondenza informativa"), voceNotula("40", "Redazione nota spese giudiziale"), voceNotula("48.5", "Notifica atto di pignoramento"),
  voceNotula("49.2", "Redazione atto di pignoramento autoveicolo"), voceNotula("50", "Esame verbale di pignoramento mobiliare"), voceNotula("52.1", "Intervento nell'esecuzione"),
  voceNotula("61", "Deposito somme"), voceNotula("62", "Domanda di vendita beni pignorati"), voceNotula("63", "Comparizione davanti al giudice dell'esecuzione"),
  voceNotula("68", "Per concorrere alla distribuzione del prezzo"), voceNotula("69", "Formazione progetto di distribuzione amichevole"),
  voceNotula("70", "Esame del progetto di distribuzione"), voceNotula("71", "Discussione progetto di distribuzione"), voceNotula("72", "Approvazione progetto di distribuzione"),
  voceNotula("80.1", "Diritti di collazione per dattilografia"), voceNotula("80.2", "Diritti di collazione per stampa"),
  voceNotula("55.1", "Procedure esecutive mobiliari (onorari)"),
];
const VOCI_ESECUZIONE_IMMOBILIARE: Opzione[] = [
  voceNotula("1", "Posizione e archivio"), voceNotula("2", "Disamina"), voceNotula("6", "Autentica di ogni firma"), voceNotula("8", "Versamento contributo unificato"),
  voceNotula("9", "Iscrizione della causa a ruolo"), voceNotula("15.3", "Esame ordinanza"), voceNotula("18", "Formazione del fascicolo"),
  voceNotula("21", "Consultazione con il cliente"), voceNotula("22", "Corrispondenza informativa"), voceNotula("24", "Esame relata di notifica"),
  voceNotula("31.2", "Deposito documenti in cancelleria"), voceNotula("37.1", "Esame relazione del consulente tecnico"), voceNotula("40", "Redazione nota spese giudiziale"),
  voceNotula("48.5", "Notifica atto di pignoramento"), voceNotula("48.6", "Notifica atto di pignoramento a più persone"),
  voceNotula("49.1", "Redazione atto di pignoramento immobiliare"), voceNotula("52.1", "Intervento nell'esecuzione"), voceNotula("52.3", "Redazione intimazione ad altri creditori"),
  voceNotula("53.2", "Compilazione nota di trascrizione pubblici registri"), voceNotula("55.1", "Esame certificato ipotecario"), voceNotula("55.2", "Esame certificato catastale"),
  voceNotula("56.1", "Richiesta di certificato ipotecario"), voceNotula("56.2", "Richiesta di certificato catastale"), voceNotula("57", "Redazione nota di ispezione ipotecaria"),
  voceNotula("58", "Ispezione catastale"), voceNotula("59", "Richiesta pubblicità di avvisi"), voceNotula("60", "Esame domanda e titoli dei creditori"),
  voceNotula("62", "Domanda di vendita beni pignorati"), voceNotula("63", "Comparizione davanti al giudice dell'esecuzione"), voceNotula("65", "Assistenza all'incanto"),
  voceNotula("68", "Per concorrere alla distribuzione del prezzo"), voceNotula("69", "Formazione progetto di distribuzione amichevole"),
  voceNotula("70", "Esame del progetto di distribuzione"), voceNotula("71", "Discussione progetto di distribuzione"), voceNotula("72", "Approvazione progetto di distribuzione"),
  voceNotula("80.1", "Diritti di collazione per dattilografia"), voceNotula("80.2", "Diritti di collazione per stampa"),
  voceNotula("54", "Procedure esecutive immobiliari (onorari)"),
];
const VOCI_ESECUZIONE_PRESSO_TERZI: Opzione[] = [
  voceNotula("1", "Posizione e archivio"), voceNotula("2", "Disamina"), voceNotula("6", "Autentica di ogni firma"), voceNotula("8", "Versamento contributo unificato"),
  voceNotula("9", "Iscrizione della causa a ruolo"), voceNotula("15.3", "Esame ordinanza"), voceNotula("21", "Consultazione con il cliente"), voceNotula("22", "Corrispondenza informativa"),
  voceNotula("23.1", "Notifica atto"), voceNotula("24", "Esame relata di notifica"), voceNotula("30", "Richiesta alla cancelleria di copia di atti"),
  voceNotula("31.1", "Deposito atti in cancelleria"), voceNotula("40", "Redazione nota spese giudiziale"), voceNotula("42.2", "Registrazione provvedimento giudiziale"),
  voceNotula("45.1", "Accesso agli uffici"), voceNotula("45.2", "Ritiro atto"), voceNotula("47.2", "Redazione atto di pignoramento presso terzi"),
  voceNotula("48.5", "Notifica atto di pignoramento"), voceNotula("48.6", "Notifica atto di pignoramento a più persone"), voceNotula("52.1", "Intervento nell'esecuzione"),
  voceNotula("63", "Comparizione davanti al giudice dell'esecuzione"), voceNotula("68", "Per concorrere alla distribuzione del prezzo"),
  voceNotula("69", "Formazione progetto di distribuzione amichevole"), voceNotula("70", "Esame del progetto di distribuzione"), voceNotula("71", "Discussione progetto di distribuzione"),
  voceNotula("72", "Approvazione progetto di distribuzione"), voceNotula("80.1", "Diritti di collazione per dattilografia"), voceNotula("80.2", "Diritti di collazione per stampa"),
  voceNotula("56.1", "Procedure esecutive presso terzi (onorari)"),
];
const VOCI_NOTULA: Record<string, Opzione[]> = {
  decreto_ingiuntivo: VOCI_DECRETO_INGIUNTIVO, precetto: VOCI_PRECETTO, esecuzione_mobiliare: VOCI_ESECUZIONE_MOBILIARE,
  esecuzione_immobiliare: VOCI_ESECUZIONE_IMMOBILIARE, esecuzione_presso_terzi: VOCI_ESECUZIONE_PRESSO_TERZI,
};
// Codice dell'onorario di ciascun modello: sui diritti «Spese esenti/imponibili» (il codice 55.1 o 56.1 può essere un diritto in un altro modello).
const ONORARIO_NOTULA: Record<string, string> = { decreto_ingiuntivo: "51", precetto: "52", esecuzione_mobiliare: "55.1", esecuzione_immobiliare: "54", esecuzione_presso_terzi: "56.1" };
const nonDecreto = (f: Record<string, any>) => f.modello !== "decreto_ingiuntivo";
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
        {
          tipo: "scelta", key: "modello", label: "Modello", default: "decreto_ingiuntivo", opzioni: [
            { value: "decreto_ingiuntivo", label: "Decreto ingiuntivo" }, { value: "precetto", label: "Precetto" },
            { value: "esecuzione_mobiliare", label: "Esecuzione mobiliare" }, { value: "esecuzione_immobiliare", label: "Esecuzione immobiliare" },
            { value: "esecuzione_presso_terzi", label: "Esecuzione presso terzi" },
          ],
        },
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
            { tipo: "scelta", key: "codice", label: "Voce", default: "1", opzioni: (f: Record<string, any>) => VOCI_NOTULA[f.modello] ?? VOCI_DECRETO_INGIUNTIVO },
            { tipo: "numero", key: "quantita", label: "Quantità", default: "1", invio: "intero" },
            {
              tipo: "scelta", key: "tariffa", label: "Tariffa della voce", default: "", omettiSeVuoto: true,
              opzioni: [{ value: "", label: "Come la tariffa predefinita" }, ...TARIFFE],
            },
            {
              tipo: "numero", key: "valore", label: "Importo della tariffa specificata (€)", invio: "numero",
              mostraSe: (r, f) => r.tariffa === "specificata" || (!r.tariffa && f.tariffa_predefinita === "specificata"),
            },
            { tipo: "numero", key: "spese_esenti", label: "Spese esenti (€)", invio: "numero", mostraSe: (r, f) => r.codice !== ONORARIO_NOTULA[f.modello] },
            { tipo: "numero", key: "spese_imponibili", label: "Spese imponibili (€)", invio: "numero", mostraSe: (r, f) => r.codice !== ONORARIO_NOTULA[f.modello] },
          ] as CampoRigaLista[],
        },
      ],
    },
    {
      titolo: "Capitale e spese",
      mostraSe: nonDecreto,
      campi: [
        { tipo: "numero", key: "capitale", label: "Capitale (€)", invio: "numero", segnaposto: "0", mostraSe: nonDecreto },
        { tipo: "numero", key: "interessi", label: "Interessi (€)", invio: "numero", segnaposto: "0", mostraSe: nonDecreto, aiuto: "Entrano solo nel totale generale." },
        {
          tipo: "numero", key: "spese_liquidate", label: "Spese liquidate (€)", invio: "numero", segnaposto: "0", mostraSe: nonDecreto,
          aiuto: "Nel precetto sono le spese liquidate nel titolo (entrano nella notula). Nelle esecuzioni è «Diritti Onorari e Spese del Precetto»: va solo nel totale generale.",
        },
        { tipo: "numero", key: "spese_liquidate_esenti", label: "Spese liquidate esenti (€)", invio: "numero", segnaposto: "0", mostraSe: nonDecreto },
        { tipo: "numero", key: "spese_liquidate_imponibili", label: "Spese liquidate imponibili (€)", invio: "numero", segnaposto: "0", mostraSe: nonDecreto },
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


// ---- Elementi comuni a dichiarazione 553, atto di precetto e sfratto ----
const NOTIFICA: Opzione[] = [
  { value: "nessuna", label: "Nessuna" }, { value: "unep", label: "UNEP" }, { value: "in_proprio", label: "In proprio (posta)" }, { value: "pec", label: "PEC" },
];
const campiNotifica = (def: string, opzioni: string[] = ["nessuna", "unep", "in_proprio", "pec"]): CampoModello[] => [
  { tipo: "scelta", key: "notifica", label: "Notifica", default: def, opzioni: NOTIFICA.filter((o) => opzioni.includes(o.value)) },
];
const campiInProprio = (): CampoModello[] => [
  testo("autorizzazione", "Estremi dell'autorizzazione", { obbligatorio: true, mostraSe: (f) => f.notifica === "in_proprio" }),
  testo("ufficio_postale", "Ufficio postale", { obbligatorio: true, mostraSe: (f) => f.notifica === "in_proprio" }),
];
const soggetto = (extra: CampoRigaLista[] = [], cfObbligatorio = true): CampoRigaLista[] => [
  { tipo: "testo", key: "nome", label: "Nome", obbligatorio: true },
  { tipo: "bool", key: "persona_giuridica", label: "Persona giuridica" },
  { tipo: "testo", key: "rappresentante_legale", label: "Rappresentante legale", mostraSe: (r) => !!r.persona_giuridica },
  { tipo: "testo", key: "codice_fiscale", label: "Codice fiscale o partita IVA", obbligatorio: cfObbligatorio },
  ...extra,
];
const campiPec = (): CampoRigaLista[] => [
  { tipo: "testo", key: "pec", label: "Indirizzo PEC", obbligatorio: true, mostraSe: (_r, f) => f.notifica === "pec" },
  { tipo: "scelta", key: "provenienza_pec", label: "Provenienza della PEC", default: "inipec", opzioni: PROVENIENZA_PEC, mostraSe: (_r, f) => f.notifica === "pec" },
];
const campiEconomici = (conCompensoPrecetto: boolean): CampoModello[] => [
  testo("compensi_liquidati", "Compensi liquidati (€)", { obbligatorio: !conCompensoPrecetto }),
  testo("spese_esenti", "Spese esenti liquidate (€)"),
  testo("spese_imponibili", "Spese imponibili liquidate (€)"),
  ...(conCompensoPrecetto ? [testo("compenso_precetto", "Compenso per l'atto di precetto (€)", { aiuto: "Se lasci vuoto si usa la tariffa media sul capitale residuo." })] : []),
  bool("spese_generali", "Spese generali", true),
  testo("percentuale_spese_generali", "Percentuale spese generali (%)", { default: "15", mostraSe: (f) => !!f.spese_generali }),
];
const voci = (iniziali: Record<string, string>[]): CampoModello => ({
  tipo: "lista", key: "voci", label: "Altre voci di spesa", etichettaAggiungi: "Aggiungi una voce", nomeVoce: "voce", max: 20, righeIniziali: iniziali,
  campi: [{ tipo: "testo", key: "descrizione", label: "Descrizione" }, { tipo: "testo", key: "esenti", label: "Esenti (€)" }, { tipo: "testo", key: "imponibili", label: "Imponibili (€)" }],
});
const campiIva = (): CampoModello[] => [
  testo("iva", "Aliquota IVA (%)", { default: "22", aiuto: "Se vuota o 0 vale 22." }),
  bool("regime_semplificato", "Regime semplificato (senza riga IVA)"),
];

// ---- 9. Dichiarazione del terzo ex art. 553 c.p.c. ----
const DICHIARAZIONE_553: ModelloAtto = {
  id: "dichiarazione-553",
  titolo: "Dichiarazione 553 cpc",
  endpoint: "/atti-modello/dichiarazione-553",
  gruppi: [
    {
      titolo: "Avvocato",
      campi: [
        { tipo: "scelta", key: "incipit", label: "Incipit", opzioni: INCIPIT },
        testo("avvocato", "Avvocato", { obbligatorio: true }),
        testo("codice_fiscale", "Codice fiscale", { obbligatorio: true }),
        testo("indirizzo_studio", "Indirizzo dello studio", { obbligatorio: true }),
        testo("pec", "PEC dell'avvocato"),
        testo("ordine", "Ordine degli avvocati di", { aiuto: "Se lasci vuoto la formula «iscritto all'albo» non compare." }),
        testo("luogo", "Luogo", { obbligatorio: true }),
        { tipo: "data", key: "data", label: "Data", vuotaOggi: true, aiuto: "Se lasci vuoto vale oggi." },
        ...campiNotifica("pec"),
        ...campiInProprio(),
      ],
    },
    {
      titolo: "Parti",
      campi: [
        { tipo: "lista", key: "parte", label: "Parte assistita", etichettaAggiungi: "", nomeVoce: "parte", min: 1, comeOggetto: true, campi: soggetto() },
        {
          tipo: "lista", key: "terzo", label: "Terzo pignorato", etichettaAggiungi: "", nomeVoce: "terzo", min: 1, comeOggetto: true,
          campi: [
            { tipo: "testo", key: "nome", label: "Nome", obbligatorio: true },
            { tipo: "bool", key: "persona_giuridica", label: "Persona giuridica" },
            { tipo: "testo", key: "rappresentante_legale", label: "Rappresentante legale", mostraSe: (r) => !!r.persona_giuridica },
            { tipo: "testo", key: "residenza", label: "Residenza o sede", obbligatorio: true },
            { tipo: "testo", key: "codice_fiscale", label: "Codice fiscale o partita IVA" },
            ...campiPec(),
          ],
        },
      ],
    },
    {
      titolo: "Procedimento e credito",
      campi: [
        testo("numero_rg", "Numero R.G."),
        testo("ufficio_giudiziario", "Ufficio giudiziario"),
        testo("titolo", "Titolo", { lungo: true, aiuto: "Una riga per ogni titolo." }),
        testo("importo_assegnato", "Importo assegnato (€)", { obbligatorio: true }),
        { tipo: "data", key: "decorrenza_interessi", label: "Decorrenza degli interessi legali", aiuto: "Facoltativa: se indicata compaiono gli interessi fino alla data della dichiarazione." },
        ...campiEconomici(false),
        voci([{ descrizione: "Marca da bollo", esenti: "27,00", imponibili: "" }, { descrizione: "Contributo unificato", esenti: "", imponibili: "" }, { descrizione: "Spese di notifica", esenti: "", imponibili: "" }]),
        ...campiIva(),
      ],
    },
    {
      titolo: "Pagamento",
      campi: [
        {
          tipo: "scelta", key: "modalita_pagamento", label: "Modalità di pagamento", default: "bonifico", opzioni: [
            { value: "bonifico", label: "Bonifico" }, { value: "assegno", label: "Assegno" }, { value: "assegno_circolare", label: "Assegno circolare" }, { value: "contanti", label: "Contanti" },
          ],
        },
        testo("banca", "Banca", { mostraSe: (f) => f.modalita_pagamento === "bonifico" }),
        testo("iban", "IBAN", { obbligatorio: true, mostraSe: (f) => f.modalita_pagamento === "bonifico" }),
        testo("bic", "BIC", { mostraSe: (f) => f.modalita_pagamento === "bonifico" }),
        testo("beneficiario", "Beneficiario"),
      ],
    },
  ],
};

// ---- 10. Atto di precetto ----
const ATTO_PRECETTO: ModelloAtto = {
  id: "atto-precetto",
  titolo: "Atto di Precetto",
  endpoint: "/atti-modello/atto-precetto",
  introduzione: "Il testo cambia con il sesso ricavato dal codice fiscale dei soggetti.",
  gruppi: [
    {
      titolo: "Avvocato",
      campi: [
        testo("avvocato", "Avvocato", { obbligatorio: true }),
        testo("codice_fiscale", "Codice fiscale", { obbligatorio: true }),
        testo("indirizzo_studio", "Indirizzo dello studio", { obbligatorio: true }),
        testo("pec", "PEC", { obbligatorio: true }),
        testo("ordine", "Ordine degli avvocati di", { aiuto: "Se lasci vuoto «del Foro di …» non compare." }),
        testo("tribunale", "Tribunale", { aiuto: "Se lasci vuoto la riga di intestazione non compare." }),
        {
          tipo: "scelta", key: "procura", label: "Procura", default: "calce_atto", opzioni: [
            { value: "calce_atto", label: "In calce all'atto" }, { value: "margine_atto", label: "A margine dell'atto" },
            { value: "calce_introduttivo", label: "In calce all'atto introduttivo" }, { value: "margine_introduttivo", label: "A margine dell'atto introduttivo" },
            { value: "calce_comparsa", label: "In calce alla comparsa" }, { value: "margine_comparsa", label: "A margine della comparsa" },
            { value: "calce_ricorso_di", label: "In calce al ricorso di" }, { value: "margine_ricorso_di", label: "A margine del ricorso di" },
            { value: "notarile", label: "Procura notarile" },
          ],
        },
        testo("estremi_procura_notarile", "Estremi della procura notarile", { mostraSe: (f) => f.procura === "notarile" }),
        testo("luogo", "Luogo", { obbligatorio: true }),
        { tipo: "data", key: "data", label: "Data", vuotaOggi: true, aiuto: "Se lasci vuoto vale oggi." },
        ...campiNotifica("unep"),
        testo("tribunale_notifica", "Tribunale per la notifica UNEP", { mostraSe: (f) => f.notifica === "unep", aiuto: "Non compare nel testo." }),
        ...campiInProprio(),
        bool("altro_domicilio", "Domicilio diverso dallo studio"),
        testo("domicilio", "Domicilio", { obbligatorio: true, mostraSe: (f) => !!f.altro_domicilio }),
      ],
    },
    {
      titolo: "Soggetti",
      campi: [
        { tipo: "lista", key: "parti", label: "Parti istanti", etichettaAggiungi: "Aggiungi una parte", nomeVoce: "parte", min: 1, max: 20, campi: soggetto() },
        {
          tipo: "lista", key: "debitori", label: "Debitori", etichettaAggiungi: "Aggiungi un debitore", nomeVoce: "debitore", min: 1, max: 20,
          campi: soggetto([{ tipo: "testo", key: "residenza", label: "Residenza o sede", obbligatorio: true }, ...campiPec()], false),
        },
      ],
    },
    {
      titolo: "Credito",
      campi: [
        testo("titolo", "Titolo", { lungo: true, aiuto: "Una riga per ogni titolo." }),
        bool("notificato_contestualmente", "Titolo notificato contestualmente", true, { aiuto: "Cambia solo il promemoria." }),
        testo("capitale", "Capitale (€)", { obbligatorio: true }),
        { tipo: "scelta", key: "interessi", label: "Interessi", default: "moratori", opzioni: [{ value: "moratori", label: "Moratori" }, { value: "legale", label: "Al tasso legale" }] },
        { tipo: "data", key: "decorrenza_interessi", label: "Decorrenza degli interessi", obbligatorio: true },
        testo("acconti", "Acconti ricevuti (€)"),
        ...campiEconomici(true),
        voci([]),
        ...campiIva(),
      ],
    },
  ],
};

// ---- 11. Sfratto per morosità ----
const MESI_OPZ: Opzione[] = MESI.map((m, i) => ({ value: String(i + 1), label: m }));
const SFRATTO: ModelloAtto = {
  id: "sfratto-morosita",
  titolo: "Sfratto per Morosità",
  endpoint: "/atti-modello/sfratto-morosita",
  gruppi: [
    {
      titolo: "Avvocato e procedimento",
      campi: [
        testo("avvocato", "Avvocato", { obbligatorio: true }),
        testo("codice_fiscale", "Codice fiscale", { obbligatorio: true }),
        testo("indirizzo_studio", "Indirizzo dello studio"),
        testo("ordine", "Ordine degli avvocati di"),
        testo("tribunale", "Tribunale", { obbligatorio: true }),
        { tipo: "data", key: "data_udienza", label: "Data dell'udienza", aiuto: "Deve essere successiva a oggi. Se lasci vuoto resta «……» da compilare." },
        {
          tipo: "scelta", key: "procura", label: "Procura", default: "calce_atto", opzioni: [
            { value: "calce_atto", label: "In calce all'atto" }, { value: "margine_atto", label: "A margine dell'atto" }, { value: "notarile", label: "Procura notarile" },
          ],
        },
        testo("luogo", "Luogo", { obbligatorio: true }),
        { tipo: "data", key: "data", label: "Data", vuotaOggi: true, aiuto: "Se lasci vuoto vale oggi." },
        ...campiNotifica("unep"),
      ],
    },
    {
      titolo: "Parti",
      campi: [
        { tipo: "lista", key: "ricorrente", label: "Ricorrente", etichettaAggiungi: "", nomeVoce: "ricorrente", min: 1, comeOggetto: true, campi: soggetto() },
        {
          tipo: "lista", key: "conduttore", label: "Conduttore", etichettaAggiungi: "", nomeVoce: "conduttore", min: 1, comeOggetto: true,
          campi: soggetto([{ tipo: "testo", key: "residenza", label: "Residenza o sede", obbligatorio: true }, ...campiPec()], false),
        },
      ],
    },
    {
      titolo: "Immobile e contratto",
      campi: [
        bool("stesso_indirizzo", "L'immobile è all'indirizzo del conduttore", true),
        testo("indirizzo_immobile", "Indirizzo dell'immobile", { obbligatorio: true, mostraSe: (f) => !f.stesso_indirizzo }),
        bool("uso_commerciale", "Uso commerciale (altrimenti abitativo)"),
        { tipo: "data", key: "data_contratto", label: "Data del contratto" },
        testo("luogo_registrazione", "Luogo di registrazione"),
        { tipo: "data", key: "data_registrazione", label: "Data di registrazione" },
        testo("numero_registrazione", "Numero di registrazione"),
      ],
    },
    {
      titolo: "Canoni",
      campi: [
        {
          tipo: "lista", key: "canoni", label: "Canoni non pagati", etichettaAggiungi: "Aggiungi un periodo", nomeVoce: "periodo", min: 1, max: 20,
          campi: [
            { tipo: "scelta", key: "mese_dal", label: "Dal mese", default: "1", invio: "numero", opzioni: MESI_OPZ },
            { tipo: "numero", key: "anno_dal", label: "Dall'anno", invio: "intero", default: String(new Date().getFullYear()) },
            { tipo: "scelta", key: "mese_al", label: "Al mese", default: "0", invio: "numero", opzioni: [{ value: "0", label: "Solo il mese iniziale" }, ...MESI_OPZ] },
            { tipo: "numero", key: "anno_al", label: "All'anno", invio: "intero", mostraSe: (r) => r.mese_al !== "0" },
            { tipo: "testo", key: "importo_mensile", label: "Importo mensile (€)" },
          ] as CampoRigaLista[],
        },
        testo("oneri_condominiali", "Oneri condominiali (€)"),
        testo("premessa", "Premessa", { lungo: true, aiuto: "Una riga per paragrafo." }),
        testo("allegati", "Allegati", { lungo: true, aiuto: "Una riga per documento." }),
      ],
    },
  ],
};

// ---- 12. Ricorso per decreto ingiuntivo (su fattura) ----
// Con un solo avvocato domicilio e autentica delle firme sono impliciti; con più avvocati serve un domiciliatario.
const unAvvocato = (f: Record<string, any>) => (f.avvocati?.length ?? 0) === 1;
const domiciliatario = (r: Record<string, string>, f: Record<string, any>) => unAvvocato(f) || !!r.domicilio_eletto;
const autentica = (r: Record<string, string>, f: Record<string, any>) => domiciliatario(r, f) || !!r.autentica_firme;
const DECRETO_INGIUNTIVO: ModelloAtto = {
  id: "decreto-ingiuntivo",
  titolo: "Decreto Ingiuntivo",
  endpoint: "/atti-modello/decreto-ingiuntivo",
  introduzione: "Genera solo il ricorso per decreto ingiuntivo: il decreto del giudice e la procura alle liti non sono compresi. Gli interessi non vengono calcolati: la scelta serve solo alla formula di rito.",
  gruppi: [
    {
      titolo: "Dati del ricorso",
      campi: [
        { tipo: "scelta", key: "competenza", label: "Competenza", default: "giudice_di_pace", opzioni: [{ value: "giudice_di_pace", label: "Giudice di Pace" }, { value: "tribunale", label: "Tribunale" }], aiuto: "Di norma fino a € 5.000,00 Giudice di Pace, altrimenti Tribunale (non è un controllo)." },
        testo("ufficio_giudiziario", "Di", { obbligatorio: true }),
        {
          tipo: "scelta", key: "procura", label: "Procura alle liti", default: "calce_atto", opzioni: [
            { value: "calce_atto", label: "In calce al presente atto" }, { value: "margine_atto", label: "A margine del presente atto" }, { value: "notarile", label: "Giusta procura notarile" },
          ],
        },
        testo("estremi_procura", "Dati procura", { obbligatorio: true, mostraSe: (f) => f.procura === "notarile", aiuto: "Nome del notaio, n° di repertorio e data." }),
        testo("luogo", "Luogo", { obbligatorio: true }),
        { tipo: "data", key: "data", label: "Data", vuotaOggi: true, aiuto: "Se lasci vuoto vale oggi." },
      ],
    },
    {
      titolo: "Avvocati",
      campi: [
        {
          tipo: "lista", key: "avvocati", label: "Avvocati", etichettaAggiungi: "Aggiungi un avvocato", nomeVoce: "avvocato", min: 1, max: 16,
          righeIniziali: [{ nome: "", domicilio_eletto: "true", autentica_firme: "true", indirizzo: "", codice_fiscale: "", fax: "", pec: "", ordine: "" }],
          campi: [
            { tipo: "testo", key: "nome", label: "Nome e Cognome", obbligatorio: true },
            { tipo: "bool", key: "domicilio_eletto", label: "Eletto domicilio", mostraSe: (_r, f) => !unAvvocato(f), nota: () => "Con più avvocati ne serve esattamente uno." },
            { tipo: "bool", key: "autentica_firme", label: "Autentica firme", mostraSe: (r, f) => !unAvvocato(f) && !r.domicilio_eletto },
            { tipo: "testo", key: "indirizzo", label: "Indirizzo studio", obbligatorio: true, mostraSe: (r, f) => domiciliatario(r, f) },
            { tipo: "testo", key: "codice_fiscale", label: "Codice fiscale" },
            { tipo: "testo", key: "fax", label: "Fax", obbligatorio: true, mostraSe: (r, f) => autentica(r, f) },
            { tipo: "testo", key: "pec", label: "PEC", obbligatorio: true, mostraSe: (r, f) => autentica(r, f) },
            { tipo: "scelta", key: "ordine", label: "Ordine avvocati", default: "", opzioni: [{ value: "", label: "Non indicato" }, ...ORDINI_AVVOCATI.map((o) => ({ value: o, label: o }))] },
          ] as CampoRigaLista[],
        },
      ],
    },
    {
      titolo: "Parti assistite",
      campi: [
        {
          tipo: "lista", key: "parti", label: "Parti assistite", etichettaAggiungi: "Aggiungi una parte", nomeVoce: "parte", min: 1, max: 20,
          campi: [
            { tipo: "testo", key: "nome", label: "Nomin. / Rag. Soc.", obbligatorio: true },
            { tipo: "bool", key: "persona_giuridica", label: "Pers. giuridica" },
            { tipo: "testo", key: "rappresentante_legale", label: "Rappres. Legale", mostraSe: (r) => !!r.persona_giuridica },
            { tipo: "testo", key: "codice_fiscale", label: "CF / P.IVA", obbligatorio: true },
          ] as CampoRigaLista[],
        },
      ],
    },
    {
      titolo: "Debitori",
      campi: [
        {
          tipo: "lista", key: "debitori", label: "Debitori", etichettaAggiungi: "Aggiungi un debitore", nomeVoce: "debitore", min: 1, max: 20,
          campi: [
            { tipo: "testo", key: "nome", label: "Nomin. / Rag. Soc.", obbligatorio: true },
            { tipo: "testo", key: "residenza", label: "Residenza / Sede", obbligatorio: true },
            { tipo: "bool", key: "persona_giuridica", label: "Pers. giuridica" },
            { tipo: "testo", key: "rappresentante_legale", label: "Rappres. Legale", mostraSe: (r) => !!r.persona_giuridica },
            { tipo: "testo", key: "codice_fiscale", label: "CF / P.IVA" },
            { tipo: "testo", key: "pec", label: "PEC" },
            { tipo: "scelta", key: "provenienza_pec", label: "Proveniente da", default: "", opzioni: PROVENIENZA_PEC_FACOLTATIVA, mostraSe: (r) => !!r.pec?.trim() },
          ] as CampoRigaLista[],
        },
      ],
    },
    {
      titolo: "Premesso che",
      campi: [testo("premessa", "Testo libero", { lungo: true, aiuto: "Facoltativo. Il testo segue «Premesso che» nello stesso paragrafo." })],
    },
    {
      titolo: "Fatture e acconti",
      campi: [
        { tipo: "scelta", key: "interessi", label: "Interessi", default: "moratori", opzioni: [{ value: "legale", label: "Al tasso legale" }, { value: "moratori", label: "Moratori" }] },
        {
          tipo: "lista", key: "movimenti", label: "Fatture e acconti", etichettaAggiungi: "Aggiungi un documento", nomeVoce: "documento", min: 1, max: 64,
          campi: [
            { tipo: "scelta", key: "tipo", label: "Documento", default: "fattura", opzioni: [{ value: "fattura", label: "Fattura" }, { value: "acconto", label: "Acconto" }] },
            { tipo: "testo", key: "numero", label: "Numero" },
            { tipo: "data", key: "data", label: "Del", default: oggiIso() },
            { tipo: "testo", key: "importo", label: "Importo", default: "0,00", obbligatorio: true },
            { tipo: "testoLungo", key: "descrizione", label: "Descrizione" },
          ] as CampoRigaLista[],
        },
      ],
    },
    {
      titolo: "Ulteriori spese",
      campi: [
        {
          tipo: "lista", key: "spese", label: "Ulteriori spese", etichettaAggiungi: "Aggiungi una voce di spesa", nomeVoce: "spesa", max: 32,
          campi: [{ tipo: "testo", key: "descrizione", label: "Descrizione voce di spesa" }, { tipo: "testo", key: "importo", label: "Importo €" }] as CampoRigaLista[],
        },
      ],
    },
    {
      titolo: "Allegati al ricorso",
      campi: [testo("allegati", "Elenco allegati", { lungo: true, aiuto: "Una riga per allegato." })],
    },
  ],
};

export const MODELLI_ATTI: Record<string, ModelloAtto> = Object.fromEntries(
  [ATTESTAZIONE, RELATA, FASCICOLO, INDICE, LETTERA, NOTULA, NOTE_TRATTAZIONE, PRECISAZIONE, DICHIARAZIONE_553, ATTO_PRECETTO, SFRATTO, DECRETO_INGIUNTIVO].map((m) => [m.id, m]),
);
export type ModelloAttoId = string;
