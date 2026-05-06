import { useEffect, useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Monitor, Printer, Network, FileCode, Phone, HelpCircle,
  Sparkles, Clock, Users, CheckCircle2, Activity
} from "lucide-react";
import { useGetPublicQueue, getGetPublicQueueQueryKey } from "@workspace/api-client-react";

const categoryIcon: Record<string, React.ReactNode> = {
  computer: <Monitor className="w-4 h-4" />,
  printer: <Printer className="w-4 h-4" />,
  network: <Network className="w-4 h-4" />,
  software: <FileCode className="w-4 h-4" />,
  phone: <Phone className="w-4 h-4" />,
  other: <HelpCircle className="w-4 h-4" />,
};

const categoryLabel: Record<string, string> = {
  computer: "Computador",
  printer: "Impressora",
  network: "Rede",
  software: "Software",
  phone: "Telefonia",
  other: "Outros",
};

const priorityStyle: Record<string, { dot: string; text: string; label: string }> = {
  urgent: { dot: "bg-red-500", text: "text-red-300", label: "Urgente" },
  high: { dot: "bg-orange-500", text: "text-orange-300", label: "Alta" },
  medium: { dot: "bg-yellow-500", text: "text-yellow-300", label: "Média" },
  low: { dot: "bg-slate-500", text: "text-slate-300", label: "Baixa" },
};

function formatWaiting(iso: string, now: number): string {
  const diffMs = Math.max(0, now - new Date(iso).getTime());
  const m = Math.floor(diffMs / 60000);
  if (m < 1) return "agora mesmo";
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rest = m % 60;
  if (h < 24) return rest ? `${h}h ${rest}min` : `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

export function QueueBoard() {
  const [now, setNow] = useState(() => Date.now());
  const [myTicketId, setMyTicketId] = useState<number | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    const stored = typeof window !== "undefined" ? window.localStorage.getItem("helpdesk_my_ticket") : null;
    if (stored) {
      const n = Number(stored);
      if (Number.isFinite(n) && n > 0) setMyTicketId(n);
    }
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  const { data, isLoading } = useGetPublicQueue({
    query: {
      queryKey: getGetPublicQueueQueryKey(),
      refetchInterval: 5000,
      refetchIntervalInBackground: true,
    },
  });

  const pending = data?.pending ?? [];
  const inProgress = data?.inProgress ?? [];
  const totals = data?.totals;

  return (
    <div className="min-h-screen bg-[#020617] text-white selection:bg-blue-500/30 overflow-x-hidden font-sans">
      <nav className="fixed top-0 w-full z-50 px-6 py-6 md:px-12 flex justify-between items-center backdrop-blur-md bg-[#020617]/60 border-b border-white/5">
        <Link href="/" className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Link>
        <div className="font-semibold text-lg tracking-tight">Central de Suporte TI</div>
        <Link href="/novo-chamado" className="text-sm tracking-tight opacity-70 hover:opacity-100 transition-opacity">
          Abrir chamado
        </Link>
      </nav>

      <section className="relative pt-36 pb-16 px-6 md:px-12 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-blue-600/15 blur-[140px] rounded-full pointer-events-none" />

        <div className="relative z-10 max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs uppercase tracking-widest text-slate-400 mb-8"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400/70 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-400" />
            </span>
            Ao vivo
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-5xl md:text-7xl lg:text-[6.5rem] font-bold tracking-tighter leading-[0.95] mb-6 text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60"
          >
            Fila de chamados.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-lg md:text-xl text-slate-400 max-w-2xl font-light tracking-tight"
          >
            Acompanhe em tempo real quem está sendo atendido e quantos chamados estão na frente.
          </motion.p>

          {/* Totals */}
          <div className="grid grid-cols-3 gap-4 md:gap-6 mt-12">
            <StatCard
              label="Em atendimento"
              value={totals?.inProgress ?? 0}
              accent="blue"
              icon={<Activity className="w-4 h-4" />}
            />
            <StatCard
              label="Na fila"
              value={totals?.pending ?? 0}
              accent="violet"
              icon={<Users className="w-4 h-4" />}
            />
            <StatCard
              label="Concluídos hoje"
              value={totals?.doneToday ?? 0}
              accent="green"
              icon={<CheckCircle2 className="w-4 h-4" />}
            />
          </div>
        </div>
      </section>

      <section className="px-6 md:px-12 pb-32">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* In progress */}
          <div className="rounded-3xl border border-blue-500/20 bg-gradient-to-br from-blue-500/[0.08] to-transparent p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-blue-300/80 mb-1">Sendo atendido</div>
                <h2 className="text-2xl font-semibold tracking-tight">Agora</h2>
              </div>
              <Sparkles className="w-5 h-5 text-blue-400" />
            </div>

            {inProgress.length === 0 ? (
              <EmptyState text="Ninguém em atendimento agora." subtle="Pode ser uma boa hora pra abrir o seu." />
            ) : (
              <div className="space-y-3">
                <AnimatePresence initial={false}>
                  {inProgress.map((t) => (
                    <QueueRow
                      key={t.id}
                      ticket={t}
                      now={now}
                      isMine={t.id === myTicketId}
                      highlight
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Pending */}
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-transparent p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-slate-400 mb-1">Próximos da fila</div>
                <h2 className="text-2xl font-semibold tracking-tight">Aguardando</h2>
              </div>
              <Users className="w-5 h-5 text-slate-400" />
            </div>

            {isLoading && pending.length === 0 ? (
              <EmptyState text="Carregando fila..." />
            ) : pending.length === 0 ? (
              <EmptyState text="A fila está vazia." subtle="Tudo em dia." />
            ) : (
              <div className="space-y-3">
                <AnimatePresence initial={false}>
                  {pending.map((t) => (
                    <QueueRow
                      key={t.id}
                      ticket={t}
                      now={now}
                      isMine={t.id === myTicketId}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>

        {myTicketId !== null && (
          <div className="max-w-6xl mx-auto mt-8 text-center text-xs text-slate-500">
            Seu chamado #{String(myTicketId).padStart(3, "0")} está destacado.
          </div>
        )}
      </section>

      <footer className="py-12 px-6 md:px-12 border-t border-slate-800/50 text-center text-slate-500 text-sm font-light">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div>Central de Suporte TI &middot; uso interno</div>
          <div>{new Date().getFullYear()}</div>
        </div>
      </footer>
    </div>
  );
}

function StatCard({
  label, value, accent, icon,
}: {
  label: string;
  value: number;
  accent: "blue" | "violet" | "green";
  icon: React.ReactNode;
}) {
  const styles: Record<string, string> = {
    blue: "border-blue-500/30 from-blue-500/15 text-blue-300",
    violet: "border-violet-500/30 from-violet-500/15 text-violet-300",
    green: "border-green-500/30 from-green-500/15 text-green-300",
  };
  return (
    <div className={`rounded-2xl border bg-gradient-to-br to-transparent p-5 md:p-6 ${styles[accent]}`}>
      <div className="flex items-center gap-2 text-xs uppercase tracking-widest opacity-80">
        {icon}
        <span className="hidden sm:inline">{label}</span>
        <span className="sm:hidden">{label.split(" ")[0]}</span>
      </div>
      <motion.div
        key={value}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-4xl md:text-5xl font-bold tracking-tighter text-white mt-2 tabular-nums"
      >
        {value}
      </motion.div>
    </div>
  );
}

function EmptyState({ text, subtle }: { text: string; subtle?: string }) {
  return (
    <div className="text-center py-12 text-slate-500">
      <div className="text-base">{text}</div>
      {subtle && <div className="text-xs mt-1 opacity-70">{subtle}</div>}
    </div>
  );
}

function QueueRow({
  ticket,
  now,
  isMine,
  highlight,
}: {
  ticket: { id: number; position: number; status: string; priority: string; category: string; firstName: string; createdAt: string };
  now: number;
  isMine?: boolean;
  highlight?: boolean;
}) {
  const pri = priorityStyle[ticket.priority] ?? priorityStyle.low;
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 220, damping: 26 }}
      className={`relative flex items-center gap-4 p-4 rounded-2xl border transition-colors ${
        isMine
          ? "border-primary/60 bg-primary/10 ring-1 ring-primary/30"
          : highlight
            ? "border-blue-500/30 bg-blue-500/[0.06]"
            : "border-white/10 bg-white/[0.03]"
      }`}
    >
      {/* Position / status */}
      <div className="flex-shrink-0 w-14 text-center">
        {ticket.status === "in_progress" ? (
          <div className="text-[10px] uppercase tracking-widest text-blue-300 font-semibold">Agora</div>
        ) : (
          <div className="text-2xl font-bold tracking-tighter tabular-nums text-white">
            {ticket.position}
            <span className="text-sm text-slate-500 font-medium">º</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-base font-medium text-white truncate">
            {ticket.firstName || "Anônimo"}
          </span>
          {isMine && (
            <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
              Você
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs text-slate-400 flex-wrap">
          <span className="inline-flex items-center gap-1">
            {categoryIcon[ticket.category]}
            {categoryLabel[ticket.category] ?? ticket.category}
          </span>
          <span className={`inline-flex items-center gap-1.5 ${pri.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${pri.dot}`} />
            {pri.label}
          </span>
          <span className="inline-flex items-center gap-1 text-slate-500">
            <Clock className="w-3 h-3" />
            {formatWaiting(ticket.createdAt, now)}
          </span>
        </div>
      </div>

      {/* Ticket id */}
      <div className="hidden sm:block text-xs font-mono text-slate-500 tabular-nums">
        #{String(ticket.id).padStart(3, "0")}
      </div>
    </motion.div>
  );
}
