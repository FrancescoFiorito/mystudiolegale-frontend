import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, TextInput, ActivityIndicator, Platform, KeyboardAvoidingView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as DocumentPicker from "expo-document-picker";
import { useRouter, useFocusEffect } from "expo-router";
import { useTheme } from "@/src/ThemeContext";
import { api } from "@/src/api";
import { SPACING, RADIUS, SHADOW } from "@/src/theme";
import Header from "@/src/components/Header";
import { anteprimaIntestazione } from "@/src/utils/esportaDocumento";

// Schermata "Intestazione documenti": l'intestazione professionale dello
// studio che compare sui PDF e Word esportati dai calcolatori (piani Pro e
// Studio). I valori arrivano gia' precompilati dal profilo; e' il server a
// decidere chi puo' vederla/modificarla (`abilitata`, `modificabile`).

const CAMPI = [
  { key: "nome_studio", label: "Nome dello studio" },
  { key: "indirizzo", label: "Indirizzo" },
  { key: "codice_fiscale", label: "Codice fiscale" },
  { key: "partita_iva", label: "Partita IVA", numerico: true },
  { key: "telefono", label: "Telefono", tastiera: "phone-pad" },
  { key: "email", label: "Email", tastiera: "email-address" },
  { key: "pec", label: "PEC", tastiera: "email-address" },
  { key: "sito_web", label: "Sito web", tastiera: "url" },
  { key: "ordine_avvocati", label: "Ordine degli avvocati di" },
  { key: "assicurazione", label: "Assicurazione professionale" },
  { key: "piede", label: "Riga a piè di pagina" },
] as const;
type ChiaveCampo = (typeof CAMPI)[number]["key"];
type Valori = Record<ChiaveCampo, string>;
type Stato = { abilitata: boolean; modificabile: boolean; ha_logo: boolean; personalizzata: boolean };

const MAX_LOGO_BYTES = 1024 * 1024;
const vuoti = (): Valori => Object.fromEntries(CAMPI.map((c) => [c.key, ""])) as Valori;

export default function Intestazione() {
  const { t } = useTheme();
  const router = useRouter();
  const [valori, setValori] = React.useState<Valori>(vuoti());
  const [stato, setStato] = React.useState<Stato | null>(null);
  const [errore, setErrore] = React.useState<string | null>(null);
  const [sporco, setSporco] = React.useState(false);
  const [salvando, setSalvando] = React.useState(false);
  const [anteprima, setAnteprima] = React.useState(false);
  const [logoOccupato, setLogoOccupato] = React.useState(false);
  const [logoVer, setLogoVer] = React.useState(0);
  const [logoWeb, setLogoWeb] = React.useState<string | null>(null);
  const [authHeaders, setAuthHeaders] = React.useState<Record<string, string>>({});

  const applica = React.useCallback((r: any) => {
    const v = vuoti();
    CAMPI.forEach((c) => { v[c.key] = r?.[c.key] ?? ""; });
    setValori(v);
    setStato({ abilitata: !!r?.abilitata, modificabile: !!r?.modificabile, ha_logo: !!r?.ha_logo, personalizzata: !!r?.personalizzata });
    setSporco(false);
  }, []);

  // useFocusEffect: ogni volta che si torna qui (es. dopo aver cambiato piano
  // dalla schermata dei piani) lo stato dell'intestazione va riletto.
  useFocusEffect(React.useCallback(() => {
    let attivo = true;
    (async () => {
      try {
        const r = await api.get("/studio/intestazione");
        if (!attivo) return;
        setErrore(null);
        applica(r);
        setLogoVer((n) => n + 1);
        setAuthHeaders((await api.authHeader()) as Record<string, string>);
      } catch (e: any) {
        if (attivo) setErrore(e.message || "Impossibile caricare l'intestazione.");
      }
    })();
    return () => { attivo = false; };
  }, [applica]));

  // Anteprima del logo. Il file e' protetto: su dispositivo expo-image lo
  // scarica con l'header Authorization, su web lo si scarica con fetch.
  React.useEffect(() => {
    if (Platform.OS !== "web" || !stato?.ha_logo) { setLogoWeb(null); return; }
    let attivo = true;
    let url: string | null = null;
    (async () => {
      try {
        const res = await fetch(`${api.base}/api/studio/intestazione/logo`, { headers: (await api.authHeader()) as HeadersInit });
        if (!res.ok) return;
        url = URL.createObjectURL(await res.blob());
        if (attivo) setLogoWeb(url);
      } catch {}
    })();
    return () => { attivo = false; if (url) URL.revokeObjectURL(url); };
  }, [stato?.ha_logo, logoVer]);

  const sololettura = !stato || !stato.abilitata || !stato.modificabile;

  const vaiAiPiani = () => router.push({ pathname: "/(app)/profilo", params: { piano: "1" } });

  const salva = async () => {
    if (salvando || sololettura) return;
    setSalvando(true);
    try {
      const r = await api.put("/studio/intestazione", valori);
      applica(r);
      Alert.alert("Intestazione salvata", "Comparirà sui PDF e sui file Word esportati.");
    } catch (e: any) {
      Alert.alert("Errore", e.message || "Impossibile salvare l'intestazione. Riprova.");
    } finally {
      setSalvando(false);
    }
  };

  const mostraAnteprima = async () => {
    if (anteprima) return;
    setAnteprima(true);
    try {
      await anteprimaIntestazione();
    } catch (e: any) {
      Alert.alert("Errore", e.message || "Impossibile creare l'anteprima. Riprova.");
    } finally {
      setAnteprima(false);
    }
  };

  const scegliLogo = async () => {
    if (logoOccupato || sololettura) return;
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: ["image/png", "image/jpeg"], copyToCacheDirectory: true, multiple: false });
      if (res.canceled || !res.assets?.[0]) return;
      const file = res.assets[0];
      const nome = file.name || "logo";
      const mime = file.mimeType || (/\.png$/i.test(nome) ? "image/png" : /\.jpe?g$/i.test(nome) ? "image/jpeg" : "");
      if (mime !== "image/png" && mime !== "image/jpeg") {
        Alert.alert("Formato non supportato", "Il logo deve essere un'immagine PNG o JPEG.");
        return;
      }
      if (typeof file.size === "number" && file.size > MAX_LOGO_BYTES) {
        Alert.alert("Logo troppo grande", "Il logo supera 1 MB. Scegli un'immagine più leggera (PNG o JPEG, massimo 1 MB).");
        return;
      }
      setLogoOccupato(true);
      const form = new FormData();
      if (Platform.OS === "web") {
        const blob = (file as any).file ?? (await (await fetch(file.uri)).blob());
        form.append("file", blob, nome);
      } else {
        // @ts-ignore - RN FormData file shape
        form.append("file", { uri: file.uri, name: nome, type: mime });
      }
      await api.upload("/studio/intestazione/logo", form);
      setStato((s) => (s ? { ...s, ha_logo: true } : s));
      setLogoVer((n) => n + 1);
    } catch (e: any) {
      Alert.alert("Errore", e.message || "Impossibile caricare il logo. Riprova.");
    } finally {
      setLogoOccupato(false);
    }
  };

  const rimuoviLogo = () => {
    if (logoOccupato || sololettura) return;
    Alert.alert("Rimuovi logo", "Il logo non comparirà più sui documenti esportati. Continuare?", [
      { text: "Annulla", style: "cancel" },
      {
        text: "Rimuovi", style: "destructive", onPress: async () => {
          setLogoOccupato(true);
          try {
            await api.del("/studio/intestazione/logo");
            setStato((s) => (s ? { ...s, ha_logo: false } : s));
            setLogoVer((n) => n + 1);
          } catch (e: any) {
            Alert.alert("Errore", e.message || "Impossibile rimuovere il logo. Riprova.");
          } finally {
            setLogoOccupato(false);
          }
        },
      },
    ]);
  };

  const riquadro = (testID: string, testo: string, conPiani: boolean) => (
    <View testID={testID} accessibilityRole="alert" style={{ backgroundColor: t.brandSecondary, borderColor: t.brand, borderWidth: 1, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md }}>
      <Text style={{ color: t.onBrandSecondary, fontSize: 13, lineHeight: 19 }}>{testo}</Text>
      {conPiani ? (
        <Pressable testID="intestazione-vedi-piani" accessibilityRole="button" accessibilityLabel="Vedi i piani" onPress={vaiAiPiani} style={{ marginTop: SPACING.sm, alignSelf: "flex-start", backgroundColor: t.brand, paddingVertical: 8, paddingHorizontal: 14, borderRadius: RADIUS.md }}>
          <Text style={{ color: t.onBrand, fontWeight: "700" }}>Vedi i piani</Text>
        </Pressable>
      ) : null}
    </View>
  );

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: t.surfaceSecondary }}>
      <Header variant="hero" title="Intestazione documenti" onBack={() => router.back()} backTestID="intestazione-indietro" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: SPACING.lg, paddingBottom: SPACING.xxxl + 80 }}>
          {errore ? (
            <Text testID="intestazione-errore" accessibilityRole="alert" style={{ color: t.error, marginBottom: SPACING.md }}>{errore}</Text>
          ) : null}
          {!stato && !errore ? <ActivityIndicator color={t.brand} style={{ marginTop: SPACING.xl }} accessibilityLabel="Caricamento" /> : null}
          {stato && !stato.abilitata ? riquadro("intestazione-piano", "L'intestazione dei documenti è disponibile con i piani Pro e Studio. Con il piano attuale i PDF esportati hanno la filigrana e non riportano l'intestazione dello studio.", true) : null}
          {stato && stato.abilitata && !stato.modificabile ? riquadro("intestazione-permesso", "L'intestazione può essere modificata solo da chi gestisce lo studio.", false) : null}

          {stato ? (
            <>
              <Text style={[s.section, { color: t.onSurfaceSecondary, marginTop: 0 }]}>LOGO</Text>
              <View style={[s.card, { backgroundColor: t.surface }, SHADOW.card]}>
                {stato.ha_logo ? (
                  <View testID="intestazione-logo-anteprima" accessibilityRole="image" accessibilityLabel="Logo dello studio" style={[s.logoBox, { borderColor: t.border, backgroundColor: t.surfaceSecondary }]}>
                    {Platform.OS === "web" ? (
                      logoWeb ? <Image source={{ uri: logoWeb }} style={{ width: "100%", height: "100%" }} contentFit="contain" /> : <ActivityIndicator color={t.brand} />
                    ) : (
                      <Image source={{ uri: `${api.base}/api/studio/intestazione/logo?v=${logoVer}`, headers: authHeaders }} cachePolicy="none" style={{ width: "100%", height: "100%" }} contentFit="contain" />
                    )}
                  </View>
                ) : (
                  <Text style={{ color: t.onSurfaceTertiary, fontSize: 13 }}>Nessun logo caricato. Facoltativo: PNG o JPEG, massimo 1 MB.</Text>
                )}
                {!sololettura ? (
                  <View style={{ flexDirection: "row", gap: SPACING.sm, marginTop: SPACING.md }}>
                    <Pressable testID="intestazione-logo-scegli" accessibilityRole="button" accessibilityLabel={stato.ha_logo ? "Sostituisci il logo" : "Scegli il logo"} accessibilityState={{ busy: logoOccupato, disabled: logoOccupato }} onPress={scegliLogo} disabled={logoOccupato} style={[s.btn, { backgroundColor: t.brand, opacity: logoOccupato ? 0.6 : 1 }]}>
                      {logoOccupato ? <ActivityIndicator size="small" color={t.onBrand} /> : <Feather name="image" size={16} color={t.onBrand} />}
                      <Text style={{ color: t.onBrand, fontWeight: "700" }}>{stato.ha_logo ? "Sostituisci" : "Scegli immagine"}</Text>
                    </Pressable>
                    {stato.ha_logo ? (
                      <Pressable testID="intestazione-logo-rimuovi" accessibilityRole="button" accessibilityLabel="Rimuovi il logo" accessibilityState={{ disabled: logoOccupato }} onPress={rimuoviLogo} disabled={logoOccupato} style={[s.btn, { backgroundColor: t.surfaceSecondary, borderWidth: 1, borderColor: t.border, opacity: logoOccupato ? 0.6 : 1 }]}>
                        <Feather name="trash-2" size={16} color={t.error} />
                        <Text style={{ color: t.error, fontWeight: "700" }}>Rimuovi</Text>
                      </Pressable>
                    ) : null}
                  </View>
                ) : null}
              </View>

              <Text style={[s.section, { color: t.onSurfaceSecondary }]}>DATI DELLO STUDIO</Text>
              {CAMPI.map((c) => (
                <View key={c.key}>
                  <Text style={[s.lbl, { color: t.onSurfaceSecondary }]}>{c.label}</Text>
                  <TextInput
                    testID={`intestazione-${c.key}`}
                    accessibilityLabel={c.label}
                    accessibilityState={{ disabled: sololettura }}
                    value={valori[c.key]}
                    onChangeText={(v) => { setValori((p) => ({ ...p, [c.key]: v })); setSporco(true); }}
                    editable={!sololettura}
                    keyboardType={"tastiera" in c ? c.tastiera : "default"}
                    autoCapitalize={"tastiera" in c ? "none" : "sentences"}
                    style={[s.input, { backgroundColor: t.surface, color: t.onSurface, borderColor: t.border, opacity: sololettura ? 0.7 : 1 }]}
                  />
                </View>
              ))}

              {!sololettura ? (
                <Pressable testID="intestazione-salva" accessibilityRole="button" accessibilityLabel="Salva" accessibilityState={{ busy: salvando, disabled: salvando }} onPress={salva} disabled={salvando} style={[s.submit, { backgroundColor: t.brand, opacity: salvando ? 0.6 : 1 }]}>
                  <Text style={{ color: t.onBrand, fontWeight: "700" }}>{salvando ? "Salvataggio..." : "Salva"}</Text>
                </Pressable>
              ) : null}
              <Pressable testID="intestazione-anteprima" accessibilityRole="button" accessibilityLabel="Anteprima PDF" accessibilityState={{ busy: anteprima, disabled: anteprima }} onPress={mostraAnteprima} disabled={anteprima} style={[s.submit, { backgroundColor: t.surface, borderWidth: 1, borderColor: t.brand, opacity: anteprima ? 0.6 : 1, marginTop: SPACING.sm }]}>
                {anteprima ? <ActivityIndicator size="small" color={t.brand} /> : null}
                <Text style={{ color: t.brand, fontWeight: "700" }}>{anteprima ? "Creo l'anteprima..." : "Anteprima PDF"}</Text>
              </Pressable>
              <Text style={{ color: t.onSurfaceTertiary, fontSize: 11, marginTop: SPACING.xs }}>
                {sporco ? "Hai modifiche non salvate: l'anteprima mostra l'intestazione salvata." : "L'anteprima mostra l'intestazione salvata."}
              </Text>
            </>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  section: { fontSize: 12, fontWeight: "700", letterSpacing: 0.5, marginTop: SPACING.lg, marginBottom: SPACING.sm },
  lbl: { fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5, marginTop: SPACING.md, marginBottom: SPACING.xs },
  input: { borderWidth: 1, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.md, fontSize: 14 },
  card: { borderRadius: RADIUS.lg, padding: SPACING.md },
  logoBox: { height: 110, borderWidth: 1, borderRadius: RADIUS.md, alignItems: "center", justifyContent: "center", overflow: "hidden", padding: SPACING.sm },
  btn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, padding: 10, borderRadius: RADIUS.md },
  submit: { marginTop: SPACING.lg, paddingVertical: SPACING.md, borderRadius: RADIUS.md, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8 },
});
