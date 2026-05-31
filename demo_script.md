Script demo 10 phút (theo WBS)
00:00–02:00 — Giới thiệu vấn đề & giải pháp
Mở http://localhost:5173, chưa login. Nói:

"Bài toán: hàng nghìn job listing, user không biết cái nào phù hợp. TalentSync dùng MongoDB Vector Search + Aggregation Pipeline để gợi ý việc làm cá nhân hóa."

02:00–04:30 — Onboarding → Personalized feed
Đăng ký tài khoản mới qua Clerk (hoặc dùng account test chưa có preferences)
OnboardingModal tự hiện sau 800ms — chọn 2-3 categories (vd: "Lập trình", "Thiết kế")
Click "Bắt đầu tìm việc" → modal đóng
Section "Việc làm gợi ý cho bạn" hiện ra với badge "Dựa trên sở thích của bạn" (mode: preferences)
Scroll qua các job cards — chỉ ra badge màu xanh
04:30–06:00 — User tương tác → recommendations cập nhật
Click vào 1 job card → trang ApplyJob — view event tự fire ngầm
Click "Apply Now" → toast "Applied Successfully"
Quay về Home → gọi GET /api/users/profile để tính embedding (dùng Postman hoặc browser console):
// Paste vào browser console khi đang ở localhost:5173
const token = await window.Clerk.session.getToken();
const r = await fetch('http://localhost:5000/api/users/profile', {headers:{Authorization:`Bearer ${token}`}});
console.log(await r.json()); // coldStart: false → embedding computed
Reload trang → RecommendedJobs giờ dùng mode: hybrid (badge "Phù hợp với kỹ năng của bạn")
06:00–07:30 — Atlas UI → Vector Search → Aggregation Pipeline
Mở MongoDB Atlas (cloud.mongodb.com):

Browse Collections → job-portal.jobs → show 1 document với field embedding: [0.023, ...] (3072 numbers)
Atlas Search → Indexes → idx_jobs_vector → show config: numDimensions: 3072, similarity: cosine
Mở Atlas Aggregation tab trên collection userevents → show events của user vừa tạo
07:30–09:00 — MongoDB integration details
Mở code, show nhanh 3 điểm:

server/controller/jobController.js — $vectorSearch stage:

$vectorSearch: {
  index: "idx_jobs_vector",
  queryVector: user.embedding,  // 3072d vector
  numCandidates: 200,
  filter: { compound: { filter: [{ equals: { path: "visible", value: true } }] } }
}
Scoring formula (cùng file):

score = vectorScore × 0.6 + recencyBoost × 0.2 + skillMatch × 0.15 + salaryMatch × 0.05
server/services/embeddingService.js — OpenAI text-embedding-3-large, 3072d, LRU cache

09:00–10:00 — Kết luận
"Một MongoDB Atlas duy nhất xử lý: operational data (jobs, users, applications) + vector embeddings + aggregation pipeline. Không cần vector DB riêng, không cần sync pipeline."

Lưu ý trước khi quay
Dùng account mới (chưa có preferences) để demo onboarding flow từ đầu
Nếu muốn show hybrid mode ngay: dùng 1 trong 10 seeded users đã có events — nhưng những user đó là Clerk ID từ seed, không login được bằng Clerk thật → tốt nhất vẫn dùng account mới + apply vài job + gọi /api/users/profile
Bookmark 1-2 jobs trước khi gọi profile để embedding phong phú hơn