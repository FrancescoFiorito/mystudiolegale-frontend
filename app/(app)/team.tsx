import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "@/src/ThemeContext";
import { useAuth } from "@/src/AuthContext";
import { api } from "@/src/api";
import { SPACING, RADIUS, SHADOW } from "@/src/theme";
import Header from "@/src/components/Header";

const RUOLI = ["Amministratore", "Avvocato", "Collaboratore", "Segreteria"];

export default function Team() {
  const { t } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [membri, setMembri] = React.useState<any[]>([]);

  const load = React.useCallback(async () => {
    try {
      const r = await api.get("/team");
      setMembri(r.membri);
    } catch (e: any) {
      Alert.alert("Accesso negato", e.message || "Non hai i permessi per gestire il team");
      router.back();
    }
  }, [router]);

  React.useEffect(() => { load(); }, [load]);

  const cambiaRuolo = async (userId: string, nuovoRuolo: string) => {
    await api.patch(`/team/${userId}/ruolo`, { ruolo: nuovoRuolo });
    load();
  };

  const rimuovi = (m: any) => {
    Alert.alert("Rimuovi membro", `Rimuovere ${m.email} dallo studio?`, [
      { text: "Annulla", style: "cancel" },
      { text: "Rimuovi", style: "destructive", onPress: async () => { await api.del(`/team/${m.id}`); load(); } },
    ]);
  };

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: t.surfaceSecondary }}>
      <Header variant="hero" title="Team & Ruoli" onBack={() => router.back()} />

      <ScrollView contentContainerStyle={{ padding: SPACING.lg, paddingBottom: SPACING.xxxl }}>
        <Text style={[s.section, { color: t.onSurfaceSecondary }]}>MEMBRI DELLO STUDIO</Text>
        {membri.map((m) => (
          <View key={m.id} style={[s.card, { backgroundColor: t.surface }, SHADOW.card]}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: t.onSurface, fontWeight: "700" }}>{m.nome ? `${m.nome} ${m.cognome || ""}`.trim() : m.email}</Text>
                <Text style={{ color: t.onSurfaceTertiary, fontSize: 12, marginTop: 2 }}>{m.email}</Text>
              </View>
              {m.id !== user?.id ? (
                <Pressable onPress={() => rimuovi(m)} hitSlop={8}><Feather name="user-x" size={18} color={t.error} /></Pressable>
              ) : (
                <View style={[s.tag, { backgroundColor: t.brandSecondary }]}><Text style={{ color: t.onBrandSecondary, fontSize: 10, fontWeight: "700" }}>TU</Text></View>
              )}
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginTop: SPACING.sm }}>
              {RUOLI.map((r) => (
                <Pressable
                  key={r}
                  disabled={m.id === user?.id}
                  onPress={() => cambiaRuolo(m.id, r)}
                  style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: RADIUS.pill, backgroundColor: m.ruolo === r ? t.brand : "transparent", borderWidth: 1, borderColor: m.ruolo === r ? t.brand : t.border, opacity: m.id === user?.id ? 0.6 : 1 }}
                >
                  <Text style={{ color: m.ruolo === r ? t.onBrand : t.onSurfaceSecondary, fontSize: 11, fontWeight: "600" }}>{r}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  roundBtn: { width: 38, height: 38, borderRadius: RADIUS.pill, alignItems: "center", justifyContent: "center" },
  section: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5, marginTop: SPACING.lg, marginBottom: SPACING.sm },
  card: { padding: SPACING.md, borderRadius: RADIUS.lg, marginBottom: SPACING.sm },
  tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.pill },
});
