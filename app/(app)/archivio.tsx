import React from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, ActivityIndicator, Modal, KeyboardAvoidingView, Platform, Alert, Linking } from "react-native";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import { useTheme } from "@/src/ThemeContext";
import { api } from "@/src/api";
import { SPACING, RADIUS, SHADOW } from "@/src/theme";
import Header from "@/src/components/Header";
import SwipeBackScreen from "@/src/components/SwipeBackScreen";

const STATI = ["Tutte", "Aperta", "Chiusa", "Archiviata"];

function iconForDoc(tipo: string) {
  if (!tipo) return "file";
  if (tipo.includes("pdf")) return "file-text";
  if (tipo.includes("image")) return "image";
  if (tipo.includes("word") || tipo.includes("doc")) return "file-text";
  if (tipo.includes("zip")) return "archive";
  return "file";
}

function formatSize(bytes: number) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Archivio: pratiche e documenti riuniti in un'unica schermata, divisa in
// due sezioni selezionabili con un interruttore in alto.
export default function Archivio() {
  const { t } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string; stato?: string; new?: string; _t?: string }>();
  const [tab, setTab] = React.useState<"pratiche" | "documenti" | "parcelle">(params.tab === "documenti" ? "documenti" : params.tab === "parcelle" ? "parcelle" : "pratiche");

  // La schermata resta montata quando si cambia tab (e' una delle 3 tab
  // principali): se si arriva qui di nuovo con parametri diversi (es. dalle
  // card della Home), bisogna aggiornare la sezione attiva anche se il
  // componente non viene ricreato da zero. Si include anche params._t
  // (un valore che cambia ad ogni click, anche se tab/stato sono identici
  // all'ultima volta) cosi' l'effetto si riattiva sempre su un vero rientro
  // dalla Home, anche se nel frattempo si era cambiata sezione a mano.
  React.useEffect(() => {
    if (params.tab === "documenti") setTab("documenti");
    else if (params.tab === "parcelle") setTab("parcelle");
    else if (params.tab === "pratiche") setTab("pratiche");
  }, [params.tab, params._t]);

  return (
    <SwipeBackScreen edges={["top"]} style={{ flex: 1, backgroundColor: t.surfaceSecondary }}>
      <Header variant="hero" title="Archivio" onBack={() => router.back()} />
      <View style={{ flexDirection: "row", backgroundColor: t.surface, padding: SPACING.md, gap: 8, borderBottomWidth: 1, borderBottomColor: t.border, marginTop: SPACING.xs }}>
        <Pressable testID="archivio-tab-pratiche" onPress={() => setTab("pratiche")} style={{ flex: 1, paddingVertical: 10, borderRadius: RADIUS.pill, alignItems: "center", backgroundColor: tab === "pratiche" ? t.brand : t.surfaceSecondary }}>
          <Text style={{ color: tab === "pratiche" ? t.onBrand : t.onSurfaceSecondary, fontWeight: "700", fontSize: 13 }}>Pratiche</Text>
        </Pressable>
        <Pressable testID="archivio-tab-documenti" onPress={() => setTab("documenti")} style={{ flex: 1, paddingVertical: 10, borderRadius: RADIUS.pill, alignItems: "center", backgroundColor: tab === "documenti" ? t.brand : t.surfaceSecondary }}>
          <Text style={{ color: tab === "documenti" ? t.onBrand : t.onSurfaceSecondary, fontWeight: "700", fontSize: 13 }}>Documenti</Text>
        </Pressable>
        <Pressable testID="archivio-tab-parcelle" onPress={() => setTab("parcelle")} style={{ flex: 1, paddingVertical: 10, borderRadius: RADIUS.pill, alignItems: "center", backgroundColor: tab === "parcelle" ? t.brand : t.surfaceSecondary }}>
          <Text style={{ color: tab === "parcelle" ? t.onBrand : t.onSurfaceSecondary, fontWeight: "700", fontSize: 13 }}>Parcelle</Text>
        </Pressable>
      </View>
      {tab === "pratiche" ? (
        <SezionePratiche statoIniziale={params.stato} autoNew={params.new === "1"} navKey={params._t} />
      ) : tab === "documenti" ? (
        <SezioneDocumenti />
      ) : (
        <SezioneParcelle />
      )}
    </SwipeBackScreen>
  );
}

function SezionePratiche({ statoIniziale, autoNew, navKey }: { statoIniziale?: string; autoNew?: boolean; navKey?: string }) {
  const { t } = useTheme();
  const router = useRouter();
  const [items, setItems] = React.useState<any[] | null>(null);
  const [q, setQ] = React.useState("");
  const [stato, setStato] = React.useState(statoIniziale && STATI.includes(statoIniziale) ? statoIniziale : "Tutte");

  React.useEffect(() => {
    if (statoIniziale && STATI.includes(statoIniziale)) setStato(statoIniziale);
  }, [statoIniziale, navKey]);
  const [showNew, setShowNew] = React.useState(!!autoNew);
  React.useEffect(() => {
    if (autoNew) setShowNew(true);
  }, [autoNew, navKey]);
  const [clienti, setClienti] = React.useState<any[]>([]);
  const [form, setForm] = React.useState<any>({ oggetto: "", controparte: "", tribunale: "", tipo_procedimento: "Civile", priorita: "media", cliente_id: null, valore_causa: "" });

  const load = React.useCallback(async () => {
    const s = stato === "Tutte" ? "" : stato;
    setItems(await api.get(`/pratiche?q=${encodeURIComponent(q)}&stato=${encodeURIComponent(s)}`));
  }, [q, stato]);

  React.useEffect(() => { load(); }, [load]);
  React.useEffect(() => { api.get("/clienti").then(setClienti).catch(() => {}); }, []);

  const create = async () => {
    if (!form.oggetto) return;
    await api.post("/pratiche", { ...form, valore_causa: Number(form.valore_causa) || 0 });
    setShowNew(false);
    setForm({ oggetto: "", controparte: "", tribunale: "", tipo_procedimento: "Civile", priorita: "media", cliente_id: null, valore_causa: "" });
    load();
  };

  const statoColor = (st: string) => st === "Aperta" ? t.success : st === "Chiusa" ? t.error : t.onSurfaceTertiary;

  return (
    <>
      <View style={{ backgroundColor: t.surface, paddingBottom: SPACING.sm, borderBottomWidth: 1, borderBottomColor: t.border }}>
        <View style={[s.searchBox, { backgroundColor: t.surfaceSecondary }]}>
          <Feather name="search" size={16} color={t.onSurfaceTertiary} />
          <TextInput testID="pratiche-search" value={q} onChangeText={setQ} placeholder="Cerca pratica..." placeholderTextColor={t.onSurfaceTertiary} style={{ flex: 1, color: t.onSurface, fontSize: 14 }} />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 48 }} contentContainerStyle={{ paddingHorizontal: SPACING.lg, gap: 8, alignItems: "center", height: 48 }}>
          {STATI.map((st) => (
            <Pressable key={st} testID={`filter-${st}`} onPress={() => setStato(st)} style={{ flexShrink: 0, height: 34, paddingHorizontal: 14, borderRadius: RADIUS.pill, backgroundColor: st === stato ? t.brand : t.surfaceSecondary, alignItems: "center", justifyContent: "center" }}>
              <Text style={{ color: st === stato ? t.onBrand : t.onSurfaceSecondary, fontSize: 12, fontWeight: "600" }}>{st}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={{ padding: SPACING.lg, paddingBottom: SPACING.xxxl + 80 }}>
        {!items ? <ActivityIndicator color={t.brand} /> :
          items.length === 0 ? (
            <View style={s.emptyBox}>
              <Feather name="folder" size={40} color={t.onSurfaceTertiary} />
              <Text style={{ color: t.onSurfaceTertiary, marginTop: SPACING.sm }}>Nessuna pratica</Text>
            </View>
          ) : items.map((p) => (
            <Pressable key={p.id} testID={`pratica-${p.id}`} onPress={() => router.push({ pathname: "/(app)/pratica/[id]", params: { id: p.id } })} style={[s.card, { backgroundColor: t.surface, alignItems: "flex-start" }, SHADOW.card]}>
              <View style={[s.cardIcon, { backgroundColor: t.brandSecondary }]}><Feather name="folder" size={18} color={t.brand} /></View>
              <View style={{ flex: 1 }}>
                <View style={[s.cardHead, { justifyContent: "space-between" }]}>
                  <Text style={{ color: t.onSurface, fontSize: 15, fontWeight: "700", flex: 1 }} numberOfLines={1}>{p.oggetto}</Text>
                  <View style={{ backgroundColor: statoColor(p.stato) + "22", paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.pill, marginLeft: 8 }}>
                    <Text style={{ color: statoColor(p.stato), fontSize: 11, fontWeight: "700" }}>{p.stato}</Text>
                  </View>
                </View>
                {p.cliente ? <Text style={{ color: t.onSurfaceSecondary, fontSize: 13, marginTop: 4 }} numberOfLines={1}>👤 {p.cliente.ragione_sociale || `${p.cliente.nome} ${p.cliente.cognome || ""}`}</Text> : null}
                {p.controparte ? <Text style={{ color: t.onSurfaceTertiary, fontSize: 12, marginTop: 2 }} numberOfLines={1}>vs {p.controparte}</Text> : null}
                {p.tribunale ? <Text style={{ color: t.onSurfaceTertiary, fontSize: 12, marginTop: 2 }} numberOfLines={1}>{p.tribunale}</Text> : null}
                {p.created_at ? <Text style={{ color: t.onSurfaceTertiary, fontSize: 11, marginTop: 4, fontVariant: ["tabular-nums"] }}>Aperta il {p.created_at.slice(0, 10).split("-").reverse().join("/")}</Text> : null}
              </View>
              <Feather name="chevron-right" size={18} color={t.onSurfaceTertiary} style={{ marginTop: 8 }} />
            </Pressable>
          ))}
      </ScrollView>

      <Pressable testID="new-pratica-fab" onPress={() => setShowNew(true)} style={[s.fab, { backgroundColor: t.brand }, SHADOW.floating]}>
        <Feather name="plus" size={22} color={t.onBrand} />
      </Pressable>

      <Modal visible={showNew} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => setShowNew(false)}>
        <SafeAreaProvider>
        <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: t.surface }}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
            <Header variant="hero" title="Nuova Pratica" onBack={() => setShowNew(false)} backTestID="close-new-pratica" />
            <ScrollView contentContainerStyle={{ padding: SPACING.lg }} keyboardShouldPersistTaps="handled">
              {["oggetto", "controparte", "tribunale"].map((k) => (
                <View key={k} style={{ marginBottom: SPACING.md }}>
                  <Text style={[s.lbl, { color: t.onSurfaceSecondary }]}>{k}</Text>
                  <TextInput
                    testID={`new-pratica-${k}`}
                    value={form[k]}
                    onChangeText={(v) => setForm({ ...form, [k]: v })}
                    style={[s.input, { backgroundColor: t.surfaceSecondary, color: t.onSurface, borderColor: t.border }]}
                    placeholderTextColor={t.onSurfaceTertiary}
                  />
                </View>
              ))}
              <View style={{ marginBottom: SPACING.md }}>
                <Text style={[s.lbl, { color: t.onSurfaceSecondary }]}>Valore causa €</Text>
                <TextInput testID="new-pratica-valore" value={form.valore_causa} onChangeText={(v) => setForm({ ...form, valore_causa: v })} keyboardType="numeric" style={[s.input, { backgroundColor: t.surfaceSecondary, color: t.onSurface, borderColor: t.border }]} />
              </View>
              <Text style={[s.lbl, { color: t.onSurfaceSecondary }]}>Cliente</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: SPACING.md }} contentContainerStyle={{ gap: 8 }}>
                <Pressable onPress={() => setForm({ ...form, cliente_id: null })} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: RADIUS.pill, backgroundColor: form.cliente_id ? t.surfaceSecondary : t.brand, borderWidth: 1, borderColor: t.border }}>
                  <Text style={{ color: form.cliente_id ? t.onSurfaceSecondary : t.onBrand, fontSize: 12 }}>Nessuno</Text>
                </Pressable>
                {clienti.map((c) => (
                  <Pressable key={c.id} onPress={() => setForm({ ...form, cliente_id: c.id })} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: RADIUS.pill, backgroundColor: form.cliente_id === c.id ? t.brand : t.surfaceSecondary, borderWidth: 1, borderColor: t.border }}>
                    <Text style={{ color: form.cliente_id === c.id ? t.onBrand : t.onSurfaceSecondary, fontSize: 12 }}>{c.ragione_sociale || `${c.nome} ${c.cognome || ""}`}</Text>
                  </Pressable>
                ))}
              </ScrollView>
              <Text style={[s.lbl, { color: t.onSurfaceSecondary }]}>Priorità</Text>
              <View style={{ flexDirection: "row", gap: 8, marginBottom: SPACING.lg }}>
                {["bassa", "media", "alta"].map((p) => (
                  <Pressable key={p} testID={`priorita-${p}`} onPress={() => setForm({ ...form, priorita: p })} style={{ flex: 1, paddingVertical: 10, borderRadius: RADIUS.md, backgroundColor: form.priorita === p ? t.brand : t.surfaceSecondary, borderWidth: 1, borderColor: t.border, alignItems: "center" }}>
                    <Text style={{ color: form.priorita === p ? t.onBrand : t.onSurfaceSecondary, fontSize: 12, fontWeight: "600", textTransform: "capitalize" }}>{p}</Text>
                  </Pressable>
                ))}
              </View>
              <Pressable testID="submit-new-pratica" onPress={create} style={[s.submit, { backgroundColor: t.brand }]}>
                <Text style={{ color: t.onBrand, fontWeight: "700" }}>Crea pratica</Text>
              </Pressable>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
        </SafeAreaProvider>
      </Modal>
    </>
  );
}

function SezioneDocumenti() {
  const { t } = useTheme();
  const [cartelle, setCartelle] = React.useState<any[]>([]);
  const [documenti, setDocumenti] = React.useState<any[]>([]);
  const [cartellaCorrente, setCartellaCorrente] = React.useState<string | null>(null);
  const [q, setQ] = React.useState("");
  const [uploading, setUploading] = React.useState(false);

  const load = React.useCallback(async () => {
    const [c, d] = await Promise.all([
      api.get("/cartelle"),
      api.get(`/documenti${q ? `?q=${encodeURIComponent(q)}` : ""}`),
    ]);
    setCartelle(c);
    setDocumenti(d);
  }, [q]);

  React.useEffect(() => { load(); }, [load]);

  const cartelleVisibili = cartelle.filter((c) => (c.parent_id || null) === cartellaCorrente);
  const documentiVisibili = q ? documenti : documenti.filter((d) => (d.cartella_id || null) === cartellaCorrente);

  const caricaFile = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: "*/*", copyToCacheDirectory: true, multiple: false });
      if (res.canceled || !res.assets?.[0]) return;
      const file = res.assets[0];
      setUploading(true);
      const form = new FormData();
      // @ts-ignore - RN FormData file shape
      form.append("file", { uri: file.uri, name: file.name || "documento", type: file.mimeType || "application/octet-stream" });
      if (cartellaCorrente) form.append("cartella_id", cartellaCorrente);
      await api.upload("/documenti/upload", form);
      load();
    } catch (e: any) {
      Alert.alert("Errore upload", e.message || "Impossibile caricare il file");
    } finally {
      setUploading(false);
    }
  };

  const apriDocumento = async (doc: any) => {
    const headers = await api.authHeader();
    const token = headers.Authorization ? headers.Authorization.replace("Bearer ", "") : "";
    const url = `${api.base}/api/documenti/${doc.id}/download?access_token=${encodeURIComponent(token)}`;
    Linking.openURL(url).catch(() => Alert.alert("Documento", "Impossibile aprire il documento"));
  };

  const eliminaDocumento = async (doc: any) => {
    Alert.alert("Elimina documento", `Eliminare "${doc.nome}"?`, [
      { text: "Annulla", style: "cancel" },
      { text: "Elimina", style: "destructive", onPress: async () => { await api.del(`/documenti/${doc.id}`); load(); } },
    ]);
  };

  return (
    <>
      <View style={{ backgroundColor: t.surface, paddingBottom: SPACING.md, borderBottomWidth: 1, borderBottomColor: t.border }}>
        <View style={{ paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm }}>
          <View style={[s.searchBox, { backgroundColor: t.surfaceSecondary }]}>
            <Feather name="search" size={16} color={t.onSurfaceTertiary} />
            <TextInput testID="doc-search" placeholder="Cerca documenti..." placeholderTextColor={t.onSurfaceTertiary} value={q} onChangeText={setQ} style={{ flex: 1, marginLeft: 8, color: t.onSurface }} />
          </View>
          {!q && cartellaCorrente ? (
            <Pressable onPress={() => setCartellaCorrente(null)} style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: SPACING.sm }}>
              <Feather name="arrow-left" size={14} color={t.brand} />
              <Text style={{ color: t.brand, fontSize: 13, fontWeight: "600" }}>Cartella principale</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: SPACING.lg, paddingBottom: SPACING.xxxl + 80 }}>
        {!q && cartelleVisibili.map((c) => (
          <Pressable key={c.id} onPress={() => setCartellaCorrente(c.id)} style={[s.row, { backgroundColor: t.surface }, SHADOW.card]}>
            <View style={[s.rowIcon, { backgroundColor: t.brandSecondary }]}><Feather name="folder" size={18} color={t.brand} /></View>
            <Text style={{ flex: 1, color: t.onSurface, fontWeight: "700" }}>{c.nome}</Text>
            <Feather name="chevron-right" size={18} color={t.onSurfaceTertiary} />
          </Pressable>
        ))}
        {documentiVisibili.length === 0 && cartelleVisibili.length === 0 ? (
          <Text style={{ color: t.onSurfaceTertiary, fontStyle: "italic", marginTop: SPACING.lg, textAlign: "center" }}>Nessun documento</Text>
        ) : null}
        {documentiVisibili.map((d) => (
          <Pressable key={d.id} onPress={() => apriDocumento(d)} style={[s.row, { backgroundColor: t.surface }, SHADOW.card]}>
            <View style={[s.rowIcon, { backgroundColor: t.surfaceTertiary }]}><Feather name={iconForDoc(d.tipo) as any} size={18} color={t.onSurfaceSecondary} /></View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: t.onSurface, fontWeight: "600" }} numberOfLines={1}>{d.nome}</Text>
              <Text style={{ color: t.onSurfaceTertiary, fontSize: 11, marginTop: 2 }}>{formatSize(d.dimensione)} · {d.created_at?.slice(0, 10)}</Text>
            </View>
            <Pressable onPress={() => eliminaDocumento(d)} hitSlop={8}><Feather name="trash-2" size={16} color={t.error} /></Pressable>
          </Pressable>
        ))}
      </ScrollView>

      <Pressable testID="doc-upload-fab" onPress={caricaFile} disabled={uploading} style={[s.fab, { backgroundColor: t.brand }, SHADOW.floating]}>
        {uploading ? <ActivityIndicator color={t.onBrand} /> : <Feather name="upload" size={22} color={t.onBrand} />}
      </Pressable>
    </>
  );
}

function SezioneParcelle() {
  const { t } = useTheme();
  const router = useRouter();
  const [items, setItems] = React.useState<any[] | null>(null);

  const load = React.useCallback(async () => setItems(await api.get("/parcelle")), []);
  React.useEffect(() => { load(); }, [load]);

  const emesse = (items || []).filter((p) => p.emessa);

  const openPdf = async (id: string) => {
    const headers = await api.authHeader();
    const token = headers.Authorization ? headers.Authorization.replace("Bearer ", "") : "";
    Linking.openURL(`${api.base}/api/parcelle/${id}/pdf?access_token=${encodeURIComponent(token)}`);
  };

  return (
    <>
    <ScrollView contentContainerStyle={{ padding: SPACING.lg, paddingBottom: SPACING.xxxl + 80 }}>
      {!items ? <ActivityIndicator color={t.brand} /> : emesse.length === 0 ? (
        <View style={s.emptyBox}>
          <Feather name="archive" size={40} color={t.onSurfaceTertiary} />
          <Text style={{ color: t.onSurfaceTertiary, marginTop: SPACING.sm }}>Nessuna parcella emessa</Text>
        </View>
      ) : emesse.map((p) => (
        <View key={p.id} testID={`parcella-${p.id}`} style={[s.card, { backgroundColor: t.surface }, SHADOW.card, { alignItems: "flex-start", flexDirection: "column" }]}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", width: "100%" }}>
            <Text style={{ color: t.onSurfaceTertiary, fontSize: 11, fontWeight: "700", fontVariant: ["tabular-nums"] }}>{p.numero}</Text>
            <View style={{ backgroundColor: t.success + "22", paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.pill }}>
              <Text style={{ color: t.success, fontSize: 10, fontWeight: "700" }}>EMESSA</Text>
            </View>
          </View>
          <Text style={{ color: t.onSurface, fontSize: 20, fontWeight: "800", marginTop: 6, fontVariant: ["tabular-nums"] }}>€ {p.calcolo?.totale?.toFixed(2) || "0.00"}</Text>
          {p.cliente ? <Text style={{ color: t.onSurfaceSecondary, marginTop: 2 }}>{p.cliente.ragione_sociale || `${p.cliente.nome} ${p.cliente.cognome || ""}`}</Text> : null}
          <Pressable testID={`pdf-${p.id}`} onPress={() => openPdf(p.id)} style={{ flexDirection: "row", gap: 6, alignItems: "center", justifyContent: "center", padding: 10, borderRadius: RADIUS.md, backgroundColor: t.brand, marginTop: SPACING.md, width: "100%" }}>
            <Feather name="download" size={14} color={t.onBrand} />
            <Text style={{ color: t.onBrand, fontWeight: "700", fontSize: 12 }}>PDF</Text>
          </Pressable>
        </View>
      ))}
    </ScrollView>

      <Pressable
        testID="new-parcella-fab"
        onPress={() => router.push({ pathname: "/(app)/calcolatori", params: { tab: "parcelle", _t: String(Date.now()) } })}
        style={[s.fab, { backgroundColor: t.brand }, SHADOW.floating]}
      >
        <Feather name="plus" size={22} color={t.onBrand} />
      </Pressable>
    </>
  );
}

const s = StyleSheet.create({
  searchBox: { flexDirection: "row", alignItems: "center", borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: 10 },
  input: { borderWidth: 1, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: 10, fontSize: 14 },
  smallBtn: { paddingHorizontal: SPACING.lg, borderRadius: RADIUS.md, alignItems: "center", justifyContent: "center" },
  emptyBox: { alignItems: "center", paddingVertical: SPACING.xxl },
  card: { flexDirection: "row", alignItems: "center", gap: SPACING.md, padding: SPACING.md, borderRadius: RADIUS.lg, marginBottom: SPACING.sm },
  cardIcon: { width: 40, height: 40, borderRadius: RADIUS.md, alignItems: "center", justifyContent: "center" },
  cardHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  row: { flexDirection: "row", alignItems: "center", gap: SPACING.md, padding: SPACING.md, borderRadius: RADIUS.lg, marginBottom: SPACING.sm },
  rowIcon: { width: 40, height: 40, borderRadius: RADIUS.md, alignItems: "center", justifyContent: "center" },
  fab: { position: "absolute", right: SPACING.lg, bottom: 104, width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", zIndex: 50, elevation: 12 },
  lbl: { fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: SPACING.xs },
  submit: { marginTop: SPACING.sm, paddingVertical: SPACING.md, borderRadius: RADIUS.md, alignItems: "center" },
});
