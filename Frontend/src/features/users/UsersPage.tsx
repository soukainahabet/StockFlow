import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
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
  type BadgeProps,
  type Column,
} from "@/components/ui";
import { useAuth } from "@/features/auth/AuthContext";
import { RolePicker } from "@/features/roles/RolePicker";
import { rolesService } from "@/features/roles/rolesService";
import type { Role, UserCreateRequest, UserResponse, UserUpdateRequest } from "@/types";
import { usersService, type UserSearchParams } from "./usersService";

const EMPTY_CREATE: UserCreateRequest = {
  name: "",
  email: "",
  password: "",
  roleName: "SELLER",
};

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Administrateur",
  STOCK_MANAGER: "Gestionnaire stock",
  SELLER: "Vendeur",
  MANAGER: "Manager",
  USER: "Utilisateur",
};

const ROLE_VARIANT: Record<string, BadgeProps["variant"]> = {
  ADMIN: "accent",
  STOCK_MANAGER: "info",
  SELLER: "success",
  MANAGER: "neutral",
  USER: "neutral",
};

function initialsOf(name: string): string {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase())
      .join("") || "?"
  );
}

export function UsersPage() {
  const { user: me } = useAuth();
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

  const params: UserSearchParams = useMemo(
    () => ({ page, size: 15, search: q || undefined }),
    [page, q],
  );

  const usersQuery = useQuery({
    queryKey: ["users", params],
    queryFn: () => usersService.list(params),
  });
  const rolesQuery = useQuery({
    queryKey: ["roles", "assignable"],
    queryFn: rolesService.listAssignable,
    // Toujours rafraîchir : un rôle créé dans /roles doit apparaître ici sans rechargement de la page.
    staleTime: 0,
    refetchOnMount: "always",
  });

  const [editing, setEditing] = useState<UserResponse | null>(null);
  const [form, setForm] = useState<UserUpdateRequest>({});
  const [confirmDelete, setConfirmDelete] = useState<UserResponse | null>(null);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState<UserCreateRequest>(EMPTY_CREATE);

  useEffect(() => {
    if (editing) {
      setForm({
        name: editing.name,
        email: editing.email,
        roleName: editing.role,
      });
    } else {
      setForm({});
    }
  }, [editing]);

  const updateMut = useMutation({
    mutationFn: ({ id, body }: { id: number; body: UserUpdateRequest }) =>
      usersService.update(id, body),
    onSuccess: () => {
      toastUI.success("Utilisateur mis à jour");
      setEditing(null);
      void qc.invalidateQueries({ queryKey: ["users"] });
    },
    onError: () => toastUI.error("Mise à jour impossible"),
  });
  const createMut = useMutation({
    mutationFn: (body: UserCreateRequest) => usersService.create(body),
    onSuccess: () => {
      toastUI.success("Utilisateur créé");
      setCreating(false);
      setCreateForm(EMPTY_CREATE);
      void qc.invalidateQueries({ queryKey: ["users"] });
    },
    onError: () => toastUI.error("Création impossible"),
  });
  const deleteMut = useMutation({
    mutationFn: (id: number) => usersService.remove(id),
    onSuccess: () => {
      toastUI.success("Utilisateur supprimé");
      setConfirmDelete(null);
      void qc.invalidateQueries({ queryKey: ["users"] });
    },
    onError: () => toastUI.error("Suppression impossible"),
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const body: UserUpdateRequest = {};
    if (form.name && form.name !== editing.name) body.name = form.name;
    if (form.email && form.email !== editing.email) body.email = form.email;
    if (form.roleName && form.roleName !== editing.role)
      body.roleName = form.roleName;
    if (form.password) body.password = form.password;
    updateMut.mutate({ id: editing.id, body });
  };

  const submitCreate = (e: FormEvent) => {
    e.preventDefault();
    createMut.mutate(createForm);
  };

  const data = usersQuery.data;
  const total = data?.totalElements ?? 0;

  const columns: Column<UserResponse>[] = [
    {
      id: "user",
      header: "Utilisateur",
      cell: (u) => (
        <div className="flex items-center gap-2.5">
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-soft-fg text-[11px] font-semibold"
            aria-hidden="true"
          >
            {initialsOf(u.name)}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-primary truncate">
              {u.name}
              {me?.id === u.id && (
                <span className="ml-1.5 text-xs font-normal text-muted">
                  (vous)
                </span>
              )}
            </p>
            <p className="text-xs text-muted truncate">{u.email}</p>
          </div>
        </div>
      ),
      sortKey: "name",
    },
    {
      id: "role",
      header: "Rôle",
      cell: (u) => (
        <Badge variant={ROLE_VARIANT[u.role] ?? "neutral"}>
          {ROLE_LABEL[u.role] ?? u.role}
        </Badge>
      ),
      width: "180px",
    },
    {
      id: "id",
      header: "Réf.",
      cell: (u) => (
        <span className="font-mono text-xs text-muted">#{u.id}</span>
      ),
      width: "80px",
      hideable: true,
      defaultHidden: true,
    },
    {
      id: "actions",
      header: "",
      cell: (u) => (
        <div className="inline-flex items-center gap-0.5 justify-end" data-row-stop>
          <Tooltip content="Modifier">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setEditing(u)}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          </Tooltip>
          <Tooltip
            content={
              me?.id === u.id
                ? "Vous ne pouvez pas supprimer votre propre compte"
                : "Supprimer"
            }
          >
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setConfirmDelete(u)}
              disabled={me?.id === u.id}
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
    <div className="max-w-[1200px] mx-auto space-y-4">
      <PageHeader
        title="Utilisateurs"
        description="Gestion des comptes et de leurs rôles."
        meta={total > 0 && <Badge variant="neutral">{total}</Badge>}
        actions={
          <Button
            onClick={() => {
              setCreateForm(EMPTY_CREATE);
              setCreating(true);
            }}
          >
            <Plus className="h-3.5 w-3.5" />
            Nouvel utilisateur
          </Button>
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
          placeholder="Rechercher par nom ou email…"
          className="w-full sm:w-80"
        />
      </FilterBar>

      <DataTable<UserResponse>
        columns={columns}
        data={data?.content ?? []}
        getRowId={(u) => u.id}
        loading={usersQuery.isPending}
        rowCount={8}
        emptyTitle="Aucun utilisateur"
        emptyDescription={q ? "Ajustez votre recherche." : undefined}
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

      <Drawer open={Boolean(editing)} onOpenChange={(o) => !o && setEditing(null)}>
        <DrawerContent size="md">
          <DrawerHeader>
            <DrawerTitle>
              {editing ? `Modifier ${editing.name}` : "Modifier"}
            </DrawerTitle>
            <DrawerDescription>
              Mettez à jour les informations du compte. Laissez le mot de passe
              vide pour le conserver.
            </DrawerDescription>
          </DrawerHeader>
          <form onSubmit={submit} className="contents">
            <DrawerBody className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="user-name">Nom</Label>
                <Input
                  id="user-name"
                  minLength={2}
                  maxLength={100}
                  value={form.name ?? ""}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="user-email">Email</Label>
                <Input
                  id="user-email"
                  type="email"
                  value={form.email ?? ""}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="user-role">Rôle</Label>
                <RolePicker
                  id="user-role"
                  value={(form.roleName as Role) ?? ""}
                  onChange={(v) => setForm({ ...form, roleName: v })}
                  roles={rolesQuery.data ?? []}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="user-pwd">Nouveau mot de passe</Label>
                <Input
                  id="user-pwd"
                  type="password"
                  minLength={6}
                  maxLength={100}
                  placeholder="Laisser vide pour ne pas changer"
                  value={form.password ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value || undefined })
                  }
                />
              </div>
            </DrawerBody>
            <DrawerFooter>
              <Button type="submit" loading={updateMut.isPending}>
                Enregistrer
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setEditing(null)}
                disabled={updateMut.isPending}
              >
                Annuler
              </Button>
            </DrawerFooter>
          </form>
        </DrawerContent>
      </Drawer>

      <Drawer open={creating} onOpenChange={(o) => !o && setCreating(false)}>
        <DrawerContent size="md">
          <DrawerHeader>
            <DrawerTitle>Nouvel utilisateur</DrawerTitle>
            <DrawerDescription>
              Créez un compte avec un rôle système ou personnalisé actif.
            </DrawerDescription>
          </DrawerHeader>
          <form onSubmit={submitCreate} className="contents">
            <DrawerBody className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="create-name" required>
                  Nom
                </Label>
                <Input
                  id="create-name"
                  required
                  minLength={2}
                  maxLength={100}
                  value={createForm.name}
                  onChange={(e) =>
                    setCreateForm((p) => ({ ...p, name: e.target.value }))
                  }
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="create-email" required>
                  Email
                </Label>
                <Input
                  id="create-email"
                  type="email"
                  required
                  value={createForm.email}
                  onChange={(e) =>
                    setCreateForm((p) => ({ ...p, email: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="create-role" required>
                  Rôle
                </Label>
                <RolePicker
                  id="create-role"
                  value={createForm.roleName}
                  onChange={(v) =>
                    setCreateForm((p) => ({ ...p, roleName: v }))
                  }
                  roles={rolesQuery.data ?? []}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="create-pwd" required>
                  Mot de passe
                </Label>
                <Input
                  id="create-pwd"
                  type="password"
                  required
                  minLength={6}
                  maxLength={100}
                  value={createForm.password}
                  onChange={(e) =>
                    setCreateForm((p) => ({ ...p, password: e.target.value }))
                  }
                />
              </div>
            </DrawerBody>
            <DrawerFooter>
              <Button type="submit" loading={createMut.isPending}>
                Créer
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setCreating(false)}
                disabled={createMut.isPending}
              >
                Annuler
              </Button>
            </DrawerFooter>
          </form>
        </DrawerContent>
      </Drawer>

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        title="Supprimer l'utilisateur ?"
        message={`"${confirmDelete?.name}" sera supprimé définitivement.`}
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
