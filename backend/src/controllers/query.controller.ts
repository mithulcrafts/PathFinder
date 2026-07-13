import type { Request, Response } from "express";
import { understandQuery } from "../processors/query/understandQuery.processor.js";
import { retrieveContext } from "../processors/query/retrieveContext.processor.js";
import { aggregateContext } from "../processors/query/aggregateContext.processor.js";
import { resolveQueryInput } from "../processors/speech/resolveQueryInput.processor.js";

export async function queryController(req: Request, res: Response): Promise<void> {
  try {
    console.log("BODY:", req.body);
    console.log("FILE:", req.file);
    const query = req.body?.query;
    console.log("Resolving query input...");
    const { query: resolvedQuery, transcribed } = await resolveQueryInput({ query, audioFile: req.file });
    console.log("Resolved query:", resolvedQuery);

    console.log("Understanding query...");
    const structuredQuery = await understandQuery(resolvedQuery);
    console.log("Structured query:", structuredQuery);

    console.log("Retrieving context...");
    const context = await retrieveContext(structuredQuery);
    console.log("Retrieved context successfully");

    console.log("Aggregating context...");
    const aggregatedContext = await aggregateContext(resolvedQuery, structuredQuery, context);
    console.log("Aggregated context successfully");

    res.json({
      query: resolvedQuery,
      transcribed,
      structuredQuery,
      context,
      aggregatedContext
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: `Failed to process query: ${message}` });
  }
}