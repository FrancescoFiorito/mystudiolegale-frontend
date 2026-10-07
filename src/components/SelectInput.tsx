import React from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "@/src/ThemeContext";
import { SPACING, RADIUS } from "@/src/theme";

// Selettore a tendina per una scelta singola tra più opzioni: sostituisce la
// fila di pulsanti ("pill") usata in precedenza, che con più di 2-3 opzioni
// non era scorrevole e lasciava le voci fuori dallo schermo irraggiungibili.
// Si apre/chiude in sede (niente overlay a schermo intero: le opzioni sono
// poche e corte, un vero menu a tendina basta).
type Opzione = { value: string; label: string };

export default function SelectInput({
  value, onChange, opzioni, placeholder = "Seleziona", testID,
}: {
  value: string;
  onChange: (v: string) => void;
  opzioni: Opzione[];
  placeholder?: string;
  testID?: string;
}) {
  const { t } = useTheme();
  const [aperto, setAperto] = React.useState(false);
  const selezionata = opzioni.find((o) => o.value === value);

  return (
    <View>
      <Pressable
        testID={testID}
        onPress={() => setAperto(!aperto)}
        style={{
          flexDirection: "row", alignItems: "center", justifyContent: "space-between",
          borderWidth: 1, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.md,
          backgroundColor: t.surfaceSecondary, borderColor: t.border,
        }}
      >
        <Text style={{ color: selezionata ? t.onSurface : t.onSurfaceTertiary, fontSize: 14, flex: 1 }} numberOfLines={1}>
          {selezionata?.label || placeholder}
        </Text>
        <Feather name={aperto ? "chevron-up" : "chevron-down"} size={16} color={t.onSurfaceTertiary} />
      </Pressable>
      {aperto ? (
        <View style={{ marginTop: SPACING.xs, borderWidth: 1, borderRadius: RADIUS.md, borderColor: t.border, backgroundColor: t.surface, maxHeight: 240, overflow: "hidden" }}>
          <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
            {opzioni.map((o) => (
              <Pressable
                key={o.value}
                testID={testID ? `${testID}-opzione-${o.value}` : undefined}
                onPress={() => { onChange(o.value); setAperto(false); }}
                style={{ paddingVertical: 10, paddingHorizontal: SPACING.md, backgroundColor: o.value === value ? t.brandSecondary : "transparent" }}
              >
                <Text style={{ color: o.value === value ? t.brand : t.onSurface, fontSize: 13, fontWeight: o.value === value ? "700" : "400" }}>
                  {o.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}
