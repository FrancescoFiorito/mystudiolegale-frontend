
import React, { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "@/src/ThemeContext";
import { useAuth } from "@/src/AuthContext";
import { SPACING, RADIUS, SHADOW, FONT } from "@/src/theme";

export default function Login() {
  const { t } = useTheme();
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setErr("");
    if (!email || !pw) return setErr("Inserisci email e password");
    setLoading(true);
    try { await login(email.trim(), pw); }
    catch (e: any) { setErr(e.message || "Errore accesso"); }
    finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={[s.wrap, { backgroundColor: t.brand }]} edges={["top"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <View style={s.hero}>
            <Image source={t.mode === "dark" ? require("@/assets/images/icon-dark.png") : require("@/assets/images/icon.png")} style={s.logoBox} testID="app-logo" resizeMode="contain" />
            <Text style={[s.title, { color: t.onBrand }]}>MyStudioLegale</Text>
            <Text style={[s.subtitle, { color: t.onBrand, opacity: 0.8 }]}>Il gestionale per avvocati</Text>
          </View>

          <View style={[s.card, { backgroundColor: t.surface }, SHADOW.floating]}>
            <Text style={[s.cardTitle, { color: t.onSurface }]}>Accedi</Text>

            <View style={[s.inputWrap, { backgroundColor: t.surfaceSecondary, borderColor: t.border }]}>
              <Feather name="mail" size={17} color={t.onSurfaceTertiary} />
              <TextInput
                testID="login-email-input"
                style={[s.input, { color: t.onSurface }]}
                placeholder="mario.rossi@studio.it"
                placeholderTextColor={t.onSurfaceTertiary}
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={[s.inputWrap, { backgroundColor: t.surfaceSecondary, borderColor: t.border, marginTop: SPACING.md }]}>
              <Feather name="lock" size={17} color={t.onSurfaceTertiary} />
              <TextInput
                testID="login-password-input"
                style={[s.input, { color: t.onSurface }]}
                placeholder="••••••••"
                placeholderTextColor={t.onSurfaceTertiary}
                secureTextEntry={!showPw}
                value={pw}
                onChangeText={setPw}
              />
              <Pressable onPress={() => setShowPw(!showPw)} hitSlop={8}>
                <Feather name={showPw ? "eye-off" : "eye"} size={17} color={t.onSurfaceTertiary} />
              </Pressable>
            </View>

            {err ? <Text style={[s.err, { color: t.error }]} testID="login-error">{err}</Text> : null}

            <Pressable
              testID="login-submit-button"
              onPress={submit}
              disabled={loading}
              style={[s.btn, { backgroundColor: t.brand, opacity: loading ? 0.6 : 1 }]}
            >
              <Text style={[s.btnTxt, { color: t.onBrand }]}>{loading ? "Accesso..." : "Accedi"}</Text>
              {!loading && <Feather name="arrow-right" size={18} color={t.onBrand} />}
            </Pressable>

            <Pressable testID="go-to-register" onPress={() => router.push("/(auth)/register")} style={s.linkBtn}>
              <Text style={{ color: t.onSurfaceSecondary, textAlign: "center" }}>Non hai un account? <Text style={{ color: t.brand, fontWeight: "700" }}>Registrati</Text></Text>
            </Pressable>
            <Pressable testID="go-to-forgot-password" onPress={() => router.push("/(auth)/forgot-password")} style={s.linkBtn}>
              <Text style={{ color: t.brand, textAlign: "center", fontWeight: "600" }}>Password dimenticata?</Text>
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
  logoBox: { width: 76, height: 76, borderRadius: RADIUS.lg, marginBottom: SPACING.md, overflow: "hidden" },
  title: { fontSize: 30, fontFamily: FONT.serif, letterSpacing: -0.3 },
  subtitle: { fontSize: 14, marginTop: SPACING.xs },
  card: { flex: 1, borderTopLeftRadius: RADIUS.lg * 1.4, borderTopRightRadius: RADIUS.lg * 1.4, padding: SPACING.xl, paddingTop: SPACING.xxl },
  cardTitle: { fontSize: 20, fontWeight: "800", marginBottom: SPACING.lg },
  inputWrap: { flexDirection: "row", alignItems: "center", gap: SPACING.sm, borderWidth: 1, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md },
  input: { flex: 1, paddingVertical: SPACING.md, fontSize: 15 },
  btn: { marginTop: SPACING.xl, paddingVertical: SPACING.md + 2, borderRadius: RADIUS.md, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: SPACING.sm },
  btnTxt: { fontSize: 16, fontWeight: "700" },
  linkBtn: { marginTop: SPACING.lg, paddingVertical: SPACING.sm },
  err: { marginTop: SPACING.md, fontSize: 13 },
});
