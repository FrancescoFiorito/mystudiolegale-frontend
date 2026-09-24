import { Tabs } from "expo-router";
import AnimatedTabBar from "@/src/AnimatedTabBar";

// Solo le 3 schermate raggiungibili dalla barra in basso. Tutto il resto
// (Profilo, Impostazioni, Team, dettaglio pratica/cliente, ecc.) vive fuori
// da questo gruppo, in (app)/_layout.tsx: sono "spinte" su uno Stack vero,
// non tab nascoste — vedi il commento li' per il perche'.
export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <AnimatedTabBar {...props} />}
      screenOptions={{ headerShown: false }}
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
    </Tabs>
  );
}
