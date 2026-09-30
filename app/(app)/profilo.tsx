import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Platform, TextInput, KeyboardAvoidingView, ActivityIndicator } from "react-native";
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

const PIANO_LABEL: Record<string, string> = { free: "Free", no_ads: "No-Ads", pro: "Pro", studio: "Studio", illimitato: "Illimitato" };

const PIANI = [
  { id: "free", nome: "Free", prezzo: "Gratis", desc: "Pubblicità · 5 pratiche, 5 clienti, 5 parcelle e 5 scadenze al mese" },
  { id: "no_ads", nome: "No-Ads", prezzo: "€1,99/mese", desc: "Come Free ma senza pubblicità" },
  { id: "pro", nome: "Pro", prezzo: "€3,99/mese", desc: "Tutto illimitato, niente pubblicità, sync col calendario del dispositivo" },
  { id: "studio", nome: "Studio", prezzo: "€7,99/mese", desc: "Tutto di Pro + Team & Ruoli multi-utente" },
] as const;

const formattaData = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString("it-IT") : "");

export default function Profilo() {
  const { t } = useTheme();
  const { user, logout, refresh } = useAuth();
  const router = useRouter();
  const navigation = useNavigation();

  const [showEditProfile, setShowEditProfile] = React.useState(false);
  const [profileForm, setProfileForm] = React.useState({ nome: user?.nome || "", cognome: user?.cognome || "", studio: user?.studio || "" });
  const [showChangePw, setShowChangePw] = React.useState(false);
  const [pwForm, setPwForm] = React.useState({ current_password: "", new_password: "", new_password2: "" });
  const [savingProfile, setSavingProfile] = React.useState(false);
  const [savingPw, setSavingPw] = React.useState(false);
  const [showPiano, setShowPiano] = React.useState(false);
  const [cambiandoPiano, setCambiandoPiano] = React.useState<string | null>(null);

  // Con lo Stack nativo, tenere attivo lo swipe-indietro della schermata
  // Profilo mentre uno degli overlay qui sotto e' aperto creerebbe un
  // piccolo conflitto sul bordo sinistro (il gesto nativo di pop e quello
  // dell'overlay potrebbero attivarsi entrambi): disattivato finche' un
  // overlay e' visibile.
  React.useEffect(() => {
    navigation.setOptions({ gestureEnabled: !(showEditProfile || showChangePw || showPiano) });
  }, [showEditProfile, showChangePw, showPiano, navigation]);

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

  // Un upgrade e' applicato subito dal backend; un downgrade resta
  // programmato fino alla fine del periodo gia' pagato (piano_programmato +
  // rinnovo_il in risposta). Richiedere di nuovo il piano gia' attivo
  // annulla un downgrade programmato, invece di essere ignorato.
  const selezionaPiano = async (pianoId: string) => {
    setCambiandoPiano(pianoId);
    try {
      await api.post("/studio/piano", { piano: pianoId });
      await refresh();
      setShowPiano(false);
    } catch (e: any) {
      Alert.alert("Errore", e.message || "Impossibile cambiare piano. Riprova.");
    } finally {
      setCambiandoPiano(null);
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

        <Pressable testID="profilo-piano" onPress={() => setShowPiano(true)} style={[s.item, { backgroundColor: t.surface }, SHADOW.card]}>
          <View style={[s.itemIcon, { backgroundColor: t.brandSecondary }]}>
            <Feather name="award" size={16} color={t.brand} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: t.onSurface, fontSize: 14, fontWeight: "600" }}>Piano</Text>
            {user?.piano_programmato ? (
              <Text style={{ color: t.onSurfaceTertiary, fontSize: 11, marginTop: 2 }}>
                Passa a {PIANO_LABEL[user.piano_programmato] || user.piano_programmato} il {formattaData(user.rinnovo_il)}
              </Text>
            ) : null}
          </View>
          <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.pill, backgroundColor: t.brandSecondary }}>
            <Text style={{ color: t.brand, fontSize: 12, fontWeight: "700" }}>{PIANO_LABEL[user?.piano || "free"] || user?.piano || "Free"}</Text>
          </View>
          <Feather name="chevron-right" size={18} color={t.onSurfaceTertiary} style={{ marginLeft: 6 }} />
        </Pressable>

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

      {showPiano ? (
        <SwipeBackScreen edges={["top"]} style={{ backgroundColor: t.surface }} onDismiss={() => setShowPiano(false)}>
          <Header variant="hero" title="Cambia piano" onBack={() => setShowPiano(false)} />
          <ScrollView contentContainerStyle={{ padding: SPACING.lg }}>
            {user?.piano_programmato ? (
              <View style={{ backgroundColor: t.brandSecondary, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.md }}>
                <Text style={{ color: t.brand, fontSize: 12, fontWeight: "600" }}>
                  Passerai a {PIANO_LABEL[user.piano_programmato] || user.piano_programmato} il {formattaData(user.rinnovo_il)}. Tocca il piano attuale per annullare.
                </Text>
              </View>
            ) : null}
            {PIANI.map((p) => {
              const attuale = p.id === user?.piano;
              const programmato = p.id === user?.piano_programmato;
              return (
                <Pressable
                  key={p.id}
                  testID={`piano-${p.id}`}
                  onPress={() => selezionaPiano(p.id)}
                  disabled={!!cambiandoPiano}
                  style={[
                    s.pianoCard,
                    { backgroundColor: t.surface, borderColor: attuale ? t.brand : t.border, borderWidth: attuale ? 2 : 1, opacity: cambiandoPiano && cambiandoPiano !== p.id ? 0.5 : 1 },
                    SHADOW.card,
                  ]}
                >
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <Text style={{ color: t.onSurface, fontSize: 16, fontWeight: "800" }}>{p.nome}</Text>
                    <Text style={{ color: t.brand, fontSize: 14, fontWeight: "700" }}>{p.prezzo}</Text>
                  </View>
                  <Text style={{ color: t.onSurfaceSecondary, fontSize: 12, marginTop: 4 }}>{p.desc}</Text>
                  {attuale ? (
                    <View style={{ marginTop: SPACING.sm, alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 3, borderRadius: RADIUS.pill, backgroundColor: t.brand }}>
                      <Text style={{ color: t.onBrand, fontSize: 11, fontWeight: "700" }}>Piano attuale</Text>
                    </View>
                  ) : programmato ? (
                    <View style={{ marginTop: SPACING.sm, alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 3, borderRadius: RADIUS.pill, backgroundColor: t.surfaceSecondary, borderWidth: 1, borderColor: t.border }}>
                      <Text style={{ color: t.onSurfaceSecondary, fontSize: 11, fontWeight: "700" }}>Dal {formattaData(user?.rinnovo_il)}</Text>
                    </View>
                  ) : null}
                  {cambiandoPiano === p.id ? <ActivityIndicator style={{ marginTop: SPACING.sm }} color={t.brand} /> : null}
                </Pressable>
              );
            })}
          </ScrollView>
        </SwipeBackScreen>
      ) : null}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  item: { flexDirection: "row", alignItems: "center", gap: SPACING.md, padding: SPACING.md, borderRadius: RADIUS.lg, marginBottom: SPACING.sm },
  pianoCard: { borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.sm },
  itemIcon: { width: 34, height: 34, borderRadius: RADIUS.md, alignItems: "center", justifyContent: "center" },
  lbl: { fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: SPACING.xs },
  input: { borderWidth: 1, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.md, fontSize: 14 },
});
