import React, { useCallback } from "react";
import { StyleSheet, useWindowDimensions } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring, runOnJS } from "react-native-reanimated";
import { SafeAreaView, SafeAreaViewProps } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

// Avvolge una schermata con la gesture "scorri da sinistra verso destra per
// tornare indietro". A differenza di una semplice PanGestureHandler che
// scatta solo al rilascio del dito, qui la schermata segue in tempo reale
// la posizione del dito (translateX legato direttamente al gesture) e
// "svela" quello che c'e' dietro (nei Tabs di expo-router gli schermi non
// a fuoco restano montati, solo dietro in z-index: vedi
// BottomTabView.tsx), come il pop gesture nativo di iOS. Si usa esattamente
// come SafeAreaView (stessi props), quindi nei file basta sostituire il tag
// della SafeAreaView "radice" della schermata con questo componente.
//
// Di default richiama router.back(); per gli overlay a schermo intero
// gestiti con stato locale invece che con la navigazione (es. i "modali"
// di modifica profilo/cambio password), passa onDismiss per chiudere
// quell'overlay invece di navigare indietro.
//
// Quando un overlay di questo tipo si apre SOPRA un'altra SwipeBackScreen
// (es. il modale "Modifica profilo" sopra la schermata Profilo), le due
// gesture sarebbero annidate e potrebbero scattare entrambe sulla stessa
// swipe (chiusura dell'overlay + back della schermata sotto). In quel caso
// passa disabled sulla SwipeBackScreen esterna finche' l'overlay e' aperto.
type Props = SafeAreaViewProps & { onDismiss?: () => void; disabled?: boolean };

const COMMIT_DISTANCE = 80;
const COMMIT_VELOCITY = 800;

export default function SwipeBackScreen({ onDismiss, disabled, ...props }: Props) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const translateX = useSharedValue(0);
  const dismiss = onDismiss ?? (() => router.back());

  const finish = useCallback(() => {
    dismiss();
    translateX.value = 0;
  }, [dismiss, translateX]);

  const pan = Gesture.Pan()
    .enabled(!disabled)
    .activeOffsetX([-1000, 15])
    .failOffsetY([-20, 20])
    .onUpdate((e) => {
      translateX.value = Math.max(0, e.translationX);
    })
    .onEnd((e) => {
      const commit = e.translationX > COMMIT_DISTANCE || e.velocityX > COMMIT_VELOCITY;
      if (commit) {
        translateX.value = withTiming(width, { duration: 220 }, (finished) => {
          if (finished) runOnJS(finish)();
        });
      } else {
        translateX.value = withSpring(0, { damping: 20, stiffness: 250 });
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.fill, animatedStyle, styles.shadow]}>
        <SafeAreaView {...props} style={[styles.grow, props.style]} />
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  // Sempre absoluteFill (non solo flex:1): quando questo componente e' usato
  // come overlay sopra un'altra SwipeBackScreen (es. i "modali" a schermo
  // intero di profilo.tsx), deve coprire tutto lo schermo indipendentemente
  // da dove si trova nel flusso flex del genitore. Negli altri casi (radice
  // di una schermata nei Tabs) e' equivalente a flex:1, dato che il
  // contenitore della scena e' gia' esso stesso absoluteFill.
  fill: StyleSheet.absoluteFillObject,
  grow: { flex: 1 },
  shadow: {
    shadowColor: "#000",
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
});
