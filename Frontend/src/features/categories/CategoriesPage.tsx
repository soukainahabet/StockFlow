import { useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Search, Tags } from "lucide-react";
import toast from "react-hot-toast";
import { PageHeader } from "@/components/ui/PageHeader";
import { Spinner } from "@/components/ui/Spinner";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Modal } from "@/components/ui/Modal";
import { categoriesService, type CategorySearchParams } from "./categoriesService";
import { useAuth } from "@/features/auth/AuthContext";
import type { CategoryResponse } from "@/types";

export function CategoriesPage() {
  const { hasRole } = useAuth();
  const canManage = hasRole("ADMIN");
  const qc = useQueryClient();

  const [page, setPage] = useState(0);
  const [name, setName] = useState("");
  const params: CategorySearchParams = useMemo(
    () => ({ page, size: 10, name: name || undefined }),
    [page, name],
  );

  const categoriesQuery = useQuery({
    queryKey: ["categories", params],
    queryFn: () => categoriesService.list(params),
  });

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryResponse | null>(null);
  const [formName, setFormName] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<CategoryResponse | null>(null);

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
      toast.success("Catégorie créée");
      setFormOpen(false);
      void qc.invalidateQueries({ queryKey: ["categories"] });
    },
  });
  const updateMut = useMutation({
    mutationFn: ({ id, n }: { id: number; n: string }) => categoriesService.update(id, { name: n }),
    onSuccess: () => {
      toast.success("Catégorie mise à jour");
      setFormOpen(false);
      void qc.invalidateQueries({ queryKey: ["categories"] });
    },
  });
  const deleteMut = useMutation({
    mutationFn: (id: number) => categoriesService.remove(id),
    onSuccess: () => {
      toast.success("Catégorie supprimée");
      setConfirmDelete(null);
      void qc.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (editing) updateMut.mutate({ id: editing.id, n: formName });
    else createMut.mutate(formName);
  };

  const data = categoriesQuery.data;

  return (
    <>
      <PageHeader
        title="Catégories"
        subtitle="Organisez vos produits par catégorie."
        actions={
          canManage && (
            <button className="btn-primary" onClick={openCreate}>
              <Plus size={16} />
              Nouvelle catégorie
            </button>
          )
        }
      />

      <div className="card p-4 mb-4">
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" />
          <input
            className="input pl-9"
            placeholder="Rechercher..."
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setPage(0);
            }}
          />
        </div>
      </div>

      <div className="card overflow-hidden">
        {categoriesQuery.isPending ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : !data || data.empty ? (
          <EmptyState icon={Tags} title="Aucune catégorie" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="table-th">ID</th>
                    <th className="table-th">Nom</th>
                    {canManage && <th className="table-th text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {data.content.map((c) => (
                    <tr key={c.id} className="hover:bg-secondary-50/40">
                      <td className="table-td text-secondary-500">#{c.id}</td>
                      <td className="table-td font-medium">{c.name}</td>
                      {canManage && (
                        <td className="table-td text-right">
                          <div className="inline-flex gap-1">
                            <button className="btn-ghost p-2" onClick={() => openEdit(c)} aria-label="Modifier">
                              <Pencil size={16} />
                            </button>
                            <button
                              className="btn-ghost p-2 text-error hover:bg-red-50"
                              onClick={() => setConfirmDelete(c)}
                              aria-label="Supprimer"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={data.page}
              totalPages={data.totalPages}
              totalElements={data.totalElements}
              size={data.size}
              onPageChange={setPage}
            />
          </>
        )}
      </div>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? "Modifier la catégorie" : "Nouvelle catégorie"}
        size="sm"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setFormOpen(false)}>Annuler</button>
            <button
              type="submit"
              form="category-form"
              className="btn-primary"
              disabled={createMut.isPending || updateMut.isPending}
            >
              {createMut.isPending || updateMut.isPending ? "..." : editing ? "Enregistrer" : "Créer"}
            </button>
          </>
        }
      >
        <form id="category-form" onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Nom</label>
            <input
              className="input"
              required
              minLength={2}
              maxLength={100}
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              autoFocus
            />
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        title="Supprimer la catégorie ?"
        message={`"${confirmDelete?.name}" sera supprimée. Les produits associés seront affectés.`}
        loading={deleteMut.isPending}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (confirmDelete) deleteMut.mutate(confirmDelete.id);
        }}
      />
    </>
  );
}
