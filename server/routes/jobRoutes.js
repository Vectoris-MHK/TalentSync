import express from "express";
import { getJobById, getJobs, getCollaborativeJobs } from "../controller/jobController.js";

const router = express.Router();

// Routes to get all jobs data
router.get('/', getJobs);

// Collaborative filtering — must be before /:id to avoid route conflict
router.get('/collaborative', getCollaborativeJobs);

//  Route to get a single job by ID
router.get('/:id', getJobById);

export default router;