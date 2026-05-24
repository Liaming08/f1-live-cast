import { Router } from "express";
import { db } from "@workspace/db";
import { driversTable, teamsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { CreateDriverBody, UpdateDriverBody, UpdateDriverParams, DeleteDriverParams, GetDriverParams } from "@workspace/api-zod";

const router = Router();

router.get("/drivers", async (req, res) => {
  const rows = await db
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
    .leftJoin(teamsTable, eq(driversTable.teamId, teamsTable.id))
    .orderBy(driversTable.number);
  res.json(rows);
});

router.get("/drivers/:id", async (req, res) => {
  const parsed = GetDriverParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) return res.status(400).json({ error: "Invalid id" });
  const rows = await db
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
    .leftJoin(teamsTable, eq(driversTable.teamId, teamsTable.id))
    .where(eq(driversTable.id, parsed.data.id))
    .limit(1);
  if (!rows.length) return res.status(404).json({ error: "Not found" });
  res.json(rows[0]);
});

router.post("/drivers", async (req, res) => {
  const parsed = CreateDriverBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
  const [driver] = await db.insert(driversTable).values(parsed.data).returning();
  const team = await db.select().from(teamsTable).where(eq(teamsTable.id, driver.teamId)).limit(1);
  res.status(201).json({ ...driver, teamName: team[0]?.name ?? null, teamColor: team[0]?.color ?? null });
});

router.patch("/drivers/:id", async (req, res) => {
  const idParsed = UpdateDriverParams.safeParse({ id: Number(req.params.id) });
  if (!idParsed.success) return res.status(400).json({ error: "Invalid id" });
  const parsed = UpdateDriverBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
  const [driver] = await db.update(driversTable).set(parsed.data).where(eq(driversTable.id, idParsed.data.id)).returning();
  if (!driver) return res.status(404).json({ error: "Not found" });
  const team = await db.select().from(teamsTable).where(eq(teamsTable.id, driver.teamId)).limit(1);
  res.json({ ...driver, teamName: team[0]?.name ?? null, teamColor: team[0]?.color ?? null });
});

router.delete("/drivers/:id", async (req, res) => {
  const parsed = DeleteDriverParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) return res.status(400).json({ error: "Invalid id" });
  await db.delete(driversTable).where(eq(driversTable.id, parsed.data.id));
  res.status(204).send();
});

export default router;
