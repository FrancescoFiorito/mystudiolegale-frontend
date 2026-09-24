import React from "react";
import { View, Pressable, Text, StyleSheet, Animated, Platform } from "react-native";
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
// a meta' fra la tab 1 e la 2), aggiornato in tempo reale durante lo swipe.
// Interpolandoci sopra invece di animare "a scatti" ogni volta che cambia
// state.index (il cambio di tab a fine gesto), la pillola segue il dito
// durante lo swipe esattamente come la pagina sotto, invece di restare
// ferma e rincorrerla con uno spring solo a swipe concluso.
export default function AnimatedTabBar({ state, descriptors, navigation, position }: any) {
  const { t } = useTheme();
  const routes = state.routes.filter((r: any) => !!descriptors[r.key]?.options?.tabBarIconName);
  const activeRouteKey = state.routes[state.index]?.key;

  const [layouts, setLayouts] = React.useState<Record<number, { x: number; width: number }>>({});
  const tuttiMisurati = routes.length > 0 && routes.every((_: any, i: number) => !!layouts[i]);

  const inset = 8;
  const animX = tuttiMisurati
    ? position.interpolate({
        inputRange: routes.map((_: any, i: number) => i),
        outputRange: routes.map((_: any, i: number) => layouts[i].x + inset),
      })
    : 0;
  const animW = tuttiMisurati
    ? position.interpolate({
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
          if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
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
