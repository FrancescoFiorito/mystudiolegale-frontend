import React from "react";
import { View, Text, Pressable, TextInput, ActivityIndicator } from "react-native";
import { useTheme } from "@/src/ThemeContext";
import { SPACING, RADIUS } from "@/src/theme";
import { api } from "@/src/api";
import SelectInput from "@/src/components/SelectInput";
import EsportaDocumento from "@/src/components/EsportaDocumento";
import {
  VeicoloAci, RicercaAci, RisultatoAci, MAX_CARATTERI_RICERCA, MAX_CIFRE_KM,
  pulisciKm, pulisciRicerca, ricercaValida, testoContatore, righeRisultato, euroTariffa, euroRimborso, testoKm,
} from "@/src/utils/rimborsoAci";

const ANNI_INIZIALI = ["2026", "2025"];
const ATTESA_RICERCA_MS = 250;

// Rimborso chilometrico con le tabelle ACI: stessi campi del sito di riferimento (tabella
// dell'anno, chilometri, ricerca del veicolo con suggerimenti). Scegliere un veicolo calcola
// subito; cambiando l'anno si ricalcola lo stesso veicolo. Le tariffe sono quelle delle tabelle
// ufficiali pubblicate in Gazzetta Ufficiale (percorrenza di 15.000 km/anno).
export default function RimborsoAci() {
  const { t } = useTheme();
  const [anni, setAnni] = React.useState<string[]>(ANNI_INIZIALI);
  const [anno, setAnno] = React.useState(ANNI_INIZIALI[0]);
  const [km, setKm] = React.useState("");
  const [cerca, setCerca] = React.useState("");
  const [suggerimenti, setSuggerimenti] = React.useState<VeicoloAci[]>([]);
  const [contatore, setContatore] = React.useState("");
  const [inRicerca, setInRicerca] = React.useState(false);
  const [veicolo, setVeicolo] = React.useState<{ id: number; etichetta: string } | null>(null);
  const [risultato, setRisultato] = React.useState<RisultatoAci | null>(null);
  const [errore, setErrore] = React.useState<string | null>(null);
  const [inCalcolo, setInCalcolo] = React.useState(false);
  const richiesta = React.useRef(0);

  // Anni disponibili sul server (il piu' recente per primo); se la chiamata fallisce restano quelli di partenza.
  React.useEffect(() => {
    let attivo = true;
    api.get<{ anni: number[] }>("/calc/rimborso-aci/anni")
      .then((r) => {
        if (!attivo || !r.anni?.length) return;
        const lista = r.anni.map(String);
        setAnni(lista);
        setAnno((a) => (lista.includes(a) ? a : lista[0]));
      })
      .catch(() => {});
    return () => { attivo = false; };
  }, []);

  // Suggerimenti mentre si scrive: attesa breve e annullamento della richiesta superata.
  React.useEffect(() => {
    if (!ricercaValida(cerca)) {
      setSuggerimenti([]); setContatore(""); setInRicerca(false);
      return;
    }
    const controller = new AbortController();
    setInRicerca(true);
    const timer = setTimeout(async () => {
      try {
        const qs = new URLSearchParams({ anno, q: cerca.trim() });
        const r = await api.get<RicercaAci>(`/calc/rimborso-aci/veicoli?${qs.toString()}`, { signal: controller.signal });
        if (controller.signal.aborted) return;
        setSuggerimenti(r.risultati);
        setContatore(testoContatore(r.risultati.length, r.altri));
        setInRicerca(false);
      } catch (e: any) {
        if (controller.signal.aborted || e?.name === "AbortError") return;
        setSuggerimenti([]); setContatore(""); setInRicerca(false);
        setErrore(e?.message || "Ricerca non riuscita. Riprova.");
      }
    }, ATTESA_RICERCA_MS);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [cerca, anno]);

  const calcola = async (v: { id?: number; etichetta: string }, annoScelto: string, kmTesto: string) => {
    const n = ++richiesta.current;
    setErrore(null); setInCalcolo(true);
    try {
      const corpo: any = { anno: Number(annoScelto), km: kmTesto.trim() || null };
      if (v.id != null) corpo.veicolo = v.id; else corpo.etichetta = v.etichetta;
      const r = await api.post<RisultatoAci>("/calc/rimborso-aci", corpo);
      if (n !== richiesta.current) return;
      setRisultato(r);
      setVeicolo({ id: r.veicolo_id, etichetta: r.veicolo });
    } catch (e: any) {
      if (n !== richiesta.current) return;
      setRisultato(null);
      setErrore(e?.message || "Impossibile calcolare il rimborso. Riprova.");
    } finally {
      if (n === richiesta.current) setInCalcolo(false);
    }
  };

  // Come nel sito, la scelta di un veicolo svuota il campo di ricerca e calcola subito.
  const scegli = (v: VeicoloAci) => {
    setCerca(""); setSuggerimenti([]); setContatore("");
    calcola({ id: v.id, etichetta: v.etichetta }, anno, km);
  };

  // Cambiando l'anno si ricalcola lo stesso veicolo (cercato per nome nella tabella del nuovo anno).
  const cambiaAnno = (a: string) => {
    setAnno(a);
    if (veicolo) calcola({ etichetta: veicolo.etichetta }, a, km);
  };

  // Aggiunta rispetto al sito: dopo aver scritto i chilometri (invio o uscita dal campo) il risultato si aggiorna.
  const confermaKm = () => { if (veicolo) calcola({ id: veicolo.id, etichetta: veicolo.etichetta }, anno, km); };

  const campo = { backgroundColor: t.surfaceSecondary, color: t.onSurface, borderColor: t.border, borderWidth: 1, borderRadius: RADIUS.md, padding: 10 } as const;
  const lbl = { color: t.onSurfaceSecondary, fontSize: 13, fontWeight: "600" as const, marginBottom: 4 };
  const riga = (testID: string, etichetta: string, valore: string) => (
    <View key={testID} testID={testID} accessible accessibilityLabel={`${etichetta}: ${valore}`} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 6, gap: SPACING.sm }}>
      <Text style={{ color: t.onSurfaceSecondary, flexShrink: 1 }}>{etichetta}</Text>
      <Text style={{ color: t.onSurface, fontWeight: "800", textAlign: "right", flexShrink: 1 }}>{valore}</Text>
    </View>
  );

  return (
    <View testID="rimborso-aci">
      <Text style={lbl}>Tabella di riferimento:</Text>
      <View style={{ marginBottom: SPACING.md }}>
        <SelectInput testID="rimborso-aci-anno" accessibilityLabel="Tabella di riferimento, anno" value={anno} onChange={cambiaAnno} opzioni={anni.map((a) => ({ value: a, label: a }))} />
      </View>

      <Text style={lbl}>Chilometri:</Text>
      <TextInput
        testID="rimborso-aci-km" accessibilityLabel="Chilometri" accessibilityHint="Chilometri percorsi, facoltativo. Senza chilometri si ottiene solo la tariffa"
        value={km} onChangeText={(v) => setKm(pulisciKm(v))} onSubmitEditing={confermaKm} onBlur={confermaKm}
        maxLength={MAX_CIFRE_KM} keyboardType="numbers-and-punctuation" returnKeyType="done" selectTextOnFocus
        style={[campo, { marginBottom: SPACING.md }]}
      />

      <Text style={lbl}>Per iniziare la ricerca digita almeno 3 caratteri.</Text>
      <Text style={{ color: t.onSurfaceTertiary, fontSize: 12, marginBottom: 6 }}>Esempi: ‘fiat 500L’, ‘volks passat’, ‘audi a4’, ‘mazda CX-5’ …</Text>
      <TextInput
        testID="rimborso-aci-cerca" accessibilityLabel="Veicolo" accessibilityHint="Digita almeno 3 caratteri di marca e modello; i veicoli trovati compaiono sotto"
        placeholder="digita almeno 3 caratteri per iniziare la ricerca" placeholderTextColor={t.onSurfaceTertiary}
        value={cerca} onChangeText={(v) => setCerca(pulisciRicerca(v))} maxLength={MAX_CARATTERI_RICERCA}
        autoCapitalize="none" autoCorrect={false} returnKeyType="search"
        style={campo}
      />
      <View style={{ minHeight: 22, flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
        {inRicerca ? <ActivityIndicator size="small" color={t.brand} /> : null}
        {contatore ? <Text testID="rimborso-aci-contatore" accessibilityLiveRegion="polite" style={{ color: t.onSurfaceTertiary, fontSize: 12 }}>{contatore}</Text> : null}
      </View>

      {suggerimenti.length ? (
        <View testID="rimborso-aci-suggerimenti" style={{ borderColor: t.border, borderWidth: 1, borderRadius: RADIUS.md, overflow: "hidden", marginTop: 4, marginBottom: SPACING.md }}>
          {suggerimenti.map((v, i) => (
            <Pressable
              key={v.id} testID={`rimborso-aci-veicolo-${v.id}`} accessibilityRole="button" accessibilityLabel={v.etichetta} accessibilityHint="Calcola il rimborso per questo veicolo"
              onPress={() => scegli(v)}
              style={{ paddingVertical: 10, paddingHorizontal: 10, minHeight: 44, justifyContent: "center", backgroundColor: i % 2 ? t.surfaceSecondary : t.surface }}
            >
              <Text style={{ color: t.onSurface, fontSize: 13 }}>{v.etichetta}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {errore ? (
        <View testID="rimborso-aci-errore" accessibilityRole="alert" style={{ backgroundColor: t.surfaceTertiary, borderColor: t.warning, borderWidth: 1, borderRadius: RADIUS.md, padding: SPACING.md, marginVertical: SPACING.md }}>
          <Text style={{ color: t.warning, fontWeight: "800", textAlign: "center" }}>{errore}</Text>
        </View>
      ) : null}

      {inCalcolo && !risultato ? <ActivityIndicator color={t.brand} style={{ marginVertical: SPACING.md }} /> : null}

      {risultato && !errore ? (
        <View testID="rimborso-aci-risultato" style={{ backgroundColor: t.surface, borderColor: t.border, borderWidth: 1, borderRadius: RADIUS.lg, padding: SPACING.md, marginTop: SPACING.sm, opacity: inCalcolo ? 0.6 : 1 }}>
          <Text testID="rimborso-aci-veicolo-scelto" accessibilityRole="header" style={{ color: t.onSurface, fontWeight: "800", fontSize: 16, textAlign: "center", marginBottom: SPACING.sm }}>{risultato.veicolo}</Text>
          {risultato.motorizzazione ? riga("rimborso-aci-motorizzazione", "Motorizzazione", risultato.motorizzazione) : null}
          {risultato.km ? riga("rimborso-aci-km-percorsi", "Chilometri percorsi", testoKm(risultato.km)) : null}
          {riga("rimborso-aci-tariffa", `Tariffa chilometrica ${risultato.anno}`, euroTariffa(risultato.tariffa))}
          {risultato.rimborso != null ? riga("rimborso-aci-rimborso", "Rimborso chilometrico", euroRimborso(risultato.rimborso)) : null}
        </View>
      ) : null}

      {risultato && !errore ? (
        <EsportaDocumento
          testIDPrefix="rimborso-aci"
          titolo={`Rimborso chilometrico ACI ${risultato.anno}`}
          datiInseriti={[["Tabella di riferimento", String(risultato.anno)], ["Veicolo", risultato.veicolo], ...(risultato.km ? [["Chilometri", testoKm(risultato.km)] as [string, string]] : [])]}
          risultato={righeRisultato(risultato).slice(1)}
          titoloRisultato="Rimborso"
          note="Tariffe delle tabelle nazionali dei costi chilometrici elaborate dall'ACI (art. 51, comma 4, lettera a, TUIR), calcolate su una percorrenza di 15.000 km annui."
        />
      ) : null}
    </View>
  );
}
