import React from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import { useTheme } from "@/src/ThemeContext";
import { SPACING, RADIUS } from "@/src/theme";

// Editor per l'orario di una scadenza: "tutta la giornata" (default, ora
// nullo) oppure un orario specifico HH:MM.
export default function OrarioInput({ value, onChange }: { value: string | null; onChange: (v: string | null) => void }) {
  const { t } = useTheme();
  const tuttoIlGiorno = !value;

  return (
    <>
      <Text style={[lbl, { color: t.onSurfaceSecondary }]}>Orario</Text>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <Pressable
          testID="orario-tutto-giorno"
          onPress={() => onChange(null)}
          style={{ flex: 1, padding: 10, borderRadius: RADIUS.md, backgroundColor: tuttoIlGiorno ? t.brand : t.surfaceSecondary, alignItems: "center", borderWidth: 1, borderColor: t.border }}
        >
          <Text style={{ color: tuttoIlGiorno ? t.onBrand : t.onSurfaceSecondary, fontWeight: "600", fontSize: 13 }}>Tutta la giornata</Text>
        </Pressable>
        <Pressable
          testID="orario-specifico"
          onPress={() => onChange(value || "09:00")}
          style={{ flex: 1, padding: 10, borderRadius: RADIUS.md, backgroundColor: !tuttoIlGiorno ? t.brand : t.surfaceSecondary, alignItems: "center", borderWidth: 1, borderColor: t.border }}
        >
          <Text style={{ color: !tuttoIlGiorno ? t.onBrand : t.onSurfaceSecondary, fontWeight: "600", fontSize: 13 }}>Orario specifico</Text>
        </Pressable>
      </View>
      {!tuttoIlGiorno ? (
        <TextInput
          testID="orario-input"
          value={value || ""}
          onChangeText={onChange}
          placeholder="HH:MM"
          placeholderTextColor={t.onSurfaceTertiary}
          style={[input, { backgroundColor: t.surfaceSecondary, color: t.onSurface, borderColor: t.border, marginTop: SPACING.sm }]}
        />
      ) : null}
    </>
  );
}

const lbl = { fontSize: 11, fontWeight: "600" as const, textTransform: "uppercase" as const, letterSpacing: 0.5, marginTop: SPACING.md, marginBottom: SPACING.xs };
const input = { borderWidth: 1, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.md, fontSize: 14 };
