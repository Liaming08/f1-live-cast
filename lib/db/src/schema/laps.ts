import { pgTable, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { racesTable } from "./races";
import { driversTable } from "./drivers";

export const lapTimesTable = pgTable("lap_times", {
  id: serial("id").primaryKey(),
  raceId: integer("race_id").notNull().references(() => racesTable.id),
  driverId: integer("driver_id").notNull().references(() => driversTable.id),
  lap: integer("lap").notNull(),
  position: integer("position").notNull(),
  lapTimeMs: integer("lap_time_ms").notNull(),
  sector1Ms: integer("sector1_ms"),
  sector2Ms: integer("sector2_ms"),
  sector3Ms: integer("sector3_ms"),
  pitStop: boolean("pit_stop").notNull().default(false),
  pitStopDurationMs: integer("pit_stop_duration_ms"),
  isPurpleSector1: boolean("is_purple_sector1").notNull().default(false),
  isPurpleSector2: boolean("is_purple_sector2").notNull().default(false),
  isPurpleSector3: boolean("is_purple_sector3").notNull().default(false),
  isFastestLap: boolean("is_fastest_lap").notNull().default(false),
});

export const insertLapTimeSchema = createInsertSchema(lapTimesTable).omit({ id: true });
export type InsertLapTime = z.infer<typeof insertLapTimeSchema>;
export type LapTime = typeof lapTimesTable.$inferSelect;
