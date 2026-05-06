import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Loader2, Sparkles } from "lucide-react";
import { useAiChat, type AiChatMessage } from "@workspace/api-client-react";

const STORAGE_KEY = "helpdesk_ai_chat_history";

const INITIAL_GREETING: AiChatMessage = {
  role: "assistant",
  content:
    "Oi! Sou o assistente do Suporte TI. Posso te ajudar a abrir chamado, instalar AnyDesk ou tirar dúvidas comuns. O que você precisa?",
};

export function AiChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<AiChatMessage[]>(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [INITIAL_GREETING];
  });
  const [input, setInput] = useState("");
  const chat = useAiChat();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {}
  }, [messages]);

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  function send() {
    const text = input.trim();
    if (!text || chat.isPending) return;
    const next: AiChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    chat.mutate(
      { data: { messages: next } },
      {
        onSuccess: (r) => setMessages((curr) => [...curr, { role: "assistant", content: r.reply }]),
        onError: () =>
          setMessages((curr) => [
            ...curr,
            { role: "assistant", content: "Tive um problema agora. Tenta de novo em instantes." },
          ]),
      },
    );
  }

  return (
    <>
      <AnimatePresence>
        {!open && (
          <motion.button
            key="fab"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-6 z-50 inline-flex items-center gap-2 pl-4 pr-5 py-3 rounded-full bg-gradient-to-r from-[#0071E3] to-violet-600 text-white shadow-[0_8px_30px_rgba(0,113,227,0.35)] hover:shadow-[0_10px_40px_rgba(0,113,227,0.45)] transition-shadow"
            aria-label="Abrir assistente"
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-[13px] font-medium tracking-tight">Tirar dúvida com IA</span>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 z-50 w-[min(380px,calc(100vw-2rem))] h-[min(560px,calc(100vh-3rem))] flex flex-col rounded-[24px] overflow-hidden border border-black/[0.08] bg-white/95 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.15)]"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-black/[0.06] bg-gradient-to-r from-[#0071E3]/[0.06] to-violet-500/[0.06]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#0071E3] to-violet-600 flex items-center justify-center text-white">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="text-[13px] font-medium tracking-tight text-[#1d1d1f]">Assistente TI</p>
                  <p className="text-[10px] text-[#86868b]">Respostas rápidas com IA</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-black/[0.05] transition-colors flex items-center justify-center text-[#1d1d1f]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-relaxed whitespace-pre-wrap ${
                      m.role === "user"
                        ? "bg-[#0071E3] text-white rounded-br-md"
                        : "bg-[#f5f5f7] text-[#1d1d1f] rounded-bl-md"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {chat.isPending && (
                <div className="flex justify-start">
                  <div className="bg-[#f5f5f7] text-[#86868b] rounded-2xl rounded-bl-md px-3.5 py-2.5 inline-flex items-center gap-2 text-[13px]">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Pensando…
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-black/[0.06] p-3 bg-white">
              <div className="flex items-end gap-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  placeholder="Pergunta o que quiser…"
                  rows={1}
                  className="flex-1 resize-none rounded-2xl bg-[#f5f5f7] border-0 focus:outline-none focus:ring-2 focus:ring-[#0071E3]/30 px-4 py-2.5 text-[13.5px] max-h-32 text-[#1d1d1f] placeholder:text-[#86868b]"
                />
                <button
                  type="button"
                  onClick={send}
                  disabled={chat.isPending || !input.trim()}
                  className="w-10 h-10 shrink-0 rounded-full bg-[#0071E3] text-white flex items-center justify-center hover:bg-[#0066cc] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Enviar"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[10px] text-[#86868b] mt-2 text-center">
                Respostas geradas por IA. Pode conter erros.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <MessageCircleHidden />
    </>
  );
}

function MessageCircleHidden() {
  return <MessageCircle className="hidden" />;
}
