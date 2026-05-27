# Codebase Reference — File Map & Conventions

> Purpose: Give agent exact file paths, code patterns, and operational details so it can implement without guessing.

## Directory Map

```
TalentSync/
├── server/
│   ├── server.js                    ← Express entry point, middleware order, route mounting
│   ├── .env                         ← Environment variables
│   ├── config/
│   │   ├── db.js                    ← MongoDB connection (dbName: "job-portal")
│   │   ├── cloudinary.js            ← Cloudinary init
│   │   ├── multer.js                ← File upload middleware
│   │   └── instrument.js            ← Sentry init
│   ├── models/
│   │   ├── User.js                  ← User schema (Clerk _id, +preferences, +embedding)
│   │   ├── Company.js               ← Company schema (name, email, image, password)
│   │   ├── Job.js                   ← Job schema (+embedding field: 3072d vector)
│   │   ├── JobApplication.js        ← Application schema
│   │   └── UserEvent.js             ← NEW: userId, jobId, eventType, weight, timestamp
│   ├── controller/
│   │   ├── userController.js        ← User endpoints (modify: add event logging on apply)
│   │   ├── comapanyController.js    ← Company endpoints (modify: embed on job post)
│   │   ├── jobController.js         ← Job endpoints (add: recommend routes)
│   │   └── webhooks.js              ← Clerk webhook handler
│   ├── routes/
│   │   ├── userRoutes.js            ← User route definitions
│   │   ├── jobRoutes.js             ← Job route definitions (add recommend routes here)
│   │   └── companyRoutes.js         ← Company route definitions
│   ├── middleware/
│   │   └── authMiddleware.js         ← JWT protectCompany middleware
│   ├── utils/
│   │   └── generateToken.js         ← JWT token generator for companies
│   ├── services/
│   │   └── embeddingService.js       ← OpenAI text-embedding-3-large, 3072d
│   ├── scripts/
│   │   └── testEmbedding.js          ← Verify OpenAI embedding works
├── client/
│   └── src/
│       ├── main.jsx                 ← React entry (ClerkProvider + BrowserRouter + AppContextProvider)
│       ├── App.jsx                  ← Route definitions (add new routes here)
│       ├── index.css                ← Tailwind + custom styles
│       ├── context/
│       │   └── AppContext.jsx        ← Global state (add: recommendedJobs, userPreferences)
│       ├── pages/
│       │   ├── Home.jsx             ← Landing page (add RecommendedJobs section)
│       │   ├── ApplyJob.jsx         ← Job detail (replace findSimilarJobs with API)
│       │   ├── Applications.jsx     ← User dashboard
│       │   ├── Dashboard.jsx        ← Recruiter layout
│       │   ├── AddJob.jsx           ← Job creation form
│       │   ├── ManageJobs.jsx       ← Job management
│       │   └── ViewApplications.jsx  ← Applicant review
│       ├── components/
│       │   ├── Navbar.jsx
│       │   ├── Hero.jsx
│       │   ├── JobListing.jsx
│       │   ├── JobCard.jsx
│       │   ├── RecruiterLogin.jsx
│       │   ├── Footer.jsx
│       │   ├── AppDownload.jsx
│       │   ├── Calltoaction.jsx
│       │   └── Loading.jsx
│       └── assets/                  ← SVGs, images, static files
```

## Code Conventions

### Import Style — ESM (package.json has `"type": "module"`)
```js
import express from "express";
import mongoose from "mongoose";
import Job from "../models/Job.js";  // always use .js extension
```

### Controller Pattern — async with try/catch + json response
```js
export const getJobs = async (req, res) => {
    try {
        const jobs = await Job.find({ visible: true }).populate(...);
        res.json({ success: true, jobs });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};
```

Key conventions:
- Always `res.json({ success: true/false, ... })` — NOT `res.send()`, NOT `res.status().json()`
- Error: `res.json({ success: false, message: error.message })`
- Success: `res.json({ success: true, [dataKey]: dataValue })`

### Route Pattern
```js
import express from "express";
import { handlerFn } from "../controller/jobController.js";

const router = express.Router();
router.get('/', handlerFn);           // no auth
router.get('/protected', clerkAuthMiddleware, handlerFn);  // with auth

export default router;
```

### Auth Patterns

**User auth (Clerk):**
```js
// Route uses clerkMiddleware() globally in server.js
// Controller accesses userId:
const userId = req.auth.userId;
```

**Company auth (JWT):**
```js
// Route uses protectCompany middleware
// Controller accesses:
const companyId = req.company._id;
```

### Mongoose Schema — always `new mongoose.Schema({...})`, not `new Schema({...})`
```js
import mongoose from "mongoose";

const jobSchema = new mongoose.Schema({
    title: { type: String, required: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
});
```

### Frontend API Call Pattern
```js
// User endpoints (need Clerk token in Authorization header)
const token = await getToken();
const { data } = await axios.get(backendUrl + "/api/users/user", {
    headers: { Authorization: `Bearer ${token}` }
});

// Company endpoints (need JWT in token header)
const { data } = await axios.get(backendUrl + "/api/company/company", {
    headers: { token: companyToken }
});

// Public endpoints
const { data } = await axios.get(backendUrl + "/api/jobs");
```

### Component Pattern — Functional components with hooks
```jsx
import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "../context/AppContext";

const MyComponent = () => {
    const { backendUrl, userData } = useContext(AppContext);
    // ...
    return <div>...</div>;
};
export default MyComponent;
```

## Middleware Order (server.js)

```
1. cors()
2. express.json()
3. clerkMiddleware()           ← Provides req.auth.userId for user routes
4. Sentry.setupExpressErrorHandler(app)
5. Routes (mounted below)
```

## Route Mounting

```
app.get("/", ...)                # Health check
app.get("/debug-sentry", ...)    # Sentry test
app.post("/webhooks", ...)       # Clerk webhooks (Svix signature verified)
app.use("/api/company", companyRoutes)    # Company routes (/api/company/register, /login, /company, ...)
app.use("/api/jobs", jobRoutes)          # Job routes (/api/jobs, /api/jobs/:id)
app.use("/api/users", userRoutes)        # User routes (/api/users/user, /apply, /applications, ...)
```

**When adding new job routes**, add handlers to `controller/jobController.js`, then mount in `routes/jobRoutes.js`.
**When adding new user routes**, add handlers to `controller/userController.js`, then mount in `routes/userRoutes.js`.

## Environment Variables (server/.env)

```
MONGODB_URI=mongodb+srv://talentsync_db_user:...@talentsyncdb.39cwlbk.mongodb.net/
CLERK_SECRET_KEY=sk_...
JWT_SECRET=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
SENTRY_DSN=https://af49cd78e34e869e5c3fcd47018a17dc@o4508646666141696.ingest.us.sentry.io/4508646670663680
CLERK_WEBHOOK_SECRET=...
PORT=5000
```

**To add for hackathon:**
```
OPENAI_API_KEY=your_openai_api_key
```

## Client Environment Variables (client/.env)

```
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_BACKEND_URL=http://localhost:5000/api
```

## How to Run Scripts

```bash
# Run a seed/utility script
node server/scripts/seedEmbeddings.js

# Run server
npm run dev  # or: pnpm dev:server
# (package.json scripts: "server": "node server.js" or "dev:server": "nodemon server.js")

# Run client
pnpm dev:client   # Vite dev server on :5173
```

## Database

- **Name:** `job-portal` (set in `server/config/db.js` line 11)
- **URI:** From `MONGODB_URI` env var (Atlas connection string)

## Existing User Model (full — DO NOT break Clerk integration)

```js
// server/models/User.js
import mongoose from "mongoose";
const userSchema = new mongoose.Schema({
  _id: { type: String, required: true },    // Clerk user ID — DO NOT change type
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  resume: { type: String },
  image: { type: String, required: true },
  preferences: { type: [String], default: [] },
  embedding: { type: [Number], default: [] },
});
```

**When adding fields (preferences, embedding):**
- Add after `image` field
- Make optional (no `required: true`)
- `_id` must remain String type for Clerk compatibility
- Clerk webhook (`webhooks.js`) creates users with `_id: data.id` — do NOT break this

## Existing Job Model (full)

```js
// server/models/Job.js
import mongoose from "mongoose";
const jobSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },  // HTML from Quill editor
    location: { type: String, required: true },
    category: { type: String, required: true },
    level: { type: String, required: true },
    salary: { type: Number, required: true },
    date: { type: Number, required: true },
    visible: { type: Boolean, default: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
    embedding: { type: [Number], default: [] },
});
```

**When adding embedding field:**
- Add after `companyId`
- Type: `[Number]`, not required, default: `[]`

## Client Routing (App.jsx)

```
"/"                            → Home.jsx (public)
"/apply-job/:id"               → ApplyJob.jsx (public)
"/applications"                → Applications.jsx (user, Clerk auth)
"/recruiter-login"             → RecruiterLogin.jsx (modal overlay)
"/dashboard"                   → Dashboard.jsx (recruiter layout wrapper)
  "/dashboard/add-job"         → AddJob.jsx
  "/dashboard/manage-job"      → ManageJobs.jsx
  "/dashboard/view-applications" → ViewApplications.jsx
```

## Key Design Patterns to Follow

1. **Always use `res.json()` with `success` field** — never `res.send()` or raw JSON
2. **File extension in imports** — always `.js` (e.g. `import Job from "../models/Job.js"`)
3. **Clerk middleware auto-injected** — `req.auth.userId` available in all user routes
4. **Controller files export named functions** — `export const getJobs`, NOT `module.exports`
5. **Separate route + controller** — routes define HTTP method + path, controllers define logic
6. **New services go in `server/services/`** — create directory if missing
7. **Scripts go in `server/scripts/`** — create directory if missing
8. **Aggregation pipelines use `Model.aggregate([...])`** not `Model.aggregate().match()...`
