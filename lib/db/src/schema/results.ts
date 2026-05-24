import { pgTable, serial, integer, text, real, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { racesTable } from "./races";
import { driversTable } from "./drivers";

export const raceResultsTable = pgTable("race_results", {
  id: serial("id").primaryKey(),
  raceId: integer("race_id").notNull().references(() => racesTable.id),
  driverId: integer("driver_id").notNull().references(() => driversTable.id),
  position: integer("position"),
  points: real("points").notNull().default(0),
  lapTimeMs: integer("lap_time_ms"),
  dnf: boolean("dnf").notNull().default(false),
  dnfReason: text("dnf_reason"),
  pitStops: integer("pit_stops").notNull().default(0),
  gapToLeaderMs: integer("gap_to_leader_ms"),
});

export const insertRaceResultSchema = createInsertSchema(raceResultsTable).omit({ id: true });
export type InsertRaceResult = z.infer<typeof insertRaceResultSchema>;
export type RaceResult = typeof raceResultsTable.$inferSelect;
