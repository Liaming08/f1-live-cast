import { pgTable, serial, integer, text, varchar, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { racesTable } from "./races";

export const raceControlTable = pgTable("race_control", {
  id: serial("id").primaryKey(),
  raceId: integer("race_id").notNull().references(() => racesTable.id),
  message: text("message").notNull(),
  category: varchar("category", { length: 20 }).notNull().default("other"),
  flag: varchar("flag", { length: 20 }),
  lap: integer("lap"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const insertRaceControlSchema = createInsertSchema(raceControlTable).omit({ id: true, timestamp: true });
export type InsertRaceControl = z.infer<typeof insertRaceControlSchema>;
export type RaceControl = typeof raceControlTable.$inferSelect;
