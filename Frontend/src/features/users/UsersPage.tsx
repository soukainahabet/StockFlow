import { useMemo, useState, useEffect, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2, Search, Users as UsersIcon } from "lucide-react";
import toast from "react-hot-toast";
import { PageHeader } from "@/components/ui/PageHeader";
import { Spinner } from "@/components/ui/Spinner";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Modal } from "@/components/ui/Modal";
import { usersService, type UserSearchParams } from "./usersService";
import { rolesService } from "@/features/roles/rolesService";
import { useAuth } from "@/features/auth/AuthContext";
import type { Role, UserResponse, UserUpdateRequest } from "@/types";

export function UsersPage() {
  const { user: me } = useAuth();
  const qc = useQueryClient();

  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const params: UserSearchParams = useMemo(
    () => ({ page, size: 10, search: search || undefined }),
    [page, search],
  );

  const usersQuery = useQuery({
    queryKey: ["users", params],
    queryFn: () => usersService.list(params),
  });
  const rolesQuery = useQuery({ queryKey: ["roles", "all"], queryFn: rolesService.listAll });

  const [editing, setEditing] = useState<UserResponse | null>(null);
  const [form, setForm] = useState<UserUpdateRequest>({});
  const [confirmDelete, setConfirmDelete] = useState<UserResponse | null>(null);

  useEffect(() => {
    if (editing) {
      setForm({ name: editing.name, email: editing.email, roleName: editing.role });
    } else {
      setForm({});
    }
  }, [editing]);

  const updateMut = useMutation({
    mutationFn: ({ id, body }: { id: number; body: UserUpdateRequest }) =>
      usersService.update(id, body),
    onSuccess: () => {
      toast.success("Utilisateur mis à jour");
      setEditing(null);
      void qc.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => usersService.remove(id),
    onSuccess: () => {
      toast.success("Utilisateur supprimé");
      setConfirmDelete(null);
      void qc.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const body: UserUpdateRequest = {};
    if (form.name && form.name !== editing.name) body.name = form.name;
    if (form.email && form.email !== editing.email) body.email = form.email;
    if (form.roleName && form.roleName !== editing.role) body.roleName = form.roleName;
    if (form.password) body.password = form.password;
    updateMut.mutate({ id: editing.id, body });
  };

  const data = usersQuery.data;

  return (
    <>
      <PageHeader title="Utilisateurs" subtitle="Gestion des comptes (ADMIN uniquement)." />

      <div className="card p-4 mb-4">
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" />
          <input
            className="input pl-9"
            placeholder="Rechercher par nom ou email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
          />
        </div>
      </div>

      <div className="card overflow-hidden">
        {usersQuery.isPending ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : !data || data.empty ? (
          <EmptyState icon={UsersIcon} title="Aucun utilisateur" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="table-th">ID</th>
                    <th className="table-th">Nom</th>
                    <th className="table-th">Email</th>
                    <th className="table-th">Rôle</th>
                    <th className="table-th text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.content.map((u) => (
                    <tr key={u.id} className="hover:bg-secondary-50/40">
                      <td className="table-td text-secondary-500">#{u.id}</td>
                      <td className="table-td font-medium">{u.name}</td>
                      <td className="table-td">{u.email}</td>
                      <td className="table-td"><span className="badge-info">{u.role}</span></td>
                      <td className="table-td text-right">
                        <div className="inline-flex gap-1">
                          <button className="btn-ghost p-2" onClick={() => setEditing(u)} aria-label="Modifier">
                            <Pencil size={16} />
                          </button>
                          <button
                            className="btn-ghost p-2 text-error hover:bg-red-50"
                            onClick={() => setConfirmDelete(u)}
                            disabled={u.id === me?.id}
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
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing ? `Modifier ${editing.name}` : ""}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setEditing(null)}>Annuler</button>
            <button type="submit" form="user-form" className="btn-primary" disabled={updateMut.isPending}>
              {updateMut.isPending ? "..." : "Enregistrer"}
            </button>
          </>
        }
      >
        <form id="user-form" onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Nom</label>
            <input
              className="input"
              minLength={2}
              maxLength={100}
              value={form.name ?? ""}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              className="input"
              value={form.email ?? ""}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Rôle</label>
            <select
              className="input"
              value={form.roleName ?? ""}
              onChange={(e) => setForm({ ...form, roleName: e.target.value as Role })}
            >
              {(rolesQuery.data ?? []).map((r) => (
                <option key={r.id} value={r.name}>{r.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Nouveau mot de passe (optionnel)</label>
            <input
              type="password"
              className="input"
              minLength={6}
              maxLength={100}
              placeholder="Laisser vide pour ne pas changer"
              value={form.password ?? ""}
              onChange={(e) => setForm({ ...form, password: e.target.value || undefined })}
            />
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        title="Supprimer l'utilisateur ?"
        message={`"${confirmDelete?.name}" sera supprimé définitivement.`}
        loading={deleteMut.isPending}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (confirmDelete) deleteMut.mutate(confirmDelete.id);
        }}
      />
    </>
  );
}
