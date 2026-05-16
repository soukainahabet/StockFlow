import { Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

interface SearchInputProps {
  /** Valeur initiale (uncontrolled). Pour réinitialiser, changez la `key`. */
  defaultValue?: string;
  /** Déclenché après le debounce (chaque pause de frappe). */
  onSearch: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
  /** Auto-focus à l'apparition. */
  autoFocus?: boolean;
}

export function SearchInput({
  defaultValue = "",
  onSearch,
  placeholder = "Rechercher…",
  debounceMs = 250,
  className,
  autoFocus,
}: SearchInputProps) {
  const [value, setValue] = useState(defaultValue);
  const inputRef = useRef<HTMLInputElement>(null);
  // Conserve onSearch dans une ref pour ne pas relancer le debounce
  // quand le parent passe une nouvelle référence à chaque render.
  const onSearchRef = useRef(onSearch);
  useEffect(() => {
    onSearchRef.current = onSearch;
  }, [onSearch]);

  useEffect(() => {
    const t = window.setTimeout(() => onSearchRef.current(value), debounceMs);
    return () => window.clearTimeout(t);
  }, [value, debounceMs]);

  const clear = () => {
    setValue("");
    inputRef.current?.focus();
  };

  return (
    <div className={cn("relative", className)}>
      <Search
        className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted"
        aria-hidden="true"
      />
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className={cn(
          "flex h-9 w-full rounded-md border border-default bg-surface pl-8 pr-8 text-sm text-primary",
          "placeholder:text-muted",
          "transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring focus-visible:ring-offset-1 focus-visible:ring-offset-app focus-visible:border-accent",
          // Masquer le bouton clear natif Webkit/Edge
          "[&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden",
        )}
      />
      {value && (
        <button
          type="button"
          onClick={clear}
          aria-label="Effacer la recherche"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-0.5 text-muted hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
