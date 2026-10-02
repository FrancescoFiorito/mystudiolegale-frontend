
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
import SwipeBackScreen from "@/src/components/SwipeBackScreen";
import { sincronizzaSeConnesso } from "@/src/utils/calendarioDispositivo";

type CalcId =
  | "scadenze" | "parcelle"
  | "termini-memorie" | "interessi-legali" | "interessi-mora" | "contributo-unificato"
  | "rivalutazione-istat" | "imposta-successione" | "compenso-ctu";

// Hub unico per tutti i calcolatori: sostituisce i vecchi pulsanti separati
// "Aggiungi scadenza" e "Crea parcella" sparsi per l'app (Dashboard,
// Archivio, scheda pratica). Scadenze Processuali e Parcelle restano le
// voci "storiche" (form a pagina intera, invariati nella logica); gli
// altri sono i nuovi calcolatori legali aggiunti dopo aver studiato
// avvocatoandreani.it.
const CALCOLATORI: { id: CalcId; titolo: string; sottotitolo: string; icona: string }[] = [
  { id: "scadenze", titolo: "Scadenze Processuali", sottotitolo: "Calcolo termini a partire da una data", icona: "clock" },
  { id: "parcelle", titolo: "Parcelle", sottotitolo: "Compensi, spese, CPA, IVA", icona: "dollar-sign" },
  { id: "termini-memorie", titolo: "Termini memorie ex art. 171-ter c.p.c.", sottotitolo: "Riforma Cartabia, da una data di udienza", icona: "calendar" },
  { id: "interessi-legali", titolo: "Interessi legali", sottotitolo: "Art. 1284 c.c.", icona: "percent" },
  { id: "interessi-mora", titolo: "Interessi di mora", sottotitolo: "D.Lgs. 231/2002, transazioni commerciali", icona: "alert-circle" },
  { id: "contributo-unificato", titolo: "Contributo unificato", sottotitolo: "Processo civile, per valore causa", icona: "file-text" },
  { id: "rivalutazione-istat", titolo: "Rivalutazione ISTAT", sottotitolo: "Capitale rivalutato tra due indici", icona: "trending-up" },
  { id: "imposta-successione", titolo: "Imposta di successione", sottotitolo: "Aliquote e franchigie per grado di parentela", icona: "home" },
  { id: "compenso-ctu", titolo: "Compenso CTU", sottotitolo: "A vacazioni, DPR 115/2002", icona: "briefcase" },
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
  const [risScad, setRisScad] = React.useState<any>(null);
  const [titoloScad, setTitoloScad] = React.useState("");
  const [oraScad, setOraScad] = React.useState<string | null>(null);
  const [promemoria, setPromemoria] = React.useState<number[]>([1]);
  const [pratiche, setPratiche] = React.useState<any[]>([]);
  const [praticaId, setPraticaId] = React.useState<string | null>(params.praticaId || null);
  // Parcelle
  const [par, setPar] = React.useState<any>({ fase_studio: "", fase_introduttiva: "", fase_istruttoria: "", fase_decisionale: "", fase_esecutiva: "", diritti: "", anticipazioni: "", spese_generali_pct: "15", cpa_pct: "4", iva_pct: "22", ritenuta_pct: "0" });
  const [risPar, setRisPar] = React.useState<any>(null);
  const [titoloPar, setTitoloPar] = React.useState("");
  const [saving, setSaving] = React.useState(false);
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

  React.useEffect(() => { api.get("/pratiche").then(setPratiche).catch(() => {}); }, []);

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
        anticipazioni: String(doc.anticipazioni ?? 0),
        spese_generali_pct: String(doc.spese_generali_pct ?? 15),
        cpa_pct: String(doc.cpa_pct ?? 4),
        iva_pct: String(doc.iva_pct ?? 22),
        ritenuta_pct: String(doc.ritenuta_pct ?? 0),
      });
      setTitoloPar(doc.titolo || "");
      setPraticaId(doc.pratica_id || null);
      setRisPar(doc.calcolo || null);
    }).catch(() => {});
  }, [params.editId, params._t]);

  const calcScad = async () => {
    Keyboard.dismiss();
    try {
      const r = await api.post("/calc/scadenza", { data_partenza: dataPartenza, giorni: Number(giorni), tipo: tipoS, unita, escludi_feriale: escludiFer });
      setRisScad(r);
      setTitoloScad("");
    } catch (e: any) { setRisScad({ error: e.message }); }
  };
  const calcPar = async () => {
    const body: any = {};
    Object.entries(par).forEach(([k, v]) => body[k] = Number(v) || 0);
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
      await api.post("/scadenze", { pratica_id: praticaId, titolo: titoloScad.trim(), data: risScad.data_calcolata, ora: oraScad || null, categoria: "generale", priorita: "media", promemoria, descrizione: `Partenza: ${dataPartenza}, ${tipoS}` });
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
      const body: any = { tipo: "parcella", pratica_id: praticaId, titolo: titoloPar.trim() };
      Object.entries(par).forEach(([k, v]) => body[k] = Number(v) || 0);
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
      const body: any = { capitale: Number(tassiCapitale) || 0, data_inizio: tassiDataInizio, data_fine: tassiDataFine };
      if (tipo === "interessi-mora") body.maggiorazione_pct = Number(tassiMaggiorazione) || 8;
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
      const r = await api.post("/calc/contributo-unificato", { valore_causa: Number(cuValoreCausa) || 0 });
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
      const r = await api.post("/calc/rivalutazione-istat", { capitale: Number(istatCapitale) || 0, indice_iniziale: Number(istatIndiceIniziale) || 0, indice_finale: Number(istatIndiceFinale) || 0 });
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
      const r = await api.post("/calc/termini-memorie", { data_udienza: memUdienza, escludi_feriale: memEscludiFer });
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
      const voci = [
        { titolo: "1ª memoria ex art. 171-ter c.p.c. (istanze/produzioni)", data: risMem.prima_memoria },
        { titolo: "2ª memoria ex art. 171-ter c.p.c. (repliche/mezzi di prova)", data: risMem.seconda_memoria },
        { titolo: "3ª memoria ex art. 171-ter c.p.c. (sole repliche)", data: risMem.terza_memoria },
      ];
      for (const v of voci) {
        await api.post("/scadenze", { pratica_id: praticaId, titolo: v.titolo, data: v.data, ora: null, categoria: "deposito", priorita: "media", promemoria: [1], descrizione: `Udienza del ${risMem.data_udienza}` });
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
      const r = await api.post("/calc/imposta-successione", { valore_quota: Number(succValoreQuota) || 0, grado_parentela: succGrado, disabile_grave: succDisabile });
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
      const r = await api.post("/calc/compenso-ctu", { vacazioni: Number(ctuVacazioni) || 0, tariffa_oraria: Number(ctuTariffa) || 0, spese_rimborso: Number(ctuSpese) || 0, maggiorazione_pct: Number(ctuMaggiorazione) || 0 });
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
    setRisMem(null); setMemUdienza(new Date().toISOString().slice(0, 10)); setMemEscludiFer(true);
    setRisSucc(null); setSuccValoreQuota(""); setSuccGrado("coniuge_parenti_retta"); setSuccDisabile(false);
    setRisCtu(null); setCtuVacazioni(""); setCtuTariffa(""); setCtuSpese("0"); setCtuMaggiorazione("0"); setTitoloCtu("Compenso CTU");
  };

  const calcolatoreCorrente = CALCOLATORI.find((c) => c.id === calcAperto);
  const headerTitle = locked ? "Modifica parcella" : calcolatoreCorrente ? calcolatoreCorrente.titolo : "Calcolatori";

  // Contenuto del calcolatore "Scadenze Processuali": invariato nella
  // logica, solo spostato in una funzione cosi' da poterlo renderizzare
  // sia nel caso "locked" sia dentro l'overlay aperto dal picker.
  const contenutoScadenze = (
    <View>
      <Text style={[st.lbl, { color: t.onSurfaceSecondary }]}>Data di partenza (YYYY-MM-DD)</Text>
      <TextInput testID="scad-data" value={dataPartenza} onChangeText={setDataPartenza} style={[st.input, { backgroundColor: t.surfaceSecondary, color: t.onSurface, borderColor: t.border }]} />
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
      <Pressable testID="btn-calc-scad" onPress={calcScad} style={[st.submit, { backgroundColor: t.brand }]}>
        <Text style={{ color: t.onBrand, fontWeight: "700" }}>Calcola</Text>
      </Pressable>
      {risScad ? (
        <View style={[st.result, { backgroundColor: t.brandSecondary, borderColor: t.brand }]}>
          {risScad.error ? <Text style={{ color: t.error }}>{risScad.error}</Text> : (
            <>
              <Text style={{ color: t.onBrandSecondary, fontSize: 12, fontWeight: "700" }}>DATA CALCOLATA</Text>
              <Text testID="scad-result" style={{ color: t.onBrandSecondary, fontSize: 26, fontWeight: "800", fontVariant: ["tabular-nums"] }}>{risScad.data_calcolata}</Text>
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

  const contenutoParcelle = (
    <View>
      {[
        ["fase_studio", "Fase studio €"],
        ["fase_introduttiva", "Fase introduttiva €"],
        ["fase_istruttoria", "Fase istruttoria €"],
        ["fase_decisionale", "Fase decisionale €"],
        ["fase_esecutiva", "Fase esecutiva €"],
        ["diritti", "Diritti €"],
        ["anticipazioni", "Anticipazioni (esenti) €"],
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
      <Pressable testID="btn-calc-par" onPress={calcPar} style={[st.submit, { backgroundColor: t.brand }]}>
        <Text style={{ color: t.onBrand, fontWeight: "700" }}>Calcola</Text>
      </Pressable>
      {risPar ? (
        <View style={[st.result, { backgroundColor: t.surfaceSecondary, borderColor: t.border }]}>
          {[
            ["Compensi fasi", risPar.compensi_fasi],
            ["Voci custom", risPar.voci_custom_totale],
            ["Diritti", risPar.diritti],
            ["Spese generali", risPar.spese_generali],
            ["Imp. previdenza", risPar.imponibile_previdenza],
            ["CPA", risPar.cpa],
            ["Imp. IVA", risPar.imponibile_iva],
            ["IVA", risPar.iva],
            ["Anticipazioni", risPar.anticipazioni],
            ["Ritenuta", -Math.abs(risPar.ritenuta_acconto || 0)],
          ].map(([l, v]) => (
            <View key={l as string} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 }}>
              <Text style={{ color: t.onSurfaceSecondary, fontSize: 13 }}>{l}</Text>
              <Text style={{ color: t.onSurface, fontSize: 13, fontVariant: ["tabular-nums"] }}>€ {Number(v).toFixed(2)}</Text>
            </View>
          ))}
          <View style={{ flexDirection: "row", justifyContent: "space-between", paddingTop: SPACING.sm, marginTop: SPACING.sm, borderTopWidth: 1, borderTopColor: t.border }}>
            <Text style={{ color: t.onSurface, fontSize: 15, fontWeight: "800" }}>TOTALE</Text>
            <Text testID="par-totale" style={{ color: t.brand, fontSize: 22, fontWeight: "800", fontVariant: ["tabular-nums"] }}>€ {Number(risPar.totale).toFixed(2)}</Text>
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
              <PraticaPicker
                pratiche={pratiche}
                praticaId={praticaId}
                onChange={setPraticaId}
                helperText={praticaId ? "Comparirà anche nella scheda di quella pratica." : "Comparirà solo qui in Archivio."}
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

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: t.surfaceSecondary }}>
      <Header variant="hero" title="Calcolatori" onBack={() => router.back()} />
      <ScrollView ref={scrollRef} contentContainerStyle={{ padding: SPACING.lg, paddingBottom: SPACING.xxxl + 80 }}>
        {CALCOLATORI.map((c) => (
          <Pressable key={c.id} testID={`calc-${c.id}`} onPress={() => apriCalcolatore(c.id)} style={[st.calcCard, { backgroundColor: t.surface, borderColor: t.border }]}>
            <View style={[st.calcIcon, { backgroundColor: t.brandSecondary }]}>
              <Feather name={c.icona as any} size={18} color={t.brand} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: t.onSurface, fontWeight: "700", fontSize: 14 }}>{c.titolo}</Text>
              <Text style={{ color: t.onSurfaceTertiary, fontSize: 12, marginTop: 2 }}>{c.sottotitolo}</Text>
            </View>
            <Feather name="chevron-right" size={18} color={t.onSurfaceTertiary} />
          </Pressable>
        ))}
      </ScrollView>

      {calcAperto ? (
        <SwipeBackScreen edges={["top"]} style={{ backgroundColor: t.surface }} onDismiss={() => setCalcAperto(null)}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
            <Header variant="hero" title={headerTitle} onBack={() => setCalcAperto(null)} />
            <ScrollView contentContainerStyle={{ padding: SPACING.lg, paddingBottom: SPACING.xxxl }} keyboardShouldPersistTaps="handled">
              {calcAperto === "scadenze" ? contenutoScadenze : null}
              {calcAperto === "parcelle" ? contenutoParcelle : null}

              {calcAperto === "termini-memorie" ? (
                <View>
                  <Text style={[st.lbl, { color: t.onSurfaceSecondary }]}>Data udienza di trattazione (YYYY-MM-DD)</Text>
                  <TextInput testID="mem-udienza" value={memUdienza} onChangeText={setMemUdienza} style={[st.input, { backgroundColor: t.surfaceSecondary, color: t.onSurface, borderColor: t.border }]} />
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
                      <Text style={{ color: t.onBrandSecondary, fontSize: 12, fontWeight: "700" }}>MEMORIE EX ART. 171-TER C.P.C.</Text>
                      <View style={{ marginTop: SPACING.sm, gap: 4 }}>
                        <Text style={{ color: t.onBrandSecondary, fontSize: 13 }}>1ª memoria (-40 gg): <Text style={{ fontWeight: "800" }}>{risMem.prima_memoria}</Text></Text>
                        <Text style={{ color: t.onBrandSecondary, fontSize: 13 }}>2ª memoria (-20 gg): <Text style={{ fontWeight: "800" }}>{risMem.seconda_memoria}</Text></Text>
                        <Text style={{ color: t.onBrandSecondary, fontSize: 13 }}>3ª memoria (-10 gg): <Text style={{ fontWeight: "800" }}>{risMem.terza_memoria}</Text></Text>
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
                  <Text style={[st.lbl, { color: t.onSurfaceSecondary }]}>Dal (YYYY-MM-DD)</Text>
                  <TextInput testID="tassi-data-inizio" value={tassiDataInizio} onChangeText={setTassiDataInizio} style={[st.input, { backgroundColor: t.surfaceSecondary, color: t.onSurface, borderColor: t.border }]} />
                  <Text style={[st.lbl, { color: t.onSurfaceSecondary }]}>Al (YYYY-MM-DD)</Text>
                  <TextInput testID="tassi-data-fine" value={tassiDataFine} onChangeText={setTassiDataFine} style={[st.input, { backgroundColor: t.surfaceSecondary, color: t.onSurface, borderColor: t.border }]} />
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
                      <Text testID="tassi-result" style={{ color: t.onBrandSecondary, fontSize: 26, fontWeight: "800", fontVariant: ["tabular-nums"] }}>€ {Number(risTassi.interessi).toFixed(2)}</Text>
                      <Text style={{ color: t.onBrandSecondary, marginTop: 4, fontSize: 12 }}>Totale (capitale + interessi): € {Number(risTassi.totale).toFixed(2)}</Text>
                      {(risTassi.dettaglio || []).map((d: any, i: number) => (
                        <View key={i} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 3, marginTop: i === 0 ? SPACING.sm : 0 }}>
                          <Text style={{ color: t.onBrandSecondary, fontSize: 11 }}>{d.dal} → {d.al} ({d.tasso_pct ?? d.tasso_applicato_pct}%)</Text>
                          <Text style={{ color: t.onBrandSecondary, fontSize: 11, fontVariant: ["tabular-nums"] }}>€ {Number(d.interesse).toFixed(2)}</Text>
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
                      <Text testID="cu-result" style={{ color: t.onBrandSecondary, fontSize: 26, fontWeight: "800", fontVariant: ["tabular-nums"] }}>€ {Number(risCu.contributo_unificato).toFixed(2)}</Text>
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
                      <Text testID="istat-result" style={{ color: t.onBrandSecondary, fontSize: 26, fontWeight: "800", fontVariant: ["tabular-nums"] }}>€ {Number(risIstat.capitale_rivalutato).toFixed(2)}</Text>
                      <Text style={{ color: t.onBrandSecondary, marginTop: 4, fontSize: 12 }}>Rivalutazione: € {Number(risIstat.rivalutazione).toFixed(2)}</Text>
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
                      <Text testID="succ-result" style={{ color: t.onBrandSecondary, fontSize: 26, fontWeight: "800", fontVariant: ["tabular-nums"] }}>€ {Number(risSucc.imposta).toFixed(2)}</Text>
                      <Text style={{ color: t.onBrandSecondary, marginTop: 4, fontSize: 12 }}>Franchigia: € {Number(risSucc.franchigia).toLocaleString("it-IT")} · Aliquota: {risSucc.aliquota_pct}% · Imponibile: € {Number(risSucc.imponibile).toFixed(2)}</Text>
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
                      <Text testID="ctu-result" style={{ color: t.onBrandSecondary, fontSize: 26, fontWeight: "800", fontVariant: ["tabular-nums"] }}>€ {Number(risCtu.totale).toFixed(2)}</Text>
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
