import { randomUUID } from "crypto";
import { createGoal } from "../../services/goal.service.js";
import { extractGoal } from "./extractGoal.processor.js";
import { submitGoalSchema, journeyGoalSchema, type SubmitGoal } from "./journeySchema.js";
import type { JourneyGoal } from "../../types/journey/Journey.types.js";
import { validateGoalDuplicate } from "./staticAnalysis/goalDuplicate.validator.js";
import { addGoalReputation } from "../../services/reputation.service.js";

export async function submitGoal(
  userId: string,
  input: SubmitGoal
) {
  const validation = submitGoalSchema.safeParse(input);
  if (!validation.success) {
    throw new Error(
      `Invalid goal: ${validation.error.message}`
    );
  }
  const validGoal = validation.data;
  
  let goalInput: JourneyGoal;
  let goalSource: "generated" | "manual";
  
  if ("narrative" in validGoal) {
    const extractedGoal = await extractGoal(validGoal.narrative);
    goalInput = {
      id: randomUUID(),
      title: extractedGoal.title,
      description: extractedGoal.description,
      topics: validGoal.topics,
      subtopics: validGoal.subtopics,
      status: validGoal.status,
      startDate: validGoal.startDate,
      endDate: validGoal.endDate ?? null,
    };
    goalSource = "generated";
  } else {
    const now = new Date();
    const currentMonthYear = `${String(now.getMonth() + 1).padStart(2, "0")} ${now.getFullYear()}`;
    
    let mappedStatus: "ongoing" | "achieved" | "abandoned" = "ongoing";
    if (validGoal.status === "achieved") mappedStatus = "achieved";
    else if (validGoal.status === "abandoned") mappedStatus = "abandoned";

    goalInput = {
      id: randomUUID(),
      title: validGoal.title,
      description: validGoal.description || "",
      topics: (validGoal.topics && validGoal.topics.length > 0) ? validGoal.topics : ["Startup"],
      subtopics: (validGoal.subtopics && validGoal.subtopics.length > 0) ? validGoal.subtopics : ["Software Engineering"],
      status: mappedStatus,
      startDate: validGoal.startDate || currentMonthYear,
      endDate: validGoal.endDate ?? null,
    };
    goalSource = "manual";
  }

  const goalValidation = journeyGoalSchema.safeParse(goalInput);
  if (!goalValidation.success) {
    throw new Error(
      `Invalid ${goalSource} goal: ${goalValidation.error.message}`
    );
  }
  const goalToSave: JourneyGoal = {
    ...goalValidation.data,
    endDate: goalValidation.data.endDate ?? null,
  };

  const isDuplicate = await validateGoalDuplicate(
    userId,
    goalToSave.title,
    goalToSave.description
  );
  if (isDuplicate) {
    throw new Error("A similar goal already exists.");
  }
  await createGoal(userId, goalToSave);
  await addGoalReputation(userId, 1);
  return {
    id: goalToSave.id,
    title: goalToSave.title,
  };
}