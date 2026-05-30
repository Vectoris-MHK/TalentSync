import './config/instrument.js'
import express from "express";
import cors from "cors";
import 'dotenv/config'
import connectDB from "./config/db.js";
import * as Sentry from "@sentry/node";
import { clerkWebhooks } from './controller/webhooks.js';
import companyRoutes from './routes/companyRoutes.js'
import connectCloudinary from './config/cloudinary.js';
import JobRoutes from './routes/jobRoutes.js';
import userRoutes from './routes/userRoutes.js';
import { clerkMiddleware } from '@clerk/express';

const app = express();

// ── DB readiness guard ──────────────────────────────────────────
let ready = false;
let readyPromise = null;

async function init() {
  await connectDB();
  await connectCloudinary();
  ready = true;
}

// Fire-and-forget in production; block in dev
if (process.env.NODE_ENV !== 'production') {
  await init();
} else {
  init();
}

function dbReady(req, res, next) {
  if (ready) return next();

  if (!readyPromise) readyPromise = init();

  readyPromise
    .then(() => next())
    .catch((err) => {
      console.error("DB init failed:", err);
      res.status(503).json({
        success: false,
        message: "Service temporarily unavailable. Please try again."
      });
    });
}
// ─────────────────────────────────────────────────────────────────

app.use(cors());
app.use(express.json());

// Public routes — MUST come before clerkMiddleware
app.get("/", (req, res) => res.send("API Working"));
app.get("/health", async (req, res) => {
  const mongoose = (await import("mongoose")).default;
  const state = mongoose.connection.readyState;
  const states = { 0: "disconnected", 1: "connected", 2: "connecting", 3: "disconnecting" };
  if (state !== 1) {
    return res.status(503).json({ status: "unavailable", db: states[state] || "unknown" });
  }
  res.json({ status: "ok", db: "connected" });
});

if (process.env.NODE_ENV !== 'production') {
  app.get("/debug-sentry", function mainHandler(req, res) {
    throw new Error("My first Sentry error!");
  });
}

// Auth middleware — after public routes, before protected routes
app.use(clerkMiddleware());

// Clerk webhooks MUST use raw body before express.json() parses it
app.post('/webhooks', express.raw({ type: 'application/json' }), clerkWebhooks);

// API routes — gated behind dbReady (wait for MongoDB pool)
app.use('/api/company', dbReady, companyRoutes);
app.use('/api/jobs', dbReady, JobRoutes);
app.use('/api/users', dbReady, userRoutes);

Sentry.setupExpressErrorHandler(app);

const port = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'production' || process.env.IS_DOCKER === 'true') {
  app.listen(port, () => console.log(`Server running on port ${port}`));
}

export default app;
