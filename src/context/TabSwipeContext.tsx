import React from "react";

// Permette alle schermate delle tab principali (Home, Clienti, Archivio) di
// disattivare temporaneamente lo swipe orizzontale per cambiare tab (vedi
// (tabs)/_layout.tsx) quando aprono un proprio overlay a schermo intero
// gestito con SwipeBackScreen (es. "Nuova pratica"): altrimenti le due
// gesture, entrambe orizzontali, si scontrerebbero sulla stessa swipe.
// Non serve per i Modal nativi di RN (es. "Nuovo cliente" in Clienti): quelli
// catturano gia' da soli tutti i tocchi, la gesture sotto non li riceve.
type Ctx = { disabled: boolean; setDisabled: (v: boolean) => void };

const TabSwipeContext = React.createContext<Ctx>({ disabled: false, setDisabled: () => {} });

export function TabSwipeProvider({ children }: { children: React.ReactNode }) {
  const [disabled, setDisabled] = React.useState(false);
  return <TabSwipeContext.Provider value={{ disabled, setDisabled }}>{children}</TabSwipeContext.Provider>;
}

export function useTabSwipeState() {
  return React.useContext(TabSwipeContext);
}

// Da chiamare nelle schermate delle tab con un proprio overlay locale:
// useDisableTabSwipeWhile(showNewPratica).
export function useDisableTabSwipeWhile(active: boolean) {
  const { setDisabled } = React.useContext(TabSwipeContext);
  React.useEffect(() => {
    if (!active) return;
    setDisabled(true);
    return () => setDisabled(false);
  }, [active, setDisabled]);
}
