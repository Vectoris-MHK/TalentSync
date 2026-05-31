import Job from "../models/Job.js";
import User from "../models/User.js";
import RecommendationLog from "../models/RecommendationLog.js";
import { generateEmbedding } from "../services/embeddingService.js";
import { extractCvText } from "../services/cvExtractionService.js";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const fs = require("fs");

const THIRTY_DAYS_MS = 30 * 86400000;

/**
 * POST /api/recommendations/from-cv
 * Upload a CV, extract text, embed it, run $vectorSearch, return ranked jobs.
 */
export const recommendFromCv = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "No file uploaded" });
  }

  const { userId } = req.auth();
  const { location, level, category } = req.query;

  try {
    // ── N2: Extract CV text ──────────────────────────────────────────
    const fileBuffer = req.file.buffer ?? fs.readFileSync(req.file.path);
    const { text, wordCount, extractionMethod } = await extractCvText(
      fileBuffer,
      req.file.mimetype
    );
    // cleanup temp file if it was written to disk
    if (!req.file.buffer && req.file.path) {
      fs.unlink(req.file.path, () => {});
    }

    if (wordCount < 50) {
      return res.status(422).json({
        success: false,
        message:
          "CV quá ngắn để phân tích. Vui lòng upload CV đầy đủ hơn.",
      });
    }

    // ── N3: Embed CV text ────────────────────────────────────────────
    const cvEmbedding = await generateEmbedding(text);

    // ── N3: $vectorSearch aggregation pipeline ───────────────────────
    const now = Date.now();

    const filterClauses = [{ equals: { path: "visible", value: true } }];
    if (location) filterClauses.push({ text: { query: location, path: "location" } });
    if (level) filterClauses.push({ text: { query: level, path: "level" } });
    if (category) filterClauses.push({ text: { query: category, path: "category" } });

    const results = await Job.aggregate([
      {
        $vectorSearch: {
          index: "idx_jobs_vector",
          path: "embedding",
          queryVector: cvEmbedding,
          numCandidates: 200,
          limit: 50,
          filter:
            filterClauses.length > 0
              ? { compound: { filter: filterClauses } }
              : undefined,
        },
      },
      {
        $lookup: {
          from: "companies",
          localField: "companyId",
          foreignField: "_id",
          as: "company",
        },
      },
      { $unwind: { path: "$company", preserveNullAndEmpty: true } },
      {
        $addFields: {
          vectorScore: { $meta: "vectorSearchScore" },
          recencyBoost: {
            $exp: {
              $divide: [{ $subtract: [now, "$date"] }, THIRTY_DAYS_MS * -1],
            },
          },
        },
      },
      {
        $addFields: {
          finalScore: {
            $add: [
              { $multiply: ["$vectorScore", 0.7] },
              { $multiply: ["$recencyBoost", 0.3] },
            ],
          },
        },
      },
      { $sort: { finalScore: -1 } },
      { $limit: 20 },
      {
        $project: {
          _id: 1,
          title: 1,
          description: 1,
          location: 1,
          category: 1,
          level: 1,
          salary: 1,
          date: 1,
          companyId: {
            _id: "$company._id",
            name: "$company.name",
            image: "$company.image",
          },
          vectorScore: 1,
          finalScore: 1,
          // embedding intentionally excluded
        },
      },
    ]);

    // ── N4: Compute matchReasons for each job ────────────────────────
    const cvWords = extractKeywords(text);

    const jobsWithReasons = results.map((job) => {
      const jobText = `${job.title} ${stripHtml(job.description || "")}`;
      const jobWords = extractKeywords(jobText);
      const overlap = cvWords.filter((w) => jobWords.includes(w)).slice(0, 5);
      return { ...job, matchReasons: overlap };
    });

    // ── N4: Update User CV metadata ──────────────────────────────────
    await User.findByIdAndUpdate(userId, {
      cvFileName: req.file.originalname,
      cvUploadedAt: new Date(),
      cvTextPreview: text.slice(0, 500),
    });

    // ── N4: Save recommendation log ──────────────────────────────────
    await RecommendationLog.create({
      userId,
      cvFileName: req.file.originalname,
      cvTextPreview: text.slice(0, 500),
      embeddingModel: "text-embedding-3-large",
      filters: { location, level, category },
      recommendedJobs: jobsWithReasons.map((j) => ({
        jobId: j._id,
        similarityScore: j.vectorScore,
        finalScore: j.finalScore,
      })),
    });

    return res.json({
      success: true,
      jobs: jobsWithReasons,
      meta: {
        wordCount,
        extractionMethod,
        totalResults: jobsWithReasons.length,
      },
    });
  } catch (error) {
    console.error("CV recommendation error:", error);
    return res.status(500).json({
      success: false,
      message: "Không thể xử lý CV. Vui lòng thử lại.",
    });
  }
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function stripHtml(html) {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

const STOP_WORDS = new Set([
  "và", "của", "là", "có", "trong", "với", "các", "được", "cho", "từ",
  "the", "a", "an", "and", "or", "in", "of", "to", "for", "with",
  "on", "at", "by", "is", "are", "was", "be", "as", "it", "its",
]);

function extractKeywords(text) {
  return [
    ...new Set(
      text
        .toLowerCase()
        .replace(/[^a-z0-9àáâãèéêìíòóôõùúăđĩũơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ\s]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 2 && !STOP_WORDS.has(w))
    ),
  ];
}
