import { useEffect, useState } from "react";

/**
 * Renvoie `value` après un délai stable de `delayMs` ms.
 * Idéal pour brancher une recherche : on tape vite, le serveur n'est interrogé
 * qu'une fois la frappe terminée.
 */
export function useDebouncedValue<T>(value: T, delayMs = 250): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(t);
  }, [value, delayMs]);

  return debounced;
}
