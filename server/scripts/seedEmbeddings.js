import "dotenv/config";
import mongoose from "mongoose";
import Job from "../models/Job.js";
import { generateJobEmbedding } from "../services/embeddingService.js";

import { uriFromSrv } from "./resolveSrv.js";

const MONGODB_URI = process.env.MONGODB_URI;
const BATCH_SIZE = 25;
const MAX_RETRIES = 3;
const DELAY_BETWEEN_BATCHES = 2000;

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function embedWithRetry(job, retries = MAX_RETRIES) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const embedding = await generateJobEmbedding(job);
      return embedding;
    } catch (err) {
      if (attempt === retries) throw err;
      const delay = Math.pow(2, attempt) * 1000;
      console.warn(`  Retry ${attempt}/${retries} for job ${job._id} in ${delay}ms: ${err.message}`);
      await sleep(delay);
    }
  }
}

async function seedEmbeddings() {
  await mongoose.connect(await uriFromSrv(MONGODB_URI), {
    dbName: "job-portal",
    serverSelectionTimeoutMS: 15000,
    connectTimeoutMS: 15000,
  });
  console.log("Connected to MongoDB");

  const totalJobs = await Job.countDocuments({});
  const jobs = await Job.find({ embedding: { $size: 0 } });

  if (jobs.length === 0) {
    console.log(`All ${totalJobs} jobs already have embeddings. Nothing to do.`);
    await mongoose.disconnect();
    return;
  }

  console.log(`Found ${jobs.length} jobs without embeddings (${totalJobs} total).`);
  console.log(`Processing in batches of ${BATCH_SIZE}...\n`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < jobs.length; i += BATCH_SIZE) {
    const batch = jobs.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(jobs.length / BATCH_SIZE);

    for (const job of batch) {
      try {
        process.stdout.write(`[${batchNum}/${totalBatches}] Embedding job: ${job.title.slice(0, 60)}... `);
        const embedding = await embedWithRetry(job);
        await Job.updateOne({ _id: job._id }, { $set: { embedding } });
        successCount++;
        console.log("OK");
      } catch (err) {
        failCount++;
        console.log(`FAILED: ${err.message}`);
      }
    }

    if (i + BATCH_SIZE < jobs.length) {
      console.log(`\nBatch ${batchNum} complete. Waiting ${DELAY_BETWEEN_BATCHES}ms...\n`);
      await sleep(DELAY_BETWEEN_BATCHES);
    }
  }

  console.log(`\nSeed embeddings complete: ${successCount} success, ${failCount} failed`);
  await mongoose.disconnect();
  console.log("Disconnected from MongoDB");
}

seedEmbeddings().catch((err) => {
  console.error("Seed embeddings failed:", err);
  process.exit(1);
});
