# TalentSync Data Schema — Technical Documentation

> MongoDB Hackathon 2026 — Recommendation Engine Job Matching Platform
> Database: `job-portal` | Cluster: M10, AWS Singapore (`ap-southeast-1`), MongoDB 8.0
> 5 Collections: `jobs`, `users`, `companies`, `jobapplications`, `userevents`

---

## 1. Collections Overview

```
job-portal
├── jobs  ← Core entity, vector-searchable (3072d embedding)
├── users ← Clerk-authenticated candidates (String _id)
├── companies   ← JWT-authenticated recruiters (ObjectId _id)
├── jobapplications   ← Application lifecycle (pending → accepted/rejected)
└── userevents  ← Behavioral signals for recommendation engine
```

---

## 2. `jobs` Collection

**Purpose:** Stores all job postings. The core entity for recommendation — each document carries a 3072‑dimension embedding vector, indexed by Atlas Vector Search for semantic similarity queries.

**Model:** `server/models/Job.js`
**Mongoose Model Name:** `Job`
**Collection Name (MongoDB):** `jobs`

### 2.1 Schema Definition

| #  | Field  | Type   | Required | Default    | Constraints     | Description |
|----|--------------|---------|----------|------------|--------|-----------|
| 1  | `_id`  | `ObjectId`   | auto     | —    | —   | MongoDB auto‑generated unique identifier  |
| 2  | `title`      | `String`     | **Yes**  | —    | —   | Job title in Vietnamese (e.g. `"Lập trình viên ReactJS"`) |
| 3  | `description`| `String`     | **Yes**  | —    | —   | Full HTML job description (authored with Quill rich‑text editor) |
| 4  | `location`   | `String`     | **Yes**  | —    | —   | City/location (e.g. `"Hồ Chí Minh"`, `"Hà Nội"`, `"Đà Nẵng"`)  |
| 5  | `category`   | `String`     | **Yes**  | —    | —   | Job category in Vietnamese (e.g. `"Lập trình"`, `"Thiết kế"`, `"Marketing"`)|
| 6  | `level`      | `String`     | **Yes**  | —    | —   | Seniority level (e.g. `"Thực tập"`, `"Junior"`, `"Cao cấp"`)   |
| 7  | `salary`     | `Number`     | **Yes**  | —    | —   | Monthly salary in USD (integer)    |
| 8  | `date` | `Number`     | **Yes**  | —    | —   | Unix timestamp (ms) of job posting date  |
| 9  | `visible`    | `Boolean`    | No | `true`     | —   | Toggle job visibility (recruiter can hide/archive without deleting)    |
| 10 | `companyId`  | `ObjectId`   | **Yes**  | —    | `ref: "Company"`      | Foreign key → `companies._id`     |
| 11 | `embedding`  | `[Number]`   | No | `[]` | **Validator:** length must be 0 or exactly 3072     | OpenAI `text-embedding-3-large` vector (3072d), generated at create/update  |

### 2.2 Enforced Constraints

| Constraint | Level      | Details  |
|--|------------|--------|
| `title` required | Mongoose   | `required: true`     |
| `description` required | Mongoose   | `required: true`     |
| `location` required    | Mongoose   | `required: true`     |
| `category` required    | Mongoose   | `required: true`     |
| `level` required | Mongoose   | `required: true`     |
| `salary` required      | Mongoose   | `required: true`     |
| `date` required  | Mongoose   | `required: true`     |
| `companyId` required   | Mongoose   | `required: true`     |
| `embedding` dimension lock   | Mongoose   | Custom `validate`: `v.length === 0 \|\| v.length === 3072`    |
| `companyId` foreign key      | Mongoose   | `ref: "Company"` — populated via `$lookup`/`.populate()` |

### 2.3 Indexes

| Index  | Type   | Purpose  |
|---------|---|---------|
| `{ companyId: 1 }` | Standard (default) | Filter jobs by company (dashboard, management)    |
| `idx_jobs_vector`  | **Atlas Vector Search** | `embedding` field, 3072 dimensions, **cosine** similarity, scalar quantization  |

#### Atlas Vector Search Index Definition (actual deployment)

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

### 2.4 Embedding Generation Rule

Generated via `server/services/embeddingService.js` on job **creation** (`POST /api/company/post-job`) and **update** (`PUT /api/company/post-job/:id`):

```
Input text = job.title + ". " + job.category + ". " + job.level + ". " + stripHtml(job.description)
 ↓ stripHtml() removes all HTML tags, HTML entities, collapses whitespace
 ↓ truncated to max 7,000 characters before OpenAI API call
 ↓ OpenAI text-embedding-3-large → 3072‑dimension float64 vector
```

**Cache:** In‑memory LRU Map (max 100 entries, 200‑char fingerprint key, ~70% hit rate on repeated queries).

### 2.5 Relationships

| Relationship      | Foreign Key     | Target Collection | Cardinality  |
|--------|-----------------|--|---|
| Job → Company     | `companyId`     | `companies._id`   | Many‑to‑One  |
| Job → JobApplication    | `_id`     | `jobapplications.jobId` | One‑to‑Many |
| Job → UserEvent   | `_id`     | `userevents.jobId`| One‑to‑Many  |

---

## 3. `users` Collection

**Purpose:** Stores candidate profiles. The `_id` is the Clerk user ID (String, not ObjectId). Extended with `preferences` (onboarding categories) and `embedding` (computed user profile vector for personalized recommendations).

**Model:** `server/models/User.js`
**Mongoose Model Name:** `User`
**Collection Name (MongoDB):** `users`

### 3.1 Schema Definition

| #  | Field   | Type | Required | Default | Constraints      | Description      |
|----|---------------|------------|----------|---------|--|----|
| 1  | `_id`   | `String`   | **Yes**  | — | —    | Clerk user ID (e.g. `"user_2abc123..."`) — NOT an ObjectId |
| 2  | `name`  | `String`   | **Yes**  | — | —    | Full name from Clerk (e.g. `"Nguyễn Văn A"`)  |
| 3  | `email` | `String`   | **Yes**  | — | `unique: true`   | Email address synced from Clerk    |
| 4  | `resume`      | `String`   | No | — | —    | Cloudinary URL to uploaded resume PDF    |
| 5  | `image` | `String`   | **Yes**  | — | —    | Cloudinary URL to profile avatar (from Clerk)  |
| 6  | `preferences` | `[String]` | No | `[]`    | —    | Vietnamese category strings from onboarding (e.g. `["Lập trình"]`)    |
| 7  | `embedding`   | `[Number]` | No | `[]`    | **Validator:** length 0 or 3072    | Computed profile vector — weighted average of interacted job embeddings|

### 3.2 Enforced Constraints

| Constraint | Level      | Details  |
|--|------------|-------|
| `_id` required (String)      | Mongoose   | `required: true`     |
| `name` required  | Mongoose   | `required: true`     |
| `email` required + unique    | Mongoose   | `required: true, unique: true`   |
| `image` required | Mongoose   | `required: true`     |
| `embedding` dimension lock   | Mongoose   | Custom `validate`: `v.length === 0 \|\| v.length === 3072`|

### 3.3 User Profile Embedding Computation

Computed on‑demand at `GET /api/users/profile`:

1. Aggregate `userevents` for the user where `eventType` matches positive signals (`search`, `view`, `bookmark`, `apply`)
2. `$lookup` into `jobs` to retrieve each interacted job's `embedding`
3. Compute **weighted average** of all retrieved embeddings, using event weight as the multiplier
4. **Normalize** to a unit vector (L2 normalization)
5. Store result in `users.embedding` for subsequent `recommend-feed` calls

**Event weights used for profile computation:**

| `eventType` | `weight` | Rationale    |
|-------------|----------|-----------|
| `search`    | 4  | Explicit intent — user told the system what they want  |
| `view`      | 1  | Lowest signal — user may just browse |
| `bookmark`  | 3  | Medium signal — shows interest |
| `apply`     | 5  | Highest signal — user committed to action  |

### 3.4 Relationships

| Relationship  | Foreign Key | Target Collection   | Cardinality  |
|----------|--|----|---|
| User → JobApplication     | `_id` | `jobapplications.userId` | One‑to‑Many |
| User → UserEvent    | `_id` | `userevents.userId` | One‑to‑Many  |
| User ↔ Clerk  | `_id` (external)  | Clerk service | Identity sync      |

### 3.5 Clerk Webhook Sync

Clerk webhooks at `POST /webhooks` keep `users` in sync with the auth provider:
- `user.created` → `new User({ _id: clerkId, name, email, image })`
- `user.updated` → `User.findByIdAndUpdate(clerkId, { name, email, image })`
- `user.deleted` → `User.findByIdAndDelete(clerkId)`

---

## 4. `companies` Collection

**Purpose:** Stores recruiter/employer accounts. Authenticated via custom JWT (`protectCompany` middleware). Completely separate from Clerk — companies use a standalone email/password system with bcrypt‑hashed passwords.

**Model:** `server/models/Company.js`
**Mongoose Model Name:** `Company`
**Collection Name (MongoDB):** `companies`

### 4.1 Schema Definition

| #  | Field     | Type | Required | Default | Constraints    | Description    |
|----|-----------|------------|----------|---------|-----|-------------|
| 1  | `_id`     | `ObjectId` | auto     | — | —  | MongoDB auto‑generated unique identifier    |
| 2  | `name`    | `String`   | **Yes**  | — | —  | Company display name (e.g. `"FPT Software"`)      |
| 3  | `email`   | `String`   | **Yes**  | — | `unique: true` | Login email + contact email     |
| 4  | `image`   | `String`   | **Yes**  | — | —  | Cloudinary URL to company logo  |
| 5  | `password`| `String`   | **Yes**  | — | —  | bcrypt‑hashed password (hashed at registration via `bcrypt.hash`)|

### 4.2 Enforced Constraints

| Constraint | Level      | Details    |
|-------------|------------|--------|
| `name` required  | Mongoose   | `required: true` |
| `email` required + unique    | Mongoose   | `required: true, unique: true`     |
| `image` required | Mongoose   | `required: true` |
| `password` required    | Mongoose   | `required: true` |

### 4.3 Auth Flow

1. **Registration** (`POST /api/company/register`): bcrypt‑hashes password, uploads logo to Cloudinary, stores company doc, returns JWT
2. **Login** (`POST /api/company/login`): finds company by email, `bcrypt.compare(password, company.password)`, returns JWT
3. **Protected routes**: `protectCompany` middleware verifies JWT, sets `req.company` from `Company.findById(decoded.id).select("-password")`

### 4.4 Relationships

| Relationship    | Foreign Key | Target Collection | Cardinality  |
|------------|--|--------|---|
| Company → Job   | `_id` | `jobs.companyId`  | One‑to‑Many  |
| Company → JobApplication    | `_id` | `jobapplications.companyId` | One‑to‑Many  |

---

## 5. `jobapplications` Collection

**Purpose:** Tracks every job application submitted by a user. Supports the full application lifecycle: `pending` → `accepted` or `rejected`. Also used by the Popular fallback in `recommend-feed` (most applications in last 30 days).

**Model:** `server/models/JobApplication.js`
**Mongoose Model Name:** `JobApplication`
**Collection Name (MongoDB):** `jobapplications`

### 5.1 Schema Definition

| #  | Field | Type | Required | Default     | Constraints      | Description      |
|----|-------------|------------|----------|-------------|-------|----|
| 1  | `_id` | `ObjectId` | auto     | —     | —    | MongoDB auto‑generated unique identifier      |
| 2  | `userId`    | `String`   | **Yes**  | —     | `ref: "User"`    | Clerk user ID (String) → `users._id`    |
| 3  | `companyId` | `ObjectId` | **Yes**  | —     | `ref: "Company"` | Foreign key → `companies._id`     |
| 4  | `jobId`     | `ObjectId` | **Yes**  | —     | `ref: "Job"`     | Foreign key → `jobs._id`    |
| 5  | `status`    | `String`   | **Yes**  | `"pending"` | —    | Application state: `"pending"`, `"accepted"`, or `"rejected"`   |
| 6  | `date`      | `Number`   | **Yes**  | —     | —    | Unix timestamp (ms) of application submission |

### 5.2 Enforced Constraints

| Constraint   | Level      | Details    |
|---------------|------------|--------|
| `userId` required  | Mongoose   | `required: true` |
| `companyId` required     | Mongoose   | `required: true` |
| `jobId` required   | Mongoose   | `required: true` |
| `status` required + default    | Mongoose   | `required: true, default: "pending"`     |
| `date` required    | Mongoose   | `required: true` |

### 5.3 Side Effect on Create

When a user applies (`POST /api/users/apply`):
1. Creates a `JobApplication` document with `status: "pending"`
2. **Automatically creates** a `UserEvent` with `eventType: "apply"`, `weight: 5`

### 5.4 Relationships

| Relationship  | Foreign Key | Target Collection | Cardinality  |
|----------------|--|--------|---|
| JobApplication → User     | `userId`    | `users._id` | Many‑to‑One  |
| JobApplication → Company  | `companyId` | `companies._id`   | Many‑to‑One  |
| JobApplication → Job      | `jobId`     | `jobs._id`  | Many‑to‑One  |

---

## 6. `userevents` Collection (NEW)

**Purpose:** Records every behavioral interaction between a user and a job. This is the primary data source for:
- Computing user profile embeddings (weighted average of interacted job vectors)
- Collaborative filtering (finding similar users via shared job interactions)
- Exclusion lists (avoid recommending already‑seen/applied jobs)

**Model:** `server/models/UserEvent.js`
**Mongoose Model Name:** `UserEvent`
**Collection Name (MongoDB):** `userevents`

### 6.1 Schema Definition

| #  | Field | Type | Required | Default | Constraints    | Description     |
|----|-------------|------------|----------|---------|-----------|--------------------|
| 1  | `_id` | `ObjectId` | auto     | — | —  | MongoDB auto‑generated unique identifier    |
| 2  | `userId`    | `String`   | **Yes**  | — | `ref: "User"`  | Clerk user ID (String) → `users._id`  |
| 3  | `jobId`     | `ObjectId` | **Yes**  | — | `ref: "Job"`   | Foreign key → `jobs._id`  |
| 4  | `eventType` | `String`   | **Yes**  | — | **Enum:** `"search"`, `"view"`, `"bookmark"`, `"apply"` | Type of user interaction      |
| 5  | `weight`    | `Number`   | No | `1`     | —  | Signal weight (search=4, view=1, bookmark=3, apply=5)   |
| 6  | `timestamp` | `Number`   | **Yes**  | — | —  | Unix timestamp (ms) of when the event occurred    |

### 6.2 Enforced Constraints

| Constraint | Level      | Details   |
|--|------------|--------------------|
| `userId` required      | Mongoose   | `required: true`      |
| `jobId` required | Mongoose   | `required: true`      |
| `eventType` required + enum  | Mongoose   | `required: true, enum: ["search","view","bookmark","apply"]`    |
| `timestamp` required   | Mongoose   | `required: true`      |
| View deduplication     | App logic  | Controller rejects duplicate `view` events within 30 minutes    |

### 6.3 Event Weights (Defined in `userController.js`)

| `eventType` | `weight` | Rationale |
|-------------|----------|---------|
| `search`    | 4  | Explicit intent — user tells system what they want. Captured from search bar. Most valuable for cold start and profile building. |
| `view`      | 1  | Lowest signal — passive browsing, may be accidental |
| `bookmark`  | 3  | Medium signal — user saw enough to save it for later      |
| `apply`     | 5  | Highest signal — user committed real effort (writing app, uploading resume) |

### 6.4 Indexes

| Index     | Purpose   |
|--------------|---------------|
| `{ userId: 1, timestamp: -1 }`    | Fetch recent events by user (profile computation, exclusion lists)   |
| `{ jobId: 1 }`  | Find all users who interacted with a job (collaborative filtering)    |
| `{ eventType: 1 }`    | Filter events by type (profile generation uses positive types)  |
| `{ userId: 1, jobId: 1, eventType: 1, timestamp: -1 }` (compound) | View deduplication query (same user + same job + same type within 30 min) |

### 6.5 Data Lifecycle

- **Exclusion cap:** When building exclusion lists for recommendations, queries are capped to the most recent 500 events per user via `.sort({ timestamp: -1 }).limit(500)` — prevents unbounded `$nin` array growth beyond MongoDB's 16 MB BSON limit.
- **No automatic pruning:** No TTL index. Events are retained indefinitely; the 500‑document limit on queries provides operational safety.
- **Seed data:** 215 events across 10 users (5 IT, 3 Design, 2 mixed), generated via `server/scripts/seedEvents.js`.

### 6.6 Relationships

| Relationship   | Foreign Key    | Target Collection      | Cardinality  |
|-----------|----------------|-------|---|
| UserEvent → User     | `userId` | `users._id`      | Many‑to‑One  |
| UserEvent → Job      | `jobId`  | `jobs._id` | Many‑to‑One  |

---

## 7. Entity‑Relationship Diagram

```
┌──────────────┐         ┌────────────────────┐         ┌──────────────┐
│  companies   │ 1───N   │       jobs         │ N───1   │  companies   │
│              │◄────────│                    │────────►│              │
│  _id (ObjId) │         │  _id (ObjId)       │         │  (same)      │
│  name        │         │  title             │         │              │
│  email       │         │  description       │         │              │
│  image       │         │  location          │         │              │
│  password    │         │  category          │         │              │
└──────────────┘         │  level             │         └──────────────┘
       │                 │   salary           │                 ▲
       │                 │   date             │                 │
       │ 1               │   visible          │                 │
       │                 │   companyId ───────┼─────────────────┘
       │                 │   embedding [3072d]│
       │                 └─────────┬──────────┘
       │                           │ 1
       │                           │
       │              ┌────────────┼───────────┐
       │              │ N          │ N         │ N
       │              ▼            ▼           ▼
       │    ┌──────────────────┐  ┌────────────────────┐
       │    │ jobapplications  │  │    userevents      │
       │    │                  │  │                    │
       │    │ _id (ObjId)      │  │ _id (ObjId)        │
       │    │ userId ──────────┼──┼─ userId            │
       │    │ companyId ───────┼──┼─ jobId             │
       │    │ jobId ───────────┼──┼─ eventType (enum)  │
       │    │ status           │  │ weight             │
       │    │ date             │  │ timestamp          │
       │    └────────┬─────────┘  └─────────┬──────────┘
       │             │ N                    │ N
       │             │                      │
       ▼             ▼                      ▼
┌──────────────┐
│    users     │
│              │
│ _id (String) │  ←── Clerk user ID (NOT ObjectId)
│ name         │
│ email        │
│ resume       │
│ image        │
│ preferences  │
│ embedding    │
└──────────────┘
```

---

## 8. Index Summary

| Collection | Index    | Type      | Purpose    |
|-|-------|------|--------|
| `jobs`     | `{ companyId: 1 }`   | Standard  | Filter jobs by company |
| `jobs`     | `idx_jobs_vector` (embedding, 3072d, cosine) | **Atlas Vector Search**| Semantic similarity search   |
| `users`    | `{ _id: 1 }` (implicit — primary key)  | Standard  | Lookups by Clerk ID    |
| `users`    | `{ email: 1 }` (implicit — `unique: true`)   | Standard, unique      | Email uniqueness enforcement |
| `companies`      | `{ email: 1 }` (implicit — `unique: true`)   | Standard, unique      | Email uniqueness enforcement |
| `jobapplications`| — (no explicit indexes beyond `_id`)   | Standard  | Default `_id` index only     |
| `userevents`     | `{ userId: 1, timestamp: -1 }`   | Standard  | Recent events by user  |
| `userevents`     | `{ jobId: 1 }` | Standard  | Events by job (collaborative filtering)  |
| `userevents`     | `{ eventType: 1 }`   | Standard  | Events by type (profile computation)     |
| `userevents`     | `{ userId: 1, jobId: 1, eventType: 1, timestamp: -1 }`  | Compound  | View deduplication query     |

---

## 9. Key Technical Decisions (as Reflected in Schema)

| ID  | Decision  | Schema Impact  | Rationale     |
|-----|---------------|-------|------------|
| D1  | Embedding model: OpenAI `text-embedding-3-large` (3072d, cosine)      | `jobs.embedding[3072]`, `users.embedding[3072]`    | Best Vietnamese semantic capture, highest multilingual benchmark scores |
| D2  | User identity via Clerk (`_id: String`) instead of MongoDB ObjectId   | `users._id` is String, all FKs to `users` are String     | Single auth provider; Clerk webhooks keep MongoDB in sync     |
| D3  | Company auth via custom JWT (separate from Clerk)   | `companies.password` stores bcrypt hash      | Recruiters don't use Clerk; self‑contained email/password flow|
| D4  | `jobapplications.status: "pending"` as default      | Field requires explicit transition to `accepted`/`rejected`| Tracks full application lifecycle     |
| D5  | No document references — all relationships via `ObjectId` FKs + `$lookup`/`.populate()` | All foreign keys are scalar IDs, not embedded docs     | Avoids duplication; keeps jobs and companies independently updatable |
| D6  | HTML job descriptions retained as‑is, stripped only before embedding  | `jobs.description` stores HTML; embedding uses `stripHtml()` output | Preserves rich formatting for UI; avoids re‑rendering issues |
| D7  | User profile: weighted average of event‑weighted job embeddings | `users.embedding` persisted after computation | Pre‑computation avoids re‑aggregation on every `recommend-feed` call |
| D8  | Scalar quantization on Vector Search index    | Atlas index config only (not schema)   | ~4× RAM reduction, 95‑98% quality retention |
| D9  | `userevents` deduplication: view events within 30 minutes | App‑level guard in controller, not DB constraint    | Balances data fidelity vs. noise reduction  |
| D10 | Exclusion array size cap: 500 max `.limit()`  | App‑level guard in recommendation controllers | Prevents `$nin` exceeding 16 MB BSON document limit     |

---

## 10. Embedding Pipeline Summary

```
Job Creation (POST /api/company/post-job)
    │
    ├─1─► Strip HTML from description via stripHtml()
    ├─2─► Compose input: "title. category. level. cleanDescription"
    ├─3─► Truncate to 7000 chars (OpenAI token limit safeguard)
    ├─4─► Check LRU cache (100 entries, 200‑char fingerprint key)
    │     ├─ Hit → return cached vector instantly (~0 ms)
    │     └─ Miss → call OpenAI text-embedding-3-large ($0.13/1M tokens)
    ├─5─► Store 3072‑dimension float64 vector in jobs.embedding
    └─6─► Indexed by Atlas Vector Search (idx_jobs_vector, cosine) within seconds

User Profile (GET /api/users/profile)
    │
    ├─1─► Aggregate userevents WHERE userId = current user
    ├─2─► $lookup jobs to retrieve interacted job embeddings
    ├─3─► Weighted average: Σ (event.weight × job.embedding) / Σ event.weight
    ├─4─► L2 normalize to unit vector
    └─5─► Persist in users.embedding

Recommendation (GET /api/jobs/recommend-feed)
    │
    ├─ Hot user (has 3072d embedding):
    │   ├─ Content branch (70%): $vectorSearch with user.embedding as queryVector
    │   └─ Collaborative branch (30%): find similar users → their interacted jobs
    │   → Deduplicate, score‑sort, limit 20
    │
    ├─ Preferences mode (has categories, no embedding):
    │   └─ $match category + recency sort → 20
    │
    └─ Popular fallback (no data):
  └─ Most applications in last 30 days → 20
```

---

## 11. Recommendation Scoring Formula

### Content‑Based (recommend‑content with query)

```
score = vectorScore × 0.60    ← Semantic relevance (primary signal)
      + recencyBoost × 0.20    ← Freshness: exponential 30‑day decay
      + skillMatch × 0.15      ← Category match from req.query.category
      + salaryMatch × 0.05     ← Salary provided indicator

recencyBoost = exp(-(now - date) / (30 × 86400000))
 = 1.0 today, ~0.37 at 30 days, ~0.14 at 60 days
```

### Content Branch (recommend‑feed with user embedding — no query context)

```
score = vectorScore × 0.70
      + recencyBoost × 0.30
```

### Collaborative Branch

```
score = weightedInteractionSum / 8
```

### Blend Ratio

| Mode     | Trigger      | Content % (14 items) | Collab % (6 items) | Fallback   |
|----------------|---------------|-----|---|-------|
| **Hybrid**     | User has 3072d `embedding`     | 70%      | 30%    | —    |
| **Preferences**| User has `preferences[]` | —  | —      | Category + recency     |
| **Popular**    | No `embedding`, no `preferences`| —  | —      | Top applications 30d   |

---

## 12. Sample Documents

### 12.1 `jobs`

```json
{
  "_id": { "$oid": "6651a2b3c4d5e6f7a8b9c0d1" },
  "title": "Lập trình viên ReactJS",
  "description": "<h1>Mô tả công việc</h1><p>Chúng tôi cần một lập trình viên React có kinh nghiệm...</p>",
  "location": "Hồ Chí Minh",
  "category": "Lập trình",
  "level": "Cao cấp",
  "salary": 50000,
  "date": 1716700000000,
  "visible": true,
  "companyId": { "$oid": "6651a2b3c4d5e6f7a8b9c0d0" },
  "embedding": [0.023, -0.451, 0.112, "…", 0.789]
}
```

### 12.2 `users`

```json
{
  "_id": "user_2abc123def456",
  "name": "Nguyễn Văn A",
  "email": "nguyenvana@example.com",
  "resume": "https://res.cloudinary.com/xxx/image/upload/v1/resume.pdf",
  "image": "https://img.clerk.com/avatars/abc.jpg",
  "preferences": ["Lập trình", "Thiết kế"],
  "embedding": [0.112, -0.334, 0.089, "…", 0.556]
}
```

### 12.3 `companies`

```json
{
  "_id": { "$oid": "6651a2b3c4d5e6f7a8b9c0d0" },
  "name": "FPT Software",
  "email": "hr@fpt.com.vn",
  "image": "https://res.cloudinary.com/xxx/image/upload/v1/fpt-logo.png",
  "password": "$2a$10$XqF7...hashed"
}
```

### 12.4 `jobapplications`

```json
{
  "_id": { "$oid": "6651a2b3c4d5e6f7a8b9c0d2" },
  "userId": "user_2abc123def456",
  "companyId": { "$oid": "6651a2b3c4d5e6f7a8b9c0d0" },
  "jobId": { "$oid": "6651a2b3c4d5e6f7a8b9c0d1" },
  "status": "pending",
  "date": 1716800000000
}
```

### 12.5 `userevents`

```json
{
  "_id": { "$oid": "6651a2b3c4d5e6f7a8b9c0d3" },
  "userId": "user_2abc123def456",
  "jobId": { "$oid": "6651a2b3c4d5e6f7a8b9c0d1" },
  "eventType": "view",
  "weight": 1,
  "timestamp": 1716705000000
}
```

---

## 13. Operational Constraints

| Constraint  | Detail |
|---------|-----------|
| Embedding dimension lock      | 3072. Changing model requires: new index + re‑embed + code update |
| `_id` type on `users`   | `String` (Clerk ID). All foreign keys referencing users MUST be `String` |
| `_id` type on all other collections | `ObjectId` (standard Mongoose default)     |
| Job descriptions  | HTML from Quill editor. Strip before embedding. Max 7000 chars for OpenAI. |
| `$vectorSearch` stage ordering      | MUST be the first stage in aggregation pipeline  |
| `$vectorSearch.filter` (metadata)   | Lucene level (pre‑KNN): `visible`, `location`, `level`, `category` |
| `$match` (exclusion)    | MongoDB Query Engine level (post‑KNN): `_id: { $nin }`      |
| `$nin` array size | Capped at 500 to stay under 16 MB BSON limit     |
| LRU embedding cache     | 100 entries max, 200‑char fingerprint, in‑memory only  |
| Atlas cluster tier      | M10 (required for Vector Search — M0 does not support it)    |
| MongoDB version   | 8.0    |
| Database name     | `job-portal` |
| Connection string | `mongodb+srv://talentsync_admin@talentsyncdb.yyz4uc.mongodb.net` |
| DNS resolution    | Google DNS (8.8.8.8, 8.8.4.4) + Cloudflare (1.1.1.1) |
