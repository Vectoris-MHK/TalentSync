# Architecture — System Design & Data Schema

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
│  3. Generate         │  │ $vectorSearch       │  Collaborative│   │
│     embedding via    │  │ $vectorSearch       │  Filtering OR │   │
│     OpenAI           │  │ (top 100 candidates)│  Popular Jobs │   │
│  4. Save to          │  └───────┬─────────────┴──────┬────────┘   │
│     jobs.embedding   │          │                    │            │
│                      │          ▼                    ▼            │
│  User Profile Gen    │  Aggregation Pipeline                      │
│──────────────────────│────────────────────────────────────────────│
│  1. Aggregate        │  1. $match: location/level/category filter │
│     UserEvent by     │  2. $lookup: Company (name, logo)          │
│     userId           │  3. $addFields: score calculation          │
│  2. Weight events    │     score = vectorScore*0.6                │
│     (search=4,       │           + recencyBoost*0.2               │
│      view=1,         │           + skillMatch*0.15                │
│      bookmark=3,     │           + salaryMatch*0.05               │
│      apply=5)        │                                             │
│  3. $lookup jobs     │  4. $match: _id NOT in appliedJobIds       │
│     for embeddings   │  5. $sort: by score desc                   │
│  4. Weighted average │  6. $limit: 20                             │
│     → user.embedding │                                            │
│                      │  Response: ranked job list                 │
├──────────────────────┴────────────────────────────────────────────┤
│  MongoDB Atlas (job-portal)                                       │
│  ┌─────────────┐ ┌─────────────┐ ┌──────────────┐ ┌───────────┐   │
│  │ jobs        │ │ users       │ │ userEvents   │ │ companies │   │
│  │ +embedding  │ │ +embedding  │ │ userId,jobId │ │           │   │
│  │ [vector idx]│ │ +preferences│ │ eventType:   │ │           │   │
│  │             │ │             │ │ search=4,    │ │           │   │
│  │             │ │             │ │ view=1,      │ │           │   │
│  │             │ │             │ │ bookmark=3,  │ │           │   │
│  │             │ │             │ │ apply=5      │ │           │   │
│  └─────────────┘ └─────────────┘ └──────────────┘ └───────────┘   │
│  ┌──────────────┐                                                 │
│  │ jobApps      │  existing, no changes needed                    │
│  └──────────────┘                                                 │
└───────────────────────────────────────────────────────────────────┘
```

## Data Schema

### `jobs` (MODIFIED — add `embedding` field)

```json
{
  "_id": "ObjectId",
  "title": "Senior React Developer",
  "description": "<h1>About the role</h1><p>We are looking for an experienced React developer...</p>",
  "location": "Ho Chi Minh",
  "category": "Programming",
  "level": "Senior level",
  "salary": 50000,
  "date": 1716700000000,
  "visible": true,
  "companyId": "ObjectId → companies",
  "embedding": [0.023, -0.451, 0.112, ..., 0.789]
  // 3072 floats, generated by OpenAI text-embedding-3-large from: title + stripped description + category + level
}

**Indexes:**
- `{ companyId: 1 }` — existing
- **Vector Search Index:** `idx_jobs_vector` on `embedding` field, 3072 dimensions, cosine similarity

### `users` (MODIFIED — add `preferences`, `embedding`)

```json
{
  "_id": "clerk_user_xxx",
  "name": "Nguyen Van A",
  "email": "a@example.com",
  "resume": "https://cloudinary.com/resume.pdf",
  "image": "https://cloudinary.com/avatar.jpg",
  "preferences": ["Programming", "Design"],
  "embedding": [0.112, -0.334, 0.089, ..., 0.556]
  // 3072 floats, computed from weighted average of interacted job embeddings
}
```

### `userEvents` (NEW)

```json
{
  "_id": "ObjectId",
  "userId": "clerk_user_xxx",
  "jobId": "ObjectId → jobs",
  "eventType": "view",
  // search | view | bookmark | apply
  "weight": 4,
  // search=4, view=1, bookmark=3, apply=5
  "timestamp": 1716700000000
}
```

**Indexes:**
- `{ userId: 1, timestamp: -1 }`
- `{ jobId: 1 }`
- `{ eventType: 1 }`

### `jobapplications` (UNCHANGED)

```json
{
  "_id": "ObjectId",
  "userId": "clerk_user_xxx",
  "companyId": "ObjectId → companies",
  "jobId": "ObjectId → jobs",
  "status": "pending",
  // pending | Accepted | Rejected
  "date": 1716700000000
}
```

### `companies` (UNCHANGED)

```json
{
  "_id": "ObjectId",
  "name": "Tech Corp",
  "email": "hr@techcorp.com",
  "image": "https://cloudinary.com/logo.jpg",
  "password": "$2a$10$...hashed"
}
```

## API Routes (NEW + MODIFIED)

### New Routes

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/jobs/recommend-feed` | Clerk | Hybrid recommendation feed for user |
| GET | `/api/jobs/recommend-content` | Clerk | Content-based only (vector search + filters) |
| POST | `/api/users/events` | Clerk | Log user behavior event (search, view, bookmark) |
| GET | `/api/users/profile` | Clerk | Get/compute user profile embedding |
| POST | `/api/users/preferences` | Clerk | Set user onboarding preferences |

### Modified Routes

| Method | Path | Change |
|---|---|---|
| POST | `/api/company/post-job` | Generate embedding on creation |
| PUT | `/api/company/post-job/:id` | Re-generate embedding on update |

## Vector Search Configuration

### Atlas Search Index Definition

```json
{
  "mappings": {
    "dynamic": false,
    "fields": {
      "embedding": {
        "type": "knnVector",
        "dimensions": 3072,
        "similarity": "cosine"
      }
    }
  }
}
```

### `$vectorSearch` Query Parameters

```js
{
  index: "idx_jobs_vector",
  path: "embedding",
  queryVector: userEmbedding, // or queryEmbedding for text search
  numCandidates: 200,
  limit: 100
}
```

> **Pipeline Ordering Constraint:** `$vectorSearch` MUST be the first stage in the aggregation pipeline. MongoDB Atlas enforces this — any stage placed before `$vectorSearch` (like `$match` or `$lookup`) will cause the pipeline to fail. Move all pre-filtering logic to stages AFTER `$vectorSearch`.

### numCandidates Tuning Guide

| numCandidates | Trade-off |
|---|---|
| 50 | Fast, cheap, lower recall |
| 200 | Reasonable balance (start here) |
| 500+ | Higher recall, slower, more compute |
