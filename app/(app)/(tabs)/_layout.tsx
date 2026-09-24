import React from "react";
import { View } from "react-native";
import { Tabs, usePathname, useRouter } from "expo-router";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";
import AnimatedTabBar from "@/src/AnimatedTabBar";
import { TabSwipeProvider, useTabSwipeState } from "@/src/context/TabSwipeContext";

// Solo le 3 schermate raggiungibili dalla barra in basso. Tutto il resto
// (Profilo, Impostazioni, Team, dettaglio pratica/cliente, ecc.) vive fuori
// da questo gruppo, in (app)/_layout.tsx: sono "spinte" su uno Stack vero,
// non tab nascoste — vedi il commento li' per il perche'.
const ORDINE_TAB = ["/dashboard", "/clienti", "/archivio"];
const ORDINE_TAB_HREF = ["/(app)/dashboard", "/(app)/clienti", "/(app)/archivio"] as const;

const COMMIT_DISTANCE = 70;
const COMMIT_VELOCITY = 700;

function TabsConSwipe() {
  const router = useRouter();
  const pathname = usePathname();
  const { disabled } = useTabSwipeState();

  // Swipe orizzontale per passare da una tab principale all'altra, come lo
  // swipe fra le pagine della home in iOS/Android. Niente trascinamento in
  // tempo reale (le 3 schermate sono tab indipendenti, non pagine di un
  // carosello): la gesture rileva solo la direzione al rilascio del dito e
  // cambia tab, con la stessa soglia di distanza/velocita' usata altrove
  // nell'app per i gesti di swipe (vedi SwipeBackScreen).
  const vaiTab = (delta: 1 | -1) => {
    const idx = ORDINE_TAB.findIndex((p) => pathname === p || pathname.endsWith(p));
    if (idx === -1) return;
    const next = idx + delta;
    if (next < 0 || next >= ORDINE_TAB_HREF.length) return;
    router.push(ORDINE_TAB_HREF[next]);
  };

  const pan = Gesture.Pan()
    .enabled(!disabled)
    .activeOffsetX([-70, 70])
    .failOffsetY([-20, 20])
    .onEnd((e) => {
      const commit = Math.abs(e.translationX) > COMMIT_DISTANCE || Math.abs(e.velocityX) > COMMIT_VELOCITY;
      if (!commit) return;
      if (e.translationX < 0) runOnJS(vaiTab)(1);
      else runOnJS(vaiTab)(-1);
    });

  return (
    <GestureDetector gesture={pan}>
      <View style={{ flex: 1 }}>
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
      </View>
    </GestureDetector>
  );
}

export default function TabsLayout() {
  return (
    <TabSwipeProvider>
      <TabsConSwipe />
    </TabSwipeProvider>
  );
}
