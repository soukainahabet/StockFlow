import { useState, type FormEvent } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { Boxes, Mail, Lock, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "./AuthContext";

interface LocationState {
  from?: { pathname?: string };
}

export function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("admin@stockflow.com");
  const [password, setPassword] = useState("admin123");
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) {
    navigate("/dashboard", { replace: true });
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login({ email, password });
      toast.success("Connexion réussie");
      const from = (location.state as LocationState | null)?.from?.pathname ?? "/dashboard";
      navigate(from, { replace: true });
    } catch {
      // toast handled by axios interceptor
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary to-primary-800 text-white p-12 flex-col justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/15 backdrop-blur">
            <Boxes size={22} />
          </div>
          <span className="text-xl font-bold">StockFlow</span>
        </div>
        <div className="max-w-md">
          <h1 className="text-4xl font-bold leading-tight tracking-tight">
            Pilotez votre stock en temps réel.
          </h1>
          <p className="mt-4 text-primary-100 text-lg">
            Suivez vos ventes, vos produits et vos mouvements de stock dans une interface moderne et intuitive.
          </p>
        </div>
        <p className="text-sm text-primary-100">&copy; {new Date().getFullYear()} StockFlow SaaS</p>
      </div>

      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden flex items-center gap-2 justify-center">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white">
              <Boxes size={18} />
            </div>
            <span className="text-lg font-bold text-secondary-900">StockFlow</span>
          </div>
          <h2 className="text-2xl font-bold text-secondary-900">Bienvenue</h2>
          <p className="mt-1 text-sm text-secondary-500">Connectez-vous à votre espace.</p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4" noValidate>
            <div>
              <label htmlFor="email" className="label">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" />
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input pl-9"
                  placeholder="vous@exemple.com"
                />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="label">Mot de passe</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" />
                <input
                  id="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pl-9"
                  placeholder="••••••••"
                />
              </div>
            </div>
            <button type="submit" disabled={submitting} className="btn-primary w-full">
              {submitting && <Loader2 size={16} className="animate-spin" />}
              Se connecter
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-secondary-600">
            Pas encore de compte ?{" "}
            <Link to="/register" className="font-semibold text-primary hover:underline">
              Créer un compte
            </Link>
          </p>

          <div className="mt-8 rounded-lg border border-secondary-200 bg-secondary-50/50 p-3 text-xs text-secondary-600">
            <p className="font-semibold text-secondary-700 mb-1">Comptes de démo</p>
            <p>admin@stockflow.com / admin123</p>
            <p>seller@stockflow.com / seller123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
