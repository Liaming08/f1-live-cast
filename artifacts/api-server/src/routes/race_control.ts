import { Router } from "express";
import { db } from "@workspace/db";
import { raceControlTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { ListRaceControlParams, AddRaceControlParams, AddRaceControlBody } from "@workspace/api-zod";
import { adminAuthMiddleware } from "../middlewares/auth";

const router = Router();

router.get("/races/:id/race-control", async (req, res) => {
  const parsed = ListRaceControlParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) return res.status(400).json({ error: "Invalid id" });
  const entries = await db.select().from(raceControlTable)
    .where(eq(raceControlTable.raceId, parsed.data.id))
    .orderBy(desc(raceControlTable.timestamp));
  return res.json(entries.map(e => ({ ...e, timestamp: e.timestamp.toISOString() })));
});

router.post("/races/:id/race-control", adminAuthMiddleware, async (req, res) => {
  const idParsed = AddRaceControlParams.safeParse({ id: Number(req.params.id) });
  if (!idParsed.success) return res.status(400).json({ error: "Invalid id" });
  const parsed = AddRaceControlBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
  const [entry] = await db.insert(raceControlTable).values({
    raceId: idParsed.data.id,
    message: parsed.data.message,
    category: parsed.data.category,
    flag: parsed.data.flag ?? null,
    lap: parsed.data.lap ?? null,
  }).returning();
  return res.status(201).json({ ...entry, timestamp: entry.timestamp.toISOString() });
});

export default router;
