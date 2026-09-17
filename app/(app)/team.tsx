import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Alert, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "@/src/ThemeContext";
import { useAuth } from "@/src/AuthContext";
import { api } from "@/src/api";
import { SPACING, RADIUS, SHADOW } from "@/src/theme";
import Header from "@/src/components/Header";
import SwipeBackScreen from "@/src/components/SwipeBackScreen";

const RUOLI = ["Amministratore", "Avvocato", "Collaboratore", "Segreteria"];

export default function Team() {
  const { t } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [membri, setMembri] = React.useState<any[]>([]);
  const [inviti, setInviti] = React.useState<any[]>([]);
  const [showInvite, setShowInvite] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [ruolo, setRuolo] = React.useState("Collaboratore");
  const [ultimoToken, setUltimoToken] = React.useState("");

  const load = React.useCallback(async () => {
    try {
      const r = await api.get("/team");
      setMembri(r.membri);
      setInviti(r.inviti_pendenti);
    } catch (e: any) {
      Alert.alert("Accesso negato", e.message || "Non hai i permessi per gestire il team");
      router.back();
    }
  }, [router]);

  React.useEffect(() => { load(); }, [load]);

  const invita = async () => {
    if (!email.trim()) return;
    try {
      const r = await api.post("/team/invite", { email: email.trim(), ruolo });
      setUltimoToken(r.invite_token);
      setEmail("");
      load();
    } catch (e: any) {
      Alert.alert("Errore", e.message);
    }
  };

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
    <SwipeBackScreen edges={["top"]} style={{ flex: 1, backgroundColor: t.surfaceSecondary }}>
      <Header
        variant="hero"
        title="Team & Ruoli"
        onBack={() => router.back()}
        right={
          <Pressable testID="team-invite-btn" onPress={() => setShowInvite(true)} style={{ width: 38, height: 38, borderRadius: RADIUS.pill, alignItems: "center", justifyContent: "center", backgroundColor: t.brand }}>
            <Feather name="user-plus" size={19} color={t.onBrand} />
          </Pressable>
        }
      />

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

        {inviti.length > 0 ? (
          <>
            <Text style={[s.section, { color: t.onSurfaceSecondary }]}>INVITI IN ATTESA</Text>
            {inviti.map((i) => (
              <View key={i.id} style={[s.card, { backgroundColor: t.surface }, SHADOW.card]}>
                <Text style={{ color: t.onSurface, fontWeight: "600" }}>{i.email}</Text>
                <Text style={{ color: t.onSurfaceTertiary, fontSize: 12, marginTop: 2 }}>Ruolo: {i.ruolo} · Codice: {i.token}</Text>
              </View>
            ))}
          </>
        ) : null}
      </ScrollView>

      <Modal visible={showInvite} animationType="slide" transparent onRequestClose={() => setShowInvite(false)}>
        <View style={s.modalOverlay}>
          <View style={[s.modalCard, { backgroundColor: t.surface, borderColor: t.border }]}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: SPACING.md }}>
              <Text style={{ color: t.onSurface, fontSize: 18, fontWeight: "800" }}>Invita collaboratore</Text>
              <Pressable onPress={() => { setShowInvite(false); setUltimoToken(""); }}><Feather name="x" size={20} color={t.onSurface} /></Pressable>
            </View>
            <Text style={s.lbl}>Email</Text>
            <TextInput
              testID="team-invite-email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="collega@studio.it"
              placeholderTextColor={t.onSurfaceTertiary}
              style={[s.input, { backgroundColor: t.surfaceSecondary, color: t.onSurface, borderColor: t.border }]}
            />
            <Text style={[s.lbl, { marginTop: SPACING.md }]}>Ruolo</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {RUOLI.map((r) => (
                <Pressable key={r} onPress={() => setRuolo(r)} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: RADIUS.pill, backgroundColor: ruolo === r ? t.brand : t.surfaceSecondary, borderWidth: 1, borderColor: t.border }}>
                  <Text style={{ color: ruolo === r ? t.onBrand : t.onSurfaceSecondary, fontSize: 12 }}>{r}</Text>
                </Pressable>
              ))}
            </ScrollView>
            {ultimoToken ? (
              <View style={{ marginTop: SPACING.md, padding: SPACING.md, borderRadius: RADIUS.md, backgroundColor: t.brandSecondary }}>
                <Text style={{ color: t.onBrandSecondary, fontSize: 12 }}>
                  Invito creato. Se l'email non è configurata, condividi manualmente questo codice: {"\n"}
                  <Text style={{ fontWeight: "800" }}>{ultimoToken}</Text>
                </Text>
              </View>
            ) : null}
            <Pressable testID="team-invite-submit" onPress={invita} style={{ marginTop: SPACING.lg, backgroundColor: t.brand, padding: SPACING.md, borderRadius: RADIUS.md, alignItems: "center" }}>
              <Text style={{ color: t.onBrand, fontWeight: "700" }}>Invia invito</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SwipeBackScreen>
  );
}

const s = StyleSheet.create({
  roundBtn: { width: 38, height: 38, borderRadius: RADIUS.pill, alignItems: "center", justifyContent: "center" },
  section: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5, marginTop: SPACING.lg, marginBottom: SPACING.sm },
  card: { padding: SPACING.md, borderRadius: RADIUS.lg, marginBottom: SPACING.sm },
  tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.pill },
  lbl: { fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: SPACING.xs, color: "#64748B" },
  input: { borderWidth: 1, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.md, fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: "#00000088", justifyContent: "flex-end" },
  modalCard: { padding: SPACING.lg, borderTopLeftRadius: RADIUS.lg, borderTopRightRadius: RADIUS.lg, borderWidth: 1, paddingBottom: SPACING.xxl },
});
