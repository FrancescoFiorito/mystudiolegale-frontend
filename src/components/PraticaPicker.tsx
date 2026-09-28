import React from "react";
import { View, Text, ScrollView, TextInput, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "@/src/ThemeContext";
import { SPACING, RADIUS } from "@/src/theme";

// Collegamento (facoltativo) a una pratica: stesso schema di ricerca +
// selezione usato per il cliente in NuovaPraticaForm, invece di una lista
// orizzontale di tutte le pratiche poco pratica da scorrere quando sono
// tante.
type Props = {
  pratiche: any[];
  praticaId: string | null;
  onChange: (id: string | null) => void;
  helperText?: string;
};

export default function PraticaPicker({ pratiche, praticaId, onChange, helperText }: Props) {
  const { t } = useTheme();
  const [q, setQ] = React.useState("");

  const praticheFiltrate = React.useMemo(() => {
    if (!q.trim()) return [];
    const qq = q.trim().toLowerCase();
    return pratiche.filter((p) => (p.oggetto || "").toLowerCase().includes(qq));
  }, [pratiche, q]);

  const selezionata = pratiche.find((p) => p.id === praticaId);

  return (
    <View style={{ marginTop: SPACING.md }}>
      <Text style={{ fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: SPACING.xs, color: t.onSurfaceSecondary }}>
        Collega a una pratica (facoltativo)
      </Text>
      {praticaId ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View style={{ flex: 1, paddingHorizontal: 12, paddingVertical: 10, borderRadius: RADIUS.md, backgroundColor: t.brandSecondary, flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Feather name="folder" size={14} color={t.brand} />
            <Text style={{ color: t.brand, fontSize: 13, fontWeight: "700", flex: 1 }} numberOfLines={1}>
              {selezionata?.oggetto || "Pratica"}
            </Text>
          </View>
          <Pressable testID="pratica-picker-deseleziona" onPress={() => onChange(null)} style={{ padding: 8 }}>
            <Feather name="x" size={16} color={t.onSurfaceTertiary} />
          </Pressable>
        </View>
      ) : (
        <>
          <View style={{ flexDirection: "row", alignItems: "center", borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: 10, backgroundColor: t.surfaceSecondary }}>
            <Feather name="search" size={15} color={t.onSurfaceTertiary} />
            <TextInput
              testID="pratica-picker-search"
              value={q}
              onChangeText={setQ}
              placeholder="Cerca pratica..."
              placeholderTextColor={t.onSurfaceTertiary}
              style={{ flex: 1, marginLeft: 8, color: t.onSurface, fontSize: 13 }}
            />
          </View>
          {q.trim() ? (
            <ScrollView style={{ maxHeight: 150, marginTop: SPACING.sm }} nestedScrollEnabled keyboardShouldPersistTaps="handled">
              {praticheFiltrate.length === 0 ? (
                <Text style={{ color: t.onSurfaceTertiary, fontSize: 12, fontStyle: "italic", paddingVertical: 6 }}>Nessuna pratica trovata</Text>
              ) : (
                praticheFiltrate.map((p) => (
                  <Pressable
                    key={p.id}
                    testID={`pratica-picker-opzione-${p.id}`}
                    onPress={() => { onChange(p.id); setQ(""); }}
                    style={{ paddingVertical: 9, paddingHorizontal: 10, borderRadius: RADIUS.md, flexDirection: "row", alignItems: "center", gap: 8 }}
                  >
                    <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: t.brandTertiary, alignItems: "center", justifyContent: "center" }}>
                      <Feather name="folder" size={12} color={t.brand} />
                    </View>
                    <Text style={{ color: t.onSurface, fontSize: 13, flex: 1 }} numberOfLines={1}>{p.oggetto}</Text>
                  </Pressable>
                ))
              )}
            </ScrollView>
          ) : null}
        </>
      )}
      {helperText ? <Text style={{ color: t.onSurfaceTertiary, fontSize: 11, marginTop: 6 }}>{helperText}</Text> : null}
    </View>
  );
}
