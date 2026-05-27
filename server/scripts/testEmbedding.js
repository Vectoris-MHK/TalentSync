import "dotenv/config";
import { generateEmbedding } from "../services/embeddingService.js";

async function test() {
  try {
    const vec = await generateEmbedding("Lập trình viên React 3 năm kinh nghiệm tại Hồ Chí Minh");
    console.log(`Embedding length: ${vec.length}`);
    console.log(`First 3 values: ${vec.slice(0, 3)}`);
    console.log("OK");
  } catch (err) {
    console.error("FAILED:", err.message);
  }
}

test();
