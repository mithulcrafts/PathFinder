import { Router } from "express";
import multer from "multer";
import { requireAuth } from "../middleware/auth.middleware.js";
import { startJourneyController, continueJourneyController, submitGoalController,submitJourneyController } from "../controllers/journey.controller.js";

const router = Router();
const upload = multer({storage: multer.memoryStorage(),});
router.post("/start", requireAuth, startJourneyController);
router.post("/message", requireAuth, continueJourneyController);
router.post("/submit/goal",requireAuth,submitGoalController);
router.post("/submit", requireAuth,upload.single("proof"),submitJourneyController);


export default router;
