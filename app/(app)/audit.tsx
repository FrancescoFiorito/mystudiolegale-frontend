import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "@/src/ThemeContext";
import { api } from "@/src/api";
import { SPACING, RADIUS, SHADOW } from "@/src/theme";
import Header from "@/src/components/Header";
import SwipeBackScreen from "@/src/components/SwipeBackScreen";

const ENTITA = ["", "pratica", "cliente", "documento", "parcella", "cartella", "team", "utente"];

const AZIONE_ICON: Record<string, string> = {
  creata: "plus-circle", creato: "plus-circle", modificata: "edit-2", modificato: "edit-2",
  eliminata: "trash-2", eliminato: "trash-2", caricato: "upload", login: "log-in",
  registrazione: "user-plus", emessa: "check-circle",
};

export default function AuditLog() {
  const { t } = useTheme();
  const router = useRouter();
  const [logs, setLogs] = React.useState<any[]>([]);
  const [filtro, setFiltro] = React.useState("");

  const load = React.useCallback(async () => {
    try {
      const q = filtro ? `?entita=${filtro}` : "";
      setLogs(await api.get(`/audit-log${q}`));
    } catch (e: any) {
      Alert.alert("Accesso negato", e.message || "Non hai i permessi per vedere il registro attività");
      router.back();
    }
  }, [filtro, router]);

  React.useEffect(() => { load(); }, [load]);

  return (
    <SwipeBackScreen edges={["top"]} style={{ flex: 1, backgroundColor: t.surfaceSecondary }}>
      <Header variant="hero" title="Registro attività" onBack={() => router.back()} />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 52 }} contentContainerStyle={{ paddingHorizontal: SPACING.lg, gap: 8, alignItems: "center", height: 52 }}>
        {ENTITA.map((e) => (
          <Pressable key={e} onPress={() => setFiltro(e)} style={{ flexShrink: 0, paddingHorizontal: 12, paddingVertical: 8, borderRadius: RADIUS.pill, backgroundColor: filtro === e ? t.brand : t.surfaceSecondary, borderWidth: 1, borderColor: t.border }}>
            <Text style={{ color: filtro === e ? t.onBrand : t.onSurfaceSecondary, fontSize: 12, textTransform: "capitalize" }}>{e || "Tutto"}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={{ padding: SPACING.lg, paddingTop: 0, paddingBottom: SPACING.xxxl }}>
        {logs.length === 0 ? <Text style={{ color: t.onSurfaceTertiary, fontStyle: "italic", textAlign: "center", marginTop: SPACING.xl }}>Nessuna attività registrata</Text> : null}
        {logs.map((l) => (
          <View key={l.id} style={[s.row, { backgroundColor: t.surface }, SHADOW.card]}>
            <View style={[s.iconWrap, { backgroundColor: t.brandTertiary }]}>
              <Feather name={(AZIONE_ICON[l.azione] || "activity") as any} size={16} color={t.brand} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: t.onSurface, fontSize: 13 }}>
                <Text style={{ fontWeight: "700" }}>{l.user_email}</Text> · {l.azione} · {l.entita}
              </Text>
              {l.dettagli ? <Text style={{ color: t.onSurfaceSecondary, fontSize: 12, marginTop: 2 }}>{l.dettagli}</Text> : null}
              <Text style={{ color: t.onSurfaceTertiary, fontSize: 11, marginTop: 2, fontVariant: ["tabular-nums"] }}>{l.created_at?.slice(0, 19).replace("T", " ")}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SwipeBackScreen>
  );
}

const s = StyleSheet.create({
  roundBtn: { width: 38, height: 38, borderRadius: RADIUS.pill, alignItems: "center", justifyContent: "center" },
  row: { flexDirection: "row", gap: SPACING.md, padding: SPACING.md, borderRadius: RADIUS.lg, marginBottom: SPACING.sm, alignItems: "flex-start" },
  iconWrap: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
});
