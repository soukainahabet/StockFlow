import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowDownToLine,
  Bell,
  Check,
  CheckCheck,
  ShoppingCart,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import {
  Dropdown,
  DropdownContent,
  DropdownTrigger,
} from "@/components/ui/Dropdown";
import { cn } from "@/lib/cn";
import type { NotificationResponse, NotificationType } from "@/types";
import { notificationsService } from "./notificationsService";

const REFETCH_MS = 30_000;

const TYPE_META: Record<
  NotificationType,
  { icon: typeof Bell; tone: string }
> = {
  STOCK_EXIT: { icon: ArrowDownToLine, tone: "text-warning-soft-fg bg-warning-soft" },
  NEW_SALE: { icon: ShoppingCart, tone: "text-success-soft-fg bg-success-soft" },
  LOW_STOCK: { icon: AlertTriangle, tone: "text-danger-soft-fg bg-danger-soft" },
};

export function NotificationBell() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const countQ = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: () => notificationsService.unreadCount(),
    refetchInterval: REFETCH_MS,
    refetchIntervalInBackground: false,
    staleTime: REFETCH_MS / 2,
  });

  const listQ = useQuery({
    queryKey: ["notifications", "list"],
    queryFn: () => notificationsService.list({ page: 0, size: 10 }),
    enabled: open,
    staleTime: 0,
  });

  const readMut = useMutation({
    mutationFn: (id: number) => notificationsService.markRead(id),
    onSuccess: () => invalidate(),
  });
  const readAllMut = useMutation({
    mutationFn: () => notificationsService.markAllRead(),
    onSuccess: () => invalidate(),
  });

  function invalidate() {
    void qc.invalidateQueries({ queryKey: ["notifications"] });
  }

  const unread = countQ.data?.count ?? 0;
  const items = listQ.data?.content ?? [];

  const onItemClick = (n: NotificationResponse) => {
    if (!n.read) readMut.mutate(n.id);
    if (n.linkUrl) {
      setOpen(false);
      navigate(n.linkUrl);
    }
  };

  return (
    <Dropdown open={open} onOpenChange={setOpen}>
      <DropdownTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Notifications${unread > 0 ? ` (${unread} non lue${unread > 1 ? "s" : ""})` : ""}`}
          className="relative"
        >
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span
              className={cn(
                "absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center",
                "rounded-full bg-danger text-[10px] font-semibold text-white px-1 ring-2 ring-surface",
              )}
              aria-hidden="true"
            >
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </Button>
      </DropdownTrigger>
      <DropdownContent align="end" className="w-[360px] p-0 max-h-[480px] flex flex-col">
        <header className="flex items-center justify-between px-3 py-2 border-b border-default">
          <span className="text-sm font-semibold text-primary">Notifications</span>
          <button
            type="button"
            onClick={() => readAllMut.mutate()}
            disabled={unread === 0 || readAllMut.isPending}
            className={cn(
              "inline-flex items-center gap-1 text-xs",
              unread === 0
                ? "text-disabled cursor-not-allowed"
                : "text-accent hover:underline",
            )}
          >
            <CheckCheck className="h-3 w-3" />
            Tout marquer lu
          </button>
        </header>

        <div className="flex-1 overflow-y-auto">
          {listQ.isPending && open && (
            <p className="px-3 py-6 text-xs text-muted text-center">Chargement…</p>
          )}
          {!listQ.isPending && items.length === 0 && (
            <p className="px-3 py-6 text-xs text-muted text-center">
              Aucune notification.
            </p>
          )}
          <ul className="divide-y divide-default">
            {items.map((n) => {
              const meta = TYPE_META[n.type] ?? { icon: Bell, tone: "text-secondary bg-surface-muted" };
              const Icon = meta.icon;
              return (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => onItemClick(n)}
                    className={cn(
                      "w-full flex items-start gap-2.5 px-3 py-2.5 text-left",
                      "hover:bg-surface-muted transition-colors",
                      !n.read && "bg-accent-soft/40",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
                        meta.tone,
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span
                          className={cn(
                            "block text-sm truncate",
                            n.read ? "text-secondary" : "font-medium text-primary",
                          )}
                        >
                          {n.title}
                        </span>
                        {!n.read && (
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                        )}
                      </span>
                      <span className="block text-xs text-muted line-clamp-2">
                        {n.message}
                      </span>
                      <span className="block text-[10px] text-disabled mt-0.5">
                        {formatRelative(n.createdAt)}
                      </span>
                    </span>
                    {!n.read && (
                      <span
                        className="opacity-0 group-hover:opacity-100 text-disabled"
                        aria-hidden="true"
                      >
                        <Check className="h-3 w-3" />
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </DropdownContent>
    </Dropdown>
  );
}

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffSec = Math.max(0, Math.floor((now - then) / 1000));
  if (diffSec < 60) return "À l'instant";
  if (diffSec < 3600) return `il y a ${Math.floor(diffSec / 60)} min`;
  if (diffSec < 86_400) return `il y a ${Math.floor(diffSec / 3600)} h`;
  const days = Math.floor(diffSec / 86_400);
  if (days < 7) return `il y a ${days} j`;
  return new Date(iso).toLocaleDateString();
}
