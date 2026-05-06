import { pgTable, serial, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const categoryEnum = pgEnum("category", [
  "computer",
  "printer",
  "network",
  "software",
  "phone",
  "other",
]);

export const statusEnum = pgEnum("status", ["pending", "in_progress", "done"]);

export const priorityEnum = pgEnum("priority", [
  "low",
  "medium",
  "high",
  "urgent",
]);

export const ticketsTable = pgTable("tickets", {
  id: serial("id").primaryKey(),
  requesterName: text("requester_name").notNull(),
  requesterEmail: text("requester_email"),
  description: text("description").notNull(),
  category: categoryEnum("category").notNull().default("computer"),
  status: statusEnum("status").notNull().default("pending"),
  priority: priorityEnum("priority").notNull().default("medium"),
  location: text("location"),
  anydeskId: text("anydesk_id"),
  screenshotUrl: text("screenshot_url"),
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertTicketSchema = createInsertSchema(ticketsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertTicket = z.infer<typeof insertTicketSchema>;
export type Ticket = typeof ticketsTable.$inferSelect;
