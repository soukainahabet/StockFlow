import { useQuery } from "@tanstack/react-query";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Coins,
  Download,
  Minus,
  Receipt,
  TrendingUp,
  Trophy,
} from "lucide-react";
import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
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
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ChartContainer,
  EmptyState,
  Input,
  Label,
  PageHeader,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  StatCard,
} from "@/components/ui";
import { stockService } from "@/features/stock/stockService";
import { ventesService } from "@/features/ventes/ventesService";
import { cn } from "@/lib/cn";
import { analyticsService } from "@/services/analyticsService";
import { dashboardService } from "@/services/dashboardService";
import type {
  ProfitProductDto,
  StockMovementResponse,
  VenteResponse,
} from "@/types";
import { formatCurrency, formatDate, formatNumber } from "@/utils/format";

type Preset = "today" | "7d" | "30d" | "90d" | "custom";

const VALID_PRESETS: Preset[] = ["today", "7d", "30d", "90d", "custom"];

interface Range {
  start: Date;
  end: Date;
  startIso: string;
  endIso: string;
}

// ---------- Date helpers ----------

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** ISO local sans timezone — format attendu par le backend (LocalDateTime). */
function localIso(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function buildRange(preset: Preset, customStart: string, customEnd: string): Range {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  let start = new Date(now);

  switch (preset) {
    case "today":
      start.setHours(0, 0, 0, 0);
      break;
    case "7d":
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      break;
    case "30d":
      start.setDate(start.getDate() - 29);
      start.setHours(0, 0, 0, 0);
      break;
    case "90d":
      start.setDate(start.getDate() - 89);
      start.setHours(0, 0, 0, 0);
      break;
    case "custom":
      if (customStart) {
        start = new Date(`${customStart}T00:00:00`);
      } else {
        start.setDate(start.getDate() - 29);
        start.setHours(0, 0, 0, 0);
      }
      if (customEnd) {
        end.setTime(new Date(`${customEnd}T23:59:59`).getTime());
      }
      break;
  }

  return { start, end, startIso: localIso(start), endIso: localIso(end) };
}

function previousRange(range: Range): Range {
  const durationMs = range.end.getTime() - range.start.getTime();
  const prevEnd = new Date(range.start.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - durationMs);
  return {
    start: prevStart,
    end: prevEnd,
    startIso: localIso(prevStart),
    endIso: localIso(prevEnd),
  };
}

// ---------- Aggregations ----------

function aggregateRevenue(ventes: VenteResponse[]): number {
  return ventes.reduce((sum, v) => sum + Number(v.total), 0);
}

function aggregateByDay(
  ventes: VenteResponse[],
): { date: string; total: number; count: number }[] {
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

function topSellers(
  ventes: VenteResponse[],
  topN = 5,
): { name: string; revenue: number; count: number }[] {
  const map = new Map<string, { name: string; revenue: number; count: number }>();
  for (const v of ventes) {
    const prev = map.get(v.userName) ?? {
      name: v.userName,
      revenue: 0,
      count: 0,
    };
    prev.revenue += Number(v.total);
    prev.count += 1;
    map.set(v.userName, prev);
  }
  return Array.from(map.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, topN);
}

function aggregateStock(movements: StockMovementResponse[]) {
  let inCount = 0;
  let outCount = 0;
  let inQty = 0;
  let outQty = 0;
  for (const m of movements) {
    if (m.type === "IN") {
      inCount += 1;
      inQty += m.quantity;
    } else {
      outCount += 1;
      outQty += m.quantity;
    }
  }
  return { inCount, outCount, inQty, outQty };
}

function percentDelta(current: number, previous: number): number {
  if (previous === 0) return current === 0 ? 0 : 100;
  return ((current - previous) / previous) * 100;
}

// ---------- CSV export ----------

function csvEscape(s: string): string {
  return `"${s.replace(/"/g, '""')}"`;
}

function ventesToCsv(rows: VenteResponse[]): string {
  const headers = ["id", "date", "vendeur", "lignes", "total"];
  const lines = [headers.join(",")];
  for (const v of rows) {
    lines.push(
      [
        v.id,
        csvEscape(v.date),
        csvEscape(v.userName),
        v.lignes?.length ?? 0,
        Number(v.total).toFixed(2),
      ].join(","),
    );
  }
  return "﻿" + lines.join("\r\n"); // BOM utf-8 pour Excel
}

function downloadCsv(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ---------- Recharts tooltip style ----------

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

const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
  });

// ---------- Component ----------

export function ReportsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const presetRaw = searchParams.get("preset");
  const preset: Preset = VALID_PRESETS.includes(presetRaw as Preset)
    ? (presetRaw as Preset)
    : "30d";
  const customStart = searchParams.get("from") ?? "";
  const customEnd = searchParams.get("to") ?? "";

  const range = useMemo(
    () => buildRange(preset, customStart, customEnd),
    [preset, customStart, customEnd],
  );
  const prev = useMemo(() => previousRange(range), [range]);

  const currentQ = useQuery({
    queryKey: ["reports", "ventes", range.startIso, range.endIso],
    queryFn: () =>
      ventesService.list({
        startDate: range.startIso,
        endDate: range.endIso,
        size: 1000,
      }),
  });
  const prevQ = useQuery({
    queryKey: ["reports", "ventes", prev.startIso, prev.endIso],
    queryFn: () =>
      ventesService.list({
        startDate: prev.startIso,
        endDate: prev.endIso,
        size: 1000,
      }),
  });
  const stockQ = useQuery({
    queryKey: ["reports", "stock", range.startIso, range.endIso],
    queryFn: () =>
      stockService.list({
        startDate: range.startIso,
        endDate: range.endIso,
        size: 1000,
      }),
  });
  const lowStockQ = useQuery({
    queryKey: ["dashboard", "lowStock"],
    queryFn: dashboardService.getLowStock,
  });
  // BI : analytics tous temps (indépendant du période sélectionnée)
  const topProductsQ = useQuery({
    queryKey: ["analytics", "top-products", 8],
    queryFn: () => analyticsService.topProducts(8),
  });
  const profitQ = useQuery({
    queryKey: ["analytics", "profit-products", 10],
    queryFn: () => analyticsService.profitProducts(10),
  });

  const currentVentes = currentQ.data?.content ?? [];
  const prevVentes = prevQ.data?.content ?? [];
  const stockMovs = stockQ.data?.content ?? [];

  const currentRevenue = useMemo(
    () => aggregateRevenue(currentVentes),
    [currentVentes],
  );
  const prevRevenue = useMemo(
    () => aggregateRevenue(prevVentes),
    [prevVentes],
  );
  const currentCount = currentVentes.length;
  const prevCount = prevVentes.length;
  const avgTicket = currentCount > 0 ? currentRevenue / currentCount : 0;
  const prevAvgTicket = prevCount > 0 ? prevRevenue / prevCount : 0;

  const dailySeries = useMemo(
    () => aggregateByDay(currentVentes),
    [currentVentes],
  );
  const productsTop = topProductsQ.data ?? [];
  const sellersTop = useMemo(() => topSellers(currentVentes, 5), [currentVentes]);
  const stockAgg = useMemo(() => aggregateStock(stockMovs), [stockMovs]);
  const profitSummary = profitQ.data;

  const net = stockAgg.inQty - stockAgg.outQty;
  const isLoading = currentQ.isPending || prevQ.isPending;

  const updateParam = (patch: Record<string, string | undefined>) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const [k, v] of Object.entries(patch)) {
          if (v === undefined || v === "") next.delete(k);
          else next.set(k, v);
        }
        return next;
      },
      { replace: true },
    );
  };

  const handleExport = () => {
    const csv = ventesToCsv(currentVentes);
    const stamp = new Date().toISOString().slice(0, 10);
    downloadCsv(csv, `stockflow-ventes-${stamp}.csv`);
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-5">
      <PageHeader
        title="Rapports d'activité"
        description={
          <>
            Du <strong className="text-secondary">{formatDate(range.startIso)}</strong>{" "}
            au <strong className="text-secondary">{formatDate(range.endIso)}</strong>
            <span className="text-disabled mx-2">·</span>
            comparé à {formatDate(prev.startIso)} – {formatDate(prev.endIso)}
          </>
        }
        actions={
          <Button
            variant="secondary"
            onClick={handleExport}
            disabled={currentVentes.length === 0}
          >
            <Download className="h-3.5 w-3.5" />
            Exporter CSV
          </Button>
        }
      />

      {/* Period selector */}
      <div className="flex items-center gap-2 flex-wrap">
        <Select
          value={preset}
          onValueChange={(v) =>
            updateParam({
              preset: v,
              from: v === "custom" ? customStart || undefined : undefined,
              to: v === "custom" ? customEnd || undefined : undefined,
            })
          }
        >
          <SelectTrigger className="w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Aujourd'hui</SelectItem>
            <SelectItem value="7d">7 derniers jours</SelectItem>
            <SelectItem value="30d">30 derniers jours</SelectItem>
            <SelectItem value="90d">90 derniers jours</SelectItem>
            <SelectItem value="custom">Personnalisée</SelectItem>
          </SelectContent>
        </Select>
        {preset === "custom" && (
          <div className="flex items-center gap-2">
            <Label htmlFor="from" className="text-muted whitespace-nowrap">
              Du
            </Label>
            <Input
              id="from"
              type="date"
              className="w-40"
              value={customStart}
              onChange={(e) => updateParam({ from: e.target.value })}
            />
            <Label htmlFor="to" className="text-muted whitespace-nowrap">
              au
            </Label>
            <Input
              id="to"
              type="date"
              className="w-40"
              value={customEnd}
              onChange={(e) => updateParam({ to: e.target.value })}
            />
          </div>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard
          label="CA de la période"
          value={formatCurrency(currentRevenue)}
          delta={{
            value: percentDelta(currentRevenue, prevRevenue),
            label: "vs période précédente",
          }}
          icon={TrendingUp}
          loading={isLoading}
        />
        <StatCard
          label="Nombre de ventes"
          value={String(currentCount)}
          delta={{
            value: percentDelta(currentCount, prevCount),
            label: "vs période précédente",
          }}
          icon={Receipt}
          loading={isLoading}
        />
        <StatCard
          label="Ticket moyen"
          value={formatCurrency(avgTicket)}
          delta={{
            value: percentDelta(avgTicket, prevAvgTicket),
            label: "vs période précédente",
          }}
          icon={BarChart3}
          loading={isLoading}
        />
        <StatCard
          label="Bénéfice total"
          value={formatCurrency(profitSummary?.totalProfit ?? 0)}
          delta={
            profitSummary?.overallMarginPercent != null
              ? {
                  value: profitSummary.overallMarginPercent,
                  tone:
                    profitSummary.totalProfit >= 0 ? "success" : "danger",
                  label: "marge globale",
                }
              : undefined
          }
          icon={Coins}
          loading={profitQ.isPending}
        />
        <StatCard
          label="Alertes stock"
          value={
            lowStockQ.isPending ? "—" : String(lowStockQ.data?.length ?? 0)
          }
          delta={
            (lowStockQ.data?.length ?? 0) > 0
              ? {
                  value: lowStockQ.data?.length ?? 0,
                  tone: "warning",
                  isPercent: false,
                  label: "produit(s) sous seuil",
                }
              : undefined
          }
          loading={lowStockQ.isPending}
        />
      </div>

      {/* CA timeseries */}
      <Card>
        <CardHeader>
          <CardTitle>Évolution du chiffre d'affaires</CardTitle>
          <p className="text-xs text-muted">Cumul journalier sur la période</p>
        </CardHeader>
        <CardContent>
          <ChartContainer
            height={300}
            loading={isLoading}
            empty={!isLoading && dailySeries.length === 0}
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
                labelFormatter={(d: string) =>
                  new Date(d).toLocaleDateString("fr-FR", {
                    day: "2-digit",
                    month: "long",
                  })
                }
                formatter={(value: number) => [formatCurrency(value), "CA"]}
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

      {/* Top products + Top sellers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card>
          <CardHeader>
            <CardTitle>Meilleures ventes</CardTitle>
            <p className="text-xs text-muted">
              Top 8 par unités vendues · tous temps
            </p>
          </CardHeader>
          <CardContent>
            <ChartContainer
              height={300}
              loading={topProductsQ.isPending}
              empty={!topProductsQ.isPending && productsTop.length === 0}
              emptyState="Aucune vente enregistrée."
            >
              <BarChart
                data={productsTop.map((p) => ({
                  name: p.productName,
                  qty: p.quantitySold,
                  revenue: p.revenue,
                  salesCount: p.salesCount,
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
                  width={100}
                />
                <RTooltip
                  cursor={{ fill: "rgb(var(--color-surface-muted))" }}
                  contentStyle={tooltipStyle}
                  labelStyle={tooltipLabelStyle}
                  itemStyle={tooltipItemStyle}
                  formatter={(value: number, _name, props) => {
                    const row = props.payload as {
                      revenue: number;
                      salesCount: number;
                    } | null;
                    return [
                      `${value} u. · ${formatCurrency(row?.revenue ?? 0)} · ${row?.salesCount ?? 0} ventes`,
                      "Total",
                    ];
                  }}
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

        <Card>
          <CardHeader>
            <CardTitle>Top vendeurs</CardTitle>
            <p className="text-xs text-muted">Classement par CA réalisé</p>
          </CardHeader>
          <CardContent className="p-0">
            {sellersTop.length === 0 && !isLoading ? (
              <EmptyState
                size="sm"
                icon={Trophy}
                title="Aucun classement"
                description="Aucune vente sur la période."
              />
            ) : (
              <ul className="divide-y divide-default">
                {sellersTop.map((s, i) => (
                  <li
                    key={s.name}
                    className="flex items-center gap-3 px-4 py-2.5"
                  >
                    <span
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold tabular-nums",
                        i === 0
                          ? "bg-warning-soft text-warning-soft-fg"
                          : "bg-accent-soft text-accent-soft-fg",
                      )}
                      aria-hidden="true"
                    >
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-primary truncate">
                        {s.name}
                      </p>
                      <p className="text-xs text-muted">
                        {s.count} vente{s.count > 1 ? "s" : ""}
                      </p>
                    </div>
                    <span className="text-sm font-medium text-primary tabular-nums">
                      {formatCurrency(s.revenue)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bénéfice par produit */}
      <ProfitProductsCard
        items={profitSummary?.items ?? []}
        loading={profitQ.isPending}
        totalProfit={profitSummary?.totalProfit ?? 0}
        productCount={profitSummary?.productCount ?? 0}
      />

      {/* Stock summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <StockCard
          title="Entrées de stock"
          qty={stockAgg.inQty}
          movements={stockAgg.inCount}
          loading={stockQ.isPending}
          variant="success"
        />
        <StockCard
          title="Sorties de stock"
          qty={stockAgg.outQty}
          movements={stockAgg.outCount}
          loading={stockQ.isPending}
          variant="warning"
        />
        <Card>
          <CardHeader>
            <CardTitle>Variation nette</CardTitle>
            <p className="text-xs text-muted">Entrées − Sorties</p>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between gap-3">
              <p
                className={cn(
                  "text-3xl font-semibold tabular-nums leading-none",
                  net > 0
                    ? "text-success-soft-fg"
                    : net < 0
                      ? "text-danger-soft-fg"
                      : "text-primary",
                )}
              >
                {net > 0 && "+"}
                {formatNumber(net)}
              </p>
              {net > 0 && (
                <ArrowUpRight className="h-5 w-5 text-success-soft-fg" />
              )}
              {net < 0 && (
                <ArrowDownRight className="h-5 w-5 text-danger-soft-fg" />
              )}
              {net === 0 && <Minus className="h-5 w-5 text-muted" />}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ProfitProductsCard({
  items,
  loading,
  totalProfit,
  productCount,
}: {
  items: ProfitProductDto[];
  loading: boolean;
  totalProfit: number;
  productCount: number;
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between">
        <div>
          <CardTitle>Bénéfice par produit</CardTitle>
          <p className="text-xs text-muted">
            Top 10 par profit · tous temps · profit = CA − coût (basé sur le
            prix d'achat actuel)
          </p>
        </div>
        {!loading && items.length > 0 && (
          <div className="text-right">
            <p className="text-xs text-muted">Sur {productCount} produit(s)</p>
            <p className="text-sm font-semibold text-primary tabular-nums">
              {formatCurrency(totalProfit)}
            </p>
          </div>
        )}
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="px-4 py-10 text-center text-sm text-muted">
            Chargement…
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            size="sm"
            icon={Coins}
            title="Aucun bénéfice à afficher"
            description="Ajoutez un prix d'achat sur vos produits et enregistrez des ventes."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-default bg-surface-muted/40">
                  <th className="text-left text-xs font-medium text-muted px-4 py-2">
                    Produit
                  </th>
                  <th className="text-right text-xs font-medium text-muted px-3 py-2">
                    Qté vendue
                  </th>
                  <th className="text-right text-xs font-medium text-muted px-3 py-2">
                    CA
                  </th>
                  <th className="text-right text-xs font-medium text-muted px-3 py-2 hidden sm:table-cell">
                    Coût
                  </th>
                  <th className="text-right text-xs font-medium text-muted px-3 py-2">
                    Profit
                  </th>
                  <th className="text-right text-xs font-medium text-muted px-4 py-2">
                    Marge
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((row, i) => (
                  <tr
                    key={row.productId}
                    className={cn(
                      "border-b border-default last:border-b-0 transition-colors",
                      "hover:bg-surface-muted/30",
                    )}
                  >
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-semibold text-muted tabular-nums"
                          aria-hidden="true"
                        >
                          {i + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="text-primary font-medium truncate">
                            {row.productName}
                          </p>
                          <p className="text-xs text-muted truncate">
                            {row.categoryName}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right text-secondary tabular-nums">
                      {formatNumber(row.quantitySold)}
                    </td>
                    <td className="px-3 py-2 text-right text-secondary tabular-nums">
                      {formatCurrency(row.revenue)}
                    </td>
                    <td className="px-3 py-2 text-right text-muted tabular-nums hidden sm:table-cell">
                      {formatCurrency(row.cost)}
                    </td>
                    <td
                      className={cn(
                        "px-3 py-2 text-right font-medium tabular-nums",
                        row.profit >= 0
                          ? "text-success-soft-fg"
                          : "text-danger-soft-fg",
                      )}
                    >
                      {row.profit >= 0 ? "+" : ""}
                      {formatCurrency(row.profit)}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums">
                      {row.marginPercent == null ? (
                        <span className="text-muted">—</span>
                      ) : (
                        <Badge
                          variant={
                            row.marginPercent >= 30
                              ? "success"
                              : row.marginPercent >= 10
                                ? "warning"
                                : "danger"
                          }
                        >
                          {row.marginPercent.toFixed(1)} %
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StockCard({
  title,
  qty,
  movements,
  loading,
  variant,
}: {
  title: string;
  qty: number;
  movements: number;
  loading: boolean;
  variant: "success" | "warning";
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <p className="text-xs text-muted">Sur la période</p>
      </CardHeader>
      <CardContent className="flex items-end justify-between gap-3">
        <div>
          <p className="text-3xl font-semibold text-primary tabular-nums leading-none">
            {loading ? "—" : formatNumber(qty)}
          </p>
          <p className="mt-1 text-xs text-muted">
            {loading
              ? "Chargement…"
              : `${movements} mouvement${movements > 1 ? "s" : ""}`}
          </p>
        </div>
        <Badge variant={variant} dot>
          {variant === "success" ? "IN" : "OUT"}
        </Badge>
      </CardContent>
    </Card>
  );
}
