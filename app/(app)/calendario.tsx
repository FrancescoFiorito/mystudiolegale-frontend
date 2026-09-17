import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Modal, TextInput, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "@/src/ThemeContext";
import { api } from "@/src/api";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SPACING, RADIUS, SHADOW } from "@/src/theme";
import Header from "@/src/components/Header";
import SwipeBackScreen from "@/src/components/SwipeBackScreen";

const MONTHS = ["Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno","Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"];
const DOW = ["L","M","M","G","V","S","D"];
const VIEWS = ["Giorno", "Settimana", "Mese"] as const;
type ViewMode = typeof VIEWS[number];

function toISODate(d: Date) { return d.toISOString().slice(0, 10); }
function startOfWeek(d: Date) { const day = d.getDay() === 0 ? 6 : d.getDay() - 1; const r = new Date(d); r.setDate(d.getDate() - day); return r; }
function addDays(d: Date, n: number) { const r = new Date(d); r.setDate(d.getDate() + n); return r; }

export default function Calendario() {
  const { t } = useTheme();
  const router = useRouter();
  const today = new Date();
  const params = useLocalSearchParams<{ view?: string; _t?: string }>();
  const [view, setView] = React.useState<ViewMode>((params.view as ViewMode) && VIEWS.includes(params.view as ViewMode) ? (params.view as ViewMode) : "Mese");

  React.useEffect(() => {
    if (params.view && VIEWS.includes(params.view as ViewMode)) setView(params.view as ViewMode);
  }, [params.view, params._t]);
  const [cursor, setCursor] = React.useState(today);
  const [selectedDay, setSelectedDay] = React.useState<string>(toISODate(today));
  const [events, setEvents] = React.useState<any[]>([]);
  const [moveTarget, setMoveTarget] = React.useState<any>(null);
  const [moveDate, setMoveDate] = React.useState("");

  const y = cursor.getFullYear();
  const m = cursor.getMonth();
  const monthStr = `${y}-${String(m + 1).padStart(2, "0")}`;

  const load = React.useCallback(async () => {
    try {
      if (view === "Mese") {
        setEvents(await api.get(`/calendario?month=${monthStr}`));
      } else if (view === "Settimana") {
        const start = toISODate(startOfWeek(cursor));
        const end = toISODate(addDays(startOfWeek(cursor), 6));
        setEvents(await api.get(`/calendario?start=${start}&end=${end}`));
      } else {
        const d = toISODate(cursor);
        setEvents(await api.get(`/calendario?start=${d}&end=${d}`));
      }
    } catch {}
  }, [view, monthStr, cursor]);
  React.useEffect(() => { load(); }, [load]);

  const evByDay = React.useMemo(() => {
    const map: Record<string, any[]> = {};
    events.forEach((e) => { (map[e.data] = map[e.data] || []).push(e); });
    return map;
  }, [events]);

  const priColor = (p: string) => p === "alta" ? t.error : p === "media" ? t.warning : t.success;

  const apriSposta = (e: any) => { setMoveTarget(e); setMoveDate(e.data); };
  const confermaSposta = async () => {
    if (!moveTarget) return;
    try {
      await api.patch(`/scadenze/${moveTarget.id}/sposta?data=${moveDate}`);
      setMoveTarget(null);
      load();
    } catch (e: any) { Alert.alert("Errore", e.message); }
  };

  const EventCard = ({ e }: { e: any }) => (
    <Pressable onLongPress={() => apriSposta(e)} style={[{ flexDirection: "row", borderRadius: RADIUS.lg, marginBottom: SPACING.sm, overflow: "hidden", backgroundColor: t.surface }, SHADOW.card]}>
      <View style={{ width: 4, backgroundColor: priColor(e.priorita) }} />
      <View style={{ flex: 1, padding: SPACING.md }}>
        <Text style={{ color: t.onSurface, fontWeight: "700" }}>{e.titolo}</Text>
        <Text style={{ color: t.onSurfaceTertiary, fontSize: 12, marginTop: 2, fontVariant: ["tabular-nums"] }}>{e.data} · {e.ora} · {e.categoria}</Text>
        {e.pratica ? <Text style={{ color: t.onSurfaceSecondary, fontSize: 12 }}>{e.pratica.numero}</Text> : null}
      </View>
      <Pressable onPress={() => apriSposta(e)} style={{ padding: SPACING.md, justifyContent: "center" }}>
        <Feather name="move" size={16} color={t.onSurfaceTertiary} />
      </Pressable>
    </Pressable>
  );

  const goPrev = () => {
    if (view === "Mese") setCursor(new Date(y, m - 1, 1));
    else if (view === "Settimana") setCursor(addDays(cursor, -7));
    else setCursor(addDays(cursor, -1));
  };
  const goNext = () => {
    if (view === "Mese") setCursor(new Date(y, m + 1, 1));
    else if (view === "Settimana") setCursor(addDays(cursor, 7));
    else setCursor(addDays(cursor, 1));
  };

  const firstDow = (() => { let d = new Date(y, m, 1).getDay(); return d === 0 ? 6 : d - 1; })();
  const daysIn = new Date(y, m + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysIn; d++) cells.push(d);

  const weekDays = React.useMemo(() => { const s0 = startOfWeek(cursor); return Array.from({ length: 7 }, (_, i) => addDays(s0, i)); }, [cursor]);

  return (
    <SwipeBackScreen edges={["top"]} style={{ flex: 1, backgroundColor: t.surfaceSecondary }}>
      <Header variant="hero" title="Calendario" onBack={() => router.back()} />

      <View style={{ flexDirection: "row", backgroundColor: t.surface, paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm, paddingBottom: SPACING.md, gap: 8, borderBottomWidth: 1, borderBottomColor: t.border, marginTop: SPACING.xs }}>
        {VIEWS.map((v) => (
          <Pressable key={v} testID={`cal-view-${v}`} onPress={() => setView(v)} style={{ flex: 1, paddingVertical: 9, borderRadius: RADIUS.pill, backgroundColor: view === v ? t.brand : t.surfaceSecondary, alignItems: "center" }}>
            <Text style={{ color: view === v ? t.onBrand : t.onSurfaceSecondary, fontSize: 12, fontWeight: "700" }}>{v}</Text>
          </Pressable>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: SPACING.xxxl + 80 }}>
        <View style={[s.monthBar, { backgroundColor: t.surface, borderBottomColor: t.border }]}>
          <Pressable testID="cal-prev" onPress={goPrev}><Feather name="chevron-left" size={22} color={t.onSurface} /></Pressable>
          <Text style={{ color: t.onSurface, fontSize: 16, fontWeight: "700" }}>
            {view === "Mese" ? `${MONTHS[m]} ${y}` : view === "Settimana" ? `${toISODate(weekDays[0])} → ${toISODate(weekDays[6])}` : toISODate(cursor)}
          </Text>
          <Pressable testID="cal-next" onPress={goNext}><Feather name="chevron-right" size={22} color={t.onSurface} /></Pressable>
        </View>

        {view === "Mese" && (
          <>
            <View style={{ flexDirection: "row", paddingHorizontal: SPACING.md, marginTop: SPACING.sm }}>
              {DOW.map((d, i) => <Text key={i} style={{ flex: 1, textAlign: "center", color: t.onSurfaceTertiary, fontSize: 11, fontWeight: "700" }}>{d}</Text>)}
            </View>
            <View style={{ flexDirection: "row", flexWrap: "wrap", paddingHorizontal: SPACING.md, marginTop: 6 }}>
              {cells.map((d, i) => {
                if (d === null) return <View key={i} style={{ width: "14.28%", aspectRatio: 1 }} />;
                const ds = `${monthStr}-${String(d).padStart(2, "0")}`;
                const has = !!evByDay[ds];
                const sel = ds === selectedDay;
                const isToday = ds === toISODate(today);
                return (
                  <Pressable key={i} testID={`day-${d}`} onPress={() => setSelectedDay(ds)} style={{ width: "14.28%", aspectRatio: 1, alignItems: "center", justifyContent: "center" }}>
                    <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: sel ? t.brand : "transparent", borderWidth: isToday && !sel ? 1 : 0, borderColor: t.brand, alignItems: "center", justifyContent: "center" }}>
                      <Text style={{ color: sel ? t.onBrand : t.onSurface, fontWeight: sel ? "800" : "500", fontVariant: ["tabular-nums"] }}>{d}</Text>
                    </View>
                    {has ? <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: sel ? t.onBrand : t.brand, marginTop: 2 }} /> : null}
                  </Pressable>
                );
              })}
            </View>
            <Text style={{ padding: SPACING.lg, paddingBottom: SPACING.sm, color: t.onSurface, fontWeight: "700", fontSize: 15 }}>Eventi del {selectedDay}</Text>
            <View style={{ paddingHorizontal: SPACING.lg }}>
              {(evByDay[selectedDay] || []).length === 0 ? <Text style={{ color: t.onSurfaceTertiary, fontStyle: "italic" }}>Nessun evento</Text> :
                (evByDay[selectedDay] || []).map((e) => <EventCard key={e.id} e={e} />)}
            </View>
          </>
        )}

        {view === "Settimana" && (
          <View style={{ paddingHorizontal: SPACING.lg, paddingTop: SPACING.md }}>
            {weekDays.map((d) => {
              const ds = toISODate(d);
              const dayEvents = evByDay[ds] || [];
              return (
                <View key={ds} style={{ marginBottom: SPACING.md }}>
                  <Text style={{ color: t.onSurface, fontWeight: "700", marginBottom: SPACING.xs }}>
                    {DOW[d.getDay() === 0 ? 6 : d.getDay() - 1]} {d.getDate()}/{d.getMonth() + 1} {ds === toISODate(today) ? "· oggi" : ""}
                  </Text>
                  {dayEvents.length === 0 ? <Text style={{ color: t.onSurfaceTertiary, fontSize: 12, fontStyle: "italic", marginBottom: SPACING.sm }}>Nessun evento</Text> :
                    dayEvents.map((e) => <EventCard key={e.id} e={e} />)}
                </View>
              );
            })}
          </View>
        )}

        {view === "Giorno" && (
          <View style={{ paddingHorizontal: SPACING.lg, paddingTop: SPACING.md }}>
            {(evByDay[toISODate(cursor)] || []).length === 0 ? <Text style={{ color: t.onSurfaceTertiary, fontStyle: "italic" }}>Nessun evento in questo giorno</Text> :
              (evByDay[toISODate(cursor)] || []).sort((a, b) => a.ora.localeCompare(b.ora)).map((e) => <EventCard key={e.id} e={e} />)}
          </View>
        )}

        <Text style={{ paddingHorizontal: SPACING.lg, color: t.onSurfaceTertiary, fontSize: 11, marginTop: SPACING.md }}>
          Tocca l'icona <Feather name="move" size={11} /> o tieni premuto un evento per spostarlo di data.
        </Text>
      </ScrollView>

      <Modal visible={!!moveTarget} transparent animationType="fade" onRequestClose={() => setMoveTarget(null)}>
        <View style={{ flex: 1, backgroundColor: "#00000088", alignItems: "center", justifyContent: "center", padding: SPACING.xl }}>
          <View style={{ width: "100%", backgroundColor: t.surface, borderRadius: RADIUS.lg, padding: SPACING.lg, borderWidth: 1, borderColor: t.border }}>
            <Text style={{ color: t.onSurface, fontWeight: "800", fontSize: 16, marginBottom: SPACING.md }}>Sposta "{moveTarget?.titolo}"</Text>
            <Text style={{ fontSize: 11, fontWeight: "600", color: t.onSurfaceTertiary, marginBottom: 4 }}>Nuova data (YYYY-MM-DD)</Text>
            <TextInput value={moveDate} onChangeText={setMoveDate} style={{ borderWidth: 1, borderColor: t.border, borderRadius: RADIUS.md, padding: SPACING.md, color: t.onSurface, backgroundColor: t.surfaceSecondary }} />
            <View style={{ flexDirection: "row", gap: 8, marginTop: SPACING.lg }}>
              <Pressable onPress={() => setMoveTarget(null)} style={{ flex: 1, padding: SPACING.md, borderRadius: RADIUS.md, borderWidth: 1, borderColor: t.border, alignItems: "center" }}>
                <Text style={{ color: t.onSurface }}>Annulla</Text>
              </Pressable>
              <Pressable onPress={confermaSposta} style={{ flex: 1, padding: SPACING.md, borderRadius: RADIUS.md, backgroundColor: t.brand, alignItems: "center" }}>
                <Text style={{ color: t.onBrand, fontWeight: "700" }}>Sposta</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SwipeBackScreen>
  );
}

const s = StyleSheet.create({
  monthBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: SPACING.lg, borderBottomWidth: 1 },
});
