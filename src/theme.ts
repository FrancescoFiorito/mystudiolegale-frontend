// Design system di MyStudioLegale — tema "studio legale": blu navy profondo
// come colore principale (autorevole, professionale), un accento oro/ottone
// usato con parsimonia per i dettagli (linee, badge), superfici color avorio
// invece del bianco puro (più calde, da "carta"), e un font serif (Playfair
// Display) per i titoli, che richiama l'identità grafica di uno studio legale.

export const LIGHT = {
  mode: "light" as const,
  surface: "#FFFEFB",
  onSurface: "#1B2430",
  surfaceSecondary: "#F6F2E9",
  onSurfaceSecondary: "#5B5647",
  surfaceTertiary: "#EFE9DA",
  onSurfaceTertiary: "#8A8571",
  surfaceInverse: "#16233E",
  onSurfaceInverse: "#FFFEFB",
  brand: "#16233E",
  onBrand: "#FFFEFB",
  brandSecondary: "#EAEDF3",
  onBrandSecondary: "#16233E",
  brandTertiary: "#F3F1EA",
  gold: "#B08D3F",
  onGold: "#2B2210",
  success: "#3E6B4F",
  onSuccess: "#FFFFFF",
  warning: "#966A1E",
  onWarning: "#FFFFFF",
  error: "#8C2F2F",
  onError: "#FFFFFF",
  info: "#16233E",
  onInfo: "#FFFFFF",
  border: "#E4DFCF",
  borderStrong: "#CFC8B2",
  divider: "#EFE9DA",
};

export const DARK = {
  mode: "dark" as const,
  surface: "#141310",
  onSurface: "#F0ECE2",
  surfaceSecondary: "#1C1A16",
  onSurfaceSecondary: "#B8B2A3",
  surfaceTertiary: "#26231E",
  onSurfaceTertiary: "#8C8676",
  surfaceInverse: "#F0ECE2",
  onSurfaceInverse: "#16233E",
  brand: "#6E8CC2",
  onBrand: "#14130F",
  brandSecondary: "#232A3A",
  onBrandSecondary: "#AEC0DE",
  brandTertiary: "#1C2130",
  gold: "#D9B564",
  onGold: "#2B2210",
  success: "#6FA983",
  onSuccess: "#062B20",
  warning: "#D9A64A",
  onWarning: "#3A2405",
  error: "#C97A7A",
  onError: "#3B0A0A",
  info: "#6E8CC2",
  onInfo: "#14130F",
  border: "#2C2924",
  borderStrong: "#3A362F",
  divider: "#201E19",
};

export type Theme = typeof LIGHT;

export const SPACING = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 };
// Raggi leggermente meno arrotondati del tema precedente, per un aspetto
// più formale e strutturato (coerente con l'identità "studio legale").
export const RADIUS = { sm: 8, md: 12, lg: 16, pill: 999 };

export const SHADOW = {
  card: {
    shadowColor: "#0B1220",
    shadowOpacity: 0.07,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  floating: {
    shadowColor: "#0B1220",
    shadowOpacity: 0.16,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
};

export const FONT = {
  // Font di sistema per il testo corrente; Playfair Display (serif) per i
  // titoli delle schermate — vedi src/components/Header.tsx.
  mono: undefined as string | undefined,
  serif: "PlayfairDisplay_700Bold",
  serifSemibold: "PlayfairDisplay_600SemiBold",
};
