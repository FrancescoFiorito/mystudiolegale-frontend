import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, TextInput, Modal, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { useTheme } from "@/src/ThemeContext";
import { api } from "@/src/api";
import { SPACING, RADIUS, SHADOW } from "@/src/theme";
import Header from "@/src/components/Header";
import { nomeCliente, inizialiCliente } from "@/src/utils/cliente";

const statoColor = (t: any, st: string) => st === "Aperta" ? t.info : st === "Chiusa" ? t.success : t.onSurfaceTertiary;

export default function ClienteDettaglio() {
  const { t } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [cliente, setCliente] = React.useState<any>(null);
  const [pratiche, setPratiche] = React.useState<any[] | null>(null);
  const [q, setQ] = React.useState("");
  const [showEdit, setShowEdit] = React.useState(false);
  const [editForm, setEditForm] = React.useState<any>({});
  const [saving, setSaving] = React.useState(false);
  const [campoCopiato, setCampoCopiato] = React.useState<string | null>(null);

  const copiaValore = async (label: string, valore: string) => {
    await Clipboard.setStringAsync(valore);
    setCampoCopiato(label);
    setTimeout(() => setCampoCopiato((c) => (c === label ? null : c)), 1500);
  };

  const load = React.useCallback(async () => {
    const [c, p] = await Promise.all([
      api.get(`/clienti/${id}`),
      api.get(`/pratiche?cliente_id=${id}`),
    ]);
    setCliente(c);
    setPratiche(p);
  }, [id]);

  // useFocusEffect invece di useEffect: tornando indietro su questa
  // schermata (es. dopo aver modificato una pratica collegata) resta
  // montata sotto, quindi senza questo i dati non si aggiornerebbero.
  useFocusEffect(React.useCallback(() => { load(); }, [load]));

  const apriModifica = () => {
    setEditForm({
      nome: cliente.nome || "",
      cognome: cliente.cognome || "",
      ragione_sociale: cliente.ragione_sociale || "",
      tipo: cliente.tipo || "persona",
      codice_fiscale: cliente.codice_fiscale || "",
      partita_iva: cliente.partita_iva || "",
      pec: cliente.pec || "",
      email: cliente.email || "",
      telefono: cliente.telefono || "",
      indirizzo: cliente.indirizzo || "",
      citta: cliente.citta || "",
      cap: cliente.cap || "",
    });
    setShowEdit(true);
  };

  const salvaModifiche = async () => {
    if (editForm.tipo === "azienda") {
      if (!editForm.ragione_sociale.trim()) {
        Alert.alert("Ragione sociale mancante", "Inserisci la ragione sociale del cliente.");
        return;
      }
    } else if (!editForm.nome.trim() || !editForm.cognome.trim()) {
      Alert.alert("Dati mancanti", "Inserisci nome e cognome del cliente.");
      return;
    }
    setSaving(true);
    try {
      await api.put(`/clienti/${id}`, editForm);
      setCliente({ ...cliente, ...editForm });
      setShowEdit(false);
    } catch (e: any) {
      Alert.alert("Errore", e.message || "Impossibile salvare le modifiche. Riprova.");
    } finally {
      setSaving(false);
    }
  };

  const eliminaCliente = () => {
    Alert.alert("Elimina cliente", "Sei sicuro di voler eliminare questo cliente? L'operazione non è reversibile.", [
      { text: "Annulla", style: "cancel" },
      {
        text: "Elimina",
        style: "destructive",
        onPress: async () => {
          try {
            await api.del(`/clienti/${id}`);
            router.back();
          } catch (e: any) {
            Alert.alert("Errore", e.message || "Impossibile eliminare il cliente. Riprova.");
          }
        },
      },
    ]);
  };

  if (!cliente) {
    return (
      <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: t.surfaceSecondary, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={t.brand} />
      </SafeAreaView>
    );
  }

  const nome = nomeCliente(cliente);
  const iniziali = inizialiCliente(cliente);

  const indirizzoCompleto = [cliente.indirizzo, cliente.cap, cliente.citta].filter(Boolean).join(", ");
  const campiInfo: { icon: string; label: string; valore: string }[] = [
    { icon: "mail", label: "Email", valore: cliente.email },
    { icon: "phone", label: "Telefono", valore: cliente.telefono },
    { icon: "send", label: "PEC", valore: cliente.pec },
    { icon: "map-pin", label: "Indirizzo", valore: indirizzoCompleto },
    { icon: "file-text", label: "Codice Fiscale", valore: cliente.codice_fiscale },
    { icon: "briefcase", label: "Partita IVA", valore: cliente.partita_iva },
    { icon: "hash", label: "Codice SDI", valore: cliente.sdi },
    { icon: "message-square", label: "Note", valore: cliente.note },
  ].filter((c) => c.valore);

  const praticheFiltrate = !pratiche ? null : !q.trim() ? pratiche : pratiche.filter((p) => {
    const qq = q.trim().toLowerCase();
    return (p.oggetto || "").toLowerCase().includes(qq) || (p.controparte || "").toLowerCase().includes(qq);
  });

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: t.surfaceSecondary }}>
      <Header
        variant="hero"
        title={nome}
        subtitle={cliente.tipo === "azienda" ? "Azienda" : "Persona fisica"}
        onBack={() => router.back()}
        right={
          <View style={{ flexDirection: "row", gap: SPACING.sm }}>
            <Pressable testID="edit-cliente" onPress={apriModifica} style={{ width: 38, height: 38, borderRadius: RADIUS.pill, alignItems: "center", justifyContent: "center", backgroundColor: t.surfaceSecondary }}>
              <Feather name="edit-2" size={17} color={t.onSurfaceSecondary} />
            </Pressable>
            <Pressable testID="delete-cliente" onPress={eliminaCliente} style={{ width: 38, height: 38, borderRadius: RADIUS.pill, alignItems: "center", justifyContent: "center", backgroundColor: t.surfaceSecondary }}>
              <Feather name="trash-2" size={18} color={t.error} />
            </Pressable>
          </View>
        }
      />
      <ScrollView contentContainerStyle={{ padding: SPACING.lg, paddingBottom: SPACING.xxxl }}>
        <View style={[s.infoCard, { backgroundColor: t.surface }, SHADOW.card]}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: SPACING.md, marginBottom: SPACING.sm }}>
            <View style={{ width: 44, height: 44, borderRadius: RADIUS.pill, backgroundColor: t.brandTertiary, alignItems: "center", justifyContent: "center" }}>
              <Text style={{ color: t.brand, fontWeight: "700" }}>{iniziali}</Text>
            </View>
            <Text style={{ color: t.onSurface, fontSize: 17, fontWeight: "800", flex: 1 }} numberOfLines={1}>{nome}</Text>
          </View>
          {campiInfo.length === 0 ? (
            <Text style={{ color: t.onSurfaceTertiary, fontSize: 12, fontStyle: "italic" }}>Nessun altro dato compilato</Text>
          ) : campiInfo.map((c) => (
            <Pressable key={c.label} testID={`copia-${c.label}`} onPress={() => copiaValore(c.label, c.valore)} style={[s.infoRow, { paddingVertical: 4 }]}>
              <Feather name={c.icon as any} size={14} color={t.onSurfaceTertiary} />
              <Text style={{ color: t.onSurfaceSecondary, fontSize: 13, flex: 1 }}>{c.valore}</Text>
              <Feather name={campoCopiato === c.label ? "check" : "copy"} size={13} color={campoCopiato === c.label ? t.success : t.onSurfaceTertiary} />
            </Pressable>
          ))}
        </View>

        <Text style={[s.section, { color: t.onSurfaceSecondary }]}>PRATICHE ({pratiche?.length ?? 0})</Text>
        {pratiche && pratiche.length > 0 ? (
          <View style={[s.searchBox, { backgroundColor: t.surface, borderColor: t.border }]}>
            <Feather name="search" size={15} color={t.onSurfaceTertiary} />
            <TextInput
              testID="cliente-pratiche-search"
              value={q}
              onChangeText={setQ}
              placeholder="Cerca per oggetto o controparte..."
              placeholderTextColor={t.onSurfaceTertiary}
              style={{ flex: 1, marginLeft: 8, color: t.onSurface, fontSize: 13 }}
            />
          </View>
        ) : null}
        {!praticheFiltrate ? <ActivityIndicator color={t.brand} /> : praticheFiltrate.length === 0 ? (
          <Text style={{ color: t.onSurfaceTertiary, fontStyle: "italic" }}>
            {pratiche && pratiche.length > 0 ? "Nessuna pratica trovata" : "Nessuna pratica per questo cliente"}
          </Text>
        ) : praticheFiltrate.map((p) => (
          <Pressable key={p.id} testID={`cliente-pratica-${p.id}`} onPress={() => router.push({ pathname: "/(app)/pratica/[id]", params: { id: p.id } })} style={[s.row, { backgroundColor: t.surface }, SHADOW.card]}>
            <View style={[s.rowIcon, { backgroundColor: t.brandSecondary }]}><Feather name="folder" size={18} color={t.brand} /></View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={{ color: t.onSurface, fontWeight: "700", flex: 1 }} numberOfLines={1}>{p.oggetto}</Text>
                <View style={{ backgroundColor: statoColor(t, p.stato) + "22", paddingHorizontal: 8, paddingVertical: 2, borderRadius: RADIUS.pill, marginLeft: 8 }}>
                  <Text style={{ color: statoColor(t, p.stato), fontSize: 10, fontWeight: "700" }}>{p.stato}</Text>
                </View>
              </View>
              {p.controparte ? <Text style={{ color: t.onSurfaceTertiary, fontSize: 12, marginTop: 2 }} numberOfLines={1}>vs {p.controparte}</Text> : null}
            </View>
            <Feather name="chevron-right" size={18} color={t.onSurfaceTertiary} />
          </Pressable>
        ))}
      </ScrollView>

      <Modal visible={showEdit} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => setShowEdit(false)}>
        <SafeAreaProvider>
          <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: t.surface }}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
              <Header variant="hero" title="Modifica cliente" onBack={() => setShowEdit(false)} />
              <ScrollView contentContainerStyle={{ padding: SPACING.lg }}>
                <View style={{ flexDirection: "row", gap: 8, marginBottom: SPACING.md }}>
                  {["persona", "azienda"].map((tp) => (
                    <Pressable key={tp} onPress={() => setEditForm({ ...editForm, tipo: tp })} style={{ flex: 1, padding: 10, borderRadius: RADIUS.md, backgroundColor: editForm.tipo === tp ? t.brand : t.surfaceSecondary, alignItems: "center", borderWidth: 1, borderColor: t.border }}>
                      <Text style={{ color: editForm.tipo === tp ? t.onBrand : t.onSurfaceSecondary, textTransform: "capitalize", fontWeight: "600" }}>{tp}</Text>
                    </Pressable>
                  ))}
                </View>
                {[
                  ...(editForm.tipo === "azienda"
                    ? [["ragione_sociale", "Ragione Sociale*"], ["partita_iva", "Partita IVA"]]
                    : [["nome", "Nome*"], ["cognome", "Cognome*"]]),
                  ["codice_fiscale", "Codice Fiscale"],
                  ["email", "Email"],
                  ["telefono", "Telefono"],
                  ["pec", "PEC"],
                  ["indirizzo", "Indirizzo"],
                  ["citta", "Città"],
                  ["cap", "CAP"],
                ].map(([k, l]) => (
                  <View key={k} style={{ marginBottom: SPACING.sm }}>
                    <Text style={[s.lbl, { color: t.onSurfaceSecondary }]}>{l}</Text>
                    <TextInput
                      testID={`edit-cliente-${k}`}
                      value={editForm[k] || ""}
                      onChangeText={(v) => setEditForm({ ...editForm, [k]: v })}
                      style={[s.input, { backgroundColor: t.surfaceSecondary, color: t.onSurface, borderColor: t.border }]}
                    />
                  </View>
                ))}
                <Pressable testID="submit-edit-cliente" onPress={salvaModifiche} disabled={saving} style={{ marginTop: SPACING.md, backgroundColor: t.brand, padding: SPACING.md, borderRadius: RADIUS.md, alignItems: "center", opacity: saving ? 0.6 : 1 }}>
                  <Text style={{ color: t.onBrand, fontWeight: "700" }}>{saving ? "Salvataggio..." : "Salva modifiche"}</Text>
                </Pressable>
              </ScrollView>
            </KeyboardAvoidingView>
          </SafeAreaView>
        </SafeAreaProvider>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  infoCard: { borderRadius: RADIUS.lg, padding: SPACING.lg, gap: 8, marginBottom: SPACING.lg },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  section: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5, marginBottom: SPACING.sm },
  row: { flexDirection: "row", alignItems: "center", gap: SPACING.md, padding: SPACING.md, borderRadius: RADIUS.lg, marginBottom: SPACING.sm },
  rowIcon: { width: 40, height: 40, borderRadius: RADIUS.md, alignItems: "center", justifyContent: "center" },
  searchBox: { flexDirection: "row", alignItems: "center", borderRadius: RADIUS.md, borderWidth: 1, paddingHorizontal: SPACING.md, paddingVertical: 10, marginBottom: SPACING.sm },
  lbl: { fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  input: { borderWidth: 1, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.md, fontSize: 14 },
});
