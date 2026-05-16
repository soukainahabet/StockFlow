import { ChevronRight } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/cn";

const SEGMENT_LABELS: Record<string, string> = {
  dashboard: "Tableau de bord",
  products: "Produits",
  categories: "Catégories",
  ventes: "Ventes",
  "stock-movements": "Mouvements de stock",
  users: "Utilisateurs",
  roles: "Rôles",
  new: "Nouveau",
};

function labelize(segment: string): string {
  if (SEGMENT_LABELS[segment]) return SEGMENT_LABELS[segment];
  // ID numérique → "Détail"
  if (/^\d+$/.test(segment)) return "Détail";
  return segment.charAt(0).toUpperCase() + segment.slice(1);
}

export function Breadcrumb() {
  const { pathname } = useLocation();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) return null;

  const crumbs = segments.map((seg, i) => ({
    label: labelize(seg),
    to: "/" + segments.slice(0, i + 1).join("/"),
    isLast: i === segments.length - 1,
  }));

  return (
    <nav aria-label="Fil d'Ariane" className="flex items-center min-w-0">
      <ol className="flex items-center gap-1 min-w-0">
        {crumbs.map((c, i) => (
          <li key={c.to} className="flex items-center gap-1 min-w-0">
            {i > 0 && (
              <ChevronRight
                className="h-3.5 w-3.5 text-disabled shrink-0"
                aria-hidden="true"
              />
            )}
            {c.isLast ? (
              <span
                className="text-sm font-medium text-primary truncate"
                aria-current="page"
              >
                {c.label}
              </span>
            ) : (
              <Link
                to={c.to}
                className={cn(
                  "text-sm text-muted hover:text-primary transition-colors truncate",
                  "focus-visible:outline-none focus-visible:underline",
                )}
              >
                {c.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
