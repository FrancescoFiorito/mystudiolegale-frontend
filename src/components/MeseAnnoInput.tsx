import React from "react";
import { View, TextInput } from "react-native";
import { useTheme } from "@/src/ThemeContext";
import { SPACING, RADIUS } from "@/src/theme";
import SelectInput from "@/src/components/SelectInput";

const MESI_IT = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];
const OPZIONI_MESI = Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: MESI_IT[i] }));

function parti(value: string): { mese: string; anno: string } {
  const [anno, mese] = (value || "").split("-");
  return { anno: anno || "", mese: mese ? String(Number(mese)) : "" };
}

// Selettore di mese e anno, senza giorno: usato ovunque il backend lo ignora
// (adeguamento canone, devalutazione, inflazione, rivalutazione TFR), al
// posto di un DataInput completo (che farebbe scegliere un giorno inutile) o
// di due campi separati scelta+numero (che è il pattern duplicato in più
// calcolatori che questo componente sostituisce). value/onChange usano il
// formato "AAAA-MM".
export default function MeseAnnoInput({
  value, onChange, testID,
}: {
  value: string;
  onChange: (v: string) => void;
  testID?: string;
}) {
  const { t } = useTheme();
  const { mese, anno } = parti(value);

  return (
    <View style={{ flexDirection: "row", gap: SPACING.sm }}>
      <View style={{ flex: 1.3 }}>
        <SelectInput
          testID={testID ? `${testID}-mese` : undefined}
          value={mese}
          onChange={(m) => onChange(`${anno}-${m.padStart(2, "0")}`)}
          opzioni={OPZIONI_MESI}
          placeholder="Mese"
        />
      </View>
      <TextInput
        testID={testID ? `${testID}-anno` : undefined}
        value={anno}
        onChangeText={(a) => onChange(`${a}-${(mese || "1").padStart(2, "0")}`)}
        placeholder="Anno"
        placeholderTextColor={t.onSurfaceTertiary}
        keyboardType="numeric"
        maxLength={4}
        style={{
          flex: 1, borderWidth: 1, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.md,
          backgroundColor: t.surfaceSecondary, borderColor: t.border, color: t.onSurface, fontSize: 14,
        }}
      />
    </View>
  );
}
