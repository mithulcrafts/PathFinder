import { geminiClient } from "../../config/gemini.config.js";
import type { JourneyProof } from "../../types/journey/Journey.types.js";
import { PROOF_VERIFICATION_SYSTEM_PROMPT, buildProofVerificationPrompt } from "../../prompts/onboarding/proofVerification.prompt.js";
import { z } from "zod";
import { journeyProofSchema } from "./journeySchema.js";
import { SchemaType, type Schema } from "@google/generative-ai";
import { cloudinary } from "../../config/cloudinary.config.js";
import { PDFParse } from "pdf-parse";
import type { SubmitExperience, SubmitProof } from "./journeySchema.js";


export const MAX_PROOF_FILE_SIZE = 10 * 1024 * 1024; // 10MB limit

export function uploadProofToCloudinary(
  file: Express.Multer.File
): Promise<string> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "pathfinder/proofs",
        resource_type: "auto",
        timeout: 10_000,
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary returned no upload result"));
          return;
        }

        resolve(result.secure_url);
      }
    );

    stream.end(file.buffer);
  });
}

const proofVerdictSchema = z.object({
  status: z.enum(["verified", "rejected"]),
  reason: z.string().trim().min(1),
});

const temporaryLlmResponseSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    status: {
      type: SchemaType.STRING,
      format: "enum",
      enum: ["verified", "rejected"],
      description: "Whether the proof supports the claimed experience: must be 'verified' or 'rejected'",
    },
    reason: {
      type: SchemaType.STRING,
      description: "Detailed explanation of why the status was chosen and how the proof supports or fails to support the experience",
    },
  },
  required: ["status", "reason"],
};

interface GitHubParseResult {
  type: "repository" | "pull" | "commit" | "user";
  owner: string;
  repo?: string;
  id?: string;
}

/**
 * Parses and strictly validates a GitHub URL to support Profile, Repo, PR, and Commit types.
 */
function parseGitHubUrl(url: string): GitHubParseResult | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" || !["github.com", "www.github.com"].includes(parsed.hostname)) return null;
    const parts = parsed.pathname.split("/").filter(Boolean);
    if (parts.some(part => !/^[\w.-]+$/.test(part))) return null;
    if (parts.length === 0) return null;

    const owner = parts[0];
    if (!owner) return null;

    // User Profile: github.com/username
    if (parts.length === 1) {
      return { type: "user", owner };
    }

    const repo = parts[1];
    if (!repo) return null;

    // Repository: github.com/owner/repo
    if (parts.length === 2) {
      return { type: "repository", owner, repo: repo.replace(/\.git$/, "") };
    }

    // Pull Request: github.com/owner/repo/pull/num
    if (parts.length === 4 && parts[2] === "pull") {
      const id = parts[3];
      if (!id || !/^\d+$/.test(id)) return null;
      return { type: "pull", owner, repo, id };
    }

    // Commit: github.com/owner/repo/commit/sha
    if (parts.length === 4 && parts[2] === "commit") {
      const id = parts[3];
      if (!id || !/^[a-f0-9]+$/i.test(id)) return null;
      return { type: "commit", owner, repo, id };
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Fetches the first 1000 characters of a repository's README.
 */
async function fetchReadme(owner: string, repo: string): Promise<string> {
  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, {
      headers: { "User-Agent": "PathFinder-Proof-Verification" },
      signal: AbortSignal.timeout(4_000),
    });
    if (!res.ok) return "No README available or failed to fetch";
    const data = (await res.json()) as any;
    if (data.content) {
      const decoded = Buffer.from(data.content, "base64").toString("utf8");
      return decoded.substring(0, 1000) + (decoded.length > 1000 ? "... [truncated]" : "");
    }
    return "No README content found";
  } catch {
    return "Failed to fetch README";
  }
}

/**
 * Standalone Proof Verification Processor.
 * Verifies if the submitted proof supports the claimed experience.
 * This processor does not mutate database records.
 */
export async function verifyProof(
  experience: SubmitExperience,
  proof: SubmitProof,
  uploadedFile: Express.Multer.File | null
): Promise<JourneyProof> {
  const { sourceType } = proof;
  const url = proof.url ?? null;
  let storedUrl = url;
  const unsuccessful = (status: "rejected" | "failed" | "skipped", reason: string): JourneyProof => ({
    id: proof.id, sourceType, url: storedUrl, status, verifiedAt: null, reason,
  });
  try {
    if (sourceType === "image" || sourceType === "pdf") {
      if (!uploadedFile?.buffer.length) return unsuccessful("rejected", "The attached file is missing or empty.");
      if (uploadedFile.size > MAX_PROOF_FILE_SIZE) return unsuccessful("rejected", "The attachment exceeds 10 MB.");
      const supported = sourceType === "pdf"
        ? uploadedFile.mimetype === "application/pdf"
        : ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"].includes(uploadedFile.mimetype);
      if (!supported) return unsuccessful("skipped", "Use a PDF or a supported image format for verification.");
      storedUrl = await uploadProofToCloudinary(uploadedFile);
    }

    let verificationContext = "";
    let imagePart: any = null;

    if (sourceType === "github") {
      const parsed = url && parseGitHubUrl(url);
      if (!parsed) return unsuccessful("rejected", "Use a GitHub profile, repository, pull request, or commit URL.");

      const request = { headers: { "User-Agent": "PathFinder-Proof-Verification" }, signal: AbortSignal.timeout(8_000) };
      let payload: any = { type: parsed.type };

      if (parsed.type === "repository") {
        const res = await fetch(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}`, request);
        if (res.status === 404) return unsuccessful("rejected", "GitHub could not find public evidence at that URL.");
        if (!res.ok) throw new Error(`GitHub Repository API error (${res.status}): ${res.statusText}`);
        const data = (await res.json()) as any;
        payload.repository = {
          name: data.name,
          description: data.description,
          language: data.language,
          created_at: data.created_at,
          updated_at: data.updated_at,
          pushed_at: data.pushed_at,
          owner: data.owner?.login,
        };
        payload.topics = data.topics || [];
        payload.readme = await fetchReadme(parsed.owner, parsed.repo!);

      } else if (parsed.type === "pull") {
        const res = await fetch(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}/pulls/${parsed.id}`, request);
        if (res.status === 404) return unsuccessful("rejected", "GitHub could not find public evidence at that URL.");
        if (!res.ok) throw new Error(`GitHub Pull Request API error (${res.status}): ${res.statusText}`);
        const data = (await res.json()) as any;
        payload.pullRequest = {
          title: data.title,
          body: data.body,
          state: data.state,
          created_at: data.created_at,
          closed_at: data.closed_at,
          user: data.user?.login,
          merged: data.merged,
          merged_at: data.merged_at,
          merged_by: data.merged_by?.login,
        };

      } else if (parsed.type === "commit") {
        const res = await fetch(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}/commits/${parsed.id}`, request);
        if (res.status === 404) return unsuccessful("rejected", "GitHub could not find public evidence at that URL.");
        if (!res.ok) throw new Error(`GitHub Commit API error (${res.status}): ${res.statusText}`);
        const data = (await res.json()) as any;
        payload.commit = {
          message: data.commit?.message,
          author: data.commit?.author?.name,
          date: data.commit?.author?.date,
          login: data.author?.login,
          stats: data.stats,
          files: (data.files || []).slice(0, 10).map((f: any) => f.filename),
        };

      } else if (parsed.type === "user") {
        const res = await fetch(`https://api.github.com/users/${parsed.owner}`, request);
        if (res.status === 404) return unsuccessful("rejected", "GitHub could not find public evidence at that URL.");
        if (!res.ok) throw new Error(`GitHub User API error (${res.status}): ${res.statusText}`);
        const data = (await res.json()) as any;
        payload.userProfile = {
          login: data.login,
          name: data.name,
          company: data.company,
          blog: data.blog,
          location: data.location,
          bio: data.bio,
          public_repos: data.public_repos,
          followers: data.followers,
        };
      }

      verificationContext = JSON.stringify(payload, null, 2);

    } else if (sourceType === "pdf") {
      const parser = new PDFParse({ data: uploadedFile!.buffer });
      try {
        const parsedText = await parser.getText();
        if (!parsedText.text.trim()) return unsuccessful("skipped", "The PDF contains no extractable text.");
        verificationContext = parsedText.text.slice(0, 30_000);
      } finally {
        await parser.destroy();
      }
    } else if (sourceType === "image") {
      imagePart = {
        inlineData: {
          data: uploadedFile!.buffer.toString("base64"),
          mimeType: uploadedFile!.mimetype,
        },
      };
      verificationContext = "Analyze the attached image.";
    } else {
      return unsuccessful("skipped", "Generic links are not supported for verification.");
    }

    const model = geminiClient.getGenerativeModel({
      model: "gemini-3.1-flash-lite",
      systemInstruction: PROOF_VERIFICATION_SYSTEM_PROMPT,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: temporaryLlmResponseSchema,
        temperature: 0.1,
      },
    });

    const userPrompt = buildProofVerificationPrompt(
      {
        title: experience.title,
        organization: experience.organization ?? null,
        startDate: experience.startDate,
        endDate: experience.endDate ?? null,
        context: experience.context,
        achievements: experience.achievements ?? null,
        skills: experience.skills,
      },
      sourceType,
      verificationContext
    );

    const contents: any[] = [userPrompt];
    if (imagePart) {
      contents.push(imagePart);
    }

    const result = await model.generateContent(contents, { timeout: 15_000 });
    const text = result.response.text();
    if (!text) {
      throw new Error("Gemini returned empty verification response");
    }

    const verificationObj = proofVerdictSchema.parse(JSON.parse(text));

    // Validate against the single source of truth Zod schema: journeyProofSchema
    const candidateResult = {
      id: proof.id,
      sourceType: proof.sourceType,
      url: storedUrl,
      status: verificationObj.status,
      verifiedAt: verificationObj.status === "verified" ? new Date().toISOString() : null,
      reason: verificationObj.reason,
    };

    const validated = journeyProofSchema.safeParse(candidateResult);
    if (!validated.success) {
      throw new Error(`Gemini response failed schema validation: ${validated.error.message}`);
    }

    return {
      ...validated.data,
      verifiedAt: validated.data.verifiedAt ?? null,
      reason: validated.data.reason ?? null,
    };

  } catch (error) {
    console.warn("Proof verification failed", proof.id, error instanceof Error ? error.name : "Unknown error");
    return unsuccessful("failed", "The evidence could not be processed.");
  }
}
