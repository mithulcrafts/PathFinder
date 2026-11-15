import { getAuth } from "@clerk/express";
import { journeyMatches } from "../services/journeyMatch.service.js";
import type { Request, Response } from "express";
import { understandQuery } from "../processors/query/understandQuery.processor.js";
import { retrieveContext } from "../processors/query/retrieveContext.processor.js";
import { aggregateContext } from "../processors/query/aggregateContext.processor.js";
import { resolveQueryInput } from "../processors/speech/resolveQueryInput.processor.js";

export async function queryController(req: Request, res: Response): Promise<void> {
  res.set("Cache-Control", "private, no-store");
  res.vary("Authorization");
  try {
    const query = req.body?.query;
    const { query: resolvedQuery, transcribed } = await resolveQueryInput({ query, audioFile: req.file });
    const structuredQuery = await understandQuery(resolvedQuery);
    const context = await retrieveContext(structuredQuery);
    const aggregatedContext = await aggregateContext(resolvedQuery, structuredQuery, context);

    const scores = await journeyMatches(getAuth(req).userId, aggregatedContext.timelineFeed.map(journey => journey.username));
    const timelineFeed = aggregatedContext.timelineFeed.map(journey => ({
      ...journey, journeyMatch: scores.get(journey.username) ?? null,
    }));
    res.json({
      query: resolvedQuery,
      transcribed,
      structuredQuery,
      context,
      aggregatedContext: { ...aggregatedContext, timelineFeed }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: `Failed to process query: ${message}` });
  }
}