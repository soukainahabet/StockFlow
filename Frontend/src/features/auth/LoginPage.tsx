import { AlertCircle, ChevronDown } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { cn } from "@/lib/cn";
import { landingRouteForRole } from "@/routes/landing";
import { useAuth } from "./AuthContext";

interface LocationState {
  from?: { pathname?: string };
}

const DEMO_ACCOUNTS = [
  { email: "admin@stockflow.com", password: "admin123", role: "ADMIN" },
  { email: "stock@stockflow.com", password: "stock123", role: "STOCK_MANAGER" },
  { email: "seller@stockflow.com", password: "seller123", role: "SELLER" },
  { email: "manager@stockflow.com", password: "manager123", role: "MANAGER" },
];

export function LoginPage() {
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demoOpen, setDemoOpen] = useState(false);

  if (isAuthenticated) {
    navigate(landingRouteForRole(user?.role), { replace: true });
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const stored = await login({ email, password });
      const from =
        (location.state as LocationState | null)?.from?.pathname ??
        landingRouteForRole(stored.role);
      navigate(from, { replace: true });
    } catch {
      setError(
        "Email ou mot de passe incorrect. Vérifiez vos identifiants et réessayez.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const useDemo = (acc: (typeof DEMO_ACCOUNTS)[number]) => {
    setEmail(acc.email);
    setPassword(acc.password);
    setError(null);
  };

  const isDev = import.meta.env.DEV;

  return (
    <div className="min-h-screen flex items-center justify-center bg-app px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="flex justify-center mb-8">
          <Logo size="xl" />
        </div>

        {/* Card */}
        <div className="rounded-lg border border-default bg-surface p-6 shadow-subtle">
          <h1 className="text-lg font-semibold text-primary">
            Connectez-vous à votre espace
          </h1>
          <p className="mt-1 text-sm text-muted">
            Renseignez vos identifiants pour accéder au tableau de bord.
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-md bg-danger-soft text-danger-soft-fg px-3 py-2 text-sm ring-1 ring-inset ring-danger/20"
              >
                <AlertCircle
                  className="h-4 w-4 mt-0.5 shrink-0"
                  aria-hidden="true"
                />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" required>
                Email
              </Label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@exemple.com"
                invalid={Boolean(error)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" required>
                Mot de passe
              </Label>
              <Input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                invalid={Boolean(error)}
              />
            </div>

            <Button
              type="submit"
              loading={submitting}
              className="w-full"
              size="md"
            >
              Se connecter
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-muted">
            Pas encore de compte ?{" "}
            <Link
              to="/register"
              className="font-medium text-accent hover:underline"
            >
              Créer un compte
            </Link>
          </p>
        </div>

        {/* Comptes de démo — dev uniquement */}
        {isDev && (
          <details
            className="mt-4 rounded-md border border-default bg-surface text-xs"
            open={demoOpen}
            onToggle={(e) => setDemoOpen((e.target as HTMLDetailsElement).open)}
          >
            <summary
              className={cn(
                "flex items-center justify-between px-3 py-2 cursor-pointer select-none",
                "text-muted hover:text-primary transition-colors",
                "marker:hidden [&::-webkit-details-marker]:hidden",
              )}
            >
              <span className="font-medium">Comptes de démo (dev)</span>
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 transition-transform",
                  demoOpen && "rotate-180",
                )}
                aria-hidden="true"
              />
            </summary>
            <ul className="border-t border-default divide-y divide-default">
              {DEMO_ACCOUNTS.map((acc) => (
                <li key={acc.email}>
                  <button
                    type="button"
                    onClick={() => useDemo(acc)}
                    className={cn(
                      "w-full text-left px-3 py-2",
                      "hover:bg-surface-muted/70 transition-colors",
                      "focus-visible:outline-none focus-visible:bg-surface-muted",
                      "flex items-center justify-between gap-2",
                    )}
                  >
                    <span className="font-mono text-secondary">{acc.email}</span>
                    <span className="text-disabled font-mono">{acc.role}</span>
                  </button>
                </li>
              ))}
            </ul>
          </details>
        )}

        <p className="mt-6 text-center text-[11px] text-disabled">
          &copy; {new Date().getFullYear()} StockFlow SaaS
        </p>
      </div>
    </div>
  );
}
