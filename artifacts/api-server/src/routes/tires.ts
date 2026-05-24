import { Router } from "express";
import { db } from "@workspace/db";
import { tireStrategiesTable, driversTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { ListTireStrategiesParams, AddTireStrategyParams, AddTireStrategyBody } from "@workspace/api-zod";

const router = Router();

router.get("/races/:id/tires", async (req, res) => {
  const parsed = ListTireStrategiesParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) return res.status(400).json({ error: "Invalid id" });
  const rows = await db
    .select({
      id: tireStrategiesTable.id,
      raceId: tireStrategiesTable.raceId,
      driverId: tireStrategiesTable.driverId,
      driverName: driversTable.name,
      compound: tireStrategiesTable.compound,
      startLap: tireStrategiesTable.startLap,
      endLap: tireStrategiesTable.endLap,
    })
    .from(tireStrategiesTable)
    .leftJoin(driversTable, eq(tireStrategiesTable.driverId, driversTable.id))
    .where(eq(tireStrategiesTable.raceId, parsed.data.id))
    .orderBy(tireStrategiesTable.startLap);
  res.json(rows.map(r => ({ ...r, driverName: r.driverName ?? "" })));
});

router.post("/races/:id/tires", async (req, res) => {
  const idParsed = AddTireStrategyParams.safeParse({ id: Number(req.params.id) });
  if (!idParsed.success) return res.status(400).json({ error: "Invalid id" });
  const parsed = AddTireStrategyBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
  const [tire] = await db.insert(tireStrategiesTable).values({
    raceId: idParsed.data.id,
    driverId: parsed.data.driverId,
    compound: parsed.data.compound,
    startLap: parsed.data.startLap,
    endLap: parsed.data.endLap ?? null,
  }).returning();
  const driver = await db.select().from(driversTable).where(eq(driversTable.id, tire.driverId)).limit(1);
  res.status(201).json({ ...tire, driverName: driver[0]?.name ?? "" });
});

export default router;
