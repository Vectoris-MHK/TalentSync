# Demo Video Script — TalentSync

> Duration: 9 phút 30 giây (tối đa 10 phút)
> Ngôn ngữ: Tiếng Việt
> Người trình bày: Quốc Hào

---

## Tổng quan Timeline

| Phân đoạn | Thời gian | Nội dung |
|---|---|---|
| **Mở đầu** | 00:00 – 01:30 | Giới thiệu bài toán & TalentSync |
| **Onboarding** | 01:30 – 03:00 | Người dùng mới → chọn sở thích → feed phổ biến |
| **Tương tác & Cá nhân hóa** | 03:00 – 05:00 | Xem job → apply → hệ thống học hành vi → feed cá nhân hóa |
| **Kiến trúc MongoDB** | 05:00 – 07:00 | Vector Search + Aggregation Pipeline + Công thức scoring |
| **So sánh người dùng** | 07:00 – 08:30 | User A (IT) vs User B (Design) → kết quả khác nhau |
| **Kết luận** | 08:30 – 09:30 | Điểm mạnh MongoDB + Tổng kết |

---

# Phần 1: Kịch bản lời thoại (Script)

---

## PHÂN ĐOẠN 1: MỞ ĐẦU (00:00 – 01:30)

### Slide 1 — Tiêu đề (00:00 – 00:20)

> **[Hiển thị logo TalentSync + tên cuộc thi]**

**Script:**
"Xin chào ban giám khảo. Mình là Quốc Hào, đại diện nhóm TalentSync. Hôm nay mình sẽ demo hệ thống gợi ý việc làm thông minh — sử dụng MongoDB Atlas Vector Search và Aggregation Pipeline để cá nhân hóa trải nghiệm tìm việc cho người dùng Việt Nam."

---

### Slide 2 — Bài toán (00:20 – 01:00)

> **[Hiển thị 3 con số lớn + biểu tượng]**

**Script:**
"Thị trường tuyển dụng Việt Nam có hơn 50 triệu người trong độ tuổi lao động. Mỗi tháng có hàng chục nghìn tin tuyển dụng mới được đăng tải. Nhưng người tìm việc gặp một vấn đề rất lớn: làm sao để tìm được công việc phù hợp nhất giữa hàng nghìn lựa chọn?

Các nền tảng hiện tại chủ yếu dùng bộ lọc thủ công: chọn ngành nghề, chọn địa điểm, chọn mức lương. Nhưng cách này có 3 hạn chế lớn:

Một — không hiểu được **ý nghĩa thực sự** của tin tuyển dụng. 'Lập trình viên React' và 'Frontend Developer' là cùng một công việc nhưng bộ lọc từ khóa không nhận ra.

Hai — không học được **hành vi** của người dùng để đưa ra gợi ý cá nhân hóa.

Và ba — người dùng mới không có dữ liệu thì nhận được gì? Đa số là một trang trắng hoặc danh sách ngẫu nhiên."

---

### Slide 3 — Giải pháp (01:00 – 01:30)

> **[Hiển thị sơ đồ 3 lớp của TalentSync]**

**Script:**
"TalentSync giải quyết cả ba vấn đề này bằng cách kết hợp ba công nghệ cốt lõi trên MongoDB Atlas:

Thứ nhất — **Vector Search** để hiểu ngữ nghĩa của tin tuyển dụng. Mỗi job được chuyển thành một vector 3072 chiều bằng OpenAI embedding. Hai job có nội dung tương tự sẽ có vector gần nhau trong không gian — bất kể chúng dùng từ ngữ khác nhau như thế nào.

Thứ hai — **Collaborative Filtering** qua Aggregation Pipeline. Hệ thống tìm những người dùng có hành vi tương tự bạn, rồi gợi ý những job họ đã quan tâm mà bạn chưa xem.

Thứ ba — **Cold Start Strategy** ba tầng. Người dùng mới sẽ được chọn danh mục sở thích, sau đó nhận job phổ biến nhất. Càng tương tác nhiều, gợi ý càng chính xác."

---

## PHÂN ĐOẠN 2: ONBOARDING NGƯỜI DÙNG MỚI (01:30 – 03:00)

### Slide 4 — Đăng nhập + Onboarding (01:30 – 02:15)

> **[Màn hình quay thực tế: Đăng nhập bằng Clerk → Hiện modal onboarding]**

**Script:**
"Mình sẽ bắt đầu demo với một người dùng hoàn toàn mới — chưa có bất kỳ dữ liệu nào trong hệ thống.

Đăng nhập qua Clerk — TalentSync dùng Clerk để xác thực người dùng, không cần tự xây dựng hệ thống auth.

Ngay sau khi đăng nhập lần đầu, hệ thống phát hiện người dùng chưa có sở thích — và hiển thị modal onboarding. Ở đây người dùng được chọn một hoặc nhiều lĩnh vực quan tâm: Lập trình, Thiết kế, Marketing, Tài chính...

Mình chọn 'Lập trình' — và dữ liệu này được gửi lên API `POST /api/users/preferences` để lưu vào MongoDB."

---

### Slide 5 — Feed khởi đầu (02:15 – 03:00)

> **[Màn hình quay thực tế: Trang Home với RecommendedJobs section + JobListing]**

**Script:**
"Ngay sau khi chọn sở thích, trang chủ hiển thị section 'Việc làm gợi ý cho bạn' — đây là horizontal scroll với các job card được cá nhân hóa.

Vì người dùng chưa có embedding profile, hệ thống chạy ở chế độ 'Preferences' — lấy tất cả job thuộc danh mục 'Lập trình', sắp xếp theo thời gian đăng mới nhất.

Phía dưới là danh sách đầy đủ với bộ lọc theo danh mục, địa điểm — người dùng vẫn có thể tự do tìm kiếm thủ công nếu muốn.

Response từ API có field `mode: "preferences"` để frontend biết đây là kết quả từ chế độ nào. Sau này khi có embedding, mode sẽ chuyển thành `"hybrid"`."

---

## PHÂN ĐOẠN 3: TƯƠNG TÁC & CÁ NHÂN HÓA (03:00 – 05:00)

### Slide 6 — Xem và Apply job (03:00 – 04:00)

> **[Màn hình quay thực tế: Click vào một job IT → Xem chi tiết → Apply]**

**Script:**
"Bây giờ người dùng bắt đầu tương tác. Mình click vào job 'Lập trình viên ReactJS' để xem chi tiết.

Ngay khi trang job mở ra, một `useEffect` chạy và gửi sự kiện 'view' lên server qua API `POST /api/users/events`. Sự kiện này được lưu vào collection `userevents` với trọng số là 1 — mức thấp nhất vì view chỉ thể hiện sự quan tâm nhẹ.

Ở cột bên phải, mình thấy section 'Similar Jobs' — đây là những job tương tự được gợi ý qua API `GET /api/jobs/recommend-content`. API này nhận query text là tiêu đề job hiện tại, tạo embedding, rồi dùng `$vectorSearch` để tìm các job có vector gần nhất trong không gian 3072 chiều.

Kết quả: ReactJS Developer, Full-Stack Developer, Mobile Developer — hoàn toàn chính xác về mặt ngữ nghĩa.

Mình apply vào job này. Khi apply, hệ thống tự động tạo một sự kiện 'apply' với trọng số 5 — mức cao nhất — thể hiện người dùng thực sự quan tâm."

---

### Slide 7 — Hệ thống học và cập nhật (04:00 – 05:00)

> **[Hiển thị sơ đồ: Events → User Profile Embedding → Feed mới]**

**Script:**
"Sau một vài tương tác — view, bookmark, apply — hệ thống đã thu thập đủ dữ liệu hành vi.

Lúc này, API `GET /api/users/profile` được gọi. Backend thực hiện một Aggregation Pipeline:

Đầu tiên — nhóm tất cả sự kiện của người dùng theo `jobId`, cộng dồn trọng số (view=1, bookmark=3, apply=5).

Tiếp theo — `$lookup` vào collection `jobs` để lấy embedding vector của từng job đã tương tác.

Sau đó — tính **weighted average** của tất cả vector, rồi chuẩn hóa thành unit vector. Kết quả là một vector 3072 chiều đại diện cho 'sở thích tổng hợp' của người dùng — và được lưu vào field `users.embedding`.

Khi người dùng refresh trang chủ hoặc quay lại lần sau, API `GET /api/jobs/recommend-feed` phát hiện người dùng đã có embedding 3072 chiều — và tự động chuyển sang chế độ **Hybrid**."

---

## PHÂN ĐOẠN 4: KIẾN TRÚC MONGODB (05:00 – 07:00)

### Slide 8 — Atlas Cluster & Vector Search Index (05:00 – 05:45)

> **[Hiển thị: Atlas UI screenshot + Index definition JSON + Architecture diagram]**

**Script:**
"Bây giờ mình sẽ đi sâu vào kiến trúc kỹ thuật — phần quan trọng nhất cho bài nộp hackathon.

TalentSync chạy trên MongoDB Atlas cluster M10 tại AWS Singapore. Database tên là `job-portal` với 5 collections.

Collection `jobs` có một field đặc biệt: `embedding` — mảng 3072 số float, được tạo bởi OpenAI `text-embedding-3-large`. Mô hình này được chọn vì hỗ trợ tiếng Việt tốt nhất trong các mô hình embedding hiện tại.

Trên field `embedding` này, mình tạo một Atlas Vector Search Index tên là `idx_jobs_vector` — cấu hình 3072 dimensions, similarity metric là cosine. Index này cho phép tìm kiếm ngữ nghĩa — không phải tìm kiếm từ khóa chính xác.

Index sử dụng Scalar Quantization — nén 4x bộ nhớ RAM nhưng vẫn giữ 95-98% độ chính xác. Với 36 jobs hiện tại thì không cần, nhưng kiến trúc này sẵn sàng cho hàng chục nghìn jobs."

---

### Slide 9 — Aggregation Pipeline Chi tiết (05:45 – 06:45)

> **[Hiển thị: Pipeline 8-stage dạng sơ đồ + Code snippet $vectorSearch]**

**Script:**
"Trái tim của hệ thống là Aggregation Pipeline 8 bước trong API `recommend-content`.

**Stage 1 — $vectorSearch:** Đây là stage bắt buộc phải đứng đầu. Nó gửi query vector tới Apache Lucene engine, quét `numCandidates = 200` ứng viên gần nhất, và trả về top 100. Đặc biệt, mình sử dụng `$vectorSearch.filter` để pre-filter ở mức Lucene — lọc `visible: true`, `category`, `location` **trước khi** tính KNN. Điều này giúp tránh lãng phí compute cho những job ẩn hoặc không liên quan.

**Stage 2 — $match:** Loại trừ những job người dùng đã apply hoặc đã xem.

**Stage 3 — $lookup:** Join với collection `companies` để lấy thông tin công ty.

**Stage 4-5 — $addFields:** Tính điểm. Lấy `vectorSearchScore` từ `$meta`, cộng với `recencyBoost` theo công thức exponential decay 30 ngày, `skillMatch` nếu khớp category, và `salaryMatch` nếu có lương.

**Công thức:** `score = vectorScore × 0.60 + recencyBoost × 0.20 + skillMatch × 0.15 + salaryMatch × 0.05`

Trong đó `recencyBoost = e^(-(ngày_trôi_qua)/30)` — job mới đăng hôm nay có boost = 1.0, sau 30 ngày còn 0.37.

**Stage 6 — $sort** theo score giảm dần. **Stage 7 — $limit** 20 kết quả. **Stage 8 — $project** format response sạch cho frontend."

---

### Slide 10 — Hệ thống Recommendation 3 chế độ (06:45 – 07:00)

> **[Hiển thị: Bảng 3 chế độ + Code snippet recommend-feed]**

**Script:**
"Ở tầng cao hơn, API `recommend-feed` hoạt động như một hybrid blender với 3 chế độ tự động:

**Chế độ Hybrid:** Khi người dùng có embedding 3072 chiều — gọi song song `$vectorSearch` (trả về 14 job) và collaborative filtering (trả về tối đa 6 job) — merge, deduplicate, sort lại theo score.

**Chế độ Preferences:** Khi người dùng mới chỉ chọn danh mục — lọc theo category, sort theo ngày đăng.

**Chế độ Popular:** Fallback cuối cùng — trả về job có nhiều lượt apply nhất.

Mỗi response đều có field `mode` để frontend biết chính xác dữ liệu đến từ đâu."

---

## PHÂN ĐOẠN 5: SO SÁNH NGƯỜI DÙNG KHÁC NHAU (07:00 – 08:30)

### Slide 11 — User A (IT) vs User B (Design) (07:00 – 08:00)

> **[Split screen: Bên trái User A — bên phải User B — cả hai cùng xem Home page]**

**Script:**
"Để chứng minh hệ thống thực sự cá nhân hóa — không phải chỉ trả về kết quả ngẫu nhiên — mình sẽ so sánh hai người dùng khác nhau.

**Bên trái: User A — một lập trình viên.** Người này đã xem và apply các job về React, Node.js, Full-Stack. Feed của User A hiển thị: Lập trình viên ReactJS, Full-Stack Developer, Mobile Developer, Backend Developer... Tất cả đều thuộc lĩnh vực IT.

**Bên phải: User B — một designer.** Người này đã xem các job về UI/UX, Graphic Design, Motion Graphics. Feed của User B hiển thị: UI/UX Designer, Graphic Designer, Motion Graphics Designer... Hoàn toàn khác biệt.

Điều thú vị là — cả hai người dùng đều gọi cùng một API endpoint `GET /api/jobs/recommend-feed`. Sự khác biệt đến từ `user.embedding` — mỗi người có một vector profile riêng, dẫn đến kết quả `$vectorSearch` khác nhau."

---

### Slide 12 — Collaborative Filtering hoạt động (08:00 – 08:30)

> **[Hiển thị: Sơ đồ Collaborative Filtering + Kết quả JobCard có badge "Người dùng tương tự bạn đã quan tâm"]**

**Script:**
"Không chỉ content-based — hệ thống còn có collaborative filtering.

Pipeline 13 bước hoạt động như sau: Tìm tất cả job mà người dùng đã bookmark hoặc apply → tìm những người dùng khác cũng quan tâm các job đó → thu thập job mà họ đã thích → loại bỏ job đã xem → xếp hạng theo tổng trọng số tương tác → trả về 20 kết quả.

Ví dụ: User A apply vào 'ReactJS Developer'. Hệ thống tìm thấy User C và User D cũng apply job này. User C còn bookmark 'Node.js Developer' — job này sẽ được gợi ý cho User A với badge 'Người dùng tương tự bạn đã quan tâm'.

Đây chính là sức mạnh của việc dùng **một database duy nhất** cho cả dữ liệu nghiệp vụ và vector search — Aggregation Pipeline có thể join tự do giữa `userevents`, `jobs`, và `companies` mà không cần ETL pipeline phức tạp."

---

## PHÂN ĐOẠN 6: KẾT LUẬN (08:30 – 09:30)

### Slide 13 — Điểm mạnh MongoDB (08:30 – 09:00)

> **[Hiển thị: 4 điểm mạnh dạng bullet + icon]**

**Script:**
"Qua dự án này, mình muốn nhấn mạnh 4 điểm mạnh của MongoDB trong việc xây dựng recommendation engine:

**Thứ nhất — Single Database.** Không cần dual-database sync giữa operational DB và vector DB. Mọi thứ — job, user, event, embedding — đều nằm trong cùng một cluster. Aggregation Pipeline tự nhiên join được tất cả.

**Thứ hai — $vectorSearch tích hợp sẵn.** Atlas Search Index được tạo bằng JSON config, không cần cài đặt plugin hay extension. Vector search chạy trên cùng infrastructure với dữ liệu chính.

**Thứ ba — Aggregation Pipeline linh hoạt.** Từ lọc, join, tính điểm, sắp xếp — tất cả trong một pipeline duy nhất, không cần code application layer phức tạp.

**Thứ tư — Pre-filter optimization.** `$vectorSearch.filter` cho phép lọc ở mức Lucene trước khi tính KNN, giúp tránh lãng phí compute và cải thiện chất lượng kết quả."

---

### Slide 14 — Tổng kết & Cảm ơn (09:00 – 09:30)

> **[Hiển thị: Thông tin dự án + QR code GitHub + Lời cảm ơn]**

**Script:**
"Tổng kết lại, TalentSync là một nền tảng gợi ý việc làm hoàn chỉnh, xây dựng trên MongoDB Atlas với:

- 36 jobs, 10 users, 215 behavior events làm seed data
- OpenAI text-embedding-3-large, 3072 chiều cho tiếng Việt
- Vector Search Index với cosine similarity
- 3 recommendation API endpoints, tất cả đều dùng `$vectorSearch` và Aggregation Pipeline
- Chiến lược cold start 3 tầng đảm bảo người dùng mới luôn có trải nghiệm tốt
- LRU cache giảm 70% chi phí gọi OpenAI API

Toàn bộ source code có trên GitHub. Cảm ơn ban giám khảo đã theo dõi. Mình sẵn sàng trả lời câu hỏi."

---

# Phần 2: Nội dung Slide (Visual Content)

---

## Slide 1 — Tiêu đề

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│              [LOGO TALENTSYNC]                           │
│                                                          │
│     Recommendation Engine — Nền tảng Gợi ý Việc làm      │
│                                                          │
│          MongoDB Hackathon 2026 — MUGVN                  │
│                                                          │
│          Người trình bày: Quốc Hào                       │
│          Team: TalentSync                                │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## Slide 2 — Bài toán

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│                   BÀI TOÁN                               │
│                                                          │
│    50M+        10,000+         3 VẤN ĐỀ                  │
│   lao động     tin tuyển      với nền tảng                │
│   Việt Nam     dụng/tháng     hiện tại                    │
│                                                          │
│   ┌─────────────────────────────────────────────────┐    │
│   │ ❌ Không hiểu ngữ nghĩa                          │    │
│   │    "Lập trình viên React" ≠ "Frontend Developer" │    │
│   │    → Bộ lọc từ khóa không nhận ra                │    │
│   │                                                  │    │
│   │ ❌ Không học hành vi người dùng                   │    │
│   │    → Mọi người dùng đều thấy giống nhau           │    │
│   │                                                  │    │
│   │ ❌ Cold start = trang trắng                       │    │
│   │    → Người dùng mới không có trải nghiệm          │    │
│   └─────────────────────────────────────────────────┘    │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## Slide 3 — Giải pháp TalentSync

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│                GIẢI PHÁP TALENTSYNC                       │
│                                                          │
│   ┌──────────────────┐  ┌──────────────────┐             │
│   │  VECTOR SEARCH   │  │  COLLABORATIVE   │             │
│   │  (Ngữ nghĩa)     │  │  FILTERING       │             │
│   │                  │  │  (Hành vi)       │             │
│   │  text-embedding  │  │                  │             │
│   │  -3-large 3072d  │  │  "Users like     │             │
│   │  + cosine        │  │   you liked..."  │             │
│   └────────┬─────────┘  └────────┬─────────┘             │
│            │                     │                       │
│            └──────────┬──────────┘                       │
│                       ▼                                  │
│          ┌────────────────────────┐                      │
│          │   HYBRID BLENDER       │                      │
│          │   70% content          │                      │
│          │   + 30% collaborative  │                      │
│          └───────────┬────────────┘                      │
│                      ▼                                   │
│   ┌─────────────────────────────────────────────────┐    │
│   │          COLD START STRATEGY                     │    │
│   │  Onboarding → Preferences → Popular fallback     │    │
│   └─────────────────────────────────────────────────┘    │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## Slide 4 — Đăng nhập + Onboarding (Live Demo)

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│          [QUAY MÀN HÌNH TRỰC TIẾP]                       │
│                                                          │
│   Góc trên trái:                                         │
│   📍 Đăng nhập với Clerk                                 │
│                                                          │
│   Góc dưới phải:                                         │
│   🎯 Modal Onboarding xuất hiện                          │
│      - Chọn danh mục: ☑ Lập trình  ☐ Thiết kế            │
│                       ☐ Marketing  ☐ Tài chính           │
│                                                          │
│   API Call: POST /api/users/preferences                  │
│   → Lưu vào MongoDB: users.preferences = ["Lập trình"]   │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## Slide 5 — Feed khởi đầu (Live Demo)

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│          [QUAY MÀN HÌNH TRỰC TIẾP]                       │
│                                                          │
│   Trang chủ hiển thị:                                    │
│                                                          │
│   ┌─────────────────────────────────────────────────┐    │
│   │  VIỆC LÀM GỢI Ý CHO BẠN          mode:preferences│    │
│   │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ → scroll   │    │
│   │  │React │ │Full- │ │Node  │ │Java  │             │    │
│   │  │JS Dev│ │Stack │ │JS Dev│ │Dev   │             │    │
│   │  └──────┘ └──────┘ └──────┘ └──────┘             │    │
│   └─────────────────────────────────────────────────┘    │
│                                                          │
│   📊 Response API:                                       │
│   { success: true, mode: "preferences",                  │
│     category: ["Lập trình"], jobs: [...] }               │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## Slide 6 — Xem và Apply job (Live Demo)

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│          [QUAY MÀN HÌNH TRỰC TIẾP]                       │
│                                                          │
│   Trang ApplyJob: "Lập trình viên ReactJS"               │
│                                                          │
│   ┌─────────────────┐  ┌──────────────────────────┐      │
│   │  Job Details    │  │  Similar Jobs             │      │
│   │  (ReactJS Dev)  │  │  ┌────────────────────┐   │      │
│   │                 │  │  │ Full-Stack Dev     │   │      │
│   │  [APPLY NOW] ───│──│  │ Mobile Dev         │   │      │
│   │       │         │  │  │ Frontend Dev       │   │      │
│   │       ▼         │  │  └────────────────────┘   │      │
│   │  ✅ Applied!    │  │                           │      │
│   └─────────────────┘  │  API: recommend-content   │      │
│                        │  + $vectorSearch          │      │
│   Sự kiện được ghi:    └──────────────────────────┘      │
│   POST /api/users/events                                 │
│   { eventType: "view", weight: 1 }                       │
│   { eventType: "apply", weight: 5 } ← auto               │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## Slide 7 — Học và cập nhật Profile

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│        HỆ THỐNG HỌC HÀNH VI & SINH PROFILE               │
│                                                          │
│   UserEvents                          User Profile       │
│   ┌──────────────────┐               ┌──────────────┐    │
│   │ view x3  (w=3)   │               │ embedding    │    │
│   │ bookmark x1 (w=3)│  ─────────►   │ [0.023,      │    │
│   │ apply x1  (w=5)  │  Weighted     │  -0.451,     │    │
│   └──────────────────┘  Average      │   ...3072d]  │    │
│                         + Unit Vec   └──────────────┘    │
│   ┌──────────────────┐                                   │
│   │ $lookup jobs     │  GET /api/users/profile           │
│   │ Lấy embedding    │  → Cập nhật user.embedding        │
│   │ từng job đã xem  │                                   │
│   └──────────────────┘                                   │
│                                                          │
│   Công thức:                                             │
│   avgVec[i] = Σ(embed_j[i] × weight_j) / Σ(weight_j)    │
│   unitVec = avgVec / ||avgVec||                          │
│                                                          │
│   Kết quả: User có vector profile → Feed chuyển sang     │
│   chế độ HYBRID (70% vector + 30% collaborative)         │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## Slide 8 — Atlas & Vector Search Index

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│     MONGODB ATLAS — CLUSTER & VECTOR SEARCH INDEX        │
│                                                          │
│   ┌──────────────────────────────────────────────────┐   │
│   │  Atlas Cluster: M10, AWS Singapore               │   │
│   │  MongoDB 8.0 | Database: job-portal              │   │
│   │  5 Collections: users, jobs, companies,          │   │
│   │                 jobapplications, userevents      │   │
│   └──────────────────────────────────────────────────┘   │
│                                                          │
│   Vector Search Index: idx_jobs_vector                    │
│   ┌──────────────────────────────────────────────────┐   │
│   │  {                                                │   │
│   │    "fields": [{                                   │   │
│   │      "type": "vector",                            │   │
│   │      "path": "embedding",                         │   │
│   │      "numDimensions": 3072,                       │   │
│   │      "similarity": "cosine"                       │   │
│   │    }]                                             │   │
│   │  }                                                │   │
│   └──────────────────────────────────────────────────┘   │
│                                                          │
│   Model: OpenAI text-embedding-3-large (3072d)            │
│   Compression: Scalar Quantization (4x RAM, 95-98%)      │
│   DNS: Google DNS resolver (Windows c-ares fix)           │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## Slide 9 — Aggregation Pipeline

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│   AGGREGATION PIPELINE — 8 STAGES (recommend-content)    │
│                                                          │
│   ┌─────────────────────────────────────────────────┐    │
│   │ STAGE 1: $vectorSearch                          │    │
│   │   index: idx_jobs_vector, numCandidates: 200     │    │
│   │   filter: { visible:true, category, location }   │    │
│   │   → Lucene pre-filter TRƯỚC KNN                 │    │
│   ├─────────────────────────────────────────────────┤    │
│   │ STAGE 2: $match — Loại job đã apply/xem         │    │
│   │ STAGE 3: $lookup — Join companies               │    │
│   ├─────────────────────────────────────────────────┤    │
│   │ STAGE 4: $addFields                             │    │
│   │   vectorScore = $meta.vectorSearchScore          │    │
│   │   recencyBoost = exp(-(now-date)/30days)         │    │
│   │ STAGE 5: $addFields                             │    │
│   │   score = vector×0.6 + recency×0.2              │    │
│   │         + skillMatch×0.15 + salaryMatch×0.05     │    │
│   ├─────────────────────────────────────────────────┤    │
│   │ STAGE 6: $sort — score giảm dần                 │    │
│   │ STAGE 7: $limit — 20 kết quả                    │    │
│   │ STAGE 8: $project — Format response             │    │
│   └─────────────────────────────────────────────────┘    │
│                                                          │
│   📐 Công thức:                                          │
│   score = 0.60×vectorScore + 0.20×recencyBoost          │
│         + 0.15×skillMatch + 0.05×salaryMatch             │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## Slide 10 — 3 Chế độ Recommendation

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│          RECOMMEND-FEED — 3 CHẾ ĐỘ TỰ ĐỘNG               │
│                                                          │
│   ┌──────────────────────────────────────────────────┐   │
│   │  HYBRID MODE                                     │   │
│   │  Trigger: user.embedding.length === 3072         │   │
│   │  ┌─────────────────┐  ┌──────────────────┐       │   │
│   │  │ $vectorSearch   │  │ Collaborative    │       │   │
│   │  │ 14 jobs (70%)   │  │ 6 jobs (30%)     │       │   │
│   │  └────────┬────────┘  └────────┬─────────┘       │   │
│   │           └──────────┬─────────┘                 │   │
│   │                      ▼                           │   │
│   │           Merge → Deduplicate → Sort → 20 jobs   │   │
│   └──────────────────────────────────────────────────┘   │
│                                                          │
│   ┌──────────────────────────────────────────────────┐   │
│   │  PREFERENCES MODE                                │   │
│   │  Trigger: user.preferences.length > 0            │   │
│   │  → $match category ∈ preferences → sort date     │   │
│   └──────────────────────────────────────────────────┘   │
│                                                          │
│   ┌──────────────────────────────────────────────────┐   │
│   │  POPULAR MODE (Fallback)                         │   │
│   │  Trigger: no embedding, no preferences           │   │
│   │  → $lookup jobapplications → sort appCount desc  │   │
│   └──────────────────────────────────────────────────┘   │
│                                                          │
│   Response luôn có: { mode: "hybrid"|"preferences"|... } │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## Slide 11 — So sánh User A vs User B (Live Demo)

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│   [SPLIT SCREEN — LIVE DEMO]                             │
│                                                          │
│   USER A (Lập trình viên)     USER B (Designer)          │
│   ┌──────────────────────┐  ┌──────────────────────┐     │
│   │ Việc làm gợi ý       │  │ Việc làm gợi ý       │     │
│   │                      │  │                      │     │
│   │ 🔧 ReactJS Dev       │  │ 🎨 UI/UX Designer    │     │
│   │ 🔧 Full-Stack Dev    │  │ 🎨 Graphic Designer  │     │
│   │ 🔧 Mobile Developer  │  │ 🎨 Motion Graphics   │     │
│   │ 🔧 Node.js Developer │  │ 🎨 Art Director      │     │
│   │ 🔧 Backend Engineer  │  │ 🎨 Brand Designer    │     │
│   └──────────────────────┘  └──────────────────────┘     │
│                                                          │
│   Cùng 1 API: GET /api/jobs/recommend-feed               │
│   Khác biệt: user.embedding (từ hành vi khác nhau)       │
│                                                          │
│   User A profile: IT jobs (vector thiên về tech)         │
│   User B profile: Design jobs (vector thiên về creative) │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## Slide 12 — Collaborative Filtering

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│     COLLABORATIVE FILTERING — 13-STAGE PIPELINE          │
│                                                          │
│   ┌─────────────────────────────────────────────────┐    │
│   │  "Users who liked what you liked also liked..." │    │
│   └─────────────────────────────────────────────────┘    │
│                                                          │
│   User A ──apply──► ReactJS Dev                          │
│                         │                                │
│                         ▼                                │
│              ┌──────────────────┐                        │
│              │ Tìm similar user │                        │
│              │ User C, User D   │                        │
│              │ (cũng apply job  │                        │
│              │  ReactJS Dev)    │                        │
│              └────────┬─────────┘                        │
│                       ▼                                  │
│              ┌──────────────────┐                        │
│              │ Job họ đã thích  │                        │
│              │ • Node.js Dev ⭐  │                        │
│              │ • TypeScript Dev  │                        │
│              │ • AWS Engineer    │                        │
│              └────────┬─────────┘                        │
│                       ▼                                  │
│         ┌─────────────────────────────┐                  │
│         │ Gợi ý cho User A:           │                  │
│         │ 🏷 "Người dùng tương tự     │                  │
│         │     bạn đã quan tâm"        │                  │
│         └─────────────────────────────┘                  │
│                                                          │
│   13 stages: match → $lookup → $unwind → $group →       │
│   $lookup → $unwind → $group → $match → $sort →         │
│   $limit → $lookup → $unwind → $project                  │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## Slide 13 — Điểm mạnh MongoDB

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│       4 ĐIỂM MẠNH CỦA MONGODB TRONG RECOMMENDATION      │
│                                                          │
│   ┌─────────────────────────────────────────────────┐    │
│   │  1️⃣  SINGLE DATABASE                             │    │
│   │  Operational data + Vector search trong cùng     │    │
│   │  một cluster. Không cần dual-DB sync.            │    │
│   │  Aggregation Pipeline join tự do mọi collection. │    │
│   ├─────────────────────────────────────────────────┤    │
│   │  2️⃣  $VECTORSEARCH TÍCH HỢP SẴN                  │    │
│   │  Atlas Search Index tạo bằng JSON config.        │    │
│   │  Không cần plugin, không cần extension.          │    │
│   │  Chạy trên cùng infrastructure.                  │    │
│   ├─────────────────────────────────────────────────┤    │
│   │  3️⃣  AGGREGATION PIPELINE LINH HOẠT              │    │
│   │  Lọc → Join → Tính điểm → Sort → Limit           │    │
│   │  Tất cả trong 1 pipeline. Không cần code         │    │
│   │  application layer phức tạp.                     │    │
│   ├─────────────────────────────────────────────────┤    │
│   │  4️⃣  PRE-FILTER OPTIMIZATION                     │    │
│   │  $vectorSearch.filter lọc ở Lucene level         │    │
│   │  TRƯỚC KNN → Tránh lãng phí compute.             │    │
│   │  Scalar Quantization → 4x RAM, 95-98% accuracy.  │    │
│   └─────────────────────────────────────────────────┘    │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## Slide 14 — Tổng kết & Cảm ơn

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│                   TỔNG KẾT                               │
│                                                          │
│   ✅ 36 jobs, 10 users, 215 behavior events              │
│   ✅ OpenAI text-embedding-3-large, 3072d                 │
│   ✅ Atlas Vector Search Index (cosine similarity)        │
│   ✅ 3 Recommendation API (recommend-feed,                │
│      recommend-content, collaborative)                   │
│   ✅ Cold start 3 tầng (hybrid → preferences → popular)  │
│   ✅ LRU Embedding Cache (70% hit rate)                  │
│                                                          │
│   ┌─────────────────────────────────────────────────┐    │
│   │  MongoDB là PRIMARY DATABASE                     │    │
│   │  ✓ $vectorSearch sử dụng rõ ràng                │    │
│   │  ✓ Aggregation Pipeline nhiều stage             │    │
│   │  ✓ Operational + Vector trong 1 DB              │    │
│   └─────────────────────────────────────────────────┘    │
│                                                          │
│   GitHub: [QR CODE]                                      │
│                                                          │
│   CẢM ƠN BAN GIÁM KHẢO ĐÃ THEO DÕI!                     │
│   Sẵn sàng trả lời câu hỏi                               │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## Hướng dẫn Quay & Dựng Video

### Trước khi quay

1. **Chuẩn bị môi trường:**
   - Mở 2 trình duyệt (1 cho User A IT, 1 cho User B Design) hoặc dùng Incognito
   - Đăng nhập sẵn User A (đã có lịch sử tương tác IT)
   - Chuẩn bị sẵn User B (đã có lịch sử tương tác Design)
   - Mở Atlas UI ở tab riêng để show index + cluster
   - Mở VS Code với `jobController.js` để show code pipeline

2. **Kiểm tra API hoạt động:**
   ```bash
   node server/scripts/testVectorSearch.js
   ```

3. **Xóa cache trình duyệt** để demo cold start mượt.

### Trong khi quay

| Phút | Hành động trên màn hình |
|------|------------------------|
| 0:00-1:30 | Slides 1-3: trình bày slide tĩnh |
| 1:30-2:15 | Slide 4: chuyển sang browser, đăng nhập Clerk, hiện modal onboarding |
| 2:15-3:00 | Slide 5: trang Home hiển thị RecommendedJobs section |
| 3:00-4:00 | Slide 6: click vào job IT → ApplyJob page → Apply |
| 4:00-5:00 | Slide 7: quay lại slide giải thích pipeline học |
| 5:00-5:45 | Slide 8: chuyển sang Atlas UI tab → show index |
| 5:45-6:45 | Slide 9: chuyển sang VS Code → show pipeline code |
| 6:45-7:00 | Slide 10: slide tĩnh 3 chế độ |
| 7:00-8:00 | Slide 11: split screen 2 browser → so sánh feed |
| 8:00-8:30 | Slide 12: slide tĩnh collaborative |
| 8:30-9:00 | Slide 13: slide tĩnh điểm mạnh |
| 9:00-9:30 | Slide 14: slide tổng kết + cảm ơn |

### Mẹo quay

- Ghi âm riêng, quay màn hình riêng — dựng lại sau để chất lượng tốt nhất
- Zoom code khi show pipeline (Ctrl + = trong VS Code)
- Dùng OBS Studio hoặc Screen Studio để quay
- Highlight vùng quan trọng bằng con trỏ chuột (dùng Cursor Highlighter extension)
