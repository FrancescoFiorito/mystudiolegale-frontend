import { useFonts } from "expo-font";
import { Feather } from "@expo/vector-icons";
import { PlayfairDisplay_600SemiBold, PlayfairDisplay_700Bold } from "@expo-google-fonts/playfair-display";

// Preloads the icon font (Feather) e il font serif per i titoli, cosi' non
// lampeggiano/cadono sul font di sistema al primo render.
export function useIconFonts() {
  return useFonts({
    ...Feather.font,
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_700Bold,
  });
}
