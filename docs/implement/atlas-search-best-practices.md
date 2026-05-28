# Atlas Search Best Practices — TalentSync

> Nguồn: Phân tích từ `mongodb_atlas.md` + triển khai thực tế trên platform
> Ngày: 2026-05-28
> Áp dụng cho: `idx_jobs_vector` (3072d, cosine)

---

## 1. Pre-Filter Injection (`$vectorSearch.filter`)

### 1.1 Nguyên lý

Atlas Vector Search pipeline có **2 tầng xử lý tách biệt**:

```
┌─────────────────────────────────────────────────────────────┐
│ TẦNG 1: Lucene Engine (index level)                        │
│   • Nhận $vectorSearch block                                │
│   • filter: { ... } → loại bỏ document KHÔNG khớp TRƯỚC   │
│   • Tính KNN cosine similarity cho document còn lại         │
│   • Trả về top K kết quả xếp hạng                          │
├─────────────────────────────────────────────────────────────┤
│ TẦNG 2: MongoDB Query Engine (document level)               │
│   • Nhận kết quả từ Lucene                                  │
│   • Áp dụng $match, $lookup, $addFields, $sort...          │
└─────────────────────────────────────────────────────────────┘
```

**Nguyên tắc:** Filter cố định, đơn giản → đưa vào `$vectorSearch.filter` (Lucene level). Filter phức tạp, động → giữ ở `$match` (Query Engine).

### 1.2 Phân loại filter trong TalentSync

| Filter | Đưa vào `$vectorSearch.filter`? | Lý do |
|--------|-------------------------------|-------|
| `visible: true` | ✅ CÓ | Hằng boolean, luôn cần |
| `category: "Lập trình"` | ✅ CÓ | String đơn giản, ảnh hưởng scoring |
| `location: "Hồ Chí Minh"` | ✅ CÓ | String đơn giản |
| `level: "Cao cấp"` | ✅ CÓ | String đơn giản |
| `_id: { $nin: [...] }` | ❌ KHÔNG | Mảng động, ObjectId/String hỗn hợp |
| `date: { $gte: ... }` | ❌ KHÔNG | Tính toán runtime |

### 1.3 Code mẫu đúng

```javascript
// Tách filter: đơn giản → Lucene, phức tạp → Query Engine
const vectorFilter = { visible: true };
if (category) vectorFilter.category = category;

const matchStage = {};
if (location) matchStage.location = location;
if (level) matchStage.level = level;

const results = await Job.aggregate([
  {
    $vectorSearch: {
      index: "idx_jobs_vector",
      path: "embedding",
      queryVector,
      numCandidates: 200,
      limit: 100,
      filter: vectorFilter,        // ← Lucene xử lý ở đây
    },
  },
  // Chỉ thêm $match nếu còn filter phức tạp
  ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
  { $match: { _id: { $nin: allExcluded } } },  // ← Query Engine xử lý ở đây
  // ... lookup, scoring, sort, limit ...
]);
```

### 1.4 Code mẫu sai (cần tránh)

```javascript
// SAI: filter chạy SAU KNN → lãng phí compute
{ $vectorSearch: { index: "idx_jobs_vector", path: "embedding", queryVector, numCandidates: 200, limit: 100 } },
{ $match: { visible: true } },  // ← Query Engine lọc, Lucene đã tính KNN cho job ẩn rồi!
```

### 1.5 Vị trí cần kiểm tra trong codebase

| File | Hàm | Dòng cần sửa |
|------|-----|-------------|
| `server/controller/jobController.js` | `getRecommendContent` | 247-254 |
| `server/controller/jobController.js` | `getRecommendFeed` | 345-353 |
| `server/scripts/testVectorSearch.js` | `test()` | 30-38 |

---

## 2. Embedding Cache

### 2.1 Vấn đề

Mỗi request gọi `recommend-content` hoặc `recommend-feed` → gọi OpenAI API tạo embedding. Chi phí:

| Thành phần | Latency | Chi phí API |
|------------|---------|------------|
| 1 lần gọi `text-embedding-3-large` | 50-200ms | ~$0.00013/1K tokens |
| User refresh feed 3 lần | 150-600ms | ~$0.00039 |
| 100 users × 5 refreshes/ngày | — | ~$0.065/ngày |

### 2.2 Giải pháp: In-Memory LRU Cache

```javascript
// server/services/embeddingService.js

const cache = new Map();
const CACHE_MAX_SIZE = 100;

export async function generateEmbedding(text) {
  // Fingerprint bằng 200 ký tự đầu (đủ title + category + level)
  const key = text.slice(0, 200);

  if (cache.has(key)) {
    console.log(`[Embedding Cache] HIT — "${key.slice(0, 50)}..."`);
    return cache.get(key);
  }

  console.log(`[Embedding Cache] MISS — calling OpenAI`);
  const trimmed = text.slice(0, MAX_CHARS);
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: trimmed,
    dimensions: EMBEDDING_DIMENSIONS,
  });
  const vec = response.data[0].embedding;

  // LRU eviction
  if (cache.size >= CACHE_MAX_SIZE) {
    const oldest = cache.keys().next().value;
    cache.delete(oldest);
  }
  cache.set(key, vec);
  return vec;
}
```

### 2.3 Khi nào cache có tác dụng

| Scenario | Không cache | Có cache |
|----------|------------|----------|
| User refresh feed (user.embedding cố định) | Gọi OpenAI mỗi lần | Cache hit, 0ms |
| 10 users search cùng query "Lập trình viên React" | 10 lần gọi | 1 lần gọi, 9 cache hit |
| `POST /api/jobs` tạo job mới | Gọi OpenAI | Cache miss (text mới) |

### 2.4 Giới hạn bộ nhớ

- 1 vector 3072d (float64) ≈ 24KB
- Cache 100 entries ≈ 2.4MB RAM
- An toàn cho môi trường dev và production nhỏ

---

## 3. Dimension Lock Constraint

### 3.1 Ràng buộc

Atlas Lucene index **khóa cứng** `numDimensions` tại thời điểm tạo. Không thể sửa tại chỗ.

```
idx_jobs_vector: numDimensions = 3072
→ Chỉ chấp nhận vector 3072 chiều
→ Nếu đổi model sang 1536d → index từ chối → lỗi runtime
```

### 3.2 Quy trình đổi model embedding

```
Bước 1: Thêm field mới vào schema
  Job schema: embedding_v2: { type: [Number], default: [] }

Bước 2: Tạo index mới
  idx_jobs_vector_v2: numDimensions = 1536, path = "embedding_v2"

Bước 3: Re-embed toàn bộ data
  node server/scripts/seedEmbeddings.js --field=embedding_v2 --dims=1536

Bước 4: Cập nhật code tham chiếu index mới
  $vectorSearch: { index: "idx_jobs_vector_v2", path: "embedding_v2", ... }

Bước 5: Xóa index cũ (sau khi xác nhận hoạt động)
  Atlas UI → Drop Index: idx_jobs_vector
```

### 3.3 Mô hình hiện tại

| Tham số | Giá trị | Ghi chú |
|---------|---------|---------|
| Model | `text-embedding-3-large` | OpenAI |
| Dimensions | 3072 | Khóa cứng trong index |
| Similarity | cosine | Phù hợp văn bản đa ngôn ngữ |
| Index | `idx_jobs_vector` | Trên collection `jobs`, field `embedding` |

---

## 4. `numCandidates` Tuning

### 4.1 Định nghĩa

`numCandidates` = số lượng document Lucene quét ban đầu trước khi tính KNN.

```
numCandidates = 200:
  → Lucene chọn 200 document gần nhất (theo index)
  → Tính cosine cho 200 document
  → Trả về top `limit` (vd: 100)
```

### 4.2 Khuyến nghị cho dataset TalentSync

| Dataset size | numCandidates | Lý do |
|-------------|--------------|-------|
| Hiện tại (36 jobs) | 100 | Vượt tổng số docs, quét toàn bộ |
| 100-1000 jobs | 200-500 | Cân bằng precision/speed |
| >10,000 jobs | 1000-2000 | Đảm bảo không bỏ sót |

### 4.3 Cấu hình hiện tại

| Nơi sử dụng | numCandidates | Đánh giá |
|------------|--------------|----------|
| `getRecommendContent` | 200 | Có thể giảm → 100 |
| `getRecommendFeed` | 200 | Có thể giảm → 100 |
| `testVectorSearch.js` | 200 | Giữ nguyên để test biên |

### 4.4 Cảnh báo

- **Quá thấp (<50):** Bỏ sót kết quả liên quan (recall thấp)
- **Quá cao (>10,000):** Tăng latency đáng kể, không cải thiện chất lượng
- **Golden rule:** `numCandidates ≥ limit × 2`

---

## 5. Tổng hợp các thay đổi cần áp dụng

| # | Ưu tiên | File | Thay đổi |
|---|---------|------|----------|
| 1 | P0 | `controller/jobController.js:getRecommendContent` | `$vectorSearch.filter: { visible: true, category }` |
| 2 | P0 | `controller/jobController.js:getRecommendFeed` | `$vectorSearch.filter: { visible: true }` |
| 3 | P0 | `scripts/testVectorSearch.js` | `$vectorSearch.filter: { visible: true }` |
| 4 | P1 | `services/embeddingService.js` | LRU cache 100 entries |
| 5 | P2 | `controller/jobController.js` (2 nơi) | `numCandidates: 200` → `100` |
| 6 | P2 | `docs/implement/decisions.md` | Ghi nhận Dimension Lock constraint |

---

## 6. Tham khảo

- `docs/implement/mongodb_atlas.md` — Atlas infrastructure deployment report
- `docs/implement/architecture.md` — System architecture & data schema
- [MongoDB Atlas Vector Search Documentation](https://www.mongodb.com/docs/atlas/atlas-vector-search/)
- [Atlas Search `$vectorSearch` Filter](https://www.mongodb.com/docs/atlas/atlas-vector-search/vector-search-stage/#filter)
