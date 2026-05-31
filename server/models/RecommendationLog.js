import mongoose from "mongoose";

const recommendationLogSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  cvFileName: { type: String, required: true },
  cvTextPreview: { type: String, default: "" }, // first 500 chars only
  embeddingModel: { type: String, default: "text-embedding-3-large" },
  filters: { type: Object, default: {} },
  recommendedJobs: [
    {
      jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job" },
      similarityScore: Number,
      finalScore: Number,
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

const RecommendationLog = mongoose.model("RecommendationLog", recommendationLogSchema);

export default RecommendationLog;
