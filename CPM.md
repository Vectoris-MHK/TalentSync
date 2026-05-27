# Critical Path Method — TalentSync MongoHack 2026

> Generated: 2026-05-27 10:57 ICT
> Updated: 2026-05-27 16:52 ICT
> Deadline: 2026-05-31 18:00 ICT (~97h còn lại)
> Elapsed: 17h (thực hiện: A B C G D I + H seedEvents) / ~7h làm việc thực tế
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
| H | User behavior tracking (POST /events + sửa apply) | 0.50 | — (UserEvent done) | 5.1 | ✅ Done |
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
| A | 0.00 | 0.77 | ✅ Done (actual: A+B+C+G+D+I+H = 3.27h) |
| B | 0.00 | 0.60 | ✅ Done |
| C | 0.60 | 0.77 | ✅ Done |
| H | 2.77 | 3.27 | ✅ Done (logUserEvent + applyForJob + seedEvents 188events) |
| G | 0.77 | 1.44 | ✅ Done |
| D | 0.77 | 1.10 | ✅ Done |
| I | 2.77 | 3.44 | ✅ Done |
| J | 3.27 | 3.94 | ES = EF(H) |
| E | 3.27 | 3.52 | ES = now (3.27) |
| **F** | **3.52** | **4.52** | **ES = max(EF(B)=0.77, EF(E)=3.52)** |
| **K** | **4.52** | **4.85** | **ES = max(EF(F)=4.52, EF(I)=3.44, EF(J)=3.94)** |
| **L** | **4.85** | **6.35** | **ES = EF(K)** |
| **M** | **6.35** | **11.35** | **ES = EF(L)** |

---

## 4. Backward Pass (Latest Start / Latest Finish)

| ID | LF (h) | LS (h) | Tính toán |
|----|--------|--------|-----------|
| M | 11.35 | 6.35 | LF = EF(M) |
| L | 6.35 | 4.85 | LF = LS(M) |
| K | 4.85 | 4.52 | LF = LS(L) |
| F | 4.52 | 3.52 | LF = LS(K) |
| E | 3.52 | 3.27 | LF = LS(F) |
| D | 3.27 | 2.94 | LF = LS(E) |
| I | 3.44 | 2.77 | LF = min(LS(K)=4.52, EF(I)=3.44), float=0h |
| J | 4.52 | 3.85 | LF = LS(K), float=0.91h |
| H | 3.85 | 3.35 | LF = min(LS(I)=2.77, LS(J)=3.85), float=0h |
| C | 2.35 | 2.18 | LF = LS(F), float=1.41h |
| B | 0.77 | 0.27 | LF = min(LS(C)=2.18, LS(D)=0.77, LS(F)=1.35) |
| G | 9.18 | 8.51 | LF = LS(M), float=7.74h |
| A | 0.77 | 0.67 | LF = min(LS(B)=0.27, LS(G)=8.51) |

---

## 5. Critical Path (Updated)

> **A, B, C, G, D, H, I completed at 3.27h. Critical path now runs from E forward.**

```
E ──→ F ──→ K ──→ L ──→ M
```

| Step | Task | ES | EF | Duration |
|------|------|----|----|----------|
| **Done** | A+B+C+G+D+H+I: Setup, schema, seed, embedding, behavior, user profile | 0.00 | 3.27 | 3.27h |
| 1 | E: Atlas Vector Search Index | 3.27 | 3.52 | 0.25h |
| 2 | F: recommend-content API | 3.52 | 4.52 | 1.00h |
| 3 | K: Hybrid feed API | 4.52 | 4.85 | 0.33h |
| 4 | L: Frontend components | 4.85 | 6.35 | 1.50h |
| 5 | M: E2E test + docs + video | 6.35 | 11.35 | 5.00h |

| Metric | Value |
|--------|-------|
| Tổng critical path còn lại | **8.08 giờ** |
| Đã hoàn thành | 3.27h (A+B+C+G+D+H+I) |
| Buffer đến deadline | ~89h |

---

## 6. Non-Critical Tasks (Có Float/Slack)

| Task | Float | Có thể delay tối đa | Ghi chú |
|------|-------|---------------------|---------|
| G (Seed 30 jobs) | 0h | ✅ Done | Crawled 8 TopCV + merged 36 jobs |
| H (Behavior tracking) | 0h | ✅ Done | POST /events + apply auto-event + 188 seed events |
| I (User profile) | 0h | ✅ Done | Aggregation pipeline + unit vector normalization |
| J (Collaborative) | 0.91h | 55 phút | Float tăng nhờ H & I done sớm |
| C (postJob embed) | 1.91h | 115 phút | Không blocking |

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
Project duration:    11.35h total (8.08h critical path remaining)
Completed:            3.27h (A+B+C+G+D+H+I)
                      - A: Install openai + key
                      - B: embeddingService.js (3072d)
                      - C: postJob auto-embed
                      - G: Seed 36 jobs + 11 companies + 10 users
                      - D: seedEmbeddings — 36/36 jobs embedded
                      - H: POST /api/users/events + applyForJob auto-event + 188 seed events
                      - I: User profile embedding + preferences API (weighted avg, unit vec)
Available time:      97h (4.0 days to deadline)
Working buffer:      89h

Task status:         7/13 done
Next task:           E (Atlas Vector Search Index) — critical path blocker
Parallel task:       J (Collaborative filtering) — float 0.91h, can code without blocks
Critical blockers:   E requires Atlas UI (browser) to create Vector Search Index
```
