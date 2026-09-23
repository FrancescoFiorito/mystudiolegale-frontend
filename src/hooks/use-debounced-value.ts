import { useEffect, useState } from "react";

// Ritarda la propagazione di un valore (tipicamente il testo di una ricerca)
// di `delayMs`, cosi' che un digitare veloce non generi una richiesta di rete
// per ogni singolo carattere.
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
