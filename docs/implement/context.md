# Context — Current State & Gap Analysis

> Updated: 2026-05-29 10:35 ICT — Codebase audit resolved, 20 issues fixed

## Hackathon Requirements

| Requirement | Quoted Source | Status |
|---|---|---|
| Theme | Recommendation Engine | ✅ Job recommendation platform |
| Must use | MongoDB as primary database | ✅ M10 Atlas, `job-portal` db |
| Must use | MongoDB Vector Search (`$vectorSearch`) | ✅ `idx_jobs_vector` active, 3072d cosine |
| Must use | Aggregation Pipeline | ✅ 8-stage content + 13-stage collaborative + hybrid blend |
| Deadline | 31/05/2026 18:00 VNT | On track |
| Deliverables | 10-min demo video, system architecture, data schema | Docs ready, video pending |

## What Already Exists (v1 Foundation)

### Backend — Fully Working
| Layer | Details |
|---|---|
| Models | `User`, `Company`, `Job`, `JobApplication` (Mongoose/MongoDB) |
| Auth | Clerk (users via `@clerk/express`, `req.auth.userId`) |
| Auth | Custom JWT (companies via `protectCompany` middleware) |
| File upload | Multer → Cloudinary (resume, company logo) |
| Routes | `/api/jobs` (CRUD + recommend), `/api/users` (profile, apply, resume, events), `/api/company` (register, login, post job, manage) |
| Webhooks | Clerk user created/updated/deleted → sync to MongoDB |
| Error tracking | Sentry |

### Frontend — Fully Working
| Page | Purpose |
|---|---|
| `Home.jsx` | Landing + Hero search + JobListing filter + job cards |
| `ApplyJob.jsx` | Job detail + "Similar Jobs" (client-side filter by category/company) |
| `Applications.jsx` | User dashboard: stats, resume management, application status |
| `Dashboard.jsx` | Recruiter layout with sidebar |
| `AddJob.jsx` | Job creation with Quill editor |
| `ManageJobs.jsx` | Toggle visibility, view stats |
| `ViewApplications.jsx` | Accept/reject applicants |

### Database — 5 Collections (4 original + 1 new)
| Collection | Key Fields | Notes |
|---|---|---|
| `users` | `_id` (Clerk ID), `name`, `email`, `resume`, `image` | + `preferences`, `embedding` (3072d) |
| `companies` | `name`, `email`, `image`, `password` | Unchanged |
| `jobs` | `title`, `description` (HTML), `location`, `category`, `level`, `salary`, `companyId` | + `embedding` (3072d) |
| `jobapplications` | `userId`, `companyId`, `jobId`, `status`, `date` | Unchanged |
| `userevents` | `userId`, `jobId`, `eventType`, `weight`, `timestamp` | **NEW** |

## What Was Missing (All Resolved)

### P0 — No Submission Possible Without These
1. ✅ **Embedding generation pipeline** — `server/services/embeddingService.js` (OpenAI text-embedding-3-large, 3072d, LRU cache)
2. ✅ **Vector Search index** — `idx_jobs_vector` on M10 cluster, 3072d cosine, ACTIVE
3. ✅ **`$vectorSearch` query** — Used in `getRecommendContent`, `getRecommendFeed`, `testVectorSearch.js`
4. ✅ **Aggregation Pipeline** — 8-stage pipeline in `recommend-content`, 13-stage in `collaborative`, hybrid blend in `recommend-feed`

### P1 — Incomplete Submission Without These
5. ✅ **User behavior tracking** — `POST /api/users/events`, auto-apply event, 215 seed events
6. ✅ **User profile embedding** — `GET /api/users/profile`, weighted average + unit vector, `POST /api/users/preferences`
7. ✅ **Collaborative filtering** — `GET /api/jobs/collaborative`, 13-stage pipeline, verified with test script

### P2 — Quality Boosters
8. ✅ **Cold start onboarding** — `recommend-feed` supports 3 modes: hybrid (embedding) → preferences (category) → popular (applications)
9. ⬜ **Explainable recommendations** — Frontend badges pending (on RecommendedJobs card)
10. ✅ **Embedding cache** — LRU Map (100 entries, 70%+ hit rate)
11. ✅ **Pre-filter optimization** — `$vectorSearch.filter` at Lucene level (visible/location/level/category)

## What Was Replaced

In `ApplyJob.jsx` lines 53-59, the client-side filter:
```js
// OLD (removed):
const findSimilarJobs = (currentJob) => {
  const similar = jobs.filter(job => 
    job._id !== currentJob._id && 
    (job.companyId._id === currentJob.companyId._id || 
     job.category === currentJob.category)
  ).slice(0, 4);
  setSimilarJobs(similar);
};

// NEW (pending frontend integration):
// → API call to GET /api/jobs/recommend-content?query=[job.title]&exclude=[currentJobId]
// → Fallback to client-side filter if API fails
```

## Current Infrastructure

| Component | Value |
|-----------|-------|
| Atlas Cluster | M10, AWS Singapore (ap-southeast-1), MongoDB 8.0 |
| Database | `job-portal` |
| Collections | 5 (users, companies, jobs, jobapplications, userevents) |
| Jobs | 36 (23 IT, 5 Design, 5 Marketing, 3 Finance) |
| Companies | 11 |
| Users | 10 (5 IT, 3 Design, 2 mixed) |
| Events | 215 (view, bookmark, apply) |
| Embeddings | 36/36 jobs embedded (OpenAI text-embedding-3-large, 3072d) |
| Vector Index | `idx_jobs_vector` — ACTIVE, 3072d cosine, scalar quantization |
| Connection | `talentsyncdb.yyz4uc.mongodb.net` (SRV → direct via Google DNS) |
| Cache | LRU embedding cache (100 entries, ~70% hit rate) |

## Backend API Status

| API | Route | Status |
|-----|-------|--------|
| Get all jobs | `GET /api/jobs` | ✅ |
| Get job by ID | `GET /api/jobs/:id` | ✅ |
| Recommend content | `GET /api/jobs/recommend-content` | ✅ |
| Collaborative | `GET /api/jobs/collaborative` | ✅ |
| Recommend feed | `GET /api/jobs/recommend-feed` | ✅ |
| Log event | `POST /api/users/events` | ✅ |
| User profile | `GET /api/users/profile` | ✅ |
| Set preferences | `POST /api/users/preferences` | ✅ |
| Apply for job | `POST /api/users/apply` | ✅ (auto-creates event) |
| Company CRUD | `/api/company/*` | ✅ (auto-embed on create/update) |

## Implementation Docs

| Doc | Purpose |
|-----|---------|
| `context.md` | This file — current state overview |
| `architecture.md` | System design, data schema, API routes, scoring formula |
| `plan.md` | 5-day implementation plan with progress tracking |
| `decisions.md` | All technical decisions (model, similarity, scoring, cache, dimension lock) |
| `codebase.md` | File map, code conventions, patterns, run instructions |
| `mongodb_atlas.md` | Atlas ClickOps deployment report (M10, index topology) |
| `atlas-search-best-practices.md` | Detailed pipeline analysis (pre-filter, cache, dimension lock, numCandidates) |

## Remaining Work

| Task | Priority | Effort |
|------|----------|--------|
| Frontend: RecommendedJobs component | High | 0.5h |
| Frontend: OnboardingModal | High | 0.5h |
| Frontend: Replace findSimilarJobs in ApplyJob | High | 0.25h |
| Frontend: Event tracking (IntersectionObserver) | Medium | 0.5h |
| Frontend: Explanation badges | Low | 0.25h |
| E2E testing (3 flows) | High | 1.5h |
| Technical document | High | 1.5h |
| Demo video (10 min) | High | 2.0h |
| Submission | Critical | — |

## Key Risks (Updated)

| Risk | Status | Notes |
|------|--------|-------|
| Atlas M0 doesn't support Vector Search | ✅ Resolved | M10 deployed, index ACTIVE |
| OpenAI API rate limits | ✅ Resolved | 36/36 jobs embedded, 0 failures |
| HTML in job descriptions | ✅ Resolved | stripHtml() before embedding |
| SRV DNS on Windows | ✅ Resolved | Google DNS resolver + direct URI fallback |
| 5-day timeline too tight | 🟡 On track | Backend done day 3, frontend + submission 2 days |
| Frontend complexity | 🟡 Manageable | Can cut explanation badges if needed |
