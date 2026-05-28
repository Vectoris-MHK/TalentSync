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
        res.json({success: false, message: error.message})
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
        res.json({success:false, message:error.message})
    }
}

// GET /api/jobs/collaborative
// "Users who liked what you liked also liked..." collaborative filtering pipeline
// Requires Clerk auth (req.auth.userId)
export const getCollaborativeJobs = async (req, res) => {
  const userId = req.auth.userId;

  try {
    // Collect all jobIds the target user has interacted with (to exclude from results)
    const seenEvents = await UserEvent.find({ userId }).select("jobId").lean();
    const seenJobIds = seenEvents.map((e) => e.jobId);

    if (seenJobIds.length === 0) {
      return res.json({ success: true, jobs: [], reason: "no_events" });
    }

    const results = await UserEvent.aggregate([
      // Stage 1: target user's strong positive signals (bookmark + apply)
      {
        $match: {
          userId,
          eventType: { $in: ["bookmark", "apply"] },
        },
      },

      // Stage 2: find other users who interacted with the same jobs
      {
        $lookup: {
          from: "userevents",
          let: { targetJobId: "$jobId" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$jobId", "$$targetJobId"] },
                    { $ne: ["$userId", userId] }, // exclude target user
                  ],
                },
              },
            },
            { $project: { userId: 1, _id: 0 } },
          ],
          as: "similarUserEvents",
        },
      },

      // Stage 3: flatten to get distinct similar user IDs
      { $unwind: "$similarUserEvents" },
      {
        $group: {
          _id: "$similarUserEvents.userId", // similar user
        },
      },

      // Stage 4: get jobs those similar users liked (bookmark + apply)
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

      // Stage 5: flatten liked jobs
      { $unwind: "$likedJobs" },

      // Stage 6: group by jobId — aggregate interaction score across all similar users
      {
        $group: {
          _id: "$likedJobs.jobId",
          interactionScore: { $sum: "$likedJobs.weight" },
          interactionCount: { $sum: 1 },
        },
      },

      // Stage 7: exclude jobs the target user has already seen
      {
        $match: {
          _id: { $nin: seenJobIds },
        },
      },

      // Stage 8: sort by interaction score desc
      { $sort: { interactionScore: -1 } },

      // Stage 9: limit candidates before lookup
      { $limit: 40 },

      // Stage 10: lookup full job data
      {
        $lookup: {
          from: "jobs",
          localField: "_id",
          foreignField: "_id",
          as: "job",
        },
      },
      { $unwind: "$job" },

      // Stage 11: only visible jobs
      { $match: { "job.visible": true } },

      // Stage 12: lookup company (exclude password)
      {
        $lookup: {
          from: "companies",
          localField: "job.companyId",
          foreignField: "_id",
          as: "company",
        },
      },
      { $unwind: { path: "$company", preserveNullAndEmpty: true } },

      // Stage 13: final shape
      {
        $project: {
          _id: "$job._id",
          title: "$job.title",
          description: "$job.description",
          location: "$job.location",
          category: "$job.category",
          level: "$job.level",
          salary: "$job.salary",
          date: "$job.date",
          companyId: {
            _id: "$company._id",
            name: "$company.name",
            image: "$company.image",
            email: "$company.email",
          },
          interactionScore: 1,
          interactionCount: 1,
        },
      },

      { $limit: 20 },
    ]);

    return res.json({ success: true, jobs: results });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// GET /api/jobs/recommend-content
// Content-based recommendation via $vectorSearch + Aggregation Pipeline
// Query: ?query=text OR use user.embedding; optional filters: location, level, category, exclude
export const getRecommendContent = async (req, res) => {
  const userId = req.auth.userId;
  const { query, location, level, category, exclude } = req.query;

  try {
    let queryVector;

    if (query) {
      queryVector = await generateEmbedding(query);
    } else {
      const user = await User.findById(userId);
      if (!user || !user.embedding || user.embedding.length === 0) {
        return res.json({ success: false, message: "No query text and no user embedding available" });
      }
      queryVector = user.embedding;
    }

    const appliedJobs = await JobApplication.find({ userId }).select("jobId").lean();
    const appliedJobIds = appliedJobs.map((a) => a.jobId);
    if (exclude) appliedJobIds.push(exclude);

    const seenEvents = await UserEvent.find({ userId }).select("jobId").lean();
    const seenJobIds = seenEvents.map((e) => e.jobId);
    const allExcluded = [...new Set([...appliedJobIds, ...seenJobIds])];

    const matchStage = { visible: true };
    if (location) matchStage.location = location;
    if (level) matchStage.level = level;
    if (category) matchStage.category = category;

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
        },
      },
      { $match: matchStage },
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
      { $match: { _id: { $nin: allExcluded } } },
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
    res.json({ success: false, message: error.message });
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

    const seenEvents = await UserEvent.find({ userId }).select("jobId").lean();
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
            },
          },
          { $match: { visible: true, _id: { $nin: allExcluded } } },
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
                  { $multiply: [{ $cond: [{ $eq: ["$category", "$category"] }, 1, 0.5] }, 0.15] },
                  { $multiply: [{ $cond: [{ $gte: ["$salary", 0] }, 1, 0] }, 0.05] },
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

        // Collaborative filtering (internal pipeline, avoid route conflict)
        (async () => {
          const positiveEvents = await UserEvent.find({
            userId,
            eventType: { $in: ["bookmark", "apply"] },
          }).select("jobId").lean();

          if (positiveEvents.length === 0) return [];

          const collabResults = await UserEvent.aggregate([
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
            { $match: { _id: { $nin: allExcluded } } },
            { $sort: { interactionScore: -1 } },
            { $limit: 20 },
            {
              $lookup: { from: "jobs", localField: "_id", foreignField: "_id", as: "job" },
            },
            { $unwind: "$job" },
            { $match: { "job.visible": true } },
            {
              $lookup: { from: "companies", localField: "job.companyId", foreignField: "_id", as: "company" },
            },
            { $unwind: { path: "$company", preserveNullAndEmpty: true } },
            {
              $project: {
                _id: "$job._id", title: "$job.title", description: "$job.description",
                location: "$job.location", category: "$job.category", level: "$job.level",
                salary: "$job.salary", date: "$job.date",
                companyId: { _id: "$company._id", name: "$company.name", email: "$company.email", image: "$company.image" },
                score: { $divide: ["$interactionScore", 8] },
                interactionScore: 1, interactionCount: 1,
                source: { $literal: "collaborative" },
              },
            },
          ]);

          return collabResults;
        })(),
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

    // ── FALLBACK: popular jobs (most applications in last 30 days) ─
    const popularJobs = await Job.aggregate([
      { $match: { visible: true, date: { $gte: now - thirtyDaysMs }, _id: { $nin: allExcluded } } },
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
    res.json({ success: false, message: error.message });
  }
};
