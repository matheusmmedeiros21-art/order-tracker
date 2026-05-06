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
    [CreateTicketBodyCategory.computer]: <Monitor className="w-5 h-5 text-blue-400" />,
    [CreateTicketBodyCategory.printer]: <Printer className="w-5 h-5 text-orange-400" />,
    [CreateTicketBodyCategory.network]: <Network className="w-5 h-5 text-indigo-400" />,
    [CreateTicketBodyCategory.software]: <FileCode className="w-5 h-5 text-violet-400" />,
    [CreateTicketBodyCategory.phone]: <Phone className="w-5 h-5 text-green-400" />,
    [CreateTicketBodyCategory.other]: <HelpCircle className="w-5 h-5 text-slate-400" />,
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
    [CreateTicketBodyCategory.software]: "Sistema/Software",
    [CreateTicketBodyCategory.phone]: "Telefonia",
    [CreateTicketBodyCategory.other]: "Outros",
  };

  return (
    <div className="min-h-screen w-full bg-background flex flex-col items-center py-12 px-4 sm:px-6 relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

      <Link
        href="/"
        className="absolute top-6 left-6 md:top-10 md:left-12 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors z-10"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar
      </Link>

      <div className="w-full max-w-2xl z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl mb-4 text-primary ring-1 ring-primary/20">
            <Monitor className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">
            Central de Suporte TI
          </h1>
          <p className="text-muted-foreground text-lg">
            Conta o que aconteceu que eu já começo a olhar.
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {!submitted ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-border/50 bg-card/50 backdrop-blur-xl shadow-xl">
                <CardHeader>
                  <CardTitle className="text-xl">Novo Chamado</CardTitle>
                  <CardDescription>Preencha os detalhes do problema</CardDescription>
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
                              <FormLabel>Seu Nome</FormLabel>
                              <FormControl>
                                <Input placeholder="Ex: Maria Silva" {...field} className="bg-background/50" />
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
                              <FormLabel>E-mail (Opcional)</FormLabel>
                              <FormControl>
                                <Input placeholder="Ex: maria@empresa.com" {...field} className="bg-background/50" />
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
                                    className={`relative flex flex-col items-center justify-center p-4 rounded-xl border text-sm transition-all duration-200 ${
                                      isSelected
                                        ? "border-primary bg-primary/10 text-primary shadow-sm shadow-primary/20"
                                        : "border-border hover:border-border/80 hover:bg-muted/50 text-muted-foreground"
                                    }`}
                                  >
                                    <div className="mb-2">{categoryIcons[cat]}</div>
                                    <span className="font-medium">{categoryLabels[cat]}</span>
                                    {isSelected && (
                                      <motion.div
                                        layoutId="category-selection"
                                        className="absolute inset-0 rounded-xl border-2 border-primary pointer-events-none"
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
                                <SelectTrigger className="bg-background/50">
                                  <SelectValue placeholder="Selecione a prioridade" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Object.values(CreateTicketBodyPriority).map((pri) => (
                                  <SelectItem key={pri} value={pri}>
                                    <div className="flex items-center">
                                      <span className={`w-2 h-2 rounded-full mr-2 ${pri === 'urgent' ? 'bg-red-500' : pri === 'high' ? 'bg-orange-500' : pri === 'medium' ? 'bg-yellow-500' : 'bg-slate-500'}`} />
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
                            <FormLabel>Local / Mesa (Opcional)</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: Mesa 12, 2º Andar" {...field} className="bg-background/50" />
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
                            <FormLabel>Endereço do AnyDesk (Opcional)</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Ex: 123 456 789"
                                inputMode="numeric"
                                {...field}
                                className="bg-background/50 font-mono tracking-wider"
                              />
                            </FormControl>
                            <Link
                              href="/anydesk"
                              className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors mt-2"
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
                            <FormLabel>Descrição do Problema</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Detalhe o que está acontecendo..."
                                className="min-h-[120px] resize-none bg-background/50"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="space-y-2">
                        <label className="text-sm font-medium leading-none">Print do Erro (Opcional)</label>
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
                            className="w-full flex flex-col items-center justify-center gap-3 py-8 px-4 rounded-xl border border-dashed border-border bg-background/40 hover:bg-background/60 hover:border-primary/40 transition-colors text-muted-foreground hover:text-foreground disabled:opacity-50"
                          >
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                              <ImagePlus className="w-5 h-5" />
                            </div>
                            <div className="text-center">
                              <div className="text-sm font-medium">
                                {imageProcessing ? "Processando..." : "Clique para anexar uma imagem"}
                              </div>
                              <div className="text-xs text-muted-foreground/70 mt-1">
                                PNG, JPG até 8 MB
                              </div>
                            </div>
                          </button>
                        ) : (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="relative rounded-xl overflow-hidden border border-border bg-background/40"
                          >
                            <img src={screenshot} alt="Print do erro" className="w-full max-h-80 object-contain bg-black/40" />
                            <button
                              type="button"
                              onClick={clearScreenshot}
                              className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/70 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/90 transition-colors"
                              aria-label="Remover imagem"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </motion.div>
                        )}
                      </div>

                      <Button
                        type="submit"
                        className="w-full text-base py-6"
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
                            Abrir Chamado <ArrowRight className="w-5 h-5" />
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
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.4, type: "spring" }}
    >
      <Card className="border-border/50 bg-card/50 backdrop-blur-xl shadow-xl overflow-hidden">
        <div
          className={`relative px-8 pt-10 pb-12 text-center transition-colors duration-700 ${
            isInProgress
              ? "bg-gradient-to-b from-blue-500/20 via-blue-500/5 to-transparent"
              : isDone
                ? "bg-gradient-to-b from-green-500/20 via-green-500/5 to-transparent"
                : "bg-gradient-to-b from-primary/15 via-primary/5 to-transparent"
          }`}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: "spring", bounce: 0.5 }}
            className={`inline-flex w-16 h-16 rounded-full items-center justify-center mb-5 ${
              isInProgress
                ? "bg-blue-500/20 text-blue-400"
                : isDone
                  ? "bg-green-500/20 text-green-400"
                  : "bg-primary/20 text-primary"
            }`}
          >
            {isInProgress ? <Sparkles className="w-7 h-7" /> : isDone ? <CheckCircle2 className="w-7 h-7" /> : <CheckCircle2 className="w-7 h-7" />}
          </motion.div>

          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">Seu chamado</div>
          <div className="text-6xl md:text-7xl font-bold tracking-tighter text-foreground tabular-nums">
            #{String(ticketId).padStart(3, "0")}
          </div>
          <p className="text-muted-foreground mt-3 text-sm">
            Anota esse número, é a sua referência.
          </p>
        </div>

        <CardContent className="px-8 pb-8 -mt-2">
          <AnimatePresence mode="wait">
            {isInProgress && (
              <motion.div
                key="inprogress"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-6 text-center"
              >
                <div className="text-2xl font-semibold text-blue-300 tracking-tight mb-1">
                  É a sua vez!
                </div>
                <p className="text-sm text-blue-200/80">
                  O suporte já está cuidando do seu chamado agora.
                </p>
              </motion.div>
            )}

            {isDone && (
              <motion.div
                key="done"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-2xl border border-green-500/30 bg-green-500/10 p-6 text-center"
              >
                <div className="text-2xl font-semibold text-green-300 tracking-tight mb-1">
                  Chamado concluído
                </div>
                <p className="text-sm text-green-200/80">
                  Tudo certo. Se voltar a dar problema, é só abrir um novo.
                </p>
              </motion.div>
            )}

            {isPending && (
              <motion.div
                key="pending"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-2xl border border-border bg-background/40 p-6 text-center"
              >
                <div className="flex items-center justify-center gap-2 text-xs uppercase tracking-widest text-muted-foreground mb-3">
                  <Users className="w-3.5 h-3.5" />
                  Sua posição na fila
                </div>
                <div className="text-5xl font-bold tracking-tighter text-foreground tabular-nums">
                  {position ?? "—"}
                  <span className="text-2xl text-muted-foreground/60 font-medium">º</span>
                </div>
                <p className="text-sm text-muted-foreground mt-3">
                  {totalAhead === 0
                    ? "Você é o próximo. Já já é a sua vez."
                    : `${totalAhead} ${totalAhead === 1 ? "chamado na frente" : "chamados na frente"}.`}
                </p>
                <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-muted-foreground/70">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/60 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                  </span>
                  Atualizando automaticamente
                </div>
              </motion.div>
            )}

            {isLoading && !data && (
              <div className="rounded-2xl border border-border bg-background/40 p-6 text-center text-muted-foreground text-sm">
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
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/10 hover:bg-primary/20 transition-colors px-4 py-3 text-sm text-primary"
                >
                  <Bell className="w-4 h-4" />
                  Quero ser avisado quando for a minha vez
                </button>
              )}
              {notifPermission === "granted" && (
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Bell className="w-3.5 h-3.5 text-primary" />
                  Vou te avisar aqui no navegador quando chegar a sua vez.
                </div>
              )}
              {notifPermission === "denied" && (
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <BellOff className="w-3.5 h-3.5" />
                  Notificações desativadas. Deixe esta aba aberta para acompanhar.
                </div>
              )}
            </div>
          )}

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Button variant="outline" className="flex-1" onClick={onReset}>
              Abrir outro chamado
            </Button>
            <Link href="/" className="flex-1">
              <Button variant="ghost" className="w-full">
                Voltar ao início
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
