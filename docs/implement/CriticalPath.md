# Critical Path Method — TalentSync MongoHack 2026

> Generated: 2026-05-27 10:57 ICT
> Updated: 2026-05-27 11:27 ICT
> Deadline: 2026-05-31 18:00 ICT (103h còn lại)
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
| D | `server/scripts/seedEmbeddings.js` | 0.33 | B | 4.1 | ⬜ Pending |
| E | Tạo Atlas Vector Search Index `idx_jobs_vector` | 0.25 | D | 4.2 | ⬜ Pending |
| F | `GET /api/jobs/recommend-content` (8-stage pipeline) | 1.00 | B, E | 4.3 | ⬜ Pending |
| G | Seed 30 jobs tiếng Việt | 0.67 | A | 3.2 | ⬜ Pending |
| H | User behavior tracking (POST /events + sửa apply) | 0.50 | — (UserEvent done) | 5.1 | ⬜ Pending |
| I | User profile embedding + preferences API | 0.67 | H | 5.2 | ⬜ Pending |
| J | Collaborative filtering API | 0.67 | H | 5.3 | ⬜ Pending |
| K | Hybrid feed API `GET /api/jobs/recommend-feed` | 0.33 | F, I, J | 5.4 | ⬜ Pending |
| L | Frontend (RecommendedJobs + Onboarding + event tracking) | 1.50 | K | 6.1 | ⬜ Pending |
| M | E2E test + technical doc + demo video | 5.00 | L | 6.2-6.3 | ⬜ Pending |

**Total work:** 11.81h (có thể parallel, thực tế ~9h critical path)

---

## 3. Forward Pass (Earliest Start / Earliest Finish)

| ID | ES (h) | EF (h) | Tính toán |
|----|--------|--------|-----------|
| A | 0.00 | 0.77 | ✅ Done (actual: A+B+C = 0.77h) |
| B | 0.00 | 0.60 | ✅ Done |
| C | 0.60 | 0.77 | ✅ Done |
| H | 0.77 | 1.27 | ES = now (0.77) |
| G | 0.77 | 1.44 | ES = now (0.77) |
| D | 0.77 | 1.10 | ES = now (0.77) |
| I | 1.27 | 1.94 | ES = EF(H) |
| J | 1.27 | 1.94 | ES = EF(H) |
| E | 1.10 | 1.35 | ES = EF(D) |
| **F** | **1.35** | **2.35** | **ES = max(EF(B)=0.77, EF(E)=1.35)** |
| **K** | **2.35** | **2.68** | **ES = max(EF(F)=2.35, EF(I)=1.94, EF(J)=1.94)** |
| **L** | **2.68** | **4.18** | **ES = EF(K)** |
| **M** | **4.18** | **9.18** | **ES = EF(L)** |

---

## 4. Backward Pass (Latest Start / Latest Finish)

| ID | LF (h) | LS (h) | Tính toán |
|----|--------|--------|-----------|
| M | 9.18 | 4.18 | LF = EF(M) |
| L | 4.18 | 2.68 | LF = LS(M) |
| K | 2.68 | 2.35 | LF = LS(L) |
| F | 2.35 | 1.35 | LF = LS(K) |
| E | 1.35 | 1.10 | LF = LS(F) |
| D | 1.10 | 0.77 | LF = LS(E) |
| I | 2.35 | 1.68 | LF = LS(K), float=0.41h |
| J | 2.35 | 1.68 | LF = LS(K), float=0.41h |
| H | 1.68 | 1.18 | LF = min(LS(I), LS(J)), float=0.41h |
| C | 2.35 | 2.18 | LF = LS(F), float=1.41h |
| B | 0.77 | 0.27 | LF = min(LS(C)=2.18, LS(D)=0.77, LS(F)=1.35) |
| G | 9.18 | 8.51 | LF = LS(M), float=7.74h |
| A | 0.77 | 0.67 | LF = min(LS(B)=0.27, LS(G)=8.51) |

---

## 5. Critical Path (Updated)

> **A, B, C completed at 0.77h. Critical path now runs from D forward.**

```
D ──→ E ──→ F ──→ K ──→ L ──→ M
```

| Step | Task | ES | EF | Duration |
|------|------|----|----|----------|
| **Done** | A+B+C: Install, embedService, postJob | 0.00 | 0.77 | 0.77h |
| 1 | D: seedEmbeddings.js | 0.77 | 1.10 | 0.33h |
| 2 | E: Atlas Vector Search Index | 1.10 | 1.35 | 0.25h |
| 3 | F: recommend-content API | 1.35 | 2.35 | 1.00h |
| 4 | K: Hybrid feed API | 2.35 | 2.68 | 0.33h |
| 5 | L: Frontend components | 2.68 | 4.18 | 1.50h |
| 6 | M: E2E test + docs + video | 4.18 | 9.18 | 5.00h |

| Metric | Value |
|--------|-------|
| Tổng critical path còn lại | **8.41 giờ** |
| Đã hoàn thành | 0.77h (A+B+C) |
| Số ngày làm việc (5h/ngày) | ~1.7 ngày còn lại |
| Buffer đến deadline | 103h - 8.41h = **94.6h dư** |

---

## 6. Non-Critical Tasks (Có Float/Slack)

| Task | Float | Có thể delay tối đa | Ghi chú |
|------|-------|---------------------|---------|
| G (Seed 30 jobs) | 8.24h | Gần như không giới hạn | Nên làm sớm để có data test |
| H (Behavior tracking) | 0.51h | 30 phút | Cần cho I, J |
| I (User profile) | 0.34h | 20 phút | Cần cho K |
| J (Collaborative) | 0.34h | 20 phút | Có thể cắt nếu chậm tiến độ |
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
| Atlas M0 không hỗ trợ Vector Search | Showstopper | Verify ngay sau E; fallback M10 trial |
| OpenAI rate limit khi seed embedding | Chậm E | Batch size 25, exponential backoff |
| Còn <4 ngày, critical path còn 8.41h | An toàn | Buffer 94.6h thoải mái |
| Collaborative filtering (J) phức tạp | Float chỉ 0.41h | Có thể cắt J nếu chậm |

---

## 9. Summary

```
Project duration:   9.18h total (8.41h critical path remaining)
Completed:           0.77h (A+B+C: install, embedService, postJob auto-embed)
Available time:     103h (4.3 days × 24h)
Working buffer:     94.6h

Task status:        3/13 done, 4 schema complete (Job, User, UserEvent added), 1 verified (embedding)
Next task:          G (Seed 30 jobs) + D (seedEmbeddings) — can run in parallel
Critical blockers:  NONE — unblocked, full speed ahead
```
