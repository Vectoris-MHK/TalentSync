# Architecture — System Design & Data Schema

> Updated: 2026-05-28 20:40 ICT — Backend complete, actual deployment reflected

## System Overview

```
┌───────────────────────────────────────────────────────────────────┐
│                     TALENTSYNC RECOMMENDATION ENGINE              │
├──────────────────────┬────────────────────────────────────────────┤
│  OFFLINE (Batch)     │  ONLINE (Request-Time)                     │
├──────────────────────┼────────────────────────────────────────────┤
│                      │                                            │
│  Job Creation        │  User Request: GET /api/jobs/recommend-feed│
│──────────────────────│────────────────────────────────────────────│
│  1. Recruiter posts  │                                            │
│  2. Strip HTML from  │  Has user profile embedding?               │
│     description      │  ┌─Yes─────────────────┐──No───────────┐   │
│  3. Generate         │  │ $vectorSearch       │  Preferences  │   │
│     embedding via    │  │ (filter=visible)    │  → category   │   │
│     OpenAI           │  │ 70% weight          │  match+recency│   │
│  4. Save to          │  │                     │  OR Popular   │   │
│     jobs.embedding   │  │ Collaborative       │  Jobs         │   │
│  5. LRU cache        │  │ 30% weight          │               │   │
│     miss→API call    │  └───────┬─────────────┴──────┬────────┘   │
│     hit→instant      │          │                    │            │
│                      │          ▼                    ▼            │
│  User Profile Gen    │  Blended Feed Pipeline                      │
│──────────────────────│────────────────────────────────────────────│
│  1. Aggregate        │  1. Deduplicate content + collaborative    │
│     UserEvent by     │  2. Score-sort merged results              │
│     userId           │  3. Limit to 20                            │
│  2. Weight events    │  4. Format response with source tag         │
│     (search=4,       │                                            │
│      view=1,         │  Scoring:                                   │
│      bookmark=3,     │    score = vectorScore×0.6                 │
│      apply=5)        │          + recencyBoost×0.2                │
│  3. $lookup jobs     │          + skillMatch×0.15                 │
│     for embeddings   │          + salaryMatch×0.05                │
│  4. Weighted average │                                             │
│     → user.embedding │  Recency: exp(-(now-date)/(30×86400000))   │
│  5. Normalize to     │                                             │
│     unit vector      │                                             │
│                      │                                             │
├──────────────────────┴────────────────────────────────────────────┤
│  MongoDB Atlas M10 (job-portal) — AWS Singapore                   │
│  ┌─────────────┐ ┌─────────────┐ ┌──────────────┐ ┌───────────┐   │
│  │ jobs        │ │ users       │ │ userEvents   │ │ companies │   │
│  │ +embedding  │ │ +embedding  │ │ userId,jobId │ │           │   │
│  │ [3072d vec] │ │ +preferences│ │ eventType:   │ │           │   │
│  │ idx_jobs_   │ │             │ │ search=4,    │ │           │   │
│  │ vector idx  │ │             │ │ view=1,      │ │           │   │
│  │             │ │             │ │ bookmark=3,  │ │           │   │
│  │             │ │             │ │ apply=5      │ │           │   │
│  └─────────────┘ └─────────────┘ └──────────────┘ └───────────┘   │
│  ┌──────────────┐                                                 │
│  │ jobApps      │  existing, no changes needed                    │
│  └──────────────┘                                                 │
└───────────────────────────────────────────────────────────────────┘
```

## Data Schema

### `jobs` (MODIFIED — `embedding` field added)

```json
{
  "_id": "ObjectId",
  "title": "Lập trình viên ReactJS",
  "description": "<h1>Mô tả công việc</h1><p>Chúng tôi cần một lập trình viên React...</p>",
  "location": "Hồ Chí Minh",
  "category": "Lập trình",
  "level": "Cao cấp",
  "salary": 50000,
  "date": 1716700000000,
  "visible": true,
  "companyId": "ObjectId → companies",
  "embedding": [0.023, -0.451, 0.112, ..., 0.789]
}
```

**Indexes:**
- `{ companyId: 1 }` — existing
- **Vector Search Index:** `idx_jobs_vector` on `embedding`, 3072 dimensions, cosine similarity

### `users` (MODIFIED — `preferences`, `embedding` added)

```json
{
  "_id": "clerk_user_xxx",
  "name": "Nguyễn Văn A",
  "email": "a@example.com",
  "resume": "https://cloudinary.com/resume.pdf",
  "image": "https://cloudinary.com/avatar.jpg",
  "preferences": ["Lập trình", "Thiết kế"],
  "embedding": [0.112, -0.334, 0.089, ..., 0.556]
}
```

### `userevents` (NEW)

```json
{
  "_id": "ObjectId",
  "userId": "clerk_user_xxx",
  "jobId": "ObjectId → jobs",
  "eventType": "view",
  "weight": 4,
  "timestamp": 1716700000000
}
```

**Indexes:** `{ userId: 1, timestamp: -1 }`, `{ jobId: 1 }`, `{ eventType: 1 }`, `{ userId: 1, jobId: 1, eventType: 1, timestamp: -1 }` (compound — covers view dedup query)

### `jobapplications` (UNCHANGED)

```json
{
  "_id": "ObjectId",
  "userId": "clerk_user_xxx",
  "companyId": "ObjectId → companies",
  "jobId": "ObjectId → jobs",
  "status": "pending",
  "date": 1716700000000
}
```

### `companies` (UNCHANGED)

```json
{
  "_id": "ObjectId",
  "name": "FPT Software",
  "email": "hr@fpt.com.vn",
  "image": "https://cloudinary.com/logo.jpg",
  "password": "$2a$10$...hashed"
}
```

## API Routes

### New Routes

| Method | Path | Auth | Purpose | Status |
|--------|------|------|---------|--------|
| GET | `/api/jobs/recommend-content` | Clerk | Content-based recommendation via $vectorSearch + Aggregation Pipeline | ✅ Done |
| GET | `/api/jobs/recommend-feed` | Clerk | Hybrid feed: 70% vectorSearch + 30% collaborative | ✅ Done |
| GET | `/api/jobs/collaborative` | Clerk | Collaborative filtering via shared `getCollaborativeResults()` helper | ✅ Done |
| POST | `/api/users/events` | Clerk | Log user behavior event (search, view, bookmark) | ✅ Done |
| GET | `/api/users/profile` | Clerk | Get/compute user profile embedding | ✅ Done |
| POST | `/api/users/preferences` | Clerk | Set user onboarding preferences | ✅ Done |

### Modified Routes

| Method | Path | Change | Status |
|--------|------|--------|--------|
| POST | `/api/company/post-job` | Generate embedding on creation | ✅ Done |
| PUT | `/api/company/post-job/:id` | Re-generate embedding on update | ✅ Done |

## Vector Search Configuration

### Atlas Search Index Definition (Actual Deployment)

```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 3072,
      "similarity": "cosine"
    }
  ]
}
```

Cluster: M10, AWS Singapore (ap-southeast-1)
Database: `job-portal`, Collection: `jobs`, Index: `idx_jobs_vector`

### $vectorSearch Query Pattern (with Pre-Filter)

```js
{
  $vectorSearch: {
    index: "idx_jobs_vector",
    path: "embedding",
    queryVector: userEmbedding,     // or queryEmbedding for text search
    numCandidates: 200,
    limit: 100,
    filter: {                         // Pre-filter at Lucene level (before KNN)
      compound: {
        filter: [
          { equals: { path: "visible", value: true } },
          // Optional: { text: { query: location, path: "location" } },
          // Optional: { text: { query: category, path: "category" } },
          // Optional: { text: { query: level, path: "level" } },
        ]
      }
    }
  }
}
```

### Pipeline Ordering Constraints

- `$vectorSearch` MUST be the first stage in the aggregation pipeline
- Metadata filters (`visible`, `location`, `level`, `category`) should go into `$vectorSearch.filter` (Lucene level, pre-KNN)
- Exclusion filters (`_id: { $nin: [...] }`) must stay as downstream `$match` (not supported in Atlas Search filter syntax)
- See `docs/implement/atlas-search-best-practices.md` for full analysis

### Scoring Formula

```
// recommend-content (query-based): full multi-factor scoring
score = vectorScore × 0.60         // Semantic relevance (primary signal)
      + recencyBoost × 0.20         // Freshness: exponential 30-day decay
      + skillMatch × 0.15           // Category match (from req.query.category)
      + salaryMatch × 0.05          // Salary provided

// recommend-feed content branch (user embedding): simplified dual-factor
// skillMatch/salaryMatch omitted — no category context from query params
score = vectorScore × 0.70
      + recencyBoost × 0.30

// recommend-feed collaborative branch:
score = interactionScore / 8        // Normalized weighted interaction sum

recencyBoost = exp(-(now - date) / (30 × 86400000))
// 1.0 today, ~0.37 at 30 days, ~0.14 at 60 days
```

### Recommendation Blend Ratios

| Mode | Trigger | Content % | Collaborative % | Fallback |
|------|---------|-----------|-----------------|----------|
| **Hybrid** | User has 3072d embedding | 70% (14 items) | 30% (6 items) | — |
| **Preferences** | User has categories, no embedding | — | — | Category match + recency |
| **Popular** | User has no embedding, no preferences | — | — | Most applications (all-time, no date restriction) |

### numCandidates Tuning

| Dataset Size | numCandidates | Rationale |
|---|---|---|
| 36 (current) | 200 | Exceeds total docs — scans entire collection |
| 100-500 | 200 | Balance precision/speed |
| 500-2000 | 500 | Higher recall needed |
| 2000+ | 1000 | Prevent missed results |

---

## Infrastructure

| Component | Value |
|-----------|-------|
| Atlas Tier | M10, AWS Singapore (ap-southeast-1) |
| MongoDB Version | 8.0 |
| Database | `job-portal` |
| Cluster Host | `talentsyncdb.yyz4uc.mongodb.net` |
| Database User | `talentsync_admin` |
| SRV DNS Strategy | Google DNS (8.8.8.8, 8.8.4.4) + Cloudflare (1.1.1.1) — fixes Windows Node.js c-ares ECONNREFUSED |
| Connection Logic | SRV → direct URI via `uriFromSrv()` in `scripts/resolveSrv.js` |
| LRU Embedding Cache | Map-based, 100 entries max, 200-character fingerprint keying |
| Vector Index | Scalar Quantization (4x RAM compression, 95-98% accuracy) |

## Reference Docs

- `docs/implement/mongodb_atlas.md` — Atlas deployment report (ClickOps timeline, index topology)
- `docs/implement/atlas-search-best-practices.md` — Detailed pipeline analysis (pre-filter, caching, dimension lock)
- `docs/implement/decisions.md` — Technical decisions & trade-offs
- `docs/implement/codebase.md` — File map & code conventions
