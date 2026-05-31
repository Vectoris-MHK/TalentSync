import express from "express";
import { requireAuth } from "@clerk/express";
import { getJobById, getJobs, getCollaborativeJobs, getRecommendContent, getRecommendFeed } from "../controller/jobController.js";

const router = express.Router();

// Routes to get all jobs data
router.get('/', getJobs);

// Vector Search + Aggregation Pipeline recommendation (auth required)
router.get('/recommend-content', requireAuth(), getRecommendContent);

// Hybrid recommendation feed (auth required)
router.get('/recommend-feed', requireAuth(), getRecommendFeed);

// Collaborative filtering (auth required)
router.get('/collaborative', requireAuth(), getCollaborativeJobs);

//  Route to get a single job by ID
router.get('/:id', getJobById);

export default router;