/**
 * Local test for GET /api/jobs/collaborative logic (Task J)
 * Usage: node scripts/testCollaborative.js
 */
import "dotenv/config";
import mongoose from "mongoose";
import UserEvent from "../models/UserEvent.js";
import Job from "../models/Job.js";

import { uriFromSrv } from "./resolveSrv.js";

const MONGODB_URI = process.env.MONGODB_URI;

async function runCollaborative(userId) {
  const seenEvents = await UserEvent.find({ userId }).select("jobId").lean();
  const seenJobIds = seenEvents.map((e) => e.jobId);

  if (seenJobIds.length === 0) return { jobs: [], reason: "no_events" };

  const results = await UserEvent.aggregate([
    { $match: { userId, eventType: { $in: ["bookmark", "apply"] } } },
    {
      $lookup: {
        from: "userevents",
        let: { targetJobId: "$jobId" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [{ $eq: ["$jobId", "$$targetJobId"] }, { $ne: ["$userId", userId] }],
              },
            },
          },
          { $project: { userId: 1, _id: 0 } },
        ],
        as: "similarUserEvents",
      },
    },
    { $unwind: "$similarUserEvents" },
    { $group: { _id: "$similarUserEvents.userId" } },
    {
      $lookup: {
        from: "userevents",
        let: { similarUserId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$userId", "$$similarUserId"] },
                  { $in: ["$eventType", ["bookmark", "apply"]] },
                ],
              },
            },
          },
          { $project: { jobId: 1, weight: 1, _id: 0 } },
        ],
        as: "likedJobs",
      },
    },
    { $unwind: "$likedJobs" },
    { $group: { _id: "$likedJobs.jobId", interactionScore: { $sum: "$likedJobs.weight" }, interactionCount: { $sum: 1 } } },
    { $match: { _id: { $nin: seenJobIds } } },
    { $sort: { interactionScore: -1 } },
    { $limit: 40 },
    { $lookup: { from: "jobs", localField: "_id", foreignField: "_id", as: "job" } },
    { $unwind: "$job" },
    { $match: { "job.visible": true } },
    {
      $project: {
        _id: "$job._id",
        title: "$job.title",
        category: "$job.category",
        interactionScore: 1,
        interactionCount: 1,
      },
    },
    { $limit: 20 },
  ]);

  return { jobs: results, seenCount: seenJobIds.length };
}

async function run() {
  await mongoose.connect(await uriFromSrv(MONGODB_URI), { dbName: "job-portal", serverSelectionTimeoutMS: 15000 });
  console.log("Connected to MongoDB\n");

  // ── Test 1: IT user (user_seed_1) should get non-IT or cross-user IT recs ──
  console.log("=== Test 1: IT user (user_seed_1) ===");
  const r1 = await runCollaborative("user_seed_1");
  if (r1.reason === "no_events") {
    console.log("SKIP — no events. Run seedEvents.js first.\n");
  } else {
    console.log(`Seen jobs: ${r1.seenCount} | Collaborative results: ${r1.jobs.length}`);
    r1.jobs.slice(0, 5).forEach((j, i) =>
      console.log(`  ${i + 1}. [${j.category}] ${j.title} — score: ${j.interactionScore}, count: ${j.interactionCount}`)
    );
    console.log(r1.jobs.length > 0 ? "PASS\n" : "INFO — 0 results (may need more overlap between users)\n");
  }

  // ── Test 2: Design user (user_seed_6) should get Design-leaning recs ──────
  console.log("=== Test 2: Design user (user_seed_6) ===");
  const r2 = await runCollaborative("user_seed_6");
  if (r2.reason === "no_events") {
    console.log("SKIP\n");
  } else {
    console.log(`Seen jobs: ${r2.seenCount} | Collaborative results: ${r2.jobs.length}`);
    r2.jobs.slice(0, 5).forEach((j, i) =>
      console.log(`  ${i + 1}. [${j.category}] ${j.title} — score: ${j.interactionScore}`)
    );
    console.log(r2.jobs.length > 0 ? "PASS\n" : "INFO — 0 results\n");
  }

  // ── Test 3: exclusion — results must not contain seen jobs ────────────────
  console.log("=== Test 3: Exclusion check (user_seed_1) ===");
  const seenIds = (await UserEvent.find({ userId: "user_seed_1" }).select("jobId").lean()).map((e) =>
    e.jobId.toString()
  );
  const r3 = await runCollaborative("user_seed_1");
  const leaked = r3.jobs.filter((j) => seenIds.includes(j._id.toString()));
  console.log(`Seen: ${seenIds.length} | Results: ${r3.jobs.length} | Leaked seen jobs: ${leaked.length}`);
  console.log(leaked.length === 0 ? "PASS — no seen jobs in results\n" : `FAIL — ${leaked.length} seen jobs leaked\n`);

  // ── Test 4: cold start (user with no events) ──────────────────────────────
  console.log("=== Test 4: Cold start (no events) ===");
  const r4 = await runCollaborative("user_seed_nonexistent");
  console.log(r4.reason === "no_events" ? "PASS — returns empty with reason\n" : "FAIL\n");

  await mongoose.disconnect();
  console.log("Disconnected. Done.");
}

run().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
