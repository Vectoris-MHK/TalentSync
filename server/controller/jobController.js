import Job from "../models/Job.js";
import UserEvent from "../models/UserEvent.js";



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
