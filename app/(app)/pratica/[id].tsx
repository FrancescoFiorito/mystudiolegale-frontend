
import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, TextInput, Modal, KeyboardAvoidingView, Platform, Alert, Linking } from "react-native";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import { useTheme } from "@/src/ThemeContext";
import { api } from "@/src/api";
import { SPACING, RADIUS, SHADOW } from "@/src/theme";
import Header from "@/src/components/Header";
import SwipeBackScreen from "@/src/components/SwipeBackScreen";

const TABS = ["Note", "Scadenze", "Parcelle", "Documenti"] as const;
type Tab = typeof TABS[number];

export default function PraticaDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTheme();
  const router = useRouter();
  const [pratica, setPratica] = React.useState<any>(null);
  const [tab, setTab] = React.useState<Tab>("Note");
  const [note, setNote] = React.useState<any[]>([]);
  const [scadenze, setScadenze] = React.useState<any[]>([]);
  const [parcelle, setParcelle] = React.useState<any[]>([]);
  const [documenti, setDocumenti] = React.useState<any[]>([]);
  const [showAdd, setShowAdd] = React.useState(false);
  const [addForm, setAddForm] = React.useState<any>({});
  const [checklist, setChecklist] = React.useState<{ testo: string; fatto: boolean }[]>([]);
  const [nuovaVoce, setNuovaVoce] = React.useState("");
  const [uploading, setUploading] = React.useState(false);
  const [showEdit, setShowEdit] = React.useState(false);
  const [editForm, setEditForm] = React.useState<any>({});
  const [clienti, setClienti] = React.useState<any[]>([]);
  const [savingEdit, setSavingEdit] = React.useState(false);

  const load = React.useCallback(async () => {
    if (!id) return;
    const [p, n, sc, par, doc] = await Promise.all([
      api.get(`/pratiche/${id}`),
      api.get(`/pratiche/${id}/note`),
      api.get(`/scadenze?pratica_id=${id}`),
      api.get(`/parcelle?pratica_id=${id}`),
      api.get(`/documenti?pratica_id=${id}`),
    ]);
    setPratica(p); setNote(n); setScadenze(sc); setParcelle(par); setDocumenti(doc);
  }, [id]);

  React.useEffect(() => { load(); }, [load]);
  React.useEffect(() => { api.get("/clienti").then(setClienti).catch(() => {}); }, []);

  const salvaModifiche = async () => {
    setSavingEdit(true);
    try {
      const aggiornata = { ...pratica, ...editForm, valore_causa: Number(editForm.valore_causa) || 0 };
      delete (aggiornata as any).cliente;
      await api.put(`/pratiche/${id}`, aggiornata);
      setPratica({ ...pratica, ...editForm, valore_causa: Number(editForm.valore_causa) || 0 });
      setShowEdit(false);
      load();
    } catch (e: any) {
      Alert.alert("Errore", e.message);
    } finally {
      setSavingEdit(false);
    }
  };

  const STATI_PRATICA = ["Aperta", "Chiusa", "Archiviata"] as const;

  const cambiaStato = () => {
    Alert.alert(
      "Cambia stato pratica",
      `Stato attuale: ${pratica.stato}`,
      [
        ...STATI_PRATICA.filter((st) => st !== pratica.stato).map((st) => ({
          text: st,
          onPress: async () => {
            const aggiornata = { ...pratica, stato: st };
            delete (aggiornata as any).cliente;
            await api.put(`/pratiche/${id}`, aggiornata);
            setPratica({ ...pratica, stato: st });
          },
        })),
        { text: "Annulla", style: "cancel" as const },
      ]
    );
  };

  const openAdd = () => {
    setAddForm({ tipo: "nota", titolo: "", descrizione: "", data: new Date().toISOString().slice(0, 10), categoria: "generale", priorita: "media", ora: "09:00", contenuto: "" });
    setChecklist([]);
    setNuovaVoce("");
    setShowAdd(true);
  };

  const aggiungiVoceChecklist = () => {
    if (!nuovaVoce.trim()) return;
    setChecklist([...checklist, { testo: nuovaVoce.trim(), fatto: false }]);
    setNuovaVoce("");
  };

  const submitAdd = async () => {
    try {
      if (tab === "Note") {
        await api.post("/note", { pratica_id: id, titolo: addForm.titolo, contenuto: addForm.contenuto, checklist });
      } else if (tab === "Scadenze") {
        await api.post("/scadenze", { pratica_id: id, titolo: addForm.titolo, descrizione: addForm.descrizione, data: addForm.data, ora: addForm.ora, categoria: addForm.categoria, priorita: addForm.priorita, promemoria: [1, 7] });
      }
      setShowAdd(false); load();
    } catch (e: any) { Alert.alert("Errore", e.message || String(e)); }
  };

  const toggleChecklistItem = async (n: any, idx: number) => {
    const nuova = n.checklist.map((c: any, i: number) => (i === idx ? { ...c, fatto: !c.fatto } : c));
    await api.put(`/note/${n.id}`, { pratica_id: id, titolo: n.titolo, contenuto: n.contenuto, checklist: nuova, allegati: n.allegati || [] });
    load();
  };

  const caricaDocumento = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: "*/*", copyToCacheDirectory: true, multiple: false });
      if (res.canceled || !res.assets?.[0]) return;
      const file = res.assets[0];
      setUploading(true);
      const form = new FormData();
      // @ts-ignore
      form.append("file", { uri: file.uri, name: file.name || "documento", type: file.mimeType || "application/octet-stream" });
      form.append("pratica_id", String(id));
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
    // Il browser di sistema (Linking.openURL) non puo' allegare l'header
    // Authorization, quindi passiamo il token come query string: il backend
    // lo accetta anche cosi' per questo specifico endpoint di download.
    const token = headers.Authorization ? headers.Authorization.replace("Bearer ", "") : "";
    const url = `${api.base}/api/documenti/${doc.id}/download?access_token=${encodeURIComponent(token)}`;
    Linking.openURL(url).catch(() => Alert.alert("Documento", "Impossibile aprire il documento"));
  };

  const eliminaDocumento = (doc: any) => {
    Alert.alert("Elimina documento", `Eliminare "${doc.nome}"?`, [
      { text: "Annulla", style: "cancel" },
      { text: "Elimina", style: "destructive", onPress: async () => { await api.del(`/documenti/${doc.id}`); load(); } },
    ]);
  };

  const deletePratica = async () => { await api.del(`/pratiche/${id}`); router.back(); };

  if (!pratica) return <View style={{ flex: 1, backgroundColor: t.surface, alignItems: "center", justifyContent: "center" }}><ActivityIndicator color={t.brand} /></View>;

  const priColor = (p: string, done?: boolean) => done ? t.success : p === "alta" ? t.error : p === "media" ? t.warning : t.success;
  const statoColor = (st: string) => st === "Aperta" ? t.success : st === "Chiusa" ? t.error : t.onSurfaceTertiary;

  return (
    <SwipeBackScreen edges={["top"]} style={{ flex: 1, backgroundColor: t.surfaceSecondary }}>
      <Header
        variant="hero"
        title="Pratica"
        onBack={() => router.back()}
        backTestID="back-btn"
        right={
          <View style={{ flexDirection: "row", gap: SPACING.sm }}>
            <Pressable testID="edit-pratica" onPress={() => { setEditForm({ oggetto: pratica.oggetto || "", controparte: pratica.controparte || "", tribunale: pratica.tribunale || "", valore_causa: String(pratica.valore_causa || ""), cliente_id: pratica.cliente_id || null }); setShowEdit(true); }} style={{ width: 38, height: 38, borderRadius: RADIUS.pill, alignItems: "center", justifyContent: "center", backgroundColor: t.surfaceSecondary }}>
              <Feather name="edit-2" size={17} color={t.onSurfaceSecondary} />
            </Pressable>
            <Pressable testID="delete-pratica" onPress={deletePratica} style={{ width: 38, height: 38, borderRadius: RADIUS.pill, alignItems: "center", justifyContent: "center", backgroundColor: t.surfaceSecondary }}>
              <Feather name="trash-2" size={18} color={t.error} />
            </Pressable>
          </View>
        }
      />
      <ScrollView stickyHeaderIndices={[1]} contentContainerStyle={{ paddingBottom: SPACING.xxxl }}>
        <View style={{ padding: SPACING.lg }}>
          <View style={[s.infoCard, { backgroundColor: t.surface }, SHADOW.card]}>
            <Text style={[s.title, { color: t.onSurface }]}>{pratica.oggetto}</Text>
            <View style={{ flexDirection: "row", gap: 8, marginTop: SPACING.sm, flexWrap: "wrap" }}>
              <Pressable testID="cambia-stato-btn" onPress={cambiaStato} style={[s.tag, { backgroundColor: statoColor(pratica.stato) + "22", flexDirection: "row", alignItems: "center", gap: 4 }]}>
                <Text style={{ color: statoColor(pratica.stato), fontSize: 11, fontWeight: "700" }}>{pratica.stato}</Text>
                <Feather name="chevron-down" size={11} color={statoColor(pratica.stato)} />
              </Pressable>
              <View style={[s.tag, { backgroundColor: priColor(pratica.priorita) + "22" }]}><Text style={{ color: priColor(pratica.priorita), fontSize: 11, fontWeight: "700" }}>Priorità {pratica.priorita}</Text></View>
            </View>
            <View style={{ marginTop: SPACING.md, gap: 6 }}>
              {pratica.cliente ? <View style={s.infoRow}><Feather name="user" size={14} color={t.onSurfaceTertiary} /><Text style={{ color: t.onSurfaceSecondary, fontSize: 13 }}>{pratica.cliente.ragione_sociale || `${pratica.cliente.nome} ${pratica.cliente.cognome || ""}`}</Text></View> : null}
              {pratica.controparte ? <View style={s.infoRow}><Feather name="users" size={14} color={t.onSurfaceTertiary} /><Text style={{ color: t.onSurfaceSecondary, fontSize: 13 }}>vs {pratica.controparte}</Text></View> : null}
              {pratica.tribunale ? <View style={s.infoRow}><Feather name="home" size={14} color={t.onSurfaceTertiary} /><Text style={{ color: t.onSurfaceSecondary, fontSize: 13 }}>{pratica.tribunale}</Text></View> : null}
              {pratica.valore_causa ? <View style={s.infoRow}><Feather name="euro" size={14} color={t.onSurfaceTertiary} /><Text style={{ color: t.onSurfaceSecondary, fontSize: 13, fontVariant: ["tabular-nums"] }}>€ {pratica.valore_causa.toLocaleString("it-IT")}</Text></View> : null}
            </View>
          </View>
        </View>

        <View style={{ backgroundColor: t.surfaceSecondary, paddingBottom: SPACING.sm }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: SPACING.lg, gap: 8, height: 48, alignItems: "center" }}>
            {TABS.map((tb) => (
              <Pressable key={tb} testID={`tab-${tb}`} onPress={() => setTab(tb)} style={{ flexShrink: 0, height: 36, paddingHorizontal: 14, borderRadius: RADIUS.pill, backgroundColor: tab === tb ? t.brand : t.surface, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ color: tab === tb ? t.onBrand : t.onSurfaceSecondary, fontSize: 12, fontWeight: "600" }}>{tb}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <View style={{ padding: SPACING.lg }}>
          {tab === "Note" && (
            <>
              <Pressable testID="add-nota-inline" onPress={openAdd} style={{ flexDirection: "row", alignItems: "center", gap: 8, padding: SPACING.md, borderRadius: RADIUS.lg, backgroundColor: t.brandSecondary, marginBottom: SPACING.md }}>
                <Feather name="plus-circle" size={16} color={t.brand} />
                <Text style={{ color: t.brand, fontWeight: "700", fontSize: 13 }}>Aggiungi nota</Text>
              </Pressable>
              {note.length === 0 ? <Text style={{ color: t.onSurfaceTertiary, fontStyle: "italic" }}>Nessuna nota</Text> :
              note.map((n) => (
                <View key={n.id} style={[s.card, { backgroundColor: t.surface }, SHADOW.card]}>
                {n.titolo ? <Text style={{ color: t.onSurface, fontWeight: "700", marginBottom: 4 }}>{n.titolo}</Text> : null}
                {n.contenuto ? <Text style={{ color: t.onSurfaceSecondary, fontSize: 13 }}>{n.contenuto}</Text> : null}
                {(n.checklist || []).length > 0 ? (
                  <View style={{ marginTop: SPACING.sm, gap: 6 }}>
                    {n.checklist.map((c: any, i: number) => (
                      <Pressable key={i} onPress={() => toggleChecklistItem(n, i)} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <Feather name={c.fatto ? "check-square" : "square"} size={16} color={c.fatto ? t.success : t.onSurfaceTertiary} />
                        <Text style={{ color: t.onSurface, fontSize: 13, textDecorationLine: c.fatto ? "line-through" : "none", opacity: c.fatto ? 0.6 : 1 }}>{c.testo}</Text>
                      </Pressable>
                    ))}
                  </View>
                ) : null}
              </View>
            ))}
            </>
          )}
          {tab === "Scadenze" && (
            scadenze.length === 0 ? <Text style={{ color: t.onSurfaceTertiary, fontStyle: "italic" }}>Nessuna scadenza</Text> :
            scadenze.map((sc) => (
              <View key={sc.id} style={[{ flexDirection: "row", borderRadius: RADIUS.lg, marginBottom: SPACING.sm, overflow: "hidden", backgroundColor: t.surface }, SHADOW.card]}>
                <View style={{ width: 4, backgroundColor: priColor(sc.priorita, sc.completata) }} />
                <View style={{ flex: 1, padding: SPACING.md }}>
                  <Text style={{ color: t.onSurface, fontWeight: "700" }}>{sc.titolo}</Text>
                  <Text style={{ color: t.onSurfaceTertiary, fontSize: 12, marginTop: 2, fontVariant: ["tabular-nums"] }}>{sc.data} · {sc.ora} · {sc.categoria}</Text>
                </View>
                {!sc.completata ? (
                  <Pressable onPress={() => api.patch(`/scadenze/${sc.id}/complete`).then(load)} style={{ padding: SPACING.md, justifyContent: "center" }}>
                    <Feather name="check" size={18} color={t.success} />
                  </Pressable>
                ) : null}
              </View>
            ))
          )}
          {tab === "Parcelle" && (
            parcelle.length === 0 ? <Text style={{ color: t.onSurfaceTertiary, fontStyle: "italic" }}>Nessuna parcella collegata</Text> :
            parcelle.map((p) => (
              <View key={p.id} style={[s.card, { backgroundColor: t.surface }, SHADOW.card]}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={{ color: t.onSurface, fontWeight: "800", fontSize: 16, fontVariant: ["tabular-nums"] }}>€ {p.calcolo?.totale?.toFixed(2) || "0.00"}</Text>
                  <View style={{ backgroundColor: (p.emessa ? t.success : t.warning) + "22", paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.pill }}>
                    <Text style={{ color: p.emessa ? t.success : t.warning, fontSize: 10, fontWeight: "700" }}>{p.emessa ? "EMESSA" : "BOZZA"}</Text>
                  </View>
                </View>
                <Text style={{ color: t.onSurfaceTertiary, fontSize: 12, marginTop: 2 }}>{p.numero}</Text>
              </View>
            ))
          )}
          {tab === "Documenti" && (
            <>
              {documenti.length === 0 ? <Text style={{ color: t.onSurfaceTertiary, fontStyle: "italic" }}>Nessun documento nel fascicolo</Text> :
                documenti.map((d) => (
                  <Pressable key={d.id} onPress={() => apriDocumento(d)} style={[{ flexDirection: "row", alignItems: "center", gap: SPACING.md, padding: SPACING.md, borderRadius: RADIUS.lg, backgroundColor: t.surface, marginBottom: SPACING.sm }, SHADOW.card]}>
                    <View style={[s.docIcon, { backgroundColor: t.brandSecondary }]}><Feather name="file-text" size={16} color={t.brand} /></View>
                    <Text style={{ flex: 1, color: t.onSurface, fontWeight: "600" }} numberOfLines={1}>{d.nome}</Text>
                    <Pressable onPress={() => eliminaDocumento(d)} hitSlop={8}><Feather name="trash-2" size={16} color={t.error} /></Pressable>
                  </Pressable>
                ))}
            </>
          )}
        </View>
      </ScrollView>

      {tab === "Documenti" ? (
        <Pressable testID="pratica-doc-upload" onPress={caricaDocumento} disabled={uploading} style={[s.fab, { backgroundColor: t.brand }]}>
          {uploading ? <ActivityIndicator color={t.onBrand} /> : <Feather name="upload" size={22} color={t.onBrand} />}
        </Pressable>
      ) : tab === "Scadenze" ? (
        <Pressable testID="fab-add" onPress={openAdd} style={[s.fab, { backgroundColor: t.brand }]}>
          <Feather name="plus" size={24} color={t.onBrand} />
        </Pressable>
      ) : null}

      <Modal visible={showEdit} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => setShowEdit(false)}>
        <SafeAreaProvider>
        <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: t.surface }}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
            <Header variant="hero" title="Modifica pratica" onBack={() => setShowEdit(false)} />
            <ScrollView contentContainerStyle={{ padding: SPACING.lg }} keyboardShouldPersistTaps="handled">
              {["oggetto", "controparte", "tribunale"].map((k) => (
                <View key={k} style={{ marginBottom: SPACING.md }}>
                  <Text style={[s.lbl, { color: t.onSurfaceSecondary }]}>{k}</Text>
                  <TextInput
                    testID={`edit-pratica-${k}`}
                    value={editForm[k]}
                    onChangeText={(v) => setEditForm({ ...editForm, [k]: v })}
                    style={[s.input, { backgroundColor: t.surfaceSecondary, color: t.onSurface, borderColor: t.border }]}
                    placeholderTextColor={t.onSurfaceTertiary}
                  />
                </View>
              ))}
              <View style={{ marginBottom: SPACING.md }}>
                <Text style={[s.lbl, { color: t.onSurfaceSecondary }]}>Valore causa €</Text>
                <TextInput testID="edit-pratica-valore" value={editForm.valore_causa} onChangeText={(v) => setEditForm({ ...editForm, valore_causa: v })} keyboardType="numeric" style={[s.input, { backgroundColor: t.surfaceSecondary, color: t.onSurface, borderColor: t.border }]} />
              </View>
              <Text style={[s.lbl, { color: t.onSurfaceSecondary }]}>Cliente</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: SPACING.lg }} contentContainerStyle={{ gap: 8 }}>
                <Pressable onPress={() => setEditForm({ ...editForm, cliente_id: null })} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: RADIUS.pill, backgroundColor: editForm.cliente_id ? t.surfaceSecondary : t.brand, borderWidth: 1, borderColor: t.border }}>
                  <Text style={{ color: editForm.cliente_id ? t.onSurfaceSecondary : t.onBrand, fontSize: 12 }}>Nessuno</Text>
                </Pressable>
                {clienti.map((c) => (
                  <Pressable key={c.id} onPress={() => setEditForm({ ...editForm, cliente_id: c.id })} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: RADIUS.pill, backgroundColor: editForm.cliente_id === c.id ? t.brand : t.surfaceSecondary, borderWidth: 1, borderColor: t.border }}>
                    <Text style={{ color: editForm.cliente_id === c.id ? t.onBrand : t.onSurfaceSecondary, fontSize: 12 }}>{c.ragione_sociale || `${c.nome} ${c.cognome || ""}`}</Text>
                  </Pressable>
                ))}
              </ScrollView>
              <Pressable testID="save-edit-pratica" onPress={salvaModifiche} disabled={savingEdit} style={{ backgroundColor: t.brand, padding: SPACING.md, borderRadius: RADIUS.md, alignItems: "center", opacity: savingEdit ? 0.6 : 1 }}>
                <Text style={{ color: t.onBrand, fontWeight: "700" }}>{savingEdit ? "Salvataggio..." : "Salva modifiche"}</Text>
              </Pressable>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
        </SafeAreaProvider>
      </Modal>

      <Modal visible={showAdd} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => setShowAdd(false)}>
        <SafeAreaProvider>
        <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: t.surface }}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
            <Header variant="hero" title={`Aggiungi ${tab}`} onBack={() => setShowAdd(false)} />
            <ScrollView contentContainerStyle={{ padding: SPACING.lg }}>
              <Text style={s.lbl}>Titolo</Text>
              <TextInput testID="add-titolo" value={addForm.titolo || ""} onChangeText={(v) => setAddForm({ ...addForm, titolo: v })} style={[s.input, { backgroundColor: t.surfaceSecondary, color: t.onSurface, borderColor: t.border }]} />
              {tab === "Note" ? (
                <>
                  <Text style={s.lbl}>Contenuto</Text>
                  <TextInput testID="add-contenuto" multiline value={addForm.contenuto || ""} onChangeText={(v) => setAddForm({ ...addForm, contenuto: v })} style={[s.input, { minHeight: 100, backgroundColor: t.surfaceSecondary, color: t.onSurface, borderColor: t.border, textAlignVertical: "top" }]} />
                  <Text style={[s.lbl, { marginTop: SPACING.md }]}>Checklist</Text>
                  {checklist.map((c, i) => (
                    <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <Feather name="square" size={16} color={t.onSurfaceTertiary} />
                      <Text style={{ flex: 1, color: t.onSurface, fontSize: 13 }}>{c.testo}</Text>
                      <Pressable onPress={() => setChecklist(checklist.filter((_, idx) => idx !== i))}><Feather name="x" size={14} color={t.error} /></Pressable>
                    </View>
                  ))}
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <TextInput testID="add-checklist-item" value={nuovaVoce} onChangeText={setNuovaVoce} placeholder="Nuova voce checklist" placeholderTextColor={t.onSurfaceTertiary} style={[s.input, { flex: 1, backgroundColor: t.surfaceSecondary, color: t.onSurface, borderColor: t.border }]} />
                    <Pressable onPress={aggiungiVoceChecklist} style={{ paddingHorizontal: SPACING.md, borderRadius: RADIUS.md, backgroundColor: t.brandSecondary, alignItems: "center", justifyContent: "center" }}>
                      <Feather name="plus" size={18} color={t.onBrandSecondary} />
                    </Pressable>
                  </View>
                  <Text style={{ color: t.onSurfaceTertiary, fontSize: 11, marginTop: SPACING.sm }}>
                    Per allegare un file a questa pratica usa la tab "Documenti".
                  </Text>
                </>
              ) : (
                <>
                  <Text style={s.lbl}>Descrizione</Text>
                  <TextInput testID="add-descrizione" multiline value={addForm.descrizione || ""} onChangeText={(v) => setAddForm({ ...addForm, descrizione: v })} style={[s.input, { minHeight: 80, backgroundColor: t.surfaceSecondary, color: t.onSurface, borderColor: t.border, textAlignVertical: "top" }]} />
                  <Text style={s.lbl}>Data (YYYY-MM-DD)</Text>
                  <TextInput testID="add-data" value={addForm.data || ""} onChangeText={(v) => setAddForm({ ...addForm, data: v })} style={[s.input, { backgroundColor: t.surfaceSecondary, color: t.onSurface, borderColor: t.border }]} />
                  {tab === "Scadenze" && (
                    <>
                      <Text style={s.lbl}>Ora (HH:MM)</Text>
                      <TextInput testID="add-ora" value={addForm.ora || ""} onChangeText={(v) => setAddForm({ ...addForm, ora: v })} style={[s.input, { backgroundColor: t.surfaceSecondary, color: t.onSurface, borderColor: t.border }]} />
                      <Text style={s.lbl}>Categoria</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                        {["udienza", "deposito", "notifica", "riunione", "generale"].map((c) => (
                          <Pressable key={c} onPress={() => setAddForm({ ...addForm, categoria: c })} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: RADIUS.pill, backgroundColor: addForm.categoria === c ? t.brand : t.surfaceSecondary, borderWidth: 1, borderColor: t.border }}>
                            <Text style={{ color: addForm.categoria === c ? t.onBrand : t.onSurfaceSecondary, fontSize: 12 }}>{c}</Text>
                          </Pressable>
                        ))}
                      </ScrollView>
                      <Text style={[s.lbl, { marginTop: SPACING.md }]}>Priorità</Text>
                      <View style={{ flexDirection: "row", gap: 8 }}>
                        {["bassa", "media", "alta"].map((p) => (
                          <Pressable key={p} onPress={() => setAddForm({ ...addForm, priorita: p })} style={{ flex: 1, paddingVertical: 10, borderRadius: RADIUS.md, backgroundColor: addForm.priorita === p ? t.brand : t.surfaceSecondary, borderWidth: 1, borderColor: t.border, alignItems: "center" }}>
                            <Text style={{ color: addForm.priorita === p ? t.onBrand : t.onSurfaceSecondary, fontSize: 12, textTransform: "capitalize" }}>{p}</Text>
                          </Pressable>
                        ))}
                      </View>
                    </>
                  )}
                </>
              )}
              <Pressable testID="submit-add" onPress={submitAdd} style={{ marginTop: SPACING.xl, backgroundColor: t.brand, padding: SPACING.md, borderRadius: RADIUS.md, alignItems: "center" }}>
                <Text style={{ color: t.onBrand, fontWeight: "700" }}>Salva</Text>
              </Pressable>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
        </SafeAreaProvider>
      </Modal>
    </SwipeBackScreen>
  );
}

const s = StyleSheet.create({
  infoCard: { borderRadius: RADIUS.lg, padding: SPACING.lg },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  numero: { fontSize: 12, fontWeight: "800" },
  title: { fontSize: 20, fontWeight: "800", marginTop: 4 },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.pill },
  card: { padding: SPACING.md, borderRadius: RADIUS.lg, marginBottom: SPACING.sm },
  docIcon: { width: 36, height: 36, borderRadius: RADIUS.md, alignItems: "center", justifyContent: "center" },
  fab: { position: "absolute", right: SPACING.lg, bottom: SPACING.lg + 8, width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", ...SHADOW.floating },
  lbl: { fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5, marginTop: SPACING.md, marginBottom: SPACING.xs, color: "#64748B" },
  input: { borderWidth: 1, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.md, fontSize: 14 },
});
