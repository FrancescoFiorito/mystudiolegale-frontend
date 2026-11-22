import React from "react";
import { View, Text, Pressable, TextInput, Alert } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useTheme } from "@/src/ThemeContext";
import { SPACING, RADIUS } from "@/src/theme";
import { storage } from "@/src/utils/storage";
import {
  StatoCalc, ImpostazioniCalc, IMPOSTAZIONI_PREDEFINITE, statoIniziale, cifra, virgola, operazione, cambiaSegno, percentuale, scorporoIva,
  inverso, arrotonda, radice, indietro, cancellaVoce, cancellaTutto, memoria, memoriaPiena, testoMemoria, applicaImpostazioni, incolla,
  OperatoreCalc, OperazioneMemoria,
} from "@/src/utils/calcolatriceOnline";

const CHIAVE_IMPOSTAZIONI = "calcolatrice-online-impostazioni";

type Tasto = { testID: string; testo: string; etichetta: string; suggerimento?: string; tipo: "num" | "op" | "fun" | "mem" | "ctrl"; azione: (s: StatoCalc) => StatoCalc };

const op = (o: Exclude<OperatoreCalc, "">) => (s: StatoCalc) => operazione(s, o);
const mem = (o: OperazioneMemoria) => (s: StatoCalc) => memoria(s, o);
const num = (n: number): Tasto => ({ testID: `calcolatrice-tasto-${n}`, testo: String(n), etichetta: String(n), tipo: "num", azione: (s) => cifra(s, n) });

// Stessa disposizione del sito di riferimento: 5 righe da 7 colonne (la prima colonna della
// prima riga è l'indicatore di memoria).
const RIGHE: (Tasto | "memoria")[][] = [
  [
    "memoria",
    { testID: "calcolatrice-tasto-ce", testo: "CE", etichetta: "Cancella il numero presente sul display", tipo: "ctrl", azione: cancellaVoce },
    { testID: "calcolatrice-tasto-c", testo: "C", etichetta: "Cancella tutto e resetta il calcolatore", tipo: "ctrl", azione: cancellaTutto },
    { testID: "calcolatrice-tasto-indietro", testo: "«", etichetta: "Cancella l'ultima cifra", tipo: "ctrl", azione: indietro },
    { testID: "calcolatrice-tasto-arr", testo: "arr", etichetta: "Arrotonda il valore presente sul display", suggerimento: "Il numero di cifre decimali si cambia dalle impostazioni", tipo: "fun", azione: arrotonda },
    { testID: "calcolatrice-tasto-iva", testo: "iva", etichetta: "Scorpora l'IVA dal valore presente sul display", suggerimento: "L'aliquota IVA si cambia dalle impostazioni", tipo: "fun", azione: scorporoIva },
    { testID: "calcolatrice-tasto-sc", testo: "sc", etichetta: "Sconto: applica al valore x lo sconto y in percentuale", suggerimento: "Digita x, premi sc, digita y e premi uguale", tipo: "fun", azione: op("s") },
  ],
  [
    { testID: "calcolatrice-tasto-m-piu", testo: "M +", etichetta: "Aggiunge alla memoria il valore corrente", tipo: "mem", azione: mem("+") },
    num(7), num(8), num(9),
    { testID: "calcolatrice-tasto-divisione", testo: "/", etichetta: "Divisione", tipo: "op", azione: op("/") },
    { testID: "calcolatrice-tasto-radice", testo: "sqrt", etichetta: "Radice quadrata", tipo: "fun", azione: radice },
    { testID: "calcolatrice-tasto-variazione", testo: "Δ%", etichetta: "Variazione in percentuale tra x e y", suggerimento: "Digita x, premi Δ%, digita y e premi uguale", tipo: "fun", azione: op("d") },
  ],
  [
    { testID: "calcolatrice-tasto-m-meno", testo: "M -", etichetta: "Sottrae dalla memoria il valore corrente", tipo: "mem", azione: mem("-") },
    num(4), num(5), num(6),
    { testID: "calcolatrice-tasto-moltiplicazione", testo: "x", etichetta: "Moltiplicazione", tipo: "op", azione: op("*") },
    { testID: "calcolatrice-tasto-percentuale", testo: "%", etichetta: "Percentuale", tipo: "fun", azione: percentuale },
    { testID: "calcolatrice-tasto-incidenza", testo: "pct", etichetta: "Rapporto tra x e y in percentuale", suggerimento: "Digita x, premi pct, digita y e premi uguale", tipo: "fun", azione: op("p") },
  ],
  [
    { testID: "calcolatrice-tasto-mr", testo: "MR", etichetta: "Richiama la memoria", tipo: "mem", azione: mem("R") },
    num(1), num(2), num(3),
    { testID: "calcolatrice-tasto-sottrazione", testo: "-", etichetta: "Sottrazione", tipo: "op", azione: op("-") },
    { testID: "calcolatrice-tasto-inverso", testo: "1/n", etichetta: "Inverso", tipo: "fun", azione: inverso },
    { testID: "calcolatrice-tasto-idiv", testo: "idiv", etichetta: "Divisione intera", tipo: "fun", azione: op("i") },
  ],
  [
    { testID: "calcolatrice-tasto-mc", testo: "MC", etichetta: "Cancella la memoria", tipo: "mem", azione: mem("C") },
    num(0),
    { testID: "calcolatrice-tasto-segno", testo: "±", etichetta: "Cambio di segno", tipo: "num", azione: cambiaSegno },
    { testID: "calcolatrice-tasto-virgola", testo: ",", etichetta: "Virgola", tipo: "num", azione: virgola },
    { testID: "calcolatrice-tasto-addizione", testo: "+", etichetta: "Addizione", tipo: "op", azione: op("+") },
    { testID: "calcolatrice-tasto-uguale", testo: "=", etichetta: "Uguale", tipo: "op", azione: op("=") },
    { testID: "calcolatrice-tasto-mod", testo: "mod", etichetta: "Resto della divisione intera (modulo)", tipo: "fun", azione: op("m") },
  ],
];

export default function CalcolatriceOnline() {
  const { t } = useTheme();
  const [stato, setStato] = React.useState<StatoCalc>(() => statoIniziale());
  const [mostraMemoria, setMostraMemoria] = React.useState(false);
  const [impostazioniAperte, setImpostazioniAperte] = React.useState(false);
  const [campoIva, setCampoIva] = React.useState("");
  const [campoDecimali, setCampoDecimali] = React.useState("");
  const [campoRaggruppa, setCampoRaggruppa] = React.useState(false);

  // Impostazioni salvate (equivalente del cookie del sito): se ci sono, sostituiscono quelle predefinite.
  React.useEffect(() => {
    let attivo = true;
    (async () => {
      const salvate = await storage.getItem<string>(CHIAVE_IMPOSTAZIONI, "");
      if (!attivo || !salvate) return;
      try {
        const p = JSON.parse(String(salvate)) as Partial<ImpostazioniCalc>;
        setStato((s) => ({
          ...s,
          impostazioni: {
            pctIva: typeof p.pctIva === "number" ? p.pctIva : IMPOSTAZIONI_PREDEFINITE.pctIva,
            cifreDecimali: typeof p.cifreDecimali === "number" ? p.cifreDecimali : IMPOSTAZIONI_PREDEFINITE.cifreDecimali,
            raggruppa: !!p.raggruppa,
          },
        }));
      } catch {}
    })();
    return () => { attivo = false; };
  }, []);

  const premi = (tasto: Tasto) => setStato((s) => tasto.azione(s));

  const apriImpostazioni = () => {
    setCampoIva(String(stato.impostazioni.pctIva));
    setCampoDecimali(String(stato.impostazioni.cifreDecimali));
    setCampoRaggruppa(stato.impostazioni.raggruppa);
    setImpostazioniAperte(true);
  };

  const chiudiImpostazioni = async (applica: boolean, salva: boolean) => {
    if (applica) {
      const nuovo = applicaImpostazioni(stato, campoIva, campoDecimali, campoRaggruppa);
      setStato(nuovo);
      if (salva) {
        const ok = await storage.setItem(CHIAVE_IMPOSTAZIONI, JSON.stringify(nuovo.impostazioni));
        if (!ok) { Alert.alert("Calcolatrice", "Impossibile salvare le impostazioni."); return; }
      }
    }
    setImpostazioniAperte(false);
  };

  const incollaDaAppunti = async () => {
    try {
      const testo = await Clipboard.getStringAsync();
      setStato((s) => incolla(s, testo));
    } catch {}
  };

  const copiaDisplay = async () => {
    try { await Clipboard.setStringAsync(stato.display.replace(/[.]/g, "")); } catch {}
  };

  const info = () => Alert.alert("Calcolatrice Online", `Calcolatrice Online\n--------------------\nVersione: 1.02\n(c) 2010-${new Date().getFullYear()}`);

  const colori = (tipo: Tasto["tipo"]) => {
    if (tipo === "op") return { bg: t.brand, fg: t.onBrand };
    if (tipo === "fun") return { bg: t.brandSecondary, fg: t.onBrandSecondary };
    if (tipo === "mem" || tipo === "ctrl") return { bg: t.surfaceTertiary, fg: t.onSurfaceSecondary };
    return { bg: t.surfaceSecondary, fg: t.onSurface };
  };

  const campoImp = { backgroundColor: t.surfaceSecondary, color: t.onSurface, borderColor: t.border, borderWidth: 1, borderRadius: RADIUS.md, padding: 8, width: 64, textAlign: "center" as const };

  return (
    <View testID="calcolatrice-online" style={{ alignSelf: "center", width: "100%", maxWidth: 420 }}>
      <View style={{ backgroundColor: t.surface, borderColor: t.border, borderWidth: 1, borderRadius: RADIUS.lg, padding: SPACING.sm }}>
        <Pressable
          testID="calcolatrice-display" accessibilityRole="text"
          accessibilityLabel={`Display: ${stato.display}`} accessibilityHint="Tocca a lungo per copiare il valore"
          onLongPress={copiaDisplay}
          style={{ backgroundColor: t.surfaceSecondary, borderColor: t.borderStrong, borderWidth: 1, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: 12, marginBottom: SPACING.sm }}
        >
          <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5} style={{ color: t.onSurface, fontSize: 30, textAlign: "right", fontVariant: ["tabular-nums"] }}>{stato.display}</Text>
        </Pressable>

        {RIGHE.map((riga, ri) => (
          <View key={ri} style={{ flexDirection: "row", marginBottom: 6, gap: 6 }}>
            {riga.map((tasto, ci) => {
              if (tasto === "memoria") {
                return (
                  <Pressable
                    key={ci} testID="calcolatrice-indicatore-memoria" accessibilityRole="button"
                    accessibilityLabel={testoMemoria(stato)} accessibilityHint="Mostra o nasconde il valore in memoria"
                    onPress={() => setMostraMemoria((v) => !v)}
                    style={{ flex: 1, minHeight: 44, borderRadius: RADIUS.md, backgroundColor: t.surfaceTertiary, alignItems: "center", justifyContent: "center", borderColor: t.border, borderWidth: 1 }}
                  >
                    <Text style={{ color: t.gold, fontWeight: "800", fontSize: 16 }}>{memoriaPiena(stato) ? "M" : ""}</Text>
                  </Pressable>
                );
              }
              const c = colori(tasto.tipo);
              return (
                <Pressable
                  key={ci} testID={tasto.testID} accessibilityRole="button"
                  accessibilityLabel={tasto.etichetta} accessibilityHint={tasto.suggerimento}
                  onPress={() => premi(tasto)}
                  style={({ pressed }) => ({ flex: 1, minHeight: 44, borderRadius: RADIUS.md, backgroundColor: c.bg, alignItems: "center", justifyContent: "center", opacity: pressed ? 0.7 : 1 })}
                >
                  <Text style={{ color: c.fg, fontWeight: tasto.tipo === "num" || tasto.tipo === "op" ? "700" : "600", fontSize: tasto.testo.length > 2 ? 13 : 17 }}>{tasto.testo}</Text>
                </Pressable>
              );
            })}
          </View>
        ))}

        {mostraMemoria ? (
          <Text testID="calcolatrice-valore-memoria" style={{ color: t.onSurfaceSecondary, textAlign: "center", fontSize: 13, marginBottom: 6 }}>{testoMemoria(stato)}</Text>
        ) : null}

        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 2 }}>
          <Pressable testID="calcolatrice-impostazioni" accessibilityRole="button" accessibilityLabel="Impostazioni" onPress={() => (impostazioniAperte ? chiudiImpostazioni(false, false) : apriImpostazioni())} style={{ padding: 10 }}>
            <Feather name="settings" size={20} color={t.onSurfaceSecondary} />
          </Pressable>
          <Pressable testID="calcolatrice-incolla" accessibilityRole="button" accessibilityLabel="Incolla un numero dagli appunti sul display" onPress={incollaDaAppunti} style={{ flexDirection: "row", alignItems: "center", gap: 6, padding: 10 }}>
            <Feather name="clipboard" size={18} color={t.onSurfaceSecondary} />
            <Text style={{ color: t.onSurfaceSecondary, fontSize: 13 }}>Incolla</Text>
          </Pressable>
          <Pressable testID="calcolatrice-informazioni" accessibilityRole="button" accessibilityLabel="Informazioni sulla calcolatrice" onPress={info} style={{ padding: 10 }}>
            <Feather name="info" size={20} color={t.onSurfaceSecondary} />
          </Pressable>
        </View>

        {impostazioniAperte ? (
          <View testID="calcolatrice-pannello-impostazioni" style={{ borderTopWidth: 1, borderTopColor: t.border, marginTop: SPACING.sm, paddingTop: SPACING.md }}>
            <Text style={{ color: t.onSurface, fontWeight: "800", textAlign: "center", marginBottom: SPACING.sm }}>Impostazioni</Text>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: SPACING.sm }}>
              <Text style={{ color: t.onSurfaceSecondary }}>Aliquota IVA:</Text>
              <TextInput
                testID="calcolatrice-impostazioni-iva" accessibilityLabel="Aliquota IVA" accessibilityHint="Specifica l'aliquota IVA"
                value={campoIva} onChangeText={(v) => setCampoIva(v.replace(/[^0-9]/g, "").slice(0, 2))} keyboardType="number-pad" maxLength={2} selectTextOnFocus style={campoImp}
              />
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: SPACING.sm }}>
              <Text style={{ color: t.onSurfaceSecondary }}>Cifre decimali:</Text>
              <TextInput
                testID="calcolatrice-impostazioni-decimali" accessibilityLabel="Cifre decimali" accessibilityHint="Numero di cifre decimali per l'operazione di arrotondamento"
                value={campoDecimali} onChangeText={(v) => setCampoDecimali(v.replace(/[^0-9]/g, "").slice(0, 1))} keyboardType="number-pad" maxLength={1} selectTextOnFocus style={campoImp}
              />
            </View>
            <Pressable
              testID="calcolatrice-impostazioni-raggruppa" accessibilityRole="checkbox" accessibilityLabel="Raggruppa cifre" accessibilityState={{ checked: campoRaggruppa }}
              onPress={() => setCampoRaggruppa((v) => !v)}
              style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: SPACING.md }}
            >
              <Text style={{ color: t.onSurfaceSecondary }}>Raggruppa cifre:</Text>
              <View style={{ width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: t.brand, backgroundColor: campoRaggruppa ? t.brand : "transparent", alignItems: "center", justifyContent: "center" }}>
                {campoRaggruppa ? <Feather name="check" size={16} color={t.onBrand} /> : null}
              </View>
            </Pressable>
            <View style={{ flexDirection: "row", gap: SPACING.sm }}>
              <Pressable testID="calcolatrice-impostazioni-applica" accessibilityRole="button" accessibilityHint="Applica le impostazioni solo per la sessione corrente" onPress={() => chiudiImpostazioni(true, false)} style={{ flex: 1, backgroundColor: t.brand, padding: 10, borderRadius: RADIUS.md, alignItems: "center" }}>
                <Text style={{ color: t.onBrand, fontWeight: "700" }}>Applica</Text>
              </Pressable>
              <Pressable testID="calcolatrice-impostazioni-salva" accessibilityRole="button" accessibilityHint="Salva le impostazioni in modo permanente" onPress={() => chiudiImpostazioni(true, true)} style={{ flex: 1, backgroundColor: t.brand, padding: 10, borderRadius: RADIUS.md, alignItems: "center" }}>
                <Text style={{ color: t.onBrand, fontWeight: "700" }}>Salva</Text>
              </Pressable>
              <Pressable testID="calcolatrice-impostazioni-annulla" accessibilityRole="button" accessibilityHint="Esce senza apportare alcuna modifica" onPress={() => chiudiImpostazioni(false, false)} style={{ flex: 1, backgroundColor: t.surfaceTertiary, padding: 10, borderRadius: RADIUS.md, alignItems: "center" }}>
                <Text style={{ color: t.onSurface, fontWeight: "700" }}>Annulla</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </View>
    </View>
  );
}
