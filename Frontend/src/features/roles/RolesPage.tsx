import { useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, ShieldCheck, Lock } from "lucide-react";
import toast from "react-hot-toast";
import { PageHeader } from "@/components/ui/PageHeader";
import { Spinner } from "@/components/ui/Spinner";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Modal } from "@/components/ui/Modal";
import { rolesService, type RoleSearchParams } from "./rolesService";
import type { RoleResponse } from "@/types";

export function RolesPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(0);
  const params: RoleSearchParams = useMemo(() => ({ page, size: 10 }), [page]);

  const rolesQuery = useQuery({
    queryKey: ["roles", params],
    queryFn: () => rolesService.list(params),
  });

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<RoleResponse | null>(null);
  const [name, setName] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<RoleResponse | null>(null);

  const openCreate = () => {
    setEditing(null);
    setName("");
    setFormOpen(true);
  };
  const openEdit = (r: RoleResponse) => {
    setEditing(r);
    setName(r.name);
    setFormOpen(true);
  };

  const createMut = useMutation({
    mutationFn: (n: string) => rolesService.create({ name: n }),
    onSuccess: () => {
      toast.success("Rôle créé");
      setFormOpen(false);
      void qc.invalidateQueries({ queryKey: ["roles"] });
    },
  });
  const updateMut = useMutation({
    mutationFn: ({ id, n }: { id: number; n: string }) => rolesService.update(id, { name: n }),
    onSuccess: () => {
      toast.success("Rôle mis à jour");
      setFormOpen(false);
      void qc.invalidateQueries({ queryKey: ["roles"] });
    },
  });
  const deleteMut = useMutation({
    mutationFn: (id: number) => rolesService.remove(id),
    onSuccess: () => {
      toast.success("Rôle supprimé");
      setConfirmDelete(null);
      void qc.invalidateQueries({ queryKey: ["roles"] });
    },
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!/^[A-Z][A-Z0-9_]*$/.test(name)) {
      toast.error("Le nom doit être en MAJUSCULES, lettres/chiffres/underscores uniquement.");
      return;
    }
    if (editing) updateMut.mutate({ id: editing.id, n: name });
    else createMut.mutate(name);
  };

  const data = rolesQuery.data;

  return (
    <>
      <PageHeader
        title="Rôles"
        subtitle="Gestion des rôles applicatifs."
        actions={
          <button className="btn-primary" onClick={openCreate}>
            <Plus size={16} />
            Nouveau rôle
          </button>
        }
      />

      <div className="card overflow-hidden">
        {rolesQuery.isPending ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : !data || data.empty ? (
          <EmptyState icon={ShieldCheck} title="Aucun rôle" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="table-th">ID</th>
                    <th className="table-th">Nom</th>
                    <th className="table-th">Type</th>
                    <th className="table-th text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.content.map((r) => (
                    <tr key={r.id} className="hover:bg-secondary-50/40">
                      <td className="table-td text-secondary-500">#{r.id}</td>
                      <td className="table-td font-medium font-mono">{r.name}</td>
                      <td className="table-td">
                        {r.systemRole ? (
                          <span className="badge-warning"><Lock size={11} />Système</span>
                        ) : (
                          <span className="badge-info">Personnalisé</span>
                        )}
                      </td>
                      <td className="table-td text-right">
                        <div className="inline-flex gap-1">
                          <button
                            className="btn-ghost p-2"
                            onClick={() => openEdit(r)}
                            disabled={r.systemRole}
                            aria-label="Modifier"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            className="btn-ghost p-2 text-error hover:bg-red-50"
                            onClick={() => setConfirmDelete(r)}
                            disabled={r.systemRole}
                            aria-label="Supprimer"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
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
        title={editing ? "Renommer le rôle" : "Nouveau rôle"}
        size="sm"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setFormOpen(false)}>Annuler</button>
            <button
              type="submit"
              form="role-form"
              className="btn-primary"
              disabled={createMut.isPending || updateMut.isPending}
            >
              {createMut.isPending || updateMut.isPending ? "..." : editing ? "Enregistrer" : "Créer"}
            </button>
          </>
        }
      >
        <form id="role-form" onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Nom du rôle</label>
            <input
              className="input font-mono uppercase"
              required
              minLength={3}
              maxLength={50}
              pattern="^[A-Z][A-Z0-9_]*$"
              placeholder="AUDITOR"
              value={name}
              onChange={(e) => setName(e.target.value.toUpperCase())}
              autoFocus
            />
            <p className="mt-1 text-xs text-secondary-500">
              MAJUSCULES uniquement, peut contenir des chiffres et underscores.
            </p>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        title="Supprimer le rôle ?"
        message={`Le rôle "${confirmDelete?.name}" sera supprimé. Cette action échouera s'il est encore assigné à un utilisateur.`}
        loading={deleteMut.isPending}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (confirmDelete) deleteMut.mutate(confirmDelete.id);
        }}
      />
    </>
  );
}
