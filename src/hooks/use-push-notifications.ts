import React from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { api } from "@/src/api";
import { useAuth } from "@/src/AuthContext";
import { storage } from "@/src/utils/storage";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Un fallimento qui (permesso negato, credenziali push mancanti sul
// progetto EAS, nessun projectId, ecc.) veniva prima scartato in silenzio
// fuori da __DEV__: su una build reale (TestFlight) non c'era alcun modo di
// sapere PERCHE' le notifiche non arrivassero mai. Lo stato dell'ultimo
// tentativo (riuscito o no, con il messaggio d'errore) viene ora salvato
// qui e letto da Impostazioni (vedi statoPushSalvato/leggiStatoPush), cosi'
// il problema si vede direttamente nell'app invece che nei log di Xcode.
const STATO_PUSH_KEY = "push_registration_status";

type StatoPush = { ok: boolean; messaggio?: string; at: string };

async function salvaStatoPush(stato: StatoPush) {
  await storage.setItem(STATO_PUSH_KEY, stato);
}

export async function leggiStatoPush(): Promise<StatoPush | null> {
  return storage.getItem<StatoPush | null>(STATO_PUSH_KEY, null);
}

// Registra il device per le notifiche push (Expo Push Service) e invia il
// token al backend, che lo usa per inviare i promemoria delle scadenze.
// Richiede `npx expo install expo-notifications expo-constants` e, per una
// build standalone, un projectId EAS in app.json (extra.eas.projectId).
export async function registraPushToken(): Promise<StatoPush> {
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
    if (status !== "granted") {
      const stato: StatoPush = { ok: false, messaggio: "Permesso per le notifiche negato", at: new Date().toISOString() };
      await salvaStatoPush(stato);
      return stato;
    }

    const projectId = (Constants.expoConfig?.extra as any)?.eas?.projectId;
    const tokenResp = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
    if (!tokenResp?.data) {
      const stato: StatoPush = { ok: false, messaggio: "Nessun token push restituito da Expo", at: new Date().toISOString() };
      await salvaStatoPush(stato);
      return stato;
    }
    await api.post("/auth/push-token", { token: tokenResp.data });
    const stato: StatoPush = { ok: true, at: new Date().toISOString() };
    await salvaStatoPush(stato);
    return stato;
  } catch (e: any) {
    const stato: StatoPush = { ok: false, messaggio: String(e?.message || e), at: new Date().toISOString() };
    await salvaStatoPush(stato);
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log("push registration failed:", e);
    }
    return stato;
  }
}

export function usePushNotifications() {
  const { user } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!user) return;
    registraPushToken();
  }, [user?.id]);

  // Toccando un promemoria di scadenza si viene portati direttamente sul
  // giorno di quella scadenza nel calendario, invece di restare sulla
  // schermata dove si trovava l'app quando la notifica e' arrivata.
  React.useEffect(() => {
    const apriDaNotifica = (data: any) => {
      if (data?.tipo === "scadenza" && data?.scadenza_data) {
        router.push(`/(app)/calendario?day=${data.scadenza_data}`);
      }
    };
    Notifications.getLastNotificationResponseAsync().then((r) => {
      if (r) apriDaNotifica(r.notification.request.content.data);
    });
    const sub = Notifications.addNotificationResponseReceivedListener((r) => {
      apriDaNotifica(r.notification.request.content.data);
    });
    return () => sub.remove();
  }, [router]);
}
