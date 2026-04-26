import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Boxes, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "./AuthContext";
import type { Role } from "@/types";

const ROLES: Role[] = ["SELLER", "STOCK_MANAGER", "MANAGER"];

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [roleName, setRoleName] = useState<Role>("SELLER");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    setSubmitting(true);
    try {
      await register({ name, email, password, roleName });
      toast.success("Compte créé avec succès");
      navigate("/dashboard", { replace: true });
    } catch {
      // handled by interceptor
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md card p-8">
        <div className="flex items-center gap-2 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white">
            <Boxes size={20} />
          </div>
          <span className="text-lg font-bold text-secondary-900">StockFlow</span>
        </div>
        <h1 className="text-2xl font-bold text-secondary-900">Créer un compte</h1>
        <p className="mt-1 text-sm text-secondary-500">
          Inscrivez-vous pour commencer à utiliser la plateforme.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
          <div>
            <label htmlFor="name" className="label">Nom complet</label>
            <input
              id="name"
              type="text"
              required
              minLength={2}
              maxLength={100}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              placeholder="John Doe"
            />
          </div>
          <div>
            <label htmlFor="email" className="label">Email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              placeholder="vous@exemple.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="label">Mot de passe</label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              maxLength={100}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              placeholder="Au moins 6 caractères"
            />
          </div>
          <div>
            <label htmlFor="role" className="label">Rôle</label>
            <select
              id="role"
              value={roleName}
              onChange={(e) => setRoleName(e.target.value as Role)}
              className="input"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting && <Loader2 size={16} className="animate-spin" />}
            Créer mon compte
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-secondary-600">
          Déjà inscrit ?{" "}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
