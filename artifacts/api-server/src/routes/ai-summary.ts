import { logger } from "../lib/logger";
import { Router, type IRouter, type Request } from "express";
import type { Logger } from "pino";
import { eq } from "drizzle-orm";
import { db, ticketsTable } from "@workspace/db";
import OpenAI from "openai";
import { GetTicketAiSummaryParams, GetTicketAiSummaryResponse } from "@workspace/api-zod";

const router: IRouter = Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const CATEGORY_PT: Record<string, string> = {
  computer: "Computador",
  printer: "Impressora",
  network: "Rede",
  software: "Sistema/Software",
  phone: "Telefonia",
  other: "Outro",
};

router.post(
  "/tickets/:id/ai-summary",
  async (req: Request & { log: Logger }, res): Promise<void> => {
    const params = GetTicketAiSummaryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [ticket] = await db
    .select()
    .from(ticketsTable)
    .where(eq(ticketsTable.id, params.data.id));

  if (!ticket) {
    res.status(404).json({ error: "Chamado não encontrado" });
    return;
  }

  const hasScreenshot = !!ticket.screenshotUrl;

  const userContext = [
    `Categoria informada: ${CATEGORY_PT[ticket.category] ?? ticket.category}`,
    `Solicitante: ${ticket.requesterName}`,
    ticket.location ? `Local: ${ticket.location}` : null,
    `Descrição do usuário: ${ticket.description}`,
  ]
    .filter(Boolean)
    .join("\n");

  const systemPrompt = `Você é um assistente técnico de TI experiente, fluente em português do Brasil.
Sua tarefa é analisar um chamado de suporte (descrição + opcional print de erro) e responder em JSON com:
- summary: 1 frase curta (máx 120 chars) descrevendo o problema em linguagem técnica
- diagnosis: 2 a 4 frases explicando a causa provável
- suggestedActions: 3 a 5 ações curtas e diretas que o técnico deve executar (em ordem). Cada item curto, imperativo, sem markdown.
- severity: "low" | "medium" | "high" | "urgent" baseado em impacto (1 usuário sem trabalhar = medium; vários usuários = high; sistema crítico fora = urgent; cosmético = low).
Responda APENAS com JSON válido, nada mais. Não use markdown nem cercas de código.`;

  const userContent: Array<
    { type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }
  > = [{ type: "text", text: userContext }];

  if (ticket.screenshotUrl) {
    userContent.push({
      type: "image_url",
      image_url: { url: ticket.screenshotUrl },
    });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 1200,
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? "{}";
    let parsed: {
      summary?: string;
      diagnosis?: string;
      suggestedActions?: unknown;
      severity?: string;
    };
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = { summary: raw, diagnosis: "", suggestedActions: [], severity: "medium" };
    }

    const allowedSeverities = ["low", "medium", "high", "urgent"] as const;
    const severity = allowedSeverities.includes(parsed.severity as (typeof allowedSeverities)[number])
      ? (parsed.severity as (typeof allowedSeverities)[number])
      : "medium";

    const suggestedActions = Array.isArray(parsed.suggestedActions)
      ? parsed.suggestedActions.map((s) => String(s)).filter((s) => s.trim().length > 0).slice(0, 6)
      : [];

    res.json(
      GetTicketAiSummaryResponse.parse({
        ticketId: ticket.id,
        summary: String(parsed.summary ?? "").slice(0, 280),
        diagnosis: String(parsed.diagnosis ?? ""),
        suggestedActions,
        severity,
        hasScreenshot,
      }),
    );
  } catch (err) {
  logger.error({ err }, "AI summary failed");
    res.status(502).json({ error: "Falha ao gerar resumo com IA" });
  }
});

export default router;
