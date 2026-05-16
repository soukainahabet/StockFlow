import { useQuery } from "@tanstack/react-query";
import { Receipt } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Skeleton,
} from "@/components/ui";
import { formatCurrency, formatDateTime } from "@/utils/format";
import { ventesService } from "./ventesService";

interface Props {
  id: number | null;
  onClose: () => void;
}

export function VenteDetailModal({ id, onClose }: Props) {
  const query = useQuery({
    queryKey: ["vente", id],
    queryFn: () => ventesService.getById(id!),
    enabled: id !== null,
  });

  return (
    <Dialog open={id !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl p-0 gap-0">
        {query.isPending ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : !query.data ? (
          <div className="p-6 text-sm text-muted">Vente introuvable.</div>
        ) : (
          <article>
            {/* Header "facture" */}
            <header className="border-b border-default px-6 pt-6 pb-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className="flex h-7 w-7 items-center justify-center rounded-md bg-accent-soft text-accent-soft-fg"
                      aria-hidden="true"
                    >
                      <Receipt className="h-3.5 w-3.5" />
                    </span>
                    <DialogTitle className="text-base">
                      Vente #{query.data.id}
                    </DialogTitle>
                  </div>
                  <DialogDescription className="mt-1">
                    {formatDateTime(query.data.date)} · {query.data.userName}
                  </DialogDescription>
                </div>
              </div>
            </header>

            {/* Lignes */}
            <div className="px-6 py-5">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-default">
                    <th className="text-left text-xs font-medium text-muted pb-2">
                      Produit
                    </th>
                    <th className="text-right text-xs font-medium text-muted pb-2 w-16">
                      Qté
                    </th>
                    <th className="text-right text-xs font-medium text-muted pb-2 w-24">
                      P.U.
                    </th>
                    <th className="text-right text-xs font-medium text-muted pb-2 w-28">
                      Sous-total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {query.data.lignes.map((l) => (
                    <tr key={l.id} className="border-b border-default last:border-b-0">
                      <td className="py-2.5 text-primary">{l.productName}</td>
                      <td className="py-2.5 text-right tabular-nums text-secondary">
                        {l.quantite}
                      </td>
                      <td className="py-2.5 text-right tabular-nums text-secondary">
                        {formatCurrency(l.prixUnitaire)}
                      </td>
                      <td className="py-2.5 text-right tabular-nums font-medium text-primary">
                        {formatCurrency(l.sousTotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total */}
            <footer className="border-t border-default bg-surface-muted/40 px-6 py-4 flex items-end justify-between">
              <span className="text-xs uppercase tracking-wider text-muted">
                Total
              </span>
              <span className="text-2xl font-semibold text-primary tabular-nums leading-none">
                {formatCurrency(query.data.total)}
              </span>
            </footer>
          </article>
        )}
      </DialogContent>
    </Dialog>
  );
}
