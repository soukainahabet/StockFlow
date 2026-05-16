import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Lock, Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Badge,
  Button,
  ConfirmDialog,
  DataTable,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  Input,
  Label,
  PageHeader,
  Pagination,
  toastUI,
  Tooltip,
  type Column,
} from "@/components/ui";
import type { RoleResponse } from "@/types";
import { rolesService, type RoleSearchParams } from "./rolesService";

export function RolesPage() {
  const qc = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(0, Number(searchParams.get("page") ?? 0));

  const params: RoleSearchParams = useMemo(() => ({ page, size: 20 }), [page]);

  const rolesQuery = useQuery({
    queryKey: ["roles", params],
    queryFn: () => rolesService.list(params),
  });

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<RoleResponse | null>(null);
  const [name, setName] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<RoleResponse | null>(null);

  const openCreate = () => {
    setEditing(null);
    setName("");
    setFormError(null);
    setFormOpen(true);
  };
  const openEdit = (r: RoleResponse) => {
    setEditing(r);
    setName(r.name);
    setFormError(null);
    setFormOpen(true);
  };

  const createMut = useMutation({
    mutationFn: (n: string) => rolesService.create({ name: n }),
    onSuccess: () => {
      toastUI.success("Rôle créé");
      setFormOpen(false);
      void qc.invalidateQueries({ queryKey: ["roles"] });
    },
    onError: () => toastUI.error("Création impossible"),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, n }: { id: number; n: string }) =>
      rolesService.update(id, { name: n }),
    onSuccess: () => {
      toastUI.success("Rôle mis à jour");
      setFormOpen(false);
      void qc.invalidateQueries({ queryKey: ["roles"] });
    },
    onError: () => toastUI.error("Mise à jour impossible"),
  });
  const deleteMut = useMutation({
    mutationFn: (id: number) => rolesService.remove(id),
    onSuccess: () => {
      toastUI.success("Rôle supprimé");
      setConfirmDelete(null);
      void qc.invalidateQueries({ queryKey: ["roles"] });
    },
    onError: () =>
      toastUI.error(
        "Suppression impossible — le rôle est peut-être encore assigné à un utilisateur",
      ),
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!/^[A-Z][A-Z0-9_]*$/.test(name)) {
      setFormError(
        "MAJUSCULES uniquement, peut contenir des chiffres et underscores.",
      );
      return;
    }
    setFormError(null);
    if (editing) updateMut.mutate({ id: editing.id, n: name });
    else createMut.mutate(name);
  };

  const data = rolesQuery.data;
  const total = data?.totalElements ?? 0;

  const columns: Column<RoleResponse>[] = [
    {
      id: "id",
      header: "Réf.",
      cell: (r) => <span className="font-mono text-xs text-muted">#{r.id}</span>,
      width: "72px",
    },
    {
      id: "name",
      header: "Nom",
      cell: (r) => (
        <span className="font-medium font-mono text-primary">{r.name}</span>
      ),
      sortKey: "name",
    },
    {
      id: "type",
      header: "Type",
      cell: (r) =>
        r.systemRole ? (
          <Badge variant="warning">
            <Lock className="h-3 w-3" aria-hidden="true" />
            Système
          </Badge>
        ) : (
          <Badge variant="info">Personnalisé</Badge>
        ),
      width: "160px",
    },
    {
      id: "actions",
      header: "",
      cell: (r) => (
        <div className="inline-flex items-center gap-0.5 justify-end" data-row-stop>
          <Tooltip
            content={
              r.systemRole
                ? "Les rôles système ne peuvent pas être modifiés"
                : "Modifier"
            }
          >
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => openEdit(r)}
              disabled={r.systemRole}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          </Tooltip>
          <Tooltip
            content={
              r.systemRole
                ? "Les rôles système ne peuvent pas être supprimés"
                : "Supprimer"
            }
          >
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setConfirmDelete(r)}
              disabled={r.systemRole}
              className="text-muted hover:text-danger"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </Tooltip>
        </div>
      ),
      align: "right",
      compact: true,
      width: "96px",
    },
  ];

  return (
    <div className="max-w-[1100px] mx-auto space-y-4">
      <PageHeader
        title="Rôles"
        description="Gestion des rôles applicatifs. Les rôles système (ADMIN, STOCK_MANAGER, SELLER, MANAGER, USER) sont protégés."
        meta={total > 0 && <Badge variant="neutral">{total}</Badge>}
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-3.5 w-3.5" />
            Nouveau rôle
          </Button>
        }
      />

      <DataTable<RoleResponse>
        columns={columns}
        data={data?.content ?? []}
        getRowId={(r) => r.id}
        loading={rolesQuery.isPending}
        rowCount={6}
        emptyTitle="Aucun rôle"
      />

      {data && data.totalPages > 1 && (
        <Pagination
          page={data.page}
          totalPages={data.totalPages}
          totalElements={data.totalElements}
          pageSize={data.size}
          onPageChange={(p) =>
            setSearchParams(
              (prev) => {
                const next = new URLSearchParams(prev);
                if (p === 0) next.delete("page");
                else next.set("page", String(p));
                return next;
              },
              { replace: true },
            )
          }
        />
      )}

      <Drawer open={formOpen} onOpenChange={(o) => !o && setFormOpen(false)}>
        <DrawerContent size="sm">
          <DrawerHeader>
            <DrawerTitle>
              {editing ? "Renommer le rôle" : "Nouveau rôle"}
            </DrawerTitle>
            <DrawerDescription>
              Le nom doit être en MAJUSCULES (lettres, chiffres, underscores).
            </DrawerDescription>
          </DrawerHeader>
          <form onSubmit={submit} className="contents">
            <DrawerBody className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="role-name" required>
                  Nom du rôle
                </Label>
                <Input
                  id="role-name"
                  required
                  minLength={3}
                  maxLength={50}
                  pattern="^[A-Z][A-Z0-9_]*$"
                  placeholder="AUDITOR"
                  value={name}
                  onChange={(e) => setName(e.target.value.toUpperCase())}
                  invalid={Boolean(formError)}
                  className="font-mono uppercase"
                  autoFocus
                />
                {formError && (
                  <p className="text-xs text-danger">{formError}</p>
                )}
              </div>
            </DrawerBody>
            <DrawerFooter>
              <Button
                type="submit"
                loading={createMut.isPending || updateMut.isPending}
              >
                {editing ? "Enregistrer" : "Créer"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setFormOpen(false)}
                disabled={createMut.isPending || updateMut.isPending}
              >
                Annuler
              </Button>
            </DrawerFooter>
          </form>
        </DrawerContent>
      </Drawer>

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        title="Supprimer le rôle ?"
        message={`Le rôle "${confirmDelete?.name}" sera supprimé. Cette action échoue si le rôle est encore assigné à un utilisateur.`}
        confirmLabel="Supprimer"
        loading={deleteMut.isPending}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (confirmDelete) deleteMut.mutate(confirmDelete.id);
        }}
      />
    </div>
  );
}
