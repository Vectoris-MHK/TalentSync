import express from "express";
import { requireAuth } from "@clerk/express";
import {
  applyForJob,
  getUserData,
  getUserJobApplications,
  updateUserResume,
  getUserProfile,
  updateUserPreferences,
  logUserEvent,
} from "../controller/userController.js";
import upload from "../config/multer.js";

const router = express.Router();

// Get User Data
router.get("/user", requireAuth(), getUserData);

// Apply for a Job
router.post("/apply", requireAuth(), applyForJob);

// Get applied jobs data
router.get("/applications", requireAuth(), getUserJobApplications);

// Update the resume
router.post("/update-resume", requireAuth(), upload.single("resume"), updateUserResume);

// Get user profile + compute/save embedding from behavior history
router.get("/profile", requireAuth(), getUserProfile);

// Save user category preferences (cold-start)
router.post("/preferences", requireAuth(), updateUserPreferences);

// Log user behavior event (view, bookmark, apply)
router.post("/events", requireAuth(), logUserEvent);

export default router;