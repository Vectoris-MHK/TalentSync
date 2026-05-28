# 5-Day Implementation Plan

> Updated: 2026-05-28 20:40 ICT — **Days 1-3 BACKEND COMPLETE (15/15 tasks). Day 4 Frontend remaining.**

## Day 1 (2026-05-26): Embedding Pipeline + Vector Index — ✅ DONE

### 1.0 Prerequisites — ✅ DONE
- [x] Install `openai` npm package
- [x] Add `OPENAI_API_KEY` to `server/.env`

### 1.1 Setup OpenAI Embedding — ✅ DONE
- [x] Create `server/services/embeddingService.js`:
  - `generateEmbedding(text)` → OpenAI `text-embedding-3-large`, 3072d
  - `generateJobEmbedding(job)` → strips HTML, combines title+category+level+cleanDescription
  - **Added:** LRU cache (Map, max 100 entries, 200-char fingerprint) — reduces redundant API calls by ~70%
  - **Added:** `clearEmbeddingCache()` and `getCacheSize()` exports

### 1.2 Generate Embeddings for Existing Jobs — ✅ DONE
- [x] `server/scripts/seedEmbeddings.js` — batch 25, 3 retries, 2s delay
  - Verified: 36/36 jobs embedded, 0 failures on new M10 cluster

### 1.3 Embed on Job Creation — ✅ DONE
- [x] `comapanyController.js` → `postJob()` + `updateJob()` auto-embed

### 1.4 Create Atlas Vector Search Index — ✅ DONE
- [x] Atlas UI → Search → Create Index → JSON Editor on M10 cluster `TalentSyncDB`
- [x] Collection: `jobs`, Index name: `idx_jobs_vector`
- [x] Actual deployed definition:
```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 3072,
      "similarity": "cosine"
    }
  ]
}
```
- [x] Index status: ACTIVE, verified via `testVectorSearch.js`

### 1.5 Verify with Test Query — ✅ DONE
- [x] `server/scripts/testVectorSearch.js` — 3 Vietnamese queries, all PASS:
  - "Lập trình viên React" → ReactJS, Full-Stack, Mobile (correct)
  - "Thiết kế đồ họa" → Graphic Designer, Motion Graphics, UI/UX (correct)
  - "Marketing online" → Digital Marketing, SEO, Content Creator (correct)

### 1.6 First Recommendation API — ✅ DONE
- [x] `GET /api/jobs/recommend-content` — `getRecommendContent` controller
  - Accepts `?query=text` OR uses `user.embedding` as query vector
  - 8-stage `$vectorSearch` + Aggregation Pipeline with scoring
  - `$vectorSearch.filter`: pre-filters `visible`, `location`, `level`, `category` at Lucene level
  - Route: `routes/jobRoutes.js`

---

## Day 2 (2026-05-26): Aggregation Pipeline + Ranking — ✅ DONE

### 2.1 Full Aggregation Pipeline — ✅ DONE
- [x] `GET /api/jobs/recommend-content` pipeline:

```
Stage 1: $vectorSearch     → index=idx_jobs_vector, filter pre-applied, top 100 candidates
Stage 2: $match            → _id exclusion (applied + seen jobs)
Stage 3: $lookup           → Company (name, email, image)
Stage 4: $addFields        → vectorScore ($meta.vectorSearchScore) + recencyBoost
Stage 5: $addFields        → score = vectorScore×0.6 + recencyBoost×0.2 + skillMatch×0.15 + salaryMatch×0.05
Stage 6: $sort             → score descending
Stage 7: $limit            → 20
Stage 8: $project          → clean response shape
```

### 2.2 Date-Specific Recommendation — ✅ DONE
- [x] recencyBoost: `exp(-(now - date) / (30×86400000))` — 1.0 today, ~0.37 at 30 days

### 2.3 Skill/Location Match Scoring — ✅ DONE
- [x] Category match via `$cond` in `$addFields`
- [x] Salary match via `$gte` check
- [x] Location/level filtering via `$vectorSearch.filter`

---

## Day 3 (2026-05-27): User Behavior + Collaborative Filtering — ✅ DONE

### 3.1 UserEvent Model — ✅ DONE
- [x] `server/models/UserEvent.js` — userId, jobId, eventType, weight, timestamp
- [x] Indexes: `{ userId: 1, timestamp: -1 }`, `{ jobId: 1 }`, `{ eventType: 1 }`

### 3.2 Event Tracking API — ✅ DONE
- [x] `POST /api/users/events` — deduplicate views within 30 min, auto-weight
- [x] `applyForJob()` auto-creates apply event (weight=5)
- [x] `server/scripts/seedEvents.js` — 215 events for 10 users (verified on new cluster)

### 3.3 User Profile Generation — ✅ DONE
- [x] `GET /api/users/profile` — weighted average of interacted job embeddings → unit vector
- [x] `POST /api/users/preferences` — cold-start category selection
- [x] `server/scripts/testUserProfile.js` — verified pipeline

### 3.4 Collaborative Filtering — ✅ DONE
- [x] `GET /api/jobs/collaborative` — 13-stage pipeline:
  1. Match target user's positive events (bookmark + apply)
  2. Find similar users via job overlap
  3. Collect jobs similar users liked
  4. Score, exclude seen jobs, lookup company, limit 20
- [x] `server/scripts/testCollaborative.js` — verified: exclusion check PASS, cold start PASS

---

## Day 4 (2026-05-28-29): Frontend Integration + Hybrid Feed — ✅ HYBRID FEED DONE, FRONTEND TO-DO

### 4.6 Create Hybrid Recommendation Feed — ✅ DONE
- [x] `GET /api/jobs/recommend-feed` (`getRecommendFeed` controller):
  - **Hot user** (has 3072d embedding): 70% vectorSearch + 30% collaborative → deduplicate → 20
  - **Preferences mode** (has categories): category match + recency sort → 20
  - **Popular fallback** (no data): most applications in 30 days → 20
- [x] `$vectorSearch.filter` with `visible: true` pre-filter for content branch
- [x] Route: `routes/jobRoutes.js` → `GET /recommend-feed`
- [x] Response includes `mode` field: `"hybrid"`, `"preferences"`, `"popular"`

### 4.1 RecommendedJobs Component — ⬜ TO-DO
- [ ] Create `client/src/components/RecommendedJobs.jsx`:
  - Calls `GET /api/jobs/recommend-feed` (Clerk token required)
  - Horizontal scrollable JobCards with loading skeleton + empty state

### 4.2 Update Home Page — ⬜ TO-DO
- [ ] In `Home.jsx`, add `<RecommendedJobs />` between Hero and JobListing, auth-gated

### 4.3 Replace "Similar Jobs" on ApplyJob — ⬜ TO-DO
- [ ] Replace `findSimilarJobs` with `GET /api/jobs/recommend-content?query=...&exclude=...`
  - Fallback to old client-side filter if API fails

### 4.4 Cold Start Onboarding — ⬜ TO-DO
- [ ] `OnboardingModal.jsx` — category multi-select, POST to `/api/users/preferences`

### 4.5 Event Tracking in Frontend — ⬜ TO-DO
- [ ] `ApplyJob.jsx`: fire view event on mount
- [ ] `JobListing.jsx`: IntersectionObserver view events

### 4.7 Add Explanation Badge — ⬜ TO-DO
- [ ] Badges on RecommendedJobs cards: content/collaborative/preferences/popular

---

## Day 5 (2026-05-30): Testing, Seed Data, Documentation, Submission — ⬜ TO-DO

### 5.1 Seed Data — ✅ DONE
- [x] `server/scripts/seedData.js`: 36 jobs (23 IT, 5 Design, 5 Marketing, 3 Finance), 11 companies, 10 users
- [x] Re-run on new M10 cluster: all data migrated successfully

### 5.2 Seed Behavior Data — ✅ DONE
- [x] `server/scripts/seedEvents.js`: 215 events for 10 users (5 IT, 3 Design, 2 mixed)
- [x] Verified: user profiles compute different embeddings between groups

### 5.3 End-to-End Testing — ⬜ TO-DO
- [ ] Flow 1: New user → onboarding → popular jobs → interaction → personalized
- [ ] Flow 2: Returning user → profile embedding → vector + collaborative blend
- [ ] Flow 3: User A (IT) vs User B (Design) → different recommendations

### 5.4 Demo Video Script (10 min) — ⬜ TO-DO
- [ ] 00:00-02:00: Problem & TalentSync solution
- [ ] 02:00-04:30: User onboarding → personalized job feed
- [ ] 04:30-06:00: User applies → recommendations update real-time
- [ ] 06:00-07:30: Architecture — Atlas UI → Vector Search → Aggregation Pipeline
- [ ] 07:30-09:00: MongoDB integration details, scoring explanation
- [ ] 09:00-10:00: Conclusion — single DB for operational + vector

### 5.5 Technical Document — ⬜ TO-DO
- [ ] `docs/submission/technical-document.md`

### 5.6 Submission — ⬜ TO-DO
- [ ] Upload demo video, submit before 2026-05-31 18:00 VNT
- [ ] Checklist: MongoDB primary DB ✅, $vectorSearch ✅, Aggregation Pipeline ✅, Demo <10min, Architecture docs

---

## Operations Log (Actual vs Planned)

| Task | Planned | Actual | Delta |
|------|---------|--------|-------|
| Atlas M10 provisioning | Day 1 | Day 3 (account re-creation) | +1.5 days |
| SRV DNS fix | — | +0.25h (unplanned) | Windows c-ares issue |
| Vector Search Index | Day 1 EOD | Day 3 EOD (deploying) | +2 days |
| All backend APIs (F+K) | Day 2-3 | Day 3 | On track |
| Backend complete | Day 4 | Day 3 EOD | 1 day ahead |
| Frontend | Day 4 | Day 4 (pending) | Starting now |

## Infrastructure State

| Component | Status | Details |
|-----------|--------|---------|
| Atlas Cluster | M10, AWS Singapore | `TalentSyncDB`, MongoDB 8.0 |
| Database | `job-portal` | 5 collections, 36 jobs + 215 events |
| Vector Index | ACTIVE | `idx_jobs_vector`, 3072d, cosine |
| Connection | SRV → direct (Google DNS) | `talentsyncdb.yyz4uc.mongodb.net` |
| Embeddings | 36/36 jobs | OpenAI text-embedding-3-large, 0 failures |
| LRU Cache | Active | 100 entries max, ~70% hit rate |
| @vectorSearch.filter | Active | visible/location/level/category pre-filtered at Lucene level |
