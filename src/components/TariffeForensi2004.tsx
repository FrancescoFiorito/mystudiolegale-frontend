import React from "react";
import { View, Text, Pressable, TextInput, ActivityIndicator } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "@/src/ThemeContext";
import { SPACING, RADIUS } from "@/src/theme";
import { api } from "@/src/api";
import SelectInput from "@/src/components/SelectInput";
import EsportaDocumento from "@/src/components/EsportaDocumento";
import {
  TARIFFARI, COMPETENZE_DIRITTI, COMPETENZE_ONORARI, MSG_CAMPO_ERRATO, MSG_NESSUNA_VOCE,
  TariffarioForense, TipoValoreForense, RisultatoTariffe, leggiValoreCausa, euro, testoValoreCausa, valoriRiga, colonneVisibili, intestazioniColonne,
} from "@/src/utils/tariffeForensi2004";

const TIPI_VALORE: { id: TipoValoreForense; etichetta: string }[] = [
  { id: "specificato", etichetta: "Specificato €:" },
  { id: "indeterminabile", etichetta: "Indeterminabile" },
  { id: "indeterminabile_importanza", etichetta: "Indeterminabile e di particolare importanza" },
];

// Consultazione delle tariffe forensi civili 2004 (diritti, onorari, stragiudiziale): stessa maschera
// del sito di riferimento (valore della causa, competenza, testo da cercare) e stesso elenco di
// prestazioni e tariffe. I dati vengono dal server (GET /tariffe-forensi-2004).
export default function TariffeForensi2004() {
  const { t } = useTheme();
  const [tariffario, setTariffario] = React.useState<TariffarioForense>("diritti");
  const [tipoValore, setTipoValore] = React.useState<TipoValoreForense>("specificato");
  const [valoreTesto, setValoreTesto] = React.useState("0,00");
  const [competenza, setCompetenza] = React.useState("1");
  const [ricerca, setRicerca] = React.useState("");
  const [erroreValore, setErroreValore] = React.useState<string | null>(null);
  const [avviso, setAvviso] = React.useState<string | null>(null);
  const [inCorso, setInCorso] = React.useState(false);
  const [risultato, setRisultato] = React.useState<RisultatoTariffe | null>(null);
  const [noteAperte, setNoteAperte] = React.useState<Record<string, boolean>>({});

  // Come nel sito, cambiando scheda restano valore e testo da cercare; la competenza torna alla prima voce.
  const scegliTariffario = (id: TariffarioForense) => {
    setTariffario(id);
    setCompetenza(id === "diritti" ? "1" : id === "onorari" ? "11" : "");
    setErroreValore(null); setAvviso(null);
  };

  const visualizza = async () => {
    setAvviso(null); setErroreValore(null);
    let valore = 0;
    if (tipoValore === "specificato") {
      const esito = leggiValoreCausa(valoreTesto);
      if (!esito.ok) { setErroreValore(esito.errore); setAvviso(MSG_CAMPO_ERRATO); return; }
      valore = esito.valore;
    }
    setInCorso(true);
    try {
      const qs = new URLSearchParams({ tariffario, tipo_valore: tipoValore, valore: String(valore), q: ricerca });
      if (tariffario !== "stragiudiziale") qs.set("competenza", competenza);
      const r = await api.get<RisultatoTariffe>(`/tariffe-forensi-2004?${qs.toString()}`);
      if (!r.righe.length) { setAvviso(MSG_NESSUNA_VOCE); return; }
      setNoteAperte({});
      setRisultato(r);
    } catch (e: any) {
      setAvviso(e?.message || "Impossibile caricare le tariffe. Riprova.");
    } finally {
      setInCorso(false);
    }
  };

  const campo = { backgroundColor: t.surfaceSecondary, color: t.onSurface, borderColor: t.border, borderWidth: 1, borderRadius: RADIUS.md, padding: 10 } as const;
  const lbl = { color: t.onSurfaceSecondary, fontSize: 13, fontWeight: "600" as const, marginBottom: 4 };

  if (risultato) {
    const r = risultato;
    const colonne = colonneVisibili(r);
    const intestazioni = intestazioniColonne(colonne);
    const larghezzaImporto = colonne === 2 ? 90 : 92;
    const titolo = r.competenza_nome ? `Tariffe ${r.tariffario === "diritti" ? "diritti" : "onorari"}: ${r.competenza_nome}` : "Tariffe stragiudiziale";
    const righeDati: [string, string][] = [];
    if (r.competenza_nome) righeDati.push(["Competenza", r.competenza_nome]);
    righeDati.push(["Valore della Causa", testoValoreCausa(r.tipo_valore, r.valore, r.tariffario)]);
    return (
      <View testID="tariffe-risultato">
        <Pressable testID="tariffe-torna" accessibilityRole="button" accessibilityLabel="Torna alla maschera di impostazione dei parametri" onPress={() => setRisultato(null)} style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: SPACING.md }}>
          <Feather name="arrow-left" size={18} color={t.brand} />
          <Text style={{ color: t.brand, fontWeight: "700" }}>Torna ai parametri</Text>
        </Pressable>
        <View style={{ marginBottom: SPACING.sm }}>
          {r.competenza_nome ? <Text style={{ color: t.onSurface }}>Competenza: <Text style={{ fontWeight: "800" }}>{r.competenza_nome}</Text></Text> : null}
          <Text style={{ color: t.onSurface }}>Valore della Causa: <Text style={{ fontWeight: "800" }}>{testoValoreCausa(r.tipo_valore, r.valore, r.tariffario)}</Text></Text>
        </View>
        <View style={{ backgroundColor: t.surface, borderColor: t.border, borderWidth: 1, borderRadius: RADIUS.lg, overflow: "hidden" }}>
          <View style={{ flexDirection: "row", backgroundColor: t.brand, paddingVertical: 8, paddingHorizontal: 8, alignItems: "center" }}>
            <Text style={{ flex: 1, color: t.onBrand, fontWeight: "800", fontSize: 12 }}>Prestazione</Text>
            {intestazioni.map((h) => (
              <Text key={h} style={{ width: larghezzaImporto, textAlign: "right", color: t.onBrand, fontWeight: "800", fontSize: 12 }}>{h}</Text>
            ))}
          </View>
          {r.righe.map((riga, i) => {
            const aperta = !!noteAperte[riga.codice + ":" + i];
            return (
              <View key={riga.codice + ":" + i} testID={`tariffe-riga-${riga.codice}`} style={{ backgroundColor: i % 2 ? t.surfaceSecondary : t.surface, paddingVertical: 8, paddingHorizontal: 8 }}>
                <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                  <View style={{ flex: 1, paddingRight: 6 }}>
                    <Text style={{ color: t.onSurface, fontSize: 13 }}>
                      <Text style={{ color: t.onSurfaceTertiary, fontStyle: "italic" }}>{riga.codice}  </Text>
                      {riga.nome}
                    </Text>
                    {riga.nota ? (
                      <Pressable
                        testID={`tariffe-nota-${riga.codice}`} accessibilityRole="button" accessibilityLabel={`Nota della voce ${riga.codice}`}
                        accessibilityState={{ expanded: aperta }} hitSlop={8}
                        onPress={() => setNoteAperte((m) => ({ ...m, [riga.codice + ":" + i]: !aperta }))}
                        style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4, alignSelf: "flex-start" }}
                      >
                        <Feather name="info" size={14} color={t.brand} />
                        <Text style={{ color: t.brand, fontSize: 12 }}>{aperta ? "Nascondi nota" : "Nota"}</Text>
                      </Pressable>
                    ) : null}
                  </View>
                  {valoriRiga(riga, colonne).map((v, k) => (
                    <Text key={k} style={{ width: larghezzaImporto, textAlign: "right", color: t.onSurface, fontWeight: "700", fontSize: 12 }}>{euro(v)}</Text>
                  ))}
                </View>
                {aperta && riga.nota ? <Text testID={`tariffe-nota-testo-${riga.codice}`} style={{ color: t.onSurfaceSecondary, fontSize: 12, marginTop: 6 }}>{riga.nota}</Text> : null}
              </View>
            );
          })}
        </View>
        {r.avviso ? (
          <Text testID="tariffe-avviso-regola" accessibilityRole="text" style={{ color: t.onSurfaceSecondary, fontSize: 12, marginTop: SPACING.sm }}>{r.avviso}</Text>
        ) : null}
        <EsportaDocumento
          testIDPrefix="tariffe"
          titolo={titolo}
          datiInseriti={righeDati}
          risultato={r.righe.map((x): [string, string] => [
            `${x.codice} ${x.nome}`,
            valoriRiga(x, colonne).map((v, k) => (colonne === 2 ? `${["min", "max"][k]} ${euro(v)}` : euro(v))).join(" · "),
          ])}
          titoloRisultato="Tariffe"
        />
      </View>
    );
  }

  return (
    <View testID="tariffe-forensi-2004">
      <View style={{ flexDirection: "row", marginBottom: SPACING.md }}>
        {TARIFFARI.map((x) => {
          const sel = x.id === tariffario;
          return (
            <Pressable
              key={x.id} testID={`tariffe-scheda-${x.id}`} accessibilityRole="tab" accessibilityState={{ selected: sel }} accessibilityLabel={`Tariffario ${x.etichetta.toLowerCase()}`}
              onPress={() => scegliTariffario(x.id)}
              style={{ flex: 1, paddingVertical: 10, alignItems: "center", backgroundColor: sel ? t.brand : t.surfaceTertiary, borderTopLeftRadius: RADIUS.md, borderTopRightRadius: RADIUS.md, marginRight: 4 }}
            >
              <Text style={{ color: sel ? t.onBrand : t.onSurfaceSecondary, fontWeight: "700", fontSize: 13 }}>{x.etichetta}</Text>
            </Pressable>
          );
        })}
      </View>

      {avviso ? (
        <View testID="tariffe-avviso" accessibilityRole="alert" style={{ backgroundColor: t.surfaceTertiary, borderColor: t.warning, borderWidth: 1, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.md }}>
          <Text style={{ color: t.warning, fontWeight: "800", textAlign: "center" }}>{avviso}</Text>
        </View>
      ) : null}

      <Text style={lbl}>Valore della causa:</Text>
      {TIPI_VALORE.map((x) => {
        const sel = tipoValore === x.id;
        return (
          <View key={x.id} style={{ flexDirection: "row", alignItems: "center", marginBottom: SPACING.sm, gap: 10 }}>
            <Pressable
              testID={`tariffe-tipo-${x.id}`} accessibilityRole="radio" accessibilityState={{ selected: sel }} accessibilityLabel={x.etichetta.replace(" €:", " in euro")}
              onPress={() => { setTipoValore(x.id); setErroreValore(null); }}
              style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: x.id === "specificato" ? 0 : 1, minHeight: 36 }}
            >
              <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: t.brand, alignItems: "center", justifyContent: "center" }}>
                {sel ? <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: t.brand }} /> : null}
              </View>
              <Text style={{ color: t.onSurface, fontWeight: "700", flexShrink: 1 }}>{x.etichetta}</Text>
            </Pressable>
            {x.id === "specificato" ? (
              <TextInput
                testID="tariffe-valore" accessibilityLabel="Valore della causa in euro" accessibilityHint="Inserisci qui il valore della causa se specificato"
                value={valoreTesto} onChangeText={(v) => { setValoreTesto(v); setErroreValore(null); }} maxLength={12} keyboardType="numbers-and-punctuation" selectTextOnFocus
                style={[campo, { flex: 1, textAlign: "right", borderColor: erroreValore ? t.error : t.border }]}
              />
            ) : null}
          </View>
        );
      })}
      {erroreValore ? <Text testID="tariffe-errore-valore" style={{ color: t.error, fontSize: 12, marginBottom: SPACING.sm }}>{erroreValore}</Text> : null}

      {tariffario !== "stragiudiziale" ? (
        <View style={{ marginTop: SPACING.sm, marginBottom: SPACING.md }}>
          <Text style={lbl}>Competenza:</Text>
          <SelectInput testID="tariffe-competenza" accessibilityLabel="Competenza" value={competenza} onChange={setCompetenza} opzioni={tariffario === "diritti" ? COMPETENZE_DIRITTI : COMPETENZE_ONORARI} />
        </View>
      ) : null}

      <Text style={lbl}>Testo da cercare:</Text>
      <TextInput
        testID="tariffe-ricerca" accessibilityLabel="Testo da cercare" accessibilityHint="Digita un eventuale testo da ricercare"
        value={ricerca} onChangeText={setRicerca} maxLength={80} autoCapitalize="none" autoCorrect={false}
        style={[campo, { marginBottom: SPACING.lg }]}
      />

      <Pressable
        testID="tariffe-visualizza" accessibilityRole="button" accessibilityHint="Visualizza le tariffe in base ai parametri specificati" accessibilityState={{ busy: inCorso, disabled: inCorso }}
        onPress={visualizza} disabled={inCorso}
        style={{ backgroundColor: t.brand, padding: 14, borderRadius: RADIUS.md, alignItems: "center", opacity: inCorso ? 0.6 : 1 }}
      >
        {inCorso ? <ActivityIndicator color={t.onBrand} /> : <Text style={{ color: t.onBrand, fontWeight: "800" }}>Visualizza</Text>}
      </Pressable>
    </View>
  );
}
