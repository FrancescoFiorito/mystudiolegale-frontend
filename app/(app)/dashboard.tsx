import React from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, Pressable, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "@/src/ThemeContext";
import { useAuth } from "@/src/AuthContext";
import { api } from "@/src/api";
import { SPACING, RADIUS, SHADOW } from "@/src/theme";
import Header from "@/src/components/Header";
import LoadingScreen from "@/src/components/LoadingScreen";

type Dash = {
  pratiche_aperte: number;
  pratiche_chiuse: number;
  scadenze_oggi: number;
  scadenze_settimana: number;
};

const initials = (name?: string) => {
  if (!name) return "A";
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] || "").toUpperCase() + (parts[1]?.[0] || "").toUpperCase();
};

const giornoBreve = (iso: string) => {
  try {
    return new Date(iso + "T00:00:00").toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "short" });
  } catch {
    return iso;
  }
};

export default function Dashboard() {
  const { t } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [data, setData] = React.useState<Dash | null>(null);
  const [prossimi, setProssimi] = React.useState<any[]>([]);
  const [refreshing, setRefreshing] = React.useState(false);
  const [showMenu, setShowMenu] = React.useState(false);
  const [errore, setErrore] = React.useState(false);

  const load = React.useCallback(async () => {
    setErrore(false);
    try {
      const [d, sc] = await Promise.all([
        api.get<Dash>("/dashboard"),
        api.get("/scadenze").catch(() => []),
      ]);
      setData(d);
      const oggi = new Date().toISOString().slice(0, 10);
      setProssimi((sc || []).filter((s: any) => !s.completata && s.data >= oggi).sort((a: any, b: any) => (a.data + a.ora).localeCompare(b.data + b.ora)).slice(0, 5));
    } catch {
      setErrore(true);
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  if (!data && errore) {
    return (
      <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: t.surface, alignItems: "center", justifyContent: "center", padding: SPACING.lg }}>
        <Feather name="alert-triangle" size={40} color={t.onSurfaceTertiary} />
        <Text style={{ color: t.onSurface, fontWeight: "700", fontSize: 16, marginTop: SPACING.md, textAlign: "center" }}>Impossibile caricare i dati</Text>
        <Text style={{ color: t.onSurfaceTertiary, fontSize: 13, marginTop: 4, textAlign: "center" }}>Controlla la connessione e riprova.</Text>
        <Pressable testID="dashboard-retry" onPress={load} style={{ marginTop: SPACING.lg, backgroundColor: t.brand, paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md, borderRadius: RADIUS.md }}>
          <Text style={{ color: t.onBrand, fontWeight: "700" }}>Riprova</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  if (!data) {
    return <LoadingScreen />;
  }

  const Stat = ({ label, value, icon, color, bg, testID, onPress }: any) => (
    <Pressable testID={testID} onPress={onPress} style={[s.stat, { backgroundColor: t.surface }, SHADOW.card]}>
      <View style={[s.statBadge, { backgroundColor: bg }]}>
        <Feather name={icon} size={18} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[s.statVal, { color: t.onSurface, fontVariant: ["tabular-nums"] }]}>{value}</Text>
        <Text style={[s.statLbl, { color: t.onSurfaceSecondary }]} numberOfLines={1}>{label}</Text>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: t.surfaceSecondary }}>
      <Header
        variant="hero"
        title={user?.nome || user?.email || "Avvocato"}
        subtitle="Bentornato/a"
        avatarInitials={initials(user?.nome)}
        onAvatarPress={() => setShowMenu(true)}
        right={
          <Pressable testID="calendar-btn" onPress={() => router.push({ pathname: "/(app)/calendario", params: { view: "Mese", _t: String(Date.now()) } })} style={{ flexDirection: "row", alignItems: "center", gap: 6, height: 38, paddingHorizontal: 10, borderRadius: RADIUS.pill, backgroundColor: "rgba(255,255,255,0.18)" }}>
            <Feather name="calendar" size={17} color={t.onBrand} />
            <View>
              <Text style={{ color: t.onBrand, fontSize: 12, fontWeight: "800", lineHeight: 14 }}>{new Date().getDate()} {new Date().toLocaleDateString("it-IT", { month: "short" }).replace(".", "")}</Text>
              <Text style={{ color: t.onBrand, fontSize: 10, opacity: 0.75, lineHeight: 12 }}>{data.scadenze_oggi > 0 ? `${data.scadenze_oggi} oggi` : "nessun impegno"}</Text>
            </View>
          </Pressable>
        }
      />

      <Modal visible={showMenu} transparent animationType="fade" onRequestClose={() => setShowMenu(false)}>
        <Pressable style={s.menuBackdrop} onPress={() => setShowMenu(false)}>
          <View style={[s.menuCard, { backgroundColor: t.surface }, SHADOW.floating]}>
            <Pressable testID="quickmenu-notifiche" onPress={() => { setShowMenu(false); router.push("/(app)/notifiche"); }} style={s.menuItem}>
              <Feather name="bell" size={17} color={t.onSurfaceSecondary} />
              <Text style={[s.menuItemLbl, { color: t.onSurface }]}>Notifiche</Text>
            </Pressable>
            <Pressable testID="quickmenu-profilo" onPress={() => { setShowMenu(false); router.push("/(app)/profilo"); }} style={s.menuItem}>
              <Feather name="user" size={17} color={t.onSurfaceSecondary} />
              <Text style={[s.menuItemLbl, { color: t.onSurface }]}>Profilo</Text>
            </Pressable>
            <View style={[s.menuDivider, { backgroundColor: t.gold, opacity: 0.55 }]} />
            <Pressable testID="quickmenu-settings" onPress={() => { setShowMenu(false); router.push("/(app)/impostazioni"); }} style={s.menuItem}>
              <Feather name="settings" size={17} color={t.brand} />
              <Text style={[s.menuItemLbl, { color: t.brand, fontWeight: "700" }]}>Impostazioni</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      <ScrollView
        contentContainerStyle={{ padding: SPACING.lg, paddingBottom: SPACING.xxxl + 80 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.brand} />}
      >
        <View style={s.grid}>
          <Stat testID="stat-pratiche-aperte" label="Pratiche aperte" value={data.pratiche_aperte} icon="folder" color={t.brand} bg={t.brandSecondary} onPress={() => router.push({ pathname: "/(app)/archivio", params: { tab: "pratiche", stato: "Aperta", _t: String(Date.now()) } })} />
          <Stat testID="stat-pratiche-chiuse" label="Pratiche chiuse" value={data.pratiche_chiuse} icon="check-circle" color={t.success} bg={t.mode === "dark" ? t.surfaceTertiary : "#ECFDF5"} onPress={() => router.push({ pathname: "/(app)/archivio", params: { tab: "pratiche", stato: "Chiusa", _t: String(Date.now()) } })} />
          <Stat testID="stat-scadenze-oggi" label="Scadenze oggi" value={data.scadenze_oggi} icon="alert-circle" color={t.error} bg={t.mode === "dark" ? t.surfaceTertiary : "#FEF2F2"} onPress={() => router.push({ pathname: "/(app)/calendario", params: { view: "Giorno", _t: String(Date.now()) } })} />
          <Stat testID="stat-scadenze-settimana" label="Questa settimana" value={data.scadenze_settimana} icon="clock" color={t.warning} bg={t.mode === "dark" ? t.surfaceTertiary : "#FFFBEB"} onPress={() => router.push({ pathname: "/(app)/calendario", params: { view: "Settimana", _t: String(Date.now()) } })} />
        </View>

        <Pressable testID="prossimi-impegni-card" onPress={() => router.push({ pathname: "/(app)/calendario", params: { view: "Mese", _t: String(Date.now()) } })} style={[s.calCard, { backgroundColor: t.surface }, SHADOW.card]}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: SPACING.sm }}>
            <Text style={{ color: t.onSurface, fontWeight: "800", fontSize: 14 }}>Prossimi impegni</Text>
            <Feather name="chevron-right" size={16} color={t.onSurfaceTertiary} />
          </View>
          {prossimi.length === 0 ? (
            <Text style={{ color: t.onSurfaceTertiary, fontSize: 12, fontStyle: "italic", paddingVertical: 4 }}>Nessun impegno in programma</Text>
          ) : (
            prossimi.map((ev) => (
              <View key={ev.id} style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 5 }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: t.brand }} />
                <Text style={{ color: t.onSurfaceSecondary, fontSize: 12, fontVariant: ["tabular-nums"] }}>{giornoBreve(ev.data)} · {ev.ora}</Text>
                <Text style={{ color: t.onSurface, fontSize: 12, fontWeight: "600", flex: 1 }} numberOfLines={1}>{ev.titolo}</Text>
              </View>
            ))
          )}
        </Pressable>

        <Pressable testID="nuova-pratica-btn" onPress={() => router.push({ pathname: "/(app)/archivio", params: { tab: "pratiche", new: "1", _t: String(Date.now()) } })} style={[s.banner, { backgroundColor: t.brand }]}>
          <View style={s.bannerIcon}><Feather name="folder-plus" size={22} color={t.onBrand} /></View>
          <Text style={[s.bannerTitle, { color: t.onBrand }]}>Nuova pratica</Text>
          <Feather name="chevron-right" size={20} color={t.onBrand} />
        </Pressable>

        <Pressable testID="crea-parcella-btn" onPress={() => router.push({ pathname: "/(app)/calcolatori", params: { tab: "parcelle", _t: String(Date.now()) } })} style={[s.banner, { backgroundColor: t.surface, marginTop: SPACING.md }, SHADOW.card]}>
          <View style={[s.bannerIcon, { backgroundColor: t.brandSecondary }]}><Feather name="file-text" size={22} color={t.brand} /></View>
          <Text style={[s.bannerTitle, { color: t.onSurface }]}>Crea parcella</Text>
          <Feather name="chevron-right" size={20} color={t.onSurfaceTertiary} />
        </Pressable>

        <Pressable testID="aggiungi-scadenza-btn" onPress={() => router.push({ pathname: "/(app)/calcolatori", params: { tab: "scadenze", _t: String(Date.now()) } })} style={[s.banner, { backgroundColor: t.surface, marginTop: SPACING.md }, SHADOW.card]}>
          <View style={[s.bannerIcon, { backgroundColor: t.brandSecondary }]}><Feather name="calendar" size={22} color={t.brand} /></View>
          <Text style={[s.bannerTitle, { color: t.onSurface }]}>Aggiungi scadenza</Text>
          <Feather name="chevron-right" size={20} color={t.onSurfaceTertiary} />
        </Pressable>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  grid: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.sm, marginBottom: SPACING.lg },
  stat: { width: "47.5%", flexDirection: "row", alignItems: "center", gap: SPACING.sm, paddingVertical: 12, paddingHorizontal: SPACING.md, borderRadius: RADIUS.lg },
  statBadge: { width: 36, height: 36, borderRadius: RADIUS.md, alignItems: "center", justifyContent: "center" },
  statVal: { fontSize: 20, fontWeight: "800", lineHeight: 23 },
  statLbl: { fontSize: 12, fontWeight: "600", marginTop: 1 },

  calCard: { padding: SPACING.md, borderRadius: RADIUS.lg, marginBottom: SPACING.lg },

  banner: { padding: SPACING.lg, borderRadius: RADIUS.lg, flexDirection: "row", alignItems: "center", gap: SPACING.md },
  bannerIcon: { width: 44, height: 44, borderRadius: RADIUS.md, backgroundColor: "rgba(255,255,255,0.18)", alignItems: "center", justifyContent: "center" },
  bannerTitle: { flex: 1, fontSize: 16, fontWeight: "800" },

  menuBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.25)" },
  menuCard: { position: "absolute", top: 64, left: SPACING.lg, width: 220, borderRadius: RADIUS.lg, paddingVertical: SPACING.sm },
  menuItem: { flexDirection: "row", alignItems: "center", gap: SPACING.md, paddingVertical: 11, paddingHorizontal: SPACING.lg },
  menuItemLbl: { fontSize: 14, fontWeight: "600" },
  menuDivider: { height: 1, marginVertical: SPACING.xs, marginHorizontal: SPACING.lg },
});
