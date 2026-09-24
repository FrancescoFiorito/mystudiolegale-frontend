import React from "react";
import { View, Text, StyleProp, TextStyle, StyleSheet } from "react-native";
import { useTheme } from "@/src/ThemeContext";
import PasswordHint from "@/src/components/PasswordHint";

// Etichetta di un campo password con il pulsante "?" dei requisiti sulla
// stessa riga. Centralizzata qui (invece di ripetere la riga in ogni
// schermata) per evitare due bug che rendevano il pallino "?" (fisso a
// 18px) disallineato rispetto al testo:
// 1) lineHeight implicito diverso a seconda del testo dell'etichetta
//    (es. "PASSWORD" tutto maiuscolo vs "Nuova password" con la "p" che
//    scende sotto la riga) — fissato qui a 18px, uguale al pallino;
// 2) le etichette (`s.label`/`s.lbl` nelle varie schermate) hanno un
//    marginBottom per staccarsi dal campo sottostante: se lo si lascia
//    sul <Text>, il suo "riquadro" (testo + margine) diventa più alto di
//    quello del pallino (che non ha margine), e alignItems:"center" li
//    centra ciascuno nel proprio riquadro — spingendo il pallino più in
//    basso rispetto al testo. Va quindi spostato sulla riga nel suo
//    complesso, non lasciato sul testo.
export default function PasswordFieldLabel({ label, style, required = false }: { label: string; style?: StyleProp<TextStyle>; required?: boolean }) {
  const { t } = useTheme();
  const { marginBottom, ...textStyle } = StyleSheet.flatten(style) || {};
  return (
    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: marginBottom ?? 0 }}>
      <Text style={[textStyle, { lineHeight: 18, includeFontPadding: false, textAlignVertical: "center", marginBottom: 0 }]}>
        {label}{required ? <Text style={{ color: t.error }}> *</Text> : null}
      </Text>
      <PasswordHint />
    </View>
  );
}
