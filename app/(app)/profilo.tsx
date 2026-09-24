import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Platform, TextInput, KeyboardAvoidingView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter, useNavigation } from "expo-router";
import { useTheme } from "@/src/ThemeContext";
import { useAuth } from "@/src/AuthContext";
import { api } from "@/src/api";
import { SPACING, RADIUS, SHADOW } from "@/src/theme";
import Header from "@/src/components/Header";
import SwipeBackScreen from "@/src/components/SwipeBackScreen";
import PasswordFieldLabel from "@/src/components/PasswordFieldLabel";
import { validatePassword } from "@/src/utils/passwordPolicy";

const initials = (name?: string) => {
  if (!name) return "A";
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] || "").toUpperCase() + (parts[1]?.[0] || "").toUpperCase();
};

export default function Profilo() {
  const { t } = useTheme();
  const { user, logout } = useAuth();
  const router = useRouter();
  const navigation = useNavigation();

  const [showEditProfile, setShowEditProfile] = React.useState(false);
  const [profileForm, setProfileForm] = React.useState({ nome: user?.nome || "", cognome: user?.cognome || "", studio: user?.studio || "" });
  const [showChangePw, setShowChangePw] = React.useState(false);
  const [pwForm, setPwForm] = React.useState({ current_password: "", new_password: "", new_password2: "" });
  const [savingProfile, setSavingProfile] = React.useState(false);
  const [savingPw, setSavingPw] = React.useState(false);

  // Con lo Stack nativo, tenere attivo lo swipe-indietro della schermata
  // Profilo mentre uno dei due overlay qui sotto e' aperto creerebbe un
  // piccolo conflitto sul bordo sinistro (il gesto nativo di pop e quello
  // dell'overlay potrebbero attivarsi entrambi): disattivato finche' un
  // overlay e' visibile.
  React.useEffect(() => {
    navigation.setOptions({ gestureEnabled: !(showEditProfile || showChangePw) });
  }, [showEditProfile, showChangePw, navigation]);

  const Item = ({ icon, label, onPress, testID, right }: any) => (
    <Pressable testID={testID} onPress={onPress} style={[s.item, { backgroundColor: t.surface }, SHADOW.card]}>
      <View style={[s.itemIcon, { backgroundColor: t.brandSecondary }]}>
        <Feather name={icon} size={16} color={t.brand} />
      </View>
      <Text style={{ flex: 1, color: t.onSurface, fontSize: 14, fontWeight: "600" }}>{label}</Text>
      {right || <Feather name="chevron-right" size={18} color={t.onSurfaceTertiary} />}
    </Pressable>
  );

  const salvaProfilo = async () => {
    setSavingProfile(true);
    try {
      await api.put("/auth/me", profileForm);
      Alert.alert("Fatto", "Profilo aggiornato.");
      setShowEditProfile(false);
    } catch (e: any) {
      Alert.alert("Errore", e.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const salvaNuovaPassword = async () => {
    const pwErr = validatePassword(pwForm.new_password);
    if (pwErr) return Alert.alert("Errore", pwErr);
    if (pwForm.new_password !== pwForm.new_password2) return Alert.alert("Errore", "Le due password non coincidono");
    setSavingPw(true);
    try {
      await api.post("/auth/change-password", { current_password: pwForm.current_password, new_password: pwForm.new_password });
      Alert.alert("Fatto", "Password cambiata.");
      setPwForm({ current_password: "", new_password: "", new_password2: "" });
      setShowChangePw(false);
    } catch (e: any) {
      Alert.alert("Errore", e.message);
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: t.surfaceSecondary }}>
      <Header
        variant="hero"
        title={user?.nome ? `${user.nome} ${user.cognome || ""}`.trim() : user?.email || "Profilo"}
        subtitle={user?.studio || user?.ruolo || "Avvocato"}
        avatarInitials={initials(user?.nome)}
        onBack={() => router.back()}
        backTestID="back-btn"
      />
      <ScrollView contentContainerStyle={{ padding: SPACING.lg, paddingBottom: SPACING.xxxl + 80 }}>
        <Text testID="profilo-nome" style={{ height: 0, width: 0, opacity: 0 }}>{user?.nome ? `${user.nome} ${user.cognome || ""}`.trim() : user?.email}</Text>

        <Item testID="menu-modifica-profilo" icon="edit-2" label="Modifica profilo" onPress={() => setShowEditProfile(true)} />
        <Item testID="menu-cambia-password" icon="lock" label="Cambia password" onPress={() => setShowChangePw(true)} />

        <Pressable testID="logout-btn" onPress={logout} style={[s.item, { backgroundColor: t.mode === "dark" ? t.surfaceTertiary : "#FEF2F2", marginTop: SPACING.xl }]}>
          <View style={[s.itemIcon, { backgroundColor: t.mode === "dark" ? t.surface : "#FEE2E2" }]}><Feather name="log-out" size={16} color={t.error} /></View>
          <Text style={{ flex: 1, color: t.error, fontSize: 14, fontWeight: "700" }}>Esci</Text>
        </Pressable>
      </ScrollView>

      {showEditProfile ? (
        <SwipeBackScreen edges={["top"]} style={{ backgroundColor: t.surface }} onDismiss={() => setShowEditProfile(false)}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
            <Header variant="hero" title="Modifica profilo" onBack={() => setShowEditProfile(false)} />
            <ScrollView contentContainerStyle={{ padding: SPACING.lg }} keyboardShouldPersistTaps="handled">
              {([["nome", "Nome"], ["cognome", "Cognome"], ["studio", "Studio legale"]] as const).map(([k, label]) => (
                <View key={k} style={{ marginBottom: SPACING.md }}>
                  <Text style={[s.lbl, { color: t.onSurfaceSecondary }]}>{label}</Text>
                  <TextInput
                    testID={`edit-profile-${k}`}
                    value={(profileForm as any)[k]}
                    onChangeText={(v) => setProfileForm({ ...profileForm, [k]: v })}
                    style={[s.input, { backgroundColor: t.surfaceSecondary, color: t.onSurface, borderColor: t.border }]}
                    placeholderTextColor={t.onSurfaceTertiary}
                  />
                </View>
              ))}
              <Pressable testID="save-profile-btn" onPress={salvaProfilo} disabled={savingProfile} style={{ marginTop: SPACING.md, backgroundColor: t.brand, padding: SPACING.md, borderRadius: RADIUS.md, alignItems: "center", opacity: savingProfile ? 0.6 : 1 }}>
                <Text style={{ color: t.onBrand, fontWeight: "700" }}>{savingProfile ? "Salvataggio..." : "Salva profilo"}</Text>
              </Pressable>
            </ScrollView>
          </KeyboardAvoidingView>
        </SwipeBackScreen>
      ) : null}

      {showChangePw ? (
        <SwipeBackScreen edges={["top"]} style={{ backgroundColor: t.surface }} onDismiss={() => setShowChangePw(false)}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
            <Header variant="hero" title="Cambia password" onBack={() => setShowChangePw(false)} />
            <ScrollView contentContainerStyle={{ padding: SPACING.lg }} keyboardShouldPersistTaps="handled">
              <Text style={[s.lbl, { color: t.onSurfaceSecondary }]}>Password attuale</Text>
              <TextInput
                testID="change-pw-current"
                secureTextEntry
                value={pwForm.current_password}
                onChangeText={(v) => setPwForm({ ...pwForm, current_password: v })}
                style={[s.input, { backgroundColor: t.surfaceSecondary, color: t.onSurface, borderColor: t.border, marginBottom: SPACING.md }]}
              />
              <PasswordFieldLabel label="Nuova password" style={[s.lbl, { color: t.onSurfaceSecondary }]} />
              <TextInput
                testID="change-pw-new"
                secureTextEntry
                placeholder="Almeno 8 caratteri, un numero e un simbolo"
                placeholderTextColor={t.onSurfaceTertiary}
                value={pwForm.new_password}
                onChangeText={(v) => setPwForm({ ...pwForm, new_password: v })}
                style={[s.input, { backgroundColor: t.surfaceSecondary, color: t.onSurface, borderColor: t.border, marginBottom: SPACING.md }]}
              />
              <Text style={[s.lbl, { color: t.onSurfaceSecondary }]}>Conferma nuova password</Text>
              <TextInput
                testID="change-pw-new2"
                secureTextEntry
                value={pwForm.new_password2}
                onChangeText={(v) => setPwForm({ ...pwForm, new_password2: v })}
                style={[s.input, { backgroundColor: t.surfaceSecondary, color: t.onSurface, borderColor: t.border }]}
              />
              <Pressable testID="save-password-btn" onPress={salvaNuovaPassword} disabled={savingPw} style={{ marginTop: SPACING.lg, backgroundColor: t.brand, padding: SPACING.md, borderRadius: RADIUS.md, alignItems: "center", opacity: savingPw ? 0.6 : 1 }}>
                <Text style={{ color: t.onBrand, fontWeight: "700" }}>{savingPw ? "Salvataggio..." : "Cambia password"}</Text>
              </Pressable>
            </ScrollView>
          </KeyboardAvoidingView>
        </SwipeBackScreen>
      ) : null}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  item: { flexDirection: "row", alignItems: "center", gap: SPACING.md, padding: SPACING.md, borderRadius: RADIUS.lg, marginBottom: SPACING.sm },
  itemIcon: { width: 34, height: 34, borderRadius: RADIUS.md, alignItems: "center", justifyContent: "center" },
  lbl: { fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: SPACING.xs },
  input: { borderWidth: 1, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.md, fontSize: 14 },
});
