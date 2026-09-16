import React from "react";
import { View, Pressable, Text, StyleSheet, Animated, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "@/src/ThemeContext";
import { SHADOW, RADIUS } from "@/src/theme";

// Barra di navigazione flottante con un indicatore (pillola) che scorre
// animato dietro l'icona attiva quando si cambia tab. La posizione
// dell'indicatore viene misurata direttamente dal layout reale di ogni
// pulsante (onLayout), non ricalcolata a mano: così resta sempre
// perfettamente centrata, indipendentemente da padding/arrotondamenti.
export default function AnimatedTabBar({ state, descriptors, navigation }: any) {
  const { t } = useTheme();
  const routes = state.routes.filter((r: any) => !!descriptors[r.key]?.options?.tabBarIconName);
  const activeRouteKey = state.routes[state.index]?.key;
  const activeIndexRaw = routes.findIndex((r: any) => r.key === activeRouteKey);
  const activeIndex = activeIndexRaw >= 0 ? activeIndexRaw : 0;

  const [layouts, setLayouts] = React.useState<Record<number, { x: number; width: number }>>({});
  const animX = React.useRef(new Animated.Value(0)).current;
  const animW = React.useRef(new Animated.Value(0)).current;
  const measured = layouts[activeIndex];

  React.useEffect(() => {
    if (!measured) return;
    const inset = 8;
    Animated.spring(animX, { toValue: measured.x + inset, useNativeDriver: false, friction: 9, tension: 70 }).start();
    Animated.spring(animW, { toValue: measured.width - inset * 2, useNativeDriver: false, friction: 9, tension: 70 }).start();
  }, [activeIndex, measured?.x, measured?.width]);

  return (
    <View style={[s.bar, { backgroundColor: t.surface }, SHADOW.floating]}>
      {measured ? (
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
