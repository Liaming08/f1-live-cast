import { Router } from "express";
import { db } from "@workspace/db";
import { teamsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { CreateTeamBody, UpdateTeamBody, UpdateTeamParams, DeleteTeamParams } from "@workspace/api-zod";

const router = Router();

router.get("/teams", async (req, res) => {
  const teams = await db.select().from(teamsTable).orderBy(teamsTable.name);
  return res.json(teams);
});

router.post("/teams", async (req, res) => {
  const parsed = CreateTeamBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
  const [team] = await db.insert(teamsTable).values({
    name: parsed.data.name,
    color: parsed.data.color,
    nationality: parsed.data.nationality,
    principal: parsed.data.principal,
    chassis: parsed.data.chassis ?? null,
    powerUnit: parsed.data.powerUnit ?? null,
  }).returning();
  return res.status(201).json(team);
});

router.patch("/teams/:id", async (req, res) => {
  const idParsed = UpdateTeamParams.safeParse({ id: Number(req.params.id) });
  if (!idParsed.success) return res.status(400).json({ error: "Invalid id" });
  const parsed = UpdateTeamBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
  const [team] = await db.update(teamsTable).set(parsed.data).where(eq(teamsTable.id, idParsed.data.id)).returning();
  if (!team) return res.status(404).json({ error: "Not found" });
  return res.json(team);
});

router.delete("/teams/:id", async (req, res) => {
  const parsed = DeleteTeamParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) return res.status(400).json({ error: "Invalid id" });
  await db.delete(teamsTable).where(eq(teamsTable.id, parsed.data.id));
  return res.status(204).send();
});

export default router;
