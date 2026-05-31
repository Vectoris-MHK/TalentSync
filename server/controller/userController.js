import User from "../models/User.js";
import JobApplication from "../models/JobApplication.js";
import Job from "../models/Job.js";
import UserEvent from "../models/UserEvent.js";
import { v2 } from "cloudinary";
import { createClerkClient } from "@clerk/express";

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

// Get user Data
export const getUserData = async (req, res) => {
  const userId = req.auth().userId;

  console.log("User ID from request:", userId); // Log the user ID

  try {
    let user = await User.findById(userId);

    if (!user) {
      // Fallback: fetch from Clerk and auto-create in DB (handles missing webhook)
      try {
        const clerkUser = await clerkClient.users.getUser(userId);
        user = await User.create({
          _id: clerkUser.id,
          email: clerkUser.emailAddresses[0]?.emailAddress || "",
          name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim(),
          image: clerkUser.imageUrl,
          resume: "",
        });
        console.log("Auto-created user from Clerk:", userId);
      } catch (clerkErr) {
        console.error("Failed to fetch/create user from Clerk:", clerkErr.message);
        return res.json({ success: false, message: "Không tìm thấy người dùng" });
      }
    }
    res.json({ success: true, user });
  } catch (error) {
    console.log("Error fetching user:", error.message); // Log any errors
    console.error("Controller error:", error);
    res.json({ success: false, message: "Đã xảy ra lỗi không mong muốn" });
  }
};

// Apply For a Job
export const applyForJob = async (req, res) => {
  const { jobId } = req.body;
  const userId = req.auth().userId;

  try {
    const isAlreadyApplied = await JobApplication.findOne({ userId, jobId });

    if (isAlreadyApplied) {
      return res.json({
        success: false,
        message: "Bạn đã ứng tuyển công việc này rồi",
      });
    }

    const jobData = await Job.findById(jobId);

    if (!jobData) {
      return res.json({ success: false, message: "Không tìm thấy công việc" });
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

    res.json({ success: true, message: "Ứng tuyển thành công" });
  } catch (error) {
    console.error("Controller error:", error);
    res.json({ success: false, message: "Đã xảy ra lỗi không mong muốn" });
  }
};

// Get User applied applications
export const getUserJobApplications = async (req, res) => {
  try {
    const userId = req.auth().userId;

    const applications = await JobApplication.find({ userId })
      .populate("companyId", "name email image")
      .populate("jobId", "title description location level salary")
      .exec();

    if (applications.length === 0) {
      return res.json({ success: true, applications: [] });
    }

    return res.json({ success: true, applications });
  } catch (error) {
    console.error("Controller error:", error);
    res.json({ success: false, message: "Đã xảy ra lỗi không mong muốn" });
  }
};

// Update User Profile (resume)
export const updateUserResume = async (req, res) => {
  try {
    const userId = req.auth().userId;
    const resumeFile = req.file;

    console.log("Resume file:", resumeFile);

    let userData = await User.findById(userId);

    if (!userData) {
      // Auto-create user from Clerk if webhook hasn't fired yet
      try {
        const clerkUser = await clerkClient.users.getUser(userId);
        userData = await User.create({
          _id: clerkUser.id,
          email: clerkUser.emailAddresses[0]?.emailAddress || "",
          name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim(),
          image: clerkUser.imageUrl,
          resume: "",
        });
        console.log("Auto-created user from Clerk during resume update:", userId);
      } catch (clerkErr) {
        console.error("Failed to fetch/create user from Clerk:", clerkErr.message);
        return res.json({ success: false, message: "Không tìm thấy người dùng" });
      }
    }

    if (resumeFile) {
      const isPdf = resumeFile.mimetype === "application/pdf";
      const resumeUpload = await v2.uploader.upload(resumeFile.path, {
        resource_type: isPdf ? "raw" : "auto",
        type: "upload",
        format: isPdf ? "pdf" : undefined,
      });
      userData.resume = resumeUpload.secure_url;
    }
    await userData.save();

    return res.json({ success: true, message: "Đã cập nhật hồ sơ thành công" });
  } catch (error) {
    console.error("Controller error:", error);
    res.json({ success: false, message: "Đã xảy ra lỗi không mong muốn" });
  }
};

// GET /api/users/profile
// Compute user embedding from weighted average of interacted job embeddings, save it, return user profile
export const getUserProfile = async (req, res) => {
  const userId = req.auth().userId;

  try {
    const user = await User.findById(userId);
    if (!user) return res.json({ success: false, message: "Không tìm thấy người dùng" });

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
    console.error("Controller error:", error);
    res.json({ success: false, message: "Đã xảy ra lỗi không mong muốn" });
  }
};

// POST /api/users/preferences
// Save user category preferences for cold-start recommendation
export const updateUserPreferences = async (req, res) => {
  const userId = req.auth().userId;
  const { preferences } = req.body;

  if (!Array.isArray(preferences)) {
    return res.json({ success: false, message: "Sở thích phải là một mảng" });
  }

  const VALID_CATEGORIES = ["Lập trình", "Thiết kế", "Marketing", "Tài chính", "Quản lý", "Kinh doanh"];
  const filtered = preferences.filter((p) => VALID_CATEGORIES.includes(p));

  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { preferences: filtered } },
      { new: true }
    );

    if (!user) return res.json({ success: false, message: "Không tìm thấy người dùng" });

    return res.json({ success: true, preferences: user.preferences, user });
  } catch (error) {
    console.error("Controller error:", error);
    res.json({ success: false, message: "Đã xảy ra lỗi không mong muốn" });
  }
};

// POST /api/users/events
// Log user behavior event (search, view, bookmark, apply)
// Weights: search=4, view=1, bookmark=3, apply=5
export const logUserEvent = async (req, res) => {
  const userId = req.auth().userId;
  const { jobId, eventType } = req.body;

  const VALID_TYPES = ["search", "view", "bookmark", "apply"];
  if (!jobId || !eventType || !VALID_TYPES.includes(eventType)) {
    return res.json({ success: false, message: "jobId hoặc eventType không hợp lệ" });
  }

  const WEIGHT_MAP = { search: 4, view: 1, bookmark: 3, apply: 5 };

  try {
    const job = await Job.findById(jobId);
    if (!job) return res.json({ success: false, message: "Không tìm thấy công việc" });

    if (eventType === "view") {
      const existing = await UserEvent.findOne({
        userId,
        jobId,
        eventType: "view",
        timestamp: { $gt: Date.now() - 30 * 60 * 1000 },
      });
      if (existing) {
        return res.json({ success: true, skipped: true, message: "Lượt xem đã được ghi nhận trong vòng 30 phút" });
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
    console.error("Controller error:", error);
    res.json({ success: false, message: "Đã xảy ra lỗi không mong muốn" });
  }
};
