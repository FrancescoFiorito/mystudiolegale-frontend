import { Tabs } from "expo-router";
import { usePushNotifications } from "@/src/hooks/use-push-notifications";
import AnimatedTabBar from "@/src/AnimatedTabBar";

export default function AppLayout() {
  usePushNotifications();

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
