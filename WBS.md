# Mongo Hack - Work Breakdown Structure (WBS)

Overview:
Hierarchical list of all phases and tasks for the Mongo Hack project. Each item shows status, assignees, start dates, and descriptions/checklists where available.

**Legend:** `**+ADD**` = New task added | `**-DROP**` = Task removed (obsolete/replaced) | `**~MOD**` = Task modified

## 1. Phân tích Requirement (Status: DONE, Start: 2026-05-24)

* **-DROP** ~~Xác định Use Case & Chọn hướng ứng dụng (Status: Done)~~ → Đã chốt Platform tìm việc
* Platform tìm việc (Status: Done, Assignee: Quốc Hào)
* Sourcecode: mzherx/Job-Portal-Prodigy (Status: Done, Assignee: Quốc Hào)
  * Link: [https://github.com/mzherx/Job-Portal-Prodigy](https://github.com/mzherx/Job-Portal-Prodigy)
* Tích hợp deepwiki vào NotebookLM (Status: Done)

## 2. Hạ tầng tính toán (Status: DONE, Start: 2026-05-24)

* Mongo Atlas Infra (Status: Done)
  * Đăng ký account MongoDB (Status: Done, Assignee: Quốc Hào)
  * Mail ban tổ chức xin credit (Status: Done, Assignee: Quốc Hào)
  * **~MOD** Xác minh Atlas M0 hỗ trợ Vector Search; n	ếu không → M10 trial (Status: Done, Assignee: Quốc Hào)
* **~MOD** Lựa chọn Model Embedding (Status: Done, Assignee: Khiem, Start: 2026-05-26)
  * **-DROP** ~~Tùy chọn: OpenAI text-embedding-3-small; OpenAI text-embedding-3-large; Mongo Voyage 3.5~~ → Đã chốt
  * **-DROP** ~~OpenAI text-embedding-3-small~~ → Không dùng
  * **-DROP** ~~OpenAI text-embedding-3-large~~ → Không dùng
  * **-DROP** ~~Mongo Voyage 3.5~~ → Không dùng
  * **+ADD** OpenAI `text-embedding-3-large` 3072d, cosine similarity, best Vietnamese support (Status: Done)
* **-DROP** ~~Lựa chọn Model Dimension: 1024 / 3072~~ → Đã bao gồm trong quyết định model

## 3. Data (Status: IN-PROGRESS, Start: 2026-05-26)

* Thiết kế Schema (Status: In-Progress, Start: 2026-05-26)
  * Khảo sát schema hiện có (Status: Done, Assignee: Khiem)
  * **+ADD** Thêm `embedding: [Number]` vào Job schema (Status: To-Do, Assignee: Khiem)
  * **+ADD** Thêm `preferences: [String]` + `embedding: [Number]` vào User schema (Status: To-Do, Assignee: Khiem)
  * **+ADD** Tạo model `UserEvent` (userId, jobId, eventType, weight, timestamp) (Status: To-Do, Assignee: Khiem)
* **-DROP** ~~Crawl data mẫu từ TopCV (Status: To-Do, Assignee: Minh)~~ → Thay bằng seed data Node.js script
  * **+ADD** Tạo `server/scripts/seedData.js` - 30 jobs, 3 companies, 10 users (Status: To-Do, Assignee: Khiem)
  * **+ADD** Tạo `server/scripts/seedEvents.js` - behavior data cho 10 users (~100 events) (Status: To-Do, Assignee: Khiem)
* **-DROP** ~~Chunking - Embedding: Viết Python thực hiện chunk và embed dữ liệu gốc~~ → Không dùng Python, không chunk nhỏ
  * **+ADD** Tạo `server/services/embeddingService.js` - generate job embedding từ title + description + category + level (Status: To-Do, Assignee: Khiem)
  * **+ADD** Tạo `server/scripts/seedEmbeddings.js` - embed toàn bộ jobs hiện có (Status: To-Do, Assignee: Khiem)
  * **+ADD** Sửa `postJob()` controller - tự động tạo embedding khi recruiter đăng job mới (Status: To-Do, Assignee: Khiem)
* User behaviour data vector (Status: To-Do)
  * **+ADD** Tạo `POST /api/users/events` - log view/bookmark/apply events (Status: To-Do)
  * **+ADD** Gắn event tracking vào frontend (ApplyJob mount, JobListing viewport) (Status: To-Do)
  * **+ADD** Tạo `GET /api/users/profile` - weighted average of interacted job embeddings → user embedding (Status: To-Do)

## 4. Phát triển Tính năng Cốt lõi (Status: IN-PROGRESS, Start: 2026-05-26)

* Chuẩn hoá môi trường dev (Status: Done, Start: 2026-05-25)

  * Push sourcecode lên git (Status: Done, Assignee: Quốc Hào)
  * Đóng gói context Hackathon vào Sourcecode (Status: Done, Assignee: Quốc Hào)
  * Convert Codebase (Status: Done, Assignee: Quốc Hào)
    * Chi tiết: javascript → typescript; npm → pnpm
  * Kiểm định README (Status: Done, Assignee: Quốc Hào)
  * Tìm kiếm agentskill phù hợp (Status: Done, Assignee: Quốc Hào)
  * Setup môi trường ENV (Status: Done, Assignee: Quốc Hào)
  * **+ADD** Tạo bộ docs cho AI agent: `AGENTS.md` + `docs/implement/{context,architecture,plan,decisions,codebase}.md` (Status: Done, Assignee: Quốc Hào)
* **+ADD** Thiết lập Vector Search Index trên Atlas (Status: To-Do, P0, Assignee: Khiem, Start: 2026-05-26)

  * **+ADD** Tạo index `idx_jobs_vector` trên `jobs.embedding`, 3072d, cosine (Status: To-Do)
  * **+ADD** Kiểm tra với `server/scripts/testVectorSearch.js` (Status: To-Do)
* **+ADD** Xây dựng Recommendation API (Status: To-Do, P0, Assignee: Khiem, Start: 2026-05-26)

  * **+ADD** `GET /api/jobs/recommend-content` - `$vectorSearch` + text query → top 20 jobs (Status: To-Do)
  * **+ADD** `GET /api/jobs/recommend-feed` - hybrid feed: content-based (70%) + collaborative (30%) (Status: To-Do)
  * **+ADD** `GET /api/jobs/collaborative` - user-user collaborative filtering pipeline (Status: To-Do)
* **+ADD** Xây dựng Aggregation Pipeline hoàn chỉnh (Status: To-Do, P0, Assignee: Khiem, Start: 2026-05-27)

  * **+ADD** Pipeline stages: `$vectorSearch` → `$match` → `$lookup` Company → `$addFields` score → `$match` not applied → `$sort` → `$limit` (Status: To-Do)
  * **+ADD** Score = vectorScore(0.6) + recencyBoost(0.2) + skillMatch(0.15) + salaryMatch(0.05) (Status: To-Do)
  * **+ADD** Recency: `exp(-(now-date)/(30*86400000))` - 30-day decay (Status: To-Do)
* Tích hợp AI & Hàm xử lý Query Input của User (Status: To-Do, Start: 2026-05-26)

  * **+ADD** Embed query text → `$vectorSearch` (Status: To-Do)
  * **+ADD** User profile embedding → dùng làm query vector trong `$vectorSearch` (Status: To-Do)

## 5. Tối ưu hóa và Hoàn thiện MVP (Status: TO-DO, Start: 2026-05-28)

* **+ADD** Tích hợp Frontend Recommendation (Status: To-Do, Assignee: Khiem, Start: 2026-05-28)

  * **+ADD** Component `RecommendedJobs.jsx` - gọi `GET /api/jobs/recommend-feed`, hiển thị job cards (Status: To-Do)
  * **+ADD** Cập nhật `Home.jsx` - thêm section "Recommended For You" (Status: To-Do)
  * **+ADD** Thay thế `findSimilarJobs` trong `ApplyJob.jsx` bằng API gọi thật (Status: To-Do)
  * **+ADD** Onboarding modal - chọn categories khi user mới đăng ký (Status: To-Do)
  * **+ADD** Explanation badge trên JobCard - "Matches your skills", "Similar to viewed jobs" (Status: To-Do)
* Triển khai Hybrid Search & Rank Fusion (Status: To-Do)

  * **+ADD** Blending: content-based (70%) + collaborative (30%) → deduplicate → rank (Status: To-Do)
* **-DROP** ~~Tối ưu cấu trúc Pre-filtering (Status: To-Do)~~ → Đã bao gồm trong aggregation pipeline ($match stage)
* **-DROP** ~~Thực hiện Chunking dữ liệu văn bản (Status: To-Do)~~ → Không chunk cho MVP
* **-DROP** ~~Thiết lập cơ chế Caching cho Query phổ biến (Status: To-Do)~~ → không cần cho MVP (ít users)

## 6. Hoàn thiện Hồ sơ và Nộp bài (Status: TO-DO, Start: 2026-05-30)

* Soạn Tài liệu Kỹ thuật hoàn chỉnh (Status: To-Do, Assignee: Khiem, Start: 2026-05-30)

  * MVP Description: Hệ thống gợi ý việc làm dùng Vector Search Index + Aggregation Pipeline (Status: To-Do)
  * System Architecture - context diagram, component diagram (Status: To-Do)
  * Data Schema - 5 collections với fields, types, indexes (Status: To-Do)
  * Cách áp dụng Vector Search và Aggregation Pipeline (Status: To-Do)
  * Sample Data overview (Status: To-Do)
  * Cold Start Strategy explanation (Status: To-Do)
* Quay và biên tập Video Demo sản phẩm (Status: To-Do, Assignee: Quốc Hào, Start: 2026-05-30)

  * Use Case + Problem Statement (2 phút) (Status: To-Do)
  * Demo sản phẩm: new user onboarding → recommendations → apply → feed updates (5 phút) (Status: To-Do)
  * Architecture showcase: Atlas UI → Vector Search index → Aggregation Pipeline (2 phút) (Status: To-Do)
  * Kết quả & MongoDB advantages (1 phút) (Status: To-Do)
* Nộp bài (Status: To-Do, Deadline: 2026-05-31 18:00 VNT)

  * **+ADD** Upload video (YouTube unlisted hoặc Google Drive) (Status: To-Do)
  * **+ADD** Điền form nộp bài với team info + các link (Status: To-Do)
  * **+ADD** Checklist trước nộp: Vector Search ✅ Aggregation Pipeline ✅ MongoDB primary ✅ Demo <10min ✅ Docs ✅ (Status: To-Do)
