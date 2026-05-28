# Mongo Hack - Work Breakdown Structure (WBS)

Hierarchical list of all phases and tasks for the Mongo Hack project. Each item shows status, assignees, start dates, and descriptions/checklists where available.

**Legend:**
**+ADD** = New task added
**-DROP** = Task removed (obsolete/replaced)
**~MOD** = Task modified

---

> **Atlas Restart Notice (2026-05-28):** New Atlas account (fresh, $50 credit, M10). Old cluster `talentsyncdb.39cwlbk.mongodb.net` is abandoned. Restart completed — all code + data migrated to new cluster `talentsyncdb.yyz4uc.mongodb.net`.

---

## 1. Phân tích Requirement (Status: DONE, Start: 2026-05-24)

- Platform tìm việc (Status: Done, Assignee: Quốc Hào)
- Sourcecode: mzherx/Job-Portal-Prodigy (Status: Done, Assignee: Quốc Hào)
  - Link: [https://github.com/mzherx/Job-Portal-Prodigy](https://github.com/mzherx/Job-Portal-Prodigy)
- Tích hợp deepwiki vào NotebookLM (Status: Done)

## 2. Hạ tầng tính toán (Status: DONE, Completed: 2026-05-28 18:30)

> **`~MOD`** Old Atlas account abandoned. New account: fresh registration, $50 credit. Atlas infrastructure rebuilt from scratch.

- **`~MOD`** Mongo Atlas Infra (NEW ACCOUNT) (Status: Done, Assignee: Khiem, Completed: 2026-05-28 18:30)
  - [x] Account created — $50 credit
  - [x] M10 dedicated cluster created (guarantees Vector Search support)
  - [x] Database user `talentsync_admin` created
  - [x] Network access: `0.0.0.0/0` added
  - [x] Connection string obtained: `talentsyncdb.yyz4uc.mongodb.net`
- **`~MOD`** Update connection URIs (Status: Done, Assignee: Khiem)
  - [x] Updated `server/.env` with new `MONGODB_URI`
  - [x] **`+ADD`** Refactored 5 scripts to use `process.env.MONGODB_URI` + shared `uriFromSrv()` helper:
    - `server/scripts/seedData.js`
    - `server/scripts/seedEmbeddings.js`
    - `server/scripts/seedEvents.js`
    - `server/scripts/testCollaborative.js`
    - `server/scripts/testUserProfile.js`
  - [x] **`+ADD`** SRV DNS Resolution Fix: Node.js DNS (c-ares) on Windows failed `querySrv ECONNREFUSED` for new hostname. Fixed by:
    - Added `dnsSync.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"])` to `resolveSrv.js` and `config/db.js` — forces Google/Cloudflare DNS
    - Fixed `appName` parameter parsing bug: `URLSearchParams` now correctly parses query string when converting SRV → direct URI
  - [x] Server `config/db.js` now auto-resolves SRV → direct connection via shared helper logic
- Lựa chọn Model Embedding (Status: Done, Assignee: Khiem)
  - OpenAI `text-embedding-3-large` 3072d, cosine similarity, best Vietnamese support

---

> **Epic 3-6 scope boundaries:**
>
> - **Epic 3 (Schema & Seed Data):** Schema code written. All seed data migrated to new cluster.
> - **Epic 4 (Semantic Search Engine - P0):** Embedding service DONE. Vector Search index + recommend-content API remaining.
> - **Epic 5 (Behavior-Based Recommendation - P1):** Behavior tracking, user profile, collaborative filtering all DONE. Hybrid feed API remaining.
> - **Epic 6 (Frontend & Finalization):** Frontend components, onboarding flow, event tracking UI, testing, tài liệu, video demo, nộp bài.

---

## 3. Schema & Seed Data (Status: DONE, Completed: 2026-05-28 18:35)

### 3.1 Thiết kế Schema (Status: DONE)

- Khảo sát schema hiện có (Status: Done)
  - 5 collections: `users`, `companies`, `jobs`, `jobapplications`, `userevents`
- Mở rộng `Job` schema (Status: Done)
  - `embedding: { type: [Number], default: [] }` - 3072d vector
- Mở rộng `User` schema (Status: Done)
  - `preferences: { type: [String], default: [] }`
  - `embedding: { type: [Number], default: [] }`
- Tạo model `UserEvent` (MỚI) (Status: Done)
  - `userId: String`, `jobId: ObjectId`, `eventType: enum`, `weight: Number`, `timestamp: Number`

### 3.2 Seed Data (Status: DONE, Completed: 2026-05-28 18:35)

- Crawl data mẫu từ TopCV (Status: Done)
- [x] Re-run `seedData.js` on new cluster → 11 companies, 36 jobs, 10 users
- [x] Re-run `seedEmbeddings.js` → 36/36 jobs embedded (OpenAI text-embedding-3-large, 3072d)
- [x] Re-run `seedEvents.js` → 215 events for 10 users (5 IT-focused, 3 Design-focused, 2 mixed-interest)

### 3.3 Gap Resolution — Docs Sync (Status: DONE)

- `OPENAI_API_KEY` in `.env`
- Prerequisites in `plan.md`
- OpenAI fallback strategy in `decisions.md`
- `$vectorSearch` constraint in `architecture.md`
- Directory structure: `server/services/`, `server/scripts/`

---

## 4. Semantic Search Engine (P0 Core) (Status: IN-PROGRESS, Start: 2026-05-28)

### 4.1 Embedding Pipeline (P0) — Status: DONE

- `server/services/embeddingService.js` ✅
- `server/scripts/seedEmbeddings.js` ✅ — 36/36 jobs embedded, 0 failures
- Auto-embed on `postJob()` + `updateJob()` ✅

### 4.2 Vector Search Index (P0) — Status: IN-PROGRESS

- [ ] Tạo Atlas Search Index `idx_jobs_vector` on new cluster (Atlas UI ClickOps)
  - Database: `job-portal`, Collection: `jobs`
  - mappings: `embedding` → type `knnVector`, dimensions `3072`, similarity `cosine`
  - Dynamic: false
- [ ] Create `server/scripts/testVectorSearch.js` — embed test query → `$vectorSearch` → verify

### 4.3 Content-Based Recommendation API (P0) — Status: NOT STARTED

- [ ] `GET /api/jobs/recommend-content` (8-stage $vectorSearch + Aggregation Pipeline)
  - Route: `routes/jobRoutes.js` → handler: `controller/jobController.js`
  - numCandidates=200, limit=100 → score + filter → limit=20

### 4.4 Verify P0 Readiness — Status: NOT STARTED

- [ ] E2E test: seed → embed → vector search → recommend-content
- [ ] Atlas profiler verification

---

## 5. Behavior-Based Recommendation (P1 Enhance) (Status: CODE DONE, except hybrid feed)

### 5.1 User Behavior Tracking — Status: DONE

- `POST /api/users/events` ✅ — deduplicate views within 30 min
- `applyForJob()` auto-creates apply event ✅
- Frontend event tracking (Epic 6): ApplyJob view on mount + JobListing IntersectionObserver

### 5.2 User Profile Embedding — Status: DONE

- `GET /api/users/profile` ✅ — weighted average + unit vector normalization
- `POST /api/users/preferences` ✅

### 5.3 Collaborative Filtering API — Status: DONE

- `GET /api/jobs/collaborative` ✅ — 13-stage pipeline, excludes seen jobs, limits 20

### 5.4 Hybrid Recommendation Feed — Status: NOT STARTED

- [ ] `GET /api/jobs/recommend-feed`
  - Hot user: 70% vectorSearch + 30% collaborative → deduplicate → 20
  - Cold start: preferences → category match + recency, or popular jobs

---

## 6. Frontend & Finalization (Status: TO-DO, Start: 2026-05-29)

### 6.1 Frontend Integration

- [ ] Create `RecommendedJobs.jsx` — horizontal scroll, loading skeleton, empty state
- [ ] Update `Home.jsx` — insert between Hero + JobListing, auth-gated
- [ ] Replace `findSimilarJobs` in `ApplyJob.jsx` — call recommend-content API, fallback to old
- [ ] Create `OnboardingModal.jsx` — first-login category multi-select
- [ ] Explanation badges on JobCard

### 6.2 Testing & Verification (Start: 2026-05-30)

- [ ] Flow 1: New user → onboarding → popular jobs → interaction → personalized
- [ ] Flow 2: Returning user → profile embedding → vector + collaborative
- [ ] Flow 3: User A (IT) vs User B (Design) → different recommendations
- [ ] Atlas profiler + vector index health check

### 6.3 Tài liệu & Nộp bài (Start: 2026-05-30)

- [ ] Technical document (`docs/submission/technical-document.md`)
- [ ] Demo video (10 min, Quốc Hào)
- [ ] Submit before 2026-05-31 18:00 VNT
  - Checklist: MongoDB primary DB, $vectorSearch, Aggregation Pipeline, Demo <10min, Architecture docs
