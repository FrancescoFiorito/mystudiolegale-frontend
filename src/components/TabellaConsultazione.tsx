import React from "react";
import { View, Text, Pressable, ScrollView, TextInput, ActivityIndicator, AccessibilityInfo, useWindowDimensions } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useTheme } from "@/src/ThemeContext";
import { SPACING, RADIUS } from "@/src/theme";
import { api } from "@/src/api";
import SelectInput from "@/src/components/SelectInput";
import EsportaDocumento from "@/src/components/EsportaDocumento";
import {
  TABELLE_CONSULTAZIONE, TabellaId, RispostaTab, SezioneTab, FiltroTab, Valori, RispostaSpese,
  valoriIniziali, queryTabella, rispostaDaSpese, esportazioneTabella, gruppiContributo,
} from "@/src/utils/tabelleConsultazione";

// Schermata generica delle tabelle di consultazione del menù Calcolatori: titolo,
// testi introduttivi, filtri, tabelle (scorrevoli in orizzontale, con l'intestazione
// che resta fissa in alto mentre si scorre la pagina), note, fonti ed esportazione.
// Tutte le voci usano questo componente: cambia solo la configurazione.

type Tema = ReturnType<typeof useTheme>["t"];

const LARG_MIN = 56;
const LARG_MAX = 320;
const CARATTERE = 7.2;

// Larghezza di ogni colonna in base al contenuto; se la tabella è più stretta
// dello schermo le colonne si allargano per riempirlo.
function larghezzeColonne(s: SezioneTab, disponibile: number): number[] {
  const w = s.colonne.map((c, j) => {
    const parole = String(c.etichetta || "").split(/\s+/);
    const intest = Math.max(4, ...parole.map((p) => p.length)) * 7.6 + 20;
    const celle = s.righe.reduce((m, r) => Math.max(m, String(r[j] ?? "").length), 0);
    return Math.min(LARG_MAX, Math.max(LARG_MIN, intest, Math.min(celle, 42) * CARATTERE + 20));
  });
  const tot = w.reduce((a, b) => a + b, 0);
  if (tot > 0 && tot < disponibile) return w.map((x) => (x * disponibile) / tot);
  // Poche colonne strette + una larga di testo: la larga si restringe (va a capo)
  // per far stare tutto nello schermo, senza scorrimento orizzontale.
  const larghe = w.map((x, j) => (x > 150 ? j : -1)).filter((j) => j >= 0);
  const fisse = w.reduce((a, x) => a + (x > 150 ? 0 : x), 0);
  if (larghe.length && fisse + larghe.length * 150 <= disponibile) {
    const totLarghe = larghe.reduce((a, j) => a + w[j], 0);
    const spazio = disponibile - fisse;
    return w.map((x) => (x > 150 ? (x * spazio) / totLarghe : x));
  }
  return w;
}

const haContenuto = (s: SezioneTab) => s.righe.length > 0 || (s.testo?.length ?? 0) > 0 || (s.elenco?.length ?? 0) > 0;

const ALLINEA_DESTRA = /^[\s\d.,%€≤\-–—/+()]*$/;

function etichettaBlocco(s: SezioneTab, righe: string[][]): string {
  const primo = righe.map((r) => String(r[0] ?? "")).find(Boolean) || "";
  const parti: string[] = [];
  for (let j = 1; j < s.colonne.length; j++) {
    const vals = righe.map((r) => String(r[j] ?? "")).filter((v) => v && !/^-+$/.test(v));
    if (!vals.length) continue;
    const c = s.colonne[j];
    const lab = c.etichetta_acc || c.etichetta;
    parti.push(`${c.gruppo ? `${c.gruppo} ` : ""}${lab ? `${lab}: ` : ""}${vals.join(", ")}`);
  }
  return [primo, ...parti].filter(Boolean).join(". ");
}

function Intestazione({ s, larghezze, t, registra }: { s: SezioneTab; larghezze: number[]; t: Tema; registra: (r: ScrollView | null) => void }) {
  const tot = larghezze.reduce((a, b) => a + b, 0);
  const haGruppi = s.colonne.some((c) => c.gruppo);
  // Gruppi consecutivi con lo stesso nome = una sola intestazione sopra le colonne.
  const gruppi: { nome: string; larg: number }[] = [];
  if (haGruppi) {
    s.colonne.forEach((c, j) => {
      const nome = c.gruppo || "";
      const ultimo = gruppi[gruppi.length - 1];
      if (ultimo && ultimo.nome === nome && nome) ultimo.larg += larghezze[j];
      else gruppi.push({ nome, larg: larghezze[j] });
    });
  }
  const etichetteVisibili = s.colonne.some((c) => String(c.etichetta || "").trim());
  if (!etichetteVisibili && !haGruppi) return null;
  const nomiAcc = s.colonne.map((c) => [c.gruppo, c.etichetta_acc || c.etichetta].filter(Boolean).join(" ")).filter(Boolean).join(", ");
  return (
    <View style={{ backgroundColor: t.surface, borderBottomWidth: 1, borderBottomColor: t.border }} accessible accessibilityRole="header" accessibilityLabel={`Colonne: ${nomiAcc}`}>
      <ScrollView ref={registra} horizontal scrollEnabled={false} showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: SPACING.lg }}>
        <View style={{ width: tot }}>
          {haGruppi ? (
            <View style={{ flexDirection: "row" }}>
              {gruppi.map((g, i) => (
                <View key={i} style={{ width: g.larg, paddingVertical: 4, paddingHorizontal: 8, backgroundColor: g.nome ? t.brand : "transparent", borderLeftWidth: g.nome && i > 0 ? 1 : 0, borderLeftColor: t.onBrand }}>
                  <Text style={{ color: t.onBrand, fontWeight: "700", fontSize: 12, textAlign: "center" }}>{g.nome}</Text>
                </View>
              ))}
            </View>
          ) : null}
          <View style={{ flexDirection: "row", backgroundColor: t.brandSecondary }}>
            {s.colonne.map((c, j) => (
              <View key={c.chiave} style={{ width: larghezze[j], paddingVertical: 8, paddingHorizontal: 8, justifyContent: "flex-end" }}>
                <Text style={{ color: t.brand, fontWeight: "700", fontSize: 12, textAlign: j === 0 ? "left" : "center" }}>{c.etichetta}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

type PropsCorpo = {
  s: SezioneTab; larghezze: number[]; t: Tema; sync: (x: number) => void;
  evidenziaUltima?: boolean;
  azione?: { tipo: "copia"; colonna: string } | { tipo: "info" };
  copiato: string | null; onCopia: (chiave: string, codice: string) => void;
  espansa: string | null; onEspandi: (chiave: string) => void;
};

function CorpoTabella({ s, larghezze, t, sync, evidenziaUltima, azione, copiato, onCopia, espansa, onEspandi }: PropsCorpo) {
  const tot = larghezze.reduce((a, b) => a + b, 0);
  const blocchi = s.blocchi_righe && s.blocchi_righe.length ? s.blocchi_righe : null;
  const intestRighe = new Set(s.righe_intestazione || []);
  const colCopia = azione?.tipo === "copia" ? s.colonne.findIndex((c) => c.chiave === azione.colonna) : -1;
  // Righe raggruppate: una per blocco (fase dei parametri) oppure una per riga.
  const gruppi: { da: number; n: number }[] = [];
  if (blocchi) { let i = 0; for (const n of blocchi) { gruppi.push({ da: i, n }); i += n; } if (i < s.righe.length) gruppi.push({ da: i, n: s.righe.length - i }); }
  else s.righe.forEach((_, i) => gruppi.push({ da: i, n: 1 }));

  const cella = (riga: string[], j: number, indiceRiga: number) => {
    const v = String(riga[j] ?? "");
    const testoLungo = s.righe.some((r) => String(r[j] ?? "").length > 18);
    const destra = j > 0 && !testoLungo && ALLINEA_DESTRA.test(v);
    const grassetto = j === 0 && !!v && (!!blocchi || intestRighe.has(indiceRiga));
    const piccola = !!blocchi && /^(-50%|Min:|Max:)/.test(v);
    return (
      <View key={j} style={{ width: larghezze[j], paddingVertical: piccola ? 3 : 7, paddingHorizontal: 8, flexDirection: "row", alignItems: "center" }}>
        <Text style={{ flex: 1, color: piccola ? t.onSurfaceTertiary : t.onSurface, fontSize: piccola ? 11 : 13, fontWeight: grassetto ? "700" : "400", textAlign: destra ? "right" : j === 0 || testoLungo ? "left" : "center" }}>{v}</Text>
        {azione?.tipo === "info" && j === s.colonne.length - 1 ? <Feather name="info" size={14} color={t.brand} style={{ marginLeft: 6 }} /> : null}
        {j === colCopia && indiceRiga >= 0 ? <Feather name="copy" size={14} color={t.brand} style={{ marginLeft: 6 }} /> : null}
      </View>
    );
  };

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator onScroll={(e) => sync(e.nativeEvent.contentOffset.x)} scrollEventThrottle={16} nestedScrollEnabled contentContainerStyle={{ paddingHorizontal: SPACING.lg }}>
      <View style={{ width: tot }}>
        {gruppi.map((g, gi) => {
          const righe = s.righe.slice(g.da, g.da + g.n);
          const sfondo = gi % 2 === 1 ? t.surfaceSecondary : t.surface;
          const evidenzia = !!evidenziaUltima && g.da === s.righe.length - 1 && /^-+$/.test(String(righe[0]?.[1] ?? ""));
          const chiave = `${s.id}-${g.da}`;
          const rigaView = (
            <View style={{ backgroundColor: evidenzia ? t.brandSecondary : sfondo, borderBottomWidth: 1, borderBottomColor: t.border }}>
              {righe.map((riga, k) => (
                <View key={k} style={{ flexDirection: "row", alignItems: "stretch" }}>
                  {s.colonne.map((_, j) => cella(riga, j, g.da + k))}
                </View>
              ))}
            </View>
          );
          if (azione?.tipo === "copia" && colCopia >= 0) {
            const codice = String(righe[0][colCopia] ?? "");
            return (
              <Pressable key={gi} testID={`tab-copia-${codice}`} accessibilityRole="button" accessibilityLabel={`${etichettaBlocco(s, righe)}. Tocca per copiare il codice ${codice}`}
                onPress={() => onCopia(chiave, codice)}>
                {rigaView}
                {copiato === chiave ? (
                  <View style={{ position: "absolute", right: 8, top: 4, backgroundColor: t.success, borderRadius: RADIUS.md, paddingHorizontal: 8, paddingVertical: 2 }}>
                    <Text style={{ color: t.onBrand, fontSize: 11, fontWeight: "700" }}>Copiato</Text>
                  </View>
                ) : null}
              </Pressable>
            );
          }
          if (azione?.tipo === "info") {
            const info = s.info?.[g.da];
            const aperta = espansa === chiave;
            const haInfo = !!(info && (info.nota || info.moltiplicatori_testo));
            return (
              <View key={gi}>
                <Pressable testID={`tab-info-${chiave}`} accessibilityRole="button" accessibilityState={{ expanded: aperta }}
                  accessibilityLabel={`${etichettaBlocco(s, righe)}. ${haInfo ? (aperta ? "Informazioni aperte, tocca per chiudere" : "Tocca per vedere le informazioni") : ""}`}
                  onPress={() => haInfo && onEspandi(chiave)}>
                  {rigaView}
                </Pressable>
                {aperta && info ? (
                  <View style={{ padding: SPACING.md, backgroundColor: t.brandSecondary, width: Math.min(tot, 560), borderBottomWidth: 1, borderBottomColor: t.border }}>
                    {info.nota ? <Text style={{ color: t.onSurface, fontSize: 13, lineHeight: 19 }}>{info.nota}</Text> : null}
                    {info.moltiplicatori_testo ? <Text style={{ color: t.brand, fontWeight: "700", fontSize: 13, marginTop: info.nota ? 6 : 0 }}>{info.moltiplicatori_testo}</Text> : null}
                  </View>
                ) : null}
              </View>
            );
          }
          return (
            <View key={gi} accessible accessibilityLabel={etichettaBlocco(s, righe)}>
              {rigaView}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

function Paragrafi({ testi, t, size = 13, color }: { testi: string[]; t: Tema; size?: number; color?: string }) {
  return (
    <>
      {testi.filter((x) => x && x.trim()).map((p, i) => (
        <Text key={i} style={{ color: color || t.onSurfaceSecondary, fontSize: size, lineHeight: size + 6, marginTop: i ? 6 : 0 }}>{p}</Text>
      ))}
    </>
  );
}

function CasellaScelta({ attiva, etichetta, onPress, ruolo, t, testID, descrizione }: { attiva: boolean; etichetta: string; onPress: () => void; ruolo: "radio" | "checkbox"; t: Tema; testID: string; descrizione?: string }) {
  return (
    <Pressable testID={testID} accessibilityRole={ruolo} accessibilityState={ruolo === "radio" ? { selected: attiva } : { checked: attiva }} accessibilityLabel={etichetta} accessibilityHint={descrizione}
      onPress={onPress} style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 7 }}>
      <View style={{ width: 20, height: 20, borderRadius: ruolo === "radio" ? 10 : 4, borderWidth: 2, borderColor: t.brand, backgroundColor: ruolo === "checkbox" && attiva ? t.brand : "transparent", alignItems: "center", justifyContent: "center" }}>
        {ruolo === "radio" && attiva ? <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: t.brand }} /> : null}
        {ruolo === "checkbox" && attiva ? <Feather name="check" size={14} color={t.onBrand} /> : null}
      </View>
      <Text style={{ color: t.onSurface, fontSize: 14, flex: 1 }}>{etichetta}</Text>
    </Pressable>
  );
}

export default function TabellaConsultazione({ id }: { id: TabellaId }) {
  const cfg = TABELLE_CONSULTAZIONE[id];
  const { t } = useTheme();
  const { width } = useWindowDimensions();
  const [risposta, setRisposta] = React.useState<RispostaTab | null>(null);
  const [valori, setValori] = React.useState<Valori>({});
  const [valoriRisposta, setValoriRisposta] = React.useState<Valori>({});
  const [caricando, setCaricando] = React.useState(true);
  const [errore, setErrore] = React.useState<string | null>(null);
  const [aperte, setAperte] = React.useState<Record<string, boolean>>({});
  const [espansa, setEspansa] = React.useState<string | null>(null);
  const [copiato, setCopiato] = React.useState<string | null>(null);
  const [gruppiScelti, setGruppiScelti] = React.useState<string[] | null>(null);
  const [moltiplicatori, setMoltiplicatori] = React.useState(false);
  const contatore = React.useRef(0);
  const scrollRef = React.useRef<ScrollView>(null);
  const ys = React.useRef<Record<string, number>>({});
  const intestazioni = React.useRef<Record<string, ScrollView | null>>({});
  const filtri: FiltroTab[] = risposta?.filtri || [];
  const disponibile = Math.max(200, width - 2 * SPACING.lg);

  const carica = async (v: Valori | null) => {
    const n = ++contatore.current;
    setCaricando(true);
    setErrore(null);
    try {
      let r: RispostaTab;
      if (id === "spese-condominiali") {
        const body: Record<string, number> = {};
        if (v) { const tb = Number(v.tabella), ct = Number(v.categoria); if (tb) body.tabella = tb; if (v.categoria !== "" && !Number.isNaN(ct)) body.categoria = ct; }
        r = rispostaDaSpese(await api.post<RispostaSpese>("/calc/spese-condominiali", body));
      } else {
        r = await api.get<RispostaTab>(`/tabelle/${cfg.endpoint}${v ? queryTabella(v, filtri) : ""}`);
      }
      if (n !== contatore.current) return;
      setRisposta(r);
      const usati = v && !cfg.sincronizza ? v : valoriIniziali(r.filtri);
      if (v === null || cfg.sincronizza) setValori(usati);
      setValoriRisposta(usati);
      setEspansa(null);
    } catch (e: any) {
      if (n !== contatore.current) return;
      setErrore(e?.message || "Impossibile caricare la tabella. Riprova.");
    } finally {
      if (n === contatore.current) setCaricando(false);
    }
  };

  React.useEffect(() => {
    const contaRichieste = contatore;
    carica(null);
    return () => { contaRichieste.current++; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cambia = (nome: string, valore: string) => {
    const nuovi = { ...valori, [nome]: valore, ...(cfg.azzera?.[nome] || {}) };
    setValori(nuovi);
    const f = filtri.find((x) => x.nome === nome);
    if (!cfg.soloPulsante && f && f.tipo !== "testo" && f.tipo !== "anno") carica(nuovi);
  };

  const copia = async (chiave: string, codice: string) => {
    try { await Clipboard.setStringAsync(codice); } catch {}
    setCopiato(chiave);
    AccessibilityInfo.announceForAccessibility?.(`Codice ${codice} copiato`);
    setTimeout(() => setCopiato((c) => (c === chiave ? null : c)), 1600);
  };

  const gruppiContributoLista = risposta && id === "contributo-unificato" ? gruppiContributo(risposta) : [];
  const gruppiEffettivi = gruppiScelti ?? gruppiContributoLista;
  const datiEsporta = React.useMemo(
    () => (risposta && !errore ? esportazioneTabella(id, risposta, { valori: valoriRisposta, gruppi: gruppiEffettivi, moltiplicatori }) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [risposta, errore, valoriRisposta, gruppiScelti, moltiplicatori],
  );

  // ---- Elementi della pagina (flat, per poter fissare le intestazioni) -------
  const figli: React.ReactElement[] = [];
  const sticky: number[] = [];
  const blocco = (key: string, contenuto: React.ReactNode, stile: object = {}) => {
    figli.push(<View key={key} style={{ paddingHorizontal: SPACING.lg, ...stile }}>{contenuto}</View>);
  };

  blocco("titolo", (
    <>
      <Text accessibilityRole="header" style={{ color: t.onSurface, fontSize: 20, fontWeight: "700" }}>{risposta?.titolo || cfg.titolo}</Text>
      {risposta?.sottotitolo ? <Text style={{ color: t.onSurfaceSecondary, fontSize: 13, marginTop: 4, lineHeight: 19 }}>{risposta.sottotitolo}</Text> : null}
      {risposta?.aggiornato_al && cfg.mostraAggiornamento ? <Text style={{ color: t.onSurfaceTertiary, fontSize: 12, marginTop: 4 }}>Dati aggiornati a {risposta.aggiornato_al}</Text> : null}
    </>
  ), { paddingTop: SPACING.lg });

  if (risposta?.introduzione?.length) blocco("intro", <Paragrafi testi={risposta.introduzione} t={t} />, { paddingTop: SPACING.md });

  if (risposta?.evidenza?.length) {
    blocco("evidenza", (
      <View style={{ backgroundColor: t.brandSecondary, borderRadius: RADIUS.md, padding: SPACING.md, gap: 6 }}>
        {risposta.evidenza.map((e, i) => (
          <View key={i} accessible accessibilityLabel={`${e.etichetta}: ${e.valore}`}>
            <Text style={{ color: t.onSurfaceSecondary, fontSize: 12 }}>{e.etichetta}</Text>
            <Text style={{ color: t.brand, fontSize: i === 0 ? 22 : 15, fontWeight: "700" }}>{e.valore}</Text>
          </View>
        ))}
      </View>
    ), { paddingTop: SPACING.md });
  }

  // Filtri
  const elencoParametri = id === "parametri-forensi" && !valoriRisposta.tabella;
  if (filtri.length || (id === "parametri-forensi" && !elencoParametri)) {
    const righeFiltri: React.ReactNode[] = [];
    for (let i = 0; i < filtri.length; i++) {
      const f = filtri[i];
      const v = valori[f.nome] ?? "";
      const etAcc = f.etichetta_acc || f.etichetta;
      const etichetta = f.etichetta ? <Text style={{ color: t.onSurfaceSecondary, fontSize: 12, fontWeight: "600", marginBottom: 4 }}>{f.etichetta}</Text> : null;
      if (f.tipo === "mese" && filtri[i + 1]?.tipo === "anno") {
        const fa = filtri[i + 1];
        i++;
        righeFiltri.push(
          <View key={f.nome} style={{ marginBottom: SPACING.sm }}>
            {etichetta}
            <View style={{ flexDirection: "row", gap: SPACING.sm }}>
              <View style={{ flex: 2 }}>
                <SelectInput testID={`tab-filtro-${f.nome}`} accessibilityLabel={f.etichetta} value={v} onChange={(x) => cambia(f.nome, x)} opzioni={(f.opzioni || []).map((o) => ({ value: String(o.valore), label: o.etichetta }))} />
              </View>
              <TextInput testID={`tab-filtro-${fa.nome}`} accessibilityLabel={`${f.etichetta}, anno`} value={valori[fa.nome] ?? ""} onChangeText={(x) => cambia(fa.nome, x.replace(/\D/g, "").slice(0, 4))}
                keyboardType="number-pad" maxLength={4} style={{ flex: 1, borderWidth: 1, borderColor: t.border, backgroundColor: t.surfaceSecondary, color: t.onSurface, borderRadius: RADIUS.md, paddingHorizontal: 12, fontSize: 15, minHeight: 44 }} />
            </View>
          </View>,
        );
        continue;
      }
      if (f.tipo === "scelta_multipla") {
        const attivi = v ? v.split(",") : [];
        righeFiltri.push(
          <View key={f.nome} style={{ marginBottom: SPACING.sm }} accessibilityRole="none">
            {etichetta}
            {(f.opzioni || []).map((o) => {
              const val = String(o.valore);
              const on = attivi.includes(val);
              return (
                <CasellaScelta key={val} testID={`tab-filtro-${f.nome}-${val}`} t={t} ruolo="checkbox" attiva={on} etichetta={o.etichetta} descrizione={o.descrizione}
                  onPress={() => {
                    const nuovi = on ? attivi.filter((a) => a !== val) : (f.opzioni || []).map((x) => String(x.valore)).filter((x) => x === val || attivi.includes(x));
                    if (nuovi.length) cambia(f.nome, nuovi.join(","));
                  }} />
              );
            })}
          </View>,
        );
        continue;
      }
      if ((f.tipo === "scelta") && cfg.radio?.includes(f.nome)) {
        const prima = cfg.radioTestoPrima?.[f.nome];
        righeFiltri.push(
          <View key={f.nome} style={{ marginBottom: SPACING.sm }} accessibilityRole="radiogroup" accessibilityLabel={etAcc}>
            {cfg.radioSenzaEtichetta?.includes(f.nome) ? null : etichetta}
            {(f.opzioni || []).map((o, k) => (
              <React.Fragment key={String(o.valore)}>
                {prima && prima.indice === k ? <Text style={{ color: t.onSurfaceSecondary, fontSize: 13, fontWeight: "600", marginTop: 8 }}>{prima.testo}</Text> : null}
                <CasellaScelta testID={`tab-filtro-${f.nome}-${o.valore}`} t={t} ruolo="radio" attiva={v === String(o.valore)} etichetta={o.etichetta} onPress={() => cambia(f.nome, String(o.valore))} />
              </React.Fragment>
            ))}
          </View>,
        );
        continue;
      }
      if (f.tipo === "testo") {
        righeFiltri.push(
          <View key={f.nome} style={{ marginBottom: SPACING.sm }}>
            {etichetta}
            <TextInput testID={`tab-filtro-${f.nome}`} accessibilityLabel={etAcc} value={v} onChangeText={(x) => cambia(f.nome, x)} maxLength={f.massimo_caratteri}
              autoCorrect={false} autoCapitalize="none" returnKeyType="search" onSubmitEditing={() => carica(valori)}
              style={{ borderWidth: 1, borderColor: t.border, backgroundColor: t.surfaceSecondary, color: t.onSurface, borderRadius: RADIUS.md, paddingHorizontal: 12, fontSize: 15, minHeight: 44 }} />
          </View>,
        );
        continue;
      }
      if (f.tipo === "anno") {
        righeFiltri.push(
          <View key={f.nome} style={{ marginBottom: SPACING.sm }}>
            {etichetta}
            <TextInput testID={`tab-filtro-${f.nome}`} accessibilityLabel={etAcc} value={v} onChangeText={(x) => cambia(f.nome, x.replace(/\D/g, "").slice(0, 4))} keyboardType="number-pad" maxLength={4}
              style={{ borderWidth: 1, borderColor: t.border, backgroundColor: t.surfaceSecondary, color: t.onSurface, borderRadius: RADIUS.md, paddingHorizontal: 12, fontSize: 15, minHeight: 44 }} />
          </View>,
        );
        continue;
      }
      const opzioni = (f.opzioni || []).map((o) => ({ value: String(o.valore), label: o.etichetta }));
      righeFiltri.push(
        <View key={f.nome} style={{ marginBottom: SPACING.sm }}>
          {etichetta}
          <SelectInput testID={`tab-filtro-${f.nome}`} accessibilityLabel={etAcc} value={v} onChange={(x) => cambia(f.nome, x)} opzioni={opzioni} placeholder={f.nome === "eta" ? "Seleziona l'età" : "Seleziona"} cercabile={opzioni.length > 12} />
        </View>,
      );
    }
    if (id === "parametri-forensi" && !elencoParametri) {
      righeFiltri.unshift(
        <Pressable key="elenco" testID="tab-torna-elenco" accessibilityRole="button" accessibilityLabel="Torna all'elenco delle tabelle" onPress={() => { const nuovi = { ...valori, tabella: "" }; setValori(nuovi); carica(nuovi); }}
          style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 8, marginBottom: SPACING.sm }}>
          <Feather name="arrow-left" size={16} color={t.brand} />
          <Text style={{ color: t.brand, fontWeight: "700" }}>Elenco delle tabelle</Text>
        </Pressable>,
      );
    }
    if (cfg.pulsante) {
      righeFiltri.push(
        <Pressable key="cerca" testID="tab-cerca" accessibilityRole="button" accessibilityLabel={cfg.pulsante} accessibilityState={{ busy: caricando, disabled: caricando }} disabled={caricando}
          onPress={() => carica(valori)} style={{ backgroundColor: t.brand, borderRadius: RADIUS.md, padding: 12, alignItems: "center", opacity: caricando ? 0.6 : 1 }}>
          <Text style={{ color: t.onBrand, fontWeight: "700" }}>{cfg.pulsante}</Text>
        </Pressable>,
      );
    }
    if (righeFiltri.length) blocco("filtri", <View>{righeFiltri}</View>, { paddingTop: SPACING.lg });
  }

  if (caricando) {
    blocco("caricamento", <ActivityIndicator testID="tab-caricamento" accessibilityLabel="Caricamento in corso" color={t.brand} />, { paddingVertical: SPACING.xl });
  } else if (errore) {
    blocco("errore", (
      <View testID="tab-errore" accessibilityRole="alert" style={{ borderWidth: 1, borderColor: t.error, borderRadius: RADIUS.md, padding: SPACING.md }}>
        <Text style={{ color: t.error, fontSize: 14 }}>{errore}</Text>
        <Pressable testID="tab-riprova" accessibilityRole="button" accessibilityLabel="Riprova" onPress={() => carica(risposta ? valori : null)} style={{ marginTop: SPACING.sm }}>
          <Text style={{ color: t.brand, fontWeight: "700" }}>Riprova</Text>
        </Pressable>
      </View>
    ), { paddingTop: SPACING.md });
  } else if (risposta) {
    if (risposta.messaggio && !risposta.sezioni.some(haContenuto)) {
      blocco("messaggio", (
        <View testID="tab-messaggio" accessible accessibilityLabel={risposta.messaggio} style={{ backgroundColor: t.surfaceSecondary, borderRadius: RADIUS.md, padding: SPACING.md }}>
          <Text style={{ color: t.onSurfaceSecondary, fontSize: 14 }}>{risposta.messaggio}</Text>
        </View>
      ), { paddingTop: SPACING.md });
    }

    // Indice del contributo unificato (tre gruppi, come sul sito).
    if (id === "contributo-unificato" && risposta.indice?.length) {
      blocco("indice", (
        <View>
          {risposta.indice.map((g) => (
            <View key={g.gruppo} style={{ marginBottom: SPACING.sm }}>
              <Text style={{ color: t.onSurface, fontWeight: "700", fontSize: 14, marginBottom: 2 }}>{g.gruppo}</Text>
              {g.voci.map((v) => (
                <Pressable key={v.id} testID={`tab-indice-${v.id}`} accessibilityRole="button" accessibilityLabel={`Vai a ${v.titolo}`}
                  onPress={() => { setAperte((a) => ({ ...a, [v.id]: true })); setTimeout(() => scrollRef.current?.scrollTo({ y: Math.max(0, (ys.current[v.id] ?? 0) - 8), animated: true }), 60); }}
                  style={{ paddingVertical: 5 }}>
                  <Text style={{ color: t.brand, fontSize: 13 }}>{v.titolo}</Text>
                </Pressable>
              ))}
            </View>
          ))}
        </View>
      ), { paddingTop: SPACING.md });
    }

    risposta.sezioni.forEach((s, si) => {
      if (!haContenuto(s)) return;
      const apribile = !!cfg.apribili;
      const aperta = !apribile || (aperte[s.id] ?? si === 0);
      const titoloGruppo = s.titolo_gruppo && risposta.sezioni[si - 1]?.titolo_gruppo !== s.titolo_gruppo ? s.titolo_gruppo : null;
      if (titoloGruppo) blocco(`${s.id}-tg`, <Text accessibilityRole="header" style={{ color: t.onSurface, fontWeight: "700", fontSize: 15 }}>{titoloGruppo}</Text>, { paddingTop: SPACING.lg });
      if (s.titolo && s.titolo !== risposta.titolo) {
        const testoTitolo = (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text accessibilityRole="header" style={{ flex: 1, color: t.onSurface, fontWeight: "700", fontSize: 15 }}>{s.titolo}</Text>
            {apribile ? <Feather name={aperta ? "chevron-up" : "chevron-down"} size={18} color={t.onSurfaceTertiary} /> : null}
          </View>
        );
        figli.push(
          <View key={`${s.id}-t`} onLayout={(e) => { ys.current[s.id] = e.nativeEvent.layout.y; }} style={{ paddingHorizontal: SPACING.lg, paddingTop: titoloGruppo ? SPACING.sm : SPACING.lg, paddingBottom: SPACING.xs }}>
            {apribile ? (
              <Pressable testID={`tab-sezione-${s.id}`} accessibilityRole="button" accessibilityState={{ expanded: aperta }} accessibilityLabel={s.titolo} onPress={() => setAperte((a) => ({ ...a, [s.id]: !aperta }))}>{testoTitolo}</Pressable>
            ) : testoTitolo}
          </View>,
        );
      }
      if (!aperta) return;
      if (s.ids?.length) {
        blocco(`${s.id}-elenco`, (
          <View>
            {s.righe.map((riga, i) => (
              <Pressable key={i} testID={`tab-voce-${s.ids![i]}`} accessibilityRole="button" accessibilityLabel={[riga[0], riga[1]].filter(Boolean).join(". ")} onPress={() => cambia("tabella", s.ids![i])}
                style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: t.border, flexDirection: "row", alignItems: "center", gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: t.brand, fontWeight: "600", fontSize: 14 }}>{riga[0]}</Text>
                  {riga[1] ? <Text style={{ color: t.onSurfaceTertiary, fontSize: 12, marginTop: 2 }}>{riga[1]}</Text> : null}
                </View>
                <Feather name="chevron-right" size={16} color={t.onSurfaceTertiary} />
              </Pressable>
            ))}
          </View>
        ));
        return;
      }
      if (s.testo?.length) blocco(`${s.id}-testo`, <Paragrafi testi={s.testo} t={t} size={14} color={t.onSurface} />, { paddingTop: SPACING.xs });
      if (s.elenco?.length) {
        blocco(`${s.id}-elenco`, (
          <View>
            {s.elenco.map((e, i) => (e === "---"
              ? <View key={i} style={{ height: 1, backgroundColor: t.border, marginVertical: SPACING.sm }} />
              : (
                <View key={i} style={{ flexDirection: "row", gap: 8, marginBottom: 6 }}>
                  <Text style={{ color: t.onSurfaceSecondary, fontSize: 13 }}>•</Text>
                  <Text style={{ flex: 1, color: t.onSurface, fontSize: 13, lineHeight: 19 }}>{e}</Text>
                </View>
              )))}
          </View>
        ), { paddingTop: SPACING.xs });
      }
      if (s.righe.length && s.colonne.length) {
        const larghezze = larghezzeColonne(s, disponibile);
        const piuLarga = larghezze.reduce((a, b) => a + b, 0) > disponibile + 4;
        if (piuLarga) blocco(`${s.id}-hint`, <Text style={{ color: t.onSurfaceTertiary, fontSize: 11 }}>Scorri la tabella verso destra per vedere tutte le colonne</Text>, { paddingBottom: SPACING.xs });
        const inte = Intestazione({ s, larghezze, t, registra: (r) => { intestazioni.current[s.id] = r; } });
        if (inte) { sticky.push(figli.length); figli.push(React.cloneElement(inte, { key: `${s.id}-h` })); }
        figli.push(
          <CorpoTabella key={`${s.id}-b`} s={s} larghezze={larghezze} t={t} sync={(x) => intestazioni.current[s.id]?.scrollTo({ x, animated: false })}
            evidenziaUltima={cfg.evidenziaUltima} azione={cfg.azioneRiga} copiato={copiato} onCopia={copia} espansa={espansa} onEspandi={(k) => setEspansa((e) => (e === k ? null : k))} />,
        );
      }
      if (s.note?.length) blocco(`${s.id}-note`, <Paragrafi testi={s.note} t={t} size={12} />, { paddingTop: SPACING.sm });
    });

    if (risposta.note?.length) {
      blocco("note", (
        <>
          <Text accessibilityRole="header" style={{ color: t.onSurfaceSecondary, fontWeight: "700", fontSize: 12, marginBottom: 4 }}>NOTE</Text>
          <Paragrafi testi={risposta.note} t={t} size={12} />
        </>
      ), { paddingTop: SPACING.lg });
    }
    if (risposta.fonti?.length) {
      blocco("fonti", (
        <>
          <Text accessibilityRole="header" style={{ color: t.onSurfaceSecondary, fontWeight: "700", fontSize: 12, marginBottom: 4 }}>FONTI</Text>
          <Paragrafi testi={risposta.fonti} t={t} size={12} color={t.onSurfaceTertiary} />
        </>
      ), { paddingTop: SPACING.md });
    }

    if (datiEsporta) {
      blocco("esporta", (
        <View>
          {id === "contributo-unificato" ? (
            <View style={{ marginBottom: SPACING.sm }}>
              <Text style={{ color: t.onSurfaceSecondary, fontSize: 12, fontWeight: "600", marginBottom: 2 }}>Parti da esportare</Text>
              {gruppiContributoLista.map((g) => {
                const on = gruppiEffettivi.includes(g);
                return (
                  <CasellaScelta key={g} testID={`tab-esporta-gruppo-${g}`} t={t} ruolo="checkbox" attiva={on} etichetta={g}
                    onPress={() => { const nuovi = on ? gruppiEffettivi.filter((x) => x !== g) : gruppiContributoLista.filter((x) => x === g || gruppiEffettivi.includes(x)); if (nuovi.length) setGruppiScelti(nuovi); }} />
                );
              })}
            </View>
          ) : null}
          {id === "categorie-catastali" ? (
            <CasellaScelta testID="tab-esporta-moltiplicatori" t={t} ruolo="checkbox" attiva={moltiplicatori} etichetta="Includi il moltiplicatore catastale" onPress={() => setMoltiplicatori((m) => !m)} />
          ) : null}
          <EsportaDocumento testIDPrefix={`tab-${id}`} {...datiEsporta} />
        </View>
      ), { paddingTop: SPACING.lg });
    }
  }
  figli.push(<View key="fine" style={{ height: SPACING.xxxl }} />);

  return (
    <ScrollView ref={scrollRef} testID={`tabella-${id}`} stickyHeaderIndices={sticky} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={{ paddingBottom: SPACING.xxxl }}>
      {figli}
    </ScrollView>
  );
}
