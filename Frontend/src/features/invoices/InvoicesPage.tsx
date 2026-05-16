import { useQuery } from "@tanstack/react-query";
import { Eye, FileText, MailWarning } from "lucide-react";
import { useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Badge,
  Button,
  DataTable,
  FilterBar,
  Input,
  Label,
  PageHeader,
  Pagination,
  SearchInput,
  Tooltip,
  type Column,
} from "@/components/ui";
import {
  invoicesService,
  type InvoiceSearchParams,
} from "@/services/invoicesService";
import type { InvoiceResponse } from "@/types";
import { formatCurrency, formatDateTime } from "@/utils/format";

export function InvoicesPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const startDate = searchParams.get("startDate") ?? "";
  const endDate = searchParams.get("endDate") ?? "";
  const page = Math.max(0, Number(searchParams.get("page") ?? 0));

  const update = (patch: Record<string, string | number | undefined>) =>
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const [k, v] of Object.entries(patch)) {
          if (v === undefined || v === "" || v === 0) next.delete(k);
          else next.set(k, String(v));
        }
        return next;
      },
      { replace: true },
    );

  const params: InvoiceSearchParams = useMemo(
    () => ({
      page,
      size: 20,
      q: q || undefined,
      startDate: startDate ? `${startDate}T00:00:00` : undefined,
      endDate: endDate ? `${endDate}T23:59:59` : undefined,
    }),
    [page, q, startDate, endDate],
  );

  const invoicesQuery = useQuery({
    queryKey: ["invoices", params],
    queryFn: () => invoicesService.list(params),
  });

  const data = invoicesQuery.data;
  const total = data?.totalElements ?? 0;
  const hasActiveFilters = Boolean(q || startDate || endDate);

  const columns: Column<InvoiceResponse>[] = [
    {
      id: "invoiceNumber",
      header: "Numéro",
      cell: (i) => (
        <span className="font-mono text-xs font-medium text-primary">
          {i.invoiceNumber}
        </span>
      ),
      width: "160px",
      sortKey: "invoiceNumber",
    },
    {
      id: "issueDate",
      header: "Émise le",
      cell: (i) => (
        <span className="text-secondary">{formatDateTime(i.issueDate)}</span>
      ),
      sortKey: "issueDate",
      width: "180px",
    },
    {
      id: "customer",
      header: "Client",
      cell: (i) =>
        i.customerName ? (
          <span className="text-primary">{i.customerName}</span>
        ) : (
          <Badge variant="warning" dot>
            <MailWarning className="h-3 w-3" aria-hidden="true" />
            À compléter
          </Badge>
        ),
    },
    {
      id: "issuedBy",
      header: "Émise par",
      cell: (i) => i.issuedByName ?? "—",
      hideable: true,
    },
    {
      id: "total",
      header: "Total",
      cell: (i) => (
        <span className="font-medium text-primary">
          {formatCurrency(i.totalAmount)}
        </span>
      ),
      align: "right",
      width: "120px",
      sortKey: "totalAmount",
    },
    {
      id: "actions",
      header: "",
      cell: (i) => (
        <div className="inline-flex items-center justify-end" data-row-stop>
          <Tooltip content="Voir la facture">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => navigate(`/invoices/${i.id}`)}
            >
              <Eye className="h-3.5 w-3.5" />
            </Button>
          </Tooltip>
        </div>
      ),
      align: "right",
      compact: true,
      width: "64px",
    },
  ];

  return (
    <div className="max-w-[1400px] mx-auto space-y-4">
      <PageHeader
        title="Factures"
        description="Documents générés automatiquement après chaque vente. Modifiez les informations client et téléchargez le PDF."
        meta={total > 0 && <Badge variant="neutral">{total}</Badge>}
      />

      <FilterBar
        onReset={() => setSearchParams({}, { replace: true })}
        hasActiveFilters={hasActiveFilters}
      >
        <SearchInput
          key={q}
          defaultValue={q}
          onSearch={(v) => update({ q: v, page: 0 })}
          placeholder="Rechercher par numéro ou client…"
          className="w-full sm:w-72"
        />
        <div className="flex items-center gap-2">
          <Label htmlFor="from" className="text-muted whitespace-nowrap">
            Du
          </Label>
          <Input
            id="from"
            type="date"
            className="w-40"
            value={startDate}
            onChange={(e) => update({ startDate: e.target.value, page: 0 })}
          />
          <Label htmlFor="to" className="text-muted whitespace-nowrap">
            au
          </Label>
          <Input
            id="to"
            type="date"
            className="w-40"
            value={endDate}
            onChange={(e) => update({ endDate: e.target.value, page: 0 })}
          />
        </div>
      </FilterBar>

      <DataTable<InvoiceResponse>
        columns={columns}
        data={data?.content ?? []}
        getRowId={(i) => i.id}
        loading={invoicesQuery.isPending}
        rowCount={10}
        onRowClick={(i) => navigate(`/invoices/${i.id}`)}
        emptyTitle="Aucune facture"
        emptyDescription={
          hasActiveFilters
            ? "Ajustez vos filtres."
            : "Les factures apparaissent automatiquement après chaque vente."
        }
        emptyAction={
          !hasActiveFilters ? (
            <Button variant="secondary" asChild>
              <Link to="/ventes/new">
                <FileText className="h-3.5 w-3.5" />
                Créer une vente
              </Link>
            </Button>
          ) : undefined
        }
      />

      {data && data.totalPages > 1 && (
        <Pagination
          page={data.page}
          totalPages={data.totalPages}
          totalElements={data.totalElements}
          pageSize={data.size}
          onPageChange={(p) => update({ page: p })}
        />
      )}
    </div>
  );
}
