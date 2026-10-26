import type { RequestHandler } from "express";

export function maintenanceController(database: string, check: () => Promise<void>): RequestHandler {
  return async (_req, res) => {
    try {
      await check();
      res.json({ status: "ok", database });
    } catch {
      // Provider errors can contain credentials or connection URLs.
      console.error(`Maintenance check failed for ${database}`);
      res.status(503).json({ status: "error", database, error: "Database maintenance check failed" });
    }
  };
}
