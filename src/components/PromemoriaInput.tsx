import React from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "@/src/ThemeContext";
import { SPACING, RADIUS } from "@/src/theme";

// Editor per l'array "promemoria" (giorni prima della scadenza in cui
// arriva il promemoria): un valore sempre presente, un secondo opzionale
// su un giorno diverso.
export default function PromemoriaInput({ value, onChange }: { value: number[]; onChange: (v: number[]) => void }) {
  const { t } = useTheme();
  const primo = value[0] ?? 1;
  const secondo = value.length > 1 ? value[1] : undefined;

  const setPrimo = (n: number) => onChange(secondo !== undefined ? [n, secondo] : [n]);
  const setSecondo = (n: number) => onChange([primo, n]);
  const aggiungiSecondo = () => onChange([primo, primo === 7 ? 1 : 7]);
  const rimuoviSecondo = () => onChange([primo]);

  return (
    <>
      <Text style={lbl}>Promemoria (giorni prima)</Text>
      <TextInput
        testID="promemoria-1"
        value={String(primo)}
        onChangeText={(v) => setPrimo(Math.max(0, parseInt(v, 10) || 0))}
        keyboardType="number-pad"
        style={[input, { backgroundColor: t.surfaceSecondary, color: t.onSurface, borderColor: t.border }]}
      />
      {secondo !== undefined ? (
        <>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: SPACING.md }}>
            <Text style={[lbl, { marginTop: 0 }]}>Secondo promemoria (giorni prima)</Text>
            <Pressable testID="promemoria-rimuovi-secondo" onPress={rimuoviSecondo} hitSlop={8}>
              <Feather name="x" size={14} color={t.error} />
            </Pressable>
          </View>
          <TextInput
            testID="promemoria-2"
            value={String(secondo)}
            onChangeText={(v) => setSecondo(Math.max(0, parseInt(v, 10) || 0))}
            keyboardType="number-pad"
            style={[input, { backgroundColor: t.surfaceSecondary, color: t.onSurface, borderColor: t.border }]}
          />
        </>
      ) : (
        <Pressable testID="promemoria-aggiungi-secondo" onPress={aggiungiSecondo} style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: SPACING.sm }}>
          <Feather name="plus-circle" size={14} color={t.brand} />
          <Text style={{ color: t.brand, fontSize: 12, fontWeight: "600" }}>Aggiungi un secondo promemoria</Text>
        </Pressable>
      )}
    </>
  );
}

const lbl = { fontSize: 11, fontWeight: "600" as const, textTransform: "uppercase" as const, letterSpacing: 0.5, marginTop: SPACING.md, marginBottom: SPACING.xs, color: "#64748B" };
const input = { borderWidth: 1, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.md, fontSize: 14 };
