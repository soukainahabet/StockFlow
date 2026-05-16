import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
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
  FilterBar,
  Input,
  Label,
  PageHeader,
  Pagination,
  SearchInput,
  toastUI,
  Tooltip,
  type Column,
} from "@/components/ui";
import { useAuth } from "@/features/auth/AuthContext";
import type { CategoryResponse } from "@/types";
import { categoriesService, type CategorySearchParams } from "./categoriesService";

export function CategoriesPage() {
  const { hasRole } = useAuth();
  const canManage = hasRole("ADMIN");
  const qc = useQueryClient();

  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get("q") ?? "";
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

  const params: CategorySearchParams = useMemo(
    () => ({ page, size: 15, name: q || undefined }),
    [page, q],
  );

  const categoriesQuery = useQuery({
    queryKey: ["categories", params],
    queryFn: () => categoriesService.list(params),
  });

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryResponse | null>(null);
  const [formName, setFormName] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<CategoryResponse | null>(
    null,
  );

  const openCreate = () => {
    setEditing(null);
    setFormName("");
    setFormOpen(true);
  };
  const openEdit = (c: CategoryResponse) => {
    setEditing(c);
    setFormName(c.name);
    setFormOpen(true);
  };

  const createMut = useMutation({
    mutationFn: (n: string) => categoriesService.create({ name: n }),
    onSuccess: () => {
      toastUI.success("Catégorie créée");
      setFormOpen(false);
      void qc.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: () => toastUI.error("Création impossible"),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, n }: { id: number; n: string }) =>
      categoriesService.update(id, { name: n }),
    onSuccess: () => {
      toastUI.success("Catégorie mise à jour");
      setFormOpen(false);
      void qc.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: () => toastUI.error("Mise à jour impossible"),
  });
  const deleteMut = useMutation({
    mutationFn: (id: number) => categoriesService.remove(id),
    onSuccess: () => {
      toastUI.success("Catégorie supprimée");
      setConfirmDelete(null);
      void qc.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: () => toastUI.error("Suppression impossible — vérifiez que la catégorie n'est pas utilisée"),
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (editing) updateMut.mutate({ id: editing.id, n: formName });
    else createMut.mutate(formName);
  };

  const data = categoriesQuery.data;
  const total = data?.totalElements ?? 0;

  const columns: Column<CategoryResponse>[] = [
    {
      id: "id",
      header: "Réf.",
      cell: (c) => <span className="font-mono text-xs text-muted">#{c.id}</span>,
      width: "72px",
    },
    {
      id: "name",
      header: "Nom",
      cell: (c) => <span className="font-medium text-primary">{c.name}</span>,
      sortKey: "name",
    },
    ...(canManage
      ? [
          {
            id: "actions",
            header: "",
            cell: (c: CategoryResponse) => (
              <div className="inline-flex items-center gap-0.5 justify-end" data-row-stop>
                <Tooltip content="Modifier">
                  <Button variant="ghost" size="icon-sm" onClick={() => openEdit(c)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </Tooltip>
                <Tooltip content="Supprimer">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setConfirmDelete(c)}
                    className="text-muted hover:text-danger"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </Tooltip>
              </div>
            ),
            align: "right" as const,
            compact: true,
            width: "96px",
          },
        ]
      : []),
  ];

  return (
    <div className="max-w-[1100px] mx-auto space-y-4">
      <PageHeader
        title="Catégories"
        description="Organisez votre catalogue par catégorie."
        meta={total > 0 && <Badge variant="neutral">{total}</Badge>}
        actions={
          canManage && (
            <Button onClick={openCreate}>
              <Plus className="h-3.5 w-3.5" />
              Nouvelle catégorie
            </Button>
          )
        }
      />

      <FilterBar
        onReset={() => setSearchParams({}, { replace: true })}
        hasActiveFilters={Boolean(q)}
      >
        <SearchInput
          key={q}
          defaultValue={q}
          onSearch={(v) => update({ q: v, page: 0 })}
          placeholder="Rechercher une catégorie…"
          className="w-full sm:w-72"
        />
      </FilterBar>

      <DataTable<CategoryResponse>
        columns={columns}
        data={data?.content ?? []}
        getRowId={(c) => c.id}
        loading={categoriesQuery.isPending}
        rowCount={8}
        emptyTitle="Aucune catégorie"
        emptyDescription={
          q
            ? "Ajustez votre recherche."
            : "Créez votre première catégorie."
        }
        emptyAction={
          !q && canManage ? (
            <Button onClick={openCreate}>
              <Plus className="h-3.5 w-3.5" />
              Nouvelle catégorie
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

      <Drawer open={formOpen} onOpenChange={(o) => !o && setFormOpen(false)}>
        <DrawerContent size="sm">
          <DrawerHeader>
            <DrawerTitle>
              {editing ? "Modifier la catégorie" : "Nouvelle catégorie"}
            </DrawerTitle>
            <DrawerDescription>
              {editing
                ? "Renommez cette catégorie."
                : "Ajoutez une catégorie au catalogue."}
            </DrawerDescription>
          </DrawerHeader>
          <form onSubmit={submit} className="contents">
            <DrawerBody>
              <div className="space-y-1.5">
                <Label htmlFor="cat-name" required>
                  Nom
                </Label>
                <Input
                  id="cat-name"
                  required
                  minLength={2}
                  maxLength={100}
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  autoFocus
                />
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
        title="Supprimer la catégorie ?"
        message={`"${confirmDelete?.name}" sera supprimée. Les produits associés en seront détachés.`}
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
