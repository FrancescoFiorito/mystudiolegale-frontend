
import React, { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTheme } from "@/src/ThemeContext";
import { useAuth } from "@/src/AuthContext";
import { SPACING, RADIUS } from "@/src/theme";
import PasswordFieldLabel from "@/src/components/PasswordFieldLabel";
import { validatePassword } from "@/src/utils/passwordPolicy";

export default function Register() {
  const { t } = useTheme();
  const { register } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{ invite?: string }>();
  const [form, setForm] = useState({ email: "", password: "", nome: "", cognome: "", studio: "", invite_token: params.invite || "" });
  const [password2, setPassword2] = useState("");
  const [consenso, setConsenso] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    setErr("");
    if (!form.email || !form.password) return setErr("Email e password obbligatorie");
    const pwErr = validatePassword(form.password);
    if (pwErr) return setErr(pwErr);
    if (form.password !== password2) return setErr("Le due password non coincidono");
    if (!consenso) return setErr("Devi accettare l'informativa privacy per proseguire");
    setLoading(true);
    try { await register({ ...form, consenso_privacy: consenso }); }
    catch (e: any) { setErr(e.message || "Errore registrazione"); }
    finally { setLoading(false); }
  };

  const field = (k: keyof typeof form, label: string, opts: any = {}) => (
    <>
      <Text style={[s.label, { color: t.onSurfaceSecondary }]}>{label}</Text>
      <TextInput
        testID={`register-${k}-input`}
        style={[s.input, { backgroundColor: t.surfaceSecondary, color: t.onSurface, borderColor: t.border }]}
        placeholderTextColor={t.onSurfaceTertiary}
        value={form[k]}
        onChangeText={(v) => set(k as string, v)}
        {...opts}
      />
    </>
  );

  return (
    <SafeAreaView style={[s.wrap, { backgroundColor: t.surface }]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
          <Pressable testID="back-to-login" onPress={() => router.back()} style={[s.back, { backgroundColor: t.surfaceSecondary }]}>
            <Feather name="arrow-left" size={20} color={t.onSurface} />
          </Pressable>
          <Text style={[s.title, { color: t.onSurface }, !form.invite_token && { marginBottom: SPACING.lg }]}>Crea account</Text>
          {form.invite_token ? (
            <Text style={[s.subtitle, { color: t.onSurfaceSecondary }]}>Completa la registrazione per unirti al tuo studio</Text>
          ) : null}

          <View style={s.form}>
            {field("email", "Email", { autoCapitalize: "none", keyboardType: "email-address", placeholder: "mario.rossi@studio.it" })}
            <View style={{ height: SPACING.md }} />
            <PasswordFieldLabel label="Password" style={[s.label, { color: t.onSurfaceSecondary }]} />
            <TextInput
              testID="register-password-input"
              style={[s.input, { backgroundColor: t.surfaceSecondary, color: t.onSurface, borderColor: t.border }]}
              placeholderTextColor={t.onSurfaceTertiary}
              placeholder="Inserisci password"
              secureTextEntry
              value={form.password}
              onChangeText={(v) => set("password", v)}
            />
            <View style={{ height: SPACING.md }} />
            <Text style={[s.label, { color: t.onSurfaceSecondary }]}>Conferma password</Text>
            <TextInput
              testID="register-password2-input"
              style={[s.input, { backgroundColor: t.surfaceSecondary, color: t.onSurface, borderColor: t.border }]}
              placeholderTextColor={t.onSurfaceTertiary}
              placeholder="Ripeti la password"
              secureTextEntry
              value={password2}
              onChangeText={setPassword2}
            />
            <View style={{ height: SPACING.md }} />
            {field("nome", "Nome", { placeholder: "Mario" })}
            <View style={{ height: SPACING.md }} />
            {field("cognome", "Cognome", { placeholder: "Rossi" })}
            <View style={{ height: SPACING.md }} />
            {!form.invite_token ? field("studio", "Studio legale", { placeholder: "Studio Rossi & Associati" }) : null}
            <View style={{ height: SPACING.md }} />
            {field("invite_token", "Codice invito (opzionale)", { placeholder: "Se sei stato invitato da un collega" })}

            <Pressable testID="consenso-privacy" onPress={() => setConsenso(!consenso)} style={s.consensoRow}>
              <View style={[s.checkbox, { borderColor: t.border, backgroundColor: consenso ? t.brand : "transparent" }]}>
                {consenso ? <Feather name="check" size={14} color={t.onBrand} /> : null}
              </View>
              <Text style={{ flex: 1, color: t.onSurfaceSecondary, fontSize: 12, lineHeight: 18 }}>
                Accetto l'informativa sul trattamento dei dati personali (GDPR) e confermo di avere il diritto di trattare i dati dei miei clienti su questa piattaforma.
              </Text>
            </Pressable>

            {err ? <Text style={[s.err, { color: t.error }]} testID="register-error">{err}</Text> : null}
            <Pressable
              testID="register-submit-button"
              onPress={submit}
              disabled={loading}
              style={[s.btn, { backgroundColor: t.brand, opacity: loading ? 0.6 : 1 }]}
            >
              <Text style={[s.btnTxt, { color: t.onBrand }]}>{loading ? "Creazione..." : "Registrati"}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1 },
  content: { padding: SPACING.xl, paddingTop: SPACING.lg, paddingBottom: SPACING.xxxl },
  back: { width: 40, height: 40, borderRadius: RADIUS.pill, alignItems: "center", justifyContent: "center", marginBottom: SPACING.md, marginLeft: -SPACING.xs },
  title: { fontSize: 28, fontWeight: "800", letterSpacing: -0.5 },
  subtitle: { fontSize: 14, marginTop: SPACING.xs, marginBottom: SPACING.lg },
  form: { marginTop: SPACING.md },
  label: { fontSize: 12, fontWeight: "600", marginBottom: SPACING.xs, textTransform: "uppercase", letterSpacing: 0.5 },
  input: { borderWidth: 1, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.md, fontSize: 15 },
  btn: { marginTop: SPACING.xl, paddingVertical: SPACING.md + 2, borderRadius: RADIUS.md, alignItems: "center" },
  btnTxt: { fontSize: 16, fontWeight: "700" },
  err: { marginTop: SPACING.md, fontSize: 13 },
  consensoRow: { flexDirection: "row", gap: SPACING.sm, marginTop: SPACING.lg, alignItems: "flex-start" },
  checkbox: { width: 20, height: 20, borderRadius: 5, borderWidth: 1.5, alignItems: "center", justifyContent: "center", marginTop: 1 },
});
