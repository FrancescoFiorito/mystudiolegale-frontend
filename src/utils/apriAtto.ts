import { Alert } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/src/AuthContext";
import { scegliAperturaDocumento } from "@/src/utils/apriDocumentoRemoto";

type AttoRef = { id: string; tipo: string };

// Apertura degli atti generati: PDF per tutti i piani (filigrana o
// intestazione le decide il server), Word solo con Pro e Studio. Per Free e
// No-Ads il tocco su "Word" mostra l'invito ai piani senza chiamare il server
// (stesso modo di leggere il piano di EsportaDocumento). Per entrambi i formati
// resta la scelta "visualizza / scarica o condividi".
export function useApriAtto() {
  const { user } = useAuth();
  const router = useRouter();
  const piano = user?.piano || "free";
  const gratuito = piano === "free" || piano === "no_ads";

  const pdf = (a: AttoRef) =>
    scegliAperturaDocumento(`/atti/${a.id}/pdf`, `/atti/${a.id}/pdf/view-link`, `${a.tipo}.pdf`);

  const word = (a: AttoRef) => {
    if (gratuito) {
      Alert.alert("Formato Word", "Il formato Word è disponibile con i piani Pro e Studio.", [
        { text: "Chiudi", style: "cancel" },
        { text: "Vedi i piani", onPress: () => router.push({ pathname: "/(app)/profilo", params: { piano: "1" } }) },
      ]);
      return;
    }
    scegliAperturaDocumento(`/atti/${a.id}/docx`, `/atti/${a.id}/docx/view-link`, `${a.tipo}.docx`);
  };

  // Chiede quale formato aprire (per le liste di atti).
  const scegli = (a: AttoRef) =>
    Alert.alert(a.tipo, "In quale formato vuoi aprire l'atto?", [
      { text: "Annulla", style: "cancel" },
      { text: "PDF", onPress: () => pdf(a) },
      { text: "Word", onPress: () => word(a) },
    ]);

  return { pdf, word, scegli, gratuito };
}
