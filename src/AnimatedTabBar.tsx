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
// Un'unica animazione, guidata sempre e solo da "position" (il valore
// continuo fornito dal pager, material-top-tabs/react-native-tab-view):
// segue lo swipe in tempo reale, e siccome il tocco su un'icona chiama
// "jumpTo" (che muove il pager esattamente come farebbe uno swipe), la
// stessa interpolazione segue anche quella transizione — e' lo stesso
// meccanismo, senza alcuna distinzione, usato anche dall'indicatore di
// default di react-native-tab-view.
//
// Il punto delicato e' che "position.interpolate(...)" va costruito UNA
// SOLA VOLTA (qui con useMemo) e non ricreato a ogni render. Il tocco su
// un'icona fa cambiare state.index, che rimonta AnimatedTabBar: se ad ogni
// render si ricreava un nuovo nodo Animated (come succedeva prima), il
// binding col pager veniva smontato e rimontato proprio nel mezzo della
// transizione innescata dal tocco, con un vistoso "salto" a transizione
// nativa ormai conclusa invece di un movimento fluido. Tenendo lo stesso
// nodo Animated attraverso i render, la pillola segue "position" in modo
// continuo in entrambi i casi.
export default function AnimatedTabBar({ state, descriptors, navigation, position, jumpTo }: any) {
  const { t } = useTheme();
  const routes = state.routes.filter((r: any) => !!descriptors[r.key]?.options?.tabBarIconName);
  const activeRouteKey = state.routes[state.index]?.key;

  const [layouts, setLayouts] = React.useState<Record<number, { x: number; width: number }>>({});
  const tuttiMisurati = routes.length > 0 && routes.every((_: any, i: number) => !!layouts[i]);
  const layoutsSignature = tuttiMisurati
    ? routes.map((_: any, i: number) => `${layouts[i].x}:${layouts[i].width}`).join("|")
    : "";

  const { animX, animW } = React.useMemo(() => {
    if (!tuttiMisurati) return { animX: 0 as any, animW: 0 as any };
    const inset = 8;
    const inputRange = routes.map((_: any, i: number) => i);
    return {
      animX: position.interpolate({ inputRange, outputRange: routes.map((_: any, i: number) => layouts[i].x + inset) }),
      animW: position.interpolate({ inputRange, outputRange: routes.map((_: any, i: number) => layouts[i].width - inset * 2) }),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position, tuttiMisurati, layoutsSignature]);

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
          if (!isFocused && !event.defaultPrevented) jumpTo(route.key);
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
