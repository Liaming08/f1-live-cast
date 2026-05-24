import { pgTable, serial, integer, text, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { racesTable } from "./races";
import { driversTable } from "./drivers";

export const tireStrategiesTable = pgTable("tire_strategies", {
  id: serial("id").primaryKey(),
  raceId: integer("race_id").notNull().references(() => racesTable.id),
  driverId: integer("driver_id").notNull().references(() => driversTable.id),
  compound: varchar("compound", { length: 20 }).notNull(),
  startLap: integer("start_lap").notNull(),
  endLap: integer("end_lap"),
});

export const insertTireStrategySchema = createInsertSchema(tireStrategiesTable).omit({ id: true });
export type InsertTireStrategy = z.infer<typeof insertTireStrategySchema>;
export type TireStrategy = typeof tireStrategiesTable.$inferSelect;
