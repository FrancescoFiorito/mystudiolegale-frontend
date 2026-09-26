
import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { useTheme } from "@/src/ThemeContext";
import { api } from "@/src/api";
import { SPACING, RADIUS, SHADOW } from "@/src/theme";
import Header from "@/src/components/Header";

export default function Notifiche() {
  const { t } = useTheme();
  const router = useRouter();
  const [items, setItems] = React.useState<any[] | null>(null);

  const load = React.useCallback(async () => {
    try { setItems(await api.get("/notifiche")); } catch { setItems([]); }
  }, []);
  // useFocusEffect invece di useEffect: tornando su questa schermata
  // devono comparire le notifiche arrivate nel frattempo.
  useFocusEffect(React.useCallback(() => { load(); }, [load]));

  const markRead = async (id: string) => { await api.patch(`/notifiche/${id}/read`); load(); };

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: t.surfaceSecondary }}>
      <Header variant="hero" title="Notifiche" onBack={() => router.back()} backTestID="back-btn" />
      <ScrollView contentContainerStyle={{ padding: SPACING.lg }}>
        {!items ? <ActivityIndicator color={t.brand} /> : items.length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: SPACING.xxl }}>
            <Feather name="bell-off" size={40} color={t.onSurfaceTertiary} />
            <Text style={{ color: t.onSurfaceTertiary, marginTop: SPACING.sm }}>Nessuna notifica</Text>
          </View>
        ) : items.map((n) => (
          <Pressable key={n.id} testID={`notif-${n.id}`} onPress={() => !n.letta && markRead(n.id)} style={[s.card, { backgroundColor: n.letta ? t.surface : t.brandTertiary }, SHADOW.card]}>
            <Feather name={n.tipo === "warning" ? "alert-triangle" : n.tipo === "error" ? "alert-circle" : "info"} size={18} color={n.letta ? t.onSurfaceTertiary : t.brand} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: t.onSurface, fontWeight: n.letta ? "500" : "700" }}>{n.titolo}</Text>
              {n.messaggio ? <Text style={{ color: t.onSurfaceSecondary, fontSize: 13, marginTop: 2 }}>{n.messaggio}</Text> : null}
              <Text style={{ color: t.onSurfaceTertiary, fontSize: 11, marginTop: 4 }}>{new Date(n.created_at).toLocaleString("it-IT")}</Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  roundBtn: { width: 38, height: 38, borderRadius: RADIUS.pill, alignItems: "center", justifyContent: "center" },
  card: { flexDirection: "row", gap: SPACING.md, alignItems: "flex-start", padding: SPACING.md, borderRadius: RADIUS.lg, marginBottom: SPACING.sm },
});
