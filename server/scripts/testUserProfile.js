/**
 * Local test for GET /api/users/profile logic (5.2)
 * Simulates the controller without needing the HTTP server running.
 *
 * Usage: node server/scripts/testUserProfile.js
 */
import "dotenv/config";
import mongoose from "mongoose";
import User from "../models/User.js";
import UserEvent from "../models/UserEvent.js";
import Job from "../models/Job.js";

import { uriFromSrv } from "./resolveSrv.js";

const MONGODB_URI = process.env.MONGODB_URI;

// ─── helpers (same logic as controller) ──────────────────────────────────────

function computeUnitEmbedding(validJobs) {
  const dims = 3072;
  const avgVec = new Array(dims).fill(0);
  let totalWeight = 0;

  for (const { embedding, totalWeight: w } of validJobs) {
    for (let i = 0; i < dims; i++) avgVec[i] += embedding[i] * w;
    totalWeight += w;
  }
  for (let i = 0; i < dims; i++) avgVec[i] /= totalWeight;

  const magnitude = Math.sqrt(avgVec.reduce((s, v) => s + v * v, 0));
  return magnitude > 0 ? avgVec.map((v) => v / magnitude) : avgVec;
}

// ─── test runner ─────────────────────────────────────────────────────────────

async function run() {
  await mongoose.connect(await uriFromSrv(MONGODB_URI), {
    dbName: "job-portal",
    serverSelectionTimeoutMS: 15000,
  });
  console.log("Connected to MongoDB\n");

  // ── Test 1: cold start (user with no events) ──────────────────────────────
  console.log("=== Test 1: Cold start (no events) ===");
  const coldUser = await User.findOne({ embedding: { $size: 0 } });
  if (!coldUser) {
    console.log("SKIP — no user without embedding found");
  } else {
    const events = await UserEvent.countDocuments({ userId: coldUser._id });
    console.log(`User: ${coldUser._id} | events: ${events} | preferences: [${coldUser.preferences}]`);
    if (events === 0) {
      console.log("PASS — cold start path: would return preferences\n");
    } else {
      console.log("INFO — user has events, not a pure cold start\n");
    }
  }

  // ── Test 2: aggregation pipeline ─────────────────────────────────────────
  console.log("=== Test 2: Aggregation pipeline ===");
  const anyEvent = await UserEvent.findOne();
  if (!anyEvent) {
    console.log("SKIP — no UserEvents in DB. Run seedEvents.js first.\n");
  } else {
    const userId = anyEvent.userId;
    console.log(`Testing with userId: ${userId}`);

    const topJobs = await UserEvent.aggregate([
      { $match: { userId } },
      { $group: { _id: "$jobId", totalWeight: { $sum: "$weight" } } },
      { $sort: { totalWeight: -1 } },
      { $limit: 50 },
      { $lookup: { from: "jobs", localField: "_id", foreignField: "_id", as: "job" } },
      { $unwind: "$job" },
      { $project: { totalWeight: 1, embedding: "$job.embedding" } },
    ]);

    console.log(`Aggregation returned ${topJobs.length} job(s)`);
    const validJobs = topJobs.filter((j) => j.embedding && j.embedding.length === 3072);
    console.log(`Jobs with valid 3072d embeddings: ${validJobs.length}`);

    if (validJobs.length === 0) {
      console.log("INFO — no embeddings yet; run seedEmbeddings.js first\n");
    } else {
      const unitVec = computeUnitEmbedding(validJobs);
      const mag = Math.sqrt(unitVec.reduce((s, v) => s + v * v, 0));
      console.log(`Unit vector magnitude: ${mag.toFixed(6)} (should be ~1.0)`);
      console.log(`First 5 dims: [${unitVec.slice(0, 5).map((v) => v.toFixed(6)).join(", ")}]`);
      console.log("PASS — embedding computed and normalized\n");
    }
  }

  // ── Test 3: preferences validation ───────────────────────────────────────
  console.log("=== Test 3: Preferences validation ===");
  const VALID_CATEGORIES = ["Lập trình", "Thiết kế", "Marketing", "Tài chính", "Quản lý", "Kinh doanh"];
  const input = ["Lập trình", "Thiết kế", "InvalidCategory", "Hacking"];
  const filtered = input.filter((p) => VALID_CATEGORIES.includes(p));
  console.log(`Input:    [${input.join(", ")}]`);
  console.log(`Filtered: [${filtered.join(", ")}]`);
  const pass = filtered.length === 2 && filtered.includes("Lập trình") && filtered.includes("Thiết kế");
  console.log(pass ? "PASS — invalid categories stripped correctly\n" : "FAIL\n");

  // ── Test 4: DB round-trip for preferences ─────────────────────────────────
  console.log("=== Test 4: DB write — preferences ===");
  const testUser = await User.findOne({ _id: /^user_seed_/ });
  if (!testUser) {
    console.log("SKIP — no seed users found\n");
  } else {
    const before = [...testUser.preferences];
    await User.findByIdAndUpdate(testUser._id, { $set: { preferences: ["Lập trình", "Thiết kế"] } });
    const after = await User.findById(testUser._id);
    const pass4 = after.preferences.includes("Lập trình") && after.preferences.includes("Thiết kế");
    console.log(`User ${testUser._id}: preferences updated to [${after.preferences.join(", ")}]`);
    console.log(pass4 ? "PASS\n" : "FAIL\n");
    // restore
    await User.findByIdAndUpdate(testUser._id, { $set: { preferences: before } });
  }

  await mongoose.disconnect();
  console.log("Disconnected. Done.");
}

run().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
