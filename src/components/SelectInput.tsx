import React from "react";
import { View, Text, Pressable, ScrollView, TextInput } from "react-native";
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
  value, onChange, opzioni, placeholder = "Seleziona", testID, disabled = false, cercabile = false,
}: {
  value: string;
  onChange: (v: string) => void;
  opzioni: Opzione[];
  placeholder?: string;
  testID?: string;
  disabled?: boolean;
  // Per elenchi lunghi (decine di voci): aggiunge un campo di ricerca in
  // cima alla tendina, con l'elenco completo mostrato subito all'apertura e
  // filtrato man mano che si scrive (stesso comportamento del selettore di
  // voci notevoli del c.p.c. in Scadenze Processuali).
  cercabile?: boolean;
}) {
  const { t } = useTheme();
  const [aperto, setAperto] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const selezionata = opzioni.find((o) => o.value === value);
  const opzioniFiltrate = cercabile && query.trim()
    ? opzioni.filter((o) => o.label.toLowerCase().includes(query.trim().toLowerCase()))
    : opzioni;

  return (
    <View>
      <Pressable
        testID={testID}
        onPress={() => { if (disabled) return; setQuery(""); setAperto(!aperto); }}
        style={{
          flexDirection: "row", alignItems: "center", justifyContent: "space-between",
          borderWidth: 1, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.md,
          backgroundColor: t.surfaceSecondary, borderColor: t.border, opacity: disabled ? 0.6 : 1,
        }}
      >
        <Text style={{ color: selezionata ? t.onSurface : t.onSurfaceTertiary, fontSize: 14, flex: 1 }} numberOfLines={1}>
          {selezionata?.label || placeholder}
        </Text>
        {disabled ? null : <Feather name={aperto ? "chevron-up" : "chevron-down"} size={16} color={t.onSurfaceTertiary} />}
      </Pressable>
      {aperto && !disabled ? (
        <View style={{ marginTop: SPACING.xs, borderWidth: 1, borderRadius: RADIUS.md, borderColor: t.border, backgroundColor: t.surface, maxHeight: 280, overflow: "hidden" }}>
          {cercabile ? (
            <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: t.border }}>
              <Feather name="search" size={14} color={t.onSurfaceTertiary} />
              <TextInput
                testID={testID ? `${testID}-cerca` : undefined}
                value={query}
                onChangeText={setQuery}
                placeholder="Cerca..."
                placeholderTextColor={t.onSurfaceTertiary}
                style={{ flex: 1, marginLeft: 8, color: t.onSurface, fontSize: 13 }}
                autoFocus
              />
            </View>
          ) : null}
          <ScrollView style={{ maxHeight: cercabile ? 240 : 280 }} nestedScrollEnabled keyboardShouldPersistTaps="handled">
            {opzioniFiltrate.length === 0 ? (
              <Text style={{ color: t.onSurfaceTertiary, fontSize: 12, fontStyle: "italic", padding: SPACING.md }}>Nessuna voce trovata</Text>
            ) : (
              opzioniFiltrate.map((o) => (
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
              ))
            )}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}
