import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";

import { updateProfileController, getJourneyController, completeJourneyItemController } from "../controllers/user.controller.js";

const router = Router();

router.patch("/profile", requireAuth, updateProfileController);
router.get("/journey", requireAuth, getJourneyController);
router.patch("/journey/:kind/:id/end-date", requireAuth, completeJourneyItemController);

export default router;
