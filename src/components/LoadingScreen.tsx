import React from "react";
import { View, Text, StyleSheet, Animated, Easing, Modal } from "react-native";
import { FONT } from "@/src/theme";

const SCALE_COLOR = "#6E8CC2";
const GOLD = "#D9B564";

// Logo disegnato interamente con forme native (nessuna immagine): bilancia +
// colonna, negli stessi colori del resto dell'app. Essendo vettoriale non ha
// bordi/compressione: si integra nello sfondo invece di sembrarci incollato
// sopra.
function VectorMark() {
  return (
    <View style={m.wrap}>
      <View style={m.post} />
      <View style={m.ball} />
      <View style={m.beam} />
      <View style={[m.pivot, { left: 13 }]} />
      <View style={[m.pivot, { left: 73 }]} />
      <View style={[m.pan, { left: 3 }]} />
      <View style={[m.pan, { left: 63 }]} />
      <View style={m.cap} />
      <View style={m.shaft} />
      <View style={m.base} />
    </View>
  );
}

const m = StyleSheet.create({
  wrap: { width: 90, height: 100, alignItems: "center" },
  post: { position: "absolute", left: 43, top: 15, width: 4, height: 30, backgroundColor: SCALE_COLOR, borderRadius: 2 },
  ball: { position: "absolute", left: 39, top: 7, width: 12, height: 12, borderRadius: 6, backgroundColor: SCALE_COLOR },
  beam: { position: "absolute", left: 13, top: 19, width: 64, height: 3, backgroundColor: SCALE_COLOR, borderRadius: 1.5 },
  pivot: { position: "absolute", top: 16.5, width: 8, height: 8, borderRadius: 4, backgroundColor: SCALE_COLOR },
  pan: {
    position: "absolute", top: 24,
    width: 0, height: 0,
    borderLeftWidth: 12, borderRightWidth: 12, borderTopWidth: 18,
    borderLeftColor: "transparent", borderRightColor: "transparent", borderTopColor: SCALE_COLOR,
  },
  cap: { position: "absolute", left: 15, top: 46, width: 60, height: 7, backgroundColor: GOLD, borderRadius: 2 },
  shaft: { position: "absolute", left: 29, top: 53, width: 32, height: 38, backgroundColor: GOLD },
  base: { position: "absolute", left: 13, top: 91, width: 64, height: 7, backgroundColor: GOLD, borderRadius: 2 },
});

// Schermata di caricamento unificata. E' avvolta in un Modal nativo (non un
// semplice View a schermo intero) apposta: un Modal presenta sempre in un
// livello separato SOPRA tutto il resto dell'interfaccia, barra di
// navigazione flottante inclusa, che altrimenti in certi casi rimarrebbe
// visibile dietro. Il martelletto (manico+testa) ruota tutto insieme
// attorno alla propria impugnatura, colpendo la base ferma sotto di se'.
export default function LoadingScreen() {
  const anim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 170, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 380, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.delay(450),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);

  const rotate = anim.interpolate({ inputRange: [0, 1], outputRange: ["18deg", "0deg"] });
  const PIVOT_Y = 12;

  return (
    <Modal visible animationType="none" transparent={false} statusBarTranslucent presentationStyle="fullScreen">
      <View style={s.wrap}>
        <VectorMark />

        <View style={s.gavelBox}>
          <View style={s.block} />
          <Animated.View style={[s.hammerGroup, { transform: [{ translateY: PIVOT_Y }, { rotate }, { translateY: -PIVOT_Y }] }]}>
            <View style={s.handle} />
            <View style={s.head} />
          </Animated.View>
        </View>

        <Text style={s.label}>MyStudioLegale</Text>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: "#16233E", alignItems: "center", justifyContent: "center" },
  gavelBox: { width: 64, height: 56, alignItems: "center", marginTop: 4 },
  block: { position: "absolute", left: 4, top: 44, width: 34, height: 8, borderRadius: 3, backgroundColor: GOLD },
  hammerGroup: { position: "absolute", top: 0, left: 0, width: 64, height: 42 },
  handle: { position: "absolute", left: 32, top: 8, width: 4, height: 24, borderRadius: 2, backgroundColor: GOLD, transform: [{ rotate: "22deg" }] },
  head: { position: "absolute", left: 25.5, top: 21, width: 8, height: 20, borderRadius: 3, backgroundColor: GOLD, transform: [{ rotate: "112deg" }] },
  label: { marginTop: 4, fontSize: 18, color: "#FFFEFB", fontFamily: FONT.serif },
});
