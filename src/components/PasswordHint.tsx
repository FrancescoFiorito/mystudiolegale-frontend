import React from "react";
import { Pressable, Text, Alert, StyleProp, ViewStyle } from "react-native";
import { useTheme } from "@/src/ThemeContext";
import { PASSWORD_REQUIREMENTS_TITLE, PASSWORD_REQUIREMENTS_TEXT } from "@/src/utils/passwordPolicy";

// Pulsante "?" che mostra i requisiti della password. Va messo accanto
// all'etichetta del campo "nuova password" nelle schermate di registrazione,
// reset e cambio password.
export default function PasswordHint({ style }: { style?: StyleProp<ViewStyle> }) {
  const { t } = useTheme();
  return (
    <Pressable
      testID="password-hint-button"
      onPress={() => Alert.alert(PASSWORD_REQUIREMENTS_TITLE, PASSWORD_REQUIREMENTS_TEXT)}
      hitSlop={10}
      style={[
        {
          width: 18,
          height: 18,
          borderRadius: 9,
          borderWidth: 1,
          borderColor: t.onSurfaceTertiary,
          alignItems: "center",
          justifyContent: "center",
          marginLeft: 6,
        },
        style,
      ]}
    >
      <Text style={{ color: t.onSurfaceTertiary, fontSize: 11, fontWeight: "700", lineHeight: 14 }}>?</Text>
    </Pressable>
  );
}
