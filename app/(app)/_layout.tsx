import { Tabs } from "expo-router";
import { usePushNotifications } from "@/src/hooks/use-push-notifications";
import AnimatedTabBar from "@/src/AnimatedTabBar";

export default function AppLayout() {
  usePushNotifications();

  return (
    <Tabs
      tabBar={(props) => <AnimatedTabBar {...props} />}
      screenOptions={{ headerShown: false }}
      // Il default di questo router ("firstRoute") fa tornare "indietro"
      // sempre alla prima schermata dichiarata (dashboard/Home), qualunque
      // sia la schermata da cui si e' arrivati: es. da Impostazioni si apre
      // Team & Ruoli, e "indietro" atterrava su Home invece che su
      // Impostazioni. "history" torna davvero all'ultima schermata visitata.
      backBehavior="history"
      // Per risparmiare memoria, le schermate dei Tabs non a fuoco vengono
      // "congelate" e staccate dalla resa nativa (react-native-screens) non
      // appena non sono piu' quella attiva, ma solo ri-agganciate quando
      // React Navigation esegue lui stesso una transizione. Il nostro swipe
      // (SwipeBackScreen) anima invece la schermata "a mano" con reanimated
      // e chiama router.back() solo alla fine del gesto: durante il
      // trascinamento React Navigation non sa che e' in corso una
      // transizione, quindi la schermata sotto resta congelata (appare
      // bianca) fino al rilascio, e lo scambio nativo attacca/stacca in
      // conflitto con l'animazione causa un'oscillazione quando si annulla
      // lo swipe a meta'. Disattivato cosi' le schermate restano sempre
      // renderizzate: leggermente piu' costoso in memoria, ma qui il numero
      // di schermate e' contenuto e lo swipe deve restare fluido.
      detachInactiveScreens={false}
    >
      <Tabs.Screen
        name="dashboard"
        options={{ title: "Home", tabBarIconName: "home" } as any}
      />
      <Tabs.Screen
        name="clienti"
        options={{ title: "Clienti", tabBarIconName: "users" } as any}
      />
      <Tabs.Screen
        name="archivio"
        options={{ title: "Archivio", tabBarIconName: "archive" } as any}
      />

      {/* Routable but reached via navigation from within a screen rather than the tab bar */}
      <Tabs.Screen name="calcolatori" options={{ href: null }} />
      <Tabs.Screen name="calendario" options={{ href: null }} />
      <Tabs.Screen name="profilo" options={{ href: null }} />
      <Tabs.Screen name="impostazioni" options={{ href: null }} />
      <Tabs.Screen name="notifiche" options={{ href: null }} />
      <Tabs.Screen name="team" options={{ href: null }} />
      <Tabs.Screen name="audit" options={{ href: null }} />
      <Tabs.Screen name="pratica/[id]" options={{ href: null }} />
      <Tabs.Screen name="cliente/[id]" options={{ href: null }} />
    </Tabs>
  );
}
