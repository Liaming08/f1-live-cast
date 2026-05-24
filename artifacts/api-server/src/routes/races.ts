import { Router } from "express";
import { db } from "@workspace/db";
import { racesTable, driversTable, teamsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { CreateRaceBody, UpdateRaceBody, UpdateRaceParams, DeleteRaceParams, GetRaceParams, GetRaceSummaryParams } from "@workspace/api-zod";
import { commentaryTable, lapTimesTable, raceControlTable } from "@workspace/db";

const router = Router();

router.get("/races", async (req, res) => {
  const races = await db.select().from(racesTable).orderBy(racesTable.round);
  return res.json(races.map(r => ({
    ...r,
    safetyCarDeployed: r.safetyCarDeployed ?? false,
    vscDeployed: r.vscDeployed ?? false,
  })));
});

router.get("/races/live", async (req, res) => {
  const liveRace = await db.select().from(racesTable).where(eq(racesTable.status, "race")).limit(1);
  if (!liveRace.length) {
    return res.json({ hasLiveRace: false });
  }
  const race = liveRace[0];

  const latestLaps = await db.execute(`
    SELECT lt.*, d.name as driver_name, d.abbreviation, d.number as driver_number, t.name as team_name, t.color as team_color
    FROM lap_times lt
    JOIN drivers d ON d.id = lt.driver_id
    JOIN teams t ON t.id = d.team_id
    WHERE lt.race_id = ${race.id}
    AND lt.lap = (SELECT MAX(lap) FROM lap_times WHERE race_id = ${race.id} AND driver_id = lt.driver_id)
    ORDER BY lt.position
  `);

  const commentary = await db.select().from(commentaryTable)
    .where(eq(commentaryTable.raceId, race.id))
    .orderBy(desc(commentaryTable.timestamp))
    .limit(5);

  const leader = latestLaps.rows.length > 0 ? {
    id: Number(latestLaps.rows[0].driver_id),
    name: String(latestLaps.rows[0].driver_name),
    abbreviation: String(latestLaps.rows[0].abbreviation),
    number: Number(latestLaps.rows[0].driver_number),
    nationality: "",
    teamId: 0,
    teamName: String(latestLaps.rows[0].team_name),
    teamColor: String(latestLaps.rows[0].team_color),
  } : null;

  const positions = (latestLaps.rows as Record<string, unknown>[]).map((row, idx) => {
    const leaderMs = Number((latestLaps.rows[0] as Record<string, unknown>).lap_time_ms) || 0;
    const myMs = Number(row.lap_time_ms) || 0;
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
      intervalMs: 0,
      lastLapTimeMs: Number(row.lap_time_ms),
      currentTire: null,
      tireLaps: null,
      pitStops: 0,
      dnf: false,
      dnfReason: null,
    };
  });

  return res.json({
    hasLiveRace: true,
    race: { ...race, safetyCarDeployed: race.safetyCarDeployed ?? false, vscDeployed: race.vscDeployed ?? false },
    leader,
    positions,
    latestCommentary: commentary.map(c => ({
      ...c,
      timestamp: c.timestamp.toISOString(),
    })),
  });
});

router.get("/races/:id", async (req, res) => {
  const parsed = GetRaceParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) return res.status(400).json({ error: "Invalid id" });
  const race = await db.select().from(racesTable).where(eq(racesTable.id, parsed.data.id)).limit(1);
  if (!race.length) return res.status(404).json({ error: "Not found" });
  const r = race[0];
  return res.json({ ...r, safetyCarDeployed: r.safetyCarDeployed ?? false, vscDeployed: r.vscDeployed ?? false });
});

router.post("/races", async (req, res) => {
  const parsed = CreateRaceBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
  const [race] = await db.insert(racesTable).values({
    name: parsed.data.name,
    circuit: parsed.data.circuit,
    country: parsed.data.country,
    round: parsed.data.round,
    season: parsed.data.season,
    raceDate: parsed.data.raceDate,
    totalLaps: parsed.data.totalLaps ?? null,
    weatherCondition: parsed.data.weatherCondition ?? null,
    trackTemp: parsed.data.trackTemp ?? null,
    airTemp: parsed.data.airTemp ?? null,
    status: "upcoming",
    safetyCarDeployed: false,
    vscDeployed: false,
  }).returning();
  return res.status(201).json({ ...race, safetyCarDeployed: race.safetyCarDeployed ?? false, vscDeployed: race.vscDeployed ?? false });
});

router.patch("/races/:id", async (req, res) => {
  const idParsed = UpdateRaceParams.safeParse({ id: Number(req.params.id) });
  if (!idParsed.success) return res.status(400).json({ error: "Invalid id" });
  const parsed = UpdateRaceBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
  const updates: Record<string, unknown> = {};
  const d = parsed.data;
  if (d.name !== undefined) updates.name = d.name;
  if (d.circuit !== undefined) updates.circuit = d.circuit;
  if (d.country !== undefined) updates.country = d.country;
  if (d.round !== undefined) updates.round = d.round;
  if (d.raceDate !== undefined) updates.raceDate = d.raceDate;
  if (d.status !== undefined) updates.status = d.status;
  if (d.currentLap !== undefined) updates.currentLap = d.currentLap;
  if (d.totalLaps !== undefined) updates.totalLaps = d.totalLaps;
  if (d.weatherCondition !== undefined) updates.weatherCondition = d.weatherCondition;
  if (d.trackTemp !== undefined) updates.trackTemp = d.trackTemp;
  if (d.airTemp !== undefined) updates.airTemp = d.airTemp;
  if (d.safetyCarDeployed !== undefined) updates.safetyCarDeployed = d.safetyCarDeployed;
  if (d.vscDeployed !== undefined) updates.vscDeployed = d.vscDeployed;
  const [race] = await db.update(racesTable).set(updates).where(eq(racesTable.id, idParsed.data.id)).returning();
  if (!race) return res.status(404).json({ error: "Not found" });
  return res.json({ ...race, safetyCarDeployed: race.safetyCarDeployed ?? false, vscDeployed: race.vscDeployed ?? false });
});

router.delete("/races/:id", async (req, res) => {
  const parsed = DeleteRaceParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) return res.status(400).json({ error: "Invalid id" });
  await db.delete(racesTable).where(eq(racesTable.id, parsed.data.id));
  return res.status(204).send();
});

router.get("/races/:id/summary", async (req, res) => {
  const parsed = GetRaceSummaryParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) return res.status(400).json({ error: "Invalid id" });
  const raceId = parsed.data.id;

  const commentary = await db.select().from(commentaryTable).where(eq(commentaryTable.raceId, raceId));
  const dnfEntries = commentary.filter(c => c.type === "dnf");
  const scPeriods = commentary.filter(c => c.type === "safety_car").length;

  const allLaps = await db.select().from(lapTimesTable).where(eq(lapTimesTable.raceId, raceId));
  const fastestLapEntry = allLaps.filter(l => l.isFastestLap)[0];

  let fastestLap: string | null = null;
  let fastestLapDriver: string | null = null;
  if (fastestLapEntry) {
    const ms = fastestLapEntry.lapTimeMs;
    const mins = Math.floor(ms / 60000);
    const secs = ((ms % 60000) / 1000).toFixed(3);
    fastestLap = `${mins}:${secs.padStart(6, "0")}`;
    const driver = await db.select().from(driversTable).where(eq(driversTable.id, fastestLapEntry.driverId)).limit(1);
    fastestLapDriver = driver[0]?.name ?? null;
  }

  const uniqueDrivers = new Set(allLaps.map(l => l.driverId));
  const totalLapsCompleted = allLaps.length;

  return res.json({
    raceId,
    totalDrivers: uniqueDrivers.size,
    finishedDrivers: uniqueDrivers.size - dnfEntries.length,
    dnfCount: dnfEntries.length,
    fastestLap,
    fastestLapDriver,
    totalLapsCompleted,
    safetyCarPeriods: scPeriods,
  });
});

export default router;
