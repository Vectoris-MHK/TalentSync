import "dotenv/config";
import mongoose from "mongoose";
import Job from "../models/Job.js";
import UserEvent from "../models/UserEvent.js";

import { uriFromSrv } from "./resolveSrv.js";

const MONGODB_URI = process.env.MONGODB_URI;

const USER_PROFILES = {
  IT: { ids: ["user_seed_1", "user_seed_2", "user_seed_3", "user_seed_4", "user_seed_5"], categories: ["Lập trình"], count: 5 },
  Design: { ids: ["user_seed_6", "user_seed_7", "user_seed_8"], categories: ["Thiết kế"], count: 3 },
  Mixed: { ids: ["user_seed_9", "user_seed_10"], categories: ["Lập trình", "Thiết kế"], count: 2 },
};

function randomPick(arr, n) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function seed() {
  await mongoose.connect(await uriFromSrv(MONGODB_URI), { dbName: "job-portal", serverSelectionTimeoutMS: 15000, connectTimeoutMS: 15000 });
  console.log("Connected to MongoDB");

  await UserEvent.deleteMany({ userId: /^user_seed_/ });
  console.log("Cleared existing seed events");

  const allJobs = await Job.find({ visible: true });
  const jobsByCategory = {};
  for (const job of allJobs) {
    if (!jobsByCategory[job.category]) jobsByCategory[job.category] = [];
    jobsByCategory[job.category].push(job);
  }

  const events = [];
  const now = Date.now();
  const oneDay = 86400000;
  const viewDedupWindow = 30 * 60 * 1000;

  for (const [profile, { ids, categories, count: userCount }] of Object.entries(USER_PROFILES)) {
    const eligibleJobs = categories.flatMap((cat) => jobsByCategory[cat] || []);
    if (eligibleJobs.length === 0) {
      console.warn(`No jobs found for categories: ${categories.join(", ")}`);
      continue;
    }

    for (const userId of ids) {
      const viewedJobIds = new Set();
      const activityDays = randomBetween(5, 14);
      const delays = Array.from({ length: activityDays }, (_, i) => i * oneDay).sort(() => Math.random() - 0.5);

      for (const delayMs of delays) {
        const timestamp = now - delayMs;

        const viewPool = eligibleJobs.filter((j) => !viewedJobIds.has(j._id.toString()));
        const viewCount = randomBetween(2, 4);
        for (const job of randomPick(viewPool, Math.min(viewCount, viewPool.length))) {
          const exists = events.some(
            (e) =>
              e.userId === userId &&
              e.jobId.equals(job._id) &&
              e.eventType === "view" &&
              Math.abs(e.timestamp - timestamp) < viewDedupWindow
          );
          if (!exists) {
            events.push({ userId, jobId: job._id, eventType: "view", weight: 1, timestamp });
            viewedJobIds.add(job._id.toString());
          }
        }

        if (Math.random() < 0.3) {
          const bookmarkJob = randomPick(
            allJobs.filter((j) => viewedJobIds.has(j._id.toString())),
            1
          )[0];
          if (bookmarkJob) {
            events.push({ userId, jobId: bookmarkJob._id, eventType: "bookmark", weight: 3, timestamp: timestamp + 60000 });
          }
        }

        if (Math.random() < 0.15) {
          const applyJob = randomPick(
            eligibleJobs.filter((j) => viewedJobIds.has(j._id.toString())),
            1
          )[0];
          if (applyJob) {
            events.push({ userId, jobId: applyJob._id, eventType: "apply", weight: 5, timestamp: timestamp + 120000 });
          }
        }
      }
    }
  }

  if (events.length > 0) {
    const result = await UserEvent.insertMany(events, { ordered: false });
    console.log(`Created ${result.length} events`);
  } else {
    console.log("No events created");
  }

  const stats = await UserEvent.aggregate([
    { $group: { _id: "$userId", count: { $sum: 1 }, types: { $addToSet: "$eventType" } } },
    { $sort: { count: -1 } },
  ]);
  for (const s of stats) {
    console.log(`  ${s._id}: ${s.count} events [${s.types.join(", ")}]`);
  }

  await mongoose.disconnect();
  console.log("Disconnected");
}

seed().catch((err) => { console.error("Seed events failed:", err); process.exit(1); });
