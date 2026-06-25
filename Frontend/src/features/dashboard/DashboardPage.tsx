import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  Euro,
  Package,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ChartContainer,
  EmptyState,
  PageHeader,
  Skeleton,
  StatCard,
} from "@/components/ui";
import { useAuth } from "@/features/auth/AuthContext";
import { ventesService } from "@/features/ventes/ventesService";
import { cn } from "@/lib/cn";
import { dashboardService } from "@/services/dashboardService";
import type { ProductResponse, VenteResponse } from "@/types";
import { formatCurrency, formatDateTime } from "@/utils/format";

const tooltipStyle = {
  background: "rgb(var(--color-surface-elevated))",
  border: "1px solid rgb(var(--color-border-default))",
  borderRadius: 6,
  fontSize: 12,
  boxShadow:
    "0 8px 24px -6px rgba(0,0,0,0.10), 0 2px 6px -1px rgba(0,0,0,0.04)",
  padding: "6px 10px",
};
const tooltipLabelStyle = {
  color: "rgb(var(--color-text-muted))",
  fontSize: 11,
  marginBottom: 2,
};
const tooltipItemStyle = { color: "rgb(var(--color-text-primary))" };

function aggregateByDay(ventes: VenteResponse[]) {
  const map = new Map<string, { date: string; total: number; count: number }>();
  for (const v of ventes) {
    const d = new Date(v.date);
    if (Number.isNaN(d.getTime())) continue;
    const key = d.toISOString().slice(0, 10);
    const prev = map.get(key) ?? { date: key, total: 0, count: 0 };
    prev.total += Number(v.total);
    prev.count += 1;
    map.set(key, prev);
  }
  return Array.from(map.values()).sort((a, b) =>
    a.date.localeCompare(b.date),
  );
}

function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
  });
}

export function DashboardPage() {
  const { user } = useAuth();
  const firstName = user?.name?.split(" ")[0];

  const statsQuery = useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: dashboardService.getStats,
    // Stale very quickly so a sale or stock-mvt elsewhere refreshes the cards on focus.
    staleTime: 15_000,
  });
  const topProductsQuery = useQuery({
    queryKey: ["dashboard", "topProducts"],
    queryFn: () => dashboardService.getTopProducts(6),
  });
  const recentQuery = useQuery({
    queryKey: ["ventes", "recent", 30],
    queryFn: () => ventesService.recent(30),
  });

  const stats = statsQuery.data;
  const lowStock = stats?.lowStockProducts ?? [];
  const topProducts = topProductsQuery.data ?? [];
  const recent = recentQuery.data ?? [];

  const isStatsLoading = statsQuery.isPending;

  const dailySeries = useMemo(() => aggregateByDay(recent), [recent]);

  return (
    <div className="max-w-[1400px] mx-auto space-y-5">
      <PageHeader
        title={firstName ? `Bonjour ${firstName}` : "Tableau de bord"}
        description="Aperçu en temps réel de l'activité de votre stock."
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="CA du jour"
          value={formatCurrency(stats?.todayRevenue ?? 0)}
          icon={Euro}
          loading={isStatsLoading}
        />
        <StatCard
          label="CA 7 jours"
          value={formatCurrency(stats?.last7DaysRevenue ?? 0)}
          icon={CalendarDays}
          loading={isStatsLoading}
        />
        <StatCard
          label="CA 30 jours"
          value={formatCurrency(stats?.last30DaysRevenue ?? 0)}
          icon={TrendingUp}
          loading={isStatsLoading}
        />
        <StatCard
          label="Alertes stock"
          value={isStatsLoading ? "—" : String(stats?.lowStockCount ?? 0)}
          delta={
            (stats?.lowStockCount ?? 0) > 0
              ? {
                  value: stats?.lowStockCount ?? 0,
                  tone: "warning",
                  isPercent: false,
                  label: "produit(s) sous seuil",
                }
              : undefined
          }
          icon={AlertTriangle}
          loading={isStatsLoading}
        />
      </div>

      {/* Main chart + top products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-start justify-between">
            <div>
              <CardTitle>Chiffre d'affaires — 30 derniers jours</CardTitle>
              <p className="text-xs text-muted mt-0.5">
                Agrégé sur les ventes récentes
              </p>
            </div>
            {dailySeries.length > 0 && (
              <Badge variant="neutral" dot className="hidden sm:inline-flex">
                {dailySeries.length} jour(s)
              </Badge>
            )}
          </CardHeader>
          <CardContent>
            <ChartContainer
              height={300}
              loading={recentQuery.isPending}
              empty={!recentQuery.isPending && dailySeries.length === 0}
              emptyState="Aucune vente sur la période."
            >
              <LineChart
                data={dailySeries}
                margin={{ top: 8, right: 12, left: -8, bottom: 0 }}
              >
                <CartesianGrid
                  vertical={false}
                  stroke="rgb(var(--color-border-default))"
                  strokeDasharray="3 3"
                />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  stroke="rgb(var(--color-text-muted))"
                  tickFormatter={shortDate}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  stroke="rgb(var(--color-text-muted))"
                  width={56}
                  tickFormatter={(v) =>
                    v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)
                  }
                />
                <RTooltip
                  cursor={{
                    stroke: "rgb(var(--color-border-strong))",
                    strokeWidth: 1,
                  }}
                  contentStyle={tooltipStyle}
                  labelStyle={tooltipLabelStyle}
                  itemStyle={tooltipItemStyle}
                  labelFormatter={(label: string) => shortDate(label)}
                  formatter={(value: number) => [
                    formatCurrency(value),
                    "CA",
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="rgb(var(--color-accent))"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top produits vendus</CardTitle>
            <p className="text-xs text-muted">Quantité totale écoulée</p>
          </CardHeader>
          <CardContent>
            <ChartContainer
              height={300}
              loading={topProductsQuery.isPending}
              empty={!topProductsQuery.isPending && topProducts.length === 0}
              emptyState="Aucune vente enregistrée."
            >
              <BarChart
                data={topProducts.map((p) => ({
                  name: String(p.productName),
                  qty: Number(p.totalQuantity),
                }))}
                layout="vertical"
                margin={{ top: 4, right: 12, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  horizontal={false}
                  stroke="rgb(var(--color-border-default))"
                  strokeDasharray="3 3"
                />
                <XAxis
                  type="number"
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  stroke="rgb(var(--color-text-muted))"
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  stroke="rgb(var(--color-text-muted))"
                  width={90}
                />
                <RTooltip
                  cursor={{ fill: "rgb(var(--color-surface-muted))" }}
                  contentStyle={tooltipStyle}
                  labelStyle={tooltipLabelStyle}
                  itemStyle={tooltipItemStyle}
                  formatter={(value: number) => [value, "Quantité"]}
                />
                <Bar
                  dataKey="qty"
                  fill="rgb(var(--color-accent))"
                  radius={[0, 3, 3, 0]}
                  barSize={14}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent sales + Low stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Dernières ventes</CardTitle>
            <Link
              to="/ventes"
              className="text-xs font-medium text-accent hover:underline inline-flex items-center gap-0.5"
            >
              Tout voir
              <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <RecentVentesList
            ventes={recent.slice(0, 5)}
            loading={recentQuery.isPending}
          />
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Stock faible</CardTitle>
            <Link
              to="/products"
              className="text-xs font-medium text-accent hover:underline inline-flex items-center gap-0.5"
            >
              Voir le catalogue
              <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <LowStockList
            products={lowStock.slice(0, 6)}
            loading={isStatsLoading}
          />
        </Card>
      </div>
    </div>
  );
}

function RecentVentesList({
  ventes,
  loading,
}: {
  ventes: VenteResponse[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <ul className="divide-y divide-default">
        {Array.from({ length: 5 }).map((_, i) => (
          <li key={i} className="flex items-center gap-3 px-4 py-2.5">
            <Skeleton className="h-7 w-7 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-2.5 w-20" />
            </div>
            <Skeleton className="h-3 w-16" />
          </li>
        ))}
      </ul>
    );
  }
  if (ventes.length === 0) {
    return (
      <EmptyState
        size="sm"
        icon={ShoppingCart}
        title="Aucune vente"
        description="Les ventes récentes apparaîtront ici."
      />
    );
  }
  return (
    <ul className="divide-y divide-default">
      {ventes.map((v) => (
        <li key={v.id}>
          <Link
            to={`/ventes`}
            className={cn(
              "flex items-center gap-3 px-4 py-2.5 transition-colors",
              "hover:bg-surface-muted/50",
            )}
          >
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-soft-fg text-[11px] font-semibold"
              aria-hidden="true"
            >
              #{v.id}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-primary truncate">{v.userName}</p>
              <p className="text-xs text-muted">{formatDateTime(v.date)}</p>
            </div>
            <span className="text-sm font-medium text-primary tabular-nums">
              {formatCurrency(v.total)}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function LowStockList({
  products,
  loading,
}: {
  products: ProductResponse[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <ul className="divide-y divide-default">
        {Array.from({ length: 6 }).map((_, i) => (
          <li key={i} className="flex items-center gap-3 px-4 py-2.5">
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3 w-40" />
              <Skeleton className="h-2.5 w-24" />
            </div>
            <Skeleton className="h-5 w-12" />
          </li>
        ))}
      </ul>
    );
  }
  if (products.length === 0) {
    return (
      <EmptyState
        size="sm"
        icon={Package}
        title="Stocks au-dessus du seuil"
        description="Aucune alerte en cours."
      />
    );
  }
  return (
    <ul className="divide-y divide-default">
      {products.map((p) => {
        const isOut = p.quantity === 0;
        return (
          <li key={p.id}>
            <Link
              to={`/products/${p.id}`}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 transition-colors",
                "hover:bg-surface-muted/50",
              )}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm text-primary truncate">{p.name}</p>
                <p className="text-xs text-muted truncate">
                  {p.categoryName} · seuil {p.alertThreshold}
                </p>
              </div>
              <Badge variant={isOut ? "danger" : "warning"} dot>
                {p.quantity}
              </Badge>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
