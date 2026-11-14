import { Redis } from "@upstash/redis";

export const upstash = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
  signal: () => AbortSignal.timeout(5_000),
});
