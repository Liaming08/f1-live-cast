import { Router } from "express";
import { db } from "@workspace/db";
import { driversTable, teamsTable, racesTable, lapTimesTable, raceResultsTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";

const router = Router();

const POINTS_MAP: Record<number, number> = {
  1: 25, 2: 18, 3: 15, 4: 12, 5: 10,
  6: 8, 7: 6, 8: 4, 9: 2, 10: 1,
};

router.get("/standings/drivers", async (req, res) => {
  const results = await db.select().from(raceResultsTable);
  const drivers = await db
    .select({
      id: driversTable.id,
      name: driversTable.name,
      abbreviation: driversTable.abbreviation,
      number: driversTable.number,
      nationality: driversTable.nationality,
      teamId: driversTable.teamId,
      teamName: teamsTable.name,
      teamColor: teamsTable.color,
    })
    .from(driversTable)
    .leftJoin(teamsTable, eq(driversTable.teamId, teamsTable.id));

  const standings = drivers.map(driver => {
    const driverResults = results.filter(r => r.driverId === driver.id);
    const points = driverResults.reduce((sum, r) => {
      const pos = r.position ?? 99;
      return sum + (POINTS_MAP[pos] ?? 0);
    }, 0);
    const wins = driverResults.filter(r => r.position === 1).length;
    const podiums = driverResults.filter(r => (r.position ?? 99) <= 3).length;
    const races = driverResults.length;
    return {
      driverId: driver.id,
      driverName: driver.name,
      driverAbbr: driver.abbreviation,
      driverNumber: driver.number,
      teamName: driver.teamName ?? "",
      teamColor: driver.teamColor ?? "#FFFFFF",
      points,
      wins,
      podiums,
      races,
    };
  }).sort((a, b) => b.points - a.points || b.wins - a.wins);

  res.json(standings.map((s, idx) => ({ ...s, position: idx + 1 })));
});

router.get("/standings/constructors", async (req, res) => {
  const results = await db.select().from(raceResultsTable);
  const teams = await db.select().from(teamsTable);
  const drivers = await db.select().from(driversTable);

  const standings = teams.map(team => {
    const teamDriverIds = drivers.filter(d => d.teamId === team.id).map(d => d.id);
    const teamResults = results.filter(r => teamDriverIds.includes(r.driverId));
    const points = teamResults.reduce((sum, r) => {
      const pos = r.position ?? 99;
      return sum + (POINTS_MAP[pos] ?? 0);
    }, 0);
    const wins = teamResults.filter(r => r.position === 1).length;
    const podiums = teamResults.filter(r => (r.position ?? 99) <= 3).length;
    return {
      teamId: team.id,
      teamName: team.name,
      teamColor: team.color,
      points,
      wins,
      podiums,
    };
  }).sort((a, b) => b.points - a.points || b.wins - a.wins);

  res.json(standings.map((s, idx) => ({ ...s, position: idx + 1 })));
});

router.get("/standings/summary", async (req, res) => {
  const races = await db.select().from(racesTable);
  const results = await db.select().from(raceResultsTable);
  const drivers = await db.select().from(driversTable);
  const teams = await db.select().from(teamsTable);

  const season = new Date().getFullYear();
  const racesCompleted = races.filter(r => r.status === "finished").length;
  const racesRemaining = races.filter(r => r.status !== "finished").length;

  const driverStandings = drivers.map(driver => {
    const driverResults = results.filter(r => r.driverId === driver.id);
    const points = driverResults.reduce((sum, r) => sum + (POINTS_MAP[r.position ?? 99] ?? 0), 0);
    return { name: driver.name, points };
  }).sort((a, b) => b.points - a.points);

  const constructorStandings = teams.map(team => {
    const teamDriverIds = drivers.filter(d => d.teamId === team.id).map(d => d.id);
    const teamResults = results.filter(r => teamDriverIds.includes(r.driverId));
    const points = teamResults.reduce((sum, r) => sum + (POINTS_MAP[r.position ?? 99] ?? 0), 0);
    return { name: team.name, points };
  }).sort((a, b) => b.points - a.points);

  res.json({
    season,
    racesCompleted,
    racesRemaining,
    leadingDriver: driverStandings[0]?.name ?? "TBD",
    leadingDriverPoints: driverStandings[0]?.points ?? 0,
    leadingConstructor: constructorStandings[0]?.name ?? "TBD",
    leadingConstructorPoints: constructorStandings[0]?.points ?? 0,
    totalOvertakes: 0,
    totalDnfs: results.filter(r => r.dnf).length,
  });
});

export default router;
