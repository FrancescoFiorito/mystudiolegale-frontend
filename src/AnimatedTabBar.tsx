import React from "react";
import { View, Pressable, Text, StyleSheet, Animated, Platform, Easing } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "@/src/ThemeContext";
import { SHADOW, RADIUS } from "@/src/theme";

// Barra di navigazione flottante con un indicatore (pillola) che scorre
// dietro l'icona attiva. La posizione dell'indicatore viene misurata
// direttamente dal layout reale di ogni pulsante (onLayout), non
// ricalcolata a mano: così resta sempre perfettamente centrata,
// indipendentemente da padding/arrotondamenti.
//
// Ci sono DUE pillole sovrapposte, per due motivi opposti:
//
// 1) "animX/animW" (sempre montata) interpola DIRETTAMENTE "position", il
//    valore continuo fornito dal pager (material-top-tabs/react-native-tab-
//    view), aggiornato in tempo reale durante lo swipe. E' l'unico modo
//    verificato per un movimento fluido durante lo swipe: un tentativo
//    precedente di "rispecchiare" position su un Animated.Value nostro
//    tramite listener (per unificarlo col caso del tocco qui sotto) ha
//    introdotto un ritardo percepibile anche sullo swipe, che prima
//    funzionava perfettamente — va quindi lasciata sola, mai intermediata.
//
// 2) "tapAnimX/tapAnimW" (montata solo per una manciata di ms dopo un
//    tocco) copre la prima con una pillola animata esplicitamente da noi.
//    Serve perche' al tocco di un'icona "position" non manda alcun
//    aggiornamento fluido: arriva un solo salto secco, e pure in ritardo
//    (qualche centinaio di ms dopo il tocco, quando la transizione nativa
//    del pager e' conclusa), quindi interpolarci sopra come al punto 1
//    farebbe restare la pillola ferma e poi scattare di colpo. Qui la
//    animiamo noi verso la tab di destinazione, e la teniamo sopra
//    abbastanza a lungo da coprire anche il ritardo di "position": quando
//    la nascondiamo, quella vera l'ha ormai raggiunta, senza scatti.
const TAP_ANIM_MS = 300;
const TAP_OVERLAY_MS = 750; // margine oltre TAP_ANIM_MS per il ritardo di "position"

export default function AnimatedTabBar({ state, descriptors, navigation, position, jumpTo }: any) {
  const { t } = useTheme();
  const routes = state.routes.filter((r: any) => !!descriptors[r.key]?.options?.tabBarIconName);
  const activeRouteKey = state.routes[state.index]?.key;
  const activeIndex = routes.findIndex((r: any) => r.key === activeRouteKey);

  const [layouts, setLayouts] = React.useState<Record<number, { x: number; width: number }>>({});
  const tuttiMisurati = routes.length > 0 && routes.every((_: any, i: number) => !!layouts[i]);

  const inset = 8;
  const inputRange = routes.map((_: any, i: number) => i);
  const xRange = routes.map((_: any, i: number) => (layouts[i]?.x ?? 0) + inset);
  const wRange = routes.map((_: any, i: number) => (layouts[i]?.width ?? 0) - inset * 2);

  const animX = tuttiMisurati ? position.interpolate({ inputRange, outputRange: xRange }) : 0;
  const animW = tuttiMisurati ? position.interpolate({ inputRange, outputRange: wRange }) : 0;

  const [tapTarget, setTapTarget] = React.useState<number | null>(null);
  const tapIndex = React.useRef(new Animated.Value(0)).current;
  const tapHideTimeout = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const tapAnimX = tuttiMisurati ? tapIndex.interpolate({ inputRange, outputRange: xRange }) : 0;
  const tapAnimW = tuttiMisurati ? tapIndex.interpolate({ inputRange, outputRange: wRange }) : 0;

  React.useEffect(() => () => {
    if (tapHideTimeout.current) clearTimeout(tapHideTimeout.current);
  }, []);

  return (
    <View style={[s.bar, { backgroundColor: t.surface }, SHADOW.floating]}>
      {tuttiMisurati ? (
        <Animated.View
          pointerEvents="none"
          style={[s.indicator, { backgroundColor: t.brandSecondary, left: animX, width: animW }]}
        />
      ) : null}
      {tuttiMisurati && tapTarget !== null ? (
        <Animated.View
          pointerEvents="none"
          style={[s.indicator, { backgroundColor: t.brandSecondary, left: tapAnimX, width: tapAnimW }]}
        />
      ) : null}

      {routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const isFocused = route.key === activeRouteKey;
        const iconName = options.tabBarIconName || "circle";

        const onPress = () => {
          const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
          if (isFocused || event.defaultPrevented) return;

          if (tapHideTimeout.current) clearTimeout(tapHideTimeout.current);
          tapIndex.setValue(activeIndex >= 0 ? activeIndex : 0);
          setTapTarget(index);
          Animated.timing(tapIndex, {
            toValue: index,
            duration: TAP_ANIM_MS,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
          }).start();
          tapHideTimeout.current = setTimeout(() => setTapTarget(null), TAP_OVERLAY_MS);

          jumpTo(route.key);
        };

        return (
          <Pressable
            key={route.key}
            testID={options.tabBarTestID}
            onPress={onPress}
            style={s.item}
            onLayout={(e) => {
              const { x, width } = e.nativeEvent.layout;
              setLayouts((prev) => (prev[index]?.x === x && prev[index]?.width === width ? prev : { ...prev, [index]: { x, width } }));
            }}
          >
            <Feather name={iconName} size={20} color={isFocused ? t.brand : t.onSurfaceTertiary} />
            <Text style={[s.label, { color: isFocused ? t.brand : t.onSurfaceTertiary }]}>{options.title}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  bar: {
    position: "absolute",
    left: 56,
    right: 56,
    bottom: Platform.OS === "ios" ? 24 : 16,
    height: 58,
    borderRadius: RADIUS.pill,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    zIndex: 100,
    elevation: 10,
  },
  indicator: {
    position: "absolute",
    top: 8,
    height: 42,
    borderRadius: RADIUS.pill,
  },
  item: { flex: 1, alignItems: "center", justifyContent: "center", gap: 2 },
  label: { fontSize: 10, fontWeight: "700" },
});
