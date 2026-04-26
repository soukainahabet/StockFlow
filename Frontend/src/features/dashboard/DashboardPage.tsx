import { useQuery } from "@tanstack/react-query";
import {
  TrendingUp,
  Package,
  AlertTriangle,
  ShoppingCart,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";
import { dashboardService } from "@/services/dashboardService";
import { ventesService } from "@/features/ventes/ventesService";
import { PageHeader } from "@/components/ui/PageHeader";
import { Spinner } from "@/components/ui/Spinner";
import { formatCurrency, formatDateTime } from "@/utils/format";
import { useAuth } from "@/features/auth/AuthContext";

interface KpiCardProps {
  title: string;
  value: string;
  hint?: string;
  icon: typeof TrendingUp;
  tone?: "primary" | "success" | "warning" | "info";
}

function KpiCard({ title, value, hint, icon: Icon, tone = "primary" }: KpiCardProps) {
  const tones = {
    primary: "bg-primary-50 text-primary-700",
    success: "bg-green-50 text-green-700",
    warning: "bg-amber-50 text-amber-700",
    info: "bg-blue-50 text-blue-700",
  };
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-secondary-500">{title}</p>
          <p className="mt-2 text-2xl font-bold text-secondary-900 tracking-tight">{value}</p>
          {hint && <p className="text-xs text-secondary-500 mt-1">{hint}</p>}
        </div>
        <div className={`rounded-lg p-2.5 ${tones[tone]}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const totalsQuery = useQuery({
    queryKey: ["dashboard", "totals"],
    queryFn: dashboardService.getTotals,
  });
  const lowStockQuery = useQuery({
    queryKey: ["dashboard", "lowStock"],
    queryFn: dashboardService.getLowStock,
  });
  const topProductsQuery = useQuery({
    queryKey: ["dashboard", "topProducts"],
    queryFn: () => dashboardService.getTopProducts(8),
  });
  const recentQuery = useQuery({
    queryKey: ["ventes", "recent"],
    queryFn: () => ventesService.recent(7),
  });

  const totals = totalsQuery.data;
  const lowStock = lowStockQuery.data ?? [];
  const topProducts = (topProductsQuery.data ?? []).map((p) => ({
    name: String(p.productName ?? p.name ?? "—"),
    qty: Number(p.totalQuantity ?? p.qty ?? 0),
  }));
  const recent = recentQuery.data ?? [];

  const recentChart = [...recent]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((v) => ({
      label: new Date(v.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }),
      total: Number(v.total),
    }));

  const isLoading =
    totalsQuery.isPending || lowStockQuery.isPending || topProductsQuery.isPending || recentQuery.isPending;

  return (
    <>
      <PageHeader
        title={`Bonjour ${user?.name?.split(" ")[0] ?? ""} 👋`}
        subtitle="Aperçu en temps réel de l'activité de votre stock."
      />

      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              title="Ventes aujourd'hui"
              value={formatCurrency(totals?.today ?? 0)}
              hint={`${totals?.count ?? 0} transactions au total`}
              icon={TrendingUp}
              tone="primary"
            />
            <KpiCard
              title="Ventes (7 jours)"
              value={formatCurrency(totals?.week ?? 0)}
              icon={ShoppingCart}
              tone="info"
            />
            <KpiCard
              title="Ventes (30 jours)"
              value={formatCurrency(totals?.month ?? 0)}
              icon={TrendingUp}
              tone="success"
            />
            <KpiCard
              title="Produits en alerte"
              value={String(lowStock.length)}
              hint="quantité ≤ seuil"
              icon={AlertTriangle}
              tone="warning"
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mt-6">
            <div className="card p-5 xl:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-semibold text-secondary-900">Top produits vendus</h3>
                  <p className="text-xs text-secondary-500">Quantité totale écoulée</p>
                </div>
              </div>
              {topProducts.length === 0 ? (
                <p className="text-sm text-secondary-500 py-10 text-center">Aucune donnée pour le moment.</p>
              ) : (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topProducts} margin={{ top: 8, right: 8, bottom: 8, left: -16 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="name" tick={{ fill: "#64748B", fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={60} />
                      <YAxis tick={{ fill: "#64748B", fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{ borderRadius: 8, borderColor: "#E2E8F0", fontSize: 12 }}
                        formatter={(v) => [String(v), "Quantité"]}
                      />
                      <Bar dataKey="qty" fill="#2563EB" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-semibold text-secondary-900">Tendance des ventes</h3>
                  <p className="text-xs text-secondary-500">Sur les 7 dernières ventes</p>
                </div>
              </div>
              {recentChart.length === 0 ? (
                <p className="text-sm text-secondary-500 py-10 text-center">Aucune vente.</p>
              ) : (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={recentChart} margin={{ top: 8, right: 8, bottom: 8, left: -16 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="label" tick={{ fill: "#64748B", fontSize: 11 }} />
                      <YAxis tick={{ fill: "#64748B", fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{ borderRadius: 8, borderColor: "#E2E8F0", fontSize: 12 }}
                        formatter={(v) => [formatCurrency(Number(v)), "Total"]}
                      />
                      <Line type="monotone" dataKey="total" stroke="#22C55E" strokeWidth={2.5} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-6">
            <div className="card overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-secondary-100">
                <h3 className="text-base font-semibold text-secondary-900">Ventes récentes</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="table-th">#</th>
                      <th className="table-th">Date</th>
                      <th className="table-th">Vendeur</th>
                      <th className="table-th text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent.length === 0 ? (
                      <tr><td colSpan={4} className="px-4 py-10 text-center text-sm text-secondary-500">Aucune vente.</td></tr>
                    ) : recent.map((v) => (
                      <tr key={v.id} className="hover:bg-secondary-50/50">
                        <td className="table-td font-medium">#{v.id}</td>
                        <td className="table-td">{formatDateTime(v.date)}</td>
                        <td className="table-td">{v.userName}</td>
                        <td className="table-td text-right font-semibold">{formatCurrency(v.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-secondary-100">
                <h3 className="text-base font-semibold text-secondary-900">Stock faible</h3>
                <Package size={18} className="text-secondary-400" />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="table-th">Produit</th>
                      <th className="table-th">Catégorie</th>
                      <th className="table-th text-right">Qté</th>
                      <th className="table-th text-right">Seuil</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStock.length === 0 ? (
                      <tr><td colSpan={4} className="px-4 py-10 text-center text-sm text-secondary-500">Tous les stocks sont au-dessus du seuil ✅</td></tr>
                    ) : lowStock.slice(0, 8).map((p) => (
                      <tr key={p.id} className="hover:bg-secondary-50/50">
                        <td className="table-td font-medium">{p.name}</td>
                        <td className="table-td">{p.categoryName}</td>
                        <td className="table-td text-right">
                          <span className="badge-error">{p.quantity}</span>
                        </td>
                        <td className="table-td text-right text-secondary-500">{p.alertThreshold}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
