
import React from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "@/src/ThemeContext";
import { api } from "@/src/api";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SPACING, RADIUS, SHADOW } from "@/src/theme";
import Header from "@/src/components/Header";
import PromemoriaInput from "@/src/components/PromemoriaInput";

export default function Calcolatori() {
  const { t } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string; _t?: string }>();
  const locked = params.tab === "parcelle" || params.tab === "scadenze";
  const [tab, setTab] = React.useState<"scadenze" | "parcelle">(params.tab === "parcelle" ? "parcelle" : "scadenze");
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
  const headerTitle = locked ? (tab === "parcelle" ? "Crea parcella" : "Aggiungi scadenza") : "Calcolatori";
  // Scadenze
  const [dataPartenza, setDataPartenza] = React.useState(new Date().toISOString().slice(0,10));
  const [giorni, setGiorni] = React.useState("30");
  const [tipoS, setTipoS] = React.useState<"avanti" | "ritroso">("avanti");
  const [unita, setUnita] = React.useState<"giorni"|"mesi"|"anni">("giorni");
  const [escludiFer, setEscludiFer] = React.useState(true);
  const [risScad, setRisScad] = React.useState<any>(null);
  const [promemoria, setPromemoria] = React.useState<number[]>([1]);
  const [pratiche, setPratiche] = React.useState<any[]>([]);
  const [praticaId, setPraticaId] = React.useState<string | null>(null);
  // Parcelle
  const [par, setPar] = React.useState<any>({ fase_studio: "", fase_introduttiva: "", fase_istruttoria: "", fase_decisionale: "", fase_esecutiva: "", diritti: "", anticipazioni: "", spese_generali_pct: "15", cpa_pct: "4", iva_pct: "22", ritenuta_pct: "0" });
  const [risPar, setRisPar] = React.useState<any>(null);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => { api.get("/pratiche").then(setPratiche).catch(() => {}); }, []);

  const calcScad = async () => {
    try {
      const r = await api.post("/calc/scadenza", { data_partenza: dataPartenza, giorni: Number(giorni), tipo: tipoS, unita, escludi_feriale: escludiFer });
      setRisScad(r);
    } catch (e: any) { setRisScad({ error: e.message }); }
  };
  const calcPar = async () => {
    const body: any = {};
    Object.entries(par).forEach(([k, v]) => body[k] = Number(v) || 0);
    const r = await api.post("/calc/parcella", body);
    setRisPar(r);
  };

  const saveScad = async () => {
    if (!risScad?.data_calcolata) return;
    setSaving(true);
    try {
      await api.post("/scadenze", { pratica_id: praticaId, titolo: `Scadenza calcolata (${giorni} ${unita})`, data: risScad.data_calcolata, ora: "09:00", categoria: "generale", priorita: "media", promemoria, descrizione: `Partenza: ${dataPartenza}, ${tipoS}` });
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
      const body: any = { tipo: "parcella", pratica_id: praticaId };
      Object.entries(par).forEach(([k, v]) => body[k] = Number(v) || 0);
      const p = await api.post("/parcelle", body);
      setRisPar({ ...risPar, salvata: true, id: p.id });
    } catch (e: any) {
      Alert.alert("Errore", e.message || "Impossibile salvare. Riprova.");
    } finally {
      setSaving(false);
    }
  };

  const PraticaPicker = () => (
    <View style={{ marginTop: SPACING.md }}>
      <Text style={[st.lbl, { color: t.onSurfaceSecondary, marginTop: 0 }]}>Collega a una pratica (facoltativo)</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        <Pressable testID="pratica-link-none" onPress={() => setPraticaId(null)} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: RADIUS.pill, backgroundColor: praticaId ? t.surfaceSecondary : t.brand, borderWidth: 1, borderColor: t.border }}>
          <Text style={{ color: praticaId ? t.onSurfaceSecondary : t.onBrand, fontSize: 12 }}>Nessuna</Text>
        </Pressable>
        {pratiche.map((p) => (
          <Pressable key={p.id} testID={`pratica-link-${p.id}`} onPress={() => setPraticaId(p.id)} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: RADIUS.pill, backgroundColor: praticaId === p.id ? t.brand : t.surfaceSecondary, borderWidth: 1, borderColor: t.border, maxWidth: 180 }}>
            <Text style={{ color: praticaId === p.id ? t.onBrand : t.onSurfaceSecondary, fontSize: 12 }} numberOfLines={1}>{p.oggetto}</Text>
          </Pressable>
        ))}
      </ScrollView>
      {praticaId ? <Text style={{ color: t.onSurfaceTertiary, fontSize: 11, marginTop: 6 }}>Comparirà anche nella scheda di quella pratica.</Text> : <Text style={{ color: t.onSurfaceTertiary, fontSize: 11, marginTop: 6 }}>Comparirà solo qui e nel calendario.</Text>}
    </View>
  );

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
                        <PraticaPicker />
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
        ) : (
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
                    <PraticaPicker />
                    <Pressable testID="save-par" onPress={savePar} disabled={saving} style={{ marginTop: SPACING.md, backgroundColor: t.brand, padding: 10, borderRadius: RADIUS.md, alignItems: "center", opacity: saving ? 0.6 : 1 }}>
                      <Text style={{ color: t.onBrand, fontWeight: "700" }}>{saving ? "Salvataggio..." : "Salva parcella"}</Text>
                    </Pressable>
                  </>
                ) : <Text style={{ color: t.success, marginTop: 8 }}>✓ Parcella salvata</Text>}
              </View>
            ) : null}
          </View>
        )}
      </ScrollView>
      </KeyboardAvoidingView>
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
});
