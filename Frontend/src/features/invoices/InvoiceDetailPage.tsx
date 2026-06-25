import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Download,
  FileText,
  Pencil,
  Printer,
  Receipt,
} from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  EmptyState,
  Input,
  Label,
  PageHeader,
  Skeleton,
  Textarea,
  toastUI,
  Tooltip,
} from "@/components/ui";
import { useAuth } from "@/features/auth/AuthContext";
import { cn } from "@/lib/cn";
import { invoicesService } from "@/services/invoicesService";
import type { InvoiceUpdateRequest } from "@/types";
import { formatCurrency, formatDateTime } from "@/utils/format";

export function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const invoiceId = Number(id);
  const qc = useQueryClient();
  const { hasRole, hasPermission } = useAuth();
  const canEdit = hasRole("ADMIN", "MANAGER") || hasPermission("CREATE_INVOICE");
  const canDownload = hasRole("ADMIN", "MANAGER") || hasPermission("DOWNLOAD_INVOICE");

  const invoiceQ = useQuery({
    queryKey: ["invoice", invoiceId],
    queryFn: () => invoicesService.getById(invoiceId),
    enabled: Number.isFinite(invoiceId) && invoiceId > 0,
  });

  const [editOpen, setEditOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const updateMut = useMutation({
    mutationFn: (body: InvoiceUpdateRequest) =>
      invoicesService.update(invoiceId, body),
    onSuccess: () => {
      toastUI.success("Informations client enregistrées");
      setEditOpen(false);
      void qc.invalidateQueries({ queryKey: ["invoice", invoiceId] });
      void qc.invalidateQueries({ queryKey: ["invoices"] });
    },
    onError: () => toastUI.error("Mise à jour impossible"),
  });

  const handleDownload = async () => {
    if (!invoiceQ.data) return;
    setDownloading(true);
    try {
      await invoicesService.downloadPdf(
        invoiceId,
        invoiceQ.data.invoiceNumber,
      );
    } catch {
      toastUI.error("Téléchargement impossible");
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (invoiceQ.isPending) {
    return (
      <div className="max-w-[900px] mx-auto space-y-4">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!invoiceQ.data) {
    return (
      <div className="max-w-[900px] mx-auto">
        <Link
          to="/invoices"
          className="inline-flex items-center gap-1 text-sm text-muted hover:text-primary mb-4 print:hidden"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Factures
        </Link>
        <EmptyState
          icon={FileText}
          title="Facture introuvable"
          description="Cette facture n'existe pas ou a été supprimée."
        />
      </div>
    );
  }

  const inv = invoiceQ.data;

  return (
    <>
      {/* Toolbar (masquée à l'impression) */}
      <div className="max-w-[900px] mx-auto print:hidden">
        <Link
          to="/invoices"
          className="inline-flex items-center gap-1 text-sm text-muted hover:text-primary mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Factures
        </Link>

        <PageHeader
          title={inv.invoiceNumber}
          description={
            <>
              Émise le {formatDateTime(inv.issueDate)}
              {inv.issuedByName && (
                <>
                  <span className="text-disabled mx-1.5">·</span>
                  par {inv.issuedByName}
                </>
              )}
            </>
          }
          meta={
            inv.hasCustomerInfo ? (
              <Badge variant="success" dot>
                Client renseigné
              </Badge>
            ) : (
              <Badge variant="warning" dot>
                Client manquant
              </Badge>
            )
          }
          actions={
            <>
              {canEdit && (
                <Tooltip content="Modifier les infos client">
                  <Button
                    variant="secondary"
                    onClick={() => setEditOpen(true)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Modifier client
                  </Button>
                </Tooltip>
              )}
              <Button variant="secondary" onClick={handlePrint}>
                <Printer className="h-3.5 w-3.5" />
                Imprimer
              </Button>
              {canDownload && (
                <Button onClick={handleDownload} loading={downloading}>
                  <Download className="h-3.5 w-3.5" />
                  Télécharger PDF
                </Button>
              )}
            </>
          }
        />
      </div>

      {/* Aperçu "facture" — visible à l'écran et à l'impression */}
      <article
        className={cn(
          "max-w-[900px] mx-auto bg-surface border border-default rounded-md shadow-subtle overflow-hidden",
          "print:max-w-none print:border-0 print:shadow-none print:rounded-none",
        )}
      >
        {/* En-tête */}
        <header className="px-8 pt-8 pb-6 border-b border-default">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-md bg-accent text-accent-fg print:bg-accent"
                aria-hidden="true"
              >
                <Receipt className="h-4 w-4" strokeWidth={2.25} />
              </span>
              <div>
                <p className="text-sm font-semibold text-accent print:text-accent">
                  StockFlow
                </p>
                <h1 className="text-2xl font-bold text-primary leading-tight">
                  Facture
                </h1>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[11px] uppercase tracking-wider text-muted">
                Numéro
              </p>
              <p className="font-mono text-base font-semibold text-accent tabular-nums">
                {inv.invoiceNumber}
              </p>
            </div>
          </div>
        </header>

        {/* Émetteur / Client */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-8 py-5 border-b border-default bg-surface-muted/30">
          <InfoBlock label="Émetteur">
            <p className="font-semibold text-primary">StockFlow SaaS</p>
            <p className="text-muted">support@stockflow.com</p>
            <p className="text-muted text-xs">SIRET — à compléter</p>
          </InfoBlock>
          <InfoBlock label="Client">
            {inv.customerName ? (
              <>
                <p className="font-semibold text-primary">{inv.customerName}</p>
                {inv.customerEmail && (
                  <p className="text-muted">{inv.customerEmail}</p>
                )}
                {inv.customerPhone && (
                  <p className="text-muted">{inv.customerPhone}</p>
                )}
                {inv.customerAddress && (
                  <p className="text-muted whitespace-pre-line">
                    {inv.customerAddress}
                  </p>
                )}
              </>
            ) : (
              <p className="text-muted italic">— Non renseigné —</p>
            )}
          </InfoBlock>
        </section>

        {/* Méta */}
        <section className="grid grid-cols-2 gap-4 px-8 py-4 border-b border-default text-sm">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted">
              Émise le
            </p>
            <p className="text-primary">{formatDateTime(inv.issueDate)}</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] uppercase tracking-wider text-muted">
              Émise par
            </p>
            <p className="text-primary">{inv.issuedByName ?? "—"}</p>
          </div>
        </section>

        {/* Lignes */}
        <section className="px-8 py-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-default">
                <th className="text-left text-[11px] uppercase tracking-wider font-medium text-muted pb-2">
                  Produit
                </th>
                <th className="text-right text-[11px] uppercase tracking-wider font-medium text-muted pb-2 w-16">
                  Qté
                </th>
                <th className="text-right text-[11px] uppercase tracking-wider font-medium text-muted pb-2 w-28">
                  P.U.
                </th>
                <th className="text-right text-[11px] uppercase tracking-wider font-medium text-muted pb-2 w-32">
                  Sous-total
                </th>
              </tr>
            </thead>
            <tbody>
              {inv.lignes.map((l) => (
                <tr
                  key={l.id}
                  className="border-b border-default last:border-b-0"
                >
                  <td className="py-3 text-primary">{l.productName}</td>
                  <td className="py-3 text-right tabular-nums text-secondary">
                    {l.quantite}
                  </td>
                  <td className="py-3 text-right tabular-nums text-secondary">
                    {formatCurrency(l.prixUnitaire)}
                  </td>
                  <td className="py-3 text-right tabular-nums font-medium text-primary">
                    {formatCurrency(l.sousTotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Total */}
        <section className="border-t-2 border-accent bg-surface-muted/40 px-8 py-4 flex items-end justify-between">
          <span className="text-xs uppercase tracking-wider text-muted">
            Total TTC
          </span>
          <span className="text-2xl font-bold text-primary tabular-nums leading-none">
            {formatCurrency(inv.totalAmount)}
          </span>
        </section>

        {/* Notes */}
        {inv.notes && (
          <section className="px-8 py-4 border-t border-default text-sm">
            <p className="text-[11px] uppercase tracking-wider text-muted mb-1">
              Notes
            </p>
            <p className="text-secondary whitespace-pre-line">{inv.notes}</p>
          </section>
        )}

        {/* Footer */}
        <footer className="px-8 py-4 border-t border-default text-center text-[11px] text-disabled">
          Merci pour votre confiance. Facture générée automatiquement par
          StockFlow.
        </footer>
      </article>

      {canEdit && (
        <EditCustomerDrawer
          open={editOpen}
          onClose={() => setEditOpen(false)}
          initial={{
            customerName: inv.customerName,
            customerEmail: inv.customerEmail,
            customerAddress: inv.customerAddress,
            customerPhone: inv.customerPhone,
            notes: inv.notes,
          }}
          onSubmit={(body) => updateMut.mutateAsync(body)}
          submitting={updateMut.isPending}
        />
      )}
    </>
  );
}

function InfoBlock({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wider text-muted mb-1">
        {label}
      </p>
      <div className="text-sm space-y-0.5">{children}</div>
    </div>
  );
}

function EditCustomerDrawer({
  open,
  onClose,
  initial,
  onSubmit,
  submitting,
}: {
  open: boolean;
  onClose: () => void;
  initial: InvoiceUpdateRequest;
  onSubmit: (body: InvoiceUpdateRequest) => Promise<unknown>;
  submitting: boolean;
}) {
  const [form, setForm] = useState<InvoiceUpdateRequest>(initial);

  useEffect(() => {
    if (open) setForm(initial);
  }, [open, initial]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    void onSubmit(form);
  };

  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent size="md">
        <DrawerHeader>
          <DrawerTitle>Informations client</DrawerTitle>
          <DrawerDescription>
            Renseignez les coordonnées qui apparaîtront sur la facture (PDF +
            impression).
          </DrawerDescription>
        </DrawerHeader>
        <form onSubmit={submit} className="contents">
          <DrawerBody className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="cust-name">Nom / Raison sociale</Label>
              <Input
                id="cust-name"
                maxLength={150}
                value={form.customerName ?? ""}
                onChange={(e) =>
                  setForm({ ...form, customerName: e.target.value })
                }
                placeholder="Acme Corp"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="cust-email">Email</Label>
                <Input
                  id="cust-email"
                  type="email"
                  maxLength={150}
                  value={form.customerEmail ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, customerEmail: e.target.value })
                  }
                  placeholder="billing@gmail.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cust-phone">Téléphone</Label>
                <Input
                  id="cust-phone"
                  type="tel"
                  maxLength={30}
                  value={form.customerPhone ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, customerPhone: e.target.value })
                  }
                  placeholder="+212 1 23 45 67 89"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cust-address">Adresse</Label>
              <Textarea
                id="cust-address"
                rows={3}
                maxLength={500}
                value={form.customerAddress ?? ""}
                onChange={(e) =>
                  setForm({ ...form, customerAddress: e.target.value })
                }
                placeholder="10 Rue Inbiaat&#10;12000 Temara"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cust-notes">Notes</Label>
              <Textarea
                id="cust-notes"
                rows={2}
                maxLength={500}
                value={form.notes ?? ""}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Conditions de paiement, mode de règlement…"
              />
            </div>
          </DrawerBody>
          <DrawerFooter>
            <Button type="submit" loading={submitting}>
              Enregistrer
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Annuler
            </Button>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
