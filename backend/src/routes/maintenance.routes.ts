import { createHash, timingSafeEqual } from "node:crypto";
import { Router } from "express";
import { maintenanceController } from "../controllers/maintenance.controller.js";
import { keepNeo4jAlive, keepRedisAlive } from "../services/maintenance.service.js";

export function createMaintenanceRouter(checks = { neo4j: keepNeo4jAlive, redis: keepRedisAlive }) {
  const router = Router();
  router.use((req, res, next) => {
    res.set("Cache-Control", "no-store");
    const expected = process.env.MAINTENANCE_SECRET;
    if (!expected?.trim()) {
      res.status(503).json({ error: "Maintenance is not configured" });
      return;
    }
    const supplied = req.get("X-Maintenance-Secret");
    const digest = (value: string) => createHash("sha256").update(value).digest();
    if (!supplied || !timingSafeEqual(digest(supplied), digest(expected))) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    next();
  });
  router.post("/neo4j", maintenanceController("neo4j", checks.neo4j));
  router.post("/redis", maintenanceController("redis", checks.redis));
  return router;
}

export default createMaintenanceRouter();
