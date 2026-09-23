
import React, { useEffect, useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "@/src/ThemeContext";
import { useAuth } from "@/src/AuthContext";
import { api } from "@/src/api";
import { SPACING, RADIUS, SHADOW } from "@/src/theme";

const RESEND_COOLDOWN_SECONDS = 60;

export default function VerifyEmail() {
  const { t } = useTheme();
  const { user, refresh, logout } = useAuth();
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  const resend = async () => {
    setErr("");
    setResending(true);
    try {
      await api.post("/auth/resend-verification");
      setCooldown(RESEND_COOLDOWN_SECONDS);
      setToken("");
      Alert.alert("Codice reinviato", "Controlla la tua email per il nuovo codice.");
    } catch (e: any) {
      setErr(e.message || "Impossibile reinviare il codice, riprova");
    } finally {
      setResending(false);
    }
  };

  const submit = async () => {
    setErr("");
    if (token.trim().length !== 6) return setErr("Inserisci il codice a 6 cifre ricevuto via email");
    setLoading(true);
    try {
      await api.post("/auth/verify-email", { token: token.trim() });
      await refresh();
    } catch (e: any) {
      setErr(e.message || "Codice non valido o scaduto");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[s.wrap, { backgroundColor: t.brand }]} edges={["top"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <View style={s.hero}>
            <View style={[s.logoBox, { backgroundColor: "rgba(255,255,255,0.16)" }]}>
              <Feather name="mail" size={28} color={t.onBrand} />
            </View>
            <Text style={[s.title, { color: t.onBrand }]}>Verifica la tua email</Text>
            <Text style={[s.subtitle, { color: t.onBrand, opacity: 0.8 }]}>
              {user?.email ? `Abbiamo mandato un codice a ${user.email}` : "Inserisci il codice ricevuto via email"}
            </Text>
          </View>

          <View style={[s.card, { backgroundColor: t.surface }, SHADOW.floating]}>
            <View style={s.codeHeaderRow}>
              <Text style={[s.label, { color: t.onSurfaceSecondary, marginBottom: 0 }]}>Codice di verifica</Text>
              {cooldown > 0 ? (
                <Text style={{ color: t.onSurfaceTertiary, fontSize: 12 }}>Rinvia tra {cooldown}s</Text>
              ) : (
                <Pressable testID="resend-verification-button" onPress={resend} disabled={resending} hitSlop={6}>
                  <Text style={{ color: t.brand, fontSize: 12, fontWeight: "700", opacity: resending ? 0.5 : 1 }}>
                    {resending ? "Invio..." : "Rinvia codice"}
                  </Text>
                </Pressable>
              )}
            </View>
            <View style={[s.inputWrap, { backgroundColor: t.surfaceSecondary, borderColor: t.border, marginTop: SPACING.xs }]}>
              <Feather name="hash" size={17} color={t.onSurfaceTertiary} />
              <TextInput
                testID="verify-email-token-input"
                style={[s.input, s.codeInput, { color: t.onSurface }]}
                placeholder="000000"
                placeholderTextColor={t.onSurfaceTertiary}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
                value={token}
                onChangeText={(v) => setToken(v.replace(/[^0-9]/g, ""))}
              />
            </View>

            {err ? <Text style={[s.err, { color: t.error }]} testID="verify-email-error">{err}</Text> : null}

            <Pressable testID="verify-email-submit-button" onPress={submit} disabled={loading} style={[s.btn, { backgroundColor: t.brand, opacity: loading ? 0.6 : 1, marginTop: SPACING.xl }]}>
              <Text style={[s.btnTxt, { color: t.onBrand }]}>{loading ? "Verifica..." : "Verifica email"}</Text>
            </Pressable>

            <Pressable testID="verify-email-logout" onPress={logout} style={s.linkBtn}>
              <Text style={{ color: t.onSurfaceSecondary, textAlign: "center" }}>Non sei tu? <Text style={{ color: t.brand, fontWeight: "700" }}>Esci</Text></Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1 },
  hero: { alignItems: "center", justifyContent: "center", paddingTop: SPACING.xl, paddingBottom: SPACING.xxxl },
  logoBox: { width: 64, height: 64, borderRadius: RADIUS.lg, alignItems: "center", justifyContent: "center", marginBottom: SPACING.md },
  title: { fontSize: 22, fontWeight: "800", letterSpacing: -0.3 },
  subtitle: { fontSize: 14, marginTop: SPACING.xs, textAlign: "center", paddingHorizontal: SPACING.xl },
  card: { flex: 1, borderTopLeftRadius: RADIUS.lg * 1.4, borderTopRightRadius: RADIUS.lg * 1.4, padding: SPACING.xl, paddingTop: SPACING.xxl },
  label: { fontSize: 12, fontWeight: "600", marginBottom: SPACING.xs },
  codeHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  inputWrap: { flexDirection: "row", alignItems: "center", gap: SPACING.sm, borderWidth: 1, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md },
  input: { flex: 1, paddingVertical: SPACING.md, fontSize: 15 },
  codeInput: { fontSize: 20, fontWeight: "700", letterSpacing: 6 },
  btn: { paddingVertical: SPACING.md + 2, borderRadius: RADIUS.md, alignItems: "center", justifyContent: "center" },
  btnTxt: { fontSize: 16, fontWeight: "700" },
  linkBtn: { marginTop: SPACING.lg, paddingVertical: SPACING.sm },
  err: { marginTop: SPACING.md, fontSize: 13 },
});
