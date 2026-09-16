import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "@/src/ThemeContext";
import { SPACING, RADIUS, SHADOW, FONT } from "@/src/theme";

type HeaderProps = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  backTestID?: string;
  avatarInitials?: string;
  onAvatarPress?: () => void;
  right?: React.ReactNode;
  /** "hero" = pannello colorato brand (Dashboard, Profilo). "flat" = header standard di sezione. */
  variant?: "hero" | "flat";
};

// Header condiviso da tutte le schermate, per garantire altezze, colori e
// tipografia coerenti in tutta l'app. Due varianti: "flat" (la maggior parte
// delle schermate) e "hero" (Dashboard e Profilo, pannello colorato brand).
export default function Header({ title, subtitle, onBack, backTestID, avatarInitials, onAvatarPress, right, variant = "flat" }: HeaderProps) {
  const { t } = useTheme();
  const hero = variant === "hero";
  const leftAction = onBack ? (
    <Pressable testID={backTestID} onPress={onBack} style={[s.roundBtn, { backgroundColor: hero ? "rgba(255,255,255,0.18)" : t.surfaceSecondary }]}>
      <Feather name="arrow-left" size={20} color={hero ? t.onBrand : t.onSurface} />
    </Pressable>
  ) : avatarInitials ? (
    <Pressable testID="avatar-to-profile" onPress={onAvatarPress} style={[s.roundBtn, { backgroundColor: "rgba(255,255,255,0.18)" }]}>
      <Text style={{ color: t.onBrand, fontWeight: "800", fontSize: 15 }}>{avatarInitials}</Text>
      <View style={[s.menuBadge, { backgroundColor: t.onBrand, borderColor: t.brand }]}>
        <Feather name="more-horizontal" size={9} color={t.brand} />
      </View>
    </Pressable>
  ) : null;

  return (
    <View
      style={[
        s.wrap,
        hero
          ? { backgroundColor: t.brand, paddingTop: SPACING.md, paddingBottom: SPACING.md, borderBottomLeftRadius: RADIUS.lg * 1.4, borderBottomRightRadius: RADIUS.lg * 1.4 }
          : { backgroundColor: t.surface, paddingTop: SPACING.sm, borderBottomLeftRadius: RADIUS.lg, borderBottomRightRadius: RADIUS.lg },
        !hero && SHADOW.card,
      ]}
    >
      <View style={s.row}>
        {leftAction || <View style={s.roundBtn} />}
        <View style={{ flex: 1, marginLeft: SPACING.md }}>
          {subtitle ? <Text style={{ color: hero ? t.onBrand : t.onSurfaceTertiary, opacity: hero ? 0.75 : 1, fontSize: 12 }}>{subtitle}</Text> : null}
          <Text style={{ color: hero ? t.onBrand : t.onSurface, fontSize: subtitle ? 19 : 21, fontFamily: FONT.serif }} numberOfLines={1}>{title}</Text>
        </View>
        {right || <View style={s.roundBtn} />}
      </View>
      {hero ? <View style={[s.goldRule, { backgroundColor: t.gold }]} /> : null}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.sm },
  row: { flexDirection: "row", alignItems: "center" },
  roundBtn: { width: 34, height: 34, borderRadius: RADIUS.pill, alignItems: "center", justifyContent: "center" },
  menuBadge: { position: "absolute", right: -2, bottom: -2, width: 16, height: 16, borderRadius: 8, alignItems: "center", justifyContent: "center", borderWidth: 1.5 },
  goldRule: { height: 2, marginTop: SPACING.sm, marginHorizontal: -SPACING.lg, opacity: 0.55 },
});
