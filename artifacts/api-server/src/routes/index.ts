import { Router, type IRouter } from "express";
import healthRouter from "./health";
import racesRouter from "./races";
import driversRouter from "./drivers";
import teamsRouter from "./teams";
import lapsRouter from "./laps";
import commentaryRouter from "./commentary";
import raceControlRouter from "./race_control";
import standingsRouter from "./standings";
import tiresRouter from "./tires";
import openf1Router from "./openf1";

const router: IRouter = Router();

router.use(healthRouter);
router.use(racesRouter);
router.use(driversRouter);
router.use(teamsRouter);
router.use(lapsRouter);
router.use(commentaryRouter);
router.use(raceControlRouter);
router.use(standingsRouter);
router.use(tiresRouter);
router.use(openf1Router);

export default router;
