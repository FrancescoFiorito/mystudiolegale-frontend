import React from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { api } from "@/src/api";
import { useAuth } from "@/src/AuthContext";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Registra il device per le notifiche push (Expo Push Service) e invia il
// token al backend, che lo usa per inviare i promemoria delle scadenze.
// Richiede `npx expo install expo-notifications expo-constants` e, per una
// build standalone, un projectId EAS in app.json (extra.eas.projectId).
export function usePushNotifications() {
  const { user } = useAuth();

  React.useEffect(() => {
    if (!user) return;
    let cancelled = false;

    (async () => {
      try {
        if (Platform.OS === "android") {
          await Notifications.setNotificationChannelAsync("default", {
            name: "default",
            importance: Notifications.AndroidImportance.DEFAULT,
          });
        }
        const perm = await Notifications.getPermissionsAsync();
        let status = perm.status;
        if (status !== "granted") {
          const req = await Notifications.requestPermissionsAsync();
          status = req.status;
        }
        if (status !== "granted") return;

        const projectId = (Constants.expoConfig?.extra as any)?.eas?.projectId;
        const tokenResp = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
        if (!cancelled && tokenResp?.data) {
          await api.post("/auth/push-token", { token: tokenResp.data });
        }
      } catch (e) {
        // Su simulatore/emulatore o senza projectId le push non sono disponibili: non bloccante.
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.log("push registration skipped:", e);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [user?.id]);
}
