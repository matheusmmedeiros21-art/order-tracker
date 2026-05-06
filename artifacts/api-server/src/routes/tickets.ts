import { Router, type IRouter } from "express";
import { eq, asc, desc, sql } from "drizzle-orm";
import { db, ticketsTable } from "@workspace/db";
import {
  CreateTicketBody,
  UpdateTicketBody,
  GetTicketParams,
  UpdateTicketParams,
  DeleteTicketParams,
  ListTicketsQueryParams,
  ListTicketsResponseItem,
  GetTicketResponse,
  UpdateTicketResponse,
  GetTicketStatsResponse,
  GetTicketQueuePositionParams,
  GetTicketQueuePositionResponse,
  GetPublicQueueResponse,
} from "@workspace/api-zod";

const PRIORITY_RANK: Record<string, number> = { urgent: 4, high: 3, medium: 2, low: 1 };

const router: IRouter = Router();

router.get("/tickets/stats", async (req, res): Promise<void> => {
  const tickets = await db.select().from(ticketsTable);

  const total = tickets.length;
  const pending = tickets.filter((t) => t.status === "pending").length;
  const inProgress = tickets.filter((t) => t.status === "in_progress").length;
  const done = tickets.filter((t) => t.status === "done").length;

  const categoryCounts: Record<string, number> = {};
  for (const t of tickets) {
    categoryCounts[t.category] = (categoryCounts[t.category] ?? 0) + 1;
  }
  const byCategory = Object.entries(categoryCounts).map(([category, count]) => ({ category, count }));

  const priorityCounts: Record<string, number> = {};
  for (const t of tickets) {
    priorityCounts[t.priority] = (priorityCounts[t.priority] ?? 0) + 1;
  }
  const byPriority = Object.entries(priorityCounts).map(([priority, count]) => ({ priority, count }));

  const recentActivity = await db
    .select()
    .from(ticketsTable)
    .orderBy(desc(ticketsTable.updatedAt))
    .limit(5);

  res.json(
    GetTicketStatsResponse.parse({
      total,
      pending,
      inProgress,
      done,
      byCategory,
      byPriority,
      recentActivity,
    })
  );
});

router.get("/tickets", async (req, res): Promise<void> => {
  const query = ListTicketsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  let dbQuery = db.select().from(ticketsTable).$dynamic();

  if (query.data.status && query.data.status !== "all") {
    dbQuery = dbQuery.where(eq(ticketsTable.status, query.data.status as "pending" | "in_progress" | "done"));
  }

  if (query.data.category) {
    dbQuery = dbQuery.where(eq(ticketsTable.category, query.data.category as "computer" | "printer" | "network" | "software" | "phone" | "other"));
  }

  const tickets = await dbQuery.orderBy(asc(ticketsTable.createdAt));

  res.json(tickets.map((t) => ListTicketsResponseItem.parse(t)));
});

const SCREENSHOT_DATA_URL_RE = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;
const SCREENSHOT_MAX_LEN = 12 * 1024 * 1024;

function validateScreenshot(value: string | null | undefined): { ok: true; value: string | null } | { ok: false; error: string } {
  if (value === null || value === undefined || value === "") return { ok: true, value: null };
  if (typeof value !== "string") return { ok: false, error: "screenshotUrl inválido" };
  if (value.length > SCREENSHOT_MAX_LEN) return { ok: false, error: "Imagem muito grande" };
  if (!SCREENSHOT_DATA_URL_RE.test(value)) return { ok: false, error: "screenshotUrl deve ser um data URL de imagem (jpeg, png ou webp)" };
  return { ok: true, value };
}

router.post("/tickets", async (req, res): Promise<void> => {
  const parsed = CreateTicketBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid ticket body");
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const screenshot = validateScreenshot(parsed.data.screenshotUrl);
  if (!screenshot.ok) {
    res.status(400).json({ error: screenshot.error });
    return;
  }

  const [ticket] = await db
    .insert(ticketsTable)
    .values({
      requesterName: parsed.data.requesterName,
      requesterEmail: parsed.data.requesterEmail ?? null,
      description: parsed.data.description,
      category: parsed.data.category,
      priority: parsed.data.priority,
      location: parsed.data.location ?? null,
      anydeskId: parsed.data.anydeskId ?? null,
      screenshotUrl: screenshot.value,
    })
    .returning();

  res.status(201).json(GetTicketResponse.parse(ticket));
});

router.get("/tickets/queue", async (req, res): Promise<void> => {
  const all = await db.select().from(ticketsTable);

  const sortByQueue = (a: typeof all[number], b: typeof all[number]) => {
    const ra = PRIORITY_RANK[a.priority] ?? 0;
    const rb = PRIORITY_RANK[b.priority] ?? 0;
    if (ra !== rb) return rb - ra;
    const ta = new Date(a.createdAt).getTime();
    const tb = new Date(b.createdAt).getTime();
    if (ta !== tb) return ta - tb;
    return a.id - b.id;
  };

  const pendingSorted = all.filter((t) => t.status === "pending").sort(sortByQueue);
  const inProgress = all.filter((t) => t.status === "in_progress").sort(sortByQueue);

  const firstName = (full: string) => (full.trim().split(/\s+/)[0] ?? "").slice(0, 24);

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const doneToday = all.filter((t) => t.status === "done" && new Date(t.updatedAt) >= startOfToday).length;

  res.json(
    GetPublicQueueResponse.parse({
      pending: pendingSorted.map((t, i) => ({
        id: t.id,
        position: i + 1,
        status: t.status,
        priority: t.priority,
        category: t.category,
        firstName: firstName(t.requesterName),
        createdAt: t.createdAt,
      })),
      inProgress: inProgress.map((t) => ({
        id: t.id,
        position: 0,
        status: t.status,
        priority: t.priority,
        category: t.category,
        firstName: firstName(t.requesterName),
        createdAt: t.createdAt,
      })),
      totals: {
        pending: pendingSorted.length,
        inProgress: inProgress.length,
        doneToday,
      },
    }),
  );
});

router.get("/tickets/:id/queue-position", async (req, res): Promise<void> => {
  const params = GetTicketQueuePositionParams.safeParse(req.params);
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

  const active = await db.select().from(ticketsTable);
  const activePending = active.filter((t) => t.status === "pending");
  const totalActive = active.filter((t) => t.status === "pending" || t.status === "in_progress").length;

  let position = 0;
  let totalAhead = 0;
  if (ticket.status === "pending") {
    const myRank = PRIORITY_RANK[ticket.priority] ?? 0;
    const myTime = new Date(ticket.createdAt).getTime();
    totalAhead = activePending.filter((t) => {
      if (t.id === ticket.id) return false;
      const r = PRIORITY_RANK[t.priority] ?? 0;
      if (r > myRank) return true;
      if (r < myRank) return false;
      const tTime = new Date(t.createdAt).getTime();
      if (tTime < myTime) return true;
      if (tTime > myTime) return false;
      return t.id < ticket.id;
    }).length;
    position = totalAhead + 1;
  }

  res.json(
    GetTicketQueuePositionResponse.parse({
      id: ticket.id,
      position,
      totalAhead,
      totalActive,
      status: ticket.status,
      priority: ticket.priority,
    }),
  );
});

router.get("/tickets/:id", async (req, res): Promise<void> => {
  const params = GetTicketParams.safeParse(req.params);
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

  res.json(GetTicketResponse.parse(ticket));
});

router.patch("/tickets/:id", async (req, res): Promise<void> => {
  const params = UpdateTicketParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateTicketBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid update body");
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (parsed.data.status !== undefined) updateData.status = parsed.data.status;
  if (parsed.data.priority !== undefined) updateData.priority = parsed.data.priority;
  if (parsed.data.adminNotes !== undefined) updateData.adminNotes = parsed.data.adminNotes;
  if (parsed.data.requesterName !== undefined) updateData.requesterName = parsed.data.requesterName;
  if (parsed.data.requesterEmail !== undefined) updateData.requesterEmail = parsed.data.requesterEmail;
  if (parsed.data.description !== undefined) updateData.description = parsed.data.description;
  if (parsed.data.category !== undefined) updateData.category = parsed.data.category;
  if (parsed.data.location !== undefined) updateData.location = parsed.data.location;
  if (parsed.data.anydeskId !== undefined) updateData.anydeskId = parsed.data.anydeskId;
  if (parsed.data.screenshotUrl !== undefined) {
    const screenshot = validateScreenshot(parsed.data.screenshotUrl);
    if (!screenshot.ok) {
      res.status(400).json({ error: screenshot.error });
      return;
    }
    updateData.screenshotUrl = screenshot.value;
  }

  const [ticket] = await db
    .update(ticketsTable)
    .set(updateData)
    .where(eq(ticketsTable.id, params.data.id))
    .returning();

  if (!ticket) {
    res.status(404).json({ error: "Chamado não encontrado" });
    return;
  }

  res.json(UpdateTicketResponse.parse(ticket));
});

router.delete("/tickets/:id", async (req, res): Promise<void> => {
  const params = DeleteTicketParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [ticket] = await db
    .delete(ticketsTable)
    .where(eq(ticketsTable.id, params.data.id))
    .returning();

  if (!ticket) {
    res.status(404).json({ error: "Chamado não encontrado" });
    return;
  }

  res.sendStatus(204);
});

export default router;
