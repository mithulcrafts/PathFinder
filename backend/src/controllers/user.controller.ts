import type { Request, Response } from "express";
import { updateProfile, getUserJourney, completeJourneyItem } from "../services/user.service.js";
import { toNeo4jDate } from "../utils/helper.js";

export async function updateProfileController(
  req: Request,
  res: Response
): Promise<void> {

  try {
    const userId = req.userId;
    const { username, preferredLanguage } = req.body;
    const user = await updateProfile({
      clerkId: userId,
      username: username ?? null,
      preferredLanguage: preferredLanguage ?? null,
    });
    res.json(user);

  } catch (error) {

    const message = error instanceof Error ? error.message : String(error);

    res.status(500).json({ error: message });

  }
}

export async function getJourneyController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const userId = req.userId;

    const journey = await getUserJourney(userId);

    res.json(journey);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error);

    res.status(500).json({
      error: message,
    });
  }
}

export async function completeJourneyItemController(req: Request, res: Response): Promise<void> {
  const { kind, id } = req.params;
  const endDate = req.body?.endDate;
  if ((kind !== "experience" && kind !== "goal") || typeof id !== "string" || !id) {
    res.status(400).json({ error: "Choose an experience or goal." });
    return;
  }
  if (typeof endDate !== "string" || !/^(0[1-9]|1[0-2]) [1-9]\d{3}$/.test(endDate)) {
    res.status(400).json({ error: "Enter the end date in MM YYYY format." });
    return;
  }

  try {
    const result = await completeJourneyItem(req.userId, kind, id, toNeo4jDate(endDate));
    if (!result) {
      res.status(404).json({ error: "Journey item not found." });
    } else if (result.outcome === "completed") {
      res.status(409).json({ error: "This item is already closed. Refresh your Journey to see its latest status." });
    } else if (result.outcome === "invalid-date") {
      res.status(400).json({ error: "The end date must be on or after the start month." });
    } else {
      res.json({ endDate: result.endDate, status: result.status });
    }
  } catch (error) {
    console.error("Could not complete journey item", error);
    res.status(500).json({ error: "Could not save the end date." });
  }
}
