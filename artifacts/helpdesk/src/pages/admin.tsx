import { useState, useEffect, FormEvent } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Lock, ArrowLeft, AlertCircle, LogOut } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminDashboard } from "./admin-dashboard";

const AUTH_KEY = "helpdesk_admin_auth";
const ADMIN_USER = "matheusfuza123";
const ADMIN_PASS = "15224921";

function LoginScreen({ onSuccess }: { onSuccess: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    setTimeout(() => {
      if (username.trim() === ADMIN_USER && password === ADMIN_PASS) {
        localStorage.setItem(AUTH_KEY, "1");
        onSuccess();
      } else {
        setError("Usuário ou senha incorretos.");
        setLoading(false);
      }
    }, 400);
  }

  return (
    <div className="min-h-screen text-[#1d1d1f] font-sans flex items-center justify-center px-4 relative overflow-hidden bg-hero-glow">
      <div className="absolute top-6 right-6 md:top-10 md:right-12 z-10">
        <ThemeToggle />
      </div>
      <Link
        href="/"
        className="absolute top-6 left-6 md:top-10 md:left-12 flex items-center gap-2 text-sm text-[#1d1d1f]/70 hover:text-[#1d1d1f] transition-colors z-10"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-[#0071E3] flex items-center justify-center shadow-[0_8px_24px_rgba(0,113,227,0.3)] mb-6">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-[-0.035em] text-[#1d1d1f]">
            Acesso restrito
          </h1>
          <p className="text-[#6e6e73] mt-3 text-center">
            Entre para gerenciar os chamados.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="card-soft rounded-[20px] p-8"
        >
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-medium tracking-wider uppercase text-[#86868b] mb-2">
                Usuário
              </label>
              <Input
                type="text"
                autoComplete="username"
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-12 rounded-xl"
                placeholder="seu.usuario"
              />
            </div>

            <div>
              <label className="block text-xs font-medium tracking-wider uppercase text-[#86868b] mb-2">
                Senha
              </label>
              <Input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 rounded-xl"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-sm text-red-600 bg-red-500/[0.08] border border-red-500/20 rounded-lg px-3 py-2"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </motion.div>
            )}

            <Button
              type="submit"
              disabled={loading || !username || !password}
              className="w-full h-12 rounded-full bg-[#0071E3] hover:bg-[#0066cc] text-white font-medium text-base shadow-[0_4px_14px_rgba(0,113,227,0.25)] disabled:opacity-50"
            >
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </div>
        </form>

        <p className="text-center text-xs text-[#86868b] mt-6">
          Área exclusiva para a equipe de TI.
        </p>
      </motion.div>
    </div>
  );
}

export function Admin() {
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    setAuthed(localStorage.getItem(AUTH_KEY) === "1");
  }, []);

  function handleLogout() {
    localStorage.removeItem(AUTH_KEY);
    setAuthed(false);
  }

  if (authed === null) {
    return <div className="min-h-screen" />;
  }

  if (!authed) {
    return <LoginScreen onSuccess={() => setAuthed(true)} />;
  }

  return (
    <div className="relative">
      <AdminDashboard />
      <button
        onClick={handleLogout}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/80 border border-black/[0.08] backdrop-blur-xl text-sm text-[#1d1d1f] hover:bg-white transition-colors shadow-md"
        aria-label="Sair"
      >
        <LogOut className="w-4 h-4" />
        Sair
      </button>
    </div>
  );
}
