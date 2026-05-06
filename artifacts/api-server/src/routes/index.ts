import { Router, type IRouter } from "express";
import healthRouter from "./health";
import ticketsRouter from "./tickets";
import aiSummaryRouter from "./ai-summary";
import aiRouter from "./ai";

const router: IRouter = Router();

router.use(healthRouter);
router.use(ticketsRouter);
router.use(aiSummaryRouter);
router.use(aiRouter);

export default router;
