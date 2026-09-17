import React from "react";
import { View, StyleSheet, Animated, Easing, Modal, Image } from "react-native";

const GOLD = "#D9B564";

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

  const rotate = anim.interpolate({ inputRange: [0, 1], outputRange: ["18deg", "-27deg"] });

  return (
    <Modal visible animationType="none" transparent={false} statusBarTranslucent presentationStyle="fullScreen">
      <View style={s.wrap}>
        <Image source={require("@/assets/images/loading-logo.png")} style={s.logo} resizeMode="contain" />

        <View style={s.gavelBox}>
          <View style={s.block} />
          <Animated.View
            style={[
              s.swingWrap,
              {
                transform: [
                  { translateX: -17.52 }, { translateY: -7 },
                  { rotate },
                  { translateY: 7 }, { translateX: 17.52 },
                ],
              },
            ]}
          >
            <View style={s.handle} />
            <View style={s.head} />
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: "#16233E", alignItems: "center", justifyContent: "center" },
  logo: { width: 170, height: 150, marginBottom: 8 },
  gavelBox: { width: 70, height: 60, marginTop: 4 },
  // Base ferma: non fa parte del gruppo animato qui sotto.
  block: { position: "absolute", left: 17, top: 48, width: 36, height: 8, borderRadius: 4, backgroundColor: GOLD },
  // Manico e testa sono UN unico pezzo rigido: entrambi ruotati della STESSA
  // inclinazione (60deg, manico dalle 8 alle 2) attorno al proprio centro,
  // quindi restano sempre a 90 gradi tra loro per costruzione. Solo il
  // contenitore "swingWrap" (che li contiene entrambi) si anima, ruotando
  // attorno all'impugnatura in cima al manico: a riposo e' a 18deg, poi va
  // a -27deg (-45 rispetto al riposo) allontanando la testa dalla base.
  // NOTA: la direzione e' stata verificata empiricamente da una
  // registrazione dello schermo reale, non solo calcolata a tavolino -
  // la simulazione teorica aveva il verso opposto a quello vero su device.
  swingWrap: { position: "absolute", left: 13, top: -4, width: 60, height: 50 },
  handle: { position: "absolute", left: 39.26, top: 15.5, width: 4, height: 26, borderRadius: 2, backgroundColor: GOLD, transform: [{ rotate: "60deg" }] },
  head: { position: "absolute", left: 17, top: 30, width: 26, height: 10, borderRadius: 3, backgroundColor: GOLD, transform: [{ rotate: "60deg" }] },
});
