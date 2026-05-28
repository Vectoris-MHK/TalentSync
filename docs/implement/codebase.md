# Codebase Reference — File Map & Conventions

> Updated: 2026-05-28 20:40 ICT — Backend 100% complete, actual files reflected

## Directory Map

```
TalentSync/
├── docs/
│   └── implement/
│       ├── context.md                    ← Current state & gap analysis (P0/P1 resolved)
│       ├── architecture.md               ← System architecture & data schema
│       ├── plan.md                       ← 5-day implementation plan (Days 1-3 done)
│       ├── decisions.md                  ← Technical decisions & trade-offs
│       ├── codebase.md                   ← This file — file map & conventions
│       ├── mongodb_atlas.md              ← Atlas deployment report (M10, index topology)
│       └── atlas-search-best-practices.md ← Pre-filter, cache, dimension lock analysis
├── server/
│   ├── server.js                    ← Express entry, middleware order, route mounting
│   ├── .env                         ← MONGODB_URI, OPENAI_API_KEY, Clerk, Cloudinary, Sentry
│   ├── data_sample.json             ← Crawled TopCV data (8 jobs)
│   ├── config/
│   │   ├── db.js                    ← MongoDB connection (uses uriFromSrv resolvers)
│   │   ├── cloudinary.js            ← Cloudinary init
│   │   ├── multer.js                ← File upload middleware
│   │   └── instrument.js            ← Sentry init
│   ├── models/
│   │   ├── User.js                  ← Clerk _id (String), +preferences [+embedding]
│   │   ├── Company.js               ← name, email, image, password
│   │   ├── Job.js                   ← +embedding field (3072d vector)
│   │   ├── JobApplication.js        ← Application schema
│   │   └── UserEvent.js             ← NEW: userId, jobId, eventType, weight, timestamp
│   ├── controller/
│   │   ├── userController.js        ← User endpoints (+logUserEvent, +apply auto-event, +getUserProfile, +updateUserPreferences)
│   │   ├── comapanyController.js    ← Company endpoints (+auto-embed on postJob)
│   │   ├── jobController.js         ← +getRecommendContent, +getCollaborativeJobs, +getRecommendFeed
│   │   └── webhooks.js              ← Clerk webhook handler
│   ├── routes/
│   │   ├── userRoutes.js            ← +GET /profile, +POST /preferences, +POST /events
│   │   ├── jobRoutes.js             ← +GET /recommend-content, +GET /collaborative, +GET /recommend-feed
│   │   └── companyRoutes.js         ← Company routes
│   ├── middleware/
│   │   └── authMiddleware.js         ← JWT protectCompany middleware
│   ├── utils/
│   │   └── generateToken.js         ← JWT token generator for companies
│   ├── services/
│   │   └── embeddingService.js       ← OpenAI text-embedding-3-large, 3072d, LRU cache
│   ├── scripts/
│   │   ├── testEmbedding.js          ← Verify OpenAI embedding works
│   │   ├── testVectorSearch.js       ← NEW: verify $vectorSearch + 3 Vietnamese queries
│   │   ├── testCollaborative.js      ← NEW: verify collaborative filtering pipeline
│   │   ├── testUserProfile.js        ← NEW: verify user profile embedding pipeline
│   │   ├── seedData.js               ← Seed 36 jobs, 11 companies, 10 users
│   │   ├── seedEmbeddings.js         ← Batch embed all jobs with OpenAI
│   │   ├── seedEvents.js             ← Seed 215 behavior events for 10 users
│   │   └── resolveSrv.js             ← NEW: SRV DNS resolver (Google DNS), shared helper
├── client/
│   └── src/
│       ├── main.jsx                 ← React entry (ClerkProvider + BrowserRouter + AppContextProvider)
│       ├── App.jsx                  ← Route definitions
│       ├── index.css                ← Tailwind + custom styles
│       ├── context/
│       │   └── AppContext.jsx        ← Global state
│       ├── pages/
│       │   ├── Home.jsx             ← Landing (add RecommendedJobs section here)
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
│       └── assets/
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

## Route Mounting (server.js)

```
app.get("/", ...)
app.get("/debug-sentry", ...)
app.post("/webhooks", clerkWebhooks)
app.use("/api/company", companyRoutes)
app.use("/api/jobs", jobRoutes)          ← /recommend-content, /recommend-feed, /collaborative, /, /:id
app.use("/api/users", userRoutes)        ← /user, /apply, /applications, /profile, /preferences, /events
```

## Environment Variables (server/.env)

```
MONGODB_URI=mongodb+srv://talentsync_admin:...@talentsyncdb.yyz4uc.mongodb.net/?appName=TalentSyncDB
CLERK_SECRET_KEY=sk_...
JWT_SECRET=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
SENTRY_DSN=...
CLERK_WEBHOOK_SECRET=...
PORT=5000
OPENAI_API_KEY=sk-proj-...
```

## Client Environment Variables (client/.env)

```
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_BACKEND_URL=http://localhost:5000/api
```

## How to Run Scripts

```bash
# Seed data
node server/scripts/seedData.js

# Generate embeddings (requires OPENAI_API_KEY)
node server/scripts/seedEmbeddings.js

# Seed behavior events
node server/scripts/seedEvents.js

# Test vector search
node server/scripts/testVectorSearch.js

# Test collaborative filtering
node server/scripts/testCollaborative.js

# Test user profile embedding
node server/scripts/testUserProfile.js

# Run server
npm run dev   # or: pnpm dev:server

# Run client
pnpm dev:client   # Vite dev server on :5173
```

## Database

- **Name:** `job-portal` (set in `server/config/db.js`)
- **URI:** From `MONGODB_URI` env var — auto-resolved from SRV via `uriFromSrv()`
- **Connection:** Google DNS (8.8.8.8, 8.8.4.4) + Cloudflare (1.1.1.1) for SRV resolution on Windows

## SRV DNS Resolution

`server/scripts/resolveSrv.js` exports `uriFromSrv()` — converts `mongodb+srv://` to direct `mongodb://` URI:
- Used by: `config/db.js`, all 5 seed/test scripts
- Forces Google/Cloudflare DNS servers (fixes Node.js c-ares bug on Windows)
- Correctly handles `appName` and other query parameters via `URLSearchParams`

## Embedding Service

`server/services/embeddingService.js`:
- Model: OpenAI `text-embedding-3-large`, 3072 dimensions
- LRU cache: 100 entries max, 200-char text fingerprint, instant cache-hit returns
- Input limit: 7000 chars max (OpenAI token limit)
- Exports: `generateEmbedding(text)`, `generateJobEmbedding(job)`, `clearEmbeddingCache()`, `getCacheSize()`

## Vector Search Pipeline Pattern (current)

```js
// Pre-filter at Lucene level — metadata filters before KNN computation
const vectorFilter = [
  { equals: { path: "visible", value: true } },
  // Optional: { text: { query: location, path: "location" } },
  // Optional: { text: { query: category, path: "category" } },
];

const results = await Job.aggregate([
  {
    $vectorSearch: {
      index: "idx_jobs_vector",
      path: "embedding",
      queryVector,
      numCandidates: 200,
      limit: 100,
      filter: { compound: { filter: vectorFilter } },
    },
  },
  // Exclusion (not supported in Lucene filter — must be downstream)
  { $match: { _id: { $nin: allExcluded } } },
  // Enrichment + scoring + sort + limit + project
  // ...
]);
```

## Key Design Patterns to Follow

1. **Always use `res.json()` with `success` field** — never `res.send()` or raw JSON
2. **File extension in imports** — always `.js` (e.g. `import Job from "../models/Job.js"`)
3. **Clerk middleware auto-injected** — `req.auth.userId` available in all user routes
4. **Controller files export named functions** — `export const getJobs`, NOT `module.exports`
5. **Separate route + controller** — routes define HTTP method + path, controllers define logic
6. **New services go in `server/services/`**
7. **Scripts go in `server/scripts/`**
8. **Aggregation pipelines use `Model.aggregate([...])`**
9. **$vectorSearch.filter for metadata** — visible/location/category/level at Lucene level
10. **$match for exclusions** — `_id: { $nin }` must stay at MongoDB Query Engine level
11. **SRV resolution** — all scripts use `uriFromSrv(process.env.MONGODB_URI)` pattern
