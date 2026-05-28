import "dotenv/config";
import mongoose from "mongoose";
import { generateEmbedding } from "../services/embeddingService.js";
import { uriFromSrv } from "./resolveSrv.js";

const INDEX_NAME = "idx_jobs_vector";

async function test() {
  await mongoose.connect(await uriFromSrv(process.env.MONGODB_URI), {
    dbName: "job-portal",
    serverSelectionTimeoutMS: 15000,
    connectTimeoutMS: 15000,
  });
  console.log("Connected to MongoDB");

  const testQueries = [
    "Lập trình viên React 3 năm kinh nghiệm tại Hồ Chí Minh",
    "Thiết kế đồ họa chuyên nghiệp",
    "Nhân viên Marketing online",
  ];

  for (const query of testQueries) {
    console.log(`\n=== Query: "${query}" ===`);
    try {
      const queryVector = await generateEmbedding(query);
      console.log(`  Embedding dims: ${queryVector.length}`);

      const results = await mongoose.connection.db.collection("jobs").aggregate([
        {
          $vectorSearch: {
            index: INDEX_NAME,
            path: "embedding",
            queryVector,
            numCandidates: 200,
            limit: 10,
          },
        },
        { $match: { visible: true } },
        {
          $project: {
            _id: 1,
            title: 1,
            category: 1,
            location: 1,
            score: { $meta: "vectorSearchScore" },
          },
        },
        { $sort: { score: -1 } },
        { $limit: 5 },
      ]).toArray();

      console.log(`  Results: ${results.length}`);
      results.forEach((r, i) => {
        console.log(`    ${i + 1}. [${r.category}] ${r.title} (score: ${r.score.toFixed(4)}, location: ${r.location})`);
      });
      console.log(results.length > 0 ? "  PASS" : "  WARN — no results");
    } catch (err) {
      console.log(`  FAIL: ${err.message}`);
      if (err.message.includes("idx_jobs_vector")) {
        console.log("  HINT: Vector Search Index may not be active yet. Check Atlas UI.");
      }
    }
  }

  await mongoose.disconnect();
  console.log("\nDisconnected. Done.");
}

test().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
