import "../config/env.js";
import { submitGoal } from "../processors/journey/submitGoal.processor.js";

async function run() {
  const testPayload = {
    title: "Test Manual Goal",
    description: "Testing manual goal creation",
    status: "In Progress",
    topics: [],
    subtopics: []
  };

  try {
    console.log("Calling submitGoal processor with:", JSON.stringify(testPayload, null, 2));
    const result = await submitGoal("user_3FfHRpNUWSHBOW6A6mI4OhtcJM4", testPayload as any);
    console.log("✓ Success! Result:", result);
  } catch (err: any) {
    console.error("✗ Failed with error:", err.message);
    if (err.stack) {
      console.error(err.stack);
    }
  }
}

run();
