import React from "react";
import { View, Text, TextInput, Pressable, ScrollView, ActivityIndicator, AccessibilityInfo } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useTheme } from "@/src/ThemeContext";
import { SPACING, RADIUS } from "@/src/theme";
import { api } from "@/src/api";
import DataInput from "@/src/components/DataInput";
import SelectInput from "@/src/components/SelectInput";
import ListaInput from "@/src/components/ListaInput";
import EsportaDocumento from "@/src/components/EsportaDocumento";
import { costruisciBody, modulaIniziale } from "@/src/modelliAtti/corpo";
import type { CampoModello, ModelloAtto as Modello, Modulo, RispostaModello } from "@/src/modelliAtti/tipi";

// Modulo generico dei modelli di atti: disegna i campi descritti in `modello`, chiama l'endpoint,
// mostra l'anteprima del testo (con promemoria e avviso solo a schermo) e permette di copiare il
// testo o esportarlo in PDF / Word. I dati restano finché la schermata che lo contiene resta aperta.
export default function ModelloAtto({ modello }: { modello: Modello }) {
  const { t } = useTheme();
  const [form, setForm] = React.useState<Modulo>(() => modulaIniziale(modello));
  const [risposta, setRisposta] = React.useState<RispostaModello | null>(null);
  const [obsoleta, setObsoleta] = React.useState(false);
  const [errore, setErrore] = React.useState<string | null>(null);
  const [inCorso, setInCorso] = React.useState(false);
  const [copiato, setCopiato] = React.useState(false);
  const scrollRef = React.useRef<ScrollView>(null);
  const yRisultato = React.useRef(0);
  const prefisso = `modello-${modello.id}`;

  const imposta = (key: string, v: any) => {
    setForm((f) => ({ ...f, [key]: v }));
    setObsoleta(true);
  };

  const genera = async () => {
    if (inCorso) return;
    setInCorso(true);
    setErrore(null);
    try {
      const r = await api.post<RispostaModello>(modello.endpoint, costruisciBody(modello, form));
      setRisposta(r);
      setObsoleta(false);
      setTimeout(() => scrollRef.current?.scrollTo({ y: Math.max(0, yRisultato.current - SPACING.md), animated: true }), 150);
      AccessibilityInfo.announceForAccessibility?.("Documento generato");
    } catch (e: any) {
      const m = typeof e?.message === "string" ? e.message : "";
      setErrore(!m || /network request failed|failed to fetch|load failed/i.test(m) ? "Impossibile contattare il server. Controlla la connessione e riprova." : m);
    } finally {
      setInCorso(false);
    }
  };

  const copia = async () => {
    if (!risposta) return;
    try {
      await Clipboard.setStringAsync(risposta.testo);
      setCopiato(true);
      AccessibilityInfo.announceForAccessibility?.("Testo copiato");
      setTimeout(() => setCopiato(false), 2000);
    } catch {}
  };

  const stileInput = { borderWidth: 1, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.md, fontSize: 14, backgroundColor: t.surfaceSecondary, color: t.onSurface, borderColor: t.border } as const;
  const etichetta = (c: CampoModello) => `${c.label}${c.obbligatorio ? " *" : ""}`;
  const lbl = { fontSize: 11, fontWeight: "600" as const, textTransform: "uppercase" as const, letterSpacing: 0.5, marginTop: SPACING.md, marginBottom: SPACING.xs, color: t.onSurfaceSecondary };
  const aiuto = (c: CampoModello) => (c.aiuto ? <Text style={{ fontSize: 11, color: t.onSurfaceSecondary, marginTop: 4 }}>{c.aiuto}</Text> : null);

  const campo = (c: CampoModello) => {
    if (c.mostraSe && !c.mostraSe(form)) return null;
    const id = `${prefisso}-${c.key}`;
    if (c.tipo === "bool") {
      const spuntata = !!form[c.key];
      return (
        <View key={c.key}>
          <Pressable testID={id} accessibilityRole="checkbox" accessibilityLabel={c.label} accessibilityHint={c.aiuto} accessibilityState={{ checked: spuntata }}
            onPress={() => imposta(c.key, !spuntata)} style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: SPACING.md, minHeight: 32 }}>
            <View style={{ width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: t.brand, backgroundColor: spuntata ? t.brand : "transparent", alignItems: "center", justifyContent: "center" }}>
              {spuntata ? <Feather name="check" size={14} color={t.onBrand} /> : null}
            </View>
            <Text style={{ color: t.onSurface, flex: 1 }}>{c.label}</Text>
          </Pressable>
          {aiuto(c)}
        </View>
      );
    }
    if (c.tipo === "lista") {
      return (
        <View key={c.key}>
          <Text accessibilityRole="header" style={lbl}>{etichetta(c)}</Text>
          <ListaInput testID={id} value={form[c.key] || []} onChange={(v) => imposta(c.key, v)} campiRiga={c.campi} etichettaAggiungi={c.etichettaAggiungi} form={form} max={c.max} nomeVoce={c.nomeVoce} />
        </View>
      );
    }
    return (
      <View key={c.key}>
        <Text style={lbl}>{etichetta(c)}</Text>
        {c.tipo === "scelta" ? (
          <SelectInput testID={id} accessibilityLabel={etichetta(c)} value={form[c.key] ?? ""} onChange={(v) => imposta(c.key, v)} opzioni={c.opzioni} />
        ) : c.tipo === "data" ? (
          <View>
            <DataInput testID={id} accessibilityLabel={etichetta(c)} placeholder={c.vuotaOggi ? "Oggi" : "Seleziona data"} value={form[c.key] || ""} onChange={(v) => imposta(c.key, v)} />
            {form[c.key] && !c.obbligatorio ? (
              <Pressable testID={`${id}-cancella`} accessibilityRole="button" accessibilityLabel={`Cancella ${c.label}`} onPress={() => imposta(c.key, "")} style={{ marginTop: 4, alignSelf: "flex-start", paddingVertical: 4 }}>
                <Text style={{ color: t.brand, fontSize: 12, fontWeight: "700" }}>{c.vuotaOggi ? "Usa la data di oggi" : "Cancella la data"}</Text>
              </Pressable>
            ) : null}
          </View>
        ) : (
          <TextInput
            testID={id} accessibilityLabel={etichetta(c)} accessibilityHint={c.aiuto}
            value={String(form[c.key] ?? "")} onChangeText={(v) => imposta(c.key, v)}
            placeholder={c.tipo === "testo" || c.tipo === "numero" ? c.segnaposto : undefined} placeholderTextColor={t.onSurfaceTertiary}
            multiline={c.tipo === "testo" && !!c.lungo}
            keyboardType={c.tipo === "numero" ? "numeric" : c.tipo === "testo" && c.tastiera ? c.tastiera : "default"}
            autoCapitalize={c.tipo === "testo" && c.tastiera === "email-address" ? "none" : "sentences"}
            style={[stileInput, c.tipo === "testo" && c.lungo ? { minHeight: 90, textAlignVertical: "top" } : null]}
          />
        )}
        {aiuto(c)}
      </View>
    );
  };

  return (
    <ScrollView ref={scrollRef} contentContainerStyle={{ padding: SPACING.lg, paddingBottom: SPACING.xxxl + 80 }} keyboardShouldPersistTaps="handled">
      <Text style={{ color: t.warning, fontSize: 12 }}>
        {modello.introduzione ? `${modello.introduzione} ` : ""}Il documento generato va sempre controllato prima dell&apos;uso. I campi con * sono obbligatori.
      </Text>
      {modello.gruppi.map((g, i) => (
        <View key={i} style={{ marginTop: SPACING.lg }}>
          {g.titolo ? <Text accessibilityRole="header" style={{ color: t.onSurface, fontSize: 15, fontWeight: "800" }}>{g.titolo}</Text> : null}
          {g.campi.map(campo)}
        </View>
      ))}

      <Pressable
        testID={`${prefisso}-genera`} accessibilityRole="button" accessibilityLabel="Genera" accessibilityState={{ busy: inCorso, disabled: inCorso }}
        onPress={genera} disabled={inCorso}
        style={{ marginTop: SPACING.xl, backgroundColor: t.brand, padding: SPACING.md, borderRadius: RADIUS.md, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8, opacity: inCorso ? 0.7 : 1 }}
      >
        {inCorso ? <ActivityIndicator size="small" color={t.onBrand} /> : null}
        <Text style={{ color: t.onBrand, fontWeight: "800", fontSize: 15 }}>{inCorso ? "Genero il documento..." : "Genera"}</Text>
      </Pressable>

      {errore ? (
        <View testID={`${prefisso}-errore`} accessibilityRole="alert" accessibilityLiveRegion="polite" style={{ marginTop: SPACING.md, padding: SPACING.md, borderRadius: RADIUS.md, borderWidth: 1, borderColor: t.error }}>
          <Text selectable style={{ color: t.error, fontSize: 13 }}>{errore}</Text>
        </View>
      ) : null}

      {risposta ? (
        <View onLayout={(e) => { yRisultato.current = e.nativeEvent.layout.y; }} testID={`${prefisso}-risultato`} style={{ marginTop: SPACING.xl }}>
          <Text accessibilityRole="header" style={{ color: t.onSurface, fontSize: 15, fontWeight: "800" }}>Anteprima</Text>
          {obsoleta ? <Text testID={`${prefisso}-obsoleta`} style={{ color: t.warning, fontSize: 12, marginTop: 4 }}>Hai modificato i dati dopo aver generato il documento: premi Genera per aggiornarlo.</Text> : null}
          <View style={{ marginTop: SPACING.sm, padding: SPACING.md, borderRadius: RADIUS.md, backgroundColor: t.surfaceSecondary, borderWidth: 1, borderColor: t.border }}>
            <Text accessibilityRole="header" style={{ color: t.onSurface, fontSize: 15, fontWeight: "800" }}>{risposta.titolo}</Text>
            {risposta.sottotitolo ? <Text style={{ color: t.onSurfaceSecondary, fontSize: 12, marginTop: 2 }}>{risposta.sottotitolo}</Text> : null}
            <Text selectable testID={`${prefisso}-testo`} style={{ color: t.onSurface, fontSize: 14, lineHeight: 21, marginTop: SPACING.sm }}>{risposta.testo}</Text>
          </View>

          {risposta.promemoria?.length ? (
            <View testID={`${prefisso}-promemoria`} style={{ marginTop: SPACING.md }}>
              <Text accessibilityRole="header" style={{ color: t.onSurface, fontSize: 13, fontWeight: "800" }}>Promemoria (solo per te, non va nel documento)</Text>
              {risposta.promemoria.map((p, i) => (
                <Text selectable key={i} style={{ color: t.onSurfaceSecondary, fontSize: 13, marginTop: 4 }}>• {p}</Text>
              ))}
            </View>
          ) : null}
          {risposta.avviso ? <Text testID={`${prefisso}-avviso`} style={{ color: t.warning, fontSize: 12, marginTop: SPACING.md }}>{risposta.avviso}</Text> : null}

          <Pressable testID={`${prefisso}-copia`} accessibilityRole="button" accessibilityLabel={copiato ? "Testo copiato" : "Copia testo"} onPress={copia}
            style={{ marginTop: SPACING.md, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, padding: 10, borderRadius: RADIUS.md, borderWidth: 1, borderColor: t.brand }}>
            <Feather name={copiato ? "check" : "copy"} size={16} color={t.brand} />
            <Text style={{ color: t.brand, fontWeight: "700" }}>{copiato ? "Testo copiato" : "Copia testo"}</Text>
          </Pressable>

          <View style={{ marginTop: SPACING.md, padding: SPACING.md, borderRadius: RADIUS.lg, backgroundColor: t.brandSecondary, borderColor: t.brand, borderWidth: 1 }}>
            <EsportaDocumento testIDPrefix={prefisso} titolo={risposta.titolo} sottotitolo={risposta.sottotitolo} sezioniPronte={risposta.sezioni} note={risposta.note} />
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}
