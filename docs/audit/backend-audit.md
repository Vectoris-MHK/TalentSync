# Backend Code Quality Audit Report

> Generated: 2026-05-28 21:18 ICT
> Purpose: Static reference for bug-fixing and code quality improvement
> Scope: `server/` — all controllers, models, middleware, services, scripts, config

---

## CRITICAL — Bugs & Logic Errors

### B1. `comapanyController.js:15,72,85` — Typo: `sucess` → `success`

**Files:** `server/controller/comapanyController.js`
**Lines:** 15, 72, 85

`registerCompany`, `loginCompany`, and `getCompanyData` return `{ sucess: true }` (missing second 'c'). The frontend checks `data.success`, so these endpoints silently appear to fail.

```js
// WRONG (line 15)
return res.json({ sucess: false, message: "All fields are required" });

// FIX
return res.json({ success: false, message: "All fields are required" });
```

**Status:** [ ] Fixed

---

### B2. `comapanyController.js:57-59` — Crash on Invalid Login Email

**Files:** `server/controller/comapanyController.js`
**Lines:** 57-59

`loginCompany` calls `bcrypt.compare(password, company.password)` without checking if `Company.findOne()` returned null. A login with a non-existent email crashes the server with `TypeError: Cannot read properties of null`.

```js
// WRONG (line 57)
const company = await Company.findOne({ email });
if (await bcrypt.compare(password, company.password)) { ... }

// FIX
const company = await Company.findOne({ email });
if (!company) {
  return res.json({ success: false, message: "Invalid email or password" });
}
if (await bcrypt.compare(password, company.password)) { ... }
```

**Status:** [ ] Fixed

---

### B3. `jobController.js:285` — Tautology in `recommend-feed` Skill Matching

**Files:** `server/controller/jobController.js`
**Line:** 285 (inside recommend-feed content branch)

A field compared to itself is ALWAYS true. `skillMatch` is perpetually `1 × 0.15 = 0.15` for every job — zero differentiation.

```js
// WRONG
{ $cond: [{ $eq: ["$category", "$category"] }, 1, 0.5] }

// FIX: Remove skillMatch entirely or pass user preferences as a variable
// For the hybrid feed path, just redistribute the 0.15 weight:
// score = vectorScore(0.65) + recencyBoost(0.25) + salaryMatch(0.10)
```

**Status:** [ ] Fixed

---

### B4. `jobController.js:286` — Salary Match Always 1

**Files:** `server/controller/jobController.js`
**Line:** 286 (inside recommend-feed content branch)

Salary is always >= 0 for valid jobs. This term adds zero differentiation to the score.

```js
// WRONG
{ $cond: [{ $gte: ["$salary", 0] }, 1, 0] }

// FIX: Remove salaryMatch term and redistribute weight, OR implement meaningful comparison
// Option A: Compare to user's expected salary if user model had that field
// Option B: Normalize salary within range of all visible jobs
```

**Status:** [ ] Fixed

---

### B5. `comapanyController.js:200-206` — Crash on Invalid Job ID in `changeVisiblity`

**Files:** `server/controller/comapanyController.js`
**Lines:** 200-206

`Job.findById(id)` can return null, then `companyID.toString() === job.companyId.toString()` crashes.

```js
// FIX: Add null check
const job = await Job.findById(id);
if (!job) {
  return res.json({ success: false, message: "Job not found" });
}
if (companyID.toString() === job.companyId.toString()) { ... }
```

**Status:** [ ] Fixed

---

### B6. `userController.js:99-100` — Crash When User Not in DB (updateUserResume)

**Files:** `server/controller/userController.js`
**Lines:** 99-100

`updateUserResume` calls `User.findById(userId)` which may return null (Clerk user exists but DB entry missing), then crashes on `userData.resume = ...`.

```js
// FIX: Add null check
const userData = await User.findById(userId);
if (!userData) {
  return res.json({ success: false, message: "User not found" });
}
```

**Status:** [ ] Fixed

---

### B7. `userController.js:77-79` — Dead-Code Condition

**Files:** `server/controller/userController.js`
**Lines:** 77-79

`if (!applications)` is never true — Mongoose `.find()` always returns an array (possibly empty), never null. The error branch is unreachable.

```js
// WRONG
if (!applications) {
  return res.json({ success: false, message: "No applications found..." });
}

// FIX
if (applications.length === 0) {
  return res.json({ success: true, applications: [] });
}
```

**Status:** [ ] Fixed

---

## HIGH — Security & Robustness

### S1. Error Message Leakage (All Controllers)

**Files:** All files in `server/controller/`

Every controller returns `error.message` directly to the client. This exposes internal stack traces, DB queries, and OpenAI API errors to end users.

```js
// WRONG (every catch block)
catch (error) {
  res.json({ success: false, message: error.message });
}

// FIX
catch (error) {
  console.error("Handler error:", error);
  res.json({ success: false, message: "An unexpected error occurred" });
}
```

**Status:** [ ] Fixed

---

### S2. No Input Validation Library

**Files:** All controllers accepting `req.body`

No validation library (Joi, Zod, express-validator) is used. `req.body` fields are consumed directly:
- `postJob` accepts raw HTML in `description` (XSS risk via `dangerouslySetInnerHTML` on frontend)
- `updateUserPreferences` validates `preferences` is an array but not element types
- No length limits on strings, no email format validation

**Recommendation:** Add `zod` (already in codebase conventions) and validate all request bodies.

**Status:** [ ] Fixed

---

### S3. `config/instrument.js:4` — Hardcoded Sentry DSN

**Files:** `server/config/instrument.js`
**Line:** 4

```js
// WRONG
dsn: "https://af49cd78e34e869e5c3fcd47018a17dc@o4508646666141696.ingest.us.sentry.io/4508646670663680"

// FIX
dsn: process.env.SENTRY_DSN
```

**Status:** [ ] Fixed

---

### S4. `server.js:30-32` — Debug Endpoint in Production

**Files:** `server/server.js`
**Lines:** 30-32

`/debug-sentry` throws an intentional error. Should be gated behind `NODE_ENV !== 'production'`.

**Status:** [ ] Fixed

---

### S5. `webhooks.js:9,13` — Wrong HTTP Status Codes for Clerk Webhooks

**Files:** `server/controller/webhooks.js`
**Lines:** 9, 13

Uses `res.status(400)` for missing body/data, but Clerk will retry non-200 responses. Webhook verification should return 200 for all outcomes or Clerk will keep retrying.

```js
// Current: res.status(400) and res.status(500) in catch
// Clerk expects 200 for all acknowledged webhooks
```

**Status:** [ ] Fixed

---

## MEDIUM — Performance & Scalability

### P1. `comapanyController.js:154-161` — N+1 Query Anti-Pattern

**Files:** `server/controller/comapanyController.js`
**Lines:** 154-161

`getCompanyPostedJobs` loops over each job and queries `JobApplication.find()` individually. With N jobs, this is N+1 queries.

**Fix:** Use `$lookup` aggregation or `JobApplication.countDocuments({ jobId: { $in: jobIds } })` with a group.

**Status:** [ ] Fixed

---

### P2. `getRecommendFeed` — Duplicate Collaborative Filtering Pipeline

**Files:** `server/controller/jobController.js`
**Lines:** 371-438 (inline IIFE) duplicates 55-207 (`getCollaborativeJobs`)

The inline IIFE in `recommend-feed` duplicates ~90% of `getCollaborativeJobs`. If you fix a bug in one, you must fix the other.

**Fix:** Extract collaborative filtering into a shared function:

```js
async function getCollaborativeResults(userId, excludedJobIds, limit = 20) { ... }
```

Then call it from both `getCollaborativeJobs` and `getRecommendFeed`.

**Status:** [ ] Fixed

---

### P3. `getRecommendContent` — Duplicate `$match: { _id: { $nin: allExcluded } }`

**Files:** `server/controller/jobController.js`
**Lines:** After `$vectorSearch` stage (stage 2) and before `$sort` (stage 6)

Stage 2 and stage 6 both exclude seen jobs. Stage 6 is redundant after stage 2.

**Status:** [ ] Fixed

---

### P4. `getRecommendContent` — `allExcluded` Grows Unbounded

**Files:** `server/controller/jobController.js`
**Lines:** ~250-255

Every call fetches ALL seen events for the user (views + bookmarks + applies). This array will grow unbounded over time and eventually exceed MongoDB's 16MB document limit when passed to `$nin`.

**Fix:** Cap `seenJobIds` to the last N events (e.g., 500), or use a separate `exclude` list from the frontend with a reasonable limit.

**Status:** [ ] Fixed

---

### P5. `getRecommendFeed` Popular Fallback — Empty Results Risk

**Files:** `server/controller/jobController.js`
**Lines:** ~460

Filters jobs by `date: { $gte: now - thirtyDaysMs }` — for a dataset of 36 jobs where some are older than 30 days, this may return 0 results. No fallback below this tier.

**Fix:** Remove the date filter for the popular fallback, or broaden to 60-90 days.

**Status:** [ ] Fixed

---

## LOW — Code Quality & Technical Debt

### Q1. `server.js:3-4` — Double Dotenv Import

**Files:** `server/server.js`
**Lines:** 3-4

```js
import dotenv from "dotenv";   // Unused — remove
import 'dotenv/config'          // Keep this one (ESM side-effect import)
```

**Status:** [ ] Fixed

---

### Q2. `server.js:28` — Sentry Error Handler Placement

**Files:** `server/server.js`
**Line:** 28

`Sentry.setupExpressErrorHandler(app)` is called BEFORE routes are mounted. Sentry recommends placing it AFTER all routes/controllers but BEFORE other error-handling middleware.

**Fix:** Move the Sentry error handler to after all `app.use()` route mounts.

**Status:** [ ] Fixed

---

### Q3. `seedData.js:24-26` — Unused Dead Code

**Files:** `server/scripts/seedData.js`
**Lines:** 24-26

`normalizeSlug()` is defined but never called anywhere in the codebase.

**Status:** [ ] Fixed

---

### Q4. `embeddingService.js:45-51` — Unused Exports

**Files:** `server/services/embeddingService.js`
**Lines:** 45-51

`clearEmbeddingCache()` and `getCacheSize()` are exported but never called in any route, controller, or script.

**Action:** Either remove or add calls in appropriate places (e.g., admin endpoint, health check).

**Status:** [ ] Fixed

---

### Q5. `UserEvent` — No Compound Index for Deduplication Query

**Files:** `server/models/UserEvent.js`

`logUserEvent` queries `{ userId, jobId, eventType, timestamp }` for view dedup. The existing indexes are `{ userId: 1, timestamp: -1 }`, `{ jobId: 1 }`, `{ eventType: 1 }`. A compound index `{ userId: 1, jobId: 1, eventType: 1, timestamp: -1 }` would cover this query precisely.

**Status:** [ ] Fixed

---

### Q6. `Job` Model — `embedding` Has No Dimension Validation

**Files:** `server/models/Job.js`

The schema accepts any number array: `embedding: { type: [Number], default: [] }`. An empty array (no embedding) and a 3072d vector are indistinguishable at the schema level.

**Fix:** Add `validate`:

```js
embedding: {
  type: [Number],
  default: [],
  validate: {
    validator: v => v.length === 0 || v.length === 3072,
    message: "Embedding must be 0 or 3072 dimensions"
  }
}
```

**Status:** [ ] Fixed

---

### Q7. `UserEvent` — `timestamp` is Number, not Date

**Files:** `server/models/UserEvent.js`

All timestamps are `Number` (epoch ms) instead of MongoDB `Date` type. This works but loses MongoDB's native date querying, TTL index support, and reduces readability.

**Decision:** Low priority for hackathon. Only fix if time permits.

**Status:** [ ] Fixed

---

### Q8. `comapanyController.js` — File Name Typo

**Files:** `server/controller/comapanyController.js`

The file is named `comapany` (missing 'n'). This is purely cosmetic but confusing for new developers. The `companyRoutes.js` import already references this filename correctly, so renaming requires updating the import too.

**Status:** [ ] Fixed

---

### Q9. `config/multer.js` — No File Size Limit, No Type Validation

**Files:** `server/config/multer.js`

Multer is configured with `diskStorage({})` (no destination, no filename configuration). Files go to OS temp with random names. No `limits.fileSize`, no `fileFilter`.

**Fix:**

```js
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "application/pdf"];
    cb(null, allowed.includes(file.mimetype));
  }
});
```

**Status:** [ ] Fixed

---

## Fix Priority Order

| Priority | ID | Task | Est. Time |
|----------|----|------|-----------|
| 1 | B1 | Fix `sucess` → `success` typo | 1 min |
| 2 | B2 | Fix `loginCompany` null crash | 2 min |
| 3 | B5 | Fix `changeVisiblity` null crash | 2 min |
| 4 | B6 | Fix `updateUserResume` null crash | 2 min |
| 5 | B3 | Fix `recommend-feed` skillMatch tautology | 5 min |
| 6 | B4 | Fix `recommend-feed` salaryMatch always-1 | 5 min |
| 7 | B7 | Fix dead-code applications check | 2 min |
| 8 | S1 | Sanitize error messages (all controllers) | 15 min |
| 9 | P4 | Cap `allExcluded` to prevent unbounded growth | 10 min |
| 10 | P2 | DRY collaborative filtering pipeline | 20 min |
| 11 | P3 | Remove duplicate `$match: { _id: { $nin } }` | 2 min |
| 12 | P5 | Fix popular fallback empty results | 5 min |
| 13 | S3 | Move Sentry DSN to env var | 3 min |
| 14 | S4 | Gate debug-sentry behind NODE_ENV | 2 min |
| 15 | Q1 | Remove double dotenv import | 1 min |
| 16 | Q2 | Move Sentry handler after routes | 1 min |
| 17 | Q3 | Remove `normalizeSlug` dead code | 1 min |
| 18 | Q5 | Add compound index for event dedup | 5 min |
| 19 | Q6 | Add embedding dimension validation | 3 min |
| 20 | Q9 | Add Multer file size/type limits | 5 min |

**Total estimated fix time:** ~90 minutes
