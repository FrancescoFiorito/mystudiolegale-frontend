import React from "react";
import { View, Text, StyleProp, TextStyle } from "react-native";
import PasswordHint from "@/src/components/PasswordHint";

// Etichetta di un campo password con il pulsante "?" dei requisiti sulla
// stessa riga. Centralizzata qui (invece di ripetere la riga in ogni
// schermata) perché lasciare che ogni etichetta usi il proprio lineHeight
// implicito fa sì che il pallino "?" (fisso a 18px) risulti allineato in
// modo diverso a seconda del testo (es. "PASSWORD" tutto maiuscolo vs
// "Nuova password" con la "p" che scende sotto la riga): fissare qui lo
// stesso lineHeight del pallino garantisce lo stesso allineamento ovunque.
export default function PasswordFieldLabel({ label, style }: { label: string; style?: StyleProp<TextStyle> }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <Text style={[style, { lineHeight: 18 }]}>{label}</Text>
      <PasswordHint />
    </View>
  );
}
