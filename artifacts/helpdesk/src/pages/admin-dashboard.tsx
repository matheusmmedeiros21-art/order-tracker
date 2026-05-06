import { useState, useMemo, useEffect } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import {
  useListTickets,
  useGetTicketStats,
  useUpdateTicket,
  useDeleteTicket,
  useGetTicketAiSummary,
  TicketStatus,
  TicketCategory,
  TicketPriority,
  Ticket,
  getListTicketsQueryKey,
  getGetTicketStatsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Monitor, Printer, Network, FileCode, Phone, HelpCircle,
  Search, CheckCircle2, Clock, AlertTriangle, PlayCircle,
  MoreVertical, Trash2, FileText, ChevronDown, Check, Copy,
  Image as ImageIcon, X, Sparkles, Loader2
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
  DropdownMenuRadioGroup, DropdownMenuRadioItem
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const categoryIcons: Record<string, React.ReactNode> = {
  [TicketCategory.computer]: <Monitor className="w-4 h-4" />,
  [TicketCategory.printer]: <Printer className="w-4 h-4" />,
  [TicketCategory.network]: <Network className="w-4 h-4" />,
  [TicketCategory.software]: <FileCode className="w-4 h-4" />,
  [TicketCategory.phone]: <Phone className="w-4 h-4" />,
  [TicketCategory.other]: <HelpCircle className="w-4 h-4" />,
};

const categoryLabels: Record<string, string> = {
  [TicketCategory.computer]: "Computador",
  [TicketCategory.printer]: "Impressora",
  [TicketCategory.network]: "Rede/Internet",
  [TicketCategory.software]: "Sistema",
  [TicketCategory.phone]: "Telefonia",
  [TicketCategory.other]: "Outros",
};

const priorityLabels: Record<string, string> = {
  [TicketPriority.low]: "Baixa",
  [TicketPriority.medium]: "Média",
  [TicketPriority.high]: "Alta",
  [TicketPriority.urgent]: "Urgente",
};

const statusLabels: Record<string, string> = {
  [TicketStatus.pending]: "Pendente",
  [TicketStatus.in_progress]: "Em Andamento",
  [TicketStatus.done]: "Concluído",
};

const PRIORITY_ORDER: Record<string, number> = {
  [TicketPriority.urgent]: 0,
  [TicketPriority.high]: 1,
  [TicketPriority.medium]: 2,
  [TicketPriority.low]: 3,
};

type SortMode = "arrival" | "priority";

function GlassNav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <nav className={`nav-glass fixed top-0 inset-x-0 z-40 ${scrolled ? "is-scrolled" : ""}`}>
      <div className="max-w-7xl mx-auto px-6 md:px-10 h-12 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#0071E3] flex items-center justify-center text-white">
            <Monitor className="w-3.5 h-3.5" />
          </div>
          <span className="text-[15px] font-medium tracking-tight text-[#1d1d1f]">TI · Admin</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/" className="text-[13px] tracking-tight text-[#0071E3] hover:underline">
            Página pública
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}

export function AdminDashboard() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortMode, setSortMode] = useState<SortMode>("arrival");
  const [search, setSearch] = useState("");

  const { data: stats, isLoading: statsLoading } = useGetTicketStats({
    query: { queryKey: getGetTicketStatsQueryKey(), refetchInterval: 10000 }
  });

  const { data: tickets = [], isLoading: ticketsLoading } = useListTickets(
    { status: statusFilter === "all" ? undefined : (statusFilter as TicketStatus) },
    { query: { queryKey: getListTicketsQueryKey({ status: statusFilter === "all" ? undefined : (statusFilter as TicketStatus) }) } }
  );

  const filteredTickets = useMemo(() => {
    const lower = search.toLowerCase();
    const base = !search
      ? [...tickets]
      : tickets.filter(t =>
          t.id.toString().includes(lower) ||
          t.requesterName.toLowerCase().includes(lower) ||
          t.description.toLowerCase().includes(lower)
        );

    if (sortMode === "priority") {
      base.sort((a, b) => {
        const pa = PRIORITY_ORDER[a.priority] ?? 99;
        const pb = PRIORITY_ORDER[b.priority] ?? 99;
        if (pa !== pb) return pa - pb;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
    } else {
      base.sort((a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    }

    return base;
  }, [tickets, search, sortMode]);

  return (
    <div className="min-h-screen text-[#1d1d1f] flex flex-col font-sans">
      <GlassNav />

      <main className="flex-1 max-w-7xl w-full mx-auto pt-24 pb-32 px-6 md:px-10 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-[-0.035em] text-[#1d1d1f]">
            Chamados
          </h1>
          <p className="text-[#6e6e73] mt-2 text-[15px]">
            Visão geral da fila e gerenciamento dos chamados ativos.
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Total" value={statsLoading ? null : stats?.total} icon={<FileText className="w-4 h-4" />} accent="neutral" />
          <StatCard title="Pendentes" value={statsLoading ? null : stats?.pending} icon={<Clock className="w-4 h-4" />} accent="amber" />
          <StatCard title="Em andamento" value={statsLoading ? null : stats?.inProgress} icon={<PlayCircle className="w-4 h-4" />} accent="primary" />
          <StatCard title="Concluídos" value={statsLoading ? null : stats?.done} icon={<CheckCircle2 className="w-4 h-4" />} accent="green" />
        </div>

        {/* Tabs */}
        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
          <div className="flex items-center gap-1 p-1 bg-[#f5f5f7] rounded-full w-full sm:w-fit">
            {([
              { mode: "arrival" as SortMode, label: "Por chegada", icon: <Clock className="w-4 h-4" /> },
              { mode: "priority" as SortMode, label: "Por prioridade", icon: <AlertTriangle className="w-4 h-4" /> },
            ]).map((tab) => {
              const active = sortMode === tab.mode;
              return (
                <button
                  key={tab.mode}
                  onClick={() => setSortMode(tab.mode)}
                  className={`relative flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 text-[13px] font-medium rounded-full transition-colors ${
                    active ? "text-[#1d1d1f]" : "text-[#86868b] hover:text-[#1d1d1f]"
                  }`}
                >
                  {active && (
                    <motion.div
                      layoutId="queue-tab-bg"
                      className="absolute inset-0 bg-white shadow-sm rounded-full"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    {tab.icon}
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868b]" />
              <Input
                placeholder="Buscar chamado..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 rounded-full bg-[#f5f5f7] border-transparent focus-visible:bg-white"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="rounded-full justify-between border-black/[0.08] bg-white">
                  <span className="mr-2 text-[13px]">{statusFilter === "all" ? "Todos" : statusLabels[statusFilter]}</span>
                  <ChevronDown className="w-4 h-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                <DropdownMenuRadioGroup value={statusFilter} onValueChange={setStatusFilter}>
                  <DropdownMenuRadioItem value="all">Todos</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value={TicketStatus.pending}>Pendentes</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value={TicketStatus.in_progress}>Em andamento</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value={TicketStatus.done}>Concluídos</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Tickets List */}
        <div className="space-y-3">
          {ticketsLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card-soft rounded-[18px] p-5">
                <div className="flex gap-4">
                  <Skeleton className="w-12 h-12 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-1/3" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </div>
              </div>
            ))
          ) : filteredTickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-[#86868b] border border-dashed border-black/[0.1] rounded-[20px]">
              <CheckCircle2 className="w-12 h-12 mb-4 text-green-500/60" />
              <p className="text-lg font-medium text-[#1d1d1f]">Nenhum chamado encontrado</p>
              <p className="text-sm mt-1">A fila está limpa ou o filtro não retornou resultados.</p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {filteredTickets.map((ticket, index) => (
                <TicketRow key={ticket.id} ticket={ticket} index={index} />
              ))}
            </AnimatePresence>
          )}
        </div>
      </main>
    </div>
  );
}

const accentMap: Record<string, { text: string; bg: string }> = {
  neutral: { text: "text-[#86868b]", bg: "bg-[#f5f5f7]" },
  amber: { text: "text-[#b45309]", bg: "bg-amber-500/10" },
  primary: { text: "text-[#0071E3]", bg: "bg-[#0071E3]/10" },
  green: { text: "text-[#16a34a]", bg: "bg-green-500/10" },
};

function StatCard({
  title, value, icon, accent,
}: {
  title: string;
  value: number | null | undefined;
  icon: React.ReactNode;
  accent: keyof typeof accentMap;
}) {
  const a = accentMap[accent];
  return (
    <div className="card-soft rounded-[18px] p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[12px] font-medium uppercase tracking-widest text-[#86868b]">{title}</p>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${a.bg} ${a.text}`}>
          {icon}
        </div>
      </div>
      {value === null || value === undefined ? (
        <Skeleton className="h-9 w-16" />
      ) : (
        <h2 className="text-3xl md:text-4xl font-semibold tracking-[-0.03em] text-[#1d1d1f] tabular-nums">{value}</h2>
      )}
    </div>
  );
}

function TicketRow({ ticket, index }: { ticket: Ticket, index: number }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const updateTicket = useUpdateTicket();
  const deleteTicket = useDeleteTicket();
  const aiSummary = useGetTicketAiSummary();
  const [showImage, setShowImage] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);

  const runAiSummary = () => {
    setAiOpen(true);
    if (!aiSummary.data || aiSummary.variables?.id !== ticket.id) {
      aiSummary.mutate({ id: ticket.id });
    }
  };

  const aiSeverityLabel: Record<string, string> = {
    low: "Baixa",
    medium: "Média",
    high: "Alta",
    urgent: "Urgente",
  };
  const aiSeverityChip: Record<string, string> = {
    urgent: "bg-red-500/10 text-red-700 border-red-500/20",
    high: "bg-orange-500/10 text-orange-700 border-orange-500/20",
    medium: "bg-amber-500/10 text-amber-700 border-amber-500/20",
    low: "bg-[#f5f5f7] text-[#6e6e73] border-black/[0.06]",
  };

  const copyAnydesk = () => {
    if (!ticket.anydeskId) return;
    navigator.clipboard.writeText(ticket.anydeskId).catch(() => {});
    toast({ title: "AnyDesk copiado", description: ticket.anydeskId });
  };

  const handleStatusChange = (newStatus: TicketStatus) => {
    updateTicket.mutate({ id: ticket.id, data: { status: newStatus } }, {
      onSuccess: () => {
        toast({ title: "Status atualizado", description: `Chamado #${ticket.id} → ${statusLabels[newStatus]}` });
        queryClient.invalidateQueries({ queryKey: getListTicketsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetTicketStatsQueryKey() });
      }
    });
  };

  const handleDelete = () => {
    if (!confirm(`Excluir o chamado #${ticket.id}?`)) return;
    deleteTicket.mutate({ id: ticket.id }, {
      onSuccess: () => {
        toast({ title: "Chamado excluído" });
        queryClient.invalidateQueries({ queryKey: getListTicketsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetTicketStatsQueryKey() });
      }
    });
  };

  const priorityChip: Record<TicketPriority, string> = {
    urgent: "bg-red-500/10 text-red-700 border-red-500/20",
    high: "bg-orange-500/10 text-orange-700 border-orange-500/20",
    medium: "bg-amber-500/10 text-amber-700 border-amber-500/20",
    low: "bg-[#f5f5f7] text-[#6e6e73] border-black/[0.06]",
  };

  const statusChip: Record<TicketStatus, string> = {
    pending: "bg-amber-500/10 text-amber-700 border-amber-500/20",
    in_progress: "bg-[#0071E3]/10 text-[#0071E3] border-[#0071E3]/20",
    done: "bg-green-500/10 text-green-700 border-green-500/20",
  };

  const statusBar: Record<TicketStatus, string> = {
    pending: "bg-amber-400",
    in_progress: "bg-[#0071E3]",
    done: "bg-green-500",
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.2, delay: index * 0.04 }}
    >
      <Card className="card-soft border-transparent shadow-none rounded-[18px] overflow-hidden hover:shadow-[0_4px_24px_rgba(0,0,0,0.06)] transition-shadow">
        <div className="flex">
          <div className={`w-1 shrink-0 ${statusBar[ticket.status]}`} />
          <CardContent className="flex-1 p-5 flex flex-col md:flex-row gap-4 items-start md:items-center">
            {/* ID & Category */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-12 h-12 rounded-xl bg-[#f5f5f7] flex items-center justify-center text-[#1d1d1f]">
                {categoryIcons[ticket.category]}
              </div>
              <div className="flex flex-col">
                <span className="text-[12px] font-mono text-[#86868b] tabular-nums">
                  #{ticket.id.toString().padStart(4, '0')}
                </span>
                <span className="text-[13px] font-medium text-[#1d1d1f]">
                  {categoryLabels[ticket.category]}
                </span>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 min-w-0 flex flex-col gap-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-[15px] text-[#1d1d1f] truncate">
                  {ticket.requesterName}
                </h3>
                <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${priorityChip[ticket.priority]}`}>
                  {priorityLabels[ticket.priority]}
                </span>
                <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${statusChip[ticket.status]}`}>
                  {statusLabels[ticket.status]}
                </span>
              </div>
              <p className="text-[13px] text-[#6e6e73] line-clamp-2 mt-1">
                {ticket.description}
              </p>
              <div className="flex items-center gap-3 mt-2 text-[11px] text-[#86868b] flex-wrap">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {format(new Date(ticket.createdAt), "dd/MM/yyyy HH:mm")}
                </span>
                {ticket.location && <span>· Local: {ticket.location}</span>}
              </div>
              {(ticket.anydeskId || ticket.screenshotUrl) && (
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  {ticket.anydeskId && (
                    <button
                      type="button"
                      onClick={copyAnydesk}
                      className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#0071E3]/[0.08] border border-[#0071E3]/20 text-[#0071E3] hover:bg-[#0071E3]/15 transition-colors text-[12px] font-mono tracking-wider"
                      title="Copiar endereço AnyDesk"
                    >
                      <span className="uppercase tracking-widest text-[10px] font-sans not-italic text-[#0071E3]/70 font-medium">AnyDesk</span>
                      {ticket.anydeskId}
                      <Copy className="w-3 h-3 opacity-60" />
                    </button>
                  )}
                  {ticket.screenshotUrl && (
                    <button
                      type="button"
                      onClick={() => setShowImage(true)}
                      className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-700 hover:bg-violet-500/15 transition-colors text-[12px] font-medium"
                    >
                      <ImageIcon className="w-3 h-3" />
                      Ver print
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={runAiSummary}
                    disabled={aiSummary.isPending}
                    className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-[#0071E3]/10 to-violet-500/10 border border-[#0071E3]/25 text-[#0071E3] hover:from-[#0071E3]/15 hover:to-violet-500/15 transition-colors text-[12px] font-medium disabled:opacity-60"
                    title="Resumir o problema com IA"
                  >
                    {aiSummary.isPending && aiSummary.variables?.id === ticket.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Sparkles className="w-3 h-3" />
                    )}
                    Resumir com IA
                  </button>
                </div>
              )}

              <AnimatePresence>
                {aiOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden mt-3"
                  >
                    <div className="rounded-2xl border border-[#0071E3]/15 bg-gradient-to-br from-[#0071E3]/[0.04] to-violet-500/[0.04] p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-widest text-[#0071E3]">
                          <Sparkles className="w-3.5 h-3.5" />
                          Análise por IA
                        </div>
                        <button
                          type="button"
                          onClick={() => setAiOpen(false)}
                          className="text-[#86868b] hover:text-[#1d1d1f] transition-colors"
                          title="Fechar"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {aiSummary.isPending && (
                        <div className="flex items-center gap-2 text-[13px] text-[#6e6e73] py-2">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Analisando descrição{ticket.screenshotUrl ? " e imagem" : ""}…
                        </div>
                      )}

                      {aiSummary.isError && (
                        <div className="text-[13px] text-red-700 py-2">
                          Não consegui gerar o resumo agora. Tenta de novo em alguns segundos.
                        </div>
                      )}

                      {aiSummary.data && aiSummary.variables?.id === ticket.id && !aiSummary.isPending && (
                        <div className="space-y-3">
                          <div className="flex items-start gap-2 flex-wrap">
                            <p className="text-[14px] font-medium text-[#1d1d1f] flex-1 min-w-[200px]">
                              {aiSummary.data.summary}
                            </p>
                            <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium shrink-0 ${aiSeverityChip[aiSummary.data.severity] ?? aiSeverityChip.medium}`}>
                              IA: {aiSeverityLabel[aiSummary.data.severity] ?? aiSummary.data.severity}
                            </span>
                          </div>

                          {aiSummary.data.diagnosis && (
                            <p className="text-[13px] text-[#3a3a3c] leading-relaxed">
                              {aiSummary.data.diagnosis}
                            </p>
                          )}

                          {aiSummary.data.suggestedActions.length > 0 && (
                            <div>
                              <p className="text-[11px] font-medium uppercase tracking-widest text-[#86868b] mb-1.5">
                                Ações sugeridas
                              </p>
                              <ul className="space-y-1">
                                {aiSummary.data.suggestedActions.map((action, i) => (
                                  <li key={i} className="flex items-start gap-2 text-[13px] text-[#1d1d1f]">
                                    <span className="text-[#0071E3] mt-0.5">›</span>
                                    <span>{action}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          <p className="text-[10px] text-[#86868b] pt-1 border-t border-black/[0.04]">
                            Gerado por GPT — pode conter erros. Verifique antes de agir.
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <AnimatePresence>
              {showImage && ticket.screenshotUrl && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-6"
                  onClick={() => setShowImage(false)}
                >
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="relative max-w-5xl max-h-[90vh]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <img src={ticket.screenshotUrl} alt={`Print do chamado #${ticket.id}`} className="max-w-full max-h-[90vh] rounded-2xl shadow-2xl" />
                    <button
                      type="button"
                      onClick={() => setShowImage(false)}
                      className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-white text-[#1d1d1f] flex items-center justify-center hover:scale-110 transition-transform shadow-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Actions */}
            <div className="flex items-center gap-2 w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-0 border-black/[0.06]">
              <div className="flex flex-1 md:flex-none justify-end gap-2">
                {ticket.status === 'pending' && (
                  <Button
                    size="sm"
                    className="rounded-full bg-[#0071E3] hover:bg-[#0066cc] text-white shadow-[0_2px_8px_rgba(0,113,227,0.25)]"
                    onClick={() => handleStatusChange(TicketStatus.in_progress)}
                  >
                    Iniciar
                  </Button>
                )}
                {ticket.status === 'in_progress' && (
                  <Button
                    size="sm"
                    className="rounded-full bg-green-600 hover:bg-green-700 text-white shadow-[0_2px_8px_rgba(22,163,74,0.25)]"
                    onClick={() => handleStatusChange(TicketStatus.done)}
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Concluir
                  </Button>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="shrink-0 h-9 w-9 rounded-full hover:bg-[#f5f5f7]">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Ações</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleStatusChange(TicketStatus.pending)}>
                      Marcar como pendente
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleStatusChange(TicketStatus.in_progress)}>
                      Marcar em andamento
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleStatusChange(TicketStatus.done)}>
                      Marcar como concluído
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleDelete} className="text-red-600 focus:text-red-600 focus:bg-red-500/10">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Excluir chamado
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardContent>
        </div>
      </Card>
    </motion.div>
  );
}
