import React from "react";
import { View, StyleSheet, Animated, Easing, Modal, Image } from "react-native";

const GOLD = "#D9B564";

// Schermata di caricamento unificata, in un Modal nativo a schermo pieno
// (necessario per coprire sempre la tab bar, vedi commento storico sotto).
//
// PERNO DI ROTAZIONE (fix): il martelletto (manico+testa, un unico pezzo
// rigido) e' racchiuso in una View "pivot" di dimensione 0x0, posizionata
// ESATTAMENTE nel punto in cui il manico si aggancia al perno fisso
// (l'impugnatura in cima al manico). Su una View 0x0 il centro di
// rotazione di default (transform-origin 50%/50%) COINCIDE col suo stesso
// punto left/top: ruotare questa View equivale quindi, per costruzione
// geometrica e non per un trucco di traslazioni compensative fragile, a
// ruotare esattamente attorno a quel punto. Manico e testa sono figli
// assoluti di "pivot", con left/top espressi come offset dal perno stesso
// (prima erano offset dall'angolo della gavelBox): a riposo (rotate=0deg)
// hanno lo stesso aspetto di sempre (manico dalle 8 alle 2, testa vicino
// alla base), ma ora l'intero gruppo oscilla realmente attorno
// all'estremita' del manico, non attorno al proprio centro / "galleggiando".
export default function LoadingScreen() {
  const anim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    // Oscillazione tipo pendolo: un solo Animated.Value continuo che guida
    // sempre e solo la stessa transform (nessun reset improvviso, nessuna
    // doppia animazione in conflitto). Ogni tratto riparte esattamente dal
    // valore raggiunto dal precedente (Animated.timing parte sempre dal
    // valore corrente), quindi l'angolo varia in modo perfettamente
    // continuo. Ampiezza aumentata (~20-25%) rispetto alla versione
    // precedente: decresce progressivamente (17 -> 10 -> 6 -> 3.5 -> 1.7 ->
    // 0) fino a fermarsi esattamente a 0deg, con easing morbido sull'ultimo
    // tratto per evitare micro-rimbalzi o "snap" finale.
    const swing = (to: number, duration: number, easing = Easing.inOut(Easing.sin)) =>
      Animated.timing(anim, { toValue: to, duration, easing, useNativeDriver: true });

    const loop = Animated.loop(
      Animated.sequence([
        swing(17, 300, Easing.out(Easing.quad)), // colpo: sale
        swing(-10, 340),                         // oscillazione 1
        swing(6, 290),                           // oscillazione 2
        swing(-3.5, 240),                        // oscillazione 3
        swing(1.7, 190),                         // oscillazione 4 (quasi ferma)
        swing(0, 150, Easing.out(Easing.sin)),   // stop morbido esattamente a 0deg
        Animated.delay(500),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);

  // Mappatura 1:1 gradi -> stringa "deg": anim rappresenta direttamente
  // l'angolo del pendolo attorno al perno; a riposo vale 0.
  const rotate = anim.interpolate({ inputRange: [-30, 30], outputRange: ["-30deg", "30deg"] });

  return (
    <Modal visible animationType="none" transparent={false} statusBarTranslucent presentationStyle="fullScreen">
      <View style={s.wrap}>
        <Image source={require("@/assets/images/loading-logo.png")} style={s.logo} resizeMode="contain" />

        <View style={s.gavelBox}>
          <View style={s.block} />
          <Animated.View style={[s.pivot, { transform: [{ rotate }] }]}>
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
  // Base ferma (il "piattino"): non fa parte del gruppo animato. Larghezza
  // 36, left 17 -> centro a x=35, che e' esattamente l'asse verticale della
  // gavelBox/logo (entrambi centrati in flex sullo stesso punto). Il
  // piattino e' quindi centrato per costruzione, indipendentemente da dove
  // si trova il manico.
  block: { position: "absolute", left: 17, top: 48, width: 36, height: 8, borderRadius: 4, backgroundColor: GOLD },
  // Perno fisso: View 0x0 posizionata esattamente dove il manico si aggancia
  // (l'impugnatura). Ruotando QUESTA view, il centro di rotazione di
  // default (che per una view 0x0 coincide col suo left/top) e' gia' il
  // perno corretto: nessuna traslazione compensativa necessaria.
  // Left = 51.18: nel tentativo precedente avevo centrato il bounding box
  // dell'INTERA sagoma (piattino+manico+testa insieme), il che spostava il
  // piattino fuori dal proprio centro (left 17 -> 10.24) ed era percepibile.
  // Ora il piattino resta fermo e centrato (sopra) e invece e' il gruppo
  // manico+testa, da solo, ad essere centrato sullo stesso asse x=35: il
  // suo bounding box locale (calcolato includendo la rotazione propria di
  // 60deg di manico e testa) ha centro a x=-16.18 rispetto al perno, quindi
  // il perno va posizionato a 35-(-16.18)=51.18 perche' il gruppo
  // manico+testa risulti centrato sull'asse del piattino/logo.
  pivot: { position: "absolute", left: 51.18, top: 18, width: 0, height: 0 },
  // Manico e testa sono posizionati come offset dal perno (non piu' dalla
  // gavelBox): stessa inclinazione locale di 60deg di sempre -> stesso
  // aspetto a riposo -> ma ora l'estremita' superiore del manico coincide
  // matematicamente col punto (0,0) del genitore "pivot".
  handle: { position: "absolute", left: -13.26, top: -6.5, width: 4, height: 26, borderRadius: 2, backgroundColor: GOLD, transform: [{ rotate: "60deg" }] },
  head: { position: "absolute", left: -35.52, top: 8, width: 26, height: 10, borderRadius: 3, backgroundColor: GOLD, transform: [{ rotate: "60deg" }] },
});
