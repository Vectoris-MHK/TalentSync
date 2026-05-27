# Critical Path Method — TalentSync MongoHack 2026

> Generated: 2026-05-27 10:57 ICT
> Updated: 2026-05-27 16:10 ICT
> Deadline: 2026-05-31 18:00 ICT (~98h còn lại)
> Elapsed: 16h (thực hiện: A B C G D I) / ~6h làm việc thực tế
> Working hours: ~5h/ngày ≈ 20h thực tế

---

## 1. Task Network

```
H(0.5) ──┬── I(0.67) ──┐
         │              │
         └── J(0.67) ───┤
                        │
A(0.1) ──┬── B(0.5) ──┬── C(0.17)          ├── K(0.33) ── L(1.5) ── M(5.0)
         │             │                    │
         │             ├── D(0.33) ── E(0.25) ── F(1.0)
         │             │
         └── G(0.67)
```

---

## 2. Task List with Dependencies & Duration

| ID | Task | Duration (h) | Dependencies | Epic | Status |
|----|------|-------------|--------------|------|--------|
| A | Install `openai` + set `OPENAI_API_KEY` | 0.10 | — | 4.1 | ✅ Done |
| B | `server/services/embeddingService.js` | 0.50 | A | 4.1 | ✅ Done |
| C | Sửa `postJob()` controller auto-embed | 0.17 | B | 4.1 | ✅ Done |
| D | `server/scripts/seedEmbeddings.js` | 0.33 | B | 4.1 | ✅ Done |
| E | Tạo Atlas Vector Search Index `idx_jobs_vector` | 0.25 | D | 4.2 | ⬜ Pending |
| F | `GET /api/jobs/recommend-content` (8-stage pipeline) | 1.00 | B, E | 4.3 | ⬜ Pending |
| G | Seed jobs + crawl TopCV + merge | 1.00 | A | 3.2 | ✅ Done |
| H | User behavior tracking (POST /events + sửa apply) | 0.50 | — (UserEvent done) | 5.1 | ⬜ Pending |
| I | User profile embedding + preferences API | 0.67 | H | 5.2 | ✅ Done |
| J | Collaborative filtering API | 0.67 | H | 5.3 | ⬜ Pending |
| K | Hybrid feed API `GET /api/jobs/recommend-feed` | 0.33 | F, I, J | 5.4 | ⬜ Pending |
| L | Frontend (RecommendedJobs + Onboarding + event tracking) | 1.50 | K | 6.1 | ⬜ Pending |
| M | E2E test + technical doc + demo video | 5.00 | L | 6.2-6.3 | ⬜ Pending |

**Total work:** 12.48h (có thể parallel, thực tế ~8h critical path còn lại)

---

## 3. Forward Pass (Earliest Start / Earliest Finish)

| ID | ES (h) | EF (h) | Tính toán |
|----|--------|--------|-----------|
| A | 0.00 | 0.77 | ✅ Done (actual: A+B+C+G+D+I = 2.77h) |
| B | 0.00 | 0.60 | ✅ Done |
| C | 0.60 | 0.77 | ✅ Done |
| H | 2.77 | 3.27 | ES = now (2.77) |
| G | 0.77 | 1.44 | ✅ Done |
| D | 0.77 | 1.10 | ✅ Done |
| I | 2.77 | 3.44 | ✅ Done (actual: 0.67h from commit 69c6747) |
| J | 3.27 | 3.94 | ES = EF(H) |
| E | 2.77 | 3.02 | ES = now (2.77) |
| **F** | **3.02** | **4.02** | **ES = max(EF(B)=0.77, EF(E)=3.02)** |
| **K** | **4.02** | **4.35** | **ES = max(EF(F)=4.02, EF(I)=3.44, EF(J)=3.94)** |
| **L** | **4.35** | **5.85** | **ES = EF(K)** |
| **M** | **5.85** | **10.85** | **ES = EF(L)** |

---

## 4. Backward Pass (Latest Start / Latest Finish)

| ID | LF (h) | LS (h) | Tính toán |
|----|--------|--------|-----------|
| M | 10.18 | 5.18 | LF = EF(M) |
| L | 5.18 | 3.68 | LF = LS(M) |
| K | 3.68 | 3.35 | LF = LS(L) |
| F | 3.35 | 2.35 | LF = LS(K) |
| E | 2.35 | 2.10 | LF = LS(F) |
| D | 2.10 | 1.77 | LF = LS(E) |
| I | 3.35 | 2.68 | LF = LS(K), float=0.08h |
| J | 3.35 | 2.68 | LF = LS(K), float=0.08h |
| H | 2.68 | 2.18 | LF = min(LS(I), LS(J)), float=0.08h |
| C | 2.35 | 2.18 | LF = LS(F), float=1.41h |
| B | 0.77 | 0.27 | LF = min(LS(C)=2.18, LS(D)=0.77, LS(F)=1.35) |
| G | 9.18 | 8.51 | LF = LS(M), float=7.74h |
| A | 0.77 | 0.67 | LF = min(LS(B)=0.27, LS(G)=8.51) |

---

## 5. Critical Path (Updated)

> **A, B, C, G, D completed at 2.10h. Critical path now runs from E forward.**

```
E ──→ F ──→ K ──→ L ──→ M
```

| Step | Task | ES | EF | Duration |
|------|------|----|----|----------|
| **Done** | A+B+C+G+D: Setup, schema, seed data + embeddings | 0.00 | 2.10 | 2.10h |
| 1 | E: Atlas Vector Search Index | 2.10 | 2.35 | 0.25h |
| 2 | F: recommend-content API | 2.35 | 3.35 | 1.00h |
| 3 | K: Hybrid feed API | 3.35 | 3.68 | 0.33h |
| 4 | L: Frontend components | 3.68 | 5.18 | 1.50h |
| 5 | M: E2E test + docs + video | 5.18 | 10.18 | 5.00h |

| Metric | Value |
|--------|-------|
| Tổng critical path còn lại | **8.08 giờ** |
| Đã hoàn thành | 2.10h (A+B+C+G+D) |
| Buffer đến deadline | ~92h |

---

## 6. Non-Critical Tasks (Có Float/Slack)

| Task | Float | Có thể delay tối đa | Ghi chú |
|------|-------|---------------------|---------|
| G (Seed 30 jobs) | 0h | ✅ Done | Crawled 8 TopCV + merged 36 jobs |
| H (Behavior tracking) | 0.08h | 5 phút | Cần cho I, J |
| I (User profile) | 0.08h | 5 phút | Cần cho K |
| J (Collaborative) | 0.08h | 5 phút | Có thể cắt nếu chậm tiến độ |
| C (postJob embed) | 1.41h | 85 phút | Không blocking |

---

## 7. Recommended Execution Order (2-Phase)

### Phase 1 — Song song (Ngay bây giờ, không chờ OPENAI_API_KEY)

| Step | Task | Người làm |
|------|------|-----------|
| P1.1 | G: Seed 30 jobs (dùng data cứng, không embed) | Khiem |
| P1.2 | H: User behavior tracking API | Khiem |

> Lý do: G và H không cần OPENAI_API_KEY, đều có float lớn, làm xong sớm để unblock I+J.

### Phase 2 — Critical path (Khi có OPENAI_API_KEY)

| Step | Task | Duration |
|------|------|----------|
| P2.1 | A: Install openai + set key | 0.10h |
| P2.2 | B: embeddingService.js | 0.50h |
| P2.3 | D: seedEmbeddings.js | 0.33h |
| P2.4 | E: Atlas Vector Search Index | 0.25h |
| P2.5 | F: recommend-content API | 1.00h |
| P2.6 | I → J → K → L → M | 7.84h |

---

## 8. Rủi ro & Mitigation

| Rủi ro | Impact | Hành động |
|--------|--------|-----------|
| ~~`OPENAI_API_KEY` chưa có~~ | ~~Block toàn bộ B→M~~ | ✅ Key đã có, verified với tiếng Việt 3072d |
| Atlas M0 không hỗ trợ Vector Search | Showstopper | Verify ngay sau E; fallback M10 trial. Current: M2 cluster, ready |
| OpenAI rate limit | Đã pass | Batch 25 jobs x 36, 0 fails |
| Còn ~4 ngày, critical path còn 8.08h | An toàn | Buffer >90h |
| Collaborative filtering (J) phức tạp | Float 0.08h | Có thể cắt J nếu chậm |

---

## 9. Summary

```
Project duration:    10.18h total (8.08h critical path remaining)
Completed:            2.10h (A+B+C+G+D)
                      - A: Install openai + key
                      - B: embeddingService.js (3072d)
                      - C: postJob auto-embed
                      - G: Seed 36 jobs (8 crawled TopCV + 28 hardcoded) + 11 companies + 10 users
                      - D: seedEmbeddings — 36/36 jobs embedded
Available time:      99h (4.1 days to deadline)
Working buffer:      91h

Task status:         5/13 done
Next task:           E (Atlas Vector Search Index) — critical path blocker
Parallel task:       H (User behavior tracking) — float 0.08h, can run in parallel with E+F
Critical blockers:   NONE — M2 cluster confirmed, 36 vectors in DB
```
