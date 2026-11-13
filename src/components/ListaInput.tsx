import React from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "@/src/ThemeContext";
import { SPACING, RADIUS } from "@/src/theme";
import DataInput from "@/src/components/DataInput";
import SelectInput from "@/src/components/SelectInput";

export type CampoRigaLista =
  | { tipo: "numero"; key: string; label: string; default?: string }
  | { tipo: "testo"; key: string; label: string; default?: string }
  | { tipo: "data"; key: string; label: string; default?: string }
  | { tipo: "scelta"; key: string; label: string; opzioni: { value: string; label: string }[] | ((form: Record<string, any>) => { value: string; label: string }[]); default?: string };

function rigaVuota(campiRiga: CampoRigaLista[]): Record<string, string> {
  const riga: Record<string, string> = {};
  campiRiga.forEach((c) => {
    riga[c.key] = c.default ?? (c.tipo === "scelta" && typeof c.opzioni !== "function" ? c.opzioni[0]?.value ?? "" : "");
  });
  return riga;
}

// Elenco di righe ripetibili (aggiungi/rimuovi), ciascuna con gli stessi
// campi (numero, data o scelta): usato per i calcolatori il cui backend si
// aspetta una lista di oggetti (es. acconti versati nel tempo, periodi di
// credito pena) invece di un singolo valore — stesso pattern visivo già
// usato per le parti assistite delle parcelle (riquadro con cestino per
// riga, "+ aggiungi" sotto), qui reso generico per qualunque forma di riga.
export default function ListaInput({
  value, onChange, campiRiga, testID, etichettaAggiungi = "Aggiungi una voce", form,
}: {
  value: Record<string, string>[];
  onChange: (v: Record<string, string>[]) => void;
  campiRiga: CampoRigaLista[];
  testID?: string;
  etichettaAggiungi?: string;
  // Stato del form che contiene la lista: serve alle opzioni dinamiche (funzione) di un campo "scelta".
  form?: Record<string, any>;
}) {
  const { t } = useTheme();

  const aggiorna = (indice: number, key: string, v: string) => {
    onChange(value.map((riga, i) => (i === indice ? { ...riga, [key]: v } : riga)));
  };
  const rimuovi = (indice: number) => onChange(value.filter((_, i) => i !== indice));
  const aggiungi = () => onChange([...value, rigaVuota(campiRiga)]);

  return (
    <View>
      {value.map((riga, indice) => (
        <View key={indice} style={{ marginTop: indice === 0 ? 0 : SPACING.sm, padding: SPACING.md, borderRadius: RADIUS.md, backgroundColor: t.surfaceSecondary }}>
          <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
            <Pressable testID={testID ? `${testID}-rimuovi-${indice}` : undefined} onPress={() => rimuovi(indice)} style={{ padding: 4 }}>
              <Feather name="trash-2" size={16} color={t.onSurfaceTertiary} />
            </Pressable>
          </View>
          {campiRiga.map((c) => (
            <View key={c.key} style={{ marginTop: SPACING.xs }}>
              <Text style={{ fontSize: 11, fontWeight: "600", color: t.onSurfaceSecondary, marginBottom: 4 }}>{c.label}</Text>
              {c.tipo === "data" ? (
                <DataInput testID={testID ? `${testID}-${indice}-${c.key}` : undefined} value={riga[c.key] || ""} onChange={(v) => aggiorna(indice, c.key, v)} />
              ) : c.tipo === "scelta" ? (
                <SelectInput testID={testID ? `${testID}-${indice}-${c.key}` : undefined} value={riga[c.key] || ""} onChange={(v) => aggiorna(indice, c.key, v)} opzioni={typeof c.opzioni === "function" ? c.opzioni(form || {}) : c.opzioni} />
              ) : (
                <TextInput
                  testID={testID ? `${testID}-${indice}-${c.key}` : undefined}
                  value={riga[c.key] ?? ""}
                  onChangeText={(v) => aggiorna(indice, c.key, v)}
                  keyboardType={c.tipo === "testo" ? "default" : "numeric"}
                  style={{
                    borderWidth: 1, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
                    backgroundColor: t.surface, color: t.onSurface, borderColor: t.border, fontSize: 14,
                  }}
                />
              )}
            </View>
          ))}
        </View>
      ))}
      <Pressable testID={testID ? `${testID}-aggiungi` : undefined} onPress={aggiungi} style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: SPACING.sm }}>
        <Feather name="plus-circle" size={16} color={t.brand} />
        <Text style={{ color: t.brand, fontWeight: "700", fontSize: 13 }}>{etichettaAggiungi}</Text>
      </Pressable>
    </View>
  );
}
