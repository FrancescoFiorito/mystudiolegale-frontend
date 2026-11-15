import React from "react";
import { View, Text, Pressable, ActivityIndicator, Alert } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "@/src/ThemeContext";
import { useAuth } from "@/src/AuthContext";
import { SPACING, RADIUS } from "@/src/theme";
import { esportaDocumento, DatiEsportazione, FormatoEsportazione } from "@/src/utils/esportaDocumento";

type Props = DatiEsportazione & {
  // Prefisso dei testID (es. "gen" -> "gen-esporta-pdf").
  testIDPrefix: string;
};

// Pulsanti "PDF" e "Word" comuni a tutti i calcolatori. Il piano gratuito ha
// solo il PDF (con filigrana): "Word" resta visibile e, se premuto, invita ai
// piani Pro e Studio. La decisione finale e' del server (403 gestito qui).
export default function EsportaDocumento({ testIDPrefix, ...dati }: Props) {
  const { t } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [inCorso, setInCorso] = React.useState<FormatoEsportazione | null>(null);
  const piano = user?.piano || "free";
  const gratuito = piano === "free" || piano === "no_ads";

  const vaiAiPiani = () => router.push({ pathname: "/(app)/profilo", params: { piano: "1" } });
  const invitoPiani = (messaggio: string) =>
    Alert.alert("Formato Word", messaggio, [
      { text: "Chiudi", style: "cancel" },
      { text: "Vedi i piani", onPress: vaiAiPiani },
    ]);

  const esporta = async (formato: FormatoEsportazione) => {
    if (inCorso) return;
    if (formato === "docx" && gratuito) {
      invitoPiani("Il formato Word è disponibile con i piani Pro e Studio.");
      return;
    }
    setInCorso(formato);
    try {
      await esportaDocumento(formato, dati);
    } catch (e: any) {
      const msg = e?.message || "Impossibile esportare il documento. Riprova.";
      if (formato === "docx" && /piani Pro e Studio/.test(msg)) invitoPiani(msg);
      else Alert.alert("Errore", msg);
    } finally {
      setInCorso(null);
    }
  };

  const pulsante = (formato: FormatoEsportazione, etichetta: string, icona: "file-text" | "file") => (
    <Pressable
      testID={`${testIDPrefix}-esporta-${formato === "pdf" ? "pdf" : "word"}`}
      accessibilityRole="button"
      accessibilityLabel={`Esporta in ${etichetta}`}
      accessibilityState={{ busy: inCorso === formato, disabled: !!inCorso }}
      onPress={() => esporta(formato)}
      disabled={!!inCorso}
      style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: t.brand, padding: 10, borderRadius: RADIUS.md, opacity: inCorso && inCorso !== formato ? 0.6 : 1 }}
    >
      {inCorso === formato ? <ActivityIndicator size="small" color={t.onBrand} /> : <Feather name={icona} size={16} color={t.onBrand} />}
      <Text style={{ color: t.onBrand, fontWeight: "700" }}>{inCorso === formato ? "Creo il file..." : etichetta}</Text>
    </Pressable>
  );

  return (
    <View testID={`${testIDPrefix}-esporta`} style={{ marginTop: SPACING.md }}>
      <Text style={{ color: t.onBrandSecondary, fontSize: 11, fontWeight: "700", marginBottom: SPACING.xs }}>ESPORTA</Text>
      <View style={{ flexDirection: "row", gap: SPACING.sm }}>
        {pulsante("pdf", "PDF", "file-text")}
        {pulsante("docx", "Word", "file")}
      </View>
      {gratuito ? (
        <Text testID={`${testIDPrefix}-esporta-filigrana`} style={{ color: t.onBrandSecondary, fontSize: 11, marginTop: SPACING.xs }}>Il PDF del piano gratuito ha la filigrana</Text>
      ) : null}
    </View>
  );
}
