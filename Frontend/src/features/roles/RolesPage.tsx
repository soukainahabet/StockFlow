import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Lock, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Badge,
  Button,
  Checkbox,
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
  Switch,
  toastUI,
  Tooltip,
  type Column,
} from "@/components/ui";
import { permissionsService } from "@/features/permissions/permissionsService";
import type { PermissionResponse, RoleResponse, RoleType } from "@/types";
import { rolesService, type RoleSearchParams } from "./rolesService";

interface RoleFormState {
  name: string;
  active: boolean;
  permissions: Set<string>;
}

const EMPTY_FORM: RoleFormState = {
  name: "",
  active: true,
  permissions: new Set(),
};

export function RolesPage() {
  const qc = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(0, Number(searchParams.get("page") ?? 0));

  const params: RoleSearchParams = useMemo(() => ({ page, size: 20 }), [page]);

  const rolesQuery = useQuery({
    queryKey: ["roles", params],
    queryFn: () => rolesService.list(params),
  });
  const permissionsQuery = useQuery({
    queryKey: ["permissions"],
    queryFn: permissionsService.listAll,
    staleTime: 5 * 60_000,
  });
  const permissionGroups = useMemo(
    () => groupByCategory(permissionsQuery.data ?? []),
    [permissionsQuery.data],
  );

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<RoleResponse | null>(null);
  const [form, setForm] = useState<RoleFormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<RoleResponse | null>(null);

  useEffect(() => {
    if (!formOpen) return;
    if (editing) {
      setForm({
        name: editing.name,
        active: editing.active,
        permissions: new Set(editing.permissions),
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setFormError(null);
  }, [formOpen, editing]);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (r: RoleResponse) => {
    setEditing(r);
    setFormOpen(true);
  };

  const togglePermission = (key: string, checked: boolean) =>
    setForm((prev) => {
      const next = new Set(prev.permissions);
      if (checked) next.add(key);
      else next.delete(key);
      return { ...prev, permissions: next };
    });

  const createMut = useMutation({
    mutationFn: (state: RoleFormState) =>
      rolesService.create({
        name: state.name,
        active: state.active,
        // Spec: les rôles CUSTOM démarrent sans permissions.
        // Elles seront ajoutées via une mise à jour, après la création.
      }),
    onSuccess: () => {
      toastUI.success("Rôle créé");
      setFormOpen(false);
      void qc.invalidateQueries({ queryKey: ["roles"] });
    },
    onError: () => toastUI.error("Création impossible"),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, state }: { id: number; state: RoleFormState }) =>
      rolesService.update(id, {
        name: state.name,
        active: state.active,
        permissions: [...state.permissions],
      }),
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
    if (!/^[A-Z][A-Z0-9_]*$/.test(form.name)) {
      setFormError(
        "MAJUSCULES uniquement, peut contenir des chiffres et underscores.",
      );
      return;
    }
    setFormError(null);
    if (editing) updateMut.mutate({ id: editing.id, state: form });
    else createMut.mutate(form);
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
      cell: (r) => <RoleTypeBadge type={r.type} />,
      width: "140px",
    },
    {
      id: "active",
      header: "Statut",
      cell: (r) =>
        r.active ? (
          <Badge variant="success" dot>
            Actif
          </Badge>
        ) : (
          <Badge variant="neutral" dot>
            Inactif
          </Badge>
        ),
      width: "110px",
    },
    {
      id: "permissions",
      header: "Permissions",
      cell: (r) => (
        <span className="text-secondary tabular-nums">
          {r.permissions.length}
        </span>
      ),
      align: "right",
      width: "120px",
      hideable: true,
    },
    {
      id: "actions",
      header: "",
      cell: (r) => (
        <div className="inline-flex items-center gap-0.5 justify-end" data-row-stop>
          <Tooltip
            content={
              r.type === "SYSTEM"
                ? "Les rôles système ne peuvent pas être modifiés"
                : "Modifier"
            }
          >
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => openEdit(r)}
              disabled={r.type === "SYSTEM"}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          </Tooltip>
          <Tooltip
            content={
              r.type === "SYSTEM"
                ? "Les rôles système ne peuvent pas être supprimés"
                : "Supprimer"
            }
          >
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setConfirmDelete(r)}
              disabled={r.type === "SYSTEM"}
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
        description="Gestion des rôles applicatifs. Les rôles système (ADMIN, STOCK_MANAGER, SELLER, MANAGER, USER) sont protégés ; les rôles personnalisés sont créés sans permissions."
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
        <DrawerContent size="md">
          <DrawerHeader>
            <DrawerTitle>
              {editing ? `Modifier ${editing.name}` : "Nouveau rôle"}
            </DrawerTitle>
            <DrawerDescription>
              {editing
                ? "Mettez à jour les attributs du rôle. Les rôles système sont immuables."
                : "Le rôle est créé sans permissions. Ajoutez-les après la création."}
            </DrawerDescription>
          </DrawerHeader>
          <form onSubmit={submit} className="contents">
            <DrawerBody className="space-y-5">
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
                  value={form.name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, name: e.target.value.toUpperCase() }))
                  }
                  invalid={Boolean(formError)}
                  className="font-mono uppercase"
                  autoFocus
                />
                {formError && (
                  <p className="text-xs text-danger">{formError}</p>
                )}
              </div>

              <div className="flex items-center justify-between rounded-md border border-default px-3 py-2.5">
                <div className="min-w-0 pr-3">
                  <Label htmlFor="role-active" className="text-sm font-medium">
                    Rôle actif
                  </Label>
                  <p className="text-xs text-muted">
                    Inactif → masqué dans la liste d'attribution des
                    utilisateurs.
                  </p>
                </div>
                <Switch
                  id="role-active"
                  checked={form.active}
                  onCheckedChange={(v) =>
                    setForm((p) => ({ ...p, active: Boolean(v) }))
                  }
                />
              </div>

              {editing && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Permissions</Label>
                    <span className="text-xs text-muted tabular-nums">
                      {form.permissions.size} sélectionnée
                      {form.permissions.size > 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="rounded-md border border-default divide-y divide-default">
                    {permissionsQuery.isPending && (
                      <p className="p-3 text-xs text-muted">
                        Chargement du catalogue…
                      </p>
                    )}
                    {permissionsQuery.isError && (
                      <p className="p-3 text-xs text-danger">
                        Impossible de charger les permissions.
                      </p>
                    )}
                    {permissionGroups.map((group) => (
                      <div key={group.category} className="p-3 space-y-2">
                        <p className="text-[11px] font-medium uppercase tracking-wider text-muted">
                          {group.category}
                        </p>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {group.items.map((p) => {
                            const checked = form.permissions.has(p.code);
                            return (
                              <li key={p.code}>
                                <label className="flex items-start gap-2 text-sm text-secondary cursor-pointer">
                                  <Checkbox
                                    checked={checked}
                                    onCheckedChange={(v) =>
                                      togglePermission(p.code, Boolean(v))
                                    }
                                    className="mt-0.5"
                                  />
                                  <span className="min-w-0">
                                    <span className="block text-primary">
                                      {p.label}
                                    </span>
                                    <span className="block font-mono text-[10px] text-disabled">
                                      {p.code}
                                    </span>
                                  </span>
                                </label>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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

interface PermissionGroup {
  category: string;
  items: PermissionResponse[];
}

function groupByCategory(permissions: PermissionResponse[]): PermissionGroup[] {
  const map = new Map<string, PermissionResponse[]>();
  for (const p of permissions) {
    const list = map.get(p.category) ?? [];
    list.push(p);
    map.set(p.category, list);
  }
  return [...map.entries()].map(([category, items]) => ({ category, items }));
}

function RoleTypeBadge({ type }: { type: RoleType }) {
  if (type === "SYSTEM") {
    return (
      <Badge variant="warning">
        <Lock className="h-3 w-3" aria-hidden="true" />
        Système
      </Badge>
    );
  }
  return <Badge variant="info">Personnalisé</Badge>;
}
