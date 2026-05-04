import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { CreateTicketBodyCategory, CreateTicketBodyPriority } from "@workspace/api-client-react";
import { useCreateTicket } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Monitor, Printer, Network, FileCode, Phone, HelpCircle, AlertCircle, ArrowRight, CheckCircle2 } from "lucide-react";

const formSchema = z.object({
  requesterName: z.string().min(2, "Nome é obrigatório"),
  requesterEmail: z.string().email("E-mail inválido").optional().or(z.literal("")),
  description: z.string().min(10, "A descrição deve ter no mínimo 10 caracteres"),
  category: z.nativeEnum(CreateTicketBodyCategory),
  priority: z.nativeEnum(CreateTicketBodyPriority),
  location: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function PublicForm() {
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
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
    },
  });

  function onSubmit(data: FormValues) {
    createTicketMutation.mutate(
      { data: { ...data, requesterEmail: data.requesterEmail || null } },
      {
        onSuccess: () => {
          setSubmitted(true);
          toast({
            title: "Chamado aberto com sucesso",
            description: "A equipe de TI já foi notificada.",
          });
        },
        onError: () => {
          toast({
            title: "Erro ao abrir chamado",
            description: "Ocorreu um erro. Tente novamente mais tarde.",
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

  const priorityColors: Record<string, string> = {
    [CreateTicketBodyPriority.low]: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    [CreateTicketBodyPriority.medium]: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    [CreateTicketBodyPriority.high]: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    [CreateTicketBodyPriority.urgent]: "bg-red-500/10 text-red-500 border-red-500/20",
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
      {/* Decorative background elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

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
            Abra um chamado e nossa equipe ajudará o mais rápido possível.
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

                      <Button
                        type="submit"
                        className="w-full text-base py-6"
                        disabled={createTicketMutation.isPending}
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
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.4, type: "spring" }}
            >
              <Card className="border-primary/20 bg-primary/5 text-center py-12">
                <CardContent className="flex flex-col items-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", bounce: 0.5 }}
                    className="w-20 h-20 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mb-6"
                  >
                    <CheckCircle2 className="w-10 h-10" />
                  </motion.div>
                  <h2 className="text-2xl font-bold text-foreground mb-3">Chamado Aberto!</h2>
                  <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                    Recebemos sua solicitação. Nossa equipe de TI já foi notificada e entrará em contato em breve.
                  </p>
                  <Button variant="outline" onClick={() => {
                    form.reset();
                    setSubmitted(false);
                  }}>
                    Abrir outro chamado
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
