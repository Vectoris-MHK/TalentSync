import User from "../models/User.js";
import JobApplication from "../models/JobApplication.js";
import Job from "../models/Job.js";
import UserEvent from "../models/UserEvent.js";
import { v2 } from "cloudinary";

// Get user Data
export const getUserData = async (req, res) => {
  const userId = req.auth.userId;

  console.log("User ID from request:", userId); // Log the user ID

  try {
    const user = await User.findById(userId);

    if (!user) {
      console.log("User not found in database"); // Log if user is not found
      return res.json({ success: false, message: "User not found" });
    }
    res.json({ success: true, user });
  } catch (error) {
    console.log("Error fetching user:", error.message); // Log any errors
    res.json({ success: false, message: error.message });
  }
};

// Apply For a Job
export const applyForJob = async (req, res) => {
  const { jobId } = req.body;
  const userId = req.auth.userId;

  try {
    const isAlreadyApplied = await JobApplication.findOne({ userId, jobId });

    if (isAlreadyApplied) {
      return res.json({
        success: false,
        message: "You have already applied for this job",
      });
    }

    const jobData = await Job.findById(jobId);

    if (!jobData) {
      return res.json({ success: false, message: "Job not found" });
    }

    await JobApplication.create({
      companyId: jobData.companyId,
      userId,
      jobId,
      date: Date.now(),
    });

    try {
      await UserEvent.create({ userId, jobId, eventType: "apply", weight: 5, timestamp: Date.now() });
    } catch (eventErr) {
      console.warn("Failed to log apply event:", eventErr.message);
    }

    res.json({ success: true, message: "Applied Successfully" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Get User applied applications
export const getUserJobApplications = async (req, res) => {
  try {
    const userId = req.auth.userId;

    const applications = await JobApplication.find({ userId })
      .populate("companyId", "name email image")
      .populate("jobId", "title description location level salary")
      .exec();

    if (!applications) {
      return res.json({
        success: false,
        message: "No applications found for this User",
      });
    }

    return res.json({ success: true, applications });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Update User Profile (resume)
export const updateUserResume = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const resumeFile = req.file;

    console.log("Resume file:", resumeFile);

    const userData = await User.findById(userId);

    if (resumeFile) {
      const resumeUpload = await v2.uploader.upload(resumeFile.path);
      userData.resume = resumeUpload.secure_url;
    }
    await userData.save();

    return res.json({ success: true, message: "Resume Updated Successfully" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// GET /api/users/profile
// Compute user embedding from weighted average of interacted job embeddings, save it, return user profile
export const getUserProfile = async (req, res) => {
  const userId = req.auth.userId;

  try {
    const user = await User.findById(userId);
    if (!user) return res.json({ success: false, message: "User not found" });

    // Aggregate: group UserEvents by jobId, sum weights, top 50
    const topJobs = await UserEvent.aggregate([
      { $match: { userId } },
      { $group: { _id: "$jobId", totalWeight: { $sum: "$weight" } } },
      { $sort: { totalWeight: -1 } },
      { $limit: 50 },
      {
        $lookup: {
          from: "jobs",
          localField: "_id",
          foreignField: "_id",
          as: "job",
        },
      },
      { $unwind: "$job" },
      {
        $project: {
          totalWeight: 1,
          embedding: "$job.embedding",
        },
      },
    ]);

    // Cold start: no events or no jobs with embeddings
    const validJobs = topJobs.filter((j) => j.embedding && j.embedding.length === 3072);

    if (validJobs.length === 0) {
      return res.json({
        success: true,
        coldStart: true,
        preferences: user.preferences,
        user,
      });
    }

    // Weighted average of embeddings
    const dims = 3072;
    const avgVec = new Array(dims).fill(0);
    let totalWeight = 0;

    for (const { embedding, totalWeight: w } of validJobs) {
      for (let i = 0; i < dims; i++) {
        avgVec[i] += embedding[i] * w;
      }
      totalWeight += w;
    }

    for (let i = 0; i < dims; i++) {
      avgVec[i] /= totalWeight;
    }

    // Normalize to unit vector (cosine similarity requires unit vectors)
    const magnitude = Math.sqrt(avgVec.reduce((sum, v) => sum + v * v, 0));
    const unitVec = magnitude > 0 ? avgVec.map((v) => v / magnitude) : avgVec;

    user.embedding = unitVec;
    await user.save();

    return res.json({ success: true, coldStart: false, user });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// POST /api/users/preferences
// Save user category preferences for cold-start recommendation
export const updateUserPreferences = async (req, res) => {
  const userId = req.auth.userId;
  const { preferences } = req.body;

  if (!Array.isArray(preferences)) {
    return res.json({ success: false, message: "preferences must be an array" });
  }

  const VALID_CATEGORIES = ["Lập trình", "Thiết kế", "Marketing", "Tài chính", "Quản lý", "Kinh doanh"];
  const filtered = preferences.filter((p) => VALID_CATEGORIES.includes(p));

  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { preferences: filtered } },
      { new: true }
    );

    if (!user) return res.json({ success: false, message: "User not found" });

    return res.json({ success: true, preferences: user.preferences, user });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// POST /api/users/events
// Log user behavior event (search, view, bookmark, apply)
// Weights: search=4, view=1, bookmark=3, apply=5
export const logUserEvent = async (req, res) => {
  const userId = req.auth.userId;
  const { jobId, eventType } = req.body;

  const VALID_TYPES = ["search", "view", "bookmark", "apply"];
  if (!jobId || !eventType || !VALID_TYPES.includes(eventType)) {
    return res.json({ success: false, message: "Invalid jobId or eventType" });
  }

  const WEIGHT_MAP = { search: 4, view: 1, bookmark: 3, apply: 5 };

  try {
    const job = await Job.findById(jobId);
    if (!job) return res.json({ success: false, message: "Job not found" });

    if (eventType === "view") {
      const existing = await UserEvent.findOne({
        userId,
        jobId,
        eventType: "view",
        timestamp: { $gt: Date.now() - 30 * 60 * 1000 },
      });
      if (existing) {
        return res.json({ success: true, skipped: true, message: "View already logged within 30 minutes" });
      }
    }

    const event = await UserEvent.create({
      userId,
      jobId,
      eventType,
      weight: WEIGHT_MAP[eventType],
      timestamp: Date.now(),
    });

    return res.json({ success: true, event });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
