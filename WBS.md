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
    - Added `dnsSync.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"])` to `resolveSrv.js` — forces Google/Cloudflare DNS
    - Fixed `appName` parameter parsing bug: `URLSearchParams` now correctly parses query string when converting SRV → direct URI
  - [x] **`+ADD`** DRY fix: `config/db.js` now imports `uriFromSrv` from `scripts/resolveSrv.js` — no duplicated SRV resolution logic
- Lựa chọn Model Embedding (Status: Done, Assignee: Khiem)
  - OpenAI `text-embedding-3-large` 3072d, cosine similarity, best Vietnamese support

---

> **Epic 3-6 scope boundaries:**
>
> - **Epic 3 (Schema & Seed Data):** Schema code written. All seed data migrated to new cluster. ✅
> - **Epic 4 (Semantic Search Engine - P0):** Embedding service ✅, Vector Search index ✅, recommend-content API ✅. **EPIC COMPLETE.**
> - **Epic 5 (Behavior-Based Recommendation - P1):** Behavior tracking ✅, user profile ✅, collaborative filtering ✅, hybrid feed ✅. **EPIC COMPLETE.**
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

## 4. Semantic Search Engine (P0 Core) (Status: DONE, Completed: 2026-05-28 19:00)

### 4.1 Embedding Pipeline (P0) — Status: DONE

- [x] `server/services/embeddingService.js` — `generateEmbedding(text)`, `generateJobEmbedding(job)`
- [x] `server/scripts/seedEmbeddings.js` — 36/36 jobs embedded, 0 failures
- [x] Auto-embed on `postJob()` + `updateJob()`

### 4.2 Vector Search Index (P0) — Status: DONE

- [x] Atlas Search Index `idx_jobs_vector` deployed on new cluster
  - Database: `job-portal`, Collection: `jobs`
  - Type: `vector`, path: `embedding`, dimensions: `3072`, similarity: `cosine`
  - Index definition:
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
- [x] `server/scripts/testVectorSearch.js` created and verified
  - 3/3 Vietnamese test queries PASS:
    - "Lập trình viên React 3 năm kinh nghiệm" → ReactJS, Full-Stack, Mobile Developer
    - "Thiết kế đồ họa chuyên nghiệp" → Graphic Designer, Motion Graphics, UI/UX Designer
    - "Nhân viên Marketing online" → Digital Marketing, SEO, Content Creator

### 4.3 Content-Based Recommendation API (P0) — Status: DONE

- [x] `GET /api/jobs/recommend-content` implemented
  - Route: `routes/jobRoutes.js` → handler: `controller/jobController.js::getRecommendContent`
  - 8-stage `$vectorSearch` + Aggregation Pipeline:
    1. `$vectorSearch` — idx_jobs_vector, numCandidates=200, limit=100
    2. `$match` — visible=true, optional location/level/category filters
    3. `$lookup` — Company (name, email, image)
    4. `$addFields` — vectorScore (from $meta) + recencyBoost (30-day exponential decay)
    5. `$addFields` — score = vectorScore×0.6 + recencyBoost×0.2 + skillMatch×0.15 + salaryMatch×0.05
    6. `$match` — exclude applied + seen jobs
    7. `$sort` — score descending
    8. `$limit` — 20, `$project` — clean response shape
  - Accepts `?query=text` OR uses `user.embedding` as query vector
  - Optional filters: `location`, `level`, `category`, `exclude`

### 4.4 Verify P0 Readiness — Status: DONE

- [x] E2E: seed → embed → vector index → recommend-content returns ranked, category-correct results
- [x] `testVectorSearch.js` confirms `$vectorSearch` executing with actual scores

---

## 5. Behavior-Based Recommendation (P1 Enhance) (Status: DONE, Completed: 2026-05-28 19:00)

### 5.1 User Behavior Tracking — Status: DONE

- [x] `POST /api/users/events` — deduplicate views within 30 min, auto weight assignment
- [x] `applyForJob()` auto-creates apply event (weight=5)
- [x] Frontend event tracking (Epic 6): ApplyJob view on mount + JobListing IntersectionObserver

### 5.2 User Profile Embedding — Status: DONE

- [x] `GET /api/users/profile` — weighted average of interacted job embeddings → unit vector normalization
- [x] `POST /api/users/preferences` — cold-start category preferences

### 5.3 Collaborative Filtering API — Status: DONE

- [x] `GET /api/jobs/collaborative` — 13-stage pipeline: target events → similar users → liked jobs → exclude seen → company lookup → 20 results

### 5.4 Hybrid Recommendation Feed — Status: DONE

- [x] `GET /api/jobs/recommend-feed` — 3-mode hybrid blender:
  - **Hot user** (has embedding): 70% vectorSearch + 30% collaborative → deduplicate → score-sort → 20
  - **Preferences** (has categories, no embedding): category match + recency sort → 20
  - **Cold start** (no data): popular jobs (most applications in 30 days) → 20
- [x] Route mounted in `routes/jobRoutes.js` → `GET /recommend-feed`
- [x] Response includes `mode` field for frontend routing: `"hybrid"`, `"preferences"`, `"popular"`
- [x] Server compiles and starts cleanly with all new routes

---

## 6. Frontend & Finalization (Status: IN PROGRESS, Start: 2026-05-29)

### 6.1 Frontend Integration (Status: DONE, Completed: 2026-05-30)

- [x] Create `RecommendedJobs.jsx` — horizontal scroll, loading skeleton, empty state
  - Call `GET /api/jobs/recommend-feed` (Clerk token required)
  - Section header: "Việc làm gợi ý cho bạn"
  - Per-card badge: MODE_BADGE map (hybrid/collaborative/preferences/popular)
- [x] Update `Home.jsx` — insert `<RecommendedJobs />` between Hero + JobListing, auth-gated
  - OnboardingModal trigger: `user.preferences.length === 0` + 800ms delay
  - Optimistic update: `setUserData` after preferences saved
- [x] Replace `findSimilarJobs` in `ApplyJob.jsx` — call `recommend-content` API, fallback to client-side filter
- [x] Create `OnboardingModal.jsx` — first-login category multi-select
  - Trigger: `user.preferences` is empty
  - Categories: Lập trình, Thiết kế, Marketing, Tài chính, Quản lý, Kinh doanh
  - Submit → `POST /api/users/preferences`
  - "Skip" → fallback to popular jobs
- [x] Frontend event tracking:
  - `ApplyJob.jsx`: `useEffect` → `POST /api/users/events { jobId, eventType: "view" }` on mount
  - `JobListing.jsx`: IntersectionObserver → fire view events when job cards enter viewport (deduplicated via `viewedJobIds` ref)
- [x] Explanation badges on JobCard in recommended feed:
  - "Phù hợp với kỹ năng của bạn" (hybrid/content)
  - "Tương tự việc làm bạn đã xem" (collaborative)
  - "Dựa trên sở thích của bạn" (preferences)
  - "Phổ biến trong lĩnh vực của bạn" (popular)
- [x] **`+ADD`** Fix `requireAuth()` middleware on all protected routes (`jobRoutes.js`, `userRoutes.js`)
- [x] **`+ADD`** Fix `CLERK_PUBLISHABLE_KEY` missing in `server/.env`
- [x] **`+ADD`** Fix `VITE_BACKEND_URL` in `client/.env` (was `VITE_API_BASE_URL`)
- [x] **`+ADD`** Fix `MONGODB_URI` duplicate key bug in `server/.env` (autofix introduced `MONGODB_URI=MONGODB_URI=...`)
- [x] **`+ADD`** Fix `<style jsx>` → `<style>` in `Navbar.jsx` and `Footer.jsx` (Next.js syntax not supported in Vite)
- [x] **`+ADD`** `JobCategories` + `JobLocations` Việt hóa — 6 categories khớp seed data, 63 tỉnh thành VN
- [x] **`+ADD`** Event tracking audit — 4 event types reviewed:
  - `view` (weight=1): ✅ Done — ApplyJob mount + JobListing IntersectionObserver
  - `apply` (weight=5): ✅ Done — auto server-side in `applyForJob()`
  - `bookmark` (weight=3): ⬜ **To-Do** — `JobCard.jsx` bookmark button fires UI toggle only, no API call
  - `search` (weight=4): ❌ Intentionally skipped — Hero search has no `jobId` context; `view` events serve as proxy

### 6.2 Testing & Verification (Start: 2026-05-30)

- [x] **`+ADD`** L6: `JobCard.jsx` bookmark event — wire `FiBookmark` button to `POST /api/users/events { eventType: "bookmark" }` (weight=3); optimistic UI toggle; only fire on bookmark (not un-bookmark)
- [ ] End-to-end test scenarios:
  - Flow 1: New user → onboarding → popular jobs → interaction → recommendations improve
  - Flow 2: Returning user → profile embedding → vector + collaborative blend
  - Flow 3: User A (IT) vs User B (Design) → different recommendations
  - Verify: Atlas profiler shows aggregation pipeline stages executing
  - Verify: Vector search index healthy & responding

### 6.3 Tài liệu & Nộp bài (Start: 2026-05-30)

- [ ] Technical document (`docs/submission/technical-document.md`):
  - MVP Description, System Architecture (Mermaid diagram), Data Schema (5 collections)
  - Embedding Pipeline, Vector Search Configuration, Aggregation Pipeline stages
  - Recommendation Flow (3 modes), Cold Start Strategy, Sample Data overview
- [ ] Demo video (10 min, Assignee: Quốc Hào):
  - 00:00-02:00: Problem & TalentSync solution
  - 02:00-04:30: User onboarding → personalized job feed
  - 04:30-06:00: User applies → recommendations update real-time
  - 06:00-07:30: Architecture — Atlas UI → Vector Search → Aggregation Pipeline
  - 07:30-09:00: MongoDB integration details, scoring explanation
  - 09:00-10:00: Conclusion — single DB for operational + vector
- [ ] Submit before 2026-05-31 18:00 VNT
  - Checklist: MongoDB primary DB, $vectorSearch, Aggregation Pipeline, Demo <10min, Architecture docs
