import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { clerkMiddleware } from "@clerk/express";
dotenv.config();

import queryRoutes from "./routes/query.routes.js";
import outputRoutes from "./routes/output.routes.js";
import authRoutes from "./routes/auth.routes.js";
import journeyRoutes from "./routes/journey.routes.js";
import userRoutes from "./routes/user.routes.js";
import communityRoutes from "./routes/community.routes.js";

const app = express();

const allowedOrigins = process.env.CORS_ORIGINS?.split(",") ?? [];
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(express.json());
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] Incoming request: ${req.method} ${req.url}`);
  next();
});
app.use(clerkMiddleware());

app.use("/api/query", queryRoutes);
app.use("/api/output", outputRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/journey", journeyRoutes);
app.use("/api/user", userRoutes);
app.use("/api/community", communityRoutes);

app.get("/", (_req, res) => {
  res.send("Backend running");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});