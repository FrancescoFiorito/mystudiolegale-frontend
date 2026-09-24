import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useTheme } from "@/src/ThemeContext";
import { useAuth, useHasPerm } from "@/src/AuthContext";
import { api } from "@/src/api";
import { SPACING, RADIUS, SHADOW } from "@/src/theme";
import Header from "@/src/components/Header";
import { apriDocumentoRemoto } from "@/src/utils/apriDocumentoRemoto";

export default function Impostazioni() {
  const { t, mode, setMode } = useTheme();
  const { logout } = useAuth();
  const router = useRouter();
  const canManageTeam = useHasPerm("manage_team");
  const canViewAudit = useHasPerm("view_audit");
  const canGdprAdmin = useHasPerm("gdpr_admin");

  const [integrazioni, setIntegrazioni] = React.useState<{ google?: any; outlook?: any }>({});

  const loadIntegrazioni = React.useCallback(async () => {
    try { setIntegrazioni(await api.get("/integrations/status")); } catch {}
  }, []);
  React.useEffect(() => { loadIntegrazioni(); }, [loadIntegrazioni]);

  // La freccetta a destra indica che il pulsante apre un'altra schermata
  // (navigazione, es. Team & Ruoli): va mostrata solo li', passando
  // esplicitamente navigates. Le voci che compiono direttamente un'azione
  // (export, collegamento calendario, ecc.) non ce l'hanno.
  const Item = ({ icon, label, onPress, testID, right, navigates, disabled }: any) => (
    <Pressable testID={testID} onPress={onPress} disabled={disabled} style={[s.item, { backgroundColor: t.surface, opacity: disabled ? 0.6 : 1 }, SHADOW.card]}>
      <View style={[s.itemIcon, { backgroundColor: t.brandSecondary }]}>
        <Feather name={icon} size={16} color={t.brand} />
      </View>
      <Text style={{ flex: 1, color: t.onSurface, fontSize: 14, fontWeight: "600" }}>{label}</Text>
      {right}
      {navigates ? <Feather name="chevron-right" size={18} color={t.onSurfaceTertiary} /> : null}
    </Pressable>
  );

  const connettiCalendario = async (provider: "google" | "outlook") => {
    try {
      const r = await api.get(`/integrations/${provider}/connect`);
      await WebBrowser.openBrowserAsync(r.auth_url);
      setTimeout(loadIntegrazioni, 1500);
    } catch (e: any) {
      Alert.alert(provider === "google" ? "Google Calendar" : "Outlook Calendar", e.message || "Integrazione non configurata dal tuo amministratore di sistema");
    }
  };

  const sincronizzaCalendario = async (provider: "google" | "outlook") => {
    try {
      const r = await api.post(`/integrations/${provider}/sync`);
      Alert.alert("Sincronizzazione completata", `${r.sincronizzate} scadenze sincronizzate${r.errori ? `, ${r.errori} errori` : ""}.`);
    } catch (e: any) {
      Alert.alert("Errore sincronizzazione", e.message);
    }
  };

  const disconnetti = async (provider: "google" | "outlook") => {
    await api.del(`/integrations/${provider}`);
    loadIntegrazioni();
  };

  const esportaDatiGdpr = async () => {
    const nomeFile = `export-gdpr-${new Date().toISOString().slice(0, 10)}.json`;
    try {
      if (Platform.OS === "web") {
        // Su web non abbiamo expo-sharing: scarichiamo comunque con fetch +
        // header Authorization (mai in query string) e avviamo il download
        // del browser tramite un link temporaneo.
        const headers = await api.authHeader();
        const res = await fetch(`${api.base}/api/gdpr/export`, { headers: headers as HeadersInit });
        if (!res.ok) throw new Error(`Errore ${res.status}`);
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = nomeFile;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
      } else {
        await apriDocumentoRemoto("/gdpr/export", nomeFile);
      }
    } catch (e: any) {
      Alert.alert("Errore", e.message || "Impossibile esportare i dati. Riprova.");
    }
  };

  const richiediCancellazioneAccount = () => {
    Alert.alert(
      "Cancella account (GDPR)",
      "Il tuo account personale verrà anonimizzato in modo irreversibile. I dati dello studio (pratiche, clienti) restano disponibili al team. Continuare?",
      [
        { text: "Annulla", style: "cancel" },
        {
          text: "Conferma cancellazione", style: "destructive", onPress: async () => {
            await api.post("/gdpr/delete-account");
            Alert.alert("Fatto", "Il tuo account è stato anonimizzato.");
            logout();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: t.surfaceSecondary }}>
      <Header variant="hero" title="Impostazioni" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={{ padding: SPACING.lg, paddingBottom: SPACING.xxxl + 80 }}>
        <Text style={[s.section, { color: t.onSurfaceSecondary, marginTop: 0 }]}>STUDIO</Text>
        {canManageTeam ? (
          <Item testID="menu-team" icon="user-plus" label="Team & Ruoli" onPress={() => router.push("/(app)/team")} navigates />
        ) : null}
        {canViewAudit ? <Item testID="menu-audit" icon="activity" label="Registro attività" onPress={() => router.push("/(app)/audit")} navigates /> : null}

        <Text style={[s.section, { color: t.onSurfaceSecondary }]}>CALENDARIO ESTERNO</Text>
        <Item
          icon="calendar"
          label={integrazioni.google?.connesso ? "Google Calendar · connesso" : "Collega Google Calendar"}
          onPress={() => (integrazioni.google?.connesso ? sincronizzaCalendario("google") : connettiCalendario("google"))}
          right={integrazioni.google?.connesso ? (
            <Pressable onPress={() => disconnetti("google")}><Text style={{ color: t.error, fontSize: 12 }}>Scollega</Text></Pressable>
          ) : undefined}
        />
        <Item
          icon="calendar"
          label={integrazioni.outlook?.connesso ? "Outlook Calendar · connesso" : "Collega Outlook Calendar"}
          onPress={() => (integrazioni.outlook?.connesso ? sincronizzaCalendario("outlook") : connettiCalendario("outlook"))}
          right={integrazioni.outlook?.connesso ? (
            <Pressable onPress={() => disconnetti("outlook")}><Text style={{ color: t.error, fontSize: 12 }}>Scollega</Text></Pressable>
          ) : undefined}
        />

        <Text style={[s.section, { color: t.onSurfaceSecondary }]}>PRIVACY (GDPR)</Text>
        <Item icon="file-text" label="Informativa sulla privacy" onPress={() => WebBrowser.openBrowserAsync(`${api.base}/static/privacy.html`)} />
        {canGdprAdmin ? <Item icon="download-cloud" label="Esporta tutti i dati dello studio" onPress={esportaDatiGdpr} /> : null}
        <Item icon="user-x" label="Richiedi cancellazione account" onPress={richiediCancellazioneAccount} />

        <Text style={[s.section, { color: t.onSurfaceSecondary }]}>ASPETTO</Text>
        <View style={[s.item, { backgroundColor: t.surface }, SHADOW.card]}>
          <View style={[s.itemIcon, { backgroundColor: t.brandSecondary }]}><Feather name="moon" size={16} color={t.brand} /></View>
          <Text style={{ flex: 1, color: t.onSurface, fontSize: 14, fontWeight: "600" }}>Tema</Text>
          <View style={{ flexDirection: "row", gap: 4 }}>
            {(["light", "dark", "system"] as const).map((m) => (
              <Pressable key={m} testID={`theme-${m}`} onPress={() => setMode(m)} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: RADIUS.pill, backgroundColor: mode === m ? t.brand : t.surfaceSecondary }}>
                <Text style={{ color: mode === m ? t.onBrand : t.onSurfaceSecondary, fontSize: 11, textTransform: "capitalize" }}>{m === "system" ? "Auto" : m === "dark" ? "Scuro" : "Chiaro"}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  section: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5, marginTop: SPACING.lg, marginBottom: SPACING.sm },
  item: { flexDirection: "row", alignItems: "center", gap: SPACING.md, padding: SPACING.md, borderRadius: RADIUS.lg, marginBottom: SPACING.sm },
  itemIcon: { width: 34, height: 34, borderRadius: RADIUS.md, alignItems: "center", justifyContent: "center" },
});
