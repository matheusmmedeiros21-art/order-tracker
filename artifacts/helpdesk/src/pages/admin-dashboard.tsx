import { useState, useMemo } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  useListTickets,
  useGetTicketStats,
  useUpdateTicket,
  useDeleteTicket,
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
  MoreVertical, Trash2, FileText, ChevronDown, Check
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
  DropdownMenuRadioGroup, DropdownMenuRadioItem
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

// Shared helpers
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

export function AdminDashboard() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: stats, isLoading: statsLoading } = useGetTicketStats({
    query: { queryKey: getGetTicketStatsQueryKey(), refetchInterval: 10000 }
  });

  const { data: tickets = [], isLoading: ticketsLoading } = useListTickets(
    { status: statusFilter === "all" ? undefined : (statusFilter as any) },
    { query: { queryKey: getListTicketsQueryKey({ status: statusFilter === "all" ? undefined : (statusFilter as any) }) } }
  );

  const filteredTickets = useMemo(() => {
    if (!search) return tickets;
    const lower = search.toLowerCase();
    return tickets.filter(t => 
      t.id.toString().includes(lower) ||
      t.requesterName.toLowerCase().includes(lower) ||
      t.description.toLowerCase().includes(lower)
    );
  }, [tickets, search]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 w-full border-b bg-card/80 backdrop-blur-md">
        <div className="container mx-auto h-16 flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-md text-primary-foreground">
              <Monitor className="w-5 h-5" />
            </div>
            <span className="font-semibold text-lg tracking-tight hidden sm:inline-block">TI Admin Ops</span>
          </div>
          
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Página Pública
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto p-4 md:p-6 space-y-6">
        
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard 
            title="Total" 
            value={statsLoading ? null : stats?.total} 
            icon={<FileText className="w-4 h-4 text-slate-400" />} 
          />
          <StatCard 
            title="Pendentes" 
            value={statsLoading ? null : stats?.pending} 
            icon={<Clock className="w-4 h-4 text-yellow-400" />} 
            trend={stats?.pending && stats.pending > 5 ? "Alto volume" : undefined}
            trendColor="text-yellow-400"
          />
          <StatCard 
            title="Em Andamento" 
            value={statsLoading ? null : stats?.inProgress} 
            icon={<PlayCircle className="w-4 h-4 text-blue-400" />} 
          />
          <StatCard 
            title="Concluídos" 
            value={statsLoading ? null : stats?.done} 
            icon={<CheckCircle2 className="w-4 h-4 text-green-400" />} 
          />
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card p-4 rounded-xl border">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar chamado..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-background"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto justify-between">
                  <span className="mr-2">Status: {statusFilter === "all" ? "Todos" : statusLabels[statusFilter]}</span>
                  <ChevronDown className="w-4 h-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                <DropdownMenuRadioGroup value={statusFilter} onValueChange={setStatusFilter}>
                  <DropdownMenuRadioItem value="all">Todos</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value={TicketStatus.pending}>Pendentes</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value={TicketStatus.in_progress}>Em Andamento</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value={TicketStatus.done}>Concluídos</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Tickets List */}
        <div className="space-y-4">
          {ticketsLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="p-4">
                <div className="flex gap-4">
                  <Skeleton className="w-12 h-12 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-1/3" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </div>
              </Card>
            ))
          ) : filteredTickets.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-20 text-muted-foreground border border-dashed rounded-xl">
               <CheckCircle2 className="w-12 h-12 mb-4 text-green-500/50" />
               <p className="text-lg font-medium">Nenhum chamado encontrado</p>
               <p className="text-sm">A fila está limpa ou o filtro não retornou resultados.</p>
             </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {filteredTickets.map((ticket, index) => (
                <TicketRow 
                  key={ticket.id} 
                  ticket={ticket} 
                  index={index}
                />
              ))}
            </AnimatePresence>
          )}
        </div>
      </main>
    </div>
  );
}

function StatCard({ title, value, icon, trend, trendColor }: { title: string; value: number | null | undefined; icon: React.ReactNode, trend?: string, trendColor?: string }) {
  return (
    <Card className="overflow-hidden border-border/50 bg-card/50">
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {icon}
        </div>
        <div className="flex items-baseline gap-2">
          {value === null || value === undefined ? (
            <Skeleton className="h-9 w-16" />
          ) : (
            <h2 className="text-3xl font-bold">{value}</h2>
          )}
          {trend && (
            <span className={`text-xs font-medium ${trendColor}`}>{trend}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function TicketRow({ ticket, index }: { ticket: Ticket, index: number }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const updateTicket = useUpdateTicket();
  const deleteTicket = useDeleteTicket();

  const handleStatusChange = (newStatus: TicketStatus) => {
    updateTicket.mutate({
      id: ticket.id,
      data: { status: newStatus }
    }, {
      onSuccess: () => {
        toast({ title: "Status atualizado", description: `Chamado #${ticket.id} movido para ${statusLabels[newStatus]}` });
        queryClient.invalidateQueries({ queryKey: getListTicketsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetTicketStatsQueryKey() });
      }
    });
  };

  const handleDelete = () => {
    if (!confirm(`Tem certeza que deseja excluir o chamado #${ticket.id}?`)) return;
    deleteTicket.mutate({ id: ticket.id }, {
      onSuccess: () => {
        toast({ title: "Chamado excluído" });
        queryClient.invalidateQueries({ queryKey: getListTicketsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetTicketStatsQueryKey() });
      }
    });
  };

  const getPriorityColor = (priority: TicketPriority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'high': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'medium': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'low': return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const getStatusColor = (status: TicketStatus) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'in_progress': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'done': return 'bg-green-500/10 text-green-500 border-green-500/20';
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
    >
      <Card className="hover:border-primary/30 transition-colors group overflow-hidden">
        <div className="flex flex-col md:flex-row">
          {/* Status color bar indicator */}
          <div className={`w-1 md:w-1.5 shrink-0 ${
            ticket.status === 'pending' ? 'bg-yellow-500' :
            ticket.status === 'in_progress' ? 'bg-blue-500' : 'bg-green-500'
          }`} />
          
          <div className="flex-1 p-4 sm:p-5 flex flex-col md:flex-row gap-4 items-start md:items-center">
            {/* ID & Category Icon */}
            <div className="flex items-center gap-4 shrink-0">
              <div className="flex flex-col items-center justify-center w-12 h-12 bg-muted rounded-xl text-muted-foreground border">
                {categoryIcons[ticket.category]}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-mono font-medium text-muted-foreground">#{ticket.id.toString().padStart(4, '0')}</span>
                <span className="text-sm font-medium">{categoryLabels[ticket.category]}</span>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 min-w-0 flex flex-col gap-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-base truncate">{ticket.requesterName}</h3>
                <Badge variant="outline" className={`${getPriorityColor(ticket.priority)} whitespace-nowrap`}>
                  {priorityLabels[ticket.priority]}
                </Badge>
                <Badge variant="outline" className={`${getStatusColor(ticket.status)} whitespace-nowrap`}>
                  {statusLabels[ticket.status]}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {ticket.description}
              </p>
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground/70">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {format(new Date(ticket.createdAt), "dd/MM/yyyy HH:mm")}
                </span>
                {ticket.location && (
                  <span>• Local: {ticket.location}</span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-0 border-border/50">
              <div className="flex flex-1 md:flex-none justify-end gap-2">
                {ticket.status === 'pending' && (
                  <Button 
                    size="sm" 
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => handleStatusChange(TicketStatus.in_progress)}
                  >
                    Iniciar
                  </Button>
                )}
                {ticket.status === 'in_progress' && (
                  <Button 
                    size="sm" 
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => handleStatusChange(TicketStatus.done)}
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Concluir
                  </Button>
                )}
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="shrink-0 h-9 w-9">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Ações</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleStatusChange(TicketStatus.pending)}>
                      Marcar como Pendente
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleStatusChange(TicketStatus.in_progress)}>
                      Marcar em Andamento
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleStatusChange(TicketStatus.done)}>
                      Marcar como Concluído
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleDelete} className="text-red-500 focus:text-red-500 focus:bg-red-500/10">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Excluir Chamado
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
