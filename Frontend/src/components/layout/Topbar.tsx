import { Menu, LogOut, User as UserIcon, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/features/auth/AuthContext";

interface Props {
  onMenuClick: () => void;
}

export function Topbar({ onMenuClick }: Props) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const initials =
    user?.name
      ?.split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase())
      .join("") || "?";

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-secondary-200 bg-white px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="rounded-lg p-2 text-secondary-600 hover:bg-secondary-100 lg:hidden"
          onClick={onMenuClick}
          aria-label="Ouvrir le menu"
        >
          <Menu size={20} />
        </button>
      </div>

      <div className="relative" ref={ref}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-secondary-50"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-primary-700 font-semibold text-sm">
            {initials}
          </div>
          <div className="hidden text-left sm:block">
            <p className="text-sm font-medium text-secondary-900 leading-tight">{user?.name}</p>
            <p className="text-xs text-secondary-500 leading-tight">{user?.role}</p>
          </div>
          <ChevronDown size={16} className="text-secondary-400" />
        </button>

        {open && (
          <div className="absolute right-0 mt-2 w-56 rounded-xl border border-secondary-100 bg-white shadow-card overflow-hidden">
            <div className="px-4 py-3 border-b border-secondary-100">
              <p className="text-sm font-medium text-secondary-900 truncate">{user?.name}</p>
              <p className="text-xs text-secondary-500 truncate">{user?.email}</p>
            </div>
            <div className="py-1">
              <div className="flex items-center gap-2.5 px-4 py-2 text-sm text-secondary-700">
                <UserIcon size={15} />
                <span>{user?.role}</span>
              </div>
              <button
                type="button"
                onClick={logout}
                className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-error hover:bg-red-50"
              >
                <LogOut size={15} />
                Se déconnecter
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
