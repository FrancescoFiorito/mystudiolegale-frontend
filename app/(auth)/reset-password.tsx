
import React, { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "@/src/ThemeContext";
import { api } from "@/src/api";
import { SPACING, RADIUS, SHADOW } from "@/src/theme";

export default function ResetPassword() {
  const { t } = useTheme();
  const router = useRouter();
  const [token, setToken] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const submit = async () => {
    setErr("");
    if (!token.trim()) return setErr("Inserisci il codice ricevuto via email");
    if (pw.length < 6) return setErr("La nuova password deve avere almeno 6 caratteri");
    if (pw !== pw2) return setErr("Le due password non coincidono");
    setLoading(true);
    try {
      await api.post("/auth/reset-password", { token: token.trim(), new_password: pw });
      Alert.alert("Fatto", "Password reimpostata correttamente. Ora puoi accedere.", [
        { text: "Vai al login", onPress: () => router.replace("/(auth)/login") },
      ]);
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
            <Pressable testID="back-btn" onPress={() => router.back()} style={[s.backBtn, { backgroundColor: "rgba(255,255,255,0.18)" }]}>
              <Feather name="arrow-left" size={20} color={t.onBrand} />
            </Pressable>
            <View style={[s.logoBox, { backgroundColor: "rgba(255,255,255,0.16)" }]}>
              <Feather name="lock" size={28} color={t.onBrand} />
            </View>
            <Text style={[s.title, { color: t.onBrand }]}>Reimposta password</Text>
            <Text style={[s.subtitle, { color: t.onBrand, opacity: 0.8 }]}>Incolla il codice ricevuto via email</Text>
          </View>

          <View style={[s.card, { backgroundColor: t.surface }, SHADOW.floating]}>
            <Text style={[s.label, { color: t.onSurfaceSecondary }]}>Codice di reset</Text>
            <View style={[s.inputWrap, { backgroundColor: t.surfaceSecondary, borderColor: t.border }]}>
              <Feather name="hash" size={17} color={t.onSurfaceTertiary} />
              <TextInput
                testID="reset-token-input"
                style={[s.input, { color: t.onSurface }]}
                placeholder="Codice ricevuto via email"
                placeholderTextColor={t.onSurfaceTertiary}
                autoCapitalize="none"
                value={token}
                onChangeText={setToken}
              />
            </View>

            <Text style={[s.label, { color: t.onSurfaceSecondary, marginTop: SPACING.md }]}>Nuova password</Text>
            <View style={[s.inputWrap, { backgroundColor: t.surfaceSecondary, borderColor: t.border }]}>
              <Feather name="lock" size={17} color={t.onSurfaceTertiary} />
              <TextInput
                testID="reset-newpw-input"
                style={[s.input, { color: t.onSurface }]}
                placeholder="Almeno 6 caratteri"
                placeholderTextColor={t.onSurfaceTertiary}
                secureTextEntry={!showPw}
                value={pw}
                onChangeText={setPw}
              />
              <Pressable onPress={() => setShowPw(!showPw)} hitSlop={8}>
                <Feather name={showPw ? "eye-off" : "eye"} size={17} color={t.onSurfaceTertiary} />
              </Pressable>
            </View>

            <Text style={[s.label, { color: t.onSurfaceSecondary, marginTop: SPACING.md }]}>Conferma nuova password</Text>
            <View style={[s.inputWrap, { backgroundColor: t.surfaceSecondary, borderColor: t.border }]}>
              <Feather name="lock" size={17} color={t.onSurfaceTertiary} />
              <TextInput
                testID="reset-newpw2-input"
                style={[s.input, { color: t.onSurface }]}
                placeholder="Ripeti la nuova password"
                placeholderTextColor={t.onSurfaceTertiary}
                secureTextEntry={!showPw}
                value={pw2}
                onChangeText={setPw2}
              />
            </View>

            {err ? <Text style={[s.err, { color: t.error }]} testID="reset-error">{err}</Text> : null}

            <Pressable testID="reset-submit-button" onPress={submit} disabled={loading} style={[s.btn, { backgroundColor: t.brand, opacity: loading ? 0.6 : 1, marginTop: SPACING.xl }]}>
              <Text style={[s.btnTxt, { color: t.onBrand }]}>{loading ? "Salvataggio..." : "Reimposta password"}</Text>
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
  backBtn: { position: "absolute", left: SPACING.lg, top: SPACING.md, width: 38, height: 38, borderRadius: RADIUS.pill, alignItems: "center", justifyContent: "center" },
  logoBox: { width: 64, height: 64, borderRadius: RADIUS.lg, alignItems: "center", justifyContent: "center", marginBottom: SPACING.md },
  title: { fontSize: 22, fontWeight: "800", letterSpacing: -0.3 },
  subtitle: { fontSize: 14, marginTop: SPACING.xs },
  card: { flex: 1, borderTopLeftRadius: RADIUS.lg * 1.4, borderTopRightRadius: RADIUS.lg * 1.4, padding: SPACING.xl, paddingTop: SPACING.xxl },
  label: { fontSize: 12, fontWeight: "600", marginBottom: SPACING.xs },
  inputWrap: { flexDirection: "row", alignItems: "center", gap: SPACING.sm, borderWidth: 1, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md },
  input: { flex: 1, paddingVertical: SPACING.md, fontSize: 15 },
  btn: { paddingVertical: SPACING.md + 2, borderRadius: RADIUS.md, alignItems: "center", justifyContent: "center" },
  btnTxt: { fontSize: 16, fontWeight: "700" },
  err: { marginTop: SPACING.md, fontSize: 13 },
});
