# Mongo Hack - Work Breakdown Structure (WBS)

Hierarchical list of all phases and tasks for the Mongo Hack project. Each item shows status, assignees, start dates, and descriptions/checklists where available.

**Legend:**
**+ADD** = New task added
**-DROP** = Task removed (obsolete/replaced)
**~MOD** = Task modified

---

## 1. Phân tích Requirement (Status: DONE, Start: 2026-05-24)

* Platform tìm việc (Status: Done, Assignee: Quốc Hào)
* Sourcecode: mzherx/Job-Portal-Prodigy (Status: Done, Assignee: Quốc Hào)
  * Link: [https://github.com/mzherx/Job-Portal-Prodigy](https://github.com/mzherx/Job-Portal-Prodigy)
* Tích hợp deepwiki vào NotebookLM (Status: Done)

## 2. Hạ tầng tính toán (Status: DONE, Start: 2026-05-24)

* Mongo Atlas Infra (Status: Done)
  * Đăng ký account MongoDB (Status: Done, Assignee: Quốc Hào)
  * Mail ban tổ chức xin credit (Status: Done, Assignee: Quốc Hào)
  * Xác minh Atlas M0 hỗ trợ Vector Search; nếu không → M10 trial (Status: Done, Assignee: Quốc Hào)
* Lựa chọn Model Embedding (Status: Done, Assignee: Khiem, Start: 2026-05-26)
  * OpenAI `text-embedding-3-large` 3072d, cosine similarity, best Vietnamese support

---

> **Epic 3-6 scope boundaries:**
>
> - **Epic 3 (Schema & Seed Data):** Định nghĩa cấu trúc dữ liệu (Mongoose schema fields) + crawl + tạo raw data mẫu. Không chứa code logic, service, hay API.
> - **Epic 4 (Semantic Search Engine - P0):** Embedding service, Atlas Vector Search index, content-based recommendation API với `$vectorSearch` + Aggregation Pipeline. Core must-have để nộp bài.
> - **Epic 5 (Behavior-Based Recommendation - P1):** User behavior tracking, user profile embedding generation, collaborative filtering, hybrid feed blending. Nâng cao chất lượng recommendation.
> - **Epic 6 (Frontend & Finalization):** Frontend components, onboarding flow, event tracking UI, testing, tài liệu, video demo, nộp bài.

---

## 3. Schema & Seed Data (Status: IN-PROGRESS, Start: 2026-05-26)

### 3.1 Thiết kế Schema (Status: DONE, Start: 2026-05-26)

* Khảo sát schema hiện có (Status: Done, Assignee: Khiem)
  * 4 collections: `users`, `companies`, `jobs`, `jobapplications` - tất cả đã có schema
* Mở rộng `Job` schema (Status: Done, Assignee: Khiem)
  * `embedding: { type: [Number], default: [] }` - 3072d vector
* Mở rộng `User` schema (Status: Done, Assignee: Khiem)
  * `preferences: { type: [String], default: [] }` - danh sách category user chọn khi onboard
  * `embedding: { type: [Number], default: [] }` - user profile vector (weighted avg of interacted jobs)
  * Lưu ý: `_id` giữ nguyên type `String` (Clerk ID)
* Tạo model `UserEvent` (MỚI) (Status: Done, Assignee: Khiem)
  * `userId: String`, `jobId: ObjectId`, `eventType: enum("search","view","bookmark","apply")`, `weight: Number`, `timestamp: Number`
  * Weights: search=4, view=1, bookmark=3, apply=5
  * **`~MOD`** Added `search` event type — captures explicit user intent from search bar, critical for cold start & interest profiling
  * Index: `{ userId: 1, timestamp: -1 }`, `{ jobId: 1 }`, `{ eventType: 1 }`

### 3.2 Seed Data (Status: TO-DO, Start: 2026-05-26)

* Crawl data mẫu từ TopCV (Status: To-Do, Assignee: Khiem)
  * Target: tối thiểu 30 jobs tiếng Việt across categories (IT, Design, Marketing, Finance, Management)
  * Thu thập: title, description, location, category, level, salary range, company name
  * Output: JSON/Array dump → làm input cho `seedData.js`
  * **`~MOD`** Plan.md 5.1 updated to include TopCV crawl as data source
* Tạo `server/scripts/seedData.js` (Status: To-Do, Assignee: Khiem, depends on: Crawl)
  * Load crawled data → map vào schema → insert vào MongoDB
  * Tạo companies từ crawl data (gộp theo company name)
  * Tạo 10 users với Clerk-mocked IDs
  * Chạy: `node server/scripts/seedData.js`
* Tạo `server/scripts/seedEvents.js` (Status: To-Do, Assignee: Khiem)
  * ~100 events cho 10 users
  * 5 IT-focused users, 3 Design-focused, 2 mixed-interest
  * Event types: view, bookmark, apply với weights tương ứng

### 3.3 Gap Resolution — Docs Sync (Status: Done, Assignee: Khiem, 2026-05-26)

* **`+ADD`** `OPENAI_API_KEY` key added to `server/.env`
* **`+ADD`** Prerequisites step (1.0) added to `plan.md`: install `openai` npm package + setup API key
* **`+ADD`** "OpenAI API Fallback Strategy" section added to `decisions.md` (error handling, retry logic, budget safety)
* **`+ADD`** `$vectorSearch` pipeline ordering constraint note added to `architecture.md` (must be first stage)
* **`+ADD`** Directory structure created: `server/services/`, `server/scripts/`
* **`~MOD`** `codebase.md` directory map updated — added `UserEvent.js` entry

---

## 4. Semantic Search Engine (P0 Core) (Status: TO-DO, Start: 2026-05-26)

### 4.1 Embedding Pipeline (P0)

* Tạo `server/services/embeddingService.js` (Status: To-Do, Assignee: Khiem)
  * `generateEmbedding(text)` → gọi OpenAI `text-embedding-3-large` → Float32Array (3072d)
  * `generateJobEmbedding(job)` → strip HTML từ description, combine `title + category + level + cleanDescription`, embed
* Tạo `server/scripts/seedEmbeddings.js` (Status: To-Do, Assignee: Khiem)
  * Fetch tất cả jobs chưa có embedding
  * Batch 50 jobs/lần, rate-limit safe
  * Update mỗi document với `$set: { embedding }`
* Sửa `postJob()` + `updateJob()` controller (Status: To-Do, Assignee: Khiem)
  * `postJob()`: sau khi save job → generate embedding → `job.embedding = vec` → `await job.save()`
  * `updateJob()`: regenerate embedding nếu title/description/category/level thay đổi

### 4.2 Vector Search Index (P0)

* Tạo Atlas Search Index `idx_jobs_vector` (Status: To-Do, Assignee: Khiem)
  * Atlas UI → Search → Create Index → JSON Editor → collection `jobs`
  * mappings: `embedding` → type `knnVector`, dimensions `3072`, similarity `cosine`
  * Dynamic: false
* Verify với `server/scripts/testVectorSearch.js` (Status: To-Do, Assignee: Khiem)
  * Embed test query "Lập trình viên React 3 năm kinh nghiệm" → `$vectorSearch` → verify có kết quả

### 4.3 Content-Based Recommendation API (P0)

* `GET /api/jobs/recommend-content` (Status: To-Do, Assignee: Khiem)
  * Query params: `?query=text` hoặc dùng `user.embedding` làm query vector
  * Flow:
    1. `$vectorSearch`: index=`idx_jobs_vector`, path=`embedding`, queryVector, numCandidates=`200`, limit=`100`
    2. `$match`: visible=true, optional filters (location, level, category)
    3. `$lookup`: Company (name, image, email) - exclude password
    4. `$addFields`: score = vectorScore*0.6 + recencyBoost*0.2 + skillMatch*0.15 + salaryMatch*0.05
    5. `$match`: `_id` NOT IN user's applied job IDs
    6. `$sort`: score desc
    7. `$limit`: 20
    8. `$project`: clean response shape
* Recency formula: `exp(-(now - date) / (30 * 86400000))` - 1.0 today, ~0.37 at 30 days

### 4.4 Verify P0 Readiness

* End-to-end test: seed data → embed → vector search → `recommend-content` returns ranked results (Status: To-Do, Assignee: Khiem)
* Verify Atlas profiler shows aggregation pipeline stages executing (Status: To-Do, Assignee: Khiem)

---

## 5. Behavior-Based Recommendation (P1 Enhance) (Status: TO-DO, Start: 2026-05-27)

### 5.1 User Behavior Tracking

* Tạo `POST /api/users/events` (Status: To-Do, Assignee: Khiem)
  * Body: `{ jobId, eventType }` - eventType ∈ {"view", "bookmark", "apply"}
  * Deduplicate: không log view trùng cho cùng jobId/userId trong 30 phút
  * Auto weight: view=1, bookmark=3, apply=5
  * Modify `applyForJob()` controller → tự động tạo event type "apply"
* Gắn event tracking vào frontend (Status: To-Do, Assignee: Khiem, Start: 2026-05-28)
  * `ApplyJob.jsx`: fire view event on mount (`useEffect`)
  * `JobListing.jsx`: fire view events khi job card vào viewport (IntersectionObserver)

### 5.2 User Profile Embedding

* Tạo `GET /api/users/profile` (Status: To-Do, Assignee: Khiem)
  * Compute user embedding từ weighted average of interacted job embeddings:
    1. `$match` UserEvent where `userId = req.auth.userId`
    2. `$group` by jobId, sum weights
    3. `$sort` by sum weight desc → `$limit` 50
    4. `$lookup` jobs để lấy embeddings
    5. Weighted average tất cả job embeddings → normalize to unit vector
    6. Save vào `user.embedding`
  * Nếu user chưa có events → return preferences (cold start)
* `POST /api/users/preferences` (Status: To-Do, Assignee: Khiem)
  * Body: `{ preferences: ["Lập trình", "Thiết kế"] }`
  * Save vào `user.preferences` → dùng cho cold start recommendation

### 5.3 Collaborative Filtering API

* `GET /api/jobs/collaborative` (Status: To-Do, Assignee: Khiem)
  * "Users who liked what you liked also liked..." pipeline:
    1. `$match` UserEvent: target user's positive events (bookmark + apply)
    2. `$lookup` UserEvent: find other users who interacted with same jobs
    3. `$group` by userId → "similar users"
    4. `$lookup` UserEvent again: get jobs liked by similar users
    5. `$group` by jobId, count interactions, sum weights
    6. `$lookup` jobs: get full job data
    7. `$match`: exclude already seen/applied jobs
    8. `$sort` by interaction score desc
    9. `$limit`: 20

### 5.4 Hybrid Recommendation Feed

* `GET /api/jobs/recommend-feed` (Status: To-Do, Assignee: Khiem)
  * Logic:
    - Nếu `user.embedding` tồn tại:
      - 70% content-based: `$vectorSearch` với user.embedding
      - 30% collaborative: lấy từ collaborative pipeline
      - Merge → deduplicate → sort by score → limit 20
    - Nếu cold start (chưa có embedding):
      - Có `user.preferences` → `$match` category IN preferences → `$sort` by date desc
      - Không có → popular jobs (most applications in last 30 days)

---

## 6. Frontend & Finalization (Status: TO-DO, Start: 2026-05-28)

### 6.1 Frontend Integration (Start: 2026-05-28)

* Tạo component `RecommendedJobs.jsx` (Status: To-Do, Assignee: Khiem)
  * Gọi `GET /api/jobs/recommend-feed` (cần Clerk token trong Authorization header)
  * Section header: "Việc làm gợi ý cho bạn"
  * Render JobCard components dạng horizontal scrollable
  * Loading skeleton state
  * Empty state: "Hoàn thiện hồ sơ để nhận gợi ý việc làm phù hợp"
* Cập nhật `Home.jsx` (Status: To-Do, Assignee: Khiem)
  * Chèn `<RecommendedJobs />` giữa Hero và JobListing sections
  * Chỉ hiển thị khi user đã đăng nhập (Clerk authenticated)
  * Không hiển thị cho recruiter/company users
* Thay thế `findSimilarJobs` trong `ApplyJob.jsx` (Status: To-Do, Assignee: Khiem)
  * Xóa client-side filter hiện tại
  * Gọi `GET /api/jobs/recommend-content?query=[job.title]&exclude=[currentJobId]`
  * Fallback về `findSimilarJobs` cũ nếu API fail
* Tạo `OnboardingModal.jsx` (Status: To-Do, Assignee: Khiem)
  * Hiển thị khi user đăng nhập lần đầu (`user.preferences` rỗng)
  * Category multi-select: Lập trình, Thiết kế, Marketing, Tài chính, Quản lý, Kinh doanh
  * Nút "Bỏ qua" → fallback về popular jobs
  * Submit: `POST /api/users/preferences { preferences: [...] }`
* Explanation badge trên JobCard (Status: To-Do, Assignee: Khiem)
  * Trong RecommendedJobs feed, mỗi card hiển thị badge nhỏ:
    - "Phù hợp với kỹ năng của bạn"
    - "Tương tự việc làm bạn đã xem"
    - "Phổ biến trong lĩnh vực của bạn"
    - "Dựa trên sở thích của bạn"

### 6.2 Testing & Verification (Start: 2026-05-30)

* End-to-end test scenarios (Status: To-Do, Assignee: Khiem)
  * Flow 1: New user → onboarding → popular jobs → interaction → recommendations improve
  * Flow 2: Returning user có profile embedding → content-based recommendations khác biệt
  * Flow 3: User A (IT) vs User B (Design) → recommendations khác nhau rõ rệt
  * Verify: Atlas profiler shows aggregation pipeline stages running
  * Verify: Vector search index healthy & responding

### 6.3 Tài liệu & Nộp bài (Start: 2026-05-30)

* Soạn Tài liệu Kỹ thuật (Status: To-Do, Assignee: Khiem, Start: 2026-05-30)
  * File: `docs/submission/technical-document.md`
  * MVP Description: Hệ thống gợi ý việc làm dùng Vector Search + Aggregation Pipeline
  * System Architecture: Mermaid diagram + component description
  * Data Schema: 5 collections với fields, types, indexes
  * Embedding Pipeline: model (text-embedding-3-large), dimensions (3072), generation flow
  * Vector Search Configuration: index definition, $vectorSearch params, numCandidates
  * Aggregation Pipeline: all stages explained (8 stages với scoring logic)
  * Recommendation Flow: content-based + collaborative + hybrid blending strategy
  * Cold Start Strategy: onboarding wizard → preferences → popular fallback
  * Sample Data overview
* Quay Video Demo (Status: To-Do, Assignee: Quốc Hào, Start: 2026-05-30)
  * 00:00-02:00: Problem introduction - job matching is broken, TalentSync giải quyết
  * 02:00-04:30: Demo - user onboarding → personalized job feed
  * 04:30-06:00: Demo - user applies → recommendations update real-time
  * 06:00-07:30: Architecture - Atlas UI → Vector Search index → Aggregation Pipeline
  * 07:30-09:00: Results - MongoDB integration details, scoring explanation
  * 09:00-10:00: Conclusion - 1 DB for operational + vector, next steps
* Nộp bài (Status: To-Do, Deadline: 2026-05-31 18:00 VNT)
  * Upload video lên YouTube (unlisted) hoặc Google Drive
  * Điền form nộp bài với team info + các link
  * Checklist trước nộp:
    - [ ] MongoDB là database chính
    - [ ] Vector Search (`$vectorSearch`) được sử dụng rõ ràng
    - [ ] Aggregation Pipeline được sử dụng rõ ràng
    - [ ] Video demo dưới 10 phút
    - [ ] Tài liệu kiến trúc + data schema hoàn chỉnh
    - [ ] Mô tả rõ cách áp dụng Vector Search & Aggregation Pipeline
