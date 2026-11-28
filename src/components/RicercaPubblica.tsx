import React from "react";
import { View, Text, Pressable, TextInput, ActivityIndicator, ScrollView, AccessibilityInfo } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "@/src/ThemeContext";
import { SPACING, RADIUS } from "@/src/theme";
import { api } from "@/src/api";
import { RICERCHE, RicercaId } from "@/src/utils/ricerchePubbliche";

// Schermata di ricerca su dati pubblici (codici catastali, uffici giudiziari, UNEP) aperta dal menù Calcolatori.
// La ricerca parte dopo una breve pausa di digitazione e annulla la richiesta superata da una più recente.

type Comune = { comune: string; provincia?: string; regione?: string; codice?: string; soppresso?: boolean };
type Ufficio = {
  nome: string; tipo_etichetta?: string; indirizzo?: string; cap?: string; comune?: string;
  telefono?: string; fax?: string; email?: string; pec?: string;
};
type Risposta = {
  introduzione?: string[]; note?: string[]; fonti?: string[]; aggiornato_al?: string | null; avviso?: string | null;
  risultati?: Comune[]; comuni?: Comune[]; comune?: Comune | null; uffici?: Ufficio[];
};
type Stato = "vuoto" | "caricamento" | "pronto" | "errore";

const ATTESA_MS = 300;
const CODICE_RE = /^[A-Za-z]\d{3}$/;

const nomeComune = (c: Comune) => (c.provincia ? `${c.comune} (${c.provincia})` : c.comune);
const indirizzoUfficio = (u: Ufficio) => [u.indirizzo, [u.cap, u.comune].filter(Boolean).join(" ")].filter(Boolean).join(", ");

export default function RicercaPubblica({ id }: { id: RicercaId }) {
  const { t } = useTheme();
  const cfg = RICERCHE[id];
  const [testo, setTesto] = React.useState("");
  // Codice catastale del comune scelto tra più candidati (o del comune già individuato).
  const [codiceScelto, setCodiceScelto] = React.useState<string | null>(null);
  const [tutti, setTutti] = React.useState(false);
  const [tentativo, setTentativo] = React.useState(0);
  const [stato, setStato] = React.useState<Stato>("vuoto");
  const [risposta, setRisposta] = React.useState<Risposta | null>(null);
  const [errore, setErrore] = React.useState("");

  const q = testo.trim();
  const codiceDigitato = cfg.kind === "codici" && CODICE_RE.test(q);
  const cercabile = !!codiceScelto || q.length >= 2 || codiceDigitato;

  React.useEffect(() => {
    if (!cercabile) {
      setStato("vuoto"); setRisposta(null); setErrore("");
      return;
    }
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      const p = new URLSearchParams();
      if (codiceScelto) p.set("codice", codiceScelto);
      else if (codiceDigitato) p.set("codice", q.toUpperCase());
      else p.set("q", q);
      if (cfg.puoVisualizzareTutti && tutti) p.set("tutti", "true");
      setStato("caricamento");
      try {
        const r = await api.get<Risposta>(`${cfg.endpoint}?${p.toString()}`, { signal: ctrl.signal });
        setRisposta(r); setErrore(""); setStato("pronto");
      } catch (e: any) {
        if (ctrl.signal.aborted) return;
        setRisposta(null); setErrore(e?.message || "Ricerca non disponibile, riprova."); setStato("errore");
      }
    }, ATTESA_MS);
    return () => { clearTimeout(timer); ctrl.abort(); };
  }, [q, codiceScelto, tutti, tentativo, cercabile, codiceDigitato, cfg]);

  const conteggio = !risposta ? 0 : cfg.kind === "codici" ? (risposta.risultati?.length ?? 0) : risposta.comune ? (risposta.uffici?.length ?? 0) : (risposta.comuni?.length ?? 0);
  React.useEffect(() => {
    if (stato === "pronto") AccessibilityInfo.announceForAccessibility(conteggio === 0 ? "Nessun risultato" : `${conteggio} risultati`);
  }, [stato, risposta, conteggio]);

  const scheda = { backgroundColor: t.surfaceSecondary, borderColor: t.border, borderWidth: 1, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.sm } as const;
  const vuoto = (testoVuoto: string) => (
    <View testID="ricerca-pubblica-vuoto" accessibilityLabel={testoVuoto} style={{ alignItems: "center", paddingVertical: SPACING.xl }}>
      <Feather name="search" size={36} color={t.onSurfaceTertiary} />
      <Text style={{ color: t.onSurfaceTertiary, marginTop: SPACING.sm, textAlign: "center" }}>{testoVuoto}</Text>
    </View>
  );
  const avviso = risposta?.avviso ? (
    <View testID="ricerca-pubblica-avviso" accessibilityRole="alert" style={{ borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.md, backgroundColor: t.surfaceSecondary, borderWidth: 1, borderColor: t.warning, flexDirection: "row", gap: SPACING.sm }}>
      <Feather name="alert-triangle" size={16} color={t.warning} />
      <Text style={{ color: t.onSurface, fontSize: 13, flex: 1 }}>{risposta.avviso}</Text>
    </View>
  ) : null;

  const comuneCard = (c: Comune, selezionabile: boolean) => {
    const etichetta = `${nomeComune(c)}, ${c.regione ?? ""}${c.codice ? `, codice ${c.codice}` : ""}${c.soppresso ? ", soppresso" : ""}`;
    const corpo = (
      <>
        <Text style={{ color: t.onSurface, fontWeight: "700", fontSize: 15 }}>{nomeComune(c)}</Text>
        <Text style={{ color: t.onSurfaceSecondary, fontSize: 12, marginTop: 2 }}>
          {[c.regione, c.codice ? `Codice ${c.codice}` : null].filter(Boolean).join(" · ")}
        </Text>
        {c.soppresso ? <Text style={{ color: t.warning, fontSize: 11, fontWeight: "700", textTransform: "uppercase", marginTop: 4 }}>Comune soppresso</Text> : null}
      </>
    );
    if (!selezionabile) return <View key={`${c.comune}-${c.provincia}-${c.codice}`} accessible accessibilityLabel={etichetta} style={scheda}>{corpo}</View>;
    return (
      <Pressable
        key={`${c.comune}-${c.provincia}-${c.codice}`} testID={`ricerca-pubblica-comune-${c.codice}`}
        accessibilityRole="button" accessibilityLabel={etichetta} accessibilityHint="Mostra gli uffici di questo comune"
        onPress={() => setCodiceScelto(c.codice ?? null)} style={scheda}
      >
        {corpo}
      </Pressable>
    );
  };

  const ufficioCard = (u: Ufficio, i: number) => {
    const righe = [
      indirizzoUfficio(u),
      u.telefono ? `Tel. ${u.telefono}` : null,
      u.fax ? `Fax ${u.fax}` : null,
      u.email ? `Email ${u.email}` : null,
      u.pec ? `PEC ${u.pec}` : null,
    ].filter(Boolean) as string[];
    return (
      <View key={`${u.nome}-${i}`} accessible accessibilityLabel={[u.nome, u.tipo_etichetta, ...righe].filter(Boolean).join(", ")} style={scheda}>
        <Text style={{ color: t.onSurface, fontWeight: "700", fontSize: 15 }}>{u.nome}</Text>
        {u.tipo_etichetta ? <Text style={{ color: t.onSurfaceTertiary, fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5, marginTop: 2 }}>{u.tipo_etichetta}</Text> : null}
        {righe.map((r, j) => <Text key={j} style={{ color: t.onSurfaceSecondary, fontSize: 13, marginTop: 3 }}>{r}</Text>)}
      </View>
    );
  };

  const corpoRisultati = () => {
    if (!risposta) return null;
    if (cfg.kind === "codici") {
      const lista = risposta.risultati ?? [];
      if (!lista.length) return vuoto(`Nessun comune trovato per «${q}».`);
      return lista.map((c) => comuneCard(c, false));
    }
    const comuni = risposta.comuni ?? [];
    if (!risposta.comune) {
      if (!comuni.length) return vuoto(`Nessun comune trovato per «${q}».`);
      return (
        <>
          <Text style={{ color: t.onSurfaceSecondary, fontSize: 13, marginBottom: SPACING.sm }}>Più comuni corrispondono a «{q}». Scegline uno:</Text>
          {comuni.map((c) => comuneCard(c, true))}
        </>
      );
    }
    const uffici = risposta.uffici ?? [];
    return (
      <>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: SPACING.sm, gap: SPACING.sm }}>
          <Text accessibilityRole="header" style={{ color: t.onSurface, fontWeight: "800", fontSize: 15, flex: 1 }}>{nomeComune(risposta.comune)}</Text>
          {codiceScelto ? (
            <Pressable testID="ricerca-pubblica-altri-comuni" accessibilityRole="button" accessibilityLabel="Torna all'elenco dei comuni" onPress={() => setCodiceScelto(null)}>
              <Text style={{ color: t.brand, fontSize: 13, fontWeight: "600" }}>Altri comuni</Text>
            </Pressable>
          ) : null}
        </View>
        {cfg.puoVisualizzareTutti ? (
          <Pressable
            testID="ricerca-pubblica-tutti" accessibilityRole="switch" accessibilityLabel="Visualizza tutti gli uffici"
            accessibilityState={{ checked: tutti }} onPress={() => setTutti((v) => !v)}
            style={{ flexDirection: "row", alignItems: "center", gap: SPACING.sm, marginBottom: SPACING.md }}
          >
            <Feather name={tutti ? "check-square" : "square"} size={18} color={tutti ? t.brand : t.onSurfaceTertiary} />
            <Text style={{ color: t.onSurface, fontSize: 14 }}>Visualizza tutti gli uffici</Text>
          </Pressable>
        ) : null}
        {uffici.length ? uffici.map(ufficioCard) : vuoto("Nessun ufficio per questo comune.")}
      </>
    );
  };

  return (
    <ScrollView contentContainerStyle={{ padding: SPACING.lg, paddingBottom: SPACING.xxxl }} keyboardShouldPersistTaps="handled">
      <TextInput
        testID="ricerca-pubblica-campo"
        accessibilityLabel={cfg.segnaposto}
        accessibilityHint="La ricerca parte mentre digiti"
        value={testo}
        onChangeText={(v) => { setTesto(v); setCodiceScelto(null); }}
        placeholder={cfg.segnaposto}
        placeholderTextColor={t.onSurfaceTertiary}
        autoCorrect={false}
        autoCapitalize="words"
        returnKeyType="search"
        clearButtonMode="while-editing"
        style={{ borderWidth: 1, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.md, fontSize: 16, backgroundColor: t.surfaceSecondary, color: t.onSurface, borderColor: t.border }}
      />
      {!cercabile ? (
        <Text style={{ color: t.onSurfaceTertiary, fontSize: 12, marginTop: SPACING.sm }}>Scrivi almeno 2 lettere: i risultati compaiono mentre digiti.</Text>
      ) : null}

      <View style={{ marginTop: SPACING.lg }}>
        {stato === "caricamento" ? (
          <View accessibilityLabel="Ricerca in corso" style={{ alignItems: "center", paddingVertical: SPACING.xl }}>
            <ActivityIndicator color={t.brand} />
            <Text style={{ color: t.onSurfaceSecondary, marginTop: SPACING.sm }}>Cerco…</Text>
          </View>
        ) : null}

        {stato === "errore" ? (
          <View testID="ricerca-pubblica-errore" accessibilityRole="alert" style={{ alignItems: "center", paddingVertical: SPACING.xl, gap: SPACING.sm }}>
            <Feather name="alert-circle" size={36} color={t.error} />
            <Text style={{ color: t.onSurface, textAlign: "center" }}>{errore}</Text>
            <Pressable testID="ricerca-pubblica-riprova" accessibilityRole="button" accessibilityLabel="Riprova la ricerca" onPress={() => setTentativo((n) => n + 1)} style={{ paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md }}>
              <Text style={{ color: t.brand, fontWeight: "700" }}>Riprova</Text>
            </Pressable>
          </View>
        ) : null}

        {stato === "pronto" ? (
          <>
            {avviso}
            {corpoRisultati()}
            {risposta?.introduzione?.map((p, i) => <Text key={`i${i}`} style={{ color: t.onSurfaceSecondary, fontSize: 12, marginTop: SPACING.md }}>{p}</Text>)}
            {risposta?.note?.map((p, i) => <Text key={`n${i}`} style={{ color: t.onSurfaceSecondary, fontSize: 12, marginTop: SPACING.sm }}>{p}</Text>)}
            {risposta?.fonti?.map((p, i) => <Text key={`f${i}`} style={{ color: t.onSurfaceTertiary, fontSize: 11, marginTop: SPACING.sm }}>{p}</Text>)}
            {risposta?.aggiornato_al ? <Text style={{ color: t.onSurfaceTertiary, fontSize: 11, marginTop: SPACING.sm }}>Dati aggiornati al {risposta.aggiornato_al}</Text> : null}
          </>
        ) : null}
      </View>
    </ScrollView>
  );
}
