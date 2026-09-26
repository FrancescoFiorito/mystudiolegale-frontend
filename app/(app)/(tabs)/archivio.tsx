import React from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams, useNavigation, useFocusEffect } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import { useTheme } from "@/src/ThemeContext";
import { api } from "@/src/api";
import { SPACING, RADIUS, SHADOW } from "@/src/theme";
import Header from "@/src/components/Header";
import SwipeBackScreen from "@/src/components/SwipeBackScreen";
import NuovaPraticaForm from "@/src/components/NuovaPraticaForm";
import SwipeToDelete from "@/src/components/SwipeToDelete";
import { scegliAperturaDocumento } from "@/src/utils/apriDocumentoRemoto";
import { useDebouncedValue } from "@/src/hooks/use-debounced-value";

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
  const params = useLocalSearchParams<{ tab?: string; stato?: string; selectCliente?: string; reopenNew?: string; _t?: string }>();
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

  // Ritorno dalla schermata Clienti dopo aver creato un nuovo cliente mentre
  // si stava compilando una pratica (vedi "Nuovo cliente" in SezionePratiche):
  // stesso schema del fix sopra, gestito qui in Archivio perche' non si
  // smonta mai. Riapre la modale "Nuova pratica" e seleziona il cliente
  // appena creato, senza perdere gli altri campi gia' compilati (il form di
  // SezionePratiche resta vivo perche' l'intera schermata Archivio non viene
  // mai smontata passando dalla tab Clienti).
  const [pendingCliente, setPendingCliente] = React.useState<{ id: string; key: string } | undefined>(undefined);
  const handledSelectRef = React.useRef<string | undefined>(undefined);
  React.useEffect(() => {
    if (params.reopenNew === "1" && params._t && handledSelectRef.current !== params._t) {
      handledSelectRef.current = params._t;
      setPendingCliente({ id: params.selectCliente || "", key: params._t });
      router.setParams({ reopenNew: "", selectCliente: "" });
    }
  }, [params.reopenNew, params.selectCliente, params._t, router]);

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: t.surfaceSecondary }}>
      <Header variant="hero" title="Archivio" />
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
        <SezionePratiche
          statoIniziale={params.stato}
          navKey={params._t}
          pendingCliente={pendingCliente}
          onPendingClienteHandled={() => setPendingCliente(undefined)}
        />
      ) : tab === "documenti" ? (
        <SezioneDocumenti />
      ) : (
        <SezioneParcelle />
      )}
    </SafeAreaView>
  );
}

function SezionePratiche({
  statoIniziale, navKey, pendingCliente, onPendingClienteHandled,
}: {
  statoIniziale?: string; navKey?: string;
  pendingCliente?: { id: string; key: string }; onPendingClienteHandled?: () => void;
}) {
  const { t } = useTheme();
  const router = useRouter();
  const navigation = useNavigation();
  const [items, setItems] = React.useState<any[] | null>(null);
  const [q, setQ] = React.useState("");
  const debouncedQ = useDebouncedValue(q, 300);
  const [stato, setStato] = React.useState(statoIniziale && STATI.includes(statoIniziale) ? statoIniziale : "Tutte");

  React.useEffect(() => {
    if (statoIniziale && STATI.includes(statoIniziale)) setStato(statoIniziale);
  }, [statoIniziale, navKey]);
  const [showNew, setShowNew] = React.useState(false);

  // Mentre la modale "Nuova pratica" e' aperta, disattiva lo swipe fra le
  // tab: ha un proprio gesto di swipe per chiudersi (SwipeBackScreen) che
  // altrimenti si scontrerebbe con quello del pager (stesso schema usato in
  // profilo.tsx per gli overlay locali).
  React.useEffect(() => {
    navigation.setOptions({ swipeEnabled: !showNew });
  }, [showNew, navigation]);
  const [clienti, setClienti] = React.useState<any[]>([]);
  const [clienteQ, setClienteQ] = React.useState("");
  const [form, setForm] = React.useState<any>({ oggetto: "", controparte: "", tribunale: "", tipo_procedimento: "Civile", priorita: "media", cliente_id: null, valore_causa: "" });
  const [saving, setSaving] = React.useState(false);

  const load = React.useCallback(async (signal?: AbortSignal) => {
    const s = stato === "Tutte" ? "" : stato;
    try {
      setItems(await api.get(`/pratiche?q=${encodeURIComponent(debouncedQ)}&stato=${encodeURIComponent(s)}`, { signal }));
    } catch (e: any) {
      if (e?.name === "AbortError") return;
    }
  }, [debouncedQ, stato]);

  // Annulla la richiesta precedente se q o stato cambiano prima che risponda,
  // cosi' una risposta "vecchia" in ritardo non sovrascrive quella giusta.
  // useFocusEffect invece di useEffect: Archivio non viene mai smontata
  // cambiando tab, quindi al ritorno da un'altra tab l'elenco andrebbe
  // ricaricato a mano (swipe-to-refresh) senza questo.
  useFocusEffect(
    React.useCallback(() => {
      const controller = new AbortController();
      load(controller.signal);
      return () => controller.abort();
    }, [load])
  );
  const loadClienti = React.useCallback(() => { api.get("/clienti").then(setClienti).catch(() => {}); }, []);
  useFocusEffect(React.useCallback(() => { loadClienti(); }, [loadClienti]));

  // Ritorno dalla creazione di un cliente fatta "al volo" dalla schermata
  // Clienti (vedi il pulsante "Nuovo cliente" piu' sotto): riapre la modale
  // e seleziona il cliente appena creato. Ricarica anche l'elenco clienti
  // (creato altrove) cosi' compare subito se si deseleziona e si ricerca.
  React.useEffect(() => {
    if (pendingCliente) {
      loadClienti();
      if (pendingCliente.id) setForm((f: any) => ({ ...f, cliente_id: pendingCliente.id }));
      setShowNew(true);
      onPendingClienteHandled?.();
    }
  }, [pendingCliente, loadClienti]);

  const create = async () => {
    if (!form.oggetto) return;
    setSaving(true);
    try {
      await api.post("/pratiche", { ...form, valore_causa: Number(form.valore_causa) || 0 });
      setShowNew(false);
      setForm({ oggetto: "", controparte: "", tribunale: "", tipo_procedimento: "Civile", priorita: "media", cliente_id: null, valore_causa: "" });
      setClienteQ("");
      load();
    } catch (e: any) {
      Alert.alert("Errore", e.message || "Impossibile salvare. Riprova.");
    } finally {
      setSaving(false);
    }
  };

  const chiudiNuovaPratica = () => {
    setShowNew(false);
    setClienteQ("");
  };

  const vaiNuovoCliente = () => {
    // Chiude la modale "Nuova pratica" prima di navigare via (evita di avere
    // due schermate fullscreen sovrapposte) e passa alla vera schermata di
    // creazione cliente in Clienti, cosi' le due sezioni condividono un
    // unico form invece di duplicarlo qui. Al salvataggio, Clienti torna
    // qui e riapre la modale con il cliente selezionato (vedi pendingCliente
    // sopra).
    setShowNew(false);
    router.push({ pathname: "/(app)/clienti", params: { autoNew: "1", returnTo: "pratica", _t: String(Date.now()) } });
  };

  const statoColor = (st: string) => st === "Aperta" ? t.success : st === "Chiusa" ? t.error : t.onSurfaceTertiary;

  const eliminaPratica = (p: any) => {
    Alert.alert("Elimina pratica", `Eliminare "${p.oggetto}"?`, [
      { text: "Annulla", style: "cancel" },
      { text: "Elimina", style: "destructive", onPress: async () => { await api.del(`/pratiche/${p.id}`); load(); } },
    ]);
  };

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
            <SwipeToDelete key={p.id} testID={`pratica-${p.id}`} onDelete={() => eliminaPratica(p)}>
              <Pressable testID={`pratica-${p.id}`} onPress={() => router.push({ pathname: "/(app)/pratica/[id]", params: { id: p.id } })} style={[s.card, { backgroundColor: t.surface, alignItems: "flex-start" }, SHADOW.card]}>
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
            </SwipeToDelete>
          ))}
      </ScrollView>

      <Pressable testID="new-pratica-fab" onPress={() => setShowNew(true)} style={[s.fab, { backgroundColor: t.brand }, SHADOW.floating]}>
        <Feather name="plus" size={22} color={t.onBrand} />
      </Pressable>

      {showNew ? (
        <SwipeBackScreen edges={["top"]} style={{ backgroundColor: t.surface }} onDismiss={chiudiNuovaPratica}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
            <Header variant="hero" title="Nuova Pratica" onBack={chiudiNuovaPratica} backTestID="close-new-pratica" />
            <NuovaPraticaForm
              form={form}
              setForm={setForm}
              clienti={clienti}
              clienteQ={clienteQ}
              setClienteQ={setClienteQ}
              saving={saving}
              onSubmit={create}
              onNuovoCliente={vaiNuovoCliente}
            />
          </KeyboardAvoidingView>
        </SwipeBackScreen>
      ) : null}
    </>
  );
}

function SezioneDocumenti() {
  const { t } = useTheme();
  const [cartelle, setCartelle] = React.useState<any[]>([]);
  const [documenti, setDocumenti] = React.useState<any[]>([]);
  const [cartellaCorrente, setCartellaCorrente] = React.useState<string | null>(null);
  const [q, setQ] = React.useState("");
  const debouncedQ = useDebouncedValue(q, 300);
  const [uploading, setUploading] = React.useState(false);

  const load = React.useCallback(async (signal?: AbortSignal) => {
    try {
      const [c, d] = await Promise.all([
        api.get("/cartelle", { signal }),
        api.get(`/documenti${debouncedQ ? `?q=${encodeURIComponent(debouncedQ)}` : ""}`, { signal }),
      ]);
      setCartelle(c);
      setDocumenti(d);
    } catch (e: any) {
      if (e?.name === "AbortError") return;
    }
  }, [debouncedQ]);

  // Annulla la richiesta precedente se la ricerca cambia prima che risponda,
  // cosi' una risposta "vecchia" in ritardo non sovrascrive quella giusta.
  // useFocusEffect invece di useEffect: vedi il commento nello stesso punto
  // di SezionePratiche piu' sopra.
  useFocusEffect(
    React.useCallback(() => {
      const controller = new AbortController();
      load(controller.signal);
      return () => controller.abort();
    }, [load])
  );

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

  const apriDocumento = (doc: any) => {
    scegliAperturaDocumento(`/documenti/${doc.id}/download`, `/documenti/${doc.id}/view-link`, doc.nome || "documento");
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
          <SwipeToDelete key={d.id} testID={`doc-${d.id}`} onDelete={() => eliminaDocumento(d)}>
            <Pressable onPress={() => apriDocumento(d)} style={[s.row, { backgroundColor: t.surface }, SHADOW.card]}>
              <View style={[s.rowIcon, { backgroundColor: t.surfaceTertiary }]}><Feather name={iconForDoc(d.tipo) as any} size={18} color={t.onSurfaceSecondary} /></View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: t.onSurface, fontWeight: "600" }} numberOfLines={1}>{d.nome}</Text>
                <Text style={{ color: t.onSurfaceTertiary, fontSize: 11, marginTop: 2 }}>{formatSize(d.dimensione)} · {d.created_at?.slice(0, 10)}</Text>
              </View>
            </Pressable>
          </SwipeToDelete>
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
  useFocusEffect(React.useCallback(() => { load(); }, [load]));

  const emesse = (items || []).filter((p) => p.emessa);

  const openPdf = (p: any) => {
    scegliAperturaDocumento(`/parcelle/${p.id}/pdf`, `/parcelle/${p.id}/pdf/view-link`, `${p.numero || "parcella"}.pdf`);
  };

  const eliminaParcella = (p: any) => {
    Alert.alert("Elimina parcella", `Eliminare la parcella "${p.numero}"?`, [
      { text: "Annulla", style: "cancel" },
      { text: "Elimina", style: "destructive", onPress: async () => { await api.del(`/parcelle/${p.id}`); load(); } },
    ]);
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
        <SwipeToDelete key={p.id} testID={`parcella-${p.id}`} onDelete={() => eliminaParcella(p)}>
          <View testID={`parcella-${p.id}`} style={[s.card, { backgroundColor: t.surface }, SHADOW.card, { alignItems: "flex-start", flexDirection: "column" }]}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", width: "100%" }}>
              <Text style={{ color: t.onSurfaceTertiary, fontSize: 11, fontWeight: "700", fontVariant: ["tabular-nums"] }}>{p.numero}</Text>
              <View style={{ backgroundColor: t.success + "22", paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.pill }}>
                <Text style={{ color: t.success, fontSize: 10, fontWeight: "700" }}>EMESSA</Text>
              </View>
            </View>
            <Text style={{ color: t.onSurface, fontSize: 20, fontWeight: "800", marginTop: 6, fontVariant: ["tabular-nums"] }}>€ {p.calcolo?.totale?.toFixed(2) || "0.00"}</Text>
            {p.cliente ? <Text style={{ color: t.onSurfaceSecondary, marginTop: 2 }}>{p.cliente.ragione_sociale || `${p.cliente.nome} ${p.cliente.cognome || ""}`}</Text> : null}
            <Pressable testID={`pdf-${p.id}`} onPress={() => openPdf(p)} style={{ flexDirection: "row", gap: 6, alignItems: "center", justifyContent: "center", padding: 10, borderRadius: RADIUS.md, backgroundColor: t.brand, marginTop: SPACING.md, width: "100%" }}>
              <Feather name="download" size={14} color={t.onBrand} />
              <Text style={{ color: t.onBrand, fontWeight: "700", fontSize: 12 }}>PDF</Text>
            </Pressable>
          </View>
        </SwipeToDelete>
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
  smallBtn: { paddingHorizontal: SPACING.lg, borderRadius: RADIUS.md, alignItems: "center", justifyContent: "center" },
  emptyBox: { alignItems: "center", paddingVertical: SPACING.xxl },
  card: { flexDirection: "row", alignItems: "center", gap: SPACING.md, padding: SPACING.md, borderRadius: RADIUS.lg, marginBottom: SPACING.sm },
  cardIcon: { width: 40, height: 40, borderRadius: RADIUS.md, alignItems: "center", justifyContent: "center" },
  cardHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  row: { flexDirection: "row", alignItems: "center", gap: SPACING.md, padding: SPACING.md, borderRadius: RADIUS.lg, marginBottom: SPACING.sm },
  rowIcon: { width: 40, height: 40, borderRadius: RADIUS.md, alignItems: "center", justifyContent: "center" },
  fab: { position: "absolute", right: SPACING.lg, bottom: 104, width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", zIndex: 50, elevation: 12 },
});
