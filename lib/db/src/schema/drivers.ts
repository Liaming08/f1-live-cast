import { pgTable, serial, text, integer, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { teamsTable } from "./teams";

export const driversTable = pgTable("drivers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  abbreviation: varchar("abbreviation", { length: 3 }).notNull(),
  number: integer("number").notNull(),
  nationality: text("nationality").notNull(),
  teamId: integer("team_id").notNull().references(() => teamsTable.id),
});

export const insertDriverSchema = createInsertSchema(driversTable).omit({ id: true });
export type InsertDriver = z.infer<typeof insertDriverSchema>;
export type Driver = typeof driversTable.$inferSelect;
