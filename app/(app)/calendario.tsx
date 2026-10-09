import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Modal, TextInput, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "@/src/ThemeContext";
import { api } from "@/src/api";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { SPACING, RADIUS, SHADOW } from "@/src/theme";
import Header from "@/src/components/Header";
import DataInput from "@/src/components/DataInput";
import SelectInput from "@/src/components/SelectInput";
import SwipeBackScreen from "@/src/components/SwipeBackScreen";
import PraticaPicker from "@/src/components/PraticaPicker";
import OrarioInput from "@/src/components/OrarioInput";
import PromemoriaInput from "@/src/components/PromemoriaInput";
import { sincronizzaSeConnesso } from "@/src/utils/calendarioDispositivo";
import { formatOra, chiaveOrdinamentoOra } from "@/src/utils/orario";

const MONTHS = ["Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno","Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"];
const DOW = ["L","M","M","G","V","S","D"];
const VIEWS = ["Giorno", "Settimana", "Mese"] as const;
type ViewMode = typeof VIEWS[number];

function toISODate(d: Date) { return d.toISOString().slice(0, 10); }
function startOfWeek(d: Date) { const day = d.getDay() === 0 ? 6 : d.getDay() - 1; const r = new Date(d); r.setDate(d.getDate() - day); return r; }
function addDays(d: Date, n: number) { const r = new Date(d); r.setDate(d.getDate() + n); return r; }
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
// Costruita da y/m/d espliciti invece che con `new Date(stringaISO)`, che
// JS interpreta come UTC e puo' far slittare il giorno di uno in fusi
// orari negativi (es. Americhe) quando poi lo si legge in ora locale.
function parseISODate(s: string) { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); }

export default function Calendario() {
  const { t } = useTheme();
  const router = useRouter();
  const today = new Date();
  const params = useLocalSearchParams<{ view?: string; _t?: string; day?: string }>();
  const [view, setView] = React.useState<ViewMode>((params.view as ViewMode) && VIEWS.includes(params.view as ViewMode) ? (params.view as ViewMode) : "Mese");
  const giornoIniziale = params.day && ISO_DATE_RE.test(params.day) ? params.day : toISODate(today);
  const [cursor, setCursor] = React.useState(giornoIniziale === toISODate(today) ? today : parseISODate(giornoIniziale));
  const [selectedDay, setSelectedDay] = React.useState<string>(giornoIniziale);

  React.useEffect(() => {
    if (params.view && VIEWS.includes(params.view as ViewMode)) setView(params.view as ViewMode);
  }, [params.view, params._t]);
  React.useEffect(() => {
    if (params.day && ISO_DATE_RE.test(params.day)) {
      setSelectedDay(params.day);
      setCursor(parseISODate(params.day));
    }
  }, [params.day, params._t]);
  const [events, setEvents] = React.useState<any[]>([]);
  const [moveTarget, setMoveTarget] = React.useState<any>(null);
  const [moveDate, setMoveDate] = React.useState("");

  // Nuovo evento (facoltativo, tasto + in alto a destra): stessi campi e
  // componenti già usati dai calcolatori per salvare una scadenza, cosi' da
  // poter creare un evento anche senza passare da un calcolatore.
  const [pratiche, setPratiche] = React.useState<any[]>([]);
  React.useEffect(() => { api.get("/pratiche").then(setPratiche).catch(() => {}); }, []);
  const [showNuovo, setShowNuovo] = React.useState(false);
  const [nuovoTitolo, setNuovoTitolo] = React.useState("");
  const [nuovoData, setNuovoData] = React.useState("");
  const [nuovoOra, setNuovoOra] = React.useState<string | null>(null);
  const [nuovoCategoria, setNuovoCategoria] = React.useState("generale");
  const [nuovoPriorita, setNuovoPriorita] = React.useState("media");
  const [nuovoPromemoria, setNuovoPromemoria] = React.useState<number[]>([1]);
  const [nuovoDescrizione, setNuovoDescrizione] = React.useState("");
  const [nuovoPraticaId, setNuovoPraticaId] = React.useState<string | null>(null);
  const [savingNuovo, setSavingNuovo] = React.useState(false);

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
  // useFocusEffect invece di useEffect: tornando qui da un'altra schermata
  // (es. dopo aver modificato una scadenza altrove) senza che view/cursor
  // siano cambiati, un useEffect legato al mount da solo non ricaricherebbe
  // gli eventi aggiornati.
  useFocusEffect(React.useCallback(() => { load(); }, [load]));

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
      sincronizzaSeConnesso();
      setMoveTarget(null);
      load();
    } catch (e: any) { Alert.alert("Errore", e.message); }
  };

  const eliminaEvento = (e: any) => {
    Alert.alert("Elimina scadenza", `Eliminare "${e.titolo}"?`, [
      { text: "Annulla", style: "cancel" },
      { text: "Elimina", style: "destructive", onPress: async () => { await api.del(`/scadenze/${e.id}`); sincronizzaSeConnesso(); load(); } },
    ]);
  };

  const apriNuovo = () => {
    setNuovoTitolo("");
    setNuovoData(selectedDay);
    setNuovoOra(null);
    setNuovoCategoria("generale");
    setNuovoPriorita("media");
    setNuovoPromemoria([1]);
    setNuovoDescrizione("");
    setNuovoPraticaId(null);
    setShowNuovo(true);
  };
  const creaEvento = async () => {
    if (!nuovoTitolo.trim() || !nuovoData) return;
    setSavingNuovo(true);
    try {
      await api.post("/scadenze", {
        pratica_id: nuovoPraticaId,
        titolo: nuovoTitolo.trim(),
        descrizione: nuovoDescrizione.trim(),
        data: nuovoData,
        ora: nuovoOra,
        categoria: nuovoCategoria,
        priorita: nuovoPriorita,
        promemoria: nuovoPromemoria,
      });
      sincronizzaSeConnesso();
      setShowNuovo(false);
      load();
    } catch (e: any) {
      Alert.alert("Errore", e.message || "Impossibile creare l'evento. Riprova.");
    } finally {
      setSavingNuovo(false);
    }
  };

  const EventCard = ({ e }: { e: any }) => (
    <Pressable onLongPress={() => apriSposta(e)} style={[{ flexDirection: "row", borderRadius: RADIUS.lg, marginBottom: SPACING.sm, overflow: "hidden", backgroundColor: t.surface }, SHADOW.card]}>
      <View style={{ width: 4, backgroundColor: priColor(e.priorita) }} />
      <View style={{ flex: 1, padding: SPACING.md }}>
        <Text style={{ color: t.onSurface, fontWeight: "700" }}>{e.titolo}</Text>
        <Text style={{ color: t.onSurfaceTertiary, fontSize: 12, marginTop: 2, fontVariant: ["tabular-nums"] }}>{e.data} · {formatOra(e.ora)} · {e.categoria}</Text>
        {e.pratica ? <Text style={{ color: t.onSurfaceSecondary, fontSize: 12 }} numberOfLines={1}>{e.pratica.oggetto}</Text> : null}
      </View>
      <Pressable onPress={() => apriSposta(e)} style={{ padding: SPACING.md, justifyContent: "center" }}>
        <Feather name="move" size={16} color={t.onSurfaceTertiary} />
      </Pressable>
      <Pressable onPress={() => eliminaEvento(e)} style={{ padding: SPACING.md, justifyContent: "center" }}>
        <Feather name="trash-2" size={16} color={t.error} />
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
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: t.surfaceSecondary }}>
      <Header
        variant="hero"
        title="Calendario"
        onBack={() => router.back()}
        right={
          <Pressable testID="new-evento-btn" onPress={apriNuovo} style={{ width: 38, height: 38, borderRadius: RADIUS.pill, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.18)" }}>
            <Feather name="plus" size={20} color={t.onBrand} />
          </Pressable>
        }
      />

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
            <View style={[s.monthCard, { backgroundColor: t.surface }, SHADOW.card]}>
              <View style={{ flexDirection: "row" }}>
                {DOW.map((d, i) => <Text key={i} style={{ flex: 1, textAlign: "center", color: t.onSurfaceTertiary, fontSize: 11, fontWeight: "700" }}>{d}</Text>)}
              </View>
              <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 8 }}>
                {cells.map((d, i) => {
                  if (d === null) return <View key={i} style={{ width: "14.28%", aspectRatio: 1 }} />;
                  const ds = `${monthStr}-${String(d).padStart(2, "0")}`;
                  const dayEvents = evByDay[ds] || [];
                  const has = dayEvents.length > 0;
                  const hasAlta = dayEvents.some((e: any) => e.priorita === "alta");
                  const sel = ds === selectedDay;
                  const isToday = ds === toISODate(today);
                  const dotColor = sel ? t.onBrand : hasAlta ? t.error : t.brand;
                  return (
                    <Pressable key={i} testID={`day-${d}`} onPress={() => setSelectedDay(ds)} style={{ width: "14.28%", aspectRatio: 1, alignItems: "center", justifyContent: "center" }}>
                      <View
                        style={{
                          width: 34, height: 34, borderRadius: 17,
                          backgroundColor: sel ? t.brand : has ? t.brandSecondary : "transparent",
                          borderWidth: isToday && !sel ? 1.5 : 0, borderColor: t.brand,
                          alignItems: "center", justifyContent: "center",
                        }}
                      >
                        <Text style={{ color: sel ? t.onBrand : isToday ? t.brand : t.onSurface, fontWeight: sel || isToday ? "800" : "500", fontSize: 13, fontVariant: ["tabular-nums"] }}>{d}</Text>
                      </View>
                      {has ? (
                        <View style={{ flexDirection: "row", gap: 2, marginTop: 3, height: 5 }}>
                          {dayEvents.slice(0, 3).map((_: any, di: number) => (
                            <View key={di} style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: dotColor }} />
                          ))}
                        </View>
                      ) : (
                        <View style={{ height: 5, marginTop: 3 }} />
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={[s.monthCard, { backgroundColor: t.surface, marginTop: SPACING.md }, SHADOW.card]}>
              <Text style={{ color: t.onSurface, fontWeight: "800", fontSize: 15, marginBottom: SPACING.sm }}>Eventi del {selectedDay}</Text>
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
              (evByDay[toISODate(cursor)] || []).sort((a, b) => chiaveOrdinamentoOra(a.ora).localeCompare(chiaveOrdinamentoOra(b.ora))).map((e) => <EventCard key={e.id} e={e} />)}
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
            <Text style={{ fontSize: 11, fontWeight: "600", color: t.onSurfaceTertiary, marginBottom: 4 }}>Nuova data</Text>
            <DataInput testID="sposta-data" value={moveDate} onChange={setMoveDate} />
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

      {showNuovo ? (
        <SwipeBackScreen edges={["top"]} style={{ backgroundColor: t.surface }} onDismiss={() => setShowNuovo(false)}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
            <Header variant="hero" title="Nuovo evento" onBack={() => setShowNuovo(false)} />
            <ScrollView contentContainerStyle={{ padding: SPACING.lg }}>
              <Text style={[s.lbl, { color: t.onSurfaceSecondary }]}>Titolo *</Text>
              <TextInput
                testID="nuovo-evento-titolo"
                value={nuovoTitolo}
                onChangeText={setNuovoTitolo}
                placeholder="Es. Udienza"
                placeholderTextColor={t.onSurfaceTertiary}
                style={[s.input, { backgroundColor: t.surfaceSecondary, color: t.onSurface, borderColor: t.border }]}
              />

              <Text style={[s.lbl, { color: t.onSurfaceSecondary }]}>Data</Text>
              <DataInput testID="nuovo-evento-data" value={nuovoData} onChange={setNuovoData} />

              <OrarioInput value={nuovoOra} onChange={setNuovoOra} />

              <Text style={[s.lbl, { color: t.onSurfaceSecondary }]}>Categoria</Text>
              <SelectInput
                testID="nuovo-evento-categoria"
                value={nuovoCategoria}
                onChange={setNuovoCategoria}
                opzioni={[
                  { value: "generale", label: "Generale" },
                  { value: "udienza", label: "Udienza" },
                  { value: "deposito", label: "Deposito" },
                  { value: "notifica", label: "Notifica" },
                  { value: "riunione", label: "Riunione" },
                ]}
              />

              <Text style={[s.lbl, { color: t.onSurfaceSecondary }]}>Priorità</Text>
              <SelectInput
                testID="nuovo-evento-priorita"
                value={nuovoPriorita}
                onChange={setNuovoPriorita}
                opzioni={[
                  { value: "bassa", label: "Bassa" },
                  { value: "media", label: "Media" },
                  { value: "alta", label: "Alta" },
                ]}
              />

              <PromemoriaInput value={nuovoPromemoria} onChange={setNuovoPromemoria} />

              <PraticaPicker
                pratiche={pratiche}
                praticaId={nuovoPraticaId}
                onChange={setNuovoPraticaId}
                helperText={nuovoPraticaId ? "Comparirà anche nella scheda di quella pratica." : "Comparirà solo qui in Calendario."}
              />

              <Text style={[s.lbl, { color: t.onSurfaceSecondary }]}>Descrizione (facoltativa)</Text>
              <TextInput
                testID="nuovo-evento-descrizione"
                value={nuovoDescrizione}
                onChangeText={setNuovoDescrizione}
                multiline
                placeholder="Note aggiuntive"
                placeholderTextColor={t.onSurfaceTertiary}
                style={[s.input, { backgroundColor: t.surfaceSecondary, color: t.onSurface, borderColor: t.border, minHeight: 70, textAlignVertical: "top" }]}
              />

              <Pressable
                testID="submit-nuovo-evento"
                onPress={creaEvento}
                disabled={savingNuovo || !nuovoTitolo.trim()}
                style={{ marginTop: SPACING.lg, backgroundColor: t.brand, padding: SPACING.md, borderRadius: RADIUS.md, alignItems: "center", opacity: savingNuovo || !nuovoTitolo.trim() ? 0.6 : 1 }}
              >
                <Text style={{ color: t.onBrand, fontWeight: "700" }}>{savingNuovo ? "Creazione..." : "Crea evento"}</Text>
              </Pressable>
            </ScrollView>
          </KeyboardAvoidingView>
        </SwipeBackScreen>
      ) : null}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  monthBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: SPACING.lg, borderBottomWidth: 1 },
  monthCard: { marginHorizontal: SPACING.lg, marginTop: SPACING.md, borderRadius: RADIUS.lg, padding: SPACING.md },
  lbl: { fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5, marginTop: SPACING.md, marginBottom: SPACING.xs },
  input: { borderWidth: 1, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.md, fontSize: 14 },
});
