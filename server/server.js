import './config/instrument.js'
import express from "express";
import cors from "cors";
import 'dotenv/config'
import connectDB from "./config/db.js";
import * as Sentry from "@sentry/node";
import { clerkWebhooks } from './controller/webhooks.js';
import companyRoutes from './routes/companyRoutes.js'
import connectCloudinary from './config/cloudinary.js';
import JobRoutes from './routes/jobRoutes.js';
import userRoutes from './routes/userRoutes.js';
import recommendationRoutes from './routes/recommendationRoutes.js';
import { clerkMiddleware } from '@clerk/express';
// Initialize Express
const app = express();

// Middleware
app.use(cors());
app.use(clerkMiddleware());

// Webhook route needs raw body for Svix signature verification
app.post('/webhooks', express.raw({ type: 'application/json' }), clerkWebhooks);

app.use(express.json());

// Routes
app.get("/", (req, res) => res.send("API Working"));

if (process.env.NODE_ENV !== 'production') {
  app.get("/debug-sentry", function mainHandler(req, res) {
    throw new Error("My first Sentry error!");
  });
}
app.use('/api/company', companyRoutes)
app.use('/api/jobs', JobRoutes)
app.use('/api/users', userRoutes)
app.use('/api/recommendations', recommendationRoutes)

Sentry.setupExpressErrorHandler(app);

// Initialize DB and start server
const startServer = async () => {
  await connectDB();
  await connectCloudinary();
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`Server running on port ${port}`));
};

startServer();

export default app;
