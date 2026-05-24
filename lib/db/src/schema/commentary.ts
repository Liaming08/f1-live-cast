import { pgTable, serial, integer, text, varchar, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { racesTable } from "./races";

export const commentaryTable = pgTable("commentary", {
  id: serial("id").primaryKey(),
  raceId: integer("race_id").notNull().references(() => racesTable.id),
  message: text("message").notNull(),
  type: varchar("type", { length: 30 }).notNull().default("normal"),
  lap: integer("lap"),
  driverName: text("driver_name"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const insertCommentarySchema = createInsertSchema(commentaryTable).omit({ id: true, timestamp: true });
export type InsertCommentary = z.infer<typeof insertCommentarySchema>;
export type Commentary = typeof commentaryTable.$inferSelect;
