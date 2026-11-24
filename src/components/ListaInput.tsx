import React from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "@/src/ThemeContext";
import { SPACING, RADIUS } from "@/src/theme";
import DataInput from "@/src/components/DataInput";
import SelectInput from "@/src/components/SelectInput";

export type CampoRigaLista = (
  | { tipo: "numero"; key: string; label: string; default?: string }
  | { tipo: "testo"; key: string; label: string; default?: string }
  | { tipo: "data"; key: string; label: string; default?: string }
  // Testo su più righe.
  | { tipo: "testoLungo"; key: string; label: string; default?: string }
  // Casella da spuntare: il valore è "true" (spuntata) oppure "" (non spuntata).
  | { tipo: "bool"; key: string; label: string; default?: string }
  // Pulsante che compila altri campi della riga (es. scegliere un file e ricavarne nome e impronta):
  // `esegui` restituisce i valori da unire alla riga, oppure null se l'utente annulla.
  | { tipo: "azione"; key: string; label: string; esegui: (riga: Record<string, string>) => Promise<Record<string, string> | null> }
  | { tipo: "scelta"; key: string; label: string; opzioni: { value: string; label: string }[] | ((form: Record<string, any>) => { value: string; label: string }[]); default?: string }
) & {
  // Se presente, il campo compare solo quando la funzione (che riceve la riga) restituisce true.
  mostraSe?: (riga: Record<string, string>, form: Record<string, any>) => boolean;
  // Come inviare il valore al server (usato dai modelli di atti): testo così com'è, numero decimale o intero.
  invio?: "stringa" | "numero" | "intero";
  // Se presente, il campo non viene inviato quando è vuoto.
  omettiSeVuoto?: boolean;
  // Se presente, il campo è segnalato come obbligatorio nell'etichetta.
  obbligatorio?: boolean;
  // Se presente, sotto il campo compare questo testo (es. l'intervallo ammesso per un importo).
  nota?: (riga: Record<string, string>, form: Record<string, any>) => string | null;
};

export function rigaVuota(campiRiga: CampoRigaLista[]): Record<string, string> {
  const riga: Record<string, string> = {};
  campiRiga.forEach((c) => {
    if (c.tipo === "azione") return;
    riga[c.key] = c.default ?? (c.tipo === "scelta" && typeof c.opzioni !== "function" ? c.opzioni[0]?.value ?? "" : "");
  });
  return riga;
}

// Elenco di righe ripetibili (aggiungi/rimuovi), ciascuna con gli stessi
// campi (numero, data o scelta): usato per i calcolatori il cui backend si
// aspetta una lista di oggetti (es. acconti versati nel tempo, periodi di
// credito pena) invece di un singolo valore — stesso pattern visivo già
// usato per le parti assistite delle parcelle (riquadro con cestino per
// riga, "+ aggiungi" sotto), qui reso generico per qualunque forma di riga.
export default function ListaInput({
  value, onChange, campiRiga, testID, etichettaAggiungi = "Aggiungi una voce", form, max, nomeVoce = "voce",
}: {
  value: Record<string, string>[];
  onChange: (v: Record<string, string>[]) => void;
  campiRiga: CampoRigaLista[];
  testID?: string;
  etichettaAggiungi?: string;
  // Stato del form che contiene la lista: serve alle opzioni dinamiche (funzione) di un campo "scelta".
  form?: Record<string, any>;
  // Numero massimo di righe: raggiunto, "aggiungi" sparisce.
  max?: number;
  // Come chiamare una riga nelle etichette per VoiceOver (es. "parte", "allegato").
  nomeVoce?: string;
}) {
  const { t } = useTheme();

  const aggiorna = (indice: number, key: string, v: string) => {
    onChange(value.map((riga, i) => (i === indice ? { ...riga, [key]: v } : riga)));
  };
  const rimuovi = (indice: number) => onChange(value.filter((_, i) => i !== indice));
  const aggiungi = () => onChange([...value, rigaVuota(campiRiga)]);

  return (
    <View>
      {value.map((riga, indice) => (
        <View key={indice} style={{ marginTop: indice === 0 ? 0 : SPACING.sm, padding: SPACING.md, borderRadius: RADIUS.md, backgroundColor: t.surfaceSecondary }}>
          <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
            <Pressable testID={testID ? `${testID}-rimuovi-${indice}` : undefined} onPress={() => rimuovi(indice)} accessibilityRole="button" accessibilityLabel={`Rimuovi ${nomeVoce} ${indice + 1}`} style={{ padding: 4 }}>
              <Feather name="trash-2" size={16} color={t.onSurfaceTertiary} />
            </Pressable>
          </View>
          {campiRiga.filter((c) => !c.mostraSe || c.mostraSe(riga, form || {})).map((c) => {
            const id = testID ? `${testID}-${indice}-${c.key}` : undefined;
            const etichetta = `${c.label}${"obbligatorio" in c && c.obbligatorio ? " *" : ""}`;
            if (c.tipo === "bool") {
              const spuntata = !!riga[c.key];
              return (
                <Pressable key={c.key} testID={id} accessibilityRole="checkbox" accessibilityLabel={`${c.label}, ${nomeVoce} ${indice + 1}`} accessibilityState={{ checked: spuntata }}
                  onPress={() => aggiorna(indice, c.key, spuntata ? "" : "true")} style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: SPACING.sm, minHeight: 32 }}>
                  <View style={{ width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: t.brand, backgroundColor: spuntata ? t.brand : "transparent", alignItems: "center", justifyContent: "center" }}>
                    {spuntata ? <Feather name="check" size={14} color={t.onBrand} /> : null}
                  </View>
                  <Text style={{ color: t.onSurface, flex: 1, fontSize: 14 }}>{c.label}</Text>
                </Pressable>
              );
            }
            if (c.tipo === "azione") {
              return (
                <Pressable key={c.key} testID={id} accessibilityRole="button" accessibilityLabel={`${c.label}, ${nomeVoce} ${indice + 1}`}
                  onPress={async () => { const r = await c.esegui(riga); if (r) onChange(value.map((x, i) => (i === indice ? { ...x, ...r } : x))); }}
                  style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: SPACING.sm }}>
                  <Feather name="file-plus" size={16} color={t.brand} />
                  <Text style={{ color: t.brand, fontWeight: "700", fontSize: 13 }}>{c.label}</Text>
                </Pressable>
              );
            }
            return (
              <View key={c.key} style={{ marginTop: SPACING.xs }}>
                <Text style={{ fontSize: 11, fontWeight: "600", color: t.onSurfaceSecondary, marginBottom: 4 }}>{etichetta}</Text>
                {c.tipo === "data" ? (
                  <DataInput testID={id} accessibilityLabel={c.label} value={riga[c.key] || ""} onChange={(v) => aggiorna(indice, c.key, v)} />
                ) : c.tipo === "scelta" ? (
                  <SelectInput testID={id} accessibilityLabel={c.label} value={riga[c.key] || ""} onChange={(v) => aggiorna(indice, c.key, v)} opzioni={typeof c.opzioni === "function" ? c.opzioni(form || {}) : c.opzioni} />
                ) : (
                  <TextInput
                    testID={id}
                    accessibilityLabel={etichetta}
                    value={riga[c.key] ?? ""}
                    onChangeText={(v) => aggiorna(indice, c.key, v)}
                    keyboardType={c.tipo === "numero" ? "numeric" : "default"}
                    multiline={c.tipo === "testoLungo"}
                    style={{
                      borderWidth: 1, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
                      backgroundColor: t.surface, color: t.onSurface, borderColor: t.border, fontSize: 14,
                      ...(c.tipo === "testoLungo" ? { minHeight: 70, textAlignVertical: "top" as const } : null),
                    }}
                  />
                )}
                {c.nota?.(riga, form || {}) ? (
                  <Text testID={testID ? `${testID}-${indice}-${c.key}-nota` : undefined} style={{ fontSize: 11, color: t.onSurfaceSecondary, marginTop: 4 }}>{c.nota(riga, form || {})}</Text>
                ) : null}
              </View>
            );
          })}
        </View>
      ))}
      {max !== undefined && value.length >= max ? null : <Pressable testID={testID ? `${testID}-aggiungi` : undefined} accessibilityRole="button" onPress={aggiungi} style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: SPACING.sm }}>
        <Feather name="plus-circle" size={16} color={t.brand} />
        <Text style={{ color: t.brand, fontWeight: "700", fontSize: 13 }}>{etichettaAggiungi}</Text>
      </Pressable>}
    </View>
  );
}
