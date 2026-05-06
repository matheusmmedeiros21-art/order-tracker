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

function GlassNav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <nav className={`nav-glass fixed top-0 inset-x-0 z-50 ${scrolled ? "is-scrolled" : ""}`}>
      <div className="max-w-6xl mx-auto px-6 md:px-10 h-12 flex items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-1.5 text-[13px] text-[#1d1d1f]/80 hover:text-[#1d1d1f] transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          Voltar
        </Link>
        <Link href="/" className="text-[15px] font-medium tracking-tight text-[#1d1d1f]">
          Suporte TI
        </Link>
        <Link href="/novo-chamado" className="text-[13px] text-[#0071E3] hover:underline">
          Abrir chamado
        </Link>
      </div>
    </nav>
  );
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
    <div className="min-h-screen text-[#1d1d1f] selection:bg-[#0071E3]/15 overflow-x-hidden font-sans">
      <GlassNav />

      <section className="relative pt-32 pb-12 md:pt-40 px-6 md:px-12 bg-hero-glow">
        <div className="relative z-10 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 border border-black/[0.06] text-[11px] uppercase tracking-widest text-[#0071E3] mb-6 shadow-sm"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0071E3]/60 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0071E3]" />
            </span>
            Ao vivo
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="text-5xl md:text-7xl lg:text-[6rem] font-semibold tracking-[-0.04em] leading-[0.95] mb-4 text-[#1d1d1f]"
          >
            Fila de chamados.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="text-lg md:text-xl text-[#6e6e73] max-w-2xl font-normal"
          >
            Acompanhe em tempo real quem está sendo atendido e quantos chamados estão na frente.
          </motion.p>

          <div className="grid grid-cols-3 gap-3 md:gap-4 mt-10">
            <StatCard
              label="Em atendimento"
              value={totals?.inProgress ?? 0}
              icon={<Activity className="w-4 h-4" />}
              accent="primary"
            />
            <StatCard
              label="Na fila"
              value={totals?.pending ?? 0}
              icon={<Users className="w-4 h-4" />}
              accent="violet"
            />
            <StatCard
              label="Concluídos hoje"
              value={totals?.doneToday ?? 0}
              icon={<CheckCircle2 className="w-4 h-4" />}
              accent="green"
            />
          </div>
        </div>
      </section>

      <section className="px-6 md:px-12 pb-32 pt-10">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* In progress */}
          <div className="card-soft rounded-[20px] p-6 md:p-7">
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="text-[11px] uppercase tracking-[0.18em] text-[#0071E3] mb-1 font-medium">Sendo atendido</div>
                <h2 className="text-2xl font-semibold tracking-tight text-[#1d1d1f]">Agora</h2>
              </div>
              <Sparkles className="w-5 h-5 text-[#0071E3]" />
            </div>

            {inProgress.length === 0 ? (
              <EmptyState text="Ninguém em atendimento agora." subtle="Pode ser uma boa hora pra abrir o seu." />
            ) : (
              <div className="space-y-2.5">
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
          <div className="card-soft rounded-[20px] p-6 md:p-7">
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="text-[11px] uppercase tracking-[0.18em] text-[#86868b] mb-1 font-medium">Próximos da fila</div>
                <h2 className="text-2xl font-semibold tracking-tight text-[#1d1d1f]">Aguardando</h2>
              </div>
              <Users className="w-5 h-5 text-[#86868b]" />
            </div>

            {isLoading && pending.length === 0 ? (
              <EmptyState text="Carregando fila..." />
            ) : pending.length === 0 ? (
              <EmptyState text="A fila está vazia." subtle="Tudo em dia." />
            ) : (
              <div className="space-y-2.5">
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
          <div className="max-w-5xl mx-auto mt-6 text-center text-[12px] text-[#86868b]">
            Seu chamado #{String(myTicketId).padStart(3, "0")} está destacado.
          </div>
        )}
      </section>

      <footer className="py-10 px-6 md:px-12 border-t border-black/[0.06] text-center text-[#86868b] text-[12px]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-2">
          <div>Central de Suporte TI · uso interno</div>
          <div>{new Date().getFullYear()}</div>
        </div>
      </footer>
    </div>
  );
}

function StatCard({
  label, value, icon, accent,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent: "primary" | "violet" | "green";
}) {
  const accentClass: Record<string, string> = {
    primary: "text-[#0071E3]",
    violet: "text-[#7c3aed]",
    green: "text-[#16a34a]",
  };
  return (
    <div className="card-soft rounded-[18px] p-4 md:p-5">
      <div className={`flex items-center gap-2 text-[11px] uppercase tracking-widest font-medium ${accentClass[accent]}`}>
        {icon}
        <span className="hidden sm:inline">{label}</span>
        <span className="sm:hidden">{label.split(" ")[0]}</span>
      </div>
      <motion.div
        key={value}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl md:text-4xl font-semibold tracking-[-0.03em] text-[#1d1d1f] mt-1.5 tabular-nums"
      >
        {value}
      </motion.div>
    </div>
  );
}

function EmptyState({ text, subtle }: { text: string; subtle?: string }) {
  return (
    <div className="text-center py-10 text-[#86868b]">
      <div className="text-[15px]">{text}</div>
      {subtle && <div className="text-[12px] mt-1 opacity-80">{subtle}</div>}
    </div>
  );
}

function QueueRow({
  ticket,
  now,
  isMine,
  highlight,
}: {
  ticket: { id: number; position: number; status: string; category: string; firstName: string; createdAt: string };
  now: number;
  isMine?: boolean;
  highlight?: boolean;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ type: "spring", stiffness: 220, damping: 26 }}
      className={`relative flex items-center gap-4 p-3.5 rounded-2xl border transition-colors ${
        isMine
          ? "border-[#0071E3]/50 bg-[#0071E3]/[0.06] ring-1 ring-[#0071E3]/20"
          : highlight
            ? "border-[#0071E3]/20 bg-[#0071E3]/[0.04]"
            : "border-black/[0.06] bg-[#f5f5f7]"
      }`}
    >
      {/* Position / status */}
      <div className="flex-shrink-0 w-12 text-center">
        {ticket.status === "in_progress" ? (
          <div className="text-[10px] uppercase tracking-widest text-[#0071E3] font-semibold">Agora</div>
        ) : (
          <div className="text-2xl font-semibold tracking-tight tabular-nums text-[#1d1d1f]">
            {ticket.position}
            <span className="text-sm text-[#86868b] font-medium">º</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[15px] font-medium text-[#1d1d1f] truncate">
            {ticket.firstName || "Anônimo"}
          </span>
          {isMine && (
            <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-[#0071E3]/15 text-[#0071E3] border border-[#0071E3]/20 font-medium">
              Você
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-0.5 text-[12px] text-[#86868b] flex-wrap">
          <span className="inline-flex items-center gap-1">
            {categoryIcon[ticket.category]}
            {categoryLabel[ticket.category] ?? ticket.category}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatWaiting(ticket.createdAt, now)}
          </span>
        </div>
      </div>

      {/* Ticket id */}
      <div className="hidden sm:block text-[11px] font-mono text-[#86868b] tabular-nums">
        #{String(ticket.id).padStart(3, "0")}
      </div>
    </motion.div>
  );
}
