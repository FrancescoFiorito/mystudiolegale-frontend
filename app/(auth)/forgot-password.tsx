
import React, { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "@/src/ThemeContext";
import { api } from "@/src/api";
import { SPACING, RADIUS, SHADOW } from "@/src/theme";

export default function ForgotPassword() {
  const { t } = useTheme();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState("");

  const submit = async () => {
    setErr("");
    if (!email) return setErr("Inserisci la tua email");
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email: email.trim() });
      setSent(true);
    } catch (e: any) {
      setErr(e.message || "Errore, riprova");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[s.wrap, { backgroundColor: t.brand }]} edges={["top"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <View style={s.hero}>
            <Pressable testID="back-btn" onPress={() => router.back()} style={[s.backBtn, { backgroundColor: "rgba(255,255,255,0.18)" }]}>
              <Feather name="arrow-left" size={20} color={t.onBrand} />
            </Pressable>
            <View style={[s.logoBox, { backgroundColor: "rgba(255,255,255,0.16)" }]}>
              <Feather name="key" size={28} color={t.onBrand} />
            </View>
            <Text style={[s.title, { color: t.onBrand }]}>Password dimenticata</Text>
            <Text style={[s.subtitle, { color: t.onBrand, opacity: 0.8 }]}>Ti mandiamo un codice via email</Text>
          </View>

          <View style={[s.card, { backgroundColor: t.surface }, SHADOW.floating]}>
            {sent ? (
              <View style={{ alignItems: "center", paddingVertical: SPACING.lg }}>
                <Feather name="mail" size={40} color={t.brand} />
                <Text style={{ color: t.onSurface, fontSize: 16, fontWeight: "700", marginTop: SPACING.md, textAlign: "center" }}>
                  Controlla la tua email
                </Text>
                <Text style={{ color: t.onSurfaceSecondary, fontSize: 13, marginTop: SPACING.sm, textAlign: "center" }}>
                  Se l'indirizzo è registrato, hai ricevuto un codice per reimpostare la password (valido 1 ora).
                </Text>
                <Pressable testID="go-reset-password" onPress={() => router.push("/(auth)/reset-password")} style={[s.btn, { backgroundColor: t.brand, marginTop: SPACING.xl }]}>
                  <Text style={[s.btnTxt, { color: t.onBrand }]}>Ho il codice, continua</Text>
                </Pressable>
              </View>
            ) : (
              <>
                <Text style={[s.cardTitle, { color: t.onSurface }]}>Inserisci la tua email</Text>
                <View style={[s.inputWrap, { backgroundColor: t.surfaceSecondary, borderColor: t.border }]}>
                  <Feather name="mail" size={17} color={t.onSurfaceTertiary} />
                  <TextInput
                    testID="forgot-email-input"
                    style={[s.input, { color: t.onSurface }]}
                    placeholder="mario.rossi@studio.it"
                    placeholderTextColor={t.onSurfaceTertiary}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>
                {err ? <Text style={[s.err, { color: t.error }]} testID="forgot-error">{err}</Text> : null}
                <Pressable testID="forgot-submit-button" onPress={submit} disabled={loading} style={[s.btn, { backgroundColor: t.brand, opacity: loading ? 0.6 : 1 }]}>
                  <Text style={[s.btnTxt, { color: t.onBrand }]}>{loading ? "Invio..." : "Invia codice"}</Text>
                </Pressable>
                <Pressable testID="go-reset-password-direct" onPress={() => router.push("/(auth)/reset-password")} style={s.linkBtn}>
                  <Text style={{ color: t.onSurfaceSecondary, textAlign: "center" }}>Hai già un codice? <Text style={{ color: t.brand, fontWeight: "700" }}>Inseriscilo qui</Text></Text>
                </Pressable>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1 },
  hero: { alignItems: "center", justifyContent: "center", paddingTop: SPACING.xl, paddingBottom: SPACING.xxxl },
  backBtn: { position: "absolute", left: SPACING.lg, top: SPACING.md, width: 38, height: 38, borderRadius: RADIUS.pill, alignItems: "center", justifyContent: "center" },
  logoBox: { width: 64, height: 64, borderRadius: RADIUS.lg, alignItems: "center", justifyContent: "center", marginBottom: SPACING.md },
  title: { fontSize: 22, fontWeight: "800", letterSpacing: -0.3 },
  subtitle: { fontSize: 14, marginTop: SPACING.xs },
  card: { flex: 1, borderTopLeftRadius: RADIUS.lg * 1.4, borderTopRightRadius: RADIUS.lg * 1.4, padding: SPACING.xl, paddingTop: SPACING.xxl },
  cardTitle: { fontSize: 18, fontWeight: "800", marginBottom: SPACING.lg },
  inputWrap: { flexDirection: "row", alignItems: "center", gap: SPACING.sm, borderWidth: 1, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md },
  input: { flex: 1, paddingVertical: SPACING.md, fontSize: 15 },
  btn: { paddingVertical: SPACING.md + 2, borderRadius: RADIUS.md, alignItems: "center", justifyContent: "center" },
  btnTxt: { fontSize: 16, fontWeight: "700" },
  linkBtn: { marginTop: SPACING.lg, paddingVertical: SPACING.sm },
  err: { marginTop: SPACING.md, fontSize: 13 },
});
