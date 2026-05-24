import { Router } from "express";
import { db } from "@workspace/db";
import { lapTimesTable, driversTable, teamsTable, tireStrategiesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { ListLapsParams, AddLapParams, AddLapBody, GetLatestPositionsParams } from "@workspace/api-zod";

const router = Router();

router.get("/races/:id/laps", async (req, res) => {
  const parsed = ListLapsParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) return res.status(400).json({ error: "Invalid id" });
  const laps = await db.select().from(lapTimesTable)
    .where(eq(lapTimesTable.raceId, parsed.data.id))
    .orderBy(lapTimesTable.lap, lapTimesTable.position);
  return res.json(laps.map(l => ({
    ...l,
    pitStop: l.pitStop ?? false,
    isPurpleSector1: l.isPurpleSector1 ?? false,
    isPurpleSector2: l.isPurpleSector2 ?? false,
    isPurpleSector3: l.isPurpleSector3 ?? false,
    isFastestLap: l.isFastestLap ?? false,
  })));
});

router.post("/races/:id/laps", async (req, res) => {
  const idParsed = AddLapParams.safeParse({ id: Number(req.params.id) });
  if (!idParsed.success) return res.status(400).json({ error: "Invalid id" });
  const parsed = AddLapBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
  const [lap] = await db.insert(lapTimesTable).values({
    raceId: idParsed.data.id,
    driverId: parsed.data.driverId,
    lap: parsed.data.lap,
    position: parsed.data.position,
    lapTimeMs: parsed.data.lapTimeMs,
    sector1Ms: parsed.data.sector1Ms ?? null,
    sector2Ms: parsed.data.sector2Ms ?? null,
    sector3Ms: parsed.data.sector3Ms ?? null,
    pitStop: parsed.data.pitStop ?? false,
    pitStopDurationMs: parsed.data.pitStopDurationMs ?? null,
    isPurpleSector1: false,
    isPurpleSector2: false,
    isPurpleSector3: false,
    isFastestLap: false,
  }).returning();
  return res.status(201).json({
    ...lap,
    pitStop: lap.pitStop ?? false,
    isPurpleSector1: lap.isPurpleSector1 ?? false,
    isPurpleSector2: lap.isPurpleSector2 ?? false,
    isPurpleSector3: lap.isPurpleSector3 ?? false,
    isFastestLap: lap.isFastestLap ?? false,
  });
});

router.get("/races/:id/laps/latest", async (req, res) => {
  const parsed = GetLatestPositionsParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) return res.status(400).json({ error: "Invalid id" });
  const raceId = parsed.data.id;

  const result = await db.execute(`
    SELECT 
      lt.position,
      lt.driver_id,
      d.name as driver_name,
      d.abbreviation,
      d.number as driver_number,
      t.name as team_name,
      t.color as team_color,
      lt.lap,
      lt.lap_time_ms,
      lt.pit_stop,
      (SELECT COUNT(*) FROM lap_times WHERE race_id = ${raceId} AND driver_id = lt.driver_id AND pit_stop = true) as pit_stops,
      ts.compound as current_tire,
      (lt.lap - ts.start_lap) as tire_laps
    FROM lap_times lt
    JOIN drivers d ON d.id = lt.driver_id
    JOIN teams t ON t.id = d.team_id
    LEFT JOIN (
      SELECT DISTINCT ON (driver_id) driver_id, compound, start_lap
      FROM tire_strategies
      WHERE race_id = ${raceId}
      ORDER BY driver_id, start_lap DESC
    ) ts ON ts.driver_id = lt.driver_id
    WHERE lt.race_id = ${raceId}
    AND lt.lap = (SELECT MAX(lap) FROM lap_times WHERE race_id = ${raceId} AND driver_id = lt.driver_id)
    ORDER BY lt.position
  `);

  const rows = result.rows as Record<string, unknown>[];
  const leaderMs = rows.length > 0 ? Number(rows[0].lap_time_ms) : 0;

  const positions = rows.map((row, idx) => {
    const myMs = Number(row.lap_time_ms);
    const prevMs = idx > 0 ? Number(rows[idx - 1].lap_time_ms) : myMs;
    return {
      position: Number(row.position),
      driverId: Number(row.driver_id),
      driverName: String(row.driver_name),
      driverAbbr: String(row.abbreviation),
      driverNumber: Number(row.driver_number),
      teamName: String(row.team_name),
      teamColor: String(row.team_color),
      lap: Number(row.lap),
      gapToLeaderMs: idx === 0 ? 0 : Math.abs(myMs - leaderMs),
      intervalMs: idx === 0 ? 0 : Math.abs(myMs - prevMs),
      lastLapTimeMs: myMs,
      currentTire: row.current_tire ? String(row.current_tire) : null,
      tireLaps: row.tire_laps != null ? Number(row.tire_laps) : null,
      pitStops: Number(row.pit_stops) || 0,
      dnf: false,
      dnfReason: null,
    };
  });

  return res.json(positions);
});

export default router;
