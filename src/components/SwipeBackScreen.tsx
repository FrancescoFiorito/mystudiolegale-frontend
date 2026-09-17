import React from "react";
import { PanGestureHandler, State } from "react-native-gesture-handler";
import { SafeAreaView, SafeAreaViewProps } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

// Avvolge una schermata con la gesture "scorri da sinistra verso destra per
// tornare indietro", equivalente a toccare la freccia in alto a sinistra.
// Si usa esattamente come SafeAreaView (stessi props), quindi nei file
// basta sostituire il tag della SafeAreaView "radice" della schermata con
// questo componente. Non si attiva su scroll verticali (failOffsetY) ne'
// su scorrimenti verso sinistra (activeOffsetX negativo molto ampio).
export default function SwipeBackScreen(props: SafeAreaViewProps) {
  const router = useRouter();

  const onHandlerStateChange = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX, translationY } = event.nativeEvent;
      if (translationX > 70 && Math.abs(translationY) < 60) {
        router.back();
      }
    }
  };

  return (
    <PanGestureHandler onHandlerStateChange={onHandlerStateChange} activeOffsetX={[-1000, 15]} failOffsetY={[-20, 20]}>
      <SafeAreaView {...props} />
    </PanGestureHandler>
  );
}
