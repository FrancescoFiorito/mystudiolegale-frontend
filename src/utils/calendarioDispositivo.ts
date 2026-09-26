import { Platform } from "react-native";
import * as Calendar from "expo-calendar";
import { storage } from "@/src/utils/storage";
import { api } from "@/src/api";

// Sincronizzazione delle scadenze col calendario nativo del dispositivo
// (iOS/Android): non serve alcuna credenziale, creiamo un calendario
// dedicato ("MyStudioLegale") sul dispositivo e ci scriviamo dentro
// direttamente con expo-calendar. Su iOS, se il calendario di default e'
// gia' su iCloud, anche questo dedicato lo segue automaticamente (e' lo
// stesso "account sorgente" del calendario di default).
const CALENDAR_ID_KEY = "device_calendar_id";
const SYNC_MAP_KEY = "device_calendar_sync_map";
const CALENDAR_TITLE = "MyStudioLegale";

async function sourceIdDefault(): Promise<string | undefined> {
  if (Platform.OS !== "ios") return undefined;
  const def = await Calendar.getDefaultCalendarAsync();
  return def.source?.id;
}

export async function calendarioDispositivoConnesso(): Promise<boolean> {
  const id = await storage.getItem<string>(CALENDAR_ID_KEY, "");
  return !!id;
}

export async function connettiCalendarioDispositivo(): Promise<void> {
  const perm = await Calendar.requestCalendarPermissionsAsync();
  if (perm.status !== "granted") {
    throw new Error("Permesso calendario negato. Puoi attivarlo dalle Impostazioni del dispositivo.");
  }

  // Se un calendario creato in precedenza esiste ancora sul dispositivo,
  // riusiamo quello invece di crearne uno duplicato.
  const existingId = await storage.getItem<string>(CALENDAR_ID_KEY, "");
  if (existingId) {
    const cals = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    if (cals.some((c) => c.id === existingId)) return;
  }

  const newId = await Calendar.createCalendarAsync({
    title: CALENDAR_TITLE,
    color: "#2563EB",
    entityType: Calendar.EntityTypes.EVENT,
    sourceId: Platform.OS === "ios" ? await sourceIdDefault() : undefined,
    source: Platform.OS === "android" ? { isLocalAccount: true, name: CALENDAR_TITLE } : undefined,
    name: CALENDAR_TITLE,
    ownerAccount: CALENDAR_TITLE,
    accessLevel: Calendar.CalendarAccessLevel.OWNER,
    // Senza questi due il calendario puo' essere creato ma restare
    // invisibile/non sincronizzato nell'app Calendario di Android (lo
    // segnala la documentazione stessa di expo-calendar).
    isVisible: Platform.OS === "android" ? true : undefined,
    isSynced: Platform.OS === "android" ? true : undefined,
  } as any);
  await storage.setItem(CALENDAR_ID_KEY, newId);
}

export async function disconnettiCalendarioDispositivo(): Promise<void> {
  const id = await storage.getItem<string>(CALENDAR_ID_KEY, "");
  if (id) {
    try {
      await Calendar.deleteCalendarAsync(id);
    } catch {
      // Il calendario potrebbe essere gia' stato rimosso manualmente dal
      // dispositivo: non e' un errore bloccante, procediamo comunque a
      // dimenticare il collegamento lato app.
    }
  }
  await storage.removeItem(CALENDAR_ID_KEY);
  await storage.removeItem(SYNC_MAP_KEY);
}

export async function sincronizzaCalendarioDispositivo(): Promise<{ sincronizzate: number; errori: number }> {
  const calendarId = await storage.getItem<string>(CALENDAR_ID_KEY, "");
  if (!calendarId) throw new Error("Calendario del dispositivo non collegato");

  const oggi = new Date().toISOString().slice(0, 10);
  const tra180Giorni = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const scadenze: any[] = await api.get("/scadenze");
  const daSincronizzare = scadenze.filter((s) => !s.completata && s.data >= oggi && s.data <= tra180Giorni);
  const idValidi = new Set(daSincronizzare.map((s) => s.id));

  const mappa = (await storage.getItem<Record<string, string>>(SYNC_MAP_KEY, {})) || {};
  let sincronizzate = 0;
  let errori = 0;

  for (const sc of daSincronizzare) {
    const inizio = new Date(`${sc.data}T${sc.ora || "09:00"}:00`);
    const fine = new Date(inizio.getTime() + 60 * 60 * 1000);
    const dettagli = { title: sc.titolo, notes: sc.descrizione || "", startDate: inizio, endDate: fine, timeZone: "Europe/Rome" };
    try {
      const idEsistente = mappa[sc.id];
      if (idEsistente) {
        try {
          await Calendar.updateEventAsync(idEsistente, dettagli);
        } catch {
          // L'evento potrebbe essere stato eliminato manualmente dal
          // dispositivo nel frattempo: lo ricreiamo.
          mappa[sc.id] = await Calendar.createEventAsync(calendarId, dettagli);
        }
      } else {
        mappa[sc.id] = await Calendar.createEventAsync(calendarId, dettagli);
      }
      sincronizzate++;
    } catch {
      errori++;
    }
  }

  // Rimuove dal calendario del dispositivo gli eventi delle scadenze non
  // piu' valide (eliminate, completate, o la cui data e' uscita dalla
  // finestra dei prossimi 180 giorni): prima restavano appesi finche' non
  // si scollegava e ricollegava da zero il calendario.
  for (const scadenzaId of Object.keys(mappa)) {
    if (idValidi.has(scadenzaId)) continue;
    try {
      await Calendar.deleteEventAsync(mappa[scadenzaId]);
    } catch {
      // Evento gia' rimosso manualmente dal dispositivo: va bene comunque.
    }
    delete mappa[scadenzaId];
  }

  await storage.setItem(SYNC_MAP_KEY, mappa);
  return { sincronizzate, errori };
}

// Da chiamare dopo aver creato, eliminato o spostato di data una scadenza:
// se il calendario del dispositivo e' collegato, lo sincronizza subito in
// background invece di aspettare che l'utente torni in Impostazioni a
// toccare "Sincronizza" a mano. Silenziosa di proposito (nessun alert,
// nessun errore bloccante): e' una comodita' automatica, non un'azione
// esplicita dell'utente.
export async function sincronizzaSeConnesso(): Promise<void> {
  try {
    if (await calendarioDispositivoConnesso()) {
      await sincronizzaCalendarioDispositivo();
    }
  } catch {
    // L'utente puo' sempre risincronizzare a mano da Impostazioni.
  }
}
