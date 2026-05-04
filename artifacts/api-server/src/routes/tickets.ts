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
} from "@workspace/api-zod";

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

router.post("/tickets", async (req, res): Promise<void> => {
  const parsed = CreateTicketBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid ticket body");
    res.status(400).json({ error: parsed.error.message });
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
    })
    .returning();

  res.status(201).json(GetTicketResponse.parse(ticket));
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
