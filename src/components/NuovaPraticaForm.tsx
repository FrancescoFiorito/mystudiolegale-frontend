import React from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "@/src/ThemeContext";
import { SPACING, RADIUS } from "@/src/theme";

// Corpo del form "Nuova Pratica", condiviso fra le due schermate che possono
// ospitarlo (Home e Archivio): lo stato del form resta di proprieta' di chi
// lo ospita (props controllate), cosi' non si perde se l'utente esce
// temporaneamente per creare un nuovo cliente al volo (vedi onNuovoCliente).
type Props = {
  form: any;
  setForm: (updater: any) => void;
  clienti: any[];
  clienteQ: string;
  setClienteQ: (v: string) => void;
  saving: boolean;
  onSubmit: () => void;
  onNuovoCliente: () => void;
};

export default function NuovaPraticaForm({ form, setForm, clienti, clienteQ, setClienteQ, saving, onSubmit, onNuovoCliente }: Props) {
  const { t } = useTheme();

  const clientiFiltrati = React.useMemo(() => {
    if (!clienteQ.trim()) return [];
    const qq = clienteQ.trim().toLowerCase();
    return clienti.filter((c) => (c.ragione_sociale || `${c.nome} ${c.cognome || ""}`).toLowerCase().includes(qq));
  }, [clienti, clienteQ]);

  return (
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
      {form.cliente_id ? (
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: SPACING.sm, gap: 8 }}>
          <View style={{ flex: 1, paddingHorizontal: 12, paddingVertical: 10, borderRadius: RADIUS.md, backgroundColor: t.brandSecondary, flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Feather name="user-check" size={14} color={t.brand} />
            <Text style={{ color: t.brand, fontSize: 13, fontWeight: "700", flex: 1 }} numberOfLines={1}>
              {(clienti.find((c) => c.id === form.cliente_id)?.ragione_sociale) || `${clienti.find((c) => c.id === form.cliente_id)?.nome || ""} ${clienti.find((c) => c.id === form.cliente_id)?.cognome || ""}`.trim()}
            </Text>
          </View>
          <Pressable testID="cliente-deseleziona" onPress={() => setForm({ ...form, cliente_id: null })} style={{ padding: 8 }}>
            <Feather name="x" size={16} color={t.onSurfaceTertiary} />
          </Pressable>
        </View>
      ) : (
        <>
          <View style={[s.searchBox, { backgroundColor: t.surfaceSecondary, marginBottom: SPACING.sm }]}>
            <Feather name="search" size={15} color={t.onSurfaceTertiary} />
            <TextInput
              testID="new-pratica-cliente-search"
              value={clienteQ}
              onChangeText={setClienteQ}
              placeholder="Cerca cliente registrato..."
              placeholderTextColor={t.onSurfaceTertiary}
              style={{ flex: 1, color: t.onSurface, fontSize: 13 }}
            />
          </View>
          {clienteQ.trim() ? (
            <ScrollView style={{ maxHeight: 150, marginBottom: SPACING.sm }} nestedScrollEnabled keyboardShouldPersistTaps="handled">
              {clientiFiltrati.length === 0 ? (
                <Text style={{ color: t.onSurfaceTertiary, fontSize: 12, fontStyle: "italic", paddingVertical: 6 }}>Nessun cliente trovato</Text>
              ) : clientiFiltrati.map((c) => (
                <Pressable key={c.id} testID={`cliente-opzione-${c.id}`} onPress={() => { setForm({ ...form, cliente_id: c.id }); setClienteQ(""); }} style={{ paddingVertical: 9, paddingHorizontal: 10, borderRadius: RADIUS.md, flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: t.brandTertiary, alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ color: t.brand, fontSize: 11, fontWeight: "700" }}>{(c.ragione_sociale || c.nome || "?").slice(0, 2).toUpperCase()}</Text>
                  </View>
                  <Text style={{ color: t.onSurface, fontSize: 13, flex: 1 }} numberOfLines={1}>{c.ragione_sociale || `${c.nome} ${c.cognome || ""}`}</Text>
                </Pressable>
              ))}
            </ScrollView>
          ) : null}
          <Pressable
            testID="vai-nuovo-cliente"
            onPress={onNuovoCliente}
            style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 9, paddingHorizontal: 12, borderRadius: RADIUS.pill, borderWidth: 1, borderColor: t.brand, alignSelf: "flex-start", marginBottom: SPACING.md }}
          >
            <Feather name="user-plus" size={14} color={t.brand} />
            <Text style={{ color: t.brand, fontSize: 12, fontWeight: "700" }}>Nuovo cliente</Text>
          </Pressable>
        </>
      )}
      <Text style={[s.lbl, { color: t.onSurfaceSecondary }]}>Priorità</Text>
      <View style={{ flexDirection: "row", gap: 8, marginBottom: SPACING.lg }}>
        {["bassa", "media", "alta"].map((p) => (
          <Pressable key={p} testID={`priorita-${p}`} onPress={() => setForm({ ...form, priorita: p })} style={{ flex: 1, paddingVertical: 10, borderRadius: RADIUS.md, backgroundColor: form.priorita === p ? t.brand : t.surfaceSecondary, borderWidth: 1, borderColor: t.border, alignItems: "center" }}>
            <Text style={{ color: form.priorita === p ? t.onBrand : t.onSurfaceSecondary, fontSize: 12, fontWeight: "600", textTransform: "capitalize" }}>{p}</Text>
          </Pressable>
        ))}
      </View>
      <Pressable testID="submit-new-pratica" onPress={onSubmit} disabled={saving} style={[s.submit, { backgroundColor: t.brand, opacity: saving ? 0.6 : 1 }]}>
        <Text style={{ color: t.onBrand, fontWeight: "700" }}>{saving ? "Salvataggio..." : "Crea pratica"}</Text>
      </Pressable>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  searchBox: { flexDirection: "row", alignItems: "center", borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: 10 },
  input: { borderWidth: 1, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: 10, fontSize: 14 },
  lbl: { fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: SPACING.xs },
  submit: { marginTop: SPACING.sm, paddingVertical: SPACING.md, borderRadius: RADIUS.md, alignItems: "center" },
});
