import React from "react";
import { View, Text, Pressable, TextInput, ActivityIndicator, Platform, Alert } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as Clipboard from "expo-clipboard";
import { File } from "expo-file-system";
import { useTheme } from "@/src/ThemeContext";
import { SPACING, RADIUS } from "@/src/theme";
import EsportaDocumento from "@/src/components/EsportaDocumento";
import { Sha256 } from "@/src/utils/sha256";
import {
  StatoHash, FileHash, MAX_FILE, statoHashIniziale, aggiungiSelezione, impostaModo, impostaTesto, rimuoviFile, nuovoCalcolo,
  vistaHash, righeFile, testoDaCopiare, riferimentoTemporale,
} from "@/src/utils/improntaHash";

// Blocchi di lettura: abbastanza piccoli da non bloccare l'interfaccia e da non
// tenere in memoria più di un blocco alla volta, anche per file molto grandi.
const BLOCCO = 256 * 1024;
const cedi = () => new Promise<void>((r) => setTimeout(r, 0));

type Asset = DocumentPicker.DocumentPickerAsset;

// Calcola l'impronta SHA256 leggendo il file a blocchi. Il file resta sul telefono: non viene
// mai inviato da nessuna parte (nessuna richiesta di rete in questa funzione).
async function impronta(asset: Asset): Promise<FileHash> {
  const sha = new Sha256();
  let dimensione = 0;
  if (Platform.OS === "web" && asset.file) {
    const blob: Blob = asset.file;
    dimensione = blob.size;
    for (let o = 0; o < blob.size; o += BLOCCO) {
      sha.update(new Uint8Array(await blob.slice(o, o + BLOCCO).arrayBuffer()));
      await cedi();
    }
  } else {
    const f = new File(asset.uri);
    const h = f.open();
    try {
      dimensione = h.size ?? asset.size ?? 0;
      let letti = 0;
      while (letti < dimensione) {
        const pezzo = h.readBytes(Math.min(BLOCCO, dimensione - letti));
        if (!pezzo.length) break;
        sha.update(pezzo);
        letti += pezzo.length;
        await cedi();
      }
    } finally {
      try { h.close(); } catch {}
      // La copia temporanea fatta dal selettore dei documenti non serve più.
      try { f.delete(); } catch {}
    }
  }
  return { nome: asset.name, dimensione, modificato: asset.lastModified || Date.now(), hash: sha.digestHex() };
}

export default function ImprontaHash() {
  const { t } = useTheme();
  const [stato, setStato] = React.useState<StatoHash>(() => statoHashIniziale());
  const [lavoro, setLavoro] = React.useState<{ fatti: number; totale: number } | null>(null);
  const [rimosso, setRimosso] = React.useState<string | null>(null);
  const [avviso, setAvviso] = React.useState<string | null>(null);
  const occupato = !!lavoro;

  const scegli = async () => {
    if (occupato) return;
    setAvviso(null);
    let res: DocumentPicker.DocumentPickerResult;
    try {
      // copyToCacheDirectory: il file viene copiato nella cache dell'app (sul telefono) per poterlo
      // leggere; la copia viene cancellata appena calcolata l'impronta.
      res = await DocumentPicker.getDocumentAsync({ multiple: true, copyToCacheDirectory: true, type: "*/*" });
    } catch (e: any) {
      setAvviso(e?.message || "Impossibile aprire la selezione dei file.");
      return;
    }
    if (res.canceled || !res.assets?.length) return;
    const scelti = res.assets;
    const daElaborare = scelti.slice(0, MAX_FILE);
    setRimosso(null);
    setLavoro({ fatti: 0, totale: daElaborare.length });
    const fatti: FileHash[] = [];
    try {
      for (const a of daElaborare) {
        try {
          fatti.push(await impronta(a));
        } catch (e: any) {
          setAvviso(`Impossibile leggere il file ${a.name}${e?.message ? `: ${e.message}` : ""}`);
        }
        setLavoro({ fatti: fatti.length, totale: daElaborare.length });
      }
    } finally {
      setLavoro(null);
    }
    setStato((s) => aggiungiSelezione(s, fatti, scelti.length));
  };

  const vista = vistaHash(stato);
  const modo = stato.modo;
  const copia = async (testo: string, cosa: string) => {
    try { await Clipboard.setStringAsync(testo); Alert.alert("Copiato", cosa); } catch {}
  };
  const togli = (i: number) => {
    const nome = stato.file[i].nome;
    setStato((s) => rimuoviFile(s, i));
    setRimosso(`File: ${nome} rimosso dalla lista.`);
    setTimeout(() => setRimosso((r) => (r === `File: ${nome} rimosso dalla lista.` ? null : r)), 1300);
  };

  const radio = (m: "calcolo" | "verifica", etichetta: string) => {
    const sel = modo === m;
    return (
      <Pressable
        testID={`hash-modo-${m}`} accessibilityRole="radio" accessibilityState={{ selected: sel }} accessibilityLabel={etichetta}
        accessibilityHint={m === "calcolo" ? "Seleziona se intendi effettuare il calcolo di una o più impronte hash" : "Seleziona se intendi effettuare anche la verifica di una o più impronte hash"}
        onPress={() => { setStato((s) => impostaModo(s, m)); setRimosso(null); }}
        style={{ flexDirection: "row", alignItems: "center", gap: 8, minHeight: 40, marginRight: SPACING.lg }}
      >
        <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: t.brand, alignItems: "center", justifyContent: "center" }}>
          {sel ? <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: t.brand }} /> : null}
        </View>
        <Text style={{ color: t.onSurface, fontWeight: sel ? "800" : "500" }}>{etichetta}</Text>
      </Pressable>
    );
  };

  return (
    <View testID="impronta-hash">
      <Text style={{ color: t.onSurfaceSecondary, fontSize: 13, marginBottom: SPACING.md }}>
        Calcola l&apos;impronta hash di uno o più file in base all&apos;algoritmo SHA256 (fino a un massimo di {MAX_FILE} file) e verifica la corrispondenza con un elenco di impronte. Non è possibile inserire due volte lo stesso file.
      </Text>

      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: SPACING.sm }}>
        {radio("calcolo", "CALCOLO")}
        {radio("verifica", "VERIFICA")}
      </View>

      {modo === "verifica" ? (
        <View style={{ marginBottom: SPACING.md }}>
          <Text style={{ color: t.onSurface, fontWeight: "700", fontSize: 14, marginBottom: 6 }}>Inserisci il testo contentente le impronte hash da verificare:</Text>
          <TextInput
            testID="hash-testo-verifica" accessibilityLabel="Testo contenente le impronte hash da verificare"
            value={stato.testoVerifica} onChangeText={(v) => setStato((s) => impostaTesto(s, v))}
            multiline numberOfLines={6} autoCapitalize="none" autoCorrect={false} selectTextOnFocus
            style={{ backgroundColor: t.surfaceSecondary, color: t.onSurface, borderColor: t.border, borderWidth: 1, borderRadius: RADIUS.md, padding: 10, minHeight: 120, textAlignVertical: "top" }}
          />
        </View>
      ) : null}

      <Pressable
        testID="hash-seleziona" accessibilityRole="button" accessibilityLabel="Seleziona i file" accessibilityHint="Apre la selezione dei file di cui calcolare l'impronta; i file restano sul telefono"
        accessibilityState={{ busy: occupato, disabled: occupato }} onPress={scegli} disabled={occupato}
        style={{ borderWidth: 2, borderStyle: "dashed", borderColor: t.brand, borderRadius: RADIUS.lg, paddingVertical: 28, paddingHorizontal: SPACING.md, alignItems: "center", opacity: occupato ? 0.6 : 1, marginBottom: SPACING.md }}
      >
        <Feather name="upload" size={22} color={t.brand} />
        <Text style={{ color: t.onSurface, fontWeight: "700", fontSize: 14, textAlign: "center", marginTop: 8 }}>Tocca per selezionare i file.</Text>
      </Pressable>

      {lavoro ? (
        <View testID="hash-progresso" accessibilityRole="progressbar" style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: SPACING.sm }}>
          <ActivityIndicator color={t.brand} />
          <Text style={{ color: t.onSurface }}>Elaborazione in corso… ( {lavoro.fatti}/{lavoro.totale} file elaborat{lavoro.fatti > 1 ? "i" : "o"} )</Text>
        </View>
      ) : null}
      {!lavoro && vista.messaggio ? <Text testID="hash-messaggio" style={{ color: t.success, fontSize: 15, marginBottom: SPACING.sm }}>{vista.messaggio}</Text> : null}
      {rimosso ? <Text testID="hash-rimosso" style={{ color: t.onSurfaceSecondary, fontSize: 13, marginBottom: SPACING.sm }}>{rimosso}</Text> : null}
      {avviso ? <Text testID="hash-avviso" style={{ color: t.error, marginBottom: SPACING.sm }}>{avviso}</Text> : null}
      {!lavoro && vista.errori.length ? (
        <View testID="hash-errori" accessibilityRole="alert" style={{ marginBottom: SPACING.sm }}>
          {vista.errori.map((e, i) => <Text key={i} style={{ color: t.error, marginBottom: 2 }}>{e}</Text>)}
        </View>
      ) : null}

      {stato.file.length ? (
        <View testID="hash-risultato" style={{ backgroundColor: t.surface, borderColor: t.border, borderWidth: 1, borderRadius: RADIUS.lg, padding: SPACING.sm }}>
          {stato.file.map((f, i) => {
            const esito = vista.esiti[i];
            const rimovibile = modo === "calcolo" || esito === false;
            return (
              <View key={f.hash + i} testID={`hash-file-${i}`} style={{ paddingVertical: SPACING.sm, borderBottomWidth: i < stato.file.length - 1 ? 1 : 0, borderBottomColor: t.divider }}>
                <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: esito === false ? t.error : t.onSurface }}>
                      File: <Text style={{ fontWeight: "800" }}>{f.nome}{esito === false ? ": nessuna corrispondenza!" : ""}</Text>
                    </Text>
                    <Text style={{ color: t.onSurface }}>Dimensioni: {f.dimensione} byte</Text>
                    <Text style={{ color: t.onSurface }}>Riferimento temporale: {riferimentoTemporale(f.modificato)}</Text>
                    <Text style={{ color: t.onSurface }}>Impronta Hash SHA256:</Text>
                    <Text selectable testID={`hash-valore-${i}`} style={{ color: t.onSurface, fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace", fontSize: 12 }}>{f.hash}</Text>
                  </View>
                  {esito === true ? <Feather name="check-circle" size={22} color={t.success} accessibilityLabel="Corrisponde" /> : null}
                  {rimovibile ? (
                    <Pressable testID={`hash-rimuovi-${i}`} accessibilityRole="button" accessibilityLabel={`Rimuovi il file ${f.nome} dalla lista`} onPress={() => togli(i)} hitSlop={8} style={{ marginLeft: 8, padding: 4 }}>
                      <Feather name="x-circle" size={22} color={esito === false ? t.error : t.onSurfaceTertiary} />
                    </Pressable>
                  ) : null}
                </View>
              </View>
            );
          })}
        </View>
      ) : null}

      {stato.file.length ? (
        <View>
          <View style={{ flexDirection: "row", gap: SPACING.sm, marginTop: SPACING.md }}>
            <Pressable testID="hash-copia" accessibilityRole="button" accessibilityLabel="Copia le impronte" onPress={() => copia(testoDaCopiare(stato.file), "Impronte copiate negli appunti.")} style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: t.brandSecondary, padding: 10, borderRadius: RADIUS.md }}>
              <Feather name="copy" size={16} color={t.onBrandSecondary} />
              <Text style={{ color: t.onBrandSecondary, fontWeight: "700" }}>Copia</Text>
            </Pressable>
            <Pressable testID="hash-nuovo-calcolo" accessibilityRole="button" accessibilityLabel="Nuovo Calcolo" accessibilityHint="Cancella tutto e si predispone per un nuovo calcolo" onPress={() => { setStato((s) => nuovoCalcolo(s)); setRimosso(null); setAvviso(null); }} style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: t.brand, padding: 10, borderRadius: RADIUS.md }}>
              <Text style={{ color: t.onBrand, fontWeight: "700" }}>Nuovo Calcolo</Text>
            </Pressable>
          </View>
          <EsportaDocumento
            testIDPrefix="hash"
            titolo="Calcolo Impronta Hash"
            datiInseriti={[["Operazione", modo === "calcolo" ? "Calcolo" : "Verifica"], ["Algoritmo", "SHA256"]]}
            risultato={stato.file.flatMap((f, i): [string, string][] => {
              const e = vista.esiti[i];
              return [...righeFile(f), ...(e === null ? [] : ([["Verifica", e ? "Corrisponde" : "Nessuna corrispondenza"]] as [string, string][]))];
            })}
            titoloRisultato="Impronte"
          />
        </View>
      ) : null}

      <View style={{ backgroundColor: t.surfaceTertiary, borderRadius: RADIUS.md, padding: SPACING.md, marginTop: SPACING.lg }}>
        <Text style={{ color: t.onSurfaceSecondary, fontSize: 12 }}>
          NOTA: durante l&apos;elaborazione i file non sono trasferiti su nessun server: sono elaborati direttamente sul telefono. Questo a garanzia della riservatezza dei tuoi documenti.
        </Text>
      </View>
    </View>
  );
}
