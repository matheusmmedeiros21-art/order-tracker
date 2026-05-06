import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { CreateTicketBodyCategory, CreateTicketBodyPriority } from "@workspace/api-client-react";
import { useCreateTicket, useGetTicketQueuePosition, getGetTicketQueuePositionQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Monitor, Printer, Network, FileCode, Phone, HelpCircle,
  AlertCircle, ArrowRight, CheckCircle2, ArrowLeft,
  HelpingHand, ImagePlus, X, Bell, BellOff, Users, Sparkles
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

const formSchema = z.object({
  requesterName: z.string().min(2, "Nome é obrigatório"),
  requesterEmail: z.string().email("E-mail inválido").optional().or(z.literal("")),
  description: z.string().min(10, "A descrição deve ter no mínimo 10 caracteres"),
  category: z.nativeEnum(CreateTicketBodyCategory),
  priority: z.nativeEnum(CreateTicketBodyPriority),
  location: z.string().optional(),
  anydeskId: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const MAX_IMAGE_SIDE = 1600;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

async function fileToCompressedDataUrl(file: File): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error("Não foi possível carregar a imagem"));
    i.src = dataUrl;
  });

  const ratio = Math.min(1, MAX_IMAGE_SIDE / Math.max(img.width, img.height));
  const w = Math.round(img.width * ratio);
  const h = Math.round(img.height * ratio);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas não disponível");
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", 0.78);
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
        <div className="flex items-center gap-3">
          <Link href="/fila" className="text-[13px] text-[#0071E3] hover:underline">
            Ver fila
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}

export function PublicForm() {
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [createdTicketId, setCreatedTicketId] = useState<number | null>(null);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [imageProcessing, setImageProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const createTicketMutation = useCreateTicket();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      requesterName: "",
      requesterEmail: "",
      description: "",
      category: CreateTicketBodyCategory.computer,
      priority: CreateTicketBodyPriority.low,
      location: "",
      anydeskId: "",
    },
  });

  async function handleScreenshotChange(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Arquivo inválido", description: "Envie uma imagem.", variant: "destructive" });
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast({ title: "Imagem muito grande", description: "O limite é 8 MB.", variant: "destructive" });
      return;
    }
    setImageProcessing(true);
    try {
      const compressed = await fileToCompressedDataUrl(file);
      setScreenshot(compressed);
    } catch {
      toast({ title: "Erro ao processar a imagem", variant: "destructive" });
    } finally {
      setImageProcessing(false);
    }
  }

  function clearScreenshot() {
    setScreenshot(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function onSubmit(data: FormValues) {
    createTicketMutation.mutate(
      {
        data: {
          ...data,
          requesterEmail: data.requesterEmail || null,
          anydeskId: data.anydeskId?.trim() ? data.anydeskId.trim() : null,
          screenshotUrl: screenshot ?? null,
        },
      },
      {
        onSuccess: (ticket) => {
          setCreatedTicketId(ticket.id);
          try { window.localStorage.setItem("helpdesk_my_ticket", String(ticket.id)); } catch {}
          setSubmitted(true);
          toast({
            title: `Chamado #${ticket.id} aberto`,
            description: "Já estou de olho. Volto a falar logo.",
          });
        },
        onError: () => {
          toast({
            title: "Erro ao abrir chamado",
            description: "Tente novamente em instantes.",
            variant: "destructive",
          });
        },
      }
    );
  }

  const categoryIcons: Record<string, React.ReactNode> = {
    [CreateTicketBodyCategory.computer]: <Monitor className="w-5 h-5" />,
    [CreateTicketBodyCategory.printer]: <Printer className="w-5 h-5" />,
    [CreateTicketBodyCategory.network]: <Network className="w-5 h-5" />,
    [CreateTicketBodyCategory.software]: <FileCode className="w-5 h-5" />,
    [CreateTicketBodyCategory.phone]: <Phone className="w-5 h-5" />,
    [CreateTicketBodyCategory.other]: <HelpCircle className="w-5 h-5" />,
  };

  const priorityLabels: Record<string, string> = {
    [CreateTicketBodyPriority.low]: "Baixa",
    [CreateTicketBodyPriority.medium]: "Média",
    [CreateTicketBodyPriority.high]: "Alta",
    [CreateTicketBodyPriority.urgent]: "Urgente",
  };

  const categoryLabels: Record<string, string> = {
    [CreateTicketBodyCategory.computer]: "Computador",
    [CreateTicketBodyCategory.printer]: "Impressora",
    [CreateTicketBodyCategory.network]: "Rede/Internet",
    [CreateTicketBodyCategory.software]: "Sistema",
    [CreateTicketBodyCategory.phone]: "Telefonia",
    [CreateTicketBodyCategory.other]: "Outros",
  };

  return (
    <div className="min-h-screen w-full text-[#1d1d1f] flex flex-col items-center pt-32 pb-16 px-4 sm:px-6 relative overflow-hidden font-sans bg-hero-glow">
      <GlassNav />

      <div className="w-full max-w-2xl z-10">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <h1 className="text-4xl md:text-5xl font-semibold tracking-[-0.035em] text-[#1d1d1f] mb-3">
            Conta o que aconteceu.
          </h1>
          <p className="text-[#6e6e73] text-lg font-normal">
            Quanto antes você abrir, antes eu resolvo.
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {!submitted ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98, filter: "blur(4px)" }}
              transition={{ duration: 0.3 }}
            >
              <Card className="card-soft rounded-[20px] border-transparent shadow-none">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-[#1d1d1f]">Novo chamado</CardTitle>
                  <CardDescription className="text-[#6e6e73]">Preencha os detalhes do problema</CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="requesterName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Seu nome</FormLabel>
                              <FormControl>
                                <Input placeholder="Ex: Maria Silva" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="requesterEmail"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>E-mail (opcional)</FormLabel>
                              <FormControl>
                                <Input placeholder="Ex: maria@empresa.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Categoria</FormLabel>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                              {Object.values(CreateTicketBodyCategory).map((cat) => {
                                const isSelected = field.value === cat;
                                return (
                                  <motion.button
                                    type="button"
                                    key={cat}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => field.onChange(cat)}
                                    className={`relative flex flex-col items-center justify-center p-4 rounded-2xl border text-sm transition-all duration-200 ${
                                      isSelected
                                        ? "border-[#0071E3] bg-[#0071E3]/[0.06] text-[#0071E3]"
                                        : "border-black/[0.08] hover:border-black/20 hover:bg-black/[0.02] text-[#6e6e73]"
                                    }`}
                                  >
                                    <div className="mb-2">{categoryIcons[cat]}</div>
                                    <span className="font-medium">{categoryLabels[cat]}</span>
                                    {isSelected && (
                                      <motion.div
                                        layoutId="category-selection"
                                        className="absolute inset-0 rounded-2xl border-2 border-[#0071E3] pointer-events-none"
                                        initial={false}
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                      />
                                    )}
                                  </motion.button>
                                );
                              })}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="priority"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Prioridade</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione a prioridade" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Object.values(CreateTicketBodyPriority).map((pri) => (
                                  <SelectItem key={pri} value={pri}>
                                    <div className="flex items-center">
                                      <span className={`w-2 h-2 rounded-full mr-2 ${pri === 'urgent' ? 'bg-red-500' : pri === 'high' ? 'bg-orange-500' : pri === 'medium' ? 'bg-yellow-500' : 'bg-slate-400'}`} />
                                      {priorityLabels[pri]}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Local / mesa (opcional)</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: Mesa 12, 2º andar" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="anydeskId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Endereço do AnyDesk (opcional)</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Ex: 123 456 789"
                                inputMode="numeric"
                                {...field}
                                className="font-mono tracking-wider"
                              />
                            </FormControl>
                            <Link
                              href="/anydesk"
                              className="inline-flex items-center gap-1.5 text-xs text-[#0071E3] hover:underline mt-2"
                            >
                              <HelpingHand className="w-3.5 h-3.5" />
                              Não tem AnyDesk baixado? Veja como baixar
                            </Link>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Descrição do problema</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Detalhe o que está acontecendo..."
                                className="min-h-[120px] resize-none"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="space-y-2">
                        <label className="text-sm font-medium leading-none text-[#1d1d1f]">Print do erro (opcional)</label>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleScreenshotChange(e.target.files?.[0])}
                        />

                        {!screenshot ? (
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={imageProcessing}
                            className="w-full flex flex-col items-center justify-center gap-3 py-8 px-4 rounded-2xl border border-dashed border-black/[0.12] bg-[#f5f5f7]/60 hover:bg-[#f5f5f7] hover:border-[#0071E3]/40 transition-colors text-[#6e6e73] hover:text-[#1d1d1f] disabled:opacity-50"
                          >
                            <div className="w-12 h-12 rounded-full bg-[#0071E3]/10 flex items-center justify-center text-[#0071E3]">
                              <ImagePlus className="w-5 h-5" />
                            </div>
                            <div className="text-center">
                              <div className="text-sm font-medium">
                                {imageProcessing ? "Processando..." : "Clique para anexar uma imagem"}
                              </div>
                              <div className="text-xs text-[#86868b] mt-1">
                                PNG, JPG até 8 MB
                              </div>
                            </div>
                          </button>
                        ) : (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="relative rounded-2xl overflow-hidden border border-black/[0.08] bg-[#f5f5f7]"
                          >
                            <img src={screenshot} alt="Print do erro" className="w-full max-h-80 object-contain bg-white" />
                            <button
                              type="button"
                              onClick={clearScreenshot}
                              className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur-md text-[#1d1d1f] flex items-center justify-center hover:bg-white transition-colors shadow-md"
                              aria-label="Remover imagem"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </motion.div>
                        )}
                      </div>

                      <Button
                        type="submit"
                        className="w-full text-base py-6 rounded-full bg-[#0071E3] hover:bg-[#0066cc] text-white shadow-[0_4px_14px_rgba(0,113,227,0.25)]"
                        disabled={createTicketMutation.isPending || imageProcessing}
                      >
                        {createTicketMutation.isPending ? (
                          <span className="flex items-center gap-2">
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            >
                              <AlertCircle className="w-5 h-5" />
                            </motion.div>
                            Enviando...
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            Abrir chamado <ArrowRight className="w-5 h-5" />
                          </span>
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </motion.div>
          ) : createdTicketId !== null ? (
            <SuccessPanel
              ticketId={createdTicketId}
              onReset={() => {
                form.reset();
                setScreenshot(null);
                setCreatedTicketId(null);
                setSubmitted(false);
              }}
            />
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}

function SuccessPanel({ ticketId, onReset }: { ticketId: number; onReset: () => void }) {
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | "unsupported">(
    typeof window !== "undefined" && "Notification" in window ? Notification.permission : "unsupported"
  );
  const previousStatusRef = useRef<string | null>(null);
  const notifiedRef = useRef(false);

  const { data, isLoading } = useGetTicketQueuePosition(ticketId, {
    query: {
      queryKey: getGetTicketQueuePositionQueryKey(ticketId),
      refetchInterval: 6000,
      refetchIntervalInBackground: true,
    },
  });

  const status = data?.status ?? null;
  const position = data?.position ?? null;
  const totalAhead = data?.totalAhead ?? 0;

  useEffect(() => {
    if (!status) return;
    const prev = previousStatusRef.current;
    if (prev === "pending" && status === "in_progress" && !notifiedRef.current) {
      notifiedRef.current = true;
      if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
        try {
          new Notification("Sua vez chegou!", {
            body: `Chamado #${ticketId}: o suporte está cuidando do seu problema agora.`,
            tag: `ticket-${ticketId}`,
          });
        } catch {
          /* noop */
        }
      }
    }
    previousStatusRef.current = status;
  }, [status, ticketId]);

  function requestPermission() {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    Notification.requestPermission().then((p) => setNotifPermission(p));
  }

  const isInProgress = status === "in_progress";
  const isDone = status === "done";
  const isPending = status === "pending";

  return (
    <motion.div
      key="success"
      initial={{ opacity: 0, scale: 0.96, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.4, type: "spring" }}
    >
      <Card className="card-soft rounded-[20px] border-transparent shadow-none overflow-hidden">
        <div
          className={`relative px-8 pt-10 pb-12 text-center transition-colors duration-700 ${
            isInProgress
              ? "bg-gradient-to-b from-[#0071E3]/10 via-[#0071E3]/[0.04] to-transparent"
              : isDone
                ? "bg-gradient-to-b from-green-500/10 via-green-500/[0.04] to-transparent"
                : "bg-gradient-to-b from-[#0071E3]/8 via-[#0071E3]/[0.03] to-transparent"
          }`}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: "spring", bounce: 0.5 }}
            className={`inline-flex w-14 h-14 rounded-full items-center justify-center mb-5 ${
              isInProgress
                ? "bg-[#0071E3]/15 text-[#0071E3]"
                : isDone
                  ? "bg-green-500/15 text-green-600"
                  : "bg-[#0071E3]/15 text-[#0071E3]"
            }`}
          >
            {isInProgress ? <Sparkles className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
          </motion.div>

          <div className="text-[11px] uppercase tracking-[0.2em] text-[#86868b] mb-2 font-medium">Seu chamado</div>
          <div className="text-6xl md:text-7xl font-semibold tracking-[-0.04em] text-[#1d1d1f] tabular-nums">
            #{String(ticketId).padStart(3, "0")}
          </div>
          <p className="text-[#86868b] mt-3 text-sm">
            Anota esse número, é a sua referência.
          </p>
        </div>

        <CardContent className="px-8 pb-8 -mt-2">
          <AnimatePresence mode="wait">
            {isInProgress && (
              <motion.div
                key="inprogress"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-2xl border border-[#0071E3]/20 bg-[#0071E3]/[0.06] p-6 text-center"
              >
                <div className="text-2xl font-semibold text-[#0071E3] tracking-tight mb-1">
                  É a sua vez!
                </div>
                <p className="text-sm text-[#0071E3]/80">
                  O suporte já está cuidando do seu chamado agora.
                </p>
              </motion.div>
            )}

            {isDone && (
              <motion.div
                key="done"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-2xl border border-green-500/20 bg-green-500/[0.06] p-6 text-center"
              >
                <div className="text-2xl font-semibold text-green-700 tracking-tight mb-1">
                  Chamado concluído
                </div>
                <p className="text-sm text-green-700/80">
                  Tudo certo. Se voltar a dar problema, é só abrir um novo.
                </p>
              </motion.div>
            )}

            {isPending && (
              <motion.div
                key="pending"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-2xl border border-black/[0.08] bg-[#f5f5f7] p-6 text-center"
              >
                <div className="flex items-center justify-center gap-2 text-[11px] uppercase tracking-widest text-[#86868b] mb-3 font-medium">
                  <Users className="w-3.5 h-3.5" />
                  Sua posição na fila
                </div>
                <div className="text-5xl font-semibold tracking-[-0.04em] text-[#1d1d1f] tabular-nums">
                  {position ?? "—"}
                  <span className="text-2xl text-[#86868b] font-medium">º</span>
                </div>
                <p className="text-sm text-[#6e6e73] mt-3">
                  {totalAhead === 0
                    ? "Você é o próximo. Já já é a sua vez."
                    : `${totalAhead} ${totalAhead === 1 ? "chamado na frente" : "chamados na frente"}.`}
                </p>
                <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-[#86868b]">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0071E3]/60 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0071E3]" />
                  </span>
                  Atualizando automaticamente
                </div>
              </motion.div>
            )}

            {isLoading && !data && (
              <div className="rounded-2xl border border-black/[0.08] bg-[#f5f5f7] p-6 text-center text-[#86868b] text-sm">
                Carregando posição na fila...
              </div>
            )}
          </AnimatePresence>

          {/* Notification opt-in */}
          {isPending && notifPermission !== "unsupported" && (
            <div className="mt-5">
              {notifPermission === "default" && (
                <button
                  type="button"
                  onClick={requestPermission}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-[#0071E3]/20 bg-[#0071E3]/[0.06] hover:bg-[#0071E3]/10 transition-colors px-4 py-3 text-sm text-[#0071E3] font-medium"
                >
                  <Bell className="w-4 h-4" />
                  Quero ser avisado quando for a minha vez
                </button>
              )}
              {notifPermission === "granted" && (
                <div className="flex items-center justify-center gap-2 text-xs text-[#6e6e73]">
                  <Bell className="w-3.5 h-3.5 text-[#0071E3]" />
                  Vou te avisar aqui no navegador quando chegar a sua vez.
                </div>
              )}
              {notifPermission === "denied" && (
                <div className="flex items-center justify-center gap-2 text-xs text-[#86868b]">
                  <BellOff className="w-3.5 h-3.5" />
                  Notificações desativadas. Deixe esta aba aberta para acompanhar.
                </div>
              )}
            </div>
          )}

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Link href="/fila" className="flex-1">
              <Button variant="outline" className="w-full rounded-full">
                Ver a fila
              </Button>
            </Link>
            <Button
              className="flex-1 rounded-full bg-[#0071E3] hover:bg-[#0066cc] text-white"
              onClick={onReset}
            >
              Abrir outro chamado
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
