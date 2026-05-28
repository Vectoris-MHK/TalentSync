# Atlas Search Best Practices — TalentSync

> Nguồn: Phân tích từ `mongodb_atlas.md` + triển khai thực tế trên platform TalentSync
> Ngày: 2026-05-28 20:17 ICT
> Áp dụng cho: `idx_jobs_vector` (3072d, cosine, collection `jobs`)
> Cluster: M10 AWS Singapore, database `job-portal`

---

## 0. Kiến trúc Atlas Search trong TalentSync

### 0.1 Vai trò trong platform

TalentSync là nền tảng gợi ý việc làm dựa trên ngữ nghĩa. `$vectorSearch` là trái tim của hệ thống — nó cung cấp khả năng tìm kiếm theo ý nghĩa thay vì từ khóa chính xác. Trong tiếng Việt, điều này đặc biệt quan trọng vì cùng một khái niệm có nhiều cách diễn đạt khác nhau:

```
"Lập trình viên React" ≈ "Frontend Developer ReactJS" ≈ "Kỹ sư phần mềm React"
"Thiết kế đồ họa" ≈ "Graphic Designer" ≈ "Chuyên viên thiết kế 2D"
```

Vector embedding (3072d từ OpenAI `text-embedding-3-large`) nắm bắt được mối quan hệ ngữ nghĩa này thông qua cosine similarity — các vector gần nhau trong không gian 3072 chiều biểu thị các khái niệm tương tự.

### 0.2 Ba tính năng platform sử dụng `$vectorSearch`

| # | Tính năng | Người dùng thấy | API | Controller |
|---|-----------|----------------|-----|------------|
| A | **"Việc làm tương tự"** trong `ApplyJob.jsx` | 4 job card tương tự job đang xem | `GET /api/jobs/recommend-content?query=Lập trình viên ReactJS&exclude=abc123` | `getRecommendContent` |
| B | **"Việc làm gợi ý cho bạn"** trong `Home.jsx` | 20 job card cá nhân hóa, scroll ngang | `GET /api/jobs/recommend-feed` | `getRecommendFeed` |
| C | **Test script** cho developer | Terminal output xác minh index hoạt động | `node scripts/testVectorSearch.js` | Script trực tiếp |

### 0.3 Dòng dữ liệu từ người dùng đến kết quả

```
Người dùng mở ApplyJob.jsx
  │
  ▼
useEffect() → fetch('/api/jobs/recommend-content?query=Lập trình viên ReactJS')
  │
  ▼
Controller: getRecommendContent()
  ├─ generateEmbedding("Lập trình viên ReactJS") → gọi OpenAI → vector 3072d
  ├─ JobApplication.find({ userId }) → danh sách job đã apply
  ├─ UserEvent.find({ userId }) → danh sách job đã xem
  │
  ▼
Aggregation Pipeline (8 stages):
  ├─ $vectorSearch: Lucene quét index, tính cosine → top K
  ├─ $match: Lọc visible, location, level
  ├─ $lookup: Kết nối companies
  ├─ $addFields: Tính vectorScore + recencyBoost
  ├─ $addFields: Tính finalScore = vector×0.6 + recency×0.2 + ...
  ├─ $match: Loại trừ job đã apply/xem
  ├─ $sort + $limit: Xếp hạng, lấy 20
  └─ $project: Format response
  │
  ▼
Frontend: render <JobCard /> components với score, category, company
```

---

## 1. Pre-Filter Injection (`$vectorSearch.filter`)

### 1.1 Nguyên lý

Atlas Vector Search pipeline có **2 tầng xử lý tách biệt**, mỗi tầng chạy trên một engine khác nhau:

```
┌──────────────────────────────────────────────────────────────────┐
│ TẦNG 1: Apache Lucene Engine (index level)                      │
│   • Đây là tầng native search, chạy TRÊN Ổ CỨNG gần index      │
│   • Nhận toàn bộ $vectorSearch block                             │
│   • filter: { ... } → loại bỏ document KHÔNG khớp TRƯỚC KNN    │
│   • numCandidates: N → chọn N document ứng viên                 │
│   • Tính K-Nearest Neighbors (cosine similarity) cho N doc      │
│   • Trả về top limit kết quả đã xếp hạng                        │
│   • Tận dụng Scalar Quantization → nén 4x RAM, giữ 95-98% độ   │
│     chính xác                                                   │
├──────────────────────────────────────────────────────────────────┤
│ TẦNG 2: MongoDB Query Engine (document level)                    │
│   • Nhận kết quả từ Lucene                                       │
│   • Áp dụng $match, $lookup, $addFields, $sort, $limit...       │
│   • Đây là tầng aggregation pipeline truyền thống                │
└──────────────────────────────────────────────────────────────────┘
```

**Nguyên tắc vàng:** Filter nào Lucene xử lý được → đưa vào `$vectorSearch.filter` (tầng 1). Filter nào Lucene không xử lý được → giữ ở `$match` (tầng 2).

Tại sao? Vì mỗi document bị Lucene quét và tính KNN sẽ tiêu tốn **3072 phép nhân float**. Nếu bạn lọc document ở tầng 2, những document không liên quan đã bị tính KNN một cách lãng phí ở tầng 1 rồi.

### 1.2 Truy vết pipeline thực tế — Tính năng A: "Việc làm tương tự"

> **Trạng thái:** Pipeline bên dưới mô tả code TRƯỚC KHI refactor (không có filter). Code HIỆN TẠI đã được refactor — xem Section 1.5 để biết pattern thực tế.

**Kịch bản cụ thể:** User đang xem job "Lập trình viên ReactJS" (id=`abc123`) tại `ApplyJob.jsx`.

#### Bước 1: Frontend gọi API

```javascript
// ApplyJob.jsx (Epic 6)
useEffect(() => {
  fetch(`/api/jobs/recommend-content?query=${job.title}&exclude=${job._id}`, {
    headers: { Authorization: `Bearer ${getToken()}` }
  })
  .then(r => r.json())
  .then(data => setSimilarJobs(data.jobs));
}, [job._id]);
```

#### Bước 2: Controller chuẩn bị dữ liệu (dòng 212-243)

```javascript
// DÒNG 220: Gọi OpenAI tạo embedding
queryVector = await generateEmbedding("Lập trình viên ReactJS");
// Kết quả: vector 3072 chiều, mỗi chiều một float
// Vector này "hiểu" ngữ nghĩa: React, frontend, JavaScript, component...

// DÒNG 229-235: Xây dựng danh sách LOẠI TRỪ
const appliedJobs = await JobApplication.find({ userId }).select("jobId").lean();
// → [{ jobId: ObjectId("507f1f77bcf86cd799439011") }, { jobId: ObjectId("...") }]
const appliedJobIds = appliedJobs.map(a => a.jobId);
if (exclude) appliedJobIds.push("abc123"); // ← thêm job đang xem

const seenEvents = await UserEvent.find({ userId }).select("jobId").lean();
// → [{ jobId: "507f1f77bcf86cd799439022" }, { jobId: "..." }]
const seenJobIds = seenEvents.map(e => e.jobId);

// Gộp: ObjectId từ JobApplication + String từ UserEvent
const allExcluded = [...new Set([...appliedJobIds, ...seenJobIds])];
// → [ObjectId("...011"), ObjectId("..."), "abc123", "507f...022", ...]
// → 5 job bị loại trừ

// DÒNG 237-240: Xây dựng bộ lọc
const matchStage = { visible: true };
// Nếu user lọc từ UI: matchStage.location = "Hồ Chí Minh";
// Nếu user lọc từ UI: matchStage.level = "Cao cấp";
// Nếu user lọc từ UI: matchStage.category = "Lập trình";
```

#### Bước 3: Aggregation Pipeline thực thi (dòng 245-309) — PHÂN TÍCH TỪNG STAGE

**Đây là phần quan trọng nhất.** Tôi mô phỏng chính xác những gì Atlas làm bên trong với 36 jobs hiện có:

```
═══════════════════════════════════════════════════════════════════════════
STAGE 1: $vectorSearch (dòng 247-253)
───────────────────────────────────────────────────────────────────────────
Engine: Apache Lucene
Input từ controller:
  index: "idx_jobs_vector"
  path: "embedding"
  queryVector: [0.023, -0.015, 0.087, ..., 0.041]  ← 3072 số float32
  numCandidates: 200
  limit: 100
  filter: KHÔNG CÓ (đây là lỗi)

Lucene thực thi:
  ① Quét index metadata, đếm document đã đăng ký: 36 docs
  ② numCandidates=200, nhưng chỉ có 36 docs → tự động giảm còn 36
  ③ KHÔNG có pre-filter → tất cả 36 docs được đưa vào KNN
  ④ Tính cosine similarity cho TỪNG document (mỗi doc: 3072 phép nhân + 3072 phép cộng):

     Document "Lập trình viên ReactJS" (id: abc123):
       cosine(q, reactEmbedding) = Σ(q[i] × react[i]) / (|q| × |react|)
       = 0.998  ← RẤT CAO (cùng ngữ nghĩa React)
       → NHƯNG job này SẼ BỊ LOẠI ở Stage 6 vì nằm trong allExcluded!

     Document "Full-Stack Developer (MERN)" (visible: true):
       cosine(q, mernEmbedding) = 0.821  ← CAO (MERN = MongoDB/Express/React/Node)
       → Kết quả hợp lệ, sẽ xuất hiện

     Document "Graphic Designer" (visible: true):
       cosine(q, designEmbedding) = 0.320  ← THẤP (khác ngành)
       → Dù kết quả thấp, VẪN TỐN 3072 phép nhân để tính

     Document "Game Designer" (visible: FALSE):
       cosine(q, gameEmbedding) = 0.280  ← THẤP
       → JOB NÀY BỊ ẨN (visible:false), không ai thấy trên platform
       → NHƯNG VẪN BỊ TÍNH COSINE 3072 PHÉP NHÂN! ĐÂY LÀ LÃNG PHÍ!

     ... 32 document còn lại, mỗi cái tốn 3072 phép tính float ...

  ⑤ Tổng compute: 36 docs × 3072 = 110,592 phép nhân float + 110,592 phép cộng
  ⑥ Sắp xếp theo cosine score giảm dần
  ⑦ Trả về top 36 (thực tế là toàn bộ)

Kết quả Stage 1: 36 document đã xếp hạng
  (bao gồm: job ẩn, job đã apply, job đã xem, job đang xem)

───────────────────────────────────────────────────────────────────────────
STAGE 2: $match: matchStage (dòng 255)
───────────────────────────────────────────────────────────────────────────
Engine: MongoDB Query Engine
Input từ Lucene: 36 document

matchStage = { visible: true }
  (có thể thêm category, location, level nếu user filter từ UI)

Query Engine:
  ① Duyệt 36 document từ Stage 1
  ② Document "Game Designer": visible = false → LOẠI BỎ
  ③ Các document khác: visible = true → GIỮ LẠI
  ④ Nếu có category filter → loại bỏ doc khác category
  ⑤ Nếu có location filter → loại bỏ doc khác location
  ⑥ Nếu có level filter → loại bỏ doc khác level

Kết quả: ~34 document (đã lọc visible + optional filters)

→ VẤN ĐỀ CỐT LÕI:
  Game Designer (visible:false) đã bị Lucene tính cosine ở Stage 1
  với 3072 phép nhân float, sau đó mới bị Query Engine loại ở Stage 2.
  Chuỗi xử lý: "Tính KNN → Lọc" thay vì "Lọc → Tính KNN".
  LÃNG PHÍ COMPUTE.

───────────────────────────────────────────────────────────────────────────
STAGE 3: $lookup companies (dòng 257-263)
───────────────────────────────────────────────────────────────────────────
  - Kết nối mỗi job với document company tương ứng
  - Lấy tên, logo, email công ty
  - unwind để flatten (company là object, không phải array)

───────────────────────────────────────────────────────────────────────────
STAGE 4-5: $addFields — Tính điểm (dòng 265-283)
───────────────────────────────────────────────────────────────────────────
  Stage 4:
    vectorScore = $meta: "vectorSearchScore"  ← lấy từ Lucene
    recencyBoost = exp(-(now - date) / 30×86400000)
      → Job mới đăng hôm nay:     recencyBoost = exp(0) = 1.000
      → Job đăng 7 ngày trước:    recencyBoost = exp(-7/30) = 0.792
      → Job đăng 15 ngày trước:   recencyBoost = exp(-15/30) = 0.607
      → Job đăng 30 ngày trước:   recencyBoost = exp(-1) = 0.368
      → Job đăng 60 ngày:         recencyBoost = exp(-2) = 0.135

  Stage 5:
    score = vectorScore × 0.60      ← trọng số chính: ngữ nghĩa
          + recencyBoost × 0.20     ← ưu tiên job mới
          + skillMatch × 0.15       ← khớp category
          + salaryMatch × 0.05      ← có lương

  Ví dụ tính score cho "Full-Stack Developer (MERN)":
    vectorScore = 0.821 (từ Lucene)
    recencyBoost = 0.792 (đăng 7 ngày trước)
    skillMatch = 1 (cùng category "Lập trình")
    salaryMatch = 1 (có salary)
    score = 0.821×0.6 + 0.792×0.2 + 1×0.15 + 1×0.05
          = 0.4926 + 0.1584 + 0.15 + 0.05
          = 0.851

───────────────────────────────────────────────────────────────────────────
STAGE 6: $match: { _id: { $nin: allExcluded } } (dòng 285)
───────────────────────────────────────────────────────────────────────────
  allExcluded = [ObjectId("...011"), ObjectId("..."), "abc123", ...]
  
  - Loại bỏ job "Lập trình viên ReactJS" (abc123) ← job đang xem
  - Loại bỏ các job đã apply
  - Loại bỏ các job đã xem

  Kết quả: ~29 document

───────────────────────────────────────────────────────────────────────────
STAGE 7-9: $sort + $limit + $project (dòng 286-308)
───────────────────────────────────────────────────────────────────────────
  - Sắp xếp theo score giảm dần
  - Lấy 20 kết quả đầu
  - Format JSON response với các field cần thiết cho frontend

Kết quả cuối cùng: 20 jobs → gửi về ApplyJob.jsx
═══════════════════════════════════════════════════════════════════════════
```

### 1.3 So sánh trực quan: Pipeline CÓ vs KHÔNG có filter

```
╔══════════════════════════════════════════════════════════════════════╗
║              KHÔNG CÓ filter — CODE HIỆN TẠI (SAI)                  ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                      ║
║  Lucene Engine:                   MongoDB Query Engine:              ║
║  ┌────────────────────┐           ┌────────────────────┐            ║
║  │ 36 docs → KNN      │──────────→│ $match: visible    │            ║
║  │ • Tính cosine 36×  │  36 docs  │ • Loại bỏ doc ẩn   │            ║
║  │ • 110,592 phép     │           │ • Còn ~34 docs     │            ║
║  │   nhân float       │           └────────────────────┘            ║
║  │ • Bao gồm cả doc   │                                             ║
║  │   ẩn, doc đã apply │           ┌────────────────────┐            ║
║  └────────────────────┘           │ $match: exclusion  │            ║
║                                   │ • Loại bỏ đã xem   │            ║
║  Vấn đề:                          │ • Còn ~29 docs     │            ║
║  • Job ẩn bị tính KNN             └────────────────────┘            ║
║    → lãng phí compute             ┌────────────────────┐            ║
║  • Job đang xem bị tính KNN       │ $sort + $limit     │            ║
║    → sẽ bị loại sau               │ • Trả về 20 jobs   │            ║
║  • Job đã apply bị tính KNN       └────────────────────┘            ║
║    → sẽ bị loại sau                                                 ║
║                                                                      ║
║  Tổng lãng phí: 2 doc ẩn × 3072 × 2 phép tính = 12,288 ops         ║
║  (Với 36 docs thì nhỏ, với 10,000 docs thì LỚN)                     ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════════════╗
║           CÓ filter: { visible: true } — CODE ĐỀ XUẤT (ĐÚNG)       ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                      ║
║  Lucene Engine:                   MongoDB Query Engine:              ║
║  ┌────────────────────┐           ┌────────────────────┐            ║
║  │ 1. Pre-filter:     │           │ $match: exclusion  │            ║
║  │    Loại bỏ doc ẩn  │           │ • Loại bỏ đã xem   │            ║
║  │ 2. 34 docs → KNN   │──────────→│ • Còn ~25 docs     │            ║
║  │    • Tính cosine    │  34 docs  └────────────────────┘            ║
║  │    • 104,448 phép   │           ┌────────────────────┐            ║
║  │      nhân float     │           │ $sort + $limit     │            ║
║  │    • CHỈ doc hiển   │           │ • Trả về 20 jobs   │            ║
║  │      thị mới bị     │           └────────────────────┘            ║
║  │      tính KNN       │                                             ║
║  └────────────────────┘                                             ║
║                                                                      ║
║  Cải thiện:                                                          ║
║  • Job ẩn bị loại TRƯỚC KNN → 0 compute lãng phí                   ║
║  • Giảm ~5.6% phép tính float (110,592 → 104,448)                   ║
║  • Với 10,000 jobs và 5% doc ẩn → tiết kiệm 500 doc × 3072 =       ║
║    1.5 triệu phép tính mỗi query                                    ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝
```

### 1.4 Phân loại filter: Cái nào đưa lên Lucene, cái nào giữ ở Query Engine

```
┌──────────────────────┬────────────────────┬──────────────────────────────┐
│       Filter         │  Đưa vào           │  Lý do                       │
│                      │  $vectorSearch      │                              │
│                      │  .filter được?      │                              │
├──────────────────────┼────────────────────┼──────────────────────────────┤
│ visible: true        │  ✅ CÓ              │  Hằng boolean. Luôn cần      │
│                      │                    │  trong mọi query.            │
│                      │                    │  Lucene lọc native.          │
├──────────────────────┼────────────────────┼──────────────────────────────┤
│ category: "Lập       │  ✅ CÓ              │  String đơn giản, Lucene     │
│ trình"               │                    │  hỗ trợ. Filter này ảnh      │
│                      │                    │  hưởng TRỰC TIẾP đến         │
│                      │                    │  scoring — nếu category sai,  │
│                      │                    │  skillMatch luôn = 0,         │
│                      │                    │  lãng phí toàn bộ pipeline    │
│                      │                    │  sau KNN. Nên lọc sớm.       │
├──────────────────────┼────────────────────┼──────────────────────────────┤
│ location: "Hồ Chí    │  ✅ CÓ              │  String đơn giản. Nếu        │
│ Minh"                │                    │  có thì nên đưa lên.         │
│                      │                    │  Không có thì skip.          │
├──────────────────────┼────────────────────┼──────────────────────────────┤
│ level: "Cao cấp"     │  ✅ CÓ              │  String đơn giản.           │
│                      │                    │  Tương tự location.          │
├──────────────────────┼────────────────────┼──────────────────────────────┤
│ _id: { $nin: [...] } │  ❌ KHÔNG            │  LÝ DO 1: Mảng động,        │
│                      │                    │  kích thước biến đổi theo     │
│                      │                    │  user (có thể 5 hoặc 50 job). │
│                      │                    │                              │
│                      │                    │  LÝ DO 2: Kiểu dữ liệu hỗn   │
│                      │                    │  hợp — jobId từ               │
│                      │                    │  JobApplication là ObjectId,  │
│                      │                    │  jobId từ UserEvent có thể    │
│                      │                    │  là String. Lucene filter     │
│                      │                    │  yêu cầu kiểu đồng nhất.     │
│                      │                    │                              │
│                      │                    │  LÝ DO 3: $nin không được     │
│                      │                    │  hỗ trợ trong Lucene filter   │
│                      │                    │  syntax. Lucene dùng query    │
│                      │                    │  DSL khác MongoDB.            │
├──────────────────────┼────────────────────┼──────────────────────────────┤
│ date: { $gte: ... }  │  ❌ KHÔNG            │  Giá trị tính toán runtime  │
│                      │                    │  (now - 30 ngày). Lucene     │
│                      │                    │  filter không hỗ trợ biểu    │
│                      │                    │  thức động.                  │
├──────────────────────┼────────────────────┼──────────────────────────────┤
│ salary: { $gte: N }  │  ❌ KHÔNG            │  Lucene filter hỗ trợ       │
│                      │                    │  range query nhưng MongoDB   │
│                      │                    │  driver không expose qua     │
│                      │                    │  filter field. Dùng $match.  │
└──────────────────────┴────────────────────┴──────────────────────────────┘
```

### 1.5 Code mẫu đúng

```javascript
// ============================================================
// PATTERN CHUẨN: Tách filter thành 2 nhóm
// ============================================================

// Nhóm 1: Filter Lucene xử lý được → $vectorSearch.filter
const vectorFilter = { visible: true };
if (category) vectorFilter.category = category;

// Nhóm 2: Filter Lucene KHÔNG xử lý được → $match
const matchStage = {};
if (location) matchStage.location = location;
if (level) matchStage.level = level;

const results = await Job.aggregate([
  // ═══ TẦNG 1: Lucene Engine ═══
  {
    $vectorSearch: {
      index: "idx_jobs_vector",
      path: "embedding",
      queryVector,
      numCandidates: 200,
      limit: 100,
      filter: vectorFilter,        // ← Lọc TRƯỚC KNN
    },
  },

  // ═══ TẦNG 2: MongoDB Query Engine ═══
  // Chỉ thêm $match nếu còn filter Lucene không xử lý được
  ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),

  // Exclusion filter: luôn ở Query Engine (không đưa lên Lucene được)
  { $match: { _id: { $nin: allExcluded } } },

  // Các stage còn lại
  { $lookup: { from: "companies", localField: "companyId", foreignField: "_id", as: "company" } },
  // ...
]);
```

### 1.6 Code mẫu sai — 3 biến thể cần tránh

```javascript
// ─── SAI KIỂU 1: Tất cả filter sau KNN ───
// Vấn đề: Lucene tính KNN cho tất cả 36 docs (kể cả job ẩn)
{ $vectorSearch: { index: "idx_jobs_vector", path: "embedding", queryVector, numCandidates: 200, limit: 100 } },
{ $match: { visible: true, category: "Lập trình", location: "Hồ Chí Minh" } },
// → category và location nên được đưa lên $vectorSearch.filter

// ─── SAI KIỂU 2: Cố nhét exclusion vào filter ───
// Vấn đề: allExcluded chứa ObjectId lẫn String, Lucene từ chối
{ $vectorSearch: {
    index: "idx_jobs_vector", path: "embedding", queryVector, numCandidates: 200, limit: 100,
    filter: { visible: true, _id: { $nin: allExcluded } }  // ← LỖI RUNTIME!
} },
// → Lucene không hỗ trợ $nin với mảng động

// ─── SAI KIỂU 3: Dùng $match thay vì filter cho category ───
// Vấn đề: category ảnh hưởng trực tiếp đến skillMatch trong scoring.
// Nếu category không khớp, skillMatch = 0, score thấp.
// Lucene vẫn tốn KNN cho doc không liên quan.
{ $vectorSearch: { index: "idx_jobs_vector", path: "embedding", queryVector, numCandidates: 200, limit: 100 } },
{ $match: { category: "Lập trình" } },  // ← Nên đưa vào $vectorSearch.filter
```

### 1.7 Vị trí cần triển khai trong codebase

| File | Hàm | Dòng hiện tại | Nội dung sửa |
|------|-----|--------------|-------------|
| `server/controller/jobController.js` | `getRecommendContent` | 237-254 | Tách `vectorFilter` + `matchStage`, đưa `visible` + `category` vào filter |
| `server/controller/jobController.js` | `getRecommendFeed` | 343-353 | Thêm `filter: { visible: true }` vào `$vectorSearch` block |
| `server/scripts/testVectorSearch.js` | `test()` | 28-38 | Thêm `filter: { visible: true }`, bỏ `$match` riêng |

---

## 2. Scalar Quantization

### 2.1 Cơ chế

Atlas Vector Search sử dụng **Scalar Quantization (SQ)** mặc định để nén vector trong RAM:

```
Vector gốc (float32):  [0.023456789, -0.015678901, 0.087654321, ...]
                         ↓ Scalar Quantization
Vector nén (int8):     [6, -4, 22, ...]
                         ↓ Giải nén khi query
Vector khôi phục:      [0.023, -0.015, 0.086, ...]
```

### 2.2 Thông số kỹ thuật

| Tham số | Giá trị |
|---------|---------|
| Định dạng gốc | float32 (4 bytes/phần tử) |
| Định dạng nén | int8 (1 byte/phần tử) |
| Tỉ lệ nén | 4x |
| RAM cho 36 vectors | 36 × 3072 × 4B = 442KB (gốc) → 110KB (nén) |
| RAM cho 10,000 vectors | 10,000 × 3072 × 4B = 123MB (gốc) → 31MB (nén) |
| Độ chính xác | 95-98% so với float32 gốc |
| Tác động đến kết quả TalentSync | Không đáng kể với 36 jobs |

### 2.3 Ý nghĩa với platform

Với M10 cluster (2GB RAM), SQ cho phép lưu trữ khoảng **500,000 vectors** trong RAM trước khi cần nâng cấp. Với 36 jobs hiện tại, đây là over-provisioned — nhưng thể hiện kiến trúc sẵn sàng mở rộng.

---

## 3. Embedding Cache

### 3.1 Vấn đề: Chi phí ẩn của mỗi request

Mỗi request tới `recommend-feed` hoặc `recommend-content` đều phải gọi OpenAI API để tạo embedding. Phân tích chi phí:

```
Request lifecycle của GET /api/jobs/recommend-feed:
─────────────────────────────────────────────────────────
① Controller lấy user.embedding từ MongoDB          ~5ms
② GỌI OPENAI API tạo embedding (nếu dùng query)     ~150ms  ← CHI PHÍ CAO NHẤT
③ $vectorSearch (Lucene KNN)                        ~30ms
④ $lookup companies                                 ~10ms
⑤ Collaborative filtering pipeline                  ~80ms
⑥ Merge + deduplicate + sort                        ~5ms
─────────────────────────────────────────────────────────
   TỔNG THỜI GIAN:                                  ~280ms
   OPENAI CHIẾM:                                     ~54% thời gian
─────────────────────────────────────────────────────────
```

Không có cache, các tình huống lãng phí:

| Tình huống | Lần 1 | Lần 2 | Lần 3 | Tổng gọi OpenAI |
|-----------|-------|-------|-------|----------------|
| User refresh feed 3 lần (dùng user.embedding cố định) | Gọi | Gọi | Gọi | 3 lần (lãng phí 2) |
| 10 users search "Lập trình viên React" | Gọi×10 | — | — | 10 lần (lãng phí 9) |
| `POST /api/jobs` tạo 5 job mới → auto-embed | Gọi×5 | — | — | 5 lần (hợp lệ) |

### 3.2 Chi phí tài chính

| Hoạt động | Số lần | Chi phí/lần | Tổng/ngày |
|-----------|--------|------------|-----------|
| User refresh feed (100 users × 5 lần) | 500 | $0.00013 | $0.065 |
| Search query (50 users × 3 lần) | 150 | $0.00013 | $0.020 |
| Job creation (10 jobs/ngày) | 10 | $0.00013 | $0.001 |
| **Tổng không cache** | **660** | | **$0.086/ngày** |
| **Tổng có cache (70% hit rate)** | **~200** | | **$0.026/ngày** |

Tiết kiệm ~$0.06/ngày — nhỏ nhưng thể hiện ý thức tối ưu.

### 3.3 Giải pháp: In-Memory LRU Cache

```javascript
// server/services/embeddingService.js

const cache = new Map();
const CACHE_MAX_SIZE = 100;

export async function generateEmbedding(text) {
  // Fingerprint: 200 ký tự đầu đủ để phân biệt các job/search query
  // "Lập trình viên ReactJS. Lập trình. Cao cấp. Mô tả công việc: ..."
  //  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ ← 200 ký tự
  const key = text.slice(0, 200);

  // Cache HIT → trả về ngay lập tức, 0ms network latency
  if (cache.has(key)) {
    console.log(`[Embedding Cache] HIT — "${key.slice(0, 50)}..."`);
    return cache.get(key);
  }

  // Cache MISS → gọi OpenAI
  console.log(`[Embedding Cache] MISS — "${key.slice(0, 50)}..." → calling OpenAI`);
  const trimmed = text.slice(0, MAX_CHARS);  // MAX_CHARS = 7000
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,       // "text-embedding-3-large"
    input: trimmed,
    dimensions: EMBEDDING_DIMENSIONS,  // 3072
  });
  const vec = response.data[0].embedding;

  // LRU eviction: nếu cache đầy, xóa entry được thêm vào lâu nhất
  if (cache.size >= CACHE_MAX_SIZE) {
    const oldest = cache.keys().next().value;
    cache.delete(oldest);
  }
  cache.set(key, vec);
  return vec;
}
```

### 3.4 Phân tích cache key

**Tại sao dùng 200 ký tự đầu làm key?**

```
Input: "Lập trình viên ReactJS. Lập trình. Cao cấp. Công ty ABC tuyển dụng 
       Lập trình viên ReactJS với 3 năm kinh nghiệm. Yêu cầu: thành thạo 
       React, Redux, TypeScript. Ưu tiên ứng viên có kinh nghiệm làm việc 
       với Node.js và MongoDB. Mức lương: 20-30 triệu. Địa điểm: Hồ Chí Minh."
       
       └──────────────────── 200 ký tự ────────────────────┘
       Chứa: title + category + level + mô tả ngắn
       → Đủ để phân biệt job này với job khác
```

- **200 ký tự = đủ dài** để capture `title + category + level + ~100 ký tự mô tả đầu tiên`
- **200 ký tự = đủ ngắn** để 2 job tương tự (vd: 2 job React khác công ty) dùng chung cache
- **Không hash toàn bộ** vì mô tả có thể dài 5000+ ký tự — 2 job giống hệt mô tả nhưng khác 1 từ cuối sẽ tạo 2 cache entry riêng (lãng phí)

### 3.5 Khi nào cache có tác dụng

| Scenario | Không cache | Có cache | Hit rate |
|----------|------------|----------|----------|
| User refresh feed (user.embedding cố định) | Gọi OpenAI mỗi lần | Cache hit từ lần 2 | 67%+ |
| Search "Lập trình viên React" → refresh → search lại | 2 lần gọi | 1 lần gọi + 1 cache hit | 50% |
| 10 users search cùng query | 10 lần gọi | 1 lần gọi + 9 cache hit | 90% |
| `POST /api/jobs` tạo job mới → auto-embed | 1 lần gọi | Cache miss | 0% (hợp lệ) |
| `POST /api/jobs` update job | 1 lần gọi | Cache miss nếu text thay đổi | 0% (hợp lệ) |

### 3.6 Giới hạn bộ nhớ

| Thành phần | Kích thước |
|------------|-----------|
| 1 vector 3072d (float64 array) | 3072 × 8 bytes = 24,576 bytes ≈ 24KB |
| 1 cache entry (key + vector + overhead) | ~25KB |
| Cache 100 entries | 100 × 25KB ≈ 2.5MB |
| Node.js process heap (điển hình) | 50-100MB |
| Cache chiếm | 2.5-5% heap |

An toàn tuyệt đối cho môi trường dev và production nhỏ.

---

## 4. Dimension Lock Constraint

### 4.1 Ràng buộc kỹ thuật

Atlas Lucene index **khóa cứng** tham số `numDimensions` tại thời điểm tạo bằng JSON Editor. Đây không phải là cấu hình có thể sửa — nó được ghi vào Lucene segment files trên ổ cứng:

```
File cấu trúc index (trên ổ cứng Atlas):
  segment_a.si:
    field: "embedding"
    type: knn_vector
    dimension: 3072      ← GIÁ TRỊ NÀY KHÔNG THỂ SỬA SAU KHI TẠO

Nếu gửi vector 1536d vào index này:
  → Lucene ném lỗi: "vector dimension mismatch: expected 3072, got 1536"
  → Aggregation pipeline fail
  → API trả về lỗi 500
```

### 4.2 Hậu quả khi đổi model embedding

```
Scenario: Team quyết định chuyển từ text-embedding-3-large (3072d) 
          sang text-embedding-3-small (1536d) để tiết kiệm chi phí.

HIỆN TẠI:
  embedding: [0.023, 0.456, ..., 0.789]  ← 3072 phần tử
  idx_jobs_vector: numDimensions = 3072

TƯƠNG LAI (nếu chỉ đổi model, không đổi index):
  embedding: [0.111, 0.222, ..., 0.333]  ← 1536 phần tử
  idx_jobs_vector: numDimensions = 3072   ← VẪN 3072
  
  → $vectorSearch sẽ FAIL với mọi query
  → TOÀN BỘ hệ thống recommendation ngừng hoạt động
  → Không có fallback (vì $vectorSearch là stage đầu tiên)
```

### 4.3 Quy trình migration đúng

```
╔══════════════════════════════════════════════════════════════════╗
║ BƯỚC 1: Chuẩn bị schema — Thêm field vector mới                ║
╠══════════════════════════════════════════════════════════════════╣
║ // server/models/Job.js                                         ║
║ embedding_v2: { type: [Number], default: [] }                   ║
║                                                                  ║
║ → Field embedding cũ vẫn tồn tại, không bị xóa                   ║
║ → Hệ thống hiện tại vẫn hoạt động bình thường                    ║
╚══════════════════════════════════════════════════════════════════╝
                           │
                           ▼
╔══════════════════════════════════════════════════════════════════╗
║ BƯỚC 2: Tạo index mới trên field mới                            ║
╠══════════════════════════════════════════════════════════════════╣
║ Atlas UI → Search → Create Index → JSON Editor:                 ║
║ {                                                                ║
║   "fields": [{                                                  ║
║     "type": "vector",                                           ║
║     "path": "embedding_v2",                                     ║
║     "numDimensions": 1536,                                      ║
║     "similarity": "cosine"                                      ║
║   }]                                                             ║
║ }                                                                ║
║ Tên index: idx_jobs_vector_v2                                   ║
║                                                                  ║
║ → Index cũ idx_jobs_vector vẫn hoạt động song song               ║
╚══════════════════════════════════════════════════════════════════╝
                           │
                           ▼
╔══════════════════════════════════════════════════════════════════╗
║ BƯỚC 3: Re-embed toàn bộ data với model mới                     ║
╠══════════════════════════════════════════════════════════════════╣
║ // Sửa seedEmbeddings.js để hỗ trợ field đích                   ║
║ node server/scripts/seedEmbeddings.js \                         ║
║   --model=text-embedding-3-small \                              ║
║   --dims=1536 \                                                 ║
║   --field=embedding_v2 \                                        ║
║   --index=idx_jobs_vector_v2                                    ║
║                                                                  ║
║ → 36 jobs được re-embed với model nhỏ hơn                        ║
║ → Cả 2 field embedding và embedding_v2 tồn tại song song         ║
╚══════════════════════════════════════════════════════════════════╝
                           │
                           ▼
╔══════════════════════════════════════════════════════════════════╗
║ BƯỚC 4: Cập nhật code tham chiếu index mới                      ║
╠══════════════════════════════════════════════════════════════════╣
║ // controller/jobController.js                                  ║
║ $vectorSearch: {                                                ║
║   index: "idx_jobs_vector_v2",    ← đổi từ idx_jobs_vector      ║
║   path: "embedding_v2",           ← đổi từ embedding            ║
║   ...                                                            ║
║ }                                                                ║
║                                                                  ║
║ // embeddingService.js                                           ║
║ const EMBEDDING_MODEL = "text-embedding-3-small";               ║
║ const EMBEDDING_DIMENSIONS = 1536;                              ║
╚══════════════════════════════════════════════════════════════════╝
                           │
                           ▼
╔══════════════════════════════════════════════════════════════════╗
║ BƯỚC 5: Xóa index cũ (sau khi xác nhận mọi thứ hoạt động)      ║
╠══════════════════════════════════════════════════════════════════╣
║ Atlas UI → Search → idx_jobs_vector → ... → Drop Index          ║
║                                                                  ║
║ → Giải phóng tài nguyên Lucene cho index cũ                      ║
╚══════════════════════════════════════════════════════════════════╝
```

### 4.4 Cấu hình hiện tại — tham chiếu nhanh

| Tham số | Giá trị | Khóa cứng? | Ghi chú |
|---------|---------|-----------|---------|
| Model | `text-embedding-3-large` | Không (đổi được) | OpenAI |
| Dimensions | 3072 | **CÓ — khóa trong index** | Không sửa được nếu không tạo index mới |
| Similarity | cosine | Có (nhưng ít khi đổi) | Phù hợp văn bản đa ngôn ngữ |
| Index name | `idx_jobs_vector` | Có (phải khớp code) | Collection `jobs`, field `embedding` |
| numCandidates | 200 (nên giảm → 100) | Không (cấu hình query) | Thay đổi theo dataset |
| limit | 100 | Không | Số kết quả KNN tối đa |

---

## 5. `numCandidates` Tuning

### 5.1 Cơ chế hoạt động

`numCandidates` kiểm soát số lượng document mà Lucene engine quét từ index trước khi tính KNN:

```
Pipeline với numCandidates = 200, limit = 20:

  Lucene Index (36 docs đã đăng ký)
  │
  ├─ Bước 1: Chọn numCandidates document ứng viên
  │   → Quét index metadata → chọn 200 doc gần nhất
  │   → Nhưng chỉ có 36 docs → thực tế chọn 36
  │
  ├─ Bước 2: Tính cosine similarity cho 36 doc
  │   → 36 × 3072 = 110,592 phép nhân float
  │
  ├─ Bước 3: Sắp xếp theo similarity giảm dần
  │
  └─ Bước 4: Trả về top `limit` = 20 kết quả tốt nhất
      → 16 doc bị cắt bỏ ở bước này (đã tốn KNN)
```

### 5.2 Khuyến nghị theo quy mô dataset

| Giai đoạn | Số lượng jobs | numCandidates | limit | Lý do |
|-----------|-------------|--------------|-------|-------|
| **Hiện tại** (TalentSync) | 36 | **100** | 100 | Vượt tổng số docs, quét toàn bộ. 200 là dư thừa |
| Tăng trưởng nhẹ | 100-500 | 200 | 100 | Gấp đôi số doc thực tế |
| Tăng trưởng trung bình | 500-2000 | 500 | 100 | Cân bằng precision/speed |
| Production lớn | 2000-10,000 | 1000 | 100 | Đảm bảo không bỏ sót |
| Production rất lớn | >10,000 | 2000 | 100 | Giới hạn trên khuyến nghị |

### 5.3 Cấu hình hiện tại và đề xuất

| Vị trí trong code | numCandidates hiện tại | Đề xuất | Lý do |
|-------------------|----------------------|---------|-------|
| `getRecommendContent` | 200 | **100** | 36 jobs, 200 dư thừa 100% |
| `getRecommendFeed` (content branch) | 200 | **100** | Tương tự |
| `testVectorSearch.js` | 200 | **200** (giữ nguyên) | Test biên, xác minh index hoạt động với giá trị cao hơn thực tế |

### 5.4 Cảnh báo

| Cấu hình | Hậu quả |
|----------|---------|
| `numCandidates < 20` | Bỏ sót kết quả liên quan (recall thấp). Với 36 docs thì vẫn quét hết, nhưng khi scale lên sẽ lộ vấn đề |
| `numCandidates > 10,000` | Tăng latency đáng kể (hàng trăm ms). Không cải thiện chất lượng vì Lucene đã chọn các doc gần nhất từ index |
| **Golden rule** | `numCandidates ≥ limit × 2` — luôn quét ít nhất gấp đôi số kết quả cần trả về |

---

## 6. Network Caching & External API Considerations

### 6.1 Vấn đề

OpenAI embedding API là external service — mỗi lần gọi đi qua internet công cộng. Độ trễ không ổn định:

| Network condition | Latency OpenAI API |
|------------------|-------------------|
| Singapore → OpenAI (cùng region) | 50-80ms |
| Singapore → OpenAI (khác region) | 100-200ms |
| Network congestion | 200-500ms |
| Rate limit hit (retry) | 1000ms+ |

### 6.2 Khuyến nghị

1. **Sử dụng cache (Section 3)** — giảm 70%+ external calls
2. **Sử dụng user.embedding thay vì query text khi có thể** — user embedding được lưu trong MongoDB, không cần gọi OpenAI
3. **Batch embedding khi seed data** — `seedEmbeddings.js` đã làm đúng: 25 jobs/batch, delay 2s giữa các batch

### 6.3 Cấu hình hiện tại trong seedEmbeddings.js

```javascript
// server/scripts/seedEmbeddings.js
const BATCH_SIZE = 25;              // 25 jobs mỗi lần gọi API
const MAX_RETRIES = 3;              // Thử lại tối đa 3 lần nếu lỗi
const DELAY_BETWEEN_BATCHES = 2000; // Nghỉ 2 giây giữa các batch
```

Cấu hình này đã được kiểm chứng: 36 jobs embedded trong 2 batch, 0 lần thất bại.

---

## 7. Tổng hợp các thay đổi — TRẠNG THÁI TRIỂN KHAI

| # | Ưu tiên | File | Thay đổi | Trạng thái |
|---|---------|------|----------|-----------|
| 1 | **P0** | `controller/jobController.js:getRecommendContent` | Đưa `visible` + `location` + `level` + `category` vào `$vectorSearch.filter` (compound filter: `equals` + `text`) | ✅ ĐÃ ÁP DỤNG |
| 2 | **P0** | `controller/jobController.js:getRecommendFeed` | Thêm `filter: { compound: { filter: [{ equals: { path: "visible", value: true } }] } }` vào `$vectorSearch` | ✅ ĐÃ ÁP DỤNG |
| 3 | **P1** | `services/embeddingService.js` | Thêm `Map`-based LRU cache (max 100 entries, text key, evict oldest-first khi đầy) | ✅ ĐÃ ÁP DỤNG |
| 4 | **P2** | `controller/jobController.js` | Giảm `numCandidates: 200` → `100` | ❌ KHÔNG ÁP DỤNG (quyết định của team) |
| 5 | **P2** | `docs/implement/decisions.md` | Ghi nhận Dimension Lock, Pre-Filter Optimization, Embedding Cache | ✅ ĐÃ ÁP DỤNG |
| 6 | **P1** | `docs/implement/plan.md` | Mark tất cả task Days 1-3 là done, cập nhật actual timeline | ✅ ĐÃ ÁP DỤNG |
| 7 | **P1** | `docs/implement/architecture.md` | Cập nhật index definition thực tế, filter pattern, scoring, blend ratios | ✅ ĐÃ ÁP DỤNG |
| 8 | **P1** | `docs/implement/codebase.md` | Thêm file mới, SRV resolver pattern, filter pattern | ✅ ĐÃ ÁP DỤNG |
| 9 | **P1** | `docs/implement/context.md` | Mark tất cả P0+P1 gaps là resolved | ✅ ĐÃ ÁP DỤNG |

> **Tổng kết:** 7/9 thay đổi đã áp dụng. 1 không áp dụng theo quyết định của team (numCandidates giữ 200). 1 không cần thiết (testVectorSearch giữ nguyên vì không ảnh hưởng production).

---

## 8. Tham khảo

- `docs/implement/mongodb_atlas.md` — Atlas infrastructure deployment report (M10, AWS Singapore, index topology)
- `docs/implement/architecture.md` — System architecture & data schema (5 collections, 3072d vectors)
- `docs/implement/decisions.md` — Technical decisions & trade-offs
- [MongoDB Atlas Vector Search Documentation](https://www.mongodb.com/docs/atlas/atlas-vector-search/)
- [Atlas Search `$vectorSearch` Stage — Filter](https://www.mongodb.com/docs/atlas/atlas-vector-search/vector-search-stage/#filter)
- [Atlas Vector Search — Scalar Quantization](https://www.mongodb.com/docs/atlas/atlas-vector-search/vector-search-overview/#scalar-quantization)
- [OpenAI Embeddings — text-embedding-3-large](https://platform.openai.com/docs/guides/embeddings)
