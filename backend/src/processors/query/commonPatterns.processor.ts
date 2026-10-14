import type {RetrievedContext} from "./retrieveContext.processor.js";

import {generateJourneyPatterns} from "../../services/commonPatterns.service.js";
import {mineJourneyPatterns,} from "../../services/mineJourneyPatterns.service.js";

export interface CommonPattern {
  title: string;
  description: string;
  frequency: number;
  percentage: number;
}

export async function buildCommonPatterns(
  context: RetrievedContext
): Promise<CommonPattern[]> {

  const journeyPatterns = mineJourneyPatterns(context);

  if (journeyPatterns.length === 0) {
    return [];
  }

  const patterns = await generateJourneyPatterns(journeyPatterns);
  const totalFrequency = patterns.reduce((sum, pattern) => sum + pattern.frequency,0);

  return patterns.map(
    (pattern) => ({
      ...pattern,

      percentage:(pattern.frequency / totalFrequency) * 100,
    })
  );
}