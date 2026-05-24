import { pgTable, serial, text, integer, boolean, real, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const racesTable = pgTable("races", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  circuit: text("circuit").notNull(),
  country: text("country").notNull(),
  round: integer("round").notNull(),
  season: integer("season").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("upcoming"),
  raceDate: text("race_date").notNull(),
  currentLap: integer("current_lap"),
  totalLaps: integer("total_laps"),
  weatherCondition: text("weather_condition"),
  trackTemp: real("track_temp"),
  airTemp: real("air_temp"),
  safetyCarDeployed: boolean("safety_car_deployed").notNull().default(false),
  vscDeployed: boolean("vsc_deployed").notNull().default(false),
});

export const insertRaceSchema = createInsertSchema(racesTable).omit({ id: true });
export type InsertRace = z.infer<typeof insertRaceSchema>;
export type Race = typeof racesTable.$inferSelect;
