import { useState, useEffect, FormEvent } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Lock, ArrowLeft, AlertCircle, LogOut } from "lucide-react";
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
    <div className="min-h-screen bg-[#020617] text-white font-sans flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(59,130,246,0.18),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(99,102,241,0.12),transparent_55%)]" />

      <Link
        href="/"
        className="absolute top-6 left-6 md:top-10 md:left-12 flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors z-10"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="flex flex-col items-center mb-10">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-2xl shadow-blue-500/30 mb-6">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70">
            Acesso restrito
          </h1>
          <p className="text-slate-400 mt-3 text-center tracking-tight">
            Entre para gerenciar os chamados.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-8 shadow-2xl"
        >
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-medium tracking-wider uppercase text-slate-400 mb-2">
                Usuário
              </label>
              <Input
                type="text"
                autoComplete="username"
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 h-12 rounded-xl focus-visible:ring-blue-500"
                placeholder="seu.usuario"
              />
            </div>

            <div>
              <label className="block text-xs font-medium tracking-wider uppercase text-slate-400 mb-2">
                Senha
              </label>
              <Input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 h-12 rounded-xl focus-visible:ring-blue-500"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </motion.div>
            )}

            <Button
              type="submit"
              disabled={loading || !username || !password}
              className="w-full h-12 rounded-xl bg-white text-black hover:bg-white/90 font-medium tracking-tight text-base transition-all disabled:opacity-50"
            >
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </div>
        </form>

        <p className="text-center text-xs text-slate-500 mt-6 tracking-tight">
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
    return <div className="min-h-screen bg-[#020617]" />;
  }

  if (!authed) {
    return <LoginScreen onSuccess={() => setAuthed(true)} />;
  }

  return (
    <div className="relative">
      <AdminDashboard />
      <button
        onClick={handleLogout}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl text-sm text-slate-300 hover:bg-white/10 hover:text-white transition-colors shadow-lg"
        aria-label="Sair"
      >
        <LogOut className="w-4 h-4" />
        Sair
      </button>
    </div>
  );
}
