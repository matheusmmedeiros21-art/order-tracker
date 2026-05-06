import { Router, type IRouter } from "express";
import { eq, desc, ne } from "drizzle-orm";
import { db, ticketsTable } from "@workspace/db";
import OpenAI from "openai";
import {
  AiClassifyTicketBody as AiClassifyBody,
  AiClassifyTicketResponse as AiClassifyResult,
  AiImproveDescriptionBody as AiImproveBody,
  AiImproveDescriptionResponse as AiImproveResult,
  AiFindDuplicatesBody,
  AiFindDuplicatesResponse as AiFindDuplicatesResult,
  GetTicketAiSuggestedReplyResponse as AiSuggestedReply,
  AiGetInsightsResponse as AiInsights,
  AiChatBody,
  AiChatResponse as AiChatResult,
  GetTicketAiSuggestedReplyParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MODEL = "gpt-4o-mini";
const MODEL_VISION = "gpt-4o";

const CATEGORIES = ["computer", "printer", "network", "software", "phone", "other"] as const;
const PRIORITIES = ["low", "medium", "high", "urgent"] as const;

const CATEGORY_PT: Record<string, string> = {
  computer: "Computador",
  printer: "Impressora",
  network: "Rede/Internet",
  software: "Sistema/Software",
  phone: "Telefonia",
  other: "Outros",
};

function safeJson<T = Record<string, unknown>>(raw: string | null | undefined): T {
  if (!raw) return {} as T;
  try {
    return JSON.parse(raw.trim()) as T;
  } catch {
    return {} as T;
  }
}

function pickEnum<T extends readonly string[]>(value: unknown, allowed: T, fallback: T[number]): T[number] {
  return (allowed as readonly string[]).includes(String(value)) ? (value as T[number]) : fallback;
}

router.post("/ai/classify", async (req, res): Promise<void> => {
  const body = AiClassifyBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const userParts: Array<
    { type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }
  > = [{ type: "text", text: `Descrição do usuário (pode estar mal escrita ou informal):\n${body.data.description}` }];
  if (body.data.screenshotUrl) {
    userParts.push({ type: "image_url", image_url: { url: body.data.screenshotUrl } });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: body.data.screenshotUrl ? MODEL_VISION : MODEL,
      max_tokens: 400,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `Você classifica chamados de suporte de TI. Responda em JSON com:
- category: uma de [computer, printer, network, software, phone, other]
- priority: uma de [low, medium, high, urgent] (urgent = sistema crítico fora; high = vários usuários; medium = 1 usuário travado; low = cosmético/dúvida)
- suggestedTitle: título curto em PT-BR (máx 60 chars), começando com letra maiúscula, sem ponto final
- reasoning: 1 frase curta em PT-BR explicando a escolha
Responda APENAS JSON válido.`,
        },
        { role: "user", content: userParts },
      ],
    });
    const parsed = safeJson<{ category?: string; priority?: string; suggestedTitle?: string; reasoning?: string }>(
      completion.choices[0]?.message?.content,
    );
    res.json(
      AiClassifyResult.parse({
        category: pickEnum(parsed.category, CATEGORIES, "other"),
        priority: pickEnum(parsed.priority, PRIORITIES, "medium"),
        suggestedTitle: String(parsed.suggestedTitle ?? "").slice(0, 80) || "Chamado de suporte",
        reasoning: String(parsed.reasoning ?? ""),
      }),
    );
  } catch (err) {
    req.log.error({ err }, "AI classify failed");
    res.status(502).json({ error: "Falha ao classificar com IA" });
  }
});

router.post("/ai/improve-description", async (req, res): Promise<void> => {
  const body = AiImproveBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const text = body.data.text.trim();
  if (text.length < 3) {
    res.json(AiImproveResult.parse({ improved: text }));
    return;
  }

  try {
    const completion = await openai.chat.completions.create({
      model: MODEL,
      max_tokens: 400,
      temperature: 0.4,
      messages: [
        {
          role: "system",
          content: `Você reescreve descrições de chamados de TI em PT-BR. Mantenha o sentido original, mas:
- Corrija ortografia e pontuação
- Use linguagem clara e objetiva (não muito formal)
- Inclua sintomas observáveis se já estiverem implícitos
- Não invente informações que o usuário não escreveu
- Máx 3 frases curtas
Responda APENAS com o texto reescrito, sem aspas, sem markdown, sem prefixos como "Reescrito:".`,
        },
        { role: "user", content: text },
      ],
    });
    const improved = (completion.choices[0]?.message?.content ?? "").trim().replace(/^["']|["']$/g, "");
    res.json(AiImproveResult.parse({ improved: improved || text }));
  } catch (err) {
    req.log.error({ err }, "AI improve failed");
    res.status(502).json({ error: "Falha ao melhorar descrição" });
  }
});

router.post("/ai/find-duplicates", async (req, res): Promise<void> => {
  const body = AiFindDuplicatesBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const openTickets = await db
    .select({
      id: ticketsTable.id,
      requesterName: ticketsTable.requesterName,
      description: ticketsTable.description,
      category: ticketsTable.category,
      status: ticketsTable.status,
      createdAt: ticketsTable.createdAt,
    })
    .from(ticketsTable)
    .where(ne(ticketsTable.status, "done"))
    .orderBy(desc(ticketsTable.createdAt))
    .limit(30);

  if (openTickets.length === 0) {
    res.json(AiFindDuplicatesResult.parse({ matches: [] }));
    return;
  }

  const candidates = openTickets.map((t) => ({
    id: t.id,
    category: t.category,
    description: t.description.slice(0, 280),
  }));

  try {
    const completion = await openai.chat.completions.create({
      model: MODEL,
      max_tokens: 600,
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `Você detecta chamados de TI duplicados ou muito parecidos. Recebe um chamado novo e uma lista de chamados em aberto.
Retorne JSON: { "matches": [ { "ticketId": number, "score": number entre 0 e 1, "reason": "frase curta em PT-BR sem citar nome de pessoas" } ] }.
Inclua APENAS chamados com score >= 0.7. Máx 3 matches. Se nada parecido, retorne { "matches": [] }.
Considere similaridade semântica, não só palavras iguais. Nunca repita ou invente nomes de usuários.`,
        },
        {
          role: "user",
          content: `Chamado novo:
Categoria: ${body.data.category ?? "não informada"}
Descrição: ${body.data.description}

Chamados em aberto:
${JSON.stringify(candidates, null, 2)}`,
        },
      ],
    });
    const parsed = safeJson<{ matches?: Array<{ ticketId?: number; score?: number; reason?: string }> }>(
      completion.choices[0]?.message?.content,
    );
    const rawMatches = Array.isArray(parsed.matches) ? parsed.matches : [];
    const matches = rawMatches
      .map((m) => {
        const t = openTickets.find((tk) => tk.id === Number(m.ticketId));
        if (!t) return null;
        const score = Math.max(0, Math.min(1, Number(m.score) || 0));
        if (score < 0.7) return null;
        const firstName = String(t.requesterName).trim().split(/\s+/)[0] ?? "";
        return {
          ticketId: t.id,
          requesterName: firstName,
          descriptionExcerpt: t.description.slice(0, 160),
          status: t.status,
          score,
          reason: String(m.reason ?? "").slice(0, 200),
        };
      })
      .filter((m): m is NonNullable<typeof m> => !!m)
      .slice(0, 3);

    res.json(AiFindDuplicatesResult.parse({ matches }));
  } catch (err) {
    req.log.error({ err }, "AI duplicates failed");
    res.status(502).json({ error: "Falha ao buscar duplicatas" });
  }
});

router.post("/tickets/:id/ai-suggest-reply", async (req, res): Promise<void> => {
  const params = GetTicketAiSuggestedReplyParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [ticket] = await db.select().from(ticketsTable).where(eq(ticketsTable.id, params.data.id));
  if (!ticket) {
    res.status(404).json({ error: "Chamado não encontrado" });
    return;
  }

  try {
    const completion = await openai.chat.completions.create({
      model: MODEL,
      max_tokens: 400,
      temperature: 0.5,
      messages: [
        {
          role: "system",
          content: `Você é um técnico de TI escrevendo uma mensagem curta e amigável em PT-BR para o usuário que abriu o chamado.
Tom: profissional, próximo, direto. Trate por "você" (não "senhor/senhora"). Sem markdown.
Estrutura: 1) cumprimento curto pelo primeiro nome, 2) o que você vai fazer ou pedir agora, 3) próximo passo claro (ex: "tenta isso e me avisa", ou "vou conectar pelo AnyDesk às 14h").
Máximo 4 frases.`,
        },
        {
          role: "user",
          content: `Nome: ${ticket.requesterName}
Categoria: ${CATEGORY_PT[ticket.category] ?? ticket.category}
Status atual: ${ticket.status}
Descrição: ${ticket.description}
${ticket.location ? `Local: ${ticket.location}` : ""}
${ticket.anydeskId ? `AnyDesk: ${ticket.anydeskId}` : ""}`,
        },
      ],
    });
    const reply = (completion.choices[0]?.message?.content ?? "").trim();
    res.json(AiSuggestedReply.parse({ ticketId: ticket.id, reply }));
  } catch (err) {
    req.log.error({ err }, "AI reply failed");
    res.status(502).json({ error: "Falha ao gerar resposta" });
  }
});

router.get("/ai/insights", async (req, res): Promise<void> => {
  const recent = await db
    .select({
      id: ticketsTable.id,
      requesterName: ticketsTable.requesterName,
      description: ticketsTable.description,
      category: ticketsTable.category,
      priority: ticketsTable.priority,
      status: ticketsTable.status,
      location: ticketsTable.location,
      createdAt: ticketsTable.createdAt,
    })
    .from(ticketsTable)
    .orderBy(desc(ticketsTable.createdAt))
    .limit(40);

  if (recent.length === 0) {
    res.json(
      AiInsights.parse({
        generatedAt: new Date().toISOString(),
        headline: "Sem chamados recentes para analisar.",
        items: [],
      }),
    );
    return;
  }

  const compact = recent.map((t) => ({
    id: t.id,
    cat: t.category,
    pri: t.priority,
    st: t.status,
    loc: t.location ?? null,
    desc: t.description.slice(0, 160),
    at: t.createdAt instanceof Date ? t.createdAt.toISOString() : String(t.createdAt),
  }));

  try {
    const completion = await openai.chat.completions.create({
      model: MODEL,
      max_tokens: 700,
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `Você é um analista de operações de TI. Analise os chamados recentes e devolva insights úteis pro admin em PT-BR.
JSON: { "headline": "uma linha resumindo o momento atual (máx 90 chars)", "items": [ { "kind": "trend"|"alert"|"suggestion"|"summary", "title": "curto", "body": "1-2 frases", "ticketIds": [opcional, números reais] } ] }.
Foque em: surtos por categoria/local, chamados urgentes parados, padrões repetidos, oportunidades de FAQ. Máx 4 items, não invente IDs.`,
        },
        { role: "user", content: `Chamados recentes (mais novos primeiro):\n${JSON.stringify(compact)}` },
      ],
    });
    const parsed = safeJson<{
      headline?: string;
      items?: Array<{ kind?: string; title?: string; body?: string; ticketIds?: unknown }>;
    }>(completion.choices[0]?.message?.content);

    const allowedKinds = ["trend", "alert", "suggestion", "summary"] as const;
    const validIds = new Set(recent.map((t) => t.id));
    const items = (Array.isArray(parsed.items) ? parsed.items : [])
      .map((it) => ({
        kind: pickEnum(it.kind, allowedKinds, "summary"),
        title: String(it.title ?? "").slice(0, 100),
        body: String(it.body ?? "").slice(0, 400),
        ticketIds: Array.isArray(it.ticketIds)
          ? it.ticketIds
              .map((x) => Number(x))
              .filter((n) => Number.isFinite(n) && validIds.has(n))
              .slice(0, 8)
          : [],
      }))
      .filter((it) => it.title && it.body)
      .slice(0, 4);

    res.json(
      AiInsights.parse({
        generatedAt: new Date().toISOString(),
        headline: String(parsed.headline ?? "Resumo da operação").slice(0, 120),
        items,
      }),
    );
  } catch (err) {
    req.log.error({ err }, "AI insights failed");
    res.status(502).json({ error: "Falha ao gerar insights" });
  }
});

router.post("/ai/chat", async (req, res): Promise<void> => {
  const body = AiChatBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const messages = body.data.messages.slice(-12).map((m) => ({
    role: m.role as "user" | "assistant",
    content: String(m.content).slice(0, 2000),
  }));

  try {
    const completion = await openai.chat.completions.create({
      model: MODEL,
      max_tokens: 500,
      temperature: 0.4,
      messages: [
        {
          role: "system",
          content: `Você é o assistente do HelpDesk interno (PT-BR). Responda dúvidas sobre:
- Como abrir um chamado em /novo-chamado (precisa nome, descrição, categoria, prioridade; print e AnyDesk são opcionais)
- Como instalar e usar o AnyDesk (ver tutorial em /anydesk: baixar do site oficial, abrir, copiar o ID de 9 dígitos, passar pro suporte)
- Como acompanhar a fila em /fila (atualiza sozinho a cada 5 segundos)
- Problemas comuns de TI (computador não liga, impressora travada, internet caindo, esqueci senha, etc)
Tom amigável, direto, sem markdown pesado. Máximo 4 frases por resposta. Se não souber, diga que vai precisar abrir um chamado.`,
        },
        ...messages,
      ],
    });
    res.json(AiChatResult.parse({ reply: (completion.choices[0]?.message?.content ?? "").trim() }));
  } catch (err) {
    req.log.error({ err }, "AI chat failed");
    res.status(502).json({ error: "Falha no chat" });
  }
});

export default router;
