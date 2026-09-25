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
//
// animationEnabled: false — riguarda solo i cambi tab "non interattivi"
// (tocco su un'icona o navigazione da codice: lo swipe resta comunque
// animato, la libreria lo garantisce a prescindere da questa opzione).
// Col pager di react-native-pager-view usato qui, un cambio pagina
// animato per via non interattiva NON manda alcun evento di scroll
// intermedio: "position" (il valore su cui l'indicatore della tab bar è
// agganciato — vedi AnimatedTabBar) resta fermo per tutta la transizione
// nativa e scatta al valore finale solo a transizione conclusa, con un
// ritardo percepibile e non deterministico. Disattivando l'animazione per
// questo caso, il cambio pagina e l'aggiornamento di "position" diventano
// sincroni (la libreria stessa chiama position.setValue(index) nello
// stesso istante in cui aggiorna la tab attiva): la pillola scatta
// esattamente insieme al colore dell'icona, invece di restare indietro.
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
      screenOptions={{ swipeEnabled: true, animationEnabled: false }}
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
