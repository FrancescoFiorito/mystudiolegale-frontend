import { withLayoutContext } from "expo-router";
import { createMaterialTopTabNavigator, MaterialTopTabNavigationOptions, MaterialTopTabNavigationEventMap } from "@react-navigation/material-top-tabs";
import type { ParamListBase, TabNavigationState } from "@react-navigation/native";
import AnimatedTabBar from "@/src/AnimatedTabBar";

// Solo le 3 schermate raggiungibili dalla barra in basso. Tutto il resto
// (Profilo, Impostazioni, Team, dettaglio pratica/cliente, ecc.) vive fuori
// da questo gruppo, in (app)/_layout.tsx: sono "spinte" su uno Stack vero,
// non tab nascoste — vedi il commento li' per il perche'.
//
// Usa createMaterialTopTabNavigator (con la nostra AnimatedTabBar al posto
// di quella di default) invece delle bottom-tabs: e' l'unico navigator di
// React Navigation con un vero pager (react-native-pager-view) sotto, che
// da' lo swipe orizzontale fra le 3 tab con trascinamento in tempo reale
// (segue il dito) invece del semplice switch istantaneo delle bottom-tabs.
const { Navigator } = createMaterialTopTabNavigator();

const MaterialTopTabs = withLayoutContext<
  MaterialTopTabNavigationOptions,
  typeof Navigator,
  TabNavigationState<ParamListBase>,
  MaterialTopTabNavigationEventMap
>(Navigator);

export default function TabsLayout() {
  return (
    <MaterialTopTabs
      tabBar={(props) => <AnimatedTabBar {...props} />}
      screenOptions={{ swipeEnabled: true, animationEnabled: true }}
    >
      <MaterialTopTabs.Screen
        name="dashboard"
        options={{ title: "Home", tabBarIconName: "home" } as any}
      />
      <MaterialTopTabs.Screen
        name="clienti"
        options={{ title: "Clienti", tabBarIconName: "users" } as any}
      />
      <MaterialTopTabs.Screen
        name="archivio"
        options={{ title: "Archivio", tabBarIconName: "archive" } as any}
      />
    </MaterialTopTabs>
  );
}
