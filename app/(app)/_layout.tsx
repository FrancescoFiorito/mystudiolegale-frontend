import { Stack } from "expo-router";
import { usePushNotifications } from "@/src/hooks/use-push-notifications";

// Stack "vero" (native-stack) che contiene il gruppo (tabs) come radice, con
// sopra tutte le schermate raggiunte "in profondita'" (Team, Registro
// attivita', Profilo, Impostazioni, Calendario, Notifiche, dettaglio
// pratica/cliente). Prima erano tutte tab nascoste (href:null) dentro un
// unico Tabs, con lo swipe-indietro rifatto a mano con reanimated perche' i
// Tabs non hanno il gesto nativo. Quell'approccio si scontrava pero' col
// modo in cui React Navigation/react-native-screens gestiscono focus,
// congelamento delle schermate e pointerEvents (tutti pensati per una
// transizione gestita DA LORO, non "scavalcata" da un gesto fatto a mano):
// pagina bianca durante lo swipe, oscillazioni, pulsanti che smettevano di
// rispondere al ritorno sulla Home. Uno Stack vero ha il pop gesture
// nativo di iOS gia' pronto (gestureEnabled, default true su iOS), quindi
// tutti questi problemi spariscono senza bisogno di codice custom.
export default function AppLayout() {
  usePushNotifications();

  return (
    <Stack screenOptions={{ headerShown: false, gestureEnabled: true }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="calcolatori" />
      <Stack.Screen name="calendario" />
      <Stack.Screen name="profilo" />
      <Stack.Screen name="impostazioni" />
      <Stack.Screen name="notifiche" />
      <Stack.Screen name="team" />
      <Stack.Screen name="audit" />
      <Stack.Screen name="pratica/[id]" />
      <Stack.Screen name="cliente/[id]" />
    </Stack>
  );
}
