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
// "position" arriva dal pager (material-top-tabs/react-native-tab-view):
// e' un valore continuo (0, 1, 2, ma anche 1.35 mentre si sta trascinando
// a meta' fra la tab 1 e la 2), aggiornato in tempo reale durante lo swipe
// — per quel caso la pillola lo rispecchia semplicemente 1:1 (vedi il
// listener sotto). Il tocco su un'icona pero' e' un caso diverso:
// react-native-pager-view non manda alcun evento di scroll intermedio per
// i cambi pagina non interattivi (solo per lo swipe), quindi "position"
// resta fermo per tutta la transizione nativa e scatta di colpo al valore
// finale solo a transizione conclusa — a video si vede l'icona cambiare
// colore subito (viene da state.index, non da position) e la pillola
// restare ferma per un istante per poi saltare. In quel caso la pillola
// non segue affatto position: la animiamo esplicitamente noi con un
// timing, cosi' si muove in modo fluido e prevedibile a prescindere da
// come il pager gestisce internamente la transizione non interattiva.
export default function AnimatedTabBar({ state, descriptors, navigation, position, jumpTo }: any) {
  const { t } = useTheme();
  const routes = state.routes.filter((r: any) => !!descriptors[r.key]?.options?.tabBarIconName);
  const activeRouteKey = state.routes[state.index]?.key;
  const activeIndex = routes.findIndex((r: any) => r.key === activeRouteKey);

  const [layouts, setLayouts] = React.useState<Record<number, { x: number; width: number }>>({});
  const tuttiMisurati = routes.length > 0 && routes.every((_: any, i: number) => !!layouts[i]);

  const indicatorIndex = React.useRef(new Animated.Value(activeIndex >= 0 ? activeIndex : 0)).current;
  const swipeSyncSospesa = React.useRef(false);
  const tapToken = React.useRef(0);

  React.useEffect(() => {
    const id = position.addListener(({ value }: { value: number }) => {
      if (swipeSyncSospesa.current) return;
      indicatorIndex.setValue(value);
    });
    return () => position.removeListener(id);
  }, [position, indicatorIndex]);

  const inset = 8;
  const animX = tuttiMisurati
    ? indicatorIndex.interpolate({
        inputRange: routes.map((_: any, i: number) => i),
        outputRange: routes.map((_: any, i: number) => layouts[i].x + inset),
      })
    : 0;
  const animW = tuttiMisurati
    ? indicatorIndex.interpolate({
        inputRange: routes.map((_: any, i: number) => i),
        outputRange: routes.map((_: any, i: number) => layouts[i].width - inset * 2),
      })
    : 0;

  return (
    <View style={[s.bar, { backgroundColor: t.surface }, SHADOW.floating]}>
      {tuttiMisurati ? (
        <Animated.View
          pointerEvents="none"
          style={[s.indicator, { backgroundColor: t.brandSecondary, left: animX, width: animW }]}
        />
      ) : null}

      {routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const isFocused = route.key === activeRouteKey;
        const iconName = options.tabBarIconName || "circle";

        const onPress = () => {
          const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
          if (isFocused || event.defaultPrevented) return;
          const token = ++tapToken.current;
          swipeSyncSospesa.current = true;
          Animated.timing(indicatorIndex, {
            toValue: index,
            duration: 300,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
          }).start(() => {
            if (tapToken.current === token) swipeSyncSospesa.current = false;
          });
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
