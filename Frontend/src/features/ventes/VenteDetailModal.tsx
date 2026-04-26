import { useQuery } from "@tanstack/react-query";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { ventesService } from "./ventesService";
import { formatCurrency, formatDateTime } from "@/utils/format";

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
    <Modal
      open={id !== null}
      onClose={onClose}
      title={`Vente #${id ?? ""}`}
      size="lg"
      footer={<button className="btn-secondary" onClick={onClose}>Fermer</button>}
    >
      {query.isPending ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : !query.data ? (
        <p className="text-sm text-secondary-500">Vente introuvable.</p>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-secondary-500">Date</p>
              <p className="font-medium">{formatDateTime(query.data.date)}</p>
            </div>
            <div>
              <p className="text-secondary-500">Vendeur</p>
              <p className="font-medium">{query.data.userName}</p>
            </div>
          </div>
          <div className="border border-secondary-100 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-th">Produit</th>
                  <th className="table-th text-right">Qté</th>
                  <th className="table-th text-right">P.U.</th>
                  <th className="table-th text-right">Sous-total</th>
                </tr>
              </thead>
              <tbody>
                {query.data.lignes.map((l) => (
                  <tr key={l.id}>
                    <td className="table-td">{l.productName}</td>
                    <td className="table-td text-right">{l.quantite}</td>
                    <td className="table-td text-right">{formatCurrency(l.prixUnitaire)}</td>
                    <td className="table-td text-right font-semibold">{formatCurrency(l.sousTotal)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-secondary-50">
                  <td className="px-4 py-3 font-bold" colSpan={3}>Total</td>
                  <td className="px-4 py-3 text-right font-bold text-primary">
                    {formatCurrency(query.data.total)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </Modal>
  );
}
