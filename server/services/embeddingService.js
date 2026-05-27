import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const EMBEDDING_MODEL = "text-embedding-3-large";
const EMBEDDING_DIMENSIONS = 3072;
const MAX_CHARS = 7000;

export const EMBEDDING_DIM = EMBEDDING_DIMENSIONS;

function stripHtml(html) {
  return html.replace(/<[^>]*>/g, "").replace(/&[a-z]+;/gi, " ").replace(/\s+/g, " ").trim();
}

export async function generateEmbedding(text) {
  const trimmed = text.slice(0, MAX_CHARS);
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: trimmed,
    dimensions: EMBEDDING_DIMENSIONS,
  });
  return response.data[0].embedding;
}

export async function generateJobEmbedding(job) {
  const cleanDescription = stripHtml(job.description || "");
  const text = `${job.title}. ${job.category}. ${job.level}. ${cleanDescription}`;
  return generateEmbedding(text);
}
