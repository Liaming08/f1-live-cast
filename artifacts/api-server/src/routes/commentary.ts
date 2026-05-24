import { Router } from "express";
import { db } from "@workspace/db";
import { commentaryTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { ListCommentaryParams, AddCommentaryParams, AddCommentaryBody, DeleteCommentaryParams } from "@workspace/api-zod";

const router = Router();

router.get("/races/:id/commentary", async (req, res) => {
  const parsed = ListCommentaryParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) return res.status(400).json({ error: "Invalid id" });
  const entries = await db.select().from(commentaryTable)
    .where(eq(commentaryTable.raceId, parsed.data.id))
    .orderBy(desc(commentaryTable.timestamp));
  return res.json(entries.map(e => ({ ...e, timestamp: e.timestamp.toISOString() })));
});

router.post("/races/:id/commentary", async (req, res) => {
  const idParsed = AddCommentaryParams.safeParse({ id: Number(req.params.id) });
  if (!idParsed.success) return res.status(400).json({ error: "Invalid id" });
  const parsed = AddCommentaryBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
  const [entry] = await db.insert(commentaryTable).values({
    raceId: idParsed.data.id,
    message: parsed.data.message,
    type: parsed.data.type,
    lap: parsed.data.lap ?? null,
    driverName: parsed.data.driverName ?? null,
  }).returning();
  return res.status(201).json({ ...entry, timestamp: entry.timestamp.toISOString() });
});

router.delete("/commentary/:id", async (req, res) => {
  const parsed = DeleteCommentaryParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) return res.status(400).json({ error: "Invalid id" });
  await db.delete(commentaryTable).where(eq(commentaryTable.id, parsed.data.id));
  return res.status(204).send();
});

export default router;
