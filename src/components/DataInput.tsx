import React from "react";
import { View, Text, Pressable, Platform } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "@/src/ThemeContext";
import { SPACING, RADIUS } from "@/src/theme";
import { isoToDataIt } from "@/src/utils/formatoItaliano";

function isoToDate(iso: string): Date {
  const [y, m, d] = (iso || "").split("-").map(Number);
  if (!y || !m || !d) return new Date();
  return new Date(y, m - 1, d);
}

function dateToIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Selettore di data: mostra sempre il valore in formato italiano
// (gg-mm-aaaa) e si apre sempre tramite il selettore nativo, cosi' non si
// possono digitare date in formati ambigui (es. 03/04 inteso come giorno o
// mese?) o in un formato diverso da quello richiesto. value/onChange usano
// sempre l'ISO yyyy-mm-dd, lo stesso formato atteso dal backend.
export default function DataInput({
  value, onChange, testID, placeholder = "Seleziona data",
}: {
  value: string;
  onChange: (iso: string) => void;
  testID?: string;
  placeholder?: string;
}) {
  const { t } = useTheme();
  const [aperto, setAperto] = React.useState(false);
  // Su iOS (display "spinner") l'onChange nativo si attiva a ogni scorrimento
  // della rotella: tenerne traccia qui e ri-propagarlo esplicitamente alla
  // chiusura ("Fatto") è una rete di sicurezza contro un eventuale evento
  // finale non recapitato dal bridge nativo durante uno scorrimento rapido,
  // che lascerebbe il valore fermo a una posizione intermedia nonostante la
  // selezione sia stata completata.
  const ultimoSelezionato = React.useRef<Date | null>(null);

  const onPick = (event: any, selected?: Date) => {
    if (Platform.OS === "android") {
      setAperto(false);
      if (event.type !== "dismissed" && selected) onChange(dateToIso(selected));
    } else if (selected) {
      ultimoSelezionato.current = selected;
      onChange(dateToIso(selected));
    }
  };

  const chiudi = () => {
    if (ultimoSelezionato.current) onChange(dateToIso(ultimoSelezionato.current));
    setAperto(false);
  };

  return (
    <View>
      <Pressable
        testID={testID}
        onPress={() => { ultimoSelezionato.current = null; setAperto(true); }}
        style={{
          flexDirection: "row", alignItems: "center", justifyContent: "space-between",
          borderWidth: 1, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.md,
          backgroundColor: t.surfaceSecondary, borderColor: t.border,
        }}
      >
        <Text style={{ color: value ? t.onSurface : t.onSurfaceTertiary, fontSize: 14, fontVariant: ["tabular-nums"] }}>
          {value ? isoToDataIt(value) : placeholder}
        </Text>
        <Feather name="calendar" size={16} color={t.onSurfaceTertiary} />
      </Pressable>
      {aperto ? (
        <View style={{ marginTop: SPACING.xs, alignItems: "flex-end" }}>
          {/* Senza backgroundColor/themeVariant espliciti, su iOS il
              selettore a rotella segue il tema CHIARO/SCURO DI SISTEMA
              invece di quello scelto nell'app: se i due non coincidono il
              testo risulta dello stesso colore dello sfondo sottostante
              (invisibile, ma funzionante — si continua a poter scorrere
              "alla cieca" e il valore cambia comunque). */}
          <View style={{ backgroundColor: t.surface, borderRadius: RADIUS.md }}>
            <DateTimePicker value={isoToDate(value)} mode="date" display={Platform.OS === "ios" ? "spinner" : "default"} onChange={onPick} locale="it-IT" themeVariant={(t.mode as string) === "dark" ? "dark" : "light"} />
          </View>
          {Platform.OS === "ios" ? (
            <Pressable testID={testID ? `${testID}-fatto` : undefined} onPress={chiudi} style={{ paddingVertical: 6, paddingHorizontal: SPACING.md }}>
              <Text style={{ color: t.brand, fontWeight: "700" }}>Fatto</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
