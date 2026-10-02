
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

type AltroCalcolatore = "interessi-legali" | "interessi-mora" | "contributo-unificato";

const ALTRI_CALCOLATORI: { id: AltroCalcolatore; titolo: string; sottotitolo: string; icona: string }[] = [
  { id: "interessi-legali", titolo: "Interessi legali", sottotitolo: "Art. 1284 c.c.", icona: "percent" },
  { id: "interessi-mora", titolo: "Interessi di mora", sottotitolo: "D.Lgs. 231/2002, transazioni commerciali", icona: "alert-circle" },
  { id: "contributo-unificato", titolo: "Contributo unificato", sottotitolo: "Processo civile, per valore causa", icona: "file-text" },
];

export default function Calcolatori() {
  const { t } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string; _t?: string; editId?: string }>();
  const locked = params.tab === "parcelle" || params.tab === "scadenze";
  const isEditingPar = params.tab === "parcelle" && !!params.editId;
  const [tab, setTab] = React.useState<"scadenze" | "parcelle" | "altro">(params.tab === "parcelle" ? "parcelle" : "scadenze");
  const scrollRef = React.useRef<ScrollView>(null);

  // La schermata resta montata da una visita all'altra: se si arriva qui di
  // nuovo (anche con lo stesso tab di prima, grazie a params._t che cambia
  // ad ogni click), riparte sempre dalla scheda giusta e dall'inizio dello
  // scroll, invece di restare dov'era stata lasciata l'ultima volta.
  React.useEffect(() => {
    if (params.tab === "parcelle") setTab("parcelle");
    else if (params.tab === "scadenze") setTab("scadenze");
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [params.tab, params._t]);
  const headerTitle = locked ? (tab === "parcelle" ? (isEditingPar ? "Modifica parcella" : "Crea parcella") : "Aggiungi scadenza") : "Calcolatori";
  // Scadenze
  const [dataPartenza, setDataPartenza] = React.useState(new Date().toISOString().slice(0,10));
  const [giorni, setGiorni] = React.useState("30");
  const [tipoS, setTipoS] = React.useState<"avanti" | "ritroso">("avanti");
  const [unita, setUnita] = React.useState<"giorni"|"mesi"|"anni">("giorni");
  const [escludiFer, setEscludiFer] = React.useState(true);
  const [risScad, setRisScad] = React.useState<any>(null);
  const [titoloScad, setTitoloScad] = React.useState("");
  const [oraScad, setOraScad] = React.useState<string | null>(null);
  const [promemoria, setPromemoria] = React.useState<number[]>([1]);
  const [pratiche, setPratiche] = React.useState<any[]>([]);
  const [praticaId, setPraticaId] = React.useState<string | null>(null);
  // Parcelle
  const [par, setPar] = React.useState<any>({ fase_studio: "", fase_introduttiva: "", fase_istruttoria: "", fase_decisionale: "", fase_esecutiva: "", diritti: "", anticipazioni: "", spese_generali_pct: "15", cpa_pct: "4", iva_pct: "22", ritenuta_pct: "0" });
  const [risPar, setRisPar] = React.useState<any>(null);
  const [titoloPar, setTitoloPar] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  // Altri calcolatori (interessi legali/mora, contributo unificato)
  const [altroAperto, setAltroAperto] = React.useState<AltroCalcolatore | null>(null);
  const [altroCapitale, setAltroCapitale] = React.useState("");
  const [altroDataInizio, setAltroDataInizio] = React.useState(new Date().toISOString().slice(0, 10));
  const [altroDataFine, setAltroDataFine] = React.useState(new Date().toISOString().slice(0, 10));
  const [altroMaggiorazione, setAltroMaggiorazione] = React.useState("8");
  const [altroValoreCausa, setAltroValoreCausa] = React.useState("");
  const [risAltro, setRisAltro] = React.useState<any>(null);
  const [calcolandoAltro, setCalcolandoAltro] = React.useState(false);

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

  const apriAltro = (tipo: AltroCalcolatore) => {
    setAltroAperto(tipo);
    setAltroCapitale("");
    setAltroDataInizio(new Date().toISOString().slice(0, 10));
    setAltroDataFine(new Date().toISOString().slice(0, 10));
    setAltroMaggiorazione("8");
    setAltroValoreCausa("");
    setRisAltro(null);
  };

  const calcolaAltro = async () => {
    Keyboard.dismiss();
    setCalcolandoAltro(true);
    setRisAltro(null);
    try {
      let r: any;
      if (altroAperto === "interessi-legali") {
        r = await api.post("/calc/interessi-legali", { capitale: Number(altroCapitale) || 0, data_inizio: altroDataInizio, data_fine: altroDataFine });
      } else if (altroAperto === "interessi-mora") {
        r = await api.post("/calc/interessi-mora", { capitale: Number(altroCapitale) || 0, data_inizio: altroDataInizio, data_fine: altroDataFine, maggiorazione_pct: Number(altroMaggiorazione) || 8 });
      } else if (altroAperto === "contributo-unificato") {
        r = await api.post("/calc/contributo-unificato", { valore_causa: Number(altroValoreCausa) || 0 });
      }
      setRisAltro(r);
    } catch (e: any) {
      Alert.alert("Errore", e.message || "Impossibile calcolare. Riprova.");
    } finally {
      setCalcolandoAltro(false);
    }
  };

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: t.surfaceSecondary }}>
      <Header variant="hero" title={headerTitle} onBack={() => router.back()} />
      {!locked && (
        <View style={{ flexDirection: "row", backgroundColor: t.surface, padding: SPACING.md, gap: 8, borderBottomWidth: 1, borderBottomColor: t.border, marginTop: SPACING.xs }}>
          <Pressable testID="calc-tab-scadenze" onPress={() => setTab("scadenze")} style={[st.tab, { backgroundColor: tab === "scadenze" ? t.brand : t.surfaceSecondary }]}>
            <Feather name="clock" size={16} color={tab === "scadenze" ? t.onBrand : t.onSurfaceSecondary} />
            <Text style={{ color: tab === "scadenze" ? t.onBrand : t.onSurfaceSecondary, fontWeight: "700" }}>Scadenze Processuali</Text>
          </Pressable>
          <Pressable testID="calc-tab-parcelle" onPress={() => setTab("parcelle")} style={[st.tab, { backgroundColor: tab === "parcelle" ? t.brand : t.surfaceSecondary }]}>
            <Feather name="dollar-sign" size={16} color={tab === "parcelle" ? t.onBrand : t.onSurfaceSecondary} />
            <Text style={{ color: tab === "parcelle" ? t.onBrand : t.onSurfaceSecondary, fontWeight: "700" }}>Parcelle</Text>
          </Pressable>
          <Pressable testID="calc-tab-altro" onPress={() => setTab("altro")} style={[st.tab, { backgroundColor: tab === "altro" ? t.brand : t.surfaceSecondary }]}>
            <Feather name="grid" size={16} color={tab === "altro" ? t.onBrand : t.onSurfaceSecondary} />
            <Text style={{ color: tab === "altro" ? t.onBrand : t.onSurfaceSecondary, fontWeight: "700" }}>Altro</Text>
          </Pressable>
        </View>
      )}
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
      <ScrollView ref={scrollRef} contentContainerStyle={{ padding: SPACING.lg, paddingBottom: SPACING.xxxl + 80 }} keyboardShouldPersistTaps="handled">
        {tab === "scadenze" ? (
          <View>
            <Text style={[st.lbl, { color: t.onSurfaceSecondary }]}>Data di partenza (YYYY-MM-DD)</Text>
            <TextInput testID="scad-data" value={dataPartenza} onChangeText={setDataPartenza} style={[st.input, { backgroundColor: t.surfaceSecondary, color: t.onSurface, borderColor: t.border }]} />
            <Text style={[st.lbl, { color: t.onSurfaceSecondary }]}>Termine ({unita})</Text>
            <TextInput testID="scad-giorni" value={giorni} onChangeText={setGiorni} keyboardType="numeric" style={[st.input, { backgroundColor: t.surfaceSecondary, color: t.onSurface, borderColor: t.border }]} />
            <Text style={[st.lbl, { color: t.onSurfaceSecondary }]}>Unità</Text>
            <View style={{ flexDirection: "row", gap: 8, marginBottom: SPACING.sm }}>
              {(["giorni","mesi","anni"] as const).map((u) => (
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
        ) : tab === "parcelle" ? (
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
        ) : (
          <View>
            {ALTRI_CALCOLATORI.map((c) => (
              <Pressable key={c.id} testID={`altro-${c.id}`} onPress={() => apriAltro(c.id)} style={[st.altroCard, { backgroundColor: t.surface, borderColor: t.border }]}>
                <View style={[st.altroIcon, { backgroundColor: t.brandSecondary }]}>
                  <Feather name={c.icona as any} size={18} color={t.brand} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: t.onSurface, fontWeight: "700", fontSize: 14 }}>{c.titolo}</Text>
                  <Text style={{ color: t.onSurfaceTertiary, fontSize: 12, marginTop: 2 }}>{c.sottotitolo}</Text>
                </View>
                <Feather name="chevron-right" size={18} color={t.onSurfaceTertiary} />
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
      </KeyboardAvoidingView>

      {altroAperto ? (
        <SwipeBackScreen edges={["top"]} style={{ backgroundColor: t.surface }} onDismiss={() => setAltroAperto(null)}>
          <Header variant="hero" title={ALTRI_CALCOLATORI.find((c) => c.id === altroAperto)?.titolo || "Calcolatore"} onBack={() => setAltroAperto(null)} />
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={{ padding: SPACING.lg }} keyboardShouldPersistTaps="handled">
              {altroAperto === "contributo-unificato" ? (
                <>
                  <Text style={[st.lbl, { color: t.onSurfaceSecondary }]}>Valore della causa €</Text>
                  <TextInput testID="altro-valore-causa" value={altroValoreCausa} onChangeText={setAltroValoreCausa} keyboardType="numeric" style={[st.input, { backgroundColor: t.surfaceSecondary, color: t.onSurface, borderColor: t.border }]} />
                </>
              ) : (
                <>
                  <Text style={[st.lbl, { color: t.onSurfaceSecondary }]}>Capitale €</Text>
                  <TextInput testID="altro-capitale" value={altroCapitale} onChangeText={setAltroCapitale} keyboardType="numeric" style={[st.input, { backgroundColor: t.surfaceSecondary, color: t.onSurface, borderColor: t.border }]} />
                  <Text style={[st.lbl, { color: t.onSurfaceSecondary }]}>Dal (YYYY-MM-DD)</Text>
                  <TextInput testID="altro-data-inizio" value={altroDataInizio} onChangeText={setAltroDataInizio} style={[st.input, { backgroundColor: t.surfaceSecondary, color: t.onSurface, borderColor: t.border }]} />
                  <Text style={[st.lbl, { color: t.onSurfaceSecondary }]}>Al (YYYY-MM-DD)</Text>
                  <TextInput testID="altro-data-fine" value={altroDataFine} onChangeText={setAltroDataFine} style={[st.input, { backgroundColor: t.surfaceSecondary, color: t.onSurface, borderColor: t.border }]} />
                  {altroAperto === "interessi-mora" ? (
                    <>
                      <Text style={[st.lbl, { color: t.onSurfaceSecondary }]}>Maggiorazione sul tasso BCE % (default 8, art. 5 D.Lgs. 231/2002)</Text>
                      <TextInput testID="altro-maggiorazione" value={altroMaggiorazione} onChangeText={setAltroMaggiorazione} keyboardType="numeric" style={[st.input, { backgroundColor: t.surfaceSecondary, color: t.onSurface, borderColor: t.border }]} />
                    </>
                  ) : null}
                </>
              )}
              <Pressable testID="btn-calc-altro" onPress={calcolaAltro} disabled={calcolandoAltro} style={[st.submit, { backgroundColor: t.brand, opacity: calcolandoAltro ? 0.6 : 1 }]}>
                <Text style={{ color: t.onBrand, fontWeight: "700" }}>{calcolandoAltro ? "Calcolo..." : "Calcola"}</Text>
              </Pressable>
              {risAltro ? (
                <View style={[st.result, { backgroundColor: t.brandSecondary, borderColor: t.brand }]}>
                  {altroAperto === "contributo-unificato" ? (
                    <>
                      <Text style={{ color: t.onBrandSecondary, fontSize: 12, fontWeight: "700" }}>CONTRIBUTO UNIFICATO</Text>
                      <Text testID="altro-result" style={{ color: t.onBrandSecondary, fontSize: 26, fontWeight: "800", fontVariant: ["tabular-nums"] }}>€ {Number(risAltro.contributo_unificato).toFixed(2)}</Text>
                    </>
                  ) : (
                    <>
                      <Text style={{ color: t.onBrandSecondary, fontSize: 12, fontWeight: "700" }}>INTERESSI MATURATI</Text>
                      <Text testID="altro-result" style={{ color: t.onBrandSecondary, fontSize: 26, fontWeight: "800", fontVariant: ["tabular-nums"] }}>€ {Number(risAltro.interessi).toFixed(2)}</Text>
                      <Text style={{ color: t.onBrandSecondary, marginTop: 4, fontSize: 12 }}>Totale (capitale + interessi): € {Number(risAltro.totale).toFixed(2)}</Text>
                      {(risAltro.dettaglio || []).map((d: any, i: number) => (
                        <View key={i} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 3, marginTop: i === 0 ? SPACING.sm : 0 }}>
                          <Text style={{ color: t.onBrandSecondary, fontSize: 11 }}>{d.dal} → {d.al} ({d.tasso_pct ?? d.tasso_applicato_pct}%)</Text>
                          <Text style={{ color: t.onBrandSecondary, fontSize: 11, fontVariant: ["tabular-nums"] }}>€ {Number(d.interesse).toFixed(2)}</Text>
                        </View>
                      ))}
                    </>
                  )}
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
  tab: { flex: 1, flexDirection: "row", gap: 6, alignItems: "center", justifyContent: "center", paddingVertical: 12, borderRadius: RADIUS.md },
  lbl: { fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5, marginTop: SPACING.md, marginBottom: SPACING.xs },
  input: { borderWidth: 1, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.md, fontSize: 14 },
  pill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.pill, borderWidth: 1 },
  submit: { marginTop: SPACING.lg, paddingVertical: SPACING.md, borderRadius: RADIUS.md, alignItems: "center" },
  result: { marginTop: SPACING.lg, padding: SPACING.md, borderRadius: RADIUS.lg, borderWidth: 0 },
  altroCard: { flexDirection: "row", alignItems: "center", gap: SPACING.md, padding: SPACING.md, borderRadius: RADIUS.lg, borderWidth: 1, marginBottom: SPACING.sm },
  altroIcon: { width: 38, height: 38, borderRadius: RADIUS.md, alignItems: "center", justifyContent: "center" },
});
