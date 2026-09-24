
import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Modal, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTheme } from "@/src/ThemeContext";
import { api } from "@/src/api";
import { SPACING, RADIUS, SHADOW } from "@/src/theme";
import Header from "@/src/components/Header";
import SwipeToDelete from "@/src/components/SwipeToDelete";
import { useDebouncedValue } from "@/src/hooks/use-debounced-value";

export default function Clienti() {
  const { t } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ autoNew?: string; returnTo?: string; returnScreen?: string; _t?: string }>();
  const [items, setItems] = React.useState<any[] | null>(null);
  const [q, setQ] = React.useState("");
  const debouncedQ = useDebouncedValue(q, 300);
  const [show, setShow] = React.useState(false);
  const [form, setForm] = React.useState<any>({ nome: "", cognome: "", ragione_sociale: "", tipo: "persona", codice_fiscale: "", partita_iva: "", pec: "", email: "", telefono: "" });
  const [saving, setSaving] = React.useState(false);

  const load = React.useCallback(async (signal?: AbortSignal) => {
    try {
      setItems(await api.get(`/clienti?q=${encodeURIComponent(debouncedQ)}`, { signal }));
    } catch (e: any) {
      if (e?.name === "AbortError") return;
    }
  }, [debouncedQ]);

  // La ricerca e' gia' debounced (debouncedQ sopra); qui in piu' annulliamo
  // la richiesta precedente se una piu' recente parte prima che risponda,
  // cosi' una risposta "vecchia" arrivata in ritardo non sovrascrive quella
  // giusta (race condition).
  React.useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  // Se si arriva qui dal pulsante "Nuovo cliente" della creazione pratica
  // (vedi archivio.tsx), apre subito la modale di creazione. Clienti non
  // viene mai smontata dal cambio tab, quindi basta un ref locale (nessun
  // bisogno del meccanismo a livello di Archivio usato per l'altro caso).
  const handledAutoNewRef = React.useRef<string | undefined>(undefined);
  React.useEffect(() => {
    if (params.autoNew === "1" && params._t && handledAutoNewRef.current !== params._t) {
      handledAutoNewRef.current = params._t;
      setShow(true);
      router.setParams({ autoNew: "" });
    }
  }, [params.autoNew, params._t, router]);

  // "Nuova pratica" puo' essere aperta sia dalla Home sia da Archivio (vedi
  // dashboard.tsx e archivio.tsx): il ritorno dopo aver creato/annullato il
  // cliente deve riportare a quella stessa schermata, non sempre Archivio.
  const returnToPratica = (selectClienteId?: string) => {
    const dest = params.returnScreen === "dashboard" ? "/(app)/dashboard" : "/(app)/archivio";
    router.push({ pathname: dest, params: { tab: "pratiche", selectCliente: selectClienteId || "", reopenNew: "1", _t: String(Date.now()) } });
  };

  const create = async () => {
    if (!form.nome && !form.ragione_sociale) return;
    setSaving(true);
    try {
      const nuovo = await api.post("/clienti", form);
      setShow(false); setForm({ nome: "", cognome: "", ragione_sociale: "", tipo: "persona", codice_fiscale: "", partita_iva: "", pec: "", email: "", telefono: "" });
      load();
      if (params.returnTo === "pratica") {
        returnToPratica(nuovo.id);
      }
    } catch (e: any) {
      Alert.alert("Errore", e.message || "Impossibile salvare. Riprova.");
    } finally {
      setSaving(false);
    }
  };

  const eliminaCliente = (c: any) => {
    const name = c.ragione_sociale || `${c.nome} ${c.cognome || ""}`.trim();
    Alert.alert("Elimina cliente", `Eliminare "${name}"?`, [
      { text: "Annulla", style: "cancel" },
      {
        text: "Elimina",
        style: "destructive",
        onPress: async () => {
          await api.del(`/clienti/${c.id}`);
          load();
        },
      },
    ]);
  };

  const field = (k: string, l: string, opts: any = {}) => (
    <View style={{ marginBottom: SPACING.sm }}>
      <Text style={[s.lbl, { color: t.onSurfaceSecondary }]}>{l}</Text>
      <TextInput testID={`cliente-${k}`} value={form[k]} onChangeText={(v) => setForm({ ...form, [k]: v })} style={[s.input, { backgroundColor: t.surfaceSecondary, color: t.onSurface, borderColor: t.border }]} placeholderTextColor={t.onSurfaceTertiary} {...opts} />
    </View>
  );

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: t.surfaceSecondary }}>
      <Header variant="hero" title="Clienti" />
      <View style={{ backgroundColor: t.surface, paddingTop: SPACING.sm, paddingBottom: SPACING.md, borderBottomWidth: 1, borderBottomColor: t.border, marginTop: SPACING.xs }}>
        <View style={[s.searchBox, { backgroundColor: t.surfaceSecondary }]}>
          <Feather name="search" size={16} color={t.onSurfaceTertiary} />
          <TextInput testID="clienti-search" value={q} onChangeText={setQ} placeholder="Cerca cliente..." placeholderTextColor={t.onSurfaceTertiary} style={{ flex: 1, color: t.onSurface, fontSize: 14 }} />
        </View>
      </View>
      <ScrollView contentContainerStyle={{ padding: SPACING.lg }}>
        {!items ? <ActivityIndicator color={t.brand} /> : items.length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: SPACING.xxl }}>
            <Feather name="users" size={40} color={t.onSurfaceTertiary} />
            <Text style={{ color: t.onSurfaceTertiary, marginTop: SPACING.sm }}>Nessun cliente</Text>
          </View>
        ) : items.map((c) => {
          const name = c.ragione_sociale || `${c.nome} ${c.cognome || ""}`.trim();
          const initials = name.slice(0, 2).toUpperCase();
          return (
            <SwipeToDelete key={c.id} testID={`cliente-${c.id}`} onDelete={() => eliminaCliente(c)}>
              <Pressable testID={`cliente-${c.id}`} onPress={() => router.push({ pathname: "/(app)/cliente/[id]", params: { id: c.id } })} style={[s.row, { backgroundColor: t.surface }, SHADOW.card]}>
                <View style={{ width: 44, height: 44, borderRadius: RADIUS.pill, backgroundColor: t.brandTertiary, alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ color: t.brand, fontWeight: "700" }}>{initials}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: t.onSurface, fontWeight: "700" }}>{name}</Text>
                  {c.email ? <Text style={{ color: t.onSurfaceTertiary, fontSize: 12 }}>{c.email}</Text> : null}
                  {c.telefono ? <Text style={{ color: t.onSurfaceTertiary, fontSize: 12 }}>{c.telefono}</Text> : null}
                </View>
                <Feather name="chevron-right" size={18} color={t.onSurfaceTertiary} />
              </Pressable>
            </SwipeToDelete>
          );
        })}
      </ScrollView>

      <Pressable testID="new-cliente-fab" onPress={() => setShow(true)} style={[s.fab, { backgroundColor: t.brand }, SHADOW.floating]}>
        <Feather name="plus" size={22} color={t.onBrand} />
      </Pressable>

      <Modal visible={show} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => setShow(false)}>
        <SafeAreaProvider>
        <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: t.surface }}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
            <Header
              variant="hero"
              title="Nuovo Cliente"
              onBack={() => {
                setShow(false);
                // Se si era arrivati qui dalla creazione di una pratica e si
                // annulla senza salvare, si torna comunque alla pratica
                // (che riapre la sua modale) invece di lasciare l'utente
                // sulla lista Clienti, spaesato rispetto a cio' che stava facendo.
                if (params.returnTo === "pratica") {
                  returnToPratica();
                }
              }}
            />
            <ScrollView contentContainerStyle={{ padding: SPACING.lg }}>
              <View style={{ flexDirection: "row", gap: 8, marginBottom: SPACING.md }}>
                {["persona", "azienda"].map((tp) => (
                  <Pressable key={tp} onPress={() => setForm({ ...form, tipo: tp })} style={{ flex: 1, padding: 10, borderRadius: RADIUS.md, backgroundColor: form.tipo === tp ? t.brand : t.surfaceSecondary, alignItems: "center", borderWidth: 1, borderColor: t.border }}>
                    <Text style={{ color: form.tipo === tp ? t.onBrand : t.onSurfaceSecondary, textTransform: "capitalize", fontWeight: "600" }}>{tp}</Text>
                  </Pressable>
                ))}
              </View>
              {form.tipo === "persona" ? (<>{field("nome", "Nome*")}{field("cognome", "Cognome")}{field("codice_fiscale", "Codice Fiscale")}</>) : (<>{field("ragione_sociale", "Ragione Sociale*")}{field("partita_iva", "Partita IVA")}{field("codice_fiscale", "Codice Fiscale")}</>)}
              {field("email", "Email", { autoCapitalize: "none", keyboardType: "email-address" })}
              {field("telefono", "Telefono", { keyboardType: "phone-pad" })}
              {field("pec", "PEC", { autoCapitalize: "none" })}
              <Pressable testID="submit-cliente" onPress={create} disabled={saving} style={{ marginTop: SPACING.md, backgroundColor: t.brand, padding: SPACING.md, borderRadius: RADIUS.md, alignItems: "center", opacity: saving ? 0.6 : 1 }}>
                <Text style={{ color: t.onBrand, fontWeight: "700" }}>{saving ? "Salvataggio..." : "Salva cliente"}</Text>
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
  roundBtn: { width: 38, height: 38, borderRadius: RADIUS.pill, alignItems: "center", justifyContent: "center" },
  searchBox: { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: SPACING.lg, paddingHorizontal: SPACING.md, paddingVertical: 10, borderRadius: RADIUS.md },
  row: { flexDirection: "row", gap: SPACING.md, alignItems: "center", padding: SPACING.md, borderRadius: RADIUS.lg, marginBottom: SPACING.sm },
  lbl: { fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  input: { borderWidth: 1, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.md, fontSize: 14 },
  fab: { position: "absolute", right: SPACING.lg, bottom: 104, width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", zIndex: 50, elevation: 12 },
});
