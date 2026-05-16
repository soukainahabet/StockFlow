import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/cn";

/**
 * Stub de la palette de commandes (Cmd+K). Visuel et raccourci câblés
 * dès maintenant ; la recherche réelle sera implémentée plus tard.
 */
export function SearchPalette() {
  const [open, setOpen] = useState(false);

  // Cmd/Ctrl+K → open
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      // "/" focus la palette si on n'est pas déjà dans un input
      if (e.key === "/" && !open) {
        const active = document.activeElement;
        const isEditing =
          active instanceof HTMLInputElement ||
          active instanceof HTMLTextAreaElement ||
          (active instanceof HTMLElement && active.isContentEditable);
        if (!isEditing) {
          e.preventDefault();
          setOpen(true);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <SearchTrigger onClick={() => setOpen(true)} />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl p-0 gap-0">
          <div className="flex items-center gap-2 border-b border-default px-3 py-2">
            <Search
              className="h-4 w-4 text-muted shrink-0"
              aria-hidden="true"
            />
            <Input
              autoFocus
              placeholder="Rechercher des produits, ventes, utilisateurs…"
              className="border-0 shadow-none h-auto px-0 py-1 focus-visible:ring-0 focus-visible:border-0"
            />
            <kbd className="ml-auto inline-flex items-center rounded border border-default bg-surface-muted px-1.5 py-0.5 text-[10px] font-mono text-muted">
              Esc
            </kbd>
          </div>
          <div className="px-4 py-10 text-center">
            <DialogTitle className="text-sm font-medium text-primary">
              Recherche globale
            </DialogTitle>
            <DialogDescription className="mt-1">
              Bientôt disponible — produits, ventes et utilisateurs seront
              indexés ici.
            </DialogDescription>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function SearchTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 h-8 rounded-md border border-default bg-surface px-2.5 text-sm text-muted",
        "hover:border-strong hover:text-secondary transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring focus-visible:ring-offset-1 focus-visible:ring-offset-app",
        "w-full max-w-xs",
      )}
      aria-label="Ouvrir la recherche globale"
    >
      <Search className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span className="hidden sm:inline">Rechercher…</span>
      <kbd className="ml-auto hidden sm:inline-flex items-center gap-0.5 rounded border border-default bg-surface-muted px-1 py-px text-[10px] font-mono">
        <span>⌘</span>K
      </kbd>
    </button>
  );
}
