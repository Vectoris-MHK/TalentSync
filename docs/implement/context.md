# Context — Current State & Gap Analysis

## Hackathon Requirements

| Requirement | Quoted Source |
|---|---|
| Theme | Recommendation Engine — gợi ý sản phẩm/phim/nhạc dựa trên hành vi người dùng |
| Must use | MongoDB as primary database |
| Must use | MongoDB Vector Search (`$vectorSearch`) |
| Must use | Aggregation Pipeline (collaborative filtering, scoring, ranking) |
| Deadline | 31/05/2026 18:00 VNT |
| Deliverables | 10-min demo video, system architecture, data schema |
| Judging | 30% Creativity, 30% Technical/MongoDB, 30% Impact, 10% Presentation |

## What Already Exists (v1 Foundation)

### Backend — Fully Working
| Layer | Details |
|---|---|
| Models | `User`, `Company`, `Job`, `JobApplication` (Mongoose/MongoDB) |
| Auth | Clerk (users via `@clerk/express`, `req.auth.userId`) |
| Auth | Custom JWT (companies via `protectCompany` middleware) |
| File upload | Multer → Cloudinary (resume, company logo) |
| Routes | `/api/jobs` (CRUD), `/api/users` (profile, apply, resume), `/api/company` (register, login, post job, manage) |
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

### Database — 4 Collections
| Collection | Key Fields | Notes |
|---|---|---|
| `users` | `_id` (Clerk ID), `name`, `email`, `resume`, `image` | No embedding, no skills |
| `companies` | `name`, `email`, `image`, `password` | No embedding |
| `jobs` | `title`, `description` (HTML), `location`, `category`, `level`, `salary`, `companyId` | **No embedding field** |
| `jobapplications` | `userId`, `companyId`, `jobId`, `status`, `date` | No preference scoring |

## What is MISSING (Hackathon Blocks)

### P0 — No Submission Possible Without These
1. **Embedding generation pipeline** — No code to generate vectors from job descriptions or user profiles
2. **Vector Search index** — No Atlas Search index created on any collection
3. **`$vectorSearch` query** — Zero usage of `$vectorSearch` anywhere in codebase
4. **Aggregation Pipeline for ranking** — No `$lookup`, `$group`, or multi-stage aggregation exists

### P1 — Incomplete Submission Without These
5. **User behavior tracking** — Only `jobapplications` tracked; no views, bookmarks, clicks
6. **User profile embedding** — User model has no `embedding` or preference fields
7. **Collaborative filtering** — No similarity-based recommendation logic exists

### P2 — Quality Boosters
8. **Cold start onboarding** — No wizard, no skill selection
9. **Explainable recommendations** — No "why this job?" feature

## Existing "Similar" Code (NOT Real Recommendation)

In `ApplyJob.jsx` lines 53-59, the only "similar" logic:
```js
const findSimilarJobs = (currentJob) => {
  const similar = jobs.filter(job => 
    job._id !== currentJob._id && 
    (job.companyId._id === currentJob.companyId._id || 
     job.category === currentJob.category)
  ).slice(0, 4);
  setSimilarJobs(similar);
};
```

This is a pure client-side filter. No MongoDB aggregation, no vectors, no embeddings. Must be replaced.

## Key Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Atlas M0 doesn't support Vector Search | **Showstopper** | Verify day 1; fallback to M10 free trial |
| OpenAI API rate limits | Slow embed generation | Batch jobs, use exponential backoff |
| 5-day timeline too tight | Incomplete submission | Prioritize content-based + aggregation only |
| HTML in job descriptions | Poor embedding quality | Strip HTML before embedding |
