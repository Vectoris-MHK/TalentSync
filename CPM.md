# Critical Path Method — TalentSync MongoHack 2026

> Generated: 2026-05-28 16:30 ICT
> Updated: 2026-05-28 18:38 ICT **(Phase 1+2 DONE — E is active blocker)**
> Deadline: 2026-05-31 18:00 ICT (~71.4h còn lại)
> Elapsed this session: ~2h (R1→R4 + SRV DNS fix)
> Working hours: ~5h/ngày ≈ 15h thực tế còn lại

---

## 0. Context Change: Atlas Restart (COMPLETED)

**New cluster:** M10, $50 credit, operational
**Data:** 11 companies, 36 jobs (3072d embedded), 10 users, 215 events — all seeded

**SRV DNS Fix (resolved):** Node.js DNS (c-ares) on Windows failed `querySrv ECONNREFUSED` for all non-39cwlbk hostnames. Fixed by forcing Google/Cloudflare DNS servers in `resolveSrv.js` and `config/db.js`. Also fixed `appName` query param handling in URI builder.

---

## 1. Task Network

```
✅ R1→R2→R3→R4.1→R4.2→R4.3 (ALL DONE — 2.0h actual)
                              │
                              ▼
        E(0.33) ──→ T(0.17) ──→ F(1.0) ──→ K(0.5) ──→ L(2.0) ──→ M(5.0)
              (F can be coded in parallel — only needs E for runtime)
```

---

## 2. Task List with Dependencies & Duration

| ID          | Task                                                             | Duration (h) | Dependencies          | Epic    | Status          |
| ----------- | ---------------------------------------------------------------- | ------------ | --------------------- | ------- | --------------- |
| R1          | Create M10 cluster + DB user + network access + get URI          | 0.33         | —                    | 2       | ✅ Done         |
| R2          | Update `server/.env` MONGODB_URI                               | 0.08         | R1                    | 2       | ✅ Done         |
| R3          | Refactor 5 scripts: hardcoded URI →`process.env.MONGODB_URI`  | 0.17         | R2                    | 2       | ✅ Done         |
| R3.1        | SRV DNS fix: force Google DNS + fix URLSearchParams              | 0.25         | R3                    | 2       | ✅ Done         |
| R4.1        | Re-run `seedData.js` (11 companies, 36 jobs, 10 users)         | 0.17         | R3.1                  | 3.2     | ✅ Done         |
| R4.2        | Re-run `seedEmbeddings.js` (36/36 embedded, 0 fails)           | 0.33         | R4.1                  | 3.2     | ✅ Done         |
| R4.3        | Re-run `seedEvents.js` (215 events, 10 users)                  | 0.17         | R4.1                  | 3.2     | ✅ Done         |
| B           | `embeddingService.js`                                          | 0.50         | —                    | 4.1     | ✅ Done         |
| C           | Auto-embed on postJob()                                          | 0.17         | B                     | 4.1     | ✅ Done         |
| H           | User behavior tracking API                                       | 0.50         | —                    | 5.1     | ✅ Done         |
| I           | User profile embedding + preferences API                         | 0.67         | H                     | 5.2     | ✅ Done         |
| J           | Collaborative filtering API                                      | 0.67         | H                     | 5.3     | ✅ Done         |
| **E** | **Atlas Vector Search Index `idx_jobs_vector`**          | 0.33         | R4.2                  | 4.2     | ⬜ To-Do        |
| **T** | **Create + run `testVectorSearch.js`**                   | 0.17         | E (runtime), B (code) | 4.2     | 🔶 Can code now |
| **F** | **`GET /api/jobs/recommend-content` (8-stage pipeline)** | 1.00         | E (runtime), B (code) | 4.3     | 🔶 Can code now |
| **K** | **`GET /api/jobs/recommend-feed` (hybrid blender)**      | 0.50         | F, I, J               | 5.4     | ⬜ Pending      |
| **L** | **Frontend (RecommendedJobs + Onboarding + tracking)**     | 2.00         | K                     | 6.1     | ⬜ Pending      |
| **M** | **E2E test + technical doc + demo video**                  | 5.00         | L                     | 6.2-6.3 | ⬜ Pending      |

---

## 3. Forward Pass (Earliest Start / Earliest Finish)

| ID          | ES (h)         | EF (h)          | Notes                                                       |
| ----------- | -------------- | --------------- | ----------------------------------------------------------- |
| R1→R4.3    | 0.00           | 1.50            | ✅ Actual: ~2h (included SRV DNS debugging)                 |
| E           | 1.50           | 1.83            | Atlas ClickOps (can do T + F code in parallel)              |
| T           | 1.83           | 2.00            | testVectorSearch runtime (relies on E)                      |
| **F** | **1.83** | **2.83**  | **F code can start now — only runtime depends on E** |
| **K** | **2.83** | **3.33**  | **Hybrid feed (needs F done + I/J done)**             |
| **L** | **3.33** | **5.33**  | **Frontend**                                          |
| **M** | **5.33** | **10.33** | **E2E test + docs + video**                           |

> **Parallel strategy:** T and F code can be written NOW while waiting for E (Atlas ClickOps). Only their runtime tests need E.

---

## 4. Critical Path

```
E ──→ T ──→ F ──→ K ──→ L ──→ M
```

| Step | Task                                                        | ES   | EF    | Duration |
| ---- | ----------------------------------------------------------- | ---- | ----- | -------- |
| 1    | E: Atlas Vector Search Index idx_jobs_vector                | 1.50 | 1.83  | 0.33h    |
| 2    | T: testVectorSearch.js + verify                             | 1.83 | 2.00  | 0.17h    |
| 3    | F: recommend-content API ($vectorSearch + 8-stage pipeline) | 2.00 | 3.00  | 1.00h    |
| 4    | K: recommend-feed hybrid blender API                        | 3.00 | 3.50  | 0.50h    |
| 5    | L: Frontend (RecommendedJobs + Onboarding + tracking)       | 3.50 | 5.50  | 2.00h    |
| 6    | M: E2E test + technical doc + demo video                    | 5.50 | 10.50 | 5.00h    |

| Metric                     | Value                                                |
| -------------------------- | ---------------------------------------------------- |
| Elapsed (actual)           | ~2.0h (R1→R4 + SRV DNS debugging)                   |
| Critical path remaining    | **8.67h** (from 1.83h mark = E→T→F→K→L→M) |
| Working buffer to deadline | ~69h                                                 |
| Deadline risk              | **LOW** — 69h buffer vs 8.67h remaining work  |

---

## 5. Non-Critical Tasks (Float)

| Task                   | Float | Notes                                               |
| ---------------------- | ----- | --------------------------------------------------- |
| R3.1 (SRV DNS fix)     | 0h    | ✅ Done — unblocked everything                     |
| F code (can start now) | 0h    | Write code while E is pending; runtime test after E |
| T code (can start now) | 0h    | Write code while E is pending; runtime test after E |
| B, C, H, I, J          | ∞    | Done — no changes needed                           |

---

## 6. Execution Order (2 Parallel Tracks + 2 Phases)

### Track A — Atlas ClickOps (waiting on you)

| Step | Task                                                               | Duration |
| ---- | ------------------------------------------------------------------ | -------- |
| E    | Create Vector Search Index via Atlas UI (see browser agent prompt) | 0.33h    |

### Track B — Code (I can do NOW in parallel)

| Step | Task                                                          | Duration | Can test after E? |
| ---- | ------------------------------------------------------------- | -------- | ----------------- |
| T    | Create `server/scripts/testVectorSearch.js`                 | 0.17h    | Yes               |
| F    | Create `GET /api/jobs/recommend-content` controller + route | 1.00h    | Yes               |

### After Tracks A+B converge

| Step | Task                                                        | Duration |
| ---- | ----------------------------------------------------------- | -------- |
| K    | `GET /api/jobs/recommend-feed` hybrid blender             | 0.50h    |
| L    | Frontend (RecommendedJobs, OnboardingModal, event tracking) | 2.00h    |
| M    | E2E test (1.5h) + technical doc (1.5h) + demo video (2.0h)  | 5.00h    |

---

## 7. Rủi ro & Mitigation

| Rủi ro                                    | Impact                     | Mitigation                                               |
| ------------------------------------------ | -------------------------- | -------------------------------------------------------- |
| ~~SRV DNS fails for new cluster~~         | ~~Block all connections~~ | ✅ Fixed — force Google DNS + fix URI builder           |
| ~~IP whitelist blocks scripts~~           | ~~Block seeding~~         | ✅ 0.0.0.0/0 configured                                  |
| ~~OpenAI rate limit~~                     | ~~Slow embedding~~        | ✅ 36/36 embedded in 2 batches, 0 failures               |
| E: Atlas Search Index not available on M10 | Showstopper                | Verify M10 tier selected; M10 definitely supports search |
| Frontend complexity                        | Medium                     | Can cut explanation badges if late                       |
| Còn ~71h, critical path 8.67h             | LOW risk                   | Buffer ~69h                                              |

---

## 8. Summary

```
Project duration:    10.50h total (8.67h critical path remaining)
Completed this sess: R1+R2+R3+R3.1+R4.1+R4.2+R4.3 = ~2.0h actual
  - M10 cluster created, DB user + network + URI obtained
  - .env updated, 5 scripts refactored to use process.env.MONGODB_URI
  - SRV DNS fix: force Google DNS resolver + fix appName param
  - 36 jobs embedded (OpenAI text-embedding-3-large, 3072d)
  - 215 events for 10 users (5 IT + 3 Design + 2 mixed)
  - Server db.js auto-resolves SRV → direct connection
Code completed:      B+C+H+I+J+R3.1 = embedding + auto-embed + events + profile + collab + DNS fix
Blocker:             E (Atlas Vector Search Index — ClickOps needed)
Can do now:          F (recommend-content) + T (testVectorSearch) code in parallel
Available time:      71.4h (2.98 days to deadline)
Working buffer:      ~69h
```

## 9. What Changed Since Last CPM Update

| Change                             | Reason                                                                                  |
| ---------------------------------- | --------------------------------------------------------------------------------------- |
| **R1→R4 all ✅**            | Atlas restart completed: M10 cluster + re-seed runs succeeded                           |
| **+R3.1 SRV DNS fix**        | Node.js c-ares DNS fails non-39cwlbk hostnames on Windows; forced Google/Cloudflare DNS |
| **Critical path -1.41h**     | R1→R4 no longer on critical path (already done); E is now step 1                       |
| **Parallel coding possible** | F + T logic can be written independent of E (only runtime needs index)                  |
| **Buffer ~69h**              | 71.4h total - 2.0h elapsed = still extremely safe                                       |
