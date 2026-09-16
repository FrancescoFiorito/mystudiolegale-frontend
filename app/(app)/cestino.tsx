import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "@/src/ThemeContext";
import { api } from "@/src/api";
import { SPACING, RADIUS, SHADOW } from "@/src/theme";
import Header from "@/src/components/Header";

type CestinoItem = { tipo: "pratica" | "cliente"; id: string; label: string; sub: string; deleted_at: string };

export default function Cestino() {
  const { t } = useTheme();
  const router = useRouter();
  const [items, setItems] = React.useState<CestinoItem[] | null>(null);

  const load = React.useCallback(async () => {
    const [pratiche, clienti] = await Promise.all([
      api.get("/pratiche/cestino/lista").catch(() => []),
      api.get("/clienti/cestino/lista").catch(() => []),
    ]);
    const unified: CestinoItem[] = [
      ...pratiche.map((p: any) => ({ tipo: "pratica" as const, id: p.id, label: p.oggetto, sub: p.numero, deleted_at: p.deleted_at })),
      ...clienti.map((c: any) => ({ tipo: "cliente" as const, id: c.id, label: c.ragione_sociale || `${c.nome} ${c.cognome || ""}`.trim(), sub: "Cliente", deleted_at: c.deleted_at })),
    ].sort((a, b) => (b.deleted_at || "").localeCompare(a.deleted_at || ""));
    setItems(unified);
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const ripristina = (it: CestinoItem) => {
    Alert.alert("Ripristina", `Ripristinare "${it.label}"?`, [
      { text: "Annulla", style: "cancel" },
      {
        text: "Ripristina",
        onPress: async () => {
          await api.post(`/${it.tipo === "pratica" ? "pratiche" : "clienti"}/${it.id}/ripristina`);
          load();
        },
      },
    ]);
  };

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: t.surfaceSecondary }}>
      <Header variant="hero" title="Cestino" onBack={() => router.back()} />

      <Text style={{ color: t.onSurfaceTertiary, fontSize: 12, padding: SPACING.lg, paddingBottom: 0 }}>
        Pratiche e clienti eliminati vengono cancellati definitivamente dopo 30 giorni.
      </Text>

      <ScrollView contentContainerStyle={{ padding: SPACING.lg, paddingBottom: SPACING.xxxl }}>
        {items === null ? <ActivityIndicator color={t.brand} /> : items.length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: SPACING.xxl }}>
            <Feather name="trash-2" size={40} color={t.onSurfaceTertiary} />
            <Text style={{ color: t.onSurfaceTertiary, marginTop: SPACING.sm }}>Il cestino è vuoto</Text>
          </View>
        ) : items.map((it) => (
          <View key={`${it.tipo}-${it.id}`} testID={`cestino-${it.tipo}-${it.id}`} style={[s.row, { backgroundColor: t.surface }, SHADOW.card]}>
            <View style={[s.rowIcon, { backgroundColor: t.brandSecondary }]}>
              <Feather name={it.tipo === "pratica" ? "folder" : "user"} size={18} color={t.brand} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: t.onSurface, fontWeight: "700" }} numberOfLines={1}>{it.label}</Text>
              <Text style={{ color: t.onSurfaceTertiary, fontSize: 12, marginTop: 2 }}>{it.sub} · eliminato il {it.deleted_at?.slice(0, 10)}</Text>
            </View>
            <Pressable testID={`ripristina-${it.tipo}-${it.id}`} onPress={() => ripristina(it)} style={[s.restoreBtn, { backgroundColor: t.brand }]}>
              <Feather name="rotate-ccw" size={16} color={t.onBrand} />
            </Pressable>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: SPACING.md, padding: SPACING.md, borderRadius: RADIUS.lg, marginBottom: SPACING.sm },
  rowIcon: { width: 40, height: 40, borderRadius: RADIUS.md, alignItems: "center", justifyContent: "center" },
  restoreBtn: { width: 36, height: 36, borderRadius: RADIUS.pill, alignItems: "center", justifyContent: "center" },
});
