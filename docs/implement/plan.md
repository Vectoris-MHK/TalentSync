# 5-Day Implementation Plan

## Day 1 (Today): Embedding Pipeline + Vector Index

### 1.0 Prerequisites
- [ ] Install `openai` npm package: `pnpm --filter server add openai`
- [ ] Add `OPENAI_API_KEY` to `server/.env` (get from https://platform.openai.com/api-keys)

### 1.1 Setup OpenAI Embedding
- [ ] Create `server/services/embeddingService.js`:
  - `generateEmbedding(text)` → calls OpenAI `text-embedding-3-large`, returns `Float32Array` (3072d)
  - `generateJobEmbedding(job)` → combines `title + strippedDescription + category + level`, embed
  - Strip HTML from description before embedding
  - **Important:** Input text is Vietnamese — `text-embedding-3-large` has best multilingual Vietnamese quality

### 1.2 Generate Embeddings for Existing Jobs
- [ ] Create `server/scripts/seedEmbeddings.js`:
  - Fetch all jobs where `embedding` is empty/missing
  - Batch generate embeddings (50 at a time, rate limit safe)
  - Update each document with `$set: { embedding }`
  - Run: `node server/scripts/seedEmbeddings.js`

### 1.3 Embed on Job Creation
- [ ] Modify `comapanyController.js` → `postJob()`:
  - After job save, call `generateJobEmbedding(job)`
  - `job.embedding = embeddingArray`
  - `await job.save()`

### 1.4 Create Atlas Vector Search Index
- [ ] Go to Atlas UI → Search → Create Search Index → JSON Editor
- [ ] Select `jobs` collection
- [ ] Define:
```json
{
  "mappings": {
    "dynamic": false,
    "fields": {
      "embedding": {
        "type": "knnVector",
        "dimensions": 3072,
        "similarity": "cosine"
      }
    }
  }
}
```
- [ ] Wait for index build to complete

### 1.5 Verify with Test Query
- [ ] Create `server/scripts/testVectorSearch.js`
- [ ] Generate embedding for test query ("React developer with 3 years experience")
- [ ] Run `$vectorSearch` aggregation
- [ ] Verify results return (even if quality is low with small dataset)

### 1.6 First Recommendation API
- [ ] Create `GET /api/jobs/recommend-content`
  - Accept `?query=text` or use user profile embedding
  - `$vectorSearch` → top 100 candidates
  - `$lookup` Company (name, image)
  - `$project` exclude password, limit fields
  - `$limit` 20
  - Return ranked results

**Verify:** Can run vector search from Atlas Compass or API call → returns job results.

---

## Day 2: Aggregation Pipeline + Ranking

### 2.1 Full Aggregation Pipeline
- [ ] Extend `GET /api/jobs/recommend-content` with pipeline stages:

```
Stage 1: $vectorSearch     → top 100 candidates by semantic similarity
Stage 2: $match            → visible: true, (optional: location, level, category)
Stage 3: $lookup           → join companies collection (name, image, email)
Stage 4: $addFields        → compute score fields:
  recencyBoost = exp(-(now - date) / (30 * 86400000))  // 30-day decay
  score = { $add: [
    { $multiply: [{ $meta: "vectorSearchScore" }, 0.6] },
    { $multiply: ["$recencyBoost", 0.2] },
    { $multiply: ["$skillMatchScore", 0.15] },
    { $multiply: ["$salaryScore", 0.05] }
  ]}
Stage 5: $match            → _id NOT in user's applied job IDs
Stage 6: $sort             → score descending
Stage 7: $limit            → 20
Stage 8: $project          → clean response shape
```

### 2.2 Date-Specific Recommendation
- [ ] Add `recencyBoost` calculation:
  - `exp(-(Date.now() - date) / (30 days in ms))` = 1.0 for today, ~0.37 at 30 days
  - Normalize to 0-1 range

### 2.3 Skill/Location Match Scoring
- [ ] Strip location names to lowercase for matching
- [ ] Category matching: exact match = 1.0, else 0
- [ ] Add as `$switch` or `$cond` in `$addFields`

**Verify:** API returns 20 jobs sorted by score, different results for different queries.

---

## Day 3: User Behavior + Collaborative Filtering

### 3.1 UserEvent Model
- [ ] Create `server/models/UserEvent.js`:
```js
{
  userId: { type: String, required: true, ref: "User" },
  jobId: { type: ObjectId, required: true, ref: "Job" },
  eventType: { type: String, enum: ["search", "view", "bookmark", "apply"], required: true },
  weight: { type: Number, default: 1 },
  timestamp: { type: Number, required: true }
}
```
- [ ] Create indexes: `{ userId: 1, timestamp: -1 }`, `{ jobId: 1 }`

### 3.2 Event Tracking API
- [ ] `POST /api/users/events` — record view/bookmark events
  - Deduplicate: no duplicate view events within 30 minutes
  - Auto-compute weight: search=4, view=1, bookmark=3, apply=5
- [ ] Modify `applyForJob()` in `userController.js` to also create `userEvent` with type "apply"
- [ ] Frontend: add `useEffect` in `ApplyJob.jsx` and `JobListing.jsx` to fire view events on page load

### 3.3 User Profile Generation
- [ ] `GET /api/users/profile` — compute user embedding vector:
```
Pipeline:
  1. $match: UserEvent where userId = req.auth.userId
  2. $group by jobId, sum weights
  3. $sort by sum weight desc
  4. $limit 50  // top 50 interacted jobs
  5. $lookup: jobs collection, get embeddings
  6. Compute weighted average of all job embeddings
     → normalize to unit vector
```
- [ ] Save result to `user.embedding`
- [ ] Return computed profile to client

### 3.4 Collaborative Filtering
- [ ] Create `GET /api/jobs/collaborative` pipeline:
```
Step 1: $match UserEvent → target user's events (positive interactions)
Step 2: $lookup UserEvent → find other users who interacted with same jobs
Step 3: $group by userId → "similar users"
Step 4: $lookup UserEvent again → get jobs liked by similar users
Step 5: $group by jobId, count interactions, sum weights
Step 6: $lookup jobs → get full job data (+ embeddings)
Step 7: $match → exclude already seen/applied jobs
Step 8: $sort by interaction score desc
Step 9: $limit 20
```

**Verify:** Different users get different collaborative recommendations based on their interaction history.

---

## Day 4: Frontend Integration

### 4.1 RecommendedJobs Component
- [ ] Create `client/src/components/RecommendedJobs.jsx`:
  - Calls `GET /api/jobs/recommend-feed`
  - Shows "Recommended For You" section header
  - Renders JobCard components horizontally scrollable
  - Loading skeleton state
  - Empty state: "Complete your profile to get recommendations"

### 4.2 Update Home Page
- [ ] In `Home.jsx`, add `<RecommendedJobs />` section:
  - Appears between Hero and JobListing sections
  - Only shown when user is authenticated (Clerk)
  - Not shown for recruiter/company users

### 4.3 Replace "Similar Jobs" on ApplyJob
- [ ] In `ApplyJob.jsx`, replace `findSimilarJobs` client-side filter with:
  - API call to `GET /api/jobs/recommend-content?query=[job.title]&exclude=[currentJobId]`
  - Fallback to `findSimilarJobs` if API fails

### 4.4 Cold Start Onboarding
- [ ] Create `client/src/components/OnboardingModal.jsx`:
  - Shown on first login (check `user.preferences` is empty)
  - Category multi-select: Programming, Design, Marketing, Finance, Management, etc.
  - "Skip for now" option → defaults to popular jobs
  - On submit: `POST /api/users/preferences { preferences: ["Programming", "Design"] }`

### 4.5 Event Tracking in Frontend
- [ ] `ApplyJob.jsx`: fire view event on mount
- [ ] `JobListing.jsx`: fire view events when job cards enter viewport (IntersectionObserver)
- [ ] `RecommendedJobs.jsx`: fire view events on job card click

### 4.6 Create Hybrid Recommendation Feed
- [ ] `GET /api/jobs/recommend-feed`:
```
If user.embedding exists:
  → $vectorSearch with user.embedding  (70% weight)
  → Intersperse collaborative results (30% weight)
  → Deduplicate
  → Return blended list
Else (cold start):
  → If user.preferences exists:
    → $match category in preferences + $sort by date desc
  → Else:
    → Popular jobs (most applications in last 30 days)
```

### 4.7 Add Explanation Badge
- [ ] On each JobCard in recommended feed, show a small badge:
  - "Matches your skills"
  - "Similar to jobs you viewed"
  - "Popular in your category"
  - "Based on your preferences"

**Verify:** Complete recommendation flow works: user onboard → sees recommendations → interacts → recommendations improve.

---

## Day 5: Testing, Seed Data, Documentation, Submission

### 5.1 Seed Data
- [ ] Crawl data mẫu từ TopCV làm input:
  - Target: tối thiểu 30 jobs tiếng Việt across categories (IT, Design, Marketing, Finance, Management)
  - Thu thập: title, description, location, category, level, salary range, company name
  - Output: JSON/Array dump → làm input cho `seedData.js`
- [ ] Create `server/scripts/seedData.js`:
  - Load crawled data → map vào schema → insert vào MongoDB
  - 30 jobs across categories (15 IT, 5 Design, 5 Marketing, 3 Finance, 2 Management)
  - **Job titles + descriptions must be in Vietnamese** (target audience is Vietnamese)
  - 3 companies (gộp theo company name từ crawl data)
  - 10 users with Clerk-mocked IDs (for testing)
  - Executable from `node server/scripts/seedData.js`

### 5.2 Seed Behavior Data
- [ ] Create `server/scripts/seedEvents.js`:
  - 5 IT-focused users (view/apply IT jobs)
  - 3 Design-focused users (view/apply design jobs)
  - 2 mixed-interest users
  - ~100 events total
  - Verifiable: run `GET /api/users/profile` → embeddings differ between user groups

### 5.3 End-to-End Testing
- [ ] Start server + Atlas, seed all data
- [ ] Test flow 1: New user → onboarding → popular jobs → interaction → personalized
- [ ] Test flow 2: Returning user → profile embedding → content-based recommendations
- [ ] Test flow 3: User A (IT) vs User B (Design) → different recommendations
- [ ] Verify aggregation pipeline stages working (check Atlas profiler)
- [ ] Verify vector search index healthy

### 5.4 Demo Video Script (10 min)
- [ ] **00:00-02:00** — Problem introduction: job matching is broken, TalentSync solves it
- [ ] **02:00-04:30** — Demo: user onboarding → receives personalized job feed
- [ ] **04:30-06:00** — Demo: user applies to job → recommendations update in real-time
- [ ] **06:00-07:30** — Architecture: show Atlas UI → Vector Search index → Aggregation Pipeline
- [ ] **07:30-09:00** — Results: show MongoDB integration details, explain scoring
- [ ] **09:00-10:00** — Conclusion: why MongoDB (1 DB for operational + vector), next steps

### 5.5 Technical Document
- [ ] Write `docs/submission/technical-document.md` (Vietnamese or English):
  1. MVP Description
  2. System Architecture (Mermaid diagram or image)
  3. Data Schema (all 5 collections with fields + types + indexes)
  4. Embedding Pipeline (model, dimensions, generation flow)
  5. Vector Search Configuration (index definition, query params, numCandidates)
  6. Aggregation Pipeline (all stages explained)
  7. Recommendation Flow (content-based + collaborative + hybrid blending)
  8. Cold Start Strategy
  9. Sample Data Overview

### 5.6 Submission
- [ ] Upload video to YouTube (unlisted) or Google Drive
- [ ] Create GitHub release or tag
- [ ] Verify README is submission-ready
- [ ] Double-check checklist: Vector Search ✅, Aggregation Pipeline ✅, MongoDB ✅, Demo ✅, Docs ✅
- [ ] Submit via form before 18:00 31/05/2026

---

## Fallback Plan (If Falling Behind)

| Scenario | Action |
|---|---|
| Day 1 incomplete by Day 1 | Cut to Day 1 PM — move collaborative filtering to post-submission |
| Day 3 incomplete by Day 3 | Cut collaborative filtering entirely — submit content-based only |
| Atlas M0 doesn't support Vector Search | Immediately upgrade to M10 (free trial) |
| Embedding API costs too high | Switch to OpenAI `text-embedding-3-small` (note: 1536d requires index rebuild) |
| Frontend too complex | Skip explanatory badges, skip IntersectionObserver tracking |
