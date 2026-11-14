import { Router } from "express";
import multer from "multer";
import { requireAuth } from "../middleware/auth.middleware.js";
import { MAX_PROOF_FILE_SIZE } from "../processors/journey/verifyProof.processor.js";
import { startJourneyController, continueJourneyController, submitGoalController,submitJourneyController } from "../controllers/journey.controller.js";

const router = Router();
const uploadProof = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_PROOF_FILE_SIZE } }).single("proof");
router.post("/start", requireAuth, startJourneyController);
router.post("/message", requireAuth, continueJourneyController);
router.post("/submit/goal",requireAuth,submitGoalController);
router.post("/submit", requireAuth, (req, res, next) => {
  uploadProof(req, res, (error: unknown) => {
    if (error instanceof multer.MulterError) {
      const tooLarge = error.code === "LIMIT_FILE_SIZE";
      res.status(tooLarge ? 413 : 400).json({
        error: tooLarge ? "Attachments must be 10 MB or smaller." : "Attach one photo or document per submission.",
      });
      return;
    }
    next(error);
  });
}, submitJourneyController);


export default router;
