import Job from "../models/Job.js";
import JobApplication from "../models/JobApplication.js";
import UserEvent from "../models/UserEvent.js";
import User from "../models/User.js";
import { generateEmbedding } from "../services/embeddingService.js";



// Get all jobs
export const getJobs = async (req, res) => {
    try {
        
        const jobs = await Job.find({ visible: true})
        .populate({path: "companyId", select: "-password"})

        res.json({success: true, jobs})

    } catch (error) {
        console.error("Controller error:", error);
        res.json({success: false, message: "An unexpected error occurred"})
    }
};


// Get a single job by ID
export const getJobById = async (req, res) => {
    try {
        
        const {id} = req.params
        const job = await Job.findById(id)
        .populate({
            path:"companyId",
            select:"-password",
        
        })
        if(!job){
            return res.json({
                success:false,
                message:"Job not found" 
            })
        }

        res.json({
            success:true,
            job
        })

    } catch (error) {
        console.error("Controller error:", error);
        res.json({success:false, message:"An unexpected error occurred"})
    }
}

// Shared collaborative filtering pipeline
// Returns jobs that similar users liked, excluding seenJobIds
async function getCollaborativeResults(userId, excludedJobIds, limit = 20) {
  const positiveEvents = await UserEvent.find({
    userId,
    eventType: { $in: ["bookmark", "apply"] },
  }).select("jobId").lean();

  if (positiveEvents.length === 0) return [];

  return UserEvent.aggregate([
    { $match: { userId, eventType: { $in: ["bookmark", "apply"] } } },
    {
      $lookup: {
        from: "userevents",
        let: { targetJobId: "$jobId" },
        pipeline: [
          { $match: { $expr: { $and: [{ $eq: ["$jobId", "$$targetJobId"] }, { $ne: ["$userId", userId] }] } } },
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
          { $match: { $expr: { $and: [{ $eq: ["$userId", "$$similarUserId"] }, { $in: ["$eventType", ["bookmark", "apply"]] }] } } },
          { $project: { jobId: 1, weight: 1, _id: 0 } },
        ],
        as: "likedJobs",
      },
    },
    { $unwind: "$likedJobs" },
    { $group: { _id: "$likedJobs.jobId", interactionScore: { $sum: "$likedJobs.weight" }, interactionCount: { $sum: 1 } } },
    { $match: { _id: { $nin: excludedJobIds } } },
    { $sort: { interactionScore: -1 } },
    { $limit: 40 },
    { $lookup: { from: "jobs", localField: "_id", foreignField: "_id", as: "job" } },
    { $unwind: "$job" },
    { $match: { "job.visible": true } },
    { $lookup: { from: "companies", localField: "job.companyId", foreignField: "_id", as: "company" } },
    { $unwind: { path: "$company", preserveNullAndEmpty: true } },
    {
      $project: {
        _id: "$job._id", title: "$job.title", description: "$job.description",
        location: "$job.location", category: "$job.category", level: "$job.level",
        salary: "$job.salary", date: "$job.date",
        companyId: { _id: "$company._id", name: "$company.name", email: "$company.email", image: "$company.image" },
        interactionScore: 1, interactionCount: 1,
        score: { $divide: ["$interactionScore", 8] },
        source: { $literal: "collaborative" },
      },
    },
    { $limit: limit },
  ]);
}

// GET /api/jobs/collaborative
// "Users who liked what you liked also liked..." collaborative filtering pipeline
// Requires Clerk auth (req.auth.userId)
export const getCollaborativeJobs = async (req, res) => {
  const userId = req.auth.userId;

  try {
    const seenEvents = await UserEvent.find({ userId }).select("jobId").sort({ timestamp: -1 }).limit(500).lean();
    const seenJobIds = seenEvents.map((e) => e.jobId);
    const allExcluded = [...new Set([...appliedJobIds, ...seenJobIds])];

    const filterClauses = [{ equals: { path: "visible", value: true } }];
    if (location) filterClauses.push({ text: { query: location, path: "location" } });
    if (level) filterClauses.push({ text: { query: level, path: "level" } });
    if (category) filterClauses.push({ text: { query: category, path: "category" } });

    const now = Date.now();
    const thirtyDaysMs = 30 * 86400000;

    const results = await Job.aggregate([
      {
        $vectorSearch: {
          index: "idx_jobs_vector",
          path: "embedding",
          queryVector,
          numCandidates: 200,
          limit: 100,
          filter: filterClauses.length > 0 ? { compound: { filter: filterClauses } } : undefined,
        },
      },
      { $match: { _id: { $nin: allExcluded } } },
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
            $exp: { $divide: [{ $subtract: [now, "$date"] }, thirtyDaysMs * -1] },
          },
        },
      },
      {
        $addFields: {
          score: {
            $add: [
              { $multiply: ["$vectorScore", 0.6] },
              { $multiply: ["$recencyBoost", 0.2] },
              { $multiply: [{ $cond: [{ $eq: ["$category", category] }, 1, 0] }, 0.15] },
              { $multiply: [{ $cond: [{ $gte: ["$salary", 0] }, 1, 0] }, 0.05] },
            ],
          },
        },
      },
      { $sort: { score: -1 } },
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
            email: "$company.email",
            image: "$company.image",
          },
          vectorScore: 1,
          recencyBoost: 1,
          score: 1,
        },
      },
    ]);

    return res.json({ success: true, jobs: results, queryVectorSize: queryVector.length });
  } catch (error) {
    console.error("Controller error:", error);
    res.json({ success: false, message: "An unexpected error occurred" });
  }
};

// GET /api/jobs/recommend-feed
// Hybrid feed: 70% content-based + 30% collaborative when user has embedding
// Cold start: preferences → category match → recency sort, or popular jobs
export const getRecommendFeed = async (req, res) => {
  const userId = req.auth.userId;

  try {
    const user = await User.findById(userId);
    if (!user) return res.json({ success: false, message: "User not found" });

    const appliedJobs = await JobApplication.find({ userId }).select("jobId").lean();
    const appliedJobIds = appliedJobs.map((a) => a.jobId);

    const seenEvents = await UserEvent.find({ userId }).select("jobId").sort({ timestamp: -1 }).limit(500).lean();
    const seenJobIds = seenEvents.map((e) => e.jobId);
    const allExcluded = [...new Set([...appliedJobIds, ...seenJobIds])];

    const now = Date.now();
    const thirtyDaysMs = 30 * 86400000;

    // ── HOT USER: has embedding → blended feed ──────────────────────
    if (user.embedding && user.embedding.length === 3072) {
      const queryVector = user.embedding;

      const [contentJobs, collabJobs] = await Promise.all([
        // Content-based (vector search)
        Job.aggregate([
          {
            $vectorSearch: {
              index: "idx_jobs_vector",
              path: "embedding",
              queryVector,
              numCandidates: 200,
              limit: 100,
              filter: { compound: { filter: [{ equals: { path: "visible", value: true } }] } },
            },
          },
          { $match: { _id: { $nin: allExcluded } } },
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
                $exp: { $divide: [{ $subtract: [now, "$date"] }, thirtyDaysMs * -1] },
              },
            },
          },
          {
            $addFields: {
              score: {
                $add: [
                  { $multiply: ["$vectorScore", 0.70] },
                  { $multiply: ["$recencyBoost", 0.30] },
                ],
              },
            },
          },
          { $sort: { score: -1 } },
          { $limit: 14 },
          {
            $project: {
              _id: 1, title: 1, description: 1, location: 1, category: 1, level: 1, salary: 1, date: 1,
              companyId: { _id: "$company._id", name: "$company.name", email: "$company.email", image: "$company.image" },
              score: 1, source: { $literal: "content" },
            },
          },
        ]),

        getCollaborativeResults(userId, allExcluded, 20),
      ]);

      // Merge: 70% content (14 items) + 30% collaborative (6 items)
      const seen = new Set(contentJobs.map((j) => j._id.toString()));
      const collabDeduped = collabJobs
        .filter((j) => !seen.has(j._id.toString()))
        .slice(0, 6);
      const blended = [...contentJobs, ...collabDeduped].sort((a, b) => b.score - a.score).slice(0, 20);

      return res.json({ success: true, jobs: blended, mode: "hybrid", contentCount: contentJobs.length, collabCount: collabDeduped.length });
    }

    // ── COLD START: preferences → category match + recency ────────
    if (user.preferences && user.preferences.length > 0) {
      const prefJobs = await Job.aggregate([
        { $match: { visible: true, category: { $in: user.preferences }, _id: { $nin: allExcluded } } },
        { $sort: { date: -1 } },
        { $limit: 20 },
        {
          $lookup: { from: "companies", localField: "companyId", foreignField: "_id", as: "company" },
        },
        { $unwind: { path: "$company", preserveNullAndEmpty: true } },
        {
          $project: {
            _id: 1, title: 1, description: 1, location: 1, category: 1, level: 1, salary: 1, date: 1,
            companyId: { _id: "$company._id", name: "$company.name", email: "$company.email", image: "$company.image" },
            source: { $literal: "preferences" },
          },
        },
      ]);

      return res.json({ success: true, jobs: prefJobs, mode: "preferences", category: user.preferences });
    }

    // FALLBACK: popular jobs (most applications, no date restriction)
    const popularJobs = await Job.aggregate([
      { $match: { visible: true, _id: { $nin: allExcluded } } },
      {
        $lookup: {
          from: "jobapplications",
          localField: "_id",
          foreignField: "jobId",
          as: "apps",
        },
      },
      { $addFields: { appCount: { $size: "$apps" } } },
      { $sort: { appCount: -1, date: -1 } },
      { $limit: 20 },
      {
        $lookup: { from: "companies", localField: "companyId", foreignField: "_id", as: "company" },
      },
      { $unwind: { path: "$company", preserveNullAndEmpty: true } },
      {
        $project: {
          _id: 1, title: 1, description: 1, location: 1, category: 1, level: 1, salary: 1, date: 1,
          companyId: { _id: "$company._id", name: "$company.name", email: "$company.email", image: "$company.image" },
          appCount: 1, source: { $literal: "popular" },
        },
      },
    ]);

    return res.json({ success: true, jobs: popularJobs, mode: "popular" });
  } catch (error) {
    console.error("Controller error:", error);
    res.json({ success: false, message: "An unexpected error occurred" });
  }
};
