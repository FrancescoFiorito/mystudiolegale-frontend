import React from "react";
import { View, Text, Pressable, FlatList, NativeSyntheticEvent, NativeScrollEvent } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "@/src/ThemeContext";
import { SPACING, RADIUS } from "@/src/theme";

const MESI_IT = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];
const ALTEZZA_VOCE = 40;
const VOCI_VISIBILI = 5;
const ALTEZZA_RUOTA = ALTEZZA_VOCE * VOCI_VISIBILI;
const PADDING_RUOTA = (ALTEZZA_RUOTA - ALTEZZA_VOCE) / 2;
const ANNO_MIN = 1940;
const ANNO_MAX = new Date().getFullYear() + 5;
const ANNI = Array.from({ length: ANNO_MAX - ANNO_MIN + 1 }, (_, i) => ANNO_MIN + i);

function parti(value: string): { mese: number; anno: number } {
  const [a, m] = (value || "").split("-").map(Number);
  const oggi = new Date();
  return {
    mese: m >= 1 && m <= 12 ? m : oggi.getMonth() + 1,
    anno: a >= ANNO_MIN && a <= ANNO_MAX ? a : oggi.getFullYear(),
  };
}

// Una singola "ruota" scorrevole (mese o anno): stesso principio dello
// spinner nativo usato da DataInput, ma implementata a mano perché
// @react-native-community/datetimepicker non offre un modo che mostri solo
// mese e anno (ha solo "date" con giorno incluso).
function Ruota<T>({
  voci, etichetta, selezionata, onSeleziona, testID,
}: {
  voci: T[];
  etichetta: (v: T) => string;
  selezionata: T;
  onSeleziona: (v: T) => void;
  testID?: string;
}) {
  const { t } = useTheme();
  const ref = React.useRef<FlatList<T>>(null);
  const indiceIniziale = Math.max(0, voci.findIndex((v) => v === selezionata));
  // Un tocco su una voce scorre la lista fino a lì programmaticamente
  // (scrollToOffset), il che genera anch'esso un evento onMomentumScrollEnd:
  // senza questa guardia quell'evento ricalcolava la voce dalla posizione
  // finale dello scroll, spesso diversa (di una voce) da quella toccata per
  // via della fisica dello scroll nativo — da cui il bug "il tocco seleziona
  // la voce successiva invece di quella toccata". onScrollBeginDrag scatta
  // solo per un trascinamento dell'utente, mai per uno scroll avviato da
  // codice: la guardia ignora quindi solo gli eventi generati dal tocco,
  // lasciando invariato lo scroll manuale (che infatti già funzionava).
  const trascinamentoUtente = React.useRef(false);

  const scorri = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!trascinamentoUtente.current) return;
    trascinamentoUtente.current = false;
    const indice = Math.round(e.nativeEvent.contentOffset.y / ALTEZZA_VOCE);
    const v = voci[Math.max(0, Math.min(voci.length - 1, indice))];
    if (v !== undefined && v !== selezionata) onSeleziona(v);
  };

  const tocca = (indice: number) => {
    ref.current?.scrollToOffset({ offset: indice * ALTEZZA_VOCE, animated: true });
    onSeleziona(voci[indice]);
  };

  return (
    <View style={{ flex: 1, height: ALTEZZA_RUOTA }}>
      <View pointerEvents="none" style={{
        position: "absolute", top: PADDING_RUOTA, left: 4, right: 4, height: ALTEZZA_VOCE,
        backgroundColor: t.brandSecondary, borderRadius: RADIUS.sm,
      }} />
      <FlatList
        testID={testID}
        ref={ref}
        data={voci}
        keyExtractor={(v) => String(v)}
        showsVerticalScrollIndicator={false}
        snapToInterval={ALTEZZA_VOCE}
        decelerationRate="fast"
        contentOffset={{ x: 0, y: indiceIniziale * ALTEZZA_VOCE }}
        contentContainerStyle={{ paddingVertical: PADDING_RUOTA }}
        onScrollBeginDrag={() => { trascinamentoUtente.current = true; }}
        onMomentumScrollEnd={scorri}
        renderItem={({ item, index }) => (
          <Pressable onPress={() => tocca(index)} style={{ height: ALTEZZA_VOCE, alignItems: "center", justifyContent: "center" }}>
            <Text style={{
              fontSize: 15, color: item === selezionata ? t.brand : t.onSurface,
              fontWeight: item === selezionata ? "700" : "400",
            }}>
              {etichetta(item)}
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
}

// Selettore di mese e anno, senza giorno: usato ovunque il backend lo ignora
// (adeguamento canone, devalutazione, inflazione, rivalutazione TFR), al
// posto di un DataInput completo (che farebbe scegliere un giorno inutile) o
// di due campi separati scelta+numero. Si apre e si chiude come DataInput
// (si tocca il campo, si apre in sede, "Fatto" per chiudere), ma con due
// ruote (mese, anno) invece delle tre native giorno/mese/anno. value/onChange
// usano il formato "AAAA-MM".
export default function MeseAnnoInput({
  value, onChange, testID,
}: {
  value: string;
  onChange: (v: string) => void;
  testID?: string;
}) {
  const { t } = useTheme();
  const [aperto, setAperto] = React.useState(false);
  const { mese, anno } = parti(value);

  return (
    <View>
      <Pressable
        testID={testID}
        onPress={() => setAperto(!aperto)}
        style={{
          flexDirection: "row", alignItems: "center", justifyContent: "space-between",
          borderWidth: 1, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.md,
          backgroundColor: t.surfaceSecondary, borderColor: t.border,
        }}
      >
        <Text style={{ color: t.onSurface, fontSize: 14, fontVariant: ["tabular-nums"] }}>
          {MESI_IT[mese - 1]} {anno}
        </Text>
        <Feather name="calendar" size={16} color={t.onSurfaceTertiary} />
      </Pressable>
      {aperto ? (
        <View style={{ marginTop: SPACING.xs, borderWidth: 1, borderRadius: RADIUS.md, borderColor: t.border, backgroundColor: t.surface, overflow: "hidden" }}>
          <View style={{ flexDirection: "row" }}>
            <Ruota
              testID={testID ? `${testID}-mese` : undefined}
              voci={Array.from({ length: 12 }, (_, i) => i + 1)}
              etichetta={(m) => MESI_IT[m - 1]}
              selezionata={mese}
              onSeleziona={(m) => onChange(`${anno}-${String(m).padStart(2, "0")}`)}
            />
            <Ruota
              testID={testID ? `${testID}-anno` : undefined}
              voci={ANNI}
              etichetta={(a) => String(a)}
              selezionata={anno}
              onSeleziona={(a) => onChange(`${a}-${String(mese).padStart(2, "0")}`)}
            />
          </View>
          <Pressable testID={testID ? `${testID}-fatto` : undefined} onPress={() => setAperto(false)} style={{ paddingVertical: SPACING.sm, alignItems: "center", borderTopWidth: 1, borderTopColor: t.border }}>
            <Text style={{ color: t.brand, fontWeight: "700" }}>Fatto</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}
