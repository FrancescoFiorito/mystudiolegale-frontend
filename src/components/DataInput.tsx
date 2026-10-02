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

  const onPick = (event: any, selected?: Date) => {
    if (Platform.OS === "android") {
      setAperto(false);
      if (event.type !== "dismissed" && selected) onChange(dateToIso(selected));
    } else if (selected) {
      onChange(dateToIso(selected));
    }
  };

  return (
    <View>
      <Pressable
        testID={testID}
        onPress={() => setAperto(true)}
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
          <DateTimePicker value={isoToDate(value)} mode="date" display={Platform.OS === "ios" ? "spinner" : "default"} onChange={onPick} locale="it-IT" />
          {Platform.OS === "ios" ? (
            <Pressable testID={testID ? `${testID}-fatto` : undefined} onPress={() => setAperto(false)} style={{ paddingVertical: 6, paddingHorizontal: SPACING.md }}>
              <Text style={{ color: t.brand, fontWeight: "700" }}>Fatto</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
