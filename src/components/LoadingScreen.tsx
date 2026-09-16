import React from "react";
import { View, Text, StyleSheet, Animated, Easing, Image } from "react-native";
import { FONT } from "@/src/theme";

// Schermata di caricamento unificata, mostrata sopra a tutto il resto
// (compresa la barra di navigazione flottante, che altrimenti resterebbe
// visibile dietro) finche' l'app non e' davvero pronta. Il martelletto ha
// una geometria vera: manico sottile inclinato, testa piu' spessa
// perpendicolare al manico, e la base resta ferma mentre il martello
// (manico+testa insieme) ruota attorno alla propria impugnatura,
// colpendo la base con l'estremo corto della testa.
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
    <View style={s.wrap}>
      <Image source={require("@/assets/images/loading-mark.png")} style={s.logo} resizeMode="contain" />

      <View style={s.gavelBox}>
        <View style={s.block} />
        <Animated.View style={[s.hammerGroup, { transform: [{ translateY: PIVOT_Y }, { rotate }, { translateY: -PIVOT_Y }] }]}>
          <View style={s.handle} />
          <View style={s.head} />
        </Animated.View>
      </View>

      <Text style={s.label}>MyStudioLegale</Text>
    </View>
  );
}

const GOLD = "#D9B564";

const s = StyleSheet.create({
  wrap: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 999,
    elevation: 999,
    backgroundColor: "#16233E",
    alignItems: "center",
    justifyContent: "center",
  },
  logo: { width: 130, height: 130, marginBottom: 8 },
  gavelBox: { width: 64, height: 56, alignItems: "center" },
  block: { position: "absolute", left: 4, top: 44, width: 34, height: 8, borderRadius: 3, backgroundColor: GOLD },
  hammerGroup: { position: "absolute", top: 0, left: 0, width: 64, height: 42 },
  handle: { position: "absolute", left: 24, top: 8, width: 4, height: 24, borderRadius: 2, backgroundColor: GOLD, transform: [{ rotate: "-22deg" }] },
  head: { position: "absolute", left: 26.5, top: 21, width: 8, height: 20, borderRadius: 3, backgroundColor: GOLD, transform: [{ rotate: "68deg" }] },
  label: { marginTop: 4, fontSize: 18, color: "#FFFEFB", fontFamily: FONT.serif },
});
