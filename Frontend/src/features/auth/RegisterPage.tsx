import { AlertCircle } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { landingRouteForRole } from "@/routes/landing";
import type { Role } from "@/types";
import { useAuth } from "./AuthContext";

const ROLES: { value: Role; label: string }[] = [
  { value: "SELLER", label: "Vendeur" },
  { value: "STOCK_MANAGER", label: "Gestionnaire stock" },
  { value: "MANAGER", label: "Manager" },
];

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [roleName, setRoleName] = useState<Role>("SELLER");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    setSubmitting(true);
    try {
      const stored = await register({ name, email, password, roleName });
      navigate(landingRouteForRole(stored.role), { replace: true });
    } catch {
      setError("Inscription impossible. Vérifiez vos informations.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-app px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <Logo size="xl" />
        </div>

        <div className="rounded-lg border border-default bg-surface p-6 shadow-subtle">
          <h1 className="text-lg font-semibold text-primary">
            Créer un compte
          </h1>
          <p className="mt-1 text-sm text-muted">
            Inscrivez-vous pour accéder à la plateforme.
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
              <Label htmlFor="name" required>
                Nom complet
              </Label>
              <Input
                id="name"
                required
                minLength={2}
                maxLength={100}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" required>
                Email
              </Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@exemple.com"
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
                minLength={6}
                maxLength={100}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Au moins 6 caractères"
              />
            </div>

            <div className="space-y-1.5">
              <Label required>Rôle</Label>
              <Select
                value={roleName}
                onValueChange={(v) => setRoleName(v as Role)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" loading={submitting} className="w-full">
              Créer mon compte
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-muted">
            Déjà inscrit ?{" "}
            <Link
              to="/login"
              className="font-medium text-accent hover:underline"
            >
              Se connecter
            </Link>
          </p>
        </div>

        <p className="mt-6 text-center text-[11px] text-disabled">
          &copy; {new Date().getFullYear()} StockFlow SaaS
        </p>
      </div>
    </div>
  );
}
