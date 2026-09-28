import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { useTheme } from "@/src/ThemeContext";
import { api } from "@/src/api";
import { SPACING, RADIUS, SHADOW } from "@/src/theme";
import Header from "@/src/components/Header";

const statoColor = (t: any, st: string) => st === "Aperta" ? t.info : st === "Chiusa" ? t.success : t.onSurfaceTertiary;

export default function ClienteDettaglio() {
  const { t } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [cliente, setCliente] = React.useState<any>(null);
  const [pratiche, setPratiche] = React.useState<any[] | null>(null);
  const [q, setQ] = React.useState("");

  const load = React.useCallback(async () => {
    const [c, p] = await Promise.all([
      api.get(`/clienti/${id}`),
      api.get(`/pratiche?cliente_id=${id}`),
    ]);
    setCliente(c);
    setPratiche(p);
  }, [id]);

  // useFocusEffect invece di useEffect: tornando indietro su questa
  // schermata (es. dopo aver modificato una pratica collegata) resta
  // montata sotto, quindi senza questo i dati non si aggiornerebbero.
  useFocusEffect(React.useCallback(() => { load(); }, [load]));

  if (!cliente) {
    return (
      <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: t.surfaceSecondary, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={t.brand} />
      </SafeAreaView>
    );
  }

  const nome = cliente.ragione_sociale || `${cliente.nome} ${cliente.cognome || ""}`.trim();
  const iniziali = nome.trim().slice(0, 2).toUpperCase();

  const praticheFiltrate = !pratiche ? null : !q.trim() ? pratiche : pratiche.filter((p) => {
    const qq = q.trim().toLowerCase();
    return (p.oggetto || "").toLowerCase().includes(qq) || (p.controparte || "").toLowerCase().includes(qq);
  });

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: t.surfaceSecondary }}>
      <Header variant="hero" title={nome} subtitle={cliente.tipo === "azienda" ? "Azienda" : "Persona fisica"} onBack={() => router.back()} />
      <ScrollView contentContainerStyle={{ padding: SPACING.lg, paddingBottom: SPACING.xxxl }}>
        <View style={[s.infoCard, { backgroundColor: t.surface }, SHADOW.card]}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: SPACING.md, marginBottom: SPACING.sm }}>
            <View style={{ width: 44, height: 44, borderRadius: RADIUS.pill, backgroundColor: t.brandTertiary, alignItems: "center", justifyContent: "center" }}>
              <Text style={{ color: t.brand, fontWeight: "700" }}>{iniziali}</Text>
            </View>
            <Text style={{ color: t.onSurface, fontSize: 17, fontWeight: "800", flex: 1 }} numberOfLines={1}>{nome}</Text>
          </View>
          {cliente.email ? <View style={s.infoRow}><Feather name="mail" size={14} color={t.onSurfaceTertiary} /><Text style={{ color: t.onSurfaceSecondary, fontSize: 13 }}>{cliente.email}</Text></View> : null}
          {cliente.telefono ? <View style={s.infoRow}><Feather name="phone" size={14} color={t.onSurfaceTertiary} /><Text style={{ color: t.onSurfaceSecondary, fontSize: 13 }}>{cliente.telefono}</Text></View> : null}
          {cliente.indirizzo ? <View style={s.infoRow}><Feather name="map-pin" size={14} color={t.onSurfaceTertiary} /><Text style={{ color: t.onSurfaceSecondary, fontSize: 13 }}>{cliente.indirizzo} {cliente.citta ? `- ${cliente.citta}` : ""}</Text></View> : null}
          {cliente.codice_fiscale ? <View style={s.infoRow}><Feather name="file-text" size={14} color={t.onSurfaceTertiary} /><Text style={{ color: t.onSurfaceSecondary, fontSize: 13 }}>CF: {cliente.codice_fiscale}</Text></View> : null}
          {cliente.partita_iva ? <View style={s.infoRow}><Feather name="briefcase" size={14} color={t.onSurfaceTertiary} /><Text style={{ color: t.onSurfaceSecondary, fontSize: 13 }}>P.IVA: {cliente.partita_iva}</Text></View> : null}
        </View>

        <Text style={[s.section, { color: t.onSurfaceSecondary }]}>PRATICHE ({pratiche?.length ?? 0})</Text>
        {pratiche && pratiche.length > 0 ? (
          <View style={[s.searchBox, { backgroundColor: t.surface, borderColor: t.border }]}>
            <Feather name="search" size={15} color={t.onSurfaceTertiary} />
            <TextInput
              testID="cliente-pratiche-search"
              value={q}
              onChangeText={setQ}
              placeholder="Cerca per oggetto o controparte..."
              placeholderTextColor={t.onSurfaceTertiary}
              style={{ flex: 1, marginLeft: 8, color: t.onSurface, fontSize: 13 }}
            />
          </View>
        ) : null}
        {!praticheFiltrate ? <ActivityIndicator color={t.brand} /> : praticheFiltrate.length === 0 ? (
          <Text style={{ color: t.onSurfaceTertiary, fontStyle: "italic" }}>
            {pratiche && pratiche.length > 0 ? "Nessuna pratica trovata" : "Nessuna pratica per questo cliente"}
          </Text>
        ) : praticheFiltrate.map((p) => (
          <Pressable key={p.id} testID={`cliente-pratica-${p.id}`} onPress={() => router.push({ pathname: "/(app)/pratica/[id]", params: { id: p.id } })} style={[s.row, { backgroundColor: t.surface }, SHADOW.card]}>
            <View style={[s.rowIcon, { backgroundColor: t.brandSecondary }]}><Feather name="folder" size={18} color={t.brand} /></View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={{ color: t.onSurface, fontWeight: "700", flex: 1 }} numberOfLines={1}>{p.oggetto}</Text>
                <View style={{ backgroundColor: statoColor(t, p.stato) + "22", paddingHorizontal: 8, paddingVertical: 2, borderRadius: RADIUS.pill, marginLeft: 8 }}>
                  <Text style={{ color: statoColor(t, p.stato), fontSize: 10, fontWeight: "700" }}>{p.stato}</Text>
                </View>
              </View>
              {p.controparte ? <Text style={{ color: t.onSurfaceTertiary, fontSize: 12, marginTop: 2 }} numberOfLines={1}>vs {p.controparte}</Text> : null}
            </View>
            <Feather name="chevron-right" size={18} color={t.onSurfaceTertiary} />
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  infoCard: { borderRadius: RADIUS.lg, padding: SPACING.lg, gap: 8, marginBottom: SPACING.lg },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  section: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5, marginBottom: SPACING.sm },
  row: { flexDirection: "row", alignItems: "center", gap: SPACING.md, padding: SPACING.md, borderRadius: RADIUS.lg, marginBottom: SPACING.sm },
  rowIcon: { width: 40, height: 40, borderRadius: RADIUS.md, alignItems: "center", justifyContent: "center" },
  searchBox: { flexDirection: "row", alignItems: "center", borderRadius: RADIUS.md, borderWidth: 1, paddingHorizontal: SPACING.md, paddingVertical: 10, marginBottom: SPACING.sm },
});
