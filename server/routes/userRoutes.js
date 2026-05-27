import express from "express";
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
router.get("/user", getUserData);

// Apply for a Job
router.post("/apply", applyForJob);

// Get applied jobs data
router.get("/applications", getUserJobApplications);

// Update the resume
router.post("/update-resume", upload.single("resume"), updateUserResume);

// Get user profile + compute/save embedding from behavior history
router.get("/profile", getUserProfile);

// Save user category preferences (cold-start)
router.post("/preferences", updateUserPreferences);

// Log user behavior event (view, bookmark, apply)
router.post("/events", logUserEvent);

export default router;