import type { Request, Response } from "express";
import { getTopics } from "../processors/community/getTopics.processor.js";
import { getSubtopics } from "../processors/community/getSubtopics.processor.js";
import { searchCommunity } from "../processors/community/searchCommunity.processor.js";
import { getJourney } from "../processors/community/getJourney.processor.js";


export async function getTopicsController(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    const topics = await getTopics();

    res.json({ topics });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error);

    res.status(500).json({ error: message });
  }
}

export async function getSubtopicsController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const topic = req.query.topic;

    if (typeof topic !== "string") {
      res.status(400).json({
        error: "topic query parameter is required",
      });
      return;
    }

    const subtopics = await getSubtopics(topic);

    res.json({ subtopics });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error);

    res.status(500).json({ error: message });
  }
}

export async function searchCommunityController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const topic = typeof req.query.topic === "string" ? req.query.topic : undefined;
    const subtopic = typeof req.query.subtopic === "string" ? req.query.subtopic : undefined;
    const page = typeof req.query.page === "string" ? Number(req.query.page): 1;
    const limit = typeof req.query.limit === "string" ? Number(req.query.limit) : 20;
    const users = await searchCommunity({ topic, subtopic, page, limit,});
    res.json(users);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
  }
}

interface JourneyParams {
  username: string;
}

export async function getJourneyController(
  req: Request<JourneyParams>,
  res: Response
): Promise<void> {
  try {
    const { username } = req.params;
    
    let userId = undefined;
    const auth = (req as any).auth;
    if (auth && auth.userId) {
      userId = auth.userId;
    }

    const journey = await getJourney(username, userId);

    res.json(journey);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error);

    res.status(500).json({ error: message });
  }
}

export async function getFeedController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    let userId = undefined;
    
    const auth = (req as any).auth;
    if (auth && auth.userId) {
      userId = auth.userId;
    }

    const page = typeof req.query.page === "string" ? Number(req.query.page) : 1;
    const limit = typeof req.query.limit === "string" ? Number(req.query.limit) : 20;

    const { getFeed } = await import("../processors/community/getFeed.processor.js");
    const feed = await getFeed(userId, page, limit);

    res.json(feed);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
  }
}

export async function upvoteExperienceController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const auth = (req as any).auth;
    if (!auth || !auth.userId) {
      res.status(401).json({ error: "Unauthorized. Must be logged in to upvote." });
      return;
    }
    const userId = auth.userId as string;
    const experienceId = req.params.id as string;

    const { upvoteExperience } = await import("../processors/community/upvoteExperience.processor.js");
    const result = await upvoteExperience(userId, experienceId);

    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
  }
}

export async function getGraphController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const limit = typeof req.query.limit === "string" ? Number(req.query.limit) : 20;

    const { getGraph } = await import("../processors/community/getGraph.processor.js");
    const graph = await getGraph(limit);

    res.json(graph);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
  }
}