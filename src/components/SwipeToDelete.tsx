import React from "react";
import { Animated, StyleSheet, Text } from "react-native";
import { Swipeable, RectButton } from "react-native-gesture-handler";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "@/src/ThemeContext";
import { RADIUS, SPACING } from "@/src/theme";

type Props = {
  onDelete: () => void;
  children: React.ReactNode;
  testID?: string;
};

// Avvolge una riga di lista (cliente, pratica, documento, parcella...) con
// il gesto "scorri verso sinistra per eliminare", standard su iOS/Android.
// Sotto il cofano usa Swipeable di react-native-gesture-handler (gia'
// dipendenza del progetto, e GestureHandlerRootView e' gia' montato nel
// layout radice). Il contenuto (children) resta invariato: qui si aggiunge
// solo il pannello rosso "Elimina" che compare scorrendo, e che compie
// l'azione al tocco (lo swipe da solo NON elimina nulla, va confermato con
// un tocco sul pulsante rivelato, cosi' non capitano cancellazioni per
// sbaglio durante uno scroll veloce).
export default function SwipeToDelete({ onDelete, children, testID }: Props) {
  const { t } = useTheme();
  const ref = React.useRef<Swipeable>(null);

  const renderRightActions = (progress: Animated.AnimatedInterpolation<number>) => {
    const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [84, 0], extrapolate: "clamp" });
    return (
      <Animated.View style={[s.actionWrap, { transform: [{ translateX }] }]}>
        <RectButton
          testID={testID ? `${testID}-swipe-delete` : undefined}
          onPress={() => {
            ref.current?.close();
            onDelete();
          }}
          style={[s.deleteBtn, { backgroundColor: t.error }]}
        >
          <Feather name="trash-2" size={18} color="#fff" />
          <Text style={s.deleteLbl}>Elimina</Text>
        </RectButton>
      </Animated.View>
    );
  };

  return (
    <Swipeable ref={ref} renderRightActions={renderRightActions} overshootRight={false} rightThreshold={40} friction={2}>
      {children}
    </Swipeable>
  );
}

const s = StyleSheet.create({
  actionWrap: { width: 84, marginBottom: SPACING.sm },
  deleteBtn: { flex: 1, borderRadius: RADIUS.lg, alignItems: "center", justifyContent: "center", gap: 2 },
  deleteLbl: { color: "#fff", fontSize: 11, fontWeight: "700" },
});
